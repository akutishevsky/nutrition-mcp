import {
    getSupabase,
    exportArchivePath,
    getAllMeals,
    getAllWater,
    getAllWeight,
    getAllBodyMeasurements,
    getAllOAuthGrants,
    getAllToolAnalytics,
    getAuthAccount,
    getNutritionGoals,
    getProfile,
    timezoneFromProfile,
    type BodyMeasurementEntry,
    type Meal,
    type NutritionGoals,
    type OAuthGrantRow,
    type Profile,
    type ToolAnalyticsRow,
    type WaterEntry,
    type WeightEntry,
} from "./supabase.js";
import type { User } from "@supabase/supabase-js";
import { formatLocalDateTime } from "./tz.js";
import { fromGrams, isWeightUnit, type WeightUnit } from "./units.js";
import { buildZip, type ZipEntry } from "./zip.js";

const EXPORT_BUCKET = "exports";
// Signed link lifetime. The cleanup sweep ages files out on the same horizon.
const EXPORT_TTL_SECONDS = 60 * 60; // 60 minutes
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

/**
 * Column order for the export. This list and the positional row builder in
 * `buildMealsCsv` are parallel arrays: adding a column here without adding the
 * matching `csvEscape(...)` at the same index silently shifts every later field
 * in every row. `src/export.test.ts` guards the alignment — keep it that way.
 *
 * Header names deliberately match the importer's column aliases (`protein_g`,
 * `carbs_g`, `fiber_g`, …) so an export can be re-imported without remapping.
 */
const CSV_COLUMNS = [
    "id",
    "logged_at",
    "timezone",
    "meal_type",
    "description",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    // Milligrams, and the header says so. Every other nutrient column here is
    // grams, so a bare "caffeine" header is exactly how a re-import — ours or
    // anyone else's — turns 180 mg into 180 g.
    "caffeine_mg",
    "notes",
] as const;

/**
 * Quote a CSV field only when it contains a delimiter, quote, or newline.
 *
 * Booleans are in the union for profile.csv's toggles. The `== null` guard is
 * loose about null/undefined only, so `false` renders as the word and not as an
 * empty cell — an empty cell in this file means "never set", which is a
 * different fact from "set to off".
 */
function csvEscape(
    value: string | number | boolean | null | undefined,
): string {
    if (value == null) return "";
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/** A nullable timestamp as a local wall clock in `tz`, or null (empty cell). */
function localOrNull(
    instant: string | null | undefined,
    tz: string,
): string | null {
    return instant ? formatLocalDateTime(instant, tz) : null;
}

/**
 * csvEscape for text a third party chose — an OAuth client's registered name
 * and redirect, the name and session id an MCP client reports. A spreadsheet
 * runs a cell starting with = + - @ as a formula, so a client the user once
 * authorized could plant one in their export; a leading apostrophe makes it
 * text. Not used for the user's own logs: meals.csv must stay importable and
 * byte-identical.
 */
function csvThirdParty(value: string | null | undefined): string {
    if (value != null && /^[=+\-@\t\r]/.test(value)) value = `'${value}`;
    return csvEscape(value);
}

/**
 * Build a CSV from meals. `logged_at` is rendered in `tz` (the user's timezone,
 * or "UTC" when none is set), and the `timezone` column records which zone the
 * timestamp is expressed in so the file is self-describing.
 */
export function buildMealsCsv(meals: Meal[], tz: string): string {
    const rows = [CSV_COLUMNS.join(",")];
    for (const m of meals) {
        rows.push(
            [
                csvEscape(m.id),
                csvEscape(formatLocalDateTime(m.logged_at, tz)),
                csvEscape(tz),
                csvEscape(m.meal_type),
                csvEscape(m.description),
                csvEscape(m.calories),
                csvEscape(m.protein_g),
                csvEscape(m.carbs_g),
                csvEscape(m.fat_g),
                csvEscape(m.fiber_g),
                csvEscape(m.sugar_g),
                csvEscape(m.alcohol_g),
                csvEscape(m.caffeine_mg),
                csvEscape(m.notes),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for water.csv. Same parallel-array contract as CSV_COLUMNS
 * above: this list and the positional row builder below must be edited
 * together, or an inserted column silently shifts every later field.
 *
 * The unit rides in the header (`amount_ml`) for the same reason `caffeine_mg`
 * does — a bare "amount" leaves whoever reads this file back guessing between
 * millilitres, litres and ounces.
 */
const WATER_CSV_COLUMNS = [
    "id",
    "logged_at",
    "timezone",
    "amount_ml",
    "notes",
    // When the entry was written, as opposed to the moment it is logged for
    // (a backdated glass differs). Appended, never inserted, so a reader that
    // mapped the earlier columns by position keeps working.
    "created_at",
] as const;

/** Build a CSV from water entries, timestamps rendered in `tz`. */
export function buildWaterCsv(entries: WaterEntry[], tz: string): string {
    const rows = [WATER_CSV_COLUMNS.join(",")];
    for (const e of entries) {
        rows.push(
            [
                csvEscape(e.id),
                csvEscape(formatLocalDateTime(e.logged_at, tz)),
                // The zone travels next to the wall clock in every file. An
                // offset-less timestamp with no zone beside it re-resolves
                // against whatever timezone the account has later — #97.
                csvEscape(tz),
                csvEscape(e.amount_ml),
                csvEscape(e.notes),
                csvEscape(localOrNull(e.created_at, tz)),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for weight.csv. Parallel array with the row builder below.
 *
 * Three weight columns rather than one: `weight_g` is what the DB actually
 * stores (canonical integer grams), and it is unreadable — nobody keeps a
 * weight log in grams. `weight_display` is the same number through `fromGrams`
 * in the user's preferred unit and `weight_unit` names that unit, so the
 * readable column can never be read as the wrong unit.
 */
const WEIGHT_CSV_COLUMNS = [
    "id",
    "logged_at",
    "timezone",
    "weight_g",
    "weight_display",
    "weight_unit",
    "notes",
    // When the weigh-in was written; see the same column in water.csv.
    "created_at",
] as const;

/**
 * Build a CSV from weight entries. `unit` is the display unit for
 * `weight_display`; callers coalesce a never-chosen preference to "kg" (this is
 * a display path, so guessing is safe here in a way it never is on a write).
 */
export function buildWeightCsv(
    entries: WeightEntry[],
    tz: string,
    unit: WeightUnit,
): string {
    const rows = [WEIGHT_CSV_COLUMNS.join(",")];
    for (const e of entries) {
        rows.push(
            [
                csvEscape(e.id),
                csvEscape(formatLocalDateTime(e.logged_at, tz)),
                csvEscape(tz),
                csvEscape(e.weight_g),
                csvEscape(fromGrams(e.weight_g, unit)),
                csvEscape(unit),
                csvEscape(e.notes),
                csvEscape(localOrNull(e.created_at, tz)),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for body_measurements.csv. Parallel array with the row builder
 * below.
 *
 * value_mm is what is stored; value_entered + entered_unit is what the user
 * typed, which is already readable, so there is no preference-based display
 * column (unlike weight_display).
 */
const BODY_MEASUREMENT_CSV_COLUMNS = [
    "id",
    "logged_at",
    // The zone logged_at is rendered in, so an offset-less wall clock never
    // re-resolves against a later account timezone (#97).
    "timezone",
    "kind",
    "value_mm",
    "value_entered",
    "entered_unit",
    "notes",
    // When the entry was written; see the same column in water.csv.
    "created_at",
] as const;

/**
 * Build body_measurements.csv. Emits its header even with zero rows, like
 * every other file in the archive.
 */
export function buildBodyMeasurementsCsv(
    entries: BodyMeasurementEntry[],
    tz: string,
): string {
    const rows = [BODY_MEASUREMENT_CSV_COLUMNS.join(",")];
    for (const e of entries) {
        rows.push(
            [
                csvEscape(e.id),
                csvEscape(formatLocalDateTime(e.logged_at, tz)),
                csvEscape(tz),
                csvEscape(e.kind),
                csvEscape(e.value_mm),
                // As typed: the numeric column may come back as a string, and
                // either way it is written through untouched.
                csvEscape(e.value_entered),
                csvEscape(e.entered_unit),
                csvEscape(e.notes),
                csvEscape(localOrNull(e.created_at, tz)),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for goals.csv. Parallel array with the row builder below.
 *
 * `daily_caffeine_mg` is milligrams while its neighbours are grams, and
 * `daily_water_ml` millilitres, and `target_weight_g` canonical grams — the
 * unit is in the name at every layer for the same reason it is in meals.csv.
 */
const GOALS_CSV_COLUMNS = [
    "daily_calories",
    "daily_protein_g",
    "daily_carbs_g",
    "daily_fat_g",
    "daily_fiber_g",
    "daily_sugar_g",
    // Emitted unconditionally, NOT gated on the account's
    // alcohol_tracking_enabled preference. That opt-in governs *display* — what
    // the tools and widgets surface — while the export promises to hand back
    // everything that was ever logged. Withholding a goal the user set because
    // they later hid the row would make the archive an incomplete copy of their
    // data, which is the one thing it must not be.
    "daily_alcohol_g",
    "daily_caffeine_mg",
    "daily_water_ml",
    "target_weight_g",
    "updated_at",
    "timezone",
] as const;

/**
 * Build goals.csv. A null record still emits the header row: every archive
 * contains every file with all its headers, so whatever reads it can map
 * columns without first discovering which files happen to exist this time.
 */
export function buildGoalsCsv(
    goals: NutritionGoals | null,
    tz: string,
): string {
    const rows = [GOALS_CSV_COLUMNS.join(",")];
    if (goals) {
        rows.push(
            [
                csvEscape(goals.daily_calories),
                csvEscape(goals.daily_protein_g),
                csvEscape(goals.daily_carbs_g),
                csvEscape(goals.daily_fat_g),
                csvEscape(goals.daily_fiber_g),
                csvEscape(goals.daily_sugar_g),
                csvEscape(goals.daily_alcohol_g),
                csvEscape(goals.daily_caffeine_mg),
                csvEscape(goals.daily_water_ml),
                csvEscape(goals.target_weight_g),
                csvEscape(formatLocalDateTime(goals.updated_at, tz)),
                csvEscape(tz),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for profile.csv. Parallel array with the row builder below.
 */
const PROFILE_CSV_COLUMNS = [
    "timezone",
    "preferred_weight_unit",
    "preferred_drink_unit",
    "alcohol_tracking_enabled",
    "widgets_enabled",
    // Raw, not defaulted: empty means set_language never ran (widgets use English).
    "locale",
    "created_at",
    "updated_at",
    // Raw: empty means set_length_unit never ran; never derived from the
    // weight unit. Appended last so every earlier column keeps its position.
    "preferred_length_unit",
] as const;

/**
 * Build profile.csv. Header-only when the account has no profile row.
 *
 * The `timezone` column carries `tz` — the zone `created_at`/`updated_at` are
 * rendered in — rather than the raw `profile.timezone` column. The two differ
 * only when the user never ran set_timezone, and in that case "UTC" is both
 * what the timestamps here are expressed in and what every read path in the
 * server already assumes. README.txt is where the archive says whether that UTC
 * was chosen or defaulted; a bare empty cell here would leave the two
 * timestamps beside it with no zone at all.
 */
export function buildProfileCsv(profile: Profile | null, tz: string): string {
    const rows = [PROFILE_CSV_COLUMNS.join(",")];
    if (profile) {
        rows.push(
            [
                csvEscape(tz),
                csvEscape(profile.preferred_weight_unit),
                csvEscape(profile.preferred_drink_unit),
                csvEscape(profile.alcohol_tracking_enabled),
                csvEscape(profile.widgets_enabled),
                csvEscape(profile.locale),
                csvEscape(formatLocalDateTime(profile.created_at, tz)),
                csvEscape(formatLocalDateTime(profile.updated_at, tz)),
                csvEscape(profile.preferred_length_unit),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for account.csv. Parallel array with the row builder below.
 *
 * One `account` row, then one `identity` row per sign-in method linked to the
 * account (email/password, Google). The account row's profile claims come
 * from the account's user metadata; an identity row's from what that provider
 * sent. Google accounts created before 2026-09-27 still hold a name and a
 * picture URL there, which the privacy policy discloses — so they are
 * exported, not filtered. There is no password or token column: the Auth
 * admin API never returns a password hash, and nothing here needs a token.
 */
const ACCOUNT_CSV_COLUMNS = [
    "record",
    "user_id",
    "email",
    "created_at",
    "email_confirmed_at",
    "last_sign_in_at",
    "timezone",
    "sign_in_methods",
    "provider",
    "provider_account_id",
    "name",
    "full_name",
    "picture",
    "avatar_url",
] as const;

/** A profile claim as text, or null when absent or not a plain value. */
function claim(
    source: Record<string, unknown> | undefined,
    key: string,
): string | null {
    const v = source?.[key];
    return typeof v === "string" || typeof v === "number" ? String(v) : null;
}

function signInMethods(user: User): string {
    const listed = user.app_metadata?.providers;
    const methods = Array.isArray(listed)
        ? listed.map(String)
        : [
              ...(user.app_metadata?.provider
                  ? [String(user.app_metadata.provider)]
                  : []),
              ...(user.identities ?? []).map((i) => i.provider),
          ];
    return [...new Set(methods)].join(";");
}

/**
 * Build account.csv from the Supabase Auth record. Header-only when Auth has
 * no user for this id.
 */
export function buildAccountCsv(user: User | null, tz: string): string {
    const rows = [ACCOUNT_CSV_COLUMNS.join(",")];
    if (!user) return rows.join("\n");
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    rows.push(
        [
            csvEscape("account"),
            csvEscape(user.id),
            csvEscape(user.email),
            csvEscape(localOrNull(user.created_at, tz)),
            csvEscape(localOrNull(user.email_confirmed_at, tz)),
            csvEscape(localOrNull(user.last_sign_in_at, tz)),
            csvEscape(tz),
            csvEscape(signInMethods(user)),
            csvEscape(null),
            csvEscape(null),
            csvEscape(claim(meta, "name")),
            csvEscape(claim(meta, "full_name")),
            csvEscape(claim(meta, "picture")),
            csvEscape(claim(meta, "avatar_url")),
        ].join(","),
    );
    for (const identity of user.identities ?? []) {
        const data = identity.identity_data as
            Record<string, unknown> | undefined;
        rows.push(
            [
                csvEscape("identity"),
                csvEscape(user.id),
                csvEscape(claim(data, "email")),
                csvEscape(localOrNull(identity.created_at, tz)),
                csvEscape(null),
                csvEscape(localOrNull(identity.last_sign_in_at, tz)),
                csvEscape(tz),
                csvEscape(null),
                csvEscape(identity.provider),
                // The provider's own id for you (Google's account id; for
                // email sign-in, the account id again).
                csvEscape(identity.id),
                csvEscape(claim(data, "name")),
                csvEscape(claim(data, "full_name")),
                csvEscape(claim(data, "picture")),
                csvEscape(claim(data, "avatar_url")),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for telemetry.csv. Parallel array with the row builder below.
 * Every tool_analytics column except user_id, which is the account id on
 * every row (account.csv already carries it).
 */
const TELEMETRY_CSV_COLUMNS = [
    "id",
    "invoked_at",
    "timezone",
    "tool_name",
    "success",
    "duration_ms",
    "error_category",
    "date_range_days",
    "mcp_session_id",
    "protocol_era",
    "client_name",
    "created_at",
] as const;

/** Build telemetry.csv: one row per recorded tool call, oldest first. */
export function buildTelemetryCsv(
    rows: ToolAnalyticsRow[],
    tz: string,
): string {
    const out = [TELEMETRY_CSV_COLUMNS.join(",")];
    for (const r of rows) {
        out.push(
            [
                csvEscape(r.id),
                csvEscape(localOrNull(r.invoked_at, tz)),
                csvEscape(tz),
                csvEscape(r.tool_name),
                csvEscape(r.success),
                csvEscape(r.duration_ms),
                csvEscape(r.error_category),
                csvEscape(r.date_range_days),
                csvThirdParty(r.mcp_session_id),
                csvEscape(r.protocol_era),
                csvThirdParty(r.client_name),
                csvEscape(localOrNull(r.created_at, tz)),
            ].join(","),
        );
    }
    return out.join("\n");
}

/**
 * Column order for connections.csv. Parallel array with the row builder
 * below. No token, code, hash or PKCE column, by design: those are stored
 * only as hashes of secrets, and the export is a copy of your data, not a set
 * of credentials.
 */
const CONNECTIONS_CSV_COLUMNS = [
    "kind",
    "client_id",
    "client_name",
    "redirect_uri",
    "created_at",
    "expires_at",
    "timezone",
] as const;

/** Build connections.csv: every stored OAuth grant for the account. */
export function buildConnectionsCsv(
    grants: OAuthGrantRow[],
    tz: string,
): string {
    const out = [CONNECTIONS_CSV_COLUMNS.join(",")];
    for (const g of grants) {
        out.push(
            [
                csvEscape(g.kind),
                csvEscape(g.client_id),
                csvThirdParty(g.client_name),
                csvThirdParty(g.redirect_uri),
                csvEscape(localOrNull(g.created_at, tz)),
                csvEscape(localOrNull(g.expires_at, tz)),
                csvEscape(tz),
            ].join(","),
        );
    }
    return out.join("\n");
}

/**
 * The archive's contents, in order. Exported so callers that describe the
 * export to a human — the tool's response text, the site copy and its test —
 * pin their claim to this list instead of restating it and drifting from it.
 */
export const EXPORT_ARCHIVE_FILES = [
    "meals.csv",
    "water.csv",
    "weight.csv",
    "body_measurements.csv",
    "goals.csv",
    "profile.csv",
    "account.csv",
    "telemetry.csv",
    "connections.csv",
    "README.txt",
] as const;

type ExportArchiveFile = (typeof EXPORT_ARCHIVE_FILES)[number];

/**
 * The plain-text README shipped inside the archive. It is the first thing a
 * human opens, so it answers the questions the CSVs cannot: which zone the wall
 * clocks are in and whether that zone was actually chosen, which columns are in
 * milligrams rather than grams, and which of these files can be fed back in.
 */
export function buildExportReadme(opts: {
    generatedAt: Date;
    tz: string;
    tzConfigured: boolean;
    weightUnit: WeightUnit;
    counts: ExportCounts;
}): string {
    const { generatedAt, tz, tzConfigured, weightUnit, counts } = opts;
    const rows = (n: number) => `${n} row${n === 1 ? "" : "s"}`;

    // Stated outright rather than left to inference: an unconfigured timezone
    // silently means UTC everywhere in this server, and someone reading their
    // own wall clocks back needs to know whether the times they are looking at
    // are theirs or UTC's before they interpret a single one of them.
    const tzNote = tzConfigured
        ? `Every timestamp in this archive is a local wall clock in ${tz}, the timezone set on your account. Each file repeats it in a "timezone" column so no file has to be read next to this one.`
        : `No timezone has ever been set on this account, so every timestamp in this archive is expressed in UTC (that is also what the server assumes when it buckets your days). Set one with set_timezone and export again if you want your own wall clock. Each file repeats the zone in a "timezone" column.`;

    return [
        "Nutrition MCP — full data export",
        "================================",
        "",
        `Generated ${formatLocalDateTime(generatedAt, tz)} (${tz}).`,
        "",
        tzNote,
        "",
        "Files",
        "-----",
        `meals.csv    ${rows(counts.meals)} — every meal you have logged: time, description, calories and macros.`,
        `water.csv    ${rows(counts.water)} — every water entry, in millilitres.`,
        `weight.csv   ${rows(counts.weight)} — every weigh-in, as stored grams and as ${weightUnit}.`,
        `body_measurements.csv ${rows(counts.bodyMeasurements)} — every body measurement (waist, hips, neck, chest, shoulders, upper arm, forearm, thigh, calf): the stored millimetres, and the value exactly as entered with its unit (cm or in).`,
        "goals.csv    your current daily targets — one row, or a header alone if you have never set goals.",
        "profile.csv  your settings: timezone, preferred weight, length and drink units (empty preferred_length_unit = never chosen), display toggles and widget language — one row, or a header alone if you have no profile yet. An empty locale means no widget language was ever chosen, so widgets use English.",
        'account.csv  your sign-in account: one "account" row (account id, email address, when the account was created, when the email was confirmed, last sign-in, sign-in methods) and one "identity" row per sign-in method (the provider, the provider\'s id for you, and any name or picture it sent — Google accounts created before September 27, 2026 may still hold them).',
        `telemetry.csv ${rows(counts.telemetry)} — one per tool call your AI app made: which tool, when, whether it succeeded, how long it took, the error category if it failed, the date-range length asked for, the MCP session id, the protocol revision and the app name it reported. None of it contains what you logged.`,
        `connections.csv ${rows(counts.connections)} — the sign-in grants that keep your AI apps connected: each access token, refresh token and pending authorization code, with the app it was issued to where recorded, when it was issued and when it expires. The tokens themselves are not included — we store them only as one-way hashes. Access tokens do not record which app they belong to, so their client columns are empty.`,
        "README.txt   this file.",
        "",
        "Units",
        "-----",
        "The unit is part of every column name, because these columns do not all agree:",
        "  * _g columns are grams; alcohol_g and daily_alcohol_g are grams of pure ethanol, not the volume of the drink.",
        "  * caffeine_mg and daily_caffeine_mg are MILLIGRAMS, unlike every gram column beside them. A cup of coffee is about 95 mg.",
        "  * amount_ml and daily_water_ml are millilitres.",
        `  * weight_g and target_weight_g are grams — the canonical form the server stores. weight.csv also gives weight_display in ${weightUnit}, with weight_unit naming it, so you do not have to divide anything by hand.`,
        "  * value_mm is millimetres, the canonical stored form; value_entered is the number as typed, in entered_unit.",
        "  * calories are kcal.",
        "An empty cell means nothing was ever recorded there. It does not mean zero — a meal logged before caffeine tracking existed has an empty caffeine_mg, not a 0.",
        "",
        "Re-importing",
        "------------",
        "Only meals.csv can be read back in. Hand it to start_meal_import (which parses it in your browser) or to bulk_import_meals; its column names are exactly the ones the importer expects, and re-importing the same file twice is a no-op rather than a set of duplicates.",
        "Every other file is export-only — there is no import path for water, weight, body measurements, goals, profile, account, telemetry or connections, so keep this archive if you want that history back.",
        "",
        "Not in this archive",
        "-------------------",
        "This archive holds everything the service stores about you. What is not in it:",
        "  * the server runtime log — a short rolling buffer of requests that does not contain your account id or email, so it cannot be looked up by account;",
        "  * our providers' own short-lived operational logs (including the sign-in provider's audit records) and their rolling backups, which age out on their own schedule;",
        "  * values kept only as one-way hashes for security: your password (held by the sign-in provider, which never returns it) and your tokens and sign-in codes;",
        "  * internal bookkeeping: the de-duplication keys stored beside meals, water, weight and body measurement entries, and the PKCE challenge of a pending sign-in;",
        "  * a sign-in session record at our sign-in provider (IP address and browser), if one was ever left behind after sign-in; it is deleted with your account.",
        "",
    ].join("\n");
}

export interface ExportCounts {
    meals: number;
    water: number;
    weight: number;
    bodyMeasurements: number;
    telemetry: number;
    connections: number;
}

export interface FullExportResult {
    counts: ExportCounts;
    goals: boolean;
    profile: boolean;
    account: boolean;
    /** Absent only when the account has nothing at all to export. */
    url?: string;
}

/**
 * Build the whole-account archive — every log (meals, water, weight and body
 * measurements), the goals, the profile, the
 * Auth account, the tool telemetry and the OAuth grants —
 * upload it to the private `exports` bucket under a fixed per-user path (so
 * each export overwrites the previous one), and return a signed download link
 * valid for EXPORT_TTL_SECONDS. This is the only export path: a meals-only CSV
 * tool used to sit beside it, and the archive absorbed it, which is why
 * `buildMealsCsv` still emits exactly the columns the importer reads.
 */
export async function exportAllData(userId: string): Promise<FullExportResult> {
    // One round of independent queries rather than each awaited in turn: an
    // account with years of history pages through meals, water, weight and
    // telemetry, and serialising those pushes the tool past the point where a
    // host gives up on it.
    const [
        meals,
        water,
        weight,
        bodyMeasurements,
        goals,
        profile,
        account,
        telemetry,
        connections,
    ] = await Promise.all([
        getAllMeals(userId),
        getAllWater(userId),
        getAllWeight(userId),
        getAllBodyMeasurements(userId),
        getNutritionGoals(userId),
        getProfile(userId),
        getAuthAccount(userId),
        getAllToolAnalytics(userId),
        getAllOAuthGrants(userId),
    ]);

    const counts: ExportCounts = {
        meals: meals.length,
        water: water.length,
        weight: weight.length,
        bodyMeasurements: bodyMeasurements.length,
        telemetry: telemetry.length,
        connections: connections.length,
    };

    // Both preferences come off the profile row already in hand. The
    // getUserTimezone / getPreferredWeightUnit wrappers each run their own
    // `select * from profiles` (src/supabase.ts says so explicitly), so calling
    // them here would repeat an identical query twice for no new information.
    const configuredTz = timezoneFromProfile(profile);
    const tz = configuredTz ?? "UTC";
    // Display path: coalesce a never-chosen preference to kg rather than
    // refusing, the way pickWriteUnit does for writes. weight_g is beside it
    // and is unambiguous, so a wrong guess here is cosmetic, not lossy.
    const weightUnit: WeightUnit = isWeightUnit(profile?.preferred_weight_unit)
        ? profile.preferred_weight_unit
        : "kg";

    // Nothing stored at all — not even an Auth account: hand back empty
    // counts and no link rather than uploading bare headers and a README. Any
    // data whatsoever — which for a live account always includes account.csv
    // — produces the full archive, so the shape never depends on which tables
    // were empty.
    if (
        Object.values(counts).every((n) => n === 0) &&
        !goals &&
        !profile &&
        !account
    ) {
        return { counts, goals: false, profile: false, account: false };
    }

    const generatedAt = new Date();
    // Keyed by the exported constant, so a file added to the archive without
    // being named in EXPORT_ARCHIVE_FILES (or the reverse) is a type error
    // rather than a README that describes an archive nobody ships.
    const contents: Record<ExportArchiveFile, string> = {
        // The one re-importable file in the archive, and the reason
        // buildMealsCsv is still its own builder: its headers are the
        // importer's column aliases, so a column renamed for the look of it
        // here breaks a re-import silently.
        "meals.csv": buildMealsCsv(meals, tz),
        "water.csv": buildWaterCsv(water, tz),
        "weight.csv": buildWeightCsv(weight, tz, weightUnit),
        "body_measurements.csv": buildBodyMeasurementsCsv(bodyMeasurements, tz),
        "goals.csv": buildGoalsCsv(goals, tz),
        "profile.csv": buildProfileCsv(profile, tz),
        "account.csv": buildAccountCsv(account, tz),
        "telemetry.csv": buildTelemetryCsv(telemetry, tz),
        "connections.csv": buildConnectionsCsv(connections, tz),
        "README.txt": buildExportReadme({
            generatedAt,
            tz,
            tzConfigured: configuredTz !== null,
            weightUnit,
            counts,
        }),
    };
    const entries: ZipEntry[] = EXPORT_ARCHIVE_FILES.map((name) => ({
        name,
        data: contents[name],
    }));
    const archive = buildZip(entries, generatedAt);

    // Fixed per-user path: each export overwrites the last, so a user cannot
    // accumulate archives of their whole history in a bucket the sweep only
    // visits every ten minutes. Shared with deleteAllUserData rather than
    // spelled out twice — the two drifting apart is how a deleted account left
    // its archive behind.
    const path = exportArchivePath(userId);
    const storage = getSupabase().storage.from(EXPORT_BUCKET);

    const { error: uploadErr } = await storage.upload(path, archive, {
        contentType: "application/zip",
        upsert: true,
    });
    if (uploadErr)
        throw new Error(`Failed to upload export: ${uploadErr.message}`);

    const { data, error: signErr } = await storage.createSignedUrl(
        path,
        EXPORT_TTL_SECONDS,
    );
    if (signErr || !data)
        throw new Error(
            `Failed to create download link: ${signErr?.message ?? "unknown error"}`,
        );

    return {
        counts,
        goals: goals !== null,
        profile: profile !== null,
        account: account !== null,
        url: data.signedUrl,
    };
}

/**
 * Delete export files older than the link TTL. Runs as a background sweep so no
 * export file outlives its signed URL by more than one sweep interval, even
 * across server restarts and for users who never export again.
 */
export async function sweepStaleExports(): Promise<void> {
    const storage = getSupabase().storage.from(EXPORT_BUCKET);
    const cutoff = Date.now() - EXPORT_TTL_SECONDS * 1000;

    // Files live under per-user folders, so list the root to enumerate folders,
    // then list each folder to reach the files (with their timestamps).
    const { data: folders, error: rootErr } = await storage.list("", {
        limit: 1000,
    });
    if (rootErr) {
        console.warn("Export sweep: failed to list bucket:", rootErr.message);
        return;
    }
    if (!folders) return;

    const stalePaths: string[] = [];
    for (const folder of folders) {
        const { data: files, error: listErr } = await storage.list(
            folder.name,
            { limit: 1000 },
        );
        if (listErr) {
            // Not the folder name: it is the user id, and the runtime log
            // must not be linkable to an account (privacy policy).
            console.warn(
                "Export sweep: failed to list a user folder:",
                listErr.message,
            );
            continue;
        }
        for (const file of files ?? []) {
            const ts = file.updated_at ?? file.created_at;
            if (ts && new Date(ts).getTime() < cutoff) {
                stalePaths.push(`${folder.name}/${file.name}`);
            }
        }
    }

    if (stalePaths.length === 0) return;
    const { error: removeErr } = await storage.remove(stalePaths);
    if (removeErr) {
        console.warn(
            "Export sweep: failed to remove files:",
            removeErr.message,
        );
        return;
    }
    console.log(`Export sweep: removed ${stalePaths.length} stale file(s).`);
}

let sweepRunning = false;

/** Start the periodic export-cleanup sweep. Call once at server startup. */
export function startExportCleanup(): void {
    setInterval(() => {
        if (sweepRunning) return;
        sweepRunning = true;
        sweepStaleExports().finally(() => {
            sweepRunning = false;
        });
    }, SWEEP_INTERVAL_MS);
}

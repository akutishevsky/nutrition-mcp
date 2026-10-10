import {
    getSupabase,
    exportArchivePath,
    getAllMeals,
    getAllMealItems,
    getAllSavedMeals,
    getAllSavedMealItems,
    getAllWater,
    getAllWeight,
    getAllBodyMeasurements,
    getAllOAuthGrants,
    getAllToolAnalytics,
    getAuthAccount,
    getNutritionGoals,
    getNutritionGoalsHistory,
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
import type { NutritionGoalsHistoryRow } from "./goals-history.js";
import {
    HEALTH_SYNC_CLIENT_ID,
    HEALTH_SYNC_FIELDS,
    HEALTH_SYNC_RETENTION_DAYS,
} from "./health-sync.js";
import {
    createSupabaseHealthSyncStore,
    type HealthSyncDayRow,
    type HealthSyncLinkStatus,
    type HealthSyncStore,
} from "./health-sync-store.js";
import {
    PROVENANCE_EXPORT_VERSION,
    type NutrientSources,
    type SourceDetail,
} from "./provenance.js";
import { formatLocalDateTime, validateTz } from "./tz.js";
import { fromGrams, isWeightUnit, type WeightUnit } from "./units.js";
import { buildZip, type ZipEntry } from "./zip.js";

const EXPORT_BUCKET = "exports";
// Signed link lifetime. The cleanup sweep ages files out on the same horizon.
const EXPORT_TTL_SECONDS = 60 * 60; // 60 minutes
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

/**
 * The provenance columns every nutrient-bearing file ends with. Each row of this
 * server's own export writes provenance_version "1" as the marker the importer
 * looks for: a file without it is third-party, so its nutrient_sources cells are
 * never read. nutrient_sources and source_detail are JSON text, empty where a row
 * has no provenance (rows written before it existed, never back-labelled).
 */
const PROVENANCE_CSV_COLUMNS = [
    "provenance_version",
    "nutrient_sources",
    "source_detail",
] as const;

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
    // Parts of fat_g, placed right after it so the fat columns read together.
    // Both are null where nothing was recorded, never 0. The importer matches
    // by header name, so an export written before these columns existed still
    // re-imports.
    "saturated_fat_g",
    "trans_fat_g",
    "fiber_g",
    "sugar_g",
    // Added sugars only (the US label definition) — a part of sugar_g, never
    // more than it. Right after sugar_g so the pair reads together; the
    // importer matches by header name, so exports from before this column
    // existed still re-import.
    "added_sugar_g",
    "alcohol_g",
    // Milligrams, and the header says so. Every other nutrient column here is
    // grams, so a bare "caffeine" header is exactly how a re-import — ours or
    // anyone else's — turns 180 mg into 180 g.
    "caffeine_mg",
    "notes",
    // The saved meal this entry was logged from, or empty. Appended after
    // notes rather than inserted, so the importer (which matches by header
    // name) and any reader that mapped the earlier columns by position keep
    // working; the importer ignores a column it does not know.
    "saved_meal_id",
    // Provenance (src/provenance.ts), appended for the same reason. The three
    // columns are PROVENANCE_CSV_COLUMNS below, shared with the other files.
    ...PROVENANCE_CSV_COLUMNS,
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
 * The leading-apostrophe defence for text a third party chose: a spreadsheet
 * runs a cell starting with = + - @ as a formula, so a client the user once
 * authorized could plant one in their export. Not used for the user's own logs:
 * meals.csv must stay importable and byte-identical.
 */
function defuseFormula(value: string): string {
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/**
 * csvEscape for text a third party chose — an OAuth client's registered name
 * and redirect, the name and session id an MCP client reports — defused by
 * defuseFormula.
 */
function csvThirdParty(value: string | null | undefined): string {
    return csvEscape(value == null ? value : defuseFormula(value));
}

/**
 * The three provenance cells of a row, in PROVENANCE_CSV_COLUMNS order. The
 * names inside source_detail are third-party text (a food database's product
 * name), so each is defused before the JSON is written; a JSON cell never starts
 * with a formula character, so the defusing has to reach inside it.
 */
function provenanceCells(
    sources: NutrientSources | null | undefined,
    detail: SourceDetail | null | undefined,
): string[] {
    const safeDetail = detail
        ? Object.fromEntries(
              Object.entries(detail).map(([key, entry]) => [
                  key,
                  { ...entry, name: defuseFormula(entry.name) },
              ]),
          )
        : null;
    return [
        csvEscape(PROVENANCE_EXPORT_VERSION),
        csvEscape(sources ? JSON.stringify(sources) : null),
        csvEscape(safeDetail ? JSON.stringify(safeDetail) : null),
    ];
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
                csvEscape(m.saturated_fat_g),
                csvEscape(m.trans_fat_g),
                csvEscape(m.fiber_g),
                csvEscape(m.sugar_g),
                csvEscape(m.added_sugar_g),
                csvEscape(m.alcohol_g),
                csvEscape(m.caffeine_mg),
                csvEscape(m.notes),
                csvEscape(m.saved_meal_id),
                ...provenanceCells(m.nutrient_sources, m.source_detail),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * The nutrient columns shared by meal_items.csv, saved_meals.csv and
 * saved_meal_items.csv, in the order `nutrientCells` writes them. Same units as
 * meals.csv: grams, with caffeine_mg in milligrams. Values are per ingredient as
 * logged (items) or per serving (saved meals).
 */
const NUTRIENT_CSV_COLUMNS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "saturated_fat_g",
    "trans_fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "alcohol_g",
    "caffeine_mg",
] as const;

// The two optional-in-the-row columns are optional here too, because the rows
// they type come from the same optional NutrientValues the write path uses, so
// a row read from a database that predates them is still a valid input.
type ExportNutrients = {
    [
        K in Exclude<
            (typeof NUTRIENT_CSV_COLUMNS)[number],
            "saturated_fat_g" | "trans_fat_g"
        >
    ]: number | null;
} & { saturated_fat_g?: number | null; trans_fat_g?: number | null };

/** A logged meal's ingredient row, as getAllMealItems returns it. */
export interface MealItemExportRow extends ExportNutrients {
    id: string;
    meal_id: string;
    user_id: string;
    position: number;
    name: string;
    amount: number | null;
    unit: string | null;
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

/** A saved meal, as getAllSavedMeals returns it: values per serving. */
export interface SavedMealExportRow extends ExportNutrients {
    id: string;
    user_id: string;
    name: string;
    description: string;
    meal_type: string | null;
    created_at: string;
    updated_at: string;
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

/** A saved meal's ingredient row, as getAllSavedMealItems returns it. */
export interface SavedMealItemExportRow extends ExportNutrients {
    id: string;
    saved_meal_id: string;
    user_id: string;
    position: number;
    name: string;
    amount: number | null;
    unit: string | null;
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

function nutrientCells(n: ExportNutrients): string[] {
    return NUTRIENT_CSV_COLUMNS.map((column) => csvEscape(n[column]));
}

/**
 * Column order for meal_items.csv. Parallel array with the row builder below.
 * It joins meals.csv by `meal_id`; `position` orders the ingredients within a
 * meal. The meal's own totals are in meals.csv and are the sum of these rows.
 */
const MEAL_ITEMS_CSV_COLUMNS = [
    "meal_id",
    "position",
    "name",
    "amount",
    "unit",
    ...NUTRIENT_CSV_COLUMNS,
    ...PROVENANCE_CSV_COLUMNS,
] as const;

/**
 * Build meal_items.csv: one row per ingredient of every meal logged with items.
 * Header-only when no meal has items.
 */
export function buildMealItemsCsv(items: MealItemExportRow[]): string {
    const rows = [MEAL_ITEMS_CSV_COLUMNS.join(",")];
    for (const i of items) {
        rows.push(
            [
                csvEscape(i.meal_id),
                csvEscape(i.position),
                csvEscape(i.name),
                csvEscape(i.amount),
                csvEscape(i.unit),
                ...nutrientCells(i),
                ...provenanceCells(i.nutrient_sources, i.source_detail),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for saved_meals.csv. Parallel array with the row builder below.
 * The timestamps are rendered in `tz` and `timezone` names that zone, like
 * every other file here.
 */
const SAVED_MEALS_CSV_COLUMNS = [
    "id",
    "name",
    "description",
    "meal_type",
    ...NUTRIENT_CSV_COLUMNS,
    "created_at",
    "updated_at",
    "timezone",
    ...PROVENANCE_CSV_COLUMNS,
] as const;

/** Build saved_meals.csv, timestamps in `tz`. Header-only when there are none. */
export function buildSavedMealsCsv(
    saved: SavedMealExportRow[],
    tz: string,
): string {
    const rows = [SAVED_MEALS_CSV_COLUMNS.join(",")];
    for (const s of saved) {
        rows.push(
            [
                csvEscape(s.id),
                csvEscape(s.name),
                csvEscape(s.description),
                csvEscape(s.meal_type),
                ...nutrientCells(s),
                csvEscape(formatLocalDateTime(s.created_at, tz)),
                csvEscape(formatLocalDateTime(s.updated_at, tz)),
                csvEscape(tz),
                ...provenanceCells(s.nutrient_sources, s.source_detail),
            ].join(","),
        );
    }
    return rows.join("\n");
}

/**
 * Column order for saved_meal_items.csv. Same shape as meal_items.csv, joined
 * to saved_meals.csv by `saved_meal_id`.
 */
const SAVED_MEAL_ITEMS_CSV_COLUMNS = [
    "saved_meal_id",
    "position",
    "name",
    "amount",
    "unit",
    ...NUTRIENT_CSV_COLUMNS,
    ...PROVENANCE_CSV_COLUMNS,
] as const;

/**
 * Build saved_meal_items.csv: one row per ingredient of every saved meal that
 * has ingredients. Header-only when none do.
 */
export function buildSavedMealItemsCsv(
    items: SavedMealItemExportRow[],
): string {
    const rows = [SAVED_MEAL_ITEMS_CSV_COLUMNS.join(",")];
    for (const i of items) {
        rows.push(
            [
                csvEscape(i.saved_meal_id),
                csvEscape(i.position),
                csvEscape(i.name),
                csvEscape(i.amount),
                csvEscape(i.unit),
                ...nutrientCells(i),
                ...provenanceCells(i.nutrient_sources, i.source_detail),
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
    // The daily limit for saturated fat. There is no trans-fat goal, so no
    // daily_trans_fat_g column.
    "daily_saturated_fat_g",
    "daily_fiber_g",
    "daily_sugar_g",
    "daily_added_sugar_g",
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
 * Column order for goals_history.csv: when each set of targets took effect,
 * the zone that wall clock is in, then the goal columns exactly as goals.csv
 * names and formats them (target_weight_g stays canonical grams there too).
 */
const GOALS_HISTORY_CSV_COLUMNS = [
    "effective_at",
    "timezone",
    ...GOALS_CSV_COLUMNS.filter((c) => c !== "updated_at" && c !== "timezone"),
] as const;

/**
 * Build goals_history.csv: one row per change to the goals, oldest first (the
 * order `getNutritionGoalsHistory` returns). The header is emitted even with
 * no history, like every other file in the archive. Alcohol is not gated on
 * the display opt-in, for the reason given on GOALS_CSV_COLUMNS.
 */
export function buildGoalsHistoryCsv(
    history: readonly NutritionGoalsHistoryRow[],
    tz: string,
): string {
    const rows = [GOALS_HISTORY_CSV_COLUMNS.join(",")];
    for (const h of history) {
        rows.push(
            [
                csvEscape(formatLocalDateTime(h.effective_at, tz)),
                csvEscape(tz),
                csvEscape(h.daily_calories),
                csvEscape(h.daily_protein_g),
                csvEscape(h.daily_carbs_g),
                csvEscape(h.daily_fat_g),
                csvEscape(h.daily_saturated_fat_g),
                csvEscape(h.daily_fiber_g),
                csvEscape(h.daily_sugar_g),
                csvEscape(h.daily_added_sugar_g),
                csvEscape(h.daily_alcohol_g),
                csvEscape(h.daily_caffeine_mg),
                csvEscape(h.daily_water_ml),
                csvEscape(h.target_weight_g),
            ].join(","),
        );
    }
    return rows.join("\n");
}

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
                csvEscape(goals.daily_saturated_fat_g),
                csvEscape(goals.daily_fiber_g),
                csvEscape(goals.daily_sugar_g),
                csvEscape(goals.daily_added_sugar_g),
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
 *
 * The OAuth grants fill the first seven columns. The Apple Health sync link
 * (one row of kind `health_sync`, at most) also fills the rest: when it was
 * last used and last synced, which totals it sends, the first day it may send
 * and the phone's own timezone, which is a stored setting and NOT the zone the
 * timestamps here are rendered in — that one is `timezone`, as everywhere.
 */
const CONNECTIONS_CSV_COLUMNS = [
    "kind",
    "client_id",
    "client_name",
    "redirect_uri",
    "created_at",
    "expires_at",
    "last_used_at",
    "last_sync_at",
    "timezone",
    "synced_fields",
    "sync_start_date",
    "device_timezone",
] as const;

/** What connections.csv calls the Apple Health sync link. Our own text, not a
 *  registrant's, so it needs no formula defusing. */
const HEALTH_SYNC_CONNECTION_NAME = "Apple Health sync (iOS Shortcut)";

/**
 * Build connections.csv: every stored OAuth grant for the account, then the
 * Apple Health sync link when there is one. The link's token is stored only as
 * a hash and is never exported, like every other token here.
 */
export function buildConnectionsCsv(
    grants: OAuthGrantRow[],
    tz: string,
    healthSync: HealthSyncLinkStatus | null = null,
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
                // Grants record no use or sync time, and none of the link's
                // settings apply to them: empty, not zero.
                "",
                "",
                csvEscape(tz),
                "",
                "",
                "",
            ].join(","),
        );
    }
    if (healthSync) {
        out.push(
            [
                csvEscape("health_sync"),
                csvEscape(HEALTH_SYNC_CLIENT_ID),
                csvEscape(HEALTH_SYNC_CONNECTION_NAME),
                "",
                csvEscape(localOrNull(healthSync.created_at, tz)),
                csvEscape(localOrNull(healthSync.expires_at, tz)),
                csvEscape(localOrNull(healthSync.last_used_at, tz)),
                csvEscape(localOrNull(healthSync.last_sync_at, tz)),
                csvEscape(tz),
                csvEscape(healthSync.fields.join(" ")),
                csvEscape(healthSync.sync_start_date),
                csvEscape(healthSync.fallback_tz),
            ].join(","),
        );
    }
    return out.join("\n");
}

/**
 * Column order for health_sync.csv: the record of what Apple Health sync sent,
 * one row per day. Parallel array with the row builder below. The value
 * columns are HEALTH_SYNC_FIELDS — the keys the Shortcut maps onto Health
 * types, each named with its unit — so a field added there lands here too.
 */
const HEALTH_SYNC_CSV_COLUMNS = [
    "date",
    "timezone",
    ...HEALTH_SYNC_FIELDS,
    "topup_seq",
    "first_sent_at",
    "last_sent_at",
] as const;

/**
 * Build health_sync.csv from the sent-values record, oldest day first. Unlike
 * every other file, a row is rendered in ITS OWN timezone — the zone the day
 * was counted in when it was sent, which can differ from the account's after
 * the phone moved — and `timezone` names it for the date and both timestamps.
 * A day that was offered but never acknowledged has empty values and times.
 * An empty value cell means that total was not sent, not that it was zero.
 */
export function buildHealthSyncCsv(
    rows: HealthSyncDayRow[],
    tz: string,
): string {
    const out = [HEALTH_SYNC_CSV_COLUMNS.join(",")];
    for (const r of rows) {
        // Written by the server from a validated zone; a row that somehow
        // holds an unknown one falls back to the account's rather than
        // throwing the whole export away.
        const zone = validateTz(r.timezone) ? r.timezone : tz;
        const sent = r.sent_values ?? {};
        out.push(
            [
                csvEscape(r.date),
                csvEscape(zone),
                ...HEALTH_SYNC_FIELDS.map((f) => csvEscape(sent[f])),
                csvEscape(r.topup_seq),
                csvEscape(localOrNull(r.first_sent_at, zone)),
                csvEscape(localOrNull(r.last_sent_at, zone)),
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
    "meal_items.csv",
    "saved_meals.csv",
    "saved_meal_items.csv",
    "water.csv",
    "weight.csv",
    "body_measurements.csv",
    "goals.csv",
    "goals_history.csv",
    "profile.csv",
    "account.csv",
    "telemetry.csv",
    "connections.csv",
    "health_sync.csv",
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
        ? `Every timestamp in this archive is a local wall clock in ${tz}, the timezone set on your account, except in health_sync.csv (see below). Each file repeats it in a "timezone" column so no file has to be read next to this one.`
        : `No timezone has ever been set on this account, so every timestamp in this archive is expressed in UTC (that is also what the server assumes when it buckets your days), except in health_sync.csv (see below). Set one with set_timezone and export again if you want your own wall clock. Each file repeats the zone in a "timezone" column.`;

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
        `meals.csv    ${rows(counts.meals)} — every meal you have logged: time, description, calories and macros, saved_meal_id, the saved meal it was logged from (empty when it was not logged from one), and the nutrient_sources and source_detail columns described under "Where the values came from".`,
        `meal_items.csv ${rows(counts.mealItems)} — the ingredients of meals you logged with an itemised list: one row per ingredient with its amount, unit and nutrients. Joined to meals.csv by meal_id; position orders the ingredients within a meal. A meal's totals in meals.csv are the sum of its ingredients, with calories rounded to a whole number and the other values to two decimals, so a calorie total can differ from the sum of the ingredients' calories by up to half a calorie.`,
        `saved_meals.csv ${rows(counts.savedMeals)} — your saved meals: name, description, default meal type and the values for one serving, when each was created and last changed (in its "timezone" column's zone). Editing or deleting a saved meal does not change meals you already logged from it.`,
        `saved_meal_items.csv ${rows(counts.savedMealItems)} — the ingredients of saved meals, one row per ingredient, joined to saved_meals.csv by saved_meal_id. When a saved meal has ingredients, its values in saved_meals.csv are their sum, rounded the same way: calories to a whole number, the other values to two decimals. Each ingredient carries its own nutrient_sources and source_detail, as described under "Where the values came from".`,
        `water.csv    ${rows(counts.water)} — every water entry, in millilitres.`,
        `weight.csv   ${rows(counts.weight)} — every weigh-in, as stored grams and as ${weightUnit}.`,
        `body_measurements.csv ${rows(counts.bodyMeasurements)} — every body measurement (waist, hips, neck, chest, shoulders, upper arm, forearm, thigh, calf): the stored millimetres, and the value exactly as entered with its unit (cm or in).`,
        "goals.csv    your current daily targets — one row, or a header alone if you have never set goals.",
        `goals_history.csv ${rows(counts.goalsHistory)} — every change to your daily targets, oldest first: when the new values took effect (effective_at) and the targets from then on, in the same columns and units as goals.csv. Goals set before this history was kept appear once, as of their last change.`,
        "profile.csv  your settings: timezone, preferred weight, length and drink units (empty preferred_length_unit = never chosen), display toggles and widget language — one row, or a header alone if you have no profile yet. An empty locale means no widget language was ever chosen, so widgets use English.",
        'account.csv  your sign-in account: one "account" row (account id, email address, when the account was created, when the email was confirmed, last sign-in, sign-in methods) and one "identity" row per sign-in method (the provider, the provider\'s id for you, and any name or picture it sent — Google accounts created before September 27, 2026 may still hold them).',
        `telemetry.csv ${rows(counts.telemetry)} — one per tool call your AI app made: which tool, when, whether it succeeded, how long it took, the error category if it failed, the date-range length asked for, the MCP session id, the protocol revision and the app name it reported. None of it contains what you logged.`,
        `connections.csv ${rows(counts.connections)} — the sign-in grants that keep your AI apps connected: each access token, refresh token and pending authorization code, with the app it was issued to where recorded, when it was issued and when it expires. The tokens themselves are not included — we store them only as one-way hashes. Access tokens do not record which app they belong to, so their client columns are empty. If Apple Health sync is connected, its link is one more row of kind "health_sync": when it was created, last used and last synced, when it expires, which totals it sends (synced_fields), the first day it may send (sync_start_date) and the iPhone's own timezone (device_timezone, a saved setting — the timestamps are still in the "timezone" column's zone). Its token is not included either.`,
        `health_sync.csv ${rows(counts.healthSync)} — what Apple Health sync sent to your iPhone, one row per day, kept for ${HEALTH_SYNC_RETENTION_DAYS} days: the daily totals sent (${HEALTH_SYNC_FIELDS.join(", ")}), how many later top-ups were sent for the day (topup_seq) and when the first and last were sent. Each row is in its own "timezone" — the zone the day was counted in, which can differ from your account's if your phone was elsewhere — and its date and times are wall clocks there. An empty value was not sent; a row with no values was offered but not yet confirmed by the phone. Alcohol is never sent.`,
        "README.txt   this file.",
        "",
        "Where the values came from",
        "--------------------------",
        "nutrient_sources (in meals.csv, meal_items.csv, saved_meals.csv and saved_meal_items.csv) is JSON that labels each nutrient value with its source: usda or openfoodfacts when the value matches that food record for the amount given (ref is the record's FoodData Central id or barcode); user when you gave the value yourself; estimate when nothing matched, which is also what a value logged by name or by hand gets. A meal-level value built from several items can read mixed, with each source's share in whole percent. A match means the number agrees with the food record for the amount given; it does not check that the amount itself was right.",
        "source_detail is JSON keyed usda:<id> or openfoodfacts:<barcode>, one entry per record the labels point at: the food's name, its data type when the record has one, the grams or servings the values were scaled to, and when the record was fetched. Names come from the food database, and a leading apostrophe is added where a spreadsheet would otherwise read the name as a formula.",
        "A cell is empty where the value was recorded before these labels were kept; an empty cell is never a source. provenance_version is 1 on every row of this export and marks the file as one that carries these columns.",
        "",
        "Units",
        "-----",
        "The unit is part of every column name, because these columns do not all agree:",
        "  * _g columns are grams; alcohol_g and daily_alcohol_g are grams of pure ethanol, not the volume of the drink.",
        "  * added_sugar_g counts only sugars added during processing or preparation; it is part of sugar_g (total sugars), never more than it. daily_added_sugar_g is the daily limit for added sugars, separate from daily_sugar_g (total sugars).",
        "  * saturated_fat_g and trans_fat_g are parts of fat_g, in grams. daily_saturated_fat_g is the daily limit for saturated fat; trans fat has no daily limit.",
        "  * caffeine_mg and daily_caffeine_mg are MILLIGRAMS, unlike every gram column beside them. A cup of coffee is about 95 mg.",
        "  * amount_ml, daily_water_ml and water_ml are millilitres.",
        `  * weight_g and target_weight_g are grams — the canonical form the server stores. weight.csv also gives weight_display in ${weightUnit}, with weight_unit naming it, so you do not have to divide anything by hand.`,
        "  * value_mm is millimetres, the canonical stored form; value_entered is the number as typed, in entered_unit.",
        "  * calories and energy_kcal are kcal.",
        "An empty cell means nothing was ever recorded there. It does not mean zero — a meal logged before caffeine tracking existed has an empty caffeine_mg, not a 0.",
        "",
        "Re-importing",
        "------------",
        "Only meals.csv can be read back in. Hand it to start_meal_import (which parses it in your browser) or to bulk_import_meals; its column names are exactly the ones the importer expects, and re-importing the same file twice is a no-op rather than a set of duplicates.",
        "Every other file is export-only — there is no import path for meal ingredients, saved meals, water, weight, body measurements, goals, profile, account, telemetry, connections or Apple Health sync, so keep this archive if you want that history back.",
        "",
        "Not in this archive",
        "-------------------",
        "This archive holds everything the service stores about you. What is not in it:",
        "  * the server runtime log — a short rolling buffer of requests that does not contain your account id or email, so it cannot be looked up by account;",
        "  * our providers' own short-lived operational logs (including the sign-in provider's audit records) and their rolling backups, which age out on their own schedule;",
        "  * values kept only as one-way hashes for security: your password (held by the sign-in provider, which never returns it) and your tokens and sign-in codes, including the Apple Health sync token (which also sits, unhashed, in the shortcut on your own devices);",
        "  * internal bookkeeping: the de-duplication keys stored beside meals, water, weight and body measurement entries, the PKCE challenge of a pending sign-in, and Apple Health sync's lock against two syncs at once, its per-day count of how often a day was offered and its record of which notices were shown;",
        "  * a pending Apple Health sync connect request, which lasts at most 30 minutes and is deleted once the shortcut finishes connecting;",
        "  * a sign-in session record at our sign-in provider (IP address and browser), if one was ever left behind after sign-in; it is deleted with your account.",
        "",
    ].join("\n");
}

export interface ExportCounts {
    meals: number;
    /** Rows in meal_items.csv: ingredients of logged meals. */
    mealItems: number;
    /** Rows in saved_meals.csv. */
    savedMeals: number;
    /** Rows in saved_meal_items.csv: ingredients of saved meals. */
    savedMealItems: number;
    water: number;
    weight: number;
    bodyMeasurements: number;
    /** Rows in goals_history.csv. */
    goalsHistory: number;
    telemetry: number;
    /** OAuth grants plus the Apple Health sync link row, when there is one. */
    connections: number;
    /** Days in health_sync.csv. */
    healthSync: number;
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
 * Build the whole-account archive — every log (meals and their ingredients,
 * saved meals and their ingredients, water, weight and body measurements), the
 * goals and their history, the profile, the
 * Auth account, the tool telemetry, the OAuth grants and the Apple Health sync
 * link with its record of what was sent —
 * upload it to the private `exports` bucket under a fixed per-user path (so
 * each export overwrites the previous one), and return a signed download link
 * valid for EXPORT_TTL_SECONDS. This is the only export path: a meals-only CSV
 * tool used to sit beside it, and the archive absorbed it, which is why
 * `buildMealsCsv` still emits exactly the columns the importer reads.
 */
export async function exportAllData(
    userId: string,
    // Injectable for tests; every other reader here is a supabase.ts function.
    deps: {
        healthSync?: HealthSyncStore;
        getGoalsHistory?: (
            userId: string,
        ) => Promise<NutritionGoalsHistoryRow[]>;
    } = {},
): Promise<FullExportResult> {
    const healthSync = deps.healthSync ?? createSupabaseHealthSyncStore();
    const getGoalsHistory = deps.getGoalsHistory ?? getNutritionGoalsHistory;
    // One round of independent queries rather than each awaited in turn: an
    // account with years of history pages through meals, water, weight and
    // telemetry, and serialising those pushes the tool past the point where a
    // host gives up on it.
    const [
        meals,
        mealItems,
        savedMeals,
        savedMealItems,
        water,
        weight,
        bodyMeasurements,
        goals,
        goalsHistory,
        profile,
        account,
        telemetry,
        connections,
        healthSyncLink,
        healthSyncDays,
    ] = await Promise.all([
        getAllMeals(userId),
        getAllMealItems(userId),
        getAllSavedMeals(userId),
        getAllSavedMealItems(userId),
        getAllWater(userId),
        getAllWeight(userId),
        getAllBodyMeasurements(userId),
        getNutritionGoals(userId),
        getGoalsHistory(userId),
        getProfile(userId),
        getAuthAccount(userId),
        getAllToolAnalytics(userId),
        getAllOAuthGrants(userId),
        healthSync.getLinkStatus(userId),
        healthSync.getDaysForExport(userId),
    ]);

    const counts: ExportCounts = {
        meals: meals.length,
        mealItems: mealItems.length,
        savedMeals: savedMeals.length,
        savedMealItems: savedMealItems.length,
        water: water.length,
        weight: weight.length,
        bodyMeasurements: bodyMeasurements.length,
        goalsHistory: goalsHistory.length,
        telemetry: telemetry.length,
        connections: connections.length + (healthSyncLink ? 1 : 0),
        healthSync: healthSyncDays.length,
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
        "meal_items.csv": buildMealItemsCsv(mealItems),
        "saved_meals.csv": buildSavedMealsCsv(savedMeals, tz),
        "saved_meal_items.csv": buildSavedMealItemsCsv(savedMealItems),
        "water.csv": buildWaterCsv(water, tz),
        "weight.csv": buildWeightCsv(weight, tz, weightUnit),
        "body_measurements.csv": buildBodyMeasurementsCsv(bodyMeasurements, tz),
        "goals.csv": buildGoalsCsv(goals, tz),
        "goals_history.csv": buildGoalsHistoryCsv(goalsHistory, tz),
        "profile.csv": buildProfileCsv(profile, tz),
        "account.csv": buildAccountCsv(account, tz),
        "telemetry.csv": buildTelemetryCsv(telemetry, tz),
        "connections.csv": buildConnectionsCsv(connections, tz, healthSyncLink),
        "health_sync.csv": buildHealthSyncCsv(healthSyncDays, tz),
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

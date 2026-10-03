// Apple Health sync via an iOS Shortcut: the pure half. Everything here is a
// function of its arguments (plus the tz helpers, which only read the ICU
// database), so the rules that decide what reaches Apple Health are pinned by
// table-driven tests in src/health-sync.test.ts without Supabase or Hono.
//
// The shape of the feature, in one paragraph: the Shortcut asks GET /pending
// for the daily totals of days that are over ("closed" at 05:00 local the next
// morning), logs each one into Health as a single noon sample per type, and
// acks what it logged. The server keeps a per-day ledger (`health_sync_days`)
// of what was acked, so a day that grows later gets an upward top-up, and a day
// that shrinks gets a notice instead — Health can only add samples, never lower
// one it already holds.
//
// Must not import mcp.ts or supabase.ts at runtime (types only), and must not
// reuse the zero-filling `sumMeals` / `totalsPayloadOf`: here a nutrient no
// meal carries is null and is never sent, while a real 0 is a value.

import type { Meal, WaterEntry } from "./supabase.js";
import {
    dateInTz,
    formatLocalDateTime,
    shiftLocalDate,
    validateTz,
    zonedHourUtc,
} from "./tz.js";

// ---------- constants (restated by the docs; src/site-copy.test.ts pins them) ----------

/** A day D is "closed" at this local hour on D+1, and only closed days are sent. */
export const HEALTH_SYNC_CLOSE_HOUR = 5;
/** How many closed days /pending looks back over (the last closed day included). */
export const HEALTH_SYNC_WINDOW_DAYS = 7;
/** How long a `health_sync_days` ledger row is kept after its date. */
export const HEALTH_SYNC_RETENTION_DAYS = 8;
/** Lifetime of a pending connection started by POST /start. */
export const HEALTH_SYNC_CONNECT_TTL_MINUTES = 30;
/** Lifetime of the claim code minted by the sign-in callback. */
export const HEALTH_SYNC_CLAIM_TTL_MINUTES = 10;
/** A link unused for this long expires (sliding from last use). */
export const HEALTH_SYNC_LINK_IDLE_DAYS = 90;
/** A link expires this long after it was created, however often it is used. */
export const HEALTH_SYNC_LINK_MAX_DAYS = 365;
/** Largest `backfill_days` POST /start accepts. */
export const HEALTH_SYNC_MAX_BACKFILL_DAYS = 7;
/** The Shortcut's exact name; the callback page runs it by this name. */
export const HEALTH_SYNC_SHORTCUT_NAME = "Nutrition MCP Health";
/**
 * The shortcut's public iCloud link from a raw env value: only an
 * `https://www.icloud.com/shortcuts/…` link counts, since that is the one
 * kind iOS opens straight into Shortcuts. Anything else is null.
 */
export function shortcutUrlFromEnv(raw: string | undefined): string | null {
    const value = raw?.trim();
    if (!value) return null;
    try {
        const url = new URL(value);
        if (
            url.protocol === "https:" &&
            url.hostname === "www.icloud.com" &&
            url.pathname.startsWith("/shortcuts/") &&
            url.pathname.length > "/shortcuts/".length
        ) {
            return url.toString();
        }
    } catch {
        // fall through
    }
    return null;
}
/**
 * The install button on /apple-health (scripts/gen-apple-health.ts), from the
 * HEALTH_SYNC_SHORTCUT_URL env var. A build-time value, not a runtime one: the
 * pages are generated during the build, so App Platform must pass it as a
 * build arg (the Dockerfile declares it). Each deploy links the copy of the
 * shortcut whose base URL points at it, and a fork that sets nothing shows
 * "coming soon" rather than sending its users to nutrition-mcp.com. Unset or
 * not an iCloud shortcut link: null, and the page says the link is coming.
 */
export const HEALTH_SYNC_SHORTCUT_URL: string | null = shortcutUrlFromEnv(
    process.env.HEALTH_SYNC_SHORTCUT_URL,
);
/** The built-in first-party OAuth client the connect flow signs in through. */
export const HEALTH_SYNC_CLIENT_ID = "nutrition-mcp-health-sync";
/** Every link token starts with this, so a stray OAuth token is told apart
 *  without a database call. */
export const HEALTH_SYNC_TOKEN_PREFIX = "nmhs_";
/** One sync run holds the per-user lease this long. */
export const HEALTH_SYNC_LEASE_SECONDS = 120;
/** Most entries one POST /ack may carry. */
export const HEALTH_SYNC_MAX_ACK_ENTRIES = 20;
/** Top-ups per day are capped so every sample time stays at 12:0n (n ≤ 9). */
export const HEALTH_SYNC_MAX_TOPUPS = 9;
/** An entry offered this many times without an ack stops being offered. */
export const HEALTH_SYNC_STUCK_OFFERS = 3;
/** A top-up is held back as a suspect jump when the day's energy rose by more
 *  than this factor of what was sent AND by more than this many kcal. */
export const HEALTH_SYNC_JUMP_FACTOR = 1.5;
export const HEALTH_SYNC_JUMP_MIN_KCAL = 800;

// ---------- fields ----------

/** Keys the Shortcut maps onto HealthKit types, each named with its unit. */
export const HEALTH_SYNC_FIELDS = [
    "energy_kcal",
    "protein_g",
    "carbohydrates_g",
    "fat_g",
    "fiber_g",
    "caffeine_mg",
    "water_ml",
] as const;
export type HealthSyncField = (typeof HEALTH_SYNC_FIELDS)[number];

/** Sent unless the user opts out at connect. Water is opt-in (an Apple Watch
 *  or another app often logs it already). Alcohol is never a field at all:
 *  HealthKit only has a drink count, and the alcohol opt-in exists for users in
 *  recovery. */
export const HEALTH_SYNC_DEFAULT_FIELDS: readonly HealthSyncField[] = [
    "energy_kcal",
    "protein_g",
    "carbohydrates_g",
    "fat_g",
    "fiber_g",
    "caffeine_mg",
];

type MealColumn =
    "calories" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g" | "caffeine_mg";

export interface HealthSyncFieldSpec {
    /** Where the value comes from: a meal column, or the sum of water rows. */
    source: { table: "meals"; column: MealColumn } | { table: "water" };
    unit: "kcal" | "g" | "mg" | "mL";
    /** 0 rounds to integers (kcal, mg, mL); 1 rounds grams to one decimal. */
    decimals: 0 | 1;
    /** A change smaller than this is ignored, both up and down. */
    threshold: number;
    /** Largest value POST /ack accepts for this field. */
    ackMax: number;
    /** How a notice names the amount ("420 kcal", "12.5 g protein"). */
    noun: string;
    /** The HealthKit type's name in the Health app. */
    healthName: string;
}

export const HEALTH_SYNC_FIELD_SPECS: Record<
    HealthSyncField,
    HealthSyncFieldSpec
> = {
    energy_kcal: {
        source: { table: "meals", column: "calories" },
        unit: "kcal",
        decimals: 0,
        threshold: 20,
        ackMax: 50_000,
        noun: "kcal",
        healthName: "Dietary Energy",
    },
    protein_g: {
        source: { table: "meals", column: "protein_g" },
        unit: "g",
        decimals: 1,
        threshold: 2,
        ackMax: 10_000,
        noun: "g protein",
        healthName: "Protein",
    },
    carbohydrates_g: {
        source: { table: "meals", column: "carbs_g" },
        unit: "g",
        decimals: 1,
        threshold: 2,
        ackMax: 10_000,
        noun: "g carbohydrates",
        healthName: "Carbohydrates",
    },
    fat_g: {
        source: { table: "meals", column: "fat_g" },
        unit: "g",
        decimals: 1,
        threshold: 2,
        ackMax: 10_000,
        noun: "g fat",
        healthName: "Total Fat",
    },
    fiber_g: {
        source: { table: "meals", column: "fiber_g" },
        unit: "g",
        decimals: 1,
        threshold: 2,
        ackMax: 10_000,
        noun: "g fiber",
        healthName: "Fiber",
    },
    caffeine_mg: {
        source: { table: "meals", column: "caffeine_mg" },
        unit: "mg",
        decimals: 0,
        threshold: 10,
        ackMax: 100_000,
        noun: "mg caffeine",
        healthName: "Caffeine",
    },
    water_ml: {
        source: { table: "water" },
        unit: "mL",
        decimals: 0,
        threshold: 100,
        ackMax: 100_000,
        noun: "mL water",
        healthName: "Water",
    },
};

export function isHealthSyncField(key: string): key is HealthSyncField {
    return (HEALTH_SYNC_FIELDS as readonly string[]).includes(key);
}

/** Fields a new connection sends: the defaults, plus water when opted in.
 *  Always in HEALTH_SYNC_FIELDS order. */
export function fieldsForConnect(includeWater: boolean): HealthSyncField[] {
    return HEALTH_SYNC_FIELDS.filter(
        (f) =>
            HEALTH_SYNC_DEFAULT_FIELDS.includes(f) ||
            (includeWater && f === "water_ml"),
    );
}

/** Round to the field's precision: integers for kcal/mg/mL, one decimal for
 *  grams. Also folds -0 to 0. */
export function roundField(field: HealthSyncField, value: number): number {
    const r =
        HEALTH_SYNC_FIELD_SPECS[field].decimals === 0
            ? Math.round(value)
            : Math.round(value * 10) / 10;
    return r === 0 ? 0 : r;
}

// ---------- daily totals ----------

/** Values for one day keyed by field. A missing key means "nothing carries a
 *  value" — never sent, never stored as 0. */
export type DayValues = Partial<Record<HealthSyncField, number>>;

/** Every field for one day: the rounded sum, or null when no meal (for water:
 *  no water row) carries a value for it. A real 0 stays 0. */
export type DayTotals = Record<HealthSyncField, number | null>;

export type HealthSyncMeal = Pick<Meal, "logged_at" | MealColumn>;
export type HealthSyncWater = Pick<WaterEntry, "logged_at" | "amount_ml">;

function emptyTotals(): DayTotals {
    return Object.fromEntries(
        HEALTH_SYNC_FIELDS.map((f) => [f, null]),
    ) as DayTotals;
}

/**
 * Per-local-day totals of `meals` and `water` in `tz`, with presence. Every
 * date in `dates` gets an entry (all-null when nothing was logged); rows on
 * other dates are ignored, so the caller may pass a read that is wider than
 * the window. Sums are taken raw and rounded once, so per-meal rounding never
 * accumulates.
 */
export function computeDayTotals(
    meals: readonly HealthSyncMeal[],
    water: readonly HealthSyncWater[],
    tz: string,
    dates: readonly string[],
): Map<string, DayTotals> {
    const raw = new Map<string, DayTotals>();
    for (const d of dates) raw.set(d, emptyTotals());
    const add = (day: DayTotals, f: HealthSyncField, v: unknown) => {
        if (typeof v !== "number" || !Number.isFinite(v)) return;
        day[f] = (day[f] ?? 0) + v;
    };
    for (const m of meals) {
        const day = raw.get(dateInTz(m.logged_at, tz));
        if (!day) continue;
        for (const f of HEALTH_SYNC_FIELDS) {
            const src = HEALTH_SYNC_FIELD_SPECS[f].source;
            if (src.table === "meals") add(day, f, m[src.column]);
        }
    }
    for (const w of water) {
        const day = raw.get(dateInTz(w.logged_at, tz));
        if (day) add(day, "water_ml", w.amount_ml);
    }
    for (const day of raw.values()) {
        for (const f of HEALTH_SYNC_FIELDS) {
            const v = day[f];
            if (v !== null) day[f] = roundField(f, v);
        }
    }
    return raw;
}

/** The enabled, non-null values of a day — what an initial entry carries. */
export function presentValues(
    totals: DayTotals,
    fields: readonly HealthSyncField[],
): DayValues {
    const out: DayValues = {};
    for (const f of HEALTH_SYNC_FIELDS) {
        if (!fields.includes(f)) continue;
        const v = totals[f];
        if (v !== null) out[f] = v;
    }
    return out;
}

// ---------- time: close instant, window, timezone ----------

/**
 * The instant day `date` closes in `tz`: 05:00 local on the NEXT day, resolved
 * through zonedHourUtc — never "day start + N hours", which is an hour off on
 * either side of a DST change.
 */
export function closeInstant(date: string, tz: string): Date {
    return zonedHourUtc(shiftLocalDate(date, 1), tz, HEALTH_SYNC_CLOSE_HOUR);
}

/** The latest local date whose close instant is at or before `now`: yesterday
 *  from 05:00 local on, the day before yesterday until then. */
export function lastClosedDate(now: Date, tz: string): string {
    const yesterday = shiftLocalDate(dateInTz(now, tz), -1);
    return closeInstant(yesterday, tz).getTime() <= now.getTime()
        ? yesterday
        : shiftLocalDate(yesterday, -1);
}

export interface OfferingWindow {
    /** First date offered, or null when the window is empty. */
    from: string | null;
    /** Last closed date (always set, even when the window is empty). */
    to: string;
    /** Ascending dates in [from, to]; empty when sync_start_date is after `to`. */
    dates: string[];
    /** When the day after `to` closes. */
    nextDayReadyAt: Date;
}

/**
 * The dates GET /pending considers: `[max(syncStartDate, lastClosed − 6),
 * lastClosed]`. Empty until the first eligible day has closed — a link made
 * with no backfill starts at today, which first closes tomorrow at 05:00.
 */
export function offeringWindow(
    now: Date,
    tz: string,
    syncStartDate: string,
): OfferingWindow {
    const to = lastClosedDate(now, tz);
    const earliest = shiftLocalDate(to, -(HEALTH_SYNC_WINDOW_DAYS - 1));
    const from = syncStartDate > earliest ? syncStartDate : earliest;
    const dates: string[] = [];
    for (let d = from; d <= to; d = shiftLocalDate(d, 1)) dates.push(d);
    return {
        from: dates.length ? from : null,
        to,
        dates,
        nextDayReadyAt: closeInstant(shiftLocalDate(to, 1), tz),
    };
}

/**
 * The dates POST /ack accepts: the offering window as of `now`, plus one day
 * further back. An entry is offered for one of the window's dates, and its
 * ack may land after 05:00 has slid the window on by a day, so the day that
 * just fell out is still taken; nothing older, nothing not yet closed and
 * nothing before the link's start date ever is. Bounding acks this way is
 * what keeps every ledger row inside the 8-day retention — a row dated in
 * the future would never be swept. Null when no date is acceptable yet.
 */
export function ackWindow(
    now: Date,
    tz: string,
    syncStartDate: string,
): { from: string; to: string } | null {
    const to = lastClosedDate(now, tz);
    const earliest = shiftLocalDate(to, -HEALTH_SYNC_WINDOW_DAYS);
    const from = syncStartDate > earliest ? syncStartDate : earliest;
    return from <= to ? { from, to } : null;
}

/** First date a new link offers: today in `tz` minus the chosen backfill. */
export function syncStartDate(
    now: Date,
    tz: string,
    backfillDays: number,
): string {
    return shiftLocalDate(dateInTz(now, tz), -backfillDays);
}

export type TimezoneSource = "profile" | "phone" | "utc";

/** The zone days are bucketed in: the profile's, else the one the phone sent
 *  at /start, else UTC. The phone's zone is never written to the profile. */
export function effectiveTimezone(
    profileTz: string | null | undefined,
    fallbackTz: string | null | undefined,
): { tz: string; source: TimezoneSource } {
    if (profileTz && validateTz(profileTz)) {
        return { tz: profileTz, source: "profile" };
    }
    if (fallbackTz && validateTz(fallbackTz)) {
        return { tz: fallbackTz, source: "phone" };
    }
    return { tz: "UTC", source: "utc" };
}

/** ISO 8601 with the zone's own offset, e.g. "2026-10-04T05:00:00+03:00". */
export function formatInstantWithOffset(instant: Date, tz: string): string {
    const local = formatLocalDateTime(instant, tz);
    const wallMs = Date.parse(`${local.replace(" ", "T")}Z`);
    const offsetMin = Math.round(
        (wallMs - Math.floor(instant.getTime() / 1000) * 1000) / 60_000,
    );
    const sign = offsetMin < 0 ? "-" : "+";
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `${local.replace(" ", "T")}${sign}${hh}:${mm}`;
}

// ---------- link lifetime ----------

/** Cheap shape check before any database call; anything else is a strike. */
export function looksLikeHealthSyncToken(token: string): boolean {
    return /^nmhs_[A-Za-z0-9_-]{20,200}$/.test(token);
}

/** A link's expiry: 90 days after its last use, never past created + 365d. */
export function linkExpiresAt(createdAt: Date, lastUsedAt: Date): Date {
    const idle = lastUsedAt.getTime() + HEALTH_SYNC_LINK_IDLE_DAYS * 86_400_000;
    const hard = createdAt.getTime() + HEALTH_SYNC_LINK_MAX_DAYS * 86_400_000;
    return new Date(Math.min(idle, hard));
}

/** `last_used_at` / `expires_at` are written at most once an hour per link. */
export function shouldTouchLink(lastUsedAt: Date | null, now: Date): boolean {
    return (
        lastUsedAt === null || now.getTime() - lastUsedAt.getTime() >= 3_600_000
    );
}

// ---------- ledger, entries, notices ----------

/** One `health_sync_days` row, minus `user_id` (the store adds it). */
export interface LedgerRow {
    date: string;
    /** Zone the day was bucketed in; once values were sent, a different zone
     *  freezes the day. */
    timezone: string;
    /** What Health holds from us for this day; null until the initial entry is
     *  acked. */
    sent_values: DayValues | null;
    topup_seq: number;
    /** Offers since the last ack; resets to 0 on every applied ack. */
    offer_count: number;
    /** Notices already shown, so each is shown once: `down:<field>` → value at
     *  notice time, `jump` → energy at notice time, `tz` → the new zone, `cap`
     *  → true, `stuck` → the entry_id that got stuck. */
    notified: Record<string, string | number | boolean>;
    first_sent_at: string | null;
    last_sent_at: string | null;
}

export type EntryKind = "initial" | "topup";

export interface Entry {
    entry_id: string;
    date: string;
    kind: EntryKind;
    /** Local wall time the Shortcut logs the sample at; unique per entry, so
     *  an in-flight entry can be found again in Health. */
    sample_local: string;
    values: DayValues;
}

/** "<date>:i" for the initial entry, "<date>:t<n>" for the n-th top-up. */
export function entryId(date: string, kind: EntryKind, n = 0): string {
    return kind === "initial" ? `${date}:i` : `${date}:t${n}`;
}

/** "<date> 12:00:00" for the initial entry, "<date> 12:0<n>:00" for top-up n. */
export function sampleLocal(date: string, kind: EntryKind, n = 0): string {
    return `${date} 12:0${kind === "initial" ? 0 : n}:00`;
}

export type ParsedEntryId =
    | { date: string; kind: "initial" }
    | { date: string; kind: "topup"; n: number };

const ENTRY_ID_RE = /^(\d{4}-\d{2}-\d{2}):(?:(i)|t([1-9]))$/;

export function parseEntryId(id: string): ParsedEntryId | null {
    const m = ENTRY_ID_RE.exec(id);
    if (!m || !isCalendarDate(m[1]!)) return null;
    return m[2]
        ? { date: m[1]!, kind: "initial" }
        : { date: m[1]!, kind: "topup", n: Number(m[3]) };
}

function isCalendarDate(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    const probe = new Date(Date.UTC(y, m - 1, d));
    return (
        probe.getUTCFullYear() === y &&
        probe.getUTCMonth() === m - 1 &&
        probe.getUTCDate() === d
    );
}

/** "Oct 2" — the date as the notices name it. */
export function shortDate(date: string): string {
    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
    }).format(new Date(Date.UTC(y, m - 1, d)));
}

function amount(field: HealthSyncField, value: number): string {
    const spec = HEALTH_SYNC_FIELD_SPECS[field];
    const n = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: spec.decimals,
        minimumFractionDigits: 0,
    }).format(value);
    return `${n} ${spec.noun}`;
}

function joinList(items: string[]): string {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sampleTimes(row: LedgerRow): string {
    return row.topup_seq > 0 ? `12:00–12:0${row.topup_seq}` : "12:00";
}

/** Where the Health app lists a type's samples, for the decrease notice. */
function showAllDataPath(fields: HealthSyncField[]): string {
    const names = fields.map((f) => HEALTH_SYNC_FIELD_SPECS[f].healthName);
    return names.length === 1
        ? `Health → Browse → Nutrition → ${names[0]} → Show All Data`
        : `Health → Browse → Nutrition → Show All Data (${joinList(names)})`;
}

export interface PendingInput {
    /** Window dates, ascending (OfferingWindow.dates). */
    dates: readonly string[];
    /** computeDayTotals over the same dates in `tz`. */
    totals: ReadonlyMap<string, DayTotals>;
    /** Existing ledger rows; rows for dates outside `dates` are ignored. */
    ledger: readonly LedgerRow[];
    /** The link's enabled fields. */
    fields: readonly HealthSyncField[];
    /** Effective timezone of this run. */
    tz: string;
    /**
     * A run the user started by hand (the shortcut's Sync now, `?mode=manual`).
     * It gives every stuck entry a fresh set of offers: the stuck notice asks
     * the user to fix Health's permissions and run the shortcut again, and
     * without this nothing could ever deliver that day, since only an ack
     * resets `offer_count` and a stuck entry is never offered to be acked.
     * Automation runs leave stuck entries alone, so a phone that keeps
     * refusing the writes is not offered the same day on every run.
     */
    retryStuck?: boolean;
}

export interface PendingPlan {
    entries: Entry[];
    notices: string[];
    /** Rows to upsert (new, or changed `offer_count` / `notified` /
     *  `timezone`). Unchanged rows are not listed. */
    ledgerUpdates: LedgerRow[];
    /** The latest date through which every window day has reached Health (or
     *  had nothing to send), or null when that is not known. */
    syncedThrough: string | null;
}

function newRow(date: string, tz: string): LedgerRow {
    return {
        date,
        timezone: tz,
        sent_values: null,
        topup_seq: 0,
        offer_count: 0,
        notified: {},
        first_sent_at: null,
        last_sent_at: null,
    };
}

function cloneRow(row: LedgerRow): LedgerRow {
    return {
        ...row,
        sent_values: row.sent_values ? { ...row.sent_values } : null,
        notified: { ...row.notified },
    };
}

/**
 * Decide what one GET /pending offers. Per window date, in order:
 *
 *  - Nothing acked yet (no row, or `sent_values` null): an `initial` entry with
 *    every enabled non-null value. A day with no values gets no entry and no row.
 *  - Values acked under another timezone: frozen — the local day no longer
 *    means the same 24 hours. One notice per new zone.
 *  - Otherwise, per enabled field, current (null → 0) against sent (missing → 0):
 *      up by ≥ the field's threshold → part of a `topup` entry (the delta);
 *      down by ≥ the threshold → a notice, once per field per current value.
 *    The top-up is held back, with one notice each, when energy looks like a
 *    suspect jump (> 1.5× sent and > 800 kcal more), or the day already had
 *    HEALTH_SYNC_MAX_TOPUPS top-ups.
 *  - Any entry already offered HEALTH_SYNC_STUCK_OFFERS times without an ack is
 *    not offered again; one notice names the Health permission to check. A
 *    run with `retryStuck` (started by hand) offers it afresh.
 *
 * Every offered entry bumps the row's `offer_count` (creating the row with
 * `sent_values` null for an initial entry), and every emitted notice is
 * recorded in `notified` — both arrive in `ledgerUpdates` for the store to
 * write before the response goes out.
 */
export function planPending(input: PendingInput): PendingPlan {
    const { dates, totals, fields, tz } = input;
    const byDate = new Map(input.ledger.map((r) => [r.date, r]));
    const entries: Entry[] = [];
    const notices: string[] = [];
    const updates: LedgerRow[] = [];
    const stuckDates: string[] = [];
    let firstOutstanding: string | null = null;

    for (const date of dates) {
        const existing = byDate.get(date);
        const row = existing ? cloneRow(existing) : null;
        const cur = totals.get(date) ?? emptyTotals();
        let changed = false;
        let outstanding = false;

        const offer = (r: LedgerRow, entry: Entry): boolean => {
            if (input.retryStuck && r.offer_count >= HEALTH_SYNC_STUCK_OFFERS) {
                r.offer_count = 0;
                delete r.notified.stuck;
            }
            if (r.offer_count >= HEALTH_SYNC_STUCK_OFFERS) {
                outstanding = true;
                if (r.notified.stuck !== entry.entry_id) {
                    r.notified.stuck = entry.entry_id;
                    stuckDates.push(date);
                    return true;
                }
                return false;
            }
            r.offer_count += 1;
            entries.push(entry);
            outstanding = true;
            return true;
        };

        if (!row || row.sent_values === null) {
            const values = presentValues(cur, fields);
            if (Object.keys(values).length === 0) continue;
            const r = row ?? newRow(date, tz);
            if (r.timezone !== tz) {
                r.timezone = tz;
                changed = true;
            }
            changed =
                offer(r, {
                    entry_id: entryId(date, "initial"),
                    date,
                    kind: "initial",
                    sample_local: sampleLocal(date, "initial"),
                    values,
                }) || changed;
            if (changed || !row) updates.push(r);
        } else {
            const sent = row.sent_values;
            if (row.timezone !== tz) {
                if (row.notified.tz !== tz) {
                    row.notified.tz = tz;
                    notices.push(
                        `${shortDate(date)} was sent to Apple Health in ${row.timezone} and the timezone is now ${tz}, so changes to that day are no longer synced. Any difference can be entered in Health by hand.`,
                    );
                    updates.push(row);
                }
                continue;
            }

            const ups: DayValues = {};
            const downs: { field: HealthSyncField; by: number }[] = [];
            for (const f of fields) {
                const c = cur[f] ?? 0;
                const s = sent[f] ?? 0;
                const delta = roundField(f, c - s);
                const thr = HEALTH_SYNC_FIELD_SPECS[f].threshold;
                const key = `down:${f}`;
                if (delta >= thr) {
                    ups[f] = delta;
                } else if (-delta >= thr) {
                    if (row.notified[key] !== c) {
                        row.notified[key] = c;
                        downs.push({ field: f, by: -delta });
                        changed = true;
                    }
                    continue;
                }
                // Not down (any more): forget the old notice so a later drop
                // to the same value is announced again.
                if (key in row.notified) {
                    delete row.notified[key];
                    changed = true;
                }
            }

            if (downs.length > 0) {
                const d = shortDate(date);
                const down = downs.map((x) => x.field);
                notices.push(
                    `${d} went down by ${joinList(downs.map((x) => amount(x.field, x.by)))} after it was sent to Apple Health. Health can't lower a value it already has; to correct it, delete the ${d} ${sampleTimes(row)} entries from Shortcuts under ${showAllDataPath(down)} and enter the current total (${joinList(down.map((f) => amount(f, cur[f] ?? 0)))}) by hand.`,
                );
            }

            if (Object.keys(ups).length > 0) {
                const cE = cur.energy_kcal ?? 0;
                const sE = sent.energy_kcal ?? 0;
                const jump =
                    fields.includes("energy_kcal") &&
                    cE > HEALTH_SYNC_JUMP_FACTOR * sE &&
                    cE - sE > HEALTH_SYNC_JUMP_MIN_KCAL;
                if (jump) {
                    outstanding = true;
                    if (row.notified.jump !== cE) {
                        row.notified.jump = cE;
                        changed = true;
                        notices.push(
                            `${shortDate(date)} rose by ${amount("energy_kcal", roundField("energy_kcal", cE - sE))} after it was sent to Apple Health, which looks like a logging mistake, so it was not added. If the meals in chat are right, the difference can be entered in Health by hand.`,
                        );
                    }
                } else if (row.topup_seq >= HEALTH_SYNC_MAX_TOPUPS) {
                    outstanding = true;
                    if (row.notified.cap !== true) {
                        row.notified.cap = true;
                        changed = true;
                        notices.push(
                            `${shortDate(date)} changed again after ${HEALTH_SYNC_MAX_TOPUPS} updates to Apple Health, so further changes to that day are not synced. Any difference can be entered in Health by hand.`,
                        );
                    }
                } else {
                    const n = row.topup_seq + 1;
                    changed =
                        offer(row, {
                            entry_id: entryId(date, "topup", n),
                            date,
                            kind: "topup",
                            sample_local: sampleLocal(date, "topup", n),
                            values: ups,
                        }) || changed;
                }
            }
            if (changed) updates.push(row);
        }

        if (outstanding && firstOutstanding === null) firstOutstanding = date;
    }

    if (stuckDates.length > 0) {
        notices.push(
            `${joinList(stuckDates.map(shortDate))} did not reach Apple Health after ${HEALTH_SYNC_STUCK_OFFERS} tries, so ${stuckDates.length === 1 ? "it is" : "they are"} no longer offered. Check that Shortcuts may write every nutrition type under Health → Sharing → Apps → Shortcuts, then run the shortcut again from the Shortcuts app.`,
        );
    }

    let syncedThrough: string | null;
    if (dates.length === 0) {
        syncedThrough = null;
    } else if (firstOutstanding === null) {
        syncedThrough = dates[dates.length - 1]!;
    } else {
        const before = shiftLocalDate(firstOutstanding, -1);
        syncedThrough = before >= dates[0]! ? before : null;
    }

    return { entries, notices, ledgerUpdates: updates, syncedThrough };
}

// ---------- ack ----------

export interface AckEntry {
    entry_id: string;
    date: string;
    values: DayValues;
}

export interface AckResult {
    applied: boolean;
    /** The row to write when `applied`; otherwise the input row unchanged. */
    row: LedgerRow | null;
}

/**
 * Apply one acked entry to its day's ledger row. Idempotent: an initial entry
 * applies only while `sent_values` is null, top-up `t<n>` only when n is the
 * next sequence number; anything else (a retry, a stale entry) is skipped and
 * leaves the row alone. The echoed `values` are what the phone actually logged,
 * so they — not a recomputation — are what the ledger records.
 */
export function applyAck(
    row: LedgerRow | null,
    entry: AckEntry,
    tz: string,
    now: Date,
): AckResult {
    const parsed = parseEntryId(entry.entry_id);
    if (!parsed || parsed.date !== entry.date) return { applied: false, row };
    const stamp = now.toISOString();
    const values: DayValues = {};
    for (const [k, v] of Object.entries(entry.values)) {
        if (isHealthSyncField(k) && typeof v === "number") {
            values[k] = roundField(k, v);
        }
    }

    if (parsed.kind === "initial") {
        if (row && row.sent_values !== null) return { applied: false, row };
        // Keep the zone /pending stamped on the row: the echoed values were
        // counted in it. Overwriting it with the ack-time zone would hide a
        // set_timezone that landed between /pending and /ack, and the next
        // run would compare totals counted in two zones instead of freezing
        // the day.
        const base = row ? cloneRow(row) : newRow(entry.date, tz);
        return {
            applied: true,
            row: {
                ...base,
                sent_values: values,
                offer_count: 0,
                first_sent_at: stamp,
                last_sent_at: stamp,
            },
        };
    }

    if (!row || row.sent_values === null || parsed.n !== row.topup_seq + 1) {
        return { applied: false, row };
    }
    const next = cloneRow(row);
    const sent = next.sent_values!;
    for (const [k, v] of Object.entries(values) as [
        HealthSyncField,
        number,
    ][]) {
        sent[k] = roundField(k, (sent[k] ?? 0) + v);
    }
    next.topup_seq = parsed.n;
    next.offer_count = 0;
    next.last_sent_at = stamp;
    return { applied: true, row: next };
}

// ---------- request bodies ----------

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

export interface StartBody {
    /** The phone's IANA zone, or null when absent or not a real zone. */
    tz: string | null;
    fields: HealthSyncField[];
    backfill_days: number;
}

/** POST /start: `{ tz?, include_water?, backfill_days? }`, all optional. An
 *  unknown tz is ignored rather than refused (the profile's zone wins anyway). */
export function parseStartBody(body: unknown): Parsed<StartBody> {
    if (body === undefined || body === null) body = {};
    if (!isPlainObject(body)) {
        return {
            ok: false,
            message: "The request body must be a JSON object.",
        };
    }
    let tz: string | null = null;
    if (body.tz !== undefined && body.tz !== null) {
        if (typeof body.tz !== "string") {
            return { ok: false, message: "tz must be a string." };
        }
        const t = body.tz.trim();
        tz = t.length > 0 && t.length <= 64 && validateTz(t) ? t : null;
    }
    const water = body.include_water;
    if (water !== undefined && typeof water !== "boolean") {
        return { ok: false, message: "include_water must be true or false." };
    }
    const backfill = body.backfill_days ?? 0;
    if (
        typeof backfill !== "number" ||
        !Number.isInteger(backfill) ||
        backfill < 0 ||
        backfill > HEALTH_SYNC_MAX_BACKFILL_DAYS
    ) {
        return {
            ok: false,
            message: `backfill_days must be a whole number from 0 to ${HEALTH_SYNC_MAX_BACKFILL_DAYS}.`,
        };
    }
    return {
        ok: true,
        value: {
            tz,
            fields: fieldsForConnect(water === true),
            backfill_days: backfill,
        },
    };
}

export interface ClaimBody {
    claim_code: string;
    device_secret: string;
}

const OPAQUE_RE = /^[A-Za-z0-9_-]{20,200}$/;

/** POST /claim: `{ claim_code, device_secret }`, both opaque base64url. */
export function parseClaimBody(body: unknown): Parsed<ClaimBody> {
    if (!isPlainObject(body)) {
        return {
            ok: false,
            message: "The request body must be a JSON object.",
        };
    }
    const code =
        typeof body.claim_code === "string" ? body.claim_code.trim() : "";
    const secret =
        typeof body.device_secret === "string" ? body.device_secret : "";
    if (!OPAQUE_RE.test(code) || !OPAQUE_RE.test(secret)) {
        return {
            ok: false,
            message:
                "claim_code and device_secret are required. Run the shortcut again to connect.",
        };
    }
    return { ok: true, value: { claim_code: code, device_secret: secret } };
}

export interface AckBody {
    entries: AckEntry[];
    done: boolean;
    /** The `lease_until` /pending returned. `done: true` frees the lease only
     *  when it is still this one, so a late ack from a run whose lease lapsed
     *  never frees the lease a newer run holds. Absent when not sent. */
    lease_until?: string;
}

/** POST /ack: `{ entries: [{ entry_id, date, values }], done?, lease_until? }`. At most
 *  HEALTH_SYNC_MAX_ACK_ENTRIES entries (zero is fine with `done: true`, to
 *  release the lease); every value a finite number in [0, the field's cap] for
 *  a field this link sends. */
export function parseAckBody(
    body: unknown,
    fields: readonly HealthSyncField[],
): Parsed<AckBody> {
    if (!isPlainObject(body)) {
        return {
            ok: false,
            message: "The request body must be a JSON object.",
        };
    }
    const done = body.done ?? false;
    if (typeof done !== "boolean") {
        return { ok: false, message: "done must be true or false." };
    }
    const lease = body.lease_until;
    if (
        lease !== undefined &&
        lease !== null &&
        (typeof lease !== "string" ||
            lease.length > 64 ||
            !Number.isFinite(Date.parse(lease)))
    ) {
        return {
            ok: false,
            message: "lease_until must be the lease_until /pending returned.",
        };
    }
    const raw = body.entries ?? [];
    if (!Array.isArray(raw)) {
        return { ok: false, message: "entries must be an array." };
    }
    if (raw.length > HEALTH_SYNC_MAX_ACK_ENTRIES) {
        return {
            ok: false,
            message: `At most ${HEALTH_SYNC_MAX_ACK_ENTRIES} entries per request.`,
        };
    }
    const entries: AckEntry[] = [];
    for (const [i, e] of raw.entries()) {
        const where = `entries[${i}]`;
        if (!isPlainObject(e)) {
            return { ok: false, message: `${where} must be an object.` };
        }
        const id = typeof e.entry_id === "string" ? e.entry_id : "";
        const parsed = parseEntryId(id);
        if (!parsed) {
            return {
                ok: false,
                message: `${where}.entry_id must be an entry_id from /pending.`,
            };
        }
        if (e.date !== parsed.date) {
            return {
                ok: false,
                message: `${where}.date must match its entry_id.`,
            };
        }
        if (!isPlainObject(e.values)) {
            return { ok: false, message: `${where}.values must be an object.` };
        }
        const values: DayValues = {};
        for (const [k, v] of Object.entries(e.values)) {
            if (!isHealthSyncField(k) || !fields.includes(k)) {
                return {
                    ok: false,
                    message: `${where}.values.${k} is not a field this connection sends.`,
                };
            }
            const max = HEALTH_SYNC_FIELD_SPECS[k].ackMax;
            if (
                typeof v !== "number" ||
                !Number.isFinite(v) ||
                v < 0 ||
                v > max
            ) {
                return {
                    ok: false,
                    message: `${where}.values.${k} must be a number from 0 to ${max}.`,
                };
            }
            values[k] = v;
        }
        if (Object.keys(values).length === 0) {
            return { ok: false, message: `${where}.values is empty.` };
        }
        entries.push({ entry_id: id, date: parsed.date, values });
    }
    const value: AckBody = { entries, done };
    if (typeof lease === "string") value.lease_until = lease;
    return { ok: true, value };
}

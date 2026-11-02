/**
 * Apple Health activity sync: the pure rules for POST
 * /api/v1/health-sync/activity, which the opt-in "Nutrition MCP Activity"
 * shortcut calls with its Active Energy total for today and the days before.
 * No Supabase, no Hono, never imports mcp.ts. The HTTP half is in
 * src/health-sync-routes.ts, the table in
 * supabase/migrations/20261103120000_health_activity_sync.sql.
 *
 * The rules that matter:
 *
 * - A synced day is ONE row, the day's whole Health total, replaced on every
 *   sync and never added to. Sending the same days twice is a no-op, and a
 *   day that grew since the last sync is simply rewritten.
 * - 0 writes nothing and removes nothing. The shortcut's Find Health Samples
 *   (with Fill Missing) reports 0 both for a day with no samples and, as far
 *   as a shortcut can tell, for a read Health refused, so a 0 is no evidence
 *   that an earlier total was wrong.
 * - Only today and the 6 days before, in the account's timezone. A future
 *   date or an older one is skipped rather than refused, so one bad day never
 *   costs the others.
 * - The row's logged_at is local noon of its date, so it lands on that date
 *   in every reader (they bucket by dateInTz) and a small timezone difference
 *   between the phone and the profile cannot move it to a neighbouring day.
 */

import { isCalendarDate } from "./health-sync.js";
import { ACTIVE_KCAL_MAX } from "./activity.js";
import { dateInTz, shiftLocalDate, validateTz, zonedHourUtc } from "./tz.js";

/** The shortcut's exact name: the callback page reopens it by this name. */
export const HEALTH_ACTIVITY_SHORTCUT_NAME = "Nutrition MCP Activity";

/** Days accepted: today and this many days before it. */
export const HEALTH_ACTIVITY_WINDOW_DAYS = 7;

/** Most days one request may carry. */
export const HEALTH_ACTIVITY_MAX_DAYS = 8;

/** The `source` value of a row the activity sync wrote. */
export const HEALTH_ACTIVITY_SOURCE = "apple_health";

/** Local hour a synced day's row is stamped at. */
export const HEALTH_ACTIVITY_STAMP_HOUR = 12;

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export interface ActivityDayIn {
    date: string;
    /** Whole kilocalories, 0 or more (rounded from what was sent). */
    kcal: number;
}

export interface ActivityBody {
    /** The phone's IANA zone, or null when absent or not a valid zone. */
    tz: string | null;
    days: ActivityDayIn[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** A kcal figure as the shortcut may send it: a JSON number, or a string of
 *  digits (a Text action can quote it). Null when it is neither. */
function readKcal(v: unknown): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v)) {
        return Number(v);
    }
    return null;
}

/**
 * `{ tz, days: [{ date, active_kcal }] }`. The shape is checked strictly —
 * a malformed body is refused with a message the shortcut shows — but values
 * that are merely out of bounds pass through to planActivityWrites, which
 * skips that one day.
 */
export function parseActivityBody(body: unknown): Parsed<ActivityBody> {
    if (!isPlainObject(body)) {
        return {
            ok: false,
            message: "The request body must be a JSON object.",
        };
    }
    let tz: string | null = null;
    if (typeof body.tz === "string") {
        const t = body.tz.trim();
        tz = t.length > 0 && t.length <= 64 && validateTz(t) ? t : null;
    }
    const raw = body.days;
    if (!Array.isArray(raw) || raw.length === 0) {
        return {
            ok: false,
            message:
                "days must be a list of { date, active_kcal }. Check the shortcut's Text action before Get Contents of URL.",
        };
    }
    if (raw.length > HEALTH_ACTIVITY_MAX_DAYS) {
        return {
            ok: false,
            message: `Send at most ${HEALTH_ACTIVITY_MAX_DAYS} days at a time.`,
        };
    }
    const days: ActivityDayIn[] = [];
    for (const d of raw) {
        if (!isPlainObject(d)) {
            return {
                ok: false,
                message: "Each day must be { date, active_kcal }.",
            };
        }
        const date = typeof d.date === "string" ? d.date.trim() : "";
        if (!isCalendarDate(date)) {
            return {
                ok: false,
                message: `Each date must be YYYY-MM-DD (got ${JSON.stringify(d.date ?? null).slice(0, 40)}).`,
            };
        }
        const kcal = readKcal(d.active_kcal);
        if (kcal === null || kcal < 0) {
            return {
                ok: false,
                message: `active_kcal for ${date} must be a number of kilocalories, 0 or more.`,
            };
        }
        days.push({ date, kcal: Math.round(kcal) });
    }
    return { ok: true, value: { tz, days } };
}

export type ActivitySkipReason = "zero" | "outside_window" | "too_high";

export interface ActivityWrite {
    date: string;
    kcal: number;
    logged_at: string;
    credit_pct: number;
}

export interface ActivityPlan {
    writes: ActivityWrite[];
    skipped: { date: string; reason: ActivitySkipReason }[];
    /** Latest date accepted (written, or a 0 inside the window), or null. */
    through: string | null;
}

/**
 * What to write for a parsed body. A date sent twice keeps its last value.
 * `creditPct` is the account's current credit share; the database keeps a
 * day's first snapshot when the day already has a row (see the migration).
 */
export function planActivityWrites(input: {
    days: readonly ActivityDayIn[];
    now: Date;
    tz: string;
    creditPct: number;
}): ActivityPlan {
    const { now, tz, creditPct } = input;
    const today = dateInTz(now, tz);
    const oldest = shiftLocalDate(today, -(HEALTH_ACTIVITY_WINDOW_DAYS - 1));
    const byDate = new Map<string, number>();
    for (const d of input.days) {
        byDate.delete(d.date);
        byDate.set(d.date, d.kcal);
    }
    const writes: ActivityWrite[] = [];
    const skipped: ActivityPlan["skipped"] = [];
    let through: string | null = null;
    for (const [date, kcal] of byDate) {
        if (date > today || date < oldest) {
            skipped.push({ date, reason: "outside_window" });
            continue;
        }
        if (through === null || date > through) through = date;
        if (kcal === 0) {
            skipped.push({ date, reason: "zero" });
            continue;
        }
        if (kcal > ACTIVE_KCAL_MAX) {
            skipped.push({ date, reason: "too_high" });
            continue;
        }
        writes.push({
            date,
            kcal,
            logged_at: zonedHourUtc(
                date,
                tz,
                HEALTH_ACTIVITY_STAMP_HOUR,
            ).toISOString(),
            credit_pct: creditPct,
        });
    }
    writes.sort((a, b) => (a.date < b.date ? -1 : 1));
    skipped.sort((a, b) => (a.date < b.date ? -1 : 1));
    return { writes, skipped, through };
}

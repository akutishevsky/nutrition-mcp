export function validateTz(tz: string): boolean {
    try {
        // The TZ constructor throws RangeError on unknown identifiers.
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

/** Current local date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(tz: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

/** Local date (YYYY-MM-DD) of an absolute instant in the given IANA timezone. */
export function dateInTz(instant: Date | string, tz: string): string {
    const d = instant instanceof Date ? instant : new Date(instant);
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(d);
}

/**
 * Local wall-clock timestamp ("YYYY-MM-DD HH:mm:ss") of an absolute instant in
 * the given IANA timezone. With tz="UTC" this yields the raw UTC time.
 */
export function formatLocalDateTime(
    instant: Date | string,
    tz: string,
): string {
    const d = instant instanceof Date ? instant : new Date(instant);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const hour = get("hour") === "24" ? "00" : get("hour");
    return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}:${get("second")}`;
}

/** Local hour (0-23) of an absolute instant in the given IANA timezone. */
export function hourInTz(instant: Date | string, tz: string): number {
    const d = instant instanceof Date ? instant : new Date(instant);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
    }).formatToParts(d);
    const h = Number(parts.find((p) => p.type === "hour")!.value);
    return h === 24 ? 0 : h;
}

/** Local day-of-week (0=Sun..6=Sat) of an absolute instant in the given IANA timezone. */
export function dowInTz(instant: Date | string, tz: string): number {
    const d = instant instanceof Date ? instant : new Date(instant);
    const name = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
    }).format(d);
    const map: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };
    return map[name] ?? 0;
}

/**
 * Wall-clock fields of an absolute instant in `tz`, re-encoded as a UTC
 * timestamp. This is the primitive the offset math is built on: the zone's
 * offset at instant `t` is `wallAsUtc(t) - t`.
 */
function wallAsUtc(instantMs: number, tz: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(new Date(instantMs));
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    const hour = get("hour") === 24 ? 0 : get("hour");
    return Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        hour,
        get("minute"),
        get("second"),
    );
}

/**
 * UTC instant for a local wall-clock time in `tz`.
 *
 * Two-candidate resolution. A single offset probe is not enough: probing at the
 * wall time re-read as UTC samples the offset at the wrong instant whenever a
 * transition falls between that probe and the real answer, which is the normal
 * case for zones that switch at or near local midnight (Australia/Lord_Howe,
 * Asia/Gaza, Africa/Cairo, Asia/Tehran, Pacific/Fiji). Iterating naively
 * instead breaks zones that spring forward exactly at midnight
 * (America/Havana), so we generate both candidates and keep the ones whose
 * wall clock actually round-trips.
 *
 * `gap` marks a wall time that does not exist (skipped by spring-forward); the
 * later candidate is returned, i.e. the clock jumps forward as it does in
 * reality. `ambiguous` marks a wall time that occurs twice (fall-back); the
 * earlier instant is returned. Note only gaps are detected reliably —
 * detecting every fold would need a wider search, and a fold is a <=1h
 * difference that never changes the calendar day, so it does not affect
 * day bucketing.
 */
export function zonedWallClockToUtc(
    y: number,
    mo: number,
    d: number,
    hh: number,
    mi: number,
    se: number,
    tz: string,
): { instant: Date; gap: boolean; ambiguous: boolean } {
    const want = Date.UTC(y, mo - 1, d, hh, mi, se);
    const c1 = want - (wallAsUtc(want, tz) - want);
    const c2 = want - (wallAsUtc(c1, tz) - c1);
    const candidates = c1 === c2 ? [c1] : [c1, c2];
    const valid = candidates.filter((c) => wallAsUtc(c, tz) === want);

    if (valid.length === 0) {
        // Nonexistent local time: take the later candidate so the result sits
        // after the jump rather than before it.
        return {
            instant: new Date(Math.max(c1, c2)),
            gap: true,
            ambiguous: false,
        };
    }
    if (valid.length > 1) {
        return {
            instant: new Date(Math.min(...valid)),
            gap: false,
            ambiguous: true,
        };
    }
    return { instant: new Date(valid[0]!), gap: false, ambiguous: false };
}

/** Parse a YYYY-MM-DD string into numeric parts, throwing on junk. */
function splitDate(date: string): [number, number, number] {
    const [y, m, d] = date.split("-").map(Number);
    if (y == null || m == null || d == null || Number.isNaN(y + m + d)) {
        throw new Error(`Invalid date string: ${date}`);
    }
    return [y, m, d];
}

/**
 * UTC instant corresponding to 00:00:00 local on `date` in `tz`.
 * Works correctly across DST transitions, including midnight ones.
 */
export function zonedDayStartUtc(date: string, tz: string): Date {
    const [y, m, d] = splitDate(date);
    return zonedWallClockToUtc(y, m, d, 0, 0, 0, tz).instant;
}

/**
 * UTC instant corresponding to `hour`:00:00 local on `date` in `tz`. Used to
 * anchor a date-only value at a specific local hour; note that day-start plus
 * N hours is NOT the same thing across a DST transition.
 */
export function zonedHourUtc(date: string, tz: string, hour: number): Date {
    const [y, m, d] = splitDate(date);
    return zonedWallClockToUtc(y, m, d, hour, 0, 0, tz).instant;
}

/** Exclusive upper bound: midnight of the day AFTER `date` in `tz`, as UTC. */
export function zonedNextDayStartUtc(date: string, tz: string): Date {
    const [y, m, d] = splitDate(date);
    const next = new Date(Date.UTC(y, m - 1, d));
    next.setUTCDate(next.getUTCDate() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    return zonedDayStartUtc(nextStr, tz);
}

// ---------- logged_at resolution ----------

const BARE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATETIME_RE =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;
const OFFSET_DATETIME_RE =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

/** Reject calendar dates that Date.UTC would silently roll over (2026-13-01
 *  becomes 2027-01-01, 2026-02-30 becomes 2026-03-02). */
function isRealCalendarDate(y: number, mo: number, d: number): boolean {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
    const probe = new Date(Date.UTC(y, mo - 1, d));
    return (
        probe.getUTCFullYear() === y &&
        probe.getUTCMonth() === mo - 1 &&
        probe.getUTCDate() === d
    );
}

/** Why a `logged_at` string could not be placed on the timeline. Callers map
 *  these to their own error shape: the bulk importer to a per-row `RowError`,
 *  the manual write tools to a thrown tool error. */
export type LoggedAtFailure =
    | "missing"
    | "bare_date_not_a_calendar_date"
    | "local_time_does_not_exist"
    | "offset_date_not_a_calendar_date"
    | "unrecognized_format"
    | "unparseable"
    | "local_date_absent_in_zone";

export interface ParsedLoggedAt {
    instant: Date;
    /** The input was a date with no time, so it was anchored at local noon. */
    fromBareDate: boolean;
    /** True when `tz` was needed to place this instant, i.e. the input was a
     *  bare date or an offset-less local time. False when the input carried its
     *  own offset and is therefore timezone-independent. */
    usedProfileTimezone: boolean;
    /** Local calendar date the input named, or null when it carried an offset
     *  and therefore named an instant rather than a local day. */
    localDate: string | null;
}

/**
 * Place a caller-supplied timestamp on the timeline, reading offset-less input
 * in `tz`. This is the one resolver every write path shares — the bulk importer
 * (`resolveLoggedAt` in src/import.ts) and the manual log/update tools
 * (`resolveWriteLoggedAt` below) differ only in how they report failure and in
 * the window they accept around now. Sharing it is what makes one string mean
 * one instant: the same "2026-01-05 08:30:00" has to land on the same local day
 * whether the user typed it at log_meal or a file carried it into
 * bulk_import_meals, because every read path buckets by `dateInTz`.
 *
 * Three accepted forms:
 *   - `YYYY-MM-DD`                -> local noon in `tz` (noon maximizes the
 *                                    slack before any offset change could move
 *                                    the calendar day)
 *   - `YYYY-MM-DD[T ]HH:mm[:ss]`  -> that local wall clock in `tz`
 *   - full ISO 8601 with Z/offset -> taken as the absolute instant it names
 *
 * Offset-less local time is accepted deliberately rather than rejected: no
 * fitness export carries an offset, and a model that knows the wall-clock time
 * the user just told it does not know the zone's historical offset for that
 * date. The server already knows the timezone, so it resolves it here. Handing
 * such a string straight to Postgres instead reads it in the session zone (UTC)
 * and silently files the entry hours away, on the wrong local day.
 */
export function parseLoggedAt(
    raw: string | undefined,
    tz: string,
):
    | { ok: true; value: ParsedLoggedAt }
    | { ok: false; reason: LoggedAtFailure } {
    if (raw === undefined || raw.trim() === "") {
        return { ok: false, reason: "missing" };
    }
    const text = raw.trim();

    let instant: Date;
    let fromBareDate = false;
    let localDate: string | null = null;

    const bare = BARE_DATE_RE.exec(text);
    const local = LOCAL_DATETIME_RE.exec(text);
    const offset = OFFSET_DATETIME_RE.exec(text);

    if (bare) {
        const [y, mo, d] = [Number(bare[1]), Number(bare[2]), Number(bare[3])];
        if (!isRealCalendarDate(y, mo, d)) {
            return { ok: false, reason: "bare_date_not_a_calendar_date" };
        }
        instant = zonedHourUtc(text, tz, 12);
        fromBareDate = true;
        localDate = text;
    } else if (local) {
        const y = Number(local[1]);
        const mo = Number(local[2]);
        const d = Number(local[3]);
        const hh = Number(local[4]);
        const mi = Number(local[5]);
        const se = Number(local[6] ?? 0);
        if (!isRealCalendarDate(y, mo, d) || hh > 23 || mi > 59 || se > 59) {
            return { ok: false, reason: "local_time_does_not_exist" };
        }
        instant = zonedWallClockToUtc(y, mo, d, hh, mi, se, tz).instant;
        localDate = `${local[1]}-${local[2]}-${local[3]}`;
    } else if (offset) {
        const y = Number(offset[1]);
        const mo = Number(offset[2]);
        const d = Number(offset[3]);
        if (!isRealCalendarDate(y, mo, d)) {
            return { ok: false, reason: "offset_date_not_a_calendar_date" };
        }
        instant = new Date(text);
    } else {
        return { ok: false, reason: "unrecognized_format" };
    }

    if (Number.isNaN(instant.getTime())) {
        return { ok: false, reason: "unparseable" };
    }

    // The round trip is the property every read path depends on. A handful of
    // (date, zone) pairs are calendar days that never existed in that zone —
    // dateline shifts such as Pacific/Apia 2011-12-30 — and this is what turns
    // those into an explicit error instead of a row on the wrong day.
    if (localDate !== null && dateInTz(instant, tz) !== localDate) {
        return { ok: false, reason: "local_date_absent_in_zone" };
    }

    return {
        ok: true,
        value: {
            instant,
            fromBareDate,
            usedProfileTimezone: localDate !== null,
            localDate,
        },
    };
}

export const LOGGED_AT_FIX =
    'Use "YYYY-MM-DD" for a date with no known time, "YYYY-MM-DDTHH:mm" for a local time, or a full ISO 8601 string with an offset such as "2026-01-05T08:30:00+02:00".';

/** Human-readable cause for each failure, shared by both callers so the
 *  importer's per-row report and a tool error say the same thing. */
export function loggedAtFailureReason(
    reason: LoggedAtFailure,
    tz: string,
): string {
    switch (reason) {
        case "missing":
            return "no value was given";
        case "bare_date_not_a_calendar_date":
            return "that calendar date does not exist (a day/month swap is the usual cause)";
        case "local_time_does_not_exist":
            return "that local date or time does not exist";
        case "offset_date_not_a_calendar_date":
            return "that calendar date does not exist";
        case "unrecognized_format":
            return "unrecognized format";
        case "unparseable":
            return "could not be parsed";
        case "local_date_absent_in_zone":
            return `that local date does not exist in timezone ${tz}`;
    }
}

/**
 * Resolve `logged_at` for a manual write tool (log_meal, update_meal,
 * log_water, log_weight, update_weight), throwing on anything unusable.
 *
 * Same placement rules as the bulk importer, deliberately. The bounds are where
 * they part: the importer is backfilling history and takes anything from 20
 * years back to 48 hours ahead, while a manual entry has no past bound at all
 * (an old weight is a legitimate thing to log) and a tight future one. A manual entry is a claim about a clock
 * that has already ticked, so anything past a small skew tolerance is a
 * mis-dated entry that would silently become the user's "latest" reading. The
 * exception is a bare date: local noon is an anchor for an unknown time, not a
 * claim, so today's date logged in the morning is fine and only a genuinely
 * future *calendar day* is rejected. `nowMs` is injected for testability.
 */
export class LoggedAtError extends Error {
    /** True when `tz` was actually used to place the value, i.e. it carried no
     *  offset. Lets the caller add "…and this account has no timezone set" only
     *  when the timezone is what made the value unusable — an unparseable
     *  string was never placed anywhere and that hint would only mislead. */
    readonly usedProfileTimezone: boolean;

    constructor(message: string, usedProfileTimezone: boolean) {
        super(message);
        this.name = "LoggedAtError";
        this.usedProfileTimezone = usedProfileTimezone;
    }
}

export function resolveWriteLoggedAt(
    raw: string,
    tz: string,
    nowMs: number,
    toleranceMs: number = 5 * 60 * 1000,
): ParsedLoggedAt {
    const parsed = parseLoggedAt(raw, tz);
    if (!parsed.ok) {
        throw new LoggedAtError(
            `logged_at is invalid (${JSON.stringify(raw)}): ${loggedAtFailureReason(parsed.reason, tz)}. ${LOGGED_AT_FIX}`,
            false,
        );
    }
    const value = parsed.value;
    const future = value.fromBareDate
        ? value.localDate! > dateInTz(new Date(nowMs), tz)
        : value.instant.getTime() > nowMs + toleranceMs;
    if (future) {
        throw new LoggedAtError(
            `logged_at is in the future (${raw}). Log the time the entry was actually recorded.`,
            value.usedProfileTimezone,
        );
    }
    return value;
}

/** Shift a local YYYY-MM-DD date by N days, returning YYYY-MM-DD. No TZ needed. */
export function shiftLocalDate(date: string, days: number): string {
    const [y, m, d] = date.split("-").map(Number);
    if (y == null || m == null || d == null) {
        throw new Error(`Invalid date string: ${date}`);
    }
    const next = new Date(Date.UTC(y, m - 1, d));
    next.setUTCDate(next.getUTCDate() + days);
    return next.toISOString().slice(0, 10);
}

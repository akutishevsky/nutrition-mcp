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
const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(tz: string): Intl.DateTimeFormat {
    const existing = wallClockFormatters.get(tz);
    if (existing) return existing;
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    wallClockFormatters.set(tz, formatter);
    return formatter;
}

function wallAsUtc(instantMs: number, tz: string): number {
    const parts = wallClockFormatter(tz).formatToParts(new Date(instantMs));
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

/**
 * Validate a client-supplied `logged_at` ISO string: it must parse, and must
 * not be in the future beyond a small clock-skew tolerance. Prevents a
 * mis-dated entry from silently becoming the user's "latest" reading. `nowMs`
 * is injected for testability.
 */
export function validateLoggedAt(
    iso: string,
    nowMs: number,
    toleranceMs: number = 5 * 60 * 1000,
): void {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) {
        throw new Error(
            `Invalid logged_at timestamp: ${iso}. Use an ISO 8601 string.`,
        );
    }
    if (t > nowMs + toleranceMs) {
        throw new Error(
            `logged_at is in the future (${iso}). Log the time the measurement was actually taken.`,
        );
    }
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

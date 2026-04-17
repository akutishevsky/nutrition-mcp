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
 * UTC instant corresponding to 00:00:00 local on `date` in `tz`.
 * Works correctly across DST transitions.
 */
export function zonedDayStartUtc(date: string, tz: string): Date {
    const [y, m, d] = date.split("-").map(Number);
    if (y == null || m == null || d == null) {
        throw new Error(`Invalid date string: ${date}`);
    }
    const utcGuess = Date.UTC(y, m - 1, d, 0, 0, 0);
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(new Date(utcGuess));
    const getPart = (t: string) =>
        Number(parts.find((p) => p.type === t)!.value);
    let lh = getPart("hour");
    if (lh === 24) lh = 0;
    const asUtc = Date.UTC(
        getPart("year"),
        getPart("month") - 1,
        getPart("day"),
        lh,
        getPart("minute"),
        getPart("second"),
    );
    const offsetMs = asUtc - utcGuess;
    return new Date(utcGuess - offsetMs);
}

/** Exclusive upper bound: midnight of the day AFTER `date` in `tz`, as UTC. */
export function zonedNextDayStartUtc(date: string, tz: string): Date {
    const [y, m, d] = date.split("-").map(Number);
    if (y == null || m == null || d == null) {
        throw new Error(`Invalid date string: ${date}`);
    }
    const next = new Date(Date.UTC(y, m - 1, d));
    next.setUTCDate(next.getUTCDate() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    return zonedDayStartUtc(nextStr, tz);
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

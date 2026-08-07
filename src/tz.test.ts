import { test, expect } from "bun:test";
import {
    validateTz,
    dateInTz,
    formatLocalDateTime,
    hourInTz,
    dowInTz,
    zonedDayStartUtc,
    zonedNextDayStartUtc,
    zonedHourUtc,
    zonedWallClockToUtc,
    shiftLocalDate,
    parseLoggedAt,
    resolveWriteLoggedAt,
} from "./tz.js";

test("dateInTz maps an instant to the local calendar day", () => {
    // 07:00Z = 23:00 the previous day in LA, same day in UTC/Tokyo.
    const inst = "2024-03-01T07:00:00Z";
    expect(dateInTz(inst, "America/Los_Angeles")).toBe("2024-02-29");
    expect(dateInTz(inst, "UTC")).toBe("2024-03-01");
    expect(dateInTz(inst, "Asia/Tokyo")).toBe("2024-03-01");
});

test("formatLocalDateTime renders wall-clock time, normalizing hour 24 to 00", () => {
    expect(
        formatLocalDateTime("2024-03-01T07:00:00Z", "America/Los_Angeles"),
    ).toBe("2024-02-29 23:00:00");
    // Exactly midnight LA (PST UTC-8).
    expect(
        formatLocalDateTime("2024-03-01T08:00:00Z", "America/Los_Angeles"),
    ).toBe("2024-03-01 00:00:00");
});

test("hourInTz and dowInTz reflect local time", () => {
    expect(hourInTz("2024-03-01T07:00:00Z", "America/Los_Angeles")).toBe(23);
    expect(hourInTz("2024-03-01T08:00:00Z", "America/Los_Angeles")).toBe(0);
    expect(dowInTz("2024-03-01T12:00:00Z", "UTC")).toBe(5); // Friday
});

test("zonedDayStartUtc handles DST transitions and fractional offsets", () => {
    expect(
        zonedDayStartUtc("2024-03-01", "America/Los_Angeles").toISOString(),
    ).toBe("2024-03-01T08:00:00.000Z");
    // 2024-03-10 is the spring-forward day; midnight is still PST (UTC-8).
    expect(
        zonedDayStartUtc("2024-03-10", "America/Los_Angeles").toISOString(),
    ).toBe("2024-03-10T08:00:00.000Z");
    // The next day is PDT (UTC-7).
    expect(
        zonedDayStartUtc("2024-03-11", "America/Los_Angeles").toISOString(),
    ).toBe("2024-03-11T07:00:00.000Z");
    expect(zonedDayStartUtc("2024-03-01", "Asia/Kolkata").toISOString()).toBe(
        "2024-02-29T18:30:00.000Z",
    );
    expect(zonedDayStartUtc("2024-03-01", "Asia/Kathmandu").toISOString()).toBe(
        "2024-02-29T18:15:00.000Z",
    );
});

test("zonedDayStartUtc handles zones whose DST transition is at local midnight", () => {
    // Regression: a single offset probe (taken at midnight UTC) samples the
    // offset AFTER the transition while local midnight is still before it, so
    // the day window started up to an hour early and late-night meals were
    // counted in the wrong day.
    expect(
        zonedDayStartUtc("2025-10-05", "Australia/Lord_Howe").toISOString(),
    ).toBe("2025-10-04T13:30:00.000Z"); // 30-minute DST shift
    expect(zonedDayStartUtc("2025-04-12", "Asia/Gaza").toISOString()).toBe(
        "2025-04-11T22:00:00.000Z",
    );
    expect(zonedDayStartUtc("2020-12-20", "Pacific/Fiji").toISOString()).toBe(
        "2020-12-19T12:00:00.000Z",
    );
});

test("zonedWallClockToUtc flags nonexistent local times and jumps forward", () => {
    // These zones spring forward AT midnight, so 00:00 local never occurs;
    // the resolved instant is 01:00 local, matching what clocks actually do.
    const cairo = zonedWallClockToUtc(2023, 4, 28, 0, 0, 0, "Africa/Cairo");
    expect(cairo.gap).toBe(true);
    expect(cairo.instant.toISOString()).toBe("2023-04-27T22:00:00.000Z");

    const tehran = zonedWallClockToUtc(2022, 3, 22, 0, 0, 0, "Asia/Tehran");
    expect(tehran.gap).toBe(true);
    expect(tehran.instant.toISOString()).toBe("2022-03-21T20:30:00.000Z");

    // Naively iterating the offset probe instead of keeping both candidates
    // regresses this one to 2024-03-10T04:00Z (= 23:00 the previous day).
    const havana = zonedWallClockToUtc(2024, 3, 10, 0, 0, 0, "America/Havana");
    expect(havana.gap).toBe(true);
    expect(havana.instant.toISOString()).toBe("2024-03-10T05:00:00.000Z");

    // An ordinary existing wall time is neither a gap nor ambiguous.
    const plain = zonedWallClockToUtc(
        2024,
        3,
        1,
        9,
        30,
        0,
        "America/Los_Angeles",
    );
    expect(plain.gap).toBe(false);
    expect(plain.ambiguous).toBe(false);
    expect(plain.instant.toISOString()).toBe("2024-03-01T17:30:00.000Z");
});

test("zonedHourUtc anchors a date at a local hour, unlike day-start plus N hours", () => {
    // Spring-forward: day start + 12h is 13:00 local, not noon.
    const dayStart = zonedDayStartUtc("2024-03-10", "America/Los_Angeles");
    const plus12 = new Date(dayStart.getTime() + 12 * 3600 * 1000);
    expect(hourInTz(plus12, "America/Los_Angeles")).toBe(13);
    expect(
        hourInTz(
            zonedHourUtc("2024-03-10", "America/Los_Angeles", 12),
            "America/Los_Angeles",
        ),
    ).toBe(12);
    // Fall-back: day start + 12h is 11:00 local.
    const fbStart = zonedDayStartUtc("2024-11-03", "America/Los_Angeles");
    expect(
        hourInTz(
            new Date(fbStart.getTime() + 12 * 3600 * 1000),
            "America/Los_Angeles",
        ),
    ).toBe(11);
    expect(
        hourInTz(
            zonedHourUtc("2024-11-03", "America/Los_Angeles", 12),
            "America/Los_Angeles",
        ),
    ).toBe(12);
    // Fractional offsets still land exactly on the hour.
    expect(
        hourInTz(
            zonedHourUtc("2026-01-15", "Asia/Kathmandu", 12),
            "Asia/Kathmandu",
        ),
    ).toBe(12);
});

test("local noon round-trips to the same calendar date in every IANA zone", () => {
    // The invariant the bulk importer depends on: a date-only value anchored at
    // local noon must read back as that same date via dateInTz.
    const zones = Intl.supportedValuesOf("timeZone");
    const dates = [
        "2024-03-10",
        "2024-11-03",
        "2025-10-05",
        "2025-04-12",
        "2026-03-29",
        "2026-10-25",
        "2022-03-22",
        "2023-04-28",
        "2020-12-20",
    ];
    const failures: string[] = [];
    for (const tz of zones) {
        for (const date of dates) {
            const back = dateInTz(zonedHourUtc(date, tz, 12), tz);
            if (back !== date) failures.push(`${tz} ${date} -> ${back}`);
        }
    }
    expect(failures).toEqual([]);
});

test("zonedNextDayStartUtc is the exclusive upper bound", () => {
    expect(
        zonedNextDayStartUtc("2024-03-01", "America/Los_Angeles").toISOString(),
    ).toBe("2024-03-02T08:00:00.000Z");
});

test("shiftLocalDate does calendar arithmetic across month boundaries", () => {
    expect(shiftLocalDate("2024-02-28", 1)).toBe("2024-02-29"); // leap year
    expect(shiftLocalDate("2024-03-01", -1)).toBe("2024-02-29");
});

// Issue #68: the manual write tools used to hand `logged_at` straight to a
// timestamptz column, where an offset-less string is read in the session zone
// (UTC). A Kyiv user logging 21:00 got 00:00 the NEXT day, and the tool's own
// progress line said so.
test("resolveWriteLoggedAt reads an offset-less time in the profile timezone", () => {
    const now = Date.parse("2026-07-02T12:00:00Z");
    // Kyiv is +03:00 in July.
    expect(
        resolveWriteLoggedAt(
            "2026-07-01T21:00:00",
            "Europe/Kyiv",
            now,
        ).instant.toISOString(),
    ).toBe("2026-07-01T18:00:00.000Z");
    // ...and +02:00 in January, which is why the offset cannot be stamped by a
    // caller that only knows today's.
    expect(
        resolveWriteLoggedAt(
            "2026-01-05T08:30",
            "Europe/Kyiv",
            now,
        ).instant.toISOString(),
    ).toBe("2026-01-05T06:30:00.000Z");
    // A value that names its own offset is timezone-independent.
    const absolute = resolveWriteLoggedAt(
        "2026-07-01T21:00:00+02:00",
        "Europe/Kyiv",
        now,
    );
    expect(absolute.instant.toISOString()).toBe("2026-07-01T19:00:00.000Z");
    expect(absolute.usedProfileTimezone).toBe(false);
});

test("resolveWriteLoggedAt anchors a bare date at local noon", () => {
    const now = Date.parse("2026-07-02T12:00:00Z");
    // Midnight would fall on the PREVIOUS local day for every negative-offset
    // zone; noon has half a day of slack on either side.
    const la = resolveWriteLoggedAt("2026-07-01", "America/Los_Angeles", now);
    expect(la.instant.toISOString()).toBe("2026-07-01T19:00:00.000Z");
    expect(dateInTz(la.instant, "America/Los_Angeles")).toBe("2026-07-01");
    expect(la.fromBareDate).toBe(true);
});

test("resolveWriteLoggedAt bounds the future by clock time, but a bare date by calendar day", () => {
    const now = Date.parse("2026-07-02T12:00:00Z");
    // An explicit time is a claim about a clock that has already ticked.
    expect(() =>
        resolveWriteLoggedAt("2026-07-02T12:00:00Z", "UTC", now),
    ).not.toThrow();
    expect(() =>
        resolveWriteLoggedAt("2026-07-02T12:04:00Z", "UTC", now),
    ).not.toThrow(); // within the 5-minute skew tolerance
    expect(() =>
        resolveWriteLoggedAt("2026-07-02T12:30:00Z", "UTC", now),
    ).toThrow(/future/);
    expect(() =>
        resolveWriteLoggedAt("2027-01-01T00:00:00Z", "UTC", now),
    ).toThrow(/future/);

    // A bare date's noon is an anchor for an unknown time, not a claim, so
    // today logged in the morning must not be rejected as "in the future"...
    const morning = Date.parse("2026-07-02T05:00:00Z");
    expect(() =>
        resolveWriteLoggedAt("2026-07-02", "UTC", morning),
    ).not.toThrow();
    // ...while a genuinely future calendar day still is.
    expect(() => resolveWriteLoggedAt("2026-07-03", "UTC", morning)).toThrow(
        /future/,
    );
    // "Today" is the user's today: 05:00Z is already 2026-07-02 in Kyiv but
    // still 2026-07-01 in Los Angeles.
    expect(() =>
        resolveWriteLoggedAt("2026-07-02", "America/Los_Angeles", morning),
    ).toThrow(/future/);
});

test("resolveWriteLoggedAt accepts fractional seconds on the offset-less form", () => {
    // A model that truncates its own toISOString() emits exactly this shape.
    // The offset-carrying branch has always taken fractional seconds, so
    // rejecting them here was an arbitrary split between the two forms.
    const now = Date.parse("2026-07-02T12:00:00Z");
    expect(
        resolveWriteLoggedAt(
            "2026-07-01T21:00:00.123",
            "Europe/Kyiv",
            now,
        ).instant.toISOString(),
    ).toBe("2026-07-01T18:00:00.000Z");
});

test("resolveWriteLoggedAt rejects what it cannot place", () => {
    const now = Date.parse("2026-07-02T12:00:00Z");
    for (const bad of [
        "not-a-date",
        "2026-13-01",
        "2026-02-30",
        "2026-1-5",
        "07/02/2026",
        "",
    ]) {
        expect(() => resolveWriteLoggedAt(bad, "UTC", now)).toThrow(
            /logged_at is invalid/,
        );
    }
    // Samoa skipped 2011-12-30 entirely; without the round-trip assertion this
    // would silently land on the 31st.
    expect(() =>
        resolveWriteLoggedAt("2011-12-30", "Pacific/Apia", now),
    ).toThrow(/does not exist in timezone/);
});

test("parseLoggedAt is the single resolver both write paths share", () => {
    // Same string, same instant, whether it arrives via log_meal or
    // bulk_import_meals. Every read path buckets by dateInTz, so a split here
    // would file the same meal on two different days depending on which door
    // the user happened to use.
    const viaCore = parseLoggedAt("2026-01-05 08:30:00", "Europe/Kyiv");
    expect(viaCore.ok).toBe(true);
    if (viaCore.ok) {
        expect(viaCore.value.instant.toISOString()).toBe(
            "2026-01-05T06:30:00.000Z",
        );
        expect(viaCore.value.usedProfileTimezone).toBe(true);
        expect(viaCore.value.localDate).toBe("2026-01-05");
    }
    expect(parseLoggedAt(undefined, "UTC")).toEqual({
        ok: false,
        reason: "missing",
    });
});

test("validateTz accepts IANA names and rejects junk", () => {
    expect(validateTz("America/Los_Angeles")).toBe(true);
    expect(validateTz("UTC")).toBe(true);
    expect(validateTz("Etc/GMT+5")).toBe(true);
    expect(validateTz("Mars/Phobos")).toBe(false);
    expect(validateTz("")).toBe(false);
});

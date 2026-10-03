import { test, expect, describe } from "bun:test";
import {
    HEALTH_SYNC_CLOSE_HOUR,
    HEALTH_SYNC_DEFAULT_FIELDS,
    HEALTH_SYNC_FIELDS,
    HEALTH_SYNC_FIELD_SPECS,
    HEALTH_SYNC_MAX_ACK_ENTRIES,
    HEALTH_SYNC_TOKEN_PREFIX,
    HEALTH_SYNC_WINDOW_DAYS,
    ackWindow,
    applyAck,
    closeInstant,
    computeDayTotals,
    effectiveTimezone,
    entryId,
    fieldsForConnect,
    formatInstantWithOffset,
    lastClosedDate,
    linkExpiresAt,
    looksLikeHealthSyncToken,
    offeringWindow,
    parseAckBody,
    parseClaimBody,
    parseEntryId,
    parseStartBody,
    planPending,
    presentValues,
    roundField,
    sampleLocal,
    shouldTouchLink,
    syncStartDate,
    type DayTotals,
    type HealthSyncField,
    type HealthSyncMeal,
    type LedgerRow,
    type StartBody,
} from "./health-sync.js";

const TZ = "Europe/Kyiv";
const ALL = HEALTH_SYNC_FIELDS as readonly HealthSyncField[];
const DEFAULTS = HEALTH_SYNC_DEFAULT_FIELDS;

function totals(partial: Partial<DayTotals> = {}): DayTotals {
    const t = Object.fromEntries(
        HEALTH_SYNC_FIELDS.map((f) => [f, null]),
    ) as DayTotals;
    return { ...t, ...partial };
}

function row(partial: Partial<LedgerRow> & { date: string }): LedgerRow {
    return {
        timezone: TZ,
        sent_values: null,
        topup_seq: 0,
        offer_count: 0,
        notified: {},
        first_sent_at: null,
        last_sent_at: null,
        ...partial,
    };
}

function meal(
    logged_at: string,
    v: Partial<Omit<HealthSyncMeal, "logged_at">> = {},
): HealthSyncMeal {
    return {
        logged_at,
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        caffeine_mg: null,
        ...v,
    };
}

function plan(
    date: string,
    cur: Partial<DayTotals>,
    ledger: LedgerRow[] = [],
    opts: { fields?: readonly HealthSyncField[]; tz?: string } = {},
) {
    return planPending({
        dates: [date],
        totals: new Map([[date, totals(cur)]]),
        ledger,
        fields: opts.fields ?? DEFAULTS,
        tz: opts.tz ?? TZ,
    });
}

// ---------- constants & fields ----------

describe("constants", () => {
    test("the numbers the docs restate", () => {
        expect(HEALTH_SYNC_CLOSE_HOUR).toBe(5);
        expect(HEALTH_SYNC_WINDOW_DAYS).toBe(7);
        expect(HEALTH_SYNC_TOKEN_PREFIX).toBe("nmhs_");
    });

    test("water is opt-in and alcohol is never a field", () => {
        expect(DEFAULTS).not.toContain("water_ml");
        expect(ALL.some((f) => f.includes("alcohol"))).toBe(false);
        expect(fieldsForConnect(false)).toEqual([...DEFAULTS]);
        expect(fieldsForConnect(true)).toEqual([...ALL]);
    });

    test.each([
        ["energy_kcal", 20],
        ["protein_g", 2],
        ["carbohydrates_g", 2],
        ["fat_g", 2],
        ["fiber_g", 2],
        ["sugar_g", 2],
        ["caffeine_mg", 10],
        ["water_ml", 100],
    ] as const)("%s threshold is %d", (f, thr) => {
        expect(HEALTH_SYNC_FIELD_SPECS[f].threshold).toBe(thr);
    });
});

describe("roundField", () => {
    test.each([
        ["energy_kcal", 2140.5, 2141],
        ["energy_kcal", 2140.4, 2140],
        ["caffeine_mg", 189.6, 190],
        ["water_ml", 249.5, 250],
        ["protein_g", 132.44, 132.4],
        ["protein_g", 132.45, 132.5],
        ["fat_g", -0.04, 0],
    ] as const)("%s %d → %d", (f, v, want) => {
        expect(roundField(f, v)).toBe(want);
        expect(Object.is(roundField(f, v), -0)).toBe(false);
    });
});

// ---------- totals ----------

describe("computeDayTotals", () => {
    test("null when nothing carries a value, 0 when something does", () => {
        const m = computeDayTotals(
            [
                meal("2026-10-02T06:00:00Z", { calories: 500, fiber_g: 0 }),
                meal("2026-10-02T12:00:00Z", { calories: 0.4, protein_g: 20 }),
            ],
            [],
            TZ,
            ["2026-10-02"],
        );
        const t = m.get("2026-10-02")!;
        expect(t.energy_kcal).toBe(500);
        expect(t.protein_g).toBe(20);
        expect(t.fiber_g).toBe(0);
        expect(t.sugar_g).toBeNull();
        expect(t.caffeine_mg).toBeNull();
        expect(t.water_ml).toBeNull();
        expect(presentValues(t, DEFAULTS)).toEqual({
            energy_kcal: 500,
            protein_g: 20,
            fiber_g: 0,
        });
    });

    test("sums raw and rounds once", () => {
        const meals = [0.04, 0.04, 0.04].map((g) =>
            meal("2026-10-02T09:00:00Z", { protein_g: g }),
        );
        const t = computeDayTotals(meals, [], TZ, ["2026-10-02"]);
        expect(t.get("2026-10-02")!.protein_g).toBe(0.1);
    });

    test("buckets by local day in tz and ignores rows outside the dates", () => {
        // 21:30Z on Oct 1 is 00:30 Oct 2 in Kyiv (UTC+3).
        const m = computeDayTotals(
            [
                meal("2026-10-01T21:30:00Z", { calories: 100 }),
                meal("2026-10-01T20:30:00Z", { calories: 7 }),
                meal("2026-10-05T10:00:00Z", { calories: 999 }),
            ],
            [
                { logged_at: "2026-10-02T08:00:00Z", amount_ml: 250 },
                { logged_at: "2026-10-02T09:00:00Z", amount_ml: 300 },
            ],
            TZ,
            ["2026-10-01", "2026-10-02"],
        );
        expect(m.get("2026-10-01")!.energy_kcal).toBe(7);
        expect(m.get("2026-10-02")!.energy_kcal).toBe(100);
        expect(m.get("2026-10-02")!.water_ml).toBe(550);
        expect(m.get("2026-10-01")!.water_ml).toBeNull();
        expect(m.has("2026-10-05")).toBe(false);
    });

    test("a date with nothing logged is all-null", () => {
        const t = computeDayTotals([], [], TZ, ["2026-10-02"]).get(
            "2026-10-02",
        )!;
        expect(Object.values(t).every((v) => v === null)).toBe(true);
    });

    test("water is only present when enabled", () => {
        const t = totals({ energy_kcal: 100, water_ml: 2000 });
        expect(presentValues(t, DEFAULTS)).toEqual({ energy_kcal: 100 });
        expect(presentValues(t, ALL)).toEqual({
            energy_kcal: 100,
            water_ml: 2000,
        });
    });
});

// ---------- time ----------

describe("closeInstant: 05:00 local on D+1, DST-correct", () => {
    test.each([
        // Europe/Kyiv: EEST (+3) until Oct 25 2026 04:00, then EET (+2).
        ["2026-10-01", "Europe/Kyiv", "2026-10-02T02:00:00.000Z"],
        ["2026-10-23", "Europe/Kyiv", "2026-10-24T02:00:00.000Z"],
        ["2026-10-24", "Europe/Kyiv", "2026-10-25T03:00:00.000Z"],
        ["2026-10-25", "Europe/Kyiv", "2026-10-26T03:00:00.000Z"],
        // Spring forward Mar 29 2026 03:00 → 04:00.
        ["2026-03-27", "Europe/Kyiv", "2026-03-28T03:00:00.000Z"],
        ["2026-03-28", "Europe/Kyiv", "2026-03-29T02:00:00.000Z"],
        // New York falls back Nov 1 2026 02:00; day start + 29h would say 04:00.
        ["2026-10-31", "America/New_York", "2026-11-01T10:00:00.000Z"],
        ["2026-03-07", "America/New_York", "2026-03-08T09:00:00.000Z"],
        ["2026-10-01", "UTC", "2026-10-02T05:00:00.000Z"],
        ["2026-12-31", "Asia/Tokyo", "2026-12-31T20:00:00.000Z"],
    ])("%s in %s closes at %s", (date, tz, iso) => {
        expect(closeInstant(date, tz).toISOString()).toBe(iso);
    });
});

describe("lastClosedDate", () => {
    test.each([
        // Kyiv +3: yesterday closes at 02:00Z.
        ["2026-10-03T01:59:59Z", "Europe/Kyiv", "2026-10-01"],
        ["2026-10-03T02:00:00Z", "Europe/Kyiv", "2026-10-02"],
        ["2026-10-02T21:30:00Z", "Europe/Kyiv", "2026-10-01"], // 00:30 Oct 3
        // Fall-back morning: Oct 24 closes at 05:00 EET = 03:00Z.
        ["2026-10-25T02:30:00Z", "Europe/Kyiv", "2026-10-23"],
        ["2026-10-25T03:00:00Z", "Europe/Kyiv", "2026-10-24"],
        ["2026-11-01T09:59:59Z", "America/New_York", "2026-10-30"],
        ["2026-11-01T10:00:00Z", "America/New_York", "2026-10-31"],
        ["2026-10-03T04:59:59Z", "UTC", "2026-10-01"],
        ["2026-10-03T05:00:00Z", "UTC", "2026-10-02"],
    ])("at %s in %s → %s", (now, tz, want) => {
        expect(lastClosedDate(new Date(now), tz)).toBe(want);
    });
});

describe("offeringWindow", () => {
    const NOW = new Date("2026-10-03T07:00:00Z"); // 10:00 Kyiv, Oct 2 closed

    test("seven days ending at the last closed day", () => {
        const w = offeringWindow(NOW, TZ, "2026-01-01");
        expect(w.to).toBe("2026-10-02");
        expect(w.from).toBe("2026-09-26");
        expect(w.dates).toHaveLength(HEALTH_SYNC_WINDOW_DAYS);
        expect(w.dates[0]).toBe("2026-09-26");
        expect(w.dates.at(-1)).toBe("2026-10-02");
        expect(w.nextDayReadyAt.toISOString()).toBe("2026-10-04T02:00:00.000Z");
        expect(formatInstantWithOffset(w.nextDayReadyAt, TZ)).toBe(
            "2026-10-04T05:00:00+03:00",
        );
    });

    test("sync_start_date trims the start", () => {
        const w = offeringWindow(NOW, TZ, "2026-09-30");
        expect(w.dates).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
    });

    test("sync_start_date on the last closed day gives one day", () => {
        expect(offeringWindow(NOW, TZ, "2026-10-02").dates).toEqual([
            "2026-10-02",
        ]);
    });

    test("no backfill: empty until today closes tomorrow at 05:00", () => {
        const start = syncStartDate(NOW, TZ, 0);
        expect(start).toBe("2026-10-03");
        const w = offeringWindow(NOW, TZ, start);
        expect(w.dates).toEqual([]);
        expect(w.from).toBeNull();
        expect(
            offeringWindow(new Date("2026-10-04T01:59:59Z"), TZ, start).dates,
        ).toEqual([]);
        expect(
            offeringWindow(new Date("2026-10-04T02:00:00Z"), TZ, start).dates,
        ).toEqual(["2026-10-03"]);
    });

    test("backfill 7 reaches back to the window's edge", () => {
        const start = syncStartDate(NOW, TZ, 7);
        expect(start).toBe("2026-09-26");
        expect(offeringWindow(NOW, TZ, start).dates[0]).toBe("2026-09-26");
    });

    test("window across fall-back", () => {
        const w = offeringWindow(
            new Date("2026-10-26T06:00:00Z"),
            TZ,
            "2026-10-20",
        );
        expect(w.dates).toEqual([
            "2026-10-20",
            "2026-10-21",
            "2026-10-22",
            "2026-10-23",
            "2026-10-24",
            "2026-10-25",
        ]);
        expect(formatInstantWithOffset(w.nextDayReadyAt, TZ)).toBe(
            "2026-10-27T05:00:00+02:00",
        );
    });

    test("formatInstantWithOffset handles negative and half-hour zones", () => {
        const at = new Date("2026-10-04T10:30:00Z");
        expect(formatInstantWithOffset(at, "America/New_York")).toBe(
            "2026-10-04T06:30:00-04:00",
        );
        expect(formatInstantWithOffset(at, "Asia/Kolkata")).toBe(
            "2026-10-04T16:00:00+05:30",
        );
        expect(formatInstantWithOffset(at, "UTC")).toBe(
            "2026-10-04T10:30:00+00:00",
        );
    });
});

describe("effectiveTimezone", () => {
    test.each([
        ["Europe/Kyiv", "America/New_York", "Europe/Kyiv", "profile"],
        [null, "America/New_York", "America/New_York", "phone"],
        ["Not/AZone", "America/New_York", "America/New_York", "phone"],
        [null, null, "UTC", "utc"],
        [undefined, "bogus", "UTC", "utc"],
    ] as const)("profile=%s phone=%s → %s (%s)", (p, f, tz, source) => {
        expect(effectiveTimezone(p, f)).toEqual({ tz, source });
    });
});

// ---------- link lifetime ----------

describe("link lifetime", () => {
    test("sliding 90 days, capped at created + 365", () => {
        const created = new Date("2026-01-01T00:00:00Z");
        expect(
            linkExpiresAt(created, new Date("2026-02-01T00:00:00Z")),
        ).toEqual(new Date("2026-05-02T00:00:00Z"));
        expect(
            linkExpiresAt(created, new Date("2026-12-01T00:00:00Z")),
        ).toEqual(new Date("2027-01-01T00:00:00Z"));
    });

    test("touch at most hourly", () => {
        const now = new Date("2026-10-03T10:00:00Z");
        expect(shouldTouchLink(null, now)).toBe(true);
        expect(shouldTouchLink(new Date("2026-10-03T09:00:01Z"), now)).toBe(
            false,
        );
        expect(shouldTouchLink(new Date("2026-10-03T09:00:00Z"), now)).toBe(
            true,
        );
    });

    test.each([
        ["nmhs_" + "a".repeat(43), true],
        ["nmhs_short", false],
        ["a".repeat(43), false],
        ["nmhs_" + "a".repeat(42) + "=", false],
        ["Bearer nmhs_" + "a".repeat(43), false],
    ])("token shape %s → %s", (t, ok) => {
        expect(looksLikeHealthSyncToken(t)).toBe(ok);
    });
});

// ---------- entry ids ----------

describe("entry ids and sample times", () => {
    test("initial and top-ups", () => {
        expect(entryId("2026-10-02", "initial")).toBe("2026-10-02:i");
        expect(entryId("2026-10-02", "topup", 3)).toBe("2026-10-02:t3");
        expect(sampleLocal("2026-10-02", "initial")).toBe(
            "2026-10-02 12:00:00",
        );
        expect(sampleLocal("2026-10-02", "topup", 9)).toBe(
            "2026-10-02 12:09:00",
        );
    });

    test.each([
        ["2026-10-02:i", { date: "2026-10-02", kind: "initial" }],
        ["2026-10-02:t1", { date: "2026-10-02", kind: "topup", n: 1 }],
        ["2026-10-02:t9", { date: "2026-10-02", kind: "topup", n: 9 }],
        ["2026-10-02:t0", null],
        ["2026-10-02:t10", null],
        ["2026-02-30:i", null],
        ["2026-10-02", null],
        ["2026-10-02:x", null],
    ] as const)("parseEntryId(%s)", (id, want) => {
        expect(parseEntryId(id)).toEqual(want as never);
    });
});

// ---------- planPending ----------

const D = "2026-10-02";

describe("planPending: initial entries", () => {
    test("no row: initial with enabled non-null values, row created", () => {
        const p = plan(D, {
            energy_kcal: 2140,
            protein_g: 132.4,
            fiber_g: 0,
            water_ml: 1500,
        });
        expect(p.entries).toEqual([
            {
                entry_id: "2026-10-02:i",
                date: D,
                kind: "initial",
                sample_local: "2026-10-02 12:00:00",
                values: { energy_kcal: 2140, protein_g: 132.4, fiber_g: 0 },
            },
        ]);
        expect(p.notices).toEqual([]);
        expect(p.ledgerUpdates).toEqual([
            row({ date: D, offer_count: 1, sent_values: null }),
        ]);
        expect(p.syncedThrough).toBe(null);
    });

    test("a day with nothing gets no entry and no row", () => {
        const p = plan(D, { water_ml: 1500 });
        expect(p.entries).toEqual([]);
        expect(p.ledgerUpdates).toEqual([]);
        expect(p.syncedThrough).toBe(D);
    });

    test("only zeros still send (0 is a value, null is not)", () => {
        const p = plan(D, { caffeine_mg: 0 });
        expect(p.entries[0]!.values).toEqual({ caffeine_mg: 0 });
    });

    test("re-offer bumps offer_count and adopts the current tz", () => {
        const p = plan(D, { energy_kcal: 100 }, [
            row({ date: D, offer_count: 2, timezone: "UTC" }),
        ]);
        expect(p.entries).toHaveLength(1);
        expect(p.ledgerUpdates[0]).toMatchObject({
            offer_count: 3,
            timezone: TZ,
        });
    });

    test("stuck after 3 offers: not offered, one notice, then silent", () => {
        const stuck = row({ date: D, offer_count: 3 });
        const p = plan(D, { energy_kcal: 100 }, [stuck]);
        expect(p.entries).toEqual([]);
        expect(p.notices).toHaveLength(1);
        expect(p.notices[0]).toContain("Health → Sharing → Apps → Shortcuts");
        expect(p.notices[0]).toContain("Oct 2");
        expect(p.ledgerUpdates[0]!.notified.stuck).toBe("2026-10-02:i");
        expect(p.syncedThrough).toBe(null);

        const again = plan(D, { energy_kcal: 100 }, p.ledgerUpdates);
        expect(again.notices).toEqual([]);
        expect(again.entries).toEqual([]);
        expect(again.ledgerUpdates).toEqual([]);
    });

    test("stuck days across the window share one notice", () => {
        const dates = ["2026-10-01", "2026-10-02"];
        const p = planPending({
            dates,
            totals: new Map(dates.map((d) => [d, totals({ energy_kcal: 9 })])),
            ledger: dates.map((d) => row({ date: d, offer_count: 5 })),
            fields: DEFAULTS,
            tz: TZ,
        });
        expect(p.notices).toHaveLength(1);
        expect(p.notices[0]).toStartWith("Oct 1 and Oct 2 did not reach");
        expect(p.syncedThrough).toBeNull();
    });
});

function sentRow(
    sent: LedgerRow["sent_values"],
    extra: Partial<LedgerRow> = {},
): LedgerRow {
    return row({
        date: D,
        sent_values: sent,
        first_sent_at: "2026-10-03T07:00:00.000Z",
        last_sent_at: "2026-10-03T07:00:00.000Z",
        ...extra,
    });
}

describe("planPending: thresholds", () => {
    test.each([
        // field, sent, current, topup delta (null = none), down notice?
        ["energy_kcal", 2000, 2019, null, false],
        ["energy_kcal", 2000, 2020, 20, false],
        ["energy_kcal", 2000, 1981, null, false],
        ["energy_kcal", 2000, 1980, null, true],
        ["protein_g", 100, 101.9, null, false],
        ["protein_g", 100, 102, 2, false],
        ["protein_g", 100, 98, null, true],
        ["protein_g", 100, 98.1, null, false],
        ["caffeine_mg", 100, 109, null, false],
        ["caffeine_mg", 100, 110, 10, false],
        ["caffeine_mg", 100, 90, null, true],
        ["water_ml", 1000, 1099, null, false],
        ["water_ml", 1000, 1100, 100, false],
        ["water_ml", 1000, 900, null, true],
    ] as const)("%s sent %d now %d", (field, sent, current, delta, down) => {
        const p = plan(D, { [field]: current }, [sentRow({ [field]: sent })], {
            fields: ALL,
        });
        if (delta === null) {
            expect(p.entries).toEqual([]);
        } else {
            expect(p.entries).toEqual([
                {
                    entry_id: "2026-10-02:t1",
                    date: D,
                    kind: "topup",
                    sample_local: "2026-10-02 12:01:00",
                    values: { [field]: delta },
                },
            ]);
        }
        expect(p.notices.length).toBe(down ? 1 : 0);
    });

    test("null now / missing in sent count as 0", () => {
        // Sugar never sent before, now 30 g; fiber sent 10 g, now null.
        const p = plan(D, { energy_kcal: 2000, sugar_g: 30 }, [
            sentRow({ energy_kcal: 2000, fiber_g: 10 }),
        ]);
        expect(p.entries[0]!.values).toEqual({ sugar_g: 30 });
        expect(p.notices).toHaveLength(1);
        expect(p.notices[0]).toContain("10 g fiber");
    });

    test("deltas are rounded per field", () => {
        const p = plan(D, { energy_kcal: 2100.4, protein_g: 105.35 }, [
            sentRow({ energy_kcal: 2000, protein_g: 100.1 }),
        ]);
        expect(p.entries[0]!.values).toEqual({
            energy_kcal: 100,
            protein_g: 5.3,
        });
    });

    test("disabled fields are never compared", () => {
        const p = plan(D, { energy_kcal: 2000, water_ml: 5000 }, [
            sentRow({ energy_kcal: 2000 }),
        ]);
        expect(p.entries).toEqual([]);
    });

    test("top-up n uses the next sequence number and 12:0n", () => {
        const p = plan(D, { energy_kcal: 2300 }, [
            sentRow({ energy_kcal: 2200 }, { topup_seq: 4 }),
        ]);
        expect(p.entries[0]).toMatchObject({
            entry_id: "2026-10-02:t5",
            sample_local: "2026-10-02 12:05:00",
        });
    });
});

describe("planPending: decrease notices", () => {
    test("once per field per current value; again when it drops further", () => {
        const first = plan(D, { energy_kcal: 1580, protein_g: 90 }, [
            sentRow({ energy_kcal: 2000, protein_g: 100 }),
        ]);
        expect(first.notices).toEqual([
            "Oct 2 went down by 420 kcal and 10 g protein after it was sent to Apple Health. Health can't lower a value it already has; to correct it, delete the Oct 2 12:00 entries from Shortcuts under Health → Browse → Nutrition → Show All Data (Dietary Energy and Protein) and enter the current total (1,580 kcal and 90 g protein) by hand.",
        ]);
        const r = first.ledgerUpdates[0]!;
        expect(r.notified).toEqual({
            "down:energy_kcal": 1580,
            "down:protein_g": 90,
        });

        const same = plan(D, { energy_kcal: 1580, protein_g: 90 }, [r]);
        expect(same.notices).toEqual([]);
        expect(same.ledgerUpdates).toEqual([]);

        const further = plan(D, { energy_kcal: 1500, protein_g: 90 }, [r]);
        expect(further.notices).toHaveLength(1);
        expect(further.notices[0]).toContain("500 kcal after");
        expect(further.notices[0]).not.toContain("protein");
    });

    test("names the single type and the top-up sample times", () => {
        const p = plan(D, { energy_kcal: 1500 }, [
            sentRow({ energy_kcal: 2000 }, { topup_seq: 2 }),
        ]);
        expect(p.notices[0]).toContain(
            "delete the Oct 2 12:00–12:02 entries from Shortcuts under Health → Browse → Nutrition → Dietary Energy → Show All Data",
        );
        expect(p.notices[0]).not.toContain("Delete All Data");
    });

    test("recovering clears the mark so a later drop is announced again", () => {
        const r = sentRow(
            { energy_kcal: 2000 },
            { notified: { "down:energy_kcal": 1500 } },
        );
        const back = plan(D, { energy_kcal: 2000 }, [r]);
        expect(back.ledgerUpdates[0]!.notified).toEqual({});
        const again = plan(D, { energy_kcal: 1500 }, back.ledgerUpdates);
        expect(again.notices).toHaveLength(1);
    });

    test("a decrease and an increase on the same day: notice plus top-up", () => {
        const p = plan(D, { energy_kcal: 2100, fat_g: 50 }, [
            sentRow({ energy_kcal: 2000, fat_g: 60 }),
        ]);
        expect(p.entries[0]!.values).toEqual({ energy_kcal: 100 });
        expect(p.notices).toHaveLength(1);
        expect(p.notices[0]).toContain("10 g fat");
    });
});

describe("planPending: suspect jump", () => {
    test.each([
        // sent, current, jump?
        [2000, 3000, false], // exactly 1.5×
        [2000, 3001, true],
        [2000, 2900, false], // +900 but under 1.5×
        [1600, 2400, false], // exactly 1.5× and exactly +800
        [1600, 2401, true],
        [1000, 1800, false], // +800 is not more than 800
        [1000, 1801, true],
        [0, 800, false],
        [0, 801, true],
        [500, 1200, false], // over 1.5× but only +700
    ])("sent %d → now %d: jump %p", (sent, current, jump) => {
        const p = plan(D, { energy_kcal: current }, [
            sentRow({ energy_kcal: sent }),
        ]);
        expect(p.entries.length).toBe(jump ? 0 : 1);
        expect(p.notices.length).toBe(jump ? 1 : 0);
    });

    test("held once, then silent; the whole day's top-up is held", () => {
        const first = plan(D, { energy_kcal: 2500, protein_g: 150 }, [
            sentRow({ energy_kcal: 1000, protein_g: 50 }),
        ]);
        expect(first.entries).toEqual([]);
        expect(first.notices[0]).toContain("Oct 2 rose by 1,500 kcal");
        expect(first.ledgerUpdates[0]!.notified.jump).toBe(2500);
        expect(first.syncedThrough).toBe(null);

        const again = plan(D, { energy_kcal: 2500, protein_g: 150 }, [
            first.ledgerUpdates[0]!,
        ]);
        expect(again.notices).toEqual([]);
        expect(again.entries).toEqual([]);
    });

    test("no jump check when energy is not sent", () => {
        const p = plan(
            D,
            { energy_kcal: 5000, protein_g: 150 },
            [sentRow({ protein_g: 50 })],
            { fields: ["protein_g"] },
        );
        expect(p.entries[0]!.values).toEqual({ protein_g: 100 });
    });
});

describe("planPending: top-up cap", () => {
    test("topup_seq 8 still tops up as t9; 9 is capped with one notice", () => {
        const at8 = plan(D, { energy_kcal: 2100 }, [
            sentRow({ energy_kcal: 2000 }, { topup_seq: 8 }),
        ]);
        expect(at8.entries[0]!.entry_id).toBe("2026-10-02:t9");
        expect(at8.entries[0]!.sample_local).toBe("2026-10-02 12:09:00");

        const at9 = plan(D, { energy_kcal: 2100 }, [
            sentRow({ energy_kcal: 2000 }, { topup_seq: 9 }),
        ]);
        expect(at9.entries).toEqual([]);
        expect(at9.notices).toHaveLength(1);
        expect(at9.ledgerUpdates[0]!.notified.cap).toBe(true);

        const again = plan(D, { energy_kcal: 2200 }, at9.ledgerUpdates);
        expect(again.notices).toEqual([]);
    });
});

describe("planPending: stuck top-ups", () => {
    test("a top-up offered 3 times stops; its id is recorded", () => {
        const p = plan(D, { energy_kcal: 2100 }, [
            sentRow({ energy_kcal: 2000 }, { topup_seq: 1, offer_count: 3 }),
        ]);
        expect(p.entries).toEqual([]);
        expect(p.ledgerUpdates[0]!.notified.stuck).toBe("2026-10-02:t2");
        expect(p.notices).toHaveLength(1);
    });

    test("a later, different entry can get stuck and notify again", () => {
        const p = plan(D, { energy_kcal: 2100 }, [
            sentRow(
                { energy_kcal: 2000 },
                {
                    topup_seq: 2,
                    offer_count: 3,
                    notified: { stuck: "2026-10-02:t2" },
                },
            ),
        ]);
        expect(p.notices).toHaveLength(1);
        expect(p.ledgerUpdates[0]!.notified.stuck).toBe("2026-10-02:t3");
    });
});

describe("planPending: retrying stuck entries by hand", () => {
    const retry = (cur: Partial<DayTotals>, ledger: LedgerRow[]) =>
        planPending({
            dates: [D],
            totals: new Map([[D, totals(cur)]]),
            ledger,
            fields: DEFAULTS,
            tz: TZ,
            retryStuck: true,
        });

    test("a stuck initial entry is offered afresh, its stuck mark cleared", () => {
        const p = retry({ energy_kcal: 100 }, [
            row({
                date: D,
                offer_count: 3,
                notified: { stuck: "2026-10-02:i" },
            }),
        ]);
        expect(p.entries.map((e) => e.entry_id)).toEqual(["2026-10-02:i"]);
        expect(p.notices).toEqual([]);
        expect(p.ledgerUpdates[0]).toMatchObject({
            offer_count: 1,
            notified: {},
        });
    });

    test("a stuck top-up too", () => {
        const p = retry({ energy_kcal: 2100 }, [
            sentRow(
                { energy_kcal: 2000 },
                {
                    topup_seq: 1,
                    offer_count: 4,
                    notified: { stuck: "2026-10-02:t2" },
                },
            ),
        ]);
        expect(p.entries.map((e) => e.entry_id)).toEqual(["2026-10-02:t2"]);
        expect(p.ledgerUpdates[0]!.offer_count).toBe(1);
        expect(p.ledgerUpdates[0]!.notified.stuck).toBeUndefined();
    });

    test("an entry that is not stuck is offered as usual", () => {
        const p = retry({ energy_kcal: 100 }, [
            row({ date: D, offer_count: 2 }),
        ]);
        expect(p.entries).toHaveLength(1);
        expect(p.ledgerUpdates[0]!.offer_count).toBe(3);
    });
});

describe("planPending: timezone freeze", () => {
    test("acked in another zone: frozen, one notice per new zone", () => {
        const r = sentRow({ energy_kcal: 2000 }, { timezone: "UTC" });
        const p = plan(D, { energy_kcal: 2500 }, [r]);
        expect(p.entries).toEqual([]);
        expect(p.notices).toHaveLength(1);
        expect(p.notices[0]).toContain("UTC");
        expect(p.notices[0]).toContain(TZ);
        expect(p.ledgerUpdates[0]!.notified.tz).toBe(TZ);
        expect(p.ledgerUpdates[0]!.timezone).toBe("UTC");

        const again = plan(D, { energy_kcal: 2500 }, p.ledgerUpdates);
        expect(again.notices).toEqual([]);
        expect(again.ledgerUpdates).toEqual([]);

        const moved = plan(D, { energy_kcal: 2500 }, p.ledgerUpdates, {
            tz: "Asia/Tokyo",
        });
        expect(moved.notices).toHaveLength(1);
    });

    test("never acked: not frozen, re-offered in the new zone", () => {
        const p = plan(D, { energy_kcal: 2500 }, [
            row({ date: D, timezone: "UTC", offer_count: 1 }),
        ]);
        expect(p.entries).toHaveLength(1);
        expect(p.notices).toEqual([]);
    });
});

describe("planPending: window walk", () => {
    test("entries in date order, synced_through before the first one", () => {
        const dates = ["2026-09-30", "2026-10-01", "2026-10-02"];
        const p = planPending({
            dates,
            totals: new Map([
                ["2026-09-30", totals({ energy_kcal: 2000 })],
                ["2026-10-01", totals({ energy_kcal: 1800 })],
                ["2026-10-02", totals()],
            ]),
            ledger: [
                row({
                    date: "2026-09-30",
                    sent_values: { energy_kcal: 2000 },
                }),
                row({ date: "2025-01-01", offer_count: 99 }),
            ],
            fields: DEFAULTS,
            tz: TZ,
        });
        expect(p.entries.map((e) => e.entry_id)).toEqual(["2026-10-01:i"]);
        expect(p.syncedThrough).toBe("2026-09-30");
    });

    test("empty window: nothing, synced_through unknown", () => {
        const p = planPending({
            dates: [],
            totals: new Map(),
            ledger: [],
            fields: DEFAULTS,
            tz: TZ,
        });
        expect(p).toEqual({
            entries: [],
            notices: [],
            ledgerUpdates: [],
            syncedThrough: null,
        });
    });

    test("does not mutate the ledger it was given", () => {
        const r = sentRow({ energy_kcal: 2000 });
        const snapshot = structuredClone(r);
        plan(D, { energy_kcal: 1000 }, [r]);
        plan(D, { energy_kcal: 2500 }, [r]);
        expect(r).toEqual(snapshot);
    });
});

// ---------- applyAck ----------

describe("applyAck", () => {
    const NOW = new Date("2026-10-03T07:00:00Z");
    const STAMP = NOW.toISOString();

    test("initial on a fresh day creates the row", () => {
        const res = applyAck(
            null,
            {
                entry_id: "2026-10-02:i",
                date: D,
                values: { energy_kcal: 2140 },
            },
            TZ,
            NOW,
        );
        expect(res).toEqual({
            applied: true,
            row: row({
                date: D,
                sent_values: { energy_kcal: 2140 },
                first_sent_at: STAMP,
                last_sent_at: STAMP,
            }),
        });
    });

    test("initial on an offered row records values, keeps the zone /pending counted in, resets offers", () => {
        const offered = row({
            date: D,
            offer_count: 2,
            timezone: "UTC",
            notified: { stuck: "x" },
        });
        const res = applyAck(
            offered,
            {
                entry_id: "2026-10-02:i",
                date: D,
                values: { energy_kcal: 2140, protein_g: 132.44 },
            },
            TZ,
            NOW,
        );
        expect(res.applied).toBe(true);
        // The account moved to TZ between /pending (which counted the day in
        // UTC and stamped it) and this ack: the row keeps UTC, so the next
        // /pending sees the change and freezes the day.
        expect(res.row).toMatchObject({
            timezone: "UTC",
            sent_values: { energy_kcal: 2140, protein_g: 132.4 },
            offer_count: 0,
            topup_seq: 0,
            notified: { stuck: "x" },
            first_sent_at: STAMP,
        });
        expect(offered.offer_count).toBe(2);
    });

    test("initial is idempotent", () => {
        const first = applyAck(
            null,
            { entry_id: "2026-10-02:i", date: D, values: { energy_kcal: 1 } },
            TZ,
            NOW,
        ).row;
        const second = applyAck(
            first,
            { entry_id: "2026-10-02:i", date: D, values: { energy_kcal: 999 } },
            TZ,
            new Date("2026-10-03T08:00:00Z"),
        );
        expect(second.applied).toBe(false);
        expect(second.row).toBe(first);
    });

    test("top-up applies only as the next number, adds deltas", () => {
        const sent = sentRow(
            { energy_kcal: 2000, protein_g: 100.1 },
            { offer_count: 1 },
        );
        const t1 = {
            entry_id: "2026-10-02:t1",
            date: D,
            values: { energy_kcal: 340, protein_g: 5.25, fat_g: 3 },
        };
        const res = applyAck(sent, t1, TZ, NOW);
        expect(res.applied).toBe(true);
        expect(res.row).toMatchObject({
            sent_values: { energy_kcal: 2340, protein_g: 105.4, fat_g: 3 },
            topup_seq: 1,
            offer_count: 0,
            last_sent_at: STAMP,
            first_sent_at: "2026-10-03T07:00:00.000Z",
        });

        // Replaying t1 or jumping to t3 is skipped.
        expect(applyAck(res.row, t1, TZ, NOW).applied).toBe(false);
        expect(
            applyAck(res.row, { ...t1, entry_id: "2026-10-02:t3" }, TZ, NOW)
                .applied,
        ).toBe(false);
        expect(
            applyAck(res.row, { ...t1, entry_id: "2026-10-02:t2" }, TZ, NOW)
                .applied,
        ).toBe(true);
    });

    test("top-up before the initial ack, or with a mismatched date, is skipped", () => {
        const t1 = {
            entry_id: "2026-10-02:t1",
            date: D,
            values: { energy_kcal: 1 },
        };
        expect(applyAck(null, t1, TZ, NOW)).toEqual({
            applied: false,
            row: null,
        });
        expect(applyAck(row({ date: D }), t1, TZ, NOW).applied).toBe(false);
        expect(
            applyAck(
                null,
                { entry_id: "2026-10-01:i", date: D, values: {} },
                TZ,
                NOW,
            ).applied,
        ).toBe(false);
    });

    test("pending → ack → pending round trip: nothing left to offer", () => {
        const cur = { energy_kcal: 2140, protein_g: 132.4 };
        const p1 = plan(D, cur);
        let r: LedgerRow | null = p1.ledgerUpdates[0]!;
        r = applyAck(r, p1.entries[0]!, TZ, NOW).row;
        const p2 = plan(D, cur, [r!]);
        expect(p2.entries).toEqual([]);
        expect(p2.notices).toEqual([]);

        const p3 = plan(D, { ...cur, energy_kcal: 2300 }, [r!]);
        expect(p3.entries[0]!.values).toEqual({ energy_kcal: 160 });
        r = applyAck(p3.ledgerUpdates[0]!, p3.entries[0]!, TZ, NOW).row;
        expect(r!.sent_values).toEqual({ energy_kcal: 2300, protein_g: 132.4 });
        expect(plan(D, { ...cur, energy_kcal: 2300 }, [r!]).entries).toEqual(
            [],
        );
    });
});

// ---------- request bodies ----------

describe("parseStartBody", () => {
    test.each([
        [undefined, { tz: null, fields: [...DEFAULTS], backfill_days: 0 }],
        [{}, { tz: null, fields: [...DEFAULTS], backfill_days: 0 }],
        [
            { tz: "Europe/Kyiv", include_water: true, backfill_days: 7 },
            { tz: "Europe/Kyiv", fields: [...ALL], backfill_days: 7 },
        ],
        [
            { tz: "Mars/Olympus", include_water: false },
            { tz: null, fields: [...DEFAULTS], backfill_days: 0 },
        ],
        [
            { tz: "", backfill_days: 0 },
            { tz: null, fields: [...DEFAULTS], backfill_days: 0 },
        ],
    ] as [unknown, StartBody][])("accepts %j", (body, want) => {
        expect(parseStartBody(body)).toEqual({ ok: true, value: want });
    });

    test.each([
        [[]],
        ["x"],
        [{ backfill_days: 8 }],
        [{ backfill_days: -1 }],
        [{ backfill_days: 1.5 }],
        [{ backfill_days: "3" }],
        [{ include_water: "yes" }],
        [{ tz: 5 }],
    ])("refuses %j", (body) => {
        expect(parseStartBody(body).ok).toBe(false);
    });
});

describe("parseClaimBody", () => {
    const code = "c".repeat(43);
    const secret = "s".repeat(43);

    test("accepts both opaque values", () => {
        expect(
            parseClaimBody({ claim_code: ` ${code}\n`, device_secret: secret }),
        ).toEqual({
            ok: true,
            value: { claim_code: code, device_secret: secret },
        });
    });

    test.each([
        [null],
        [{ claim_code: code }],
        [{ device_secret: secret }],
        [{ claim_code: "short", device_secret: secret }],
        [{ claim_code: code, device_secret: "has spaces in it ......." }],
        [{ claim_code: 1, device_secret: secret }],
    ])("refuses %j", (body) => {
        expect(parseClaimBody(body).ok).toBe(false);
    });
});

describe("ackWindow", () => {
    test("the offering window plus the day that slid out at 05:00", () => {
        // 15:00 in Kyiv on Oct 3: Oct 2 has closed.
        const now = new Date("2026-10-03T12:00:00Z");
        expect(ackWindow(now, TZ, "2026-01-01")).toEqual({
            from: "2026-09-25",
            to: "2026-10-02",
        });
        expect(offeringWindow(now, TZ, "2026-01-01").from).toBe("2026-09-26");
    });

    test("never before the link's start date, null until a day closed", () => {
        const now = new Date("2026-10-03T12:00:00Z");
        expect(ackWindow(now, TZ, "2026-10-01")).toEqual({
            from: "2026-10-01",
            to: "2026-10-02",
        });
        expect(ackWindow(now, TZ, "2026-10-03")).toBeNull();
    });

    test("before 05:00 local the day before yesterday is the last", () => {
        // 04:00 in Kyiv on Oct 3.
        const now = new Date("2026-10-03T01:00:00Z");
        expect(ackWindow(now, TZ, "2026-01-01")?.to).toBe("2026-10-01");
    });
});

describe("parseAckBody", () => {
    const entry = {
        entry_id: "2026-10-02:i",
        date: D,
        values: { energy_kcal: 2140, protein_g: 132.4 },
    };

    test("accepts entries and done", () => {
        expect(
            parseAckBody({ entries: [entry], done: true }, DEFAULTS),
        ).toEqual({ ok: true, value: { entries: [entry], done: true } });
    });

    test("zero entries with done releases the lease", () => {
        expect(parseAckBody({ done: true }, DEFAULTS)).toEqual({
            ok: true,
            value: { entries: [], done: true },
        });
    });

    test("lease_until is passed on when sent", () => {
        const lease = "2026-10-03T12:02:00.000Z";
        expect(
            parseAckBody({ done: true, lease_until: lease }, DEFAULTS),
        ).toEqual({
            ok: true,
            value: { entries: [], done: true, lease_until: lease },
        });
        const none = parseAckBody({ done: true, lease_until: null }, DEFAULTS);
        expect(none.ok && "lease_until" in none.value).toBe(false);
    });

    test("value caps are inclusive", () => {
        const at = {
            ...entry,
            values: {
                energy_kcal: 50_000,
                protein_g: 10_000,
                caffeine_mg: 100_000,
            },
        };
        expect(parseAckBody({ entries: [at] }, DEFAULTS).ok).toBe(true);
    });

    test.each([
        ["not an object", []],
        ["entries not an array", { entries: {} }],
        [
            "too many",
            { entries: Array(HEALTH_SYNC_MAX_ACK_ENTRIES + 1).fill(entry) },
        ],
        ["done not boolean", { entries: [entry], done: "true" }],
        ["lease_until not a string", { done: true, lease_until: 5 }],
        ["lease_until not a time", { done: true, lease_until: "soon" }],
        ["bad entry_id", { entries: [{ ...entry, entry_id: "x" }] }],
        ["date mismatch", { entries: [{ ...entry, date: "2026-10-01" }] }],
        ["values missing", { entries: [{ ...entry, values: null }] }],
        ["values empty", { entries: [{ ...entry, values: {} }] }],
        [
            "unknown field",
            { entries: [{ ...entry, values: { alcohol_g: 1 } }] },
        ],
        [
            "disabled field",
            { entries: [{ ...entry, values: { water_ml: 1 } }] },
        ],
        ["negative", { entries: [{ ...entry, values: { energy_kcal: -1 } }] }],
        [
            "NaN-ish string",
            { entries: [{ ...entry, values: { energy_kcal: "5" } }] },
        ],
        [
            "over cap",
            { entries: [{ ...entry, values: { energy_kcal: 50_001 } }] },
        ],
        [
            "grams over cap",
            { entries: [{ ...entry, values: { fat_g: 10_000.1 } }] },
        ],
    ])("refuses: %s", (_name, body) => {
        expect(parseAckBody(body, DEFAULTS).ok).toBe(false);
    });

    test("exactly the max entry count is fine", () => {
        expect(
            parseAckBody(
                { entries: Array(HEALTH_SYNC_MAX_ACK_ENTRIES).fill(entry) },
                DEFAULTS,
            ).ok,
        ).toBe(true);
    });

    test("water is accepted once enabled", () => {
        expect(
            parseAckBody(
                { entries: [{ ...entry, values: { water_ml: 2000 } }] },
                ALL,
            ).ok,
        ).toBe(true);
    });
});

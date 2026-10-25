import { describe, expect, test } from "bun:test";
import { shiftLocalDate } from "./tz.js";
import {
    buildBodyMeasurementsMeta,
    buildWeightEntriesMeta,
    ENTRY_NOTE_MAX_CHARS,
    WEIGHT_ENTRIES_CAP,
    type MeasurementRow,
} from "./weight-widget.js";

describe("buildWeightEntriesMeta", () => {
    test("keeps the last 365 local days, oldest first, in the display unit", () => {
        const m = buildWeightEntriesMeta(
            [
                {
                    weight_g: 80_000,
                    logged_at: "2026-06-30T21:30:00Z",
                    notes: " late ",
                },
                { weight_g: 81_000, logged_at: "2025-07-01T08:00:00Z" },
                { weight_g: 82_000, logged_at: "2025-06-30T08:00:00Z" },
                { weight_g: 70_000, logged_at: "2026-07-02T08:00:00Z" },
            ],
            "Europe/Kyiv",
            "lb",
            "2026-07-01",
            "2026-07-03",
        );
        expect(m.from).toBe("2025-07-02");
        expect(m.to).toBe("2026-07-01");
        expect(m.today).toBe("2026-07-03");
        // 21:30Z is 00:30 on 1 Jul in Kyiv; 1 Jul 2025 is before `from`;
        // 2 Jul 2026 is after `to`.
        expect(m.entries).toEqual([
            { date: "2026-07-01", time: "00:30", weight: 176.4, note: "late" },
        ]);
        expect(m.truncated).toBe(false);
    });

    test("caps the list at the newest readings and clips long notes", () => {
        const rows = Array.from({ length: WEIGHT_ENTRIES_CAP + 5 }, (_, i) => ({
            weight_g: 80_000,
            logged_at: new Date(
                Date.UTC(2026, 0, 1) + i * 3_600_000,
            ).toISOString(),
            notes: i === WEIGHT_ENTRIES_CAP + 4 ? "x".repeat(500) : null,
        }));
        const m = buildWeightEntriesMeta(
            rows,
            "UTC",
            "kg",
            "2026-06-30",
            "2026-06-30",
        );
        expect(m.entries).toHaveLength(WEIGHT_ENTRIES_CAP);
        expect(m.truncated).toBe(true);
        expect(m.entries[0]!.time).toBe("05:00");
        const last = m.entries[m.entries.length - 1]!;
        expect(last.note).toHaveLength(ENTRY_NOTE_MAX_CHARS);
        expect(last.note!.endsWith("…")).toBe(true);
    });
});

describe("buildBodyMeasurementsMeta", () => {
    const row = (over: Partial<MeasurementRow>): MeasurementRow => ({
        kind: "waist",
        value_mm: 845,
        value_entered: 84.5,
        entered_unit: "cm",
        logged_at: "2026-06-20T08:00:00Z",
        ...over,
    });

    test("a saved length unit wins; typed values are shown back in their own unit", () => {
        const m = buildBodyMeasurementsMeta(
            [
                row({}),
                row({
                    value_mm: 838,
                    value_entered: "33",
                    entered_unit: "in",
                    logged_at: "2026-06-28T08:00:00Z",
                }),
            ],
            "UTC",
            "in",
            "2026-06-30",
        );
        expect(m.sites.waist).toEqual({
            unit: "in",
            entries: [
                { date: "2026-06-20", value: 33.3 },
                { date: "2026-06-28", value: 33 },
            ],
        });
    });

    test("only sites with entries in the window, in the fixed site order", () => {
        const m = buildBodyMeasurementsMeta(
            [
                row({ kind: "calf", value_mm: 380, value_entered: 38 }),
                row({ kind: "hips", value_mm: 1000, value_entered: 100 }),
                row({
                    kind: "neck",
                    logged_at: `${shiftLocalDate("2026-06-30", -400)}T08:00:00Z`,
                }),
            ],
            "UTC",
            null,
            "2026-06-30",
        );
        expect(Object.keys(m.sites)).toEqual(["hips", "calf"]);
        expect(m.sites.hips!.unit).toBe("cm");
    });
});

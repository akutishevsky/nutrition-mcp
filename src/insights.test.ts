import { test, expect } from "bun:test";
import { computeWeightTrend } from "./insights.js";
import type { WeightEntry } from "./supabase.js";

function entry(logged_at: string, weight_g: number): WeightEntry {
    return {
        id: `id-${logged_at}-${weight_g}`,
        user_id: "u1",
        weight_g,
        logged_at,
        notes: null,
        created_at: logged_at,
        idempotency_key: null,
    };
}

test("computeWeightTrend reports latest, change, range, and goal in kg", () => {
    const entries = [
        entry("2026-06-01T08:00:00Z", 80000),
        entry("2026-06-08T08:00:00Z", 79000),
        entry("2026-06-15T08:00:00Z", 78500),
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-15",
        "UTC",
        75000, // target 75 kg
        "kg",
    );
    expect(out).toContain(
        "Weight trend — 2026-06-01 to 2026-06-15 (3 logged days)",
    );
    expect(out).toContain("Latest: 78.5 kg (on 2026-06-15)");
    expect(out).toContain(
        "Change over range: -1.5 kg (from 80 kg on 2026-06-01)",
    );
    expect(out).toContain("Min: 78.5 kg (on 2026-06-15)");
    expect(out).toContain("Max: 80 kg (on 2026-06-01)");
    expect(out).toContain("3.5 kg to lose to reach target of 75 kg");
});

test("computeWeightTrend averages multiple weigh-ins on the same day", () => {
    const entries = [
        entry("2026-06-01T07:00:00Z", 80000),
        entry("2026-06-01T20:00:00Z", 82000), // same day -> avg 81 kg
        entry("2026-06-02T07:00:00Z", 81000),
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-02",
        "UTC",
        null,
        "kg",
    );
    expect(out).toContain("(2 logged days)");
    expect(out).toContain("Max: 81 kg (on 2026-06-01)"); // averaged, not 82
    expect(out).toContain("(Tip: set a target weight with set_nutrition_goals");
});

test("computeWeightTrend renders in lb and reports gaining toward target", () => {
    const entries = [
        entry("2026-06-01T08:00:00Z", 74843), // 165 lb
        entry("2026-06-10T08:00:00Z", 76203), // 168 lb
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-10",
        "UTC",
        79379, // ~175 lb target
        "lb",
    );
    expect(out).toContain("Latest: 168 lb (on 2026-06-10)");
    expect(out).toContain("Change over range: +3 lb");
    expect(out).toContain("to gain to reach target of 175 lb");
});

test("computeWeightTrend handles an empty range", () => {
    expect(
        computeWeightTrend([], "2026-06-01", "2026-06-30", "UTC", null, "kg"),
    ).toBe("No weight logged between 2026-06-01 and 2026-06-30.");
});

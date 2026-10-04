import { test, expect, describe } from "bun:test";
import {
    GOAL_COLUMNS,
    goalsOnDate,
    pickGoals,
    sameGoals,
    withCurrentGoals,
    type GoalValues,
    type NutritionGoalsHistoryRow,
} from "./goals-history.js";

function goals(overrides: Partial<GoalValues> = {}): GoalValues {
    const out = {} as GoalValues;
    for (const c of GOAL_COLUMNS) out[c] = null;
    return { ...out, ...overrides };
}

function row(
    effective_at: string,
    overrides: Partial<GoalValues> = {},
): NutritionGoalsHistoryRow {
    return { effective_at, ...goals(overrides) };
}

// Two changes: 2,000 kcal from Mar 1 (10:00Z), 1,800 kcal from Mar 10 at
// 21:30Z.
const HISTORY = [
    row("2026-03-01T10:00:00.000Z", { daily_calories: 2000 }),
    row("2026-03-10T21:30:00.000Z", { daily_calories: 1800 }),
];

describe("goalsOnDate", () => {
    test("no history at all means no targets", () => {
        expect(goalsOnDate([], "2026-03-05", "UTC")).toBeNull();
    });

    test("the exact day a row took effect uses that row", () => {
        expect(goalsOnDate(HISTORY, "2026-03-01", "UTC")).toEqual({
            goals: goals({ daily_calories: 2000 }),
            assumed: false,
        });
    });

    test("a day between changes uses the latest row on or before it", () => {
        expect(goalsOnDate(HISTORY, "2026-03-09", "UTC")?.goals).toEqual(
            goals({ daily_calories: 2000 }),
        );
        expect(goalsOnDate(HISTORY, "2026-04-30", "UTC")).toEqual({
            goals: goals({ daily_calories: 1800 }),
            assumed: false,
        });
    });

    test("a change during the day applies to that whole day", () => {
        // Set at 21:30Z: the morning of Mar 10 already counts against 1,800.
        expect(goalsOnDate(HISTORY, "2026-03-10", "UTC")?.goals).toEqual(
            goals({ daily_calories: 1800 }),
        );
    });

    test("several changes on one day: the last one wins", () => {
        const history = [
            row("2026-03-01T08:00:00.000Z", { daily_calories: 2000 }),
            row("2026-03-01T09:00:00.000Z", { daily_calories: 2100 }),
            row("2026-03-01T20:00:00.000Z", { daily_calories: 2200 }),
        ];
        expect(goalsOnDate(history, "2026-03-01", "UTC")?.goals).toEqual(
            goals({ daily_calories: 2200 }),
        );
    });

    test("before the first row, the earliest row is assumed", () => {
        expect(goalsOnDate(HISTORY, "2026-02-28", "UTC")).toEqual({
            goals: goals({ daily_calories: 2000 }),
            assumed: true,
        });
        expect(goalsOnDate(HISTORY, "2020-01-01", "UTC")?.assumed).toBe(true);
    });

    test("the timezone decides which local day a change lands on", () => {
        // 21:30Z on Mar 10 is 06:30 on Mar 11 in Tokyo (UTC+9), so there
        // Mar 10 keeps 2,000 and the change starts on Mar 11.
        expect(goalsOnDate(HISTORY, "2026-03-10", "Asia/Tokyo")?.goals).toEqual(
            goals({ daily_calories: 2000 }),
        );
        expect(goalsOnDate(HISTORY, "2026-03-11", "Asia/Tokyo")?.goals).toEqual(
            goals({ daily_calories: 1800 }),
        );
        // West of UTC it goes the other way: a 03:00Z change on Mar 1 is the
        // evening of Feb 28 in New York, so Feb 28 is covered, not assumed.
        const early = [
            row("2026-03-01T03:00:00.000Z", { daily_calories: 2000 }),
        ];
        expect(goalsOnDate(early, "2026-02-28", "America/New_York")).toEqual({
            goals: goals({ daily_calories: 2000 }),
            assumed: false,
        });
        expect(goalsOnDate(early, "2026-02-28", "UTC")?.assumed).toBe(true);
    });
});

describe("pickGoals", () => {
    test("keeps the ten goal columns, coerces numeric strings, nulls the rest", () => {
        const picked = pickGoals({
            daily_calories: 2000,
            daily_protein_g: "150.5" as unknown as number,
            daily_carbs_g: "not a number" as unknown as number,
            user_id: "u1",
            effective_at: "2026-03-01T00:00:00.000Z",
        } as Record<string, unknown>);
        expect(Object.keys(picked)).toEqual([...GOAL_COLUMNS]);
        expect(picked.daily_calories).toBe(2000);
        expect(picked.daily_protein_g).toBe(150.5);
        expect(picked.daily_carbs_g).toBeNull();
        expect(picked.daily_fat_g).toBeNull();
    });
});

describe("sameGoals", () => {
    test("equal column by column", () => {
        expect(
            sameGoals(
                goals({ daily_calories: 2000 }),
                goals({ daily_calories: 2000 }),
            ),
        ).toBe(true);
    });

    test("any one column differing is a change, null vs 0 included", () => {
        expect(
            sameGoals(
                goals({ daily_calories: 2000 }),
                goals({ daily_calories: 2001 }),
            ),
        ).toBe(false);
        expect(
            sameGoals(
                goals({ daily_alcohol_g: 0 }),
                goals({ daily_alcohol_g: null }),
            ),
        ).toBe(false);
    });
});

describe("withCurrentGoals", () => {
    const current = (updated_at: string, kcal: number) => ({
        ...goals({ daily_calories: kcal }),
        updated_at,
    });

    test("no current row: history as is", () => {
        expect(withCurrentGoals(HISTORY, null)).toEqual(HISTORY);
    });

    test("empty history: the current row is the one entry", () => {
        expect(
            withCurrentGoals([], current("2026-03-03T09:00:00+00:00", 1900)),
        ).toEqual([row("2026-03-03T09:00:00.000Z", { daily_calories: 1900 })]);
    });

    test("newer and different: appended", () => {
        const merged = withCurrentGoals(
            HISTORY,
            current("2026-03-12T08:00:00.000Z", 1700),
        );
        expect(merged).toEqual([
            ...HISTORY,
            row("2026-03-12T08:00:00.000Z", { daily_calories: 1700 }),
        ]);
        expect(goalsOnDate(merged, "2026-03-12", "UTC")?.goals).toEqual(
            goals({ daily_calories: 1700 }),
        );
    });

    test("newer but the same values (a no-op save): nothing", () => {
        expect(
            withCurrentGoals(
                HISTORY,
                current("2026-03-12T08:00:00.000Z", 1800),
            ),
        ).toEqual(HISTORY);
    });

    test("the same instant as the latest row: nothing", () => {
        expect(
            withCurrentGoals(
                HISTORY,
                current("2026-03-10T21:30:00.000Z", 1700),
            ),
        ).toEqual(HISTORY);
    });

    test("different but older than the latest row (racing saves): nothing", () => {
        expect(
            withCurrentGoals(
                HISTORY,
                current("2026-03-05T08:00:00.000Z", 1700),
            ),
        ).toEqual(HISTORY);
    });

    test("an unparseable updated_at: nothing", () => {
        expect(withCurrentGoals(HISTORY, current("not a date", 1700))).toEqual(
            HISTORY,
        );
        expect(withCurrentGoals([], current("not a date", 1700))).toEqual([]);
    });

    test("does not mutate the history passed in", () => {
        const input = [...HISTORY];
        withCurrentGoals(input, current("2026-03-12T08:00:00.000Z", 1700));
        expect(input).toEqual(HISTORY);
    });
});

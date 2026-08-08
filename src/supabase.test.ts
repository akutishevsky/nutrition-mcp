import { test, expect, describe } from "bun:test";
import {
    mealIdempotencyKey,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    fetchAllPages,
    timezoneLevels,
    TZ_LEVEL_THRESHOLDS,
    type MealInput,
    type Profile,
} from "./supabase.js";
import { rowContentDigest } from "./import.js";

// Every export exercised here is pure: no test in this file constructs a
// Supabase client, and none touches the network or the database.

const USER = "11111111-1111-4111-8111-111111111111";
const LOGGED_AT = "2026-03-14T12:00:00.000Z";

function meal(overrides: Partial<MealInput> = {}): MealInput {
    return {
        description: "oat porridge with berries",
        meal_type: "breakfast",
        calories: 300,
        protein_g: 12,
        carbs_g: 45,
        fat_g: 8,
        notes: "made with milk",
        ...overrides,
    };
}

function key(input: MealInput, userId = USER, loggedAt = LOGGED_AT): string {
    return mealIdempotencyKey(userId, input, loggedAt);
}

describe("mealIdempotencyKey", () => {
    test("fiber, sugar and alcohol are EXCLUDED from the derived key", () => {
        const base = meal();
        const withNewFields = meal({
            fiber_g: 6.2,
            sugar_g: 14.5,
            alcohol_g: 3.1,
        });

        // The whole point of the frozen array: adding one of the three new
        // columns to it would change the key of every future write, so a user
        // re-logging or re-importing something they already have would get a
        // duplicate row instead of a clean no-op.
        expect(key(withNewFields)).toBe(key(base));

        // Negative control — this test must be able to fail. A field that IS
        // hashed changes the key, proving the assertion above is not just
        // "every input produces the same key".
        expect(key(meal({ calories: 301 }))).not.toBe(key(base));
    });

    test("each new field is excluded on its own, not just in combination", () => {
        const base = key(meal());
        expect(key(meal({ fiber_g: 6.2 }))).toBe(base);
        expect(key(meal({ sugar_g: 14.5 }))).toBe(base);
        expect(key(meal({ alcohol_g: 3.1 }))).toBe(base);
        // Zero is not the same as absent to a hasher that stringifies parts,
        // so pin it too: it must still be excluded.
        expect(key(meal({ fiber_g: 0, sugar_g: 0, alcohol_g: 0 }))).toBe(base);
    });

    test("two meals differing only in fiber dedupe to one — the accepted cost", () => {
        // Documented in CONTRACT §2 and in the comment on the array: this is a
        // deliberate trade, not an oversight. A caller who needs the rows kept
        // apart passes an explicit idempotency_key.
        expect(key(meal({ fiber_g: 1 }))).toBe(key(meal({ fiber_g: 99 })));
    });

    test("every field that IS hashed changes the key", () => {
        const base = key(meal());
        const variants: [string, MealInput][] = [
            ["description", meal({ description: "oat porridge" })],
            ["meal_type", meal({ meal_type: "snack" })],
            ["calories", meal({ calories: 301 })],
            ["protein_g", meal({ protein_g: 12.5 })],
            ["carbs_g", meal({ carbs_g: 46 })],
            ["fat_g", meal({ fat_g: 8.5 })],
            ["notes", meal({ notes: "made with water" })],
        ];
        for (const [label, input] of variants) {
            expect(`${label}:${key(input)}`).not.toBe(`${label}:${base}`);
        }

        // The two arguments outside MealInput matter as much: without userId
        // two users' identical meals would collide, and without logged_at the
        // same breakfast eaten on two days would dedupe into one.
        expect(key(meal(), "22222222-2222-4222-8222-222222222222")).not.toBe(
            base,
        );
        expect(key(meal(), USER, "2026-03-15T12:00:00.000Z")).not.toBe(base);
    });

    test("is deterministic and marked as server-derived", () => {
        expect(key(meal())).toBe(key(meal()));
        expect(key(meal())).toMatch(/^auto:[0-9a-f]{64}$/);
    });

    test("an absent field and an explicitly null-ish one hash alike", () => {
        // parts.map(p => p ?? "") — undefined and null collapse to the same
        // empty segment, so an omitted note and a cleared note dedupe together.
        expect(key(meal({ notes: undefined }))).toBe(
            key({ ...meal(), notes: undefined }),
        );
    });

    test("stays in step with rowContentDigest in src/import.ts", () => {
        // The two frozen arrays are mirrors: same fields, same order, same
        // hash. If either drifts, meals written through log_meal and the same
        // meals written through bulk_import_meals stop deduping against each
        // other. Both are frozen by CONTRACT §2.
        const input = meal({
            logged_at: LOGGED_AT,
            fiber_g: 6.2,
            sugar_g: 14.5,
            alcohol_g: 3.1,
        });
        expect(key(input)).toBe(`auto:${rowContentDigest(USER, input)}`);
    });
});

// ---------- Profile-derived display preferences ----------

function profile(overrides: Partial<Profile> = {}): Profile {
    return {
        user_id: USER,
        timezone: "Europe/Kyiv",
        preferred_weight_unit: "kg",
        widgets_enabled: true,
        alcohol_tracking_enabled: false,
        preferred_drink_unit: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

// A row written before the column existed: present in the DB, absent from the
// JSON, so the property reads as undefined at runtime despite the type.
function withoutColumn(column: keyof Profile): Profile {
    const row = profile();
    delete (row as unknown as Record<string, unknown>)[column];
    return row;
}

describe("widgetsEnabledFromProfile", () => {
    test("defaults to true when there is no profile row", () => {
        expect(widgetsEnabledFromProfile(null)).toBe(true);
        expect(widgetsEnabledFromProfile(undefined)).toBe(true);
    });

    test("defaults to true when the column is absent", () => {
        expect(
            widgetsEnabledFromProfile(withoutColumn("widgets_enabled")),
        ).toBe(true);
    });

    test("honours an explicit opt-out", () => {
        expect(
            widgetsEnabledFromProfile(profile({ widgets_enabled: false })),
        ).toBe(false);
        expect(
            widgetsEnabledFromProfile(profile({ widgets_enabled: true })),
        ).toBe(true);
    });
});

describe("alcoholTrackingEnabledFromProfile", () => {
    test("defaults to FALSE when there is no profile row — alcohol is opt-in", () => {
        // CONTRACT §7. Flipping this default to true turns the opt-in into an
        // opt-out and surfaces alcohol — including the trace alcohol recipe
        // exports carry — to users who never asked to see it.
        expect(alcoholTrackingEnabledFromProfile(null)).toBe(false);
        expect(alcoholTrackingEnabledFromProfile(undefined)).toBe(false);
    });

    test("defaults to false when the column is absent", () => {
        expect(
            alcoholTrackingEnabledFromProfile(
                withoutColumn("alcohol_tracking_enabled"),
            ),
        ).toBe(false);
    });

    test("an existing profile that never opted in stays off", () => {
        expect(
            alcoholTrackingEnabledFromProfile(
                profile({ alcohol_tracking_enabled: false }),
            ),
        ).toBe(false);
    });

    test("honours an explicit opt-in", () => {
        expect(
            alcoholTrackingEnabledFromProfile(
                profile({ alcohol_tracking_enabled: true }),
            ),
        ).toBe(true);
    });
});

describe("preferredDrinkUnitFromProfile", () => {
    test("returns null when there is no profile row or no preference", () => {
        expect(preferredDrinkUnitFromProfile(null)).toBeNull();
        expect(preferredDrinkUnitFromProfile(undefined)).toBeNull();
        expect(
            preferredDrinkUnitFromProfile(
                profile({ preferred_drink_unit: null }),
            ),
        ).toBeNull();
        expect(
            preferredDrinkUnitFromProfile(
                withoutColumn("preferred_drink_unit"),
            ),
        ).toBeNull();
    });

    test("returns a saved preference", () => {
        expect(
            preferredDrinkUnitFromProfile(
                profile({ preferred_drink_unit: "us" }),
            ),
        ).toBe("us");
        expect(
            preferredDrinkUnitFromProfile(
                profile({ preferred_drink_unit: "uk" }),
            ),
        ).toBe("uk");
    });

    test("degrades unrecognised column values to null", () => {
        // The isDrinkUnit guard is what keeps junk out of the
        // Record<DrinkUnit, …> lookups in src/alcohol.ts, where an unguarded
        // value would surface as NaN grams per drink rather than as a missing
        // preference.
        for (const junk of ["US", "UK", "pints", "", "usa", 1, true, {}]) {
            expect(
                preferredDrinkUnitFromProfile(
                    profile({
                        preferred_drink_unit: junk as never,
                    }),
                ),
            ).toBeNull();
        }
    });
});

describe("no-profile defaults, together", () => {
    test("a user with no profile row gets widgets on, alcohol off, no drink unit", () => {
        // The exact triple buildMcpServer derives from one getProfile call.
        expect({
            widgets: widgetsEnabledFromProfile(null),
            alcohol: alcoholTrackingEnabledFromProfile(null),
            drinkUnit: preferredDrinkUnitFromProfile(null),
        }).toEqual({ widgets: true, alcohol: false, drinkUnit: null });
    });
});

// ---------- fetchAllPages (issue #66: export_meals silently truncated at
// PostgREST's default db-max-rows of 1000, since getAllMeals had no .range()
// pagination) ----------

/** An in-memory paged source, standing in for a `.range(from, to)` query. */
function paged<T>(rows: T[]) {
    const calls: Array<[number, number]> = [];
    const fetchPage = async (from: number, to: number): Promise<T[]> => {
        calls.push([from, to]);
        return rows.slice(from, to + 1);
    };
    return { fetchPage, calls };
}

describe("fetchAllPages", () => {
    test("returns everything when it all fits in one short page", async () => {
        const rows = Array.from({ length: 5 }, (_, i) => i);
        const { fetchPage, calls } = paged(rows);
        expect(await fetchAllPages(fetchPage, 1000)).toEqual(rows);
        // A page shorter than pageSize is itself proof there is no more —
        // one fetch should be enough, not a second empty-page round trip.
        expect(calls).toEqual([[0, 999]]);
    });

    test("empty source returns an empty array from a single fetch", async () => {
        const { fetchPage, calls } = paged<number>([]);
        expect(await fetchAllPages(fetchPage, 1000)).toEqual([]);
        expect(calls).toEqual([[0, 999]]);
    });

    test("pages through a total larger than one page (the reported bug)", async () => {
        // 1500 rows with the default 1000-row page: the original unbounded
        // select returned only the first 1000 and silently dropped the rest.
        const rows = Array.from({ length: 1500 }, (_, i) => i);
        const { fetchPage, calls } = paged(rows);
        const result = await fetchAllPages(fetchPage, 1000);
        expect(result).toEqual(rows);
        expect(result).toHaveLength(1500);
        expect(calls).toEqual([
            [0, 999],
            [1000, 1999],
        ]);
    });

    test("total an exact multiple of pageSize still terminates", async () => {
        // A full last page is indistinguishable from "there might be more"
        // until the next fetch comes back empty — this pins that the loop
        // does make that extra call, and does stop once it does.
        const rows = Array.from({ length: 2000 }, (_, i) => i);
        const { fetchPage, calls } = paged(rows);
        const result = await fetchAllPages(fetchPage, 1000);
        expect(result).toEqual(rows);
        expect(calls).toEqual([
            [0, 999],
            [1000, 1999],
            [2000, 2999],
        ]);
    });

    test("honours a custom page size", async () => {
        const rows = Array.from({ length: 25 }, (_, i) => i);
        const { fetchPage, calls } = paged(rows);
        const result = await fetchAllPages(fetchPage, 10);
        expect(result).toEqual(rows);
        expect(calls).toEqual([
            [0, 9],
            [10, 19],
            [20, 29],
        ]);
    });

    test("preserves row order across page boundaries", async () => {
        // getAllMeals sorts by logged_at then id before paging; fetchAllPages
        // must not reorder or interleave what each page hands back.
        const rows = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            logged_at: `2026-01-${String(i + 1).padStart(2, "0")}`,
        }));
        const { fetchPage } = paged(rows);
        const result = await fetchAllPages(fetchPage, 5);
        expect(result.map((r) => r.id)).toEqual(rows.map((r) => r.id));
    });
});

describe("timezoneLevels", () => {
    // Sizes the landing-page world map, and is the privacy boundary in front of
    // the exact per-timezone counts: /api/stats is public and unauthenticated,
    // so only these buckets are ever served.

    test("never leaks a count — only levels 1..5 come out", () => {
        const levels = timezoneLevels({
            "Europe/Berlin": 38,
            "America/New_York": 11,
            "Pacific/Apia": 1,
        });
        for (const value of Object.values(levels)) {
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(TZ_LEVEL_THRESHOLDS.length + 1);
        }
        expect(Object.keys(levels).sort()).toEqual([
            "America/New_York",
            "Europe/Berlin",
            "Pacific/Apia",
        ]);
    });

    test("a lone profile and the busiest timezone land in different buckets", () => {
        // The whole point of the change: with one radius for everything the map
        // said nothing. 1 of 273 must not read the same as 38 of 273.
        const levels = timezoneLevels({ big: 38, small: 1, rest: 234 });
        // Asserted as exact levels rather than `big > small`: under
        // noUncheckedIndexedAccess a lookup is number | undefined, and
        // toBeGreaterThan would not accept that as its argument.
        expect(levels.small).toBe(1);
        expect(levels.big).toBe(TZ_LEVEL_THRESHOLDS.length + 1);
    });

    test("levels are shares, not ranks — scaling everything changes nothing", () => {
        const small = timezoneLevels({ a: 1, b: 2, c: 4, d: 8, e: 85 });
        const large = timezoneLevels({
            a: 100,
            b: 200,
            c: 400,
            d: 800,
            e: 8500,
        });
        expect(large).toEqual(small);
    });

    test("threshold boundaries are inclusive", () => {
        // 1 in 100 is exactly the first threshold (0.01) and must step up.
        const levels = timezoneLevels({ edge: 1, rest: 99 });
        expect(levels.edge).toBe(2);
        // a hair under stays at level 1
        const under = timezoneLevels({ edge: 1, rest: 100 });
        expect(under.edge).toBe(1);
    });

    test("the largest possible share saturates at the top level", () => {
        const levels = timezoneLevels({ only: 5 });
        expect(levels.only).toBe(TZ_LEVEL_THRESHOLDS.length + 1);
    });

    test("no profiles yields no dots rather than a divide by zero", () => {
        expect(timezoneLevels({})).toEqual({});
        expect(timezoneLevels({ a: 0 })).toEqual({});
    });

    test("zero and malformed counts are dropped, not plotted at level 1", () => {
        // A timezone with no profiles must not appear on the map at all, and a
        // non-numeric value from the DB must not poison the total.
        const levels = timezoneLevels({
            real: 10,
            empty: 0,
            negative: -3,
            junk: undefined as unknown as number,
        });
        expect(Object.keys(levels)).toEqual(["real"]);
    });
});

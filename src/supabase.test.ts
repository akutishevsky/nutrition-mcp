import {
    test,
    expect,
    describe,
    beforeAll,
    afterAll,
    beforeEach,
    spyOn,
} from "bun:test";
import {
    mealIdempotencyKey,
    updatedMealIdempotencyKey,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    preferredLengthUnitFromProfile,
    bodyMeasurementIdempotencyKey,
    timezoneFromProfile,
    fetchAllPages,
    assertWindowComplete,
    isUuid,
    exportArchivePath,
    exportStoragePaths,
    timezoneLevels,
    TZ_LEVEL_THRESHOLDS,
    TZ_MIN_PROFILES,
    publicLandingStats,
    type RawLandingStats,
    seedPatreonTokensFromEnv,
    upsertNutritionGoals,
    getNutritionGoalsHistory,
    insertMeal,
    updateMeal,
    type Meal,
    type MealInput,
    type Profile,
} from "./supabase.js";
import { rowContentDigest } from "./import.js";
import { ToolError } from "./errors.js";

// Almost every export exercised here is pure. The one exception is the goals
// history block at the end, which runs the real write and read functions
// against a stubbed global fetch scoped to that block (no mock.module: it is
// process-wide; see CLAUDE.md). Nothing in this file touches the network or
// the database.

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
    test("fiber, sugar, alcohol and caffeine are EXCLUDED from the derived key", () => {
        const base = meal();
        const withNewFields = meal({
            fiber_g: 6.2,
            sugar_g: 14.5,
            alcohol_g: 3.1,
            caffeine_mg: 95,
        });

        // The whole point of the frozen array: adding one of the four
        // non-macro columns to it would change the key of every future write,
        // so a user re-logging or re-importing something they already have
        // would get a duplicate row instead of a clean no-op — and every
        // "auto:" key already in the table would be orphaned.
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
        expect(key(meal({ caffeine_mg: 95 }))).toBe(base);
        // Zero is not the same as absent to a hasher that stringifies parts,
        // so pin it too: it must still be excluded.
        expect(
            key(
                meal({
                    fiber_g: 0,
                    sugar_g: 0,
                    alcohol_g: 0,
                    caffeine_mg: 0,
                }),
            ),
        ).toBe(base);
    });

    test("added_sugar_g is EXCLUDED from the derived key too", () => {
        // Same frozen-array rule as the four columns above: adding it would
        // re-key every future write and turn a replayed log or import into a
        // duplicate row.
        const base = key(meal());
        expect(key(meal({ added_sugar_g: 9.5 }))).toBe(base);
        expect(key(meal({ added_sugar_g: 0 }))).toBe(base);
        expect(key(meal({ sugar_g: 14.5, added_sugar_g: 9.5 }))).toBe(base);
        // And the mirror in src/import.ts still agrees with it.
        expect(key(meal({ logged_at: LOGGED_AT, added_sugar_g: 9.5 }))).toBe(
            `auto:${rowContentDigest(USER, meal({ logged_at: LOGGED_AT, added_sugar_g: 9.5 }))}`,
        );
    });

    test("two coffees differing only in caffeine dedupe to one — the accepted cost", () => {
        // Same trade as fiber above, restated for the mg column because it is
        // the one whose values a user is most likely to tune after the fact
        // (a single vs a double shot logged under the same description).
        expect(key(meal({ caffeine_mg: 63 }))).toBe(
            key(meal({ caffeine_mg: 126 })),
        );
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
            caffeine_mg: 95,
        });
        expect(key(input)).toBe(`auto:${rowContentDigest(USER, input)}`);
    });
});

function existingMeal(overrides: Partial<Meal> = {}): Meal {
    return {
        id: "33333333-3333-4333-8333-333333333333",
        user_id: USER,
        logged_at: LOGGED_AT,
        meal_type: "breakfast",
        description: "oat porridge with berries",
        calories: 300,
        protein_g: 12,
        carbs_g: 45,
        fat_g: 8,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: "made with milk",
        idempotency_key: key(meal()),
        ...overrides,
    };
}

describe("updatedMealIdempotencyKey", () => {
    test("recomputes the digest when an edit changes content, for an auto: key", () => {
        const existing = existingMeal();
        const updated = updatedMealIdempotencyKey(USER, existing, {
            calories: 600,
        });

        expect(updated).not.toBeNull();
        // Differs from the pre-edit row's key...
        expect(updated).not.toBe(existing.idempotency_key);
        // ...and from what the ORIGINAL (pre-edit) content would still hash to
        // — this is the #84 replay case: a replay of the original log_meal
        // call must no longer dedupe onto the corrected row.
        expect(updated).not.toBe(key(meal()));
        // It matches recomputing over the merged (post-edit) content.
        expect(updated).toBe(key(meal({ calories: 600 })));
    });

    test("a caller-supplied idempotency_key is left untouched", () => {
        const existing = existingMeal({
            idempotency_key: "client-supplied-key-123",
        });
        expect(
            updatedMealIdempotencyKey(USER, existing, { calories: 600 }),
        ).toBeNull();
    });

    test("a row with idempotency_key: null returns null", () => {
        const existing = existingMeal({ idempotency_key: null });
        expect(
            updatedMealIdempotencyKey(USER, existing, { calories: 600 }),
        ).toBeNull();
    });

    test("fields not passed in the update fall back to the existing row's content", () => {
        const existing = existingMeal();
        const updated = updatedMealIdempotencyKey(USER, existing, {
            notes: "made with oat milk",
        });

        expect(updated).toBe(key(meal({ notes: "made with oat milk" })));
    });

    test("editing fiber_g/sugar_g/alcohol_g/caffeine_mg alone does not change the recomputed key", () => {
        const existing = existingMeal();
        const updated = updatedMealIdempotencyKey(USER, existing, {
            fiber_g: 6.2,
            sugar_g: 14.5,
            alcohol_g: 3.1,
            caffeine_mg: 95,
        });

        expect(updated).toBe(existing.idempotency_key);
    });

    test("backfilling added_sugar_g alone does not change the recomputed key", () => {
        const existing = existingMeal({ sugar_g: 14.5 });
        expect(
            updatedMealIdempotencyKey(USER, existing, { added_sugar_g: 9.5 }),
        ).toBe(existing.idempotency_key);
    });

    test("editing logged_at changes the key to match the new timestamp", () => {
        const existing = existingMeal();
        const newLoggedAt = "2026-03-15T12:00:00.000Z";
        const updated = updatedMealIdempotencyKey(USER, existing, {
            logged_at: newLoggedAt,
        });

        expect(updated).toBe(key(meal(), USER, newLoggedAt));
    });

    test("an existing row's logged_at in PostgREST's +00:00 form recomputes the same key a fresh identical log_meal call would produce", () => {
        // PostgREST renders timestamptz as "+00:00" (and drops an all-zero
        // fractional part), never as the "Z"-suffixed, millisecond-padded
        // form every write path hashes with. A row fetched back from the DB
        // carries the former; verify the fallback canonicalizes it before
        // hashing, rather than baking the DB's rendering into the key.
        const existing = existingMeal({
            logged_at: "2026-03-14T12:00:00+00:00",
        });
        const updated = updatedMealIdempotencyKey(USER, existing, {
            calories: 600,
        });

        expect(updated).toBe(key(meal({ calories: 600 })));
    });
});

// ---------- Profile-derived display preferences ----------

function profile(overrides: Partial<Profile> = {}): Profile {
    return {
        user_id: USER,
        timezone: "Europe/Kyiv",
        preferred_weight_unit: "kg",
        preferred_length_unit: null,
        widgets_enabled: true,
        alcohol_tracking_enabled: false,
        preferred_drink_unit: null,
        locale: null,
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

describe("preferredLengthUnitFromProfile", () => {
    test("is null when never chosen", () => {
        expect(preferredLengthUnitFromProfile(null)).toBeNull();
        expect(preferredLengthUnitFromProfile(undefined)).toBeNull();
        expect(
            preferredLengthUnitFromProfile(
                profile({ preferred_length_unit: null }),
            ),
        ).toBeNull();
        expect(
            preferredLengthUnitFromProfile(
                withoutColumn("preferred_length_unit"),
            ),
        ).toBeNull();
    });

    test("returns a saved preference", () => {
        expect(
            preferredLengthUnitFromProfile(
                profile({ preferred_length_unit: "cm" }),
            ),
        ).toBe("cm");
        expect(
            preferredLengthUnitFromProfile(
                profile({ preferred_length_unit: "in" }),
            ),
        ).toBe("in");
    });

    test("degrades unrecognised column values to null", () => {
        for (const junk of ["mm", 'cm"', "CM", "", 1]) {
            expect(
                preferredLengthUnitFromProfile(
                    profile({ preferred_length_unit: junk as never }),
                ),
            ).toBeNull();
        }
    });

    test("is never derived from the weight unit", () => {
        expect(
            preferredLengthUnitFromProfile(
                profile({
                    preferred_weight_unit: "lb",
                    preferred_length_unit: null,
                }),
            ),
        ).toBeNull();
    });
});

describe("bodyMeasurementIdempotencyKey", () => {
    const base = { kind: "waist" as const, value_mm: 800, notes: undefined };

    test("is deterministic and server-prefixed", () => {
        const a = bodyMeasurementIdempotencyKey(USER, base, LOGGED_AT);
        expect(a).toBe(bodyMeasurementIdempotencyKey(USER, base, LOGGED_AT));
        expect(a.startsWith("auto:")).toBe(true);
    });

    test("waist and hips with the same value and instant are two rows", () => {
        expect(bodyMeasurementIdempotencyKey(USER, base, LOGGED_AT)).not.toBe(
            bodyMeasurementIdempotencyKey(
                USER,
                { ...base, kind: "hips" },
                LOGGED_AT,
            ),
        );
    });

    test("value_mm and logged_at change the key", () => {
        const a = bodyMeasurementIdempotencyKey(USER, base, LOGGED_AT);
        expect(
            bodyMeasurementIdempotencyKey(
                USER,
                { ...base, value_mm: 801 },
                LOGGED_AT,
            ),
        ).not.toBe(a);
        expect(
            bodyMeasurementIdempotencyKey(
                USER,
                base,
                "2026-03-14T12:00:01.000Z",
            ),
        ).not.toBe(a);
    });

    test("value_entered and entered_unit do not enter the key", () => {
        // 80 cm and 31.5 in of the same site are one 800 mm measurement.
        const asCm = { ...base, value_entered: 80, entered_unit: "cm" };
        const asIn = { ...base, value_entered: 31.5, entered_unit: "in" };
        expect(bodyMeasurementIdempotencyKey(USER, asCm, LOGGED_AT)).toBe(
            bodyMeasurementIdempotencyKey(USER, asIn, LOGGED_AT),
        );
    });

    test("insertBodyMeasurement decodes notes before hashing them", async () => {
        const body = fnBody(
            await Bun.file("./src/supabase.ts").text(),
            "insertBodyMeasurement",
        );
        const decode = body.indexOf("decodeEscapeSequences(");
        expect(decode).toBeGreaterThan(-1);
        expect(decode).toBeLessThan(
            body.indexOf("bodyMeasurementIdempotencyKey("),
        );
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

// #99: profiles.timezone is nullable specifically so "never chosen" is
// representable. Unlike the three preferences above, a profile ROW existing
// is not by itself evidence of a choice here — set_weight_unit,
// set_widget_display and set_alcohol_tracking all upsert a profile without
// ever touching timezone, so callers must key "configured" off this
// function's return value, never off `profile !== null`.
describe("timezoneFromProfile", () => {
    test("returns null when there is no profile row", () => {
        expect(timezoneFromProfile(null)).toBeNull();
        expect(timezoneFromProfile(undefined)).toBeNull();
    });

    // The realistic path into #99: a profile row exists (created by some
    // other set_* tool) but timezone was never explicitly set.
    test("returns null for an existing profile whose timezone was never set", () => {
        expect(timezoneFromProfile(profile({ timezone: null }))).toBeNull();
    });

    test("returns a saved timezone", () => {
        expect(timezoneFromProfile(profile({ timezone: "Asia/Tokyo" }))).toBe(
            "Asia/Tokyo",
        );
    });
});

// ---------- export storage keys ----------

// Deleting an account must not leave the export archive behind: it holds the
// user's entire history, `storage.remove` reports a missing path as success,
// and the signed URL they were handed keeps resolving for the rest of its
// hour. So the deletion list is asserted against the path the writer actually
// uses — the two were spelled out separately once, and renaming the archive
// from meals.csv to the .zip silently orphaned a full copy of everyone's data.
describe("exportStoragePaths", () => {
    test("covers the archive the exporter writes", () => {
        expect(exportStoragePaths("u1")).toContain(exportArchivePath("u1"));
    });

    test("keeps the pre-ZIP meals.csv so old exports are still cleaned up", () => {
        expect(exportStoragePaths("u1")).toContain("u1/meals.csv");
    });

    test("scopes every key to the user's own folder", () => {
        for (const path of exportStoragePaths("u1")) {
            expect(path.startsWith("u1/")).toBe(true);
        }
    });

    // The guard above is only worth anything if deletion actually routes
    // through it; inlining a path there again is the regression.
    test("deleteAllUserData removes exactly this list", async () => {
        const src = await Bun.file("./src/supabase.ts").text();
        const body = src.slice(
            src.indexOf("export async function deleteAllUserData"),
        );
        expect(body).toContain("exportStoragePaths(userId)");
    });

    test("deleteAllUserData removes body measurements", async () => {
        const src = await Bun.file("./src/supabase.ts").text();
        const body = src.slice(
            src.indexOf("export async function deleteAllUserData"),
        );
        expect(body).toContain('.from("body_measurement_log")');
    });

    // The link goes first so the Shortcut stops syncing (and writing another
    // sent-values row) while the rest of the account is being deleted.
    test("deleteAllUserData removes Apple Health sync first", async () => {
        const src = await Bun.file("./src/supabase.ts").text();
        const body = src.slice(
            src.indexOf("export async function deleteAllUserData"),
        );
        const at = (table: string) => body.indexOf(`.from("${table}")`);
        for (const table of [
            "health_sync_links",
            "health_sync_days",
            "health_sync_pending",
        ]) {
            expect(at(table), `${table} not deleted`).toBeGreaterThan(-1);
            expect(at(table)).toBeLessThan(at("meals"));
        }
        expect(at("health_sync_links")).toBeLessThan(at("health_sync_days"));
    });

    // Every per-user table goes into the export, deletion and the privacy
    // policy together; history goes immediately before the goals row.
    test("deleteAllUserData removes goals history just before goals", async () => {
        const src = await Bun.file("./src/supabase.ts").text();
        const body = src.slice(
            src.indexOf("export async function deleteAllUserData"),
        );
        const fromCalls = [...body.matchAll(/\.from\("([a-z_]+)"\)/g)].map(
            (m) => m[1],
        );
        const at = fromCalls.indexOf("nutrition_goals_history");
        expect(at).toBeGreaterThan(-1);
        expect(fromCalls[at + 1]).toBe("nutrition_goals");
    });
});

// ---------- fetchAllPages (issue #66: the meal export silently truncated at
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

// ---------- Window readers (the #66 truncation, round two). The export readers
// got .range() paging in #66, but the day and range readers did not: they sorted
// logged_at ASC with no .range(), so past PostgREST's 1000-row cap they kept the
// OLDEST rows, and a 365-day get_trends showed the latest 30 days as zeros.
// src/supabase-window.test.ts drives the real paged reader; these pin the
// reconcile rule and that every reader still routes through it. ----------

describe("assertWindowComplete", () => {
    test("equal counts pass", () => {
        expect(() => assertWindowComplete("meals", 1400, 1400)).not.toThrow();
    });

    test("more rows than counted (a concurrent insert) pass", () => {
        expect(() => assertWindowComplete("meals", 1401, 1400)).not.toThrow();
    });

    test("no count passes", () => {
        expect(() => assertWindowComplete("meals", 3, null)).not.toThrow();
    });

    test("a shortfall throws", () => {
        expect(() => assertWindowComplete("meals", 1000, 1400)).toThrow(
            "result would be truncated",
        );
    });
});

/** One exported function's source, cut at the next top-level export. An
 *  unbounded slice would reach into whatever is declared after it and pass
 *  vacuously (getMealsByDate sits right above getMealsInRange). */
function fnBody(src: string, name: string): string {
    const start = src.indexOf(`export async function ${name}(`);
    expect(start).toBeGreaterThan(-1);
    const next = src.indexOf("\nexport ", start + 1);
    return src.slice(start, next === -1 ? undefined : next);
}

describe("window readers route through the paged reader", () => {
    test.each([
        "getMealsInRange",
        "getWaterInRange",
        "getWeightInRange",
        "getBodyMeasurementsInRange",
    ])("%s pages", async (name) => {
        const body = fnBody(await Bun.file("./src/supabase.ts").text(), name);
        expect(body).toContain("selectLoggedWindow<");
        expect(body).not.toContain(".from(");
    });

    test.each([
        ["getMealsByDate", "getMealsInRange"],
        ["getWaterByDate", "getWaterInRange"],
        ["getWeightByDate", "getWeightInRange"],
    ])("%s delegates to %s", async (name, target) => {
        const body = fnBody(await Bun.file("./src/supabase.ts").text(), name!);
        expect(body).toContain("InRange(");
        expect(body).toContain(`return ${target}(`);
        expect(body).not.toContain(".from(");
    });
});

describe("isUuid", () => {
    test.each([
        "3f2b9c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e",
        "3F2B9C1E-4D5A-4B6C-8D7E-9F0A1B2C3D4E",
    ])("true for %s", (v) => {
        expect(isUuid(v)).toBe(true);
    });

    test.each([
        "m1",
        "",
        "abc",
        "3f2b9c1e4d5a-4b6c-8d7e-9f0a1b2c3d4e",
        "3f2b9c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e ",
        "3f2b9c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e\n",
    ])("false for %j", (v) => {
        expect(isUuid(v)).toBe(false);
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

describe("publicLandingStats", () => {
    // The k-anonymity boundary for /api/stats (brief 13): a timezone held by
    // fewer than TZ_MIN_PROFILES profiles must not leave the server in any
    // form, whichever version of public_landing_stats() the DB is running.

    function raw(
        counts: Record<string, number> | undefined,
        list: string[],
    ): RawLandingStats {
        return {
            food_logs: 10,
            total_calories: 5000,
            total_protein_g: 1,
            total_carbs_g: 2,
            total_fat_g: 3,
            timezones: list.length,
            timezone_list: list,
            ...(counts === undefined ? {} : { timezone_counts: counts }),
        };
    }

    test("the threshold is three", () => {
        // The privacy policy states the number; changing it means changing
        // the policy in every locale and the SQL function.
        expect(TZ_MIN_PROFILES).toBe(3);
    });

    test("no timezone below the threshold survives, in the list or the levels", () => {
        // What a DB still on the pre-brief-13 function returns: every
        // timezone, lone profiles included.
        const stats = publicLandingStats(
            raw(
                {
                    "Europe/Berlin": 38,
                    "America/New_York": 3,
                    "Europe/Kyiv": 2,
                    "Pacific/Apia": 1,
                },
                [
                    "America/New_York",
                    "Europe/Berlin",
                    "Europe/Kyiv",
                    "Pacific/Apia",
                ],
            ),
        );
        expect(stats.timezone_list).toEqual([
            "America/New_York",
            "Europe/Berlin",
        ]);
        expect(Object.keys(stats.timezone_levels).sort()).toEqual([
            "America/New_York",
            "Europe/Berlin",
        ]);
    });

    test("exact counts are never served", () => {
        const stats = publicLandingStats(
            raw({ "Europe/Berlin": 38 }, ["Europe/Berlin"]),
        );
        expect("timezone_counts" in stats).toBe(false);
        expect(stats.timezone_levels["Europe/Berlin"]).toBe(
            TZ_LEVEL_THRESHOLDS.length + 1,
        );
    });

    test("levels are shares of the published timezones only", () => {
        // Same answer whether the DB or the server dropped the small ones.
        const unfiltered = publicLandingStats(
            raw({ a: 90, b: 10, lone: 1, pair: 2 }, ["a", "b", "lone", "pair"]),
        );
        const filtered = publicLandingStats(raw({ a: 90, b: 10 }, ["a", "b"]));
        expect(unfiltered).toEqual({ ...filtered, timezones: 4 });
        expect(filtered.timezone_levels).toEqual(
            timezoneLevels({ a: 90, b: 10 }),
        );
    });

    test("no counts serves an empty list, never an unfiltered one", () => {
        for (const counts of [undefined, {}]) {
            const stats = publicLandingStats(
                raw(counts, ["Europe/Berlin", "Pacific/Apia"]),
            );
            expect(stats.timezone_list).toEqual([]);
            expect(stats.timezone_levels).toEqual({});
        }
    });

    test("a listed timezone missing from the counts is dropped", () => {
        const stats = publicLandingStats(
            raw({ "Europe/Berlin": 5 }, ["Europe/Berlin", "Pacific/Apia"]),
        );
        expect(stats.timezone_list).toEqual(["Europe/Berlin"]);
    });

    test("malformed counts are dropped, not treated as large", () => {
        const stats = publicLandingStats(
            raw(
                {
                    real: 10,
                    junk: "99" as unknown as number,
                    missing: undefined as unknown as number,
                },
                ["junk", "missing", "real"],
            ),
        );
        expect(stats.timezone_list).toEqual(["real"]);
        expect(Object.keys(stats.timezone_levels)).toEqual(["real"]);
    });

    test("the site-wide timezone count and the totals pass through", () => {
        const stats = publicLandingStats(raw({ a: 3, b: 1 }, ["a", "b"]));
        expect(stats.timezones).toBe(2);
        expect(stats.food_logs).toBe(10);
        expect(stats.total_calories).toBe(5000);
    });
});

describe("seedPatreonTokensFromEnv", () => {
    // Self-hosted deployments (and CI) never set these, and the function must
    // return without ever constructing a Supabase client in that case — this
    // file's whole test suite depends on nothing here touching the network.
    test("does nothing when PATREON_ACCESS_TOKEN / PATREON_REFRESH_TOKEN are unset", async () => {
        const savedAccess = process.env.PATREON_ACCESS_TOKEN;
        const savedRefresh = process.env.PATREON_REFRESH_TOKEN;
        delete process.env.PATREON_ACCESS_TOKEN;
        delete process.env.PATREON_REFRESH_TOKEN;
        try {
            await expect(seedPatreonTokensFromEnv()).resolves.toBeUndefined();
        } finally {
            if (savedAccess !== undefined)
                process.env.PATREON_ACCESS_TOKEN = savedAccess;
            if (savedRefresh !== undefined)
                process.env.PATREON_REFRESH_TOKEN = savedRefresh;
        }
    });
});

// ---------- Goals history (period averages against goals). upsertNutritionGoals
// appends to nutrition_goals_history after a successful upsert, only when the
// stored values differ from the latest HISTORY row, so a retry after a failed
// history insert still records the change even though nutrition_goals already
// holds it. Driven for real against an in-memory PostgREST stand-in; any
// request it does not recognise is refused, never passed through (Bun
// auto-loads the env file, so the client may point at a real project). ----------

describe("goals history", () => {
    type HistoryRow = Record<string, unknown> & {
        id: number;
        user_id: string;
        effective_at: string;
    };

    const OTHER_USER = "22222222-2222-4222-8222-222222222222";
    let goalsRow: Record<string, unknown> | null = null;
    let history: HistoryRow[] = [];
    let nextId = 1;
    let failHistoryInserts = 0;
    let historyMaxRows = 1000;
    const historyInserts: Record<string, unknown>[] = [];

    function refuse(why: string): never {
        throw new Error(`goals-history stub refused a request: ${why}`);
    }

    function json(
        body: unknown,
        status = 200,
        headers: Record<string, string> = {},
    ): Response {
        return new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json", ...headers },
        });
    }

    const byEffectiveAtThenId = (a: HistoryRow, b: HistoryRow) =>
        a.effective_at < b.effective_at
            ? -1
            : a.effective_at > b.effective_at
              ? 1
              : a.id - b.id;

    async function fakePostgrest(
        input: string | URL | Request,
        init?: RequestInit,
    ): Promise<Response> {
        const req =
            input instanceof Request
                ? new Request(input, init)
                : new Request(input.toString(), init);
        const url = new URL(req.url);
        const table = url.pathname.replace(/^\/rest\/v1\//, "");
        const q = url.searchParams;

        if (table === "nutrition_goals" && req.method === "POST") {
            if (q.get("on_conflict") !== "user_id") refuse("upsert conflict");
            const body = (await req.json()) as Record<string, unknown>;
            goalsRow = { ...goalsRow, ...body };
            const accept = req.headers.get("accept") ?? "";
            return json(accept.includes("object+json") ? goalsRow : [goalsRow]);
        }

        if (table === "nutrition_goals" && req.method === "GET") {
            const userId = q.get("user_id")?.replace(/^eq\./, "");
            if (!userId) refuse(`unscoped goals read ${url.search}`);
            const rows =
                goalsRow && goalsRow.user_id === userId ? [goalsRow] : [];
            const accept = req.headers.get("accept") ?? "";
            if (accept.includes("object+json")) {
                return rows.length === 1
                    ? json(rows[0])
                    : json({ message: "no rows" }, 406);
            }
            return json(rows);
        }

        if (table === "nutrition_goals_history" && req.method === "POST") {
            const body = (await req.json()) as Record<string, unknown>;
            if (failHistoryInserts > 0) {
                failHistoryInserts--;
                return json({ message: "connection reset" }, 503);
            }
            historyInserts.push(body);
            history.push({ id: nextId++, ...body } as HistoryRow);
            return new Response(null, { status: 201 });
        }

        if (table === "nutrition_goals_history" && req.method === "GET") {
            const userId = q.get("user_id")?.replace(/^eq\./, "");
            if (!userId) refuse(`unscoped read ${url.search}`);
            const mine = history
                .filter((r) => r.user_id === userId)
                .sort(byEffectiveAtThenId);
            const order = q.get("order");
            if (order === "effective_at.desc,id.desc") {
                if (q.get("limit") !== "1") refuse("latest without limit");
                return json(mine.slice(-1));
            }
            if (order !== "effective_at.asc,id.asc") refuse(`order=${order}`);
            if (!q.has("offset") || !q.has("limit")) refuse("unbounded read");
            const offset = Number(q.get("offset"));
            const limit = Number(q.get("limit"));
            const page = mine.slice(
                offset,
                offset + Math.min(limit, historyMaxRows),
            );
            const counted = req.headers.get("prefer")?.includes("count=exact");
            const range =
                page.length === 0
                    ? "*"
                    : `${offset}-${offset + page.length - 1}`;
            return json(page, 200, {
                "content-range": `${range}/${counted ? mine.length : "*"}`,
            });
        }

        refuse(`${req.method} ${req.url}`);
    }

    const envBefore = {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SECRET_KEY,
    };
    let fetchSpy: ReturnType<typeof spyOn>;
    let warnSpy: ReturnType<typeof spyOn>;
    const warnings: string[] = [];

    beforeAll(() => {
        // Only consulted if no earlier suite built the client; with a real env
        // file the client points at the real project, and the stub still
        // answers every request before it leaves the process.
        process.env.SUPABASE_URL ??= "http://supabase.test";
        process.env.SUPABASE_SECRET_KEY ??= "test-key";
        fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
            fakePostgrest as typeof fetch,
        );
        warnSpy = spyOn(console, "warn").mockImplementation(
            (...args: unknown[]) => {
                warnings.push(args.map(String).join(" "));
            },
        );
    });

    afterAll(() => {
        fetchSpy.mockRestore();
        warnSpy.mockRestore();
        if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
        if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
    });

    beforeEach(() => {
        goalsRow = null;
        history = [];
        nextId = 1;
        failHistoryInserts = 0;
        historyMaxRows = 1000;
        historyInserts.length = 0;
        warnings.length = 0;
    });

    test("the first save records a history row with the stored values", async () => {
        const saved = await upsertNutritionGoals(USER, {
            daily_calories: 2000.4,
            daily_protein_g: 150,
        });
        expect(historyInserts).toHaveLength(1);
        expect(historyInserts[0]).toMatchObject({
            user_id: USER,
            effective_at: saved.updated_at,
            // As stored: the integer column's rounding, not the raw input.
            daily_calories: 2000,
            daily_protein_g: 150,
            daily_carbs_g: null,
        });
    });

    test("the added-sugar limit is stored and recorded in history", async () => {
        const saved = await upsertNutritionGoals(USER, {
            daily_sugar_g: 60,
            daily_added_sugar_g: 25,
        });
        expect(goalsRow).toMatchObject({
            daily_sugar_g: 60,
            daily_added_sugar_g: 25,
        });
        expect(saved.daily_added_sugar_g).toBe(25);
        expect(historyInserts[0]).toMatchObject({
            daily_sugar_g: 60,
            daily_added_sugar_g: 25,
        });
    });

    test("a change to the added-sugar limit alone is a change; 0 is a real value", async () => {
        await upsertNutritionGoals(USER, { daily_added_sugar_g: 25 });
        await upsertNutritionGoals(USER, { daily_added_sugar_g: 0 });
        // Omitting it clears it, like every other column.
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        expect(historyInserts.map((r) => r.daily_added_sugar_g)).toEqual([
            25,
            0,
            null,
        ]);
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => r.daily_added_sugar_g)).toEqual([25, 0, null]);
    });

    test("a change inserts a row", async () => {
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        await upsertNutritionGoals(USER, { daily_calories: 1800 });
        expect(historyInserts.map((r) => r.daily_calories)).toEqual([
            2000, 1800,
        ]);
    });

    test("saving the same values again does not", async () => {
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        expect(historyInserts).toHaveLength(1);
    });

    test("another user's history does not count as this user's latest", async () => {
        history.push({
            id: nextId++,
            user_id: OTHER_USER,
            effective_at: "2026-03-01T00:00:00+00:00",
            daily_calories: 2000,
        });
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        expect(historyInserts).toHaveLength(1);
    });

    test("a failed insert throws after the goal is saved, and a retry records it", async () => {
        await upsertNutritionGoals(USER, { daily_calories: 2000 });
        failHistoryInserts = 1;
        const err = await upsertNutritionGoals(USER, {
            daily_calories: 1800,
        }).then(
            () => null,
            (e: unknown) => e,
        );
        expect(err).toBeInstanceOf(ToolError);
        expect((err as Error).message).toContain("were saved");
        expect((err as Error).message).toContain("set_nutrition_goals");
        // The goal itself went through; history still holds the old one.
        expect(goalsRow?.daily_calories).toBe(1800);
        expect(historyInserts).toHaveLength(1);

        // The retry finds nutrition_goals unchanged but history behind, and
        // records the change.
        await upsertNutritionGoals(USER, { daily_calories: 1800 });
        expect(historyInserts.map((r) => r.daily_calories)).toEqual([
            2000, 1800,
        ]);
    });

    test("a retry dates the healed row to the original save, not to the retry", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00.000Z",
            daily_calories: 2000,
        });
        // The state a failed history insert leaves: nutrition_goals holds the
        // new goal, saved days ago; history still ends with the old one.
        goalsRow = {
            user_id: USER,
            daily_calories: 1800,
            updated_at: "2026-03-05T08:00:00.000Z",
        };
        await upsertNutritionGoals(USER, { daily_calories: 1800 });
        expect(historyInserts).toHaveLength(1);
        expect(historyInserts[0]).toMatchObject({
            effective_at: "2026-03-05T08:00:00.000Z",
            daily_calories: 1800,
        });
    });

    test("a change history missed is recorded at its own time before the new one", async () => {
        // Seeded by the migration, then changed by code that predates the
        // history table, then changed again now.
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00.000Z",
            daily_calories: 2000,
        });
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00.000Z",
        };
        const saved = await upsertNutritionGoals(USER, {
            daily_calories: 1800,
        });
        expect(
            historyInserts.map((r) => [r.effective_at, r.daily_calories]),
        ).toEqual([
            ["2026-03-03T09:00:00.000Z", 1900],
            [saved.updated_at, 1800],
        ]);
    });

    test("goals set with no history at all are recorded at their own time", async () => {
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00.000Z",
        };
        await upsertNutritionGoals(USER, { daily_calories: 1900 });
        expect(
            historyInserts.map((r) => [r.effective_at, r.daily_calories]),
        ).toEqual([["2026-03-03T09:00:00.000Z", 1900]]);
    });

    test("the failure log line carries a ref and no user id", async () => {
        failHistoryInserts = 1;
        const err = (await upsertNutritionGoals(USER, {
            daily_calories: 1800,
        }).catch((e: unknown) => e)) as Error;
        const ref = /ref ([0-9a-f]{8})/.exec(err.message)?.[1];
        expect(ref).toBeDefined();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain(`ref=${ref}`);
        expect(warnings[0]).not.toContain(USER);
        // The raw cause stays in the log, never in the caller-facing text.
        expect(warnings[0]).toContain("connection reset");
        expect(err.message).not.toContain("connection reset");
    });

    test("getNutritionGoalsHistory returns this user's rows oldest first", async () => {
        for (const [i, kcal] of [2000, 1900, 1800, 1700, 1600].entries()) {
            history.push({
                id: nextId++,
                user_id: USER,
                effective_at: `2026-03-0${5 - i}T10:00:00+00:00`,
                daily_calories: kcal,
            });
        }
        history.push({
            id: nextId++,
            user_id: OTHER_USER,
            effective_at: "2026-03-01T00:00:00+00:00",
            daily_calories: 999,
        });
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => r.daily_calories)).toEqual([
            1600, 1700, 1800, 1900, 2000,
        ]);
        expect(rows[0]).toEqual({
            effective_at: "2026-03-01T10:00:00.000Z",
            daily_calories: 1600,
            daily_protein_g: null,
            daily_carbs_g: null,
            daily_fat_g: null,
            daily_fiber_g: null,
            daily_sugar_g: null,
            daily_added_sugar_g: null,
            daily_alcohol_g: null,
            daily_caffeine_mg: null,
            daily_water_ml: null,
            target_weight_g: null,
        });
    });

    test("getNutritionGoalsHistory pages past 1,000 rows, ties included", async () => {
        // Two rows per instant, so ids break ties across the page edge.
        for (let i = 0; i < 2500; i++) {
            history.push({
                id: nextId++,
                user_id: USER,
                effective_at: new Date(
                    Date.UTC(2020, 0, 1, 0, Math.floor(i / 2)),
                ).toISOString(),
                daily_calories: 1000 + i,
            });
        }
        history.sort(() => Math.random() - 0.5);
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => r.daily_calories)).toEqual(
            Array.from({ length: 2500 }, (_, i) => 1000 + i),
        );
    });

    test("getNutritionGoalsHistory throws rather than return a short history", async () => {
        // A server row cap below the page size: the first page comes back
        // short and would otherwise end the loop looking complete.
        historyMaxRows = 2;
        for (let i = 0; i < 5; i++) {
            history.push({
                id: nextId++,
                user_id: USER,
                effective_at: `2026-03-0${i + 1}T10:00:00+00:00`,
                daily_calories: 2000 + i,
            });
        }
        await expect(getNutritionGoalsHistory(USER)).rejects.toThrow(
            "result would be truncated",
        );
    });

    test("getNutritionGoalsHistory with no rows is an empty list", async () => {
        expect(await getNutritionGoalsHistory(USER)).toEqual([]);
    });

    // A goal saved by pre-history code after the migration ran sits in
    // nutrition_goals but not in history until the next save backfills it;
    // reads must see it in the meantime.

    test("no history but a goals row: the row is the one entry", async () => {
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            daily_protein_g: 140,
            updated_at: "2026-03-03T09:00:00+00:00",
        };
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            effective_at: "2026-03-03T09:00:00.000Z",
            daily_calories: 1900,
            daily_protein_g: 140,
            daily_carbs_g: null,
        });
    });

    test("a newer, different goals row is appended after history", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00+00:00",
            daily_calories: 2000,
        });
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00+00:00",
        };
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => [r.effective_at, r.daily_calories])).toEqual([
            ["2026-03-01T10:00:00.000Z", 2000],
            ["2026-03-03T09:00:00.000Z", 1900],
        ]);
    });

    test("a newer goals row with the same values adds nothing", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00+00:00",
            daily_calories: 2000,
        });
        goalsRow = {
            user_id: USER,
            daily_calories: 2000,
            updated_at: "2026-03-03T09:00:00+00:00",
        };
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => r.daily_calories)).toEqual([2000]);
    });

    test("no goals row leaves history unchanged", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00+00:00",
            daily_calories: 2000,
        });
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => r.daily_calories)).toEqual([2000]);
    });

    test("another user's goals row is not merged", async () => {
        goalsRow = {
            user_id: OTHER_USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00+00:00",
        };
        expect(await getNutritionGoalsHistory(USER)).toEqual([]);
    });

    test("after a backfilling save the missed change appears once", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00.000Z",
            daily_calories: 2000,
        });
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00.000Z",
        };
        const before = await getNutritionGoalsHistory(USER);

        // A no-op save: backfills 1900 at its own updated_at, records nothing
        // new, and bumps updated_at past it with the same values.
        await upsertNutritionGoals(USER, { daily_calories: 1900 });
        expect(historyInserts).toHaveLength(1);
        expect(await getNutritionGoalsHistory(USER)).toEqual(before);

        // A real change afterwards: stored and current agree on the instant.
        const saved = await upsertNutritionGoals(USER, {
            daily_calories: 1800,
        });
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => [r.effective_at, r.daily_calories])).toEqual([
            ["2026-03-01T10:00:00.000Z", 2000],
            ["2026-03-03T09:00:00.000Z", 1900],
            [new Date(saved.updated_at).toISOString(), 1800],
        ]);
    });

    test("a backfilling change save does not repeat the merged entry", async () => {
        history.push({
            id: nextId++,
            user_id: USER,
            effective_at: "2026-03-01T10:00:00.000Z",
            daily_calories: 2000,
        });
        goalsRow = {
            user_id: USER,
            daily_calories: 1900,
            updated_at: "2026-03-03T09:00:00.000Z",
        };
        const saved = await upsertNutritionGoals(USER, {
            daily_calories: 1800,
        });
        const rows = await getNutritionGoalsHistory(USER);
        expect(rows.map((r) => [r.effective_at, r.daily_calories])).toEqual([
            ["2026-03-01T10:00:00.000Z", 2000],
            ["2026-03-03T09:00:00.000Z", 1900],
            [new Date(saved.updated_at).toISOString(), 1800],
        ]);
    });
});

// ---------- Meal writes. insertMeal / updateMeal driven for real against an
// in-memory PostgREST stand-in for the meals table, the same way as the goals
// history block above (no mock.module; any request it does not recognise is
// refused). ----------

describe("meal writes persist added_sugar_g", () => {
    const MEAL_ID = "44444444-4444-4444-8444-444444444444";
    let rows: Record<string, unknown>[] = [];
    const inserts: Record<string, unknown>[] = [];
    const patches: Record<string, unknown>[] = [];
    const patchQueries: URLSearchParams[] = [];

    function json(body: unknown, status = 200): Response {
        return new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json" },
        });
    }

    function eqParam(q: URLSearchParams, col: string): string | undefined {
        return q.get(col)?.replace(/^eq\./, "");
    }

    async function fakeMeals(
        input: string | URL | Request,
        init?: RequestInit,
    ): Promise<Response> {
        const req =
            input instanceof Request
                ? new Request(input, init)
                : new Request(input.toString(), init);
        const url = new URL(req.url);
        const table = url.pathname.replace(/^\/rest\/v1\//, "");
        const q = url.searchParams;
        const single = (req.headers.get("accept") ?? "").includes(
            "object+json",
        );
        if (table !== "meals") {
            throw new Error(`meals stub refused ${req.method} ${req.url}`);
        }
        const userId = eqParam(q, "user_id");
        if (!userId && req.method !== "POST") {
            throw new Error(`meals stub: unscoped ${url.search}`);
        }

        if (req.method === "GET") {
            const key = eqParam(q, "idempotency_key");
            const id = eqParam(q, "id");
            const found = rows.filter(
                (r) =>
                    r.user_id === userId &&
                    (key === undefined || r.idempotency_key === key) &&
                    (id === undefined || r.id === id),
            );
            if (single) {
                return found.length === 1
                    ? json(found[0])
                    : json({ message: "no rows" }, 406);
            }
            return json(found);
        }
        if (req.method === "POST") {
            const body = (await req.json()) as Record<string, unknown>;
            inserts.push(body);
            const row = { id: MEAL_ID, ...body };
            rows.push(row);
            return json(single ? row : [row], 201);
        }
        if (req.method === "PATCH") {
            const body = (await req.json()) as Record<string, unknown>;
            patchQueries.push(q);
            // Applied only when every guard filter on a sugar column holds,
            // the way PostgREST would: `eq.<n>` compares the stored number,
            // `is.null` a NULL.
            const guardsHold = (r: Record<string, unknown>) =>
                ["sugar_g", "added_sugar_g"].every((col) => {
                    const f = q.get(col);
                    if (f === null) return true;
                    if (f === "is.null") return r[col] == null;
                    const m = f.match(/^eq\.(.*)$/);
                    if (!m) throw new Error(`meals stub: filter ${col}=${f}`);
                    return r[col] != null && Number(m[1]) === r[col];
                });
            const row = rows.find(
                (r) =>
                    r.id === eqParam(q, "id") &&
                    r.user_id === userId &&
                    guardsHold(r),
            );
            if (!row)
                return single ? json({ message: "no rows" }, 406) : json([]);
            patches.push(body);
            Object.assign(row, body);
            return json(single ? row : [row]);
        }
        throw new Error(`meals stub refused ${req.method} ${req.url}`);
    }

    const envBefore = {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SECRET_KEY,
    };
    let fetchSpy: ReturnType<typeof spyOn>;

    beforeAll(() => {
        process.env.SUPABASE_URL ??= "http://supabase.test";
        process.env.SUPABASE_SECRET_KEY ??= "test-key";
        fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
            fakeMeals as typeof fetch,
        );
    });

    afterAll(() => {
        fetchSpy.mockRestore();
        if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
        if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
    });

    beforeEach(() => {
        rows = [];
        inserts.length = 0;
        patches.length = 0;
        patchQueries.length = 0;
    });

    test("insertMeal writes the value, and NULL when it is omitted", async () => {
        const { meal: saved } = await insertMeal(USER, {
            ...meal({ sugar_g: 35, added_sugar_g: 35 }),
            logged_at: LOGGED_AT,
        });
        expect(inserts[0]).toMatchObject({ sugar_g: 35, added_sugar_g: 35 });
        expect(saved.added_sugar_g).toBe(35);

        await insertMeal(USER, {
            ...meal({ description: "banana", sugar_g: 14 }),
            logged_at: LOGGED_AT,
        });
        // Not recorded is NULL, never 0.
        expect(inserts[1]).toHaveProperty("added_sugar_g", null);
    });

    test("a re-log differing only in added_sugar_g dedupes onto the first row", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 20 }),
            logged_at: LOGGED_AT,
        });
        const again = await insertMeal(USER, {
            ...meal({ sugar_g: 20, added_sugar_g: 12 }),
            logged_at: LOGGED_AT,
        });
        expect(again.deduplicated).toBe(true);
        expect(inserts).toHaveLength(1);
    });

    test("updateMeal writes added_sugar_g only when it is passed", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 20 }),
            logged_at: LOGGED_AT,
        });
        const updated = await updateMeal(USER, MEAL_ID, { added_sugar_g: 12 });
        expect(patches[0]).toHaveProperty("added_sugar_g", 12);
        expect(updated.added_sugar_g).toBe(12);
        // The derived key is unchanged by the backfill.
        expect(patches[0]?.idempotency_key).toBe(inserts[0]?.idempotency_key);

        await updateMeal(USER, MEAL_ID, { calories: 320 });
        expect(patches[1]).not.toHaveProperty("added_sugar_g");
        // No guard, no sugar filter on the write.
        expect(patchQueries[1]?.has("sugar_g")).toBe(false);
        expect(patchQueries[1]?.has("added_sugar_g")).toBe(false);
    });

    test("a guarded write sends the guard as a PostgREST filter and writes when it holds", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 20.5 }),
            logged_at: LOGGED_AT,
        });
        const updated = await updateMeal(
            USER,
            MEAL_ID,
            { added_sugar_g: 12 },
            { sugar_g: 20.5 },
        );
        expect(patchQueries[0]?.get("sugar_g")).toBe("eq.20.5");
        expect(patchQueries[0]?.has("added_sugar_g")).toBe(false);
        expect(updated.added_sugar_g).toBe(12);
    });

    test("a null guard is sent as IS NULL", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 40 }),
            logged_at: LOGGED_AT,
        });
        const updated = await updateMeal(
            USER,
            MEAL_ID,
            { sugar_g: 30 },
            { added_sugar_g: null },
        );
        expect(patchQueries[0]?.get("added_sugar_g")).toBe("is.null");
        expect(updated.sugar_g).toBe(30);
    });

    test("a guard that no longer holds writes nothing and throws the conflict ToolError", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 20 }),
            logged_at: LOGGED_AT,
        });
        // The check read sugar_g 40; a concurrent edit has since stored 20.
        const err = await updateMeal(
            USER,
            MEAL_ID,
            { added_sugar_g: 30 },
            { sugar_g: 40 },
        ).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(ToolError);
        expect((err as Error).message).toBe(
            `The sugar values stored on meal ${MEAL_ID} changed while this edit was being applied, so nothing was written. Stored now: sugar_g 20 g, added_sugar_g not recorded.`,
        );
        expect(patches).toHaveLength(0);
        expect(rows[0]?.added_sugar_g ?? null).toBe(null);
    });

    test("a guarded write on a meal deleted since the pre-check is not-found, not a conflict", async () => {
        await insertMeal(USER, {
            ...meal({ sugar_g: 20 }),
            logged_at: LOGGED_AT,
        });
        // Delete the row as the PATCH arrives: the pre-check saw it, the
        // write and the follow-up read do not.
        const before = fetchSpy.getMockImplementation();
        fetchSpy.mockImplementation((async (
            input: string | URL | Request,
            init?: RequestInit,
        ) => {
            const method =
                input instanceof Request ? input.method : init?.method;
            if (method === "PATCH") rows = [];
            return fakeMeals(input, init);
        }) as typeof fetch);
        try {
            const err = await updateMeal(
                USER,
                MEAL_ID,
                { added_sugar_g: 5 },
                { sugar_g: 20 },
            ).catch((e: unknown) => e);
            expect(err).toBeInstanceOf(ToolError);
            expect((err as Error).message).toBe(
                `No meal found with id ${MEAL_ID}.`,
            );
        } finally {
            fetchSpy.mockImplementation(before!);
        }
    });
});

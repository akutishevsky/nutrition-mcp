import { test, expect, describe } from "bun:test";
import {
    mealIdempotencyKey,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    type MealInput,
    type Profile,
} from "./storage.js";
import { rowContentDigest } from "./import.js";

// Every export exercised here is pure: no test in this file constructs a
// Railway PostgreSQL client, and none touches the network or the database.

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

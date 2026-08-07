import { test, expect } from "bun:test";
import { z } from "zod";
import type { MealInput, MealInsertResult, Meal } from "./supabase.js";
import {
    serializeImportResult,
    BULK_IMPORT_OUTPUT_SCHEMA,
    resolveLoggedAt,
    normalizeMealType,
    inferMealType,
    synthesizeDescription,
    validateRow,
    assignIdempotencyKeys,
    checkBatch,
    buildSummaryText,
    runImport,
    MAX_ROWS_PER_CALL,
    type ImportRow,
    type ImportDeps,
} from "./import.js";
import { dateInTz } from "./tz.js";

const NOW = Date.parse("2026-07-25T12:00:00Z");
const TZ = "Europe/Kyiv";

// ---------- fake store: mirrors insertMeal's dedup contract ----------

/** Simulates insertMeal: a row whose (user, idempotency_key) already exists is
 *  returned as deduplicated instead of inserted again. */
function makeStore(
    opts: {
        failOn?: (input: MealInput) => boolean;
        tzConfigured?: boolean;
    } = {},
) {
    const byKey = new Map<string, Meal>();
    const byId = new Map<string, Meal>();
    const inserted: MealInput[] = [];
    let counter = 0;
    // Real meal ids are Postgres uuids, and the importer only treats a
    // uuid-shaped source_id as capable of naming a meal — a fake minting
    // "meal-1" would make every source_id test vacuously pass.
    const nextId = () =>
        `11111111-1111-4111-8111-${String(++counter).padStart(12, "0")}`;
    const deps: ImportDeps = {
        userId: "user-1",
        tz: TZ,
        tzConfigured: opts.tzConfigured ?? true,
        nowMs: NOW,
        async insert(input: MealInput): Promise<MealInsertResult> {
            if (opts.failOn?.(input)) throw new Error("simulated db failure");
            const key = input.idempotency_key!;
            const existing = byKey.get(key);
            if (existing) return { meal: existing, deduplicated: true };
            const meal = {
                id: nextId(),
                user_id: "user-1",
                logged_at: input.logged_at!,
                meal_type: input.meal_type,
                description: input.description,
                calories: input.calories ?? null,
                protein_g: input.protein_g ?? null,
                carbs_g: input.carbs_g ?? null,
                fat_g: input.fat_g ?? null,
                notes: input.notes ?? null,
                idempotency_key: key,
            } as Meal;
            byKey.set(key, meal);
            byId.set(meal.id, meal);
            inserted.push({ ...input });
            return { meal, deduplicated: false };
        },
        async existingKeys(keys: string[]) {
            return new Set(keys.filter((k) => byKey.has(k)));
        },
        async existingMealIds(ids: string[]) {
            return new Set(ids.filter((id) => byId.has(id)));
        },
    };
    return { deps, inserted, byKey, byId };
}

function row(over: Partial<ImportRow> & { source_line: number }): ImportRow {
    return {
        description: "Oatmeal",
        logged_at: "2026-01-15",
        meal_type: "breakfast",
        calories: 300,
        ...over,
    };
}

function args(meals: ImportRow[], over: Record<string, unknown> = {}) {
    return {
        meals,
        expected_row_count: meals.length,
        ...over,
    } as Parameters<typeof runImport>[0];
}

// ---------- resolveLoggedAt ----------

test("resolveLoggedAt accepts the three documented forms", () => {
    // Offset form: taken as the absolute instant it names.
    const withOffset = resolveLoggedAt("2026-01-05T08:30:00+02:00", TZ, NOW);
    expect(withOffset.ok).toBe(true);
    if (withOffset.ok)
        expect(withOffset.value.iso).toBe("2026-01-05T06:30:00.000Z");

    const zulu = resolveLoggedAt("2026-01-05T06:30:00Z", TZ, NOW);
    expect(zulu.ok).toBe(true);
    if (zulu.ok) expect(zulu.value.iso).toBe("2026-01-05T06:30:00.000Z");

    // Offset-less local time: resolved in the profile timezone (Kyiv is +02:00
    // in January). This is the form every real fitness export actually emits.
    const local = resolveLoggedAt("2026-01-05T08:30", TZ, NOW);
    expect(local.ok).toBe(true);
    if (local.ok) {
        expect(local.value.iso).toBe("2026-01-05T06:30:00.000Z");
        expect(local.value.fromBareDate).toBe(false);
    }
    // Space separator, as the server's own CSV export writes it.
    const spaced = resolveLoggedAt("2026-01-05 08:30:00", TZ, NOW);
    expect(spaced.ok).toBe(true);
    if (spaced.ok) expect(spaced.value.iso).toBe("2026-01-05T06:30:00.000Z");

    // Bare date: local noon, flagged.
    const bare = resolveLoggedAt("2026-01-05", TZ, NOW);
    expect(bare.ok).toBe(true);
    if (bare.ok) {
        expect(bare.value.fromBareDate).toBe(true);
        expect(dateInTz(bare.value.iso, TZ)).toBe("2026-01-05");
    }
});

test("resolveLoggedAt resolves offset-less local time using the HISTORICAL offset", () => {
    // The point of server-side resolution: a January row must use +02:00 even
    // though the import runs in July when Kyiv is +03:00. A client stamping
    // today's offset would place this on the previous day.
    const r = resolveLoggedAt("2026-01-15T00:30", TZ, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
        expect(r.value.iso).toBe("2026-01-14T22:30:00.000Z");
        expect(dateInTz(r.value.iso, TZ)).toBe("2026-01-15");
    }
});

test("resolveLoggedAt rejects dates that would silently roll over", () => {
    // A DD/MM vs MM/DD swap is the usual cause; unchecked, Date.UTC turns
    // 2026-13-01 into 2027-01-01 and the calorie control total still matches.
    for (const bad of [
        "2026-13-01",
        "2026-02-30",
        "2026-01-32",
        "2026-00-10",
        "26-01-05",
        "2026-1-5",
        "garbage",
        "",
    ]) {
        const r = resolveLoggedAt(bad, TZ, NOW);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.field).toBe("logged_at");
    }
    expect(resolveLoggedAt(undefined, TZ, NOW).ok).toBe(false);
});

test("resolveLoggedAt rejects a local date that never existed in the zone", () => {
    // Samoa skipped 2011-12-30 entirely when it crossed the dateline. Without
    // the round-trip assertion this would silently land on the 31st.
    const r = resolveLoggedAt("2011-12-30", "Pacific/Apia", NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/does not exist in timezone/);
    // The same date is perfectly ordinary elsewhere.
    expect(resolveLoggedAt("2011-12-30", "UTC", NOW).ok).toBe(true);
});

test("resolveLoggedAt bounds the date range without blocking backfill", () => {
    expect(resolveLoggedAt("2010-01-01", TZ, NOW).ok).toBe(true); // 16y back: fine
    expect(resolveLoggedAt("1999-01-01", TZ, NOW).ok).toBe(false); // >20y
    expect(resolveLoggedAt("2026-07-26", TZ, NOW).ok).toBe(true); // tomorrow: fine
    const far = resolveLoggedAt("2027-01-01", TZ, NOW);
    expect(far.ok).toBe(false);
    if (!far.ok) expect(far.error.message).toMatch(/future/);
});

// ---------- meal type ----------

test("normalizeMealType treats blank-ish source cells as absent, not snack", () => {
    // Regression: if "" folded to snack, a file with an empty meal-type column
    // became hundreds of snacks with no inference flag.
    for (const blank of ["", "   ", "n/a", "N/A", "-", "null", "none"]) {
        expect(normalizeMealType(blank)).toBeNull();
    }
    expect(normalizeMealType(undefined)).toBeNull();

    expect(normalizeMealType("Breakfast")).toBe("breakfast");
    expect(normalizeMealType("  DINNER ")).toBe("dinner");
    expect(normalizeMealType("Snacks")).toBe("snack");
    expect(normalizeMealType("other")).toBe("snack"); // FatSecret
    expect(normalizeMealType("Second breakfast")).toBe("snack"); // Cronometer
});

test("inferMealType uses local-time cutoffs", () => {
    const at = (local: string) =>
        inferMealType(
            (resolveLoggedAt(local, TZ, NOW) as { value: { iso: string } })
                .value.iso,
            TZ,
        );
    expect(at("2026-01-15T07:00")).toBe("breakfast");
    expect(at("2026-01-15T10:29")).toBe("breakfast");
    expect(at("2026-01-15T10:30")).toBe("lunch");
    expect(at("2026-01-15T14:59")).toBe("lunch");
    expect(at("2026-01-15T15:00")).toBe("dinner");
    expect(at("2026-01-15T21:29")).toBe("dinner");
    expect(at("2026-01-15T21:30")).toBe("snack");
    expect(at("2026-01-15T23:30")).toBe("snack");
});

// ---------- description synthesis ----------

test("synthesizeDescription only fires when the meal type came from the file", () => {
    expect(synthesizeDescription("breakfast", false, "myfitnesspal")).toBe(
        "Breakfast (imported from MyFitnessPal)",
    );
    expect(synthesizeDescription("lunch", false, undefined)).toBe(
        "Lunch (imported, no food detail in source)",
    );
    // An inferred meal type is not evidence of what was eaten.
    expect(synthesizeDescription("snack", true, "myfitnesspal")).toBeNull();
});

test("a row with neither description nor meal_type is rejected, not invented", () => {
    const v = validateRow(
        { source_line: 2, logged_at: "2026-01-15", calories: 200 },
        0,
        { tz: TZ, nowMs: NOW },
        "myfitnesspal",
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error.code).toBe("missing_description");
});

// ---------- validateRow ----------

test("validateRow produces a MealInput ready for insertMeal", () => {
    const v = validateRow(
        row({
            source_line: 4,
            protein_g: 12,
            notes: "with milk",
            client_row_id: "mfp-4",
        }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.client_row_id).toBe("mfp-4");
    expect(v.resolved.input.description).toBe("Oatmeal");
    expect(v.resolved.input.meal_type).toBe("breakfast");
    expect(v.resolved.input.calories).toBe(300);
    expect(v.resolved.input.notes).toBe("with milk");
    expect(v.resolved.logged_at_from_bare_date).toBe(true);
    expect(v.resolved.meal_type_inferred).toBe(false);
    // Absent macros must be omitted, not sent as null/0.
    expect("carbs_g" in v.resolved.input).toBe(false);
});

test("validateRow rounds fractional calories to the integer column", () => {
    // Every Cronometer export writes "Energy (kcal)" with two decimals, and
    // meals.calories is `integer` — Postgres rejects 388.54 outright (22P02)
    // rather than truncating it, which failed most rows of a real backfill.
    // Rounded here rather than at insert time so the dry-run echo the user
    // approves shows the number that will actually be stored.
    const v = validateRow(
        row({ source_line: 2, calories: 388.54, protein_g: 12.35 }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.resolved.input.calories).toBe(389);
    // Macro columns are `numeric`, so their decimals must survive untouched.
    expect(v.resolved.input.protein_g).toBe(12.35);
});

test("rows differing only below the kcal rounding boundary both import", async () => {
    // 388.11 and 388.42 both store as 388, so rounding makes their content
    // digests collide where the raw values would not have. The per-call
    // occurrence ordinal is what keeps them two rows rather than one silently
    // deduplicated row.
    const { deps, inserted } = makeStore();
    const result = await runImport(
        args([
            row({ source_line: 2, calories: 388.11 }),
            row({ source_line: 3, calories: 388.42 }),
        ]),
        deps,
    );
    expect(result.summary.created).toBe(2);
    expect(result.summary.deduplicated).toBe(0);
    expect(inserted.map((m) => m.calories)).toEqual([388, 388]);
});

test("validateRow carries fiber, sugar and alcohol through to the MealInput", () => {
    const v = validateRow(
        row({ source_line: 4, fiber_g: 4.5, sugar_g: 12, alcohol_g: 14 }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.resolved.input.fiber_g).toBe(4.5);
    expect(v.resolved.input.sugar_g).toBe(12);
    expect(v.resolved.input.alcohol_g).toBe(14);

    // Absent ones stay omitted rather than becoming 0 — a missing column must
    // not read back as "this meal definitely had no fiber".
    const bare = validateRow(
        row({ source_line: 5 }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(bare.ok).toBe(true);
    if (!bare.ok) return;
    expect("fiber_g" in bare.resolved.input).toBe(false);
    expect("sugar_g" in bare.resolved.input).toBe(false);
    expect("alcohol_g" in bare.resolved.input).toBe(false);
});

test("alcohol is stored even though display of it is opt-in", async () => {
    // alcohol_tracking_enabled gates rendering (src/mcp.ts), never the write.
    // Dropping a value here would lose user data with no way to recover it.
    const { deps, inserted } = makeStore();
    const result = await runImport(
        args([row({ source_line: 2, alcohol_g: 14, sugar_g: 3 })]),
        deps,
    );
    expect(result.summary.created).toBe(1);
    expect(inserted[0]!.alcohol_g).toBe(14);
    expect(inserted[0]!.sugar_g).toBe(3);
});

test("validateRow bounds alcohol far tighter than the other macros", () => {
    const check = (over: Partial<ImportRow>) =>
        validateRow(
            row({ source_line: 2, ...over }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        );

    // Fiber and sugar share the 5,000 g macro ceiling.
    expect(check({ fiber_g: 4_999 }).ok).toBe(true);
    expect(check({ fiber_g: 5_001 }).ok).toBe(false);
    expect(check({ sugar_g: 5_001 }).ok).toBe(false);

    // A whole 700 mL bottle of 40% ABV spirits is 221 g and must pass; a
    // mis-mapped millilitre column (750 mL of wine) must not.
    expect(check({ alcohol_g: 221 }).ok).toBe(true);
    expect(check({ alcohol_g: 500 }).ok).toBe(true);
    const volume = check({ alcohol_g: 750 });
    expect(volume.ok).toBe(false);
    if (!volume.ok) {
        expect(volume.error.field).toBe("alcohol_g");
        expect(volume.error.code).toBe("value_out_of_range");
        expect(volume.error.message).toContain("500");
    }

    for (const field of ["fiber_g", "sugar_g", "alcohol_g"] as const) {
        const neg = check({ [field]: -1 });
        expect(neg.ok).toBe(false);
        if (!neg.ok) expect(neg.error.field).toBe(field);
        expect(check({ [field]: Number.NaN }).ok).toBe(false);
    }
});

test("validateRow rejects implausible and malformed numbers with the observed value", () => {
    const bad = (over: Partial<ImportRow>) =>
        validateRow(
            row({ source_line: 2, ...over }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        );

    const neg = bad({ protein_g: -12 });
    expect(neg.ok).toBe(false);
    if (!neg.ok) {
        expect(neg.error.field).toBe("protein_g");
        expect(neg.error.message).toContain("-12");
    }
    // Guards the public /api/stats aggregate, which sums every meal row.
    const huge = bad({ protein_g: 1e300 });
    expect(huge.ok).toBe(false);
    const hugeCal = bad({ calories: 9_999_999_999 });
    expect(hugeCal.ok).toBe(false);
    if (!hugeCal.ok) expect(hugeCal.error.field).toBe("calories");
    expect(bad({ calories: Number.NaN }).ok).toBe(false);
});

test("validateRow rejects text that Postgres could not store", () => {
    // insertMeal decodes escape sequences on write, so a literal \u0000 in the
    // payload becomes a real NUL there and would throw mid-batch.
    //
    // Never paste a raw NUL into this file. A single one makes file(1) and
    // grep treat the whole file as binary, so greps over it silently report
    // no matches -- that already cost a review cycle a false "test is missing".
    const v = validateRow(
        row({ source_line: 2, description: "Tea \\u0000 break" }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error.code).toBe("unstorable_text");
});

test("validateRow does not pre-decode escape sequences", () => {
    // Decoding here would double-decode (insertMeal decodes too) and would
    // desynchronize the digest from what log_meal hashes for the same meal.
    const v = validateRow(
        row({
            source_line: 2,
            description: "\\u041f\\u0438\\u0446\\u0446\\u0430",
        }),
        0,
        { tz: TZ, nowMs: NOW },
        undefined,
    );
    expect(v.ok).toBe(true);
    if (v.ok)
        expect(v.resolved.input.description).toBe(
            "\\u041f\\u0438\\u0446\\u0446\\u0430",
        );
});

test("validateRow rejects a bad source_line", () => {
    for (const line of [0, -1, 1.5]) {
        const v = validateRow(
            row({ source_line: line }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        );
        expect(v.ok).toBe(false);
        if (!v.ok) expect(v.error.code).toBe("invalid_source_line");
    }
});

// ---------- idempotency keys ----------

test("identical rows in one batch get DISTINCT keys via the occurrence ordinal", () => {
    // The bug this exists to prevent: insertMeal's derived hash includes
    // logged_at, but every date-only row on a day resolves to the same instant,
    // so two identical rows would hash alike and the second would vanish.
    const resolved = [
        row({ source_line: 7, description: "Black coffee", calories: 2 }),
        row({ source_line: 23, description: "Black coffee", calories: 2 }),
    ].map((r, i) => {
        const v = validateRow(r, i, { tz: TZ, nowMs: NOW }, undefined);
        if (!v.ok) throw new Error("fixture should validate");
        return v.resolved;
    });

    const { duplicateRowsInFile } = assignIdempotencyKeys("user-1", resolved);
    expect(duplicateRowsInFile).toBe(1);
    const [a, b] = resolved.map((r) => r.input.idempotency_key!);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^import:[0-9a-f]{64}:0$/);
    expect(b).toMatch(/^import:[0-9a-f]{64}:1$/);
    // Same content digest, different ordinal.
    expect(a!.split(":")[1]).toBe(b!.split(":")[1]);
});

test("keys exclude source_line so a re-exported file still dedupes", () => {
    const build = (line: number) => {
        const v = validateRow(
            row({ source_line: line, description: "Apple", calories: 95 }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        );
        if (!v.ok) throw new Error("fixture should validate");
        const resolved = [v.resolved];
        assignIdempotencyKeys("user-1", resolved);
        return resolved[0]!.input.idempotency_key!;
    };
    // The same meal at a different line number keeps the same key.
    expect(build(5)).toBe(build(37));
});

test("fiber, sugar and alcohol are EXCLUDED from the content digest", async () => {
    // The regression guard for the whole feature. rowContentDigest is a frozen
    // positional hash: adding the new fields would change the key of every row
    // hashed from then on, so a user re-importing a file they already imported
    // would get a full set of duplicates instead of a clean no-op. Accepted
    // cost: two rows differing only in these fields collapse to one.
    const keyFor = (over: Partial<ImportRow>) => {
        const v = validateRow(
            row({ source_line: 2, description: "Stout", ...over }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        );
        if (!v.ok) throw new Error("fixture should validate");
        const resolved = [v.resolved];
        assignIdempotencyKeys("user-1", resolved);
        return resolved[0]!.input.idempotency_key!;
    };

    const plain = keyFor({});
    expect(keyFor({ fiber_g: 3 })).toBe(plain);
    expect(keyFor({ sugar_g: 11 })).toBe(plain);
    expect(keyFor({ alcohol_g: 14 })).toBe(plain);
    expect(keyFor({ fiber_g: 3, sugar_g: 11, alcohol_g: 14 })).toBe(plain);
    // A field that IS in the digest still moves it, so the test above is not
    // just asserting that every key is identical.
    expect(keyFor({ calories: 301 })).not.toBe(plain);

    // End to end: an import already written with no fiber column dedupes
    // against a re-export of the same file that now carries one.
    const { deps, inserted } = makeStore();
    const first = await runImport(args([row({ source_line: 2 })]), deps);
    expect(first.summary.created).toBe(1);
    const second = await runImport(
        args([row({ source_line: 2, fiber_g: 3, sugar_g: 11, alcohol_g: 14 })]),
        deps,
    );
    expect(second.summary.created).toBe(0);
    expect(second.summary.deduplicated).toBe(1);
    expect(inserted).toHaveLength(1);
});

// ---------- checkBatch ----------

test("checkBatch catches a row-count mismatch", () => {
    const r = checkBatch([row({ source_line: 2 })], {
        expected_row_count: 5,
    });
    expect(r.errors.map((e) => e.code)).toContain("row_count_mismatch");
});

test("checkBatch requires unique, increasing source lines", () => {
    const dup = checkBatch([row({ source_line: 2 }), row({ source_line: 2 })], {
        expected_row_count: 2,
    });
    expect(dup.errors.map((e) => e.code)).toContain("duplicate_source_line");

    const back = checkBatch(
        [row({ source_line: 9 }), row({ source_line: 3 })],
        { expected_row_count: 2 },
    );
    expect(back.errors.map((e) => e.code)).toContain(
        "source_line_out_of_order",
    );
});

test("checkBatch does not warn about a leading offset (header row or chunk 2)", () => {
    // Every CSV has a header, and chunk 2 of a split file starts at line 51.
    const r = checkBatch([row({ source_line: 51 }), row({ source_line: 52 })], {
        expected_row_count: 2,
    });
    expect(r.errors).toEqual([]);
    expect(r.warnings.filter((w) => /missing between/.test(w))).toEqual([]);
});

test("checkBatch warns about interior gaps not explained by rows_skipped", () => {
    const unexplained = checkBatch(
        [row({ source_line: 2 }), row({ source_line: 9 })],
        { expected_row_count: 2 },
    );
    expect(unexplained.warnings.some((w) => /missing between/.test(w))).toBe(
        true,
    );

    const explained = checkBatch(
        [row({ source_line: 2 }), row({ source_line: 9 })],
        { expected_row_count: 2, rows_skipped: 6 },
    );
    expect(explained.warnings.some((w) => /missing between/.test(w))).toBe(
        false,
    );
});

test("checkBatch reconciles the kcal control total within tolerance", () => {
    const rows = [
        row({ source_line: 2, calories: 300 }),
        row({ source_line: 3, calories: 700 }),
    ];
    expect(
        checkBatch(rows, {
            expected_row_count: 2,
            expected_total_kcal: 1000,
        }).errors,
    ).toEqual([]);
    // Within 0.5% rounding slack.
    expect(
        checkBatch(rows, {
            expected_row_count: 2,
            expected_total_kcal: 1004,
        }).errors,
    ).toEqual([]);
    expect(
        checkBatch(rows, {
            expected_row_count: 2,
            expected_total_kcal: 1200,
        }).errors.map((e) => e.code),
    ).toContain("kcal_total_mismatch");
});

test("checkBatch warns rather than fails when the kcal check cannot run", () => {
    const rows = [
        row({ source_line: 2, calories: 300 }),
        row({ source_line: 3, calories: undefined }),
    ];
    const partial = checkBatch(rows, {
        expected_row_count: 2,
        expected_total_kcal: 300,
    });
    expect(partial.errors).toEqual([]);
    expect(partial.warnings.some((w) => /no calories/.test(w))).toBe(true);

    const absent = checkBatch(rows, { expected_row_count: 2 });
    expect(absent.warnings.some((w) => /No expected_total_kcal/.test(w))).toBe(
        true,
    );
});

// ---------- runImport ----------

test("runImport writes two rows for two identical same-date rows", async () => {
    // The end-to-end form of the data-loss regression.
    const { deps, inserted } = makeStore();
    const rows = [
        row({ source_line: 7, description: "Black coffee", calories: 2 }),
        row({ source_line: 23, description: "Black coffee", calories: 2 }),
    ];
    const result = await runImport(args(rows), deps);

    expect(result.status).toBe("success");
    expect(result.summary.created).toBe(2);
    expect(result.summary.deduplicated).toBe(0);
    expect(inserted).toHaveLength(2);
    expect(result.summary.duplicate_rows_in_file).toBe(1);
    expect(result.warnings.some((w) => /exact duplicates/.test(w))).toBe(true);
});

test("runImport is a perfect no-op when the same payload is replayed", async () => {
    const { deps, inserted } = makeStore();
    const rows = [
        row({ source_line: 7, description: "Black coffee", calories: 2 }),
        row({ source_line: 23, description: "Black coffee", calories: 2 }),
        row({ source_line: 24, description: "Toast", calories: 120 }),
    ];
    const first = await runImport(args(rows), deps);
    expect(first.summary.created).toBe(3);

    const second = await runImport(args(rows), deps);
    expect(second.summary.created).toBe(0);
    expect(second.summary.deduplicated).toBe(3);
    expect(second.status).toBe("success");
    // No extra writes on replay.
    expect(inserted).toHaveLength(3);
});

test("runImport dry run writes nothing and predicts deduplication", async () => {
    const { deps, inserted } = makeStore();
    const rows = [row({ source_line: 2 }), row({ source_line: 3 })];

    const dry = await runImport(args(rows, { dry_run: true }), deps);
    expect(dry.dry_run).toBe(true);
    expect(inserted).toHaveLength(0);
    expect(dry.summary.would_create).toBe(2);
    expect(dry.results.every((r) => r.status === "would_create")).toBe(true);
    expect(dry.results.every((r) => r.meal_id === null)).toBe(true);

    // After a real run, a second dry run must predict dedup, not creates.
    await runImport(args(rows), deps);
    const again = await runImport(args(rows, { dry_run: true }), deps);
    expect(again.summary.would_create).toBe(0);
    expect(again.summary.deduplicated).toBe(2);
    expect(again.results.every((r) => r.status === "would_deduplicate")).toBe(
        true,
    );
});

test("runImport never reports a dry run as failed just because nothing was written", async () => {
    const { deps } = makeStore();
    const dry = await runImport(
        args([row({ source_line: 2 })], { dry_run: true }),
        deps,
    );
    expect(dry.status).toBe("success");
});

test("runImport isolates a per-row database failure", async () => {
    const { deps, inserted } = makeStore({
        failOn: (i) => i.description === "Poison",
    });
    const rows = [
        row({ source_line: 2, description: "A" }),
        row({ source_line: 3, description: "Poison" }),
        row({ source_line: 4, description: "B" }),
    ];
    const result = await runImport(args(rows), deps);

    expect(result.status).toBe("partial_success");
    expect(result.summary.created).toBe(2);
    expect(result.summary.failed).toBe(1);
    // Rows either side of the failure still landed AND still reported.
    expect(inserted.map((i) => i.description)).toEqual(["A", "B"]);
    expect(result.results.map((r) => r.status)).toEqual([
        "created",
        "failed",
        "created",
    ]);
    expect(result.results[1]!.error?.code).toBe("insert_failed");
});

test("runImport on_error=abort writes nothing when a row fails validation", async () => {
    const { deps, inserted } = makeStore();
    const rows = [
        row({ source_line: 2 }),
        row({ source_line: 3, logged_at: "2026-13-01" }),
    ];
    const result = await runImport(args(rows, { on_error: "abort" }), deps);

    expect(result.status).toBe("failed");
    expect(inserted).toHaveLength(0);
    expect(result.summary.not_attempted).toBe(1);
    expect(result.results.map((r) => r.status)).toEqual([
        "not_attempted",
        "failed",
    ]);
});

test("runImport on_error=continue imports the good rows and reports the bad", async () => {
    const { deps, inserted } = makeStore();
    const rows = [
        row({ source_line: 2 }),
        row({ source_line: 3, logged_at: "2026-13-01" }),
        row({ source_line: 4 }),
    ];
    const result = await runImport(args(rows), deps);

    expect(result.status).toBe("partial_success");
    expect(inserted).toHaveLength(2);
    expect(result.summary.failed).toBe(1);
    expect(result.results[1]!.error?.field).toBe("logged_at");
    // Failed rows echo no resolved values.
    expect(result.results[1]!.logged_at).toBeNull();
});

test("runImport reports failed when every row is bad", async () => {
    const { deps, inserted } = makeStore();
    const result = await runImport(
        args([row({ source_line: 2, logged_at: "nonsense" })]),
        deps,
    );
    expect(result.status).toBe("failed");
    expect(result.summary.failed).toBe(1);
    expect(inserted).toHaveLength(0);
});

test("runImport aborts the whole batch on a control-total mismatch", async () => {
    const { deps, inserted } = makeStore();
    const rows = [row({ source_line: 2 }), row({ source_line: 3 })];
    // on_error=continue must NOT soften a batch-integrity failure.
    const result = await runImport(
        args(rows, { expected_row_count: 7, on_error: "continue" }),
        deps,
    );
    expect(result.status).toBe("failed");
    expect(result.results).toEqual([]);
    expect(inserted).toHaveLength(0);
    expect(result.warnings.some((w) => /expected_row_count/.test(w))).toBe(
        true,
    );
});

test("runImport rejects an over-large batch with a structured report", async () => {
    const { deps } = makeStore();
    const rows = Array.from({ length: MAX_ROWS_PER_CALL + 1 }, (_, i) =>
        row({ source_line: i + 2 }),
    );
    const result = await runImport(args(rows), deps);
    expect(result.status).toBe("failed");
    expect(result.warnings.some((w) => /1 to 50 rows/.test(w))).toBe(true);
});

test("runImport surfaces provenance for inferred and synthesized values", async () => {
    const { deps } = makeStore();
    const rows = [
        // No meal_type -> inferred from the time; no description -> refused,
        // because an inferred slot is not evidence of what was eaten.
        {
            source_line: 2,
            description: "Late snack",
            logged_at: "2026-01-15T23:00",
        },
        // Meal type from the file but no food name -> synthesized.
        { source_line: 3, logged_at: "2026-01-15", meal_type: "breakfast" },
    ];
    const result = await runImport(
        args(rows, { source_app: "myfitnesspal" }),
        deps,
    );

    expect(result.results[0]!.meal_type_inferred).toBe(true);
    expect(result.results[0]!.meal_type).toBe("snack");
    expect(result.results[1]!.description_synthesized).toBe(true);
    expect(result.results[1]!.description).toBe(
        "Breakfast (imported from MyFitnessPal)",
    );
    expect(result.results[1]!.logged_at_from_bare_date).toBe(true);
    expect(result.warnings.some((w) => /inferred from the time/.test(w))).toBe(
        true,
    );
    expect(result.warnings.some((w) => /local noon/.test(w))).toBe(true);
});

test("runImport echoes skipped_by_caller without folding it into the row identity", async () => {
    const { deps } = makeStore();
    const result = await runImport(
        args([row({ source_line: 2 })], { rows_skipped: 4 }),
        deps,
    );
    const s = result.summary;
    expect(s.skipped_by_caller).toBe(4);
    // The identity the summary must satisfy excludes skipped_by_caller.
    expect(s.total).toBe(
        s.created + s.deduplicated + s.failed + s.not_attempted,
    );
});

// ---------- summary text ----------

test("buildSummaryText names failing lines and stays prose, not JSON", async () => {
    const { deps } = makeStore();
    const rows = [
        row({ source_line: 2 }),
        row({ source_line: 3, logged_at: "2026-13-01" }),
    ];
    const text = buildSummaryText(await runImport(args(rows), deps));
    expect(text).toContain("Imported 1 of 2");
    expect(text).toContain("line 3");
    expect(text).toContain("2026-13-01");
    expect(text).not.toContain("{");
});

// ---------- unset timezone ----------

test("runImport warns when an unconfigured timezone placed the rows", async () => {
    // profiles.timezone defaults to 'UTC', so an unconfigured user silently gets
    // UTC. Rows without their own offset are placed with it, and once the user
    // sets a real timezone those instants re-read in it: times shift by the
    // offset, and rows near either edge of the day change date entirely.
    const { deps } = makeStore({ tzConfigured: false });
    const result = await runImport(
        args([
            row({ source_line: 2, logged_at: "2026-01-15" }), // bare -> noon
            row({ source_line: 3, logged_at: "2026-01-15T01:00" }), // local time
        ]),
        deps,
    );

    expect(result.summary.created).toBe(2);
    const warning = result.warnings.find((w) => /timezone is not set/.test(w));
    expect(warning).toBeDefined();
    expect(warning).toContain("2 row(s)");
    expect(warning).toMatch(/near midnight/);
});

test("rows carrying their own offset do not trigger the timezone warning", async () => {
    // An explicit offset names an absolute instant, so the profile timezone is
    // irrelevant to where it lands.
    const { deps } = makeStore({ tzConfigured: false });
    const result = await runImport(
        args([
            row({ source_line: 2, logged_at: "2026-01-15T08:30:00+02:00" }),
            row({ source_line: 3, logged_at: "2026-01-15T09:30:00Z" }),
        ]),
        deps,
    );

    expect(result.summary.created).toBe(2);
    expect(result.warnings.some((w) => /timezone is not set/.test(w))).toBe(
        false,
    );
});

test("a configured timezone never triggers the warning", async () => {
    const { deps } = makeStore({ tzConfigured: true });
    const result = await runImport(
        args([row({ source_line: 2, logged_at: "2026-01-15" })]),
        deps,
    );
    expect(result.warnings.some((w) => /timezone is not set/.test(w))).toBe(
        false,
    );
});

// ---------- output schema conformance ----------

test("serialized output validates against the declared outputSchema on every path", async () => {
    // The only guard against nullable-vs-required drift: .nullable() does NOT
    // make a field optional, so an absent RowError.field must serialize to an
    // explicit null or strict clients reject the whole result. CI runs no
    // typecheck, so this test is what catches it.
    const schema = z.object(BULK_IMPORT_OUTPUT_SCHEMA);

    const scenarios: Record<string, () => Promise<unknown>> = {
        async success() {
            const { deps } = makeStore();
            return runImport(args([row({ source_line: 2 })]), deps);
        },
        async partial_success() {
            const { deps } = makeStore();
            return runImport(
                args([
                    row({ source_line: 2 }),
                    row({ source_line: 3, logged_at: "2026-13-01" }),
                ]),
                deps,
            );
        },
        async failed_all_rows() {
            const { deps } = makeStore();
            return runImport(
                args([row({ source_line: 2, logged_at: "nope" })]),
                deps,
            );
        },
        async failed_batch_gate() {
            const { deps } = makeStore();
            return runImport(
                args([row({ source_line: 2 })], { expected_row_count: 9 }),
                deps,
            );
        },
        async dry_run() {
            const { deps } = makeStore();
            return runImport(
                args([row({ source_line: 2 })], { dry_run: true }),
                deps,
            );
        },
        async abort() {
            const { deps } = makeStore();
            return runImport(
                args(
                    [
                        row({ source_line: 2 }),
                        row({ source_line: 3, logged_at: "2026-13-01" }),
                    ],
                    { on_error: "abort" },
                ),
                deps,
            );
        },
        async insert_failure() {
            const { deps } = makeStore({
                failOn: (i) => i.description === "Oatmeal",
            });
            return runImport(args([row({ source_line: 2 })]), deps);
        },
        async too_many_rows() {
            const { deps } = makeStore();
            return runImport(
                args(
                    Array.from({ length: MAX_ROWS_PER_CALL + 1 }, (_, i) =>
                        row({ source_line: i + 2 }),
                    ),
                ),
                deps,
            );
        },
    };

    for (const [name, build] of Object.entries(scenarios)) {
        const result = (await build()) as Parameters<
            typeof serializeImportResult
        >[0];
        const serialized = serializeImportResult(result);
        const parsed = schema.safeParse(serialized);
        if (!parsed.success) {
            throw new Error(
                `${name} failed output validation: ${JSON.stringify(parsed.error.issues)}`,
            );
        }
        // Required-but-nullable keys must be PRESENT, not merely undefined.
        for (const r of serialized.results) {
            for (const key of [
                "client_row_id",
                "meal_id",
                "description",
                "logged_at",
                "meal_type",
                "error",
            ]) {
                expect(Object.hasOwn(r, key)).toBe(true);
            }
            if (r.error) {
                expect(Object.hasOwn(r.error, "field")).toBe(true);
                expect(Object.hasOwn(r.error, "suggested_fix")).toBe(true);
            }
        }
    }
});

test("buildSummaryText explains a batch-gate failure that has no per-row results", async () => {
    const { deps } = makeStore();
    const text = buildSummaryText(
        await runImport(
            args([row({ source_line: 2 })], { expected_row_count: 9 }),
            deps,
        ),
    );
    expect(text).toContain("integrity check");
    expect(text).toContain("expected_row_count");
});

// ---------- source_id: export -> re-import (issue #69) ----------

/** A meal as log_meal would have written it: an `auto:` key over a content
 *  digest the importer can neither reproduce nor query. */
function loggedMeal(id: string, over: Partial<Meal> = {}): Meal {
    return {
        id,
        user_id: "user-1",
        logged_at: "2026-01-15T06:30:00.000Z",
        meal_type: "breakfast",
        description: "Oatmeal",
        calories: 300,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        notes: null,
        idempotency_key: "auto:0123456789abcdef",
        ...over,
    } as Meal;
}

const EXPORTED_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("a row naming a meal the user already has is deduplicated, not written", async () => {
    const { deps, inserted, byId, byKey } = makeStore();
    const meal = loggedMeal(EXPORTED_ID);
    byId.set(meal.id, meal);
    byKey.set(meal.idempotency_key!, meal);

    // The content deliberately does NOT match the stored meal: the export
    // renders second-precision local wall time and the importer re-resolves
    // it, so the digests differ by construction. Only the id can recognize it.
    const result = await runImport(
        args([
            row({
                source_line: 2,
                source_id: EXPORTED_ID,
                logged_at: "2026-01-15 08:30:00",
                calories: 301,
            }),
        ]),
        deps,
    );

    expect(result.summary.created).toBe(0);
    expect(result.summary.deduplicated).toBe(1);
    expect(result.status).toBe("success");
    expect(inserted).toHaveLength(0);
    // The report points at the meal the user already has, not at nothing.
    expect(result.results[0]!.status).toBe("deduplicated");
    expect(result.results[0]!.meal_id).toBe(EXPORTED_ID);
    expect(result.warnings.some((w) => /already have/.test(w))).toBe(true);
});

test("a dry run predicts source_id dedup instead of promising creates", async () => {
    const { deps, inserted, byId } = makeStore();
    byId.set(EXPORTED_ID, loggedMeal(EXPORTED_ID));

    const dry = await runImport(
        args([row({ source_line: 2, source_id: EXPORTED_ID })], {
            dry_run: true,
        }),
        deps,
    );

    // The whole failure in #69: this reported would_create: 1 with no warning.
    expect(dry.summary.would_create).toBe(0);
    expect(dry.summary.deduplicated).toBe(1);
    expect(dry.results[0]!.status).toBe("would_deduplicate");
    // Dry and real agree on the id, so the preview names the same meal.
    expect(dry.results[0]!.meal_id).toBe(EXPORTED_ID);
    expect(inserted).toHaveLength(0);
});

test("re-importing an export of meals since deleted stays idempotent", async () => {
    const { deps, inserted } = makeStore();
    // Nothing seeded: the user wiped their history, so no id matches and the
    // rows must actually be written.
    const rows = [
        row({ source_line: 2, source_id: EXPORTED_ID }),
        row({
            source_line: 3,
            source_id: "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff",
            description: "Toast",
            calories: 120,
        }),
    ];
    const first = await runImport(args(rows), deps);
    expect(first.summary.created).toBe(2);

    // Restoring the same file twice must not double it. The new meals carry
    // fresh uuids, so the id lookup cannot catch this — the `import:src:` key
    // written by the first run is what does.
    const second = await runImport(args(rows), deps);
    expect(second.summary.created).toBe(0);
    expect(second.summary.deduplicated).toBe(2);
    expect(inserted).toHaveLength(2);
});

test("an id column from another app is ignored rather than failing the row", async () => {
    const { deps, inserted } = makeStore();
    // Lose It! and friends number their rows; a bare integer names no meal here
    // and must not reach the uuid-typed id lookup either.
    const result = await runImport(
        args([
            row({ source_line: 2, source_id: "148203" }),
            row({ source_line: 3, source_id: "", description: "Toast" }),
        ]),
        deps,
    );

    expect(result.summary.created).toBe(2);
    expect(result.summary.failed).toBe(0);
    expect(inserted).toHaveLength(2);
    // Keyed on content, exactly as before source_id existed.
    for (const input of inserted) {
        expect(input.idempotency_key).toMatch(/^import:[0-9a-f]{64}:0$/);
    }
});

test("source_id keys are id-scoped, and a repeated id still imports twice", () => {
    const rows = [
        validateRow(
            row({ source_line: 2, source_id: EXPORTED_ID.toUpperCase() }),
            0,
            { tz: TZ, nowMs: NOW },
            undefined,
        ),
        validateRow(
            row({ source_line: 3, source_id: EXPORTED_ID }),
            1,
            { tz: TZ, nowMs: NOW },
            undefined,
        ),
        validateRow(
            row({ source_line: 4, description: "Toast" }),
            2,
            { tz: TZ, nowMs: NOW },
            undefined,
        ),
    ].map((v) => {
        if (!v.ok) throw new Error("fixture row failed validation");
        return v.resolved;
    });

    const { duplicateRowsInFile } = assignIdempotencyKeys("user-1", rows);

    // Case-folded, so a hand-edited file with upper-case uuids matches.
    expect(rows[0]!.input.idempotency_key).toBe(`import:src:${EXPORTED_ID}:0`);
    // A repeated id is a broken file, not a merge instruction: the ordinal
    // keeps the second row importable, exactly as for repeated content.
    expect(rows[1]!.input.idempotency_key).toBe(`import:src:${EXPORTED_ID}:1`);
    expect(duplicateRowsInFile).toBe(1);
    // A row without an id is untouched by any of this.
    expect(rows[2]!.input.idempotency_key).toMatch(/^import:[0-9a-f]{64}:0$/);
});

test("another user's meal id is not treated as already-present", async () => {
    const { deps, inserted } = makeStore();
    // The fake mirrors existingMealIds' user scoping by simply not holding the
    // id; the row must import as a new meal rather than silently vanish.
    const result = await runImport(
        args([row({ source_line: 2, source_id: EXPORTED_ID })]),
        deps,
    );
    expect(result.summary.created).toBe(1);
    expect(inserted).toHaveLength(1);
});

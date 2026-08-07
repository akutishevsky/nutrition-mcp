// Bulk meal import: row validation, timestamp resolution, per-row idempotency
// keys, batch integrity checks, and the insert orchestration.
//
// All of this is deliberately free of Supabase access so it can be unit-tested
// with plain fixtures (the export.ts / search.ts convention) — getSupabase()
// has no injection seam. src/mcp.ts is a thin adapter that supplies `insert`
// and `existingKeys`.
//
// Two non-obvious invariants live here:
//
//   1. Every row carries an EXPLICIT idempotency key ending in an occurrence
//      ordinal. insertMeal derives a content hash when no key is given, and
//      that hash includes logged_at — but a date-only import anchors every row
//      on a day to the same instant, so two genuinely separate identical rows
//      would hash alike and the second would be silently swallowed as
//      "deduplicated". The ordinal distinguishes them while keeping a re-run of
//      the same file a perfect no-op (same multiset -> same ordinals).
//
//   2. A resolved timestamp must read back as the calendar date it came from.
//      dateInTz decides which day a meal belongs to on every read path, so
//      resolveLoggedAt asserts the round trip rather than trusting the math.

import { z } from "zod";
import type { MealInput, MealInsertResult } from "./supabase.js";
import { LOGGED_AT_FIX, loggedAtFailureReason, parseLoggedAt } from "./tz.js";
import { decodeEscapeSequences } from "./normalize.js";
import { toStoredInteger } from "./units.js";

export type MealType = MealInput["meal_type"];

/** Max rows per call. Enforced here, not in Zod: a schema-level violation is
 *  rejected before the handler runs, which loses the whole structured report. */
export const MAX_ROWS_PER_CALL = 50;

export const MAX_CALORIES = 20_000;
export const MAX_MACRO_G = 5_000;
/** Alcohol gets a far tighter ceiling than the other macros. 5,000 g would be
 *  ~357 US standard drinks (14 g each, NIAAA), which passes any mis-mapped
 *  column without complaint; 500 g is ~36 drinks, still comfortably above the
 *  largest real single row we can construct — a full 700 mL bottle of 40% ABV
 *  spirits is 221 g, and a whole aggregated heavy-drinking day is under 350 g —
 *  while rejecting the likely mistake of pointing the column at millilitres of
 *  drink (a 750 mL bottle of wine) or at a stray extra digit. */
export const MAX_ALCOHOL_G = 500;
const MAX_DESCRIPTION_CHARS = 2_000;
const MAX_NOTES_CHARS = 4_000;
const MAX_PAST_MS = 20 * 365.25 * 24 * 3600 * 1000;
const MAX_FUTURE_MS = 48 * 3600 * 1000;
/** Rounding slack when reconciling the caller's kcal control total. */
const KCAL_TOLERANCE_FRACTION = 0.005;

const MEAL_TYPES: readonly MealType[] = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
];

/** Values real exports use to mean "no value" (Lose It! writes the string n/a). */
const BLANK_TOKENS = new Set(["", "-", "--", "n/a", "na", "null", "none"]);

const SOURCE_APP_LABELS: Record<string, string> = {
    myfitnesspal: "MyFitnessPal",
    cronometer: "Cronometer",
    loseit: "Lose It!",
    "lose-it": "Lose It!",
    macrofactor: "MacroFactor",
    nutritionix: "Nutritionix",
    fatsecret: "FatSecret",
};

// ---------- Types ----------

export interface ImportRow {
    /** 1-based line in the caller's original file. Used for provenance and to
     *  detect dropped or fabricated rows; never part of the content digest. */
    source_line: number;
    description?: string;
    logged_at?: string;
    meal_type?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    /** TOTAL sugars, including sugar naturally present in fruit and milk —
     *  never "added sugar", which no export reliably carries. */
    sugar_g?: number;
    /** Grams of pure ethanol. Stored whatever the caller sends, even when the
     *  profile has alcohol tracking off: that flag gates DISPLAY only, and
     *  dropping a value at the write layer would lose data silently. */
    alcohol_g?: number;
    notes?: string;
    /** Caller-chosen correlation label. Echoed back; never used as a key. */
    client_row_id?: string;
    /** The meal's id in the file it came from — this server's own CSV export
     *  writes it in the `id` column. Unlike client_row_id this IS a key: a row
     *  that names an existing meal is that meal, not a copy of it, so it is
     *  reported as deduplicated instead of written again. */
    source_id?: string;
}

export interface RowError {
    code: string;
    field?: string;
    message: string;
    suggested_fix?: string;
    /** Whether re-calling with corrected arguments could succeed. */
    retryable: boolean;
}

export interface ResolvedRow {
    input: MealInput;
    /** Normalized `source_id`, or null when the row carried none we can use. */
    source_id: string | null;
    meal_type_inferred: boolean;
    description_synthesized: boolean;
    logged_at_from_bare_date: boolean;
    /** Internal: drives the unset-timezone warning. Not part of the tool's
     *  output schema — the aggregate warning is what a caller acts on. */
    logged_at_used_profile_tz: boolean;
}

export type RowValidation =
    | {
          ok: true;
          index: number;
          source_line: number;
          client_row_id: string | null;
          resolved: ResolvedRow;
      }
    | {
          ok: false;
          index: number;
          source_line: number;
          client_row_id: string | null;
          error: RowError;
      };

export type RowStatus =
    | "created"
    | "deduplicated"
    | "failed"
    | "would_create"
    | "would_deduplicate"
    | "not_attempted";

export interface ImportResultRow {
    index: number;
    source_line: number;
    client_row_id: string | null;
    status: RowStatus;
    meal_id: string | null;
    /** Resolved values, echoed so a caller can spot a misparse before trusting
     *  the import — a wrong date column shows up here, not in the totals. */
    description: string | null;
    logged_at: string | null;
    meal_type: string | null;
    meal_type_inferred: boolean;
    description_synthesized: boolean;
    logged_at_from_bare_date: boolean;
    error: RowError | null;
}

export interface ImportSummary {
    total: number;
    created: number;
    deduplicated: number;
    would_create: number;
    failed: number;
    not_attempted: number;
    duplicate_rows_in_file: number;
    rows_without_calories: number;
    /** Echo of the caller's rows_skipped. Rows never sent, so NOT a term in
     *  total = created + deduplicated + failed + not_attempted. */
    skipped_by_caller: number;
}

export interface ImportResult {
    status: "success" | "partial_success" | "failed";
    dry_run: boolean;
    summary: ImportSummary;
    warnings: string[];
    results: ImportResultRow[];
}

// The tool's declared output contract. Lives here beside the types it mirrors
// so serializeImportResult can be tested against it directly — CI runs no
// typecheck, so a drift between the two is only caught by a test.
//
// Failure is a valid value of this schema (status: "failed"), never a separate
// error envelope: the per-row report is the product, and returning isError lets
// hosts surface only the text and drop it.
const IMPORT_ERROR_SCHEMA = z
    .object({
        code: z.string(),
        field: z.string().nullable(),
        message: z.string(),
        suggested_fix: z.string().nullable(),
        retryable: z.boolean(),
    })
    .nullable();

export const BULK_IMPORT_OUTPUT_SCHEMA = {
    status: z.enum(["success", "partial_success", "failed"]),
    dry_run: z.boolean(),
    summary: z.object({
        total: z.number(),
        created: z.number(),
        deduplicated: z.number(),
        would_create: z.number(),
        failed: z.number(),
        not_attempted: z.number(),
        duplicate_rows_in_file: z.number(),
        rows_without_calories: z.number(),
        skipped_by_caller: z.number(),
    }),
    warnings: z.array(z.string()),
    results: z.array(
        z.object({
            index: z.number(),
            source_line: z.number(),
            client_row_id: z.string().nullable(),
            status: z.enum([
                "created",
                "deduplicated",
                "failed",
                "would_create",
                "would_deduplicate",
                "not_attempted",
            ]),
            meal_id: z.string().nullable(),
            description: z.string().nullable(),
            logged_at: z.string().nullable(),
            meal_type: z.string().nullable(),
            meal_type_inferred: z.boolean(),
            description_synthesized: z.boolean(),
            logged_at_from_bare_date: z.boolean(),
            error: IMPORT_ERROR_SCHEMA,
        }),
    ),
};

/**
 * Render an ImportResult as structuredContent.
 *
 * Every `.nullable()` field above is REQUIRED in the emitted JSON Schema —
 * nullable is not optional — so an absent `field`/`suggested_fix` on a RowError
 * has to become an explicit null. Leaving them undefined would drop the key and
 * fail output validation.
 */
export function serializeImportResult(result: ImportResult) {
    return {
        status: result.status,
        dry_run: result.dry_run,
        summary: { ...result.summary },
        warnings: [...result.warnings],
        results: result.results.map((r) => ({
            index: r.index,
            source_line: r.source_line,
            client_row_id: r.client_row_id ?? null,
            status: r.status,
            meal_id: r.meal_id ?? null,
            description: r.description ?? null,
            logged_at: r.logged_at ?? null,
            meal_type: r.meal_type ?? null,
            meal_type_inferred: r.meal_type_inferred,
            description_synthesized: r.description_synthesized,
            logged_at_from_bare_date: r.logged_at_from_bare_date,
            error: r.error
                ? {
                      code: r.error.code,
                      field: r.error.field ?? null,
                      message: r.error.message,
                      suggested_fix: r.error.suggested_fix ?? null,
                      retryable: r.error.retryable,
                  }
                : null,
        })),
    };
}

export interface BulkImportArgs {
    meals: ImportRow[];
    expected_row_count: number;
    expected_total_kcal?: number;
    dry_run?: boolean;
    on_error?: "continue" | "abort";
    rows_skipped?: number;
    unmapped_columns?: string[];
    source_app?: string;
}

export interface ImportDeps {
    userId: string;
    /** The user's IANA timezone; date-only and offset-less rows resolve in it. */
    tz: string;
    /** Whether the user has actually configured a timezone, as opposed to
     *  falling back to the UTC default. A bare date or offset-less local time
     *  imported under an unconfigured timezone lands on the wrong day once the
     *  user later sets their real one, so this drives a warning. */
    tzConfigured: boolean;
    nowMs: number;
    insert(input: MealInput): Promise<MealInsertResult>;
    /** Which of these idempotency keys already exist, so a dry run can predict
     *  deduplication instead of promising creates that won't happen. */
    existingKeys(keys: string[]): Promise<Set<string>>;
    /** Which of these ids name meals the user already has. Import keys and the
     *  `auto:` keys log_meal writes live in different namespaces and hash
     *  different renderings of the same meal, so a content digest can never
     *  recognize an exported meal on the way back in — the id can. */
    existingMealIds(ids: string[]): Promise<Set<string>>;
}

/** Shape of a meal id in this server's own export: a Postgres uuid. Only a
 *  value of this shape can name an existing meal, so anything else found in an
 *  `id` column — a foreign app's row counter, a barcode — is dropped rather
 *  than rejected. Those files must still import, and passing a non-uuid to the
 *  id lookup would fail the whole batch on a Postgres cast error. */
const MEAL_SOURCE_ID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lower-cased so a hand-edited file with upper-case uuids still matches both
 *  the stored id and the key a previous import wrote. */
export function normalizeSourceId(raw: string | undefined): string | null {
    if (raw === undefined) return null;
    const text = raw.trim().toLowerCase();
    return MEAL_SOURCE_ID_RE.test(text) ? text : null;
}

// ---------- Timestamp resolution ----------

function badTimestamp(
    raw: string | undefined,
    reason: string,
    fix: string,
): RowError {
    return {
        code: "invalid_logged_at",
        field: "logged_at",
        message: `logged_at ${raw === undefined ? "is missing" : `is invalid (${JSON.stringify(raw)})`}: ${reason}`,
        suggested_fix: fix,
        retryable: true,
    };
}

export interface ResolvedTimestamp {
    iso: string;
    fromBareDate: boolean;
    /** True when the profile timezone was needed to place this instant, i.e. the
     *  input was a bare date or an offset-less local time. False when the input
     *  carried its own offset and is therefore timezone-independent. */
    usedProfileTimezone: boolean;
}

/**
 * Resolve a caller-supplied timestamp to a UTC instant.
 *
 * The placement rules live in `parseLoggedAt` (src/tz.ts) and are shared with
 * the manual write tools, so the same string means the same instant whichever
 * door it comes through. What is import-specific and stays here: the per-row
 * `RowError` shaping, the "every row must be dated" rule, and the
 * 20-years-past / 48-hours-future backfill window (a manual entry is a claim
 * about a clock that has already ticked and gets a much tighter future bound).
 *
 * Note this is NOT about dedupe across the two routes: the importer stamps an
 * explicit `import:<basis>:<ordinal>` key on every row, so it never reaches the
 * `auto:<digest>` derivation log_meal uses and the two key namespaces are
 * structurally disjoint. What is shared is the calendar day the entry lands on.
 */
export function resolveLoggedAt(
    raw: string | undefined,
    tz: string,
    nowMs: number,
): { ok: true; value: ResolvedTimestamp } | { ok: false; error: RowError } {
    const parsed = parseLoggedAt(raw, tz);
    if (!parsed.ok) {
        if (parsed.reason === "missing") {
            return {
                ok: false,
                error: badTimestamp(
                    raw,
                    "a bulk import must date every row, or every undated row would land on today",
                    LOGGED_AT_FIX,
                ),
            };
        }
        return {
            ok: false,
            error: badTimestamp(
                raw!.trim(),
                loggedAtFailureReason(parsed.reason, tz),
                LOGGED_AT_FIX,
            ),
        };
    }

    const { instant, fromBareDate, usedProfileTimezone } = parsed.value;
    const t = instant.getTime();
    if (t < nowMs - MAX_PAST_MS) {
        return {
            ok: false,
            error: badTimestamp(
                raw!.trim(),
                "more than 20 years in the past",
                "Check for a two-digit or mis-parsed year.",
            ),
        };
    }
    if (t > nowMs + MAX_FUTURE_MS) {
        return {
            ok: false,
            error: badTimestamp(
                raw!.trim(),
                "more than 48 hours in the future",
                "Check for a day/month swap or a mis-parsed year.",
            ),
        };
    }

    return {
        ok: true,
        value: {
            iso: instant.toISOString(),
            fromBareDate,
            usedProfileTimezone,
        },
    };
}

// ---------- Meal type ----------

/**
 * Normalize a caller-supplied meal type. Returns null when the source had no
 * usable value, which signals the caller to infer one — blank cells and the
 * literal "n/a" must NOT silently become "snack", or a file with an empty
 * meal-type column turns into hundreds of snacks with no provenance flag.
 */
export function normalizeMealType(raw: string | undefined): MealType | null {
    if (raw === undefined) return null;
    const v = raw.trim().toLowerCase();
    if (BLANK_TOKENS.has(v)) return null;
    for (const t of MEAL_TYPES) {
        if (v === t) return t;
    }
    if (v === "snacks") return "snack";
    if (v === "breakfasts") return "breakfast";
    // Everything else (FatSecret's "other", Cronometer's user-invented group
    // names) folds into snack — the DB CHECK constraint allows only the four.
    return "snack";
}

/** Local hour as a fraction (13.5 = 13:30) for the inference cutoffs. */
function localHourFraction(iso: string, tz: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    }).formatToParts(new Date(iso));
    const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    const h = get("hour") === 24 ? 0 : get("hour");
    return h + get("minute") / 60;
}

/** Infer a meal slot from local time. Always reported as inferred, never
 *  presented as if the source file said it. */
export function inferMealType(iso: string, tz: string): MealType {
    const h = localHourFraction(iso, tz);
    if (h < 10.5) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 21.5) return "dinner";
    return "snack";
}

// ---------- Description ----------

/**
 * Build a description for a row that has none. Only legitimate when the meal
 * type came from the source file (MyFitnessPal exports one aggregated row per
 * meal per day with no food column). An INFERRED meal type is not evidence of
 * what was eaten, so synthesis is refused in that case.
 */
export function synthesizeDescription(
    mealType: MealType,
    mealTypeInferred: boolean,
    sourceApp: string | undefined,
): string | null {
    if (mealTypeInferred) return null;
    const slot = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    const key = (sourceApp ?? "").trim().toLowerCase();
    const label = SOURCE_APP_LABELS[key];
    return label
        ? `${slot} (imported from ${label})`
        : `${slot} (imported, no food detail in source)`;
}

// ---------- Row validation ----------

function numberError(
    field: string,
    value: number,
    max: number,
    unit: string,
): RowError {
    const tooBig = value > max;
    return {
        code: tooBig ? "value_out_of_range" : "negative_value",
        field,
        message: tooBig
            ? `${field} must be at most ${max} ${unit}; got ${value}`
            : `${field} must be at least 0; got ${value}`,
        suggested_fix: tooBig
            ? "Check for a unit mix-up or a stray digit in the source column."
            : "Omit the field rather than sending a negative value.",
        retryable: true,
    };
}

function checkMacro(
    field: string,
    value: number | undefined,
    max: number,
    unit: string,
): RowError | null {
    if (value === undefined) return null;
    if (!Number.isFinite(value)) {
        return {
            code: "value_not_finite",
            field,
            message: `${field} is not a finite number; got ${value}`,
            suggested_fix: "Omit the field when the source cell is empty.",
            retryable: true,
        };
    }
    if (value < 0 || value > max) {
        return numberError(field, value, max, unit);
    }
    return null;
}

/** Text that Postgres cannot store, which would otherwise surface as a thrown
 *  insert error mid-batch. Checked against the DECODED form because insertMeal
 *  decodes escape sequences on write. */
function unstorableText(decoded: string): boolean {
    return /\u0000/.test(decoded) || /[\uD800-\uDFFF]/.test(decoded);
}

export function validateRow(
    row: ImportRow,
    index: number,
    deps: Pick<ImportDeps, "tz" | "nowMs">,
    sourceApp: string | undefined,
): RowValidation {
    const clientRowId = row.client_row_id ?? null;
    const fail = (error: RowError): RowValidation => ({
        ok: false,
        index,
        source_line: row.source_line,
        client_row_id: clientRowId,
        error,
    });

    if (!Number.isInteger(row.source_line) || (row.source_line as number) < 1) {
        return fail({
            code: "invalid_source_line",
            field: "source_line",
            message: `source_line must be an integer >= 1; got ${row.source_line}`,
            suggested_fix:
                "Send the 1-based line number of this row in the original file.",
            retryable: true,
        });
    }

    const ts = resolveLoggedAt(row.logged_at, deps.tz, deps.nowMs);
    if (!ts.ok) return fail(ts.error);

    let mealTypeInferred = false;
    let mealType = normalizeMealType(row.meal_type);
    if (mealType === null) {
        mealType = inferMealType(ts.value.iso, deps.tz);
        mealTypeInferred = true;
    }

    let descriptionSynthesized = false;
    let description = row.description?.trim();
    if (description === undefined || description === "") {
        const synthetic = synthesizeDescription(
            mealType,
            mealTypeInferred,
            sourceApp,
        );
        if (synthetic === null) {
            return fail({
                code: "missing_description",
                field: "description",
                message:
                    "description is required and could not be synthesized: this row has neither a food name nor a meal type from the source file",
                suggested_fix:
                    "Map a food-name column, or supply meal_type so the row can be labelled by meal.",
                retryable: true,
            });
        }
        description = synthetic;
        descriptionSynthesized = true;
    }

    // Validate against what will actually be stored: insertMeal applies
    // decodeEscapeSequences on write, so a literal "\u0000" becomes a real NUL
    // there. We deliberately do NOT pass the decoded value on — decoding here
    // too would double-decode and would desynchronize the digest from the
    // value log_meal hashes for the same meal.
    const decodedDescription = decodeEscapeSequences(description);
    const decodedNotes =
        row.notes === undefined ? undefined : decodeEscapeSequences(row.notes);

    if (decodedDescription.length > MAX_DESCRIPTION_CHARS) {
        return fail({
            code: "text_too_long",
            field: "description",
            message: `description must be at most ${MAX_DESCRIPTION_CHARS} characters; got ${decodedDescription.length}`,
            suggested_fix: "Move detail into notes.",
            retryable: true,
        });
    }
    if (decodedNotes !== undefined && decodedNotes.length > MAX_NOTES_CHARS) {
        return fail({
            code: "text_too_long",
            field: "notes",
            message: `notes must be at most ${MAX_NOTES_CHARS} characters; got ${decodedNotes.length}`,
            suggested_fix: "Trim the source text.",
            retryable: true,
        });
    }
    if (
        unstorableText(decodedDescription) ||
        (decodedNotes !== undefined && unstorableText(decodedNotes))
    ) {
        return fail({
            code: "unstorable_text",
            field: unstorableText(decodedDescription) ? "description" : "notes",
            message:
                "text contains a null byte or an unpaired surrogate, which cannot be stored",
            suggested_fix:
                "Strip control characters from the source before importing.",
            retryable: true,
        });
    }

    for (const [field, value, max, unit] of [
        ["calories", row.calories, MAX_CALORIES, "kcal"],
        ["protein_g", row.protein_g, MAX_MACRO_G, "g"],
        ["carbs_g", row.carbs_g, MAX_MACRO_G, "g"],
        ["fat_g", row.fat_g, MAX_MACRO_G, "g"],
        ["fiber_g", row.fiber_g, MAX_MACRO_G, "g"],
        ["sugar_g", row.sugar_g, MAX_MACRO_G, "g"],
        ["alcohol_g", row.alcohol_g, MAX_ALCOHOL_G, "g"],
    ] as const) {
        const err = checkMacro(field, value, max, unit);
        if (err) return fail(err);
    }

    const input: MealInput = {
        description,
        meal_type: mealType,
        logged_at: ts.value.iso,
    };
    // Rounded here rather than left to insertMeal so the dry-run echo and the
    // per-row report show the number that will actually be stored — a fitness
    // export's kcal column is routinely fractional (Cronometer's always is).
    if (row.calories !== undefined)
        input.calories = toStoredInteger(row.calories);
    if (row.protein_g !== undefined) input.protein_g = row.protein_g;
    if (row.carbs_g !== undefined) input.carbs_g = row.carbs_g;
    if (row.fat_g !== undefined) input.fat_g = row.fat_g;
    if (row.fiber_g !== undefined) input.fiber_g = row.fiber_g;
    if (row.sugar_g !== undefined) input.sugar_g = row.sugar_g;
    // Stored unconditionally. alcohol_tracking_enabled hides alcohol from the
    // rendered output; it must never suppress the write.
    if (row.alcohol_g !== undefined) input.alcohol_g = row.alcohol_g;
    if (row.notes !== undefined) input.notes = row.notes;

    return {
        ok: true,
        index,
        source_line: row.source_line,
        client_row_id: clientRowId,
        resolved: {
            input,
            source_id: normalizeSourceId(row.source_id),
            meal_type_inferred: mealTypeInferred,
            description_synthesized: descriptionSynthesized,
            logged_at_from_bare_date: ts.value.fromBareDate,
            logged_at_used_profile_tz: ts.value.usedProfileTimezone,
        },
    };
}

// ---------- Idempotency keys ----------

function sha256Hex(parts: (string | number | null | undefined)[]): string {
    return new Bun.CryptoHasher("sha256")
        .update(parts.map((p) => p ?? "").join("\u0000"))
        .digest("hex");
}

/** Content digest of a resolved row. Excludes source_line so that re-exporting
 *  a file with lines added or removed still dedupes against a prior import. */
export function rowContentDigest(userId: string, input: MealInput): string {
    // DO NOT ADD fiber_g, sugar_g OR alcohol_g TO THIS ARRAY.
    //
    // The list below is not "the fields of a meal" — it is a frozen positional
    // hash input. Appending to it changes the digest of every row hashed from
    // now on, so the keys a user's next import produces would no longer match
    // the keys their previous import wrote, and re-importing an already-imported
    // file would create a full set of duplicates instead of a clean no-op.
    // deriveIdempotencyKey in src/supabase.ts is frozen for the same reason and
    // must stay in step with this one.
    //
    // The accepted cost: two meals differing ONLY in fiber/sugar/alcohol collapse
    // to one. Dedup stability is worth more than that precision here, and a
    // caller that needs the rows kept apart can pass an explicit idempotency_key.
    return sha256Hex([
        userId,
        input.description,
        input.meal_type,
        input.calories,
        input.protein_g,
        input.carbs_g,
        input.fat_g,
        input.notes,
        input.logged_at,
    ]);
}

/**
 * Assign explicit idempotency keys, appending an occurrence ordinal so that N
 * genuinely identical rows in one call produce N rows rather than collapsing to
 * one. Replaying the same payload regenerates the same ordinals, so a re-import
 * still dedupes completely.
 *
 * A row that carries a usable `source_id` keys on that id instead of on its
 * content. The id survives everything the content digest does not: the export
 * renders `logged_at` as second-precision local wall time and the importer
 * re-resolves it, so the two digests of one meal differ by construction. Keying
 * on the id also keeps two meals that happen to be identical apart.
 *
 * The `src:` marker cannot collide with a content digest, which is always 64
 * hex characters.
 *
 * Returns the count of rows that duplicated an earlier row in this batch —
 * worth surfacing, since it usually means the caller's parser emitted a row
 * twice, or that a hand-edited file repeated an id.
 */
export function assignIdempotencyKeys(
    userId: string,
    rows: ResolvedRow[],
): { duplicateRowsInFile: number } {
    const seen = new Map<string, number>();
    let duplicateRowsInFile = 0;
    for (const row of rows) {
        const basis =
            row.source_id !== null
                ? `src:${row.source_id}`
                : rowContentDigest(userId, row.input);
        const ordinal = seen.get(basis) ?? 0;
        seen.set(basis, ordinal + 1);
        if (ordinal > 0) duplicateRowsInFile++;
        row.input.idempotency_key = `import:${basis}:${ordinal}`;
    }
    return { duplicateRowsInFile };
}

// ---------- Batch integrity ----------

export interface BatchCheckResult {
    errors: RowError[];
    warnings: string[];
}

/**
 * Batch-level integrity gate. Detects a caller that dropped, duplicated, or
 * scrambled rows relative to its own source file.
 *
 * This carries NO security weight: the control totals arrive in the same
 * payload as the rows they describe, so an adversary simply makes them agree.
 * It catches mistakes, not attackers.
 */
export function checkBatch(
    rows: ImportRow[],
    opts: {
        expected_row_count: number;
        expected_total_kcal?: number;
        rows_skipped?: number;
        unmapped_columns?: string[];
    },
): BatchCheckResult {
    const errors: RowError[] = [];
    const warnings: string[] = [];

    if (rows.length !== opts.expected_row_count) {
        errors.push({
            code: "row_count_mismatch",
            field: "expected_row_count",
            message: `expected_row_count is ${opts.expected_row_count} but ${rows.length} rows were sent`,
            suggested_fix:
                "expected_row_count must count the rows in THIS call, not the whole file.",
            retryable: true,
        });
    }

    // Unique and strictly increasing, not contiguous: blank lines, header rows,
    // and deliberately-skipped rows all create legitimate gaps.
    let previous = 0;
    let interiorGaps = 0;
    for (const [i, row] of rows.entries()) {
        const line = row.source_line;
        if (!Number.isInteger(line) || line < 1) continue; // per-row check reports it
        if (i > 0) {
            if (line === previous) {
                errors.push({
                    code: "duplicate_source_line",
                    field: "source_line",
                    message: `source_line ${line} appears more than once`,
                    suggested_fix:
                        "Every row must carry its own line number from the source file.",
                    retryable: true,
                });
            } else if (line < previous) {
                errors.push({
                    code: "source_line_out_of_order",
                    field: "source_line",
                    message: `source_line ${line} follows ${previous}; rows must be in file order`,
                    suggested_fix: "Send rows in the order they appear.",
                    retryable: true,
                });
            } else if (line > previous + 1) {
                interiorGaps += line - previous - 1;
            }
        }
        previous = line;
    }

    // A LEADING offset is not a gap — every CSV has a header, and a chunked
    // import starts partway through the file.
    const skipped = opts.rows_skipped ?? 0;
    if (interiorGaps > skipped) {
        warnings.push(
            `${interiorGaps} source line(s) are missing between the rows sent, but rows_skipped is ${skipped}. Some rows may have been dropped.`,
        );
    }

    const withoutCalories = rows.filter(
        (r) => r.calories === undefined || r.calories === null,
    ).length;
    if (opts.expected_total_kcal === undefined) {
        warnings.push(
            "No expected_total_kcal was supplied, so the calorie control total was not verified.",
        );
    } else if (withoutCalories > 0) {
        warnings.push(
            `Calorie control total not verified: ${withoutCalories} row(s) have no calories.`,
        );
    } else {
        const sum = rows.reduce((acc, r) => acc + (r.calories ?? 0), 0);
        const tolerance = Math.max(
            1,
            KCAL_TOLERANCE_FRACTION * opts.expected_total_kcal,
        );
        if (Math.abs(sum - opts.expected_total_kcal) > tolerance) {
            errors.push({
                code: "kcal_total_mismatch",
                field: "expected_total_kcal",
                message: `expected_total_kcal is ${opts.expected_total_kcal} but the rows sum to ${sum}`,
                suggested_fix:
                    "Recompute the total from the source file rows in this call.",
                retryable: true,
            });
        }
    }

    if (opts.unmapped_columns && opts.unmapped_columns.length > 0) {
        warnings.push(
            `Unmapped source columns were reported and not imported: ${opts.unmapped_columns.join(", ")}.`,
        );
    }

    return { errors, warnings };
}

// ---------- Summary text ----------

export function buildSummaryText(result: ImportResult): string {
    const s = result.summary;
    const lines: string[] = [];
    const prefix = result.dry_run ? "Dry run: " : "";

    // A batch-gate failure returns no per-row results; the reason is in warnings.
    if (result.results.length === 0) {
        return [
            `${prefix}Nothing was imported: the batch failed its integrity check.`,
            ...result.warnings.map((w) => `Note: ${w}`),
        ].join("\n");
    }

    if (result.dry_run) {
        lines.push(
            `${prefix}${s.would_create} of ${s.total} row(s) would be imported` +
                (s.deduplicated > 0
                    ? `, ${s.deduplicated} already logged`
                    : "") +
                (s.failed > 0 ? `, ${s.failed} would fail` : "") +
                ". Nothing was written.",
        );
    } else {
        lines.push(
            `Imported ${s.created} of ${s.total} row(s)` +
                (s.deduplicated > 0
                    ? `, ${s.deduplicated} already logged (skipped)`
                    : "") +
                (s.failed > 0 ? `, ${s.failed} failed` : "") +
                (s.not_attempted > 0
                    ? `, ${s.not_attempted} not attempted`
                    : "") +
                ".",
        );
    }

    const failures = result.results.filter((r) => r.error !== null);
    if (failures.length > 0) {
        const shown = failures.slice(0, 5);
        for (const f of shown) {
            lines.push(
                `  line ${f.source_line}: ${f.error!.message}` +
                    (f.error!.suggested_fix
                        ? ` ${f.error!.suggested_fix}`
                        : ""),
            );
        }
        if (failures.length > shown.length) {
            lines.push(`  ...and ${failures.length - shown.length} more.`);
        }
        lines.push(
            "Re-call with only the corrected rows; rows already imported will be skipped automatically.",
        );
    }

    for (const w of result.warnings) lines.push(`Note: ${w}`);
    return lines.join("\n");
}

// ---------- Orchestration ----------

function emptySummary(total: number, skippedByCaller: number): ImportSummary {
    return {
        total,
        created: 0,
        deduplicated: 0,
        would_create: 0,
        failed: 0,
        not_attempted: 0,
        duplicate_rows_in_file: 0,
        rows_without_calories: 0,
        skipped_by_caller: skippedByCaller,
    };
}

function resultRow(
    v: RowValidation,
    status: RowStatus,
    mealId: string | null,
): ImportResultRow {
    const base = {
        index: v.index,
        source_line: v.source_line,
        client_row_id: v.client_row_id,
        status,
        meal_id: mealId,
    };
    if (v.ok) {
        return {
            ...base,
            description: v.resolved.input.description,
            logged_at: v.resolved.input.logged_at ?? null,
            meal_type: v.resolved.input.meal_type,
            meal_type_inferred: v.resolved.meal_type_inferred,
            description_synthesized: v.resolved.description_synthesized,
            logged_at_from_bare_date: v.resolved.logged_at_from_bare_date,
            error: null,
        };
    }
    return {
        ...base,
        description: null,
        logged_at: null,
        meal_type: null,
        meal_type_inferred: false,
        description_synthesized: false,
        logged_at_from_bare_date: false,
        error: v.error,
    };
}

/**
 * Validate and (unless dry_run) write a batch of meal rows.
 *
 * Never sets isError on the caller's behalf and never throws for row-level
 * problems: the per-row report is the product, and an isError result would let
 * hosts drop the structuredContent that carries it.
 *
 * `on_error: "abort"` is validation-scoped. Writes are not transactional —
 * there is no transaction available through supabase-js here — so once writing
 * begins, a database failure leaves earlier rows saved. Remaining rows are
 * reported as not_attempted rather than silently omitted.
 */
export async function runImport(
    args: BulkImportArgs,
    deps: ImportDeps,
): Promise<ImportResult> {
    const rows = args.meals;
    const dryRun = args.dry_run ?? false;
    const onError = args.on_error ?? "continue";
    const skippedByCaller = args.rows_skipped ?? 0;
    const summary = emptySummary(rows.length, skippedByCaller);
    summary.rows_without_calories = rows.filter(
        (r) => r.calories === undefined || r.calories === null,
    ).length;

    // Enforced here rather than in the Zod schema so the caller still gets the
    // structured report; a schema rejection never reaches this handler.
    if (rows.length === 0 || rows.length > MAX_ROWS_PER_CALL) {
        return {
            status: "failed",
            dry_run: dryRun,
            summary,
            warnings: [
                `A single call must carry 1 to ${MAX_ROWS_PER_CALL} rows; got ${rows.length}. Split the file into chunks, keeping all rows for one calendar date together.`,
            ],
            results: [],
        };
    }

    // Batch integrity first: a count or total mismatch means no row can be
    // trusted, so this aborts regardless of on_error.
    const batch = checkBatch(rows, {
        expected_row_count: args.expected_row_count,
        expected_total_kcal: args.expected_total_kcal,
        rows_skipped: skippedByCaller,
        unmapped_columns: args.unmapped_columns,
    });
    if (batch.errors.length > 0) {
        return {
            status: "failed",
            dry_run: dryRun,
            summary,
            warnings: [
                ...batch.warnings,
                ...batch.errors.map((e) => e.message),
            ],
            results: [],
        };
    }

    const validations = rows.map((row, i) =>
        validateRow(row, i, deps, args.source_app),
    );
    const okRows = validations.filter(
        (v): v is Extract<RowValidation, { ok: true }> => v.ok,
    );
    summary.failed = validations.length - okRows.length;

    const warnings = [...batch.warnings];
    const inferred = okRows.filter((v) => v.resolved.meal_type_inferred).length;
    if (inferred > 0) {
        warnings.push(
            `${inferred} row(s) had no meal type in the source; it was inferred from the time of day.`,
        );
    }
    const synthesized = okRows.filter(
        (v) => v.resolved.description_synthesized,
    ).length;
    if (synthesized > 0) {
        warnings.push(
            `${synthesized} row(s) had no food name in the source; a placeholder description was used.`,
        );
    }
    const bareDates = okRows.filter(
        (v) => v.resolved.logged_at_from_bare_date,
    ).length;
    if (bareDates > 0) {
        warnings.push(
            `${bareDates} row(s) had a date but no time; they were logged at local noon.`,
        );
    }

    // An unconfigured timezone silently means UTC. Rows that carried their own
    // offset are unaffected, but a bare date or a local time had to be placed
    // using that default — and once the user sets their real timezone, those
    // instants re-read in it. Times shift by the whole offset, and rows near
    // either edge of the day change date: a 01:00 row imported as UTC reads as
    // the previous day in Los Angeles, a 23:30 row as the next day in Tokyo.
    const tzDependent = okRows.filter(
        (v) => v.resolved.logged_at_used_profile_tz,
    ).length;
    if (!deps.tzConfigured && tzDependent > 0) {
        warnings.push(
            `Your timezone is not set, so ${tzDependent} row(s) without an explicit UTC offset were placed using UTC. ` +
                `If you set a different timezone later, those meals will move — by the offset for times of day, and to an adjacent day for anything logged near midnight. ` +
                `Set your timezone first and re-import for accurate results.`,
        );
    }

    if (onError === "abort" && summary.failed > 0) {
        summary.not_attempted = okRows.length;
        return {
            status: "failed",
            dry_run: dryRun,
            summary,
            warnings,
            results: validations.map((v) =>
                resultRow(v, v.ok ? "not_attempted" : "failed", null),
            ),
        };
    }

    const { duplicateRowsInFile } = assignIdempotencyKeys(
        deps.userId,
        okRows.map((v) => v.resolved),
    );
    summary.duplicate_rows_in_file = duplicateRowsInFile;
    if (duplicateRowsInFile > 0) {
        warnings.push(
            `${duplicateRowsInFile} row(s) are exact duplicates of another row in this batch; each was imported as a separate meal.`,
        );
    }

    const keys = okRows.map((v) => v.resolved.input.idempotency_key!);
    const sourceIds = [
        ...new Set(
            okRows
                .map((v) => v.resolved.source_id)
                .filter((id): id is string => id !== null),
        ),
    ];
    const [existing, existingIds] = await Promise.all([
        deps.existingKeys(keys),
        deps.existingMealIds(sourceIds),
    ]);

    /** The id of the meal this row already IS, when it names one the user still
     *  has. Such a row is never written: its meal predates the export, so
     *  inserting would duplicate it under a fresh id. Checked identically on
     *  both paths so a dry run predicts exactly what the real run does. */
    const storedIdFor = (v: (typeof okRows)[number]): string | null =>
        v.resolved.source_id !== null && existingIds.has(v.resolved.source_id)
            ? v.resolved.source_id
            : null;
    let matchedBySourceId = 0;

    const byIndex = new Map<number, ImportResultRow>();
    for (const v of validations) {
        if (!v.ok) byIndex.set(v.index, resultRow(v, "failed", null));
    }

    if (dryRun) {
        for (const v of okRows) {
            const key = v.resolved.input.idempotency_key!;
            const storedId = storedIdFor(v);
            if (storedId !== null) matchedBySourceId++;
            if (storedId !== null || existing.has(key)) {
                summary.deduplicated++;
                byIndex.set(
                    v.index,
                    resultRow(v, "would_deduplicate", storedId),
                );
            } else {
                summary.would_create++;
                byIndex.set(v.index, resultRow(v, "would_create", null));
            }
        }
    } else {
        let aborted = false;
        for (const v of okRows) {
            if (aborted) {
                summary.not_attempted++;
                byIndex.set(v.index, resultRow(v, "not_attempted", null));
                continue;
            }
            const storedId = storedIdFor(v);
            if (storedId !== null) {
                matchedBySourceId++;
                summary.deduplicated++;
                byIndex.set(v.index, resultRow(v, "deduplicated", storedId));
                continue;
            }
            try {
                const { meal, deduplicated } = await deps.insert(
                    v.resolved.input,
                );
                if (deduplicated) summary.deduplicated++;
                else summary.created++;
                byIndex.set(
                    v.index,
                    resultRow(
                        v,
                        deduplicated ? "deduplicated" : "created",
                        meal.id,
                    ),
                );
            } catch (e) {
                summary.failed++;
                byIndex.set(v.index, {
                    ...resultRow(v, "failed", null),
                    error: {
                        code: "insert_failed",
                        message: `Database write failed: ${e instanceof Error ? e.message : String(e)}`,
                        suggested_fix:
                            "Re-call with this row; rows already imported will be skipped.",
                        retryable: true,
                    },
                });
                if (onError === "abort") aborted = true;
            }
        }
    }

    // Worth stating plainly: a user restoring a backup sees created: 0 and
    // needs to know that means "already there", not "nothing happened".
    if (matchedBySourceId > 0) {
        warnings.push(
            `${matchedBySourceId} row(s) are meals you already have — they were matched by the id in the file and left untouched, not written again.`,
        );
    }

    const landed =
        summary.created + summary.deduplicated + summary.would_create;
    const status: ImportResult["status"] =
        landed === 0
            ? "failed"
            : summary.failed > 0
              ? "partial_success"
              : "success";

    return {
        status,
        dry_run: dryRun,
        summary,
        warnings,
        results: rows.map(
            (_, i) =>
                byIndex.get(i) ?? resultRow(validations[i]!, "failed", null),
        ),
    };
}

import { describe, test, expect } from "bun:test";
import {
    analyticsLogLine,
    categorizeError,
    userFacingError,
} from "./analytics.js";
import { ToolError } from "./errors.js";
import { LoggedAtError } from "./tz.js";
import { assertPlausibleLength, pickLengthWriteUnit } from "./units.js";

// The real text of a throw, so these rows can't drift from the source wording.
function thrownMessage(fn: () => unknown): string {
    try {
        fn();
    } catch (e) {
        return (e as Error).message;
    }
    throw new Error("expected a throw");
}

// Each case below is the literal (or representative) wording of a real throw
// site, not an invented string — see the file/line noted in each comment.
// This is the only guard against categorizeError silently drifting out of
// sync when one of those messages gets reworded elsewhere.
describe("categorizeError", () => {
    test.each([
        // src/tz.ts resolveWriteLoggedAt / src/mcp.ts unsetTzNote re-throw
        [
            'logged_at is invalid ("yesterday evening"): unrecognized format. Use "YYYY-MM-DD" for a date with no known time.',
            "invalid_date_format",
        ],
        [
            "logged_at is in the future (2026-08-27T16:30:49). Log the time the entry was actually recorded.",
            "invalid_date_format",
        ],
        [
            'logged_at is in the future (2026-08-27T16:30:49). "2026-08-27T16:30:49" carries no UTC offset and this account has no timezone set, so it was read as UTC. The user can set one with set_timezone.',
            "invalid_date_format",
        ],
        // src/tz.ts shiftLocalDate / splitDate
        ["Invalid date string: 2026-99-99", "invalid_date_format"],
        // src/mcp.ts assertDateRange — the echoed value must not steer it
        [
            'Invalid start_date "auth-token": not a real calendar date. Use YYYY-MM-DD, e.g. "2026-01-31".',
            "invalid_date_format",
        ],
        [
            "Invalid date range: start_date (2026-02-01) is after end_date (2026-01-01). Swap them.",
            "invalid_date_format",
        ],
        [
            "Date range too long: 2026-01-01 to 2026-12-31 spans 365 days, and at most 31 days (inclusive) can be listed at once. For a longer period use get_trends (daily totals rather than every meal), or split the range into monthly calls.",
            "date_range_too_long",
        ],

        // src/mcp.ts set_timezone
        [
            "Invalid timezone: Mars/Olympus_Mons. Use an IANA identifier like 'America/Los_Angeles' or 'Europe/London'.",
            "invalid_timezone",
        ],

        // src/mcp.ts assertPlausibleWeight
        [
            "5000 kg is outside the plausible body-weight range (20–500 kg / 44–1102 lb). Double-check the number and unit.",
            "invalid_numeric_value",
        ],
        // src/units.ts toGrams
        ["Invalid weight value: NaN", "invalid_numeric_value"],
        // src/alcohol.ts gramsFromDrink
        ["Invalid drink volume (mL): -50", "invalid_numeric_value"],
        [
            "Invalid ABV (expected a percentage between 0 and 100): 250",
            "invalid_numeric_value",
        ],

        // src/mcp.ts set_language
        [
            "Unsupported language: xx. Use one of: en, de, es, fr, nl, pl, it, uk, ja, tr.",
            "invalid_param_value",
        ],
        // src/mcp.ts set_weight_unit
        [
            "Invalid weight unit: stone. Use 'kg', 'lb', or null to clear.",
            "invalid_param_value",
        ],

        // src/units.ts pickWriteUnit
        [
            "No weight unit given and no preference set. Pass unit ('kg' or 'lb'), or set a default first with set_weight_unit.",
            "missing_required_param",
        ],

        // src/supabase.ts updateMeal / updateWeight not-found pre-checks
        [
            "No meal found with id 00000000-0000-4000-8000-000000000001.",
            "record_not_found",
        ],
        [
            "No weight entry found with id 00000000-0000-4000-8000-000000000003.",
            "record_not_found",
        ],
        [
            "No water entry found with id 00000000-0000-4000-8000-000000000002.",
            "record_not_found",
        ],
        // The echoed id must not steer it into an earlier tier-1 bucket
        [
            'No meal found with id "not a real calendar date": ids are UUIDs like "3f2b9c1e-…". Get one from get_meals_today, get_meals_by_date, get_meals_by_date_range or search_meals.',
            "record_not_found",
        ],

        // src/supabase.ts / src/foods.ts missing config
        [
            "Missing SUPABASE_URL or SUPABASE_SECRET_KEY",
            "service_misconfigured",
        ],
        [
            "OFF_USER_AGENT is not configured — Open Food Facts requires a User-Agent like 'nutrition-mcp (you@example.com)'",
            "service_misconfigured",
        ],

        // src/widgets.ts assembly
        ["@inlinets source not found: src/missing.ts", "internal_asset_error"],
        [
            "widget source partial not found: shared/missing.js",
            "internal_asset_error",
        ],
        ["@include cycle: a.html -> b.html -> a.html", "internal_asset_error"],
        ["unknown widget: not-a-real-widget", "internal_asset_error"],

        // src/supabase.ts assertWindowComplete (the paged range readers)
        [
            "Failed to get meals: fetched 1000 of 1400 rows — result would be truncated",
            "read_truncated",
        ],

        // src/export.ts / src/supabase.ts
        ["Failed to upload export: storage quota exceeded", "export_error"],
        ["Failed to create download link: unknown error", "export_error"],
        [
            "getAllMeals: fetched 5 meals but countMeals reported 10 — export would be truncated",
            "export_error",
        ],

        // Postgres refusing a value behind our "Failed to" prefix — the
        // request has to change, so not supabase_error's "retry unchanged"
        [
            'Failed to delete meal: invalid input syntax for type uuid: "abc"',
            "db_rejected_value",
        ],
        [
            'Failed to insert meal: new row for relation "meals" violates check constraint "meals_fiber_g_check"',
            "db_rejected_value",
        ],
        [
            'Failed to update meal: value "99999999999" is out of range for type integer',
            "db_rejected_value",
        ],
        [
            "Failed to insert meal: value too long for type character varying(500)",
            "db_rejected_value",
        ],

        // src/supabase.ts generic persistence failures — the regression case:
        // these contain "token"/"auth" as our own noun, not as a signal, and
        // must NOT be classified auth_expired.
        ["Failed to insert meal: connection reset", "supabase_error"],
        ["Failed to store token: duplicate key value", "supabase_error"],
        ["Failed to delete auth codes: connection reset", "supabase_error"],
        ["Failed to look up meal: connection reset", "supabase_error"],
        ["Failed to count water: connection reset", "supabase_error"],
        ["Failed to check existing meals: connection reset", "supabase_error"],
        ["Failed to save profile: connection reset", "supabase_error"],

        // Third-party auth text with no "Failed to " prefix of ours
        ["JWT expired", "auth_expired"],
        ["Auth session missing!", "auth_expired"],

        // src/foods.ts Open Food Facts
        ["Open Food Facts request failed: 429", "rate_limited"],
        ["Open Food Facts request failed: 500", "unknown"],

        // Body measurements: src/supabase.ts updateBodyMeasurement, and
        // src/mcp.ts notUuidText("body measurement", …)
        [
            "No body measurement found with id 00000000-0000-4000-8000-000000000004.",
            "record_not_found",
        ],
        [
            'No body measurement found with id "not a real calendar date": ids are UUIDs like "3f2b9c1e-…". Get one from get_body_measurements.',
            "record_not_found",
        ],
        // src/units.ts assertPlausibleLength / toMillimetres
        [
            thrownMessage(() => assertPlausibleLength("waist", 300, "cm")),
            "invalid_numeric_value",
        ],
        ["Invalid length value: NaN", "invalid_numeric_value"],
        // src/mcp.ts set_length_unit
        [
            "Invalid length unit: mm. Valid values are 'cm', 'in', or null to clear.",
            "invalid_param_value",
        ],
        // src/units.ts pickLengthWriteUnit
        [
            thrownMessage(() => pickLengthWriteUnit(undefined, null)),
            "missing_required_param",
        ],
        // src/mcp.ts update_body_measurement with nothing to change — must not
        // fall to tier 3's "date" keyword (which "update" would contain).
        [
            "Nothing to change: value, unit, logged_at or notes is needed.",
            "missing_required_param",
        ],
        // src/supabase.ts body-measurement persistence
        [
            "Failed to insert body measurement: connection reset",
            "supabase_error",
        ],
        [
            'Failed to insert body measurement: new row for relation "body_measurement_log" violates check constraint "body_measurement_log_kind_check"',
            "db_rejected_value",
        ],
        [
            "Failed to get body measurements: fetched 1000 of 1400 rows — result would be truncated",
            "read_truncated",
        ],
        [
            "Failed to get body measurements: fetched 5 of 10 rows — export would be truncated",
            "export_error",
        ],
        // Regression: the new length phrase must not swallow or shadow the
        // body-weight one (src/mcp.ts assertPlausibleWeight).
        [
            "80 lb is outside the plausible body-weight range (20–500 kg / 44–1102 lb). Double-check the number and unit.",
            "invalid_numeric_value",
        ],

        // Native/third-party network errors
        ["fetch failed", "network_error"],
        ["connect ECONNREFUSED 127.0.0.1:5432", "network_error"],
        ["The operation was aborted due to timeout", "network_error"],

        // True last-resort fallback
        ["Cannot read properties of undefined (reading 'x')", "unknown"],
    ])("categorizes %j as %s", (message, expected) => {
        expect(categorizeError(new Error(message))).toBe(expected);
    });

    test("non-Error values fall back to unknown", () => {
        expect(categorizeError("plain string")).toBe("unknown");
        expect(categorizeError(42)).toBe("unknown");
        expect(categorizeError(new Error(""))).toBe("unknown");
    });
});

describe("a ToolError's own category", () => {
    test("wins over the wording tiers and passes through verbatim", () => {
        // "required" alone would be missing_required_param in tier 3.
        const err = new ToolError("added_sugar_g is required", {
            category: "added_sugar_missing",
        });
        expect(categorizeError(err)).toBe("added_sugar_missing");
        expect(
            userFacingError("log_meal", err, "added_sugar_missing", "ref1"),
        ).toBe("added_sugar_g is required");
        // Without one, the wording rules still decide.
        expect(categorizeError(new ToolError("x is required"))).toBe(
            "missing_required_param",
        );
    });
});

describe("userFacingError", () => {
    const REF = "abc12345";

    test("a ToolError passes through verbatim, with no ref", () => {
        const text = userFacingError(
            "log_meal",
            new ToolError("Swap the dates."),
            "invalid_date_format",
            REF,
        );
        expect(text).toBe("Swap the dates.");
    });

    test("a LoggedAtError is a ToolError, so it passes through too", () => {
        const err = new LoggedAtError("logged_at is invalid (x).", false);
        expect(err).toBeInstanceOf(ToolError);
        expect(
            userFacingError("log_meal", err, categorizeError(err), REF),
        ).toBe("logged_at is invalid (x).");
    });

    // src/supabase.ts updateMeal's not-found pre-check: the only DB-layer
    // throw whose text is meant for the model.
    test("updateMeal's not-found ToolError passes through verbatim", () => {
        const err = new ToolError(
            "No meal found with id 00000000-0000-4000-8000-000000000001.",
        );
        expect(categorizeError(err)).toBe("record_not_found");
        expect(
            userFacingError("update_meal", err, categorizeError(err), REF),
        ).toBe(err.message);
    });

    test("a Postgres uuid cast error is replaced, not echoed", () => {
        const err = new Error(
            'Failed to delete meal: invalid input syntax for type uuid: "abc"',
        );
        const text = userFacingError(
            "delete_meal",
            err,
            categorizeError(err),
            REF,
        );
        expect(text).toContain("delete_meal");
        expect(text).toContain(`ref ${REF}`);
        for (const leak of [
            "invalid input syntax",
            "uuid",
            "Failed to",
            "Postgres",
            '"abc"',
        ])
            expect(text).not.toContain(leak);
    });

    test("a runtime RangeError is replaced, not echoed", () => {
        const err = new RangeError("Invalid time value");
        expect(categorizeError(err)).toBe("unknown");
        const text = userFacingError("get_trends", err, "unknown", REF);
        expect(text).not.toContain("Invalid time value");
        expect(text).toContain(`ref ${REF}`);
    });

    test("a thrown non-Error value is replaced, not echoed", () => {
        expect(userFacingError("t", "boom", "unknown", REF)).not.toContain(
            "boom",
        );
    });

    // Categories share wording by design: what differs is what the model
    // should do next (retry, wait, report, change the request), not the
    // bucket. So texts are identical within a group and distinct across them.
    const GROUPS: Record<string, string[]> = {
        temporary: [
            "supabase_error",
            "read_truncated",
            "unknown",
            "network_error",
        ],
        export: ["export_error"],
        rateLimited: ["rate_limited"],
        config: [
            "service_misconfigured",
            "internal_asset_error",
            "auth_expired",
        ],
        rejectedValue: [
            "db_rejected_value",
            "invalid_date_format",
            "date_range_too_long",
            "invalid_timezone",
            "invalid_numeric_value",
            "invalid_param_value",
            "missing_required_param",
            "record_not_found",
        ],
    };
    const RAW = 'Failed to get meals: relation "public.meals" does not exist';
    const textFor = (category: string) =>
        userFacingError("export_all_data", new Error(RAW), category, REF);

    test.each(Object.entries(GROUPS))(
        "every %s category gives one text, with the ref and no raw message",
        (_group, categories) => {
            const texts = categories.map(textFor);
            for (const text of texts) {
                expect(text).toBe(texts[0]!);
                expect(text).toContain(`ref ${REF}`);
                expect(text).toContain("export_all_data");
                expect(text).not.toContain("relation");
                expect(text).not.toContain("Failed to");
                expect(text.startsWith("Error:")).toBe(false);
            }
        },
    );

    test("the groups' texts are pairwise distinct", () => {
        const texts = Object.values(GROUPS).map((c) => textFor(c[0]!));
        expect(new Set(texts).size).toBe(texts.length);
    });
});

// The privacy policy says the runtime log is not linked to an account; these
// lines are most of that log.
describe("analyticsLogLine", () => {
    const noUser = /user=|[0-9a-f]{8}-[0-9a-f]{4}-/;

    test("success", () => {
        const line = analyticsLogLine("log_meal", 12, { kind: "success" });
        expect(line).toBe("[analytics] log_meal success 12ms");
        expect(line).not.toMatch(noUser);
    });

    test("reported failure", () => {
        const line = analyticsLogLine("bulk_import_meals", 40, {
            kind: "reported-failure",
            category: "validation",
        });
        expect(line).toContain("reported-failure=validation");
        expect(line).not.toMatch(noUser);
    });

    test("error carries the ref and the JSON-quoted message", () => {
        const line = analyticsLogLine("log_meal", 7, {
            kind: "error",
            category: "supabase_error",
            ref: "abc12345",
            message: 'bad "value"',
        });
        expect(line).toContain("error=supabase_error ref=abc12345 7ms");
        expect(line).toContain(JSON.stringify('bad "value"'));
        expect(line).not.toMatch(noUser);
    });

    test("a newline in the message cannot forge a second log line", () => {
        const line = analyticsLogLine("log_meal", 7, {
            kind: "error",
            category: "unknown",
            ref: "abc12345",
            message: "first\n[analytics] forged success 1ms",
        });
        expect(line).not.toContain("\n");
    });

    test("a long message is capped", () => {
        const line = analyticsLogLine("log_meal", 7, {
            kind: "error",
            category: "unknown",
            ref: "abc12345",
            message: "x".repeat(2000),
        });
        expect(line.length).toBeLessThan(600);
    });
});

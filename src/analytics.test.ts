import { describe, test, expect } from "bun:test";
import { categorizeError } from "./analytics.js";

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
            'logged_at is in the future (2026-08-27T16:30:49). "2026-08-27T16:30:49" carries no UTC offset and this account has no timezone set, so it was read as UTC. Set one with set_timezone.',
            "invalid_date_format",
        ],
        // src/tz.ts shiftLocalDate / splitDate
        ["Invalid date string: 2026-99-99", "invalid_date_format"],

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
            "Unsupported language: xx. Use one of: en, de, es, fr, nl, pl, it, uk, ja.",
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
        ["Failed to update meal: meal not found", "record_not_found"],
        ["Failed to update weight: entry not found", "record_not_found"],

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

        // src/export.ts / src/supabase.ts
        ["Failed to upload export: storage quota exceeded", "export_error"],
        ["Failed to create download link: unknown error", "export_error"],
        [
            "getAllMeals: fetched 5 meals but countMeals reported 10 — export would be truncated",
            "export_error",
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

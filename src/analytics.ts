import { getSupabase } from "./supabase.js";
import { formatClientId } from "./client-id.js";
import { errorLogText, newErrorRef, ToolError } from "./errors.js";

export interface AnalyticsRecord {
    user_id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category?: string;
    date_range_days?: number;
    mcp_session_id?: string;
    invoked_at: string;
    protocol_era?: "legacy" | "modern";
    client_name?: string;
}

/**
 * Identity recorded for a tool call that wipes the caller's own analytics rows.
 *
 * `delete_account` deletes `tool_analytics` as its *first* step, but
 * `withAnalytics` persists its row *after* the handler resolves — and
 * `tool_analytics.user_id` is a plain varchar with no FK, so that insert
 * succeeds and resurrects a row for a user the tool just promised was gone.
 * Recording the deletion under a sentinel keeps the operational signal (how
 * often deletions run, how long they take, whether they failed) while retaining
 * no identifier for the deleted account.
 */
export const DELETED_ACCOUNT_ANALYTICS_ID = "[deleted]";

interface AnalyticsContext {
    userId: string;
    sessionId?: string;
    // Which protocol era served this call, and who called it. /mcp serves two
    // eras at once and the retirement decision turns on counting the distinct
    // USERS still on the legacy one over a 30-day window — something the
    // runtime access log cannot answer, because it holds well under an hour.
    protocolEra?: "legacy" | "modern";
    // Read lazily, at write time rather than registration time: on the modern
    // leg the envelope backfills the client identity onto the server before
    // dispatch, so it is populated by the time a tool handler finishes. On the
    // legacy leg only `initialize` carries clientInfo, and a tool call is a
    // separate request on that stateless leg, so this normally yields nothing
    // there — the era is what matters, the name is a bonus.
    clientInfo?: () => { name?: string; version?: string } | undefined;
}

/**
 * Bucket a thrown error for `tool_analytics.error_category`.
 *
 * Checked in three tiers. Tier 1 matches the *literal, fixed wording* of
 * validation/config errors this codebase throws itself (resolveWriteLoggedAt,
 * set_timezone, assertPlausibleWeight, assertPlausibleLength, widget
 * assembly, missing env config,
 * …) — checked first so they don't get swallowed by tier 3's looser
 * keyword heuristics. Tier 2 is every src/supabase.ts persistence throw,
 * matched generically by its "Failed to <verb> <noun>: <cause>" prefix —
 * this runs *before* tier 3's auth/rate/date keyword checks specifically so
 * that a message like "Failed to store token" or "Failed to delete auth
 * codes" (which legitimately contain "token"/"auth" as our own noun, not as
 * a signal about the failure) is bucketed as `supabase_error`, not
 * `auth_expired`, before tier 3 ever sees it. Tier 3 is for third-party text
 * we didn't author (Postgres/PostgREST, native fetch/DNS errors) where only
 * a keyword heuristic is possible.
 */
export function categorizeError(error: unknown): string {
    // A ToolError that names its own category wins over every wording rule:
    // its text can carry words ("required", "date") the tiers below would
    // misfile.
    if (error instanceof ToolError && error.category) return error.category;

    const msg =
        error instanceof Error ? error.message.toLowerCase() : String(error);

    // ---- Tier 1: our own fixed message wording ----

    // updateMeal / updateWeight / updateBodyMeasurement (src/supabase.ts)
    // pre-checks — a stale or
    // wrong id, not a DB outage, so it shouldn't share supabase_error's bucket.
    // First, and startsWith rather than includes: the not-found text echoes
    // the caller's id, which could otherwise carry a later check's phrase
    // ("not a real calendar date", "invalid timezone") and be misfiled.
    if (
        msg.startsWith("no meal found with id") ||
        msg.startsWith("no saved meal found") ||
        msg.startsWith("no weight entry found with id") ||
        msg.startsWith("no water entry found with id") ||
        msg.startsWith("no body measurement found with id")
    )
        return "record_not_found";

    // update_body_measurement with no field to change. Worded "Nothing to
    // change" rather than "…to update" on purpose: "update" contains "date",
    // which tier 3 would file as invalid_date_format.
    if (msg.startsWith("nothing to change")) return "missing_required_param";

    // resolveWriteLoggedAt (src/tz.ts) and its unset-timezone re-throw
    // (src/mcp.ts) — both always carry one of these phrases regardless of
    // which parseLoggedAt failure reason produced them.
    if (
        msg.includes("logged_at is invalid") ||
        msg.includes("logged_at is in the future") ||
        msg.includes("carries no utc offset")
    )
        return "invalid_date_format";

    // assertDateRange / assertCalendarDate (src/mcp.ts), behind every
    // date-taking read tool.
    // Matched here rather than left to tier 3's "date" keyword because the
    // message echoes the caller's own value, which could carry "auth" or
    // "token" and be misfiled as auth_expired.
    if (
        msg.includes("not a real calendar date") ||
        msg.includes("invalid date range")
    )
        return "invalid_date_format";
    // Its own bucket so tool_analytics shows how often the range cap bites.
    if (msg.includes("date range too long")) return "date_range_too_long";

    // Thrown by set_timezone in src/mcp.ts (not src/tz.ts — that file only
    // ever throws the logged_at-shaped messages matched above).
    if (msg.includes("invalid timezone")) return "invalid_timezone";

    // toGrams / toMillimetres / assertPlausibleLength / gramsFromDrink
    // (src/units.ts, src/alcohol.ts) and assertPlausibleWeight (src/mcp.ts) —
    // a bad number, not a bad shape.
    if (
        msg.includes("outside the plausible body-weight range") ||
        msg.includes("is outside the plausible range") ||
        msg.includes("invalid length value") ||
        msg.includes("invalid weight value") ||
        msg.includes("invalid drink volume") ||
        msg.includes("invalid abv")
    )
        return "invalid_numeric_value";

    if (
        msg.includes("unsupported language") ||
        msg.includes("invalid weight unit") ||
        msg.includes("invalid length unit")
    )
        return "invalid_param_value";

    // pickWriteUnit / pickLengthWriteUnit (src/units.ts) — semantically
    // missing_required_param, but their wording doesn't contain "missing" or
    // "required".
    if (
        msg.includes("no weight unit given and no preference set") ||
        msg.includes("no length unit given and no preference set")
    )
        return "missing_required_param";

    // Deploy/env config problems, not user- or DB-caused. The only throw site
    // for the first is the single literal "Missing SUPABASE_URL or
    // SUPABASE_SECRET_KEY" (src/supabase.ts) — one substring check covers it.
    if (
        msg.includes("missing supabase_url or supabase_secret_key") ||
        msg.includes("off_user_agent is not configured")
    )
        return "service_misconfigured";

    // src/widgets.ts assembly — should only fire on a deploy defect, never
    // in ordinary operation, so it gets its own bucket rather than "unknown".
    if (
        msg.includes("@inlinets") ||
        msg.includes("widget source partial not found") ||
        msg.includes("@include cycle") ||
        msg.startsWith("unknown widget:")
    )
        return "internal_asset_error";

    // selectLoggedWindow / assertWindowComplete (src/supabase.ts): a range
    // read came back short of its exact count. Must precede tier 2 — the
    // message starts "Failed to get <noun>:" and would otherwise be
    // supabase_error.
    if (msg.includes("result would be truncated")) return "read_truncated";

    // export_all_data (src/export.ts / src/supabase.ts) — upload, signed-URL,
    // and row-count-mismatch failures.
    if (
        msg.includes("failed to upload export") ||
        msg.includes("failed to create download link") ||
        msg.includes("export would be truncated")
    )
        return "export_error";

    // ---- Tier 2: every src/supabase.ts persistence throw ----

    // Postgres refusing a value it was handed (a cast, a check constraint, an
    // overflow) — the request needs to change, so it must not share
    // supabase_error's "retry unchanged" advice. Checked before the generic
    // prefix below, which these usually also carry.
    if (
        msg.includes("invalid input syntax") ||
        msg.includes("violates check constraint") ||
        msg.includes("out of range") ||
        msg.includes("value too long")
    )
        return "db_rejected_value";

    // Every one follows "Failed to <verb> <noun>: <cause>" — match the prefix
    // generically rather than enumerating verbs, or a verb added later (as
    // happened with "look up", "resolve", "count", "check", "save", "store",
    // "upload") silently falls through to "unknown" again. Deliberately
    // checked *before* tier 3's auth/rate/date keywords below: our own nouns
    // ("Failed to store token", "Failed to delete auth codes") would
    // otherwise false-positive on tier 3's "token"/"auth" check.
    if (msg.includes("failed to ") || msg.includes("supabase"))
        return "supabase_error";

    // ---- Tier 3: keyword heuristics for third-party error text ----

    if (
        msg.includes("auth") ||
        msg.includes("token") ||
        msg.includes("jwt") ||
        msg.includes("unauthorized") ||
        msg.includes("invalid api key") ||
        msg.includes("expired")
    )
        return "auth_expired";
    if (msg.includes("rate") || msg.includes("limit") || msg.includes("429"))
        return "rate_limited";
    if (msg.includes("date") || msg.includes("format"))
        return "invalid_date_format";
    if (msg.includes("required") || msg.includes("missing"))
        return "missing_required_param";
    if (
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("econnrefused") ||
        msg.includes("timeout") ||
        msg.includes("timed out")
    )
        return "network_error";

    return "unknown";
}

const TEMPORARY_CATEGORIES = new Set([
    "supabase_error",
    "read_truncated",
    "unknown",
    "network_error",
]);
// auth_expired belongs here, not with a "reconnect" message: the caller's
// bearer is verified before any tool runs, so auth/JWT text inside a handler
// comes from the server's own credentials, which reconnecting cannot fix.
const CONFIG_CATEGORIES = new Set([
    "service_misconfigured",
    "internal_asset_error",
    "auth_expired",
]);

/**
 * The only text a thrown error may put in front of the model (policy 5.A).
 * A ToolError was written for the caller and passes through verbatim;
 * anything else is third-party or runtime text and is replaced wholesale by a
 * category message plus `ref`, which matches the server-side `[analytics]`
 * warn line carrying the raw text.
 */
export function userFacingError(
    toolName: string,
    error: unknown,
    category: string,
    ref: string,
): string {
    if (error instanceof ToolError) return error.message;
    if (TEMPORARY_CATEGORIES.has(category))
        return `${toolName} could not finish: the Nutrition server had a temporary problem reading or saving the user's data (ref ${ref}). Nothing about the request needs to change. Retry once; if this was a change (log, update or delete), first check with the matching read tool whether it already went through, so it is not recorded twice. If it fails again, tell the user the service is having trouble and to try again later.`;
    if (category === "export_error")
        return `${toolName} could not build or upload the archive (ref ${ref}). Try again in a few minutes; the user's data is unaffected.`;
    if (category === "rate_limited")
        return `${toolName} was rate-limited (ref ${ref}). Wait a minute before trying again.`;
    if (CONFIG_CATEGORIES.has(category))
        return `${toolName} is unavailable because of a server configuration problem (ref ${ref}). This is not caused by the request; tell the user the feature is temporarily unavailable.`;
    return `${toolName} could not finish because the server rejected one of the values it was given (ref ${ref}). Check that dates are YYYY-MM-DD and that ids come from a listing tool such as get_meals_today, then retry.`;
}

function calculateDateRangeDays(
    startDate?: string,
    endDate?: string,
): number | undefined {
    if (!startDate) return undefined;

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return undefined;

    if (!endDate) return 0; // single date

    const end = new Date(endDate);
    if (isNaN(end.getTime())) return undefined;

    return Math.round(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
}

/**
 * One runtime-log line per tool call. Carries no user id, email or session
 * id: the privacy policy promises the runtime log is not linked to an
 * account; tool_analytics holds the per-user signal. An error message is
 * capped and JSON.stringify'd, because Postgres/PostgREST/runtime text can
 * carry caller-controlled bytes, newlines that would forge a log line
 * included.
 */
export function analyticsLogLine(
    toolName: string,
    durationMs: number,
    outcome:
        | { kind: "success" }
        | { kind: "reported-failure"; category: string }
        | { kind: "error"; category: string; ref: string; message: string },
): string {
    const base = `[analytics] ${toolName}`;
    switch (outcome.kind) {
        case "success":
            return `${base} success ${durationMs}ms`;
        case "reported-failure":
            return `${base} reported-failure=${outcome.category} ${durationMs}ms`;
        case "error":
            return `${base} error=${outcome.category} ref=${outcome.ref} ${durationMs}ms: ${JSON.stringify(outcome.message.slice(0, 500))}`;
    }
}

function persistAnalytics(record: AnalyticsRecord): void {
    getSupabase()
        .from("tool_analytics")
        .insert(record)
        .then(({ error }) => {
            if (error) {
                console.warn(
                    `Failed to persist analytics for ${record.tool_name}:`,
                    error.message,
                );
            }
        });
}

/**
 * Wrap a tool handler with timing + analytics.
 *
 * A handler that returns normally counts as a success. Tools that report failure
 * in their own payload instead of throwing (bulk_import_meals returns a
 * structured report rather than an error, so hosts don't drop the per-row
 * detail) must pass `options.outcome`, or their failures show up as successes in
 * tool_analytics.
 *
 * A thrown error becomes an isError result whose text comes from
 * userFacingError: a ToolError verbatim, anything else a category message plus
 * a ref that matches the `[analytics]` warn line.
 */
export async function withAnalytics<T>(
    toolName: string,
    handler: () => Promise<T>,
    context: AnalyticsContext,
    args?: Record<string, unknown>,
    options?: {
        outcome?: (result: T) => { success: boolean; errorCategory?: string };
        /** Where the analytics row goes; tool_analytics by default. A seam
         * for tests (src/log-privacy.test.ts), which must not reach Supabase. */
        persist?: (record: AnalyticsRecord) => void;
    },
): Promise<T> {
    const persist = options?.persist ?? persistAnalytics;
    const start = performance.now();
    const invokedAt = new Date().toISOString();
    const dateRangeDays = calculateDateRangeDays(
        args?.start_date as string | undefined,
        args?.end_date as string | undefined,
    );

    try {
        const result = await handler();
        const durationMs = Math.round(performance.now() - start);
        const outcome = options?.outcome?.(result) ?? { success: true };

        if (outcome.success) {
            console.log(
                analyticsLogLine(toolName, durationMs, { kind: "success" }),
            );
        } else {
            console.warn(
                analyticsLogLine(toolName, durationMs, {
                    kind: "reported-failure",
                    category: outcome.errorCategory ?? "unknown",
                }),
            );
        }

        persist({
            user_id: context.userId,
            tool_name: toolName,
            success: outcome.success,
            duration_ms: durationMs,
            error_category: outcome.success
                ? undefined
                : (outcome.errorCategory ?? "unknown"),
            date_range_days: dateRangeDays,
            mcp_session_id: context.sessionId,
            invoked_at: invokedAt,
            protocol_era: context.protocolEra,
            client_name: formatClientId(context.clientInfo?.()),
        });

        return result;
    } catch (error) {
        const durationMs = Math.round(performance.now() - start);
        const errorCategory = categorizeError(error);
        const ref = newErrorRef();

        // The raw message reaches neither tool_analytics (no column for it)
        // nor the model (userFacingError replaces it), so this line — joined
        // to the model's text by `ref` — is the only place it is diagnosable
        // from, for as long as the runtime log ring buffer retains it.
        // analyticsLogLine JSON-escapes and caps it; see there. A ToolError
        // that quotes the user's own text (item or saved-meal names) logs its
        // logText instead, which leaves the names out.
        console.warn(
            analyticsLogLine(toolName, durationMs, {
                kind: "error",
                category: errorCategory,
                ref,
                message: errorLogText(error),
            }),
        );

        persist({
            user_id: context.userId,
            tool_name: toolName,
            success: false,
            duration_ms: durationMs,
            error_category: errorCategory,
            date_range_days: dateRangeDays,
            mcp_session_id: context.sessionId,
            invoked_at: invokedAt,
            protocol_era: context.protocolEra,
            client_name: formatClientId(context.clientInfo?.()),
        });

        return {
            content: [
                {
                    type: "text",
                    text: userFacingError(toolName, error, errorCategory, ref),
                },
            ],
            isError: true,
        } as T;
    }
}

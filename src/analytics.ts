import { getSupabase } from "./supabase.js";

interface AnalyticsRecord {
    user_id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category?: string;
    date_range_days?: number;
    mcp_session_id?: string;
    invoked_at: string;
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
}

function categorizeError(error: unknown): string {
    const msg =
        error instanceof Error ? error.message.toLowerCase() : String(error);

    if (
        msg.includes("auth") ||
        msg.includes("token") ||
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
        msg.includes("supabase") ||
        msg.includes("failed to insert") ||
        msg.includes("failed to get") ||
        msg.includes("failed to delete") ||
        msg.includes("failed to update") ||
        msg.includes("failed to search")
    )
        return "supabase_error";
    if (
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("ECONNREFUSED")
    )
        return "network_error";

    return "unknown";
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
 */
export async function withAnalytics<T>(
    toolName: string,
    handler: () => Promise<T>,
    context: AnalyticsContext,
    args?: Record<string, unknown>,
    options?: {
        outcome?: (result: T) => { success: boolean; errorCategory?: string };
    },
): Promise<T> {
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
                `[analytics] ${toolName} success ${durationMs}ms user=${context.userId}`,
            );
        } else {
            console.warn(
                `[analytics] ${toolName} reported-failure=${outcome.errorCategory ?? "unknown"} ${durationMs}ms user=${context.userId}`,
            );
        }

        persistAnalytics({
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
        });

        return result;
    } catch (error) {
        const durationMs = Math.round(performance.now() - start);
        const errorCategory = categorizeError(error);

        console.warn(
            `[analytics] ${toolName} error=${errorCategory} ${durationMs}ms user=${context.userId}`,
        );

        persistAnalytics({
            user_id: context.userId,
            tool_name: toolName,
            success: false,
            duration_ms: durationMs,
            error_category: errorCategory,
            date_range_days: dateRangeDays,
            mcp_session_id: context.sessionId,
            invoked_at: invokedAt,
        });

        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        } as T;
    }
}

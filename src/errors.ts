// Imports nothing on purpose: tz.ts, units.ts and alcohol.ts import this, and
// keeping it dependency-free keeps them that way too. csv.ts and chunk.ts are
// inlined into widgets via @inlinets and must never import it.

/** An error whose message was written for the caller. withAnalytics returns a
 * ToolError's message verbatim and replaces every other error's text with a
 * category message plus a ref (policy 5.A). Never wrap third-party text. */
export class ToolError extends Error {
    override name = "ToolError";
    /** tool_analytics.error_category for this refusal, when it should be
     * counted on its own rather than bucketed by categorizeError's wording
     * heuristics (src/analytics.ts). */
    readonly category?: ToolErrorCategory;

    constructor(
        message: string,
        options?: ErrorOptions & { category?: ToolErrorCategory },
    ) {
        super(message, options);
        if (options?.category) this.category = options.category;
    }
}

/** Categories a ToolError may name explicitly. A closed list so a typo cannot
 * open a new tool_analytics bucket nobody queries. */
export type ToolErrorCategory =
    // log_meal / update_meal given sugar_g without added_sugar_g while the
    // ADDED_SUGAR_REQUIRED_FROM gate is on (src/added-sugar.ts).
    "added_sugar_missing";

/** Short id tying a sanitized error the model sees to the server-side log line
 *  that carries the raw text. Eight hex characters: enough to find one line in
 *  a day's log, too short to mean anything on its own. */
export function newErrorRef(): string {
    return crypto.randomUUID().slice(0, 8);
}

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
    /** Text for the runtime log in place of the message, for messages that
     * quote the user's own text (an item or saved-meal name): the caller sees
     * the message, the `[analytics]` log line gets this. The runtime log never
     * carries names, meal or item text (src/log-privacy.test.ts). */
    readonly logText?: string;

    constructor(
        message: string,
        options?: ErrorOptions & {
            category?: ToolErrorCategory;
            logText?: string;
        },
    ) {
        super(message, options);
        if (options?.category) this.category = options.category;
        if (options?.logText !== undefined) this.logText = options.logText;
    }
}

/** A ToolError whose message quotes the user's own text: `message` goes to the
 * caller, `logText` (the same refusal with the names left out) to the runtime
 * log. */
export function toolErrorWithUserText(
    message: string,
    logText: string,
    category?: ToolErrorCategory,
): ToolError {
    return new ToolError(message, { logText, category });
}

/** What the runtime log may say about a thrown error: a ToolError's logText
 * when it has one, otherwise the error's message. */
export function errorLogText(error: unknown): string {
    if (error instanceof ToolError && error.logText !== undefined)
        return error.logText;
    return error instanceof Error ? error.message : String(error);
}

/** Categories a ToolError may name explicitly. A closed list so a typo cannot
 * open a new tool_analytics bucket nobody queries. */
export type ToolErrorCategory =
    // log_meal / update_meal given sugar_g without added_sugar_g while the
    // ADDED_SUGAR_REQUIRED_FROM gate is on (src/added-sugar.ts).
    | "added_sugar_missing"
    // Ingredient lists and saved-meal item changes that cannot be applied
    // (src/meal-items.ts): wrong counts, partial fields, totals sent beside
    // items, item references that match nothing or several entries.
    | "meal_items_invalid"
    // A food_ref that cannot be used: a malformed id or amount, a basis that
    // does not match the stored record (servings for a per-100 g record), or a
    // meal-level food_ref beside items (src/provenance.ts).
    | "food_ref_invalid";

/** Short id tying a sanitized error the model sees to the server-side log line
 *  that carries the raw text. Eight hex characters: enough to find one line in
 *  a day's log, too short to mean anything on its own. */
export function newErrorRef(): string {
    return crypto.randomUUID().slice(0, 8);
}

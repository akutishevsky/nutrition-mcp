// Imports nothing on purpose: tz.ts, units.ts and alcohol.ts import this, and
// keeping it dependency-free keeps them that way too. csv.ts and chunk.ts are
// inlined into widgets via @inlinets and must never import it.

/** An error whose message was written for the caller. withAnalytics returns a
 * ToolError's message verbatim and replaces every other error's text with a
 * category message plus a ref (policy 5.A). Never wrap third-party text. */
export class ToolError extends Error {
    override name = "ToolError";
}

/** Short id tying a sanitized error the model sees to the server-side log line
 *  that carries the raw text. Eight hex characters: enough to find one line in
 *  a day's log, too short to mean anything on its own. */
export function newErrorRef(): string {
    return crypto.randomUUID().slice(0, 8);
}

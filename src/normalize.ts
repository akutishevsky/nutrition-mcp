// Defensive normalization for text that arrives already-escaped.
//
// Some MCP clients/models emit non-Latin scripts (Cyrillic, CJK, emoji, …) as
// *literal* escape-sequence text — e.g. the six characters `П` instead of
// the actual `П`. When that literal text survives JSON parsing it gets stored
// verbatim, so a meal description ends up reading `Domino's Пі...`
// rather than `Domino's Пі...`. The server can't control client encoding, so
// we decode any literal `\uXXXX`, `\u{…}`, and `\xXX` sequences before saving.

const UNICODE_CODEPOINT = /\\u\{([0-9a-fA-F]+)\}/g;
const UNICODE_UNIT = /\\u([0-9a-fA-F]{4})/g;
const HEX_BYTE = /\\x([0-9a-fA-F]{2})/g;

/**
 * Decode literal escape sequences in a string into their actual characters.
 *
 * Handles `\u{1f355}` (ES6 code point), `\uXXXX` (UTF-16 code unit — including
 * surrogate pairs, which concatenate correctly), and `\xXX` (single byte).
 * Strings without a backslash are returned untouched, and sequences that don't
 * match (e.g. a Windows path like `C:\users`) are left as-is.
 */
export function decodeEscapeSequences(input: string): string {
    if (!input.includes("\\")) return input;
    return input
        .replace(UNICODE_CODEPOINT, (match, hex) => {
            const code = parseInt(hex, 16);
            if (code > 0x10ffff) return match;
            return String.fromCodePoint(code);
        })
        .replace(UNICODE_UNIT, (_match, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
        )
        .replace(HEX_BYTE, (_match, hex) =>
            String.fromCharCode(parseInt(hex, 16)),
        );
}

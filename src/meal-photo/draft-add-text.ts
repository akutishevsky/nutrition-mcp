import { parseIngredientText } from "../recipe-import/parser.js";

/**
 * Deterministic text → item parsing for the photo draft's free-text
 * add field (Amendment E item 3: "Anything else to add?").
 *
 * REUSE, stated plainly: the quantity/unit/name extraction is the
 * repo's existing deterministic ingredient-line parser,
 * `parseIngredientText` in src/recipe-import/parser.ts — the same
 * parser the recipe-import flow uses on ingredient lines (fractions,
 * unicode fractions, ranges, common units). This module adds only the
 * conversational wrapper around it: stripping add phrasing ("I added
 * …", "plus …"), vague-quantity phrases ("a good bit of …") mapped to
 * STATED quantity assumptions, word numbers, replacement phrasing
 * ("actually brown rice, not white"), and a default-portion table for
 * quantity-less adds (a stated assumption, never a silent one).
 *
 * The other candidate parsers were investigated and do NOT fit:
 * `parseNaturalCookUpdate` (src/cooks/repository.ts) parses cook
 * EVENT sentences (preheat/wrap/rest), not food items; the structured
 * meal-log path (src/structured-log-meal.ts) accepts already-structured
 * items and does no text parsing at all.
 *
 * A `null` return means "the deterministic parser cannot resolve this
 * to a food item" — the caller then spends the Ember fallback
 * (draft-add-parse.ts), and if that also resolves nothing, the add
 * becomes a draft question or an honest no-add response, never a
 * silent add (see draft-add.ts).
 */

export interface ParsedDraftAddItem {
    name: string;
    quantity: number;
    unit: string;
    /** 0.95 when the user stated the quantity; 0.85 when the quantity
     * came from a stated assumption (vague phrase or default portion).
     * Both clear the grounding low-portion-confidence question band —
     * the assumption is SHOWN on the item instead of questioned. */
    portionConfidence: number;
    /** Quantity assumptions the user must see, e.g.
     * `"a good bit" interpreted as 1 tbsp`. */
    assumptions: string[];
    quantityAssumed: boolean;
    /** True when the parse carries an explicit quantity/unit signal or
     * a vague-quantity phrase; false for a bare food name with a
     * defaulted portion. Weak parses are held to a stricter grounding
     * bar by the caller (draft-add.ts). */
    strongSignal: boolean;
}

export type DeterministicDraftAddParse =
    | { kind: "add"; items: ParsedDraftAddItem[] }
    | { kind: "replace"; removeName: string; items: ParsedDraftAddItem[] }
    | { kind: "none" }
    | null;

const FILLER_TOKENS = new Set([
    "the",
    "a",
    "an",
    "some",
    "stuff",
    "thing",
    "things",
    "food",
    "more",
    "extra",
    "it",
    "that",
    "this",
    "on",
    "in",
    "with",
    "and",
    "my",
    "meal",
    "plate",
    "dish",
    "bit",
    "lot",
]);

/**
 * Default portions for quantity-less adds of common add-in foods.
 * First match wins; the generic fallback is 1 serving. Every use is
 * surfaced as an assumption on the item — never silent.
 */
const DEFAULT_PORTIONS: Array<{
    match: RegExp;
    quantity: number;
    unit: string;
}> = [
    {
        match: /\b(salt|pepper|seasoning|spice|spices|herbs?)\b/i,
        quantity: 1,
        unit: "tsp",
    },
    { match: /\b(butter|margarine|ghee)\b/i, quantity: 1, unit: "tbsp" },
    { match: /\b(oil|olive oil)\b/i, quantity: 1, unit: "tbsp" },
    {
        match: /\b(honey|syrup|jam|jelly|ketchup)\b/i,
        quantity: 1,
        unit: "tbsp",
    },
    { match: /\b(sugar)\b/i, quantity: 1, unit: "tbsp" },
    {
        match: /\b(mayo|mayonnaise|sauce|dressing|gravy|salsa|mustard)\b/i,
        quantity: 2,
        unit: "tbsp",
    },
    { match: /\b(milk|cream)\b/i, quantity: 0.25, unit: "cup" },
    { match: /\b(cheese)\b/i, quantity: 1, unit: "oz" },
];

export function defaultPortionFor(name: string): {
    quantity: number;
    unit: string;
} {
    // A compound dish ("mac and cheese") is a serving, not an add-in,
    // even when an ingredient word matches the table below.
    if (/\s+and\s+/i.test(name)) return { quantity: 1, unit: "serving" };
    for (const entry of DEFAULT_PORTIONS) {
        if (entry.match.test(name)) {
            return { quantity: entry.quantity, unit: entry.unit };
        }
    }
    return { quantity: 1, unit: "serving" };
}

interface VagueQuantity {
    pattern: RegExp;
    phrase: string;
    /** Multiplier over the food's default portion, or an absolute
     * quantity+unit when the phrase itself names the scale. */
    factor?: number;
    absolute?: { quantity: number; unit: string };
}

const VAGUE_QUANTITIES: VagueQuantity[] = [
    { pattern: /^a\s+good\s+bit\s+of\s+/i, phrase: "a good bit", factor: 1 },
    { pattern: /^a\s+lot\s+of\s+/i, phrase: "a lot", factor: 2 },
    { pattern: /^lots\s+of\s+/i, phrase: "lots", factor: 2 },
    {
        pattern: /^a\s+little\s+bit\s+of\s+/i,
        phrase: "a little bit",
        factor: 0.5,
    },
    { pattern: /^a\s+little\s+/i, phrase: "a little", factor: 0.5 },
    { pattern: /^a\s+bit\s+of\s+/i, phrase: "a bit", factor: 0.5 },
    { pattern: /^some\s+/i, phrase: "some", factor: 1 },
    {
        pattern: /^a\s+splash\s+of\s+/i,
        phrase: "a splash",
        absolute: { quantity: 1, unit: "tsp" },
    },
    {
        pattern: /^a\s+drizzle\s+of\s+/i,
        phrase: "a drizzle",
        absolute: { quantity: 2, unit: "tsp" },
    },
    {
        pattern: /^a\s+handful\s+of\s+/i,
        phrase: "a handful",
        absolute: { quantity: 1, unit: "serving" },
    },
    {
        pattern: /^a\s+couple\s+of\s+/i,
        phrase: "a couple",
        absolute: { quantity: 2, unit: "piece" },
    },
];

const WORD_NUMBERS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
};

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Strip conversational add phrasing from the front (and tail) of a
 * segment: "I added …", "plus …", "… too". */
function stripAddPhrasing(segment: string): string {
    let text = segment.trim();
    const prefixes = [
        /^i\s+(?:also\s+)?(?:added|put|used|had|included|threw\s+in|tossed\s+in)\s+/i,
        /^i\s+(?:also\s+)?(?:sprinkled|drizzled|poured|mixed\s+in)\s+/i,
        /^(?:please\s+)?(?:add|added|include|included|put|used)\s+/i,
        /^(?:also|and\s+also|plus|and|with)\s+/i,
        /^there\s+was\s+(?:also\s+)?/i,
        /^oh\s*,?\s+and\s+/i,
    ];
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of prefixes) {
            const next = text.replace(pattern, "").trim();
            if (next !== text) {
                text = next;
                changed = true;
            }
        }
    }
    return text
        .replace(/\s+(?:too|as\s+well)\s*$/i, "")
        .replace(/\s+on\s+(?:top|it|the\s+top)\s*$/i, "")
        .replace(/\s+(?:in\s+it|over\s+it|over\s+the\s+top)\s*$/i, "")
        .trim();
}

/** Convert a leading word quantity ("two eggs", "half a cup of rice",
 * "an egg") into the numeric form parseIngredientText understands. */
function normalizeLeadingQuantity(segment: string): string {
    let text = segment;
    text = text.replace(/^half\s+(?:an?\s+)?/i, "0.5 ");
    text = text.replace(/^quarter\s+(?:an?\s+)?/i, "0.25 ");
    const word = /^([a-z]+)\s+/.exec(text);
    if (word) {
        const value = WORD_NUMBERS[word[1]!.toLowerCase()];
        if (value !== undefined) {
            text = `${value} ${text.slice(word[0].length)}`;
        } else if (
            word[1]!.toLowerCase() === "a" ||
            word[1]!.toLowerCase() === "an"
        ) {
            text = `1 ${text.slice(word[0].length)}`;
        }
    }
    return text;
}

function cleanName(raw: string): string {
    return raw
        .replace(/^of\s+/i, "")
        .replace(/^(?:the|some)\s+/i, "")
        .replace(/[.!]+$/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);
}

/** Cooking-method words: a "name" made only of these is a preparation
 * statement ("grilled instead", "deep fried"), never a food — the
 * deterministic parser refuses it so the model fallback can interpret
 * it as a method correction (photo-flow P2). */
const METHOD_ONLY_TOKENS = new Set([
    "grilled",
    "fried",
    "deep",
    "baked",
    "steamed",
    "roasted",
    "boiled",
    "sauteed",
    "broiled",
    "poached",
    "raw",
    "smoked",
    "barbecued",
    "braised",
    "seared",
    "toasted",
    "microwaved",
    "instead",
    "style",
]);

function isPlausibleFoodName(name: string): boolean {
    if (name.length < 2 || name.length > 120) return false;
    if (!/[a-z]{2,}/i.test(name)) return false;
    const tokens = name
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(Boolean);
    if (tokens.length === 0) return false;
    // A name made only of filler ("some stuff", "the thing") is not a food.
    if (tokens.every((token) => FILLER_TOKENS.has(token))) return false;
    // A name made only of cooking-method words is a preparation
    // statement, not a food ("fried rice" still passes — "rice" is
    // not a method word).
    if (tokens.every((token) => METHOD_ONLY_TOKENS.has(token))) return false;
    return true;
}

/** Parse ONE segment (no list separators) into an item, or null. */
export function parseDraftAddSegment(
    rawSegment: string,
): ParsedDraftAddItem | null {
    let segment = stripAddPhrasing(rawSegment);
    if (!segment) return null;

    let vague: VagueQuantity | undefined;
    for (const candidate of VAGUE_QUANTITIES) {
        const match = candidate.pattern.exec(segment);
        if (match) {
            vague = candidate;
            segment = segment.slice(match[0].length).trim();
            break;
        }
    }

    const prepared = normalizeLeadingQuantity(segment)
        // "1 tbsp of butter" → "1 tbsp butter" so the ingredient
        // parser's name does not keep a leading "of".
        .replace(
            /^(.+?\b(?:tbsp|tsp|cups?|g|kg|oz|lbs?|ml|slices?|pieces?|cloves?|cans?|servings?))\s+of\s+/i,
            "$1 ",
        );
    const { ingredient } = parseIngredientText(prepared);
    const name = cleanName(ingredient.name);
    if (!isPlausibleFoodName(name)) return null;

    if (ingredient.quantity !== undefined && ingredient.quantity > 0) {
        return {
            name,
            quantity: round2(ingredient.quantity),
            unit: ingredient.unit ?? "serving",
            portionConfidence: 0.95,
            assumptions: [],
            quantityAssumed: false,
            strongSignal: true,
        };
    }
    if (ingredient.unit) {
        // "cup of rice" — a stated unit with an implied quantity of 1.
        return {
            name,
            quantity: 1,
            unit: ingredient.unit,
            portionConfidence: 0.85,
            assumptions: [
                `Quantity assumed: interpreted as 1 ${ingredient.unit}.`,
            ],
            quantityAssumed: true,
            strongSignal: true,
        };
    }
    if (vague) {
        const fallback = defaultPortionFor(name);
        const portion = vague.absolute ?? {
            quantity: round2(fallback.quantity * (vague.factor ?? 1)),
            unit: fallback.unit,
        };
        return {
            name,
            quantity: portion.quantity,
            unit: portion.unit,
            portionConfidence: 0.85,
            assumptions: [
                `Quantity assumed: "${vague.phrase}" interpreted as ${portion.quantity} ${portion.unit}.`,
            ],
            quantityAssumed: true,
            strongSignal: true,
        };
    }
    // Quantity-less add: a stated default-portion assumption, never a
    // silent one. A long prose segment with no quantity signal is not
    // an ingredient line — refuse it deterministically (the Ember
    // fallback gets its chance at those).
    const wordCount = name.split(/\s+/).length;
    if (wordCount > 3) return null;
    const portion = defaultPortionFor(name);
    return {
        name,
        quantity: portion.quantity,
        unit: portion.unit,
        portionConfidence: 0.85,
        assumptions: [
            `Quantity assumed: no amount stated, so ${portion.quantity} ${portion.unit} (default portion) was used.`,
        ],
        quantityAssumed: true,
        strongSignal: false,
    };
}

function foodNameOnly(raw: string): string {
    const stripped = stripAddPhrasing(raw);
    const { ingredient } = parseIngredientText(
        normalizeLeadingQuantity(stripped),
    );
    return cleanName(ingredient.name).toLowerCase();
}

export function parseDraftAddTextDeterministic(
    rawText: string,
): DeterministicDraftAddParse {
    const text = rawText.replace(/\s+/g, " ").trim().slice(0, 500);
    if (text.length < 2) return null;
    // A question is not an add statement.
    if (/\?\s*$/.test(text)) return null;
    if (
        /^(nothing|none|no|nope|that'?s\s+(?:it|all)|all\s+good)\.?$/i.test(
            text,
        )
    ) {
        return { kind: "none" };
    }

    // Replacement phrasing — implemented via the draft's existing
    // remove+add semantics by the caller (draft-add.ts).
    const swap =
        /^(?:swap|replace|change)\s+(.+?)\s+(?:for|with|to)\s+(.+)$/i.exec(
            text,
        );
    if (swap) {
        const items = splitAndParse(swap[2]!);
        const removeName = foodNameOnly(swap[1]!);
        return items && removeName
            ? { kind: "replace", removeName, items }
            : null;
    }
    // "actually X, not Y" — add X, remove Y.
    const actuallyNot = /^actually[:,]?\s+(.+?)(?:,)?\s+not\s+(.+)$/i.exec(
        text,
    );
    if (actuallyNot) {
        const items = splitAndParse(actuallyNot[1]!);
        const removeName = foodNameOnly(actuallyNot[2]!);
        return items && removeName
            ? { kind: "replace", removeName, items }
            : null;
    }
    // "X instead of Y" / "X rather than Y" — add X, remove Y.
    const insteadOf = /^(.+?)\s+(?:instead\s+of|rather\s+than)\s+(.+)$/i.exec(
        text,
    );
    if (insteadOf) {
        const items = splitAndParse(insteadOf[1]!);
        const removeName = foodNameOnly(insteadOf[2]!);
        return items && removeName
            ? { kind: "replace", removeName, items }
            : null;
    }
    if (/^(?:actually)\b/i.test(text)) {
        // "actually, I added …" is an add, not a replacement.
        const items = splitAndParse(text.replace(/^actually[:,]?\s+/i, ""));
        return items ? { kind: "add", items } : null;
    }

    const items = splitAndParse(text);
    return items ? { kind: "add", items } : null;
}

/** Dish names that contain "and" but are ONE food. */
const COMPOUND_FOODS = new Set([
    "mac and cheese",
    "salt and pepper",
    "peanut butter and jelly",
    "fish and chips",
    "bread and butter",
    "rice and beans",
    "biscuits and gravy",
]);

function splitAndParse(text: string): ParsedDraftAddItem[] | null {
    if (COMPOUND_FOODS.has(stripAddPhrasing(text).toLowerCase())) {
        const single = parseDraftAddSegment(text);
        return single ? [single] : null;
    }
    const segments = text
        .split(/\s*;\s*|\s*,\s*(?:and\s+)?/)
        .flatMap((part) => part.split(/\s+and\s+/i))
        .map((part) => part.trim())
        .filter(Boolean);
    if (segments.length === 0 || segments.length > 5) return null;
    // "mac and cheese" style compounds: if splitting on "and" produced
    // fragments that do not parse, fall back to the unsplit segment.
    const items: ParsedDraftAddItem[] = [];
    for (const segment of segments) {
        const item = parseDraftAddSegment(segment);
        if (!item) {
            if (segments.length > 1) {
                const whole = parseDraftAddSegment(text);
                return whole ? [whole] : null;
            }
            return null;
        }
        items.push(item);
    }
    return items;
}

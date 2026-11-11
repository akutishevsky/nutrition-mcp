import { nutrientCompleteness } from "./nutrients.js";
import type { FoodCandidate, FoodSearchInput } from "./types.js";

export function normalizeFoodText(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function tokenOverlap(query: string, value: string): number {
    const queryTokens = new Set(
        normalizeFoodText(query).split(" ").filter(Boolean),
    );
    const valueTokens = new Set(
        normalizeFoodText(value).split(" ").filter(Boolean),
    );
    if (queryTokens.size === 0) return 0;
    let matches = 0;
    for (const token of queryTokens) {
        if (valueTokens.has(token)) matches += 1;
    }
    return matches / queryTokens.size;
}

export function candidateIdentity(candidate: FoodCandidate): string {
    if (candidate.barcode) return `barcode:${candidate.barcode}`;
    return [
        normalizeFoodText(candidate.brand ?? ""),
        normalizeFoodText(candidate.name),
        candidate.dataKind,
    ].join("|");
}

export function deduplicateCandidates(
    candidates: FoodCandidate[],
): FoodCandidate[] {
    const best = new Map<string, FoodCandidate>();
    for (const candidate of candidates) {
        const key = candidateIdentity(candidate);
        const existing = best.get(key);
        if (!existing || candidate.confidence > existing.confidence) {
            best.set(key, candidate);
        }
    }
    return [...best.values()];
}

export function scoreCandidate(
    input: Pick<FoodSearchInput, "query">,
    candidate: FoodCandidate,
): number {
    const query = normalizeFoodText(input.query);
    const name = normalizeFoodText(candidate.name);
    const exactName = query !== "" && query === name ? 1 : 0;
    const exactBrandAndName =
        query !== "" &&
        query ===
            normalizeFoodText(`${candidate.brand ?? ""} ${candidate.name}`)
            ? 1
            : 0;
    const overlap = Math.max(
        tokenOverlap(query, candidate.name),
        tokenOverlap(query, `${candidate.brand ?? ""} ${candidate.name}`),
    );
    const portionQuality = candidate.portions.length > 0 ? 1 : 0;
    const nutrients =
        candidate.portions[0]?.nutrients ?? candidate.nutrientsPer100g ?? {};
    const completeness = nutrientCompleteness(nutrients);
    const providerPreference = candidate.provider === "usda" ? 0.02 : 0;

    return (
        exactBrandAndName * 0.25 +
        exactName * 0.2 +
        overlap * 0.25 +
        candidate.confidence * 0.2 +
        completeness * 0.07 +
        portionQuality * 0.01 +
        providerPreference
    );
}

/**
 * Minimum query-token overlap for a candidate to count as genuinely
 * matching the query (exact name / exact brand+name matches always
 * pass). This is the relevance gate for completeness-dominant ranking:
 * candidates below it are never removed, they only sort after every
 * gated-in candidate.
 */
export const RELEVANCE_TOKEN_OVERLAP_THRESHOLD = 0.5;

export function passesRelevanceGate(
    input: Pick<FoodSearchInput, "query">,
    candidate: FoodCandidate,
): boolean {
    const query = normalizeFoodText(input.query);
    if (query === "") return false;
    const name = normalizeFoodText(candidate.name);
    if (query === name) return true;
    if (
        query ===
        normalizeFoodText(`${candidate.brand ?? ""} ${candidate.name}`)
    ) {
        return true;
    }
    const overlap = Math.max(
        tokenOverlap(query, candidate.name),
        tokenOverlap(query, `${candidate.brand ?? ""} ${candidate.name}`),
    );
    return overlap >= RELEVANCE_TOKEN_OVERLAP_THRESHOLD;
}

/**
 * Depth of the nutrient panel a candidate carries: the richest panel
 * among its per-100 g values and its portions (portion panels are the
 * same facts at a serving scale, so the max is the entry's true depth).
 */
export function candidateCompleteness(candidate: FoodCandidate): number {
    let best = candidate.nutrientsPer100g
        ? nutrientCompleteness(candidate.nutrientsPer100g)
        : 0;
    for (const portion of candidate.portions) {
        best = Math.max(best, nutrientCompleteness(portion.nutrients));
    }
    return best;
}

/**
 * Completeness-dominant ranking (brief: search ranking + portion
 * picker, item 1). Ordering only — no candidate is ever removed:
 * 1. relevance gate (passesRelevanceGate): gated-in candidates sort
 *    strictly before gated-out ones;
 * 2. nutrient completeness, descending — the dominant signal;
 * 3. the pre-existing weighted relevance score as tiebreaker
 *    (exact name, token overlap, confidence, portion quality);
 * 4. original order, so equal candidates keep a stable order.
 */
export function rankCandidates(
    input: Pick<FoodSearchInput, "query">,
    candidates: FoodCandidate[],
): FoodCandidate[] {
    return deduplicateCandidates(candidates)
        .map((candidate, index) => ({
            candidate,
            index,
            gated: passesRelevanceGate(input, candidate),
            completeness: candidateCompleteness(candidate),
            score: scoreCandidate(input, candidate),
        }))
        .sort(
            (a, b) =>
                Number(b.gated) - Number(a.gated) ||
                b.completeness - a.completeness ||
                b.score - a.score ||
                a.index - b.index,
        )
        .map(({ candidate }) => candidate);
}

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
    const brand = normalizeFoodText(candidate.brand ?? "");
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

export function rankCandidates(
    input: Pick<FoodSearchInput, "query">,
    candidates: FoodCandidate[],
): FoodCandidate[] {
    return deduplicateCandidates(candidates)
        .map((candidate, index) => ({
            candidate,
            index,
            score: scoreCandidate(input, candidate),
        }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ candidate }) => candidate);
}

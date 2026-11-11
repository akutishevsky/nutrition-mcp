import { sortPortionsNaturalFirst } from "../food-providers/portions.js";
import {
    encodeFoodCandidateId,
    getFoodSearchService,
} from "../food-providers/service.js";
import type { FoodCandidate } from "../food-providers/types.js";
import { aggregateStructuredMealItems } from "../structured-meals/repository.js";
import type {
    MealSourceType,
    StructuredMealItemInput,
} from "../structured-meals/types.js";
import type { NutrientValues } from "../food-providers/types.js";
import type { MealDraft, MealDraftSourceMode } from "../meal-drafts/types.js";

const DRAFT_SOURCE_MODES = [
    "text",
    "photo",
    "barcode",
    "restaurant",
    "saved_food",
    "history",
] as const satisfies readonly MealDraftSourceMode[];

const NUTRIENT_KEYS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "sodium_mg",
    "saturated_fat_g",
    "cholesterol_mg",
    "potassium_mg",
] as const satisfies readonly (keyof NutrientValues)[];

const SOURCE_TYPES = [
    "usda",
    "open_food_facts",
    "published_restaurant",
    "saved_food",
    "past_meal",
    "user_supplied",
    "model_estimate",
    "legacy_aggregate",
] as const satisfies readonly MealSourceType[];

function record(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
    return value as Record<string, unknown>;
}

function draftSourceMode(value: unknown): MealDraftSourceMode {
    if (
        typeof value === "string" &&
        (DRAFT_SOURCE_MODES as readonly string[]).includes(value)
    ) {
        return value as MealDraftSourceMode;
    }
    throw new Error("Meal draft source mode is invalid");
}

function draftMealType(
    value: unknown,
): NonNullable<MealDraft["mealType"]> | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    if (
        value === "breakfast" ||
        value === "lunch" ||
        value === "dinner" ||
        value === "snack"
    ) {
        return value;
    }
    throw new Error("Meal draft meal type is invalid");
}

function optionalText(
    value: unknown,
    label: string,
    maxLength: number,
): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string" || value.trim().length > maxLength) {
        throw new Error(`${label} is invalid`);
    }
    return value.trim() || undefined;
}

export function mealDraftInputFromBody(value: unknown): {
    sourceMode: MealDraftSourceMode;
    mealType?: NonNullable<MealDraft["mealType"]>;
    description?: string;
    loggedAt?: string;
    notes?: string;
} {
    const body = record(value, "Meal draft");
    return {
        sourceMode:
            body.source_mode === undefined
                ? "text"
                : draftSourceMode(body.source_mode),
        mealType: draftMealType(body.meal_type),
        description: optionalText(
            body.description,
            "Meal draft description",
            2_000,
        ),
        loggedAt: optionalText(body.logged_at, "Meal draft logged_at", 100),
        notes: optionalText(body.notes, "Meal draft notes", 4_000),
    };
}

function optionalPositiveNumber(
    value: unknown,
    label: string,
): number | undefined {
    if (value === undefined || value === null || value === "") {
        return undefined;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${label} must be positive`);
    }
    return parsed;
}

function sourceType(value: unknown): MealSourceType {
    if (value === undefined || value === null || value === "") {
        return "user_supplied";
    }
    if (
        typeof value === "string" &&
        (SOURCE_TYPES as readonly string[]).includes(value)
    ) {
        return value as MealSourceType;
    }
    throw new Error("Draft item source type is invalid");
}

function nutrients(value: unknown): NutrientValues {
    const input =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
    const result: NutrientValues = {};
    for (const key of NUTRIENT_KEYS) {
        if (
            input[key] === undefined ||
            input[key] === null ||
            input[key] === ""
        ) {
            continue;
        }
        const parsed = Number(input[key]);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new Error(`${key} must be finite and nonnegative`);
        }
        result[key] = parsed;
    }
    return result;
}

function assumptions(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) throw new Error("Draft assumptions are invalid");
    return value
        .map((item) => {
            if (typeof item !== "string" || item.trim().length > 500) {
                throw new Error("Draft assumptions are invalid");
            }
            return item.trim();
        })
        .filter(Boolean)
        .slice(0, 20);
}

export function draftItemInputFromBody(
    value: unknown,
): StructuredMealItemInput {
    const body = record(value, "Draft item");
    const name = optionalText(body.name, "Draft item name", 500);
    if (!name) throw new Error("Draft item name is required");
    const confidence =
        body.confidence === undefined ||
        body.confidence === null ||
        body.confidence === ""
            ? undefined
            : Number(body.confidence);
    if (
        confidence !== undefined &&
        (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    ) {
        throw new Error("Draft item confidence must be between 0 and 1");
    }
    const snapshot =
        body.source_snapshot &&
        typeof body.source_snapshot === "object" &&
        !Array.isArray(body.source_snapshot)
            ? (body.source_snapshot as Record<string, unknown>)
            : {};
    const gramWeight = optionalPositiveNumber(
        body.gram_weight ?? body.gramWeight,
        "Draft item gram weight",
    );
    const sourceUrl = optionalText(
        body.source_url ?? body.sourceUrl,
        "Draft item source URL",
        2_000,
    );
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
        throw new Error("Draft item source URL must use http or https");
    }
    return {
        name,
        quantity: optionalPositiveNumber(body.quantity, "Draft item quantity"),
        portionLabel: optionalText(
            body.portion_label ?? body.portionLabel,
            "Draft item portion",
            500,
        ),
        gramWeight,
        nutrients: nutrients(body.nutrients),
        sourceType: sourceType(body.source_type ?? body.sourceType),
        provider: optionalText(body.provider, "Draft item provider", 100),
        providerFoodId: optionalText(
            body.provider_food_id ?? body.providerFoodId,
            "Draft item provider food ID",
            255,
        ),
        providerRevision: optionalText(
            body.provider_revision ?? body.providerRevision,
            "Draft item provider revision",
            255,
        ),
        sourceUrl,
        sourceUpdatedAt: optionalText(
            body.source_updated_at ?? body.sourceUpdatedAt,
            "Draft item source date",
            100,
        ),
        confidence,
        assumptions: assumptions(body.assumptions),
        sourceSnapshot: snapshot,
    };
}

export interface DraftItemPortionOption {
    id: string;
    amount: number;
    unit: string;
    label: string;
    gram_weight: number | null;
    nutrients: NutrientValues;
}

export function serializeMealDraftForApp(draft: MealDraft) {
    const items = draft.items.map((record) => ({
        id: record.id,
        position: record.position,
        name: record.item.name,
        quantity: record.item.quantity ?? null,
        portion_label: record.item.portionLabel ?? null,
        gram_weight: record.item.gramWeight ?? null,
        nutrients: record.item.nutrients,
        candidate_id: null as string | null,
        portions: [] as DraftItemPortionOption[],
        source_type: record.item.sourceType,
        provider: record.item.provider ?? null,
        provider_food_id: record.item.providerFoodId ?? null,
        provider_revision: record.item.providerRevision ?? null,
        source_url: record.item.sourceUrl ?? null,
        source_updated_at: record.item.sourceUpdatedAt ?? null,
        confidence: record.item.confidence ?? null,
        assumptions: record.item.assumptions ?? [],
        source_snapshot: record.item.sourceSnapshot ?? {},
    }));
    const openQuestions = draft.questions.filter(
        (question) => question.status === "open",
    );
    return {
        id: draft.id,
        status: draft.status,
        source_mode: draft.sourceMode,
        meal_type: draft.mealType,
        description: draft.description,
        logged_at: draft.loggedAt,
        notes: draft.notes,
        version: draft.version,
        expires_at: draft.expiresAt,
        confirmed_meal_id: draft.confirmedMealId,
        created_at: draft.createdAt,
        updated_at: draft.updatedAt,
        items,
        totals: aggregateStructuredMealItems(
            draft.items.map((record) => record.item),
        ),
        assumptions: [...new Set(items.flatMap((item) => item.assumptions))],
        questions: draft.questions.map((question) => ({
            id: question.id,
            item_id: question.itemId,
            question_key: question.questionKey,
            prompt: question.prompt,
            impact_score: question.impactScore,
            status: question.status,
            answer: question.answer,
        })),
        next_question: openQuestions[0]
            ? {
                  id: openQuestions[0].id,
                  question_key: openQuestions[0].questionKey,
                  prompt: openQuestions[0].prompt,
                  impact_score: openQuestions[0].impactScore,
              }
            : null,
        ready_for_confirmation:
            draft.status === "awaiting_confirmation" &&
            openQuestions.length === 0 &&
            draft.items.length > 0,
    };
}

function draftItemCandidateId(
    item: MealDraft["items"][number]["item"],
): string | null {
    const snapshot = item.sourceSnapshot ?? {};
    const fromSnapshot = snapshot.candidate_id;
    if (typeof fromSnapshot === "string" && fromSnapshot.includes(":")) {
        return fromSnapshot;
    }
    if (
        (item.provider === "usda" || item.provider === "open_food_facts") &&
        item.providerFoodId
    ) {
        return encodeFoodCandidateId({
            provider: item.provider,
            providerFoodId: item.providerFoodId,
        });
    }
    return null;
}

/**
 * Enrich a serialized draft with each item's provider portions
 * (natural-first), so the draft item editor can offer a real portion
 * picker instead of free text. Items that do not resolve to a provider
 * candidate — manual foods, past-meal snapshots, lookup failures —
 * keep an empty portions list and the editor keeps its free-text
 * portion field for them. Lookup failures are swallowed per item: a
 * draft must always render.
 */
export async function enrichMealDraftForApp(
    draft: MealDraft,
    lookup: (candidateId: string) => Promise<FoodCandidate | null> = (
        candidateId,
    ) => getFoodSearchService().details(candidateId),
): Promise<ReturnType<typeof serializeMealDraftForApp>> {
    const serialized = serializeMealDraftForApp(draft);
    await Promise.all(
        serialized.items.map(async (item, index) => {
            const record = draft.items[index];
            if (!record) return;
            const candidateId = draftItemCandidateId(record.item);
            if (!candidateId) return;
            try {
                const candidate = await lookup(candidateId);
                if (!candidate) return;
                item.candidate_id = candidateId;
                item.portions = sortPortionsNaturalFirst(
                    candidate.portions,
                ).map((portion) => ({
                    id: portion.id,
                    amount: portion.amount,
                    unit: portion.unit,
                    label: portion.label,
                    gram_weight: portion.gramWeight ?? null,
                    nutrients: portion.nutrients,
                }));
            } catch {
                // Portion enrichment is best-effort; the free-text
                // editor remains available for this item.
            }
        }),
    );
    return serialized;
}

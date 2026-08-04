import type { NutrientValues } from "../food-providers/types.js";
import {
    withUserDatabase,
    type DatabaseTransaction,
} from "../platform/database.js";
import { aggregateStructuredMealItems } from "../structured-meals/repository.js";
import type { StructuredMealItemInput } from "../structured-meals/types.js";
import type {
    MealDraft,
    MealDraftItem,
    MealDraftQuestion,
    MealDraftSourceMode,
} from "./types.js";

const ACTIVE_STATUSES = [
    "open",
    "awaiting_answers",
    "awaiting_confirmation",
] as const;

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function validateDraftItem(
    item: StructuredMealItemInput,
): StructuredMealItemInput {
    const name = item.name?.trim();
    if (!name || name.length > 500) {
        throw new Error(
            "Draft item name is required and must be at most 500 characters",
        );
    }
    if (
        item.quantity !== undefined &&
        (!Number.isFinite(item.quantity) || item.quantity <= 0)
    ) {
        throw new Error("Draft item quantity must be positive");
    }
    if (
        item.gramWeight !== undefined &&
        (!Number.isFinite(item.gramWeight) || item.gramWeight <= 0)
    ) {
        throw new Error("Draft item gram weight must be positive");
    }
    if (
        item.confidence !== undefined &&
        (!Number.isFinite(item.confidence) ||
            item.confidence < 0 ||
            item.confidence > 1)
    ) {
        throw new Error("Draft item confidence must be between 0 and 1");
    }
    const assumptions = (item.assumptions ?? []).map((value) => value.trim());
    if (
        assumptions.length > 20 ||
        assumptions.some((value) => !value || value.length > 500)
    ) {
        throw new Error("Draft item assumptions exceed limits");
    }
    const nutrients: NutrientValues = {};
    for (const [key, value] of Object.entries(item.nutrients ?? {}) as Array<
        [keyof NutrientValues, number]
    >) {
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(
                `Draft item nutrient ${key} must be finite and nonnegative`,
            );
        }
        nutrients[key] = Math.round(value * 100) / 100;
    }
    const sourceSnapshot = item.sourceSnapshot ?? {};
    if (JSON.stringify(sourceSnapshot).length > 50_000) {
        throw new Error("Draft item source snapshot is too large");
    }
    return {
        ...item,
        name,
        portionLabel: item.portionLabel?.trim() || undefined,
        assumptions,
        nutrients,
        sourceSnapshot,
    };
}

function rowDate(value: unknown): string {
    return new Date(String(value)).toISOString();
}

function itemFromRow(row: Record<string, unknown>): MealDraftItem {
    const payload = row.item_payload;
    if (!payload || typeof payload !== "object") {
        throw new Error("Draft item payload is invalid");
    }
    return {
        id: String(row.id),
        position: Number(row.position),
        item: payload as StructuredMealItemInput,
        createdAt: rowDate(row.created_at),
        updatedAt: rowDate(row.updated_at),
    };
}

function questionFromRow(row: Record<string, unknown>): MealDraftQuestion {
    return {
        id: String(row.id),
        itemId: row.item_id == null ? null : String(row.item_id),
        questionKey: String(row.question_key),
        prompt: String(row.prompt),
        impactScore: Number(row.impact_score),
        status: row.status as MealDraftQuestion["status"],
        answer: row.answer == null ? null : String(row.answer),
        createdAt: rowDate(row.created_at),
        answeredAt: row.answered_at == null ? null : rowDate(row.answered_at),
    };
}

async function loadDraft(
    tx: DatabaseTransaction,
    draftId: string,
    lock = false,
): Promise<MealDraft | null> {
    const draftRows = lock
        ? await tx<Array<Record<string, unknown>>>`
              select * from munch.meal_drafts
              where id = ${draftId}
              for update
          `
        : await tx<Array<Record<string, unknown>>>`
              select * from munch.meal_drafts
              where id = ${draftId}
          `;
    const row = draftRows[0];
    if (!row) return null;
    const [itemRows, questionRows] = await Promise.all([
        tx<Array<Record<string, unknown>>>`
            select * from munch.meal_draft_items
            where draft_id = ${draftId}
            order by position
        `,
        tx<Array<Record<string, unknown>>>`
            select * from munch.meal_draft_questions
            where draft_id = ${draftId}
            order by
                case when status = 'open' then 0 else 1 end,
                impact_score desc,
                created_at
        `,
    ]);
    return {
        id: String(row.id),
        userId: String(row.user_id),
        status: row.status as MealDraft["status"],
        sourceMode: row.source_mode as MealDraftSourceMode,
        mealType:
            row.meal_type == null
                ? null
                : (String(row.meal_type) as MealDraft["mealType"]),
        description: row.description == null ? null : String(row.description),
        loggedAt: row.logged_at == null ? null : rowDate(row.logged_at),
        notes: row.notes == null ? null : String(row.notes),
        version: Number(row.version),
        expiresAt: rowDate(row.expires_at),
        confirmedMealId:
            row.confirmed_meal_id == null
                ? null
                : String(row.confirmed_meal_id),
        createdAt: rowDate(row.created_at),
        updatedAt: rowDate(row.updated_at),
        items: itemRows.map(itemFromRow),
        questions: questionRows.map(questionFromRow),
    };
}

function assertEditable(draft: MealDraft): void {
    if (
        !ACTIVE_STATUSES.includes(
            draft.status as (typeof ACTIVE_STATUSES)[number],
        )
    ) {
        throw new Error(`Meal draft is ${draft.status} and cannot be edited`);
    }
    if (new Date(draft.expiresAt) <= new Date()) {
        throw new Error("Meal draft has expired");
    }
}

function assertVersion(draft: MealDraft, expectedVersion: number): void {
    if (draft.version !== expectedVersion) {
        throw new Error(
            `Meal draft changed: expected version ${expectedVersion}, current version ${draft.version}`,
        );
    }
}

async function refreshStatus(
    tx: DatabaseTransaction,
    draftId: string,
): Promise<void> {
    const rows = await tx<Array<{ open_count: number; item_count: number }>>`
        select
            (select count(*)::integer from munch.meal_draft_questions
             where draft_id = ${draftId} and status = 'open') as open_count,
            (select count(*)::integer from munch.meal_draft_items
             where draft_id = ${draftId}) as item_count
    `;
    const counts = rows[0] ?? { open_count: 0, item_count: 0 };
    const status =
        counts.open_count > 0
            ? "awaiting_answers"
            : counts.item_count > 0
              ? "awaiting_confirmation"
              : "open";
    await tx`
        update munch.meal_drafts
        set status = ${status}, updated_at = now()
        where id = ${draftId}
          and status in ('open', 'awaiting_answers', 'awaiting_confirmation')
    `;
}

export async function createMealDraft(input: {
    userId: string;
    sourceMode: MealDraftSourceMode;
    mealType?: MealDraft["mealType"];
    description?: string;
    loggedAt?: string;
    notes?: string;
    expiresInHours?: number;
}): Promise<MealDraft> {
    const expiresInHours = Math.max(
        1,
        Math.min(72, input.expiresInHours ?? 24),
    );
    const loggedAt = input.loggedAt ? new Date(input.loggedAt) : null;
    if (loggedAt && !Number.isFinite(loggedAt.getTime())) {
        throw new Error("Draft loggedAt is invalid");
    }
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            insert into munch.meal_drafts (
                user_id,
                source_mode,
                meal_type,
                description,
                logged_at,
                notes,
                expires_at
            ) values (
                ${input.userId},
                ${input.sourceMode},
                ${input.mealType ?? null},
                ${input.description?.trim() || null},
                ${loggedAt},
                ${input.notes?.trim() || null},
                now() + (${expiresInHours}::text || ' hours')::interval
            )
            returning id
        `;
        const draft = await loadDraft(tx, rows[0]!.id);
        if (!draft) throw new Error("Created draft could not be loaded");
        return draft;
    });
}

export async function getMealDraft(
    userId: string,
    draftId: string,
): Promise<MealDraft | null> {
    if (!isUuid(draftId)) return null;
    return withUserDatabase(userId, (tx) => loadDraft(tx, draftId));
}

export async function updateMealDraftMetadata(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    mealType?: MealDraft["mealType"];
    description?: string | null;
    loggedAt?: string | null;
    notes?: string | null;
}): Promise<MealDraft> {
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        const loggedAt =
            input.loggedAt === undefined || input.loggedAt === null
                ? input.loggedAt
                : new Date(input.loggedAt);
        if (loggedAt instanceof Date && !Number.isFinite(loggedAt.getTime())) {
            throw new Error("Draft loggedAt is invalid");
        }
        await tx`
            update munch.meal_drafts
            set meal_type = case when ${input.mealType !== undefined} then ${input.mealType ?? null} else meal_type end,
                description = case when ${input.description !== undefined} then ${input.description?.trim() || null} else description end,
                logged_at = case when ${input.loggedAt !== undefined} then ${loggedAt} else logged_at end,
                notes = case when ${input.notes !== undefined} then ${input.notes?.trim() || null} else notes end,
                version = version + 1,
                updated_at = now()
            where id = ${input.draftId}
        `;
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function upsertMealDraftItem(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    position: number;
    item: StructuredMealItemInput;
}): Promise<MealDraft> {
    if (
        !Number.isInteger(input.position) ||
        input.position < 0 ||
        input.position > 99
    ) {
        throw new Error("Draft item position must be an integer from 0 to 99");
    }
    const item = validateDraftItem(input.item);
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        await tx`
            insert into munch.meal_draft_items (
                draft_id, user_id, position, item_payload
            ) values (
                ${input.draftId}, ${input.userId}, ${input.position},
                ${item}::jsonb
            )
            on conflict (draft_id, position) do update
            set item_payload = excluded.item_payload,
                updated_at = now()
        `;
        await tx`
            update munch.meal_drafts
            set version = version + 1, updated_at = now()
            where id = ${input.draftId}
        `;
        await refreshStatus(tx, input.draftId);
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function addMealDraftQuestion(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    questionKey: string;
    prompt: string;
    impactScore?: number;
    itemId?: string;
}): Promise<MealDraft> {
    const key = input.questionKey.trim();
    const prompt = input.prompt.trim();
    const score = input.impactScore ?? 50;
    if (!key || key.length > 200 || !prompt || prompt.length > 1_000) {
        throw new Error("Draft question key or prompt is invalid");
    }
    if (!Number.isInteger(score) || score < 0 || score > 100) {
        throw new Error("Draft question impact score must be 0 to 100");
    }
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        if (
            input.itemId &&
            !draft.items.some((item) => item.id === input.itemId)
        ) {
            throw new Error(
                "Draft question item does not belong to this draft",
            );
        }
        await tx`
            insert into munch.meal_draft_questions (
                draft_id, user_id, item_id, question_key, prompt, impact_score
            ) values (
                ${input.draftId}, ${input.userId}, ${input.itemId ?? null},
                ${key}, ${prompt}, ${score}
            )
            on conflict (draft_id, question_key) do update
            set item_id = excluded.item_id,
                prompt = excluded.prompt,
                impact_score = excluded.impact_score,
                status = 'open',
                answer = null,
                answered_at = null
        `;
        await tx`
            update munch.meal_drafts
            set version = version + 1, updated_at = now()
            where id = ${input.draftId}
        `;
        await refreshStatus(tx, input.draftId);
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function answerMealDraftQuestion(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    questionId: string;
    answer: string;
}): Promise<MealDraft> {
    const answer = input.answer.trim();
    if (!answer || answer.length > 2_000) {
        throw new Error("Draft answer is invalid");
    }
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        const rows = await tx<Array<{ id: string }>>`
            update munch.meal_draft_questions
            set status = 'answered', answer = ${answer}, answered_at = now()
            where id = ${input.questionId}
              and draft_id = ${input.draftId}
              and status = 'open'
            returning id
        `;
        if (rows.length === 0) throw new Error("Open draft question not found");
        await tx`
            update munch.meal_drafts
            set version = version + 1, updated_at = now()
            where id = ${input.draftId}
        `;
        await refreshStatus(tx, input.draftId);
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function prepareMealDraftConfirmation(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    acceptRemainingAssumptions?: boolean;
}): Promise<MealDraft> {
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        const openQuestions = draft.questions.filter(
            (question) => question.status === "open",
        );
        if (openQuestions.length > 0 && !input.acceptRemainingAssumptions) {
            throw new Error(
                `Meal draft has ${openQuestions.length} unresolved question(s)`,
            );
        }
        if (openQuestions.length > 0) {
            await tx`
                update munch.meal_draft_questions
                set status = 'accepted_assumption',
                    answer = 'User accepted unresolved assumption: ' || prompt,
                    answered_at = now()
                where draft_id = ${input.draftId}
                  and status = 'open'
            `;
        }
        if (draft.items.length === 0) {
            throw new Error("Meal draft has no items");
        }
        await tx`
            update munch.meal_drafts
            set status = 'awaiting_confirmation',
                version = version + 1,
                updated_at = now()
            where id = ${input.draftId}
        `;
        return (await loadDraft(tx, input.draftId))!;
    });
}

async function insertConfirmedMeal(
    tx: DatabaseTransaction,
    draft: MealDraft,
): Promise<string> {
    if (!draft.mealType || !draft.description?.trim()) {
        throw new Error(
            "Meal type and description are required before confirmation",
        );
    }
    const acceptedByItem = new Map<string, string[]>();
    const globalAssumptions: string[] = [];
    for (const question of draft.questions) {
        if (question.status !== "accepted_assumption" || !question.answer)
            continue;
        if (question.itemId) {
            const list = acceptedByItem.get(question.itemId) ?? [];
            list.push(question.answer);
            acceptedByItem.set(question.itemId, list);
        } else {
            globalAssumptions.push(question.answer);
        }
    }
    const items = draft.items.map((record) => ({
        ...validateDraftItem(record.item),
        assumptions: [
            ...(record.item.assumptions ?? []),
            ...(acceptedByItem.get(record.id) ?? []),
            ...globalAssumptions,
        ],
    }));
    const totals = aggregateStructuredMealItems(items);
    const idempotencyKey = `draft:${draft.id}`;
    await tx`select pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;
    const mealRows = await tx<Array<{ id: string }>>`
        insert into munch.meals (
            user_id, logged_at, meal_type, description,
            calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
            notes, idempotency_key
        ) values (
            ${draft.userId}, ${draft.loggedAt ? new Date(draft.loggedAt) : new Date()},
            ${draft.mealType}, ${draft.description.trim()},
            ${totals.calories === undefined ? null : Math.round(totals.calories)},
            ${totals.protein_g ?? null}, ${totals.carbs_g ?? null},
            ${totals.fat_g ?? null}, ${totals.fiber_g ?? null},
            ${totals.sugar_g ?? null}, ${totals.alcohol_g ?? null},
            ${draft.notes ?? null}, ${idempotencyKey}
        )
        on conflict (user_id, idempotency_key)
            where idempotency_key is not null
        do nothing
        returning id
    `;
    let mealId = mealRows[0]?.id;
    if (!mealId) {
        const existing = await tx<Array<{ id: string }>>`
            select id from munch.meals
            where user_id = ${draft.userId}
              and idempotency_key = ${idempotencyKey}
            limit 1
        `;
        mealId = existing[0]?.id;
    }
    if (!mealId) throw new Error("Confirmed meal could not be created");

    const existingItems = await tx<Array<{ count: number }>>`
        select count(*)::integer as count
        from munch.meal_items
        where meal_id = ${mealId}
    `;
    if ((existingItems[0]?.count ?? 0) === 0) {
        for (const [position, item] of items.entries()) {
            await tx`
                insert into munch.meal_items (
                    meal_id, user_id, position, name, quantity, portion_label,
                    gram_weight, calories, protein_g, carbs_g, fat_g, fiber_g,
                    sugar_g, alcohol_g, sodium_mg, saturated_fat_g,
                    cholesterol_mg, potassium_mg, source_type, provider,
                    provider_food_id, provider_revision, source_url,
                    source_updated_at, confidence, assumptions, source_snapshot
                ) values (
                    ${mealId}, ${draft.userId}, ${position}, ${item.name},
                    ${item.quantity ?? null}, ${item.portionLabel ?? null},
                    ${item.gramWeight ?? null}, ${item.nutrients.calories ?? null},
                    ${item.nutrients.protein_g ?? null}, ${item.nutrients.carbs_g ?? null},
                    ${item.nutrients.fat_g ?? null}, ${item.nutrients.fiber_g ?? null},
                    ${item.nutrients.sugar_g ?? null}, ${item.nutrients.alcohol_g ?? null},
                    ${item.nutrients.sodium_mg ?? null},
                    ${item.nutrients.saturated_fat_g ?? null},
                    ${item.nutrients.cholesterol_mg ?? null},
                    ${item.nutrients.potassium_mg ?? null}, ${item.sourceType},
                    ${item.provider ?? null}, ${item.providerFoodId ?? null},
                    ${item.providerRevision ?? null}, ${item.sourceUrl ?? null},
                    ${item.sourceUpdatedAt ? new Date(item.sourceUpdatedAt) : null},
                    ${item.confidence ?? null},
                    ${item.assumptions ?? []}::jsonb,
                    ${item.sourceSnapshot ?? {}}::jsonb
                )
            `;
        }
    }
    return mealId;
}

export async function confirmMealDraft(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    confirmed: true;
}): Promise<MealDraft> {
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        if (draft.status === "confirmed") return draft;
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        if (draft.status !== "awaiting_confirmation") {
            throw new Error("Meal draft is not ready for confirmation");
        }
        if (draft.questions.some((question) => question.status === "open")) {
            throw new Error("Meal draft still has unresolved questions");
        }
        const mealId = await insertConfirmedMeal(tx, draft);
        await tx`
            update munch.meal_drafts
            set status = 'confirmed',
                confirmed_meal_id = ${mealId},
                version = version + 1,
                updated_at = now()
            where id = ${input.draftId}
        `;
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function cancelMealDraft(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
}): Promise<MealDraft> {
    return withUserDatabase(input.userId, async (tx) => {
        const draft = await loadDraft(tx, input.draftId, true);
        if (!draft) throw new Error("Meal draft not found");
        assertEditable(draft);
        assertVersion(draft, input.expectedVersion);
        await tx`
            update munch.meal_drafts
            set status = 'cancelled', version = version + 1, updated_at = now()
            where id = ${input.draftId}
        `;
        return (await loadDraft(tx, input.draftId))!;
    });
}

export async function expireMealDrafts(userId: string): Promise<number> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.meal_drafts
            set status = 'expired', version = version + 1, updated_at = now()
            where expires_at <= now()
              and status in ('open', 'awaiting_answers', 'awaiting_confirmation')
            returning id
        `;
        return rows.length;
    });
}

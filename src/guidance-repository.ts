import { createHash, randomUUID } from "node:crypto";
import {
    withUserDatabase,
    type DatabaseTransaction,
} from "./platform/database.js";
import {
    getMealsByDate,
    getMealsInRange,
    getNutritionGoals,
    getUserTimezone,
    getWaterByDate,
    getWaterInRange,
    getWeightInRange,
    type NutritionGoals,
} from "./storage.js";
import {
    addGroceryItems,
    calculateNutrition,
    getMealPlan,
    type GroceryItemInput,
    type PlanningScope,
    type RecipeInput,
    saveRecipeInTransaction,
    scheduleRecipeInTransaction,
} from "./planning/repository.js";
import { resolvePlanningRecipeNutrition } from "./recipe-nutrition-resolution.js";
import { getFeatureModules } from "./feature-modules-repository.js";
import { dateInTz, dateOnlyString, shiftLocalDate, validateTz } from "./tz.js";
import { toStoredInteger } from "./units.js";
import {
    buildDailyGuidance,
    buildWeeklyCheckin,
    checkRecipeConstraints,
    dayTotalsAfterMealSwap,
    isNearDuplicate,
    recipeFingerprint,
    varietyScore,
    type VarietyRecipe,
} from "./guidance/domain.js";
import {
    createPlanDraftSchema,
    guidancePreferencesSchema,
    goalTargetsSchema,
    type CreatePlanDraftInput,
    type GuidancePreferences,
    type GoalTargets,
    type PlanItemInput,
    type GeneratedRecipeProposal,
    planningPreferenceOverridesSchema,
    planItemSchema,
} from "./guidance/contracts.js";

const defaultPreferences: GuidancePreferences = {
    objective: "track_only",
    suggestions_enabled: false,
    allergies: [],
    excluded_ingredients: [],
    disliked_ingredients: [],
    liked_ingredients: [],
    cuisines: [],
    flavors: [],
    equipment: [],
    preferred_methods: [],
    avoided_methods: [],
    difficulty: "any",
    max_prep_minutes: null,
    max_total_minutes: null,
    servings: 2,
    allow_repeats: false,
    repeat_window_days: 21,
};

type JsonObject = Record<string, unknown>;

export interface GoalChangePreview {
    id: string;
    expected_revision: number;
    proposed_targets: GoalTargets;
    rationale: string[];
    evidence: JsonObject;
    status: string;
    expires_at: Date | string;
    current_revision: Record<string, unknown>;
    deduplicated: boolean;
}

function asObject(value: unknown): JsonObject {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as JsonObject;
    }
    if (typeof value === "string") {
        try {
            const parsed: unknown = JSON.parse(value);
            return parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
                ? (parsed as JsonObject)
                : {};
        } catch {
            return {};
        }
    }
    return {};
}

function numberOrNull(value: unknown): number | null {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function goalsToTargets(row: Record<string, unknown> | null): GoalTargets {
    return {
        daily_calories: numberOrNull(row?.daily_calories),
        daily_protein_g: numberOrNull(row?.daily_protein_g),
        daily_carbs_g: numberOrNull(row?.daily_carbs_g),
        daily_fat_g: numberOrNull(row?.daily_fat_g),
        daily_fiber_g: numberOrNull(row?.daily_fiber_g),
        daily_sugar_g: numberOrNull(row?.daily_sugar_g),
        daily_alcohol_g: numberOrNull(row?.daily_alcohol_g),
        daily_water_ml: numberOrNull(row?.daily_water_ml),
        target_weight_g: numberOrNull(row?.target_weight_g),
    };
}

function preferencesFromRow(
    row?: Record<string, unknown>,
): GuidancePreferences & { version: number } {
    if (!row) return { ...defaultPreferences, version: 0 };
    const profile = asObject(row.profile);
    const parsed = guidancePreferencesSchema.safeParse({
        ...defaultPreferences,
        ...profile,
        objective: row.objective,
        suggestions_enabled: row.suggestions_enabled,
    });
    return {
        ...(parsed.success ? parsed.data : defaultPreferences),
        version: Number(row.version ?? 1),
    };
}

function profileOnly(preferences: GuidancePreferences): JsonObject {
    const {
        objective: _objective,
        suggestions_enabled: _suggestions,
        ...profile
    } = preferences;
    return profile;
}

async function preferencesInTransaction(
    tx: DatabaseTransaction,
    userId: string,
) {
    const rows = await tx<Array<Record<string, unknown>>>`
        select user_id, objective, suggestions_enabled, profile, version, updated_at
        from munch.guidance_preferences where user_id = ${userId}
    `;
    return preferencesFromRow(rows[0]);
}

async function latestGoalRevision(tx: DatabaseTransaction, userId: string) {
    const rows = await tx<Array<Record<string, unknown>>>`
        select id, revision, objective, targets, created_at
        from munch.guidance_goal_revisions
        where user_id = ${userId}
        order by revision desc limit 1
    `;
    return rows[0] ?? null;
}

async function currentGoalsInTransaction(
    tx: DatabaseTransaction,
    userId: string,
) {
    const rows = await tx<Array<Record<string, unknown>>>`
        select daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g,
               daily_fiber_g, daily_sugar_g, daily_alcohol_g, daily_water_ml,
               target_weight_g, updated_at
        from munch.nutrition_goals where user_id = ${userId} for update
    `;
    return rows[0] ?? null;
}

async function lockUserGuidance(tx: DatabaseTransaction, userId: string) {
    // Share the lock used by nutrition-platform/goals.ts so website and MCP
    // edits cannot race their append-only revision numbers.
    await tx`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
}

function normalizeGoalTargets(input: unknown): GoalTargets {
    const parsed = goalTargetsSchema.parse(input);
    const decimal = (value: number | null) =>
        value == null ? null : Number(value.toFixed(2));
    return goalTargetsSchema.parse({
        daily_calories:
            parsed.daily_calories == null
                ? null
                : toStoredInteger(parsed.daily_calories),
        daily_protein_g: decimal(parsed.daily_protein_g),
        daily_carbs_g: decimal(parsed.daily_carbs_g),
        daily_fat_g: decimal(parsed.daily_fat_g),
        daily_fiber_g: decimal(parsed.daily_fiber_g),
        daily_sugar_g: decimal(parsed.daily_sugar_g),
        daily_alcohol_g: decimal(parsed.daily_alcohol_g),
        daily_water_ml:
            parsed.daily_water_ml == null
                ? null
                : toStoredInteger(parsed.daily_water_ml),
        target_weight_g:
            parsed.target_weight_g == null
                ? null
                : toStoredInteger(parsed.target_weight_g),
    });
}

function requireIdempotencyKey(value: string, label: string) {
    if (value.length < 8 || value.length > 120) {
        throw new Error(`${label} idempotency key must be 8 to 120 characters`);
    }
}

export async function getGuidancePreferences(userId: string) {
    return withUserDatabase(userId, async (tx) =>
        preferencesInTransaction(tx, userId),
    );
}

export async function updateGuidancePreferences(
    userId: string,
    input: unknown,
    expectedVersion?: number,
    origin: "website" | "mcp" = "website",
) {
    const preferences = guidancePreferencesSchema.parse(input);
    return withUserDatabase(userId, async (tx) => {
        await lockUserGuidance(tx, userId);
        const latestBefore = await ensureGoalRevision(tx, userId);
        const current = await tx<Array<{ version: number | string }>>`
            select version from munch.guidance_preferences where user_id = ${userId} for update
        `;
        const version = Number(current[0]?.version ?? 0);
        if (expectedVersion !== undefined && version !== expectedVersion) {
            throw new Error(
                "GUIDANCE_CONFLICT: preferences changed; refresh and try again",
            );
        }
        const rows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guidance_preferences (
                user_id, objective, suggestions_enabled, profile, version, updated_at
            ) values (
                ${userId}, ${preferences.objective}, ${preferences.suggestions_enabled},
                ${profileOnly(preferences)}::jsonb, ${version + 1}, now()
            )
            on conflict (user_id) do update set
                objective = excluded.objective,
                suggestions_enabled = excluded.suggestions_enabled,
                profile = excluded.profile,
                version = excluded.version,
                updated_at = now()
            returning user_id, objective, suggestions_enabled, profile, version, updated_at
        `;
        const saved = preferencesFromRow(rows[0]);
        if (String(latestBefore.objective) !== saved.objective) {
            await tx`
                insert into munch.guidance_goal_revisions (
                    user_id, revision, objective, targets, origin, confirmed, rationale
                ) values (
                    ${userId}, ${Number(latestBefore.revision) + 1}, ${saved.objective},
                    ${asObject(latestBefore.targets)}::jsonb, ${origin}, true,
                    ${["Objective changed by the user"]}::jsonb
                )
            `;
        }
        return saved;
    });
}

async function ensureGoalRevision(tx: DatabaseTransaction, userId: string) {
    let latest = await latestGoalRevision(tx, userId);
    if (latest) return latest;
    await lockUserGuidance(tx, userId);
    latest = await latestGoalRevision(tx, userId);
    if (latest) return latest;
    const current = await currentGoalsInTransaction(tx, userId);
    const preferences = await preferencesInTransaction(tx, userId);
    const targets = goalsToTargets(current);
    const rows = await tx<Array<Record<string, unknown>>>`
        insert into munch.guidance_goal_revisions (
            user_id, revision, objective, targets, origin, confirmed, rationale
        ) values (
            ${userId}, 1, ${preferences.objective}, ${targets}::jsonb,
            'user', true, ${["Initial snapshot of the user's current targets"]}::jsonb
        )
        returning id, revision, objective, targets, created_at
    `;
    if (!rows[0])
        throw new Error("Unable to create the initial goal history snapshot");
    return rows[0];
}

async function updateGoalsInTransaction(
    tx: DatabaseTransaction,
    userId: string,
    input: GoalTargets,
    origin: "user" | "website" | "mcp" | "guided_suggestion",
    proposalId: string | null,
    idempotencyKey: string,
    rationale: string[],
) {
    await lockUserGuidance(tx, userId);
    requireIdempotencyKey(idempotencyKey, "Goal update");
    const targets = normalizeGoalTargets(input);
    const duplicate = await tx<Array<Record<string, unknown>>>`
        select id, revision, targets, proposal_id from munch.guidance_goal_revisions
        where user_id = ${userId} and idempotency_key = ${idempotencyKey} limit 1
    `;
    if (duplicate[0]) {
        const previousTargets = normalizeGoalTargets(
            asObject(duplicate[0].targets),
        );
        if (
            JSON.stringify(previousTargets) !== JSON.stringify(targets) ||
            (duplicate[0].proposal_id == null
                ? null
                : String(duplicate[0].proposal_id)) !== proposalId
        ) {
            throw new Error(
                "GUIDANCE_CONFLICT: idempotency key was already used for a different goal update",
            );
        }
        return { revision: duplicate[0], deduplicated: true };
    }
    const current = await currentGoalsInTransaction(tx, userId);
    const preferences = await preferencesInTransaction(tx, userId);
    const before = goalsToTargets(current);
    const latest = await ensureGoalRevision(tx, userId);
    if (JSON.stringify(before) === JSON.stringify(targets)) {
        return { revision: latest, deduplicated: true };
    }
    const updatedRows = await tx<Array<Record<string, unknown>>>`
        insert into munch.nutrition_goals (
            user_id, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g,
            daily_fiber_g, daily_sugar_g, daily_alcohol_g, daily_water_ml,
            target_weight_g, updated_at
        ) values (
            ${userId}, ${targets.daily_calories == null ? null : toStoredInteger(targets.daily_calories)},
            ${targets.daily_protein_g}, ${targets.daily_carbs_g}, ${targets.daily_fat_g},
            ${targets.daily_fiber_g}, ${targets.daily_sugar_g}, ${targets.daily_alcohol_g},
            ${targets.daily_water_ml == null ? null : toStoredInteger(targets.daily_water_ml)},
            ${targets.target_weight_g}, now()
        ) on conflict (user_id) do update set
            daily_calories = excluded.daily_calories,
            daily_protein_g = excluded.daily_protein_g,
            daily_carbs_g = excluded.daily_carbs_g,
            daily_fat_g = excluded.daily_fat_g,
            daily_fiber_g = excluded.daily_fiber_g,
            daily_sugar_g = excluded.daily_sugar_g,
            daily_alcohol_g = excluded.daily_alcohol_g,
            daily_water_ml = excluded.daily_water_ml,
            target_weight_g = excluded.target_weight_g,
            updated_at = now()
        returning user_id, daily_calories, daily_protein_g, daily_carbs_g,
                  daily_fat_g, daily_fiber_g, daily_sugar_g, daily_alcohol_g,
                  daily_water_ml, target_weight_g, updated_at
    `;
    if (!updatedRows[0]) throw new Error("Failed to update nutrition goals");
    const revisions = await tx<Array<Record<string, unknown>>>`
        insert into munch.guidance_goal_revisions (
            user_id, revision, objective, targets, origin, confirmed,
            rationale, proposal_id, idempotency_key
        ) values (
            ${userId}, ${Number(latest.revision) + 1}, ${preferences.objective},
            ${targets}::jsonb, ${origin}, true, ${rationale}::jsonb,
            ${proposalId}, ${idempotencyKey}
        ) returning id, revision, objective, targets, created_at
    `;
    if (!revisions[0])
        throw new Error("Failed to record nutrition goal history");
    return {
        revision: revisions[0],
        goals: goalsToTargets(updatedRows[0]),
        deduplicated: false,
    };
}

export async function saveUserNutritionGoals(input: {
    userId: string;
    targets: unknown;
    confirm: boolean;
    origin: "website" | "mcp";
    idempotencyKey: string;
}) {
    if (!input.confirm)
        throw new Error(
            "Explicit confirmation is required to update nutrition goals",
        );
    requireIdempotencyKey(input.idempotencyKey, "Goal preview");
    const targets = normalizeGoalTargets(input.targets);
    return withUserDatabase(input.userId, (tx) =>
        updateGoalsInTransaction(
            tx,
            input.userId,
            targets,
            input.origin,
            null,
            input.idempotencyKey,
            ["Targets explicitly entered and confirmed by the user"],
        ),
    );
}

export async function previewGoalChange(input: {
    userId: string;
    targets: unknown;
    idempotencyKey: string;
    rationale?: string[];
    evidence?: JsonObject;
}): Promise<GoalChangePreview> {
    const targets = goalTargetsSchema.parse(input.targets);
    const rationale = (input.rationale ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
    return withUserDatabase(input.userId, async (tx) => {
        await lockUserGuidance(tx, input.userId);
        const current = await ensureGoalRevision(tx, input.userId);
        const existing = await tx<Array<Record<string, unknown>>>`
            select id, expected_revision, proposed_targets, rationale, evidence, status, expires_at
            from munch.guidance_goal_proposals
            where user_id = ${input.userId} and idempotency_key = ${input.idempotencyKey}
            limit 1
        `;
        if (existing[0]) {
            if (
                JSON.stringify(
                    normalizeGoalTargets(
                        asObject(existing[0].proposed_targets),
                    ),
                ) !== JSON.stringify(targets)
            ) {
                throw new Error(
                    "GUIDANCE_CONFLICT: idempotency key was already used for a different goal preview",
                );
            }
            return {
                id: String(existing[0].id),
                expected_revision: Number(existing[0].expected_revision),
                proposed_targets: normalizeGoalTargets(
                    asObject(existing[0].proposed_targets),
                ),
                rationale: Array.isArray(existing[0].rationale)
                    ? existing[0].rationale.map(String)
                    : [],
                evidence: asObject(existing[0].evidence),
                status: String(existing[0].status),
                expires_at: existing[0].expires_at as Date | string,
                current_revision: current,
                deduplicated: true,
            };
        }
        const rows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guidance_goal_proposals (
                user_id, expected_revision, proposed_targets, rationale, evidence,
                idempotency_key, expires_at
            ) values (
                ${input.userId}, ${Number(current.revision)}, ${targets}::jsonb,
                ${rationale}::jsonb, ${input.evidence ?? {}}::jsonb,
                ${input.idempotencyKey}, now() + interval '24 hours'
            ) returning id, expected_revision, proposed_targets, rationale, evidence, status, expires_at
        `;
        if (!rows[0]) throw new Error("Unable to create goal preview");
        return {
            id: String(rows[0].id),
            expected_revision: Number(rows[0].expected_revision),
            proposed_targets: normalizeGoalTargets(
                asObject(rows[0].proposed_targets),
            ),
            rationale: Array.isArray(rows[0].rationale)
                ? rows[0].rationale.map(String)
                : [],
            evidence: asObject(rows[0].evidence),
            status: String(rows[0].status),
            expires_at: rows[0].expires_at as Date | string,
            current_revision: current,
            deduplicated: false,
        };
    });
}

export async function commitGoalChange(input: {
    userId: string;
    proposalId: string;
    expectedRevision: number;
    confirm: boolean;
    idempotencyKey: string;
    origin: "website" | "mcp";
}) {
    if (!input.confirm)
        throw new Error("Explicit confirmation is required to change goals");
    requireIdempotencyKey(input.idempotencyKey, "Goal confirmation");
    return withUserDatabase(input.userId, async (tx) => {
        await lockUserGuidance(tx, input.userId);
        const proposalRows = await tx<Array<Record<string, unknown>>>`
            select id, expected_revision, proposed_targets, rationale, status, expires_at
            from munch.guidance_goal_proposals
            where user_id = ${input.userId} and id = ${input.proposalId}
            for update
        `;
        const proposal = proposalRows[0];
        if (!proposal) throw new Error("Goal preview was not found");
        if (proposal.status === "accepted") {
            const committedRows = await tx<Array<Record<string, unknown>>>`
                select id, revision, objective, targets, created_at
                from munch.guidance_goal_revisions
                where user_id = ${input.userId} and proposal_id = ${input.proposalId}
                order by revision desc limit 1
            `;
            return {
                proposal_id: input.proposalId,
                revision:
                    committedRows[0] ??
                    (await latestGoalRevision(tx, input.userId)),
                deduplicated: true,
            };
        }
        if (
            proposal.status !== "pending" ||
            new Date(String(proposal.expires_at)).getTime() <= Date.now()
        ) {
            throw new Error("Goal preview has expired; create a new preview");
        }
        if (Number(proposal.expected_revision) !== input.expectedRevision) {
            throw new Error(
                "GUIDANCE_CONFLICT: goal preview version does not match",
            );
        }
        const latest = await ensureGoalRevision(tx, input.userId);
        if (Number(latest.revision) !== input.expectedRevision) {
            throw new Error(
                "GUIDANCE_CONFLICT: goals changed since preview; review a fresh comparison",
            );
        }
        const committed = await updateGoalsInTransaction(
            tx,
            input.userId,
            normalizeGoalTargets(asObject(proposal.proposed_targets)),
            input.origin,
            input.proposalId,
            input.idempotencyKey,
            Array.isArray(proposal.rationale)
                ? proposal.rationale.map(String)
                : [],
        );
        await tx`
            update munch.guidance_goal_proposals
            set status = 'accepted', updated_at = now()
            where id = ${input.proposalId} and user_id = ${input.userId}
        `;
        return { proposal_id: input.proposalId, ...committed };
    });
}

export async function listGoalHistory(userId: string, limit = 20) {
    const bounded = Math.max(1, Math.min(50, Math.floor(limit)));
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, revision, objective, targets, origin, confirmed,
                   rationale, created_at
            from munch.guidance_goal_revisions
            where user_id = ${userId}
            order by revision desc limit ${bounded}
        `;
        return rows;
    });
}

function scopeValues(scope: PlanningScope, userId: string) {
    if (scope.type === "personal") return { personal: userId, household: null };
    if (!/^[0-9a-f-]{36}$/i.test(scope.householdId))
        throw new Error("Invalid household ID");
    return { personal: null, household: scope.householdId };
}

function validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function daysBetween(start: string, end: string): number {
    return Math.round(
        (new Date(`${end}T00:00:00Z`).getTime() -
            new Date(`${start}T00:00:00Z`).getTime()) /
            86_400_000,
    );
}

function planFingerprint(rows: Array<Record<string, unknown>>): string {
    const canonical = rows.map((row) => [
        String(row.id),
        String(row.version),
        dateOnlyString(row.planned_date),
        String(row.meal_slot ?? ""),
        String(row.recipe_id),
        String(row.recipe_revision_id),
    ]);
    return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

async function planStateInTransaction(
    tx: DatabaseTransaction,
    scope: PlanningScope,
    userId: string,
    startDate: string,
    endDate: string,
) {
    const owner = scopeValues(scope, userId);
    return tx<Array<Record<string, unknown>>>`
        select id, version, planned_date, meal_slot, recipe_id, recipe_revision_id
        from munch.planned_meals
        where deleted_at is null
          and personal_owner_user_id is not distinct from ${owner.personal}
          and household_id is not distinct from ${owner.household}
          and planned_date between ${startDate}::date and ${endDate}::date
        order by planned_date, meal_slot nulls last, id
    `;
}

export async function getGuidanceContext(input: {
    userId: string;
    scope?: PlanningScope;
    startDate?: string;
    endDate?: string;
}) {
    const scope = input.scope ?? { type: "personal" as const };
    const startDate =
        input.startDate && validDate(input.startDate)
            ? input.startDate
            : shiftLocalDate(new Date().toISOString().slice(0, 10), -28);
    const endDate =
        input.endDate && validDate(input.endDate)
            ? input.endDate
            : new Date().toISOString().slice(0, 10);
    const owner = scopeValues(scope, input.userId);
    const timezone = await getUserTimezone(input.userId);
    return withUserDatabase(input.userId, async (tx) => {
        const preferences = await preferencesInTransaction(tx, input.userId);
        const goalsRow = await currentGoalsInTransaction(tx, input.userId);
        const revision = await ensureGoalRevision(tx, input.userId);
        let savedRecipes: Array<Record<string, unknown>>;
        if (scope.type === "personal") {
            savedRecipes = await tx<Array<Record<string, unknown>>>`
                select recipe.id, recipe.name, revision.id as recipe_revision_id,
                       revision.revision_number, revision.servings,
                       revision.preparation_minutes, revision.cooking_minutes,
                       revision.nutrition_status, revision.calories_per_serving,
                       revision.protein_g_per_serving, revision.guidance_metadata,
                       coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                           filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
                from munch.recipes recipe
                join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                    and revision.revision_number = recipe.current_revision_number
                left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
                where recipe.personal_owner_user_id = ${input.userId}
                  and recipe.archived_at is null
                group by recipe.id, revision.id order by recipe.updated_at desc limit 40
            `;
        } else {
            savedRecipes = await tx<Array<Record<string, unknown>>>`
                select recipe.id, recipe.name, revision.id as recipe_revision_id,
                       revision.revision_number, revision.servings,
                       revision.preparation_minutes, revision.cooking_minutes,
                       revision.nutrition_status, revision.calories_per_serving,
                       revision.protein_g_per_serving, revision.guidance_metadata,
                       coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                           filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
                from munch.recipes recipe
                join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                    and revision.revision_number = recipe.current_revision_number
                left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
                where recipe.household_id = ${scope.householdId}
                  and recipe.archived_at is null
                group by recipe.id, revision.id order by recipe.updated_at desc limit 40
            `;
        }
        const currentPlan = await planStateInTransaction(
            tx,
            scope,
            input.userId,
            startDate,
            endDate,
        );
        const historyStart = shiftLocalDate(
            startDate,
            -Math.min(preferences.repeat_window_days, 90),
        );
        const recentPlan = await tx<Array<Record<string, unknown>>>`
            select planned.planned_date, planned.meal_slot, recipe.id as recipe_id,
                   recipe.name, revision.guidance_metadata,
                   coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                       filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
            from munch.planned_meals planned
            join munch.recipes recipe on recipe.id = planned.recipe_id
            join munch.recipe_revisions revision on revision.id = planned.recipe_revision_id
            left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
            where planned.deleted_at is null
              and planned.personal_owner_user_id is not distinct from ${owner.personal}
              and planned.household_id is not distinct from ${owner.household}
              and planned.planned_date between ${historyStart}::date and ${endDate}::date
            group by planned.id, recipe.id, revision.id
            order by planned.planned_date desc limit 80
        `;
        return {
            preferences,
            goals: goalsToTargets(goalsRow),
            goal_revision: revision,
            timezone,
            scope,
            saved_recipes: savedRecipes.map((row) => ({
                ...row,
                ingredients: Array.isArray(row.ingredients)
                    ? row.ingredients
                    : [],
                guidance_metadata: asObject(row.guidance_metadata),
            })),
            recent_plan_history: recentPlan.map((row) => ({
                ...row,
                ingredients: Array.isArray(row.ingredients)
                    ? row.ingredients
                    : [],
                guidance_metadata: asObject(row.guidance_metadata),
            })),
            current_plan: currentPlan,
        };
    });
}

function recipeMetadata(value: unknown) {
    const metadata = asObject(value);
    const list = (key: string) =>
        Array.isArray(metadata[key]) ? metadata[key]!.map(String) : [];
    const difficulty =
        metadata.difficulty === "easy" || metadata.difficulty === "advanced"
            ? metadata.difficulty
            : "moderate";
    return {
        difficulty,
        required_equipment: list("required_equipment"),
        cuisine_tags: list("cuisine_tags"),
        primary_protein:
            typeof metadata.primary_protein === "string"
                ? metadata.primary_protein
                : null,
        cooking_methods: list("cooking_methods"),
    } as const;
}

function rowIngredients(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    const object = asObject(value);
    return Object.values(object).map(String);
}

async function recipeForScope(
    tx: DatabaseTransaction,
    userId: string,
    scope: PlanningScope,
    recipeId: string,
    revisionId: string,
) {
    const owner = scopeValues(scope, userId);
    const rows = await tx<Array<Record<string, unknown>>>`
        select recipe.id, recipe.name, recipe.archived_at,
               recipe.personal_owner_user_id, recipe.household_id,
               revision.id as recipe_revision_id, revision.servings,
               revision.instructions, revision.preparation_minutes,
               revision.cooking_minutes, revision.nutrition_status,
               revision.calories_per_serving, revision.protein_g_per_serving,
               revision.carbs_g_per_serving, revision.fat_g_per_serving,
               revision.fiber_g_per_serving, revision.sugar_g_per_serving,
               revision.guidance_metadata,
               coalesce(jsonb_agg(jsonb_build_object(
                   'name', ingredient.name, 'quantity', ingredient.quantity,
                   'unit', ingredient.unit, 'preparation', ingredient.preparation,
                   'optional', ingredient.optional, 'gram_weight', ingredient.gram_weight,
                   'calories', ingredient.calories, 'protein_g', ingredient.protein_g,
                   'carbs_g', ingredient.carbs_g, 'fat_g', ingredient.fat_g,
                   'fiber_g', ingredient.fiber_g, 'sugar_g', ingredient.sugar_g,
                   'sodium_mg', ingredient.sodium_mg, 'provider', ingredient.provider,
                   'provider_food_id', ingredient.provider_food_id,
                   'source_type', ingredient.source_type, 'source_url', ingredient.source_url,
                   'confidence', ingredient.confidence, 'source_snapshot', ingredient.source_snapshot
               ) order by ingredient.position) filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
        from munch.recipes recipe
        join munch.recipe_revisions revision on revision.recipe_id = recipe.id
        left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
        where recipe.id = ${recipeId}
          and revision.id = ${revisionId}
          and recipe.archived_at is null
          and recipe.personal_owner_user_id is not distinct from ${owner.personal}
          and recipe.household_id is not distinct from ${owner.household}
        group by recipe.id, revision.id
        limit 1
    `;
    return rows[0] ?? null;
}

function candidateFromSaved(
    row: Record<string, unknown>,
): GeneratedRecipeProposal {
    const metadata = recipeMetadata(row.guidance_metadata);
    const ingredients = Array.isArray(row.ingredients)
        ? row.ingredients.map((value) => asObject(value))
        : [];
    return {
        name: String(row.name),
        description: "",
        ingredients: ingredients.map((ingredient) => ({
            name: String(ingredient.name ?? ""),
            quantity: numberOrNull(ingredient.quantity),
            unit: ingredient.unit == null ? null : String(ingredient.unit),
            preparation:
                ingredient.preparation == null
                    ? undefined
                    : String(ingredient.preparation),
            optional: ingredient.optional === true,
        })),
        instructions: ["Saved recipe"],
        servings: Number(row.servings ?? 1),
        preparation_minutes: numberOrNull(row.preparation_minutes),
        cooking_minutes: numberOrNull(row.cooking_minutes),
        difficulty: metadata.difficulty,
        required_equipment: [...metadata.required_equipment],
        cuisine_tags: [...metadata.cuisine_tags],
        primary_protein: metadata.primary_protein,
        cooking_methods: [...metadata.cooking_methods],
    };
}

function recipeInputFromProposal(
    proposal: GeneratedRecipeProposal,
): RecipeInput {
    return {
        name: proposal.name,
        servings: proposal.servings,
        description: proposal.description,
        instructions: proposal.instructions,
        preparationMinutes: proposal.preparation_minutes ?? undefined,
        cookingMinutes: proposal.cooking_minutes ?? undefined,
        sourceType: "chatgpt_generated",
        guidanceMetadata: {
            difficulty: proposal.difficulty,
            required_equipment: proposal.required_equipment,
            cuisine_tags: proposal.cuisine_tags,
            primary_protein: proposal.primary_protein,
            cooking_methods: proposal.cooking_methods,
        },
        ingredients: proposal.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity ?? undefined,
            unit: ingredient.unit ?? undefined,
            preparation: ingredient.preparation,
            optional: ingredient.optional,
            sourceType: "user_supplied",
        })),
    };
}

function nutritionSummary(
    facts: unknown,
    servings: number,
    recipeServings: number,
    status: string,
) {
    const values = asObject(facts);
    const perServing = {
        calories: numberOrNull(values.calories),
        protein_g: numberOrNull(values.protein_g),
        carbs_g: numberOrNull(values.carbs_g),
        fat_g: numberOrNull(values.fat_g),
        fiber_g: numberOrNull(values.fiber_g),
        sugar_g: numberOrNull(values.sugar_g),
    };
    const multiplier = servings / Math.max(recipeServings, 0.001);
    return {
        status:
            status === "complete" || status === "partial"
                ? status
                : "unavailable",
        per_serving: perServing,
        planned_total: Object.fromEntries(
            Object.entries(perServing).map(([key, value]) => [
                key,
                value == null ? null : Number((value * servings).toFixed(2)),
            ]),
        ),
        serving_multiplier: multiplier,
    };
}

async function prepareDraftItems(
    tx: DatabaseTransaction,
    input: {
        userId: string;
        draftId: string;
        scope: PlanningScope;
        items: PlanItemInput[];
        startDate: string;
        endDate: string;
        preferences: GuidancePreferences;
        allowRepeats: boolean;
    },
) {
    const slotKeys = new Set<string>();
    const chosen: VarietyRecipe[] = [];
    const savedPool: Array<{ id: string; recipe: VarietyRecipe }> = [];
    const historyStart = shiftLocalDate(
        input.startDate,
        -Math.min(input.preferences.repeat_window_days, 90),
    );
    if (input.scope.type === "personal") {
        const rows = await tx<Array<Record<string, unknown>>>`
            select recipe.id, recipe.name, revision.guidance_metadata,
                   coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                       filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
            from munch.recipes recipe
            join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                and revision.revision_number = recipe.current_revision_number
            left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
            where recipe.personal_owner_user_id = ${input.userId} and recipe.archived_at is null
            group by recipe.id, revision.id order by recipe.updated_at desc limit 60
        `;
        for (const row of rows) {
            const metadata = recipeMetadata(row.guidance_metadata);
            savedPool.push({
                id: String(row.id),
                recipe: {
                    name: String(row.name),
                    ingredients: rowIngredients(row.ingredients),
                    cuisineTags: metadata.cuisine_tags,
                    primaryProtein: metadata.primary_protein,
                    cookingMethods: metadata.cooking_methods,
                },
            });
        }
    } else {
        const rows = await tx<Array<Record<string, unknown>>>`
            select recipe.id, recipe.name, revision.guidance_metadata,
                   coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                       filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
            from munch.recipes recipe
            join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                and revision.revision_number = recipe.current_revision_number
            left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
            where recipe.household_id = ${input.scope.householdId} and recipe.archived_at is null
            group by recipe.id, revision.id order by recipe.updated_at desc limit 60
        `;
        for (const row of rows) {
            const metadata = recipeMetadata(row.guidance_metadata);
            savedPool.push({
                id: String(row.id),
                recipe: {
                    name: String(row.name),
                    ingredients: rowIngredients(row.ingredients),
                    cuisineTags: metadata.cuisine_tags,
                    primaryProtein: metadata.primary_protein,
                    cookingMethods: metadata.cooking_methods,
                },
            });
        }
    }

    const owner = scopeValues(input.scope, input.userId);
    const recentRows = await tx<Array<Record<string, unknown>>>`
        select recipe.id, recipe.name, revision.guidance_metadata,
               coalesce(jsonb_agg(ingredient.name order by ingredient.position)
                   filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
        from munch.planned_meals planned
        join munch.recipes recipe on recipe.id = planned.recipe_id
        join munch.recipe_revisions revision on revision.id = planned.recipe_revision_id
        left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
        where planned.deleted_at is null
          and planned.personal_owner_user_id is not distinct from ${owner.personal}
          and planned.household_id is not distinct from ${owner.household}
          and planned.planned_date >= ${historyStart}::date
          and planned.planned_date < ${input.startDate}::date
        group by recipe.id, revision.id
        order by max(planned.planned_date) desc limit 80
    `;
    for (const row of recentRows) {
        const metadata = recipeMetadata(row.guidance_metadata);
        savedPool.push({
            id: String(row.id),
            recipe: {
                name: String(row.name),
                ingredients: rowIngredients(row.ingredients),
                cuisineTags: metadata.cuisine_tags,
                primaryProtein: metadata.primary_protein,
                cookingMethods: metadata.cooking_methods,
            },
        });
    }

    let generatedCount = 0;
    const result: Array<Record<string, unknown>> = [];
    for (const [position, item] of input.items.entries()) {
        if (
            !validDate(item.date) ||
            item.date < input.startDate ||
            item.date > input.endDate
        ) {
            throw new Error("Plan item date must be within the requested week");
        }
        const slotKey = `${item.date}:${item.meal_slot}`;
        if (slotKeys.has(slotKey))
            throw new Error(
                "A date and meal slot can appear only once in a plan draft",
            );
        slotKeys.add(slotKey);
        let sourceType: "saved" | "generated";
        let proposal: GeneratedRecipeProposal;
        let resolvedRecipe: RecipeInput | null = null;
        let recipeId: string | null = null;
        let recipeRevisionId: string | null = null;
        let nutrition: Record<string, unknown>;
        let status: string;
        if (item.generated_recipe) {
            sourceType = "generated";
            generatedCount++;
            if (generatedCount > 14)
                throw new Error(
                    "A plan draft can include at most 14 generated recipes",
                );
            proposal = item.generated_recipe;
            const rawRecipe = recipeInputFromProposal(proposal);
            try {
                resolvedRecipe =
                    await resolvePlanningRecipeNutrition(rawRecipe);
            } catch {
                resolvedRecipe = rawRecipe;
            }
            const calculated = calculateNutrition(resolvedRecipe);
            nutrition = nutritionSummary(
                calculated.perServing,
                item.servings,
                resolvedRecipe.servings,
                calculated.nutritionStatus,
            );
            status = calculated.nutritionStatus;
        } else {
            sourceType = "saved";
            const row = await recipeForScope(
                tx,
                input.userId,
                input.scope,
                item.recipe_id!,
                item.recipe_revision_id!,
            );
            if (!row)
                throw new Error(
                    "Saved recipe revision is unavailable in this planning scope",
                );
            recipeId = String(row.id);
            recipeRevisionId = String(row.recipe_revision_id);
            proposal = candidateFromSaved(row);
            nutrition = nutritionSummary(
                {
                    calories: row.calories_per_serving,
                    protein_g: row.protein_g_per_serving,
                    carbs_g: row.carbs_g_per_serving,
                    fat_g: row.fat_g_per_serving,
                    fiber_g: row.fiber_g_per_serving,
                    sugar_g: row.sugar_g_per_serving,
                },
                item.servings,
                Number(row.servings ?? 1),
                String(row.nutrition_status),
            );
            status = String(row.nutrition_status);
        }
        const constraints = checkRecipeConstraints(proposal, input.preferences);
        const currentFingerprint = recipeFingerprint({
            name: proposal.name,
            ingredients: proposal.ingredients.map(
                (ingredient) => ingredient.name,
            ),
            cuisineTags: proposal.cuisine_tags,
            primaryProtein: proposal.primary_protein,
            cookingMethods: proposal.cooking_methods,
        });
        const duplicateSaved =
            sourceType === "generated" && !input.allowRepeats
                ? savedPool.find((saved) =>
                      isNearDuplicate(
                          currentFingerprint,
                          recipeFingerprint(saved.recipe),
                      ),
                  )
                : undefined;
        if (duplicateSaved)
            constraints.blockers.push(
                `Near-duplicate of saved recipe: ${duplicateSaved.recipe.name}`,
            );
        const duplicateSelected = !input.allowRepeats
            ? chosen.find((candidate) =>
                  isNearDuplicate(
                      currentFingerprint,
                      recipeFingerprint(candidate),
                  ),
              )
            : undefined;
        if (duplicateSelected)
            constraints.blockers.push(
                "Near-duplicate of another recipe in this plan",
            );
        if (sourceType === "generated" && !input.allowRepeats) {
            const recent = savedPool.find((saved) =>
                isNearDuplicate(
                    currentFingerprint,
                    recipeFingerprint(saved.recipe),
                ),
            );
            if (recent)
                constraints.warnings.push(
                    `This is similar to a saved recipe (${recent.recipe.name}); choose a saved version or allow repeats`,
                );
        }
        if (status !== "complete")
            constraints.warnings.push(
                `Nutrition is ${status}; this meal cannot be represented as meeting a target`,
            );
        chosen.push({
            name: proposal.name,
            ingredients: proposal.ingredients.map(
                (ingredient) => ingredient.name,
            ),
            cuisineTags: proposal.cuisine_tags,
            primaryProtein: proposal.primary_protein,
            cookingMethods: proposal.cooking_methods,
        });
        const rows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guided_plan_draft_items (
                plan_draft_id, position, planned_date, meal_slot, servings,
                source_type, recipe_id, recipe_revision_id, generated_recipe,
                resolved_recipe, nutrition, nutrition_status, blockers, warnings, note
            ) values (
                ${input.draftId}, ${position}, ${item.date}::date,
                ${item.meal_slot}, ${item.servings}, ${sourceType}, ${recipeId},
                ${recipeRevisionId}, ${sourceType === "generated" ? proposal : null}::jsonb,
                ${resolvedRecipe}::jsonb, ${nutrition}::jsonb, ${status},
                ${constraints.blockers}::jsonb, ${constraints.warnings}::jsonb,
                ${item.note ?? null}
            ) returning id
        `;
        result.push({
            itemId: String(rows[0]?.id ?? ""),
            position,
            planned_date: item.date,
            meal_slot: item.meal_slot,
            servings: item.servings,
            source_type: sourceType,
            recipe_id: recipeId,
            recipe_revision_id: recipeRevisionId,
            generated_recipe: sourceType === "generated" ? proposal : null,
            resolved_recipe: resolvedRecipe,
            nutrition,
            nutrition_status: status,
            blockers: constraints.blockers,
            warnings: [...new Set(constraints.warnings)],
            note: item.note ?? null,
        });
    }
    return result;
}

async function getDraftInTransaction(
    tx: DatabaseTransaction,
    userId: string,
    draftId: string,
) {
    const headers = await tx<Array<Record<string, unknown>>>`
        select * from munch.guided_plan_drafts
        where id = ${draftId} and (personal_owner_user_id = ${userId} or household_id is not null)
        limit 1
    `;
    const header = headers[0];
    if (!header) return null;
    const items = await tx<Array<Record<string, unknown>>>`
        select * from munch.guided_plan_draft_items
        where plan_draft_id = ${draftId} order by position
    `;
    return {
        id: String(header.id),
        scope: header.personal_owner_user_id
            ? { type: "personal" as const }
            : {
                  type: "household" as const,
                  householdId: String(header.household_id),
              },
        start_date: dateOnlyString(header.start_date),
        end_date: dateOnlyString(header.end_date),
        timezone: String(header.timezone),
        mode: String(header.mode),
        preferences_override: asObject(header.preferences_override),
        replace_existing: header.replace_existing === true,
        expected_plan_fingerprint: String(header.expected_plan_fingerprint),
        status: String(header.status),
        version: Number(header.version),
        item_count: Number(header.item_count),
        expires_at: header.expires_at,
        committed_at: header.committed_at,
        items: items.map((item) => ({
            id: String(item.id),
            position: Number(item.position),
            date: dateOnlyString(item.planned_date),
            meal_slot: String(item.meal_slot),
            servings: Number(item.servings),
            source_type: String(item.source_type),
            recipe_id: item.recipe_id == null ? null : String(item.recipe_id),
            recipe_revision_id:
                item.recipe_revision_id == null
                    ? null
                    : String(item.recipe_revision_id),
            generated_recipe: item.generated_recipe,
            nutrition: asObject(item.nutrition),
            nutrition_status: String(item.nutrition_status),
            blockers: Array.isArray(item.blockers) ? item.blockers : [],
            warnings: Array.isArray(item.warnings) ? item.warnings : [],
            note: item.note == null ? null : String(item.note),
        })),
    };
}

async function createDraftItemsInTransaction(
    tx: DatabaseTransaction,
    input: {
        userId: string;
        draftId: string;
        scope: PlanningScope;
        items: PlanItemInput[];
        startDate: string;
        endDate: string;
        preferences: GuidancePreferences;
        allowRepeats: boolean;
    },
) {
    // prepareDraftItems inserts rows against the supplied draft ID; keeping the
    // full candidate validation and persistence in one transaction prevents a
    // partially visible proposal.
    return prepareDraftItems(tx, input);
}

export async function createGuidedPlanDraft(
    inputValue: unknown,
    userId: string,
) {
    const input = createPlanDraftSchema.parse(inputValue);
    if (
        !validDate(input.start_date) ||
        !validDate(input.end_date) ||
        daysBetween(input.start_date, input.end_date) < 0 ||
        daysBetween(input.start_date, input.end_date) > 6
    ) {
        throw new Error(
            "A guided plan must cover one to seven valid local dates",
        );
    }
    if (!validateTz(input.timezone)) throw new Error("Invalid timezone");
    const generatedCount = input.items.filter((item) =>
        Boolean(item.generated_recipe),
    ).length;
    const savedCount = input.items.length - generatedCount;
    if (input.mode === "saved_only" && generatedCount > 0)
        throw new Error("Saved-only plan cannot contain generated recipes");
    if (input.mode === "generated_only" && savedCount > 0)
        throw new Error("Generated-only plan cannot contain saved recipes");
    const scope: PlanningScope =
        input.scope === "household"
            ? { type: "household", householdId: input.household_id! }
            : { type: "personal" };
    const requestFingerprint = createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex");
    return withUserDatabase(userId, async (tx) => {
        const owner = scopeValues(scope, userId);
        const existing = await tx<Array<Record<string, unknown>>>`
            select id, request_fingerprint from munch.guided_plan_drafts
            where idempotency_key = ${input.idempotency_key}
              and personal_owner_user_id is not distinct from ${owner.personal}
              and household_id is not distinct from ${owner.household}
            limit 1
        `;
        if (existing[0]) {
            if (
                String(existing[0].request_fingerprint) !== requestFingerprint
            ) {
                throw new Error(
                    "GUIDANCE_CONFLICT: idempotency key was already used for a different draft",
                );
            }
            const draft = await getDraftInTransaction(
                tx,
                userId,
                String(existing[0].id),
            );
            if (!draft) throw new Error("Existing plan draft is unavailable");
            return { draft, deduplicated: true };
        }
        const basePreferences = await preferencesInTransaction(tx, userId);
        const preferencesOverride = planningPreferenceOverridesSchema.parse({
            ...(input.preferences_override ?? {}),
            ...(input.allow_repeats === undefined
                ? {}
                : { allow_repeats: input.allow_repeats }),
        });
        const preferences = { ...basePreferences, ...preferencesOverride };
        const planState = await planStateInTransaction(
            tx,
            scope,
            userId,
            input.start_date,
            input.end_date,
        );
        const headerRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guided_plan_drafts (
                personal_owner_user_id, household_id, created_by_user_id,
                start_date, end_date, timezone, mode, replace_existing,
                expected_plan_fingerprint, request_fingerprint, item_count,
                profile_version, preferences_override, idempotency_key
            ) values (
                ${owner.personal}, ${owner.household}, ${userId},
                ${input.start_date}::date, ${input.end_date}::date, ${input.timezone},
                ${input.mode}, ${input.replace_existing}, ${planFingerprint(planState)},
                ${requestFingerprint}, ${input.items.length}, ${basePreferences.version},
                ${preferencesOverride}::jsonb, ${input.idempotency_key}
            ) returning id
        `;
        const draftId = String(headerRows[0]?.id ?? "");
        if (!draftId) throw new Error("Plan draft creation returned no ID");
        await createDraftItemsInTransaction(tx, {
            userId,
            draftId,
            scope,
            items: input.items,
            startDate: input.start_date,
            endDate: input.end_date,
            preferences,
            allowRepeats: preferences.allow_repeats,
        });
        const draft = await getDraftInTransaction(tx, userId, draftId);
        if (!draft)
            throw new Error("Created plan draft could not be read back");
        return { draft, deduplicated: false };
    });
}

export async function getGuidedPlanDraft(userId: string, draftId: string) {
    return withUserDatabase(userId, async (tx) =>
        getDraftInTransaction(tx, userId, draftId),
    );
}

export async function updateGuidedPlanDraft(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    items: unknown;
    preferencesOverride?: unknown;
}) {
    if (
        !Array.isArray(input.items) ||
        input.items.length < 1 ||
        input.items.length > 35
    )
        throw new Error("Plan items are invalid");
    const items = input.items.map((item) => planItemSchema.parse(item));
    return withUserDatabase(input.userId, async (tx) => {
        const headerRows = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_drafts where id = ${input.draftId} for update
        `;
        const header = headerRows[0];
        if (!header) throw new Error("Plan draft was not found");
        if (header.status !== "draft")
            throw new Error("Only a draft can be edited");
        if (Number(header.version) !== input.expectedVersion)
            throw new Error(
                "GUIDANCE_CONFLICT: plan draft changed; refresh before editing",
            );
        if (new Date(String(header.expires_at)).getTime() <= Date.now())
            throw new Error("Plan draft has expired");
        const generatedCount = items.filter((item) =>
            Boolean(item.generated_recipe),
        ).length;
        if (header.mode === "saved_only" && generatedCount > 0)
            throw new Error("Saved-only plan cannot contain generated recipes");
        if (header.mode === "generated_only" && generatedCount !== items.length)
            throw new Error("Generated-only plan cannot contain saved recipes");
        const scope: PlanningScope = header.personal_owner_user_id
            ? { type: "personal" }
            : { type: "household", householdId: String(header.household_id) };
        const basePreferences = await preferencesInTransaction(
            tx,
            input.userId,
        );
        const preferencesOverride =
            input.preferencesOverride === undefined
                ? planningPreferenceOverridesSchema.parse(
                      asObject(header.preferences_override),
                  )
                : planningPreferenceOverridesSchema.parse(
                      input.preferencesOverride,
                  );
        const preferences = { ...basePreferences, ...preferencesOverride };
        await tx`delete from munch.guided_plan_draft_items where plan_draft_id = ${input.draftId}`;
        await createDraftItemsInTransaction(tx, {
            userId: input.userId,
            draftId: input.draftId,
            scope,
            items,
            startDate: dateOnlyString(header.start_date),
            endDate: dateOnlyString(header.end_date),
            preferences,
            allowRepeats: preferences.allow_repeats,
        });
        await tx`
            update munch.guided_plan_drafts
            set version = version + 1, item_count = ${items.length},
                profile_version = ${basePreferences.version},
                preferences_override = ${preferencesOverride}::jsonb, updated_at = now()
            where id = ${input.draftId}
        `;
        return getDraftInTransaction(tx, input.userId, input.draftId);
    });
}

export async function cancelGuidedPlanDraft(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    confirm: boolean;
}) {
    if (!input.confirm)
        throw new Error(
            "Explicit confirmation is required to cancel the plan draft",
        );
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            update munch.guided_plan_drafts
            set status = 'cancelled', version = version + 1, updated_at = now()
            where id = ${input.draftId} and version = ${input.expectedVersion} and status = 'draft'
            returning id
        `;
        if (!rows[0])
            throw new Error(
                "GUIDANCE_CONFLICT: draft is missing, changed or already closed",
            );
        return { cancelled: true, draft_id: input.draftId };
    });
}

function jsonArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String);
    try {
        const parsed: unknown = JSON.parse(String(value ?? "[]"));
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

function resolvedRecipeFromDraft(value: unknown): RecipeInput {
    const parsed = asObject(value);
    if (typeof parsed.name !== "string" || !Array.isArray(parsed.ingredients)) {
        throw new Error(
            "Generated recipe nutrition resolution is unavailable; edit or replace this candidate",
        );
    }
    return parsed as unknown as RecipeInput;
}

export async function commitGuidedPlanDraft(input: {
    userId: string;
    draftId: string;
    expectedVersion: number;
    confirm: boolean;
}) {
    if (!input.confirm)
        throw new Error(
            "Explicit confirmation is required to commit the meal plan",
        );
    return withUserDatabase(input.userId, async (tx) => {
        const headers = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_drafts where id = ${input.draftId} for update
        `;
        const header = headers[0];
        if (!header) throw new Error("Plan draft was not found");
        if (header.status === "committed") {
            const existing = await getDraftInTransaction(
                tx,
                input.userId,
                input.draftId,
            );
            return { draft: existing, deduplicated: true };
        }
        if (header.status !== "draft")
            throw new Error("Only an open draft can be committed");
        if (Number(header.version) !== input.expectedVersion)
            throw new Error(
                "GUIDANCE_CONFLICT: plan draft changed; refresh before confirming",
            );
        if (new Date(String(header.expires_at)).getTime() <= Date.now())
            throw new Error("Plan draft has expired; create a fresh plan");
        const scope: PlanningScope = header.personal_owner_user_id
            ? { type: "personal" }
            : { type: "household", householdId: String(header.household_id) };
        const startDate = dateOnlyString(header.start_date);
        const endDate = dateOnlyString(header.end_date);
        const currentPlan = await planStateInTransaction(
            tx,
            scope,
            input.userId,
            startDate,
            endDate,
        );
        if (
            planFingerprint(currentPlan) !==
            String(header.expected_plan_fingerprint)
        ) {
            throw new Error(
                "GUIDANCE_CONFLICT: the calendar changed after this draft was created; refresh and review it",
            );
        }
        const preferences = await preferencesInTransaction(tx, input.userId);
        if (Number(header.profile_version) !== preferences.version) {
            throw new Error(
                "GUIDANCE_CONFLICT: preferences changed since this plan was reviewed; refresh the draft",
            );
        }
        const storedOverride = planningPreferenceOverridesSchema.parse(
            asObject(header.preferences_override),
        );
        const effectivePreferences = { ...preferences, ...storedOverride };
        const items = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_draft_items
            where plan_draft_id = ${input.draftId} order by position for update
        `;
        if (items.length !== Number(header.item_count))
            throw new Error("Plan draft items changed; refresh the draft");
        for (const item of items) {
            const previousBlockers = jsonArray(item.blockers);
            if (previousBlockers.length)
                throw new Error(
                    `Plan item ${Number(item.position) + 1} needs edits before it can be committed: ${previousBlockers.join("; ")}`,
                );
            const recipe =
                item.source_type === "generated"
                    ? (asObject(
                          item.generated_recipe,
                      ) as unknown as GeneratedRecipeProposal)
                    : candidateFromSaved(
                          (await recipeForScope(
                              tx,
                              input.userId,
                              scope,
                              String(item.recipe_id),
                              String(item.recipe_revision_id),
                          )) ?? {},
                      );
            if (!recipe || typeof recipe.name !== "string")
                throw new Error("A selected recipe is no longer available");
            const constraint = checkRecipeConstraints(
                recipe,
                effectivePreferences,
            );
            if (constraint.blockers.length)
                throw new Error(
                    `Current preferences block ${recipe.name}: ${constraint.blockers.join("; ")}`,
                );
        }

        const replacedSlots = new Set(
            items.map(
                (item) =>
                    `${dateOnlyString(item.planned_date)}:${String(item.meal_slot)}`,
            ),
        );
        if (header.replace_existing === true && currentPlan.length > 0) {
            for (const previous of currentPlan) {
                if (
                    !replacedSlots.has(
                        `${dateOnlyString(previous.planned_date)}:${String(previous.meal_slot)}`,
                    )
                ) {
                    continue;
                }
                const archived = await tx<Array<{ id: string }>>`
                    update munch.planned_meals
                    set deleted_at = now(), version = version + 1,
                        updated_by_user_id = ${input.userId}, updated_at = now()
                    where id = ${String(previous.id)}
                      and version = ${Number(previous.version)}
                      and deleted_at is null
                    returning id
                `;
                if (!archived[0])
                    throw new Error(
                        "GUIDANCE_CONFLICT: the calendar changed while replacing planned meals",
                    );
            }
        }

        const committedMeals: Array<Record<string, unknown>> = [];
        for (const item of items) {
            let recipeId =
                item.recipe_id == null ? null : String(item.recipe_id);
            let revisionId =
                item.recipe_revision_id == null
                    ? null
                    : String(item.recipe_revision_id);
            if (item.source_type === "generated") {
                const resolved = resolvedRecipeFromDraft(item.resolved_recipe);
                const saved = await saveRecipeInTransaction(tx, {
                    userId: input.userId,
                    scope,
                    recipe: resolved,
                    idempotencyKey: `guided:${input.draftId}:${String(item.id)}:recipe`,
                });
                recipeId = saved.recipeId;
                revisionId = saved.revisionId;
                await tx`
                    update munch.guided_plan_draft_items
                    set recipe_id = ${recipeId}, recipe_revision_id = ${revisionId}, updated_at = now()
                    where id = ${String(item.id)}
                `;
            }
            if (!recipeId || !revisionId)
                throw new Error("Plan item has no resolved recipe revision");
            const planned = await scheduleRecipeInTransaction(tx, {
                userId: input.userId,
                scope,
                recipeId,
                recipeRevisionId: revisionId,
                plannedDate: dateOnlyString(item.planned_date),
                mealSlot: String(item.meal_slot) as
                    "breakfast" | "lunch" | "dinner" | "snack",
                servings: Number(item.servings),
                note: item.note == null ? undefined : String(item.note),
                idempotencyKey: `guided:${input.draftId}:${String(item.id)}:planned`,
            });
            committedMeals.push({
                planned_meal_id: String(planned.id),
                planned_date: dateOnlyString(planned.planned_date),
                meal_slot: planned.meal_slot,
                recipe_id: recipeId,
                recipe_revision_id: revisionId,
                servings: Number(planned.servings),
            });
        }

        if (header.replace_existing === true && currentPlan.length > 0) {
            for (const previous of currentPlan) {
                const replacement = committedMeals.find(
                    (meal) =>
                        dateOnlyString(meal.planned_date) ===
                            dateOnlyString(previous.planned_date) &&
                        meal.meal_slot === previous.meal_slot,
                );
                if (!replacement) continue;
                await tx`
                    insert into munch.guided_plan_changes (
                        planned_meal_id, user_id, old_recipe_id, old_recipe_revision_id,
                        new_recipe_id, new_recipe_revision_id, change_type,
                        prior_version, after_version, idempotency_key
                    ) values (
                        ${String(previous.id)}, ${input.userId}, ${String(previous.recipe_id)},
                        ${String(previous.recipe_revision_id)}, ${String(replacement.recipe_id)},
                        ${String(replacement.recipe_revision_id)}, 'replace',
                        ${Number(previous.version)}, ${Number(previous.version) + 1},
                        ${`guided:${input.draftId}:replace:${String(previous.id)}`}
                    ) on conflict (user_id, idempotency_key) do nothing
                `;
            }
        }

        const commitId = randomUUID();
        await tx`
            update munch.guided_plan_drafts
            set status = 'committed', commit_id = ${commitId}, committed_at = now(),
                version = version + 1, updated_at = now()
            where id = ${input.draftId}
        `;
        return {
            draft: await getDraftInTransaction(tx, input.userId, input.draftId),
            committed_meals: committedMeals,
            commit_id: commitId,
            deduplicated: false,
        };
    });
}

function normalizedShoppingName(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

export async function previewGuidedPlanGroceries(
    userId: string,
    draftId: string,
) {
    return withUserDatabase(userId, async (tx) => {
        const draftRows = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_drafts where id = ${draftId}
        `;
        const draft = draftRows[0];
        if (!draft) throw new Error("Plan draft was not found");
        if (draft.status !== "committed")
            throw new Error("Commit the meal plan before reviewing groceries");
        const items = await tx<Array<Record<string, unknown>>>`
            select item.id, item.planned_date, item.meal_slot, item.servings,
                   recipe.id as recipe_id, recipe.name as recipe_name,
                   revision.id as recipe_revision_id, revision.servings as recipe_servings,
                   ingredient.name, ingredient.quantity, ingredient.unit, ingredient.optional
            from munch.guided_plan_draft_items item
            join munch.recipes recipe on recipe.id = item.recipe_id
            join munch.recipe_revisions revision on revision.id = item.recipe_revision_id
            join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
            where item.plan_draft_id = ${draftId}
            order by item.position, ingredient.position
        `;
        const grouped = new Map<string, Record<string, unknown>>();
        for (const row of items) {
            if (row.optional === true || row.quantity == null) continue;
            const name = String(row.name);
            const unit = row.unit == null ? null : String(row.unit);
            const key = `${normalizedShoppingName(name)}|${normalizedShoppingName(unit ?? "")}`;
            const scale =
                Number(row.servings) /
                Math.max(Number(row.recipe_servings), 0.001);
            const quantity = Number(row.quantity) * scale;
            const current = grouped.get(key);
            if (current) {
                current.quantity = Number(current.quantity) + quantity;
            } else {
                const planned = await tx<Array<Record<string, unknown>>>`
                    select id from munch.planned_meals
                    where deleted_at is null
                      and personal_owner_user_id is not distinct from ${draft.personal_owner_user_id}
                      and household_id is not distinct from ${draft.household_id}
                      and planned_date = ${dateOnlyString(row.planned_date)}::date
                      and meal_slot = ${String(row.meal_slot)}
                      and recipe_revision_id = ${String(row.recipe_revision_id)}
                    order by created_at desc limit 1
                `;
                grouped.set(key, {
                    name,
                    quantity,
                    unit,
                    source_recipe_id: String(row.recipe_id),
                    source_recipe_revision_id: String(row.recipe_revision_id),
                    source_planned_meal_id: planned[0]
                        ? String(planned[0].id)
                        : null,
                    recipes: [String(row.recipe_name)],
                });
            }
            const entry = grouped.get(key)!;
            if (!Array.isArray(entry.recipes)) entry.recipes = [];
            if (
                !(entry.recipes as string[]).includes(String(row.recipe_name))
            ) {
                (entry.recipes as string[]).push(String(row.recipe_name));
            }
        }
        const owner = scopeValues(
            draft.personal_owner_user_id
                ? { type: "personal" }
                : {
                      type: "household",
                      householdId: String(draft.household_id),
                  },
            userId,
        );
        const lists = await tx<Array<{ id: string }>>`
            select id from munch.grocery_lists where status = 'active'
              and personal_owner_user_id is not distinct from ${owner.personal}
              and household_id is not distinct from ${owner.household} limit 1
        `;
        const activeItems = lists[0]
            ? await tx<Array<Record<string, unknown>>>`
                  select normalized_name, unit from munch.grocery_items
                  where grocery_list_id = ${lists[0].id} and deleted_at is null and purchased_at is null
              `
            : [];
        const existingKeys = new Set(
            activeItems.map(
                (item) =>
                    `${normalizedShoppingName(String(item.normalized_name))}|${normalizedShoppingName(String(item.unit ?? ""))}`,
            ),
        );
        const suggestions = [...grouped.entries()].map(
            ([key, value], index) => ({
                index,
                name: String(value.name ?? ""),
                quantity: Number(value.quantity ?? 0),
                unit: value.unit == null ? null : String(value.unit),
                recipes: Array.isArray(value.recipes)
                    ? value.recipes.map(String)
                    : [],
                source_recipe_id: String(value.source_recipe_id ?? ""),
                source_recipe_revision_id: String(
                    value.source_recipe_revision_id ?? "",
                ),
                source_planned_meal_id:
                    value.source_planned_meal_id == null
                        ? null
                        : String(value.source_planned_meal_id),
                already_on_list: existingKeys.has(key),
            }),
        );
        return {
            draft_id: draftId,
            scope: draft.personal_owner_user_id ? "personal" : "household",
            suggestions,
            confirmation_required: true,
            note: "Planning and grocery review do not change pantry inventory or mark any food as eaten.",
        };
    });
}

export async function confirmGuidedPlanGroceries(input: {
    userId: string;
    draftId: string;
    selectedIndices: number[];
    confirm: boolean;
    idempotencyKey: string;
}) {
    if (!input.confirm)
        throw new Error(
            "Separate confirmation is required before adding groceries",
        );
    requireIdempotencyKey(input.idempotencyKey, "Grocery confirmation");
    const preview = await previewGuidedPlanGroceries(
        input.userId,
        input.draftId,
    );
    const draft = await getGuidedPlanDraft(input.userId, input.draftId);
    if (!draft || draft.status !== "committed")
        throw new Error("Committed plan is unavailable");
    const chosen = new Set(input.selectedIndices);
    if (
        chosen.size > 60 ||
        [...chosen].some(
            (index) =>
                !Number.isInteger(index) ||
                index < 0 ||
                index >= preview.suggestions.length,
        )
    ) {
        throw new Error("Selected grocery item indices are invalid");
    }
    const items: GroceryItemInput[] = preview.suggestions
        .filter(
            (suggestion) =>
                chosen.has(suggestion.index) && !suggestion.already_on_list,
        )
        .map((suggestion) => ({
            name: String(suggestion.name),
            quantity: numberOrNull(suggestion.quantity) ?? undefined,
            unit: suggestion.unit == null ? undefined : String(suggestion.unit),
            note: `For planned recipe${(suggestion.recipes as string[]).length === 1 ? "" : "s"}: ${(suggestion.recipes as string[]).join(", ")}`,
            sourceRecipeId: String(suggestion.source_recipe_id),
            sourceRecipeRevisionId: String(
                suggestion.source_recipe_revision_id,
            ),
            sourcePlannedMealId:
                suggestion.source_planned_meal_id == null
                    ? undefined
                    : String(suggestion.source_planned_meal_id),
            idempotencyKey: `${input.idempotencyKey}:${suggestion.index}`,
        }));
    if (items.length === 0)
        return { groceryListId: null, items: [], addedCount: 0 };
    const scope: PlanningScope =
        draft.scope.type === "personal"
            ? { type: "personal" }
            : { type: "household", householdId: draft.scope.householdId };
    const result = await addGroceryItems({
        userId: input.userId,
        scope,
        items,
    });
    return { ...result, addedCount: result.items.length, confirmed: true };
}

function recipeVarietyFromRow(row: Record<string, unknown>): VarietyRecipe {
    const metadata = recipeMetadata(row.guidance_metadata);
    const ingredients = Array.isArray(row.ingredients)
        ? row.ingredients.map((item) => String(asObject(item).name ?? item))
        : [];
    return {
        name: String(row.name),
        ingredients,
        cuisineTags: metadata.cuisine_tags,
        primaryProtein: metadata.primary_protein,
        cookingMethods: metadata.cooking_methods,
    };
}

function numberDifference(next: unknown, previous: unknown): number | null {
    const a = numberOrNull(next);
    const b = numberOrNull(previous);
    return a == null || b == null ? null : Number((a - b).toFixed(1));
}

export async function previewMealSwaps(input: {
    userId: string;
    plannedMealId: string;
    limit?: number;
}) {
    const limit = Math.max(3, Math.min(5, Math.floor(input.limit ?? 5)));
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select planned.id, planned.planned_date, planned.meal_slot, planned.servings,
                   planned.version, planned.recipe_id, planned.recipe_revision_id,
                   recipe.name as recipe_name, recipe.personal_owner_user_id,
                   recipe.household_id, revision.servings as recipe_servings,
                   revision.nutrition_status, revision.calories_per_serving,
                   revision.protein_g_per_serving, revision.preparation_minutes,
                   revision.cooking_minutes, revision.guidance_metadata,
                   coalesce(jsonb_agg(jsonb_build_object('name', ingredient.name, 'quantity', ingredient.quantity, 'unit', ingredient.unit)
                       order by ingredient.position) filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
            from munch.planned_meals planned
            join munch.recipes recipe on recipe.id = planned.recipe_id
            join munch.recipe_revisions revision on revision.id = planned.recipe_revision_id
            left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
            where planned.id = ${input.plannedMealId} and planned.deleted_at is null
            group by planned.id, recipe.id, revision.id limit 1
        `;
        const current = rows[0];
        if (!current)
            throw new Error(
                "Planned meal was not found or is not available in this scope",
            );
        const scope: PlanningScope = current.personal_owner_user_id
            ? { type: "personal" }
            : { type: "household", householdId: String(current.household_id) };
        const preferences = await preferencesInTransaction(tx, input.userId);
        const owner = scopeValues(scope, input.userId);
        const candidates =
            scope.type === "personal"
                ? await tx<Array<Record<string, unknown>>>`
                  select recipe.id, recipe.name, revision.id as recipe_revision_id,
                         revision.servings, revision.nutrition_status,
                         revision.calories_per_serving, revision.protein_g_per_serving,
                         revision.preparation_minutes, revision.cooking_minutes,
                         revision.guidance_metadata,
                         coalesce(jsonb_agg(jsonb_build_object('name', ingredient.name, 'quantity', ingredient.quantity, 'unit', ingredient.unit)
                             order by ingredient.position) filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
                  from munch.recipes recipe
                  join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                      and revision.revision_number = recipe.current_revision_number
                  left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
                  where recipe.personal_owner_user_id = ${input.userId}
                    and recipe.archived_at is null and recipe.id <> ${String(current.recipe_id)}
                  group by recipe.id, revision.id order by recipe.updated_at desc limit 40
              `
                : await tx<Array<Record<string, unknown>>>`
                  select recipe.id, recipe.name, revision.id as recipe_revision_id,
                         revision.servings, revision.nutrition_status,
                         revision.calories_per_serving, revision.protein_g_per_serving,
                         revision.preparation_minutes, revision.cooking_minutes,
                         revision.guidance_metadata,
                         coalesce(jsonb_agg(jsonb_build_object('name', ingredient.name, 'quantity', ingredient.quantity, 'unit', ingredient.unit)
                             order by ingredient.position) filter (where ingredient.id is not null), '[]'::jsonb) as ingredients
                  from munch.recipes recipe
                  join munch.recipe_revisions revision on revision.recipe_id = recipe.id
                      and revision.revision_number = recipe.current_revision_number
                  left join munch.recipe_ingredients ingredient on ingredient.recipe_revision_id = revision.id
                  where recipe.household_id = ${scope.householdId}
                    and recipe.archived_at is null and recipe.id <> ${String(current.recipe_id)}
                  group by recipe.id, revision.id order by recipe.updated_at desc limit 40
              `;
        const originalProposal = candidateFromSaved(current);
        const oldNutrition = {
            calories: numberOrNull(current.calories_per_serving),
            protein_g: numberOrNull(current.protein_g_per_serving),
        };
        const originalVariety = recipeVarietyFromRow(current);
        const scored = candidates
            .flatMap((candidate) => {
                const proposal = candidateFromSaved(candidate);
                const constraints = checkRecipeConstraints(
                    proposal,
                    preferences,
                );
                const variety = recipeVarietyFromRow(candidate);
                if (
                    constraints.blockers.length ||
                    isNearDuplicate(
                        recipeFingerprint(variety),
                        recipeFingerprint(originalVariety),
                    )
                )
                    return [];
                const calories = numberOrNull(candidate.calories_per_serving);
                const protein = numberOrNull(candidate.protein_g_per_serving);
                const nutritionDistance =
                    (oldNutrition.calories == null || calories == null
                        ? 0
                        : Math.abs(calories - oldNutrition.calories) /
                          Math.max(150, oldNutrition.calories)) +
                    (oldNutrition.protein_g == null || protein == null
                        ? 0
                        : Math.abs(protein - oldNutrition.protein_g) /
                          Math.max(20, oldNutrition.protein_g));
                const candidateMinutes =
                    Number(candidate.preparation_minutes ?? 0) +
                    Number(candidate.cooking_minutes ?? 0);
                const originalMinutes =
                    Number(current.preparation_minutes ?? 0) +
                    Number(current.cooking_minutes ?? 0);
                const timePenalty =
                    preferences.max_total_minutes != null &&
                    candidateMinutes > preferences.max_total_minutes
                        ? 20
                        : 0;
                const score =
                    nutritionDistance * 25 +
                    timePenalty -
                    varietyScore(variety, [originalVariety]) / 20;
                return [
                    {
                        recipe_id: String(candidate.id),
                        recipe_revision_id: String(
                            candidate.recipe_revision_id,
                        ),
                        recipe_name: String(candidate.name),
                        nutrition_status: String(candidate.nutrition_status),
                        calories_per_serving: calories,
                        protein_g_per_serving: protein,
                        calories_delta_per_serving: numberDifference(
                            calories,
                            oldNutrition.calories,
                        ),
                        protein_delta_per_serving: numberDifference(
                            protein,
                            oldNutrition.protein_g,
                        ),
                        total_minutes: candidateMinutes,
                        time_delta_minutes: candidateMinutes - originalMinutes,
                        warnings: constraints.warnings,
                        score,
                    },
                ];
            })
            .sort((a, b) => a.score - b.score)
            .slice(0, limit);
        const dayRows = await tx<Array<Record<string, unknown>>>`
            select sum(revision.calories_per_serving * planned.servings) as calories,
                   sum(revision.protein_g_per_serving * planned.servings) as protein_g
            from munch.planned_meals planned
            join munch.recipe_revisions revision on revision.id = planned.recipe_revision_id
            where planned.deleted_at is null
              and planned.personal_owner_user_id is not distinct from ${owner.personal}
              and planned.household_id is not distinct from ${owner.household}
              and planned.planned_date = ${dateOnlyString(current.planned_date)}::date
        `;
        const before = {
            calories: numberOrNull(dayRows[0]?.calories),
            protein_g: numberOrNull(dayRows[0]?.protein_g),
        };
        const servings = Number(current.servings);
        return {
            planned_meal_id: String(current.id),
            expected_version: Number(current.version),
            planned_date: dateOnlyString(current.planned_date),
            meal_slot: current.meal_slot,
            current: {
                recipe_id: String(current.recipe_id),
                recipe_revision_id: String(current.recipe_revision_id),
                recipe_name: String(current.recipe_name),
                nutrition_status: String(current.nutrition_status),
                calories_per_serving: oldNutrition.calories,
                protein_g_per_serving: oldNutrition.protein_g,
            },
            day_totals_before: before,
            candidates: scored.map((candidate) => ({
                ...candidate,
                day_totals_after: dayTotalsAfterMealSwap({
                    dayTotals: before,
                    currentPerServing: oldNutrition,
                    replacementPerServing: {
                        calories: candidate.calories_per_serving,
                        protein_g: candidate.protein_g_per_serving,
                    },
                    servings,
                }),
            })),
            confirmation_required: true,
            note: originalProposal.name,
        };
    });
}

export async function commitMealSwap(input: {
    userId: string;
    plannedMealId: string;
    recipeId: string;
    recipeRevisionId: string;
    expectedVersion: number;
    confirm: boolean;
    idempotencyKey: string;
}) {
    if (!input.confirm)
        throw new Error(
            "Explicit confirmation is required to swap a planned meal",
        );
    requireIdempotencyKey(input.idempotencyKey, "Meal swap");
    return withUserDatabase(input.userId, async (tx) => {
        const duplicate = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_changes
            where user_id = ${input.userId} and idempotency_key = ${input.idempotencyKey}
            limit 1
        `;
        if (duplicate[0]) return { change: duplicate[0], deduplicated: true };
        const rows = await tx<Array<Record<string, unknown>>>`
            select planned.id, planned.version, planned.recipe_id, planned.recipe_revision_id,
                   planned.personal_owner_user_id, planned.household_id,
                   planned.planned_date, planned.meal_slot
            from munch.planned_meals planned
            where planned.id = ${input.plannedMealId} and planned.deleted_at is null
            for update
        `;
        const planned = rows[0];
        if (!planned)
            throw new Error(
                "Planned meal was not found or is not available in this scope",
            );
        if (Number(planned.version) !== input.expectedVersion)
            throw new Error(
                "GUIDANCE_CONFLICT: this planned meal changed; refresh swap choices",
            );
        const scope: PlanningScope = planned.personal_owner_user_id
            ? { type: "personal" }
            : { type: "household", householdId: String(planned.household_id) };
        const candidate = await recipeForScope(
            tx,
            input.userId,
            scope,
            input.recipeId,
            input.recipeRevisionId,
        );
        if (!candidate)
            throw new Error(
                "Replacement recipe revision is unavailable in this planning scope",
            );
        const preferences = await preferencesInTransaction(tx, input.userId);
        const constraint = checkRecipeConstraints(
            candidateFromSaved(candidate),
            preferences,
        );
        if (constraint.blockers.length)
            throw new Error(
                `Replacement recipe is blocked: ${constraint.blockers.join("; ")}`,
            );
        const version = Number(planned.version);
        const updated = await tx<Array<Record<string, unknown>>>`
            update munch.planned_meals
            set recipe_id = ${input.recipeId}, recipe_revision_id = ${input.recipeRevisionId},
                updated_by_user_id = ${input.userId}, updated_at = now(), version = version + 1
            where id = ${input.plannedMealId} and version = ${version} and deleted_at is null
            returning id, version, planned_date, meal_slot, recipe_id, recipe_revision_id
        `;
        if (!updated[0])
            throw new Error(
                "GUIDANCE_CONFLICT: planned meal changed during swap",
            );
        const changeRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guided_plan_changes (
                planned_meal_id, user_id, old_recipe_id, old_recipe_revision_id,
                new_recipe_id, new_recipe_revision_id, change_type,
                prior_version, after_version, idempotency_key
            ) values (
                ${input.plannedMealId}, ${input.userId}, ${String(planned.recipe_id)},
                ${String(planned.recipe_revision_id)}, ${input.recipeId},
                ${input.recipeRevisionId}, 'swap', ${version}, ${version + 1},
                ${input.idempotencyKey}
            ) returning id, planned_meal_id, old_recipe_id, old_recipe_revision_id,
                      new_recipe_id, new_recipe_revision_id, after_version, created_at
        `;
        return {
            change: changeRows[0],
            planned_meal: updated[0],
            deduplicated: false,
        };
    });
}

export async function undoMealSwap(input: {
    userId: string;
    changeId: string;
    expectedVersion: number;
    confirm: boolean;
    idempotencyKey: string;
}) {
    if (!input.confirm)
        throw new Error("Explicit confirmation is required to undo a swap");
    requireIdempotencyKey(input.idempotencyKey, "Swap undo");
    return withUserDatabase(input.userId, async (tx) => {
        const duplicate = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_changes
            where user_id = ${input.userId} and idempotency_key = ${input.idempotencyKey}
            limit 1
        `;
        if (duplicate[0]) return { change: duplicate[0], deduplicated: true };
        const changes = await tx<Array<Record<string, unknown>>>`
            select * from munch.guided_plan_changes
            where id = ${input.changeId} and user_id = ${input.userId}
              and change_type = 'swap' and undone_at is null
            for update
        `;
        const change = changes[0];
        if (
            !change ||
            change.old_recipe_id == null ||
            change.old_recipe_revision_id == null
        ) {
            throw new Error(
                "Swap cannot be undone because its prior recipe is unavailable",
            );
        }
        const mealRows = await tx<Array<Record<string, unknown>>>`
            select id, version, recipe_id, recipe_revision_id, personal_owner_user_id, household_id
            from munch.planned_meals where id = ${String(change.planned_meal_id)} and deleted_at is null
            for update
        `;
        const planned = mealRows[0];
        if (!planned)
            throw new Error(
                "Planned meal is unavailable; this swap cannot be undone",
            );
        if (
            Number(planned.version) !== input.expectedVersion ||
            Number(planned.version) !== Number(change.after_version)
        ) {
            throw new Error(
                "GUIDANCE_CONFLICT: the planned meal changed after the swap; refresh before undoing",
            );
        }
        const scope: PlanningScope = planned.personal_owner_user_id
            ? { type: "personal" }
            : { type: "household", householdId: String(planned.household_id) };
        const prior = await recipeForScope(
            tx,
            input.userId,
            scope,
            String(change.old_recipe_id),
            String(change.old_recipe_revision_id),
        );
        if (!prior)
            throw new Error(
                "The original recipe is no longer available in this planning scope",
            );
        const version = Number(planned.version);
        const updated = await tx<Array<Record<string, unknown>>>`
            update munch.planned_meals
            set recipe_id = ${String(change.old_recipe_id)},
                recipe_revision_id = ${String(change.old_recipe_revision_id)},
                updated_by_user_id = ${input.userId}, updated_at = now(), version = version + 1
            where id = ${String(planned.id)} and version = ${version} and deleted_at is null
            returning id, version, recipe_id, recipe_revision_id
        `;
        if (!updated[0])
            throw new Error(
                "GUIDANCE_CONFLICT: planned meal changed during undo",
            );
        await tx`
            update munch.guided_plan_changes set undone_at = now()
            where id = ${input.changeId} and user_id = ${input.userId}
        `;
        const undoRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.guided_plan_changes (
                planned_meal_id, user_id, old_recipe_id, old_recipe_revision_id,
                new_recipe_id, new_recipe_revision_id, change_type,
                prior_version, after_version, idempotency_key
            ) values (
                ${String(planned.id)}, ${input.userId}, ${String(planned.recipe_id)},
                ${String(planned.recipe_revision_id)}, ${String(change.old_recipe_id)},
                ${String(change.old_recipe_revision_id)}, 'undo', ${version}, ${version + 1},
                ${input.idempotencyKey}
            ) returning id, planned_meal_id, after_version, created_at
        `;
        return {
            change: undoRows[0],
            planned_meal: updated[0],
            deduplicated: false,
        };
    });
}

function calendarDates(startDate: string, endDate: string): string[] {
    const count = daysBetween(startDate, endDate);
    return Array.from({ length: count + 1 }, (_, index) =>
        shiftLocalDate(startDate, index),
    );
}

export async function getWeeklyGuidance(input: {
    userId: string;
    startDate: string;
    endDate: string;
    timezone?: string;
}) {
    if (
        !validDate(input.startDate) ||
        !validDate(input.endDate) ||
        daysBetween(input.startDate, input.endDate) < 0 ||
        daysBetween(input.startDate, input.endDate) > 6
    ) {
        throw new Error(
            "Weekly guidance requires a valid date range of one to seven days",
        );
    }
    const timezone = input.timezone ?? (await getUserTimezone(input.userId));
    if (!validateTz(timezone)) throw new Error("Invalid timezone");
    const [meals, water, weights, goals, preferences, plannedMeals] =
        await Promise.all([
            getMealsInRange(
                input.userId,
                input.startDate,
                input.endDate,
                timezone,
            ),
            getWaterInRange(
                input.userId,
                input.startDate,
                input.endDate,
                timezone,
            ),
            getWeightInRange(
                input.userId,
                input.startDate,
                input.endDate,
                timezone,
            ),
            getNutritionGoals(input.userId),
            getGuidancePreferences(input.userId),
            getMealPlan({
                userId: input.userId,
                startDate: input.startDate,
                endDate: input.endDate,
                scope: "all",
            }),
        ]);
    const dates = calendarDates(input.startDate, input.endDate);
    const mealsByDate = new Map<string, typeof meals>();
    for (const meal of meals) {
        const date = dateInTz(meal.logged_at, timezone);
        const current = mealsByDate.get(date) ?? [];
        current.push(meal);
        mealsByDate.set(date, current);
    }
    const waterByDate = new Map<string, number>();
    for (const entry of water) {
        const date = dateInTz(entry.logged_at, timezone);
        waterByDate.set(date, (waterByDate.get(date) ?? 0) + entry.amount_ml);
    }
    const plannedByDate = new Map<string, number>();
    for (const planned of plannedMeals) {
        plannedByDate.set(
            planned.planned_date,
            (plannedByDate.get(planned.planned_date) ?? 0) + 1,
        );
    }
    const plannedIds = plannedMeals.map((meal) => meal.planned_meal_id);
    const loggedPlanIds = plannedIds.length
        ? await withUserDatabase(input.userId, async (tx) => {
              const idJson = JSON.stringify(plannedIds);
              const rows = await tx<Array<{ source_planned_meal_id: string }>>`
                  select distinct source_planned_meal_id
                  from munch.meals
                  where user_id = ${input.userId}
                    and source_planned_meal_id in (
                        select value::uuid from jsonb_array_elements_text((${idJson}::text)::jsonb)
                    )
              `;
              return new Set(
                  rows.map((row) => String(row.source_planned_meal_id)),
              );
          })
        : new Set<string>();
    const loggedPlannedByDate = new Map<string, number>();
    for (const planned of plannedMeals) {
        if (loggedPlanIds.has(planned.planned_meal_id)) {
            loggedPlannedByDate.set(
                planned.planned_date,
                (loggedPlannedByDate.get(planned.planned_date) ?? 0) + 1,
            );
        }
    }
    const days = dates.map((date) => {
        const dayMeals = mealsByDate.get(date) ?? [];
        return {
            date,
            meals: dayMeals.map((meal) => ({
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fat_g: meal.fat_g,
                nutrition_status:
                    meal.calories == null && meal.protein_g == null
                        ? ("unavailable" as const)
                        : meal.calories == null ||
                            meal.protein_g == null ||
                            meal.carbs_g == null ||
                            meal.fat_g == null
                          ? ("partial" as const)
                          : ("complete" as const),
            })),
            waterMl: waterByDate.get(date) ?? 0,
            plannedMeals: plannedByDate.get(date) ?? 0,
            loggedPlannedMeals: loggedPlannedByDate.get(date) ?? 0,
        };
    });
    const revision = await withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, revision, objective, targets, created_at
            from munch.guidance_goal_revisions
            where user_id = ${input.userId}
              and created_at < ((${input.endDate}::date + 1)::timestamp at time zone ${timezone})
            order by revision desc limit 1
        `;
        return rows[0] ?? null;
    });
    const effectiveTargets = revision
        ? goalTargetsSchema.safeParse(asObject(revision.targets)).success
            ? goalTargetsSchema.parse(asObject(revision.targets))
            : goalsToTargets(goals as unknown as Record<string, unknown> | null)
        : goalsToTargets(goals as unknown as Record<string, unknown> | null);
    const summary = buildWeeklyCheckin({
        startDate: input.startDate,
        endDate: input.endDate,
        timezone,
        days,
        goals: {
            calories: effectiveTargets.daily_calories,
            protein_g: effectiveTargets.daily_protein_g,
            water_ml: effectiveTargets.daily_water_ml,
            revision_id: revision ? String(revision.id) : null,
        },
    });
    const orderedWeights = [...weights].sort((a, b) =>
        a.logged_at.localeCompare(b.logged_at),
    );
    const weightTrend =
        orderedWeights.length >= 2
            ? {
                  measurements: orderedWeights.length,
                  first_date: dateInTz(orderedWeights[0]!.logged_at, timezone),
                  last_date: dateInTz(
                      orderedWeights.at(-1)!.logged_at,
                      timezone,
                  ),
                  change_g: Number(
                      (
                          orderedWeights.at(-1)!.weight_g -
                          orderedWeights[0]!.weight_g
                      ).toFixed(0),
                  ),
                  note: "Descriptive change between recorded measurements; it does not establish why weight changed.",
              }
            : {
                  measurements: orderedWeights.length,
                  change_g: null,
                  note: "At least two recorded measurements are needed for a comparison.",
              };
    return {
        ...summary,
        objective: preferences.objective,
        effective_goal_revision: revision
            ? {
                  id: revision.id,
                  revision: revision.revision,
                  created_at: revision.created_at,
              }
            : null,
        historical_goal_snapshot_available: Boolean(revision),
        weight_trend: weightTrend,
        days: days.map((day) => ({
            date: day.date,
            logged_meal_count: day.meals.length,
            water_ml: day.waterMl > 0 ? day.waterMl : null,
            planned_meal_count: day.plannedMeals,
            logged_planned_meal_count: day.loggedPlannedMeals,
            calories: day.meals.some((meal) => meal.calories != null)
                ? Number(
                      day.meals
                          .reduce((sum, meal) => sum + (meal.calories ?? 0), 0)
                          .toFixed(1),
                  )
                : null,
            protein_g: day.meals.some((meal) => meal.protein_g != null)
                ? Number(
                      day.meals
                          .reduce((sum, meal) => sum + (meal.protein_g ?? 0), 0)
                          .toFixed(1),
                  )
                : null,
        })),
    };
}

export async function getDailyGuidance(input: {
    userId: string;
    date: string;
}) {
    if (!validDate(input.date))
        throw new Error("A valid local date is required");
    const timezone = await getUserTimezone(input.userId);
    const [meals, water, goals, preferences, planned] = await Promise.all([
        getMealsByDate(input.userId, input.date, timezone),
        getWaterByDate(input.userId, input.date, timezone),
        getNutritionGoals(input.userId),
        getGuidancePreferences(input.userId),
        // Feature toggles (T3): guidance context never includes a
        // disabled module — with Meal Plan off, no plan state is read
        // and no plan-derived action can be produced.
        (async () => {
            const features = await getFeatureModules(input.userId);
            if (!features.plan) return [];
            return getMealPlan({
                userId: input.userId,
                startDate: input.date,
                endDate: input.date,
                scope: "all",
            });
        })(),
    ]);
    const total = (field: "calories" | "protein_g" | "water_ml") => {
        if (field === "water_ml")
            return water.length
                ? water.reduce((sum, entry) => sum + entry.amount_ml, 0)
                : null;
        const values = meals
            .map((meal) => meal[field])
            .filter((value): value is number => value != null);
        return values.length
            ? Number(values.reduce((sum, value) => sum + value, 0).toFixed(1))
            : null;
    };
    const summary = buildDailyGuidance({
        date: input.date,
        objective: preferences.objective,
        calories: total("calories"),
        protein_g: total("protein_g"),
        water_ml: total("water_ml"),
        goals: {
            calories: goals?.daily_calories ?? null,
            protein_g: goals?.daily_protein_g ?? null,
            water_ml: goals?.daily_water_ml ?? null,
        },
        plannedMeals: planned.map((meal) => ({
            meal_slot: meal.meal_slot,
            recipe_name: meal.recipe_name,
        })),
    });
    return {
        ...summary,
        meal_count: meals.length,
        water_entry_count: water.length,
        note: "Guidance uses only recorded meals and hydration. Planned meals are not treated as consumed.",
    };
}

export async function getGoalReviewReadiness(userId: string) {
    const timezone = await getUserTimezone(userId);
    const today = dateInTz(new Date().toISOString(), timezone);
    const start = shiftLocalDate(today, -27);
    const [meals, weights, goals, preferences, revisions] = await Promise.all([
        getMealsInRange(userId, start, today, timezone),
        getWeightInRange(userId, start, today, timezone),
        getNutritionGoals(userId),
        getGuidancePreferences(userId),
        listGoalHistory(userId, 10),
    ]);
    const loggedDays = new Set(
        meals.map((meal) => dateInTz(meal.logged_at, timezone)),
    );
    const sortedWeights = [...weights].sort((a, b) =>
        a.logged_at.localeCompare(b.logged_at),
    );
    const span =
        sortedWeights.length >= 2
            ? daysBetween(
                  dateInTz(sortedWeights[0]!.logged_at, timezone),
                  dateInTz(sortedWeights.at(-1)!.logged_at, timezone),
              )
            : 0;
    const evidenceSufficient =
        loggedDays.size >= 14 && sortedWeights.length >= 3 && span >= 14;
    const reviewEnabled =
        preferences.suggestions_enabled &&
        preferences.objective !== "track_only";
    return {
        objective: preferences.objective,
        suggestions_enabled: preferences.suggestions_enabled,
        evidence: {
            window_days: 28,
            logged_nutrition_days: loggedDays.size,
            weight_measurements: sortedWeights.length,
            weight_measurement_span_days: span,
        },
        review_available: reviewEnabled && evidenceSufficient,
        status: !reviewEnabled
            ? "off"
            : evidenceSufficient
              ? "review_only"
              : "insufficient_data",
        current_targets: goals
            ? goalsToTargets(goals as unknown as Record<string, unknown>)
            : null,
        latest_goal_revision: revisions[0] ?? null,
        rationale:
            preferences.objective === "maintain"
                ? "Review recorded weight trend and user-entered targets for a maintenance objective."
                : preferences.objective === "gain"
                  ? "Review recorded weight trend and user-entered targets for a gain objective."
                  : preferences.objective === "lose"
                    ? "Review recorded weight trend and user-entered targets for a loss objective."
                    : "Track-only does not generate a target-change suggestion.",
        numeric_target_recommendation: null,
        note: "Munch does not infer a clinical calorie prescription. Any target change must be entered by the user, previewed, and explicitly confirmed.",
    };
}

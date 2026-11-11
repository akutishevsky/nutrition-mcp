import type { DatabaseTransaction } from "../platform/database.js";
import { withUserDatabase } from "../platform/database.js";
import {
    cookMediaSha256,
    cookMediaUrl,
    validateCookMediaUpload,
    type CookMediaFailure,
    type CookMediaUpload,
} from "./media.js";
import {
    saveRecipe,
    logRecipe,
    type PlanningScope,
    type RecipeInput,
} from "../planning/repository.js";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TEMPERATURE_RE = /(-?\d+(?:\.\d+)?)\s*°?\s*([fFcC])\b/g;

export type CookStatus = "active" | "finished";
export type CookSource = "website" | "mcp";
export type CookEventType =
    | "preparation"
    | "preheat"
    | "food_on"
    | "temperature_change"
    | "wrap"
    | "sauce"
    | "remove"
    | "rest"
    | "taste"
    | "note"
    | "correction"
    | "custom";
export type CookTimePrecision = "exact" | "approximate" | "unknown";

export type CookScope =
    { type: "personal" } | { type: "household"; householdId: string };

export interface CookDishInput {
    name: string;
    ingredientOrCut?: string | null;
    method?: string | null;
    flavor?: string | null;
    equipment?: string | null;
    notes?: string | null;
    actualIngredients?: unknown[];
    dishId?: string;
    recipeId?: string | null;
    recipeRevisionId?: string | null;
    recipeProgress?: RecipeCookProgress | null;
}

/**
 * Cook-mode progress for a dish started from a recipe (brief R2).
 * `steps` is the instruction list pinned from the recipe revision the
 * session was started from; the checked arrays hold positions into the
 * dish's actual_ingredients and `steps`. Stored on the dish row
 * (migration 0041) so every cook read path — the app and the MCP
 * get_cook tool — sees the same session state; there is no forked
 * model.
 */
export interface RecipeCookProgress {
    steps: string[];
    checkedIngredients: number[];
    checkedSteps: number[];
}

function checkedPositions(value: unknown, bound: number): number[] {
    if (!Array.isArray(value)) return [];
    const positions = new Set<number>();
    for (const entry of value) {
        const position = Number(entry);
        if (Number.isInteger(position) && position >= 0 && position < bound) {
            positions.add(position);
        }
    }
    return [...positions].sort((a, b) => a - b);
}

/** Normalize anything stored or received into a valid progress value. */
export function sanitizeRecipeProgress(
    value: unknown,
    ingredientCount: number,
): RecipeCookProgress | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    const source = value as Record<string, unknown>;
    const steps = Array.isArray(source.steps)
        ? source.steps
              .filter((step): step is string => typeof step === "string")
              .map((step) => step.slice(0, 20_000))
              .slice(0, 100)
        : [];
    return {
        steps,
        checkedIngredients: checkedPositions(
            source.checkedIngredients ?? source.checked_ingredients,
            ingredientCount,
        ),
        checkedSteps: checkedPositions(
            source.checkedSteps ?? source.checked_steps,
            steps.length,
        ),
    };
}

export interface CookEventInput {
    eventType: CookEventType;
    eventAt?: string;
    eventTimezone?: string;
    timePrecision?: CookTimePrecision;
    relativePhrase?: string | null;
    setpointTemperature?: number | null;
    setpointUnit?: "F" | "C" | null;
    ambientTemperature?: number | null;
    ambientUnit?: "F" | "C" | null;
    internalTemperature?: number | null;
    internalUnit?: "F" | "C" | null;
    note?: string | null;
    originalMessage?: string | null;
    dishId?: string | null;
    idempotencyKey?: string;
    correctionOfEventId?: string | null;
}

export interface ParsedCookUpdate {
    isQuestion: boolean;
    events: CookEventInput[];
    suggestions: {
        dish?: string;
        method?: string;
        flavor?: string;
        equipment?: string;
        ingredientOrCut?: string;
    };
    summary: string;
}

export interface CookMediaInput extends CookMediaUpload {
    dishId?: string | null;
    eventId?: string | null;
}

export interface CreateCookInput {
    scope?: CookScope;
    title?: string;
    cookDate?: string;
    timezone?: string;
    startedAt?: string;
    status?: CookStatus;
    notes?: string | null;
    setupSnapshot?: Record<string, unknown>;
    sourceCookId?: string | null;
    originalMessage?: string | null;
    idempotencyKey?: string;
    dishes?: CookDishInput[];
    message?: string;
    events?: CookEventInput[];
    photos?: CookMediaInput[];
    mediaFailures?: CookMediaFailure[];
    source?: CookSource;
}

export interface CookUpdateInput {
    source: CookSource;
    message?: string;
    dishId?: string | null;
    timezone?: string;
    submittedAt?: string;
    events?: CookEventInput[];
    photos?: CookMediaInput[];
    mediaFailures?: CookMediaFailure[];
    idempotencyKey?: string;
}

export interface CookOutcomeInput {
    dishId?: string | null;
    writtenFeedback?: string | null;
    overallAssessment?: number | null;
    characteristics?: Record<string, unknown>;
    worked?: string | null;
    disappointed?: string | null;
    nextTimeNotes?: string | null;
    aiSuggestions?: unknown[];
    isPreferred?: boolean;
    expectedVersion?: number;
}

export interface CookSearchInput {
    query?: string;
    dish?: string;
    method?: string;
    flavor?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: CookStatus | "all";
    limit?: number;
}

export interface CookUpdateResult {
    updateId: string | null;
    eventIds: string[];
    mediaIds: string[];
    mediaFailures: CookMediaFailure[];
    recorded: boolean;
    summary: string;
}

function requireUuid(value: string, label: string): string {
    if (!UUID_RE.test(value)) throw new Error(`Invalid ${label}`);
    return value;
}

function cleanText(value: unknown, label: string, max = 20_000): string | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") throw new Error(`${label} must be text`);
    const cleaned = value.trim();
    if (cleaned.length > max) throw new Error(`${label} is too long`);
    return cleaned || null;
}

function requiredText(value: unknown, label: string, max: number): string {
    const cleaned = cleanText(value, label, max);
    if (!cleaned) throw new Error(`${label} is required`);
    return cleaned;
}

function validateDate(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    if (
        !DATE_RE.test(value) ||
        !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    ) {
        throw new Error("Cook date must be YYYY-MM-DD");
    }
    return value;
}

function validTimezone(value: string | undefined): string {
    const timezone = value?.trim() || "UTC";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    } catch {
        throw new Error("Invalid cook timezone");
    }
    return timezone;
}

function isoDateInTimezone(instant: string, timezone: string): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = Object.fromEntries(
        formatter
            .formatToParts(new Date(instant))
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function isoOrNow(value: string | undefined, label: string): string {
    const result = value ? new Date(value) : new Date();
    if (!Number.isFinite(result.getTime())) throw new Error(`Invalid ${label}`);
    return result.toISOString();
}

function ownerValues(scope: CookScope, userId: string) {
    if (scope.type === "household")
        requireUuid(scope.householdId, "household ID");
    return {
        personalOwnerUserId: scope.type === "personal" ? userId : null,
        householdId: scope.type === "household" ? scope.householdId : null,
    };
}

function escapeLike(value: string): string {
    return `%${value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

function safeJson(value: unknown, fallback: unknown): unknown {
    const candidate = value ?? fallback;
    const expectsArray = Array.isArray(fallback);
    const hasExpectedShape = expectsArray
        ? Array.isArray(candidate)
        : candidate !== null &&
          typeof candidate === "object" &&
          !Array.isArray(candidate);
    if (!hasExpectedShape) return fallback;
    try {
        JSON.stringify(candidate);
        return candidate;
    } catch {
        return fallback;
    }
}

function nullableString(value: unknown): string | null {
    return value == null ? null : String(value);
}

function nullableNumber(value: unknown): number | null {
    return value == null ? null : Number(value);
}

function serializeEvent(row: Record<string, unknown>) {
    return {
        id: String(row.id),
        update_id: nullableString(row.update_id),
        dish_id: nullableString(row.dish_id),
        event_type: String(row.event_type),
        event_at: new Date(String(row.event_at)).toISOString(),
        submitted_at: new Date(String(row.submitted_at)).toISOString(),
        event_timezone: String(row.event_timezone),
        time_precision: String(row.time_precision),
        relative_phrase: nullableString(row.relative_phrase),
        setpoint_temperature: nullableNumber(row.setpoint_temperature),
        setpoint_unit: nullableString(row.setpoint_unit),
        ambient_temperature: nullableNumber(row.ambient_temperature),
        ambient_unit: nullableString(row.ambient_unit),
        internal_temperature: nullableNumber(row.internal_temperature),
        internal_unit: nullableString(row.internal_unit),
        note: nullableString(row.note),
        original_message: nullableString(row.original_message),
        correction_of_event_id: nullableString(row.correction_of_event_id),
        version: Number(row.version),
    };
}

function serializeMedia(row: Record<string, unknown>, userId: string) {
    return {
        id: String(row.id),
        cook_id: String(row.cook_id),
        dish_id: nullableString(row.dish_id),
        update_id: nullableString(row.update_id),
        event_id: nullableString(row.event_id),
        mime_type: String(row.mime_type),
        file_name: nullableString(row.file_name),
        file_size: Number(row.file_size),
        caption: nullableString(row.caption),
        created_at: new Date(String(row.created_at)).toISOString(),
        url: cookMediaUrl(userId, String(row.id)),
    };
}

export function serializeCookRow(row: Record<string, unknown>, userId: string) {
    return {
        id: String(row.id),
        title: String(row.title),
        status: String(row.status) as CookStatus,
        cook_date:
            row.cook_date instanceof Date
                ? row.cook_date.toISOString().slice(0, 10)
                : String(row.cook_date).slice(0, 10),
        timezone: String(row.timezone),
        started_at:
            row.started_at == null
                ? null
                : new Date(String(row.started_at)).toISOString(),
        finished_at:
            row.finished_at == null
                ? null
                : new Date(String(row.finished_at)).toISOString(),
        notes: nullableString(row.notes),
        setup_snapshot:
            row.setup_snapshot && typeof row.setup_snapshot === "object"
                ? row.setup_snapshot
                : {},
        source_cook_id: nullableString(row.source_cook_id),
        original_message: nullableString(row.original_message),
        version: Number(row.version),
        created_at: new Date(String(row.created_at)).toISOString(),
        updated_at: new Date(String(row.updated_at)).toISOString(),
        ownership: row.household_id == null ? "personal" : "household",
        photo_count: Number(row.photo_count ?? 0),
        latest_photo_url:
            row.latest_photo_id == null
                ? null
                : cookMediaUrl(userId, String(row.latest_photo_id)),
    };
}

function serializeDish(row: Record<string, unknown>) {
    const actualIngredients = Array.isArray(row.actual_ingredients)
        ? row.actual_ingredients
        : [];
    return {
        id: String(row.id),
        position: Number(row.position),
        name: String(row.name),
        ingredient_or_cut: nullableString(row.ingredient_or_cut),
        method: nullableString(row.method),
        flavor: nullableString(row.flavor),
        equipment: nullableString(row.equipment),
        notes: nullableString(row.notes),
        actual_ingredients: actualIngredients,
        recipe_id: nullableString(row.recipe_id),
        recipe_revision_id: nullableString(row.recipe_revision_id),
        // The dish wire shape is snake_case throughout: recipe
        // progress reads { steps, checked_ingredients, checked_steps }
        // (the stored jsonb keeps the same keys).
        recipe_progress:
            row.recipe_progress == null
                ? null
                : (() => {
                      const progress = sanitizeRecipeProgress(
                          row.recipe_progress,
                          actualIngredients.length,
                      );
                      return progress == null
                          ? null
                          : {
                                steps: progress.steps,
                                checked_ingredients:
                                    progress.checkedIngredients,
                                checked_steps: progress.checkedSteps,
                            };
                  })(),
    };
}

function eventAtForInput(
    input: CookEventInput,
    submittedAt: string,
    timezone: string,
): { eventAt: string; precision: CookTimePrecision } {
    if (input.eventAt) {
        const eventAt = isoOrNow(input.eventAt, "event time");
        return { eventAt, precision: input.timePrecision ?? "exact" };
    }
    return {
        eventAt: submittedAt,
        precision: input.timePrecision ?? "unknown",
    };
}

function validateEventInput(input: CookEventInput): CookEventInput {
    if (!input.eventType) throw new Error("Cook event type is required");
    const numbers = [
        input.setpointTemperature,
        input.ambientTemperature,
        input.internalTemperature,
    ];
    for (const value of numbers) {
        if (
            value !== undefined &&
            value !== null &&
            (!Number.isFinite(value) || value < -100)
        ) {
            throw new Error("Cook temperature is invalid");
        }
    }
    if (input.dishId) requireUuid(input.dishId, "dish ID");
    if (input.correctionOfEventId)
        requireUuid(input.correctionOfEventId, "correction event ID");
    return {
        ...input,
        note: cleanText(input.note, "Cook event note"),
        relativePhrase: cleanText(
            input.relativePhrase,
            "Relative time phrase",
            500,
        ),
        originalMessage: cleanText(input.originalMessage, "Cook event message"),
    };
}

const TIME_NUMBER_WORDS: Record<string, number> = {
    a: 1,
    an: 1,
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
    fifteen: 15,
    twenty: 20,
    thirty: 30,
    "a couple": 2,
    "a couple of": 2,
    "a few": 3,
};
const RELATIVE_TIME_RE = new RegExp(
    `(?:about\\s+|approximately\\s+)?(?:${Object.keys(TIME_NUMBER_WORDS)
        .sort((a, b) => b.length - a.length)
        .join(
            "|",
        )}|\\d+(?:\\.\\d+)?)\\s+(?:minutes?|hours?)\\s+ago|\\b(?:just now|just|now)\\b`,
    "i",
);

function phraseOffset(phrase: string): number | null {
    const normalized = phrase
        .toLowerCase()
        .replace(/^(?:about|approximately)\s+/, "");
    if (/^(?:just now|just|now)$/.test(normalized)) return 0;
    const match = normalized.match(/^(.+?)\s+(minutes?|hours?)\s+ago$/);
    if (!match) return null;
    const amount = TIME_NUMBER_WORDS[match[1]!] ?? Number(match[1]);
    return Number.isFinite(amount)
        ? amount * (match[2]!.startsWith("hour") ? 3_600_000 : 60_000)
        : null;
}

function temperatureFields(
    message: string,
    eventType: CookEventType,
): Pick<
    CookEventInput,
    | "setpointTemperature"
    | "setpointUnit"
    | "ambientTemperature"
    | "ambientUnit"
    | "internalTemperature"
    | "internalUnit"
> {
    TEMPERATURE_RE.lastIndex = 0;
    const matches = [...message.matchAll(TEMPERATURE_RE)];
    if (matches.length === 0) return {};

    const fields: Pick<
        CookEventInput,
        | "setpointTemperature"
        | "setpointUnit"
        | "ambientTemperature"
        | "ambientUnit"
        | "internalTemperature"
        | "internalUnit"
    > = {};
    const lower = message.toLowerCase();
    for (const match of matches) {
        const temperature = Number(match[1]);
        const unit = (match[2] ?? "F").toUpperCase() as "F" | "C";
        const index = match.index ?? 0;
        const before = lower.slice(Math.max(0, index - 64), index);
        const after = lower.slice(
            index + match[0].length,
            Math.min(lower.length, index + match[0].length + 64),
        );
        const nearest = (pattern: RegExp): number | null => {
            const previousMatches = [...before.matchAll(pattern)];
            const previousCandidate = previousMatches.at(-1);
            const previous =
                previousCandidate &&
                !/[.;]/.test(
                    before.slice(
                        previousCandidate.index! + previousCandidate[0].length,
                    ),
                )
                    ? previousCandidate
                    : undefined;
            const nextCandidate = pattern.exec(after);
            const next =
                nextCandidate &&
                !/[.;]/.test(after.slice(0, nextCandidate.index))
                    ? nextCandidate
                    : undefined;
            const previousDistance =
                previous?.index === undefined
                    ? null
                    : before.length - previous.index - previous[0].length;
            const nextDistance = next?.index ?? null;
            if (previousDistance === null) return nextDistance;
            if (nextDistance === null) return previousDistance;
            return Math.min(previousDistance, nextDistance);
        };
        const internalDistance = nearest(
            /internal|inside|center|centre|meat|food temp|internal temp/g,
        );
        const ambientDistance = nearest(
            /ambient|environment|air temp|cooking environment|smoker|grill/g,
        );
        const setpointDistance = nearest(
            /setpoint|set to|heated|heat|preheat/g,
        );
        if (eventType === "preheat") {
            fields.setpointTemperature ??= temperature;
            fields.setpointUnit ??= unit;
        } else if (
            internalDistance !== null &&
            (ambientDistance === null || internalDistance <= ambientDistance) &&
            (setpointDistance === null || internalDistance <= setpointDistance)
        ) {
            fields.internalTemperature ??= temperature;
            fields.internalUnit ??= unit;
        } else if (
            ambientDistance !== null &&
            (setpointDistance === null || ambientDistance <= setpointDistance)
        ) {
            fields.ambientTemperature ??= temperature;
            fields.ambientUnit ??= unit;
        } else if (
            eventType === "temperature_change" ||
            setpointDistance !== null ||
            /setpoint|set to|heated .* to|heat .* to/.test(lower)
        ) {
            fields.setpointTemperature ??= temperature;
            fields.setpointUnit ??= unit;
        } else if (eventType === "wrap") {
            fields.internalTemperature ??= temperature;
            fields.internalUnit ??= unit;
        } else {
            fields.ambientTemperature ??= temperature;
            fields.ambientUnit ??= unit;
        }
    }
    return fields;
}

function detectedEvent(
    eventType: CookEventType,
    message: string,
    submittedAt: string,
    relativePhrase: string | null,
    timezone: string,
    note?: string,
): CookEventInput {
    const offset = relativePhrase ? phraseOffset(relativePhrase) : null;
    const eventAt =
        offset == null
            ? submittedAt
            : new Date(new Date(submittedAt).getTime() - offset).toISOString();
    return {
        eventType,
        eventAt,
        eventTimezone: timezone,
        timePrecision: offset == null ? "unknown" : "approximate",
        relativePhrase,
        originalMessage: message,
        note: note ?? message,
        ...(eventType === "preheat" ||
        eventType === "temperature_change" ||
        eventType === "wrap"
            ? temperatureFields(note ?? message, eventType)
            : {}),
    };
}

export function parseNaturalCookUpdate(
    message: string,
    submittedAt = new Date().toISOString(),
    timezone = "UTC",
): ParsedCookUpdate {
    const text = requiredText(message, "Cook update", 20_000);
    const lower = text.toLowerCase();
    const advisoryIndex = lower.search(
        /\b(what if|should i|could i|would it|can i|is it okay|how do i|is this safe)\b/,
    );
    const questionOnly = advisoryIndex === 0;
    const isQuestion = /\?\s*$/.test(text) || questionOnly;
    const factualText =
        advisoryIndex > 0 ? text.slice(0, advisoryIndex).trim() : text;
    const suggestions: ParsedCookUpdate["suggestions"] = {};
    const method = lower.match(
        /\b(smok(?:e|ed|ing)|grill(?:ed|ing)?|roast(?:ed|ing)?|bake(?:d|ing)?|fry(?:ing|ied)?|sear(?:ed|ing)?)\b/,
    );
    if (method) suggestions.method = (method[1] ?? "").replace(/ing$|ed$/, "");
    const flavor = lower.match(
        /\b(lemon\s+pepper|spicy|hot|honey\s+garlic|bbq|barbecue|garlic\s+parmesan|teriyaki|sweet\s+heat)\b/,
    );
    if (flavor) suggestions.flavor = (flavor[1] ?? "").replace(/\s+/g, " ");
    const equipment = lower.match(
        /\b(grill|smoker|oven|skillet|cast iron|air fryer|stovetop)\b/,
    );
    if (equipment) suggestions.equipment = equipment[1] ?? "";
    const dish = lower.match(
        /\b(wings?|mac\s+and\s+cheese|ribs?|brisket|chicken|salmon|steak|vegetables?)\b/,
    );
    if (dish) suggestions.dish = (dish[1] ?? "").replace(/\s+/g, " ");
    const cut = lower.match(
        /\b(thighs?|breasts?|drumsticks?|whole chicken|boneless|bone-in)\b/,
    );
    if (cut) suggestions.ingredientOrCut = cut[1] ?? "";
    if (questionOnly || !factualText) {
        return {
            isQuestion: true,
            events: [],
            suggestions,
            summary:
                "Saved the question as context; no cooking event was recorded.",
        };
    }

    // Associate time and temperature with the action clause, not the whole update.
    // Keep the untouched message on every event for audit/history.
    const clauses = factualText.split(
        /(?<=[.!?;])\s+|,\s*(?:and\s+)?(?=(?:I\s+)?(?:just\s+)?(?:put|placed|preheated|heated|wrapped|sauced|removed|rested)\b)|\s+and\s+(?=(?:I\s+)?(?:just\s+)?(?:put|placed|preheated|heated|wrapped|sauced|removed|rested)\b)/i,
    );
    const events: CookEventInput[] = [];
    for (const clause of clauses) {
        if (/\?\s*$/.test(clause)) continue;
        const lowerClause = clause.toLowerCase();
        const relativePhrase = clause.match(RELATIVE_TIME_RE)?.[0] ?? null;
        const types: CookEventType[] = [];
        if (
            /\b(preheat|pre-heated|preheated|heated|heating)\b/.test(
                lowerClause,
            ) &&
            /\b(grill|smoker|oven|pit|kamado|to\s+\d)/.test(lowerClause)
        )
            types.push("preheat");
        if (
            /\b(put|placed|place|on the grill|on the smoker|food on|went on|goes on)\b/.test(
                lowerClause,
            )
        )
            types.push("food_on");
        if (/\b(wrap|wrapped|wrapping|foil|paper)\b/.test(lowerClause))
            types.push("wrap");
        if (
            /\b(sauce|sauced|saucing|glaze|glazed|baste|basted)\b/.test(
                lowerClause,
            )
        )
            types.push("sauce");
        if (
            /\b(remove|removed|take off|taken off|pulled|pulling)\b/.test(
                lowerClause,
            )
        )
            types.push("remove");
        if (/\b(rest|rested|resting)\b/.test(lowerClause)) types.push("rest");
        if (/\b(tast(?:e|ed|ing)|bite|bit into)\b/.test(lowerClause))
            types.push("taste");
        if (
            /\b(temp|temperature|setpoint|set to|internal|ambient|environment)\b/.test(
                lowerClause,
            ) &&
            /(-?\d+(?:\.\d+)?)\s*°?\s*[fFcC]\b/.test(clause) &&
            !types.includes("preheat") &&
            !types.includes("wrap")
        )
            types.push("temperature_change");
        if (
            !types.length &&
            /\b(start|starting|prep|prepped|season|seasoned|marinat|chop|mix|trim)\b/.test(
                lowerClause,
            )
        )
            types.push("preparation");
        for (const type of types)
            events.push(
                detectedEvent(
                    type,
                    text,
                    submittedAt,
                    relativePhrase,
                    timezone,
                    clause.trim(),
                ),
            );
    }
    if (events.some((event) => event.eventType !== "preparation")) {
        for (let i = events.length - 1; i >= 0; i--) {
            if (
                events[i]!.eventType === "preparation" &&
                /\bstarting\b/i.test(events[i]!.note ?? "")
            )
                events.splice(i, 1);
        }
    }
    if (!events.length && !isQuestion) {
        events.push(
            detectedEvent(
                "note",
                text,
                submittedAt,
                null,
                timezone,
                factualText,
            ),
        );
    }
    return {
        isQuestion,
        events,
        suggestions,
        summary: `${events.length} timeline event${events.length === 1 ? "" : "s"} recorded from the update${isQuestion ? "; the advisory question was not recorded as an event" : ""}.`,
    };
}

async function existingCookByIdempotency(
    tx: DatabaseTransaction,
    userId: string,
    scope: CookScope,
    idempotencyKey: string | undefined,
) {
    if (!idempotencyKey) return null;
    const owner = ownerValues(scope, userId);
    const rows = await tx<Array<Record<string, unknown>>>`
        select id, version
        from munch.cooks
        where idempotency_key = ${idempotencyKey}
          and personal_owner_user_id is not distinct from ${owner.personalOwnerUserId}
          and household_id is not distinct from ${owner.householdId}
        limit 1
    `;
    return rows[0] ?? null;
}

async function cookRow(
    tx: DatabaseTransaction,
    cookId: string,
): Promise<Record<string, unknown> | null> {
    const rows = await tx<Array<Record<string, unknown>>>`
        select cook.*,
               (select count(*) from munch.cook_media media where media.cook_id = cook.id) as photo_count,
               (select media.id from munch.cook_media media where media.cook_id = cook.id order by media.created_at desc, media.id desc limit 1) as latest_photo_id
        from munch.cooks cook
        where cook.id = ${cookId}
        limit 1
    `;
    return rows[0] ?? null;
}

async function insertDish(
    tx: DatabaseTransaction,
    cookId: string,
    dish: CookDishInput,
    position: number,
): Promise<string> {
    const name = requiredText(dish.name, "Dish name", 200);
    const actualIngredients = Array.isArray(dish.actualIngredients)
        ? dish.actualIngredients
        : [];
    const recipeId = dish.recipeId
        ? requireUuid(dish.recipeId, "recipe ID")
        : null;
    const recipeRevisionId = dish.recipeRevisionId
        ? requireUuid(dish.recipeRevisionId, "recipe revision ID")
        : null;
    if ((recipeId === null) !== (recipeRevisionId === null)) {
        throw new Error(
            "Recipe ID and recipe revision ID must be provided together",
        );
    }
    if (recipeId && recipeRevisionId) {
        const recipeRows = await tx<Array<{ id: string }>>`
            select revision.id
            from munch.recipe_revisions revision
            join munch.recipes recipe on recipe.id = revision.recipe_id
            where revision.id = ${recipeRevisionId}
              and revision.recipe_id = ${recipeId}
            limit 1
        `;
        if (!recipeRows[0]) {
            throw new Error(
                "Cook recipe link must reference an accessible exact revision",
            );
        }
    }
    const sanitizedProgress =
        dish.recipeProgress === undefined
            ? null
            : sanitizeRecipeProgress(
                  dish.recipeProgress,
                  actualIngredients.length,
              );
    // Stored in the same snake_case wire shape serializeDish emits.
    const recipeProgress = sanitizedProgress
        ? {
              steps: sanitizedProgress.steps,
              checked_ingredients: sanitizedProgress.checkedIngredients,
              checked_steps: sanitizedProgress.checkedSteps,
          }
        : null;
    const rows = await tx<Array<{ id: string }>>`
        insert into munch.cook_dishes (
            cook_id, position, name, ingredient_or_cut, method, flavor, equipment,
            notes, actual_ingredients, recipe_id, recipe_revision_id,
            recipe_progress
        ) values (
            ${cookId}, ${position}, ${name},
            ${cleanText(dish.ingredientOrCut, "Ingredient or cut", 500)},
            ${cleanText(dish.method, "Cooking method", 500)},
            ${cleanText(dish.flavor, "Flavor", 500)},
            ${cleanText(dish.equipment, "Equipment", 500)},
            ${cleanText(dish.notes, "Dish notes")},
            ${safeJson(actualIngredients, [])}::jsonb,
            ${recipeId}, ${recipeRevisionId},
            ${recipeProgress ? safeJson(recipeProgress, {}) : null}::jsonb
        ) returning id
    `;
    if (!rows[0]?.id) throw new Error("Dish creation failed");
    return String(rows[0].id);
}

async function insertEvent(
    tx: DatabaseTransaction,
    userId: string,
    cookId: string,
    updateId: string | null,
    input: CookEventInput,
    submittedAt: string,
    timezone: string,
    fallbackKey: string,
): Promise<string> {
    const normalized = validateEventInput(input);
    const eventAt = eventAtForInput(normalized, submittedAt, timezone);
    const idempotencyKey = normalized.idempotencyKey ?? fallbackKey;
    if (normalized.dishId) {
        const dishRows = await tx<Array<{ id: string }>>`
            select id from munch.cook_dishes
            where id = ${normalized.dishId} and cook_id = ${cookId}
        `;
        if (!dishRows[0])
            throw new Error("Cook event dish is not part of this cook");
    }
    const existing = await tx<Array<{ id: string }>>`
        select id from munch.cook_events
        where cook_id = ${cookId} and idempotency_key = ${idempotencyKey}
        limit 1
    `;
    if (existing[0]?.id) return String(existing[0].id);
    const rows = await tx<Array<{ id: string }>>`
        insert into munch.cook_events (
            cook_id, update_id, dish_id, event_type, event_at, submitted_at,
            event_timezone, time_precision, relative_phrase,
            setpoint_temperature, setpoint_unit, ambient_temperature, ambient_unit,
            internal_temperature, internal_unit, note, original_message,
            correction_of_event_id, idempotency_key, created_by_user_id
        ) values (
            ${cookId}, ${updateId}, ${normalized.dishId ?? null}, ${normalized.eventType},
            ${eventAt.eventAt}, ${submittedAt}, ${normalized.eventTimezone ?? timezone},
            ${eventAt.precision}, ${normalized.relativePhrase ?? null},
            ${normalized.setpointTemperature ?? null}, ${normalized.setpointUnit ?? null},
            ${normalized.ambientTemperature ?? null}, ${normalized.ambientUnit ?? null},
            ${normalized.internalTemperature ?? null}, ${normalized.internalUnit ?? null},
            ${normalized.note ?? null}, ${normalized.originalMessage ?? null},
            ${normalized.correctionOfEventId ?? null}, ${idempotencyKey}, ${userId}
        ) returning id
    `;
    if (!rows[0]?.id) throw new Error("Cook event creation failed");
    return String(rows[0].id);
}

async function insertMedia(
    tx: DatabaseTransaction,
    userId: string,
    cookId: string,
    updateId: string | null,
    photos: CookMediaInput[],
): Promise<string[]> {
    const ids: string[] = [];
    for (const raw of photos) {
        const photo = validateCookMediaUpload(raw);
        if (raw.dishId) {
            const dishRows = await tx<Array<{ id: string }>>`
                select id from munch.cook_dishes
                where id = ${raw.dishId} and cook_id = ${cookId}
            `;
            if (!dishRows[0])
                throw new Error("Cook photo dish is not part of this cook");
        }
        if (raw.eventId) {
            const eventRows = await tx<Array<{ id: string }>>`
                select id from munch.cook_events
                where id = ${raw.eventId} and cook_id = ${cookId}
            `;
            if (!eventRows[0])
                throw new Error("Cook photo event is not part of this cook");
        }
        const hash = cookMediaSha256(photo.bytes);
        const base64 = Buffer.from(photo.bytes).toString("base64");
        const rows = await tx<Array<{ id: string }>>`
            insert into munch.cook_media (
                cook_id, dish_id, update_id, event_id, sha256, mime_type,
                file_name, file_size, bytes, openai_file_id, caption, created_by_user_id
            ) values (
                ${cookId}, ${raw.dishId ?? null}, ${updateId}, ${raw.eventId ?? null},
                ${hash}, ${photo.mimeType}, ${photo.fileName ?? null}, ${photo.bytes.byteLength},
                decode(${base64}, 'base64'), ${photo.openaiFileId ?? null},
                ${photo.caption ?? null}, ${userId}
            ) on conflict (cook_id, sha256) do update
            set update_id = coalesce(munch.cook_media.update_id, excluded.update_id),
                dish_id = coalesce(munch.cook_media.dish_id, excluded.dish_id),
                event_id = coalesce(munch.cook_media.event_id, excluded.event_id)
            returning id
        `;
        if (!rows[0]?.id) throw new Error("Cook photo could not be saved");
        ids.push(String(rows[0].id));
    }
    return ids;
}

async function insertCookUpdateInTransaction(
    tx: DatabaseTransaction,
    userId: string,
    cookId: string,
    input: CookUpdateInput,
): Promise<CookUpdateResult> {
    requireUuid(cookId, "cook ID");
    const submittedAt = isoOrNow(input.submittedAt, "submission time");
    const timezone = validTimezone(input.timezone);
    const message = requiredText(
        input.message ?? "Recorded timeline update",
        "Cook update",
        20_000,
    );
    const cookRows = await tx<
        Array<{ id: string }>
    >`select id from munch.cooks where id = ${cookId} for update`;
    if (!cookRows[0]) throw new Error("Cook not found or unavailable");
    if (input.dishId) {
        requireUuid(input.dishId, "dish ID");
        const dishRows = await tx<Array<{ id: string }>>`
            select id from munch.cook_dishes
            where id = ${input.dishId} and cook_id = ${cookId}
            limit 1
        `;
        if (!dishRows[0])
            throw new Error("Cook update dish is not part of this cook");
    }
    const existing = input.idempotencyKey
        ? await tx<Array<{ id: string; media_status: string }>>`
              select id, media_status from munch.cook_updates
              where cook_id = ${cookId} and idempotency_key = ${input.idempotencyKey}
              limit 1
          `
        : [];
    if (existing[0]) {
        const events = await tx<Array<{ id: string }>>`
            select id from munch.cook_events where update_id = ${existing[0].id} order by created_at, id
        `;
        let media = await tx<Array<{ id: string }>>`
            select id from munch.cook_media where update_id = ${existing[0].id} order by created_at, id
        `;
        const retryFailures = input.mediaFailures ?? [];
        if (input.photos?.length) {
            await insertMedia(
                tx,
                userId,
                cookId,
                String(existing[0].id),
                input.photos.map((photo) => ({
                    ...photo,
                    dishId: photo.dishId ?? input.dishId,
                })),
            );
            media = await tx<Array<{ id: string }>>`
                select id from munch.cook_media where update_id = ${existing[0].id} order by created_at, id
            `;
            await tx`
                update munch.cook_updates
                set media_status = ${retryFailures.length ? "failed" : "saved"},
                    media_error = ${retryFailures.length ? JSON.stringify(retryFailures) : null}
                where id = ${existing[0].id}
            `;
            await tx`
                update munch.cooks
                set updated_at = now(), updated_by_user_id = ${userId}, version = version + 1
                where id = ${cookId}
            `;
        }
        return {
            updateId: String(existing[0].id),
            eventIds: events.map((row) => String(row.id)),
            mediaIds: media.map((row) => String(row.id)),
            mediaFailures: retryFailures,
            recorded: true,
            summary: input.photos?.length
                ? `Cook update retry completed; ${media.length} saved photo${media.length === 1 ? "" : "s"}${retryFailures.length ? ` and ${retryFailures.length} photo upload${retryFailures.length === 1 ? "" : "s"} still need retry` : ""}.`
                : "This cook update was already recorded; the existing events and photos were returned.",
        };
    }
    const mediaFailures = input.mediaFailures ?? [];
    const mediaStatus = mediaFailures.length
        ? "failed"
        : input.photos?.length
          ? "saved"
          : "none";
    const updates = await tx<Array<{ id: string }>>`
        insert into munch.cook_updates (
            cook_id, dish_id, source, raw_message, submitted_at, submitted_timezone,
            media_status, media_error, idempotency_key, created_by_user_id
        ) values (
            ${cookId}, ${input.dishId ?? null}, ${input.source}, ${message}, ${submittedAt}, ${timezone},
            ${mediaStatus}, ${mediaFailures.length ? JSON.stringify(mediaFailures) : null},
            ${input.idempotencyKey ?? null}, ${userId}
        ) returning id
    `;
    const updateId = String(updates[0]?.id);
    if (!updateId) throw new Error("Cook update creation failed");
    const eventIds: string[] = [];
    for (const [index, event] of (input.events ?? []).entries()) {
        eventIds.push(
            await insertEvent(
                tx,
                userId,
                cookId,
                updateId,
                event,
                submittedAt,
                timezone,
                `${input.idempotencyKey ?? updateId}:event:${index}`,
            ),
        );
    }
    const mediaIds = input.photos?.length
        ? await insertMedia(
              tx,
              userId,
              cookId,
              updateId,
              input.photos.map((photo) => ({
                  ...photo,
                  dishId: photo.dishId ?? input.dishId,
              })),
          )
        : [];
    await tx`
        update munch.cooks
        set updated_at = now(), updated_by_user_id = ${userId}, version = version + 1
        where id = ${cookId}
    `;
    return {
        updateId,
        eventIds,
        mediaIds,
        mediaFailures,
        recorded: true,
        summary:
            eventIds.length > 0
                ? `${eventIds.length} timeline event${eventIds.length === 1 ? "" : "s"} recorded${mediaIds.length ? ` and ${mediaIds.length} photo${mediaIds.length === 1 ? "" : "s"} saved` : ""}.`
                : mediaFailures.length
                  ? `Message saved; ${mediaFailures.length} photo upload${mediaFailures.length === 1 ? "" : "s"} need retry.`
                  : mediaIds.length
                    ? `Message saved and ${mediaIds.length} photo${mediaIds.length === 1 ? "" : "s"} saved; no factual event was inferred.`
                    : "Message saved; no factual event was inferred.",
    };
}

export async function createCook(
    userId: string,
    input: CreateCookInput,
): Promise<{
    cookId: string;
    deduplicated: boolean;
    update: CookUpdateResult | null;
    mediaFailures: CookMediaFailure[];
}> {
    const scope = input.scope ?? { type: "personal" as const };
    const timezone = validTimezone(input.timezone);
    const startedAt = input.startedAt
        ? isoOrNow(input.startedAt, "start time")
        : null;
    const cookDate =
        validateDate(input.cookDate) ??
        (startedAt
            ? isoDateInTimezone(startedAt, timezone)
            : isoDateInTimezone(new Date().toISOString(), timezone));
    const dishes = input.dishes?.length
        ? input.dishes
        : [{ name: input.title || "Untitled cook" }];
    const title = requiredText(
        input.title ?? dishes[0]?.name,
        "Cook title",
        200,
    );
    const status = input.status ?? "active";
    if (status !== "active" && status !== "finished")
        throw new Error("Invalid cook status");
    const mediaFailures = input.mediaFailures ?? [];
    const result = await withUserDatabase(userId, async (tx) => {
        if (input.idempotencyKey) {
            await tx`select pg_advisory_xact_lock(hashtext(${`cook-create:${userId}:${input.idempotencyKey}`}))`;
            const existing = await existingCookByIdempotency(
                tx,
                userId,
                scope,
                input.idempotencyKey,
            );
            if (existing) {
                const retryableMedia =
                    Boolean(input.photos?.length) || mediaFailures.length > 0;
                const update = retryableMedia
                    ? await insertCookUpdateInTransaction(
                          tx,
                          userId,
                          String(existing.id),
                          {
                              source: input.source ?? "website",
                              message:
                                  input.message?.trim() ||
                                  input.originalMessage ||
                                  "Cook started",
                              timezone,
                              submittedAt: startedAt ?? undefined,
                              photos: input.photos ?? [],
                              mediaFailures,
                              idempotencyKey: `${input.idempotencyKey}:initial`,
                          },
                      )
                    : null;
                return {
                    cookId: String(existing.id),
                    deduplicated: true,
                    update,
                    mediaFailures: update?.mediaFailures ?? mediaFailures,
                };
            }
        }
        if (input.sourceCookId)
            requireUuid(input.sourceCookId, "source cook ID");
        if (input.sourceCookId) {
            const sourceRows = await tx<Array<{ id: string }>>`
                select id from munch.cooks where id = ${input.sourceCookId} limit 1
            `;
            if (!sourceRows[0])
                throw new Error("Source cook not found or unavailable");
        }
        const owner = ownerValues(scope, userId);
        const rows = await tx<Array<{ id: string }>>`
            insert into munch.cooks (
                personal_owner_user_id, household_id, title, status, cook_date, timezone,
                started_at, finished_at, notes, setup_snapshot, source_cook_id,
                original_message, idempotency_key, created_by_user_id, updated_by_user_id
            ) values (
                ${owner.personalOwnerUserId}, ${owner.householdId}, ${title}, ${status}, ${cookDate}, ${timezone},
                ${startedAt}, ${status === "finished" ? (startedAt ?? new Date().toISOString()) : null},
                ${cleanText(input.notes, "Cook notes")}, ${safeJson(input.setupSnapshot, {})}::jsonb,
                ${input.sourceCookId ?? null}, ${cleanText(input.originalMessage, "Original message")},
                ${input.idempotencyKey ?? null}, ${userId}, ${userId}
            ) returning id
        `;
        const cookId = String(rows[0]?.id);
        if (!cookId) throw new Error("Cook creation failed");
        for (const [position, dish] of dishes.entries())
            await insertDish(tx, cookId, dish, position);
        let update: CookUpdateResult | null = null;
        const message = input.message?.trim();
        if (
            message ||
            input.events?.length ||
            input.photos?.length ||
            mediaFailures.length
        ) {
            update = await insertCookUpdateInTransaction(tx, userId, cookId, {
                source: input.source ?? "website",
                message: message || input.originalMessage || "Cook started",
                timezone,
                submittedAt: startedAt ?? undefined,
                events: input.events ?? [],
                photos: input.photos ?? [],
                mediaFailures,
                idempotencyKey: input.idempotencyKey
                    ? `${input.idempotencyKey}:initial`
                    : undefined,
            });
        }
        return { cookId, deduplicated: false, update, mediaFailures };
    });
    return result;
}

export async function addCookUpdate(
    userId: string,
    cookId: string,
    input: CookUpdateInput,
): Promise<CookUpdateResult> {
    return withUserDatabase(userId, (tx) =>
        insertCookUpdateInTransaction(tx, userId, cookId, input),
    );
}

export async function updateCook(
    userId: string,
    cookId: string,
    patch: {
        title?: string;
        cookDate?: string;
        timezone?: string;
        status?: CookStatus;
        notes?: string | null;
        setupSnapshot?: Record<string, unknown>;
        expectedVersion?: number;
    },
) {
    requireUuid(cookId, "cook ID");
    const date = validateDate(patch.cookDate);
    const timezone = patch.timezone ? validTimezone(patch.timezone) : undefined;
    if (
        patch.status !== undefined &&
        patch.status !== "active" &&
        patch.status !== "finished"
    ) {
        throw new Error("Invalid cook status");
    }
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            update munch.cooks
            set title = coalesce(${patch.title ? requiredText(patch.title, "Cook title", 200) : null}, title),
                cook_date = coalesce(${date ?? null}, cook_date),
                timezone = coalesce(${timezone ?? null}, timezone),
                status = coalesce(${patch.status ?? null}, status),
                notes = case when ${patch.notes === undefined} then notes else ${cleanText(patch.notes, "Cook notes")} end,
                setup_snapshot = case when ${patch.setupSnapshot === undefined} then setup_snapshot else ${safeJson(patch.setupSnapshot, {})}::jsonb end,
                finished_at = case
                    when ${patch.status === "finished"} then coalesce(finished_at, now())
                    when ${patch.status === "active"} then null
                    else finished_at
                end,
                updated_at = now(), updated_by_user_id = ${userId}, version = version + 1
            where id = ${cookId}
              and (${patch.expectedVersion ?? null}::integer is null or version = ${patch.expectedVersion ?? null})
            returning *
        `;
        if (!rows[0])
            throw new Error("Cook was not found, is unavailable, or changed");
        return serializeCookRow(rows[0], userId);
    });
}

export async function updateCookDish(
    userId: string,
    cookId: string,
    dishId: string,
    patch: {
        name?: string;
        ingredientOrCut?: string | null;
        method?: string | null;
        flavor?: string | null;
        equipment?: string | null;
        notes?: string | null;
        actualIngredients?: unknown[];
        expectedVersion?: number;
    },
) {
    requireUuid(cookId, "cook ID");
    requireUuid(dishId, "dish ID");
    const actualIngredients = patch.actualIngredients;
    if (actualIngredients !== undefined && !Array.isArray(actualIngredients)) {
        throw new Error("Actual ingredients must be an array");
    }
    return withUserDatabase(userId, async (tx) => {
        const cookRows = await tx<Array<{ id: string; version: number }>>`
            select id, version from munch.cooks where id = ${cookId} for update
        `;
        const cook = cookRows[0];
        if (!cook) throw new Error("Cook was not found or is unavailable");
        if (
            patch.expectedVersion !== undefined &&
            Number(cook.version) !== patch.expectedVersion
        ) {
            throw new Error("Cook changed, is unavailable, or was not found");
        }
        const dishRows = await tx<Array<Record<string, unknown>>>`
            update munch.cook_dishes
            set name = coalesce(${patch.name === undefined ? null : requiredText(patch.name, "Dish name", 200)}, name),
                ingredient_or_cut = case when ${patch.ingredientOrCut === undefined} then ingredient_or_cut else ${cleanText(patch.ingredientOrCut, "Ingredient or cut", 500)} end,
                method = case when ${patch.method === undefined} then method else ${cleanText(patch.method, "Cooking method", 500)} end,
                flavor = case when ${patch.flavor === undefined} then flavor else ${cleanText(patch.flavor, "Flavor", 500)} end,
                equipment = case when ${patch.equipment === undefined} then equipment else ${cleanText(patch.equipment, "Equipment", 500)} end,
                notes = case when ${patch.notes === undefined} then notes else ${cleanText(patch.notes, "Dish notes")} end,
                actual_ingredients = case when ${actualIngredients === undefined} then actual_ingredients else ${safeJson(actualIngredients, [])}::jsonb end,
                updated_at = now()
            where id = ${dishId} and cook_id = ${cookId}
            returning *
        `;
        if (!dishRows[0])
            throw new Error("Dish was not found, is unavailable, or changed");
        await tx`
            update munch.cooks
            set updated_at = now(), updated_by_user_id = ${userId}, version = version + 1
            where id = ${cookId}
        `;
        return {
            dish: serializeDish(dishRows[0]),
            cook_version: Number(cook.version) + 1,
        };
    });
}

/**
 * Build the dish a recipe "Start cook" session runs on (brief R2):
 * linked to the exact recipe revision, carrying the revision's
 * ingredient lines as the session's actual ingredients and a fresh
 * cook-mode progress value with the revision's steps pinned.
 */
export function buildRecipeCookDish(recipe: {
    name: string;
    revisionId: string;
    recipeId: string;
    instructions: readonly string[];
    ingredients: ReadonlyArray<{
        name: string;
        quantity?: number | null;
        unit?: string | null;
        preparation?: string | null;
        optional?: boolean | null;
    }>;
}): CookDishInput {
    const actualIngredients = recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        ...(ingredient.quantity != null
            ? { quantity: ingredient.quantity }
            : {}),
        ...(ingredient.unit ? { unit: ingredient.unit } : {}),
        ...(ingredient.preparation
            ? { preparation: ingredient.preparation }
            : {}),
        ...(ingredient.optional ? { optional: true } : {}),
    }));
    return {
        name: recipe.name,
        actualIngredients,
        recipeId: recipe.recipeId,
        recipeRevisionId: recipe.revisionId,
        recipeProgress: {
            steps: [...recipe.instructions],
            checkedIngredients: [],
            checkedSteps: [],
        },
    };
}

/**
 * Replace a recipe cook session's checklist state (brief R2). The
 * patch carries full checked-position arrays (last write wins — a
 * checklist toggle is not a versioned document edit), validated
 * against the dish's pinned steps and actual ingredients.
 */
export async function updateCookDishProgress(
    userId: string,
    cookId: string,
    dishId: string,
    patch: {
        checkedIngredients?: number[];
        checkedSteps?: number[];
    },
) {
    requireUuid(cookId, "cook ID");
    requireUuid(dishId, "dish ID");
    return withUserDatabase(userId, async (tx) => {
        const cookRows = await tx<Array<{ id: string; version: number }>>`
            select id, version from munch.cooks where id = ${cookId} for update
        `;
        const cook = cookRows[0];
        if (!cook) throw new Error("Cook was not found or is unavailable");
        const dishRows = await tx<Array<Record<string, unknown>>>`
            select * from munch.cook_dishes
            where id = ${dishId} and cook_id = ${cookId}
            for update
        `;
        const dishRow = dishRows[0];
        if (!dishRow)
            throw new Error("Dish was not found, is unavailable, or changed");
        const ingredientCount = Array.isArray(dishRow.actual_ingredients)
            ? dishRow.actual_ingredients.length
            : 0;
        const current = sanitizeRecipeProgress(
            dishRow.recipe_progress,
            ingredientCount,
        );
        if (!current) {
            throw new Error("Dish is not a recipe cook session");
        }
        // Writes are strict (unlike reads, which clamp stored data):
        // a position outside the pinned lists is a client bug, and
        // silently dropping it would fork the checklist state.
        const strictPositions = (
            values: number[] | undefined,
            bound: number,
            label: string,
        ): number[] | undefined => {
            if (values === undefined) return undefined;
            for (const value of values) {
                if (!Number.isInteger(value) || value < 0 || value >= bound) {
                    throw new Error(`${label} position out of range: ${value}`);
                }
            }
            return checkedPositions(values, bound);
        };
        const next: RecipeCookProgress = {
            steps: current.steps,
            checkedIngredients:
                strictPositions(
                    patch.checkedIngredients,
                    ingredientCount,
                    "Ingredient",
                ) ?? current.checkedIngredients,
            checkedSteps:
                strictPositions(
                    patch.checkedSteps,
                    current.steps.length,
                    "Step",
                ) ?? current.checkedSteps,
        };
        const updated = await tx<Array<Record<string, unknown>>>`
            update munch.cook_dishes
            set recipe_progress = ${safeJson(
                {
                    steps: next.steps,
                    checked_ingredients: next.checkedIngredients,
                    checked_steps: next.checkedSteps,
                },
                {},
            )}::jsonb,
                updated_at = now()
            where id = ${dishId} and cook_id = ${cookId}
            returning *
        `;
        if (!updated[0])
            throw new Error("Dish was not found, is unavailable, or changed");
        await tx`
            update munch.cooks
            set updated_at = now(), updated_by_user_id = ${userId}, version = version + 1
            where id = ${cookId}
        `;
        return {
            dish: serializeDish(updated[0]),
            cook_version: Number(cook.version) + 1,
        };
    });
}

export async function finishCook(
    userId: string,
    cookId: string,
    expectedVersion?: number,
) {
    return updateCook(userId, cookId, { status: "finished", expectedVersion });
}
export async function reopenCook(
    userId: string,
    cookId: string,
    expectedVersion?: number,
) {
    return updateCook(userId, cookId, { status: "active", expectedVersion });
}

export async function deleteCook(
    userId: string,
    cookId: string,
): Promise<boolean> {
    requireUuid(cookId, "cook ID");
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<
            Array<{ id: string }>
        >`delete from munch.cooks where id = ${cookId} returning id`;
        return Boolean(rows[0]);
    });
}

export async function correctCookEvent(
    userId: string,
    cookId: string,
    eventId: string,
    input: CookEventInput,
    expectedVersion: number,
) {
    requireUuid(cookId, "cook ID");
    requireUuid(eventId, "event ID");
    const normalized = validateEventInput(input);
    return withUserDatabase(userId, async (tx) => {
        const submittedAt = new Date().toISOString();
        const existingRows = await tx<
            Array<{
                event_at: string;
                event_timezone: string;
                time_precision: CookTimePrecision;
            }>
        >`
            select event_at, event_timezone, time_precision
            from munch.cook_events
            where id = ${eventId} and cook_id = ${cookId}
            limit 1
            for update
        `;
        const existing = existingRows[0];
        if (!existing)
            throw new Error(
                "Cook event changed, is unavailable, or was not found",
            );
        const timezone = validTimezone(
            normalized.eventTimezone ?? existing.event_timezone,
        );
        const eventAt = normalized.eventAt
            ? eventAtForInput(normalized, submittedAt, timezone)
            : {
                  eventAt: new Date(existing.event_at).toISOString(),
                  precision:
                      normalized.timePrecision ?? existing.time_precision,
              };
        const rows = await tx<Array<Record<string, unknown>>>`
            update munch.cook_events
            set event_type = ${normalized.eventType}, event_at = ${eventAt.eventAt},
                event_timezone = ${timezone}, time_precision = ${eventAt.precision},
                relative_phrase = ${normalized.relativePhrase ?? null},
                setpoint_temperature = ${normalized.setpointTemperature ?? null},
                setpoint_unit = ${normalized.setpointUnit ?? null},
                ambient_temperature = ${normalized.ambientTemperature ?? null},
                ambient_unit = ${normalized.ambientUnit ?? null},
                internal_temperature = ${normalized.internalTemperature ?? null},
                internal_unit = ${normalized.internalUnit ?? null},
                note = ${normalized.note ?? null}, original_message = ${normalized.originalMessage ?? null},
                correction_of_event_id = ${eventId}, version = version + 1, updated_at = now()
            where id = ${eventId} and cook_id = ${cookId} and version = ${expectedVersion}
            returning *
        `;
        if (!rows[0])
            throw new Error(
                "Cook event changed, is unavailable, or was not found",
            );
        return serializeEvent(rows[0]);
    });
}

export async function getCook(userId: string, cookId: string) {
    requireUuid(cookId, "cook ID");
    return withUserDatabase(userId, async (tx) => {
        const row = await cookRow(tx, cookId);
        if (!row) return null;
        const dishes = await tx<Array<Record<string, unknown>>>`
            select * from munch.cook_dishes where cook_id = ${cookId} order by position, id
        `;
        const updates = await tx<Array<Record<string, unknown>>>`
            select id, dish_id, source, raw_message, submitted_at, submitted_timezone,
                   media_status, media_error, idempotency_key, created_at
            from munch.cook_updates where cook_id = ${cookId} order by submitted_at, id
        `;
        const events = await tx<Array<Record<string, unknown>>>`
            select * from munch.cook_events where cook_id = ${cookId} order by event_at, submitted_at, id
        `;
        const outcomes = await tx<Array<Record<string, unknown>>>`
            select * from munch.cook_outcomes where cook_id = ${cookId}
            order by (dish_id is not null), updated_at desc, id
        `;
        const media = await tx<Array<Record<string, unknown>>>`
            select id, cook_id, dish_id, update_id, event_id, mime_type, file_name,
                   file_size, caption, created_at
            from munch.cook_media where cook_id = ${cookId} order by created_at, id
        `;
        return {
            cook: serializeCookRow(row, userId),
            dishes: dishes.map(serializeDish),
            updates: updates.map((update) => ({
                id: String(update.id),
                dish_id: nullableString(update.dish_id),
                source: String(update.source),
                raw_message: String(update.raw_message),
                submitted_at: new Date(
                    String(update.submitted_at),
                ).toISOString(),
                submitted_timezone: String(update.submitted_timezone),
                media_status: String(update.media_status),
                media_error: nullableString(update.media_error),
                idempotency_key: nullableString(update.idempotency_key),
                created_at: new Date(String(update.created_at)).toISOString(),
            })),
            events: events.map(serializeEvent),
            outcomes: outcomes.map((outcome) => ({
                id: String(outcome.id),
                dish_id: nullableString(outcome.dish_id),
                written_feedback: nullableString(outcome.written_feedback),
                overall_assessment: nullableNumber(outcome.overall_assessment),
                characteristics: outcome.characteristics ?? {},
                worked: nullableString(outcome.worked),
                disappointed: nullableString(outcome.disappointed),
                next_time_notes: nullableString(outcome.next_time_notes),
                ai_suggestions: outcome.ai_suggestions ?? [],
                is_preferred: Boolean(outcome.is_preferred),
                version: Number(outcome.version),
                updated_at: new Date(String(outcome.updated_at)).toISOString(),
            })),
            media: media.map((item) => serializeMedia(item, userId)),
        };
    });
}

export async function searchCooks(userId: string, input: CookSearchInput = {}) {
    const limit = Math.max(1, Math.min(50, input.limit ?? 20));
    const query = input.query?.trim().toLowerCase() || null;
    const dish = input.dish?.trim().toLowerCase() || null;
    const method = input.method?.trim().toLowerCase() || null;
    const flavor = input.flavor?.trim().toLowerCase() || null;
    const pattern = query ? escapeLike(query) : null;
    const queryTokens = query
        ? [
              ...new Set(
                  query.split(/\s+/).filter((token) => token.length > 1),
              ),
          ].slice(0, 8)
        : [];
    const queryTokenString = queryTokens.join(" ");
    const dishPattern = dish ? escapeLike(dish) : null;
    const methodPattern = method ? escapeLike(method) : null;
    const flavorPattern = flavor ? escapeLike(flavor) : null;
    const dateFrom = validateDate(input.dateFrom);
    const dateTo = validateDate(input.dateTo);
    if (dateFrom && dateTo && dateFrom > dateTo)
        throw new Error("Cook date range is invalid");
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select cook.*,
                   (select count(*) from munch.cook_media media where media.cook_id = cook.id) as photo_count,
                   (select media.id from munch.cook_media media where media.cook_id = cook.id order by media.created_at desc, media.id desc limit 1) as latest_photo_id
            from munch.cooks cook
            where (${input.status ?? "all"} = 'all' or cook.status = ${input.status ?? "all"})
              and (${dateFrom ?? null}::date is null or cook.cook_date >= ${dateFrom ?? null})
              and (${dateTo ?? null}::date is null or cook.cook_date <= ${dateTo ?? null})
              and (
                  ${pattern}::text is null
                  or lower(cook.title) like ${pattern} escape '\\'
                  or lower(coalesce(cook.notes, '')) like ${pattern} escape '\\'
                  or lower(coalesce(cook.original_message, '')) like ${pattern} escape '\\'
                  or exists (select 1 from munch.cook_dishes d where d.cook_id = cook.id and
                      lower(coalesce(d.name, '') || ' ' || coalesce(d.ingredient_or_cut, '') || ' ' ||
                            coalesce(d.method, '') || ' ' || coalesce(d.flavor, '') || ' ' || coalesce(d.equipment, '') || ' ' || coalesce(d.notes, '') || ' ' || coalesce(d.actual_ingredients::text, '')) like ${pattern} escape '\\')
                  or exists (select 1 from munch.cook_updates u where u.cook_id = cook.id and lower(u.raw_message) like ${pattern} escape '\\')
                  or exists (select 1 from munch.cook_events e where e.cook_id = cook.id and lower(coalesce(e.note, '') || ' ' || coalesce(e.original_message, '')) like ${pattern} escape '\\')
                  or exists (select 1 from munch.cook_outcomes o where o.cook_id = cook.id and lower(coalesce(o.written_feedback, '') || ' ' || coalesce(o.worked, '') || ' ' || coalesce(o.disappointed, '') || ' ' || coalesce(o.next_time_notes, '')) like ${pattern} escape '\\')
                  or (
                      select coalesce(bool_and(
                          cook.cook_date::text like '%' || token || '%'
                          or lower(cook.title) like '%' || token || '%'
                          or lower(coalesce(cook.notes, '')) like '%' || token || '%'
                          or lower(coalesce(cook.original_message, '')) like '%' || token || '%'
                          or exists (select 1 from munch.cook_dishes d where d.cook_id = cook.id and lower(coalesce(d.name, '') || ' ' || coalesce(d.ingredient_or_cut, '') || ' ' || coalesce(d.method, '') || ' ' || coalesce(d.flavor, '') || ' ' || coalesce(d.equipment, '') || ' ' || coalesce(d.notes, '') || ' ' || coalesce(d.actual_ingredients::text, '')) like '%' || token || '%')
                          or exists (select 1 from munch.cook_updates u where u.cook_id = cook.id and lower(u.raw_message) like '%' || token || '%')
                          or exists (select 1 from munch.cook_events e where e.cook_id = cook.id and lower(coalesce(e.note, '') || ' ' || coalesce(e.original_message, '')) like '%' || token || '%')
                          or exists (select 1 from munch.cook_outcomes o where o.cook_id = cook.id and lower(coalesce(o.written_feedback, '') || ' ' || coalesce(o.worked, '') || ' ' || coalesce(o.disappointed, '') || ' ' || coalesce(o.next_time_notes, '')) like '%' || token || '%')
                      ), false)
                      from unnest(string_to_array(${queryTokenString}::text, ' ')) as query_token(token)
                  )
              )
              and (${dishPattern}::text is null or exists (select 1 from munch.cook_dishes d where d.cook_id = cook.id and lower(d.name || ' ' || coalesce(d.ingredient_or_cut, '')) like ${dishPattern} escape '\\'))
              and (${methodPattern}::text is null or exists (select 1 from munch.cook_dishes d where d.cook_id = cook.id and lower(coalesce(d.method, '')) like ${methodPattern} escape '\\'))
              and (${flavorPattern}::text is null or exists (select 1 from munch.cook_dishes d where d.cook_id = cook.id and lower(coalesce(d.flavor, '')) like ${flavorPattern} escape '\\'))
            order by cook.cook_date desc, cook.updated_at desc, cook.id desc
            limit ${limit}
        `;
        return rows.map((row) => serializeCookRow(row, userId));
    });
}

export async function recordCookOutcome(
    userId: string,
    cookId: string,
    input: CookOutcomeInput,
) {
    requireUuid(cookId, "cook ID");
    if (input.dishId) requireUuid(input.dishId, "dish ID");
    if (
        input.overallAssessment !== undefined &&
        input.overallAssessment !== null &&
        (!Number.isFinite(input.overallAssessment) ||
            input.overallAssessment < 1 ||
            input.overallAssessment > 5)
    ) {
        throw new Error("Overall assessment must be between 1 and 5");
    }
    return withUserDatabase(userId, async (tx) => {
        if (input.dishId) {
            const dishRows = await tx<Array<{ id: string }>>`
                select id from munch.cook_dishes
                where id = ${input.dishId} and cook_id = ${cookId}
            `;
            if (!dishRows[0])
                throw new Error("Cook result dish is not part of this cook");
        }
        if (input.isPreferred) {
            await tx`
                update munch.cook_outcomes set is_preferred = false, updated_at = now(), updated_by_user_id = ${userId}
                where cook_id <> ${cookId} and is_preferred = true
                  and cook_id in (
                      select id from munch.cooks
                      where personal_owner_user_id = ${userId}
                         or (household_id is not null and munch.household_role(household_id) is not null)
                  )
            `;
        }
        const existing = await tx<Array<Record<string, unknown>>>`
            select * from munch.cook_outcomes
            where cook_id = ${cookId}
              and dish_id is not distinct from ${input.dishId ?? null}
            limit 1
        `;
        const rows = existing[0]
            ? await tx<Array<Record<string, unknown>>>`
            update munch.cook_outcomes
            set written_feedback = ${cleanText(input.writtenFeedback, "Written feedback")},
                overall_assessment = ${input.overallAssessment ?? null},
                characteristics = ${safeJson(input.characteristics, {})}::jsonb,
                worked = ${cleanText(input.worked, "What worked")},
                disappointed = ${cleanText(input.disappointed, "What disappointed you")},
                next_time_notes = ${cleanText(input.nextTimeNotes, "Next-time notes")},
                ai_suggestions = ${safeJson(input.aiSuggestions, [])}::jsonb,
                is_preferred = ${input.isPreferred ?? false},
                updated_by_user_id = ${userId}, updated_at = now(), version = version + 1
            where id = ${String(existing[0].id)}
              and (${input.expectedVersion ?? null}::integer is null or version = ${input.expectedVersion ?? null})
            returning *
        `
            : await tx<Array<Record<string, unknown>>>`
            insert into munch.cook_outcomes (
                cook_id, dish_id, written_feedback, overall_assessment, characteristics,
                worked, disappointed, next_time_notes, ai_suggestions, is_preferred,
                created_by_user_id, updated_by_user_id
            ) values (
                ${cookId}, ${input.dishId ?? null}, ${cleanText(input.writtenFeedback, "Written feedback")},
                ${input.overallAssessment ?? null}, ${safeJson(input.characteristics, {})}::jsonb,
                ${cleanText(input.worked, "What worked")}, ${cleanText(input.disappointed, "What disappointed you")},
                ${cleanText(input.nextTimeNotes, "Next-time notes")}, ${safeJson(input.aiSuggestions, [])}::jsonb,
                ${input.isPreferred ?? false}, ${userId}, ${userId}
            )
            returning *
        `;
        if (!rows[0])
            throw new Error(
                "Cook result changed, is unavailable, or was not found",
            );
        return {
            id: String(rows[0].id),
            cook_id: String(rows[0].cook_id),
            dish_id: nullableString(rows[0].dish_id),
            written_feedback: nullableString(rows[0].written_feedback),
            overall_assessment: nullableNumber(rows[0].overall_assessment),
            characteristics: rows[0].characteristics ?? {},
            worked: nullableString(rows[0].worked),
            disappointed: nullableString(rows[0].disappointed),
            next_time_notes: nullableString(rows[0].next_time_notes),
            ai_suggestions: rows[0].ai_suggestions ?? [],
            is_preferred: Boolean(rows[0].is_preferred),
            version: Number(rows[0].version),
        };
    });
}

export async function setPreferredCook(userId: string, cookId: string) {
    requireUuid(cookId, "cook ID");
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.cook_outcomes outcome
            set is_preferred = true, updated_at = now(), updated_by_user_id = ${userId}
            where outcome.cook_id = ${cookId}
              and outcome.dish_id is null
              and exists (select 1 from munch.cooks cook where cook.id = outcome.cook_id)
            returning outcome.id
        `;
        if (!rows[0])
            throw new Error(
                "Add an overall result before choosing a preferred cook",
            );
        await tx`
            update munch.cook_outcomes outcome
            set is_preferred = false, updated_at = now(), updated_by_user_id = ${userId}
            where outcome.cook_id <> ${cookId} and outcome.dish_id is null
              and outcome.is_preferred = true
              and outcome.cook_id in (
                  select id from munch.cooks
                  where personal_owner_user_id = ${userId}
                     or (household_id is not null and munch.household_role(household_id) is not null)
              )
        `;
        return { cookId, preferred: true };
    });
}

export async function repeatCook(
    userId: string,
    cookId: string,
    idempotencyKey?: string,
) {
    const source = await getCook(userId, cookId);
    if (!source) throw new Error("Source cook not found");
    const overall = source.outcomes.find((outcome) => outcome.dish_id === null);
    const setup = {
        ...((source.cook.setup_snapshot as Record<string, unknown>) ?? {}),
        carried_from_cook_id: cookId,
        previous_next_time_notes: overall?.next_time_notes ?? null,
    };
    const result = await createCook(userId, {
        title: source.cook.title,
        timezone: source.cook.timezone,
        notes: [
            `Fresh attempt based on ${source.cook.cook_date}.`,
            overall?.next_time_notes
                ? `Carry-forward note: ${overall.next_time_notes}`
                : null,
        ]
            .filter(Boolean)
            .join(" "),
        setupSnapshot: setup,
        sourceCookId: cookId,
        idempotencyKey,
        dishes: source.dishes.map((dish) => ({
            name: dish.name,
            ingredientOrCut: dish.ingredient_or_cut,
            method: dish.method,
            flavor: dish.flavor,
            equipment: dish.equipment,
            notes: dish.notes,
            actualIngredients: [],
            recipeId: dish.recipe_id,
            recipeRevisionId: dish.recipe_revision_id,
        })),
    });
    return { ...result, sourceCookId: cookId };
}

export async function compareCooks(userId: string, cookIds: string[]) {
    const unique = [...new Set(cookIds)];
    if (unique.length < 2 || unique.length > 5)
        throw new Error("Choose between 2 and 5 cooks to compare");
    const cooks = [];
    for (const cookId of unique) {
        const cook = await getCook(userId, cookId);
        if (!cook) throw new Error("One of the selected cooks was not found");
        cooks.push(cook);
    }
    return {
        cooks: cooks.map((entry) => entry.cook),
        dishes: cooks.map((entry) => entry.dishes),
        timelines: cooks.map((entry) => entry.events),
        outcomes: cooks.map((entry) => entry.outcomes),
        photos: cooks.map((entry) => entry.media),
    };
}

export async function prepareCookRecipeDraft(
    userId: string,
    cookId: string,
    dishId?: string,
) {
    const detail = await getCook(userId, cookId);
    if (!detail) throw new Error("Cook not found");
    return buildCookRecipeDraft(detail, dishId);
}

export function buildCookRecipeDraft(
    detail: NonNullable<Awaited<ReturnType<typeof getCook>>>,
    dishId?: string,
) {
    const cookId = detail.cook.id;
    const dish = dishId
        ? detail.dishes.find((item) => item.id === dishId)
        : detail.dishes[0];
    if (!dish) throw new Error("Dish not found on cook");
    const actualIngredients = Array.isArray(dish.actual_ingredients)
        ? dish.actual_ingredients
        : [];
    const ingredients = actualIngredients.map((ingredient: any) =>
        typeof ingredient === "string"
            ? { name: ingredient, source_type: "user_supplied" as const }
            : {
                  ...ingredient,
                  source_type: ingredient.source_type ?? "user_supplied",
              },
    );
    const instructions = [
        ...new Set(
            detail.events
                .filter(
                    (event) =>
                        event.dish_id === null || event.dish_id === dish.id,
                )
                .map((event) => event.note || event.original_message)
                .filter((value): value is string => Boolean(value))
                .map((value) => value.trim()),
        ),
    ];
    return {
        source_cook_id: cookId,
        source_dish_id: dish.id,
        draft: {
            name: dish.name,
            servings: null,
            description: detail.cook.notes ?? undefined,
            instructions,
            source_type: "user_entered" as const,
            ingredients,
        },
        missing_fields: [
            "servings",
            ...ingredients.flatMap((ingredient, index) =>
                Number(ingredient.quantity) > 0 && ingredient.unit
                    ? []
                    : [`ingredients[${index}].quantity/unit`],
            ),
            ...(ingredients.length ? [] : ["ingredients"]),
            ...(instructions.length ? [] : ["instructions"]),
        ],
        review_note:
            "Specify servings and review ingredient quantities and instructions before saving. Timeline observations are draft material, not a complete recipe. Munch will run its existing nutrition-resolution pipeline only after you save.",
    };
}

export async function saveCookAsRecipe(input: {
    userId: string;
    cookId: string;
    dishId?: string;
    scope?: PlanningScope;
    recipe: RecipeInput;
    idempotencyKey?: string;
}) {
    const detail = await getCook(input.userId, input.cookId);
    if (!detail) throw new Error("Cook not found");
    const dish = input.dishId
        ? detail.dishes.find((item) => item.id === input.dishId)
        : detail.dishes[0];
    if (!dish) throw new Error("Dish not found on cook");
    const result = await saveRecipe({
        userId: input.userId,
        scope: input.scope ?? { type: "personal" },
        recipe: input.recipe,
        idempotencyKey: input.idempotencyKey,
    });
    await withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.cook_dishes
            set recipe_id = ${result.recipeId}, recipe_revision_id = ${result.revisionId}, updated_at = now()
            where id = ${dish.id} and cook_id = ${input.cookId}
            returning id
        `;
        if (!rows[0])
            throw new Error(
                "Recipe saved but could not be linked to the cook dish",
            );
        await tx`
            update munch.cooks
            set version = version + 1, updated_at = now(), updated_by_user_id = ${input.userId}
            where id = ${input.cookId}
        `;
    });
    return { result, source_cook_id: input.cookId, source_dish_id: dish.id };
}

export async function logCookPortion(input: {
    userId: string;
    cookId: string;
    dishId?: string;
    servingsConsumed: number;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    notes?: string;
    idempotencyKey: string;
}) {
    const detail = await getCook(input.userId, input.cookId);
    if (!detail) throw new Error("Cook not found");
    const dish = input.dishId
        ? detail.dishes.find((item) => item.id === input.dishId)
        : detail.dishes[0];
    if (!dish) throw new Error("Dish not found on cook");
    if (!dish.recipe_id || !dish.recipe_revision_id) {
        throw new Error(
            "This dish has no exact recipe revision; review and save the cook as a recipe first",
        );
    }
    const result = await logRecipe({
        userId: input.userId,
        recipeId: dish.recipe_id,
        recipeRevisionId: dish.recipe_revision_id,
        servingsConsumed: input.servingsConsumed,
        mealType: input.mealType,
        notes: input.notes ?? `Logged from cook ${input.cookId}`,
        idempotencyKey: input.idempotencyKey,
    });
    return {
        result,
        source_cook_id: input.cookId,
        source_dish_id: dish.id,
        recipe_id: dish.recipe_id,
        recipe_revision_id: dish.recipe_revision_id,
    };
}

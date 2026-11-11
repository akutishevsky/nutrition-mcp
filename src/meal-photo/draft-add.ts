import {
    addMealDraftQuestion,
    deleteMealDraftItem,
    upsertMealDraftItem,
    type MealDraft,
} from "../meal-drafts/index.js";
import { blockingQuestionKey } from "../meal-drafts/blocking.js";
import { normalizeFoodText } from "../food-providers/ranking.js";
import {
    groundMealPhotoItems,
    type GroundedMealPhotoItem,
    type MealPhotoGroundingDeps,
} from "./grounding.js";
import {
    parseDraftAddTextDeterministic,
    type ParsedDraftAddItem,
} from "./draft-add-text.js";
import type {
    DraftAddModelParseResult,
    DraftAddParseContext,
    DraftAddPreparation,
} from "./draft-add-parse.js";
import type { MealPhotoVisionItem } from "./vision.js";

/**
 * Conversational add-to-draft for the photo flow (Amendment E item 3).
 *
 * The user photographs chicken and broccoli, reviews the draft, and
 * answers "Anything else to add?" with free text — "I added a good bit
 * of butter". The text is parsed DETERMINISTICALLY first
 * (draft-add-text.ts, reusing the recipe-import ingredient parser);
 * the Ember fallback (draft-add-parse.ts, injected as `parseWithModel`)
 * is spent only on deterministic failure. The parsed item then goes
 * through the SAME grounding path as photo items
 * (`groundMealPhotoItems`: canonical search → deterministic ranking
 * with the Ember tie-break only in the ambiguity band → provider
 * values; ungrounded → the labelled model-estimate step or a BLOCKING
 * question). The S3-hardening pipeline invariant therefore holds for
 * added items identically, and everything lands in the existing draft
 * machinery — confirm-before-save is untouched.
 *
 * LOW CONFIDENCE = QUESTION, NEVER A SILENT ADD:
 * - Unparseable text (both parsers resolve nothing) → honest no-add
 *   response in the review; the draft is unchanged.
 * - A weak parse (bare food name, defaulted portion) that grounding
 *   cannot resolve to a provider candidate → a draft QUESTION, not an
 *   estimated item: the parse never earned an estimate.
 * - A grounded pick that shares no name token with what the user
 *   typed is not a match at all → draft question, nothing added.
 * - A strong parse that stays ungrounded follows the photo pipeline:
 *   labelled "Model estimate" values, or a blocking question when the
 *   estimate step fails.
 *
 * Added items are marked as user-added: every item's assumptions lead
 * with `Added by you: "<their text>"` and the source snapshot records
 * the parse source — provenance stays honest.
 */

export interface DraftAddDeps extends MealPhotoGroundingDeps {
    /** Ember fallback parse (draft-add-parse.ts). Injected so tests
     * can count calls and replay recorded responses. Omit to disable
     * the fallback (deterministic-only). The parse receives the
     * draft's current items as context so a preparation statement can
     * name the item it corrects (photo-flow P2). */
    parseWithModel?: (
        text: string,
        context: DraftAddParseContext,
    ) => Promise<DraftAddModelParseResult>;
}

/** A preparation correction as APPLIED to a draft item (P2). */
export interface AppliedPreparation {
    itemName: string;
    cookingMethod: string;
    previousMethod: string | null;
}

export type DraftAddOutcome =
    | {
          status: "added";
          draft: MealDraft;
          added: GroundedMealPhotoItem[];
          parseSource: "deterministic" | "model";
          replacedItemName: string | null;
          preparation: AppliedPreparation | null;
          message: string;
      }
    | {
          status: "updated";
          draft: MealDraft;
          preparation: AppliedPreparation;
          parseSource: "deterministic" | "model";
          message: string;
      }
    | {
          status: "question";
          draft: MealDraft;
          parseSource: "deterministic" | "model";
          message: string;
      }
    | {
          status: "no_add";
          draft: MealDraft;
          message: string;
      };

/**
 * The parse → ground → low-confidence-gate core, with NO database
 * access: recorded-fixture tests exercise exactly this chain, and
 * `addTextToPhotoDraft` persists what it decides.
 */
export type DraftAddResolution =
    | { kind: "none" }
    | { kind: "no_parse" }
    | {
          kind: "question";
          parseSource: "deterministic" | "model";
          parsed: ParsedDraftAddItem[];
          grounded: GroundedMealPhotoItem[];
          unresolvedNames: string[];
      }
    | {
          kind: "preparation_question";
          parseSource: "model";
          preparation: DraftAddPreparation;
      }
    | {
          kind: "ready";
          parseSource: "deterministic" | "model";
          parsed: ParsedDraftAddItem[];
          grounded: GroundedMealPhotoItem[];
          removeName: string | null;
          preparation: DraftAddPreparation | null;
          /** The draft-context item name the preparation targets
           * (already matched during resolution); null when there is
           * no preparation or it could not be targeted — the latter
           * resolves as "preparation_question" instead. */
          preparationTargetName: string | null;
      };

function textHash(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
        hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
    }
    return hash.toString(36);
}

function toVisionItem(item: ParsedDraftAddItem): MealPhotoVisionItem {
    return {
        name: item.name,
        cooking_method: null,
        quantity: item.quantity,
        unit: item.unit,
        portion_confidence: item.portionConfidence,
        assumptions: [...item.assumptions],
    };
}

/** Does the grounded candidate's display name share any token with
 * what the user typed? A pick sharing nothing is not a match. */
function pickSharesNameToken(
    parsedName: string,
    entry: GroundedMealPhotoItem,
): boolean {
    const wanted = new Set(
        normalizeFoodText(parsedName).split(" ").filter(Boolean),
    );
    const offered = new Set(
        normalizeFoodText(entry.draftItem.name).split(" ").filter(Boolean),
    );
    for (const token of wanted) {
        if (offered.has(token)) return true;
    }
    return false;
}

/** Does a draft item's name match the name the user/model gave?
 * Exact, containment, or any shared token (the same tolerant matching
 * replacement phrasing has always used). */
function nameMatches(candidateName: string, wantedName: string): boolean {
    const name = normalizeFoodText(candidateName);
    const wanted = normalizeFoodText(wantedName);
    if (!name || !wanted) return false;
    if (name === wanted || name.includes(wanted) || wanted.includes(name)) {
        return true;
    }
    const wantedTokens = new Set(wanted.split(" ").filter(Boolean));
    return name
        .split(" ")
        .filter(Boolean)
        .some((token) => wantedTokens.has(token));
}

export async function resolveDraftAdd(
    text: string,
    deps: DraftAddDeps,
    draftItems: DraftAddParseContext["items"] = [],
): Promise<DraftAddResolution> {
    const deterministic = parseDraftAddTextDeterministic(text);
    if (deterministic?.kind === "none") return { kind: "none" };

    let parseSource: "deterministic" | "model";
    let items: ParsedDraftAddItem[];
    let removeName: string | null;
    let preparation: DraftAddPreparation | null = null;
    let preparationTargetName: string | null = null;
    if (deterministic?.kind === "add" || deterministic?.kind === "replace") {
        parseSource = "deterministic";
        items = deterministic.items;
        removeName =
            deterministic.kind === "replace" ? deterministic.removeName : null;
    } else {
        // Deterministic failure is the ONLY path that spends the
        // Ember fallback.
        if (!deps.parseWithModel) return { kind: "no_parse" };
        let model: DraftAddModelParseResult;
        try {
            model = await deps.parseWithModel(text, { items: draftItems });
        } catch {
            // A failed fallback is an honest no-add, never a silent add.
            return { kind: "no_parse" };
        }
        preparation = model.preparation;
        if (preparation) {
            // The preparation must land on a KNOWN item: a named
            // target that matches nothing, or an unnamed target on a
            // multi-item draft, becomes a question — never a guess.
            if (preparation.targetItem) {
                const match = draftItems.find((item) =>
                    nameMatches(item.name, preparation!.targetItem!),
                );
                if (!match) {
                    return {
                        kind: "preparation_question",
                        parseSource: "model",
                        preparation,
                    };
                }
                preparationTargetName = match.name;
            } else if (draftItems.length === 1) {
                preparationTargetName = draftItems[0]!.name;
            } else {
                return {
                    kind: "preparation_question",
                    parseSource: "model",
                    preparation,
                };
            }
        }
        if (model.items.length === 0 && !preparation) {
            return { kind: "no_parse" };
        }
        parseSource = "model";
        items = model.items;
        removeName = model.replaces;
    }

    const grounded = await groundMealPhotoItems(items.map(toVisionItem), deps);

    // Low-confidence gate: a weak parse that did not ground to a real
    // candidate, or any pick sharing no name token with the typed
    // food, becomes a draft question — nothing half-added.
    const unresolvedNames: string[] = [];
    grounded.forEach((entry, index) => {
        const parsed = items[index]!;
        if (entry.grounded) {
            if (!pickSharesNameToken(parsed.name, entry)) {
                unresolvedNames.push(parsed.name);
            }
        } else if (!parsed.strongSignal) {
            unresolvedNames.push(parsed.name);
        }
    });
    if (unresolvedNames.length > 0) {
        return {
            kind: "question",
            parseSource,
            parsed: items,
            grounded,
            unresolvedNames,
        };
    }
    // Mark every added item as user-added in its assumptions and
    // source snapshot, so provenance is honest wherever the item is
    // later rendered. (Done here, not at persistence, so the recorded
    // -fixture tests assert the exact persisted shape.)
    const marked = grounded.map((entry, index) => ({
        ...entry,
        draftItem: {
            ...entry.draftItem,
            assumptions: [
                `Added by you: "${text}"`,
                ...(entry.draftItem.assumptions ?? []),
            ].slice(0, 20),
            sourceSnapshot: {
                ...(entry.draftItem.sourceSnapshot ?? {}),
                draft_add_text: text,
                draft_add_parse_source: parseSource,
                draft_add_quantity_assumed: items[index]!.quantityAssumed,
            },
        },
    }));
    return {
        kind: "ready",
        parseSource,
        parsed: items,
        grounded: marked,
        removeName,
        preparation,
        preparationTargetName,
    };
}

function findItemToRemove(
    draft: MealDraft,
    removeName: string,
): MealDraft["items"][number] | undefined {
    return draft.items.find((record) =>
        nameMatches(record.item.name, removeName),
    );
}

/**
 * Plan a preparation correction on one draft item (photo-flow P2) —
 * pure, so the recorded-fixture tests assert the exact persisted
 * shape. The corrected method is recorded in the item's assumptions
 * (leading, user-attributed) and in its source snapshot, where
 * grounding put the photo's original method read. The item's grounded
 * nutrition is NOT silently rewritten: the method's material
 * nutrition effect (absorbed frying oil, etc.) arrives as its own
 * visible added item through the ordinary grounding path.
 */
export function planPreparationUpdate(
    item: MealDraft["items"][number]["item"],
    preparation: DraftAddPreparation,
): {
    item: MealDraft["items"][number]["item"];
    previousMethod: string | null;
} {
    const snapshot = item.sourceSnapshot ?? {};
    const previousMethod =
        typeof snapshot.cooking_method === "string" &&
        snapshot.cooking_method.trim()
            ? snapshot.cooking_method.trim()
            : null;
    const correction = previousMethod
        ? `Cooking method corrected by you: "${preparation.cookingMethod}" (photo estimate said "${previousMethod}").`
        : `Cooking method noted by you: "${preparation.cookingMethod}".`;
    return {
        item: {
            ...item,
            assumptions: [correction, ...(item.assumptions ?? [])].slice(0, 20),
            sourceSnapshot: {
                ...snapshot,
                cooking_method: preparation.cookingMethod,
                ...(previousMethod
                    ? { cooking_method_corrected_from: previousMethod }
                    : {}),
                cooking_method_corrected_via: "draft_add_text",
            },
        },
        previousMethod,
    };
}

/**
 * Parse `text`, ground the result, and add it to the photo draft.
 * `draft` must be the caller's freshly loaded draft (its version
 * threads every repository write). The returned draft is the latest
 * persisted state for "added"/"question" outcomes; for "no_add" the
 * input draft is returned unchanged.
 */
export async function addTextToPhotoDraft(input: {
    userId: string;
    draft: MealDraft;
    text: string;
    deps: DraftAddDeps;
}): Promise<DraftAddOutcome> {
    const text = input.text.replace(/\s+/g, " ").trim().slice(0, 500);
    let draft = input.draft;
    if (draft.sourceMode !== "photo") {
        throw new Error("Text adds are only available on photo drafts");
    }
    const resolution = await resolveDraftAdd(
        text,
        input.deps,
        draft.items.map((record) => ({
            name: record.item.name,
            cookingMethod:
                typeof record.item.sourceSnapshot?.cooking_method === "string"
                    ? record.item.sourceSnapshot.cooking_method
                    : null,
        })),
    );
    if (resolution.kind === "none") {
        return {
            status: "no_add",
            draft,
            message: "Nothing added — the draft is unchanged.",
        };
    }
    if (resolution.kind === "no_parse") {
        return {
            status: "no_add",
            draft,
            message: `We couldn't identify a food to add from "${text}". Try naming the food and amount, like "1 tbsp butter" — or use the structured add below. Nothing was added.`,
        };
    }
    if (resolution.kind === "preparation_question") {
        draft = await addMealDraftQuestion({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            questionKey: `photo_draft_add_preparation_${textHash(text)}`,
            prompt: `You noted a preparation change ("${text.slice(0, 200)}"), but we couldn't tell which item in this draft was ${resolution.preparation.cookingMethod}. Which item does it refer to? Answer here, or edit the item directly.`,
            impactScore: 70,
        });
        return {
            status: "question",
            draft,
            parseSource: resolution.parseSource,
            message: `We couldn't tell which item "${text.slice(0, 200)}" refers to, so we left a question on the draft instead — nothing was changed.`,
        };
    }
    if (resolution.kind === "question") {
        const names = resolution.unresolvedNames.join(", ").slice(0, 200);
        draft = await addMealDraftQuestion({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            questionKey: `photo_draft_add_unresolved_${textHash(text)}`,
            prompt: `You asked to add "${text.slice(0, 200)}", but we couldn't pin down ${names} in a food database well enough to add it automatically. What exactly was it, and how much? Add it with the structured add below, or answer here with the details.`,
            impactScore: 70,
        });
        return {
            status: "question",
            draft,
            parseSource: resolution.parseSource,
            message: `We couldn't add ${names} automatically, so we left a question on the draft instead — nothing was half-added.`,
        };
    }

    const grounded = resolution.grounded;

    // Replacement phrasing rides the existing remove+add semantics:
    // the named item is deleted through the ordinary draft-item delete
    // (its questions cascade with it, as for any removed item).
    let replacedItemName: string | null = null;
    if (resolution.removeName) {
        const target = findItemToRemove(draft, resolution.removeName);
        if (target) {
            replacedItemName = target.item.name;
            draft = await deleteMealDraftItem({
                userId: input.userId,
                draftId: draft.id,
                itemId: target.id,
                expectedVersion: draft.version,
            });
        }
    }

    // Preparation correction (P2): the corrected cooking method lands
    // on the existing item as a visible, user-attributed update —
    // applied BEFORE the additions so positions thread cleanly.
    let appliedPreparation: AppliedPreparation | null = null;
    if (resolution.preparation && resolution.preparationTargetName) {
        const target = findItemToRemove(
            draft,
            resolution.preparationTargetName,
        );
        if (target) {
            const planned = planPreparationUpdate(
                target.item,
                resolution.preparation,
            );
            draft = await upsertMealDraftItem({
                userId: input.userId,
                draftId: draft.id,
                expectedVersion: draft.version,
                position: target.position,
                item: planned.item,
            });
            appliedPreparation = {
                itemName: target.item.name,
                cookingMethod: resolution.preparation.cookingMethod,
                previousMethod: planned.previousMethod,
            };
        }
    }

    const basePosition = draft.items.length;
    const added: GroundedMealPhotoItem[] = [];
    for (const [index, entry] of grounded.entries()) {
        added.push(entry);
        draft = await upsertMealDraftItem({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            position: basePosition + index,
            item: entry.draftItem,
        });
    }
    // Questions reference persisted item records; keys are remapped to
    // the item's position in the DRAFT so they cannot collide with the
    // photo items' question keys (grounding keyed them from 0).
    for (const [index, entry] of added.entries()) {
        if (!entry.question) continue;
        const position = basePosition + index;
        const record = draft.items.find((item) => item.position === position);
        draft = await addMealDraftQuestion({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            questionKey: entry.question.blocking
                ? blockingQuestionKey(position)
                : `photo_portion_${position}`,
            prompt: entry.question.prompt,
            impactScore: entry.question.impactScore,
            itemId: record?.id,
        });
    }

    const names = added.map((entry) => entry.draftItem.name).join(", ");
    if (added.length === 0 && appliedPreparation) {
        return {
            status: "updated",
            draft,
            preparation: appliedPreparation,
            parseSource: resolution.parseSource,
            message: `${appliedPreparation.itemName}: cooking method set to ${appliedPreparation.cookingMethod}${appliedPreparation.previousMethod ? ` (was ${appliedPreparation.previousMethod})` : ""}.`,
        };
    }
    const messageParts: string[] = [];
    if (replacedItemName) {
        messageParts.push(`Replaced ${replacedItemName} with ${names}.`);
    } else if (added.length > 0) {
        messageParts.push(`Added ${names} to the draft.`);
    }
    if (appliedPreparation) {
        messageParts.push(
            `${appliedPreparation.itemName}: cooking method set to ${appliedPreparation.cookingMethod}${appliedPreparation.previousMethod ? ` (was ${appliedPreparation.previousMethod})` : ""}.`,
        );
    }
    return {
        status: "added",
        draft,
        added,
        parseSource: resolution.parseSource,
        replacedItemName,
        preparation: appliedPreparation,
        message: messageParts.join(" ") || "Draft updated.",
    };
}

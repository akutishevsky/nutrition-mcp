/**
 * Meal naming for photo drafts (photo-flow P5).
 *
 * Photo drafts are created under a working placeholder description —
 * the user hasn't named the meal; the pipeline only knows what it
 * saw. Confirmed meals must not keep that placeholder as their name:
 * it leaked into every surface that names a meal (Today's totals
 * decomposition showed "10 pm photo estimate" instead of the food).
 * At confirm time the meal is named from its identified items.
 */

export const PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION =
    "Photo estimate — check portions";

/**
 * Compose a meal description from its item names: the first item,
 * plus "+ N more" when the meal has more. Returns null when there are
 * no usable names (the caller keeps whatever description it has).
 */
export function mealDescriptionFromItems(
    itemNames: readonly string[],
): string | null {
    const names = itemNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
    if (names.length === 0) return null;
    const [first, ...rest] = names;
    const composed =
        rest.length > 0 ? `${first} + ${rest.length} more` : first!;
    return composed.slice(0, 200);
}

/** True when a description is the photo placeholder (or its notes twin). */
export function isPhotoPlaceholderDescription(
    description: string | null | undefined,
): boolean {
    return description?.trim() === PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION;
}

/**
 * The description a CONFIRMED meal carries (photo-flow P5): a photo
 * draft still wearing the placeholder is named from its items; any
 * user-edited description — and every non-photo draft — passes
 * through untouched.
 */
export function confirmedMealDescription(input: {
    sourceMode: string;
    description: string | null | undefined;
    itemNames: readonly string[];
}): string | null | undefined {
    if (
        input.sourceMode === "photo" &&
        isPhotoPlaceholderDescription(input.description)
    ) {
        return mealDescriptionFromItems(input.itemNames) ?? input.description;
    }
    return input.description;
}

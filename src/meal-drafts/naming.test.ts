import { describe, expect, test } from "bun:test";
import {
    isPhotoPlaceholderDescription,
    mealDescriptionFromItems,
    PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION,
    confirmedMealDescription,
} from "./naming.js";

describe("mealDescriptionFromItems (photo-flow P5)", () => {
    test("a single item names the meal outright — the corn case", () => {
        expect(mealDescriptionFromItems(["Corn On The Cob"])).toBe(
            "Corn On The Cob",
        );
    });

    test("multiple items name the first plus the count of the rest", () => {
        expect(
            mealDescriptionFromItems([
                "Grilled chicken breast",
                "Cooked white rice",
                "Steamed broccoli",
            ]),
        ).toBe("Grilled chicken breast + 2 more");
    });

    test("blank names are skipped; no names yields null", () => {
        expect(mealDescriptionFromItems(["", "  "])).toBeNull();
        expect(mealDescriptionFromItems([])).toBeNull();
        expect(mealDescriptionFromItems(["  Rice  "])).toBe("Rice");
    });
});

describe("confirmedMealDescription", () => {
    test("photo draft + placeholder → named from items", () => {
        expect(
            confirmedMealDescription({
                sourceMode: "photo",
                description: PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION,
                itemNames: ["Corn On The Cob"],
            }),
        ).toBe("Corn On The Cob");
    });

    test("photo draft + user-edited description → untouched", () => {
        expect(
            confirmedMealDescription({
                sourceMode: "photo",
                description: "Dad's cookout",
                itemNames: ["Corn On The Cob"],
            }),
        ).toBe("Dad's cookout");
    });

    test("non-photo draft → untouched even if the text matches", () => {
        expect(
            confirmedMealDescription({
                sourceMode: "manual",
                description: PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION,
                itemNames: ["Corn On The Cob"],
            }),
        ).toBe(PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION);
    });
});

describe("isPhotoPlaceholderDescription", () => {
    test("matches only the exact placeholder", () => {
        expect(
            isPhotoPlaceholderDescription(PHOTO_DRAFT_PLACEHOLDER_DESCRIPTION),
        ).toBe(true);
        expect(isPhotoPlaceholderDescription("Photo estimate")).toBe(false);
        expect(isPhotoPlaceholderDescription("Team lunch")).toBe(false);
        expect(isPhotoPlaceholderDescription(null)).toBe(false);
        expect(isPhotoPlaceholderDescription(undefined)).toBe(false);
    });
});

import { describe, expect, test } from "bun:test";
import { fitWithinEdge, photoCaptureMarkup } from "./photo-capture.js";

/**
 * Photo-flow P8: the shared capture control's contract — two explicit
 * actions (camera default, library secondary), the file input hidden
 * and never presented bare, and each surface's existing input
 * contract (ids/names) preserved.
 */
describe("photoCaptureMarkup", () => {
    test("renders Take photo (primary) + Choose from library (secondary) and a hidden input", () => {
        const markup = photoCaptureMarkup({
            inputId: "meal-photo-file",
            label: "Meal photo",
        });
        expect(markup).toContain("data-photo-capture");
        expect(markup).toContain('data-capture-action="camera"');
        expect(markup).toContain("Take photo");
        expect(markup).toContain('data-capture-action="library"');
        expect(markup).toContain("Choose from library");
        expect(markup).toContain('id="meal-photo-file"');
        expect(markup).toContain('type="file"');
        expect(markup).toContain("hidden");
        // Camera is the primary action and comes first.
        expect(markup.indexOf("Take photo")).toBeLessThan(
            markup.indexOf("Choose from library"),
        );
        // The bare-input pattern the brief bans: a visible labelled
        // file field with capture= as the only affordance.
        expect(markup).not.toContain('capture="environment"');
    });

    test("cook form contract: name=photos + multiple", () => {
        const markup = photoCaptureMarkup({
            name: "photos",
            label: "Photos",
            multiple: true,
        });
        expect(markup).toContain('name="photos"');
        expect(markup).toContain("multiple");
    });
});

describe("fitWithinEdge (photo-flow P7 downscale math)", () => {
    test("a 4032×3024 phone frame caps at the long edge, aspect kept", () => {
        expect(fitWithinEdge(4032, 3024, 1568)).toEqual({
            width: 1568,
            height: 1176,
            scaled: true,
        });
    });

    test("small images pass through unscaled", () => {
        expect(fitWithinEdge(800, 600, 1568)).toEqual({
            width: 800,
            height: 600,
            scaled: false,
        });
    });

    test("portrait frames cap on height", () => {
        expect(fitWithinEdge(1176, 4032, 1568)).toEqual({
            width: 457,
            height: 1568,
            scaled: true,
        });
    });
});

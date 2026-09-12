import { test, expect } from "bun:test";

// form.css is only pulled in by import-meals and the dev gallery, so a
// regression in it shows up on the least-visited surface in the system and
// nowhere a casual look at nutrition-summary would catch it. These pin the
// rules that were each a real finding in the port audit, read straight off the
// source partial: the assembled widget carries it verbatim (widgets.test.ts
// already proves that), so testing the partial tests what ships.

const CSS = await Bun.file(
    new URL("./src/shared/form.css", import.meta.url),
).text();

/** Every top-level `selector { body }` block, comments stripped. form.css has
 *  no nested at-rules, so a flat brace match is a complete parse of it — the
 *  first test fails loudly if that ever stops being true. */
const RULES = [
    ...CSS.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g),
].map((m) => ({
    selectors: m[1]!
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    body: m[2]!,
}));

/** The value of `prop` on the first rule whose selector list is exactly
 *  `selectors` (order-insensitive), or undefined. */
function decl(selectors: string[], prop: string): string | undefined {
    const want = [...selectors].sort().join(",");
    const rule = RULES.find((r) => [...r.selectors].sort().join(",") === want);
    const m = rule?.body.match(
        new RegExp(`(?:^|;)\\s*${prop.replace(/-/g, "\\-")}\\s*:\\s*([^;]+)`),
    );
    return m?.[1]!.trim().replace(/\s+/g, " ");
}

test("form.css is flat (the rule parser below depends on it)", () => {
    expect(CSS).not.toMatch(/@(media|supports|container|layer)\b/);
    expect(RULES.length).toBeGreaterThan(20);
});

// SC 1.4.11: a control's edge is the only thing locating it. The card's
// --line hairline is ~1.3:1, so the controls redeclare it to --edge (~3:1),
// hover to --edge2 (~4:1). The drop zone's resting border is 2px dashed — at
// --edge2 it would be the heaviest edge on the card, so both its tokens are
// --edge and its hover is the accent instead.
test("controls draw their border on --edge, not the --line hairline", () => {
    expect(decl([".input", ".select", ".btn"], "--line")).toBe("var(--edge)");
    expect(decl([".input", ".select", ".btn"], "--line2")).toBe("var(--edge2)");
    expect(decl([".drop"], "--line")).toBe("var(--edge)");
    expect(decl([".drop"], "--line2")).toBe("var(--edge)");
    expect(decl([".drop"], "border")).toBe("2px dashed var(--line2)");
});

// CLAUDE.md: never animate a layout property — the bridge measures on every
// ResizeObserver tick, so an animated size is a 60Hz size-changed storm. The
// progress fills used to carry `transition: width`, which also never fired,
// because every render recreates the node.
test("no transition in form.css names a layout property", () => {
    const layout =
        /\b(width|height|max-height|min-height|margin|padding|top|left|right|bottom|inset|gap|flex-basis|all)\b/;
    const transitions = RULES.flatMap((r) =>
        [
            ...r.body.matchAll(
                /(?:^|;)\s*transition(?:-property)?\s*:([^;]+)/g,
            ),
        ].map((m) => ({ sel: r.selectors.join(", "), value: m[1]!.trim() })),
    );
    expect(transitions.length).toBeGreaterThan(0);
    for (const t of transitions) {
        for (const part of t.value.split(",")) {
            const prop = part.trim().split(/\s+/)[0]!;
            expect({ sel: t.sel, prop, layout: layout.test(prop) }).toEqual({
                sel: t.sel,
                prop,
                layout: false,
            });
        }
    }
});

// One motion curve across the system, and a named longhand: the `background`
// shorthand also transitions background-image/-position, which on .select is
// the chevron.
test("control transitions use var(--ease-out) and background-color", () => {
    for (const sel of [[".input", ".select"], [".btn"], [".drop"]]) {
        const value = decl(sel, "transition");
        expect(value).toBeDefined();
        for (const part of value!.split(",")) {
            expect(part).toContain("var(--ease-out)");
            expect(part.trim()).not.toMatch(/^background\s/);
            expect(part).not.toMatch(/\bease\b(?!-)/);
        }
    }
    expect(decl([".drop"], "transition")).toContain("transform");
});

test(".drop is a pressable card-inner surface", () => {
    expect(decl([".drop"], "border-radius")).toBe("var(--r-in)");
    expect(decl([".drop"], "-webkit-tap-highlight-color")).toBe("transparent");
    expect(decl([".drop:active"], "transform")).toBe("translateY(1px)");
});

// The step caption moved into the card header (.chead / .cmeta); a leftover
// .slab rule would be dead CSS that looks live to the next reader.
test(".slab is gone", () => {
    expect(RULES.some((r) => r.selectors.some((s) => /\.slab\b/.test(s)))).toBe(
        false,
    );
});

// The inline validation message is out of scope for this port: pinned so an
// unrelated sweep of form.css does not quietly restyle it.
test(".field-error is unchanged", () => {
    expect(decl([".field-error"], "color")).toBe("var(--over)");
    expect(decl([".field-error"], "font-size")).toBe("11.5px");
});

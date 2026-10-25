// Guards the two height-reporting fixes behind the import-meals footer clip.
//
// The host iframe is sized from ui/notifications/size-changed, which the bridge
// computes by measuring the document at max-content. Two things made that
// measure wrong and made the reported height seesaw (604 <-> 585 in German):
//   1. a classic scrollbar appears when the iframe is shorter than the content
//      and steals ~15px of layout width, so the content re-wraps taller than
//      the height that was just reported. The bridge reserves the gutter in
//      host iframes (scrollbar-gutter: stable) so the width never changes.
//   2. the visually hidden #imp-live live region sat absolutely positioned
//      just below #root, so its 1px box extended the scrollable overflow past
//      the measured height. Pinning .vh to the top-left corner removes that.
// Both are CSS/inline-style facts, so they are checked against the assembled
// widget text rather than a DOM (no layout engine runs under bun test).
import { test, expect } from "bun:test";

test("bridge reserves the scrollbar gutter inside a host iframe only", async () => {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("import-meals");
    const start = html.indexOf("function ensureStableGutter()");
    expect(start).toBeGreaterThan(-1);
    const body = html.slice(start, start + 300);
    expect(body).toContain("if (!host) return;");
    expect(body).toContain(
        'document.documentElement.style.scrollbarGutter = "stable";',
    );
    expect(html).toContain("ensureStableGutter();");
});

test("the .vh visually hidden box is pinned to the top-left corner", async () => {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("import-meals");
    const rule = html.match(/\.vh \{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).toContain("position: absolute;");
    expect(rule![1]).toContain("top: 0;");
    expect(rule![1]).toContain("left: 0;");
});

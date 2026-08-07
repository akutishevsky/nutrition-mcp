// Behaviour test for the nutrition-summary widget's loggedDaysCaption() —
// issue #70. The hero rings on this dashboard average over the days that carry
// a log, while the get_trends rings average over every calendar day in the
// window, so the same 15-of-30-days month legitimately reads 2000 kcal here and
// 1000 kcal there. The caption is half of how a reader tells them apart, which
// makes its exact wording load-bearing rather than cosmetic.
//
// The other half is that `days_in_range` is OPTIONAL: a host replaying a tool
// result recorded before the field existed must render byte-identically to
// before, so every unusable value has to fall through to the legacy string.
//
// Same evaluation technique as import-time.test.ts: the real assembled widget
// script is run as one script with only the `initWidget({…})` bootstrap cut off.
import { test, expect } from "bun:test";

async function freshSummaryWidget() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("nutrition-summary");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("nutrition-summary bootstrap not found");
    const factory = new Function(
        `${script.slice(0, boot)}
         return { loggedDaysCaption };`,
    );
    return factory() as {
        loggedDaysCaption: (data: Record<string, unknown>) => string;
    };
}

const { loggedDaysCaption } = await freshSummaryWidget();

test("a window with gaps names both denominators", () => {
    expect(loggedDaysCaption({ logged_days: 15, days_in_range: 30 })).toBe(
        "15 of 30 days logged",
    );
});

test("a fully logged window keeps the plain caption", () => {
    expect(loggedDaysCaption({ logged_days: 30, days_in_range: 30 })).toBe(
        "30 days logged",
    );
});

// The pre-#70 payload shape. Anything that is not a usable span has to render
// exactly as it always did, plural included — a host is free to replay an old
// tool result at us, and "undefined days logged" would be a visible regression.
test("a payload without days_in_range renders as it always did", () => {
    for (const span of [undefined, null, "oops", NaN]) {
        expect(loggedDaysCaption({ logged_days: 7, days_in_range: span })).toBe(
            "7 days logged",
        );
    }
    expect(loggedDaysCaption({ logged_days: 1 })).toBe("1 day logged");
});

// A span narrower than the days we hold is incoherent; prefer the caption that
// cannot be wrong over one that asserts a denominator we do not trust.
test("a span smaller than the logged days falls back", () => {
    expect(loggedDaysCaption({ logged_days: 7, days_in_range: 3 })).toBe(
        "7 days logged",
    );
});

// Behaviour tests for the nutrition-summary card: its loggedDaysCaption() and
// the two ways the same card gets built.
//
// loggedDaysCaption() —
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

// A DOM small enough for render() and no larger: one #root whose innerHTML is
// captured, and enough of `document` for the partials' guarded wiring. Handed
// to the script as PARAMETERS, never set on globalThis — `bun test` shares one
// process across files, and macros.test.ts's markup half deliberately runs
// with no document at all.
function stubDom() {
    const root = {
        innerHTML: "",
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        contains: () => false,
    };
    const doc = {
        getElementById: (id: string) => (id === "root" ? root : null),
        querySelector: () => null,
        addEventListener: () => {},
        activeElement: null,
        hasFocus: () => false,
    };
    return { root, doc };
}

async function freshSummaryWidget() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("nutrition-summary");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("nutrition-summary bootstrap not found");
    const { root, doc } = stubDom();
    const factory = new Function(
        "document",
        "window",
        `${script.slice(0, boot)}
         return { loggedDaysCaption, rangeLabel, summaryCard, summaryCharted, sparkMarkup, SPARK, render, SAMPLE };`,
    );
    return {
        root,
        ...(factory(doc, {}) as {
            loggedDaysCaption: (data: Record<string, unknown>) => string;
            rangeLabel: (start: string, end: string) => string;
            summaryCard: (
                data: unknown,
                opts?: { inlineChart?: boolean; idPrefix?: string },
            ) => string;
            summaryCharted: (data: unknown) => boolean;
            sparkMarkup: (o: Record<string, unknown>) => string;
            SPARK: { slots: unknown[]; goals: unknown };
            render: (data: unknown) => void;
            SAMPLE: Record<string, unknown>;
        }),
    };
}

const widget = await freshSummaryWidget();
const { loggedDaysCaption, rangeLabel, summaryCard, SAMPLE } = widget;

// The header's date guard, as the card actually ships it (rangeLabel now comes
// from shared/date.js). ymd() used to accept any day in months 1..12, so a
// payload ending "2026-02-31" read "1–31 Feb" in the header — a date nobody
// sent. It must now take the raw passthrough. The wider matrix lives in
// date.test.ts; this pins that the assembled widget is wired to the fixed one.
test("an impossible end date is passed through, not invented", () => {
    expect(rangeLabel("2026-02-01", "2026-02-31")).toBe(
        "2026-02-01 → 2026-02-31",
    );
});

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

// ---- One card, two callers -------------------------------------------------
//
// The composition lives in shared/summary-card.js because the public landing
// page renders this same card at BUILD TIME, with no DOM, from the same
// payload shape (scripts/gen-index.ts). The two must not be two cards: what
// the chat widget writes into #root and what summaryCard returns have to be
// the same string, and the build-time flag has to change nothing but where the
// sparkline comes from.

// Everything inside the panel's `.fspark` slot, and the card with that slot
// emptied again — the one difference `inlineChart` is allowed to make.
function splitChart(card: string) {
    const open = '<span class="fspark">';
    const at = card.indexOf(open);
    if (at === -1) return { chart: "", shell: card };
    const from = at + open.length;
    const to = card.indexOf("</span>", from);
    return {
        chart: card.slice(from, to),
        shell: card.slice(0, from) + card.slice(to),
    };
}

test("the widget writes exactly the card summaryCard composes", () => {
    widget.render(SAMPLE);
    // render() sets the locale and the water unit and then writes the card;
    // asking summaryCard for the same payload afterwards must produce the
    // byte-identical string, or the landing page and the chat have drifted.
    expect(widget.root.innerHTML).toBe(summaryCard(SAMPLE));
    // The empty state is the card's too, not a branch the template kept.
    const empty = { ...SAMPLE, days: [] };
    widget.render(empty);
    expect(widget.root.innerHTML).toBe(summaryCard(empty));
});

test("inlineChart changes only what fills the panel's sparkline slot", () => {
    widget.render(SAMPLE);
    const plain = summaryCard(SAMPLE);
    const inline = summaryCard(SAMPLE, { inlineChart: true });
    expect(plain).not.toBe(inline);

    const a = splitChart(plain);
    const b = splitChart(inline);
    // The slot is empty on the path that paints it afterwards, filled on the
    // path that has no DOM to paint into…
    expect(a.chart).toBe("");
    expect(b.chart).toContain('<path class="cline"');
    // …and the two cards are otherwise byte-identical.
    expect(b.shell).toBe(a.shell);

    // The inline chart is the chart sparkPaint would have drawn: same slots,
    // same goals, calories, and the entrance still owed. The area fill's
    // gradient id counts up per chart drawn (CH_GRAD_N, shared/svg.js), so it
    // is normalised away — it is an identity, not content.
    const sameChart = (c: string) => c.replace(/cg\d+/g, "cgN");
    expect(sameChart(b.chart)).toBe(
        sameChart(
            widget.sparkMarkup({
                slots: widget.SPARK.slots,
                key: "calories",
                goals: SAMPLE.goals,
                still: false,
            }),
        ),
    );
});

// A card with fewer than two logged days draws no line at all, so there is
// nothing to inline and the flag must be a no-op rather than an empty <svg>.
test("inlineChart is a no-op on a card with no chart", () => {
    const oneDay = {
        ...SAMPLE,
        days: [(SAMPLE.days as unknown[])[0]],
        start_date: "2026-07-05",
        end_date: "2026-07-05",
        logged_days: 1,
        days_in_range: 1,
    };
    expect(widget.summaryCharted(oneDay)).toBe(false);
    expect(summaryCard(oneDay, { inlineChart: true })).toBe(
        summaryCard(oneDay),
    );
});

// TWO CARDS IN ONE DOCUMENT. The landing page builds this card and the trends
// one into a single page, and ids are document-global: `aria-controls` and
// `aria-labelledby` resolve by id, so two cards on the default prefix would
// point every tile of the second at the first card's drawer. `idPrefix` is
// the whole answer — but only if this partial forwards it, which it did not,
// so the option was accepted, documented and silently dropped.
test("idPrefix namespaces this card's drawer, and moves nothing else", () => {
    const ids = (card: string) =>
        [
            ...card.matchAll(
                /\s(?:id|aria-controls|aria-labelledby)="([^"]*drawer[^"]*)"/g,
            ),
        ].map((m) => m[1]!);

    const a = summaryCard(SAMPLE, { idPrefix: "hero" });
    const b = summaryCard(SAMPLE, { idPrefix: "demo" });
    // Internally consistent per card: one drawer, and every pointer on the
    // card names it.
    expect(new Set(ids(a))).toEqual(
        new Set(["hero-drawer", "hero-drawer-name"]),
    );
    expect(new Set(ids(b))).toEqual(
        new Set(["demo-drawer", "demo-drawer-name"]),
    );
    expect(a).toContain(
        '<div class="drawer" id="hero-drawer" role="region" aria-labelledby="hero-drawer-name"',
    );
    expect(a).toContain('aria-controls="hero-drawer"');
    // Distinct between cards: neither mentions the other's ids or the default.
    expect(a).not.toContain("demo-drawer");
    expect(b).not.toContain("hero-drawer");
    expect(a).not.toContain('"macro-drawer');
    // And the prefix is the ONLY thing it moves — including for the card that
    // passes none, which is every in-chat render.
    expect(a.split("hero").join("X")).toBe(b.split("demo").join("X"));
    expect(summaryCard(SAMPLE)).toBe(
        a.split("hero-drawer").join("macro-drawer"),
    );
});

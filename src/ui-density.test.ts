import { expect, test } from "bun:test";

async function source(path: string): Promise<string> {
    return Bun.file(path).text();
}

test("web diary meal cards keep their own description and inline provenance (UX fix wave F3)", async () => {
    const [html, css, appJs] = await Promise.all([
        source("./public/app.html"),
        source("./public/app-overrides.css"),
        source("./public/app.js"),
    ]);

    // The density pass's card rewrite is gone: no heading replacement
    // with a food count, and no "Log details" / "Source & estimate"
    // disclosures burying description, notes and source badges.
    expect(html).not.toContain("enhanceMealCard");
    expect(html).not.toContain('auditSummary.textContent = "Log details"');
    expect(html).not.toContain('summary.textContent = "Source & estimate"');
    expect(html).not.toContain("heading.textContent = `${rows.length} food");
    expect(css).not.toContain(".meal-card.is-structured");
    // The canonical card renders the meal's own description as its
    // heading and each item's source badge inline.
    expect(appJs).toContain(
        "<h4>${escapeHtml(meal.description || \"Untitled meal\")}</h4>",
    );
    expect(appJs).toContain('class="demo-source-row"');
    expect(css).toContain(".food-audit");
    expect(css).toContain(".settings-index-card");
});

test("logged-meal widget stays compact while retaining food and audit details", async () => {
    const template = await source(
        "./public/widgets/src/templates/meal-logged.html",
    );

    expect(template).toContain("View ${items.length} food");
    expect(template).toContain("Source & estimate");
    expect(template).toContain("Log details");
    expect(template).toContain("originalTitle");
    expect(template).toContain("P ${fmt(meal.protein_g, 1)}g");
    expect(template).not.toContain("Today after this meal");
});

test("meal-review widget exposes approval data first and estimate audit second", async () => {
    const template = await source(
        "./public/widgets/src/templates/meal-review.html",
    );

    expect(template).toContain("Estimate details");
    expect(template).toContain("Original description");
    expect(template).toContain("sourceRows");
    expect(template).toContain("review-flags");
    expect(template).toContain("Needs input");
    expect(template).not.toContain("How Munch estimated this");
});

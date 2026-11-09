import { getWidgetHtml, USER_WIDGET_TEMPLATES } from "../src/widgets.js";
import {
    MUNCH_APP_VERSION,
    MUNCH_WIDGET_RESOURCE_VERSION,
} from "../src/widget-release.js";
import { versionWidgetResourceUri } from "../src/widget-resource-versioning.js";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const expectedWidgetKeys = [
    "nutrition-summary",
    "goal-progress",
    "meal-logged",
    "meal-review",
    "trends",
    "weight-trends",
    "import-meals",
    "cook-summary",
    "food-label",
    "recipe",
];

assert(
    JSON.stringify(Object.keys(USER_WIDGET_TEMPLATES).sort()) ===
        JSON.stringify(expectedWidgetKeys.sort()),
    "Production widget inventory drifted; update the contract smoke intentionally.",
);

for (const key of expectedWidgetKeys) {
    const html = await getWidgetHtml(key);
    assert(html.includes("<!doctype html>"), `${key} did not assemble as HTML`);
    assert(
        !html.includes("/*@include") && !html.includes("/*@inlinets"),
        `${key} still contains unresolved source directives`,
    );
    assert(
        !html.includes("__MUNCH_WIDGET_APP_VERSION__"),
        `${key} did not receive the deployed app version`,
    );
    assert(
        html.includes(MUNCH_APP_VERSION),
        `${key} does not identify release ${MUNCH_APP_VERSION}`,
    );
    assert(
        !html.includes('version: config.version || "1.0.0"'),
        `${key} still contains the stale hard-coded widget version`,
    );
}

const canonicalUris = expectedWidgetKeys.map(
    (key) => `ui://widget/${key}.html`,
);
for (const uri of canonicalUris) {
    const versioned = versionWidgetResourceUri(uri);
    assert(
        versioned ===
            `${uri.slice(0, -".html".length)}/${MUNCH_WIDGET_RESOURCE_VERSION}.html`,
        `Widget cache key was not versioned: ${uri} -> ${versioned}`,
    );
}

const metadataSource = await Bun.file("src/openai-submission.ts").text();
assert(
    !metadataSource.includes("prefersBorder: true"),
    "Widget resource metadata still asks the host for a duplicate border",
);
assert(
    metadataSource.includes("prefersBorder: false"),
    "Widget resource metadata does not explicitly disable the host border",
);

const baseCss = await Bun.file("public/widgets/src/shared/base.css").text();
assert(
    !baseCss.includes("padding: 10px 8px 14px"),
    "Inline widget shell still contains the old outer moat",
);
assert(
    !baseCss.includes("min-height: 36px"),
    "A shared compact button is still below the 44px touch-target contract",
);
assert(
    /\.btn-sm\s*\{[^}]*min-height:\s*44px/s.test(baseCss),
    "Compact button touch target is not pinned at 44px",
);

const logged = await getWidgetHtml("meal-logged");
for (const expected of [
    "primaryItem?.name",
    "primaryItem.portion_label",
    "Food details",
    "min-height: 44px",
]) {
    assert(
        logged.includes(expected),
        `meal-logged is missing structured receipt behavior: ${expected}`,
    );
}
assert(
    !logged.includes(
        '? `${items.length} food${items.length === 1 ? "" : "s"}`',
    ),
    "meal-logged regressed to a generic structured-meal title",
);

const review = await getWidgetHtml("meal-review");
for (const expected of ['id="confirm"', 'id="adjust"']) {
    assert(review.includes(expected), `meal-review is missing ${expected}`);
}
for (const forbidden of [
    "quick-adjust",
    "Smaller portion",
    "Larger portion",
    "Wrong food",
    ">Ingredients<",
]) {
    assert(
        !review.includes(forbidden),
        `meal-review reintroduced nested inline adjustment UI: ${forbidden}`,
    );
}

const harness = await Bun.file("scripts/widget-harness.ts").text();
for (const fixture of [
    'name: "Starbucks Medicine Ball Tea"',
    'portion_label: "Venti (20 fl oz)"',
    'source_type: "published_restaurant"',
    "meal_items:",
]) {
    assert(
        harness.includes(fixture),
        `Widget harness is missing structured single-food fixture: ${fixture}`,
    );
}

console.log(
    `ChatGPT widget contract checks passed (${expectedWidgetKeys.length} production widgets, ${MUNCH_APP_VERSION}, ${MUNCH_WIDGET_RESOURCE_VERSION}).`,
);

#!/usr/bin/env bun

const [html, js, css, routes, index, appHtml, appStyles, privacy] =
    await Promise.all([
        Bun.file("public/pantry.html").text(),
        Bun.file("public/pantry.js").text(),
        Bun.file("public/pantry.css").text(),
        Bun.file("src/inventory/routes.ts").text(),
        Bun.file("src/index.ts").text(),
        Bun.file("public/app.html").text(),
        Bun.file("public/styles.css").text(),
        Bun.file("public/privacy.html").text(),
    ]);

const requiredHtml = [
    'id="pantry-enabled"',
    'id="manual-add"',
    'id="pantry-photo"',
    'id="receipt-photo"',
    'id="review"',
    'id="meal-planner"',
    'id="meal-idea-form"',
    'id="meal-goal"',
    'id="meal-staples"',
    'id="meal-ideas"',
    'id="inventory"',
    'name="viewport"',
];
for (const marker of requiredHtml) {
    if (!html.includes(marker)) {
        throw new Error(`Pantry UI omitted required markup: ${marker}`);
    }
}

for (const endpoint of [
    "/api/app/pantry/settings",
    "/api/app/pantry/reconcile",
    "/api/app/pantry/scan-preview",
    "/api/app/pantry/meal-ideas",
    "/api/app/purchases/receipt-preview",
    "/api/app/purchases/reconcile",
]) {
    if (!routes.includes(endpoint) || !js.includes(endpoint)) {
        throw new Error(
            `Pantry web contract is not wired end-to-end: ${endpoint}`,
        );
    }
}

if (
    !routes.includes("requireWebSession") ||
    !routes.includes("requireSameOrigin")
) {
    throw new Error("Pantry web writes are missing session/CSRF enforcement");
}
const requiredSessionBoundaries = [
    'app.use("/api/app/pantry", requireWebSession)',
    'app.use("/api/app/pantry/*", requireWebSession)',
    'app.use("/api/app/purchases/*", requireWebSession)',
];
for (const boundary of requiredSessionBoundaries) {
    if (!routes.includes(boundary)) {
        throw new Error(`Pantry web auth boundary is missing: ${boundary}`);
    }
}
if (
    routes.includes('app.use("/api/app/pantry*", requireWebSession)') ||
    routes.includes('app.use("/api/app/purchases*", requireWebSession)')
) {
    throw new Error(
        "Pantry web auth must use explicit base and slash-wildcard route patterns",
    );
}
const normalizedRoutes = routes.replace(/\s+/g, " ");
if (!normalizedRoutes.includes("resolveRequestMunchCapabilities(c, userId)")) {
    throw new Error(
        "Pantry route is missing capability resolution for household scope authorization",
    );
}
if (
    routes.includes("premium_required") ||
    routes.includes("premiumContext") ||
    js.includes("premium-message") ||
    html.includes("premium-message")
) {
    throw new Error(
        "Pantry carries a Premium wall; Pantry is free for every account (Amendment D)",
    );
}
if (!routes.includes("8 * 1024 * 1024")) {
    throw new Error("Pantry image handlers are missing their 8 MB bound");
}
if (!index.includes("10 * 1024 * 1024")) {
    throw new Error(
        "Global request limit does not admit bounded Pantry image uploads",
    );
}
if (!/@media\s*\(\s*max-width:\s*760px\s*\)/.test(css)) {
    throw new Error(
        "Pantry workspace is missing its mobile responsive treatment",
    );
}
// S6 slice 2 (Amendment F): Pantry is themed in Editorial Serif, voiced
// inside its own stylesheet (the S4 / PR #187 mechanism — editorial.css
// is the flagship/public stylesheet and is NOT loaded by this signed-in
// surface). The old Inter world must stay gone, and the location filter
// is a single-row chip group, not the retired select.
if (!html.includes('href="/pantry.css"') || html.includes("editorial.css")) {
    throw new Error(
        "Pantry must load only its own Serif-voiced pantry.css, not editorial.css",
    );
}
if (
    css.includes("Inter") ||
    css.includes("#f7f7f4") ||
    !css.includes("#f6f1e7") ||
    !css.includes("#fffdf8") ||
    !css.includes("#d8cdb6") ||
    !css.includes("#176b3a") ||
    !css.includes('Georgia, "Times New Roman", Times, serif')
) {
    throw new Error(
        "Pantry stylesheet is not voiced in the Editorial Serif tokens",
    );
}
if (
    !html.includes('id="location-chips"') ||
    html.includes('id="location-filter"')
) {
    throw new Error(
        "Pantry location filter must be the chip row, not the retired select",
    );
}
if (/ad-slot|adsbygoogle|MunchAds|data-ad/.test(html + js + css)) {
    throw new Error(
        "Pantry carries an ad placement; the app's only ad slot is on Today (final ad law)",
    );
}
if (/localStorage|sessionStorage/.test(js)) {
    throw new Error(
        "Pantry client must not persist inventory or receipt data in browser storage",
    );
}
if (/receipt_image|raw_image|image_bytes/.test(routes)) {
    throw new Error(
        "Pantry route source suggests raw receipt media persistence",
    );
}
if (
    !html.includes("whole kitchen") ||
    !html.includes("spices, sauces, condiments") ||
    !routes.includes("generatePantryMealIdeas")
) {
    throw new Error(
        "Pantry meal planning does not preserve the deliberate full-kitchen contract",
    );
}
if (
    js.includes("mealIdeasEl.innerHTML") ||
    js.includes("candidate.description}`")
) {
    throw new Error(
        "AI meal-idea strings must be rendered with safe text nodes",
    );
}
const pantryLinks = appHtml.match(/href="\/app\/pantry"/g) ?? [];
if (pantryLinks.length < 2) {
    throw new Error(
        "Pantry is not discoverable from both desktop and mobile app navigation",
    );
}
if (!appStyles.includes("grid-template-columns: repeat(6, 1fr)")) {
    throw new Error("Mobile app navigation was not sized for the Pantry entry");
}
// The disclosure phrases are prose: HTML line wrapping (Prettier) may split
// them across lines, so match prose phrases against whitespace-collapsed
// text. The <strong> markup check stays against the raw HTML.
const privacyProse = privacy.replace(/\s+/g, " ");
if (
    !privacyProse.includes("Pantry and receipt images") ||
    !privacyProse.includes("Pantry meal planning") ||
    !privacy.includes("<strong>OpenRouter</strong>") ||
    !privacyProse.includes("not a promise of zero retention")
) {
    throw new Error("Pantry image-processing privacy disclosure is incomplete");
}

console.log("Munch Pantry web surface static smoke test passed.");

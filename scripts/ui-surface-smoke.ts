const requiredFiles = [
    "public/index.html",
    "public/styles.css",
    "public/app.html",
    "public/app.js",
    "public/app-account.js",
    "public/app-integrity.js",
    "public/account-settings.css",
    "public/app-overrides.css",
    "public/app-patches.js",
    "public/weight-display.js",
    "public/help.html",
    "public/security.html",
    "public/security.txt",
    "public/open-source.html",
    "public/llms.txt",
    "public/robots.txt",
    "public/sitemap.xml",
];

for (const path of requiredFiles) {
    if (!(await Bun.file(path).exists())) {
        throw new Error(`Missing UI surface: ${path}`);
    }
}

for (const retiredPath of [
    "public/login.html",
    "public/oauth-login.html",
    "public/portal-controls.css",
    "src/portal/routes.ts",
]) {
    if (await Bun.file(retiredPath).exists()) {
        throw new Error(`Retired UI surface still exists: ${retiredPath}`);
    }
}

const homepage = await Bun.file("public/index.html").text();
const normalizedHomepage = homepage.replace(/\s+/g, " ");
for (const stale of [
    "Start free trial",
    "30-day trial",
    "seven-day trial",
    "after trial",
]) {
    if (normalizedHomepage.toLowerCase().includes(stale.toLowerCase())) {
        throw new Error(`Homepage contains stale commercial copy: ${stale}`);
    }
}
if (!normalizedHomepage.includes("$3.00")) {
    throw new Error("Homepage does not state the canonical monthly price");
}
if (
    !normalizedHomepage.includes("Nutrition MCP") ||
    !normalizedHomepage.includes("Alexander Kutishevsky")
) {
    throw new Error("Homepage is missing upstream attribution");
}

const llms = await Bun.file("public/llms.txt").text();
const robots = await Bun.file("public/robots.txt").text();
const sitemap = await Bun.file("public/sitemap.xml").text();
for (const [path, source] of [
    ["public/llms.txt", llms],
    ["public/robots.txt", robots],
    ["public/sitemap.xml", sitemap],
] as const) {
    if (source.includes("munch-production-de3a.up.railway.app")) {
        throw new Error(`${path} contains the retired Railway public hostname`);
    }
}
if (/\btrial\b/i.test(llms)) {
    throw new Error("public/llms.txt contains stale trial billing language");
}
for (const phrase of [
    "permanent Free tier",
    "Premium is $3.00/month",
    "Additional household members are $2/month each",
    "https://munch.business/mcp",
]) {
    if (!llms.includes(phrase)) {
        throw new Error(
            `public/llms.txt is missing canonical product copy: ${phrase}`,
        );
    }
}
if (!robots.includes("Sitemap: https://munch.business/sitemap.xml")) {
    throw new Error("robots.txt does not advertise the canonical sitemap");
}

const authSurfaces = ["src/auth/email.ts", "src/auth/password-routes.ts"];
const forbiddenAuthWords = [
    "subscription",
    "premium",
    "trial",
    "pricing",
    "checkout",
    "stripe",
    "$3.00",
];
for (const path of authSurfaces) {
    const text = (await Bun.file(path).text()).toLowerCase();
    for (const term of forbiddenAuthWords) {
        if (text.includes(term)) {
            throw new Error(
                `${path} contains protected commerce term: ${term}`,
            );
        }
    }
}

// Amendment D (2026-11-09) exception, deliberately narrow: the OAuth
// consent route must state plainly that MCP access is part of Premium and
// refuse approval for a Free account, so "premium" language is allowed in
// connect-routes.ts. Selling still is not: checkout, Stripe, trial, and
// the canonical price stay banned there — Premium starts only on the
// website, never inside the connection flow.
const connectRoutesText = (
    await Bun.file("src/auth/connect-routes.ts").text()
).toLowerCase();
for (const term of ["checkout", "stripe", "trial", "$3.00"]) {
    if (connectRoutesText.includes(term)) {
        throw new Error(
            `src/auth/connect-routes.ts contains protected commerce term: ${term}`,
        );
    }
}
if (!connectRoutesText.includes("mcp access is part of")) {
    throw new Error(
        "src/auth/connect-routes.ts is missing the consent Premium statement (Amendment D)",
    );
}

const accountRoutes = await Bun.file("src/accounts/routes.ts").text();
if (
    !accountRoutes.includes('account.get("/account/login"') ||
    !accountRoutes.includes("/connect/sign-in?return_to=")
) {
    throw new Error(
        "Account login compatibility route does not redirect into Better Auth sign-in",
    );
}

const connectRoutes = await Bun.file("src/auth/connect-routes.ts").text();
for (const route of [
    'connect.get("/connect/sign-in"',
    'connect.post("/connect/request"',
    'connect.get("/connect/confirm"',
    'connect.post("/connect/confirm"',
    'connect.get("/connect/consent"',
    'connect.get("/connect/error"',
]) {
    if (!connectRoutes.includes(route)) {
        throw new Error(`Better Auth connection UI is missing route: ${route}`);
    }
}
const passwordRoutes = await Bun.file("src/auth/password-routes.ts").text();
for (const route of [
    'router.get("/account/password"',
    'router.get("/account/password/reset"',
    "/api/auth/sign-up/email",
    "/api/auth/sign-in/username",
    "/api/auth/request-password-reset",
    "/api/auth/reset-password",
]) {
    if (!passwordRoutes.includes(route)) {
        throw new Error(`Password authentication surface is missing: ${route}`);
    }
}
for (const copy of [
    "Connect Munch to ChatGPT",
    "Connected Munch account",
    "Approve connection",
    "You can revoke this connection later from your Munch account.",
]) {
    if (!connectRoutes.includes(copy)) {
        throw new Error(`Better Auth connection UI is missing copy: ${copy}`);
    }
}

const indexSource = await Bun.file("src/index.ts").text();
for (const route of [
    "createAppRouter()",
    '"/help"',
    '"/help/connect-chatgpt"',
    '"/security"',
    '"/open-source"',
    '"/.well-known/security.txt"',
    '"/app-integrity.js"',
]) {
    if (!indexSource.includes(route)) {
        throw new Error(`Server is missing required route wiring: ${route}`);
    }
}

const appRouterSource = await Bun.file("src/app/routes.ts").text();
const normalizedAppRouterSource = appRouterSource.replace(/\s+/g, " ");
const exportRouterSource = await Bun.file(
    "src/account-export-routes.ts",
).text();
const appSource = await Bun.file("public/app.js").text();
if (
    !appSource.includes('data-action="insight-range"') ||
    !appSource.includes('action === "insight-range"') ||
    !appSource.includes("state.insightsDays")
) {
    throw new Error(
        "Insights 7/30/90 controls are rendered without a working range handler",
    );
}
const browserEntryPoints = [
    "public/app.js",
    "public/app-account.js",
    "public/app-patches.js",
];
for (const entryPoint of browserEntryPoints) {
    const source = await Bun.file(entryPoint).text();
    for (const match of source.matchAll(/from\s+["']\.\/([^"']+\.js)["']/g)) {
        const moduleName = match[1];
        const publicPath = `public/${moduleName}`;
        const route = `/${moduleName}`;
        if (!(await Bun.file(publicPath).exists())) {
            throw new Error(
                `${entryPoint} imports missing browser module ${publicPath}`,
            );
        }
        if (!appRouterSource.includes(`app.get("${route}"`)) {
            throw new Error(
                `${entryPoint} imports ${route}, but the app router does not serve it`,
            );
        }
    }
}
if (!appRouterSource.includes('app.get("/account-settings.css"')) {
    throw new Error(
        "App router does not serve the account settings stylesheet",
    );
}
if (!appRouterSource.includes('"/api/app/household/manage"')) {
    throw new Error(
        "App router is missing the household management read model",
    );
}
if (!exportRouterSource.includes('"/api/app/export/meals"')) {
    throw new Error("Focused meal export route is missing");
}
for (const route of [
    'app.get("/api/app/food-search"',
    'app.post("/api/app/foods"',
    '"/api/app/foods/:id"',
    'app.get("/api/app/food-details"',
    'app.get("/api/app/food-barcode"',
    'app.post("/api/app/meals"',
    'app.post("/api/app/import/parse"',
    'app.post("/api/app/import"',
    'app.get("/api/app/insights"',
    'app.patch("/api/app/water/:id"',
    'app.delete("/api/app/water/:id"',
    'app.patch("/api/app/weight/:id"',
    'app.delete("/api/app/weight/:id"',
    'app.get("/api/app/meals/:id"',
    'app.patch(\n        "/api/app/meals/:mealId/items/:itemId"',
    'app.post("/api/app/meals/:mealId/items"',
    'app.post("/api/app/meal-drafts"',
    'app.post("/api/app/recipes"',
    'app.post(\n        "/api/app/recipes/import-preview"',
    'app.post("/api/app/recipes/compose"',
    'app.post("/api/app/groceries/items"',
    '"/api/app/groceries/items/:id"',
    '"/api/app/groceries/items/:id/purchased"',
    '"/api/app/groceries/clear-purchased"',
    'app.get("/api/app/meal-drafts/:id"',
    '"/api/app/meal-drafts/:id/items"',
    '"/api/app/meal-drafts/:id/confirm"',
    '"/api/app/meal-drafts/:id/cancel"',
]) {
    if (!normalizedAppRouterSource.includes(route.replace(/\s+/g, " "))) {
        throw new Error(`App meal composer is missing route: ${route}`);
    }
}
for (const behavior of [
    'data-action="add-meal"',
    'data-action="select-meal-option"',
    'data-action="lookup-food-barcode"',
    "mealComposerPayload",
    'api("/api/app/meals"',
    "meal-draft-create-form",
    'api("/api/app/meal-drafts"',
    "web-import-file-form",
    "web-import-map-form",
    'api("/api/app/import/parse"',
    'api("/api/app/import"',
    'data-action="web-import-commit"',
    'data-action="view-meal-details"',
    'data-action="meal-history-range"',
    "meal-history-search-form",
    'data-action="clear-meal-search"',
    'data-action="insight-range"',
    "data.trends?.narrative",
    "data.patterns?.narrative",
    'data-action="edit-water"',
    'data-action="delete-water"',
    'data-action="edit-weight"',
    'data-action="delete-weight"',
    "edit-water-form",
    "edit-weight-form",
    "waterEntryRows",
    "weightChart",
    "api(`/api/app/water/${encodeURIComponent",
    "api(`/api/app/weight/${encodeURIComponent",
    'data-action="open-meal-draft"',
    'data-action="start-meal-draft"',
    'data-action="manage-saved-foods"',
    'data-action="select-saved-food-candidate"',
    'data-action="delete-saved-food"',
    "saved-food-form",
    'data-action="confirm-meal-draft"',
    'data-action="cancel-meal-draft"',
    'data-action="create-recipe"',
    'data-action="import-recipe-url"',
    "Import recipe from a website",
    "Create manually",
    'data-action="compose-recipe"',
    'data-action="select-recipe-food-option"',
    'data-action="add-recipe-ingredient"',
    'data-action="add-recipe-grocery"',
    'data-action="remove-recipe-grocery"',
    "recipePayloadFromForm",
    "recipe-import-url-form",
    "recipe-import-progress",
    "Checking the URL",
    "Parsing recipe details",
    "Matching ingredients",
    "Preparing your review",
    "setRecipeImportProgressError",
    'api("/api/app/recipes/import-preview"',
    "openRecipeImportReview",
    "recipeGroceryItemsPayload",
    'api("/api/app/recipes"',
    'api("/api/app/recipes/compose"',
    'data-action="add-grocery"',
    'data-action="edit-grocery"',
    'data-action="toggle-grocery-purchased"',
    'data-action="clear-purchased"',
    "grocery-add-form",
]) {
    if (!appSource.includes(behavior)) {
        throw new Error(`App meal composer is missing behavior: ${behavior}`);
    }
}
if (!appRouterSource.includes("serializeMealDraftForApp")) {
    throw new Error(
        "App draft routes do not use the canonical draft serializer",
    );
}
if (appSource.includes("Continue this draft in ChatGPT")) {
    throw new Error("Pending drafts still redirect users to ChatGPT");
}

const mealPatchSource = await Bun.file("public/app-patches.js").text();
for (const behavior of [
    "data-patch-item-form",
    "data-patch-new-item-form",
    "data-patch-food-search-form",
    "data-patch-food-option",
    "patch-replace-target",
    "replace_item",
    "Food replaced and totals recalculated.",
]) {
    if (!mealPatchSource.includes(behavior)) {
        throw new Error(`Meal editor is missing behavior: ${behavior}`);
    }
}
if (appSource.includes("Complete recipe JSON")) {
    throw new Error("Recipe editing still requires raw JSON");
}

const appHtml = await Bun.file("public/app.html").text();
for (const route of [
    "/app/log",
    "/app/insights",
    "/app/recipes",
    "/app/plan",
    "/app/groceries",
    "/app/household",
    "/app/settings",
    "/app/more",
]) {
    if (!appHtml.includes(route)) {
        throw new Error(`App navigation is missing ${route}`);
    }
}
if (appHtml.includes('data-route="foods"')) {
    throw new Error("Retired Foods route is still present in app navigation");
}
if (
    !appHtml.includes('href="/account-settings.css"') ||
    !appHtml.includes('data-route="more" href="/app/more"')
) {
    throw new Error(
        "App shell is missing the unified settings styles or mobile More route",
    );
}

const accountModule = await Bun.file("public/app-account.js").text();
for (const route of [
    "/app/settings/profile",
    "/app/settings/goals",
    "/app/settings/billing",
    "/app/settings/connections",
    "/app/settings/data",
    "/app/settings/account",
]) {
    if (!accountModule.includes(route)) {
        throw new Error(`Unified settings module is missing ${route}`);
    }
}
for (const behavior of [
    "settings-profile-form",
    "settings-goals-form",
    "household-create-form",
    "household-invite-form",
    "household-member-remove",
    "household-role-save",
    "household-leave",
    "household-dissolve",
    "connection-revoke",
    "account-delete",
    "requireProductPolicy",
    "weightFromGrams",
    "Premium through household",
    "Pending invitations",
    'data-action="open-import"',
    'data-action="export-meals"',
    'api("/api/app/export/meals"',
]) {
    if (!accountModule.includes(behavior)) {
        throw new Error(
            `Unified account UI is missing behavior/copy: ${behavior}`,
        );
    }
}
if (accountModule.includes('["/app/foods", "Foods"')) {
    throw new Error("Unified account UI still links to the retired Foods page");
}
if (accountModule.includes("Advanced account controls")) {
    throw new Error(
        "Unified settings still exposes the legacy advanced account UX",
    );
}

const accountCss = await Bun.file("public/account-settings.css").text();
for (const responsiveRule of [
    "@media (max-width: 980px)",
    "@media (max-width: 840px)",
    "@media (max-width: 620px)",
    "font-size: 16px",
    "min-height: 48px",
]) {
    if (!accountCss.includes(responsiveRule)) {
        throw new Error(
            `Account settings CSS is missing responsive/accessibility rule: ${responsiveRule}`,
        );
    }
}
for (const component of [
    ".settings-layout",
    ".settings-local-nav",
    ".settings-index-card",
    ".settings-toggle-row",
    ".segmented-control",
    ".connection-card",
    ".household-member",
    ".settings-danger",
]) {
    if (!accountCss.includes(component)) {
        throw new Error(
            `Account settings CSS is missing component: ${component}`,
        );
    }
}

const globalStyles = await Bun.file("public/styles.css").text();
if (
    !globalStyles.includes("env(safe-area-inset-bottom)") ||
    !globalStyles.includes(".mobile-bottom-nav")
) {
    throw new Error(
        "Global app shell is missing mobile safe-area navigation protection",
    );
}

const householdRoutes = await Bun.file("src/households/routes.ts").text();
if (!householdRoutes.includes('c.redirect("/app/household", 303)')) {
    throw new Error(
        "Household invitation acceptance does not return to the new workspace",
    );
}

console.log("UI surface and unified account responsive smoke checks passed.");

const requiredFiles = [
    "public/index.html",
    "public/styles.css",
    "public/app.html",
    "public/app.js",
    "public/app-overrides.css",
    "public/app-patches.js",
    "public/help.html",
    "public/help-connect.html",
    "public/security.html",
    "public/security.txt",
    "public/open-source.html",
];

for (const path of requiredFiles) {
    if (!(await Bun.file(path).exists())) {
        throw new Error(`Missing UI surface: ${path}`);
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
if (!normalizedHomepage.includes("$4.99")) {
    throw new Error("Homepage does not state the canonical monthly price");
}
if (
    !normalizedHomepage.includes("Nutrition MCP") ||
    !normalizedHomepage.includes("Alexander Kutishevsky")
) {
    throw new Error("Homepage is missing upstream attribution");
}

const authSurfaces = [
    "public/login.html",
    "public/oauth-login.html",
    "public/help-connect.html",
    "src/auth/connect-routes.ts",
    "src/auth/email.ts",
];
const forbiddenAuthWords = [
    "subscription",
    "premium",
    "trial",
    "pricing",
    "checkout",
    "stripe",
    "$4.99",
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

const indexSource = await Bun.file("src/index.ts").text();
for (const route of [
    "createAppRouter()",
    '"/help"',
    '"/help/connect-chatgpt"',
    '"/security"',
    '"/open-source"',
    '"/.well-known/security.txt"',
]) {
    if (!indexSource.includes(route)) {
        throw new Error(`Server is missing required route wiring: ${route}`);
    }
}

const appHtml = await Bun.file("public/app.html").text();
for (const route of [
    "/app/log",
    "/app/insights",
    "/app/foods",
    "/app/recipes",
    "/app/plan",
    "/app/groceries",
    "/app/household",
    "/app/settings",
]) {
    if (!appHtml.includes(route)) {
        throw new Error(`App navigation is missing ${route}`);
    }
}

console.log("UI surface smoke checks passed.");

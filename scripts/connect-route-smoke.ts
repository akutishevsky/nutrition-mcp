/**
 * Route regression check for the flagship Editorial Serif build.
 *
 * Pins the hard floor from the homepage-connect brief: the bare
 * GET /connect page must never shadow the OAuth namespace
 * (/connect/sign-in, /connect/consent, /connect/request,
 * /connect/confirm), the old ChatGPT-only help route must 301 to
 * /connect, and the shipped paste text must be byte-identical on the
 * homepage and /connect. Live HTTP behaviour is proven separately by
 * e2e/connect-pages.e2e.ts against a real server.
 */

const indexSource = await Bun.file("src/index.ts").text();
const connectPage = await Bun.file("public/connect.html").text();
const homepage = await Bun.file("public/index.html").text();
const editorialCss = await Bun.file("public/editorial.css").text();
const sitemap = await Bun.file("public/sitemap.xml").text();
const llms = await Bun.file("public/llms.txt").text();
const authRoutes = await Bun.file("src/auth/connect-routes.ts").text();

function fail(message: string): never {
    throw new Error(`connect-route-smoke: ${message}`);
}

// --- Bare /connect page route + trailing-slash twin -------------------
if (!indexSource.includes('app.get("/connect",')) {
    fail('src/index.ts does not register the bare GET "/connect" page route');
}
if (!indexSource.includes("public/connect.html")) {
    fail("the /connect route does not serve public/connect.html");
}
if (
    !indexSource.includes(
        'app.get("/connect/", (c) => c.redirect("/connect", 301))',
    )
) {
    fail('src/index.ts is missing the "/connect/" 301 twin');
}
if (!indexSource.includes('"/editorial.css"')) {
    fail("src/index.ts does not serve /editorial.css");
}

// --- The page must never shadow the OAuth namespace -------------------
if (
    /["']\/connect\/\*["']/.test(indexSource) ||
    /["']\/connect\*["']/.test(indexSource)
) {
    fail("src/index.ts registers a /connect wildcard that could shadow auth");
}
for (const route of [
    'connect.get("/connect/sign-in"',
    'connect.post("/connect/request"',
    'connect.get("/connect/confirm"',
    'connect.post("/connect/confirm"',
    'connect.get("/connect/consent"',
]) {
    if (!authRoutes.includes(route)) {
        fail(`auth router is missing its route: ${route}`);
    }
}

// --- Old help route folds into /connect --------------------------------
if (
    !indexSource.includes(
        'app.get("/help/connect-chatgpt", (c) => c.redirect("/connect", 301))',
    )
) {
    fail("/help/connect-chatgpt does not 301 to /connect");
}
if (
    !indexSource.includes(
        'app.get("/help/connect-chatgpt/", (c) => c.redirect("/connect", 301))',
    )
) {
    fail("/help/connect-chatgpt/ does not 301 to /connect");
}

// --- /connect page content ---------------------------------------------
if (connectPage.includes("noindex")) {
    fail("/connect must be indexable but carries noindex");
}
if (
    !connectPage.includes(
        '<link rel="canonical" href="https://munch.business/connect" />',
    )
) {
    fail("/connect is missing its canonical URL");
}
for (const marker of [
    "Claude — exact steps",
    "ChatGPT — exact steps",
    "Muse — exact steps",
    "Any MCP app — exact steps",
    "Developer mode",
    "support@munch.business",
    "How to revoke access",
    "This request expired",
]) {
    if (!connectPage.includes(marker)) {
        fail(`/connect is missing required content: ${marker}`);
    }
}

// --- One canonical paste, byte-identical in both homes ------------------
function pasteText(html: string): string {
    const match = html.match(
        /<pre class="paste" id="paste-text">([\s\S]*?)<\/pre>/,
    );
    if (!match) fail("paste block <pre> not found");
    return match[1].trim();
}
const homePaste = pasteText(homepage);
const connectPaste = pasteText(connectPage);
if (homePaste !== connectPaste) {
    fail(
        "homepage and /connect paste blocks differ — one canonical paste required",
    );
}
for (const line of [
    "Connect me to Munch, my nutrition tracker.",
    "https://munch.business/mcp",
    "creates my account",
    "log my first meal or set a nutrition goal",
]) {
    if (!homePaste.includes(line)) {
        fail(`canonical paste is missing: ${line}`);
    }
}

// --- Homepage flagship requirements -------------------------------------
if (homepage.includes('href="/connect/sign-in')) {
    fail(
        'homepage still routes a CTA to the bare website sign-in "/connect/sign-in"',
    );
}
if ((homepage.match(/href="\/connect"/g) ?? []).length < 3) {
    fail(
        "homepage must link to /connect from nav, body, and footer (found fewer than 3)",
    );
}
if (!homepage.includes("7-day free trial")) {
    fail("homepage pricing is missing the 7-day free trial");
}
if (homepage.toLowerCase().includes("seven-day trial")) {
    fail('homepage carries stale trial wording ("seven-day trial")');
}
if (!homepage.includes("$3.00")) {
    fail("homepage does not state the canonical $3.00 price");
}
if (homepage.includes("demo-avatar") || homepage.includes("capability-icon")) {
    fail(
        "homepage still carries the retired demo avatar / unicode-glyph iconography",
    );
}
if (!homepage.includes("How do I connect Munch to my AI?")) {
    fail("homepage FAQ is missing the connect entry");
}

// --- Type floor: nothing under 11px on the flagship surfaces -------------
const cssAndPages = [
    ["public/editorial.css", editorialCss],
    ["public/index.html", homepage],
    ["public/connect.html", connectPage],
] as const;
for (const [path, text] of cssAndPages) {
    for (const match of text.matchAll(/font-size:\s*([\d.]+)(px|rem)/g)) {
        const px =
            match[2] === "rem"
                ? parseFloat(match[1]) * 16
                : parseFloat(match[1]);
        if (px < 11) {
            fail(`${path} declares sub-11px type: ${match[0]}`);
        }
    }
}

// --- Sitemap + llms.txt ---------------------------------------------------
if (!sitemap.includes("<loc>https://munch.business/connect</loc>")) {
    fail("sitemap.xml does not list /connect");
}
if (!llms.includes("## Connect Munch to your AI")) {
    fail('llms.txt is missing the "Connect Munch to your AI" section');
}
if (!llms.includes("https://munch.business/connect")) {
    fail("llms.txt does not reference the /connect page");
}
if (/\btrial\b/i.test(llms)) {
    fail(
        "llms.txt contains trial wording (kept off this surface by the UI smoke)",
    );
}

console.log("Connect route regression checks passed.");

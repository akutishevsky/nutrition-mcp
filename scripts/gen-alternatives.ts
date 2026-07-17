/**
 * Generates the SEO "alternative to X" comparison pages under
 * public/alternatives/ from a single template plus the per-app data below.
 *
 * These pages target long-tail bridge queries seen in Search Console — e.g.
 * "myfitnesspal mcp", "connect cronometer to claude" — that the single-page
 * site can't rank for. Each page carries unique title/description/canonical/OG
 * plus FAQPage and BreadcrumbList JSON-LD.
 *
 * Edit the APPS data (or the shared template) here and re-run:
 *   bun run scripts/gen-alternatives.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 *
 * Self-hosting: scripts/depersonalize.ts cleans the generated .html files but
 * NOT this generator. If you regenerate, update SITE below and the GA tag,
 * GitHub links, and contact email in the shared fragments first.
 */

const SITE = "https://nutrition-mcp.com";

type App = {
    /** Display name, e.g. "MyFitnessPal". */
    name: string;
    /** URL path (no leading slash), e.g. "myfitnesspal-mcp". */
    slug: string;
    /** Output filename under public/alternatives/. */
    file: string;
    /** Font Awesome icon class for the hub card. */
    icon: string;
    /** One-line blurb on the /alternatives hub card. */
    hubBlurb: string;
    /** The four honest "cons" bullets for the comparison table (left column). */
    cons: string[];
    /** Gracious closing note under the comparison — acknowledges the app's strength. */
    note: string;
    /**
     * Genuinely per-app prose (title + paragraphs) for the "Moving from X"
     * section. This is what differentiates each page from the shared template so
     * they don't read as thin/duplicate content.
     */
    migrate: { title: string; body: string[] };
    /**
     * Two app-specific FAQ entries interleaved into the shared FAQ set. These
     * carry unique text AND unique FAQPage structured-data entries per page, so
     * each page competes on more than a name-swapped template.
     */
    extraFaqs: { q: string; a: string }[];
    /** Optional override for the "Is Nutrition MCP free?" FAQ answer (e.g. paid-only apps). */
    freeAnswer?: string;
};

const APPS: App[] = [
    {
        name: "MyFitnessPal",
        slug: "myfitnesspal-mcp",
        file: "myfitnesspal.html",
        icon: "fa-fire-flame-curved",
        hubBlurb:
            "No MCP server, and some features need a paid plan. See the free, conversational alternative.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "Search a database and pick the right entry for every item",
            "Some features, like the barcode scanner, need a paid plan",
            "A separate app and account, with ads on the free tier",
        ],
        note: "MyFitnessPal is a capable app with a huge food database. This isn't a knock on it — it's simply a different approach for people who'd rather talk to their AI than tap through a tracker.",
        migrate: {
            title: "Leaving the database behind",
            body: [
                "MyFitnessPal built its following on one of the largest food databases anywhere — tens of millions of crowd-sourced entries. That scale is also its friction: for any given food you scroll past near-duplicates and have to guess which entry is accurate. Conversational logging skips the lookup entirely — you describe the food and your AI estimates the macros.",
                "There's no one-click import of your MyFitnessPal diary yet, but starting over is quick when logging is a single sentence. Tell your AI the handful of meals you eat on repeat and it will log them in seconds — and everything you record is yours to export as CSV whenever you want.",
                "The features MyFitnessPal gradually moved behind Premium — barcode scanning, macros by gram, no ads — are simply included here. You're not weighing a free tier against a $20-a-month upgrade; there's one free, open-source tier, and the only account you need is the Claude or ChatGPT one you already have.",
            ],
        },
        extraFaqs: [
            {
                q: "Can Nutrition MCP scan barcodes like MyFitnessPal Premium?",
                a: "Yes, and it's free. Send a product's barcode and Nutrition MCP pulls verified macros from Open Food Facts — whereas MyFitnessPal moved its barcode scanner behind a paid Premium subscription.",
            },
            {
                q: "How does logging work without MyFitnessPal's food database?",
                a: "You describe what you ate in plain language — “a chicken burrito bowl with extra rice” — and your AI estimates the calories and macros. There's no database of millions of crowd-sourced entries to search through and no guessing which one is accurate.",
            },
        ],
    },
    {
        name: "Cronometer",
        slug: "cronometer-mcp",
        file: "cronometer.html",
        icon: "fa-seedling",
        hubBlurb:
            "No MCP server. See the free, conversational way to track calories and macros inside your AI.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "Log by searching its database, entry by entry",
            "Some features require a paid Gold plan",
            "A separate app to open every time you eat",
        ],
        note: "Cronometer is excellent if you want deep micronutrient precision. Nutrition MCP takes a lighter, conversational approach to calories, macros, and weight — right inside your AI.",
        migrate: {
            title: "When accuracy is the whole point",
            body: [
                "Cronometer earned its reputation on precision — curated databases and tracking for 80+ micronutrients, vitamins and minerals included. If that micronutrient depth is why you open it, be honest with yourself: conversational estimates won't match a lab-grade database entry gram for gram.",
                "But most people log to keep calories and the big three macros in range, not to audit their selenium intake. For that, describing a meal to your AI is far less work than searching for and weighing every component — and you still get daily totals, trends, and a target weight to track against, for free.",
                "There's also a middle path: because you're inside an AI assistant, you can ask for the micronutrient angle when you actually want it — “roughly how much iron and B12 was in today's meals?” — and get a reasoned estimate on demand, without the overhead of logging every gram to a curated entry the rest of the time.",
            ],
        },
        extraFaqs: [
            {
                q: "Does Nutrition MCP track micronutrients like Cronometer?",
                a: "Not as a core feature. Cronometer's tracking of 80+ vitamins and minerals is its specialty; Nutrition MCP focuses on calories, macros, water, and weight. You can still ask your AI for a rough micronutrient read on a meal, but if lab-grade micronutrient depth is essential, Cronometer is the better fit.",
            },
            {
                q: "Is Nutrition MCP as accurate as Cronometer?",
                a: "For calories and the big three macros, conversational estimates are close enough for most goals — but they won't match Cronometer's curated, gram-for-gram database. It trades a little precision for far less logging effort, which is the right trade for most people.",
            },
        ],
    },
    {
        name: "Lose It!",
        slug: "lose-it-mcp",
        file: "lose-it.html",
        icon: "fa-bullseye",
        hubBlurb:
            "No MCP server. Log meals by talking to Claude or ChatGPT instead — free.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "Search and log each item by hand",
            "Some features, like photo logging, need a paid plan",
            "Another app, another account, ads on the free tier",
        ],
        note: "Lose It! is a friendly calorie counter. Nutrition MCP does the same core logging by conversation, free, without ever leaving Claude or ChatGPT.",
        migrate: {
            title: "The same simplicity, minus the app",
            body: [
                "Lose It! won people over by keeping calorie counting light and a little gamified, with its Snap It photo logging as the headline trick. Nutrition MCP does the photo trick too — send a picture of your plate and your AI reads it — except it lives inside the assistant you already chat with, so there's no separate app to open.",
                "If what you liked about Lose It! was low-friction logging and quick daily feedback, you'll feel at home: say what you ate, get your remaining calories and macros back, and move on. No ads, no upsell, and no account to juggle.",
                "The one thing you give up is the streaks-and-badges layer Lose It! uses to keep you coming back. If that gamification is what motivates you, that's a fair reason to stay. If it always felt like noise on top of the actual logging, you won't miss it — the daily number is right there in the chat whenever you ask.",
            ],
        },
        extraFaqs: [
            {
                q: "Does Nutrition MCP have photo logging like Lose It!'s Snap It?",
                a: "Yes — send a photo of your plate and your AI identifies the food and estimates the macros, then logs it after you confirm. In Lose It! photo logging sits behind a paid plan; with Nutrition MCP it's free and works right in the chat.",
            },
            {
                q: "Can I count calories the same way I did in Lose It!?",
                a: "Yes. The core loop is identical — say what you ate and get your remaining calories and macros back instantly. The difference is you talk to your AI instead of tapping through an app, and there are no ads or upsells on the way.",
            },
        ],
    },
    {
        name: "MacroFactor",
        slug: "macrofactor-mcp",
        file: "macrofactor.html",
        icon: "fa-chart-simple",
        hubBlurb:
            "Subscription-only and no MCP server. See the free alternative that lives in your AI.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "A paid subscription after the free trial (no free tier)",
            "You still open a separate app to log every meal",
            "Its adaptive coaching is the product, not effortless logging",
        ],
        note: "MacroFactor's adaptive TDEE coaching is genuinely good. If you mainly want fast, free macro logging inside your AI, Nutrition MCP is a simpler, no-cost fit.",
        migrate: {
            title: "Coaching versus logging",
            body: [
                "MacroFactor's pitch is its algorithm: it watches your logged intake and weight and quietly recalculates your calorie and macro targets each week — genuinely clever, adaptive coaching from the Stronger By Science team. That coaching is the product, which is why it's subscription-only.",
                "Nutrition MCP doesn't run a coaching algorithm — but because you're already inside an AI assistant, you can just ask. “Given my last three weeks, should I adjust my calories?” gets you a reasoned answer on demand. It's a different model: analysis when you want it, conversationally, instead of a fixed weekly recalculation — and it's free.",
                "The honest trade-off is discipline versus flexibility. MacroFactor's weekly recalculation happens whether or not you think to ask, which keeps you honest; the conversational model only adjusts when you prompt it. If you want a hands-off algorithm steering your numbers, MacroFactor is worth the subscription. If you'd rather log for free and pull analysis when you care, this fits better.",
            ],
        },
        extraFaqs: [
            {
                q: "Does Nutrition MCP adjust my calorie targets like MacroFactor?",
                a: "Not automatically. MacroFactor's weekly, algorithmic recalculation is its paid core feature. With Nutrition MCP you ask — “based on my last three weeks of intake and weight, should I adjust my calories?” — and your AI reasons through it on demand, rather than a fixed weekly update.",
            },
            {
                q: "Is Nutrition MCP really free when MacroFactor is subscription-only?",
                a: "Yes. Nutrition MCP is completely free and open source, with no trial-then-pay and no free-tier limits — unlike MacroFactor, which has no free tier and requires a subscription after its trial. You only need a Claude or ChatGPT account.",
            },
        ],
        freeAnswer:
            "Yes. Nutrition MCP is completely free and open source, with no subscription — whereas MacroFactor requires a paid subscription after its free trial. You just need a Claude or ChatGPT account to connect.",
    },
    {
        name: "Yazio",
        slug: "yazio-mcp",
        file: "yazio.html",
        icon: "fa-carrot",
        hubBlurb:
            "No MCP server. Track meals and macros by conversation — free and open source.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "Search the database for each food you log",
            "Some features, like meal plans, need a paid PRO plan",
            "A separate app and account to manage",
        ],
        note: "Yazio is a polished tracker with good meal plans. Nutrition MCP focuses on effortless conversational logging that lives inside Claude or ChatGPT — free and open source.",
        migrate: {
            title: "Plans on one side, logging on the other",
            body: [
                "Yazio pairs tracking with structured meal plans, recipes, and fasting tools, polished for a European audience. If a guided plan is what keeps you on track, Yazio does that well and Nutrition MCP doesn't try to — it isn't a meal-plan app.",
                "What it does do is make the logging half effortless. Instead of searching Yazio's database for each ingredient, you describe the dish and your AI handles the macros — then answers “how am I doing today?” in the same breath. Pair it with whatever eating plan you already follow.",
                "This actually makes the two complementary rather than competing. Keep following a Yazio plan, or any plan, for the “what to eat” side; use Nutrition MCP for the “did I stay on track” side, logged by conversation and free. The one place it won't help is fasting timers — that's Yazio's territory, not a nutrition log's.",
            ],
        },
        extraFaqs: [
            {
                q: "Does Nutrition MCP include meal plans like Yazio PRO?",
                a: "No. Yazio's structured meal plans, recipes, and fasting tools are its strength, and Nutrition MCP doesn't try to replace them — it handles the logging half. Many people keep following their Yazio (or any) plan and simply log against it here for free.",
            },
            {
                q: "Can I log meals faster than searching Yazio's database?",
                a: "Usually, yes. Rather than searching Yazio's database for each ingredient and setting portions, you describe the finished dish once — “a bowl of muesli with yogurt and berries” — and your AI estimates and logs the macros in a single step.",
            },
        ],
    },
    {
        name: "Lifesum",
        slug: "lifesum-mcp",
        file: "lifesum.html",
        icon: "fa-leaf",
        hubBlurb:
            "No MCP server. A leaner, free way to log food inside Claude or ChatGPT.",
        cons: [
            "No MCP server — can't run inside Claude or ChatGPT",
            "Log foods by searching its database one by one",
            "Some features, like diet plans, need a paid plan",
            "Yet another app and subscription to manage",
        ],
        note: "Lifesum pairs tracking with structured diet plans. Nutrition MCP is a leaner, free way to log calories, macros, and weight by talking to your AI.",
        migrate: {
            title: "Ratings you can just ask about",
            body: [
                "Lifesum leans on structure and feedback — diet plans, recipes, and its food-rating system that scores what you eat. Nutrition MCP doesn't grade your foods with a badge, so if that scoring loop is what motivates you, Lifesum has an edge there.",
                "The trade is flexibility: rather than a fixed rating, you can ask your AI “is this a good choice for my goals?” and get a real answer in context. Logging is a single sentence, trends and a target weight come built in, and there's no premium tier gating the useful parts.",
                "A badge tells you a food scored 3 out of 5; a conversation tells you why, and what to do about it — “swap half the rice for greens and this fits your day.” It's the difference between a score and a coach, and because Lifesum puts diet plans and some tracking behind Premium, it's the free option of the two.",
            ],
        },
        extraFaqs: [
            {
                q: "Does Nutrition MCP rate my food like Lifesum's food ratings?",
                a: "No — there's no badge or numeric score. Instead you can ask your AI “is this a good choice for my goals?” and get a contextual answer that explains the trade-offs, rather than a fixed rating on the food itself.",
            },
            {
                q: "Is Nutrition MCP free without a Lifesum Premium-style plan?",
                a: "Yes. Nutrition MCP is completely free and open source, with no premium tier — whereas Lifesum puts diet plans and some tracking features behind a Premium subscription. You only need a Claude or ChatGPT account to connect.",
            },
        ],
    },
];

// ---------- shared markup fragments ----------

const HEAD_ASSETS = `        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:wght@400;500&family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&display=swap"
            rel="stylesheet"
        />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css"
        />
        <link rel="stylesheet" href="/styles.css" />
        <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-1K4HRB2R8X"
        ></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                dataLayer.push(arguments);
            }
            gtag("js", new Date());
            gtag("config", "G-1K4HRB2R8X");
        </script>`;

const THEME_PREPAINT = `        <script>
            // Apply a saved theme override before paint to avoid a flash.
            (function () {
                try {
                    var t = localStorage.getItem("theme");
                    if (t === "dark" || t === "light")
                        document.body.setAttribute("data-theme", t);
                } catch (e) {}
            })();
        </script>`;

const NAV = `        <header class="nav">
            <a class="nav-brand" href="/">
                <span class="nav-mark" aria-hidden="true"
                    ><i class="fa-solid fa-apple-whole"></i
                ></span>
                <span>Nutrition&nbsp;MCP</span>
            </a>
            <div class="nav-right">
                <nav class="nav-links">
                    <a href="/#how">How it works</a>
                    <a href="/#install">Install</a>
                    <a href="/#try">Examples</a>
                    <a href="/alternatives">Alternatives</a>
                    <a href="/#faq">FAQ</a>
                    <a
                        href="https://github.com/akutishevsky/nutrition-mcp"
                        target="_blank"
                        rel="noopener noreferrer"
                        >GitHub</a
                    >
                </nav>
                <button
                    class="theme-toggle"
                    type="button"
                    id="theme-toggle"
                    aria-label="Toggle dark mode"
                    title="Toggle dark mode"
                >
                    <i class="fa-solid fa-moon" aria-hidden="true"></i>
                </button>
            </div>
        </header>`;

const FOOTER = `        <footer class="footer">
            <div class="footer-inner">
                <span class="footer-brand"
                    ><i class="fa-solid fa-apple-whole" aria-hidden="true"></i>
                    Nutrition MCP</span
                >
                <nav class="footer-links">
                    <a href="/">Home</a>
                    <a href="/alternatives">Alternatives</a>
                    <a
                        href="https://github.com/akutishevsky/nutrition-mcp"
                        target="_blank"
                        rel="noopener noreferrer"
                        >GitHub</a
                    >
                    <a href="mailto:anton@nutrition-mcp.com">Contact</a>
                    <a href="/privacy">Privacy &amp; Terms</a>
                </nav>
            </div>
        </footer>`;

const THEME_SCRIPT_BODY = `                var themeBtn = document.getElementById("theme-toggle");
                if (themeBtn) {
                    var themeIcon = themeBtn.querySelector("i");
                    var metaTheme = document.querySelector(
                        'meta[name="theme-color"]',
                    );
                    var darkQuery = window.matchMedia(
                        "(prefers-color-scheme: dark)",
                    );
                    function effectiveTheme() {
                        var override = document.body.getAttribute("data-theme");
                        if (override) return override;
                        return darkQuery.matches ? "dark" : "light";
                    }
                    function syncUI() {
                        var dark = effectiveTheme() === "dark";
                        if (themeIcon)
                            themeIcon.className = dark
                                ? "fa-solid fa-sun"
                                : "fa-solid fa-moon";
                        var label = dark
                            ? "Switch to light mode"
                            : "Switch to dark mode";
                        themeBtn.setAttribute("aria-label", label);
                        themeBtn.setAttribute("title", label);
                        if (metaTheme)
                            metaTheme.setAttribute(
                                "content",
                                dark ? "#161617" : "#4a7c59",
                            );
                    }
                    themeBtn.addEventListener("click", function () {
                        var next =
                            effectiveTheme() === "dark" ? "light" : "dark";
                        document.body.setAttribute("data-theme", next);
                        try {
                            localStorage.setItem("theme", next);
                        } catch (e) {}
                        syncUI();
                    });
                    darkQuery.addEventListener("change", function () {
                        if (!document.body.getAttribute("data-theme")) syncUI();
                    });
                    syncUI();
                }`;

const COPY_SCRIPT_BODY = `                document.querySelectorAll(".copy-mini").forEach(function (btn) {
                    var icon = btn.querySelector("i");
                    btn.addEventListener("click", function () {
                        var text = btn.getAttribute("data-copy");
                        function ok() {
                            btn.classList.add("copied");
                            if (icon) icon.className = "fa-solid fa-check";
                            setTimeout(function () {
                                btn.classList.remove("copied");
                                if (icon) icon.className = "fa-solid fa-copy";
                            }, 1500);
                        }
                        function fallback() {
                            try {
                                var ta = document.createElement("textarea");
                                ta.value = text;
                                ta.style.position = "absolute";
                                ta.style.left = "-9999px";
                                document.body.appendChild(ta);
                                ta.select();
                                document.execCommand("copy");
                                document.body.removeChild(ta);
                                ok();
                            } catch (e) {}
                        }
                        if (
                            navigator.clipboard &&
                            navigator.clipboard.writeText
                        ) {
                            navigator.clipboard
                                .writeText(text)
                                .then(ok, fallback);
                        } else {
                            fallback();
                        }
                    });
                });`;

const GENERATED_BANNER = `        <!-- Generated by scripts/gen-alternatives.ts — edit the data there, not this file. -->`;

/**
 * Trademark / non-affiliation notice shown near the footer of every comparison
 * page. Keeps the pages clearly independent and hedges the comparisons as
 * point-in-time — the main legal safeguards for "alternative to X" content.
 */
function disclaimerBand(text: string): string {
    return `        <div class="disclaimer-band">
            <div class="container">
                <p class="page-disclaimer">${text}</p>
            </div>
        </div>`;
}

// The "What you get instead" feature grid describes Nutrition MCP, so it's the
// same on every page.
const FEATURES = `                    <div class="features-grid">
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-utensils"></i
                            ></span>
                            <h3>Meals in plain language</h3>
                            <p>
                                Say &ldquo;oatmeal with banana and peanut
                                butter&rdquo; — your AI estimates calories and
                                macros and logs it. No database search.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-barcode"></i
                            ></span>
                            <h3>Barcode scanning — free</h3>
                            <p>
                                Send a product barcode and pull verified macros
                                from Open Food Facts. No Premium subscription to
                                unlock it.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-weight-scale"></i
                            ></span>
                            <h3>Weight &amp; goals</h3>
                            <p>
                                Log body weight in kg or lb, set calorie, macro,
                                and water targets, and track trends toward a goal
                                weight.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-chart-area"></i
                            ></span>
                            <h3>Summaries &amp; trends</h3>
                            <p>
                                Ask for daily totals, weekly trends, streaks, and
                                recurring meal patterns — right in the chat.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-file-csv"></i
                            ></span>
                            <h3>Export &amp; own your data</h3>
                            <p>
                                Export everything to CSV anytime and delete your
                                account and data whenever you want.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-code-branch"></i
                            ></span>
                            <h3>Open source &amp; free</h3>
                            <p>
                                MIT-licensed and self-hostable — no ads, no
                                paywall, no upsell. Audit the code or run your own
                                instance.
                            </p>
                        </article>
                    </div>`;

const INSTALL = `                    <div class="card install-card">
                        <ol class="steps">
                            <li>
                                Open <strong>Claude</strong> (web or desktop) and
                                click <strong>Customize</strong> →
                                <strong>Connectors</strong>.
                            </li>
                            <li>
                                Click <strong>+</strong>, then
                                <strong>Add custom connector</strong>, and give it
                                a name like <strong>Nutrition</strong>.
                            </li>
                            <li>
                                Paste
                                <span class="copy-url"
                                    ><code>https://nutrition-mcp.com/mcp</code
                                    ><button
                                        class="copy-mini"
                                        type="button"
                                        data-copy="https://nutrition-mcp.com/mcp"
                                        aria-label="Copy server URL"
                                    >
                                        <i class="fa-solid fa-copy"></i></button
                                ></span>
                                into the
                                <strong>Remote MCP server URL</strong> field and
                                click <strong>Add</strong>.
                            </li>
                            <li>
                                Click <strong>Connect</strong>, sign in, and start
                                logging by saying what you ate.
                            </li>
                        </ol>
                        <p class="note">
                            Using ChatGPT or another client instead? The
                            <a href="/#install">full install guide</a> covers
                            ChatGPT, Cursor, VS Code, Claude Code, and more.
                        </p>
                    </div>`;

// The Nutrition MCP (right) column of the comparison is identical everywhere.
const PROS = [
    "Built as an MCP server — lives inside Claude &amp; ChatGPT",
    "Describe meals in plain language; macros estimated for you",
    "Barcode scanning, trends, and exports — all free",
    "No separate app, no ads, open source",
];

// ---------- helpers ----------

function faqsFor(app: App): { q: string; a: string }[] {
    return [
        {
            q: `Does ${app.name} have an MCP server?`,
            a: `No. ${app.name} does not offer a Model Context Protocol (MCP) server, so there is no official way to connect it to Claude, ChatGPT, or other AI assistants. Nutrition MCP is a free, open-source alternative built as an MCP server from the ground up, so you can log meals and macros directly inside your AI.`,
        },
        {
            q: `How do I connect ${app.name} to Claude?`,
            a: `There is no official ${app.name} connector for Claude, because ${app.name} has no MCP server or public MCP integration. The closest option is Nutrition MCP, a free MCP server: add https://nutrition-mcp.com/mcp as a custom connector in Claude, sign in, and start logging by conversation.`,
        },
        ...app.extraFaqs,
        {
            q: `Is Nutrition MCP a good ${app.name} alternative?`,
            a: `If you want to track calories, macros, water, and weight without opening a separate app or searching a food database, yes. Instead of tapping through a database, you describe what you ate in plain language, send a photo, or scan a barcode, and your AI logs it — completely free and open source.`,
        },
        {
            q: `Can I import my ${app.name} data?`,
            a: `There is no automatic ${app.name} import yet. Because logging is conversational it is quick to start fresh, and you fully own your Nutrition MCP data — export everything to CSV or delete your account at any time.`,
        },
        {
            q: `Is Nutrition MCP free?`,
            a:
                app.freeAnswer ??
                `Yes. Nutrition MCP is completely free with no premium tier, ads, or paywalled features — unlike apps that put some features behind a subscription. You only need a Claude or ChatGPT account to connect.`,
        },
    ];
}

/** Minimal HTML-entity escaping for text interpolated into element bodies. */
function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jsonLd(obj: unknown): string {
    return `        <script type="application/ld+json">\n${JSON.stringify(
        obj,
        null,
        4,
    )
        .split("\n")
        .map((l) => "            " + l)
        .join("\n")}\n        </script>`;
}

// ---------- per-app page ----------

function renderApp(app: App): string {
    const url = `${SITE}/${app.slug}`;
    const desc = `No MCP server for ${app.name}? Nutrition MCP is a free, open-source alternative that logs meals, macros, and weight inside Claude or ChatGPT.`;
    const ogDesc = `${app.name} has no MCP server. Nutrition MCP is a free, open-source alternative that logs meals, macros, and weight by talking to Claude or ChatGPT.`;
    const title = `${app.name} MCP Server? Track Nutrition in Claude & ChatGPT`;
    const faqs = faqsFor(app);

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: SITE,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Alternatives",
                item: `${SITE}/alternatives`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `${app.name} MCP`,
                item: url,
            },
        ],
    };
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    const cons = app.cons
        .map(
            (c) =>
                `                                <li>\n                                    <i class="fa-solid fa-xmark"></i> ${esc(c)}\n                                </li>`,
        )
        .join("\n");
    const pros = PROS.map(
        (p) =>
            `                                <li>\n                                    <i class="fa-solid fa-circle-check"></i>\n                                    ${p}\n                                </li>`,
    ).join("\n");
    const faqDetails = faqs
        .map(
            (f) =>
                `                        <details>\n                            <summary>${esc(f.q)}</summary>\n                            <p>${esc(f.a)}</p>\n                        </details>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="en">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
        <link rel="canonical" href="${url}" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#4a7c59" />
${jsonLd(breadcrumb)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${GENERATED_BANNER}
${THEME_PREPAINT}
${NAV}

        <main>
            <!-- Hero -->
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="/">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <a href="/alternatives">Alternatives</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>${esc(app.name)}</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">${esc(app.name)} alternative</p>
                        <h1 class="hero-title">
                            Looking for a <em>${esc(app.name)} MCP</em> server?
                        </h1>
                        <p class="lead">
                            ${esc(app.name)} doesn't have one — so you can't use
                            it inside Claude or ChatGPT. Nutrition MCP does the
                            same job by conversation, and it's free and open
                            source.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="#switch"
                                >Connect in under a minute</a
                            >
                            <a class="btn btn-secondary" href="#compare"
                                >See the comparison</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <!-- The honest answer -->
            <section class="section band" id="answer">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">The short answer</p>
                        <h2 class="section-title">
                            No, ${esc(app.name)} has no MCP server.
                        </h2>
                        <p class="section-sub">
                            The Model Context Protocol (MCP) is the open standard
                            that lets AI assistants like Claude and ChatGPT
                            connect to outside tools. ${esc(app.name)} doesn't
                            publish an MCP server, so there's no official way to
                            log food to it from your AI. If you searched for
                            &ldquo;${esc(app.name)} MCP&rdquo; or &ldquo;connect
                            ${esc(app.name)} to Claude,&rdquo; what you're really
                            after is a nutrition tracker that lives
                            <em>inside</em> your AI — that's exactly what
                            Nutrition MCP is.
                        </p>
                    </div>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="section" id="instead">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">What you get instead</p>
                        <h2 class="section-title">
                            The same tracking, just by talking
                        </h2>
                    </div>
${FEATURES}
                </div>
            </section>

            <!-- Comparison -->
            <section class="section band" id="compare">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">${esc(app.name)} vs. Nutrition MCP</p>
                        <h2 class="section-title">How they stack up</h2>
                    </div>
                    <div class="compare">
                        <div class="compare-col">
                            <h3 class="compare-h compare-h-old">
                                ${esc(app.name)}
                            </h3>
                            <ul>
${cons}
                            </ul>
                        </div>
                        <div class="compare-col compare-col-new">
                            <h3 class="compare-h compare-h-new">
                                Nutrition MCP
                            </h3>
                            <ul>
${pros}
                            </ul>
                        </div>
                    </div>
                    <p class="note compare-note">
                        ${esc(app.note)}
                    </p>
                </div>
            </section>

            <!-- Moving from X (per-app, unique content) -->
            <section class="section" id="moving">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">Moving from ${esc(app.name)}</p>
                        <h2 class="section-title">
                            ${esc(app.migrate.title)}
                        </h2>
                    </div>
                    <div class="prose">
${app.migrate.body
    .map((p) => `                        <p>${esc(p)}</p>`)
    .join("\n")}
                    </div>
                </div>
            </section>

            <!-- How to switch -->
            <section class="section band" id="switch">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">How to switch</p>
                        <h2 class="section-title">Connect in under a minute</h2>
                        <p class="section-sub">
                            Works with any MCP client that supports OAuth 2.0
                            with PKCE. On first connect you create an account
                            with Google or an email and password.
                        </p>
                    </div>
${INSTALL}
                </div>
            </section>

            <!-- FAQ -->
            <section class="section" id="faq">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">FAQ</p>
                        <h2 class="section-title">
                            ${esc(app.name)} &amp; MCP questions
                        </h2>
                    </div>
                    <div class="faq">
${faqDetails}
                    </div>
                </div>
            </section>

            <!-- Closing CTA -->
            <section class="section cta">
                <div class="container cta-inner">
                    <h2 class="cta-title">
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — no ${esc(app.name)} account, no app
                        to open.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="#switch"
                            >Quick install</a
                        >
                        <a class="btn btn-ghost-accent" href="/alternatives"
                            >Other alternatives</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${esc(app.name)} is a trademark of its respective owner. Nutrition MCP is an independent, open-source project and is not affiliated with, endorsed by, or sponsored by ${esc(app.name)}. Comparisons reflect publicly available information at the time of writing and may change.`)}

${FOOTER}

        <script>
            (function () {
                // ---------- theme toggle (dark / light, default = system) ----------
${THEME_SCRIPT_BODY}

                // ---------- copy-URL buttons ----------
${COPY_SCRIPT_BODY}
            })();
        </script>
    </body>
</html>
`;
}

// ---------- hub page ----------

function renderHub(): string {
    const url = `${SITE}/alternatives`;
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: SITE,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Alternatives",
                item: url,
            },
        ],
    };
    const cards = APPS.map(
        (app) =>
            `                        <a class="card feature alt-card" href="/${app.slug}">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid ${app.icon}"></i
                            ></span>
                            <h3>${esc(app.name)} &rarr;</h3>
                            <p>${esc(app.hubBlurb)}</p>
                        </a>`,
    ).join("\n");

    const title =
        "Nutrition App MCP Alternatives — Track Food in Claude & ChatGPT";
    const desc =
        "MyFitnessPal, Cronometer, and other nutrition apps have no MCP server. Nutrition MCP is the free, open-source alternative for Claude and ChatGPT.";
    const ogDesc =
        "Your nutrition app doesn't have an MCP server. Nutrition MCP is a free, open-source alternative that works inside Claude or ChatGPT.";

    return `<!doctype html>
<html lang="en">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
        <link rel="canonical" href="${url}" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#4a7c59" />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${GENERATED_BANNER}
${THEME_PREPAINT}
${NAV}

        <main>
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="/">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>Alternatives</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">MCP alternatives</p>
                        <h1 class="hero-title">
                            Your nutrition app doesn't have an
                            <em>MCP server</em>.
                        </h1>
                        <p class="lead">
                            Apps like MyFitnessPal, Cronometer, and Lose It can't
                            connect to Claude or ChatGPT. Nutrition MCP is the
                            free, open-source way to track meals, macros, and
                            weight by talking to your AI.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="/#install"
                                >Quick install</a
                            >
                            <a class="btn btn-secondary" href="/#try"
                                >See examples</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <section class="section band" id="apps">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">Switching from…</p>
                        <h2 class="section-title">Pick your current app</h2>
                        <p class="section-sub">
                            See how Nutrition MCP compares to the tracker you use
                            today — and how to move your logging into your AI.
                        </p>
                    </div>
                    <div class="features-grid">
${cards}
                    </div>
                    <p class="note compare-note">
                        Don't see your app? It almost certainly has no MCP server
                        either — Nutrition MCP works the same way regardless of
                        what you're switching from.
                        <a href="mailto:anton@nutrition-mcp.com"
                            >Request a comparison</a
                        >.
                    </p>
                </div>
            </section>

            <section class="section cta">
                <div class="container cta-inner">
                    <h2 class="cta-title">
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — it works with Claude, ChatGPT, and
                        any MCP client.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="/#install"
                            >Quick install</a
                        >
                        <a
                            class="btn btn-ghost-accent"
                            href="https://github.com/akutishevsky/nutrition-mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                            ><i class="fa-brands fa-github"></i> Star on GitHub</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${APPS.map((a) => esc(a.name)).join(", ")}, and other product names are trademarks of their respective owners. Nutrition MCP is an independent, open-source project and is not affiliated with or endorsed by them. Comparisons reflect publicly available information at the time of writing and may change.`)}

${FOOTER}

        <script>
            (function () {
${THEME_SCRIPT_BODY}
            })();
        </script>
    </body>
</html>
`;
}

// ---------- write + sitemap ----------

const OUT_DIR = "./public/alternatives";

for (const app of APPS) {
    await Bun.write(`${OUT_DIR}/${app.file}`, renderApp(app));
    console.log(`wrote ${app.file}  (/${app.slug})`);
}
await Bun.write(`${OUT_DIR}/index.html`, renderHub());
console.log("wrote index.html  (/alternatives)");

// Emit the route map + sitemap entries so wiring stays in sync with the data.
console.log("\n--- ALT_PAGES for src/index.ts ---");
console.log('    "/alternatives": "alternatives/index.html",');
for (const app of APPS) {
    console.log(`    "/${app.slug}": "alternatives/${app.file}",`);
}

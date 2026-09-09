// Typed content for the landing page (public/index.html and every
// public/{locale}/index.html), rendered by scripts/gen-index.ts. English and
// every translation go through the same generator instead of a hand-authored
// English file sitting next to generated ones (see CLAUDE.md's "Public site"
// section, and src/copy/legal.ts for the pattern this follows).
//
// This is the 6a "Dawn" landing page: the hero with its auto-playing chat,
// How it works, Connect (the tabbed install card), the first-five-minutes
// onboarding rail, the Examples picker, the Live stats board with the
// timezone map, Support (Patreon), Contact, the filterable FAQ and the
// closing CTA band. Every string a visitor reads in those sections comes
// from here; the generator holds icons, hrefs, SVG and layout only. The
// header pills, sheet menu and footer around them are the shared chrome —
// their strings live in src/copy/chrome.ts (ChromeCopy), not here.
//
// TRUSTED HTML. Exactly four places carry inline markup, and nothing else
// does — the generator inserts these four unescaped and runs every other
// field through esc():
//   - `connect.claude.steps[]` and `connect.chatgpt.steps[]` — <b> around
//     the UI labels a reader has to find on screen, <code> around the
//     server URL.
//   - `connect.other.noteHtml` — <code> around config keys and the Claude
//     Code command.
//   - `faq[].visibleHtml` — <code> around commands/file names and an
//     occasional inline <a href>. The JSON-LD FAQPage answer is derived by
//     stripping these tags (see FaqEntry.jsonLdText).
// A translation must keep every tag in those fields and add none anywhere
// else: a plain field containing "<" renders as a literal "<".
//
// Numbers that are not copy: the hero chat's per-exchange nutrient deltas
// (`HeroExchange.add`) and clock strings ride on the static markup as
// data-add / data-clock attributes and drive the replay script; they are
// the same in every locale, so a locale file copies them verbatim.
//
// The registered-tool count ("36") is hand-typed in two strings here
// (support.bullets[0], the "What is an MCP server?" FAQ answer) and in
// every locale mirror — plus the footer's product.tools link and the
// sheet's toolsSmall hint in src/copy/chrome.ts. See CLAUDE.md's
// "Registered tool set" for the full list of places that move together.
//
// INDEX is `Partial<Record<SiteLocale, IndexDoc>>`, not the full `Record`,
// while translation is still in progress — see legal.ts's PRIVACY/TERMS for
// why.

import type { SiteLocale } from "../routes.js";
import { INDEX_DE } from "./index.de.js";
import { INDEX_ES } from "./index.es.js";
import { INDEX_FR } from "./index.fr.js";
import { INDEX_NL } from "./index.nl.js";
import { INDEX_PL } from "./index.pl.js";
import { INDEX_IT } from "./index.it.js";
import { INDEX_UK } from "./index.uk.js";
import { INDEX_JA } from "./index.ja.js";

/** The FAQ's filter chips. `data` renders as "Your data". */
export type FaqCategory = "basics" | "clients" | "tracking" | "data";

/** One FAQ entry. `visibleHtml` is what a human reads in the <details>
 * (trusted HTML). `jsonLdText` is optional: when omitted, the generator
 * derives the JSON-LD `Answer.text` by stripping tags out of
 * `visibleHtml`, which is exactly right for every answer whose markup is
 * only <code> or an inline link whose surrounding words already read as
 * one sentence. Set it only when the visible answer deliberately omits
 * something a search engine reading the answer standalone would need
 * (historically: the server URL, stated elsewhere on the page). No English
 * entry needs it at the moment; the field stays so a locale can. */
export interface FaqEntry {
    question: string;
    visibleHtml: string;
    jsonLdText?: string;
    category: FaqCategory;
}

/** One exchange in the hero's auto-playing chat. Exactly one of userText /
 * barcode is set. */
export interface HeroExchange {
    /** What the user typed. Omitted when `barcode` is true. */
    userText?: string;
    /** The exchange opens with the barcode "photo" card instead of a typed
     * message. */
    barcode?: true;
    aiText: string;
    /** Nutrient deltas this exchange adds to the summary widget. Numbers,
     * never copy — identical in every locale. */
    add: Partial<{
        kcal: number;
        pro: number;
        car: number;
        fat: number;
        water: number;
        sugar: number;
        caf: number;
    }>;
    /** Clock shown in the chat header while this exchange plays, e.g.
     * "08:04". */
    clock: string;
    /** Show the summary widget after this exchange's reply. */
    widget?: true;
}

export interface ExampleSlide {
    title: string;
    sub: string;
    userText: string;
    aiText: string;
    /** Only the trends example carries the mini widget. */
    widget?: {
        title: string;
        sub: string;
        big: string;
        cap: string;
        from: string;
        goal: string;
        today: string;
    };
}

/**
 * The landing page's copy. Plain text everywhere except the four trusted-
 * HTML fields listed in the file header: `connect.claude.steps`,
 * `connect.chatgpt.steps`, `connect.other.noteHtml` and `faq[].visibleHtml`.
 */
export interface IndexDoc {
    title: string;
    metaDescription: string;
    ogDescription: string;
    keywords: string;
    /** The design's helmet carries a shorter og:title / twitter:title and
     * its own twitter:description; optional, falling back to `title` /
     * `ogDescription` on a locale that doesn't set them. */
    ogTitle?: string;
    twitterDescription?: string;

    hero: {
        /** The h1 is `titleBeforeEm` + <em>`titleEm`</em> + `titleAfterEm`;
         * keep the surrounding spaces inside the outer two. */
        titleBeforeEm: string;
        titleEm: string;
        titleAfterEm: string;
        lead: string;
        ctaPrimary: string;
        ctaGithub: string;
        moreExamples: string;
        chat: {
            /** Chat header, e.g. "Nutrition · connected". */
            status: string;
            /** Caption under the barcode card, e.g. "📷 Photo". */
            photoCaption: string;
            /** Accessible name of the pause/play toggle in the chat header
             * (WCAG 2.2.2 — the replay auto-starts and runs longer than
             * 5 s). One constant name; aria-pressed carries the state. */
            pauseLabel: string;
            /** Exactly 5, in the design's order; the replay loops them. */
            exchanges: HeroExchange[];
            /** Labels inside the summary widget. The figures (1,059 kcal,
             * 60/160 g …) are computed from `exchanges[].add`, so the goal
             * string is the only number here. */
            widget: {
                title: string;
                goal: string;
                kcalUnit: string;
                protein: string;
                carbs: string;
                fat: string;
                water: string;
                sugar: string;
                caffeine: string;
                hint: string;
            };
        };
    };

    how: {
        eyebrow: string;
        title: string;
        sub: string;
        /** 3 cards. */
        steps: { title: string; body: string }[];
        /** "{n} / 3" — the generator substitutes {n}. */
        counter: string;
    };

    connect: {
        eyebrow: string;
        title: string;
        sub: string;
        /** Visible text of the endpoint-pill copy button, before and after
         * a click. */
        copyLabel: string;
        copiedLabel: string;
        copyAriaLabel: string;
        /** 3 check bullets. */
        bullets: string[];
        /** The third install tab's visible label ("Other agents") — unlike
         * the "Claude"/"ChatGPT" brand-name tabs it is ordinary descriptive
         * text, so it translates. */
        otherTabLabel: string;
        /** Visually-hidden legend naming the Claude / ChatGPT / Other radio
         * set, e.g. "Choose your AI client". */
        tabsLabel: string;
        /** `steps` are trusted HTML: <b> around on-screen UI labels, <code>
         * around the server URL. `note` is plain text. */
        claude: { steps: string[]; note: string };
        chatgpt: { steps: string[]; note: string };
        /** Trusted HTML: <code> around config keys and the command. */
        other: { noteHtml: string };
    };

    onboarding: {
        title: string;
        sub: string;
        /** "Step {n}" — the generator substitutes {n}. */
        stepLabel: string;
        /** The muted lead-in of the quote box, trailing space included:
         * the generator renders `justSay` + “`say`”. */
        justSay: string;
        /** 4 cards. `say` is the bare sentence — no quotation marks, the
         * generator adds the curly ones. */
        steps: { title: string; body: string; say: string }[];
    };

    examples: {
        title: string;
        sub: string;
        /** Preview-card header, e.g. "Nutrition · connected". */
        status: string;
        /** aria-labels of the round prev/next buttons. */
        prevLabel: string;
        nextLabel: string;
        /** aria-label of the picker's radio group, e.g. "Choose an
         * example". */
        pickerLabel: string;
        /** 3 slides; the third carries the trends widget. */
        slides: ExampleSlide[];
    };

    live: {
        /** e.g. "Live · everyone, so far" — the pulsing dot precedes it. */
        eyebrow: string;
        title: string;
        sub: string;
        /** The Metric / Imperial segmented toggle: group aria-label and the
         * two button texts. The buttons' data-unit values stay kg/lb. */
        unitGroupLabel: string;
        unitMetricLabel: string;
        unitImperialLabel: string;
        /** "Refreshes every 5 s · next in {n}s" split around the number —
         * `refreshBefore` keeps its trailing space, `refreshAfter` is what
         * follows the digit with no space. */
        refreshBefore: string;
        refreshAfter: string;
        /** "since you opened this page" — the generator appends
         * " · <elapsed>". */
        sinceOpenLabel: string;
        /** The 7 stat-card labels. `weightLost` names the date the weight
         * log went live; keep it. */
        cards: {
            calories: string;
            foodLogs: string;
            protein: string;
            carbs: string;
            fat: string;
            weightLost: string;
            water: string;
        };
        /** Delta unit word for food logs, e.g. "logs" → "+3 logs". */
        foodLogsUnit: string;
        /** "{n} timezones · days roll over at each person's own midnight" —
         * the text after the number. The generator emits <b>{n}</b>
         * immediately followed by this string with NO space of its own, so
         * the string must carry its own leading space where the language
         * puts one (" timezones") and none where it doesn't (Japanese's
         * "か所の…" sits flush against the numeral). */
        timezonesAfter: string;
        /** Mono note beside the timezone count, e.g. "dot size = share of
         * accounts · hover a dot". */
        mapNote: string;
        mapAriaLabel: string;
    };

    support: {
        eyebrow: string;
        title: string;
        sub: string;
        /** 4 check bullets. */
        bullets: string[];
        patreon: {
            eyebrow: string;
            title: string;
            sub: string;
            cta: string;
            starCta: string;
        };
        /** The "Latest posts on Patreon" block, hidden until
         * /api/patreon-posts returns something. */
        postsTitle: string;
        postsAll: string;
        /** Accessible/visible link text on each post card, e.g. "Read on
         * Patreon" — the API gives a card no "kind" label, so this is the
         * only text on it that isn't the post's own. */
        postLinkLabel: string;
    };

    contact: {
        eyebrow: string;
        title: string;
        sub: string;
        /** aria-label of the email pill; its visible text is the address
         * itself, so this must contain the address (WCAG 2.5.3 Label in
         * Name). */
        emailAriaLabel: string;
        cards: {
            email: { title: string; sub: string };
            issues: { title: string; sub: string };
            patreon: { title: string; sub: string };
        };
    };

    faqSection: {
        eyebrow: string;
        title: string;
        /** The intro paragraph is `subBefore` + <a href="#contact">
         * `subLink`</a> + `subAfter`; keep the trailing space inside
         * `subBefore`. */
        subBefore: string;
        subLink: string;
        subAfter: string;
        /** aria-label of the chips' radio group, e.g. "Filter questions by
         * category". */
        categoriesLabel: string;
        /** Chip labels; `all` is the reset chip, the rest map 1:1 onto
         * FaqCategory. */
        categories: {
            all: string;
            basics: string;
            clients: string;
            tracking: string;
            data: string;
        };
    };
    /** Ordered basics → clients → tracking → data; the visible 2-digit
     * number is the entry's index+1 across all entries, so order here is
     * order on the page. */
    faq: FaqEntry[];

    cta: { title: string; sub: string; primary: string; secondary: string };
}

export const INDEX_EN: IndexDoc = {
    title: "Nutrition MCP — Free calorie & macro tracker for Claude, ChatGPT and Cursor",
    metaDescription:
        "Track calories, protein, carbs, fat, fiber, sugar and caffeine by talking to your AI. Nutrition MCP is a free, open-source MCP server that works in Claude, ChatGPT, Cursor and any MCP client. No app to install.",
    ogDescription:
        "Free, open-source MCP server for calorie and macro tracking inside Claude, ChatGPT and Cursor. Say what you ate; it does the math.",
    ogTitle: "Nutrition MCP — Track your nutrition by talking to your AI",
    twitterDescription:
        "Free, open-source MCP server for calorie and macro tracking in Claude, ChatGPT and Cursor.",
    keywords:
        "nutrition tracker, calorie tracker, macro tracker, MCP server, Claude connector, ChatGPT app, AI nutrition tracking, food log, barcode scanner, open source, MyFitnessPal alternative",

    hero: {
        titleBeforeEm: "Track your nutrition by ",
        titleEm: "talking",
        titleAfterEm: " to your AI.",
        lead: "Nutrition MCP is a free, open-source calorie and macro tracker that lives inside Claude, ChatGPT, Cursor — any AI that supports MCP. Say what you ate; it works out the calories, protein, carbs, fat, fiber, sugar and caffeine, logs it, and shows you the day. No app to install.",
        ctaPrimary: "Connect in a minute",
        ctaGithub: "GitHub",
        moreExamples: "More examples",
        chat: {
            status: "Nutrition · connected",
            photoCaption: "📷 Photo",
            pauseLabel: "Pause the demo",
            exchanges: [
                {
                    userText:
                        "Oatmeal with berries and a flat white for breakfast",
                    aiText: "Logged — about 380 kcal, 14 g protein. The flat white adds 130 mg of caffeine.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        caf: 130,
                    },
                    clock: "08:04",
                },
                {
                    barcode: true,
                    aiText: "That's a 330 ml Coca-Cola — 139 kcal, 35 g sugar, from Open Food Facts. Logged as a snack.",
                    add: { kcal: 139, car: 35, sugar: 35 },
                    clock: "11:30",
                },
                {
                    userText: "Half a litre of water",
                    aiText: "Done. 500 ml so far today.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "Big grilled chicken salad for lunch",
                    aiText: "Logged — about 540 kcal, 46 g protein. You're halfway to today's 2,000.",
                    add: { kcal: 540, pro: 46, car: 22, fat: 28, sugar: 6 },
                    clock: "13:22",
                    widget: true,
                },
                {
                    userText: "How am I doing today?",
                    aiText: "Here's today so far — protein is on track, sugar is close to the limit.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
            widget: {
                title: "Today",
                goal: "goal 2,000",
                kcalUnit: "kcal",
                protein: "Protein",
                carbs: "Carbs",
                fat: "Fat",
                water: "Water",
                sugar: "Sugar",
                caffeine: "Caffeine",
                hint: "👆 Tap a metric for the meals behind it",
            },
        },
    },

    how: {
        eyebrow: "How it works",
        title: "Three steps. No app to learn.",
        sub: "How AI nutrition tracking works with an MCP server: connect once, describe your meals, and ask for summaries whenever you like.",
        steps: [
            {
                title: "Connect once",
                body: "Add the server to Claude, ChatGPT or any MCP client and sign in with Google or email. It takes under a minute and you never do it again.",
            },
            {
                title: "Just say what you ate",
                body: "Describe it in plain language — or send a photo of your meal, a screenshot from a delivery app, or a barcode (it looks the product up online). Macros logged automatically.",
            },
            {
                title: "Track & review",
                body: "Ask for daily summaries, weekly trends, goal progress, or export everything you've logged as CSV files — completely free.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Quick install",
        title: "Connect to Claude, ChatGPT or Cursor in under a minute.",
        sub: "Add the Nutrition MCP server to your AI client, sign in with Google or an email and password, and start logging meals. Nothing to install, nothing to learn.",
        copyLabel: "Copy",
        copiedLabel: "Copied",
        copyAriaLabel: "Copy server URL",
        bullets: [
            "Works on every Claude and ChatGPT plan",
            "OAuth 2.0 — your client handles the login",
            "Connected in Claude or ChatGPT, it follows you to iOS and Android",
        ],
        otherTabLabel: "Other agents",
        tabsLabel: "Choose your AI client",
        claude: {
            steps: [
                "Open <b>Claude</b> (web or desktop) and click <b>Customize</b> in the top-left corner.",
                "Click <b>Connectors</b>.",
                "Click <b>+</b>, then <b>Add custom connector</b>.",
                "Give it a name, for example <b>Nutrition</b>.",
                "Paste <code>https://nutrition-mcp.com/mcp</code> into the <b>Remote MCP server URL</b> field.",
                "Click <b>Add</b>.",
                "Click <b>Connect</b> — the login page opens; continue with Google or sign in with an email and password.",
                "Done. It works right away and shows up in your iOS and Android apps automatically.",
            ],
            note: "Works on every Claude plan. The free plan allows one connected MCP server at a time.",
        },
        chatgpt: {
            steps: [
                "Open <b>ChatGPT on the web</b> → <b>Settings</b> → <b>Apps</b>.",
                "Click <b>Create app</b> at the bottom of the popup. If you don't see it, turn on <b>Developer mode</b> in <b>Advanced settings</b>.",
                "Give it a name, for example <b>Nutrition</b>.",
                "For <b>Connection</b>, paste <code>https://nutrition-mcp.com/mcp</code>.",
                "For <b>Authentication</b>, choose <b>OAuth</b> — leave everything else as it is.",
                "Click <b>Create</b>, then <b>Sign in with Nutrition</b>.",
            ],
            note: "Works on every ChatGPT plan.",
        },
        other: {
            noteHtml:
                "Add the config above to your client (Cursor, VS Code, Claude Code, and more). Windsurf uses <code>serverUrl</code> instead of <code>url</code>. In Claude Code, run <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Your client handles the OAuth login automatically.",
        },
    },

    onboarding: {
        title: "Set up in your first five minutes.",
        sub: "No settings screens. Timezone, calorie and macro goals, widget language — each one is a sentence you say once.",
        stepLabel: "Step {n}",
        justSay: "Just say ",
        steps: [
            {
                title: "Set your timezone",
                body: "So days roll over at your local midnight, not somebody else's.",
                say: "Set my timezone to New York",
            },
            {
                title: "Set your goals",
                body: "Daily calories, macros and water, plus an optional target weight.",
                say: "Set my daily goal to 2,000 calories and 150 g of protein",
            },
            {
                title: "Pick a widget language",
                body: "The language the in-chat widgets use — not what the AI writes back.",
                say: "Show my widgets in German",
            },
            {
                title: "Start logging",
                body: "Say what you ate, send a photo, or scan a barcode.",
                say: "I had oatmeal with berries for breakfast",
            },
        ],
    },

    examples: {
        title: "Talking beats tapping.",
        sub: "Log a meal, scan a barcode, review your week — real conversations with real in-chat widgets. Flip through a few.",
        status: "Nutrition · connected",
        prevLabel: "Previous",
        nextLabel: "Next",
        pickerLabel: "Choose an example",
        slides: [
            {
                title: "Log a meal",
                sub: "Plain words, no database",
                userText:
                    "I had oatmeal with berries and a coffee for breakfast",
                aiText: "Logged breakfast — about 320 kcal, 11 g protein. Coffee added 95 mg of caffeine.",
            },
            {
                title: "Scan a barcode",
                sub: "Open Food Facts, scaled to your portion",
                userText: "Scan this barcode: 5449000000996",
                aiText: "That's a 330 ml Coca-Cola — 139 kcal, 35 g sugar, from Open Food Facts. How much did you have?",
            },
            {
                title: "Review the week",
                sub: "Trends widget, right in the chat",
                userText: "How did last week look?",
                aiText: "You averaged 2,035 kcal a day across 6 logged days — 165 under your target. Protein was your steadiest macro.",
                widget: {
                    title: "Trends",
                    sub: "7 days",
                    big: "2,035",
                    cap: "daily avg · 6 logged days",
                    from: "1 Sep",
                    goal: "goal 2,200",
                    today: "Today",
                },
            },
        ],
    },

    live: {
        eyebrow: "Live · everyone, so far",
        title: "Breakfast somewhere, dinner somewhere else.",
        sub: "Live nutrition stats across every Nutrition MCP account — calories, food logs, macros and weight lost — refreshed every five seconds.",
        unitGroupLabel: "Units",
        unitMetricLabel: "Metric",
        unitImperialLabel: "Imperial",
        refreshBefore: "Refreshes every 5 s · next in ",
        refreshAfter: "s",
        sinceOpenLabel: "since you opened this page",
        cards: {
            calories: "Calories logged",
            foodLogs: "Food logs",
            protein: "Protein logged",
            carbs: "Carbs logged",
            fat: "Fat logged",
            weightLost: "Weight lost since July 2, 2026",
            water: "Water logged",
        },
        foodLogsUnit: "logs",
        timezonesAfter:
            " timezones · days roll over at each person's own midnight",
        mapNote: "dot size = share of accounts · hover a dot",
        mapAriaLabel:
            "Dot-grid world map of Nutrition MCP accounts by timezone; larger dots mean a larger share",
    },

    support: {
        eyebrow: "Always free",
        title: "Free nutrition tracking. No premium tier. Not ever.",
        sub: "Every tool, every widget, every export — for everyone, at no cost. It's one person's open-source project, and the code is MIT-licensed so it stays that way.",
        bullets: [
            "All 36 tools and six widgets included",
            "No ads, no upsells, no locked features",
            "Export or delete your data any time",
            "Self-host it if you'd rather — Dockerfile included",
        ],
        patreon: {
            eyebrow: "Optional · Patreon",
            title: "If it earns its keep, help keep the server on.",
            sub: "The only cost is hosting and the database. Patrons cover it — any amount, cancel any time. Nothing unlocks; you just get the build notes first and a say in what ships next.",
            cta: "Support on Patreon",
            starCta: "Star instead",
        },
        postsTitle: "Latest posts on Patreon",
        postsAll: "All posts",
        postLinkLabel: "Read on Patreon",
    },

    contact: {
        eyebrow: "Contact",
        title: "Say hello.",
        sub: "Found a bug, have an idea, or did it get a meal completely wrong? Email me directly — I read every message.",
        emailAriaLabel: "Email anton@nutrition-mcp.com",
        cards: {
            email: { title: "Email", sub: "Anything — the direct line" },
            issues: {
                title: "GitHub issues",
                sub: "Bugs and feature requests, in public",
            },
            patreon: {
                title: "Patreon",
                sub: "Build notes, votes and patron chat",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Questions about Nutrition MCP.",
        subBefore:
            "What it is, where it works, what it costs, and who sees your data. Anything missing? ",
        subLink: "Ask me directly",
        subAfter: ".",
        categoriesLabel: "Filter questions by category",
        categories: {
            all: "All",
            basics: "Basics",
            clients: "Clients",
            tracking: "Tracking",
            data: "Your data",
        },
    },
    faq: [
        // Basics
        {
            question: "What is Nutrition MCP?",
            visibleHtml:
                "A free, open-source MCP (Model Context Protocol) server for nutrition tracking. Connect it to Claude, ChatGPT, Cursor or any MCP client and log meals, calories, macros, water and weight by talking.",
            category: "basics",
        },
        {
            question: "What is an MCP server?",
            visibleHtml:
                "A small service your AI can call while you chat. Nutrition MCP gives Claude, ChatGPT, Cursor and friends 36 nutrition tools — logging, goals, trends, import and export. You never see the tools; you just talk.",
            category: "basics",
        },
        {
            question: "Is Nutrition MCP free?",
            visibleHtml:
                "Yes. No premium tier, no ads, no locked features. You only need a Claude or ChatGPT account to connect. Patreon donations cover the server bill.",
            category: "basics",
        },
        // Clients
        {
            // The visible answer now states the server URL itself, so the
            // JSON-LD answer no longer needs the override the old page
            // carried; stripping tags gives the same sentence.
            question: "Does it work with ChatGPT?",
            visibleHtml:
                "Yes. In ChatGPT on the web, open Settings → Apps → Create app, paste <code>https://nutrition-mcp.com/mcp</code> with OAuth authentication and sign in. Every ChatGPT plan works.",
            category: "clients",
        },
        {
            question: "Does it work with Cursor, VS Code or Claude Code?",
            visibleHtml:
                "Yes — any client that supports remote MCP servers over HTTP. Add the URL to your <code>mcp.json</code>, or in Claude Code run <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "Does it work on my phone?",
            visibleHtml:
                "Yes. Connect it once in Claude or ChatGPT on the web or desktop and it appears in their iOS and Android apps automatically.",
            category: "clients",
        },
        // Tracking
        {
            // Kept from the previous landing page verbatim: test-pinned
            // (src/site-copy.test.ts checks that caffeine is named "in
            // milligrams" here and that the JSON-LD answer matches).
            question: "What can I track?",
            visibleHtml:
                "Calories, protein, carbohydrates, fat, fiber, total sugar, and water for every entry — described in plain language or pulled from a product barcode via Open Food Facts. Caffeine is tracked too, in milligrams, the unit every label uses, and it adds no calories. Alcohol is tracked as well, in grams of pure ethanol, once you switch it on. You can also log your body weight in kg or lb and track trends toward a target weight. View daily summaries, query meals by date range, update or delete past entries, set goals, and monitor trends over time.",
            category: "tracking",
        },
        {
            question: "How accurate is the calorie tracking?",
            visibleHtml:
                "Figures are estimates from what you describe, the way a knowledgeable friend would estimate them — good for trends, not for medical decisions. Barcode scans use Open Food Facts data.",
            category: "tracking",
        },
        {
            question: "Does it track alcohol?",
            visibleHtml:
                "Only if you turn it on. Alcohol tracking is off by default; switched on, drinks are recorded as grams of ethanol and shown as US standard drinks or UK units.",
            category: "tracking",
        },
        // Your data
        {
            // The closing sentence is pinned by src/site-copy.test.ts: the
            // export takes everything out, but only meals come back in.
            question: "Can I import my MyFitnessPal or Cronometer history?",
            visibleHtml:
                "Yes. Import meal history from MyFitnessPal, Cronometer, Lose It!, MacroFactor, or any CSV by mapping its columns — up to 50 rows per call. Meals are the only part that can be imported back in for now.",
            category: "data",
        },
        {
            // Must name meals, water, weight, goals and profile — the five
            // files in the export archive (src/site-copy.test.ts).
            question: "Who can see my data, and can I export it?",
            visibleHtml:
                "Only you. Export everything — meals, water, weight, goals, profile — as a ZIP of CSV files with a 60-minute download link, or delete your account outright. MIT-licensed, so you can also self-host.",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "Can I self-host it?",
            visibleHtml:
                'Yes. Nutrition MCP is open source (MIT). You can run your own instance with your own Supabase project — the <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub repository</a> includes a full self-hosting guide and a Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Your next meal is one sentence away.",
        sub: "Free, open-source nutrition tracking for Claude, ChatGPT and Cursor — and your data is yours to export or delete whenever you like.",
        primary: "Connect now",
        secondary: "Star on GitHub",
    },
};

export const INDEX: Partial<Record<SiteLocale, IndexDoc>> = {
    en: INDEX_EN,
    de: INDEX_DE,
    es: INDEX_ES,
    fr: INDEX_FR,
    nl: INDEX_NL,
    pl: INDEX_PL,
    it: INDEX_IT,
    uk: INDEX_UK,
    ja: INDEX_JA,
};

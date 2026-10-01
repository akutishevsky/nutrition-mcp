// Typed content for the landing page (public/index.html), rendered by
// scripts/gen-index.ts. English and every translation go through the same
// generator, so a hand-authored English page can never drift from the
// generated translations (see CLAUDE.md's "Public site" section, and
// src/copy/legal.ts for the pattern this follows).
//
// Plain text everywhere except the fields documented as trusted HTML
// (`install.claude.steps`, `install.chatgpt.steps`, `install.other.note`,
// `why.noteHtml` and `faq[].visibleHtml`): developer-authored constants, not
// visitor input, so the generator inserts them unescaped. Every other field is
// run through esc() on the way out.
//
// The demo conversations (the hero's replaying chat and the ten example
// slides) are STRUCTURED: one field per message, so a translation edits words
// and never markup. Their shape — which turn is a photo, where a widget card
// sits, which tools a slide lists — is structure, copied verbatim by every
// locale; the generator draws the cards, the photos and every widget label
// (those come from WIDGET_STRINGS in src/copy/widgets.ts, already translated)
// and owns every number on a card.
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

/** One FAQ entry. `visibleHtml` is what a human reads in the <details>
 * (trusted HTML). `jsonLdText` is optional: when omitted, the generator
 * derives the JSON-LD `Answer.text` by stripping tags out of `visibleHtml`,
 * which is exactly right for every answer whose only markup is an inline link
 * whose surrounding words already read as one sentence. One English entry
 * carries an override because its visible answer deliberately omits the
 * server URL (stated elsewhere on the page) that a search engine reading the
 * answer standalone needs — see "Does it work with ChatGPT?". */
export interface FaqEntry {
    question: string;
    visibleHtml: string;
    jsonLdText?: string;
}

/** A card in the "What you can track" grid. Its icon and colour are the
 * generator's (FEATURE_META in scripts/gen-index.ts, matched by index), not
 * copy. */
export interface FeatureCard {
    title: string;
    body: string;
}

/** Count-sensitive word forms, picked with Intl.PluralRules in the browser.
 * `few` / `many` only where the language has them (pl, uk). */
export interface PluralWord {
    one: string;
    other: string;
    few?: string;
    many?: string;
}

/** The widget card a hero exchange's tool call returns, shown right after its
 * reply: log_meal's meal-logged card, get_nutrition_summary's day, or
 * get_weight_trends' chart. */
export type HeroCardKind =
    "meal-logged" | "nutrition-summary" | "weight-trends";

/** One exchange in the hero's chat: what the user sends, the AI's reply, and
 * the card that reply comes with, if any. */
export interface HeroExchange {
    /** What the user typed — or, on a `photo` exchange, the caption sent with
     * the picture. */
    userText: string;
    /** Structural: copy verbatim. The exchange opens with a photo (the
     * breakfast, drawn inline and named by `hero.chat.photoAlt`) instead of a
     * typed message. */
    photo?: true;
    aiText: string;
    /** Structural: copy verbatim. The card this exchange's tool call
     * returns, shown after its reply. Every figure on it is the generator's;
     * the reply quotes them, so a translation keeps the numbers as written. */
    card?: HeroCardKind;
    /** The meal this exchange logged — the description as it would be
     * STORED, not the sentence the user typed. Set on every exchange that
     * logs a meal, in order: the meal-logged card's header names its own, and
     * the nutrition-summary card lists them all as the day's meal rows
     * (scripts/landing-cards.ts checks they match its breakfast, lunch and
     * snack). `type` is the server's enum: copy it verbatim. */
    meal?: {
        description: string;
        type: "breakfast" | "lunch" | "dinner" | "snack";
    };
}

/** Which example a slide is. A key, not copy: it names the slide's icon,
 * colour and tool chips in EX_META (scripts/gen-index.ts), and every locale
 * lists the same ids in the same order as English. */
export type ExampleSlideId =
    | "log-meal"
    | "photo-meal"
    | "scan-barcode"
    | "goals-progress"
    | "review-week"
    | "weight-trend"
    | "meal-patterns"
    | "track-drinks"
    | "import-history"
    | "export-data";

/** The picture a user sends in a photo turn, drawn inline by the generator
 * (no image file). `meal` is the borscht lunch, `package` the barcode on the
 * can. */
export type ExamplePhoto = "meal" | "package";

/** A file an ai reply hands over, drawn by the generator as a download chip
 * under the reply: a zip icon, the archive's real file name and
 * `examples.downloadExpires`. A picture of the link, never a working one. */
export type ExampleDownload = "export-zip";

/** One bubble of an example conversation, in the order it is shown. `from`,
 * `photo` and `download` are STRUCTURE — copy them verbatim; `text` is the
 * only translated field. A photo turn is always the user's; its `text` is
 * the caption sent with the picture, and the picture's accessible name comes
 * from `examples.photoMealAlt` / `photoPackageAlt`. */
export type ExampleMessage =
    | { from: "user"; text: string; photo?: undefined }
    | { from: "user"; photo: ExamplePhoto; text: string }
    | { from: "ai"; text: string; download?: ExampleDownload };

/** The widgets an example slide can show. */
export type ExampleWidget =
    | "trends"
    | "meal-logged"
    | "goal-progress"
    | "weight-trends"
    | "import-meals";

/** One widget card in an example conversation. Every field is structural:
 * copy it verbatim. */
export interface ExampleCardRef {
    kind: ExampleWidget;
    /** Index into `messages` of the ai reply the card follows. */
    after: number;
    /** Which importer screen; set exactly when `kind` is `import-meals`.
     * Only the first screen ("file") is drawn on this page. */
    step?: "file";
}

/** One slide of the examples carousel: the left column (tinted icon, `title`
 * as the slide's heading, `description`, then the MCP tools the conversation
 * calls, each chip followed by its `toolNotes` line) and the right column (a
 * chat window holding `messages` and the widget cards in `cards`). */
export interface ExampleSlide {
    /** Structural: copy verbatim. */
    id: ExampleSlideId;
    /** Short, e.g. "Log in plain words". Also the tab button's accessible
     * name, so keep it to a few words. */
    title: string;
    description: string;
    /** One line per MCP tool this slide's conversation calls, keyed by the
     * tool's name: exactly the tools EX_META (scripts/gen-index.ts) lists for
     * `id`. The KEYS are structure — copy them verbatim; only the values
     * translate. Each value is plain text printed under that tool's chip. */
    toolNotes: Record<string, string>;
    messages: ExampleMessage[];
    /** Structural: copy verbatim. Absent on a slide with no card. */
    cards?: ExampleCardRef[];
    /** The meal a meal-logged card names in its header, as log_meal would
     * STORE it ("Oatmeal with milk and blueberries (1 bowl) and black coffee
     * (1 cup)"). Translated: it is the user's own food. One entry per
     * meal-logged card, in order; absent on every other slide. */
    cardMeals?: string[];
}

export interface IndexDoc {
    title: string;
    metaDescription: string;
    ogDescription: string;
    keywords: string;

    hero: {
        /** The h1 is `titleBeforeEm` + <em>`titleEm`</em> + `titleAfterEm`;
         * keep the surrounding spaces inside the outer two. */
        titleBeforeEm: string;
        titleEm: string;
        titleAfterEm: string;
        lead: string;
        ctaPrimary: string;
        ctaSecondary: string;
        /** The link under the chat demo, down to the examples. */
        moreExamples: string;
        chat: {
            /** Accessible name of the breakfast photo the first exchange
             * sends. Describe what the photo shows. */
            photoAlt: string;
            /** Accessible names of the demo's pause/play toggle (WCAG 2.2.2 —
             * the replay starts on its own and runs longer than 5 s) and of
             * the button that replays it once it has finished. */
            pauseLabel: string;
            replayLabel: string;
            /** The conversation, in order. Every locale has the same
             * exchanges with the same structure — `photo`, `card` and
             * `meal.type` are copied verbatim; only the words translate. */
            exchanges: HeroExchange[];
        };
    };

    how: {
        title: string;
        /** 3 cards. */
        steps: { title: string; body: string }[];
        /** "{n} / 3" — the generator substitutes {n}. */
        counter: string;
    };

    install: {
        title: string;
        sub: string;
        /** aria-label of the copy button on the server-URL pill. */
        copyAriaLabel: string;
        /** Accessible name of the Claude / ChatGPT / Other tab set. */
        tabsLabel: string;
        claude: {
            /** Plain-text label of the button linking to the Claude directory
             * listing (CLAUDE_DIRECTORY_URL in scripts/gen-index.ts); the steps
             * that follow pick up on the directory page it opens. */
            cta: string;
            /** Trusted HTML: <strong> around on-screen UI labels. */
            steps: string[];
            /** Plain text. The generator wraps the server URL in <code>
             * wherever it appears, so keep the URL verbatim. */
            note: string;
        };
        /** Trusted HTML: <strong> around UI labels, <code> around the URL. */
        chatgpt: { steps: string[] };
        /** Trusted HTML: <code> around config keys and the command. */
        other: { note: string };
        /** The third install-tab's visible label ("Other agents") — unlike
         * the "Claude"/"ChatGPT" brand-name tabs it is ordinary descriptive
         * text, so it translates. */
        otherTabLabel: string;
    };

    onboarding: {
        title: string;
        sub: string;
        /** The muted lead-in of each card's quote box, trailing space
         * included: the generator renders `justSay` + “`say`”. */
        justSay: string;
        /** 4 cards, rendered as <b>`title`</b> — `body`. `say` is the bare
         * sentence; the generator adds the locale's quotation marks. */
        steps: { title: string; body: string; say: string }[];
        note: string;
        toolsCta: { heading: string; body: string; arrow: string };
    };

    examples: {
        title: string;
        sub: string;
        /** aria-labels of the round prev/next buttons. */
        prevLabel: string;
        nextLabel: string;
        /** aria-label of the icon tab row, e.g. "Pick an example". */
        pickerLabel: string;
        /** aria-label of the carousel region, e.g. "Examples". */
        carouselLabel: string;
        /** Accessible name of each chat window's scrolling conversation. */
        threadLabel: string;
        /** Small heading over the secondary tool chips, e.g. "Also uses". */
        moreToolsLabel: string;
        /** Accessible name of every tool chip, which links to that tool on
         * the tools page. {tool} is the bare tool name the chip shows and must
         * stay in the label verbatim (WCAG 2.5.3 Label in Name). */
        toolLinkLabel: string;
        /** Accessible names of the two photo-turn pictures. */
        photoMealAlt: string;
        photoPackageAlt: string;
        /** The note on the download chip, e.g. "Expires in 60 minutes". Keep
         * the 60: it is export_all_data's real link lifetime. */
        downloadExpires: string;
        /** 10 slides, in English's order (see ExampleSlide.id). */
        slides: ExampleSlide[];
    };

    stats: {
        title: string;
        sub: string;
        /** The translated word the live-status node (#facts-live, visually
         * hidden) starts with; the landing script appends " · <time>" once
         * the first figures arrive. */
        liveLabel: string;
        /** The Metric / Imperial toggle. `unitMetricLabel` /
         * `unitImperialLabel` are the visible button texts. `unitKgLabel` /
         * `unitLbLabel` are their accessible names: each must START with its
         * button's visible text (WCAG 2.5.3 Label in Name) and contain the
         * Latin symbol "kg" / "lb" (src/site-copy.test.ts). `unitGroupLabel`
         * names the pair. */
        unitGroupLabel: string;
        unitMetricLabel: string;
        unitImperialLabel: string;
        unitKgLabel: string;
        unitLbLabel: string;
        /** "Refreshes every 5 s · next in {n}s" split around the countdown —
         * `refreshBefore` keeps its trailing space, `refreshAfter` follows the
         * digit directly. */
        refreshBefore: string;
        refreshAfter: string;
        /** "since you opened this page" — the elapsed time follows after
         * " · ". */
        sinceOpenLabel: string;
        /** The calories tile's label. It is also read into the odometer's
         * accessible name (the .odo-cap contract in
         * src/landing-script.test.ts). */
        calCaption: string;
        /** The other six tiles' labels. `weightLost` names the date the
         * weight log went live; keep it. */
        cards: {
            foodLogs: string;
            protein: string;
            carbs: string;
            fat: string;
            weightLost: string;
            water: string;
        };
        /** The word after a food-log delta: "+1 log", "+3 logs". */
        foodLogsUnit: PluralWord;
        /** "{n} timezones · days roll over…" — the text after the number. The
         * generator emits <b>{n}</b> immediately followed by this string, so
         * it carries its own leading space where the language puts one. */
        timezonesAfter: string;
        /** Mono note beside the timezone count. */
        mapNote: string;
        mapAriaLabel: string;
        /** Privacy line under the map: only totals are published, never one
         * person's data. */
        foot: string;
    };

    features: {
        title: string;
        /** 9 cards; icon + colour by index (FEATURE_META). */
        cards: FeatureCard[];
    };

    why: {
        title: string;
        sub: string;
        oldHeading: string;
        oldItems: string[];
        newHeading: string;
        newItems: string[];
        /** Trusted HTML — contains a link to /alternatives marked with
         * data-link="alternatives" for the generator to localize. */
        noteHtml: string;
    };

    /** The four trust tiles under the comparison: bold `label`, then
     * `small`. */
    trust: { label: string; small: string }[];

    support: {
        title: string;
        sub: string;
        updatesTitle: string;
        /** The small badge beside updatesTitle, e.g. "Free". */
        updatesBadge: string;
        /** Reassurance that reading these posts costs nothing. */
        updatesNote: string;
        /** aria-labels of the posts pager. updatesDotLabel is a bare noun
         * ("Update"), suffixed client-side with " 1", " 2", … per page. */
        updatesPrevLabel: string;
        updatesNextLabel: string;
        updatesDotLabel: string;
        /** The link line at the foot of each post card. */
        postLinkLabel: string;
        free: { tier: string; price: string; desc: string; cta: string };
        /** `price` renders as the paid card's heading. */
        paid: { tier: string; price: string; desc: string; cta: string };
    };

    /** `secondary` ("Star on GitHub") also labels the paid card's GitHub
     * button. */
    cta: {
        title: string;
        sub: string;
        primary: string;
        secondary: string;
    };

    contact: {
        title: string;
        sub: string;
        cta: string;
    };

    faqSection: {
        title: string;
    };
    faq: FaqEntry[];
}

const INDEX_EN: IndexDoc = {
    title: "Nutrition MCP — Calorie & Macro Tracker for Claude & ChatGPT",
    metaDescription:
        "Log meals, calories and macros by talking to Claude or ChatGPT. A free, open-source MCP server with barcode lookup, weight tracking and full data export.",
    ogDescription:
        "Log meals, calories and macros by talking to Claude or ChatGPT. A free, open-source MCP server with barcode lookup, weight tracking and full data export.",
    keywords:
        "nutrition tracker, meal tracker, MCP server, Claude AI, ChatGPT, calorie counter, macro tracker, barcode scanner, food logging, diet tracker, weight tracker, weight log, AI nutrition, Model Context Protocol",

    hero: {
        titleBeforeEm: "Track your nutrition by ",
        titleEm: "talking",
        titleAfterEm: " to your AI.",
        lead: "Connect Claude or ChatGPT, then just say what you ate. Calories and macros, logged automatically.",
        ctaPrimary: "Quick install",
        ctaSecondary: "Support",
        moreExamples: "More examples",
        chat: {
            photoAlt:
                "Photo: a smoothie bowl topped with banana, berries and granola, with an americano beside it",
            pauseLabel: "Pause demo",
            replayLabel: "Replay demo",
            exchanges: [
                {
                    photo: true,
                    userText: "breakfast + americano",
                    aiText: "A smoothie bowl, homemade by the look of it. You've had it two ways: with granola and honey, or just fruit. Which is this?",
                },
                {
                    userText: "granola and honey, a full spoon",
                    aiText: "Got it. And the americano: single or double, any milk?",
                },
                {
                    userText: "double, splash of oat milk",
                    aiText: "So: the bowl with a handful of granola and 1 tbsp honey, and a double americano with a splash of oat milk. About 480 kcal and 21 g protein. Log it?",
                },
                {
                    userText: "yes",
                    aiText: "Logged breakfast: 480 kcal, 21 g protein and 126 mg caffeine. Sugar is already at 51 of your 60 g limit.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 bowl: Greek yogurt, banana, berries) with granola (1 handful) and honey (1 tbsp); americano (double shot) with a splash of oat milk",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "lunch: leftover stir fry from last night, same portion. and a 500 ml bottle of water",
                    aiText: "Logged lunch, same as last night: 620 kcal and 54 g protein, plus 500 ml of water.",
                    meal: {
                        description:
                            "Leftover stir fry (1 portion, same as last night)",
                        type: "lunch",
                    },
                },
                {
                    userText: "snack: stole 6 of my kid's fries. don't judge",
                    aiText: "No judgment. About 50 kcal, logged as a snack.",
                    meal: {
                        description: "Fries (6, from my kid's plate)",
                        type: "snack",
                    },
                },
                {
                    userText: "what's left for dinner?",
                    aiText: "850 kcal and 84 g of protein to go. Sugar is at 59 of your 60 g limit.",
                    card: "nutrition-summary",
                },
                {
                    userText: "and how's my weight doing?",
                    aiText: "Down 1.4 kg since 11 Feb, from 80.2 to 78.8 kg. 3.8 kg to go to your 75 kg target.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Three steps. No app to learn.",
        steps: [
            {
                title: "Connect once",
                body: "Works with any AI client that supports remote MCP servers — Claude, ChatGPT, and more. No install, no API keys.",
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

    install: {
        title: "Connect in under a minute",
        sub: "Works with any MCP client that supports OAuth 2.0 with PKCE. On first connect you create an account with Google or an email and password; sign in the same way to keep your data.",
        copyAriaLabel: "Copy server URL",
        tabsLabel: "Choose your AI client",
        claude: {
            cta: "Add to Claude",
            steps: [
                "On the directory page, click <strong>Connect</strong>, then continue with Google or sign in with an email and password.",
                "Done. It works right away and shows up in your iOS and Android apps automatically.",
            ],
            note: "Works on every Claude plan, the free one included. To add it by hand instead, use Customize → Connectors → Add custom connector with https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Open <strong>ChatGPT on the web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Click <strong>Create app</strong> at the bottom of the popup. If you don't see it, turn on <strong>Developer mode</strong> in <strong>Advanced settings</strong>.",
                "Give it a name, for example <strong>Nutrition</strong>.",
                "For <strong>Connection</strong>, paste <code>https://nutrition-mcp.com/mcp</code>.",
                "For <strong>Authentication</strong>, choose <strong>OAuth</strong> — leave everything else as it is.",
                'Check <strong>"I understand and want to continue"</strong>.',
                "Click <strong>Create</strong>.",
                "Click <strong>Sign in with Nutrition</strong> — the login page opens; continue with Google or sign in with an email and password.",
                "Done. It works right away and shows up in your iOS and Android apps automatically.",
            ],
        },
        other: {
            note: "Add the config above to your client (Cursor, VS Code, Claude Code, and more). Windsurf uses <code>serverUrl</code> instead of <code>url</code>. In Claude Code, run <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Your client handles the OAuth login automatically.",
        },
        otherTabLabel: "Other agents",
    },

    onboarding: {
        title: "Set up once — or just start talking",
        sub: "This is completely optional — Nutrition MCP works the moment you connect. If you want, these three quick steps make it more accurate, but you can skip straight to logging.",
        justSay: "Just say ",
        steps: [
            {
                title: "Set your timezone",
                body: "so days roll over at your local midnight and today's totals stay accurate wherever you are.",
                say: "Set my timezone to New York",
            },
            {
                title: "Set your goals",
                body: "daily calorie, macro, and water targets, plus an optional target weight and your preferred weight unit (kg or lb), to track your progress against.",
                say: "Set my daily goal to 2,000 calories and 150g of protein",
            },
            {
                title: "Set your language",
                body: "the language in-chat widgets (dashboards, charts) are shown in, not what the AI writes back to you.",
                say: "Show my widgets in German",
            },
            {
                title: "Start logging",
                body: "just say what you ate, send a photo or scan a barcode. That's it.",
                say: "I had oatmeal with berries for breakfast",
            },
        ],
        note: "Everything here is optional. You can do it now, later, or never — just start logging and set these whenever you like.",
        toolsCta: {
            heading: "Curious what it can actually do?",
            body: "Browse all 36 tools — logging, barcodes, water, weight, goals, and trends — with a description and an example prompt for each.",
            arrow: "Explore the tools",
        },
    },

    examples: {
        title: "Just talk to it.",
        sub: "A few of the things you can do — just by talking.",
        prevLabel: "Previous example",
        nextLabel: "Next example",
        pickerLabel: "Pick an example",
        carouselLabel: "Examples",
        threadLabel: "Conversation",
        moreToolsLabel: "Also uses",
        toolLinkLabel: "{tool} on the Tools page (opens in a new tab)",
        photoMealAlt:
            "Photo: a bowl of borscht with a spoonful of sour cream and dill, and a slice of rye bread beside it",
        photoPackageAlt:
            "Photo: the barcode on a can of Coca-Cola, number 5449000000996",
        downloadExpires: "Expires in 60 minutes",
        slides: [
            {
                id: "log-meal",
                title: "Log in plain words",
                description:
                    "Say it the way you'd tell a friend. If the portion or which meal it was is missing, it asks before estimating. Fiber and sugar go on every entry, caffeine on anything that has some, and “this morning” lands in your timezone.",
                toolNotes: {
                    log_meal:
                        "Saves breakfast with macros, fiber, sugar and the coffee's caffeine",
                    log_water:
                        "Records the 500 ml at 07:00 toward today's water total",
                    get_current_time:
                        "Works out today's date so “around 7” lands at 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "oatmeal with blueberries and a coffee for breakfast",
                    },
                    {
                        from: "ai",
                        text: "How big was the bowl, and was the oatmeal made with milk or water? Anything in the coffee?",
                    },
                    {
                        from: "user",
                        text: "normal bowl, made with milk. coffee was black",
                    },
                    {
                        from: "ai",
                        text: "Logged breakfast: about 320 kcal, 11 g protein and 6 g fiber. The coffee puts you at 95 mg of your 400 mg caffeine limit.",
                    },
                    {
                        from: "user",
                        text: "oh and i drank like half a liter of water around 7, before my run",
                    },
                    {
                        from: "ai",
                        text: "Added 500 ml of water at 07:00 this morning.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Oatmeal with milk and blueberries (1 bowl) and black coffee (1 cup)",
                ],
            },
            {
                id: "photo-meal",
                title: "Snap your plate",
                description:
                    "A photo starts a conversation, not a guess. It asks whether the meal was homemade or from a restaurant, checks your past logs for what the photo can't show, asks how much you ate in plain measures, and logs only once you approve the summary.",
                toolNotes: {
                    search_meals:
                        "Finds your earlier borscht at Tsybulya and what was in it",
                    log_meal:
                        "Logs it with the restaurant's name, once you say yes",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "lunch",
                    },
                    {
                        from: "ai",
                        text: "Looks like borscht with sour cream and a slice of rye bread. Homemade, or from a restaurant? If it was a restaurant, which one?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, on Podil in Kyiv",
                    },
                    {
                        from: "ai",
                        text: "You've logged borscht at Tsybulya twice before, both times the beef version with sour cream. Same again? And did you finish the bowl and the bread?",
                    },
                    {
                        from: "user",
                        text: "same, all of it, bread too",
                    },
                    {
                        from: "ai",
                        text: "So: beef borscht with sour cream (1 bowl, finished) and rye bread (1 slice) at Tsybulya, Podil, Kyiv. About 520 kcal and 24 g protein, estimated, not published figures. Log it as lunch?",
                    },
                    {
                        from: "user",
                        text: "yes",
                    },
                    {
                        from: "ai",
                        text: "Logged lunch: 520 kcal · 24 g protein · 43 g carbs · 27 g fat · 7 g fiber · 10 g sugar.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Beef borscht with sour cream (1 bowl, finished) and rye bread (1 slice) at Tsybulya, Podil, Kyiv",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scan a barcode",
                description:
                    "Photograph the package: the digits under the barcode are looked up in Open Food Facts, and it asks how much you had. Open Food Facts carries no caffeine, so that comes from the label or typical amounts; a missing fiber or sugar figure is estimated rather than left blank.",
                toolNotes: {
                    lookup_barcode:
                        "Pulls the can's label figures from Open Food Facts",
                    log_meal:
                        "Logs the whole can with lunch, caffeine included",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "had this with lunch. how bad is it really?",
                    },
                    {
                        from: "ai",
                        text: "That's a 330 ml can of Coca-Cola: 139 kcal and 35 g of sugar, per Open Food Facts. Did you have the whole can?",
                    },
                    {
                        from: "user",
                        text: "whole can",
                    },
                    {
                        from: "ai",
                        text: "Logged with lunch: 139 kcal, 35 g sugar, and 33 mg caffeine from the can's label, since Open Food Facts doesn't list caffeine. As for how bad: that sugar is over half your 60 g daily limit on its own, and Open Food Facts rates it Nutri-Score E and NOVA 4, ultra-processed.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: ["Coca-Cola (330 ml can)"],
            },
            {
                id: "goals-progress",
                title: "Set goals, check in",
                description:
                    "Set targets to reach, like calories and protein, and limits to stay under for sugar, alcohol and caffeine; only what you mention changes. Then ask about any day to see each figure against its goal, and what's left to go.",
                toolNotes: {
                    set_nutrition_goals:
                        "Saves calorie and protein targets and a 400 mg caffeine limit",
                    get_goal_progress:
                        "Shows today against each goal and what's left to go",
                },
                messages: [
                    {
                        from: "user",
                        text: "trying to lean out a bit. set me at 2000 cals and 160g protein. also what's a sane caffeine cap? i basically live on coffee",
                    },
                    {
                        from: "ai",
                        text: "For healthy adults, EFSA and the FDA put it at up to 400 mg a day, roughly four cups of brewed coffee, and EFSA advises 200 mg in pregnancy. The limit is your call; want 400?",
                    },
                    {
                        from: "user",
                        text: "yeah 400",
                    },
                    {
                        from: "ai",
                        text: "Done: 2,000 kcal and 160 g protein to reach, caffeine under 400 mg. Everything else stays as it was: 220 g carbs, 70 g fat, 30 g fiber, 2.5 L water and your 60 g sugar limit.",
                    },
                    {
                        from: "user",
                        text: "can i still squeeze in dessert tonight?",
                    },
                    {
                        from: "ai",
                        text: "You're at 1,540 kcal and 104 g protein, so 460 kcal and 56 g protein to go. Sugar is the tighter one: 40 of your 60 g limit, so 20 g left. Caffeine is at 130 of 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Review the week",
                description:
                    "Ask how the week went and the trends card opens in the chat with your averages and days logged. Switch between 7, 14 and 30 days or tap a nutrient to chart it, with no new request. It can also tell you your streaks and days on target.",
                toolNotes: {
                    get_trends:
                        "Averages your last 7, 14 and 30 days and opens the trends card",
                },
                messages: [
                    {
                        from: "user",
                        text: "how did the last two weeks go? feels like i've been all over the place",
                    },
                    {
                        from: "ai",
                        text: "Steadier than it feels. You averaged 1,830 kcal a day, 170 under your 2,000, but that counts the one day of the 14 you didn't log as zero. On the 13 days you logged it was about 1,970, with 9 days within 10% of target. And you're on a 10-day logging streak.",
                    },
                    {
                        from: "user",
                        text: "what about sugar?",
                    },
                    {
                        from: "ai",
                        text: "That's the one to watch. It averaged 52 g and went over your 60 g limit on 4 of the 13 days.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Track your weight",
                description:
                    "Log a weigh-in in kg or lb and see the trend under the day-to-day noise: a smoothed average, the change over the month and the gap to your target. An impossible reading, like a missed decimal point, is caught before it's saved.",
                toolNotes: {
                    log_weight:
                        "Turns away 784 kg as implausible, then saves 78.4 kg",
                    get_weight_trends:
                        "Smooths 30 days into moving averages and the gap to target",
                },
                messages: [
                    {
                        from: "user",
                        text: "just weighed in, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg is outside the plausible body-weight range (20–500 kg), so nothing was saved. Did you mean 78.4 kg?",
                    },
                    {
                        from: "user",
                        text: "lol yes, missed the dot. how am i trending?",
                    },
                    {
                        from: "ai",
                        text: "Saved 78.4 kg. You're down 1.8 kg since 11 Feb, about 0.4 kg a week, and your 7-day average is 78.7 kg. 3.4 kg to go to your 75 kg target.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Spot your patterns",
                description:
                    "Ask when you eat more and it compares your own logs: weekdays with weekends, days with and without breakfast, big lunches, early dinners with late ones. It flags unusual days too, and reports patterns, not causes.",
                toolNotes: {
                    get_meal_patterns:
                        "Compares breakfast, dinner-time and weekend days over 30 days",
                },
                messages: [
                    {
                        from: "user",
                        text: "do i eat more on days i skip breakfast? feels like it",
                    },
                    {
                        from: "ai",
                        text: "A little, yes. You logged 28 of the last 30 days and skipped breakfast on 6. Those days averaged 2,215 kcal, against 1,940 on the 22 days with breakfast, and about 35 g less protein.",
                    },
                    {
                        from: "user",
                        text: "what about late dinners? on gym days i don't eat till 9",
                    },
                    {
                        from: "ai",
                        text: "Those stand out too: the 9 days with dinner at 8 pm or later averaged 2,165 kcal, against 1,920 on the other 19. Both are patterns in your log, not proof either one causes it.",
                    },
                    {
                        from: "user",
                        text: "and weekends?",
                    },
                    {
                        from: "ai",
                        text: "Barely different: weekends average 2,010 kcal and weekdays 1,993.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Track drinks too",
                description:
                    "Alcohol stays hidden until you switch tracking on. Pick US standard drinks or UK units, and each drink is worked out as grams of alcohol from its size and strength. Switching it off later hides alcohol again; it doesn't delete it.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Turns alcohol on, shown in grams alongside UK units",
                    log_meal:
                        "Works out the pint's alcohol from its size and strength",
                },
                messages: [
                    {
                        from: "user",
                        text: "can you count my drinks too? trying to cut back a bit",
                    },
                    {
                        from: "ai",
                        text: "Sure. Should I show alcohol as US standard drinks or UK units?",
                    },
                    {
                        from: "user",
                        text: "uk units, i'm in manchester",
                    },
                    {
                        from: "ai",
                        text: "Alcohol tracking is on, in grams alongside UK units.",
                    },
                    {
                        from: "user",
                        text: "had a pint of lager with dinner",
                    },
                    {
                        from: "ai",
                        text: "What strength was it? Lagers usually run 4 to 5%, and the tap or can will say.",
                    },
                    {
                        from: "user",
                        text: "4% i think",
                    },
                    {
                        from: "ai",
                        text: "Logged with dinner: a 568 ml pint at 4% is 17.9 g of alcohol, 2.3 UK units, about 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Bring your history",
                description:
                    "Moving from MyFitnessPal, Cronometer, Lose It! or MacroFactor? The importer opens in the chat, reads and maps your export in the browser, saves nothing until you confirm a preview, and doesn't double a meal if you import the same file again with the same timezone. It flags a missing timezone before you start.",
                toolNotes: {
                    start_meal_import:
                        "Opens the in-chat importer for your export file",
                    set_timezone:
                        "Sets America/Chicago so meals land in local time",
                },
                messages: [
                    {
                        from: "user",
                        text: "switching over from myfitnesspal. can you bring my food log across? i've got the export",
                    },
                    {
                        from: "ai",
                        text: "The importer is open below. One thing before you pick the file: your account has no timezone set, so times would be read as UTC. Where are you based?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Set to America/Chicago. Now pick the Nutrition-Summary CSV from your MyFitnessPal export. It's read right in your browser, and nothing is saved until you confirm the preview.",
                    },
                    {
                        from: "user",
                        text: "it matched the columns but food name says not in this file?",
                    },
                    {
                        from: "ai",
                        text: "That's normal for MyFitnessPal: its export has one row per meal per day, with the totals but no food names. Each meal gets labelled by its meal type instead, with its calories and macros intact.",
                    },
                    {
                        from: "user",
                        text: "603 meals. it says they'll go in at noon?",
                    },
                    {
                        from: "ai",
                        text: "Right, the export has dates but no meal times, so each one is placed at local noon. That keeps every meal on the right day in Chicago; you just won't see when you actually ate.",
                    },
                    {
                        from: "user",
                        text: "done! did everything make it?",
                    },
                    {
                        from: "ai",
                        text: "All of it: 603 meals imported and none failed.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Take your data",
                description:
                    "One request packs everything stored about you — meals, water, weigh-ins, goals, profile settings, your account record, usage telemetry and app connections — into a ZIP of CSV files with a README. Timestamps use your timezone, and meals.csv imports straight back in.",
                toolNotes: {
                    export_all_data:
                        "Zips eight CSV files and a README behind a 60-minute link",
                },
                messages: [
                    {
                        from: "user",
                        text: "my dietitian wants to see my food log. can you get it out as a spreadsheet?",
                    },
                    {
                        from: "ai",
                        text: "Here you go: one ZIP with 1,204 meals, 318 water entries and 64 weight entries, plus your goals, profile settings, account details, tool-usage telemetry and app connections. Your food log is meals.csv inside, which opens in Excel or Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "can i just send her the link?",
                    },
                    {
                        from: "ai",
                        text: "Better to download it and send her the file. The link stops working after 60 minutes, and anyone who has it can open your whole export — weight, account details and settings included, not just meals.",
                    },
                    {
                        from: "user",
                        text: "good to know. could i restore from it later if i needed to?",
                    },
                    {
                        from: "ai",
                        text: "Your meals, yes. meals.csv uses the importer's own column names, so it goes straight back in, and meals already in your log are recognised and skipped, so nothing doubles. The other files are for your records only; they can't be imported back.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Breakfast somewhere, dinner somewhere else.",
        sub: "Live nutrition stats across every Nutrition MCP account — calories, food logs, macros and weight lost — refreshed every five seconds.",
        liveLabel: "Live",
        unitGroupLabel: "Units",
        unitMetricLabel: "Metric",
        unitImperialLabel: "Imperial",
        unitKgLabel: "Metric (kg)",
        unitLbLabel: "Imperial (lb)",
        refreshBefore: "Refreshes every 5 s · next in ",
        refreshAfter: "s",
        sinceOpenLabel: "since you opened this page",
        calCaption: "Calories logged",
        cards: {
            foodLogs: "Food logs",
            protein: "Protein logged",
            carbs: "Carbs logged",
            fat: "Fat logged",
            weightLost: "Weight lost since July 2, 2026",
            water: "Water logged",
        },
        foodLogsUnit: { one: "log", other: "logs" },
        timezonesAfter:
            " timezones · days roll over at each person's own midnight",
        mapNote: "dot size = share of profiles",
        mapAriaLabel:
            "World map of the timezones set in profiles, each shown once at least three profiles use it",
        foot: "Totals across every account, updated as meals are logged. Individual data is never shown.",
    },

    features: {
        title: "What you can track",
        cards: [
            {
                title: "Meals in plain language",
                body: "Describe what you ate — your AI estimates calories, protein, carbs, fat, fiber, total sugar, and caffeine in milligrams and logs it.",
            },
            {
                title: "Scan a barcode",
                body: "Snap or type a product barcode and pull macros, fiber, and sugar from Open Food Facts, scaled to how much you ate.",
            },
            {
                title: "Goals & progress",
                body: "Set daily calorie, macro, fiber, and water targets — plus sugar, caffeine, and alcohol limits to stay under — and check live progress toward them.",
            },
            {
                title: "Summaries & trends",
                body: "Daily and weekly breakdowns, 7/14/30-day trends, streaks, and recurring meal patterns.",
            },
            {
                title: "Water logging",
                body: "Track hydration in milliliters alongside your meals and review it by day.",
            },
            {
                title: "Weight tracking",
                body: "Log your body weight in kg or lb, see 7/14/30-day trends, and track progress toward a target weight.",
            },
            {
                title: "Timezone-aware",
                body: "Days roll over in your local time, wherever you are in the world.",
            },
            {
                title: "Import from another app",
                body: "Bring your meal history over from MyFitnessPal, Cronometer, Lose It!, or MacroFactor — or any other CSV, by mapping its columns yourself. You confirm what gets added before anything is saved.",
            },
            {
                title: "Export & own your data",
                body: "Take everything we store about you — meals, water, weight, goals, and profile, plus your account record, usage telemetry, and connected apps — as one ZIP of CSV files. Meals are the only part that can be imported back in for now. Delete your account and data whenever you want.",
            },
        ],
    },

    why: {
        title: "Talking beats tapping.",
        sub: "Snap a barcode or just say what you ate — no database digging, no separate app to open.",
        oldHeading: "Traditional apps",
        oldItems: [
            "Search a database for every item",
            "Fix wrong database entries by hand",
            "Yet another app to open, often behind a paywall",
            "Tedious manual logging",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Describe meals in plain language",
            "Calories & macros estimated for you",
            "Works inside Claude or ChatGPT, free",
            "Ask for trends, summaries, and goals",
        ],
        noteHtml:
            'Switching from a specific app? See how Nutrition MCP compares to <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer, and other trackers</a>.',
    },

    trust: [
        {
            label: "Private by default",
            small: "Never sold, shared or used for ads.",
        },
        { label: "Open source", small: "Audit or self-host it." },
        {
            label: "Export anytime",
            small: "Everything we store, as CSV in one ZIP.",
        },
        { label: "Delete instantly", small: "Remove your account & data." },
    ],

    support: {
        title: "Help keep it running.",
        sub: "Nutrition MCP is free and ad-free. Patreon covers the server and database bills.",
        updatesTitle: "Latest from Patreon",
        updatesBadge: "Free",
        updatesNote: "Free to read — no membership needed.",
        updatesPrevLabel: "Previous update",
        updatesNextLabel: "Next update",
        updatesDotLabel: "Update",
        postLinkLabel: "Read on Patreon",
        free: {
            tier: "Free member",
            price: "$0",
            desc: "Follow along — get news and updates about the server, new tools, and what's coming next.",
            cta: "Follow on Patreon",
        },
        paid: {
            tier: "Paid member",
            price: "Pay what you want",
            desc: "If Nutrition MCP is useful to you, you can help with its hosting and database costs. Everyone gets the same features, supporters included, and it stays free for all.",
            cta: "Become a supporter",
        },
    },

    cta: {
        title: "Start tracking in under a minute.",
        sub: "Free and open source — it works with the AI you already use.",
        primary: "Quick install",
        secondary: "Star on GitHub",
    },

    contact: {
        title: "Questions or feedback?",
        sub: "Found a bug, want a feature, or just have a question? Email me directly — I read every message.",
        cta: "Send an email",
    },

    faqSection: {
        title: "Frequently asked questions",
    },
    faq: [
        {
            question: "What is Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP is a free, open-source Model Context Protocol (MCP) server that turns Claude, ChatGPT or another MCP client into a calorie and macro tracker. Instead of searching a food database, you tell your AI what you ate and it logs the calories, macros, fiber, sugar and caffeine to your own food diary.",
        },
        {
            question: "What is the Model Context Protocol (MCP)?",
            visibleHtml:
                "The Model Context Protocol is an open standard that lets AI assistants like Claude and ChatGPT connect to external tools and data sources. An MCP server provides specific capabilities — here, nutrition tracking — that the AI can use during a conversation. Think of it as a plugin system for AI assistants.",
        },
        {
            question: "How do I track calories with Claude or ChatGPT?",
            visibleHtml:
                "Connect Nutrition MCP once — in Claude from the connectors directory, in ChatGPT as a custom app with the server URL — and sign in. Then tell your AI what you ate in your own words, show it a photo of the meal, or give it a product barcode. Your AI estimates the calories, protein, carbs, fat, fiber and sugar, and Nutrition MCP saves the entry to your food diary. Ask for today's totals, weekly trends or progress toward your goals at any time.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "Does it work with ChatGPT?",
            visibleHtml:
                "Yes. In ChatGPT on the web, open Settings → Apps, create a custom app with the server URL using OAuth, and sign in. Creating a custom app needs ChatGPT's Developer mode, which OpenAI offers on some ChatGPT plans.",
            jsonLdText:
                "Yes. In ChatGPT on the web, open Settings → Apps, create a custom app with the server URL https://nutrition-mcp.com/mcp using OAuth, and sign in. Creating a custom app needs ChatGPT's Developer mode, which OpenAI offers on some ChatGPT plans.",
        },
        {
            question: "Which other clients are supported?",
            visibleHtml:
                "Any MCP client that supports OAuth 2.0 with PKCE — including Claude.ai, the Claude desktop and mobile apps, Claude Code, Cursor, Windsurf, and VS Code.",
        },
        {
            question: "Can I self-host it?",
            visibleHtml:
                'Yes. Nutrition MCP is open source (MIT). You can run your own instance with your own Supabase project — the <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub repository</a> includes a full self-hosting guide and a Dockerfile.',
        },
        {
            question: "Is Nutrition MCP free?",
            visibleHtml:
                "Yes, it is completely free — no paid tier, no ads, no hidden costs. You need an AI app that supports MCP connectors, such as Claude or ChatGPT, and a free Nutrition MCP account, which you create the first time you connect. Voluntary donations on Patreon help cover server costs and unlock nothing.",
        },
        {
            question: "What can I track?",
            visibleHtml:
                "Calories, protein, carbohydrates, fat, fiber, total sugar, and water for every entry — described in plain language or pulled from a product barcode via Open Food Facts. Caffeine is tracked too, in milligrams, the unit every label uses, and it adds no calories. Alcohol can be tracked as well, in grams of pure ethanol; it is shown once you switch alcohol tracking on. You can also log your body weight in kg or lb and track trends toward a target weight. View daily summaries, query meals by date range, update or delete past entries, set goals, and monitor trends over time.",
        },
        {
            question: "How accurate are the calorie counts?",
            visibleHtml:
                "They are estimates. For a meal you describe or photograph, your AI estimates the figures; for a barcode, they come from the product's label data in Open Food Facts, which your AI scales to how much you had. Either can be wrong, so check anything that matters — you can correct or delete any entry just by asking. Nutrition MCP is a logging tool, not medical or dietary advice: talk to a doctor or dietitian before making decisions about your health, especially if you are pregnant, have a medical condition or a history of disordered eating.",
        },
        {
            question: "Does it track alcohol?",
            visibleHtml:
                "Yes, as an opt-in: alcohol tracking is off by default, and alcohol stays hidden from your meals, goals, and summaries until you switch it on. Then drinks are shown in grams of pure ethanol and as US standard drinks or UK units, whichever you prefer. Nothing infers alcohol for you: it is only recorded from a drink you log or an alcohol column in a file you import, and a drink you log is saved even while tracking is off. Switching it back off hides alcohol again and stops the importer reading alcohol columns — it is not a delete switch, and your export always includes what you logged. To remove an alcohol figure, delete the meal it belongs to.",
        },
        {
            question:
                "Can I import my history from MyFitnessPal or another app?",
            visibleHtml:
                "Yes. Ask to import your history and an importer opens in the chat: you pick the CSV your old app exported, check how its columns map, and see what will be added before confirming. Exports from MyFitnessPal, Cronometer, Lose It!, and MacroFactor are recognised automatically, and any other CSV works by mapping the columns yourself. Your browser reads the file, so the AI never retypes your rows. In clients without in-chat panels you can paste your export instead — and importing the same file again does not create duplicates, as long as your timezone hasn't changed in between.",
        },
        {
            question: "Is my data private?",
            visibleHtml:
                'Your logs are stored in the EU and linked to your own account, which you reach through the AI apps you connect. Nutrition MCP never sells your data, never shares it with third parties and never uses it for advertising; the home page shows only anonymous site-wide totals. Whatever your AI reads through the tools is sent to that AI\'s provider under your own agreement with them. You can export everything we store about you, or delete your account and all its data, at any time — the <a href="/privacy" data-link="privacy">privacy policy</a> has the details.',
        },
    ],
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

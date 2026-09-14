// Typed content for the landing page (public/index.html and every
// public/{locale}/index.html), rendered by scripts/gen-index.ts. English and
// every translation go through the same generator instead of a hand-authored
// English file sitting next to generated ones (see CLAUDE.md's "Public site"
// section, and src/copy/legal.ts for the pattern this follows).
//
// This is the 6a "Dawn" landing page: the hero with its auto-playing chat,
// How it works, Connect (the tabbed install card), the first-five-minutes
// onboarding rail, the Examples carousel, the Live stats board with the
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
// (`HeroExchange.add`) and clock strings. The deltas are the same in every
// locale, so a locale file copies them verbatim; they are read at BUILD
// time, where scripts/gen-index.ts turns the thread as it stood at each
// exchange that names a `card` into that tool's real payload (log_meal's,
// get_nutrition_summary's, get_weight_trends') and renders the real card
// from it. The clock rides on the markup as data-clock and drives the
// replay script.
//
// THE CARDS THEMSELVES CARRY NO COPY FROM THIS FILE. Every word on the
// hero's cards and the examples' cards — the title, the
// metric names, the units, the averaging label, the date range, the days
// logged caption, the tap hint, the settings note — comes from
// WIDGET_STRINGS (src/copy/widgets.ts), the same dictionary the in-chat
// widgets read, and is translated once there for both. This file used to
// hand-translate seventeen of those strings per locale and they had
// already drifted from the widget's own: "Kohlenhydrate" against the
// widget's deliberately abbreviated "Kohlenh.", 糖類 against 糖質, fr and
// uk thousands separators typed with the wrong codepoint. Do not
// reintroduce them.
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

/** The widget card a hero exchange's tool call returns, shown right after its
 * reply: log_meal's meal-logged card, get_nutrition_summary's day, or
 * get_weight_trends' chart. */
export type HeroCardKind =
    "meal-logged" | "nutrition-summary" | "weight-trends";

/** One exchange in the hero's chat: what the user sends, the AI's reply, and
 * the card that reply comes with, if any. */
export interface HeroExchange {
    /** What the user typed — or, on a `photo` exchange, the caption sent
     * with the picture. */
    userText: string;
    /** Structural: copy verbatim. The exchange opens with a photo (the
     * breakfast, drawn inline and named by `hero.chat.photoAlt`) instead of
     * a typed message. */
    photo?: true;
    aiText: string;
    /** Nutrient deltas this exchange logs. Numbers, never copy — identical in
     * every locale. They sit on the exchange whose tool call wrote them: the
     * "yes" that confirms a meal, not the photo that opened the interview. */
    add: Partial<{
        kcal: number;
        pro: number;
        car: number;
        fat: number;
        water: number;
        sugar: number;
        caf: number;
        fib: number;
    }>;
    /** Clock shown in the chat header while this exchange plays, e.g.
     * "08:40". */
    clock: string;
    /** Structural: copy verbatim. The card this exchange's tool call returns,
     * brought in after its reply. Its figures come from the thread's own
     * `add` deltas (the weight chart's from src/copy/widget-demo.ts), and the
     * reply quotes the ones it states — src/widget-card.test.ts pins both. */
    card?: HeroCardKind;
    /** The meal this exchange logged, as the cards' drawers show it.
     *
     * Set it on an exchange whose `add` is food; leave it off for one that
     * is not (the questions, the closing ones), or the drawer grows a row
     * reading zero under every metric. `description` is the
     * meal as it would be STORED — not the sentence the user typed, though
     * they are usually close — and is the only string on the hero's cards that
     * this file supplies; `type` is the server's own enum, not copy, and
     * is never translated (mealTypeLabel in shared/macros.js does that). */
    meal?: {
        description: string;
        type: "breakfast" | "lunch" | "dinner" | "snack";
    };
}

/** Which example a slide is. A key, not copy: it names the slide's icon,
 * tint and tool chips in EX_META (scripts/gen-index.ts), and every locale
 * lists the same ids in the same order as English (src/landing-script.test.ts
 * pins it, and the generator refuses to build a page that does not). */
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
 * (no image file). `meal` is a plate snapshot, `package` the barcode label. */
export type ExamplePhoto = "meal" | "package";

/** One bubble of an example conversation, in the order it is shown.
 *
 * `from` and `photo` are STRUCTURE — a translation copies them verbatim, so
 * every locale has the same sequence of user / ai / photo turns. `text` is
 * the only translated field. A photo turn is always the user's; its `text`
 * is the optional caption sent with the picture ("Lunch"), and the picture's
 * accessible name comes from `examples.photoMealAlt` / `photoPackageAlt`. */
export type ExampleMessage =
    | { from: "user"; text: string; photo?: undefined }
    | { from: "user"; photo: ExamplePhoto; text?: string }
    | { from: "ai"; text: string; download?: ExampleDownload };

/** A file an ai reply hands over, drawn by the generator as a download chip
 * under the reply's words: a zip icon, the file's real name and
 * `examples.downloadExpires`. Structural — copy it verbatim. `export-zip` is
 * export_all_data's archive, whose signed link lasts 60 minutes. The chip is
 * a picture of that link, never a working one: no href, nothing to click. */
export type ExampleDownload = "export-zip";

/** The importer's four screens, in order (IMPORT_STEPS in
 * src/widget-static.ts). */
export type ExampleImportStep = "file" | "map" | "preview" | "done";

/** One real widget card in an example conversation. Every field is
 * structural: copy it verbatim. */
export interface ExampleCardRef {
    /** Which in-chat widget. Only a tool that declares a widget in src/mcp.ts
     * gets one (log_meal and update_meal: meal-logged; get_goal_progress,
     * get_trends, get_weight_trends; start_meal_import: import-meals). */
    kind: ExampleWidget;
    /** The index into `messages` of the ai reply the card follows: the reply
     * of the turn whose tool call returned it, or — for an importer screen
     * the user reached by clicking inside the widget — the reply before that
     * click. Cards sharing one `after` are shown in array order. */
    after: number;
    /** Which importer screen; set exactly when `kind` is `import-meals`. */
    step?: ExampleImportStep;
}

/** One slide of the examples carousel: the left column (tinted icon, `title`
 * as the slide's <h3>, `description`, then the list of MCP tools the
 * conversation calls, each chip followed by its `toolNotes` line) and the right
 * column (a chat window holding `messages` and, on eight slides, the real
 * widget cards its tool calls return, each after its message — `cards`). The icon, tint and tool names are EX_META's in
 * scripts/gen-index.ts, keyed by `id` — structural, never translated, and
 * written once for all nine locales rather than once per locale. */
export interface ExampleSlide {
    /** Structural: copy verbatim. */
    id: ExampleSlideId;
    /** Short, e.g. "Log in plain words". Also the selected tab's label, so
     * keep it to a few words. */
    title: string;
    /** Two or three plain sentences under the title (~200–240 characters)
     * saying what the conversation shows AND what a visitor would not guess
     * from it: that it asks before estimating, what it checks first, what it
     * guarantees ("nothing is saved until you confirm a preview"). Every
     * claim must hold for the server's tool descriptions and instructions in
     * src/mcp.ts, not just for this demo conversation. */
    description: string;
    /** One line per MCP tool this slide's conversation calls, keyed by the
     * tool's name: exactly the tools EX_META (scripts/gen-index.ts) lists
     * for `id`, no more and no fewer. The KEYS are structure — copy them
     * verbatim; only the values translate. Rows render in EX_META's order,
     * not this record's, so key order is not checked. Each value is
     * printed as plain text right after that tool's chip and says what the
     * tool did in THIS conversation ("Records the 500 ml at 07:00 toward
     * today's water total"), not what it does in general. Keep it to about
     * 60 characters and never repeat the tool name: on a phone every line
     * here adds height to every slide, because the tallest one sets them
     * all. The type cannot catch a missing key; the generator's assert and
     * src/landing-script.test.ts are the guard, refusing a missing, extra
     * or empty note. */
    toolNotes: Record<string, string>;
    /** The conversation, user and ai alternating as a chat would. */
    messages: ExampleMessage[];
    /** Structural: copy verbatim, array and every field. The real in-chat
     * widget cards this conversation's tool calls return, if any, each after
     * the ai reply it follows (log-meal's card follows the breakfast reply,
     * and the water logged after it returns none; import-history shows the
     * importer's four screens along the conversation). The cards carry no
     * copy from this file except `cardMeals`: every word on them is
     * WIDGET_STRINGS', and their figures are src/copy/widget-demo.ts's. The
     * replies quote the cards' figures wherever they state them
     * (src/widget-card.test.ts). Absent on a slide with no card. */
    cards?: ExampleCardRef[];
    /** The meals the card lists, as they would be STORED by log_meal — the
     * description, not the sentence the user typed, with household measures
     * in brackets ("Oatmeal with berries (1 bowl) and coffee (1 cup)").
     * Translated: they are the user's own text, shown in the card's header
     * and drawer. One entry on a meal-logged card; four on the goal-progress
     * card, in eating order (breakfast, lunch, an afternoon flat white,
     * dinner — DEMO_GOAL_PROGRESS_MEALS in src/copy/widget-demo.ts). Absent
     * on every other slide. */
    cardMeals?: string[];
}

/** The widgets an example slide can show. */
export type ExampleWidget =
    | "trends"
    | "meal-logged"
    | "goal-progress"
    | "weight-trends"
    | "import-meals";

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
            /** Accessible name of the breakfast photo the first exchange
             * sends, e.g. "Photo: a smoothie bowl …". Keep it to what the
             * drawing shows: the reply has to ask what it cannot. */
            photoAlt: string;
            /** Accessible name of the pause/play toggle in the chat header
             * (WCAG 2.2.2 — the replay auto-starts and runs longer than
             * 5 s). One constant name; aria-pressed carries the state. */
            pauseLabel: string;
            /** Accessible name of the replay button that takes the pause
             * button's slot once the thread has played through; it starts
             * the thread again from the first exchange. */
            replayLabel: string;
            /** The conversation, in order; the replay plays it once. Every
             * locale has the same exchanges with the same structure — `photo`,
             * `card`, `add`, `clock` and `meal.type` are copied verbatim, and
             * only the words translate. */
            exchanges: HeroExchange[];
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
        /** Each slide's chat-window header, e.g. "Nutrition · connected". */
        status: string;
        /** aria-labels of the round prev/next buttons in the bar above the
         * slides. */
        prevLabel: string;
        nextLabel: string;
        /** aria-label of the tab row above the slides, e.g. "Choose an
         * example". */
        pickerLabel: string;
        /** aria-label of the carousel region, e.g. "Example
         * conversations". */
        carouselLabel: string;
        /** Each slide's aria-label, e.g. "{n} of {total}" — the generator
         * substitutes both. Spoken, not shown (the bar's "01 / 03" counter
         * is the visible position). A screen reader hears it as "1 of 3,
         * slide", so it must read as a position, not a title. */
        slideLabel: string;
        /** The aria-roledescription values of the carousel region and of each
         * slide — what a screen reader says in place of "region" / "tab
         * panel". Lower-case common nouns in the page's language ("carousel",
         * "slide"); they are spoken, never shown. */
        carouselRole: string;
        slideRole: string;
        /** Small heading over the secondary rows of a slide's tool list, e.g.
         * "Also uses" — the primary tool's row sits above it, with the plug
         * icon. Not shown on a slide that calls a single tool. */
        moreToolsLabel: string;
        /** Accessible name of every examples tool chip, which links to that
         * tool's card on the tools page. {tool} is the bare tool name the chip
         * shows (log_meal), and must stay in the label verbatim so the spoken
         * name contains the visible one (WCAG 2.5.3); put it first where the
         * language allows. */
        toolLinkLabel: string;
        /** Accessible names of the two photo-turn pictures, e.g. "Photo: a
         * bowl of borscht…". Read by a screen reader in place of the
         * drawing, so describe what the photo shows, not the drawing. */
        photoMealAlt: string;
        photoPackageAlt: string;
        /** Accessible name of each chat window's scrolling conversation, e.g.
         * "Conversation". The thread is a keyboard-focusable region (it
         * scrolls inside a fixed-height window), so it needs a name; the
         * slide around it already says which example it is. */
        threadLabel: string;
        /** Accessible names of the importer screens on the import-history
         * slide, one per screen. Each is a still picture (its controls do
         * nothing on this page), so say what that screen shows, e.g. "Step 2
         * of 4: the file's columns matched automatically". Keep the figures
         * (603, 322,343) in the page's own number format. */
        importerAlt: Record<ExampleImportStep, string>;
        /** The visible caption under the first importer screen, telling a
         * pointer or touch user these are pictures rather than controls (the
         * drop zone and buttons still look clickable), and that in chat they
         * are one card updating in place. Hidden from assistive tech, which
         * gets importerAlt. */
        importerCaption: string;
        /** The note on an ai reply's download chip (ExampleMessage.download),
         * beside a clock icon, e.g. "Expires in 60 minutes". Keep the 60 as
         * digits: it is export_all_data's real link lifetime. */
        downloadExpires: string;
        /** 10 slides, in English's order (see ExampleSlide.id); eight carry
         * real in-chat widget cards (ExampleSlide.cards). */
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
        /** The map tooltip's second line, under the timezone name. `{share}`
         *  is substituted with that zone's share of all profiles, already
         *  formatted as a percent in the page's own language ("18%", "18 %",
         *  "<1%" for anything rounding below one — see timezoneShares() in
         *  src/supabase.ts for why the tail is bucketed rather than exact). */
        mapShare: string;
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
            photoAlt:
                "Photo: a smoothie bowl topped with banana, berries and granola, with an americano beside it",
            pauseLabel: "Pause the demo",
            replayLabel: "Replay the demo",
            exchanges: [
                // A photo opens an interview, one question per message, and
                // nothing is logged until the summary gets a yes — the photo
                // flow src/mcp.ts's instructions require.
                {
                    photo: true,
                    userText: "breakfast + americano",
                    aiText: "A smoothie bowl, homemade by the look of it. You've had it two ways: with granola and honey, or just fruit. Which is this?",
                    add: {},
                    clock: "08:40",
                },
                {
                    userText: "granola and honey, a full spoon",
                    aiText: "Got it. And the americano: black, or with milk?",
                    add: {},
                    clock: "08:40",
                },
                {
                    userText: "a splash of oat milk",
                    aiText: "So: the bowl with a handful of granola and 1 tbsp honey, and an americano with a splash of oat milk. About 480 kcal and 21 g protein. Log it as breakfast?",
                    add: {},
                    clock: "08:41",
                },
                // 150 g Greek yogurt, a banana, 100 g berries, 30 g granola,
                // 1 tbsp honey (17 g sugar on its own), a double-shot
                // americano (150 mg) and 30 ml oat milk.
                {
                    userText: "yes",
                    aiText: "Logged breakfast: 480 kcal, 21 g protein and 150 mg caffeine. It carries 51 g of sugar, 17 g of it from the honey.",
                    add: {
                        kcal: 480,
                        pro: 21,
                        car: 85,
                        fat: 9,
                        fib: 9,
                        sugar: 51,
                        caf: 150,
                    },
                    clock: "08:41",
                    meal: {
                        description:
                            "Smoothie bowl (Greek yogurt, banana, berries) with granola (1 handful) and honey (1 tbsp); americano with a splash of oat milk",
                        type: "breakfast",
                    },
                    card: "meal-logged",
                },
                {
                    userText:
                        "leftover stir fry from last night, same portion. and a 500 ml bottle of water",
                    aiText: "Logged lunch, same as last night: 620 kcal and 54 g protein, plus 500 ml of water.",
                    add: {
                        kcal: 620,
                        pro: 54,
                        car: 56,
                        fat: 19,
                        fib: 5,
                        sugar: 8,
                        water: 500,
                    },
                    clock: "12:55",
                    meal: {
                        description:
                            "Chicken stir fry with rice (1 plate, leftovers from last night)",
                        type: "lunch",
                    },
                },
                {
                    userText: "stole 6 of my kid's fries. don't judge",
                    aiText: "No judgment. About 90 kcal, logged as a snack.",
                    add: {
                        kcal: 90,
                        pro: 1,
                        car: 12,
                        fat: 5,
                        fib: 1,
                        sugar: 0,
                    },
                    clock: "16:40",
                    meal: {
                        description: "French fries (6 fries)",
                        type: "snack",
                    },
                },
                {
                    userText: "what's left for dinner?",
                    aiText: "810 kcal, and 84 g of protein still to find. Keep it savory: sugar's already at 59 of your 60 g.",
                    add: {},
                    clock: "19:20",
                    card: "nutrition-summary",
                },
                // The weight card's own figures (src/copy/widget-demo.ts):
                // 80.2 kg on 11 Feb, 78.8 kg on the hero's day, 25 days apart.
                {
                    userText: "and how's my weight doing?",
                    aiText: "Down 1.4 kg since 11 Feb, about 0.4 kg a week. 3.8 kg to go to your 75 kg target.",
                    add: {},
                    clock: "19:21",
                    card: "weight-trends",
                },
            ],
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
        carouselLabel: "Example conversations",
        slideLabel: "{n} of {total}",
        carouselRole: "carousel",
        slideRole: "slide",
        moreToolsLabel: "Also uses",
        toolLinkLabel: "{tool} on the Tools page",
        photoMealAlt:
            "Photo: a bowl of borscht with a spoonful of sour cream and dill, and a slice of rye bread beside it",
        photoPackageAlt:
            "Photo: the barcode on a can of Coca-Cola, number 5449000000996",
        threadLabel: "Conversation",
        importerAlt: {
            file: "The in-chat importer, step 1 of 4: choose your export CSV file, from MyFitnessPal, Cronometer, Lose It! or MacroFactor",
            map: "Step 2 of 4: the file's columns matched automatically; this export has no food names",
            preview:
                "Step 3 of 4: a preview of 603 meals, 322,343 kcal, before anything is saved",
            done: "Step 4 of 4: 603 meals imported",
        },
        importerCaption:
            "The importer's screens in order; in your chat it is one card that updates in place",
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
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Oatmeal with milk and blueberries (1 bowl) and black coffee (1 cup)",
                ],
            },
            {
                id: "photo-meal",
                title: "Snap your plate",
                description:
                    "A photo starts an interview, not a guess. It settles homemade or restaurant, reads the restaurant's menu for what the photo can't show, asks how much you ate, and logs only once you approve the summary.",
                toolNotes: {
                    log_meal:
                        "Logs it with the restaurant's name, once you say yes",
                    search_meals:
                        "Checks whether you've logged a meal there before",
                },
                messages: [
                    { from: "user", photo: "meal", text: "lunch" },
                    {
                        from: "ai",
                        text: "Looks like borscht with sour cream and rye bread, with restaurant plating rather than home. Which place was it, and where?",
                    },
                    { from: "user", text: "Tsybulya, on Podil in Kyiv" },
                    {
                        from: "ai",
                        text: "Found their menu: the borscht is cooked on beef broth with salo (pork fat), which a photo can't show. No calories are listed, so this will be an estimate. Did you finish it?",
                    },
                    { from: "user", text: "all of it, bread too" },
                    {
                        from: "ai",
                        text: "So: beef borscht with sour cream and a slice of rye bread at Tsybulya, Podil, Kyiv, all finished. About 520 kcal and 24 g protein. Log it as lunch?",
                    },
                    { from: "user", text: "yes" },
                    {
                        from: "ai",
                        text: "Logged lunch: 520 kcal · 24 g protein · 43 g carbs · 27 g fat · 7 g fiber · 10 g sugar. Estimated from their menu, not published figures.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: [
                    "Beef borscht (1 bowl, finished) with sour cream and rye bread (1 slice) at Tsybulya, Podil, Kyiv",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scan a barcode",
                description:
                    "Photograph the package: the digits under the barcode are looked up in Open Food Facts, and it asks how much you had. Caffeine, which Open Food Facts lacks, comes from the brand or a web search; missing fiber or sugar is estimated.",
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
                    { from: "user", text: "whole can" },
                    {
                        from: "ai",
                        text: "Logged with lunch: 139 kcal, 35 g sugar, and 33 mg caffeine from Coca-Cola's own figure, since Open Food Facts doesn't list caffeine. As for how bad: that sugar is over half your 60 g daily limit on its own, and Open Food Facts rates it Nutri-Score E and NOVA 4, ultra-processed.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
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
                        text: "EFSA and the FDA put the ceiling for healthy adults at 400 mg a day, roughly four cups of brewed coffee; EFSA advises 200 mg in pregnancy. Want 400 as your limit?",
                    },
                    { from: "user", text: "yeah 400" },
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
                        text: "Yes. You're at 1,540 kcal and 104 g protein, so 460 kcal and 56 g protein to go. Sugar is the tighter one: 40 of your 60 g limit, so Greek yogurt with berries fits better than cake, and it helps with the protein too.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
                cardMeals: [
                    "Greek yogurt with granola and berries (1 bowl)",
                    "Chicken wrap with salad (1 wrap)",
                    "Flat white (1 cup)",
                    "Salmon with rice and broccoli (1 plate)",
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
                    { from: "user", text: "what about sugar?" },
                    {
                        from: "ai",
                        text: "That's the one to watch. It averaged 52 g and went over your 60 g limit on 4 of the 13 days.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Track your weight",
                description:
                    "Log a weigh-in in kg or lb and see the trend under the day-to-day noise: a smoothed average, the change over the month and the gap to your target. An impossible reading, like a missed decimal point, is caught before it's saved.",
                toolNotes: {
                    log_weight:
                        "Saves 78.4 kg and turns away a physically impossible reading",
                    get_weight_trends:
                        "Smooths 30 days into moving averages and the gap to target",
                },
                messages: [
                    { from: "user", text: "just weighed in, 784" },
                    {
                        from: "ai",
                        text: "784 kg is outside what a body can weigh, so I haven't saved it. Did you mean 78.4?",
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
                cards: [{ kind: "weight-trends", after: 3 }],
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
                    { from: "user", text: "and weekends?" },
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
                    "Alcohol tracking stays off until you ask for it. Pick US standard drinks or UK units, and each drink is worked out as grams of alcohol from its size and strength. Switch it off later and it's hidden, never deleted.",
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
                    { from: "user", text: "uk units, i'm in manchester" },
                    {
                        from: "ai",
                        text: "Alcohol tracking is on, in grams alongside UK units.",
                    },
                    { from: "user", text: "had a pint of lager with dinner" },
                    {
                        from: "ai",
                        text: "What strength was it? Lagers usually run 4 to 5%, and the tap or can will say.",
                    },
                    { from: "user", text: "4% i think" },
                    {
                        from: "ai",
                        text: "Logged with dinner: a 568 ml pint at 4% is 17.9 g of alcohol, 2.3 UK units, about 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: ["Lager, 4% (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Bring your history",
                description:
                    "Moving from MyFitnessPal, Cronometer, Lose It! or MacroFactor? It checks your timezone first, your export is mapped in the browser, nothing is saved until you confirm a preview, and importing the same file again never doubles a meal.",
                toolNotes: {
                    start_meal_import:
                        "Opens the in-chat importer for your export file",
                    get_profile: "Spots that no timezone is set yet",
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
                        text: "Yes. One thing first: your timezone isn't set, so imported meals would be placed on UTC time instead of your local time. Where are you based?",
                    },
                    { from: "user", text: "chicago" },
                    {
                        from: "ai",
                        text: "Set to America/Chicago. Now pick the Nutrition-Summary CSV from your MyFitnessPal export in the importer below. It's read right in your browser, and nothing is saved until you confirm the preview.",
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
                        text: "603 meals. it says they'll go in at midday?",
                    },
                    {
                        from: "ai",
                        text: "Right, the export has dates but no meal times. Midday keeps every meal on the right day in Chicago; you just won't see when you actually ate.",
                    },
                    { from: "user", text: "done! did everything make it?" },
                    {
                        from: "ai",
                        text: "All of it: 603 meals imported and none failed.",
                    },
                ],
                cards: [
                    { kind: "import-meals", after: 3, step: "file" },
                    { kind: "import-meals", after: 3, step: "map" },
                    { kind: "import-meals", after: 5, step: "preview" },
                    { kind: "import-meals", after: 7, step: "done" },
                ],
            },
            {
                id: "export-data",
                title: "Take your data",
                description:
                    "One request packs every meal, water entry and weigh-in, plus your goals and settings, into a ZIP of CSV files with a plain-English README. Every timestamp names its timezone, and meals.csv imports straight back in.",
                toolNotes: {
                    export_all_data:
                        "Zips six files and returns a private link that lasts 60 minutes",
                },
                messages: [
                    {
                        from: "user",
                        text: "my dietitian wants to see my food log. can you get it out as a spreadsheet?",
                    },
                    {
                        from: "ai",
                        text: "Here you go: one ZIP with 1,204 meals, 318 water entries and 64 weigh-ins, plus your goals and settings. Your food log is meals.csv inside, which opens in Excel or Google Sheets.",
                        download: "export-zip",
                    },
                    { from: "user", text: "can i just send her the link?" },
                    {
                        from: "ai",
                        text: "Better to download it and send her the file. The link stops working after 60 minutes, and anyone who has it can open your whole export, weight and settings included, not just meals.",
                    },
                    {
                        from: "user",
                        text: "good to know. could i restore from it later if i needed to?",
                    },
                    {
                        from: "ai",
                        text: "Your meals, yes. meals.csv imports straight back in, and any meal you still have is matched by its id and skipped, so nothing doubles. Water, weight, goals and settings are in the ZIP for your records only; they can't be imported back.",
                    },
                ],
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
        mapShare: "{share} of accounts",
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

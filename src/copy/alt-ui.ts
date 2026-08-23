// Translatable *template* prose shared by every /alternatives page —
// distinct from src/copy/alternatives.ts's AppCopy (the per-app blurbs) and
// AltPageMeta (the <title>/description templates). This file is everything
// else scripts/gen-alternatives.ts renders around that per-app content: the
// hero, the feature grid, the install steps, the FAQ question/answer
// templates, section headings, and the closing CTAs — content that is
// identical across all six comparison pages (and the hub) except for the
// `{app}` brand-name placeholder.
//
// This was a real gap, not a stylistic one: AppCopy's translation (see that
// file) covered only the prose that genuinely differs per app. Everything
// here rendered in English even on a fully-translated /de/*-mcp page until
// this file existed, because scripts/gen-alternatives.ts's renderApp/
// renderHub had these strings as JS string literals rather than data.
//
// Fields ending in `Html` (or documented as "raw") are inserted into the
// page WITHOUT escaping — they may contain inline tags (<em>, <strong>) or
// pre-escaped entities (&ldquo;, &amp;) exactly as the original hand-authored
// markup did. A translation MUST preserve every tag and entity verbatim and
// only translate the surrounding natural-language text. Placeholders
// (`{app}`, `{link}`, `{copyUrl}`) are substituted by the generator at
// render time and must also be preserved verbatim, unmoved relative to the
// grammar only if the target language's word order requires it (still must
// resolve to the same substituted meaning).

import type { SiteLocale } from "../routes.js";
import { ALT_UI_DE } from "./alt-ui.de.js";
import { ALT_UI_ES } from "./alt-ui.es.js";
import { ALT_UI_FR } from "./alt-ui.fr.js";
import { ALT_UI_NL } from "./alt-ui.nl.js";
import { ALT_UI_PL } from "./alt-ui.pl.js";
import { ALT_UI_IT } from "./alt-ui.it.js";
import { ALT_UI_UK } from "./alt-ui.uk.js";

export interface AltFeature {
    title: string;
    body: string;
}

export interface AltFaqCopy {
    /** "Does {app} have an MCP server?" */
    mcpQ: string;
    mcpA: string;
    /** "How do I connect {app} to Claude?" */
    connectQ: string;
    connectA: string;
    /** "Is Nutrition MCP a good {app} alternative?" */
    goodAltQ: string;
    goodAltA: string;
    /** "Can I import my {app} data?" — the answer is copy.importFaq, not here. */
    importQ: string;
    readExportQ: string;
    readExportA: string;
    freeQ: string;
    /** Fallback answer when an app's AppCopy has no `freeAnswer` override. */
    freeAFallback: string;
}

export interface AltUiCopy {
    breadcrumbHome: string;
    breadcrumbAlternatives: string;
    /** "Quick install" — reused on the app closing CTA, hub hero, and hub closing CTA. */
    ctaQuickInstall: string;
    /** "Track nutrition inside the AI you already use." — reused on both closing CTAs. */
    ctaClosingTitle: string;
    /** Raw HTML. "{app} is a trademark of its respective owner. …" */
    disclaimerAppHtml: string;
    /** Raw HTML. "{apps}, and other product names are trademarks of their respective owners. …" */
    disclaimerHubHtml: string;

    app: {
        heroEyebrow: string;
        /** Raw HTML: "Looking for a <em>{app} MCP</em> server?" */
        heroTitleHtml: string;
        heroLead: string;
        /** "Connect in under a minute" — reused as the switch section's <h2>. */
        ctaConnect: string;
        ctaSeeComparison: string;

        answerEyebrow: string;
        answerTitle: string;
        /** Raw HTML: contains &ldquo;/&rdquo; and an <em> tag. */
        answerBodyHtml: string;

        insteadEyebrow: string;
        insteadTitle: string;
        features: AltFeature[];

        compareEyebrow: string;
        compareTitle: string;
        /** Raw HTML (may contain &amp;), 4 entries — the Nutrition MCP column. */
        pros: string[];

        movingEyebrow: string;

        importEyebrow: string;
        importSub: string;

        switchEyebrow: string;
        switchSub: string;
        /** Raw HTML, 4 <li> steps. Step 3 contains a literal {copyUrl} placeholder. */
        installSteps: string[];
        /** Raw text with a {link} placeholder the generator replaces with an anchor. */
        installNoteTemplate: string;
        installLinkText: string;
        /** aria-label on the copy-to-clipboard button next to the server URL
         * (installSteps' {copyUrl} slot) — was hardcoded English in
         * scripts/gen-alternatives.ts until a translation review caught it;
         * the equivalent button on the landing page (src/copy/index.ts's
         * install steps) already carries this translation, so reuse the
         * same wording for consistency within a locale. */
        copyUrlAriaLabel: string;

        faqEyebrow: string;
        faqTitleTemplate: string;
        faq: AltFaqCopy;
        importFallbackNote: string;

        ctaClosingSub: string;
        ctaOtherAlternatives: string;
    };

    hub: {
        heroEyebrow: string;
        /** Raw HTML: "Your nutrition app doesn't have an <em>MCP server</em>." */
        heroTitleHtml: string;
        heroLead: string;
        ctaSeeExamples: string;

        appsEyebrow: string;
        appsTitle: string;
        appsSub: string;
        noAppNote: string;
        requestComparisonLinkText: string;

        importEyebrow: string;
        importTitle: string;
        importSub: string;
        /** Raw HTML, 2 paragraphs. */
        importBody: string[];

        ctaSub: string;
        ctaStarGithub: string;
    };
}

export const ALT_UI_EN: AltUiCopy = {
    breadcrumbHome: "Home",
    breadcrumbAlternatives: "Alternatives",
    ctaQuickInstall: "Quick install",
    ctaClosingTitle: "Track nutrition inside the AI you already use.",
    disclaimerAppHtml:
        "{app} is a trademark of its respective owner. Nutrition MCP is an independent, open-source project and is not affiliated with, endorsed by, or sponsored by {app}. Comparisons reflect publicly available information at the time of writing and may change.",
    disclaimerHubHtml:
        "{apps}, and other product names are trademarks of their respective owners. Nutrition MCP is an independent, open-source project and is not affiliated with or endorsed by them. Comparisons reflect publicly available information at the time of writing and may change.",

    app: {
        heroEyebrow: "{app} alternative",
        heroTitleHtml: "Looking for a <em>{app} MCP</em> server?",
        heroLead:
            "{app} doesn't have one — so you can't use it inside Claude or ChatGPT. Nutrition MCP does the same job by conversation, and it's free and open source.",
        ctaConnect: "Connect in under a minute",
        ctaSeeComparison: "See the comparison",

        answerEyebrow: "The short answer",
        answerTitle: "No, {app} has no MCP server.",
        answerBodyHtml:
            "The Model Context Protocol (MCP) is the open standard that lets AI assistants like Claude and ChatGPT connect to outside tools. {app} doesn't publish an MCP server, so there's no official way to log food to it from your AI. If you searched for &ldquo;{app} MCP&rdquo; or &ldquo;connect {app} to Claude,&rdquo; what you're really after is a nutrition tracker that lives <em>inside</em> your AI — that's exactly what Nutrition MCP is.",

        insteadEyebrow: "What you get instead",
        insteadTitle: "The same tracking, just by talking",
        features: [
            {
                title: "Meals in plain language",
                body: "Say &ldquo;oatmeal with banana and peanut butter&rdquo; — your AI estimates calories and macros, fiber, total sugar and caffeine included, and logs it. No database search.",
            },
            {
                title: "Barcode scanning — free",
                body: "Send a product barcode and pull the label macros from Open Food Facts — fiber and sugar too, where the label lists them. No Premium subscription to unlock it.",
            },
            {
                title: "Weight &amp; goals",
                body: "Log body weight in kg or lb, set calorie, macro, fiber, sugar, caffeine, and water goals — fiber a target to reach, sugar and caffeine limits to stay under — and track trends toward a goal weight. Alcohol tracking is there too, opt-in and off unless you turn it on.",
            },
            {
                title: "Summaries &amp; trends",
                body: "Ask for daily totals, weekly trends, streaks, and recurring meal patterns — right in the chat.",
            },
            {
                title: "Import &amp; own your data",
                body: "Import your meal history from another app's CSV export — parsed in your browser, not by the AI. Take everything back out whenever you want: one ZIP with your meals, water, weight, goals and profile as CSV files. Meals are the only part that can be imported back in for now. Or delete your account, just as easily.",
            },
            {
                title: "Open source &amp; free",
                body: "MIT-licensed and self-hostable — no ads, no paywall, no upsell. Audit the code or run your own instance.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        compareTitle: "How they stack up",
        pros: [
            "Built as an MCP server — lives inside Claude &amp; ChatGPT",
            "Describe meals in plain language; calories, macros, fiber, sugar &amp; caffeine estimated for you",
            "Barcode scanning, trends, CSV import &amp; export — all free",
            "No separate app, no ads, open source",
        ],

        movingEyebrow: "Moving from {app}",

        importEyebrow: "Your {app} history",
        importSub:
            "Ask to import and an importer opens right in the chat: pick your export, map the columns, preview what will be added, then confirm. The file is read in your browser — the AI never sees the rows. In clients without in-chat panels, paste your export instead.",

        switchEyebrow: "How to switch",
        switchSub:
            "Works with any MCP client that supports OAuth 2.0 with PKCE. On first connect you create an account with Google or an email and password.",
        installSteps: [
            "Open <strong>Claude</strong> (web or desktop) and click <strong>Customize</strong> → <strong>Connectors</strong>.",
            "Click <strong>+</strong>, then <strong>Add custom connector</strong>, and give it a name like <strong>Nutrition</strong>.",
            "Paste {copyUrl} into the <strong>Remote MCP server URL</strong> field and click <strong>Add</strong>.",
            "Click <strong>Connect</strong>, sign in, and start logging by saying what you ate.",
        ],
        installNoteTemplate:
            "Using ChatGPT or another client instead? The {link} covers ChatGPT, Cursor, VS Code, Claude Code, and more.",
        installLinkText: "full install guide",
        copyUrlAriaLabel: "Copy server URL",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "{app} &amp; MCP questions",
        faq: {
            mcpQ: "Does {app} have an MCP server?",
            mcpA: "No. {app} does not offer a Model Context Protocol (MCP) server, so there is no official way to connect it to Claude, ChatGPT, or other AI assistants. Nutrition MCP is a free, open-source alternative built as an MCP server from the ground up, so you can log meals and macros directly inside your AI.",
            connectQ: "How do I connect {app} to Claude?",
            connectA:
                "There is no official {app} connector for Claude, because {app} has no MCP server or public MCP integration. The closest option is Nutrition MCP, a free MCP server: add https://nutrition-mcp.com/mcp as a custom connector in Claude, sign in, and start logging by conversation.",
            goodAltQ: "Is Nutrition MCP a good {app} alternative?",
            goodAltA:
                "If you want to track calories, macros — fiber, total sugar, and caffeine included — water, and weight without opening a separate app or searching a food database, yes. Instead of tapping through a database, you describe what you ate in plain language, send a photo, or scan a barcode, and your AI logs it — completely free and open source.",
            importQ: "Can I import my {app} data?",
            readExportQ: "Does the AI read my export file when I import?",
            readExportA:
                "Not when the importer opens. It parses the CSV in your browser and shows you what will be added before anything is written: how many meals, the calorie total, anything it had to flag, and the rows themselves — a long file lists the first of them plus a count of the rest rather than every line. Only the rows you confirm are sent, and they go as structured data rather than through the AI's reply, so no row can be mistyped or invented in transit. Each row also carries a content fingerprint, so running the same file again reports those meals as already logged instead of duplicating them. If your client can't display in-chat panels, the fallback is to paste the export — the AI does read it on that path, so prefer the importer when you have the choice.",
            freeQ: "Is Nutrition MCP free?",
            freeAFallback:
                "Yes. Nutrition MCP is completely free with no premium tier, ads, or paywalled features — unlike apps that put some features behind a subscription. You only need a Claude or ChatGPT account to connect.",
        },
        importFallbackNote:
            " In clients without in-chat panels you can paste your export instead.",

        ctaClosingSub:
            "Free and open source — no {app} account, no app to open.",
        ctaOtherAlternatives: "Other alternatives",
    },

    hub: {
        heroEyebrow: "MCP alternatives",
        heroTitleHtml:
            "Your nutrition app doesn't have an <em>MCP server</em>.",
        heroLead:
            "Apps like MyFitnessPal, Cronometer, and Lose It can't connect to Claude or ChatGPT. Nutrition MCP is the free, open-source way to track meals, macros, and weight by talking to your AI.",
        ctaSeeExamples: "See examples",

        appsEyebrow: "Switching from…",
        appsTitle: "Pick your current app",
        appsSub:
            "See how Nutrition MCP compares to the tracker you use today — and how to move your logging, and your existing history, into your AI.",
        noAppNote:
            "Don't see your app? It almost certainly has no MCP server either — Nutrition MCP works the same way regardless of what you're switching from.",
        requestComparisonLinkText: "Request a comparison",

        importEyebrow: "Bringing your history",
        importTitle: "You don't have to start from zero",
        importSub:
            "The usual reason people stay put is the years already logged. Ask to import and an importer opens right in the chat: pick your export, map the columns, preview what will be added, then confirm — or paste the export if your client has no in-chat panels.",
        importBody: [
            "The file is parsed in your browser, not read by the AI — so the rows can't be mistyped on the way in, and you see the exact meals before any of them are written. Exports from MyFitnessPal, Cronometer, Lose It!, and MacroFactor have their columns recognised by name; any other CSV works too, you just point the mapper at each column once. What comes across is the date and time, food, meal, calories, protein, carbs, fat, fiber, total sugar, and caffeine in milligrams — and alcohol as well, if you've switched alcohol tracking on first.",
            "The awkward parts of real export files are handled: DD/MM/YYYY and MM/DD/YYYY dates, energy in kilojoules as well as kilocalories, semicolon-delimited European files whose numbers use comma decimals, quoted fields with line breaks inside them, trailing totals rows, and deleted-row flags. Column headings don't have to be English either — a German export's Kalorien or Ballaststoffe is recognised, and fiber, sugar, and caffeine are matched in Spanish, French, Italian, and Dutch too. Where a file is genuinely ambiguous — 05/06 could be May or June — the importer shows its reading next to a row from your own file and asks you to confirm rather than guessing. And each row carries a content fingerprint, so re-importing the same file reports the meals as already logged instead of duplicating them.",
        ],

        ctaSub: "Free and open source — it works with Claude, ChatGPT, and any MCP client.",
        ctaStarGithub: "Star on GitHub",
    },
};

export const ALT_UI_COPY: Partial<Record<SiteLocale, AltUiCopy>> = {
    en: ALT_UI_EN,
    de: ALT_UI_DE,
    es: ALT_UI_ES,
    fr: ALT_UI_FR,
    nl: ALT_UI_NL,
    pl: ALT_UI_PL,
    it: ALT_UI_IT,
    uk: ALT_UI_UK,
};

export function altUiFor(locale: SiteLocale): AltUiCopy {
    return ALT_UI_COPY[locale] ?? ALT_UI_EN;
}

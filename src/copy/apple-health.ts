// Typed content for /apple-health, the user-facing setup guide for Apple
// Health sync (the Nutrition MCP Health iOS Shortcut), rendered by
// scripts/gen-apple-health.ts. It is the friendly counterpart of the
// maintainer's build sheet, docs/apple-health-shortcut.md: what the user sees
// on the iPhone (sections 3–8 of that sheet), not how the shortcut is built.
//
// Same content model as every other page (see CLAUDE.md, "Public site"): one
// AppleHealthDoc per locale, English here, every other locale in its own
// `apple-health.<locale>.ts` merged into APPLE_HEALTH below.
//
// Trust model, as in src/copy/alt-ui.ts: every field is a developer-authored
// constant. Fields marked RAW HTML are inserted unescaped and may carry
// <strong>, <em> and <code> (and pre-escaped entities); a translation must
// keep every tag and placeholder token ({link}) verbatim. Every other field
// is PLAIN TEXT, escaped at render time. No field may hold a site-relative
// link: plain data has no pathFor(), so the generator builds every internal
// link (privacy policy, /tools troubleshooting anchors) itself.
//
// The copy restates constants from src/health-sync.ts in prose — the shortcut
// name (HEALTH_SYNC_SHORTCUT_NAME), the 05:00 close (HEALTH_SYNC_CLOSE_HOUR),
// the 7-day window (HEALTH_SYNC_WINDOW_DAYS / HEALTH_SYNC_MAX_BACKFILL_DAYS),
// the 8-day record (HEALTH_SYNC_RETENTION_DAYS), the 30-minute connect link
// and the 90/365-day link lifetimes. src/site-copy.test.ts pins them in every
// locale, so changing a constant fails until each translation says so too.
// Never mention "Delete All Data from Shortcuts" except to warn against it.

import type { SiteLocale } from "../routes.js";
import type { HealthSyncField } from "../health-sync.js";
import { APPLE_HEALTH_FR } from "./apple-health.fr.js";
import { APPLE_HEALTH_PL } from "./apple-health.pl.js";
import { APPLE_HEALTH_UK } from "./apple-health.uk.js";
import { APPLE_HEALTH_JA } from "./apple-health.ja.js";
import { APPLE_HEALTH_DE } from "./apple-health.de.js";
import { APPLE_HEALTH_NL } from "./apple-health.nl.js";
import { APPLE_HEALTH_ES } from "./apple-health.es.js";
import { APPLE_HEALTH_IT } from "./apple-health.it.js";

/** One automation trigger card. */
export interface AppleHealthTrigger {
    /** PLAIN TEXT. The trigger as the Automation tab names it. */
    when: string;
    /** PLAIN TEXT. A short tag: "Main", "Morning catch-up", "Optional". */
    tag: string;
    /** RAW HTML. One or two sentences on why. */
    body: string;
}

/** A titled paragraph (the "Everyday use" cards). */
export interface AppleHealthCard {
    /** PLAIN TEXT. */
    title: string;
    /** RAW HTML. */
    body: string;
}

export interface AppleHealthDoc {
    meta: {
        /** PLAIN TEXT. <title> is "{title} — Nutrition MCP". */
        title: string;
        /** PLAIN TEXT. Meta description. */
        description: string;
        /** PLAIN TEXT. og:description / twitter:description. */
        ogDescription: string;
    };
    /** PLAIN TEXT. aria-label of the in-page section links under the hero. */
    tocLabel: string;
    hero: {
        /** PLAIN TEXT. The pill above the title. */
        eyebrow: string;
        /** PLAIN TEXT. The <h1>. */
        title: string;
        /** PLAIN TEXT. What it does, in one or two sentences. */
        lead: string;
        /** PLAIN TEXT. Heading of the "what you'll see" card. */
        seeTitle: string;
        /** RAW HTML. Bullets in that card. */
        seeItems: string[];
        /** PLAIN TEXT. Label above the nutrient chips. */
        nutrientsLabel: string;
        /** PLAIN TEXT. Each nutrient chip, named as Health names the type. */
        nutrients: Record<HealthSyncField, string>;
        /** PLAIN TEXT. Small suffix on the water chip ("if you choose"). */
        waterNote: string;
        /** PLAIN TEXT. The line under the chips saying alcohol is never sent. */
        alcoholNote: string;
    };
    before: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. */
        items: string[];
    };
    install: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. */
        lead: string;
        /** PLAIN TEXT. The install button (shown once the link exists). */
        button: string;
        /** PLAIN TEXT. Shown instead of the button while there is no link. */
        pending: string;
        /** RAW HTML. Replaces `lead` while there is no link, so the page
         * never tells the reader to open a link it doesn't show. */
        leadPending: string;
        /** RAW HTML. Why the shortcut must keep its name. */
        nameNote: string;
    };
    connect: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. Numbered steps. */
        steps: string[];
        /** RAW HTML. The note under the steps. */
        note: string;
    };
    automate: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. */
        lead: string;
        /** PLAIN TEXT. Heading above the trigger cards. */
        triggersLabel: string;
        /** Exactly three, in this order: Health is opened, an alarm is
         * stopped, the charger is connected. The generator pairs each with a
         * fixed icon by index. */
        triggers: [AppleHealthTrigger, AppleHealthTrigger, AppleHealthTrigger];
        /** PLAIN TEXT. Heading above the numbered steps. */
        stepsLabel: string;
        /** RAW HTML. Numbered steps for creating one automation. */
        steps: string[];
        /** RAW HTML. The note under the steps. */
        note: string;
    };
    everyday: {
        /** PLAIN TEXT. */
        title: string;
        /** Four cards: a late addition, a lowered day, the menu, the AI app.
         * The generator pairs each with a fixed icon by index. */
        cards: [
            AppleHealthCard,
            AppleHealthCard,
            AppleHealthCard,
            AppleHealthCard,
        ];
    };
    privacy: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. */
        items: string[];
        /** PLAIN TEXT. Label of the link to the privacy policy. */
        policyLink: string;
    };
    troubleshooting: {
        /** PLAIN TEXT. */
        title: string;
        /** PLAIN TEXT. */
        lead: string;
        /** PLAIN TEXT. The call to action on each card. The card titles are
         * the entries' own questions, read from ToolsDoc.troubleshooting. */
        readMore: string;
    };
    selfHost: {
        /** RAW HTML with a {link} token, replaced by a link to the build
         * sheet on GitHub (which scripts/depersonalize.ts unwraps to text). */
        textHtml: string;
        /** PLAIN TEXT. That link's label. */
        linkText: string;
    };
}

export const APPLE_HEALTH_EN: AppleHealthDoc = {
    meta: {
        title: "Apple Health sync",
        description:
            "Set up the free Nutrition MCP Health shortcut on your iPhone: it copies the daily totals you log by chatting with your AI (calories, protein, carbs, fat, fiber, caffeine and optionally water) into Apple Health.",
        ogDescription:
            "Copy the daily totals you log with your AI into Apple Health, with one free iPhone shortcut.",
    },
    tocLabel: "On this page",
    hero: {
        eyebrow: "Apple Health sync · iPhone",
        title: "Your daily totals, in Apple Health",
        lead: "A free iPhone shortcut copies the totals of each finished day from Nutrition MCP into Apple Health. Your AI app keeps doing the logging; the shortcut only sends days that are over.",
        seeTitle: "What you'll see in Apple Health",
        seeItems: [
            "One entry per nutrient for each finished day, at <strong>12:00</strong>, from <strong>Shortcuts</strong>.",
            "A day is finished at <strong>05:00</strong> the next morning in your timezone, so yesterday arrives after 05:00 today. Today is never there.",
        ],
        nutrientsLabel: "Sent each day",
        nutrients: {
            energy_kcal: "Dietary Energy",
            protein_g: "Protein",
            carbohydrates_g: "Carbohydrates",
            fat_g: "Total Fat",
            fiber_g: "Fiber",
            caffeine_mg: "Caffeine",
            water_ml: "Water",
        },
        waterNote: "if you choose",
        alcoholNote: "Alcohol is never sent.",
    },
    before: {
        title: "Before you start",
        items: [
            "An iPhone with the <strong>Shortcuts</strong> and <strong>Health</strong> apps. Both come with iOS.",
            "A Nutrition MCP account that is already connected to your AI app, such as Claude or ChatGPT. The shortcut signs in with that same account.",
            "Recommended: your timezone on your profile, since it decides where one day ends. Just say <em>&ldquo;set my timezone&rdquo;</em> in chat. If you never set one, the timezone your iPhone reports when you connect is used.",
        ],
    },
    install: {
        title: "Install the shortcut",
        lead: "Open the link on your iPhone and tap <strong>Add Shortcut</strong>. It appears in the Shortcuts app as <strong>Nutrition MCP Health</strong>.",
        button: "Get the shortcut",
        pending: "The shortcut link will be published here soon.",
        leadPending:
            "The shortcut isn't published yet. Once it is, you'll open its link on your iPhone and tap <strong>Add Shortcut</strong>, and it will appear in the Shortcuts app as <strong>Nutrition MCP Health</strong>. The steps below show what comes after that.",
        nameNote:
            "Keep the name exactly <strong>Nutrition MCP Health</strong>. The sign-in page reopens the shortcut by that name, so connecting stops halfway if it is renamed.",
    },
    connect: {
        title: "Connect it",
        steps: [
            "In the Shortcuts app, tap <strong>Nutrition MCP Health</strong> to run it.",
            "Answer two questions: whether to also send <strong>water</strong> (leave it off if your Apple Watch or another app already logs water), and which days to send, <strong>From today</strong> or <strong>Also the last 7 days</strong>.",
            "Safari opens a sign-in page. Sign in with the <strong>same account your AI app uses</strong>. The page shows a notice about connecting Apple Health: only continue if you just started this yourself, from the shortcut on your own iPhone.",
            "When Safari asks whether to open Shortcuts, tap <strong>Open</strong>. The shortcut finishes connecting.",
            "The first time a day is sent, Apple Health asks what Shortcuts may write: turn on <strong>every type</strong> and tap <strong>Allow</strong>. If you chose <strong>Also the last 7 days</strong> and logged meals in them, that happens right away. Otherwise there is nothing to send yet, so after 05:00 tomorrow open the shortcut and tap <strong>Sync now</strong> once to answer it.",
        ],
        note: "The sign-in link works once, for 30 minutes. If it runs out, run the shortcut again. Your first finished day arrives after 05:00 tomorrow; if you chose the last 7 days, those are sent right away.",
    },
    automate: {
        title: "Make it automatic",
        lead: "A shared shortcut can't bring its automations along, so create them once in the <strong>Automation</strong> tab of the Shortcuts app. The first one is the one that matters; the others catch up when you don't open Health.",
        triggersLabel: "When to run it",
        triggers: [
            {
                when: "App → Health → Is Opened",
                tag: "Main",
                body: "Opening Health is exactly when you want it to be up to date.",
            },
            {
                when: "Alarm → Is Stopped",
                tag: "Morning catch-up",
                body: "An alarm stopped after 05:00, such as your wake-up alarm, sends yesterday as soon as it is finished.",
            },
            {
                when: "Charger → Is Connected",
                tag: "Optional",
                body: "Plugging in at night or at your desk is one more chance to sync.",
            },
        ],
        stepsLabel: "For each one",
        steps: [
            "In the Shortcuts app, open the <strong>Automation</strong> tab and tap <strong>+</strong> to create a personal automation.",
            "Pick the trigger, for example <strong>App</strong> → <strong>Health</strong> → <strong>Is Opened</strong>.",
            "Choose <strong>Run Immediately</strong>, and turn <strong>Notify When Run</strong> off if your iPhone offers it.",
            "Add the action <strong>Run Shortcut</strong>, pick <strong>Nutrition MCP Health</strong>, and set its input to the text <code>auto</code>.",
        ],
        note: "The <code>auto</code> input keeps automatic runs quiet: they only notify you when something needs your attention. No exact time is needed: every sync looks back over the last 7 finished days, so a missed morning catches up by itself.",
    },
    everyday: {
        title: "Everyday use",
        cards: [
            {
                title: "Forgot to log something?",
                body: "Add it in chat as usual. If its day was already sent and is within the last 7 days, the next sync tops the day up with a small extra entry at 12:01, 12:02 and so on. Changes under about 20 kcal or 2 g are skipped; a very large jump, or a change after 9 top-ups, comes as a notification to enter by hand instead.",
            },
            {
                title: "Deleted or lowered a meal?",
                body: "Apple Health can add to a value but can't lower one, so you get a notification saying how much the day is now too high. To fix it, open Health → <strong>Browse</strong> → <strong>Nutrition</strong>, pick the type, tap <strong>Show All Data</strong> and swipe left on that day's entries from Shortcuts to delete them, then enter the correct total from the notification by hand. Never use <strong>Delete All Data from Shortcuts</strong>: it also removes what your other shortcuts logged.",
            },
            {
                title: "Run it by hand",
                body: "Tap <strong>Nutrition MCP Health</strong> in the Shortcuts app for its menu: <strong>Sync now</strong> sends anything waiting, <strong>Status</strong> shows the last day sent and when the next one is ready, and <strong>Disconnect</strong> ends the connection.",
            },
            {
                title: "Check from your AI app",
                body: "Ask your AI to show your profile (<code>get_profile</code>): it says when the sync was connected, which day it has sent through and when it last ran.",
            },
        ],
    },
    privacy: {
        title: "Privacy and limits",
        items: [
            "Our server keeps the connection and, for 8 days, a record of the totals it sent, so each day is sent once and afterwards only topped up. Both are in your data export.",
            "The shortcut keeps its access token in its own storage inside the Shortcuts app on your iPhone, not in a file, and the Shortcuts app may sync it to your other devices through iCloud. Anyone who can run the shortcut on your devices can use the sync until you disconnect, so keep it on devices only you use.",
            "We send nothing to Apple. The shortcut asks our server for your totals and writes them into Health on your iPhone; from there, your own Apple settings apply.",
            "Choose <strong>Disconnect</strong> at any time and the connection and its record are deleted at once. It also ends by itself after 90 days without a sync, and 365 days after connecting. What is already in Apple Health stays there until you delete it.",
        ],
        policyLink: "Read the privacy policy",
    },
    troubleshooting: {
        title: "Troubleshooting",
        lead: "Something not adding up? These answers cover the usual cases.",
        readMore: "Read the answer",
    },
    selfHost: {
        textHtml:
            "Running your own server? The shortcut is built step by step in {link}.",
        linkText: "the build sheet",
    },
};

/**
 * Every locale's guide. A translation lives in its own
 * `src/copy/apple-health.<locale>.ts`, exporting
 * `export const APPLE_HEALTH_<LOCALE>: AppleHealthDoc = { … }` (importing the
 * type with `import type { AppleHealthDoc } from "./apple-health.js";`), and
 * plugs in with one import line above and one entry here, e.g.
 * `import { APPLE_HEALTH_DE } from "./apple-health.de.js";` and
 * `de: APPLE_HEALTH_DE,`. Typed as a full Record now that every locale is
 * translated, so `bun run typecheck` refuses a new locale without its guide;
 * scripts/gen-apple-health.ts renders every entry.
 */
export const APPLE_HEALTH: Record<SiteLocale, AppleHealthDoc> = {
    en: APPLE_HEALTH_EN,
    fr: APPLE_HEALTH_FR,
    pl: APPLE_HEALTH_PL,
    uk: APPLE_HEALTH_UK,
    ja: APPLE_HEALTH_JA,
    de: APPLE_HEALTH_DE,
    nl: APPLE_HEALTH_NL,
    es: APPLE_HEALTH_ES,
    it: APPLE_HEALTH_IT,
};

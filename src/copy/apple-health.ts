// Typed content for /apple-health, the user-facing setup guide for the two
// Apple Health shortcuts — Nutrition MCP Health (daily totals into Health) and
// Nutrition MCP Activity (Active Energy back as active calories), covered
// side by side and equally — rendered by
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
//
// The Activity halves (hero.activity, connect.activity, automate.activity*,
// everyday.activity*, the privacy items) restate src/health-activity-sync.ts:
// the today-plus-2-days read, one entry per day replaced on every sync, a 0
// changing nothing, hand-logged workouts not added on a synced day, and the
// rounding to whole kilocalories. Keep them in step with that module.

import type { SiteLocale } from "../routes.js";
import type { HealthSyncField } from "../health-sync.js";
import { APPLE_HEALTH_FR } from "./apple-health.fr.js";
import { APPLE_HEALTH_PL } from "./apple-health.pl.js";
import { APPLE_HEALTH_UK } from "./apple-health.uk.js";
import { APPLE_HEALTH_JA } from "./apple-health.ja.js";
import { APPLE_HEALTH_TR } from "./apple-health.tr.js";
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

/**
 * One shortcut's card in the hero: which way the data goes and what moves.
 * The shortcut's own name is never translated and comes from the code
 * (HEALTH_SYNC_SHORTCUT_NAME / HEALTH_ACTIVITY_SHORTCUT_NAME).
 */
export interface AppleHealthDirection {
    /** PLAIN TEXT. The direction, e.g. "Nutrition MCP → Apple Health". */
    flow: string;
    /** PLAIN TEXT. One line: what it does. */
    title: string;
    /** RAW HTML. Bullets: what you'll see. */
    items: string[];
}

/** One shortcut's half of a two-column section. */
export interface AppleHealthTrack {
    /** PLAIN TEXT. The column heading (usually what the shortcut does). */
    label: string;
    /** RAW HTML. Bullets or steps for that shortcut. */
    items: string[];
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
        /** PLAIN TEXT. Two shortcuts, one each way; either or both. */
        lead: string;
        /** Nutrition MCP Health: daily totals into Apple Health. */
        health: AppleHealthDirection;
        /** Nutrition MCP Activity: Active Energy from Apple Health. */
        activity: AppleHealthDirection;
        /** PLAIN TEXT. Label above the nutrient chips. */
        nutrientsLabel: string;
        /** PLAIN TEXT. Each nutrient chip, named as Health names the type. */
        nutrients: Record<HealthSyncField, string>;
        /** PLAIN TEXT. Small suffix on the water chip ("if you choose"). */
        waterNote: string;
        /** PLAIN TEXT. The line under the chips saying alcohol is never sent. */
        alcoholNote: string;
        /** PLAIN TEXT. Label above the activity card's one chip. */
        readLabel: string;
        /** PLAIN TEXT. That chip: Health's own name for Active Energy. */
        activeEnergy: string;
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
        /** RAW HTML. Shown while at least one link exists. */
        lead: string;
        /** PLAIN TEXT. The install button (shown once a link exists). */
        button: string;
        /** PLAIN TEXT. Shown instead of a button while there is no link. */
        pending: string;
        /** RAW HTML. Replaces `lead` while neither link exists, so the page
         * never tells the reader to open a link it doesn't show. */
        leadPending: string;
        /** PLAIN TEXT. One line under each shortcut's name in its tile. */
        healthBlurb: string;
        /** PLAIN TEXT. */
        activityBlurb: string;
        /** RAW HTML. Why the shortcuts must keep their names. */
        nameNote: string;
    };
    connect: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. Numbered steps, the same for both shortcuts. */
        steps: string[];
        /** What only that shortcut asks for, after the shared steps. */
        health: AppleHealthTrack;
        activity: AppleHealthTrack;
        /** RAW HTML. The note under it all. */
        note: string;
    };
    automate: {
        /** PLAIN TEXT. */
        title: string;
        /** RAW HTML. */
        lead: string;
        /** PLAIN TEXT. Heading above each shortcut's trigger cards. */
        healthLabel: string;
        /** Exactly three, in this order: Health is opened, an alarm is
         * stopped, the charger is connected. The generator pairs each with a
         * fixed icon by index. */
        healthTriggers: [
            AppleHealthTrigger,
            AppleHealthTrigger,
            AppleHealthTrigger,
        ];
        /** PLAIN TEXT. */
        activityLabel: string;
        /** Exactly three, in this order: the AI app (Claude or ChatGPT) is
         * opened, Health or Fitness is opened, a time of day. Icons by index,
         * like above. */
        activityTriggers: [
            AppleHealthTrigger,
            AppleHealthTrigger,
            AppleHealthTrigger,
        ];
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
        /** PLAIN TEXT. Heading above each shortcut's cards. */
        healthLabel: string;
        /** Four cards: a late addition, a lowered day, the menu, the AI app.
         * The generator pairs each with a fixed icon by index. */
        healthCards: [
            AppleHealthCard,
            AppleHealthCard,
            AppleHealthCard,
            AppleHealthCard,
        ];
        /** PLAIN TEXT. */
        activityLabel: string;
        /** Four cards: big numbers in the send prompt, a workout logged in
         * chat too, a day that reads 0, the menu. Icons by index. */
        activityCards: [
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
        /** RAW HTML with {link} and {activityLink} tokens, replaced by links
         * to the two build sheets on GitHub (scripts/depersonalize.ts drops
         * the whole note on a fork). */
        textHtml: string;
        /** PLAIN TEXT. The Nutrition MCP Health build sheet's link label. */
        linkText: string;
        /** PLAIN TEXT. The Nutrition MCP Activity build sheet's link label. */
        activityLinkText: string;
    };
}

export const APPLE_HEALTH_EN: AppleHealthDoc = {
    meta: {
        title: "Apple Health shortcuts",
        description:
            "Two free iPhone shortcuts connect Nutrition MCP and Apple Health: Nutrition MCP Health copies the daily totals you log with your AI (calories, protein, carbs, fat, fiber, caffeine and optionally water) into Apple Health, and Nutrition MCP Activity brings your daily Active Energy back as active calories.",
        ogDescription:
            "Daily totals into Apple Health, Active Energy back into Nutrition MCP: two free iPhone shortcuts, use either or both.",
    },
    tocLabel: "On this page",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP and Apple Health, both ways",
        lead: "Two free iPhone shortcuts, one for each direction. One copies what you eat into Apple Health, the other brings the energy you burn back to Nutrition MCP. Use either, or both: they connect, sync and disconnect on their own.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Your daily totals, in Apple Health",
            items: [
                "One entry per nutrient for each finished day, at <strong>12:00</strong>, from <strong>Shortcuts</strong>.",
                "A day is finished at <strong>05:00</strong> the next morning in your timezone, so yesterday arrives after 05:00 today. Today is never there.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Your Active Energy, as active calories",
            items: [
                "Your <strong>Active Energy</strong> total for today and the 2 days before, shown beside what you ate. Your calorie goal never changes.",
                "One entry per day, replaced on every sync, so syncing often never counts a day twice.",
            ],
        },
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
        readLabel: "Read each sync",
        activeEnergy: "Active Energy",
    },
    before: {
        title: "Before you start",
        items: [
            "An iPhone with the <strong>Shortcuts</strong> and <strong>Health</strong> apps. Both come with iOS.",
            "A Nutrition MCP account that is already connected to your AI app, such as Claude or ChatGPT. Both shortcuts sign in with that same account.",
            "Recommended: your timezone on your profile, since it decides where one day ends. Just say <em>&ldquo;set my timezone&rdquo;</em> in chat. If you never set one, the timezone your iPhone reports when you connect is used.",
        ],
    },
    install: {
        title: "Install the shortcuts",
        lead: "Install one or both. Open a link on your iPhone and tap <strong>Add Shortcut</strong>; it appears in the Shortcuts app under its own name.",
        button: "Get the shortcut",
        pending: "The link will be published here soon.",
        leadPending:
            "The shortcuts aren't published yet. Once they are, you'll open a link on your iPhone and tap <strong>Add Shortcut</strong>, and the shortcut will appear in the Shortcuts app under its own name. The steps below show what comes after that.",
        healthBlurb: "Sends your daily totals to Apple Health.",
        activityBlurb: "Reads your Active Energy from Apple Health.",
        nameNote:
            "Keep the names exactly <strong>Nutrition MCP Health</strong> and <strong>Nutrition MCP Activity</strong>. The sign-in page reopens each shortcut by its name, so connecting stops halfway if one is renamed.",
    },
    connect: {
        title: "Connect them",
        steps: [
            "In the Shortcuts app, tap the shortcut to run it.",
            "Answer its questions (below), then Safari opens a sign-in page. Sign in with the <strong>same account your AI app uses</strong>. The page shows a notice about connecting Apple Health: only continue if you just started this yourself, from the shortcut on your own iPhone.",
            "When Safari asks whether to open Shortcuts, tap <strong>Open</strong>. The shortcut finishes connecting.",
        ],
        health: {
            label: "Nutrition MCP Health asks",
            items: [
                "Whether to also send <strong>water</strong> (leave it off if your Apple Watch or another app already logs water), and which days to send, <strong>From today</strong> or <strong>Also the last 7 days</strong>.",
                "The first time a day is sent, Apple Health asks what Shortcuts may write: turn on <strong>every type</strong> and tap <strong>Allow</strong>. If you chose <strong>Also the last 7 days</strong> and logged meals in them, that happens right away. Otherwise there is nothing to send yet, so after 05:00 tomorrow open the shortcut and tap <strong>Sync now</strong> once to answer it.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity asks",
            items: [
                "Nothing before sign-in, apart from a short notice of what it reads. Its first sync runs straight after connecting.",
                "Apple Health asks whether Shortcuts may read <strong>Active Energy</strong>: tap <strong>Allow</strong>. Then iOS asks whether the shortcut may send health samples to nutrition-mcp.com: choose <strong>Always Allow</strong>, or every automatic run stops at that question.",
            ],
        },
        note: "Each sign-in link works once, for 30 minutes. If it runs out, run the shortcut again. Connect the two shortcuts one after the other, not at the same time. With Nutrition MCP Health, your first finished day arrives after 05:00 tomorrow; if you chose the last 7 days, those are sent right away.",
    },
    automate: {
        title: "Make them automatic",
        lead: "A shared shortcut can't bring its automations along, so create them once in the <strong>Automation</strong> tab of the Shortcuts app, for each shortcut you use. The first trigger of each is the one that matters; the others catch up.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
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
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude or ChatGPT → Is Opened",
                tag: "Main",
                body: "Opening your AI app is when you are about to ask how your day is going, so today&rsquo;s burn is up to date before you ask.",
            },
            {
                when: "App → Health or Fitness → Is Opened",
                tag: "Also",
                body: "Checking your rings or your workouts is one more chance to sync.",
            },
            {
                when: "Time of Day",
                tag: "Through the day",
                body: "There is no &ldquo;every hour&rdquo; trigger, so add a few, for example at 12:00, 18:00 and 22:00, to catch the days you don&rsquo;t open either app.",
            },
        ],
        stepsLabel: "For each one",
        steps: [
            "In the Shortcuts app, open the <strong>Automation</strong> tab and tap <strong>+</strong> to create a personal automation.",
            "Pick the trigger, for example <strong>App</strong> → <strong>Health</strong> → <strong>Is Opened</strong>.",
            "Choose <strong>Run Immediately</strong>, and turn <strong>Notify When Run</strong> off if your iPhone offers it.",
            "Add the action <strong>Run Shortcut</strong>, pick <strong>Nutrition MCP Health</strong> or <strong>Nutrition MCP Activity</strong>, and set its input to the text <code>auto</code>.",
        ],
        note: "The <code>auto</code> input keeps automatic runs quiet: they only notify you when something needs your attention. No exact time is needed: Nutrition MCP Health looks back over the last 7 finished days on every sync, and Nutrition MCP Activity re-sends today and the 2 days before, so a missed run catches up by itself.",
    },
    everyday: {
        title: "Everyday use",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
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
                body: "Ask your AI to show your profile (<code>get_profile</code>): it says when each shortcut was connected, which day Nutrition MCP Health has sent through and when each last ran.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Big calorie numbers when it asks to send?",
                body: "Don&rsquo;t worry about them. The question iOS shows before sending lists Health&rsquo;s raw daily sums, with all their decimals and in your region&rsquo;s number format, so <strong>922,774 kcal</strong> can simply mean 922.774. The shortcut rounds every day to whole kilocalories before it sends anything, and the <strong>0 kcal</strong> entries it also lists add nothing.",
            },
            {
                title: "Logged a workout in chat too?",
                body: "On a day the shortcut has sent, the Apple Health total counts and workouts you logged in chat stay in your log without being added on top: your watch&rsquo;s Active Energy already includes them. On other days they count as usual.",
            },
            {
                title: "A day that reads 0?",
                body: "A day with no Active Energy, or one Health didn&rsquo;t let the shortcut read, sends nothing and changes nothing. If every day stays at 0, allow Shortcuts to read Active Energy under Health → <strong>Sharing</strong> → <strong>Apps</strong> → <strong>Shortcuts</strong>.",
            },
            {
                title: "Run it by hand",
                body: "Tap <strong>Nutrition MCP Activity</strong> in the Shortcuts app for its menu: <strong>Sync now</strong> sends today and the 2 days before, <strong>Status</strong> shows the last day sent, and <strong>Disconnect</strong> ends its connection and leaves Nutrition MCP Health connected.",
            },
        ],
    },
    privacy: {
        title: "Privacy and limits",
        items: [
            "Nutrition MCP Health: our server keeps the connection and, for 8 days, a record of the totals it sent, so each day is sent once and afterwards only topped up. We send nothing to Apple; the shortcut asks our server for your totals and writes them into Health on your iPhone, where your own Apple settings apply.",
            "Nutrition MCP Activity reads only the daily <strong>Active Energy</strong> total, nothing else from Health. Our server stores those totals as your active calories, in your data export and deleted with your account, like the ones you log in chat.",
            "Each shortcut keeps its own access token in its own storage inside the Shortcuts app on your iPhone, not in a file, and the Shortcuts app may sync it to your other devices through iCloud. Anyone who can run a shortcut on your devices can use its sync until you disconnect, so keep them on devices only you use.",
            "Choose <strong>Disconnect</strong> in a shortcut at any time and its connection is deleted at once, along with Nutrition MCP Health&rsquo;s record. Each connection also ends by itself after 90 days without a sync, and 365 days after connecting. What is already in Apple Health stays there until you delete it, and active calories already sent stay until you delete them.",
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
            "Running your own server? The shortcuts are built step by step in {link} and {activityLink}.",
        linkText: "the Nutrition MCP Health build sheet",
        activityLinkText: "the Nutrition MCP Activity build sheet",
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
    tr: APPLE_HEALTH_TR,
};

// Typed copy for the two small HTML pages the Apple Health sync pairing flow
// shows in Safari on the user's iPhone (served by src/health-sync-routes.ts):
//
// - `opening` — the GET /health-sync/callback page after a successful
//   sign-in. It navigates straight to the shortcuts:// URL that hands the
//   claim code to the shortcut, so the user normally sees it for a moment
//   only; the button repeats that navigation for when iOS asks first or the
//   automatic hop is blocked. The claim code itself is never shown, so no
//   string here may carry a placeholder for it.
// - `errors` — the page for a connect link that is unknown, expired or
//   already used (`expired`), a callback whose sign-in could not be tied back
//   to the request the shortcut started (`signInFailed`), and anything else
//   (`generic`). Each one ends with the fix, which is always the same: run
//   the shortcut again, since that is the only thing that mints a new link.
//
// Like login.html these pages are noindex, carry no analytics and have no
// fixed URL to hang a locale prefix off, so the router picks the locale
// (Accept-Language, matched among SITE_LOCALES) and calls
// `healthSyncCopyFor`. Every string is plain text, escaped at render, with
// no placeholders. The phone's own app names are used where a step names an
// app (the Shortcuts app is "Kurzbefehle", "Atajos", … on a translated
// iPhone); "Apple Health", "iPhone" and the shortcut's own name,
// "Nutrition MCP Health" (HEALTH_SYNC_SHORTCUT_NAME in src/health-sync.ts),
// stay in Latin script and are never inflected, in every locale.
//
// One file per locale, merged here as a full `Record<SiteLocale, …>`, so a
// locale added to src/routes.ts without its health-sync copy fails
// `bun run typecheck`.

import type { SiteLocale } from "../routes.js";
import { HEALTH_SYNC_DE } from "./health-sync.de.js";
import { HEALTH_SYNC_ES } from "./health-sync.es.js";
import { HEALTH_SYNC_FR } from "./health-sync.fr.js";
import { HEALTH_SYNC_NL } from "./health-sync.nl.js";
import { HEALTH_SYNC_PL } from "./health-sync.pl.js";
import { HEALTH_SYNC_IT } from "./health-sync.it.js";
import { HEALTH_SYNC_UK } from "./health-sync.uk.js";
import { HEALTH_SYNC_JA } from "./health-sync.ja.js";
import { HEALTH_SYNC_TR } from "./health-sync.tr.js";

/** Which error page to show. */
export type HealthSyncErrorKind = "expired" | "signInFailed" | "generic";

export interface HealthSyncMessage {
    /** <title> (the router appends " — Nutrition MCP" if it wants one). */
    title: string;
    /** The visible <h1>. */
    heading: string;
    /** One short paragraph under the heading. */
    body: string;
}

export interface HealthSyncCopy {
    /** The callback page that hands the claim code to the shortcut. */
    opening: HealthSyncMessage & {
        /** Label of the button/link whose href is the shortcuts:// URL. */
        button: string;
        /** Small print under the button: what to do once it has opened. */
        note: string;
    };
    errors: Record<HealthSyncErrorKind, HealthSyncMessage>;
}

const HEALTH_SYNC_EN: HealthSyncCopy = {
    opening: {
        title: "Opening Shortcuts…",
        heading: "Opening Shortcuts…",
        body: "You're signed in. The Nutrition MCP Health shortcut is opening to finish connecting Apple Health sync. If it doesn't open on its own, tap the button.",
        button: "Open Shortcuts",
        note: "Once the shortcut says it's connected, you can close this page.",
    },
    errors: {
        expired: {
            title: "Link expired",
            heading: "This link has expired",
            body: "A connect link works once and only for 30 minutes. Run the Nutrition MCP Health shortcut on your iPhone again to get a new one.",
        },
        signInFailed: {
            title: "Couldn't connect",
            heading: "Sign-in could not be completed",
            body: "Apple Health sync was not connected. Run the Nutrition MCP Health shortcut on your iPhone again and sign in on the page it opens.",
        },
        generic: {
            title: "Something went wrong",
            heading: "Something went wrong",
            body: "Apple Health sync was not connected. Wait a moment, then run the Nutrition MCP Health shortcut on your iPhone again.",
        },
    },
};

export const HEALTH_SYNC_COPY: Record<SiteLocale, HealthSyncCopy> = {
    en: HEALTH_SYNC_EN,
    de: HEALTH_SYNC_DE,
    es: HEALTH_SYNC_ES,
    fr: HEALTH_SYNC_FR,
    nl: HEALTH_SYNC_NL,
    pl: HEALTH_SYNC_PL,
    it: HEALTH_SYNC_IT,
    uk: HEALTH_SYNC_UK,
    ja: HEALTH_SYNC_JA,
    tr: HEALTH_SYNC_TR,
};

/** The copy for `locale`, English for anything not in SITE_LOCALES. */
export function healthSyncCopyFor(
    locale: string | null | undefined,
): HealthSyncCopy {
    return locale && Object.hasOwn(HEALTH_SYNC_COPY, locale)
        ? HEALTH_SYNC_COPY[locale as SiteLocale]
        : HEALTH_SYNC_EN;
}

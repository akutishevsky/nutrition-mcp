// Typed content for the OAuth login screen (public/login.html and its
// translated public/{locale}/login.html), rendered by scripts/gen-login.ts.
// Unlike the rest of the site, this page is rendered per in-flight OAuth
// session (see src/oauth.ts's renderLoginPage) rather than served as a flat
// file at a fixed URL — it has no route in src/routes.ts's PAGE_ROUTES and
// no entry in the sitemap, deliberately: it's reachable only via
// GET /authorize with a client's redirect_uri/state/client_id, is linked
// from nowhere crawlable, and has zero SEO surface. Translating it is a
// pure UX call for the human going through the flow, not an SEO one.
//
// LOGIN is `Partial<Record<SiteLocale, LoginDoc>>` for the same reason
// src/copy/legal.ts's PRIVACY/TERMS are: translation lands one locale at a
// time. src/oauth.ts checks which locale's public/{locale}/login.html
// actually exists on disk at request time rather than importing this
// module directly, so LOGIN's own completeness isn't independently
// type-enforced the way PRIVACY/TERMS's paired check is — tighten this to
// the full Record once every locale has a translation, as a reminder that
// the file-existence check in oauth.ts is standing in for that guarantee
// today.

import type { SiteLocale } from "../routes.js";
import { LOGIN_DE, LOGIN_ERRORS_DE } from "./login.de.js";

export interface LoginDoc {
    title: string;
    subtitle: string;
    googleButton: string;
    dividerText: string;
    emailLabel: string;
    passwordLabel: string;
    continueButton: string;
    /** "By continuing you confirm..." — {terms}/{privacy} are replaced with
     * the localized link text for Terms of Service / Privacy Policy by the
     * generator; keep both placeholders in the sentence. */
    consentNote: string;
    termsLinkText: string;
    privacyLinkText: string;
    newHereNote: string;
    afterConnectNote: string;
}

/**
 * The two hardcoded Google-flow error strings from src/oauth.ts are
 * translated here too (a small, fully controlled set) — but an error
 * surfaced from Supabase Auth itself (e.g. "Invalid login credentials") is
 * NOT: it's third-party response text with no stable error code to key a
 * translation table on, and guessing at its wording would silently break
 * the moment Supabase changes it. Those errors stay in English across
 * every locale; translating them reliably would need a real error-code
 * mapping layer, which is out of scope for translating the page copy.
 */
export interface LoginErrors {
    googleCancelled: string;
    googleFailed: string;
}

const EN: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Sign in to connect",
    googleButton: "Continue with Google",
    dividerText: "or use email",
    emailLabel: "Email",
    passwordLabel: "Password",
    continueButton: "Continue",
    consentNote:
        "By continuing you confirm you're at least 16 and agree to the {terms} and {privacy}.",
    termsLinkText: "Terms of Service",
    privacyLinkText: "Privacy Policy",
    newHereNote:
        "New here? Just enter your email and password — an account will be created automatically.",
    afterConnectNote:
        "After successful connection in your client, save your password somewhere and close this browser tab.",
};

export const LOGIN: Partial<Record<SiteLocale, LoginDoc>> = {
    en: EN,
    de: LOGIN_DE,
};

export const LOGIN_ERRORS: Partial<Record<SiteLocale, LoginErrors>> = {
    en: {
        googleCancelled: "Google sign-in was cancelled. Please try again.",
        googleFailed: "Google sign-in failed. Please try again.",
    },
    de: LOGIN_ERRORS_DE,
};

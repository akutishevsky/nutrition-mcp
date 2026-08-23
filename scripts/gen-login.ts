/**
 * Generates public/login.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/login.ts.
 *
 * Unlike every other generated page, this one is a TEMPLATE, not a final
 * document: src/oauth.ts's renderLoginPage() reads whichever locale's
 * output this writes and fills in four placeholders at request time —
 * {{SESSION_ID}}, {{ERROR}}, {{LANG_SWITCHER}}, and
 * {{TRANSLATION_NOTICE}}. The latter two both have to be built per-request
 * rather than by scripts/site-partials.ts's ordinary nav()/translationNotice()
 * helpers: their links need to point back at THIS in-flight OAuth flow in
 * another language, which means carrying the session's state/redirect_uri/
 * client_id (see authorizeUrl() in oauth.ts) — a fixed pathFor(locale, "")
 * would send someone to the marketing homepage instead of back to their
 * login attempt. Those four tokens must reach the written file untouched;
 * nothing below runs esc()/interpolation on them.
 *
 * Re-run after editing src/copy/login.ts:
 *   bun run scripts/gen-login.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, type SiteLocale } from "../src/routes.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    nav,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import { LOGIN, type LoginDoc } from "../src/copy/login.js";

// Page-layout CSS, unchanged from the previous hand-authored login.html.
const LOGIN_STYLE = `        <style>
            /* Page layout: sticky header, centred stage, footer at the foot.
               body.auth in styles.css is flex-centred for the old standalone
               card; here the stage does the centring instead. */
            body.auth {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                justify-content: flex-start;
                padding: 0;
            }
            body.auth > main {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .auth-stage {
                flex: 1;
                display: grid;
                place-items: center;
                padding: clamp(2rem, 6vw, 4rem) 1rem;
            }
            /* The sign-in card takes the shared .card surface; the old
               standalone shadow + entrance animation go. */
            body.auth .auth-card {
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-card);
                animation: none;
            }
            body.auth .auth-title {
                font-size: clamp(1.7rem, 4vw, 2.1rem);
            }
            body.auth .auth-sub {
                margin-top: 0.45rem;
            }
            body.auth .auth-field label {
                font-family: var(--font-mono);
                font-size: 0.72rem;
                letter-spacing: 0.08em;
            }
            body.auth .auth-field input,
            body.auth .auth-btn {
                border-radius: 10px;
            }
            /* Lighter and centred than the base .translation-notice box
               (public/styles.css) — the auth-card already has its own
               border/background, so the full callout treatment reads as a
               box-in-a-box in this compact a card. */
            .auth-card .translation-notice {
                padding: 0.65rem 0.85rem;
                margin-bottom: 1.1rem;
            }
            .auth-card .translation-notice p {
                font-size: 0.8rem;
                text-align: center;
            }
        </style>`;

function renderDoc(doc: LoginDoc, locale: SiteLocale): string {
    const title = `${esc(doc.title)} — ${esc(doc.subtitle)}`;

    // consentNote's {terms}/{privacy} placeholders become links to the
    // *locale's* legal pages — pathFor, not a hardcoded /terms, so a
    // translated login page doesn't send someone to the English policy.
    const consent = esc(doc.consentNote)
        .replace(
            "{terms}",
            `<a href="${pathFor(locale, "/terms")}" target="_blank" rel="noopener">${esc(doc.termsLinkText)}</a>`,
        )
        .replace(
            "{privacy}",
            `<a href="${pathFor(locale, "/privacy")}" target="_blank" rel="noopener">${esc(doc.privacyLinkText)}</a>`,
        );

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#fbfbf9" />
        <!-- No canonical/hreflang: this page has no fixed URL (rendered
             per in-flight OAuth session via GET /authorize, not routed by
             path — see src/copy/login.ts) and isn't in the sitemap. noindex
             is a defensive belt-and-suspenders in case a stray link to
             /authorize is ever crawled. -->
        <meta name="robots" content="noindex, nofollow" />
${HEAD_ASSETS}
${LOGIN_STYLE}
    </head>
    <body class="auth">
${generatedBanner("scripts/gen-login.ts")}
${THEME_PREPAINT}

${nav(locale, "", undefined, { dynamicSwitcher: true })}

        <main id="main">
            <div class="auth-stage">
                <div class="auth-wrap">
                    <div class="auth-card card">
                        <div class="auth-head">
                            <span class="auth-mark" aria-hidden="true">🍏</span>
                            <h1 class="auth-title">${esc(doc.title)}</h1>
                            <p class="auth-sub">${esc(doc.subtitle)}</p>
                        </div>

                        {{TRANSLATION_NOTICE}}

                        {{ERROR}}

                        <a
                            class="auth-btn auth-btn-google"
                            href="/authorize/google?session_id={{SESSION_ID}}"
                        >
                            <i
                                class="fa-brands fa-google auth-btn-google-icon"
                                aria-hidden="true"
                            ></i>
                            ${esc(doc.googleButton)}
                        </a>

                        <div class="auth-divider">
                            <span>${esc(doc.dividerText)}</span>
                        </div>

                        <form method="POST" action="/approve" class="auth-form">
                            <input
                                type="hidden"
                                name="session_id"
                                value="{{SESSION_ID}}"
                            />
                            <div class="auth-field">
                                <label for="email">${esc(doc.emailLabel)}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    autocomplete="email"
                                />
                            </div>
                            <div class="auth-field">
                                <label for="password">${esc(doc.passwordLabel)}</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    minlength="6"
                                    autocomplete="current-password"
                                />
                            </div>
                            <button
                                type="submit"
                                name="action"
                                value="login"
                                class="auth-btn auth-btn-secondary"
                            >
                                ${esc(doc.continueButton)}
                            </button>
                            <p class="auth-note">${consent}</p>
                            <p class="auth-note">${esc(doc.newHereNote)}</p>
                            <p class="auth-note">${esc(doc.afterConnectNote)}</p>
                        </form>
                    </div>
                </div>
            </div>
        </main>

${footer(locale)}

${SITE_SCRIPT}
    </body>
</html>
`;
}

for (const [locale, doc] of Object.entries(LOGIN) as [SiteLocale, LoginDoc][]) {
    const file =
        locale === "en"
            ? "./public/login.html"
            : `./public/${locale}/login.html`;
    await Bun.write(file, renderDoc(doc, locale));
    console.log(`wrote ${file}`);
}

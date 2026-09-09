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
 * The page is the Dawn auth card: a glass .nm-frame around a .nm-panel,
 * centred on the blob background — the 🍏 mark in an accent-soft circle,
 * title and sub, the Google button as an ink pill, the "or" divider, the
 * email/password .nm-field pills, the primary glow submit and the notes.
 * {{ERROR}} arrives as oauth.ts's <div class="error-banner">, which
 * public/styles.css styles as the --over-tinted notice. The form's field
 * names/ids and the POST action are the contract with oauth.ts and must
 * not change.
 *
 * Re-run after editing src/copy/login.ts:
 *   bun run scripts/gen-login.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, type SiteLocale } from "../src/routes.js";
import {
    esc,
    footer,
    generatedBanner,
    nav,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import { LOGIN, type LoginDoc } from "../src/copy/login.js";

// Page-only layout: centring the card and the spacing between its parts.
// The card's surfaces and controls (.nm-frame, .nm-panel, .nm-mark-circle,
// .nm-btn, .nm-divider, .nm-field/.nm-input, .error-banner) are the shared
// primitives in public/styles.css.
const LOGIN_STYLE = `        <style>
            /* The stage fills the first viewport under the floating pill
               bar, so the card sits centred and the footer starts below
               the fold, as an auth screen should. */
            body.login .login-stage {
                display: grid;
                /* minmax(0, 1fr), not the implicit auto column: auto's min
                   is the card's min-content, i.e. the longest nowrap button
                   label, which overflows a 320px viewport in uk. */
                grid-template-columns: minmax(0, 1fr);
                place-items: center;
                min-height: calc(100svh - var(--head-h));
                padding-top: clamp(24px, 4vw, 48px);
                padding-bottom: clamp(40px, 6vw, 72px);
            }
            /* The card is the whole first viewport, so it rises on load like
               the landing's hero stage instead of waiting on a scroll reveal. */
            body.login .login-card {
                width: 100%;
                max-width: 460px;
                animation: nm-rise 0.6s 0.08s both;
            }
            body.login .login-head {
                display: grid;
                justify-items: center;
                gap: 10px;
                margin-bottom: 24px;
                text-align: center;
            }
            body.login .login-title {
                margin-top: 6px;
            }
            /* One grid for everything below the head, so the two
               placeholders that render as nothing ({{TRANSLATION_NOTICE}}
               on English, {{ERROR}} on a clean load) leave no gap behind. */
            body.login .login-body {
                display: grid;
                gap: 16px;
            }
            body.login .login-form {
                display: grid;
                gap: 14px;
            }
            body.login .login-form .nm-btn {
                margin-top: 4px;
            }
            body.login .login-body .nm-btn-ink i {
                font-size: 15px;
            }
            /* Block buttons wrap: a long translated label ("Продовжити
               через Google") is wider than a phone's column, and the
               shared nowrap pill would spill past its own edge. */
            body.login .login-body .nm-btn {
                white-space: normal;
                height: auto;
                min-height: 54px;
                padding: 12px 20px;
                line-height: 1.25;
            }
            body.login .login-notes {
                display: grid;
                gap: 8px;
                margin-top: 4px;
                text-align: center;
            }
            body.login .login-notes p {
                margin: 0;
                line-height: 1.5;
                text-wrap: pretty;
            }
            body.login .login-notes a {
                color: var(--acc-text);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 2px;
            }
            /* Inside the card the base .translation-notice (a panel with
               its own shadow) would read as a box-in-a-box; flatten it to
               the band tint. */
            body.login .translation-notice {
                padding: 10px 14px;
                background: var(--bg2);
                border-color: transparent;
                box-shadow: none;
            }
            body.login .translation-notice p {
                font-size: 13px;
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
        <!-- No canonical/hreflang: this page has no fixed URL (rendered
             per in-flight OAuth session via GET /authorize, not routed by
             path — see src/copy/login.ts) and isn't in the sitemap. noindex
             is a defensive belt-and-suspenders in case a stray link to
             /authorize is ever crawled. -->
        <meta name="robots" content="noindex, nofollow" />
${HEAD_ASSETS}
${LOGIN_STYLE}
    </head>
    <body class="login">
${generatedBanner("scripts/gen-login.ts")}
${THEME_PREPAINT}

        <!-- The three colour blobs behind the card. -->
        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>

${nav(locale, "", undefined, { dynamicSwitcher: true })}

        <main id="main">
            <section class="nm-section login-stage" aria-labelledby="login-title">
                <div class="nm-frame login-card">
                    <div class="nm-panel nm-panel-lg">
                        <div class="login-head">
                            <span class="nm-mark-circle" aria-hidden="true">🍏</span>
                            <h1 class="nm-h3 login-title" id="login-title">${esc(doc.title)}</h1>
                            <p class="nm-body">${esc(doc.subtitle)}</p>
                        </div>

                        <div class="login-body">
                            {{TRANSLATION_NOTICE}}

                            {{ERROR}}

                            <a
                                class="nm-btn nm-btn-ink nm-btn-block"
                                href="/authorize/google?session_id={{SESSION_ID}}"
                            >
                                <i class="fa-brands fa-google" aria-hidden="true"></i>
                                ${esc(doc.googleButton)}
                            </a>

                            <div class="nm-divider">${esc(doc.dividerText)}</div>

                            <form method="POST" action="/approve" class="login-form">
                                <input
                                    type="hidden"
                                    name="session_id"
                                    value="{{SESSION_ID}}"
                                />
                                <div class="nm-field">
                                    <label class="nm-label" for="email">${esc(doc.emailLabel)}</label>
                                    <input
                                        class="nm-input"
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        autocomplete="email"
                                    />
                                </div>
                                <div class="nm-field">
                                    <label class="nm-label" for="password">${esc(doc.passwordLabel)}</label>
                                    <input
                                        class="nm-input"
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
                                    class="nm-btn nm-btn-primary nm-btn-block"
                                >
                                    ${esc(doc.continueButton)}
                                </button>
                            </form>

                            <div class="login-notes">
                                <p class="nm-small">${consent}</p>
                                <p class="nm-small">${esc(doc.newHereNote)}</p>
                                <p class="nm-small">${esc(doc.afterConnectNote)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
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

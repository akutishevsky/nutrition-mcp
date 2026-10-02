/**
 * Generates public/login.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/login.ts.
 *
 * Unlike every other generated page, this one is a TEMPLATE, not a final
 * document: src/oauth.ts's renderLoginPage() reads whichever locale's
 * output this writes and fills in five placeholders at request time —
 * {{SESSION_ID}}, {{ERROR}}, {{CLIENT_NOTICE}}, {{LANG_SWITCHER}}, and
 * {{TRANSLATION_NOTICE}}. {{CLIENT_NOTICE}} is src/oauth.ts's
 * renderClientNotice(): the host the session's redirect_uri will send the
 * browser to, in the locale's LOGIN_CLIENT_NOTICE wording, as a
 * <p class="client-notice"> (plus data-warn for an unknown host or a
 * loopback redirect) — it depends on the registered client, so it can't be
 * baked in here. {{LANG_SWITCHER}} and {{TRANSLATION_NOTICE}} both have to
 * be built per-request rather than by scripts/site-partials.ts's ordinary
 * nav()/translationNotice() helpers: their links need to point back at THIS
 * in-flight OAuth flow in another language, which means carrying the
 * session's state/redirect_uri/client_id (see authorizeUrl() in oauth.ts)
 * — a fixed pathFor(locale, "")
 * would send someone to the marketing homepage instead of back to their
 * login attempt. Those five tokens must reach the written file untouched;
 * nothing below runs esc()/interpolation on them.
 *
 * Layout follows the redesign's "Sign-in Page": one rounded panel with the
 * logo mark, the consent notices, a Sign in / Create account segmented
 * control, the Google form, the email form and a hairline-separated notes
 * block ending in the /tools "I can't sign in" troubleshooting entry as a
 * native <details>. The segmented control, the password eye and the
 * single-button view are progressive enhancement (the inline script at the
 * foot of <main>): without JavaScript both submit buttons show and the
 * page posts exactly what it always did. The control only hides one of the
 * two buttons — each still posts its own action=signin / action=signup, so
 * sign-up stays an explicit choice (see src/oauth.ts).
 *
 * No analytics of any kind on this page: the head takes BASE_HEAD_ASSETS
 * (no GA, no Clarity, no consent loader) and nav()/footer() are told
 * `{ consent: false }`, so there is no banner and no "Cookie settings"
 * button either — there would be nothing for them to control.
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
    logoSvg,
    nav,
    BASE_HEAD_ASSETS,
    localeFontLinks,
    SITE_SCRIPT,
    THEME_COLOR_LIGHT,
    THEME_PREPAINT,
    EMAIL_OFF_OPEN,
    EMAIL_OFF_CLOSE,
    ICON_LINKS,
} from "./site-partials.js";
import { LOGIN, type LoginDoc } from "../src/copy/login.js";
import { TOOLS_COPY } from "../src/copy/tools.js";

// Page CSS, scoped under body.auth (the login page's body class). The
// shared chrome and primitives come from public/styles.css; colours come
// only from its tokens, which it redefines for both dark-mode paths.
// Icons that oauth.ts emits (the error banner, a warning client notice)
// can't carry an <i>, so they are drawn with Font Awesome 7's font in
// ::before — same codepoints as fa-circle-exclamation / -triangle-.
const LOGIN_STYLE = `        <style>
            body.auth {
                display: block;
                min-height: 100vh;
                padding: 0;
                background: var(--bg);
                color: var(--ink);
            }
            body.auth .auth-stage {
                min-height: calc(100vh - 80px);
                box-sizing: border-box;
                display: grid;
                place-items: center;
                padding: clamp(24px, 6vw, 64px) clamp(16px, 4vw, 40px);
            }
            body.auth .auth-card {
                width: 100%;
                max-width: 460px;
                box-sizing: border-box;
                background: var(--panel);
                border: 1px solid var(--line);
                border-radius: 32px;
                box-shadow: var(--shadow);
                padding: clamp(22px, 5vw, 36px);
                display: grid;
                gap: 20px;
                animation: nm-rise 0.5s both;
            }
            /* The card's gap drives the rhythm. */
            body.auth .auth-card > * {
                margin: 0;
            }

            body.auth .auth-head {
                display: grid;
                justify-items: center;
                gap: 14px;
                text-align: center;
            }
            body.auth .auth-head > div {
                display: grid;
                gap: 6px;
            }
            body.auth .auth-mark {
                width: 60px;
                height: 60px;
                margin: 0;
                border-radius: 20px;
                background: var(--acc-soft);
                color: var(--acc);
                display: grid;
                place-items: center;
            }
            body.auth .auth-mark .nm-logo {
                display: block;
                color: var(--acc);
            }
            body.auth .auth-title {
                margin: 0;
                font-family: var(--font);
                font-weight: 800;
                font-size: clamp(28px, 4vw, 36px);
                line-height: 1.05;
                letter-spacing: -0.04em;
                color: var(--ink);
                text-wrap: balance;
            }
            body.auth .auth-sub {
                margin: 0;
                font-size: 16px;
                color: var(--ink2);
            }

            /* {{CLIENT_NOTICE}}: the .client-notice paragraph (data-warn optional)
               from src/oauth.ts's renderClientNotice(). The host may be
               long, so it wraps anywhere rather than widening the card. */
            body.auth .auth-card .client-notice {
                padding: 12px 16px;
                border-radius: 18px;
                background: var(--bg2);
                border: 1px solid var(--line);
                color: var(--ink2);
                font-size: 14px;
                line-height: 1.5;
                text-align: center;
                text-wrap: pretty;
            }
            body.auth .auth-card .client-notice strong {
                font-family: var(--mono);
                font-weight: 600;
                color: var(--ink);
                overflow-wrap: anywhere;
            }
            /* Unknown host or loopback: an amber tint off --cal. Text stays
               --ink: --cal on a light surface is too low-contrast to read. */
            body.auth .auth-card .client-notice[data-warn] {
                background: color-mix(in srgb, var(--cal) 12%, var(--panel));
                border-color: color-mix(in srgb, var(--cal) 45%, var(--panel));
                color: var(--ink);
            }
            body.auth .auth-card .client-notice[data-warn]::before {
                content: "\\f071";
                font-family: "Font Awesome 7 Free";
                font-weight: 900;
                margin-right: 6px;
                color: var(--cal-icon);
            }

            /* {{TRANSLATION_NOTICE}}: compact, like the client notice. */
            body.auth .auth-card .translation-notice {
                padding: 12px 16px;
                border-radius: 18px;
                background: var(--bg2);
                border: 1px solid var(--line);
            }
            body.auth .auth-card .translation-notice p {
                margin: 0;
                font-size: 13.5px;
                line-height: 1.5;
                text-align: center;
                color: var(--ink2);
            }

            /* Sign in / Create account. Hidden until the inline script
               below marks the page html.js, so without JavaScript nothing
               offers a choice that wouldn't work. */
            body.auth .auth-mode {
                display: none;
                grid-template-columns: 1fr 1fr;
                gap: 4px;
                padding: 4px;
                background: var(--bg2);
                border-radius: 999px;
            }
            html.js body.auth .auth-mode {
                display: grid;
            }
            body.auth .auth-mode button {
                min-height: 42px;
                padding: 4px 10px;
                border: 0;
                border-radius: 999px;
                background: transparent;
                color: var(--ink2);
                box-shadow: none;
                cursor: pointer;
                font: inherit;
                font-weight: 700;
                font-size: 15px;
                line-height: 1.2;
                transition:
                    background 0.2s,
                    color 0.2s;
            }
            body.auth .auth-mode button[aria-pressed="true"] {
                background: var(--panel);
                color: var(--ink);
                box-shadow:
                    0 1px 2px rgba(16, 19, 24, 0.08),
                    0 4px 12px -6px rgba(16, 19, 24, 0.2);
            }

            /* {{ERROR}}: the .error-banner div from src/oauth.ts. */
            body.auth .auth-card .error-banner {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                gap: 12px;
                align-items: start;
                padding: 14px 16px;
                border-radius: 18px;
                background: color-mix(in srgb, var(--fat) 10%, var(--panel));
                border: 1px solid
                    color-mix(in srgb, var(--fat) 40%, var(--panel));
                color: var(--ink);
                font-size: 14.5px;
                font-weight: 700;
                line-height: 1.5;
                text-align: left;
                text-wrap: pretty;
                animation: nm-rise 0.3s both;
            }
            body.auth .auth-card .error-banner::before {
                content: "\\f06a";
                font-family: "Font Awesome 7 Free";
                font-weight: 900;
                margin-top: 1px;
                color: var(--fat-icon);
            }

            body.auth .auth-card .auth-consent {
                font-size: 13.5px;
                line-height: 1.55;
                color: var(--ink2);
                text-align: center;
                text-wrap: pretty;
            }
            body.auth .auth-card .auth-consent a,
            body.auth .auth-card .auth-foot a {
                color: var(--acc-txt);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
            }

            /* Buttons: ink pill for the chosen submit, outline pill for
               Google and (without JavaScript) Create account. */
            body.auth .auth-btn {
                width: 100%;
                min-height: 52px;
                box-sizing: border-box;
                margin: 0;
                padding: 8px 18px;
                border: 1px solid transparent;
                border-radius: 999px;
                background: var(--ink);
                color: var(--bg);
                cursor: pointer;
                font: inherit;
                font-weight: 700;
                font-size: 16px;
                line-height: 1.25;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                text-decoration: none;
                transform: none;
                transition:
                    background 0.2s,
                    color 0.2s;
            }
            body.auth .auth-btn:hover {
                background: var(--acc);
                color: var(--acc-ink);
                transform: none;
            }
            body.auth .auth-btn-arrow {
                font-size: 13px;
            }
            body.auth .auth-btn-google,
            body.auth .auth-btn-secondary {
                border-color: var(--line2);
                background: var(--panel);
                color: var(--ink);
            }
            body.auth .auth-btn-google:hover,
            body.auth .auth-btn-secondary:hover {
                border-color: var(--line2);
                background: var(--bg2);
                color: var(--ink);
            }
            body.auth .auth-btn-secondary .auth-btn-arrow {
                display: none;
            }
            body.auth .auth-btn-google-icon {
                font-size: 17px;
            }
            body.auth .auth-google-form {
                margin: 0;
            }

            body.auth .auth-divider {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                gap: 14px;
                font-size: 13px;
                font-weight: 600;
                color: var(--ink3);
            }
            body.auth .auth-divider::before,
            body.auth .auth-divider::after {
                content: "";
                height: 1px;
                background: var(--line);
            }

            body.auth .auth-form {
                display: grid;
                gap: 16px;
            }
            body.auth .auth-field {
                display: grid;
                gap: 8px;
            }
            body.auth .auth-field label {
                font-family: var(--mono);
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--ink2);
            }
            body.auth .auth-field input {
                width: 100%;
                box-sizing: border-box;
                height: 52px;
                padding: 0 16px;
                border: 1px solid var(--field-line);
                border-radius: 16px;
                background: var(--bg);
                color: var(--ink);
                font: inherit;
                font-size: 16px;
                outline: none;
                transition:
                    border-color 0.2s,
                    box-shadow 0.2s;
            }
            body.auth .auth-field input:focus {
                border-color: var(--acc);
                box-shadow: 0 0 0 4px
                    color-mix(in srgb, var(--acc) 18%, transparent);
            }
            body.auth .auth-pw {
                position: relative;
            }
            html.js body.auth .auth-pw input {
                padding-right: 56px;
            }
            body.auth .auth-pw-toggle {
                display: none;
                position: absolute;
                right: 4px;
                top: 4px;
                width: 44px;
                height: 44px;
                border: 0;
                border-radius: 12px;
                background: transparent;
                color: var(--ink2);
                cursor: pointer;
                font-size: 15px;
            }
            html.js body.auth .auth-pw-toggle {
                display: grid;
                place-items: center;
            }
            body.auth .auth-pw-toggle:hover {
                background: var(--bg2);
                color: var(--ink);
            }
            body.auth .auth-actions {
                display: grid;
                gap: 10px;
                margin-top: 4px;
            }
            body.auth .auth-actions [hidden] {
                display: none;
            }

            body.auth .auth-foot {
                display: grid;
                gap: 10px;
                padding-top: 18px;
                border-top: 1px solid var(--line);
                font-size: 14px;
                line-height: 1.55;
                color: var(--ink2);
                text-align: center;
                text-wrap: pretty;
            }
            body.auth .auth-foot p {
                margin: 0;
                font-size: 14px;
                line-height: 1.55;
                color: var(--ink2);
            }
            body.auth .auth-foot .auth-note-muted {
                color: var(--ink3);
            }
            body.auth .auth-help summary {
                list-style: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 44px;
                cursor: pointer;
                color: var(--acc-txt);
                font-size: 14px;
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
            }
            body.auth .auth-help summary::-webkit-details-marker {
                display: none;
            }
            body.auth .auth-help-answer {
                margin: 8px 0 0;
                font-size: 15px;
                line-height: 1.6;
                color: var(--ink2);
                text-align: left;
            }
            body.auth .auth-help strong {
                color: var(--ink);
                font-weight: 700;
            }
            body.auth .auth-help code {
                font-family: var(--mono);
                font-size: 0.86em;
                color: var(--ink);
                background: var(--bg2);
                padding: 2px 6px;
                border-radius: 6px;
            }
            @media (prefers-reduced-motion: reduce) {
                body.auth .auth-card,
                body.auth .auth-card .error-banner {
                    animation: none;
                }
            }
        </style>`;

// Progressive enhancement for the card, run inline at the end of <main> so
// the html.js rules apply before first paint instead of when the deferred
// site.js lands. It never changes what a button posts: the mode control
// only hides one of the two submit buttons and moves the visible one first
// so Enter posts it (each keeps its own name=action value), and the eye only
// flips the input's type.
const LOGIN_SCRIPT = `        <script>
            (function () {
                document.documentElement.classList.add("js");
                var form = document.querySelector(".auth-form");
                if (!form) return;
                var pw = document.getElementById("password");
                var signin = form.querySelector('button[value="signin"]');
                var signup = form.querySelector('button[value="signup"]');
                var tabs = document.querySelectorAll(".auth-mode [data-mode]");
                function setMode(mode) {
                    var up = mode === "signup";
                    for (var i = 0; i < tabs.length; i++)
                        tabs[i].setAttribute(
                            "aria-pressed",
                            String(tabs[i].getAttribute("data-mode") === mode),
                        );
                    signin.hidden = up;
                    signup.hidden = !up;
                    // Enter submits with the form's first submit button even
                    // when it is hidden, so the chosen one goes first: in
                    // Create account mode Enter must post action=signup.
                    signin.parentNode.insertBefore(up ? signup : signin, up ? signin : signup);
                    signup.classList.toggle("auth-btn-secondary", !up);
                    pw.setAttribute(
                        "autocomplete",
                        up ? "new-password" : "current-password",
                    );
                }
                for (var i = 0; i < tabs.length; i++)
                    tabs[i].addEventListener("click", function () {
                        setMode(this.getAttribute("data-mode"));
                    });
                setMode("signin");
                var eye = form.querySelector(".auth-pw-toggle");
                if (eye)
                    eye.addEventListener("click", function () {
                        var show = pw.type === "password";
                        pw.type = show ? "text" : "password";
                        var label = eye.getAttribute(
                            show ? "data-hide-label" : "data-show-label",
                        );
                        eye.setAttribute("aria-label", label);
                        eye.setAttribute("title", label);
                        eye.setAttribute("aria-pressed", String(show));
                        var icon = eye.querySelector("i");
                        icon.className = show
                            ? "fa-solid fa-eye-slash"
                            : "fa-solid fa-eye";
                    });
            })();
        </script>`;

// Translators add new LoginDoc fields after the English copy changes; until
// then a locale falls back to English for just those fields rather than
// rendering "undefined" (or crashing in esc()).
function withFallback(doc: LoginDoc): LoginDoc {
    const merged = { ...LOGIN.en } as Record<string, string>;
    for (const [k, v] of Object.entries(doc)) {
        if (typeof v === "string" && v) merged[k] = v;
    }
    return merged as unknown as LoginDoc;
}

function renderDoc(rawDoc: LoginDoc, locale: SiteLocale): string {
    const doc = withFallback(rawDoc);
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

    // "I can't sign in, or I forgot my password" is the /tools
    // troubleshooting entry of the same id, already translated in every
    // locale. Its answerHtml is trusted HTML that links only to mailto:,
    // https:// or #anchors (see TroubleshootingEntry), so it is inserted
    // unescaped; the mailto sits inside the page's email_off pair.
    const help = (TOOLS_COPY[locale] ?? TOOLS_COPY.en)!.troubleshooting.items[
        "cannot-sign-in"
    ];

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
        <!-- No canonical/hreflang: this page has no fixed URL (rendered
             per in-flight OAuth session via GET /authorize, not routed by
             path — see src/copy/login.ts) and isn't in the sitemap. noindex
             is a defensive belt-and-suspenders in case a stray link to
             /authorize is ever crawled. -->
        <meta name="robots" content="noindex, nofollow" />
${BASE_HEAD_ASSETS}${localeFontLinks(locale)}
${LOGIN_STYLE}
    </head>
    <body class="auth">
${generatedBanner("scripts/gen-login.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, "", undefined, { dynamicSwitcher: true, consent: false, blobs: "compact" })}

        <main id="main">
            <div class="auth-stage">
                <section class="auth-card" aria-labelledby="auth-title">
                    <div class="auth-head">
                        <span class="auth-mark" aria-hidden="true">${logoSvg("a", 30)}</span>
                        <div>
                            <h1 class="auth-title" id="auth-title">${esc(doc.title)}</h1>
                            <p class="auth-sub">${esc(doc.subtitle)}</p>
                        </div>
                    </div>

                    {{CLIENT_NOTICE}}

                    {{TRANSLATION_NOTICE}}

                    <!-- Chooses which of the email form's two submit buttons
                         shows; hidden without JavaScript, where both do. -->
                    <div
                        class="auth-mode"
                        role="group"
                        aria-label="${esc(doc.modeGroupAriaLabel)}"
                    >
                        <button type="button" data-mode="signin" aria-pressed="true">${esc(doc.signInButton)}</button>
                        <button type="button" data-mode="signup" aria-pressed="false">${esc(doc.createAccountButton)}</button>
                    </div>

                    {{ERROR}}

                    <!-- Above both sign-in forms, so it is on screen before
                         either submit: this line is the explicit Art. 9
                         consent the privacy policy's legal basis names
                         ("each time you sign in"), for Google and email
                         alike. -->
                    <p class="auth-note auth-consent">${consent}</p>

                    <!-- A POST form, not a link: POST /authorize/google
                         is the only way into the Google leg, so it always
                         starts from this page and its CLIENT_NOTICE (see
                         the binding cookie in src/oauth.ts). -->
                    <form
                        method="post"
                        action="/authorize/google"
                        class="auth-google-form"
                    >
                        <input
                            type="hidden"
                            name="session_id"
                            value="{{SESSION_ID}}"
                        />
                        <button type="submit" class="auth-btn auth-btn-google">
                            <i
                                class="fa-brands fa-google auth-btn-google-icon"
                                aria-hidden="true"
                            ></i>
                            ${esc(doc.googleButton)}
                        </button>
                    </form>

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
                            <div class="auth-pw">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    minlength="6"
                                    autocomplete="current-password"
                                />
                                <button
                                    type="button"
                                    class="auth-pw-toggle"
                                    aria-controls="password"
                                    aria-pressed="false"
                                    aria-label="${esc(doc.showPasswordLabel)}"
                                    title="${esc(doc.showPasswordLabel)}"
                                    data-show-label="${esc(doc.showPasswordLabel)}"
                                    data-hide-label="${esc(doc.hidePasswordLabel)}"
                                >
                                    <i class="fa-solid fa-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <!-- Two submits of one form, posting action=signin or
                             action=signup: sign-up is an explicit choice, never
                             what a failed sign-in falls back to. Sign in comes
                             first so Enter triggers it; with JavaScript the
                             mode control above hides whichever isn't chosen. -->
                        <div class="auth-actions">
                            <button
                                type="submit"
                                name="action"
                                value="signin"
                                class="auth-btn"
                            >
                                ${esc(doc.signInButton)}
                                <i class="fa-solid fa-arrow-right auth-btn-arrow" aria-hidden="true"></i>
                            </button>
                            <button
                                type="submit"
                                name="action"
                                value="signup"
                                class="auth-btn auth-btn-secondary"
                            >
                                ${esc(doc.createAccountButton)}
                                <i class="fa-solid fa-arrow-right auth-btn-arrow" aria-hidden="true"></i>
                            </button>
                        </div>
                    </form>

                    <div class="auth-foot">
                        <p class="auth-note">${esc(doc.newHereNote)}</p>
                        <p class="auth-note auth-note-muted">${esc(doc.afterConnectNote)}</p>
                        <details class="auth-help">
                            <summary>${esc(help.question)}</summary>
                            <p class="auth-help-answer">${help.answerHtml}</p>
                        </details>
                    </div>
                </section>
            </div>
${LOGIN_SCRIPT}
        </main>

${footer(locale, undefined, { consent: false })}

${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
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

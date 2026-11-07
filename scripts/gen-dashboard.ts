/**
 * Generates public/dashboard.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/dashboard.ts.
 *
 * The page is a static SHELL: it carries no user data at all. Everything
 * inside <main> is built in the browser by public/dashboard.js from the
 * signed-in JSON API (/api/dashboard/*), and each chat widget is a sandboxed
 * iframe of /dashboard/widget/:key that dashboard.js feeds through the MCP
 * Apps host handshake. What this file bakes in is the chrome (nav() in its
 * `app: "dashboard"` mode, footer()), the phone page switcher, a <noscript>
 * line, the locale's DashboardDoc as JSON for dashboard.js
 * (`<script type="application/json" id="dash-strings">`) and the page's own
 * CSS (DASHBOARD_STYLE), built from the site tokens and `.nm-*` primitives
 * in public/styles.css.
 *
 * Like the login page it is signed-in only and never indexed: noindex meta
 * (src/index.ts adds the X-Robots-Tag header too), no hreflang set, no
 * sitemap entry (it is in APP_PAGE_ROUTES, not PAGE_ROUTES), and no
 * analytics of any kind — BASE_HEAD_ASSETS, and `consent: false` on both
 * nav() and footer().
 *
 * Re-run after editing src/copy/dashboard.ts:
 *   bun run scripts/gen-dashboard.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 * scripts/dashboard-preview.ts imports renderDashboard() and renders on
 * every request instead, so the preview never needs a re-run.
 */

import {
    HTML_LANG,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    BASE_HEAD_ASSETS,
    EMAIL_OFF_CLOSE,
    EMAIL_OFF_OPEN,
    ICON_LINKS,
    SITE_SCRIPT,
    THEME_COLOR_LIGHT,
    THEME_PREPAINT,
    esc,
    footer,
    generatedBanner,
    localeFontLinks,
    nav,
    translationNotice,
} from "./site-partials.js";
import {
    DASHBOARD,
    DASHBOARD_VIEWS,
    dashboardFor,
} from "../src/copy/dashboard.js";

/** The page route (APP_PAGE_ROUTES key in src/routes.ts). */
const SUFFIX = "/dashboard";

/**
 * The tokens the dashboard needs that public/styles.css does not carry: the
 * calendar's status bands and the sync pill's warning dot (the widgets'
 * --status-* palette) and the measurements tint. Declared in all three
 * token blocks, like styles.css (light, the OS dark path, the explicit dark
 * toggle).
 */
const TOKENS_LIGHT = `--d-over: #d63b2a;
        --d-togo: #2d6fd6;
        --d-warn: #b86e00;
        --d-meas: #4b7d8c;`;
const TOKENS_DARK = `--d-over: #ff6b52;
        --d-togo: #8ab0ff;
        --d-warn: #f0a640;
        --d-meas: #86b9c8;`;

/**
 * Page layout. Every value is the design's (scratchpad specs design-*.md),
 * expressed through the site tokens; the phone layout is the design's
 * flex-basis wrapping plus the page switcher below the hamburger breakpoint.
 */
export const DASHBOARD_STYLE = `        <style>
    body.dash-app {
        ${TOKENS_LIGHT}
    }
    @media (prefers-color-scheme: dark) {
        body.dash-app:not([data-theme="light"]) {
            ${TOKENS_DARK}
        }
    }
    body.dash-app[data-theme="dark"] {
        ${TOKENS_DARK}
    }
    body.dash-app {
        display: flex;
        flex-direction: column;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
    }
    body.dash-app > .footer {
        margin-top: auto;
    }

    /* ---- header additions (nav() app mode) ---- */
    .dash-signout {
        display: contents;
    }
    .dash-signout .head-cta,
    .dash-signout .menu-cta {
        border: 0;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }
    .dash-signout .head-cta {
        font-size: 14px;
    }
    .dash-app .head-nav a {
        padding: 0 12px;
    }
    .dash-app .menu-foot {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    .dash-app .menu-foot .menu-gh,
    .dash-app .menu-foot .menu-cta {
        flex: 1 1 140px;
        height: 52px;
        font-size: 16px;
    }
    .dash-menu-end {
        display: inline-flex;
        align-items: center;
        gap: 12px;
    }
    .dash-menu-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--acc);
        visibility: hidden;
    }
    .menu-nav a[aria-current="page"] .dash-menu-dot {
        visibility: visible;
    }
    /* The sheet menu as the dashboard design draws it: the current page is
       marked by its dot alone, the current language is an ink tile, and the
       group labels are mono caps. */
    .dash-app .menu-nav a[aria-current="page"] {
        color: var(--ink);
    }
    .dash-app .menu-langs a[aria-current="page"] {
        background: var(--ink);
        color: var(--bg);
        border-color: var(--ink);
    }
    .dash-app .menu-group-label {
        font-family: var(--mono);
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ink3);
    }

    /* ---- main column ---- */
    .dash {
        width: 100%;
        max-width: var(--container);
        margin: 0 auto;
        padding: clamp(12px, 3vw, 32px) var(--gutter) clamp(32px, 4vw, 56px);
        display: flex;
        flex-direction: column;
        gap: 20px;
        flex: 1 0 auto;
    }
    .dash-view,
    .dash-page,
    .dash-stack {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
    }
    /* An empty slot (the banner slot with nothing failed) must not add a
       second gap under the page header. */
    .dash-stack:empty {
        display: none;
    }
    /* Content kept on screen while a new day loads into it. */
    .dash-stack[aria-busy="true"],
    .dash-day[aria-busy="true"] {
        opacity: 0.55;
        transition: opacity 0.2s;
    }
    @media (prefers-reduced-motion: reduce) {
        .dash-stack[aria-busy="true"],
        .dash-day[aria-busy="true"] {
            transition: none;
        }
    }
    .dash-noscript {
        margin: 0;
        padding: 18px 20px;
        border-radius: 22px;
        background: var(--panel);
        border: 1px solid var(--line);
        color: var(--ink2);
    }

    /* Phone page switcher: a segmented pill, shown wherever the header's
       tabs are folded behind the hamburger. */
    .dash-pages {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 2px;
        padding: 4px;
        border-radius: 999px;
        background: var(--glass);
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
    }
    .dash-pages a {
        height: 40px;
        min-width: 0;
        display: grid;
        place-items: center;
        padding: 0 4px;
        border-radius: 999px;
        color: var(--ink2);
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition:
            background 0.2s,
            color 0.2s;
    }
    .dash-pages a:hover {
        color: var(--ink);
    }
    .dash-pages a[aria-current="page"] {
        background: var(--ink);
        color: var(--bg);
    }
    @media (min-width: 1060px) {
        html:not(.nav-tight) .dash-pages {
            display: none;
        }
    }

    /* ---- page header ---- */
    .dash-head {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px 24px;
    }
    .dash-head-l {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
        min-width: 0;
    }
    .dash-title {
        margin: 0;
        font-weight: 800;
        font-size: clamp(40px, 5vw, 64px);
        line-height: 1;
        letter-spacing: -0.045em;
    }
    .dash-pill-dot {
        width: 8px;
        height: 8px;
        flex: none;
        border-radius: 50%;
        background: var(--acc);
    }
    .dash-pill-dot[data-tone="idle"] {
        background: var(--ink3);
    }
    .dash-pill-dot[data-tone="warn"] {
        background: var(--d-warn);
    }
    .dash-pill-dot[data-tone="idle"][data-busy] {
        animation: dash-breathe 1.2s ease-in-out infinite;
    }
    @keyframes dash-breathe {
        50% {
            opacity: 0.35;
        }
    }

    /* Glass pill of round buttons: the Today date stepper and the History
       five-week pager. */
    .dash-stepper {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 46px;
        padding: 0 4px;
        border-radius: 999px;
        background: var(--glass);
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
    }
    .dash-ibtn {
        width: 38px;
        height: 38px;
        flex: none;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition: background 0.2s;
    }
    .dash-ibtn:hover:not(:disabled) {
        background: var(--bg2);
    }
    .dash-ibtn:disabled {
        color: var(--ink3);
        opacity: 0.45;
        cursor: default;
    }
    .dash-ibtn svg,
    .dash-calbtn svg,
    .dash-banner svg,
    .dash-icon svg,
    .dash-say svg,
    .dash-cta svg,
    .dash-search svg {
        display: block;
        flex: none;
    }
    .dash-calbtn {
        position: relative;
        height: 38px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        background: var(--bg2);
        color: var(--ink);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
    }
    .dash-calbtn:hover {
        background: var(--line);
    }
    .dash-calbtn input {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        border: 0;
        padding: 0;
    }
    .dash-pager-label {
        padding: 0 6px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }

    /* ---- banner (refresh failed) ---- */
    .dash-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        padding: 14px 16px 14px 18px;
        border-radius: 22px;
        background: color-mix(in srgb, var(--cal) 12%, var(--panel));
        border: 1px solid color-mix(in srgb, var(--cal) 45%, var(--panel));
    }
    .dash-banner p {
        margin: 0;
        flex: 1 1 220px;
        font-size: 14.5px;
        color: var(--ink);
    }
    .dash-banner b {
        font-weight: 700;
    }
    .dash-btn-line {
        flex: none;
        height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid var(--line2);
        background: var(--panel);
        color: var(--ink);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
    }
    .dash-btn-line:hover {
        border-color: var(--ink3);
    }

    /* ---- layout rows ---- */
    .dash-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: flex-start;
    }
    .dash-row > * {
        min-width: 0;
    }
    .dash-row-stretch {
        align-items: stretch;
    }
    .dash-col-a {
        flex: 3 1 660px;
    }
    .dash-col-b {
        flex: 2 1 360px;
    }

    /* ---- a chat widget, framed ---- */
    .dash-wcard {
        position: relative;
        width: 100%;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        overflow: hidden;
    }
    .dash-wcard iframe {
        display: block;
        width: 100%;
        height: 130px;
        border: 0;
        background: transparent;
    }

    /* ---- cards drawn by the page itself ---- */
    .dash-card {
        position: relative;
        overflow: hidden;
        padding: clamp(18px, 3vw, 24px);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .dash-card-head {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    }
    .dash-card-title {
        display: flex;
        flex-direction: column;
        flex: 1 1 200px;
        min-width: 0;
    }
    .dash-h2 {
        margin: 0;
        font-weight: 800;
        font-size: 22px;
        letter-spacing: -0.025em;
        line-height: 1.15;
    }
    .dash-card-sub {
        font-size: 14px;
        color: var(--ink2);
    }
    .dash-icon {
        flex: none;
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border-radius: 16px;
        background: color-mix(in srgb, var(--c, var(--acc)) 14%, var(--panel));
        color: var(--c-icon, var(--acc-txt));
    }
    .dash-icon.acc {
        background: var(--acc-soft);
        color: var(--acc-txt);
    }
    .dash-card .nm-blob,
    .dash-empty .nm-blob {
        opacity: 0.12;
    }
    .dash-card > :not(.nm-blob),
    .dash-empty > :not(.nm-blob) {
        position: relative;
    }

    /* ---- skeleton ---- */
    .dash-skel {
        padding: 24px;
        border-radius: 28px;
        background: var(--panel);
        border: 1px solid var(--line);
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-width: 0;
    }
    .dash-skel span,
    .dash-skel i {
        display: block;
        background: var(--bg2);
    }
    .dash-skel-h {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    .dash-skel-h span:first-child {
        width: 44px;
        height: 44px;
        border-radius: 16px;
    }
    .dash-skel-h span + span {
        height: 18px;
        border-radius: 9px;
    }
    .dash-skel-gauge {
        margin: 8px auto 0;
        width: 76%;
        max-width: 300px;
        aspect-ratio: 2 / 1;
        border: 30px solid var(--bg2);
        border-bottom: 0;
        border-radius: 300px 300px 0 0;
        background: transparent !important;
    }
    .dash-skel-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        background: transparent !important;
    }
    .dash-skel-grid > i {
        height: 64px;
        border-radius: 14px;
    }
    .dash-skel-fill {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        background: transparent !important;
    }
    .dash-skel-fill > i {
        border-radius: 20px;
    }
    .dash-skel-cells {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        background: transparent !important;
    }
    .dash-skel-cells > i {
        height: 72px;
        border-radius: 14px;
    }
    @media (prefers-reduced-motion: no-preference) {
        .dash-skel {
            animation: dash-breathe 1.6s ease-in-out infinite;
        }
    }

    /* ---- Today: empty account ---- */
    .dash-empty {
        position: relative;
        overflow: hidden;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }
    .dash-empty-a {
        flex: 3 1 480px;
        padding: clamp(24px, 4vw, 40px);
        gap: 20px;
    }
    .dash-empty-b {
        flex: 2 1 300px;
        padding: clamp(24px, 4vw, 32px);
        gap: 18px;
    }
    .dash-empty .nm-blob.big {
        width: 240px;
        height: 240px;
        opacity: 0.14;
    }
    .dash-mark {
        width: 60px;
        height: 60px;
        border-radius: 20px;
        background: var(--acc-soft);
        display: grid;
        place-items: center;
    }
    .dash-mark .nm-logo {
        width: 30px;
        height: 30px;
    }
    .dash-empty-text {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .dash-empty-text h2 {
        margin: 0;
        font-weight: 800;
        font-size: clamp(28px, 3.4vw, 40px);
        line-height: 1.05;
        letter-spacing: -0.04em;
    }
    .dash-empty-text p {
        margin: 0;
        max-width: 52ch;
        font-size: 17px;
        color: var(--ink2);
    }
    .dash-say-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .dash-label {
        font-family: var(--mono);
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ink3);
    }
    .dash-say {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 18px;
        background: var(--bg2);
        font-size: 15px;
    }
    .dash-say svg {
        margin-top: 3px;
    }
    .dash-steps {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .dash-steps li {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        font-size: 15px;
    }
    .dash-steps li > span:first-child {
        flex: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--bg);
        display: grid;
        place-items: center;
        font-family: var(--mono);
        font-size: 12px;
    }
    .dash-cta {
        align-self: flex-start;
        margin-top: 4px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        background: var(--ink);
        color: var(--bg);
        font-weight: 700;
        font-size: 15px;
        transition:
            background 0.2s,
            color 0.2s;
    }
    .dash-cta:hover {
        background: var(--acc);
        color: var(--acc-ink);
    }

    /* ---- History ---- */
    .dash-tools {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        flex: 0 1 auto;
        min-width: 0;
    }
    .dash-search {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 46px;
        padding: 0 6px 0 16px;
        border-radius: 999px;
        background: var(--panel);
        border: 1px solid var(--field-line);
        flex: 1 1 260px;
        min-width: 0;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }
    .dash-search:focus-within,
    .dash-search[data-active] {
        border-color: var(--acc);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--acc) 18%, transparent);
    }
    .dash-search input {
        flex: 1;
        min-width: 0;
        height: 100%;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--ink);
        font: inherit;
        font-size: 15px;
    }
    .dash-search input::-webkit-search-cancel-button {
        display: none;
    }
    .dash-search input:focus-visible {
        outline: none;
    }
    .dash-clear {
        flex: none;
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--bg2);
        color: var(--ink);
        cursor: pointer;
    }
    .dash-results {
        gap: 8px;
    }
    .dash-results-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 6px 12px;
        padding-bottom: 8px;
    }
    .dash-results ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
    }
    .dash-results li {
        border-top: 1px solid var(--line);
    }
    .dash-hit {
        display: flex;
        align-items: center;
        gap: clamp(10px, 2vw, 16px);
        padding: 12px 4px;
        min-height: 60px;
        color: var(--ink);
        border-radius: 12px;
    }
    .dash-hit:hover {
        color: var(--ink);
        background: color-mix(in srgb, var(--bg2) 60%, transparent);
    }
    .dash-hit-when {
        flex: none;
        width: clamp(80px, 12vw, 96px);
        display: flex;
        flex-direction: column;
        font-variant-numeric: tabular-nums;
    }
    .dash-hit-when b {
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
    }
    .dash-hit-when span {
        font-family: var(--mono);
        font-size: 11.5px;
        color: var(--ink3);
    }
    .dash-hit-what {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .dash-hit-what > span:first-child {
        font-weight: 700;
        font-size: 15.5px;
        overflow-wrap: anywhere;
    }
    .dash-hit-what > span + span {
        font-size: 13px;
        color: var(--ink2);
    }
    .dash-hit mark {
        background: color-mix(in srgb, var(--cal) 30%, transparent);
        color: inherit;
        border-radius: 4px;
        padding: 0 2px;
    }
    .dash-hit-kcal {
        flex: none;
        text-align: right;
        display: flex;
        flex-direction: column;
    }
    .dash-hit-kcal b {
        font-size: 16px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
    }
    .dash-hit-kcal span {
        font-size: 12px;
        color: var(--ink3);
    }
    .dash-results-note {
        margin: 0;
        padding: 18px 0 8px;
        font-size: 15px;
        color: var(--ink2);
    }
    .dash-saved-hit {
        margin: 8px 0 0;
        padding: 12px 14px;
        border-radius: 18px;
        background: var(--acc-soft);
        color: var(--acc-txt);
        font-size: 14px;
        font-weight: 600;
    }
    .dash-cal {
        flex: 3 1 520px;
        padding: clamp(14px, 3vw, 24px);
        gap: 14px;
    }
    .dash-day {
        flex: 2 1 360px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .dash-legend {
        margin-left: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 14px;
        font-size: 12.5px;
        color: var(--ink2);
    }
    .dash-legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .dash-legend i {
        width: 12px;
        height: 4px;
        border-radius: 2px;
        background: var(--c);
    }
    .dash-week,
    .dash-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
    }
    .dash-week {
        font-family: var(--mono);
        font-size: 11px;
        color: var(--ink3);
        text-align: center;
    }
    .dash-cell {
        position: relative;
        min-width: 0;
        height: 72px;
        padding: 6px;
        border-radius: 14px;
        border: 2px solid transparent;
        background: var(--bg2);
        color: var(--ink);
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        transition: border-color 0.15s;
    }
    .dash-cell:hover:not(:disabled) {
        border-color: var(--line2);
    }
    .dash-cell[aria-pressed="true"],
    .dash-cell[aria-pressed="true"]:hover {
        border-color: var(--ink);
    }
    .dash-cell:disabled {
        cursor: default;
    }
    .dash-cell[data-future] {
        background: transparent;
        opacity: 0.4;
    }
    .dash-cell-d {
        display: flex;
        align-items: baseline;
        gap: 4px;
        font-size: 12.5px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
    }
    .dash-cell-d span + span {
        font-family: var(--mono);
        font-size: 10px;
        font-weight: 500;
        color: var(--acc-txt);
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .dash-cell-k {
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ink2);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        line-height: 1;
    }
    .dash-cell-b {
        height: 4px;
        border-radius: 2px;
        background: transparent;
    }
    .dash-cell[data-status="on"] .dash-cell-b {
        background: var(--acc);
    }
    .dash-cell[data-status="under"] .dash-cell-b {
        background: var(--d-togo);
    }
    .dash-cell[data-status="over"] .dash-cell-b {
        background: var(--d-over);
    }
    .dash-cell[data-today] .dash-cell-b {
        background: repeating-linear-gradient(
            135deg,
            var(--ink3) 0 3px,
            transparent 3px 7px
        );
    }
    .dash-cal-sum {
        margin: 0;
        font-size: 13px;
        color: var(--ink3);
    }
    .dash-day-empty {
        padding: 22px 24px;
        border-radius: 20px;
        background: var(--panel);
        border: 1px solid var(--line);
        color: var(--ink2);
        font-size: 15px;
    }
    .dash-saved-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
        gap: 12px;
    }
    .dash-saved-card {
        padding: 16px;
        border-radius: 20px;
        background: var(--bg2);
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }
    .dash-saved-name {
        font-weight: 700;
        font-size: 15.5px;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
    }
    .dash-saved-kcal {
        font-variant-numeric: tabular-nums;
    }
    .dash-saved-kcal b {
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    .dash-saved-kcal span,
    .dash-saved-macros {
        font-size: 13px;
        color: var(--ink2);
    }
    .dash-saved-macros {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        font-variant-numeric: tabular-nums;
    }
    .dash-muted {
        margin: 0;
        font-size: 14px;
        color: var(--ink2);
    }

    /* ---- Trends / Body ---- */
    .dash-trends-main {
        flex: 3 1 560px;
    }
    .dash-trends-side {
        flex: 2 1 380px;
    }
    .dash-meas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
        gap: 10px;
    }
    .dash-meas-tile {
        padding: clamp(12px, 2vw, 16px);
        border-radius: 20px;
        background: var(--bg2);
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }
    .dash-meas-tile > span:first-child {
        font-size: 14px;
        font-weight: 700;
        color: var(--ink2);
    }
    .dash-meas-v {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }
    .dash-meas-v b {
        font-size: clamp(22px, 3vw, 26px);
        font-weight: 800;
        letter-spacing: -0.03em;
    }
    .dash-meas-v span,
    .dash-meas-tile > span:last-child {
        font-size: 13px;
        color: var(--ink2);
        font-variant-numeric: tabular-nums;
    }
    .dash-meas-note b {
        color: var(--ink);
    }
    .dash-hint {
        margin: 0;
        font-size: 13px;
        color: var(--ink3);
    }

    /* Below 700px: the design's compact calendar. */
    @media (max-width: 699px) {
        .dash-cell {
            height: 58px;
            padding: 5px;
        }
        .dash-skel-cells > i {
            height: 58px;
        }
        .dash-tools {
            width: 100%;
        }
    }
        </style>`;

/** Everything dashboard.js needs from the generator, as one JSON blob. */
function clientConfig(locale: SiteLocale): string {
    const json = JSON.stringify({
        locale,
        lang: HTML_LANG[locale],
        connectHref: hashPath(locale, "install"),
        strings: dashboardFor(locale),
    });
    // Inside <script>: no "</script>" or "<!--" may appear, so every "<"
    // goes out as a JSON escape (still the same string once parsed).
    return json.replace(/</g, "\\u003c");
}

export function renderDashboard(locale: SiteLocale): string {
    const d = dashboardFor(locale);
    const switcher = DASHBOARD_VIEWS.map(
        (v) =>
            `                <a href="#${v}" data-dash-tab="${v}">${esc(d.tabs[v])}</a>`,
    ).join("\n");
    const notice = translationNotice(locale, SUFFIX);
    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(d.meta.title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(d.meta.description).replace(/"/g, "&quot;")}" />
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
        <!-- Signed-in only: never indexed (src/index.ts also sends
             X-Robots-Tag), no hreflang set, no sitemap entry. -->
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="${urlFor(locale, SUFFIX)}" />
${BASE_HEAD_ASSETS}${localeFontLinks(locale)}
${DASHBOARD_STYLE}
    </head>
    <body class="dash-app">
${generatedBanner("scripts/gen-dashboard.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, SUFFIX, undefined, { app: "dashboard", consent: false, blobs: "compact" })}

        <main id="main" class="dash" aria-busy="true">
${notice ? `${notice}\n` : ""}            <nav class="dash-pages" aria-label="${esc(d.pagesAriaLabel)}">
${switcher}
            </nav>
            <div id="dash-view" class="dash-view"></div>
            <noscript><p class="dash-noscript">${esc(d.noScript)}</p></noscript>
        </main>

${footer(locale, undefined, { consent: false })}

        <script type="application/json" id="dash-strings">${clientConfig(locale)}</script>
${SITE_SCRIPT}
        <script src="/dashboard.js" defer></script>
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

if (import.meta.main) {
    for (const locale of Object.keys(DASHBOARD) as SiteLocale[]) {
        const file =
            locale === "en"
                ? "./public/dashboard.html"
                : `./public/${locale}/dashboard.html`;
        await Bun.write(file, renderDashboard(locale));
        console.log(`wrote ${file} (${pathFor(locale, SUFFIX)})`);
    }
}

/**
 * The landing page's own layout CSS, inlined into a <style> in its <head> by
 * scripts/gen-index.ts. Everything shared (tokens, header, footer, buttons,
 * cards, chips, the accordion, keyframes, reduced motion) is public/
 * styles.css; this is only what the landing page's sections need on top,
 * written against the same tokens so dark mode follows for free. Every class
 * is `lp-` prefixed (the demo widget cards' host is `.nmw`), so nothing here
 * collides with the shared chrome and primitives in styles.css.
 *
 * Values are the design's ("Landing Page.dc.html" in the redesign project).
 */
import { loadWidgetSources, themeHostCss } from "./widget-static.js";

await loadWidgetSources();

export const LANDING_CSS = `
/* ---------- shell ---------- */
#how h2, #stats h2 { max-width: 16ch; }
.lp-sec h2.lp-mb { margin-bottom: 32px; }
.lp-sec h2.lp-onb-h2 { max-width: 15ch; }
.lp-sec .nm-sub { font-size: 17px; }
.lp-sec code {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--ink);
    background: var(--bg2);
    border: 0;
    padding: 2px 6px;
    border-radius: 6px;
    word-break: break-all;
}
.lp-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 16px 32px; margin-bottom: 32px; }
.lp-head > p { margin: 0; max-width: 44ch; color: var(--ink2); text-wrap: pretty; }
.lp-hover-lift { transition: transform .25s; }
.lp-hover-lift:hover { transform: translateY(-4px); }
.translation-notice-band { position: relative; z-index: 1; max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); }

/* ---------- hero ---------- */
.lp-hero {
    position: relative; z-index: 1; max-width: var(--container); margin: 0 auto;
    padding: clamp(36px, 5vw, 72px) var(--gutter) clamp(40px, 6vw, 72px);
    display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
    gap: clamp(32px, 5vw, 64px); align-items: center;
}
.lp-hero h1 { animation: nm-rise .6s .08s both; }
.lp-hero h1 em { font-style: normal; color: var(--acc); }
.lp-hero .lp-lead { margin: 24px 0 0; max-width: 40ch; font-size: clamp(17px, 1.5vw, 21px); color: var(--ink2); text-wrap: pretty; animation: nm-rise .6s .16s both; }
.lp-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; animation: nm-rise .6s .24s both; }
/* The Support button: class before href, which is how scripts/
   depersonalize.ts finds and strips it. */
.lp-ctas .lp-support-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 0; height: 54px; padding: 0 22px; gap: 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--glass); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); color: var(--ink); font-weight: 600; font-size: 16px; letter-spacing: 0; white-space: nowrap; }
.lp-ctas .lp-support-btn:hover { border-color: var(--line2); color: var(--ink); }
.lp-ctas .lp-support-btn i { font-size: 14px; }
.lp-demo { position: relative; min-width: 0; animation: nm-rise .8s .3s both; }
.lp-chatframe { position: relative; background: var(--glass); -webkit-backdrop-filter: blur(22px) saturate(160%); backdrop-filter: blur(22px) saturate(160%); border: 1px solid var(--line); border-radius: 28px; padding: 8px; box-shadow: var(--shadow), 0 60px 120px -60px var(--glow); }
.lp-chat { position: relative; background: var(--panel); border-radius: 24px; padding: 16px 18px 14px; display: flex; flex-direction: column; height: 560px; overflow: hidden; }
.lp-chat-ctl { position: absolute; top: 12px; right: 12px; z-index: 2; display: flex; gap: 6px; }
.lp-chat-ctl button { width: 30px; height: 30px; display: grid; place-items: center; padding: 0; border-radius: 50%; border: 1px solid var(--line); background: var(--panel); color: var(--ink2); cursor: pointer; font-size: 10px; }
.lp-chat-ctl button:hover { color: var(--ink); border-color: var(--line2); }
.lp-thread { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; display: flex; flex-direction: column; gap: 12px; padding: 2px 0 4px; }
.lp-thread::-webkit-scrollbar { display: none; }
.lp-thread > * { flex: none; }
html.js .lp-thread > * { animation: nm-msg .7s var(--ease-out) both; }
.lp-more { margin-top: 14px; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--ink2); }
.lp-more:hover { color: var(--acc-txt); }
.lp-more i { font-size: 11px; }

/* ---------- chat bubbles (hero + examples) ---------- */
.lp-msg-u { align-self: flex-end; max-width: 80%; padding: 11px 15px; background: var(--ink); color: var(--bg); border-radius: 20px 20px 6px 20px; font-size: 15px; font-weight: 500; line-height: 1.45; }
.lp-msg-a { align-self: flex-start; max-width: 88%; padding: 11px 15px; background: var(--bg2); color: var(--ink); border-radius: 20px 20px 20px 6px; font-size: 15px; line-height: 1.45; }
.lp-msg-photo { align-self: flex-end; width: min(80%, 300px); padding: 6px; background: var(--ink); border-radius: 20px 20px 6px 20px; }
.lp-msg-photo > [role="img"] { border-radius: 16px; overflow: hidden; line-height: 0; }
.lp-msg-photo > [role="img"] svg { display: block; border-radius: 15px; }
.lp-msg-photo > p { margin: 0; padding: 8px 9px 4px; color: var(--bg); font-size: 15px; font-weight: 500; }
.lp-typing { align-self: flex-start; padding: 12px 16px; background: var(--bg2); border-radius: 20px 20px 20px 6px; display: inline-flex; gap: 5px; }
.lp-typing span { width: 7px; height: 7px; border-radius: 50%; background: var(--ink3); animation: nm-dot 1.2s infinite; }
.lp-typing span:nth-child(2) { animation-delay: .2s; }
.lp-typing span:nth-child(3) { animation-delay: .4s; }
.lp-caret { display: inline-block; width: 2px; height: 14px; background: var(--acc); margin-left: 2px; vertical-align: -2px; animation: nm-blink 1s steps(1) infinite; }
.lp-card-slot { align-self: stretch; width: 100%; }
.lp-dl { align-self: flex-start; display: flex; align-items: center; gap: 12px; padding: 12px 16px 12px 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 20px; font-size: 13px; color: var(--ink); }
.lp-dl > span:first-child { flex: none; width: 38px; height: 38px; border-radius: 12px; background: color-mix(in srgb, var(--sug) 18%, transparent); color: var(--sug-icon); display: grid; place-items: center; font-size: 15px; }
.lp-dl b { display: block; font-family: var(--mono); font-size: 13px; }
.lp-dl small { color: var(--ink3); font-size: 13px; }
.lp-dl > i { margin-left: 6px; color: var(--ink2); }

/* ---------- demo widget cards ----------
   Each card is the real widget in a shadow root (scripts/widget-static.ts),
   styled by its own CSS. The page only sizes the host and, below, pins the
   widget's tokens to the site's explicit theme choice. */
.nmw { display: block; width: 100%; text-align: left; }
${themeHostCss()}

/* ---------- how ---------- */
.lp-how-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 14px; }
.lp-how-card { position: relative; overflow: hidden; padding: 26px; display: grid; gap: 16px; align-content: start; }
.lp-how-card .nm-blob { right: -60px; top: -60px; }
.lp-how-top { position: relative; display: flex; justify-content: space-between; align-items: center; }
.lp-how-card h3 { position: relative; margin: 0; font-weight: 800; font-size: 22px; letter-spacing: -0.025em; line-height: 1.15; }
.lp-how-card p { position: relative; margin: 8px 0 0; font-size: 15px; color: var(--ink2); text-wrap: pretty; }

/* ---------- install ---------- */
.lp-install { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: clamp(32px, 5vw, 72px); align-items: start; }
.lp-install h2 { margin: 0 0 16px; }
.lp-install .nm-sub { margin: 0 0 24px; }
@media (min-width: 900px) { .lp-sticky { position: sticky; top: 110px; } }
.lp-url { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 18px; background: var(--panel); border: 1px solid var(--line); border-radius: 999px; font-family: var(--mono); font-size: 14px; box-shadow: var(--shadow); max-width: 400px; }
.lp-url > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-url .nm-icon-btn { margin-left: auto; }
.lp-tabcard { padding: 10px; }
.lp-tabcard fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
.lp-tab-input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.lp-seg { display: flex; gap: 4px; padding: 4px; background: var(--bg2); border-radius: 999px; font-size: 14px; font-weight: 700; }
.lp-seg label { flex: 1; height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 999px; color: var(--ink2); cursor: pointer; white-space: nowrap; transition: background .2s, color .2s, box-shadow .2s; }
.lp-seg label:hover { color: var(--ink); }
#itab-claude:checked ~ .lp-seg label[for="itab-claude"],
#itab-chatgpt:checked ~ .lp-seg label[for="itab-chatgpt"],
#itab-other:checked ~ .lp-seg label[for="itab-other"] { background: var(--panel); color: var(--ink); box-shadow: 0 1px 3px rgba(0, 0, 0, .14); }
#itab-claude:focus-visible ~ .lp-seg label[for="itab-claude"],
#itab-chatgpt:focus-visible ~ .lp-seg label[for="itab-chatgpt"],
#itab-other:focus-visible ~ .lp-seg label[for="itab-other"] { outline: 2px solid var(--acc); outline-offset: 2px; }
.lp-panel { display: none; padding: 24px 18px 18px; font-size: 15px; color: var(--ink2); }
#itab-claude:checked ~ .lp-panel-claude,
#itab-chatgpt:checked ~ .lp-panel-chatgpt,
#itab-other:checked ~ .lp-panel-other { display: block; }
.lp-claude-btn { display: flex; align-items: center; justify-content: center; gap: 12px; height: 58px; margin-bottom: 22px; padding: 0 24px; background: var(--claude); color: var(--claude-ink); border-radius: 999px; font-weight: 700; font-size: 17px; box-shadow: 0 14px 34px -14px color-mix(in srgb, var(--claude) 75%, transparent); transition: transform .2s, filter .2s; }
.lp-claude-btn:hover { transform: translateY(-2px); filter: brightness(.94); color: var(--claude-ink); }
.lp-claude-btn .fa-claude { font-size: 20px; }
.lp-claude-btn .fa-arrow-up-right-from-square { font-size: 12px; opacity: .85; }
.lp-steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; counter-reset: lp-step; }
.lp-steps li { display: grid; grid-template-columns: 28px 1fr; gap: 12px; align-items: start; counter-increment: lp-step; }
.lp-steps li::before { content: counter(lp-step); width: 28px; height: 28px; border-radius: 50%; background: var(--acc-soft); color: var(--acc-txt); display: grid; place-items: center; font-size: 13px; font-weight: 800; }
.lp-steps strong { color: var(--ink); }
.lp-panel-note { margin: 16px 0 0; font-size: 14px; color: var(--ink3); }
.lp-panel pre { margin: 0; padding: 18px 20px; background: var(--cta-bg); color: var(--cta-ink); border-radius: 20px; font-family: var(--mono); font-size: 13px; line-height: 1.6; overflow: auto; }
.lp-panel-other .lp-panel-note { margin-top: 14px; color: var(--ink2); }

/* ---------- onboarding ---------- */
.lp-onb { position: relative; margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 14px; }
.lp-onb li { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
.lp-onb-top { display: flex; justify-content: space-between; align-items: center; }
.lp-onb p { margin: 0; font-size: 15px; color: var(--ink2); text-wrap: pretty; }
.lp-onb p b { color: var(--ink); }
.lp-say { margin-top: auto; padding: 12px 14px; background: var(--bg2); border-radius: 16px; font-size: 14px; font-weight: 600; line-height: 1.35; }
.lp-say span { color: var(--ink3); font-weight: 500; }
.lp-note { margin: 18px 0 0; font-size: 14px; color: var(--ink3); }
.lp-tools-cta { margin-top: 28px; display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center; padding: 22px 24px; background: var(--cta-bg); color: var(--cta-ink); border-radius: 28px; position: relative; overflow: hidden; }
.lp-tools-cta:hover { color: var(--cta-ink); }
.lp-tools-cta > span:first-child { width: 48px; height: 48px; border-radius: 16px; background: var(--acc); color: var(--acc-ink); display: grid; place-items: center; font-size: 18px; }
.lp-tools-text { font-size: 15px; opacity: .9; text-wrap: pretty; }
.lp-tools-text b { display: block; font-size: 18px; opacity: 1; }
.lp-tools-go { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--cta-ink) 30%, transparent); font-weight: 700; font-size: 14px; white-space: nowrap; transition: border-color .2s; }
.lp-tools-cta:hover .lp-tools-go { border-color: var(--cta-ink); }
.lp-tools-go i { font-size: 11px; }
@media (max-width: 699px) {
    .lp-tools-cta { grid-template-columns: 1fr; }
    .lp-tools-go { width: 100%; }
}

/* ---------- examples ---------- */
.lp-try { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
.lp-try .lp-head { margin-bottom: 0; gap: 12px 32px; }
.lp-try .lp-head > p { max-width: 40ch; font-size: 18px; }
.lp-ex-bar { display: flex; align-items: center; gap: 12px; min-width: 0; }
html:not(.js) .lp-ex-bar { display: none; }
.lp-ex-tabs { position: relative; flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 2px; scrollbar-width: none; }
.lp-ex-tabs::-webkit-scrollbar { display: none; }
.lp-ex-ring { position: absolute; left: 0; top: 0; width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--line2); box-sizing: border-box; opacity: 0; pointer-events: none; transition: transform .6s var(--ease-out), border-color .5s ease, opacity .3s ease; }
.lp-ex-tab { position: relative; z-index: 1; flex: none; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; transition: transform .2s; }
.lp-ex-tab:hover { transform: scale(1.06); }
.lp-ex-tab > span { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c-icon); transition: background .4s ease, color .4s ease; }
.lp-ex-tab[aria-selected="true"] > span { background: var(--c-icon); color: var(--on-icon); }
.lp-ex-nav { flex: none; display: flex; align-items: center; gap: 8px; }
.lp-ex-count { font-family: var(--mono); font-size: 14px; padding: 0 8px; white-space: nowrap; }
.lp-ex-count span { color: var(--ink3); }
.lp-round { width: 40px; height: 40px; display: grid; place-items: center; padding: 0; border-radius: 50%; border: 1px solid var(--line2); background: var(--panel); color: var(--ink); cursor: pointer; font-size: 14px; }
.lp-round:hover { background: var(--bg2); }
.lp-round:disabled { opacity: .4; cursor: default; }
@media (max-width: 699px) {
    .lp-ex-tabs { flex-wrap: nowrap; overflow-x: auto; scroll-behavior: smooth; }
    .lp-ex-count { display: none; }
}
.lp-ex-box { --c: var(--cal); position: relative; overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: 32px; box-shadow: var(--shadow); padding: clamp(14px, 2vw, 22px); display: grid; gap: 28px; }
.lp-ex-blob { position: absolute; left: -140px; top: -160px; width: 520px; height: 520px; border-radius: 50%; background: var(--c); opacity: .16; filter: blur(110px); pointer-events: none; transition: background .4s; }
.lp-ex-panel { position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: clamp(16px, 2.4vw, 28px); align-items: stretch; }
html.js .lp-ex-panel:not(.is-on) { display: none; }
.lp-ex-info { position: relative; padding: clamp(12px, 2.4vw, 32px); display: grid; gap: 22px; align-content: start; }
html.js .lp-ex-panel.is-on .lp-ex-info { animation: nm-rise .4s both; }
.lp-ex-title { display: flex; align-items: center; gap: 18px; }
.lp-ex-icon { flex: none; width: clamp(60px, 6vw, 80px); height: clamp(60px, 6vw, 80px); border-radius: 24px; background: var(--c-icon); color: var(--on-icon); display: grid; place-items: center; font-size: clamp(24px, 2.4vw, 32px); box-shadow: 0 18px 40px -16px var(--c); }
.lp-ex-title h3 { margin: 0; font-weight: 800; font-size: clamp(30px, 3.6vw, 46px); line-height: 1; letter-spacing: -0.04em; text-wrap: balance; }
.lp-ex-desc { margin: 0; font-size: clamp(17px, 1.6vw, 21px); line-height: 1.5; color: var(--ink2); text-wrap: pretty; max-width: 36ch; }
.lp-ex-tools { padding-top: 22px; border-top: 1px solid var(--line); display: grid; gap: 10px; justify-items: start; }
.lp-ex-tools p { margin: 0; font-size: 16px; color: var(--ink2); text-wrap: pretty; }
.lp-chip { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line); font-family: var(--mono); font-size: 14px; color: var(--ink); }
.lp-chip:hover { border-color: var(--line2); color: var(--ink); }
.lp-chip .fa-plug { font-size: 11px; color: var(--ink3); }
.lp-chip .fa-arrow-right { font-size: 10px; }
.lp-ex-tools .lp-ex-also { margin: 10px 0 0; font-family: var(--mono); font-size: 12px; letter-spacing: .06em; color: var(--ink3); }
.lp-ex-more { display: grid; gap: 8px; justify-items: start; }
.lp-ex-more .lp-chip { height: 32px; padding: 0 12px; font-size: 13px; }
.lp-ex-more p { font-size: 15px; }
.lp-ex-chat { position: relative; background: var(--bg); border: 1px solid var(--line); border-radius: 28px; padding: 14px 16px; display: flex; flex-direction: column; height: 580px; min-width: 0; }
.lp-ex-thread { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; display: flex; flex-direction: column; gap: 12px; padding: 14px 4px 14px 0; }
.lp-ex-thread > * { flex: none; }
html.js .lp-ex-panel.is-on .lp-ex-thread > * { animation: nm-rise .35s both; }

/* ---------- live stats ---------- */
.lp-stats { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
.lp-stats .lp-head { margin-bottom: 10px; }
.lp-stats .lp-head > div:first-child { display: grid; gap: 14px; }
.lp-stats .lp-head > div:first-child > p { margin: 0; max-width: 46ch; color: var(--ink2); text-wrap: pretty; }
.lp-units { display: flex; gap: 2px; padding: 4px; background: var(--bg2); border-radius: 999px; font-size: 14px; font-weight: 600; }
.lp-units button { height: 38px; padding: 0 18px; border: 0; border-radius: 999px; cursor: pointer; font: inherit; color: var(--ink); background: transparent; transition: background .2s, box-shadow .2s; }
.lp-units button[aria-pressed="true"] { background: var(--panel); box-shadow: 0 1px 3px rgba(0, 0, 0, .12); }
.lp-meta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 16px; font-size: 14px; font-weight: 600; color: var(--ink2); }
.lp-meta > span:first-child { display: inline-flex; align-items: center; gap: 10px; }
.lp-meta svg { display: block; transform: rotate(-90deg); }
.lp-meta b { color: var(--ink); font-variant-numeric: tabular-nums; }
#stats-ring { animation: nm-ring 5s linear both; }
.lp-since { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: var(--acc-soft); color: var(--acc-txt); font-family: var(--mono); font-size: 13px; font-weight: 500; }
.lp-since i { font-size: 11px; }
.lp-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, max(160px, calc((100% - 42px) / 4))), 1fr)); gap: 14px; }
.lp-tile { --c: var(--acc); min-width: 0; box-sizing: border-box; position: relative; overflow: hidden; background: var(--panel); border: 1px solid var(--line); border-radius: 28px; padding: 24px; box-shadow: var(--shadow); display: grid; gap: 26px; align-content: space-between; transition: border-color .8s ease, box-shadow .8s ease; }
.lp-tile:first-child { grid-column: span 2; }
@media (max-width: 380px) { .lp-tile:first-child { grid-column: auto; } }
.lp-tile[hidden] { display: none; }
.lp-tile.is-live { border-color: color-mix(in srgb, var(--c) 45%, var(--line)); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 12%, transparent), var(--shadow); }
.lp-tile-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
.lp-tile .nm-tile { width: 44px; height: 44px; border-radius: 16px; font-size: 16px; }
.lp-delta { font-family: var(--mono); font-size: 13px; font-weight: 600; padding: 4px 9px; white-space: nowrap; border-radius: 999px; background: var(--acc-soft); color: color-mix(in srgb, var(--acc) 72%, var(--ink)); font-variant-numeric: tabular-nums; animation: nm-chipup 1.4s cubic-bezier(.16, 1, .3, 1) both; }
.lp-delta.down { background: color-mix(in srgb, var(--fat) 14%, var(--panel)); color: color-mix(in srgb, var(--fat) 70%, var(--ink)); }
.lp-fig { display: flex; align-items: baseline; font-size: clamp(30px, 3vw, 40px); font-weight: 800; letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }
.lp-odo { display: inline-flex; height: 1em; overflow: hidden; }
.lp-odo-d { display: inline-block; width: .58em; height: 1em; overflow: hidden; text-align: center; transition: width 1.8s cubic-bezier(.16, 1, .3, 1); }
.lp-odo-col { display: flex; flex-direction: column; align-items: center; transition: transform 1.8s cubic-bezier(.16, 1, .3, 1); }
.lp-odo-col span { height: 1em; line-height: 1; }
.lp-odo-sep { display: inline-block; width: .27em; height: 1em; text-align: center; }
.lp-unit { font-size: 16px; font-weight: 600; margin-left: 6px; letter-spacing: 0; color: var(--ink2); }
.lp-tile .odo-cap { display: block; margin-top: 12px; font-size: 16px; font-weight: 500; color: var(--ink2); }
.lp-map { padding: clamp(18px, 2.6vw, 32px); display: grid; gap: 18px; }
.lp-map[hidden], .lp-tiles[hidden], .lp-meta[hidden] { display: none; }
.lp-map-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px 16px; }
.lp-tz { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px 10px 14px; border-radius: 999px; background: var(--acc-soft); color: var(--acc-txt); font-size: 15px; font-weight: 700; }
.lp-tz b { font-size: 20px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.lp-map-note { font-family: var(--mono); font-size: 13px; color: var(--ink3); }
.lp-map-wrap svg { width: 100%; height: auto; display: block; }
.lp-land { fill: var(--map-land); }
.lp-tz-halo { fill: var(--map-halo); opacity: var(--map-halo-op); transform-box: fill-box; transform-origin: center; animation: nm-tzpulse 3s ease-in-out infinite; transition: r 1.2s ease; }
.lp-tz-core { fill: var(--map-core); }
.lp-map-foot { margin: 0; padding-top: 16px; border-top: 1px solid var(--line); display: flex; align-items: baseline; gap: 10px; font-size: 14px; line-height: 1.5; color: var(--ink2); }
.lp-map-foot i { color: var(--acc-txt); font-size: 13px; flex: none; }

/* ---------- features ---------- */
.lp-feat { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.lp-feat article { padding: 24px; display: grid; gap: 14px; align-content: start; }
.lp-feat .nm-tile { width: 44px; height: 44px; border-radius: 16px; font-size: 17px; }
.lp-feat h3 { margin: 0; font-weight: 800; font-size: 20px; letter-spacing: -0.02em; line-height: 1.2; }
.lp-feat p { margin: 8px 0 0; font-size: 15px; color: var(--ink2); text-wrap: pretty; }

/* ---------- why + trust ---------- */
.lp-why .lp-head > p { max-width: 40ch; }
.lp-why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px; }
.lp-why-old, .lp-why-new { border: 1px solid var(--line); border-radius: 28px; padding: 28px; }
.lp-why-old { background: var(--bg2); }
.lp-why-new { position: relative; overflow: hidden; background: var(--cta-bg); color: var(--cta-ink); }
.lp-why-new .nm-blob { right: -80px; top: auto; bottom: -120px; width: 320px; height: 320px; opacity: .28; filter: blur(80px); }
.lp-why-grid h3 { position: relative; margin: 0 0 18px; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
.lp-why-old h3 { color: var(--ink2); }
.lp-why-grid ul { position: relative; margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.lp-why-old ul { color: var(--ink2); }
.lp-why-grid li { display: flex; gap: 12px; align-items: center; }
.lp-why-grid li > i { flex: none; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; }
.lp-why-old li > i { background: var(--line); color: var(--ink3); }
.lp-why-new li > i { background: var(--acc); color: var(--acc-ink); }
.lp-why-note { margin: 20px 0 0; font-size: 15px; color: var(--ink2); }
.lp-why-note a { color: var(--acc-txt); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.lp-trust { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.lp-trust > div { display: flex; gap: 12px; align-items: center; padding: 16px 18px; background: var(--panel); border: 1px solid var(--line); border-radius: 20px; }
.lp-trust .nm-tile { width: 38px; height: 38px; border-radius: 12px; background: var(--acc-soft); color: var(--acc-txt); font-size: 14px; }
.lp-trust > div > span:last-child { font-size: 14px; color: var(--ink2); line-height: 1.35; }
.lp-trust b { display: block; color: var(--ink); font-size: 15px; }

/* ---------- support ---------- */
.lp-support { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 12px; align-items: stretch; }
.lp-free, .lp-paid { border-radius: 28px; padding: clamp(24px, 3vw, 36px); display: grid; gap: 18px; align-content: start; }
.lp-free { background: var(--tile); border: 1px solid var(--line); }
.lp-free > p { margin: 0; color: var(--ink2); text-wrap: pretty; max-width: 44ch; }
.lp-tier { margin-top: 6px; padding-top: 20px; border-top: 1px solid var(--line); display: grid; gap: 12px; }
.lp-tier-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.lp-tier h3, .lp-paid-eyebrow { margin: 0; font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--ink2); }
.lp-tier-head b { font-size: 44px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; }
.lp-tier p { margin: 0; color: var(--ink2); font-size: 15px; text-wrap: pretty; max-width: 44ch; }
.lp-follow { justify-self: start; height: 46px; padding: 0 18px; border: 1px solid var(--line2); background: transparent; color: var(--ink); font-weight: 600; font-size: 16px; }
.lp-follow:hover { background: var(--bg2); color: var(--ink); }
.lp-follow i, .lp-paid .fa-patreon { font-size: 12px; }
.lp-paid { position: relative; overflow: hidden; background: var(--cta-bg); color: var(--cta-ink); }
.lp-paid .nm-blob { right: -100px; top: auto; bottom: -140px; width: 380px; height: 380px; background: var(--pop); opacity: .25; filter: blur(90px); }
.lp-paid > :not(.nm-blob) { position: relative; }
.lp-paid-eyebrow { color: var(--acc-on-dark); }
.lp-paid h3 { margin: 0; font-weight: 800; font-size: clamp(30px, 3.8vw, 48px); line-height: 1; letter-spacing: -0.035em; text-wrap: balance; }
.lp-paid > p { margin: 0; opacity: .88; text-wrap: pretty; max-width: 42ch; }
.lp-paid-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.lp-paid-ctas .nm-btn { height: 50px; padding: 0 20px; font-size: 16px; }
.lp-pop { background: var(--pop); color: var(--pop-ink); }
.lp-pop:hover { color: var(--pop-ink); filter: brightness(1.05); }
.lp-support .patreon-updates { grid-column: 1 / -1; max-width: none; margin: 20px 0 0; display: grid; gap: 14px; }
.lp-support .patreon-updates[hidden] { display: none; }
.lp-posts-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 6px 16px; padding: 0 4px; }
.lp-posts-head h3 { margin: 0; display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
.lp-posts-head h3 .fa-patreon { font-size: 17px; }
.lp-posts-head > span { font-size: 15px; color: var(--ink2); }
.lp-free-badge { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--acc-soft); color: var(--acc-txt); font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; }
.lp-posts { --per: 3; display: grid; grid-template-columns: repeat(var(--per), minmax(0, 1fr)); gap: 14px; }
.lp-post { min-width: 0; display: grid; gap: 10px; align-content: start; padding: 22px 24px; background: var(--panel); border: 1px solid var(--line); border-radius: 28px; box-shadow: var(--shadow); color: var(--ink); animation: nm-rise .45s var(--ease-out) both; transition: transform .25s, border-color .25s; }
.lp-post:hover { transform: translateY(-3px); border-color: var(--line2); color: var(--ink); }
.lp-post b { font-size: 18px; font-weight: 800; letter-spacing: -0.015em; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-post-preview { font-size: 15px; color: var(--ink2); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.lp-post-link { margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--acc-txt); }
.lp-post-link i { font-size: 11px; }
.lp-pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 6px; }
.lp-pager[hidden] { display: none; }
.lp-pager .lp-round { width: 44px; height: 44px; font-size: 13px; }
.lp-dots { display: flex; align-items: center; flex-wrap: wrap; justify-content: center; }
.lp-dots button { height: 32px; padding: 0 3px; border: 0; background: transparent; cursor: pointer; display: grid; place-items: center; }
.lp-dots span { display: block; width: 8px; height: 8px; border-radius: 999px; background: var(--line2); transition: width .45s var(--ease-out), background .3s ease; }
.lp-dots [aria-current="true"] span { width: 28px; background: var(--acc); }

/* ---------- closing CTA ---------- */
.lp-cta-sec { padding-top: clamp(24px, 3vw, 40px); padding-bottom: clamp(24px, 3vw, 40px); }
.lp-cta { padding: clamp(28px, 6vw, 88px) clamp(20px, 6vw, 88px); text-align: center; }
.lp-cta .nm-blob { width: 400px; height: 400px; filter: blur(90px); }
.lp-cta .nm-blob.b1 { left: -60px; right: auto; top: auto; bottom: -140px; background: var(--car); opacity: .28; }
.lp-cta .nm-blob.b2 { right: -60px; top: -140px; background: var(--pro); opacity: .24; }
.lp-cta h2 { position: relative; margin: 0 auto; max-width: 16ch; font-size: clamp(36px, 5.6vw, 78px); line-height: .98; letter-spacing: -0.045em; }
.lp-cta > p { position: relative; margin: 18px auto 0; max-width: 40ch; opacity: .8; }
.lp-cta-btns { position: relative; display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: 30px; }

/* ---------- contact ---------- */
.lp-contact { overflow: hidden; padding: clamp(28px, 4vw, 48px); display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 24px; align-items: center; }
.lp-contact .nm-blob { left: -120px; right: auto; top: -160px; width: 420px; height: 420px; opacity: .14; filter: blur(100px); }
.lp-contact > div { position: relative; display: grid; gap: 14px; }
.lp-contact > div:last-child { gap: 12px; justify-items: start; }
.lp-contact p { margin: 0; color: var(--ink2); text-wrap: pretty; max-width: 42ch; }
.lp-mail { font-family: var(--mono); font-size: clamp(16px, 1.8vw, 20px); color: var(--ink); text-decoration: underline; text-decoration-color: var(--line2); text-underline-offset: 5px; word-break: break-all; }
.lp-mail:hover { color: var(--acc-txt); }
.lp-contact .nm-btn { font-size: 15px; padding: 0 24px; }

/* ---------- faq ---------- */
.lp-faq { display: flex; flex-wrap: wrap; gap: clamp(24px, 4vw, 56px); align-items: flex-start; }
.lp-faq > div:first-child { flex: 1 1 280px; }
.lp-faq-list { flex: 2 1 520px; min-width: 0; padding: 6px clamp(14px, 2vw, 26px); counter-reset: lp-faq; }
.lp-faq-list details { border-bottom: 1px solid var(--line); counter-increment: lp-faq; }
.lp-faq-list details:last-child { border-bottom: 0; }
.lp-faq-list summary { display: grid; grid-template-columns: 24px 1fr 30px; gap: 16px; align-items: center; padding: 18px 4px; font-weight: 700; font-size: 17px; letter-spacing: -0.01em; line-height: 1.3; cursor: pointer; list-style: none; }
.lp-faq-list summary::-webkit-details-marker { display: none; }
.lp-faq-list summary::before { content: counter(lp-faq, decimal-leading-zero); font-family: var(--mono); font-size: 12px; font-weight: 500; color: var(--ink3); }
.lp-faq-list summary::after {
    content: ""; width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(currentColor, currentColor) center / 10px 2px no-repeat, linear-gradient(currentColor, currentColor) center / 2px 10px no-repeat, var(--bg2);
    color: var(--ink2); transition: background-color .2s, color .2s;
}
.lp-faq-list details[open] summary::after { background: linear-gradient(currentColor, currentColor) center / 10px 2px no-repeat, var(--ink); color: var(--bg); }
.lp-faq-list summary:hover { color: var(--acc-txt); }
.lp-faq-list details > p { margin: 0; padding: 0 46px 20px 44px; color: var(--ink2); font-size: 15px; max-width: 66ch; text-wrap: pretty; animation: nm-rise .25s both; }
.lp-faq-list details > p a { color: var(--acc-txt); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 559px) {
    .lp-faq-list summary { grid-template-columns: 22px 1fr 30px; gap: 12px; font-size: 16px; }
    .lp-faq-list details > p { padding: 0 4px 20px 38px; }
}

/* ---------- phones ---------- */
@media (max-width: 699px) {
    html { scrollbar-width: none; }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }
    .lp-ctas .nm-btn, .lp-ctas .lp-support-btn, .lp-cta-btns .nm-btn, .lp-support .nm-btn, .lp-contact .nm-btn { width: 100%; }
    .lp-follow { justify-self: stretch; }
}
`;

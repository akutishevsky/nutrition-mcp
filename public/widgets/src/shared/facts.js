// Facts Panel markup builders — pairs with shared/facts.css.
// Requires esc(), fmt(), pct() and clamp() in scope (shared/ui.js, or the
// gallery's local equivalents). The band glyph geometry is taken verbatim
// from the shipped mark public/brand/munch-mark-light.svg (tile treatment:
// cream apple, green leaf, on the deep green band) — never redraw it here.
const FACTS_MARK_SVG =
    '<svg class="f-band-mark" viewBox="0 0 192 192" role="img" aria-label="Munch"><path fill="#F5EFE2" fill-rule="evenodd" d="M 96 60.8 C 83.2 48 52.8 46.4 44.8 73.6 C 37.6 97.6 43.2 128 60.8 142.4 C 73.6 152.8 86.4 148.8 96 145.6 C 105.6 148.8 118.4 152.8 131.2 142.4 C 148.8 128 154.4 97.6 147.2 73.6 C 139.2 46.4 108.8 48 96 60.8 Z M 60.0 81.6 H 132.0 A 2.4 2.4 0 0 1 134.4 84.0 V 87.99999999999999 A 2.4 2.4 0 0 1 132.0 90.39999999999999 H 60.0 A 2.4 2.4 0 0 1 57.6 87.99999999999999 V 84.0 A 2.4 2.4 0 0 1 60.0 81.6 Z M 59.2 97.6 H 132.8 A 1.6 1.6 0 0 1 134.4 99.19999999999999 V 99.2 A 1.6 1.6 0 0 1 132.8 100.8 H 59.2 A 1.6 1.6 0 0 1 57.6 99.2 V 99.19999999999999 A 1.6 1.6 0 0 1 59.2 97.6 Z M 60.0 106.4 H 108.0 A 2.4 2.4 0 0 1 110.4 108.80000000000001 V 108.8 A 2.4 2.4 0 0 1 108.0 111.2 H 60.0 A 2.4 2.4 0 0 1 57.6 108.8 V 108.80000000000001 A 2.4 2.4 0 0 1 60.0 106.4 Z M 59.2 116.8 H 132.8 A 1.6 1.6 0 0 1 134.4 118.39999999999999 V 118.4 A 1.6 1.6 0 0 1 132.8 120.0 H 59.2 A 1.6 1.6 0 0 1 57.6 118.4 V 118.39999999999999 A 1.6 1.6 0 0 1 59.2 116.8 Z"/><path d="M 96 60.8 C 94.4 49.6 97.6 40 104.8 34.4" fill="none" stroke="#F5EFE2" stroke-width="7.2" stroke-linecap="round"/><path fill="#5DA85F" d="M 106.4 43.2 C 111.2 28 125.6 24 134.4 28 C 132.8 41.6 120.8 48.8 106.4 43.2 Z"/></svg>';

function factsBand(title, right, titleTag) {
    const tag = titleTag === "span" || titleTag === "h2" ? titleTag : "h1";
    return `<div class="f-band">${FACTS_MARK_SVG}<${tag} class="f-band-title">${esc(title)}</${tag}>${right ? `<span class="f-band-right">${esc(right)}</span>` : ""}</div>`;
}

function factsHero(numHtml, cap, sideV, sideC) {
    const side =
        sideV != null && sideV !== ""
            ? `<div class="f-hero-side"><div class="f-hero-side-v">${sideV}</div>${sideC ? `<div class="f-hero-side-c">${esc(sideC)}</div>` : ""}</div>`
            : "";
    return `<div class="f-hero"><div><div class="f-hero-num">${numHtml}</div>${cap ? `<div class="f-hero-cap">${esc(cap)}</div>` : ""}</div>${side}</div>`;
}

// One label row. opts: { name, ofText, valueText, goal, value, unit,
// showBar, source, sourceLabel }. The % share column is value/goal, the
// label's %DV position. source renders on the row, under the bar.
function factsLabelRow(opts) {
    const percentage = pct(opts.value, opts.goal);
    const over = percentage != null && percentage > 100;
    const width = percentage == null ? 0 : clamp(percentage, 0, 100);
    const pctCell =
        opts.showBar === false
            ? ""
            : `<span class="f-lrow-pct${over ? " over" : ""}">${percentage == null ? "—" : `${percentage}%`}</span>`;
    const bar =
        opts.showBar === false
            ? ""
            : `<div class="f-bar" role="progressbar" aria-label="${esc(opts.name)}" aria-valuemin="0" aria-valuemax="${opts.goal ?? 100}" aria-valuenow="${opts.value ?? 0}"><span class="f-bar-fill${over ? " over" : ""}" style="width:${width}%"></span></div>`;
    const src = opts.source
        ? `<div class="f-src">Source · <b>${esc(opts.source)}</b></div>`
        : "";
    return `<div class="f-lrow"><div class="f-lrow-top"><span class="f-lrow-name">${esc(opts.name)}</span>${opts.ofText ? `<span class="f-lrow-of">${esc(opts.ofText)}</span>` : ""}<span class="f-lrow-val num">${esc(opts.valueText)}</span>${pctCell}</div>${bar}${src}</div>`;
}

// Targets-state row: a goal on its own — value only, no bar, no % column.
function factsTargetRow(opts) {
    return `<div class="f-lrow"><div class="f-lrow-top"><span class="f-lrow-name">${esc(opts.name)}</span>${opts.ofText ? `<span class="f-lrow-of">${esc(opts.ofText)}</span>` : ""}<span class="f-lrow-val num">${esc(opts.valueText)}</span></div>${opts.source ? `<div class="f-src">Source · <b>${esc(opts.source)}</b></div>` : ""}</div>`;
}

// Compact row for lists longer than 6: one line, source as a marker.
function factsCompactRow(opts) {
    return `<div class="f-crow"><span class="f-crow-marker" aria-hidden="true"></span><span class="f-crow-name">${esc(opts.name)}</span>${opts.meta ? `<span class="f-crow-meta">${esc(opts.meta)}</span>` : ""}<span class="f-crow-val num">${esc(opts.valueText)}</span></div>`;
}

function factsState(kind, title, body) {
    return `<div class="f-state${kind === "error" ? " f-state-error" : ""}"><strong>${esc(title)}</strong><span>${esc(body)}</span></div>`;
}

function factsCardState(title, right, kind, stateTitle, stateBody) {
    return `<article class="card">${factsBand(title, right)}${factsState(kind, stateTitle, stateBody)}</article>`;
}

function factsBanner(kind, html) {
    return `<div class="f-banner${kind ? ` ${esc(kind)}` : ""}">${html}</div>`;
}

// Sticky action bar for write surfaces. confirmHtml is the confirm copy
// ("Nothing is saved until you tap ...") and lives inside the bar zone.
function factsStickyBar(
    primaryId,
    primaryLabel,
    secondaryId,
    secondaryLabel,
    confirmHtml,
) {
    return `<div class="f-sticky-bar"><div class="f-sticky-actions"><button class="f-btn-primary" id="${esc(primaryId)}">${esc(primaryLabel)}</button>${secondaryId ? `<button class="btn" id="${esc(secondaryId)}">${esc(secondaryLabel || "")}</button>` : ""}</div>${confirmHtml ? `<div class="f-sticky-confirm">${confirmHtml}</div>` : ""}</div>`;
}

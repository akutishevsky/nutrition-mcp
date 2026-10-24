// Half-gauge hero for meal-logged and nutrition-summary (the 2026-10
// redesign). Pure markup builders: no DOM access and no event wiring at load,
// so a test can evaluate the template's script without a document. Styles in
// shared/gauge.css; the controller that mounts it is in shared/nutrients.js.
//
// Requires T / WIDGET_LOCALE (shared/i18n.js) and esc() from the template.
//
// Geometry is the artboards' own: a 120-unit arc centred on (150, 146) drawn
// in a 278 × 160 viewBox, every path with pathLength 100, so a dash length is
// a percentage of the arc.

const GAUGE_ARC = "M 30 146 A 120 120 0 0 1 270 146";
const GAUGE_GEO = { cx: 150, cy: 146, r: 120, w: 14, rc: 4 };

function gaugeClamp01(v) {
    return Math.max(0, Math.min(Number(v) || 0, 1));
}

// A point on a circle of radius `r` at `p` percent along the half arc.
function gaugePoint(r, p) {
    const an = ((180 + 1.8 * p) * Math.PI) / 180;
    return (
        (GAUGE_GEO.cx + r * Math.cos(an)).toFixed(2) +
        " " +
        (GAUGE_GEO.cy + r * Math.sin(an)).toFixed(2)
    );
}

// The arc percentage a corner of radius rc takes at radius r.
function gaugeCornerP(r) {
    return ((GAUGE_GEO.rc / r) * 180) / Math.PI / 1.8;
}

// One meal's filled annular sector from p0 to p1 (percent): round ends where
// the bar starts and where it ends (rs/re), 4px soft corners at the
// boundaries between meals.
function gaugeSegPath(p0, p1, rs, re) {
    const G = GAUGE_GEO;
    const Ro = G.r + G.w,
        Ri = G.r - G.w,
        W = G.w,
        RC = G.rc;
    const os = rs ? gaugePoint(Ro, p0) : gaugePoint(Ro, p0 + gaugeCornerP(Ro));
    let d =
        "M " +
        os +
        " A " +
        Ro +
        " " +
        Ro +
        " 0 0 1 " +
        (re ? gaugePoint(Ro, p1) : gaugePoint(Ro, p1 - gaugeCornerP(Ro)));
    d += re
        ? " A " + W + " " + W + " 0 0 1 " + gaugePoint(Ri, p1)
        : " Q " +
          gaugePoint(Ro, p1) +
          " " +
          gaugePoint(Ro - RC, p1) +
          " L " +
          gaugePoint(Ri + RC, p1) +
          " Q " +
          gaugePoint(Ri, p1) +
          " " +
          gaugePoint(Ri, p1 - gaugeCornerP(Ri));
    d +=
        " A " +
        Ri +
        " " +
        Ri +
        " 0 0 0 " +
        (rs ? gaugePoint(Ri, p0) : gaugePoint(Ri, p0 + gaugeCornerP(Ri)));
    d += rs
        ? " A " + W + " " + W + " 0 0 1 " + os
        : " Q " +
          gaugePoint(Ri, p0) +
          " " +
          gaugePoint(Ri + RC, p0) +
          " L " +
          gaugePoint(Ro - RC, p0) +
          " Q " +
          gaugePoint(Ro, p0) +
          " " +
          os;
    return d + " Z";
}

// Per-meal segments on the arc, as the summary artboard draws them: one
// boundary per meal end (percent of the goal), kept only when it is at least
// two corner-widths from the previous kept edge and from the end, so a tiny
// snack merges into its neighbour instead of drawing a sliver. `meals` is
// [{ kcal, name }] in eating order and must add up to the day's total;
// returns null when there is nothing to split (one meal, nothing eaten, no
// boundary kept, or more than 8 segments), and the solid arc is drawn.
function gaugeSegments(meals, goal) {
    if (!Array.isArray(meals) || meals.length < 2 || !(goal > 0)) return null;
    const total = meals.reduce((s, m) => s + (m.kcal || 0), 0);
    if (!(total > 0)) return null;
    const end = Math.min((total / goal) * 100, 100);
    const GAP = 1.1,
        HG = GAP / 2,
        MINL = 2 * gaugeCornerP(GAUGE_GEO.r - GAUGE_GEO.w) + 0.6;
    let cum = 0;
    const bnd = [];
    meals.slice(0, -1).forEach((m, i) => {
        cum += m.kcal || 0;
        bnd.push({ p: Math.min((cum / goal) * 100, 100), i });
    });
    const keep = [];
    let last = 0;
    for (const x of bnd) {
        if (x.p - last >= MINL + HG && end - x.p >= MINL + HG) {
            keep.push(x);
            last = x.p;
        }
    }
    if (!keep.length) return null;
    const edges = [{ p: 0, i: -1 }, ...keep, { p: end, i: meals.length - 1 }];
    if (edges.length - 1 > 8) return null;
    const segs = [];
    for (let s = 0; s < edges.length - 1; s++) {
        const lastSeg = s === edges.length - 2;
        const s0 = s === 0 ? 0 : edges[s].p + HG;
        const e0 = lastSeg ? edges[s + 1].p : edges[s + 1].p - HG;
        const from = edges[s].i + 1,
            to = edges[s + 1].i;
        let rep = from,
            best = -1,
            kcal = 0;
        const names = [];
        for (let mi = from; mi <= to; mi++) {
            const v = meals[mi].kcal || 0;
            names.push(meals[mi].name);
            kcal += v;
            if (v > best) {
                best = v;
                rep = mi;
            }
        }
        segs.push({
            d: gaugeSegPath(s0, Math.max(e0, s0 + 0.01), s === 0, lastSeg),
            from,
            to,
            rep,
            names,
            kcal,
        });
    }
    return segs;
}

// The percent pill: a white cap riding the end of the fill, the figure
// rotated to the arc's tangent. Its length is in arc percent.
function gaugePill(pctTxt, fillEnd) {
    const len = Math.max(pctTxt.length * 9.5 - 8, 1) / 3.77;
    const end = Math.min(Math.max(fillEnd, len), 100);
    const start = end - len,
        mid = start + len / 2;
    const an = ((180 + 1.8 * mid) * Math.PI) / 180;
    return {
        dash: len.toFixed(2) + " 100",
        off: (-start).toFixed(2),
        x: (((150 + 120 * Math.cos(an) - 11) / 278) * 100).toFixed(2),
        y: (((146 + 120 * Math.sin(an) - 6) / 160) * 100).toFixed(2),
        rot: (90 + 1.8 * mid + 180).toFixed(1),
    };
}

// A figure as rolling digit columns (aria-hidden; the button carries the
// spoken value). A 0 stops on the column's trailing 0 so it rolls too.
function gaugeReels(str) {
    let di = 0;
    return String(str)
        .split("")
        .map((ch) => {
            if (!/[0-9]/.test(ch)) return `<span>${esc(ch)}</span>`;
            const d = Number(ch);
            const y = d === 0 ? 10 : d;
            return `<span class="rl"><span class="rs" style="--i:${di++};transform:translateY(-${y}em)"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>0</span></span></span>`;
        })
        .join("");
}

// The gauge block. `g`: { over, pre, add, addOff, segs, pctTxt, numTxt,
// glab, aria, btnLabel, calOpen, picked (segment index or -1) } — pre / add /
// addOff in arc percent.
function gaugeHtml(g) {
    const segs = Array.isArray(g.segs) ? g.segs : null;
    const fillEnd = segs ? g.add : g.addOff != null ? -g.addOff + g.add : g.add;
    // No calorie goal: no percent, so no pill.
    const pill = g.pctTxt ? gaugePill(g.pctTxt, fillEnd) : null;
    const segPaths = segs
        ? segs
              .map(
                  (s, i) =>
                      `<path class="gseg${g.picked === i ? " on" : ""}" style="--i:${i}" data-act="seg" data-i="${i}" d="${s.d}"><title>${esc(s.tip || "")}</title></path>`,
              )
              .join("")
        : "";
    const add =
        !segs && g.add > 0
            ? `<path class="gadd" pathLength="100" d="${GAUGE_ARC}" style="stroke-dasharray:${g.add.toFixed(2)} 100${g.addOff != null ? `;stroke-dashoffset:${g.addOff.toFixed(2)}` : ""}" data-act="cal"></path>`
            : "";
    const pre =
        g.pre > 0
            ? `<path class="gpre" pathLength="100" d="${GAUGE_ARC}" style="stroke-dasharray:${g.pre.toFixed(2)} 100"></path>`
            : "";
    const cls =
        "gw" +
        (g.over ? " over" : "") +
        (segs && g.picked >= 0 ? " picked" : "");
    // The label sits on the drawing, not the wrapper: a role="img" wrapper
    // would make the centre button inside it presentational, unreachable by
    // a screen reader.
    return `<div class="${cls}">
  <svg viewBox="11 6 278 160" role="img" aria-label="${esc(g.aria)}">
    <path class="gtrk" pathLength="100" d="${GAUGE_ARC}"></path>${pre}${add}${segPaths}
    ${pill ? `<path class="gcap" pathLength="100" d="${GAUGE_ARC}" style="stroke-dasharray:${pill.dash};stroke-dashoffset:${pill.off}"></path>` : ""}
  </svg>
  ${pill ? `<span class="gpt2 num" aria-hidden="true" style="left:${pill.x}%;top:${pill.y}%;transform:translate(-50%,-50%) rotate(${pill.rot}deg)">${gaugeReels(g.pctTxt)}</span>` : ""}
  <button type="button" class="reset gbtn" data-act="cal" data-fk="cal" aria-expanded="${g.calOpen ? "true" : "false"}" aria-label="${esc(g.btnLabel)}">
    <span class="gemo" aria-hidden="true">🔥</span>
    <span class="gnum num" aria-hidden="true">${gaugeReels(g.numTxt)}</span>
    <span class="glab num" aria-hidden="true">${esc(g.glab)}</span>
  </button>
</div>`;
}

// The Show more / Show less pill.
function gaugePillButton(open) {
    return `<button type="button" class="reset bigchev" data-act="tog" data-fk="tog" aria-expanded="${open ? "true" : "false"}"><span class="bctxt">${esc(open ? T.nutritionSummary.showLess : T.nutritionSummary.showMore)}</span><svg width="14" height="9" viewBox="0 0 34 22" aria-hidden="true"><path d="M5 5l12 12 12-12"></path></svg></button>`;
}

// The desktop stat row: [{ label, value, small, over }].
function gaugeStatsHtml(stats) {
    return `<div class="gstats">${stats
        .map(
            (s) =>
                `<div class="gs"><span class="gsl">${esc(s.label)}</span><b class="num${s.over ? " over" : ""}">${esc(s.value)}${s.small ? ` <small>${esc(s.small)}</small>` : ""}</b></div>`,
        )
        .join("")}</div>`;
}

// Macro panel builder — shared by every widget that shows intake vs goal.
//
// Renders calories as a full-width hero ring, protein/carbs/fat as three smaller
// rings in one card, and water as a full-width progress bar. Pairs with
// shared/macros.css (layout) and shared/ring.css (the gauge).
//
// Requires fmt(n, decimals) and esc(s) to already be defined in the widget scope.
//
// Data contract: `vals` and `goal` are plain objects keyed by macro
// (`calories`, `protein_g`, `carbs_g`, `fat_g`, `water_ml`) — e.g. a day's totals,
// a range's averages, or a computed slice. `wording` tunes the caption verb for
// the remaining amount: { under: "left" | "under", over: "over" } (default
// "left" / "over").
const MACROS = [
    {
        key: "calories",
        label: "Calories",
        unit: "kcal",
        color: "var(--calories)",
        decimals: 0,
    },
    {
        key: "protein_g",
        label: "Protein",
        unit: "g",
        color: "var(--protein)",
        decimals: 0,
    },
    {
        key: "carbs_g",
        label: "Carbs",
        unit: "g",
        color: "var(--carbs)",
        decimals: 0,
    },
    {
        key: "fat_g",
        label: "Fat",
        unit: "g",
        color: "var(--fat)",
        decimals: 0,
    },
    {
        key: "water_ml",
        label: "Water",
        unit: "ml",
        color: "var(--water)",
        decimals: 0,
    },
];

// value vs goal → filled fraction, centre % caption, and the caption line. The
// ring keeps its macro colour even past 100% so the gauges stay distinct; only
// the % caption / value turns red to flag going over goal.
function macroBits(m, vals, goal, wording) {
    const underWord = (wording && wording.under) || "left";
    const overWord = (wording && wording.over) || "over";
    const val = vals?.[m.key] ?? 0;
    const target = goal?.[m.key] ?? null;

    let pct = null;
    let over = false;
    if (target != null && target > 0) {
        pct = (val / target) * 100;
        over = pct > 100;
    }
    const frac = pct == null ? 0 : Math.max(0, Math.min(pct, 100)) / 100;
    const pctColor = over ? "var(--over)" : m.color;

    let goalLine, center2;
    if (pct == null) {
        goalLine = "no goal set";
        center2 = `<div class="ru">${m.unit}</div>`;
    } else {
        const delta = target - val;
        const deltaStr =
            delta >= 0
                ? `${fmt(delta, m.decimals)} ${m.unit} ${underWord}`
                : `${fmt(-delta, m.decimals)} ${m.unit} ${overWord}`;
        goalLine = `of ${fmt(target, m.decimals)} ${m.unit} · ${deltaStr}`;
        center2 = `<div class="rp" style="color:${pctColor}">${Math.round(pct)}%</div>`;
    }
    return { val, target, pct, over, frac, goalLine, center2 };
}

// The conic-gradient ring gauge markup (size comes from the CSS context).
function ringMarkup(m, b) {
    const cap =
        b.pct != null && b.frac > 0.005 ? `<div class="ring-cap"></div>` : "";
    return `
      <div class="ring" style="--c:${m.color};--p:${b.frac.toFixed(4)}" role="img" aria-label="${esc(m.label)} ${fmt(b.val, m.decimals)} ${m.unit}">
        <div class="ring-track"></div>
        <div class="ring-arc"></div>
        ${cap}
        <div class="ring-center">
          <div class="rv">${fmt(b.val, m.decimals)}</div>
          ${b.center2}
        </div>
      </div>`;
}

function macroLabelGoal(m, b) {
    return `
      <div class="mlabel"><span class="dot" style="background:${m.color}"></span>${m.label}</div>
      <div class="mgoal">${esc(b.goalLine)}</div>`;
}

// Calories — full-width hero card with the large ring.
function macroHero(m, vals, goal, wording) {
    const b = macroBits(m, vals, goal, wording);
    return `
      <div class="mcard macro-hero">${ringMarkup(m, b)}${macroLabelGoal(m, b)}
      </div>`;
}

// One protein/carbs/fat cell inside the shared row card.
function macroCell(m, vals, goal, wording) {
    const b = macroBits(m, vals, goal, wording);
    return `
        <div class="macro-cell">${ringMarkup(m, b)}${macroLabelGoal(m, b)}
        </div>`;
}

// Water — full-width horizontal bar instead of a ring.
function macroWater(m, vals, goal, wording) {
    const b = macroBits(m, vals, goal, wording);
    const fillPct = b.pct == null ? 0 : Math.max(0, Math.min(b.pct, 100));
    const valStyle = b.over ? ' style="color:var(--over)"' : "";
    const right =
        b.target != null
            ? `<div class="wval"${valStyle}>${fmt(b.val, m.decimals)}<span class="wsub">/ ${fmt(b.target, m.decimals)} ${m.unit}</span></div>`
            : `<div class="wval">${fmt(b.val, m.decimals)}<span class="wsub">${m.unit}</span></div>`;
    return `
      <div class="mcard macro-water">
        <div class="wtop">
          <div class="mlabel"><span class="dot" style="background:${m.color}"></span>${m.label}</div>
          ${right}
        </div>
        <div class="wbar"><div class="wfill" style="width:${fillPct.toFixed(1)}%;background:${m.color}"></div></div>
        <div class="mgoal wgoal">${esc(b.goalLine)}</div>
      </div>`;
}

// Full macro panel: calories hero + protein/carbs/fat row + water bar.
function macroPanel(vals, goal, wording) {
    const cal = MACROS.find((m) => m.key === "calories");
    const trio = MACROS.filter((m) =>
        ["protein_g", "carbs_g", "fat_g"].includes(m.key),
    );
    const water = MACROS.find((m) => m.key === "water_ml");
    // Only show the water bar when water was actually tracked — an empty bar for
    // an untouched metric is noise.
    const waterBar =
        (vals?.[water.key] ?? 0) > 0
            ? macroWater(water, vals, goal, wording)
            : "";
    return `
      ${macroHero(cal, vals, goal, wording)}
      <div class="mcard macro-row">${trio
          .map((m) => macroCell(m, vals, goal, wording))
          .join("")}
      </div>
      ${waterBar}`;
}

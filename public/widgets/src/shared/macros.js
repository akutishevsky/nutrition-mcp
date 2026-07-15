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

// When the panel is interactive (meals were supplied), a macro tile is also a
// button that toggles its per-meal breakdown — see macroToggle below.
function interactiveAttrs(m, interactive) {
    return interactive
        ? ` role="button" tabindex="0" data-macro="${m.key}" aria-expanded="false" aria-label="Show meals contributing ${esc(m.label)}"`
        : "";
}

// Calories — full-width hero card with the large ring.
function macroHero(m, vals, goal, wording, interactive) {
    const b = macroBits(m, vals, goal, wording);
    return `
      <div class="mcard macro-hero${interactive ? " interactive" : ""}"${interactiveAttrs(m, interactive)}>${ringMarkup(m, b)}${macroLabelGoal(m, b)}
      </div>`;
}

// One protein/carbs/fat cell inside the shared row card.
function macroCell(m, vals, goal, wording, interactive) {
    const b = macroBits(m, vals, goal, wording);
    return `
        <div class="macro-cell${interactive ? " interactive" : ""}"${interactiveAttrs(m, interactive)}>${ringMarkup(m, b)}${macroLabelGoal(m, b)}
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
//
// `meals` is optional: when a non-empty array of per-meal breakdown rows is
// passed (each { description, meal_type, date, calories, protein_g, carbs_g,
// fat_g }), the calorie/protein/carbs/fat tiles become tappable and reveal the
// meals that contributed to that macro (see macroToggle). Omit it (or pass an
// empty array) and the panel renders exactly as before, non-interactive — so
// averaged views like trends stay static.
function macroPanel(vals, goal, wording, meals) {
    const cal = MACROS.find((m) => m.key === "calories");
    const trio = MACROS.filter((m) =>
        ["protein_g", "carbs_g", "fat_g"].includes(m.key),
    );
    const water = MACROS.find((m) => m.key === "water_ml");
    const interactive = Array.isArray(meals) && meals.length > 0;
    // Stash the meals so the delegated toggle handler can build the breakdown
    // on demand. One panel per widget, so a single slot is enough.
    __macroMeals = interactive ? meals : null;
    // Only show the water bar when water was actually tracked — an empty bar for
    // an untouched metric is noise.
    const waterBar =
        (vals?.[water.key] ?? 0) > 0
            ? macroWater(water, vals, goal, wording)
            : "";
    const hint = interactive
        ? `<div class="macro-hint">Tap a metric to see which meals contributed.</div>`
        : "";
    // The breakdown renders into this region on tap; hidden until then.
    const detail = interactive
        ? `<div class="macro-detail" hidden aria-live="polite"></div>`
        : "";
    return `
      <div class="macro-panel"${interactive ? " data-macro-panel" : ""}>
      ${hint}
      ${macroHero(cal, vals, goal, wording, interactive)}
      <div class="mcard macro-row">${trio
          .map((m) => macroCell(m, vals, goal, wording, interactive))
          .join("")}
      </div>
      ${waterBar}
      ${detail}
      </div>`;
}

// ---- Interactive per-meal breakdown --------------------------------------
// Set by macroPanel() when meals are supplied; read by the delegated handlers.
let __macroMeals = null;

// Build the breakdown list for one macro: every meal that contributed a
// positive amount, largest-first, capped so a long range stays readable.
function macroDetailBody(m, meals) {
    const decimals = m.key === "calories" ? 0 : 1;
    const rows = meals
        .map((meal) => ({ meal, v: Number(meal?.[m.key] ?? 0) || 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v);

    const head = `
      <div class="md-head">
        <span class="md-title"><span class="dot" style="background:${m.color}"></span>${esc(m.label)} by meal</span>
        <button class="md-close" data-macro-close aria-label="Close breakdown">✕</button>
      </div>`;

    if (!rows.length) {
        return `${head}<div class="md-empty">No logged meals contributed ${esc(m.label.toLowerCase())}.</div>`;
    }

    const CAP = 8;
    const shown = rows.slice(0, CAP);
    const extra = rows.length - shown.length;
    const items = shown
        .map(({ meal, v }) => {
            // Prefer a date tag for multi-day ranges, otherwise the meal type.
            const sub = meal.date
                ? esc(String(meal.date).slice(5))
                : meal.meal_type
                  ? esc(meal.meal_type)
                  : "";
            return `
        <li class="md-row">
          <span class="md-val" style="color:${m.color}">${fmt(v, decimals)}<span class="md-unit">${esc(m.unit)}</span></span>
          <span class="md-name">${esc(meal.description || "Untitled meal")}${sub ? `<span class="md-sub">${sub}</span>` : ""}</span>
        </li>`;
        })
        .join("");
    const more =
        extra > 0
            ? `<li class="md-more">+ ${extra} smaller meal${extra === 1 ? "" : "s"}</li>`
            : "";
    return `${head}<ul class="md-list">${items}${more}</ul>`;
}

// Toggle the breakdown for the tapped tile. Tapping the open tile again (or its
// ✕) collapses it; tapping another tile swaps the list. The height change is
// picked up by the bridge's ResizeObserver, which re-reports so the host grows
// the iframe.
function macroToggle(cell) {
    const panel = cell.closest("[data-macro-panel]");
    if (!panel || !__macroMeals) return;
    const detail = panel.querySelector(".macro-detail");
    if (!detail) return;
    const key = cell.dataset.macro;
    const alreadyOpen = detail.dataset.open === key && detail.hidden === false;

    panel.querySelectorAll("[data-macro]").forEach((c) => {
        const on = c === cell && !alreadyOpen;
        c.classList.toggle("open", on);
        c.setAttribute("aria-expanded", on ? "true" : "false");
    });

    if (alreadyOpen) {
        detail.hidden = true;
        detail.dataset.open = "";
        detail.innerHTML = "";
        return;
    }
    const m = MACROS.find((mm) => mm.key === key);
    if (!m) return;
    detail.innerHTML = macroDetailBody(m, __macroMeals);
    detail.dataset.open = key;
    detail.hidden = false;
}

// Delegated once per document. No-ops on non-interactive panels (no
// [data-macro] tiles), so widgets that omit meals are unaffected.
if (typeof document !== "undefined" && !window.__macroWired) {
    window.__macroWired = true;
    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-macro-close]")) {
            const panel = e.target.closest("[data-macro-panel]");
            const detail = panel && panel.querySelector(".macro-detail");
            if (detail && detail.dataset.open) {
                const cell = panel.querySelector(
                    `[data-macro="${detail.dataset.open}"]`,
                );
                if (cell) macroToggle(cell);
            }
            return;
        }
        const cell = e.target.closest("[data-macro]");
        if (cell) macroToggle(cell);
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
        const cell = e.target.closest("[data-macro]");
        if (!cell) return;
        e.preventDefault();
        macroToggle(cell);
    });
}

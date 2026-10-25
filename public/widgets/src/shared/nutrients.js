// The day view under the half-gauge hero, for meal-logged and
// nutrition-summary (the 2026-10 redesign, artboards MG1/MG2 and W1): the
// nutrient accordion, the calories-by-meal panel, the per-meal lists with
// their ingredients, the by-day strip of a range, Collapse all — and the
// small controller that mounts the card and handles its clicks.
//
// Requires T / WIDGET_LOCALE / tpl / plural (shared/i18n.js), esc() from the
// template, shared/gauge.js, and from shared/macros.js the `_meta` validators
// and DRINK_GRAMS. Nothing runs at load: no DOM access, no listeners, so a
// test can evaluate the template's script without a document.
//
// A template builds a view object `V` (see nvMount) from its own payload and
// `_meta`; this file owns every rule both widgets share.

// ---- Numbers ---------------------------------------------------------------
const NV_NF = new Map();
function nvNum(v, maxFrac, minFrac) {
    const key = `${WIDGET_LOCALE}|${maxFrac}|${minFrac || 0}`;
    let f = NV_NF.get(key);
    if (!f) {
        const o = {
            maximumFractionDigits: maxFrac,
            minimumFractionDigits: minFrac || 0,
        };
        try {
            f = new Intl.NumberFormat(WIDGET_LOCALE, o);
        } catch (_) {
            f = new Intl.NumberFormat(undefined, o);
        }
        NV_NF.set(key, f);
    }
    return f.format(v);
}

// One rule for every figure on the card: kcal and mg whole; litres and drinks
// to one decimal; grams to one decimal below 10 when not whole, else whole.
function nvFmt(unit, v) {
    if (v == null || !Number.isFinite(v)) return "—";
    if (v === 0) return "0";
    if (unit === "L" || unit === "drinks") return nvNum(v, 1, 1);
    if (unit === "kcal" || unit === "mg") return nvNum(Math.round(v), 0);
    if (Math.abs(v) < 10 && Math.abs(v - Math.round(v)) > 0.05)
        return nvNum(v, 1, 1);
    return nvNum(Math.round(v), 0);
}

function nvUnitLabel(unit, drinkUnit) {
    if (unit === "drinks")
        return (T.macros.drinkLabels && T.macros.drinkLabels[drinkUnit]) || "";
    const u = T.macros.units;
    return (u && u[unit]) || unit;
}

function nvWithUnit(unit, v, drinkUnit) {
    return `${nvFmt(unit, v)} ${nvUnitLabel(unit, drinkUnit)}`;
}

// ---- Nutrients -------------------------------------------------------------
// Fixed order (not sorted by status). `key` is the payload's field name,
// `mc` the colour token, `kind` how its goal reads: a target to hit
// (protein, carbs, fat), a floor to reach (fiber, water), a ceiling to stay
// under, or none (trans fat has no goal anywhere). Calories is not a row: it
// is the hero.
const NV_DEFS = [
    { key: "protein_g", mc: "protein", emoji: "🥩", unit: "g", kind: "target" },
    { key: "carbs_g", mc: "carbs", emoji: "🍞", unit: "g", kind: "target" },
    { key: "fat_g", mc: "fat", emoji: "🥑", unit: "g", kind: "target" },
    { key: "sugar_g", mc: "sugar", emoji: "🍬", unit: "g", kind: "ceil" },
    {
        key: "added_sugar_g",
        mc: "added-sugar",
        emoji: "🍭",
        unit: "g",
        kind: "ceil",
    },
    {
        key: "saturated_fat_g",
        mc: "saturated",
        emoji: "🧈",
        unit: "g",
        kind: "ceil",
    },
    { key: "trans_fat_g", mc: "trans", emoji: "🍟", unit: "g", kind: "none" },
    { key: "sodium_mg", mc: "sodium", emoji: "🧂", unit: "mg", kind: "ceil" },
    { key: "fiber_g", mc: "fiber", emoji: "🌾", unit: "g", kind: "floor" },
    {
        key: "caffeine_mg",
        mc: "caffeine",
        emoji: "☕",
        unit: "mg",
        kind: "ceil",
    },
    { key: "alcohol_g", mc: "alcohol", emoji: "🍷", unit: "g", kind: "ceil" },
    { key: "water_ml", mc: "water", emoji: "💧", unit: "L", kind: "floor" },
];
// Always a row: the three macros and water.
const NV_CORE = ["protein_g", "carbs_g", "fat_g", "water_ml"];
// Shown only when the day carries them or a goal is set; a list of a day's
// meals for these leaves out the meals without any (most meals carry no
// caffeine), where the others list every meal.
const NV_SPARSE = [
    "added_sugar_g",
    "trans_fat_g",
    "sodium_mg",
    "caffeine_mg",
    "alcohol_g",
];

function nvLabel(key) {
    if (key === "calories") return T.macros.labels.calories;
    return (T.macros.labels && T.macros.labels[key]) || key;
}

// A stored goal that is a goal at all: a ceiling of 0 is a real one ("none
// at all"), a floor or target of 0 is unset — hasActiveTarget in src/mcp.ts.
function nvGoalActive(kind, g) {
    if (kind === "none" || g == null || !Number.isFinite(g)) return false;
    return kind === "ceil" ? g >= 0 : g > 0;
}

// The unit a nutrient is shown in, and the factor from its payload unit.
function nvDisplay(def, V) {
    if (def.key === "water_ml") return { unit: "L", k: 1 / 1000 };
    if (def.key === "alcohol_g" && DRINK_GRAMS[V.drinkUnit])
        return { unit: "drinks", k: 1 / DRINK_GRAMS[V.drinkUnit] };
    return { unit: def.unit, k: 1 };
}

function nvScale(v, k) {
    return v == null || !Number.isFinite(v) ? v : v * k;
}

// Status words, as one rule for both widgets.
function nvStatus(kind, t, g, hasGoal, unit, V, key) {
    const S = T.nutritionSummary;
    const amt = (x) => nvWithUnit(unit, x, V.drinkUnit);
    if (t == null || !Number.isFinite(t))
        return { text: "", st: "zero", over: false, near: false };
    if (key === "alcohol_g" && t === 0)
        return { text: S.none, st: "ok", over: false, near: false };
    if (!hasGoal)
        return {
            text:
                kind === "ceil" || kind === "none"
                    ? S.noLimit
                    : T.macros.noGoalSet,
            st: "zero",
            over: false,
            near: false,
        };
    if (kind === "ceil") {
        if (t > g)
            return {
                text: tpl(S.over, { amount: amt(t - g) }),
                st: "over",
                over: true,
                near: false,
            };
        const near = g > 0 && t / g >= 0.9;
        return {
            text: tpl(S.left, { amount: amt(g - t) }),
            st: near ? "near" : "ok",
            over: false,
            near,
        };
    }
    if (kind === "target") {
        const r = t / g;
        if (r >= 0.95 && r <= 1.05)
            return { text: S.onTarget, st: "ok", over: false, near: false };
        if (t < g)
            return {
                text: tpl(S.toGo, { amount: amt(g - t) }),
                st: "low",
                over: false,
                near: false,
            };
        return {
            text: tpl(S.above, { amount: amt(t - g) }),
            st: "near",
            over: false,
            near: false,
        };
    }
    if (t >= g) return { text: S.goalMet, st: "ok", over: false, near: false };
    return {
        text: tpl(S.toGo, { amount: amt(g - t) }),
        st: "low",
        over: false,
        near: false,
    };
}

// The rows the card shows, each with its figures in display units.
function nvRows(V) {
    const out = [];
    for (const def of NV_DEFS) {
        const key = def.key;
        const { unit, k } = nvDisplay(def, V);
        const raw = V.vals[key];
        const t = nvScale(Number.isFinite(raw) ? raw : null, k);
        const g = nvScale(V.goal ? V.goal[key] : null, k);
        const hasGoal = nvGoalActive(def.kind, g);
        if (key === "alcohol_g") {
            if (!V.alcoholOn) continue;
        } else if (!NV_CORE.includes(key)) {
            if (t == null && !hasGoal) continue;
            // A meal row carries fiber and sugar as 0 when nothing recorded
            // them, so a 0 with no goal set is not shown as a figure.
            if (V.zeroMeansUnknown && V.zeroMeansUnknown.includes(key)) {
                if (t === 0 && !hasGoal) continue;
            }
        }
        const nr = t == null;
        const status = nvStatus(def.kind, t, g, hasGoal, unit, V, key);
        // This meal's part (meal-logged) and the eaten-before part.
        let a = null;
        if (V.delta) {
            const d = V.delta[key];
            a = Number.isFinite(d) ? d * k : null;
        }
        const peak = V.peak ? nvScale(V.peak[key], k) : null;
        out.push({
            def,
            key,
            unit,
            k,
            label: nvLabel(key),
            t,
            g,
            hasGoal,
            nr,
            a,
            peak: Number.isFinite(peak) ? peak : null,
            rec: V.rec ? V.rec[key] : null,
            status,
        });
    }
    return out;
}

// ---- Markup ----------------------------------------------------------------
const NV_MINI_ARC = "M 6 30 A 24 24 0 0 1 54 30";

function nvMiniGauge(row, V) {
    const { t, g, hasGoal, nr, a, peak } = row;
    let pre = 0,
        add = 0,
        addOff = null;
    if (!nr && hasGoal) {
        const top = V.mode === "range" && peak != null ? Math.max(peak, t) : t;
        const D = Math.max(top, g, 0.0001);
        if (V.mode === "meal" && a != null) {
            const e = Math.max(t - a, 0);
            pre = (e / D) * 100;
            add = a > 0 ? Math.max((a / D) * 100, 1.5) : 0;
            addOff = -pre;
        } else {
            if (V.mode === "range" && peak != null && peak > 0)
                pre = (peak / D) * 100;
            add = t > 0 ? Math.max((t / D) * 100, 1.5) : 0;
        }
    }
    const pct = !nr && hasGoal && g > 0 ? Math.round((t / g) * 100) : null;
    const preP =
        pre > 0
            ? `<path class="mpre" pathLength="100" d="${NV_MINI_ARC}" style="stroke-dasharray:${pre.toFixed(1)} 100"></path>`
            : "";
    const addP =
        add > 0
            ? `<path class="madd" pathLength="100" d="${NV_MINI_ARC}" style="stroke-dasharray:${add.toFixed(1)} 100${addOff != null ? `;stroke-dashoffset:${addOff.toFixed(1)}` : ""}"></path>`
            : "";
    return `<span class="mg" aria-hidden="true"><svg viewBox="0 0 60 34"><path class="mtrk" pathLength="100" d="${NV_MINI_ARC}"></path>${preP}${addP}</svg><b class="num${row.status.over ? " over" : ""}">${pct == null ? "—" : `${nvNum(pct, 0)}%`}</b></span>`;
}

// The inline word after a row's label: this meal's part on meal-logged, the
// status everywhere else.
function nvRowDelta(row, V) {
    if (V.mode === "meal") {
        if (row.nr || row.a == null || row.key === "water_ml") return "";
        return row.a > 0
            ? `<span class="dl num st-meal">+${esc(nvWithUnit(row.unit, row.a, V.drinkUnit))}</span>`
            : `<span class="dl num st-zero">+0</span>`;
    }
    return row.status.text
        ? `<span class="dl num st-${row.status.st}">${esc(row.status.text)}</span>`
        : "";
}

// On meal-logged the row's inline word is this meal's part ("+5 g") and the
// over / near state is colour only until the row opens; say it in the row's
// accessible name. Elsewhere the status word is already visible text.
function nvRowStatusVh(row, V) {
    if (V.mode !== "meal" || row.nr || !row.hasGoal) return "";
    if (!row.status.over && !row.status.near) return "";
    return row.status.text
        ? `<span class="vh">, ${esc(row.status.text)}</span>`
        : "";
}

function nvRowValue(row, V) {
    const S = T.nutritionSummary;
    const unitTxt = nvUnitLabel(row.unit, V.drinkUnit);
    if (row.nr) {
        const gl = row.hasGoal
            ? ` / ${esc(nvWithUnit(row.unit, row.g, V.drinkUnit))}`
            : "";
        return `<b class="nrv">${esc(S.notRecorded)}</b><span class="gl">${gl}</span>`;
    }
    const cls = row.status.over ? "over" : row.status.near ? "near" : "";
    const gl = row.hasGoal
        ? ` / ${esc(nvWithUnit(row.unit, row.g, V.drinkUnit))}`
        : V.mode === "meal" && row.status.text
          ? ` ${esc(unitTxt)} · ${esc(row.status.text)}`
          : ` ${esc(unitTxt)}`;
    return `<b class="${cls}">${esc(nvFmt(row.unit, row.t))}</b><span class="gl">${gl}</span>`;
}

const NV_CHEV_DOWN = `<svg class="achev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>`;
const NV_CHEV_RIGHT = `<svg class="mc" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>`;

function nvMealTypeLabel(type) {
    if (!type) return "";
    const known = T.nutritionSummary.mealTypes;
    return (known && known[type]) || type;
}

// A meal's own figure for one nutrient, in display units (null when the meal
// does not carry it).
function nvMealValue(meal, key, k) {
    if (key === "calories")
        return Number.isFinite(meal.kcal) ? meal.kcal : null;
    const v = meal.vals ? meal.vals[key] : null;
    return Number.isFinite(v) ? v * k : null;
}

function nvItemsHtml(meal, key, unit, k, V, enter) {
    const S = T.nutritionSummary;
    if (!Array.isArray(meal.items) || !meal.items.length)
        return `<div class="msg">${esc(S.totalOnly)}</div>`;
    const rows = meal.items
        .map((it) => {
            const raw = it.vals ? it.vals[key] : null;
            return { it, v: Number.isFinite(raw) ? raw * k : null };
        })
        .sort((x, y) => (y.v || 0) - (x.v || 0));
    return `<div class="itl${enter ? " enter" : ""}">${rows
        .map(({ it, v }) => {
            const src = it.src ? it.src[key] : null;
            const srcTxt = src ? nvSourceWord(src) : "";
            const amt = it.amt || "";
            const sub = [
                amt ? esc(amt) : "",
                srcTxt
                    ? `<span class="${src.s === "estimate" ? "est" : ""}">${esc(srcTxt)}</span>`
                    : "",
            ]
                .filter(Boolean)
                .join(" · ");
            return `<div class="itr"><span class="inm">${esc(it.name)}</span><span class="iv num">${v == null ? "—" : esc(nvWithUnit(unit, v, V.drinkUnit))}</span>${sub ? `<span class="im">${sub}</span>` : ""}</div>`;
        })
        .join("")}</div>`;
}

// The source word under an ingredient, from the nutrient-sources tags
// (shared/macros.js validates them): USDA / OFF / yours / est. / mixed.
function nvSourceWord(tag) {
    const key = SOURCE_WORD_KEY[tag && tag.s];
    return key ? T.macros[key] : "";
}

function nvMealsHtml(list, key, unit, k, V, st, total, enter, ranked) {
    return `<div class="mls${ranked ? " ranked" : ""}">${list
        .map(({ m, v }, i) => {
            const S = T.nutritionSummary;
            const items =
                Array.isArray(m.items) && m.items.length ? m.items.length : 0;
            const sub = [
                m.sub || "",
                nvMealTypeLabel(m.type),
                items ? plural(S.items, items) : S.totalOnlyShort,
            ]
                .filter(Boolean)
                .join(" · ");
            const share =
                total > 0 && v != null && v > 0
                    ? Math.min((v / total) * 100, 100)
                    : 0;
            const open = st.mo === m.id && items > 0;
            const val =
                v == null
                    ? `<span class="nrv">${esc(T.macros.notRecorded)}</span>`
                    : `${esc(nvFmt(unit, v))} <span class="u">${esc(nvUnitLabel(unit, V.drinkUnit))}</span>`;
            const ring = `<span class="mring" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="rtrk" cx="12" cy="12" r="9"></circle>${share > 0 ? `<circle class="rval" cx="12" cy="12" r="9" pathLength="100" transform="rotate(-90 12 12)" style="stroke-dasharray:${share.toFixed(1)} 100"></circle>` : ""}</svg></span>`;
            const inner = `<span class="nmf">${esc(m.name)}<span class="sub">${esc(sub)}</span></span>${ring}<b class="num">${val}</b>`;
            const cls = `mlg${m.cur ? " cur" : ""}`;
            if (!items) {
                return `<div class="${cls} flat" style="--i:${i}">${inner}<span></span></div>`;
            }
            return `<div class="mlw"><button type="button" class="reset ${cls}" style="--i:${i}" data-act="meal" data-m="${esc(m.id)}" data-fk="meal:${esc(m.id)}" aria-expanded="${open ? "true" : "false"}">${inner}${NV_CHEV_RIGHT}</button>${open ? nvItemsHtml(m, key, unit, k, V, true) : ""}</div>`;
        })
        .join("")}</div>`;
}

// "+ N smaller meals" under a ranked (range) list: exact when the server's
// per-metric count arrived in `_meta`, hedged when a host dropped it and the
// server may have trimmed the list (the rule mealList in shared/macros.js
// applies to the strip).
function nvMoreHtml(V, key, rowsLen, shown) {
    const cap = 8;
    const count = V.contributors ? V.contributors[key] : null;
    const exact = Number.isFinite(count);
    const trimmed =
        !!V.bounded &&
        !(V.mealTotal != null && V.mealTotal <= (V.meals || []).length);
    let txt = "";
    if (!exact && trimmed && rowsLen === cap) txt = T.macros.moreMealsMaybe;
    else {
        const extra = (exact ? count : rowsLen) - shown;
        if (extra > 0)
            txt = plural(
                !exact && trimmed && rowsLen > cap
                    ? T.macros.moreMealsAtLeast
                    : T.macros.moreMeals,
                extra,
            );
    }
    return txt ? `<div class="mnote num">${esc(txt)}</div>` : "";
}

// A one-day summary is not always every meal of the day: get_nutrition_summary
// keeps the union of each metric's top 8 (topMealBreakdown), so a day of more
// than 8 meals can arrive trimmed. `meal_count` says by how much. Returns how
// many meals behind `key` the list leaves out: exact for a list of every meal
// (the trimmed rows), exact from `_meta`'s count for a sparse list, and -1
// ("unknown, maybe some") when a host dropped `_meta`. 0 when nothing was
// trimmed — then the list is the whole day.
function nvDayHidden(V, key, list) {
    const shown = (V.meals || []).length;
    if (!V.bounded || V.mealTotal == null || V.mealTotal <= shown) return 0;
    if (!NV_SPARSE.includes(key)) return V.mealTotal - shown;
    const count = V.contributors ? V.contributors[key] : null;
    if (!Number.isFinite(count)) return -1;
    const listed = list.filter((x) => x.v != null && x.v > 0).length;
    return Math.max(count - listed, 0);
}

function nvDayMoreHtml(V, key, list) {
    const hidden = nvDayHidden(V, key, list);
    const txt =
        hidden < 0
            ? T.macros.moreMealsMaybe
            : hidden > 0
              ? plural(T.macros.moreMeals, hidden)
              : "";
    return txt ? `<div class="mnote num">${esc(txt)}</div>` : "";
}

// The by-day strip of a range for one nutrient (calories included).
function nvStripHtml(V, key, k, goal, kind) {
    const S = T.nutritionSummary;
    const days = V.days || [];
    if (!days.length) return "";
    const vals = days.map((d) => {
        if (!d.logged) return null;
        const v = d.vals ? d.vals[key] : null;
        return Number.isFinite(v) ? v * k : null;
    });
    const rec = vals.filter((x) => x != null);
    if (!rec.length) return "";
    const g = nvGoalActive(kind, goal) && goal > 0 ? goal : null;
    const mx = Math.max(...rec, g || 0, 0.0001) * 1.08;
    const pk = Math.max(...rec);
    const bars = days
        .map((d, j) => {
            const v = vals[j];
            const miss = v == null;
            const ov = !miss && g != null && kind === "ceil" && v > g;
            const cls =
                "db" +
                (miss ? (d.logged ? " miss" : " gap") : "") +
                (ov ? " ov" : "") +
                (!miss && v === pk ? " peak" : "");
            const h = miss ? 0 : Math.max((v / mx) * 100, v > 0 ? 4 : 2);
            return `<span class="${cls}"><i style="height:${h.toFixed(1)}%"></i></span>`;
        })
        .join("");
    const gl =
        g != null
            ? `<span class="dgl" style="bottom:calc((100% - 6px) * ${(g / mx).toFixed(4)})"><em>${esc(S.goalLine)}</em></span>`
            : "";
    const labels =
        days.length <= 14
            ? `<div class="dlbls">${days.map((d) => `<span>${esc(d.short || "")}</span>`).join("")}</div>`
            : `<div class="dlab"><span>${esc(days[0].label || "")}</span><span>${esc(days[days.length - 1].label || "")}</span></div>`;
    return `<div class="dstrip" aria-hidden="true"><div class="dbars">${gl}${bars}</div>${labels}</div>`;
}

// The open body for one nutrient, or the calories panel (`row.key ===
// "calories"`).
function nvBodyHtml(V, row, st, enter) {
    const S = T.nutritionSummary;
    const key = row.key;
    const unit = row.unit;
    const k = row.k || 1;
    const dayKey =
        V.dayWord === "thatDay"
            ? "ThatDay"
            : V.dayWord === "range"
              ? "Range"
              : "Today";
    let html = "";
    // Head line.
    if (V.mode === "range") {
        if (!row.nr) {
            const rec = Number.isFinite(row.rec) ? row.rec : V.nLogged;
            html += `<div class="bh num">${esc(
                rec < V.nLogged
                    ? tpl(S.byDayPartial, { rec, logged: V.nLogged })
                    : S.byDay,
            )}</div>`;
        }
    } else if (
        V.mode === "meal" &&
        key !== "calories" &&
        row.status.text &&
        !row.nr
    ) {
        html += `<div class="bh num">${esc(row.status.text)}</div>`;
    }
    if (V.mode === "range" && !row.nr)
        html += nvStripHtml(V, key, k, row.g, row.def ? row.def.kind : "ceil");
    // Message instead of a list.
    let msg = "";
    if (row.nr) msg = tpl(S["notRecorded" + dayKey], { label: row.label });
    else if (key === "water_ml")
        msg =
            V.mode === "range"
                ? S.waterRange
                : tpl(S["water" + dayKey], {
                      amount: nvWithUnit("L", row.t, V.drinkUnit),
                  });
    let list = [];
    if (!msg) {
        const total =
            V.mode === "range"
                ? (row.t || 0) *
                  (Number.isFinite(row.rec) ? row.rec : V.nLogged || 1)
                : row.t || 0;
        let all = V.meals.map((m) => ({ m, v: nvMealValue(m, key, k) }));
        if (V.mode === "range") {
            const extra = V.extraRows
                ? nvExtraMeals(V.extraRows, V.extraSub || (() => ""))[key] || []
                : [];
            all = all
                .concat(extra.map((m) => ({ m, v: nvMealValue(m, key, k) })))
                .filter((x) => x.v != null && x.v > 0)
                .sort((a, b) => b.v - a.v);
            list = all.slice(0, 8);
        } else {
            list = NV_SPARSE.includes(key)
                ? all.filter((x) => (x.v != null && x.v > 0) || x.m.cur)
                : all;
        }
        if (!list.length) {
            // A trimmed day can hide every meal behind a sparse nutrient.
            if (V.mode === "day" && nvDayHidden(V, key, list) !== 0)
                html += nvDayMoreHtml(V, key, list);
            else msg = tpl(S["noneIn" + dayKey], { label: row.label });
        } else {
            if (V.mode === "range")
                html += `<div class="bh bh2">${esc(S.topMeals)}</div>`;
            else if (V.mode === "day") {
                // The meals listed (or, when the server trimmed the day, the
                // day's whole count), and how many listed carry no figure.
                const nrMeals = list.filter((x) => x.v == null).length;
                const dayHidden = nvDayHidden(V, key, list);
                html += `<div class="bh num">${esc(
                    plural(
                        S.byMealCount,
                        list.length + (dayHidden > 0 ? dayHidden : 0),
                    ) +
                        (nrMeals
                            ? " · " + plural(S.notRecordedCount, nrMeals)
                            : ""),
                )}</div>`;
            }
            html += nvMealsHtml(
                list,
                key,
                unit,
                k,
                V,
                st,
                total,
                enter,
                V.mode === "range",
            );
            if (V.mode === "range")
                html += nvMoreHtml(V, key, all.length, list.length);
            else if (V.mode === "day") html += nvDayMoreHtml(V, key, list);
        }
    }
    if (msg) html += `<div class="msg">${esc(msg)}</div>`;
    return html;
}

function nvCalRow(V) {
    const c = V.cal;
    const hasGoal = c.g > 0;
    const over = hasGoal && c.t > c.g;
    return {
        key: "calories",
        unit: "kcal",
        k: 1,
        label: nvLabel("calories"),
        t: c.t,
        g: hasGoal ? c.g : null,
        hasGoal,
        nr: false,
        rec: V.nLogged,
        def: { kind: "ceil" },
        status: {
            text: hasGoal
                ? tpl(
                      V.mode === "range"
                          ? over
                              ? T.nutritionSummary.overGoal
                              : T.nutritionSummary.underGoal
                          : over
                            ? T.nutritionSummary.over
                            : T.nutritionSummary.left,
                      {
                          amount: nvWithUnit("kcal", Math.abs(c.t - c.g)),
                      },
                  )
                : "",
            over,
        },
    };
}

function nvPanelHtml(V, st, enter) {
    const S = T.nutritionSummary;
    const row = nvCalRow(V);
    const title =
        V.mode === "range"
            ? S.caloriesByDay
            : tpl(T.macros.byMealTitle, { label: row.label });
    const fig =
        nvFmt("kcal", row.t) +
        (row.hasGoal
            ? ` / ${nvWithUnit("kcal", row.g)}`
            : ` ${nvUnitLabel("kcal")}`) +
        (row.status.text ? ` · ${row.status.text}` : "");
    return `<div class="mp${enter ? " enter" : ""}" data-mc="1"><div class="mph"><b>${esc(title)}</b><span class="dim num">${esc(fig)}</span></div>${nvBodyHtml(V, row, st, enter)}</div>`;
}

function nvRowsHtml(V, rows, st, enterRows, enterBody) {
    const S = T.nutritionSummary;
    const head =
        V.mode === "range"
            ? `<div class="slab2" style="--i:0">${esc(plural(S.dailyAverages, V.nLogged))}</div>`
            : "";
    return `<div class="rows${enterRows ? " enter" : ""}">${head}${rows
        .map((row, i) => {
            const sel = st.sel === row.key;
            const body = sel
                ? `<div class="accB${enterBody ? " enter" : ""}">${nvBodyHtml(V, row, st, enterBody)}</div>`
                : "";
            return `<div class="acc${sel ? " sel" : ""}${row.status.over ? " is-over" : ""}" data-mc="1" style="--mc:var(--${row.def.mc});--i:${i + 1}"><button type="button" class="reset accH" data-act="row" data-k="${row.key}" data-fk="row:${row.key}" aria-expanded="${sel ? "true" : "false"}"><span class="em" aria-hidden="true">${row.def.emoji}</span><span class="ab"><span class="lb">${esc(row.label)}${nvRowDelta(row, V)}</span><span class="vl num">${nvRowValue(row, V)}</span>${nvRowStatusVh(row, V)}</span>${nvMiniGauge(row, V)}${NV_CHEV_DOWN}</button>${body}</div>`;
        })
        .join("")}</div>`;
}

function nvBodyMarkup(V, rows, st, how) {
    if (!st.open) return "";
    const S = T.nutritionSummary;
    const panel =
        st.sel === "calories" ? nvPanelHtml(V, st, how.enterBody) : "";
    return `${panel}${nvRowsHtml(V, rows, st, how.enterRows, how.enterBody)}<button type="button" class="reset collall" data-act="collapse" data-fk="collapse"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11l5-5 5 5"></path><path d="M7 18l5-5 5 5"></path></svg><span>${esc(S.collapseAll)}</span></button>`;
}

// ---- Controller ------------------------------------------------------------
// V = {
//   mode: "meal" | "day" | "range", dayWord: "today" | "thatDay" | "range",
//   hasData, drinkUnit, alcoholOn,
//   vals / goal / delta / peak / rec: keyed by payload field (delta: the
//     logged meal's own values; peak, rec: a range's highest day and how many
//     days recorded each figure), nLogged,
//   zeroMeansUnknown: keys whose 0 may mean "not recorded",
//   cal: { t, g, e?, peak? },
//   meals: [{ id, name, type, sub, kcal, vals, items, cur }],
//   segMeals: index list (into meals) behind the gauge's segments, or null,
//   days: [{ date, short, label, logged, vals }] (a range),
//   contributors, bounded, mealTotal,
//   extraRows ({ key: [row] }, shared/macros.js's merges) and extraSub(row),
//   hero: { eyebrow, title, deltaHtml, emptyText, stats, gauge },
// }
function nvReduced() {
    try {
        return (
            typeof matchMedia === "function" &&
            matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    } catch (_) {
        return false;
    }
}

function nvHeroHtml(V, st) {
    const h = V.hero;
    const top = `<span class="eyb2">${esc(h.eyebrow)}</span><span class="t">${esc(h.title)}</span>`;
    const gtop = V.hasData
        ? `<button type="button" class="reset gtop" data-act="tog" data-fk="top" aria-expanded="${st.open ? "true" : "false"}">${top}</button>`
        : `<div class="gtop">${top}</div>`;
    const below = V.hasData
        ? h.deltaHtml
            ? `<div class="gdelta num">${h.deltaHtml}</div>`
            : ""
        : `<div class="gempty">${esc(h.emptyText || "")}</div>`;
    return `<div class="ghero">${gtop}${gaugeHtml(Object.assign({}, h.gauge, { calOpen: st.open && st.sel === "calories", picked: nvPickedSeg(V, st), inert: !V.hasData }))}${below}${V.hasData && h.stats ? gaugeStatsHtml(h.stats) : ""}${V.hasData ? gaugePillButton(st.open) : ""}</div>`;
}

// The gauge segment holding the open meal, when the calories panel is open.
function nvPickedSeg(V, st) {
    const segs = V.hero.gauge.segs;
    if (!segs || st.sel !== "calories" || st.mo == null) return -1;
    const i = V.meals.findIndex((m) => m.id === st.mo);
    return segs.findIndex((s) => i >= s.from && i <= s.to);
}

// Paint the card into `root` and wire its clicks (once per root element).
function nvMount(root, V) {
    const st = { open: false, sel: null, mo: null, closing: false };
    const rows = nvRows(V);
    const ctl = { V, st, rows };
    root.__nv = ctl;
    root.innerHTML = `<div class="gcard enter">${nvHeroHtml(V, st)}<div class="gbody"></div><span class="vh" aria-live="polite"></span></div>`;
    if (!root.__nvBound && typeof root.addEventListener === "function") {
        root.__nvBound = true;
        root.addEventListener("click", (e) => {
            const c = root.__nv;
            const el =
                e.target && e.target.closest
                    ? e.target.closest("[data-act]")
                    : null;
            if (!c || !el || !root.contains(el)) return;
            nvAct(root, c, el);
        });
    }
}

function nvAct(root, c, el) {
    const { st } = c;
    if (st.closing) return;
    const act = el.getAttribute("data-act");
    const live = (txt) => {
        const v = root.querySelector(".gcard > .vh");
        if (v) v.textContent = txt || "";
    };
    if (act === "tog") {
        if (!c.V.hasData) return;
        if (st.open) return nvCollapse(root, c);
        st.open = true;
        return nvUpdate(root, c, { enterRows: true, enterBody: true });
    }
    if (act === "collapse") return nvCollapse(root, c);
    if (act === "cal") {
        if (!c.V.hasData) return;
        const wasOpen = st.open;
        if (st.open && st.sel === "calories") {
            st.sel = null;
            st.mo = null;
        } else {
            st.open = true;
            st.sel = "calories";
            st.mo = null;
        }
        live("");
        return nvUpdate(root, c, { enterRows: !wasOpen, enterBody: true });
    }
    if (act === "seg") {
        if (!c.V.hasData) return;
        const seg = (c.V.hero.gauge.segs || [])[
            Number(el.getAttribute("data-i"))
        ];
        if (!seg) return;
        const wasOpen = st.open;
        const rep = c.V.meals[seg.rep];
        const same = st.sel === "calories" && rep && st.mo === rep.id;
        st.open = true;
        st.sel = "calories";
        st.mo = same || !rep ? null : rep.id;
        live(same ? "" : tpl(T.nutritionSummary.selected, { tip: seg.tip }));
        return nvUpdate(root, c, { enterRows: !wasOpen, enterBody: true });
    }
    if (act === "row") {
        const k = el.getAttribute("data-k");
        st.sel = st.sel === k ? null : k;
        st.mo = null;
        return nvUpdate(root, c, { enterRows: false, enterBody: true });
    }
    if (act === "meal") {
        const m = el.getAttribute("data-m");
        st.mo = st.mo === m ? null : m;
        return nvUpdate(root, c, { enterRows: false, enterBody: false });
    }
}

function nvCollapse(root, c) {
    const card = root.querySelector(".gcard");
    const done = () => {
        c.st.open = false;
        c.st.sel = null;
        c.st.mo = null;
        c.st.closing = false;
        if (card) card.classList.remove("closing");
        nvUpdate(root, c, {});
        const pill = root.querySelector('[data-fk="tog"]');
        if (pill && pill.focus) pill.focus();
    };
    if (!card || nvReduced()) return done();
    c.st.closing = true;
    card.classList.add("closing");
    setTimeout(done, 380);
}

// Re-render the body and sync the hero's state, keeping focus on the control
// that was focused.
function nvUpdate(root, c, how) {
    const { V, st, rows } = c;
    const card = root.querySelector(".gcard");
    const body = root.querySelector(".gbody");
    if (!card || !body) return;
    const active = document.activeElement;
    const fk =
        active && active.getAttribute ? active.getAttribute("data-fk") : null;
    card.classList.toggle("open", st.open);
    body.classList.toggle("enter", !!how.enterRows);
    body.innerHTML = nvBodyMarkup(V, rows, st, how);
    for (const b of root.querySelectorAll('[data-act="tog"]'))
        b.setAttribute("aria-expanded", st.open ? "true" : "false");
    const txt = root.querySelector(".bigchev .bctxt");
    if (txt)
        txt.textContent = st.open
            ? T.nutritionSummary.showLess
            : T.nutritionSummary.showMore;
    const btn = root.querySelector(".gbtn");
    if (btn)
        btn.setAttribute(
            "aria-expanded",
            st.open && st.sel === "calories" ? "true" : "false",
        );
    const gw = root.querySelector(".gw");
    const picked = nvPickedSeg(V, st);
    if (gw) gw.classList.toggle("picked", picked >= 0);
    root.querySelectorAll(".gseg").forEach((p, i) =>
        p.classList.toggle("on", i === picked),
    );
    if (fk) {
        const again = root.querySelector(`[data-fk="${CSS.escape(fk)}"]`);
        if (again && again !== document.activeElement && again.focus)
            again.focus({ preventScroll: true });
    }
}

// ---- Payload helpers shared by the two templates ---------------------------

function nvItemsOf(items) {
    if (!Array.isArray(items) || !items.length) return null;
    return items.map((it) => ({
        name: it.name,
        amt:
            it.amount != null
                ? `${nvNum(it.amount, 1)}${it.unit ? ` ${it.unit}` : ""}`
                : it.unit || "",
        vals: it,
        src: it.sourceTags || null,
    }));
}

// Breakdown rows (MEAL_BREAKDOWN_ITEM plus what `_meta` merged in) as the
// view's meals. `sub(row, i)` is the time or date on the meta line.
function nvMealsFrom(rows, sub, cur) {
    return (Array.isArray(rows) ? rows : []).map((r, i) => ({
        id: "m" + i,
        name: r.description || T.macros.untitledMeal,
        type: typeof r.meal_type === "string" ? r.meal_type : null,
        sub: sub(r, i),
        kcal: Number.isFinite(r.calories) ? r.calories : null,
        vals: r,
        items: nvItemsOf(r.items),
        cur: i === cur,
    }));
}

// A range's extra rows (meals among one nutrient's top 8 that the kept rows
// miss), as view meals that only that nutrient's list reads.
function nvExtraMeals(extraRows, sub) {
    const out = {};
    if (!extraRows) return out;
    for (const [key, list] of Object.entries(extraRows)) {
        if (!Array.isArray(list)) continue;
        out[key] = list.map((r, j) => ({
            id: `x:${key}:${j}`,
            name: r.description || T.macros.untitledMeal,
            type: r.meal_type || null,
            sub: sub(r),
            kcal: null,
            vals: r,
            items: null,
            cur: false,
        }));
    }
    return out;
}

// Period-average rows: the trends widget's Week / Month / Quarter / Year view.
//
// get_trends with `group_by` sends every granularity in the result `_meta`
// under PERIOD_META_KEY (PERIOD_AVERAGES_META_KEY in src/widgets.ts, built by
// buildPeriodAveragesMeta in src/periods.ts). structuredContent never carries
// it: get_trends' outputSchema is frozen. Each row is an average PER LOGGED
// DAY (a day with at least one meal), set against the targets in effect at the
// time — unlike the day view's 7/14/30 figures, which divide by every calendar
// day. Both views name their denominator on screen.
//
// Requires fmt + esc (the template) and T / tpl / plural / WIDGET_LOCALE
// (shared/i18n.js) in scope. Pure string builders, no state: the trends
// template owns the mode, the gallery calls periodListHtml() directly.

// Repeated as a literal because a widget cannot import; src/mcp.test.ts
// asserts the assembled trends widget contains it.
const PERIOD_META_KEY = "nutrition-mcp.com/period-averages";
const PERIOD_GRANULARITIES = ["week", "month", "quarter", "year"];

// Exactly withinBand in src/insights.ts (shared by get_trends' "Days within
// ±10%" line and periods.ts's on-target count), on the unrounded average.
// Two-sided on purpose: 115% of the protein target is off target.
function periodWithinBand(value, target) {
    return target > 0 && value >= target * 0.9 && value <= target * 1.1;
}

const periodIsNum = (v) => typeof v === "number" && isFinite(v);
const periodIsCount = (v) => Number.isInteger(v) && v >= 0;
const periodIsDate = (v) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const periodNumOrNull = (v) => (periodIsNum(v) ? v : null);

// One row, every field treated as optional: anything malformed returns null
// and the row is dropped, never painted half-right.
function periodRowFrom(r) {
    if (!r || typeof r !== "object") return null;
    if (typeof r.key !== "string") return null;
    if (!periodIsDate(r.start) || !periodIsDate(r.end)) return null;
    if (!periodIsCount(r.days) || r.days < 1) return null;
    if (!periodIsCount(r.logged_days) || r.logged_days > r.days) return null;
    let avg = null;
    if (r.logged_days > 0) {
        const a = r.avg;
        if (
            !a ||
            !periodIsNum(a.calories) ||
            !periodIsNum(a.protein) ||
            !periodIsNum(a.carbs) ||
            !periodIsNum(a.fat)
        ) {
            return null;
        }
        avg = {
            calories: a.calories,
            protein: a.protein,
            carbs: a.carbs,
            fat: a.fat,
        };
    }
    const t = r.targets && typeof r.targets === "object" ? r.targets : null;
    const targets = t
        ? {
              calories: periodNumOrNull(t.calories),
              protein: periodNumOrNull(t.protein),
              carbs: periodNumOrNull(t.carbs),
              fat: periodNumOrNull(t.fat),
          }
        : null;
    return {
        key: r.key,
        start: r.start,
        end: r.end,
        days: r.days,
        partial: r.partial === true,
        logged_days: r.logged_days,
        avg,
        targets,
        targets_changed: r.targets_changed === true,
        targets_assumed: r.targets_assumed === true,
        on_target_days: periodIsCount(r.on_target_days)
            ? r.on_target_days
            : null,
        incomplete_days: periodIsCount(r.incomplete_days)
            ? r.incomplete_days
            : null,
    };
}

// Pull the periods out of the result `_meta`. Null (→ the day view, exactly as
// before) when there is no usable row in any granularity — a host that dropped
// `_meta`, a call without `group_by`, or a user with nothing logged.
function periodsFrom(meta) {
    const p = meta && meta[PERIOD_META_KEY];
    if (!p || typeof p !== "object" || !p.periods) return null;
    const periods = {};
    let any = false;
    for (const g of PERIOD_GRANULARITIES) {
        const rows = (Array.isArray(p.periods[g]) ? p.periods[g] : [])
            .map(periodRowFrom)
            .filter(Boolean)
            .sort((a, b) => (a.start < b.start ? 1 : -1)); // newest first
        periods[g] = rows;
        if (rows.length) any = true;
    }
    if (!any) return null;
    const available = PERIOD_GRANULARITIES.filter((g) => periods[g].length);
    return {
        periods,
        available,
        groupBy: available.includes(p.group_by) ? p.group_by : available[0],
        targetsFrom: periodTargetsFrom(p, periods),
    };
}

function periodShift(iso, n) {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

// The first date goals history covers — the {date} of "targets before {date}
// not recorded". `targets_from` when the payload names it. Otherwise a safe
// stand-in: a row flagged targets_assumed has its first day before the first
// recorded goal, so the day after the newest such row's start is a date
// before which nothing was recorded — true, if possibly a few days early.
function periodTargetsFrom(p, periods) {
    if (periodIsDate(p.targets_from)) return p.targets_from;
    let newest = null;
    for (const g of PERIOD_GRANULARITIES) {
        for (const r of periods[g]) {
            if (r.targets_assumed && (!newest || r.start > newest)) {
                newest = r.start;
            }
        }
    }
    return newest ? periodShift(newest, 1) : null;
}

// ---- Labels ----------------------------------------------------------------
function periodDateFmt(opts) {
    try {
        return new Intl.DateTimeFormat(
            WIDGET_LOCALE,
            Object.assign({ timeZone: "UTC" }, opts),
        );
    } catch (_) {
        return null;
    }
}
const periodUtc = (iso) => new Date(iso + "T00:00:00Z");

// "Mar 30 – Apr 5"; the year joins both ends when the week crosses one
// ("Dec 29, 2025 – Jan 4, 2026"). formatRange localizes the dash and the order.
function periodWeekLabel(start, end) {
    const crosses = start.slice(0, 4) !== end.slice(0, 4);
    const f = periodDateFmt(
        crosses
            ? { month: "short", day: "numeric", year: "numeric" }
            : { month: "short", day: "numeric" },
    );
    try {
        if (f && f.formatRange)
            return f.formatRange(periodUtc(start), periodUtc(end));
        if (f)
            return `${f.format(periodUtc(start))} – ${f.format(periodUtc(end))}`;
    } catch (_) {}
    return `${start} – ${end}`;
}

// "Mar 2026" — the monthLabel pattern of weight-trends.html.
function periodMonthLabel(start) {
    const f = periodDateFmt({ month: "short", year: "numeric" });
    try {
        if (f) return f.format(periodUtc(start));
    } catch (_) {}
    const m = Number(start.slice(5, 7));
    return `${T.nutritionSummary.months[m - 1]} ${start.slice(0, 4)}`;
}

function periodLabelOf(row, g) {
    const year = row.start.slice(0, 4);
    if (g === "week") return periodWeekLabel(row.start, row.end);
    if (g === "month") return periodMonthLabel(row.start);
    if (g === "quarter") {
        const q = Math.floor((Number(row.start.slice(5, 7)) - 1) / 3) + 1;
        return tpl(T.trends.quarter, { q, year });
    }
    return year;
}

function periodLongDate(iso) {
    const f = periodDateFmt({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    try {
        if (f) return f.format(periodUtc(iso));
    } catch (_) {}
    return iso;
}

// ---- Rows ------------------------------------------------------------------
// Band class for a figure that has a target: .pin within ±10%, .pout outside.
function periodBand(value, target) {
    if (target == null) return "";
    return periodWithinBand(value, target) ? " pin" : " pout";
}

function periodMacroHtml(cls, letter, value, target) {
    const g = (T.macros.units && T.macros.units.g) || "g";
    const fig =
        target != null
            ? `${fmt(value)}/${fmt(target)} ${g}`
            : `${fmt(value)} ${g}`;
    return `<span class="pmac ${cls}${periodBand(value, target)}"><b>${esc(letter)}</b><span>${esc(fig)}</span></span>`;
}

function periodRowHtml(row, g, ctx) {
    const head = `
      <div class="prow-h">
        <span class="plabel">${esc(periodLabelOf(row, g))}</span>
        ${row.partial ? `<span class="pchip">${esc(T.trends.partial)}</span>` : ""}
        <span class="pdays">${esc(tpl(T.trends.daysLogged, { logged: row.logged_days, total: row.days }))}</span>
      </div>`;
    if (!row.avg) {
        return `<div class="prow">${head}<div class="pnone">${esc(T.trends.nothingLogged)}</div></div>`;
    }
    const a = row.avg;
    const t = ctx.hasTargets ? row.targets : null;
    const calT = t ? t.calories : null;
    const kcal = esc(T.macros.units.kcal || "kcal");
    const calFig =
        calT != null
            ? `${esc(fmt(a.calories))} / ${esc(fmt(calT))}`
            : esc(fmt(a.calories));
    const bar =
        calT != null
            ? `<div class="mbar"><div class="mfill" style="width:${Math.min(100, (a.calories / calT) * 100).toFixed(1)}%;background:var(--calories)"></div></div>`
            : "";
    // The import preview's column abbreviations — already translated
    // ("B / W / T" in pl).
    const ab = (T.importMeals && T.importMeals.tableAbbr) || {};
    const letters = {
        p: ab.protein_g || "P",
        c: ab.carbs_g || "C",
        f: ab.fat_g || "F",
    };
    const macs = `
        <div class="pmacs">
          ${periodMacroHtml("pro", letters.p, a.protein, t ? t.protein : null)}
          ${periodMacroHtml("car", letters.c, a.carbs, t ? t.carbs : null)}
          ${periodMacroHtml("fat", letters.f, a.fat, t ? t.fat : null)}
        </div>`;
    const mid = `
      <div class="prow-m">
        <div class="pcal">
          <span class="pfig${periodBand(a.calories, calT)}">${calFig}<span class="pu">${kcal}</span></span>
          ${bar}
        </div>
        ${macs}
      </div>`;

    // Line 3 only when targets exist: the on-target count, possibly
    // incomplete days, and the two notes about the targets themselves.
    const bits = [];
    if (t) {
        if (row.on_target_days != null) {
            bits.push(
                tpl(esc(T.trends.onTarget), {
                    k: `<span class="pk">${row.on_target_days}</span>`,
                    n: `<span class="pk">${row.logged_days}</span>`,
                }),
            );
        }
        if (row.incomplete_days) {
            bits.push(
                esc(plural(T.trends.possiblyIncomplete, row.incomplete_days)),
            );
        }
        if (row.targets_changed) bits.push(esc(T.trends.targetsChanged));
        if (row.targets_assumed && ctx.targetsFrom) {
            bits.push(
                esc(
                    tpl(T.trends.targetsAssumed, {
                        date: periodLongDate(ctx.targetsFrom),
                    }),
                ),
            );
        }
    }
    const foot = bits.length
        ? `<div class="prow-f">${bits.join(" · ")}</div>`
        : "";
    return `<div class="prow">${head}${mid}${foot}</div>`;
}

// The whole period body for one granularity: the no-targets line (when no row
// carries a target), the denominator caption, then the scrolling row list.
function periodListHtml(rows, g, opts) {
    const hasTargets = rows.some(
        (r) =>
            r.targets &&
            (r.targets.calories != null ||
                r.targets.protein != null ||
                r.targets.carbs != null ||
                r.targets.fat != null),
    );
    const ctx = {
        hasTargets,
        targetsFrom: (opts && opts.targetsFrom) || null,
    };
    return `
      ${hasTargets ? "" : `<div class="pcap nt">${esc(T.trends.noTargets)}</div>`}
      <div class="pcap">${esc(T.trends.perLoggedDay)}</div>
      <div class="plist">${rows.map((r) => periodRowHtml(r, g, ctx)).join("")}</div>`;
}

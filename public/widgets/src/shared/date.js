// Calendar-day helpers shared by widgets that name a specific date on their
// card (goal-progress, meal-logged, trends, weight-trends, nutrition-summary).
// Requires T, WIDGET_LOCALE, tpl() and plural() (shared/i18n.js) to already be
// in scope, so include it after i18n.js; a template's own script and
// shared/macros.js (whose drawer rows call shortDate) come after it.
//
// EVERY DATE IS A UTC MIDNIGHT, formatted with timeZone: "UTC". The payload's
// dates are calendar days already resolved in the account's timezone, and new
// Date("2026-07-11") is UTC midnight — which a formatter in the viewer's own
// zone renders as the 10th for anyone west of Greenwich. Pinning both ends to
// UTC makes the Date a plain carrier for Y-M-D and nothing else.

var DAY_MS = 86400000;

// "2026-07-11" -> Date.UTC(2026, 6, 11), or null for anything that is not a
// real calendar day. The round trip is what rejects "2026-02-31": Date.UTC
// quietly rolls it over into March, and a header naming a date nobody sent is
// worse than the raw string.
function utcDay(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso == null ? "" : iso));
    if (!m) return null;
    var t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(t).toISOString().slice(0, 10) === m[0] ? t : null;
}

// The Intl locale a date is written in. English is pinned to en-GB, which is
// what the hand-rolled formatter always printed ("5 Jul", "5–7 Jul") and what
// the tests pin; bare "en" is US order ("Jul 5"). Every other widget locale is
// a base language Intl resolves on its own.
function dateLocale() {
    var l =
        typeof WIDGET_LOCALE === "string" && WIDGET_LOCALE
            ? WIDGET_LOCALE
            : "en";
    return l === "en" ? "en-GB" : l;
}

// One formatter per locale and year flag: a 30-row drawer asks for thirty
// dates, and constructing a DateTimeFormat is the expensive part.
var __dateFmts = {};
function dateFormatter(withYear) {
    var key = dateLocale() + (withYear ? "|y" : "");
    if (!__dateFmts[key]) {
        __dateFmts[key] = new Intl.DateTimeFormat(dateLocale(), {
            day: "numeric",
            month: "short",
            year: withYear ? "numeric" : undefined,
            timeZone: "UTC",
        });
    }
    return __dateFmts[key];
}

// A day range written the way the locale writes one: "5–7 Jul", "5.–7. Juli",
// "5–7 juil.", "28 Jun – 4 Jul 2025". Intl rather than a table of month names
// and a per-locale order, because the table only ever knew English's order and
// abbreviations — French read "JUL" for "juil.", German "5–7 JUL" for "5.–7.
// Juli", and Japanese put a past year at the END ("6月28日 – 7月4日 2025").
//
// Returns null on any failure (no Intl, a bad date), so each caller keeps its
// own hand-rolled fallback rather than printing nothing.
//
// formatRange is GUARDED, not trusted: for `ja` (Chrome and Safari alike) and
// `pl` (Safari) it drops the month name and answers "07/05～07/07", a numeric
// form the single-date format for the same locale never uses and which reads
// as 5 July or 7 May depending on who is looking. When the range has no letter
// in it and a single date does, the two ends are formatted separately and
// joined instead — "7月5日〜7月7日", "5 lip – 7 lip".
var DATE_LETTER = /\p{L}/u;
function intlDateRange(start, end, withYear) {
    try {
        var a = utcDay(start),
            b = utcDay(end);
        if (a === null || b === null) return null;
        var f = dateFormatter(withYear);
        var fa = f.format(a);
        if (a === b) return fa;
        var r = typeof f.formatRange === "function" ? f.formatRange(a, b) : "";
        if (r && (DATE_LETTER.test(r) || !DATE_LETTER.test(fa))) return r;
        return fa + (WIDGET_LOCALE === "ja" ? "〜" : " – ") + f.format(b);
    } catch (_) {
        return null;
    }
}

// ---- Header dates ---------------------------------------------------------
// A card header is one nowrap run, so a range is written the way a person
// would say it ("5–7 Jul") rather than as two ISO strings. Intl writes it
// (intlDateRange above); ymd() and everything built on it below is the
// hand-rolled FALLBACK for a runtime where that fails, and together with
// shortDate() the only reader of T.nutritionSummary.months left.
//
// These names are now global in every widget that includes this file, so a
// template must not declare its own ymd/dayLabel/rangeLabel/rangeLabelPlain/
// dayHeader/daysLoggedCaption/shiftDay — a template-level `const` of the same
// name is a SyntaxError that takes the whole widget script down with it.

// "2026-07-05" -> { y: 2026, m: 7, d: 5 }, or null for anything that is not
// a real calendar day. Gated on utcDay()'s round trip rather than a month
// range check of its own: "2026-02-31" used to pass (month 2 is in range) and
// the fallback printed "31 Feb", a date nobody sent. Parsed by hand, never
// through new Date(iso) — see the note at the top of this file.
function ymd(s) {
    if (utcDay(s) === null) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

// Every supported locale except Japanese happens to share English's
// day-before-month order ("5 Jul"/"5 juillet"/"5 Juli"...), so only `ja` gets
// a distinct branch here rather than a per-locale date-order field in
// WidgetStrings — Y-M-D with 年/月/日 particles, no separating spaces.
function dayLabel(s, withYear) {
    const p = ymd(s);
    if (!p) return String(s ?? "");
    const month = T.nutritionSummary.months[p.m - 1];
    return WIDGET_LOCALE === "ja"
        ? `${withYear ? `${p.y}年` : ""}${month}${p.d}日`
        : `${p.d} ${month}${withYear ? ` ${p.y}` : ""}`;
}

// The year shows when a range crosses one (where it is the whole point) and
// when the range is not in the current year — a summary of last autumn
// labelled "28 Jun – 4 Jul" names no year at all, and these tools are
// routinely asked for a past window. One day is a range of one (start ===
// end), so the same rule makes a single day from last July read "7 Jul 2025"
// rather than passing for this year's.
//
// The payload dates are already resolved in the user's timezone, and so is
// the local year here; a date-line disagreement at worst prints a year that
// did not need printing.
function rangeNeedsYear(a, b) {
    return a.y !== b.y || b.y !== new Date().getFullYear();
}

// rangeLabel()'s hand-rolled half on its own: "5–7 Jul" within a month,
// "28 Jun – 4 Jul" across two, year per rangeNeedsYear(). Split out so the
// fallback is reachable (and testable) without breaking Intl first. A pair
// that is not two real days passes through as "start → end".
function rangeLabelPlain(start, end) {
    const a = ymd(start),
        b = ymd(end);
    if (!a || !b) return `${start} → ${end}`;
    if (a.y !== b.y) return `${dayLabel(start, true)} – ${dayLabel(end, true)}`;
    const yr = rangeNeedsYear(a, b) ? ` ${b.y}` : "";
    // A Japanese year goes FIRST ("2025年3月2日"), never appended as " 2025"
    // — the same misplacement intlDateRange's note records for Intl.
    // dayLabel(…, true) already writes each language's order, and prints
    // exactly `${dayLabel(end, false)}${yr}` for every other locale.
    if (a.m === b.m && a.d === b.d) return dayLabel(end, !!yr);
    if (WIDGET_LOCALE === "ja" && yr && a.m !== b.m)
        return `${b.y}年${dayLabel(start, false)} – ${dayLabel(end, false)}`;
    if (a.m === b.m) {
        // "7月5日〜7日": every other branch above and below just joins two
        // dayLabel() calls, which is already locale-correct — this is the
        // one case where the month is factored out once, and English's
        // "day–day month" order is backwards for Japanese's "month day〜day".
        if (WIDGET_LOCALE === "ja") {
            const yearPrefix = yr ? `${b.y}年` : "";
            return `${yearPrefix}${T.nutritionSummary.months[b.m - 1]}${a.d}日〜${b.d}日`;
        }
        return `${a.d}–${b.d} ${T.nutritionSummary.months[b.m - 1]}${yr}`;
    }
    return `${dayLabel(start, false)} – ${dayLabel(end, false)}${yr}`;
}

// A header's date range: Intl first, rangeLabelPlain() when Intl fails.
function rangeLabel(start, end) {
    const a = ymd(start),
        b = ymd(end);
    if (!a || !b) return `${start} → ${end}`;
    return (
        intlDateRange(start, end, rangeNeedsYear(a, b)) ||
        rangeLabelPlain(start, end)
    );
}

// "2026-07-11" -> "11 Jul" ("7月11日" in ja, "11. Juli" in de). No year: every
// caller prints it beside a header that already carries one where it matters.
// Anything that is not a real day passes through untouched — "2026-02-31"
// included, which the shape-only check this used to have turned into "31
// Feb" (dayHeader leans on this passthrough). The hand-rolled branch is the
// fallback for a runtime without Intl date formatting.
function shortDate(iso) {
    var s = intlDateRange(iso, iso, false);
    if (s) return s;
    return ymd(iso) ? dayLabel(iso, false) : String(iso || "");
}

// True when `iso` (YYYY-MM-DD) names the viewer's current local calendar day.
// A device-clock proxy for "today": the widget has no way to know which
// timezone the server resolved `iso` in, only the timezone the person
// looking at the card is actually in right now — which is the day a
// "Calories today" label needs to match.
function isToday(iso) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return String(iso || "") === `${y}-${m}-${d}`;
}

// A single day as a card header names it: "10 Jul" this year, "2 Mar 2025"
// otherwise (rangeLabel's year rule, applied to a range of one). A value that
// is not a real day goes through shortDate() instead, which passes it through
// untouched — rangeLabel(x, x) would print "x → x", and callers that fall back
// on an empty string (`shortDate(date) || …`) rely on that passthrough.
function dayHeader(iso) {
    return utcDay(iso) === null ? shortDate(iso) : rangeLabel(iso, iso);
}

// "3 days logged", or "15 of 30 days logged" when the window is known to be
// wider than the days that carry a log. `span` is taken as it arrives
// (Number()'d here): an old payload has no days_in_range, and anything that is
// not a real number larger than `logged` — missing, null, "oops", a span
// NARROWER than the days we hold — must fall back to the plain caption rather
// than assert a denominator nobody can trust.
function daysLoggedCaption(logged, span) {
    const s = Number(span);
    return Number.isFinite(s) && s > logged
        ? tpl(T.nutritionSummary.daysOfLogged, { logged, span: s })
        : plural(T.nutritionSummary.daysLogged, logged);
}

// "2026-03-28" shifted by `delta` calendar days -> "2026-03-30", or null when
// `iso` is not a real day. Whole UTC days (see the note at the top), so a DST
// change inside the step cannot land it on 23:00 of the day before.
function shiftDay(iso, delta) {
    const t = utcDay(iso);
    const n = Number(delta);
    if (t === null || !Number.isFinite(n)) return null;
    return new Date(t + Math.round(n) * DAY_MS).toISOString().slice(0, 10);
}

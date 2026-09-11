// Calendar-day helpers shared by widgets that name a specific date on their
// card (goal-progress, meal-logged, trends, weight-trends, nutrition-summary).
// Requires T and WIDGET_LOCALE (shared/i18n.js) to already be in scope.
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

// "2026-07-11" -> "11 Jul" ("7月11日" in ja, "11. Juli" in de). No year: every
// caller prints it beside a header that already carries one where it matters.
// Anything not date-shaped passes through untouched. The hand-rolled branch is
// the fallback for a runtime without Intl date formatting, and the only reason
// T.nutritionSummary.months is still read.
function shortDate(iso) {
    var s = intlDateRange(iso, iso, false);
    if (s) return s;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return String(iso || "");
    var month = T.nutritionSummary.months[Number(m[2]) - 1];
    return WIDGET_LOCALE === "ja"
        ? `${month}${Number(m[3])}日`
        : `${Number(m[3])} ${month}`;
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

// Calendar-day labels for every widget that names a date. Each one goes
// through Intl.DateTimeFormat in the widget's language (WIDGET_LOCALE from
// shared/i18n.js), so month names, day/month order and punctuation are the
// locale's own ("9. Juli" in de, "7月9日" in ja, "9 лип." in uk). Requires
// WIDGET_LOCALE in scope. Browser built-ins only, so nothing here makes a
// network request under the iframe's `default-src 'none'` CSP.
//
// Dates arrive as local YYYY-MM-DD. They are read at UTC noon and formatted
// in UTC: a date, not an instant, so no timezone can move it a day.

const DATE_FMT_CACHE = {};

// The formatter for the current locale and options, built once per key.
// English is formatted as en-GB ("24 Oct"), the day-before-month order every
// English date on the widgets uses; plain "en" would print "Oct 24".
function dateFmt(opts) {
    const locale = WIDGET_LOCALE === "en" ? "en-GB" : WIDGET_LOCALE;
    const key = locale + JSON.stringify(opts);
    if (!DATE_FMT_CACHE[key]) {
        const o = Object.assign({ timeZone: "UTC" }, opts);
        try {
            DATE_FMT_CACHE[key] = new Intl.DateTimeFormat(locale, o);
        } catch (_) {
            DATE_FMT_CACHE[key] = new Intl.DateTimeFormat("en-GB", o);
        }
    }
    return DATE_FMT_CACHE[key];
}

// "2026-07-11" -> { y: 2026, m: 7, d: 11 }, or null when not date-shaped.
function isoParts(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

// A date as a UTC-noon Date, for formatting. Null when not date-shaped.
function isoDate(iso) {
    const p = isoParts(iso);
    return p ? new Date(Date.UTC(p.y, p.m - 1, p.d, 12)) : null;
}

// Any Intl date options applied to a YYYY-MM-DD string, e.g.
// dfmt(iso, { weekday: "short" }). Anything not date-shaped passes through
// untouched, so a bad value prints as sent rather than as "Invalid Date".
function dfmt(iso, opts) {
    const p = isoParts(iso);
    if (!p) return String(iso || "");
    try {
        return dateFmt(opts).format(isoDate(iso));
    } catch (_) {
        return String(iso);
    }
}

// "2026-07-11" -> "11 Jul" ("11. Juli" in de, "7月11日" in ja). With
// withYear, the year is added ("11 Jul 2026"; "2026年7月11日" in ja).
function dateText(iso, withYear) {
    const opts = { day: "numeric", month: "short" };
    if (withYear) opts.year = "numeric";
    return dfmt(iso, opts);
}

// The day of the month as the locale writes it before a month name: "6" in
// en, "6." in de (its full date is "6. Juli"). Read from the short date's parts
// so the locale's own punctuation comes with it. Falls back to the plain day
// where the month does not come after it (ja writes "7月6日").
function dayPrefixText(iso) {
    const d = isoDate(iso);
    if (!d) return String(iso || "");
    const parts = dateFmt({ day: "numeric", month: "short" }).formatToParts(d);
    const mi = parts.findIndex((x) => x.type === "month");
    const di = parts.findIndex((x) => x.type === "day");
    if (mi < 0 || di < 0 || di > mi) return dfmt(iso, { day: "numeric" });
    return parts
        .slice(0, mi)
        .map((x) => x.value)
        .join("")
        .trimEnd();
}

// The short day label every card uses. Same as dateText(iso, false).
function shortDate(iso) {
    return dateText(iso, false);
}

// A range of two YYYY-MM-DD dates: "9–15 Jul", "28 Jun – 4 Jul", "9.–15. Juli"
// in de, "7月9日〜15日" in ja. yearMode says when to add the year:
//   "auto"  - when the range crosses a year, or its end is not this year
//   "cross" - only when the range crosses a year
//   "none"  - never
// Built from single dates rather than Intl's formatRange, which reads badly in
// two locales: pl gives "09.07–15.07" and ja gives "07/09～07/15".
function dateRange(a, b, yearMode) {
    const pa = isoParts(a);
    const pb = isoParts(b);
    if (!pa || !pb) return `${a} – ${b}`;
    const crosses = pa.y !== pb.y;
    const thisYear = new Date().getFullYear();
    const yearStart = yearMode !== "none" && crosses;
    const yearEnd =
        yearMode === "none"
            ? false
            : yearMode === "cross"
              ? crosses
              : crosses || pb.y !== thisYear;
    if (a === b) return dateText(b, yearEnd);
    const ja = WIDGET_LOCALE === "ja";
    if (pa.y === pb.y && pa.m === pb.m) {
        // ja names the month once, up front: "7月9日〜15日".
        return ja
            ? `${dateText(a, yearEnd)}〜${dfmt(b, { day: "numeric" })}`
            : `${dayPrefixText(a)}–${dateText(b, yearEnd)}`;
    }
    const sep = ja ? "〜" : " – ";
    return `${dateText(a, yearStart)}${sep}${dateText(b, yearEnd)}`;
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

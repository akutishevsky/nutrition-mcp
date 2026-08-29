// Calendar-day helpers shared by widgets that name a specific date on their
// card (goal-progress, meal-logged). Requires T (shared/i18n.js) to already
// be in scope for the month names and locale.

// "2026-07-11" -> "11 Jul" ("7月11日" in ja). Split on the string rather than
// through Date: the payload's date is already resolved in the account's
// timezone, and new Date("2026-07-11") is UTC midnight, which renders as the
// 10th for anyone west of Greenwich. Anything not date-shaped passes through
// untouched. Reuses T.nutritionSummary.months (identical Jan..Dec shape)
// rather than a second copy of the same 12 strings.
function shortDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return String(iso || "");
    const month = T.nutritionSummary.months[Number(m[2]) - 1];
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

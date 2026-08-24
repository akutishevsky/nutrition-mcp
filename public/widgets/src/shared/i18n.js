// Locale resolution + string lookup for widget UI text.
//
// Requires WIDGET_STRINGS to already be defined in scope — a plain-data
// object ({ en: {...}, de: {...}, ... }, shaped like WidgetStrings in
// src/copy/widgets.ts) that the INCLUDING TEMPLATE provides via its own
// i18n-inlining marker (see src/widgets.ts), placed immediately before the
// line that pulls this file in (see nutrition-summary.html). That marker
// deliberately does NOT live in this file, and this paragraph deliberately
// never spells it out verbatim: src/widgets.test.ts requires every
// @include'd partial to appear verbatim in the assembled HTML, and a marker
// substituted away from inside this partial — or even just typed out here —
// would either break that check or self-include this very file, because the
// assembler's marker regexes match plain text, comments included. The same
// reason shared/macros.js hand-copies DRINK_GRAMS instead of using the
// TS-inlining marker. No functions in WIDGET_STRINGS (it is spliced in via
// JSON.stringify): the handful of count-sensitive strings use a
// { one, other } shape, selected here via Intl.PluralRules — a browser
// built-in, so this makes no network request and stays inside the iframe's
// `default-src 'none'` CSP.
//
// Include this BEFORE shared/macros.js (and before a template's own script)
// in every widget that uses it — both read WIDGET_STRINGS / T off the
// widget's global scope, the same "must already be in scope" contract
// shared/macros.js already has for fmt()/esc().

// The locale actually in effect for this render, set by setLocale() below.
// Read by macros.js (and any template) as the ambient "current language" —
// mirrors how document.documentElement's data-theme attribute is the ambient
// theme, rather than threading a locale argument through every call.
let WIDGET_LOCALE = "en";
let T = WIDGET_STRINGS.en;

// Resolve which of our bundled locales to render in. `explicit` (typically
// structuredContent.locale, i.e. the user's saved get_language/set_language
// preference) wins when present — it is per-user and always set by the
// server (getUserLocale defaults to "en"), unlike `hostLocale`
// (hostContext.locale), which is host-dependent and may be absent. Both are
// matched on the BCP-47 base language ("de-DE" -> "de") since WIDGET_STRINGS
// is keyed by base language only.
function pickLocale(explicit, hostLocale) {
    function base(tag) {
        if (!tag) return null;
        const b = String(tag).split(/[-_]/)[0].toLowerCase();
        return WIDGET_STRINGS[b] ? b : null;
    }
    return base(explicit) || base(hostLocale) || "en";
}

// Call once the locale is known (from render() / onReady()) — updates the
// ambient WIDGET_LOCALE/T and <html lang>. Returns T for convenience.
function setLocale(locale) {
    WIDGET_LOCALE = WIDGET_STRINGS[locale] ? locale : "en";
    T = WIDGET_STRINGS[WIDGET_LOCALE];
    try {
        document.documentElement.lang = WIDGET_LOCALE;
    } catch (_) {}
    return T;
}

// Fill {placeholders} in a translated template string, e.g.
// tpl(T.macros.byMealTitle, { label: "Protein" }) -> "Protein by meal".
function tpl(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, (_, k) =>
        vars && vars[k] != null ? vars[k] : "",
    );
}

// Pick the right grammatical form of a PluralForms value ({ one, other) })
// for count `n` in the current WIDGET_LOCALE, then fill {n} (and any other
// placeholder in `vars`) into it. Falls back to "other" for any
// Intl.PluralRules category ("few"/"many"/"zero") this 2-form data doesn't
// carry — see the WidgetStrings doc comment in src/copy/widgets.ts.
function plural(forms, n, vars) {
    let category = "other";
    try {
        category = new Intl.PluralRules(WIDGET_LOCALE).select(n);
    } catch (_) {}
    const form = forms[category] || forms.other || forms.one || "";
    return tpl(form, Object.assign({ n }, vars));
}

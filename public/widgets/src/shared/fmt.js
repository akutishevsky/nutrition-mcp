/* The two string helpers every card's markup is built out of.

   They live here rather than in shared/macros.js — which is the one partial
   that cannot go without them — for the same reason shared/spark.js is its own
   file: macros.js is evaluated raw by public/widgets/macros.test.ts with fmt
   and esc injected as arguments, and a definition inside it would shadow that
   injection. So this is a partial of its own, and every template that includes
   macros.js includes this one first. It carries no assembler marker of any
   kind (not even in prose): src/widgets.test.ts requires an included partial's
   full text to survive verbatim into the assembled page, and the assembler's
   marker regexes match plain text, comments included.

   INCLUDE ORDER. After the template's shared/i18n.js line, because fmt() reads
   WIDGET_LOCALE from it. Both declarations hoist, so nothing actually breaks
   earlier in the script — but reading order should say what depends on what.

   fmt: a number in the WIDGET's locale, not the host browser's. A bare
   toLocaleString() keys off navigator.language, so a German profile on an
   English browser printed "1,850/2,200 kcal" (read as 1.85) beside
   macroDecimal's "1,5/2,5 l" on the same rail. The locale is read per CALL,
   not captured, because setLocale() only runs inside render().

   Coerced through Number first: a payload replayed through a host that
   stringified its numbers hands over "58.2", and "58.2".toFixed is a
   TypeError that took the whole card down.

   esc: HTML escaping for text going into markup or an attribute. The five
   templates that include this file all carried the same copy; import-meals.html
   deliberately keeps its own (it also maps null to "" and escapes "'"), and
   weight-trends.html keeps a standalone one because it has no fmt to pair
   with. */
function fmt(n, decimals) {
    const x = Number(n);
    if (n == null || !Number.isFinite(x)) return "0";
    const r = decimals ? x.toFixed(decimals) : Math.round(x);
    try {
        return Number(r).toLocaleString(WIDGET_LOCALE || "en");
    } catch (_) {
        return Number(r).toLocaleString();
    }
}
function esc(s) {
    return String(s).replace(
        /[&<>"]/g,
        (c) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
            })[c],
    );
}

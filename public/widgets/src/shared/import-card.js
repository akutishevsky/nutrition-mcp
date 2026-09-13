/* The import widget's four steps, as pure string emitters.

   IT LIVES HERE, not in the template, for one reason: the public site's landing
   page shows the importer's screens — choose the file, map its columns,
   preview, import complete — as still pictures of what appears in chat,
   rendered at BUILD TIME by evaluating the template's partials with no DOM
   (src/widget-static.ts). A hand-copied screen would be a second
   implementation of the card, and it would drift.

   templates/import-meals.html keeps its own names — esc, notice, cardOpen,
   cardHead, cardClose, fileStep, mapStep, previewStep, doneStep, progressText,
   numLocale, pluralN, cellNum, boldCount, dateFormatOptions, energyUnitOptions,
   dateFormatLabel — as one-line wrappers over these, so every test and every
   step that reaches for those names is unchanged. The state they used to read
   (S, CFG, API, SUPPORT_EMAIL, and the csv.ts / chunk.ts functions the file
   was run through) is passed in as plain data here instead: the template's
   mapStepData / previewStepData / doneStepData build it, and the site builds
   it by running that same template code over its demo file. Nothing here
   parses a file, maps a column or chunks a row — which is what lets this run
   in a sandbox that has no csv.ts in it.

   `idPrefix`, on every step's options: namespaces the step's ids (the heading,
   the drop zone, the pickers, the buttons) and every reference to them
   (`label for`, `aria-describedby`), for a page that shows several screens of
   the importer at once. Unset — as in chat, where one card repaints in place —
   every id is exactly the unprefixed one the widget has always written.

   Static only: the landing page's runtime bundle never includes this partial
   (the pictures' controls are inert), and nothing here touches the DOM.

   INCLUDE ORDER. After shared/i18n.js (T, tpl, plural, unitLabel,
   WIDGET_LOCALE) and shared/icon.js (icon). */

// HTML escaping for text going into markup or an attribute. The importer's own
// variant, deliberately not shared/fmt.js's: it also maps null to "" and
// escapes "'", and every step of this widget has always been written with it.
function impEsc(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// An element id under an optional page prefix: `name` itself when there is no
// prefix (chat), `<prefix>-<name>` when there is (a page holding several
// screens). The prefix is escaped because it lands inside an attribute.
function impId(prefix, name) {
    return prefix ? impEsc(prefix) + "-" + name : name;
}

// Every notice is the same object: a leading mark naming the
// severity by SHAPE, then the message. The shape is what carries
// it — the tint alone would leave "warning" and "error" identical
// to anyone who cannot separate the two hues. `glyph` overrides the
// drawn icon with a character, used only for the envelope, which
// the shared nine-icon set has no path for.
function impNotice(kind, bodyHtml, glyph) {
    // aria-hidden: the envelope is decoration beside a sentence
    // that already says "email"; read aloud it is a stray symbol
    // name. The drawn icons are aria-hidden by icon() itself.
    const mark = glyph
        ? '<span class="nico" aria-hidden="true">' + glyph + "</span>"
        : icon({ warn: "warn", error: "x", ok: "check" }[kind] || "info", 15);
    return (
        '<div class="notice' +
        (kind ? " notice-" + kind : "") +
        '">' +
        mark +
        "<span>" +
        bodyHtml +
        "</span></div>"
    );
}

// A number in the WIDGET's locale. A bare toLocaleString() keys
// off the host browser's language, so a French card on an English
// browser read "12,345 kcal au total" (twelve point three…), and a
// raw JS number always prints a dot ("2092.5 kJ", "12.5" in a
// Polish table). Every digit kept (maximumFractionDigits: 20 is
// the shortest round-trip, same as String(n)) — this re-punctuates
// what the file said, it does not round it. Grouping only where
// asked: a table cell stays compact.
function impNumLocale(n, grouping) {
    const x = Number(n);
    if (!Number.isFinite(x)) return String(n);
    try {
        return new Intl.NumberFormat(WIDGET_LOCALE || "en", {
            maximumFractionDigits: 20,
            useGrouping: !!grouping,
        }).format(x);
    } catch (_) {
        return String(x);
    }
}

// A count string in the right grammatical form, with the count
// itself printed in the widget's locale. plural() picks the form
// from the raw number (Intl.PluralRules needs a number, not "1.234")
// and then fills vars over its own {n}, so the display override
// wins while the selection stays numeric. Extra placeholders
// ({line}, {message}, {format}, {sample}) ride in `vars` — never
// tpl(plural(…), vars): plural()'s own tpl() blanks every
// placeholder it is not given, so they would be gone by then.
function impPluralN(forms, n, vars) {
    return plural(forms, n, Object.assign({ n: impNumLocale(n, true) }, vars));
}

// One preview-table figure: the file's value re-punctuated, "—" when absent.
function impCellNum(v) {
    return v == null ? "—" : impEsc(impNumLocale(v, false));
}

// Escapes a translated "{n} rows"-style string, then bolds the
// digit run wherever it landed — robust to word order, unlike
// hardcoding "<b>N</b> rows" around a fixed English shape.
function impBoldCount(text) {
    return impEsc(text).replace(/\d[\d,.\s ]*\d|\d/, (m) => "<b>" + m + "</b>");
}

// The date-format and energy-unit pickers' options. Functions, not
// static arrays, so a locale switch (setLocale runs before every
// render) relabels these without rebuilding them.
function impDateFormatOptions() {
    return [
        ["iso", `${T.importMeals.dateFormatYmd} (2026-07-18)`],
        ["dmy", `${T.importMeals.dateFormatDmy} (18/07/2026)`],
        ["mdy", `${T.importMeals.dateFormatMdy} (07/18/2026)`],
    ];
}
function impEnergyUnitOptions() {
    return [
        ["kcal", `${T.importMeals.energyUnitKcal} (${unitLabel("kcal")})`],
        ["kj", `${T.importMeals.energyUnitKj} (${unitLabel("kj")})`],
    ];
}

// A date format's name in the user's locale, without its example.
function impDateFormatLabel(fmt) {
    const o = impDateFormatOptions().find((x) => x[0] === fmt);
    return o ? o[1].replace(/\s*\(.*\)$/, "") : String(fmt);
}

// Every step is one Dawn card, built the way every other widget's
// is: the card with its glow, a .chead header line, then the body,
// then the foot the bridge's settings note lands in. The card is
// c-acc because a form has no nutrient to be tinted by — the glow
// is the brand green, like the primary button under it.
function impCardOpen() {
    return '<section class="card c-acc"><div class="glow"></div>';
}

// The header line plus the step rail under it, for the step named `step`
// ("file" | "map" | "preview" | "done").
//
// The title names the step, so the mono .cmeta carries only the
// count ("Step 2 of 4"): the old caption, "Step 2 of 4 · Map
// columns", repeated the heading word for word on the map step in
// all nine locales once the two shared a line.
//
// The h1 is the focus target when the step changes (keepFocus's
// [data-focus-fallback]): tabindex="-1" makes it focusable by
// script only, and base.css draws no ring on it, since a ring
// round a heading reads as something to press. Its screen-reader
// announcement IS the step change.
//
// The rail — a 3px track in place of the four numbered pills that
// used to be here, which cost ~26px and overflowed 320px in every
// locale with a word longer than "Preview" — is aria-hidden: the
// count beside the title already says what it draws.
function impCardHead(title, step, idPrefix) {
    const order = ["file", "map", "preview", "done"];
    // Guard the -1: render() only ever passes one of the four, but
    // a width of -0% and "step 0 of 4" is a nasty way to find out.
    const at = Math.max(0, order.indexOf(step));
    return (
        '<header class="chead"><h1 class="ctitle" id="' +
        impId(idPrefix, "imp-title") +
        '" tabindex="-1" data-focus-fallback>' +
        impEsc(title) +
        '</h1><span class="cmeta">' +
        impEsc(
            tpl(T.importMeals.stepCount, {
                n: at + 1,
                total: order.length,
            }),
        ) +
        '</span></header><div class="steps" aria-hidden="true"><span style="width:' +
        Math.round(((at + 1) / order.length) * 100) +
        '%"></span></div>'
    );
}

// The card's last line: the slot bridge.js puts its settings note
// in, so the note reads as this card's small print under a hairline
// rather than as a centred caption floating below the page.
function impCardClose() {
    return '<div class="foot" data-widget-foot></div></section>';
}

// Step 1, "Choose your export": the drop zone and whatever has to be said
// above it.
//
//   o.noTools       the host cannot call tools, so the import cannot run here
//   o.supportEmail  the contact shown under that warning ("" or null: none)
//   o.tzConfigured  false: the account has no timezone, so dates read as UTC
//   o.errors        local pre-flight problems; the first one is shown
//   o.step          the step the header counts (render() only ever draws this
//                   card on "file")
//   o.idPrefix      see the top of this file
function importFileStep(o) {
    const noTools = o.noTools
        ? impNotice("warn", impEsc(T.importMeals.noToolsWarning)) +
          (o.supportEmail
              ? impNotice(
                    "",
                    tpl(T.importMeals.emailFallback, {
                        email: "<b>" + impEsc(o.supportEmail) + "</b>",
                    }),
                    "✉",
                )
              : "")
        : "";
    const tzWarn = !o.tzConfigured
        ? impNotice("warn", impEsc(T.importMeals.tzWarning))
        : "";
    const errors = o.errors || [];
    return (
        impCardOpen() +
        impCardHead(T.importMeals.chooseExportHeading, o.step, o.idPrefix) +
        noTools +
        tzWarn +
        (errors.length ? impNotice("error", impEsc(errors[0])) : "") +
        '<label class="drop" id="' +
        impId(o.idPrefix, "drop") +
        '">' +
        icon("file", 22) +
        "<strong>" +
        impEsc(T.importMeals.dropChoose) +
        "</strong><span>" +
        impEsc(T.importMeals.dropOr) +
        "</span>" +
        '<input type="file" class="drop-input" id="' +
        impId(o.idPrefix, "file") +
        '" accept=".csv,text/csv,text/plain" />' +
        "</label>" +
        '<div class="hint" style="margin-top:8px">' +
        impEsc(T.importMeals.recognizedHint) +
        "</div>" +
        impCardClose()
    );
}

// ---- step 2: map columns ----------------------------------------------------

// The date picker's worked example: the first real value from the user's own
// file, run through the very functions the import will use. `ex` is what the
// caller got from them —
//   ex.mapped  a column is mapped to Date / time
//   ex.raw     the first non-blank cell of it (undefined: the column is empty)
//   ex.iso     toIsoDate(raw, format) — null when it does not read
//   ex.time    the time that rode along in the cell, normalised ("" / null: none)
// Returns escaped HTML.
function impDateExampleHtml(ex, dateFormat) {
    if (!ex.mapped) return impEsc(T.importMeals.dateMapHint);
    if (ex.raw === undefined) return impEsc(T.importMeals.dateNoneHint);
    if (ex.iso === null)
        return impEsc(
            tpl(T.importMeals.dateUnreadable, {
                raw: ex.raw,
                format: impDateFormatLabel(dateFormat),
            }),
        );
    return impEsc(
        tpl(T.importMeals.dateConverted, {
            raw: ex.raw,
            result: ex.iso + (ex.time ? " " + ex.time : ""),
        }),
    );
}

// The energy picker's worked example, likewise —
//   ex.mapped  a column is mapped to Calories
//   ex.value   its first number (undefined: none)
//   ex.kcal    that number converted from kJ (read only when the unit is kJ)
// Returns escaped HTML.
function impEnergyExampleHtml(ex, energyUnit) {
    if (!ex.mapped) return impEsc(T.importMeals.energyMapHint);
    if (ex.value === undefined) return impEsc(T.importMeals.energyNoneHint);
    if (energyUnit === "kj")
        return impEsc(
            tpl(T.importMeals.energyConverted, {
                v: impNumLocale(ex.value, true),
                kcal: impNumLocale(ex.kcal, true),
            }),
        );
    return impEsc(
        tpl(T.importMeals.energyNoConversion, {
            v: impNumLocale(ex.value, true),
        }),
    );
}

// The date-format and energy-unit pickers, each with its worked example.
function impFormatFieldsHtml(o) {
    const select = (id, options, sel) =>
        '<select class="select" id="' +
        impId(o.idPrefix, id) +
        '">' +
        options
            .map(
                (opt) =>
                    '<option value="' +
                    opt[0] +
                    '"' +
                    (sel === opt[0] ? " selected" : "") +
                    ">" +
                    impEsc(opt[1]) +
                    "</option>",
            )
            .join("") +
        "</select>";
    return (
        '<div style="margin-top:12px">' +
        // Undecidable, so it must not be dressed up as auto-detected.
        (o.dateAmbiguous
            ? impNotice("warn", impEsc(T.importMeals.dateAmbiguousWarning))
            : "") +
        '<div class="field"><label class="label" for="' +
        impId(o.idPrefix, "dateFormat") +
        '">' +
        impEsc(T.importMeals.dateFormatLabel) +
        "</label>" +
        select("dateFormat", impDateFormatOptions(), o.dateFormat) +
        '<span class="hint">' +
        impDateExampleHtml(o.dateExample, o.dateFormat) +
        "</span></div>" +
        '<div class="field"><label class="label" for="' +
        impId(o.idPrefix, "energyUnit") +
        '">' +
        impEsc(T.importMeals.energyUnitLabel) +
        "</label>" +
        select("energyUnit", impEnergyUnitOptions(), o.energyUnit) +
        '<span class="hint">' +
        impEnergyExampleHtml(o.energyExample, o.energyUnit) +
        "</span></div>" +
        "</div>"
    );
}

// Step 2, "Map columns".
//
//   o.table                csv.ts's ParsedTable (headers, rows, encoding,
//                          delimiter, warnings)
//   o.fields               the mappable fields, in order: { key, required? }
//   o.mapping              field key -> column index (-1: not in this file)
//   o.addedSugarColumns    headers holding ADDED sugar (never auto-mapped)
//   o.caffeineGramsColumns caffeine headers that state grams (never mapped)
//   o.alcoholTracked       the alcohol opt-in is on
//   o.alcoholColumn        the file's alcohol header, "" when it has none
//   o.dateFormat           "iso" | "dmy" | "mdy"
//   o.dateAmbiguous        the sniff could not tell day-first from month-first
//   o.dateExample          see impDateExampleHtml
//   o.energyUnit           "kcal" | "kj"
//   o.energyExample        see impEnergyExampleHtml
//   o.sourceApp            the source-app box's value
//   o.step, o.idPrefix
function importMapStep(o) {
    const t = o.table;
    const opts = (sel) =>
        '<option value="-1"' +
        (sel === -1 ? " selected" : "") +
        ">" +
        impEsc(T.importMeals.notInFile) +
        "</option>" +
        t.headers
            .map(
                (h, i) =>
                    '<option value="' +
                    i +
                    '"' +
                    (sel === i ? " selected" : "") +
                    ">" +
                    impEsc(
                        h ||
                            tpl(T.importMeals.columnFallback, {
                                n: i + 1,
                            }),
                    ) +
                    "</option>",
            )
            .join("");
    return (
        impCardOpen() +
        impCardHead(T.importMeals.mapColumnsHeading, o.step, o.idPrefix) +
        '<div class="stat-row"><span>' +
        impBoldCount(impPluralN(T.importMeals.rowsCount, t.rows.length)) +
        "</span><span>" +
        impBoldCount(impPluralN(T.importMeals.columnsCount, t.headers.length)) +
        "</span><span>" +
        impEsc(t.encoding) +
        ", " +
        impEsc(T.importMeals.delimiterLabel) +
        " <b>" +
        impEsc(t.delimiter === "\t" ? T.importMeals.tabLabel : t.delimiter) +
        "</b></span></div>" +
        t.warnings.map((w) => impNotice("warn", impEsc(w))).join("") +
        (o.mapping.sugar_g === -1 && o.addedSugarColumns.length
            ? impNotice(
                  "",
                  impEsc(
                      tpl(T.importMeals.addedSugarNotice, {
                          column: o.addedSugarColumns[0],
                      }),
                  ),
              )
            : "") +
        (o.mapping.caffeine_mg === -1 && o.caffeineGramsColumns.length
            ? impNotice(
                  "",
                  impEsc(
                      tpl(T.importMeals.caffeineGramsNotice, {
                          column: o.caffeineGramsColumns[0],
                      }),
                  ),
              )
            : "") +
        (!o.alcoholTracked && o.alcoholColumn
            ? impNotice(
                  "",
                  impEsc(
                      tpl(T.importMeals.alcoholNotice, {
                          column: o.alcoholColumn,
                      }),
                  ),
              )
            : "") +
        // The legend explains a mark that is aria-hidden, so it is
        // hidden from assistive tech as well: a screen reader hears
        // "required" from the select's own aria-required instead,
        // and a sentence about an asterisk it never announced
        // would only be noise.
        '<div class="hint req-legend" aria-hidden="true">' +
        impEsc(T.importMeals.requiredLegend) +
        "</div>" +
        '<div class="map-grid">' +
        o.fields
            .map((f) => {
                const sel = o.mapping[f.key];
                const sample = sel >= 0 && t.rows[0] ? t.rows[0][sel] : "";
                const label = T.importMeals.fieldLabels[f.key];
                return (
                    '<div class="map-field"><div class="map-src">' +
                    impEsc(label) +
                    (f.required
                        ? ' <span class="req" aria-hidden="true">*</span>'
                        : "") +
                    '</div><div class="map-sample">' +
                    impEsc(
                        sample
                            ? tpl(T.importMeals.sampleValue, {
                                  sample,
                              })
                            : "",
                    ) +
                    "</div></div>" +
                    // Named with the field's own label: the
                    // .map-src beside it is a div, not a <label>,
                    // so the picker was announced as a bare
                    // "combo box". aria-label rather than a
                    // label[for] so the .map-src/.map-sample pair
                    // keeps the exact markup macros.test.ts pins.
                    '<select class="select map-sel" data-field="' +
                    f.key +
                    '" aria-label="' +
                    impEsc(label) +
                    '"' +
                    (f.required ? ' aria-required="true"' : "") +
                    ">" +
                    opts(sel) +
                    "</select>"
                );
            })
            .join("") +
        "</div>" +
        impFormatFieldsHtml(o) +
        // for="srcapp": without it the text box had no name at all.
        '<div class="field"><label class="label" for="' +
        impId(o.idPrefix, "srcapp") +
        '">' +
        impEsc(T.importMeals.sourceAppLabel) +
        "</label>" +
        '<input class="input" id="' +
        impId(o.idPrefix, "srcapp") +
        '" value="' +
        impEsc(o.sourceApp) +
        '" placeholder="myfitnesspal" />' +
        '<span class="hint">' +
        impEsc(T.importMeals.sourceAppHint) +
        "</span></div>" +
        '<div class="actions"><button class="btn btn-primary" id="' +
        impId(o.idPrefix, "toPreview") +
        '">' +
        impEsc(T.importMeals.previewButton) +
        "</button>" +
        '<button class="btn" id="' +
        impId(o.idPrefix, "backToFile") +
        '">' +
        impEsc(T.importMeals.chooseAnotherButton) +
        "</button></div>" +
        impCardClose()
    );
}

// ---- step 3: preview (and the running import) -------------------------------

// The running import's one line: "Importing 50 rows… (batch 2 of
// 7)". Shown under the bar and spoken through the status region —
// one string, so what is heard is what is on screen. `progress` is
// { done, total, label }, or null when nothing is running ("").
function impProgressText(progress) {
    if (!progress) return "";
    return tpl(T.importMeals.batchProgress, {
        label: progress.label,
        // THE BATCH NAMED IS THE ONE IN FLIGHT. progress.done is a
        // completed-work counter — the `.bar` above fills to it and
        // is right to — but this sentence names the batch whose rows
        // the label is describing, so printing the completed count
        // made it permanently one behind: a six-batch run opened on
        // "batch 0 of 6" and never reached "6 of 6", and a
        // single-batch import spent its whole run saying "batch 0 of
        // 1", which is never true of anything. Clamped because the
        // last chunk sets done = total before the done step paints.
        done: impNumLocale(Math.min(progress.done + 1, progress.total), true),
        total: impNumLocale(progress.total, true),
    });
}

// Step 3, "Preview" — also the card the import runs on.
//
//   o.rows            the built import rows (what will be sent)
//   o.skipped         rows dropped before sending (totals, blanks, bad dates)
//   o.badDates        of those, rows whose date did not read
//   o.badDateSample   { line, value } of the first such row, or null
//   o.dateFormat, o.energyUnit
//   o.chunks          how many import calls the rows split into
//   o.splitDates      dates that had to straddle calls (chunk.ts)
//   o.maxRows         the per-call row cap those were split at
//   o.alcoholTracked  the alcohol opt-in is on
//   o.progress        { done, total, label } while importing, else null
//   o.busy            an import is running
//   o.result          the run's aggregate so far, or null
//   o.noTools         a host is present and cannot call tools
//   o.canCallTools    a host is present and can
//   o.diagHtml        the diagnostics notice, or "" (the template's own:
//                     it names the maintainer's contact)
//   o.step, o.idPrefix
function importPreviewStep(o) {
    const rows = o.rows;
    const shown = rows.slice(0, 30);
    const kcal = rows.reduce((a, r) => a + (r.calories ?? 0), 0);
    const noTime = rows.filter(
        (r) => !/\d\d:\d\d/.test(String(r.logged_at)),
    ).length;
    const splitDates = o.splitDates;
    const chunks = o.chunks;
    // Fiber, sugar, alcohol and caffeine are missing from most
    // exports, so their columns appear only when this file actually
    // carries them — four columns of "—" would push the macros that
    // do have values off the visible width for no information.
    // Alcohol additionally never appears with tracking off: the
    // rows carry none by then, but the column is filtered by the
    // opt-in as well as by the data, so a stray value could not
    // put ethanol on screen. Caffeine has no such gate; it is
    // filtered by the data alone.
    //
    // Column labels come from T.importMeals.col* (they were English
    // literals — "C" and "Sug" mean nothing in Polish or French),
    // escaped here, so c[1] is HTML: the unit sits in a .u span
    // that the uppercase header leaves alone (table.css).
    const extra = [
        ["fiber_g", impEsc(T.importMeals.colFiber)],
        ["sugar_g", impEsc(T.importMeals.colSugar)],
        ["alcohol_g", impEsc(T.importMeals.colAlcohol), true],
        [
            "caffeine_mg",
            `${impEsc(T.importMeals.colCaffeine)} <span class="u">${impEsc(unitLabel("mg"))}</span>`,
        ],
    ].filter(
        (c) =>
            (!c[2] || o.alcoholTracked) &&
            rows.some((r) => r[c[0]] !== undefined),
    );
    const noToolsWhy = impId(o.idPrefix, "no-tools-why");
    return (
        impCardOpen() +
        impCardHead(T.importMeals.previewHeading, o.step, o.idPrefix) +
        '<div class="stat-row"><span>' +
        impBoldCount(impPluralN(T.importMeals.mealsToImport, rows.length)) +
        "</span><span>" +
        impBoldCount(
            tpl(T.importMeals.kcalTotal, {
                kcal: impNumLocale(kcal, true),
            }),
        ) +
        "</span>" +
        (o.skipped
            ? "<span>" +
              impBoldCount(impPluralN(T.importMeals.rowsSkipped, o.skipped)) +
              "</span>"
            : "") +
        "<span>" +
        impBoldCount(impPluralN(T.importMeals.batchCount, chunks)) +
        "</span></div>" +
        // State the two conversions applied, so the confirmation step
        // shows what will be sent rather than what the file said.
        '<div class="hint" style="margin-bottom:10px">' +
        impEsc(
            tpl(T.importMeals.datesReadAs, {
                format: impDateFormatLabel(o.dateFormat),
                conversion:
                    o.energyUnit === "kj"
                        ? T.importMeals.energyConvertedNote
                        : T.importMeals.energyReadAsKcal,
            }),
        ) +
        "</div>" +
        // Importing fewer rows than the file holds is the exact failure
        // this flow exists to prevent, so never let it pass silently.
        (o.badDates
            ? impNotice(
                  "warn",
                  impEsc(
                      impPluralN(T.importMeals.badDatesWarning, o.badDates, {
                          format: impDateFormatLabel(o.dateFormat),
                          sample: o.badDateSample
                              ? tpl(T.importMeals.badDateSample, {
                                    line: o.badDateSample.line,
                                    value: o.badDateSample.value,
                                })
                              : "",
                      }),
                  ),
              )
            : "") +
        (noTime
            ? impNotice(
                  "warn",
                  impEsc(impPluralN(T.importMeals.noTimeWarning, noTime)),
              )
            : "") +
        // A calendar date with more than max_rows_per_call rows on
        // its own has to be split across more than one import
        // call — max_rows_per_call and "keep every date together"
        // cannot both hold there. Flagged so the user knows why,
        // and because two identical rows for that date landing in
        // different calls can dedupe against each other instead of
        // both being written (see chunkRows in src/chunk.ts).
        (splitDates.length
            ? impNotice(
                  "warn",
                  impEsc(
                      impPluralN(
                          T.importMeals.splitDatesCount,
                          splitDates.length,
                      ) +
                          tpl(T.importMeals.splitDatesWarning, {
                              max: o.maxRows,
                              date: splitDates[0],
                          }),
                  ),
              )
            : "") +
        // .tedge wraps the scroller so its edge fades stay put
        // while the rows move under them; wireScrollEdges() turns
        // them on from scrollLeft.
        //
        // role/tabindex/aria-label, not decoration: the scroller is
        // a real tab stop (browsers focus a keyboard-scrollable box
        // whether or not we ask them to), and it was announcing as
        // an unnamed group ahead of every button on this step. The
        // name is the step's own heading — the widest column of the
        // table is off-screen at 320px, so "Preview" is what the
        // thing being scrolled is called on screen. tabindex="0" is
        // explicit because focusable-scroller is Chrome behaviour,
        // not a guarantee; table.css draws the ring.
        // data-focus-key: every progress tick rebuilds this table,
        // and a keyboard user scrolling it mid-import would
        // otherwise be dropped to <body> once per batch.
        '<div class="tedge"><div class="tscroll" role="region" tabindex="0" data-focus-key="preview-table" aria-label="' +
        impEsc(T.importMeals.previewHeading) +
        '"><table class="tbl"><thead><tr>' +
        "<th>" +
        impEsc(T.importMeals.tableLine) +
        "</th><th>" +
        impEsc(T.importMeals.tableWhen) +
        "</th><th>" +
        impEsc(T.importMeals.tableMeal) +
        "</th><th class='wide'>" +
        impEsc(T.importMeals.tableFood) +
        "</th>" +
        '<th class="num"><span class="u">' +
        impEsc(unitLabel("kcal")) +
        '</span></th><th class="num">' +
        impEsc(T.importMeals.colProtein) +
        '</th><th class="num">' +
        impEsc(T.importMeals.colCarbs) +
        '</th><th class="num">' +
        impEsc(T.importMeals.colFat) +
        "</th>" +
        extra.map((c) => '<th class="num">' + c[1] + "</th>").join("") +
        "</tr></thead><tbody>" +
        shown
            .map(
                (r) =>
                    "<tr><td class='dim'>" +
                    r.source_line +
                    "</td><td>" +
                    impEsc(r.logged_at) +
                    "</td><td>" +
                    impEsc(r.meal_type || "—") +
                    "</td><td class='wide'>" +
                    impEsc(r.description || T.importMeals.noNameFallback) +
                    '</td><td class="num">' +
                    impCellNum(r.calories) +
                    '</td><td class="num">' +
                    impCellNum(r.protein_g) +
                    '</td><td class="num">' +
                    impCellNum(r.carbs_g) +
                    '</td><td class="num">' +
                    impCellNum(r.fat_g) +
                    "</td>" +
                    extra
                        .map(
                            (c) =>
                                '<td class="num">' +
                                impCellNum(r[c[0]]) +
                                "</td>",
                        )
                        .join("") +
                    "</tr>",
            )
            .join("") +
        "</tbody></table>" +
        "</div></div>" +
        // AFTER the scroller, and outside `.tedge`. As the last node
        // INSIDE `.tscroll` the one line saying the preview is
        // truncated sat ~1.7-2.5k px below the fold of the very box
        // it describes — on the step whose whole job is to confirm
        // what will be written, where the stat row names the total
        // but never says only 30 rows are shown. Outside `.tedge`
        // too: that wrapper's edge fades span its full height and
        // would paint over a caption merely outside the scroller.
        (rows.length > shown.length
            ? '<div class="tmore">' +
              // Selected on the TOTAL: the noun follows it ("of
              // 1,234 rows"), in every locale's word order.
              impEsc(
                  plural(T.importMeals.showingRows, rows.length, {
                      shown: impNumLocale(shown.length, true),
                      total: impNumLocale(rows.length, true),
                  }),
              ) +
              "</div>"
            : "") +
        (o.progress
            ? '<div style="margin-top:12px"><div class="bar"><span style="width:' +
              Math.round((o.progress.done / o.progress.total) * 100) +
              '%"></span></div><div class="hint" style="margin-top:6px">' +
              impEsc(impProgressText(o.progress)) +
              "</div></div>"
            : "") +
        (o.result && o.result.chunkErrors.length
            ? o.result.chunkErrors
                  .map((e) => impNotice("error", impEsc(e)))
                  .join("")
            : "") +
        (o.result && o.result.rowErrors.length && !o.busy
            ? impNotice(
                  "error",
                  impEsc(
                      impPluralN(
                          T.importMeals.rowsWouldFail,
                          o.result.rowErrors.length,
                          {
                              line: o.result.rowErrors[0].line,
                              message: o.result.rowErrors[0].message,
                          },
                      ),
                  ),
              )
            : "") +
        (o.diagHtml || "") +
        // WHY THE PRIMARY BUTTON IS DEAD, on the card where it sits.
        // With the host withholding serverTools the user can still
        // parse, map and preview a file, and this step then greyed
        // out "Import 140 meals" with the only explanation two steps
        // back on the file card — which render() replaces wholesale,
        // so nothing carried it forward. Same translated string, no
        // new copy; aria-describedby ties it to the control, so the
        // reason is announced with the button rather than only read.
        (o.noTools
            ? impNotice(
                  "warn",
                  '<span id="' +
                      noToolsWhy +
                      '">' +
                      impEsc(T.importMeals.noToolsWarning) +
                      "</span>",
              )
            : "") +
        '<div class="actions"><button class="btn btn-primary" id="' +
        impId(o.idPrefix, "doImport") +
        '"' +
        (o.noTools ? ' aria-describedby="' + noToolsWhy + '"' : "") +
        (o.busy || !o.canCallTools ? " disabled" : "") +
        ">" +
        impEsc(
            o.busy
                ? T.importMeals.importingEllipsis
                : impPluralN(T.importMeals.importButton, rows.length),
        ) +
        "</button>" +
        '<button class="btn" id="' +
        impId(o.idPrefix, "backToMap") +
        '"' +
        (o.busy ? " disabled" : "") +
        ">" +
        impEsc(T.importMeals.backToMapping) +
        "</button></div>" +
        impCardClose()
    );
}

// ---- step 4: import complete ------------------------------------------------

// The aggregate a done step reads, with the fallback a done step with no
// result gets (a re-delivery racing a restart). chunkErrors is in the
// fallback because impDoneOk reads it, and would otherwise throw.
function impDoneResult(result) {
    return (
        result || {
            created: 0,
            deduplicated: 0,
            failed: 0,
            chunkErrors: [],
        }
    );
}

// Whether a finished import went cleanly: nothing failed and no batch threw.
// The caller decides from this whether the diagnostics notice is owed.
function impDoneOk(result) {
    const r = impDoneResult(result);
    return r.failed === 0 && !r.chunkErrors.length;
}

// Step 4, "Import complete".
//
//   o.result    the run's aggregate: { created, deduplicated, failed,
//               chunkErrors, warnings, rowErrors }, or null
//   o.skipped   rows dropped before sending
//   o.diagHtml  the diagnostics notice when !impDoneOk(o.result), else ""
//   o.step, o.idPrefix
function importDoneStep(o) {
    const r = impDoneResult(o.result);
    const ok = impDoneOk(r);
    const tail =
        (r.deduplicated
            ? impPluralN(T.importMeals.resultAlreadyLogged, r.deduplicated)
            : "") +
        (r.failed ? impPluralN(T.importMeals.resultFailed, r.failed) : "") +
        (o.skipped ? impPluralN(T.importMeals.resultSkipped, o.skipped) : "");
    return (
        impCardOpen() +
        impCardHead(T.importMeals.importCompleteHeading, o.step, o.idPrefix) +
        impNotice(
            ok ? "ok" : "warn",
            impBoldCount(
                impPluralN(T.importMeals.resultMealsImported, r.created),
            ) +
                impEsc(tail) +
                // The terminator is copy, not punctuation this
                // template owns: Japanese ends a sentence with "。",
                // and this one was closing "…記録済み" — whose own
                // comma is already the ideographic one — with a
                // Latin stop.
                impEsc(T.importMeals.sentenceEnd),
        ) +
        // WHY IT FAILED, ON THE CARD, IN THE USER'S LANGUAGE. A
        // batch that threw pushes its reason here and falls through
        // to this step, where the only trace of it was the card
        // styling itself `warn` and the reason sitting inside the
        // copy-paste diagnostics dump — which is deliberately
        // English maintainer-facing text, not UI. So a failed import
        // and an import of zero rows looked the same: "0 meals
        // imported." and nothing else. The preview step already
        // renders this exact array this exact way.
        (r.chunkErrors || [])
            .map((e) => impNotice("error", impEsc(e)))
            .join("") +
        // The server's own warnings, verbatim: English in every locale,
        // like every tool's model-facing text.
        (r.warnings || []).map((w) => impNotice("", impEsc(w))).join("") +
        (r.rowErrors && r.rowErrors.length
            ? // Same contract as the preview scroller above: a
              // named, ringed tab stop rather than an anonymous one.
              // Named with the table's own "Problem" column header —
              // the one translated leaf that says what these rows
              // are. A dedicated leaf would read better; adding one
              // touches all 9 copy files, which are another agent's
              // this round (noted in the handover).
              '<div class="tedge"><div class="tscroll" role="region" tabindex="0" data-focus-key="error-table" aria-label="' +
              impEsc(T.importMeals.tableProblem) +
              '" style="max-height:160px"><table class="tbl"><thead><tr><th>' +
              impEsc(T.importMeals.tableLine) +
              '</th><th class="wide">' +
              impEsc(T.importMeals.tableProblem) +
              "</th></tr></thead><tbody>" +
              r.rowErrors
                  .slice(0, 20)
                  .map(
                      (e) =>
                          "<tr class='bad'><td class='dim'>" +
                          e.line +
                          "</td><td class='wide'>" +
                          impEsc(e.message) +
                          "</td></tr>",
                  )
                  .join("") +
              "</tbody></table></div></div>"
            : "") +
        (ok ? "" : o.diagHtml || "") +
        '<div class="actions"><button class="btn" id="' +
        impId(o.idPrefix, "restart") +
        '">' +
        impEsc(T.importMeals.restartButton) +
        "</button></div>" +
        impCardClose()
    );
}

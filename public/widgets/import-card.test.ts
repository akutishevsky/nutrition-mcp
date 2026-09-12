// The import widget as one Dawn card per step, and the three contracts that
// came with the port: count strings pick their grammatical form without
// losing their other placeholders, each step's card carries the shared
// header / foot markup the bridge and keepFocus rely on, and a render that
// throws stops the import instead of writing behind a broken screen.
//
// Same evaluation technique as import-run.test.ts: the real assembled widget
// script, with only the `initWidget({…})` bootstrap cut off.
import { test, expect, beforeAll, afterAll } from "bun:test";

type Fn = (...a: never[]) => unknown;

// A root whose only job is to throw once render() starts writing into it —
// after the step's markup was built — which is exactly the case tryRender
// exists for. Everything keepFocus reads before write() is answered.
const fakeRoot = {
    html: "",
    contains: () => false,
    querySelector: () => {
        throw new Error("boom");
    },
    set innerHTML(v: string) {
        this.html = v;
    },
};

const g = globalThis as { document?: unknown };
const previousDocument = g.document;
const previousError = console.error;
beforeAll(() => {
    g.document = {
        getElementById: () => null,
        activeElement: null,
        hasFocus: () => false,
    };
});
afterAll(() => {
    g.document = previousDocument;
    console.error = previousError;
});

async function freshImportWidget() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("import-meals");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("import-meals bootstrap not found");
    const factory = new Function(
        `${script.slice(0, boot)}
         return {
             S,
             setAPI: (a) => { API = a; },
             setLocale,
             pluralN,
             fileStep,
             mapStep,
             previewStep,
             doneStep,
             autoMap,
             runImport,
         };`,
    );
    return factory() as Record<string, Fn> & {
        S: Record<string, unknown>;
        setLocale: (l: string) => Record<string, Record<string, unknown>>;
        pluralN: (forms: unknown, n: number, vars?: object) => string;
    };
}

const ROW = {
    source_line: 7,
    logged_at: "2026-07-18 08:10",
    description: "Porridge",
    meal_type: "breakfast",
    calories: 310,
    protein_g: 9,
    carbs_g: 52,
    fat_g: 6,
};

test("count strings keep their extra placeholders (never tpl(plural(…)))", async () => {
    const w = await freshImportWidget();
    const T = w.setLocale("en");
    w.S.rows = [ROW];
    w.S.busy = false;
    w.S.result = {
        created: 0,
        deduplicated: 0,
        failed: 0,
        chunkErrors: [],
        warnings: [],
        rowErrors: [
            { line: 7, message: "calories out of range" },
            { line: 9, message: "x" },
        ],
    };
    const html = (w.previewStep as () => string)();
    expect(html).toContain(
        "2 rows would fail, e.g. line 7: calories out of range",
    );
    const im = T.importMeals as Record<string, unknown>;
    expect(
        w.pluralN(im.badDatesWarning, 1, {
            format: "Day/Month/Year",
            sample: " (e.g. line 4: 31/31/2026)",
        }),
    ).toContain(
        "1 row was skipped because its date could not be read as Day/Month/Year (e.g. line 4: 31/31/2026)",
    );
});

test("pl and uk pick one / few / many, and counts are locale-formatted", async () => {
    const w = await freshImportWidget();
    let im = w.setLocale("pl").importMeals as Record<string, unknown>;
    expect(w.pluralN(im.rowsSkipped, 1)).toBe("1 pominięty wiersz");
    expect(w.pluralN(im.rowsSkipped, 2)).toBe("2 pominięte wiersze");
    expect(w.pluralN(im.rowsSkipped, 5)).toBe("5 pominiętych wierszy");
    expect(w.pluralN(im.rowsSkipped, 22)).toBe("22 pominięte wiersze");
    im = w.setLocale("uk").importMeals as Record<string, unknown>;
    expect(w.pluralN(im.importButton, 2)).toBe("Імпортувати 2 страви");
    expect(w.pluralN(im.importButton, 5)).toBe("Імпортувати 5 страв");
    // The form is chosen on the number, the display is the locale's: a
    // German reader sees "1.234", not the raw "1234" beside a "1.575 kcal".
    im = w.setLocale("de").importMeals as Record<string, unknown>;
    expect(w.pluralN(im.mealsToImport, 1234)).toContain("1.234");
});

test("every step is one c-acc card: header, count-only meta, focus target, foot", async () => {
    const w = await freshImportWidget();
    w.setLocale("en");
    w.S.table = {
        headers: ["Date", "Food Name", "Energy (kcal)"],
        rows: [["2026-07-18", "Porridge", "310"]],
        sourceLines: [2],
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
    (w.autoMap as () => void)();
    w.S.rows = [ROW];
    w.S.result = {
        created: 1,
        deduplicated: 0,
        failed: 0,
        chunkErrors: [],
        warnings: [],
        rowErrors: [],
    };
    const steps: [string, string, string][] = [
        ["file", "fileStep", "Choose your export"],
        ["map", "mapStep", "Map columns"],
        ["preview", "previewStep", "Preview"],
        ["done", "doneStep", "Import complete"],
    ];
    steps.forEach(([step, fn, title], i) => {
        w.S.step = step;
        w.S.result = step === "done" ? w.S.result : null;
        if (step === "done")
            w.S.result = {
                created: 1,
                deduplicated: 0,
                failed: 0,
                chunkErrors: [],
                warnings: [],
                rowErrors: [],
            };
        const html = (w[fn] as () => string)();
        expect(
            html.startsWith(
                '<section class="card c-acc"><div class="glow"></div>',
            ),
        ).toBe(true);
        expect(html).toContain(
            `<h1 class="ctitle" id="imp-title" tabindex="-1" data-focus-fallback>${title}</h1>`,
        );
        // The count only — the title already names the step.
        expect(html).toContain(`<span class="cmeta">Step ${i + 1} of 4</span>`);
        expect(html).not.toContain("·");
        expect(html).not.toContain("<h3");
        expect(
            html.endsWith(
                '<div class="foot" data-widget-foot></div></section>',
            ),
        ).toBe(true);
    });
});

test("the required field is marked for sight and for assistive tech", async () => {
    const w = await freshImportWidget();
    w.setLocale("en");
    w.S.table = {
        headers: ["Date", "Food Name"],
        rows: [["2026-07-18", "Porridge"]],
        sourceLines: [2],
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
    (w.autoMap as () => void)();
    const html = (w.mapStep as () => string)();
    expect(html).toContain('<span class="req" aria-hidden="true">*</span>');
    expect(html).toContain(
        'data-field="logged_at" aria-label="Date / time" aria-required="true"',
    );
    // Optional fields are named but not required.
    expect(html).toContain('data-field="description" aria-label="Food name">');
    expect(html).toContain("Fields marked * are required.");
    expect(html).toContain('<label class="label" for="srcapp">');
});

// A batch that threw leaves its reason in chunkErrors and falls through to the
// done step. The card used to show the summary notice and the English
// maintainer dump and nothing else, so a failed import and an import of zero
// rows were the same card in every language.
test("the done card states why a batch failed, not just that nothing was imported", async () => {
    const w = await freshImportWidget();
    w.setLocale("en");
    w.S.step = "done";
    w.S.skipped = 0;
    w.S.result = {
        created: 0,
        deduplicated: 0,
        failed: 0,
        chunkErrors: ["Rows 2–51: rig: simulated failure"],
        warnings: [],
        rowErrors: [],
    };
    const html = (w.doneStep as () => string)();
    expect(html).toContain("notice-error");
    expect(html).toContain("Rows 2–51: rig: simulated failure");
    // …on the card, not only inside the copy-paste diagnostics block.
    expect(html.indexOf("Rows 2–51")).toBeLessThan(
        html.indexOf('class="diag"'),
    );
});

test("a render that throws shows the error card and sends no chunk", async () => {
    const w = await freshImportWidget();
    w.setLocale("en");
    console.error = () => {};
    const calls: unknown[] = [];
    const ctx: string[] = [];
    w.setAPI({
        canCallTools: true,
        callTool: async (_n: string, args: unknown) => {
            calls.push(args);
            return { structuredContent: null };
        },
        updateModelContext: (t: string) => ctx.push(t),
    });
    (g.document as { getElementById: () => unknown }).getElementById = () =>
        fakeRoot;
    try {
        w.S.step = "preview";
        w.S.rows = [ROW];
        w.S.skipped = 0;
        w.S.sourceApp = "";
        await (w.runImport as () => Promise<void>)();
    } finally {
        (g.document as { getElementById: () => unknown }).getElementById = () =>
            null;
    }
    expect(w.S.aborted).toBe(true);
    expect(calls).toHaveLength(0);
    expect(w.S.busy).toBe(false);
    expect(ctx[0]).toContain("stopped after 0 of 1 batches");
    // The error card, not an emptied root: an import in progress is not a
    // readout, and a vanished card would hide whether anything was written.
    expect(fakeRoot.html).toContain("notice-error");
    expect(fakeRoot.html).toContain("data-widget-foot");
});

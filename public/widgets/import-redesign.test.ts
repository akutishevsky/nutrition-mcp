// Logic added with the 2026-10 import-meals redesign: the binary-file check,
// the phone preview's day groups, the matched-field count and its alcohol
// gate, the done step's "the assistant was told only" line, and the privacy
// note on a host without tool access. Same evaluation technique as
// import-run.test.ts: the assembled widget script is run with only the
// `initWidget({…})` bootstrap cut off.
import { test, expect, afterAll } from "bun:test";

// render() and announce() look elements up by id; with every lookup null
// they are harmless no-ops and no DOM is needed.
const previousDocument = (globalThis as { document?: unknown }).document;
(globalThis as { document?: unknown }).document = {
    getElementById: () => null,
};
afterAll(() => {
    (globalThis as { document?: unknown }).document = previousDocument;
});

type Row = Record<string, unknown>;

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
             CFG,
             setAPI: (a) => { API = a; },
             looksBinary,
             dayGroups,
             previewDays,
             autoMap,
             mapStep,
             fileStep,
             doneStep,
             runImport,
         };`,
    );
    return factory() as {
        S: {
            table: unknown;
            fileName: string;
            mapping: Record<string, number>;
            rows: Row[];
            skipped: number;
            sourceApp: string;
            step: string;
            dayOpen: Record<string, boolean>;
            modelSummary: string;
            result: unknown;
        };
        CFG: { drink_unit: string | null };
        setAPI: (a: unknown) => void;
        looksBinary: (buf: Uint8Array) => boolean;
        dayGroups: (
            shown: Row[],
            all: Row[],
        ) => { iso: string; rows: Row[]; count: number; kcal: number }[];
        previewDays: (shown: Row[], cols: string[]) => { body: string };
        autoMap: () => void;
        mapStep: () => string;
        fileStep: () => string;
        doneStep: () => string;
        runImport: () => Promise<void>;
    };
}

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

test("looksBinary flags an .xlsx (zip) and an old .xls (OLE2) head", async () => {
    const w = await freshImportWidget();
    expect(w.looksBinary(bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00))).toBe(true);
    expect(w.looksBinary(bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1))).toBe(true);
});

test("looksBinary flags a NUL byte in the head of BOM-less data", async () => {
    const w = await freshImportWidget();
    const buf = text("Date,Food\n2026-01-15,Oats\n");
    buf[5] = 0;
    expect(w.looksBinary(buf)).toBe(true);
});

test("looksBinary passes plain CSV and BOM'd UTF-16 text", async () => {
    const w = await freshImportWidget();
    expect(w.looksBinary(text("Date,Food\n2026-01-15,Oats\n"))).toBe(false);
    // "D\0a\0" after an FF FE byte-order mark: UTF-16LE carries NULs.
    expect(w.looksBinary(bytes(0xff, 0xfe, 0x44, 0x00, 0x61, 0x00))).toBe(
        false,
    );
    expect(w.looksBinary(bytes(0xfe, 0xff, 0x00, 0x44, 0x00, 0x61))).toBe(
        false,
    );
});

function meal(day: string, kcal: number | undefined, line: number): Row {
    return {
        source_line: line,
        logged_at: day + "T12:00",
        description: "Meal " + line,
        calories: kcal,
    };
}

test("a day cut by the row limit states the whole day's rows and kcal", async () => {
    const w = await freshImportWidget();
    const all = [
        meal("2026-10-08", 500, 2),
        meal("2026-10-09", 300, 3),
        meal("2026-10-09", 550, 4),
        meal("2026-10-09", 200, 5),
        meal("2026-10-09", 100, 6),
    ];
    w.S.rows = all;
    const shown = all.slice(0, 3);
    const groups = w.dayGroups(shown, all);
    expect(groups.map((g) => [g.iso, g.rows.length, g.count, g.kcal])).toEqual([
        ["2026-10-08", 1, 1, 500],
        ["2026-10-09", 2, 4, 1150],
    ]);
    w.S.dayOpen = { "2026-10-09": true };
    const html = w.previewDays(shown, ["calories"]).body;
    expect(html).toContain("4 rows · 1,150 kcal");
    expect(html).not.toContain("2 rows · 850 kcal");
    // The open, cut day says how many of its rows the list holds.
    expect(html).toContain("Showing 2 of 4 rows");
});

test("an unsorted export shows each date once, in first-seen order", async () => {
    const w = await freshImportWidget();
    const all = [
        meal("2026-10-09", 100, 2),
        meal("2026-10-08", 200, 3),
        meal("2026-10-09", 300, 4),
    ];
    w.S.rows = all;
    const groups = w.dayGroups(all, all);
    expect(groups.map((g) => g.iso)).toEqual(["2026-10-09", "2026-10-08"]);
    expect(groups[0]!.rows.map((r) => r.source_line)).toEqual([2, 4]);
    w.S.dayOpen = {};
    const html = w.previewDays(all, ["calories"]).body;
    expect(html.match(/id="day-2026-10-09"/g)?.length).toBe(1);
    expect(html.match(/data-v="2026-10-09"/g)?.length).toBe(1);
});

function tableFrom(headers: string[], rows: string[][]) {
    return {
        headers,
        rows,
        sourceLines: rows.map((_, i) => i + 2),
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
}

function matchedCount(html: string) {
    const m = html.match(/(\d+) of (\d+) fields? matched/);
    if (!m) throw new Error("no matched-field count in the map step");
    return { n: Number(m[1]), total: Number(m[2]) };
}

test("the matched-field count leaves alcohol out unless it is tracked", async () => {
    const headers = ["Date", "Food", "Calories", "Alcohol (g)"];
    const rows = [["2026-10-08", "Beer", "150", "14"]];

    const off = await freshImportWidget();
    off.CFG.drink_unit = null;
    off.S.table = tableFrom(headers, rows);
    off.S.fileName = "log.csv";
    off.autoMap();
    off.S.step = "map";
    const a = matchedCount(off.mapStep());

    const on = await freshImportWidget();
    on.CFG.drink_unit = "us";
    on.S.table = tableFrom(headers, rows);
    on.S.fileName = "log.csv";
    on.autoMap();
    on.S.step = "map";
    const b = matchedCount(on.mapStep());

    // Tracking on adds the alcohol field to the list and maps it.
    expect(b.total).toBe(a.total + 1);
    expect(b.n).toBe(a.n + 1);
    expect(off.S.mapping.alcohol_g ?? -1).toBe(-1);
});

function okImport() {
    const calls: string[] = [];
    let resolveCtx: (ok: boolean) => void = () => {};
    const ctx = new Promise<boolean>((r) => (resolveCtx = r));
    return {
        calls,
        resolveCtx,
        api: {
            canCallTools: true,
            callTool: async (_name: string, args: { dry_run: boolean }) => ({
                structuredContent: {
                    status: "success",
                    dry_run: args.dry_run,
                    warnings: [],
                    results: [{ source_line: 2, error: null }],
                    summary: { created: 1, deduplicated: 0, failed: 0 },
                },
            }),
            updateModelContext: (t: string) => {
                calls.push(t);
                return ctx;
            },
        },
    };
}

async function importOneRow(delivered: boolean) {
    const w = await freshImportWidget();
    const fake = okImport();
    w.setAPI(fake.api);
    w.S.rows = [meal("2026-10-08", 500, 2)];
    w.S.skipped = 0;
    w.S.sourceApp = "";
    w.S.fileName = "log.csv";
    await w.runImport();
    expect(w.S.step).toBe("done");
    expect(fake.calls).toHaveLength(1);
    // Until the host answers, nothing claims the summary was delivered.
    expect(w.doneStep()).not.toContain('class="ctxl"');
    fake.resolveCtx(delivered);
    await new Promise((r) => setTimeout(r, 0));
    return { w, summary: fake.calls[0]! };
}

test("the done step quotes the summary once the host accepted it", async () => {
    const { w, summary } = await importOneRow(true);
    expect(summary).toContain("Bulk meal import finished: 1 meals imported");
    const html = w.doneStep();
    expect(html).toContain('class="ctxl"');
    expect(html).toContain("The assistant was told only:");
    expect(html).toContain("<q>" + summary + "</q>");
});

test("the done step says nothing about the assistant when the host refused", async () => {
    const { w } = await importOneRow(false);
    expect(w.S.modelSummary).toBe("");
    const html = w.doneStep();
    expect(html).not.toContain('class="ctxl"');
    expect(html).not.toContain("The assistant was told only");
});

test("the privacy note is shown only where the panel itself imports", async () => {
    const w = await freshImportWidget();
    w.setAPI({ canCallTools: true });
    expect(w.fileStep()).toContain('class="priv"');
    w.setAPI({ canCallTools: false });
    const html = w.fileStep();
    expect(html).not.toContain('class="priv"');
    expect(html).toContain("Ask Claude to import the file instead");
});

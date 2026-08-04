// Behaviour tests for the import widget's runImport() flow — specifically the
// dry-run-failure path from issue #65: the server's reason for rejecting a
// batch (over MAX_ROWS_PER_CALL, a control-total mismatch, etc.) used to be
// swallowed. collect() copied it into S.result.warnings, but the code bailed
// out with a bare `return` while still on the "preview" step, and
// previewStep() never rendered warnings — only the unreachable doneStep()
// did. The fix pushes the reason into S.result.chunkErrors instead, which
// previewStep() already renders.
//
// Same evaluation technique as macros.test.ts: the real assembled widget
// script (bridge + inlined chunk.ts + the template) is run as one script with
// only the `initWidget({…})` bootstrap cut off, so this exercises the exact
// code a host runs.
import { test, expect, afterAll } from "bun:test";

// render() calls document.getElementById("root") unconditionally; stubbing
// it to always return null makes every render() call a harmless no-op
// (`if (!el) return;`) without pulling in a DOM.
const previousDocument = (globalThis as { document?: unknown }).document;
(globalThis as { document?: unknown }).document = {
    getElementById: () => null,
};
afterAll(() => {
    (globalThis as { document?: unknown }).document = previousDocument;
});

interface ToolCall {
    name: string;
    args: Record<string, unknown>;
}

interface StructuredContent {
    status: "success" | "partial_success" | "failed";
    dry_run: boolean;
    warnings: string[];
    results: { source_line: number; error: { message: string } | null }[];
    summary?: {
        created: number;
        deduplicated: number;
        failed: number;
    };
}

/** A row shaped enough to survive chunkRows + the args-building in runImport. */
function row(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        source_line: 2,
        logged_at: "2026-01-15T12:00",
        description: "Oatmeal",
        meal_type: "breakfast",
        calories: 400,
        protein_g: 10,
        carbs_g: 60,
        fat_g: 8,
        ...overrides,
    };
}

function fakeApi(responses: StructuredContent[]) {
    const calls: ToolCall[] = [];
    const queue = [...responses];
    return {
        calls,
        api: {
            canCallTools: true,
            callTool: async (name: string, args: Record<string, unknown>) => {
                // runImport reuses and mutates the same args object between
                // the dry-run and real calls (sets args.dry_run = false), so
                // snapshot it now rather than keep a live reference.
                calls.push({ name, args: JSON.parse(JSON.stringify(args)) });
                const structuredContent = queue.shift();
                return { structuredContent };
            },
            updateModelContext: () => {},
        },
    };
}

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
             runImport,
             previewStep,
         };`,
    );
    return factory() as {
        S: {
            rows: unknown[];
            skipped: number;
            sourceApp: string;
            busy: boolean;
            progress: unknown;
            result: {
                chunkErrors: string[];
                warnings: string[];
                created: number;
                deduplicated: number;
                failed: number;
            } | null;
            step: string;
        };
        CFG: { max_rows_per_call: number; import_tool_name: string };
        setAPI: (a: unknown) => void;
        runImport: () => Promise<void>;
        previewStep: () => string;
    };
}

test("a failed dry run surfaces the server's reason in chunkErrors, not silently", async () => {
    const w = await freshImportWidget();
    const { api } = fakeApi([
        {
            status: "failed",
            dry_run: true,
            warnings: [
                "A single call must carry 1 to 50 rows; got 51. Split the file into chunks, keeping all rows for one calendar date together.",
            ],
            results: [],
        },
    ]);
    w.setAPI(api);
    w.S.rows = [row()];
    w.S.skipped = 0;
    w.S.sourceApp = "";

    await w.runImport();

    // The exact gap from issue #65: this must NOT be empty.
    expect(w.S.result?.chunkErrors.length).toBe(1);
    expect(w.S.result?.chunkErrors[0]).toContain(
        "A single call must carry 1 to 50 rows",
    );
    // And it must actually render — previewStep is the step the user is
    // still on (S.step never advances to "done" on this path).
    const html = w.previewStep();
    expect(html).toContain("A single call must carry 1 to 50 rows");
    expect(html).toContain("notice-error");
});

test("a failed dry run stops before writing anything for real", async () => {
    const w = await freshImportWidget();
    const { api, calls } = fakeApi([
        { status: "failed", dry_run: true, warnings: ["nope"], results: [] },
    ]);
    w.setAPI(api);
    w.S.rows = [row()];
    w.S.skipped = 0;
    w.S.sourceApp = "";

    await w.runImport();

    // Only the dry-run call should have happened — no second (real) call.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.args.dry_run).toBe(true);
    expect(w.S.busy).toBe(false);
    expect(w.S.progress).toBeNull();
});

test("a failed dry run with no warnings still leaves a visible reason", async () => {
    const w = await freshImportWidget();
    const { api } = fakeApi([
        { status: "failed", dry_run: true, warnings: [], results: [] },
    ]);
    w.setAPI(api);
    w.S.rows = [row()];
    w.S.skipped = 0;
    w.S.sourceApp = "";

    await w.runImport();

    expect(w.S.result?.chunkErrors.length).toBe(1);
    expect(w.S.result?.chunkErrors[0]).toContain("Preflight check failed");
});

test("a passing dry run proceeds to write for real (happy path unaffected)", async () => {
    const w = await freshImportWidget();
    const { api, calls } = fakeApi([
        {
            status: "success",
            dry_run: true,
            warnings: [],
            results: [{ source_line: 2, error: null }],
        },
        {
            status: "success",
            dry_run: false,
            warnings: [],
            results: [],
            summary: { created: 1, deduplicated: 0, failed: 0 },
        },
    ]);
    w.setAPI(api);
    w.S.rows = [row()];
    w.S.skipped = 0;
    w.S.sourceApp = "";

    await w.runImport();

    expect(calls).toHaveLength(2);
    expect(calls[0]!.args.dry_run).toBe(true);
    expect(calls[1]!.args.dry_run).toBe(false);
    expect(w.S.result?.chunkErrors ?? []).toHaveLength(0);
    expect(w.S.result?.created).toBe(1);
    expect(w.S.step).toBe("done");
});

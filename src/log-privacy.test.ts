import { test, expect } from "bun:test";
import ts from "typescript";

// The privacy policy promises that the server runtime log does not contain
// your account id or email address. Every runtime log line is a console.*
// call, so this parses every non-test source file and fails if a console.*
// argument list mentions a user id, an email, a `user=` field or a per-user
// storage folder name. Per-user questions belong in tool_analytics.
//
// Parsed with the TypeScript compiler rather than scanned as text: a text
// window would flag the persistAnalytics({ user_id }) call that follows the
// log line in withAnalytics, and a hand-rolled paren counter trips on regex
// literals such as /[)]/.

const FORBIDDEN = /\buser(Id|_id)\b|user=|\bemail\b|folder\.name/;
const METHODS = new Set(["log", "warn", "error", "info"]);

/** The source text of every console.log/warn/error/info argument list. */
function consoleArguments(path: string, src: string) {
    const file = ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true);
    const found: { line: number; args: string }[] = [];
    const visit = (node: ts.Node) => {
        if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "console" &&
            METHODS.has(node.expression.name.text)
        ) {
            found.push({
                line:
                    file.getLineAndCharacterOfPosition(node.getStart()).line +
                    1,
                args: node.arguments.map((a) => a.getText(file)).join(", "),
            });
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return found;
}

test("argument extraction survives regex literals and stops at the call", () => {
    const src =
        'console.log(s.replace(/[)]/g, ""), userId); console.warn(x.split(/"/)); persistAnalytics({ user_id });';
    const calls = consoleArguments("t.ts", src);
    expect(calls.map((c) => c.args)).toEqual([
        's.replace(/[)]/g, ""), userId',
        'x.split(/"/)',
    ]);
    expect(calls.map((c) => FORBIDDEN.test(c.args))).toEqual([true, false]);
});

test("no runtime log line carries a user id or email", async () => {
    const glob = new Bun.Glob("**/*.ts");
    const offenders: string[] = [];
    let count = 0;
    for await (const path of glob.scan({ cwd: import.meta.dir })) {
        if (path.endsWith(".test.ts")) continue;
        const src = await Bun.file(`${import.meta.dir}/${path}`).text();
        for (const { line, args } of consoleArguments(path, src)) {
            count++;
            if (FORBIDDEN.test(args))
                offenders.push(`${path}:${line}: ${args.slice(0, 120)}`);
        }
    }
    // A glob or parser that found nothing would pass without checking anything.
    expect(count).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
});

// A health-sync connect link (/health-sync/connect/<id>) is a live pairing
// secret for 30 minutes, so the access log prints the path through
// accessLogPath, which hides the id. src/index.test.ts drives the real app to
// check the line it prints; this pins that the [req] line goes through it.
test("the access log line hides a connect link's id", async () => {
    const src = await Bun.file(`${import.meta.dir}/index.ts`).text();
    const req = consoleArguments("index.ts", src).filter(({ args }) =>
        args.includes("[req]"),
    );
    expect(req).toHaveLength(1);
    expect(req[0]!.args).toContain("accessLogPath(path)");
});

// Item and saved-meal names are the user's own food text, and the runtime log
// never carries it. A ToolError that quotes them carries a logText without
// them, and withAnalytics logs that instead of the message. Driven through the
// real withAnalytics with console captured; `persist` keeps the analytics row
// away from Supabase.
test("a meal-items refusal thrown through withAnalytics keeps item names off the console", async () => {
    const { withAnalytics } = await import("./analytics.js");
    const { findItem, validateItems } = await import("./meal-items.js");
    const { items } = validateItems(
        [
            {
                name: "Соус гірчичний",
                calories: 80,
                protein_g: 0,
                carbs_g: 20,
                fat_g: 0,
            },
            {
                name: "Insulin-day oats",
                calories: 300,
                protein_g: 10,
                carbs_g: 50,
                fat_g: 5,
            },
        ],
        { addedSugarRequired: false },
    );

    const lines: string[] = [];
    const methods = ["log", "warn", "error", "info"] as const;
    const saved = methods.map((m) => console[m]);
    for (const m of methods) {
        console[m] = (...args: unknown[]) => {
            lines.push(args.map(String).join(" "));
        };
    }
    const persisted: unknown[] = [];
    let result: { content: { text: string }[]; isError?: boolean };
    try {
        result = await withAnalytics(
            "log_saved_meal",
            async () => {
                findItem(items, "tomato soup");
                return { content: [{ text: "unreachable" }] };
            },
            { userId: "u-1" },
            {},
            { persist: (r) => persisted.push(r) },
        );
    } finally {
        methods.forEach((m, i) => (console[m] = saved[i]!));
    }

    // The caller still gets the names, to pick an item by.
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Соус гірчичний");
    // The log line is there, with the category, and without any food text.
    const log = lines.join("\n");
    expect(log).toContain(
        "[analytics] log_saved_meal error=meal_items_invalid",
    );
    for (const text of ["Соус", "Insulin-day oats", "tomato soup", "u-1"]) {
        expect(log).not.toContain(text);
    }
    expect(persisted).toHaveLength(1);
});

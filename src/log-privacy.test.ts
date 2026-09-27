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

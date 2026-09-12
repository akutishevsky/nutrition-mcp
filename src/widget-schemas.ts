// Live tool-schema access for BUILD-TIME and TEST code only.
//
// Nothing the running server does may import this module: it spins up a
// throwaway McpServer purely to read schemas back out, so importing it from a
// request path would register the whole tool set a second time for no reason.
// It lives in src/ rather than scripts/ for one reason — `bun run typecheck` is
// scoped to src/ and CI-gated, so a drift here fails a PR instead of only
// failing whoever next runs the harness.
//
// Consumers: scripts/widget-harness.ts (assertFixturesMatchSchemas, run before
// the harness serves anything) and the landing-page generator, which validates
// its demo payloads against the same real schemas.

import { McpServer } from "@modelcontextprotocol/server";
import { registerTools } from "./mcp.js";

/** A parsed-in-place schema: all these callers need of a Zod object. */
export type OutputSchema = { parse(v: unknown): unknown };

// Pull the tools' REAL outputSchemas by registering them against a throwaway
// McpServer and intercepting registerTool. Nothing is restated here — no copy
// of a field list to fall out of date, which is the failure this whole check
// exists to make impossible.
export function collectOutputSchemas(): Map<string, OutputSchema> {
    const server = new McpServer(
        { name: "widget-harness", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    const schemas = new Map<string, OutputSchema>();
    const original = server.registerTool.bind(server);
    (server as unknown as { registerTool: unknown }).registerTool = (
        name: string,
        config: { outputSchema?: OutputSchema },
        handler: unknown,
    ) => {
        if (config?.outputSchema) schemas.set(name, config.outputSchema);
        return (original as unknown as (...a: unknown[]) => unknown)(
            name,
            config,
            handler,
        );
    };
    // widgetsEnabled true, alcohol null: neither affects an outputSchema, which
    // is static per tool.
    registerTools(server, "harness-user", true, null);
    return schemas;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

// Every key `parse()` DROPPED, at any depth, as a dotted path.
//
// This is the whole point of the guard and it used to stop at depth 1. Zod's
// z.object() strips unknown keys rather than rejecting them at EVERY level, so
// a top-level-only diff sees `range_days` (the original drift) but not a stale
// field inside `days[]`, `series[]`, `weight` or `summary` — the fixture would
// still parse, still look meaningful in the served HTML, and the widget would
// still never receive it. That is the same class of drift the guard exists to
// make impossible, so it has to walk.
//
// Array indices collapse to `[]` and paths are de-duplicated: a stale field on
// all 30 days of a series is one problem to fix, not thirty lines of output.
//
// What it deliberately does NOT catch, so nobody reads more into a green boot
// than is there: a key whose VALUE the schema rewrote rather than dropped (a
// z.coerce, a .default(), a .transform()) survives this check, because the key
// is still present after parse(). Only presence is compared.
export function droppedKeys(
    fixture: unknown,
    parsed: unknown,
    path = "",
    out = new Set<string>(),
): Set<string> {
    if (Array.isArray(fixture)) {
        if (!Array.isArray(parsed)) return out;
        const n = Math.min(fixture.length, parsed.length);
        for (let i = 0; i < n; i++)
            droppedKeys(fixture[i], parsed[i], `${path}[]`, out);
        return out;
    }
    if (isPlainObject(fixture)) {
        if (!isPlainObject(parsed)) return out;
        for (const [key, value] of Object.entries(fixture)) {
            const where = path ? `${path}.${key}` : key;
            if (!(key in parsed)) out.add(where);
            else droppedKeys(value, parsed[key], where, out);
        }
        return out;
    }
    return out;
}

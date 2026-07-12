# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nutrition-mcp is a Model Context Protocol (MCP) server for nutrition-related functionality, built with Bun and TypeScript. Entry point is `src/index.ts`. Server version must be updated in three places: `package.json`, `src/mcp.ts` (McpServer constructor), and `server.json`. The server icon is at `public/favicon.ico`. Tool call analytics (duration, success/failure, error category) are tracked via `src/analytics.ts` and persisted to a `tool_analytics` Supabase table.

## Releasing

This is a remote MCP server: deploying to DigitalOcean makes code changes live for clients immediately (the MCP Registry is only discovery metadata pointing at `https://nutrition-mcp.com/mcp`, so republishing is not required for a fix to take effect). To refresh the registry listing on a release, bump the version in all three places above, merge to `main`, then push a matching `v*` tag:

```
git tag v1.13.3 && git push origin v1.13.3
```

The `.github/workflows/publish-mcp.yml` workflow then runs the tests, verifies the tag matches `server.json`'s version, and publishes via `mcp-publisher` using GitHub OIDC (no secrets). Each published version must be unique and is immutable once published, so always tag a fresh version — never re-tag an already-published one.

## Commands

- `bun run src/index.ts` - Run the server
- `bun --watch src/index.ts` - Run with watch mode (restarts on file changes)
- `bun test` - Run all tests
- `bun test src/path/to/file.test.ts` - Run a single test file
- `bun run format` - Format code with Prettier (4-space indentation)

## Bun Runtime

Default to Bun for everything. Do not use Node.js equivalents.

- `bun <file>` instead of `node`/`ts-node`
- `bun install` instead of `npm install`
- `bun run <script>` instead of `npm run`
- `bunx <pkg>` instead of `npx`
- Bun auto-loads `.env` — don't use dotenv

### Preferred Bun APIs

- `Bun.serve()` for HTTP/WebSocket servers (not Express)
- `bun:sqlite` for SQLite (not better-sqlite3)
- `Bun.redis` for Redis (not ioredis)
- `Bun.sql` for Postgres (not pg/postgres.js)
- `Bun.file` for file I/O (not node:fs readFile/writeFile)
- `Bun.$\`cmd\`` for shell commands (not execa)
- Built-in `WebSocket` (not ws)

### Testing

```ts
import { test, expect } from "bun:test";
```

### Frontend (if needed)

Use HTML imports with `Bun.serve()` — not Vite. HTML files can directly import `.tsx`/`.jsx`/`.js` and Bun bundles automatically. Bun API docs: `node_modules/bun-types/docs/**.mdx`.

---

## Custom UI Widgets (MCP Apps)

In-chat UI uses **MCP Apps** (the official 2026-01-26 MCP extension), which renders across Claude, ChatGPT, VS Code, Goose, and MCP Inspector from one implementation. Widgets live in `public/widgets/` and are wired in `src/mcp.ts`: the `get_nutrition_summary` dashboard (`nutrition-summary.html`), the `get_goal_progress` view (`goal-progress.html`), the meal-progress rings (`meal-logged.html`, which renders nothing when no goals are set), and the `get_trends` view (`trends.html`, an interactive 7/14/30-day toggle). They share one design language — see `public/widgets/STYLE_GUIDE.md`.

**Interactive widgets slice client-side.** `trends.html` has a 7/14/30-day toggle: rather than round-trip to re-call the tool, `get_trends` sends up to 30 days of daily series and the widget slices/re-averages/re-renders locally, so switching ranges is instant and needs no host tool-call support. Prefer this pattern (send a superset, filter in the widget) for range/filter toggles.

**One widget can back several tools.** `meal-logged.html` is linked by **both** `log_meal` and `update_meal`: both declare `outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA` and build their `structuredContent` through the shared `buildMealProgress()` helper, so the payload shape is identical; the `action` field (`"logged"` / `"updated"`) only changes the widget's header. To reuse a widget across tools, point each tool's `_meta.ui.resourceUri` at the same `ui://` URI and keep their structuredContent shapes identical.

**Server wiring (`src/mcp.ts`):**

- Register the widget HTML as a resource with a `ui://` URI and mimeType **`text/html;profile=mcp-app`** (see the `SUMMARY_WIDGET_URI` / `APP_UI_MIME_TYPE` constants). Serve it via `Bun.file(...).text()`.
- Link it on the tool config: `_meta: { ui: { resourceUri: "ui://..." } }`. The SDK supports `_meta` and `outputSchema` on `registerTool`.
- The tool must return `structuredContent` (declare an `outputSchema` and return it on **every** path — this then emits structuredContent for all clients, not just UI ones). The widget renders from `structuredContent`; `content` remains the model-facing text.

**The widget file is a single self-contained HTML** — inline CSS + JS, zero network requests. The iframe CSP is deny-by-default: **no CDN/external scripts**, and `eval`/`new Function` are blocked. To use a chart library, bundle it inline (a Bun build step); we use hand-built SVG instead (0 KB, follows CSS light/dark vars natively via `currentColor` / `var(--…)`).

**Styling — reuse the shared design language.** All widgets share one look (Apple-like neutral surfaces, brand green accent, theme tokens, donut gauge, SVG trend chart). Because CSP forbids a linkable stylesheet, reuse is copy-paste: the tokens and component CSS live as ready-to-paste blocks in **`public/widgets/STYLE_GUIDE.md`**. Start any new widget from there and keep the shared blocks byte-identical across widgets.

**The iframe→host handshake must be exact.** Strict hosts (MCP Inspector) validate the request shape and silently drop malformed ones — symptom: widget stuck on "Loading…" while the tool succeeds server-side. Sequence over plain `window.postMessage(msg, "*")` to `window.parent`:

1. App → host: `ui/initialize` request. Params use **`appInfo`** and **`appCapabilities`** — NOT the MCP-core `clientInfo` / `capabilities` (this exact mix-up was the original bug): `{ protocolVersion: "2026-01-26", appInfo: {name, version}, appCapabilities: {} }`.
2. host → app: JSON-RPC response (host context incl. theme at `result.hostContext.theme`).
3. App → host: `ui/notifications/initialized` notification (no params). Required — without it strict hosts never send the result.
4. host → app: `ui/notifications/tool-result` notification with `params.structuredContent` → render. Only show the built-in sample fallback when there is no host (`window.parent === window`), never inside one.

**Ground truth when in doubt:** the reference SDK `@modelcontextprotocol/ext-apps` — `src/app.ts` `connect()` shows the exact initialize request; `dist/src/generated/schema.json` lists all `ui/*` method names. Spec: <https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/>, repo: <https://github.com/modelcontextprotocol/ext-apps>. Alternative to hand-rolling: bundle that package's `App` class inline (~100 KB, but tracks the spec). Verify without a real client using a local host-harness HTML that embeds the widget in a `sandbox="allow-scripts"` iframe, mimics the strict host, and pushes distinct data via `postMessage`.

---

# Claude Code Operating Instructions

## Core Philosophy

Default to **parallel execution** and **web-verified information**. Sequential execution and offline assumptions are fallback modes, not defaults. When in doubt: parallelize, then search.

---

## 1. Parallelization Protocol

### Default Behavior: Parallel-First

**Before starting any multi-step task:**

1. Decompose the full task into atomic subtasks
2. Build a dependency graph — identify which subtasks have no prerequisite outputs
3. Dispatch ALL dependency-free subtasks simultaneously using parallel tool calls
4. Only after their completion, dispatch the next wave of now-unblocked subtasks
5. Repeat until task is complete

**Rule:** If two tasks do not share an input/output dependency, they MUST run in parallel. Sequential execution of independent tasks is a performance violation.

### Parallel Tool Call Patterns

Prefer batching tool calls in a single response turn rather than sequential turns:

```
# CORRECT — dispatch independent reads simultaneously
- Read file A
- Read file B
- Search web for library version
(all in one turn)

# WRONG — needless sequencing
- Read file A → wait → Read file B → wait → Search web
```

### Sub-Agent Parallelization (Task Tool)

When using the `Task` tool to spawn sub-agents:

- Spawn all independent sub-agents in a single dispatch batch
- Maximum **5 concurrent sub-agents** at any time to avoid context exhaustion
- Each sub-agent must have a clearly scoped, non-overlapping responsibility
- Define explicit output contracts for each agent before spawning
- After all agents complete, explicitly synthesize their outputs — do not present raw agent outputs as the final answer

### TodoWrite Protocol

When managing complex tasks with `TodoWrite`:

- Mark tasks as `in_progress` before starting a parallel batch
- Track each parallel thread separately
- Never mark a parent task `completed` until all parallel children resolve
- Flag dependency chains explicitly in todo descriptions

### When Sequential Execution Is Permitted

Sequential execution is only justified when:

- Task B requires Task A's output as direct input
- Tasks write to the same file or resource (race condition risk)
- A previous parallel batch returned an error that changes downstream logic
- User explicitly requests step-by-step confirmation

In all other cases: **parallelize**.

---

## 2. Web Search Mandate

### Search-First Triggers

**Always perform a web search before proceeding** when the task involves any of the following:

| Category                     | Examples                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Library / framework versions | "What's the latest stable version of X?"                  |
| API behavior and signatures  | Any external SDK, REST API, or CLI tool                   |
| Security advisories          | CVEs, deprecated patterns, breaking changes               |
| Best practices               | Architecture patterns, language idioms updated post-2024  |
| Configuration options        | Tool flags, environment variables, cloud service settings |
| Error messages               | Unfamiliar stack traces, runtime errors                   |
| Compatibility questions      | Node/Python/Rust version support, browser APIs            |
| Pricing or limits            | Cloud service quotas, rate limits, SLA details            |

### Search Behavior Rules

1. **Search before assuming.** Do not rely on training knowledge for anything that changes over time. External information has a shelf life; always verify.

2. **Prefer official sources.** When web results conflict, prioritize: official docs > GitHub releases > well-known technical blogs > forums.

3. **Deduplicate within session.** If you have already searched for a query in this session and the result was unambiguous, do not re-search the same query. Cache the result mentally and reference it.

4. **Surface what you found.** When you use web search to inform a decision, briefly state the source and key fact. Do not silently use search results without attribution.

5. **Parallelize searches.** When multiple independent facts need to be looked up, dispatch all web searches simultaneously, not sequentially.

6. **Do not search for:** Internal project details, proprietary architecture, code that exists in the repository (read the file instead), or subjective style decisions.

### When Web Search Results Conflict with the Codebase

If web search returns guidance that contradicts patterns already established in the repo:

1. Note the conflict explicitly
2. Present both the current repo pattern and the web-sourced alternative
3. Do not silently override existing code with web-sourced patterns without user confirmation

---

## 3. Session Start Checklist

At the beginning of every new task or session, run the following in parallel:

- [ ] Read `CLAUDE.md` (this file) to confirm operating rules are loaded
- [ ] Identify the task's scope and decompose into subtasks
- [ ] Flag any subtasks that require web verification
- [ ] Check for existing relevant files in the repo before searching externally
- [ ] Dispatch first parallel batch

---

## 4. Quality and Safety Rules

- **No unverified version pinning.** Never write a dependency version (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.) without confirming via web search that it is current and non-deprecated.
- **No silent failures in parallel batches.** If one parallel subtask fails, halt dependent tasks immediately and report the failure before proceeding.
- **Conflict resolution in parallel file edits.** If two parallel sub-agents are asked to modify the same file, serialize those specific edits. All other work continues in parallel.
- **Do not hallucinate tool flags or API parameters.** If unsure whether a CLI flag exists, search first.

---

## 5. Communication Standards

- When executing a parallel batch, briefly state what is running in parallel and why
- When web search informs a decision, cite source and date if available
- When sequential execution is chosen over parallel, briefly state the dependency that forced it
- Keep explanations concise — action over narration

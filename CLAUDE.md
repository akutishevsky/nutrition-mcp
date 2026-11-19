# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project Overview

`nutrition-mcp` is a remote MCP server for personal nutrition tracking built with **Bun + TypeScript**, Hono, Supabase, and MCP TypeScript SDK **v2** (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`, Zod 4).

- Entry point: `src/index.ts`; MCP server factory: `src/mcp.ts` (tool registrations live in `src/mcp/tools/*.ts`, shared helpers in `src/mcp/*.ts`); 53 tools; Supabase data access: `src/db/*.ts` behind the `src/supabase.ts` barrel (keep importing `./supabase.js` so `mock.module` intercepts it).
- Merging to `main` auto-deploys to production (`https://nutrition-mcp.com/mcp`) and updates a listed server in Anthropic's connectors directory (`claude.ai/directory/nutrition-mcp`).

## Commands

- `bun run src/index.ts` — run the server (`bun --watch src/index.ts` for watch mode)
- `bun test` — run all tests (`bun test src/path/to/file.test.ts` for a single file)
- `bun run format` / `bun run format:check` — Prettier (4-space indentation; CI-gated)
- `bun run typecheck` — typecheck `src/` via `scripts/typecheck.ts` (CI-gated)
- `bun run gen:all` — regenerate `public/*.html` and `public/sitemap.xml` (CI runs this before tests)
- `bun run harness` — local MCP Apps widget host simulator (`scripts/widget-harness.ts`)
- `bun run dashboard:preview` — local web dashboard preview (`scripts/dashboard-preview.ts`)

## Bun Runtime Conventions

- Default to Bun (`bun`, `bun install`, `bun run`, `bunx`). Do not use Node equivalents or `dotenv` (Bun auto-loads `.env`).
- Prefer `Bun.serve()`, `Bun.file`, `Bun.$\`...\``, and `bun:test` (`import { test, expect } from "bun:test"`).

## Critical Invariants (Always Check Before Editing)

1. **Frozen `outputSchema`s**: Never add/remove/narrow fields on an already-deployed tool's `outputSchema` (`src/output-schemas.frozen.json` pins them). Put new widget-only data in `_meta` under a `nutrition-mcp.com/*` key (`src/widgets.ts`).
2. **Registered tool set (53 tools)**: Adding, renaming, or removing a `server.registerTool()` call (in `src/mcp/tools/*.ts`) requires updating `TOOLS` + English prose in `src/copy/tools.ts`, `src/copy/index.ts`, `README.md`, `public/llms.txt`, `src/mcp.test.ts` and `src/mcp/suites/*.ts`, and the directory listing, then running `bun run gen:all`.
3. **Claude directory rules**: Model-facing text (`description`, `title`, tool results, `SERVER_INSTRUCTIONS`) must describe, never direct; keep all 5 tool annotations accurate (`src/mcp/suites/protocol.ts` pins `destructiveHint` and `openWorldHint`).
4. **Apply DB migrations before deploying code**: `deleteAllUserData` and readers query new tables/columns immediately on boot.
5. **Privacy-clean runtime logs**: `console.*` lines must never log user IDs, emails, tokens, codes, or per-user paths (`src/log-privacy.test.ts`). Use `ToolError` (`src/errors.ts`) for caller-facing errors.
6. **Version bumps**: Update `package.json`, `src/mcp.ts`, and `server.json` together (`v*` tag triggers `.github/workflows/publish-mcp.yml`).
7. **Master English copy + keyed translations**: English copy and types live in `src/copy/<name>.ts`; non-English translations live in `src/copy/translations/<locale>.json` as partial overlays merged onto English by key (`src/copy/merge.ts`), so English-only edits never break `typecheck`.

## Architecture Reference Docs

Read only the doc relevant to the subsystem you are modifying:

| Subsystem                                                                                      | Doc                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| MCP v2 endpoint, 53 tools, schemas, USDA, saved meals, active calories, reads/errors           | [docs/architecture/mcp-and-tools.md](docs/architecture/mcp-and-tools.md)                   |
| In-chat MCP Apps widgets (`public/widgets/src/`), `@include`/`@inlinets`/`@i18n`, bridge & CSP | [docs/architecture/widgets.md](docs/architecture/widgets.md)                               |
| Bulk meal import, idempotency, data export & ZIP invariants                                    | [docs/architecture/import-export.md](docs/architecture/import-export.md)                   |
| OAuth 2.0, PKCE, session binding, token hashing, cleanup, `security.txt`, HSTS                 | [docs/architecture/oauth-and-security.md](docs/architecture/oauth-and-security.md)         |
| Apple Health sync & Apple Health activity sync                                                 | [docs/architecture/health-sync.md](docs/architecture/health-sync.md)                       |
| Web dashboard, public site generators, i18n copy & `depersonalize.ts`                          | [docs/architecture/web-dashboard-and-site.md](docs/architecture/web-dashboard-and-site.md) |

## Working Practices

- Batch independent file reads and searches in parallel rather than running sequential round-trips.
- Keep responses and edits concise; preserve existing comments and docstrings unrelated to your change.
- Run `bun run format:check && bun run typecheck && bun test` before finishing.

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

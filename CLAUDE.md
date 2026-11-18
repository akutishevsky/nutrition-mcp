# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project Overview

`nutrition-mcp` is a remote MCP server for personal nutrition tracking built with **Bun + TypeScript**, Hono, Supabase, and MCP TypeScript SDK **v2** (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`, Zod 4).

- Entry point: `src/index.ts`; MCP server & 55 tools: `src/mcp.ts`; Supabase data access: `src/supabase.ts`.
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
2. **Registered tool set (55 tools)**: Adding, renaming, or removing a `server.registerTool()` call requires updating `TOOLS` + English prose in `src/copy/tools.ts`, `src/copy/index.ts`, `README.md`, `public/llms.txt`, `src/mcp.test.ts`, and the directory listing, then running `bun run gen:all`.
3. **Claude directory rules**: Model-facing text (`description`, `title`, tool results, `SERVER_INSTRUCTIONS`) must describe, never direct; keep all 5 tool annotations accurate (`src/mcp.test.ts` pins `destructiveHint` and `openWorldHint`).
4. **Apply DB migrations before deploying code**: `deleteAllUserData` and readers query new tables/columns immediately on boot.
5. **Privacy-clean runtime logs**: `console.*` lines must never log user IDs, emails, tokens, codes, or per-user paths (`src/log-privacy.test.ts`). Use `ToolError` (`src/errors.ts`) for caller-facing errors.
6. **Version bumps**: Update `package.json`, `src/mcp.ts`, and `server.json` together (`v*` tag triggers `.github/workflows/publish-mcp.yml`).
7. **Master English copy + keyed translations**: English copy and types live in `src/copy/<name>.ts`; non-English translations live in `src/copy/translations/<locale>.json` as partial overlays merged onto English by key (`src/copy/merge.ts`), so English-only edits never break `typecheck`.

## Architecture Reference Docs

Read only the doc relevant to the subsystem you are modifying:

| Subsystem                                                                                      | Doc                                                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| MCP v2 endpoint, 55 tools, schemas, USDA, saved meals, active calories, reads/errors           | [docs/architecture/mcp-and-tools.md](docs/architecture/mcp-and-tools.md)                   |
| In-chat MCP Apps widgets (`public/widgets/src/`), `@include`/`@inlinets`/`@i18n`, bridge & CSP | [docs/architecture/widgets.md](docs/architecture/widgets.md)                               |
| Bulk meal import, idempotency, data export & ZIP invariants                                    | [docs/architecture/import-export.md](docs/architecture/import-export.md)                   |
| OAuth 2.0, PKCE, session binding, token hashing, cleanup, `security.txt`, HSTS                 | [docs/architecture/oauth-and-security.md](docs/architecture/oauth-and-security.md)         |
| Apple Health sync & Apple Health activity sync                                                 | [docs/architecture/health-sync.md](docs/architecture/health-sync.md)                       |
| Web dashboard, public site generators, i18n copy & `depersonalize.ts`                          | [docs/architecture/web-dashboard-and-site.md](docs/architecture/web-dashboard-and-site.md) |

## Working Practices

- Batch independent file reads and searches in parallel rather than running sequential round-trips.
- Keep responses and edits concise; preserve existing comments and docstrings unrelated to your change.
- Run `bun run format:check && bun run typecheck && bun test` before finishing.

# Munch

Munch is a production remote Model Context Protocol service for personal nutrition tracking. It gives ChatGPT and compatible MCP clients authenticated tools for food lookup, meal review and confirmation, persistent nutrition history, saved foods, recipes, meal planning, grocery lists, goals, water, weight, account controls, and household collaboration.

Production website: `https://munch.business`

Production MCP endpoint: `https://munch.business/mcp`

## Product model

Munch has a permanent Free tier — the website and app are free and fully featured — and an optional Premium subscription ($3/month: ad-free in the app, the in-app AI chat agent when it launches, and MCP access). Premium is purchased and managed only through the Munch website. MCP access is a Premium entitlement (Amendment D, 2026-11-09): the OAuth consent page states that plainly and a Free account cannot approve a connection, and every MCP request re-checks the current entitlement, refusing Free tool calls with an explanation that routes to the website. No MCP surface, tool result, or embedded widget initiates checkout.

Munch is a consumer wellness product. It provides factual nutrition records and source-aware estimates; it does not provide medical advice, diagnosis, treatment, emergency guidance, or clinical dosing.

## Current capabilities

- Search USDA FoodData Central and Open Food Facts, including barcode lookup.
- Cache provider results in Railway PostgreSQL while preserving immutable source snapshots in confirmed records.
- Prepare meal reviews from ChatGPT-supplied food candidates and require explicit confirmation before permanent logging.
- Store structured meals, food items, nutrients, assumptions, provenance, water, weight, and goals.
- Save and reuse confirmed foods.
- Create, search, revise, archive, log, and plan personal and household recipes, import recipes from public URLs with a review step, and manage grocery lists.
- Export account data, revoke MCP connections, and delete an account through authenticated controls.
- Render self-contained ChatGPT widgets for summaries, trends, confirmation, and import workflows.

## Architecture

- **Runtime:** Bun and Hono
- **MCP:** `@modelcontextprotocol/sdk`
- **Authentication:** Better Auth, passwordless email through Resend, and OAuth 2.1-compatible authorization for MCP clients
- **Database:** Railway PostgreSQL with forced row-level security for user and household data
- **Billing:** Stripe Checkout and Customer Portal on the Munch website
- **Food providers:** USDA FoodData Central and Open Food Facts
- **Hosting:** Railway, deployed from the `main` branch

Munch does not use Supabase at runtime.

## Privacy and security boundaries

Munch derives user identity from the authenticated session or bearer token; MCP tools do not accept a selectable user identifier. Personal and household records are isolated in PostgreSQL using database roles and row-level security. Destructive operations require explicit confirmation and account deletion is tested against disposable accounts in CI.

Public policies and contacts:

- Privacy: `https://munch.business/privacy`
- Terms: `https://munch.business/terms`
- Help: `https://munch.business/help`
- Security: `https://munch.business/security`
- Support: `support@munch.business`
- Security reports: `security@munch.business`

Do not place credentials, personal nutrition data, or vulnerability details in public GitHub issues.

## Local development

Requirements:

- Bun 1.x
- PostgreSQL 17-compatible database
- Environment variables described in `.env.example`

Install and run:

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run dev
```

Primary quality checks:

```bash
bun run format:check
bun run commerce:check
bun run submission:check
bun run typecheck
bun test
```

The full GitHub Actions suite also runs migrations twice for idempotency, Better Auth/OAuth smoke tests, reviewer-account readiness, nutrition and household RLS tests, recipe-planning tests, account export/deletion tests, operational readiness checks, and a production container build.

## OpenAI submission package

Submission materials are version controlled in:

- `chatgpt-app-submission.json`
- `docs/openai-submission/`

The package includes listing copy, tool metadata, reviewer instructions, positive and negative test cases, and a release checklist. The production challenge token and reviewer password are intentionally excluded from Git.

## Attribution

Munch began as a fork of Alexander Kutishevsky's MIT-licensed Nutrition MCP project. The hosted Munch service is independently developed and operated. See `LICENSE` and `NOTICE.md` for applicable notices.

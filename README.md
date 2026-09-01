# Nutrition MCP

A remote MCP server for personal nutrition tracking — log meals with calories, macros, fiber, total sugar and caffeine, log water and body weight, review nutrition history, and import an existing food diary from another app, all through conversation. Alcohol tracking is opt-in and off by default.

[Help me pay for the servers on Patreon][patreon]

[patreon]: https://patreon.com/akutishevskyi

## Table of Contents

- [Quick Start](#quick-start)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [MCP Tools](#mcp-tools)
- [MCP Resources](#mcp-resources)
- [Self-hosting](#self-hosting)
    - [0. Get the code](#0-get-the-code)
    - [1. Supabase setup](#1-supabase-setup)
    - [2. Environment variables](#2-environment-variables)
    - [3. Google sign-in (optional)](#3-google-sign-in-optional)
- [Development](#development)
    - [Testing and quality](#testing-and-quality)
- [Connect to Claude.ai](#connect-to-claudeai)
- [API Endpoints](#api-endpoints)
- [Deploy](#deploy)
- [License](#license)

## Quick Start

Already hosted and ready to use — just connect it to your MCP client:

```
https://nutrition-mcp.com/mcp
```

**On Claude.ai:** Customize → Connectors → + → Add custom connector → paste the URL → Connect (see [Connect to Claude.ai](#connect-to-claudeai) below for the full walkthrough)

On first connect you'll be asked to register with an email and password. Your data persists across reconnections.

Switching from another tracker? See the [nutrition-app alternatives](https://nutrition-mcp.com/alternatives) — how it compares to [MyFitnessPal](https://nutrition-mcp.com/myfitnesspal-mcp), [Cronometer](https://nutrition-mcp.com/cronometer-mcp), [Lose It!](https://nutrition-mcp.com/lose-it-mcp), [MacroFactor](https://nutrition-mcp.com/macrofactor-mcp), [Yazio](https://nutrition-mcp.com/yazio-mcp), and [Lifesum](https://nutrition-mcp.com/lifesum-mcp). Bring your history with you: say "import my meals" and an importer opens in the chat, where you pick the CSV you exported from your old app, map its columns, and check what will be added before anything is saved. Exports from MyFitnessPal, Cronometer, Lose It! and MacroFactor are recognised automatically; any other CSV works by mapping its columns yourself. In clients that can't show in-chat panels, paste the export instead and the AI imports it for you. If your export has an alcohol column and you want it kept, turn alcohol tracking on before importing — the importer skips that column while tracking is off, and re-importing the same file later won't backfill it.

## Demo

[![Demo](https://img.youtube.com/vi/Y1EHbfimQ70/maxresdefault.jpg)](https://youtube.com/shorts/Y1EHbfimQ70)

Read the story behind it: [How I Replaced MyFitnessPal and Other Apps with a Single MCP Server](https://medium.com/@akutishevsky/how-i-replaced-myfitnesspal-and-other-apps-with-a-single-mcp-server-56ca5ec7d673)

## Tech Stack

- **Bun** — runtime and package manager
- **Hono** — HTTP framework
- **MCP SDK** — Model Context Protocol over Streamable HTTP
- **Supabase** — PostgreSQL database + user authentication
- **OAuth 2.0** — authentication for Claude.ai connectors

## MCP Tools

| Tool                       | Description                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `log_meal`                 | Log a meal with description, type, calories, macros, fiber, total sugar, alcohol, caffeine (mg), notes — from text or a photo of your plate      |
| `start_meal_import`        | Open the in-chat CSV importer: pick an export from another app, map its columns, preview, confirm                                                |
| `bulk_import_meals`        | Write up to 50 imported rows per call — each row validated, duplicates skipped so a re-send is safe                                              |
| `lookup_barcode`           | Look up a packaged product's label nutrition by barcode via Open Food Facts (read from a photo or typed)                                         |
| `get_meals_today`          | Get all meals logged today                                                                                                                       |
| `get_meals_by_date`        | Get meals for a specific date (YYYY-MM-DD)                                                                                                       |
| `get_meals_by_date_range`  | Get meals between two dates (inclusive)                                                                                                          |
| `search_meals`             | Search past meals by keyword, grouped into recurring variations (counts, last logged, typical macros)                                            |
| `get_nutrition_summary`    | Daily nutrition totals + goal progress for a date range                                                                                          |
| `update_meal`              | Update any fields of an existing meal                                                                                                            |
| `delete_meal`              | Delete a meal by ID                                                                                                                              |
| `set_nutrition_goals`      | Set daily calorie, macro, fiber and water targets to reach, sugar/alcohol/caffeine limits to stay under, plus an optional target weight          |
| `get_nutrition_goals`      | Get the current daily targets and limits                                                                                                         |
| `get_goal_progress`        | Get intake vs. targets and limits for a given day (default: today), plus latest weight vs. target                                                |
| `log_water`                | Log a hydration entry in milliliters                                                                                                             |
| `get_water_today`          | Get today's water intake total and entries                                                                                                       |
| `get_water_by_date`        | Get water intake for a specific date                                                                                                             |
| `delete_water`             | Delete a water log entry by ID                                                                                                                   |
| `log_weight`               | Log a body-weight measurement in kg or lb (converted and stored server-side)                                                                     |
| `get_weight_today`         | Get today's weight entries                                                                                                                       |
| `get_weight_by_date`       | Get weight entries for a specific date                                                                                                           |
| `get_weight_by_date_range` | Get weight entries between two dates (inclusive), grouped by day                                                                                 |
| `get_weight_trends`        | Weight trend: latest, overall change, 7/14/30-day moving averages, min/max, and goal progress                                                    |
| `update_weight`            | Update an existing weight entry                                                                                                                  |
| `delete_weight`            | Delete a weight entry by ID                                                                                                                      |
| `set_weight_unit`          | Set the preferred weight unit (`kg` or `lb`; null to clear)                                                                                      |
| `get_trends`               | 7/14/30-day averages, std dev, streaks, day-of-week, best/worst day                                                                              |
| `get_meal_patterns`        | Pre-aggregated behavioural patterns (breakfast effect, late dinner, weekend vs weekday, outliers)                                                |
| `export_all_data`          | Export every table — meals, water, weight, goals, profile — as one ZIP of CSVs plus a README, and return a 60-minute download link               |
| `get_profile`              | Get timezone (+ local date/time), widget language, weight unit, widget display and alcohol tracking in one call                                  |
| `set_timezone`             | Set the user's IANA timezone (e.g. `America/Los_Angeles`)                                                                                        |
| `set_language`             | Set the UI language for in-chat widgets (dashboards, charts) — not the language the AI replies in                                                |
| `get_current_time`         | Get the current date and time in the user's timezone, plus the UTC instant — for hosts with no clock in context                                  |
| `set_widget_display`       | Enable or disable the in-chat visual widgets (dashboards, rings, charts); enabled by default                                                     |
| `set_alcohol_tracking`     | Turn alcohol tracking on or off (off by default) and choose US standard drinks or UK units; turning it off hides alcohol rather than deleting it |
| `delete_account`           | Permanently delete account and all associated data                                                                                               |

## MCP Resources

| URI                          | Description                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `nutrition://weekly-summary` | Rolling 7-day digest (averages vs targets, best/roughest day) for proactive pulls |

## Self-hosting

### 0. Get the code

```bash
git clone https://github.com/akutishevsky/nutrition-mcp.git
cd nutrition-mcp
bun install
cp .env.example .env   # fill in real values as you go through the steps below
```

Requires Bun 1.x (matches the Dockerfile's `oven/bun:1` base image; no exact minor version is pinned).

> **Making it yours:** The public site includes the maintainer's personal bits — Google Analytics, Patreon/GitHub/contact links, and the `nutrition-mcp.com` domain. Run `bun run gen:all` to produce the public pages, then `bun run depersonalize` to strip the personal bits in one pass (analytics + CSP, the Support/Contact sections, social links, and the domain → a `your-domain.com` placeholder). Use `bun run depersonalize --dry` to preview without writing. Afterwards, swap in your own `public/og.png`, `favicon.ico`, and `apple-touch-icon.png`, and replace the domain placeholder with your real domain. This script only touches `public/*.html` and `src/index.ts` — it doesn't touch this README, so if you're publishing your own fork, also edit or remove the Patreon line near the top of this file and the Medium link in [Demo](#demo).

### 1. Supabase setup

1. Create a [Supabase](https://supabase.com) project.
2. Enable **Email Auth** (Authentication → Providers → Email) and disable email confirmation.
3. Apply the schema. The full schema lives in [`supabase/migrations/`](supabase/migrations/). With the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started):

    ```bash
    supabase link --project-ref <your-project-ref>
    supabase db push
    ```

    This creates every table, index, RLS policy, and foreign key the app needs. No local Postgres is involved — migrations run against your hosted project.

4. Copy the **service role key** from Project Settings → API and use it as `SUPABASE_SECRET_KEY`.

### 2. Environment variables

| Variable                | Description                                                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`          | Your Supabase project URL                                                                                                                                      |
| `SUPABASE_SECRET_KEY`   | Supabase service role key (bypasses RLS)                                                                                                                       |
| `OAUTH_CLIENT_ID`       | Random string for OAuth client identification                                                                                                                  |
| `OAUTH_CLIENT_SECRET`   | Random string for OAuth client authentication                                                                                                                  |
| `ALLOWED_ORIGINS`       | _(optional)_ Comma-separated list of extra browser origins allowed to call `/mcp` via CORS — `localhost`/`127.0.0.1` on any port are always allowed regardless |
| `GOOGLE_CLIENT_ID`      | _(optional)_ Google OAuth client ID for "Sign in with Google"                                                                                                  |
| `GOOGLE_CLIENT_SECRET`  | _(optional)_ Google OAuth client secret                                                                                                                        |
| `OFF_USER_AGENT`        | Open Food Facts User-Agent for barcode lookups, in the form `AppName (email)`                                                                                  |
| `PATREON_CLIENT_ID`     | _(optional)_ Patreon OAuth client ID, for showing recent posts on the landing page's Support section                                                           |
| `PATREON_CLIENT_SECRET` | _(optional)_ Patreon OAuth client secret                                                                                                                       |
| `PATREON_CAMPAIGN_ID`   | _(optional)_ Patreon campaign ID to fetch posts from                                                                                                           |
| `PATREON_ACCESS_TOKEN`  | _(optional)_ Creator's Access Token from Patreon's client management page — one-time bootstrap seed, see below                                                 |
| `PATREON_REFRESH_TOKEN` | _(optional)_ Creator's Refresh Token from the same page — one-time bootstrap seed, see below                                                                   |
| `PORT`                  | Server port (default: `8080`)                                                                                                                                  |

Generate OAuth credentials:

```bash
bun run generate-oauth-creds
```

or manually:

```bash
openssl rand -hex 16   # use as OAUTH_CLIENT_ID
openssl rand -hex 32   # use as OAUTH_CLIENT_SECRET
```

> **Patreon posts, one-time setup:** `PATREON_ACCESS_TOKEN` / `PATREON_REFRESH_TOKEN` are only ever read once, at server boot, to seed the `patreon_tokens` table if it's still empty — the server refreshes and stores its own pair from then on, so leaving these two set permanently is safe (every later boot is a no-op). You never need to touch the database by hand.

### 3. Google sign-in (optional)

Email/password works out of the box. To also offer **"Continue with Google"**,
follow [`docs/google-auth-setup.md`](docs/google-auth-setup.md) to create a
Google OAuth client, enable the Google provider in Supabase, and set
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. This adds the `GET /authorize/google`
and `GET /auth/google/callback` routes — see [API Endpoints](#api-endpoints).

## Development

```bash
bun install
cp .env.example .env   # fill in your credentials — see Self-hosting above for what to put here
bun run dev             # regenerates public/ pages, then starts with hot reload on http://localhost:8080
```

The generated pages under `public/` (index, tools, privacy, terms, login, `/alternatives`, locale mirrors, `sitemap.xml`) are build artifacts, not tracked in git — they're regenerated on every Docker build, in CI, and once at each `bun run dev` start. `--watch` only restarts the `src/index.ts` process on save, so it does **not** rerun generation — after editing `src/copy/`, `src/routes.ts`, or `scripts/site-partials.ts`, run `bun run gen:all` yourself to pick up the change.

### Testing and quality

```bash
bun test                # run the test suite
bun run format           # format with Prettier (4-space indentation)
bun run format:check     # verify the tree is prettier-clean
bun run typecheck        # typecheck src/
```

CI runs `format:check` and `typecheck` on every PR; `typecheck` is scoped to `src/`, so a type error in a test file or under `scripts/` won't be caught by it.

For in-chat widget development (`public/widgets/`), `bun run harness` starts a local host simulator so you can test widgets without a real MCP client.

## Connect to Claude.ai

1. Open [Claude.ai](https://claude.ai) and click **Customize**
2. Click **Connectors**, then the **+** button
3. Click **Add custom connector**
4. Fill in:
    - **Name**: Nutrition Tracker
    - **Remote MCP Server URL**: `https://nutrition-mcp.com/mcp`
5. Click **Connect** — sign in or register when prompted
6. After signing in, Claude can use your nutrition tools. If you reconnect later, sign in with the same email and password to keep your data.

## API Endpoints

| Endpoint                                      | Description                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `GET /health`                                 | Health check                                                                |
| `GET /.well-known/oauth-authorization-server` | OAuth metadata discovery (root + `/mcp`-scoped variants)                    |
| `GET /.well-known/oauth-protected-resource`   | OAuth protected-resource metadata discovery (root + `/mcp`-scoped variants) |
| `POST /register`                              | Dynamic client registration                                                 |
| `GET /authorize`                              | OAuth authorization (shows login page)                                      |
| `GET /authorize/google`                       | Redirects to Google's OAuth consent screen ("Continue with Google")         |
| `GET /auth/google/callback`                   | Google OAuth callback — exchanges the code, completes sign-in               |
| `POST /approve`                               | Login/register handler                                                      |
| `POST /token`                                 | Token exchange                                                              |
| `GET /favicon.ico`                            | Server icon                                                                 |
| `ALL /mcp`                                    | MCP endpoint (authenticated)                                                |

## Deploy

The project includes a `Dockerfile` for container-based deployment.

1. Push your repo to a hosting provider (e.g. DigitalOcean App Platform)
2. Set the environment variables listed above
3. The app auto-detects the Dockerfile and deploys on port `8080`
4. Point your domain to the deployed URL

## License

[MIT](LICENSE)

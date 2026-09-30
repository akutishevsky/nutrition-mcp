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
- [Troubleshooting](#troubleshooting)
- [API Endpoints](#api-endpoints)
- [Deploy](#deploy)
- [Support & security](#support--security)
- [Data sources](#data-sources)
- [License](#license)

## Quick Start

Already hosted and ready to use — just connect it to your MCP client:

```
https://nutrition-mcp.com/mcp
```

**On Claude.ai:** Customize → Connectors → + → Add custom connector → paste the URL → Connect (see [Connect to Claude.ai](#connect-to-claudeai) below for the full walkthrough)

On first connect, sign in with Google or enter an email and password and choose **Create account**. Your data persists across reconnections. Trouble connecting? See [Troubleshooting](#troubleshooting).

By connecting you agree to the [Terms of Service](https://nutrition-mcp.com/terms); how your data is handled is in the [Privacy Policy](https://nutrition-mcp.com/privacy).

Switching from another tracker? See the [nutrition-app alternatives](https://nutrition-mcp.com/alternatives) — how it compares to [MyFitnessPal](https://nutrition-mcp.com/myfitnesspal-mcp), [Cronometer](https://nutrition-mcp.com/cronometer-mcp), [Lose It!](https://nutrition-mcp.com/lose-it-mcp), [MacroFactor](https://nutrition-mcp.com/macrofactor-mcp), [Yazio](https://nutrition-mcp.com/yazio-mcp), and [Lifesum](https://nutrition-mcp.com/lifesum-mcp). Bring your history with you: say "import my meals" and an importer opens in the chat, where you pick the CSV you exported from your old app, map its columns, and check what will be added before anything is saved. Exports from MyFitnessPal, Cronometer, Lose It! and MacroFactor are recognised automatically; any other CSV works by mapping its columns yourself. In clients that can't show in-chat panels, paste the export instead and the AI imports it for you. If your export has an alcohol column and you want it kept, turn alcohol tracking on before importing — the importer skips that column while tracking is off, and re-importing the same file later won't backfill it.

## Demo

[![Demo](https://img.youtube.com/vi/Y1EHbfimQ70/maxresdefault.jpg)](https://youtube.com/shorts/Y1EHbfimQ70)

Read the story behind it: [How I Replaced MyFitnessPal and Other Apps with a Single MCP Server](https://medium.com/@akutishevsky/how-i-replaced-myfitnesspal-and-other-apps-with-a-single-mcp-server-56ca5ec7d673)

## Tech Stack

- **Bun** — runtime and package manager
- **Hono** — HTTP framework
- **MCP SDK** — Model Context Protocol over Streamable HTTP
- **Supabase** — PostgreSQL database + user authentication
- **OAuth 2.0** — authentication for Claude.ai and other MCP clients: per-client dynamic client registration (RFC 7591) with exact redirect-URI matching, mandatory PKCE (`S256`), token-endpoint client authentication (`none`, `client_secret_post`, `client_secret_basic`), codes and refresh tokens bound to the client they were issued to, `iss` on every authorization response (RFC 9207), and client secrets, access tokens, refresh tokens and codes stored only as a SHA-256 hash. Access tokens last 24 hours; refresh tokens last 90 days from their last use and rotate on every refresh; expired tokens and never-used client registrations are swept hourly

## MCP Tools

| Tool                       | Description                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `log_meal`                 | Log a meal with description, type, calories, macros, fiber, total sugar, alcohol, caffeine (mg), notes — from text or a photo of your plate      |
| `start_meal_import`        | Open the in-chat CSV importer: pick an export from another app, map its columns, preview, confirm                                                |
| `bulk_import_meals`        | Write up to 50 imported rows per call — each row validated, duplicates skipped so a re-send is safe while the timezone is unchanged              |
| `lookup_barcode`           | Look up a packaged product's label nutrition by barcode via Open Food Facts (read from a photo or typed; data © OFF contributors, ODbL)          |
| `get_meals_today`          | Get all meals logged today, one compact line per meal with its id; `detail: "full"` adds notes                                                   |
| `get_meals_by_date`        | Get meals for a specific date (YYYY-MM-DD), one compact line per meal; `detail: "full"` adds notes                                               |
| `get_meals_by_date_range`  | Get meals between two dates (inclusive), up to 31 days per call; one compact line per meal, `detail: "full"` adds notes                          |
| `search_meals`             | Search past meals by keyword, grouped into recurring variations (counts, last logged, typical macros)                                            |
| `get_nutrition_summary`    | Daily nutrition totals + goal progress for a date range, up to 92 days per call                                                                  |
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
| `get_weight_by_date_range` | Get weight entries between two dates (inclusive), grouped by day, up to 366 days per call                                                        |
| `get_weight_trends`        | Weight trend: latest, overall change, 7/14/30-day moving averages, min/max, and goal progress                                                    |
| `update_weight`            | Update an existing weight entry                                                                                                                  |
| `delete_weight`            | Delete a weight entry by ID                                                                                                                      |
| `set_weight_unit`          | Set the preferred weight unit (`kg` or `lb`; null to clear)                                                                                      |
| `get_trends`               | 7/14/30-day averages, std dev, streaks, day-of-week calorie averages, best/worst day by calories                                                 |
| `get_meal_patterns`        | Pre-aggregated behavioural patterns (breakfast effect, late dinner, weekend vs weekday, outliers)                                                |
| `export_all_data`          | Export everything stored about you — logs, goals, profile, account, telemetry, app connections — as one ZIP of CSVs + README; 60-minute link     |
| `get_profile`              | Get timezone (+ local date/time), widget language, weight unit, widget display and alcohol tracking in one call                                  |
| `set_timezone`             | Set the user's IANA timezone (e.g. `America/Los_Angeles`)                                                                                        |
| `set_language`             | Set the UI language for in-chat widgets (dashboards, charts) — not the language the AI replies in                                                |
| `get_current_time`         | Get the current date and time in the user's timezone, plus the UTC instant — for hosts with no clock in context                                  |
| `set_widget_display`       | Enable or disable the in-chat visual widgets (dashboards, rings, charts); enabled by default                                                     |
| `set_alcohol_tracking`     | Turn alcohol tracking on or off (off by default) and choose US standard drinks or UK units; turning it off hides alcohol rather than deleting it |
| `delete_account`           | Permanently delete the user's Nutrition MCP account and all data it stores about them                                                            |

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

> **Making it yours:** The public site includes the maintainer's personal bits — Google Analytics, Microsoft Clarity, Patreon/GitHub/contact links, and the `nutrition-mcp.com` domain. Run `bun run gen:all` to produce the public pages, then `bun run depersonalize` to strip the personal bits in one pass (the consent-gated analytics snippet, the consent banner and the footer "Cookie settings" button, plus the analytics CSP hosts, the Support/Contact sections, social links, and the domain → a `your-domain.com` placeholder). Use `bun run depersonalize --dry` to preview without writing. Afterwards, swap in your own `public/og.png`, `favicon.ico`, and `apple-touch-icon.png`, replace the domain placeholder with your real domain, and rewrite the analytics paragraphs of the privacy policy and terms (`src/copy/legal*.ts`), which still name both services. Its edits to the generated pages are undone by `bun run gen:all` — to regenerate, first change the sources it reads from (in `scripts/site-partials.ts`, either your own `GA_MEASUREMENT_ID` / `CLARITY_PROJECT_ID`, which `analyticsHead()` loads only after a visitor accepts the consent banner, or `ANALYTICS_ENABLED` set to false to drop the snippet, banner and button altogether; `SITE` in `src/routes.ts`), then run it again. This script only touches the generated files under `public/`, the import widget's support address, `src/index.ts` and the security.txt contact in `src/security-txt.ts` (blanked, so `/.well-known/security.txt` answers 404 until you set your own) — it doesn't touch this README or `SECURITY.md`, so if you're publishing your own fork, rewrite `SECURITY.md` for your deployment and also edit or remove the Patreon line near the top of this file and the Medium link in [Demo](#demo).

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

| Variable                | Description                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`          | Your Supabase project URL                                                                                                                                                                                                                                                                                                                |
| `SUPABASE_SECRET_KEY`   | Supabase service role key (bypasses RLS)                                                                                                                                                                                                                                                                                                 |
| `OAUTH_CLIENT_ID`       | _(optional, legacy)_ ID of the pre-registration static OAuth client. Clients now register themselves via `POST /register`; this only keeps older connections working until the legacy client is retired                                                                                                                                  |
| `OAUTH_CLIENT_SECRET`   | _(optional, legacy)_ Secret of the legacy static OAuth client                                                                                                                                                                                                                                                                            |
| `ALLOWED_ORIGINS`       | _(optional)_ Comma-separated list of extra browser origins allowed to call `/mcp` via CORS — `localhost`/`127.0.0.1` on any port are always allowed regardless                                                                                                                                                                           |
| `GOOGLE_CLIENT_ID`      | _(optional)_ Google OAuth client ID for "Sign in with Google"                                                                                                                                                                                                                                                                            |
| `GOOGLE_CLIENT_SECRET`  | _(optional)_ Google OAuth client secret                                                                                                                                                                                                                                                                                                  |
| `OFF_USER_AGENT`        | Open Food Facts User-Agent for barcode lookups, in the form `AppName (email)`                                                                                                                                                                                                                                                            |
| `PATREON_CLIENT_ID`     | _(optional)_ Patreon OAuth client ID, for showing recent posts on the landing page's Support section                                                                                                                                                                                                                                     |
| `PATREON_CLIENT_SECRET` | _(optional)_ Patreon OAuth client secret                                                                                                                                                                                                                                                                                                 |
| `PATREON_CAMPAIGN_ID`   | _(optional)_ Patreon campaign ID to fetch posts from                                                                                                                                                                                                                                                                                     |
| `PATREON_ACCESS_TOKEN`  | _(optional)_ Creator's Access Token from Patreon's client management page — one-time bootstrap seed, see below                                                                                                                                                                                                                           |
| `PATREON_REFRESH_TOKEN` | _(optional)_ Creator's Refresh Token from the same page — one-time bootstrap seed, see below                                                                                                                                                                                                                                             |
| `PORT`                  | Server port (default: `8080`)                                                                                                                                                                                                                                                                                                            |
| `NOINDEX`               | _(optional)_ Any non-empty value sends `X-Robots-Tag: noindex, nofollow` on every response and leaves Google Analytics, Clarity and the consent banner (with its footer "Cookie settings" button) out of the generated pages, for a dev or staging deploy. Must be set at build time too, since the pages are generated during the build |

Legacy only — a fresh deploy doesn't need these, since every client registers its own credentials via `POST /register`. To set the optional `OAUTH_CLIENT_*` pair for the legacy static client:

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
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. This adds the `POST /authorize/google`
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

## Troubleshooting

The full version, in 9 languages, is at [nutrition-mcp.com/tools#troubleshooting](https://nutrition-mcp.com/tools#troubleshooting). In short:

- **Won't connect, or keeps asking to sign in:** remove the connector and add it again with exactly `https://nutrition-mcp.com/mcp`, then sign in with the same email and password (or Google account) as before — your data belongs to the account, not the connection. It stays connected as long as you use it at least every 90 days.
- **`{"error":"session_expired"}` on the sign-in page:** the page is valid for 10 minutes and resets when the server restarts; reload it or start connecting again. `session_mismatch` means sign-in was finished in a different browser from the one that opened it.
- **Can't sign in / forgot password:** use **Sign in** for an existing account — a wrong email or password shows "Wrong email or password" and never creates a new account; **Create account** is only for a first visit. If you signed up with Google, use **Continue with Google**. There is no self-service reset yet — email anton@nutrition-mcp.com from your account's address.
- **History gone after reconnecting:** each email is a separate account; sign in with the one you used originally.
- **The AI answers but doesn't log:** check the connector is enabled for the conversation, ask explicitly, and approve tool permission prompts.
- **Meals on the wrong day:** days follow your timezone (UTC until you set one). Set it with `set_timezone`; past entries regroup, but one given a specific time while the timezone was wrong keeps that moment — fix it with `update_meal`. Set it before importing history: re-importing another app's file after a timezone change adds the rows again (a Nutrition MCP export is recognized and not duplicated).
- **No charts or cards:** widgets need a host that supports MCP Apps; after `set_widget_display`, start a new conversation. The meal-logged card only appears once goals are set.
- **Importer won't open or can't save:** ask the AI to import the file itself with `bulk_import_meals` (duplicates are skipped, so re-sending is safe as long as your timezone hasn't changed in between; set it before the first import). If you use the importer panel and want an alcohol column kept, turn alcohol tracking on first; the panel skips it while tracking is off.
- **"Rate limit exceeded" / "Too many failed authentication attempts":** 60 requests a minute per account, 30 a minute per network on the sign-in pages. After 20 rejected connection attempts in a row, a network is paused for 5 minutes, growing to at most an hour — usually an old connector retrying; remove and re-add it.
- **Barcode not found or wrong:** data comes from Open Food Facts (8–14 digits, no caffeine data); the AI can estimate from the name or a label photo.
- **Export link doesn't work:** links expire after 60 minutes and each export replaces the last; ask for a fresh one. An export reporting 0 meals when you expected history usually means you signed in with a different email.
- **Deleting your account:** `delete_account` permanently removes everything after you confirm; export first if you want a copy.
- **Reporting a problem:** bugs on [GitHub Issues](https://github.com/akutishevsky/nutrition-mcp/issues) (never include your password); security issues privately, as [SECURITY.md](SECURITY.md) describes.

## API Endpoints

| Endpoint                                      | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET /health`                                 | Health check                                                                   |
| `GET /.well-known/oauth-authorization-server` | OAuth metadata discovery (root + `/mcp`-scoped variants)                       |
| `GET /.well-known/oauth-protected-resource`   | OAuth protected-resource metadata discovery (root + `/mcp`-scoped variants)    |
| `POST /register`                              | Dynamic client registration (RFC 7591) — per-client, redirect URIs enforced    |
| `GET /authorize`                              | OAuth authorization (shows login page)                                         |
| `POST /authorize/google`                      | Login-page form; redirects to Google's consent screen                          |
| `GET /auth/google/callback`                   | Google OAuth callback — exchanges the code, completes sign-in                  |
| `POST /approve`                               | Login/register handler                                                         |
| `POST /token`                                 | Token exchange — client-authenticated, `redirect_uri` + PKCE verifier required |
| `GET /.well-known/security.txt`               | Security contact (RFC 9116); `Expires` rolls forward daily                     |
| `GET /security.txt`                           | 301 redirect to `/.well-known/security.txt`                                    |
| `GET /favicon.ico`                            | Server icon                                                                    |
| `ALL /mcp`                                    | MCP endpoint (authenticated)                                                   |

## Deploy

The project includes a `Dockerfile` for container-based deployment.

1. Push your repo to a hosting provider (e.g. DigitalOcean App Platform)
2. Set the environment variables listed above
3. The app auto-detects the Dockerfile and deploys on port `8080`
4. Point your domain to the deployed URL

## Support & security

- **Help, bugs, feature requests:** open a [GitHub issue](https://github.com/akutishevsky/nutrition-mcp/issues) or email anton@nutrition-mcp.com.
- **Security vulnerabilities:** do **not** open a public issue. Report privately via [GitHub private vulnerability reporting](https://github.com/akutishevsky/nutrition-mcp/security/advisories/new) or email anton@nutrition-mcp.com — see [SECURITY.md](SECURITY.md). Machine-readable contact: https://nutrition-mcp.com/.well-known/security.txt
- **Account deletion / your data:** the `delete_account` and `export_all_data` tools, or email the address above. See the [privacy policy](https://nutrition-mcp.com/privacy).

## Data sources

Barcode lookups (`lookup_barcode`) use product data from [Open Food Facts](https://world.openfoodfacts.org). Product data © Open Food Facts contributors, available under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). Every lookup result names Open Food Facts and the licence.

## License

[MIT](LICENSE)

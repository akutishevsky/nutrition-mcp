# Nutrition MCP

A remote MCP (Model Context Protocol) server for personal nutrition tracking. Connect it to Claude.ai as a custom connector to log meals, track macros, and review nutrition history.

## Tech Stack

- **Bun** — runtime and package manager
- **Hono** — HTTP framework
- **MCP SDK** — Model Context Protocol over Streamable HTTP
- **Supabase** — PostgreSQL database
- **OAuth 2.0** — authentication for Claude.ai connectors

## MCP Tools

| Tool                    | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `log_meal`              | Log a meal with description, type, calories, macros, notes |
| `get_meals_today`       | Get all meals logged today                                 |
| `get_meals_by_date`     | Get meals for a specific date (YYYY-MM-DD)                 |
| `get_nutrition_summary` | Daily nutrition totals for a date range                    |
| `delete_meal`           | Delete a meal by ID                                        |
| `update_meal`           | Update any fields of an existing meal                      |

## Setup

### 1. Supabase

Create the following tables in your Supabase project:

```sql
-- Meals table
create table meals (
  id uuid primary key default gen_random_uuid(),
  logged_at timestamptz not null default now(),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text not null,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  notes text
);

-- OAuth tokens (long-lived access tokens)
create table oauth_tokens (
  token text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- OAuth auth codes (short-lived, single-use)
create table auth_codes (
  code text primary key,
  redirect_uri text not null,
  code_challenge text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Generate a client ID and secret:

```bash
# Generate random values
echo "OAUTH_CLIENT_ID=$(openssl rand -hex 16)"
echo "OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)"
```

### 3. Run Locally

```bash
bun install
bun run dev    # with hot reload
# or
bun run start  # without hot reload
```

Server starts at `http://localhost:8080`. Health check: `GET /health`.

## Deploy to DigitalOcean App Platform

1. Push your repo to GitHub
2. In DigitalOcean dashboard: **Create App** → select your GitHub repo
3. It will detect the `Dockerfile` automatically
4. Set environment variables in the App settings:
    - `SUPABASE_URL`
    - `SUPABASE_SECRET_KEY`
    - `OAUTH_CLIENT_ID`
    - `OAUTH_CLIENT_SECRET`
5. Deploy — note the assigned URL (e.g. `https://nutrition-mcp-xxxxx.ondigitalocean.app`)
6. Set `SERVER_URL` to that URL (without trailing slash)
7. Redeploy

## Connect to Claude.ai

1. Go to [Claude.ai Settings → Integrations](https://claude.ai/settings/integrations)
2. Click **Add custom integration**
3. Fill in:
    - **Integration name**: Nutrition Tracker
    - **MCP Server URL**: `https://your-server.com/mcp`
    - **OAuth Client ID**: your `OAUTH_CLIENT_ID` value
    - **OAuth Client Secret**: your `OAUTH_CLIENT_SECRET` value
4. Click **Connect** — you'll be redirected to approve access
5. After approval, Claude can use your nutrition tools

## API Endpoints

| Endpoint                                      | Description                               |
| --------------------------------------------- | ----------------------------------------- |
| `GET /health`                                 | Health check                              |
| `GET /.well-known/oauth-authorization-server` | OAuth metadata discovery                  |
| `POST /register`                              | Dynamic client registration               |
| `GET /authorize`                              | OAuth authorization (shows approval page) |
| `POST /approve`                               | User approval handler                     |
| `POST /token`                                 | Token exchange                            |
| `ALL /mcp`                                    | MCP endpoint (authenticated)              |

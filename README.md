# Nutrition MCP

A remote MCP (Model Context Protocol) server for personal nutrition tracking. Connect it to Claude.ai as a custom connector to log meals, track macros, and review nutrition history.

## Tech Stack

- **Bun** — runtime and package manager
- **Hono** — HTTP framework
- **MCP SDK** — Model Context Protocol over Streamable HTTP
- **Supabase** — PostgreSQL database + user authentication
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

Enable **Email Auth** in your Supabase project (Authentication → Providers → Email). Then create the following tables:

```sql
-- Meals table
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
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
  user_id uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- OAuth auth codes (short-lived, single-use)
create table auth_codes (
  code text primary key,
  redirect_uri text not null,
  user_id uuid not null references auth.users(id),
  code_challenge text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Refresh tokens
create table refresh_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id),
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
5. Deploy — the app gets a public URL automatically (e.g. `https://nutrition-mcp-xxxxx.ondigitalocean.app`)

## Connect to Claude.ai

1. Open [Claude.ai](https://claude.ai) and click **Customize**
2. Click **Connectors**, then the **+** button
3. Click **Add custom connector**
4. Fill in:
    - **Name**: Nutrition Tracker
    - **Remote MCP Server URL**: `https://your-server.com/mcp`
5. Click **Connect** — sign in or register when prompted
6. After signing in, Claude can use your nutrition tools. If you reconnect later, sign in with the same email and password to keep your data.

## API Endpoints

| Endpoint                                      | Description                            |
| --------------------------------------------- | -------------------------------------- |
| `GET /health`                                 | Health check                           |
| `GET /.well-known/oauth-authorization-server` | OAuth metadata discovery               |
| `POST /register`                              | Dynamic client registration            |
| `GET /authorize`                              | OAuth authorization (shows login page) |
| `POST /approve`                               | Login/register handler                 |
| `POST /token`                                 | Token exchange                         |
| `GET /favicon.ico`                            | Server icon                            |
| `ALL /mcp`                                    | MCP endpoint (authenticated)           |

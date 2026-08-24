# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

nutrition-mcp is a Model Context Protocol (MCP) server for nutrition-related functionality, built with Bun and TypeScript. Entry point is `src/index.ts`. It runs on MCP TypeScript SDK **v2** (`@modelcontextprotocol/server` at runtime, `@modelcontextprotocol/client` only in tests) with Zod 4 as an explicit dependency; `@modelcontextprotocol/sdk` v1 is gone, so import `McpServer`, `InMemoryTransport`, `createMcpHandler` from `@modelcontextprotocol/server`. Every `inputSchema` / `outputSchema` here is a schema object (`z.object({…})`), never a raw shape: v2 still auto-wraps raw Zod 4 shapes via a deprecated overload, but the explicit form is the supported path, and it lets the exported `*_OUTPUT_SCHEMA` constants be `.parse()`d directly in tests. `/mcp` is a dual-era endpoint built on `createMcpHandler` (`src/mcp.ts`): it serves the `2026-07-28` revision (per-request `_meta` envelope, `server/discover`, no protocol-level sessions, `Mcp-Method` / `Mcp-Name` routing headers validated against the body) and, through the default `legacy: "stateless"` fallback, still answers `2025-11-25` clients with the same per-request `initialize` idiom the old hand-rolled transport used — one server factory backs both eras. The factory gets no Hono context: the authenticated user travels in the `authInfo.extra.userId` pass-through from `handleMcp`, and the public origin (for the icon URL) is read from `ctx.requestInfo`. The "/mcp over HTTP" section of `src/mcp.test.ts` drives both eras in-process by pointing a v2 `Client`'s `fetch` at the Hono route — there is no in-memory transport for the modern era, so that is the only way to test it. It lives inside `mcp.test.ts` deliberately: `mock.module` is process-wide, and a separate file with its own mock/restore of `./supabase.js` broke `middleware.test.ts`'s mock on Linux CI (not reproducible on macOS). Two rules follow: stub `./supabase.js` from an existing mock window rather than opening another, and restore from a snapshot taken **before** `mock.module` — Bun patches the namespace in place, so restoring from the live import is a no-op. `listChanged` is advertised `false` on purpose: the endpoint is stateless and refuses GET, so no channel exists to deliver a list-changed notification. Two v2 wire facts worth knowing: advertised schemas are JSON Schema 2020-12 (v1 stamped draft-07), and a POST whose `Content-Type` is not `application/json` is answered `415` before the body is read. Server version must be updated in three places: `package.json`, `src/mcp.ts` (McpServer constructor), and `server.json`. The server icon is at `public/favicon.ico`. Tool call analytics (duration, success/failure, error category) are tracked via `src/analytics.ts` and persisted to a `tool_analytics` Supabase table. Each row also carries `protocol_era` and `client_name`, because the runtime access log is a ring buffer holding well under an hour of traffic and cannot answer whether anyone still uses the 2025-era leg; retiring it is gated on `select count(distinct user_id) from tool_analytics where protocol_era = 'legacy' and invoked_at > now() - interval '30 days'` reaching zero — distinct **users**, over a window long enough to include people who log weekly. `client_name` is present on every modern call but only on a legacy `initialize`, since the stateless legacy leg builds a fresh server per request and only that one carries `clientInfo`.

**Registered tool set.** `src/mcp.ts` has 36 `server.registerTool()` calls; nothing counts or cross-checks that number automatically, so it is hand-typed in a dozen places and every one must move together when a tool is added, removed, or renamed. Beyond `src/mcp.test.ts` and `README.md`'s MCP Tools table, the count lives in `src/copy/tools.ts`'s `TOOLS` identity array and its English prose (`meta.title`/`meta.description`/`meta.ogDescription`/`hero.countBold`, plus a doc comment cross-checking the number against `mcp.ts`), duplicated verbatim in `src/copy/tools.<locale>.ts` for all 8 locales; in `src/copy/chrome.ts`'s `toolsSmall` nav pill string (+ 8 locale files), since that pill renders on every page via `nav()`, not just `/tools`; and in `src/copy/index.ts`'s landing-page body copy (+ 8 locale files). Only after every one of those is updated do `scripts/gen-tools.ts`, `scripts/gen-index.ts`, `scripts/gen-legal.ts`, `scripts/gen-alternatives.ts` and `scripts/gen-login.ts` need re-running — all five pull `chrome.ts`'s `nav()`/`footer()`, so all five regenerate even when only `tools.ts`/`index.ts` content changed, or the nav pill on `public/privacy.html`, `public/terms.html`, `public/login.html` and every `/alternatives/*.html` page (English and all 8 locale mirrors) goes stale while `/tools` itself is correct. Nothing enforces this: `src/site-copy.test.ts` pins unrelated phrases (caffeine mentions, export archive membership) but never asserts `TOOLS.length` against `countBold`/`toolsSmall`/the registered-tool count in `mcp.ts`, so a missed locale file fails no test and no typecheck — this is what happened consolidating five settings-`get_*` tools into `get_profile`, caught only by grepping for the stale count afterward.

## Deploying

This is a remote MCP server, and DigitalOcean auto-deploys `main`. **Merging to `main` ships to production** — there is no separate deploy step to run and no version bump or tag needed for a change to reach clients. Every client hitting `https://nutrition-mcp.com/mcp` picks it up as soon as the deploy finishes, so treat a merge as a release: prompt and tool-description edits go live exactly like code does.

## Publishing to the registry

Separate from deploying, and rarely required. The MCP Registry is only discovery metadata pointing at `https://nutrition-mcp.com/mcp`, so a fix takes effect without republishing. To refresh the registry listing on a release, bump the version in all three places above, merge to `main`, then push a matching `v*` tag:

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
- `bun run format:check` - Verify the tree is prettier-clean (CI runs this on every PR)
- `bun run typecheck` - Typecheck `src/` (CI runs this on every PR; it is scoped to `src/`, so a type error in a test file or under `scripts/` will not be caught)

The committed tree is kept prettier-clean, so `bun run format` only rewrites files you actually edited. Generated output that must not be formatted goes in `.prettierignore`.

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

In-chat UI uses **MCP Apps** (the official 2026-01-26 MCP extension), which renders across Claude, ChatGPT, VS Code, Goose, and MCP Inspector from one implementation. Widgets are **assembled from source partials at server startup** — not committed as built files. Sources live in `public/widgets/src/` (`shared/` partials + one `templates/*.html` per widget); `src/widgets.ts` inlines the partials (resolving `/*@include shared/…@*/` markers) into one self-contained HTML string per widget, cached and warmed at boot (`warmWidgets()` in `src/index.ts`). `src/mcp.ts` serves each via `getWidgetHtml(key)`. Every in-chat widget is **one compact card**: a header line, the widget's own top matter (a chart, a range toggle, a weight line), then the shared macro strip — a calorie ring beside its figure, three macro bars, a "limits" row (sugar / alcohol / caffeine / fiber), and the water line. The shell lives in `shared/base.css` (`.wrap.tight`, `.panel`, `.phead`, `.psec`) and the strip in `shared/macros.*`. The widgets: the `get_nutrition_summary` dashboard, the `get_goal_progress` view, the meal-progress strip (`meal-logged`, which renders nothing when no goals are set), the `get_trends` view (interactive 7/14/30-day toggle), the `get_weight_trends` view (data-scaled weight-over-time chart with the same toggle), and `import-meals` (the bulk-import flow — see "Bulk meal import" below). `component-gallery` is dev-only: it is listed in `WIDGET_TEMPLATES` so it is assembled and test-covered, but no `ui://` resource or tool references it, so no client can reach it — view it with `bun run harness`. They share one design language and one host bridge — see `public/widgets/STYLE_GUIDE.md`. `bun test src/widgets.test.ts` guards assembly (no unresolved markers, valid inline JS, every partial inlined in full).

A second marker, `/*@inlinets src/csv.ts@*/`, transpiles a TypeScript module from `src/` into the widget as plain JS. It exists so a widget can run **tested** server-side code instead of a hand-copied twin; it only works for modules with no runtime imports, and it strips module syntax because a bare `export` inside a `<script>` is a syntax error.

**Widget UI language.** `set_language` persists to `profiles.locale`; there is no standalone `get_language` — `get_profile` reports it in one line alongside timezone/weight unit/etc. (`localeFromProfile`/`getUserLocale` in `src/supabase.ts`, default `"en"`). `get_nutrition_summary`'s `structuredContent.locale` is that resolved value, read server-side so the widget renders its own strings without a second round trip — `z.string()`, not `z.enum(SITE_LOCALES)`, since `SITE_LOCALES` is a `readonly SiteLocale[]` and `getUserLocale`'s fallback is what actually guarantees a known code.

A third assembly marker, `/*@i18n@*/` (`src/widgets.ts`), inlines the whole `WIDGET_STRINGS` dictionary (`src/copy/widgets.ts`, one `widgets.<locale>.ts` per locale, like `chrome.ts`) as a `JSON.stringify`'d `const` — plain data only, since that's exactly what gets spliced in. It deliberately does **not** live inside `shared/i18n.js` itself: it sits once per template, immediately before that template's own `/*@include shared/i18n.js@*/` line, because `src/widgets.test.ts` requires every `@include`d partial's full text to appear verbatim in the assembled HTML, and the assembler's marker regexes match plain text — comments included — so a `/*@i18n@*/` sitting inside `i18n.js` would get replaced away and break that check, or self-include the very partial defining it (the same reason `shared/macros.js` hand-copies `DRINK_GRAMS` rather than pulling it in with `@inlinets`).

`shared/i18n.js` resolves which locale to render, exposed as the ambient `T` (mirroring `data-theme` as ambient theme rather than a threaded argument): `pickLocale(explicit, hostLocale)` prefers `structuredContent.locale` — per-user, always set — over the host's `hostContext.locale` — host-dependent, may be absent — over `"en"`, matched on BCP-47 base language. A template calls `setLocale()` from its `render()` once the payload's locale is known. `WidgetStrings` is plain strings except `PluralForms` (`{ one, other }`), picked via `Intl.PluralRules` — a browser built-in, no network request, so it's fine under the iframe's `default-src 'none'` CSP — falling back to `other` for any category the 2-form data lacks, consistent with translation here being AI-generated with no human review pass (same as the public site's — see below).

**Only `nutrition-summary` is fully wired end-to-end.** `goal-progress`, `meal-logged`, `trends`, and `component-gallery` already carry the `@i18n` marker and safely `@include shared/i18n.js` (`shared/macros.js`, which all four also include, needs `T` in scope) but never call `setLocale()`, so `T` stays its default `WIDGET_STRINGS.en` and they render English regardless of the profile's saved locale. `weight-trends` and `import-meals` don't include the i18n machinery at all yet. Extending a widget is then: call `setLocale()` from `render()`/`onReady()` as `nutrition-summary.html` does, and add its strings to `WidgetStrings` (every locale file) alongside the existing `macros` keys.

**`bun run harness`** is the local host simulator (`scripts/widget-harness.ts`). It mimics a strict host — validates the `ui/initialize` shape, withholds the tool result until `ui/notifications/initialized`, starts the iframe at 130px, applies the sandbox CSP — and additionally answers app-initiated `tools/call`, sends host→app requests, and executes the real `bulk_import_meals` against an in-memory store. Query flags reproduce host behaviour: `?serverTools=0`, `?tools=0`, `?delay=3000`, `?maxHeight=600`, `?fail=1`.

**Interactive widgets slice client-side.** `trends.html` has a 7/14/30-day toggle: rather than round-trip to re-call the tool, `get_trends` sends up to 30 days of daily series and the widget slices/re-averages/re-renders locally, so switching ranges is instant and needs no host tool-call support. Prefer this pattern (send a superset, filter in the widget) for range/filter toggles.

**One widget can back several tools.** `meal-logged.html` is linked by **both** `log_meal` and `update_meal`: both declare `outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA` and build their `structuredContent` through the shared `buildMealProgress()` helper, so the payload shape is identical; the `action` field (`"logged"` / `"updated"`) only changes the widget's header. To reuse a widget across tools, point each tool's `_meta.ui.resourceUri` at the same `ui://` URI and keep their structuredContent shapes identical.

**Server wiring (`src/mcp.ts`):**

- Register the widget HTML as a resource with a `ui://` URI and mimeType **`text/html;profile=mcp-app`** (see the `SUMMARY_WIDGET_URI` / `APP_UI_MIME_TYPE` constants). Serve it via `getWidgetHtml("<key>")` (from `src/widgets.ts`), which returns the assembled, fully-inlined document. To add a widget: create `public/widgets/src/templates/<key>.html` (reuse `@include shared/…` partials + call `initWidget({…})`), add the key to `WIDGET_TEMPLATES` in `src/widgets.ts`, and register the resource here.
- Link it on the tool config: `_meta: { ui: { resourceUri: "ui://..." } }`. The SDK supports `_meta` and `outputSchema` on `registerTool`.
- The tool must return `structuredContent` (declare an `outputSchema` and return it on **every** path — this then emits structuredContent for all clients, not just UI ones). The widget renders from `structuredContent`; `content` remains the model-facing text.

**The assembled widget is a single self-contained HTML** — inline CSS + JS, zero network requests. The iframe CSP **defaults** to deny-all (`default-src 'none'`): no CDN/external scripts, and `eval`/`new Function` are blocked. It is a default, not a hard limit — the apps spec defines `_meta.ui.csp` / `hostCapabilities.sandbox.csp` with `connectDomains`, `resourceDomains`, `frameDomains` and `baseUriDomains` — but nothing here needs relaxing it, and self-contained is still the right default. Worth knowing what the CSP does _not_ cover: `<input type="file">` and `FileReader` work fine under it, because reading a local file is not a network fetch (tested under `sandbox="allow-scripts"` plus `default-src 'none'`) — which is what makes the in-browser CSV parse in `import-meals` possible.

Because external scripts and stylesheets are out, reuse happens inline-at-build-time (the `@include` assembler) rather than through a linkable stylesheet or `<script src>`. To use a chart library, inline it the same way; we use hand-built SVG instead (0 KB, follows CSS light/dark vars natively via `currentColor` / `var(--…)`).

**Styling — reuse the shared design language.** All widgets share one look (Apple-like neutral surfaces, brand green accent, theme tokens, one compact card per widget, a donut gauge, thin metric bars, SVG trend charts). Layout inside the strip is driven by each `MACROS` entry's `role` in `shared/macros.js` (`cal` / `macro` / `limit` / `bar`) — never by a hardcoded key list, so a new nutrient appears exactly where its role says and nowhere else. The tokens and component CSS live as source partials in `public/widgets/src/shared/` and are inlined via `@include`; **`public/widgets/STYLE_GUIDE.md`** is the spec for those partials. Edit a partial once and every widget picks it up on next assembly — do **not** re-inline or fork a shared block into a template. Keep the JS host handshake in `shared/bridge.js` (`initWidget(config)`); a template supplies `{ name, loading, coerce, render, sample }`, plus an optional `onReady(api)` when it needs to call the server. `api` exposes `callTool(name, args, opts)`, `canCallTools` (whether the host advertised `hostCapabilities.serverTools`), `hostContext`, `hostInfo`, and `updateModelContext(text)`. Form controls and the preview table live in `shared/form.css` and `shared/table.css`; `.card` is the shared surface in `shared/base.css`.

Two bridge invariants that are easy to break: a message is only treated as a response to our request when it has **no** `method` and carries `result`/`error` (the host sends its own requests, with its own id counter — the spec's `ui/resource-teardown` example uses `id: 1`, which is why our ids are namespaced `app-N`), and inbound messages are rejected unless `event.source === host` (`window.parent.frames` is reachable cross-origin, so a sibling iframe could otherwise forge a tool result and repaint a widget).

**The iframe→host handshake must be exact.** Strict hosts (MCP Inspector) validate the request shape and silently drop malformed ones — symptom: widget stuck on "Loading…" while the tool succeeds server-side. Sequence over plain `window.postMessage(msg, "*")` to `window.parent`:

1. App → host: `ui/initialize` request. Params use **`appInfo`** and **`appCapabilities`** — NOT the MCP-core `clientInfo` / `capabilities` (this exact mix-up was the original bug): `{ protocolVersion: "2026-01-26", appInfo: {name, version}, appCapabilities: {} }`.
2. host → app: JSON-RPC response (host context incl. theme at `result.hostContext.theme`).
3. App → host: `ui/notifications/initialized` notification (no params). Required — without it strict hosts never send the result.
4. host → app: `ui/notifications/tool-result` notification with `params.structuredContent` → render. Only show the built-in sample fallback when there is no host (`window.parent === window`), never inside one.

**The widget MUST report its height, or the host clips it.** The host gives the iframe a small default height and only grows it when the app sends `ui/notifications/size-changed` with `{ width, height }`. Without it the widget renders fine but is cut off after the first row (this was a shipped bug). Measure the natural height by temporarily setting `document.documentElement.style.height = "max-content"`, reading `getBoundingClientRect().height`, then restoring; width is `window.innerWidth`. Wire a `ResizeObserver` (debounced with `requestAnimationFrame`) on `documentElement` + `body` so it re-reports after the tool-result render and after any interactive re-render (e.g. a toggle). Do **not** rely on `body { min-height: 100vh }` for sizing — it fights content-based measurement; let the body size to its content. **Test with a host-harness that starts the iframe SHORT (~130px) and grows it on `size-changed`** — a fixed-tall test iframe hides this bug entirely.

**Ground truth when in doubt:** the reference SDK `@modelcontextprotocol/ext-apps` — `src/app.ts` `connect()` shows the exact initialize request; `dist/src/generated/schema.json` lists all `ui/*` method names. Spec: <https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/>, repo: <https://github.com/modelcontextprotocol/ext-apps>. Alternative to hand-rolling: bundle that package's `App` class inline (~100 KB, but tracks the spec). Verify without a real client using a local host-harness HTML that embeds the widget in a `sandbox="allow-scripts"` iframe, mimics the strict host, and pushes distinct data via `postMessage`.

---

## Bulk meal import

Two entry points, one write path.

- **`start_meal_import`** returns the `import-meals` widget. Prefer it whenever the user has an actual file: the widget parses and maps the export **in the browser**, so rows never pass through the model and cannot be mistranscribed. Its `outputSchema` is load-bearing — with no `structuredContent` the bridge never paints and the iframe sits on its loading state — and it carries `tz` so the widget's preview matches what the server will store.
- **`bulk_import_meals`** is the universal fallback, callable by the model _and_ by the widget (default `_meta.ui.visibility` is `["model", "app"]`, so one tool serves both; `["app"]` would hide it from the model and break users who have widgets disabled).

`src/import.ts` holds the logic, free of Supabase so it unit-tests with fixtures; `src/mcp.ts` is a thin adapter supplying `insert` and `existingKeys`. `src/csv.ts` is the parser, inlined into the widget via `@inlinets`.

Non-obvious invariants, each of which was a real bug or nearly one:

- **Rows carry an explicit `import:<digest>:<ordinal>` idempotency key.** `insertMeal` derives a content hash when none is given, and that hash includes `logged_at` — but date-only rows all anchor at local noon, so two genuinely separate identical rows hashed alike and the second was silently swallowed as `deduplicated` while the control total still reconciled. The ordinal counts preceding identical rows in the same call, so replaying a file is still a perfect no-op. It is the ordinal and **not** `source_line`, so re-exporting a file with lines added still dedupes. Never split a calendar date across calls — the ordinal is per call.
- **Our own export re-imports by `id`, not by content.** The content digest structurally cannot recognize a meal coming back in: `log_meal` writes `auto:<digest>` keys and the importer writes `import:…` ones, and the two hash different renderings of `logged_at` (the export emits second-precision local wall time, which the importer then re-resolves). So every row carries an optional `source_id` — the `id` column of the `meals.csv` our own export writes — and a row naming a meal the user still has is reported `deduplicated` without an insert, on the dry-run path and the real one alike. Rows whose meal was since deleted key on `import:src:<uuid>:<ordinal>` so a second replay is still a no-op. Only uuid-shaped values count: a foreign app's `id` column is dropped rather than rejected, and passing a non-uuid to the uuid-typed `in ("id", …)` lookup would fail the whole batch on a cast error rather than simply not matching. The export's `timezone` column closes the other half of that gap: a row whose meal was since deleted — the actual "restore my data" case — still gets written fresh rather than deduplicated by id, so it also carries an optional `timezone` field (mapped by the widget from the export's own `timezone` column), which `resolveLoggedAt` uses in place of the account's current timezone when present and valid — otherwise an offset-less wall clock silently re-resolves against whatever timezone the account has now, moving the meal to a different local day (#97).

- **The tool never sets `isError`.** Failure is `status: "failed"` inside the `outputSchema`. `isError` short-circuits the SDK's output validation and hosts commonly surface only `content`, which would drop the per-row report that is the whole product. Consequence: `withAnalytics` needs its `outcome` callback, or failed imports log as successes.
- **`.nullable()` is not optional.** Nullable fields are emitted as _required_ with an `anyOf[type, null]` value, so every result row must be built from a complete literal with explicit `null`s. `src/import.test.ts` validates the serializer against the schema — the only guard, since `bun run typecheck` covers `src/` but not the shape a handler actually returns at runtime.
- **Bounds live in the handler, not in Zod.** A schema-level rejection happens before the handler runs, discarding the structured report, the warnings and the analytics row — for what will be the caller's most common mistake. Numbers use `z.coerce` like `log_meal`.
- **Timestamps accept a bare date (→ local noon), an offset-less local time (resolved in the profile timezone), or full ISO with an offset.** Offset-less is accepted deliberately: no fitness export carries an offset, so requiring one forces the caller to compute historical DST per row. Every resolved date asserts the `dateInTz` round trip, which turns never-existed local dates (`Pacific/Apia 2011-12-30`) into explicit errors. An unconfigured timezone silently means UTC, so the tool warns — a missing `profiles` row is the only reliable "never set" signal.

- **Every write path resolves `logged_at` through the same `parseLoggedAt` in `src/tz.ts`** — the importer via `resolveLoggedAt` (`src/import.ts`), the five manual tools (`log_meal`, `update_meal`, `log_water`, `log_weight`, `update_weight`) via `resolveWriteLoggedAt` and the `resolveWriteTimestamp` adapter in `src/mcp.ts`. Handing an offset-less string to the `timestamptz` column instead reads it in the DB session zone (UTC), which filed a Kyiv user's 21:00 meal at 00:00 the next day while the tool's own progress line reported the later date (issue #68). The two callers differ **only** in bounds: the importer is backfilling and takes 20 years back to 48 hours ahead; a manual entry has no past bound and a 5-minute future one, except a bare date, whose local-noon anchor is a placeholder for an unknown time and so is judged by calendar day. This is not about cross-route dedupe — the importer stamps `import:` keys and never reaches the `auto:` digest — it is about both routes filing the same string on the same local day, since every read path buckets by `dateInTz`.

---

## Data export

**One tool, `export_all_data`, is the only way out.** It writes a ZIP — `meals.csv`, `water.csv`, `weight.csv`, `goals.csv`, `profile.csv` and a `README.txt` — to `exports/<userId>/nutrition-mcp-export.zip` and returns a 60-minute signed link. A meals-only `export_meals` used to sit beside it and was removed rather than kept: two overlapping export tools made "export my data" ambiguous for the model, and the meal history is `meals.csv` inside the archive. The fixed per-user path means each export overwrites the last, and `sweepStaleExports` ages files out on the same horizon as the link, so nothing outlives its URL by more than one sweep.

`src/zip.ts` is a hand-rolled store-only (method 0) ZIP writer — Bun has gzip and zstd but no archive builder, and six small CSVs do not justify a dependency. Two things in it are load-bearing: every size and offset is a **byte** length from `TextEncoder` (a multi-byte character in a meal description otherwise desyncs every following offset), and the DOS date/time is read in **UTC**, or the same `Date` emits different bytes on different machines and the determinism the tests rest on evaporates.

Invariants worth keeping:

- **Every CSV pairs each timestamp with a `timezone` column** naming the zone it is rendered in, exactly as the meal export always has. An offset-less wall clock with nothing beside it silently re-resolves against whatever timezone the account has later — that was #97.
- **Every builder emits its header even with zero rows**, and `goals.csv` / `profile.csv` are header-only when the record is null. A file that vanishes when a table is empty makes the archive shape unpredictable for anything reading it.
- **`meals.csv` is byte-identical to `buildMealsCsv`**, whose headers are the importer's column aliases. It is the only file with a way back in; renaming a column there for looks breaks a re-import silently.
- **Alcohol is not gated on `alcohol_tracking_enabled`.** The opt-in governs display, not the export — the privacy page promises the export always includes what was logged. It looks like a missing check, so the code says why.
- **`exportAllData` derives tz and weight unit from one `getProfile` row.** The `getUserTimezone` / `getPreferredWeightUnit` wrappers are each their own `select * from profiles`, so chaining them multiplies one query by the number of preferences read.
- **`getAllMeals` / `getAllWater` / `getAllWeight` reconcile against an exact count and throw when short.** PostgREST caps rows at 1000 by default, which truncated an export once already (#66); a loud failure beats a quiet partial backup.

---

## Public site (`public/*.html`)

One design system, "Nutrition Facts": the FDA label's grammar — a heavy 3px `var(--rule)` above every section head, hairline rules between rows, bold label left / figure right, ruled 1px-gap grids instead of floating cards — is the structural motif on every page, and the stats section on the landing page is literally a Nutrition Facts panel (`.facts`). Type is Bricolage Grotesque (display, `.section-title` / `.display`), Instrument Sans (body) and Geist Mono (eyebrows, URLs, tool names), all from Google Fonts; the CSP already allows them. Light is paper white on green-black ink; dark is forest-tinted, not grey.

- **`public/styles.css`** is the whole system (tokens at the top; every dark value is declared once in the `prefers-color-scheme` block and once in `body[data-theme="dark"]`, so a new colour must be added to both). Page-specific layout goes in that page's own inline `<style>` using the shared tokens — never hardcode a light-only colour.
- **`public/site.js`** (served at `/site.js`, loaded with `defer` by every page) owns the theme toggle, the compact-on-scroll header with its reading-progress hairline, the mobile sheet menu (focus trap, Escape, `inert` on everything outside, scroll lock, auto-close above 880px), same-page scroll-spy, `[data-reveal]` / `[data-reveal="stagger"]` entrance reveals, the hero parallax (`.depth[data-depth]`) and card tilt, and the `.copy-mini` buttons. Reveals only hide content once `html.js` is set, so the pages are complete without script. Every effect is off under `prefers-reduced-motion`.
- **The header + menu markup is shared**, not hand-copied: `scripts/site-partials.ts` exports `nav(locale, suffix, currentSuffix?)` and `footer(locale, currentSuffix?)`, used by every generator — `scripts/gen-index.ts`, `scripts/gen-tools.ts`, `scripts/gen-legal.ts`, `scripts/gen-alternatives.ts`, and `scripts/gen-login.ts`. Every public page is generator-driven now (the landing page and `/tools` were the last two hand-authored files; both moved onto `gen-index.ts`/`gen-tools.ts`) — `public/login.html` is the one page that's a genuinely different case, since its generated output is a runtime _template_ rather than a finished page (see below). When the nav changes, change `site-partials.ts` and re-run every `scripts/gen-*.ts` — see the shared-chrome-data note under "Generators" below for why a generator whose own data file didn't change still needs re-running.
- Keep the pre-paint `<script>` right after `<body>` that applies the saved `theme` from localStorage — it is what prevents the light flash on dark-mode visitors.

### Internationalization (i18n)

The site is being translated into German, Spanish, French, Dutch, Polish, Italian, Ukrainian and Japanese (`LOCALES` in `src/routes.ts`) — deliberately not Russian. English stays unprefixed at `/`; every other locale lives under `/{locale}/...` with identical slugs (`/de/tools`, `/de/myfitnesspal-mcp` — slugs are never localized, only content). `src/routes.ts` is the single source of truth for locale/route data (`LOCALES`, `PAGE_ROUTES`, `ALT_PAGES`, `pathFor`/`urlFor`/`hashPath` helpers) — it has no Supabase or other side-effecting imports, unlike `src/index.ts`, so it's safe to `import` directly from generators and tests instead of regex-scraping source text (`src/alt-pages.test.ts` used to have to do that; it doesn't anymore).

**Content model**: every page type is generated, in every locale including English, from typed TypeScript data — never hand-authored HTML sitting next to generated translations. `src/copy/legal.ts` (privacy/terms) is the pattern: a `LegalDoc` interface plus `PRIVACY`/`TERMS` objects typed `Partial<Record<SiteLocale, LegalDoc>>`. The `Partial` is deliberate and temporary — translation lands one locale at a time, so requiring every key up front would force placeholder content. Once every locale in `LOCALES` has a real (translated, not just present) entry, tighten both to `Record<SiteLocale, LegalDoc>` so `bun run typecheck` — which is `src/`-scoped and CI-gated, unlike `scripts/` — refuses to compile a locale that forgot a document. That's the whole enforcement mechanism for translation completeness: the type system, not a hand-written test. `src/copy/tools.ts` (`ToolsDoc`) and `src/copy/index.ts` (`IndexDoc`) follow the identical shape for `/tools` and the landing page; all locales (`de`/`es`/`fr`/`nl`/`pl`/`it`/`uk`/`ja`) are populated for every content file, each locale's translated constant living in its own `<name>.<locale>.ts` file (e.g. `src/copy/tools.de.ts`) and merged into the shared `Partial<Record<SiteLocale, …>>` object in `<name>.ts` — one file per locale keeps a single translation pass a self-contained diff instead of one shared file seven agents would race on.

**The header nav, mobile menu, and footer are shared by every generator** (`nav()`/`footer()` in `scripts/site-partials.ts`) and were the one piece of chrome nobody translated: every HREF was already locale-aware (`pathFor`/`hashPath`), but every visible label was a hardcoded English string, so a fully-translated page still had an English menu bar and footer framing it on every locale. `src/copy/chrome.ts` (`ChromeCopy`) fixes this the same way as everything else — one file per locale, merged into `CHROME_COPY`, read via `chromeFor(locale)` inside `nav()`/`footer()`. A 7-locale native-level proofreading pass (one agent per locale, reviewing the actual rendered HTML, not the source data) is what caught this, along with several smaller gaps worth knowing about since they're easy to reintroduce: a translatable field added to an existing `*Doc` interface only helps once every generator call site that used to hardcode that string is updated to read from it (`ToolsDoc.ui`'s `parametersLabel`/`requiredLabel`/`optionalLabel`/`trySayingLabel` fixed the same class of bug on `/tools`, where those 4 labels repeated ~20–40× per page); a raw-HTML field's aria-label needs translating too, not just its visible text (`AltUiCopy.app.copyUrlAriaLabel`); and a UI element that looks like a proper noun ("Claude"/"ChatGPT" tabs) can sit right next to one that isn't (`IndexDoc.install.otherTabLabel`, the "Other agents" tab) — both need the same review, not just the obvious one.

**The `/alternatives` pages split translatable content into three layers, not one** — a lesson learned from shipping the first two without the third and getting half-translated pages: `src/copy/alternatives.ts`'s `AppCopy` (keyed by app slug) is the prose that genuinely differs per app — hub blurb, cons, the "moving from X" and "bring your history" sections, per-app FAQ extras; `AltPageMeta` in the same file is the `<title>`/description/`og:description` templates (an `{app}` placeholder standing in for the untranslated brand name); and `src/copy/alt-ui.ts`'s `AltUiCopy` is everything else — the hero, the feature grid, install steps, the FAQ question/answer _templates_, section headings, and both closing CTAs — identical across all six comparison pages and the hub except for `{app}`. That third layer was the gap: `AppCopy` translated cleanly into all 7 locales while the surrounding template stayed English-only string literals in `scripts/gen-alternatives.ts`, so a "translated" `/de/myfitnesspal-mcp` page still greeted a German visitor in English everywhere except the per-app paragraphs. `alt-ui.ts`'s doc comment marks which fields are raw HTML (contain `<em>`/`<strong>` tags or pre-escaped `&amp;`/`&ldquo;`/`&rdquo;` entities, inserted unescaped) versus plain text (escaped at render time) — a translation must preserve every tag, entity, and placeholder token (`{app}`, `{link}`, `{copyUrl}`, `{apps}`) verbatim. `scripts/gen-alternatives.ts`'s `featuresBlock()`/`installBlock()`/`faqsFor()` read from `altUiFor(locale)` and substitute placeholders at render time; `FEATURE_ICONS` stays a fixed array in the generator (icons are structural, matched to `AltUiCopy.app.features` by index, never translated).

**Generators**: `scripts/gen-legal.ts` (privacy/terms), `scripts/gen-tools.ts` (`/tools`), `scripts/gen-index.ts` (the landing page), and `scripts/gen-alternatives.ts` (`/alternatives` + the 6 comparison pages) all follow the same shape — render English to `public/<file>` and every populated locale to `public/{locale}/<file>`. Re-run a generator after editing its data file; regenerate `public/sitemap.xml` via `scripts/gen-sitemap.ts` after that (it walks `PAGE_ROUTES` × `SITE_LOCALES` and only emits a `<url>` for a locale/page pair that actually exists on disk — an entry is a promise to crawlers, and a page that isn't built yet would 500). A fact repeated inside `nav()`/`footer()` — the mobile-menu tool-count pill (`chrome.ts`'s `toolsSmall`) included — is not owned by any single generator: editing `chrome.ts` means re-running all five generators, not just the one whose own data file changed, or every other page keeps the stale value while the one page you meant to fix is correct. `src/site-copy.test.ts` pins specific phrases (e.g. that caffeine is named everywhere the nutrient set is enumerated) directly against the _source data_ files (`src/copy/alt-ui.ts`, not `scripts/gen-alternatives.ts`) plus the regenerated HTML — so both the data and the regeneration have to be right, and the test survives content moving between generator and data file as it did here.

**In-prose cross-links are a trap**: a `LegalDoc` paragraph that links to the _other_ legal doc (e.g. privacy → terms) can't call `pathFor(locale, ...)` itself — it's plain data, not a template — so it's written as `href="/terms" data-legal-link="terms"` and `scripts/gen-legal.ts`'s `localizeCrossLinks()` rewrites the href to the locale-correct path at render time. Forgetting this is exactly how a translated page ends up silently linking back to the English version (caught once already, live, before this existed).

**hreflang/canonical**: `scripts/site-partials.ts`'s `localeHead(locale, suffix)` emits a self-referencing canonical (never canonical-to-English — that tells Google the translation is a duplicate) plus reciprocal `hreflang` links for every `SITE_LOCALES` entry, `x-default` → English, and `og:locale`/`og:locale:alternate`. `nav()` also renders a language switcher (a `<details>`/`.lang-switch` disclosure, light-dismissed via `site.js`) from the same reciprocal-URL data. `src/alt-pages.test.ts` asserts hreflang is fully reciprocal and every canonical is self-referencing, scoped to generator-produced pages (detected by `generatedBanner()`'s HTML comment) — which by now is every page, `index.html` and `tools.html` included, since both moved off hand-authored HTML onto `gen-index.ts`/`gen-tools.ts`.

**Translation is fully AI-generated, no human review pass** (a deliberate choice, most consequential on `src/copy/legal.ts` — treat that file as the one most worth a native-speaker legal review before relying on it). `public/llms.txt` stays English-only (it's an AI-crawler ingestion doc, not a search-engine surface) but names the translated locales in prose. `scripts/depersonalize.ts` discovers `public/{locale}/*.html` at run time (mirroring how it already discovers `public/alternatives/*.html`) so a self-hoster's GA tag / GitHub links / contact email get stripped from every locale, not just English.

**`public/login.html` is translated too, but it's a genuinely different case** — it has zero SEO surface (reachable only via `GET /authorize`, not in the sitemap, `<meta name="robots" content="noindex, nofollow">`) and no fixed URL to hang a locale prefix off of: it's rendered per in-flight OAuth session by `renderLoginPage()` in `src/oauth.ts`, not routed by path. `scripts/gen-login.ts` + `src/copy/login.ts` follow the same typed-data-and-generator pattern as everywhere else, but the generated file is still a _template_ — `{{SESSION_ID}}`/`{{ERROR}}` (unchanged) plus a new `{{LANG_SWITCHER}}` token that `nav()`'s `dynamicSwitcher` option emits in place of the normal static switcher, because this page's switcher links have to carry the in-flight session's `state`/`redirect_uri`/`client_id` (reconstructed by `authorizeUrl()` in `oauth.ts`), not a fixed `pathFor()`. `OAuthSession` carries a `locale` field, chosen once at `GET /authorize` (from an optional `?locale=` query param the switcher sets — clicking a switcher link re-enters `/authorize` and mints a fresh session, which is fine since nothing's been submitted yet) and reused for every re-render of that same flow (a failed password or Google sign-in) so an error doesn't silently snap the page back to English. Locale _availability_ is checked by file existence on disk at request time (`availableLoginLocales()`), not by importing `src/copy/login.ts`'s `LOGIN` keys — deliberately mirroring how `src/index.ts`'s static locale routes decide availability, so oauth.ts doesn't need to import the content module. The two hardcoded Google-flow error strings are translated (`LOGIN_ERRORS` in `src/copy/login.ts`); an error message from Supabase Auth itself is not — it's third-party text with no stable code to key a translation table on.

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

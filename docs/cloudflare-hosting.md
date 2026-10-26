# Cloudflare hosting notes

Nutrition MCP's upstream application runs on Bun and uses Supabase for its
database and account authentication. See the existing [self-hosting instructions](../README.md#self-hosting)
and [deployment overview](../README.md#deploy) before choosing a hosting approach.
This note describes two different approaches; it does not add a Cloudflare
deployment target or change upstream authentication.

## Choose an approach

| Approach                       | Application and storage                      | What remains to implement or verify                                                    |
| ------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| Cloudflare Containers          | Upstream Bun application, retaining Supabase | Worker/container integration, lifecycle, routing, secrets and full client acceptance.  |
| Independent Workers adaptation | A separate Worker, D1 and Workers KV         | Its smaller feature set, new account/data model and deployment-specific configuration. |

The existing [Dockerfile](../Dockerfile) is a starting point for a Containers
deployment: it builds generated pages and starts the Bun service on port 8080.
It is not a tested, turnkey Cloudflare Containers deployment. A Dockerfile alone
does not supply the Worker entry point, container binding, startup/readiness
handling, request forwarding, scaling policy or custom hostname configuration.
Use the current [Containers documentation](https://developers.cloudflare.com/containers/)
to implement those pieces and retain the Supabase configuration and migrations
from the upstream setup instructions.

Account for upstream's in-memory pending sign-in sessions in `src/oauth.ts`.
Sleeping or restarting the process can lose a pending authorization, and routing
`/authorize` and `/approve` to different instances can break that flow. Choose
lifecycle/routing behavior accordingly and test interrupted sign-in explicitly;
transparent multi-instance operation has not been established by this note.

Compare the current [Containers pricing](https://developers.cloudflare.com/containers/platform/pricing/)
and [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
including their plan prerequisites and associated storage/services. Workload,
instance lifecycle and retained Supabase usage affect the choice; this guide
does not forecast a deployment's bill.

## Independent Workers reference

A [pinned community implementation and setup guide][worker-reference] demonstrate
a Worker using D1 for food records, Workers KV for OAuth state and Cloudflare
Access email PIN for browser sign-in. Review the linked code and its dependencies
before using it. Its hostname, Access team/audience, storage identifiers and other
deployment settings belong to that deployment and **must be replaced**.

The reference supports meal CRUD, history/search, nutrition summaries and goals,
timezone preferences and paginated JSON export. It is not a full upstream port:
features such as the rich widgets, food-database/barcode lookups, saved meals,
water/weight tracking, Apple Health and CSV import are outside that subset.
It is also not a Supabase-to-D1 migration. Schemas, account identifiers and OAuth
grants differ; existing accounts and records do not transfer automatically.
Plan and validate any data migration separately, including ownership and dates.

### Authentication design

The reference uses a **self-hosted Access application on `/authorize` only**.
Cloudflare authenticates the browser user; the Worker implements consent and
issues its own MCP OAuth tokens:

```text
Browser -> /authorize -> Access email PIN -> verified Access JWT -> consent
MCP client -> OAuth code exchange with PKCE -> resource-bound MCP token
MCP client -> /mcp with bearer token -> authenticated account -> scoped D1 queries
```

The Worker verifies the Access JWT signature against the configured team's keys,
issuer, application audience, expiry, subject and allowed email. It does not
trust a caller-supplied email header. After authentication, explicit consent
identifies the client, redirect destination and requested permissions. OAuth
then binds the authorization code to its client, redirect URI and S256 PKCE
challenge, and binds MCP access tokens to the canonical `/mcp` resource.
See [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
and [MCP authorization options](https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/).

This is distinct from Cloudflare's [Access for SaaS/OIDC MCP examples](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/secure-mcp-servers/).
Those are alternative integrations with different application types and OAuth
roles. Do not mix their setup steps with this self-hosted `/authorize` bridge.
Adding an Access application alone does not replace upstream's Supabase login
or make upstream accept Access identities; doing that requires application code.

### Set up an adapted deployment

These steps apply to the linked Workers implementation, not upstream's Bun
server. Use an origin you control, such as `https://nutrition.example.com`.

1. Clone the full reference repository and check out the commit in the pinned
   link; its default branch may not contain `cloudflare/`. The package reuses the
   pure upstream `src/tz.ts` helper. Review its README, package requirements and
   feature exclusions, then run its local checks and dry-run build in `cloudflare/`. Replace Wrangler resource names/IDs,
   routes, `PUBLIC_ORIGIN`, Access team/audience and rate-limit namespace settings.
   Also replace the landing endpoint in `src/worker.ts` and the smoke script's
   defaults, or always pass both your origin and team origin to the smoke script.
   Review fixture URLs in tests when adapting expectations to your deployment.
2. Provision a dedicated D1 database and KV namespace. Preserve the reference's
   binding names `DB` and `OAUTH_KV`, record your resource identifiers in Wrangler
   configuration and apply the D1 migrations to the intended database. Existing
   resources should be reused on later deploys to preserve records and grants.
3. Enable [One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
   in Access. Create a **self-hosted** application for
   `nutrition.example.com/authorize`, covering both GET and POST. Add an Allow
   policy for individual approved emails and require the intended OTP login
   method. Avoid an entire email-domain or Everyone allowance.
4. Set the Worker configuration below using that application's values. Upload
   `ALLOWED_EMAILS` as a Worker secret, entered privately through the deployment
   tooling; do not commit its value or put credentials on a shell command line.
   The Access policy and Worker allowlist must agree.
5. Deploy the Worker, confirm the secret is set and verify the routing table
   below. An initial deployment before the secret is set intentionally refuses
   authentication. Keep `workers_dev` and preview URLs disabled;
   reject requests whose origin differs from `PUBLIC_ORIGIN`. Missing or malformed
   authentication settings must fail closed, even if a public health route works.
6. Connect a compatible remote MCP client to `https://nutrition.example.com/mcp`
   using OAuth. Review the displayed identity, client and permissions at consent.
   Each person authorizes their own connection; do not share bearer tokens or
   copy Cloudflare administrative credentials into an MCP client.

| Setting              | Example / purpose                                                             |
| -------------------- | ----------------------------------------------------------------------------- |
| `PUBLIC_ORIGIN`      | `https://nutrition.example.com`, exact HTTPS origin without a trailing slash. |
| `ACCESS_TEAM_DOMAIN` | `https://<team>.cloudflareaccess.com`, matching the Access JWT issuer.        |
| `ACCESS_AUD`         | The dedicated self-hosted application's audience tag.                         |
| `ALLOWED_EMAILS`     | Worker secret containing the approved individual email addresses.             |
| `DB` / `OAUTH_KV`    | Your D1 and KV resources, configured through their bindings.                  |

### Keep OAuth protocol routes reachable

A remote MCP client's server-to-server requests cannot complete an Access
browser PIN challenge. Use [hostname/path Access protection](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
for the interactive route, and inspect broader hostname/account policies for
accidental interception. Public reachability does not remove OAuth validation.

| Workers reference route                     | Expected boundary                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/authorize` GET and POST                   | Access browser login, then Worker JWT verification and consent.                                                    |
| `/mcp`                                      | Worker OAuth bearer validation; an unauthenticated request receives a 401 challenge pointing to resource metadata. |
| `/oauth/token`, `/oauth/register`           | Public OAuth protocol endpoints with their own validation.                                                         |
| `/.well-known/oauth-authorization-server`   | Public authorization-server metadata.                                                                              |
| `/.well-known/oauth-protected-resource/mcp` | Public metadata for the canonical `/mcp` resource.                                                                 |
| `/health`                                   | Public health response, without identity or food data.                                                             |

These paths are specific to the reference. Upstream uses `/token` and `/register`
and has its own login/approval routes; see [upstream API endpoints](../README.md#api-endpoints).
The reference returns 404 for unscoped root resource metadata. Discover the
canonical metadata from its bearer challenge instead of assuming aliases.

### Account and token behavior

Derive the account from verified identity, not a model-supplied email or owner ID,
and scope every SQL read/write to it. The reference uses Access issuer plus
subject; recreating identities or changing providers can require account mapping.
The reference requires `nutrition:read`; adding `nutrition:write` permits
mutations. Refresh requires the client to request, and the user to approve,
`offline_access`; advertising it does not prove a particular client requested it.
Verify every issued token honors its requested scope; narrowing a token does not
itself revoke the original grant.

Changing only the Access Allow policy does not invalidate existing MCP tokens.
The reference also rechecks its Worker allowlist on bearer use and token exchange;
remove access there as well, and verify existing-token and refresh behavior after
the updated configuration is active. Disabling access does not delete food data.

[Workers KV is eventually consistent](https://developers.cloudflare.com/kv/concepts/how-kv-works/).
Do not infer immediate global token revocation or atomic one-time consumption
from a successful local test. Evaluate the OAuth library's storage semantics,
concurrent refresh and cross-location behavior against your requirements.
Keep tokens, consent URLs, private identity claims and food records out of logs.

## Validate the deployment you actually run

Record the source/configuration revision and active deployment version alongside
results. The reference's tests and smoke script are useful starting points, not
evidence for another deployment. Keep [upstream checks](../README.md#testing-and-quality)
separate from the independent Worker's checks.

| Layer               | Useful checks                                                                                      | What those checks do not establish                               |
| ------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Local/synthetic     | JWT rejection cases, scope enforcement, owner-scoped CRUD, retries and concurrent edits.           | Real Access identity, email delivery or distributed KV behavior. |
| Public HTTP         | Health, metadata, MCP 401, reachable OAuth endpoints, Access protection on authorization GET/POST. | Successful consent, token exchange or stored food records.       |
| Real MCP client     | Email PIN, correct consent identity, tools, expiry/refresh, reduced scopes and revocation.         | Isolation from a second real account.                            |
| Two real accounts   | Separate records/goals/timezones; cross-account read, search, export and mutation attempts fail.   | Isolation after an untested identity or configuration change.    |
| Container lifecycle | Sign-in and MCP behavior across idle sleep, restart and chosen routing/scaling policy.             | Compatibility with untested instance/lifecycle policies.         |

[worker-reference]: https://github.com/andyguck/nutrition-mcp/tree/46ffaaa04b5cb412ee766ddc45946df7c62d57bf/cloudflare

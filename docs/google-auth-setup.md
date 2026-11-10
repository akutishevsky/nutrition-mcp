# Google sign-in setup

Munch sign-in is Better Auth on Munch's own database — there is no Supabase
in this stack, and there never was for the current app. This document
replaces an earlier Supabase-era guide that described a different product;
see `docs/android-auth.md` for the Android native flow in detail.

## How it works

- Better Auth (`src/auth/auth.ts`) registers the `google` social provider
  when the web OAuth client credentials are configured, and verified-email
  account linking is enabled under the same condition, so a Google sign-in
  whose email matches an existing Munch account lands on that account.
- **Web (redirect flow):** the sign-in surfaces (`/connect/sign-in` and
  `/account/password`) render a "Continue with Google" control only when
  the provider is configured. The control POSTs to
  `/api/auth/sign-in/social` — initiation is POST-only; a GET on that path
  is a 404 by design — and follows the returned Google consent URL. Google
  redirects back to `https://munch.business/api/auth/callback/google`,
  where Better Auth completes the sign-in. Shared initiation code lives in
  `src/auth/social-sign-in.ts` (the Amendment I account-linking flow reuses
  it against `/api/auth/link-social`).
- **Android (ID-token flow):** the packaged app uses Credential Manager to
  obtain a Google ID token and POSTs it to the same
  `/api/auth/sign-in/social` endpoint. See `docs/android-auth.md`.
- Magic-link and password sign-in are unaffected by any of this.

## Google Cloud console

Use the existing Firebase Google Cloud project `munch-android-bf1cd`.

1. **OAuth consent screen:** app "Munch", External, support and developer
   contact `sportfolioholdings@gmail.com`, default scopes
   (`openid`, `email`, `profile`). While the publishing status is
   **Testing**, only listed test users can complete sign-in. Publishing the
   consent screen to production is a launch gate, tracked in the parity
   program's Wave 3 status (Amendment G).
2. **Web application OAuth client** ("Munch Web"):
    - Authorized JavaScript origins: `https://munch.business`
    - Authorized redirect URIs:
      `https://munch.business/api/auth/callback/google` (exact, no
      trailing slash)
3. **Android OAuth client(s):** package `business.munch.app`, one per
   signing-certificate SHA-1 that users actually run. The signing
   identities are derived from the signed CI artifacts with `apksigner`
   (the fingerprint is public information; keys never leave CI). The
   Play App Signing identity exists only after the first Play upload.
   Signing background: `docs/ANDROID_SIGNING.md`.
4. **iOS OAuth client:** bundle ID `business.munch.app`. A native iOS
   Google sign-in returns an ID token whose audience is this client ID,
   so the server accepts it as a Google ID-token audience alongside the
   web and Android clients (the provider's `clientId` list in
   `src/auth/auth.ts`, built by `googleProviderClientIds`). No secret
   belongs to this client; the web client secret remains the provider's
   only secret. The native plugin that uses this client is the IOS-AUTH
   follow-up (see `docs/ios-platform-parity.md`).

## Railway variables (Munch API service)

| Variable                                     | Value                                                    |
| -------------------------------------------- | -------------------------------------------------------- |
| `MUNCH_GOOGLE_WEB_CLIENT_ID`                 | Web application client ID                                |
| `MUNCH_GOOGLE_CLIENT_SECRET`                 | Web application client secret (console → Railway only)   |
| `MUNCH_GOOGLE_ANDROID_CLIENT_ID`             | Android client ID                                        |
| `MUNCH_GOOGLE_IOS_CLIENT_ID`                 | iOS client ID                                            |
| `MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS` | Comma-separated SHA-256 signing certificate fingerprints |

The web client ID and secret must be set together; the Android and iOS
client IDs additionally require the web credentials
(`src/auth/config.ts`).

## Verifying configuration per platform

`GET /mobile/auth/google-config` reports configuration per platform:

- `platforms.web.configured` — web ID + secret present (web sign-in and
  the web client ID under `platforms.web.webClientId`).
- `platforms.android.configured` — web credentials + Android client ID.
- `platforms.ios.configured` — web credentials + iOS client ID; the iOS
  client ID and the web client ID (the native SDK's `serverClientID`)
  are reported under `platforms.ios` only in that state.
- The top-level `configured` / `webClientId` fields keep their original
  meaning (the packaged Android flow), which is what the packaged app's
  `mobile/runtime.js` caller gates on.

## Proof

`scripts/better-auth-google-sign-in-smoke.ts` (CI database job) exercises
initiation against a migrated database and asserts the consent URL
carries the production web client ID and the
`https://munch.business/api/auth/callback/google` redirect.

## Account linking (Amendment I)

Signed-in users can link Google (and Apple, once the `MUNCH_APPLE_*`
set below is configured) to their existing account from Settings →
"Sign-in methods". The backend
is `src/auth/sign-in-methods.ts` + `sign-in-methods-routes.ts`:

- `GET /api/app/sign-in-methods` — Email link / Google / Apple with
  linked state and a masked identity. Email link has no
  `auth_accounts` row (the magic-link plugin verifies against the
  account email); Google/Apple are `auth_accounts` rows keyed by
  `(provider_id, account_id)`.
- `POST /api/app/sign-in-methods/:provider/link` — Better Auth
  `linkSocial` against the current session (redirect consent URL, or
  immediate link with a native `idToken`).
- `POST /api/app/sign-in-methods/:provider/unlink` — server-enforced
  guardrails: the last account-backed method cannot be unlinked, and a
  provider identity owned by a different account refuses as a conflict
  (no silent merges — the `(provider_id, account_id)` unique constraint
  is the storage backstop). Explicit linking allows different emails
  (`accountLinking.allowDifferentEmails`) because it keys on provider
  identity, never email matching (Apple private-relay safe).

`scripts/better-auth-sign-in-methods-smoke.ts` (CI database job) covers
the read model, both guardrails, and link initiation against real
Postgres.

## Sign in with Apple (Amendment H, IOS-AUTH)

Better Auth's `apple` social provider (`src/auth/auth.ts`, options built
by `appleProviderOptions` in `src/auth/social-sign-in.ts`) is registered
only when the full Apple identifier set is configured — until then the
provider is absent, behaviour is unchanged, and the account-linking
inventory honestly reports Apple as `not_configured`. All four variables
must be set together or not at all (`src/auth/config.ts` refuses a
partial set):

| Variable                  | Value                                                               |
| ------------------------- | ------------------------------------------------------------------- |
| `MUNCH_APPLE_SERVICES_ID` | The Services ID (the web flow's client; Apple Developer console)    |
| `MUNCH_APPLE_KEY_ID`      | The Sign in with Apple key's ID                                     |
| `MUNCH_APPLE_TEAM_ID`     | The Apple Developer team ID                                         |
| `MUNCH_APPLE_PRIVATE_KEY` | The `.p8` key contents (console → Railway only, never through chat) |

Apple issues no static client secret: the server generates the expiring
ES256 client-secret JWT from the key material at provider registration
(`src/auth/apple-client-secret.ts`; header `kid` = key ID, claims
`iss` = team ID, `sub` = Services ID, `aud` =
`https://appleid.apple.com`, 180-day lifetime inside Apple's six-month
maximum).

**Audiences.** Apple ID tokens carry two different audiences depending
on the flow, and the provider registration accepts both
(`audience: [Services ID, "business.munch.app"]`):

- Web redirect flow — `aud` is the **Services ID**.
- Packaged iOS app (native ASAuthorization) — `aud` is the **bundle ID**
  `business.munch.app`.

The Services ID needs, in the Apple Developer console: the web domain
`munch.business` and the return URL
`https://munch.business/api/auth/callback/apple`. The App ID
`business.munch.app` needs the Sign in with Apple capability. Both are
Michael's console track; the wiring above is complete ahead of the
values, and `scripts/better-auth-apple-sign-in-smoke.ts` (CI database
job) proves the whole server half with fixture identifiers — provider
registration, the generated secret's claims, initiation, the linking
inventory flip, and the Google iOS audience. The native half (an
ASAuthorization + Google Sign-In plugin package for the packaged app)
is the scoped IOS-AUTH follow-up in `docs/ios-platform-parity.md`.

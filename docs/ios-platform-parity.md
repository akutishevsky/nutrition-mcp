# iOS platform parity (IOS-PLATFORM, Amendment H)

The durable pure-parity artifact is the capability manifest's `ios`
channel in `src/capability-manifest.ts`: all 85 rows carry an iOS
verdict with a stated basis (`iosBasis`), asserted in CI by
`scripts/capability-manifest-check.ts`, `src/capability-manifest.test.ts`,
and the exact-floor test in `src/cross-surface-parity.test.ts`. The iOS
workflow (`.github/workflows/mobile-ios.yml`) also triggers on the
manifest, its tests, and the mobile-routes module, so an ios-channel
change gates on the simulator build + IOS-SMOKE lanes as well as CI.

## Channel outcome (this slice)

| ios verdict                      | Count | Rows                                                  |
| -------------------------------- | ----- | ----------------------------------------------------- |
| complete                         | 80    | every row not listed below                            |
| partial                          | 3     | `meal.photoLog`, `account.export`, `nutrition.export` |
| missing (website-only exception) | 2     | `billing.checkout`, `billing.portal`                  |

Android channel for comparison: 83 complete, 0 partial, 2 missing.
Divergences from Android are exactly the five rows above; each carries
its basis and (for partials) `iosGap` + `iosTargetPr` in the manifest.

## Universal links

`GET /.well-known/apple-app-site-association` is served by the same
mobile router as the Android assetlinks (`src/auth/mobile-routes.ts`),
with appID `R42LWFBXBH.business.munch.app` — the team ID is the one the
iOS distribution leg signs with (`.github/workflows/mobile-ios.yml`
refuses any profile whose application-identifier differs and exports
with that teamID); the bundle ID is Capacitor's `appId`.
`MUNCH_APPLE_TEAM_ID` overrides the team ID; a malformed value makes
the route 404 rather than serve a wrong appID. Paths mirror the Android
verified-link surface: `/mobile/auth/callback`, `/app`, `/app/*`.
App side: `ios/App/App/App.entitlements` declares
`applinks:munch.business` (wired via `CODE_SIGN_ENTITLEMENTS` in both
App target configurations), and the stock SceneDelegate already
forwards universal-link activations to Capacitor via
`SceneDelegateProxy`.

## Native capture assessment (meal photo + Pantry)

What Android has: `mobile/meal-photo-native.js` and
`mobile/pantry-native.js` in the shared bundle inject Take photo /
Choose photo (and, for Pantry, barcode) controls backed by
`mobile/runtime.js`'s `takeInstalledPhoto` / `chooseInstalledPhoto` /
`scanInstalledBarcode`, which call `@capacitor/camera` and
`@capacitor/barcode-scanner`; the captured image is fetched from its
`webPath`, wrapped in a `File` (8 MB cap), and handed to the existing
web review UI. Process-death restoration rides Capacitor's
`appRestoredResult` event, re-dispatched by the runtime as
`munch:camera-restored`.

What iOS has today, verified in this slice:

- **The JS is already shared.** Both native-capture modules are plain
  bundle JS, packaged into iOS unchanged by `cap sync ios`; nothing in
  them is Android-specific. The barcode helper's ML Kit hint is passed
  under the plugin's `android:` options key and is ignored on iOS.
- **The plugins are already present.** `ios/App/CapApp-SPM/Package.swift`
  carries CapacitorCamera and CapacitorBarcodeScanner (Vision-framework
  backend on iOS) alongside CapacitorApp — the same three stock plugins
  Android uses. No custom Swift capture code exists or is needed for
  the capture itself.
- **The config gap was real and is fixed here.** The iOS `Info.plist`
  had no `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`,
  without which iOS refuses camera/photo access. Both strings land in
  this slice. (Android declares no manifest camera permission either —
  the Capacitor plugins request at runtime on both platforms.)
- **What does not exist on iOS:** the process-death restore leg.
  Capacitor emits `appRestoredResult` on Android only, so a capture
  interrupted by iOS process death is not restored into the dialog.
  This is why `meal.photoLog` is `partial` on iOS (Pantry capture has
  the same exposure; Pantry outcomes live in the inventory contracts,
  not this manifest). Owner: IOS-PLATFORM follow-up — iOS
  capture-restore.

## Cross-cutting native gaps (no single row owns them)

Recorded in the manifest as `IOS_CHANNEL_NATIVE_GAPS` with owners and
closest automated proxies:

- `ios.native.secureSession` — no Swift counterpart of the Android
  secure-session plugin; the SPM manifest that would have to carry a
  local plugin is Capacitor-managed (`CapApp-SPM/Package.swift` is
  headed "DO NOT MODIFY — managed by Capacitor CLI commands" and is
  regenerated from npm dependencies on every `cap sync`), so this
  needs a first-party plugin package published as an npm dependency,
  not a slice-local edit. Owner: IOS-PLATFORM follow-up.
- `ios.native.googleSignIn` — the SERVER half is wired (IOS-AUTH):
  the Better Auth Apple provider registers from the `MUNCH_APPLE_*`
  env set with both ID-token audiences (Services ID + bundle ID) and a
  server-generated client-secret JWT, and the Google provider accepts
  the iOS client ID (`MUNCH_GOOGLE_IOS_CLIENT_ID`) as an ID-token
  audience. What remains is the native half: no Swift counterpart of
  the Android Credential Manager plugin and no ASAuthorization plugin,
  so the packaged app cannot yet obtain or hand off an ID token.
  Owner: IOS-AUTH follow-up — a first-party iOS auth plugin package
  (see below).
- `ios.native.storeBilling` — no StoreKit plugin; reflected in the
  `billing.*` ios verdicts. Owner: IOS-BILLING.
- `ios.native.ads` — no Swift counterpart of the Android AdMob/UMP
  plugin; no capability row carries advertising. Owner: IOS-ADS.

## The IOS-AUTH native follow-up (scoped, not built by the server slice)

The server endpoints the native flow hands off to already exist and are
proven with fixture identifiers in CI
(`scripts/better-auth-apple-sign-in-smoke.ts`): `POST
/api/auth/sign-in/social` with `{ provider, idToken: { token, nonce } }`
(the exact shape the Android runtime already uses for Google) and the
session-bound link endpoint. The follow-up is a first-party Capacitor
plugin package — an npm dependency, because `cap sync` regenerates the
SPM manifest from npm dependencies (the same constraint recorded for
the secure-session plugin above):

- A Swift plugin (working name `MunchAppleGoogleSignIn`, mirroring the
  Android `MunchGoogleSignInPlugin`'s JS surface) exposing:
    - `signInWithApple()` — `ASAuthorizationAppleIDProvider` request with
      a server-matched nonce, returning the identity token + authorization
      code to JS; the packaged bundle's runtime gains the iOS twin of
      Android's `signInWithGoogle()` hand-off.
    - `signInWithGoogle()` — Google Sign-In SDK (or AppAuth) configured
      with the iOS client ID + web `serverClientID` from
      `/mobile/auth/google-config`'s `platforms.ios`, returning the ID
      token to JS for the same hand-off.
    - Session persistence rides the secure-session plugin's Keychain
      store (IOS-PLATFORM follow-up) — the auth plugin returns tokens;
      it does not grow its own storage.
- Entitlements/config: the Sign in with Apple entitlement on the App
  target; URL scheme for the iOS Google client in `Info.plist`.
- Estimated shape: one npm package (`ios/` Swift sources + a JS/TS
  wrapper mirroring `mobile/runtime.js`'s plugin registration), ~2
  classes of Swift plus the runtime bridge section — comparable to the
  Android plugin set it mirrors, plus App Store review surface for the
  Apple capability.

**Acceptance test it will need (named gap, per the program testing
law):** real Apple/Google ID-token verification is impossible in
GitHub Actions (no Apple ID / Google account can complete a native
consent on a runner, and Apple's token endpoint is unreachable with
fixture keys). The closest automated proxies, in order: (1) the
server half is already fixture-proven in CI (this slice); (2) an
IOS-SMOKE-style simulator lane that boots the packaged app, invokes
each plugin, and asserts the ASAuthorization / Google consent surface
actually presents (presentation is assertable headlessly; completion
is not); (3) the completion leg is a real-device gate — Dani's iPhone
via TestFlight, one Apple sign-in + one Google sign-in + one Apple
link from Settings, recorded as device evidence before the build is
called done. Silence is not an option: until (3) runs, the native
flow's state is "server-proven, device-unproven".

## What Actions cannot exercise here

Real-device camera/barcode capture, Keychain-backed session storage,
and the TestFlight build's universal-link behaviour have no GitHub
Actions proxy; IOS-SMOKE's named gaps (PR #201) already record the
device-only set. The closest automated proxies used in this slice: the
packaged-bundle parity harness (the iOS app packages the identical
bundle), the IOS-SMOKE simulator lane, and the manifest/parity unit
assertions that now run on every PR.

# Building the Apple Health shortcut (iOS 27)

This is the step-by-step build guide for the iOS Shortcut that copies daily totals from Nutrition MCP into Apple Health. It is the only client of the `/api/v1/health-sync/*` endpoints (`src/health-sync-routes.ts`); the server side is described under "Apple Health sync" in `CLAUDE.md`. The finished shortcut is shared from iCloud and linked from the site (`HEALTH_SYNC_SHORTCUT_URL` in `src/health-sync.ts`); only the maintainer builds it, but every step is written down so it can be rebuilt, reviewed and changed without guessing.

> **Read this first.**
>
> - The shortcut must be named exactly `Nutrition MCP Health` (`HEALTH_SYNC_SHORTCUT_NAME`). The sign-in callback page reopens it with `shortcuts://run-shortcut?name=Nutrition%20MCP%20Health&input=text&text=<claim code>`; any other name and connecting stops halfway.
> - The base URL is one **Text** action at the top: `https://nutrition-mcp.com` for the published shortcut, or a dev deploy's origin (its `PUBLIC_BASE_URL`) while testing. Nothing else changes between the two.
> - Only **closed** days are sent. Day D closes at 05:00 local time on D+1, and each sync looks at the last 7 closed days. Today is never in Health.
> - The connect link works once and for 30 minutes. The server keeps what was sent for 8 days, which is how it knows a day grew (top-up) or shrank (notice only: Health can't lower a value).
> - Never add a "Delete All Data from Shortcuts" step or suggest it anywhere: in Health it removes every sample any shortcut ever logged.
> - The token, the device secret and the claim code are never shown to the user.

---

## The protocol in one page

Every response is JSON with a top-level `ok`, because a shortcut can't read the HTTP status. A reply is a success only when it **contains** `"ok":true` (the server always sends compact JSON); anything else, including a proxy's HTML error page, is a failure. Failures carry `error` (`invalid_token`, `invalid_code`, `expired`, `busy`, `rate_limited`, `unavailable`, `bad_request`, `server_error`) and `message`, text meant to be shown as is.

| Call                                     | Auth   | Body                                                                                                  | Success                                                                |
| ---------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `POST /api/v1/health-sync/start`         | none   | `{"tz":"Europe/Kyiv","include_water":false,"backfill_days":0}` (backfill 0–7)                         | `{"ok":true,"connect_url":"…","device_secret":"…","expires_in":1800}`  |
| `GET /health-sync/connect/<id>` (Safari) | none   | —                                                                                                     | redirects to the normal sign-in page                                   |
| `GET /health-sync/callback` (Safari)     | none   | —                                                                                                     | page that reopens the shortcut with the claim code                     |
| `POST /api/v1/health-sync/claim`         | none   | `{"claim_code":"…","device_secret":"…"}`                                                              | `{"ok":true,"token":"nmhs_…","site":"https://nutrition-mcp.com"}`      |
| `GET /api/v1/health-sync/pending`        | Bearer | — (`?mode=manual` on a run started by hand; any other `mode` is ignored)                              | `{"ok":true,"entries":[…],"notices":[…],"status":{…},"lease_until":…}` |
| `POST /api/v1/health-sync/ack`           | Bearer | `{"entries":[<entry as sent>],"done":false}`; last one `{"entries":[],"done":true,"lease_until":"…"}` | `{"ok":true,"applied":1,"skipped":0}`                                  |
| `POST /api/v1/health-sync/revoke`        | Bearer | `{}`                                                                                                  | `{"ok":true}`                                                          |

A `/pending` entry:

```json
{
    "entry_id": "2026-10-02:i",
    "date": "2026-10-02",
    "kind": "initial",
    "sample_local": "2026-10-02 12:00:00",
    "values": { "energy_kcal": 2140, "protein_g": 132.4, "caffeine_mg": 190 }
}
```

- `initial` is a day's first send (12:00:00); `topup` is what it grew by since (12:01:00 … 12:09:00). The shortcut logs both the same way.
- A missing key means nothing to log for that type; the server never sends `0` for a type no meal carried.
- `/pending` takes a 2-minute lease; a second run during it gets `busy`. The final ack with `"done":true` and that `lease_until` releases it early.
- Acks echo the entry exactly and are idempotent. An entry offered 3 times without an ack stops being offered and becomes a notice about Health permissions; a run with `?mode=manual` (Sync now) offers it again.

---

## 0. Before you start

- **Settings → Apps → Shortcuts → Open shortcuts to → Editor**. (Otherwise new shortcuts open in Describe a Shortcut; the ☰ button there also reaches the editor.)
- In Shortcuts, tap **+**, tap the name → **Rename** → `Nutrition MCP Health`.
- Add actions from the **Search** bar at the bottom. To use an earlier result, tap a field and pick it from the menu that opens.
- State lives in **stored content**, not files: **Get Stored Content** (shown in the editor as **Get** _key_), **Store Content**, **Delete Stored Content**. Leave **Global Value** off on every one, so only this shortcut can read them. Keys: `token`, `pairing`, `status`. A key that has never been stored is not in the key menu yet: type its name. (Files in the iCloud Drive Shortcuts folder failed with "the selected location doesn't exist" until that folder existed, which every new user would hit.)
- `Shortcut Input` only offers "has any value" in an **If**, so it is copied into a text variable `Input` first.
- On iPhone, a new **If** arrived without **Otherwise**, so every block below is a flat **If … End If** that ends with **Stop This Shortcut**. The Mac editor offers **Otherwise** and **Otherwise if**; using them instead is fine, as long as the order stays: **If** (block A) → **Otherwise if** `InputLength` **is greater than** `20` (block B) → **Otherwise** → **If** `Token` **does not have any value** (block C) → **Otherwise** (block D). Block C's condition is `Token`, never `Input`: under that **Otherwise**, `Input` is always empty.
- Server replies need a text copy too, like `Shortcut Input`: **Get contents of** returns a dictionary, and an **If** on it only offers "has any value". After every call, keep two variables: `Reply` (the dictionary, for **Get Dictionary Value**) and `ReplyText` (a **Text** action holding **Contents of URL**, for the **contains** / **does not contain** checks).
- "Show `message`" always means the same three steps: **Get Dictionary Value** `message` in `Reply`, then **Show Alert** (or **Show Notification**) with that **Dictionary Value** as its text, then **Stop This Shortcut**. `message` is the server's own explanation of the failure, written to be shown as is (e.g. "This sign-in link has expired. Run the shortcut again."). Pick `Reply` explicitly in the **Get Dictionary Value**: left on its default it reads **Dictionary**, which is empty.
- **Run Shortcut** takes its input from the action above it: "**Run Shortcut** `Nutrition MCP Health`, input **Text** `x`" means a **Text** action holding `x`, then **Run Shortcut** with **Nutrition MCP Health** chosen and, under **›**, **Show While Running** off.
- Anything that must survive to the next run (the token, the pairing secret, the status) goes through **Store Content**. **Set variable** only lives until the run ends: a token put in a variable instead of stored is gone the next time the shortcut opens, and it starts connecting all over again.
- Several actions end up called **Text** (the base URL, the pending URL, every request body). Wherever a field takes **Text**, click the token and check it highlights the action directly above, or name it with **Set variable**.
- **Log Health Sample** says "This action is not supported on Mac" and its fields can't be edited there. Build everything else on the Mac if you like, then open the shortcut on the iPhone and fill in each **Log Health Sample**.

## 1. Top

1. **Text** with the base URL → **Set variable** `BaseURL`
2. **Get Stored Content** `token` → **Set variable** `Token`
3. **Text** containing **Shortcut Input** → **Set variable** `Input`
4. **Count** **Characters** in `Input` → **Set variable** `InputLength`. A run started by hand still gives `Input` an empty text that **has any value** counts as a value, so the claim branch is chosen by length: a claim code is always 43 characters, `auto` and `manual` are short.
5. In the **Receive … from Nowhere** row at the very top, **If there's no input** must be **Continue**. Leave it receiving from **Nowhere** (no Share Sheet).

Then four blocks in this order; only one ever runs.

## 2. Block A — Sync (`Input` is `auto` or `manual`)

1. **If** (**Any** are true): `Input` **is** `auto` / `Input` **is** `manual`
    1. **If** `Token` **does not have any value** → **Stop This Shortcut** → **End If**
    2. **Text** `BaseURL` + `/api/v1/health-sync/pending?mode=` + `Input`
    3. **Get contents of** that Text, **›** → Method **GET**, Header `Authorization` = `Bearer ` (with the space) + `Token` → **Set variable** `Reply` → **Text** [Contents of URL] → **Set variable** `ReplyText`
    4. **If** `ReplyText` **does not contain** `"ok":true`:
        - **If** `ReplyText` **contains** `invalid_token` → **Delete Stored Content** `token` → **Show Notification** "Apple Health sync was disconnected. Run Nutrition MCP Health to connect again." → **End If**
        - **If** `Input` **is** `manual` → **Get Dictionary Value** `message` in `Reply` → **Show Notification** [Dictionary Value] → **End If**
        - **Stop This Shortcut** → **End If**
    5. **Get Dictionary Value** `status` in `Reply` → **Store Content** key `status`
    6. **Get Dictionary Value** `lease_until` in `Reply` → **Set variable** `LeaseUntil`
    7. **Get Dictionary Value** `entries` in `Reply` → **Repeat with Each**:
        1. **Get Dictionary Value** `sample_local` in **Repeat Item** → **Get Dates from Input** → **Set variable** `SampleDate`. The string has no offset, so it is read in the phone's zone: noon on that calendar day.
        2. **Get Dictionary Value** `values` in **Repeat Item** → **Set variable** `Values`
        3. Eight blocks, one per row — **Get Dictionary Value** `<key>` in `Values` → **If** it **has any value** → **Log Health Sample** Type `<type>`, Value = it, Unit `<unit>`, Date = `SampleDate` → **End If**. Build one, then duplicate it (iPhone: long-press → **Duplicate**; Mac: select the **Get Dictionary Value**, **If**, **Log Health Sample** and **End If**, then ⌘C / ⌘V) and edit the key, type and unit. Set each **Log Health Sample**'s Type, Value (the **Dictionary Value** above it), Unit and Date on the iPhone.

            | key               | Type           | Unit |
            | ----------------- | -------------- | ---- |
            | `energy_kcal`     | Dietary Energy | kcal |
            | `protein_g`       | Protein        | g    |
            | `carbohydrates_g` | Carbohydrates  | g    |
            | `fat_g`           | Total Fat      | g    |
            | `fiber_g`         | Fiber          | g    |
            | `sugar_g`         | Sugar          | g    |
            | `caffeine_mg`     | Caffeine       | mg   |
            | `water_ml`        | Water          | mL   |

            There is no alcohol block, and there must never be one: the server never sends alcohol.

        4. **Text** `{"entries":[` + **Repeat Item** + `],"done":false}`
        5. **Get contents of** `BaseURL` + `/api/v1/health-sync/ack`, Method **POST**, Headers `Authorization` = `Bearer ` + `Token` and `Content-Type` = `application/json`, Request Body **File** = that Text
        6. **End Repeat**
    8. **Text** `{"entries":[],"done":true,"lease_until":"` + `LeaseUntil` + `"}` (no space between `LeaseUntil` and `"}`, or the server won't recognise the lease) → the same **POST** to `/ack` (releases the lease; harmless if it fails, the lease lapses in 2 minutes)
    9. **Get Dictionary Value** `notices` in `Reply` → **If** it **has any value** → **Combine Text** with **New Lines** → **Show Notification** → **Stop This Shortcut** → **End If**
    10. **If** `Input` **is** `manual` → **Show Notification** "Apple Health is up to date." → **End If**
    11. **Stop This Shortcut**
2. **End If**

Each entry is acked on its own, right after it is logged, so a run that dies leaves at most one entry in doubt; at worst that day is logged twice, and the troubleshooting copy explains how to delete it. A full week is at most 7 entries, well inside the 40-requests-a-minute limit.

## 3. Block B — Claim (`Input` is the code from the sign-in page)

1. **If** `InputLength` **is greater than** `20`
    1. **Get Stored Content** `pairing` (type the key: it isn't in the menu until block C has stored it once) → **Set variable** `Pairing`
    2. **If** `Pairing` **does not have any value** → **Show Alert** "This iPhone didn't start connecting. Run Nutrition MCP Health again." → **Stop This Shortcut** → **End If**. (The claim code is useless without the device secret only the iPhone that called `/start` holds; that pairing is the security property of the whole flow.)
    3. **Get contents of** `BaseURL` + `/api/v1/health-sync/claim`, **POST**, Request Body **JSON**: `claim_code` (Text) = `Input`, `device_secret` (Text) = `Pairing` → **Set variable** `Reply` → **Text** [Contents of URL] → **Set variable** `ReplyText`
    4. **Delete Stored Content** `pairing`
    5. **If** `ReplyText` **does not contain** `"ok":true` → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value] → **Stop This Shortcut** → **End If**
    6. **Get Dictionary Value** `site` in `Reply` → **Text** [Dictionary Value] → **Set variable** `Site` → **If** `Site` **is not** `BaseURL` → **Show Alert** "Unexpected server. Nothing was saved." → **Stop This Shortcut** → **End If**. (The value goes through a **Text** action so the **If** offers **is not**, the same trick as `Input`. Don't search `ReplyText` for `"site":"https://…"` instead: on the first real claim that check failed although the server sent the right site, most likely because Shortcuts re-serialises the reply and escapes the slashes.)
    7. **Get Dictionary Value** `token` in `Reply` → **Store Content** (it reads **Store** [Dictionary Value] **as** `token`). Not **Set variable**: see section 0.
    8. **Show Notification** "Apple Health sync is connected."
    9. **Run Shortcut** `Nutrition MCP Health`, input **Text** `manual` — the first sync, in the foreground, so iOS shows the Health permission sheet at the first **Log Health Sample**. With `From today` there is nothing to log yet, so the setup page tells those users to choose **Sync now** once after 05:00 the next morning.
    10. **Stop This Shortcut**
2. **End If**

## 4. Block C — Connect (started by hand, no token)

1. **If** `Token` **does not have any value**
    1. **Choose from Menu**, prompt "Also send water to Apple Health? Leave this off if your Apple Watch or another app already logs water.", options **No** and **Yes**. The option names are what the user sees, so never name them `true` / `false`. Inside **No** put **Text** `false`, inside **Yes** **Text** `true`. After **End Menu**, **Set variable** `IncludeWater` to **Menu Result** (the output of the chosen option's last action). A case left empty gives an empty **Menu Result**, and `/start` then answers "include_water must be true or false."
    2. **Choose from Menu**, prompt "Which days should be sent?", options **From today** (inside: **Text** `0`) and **Also the last 7 days** (inside: **Text** `7`). After **End Menu**, **Set variable** `Backfill` to **Menu Result**.
    3. **Date** (it defaults to **Current Date**; "Current Date" itself is a variable, not an action, so searching for it finds only **Date**) → **Format Date** on that **Date**, **›** → Date Format **Custom**, format `VV` → **Set variable** `PhoneTZ`. The server ignores a zone it doesn't recognise and prefers the profile's timezone whenever one is set.
    4. **Get contents of** `BaseURL` + `/api/v1/health-sync/start`, **POST**, Request Body **JSON**: `tz` (Text) = `PhoneTZ`, `include_water` (Boolean) = `IncludeWater`, `backfill_days` (Number) = `Backfill`. Pick each field's type before inserting the variable: the server only accepts a real JSON boolean and number, and answers "include_water must be true or false." or "backfill_days must be a whole number from 0 to 7." otherwise. → **Set variable** `Reply` → **Text** [Contents of URL] → **Set variable** `ReplyText`
    5. **If** `ReplyText` **does not contain** `"ok":true` → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value] → **Stop This Shortcut** → **End If**
    6. **Get Dictionary Value** `device_secret` in `Reply` → **Store Content** key `pairing`
    7. **Get Dictionary Value** `connect_url` in `Reply` → **Open URLs**. Safari opens the sign-in page; the user signs in with the same account their AI app uses, and the page warns them if they didn't start this themselves.
    8. **Stop This Shortcut**
2. **End If**

An automation run (`auto`) never reaches this block: it stops silently in block A when there is no token, and must never open Safari on its own.

## 5. Block D — Menu (started by hand, connected)

**Choose from Menu**, prompt `Nutrition MCP Health`, options **Sync now**, **Status**, **Disconnect**:

- Under **Sync now**:
    1. **Text** `manual`
    2. **Run Shortcut** `Nutrition MCP Health` (input: that Text; **Show While Running** off)
- Under **Status**:
    1. **Get Stored Content** `status`
    2. **Get Dictionary Value** `synced_through` in [Stored Content] → **Set variable** `SentThrough`
    3. **If** `SentThrough` **has any value** → **Show Alert** "Sent through " + `SentThrough`
    4. **Otherwise** (or a second **If** … **does not have any value**) → **Show Alert** "Connected. Nothing has been sent yet."
    5. **End If**. The AI app shows the same through `get_profile`.
- Under **Disconnect**:
    1. **Get contents of** `BaseURL` + `/api/v1/health-sync/revoke`, **POST**, Header `Authorization` = `Bearer ` + `Token`. No body is needed; the server ignores it.
    2. **Set variable** `Reply` → **Text** [Contents of URL] → **Set variable** `ReplyText`
    3. **If** (**Any** are true) `ReplyText` **contains** `"ok":true` / `ReplyText` **contains** `invalid_token` → **Delete Stored Content** `token` → **Delete Stored Content** `status` → **Show Alert** "Disconnected. What is already in Apple Health stays there." `invalid_token` counts as done: the server has already dropped the connection, so the stale token should go too.
    4. **Otherwise** → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value]
    5. **End If**

**End Menu** closes the block. Delete any placeholder **Comment** actions left from building the skeleton.

Revoking deletes the connection and its 8 days of sent records on the server at once. Nothing is removed from Apple Health.

## 6. Automations — a second, tiny shortcut

1. New shortcut **Nutrition MCP Health Auto** whose only action is **Run Shortcut** `Nutrition MCP Health` with input **Text** `auto`. Keeping triggers in their own shortcut means `auto` always arrives the same way, however triggers are set up.
2. Triggers (in iOS 27 at the top of the shortcut; on a phone that still has an **Automation** tab, there):
    - App **Health** **Is Opened** — the main one.
    - Alarm **Is Stopped**.
    - Charger **Is Connected** — optional.
3. **Run Immediately**, **Notify When Run** off where offered.

Nothing depends on an exact time: missed runs are absorbed by the lease and by `/pending` always covering the last 7 closed days.

## 7. Test on a dev deploy

Run the shortcut from the **Shortcuts** list (the tile or ▶ in the editor), not from the "Describe a change" screen. Each step below lists what the deploy's runtime log should show; every `/api/v1/health-sync` call writes one `[health-sync] route=… result=…` line next to its `[req]` line.

1. **Base URL.** Set the first **Text** to the dev deploy's origin (its `PUBLIC_BASE_URL`).
2. **Connect.** ▶ → answer both questions → Safari shows the sign-in page with the Apple Health notice → sign in with a dev account → allow **Open in Shortcuts** → notification "Apple Health sync is connected."
    - Log: `route=start result=ok`, `route=connect result=ok`, the `/authorize` sign-in, `route=callback result=ok`, `route=claim result=ok`, then the first sync: `route=pending result=ok entries=N notices=N` and `route=ack result=ok entries=0` (the lease release).
    - "Unexpected server. Nothing was saved." after a successful `route=claim` means the shortcut's own `site` check failed, not the server: see block B step 6. The claim code is spent by then, so connect again from the start.
3. **Token kept.** ▶ again → the **Sync now / Status / Disconnect** menu. If the water question comes back instead, the token went into a variable rather than **Store Content** (block B step 7).
4. **Nothing to send yet.** With **From today**, or with no meals on the finished days, **Sync now** gives "Apple Health is up to date." and the log shows `entries=0`. That is correct: today is never sent, and a day only closes at 05:00 local time the next morning. **Status** → "Connected. Nothing has been sent yet."
5. **Real Health writes.** The server only sends finished days that have data, so give the dev account some first. In chat with the dev connector, backdate a few meals (e.g. "log a 650 kcal lunch yesterday at 13:00 with 40 g protein, 70 g carbs, 20 g fat, 8 g fiber, 12 g sugar", "log a coffee with 95 mg caffeine on <date> at 9:00", "log 500 ml water yesterday"), all within the link's window: from the day it was connected, or 7 days before it with **Also the last 7 days**. Then **Sync now**:
    - Log: `route=pending result=ok entries=N`, one `route=ack result=ok entries=1` per day, then `route=ack result=ok entries=0`.
    - iOS asks for Health permission at the first **Log Health Sample**; allow every type. (Every **Log Health Sample** must already be filled in on the iPhone.)
    - Health → **Browse → Nutrition → Dietary Energy → Show All Data**: one entry per day at 12:00 from Shortcuts. **Status** → "Sent through <last day>".
6. **Top-up.** Add a snack to one of those days in chat → **Sync now** → that day gets a second entry at 12:01 for the difference (log: `entries=1`).
7. **Decrease.** Delete a meal from a day that was already sent → **Sync now** → a notification explaining how to correct it in Health, no new entry (log: `entries=0 notices=1`).
8. **Disconnect.** Menu → **Disconnect** → "Disconnected. What is already in Apple Health stays there." (log: `route=revoke result=ok`); the next ▶ asks the connect questions again.
9. **Automation.** Open Health with the **Nutrition MCP Health Auto** trigger set up: a `route=pending` line in the log with no notification on the phone (the access log records the path only, so `mode` does not show there).

## 8. Publishing

1. Set the first **Text** to `https://nutrition-mcp.com`.
2. **Share** → **Copy iCloud Link**.
3. Set the link as the `HEALTH_SYNC_SHORTCUT_URL` env var on the deploy, scoped to build time (the pages are generated during the build; the Dockerfile passes it through as a build arg), and redeploy; the setup page's install button appears.

---

## Device checklist

On a real iPhone with the current iOS, before the shortcut is shared:

1. Every **Log Health Sample** type and unit in the table exists, and Shortcuts can be granted write access to each, Caffeine and Fiber included.
2. `sample_local` (`yyyy-MM-dd HH:mm:ss`) parses through **Get Dates from Input** in the phone's zone, including on a DST-change date.
3. **Run Shortcut** can run `Nutrition MCP Health` from inside itself (Sync now and the claim rely on it). If not, those two branches need their own copy of block A.
4. **Repeat Item** placed in **Text** becomes JSON, so the ack echoes `values` unchanged. If `/ack` answers `bad_request`, show that Text in an alert to see what was sent.
5. **Format Date** with custom format `VV` returns the IANA zone name (e.g. `Europe/Kyiv`).
6. Stored content (Global Value off) persists between runs, is readable by this shortcut only, and survives an iOS update; note whether it syncs to other devices.
7. `shortcuts://run-shortcut?…&input=text&text=…` from Safari reaches the shortcut as `Shortcut Input`, and Safari's "Open in Shortcuts?" prompt appears at most once.
8. Whether a **Log Health Sample** with a denied permission stops the whole run or continues (decides whether the 3-offer stuck notice is the only signal).
9. **Log Health Sample** and stored content work on a locked phone from the Charger trigger.
10. Whether the first **Log Health Sample** from a background trigger, with Health write access never granted, shows the permission sheet, waits, or fails.
11. Whether the Health charts refresh when the "Health Is Opened" run finishes, or only after Health is reopened.
12. How long 8 log actions × 7 entries plus 9 HTTP calls takes, and whether a background run is killed before the end.
13. Two sources writing Dietary Energy are summed in Health (expected; the troubleshooting copy says so).

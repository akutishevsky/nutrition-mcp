# Building the Apple Health shortcut

This is the build sheet for the iOS Shortcut that copies daily totals from Nutrition MCP into Apple Health. It is the only client of the `/api/v1/health-sync/*` endpoints (`src/health-sync-routes.ts`); the server side is described under "Apple Health sync" in `CLAUDE.md`. The finished shortcut is shared from iCloud and linked from the site; nobody but the maintainer needs to build it, but every step is written down so it can be rebuilt, reviewed and changed without guessing.

> **Read this first.**
>
> - The shortcut must be named exactly `Nutrition MCP Health` (`HEALTH_SYNC_SHORTCUT_NAME` in `src/health-sync.ts`). The sign-in callback page reopens it with `shortcuts://run-shortcut?name=Nutrition%20MCP%20Health&input=text&text=<claim code>`; any other name and connecting silently stops halfway.
> - The base URL `https://nutrition-mcp.com` is hard-coded in one Text action at the top. A self-hoster changes that one action and nothing else.
> - Only **closed** days are ever sent. Day D closes at 05:00 local time on D+1, and each sync looks at the last 7 closed days. Today is never in Health.
> - Never add a "Delete All Data from Shortcuts" step or suggest it in any text: in Health that button removes every sample any shortcut ever logged, not just ours.
> - Everything the shortcut shows the user comes from the server's `message` and `notices` strings, apart from the few fixed lines below. The token, the device secret and the claim code are never shown.

Run through the [device checklist](#phase-0-device-checklist) on a real iPhone before relying on any detail marked _(checklist)_.

---

## 1. The protocol in one page

Every response is JSON with a top-level `ok` boolean, because a shortcut cannot read the HTTP status. On failure it carries `error` (one of `invalid_token`, `invalid_code`, `expired`, `busy`, `rate_limited`, `unavailable`, `bad_request`, `server_error`) and `message` (text meant to be shown as is), plus `ref` on `server_error` and `unavailable`.

| Call                                     | Auth         | Body                                                                                                       | Success                                                               |
| ---------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `POST /api/v1/health-sync/start`         | none         | `{"tz":"Europe/Kyiv","include_water":false,"backfill_days":0}` (all optional; backfill 0–7)                | `{"ok":true,"connect_url":"…","device_secret":"…","expires_in":1800}` |
| `GET /health-sync/connect/<id>` (Safari) | none         | —                                                                                                          | redirects to the normal sign-in page                                  |
| `GET /health-sync/callback` (Safari)     | none         | —                                                                                                          | page that reopens the shortcut with the claim code                    |
| `POST /api/v1/health-sync/claim`         | none         | `{"claim_code":"…","device_secret":"…"}`                                                                   | `{"ok":true,"token":"nmhs_…","site":"https://nutrition-mcp.com"}`     |
| `GET /api/v1/health-sync/pending`        | Bearer token | — (`?mode=manual` on a run started by hand)                                                                | `{"ok":true,"entries":[…],"notices":[…],"status":{…},…}`              |
| `POST /api/v1/health-sync/ack`           | Bearer token | `{"entries":[{"entry_id","date","values"}],"done":false}` (at most 20; `"lease_until"` with `"done":true`) | `{"ok":true,"applied":1,"skipped":0}`                                 |
| `POST /api/v1/health-sync/revoke`        | Bearer token | `{}`                                                                                                       | `{"ok":true}`                                                         |

A `/pending` entry looks like this:

```json
{
    "entry_id": "2026-10-02:i",
    "date": "2026-10-02",
    "kind": "initial",
    "sample_local": "2026-10-02 12:00:00",
    "values": { "energy_kcal": 2140, "protein_g": 132.4, "caffeine_mg": 190 }
}
```

- `kind` is `initial` (the day's first send, at 12:00:00) or `topup` (what the day grew by since, at 12:01:00, 12:02:00 … up to 12:09:00). The shortcut treats both the same: log every value present, at `sample_local`.
- A missing key means "nothing to log for that type". The server never sends `0` for a type no meal carried.
- `/pending` takes a 2-minute per-user lease and returns it as `lease_until`. A second sync during it gets `{"ok":false,"error":"busy"}`; the last ack carries `"done":true` plus that `lease_until` to release it early. A `done` without it, or with a lease that has since lapsed and been taken by another run, releases nothing.
- The ack echoes the entry's `entry_id`, `date` and `values` exactly as `/pending` sent them. Acks are idempotent: re-sending one is a no-op (`skipped`).
- An entry offered 3 times without an ack stops being offered and comes back as a notice about Health permissions. Automation runs leave it there; a run started by hand (`?mode=manual`) offers it again, so fixing the permission and choosing **Sync now** delivers it.
- An ack is applied only for a day `/pending` offered (the last 7 closed days, plus the one that dropped out of that window at 05:00). Anything else is `skipped`.
- Any other method or path under `/api/v1/health-sync/` answers `{"ok":false,"error":"bad_request","message":"…"}` with a 404 or 405.
- The server keeps what was acked for 8 days, which is how it knows a day grew (top-up) or shrank (notice only: Health cannot lower a value).

## 2. Files

All in the Shortcuts folder of iCloud Drive (the default location of **Save File** / **Get File**), under one subfolder:

| File                         | Holds                                        | Lifetime                                                      |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `nutrition-mcp/token.txt`    | the `nmhs_…` token                           | until Disconnect, or until the server answers `invalid_token` |
| `nutrition-mcp/pairing.txt`  | the `device_secret` from `/start`            | deleted right after `/claim`; useless after 30 minutes anyway |
| `nutrition-mcp/inflight.txt` | the entry being logged right now, as JSON    | written before logging an entry, deleted after its ack        |
| `nutrition-mcp/status.txt`   | the last `/pending` `status` object, as JSON | overwritten on every sync; read by **Status**                 |

Turn **Ask Where to Save** off on every **Save File**, with **Overwrite If File Exists** on. `token.txt` is a password for this account's sync: it syncs to iCloud Drive with the rest of the folder, and the privacy policy says so.

## 3. Top of the shortcut

1. **Shortcut details** → **Receive** `Text` input from nowhere; **If there's no input:** `Continue` _(checklist: the claim code still arrives through the URL scheme)_. **Show in Share Sheet** off.
2. **Text** `https://nutrition-mcp.com` → **Set Variable** `BaseURL`.
3. **Get File** `nutrition-mcp/token.txt`, **Error If Not Found** off → **Set Variable** `Token`.
4. **If** `Shortcut Input` has any value:
    - **If** `Shortcut Input` is `auto` → go to [Sync](#5-sync) with `Mode` = `auto`.
    - **Otherwise** → [Claim](#42-claim-the-connection) (the only other input is the claim code from the callback page).
5. **Otherwise** (run by hand):
    - **If** `Token` has no value → [Connect](#41-start-connecting).
    - **Otherwise** → **Choose from Menu** with `Sync now`, `Status`, `Disconnect`.
        - `Sync now` → [Sync](#5-sync) with `Mode` = `manual`.
        - `Status` → [Status](#6-status).
        - `Disconnect` → [Disconnect](#7-disconnect).

Shortcuts has no subroutines, so "go to" means the block is built inline in that branch. Sync appears twice (auto and manual) plus once more after a claim; build it once, then duplicate the actions. An automation run (`auto`) with no token stops silently: it must never open Safari on its own.

## 4. Connecting

### 4.1 Start connecting

1. **Choose from Menu** "Also send water to Apple Health? Leave this off if your Apple Watch or another app already logs water." → `No` / `Yes`. Set `IncludeWater` to `false` / `true`.
2. **Choose from Menu** "Which days should be sent?" → `From today` / `Also the last 7 days`. Set `Backfill` to `0` / `7`.
3. **Get Current Date** → **Format Date** with custom format `VV` → **Set Variable** `PhoneTZ` _(checklist: `VV` yields the IANA name, e.g. `Europe/Kyiv`)_. The server ignores a zone it does not recognise, and uses the profile's timezone over this one whenever the profile has one.
4. **Get Contents of URL** `BaseURL` + `/api/v1/health-sync/start`, Method `POST`, Request Body `JSON`: `tz` (Text) = `PhoneTZ`, `include_water` (Boolean) = `IncludeWater`, `backfill_days` (Number) = `Backfill`.
5. **Get Dictionary Value** `ok`. **If** `ok` is `true` _(checklist: how a JSON boolean compares)_:
    - **Get Dictionary Value** `device_secret` → **Save File** to `nutrition-mcp/pairing.txt`.
    - **Get Dictionary Value** `connect_url` → **Open URLs**. Safari opens the sign-in page; the user signs in with the same account their AI app uses. The page warns them if they did not start this themselves.
    - **Stop This Shortcut.**
6. **Otherwise** → **Show Alert** with the response's `message` (or "Couldn't start connecting. Try again in a minute." when there is none, e.g. a proxy error page), then **Stop This Shortcut**.

The connect link works once and only for 30 minutes. If the user takes longer, the page says so and running the shortcut again starts over.

### 4.2 Claim the connection

After sign-in, the callback page navigates to `shortcuts://run-shortcut?name=Nutrition%20MCP%20Health&input=text&text=<claim code>`, so the shortcut starts again with the claim code as `Shortcut Input`.

1. **Get File** `nutrition-mcp/pairing.txt`, **Error If Not Found** off. If it has no value → **Show Alert** "This iPhone didn't start connecting. Run Nutrition MCP Health and choose to connect again." → **Stop**. (The claim code is useless without the device secret that only the iPhone that called `/start` holds — that pairing is the security property of the whole flow.)
2. **Get Contents of URL** `BaseURL` + `/api/v1/health-sync/claim`, `POST`, JSON: `claim_code` = `Shortcut Input`, `device_secret` = the file's text.
3. **If** `ok` is `true`:
    - **Get Dictionary Value** `site`. **If** it is not exactly `BaseURL` → **Show Alert** "Unexpected server. Nothing was saved." → **Stop**. (Guards against a modified callback pointing the token at another host.)
    - **Get Dictionary Value** `token` → **Save File** to `nutrition-mcp/token.txt`; set `Token`.
    - **Delete File** `nutrition-mcp/pairing.txt` (**Confirm Before Deleting** off).
    - **Show Notification** "Apple Health sync is connected. Your first finished day is ready after 05:00 tomorrow: open Nutrition MCP Health and choose Sync now once then, to allow Apple Health." (or "…the earlier days are being sent now." when a backfill was chosen).
    - Continue into [Sync](#5-sync) with `Mode` = `manual`. This first run is in the foreground on purpose: iOS shows the Health permission sheet at the first **Log Health Sample**, and the user should allow every type. That only happens when there is something to log, i.e. a backfill was chosen and one of those days has values. With `From today` (or an empty backfill) `/pending` returns no entries, so no sample is logged and no sheet appears; the first write would then come from a background automation. The setup page therefore tells those users to open the shortcut and choose **Sync now** once after 05:00 the next day, which answers the sheet in the foreground. _(Checklist: whether a first Log Health Sample from a background automation prompts at all or just fails.)_
4. **Otherwise** → **Delete File** `pairing.txt`, **Show Alert** with `message` → **Stop**.

## 5. Sync

`Mode` is `auto` (from an automation: silent unless something needs the user) or `manual` (from the menu or after a claim: always ends with a short result).

### 5.1 Finish an interrupted entry

1. **Get File** `nutrition-mcp/inflight.txt`, **Error If Not Found** off. If it has no value, skip to 5.2.
2. **Get Dictionary from Input** → `Inflight`. **Get Dictionary Value** `sample_local` → **Get Dates from Input** → `InflightDate`.
3. **If** `Inflight.values.energy_kcal` has any value:
    - **Find Health Samples** where Type is `Dietary Energy`, Source is `Shortcuts`, Start Date is `InflightDate`, limit 1 _(checklist: exact-second match)_.
    - **If** the result has any value → the entry reached Health before the run died: skip logging.
    - **Otherwise** → log it with the eight blocks in 5.3.
4. **Otherwise** → log it with the eight blocks in 5.3.
5. Ack it as in 5.3 step 4, then **Delete File** `inflight.txt`.

On a locked iPhone, Health data is unreadable, so **Find Health Samples** finds nothing and the entry is logged again. A possible duplicate day is accepted over a lost one; the troubleshooting copy tells the user how to delete it.

### 5.2 Ask for pending entries

1. **Get Contents of URL** `BaseURL` + `/api/v1/health-sync/pending`, plus `?mode=manual` when `Mode` is `manual`, Method `GET`, Header `Authorization` = `Bearer ` + `Token`. `manual` is what lets a day that stopped after 3 failed tries be offered again once the user has fixed the Health permission; automations must never send it.
2. **Get Dictionary Value** `ok`. **If** `ok` is not `true`:
    - **If** `error` is exactly `invalid_token` → **Delete File** `token.txt`, **Show Notification** "Apple Health sync was disconnected. Run Nutrition MCP Health to connect again." → **Stop**.
    - **Otherwise** (including no `ok` at all, a proxy's HTML page, `busy`, `rate_limited`, `unavailable`) → **Show Notification** with `message`, or "Sync skipped, will retry." when there is none. Keep the token. **Stop**. `busy` in `auto` mode may stay silent: another run is already syncing.
3. **Get Dictionary Value** `status` → **Save File** to `nutrition-mcp/status.txt`.
4. **Get Dictionary Value** `lease_until` → `LeaseUntil`.

### 5.3 Log each entry

**Repeat with Each** item in `entries`:

1. **Save File** the `Repeat Item` (as text, which is its JSON _(checklist)_) to `nutrition-mcp/inflight.txt`.
2. **Get Dictionary Value** `sample_local` → **Get Dates from Input** → `SampleDate`. The string has no offset, so it is read in the iPhone's own zone, which puts the sample at noon on that calendar day.
3. Eight hard-coded blocks, one per type, each:
   **Get Dictionary Value** `values` → **Get Dictionary Value** `<key>` → **If** it has any value → **Log Health Sample** Type `<type>`, Value = it, Unit `<unit>`, Date = `SampleDate`.

    | Key               | Health type    | Unit |
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

4. **Text** `{"entries":[` + `Repeat Item` + `],"done":false}` → **Get Contents of URL** `BaseURL` + `/api/v1/health-sync/ack`, `POST`, Header `Authorization` = `Bearer ` + `Token`, Header `Content-Type` = `application/json`, Request Body `File` = that Text. If `ok` is not `true`, send it once more. If it still fails, leave `inflight.txt` in place and stop the loop: the next run finishes this entry first (5.1).
5. **Delete File** `nutrition-mcp/inflight.txt`.

Each entry is acked on its own rather than in one batch, because `inflight.txt` covers exactly one entry: a run that dies can then leave at most one entry in doubt. A full week is at most 7 entries, well inside the 40-requests-a-minute limit.

### 5.4 Finish

1. **Get Contents of URL** `/ack` with body `{"entries":[],"done":true,"lease_until":"` + `LeaseUntil` + `"}` to release this run's lease. A failure here is harmless: the lease expires on its own after 2 minutes.
2. **Get Dictionary Value** `notices`. If it has any items → **Combine Text** with new lines → **Show Notification**.
3. In `manual` mode with no notices → **Show Notification** "Apple Health is up to date through `status.synced_through`." (or "Nothing new to send." when there were no entries). In `auto` mode a clean run shows nothing.

## 6. Status

**Get File** `nutrition-mcp/status.txt` → **Show Result**: "Sent through `synced_through`. The next day is ready at `next_day_ready_at`." With no file yet: "Connected. Nothing has been sent yet." The same status is also available from the AI app: `get_profile` reports when the sync was connected, which day it has sent through and when it last synced.

## 7. Disconnect

1. **Get Contents of URL** `BaseURL` + `/api/v1/health-sync/revoke`, `POST`, Bearer token, JSON body `{}`.
2. **If** `ok` is `true`, or `error` is `invalid_token` → **Delete File** `token.txt` and `status.txt`, **Show Alert** "Disconnected. What is already in Apple Health stays there." Otherwise **Show Alert** with `message` and keep the token.

Revoking deletes the connection and its 8 days of sent records on the server immediately. Nothing is removed from Apple Health.

## 8. Automations

A shared shortcut does not carry automations, so the setup page walks the user through creating these by hand. Each is a **Personal Automation** in the **Automation** tab, set to **Run Immediately** with **Notify When Run** off where iOS allows it _(checklist)_, and its only action is **Run Shortcut** `Nutrition MCP Health` with input Text `auto`.

- **Primary:** App → `Health` → **Is Opened**. Opening Health is when the user wants it to be current.
- **Morning catch-up:** Alarm → **Is Stopped** (the wake-up alarm, or any alarm).
- **Optional:** Charger → **Is Connected**.

Nothing depends on an exact time. Missed runs are absorbed by the lease and by `/pending` always covering the last 7 closed days, so the next run that fires catches up.

---

## Phase-0 device checklist

On a real iPhone with the current iOS, before the shortcut is shared:

1. Every **Log Health Sample** type and unit in the table in 5.3 exists, and Shortcuts can be granted write access to each, Caffeine and Fiber included.
2. `sample_local` (`yyyy-MM-dd HH:mm:ss`) parses through **Get Dates from Input** in the phone's zone, including on a DST-change date.
3. **Find Health Samples** matches an exact start date to the second, filtered by source Shortcuts.
4. Whether a **Log Health Sample** with a denied permission stops the whole run or continues (decides whether the 3-offer stuck notice is the only signal).
5. **Log Health Sample**, **Get File** and **Save File** work on a locked phone from the Charger automation.
6. Whether the Health charts refresh when the "Health Is Opened" automation finishes, or only after Health is reopened.
7. Whether **Notify When Run** can be turned off for Run Immediately automations.
8. How "has any value" behaves for a missing dictionary key, and how `ok` (a JSON `true`) compares in **If**.
9. How long 8 log actions × 7 entries plus 9 HTTP calls takes, and whether a background automation is killed before the end.
10. Two sources writing Dietary Energy are summed in Health (expected; the troubleshooting copy says so).
11. `shortcuts://run-shortcut?…&input=text&text=…` from Safari reaches the shortcut as `Shortcut Input` with **Receive** set as in section 3, and Safari's "Open in Shortcuts?" prompt appears at most once.
12. **Format Date** with custom format `VV` returns the IANA zone name.
13. A **Dictionary** saved with **Save File** or put into **Text** becomes JSON, so the ack body echoes `values` unchanged.
14. Whether the first **Log Health Sample** run from a background automation, with Health write access never granted, shows the permission sheet, waits, or fails (decides whether the setup page's "run Sync now once after 05:00" step for `From today` is required or only a convenience).

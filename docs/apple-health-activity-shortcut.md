# Building the Nutrition MCP Activity shortcut, step by step (iOS 27)

> **Status: server side built, not deployed yet.** The branch `feat/activity-sync` adds `kind` on `/start`, `POST /api/v1/health-sync/activity` and a separate activity link, so the Activity shortcut connects and disconnects without touching the Nutrition MCP Health connection. Until it is on the dev deploy, point the first **Text** at the dev origin and don't run **Connect** against `nutrition-mcp.com`: production still treats every connect as a Nutrition MCP Health one. Don't share the iCloud link until the test in Part 9 passes.

How the server treats what the shortcut sends:

- Each day is **one entry, the whole day's Health total**, replaced on every sync. Sending the same days again changes nothing.
- **0 is ignored.** It writes nothing and removes nothing, because a shortcut can't tell "no data" from "Health refused the read".
- **Today and the 6 days before** are accepted, in the account's timezone (the phone's when the account has none). Other dates are skipped.
- On a day with a Health total, **that total counts and entries logged by hand don't**: the watch's Active Energy already includes those workouts. They are still listed, marked as not added.
- `active_kcal` must be a plain number such as `1234`. A thousands separator (`1,234`) is refused with a message, so check the Part 8 number on a day over 1,000 kcal.

## What you are building

Two shortcuts on your iPhone:

1. **Nutrition MCP Activity.** It reads your **Active Energy** total from Apple Health for today and the 2 days before, and sends those three numbers to Nutrition MCP. Started by hand, it connects (the first time) or shows a menu: **Sync now**, **Status**, **Disconnect**.
2. **Nutrition MCP Activity Auto.** A one-action shortcut that runs the first one in the background from your triggers.

It reads nothing from Health except the daily Active Energy sum. Sending is safe to repeat: the server replaces each day's total, it never adds to it.

Two rules for the whole build:

- **Build it on the iPhone.** You can't add **Find Health Samples** on a Mac, and a shortcut with Health actions that was edited or saved on a Mac shares broken. Once it works, don't open it in the Mac editor again.
- **The name must be exactly `Nutrition MCP Activity`**, with that capitalisation and spacing. The sign-in page reopens the shortcut by this name.

---

## Part 1. Set up the Shortcuts app

1. Open **Settings → Apps → Shortcuts → Open shortcuts to** and choose **Editor**.
2. Open **Shortcuts**, tap **+** (top right).
3. Tap the name at the top → **Rename** → type `Nutrition MCP Activity` → **Done**.
4. At the very top of the editor there is a row **Receive … from Nowhere**. Tap the first value (it starts as **No**) and select **Text** only, so it reads **Receive Text from Nowhere**. Set **If there's no input** to **Continue**. Leave **Nowhere** as it is: no Share Sheet. With **Receive No**, iOS drops the `manual` and `auto` text that **Sync now** and the Auto shortcut pass in, so every **Sync now** just shows the menu again.

How to work in the editor:

- Add every action from the **Search** bar at the bottom. Type the action's name and tap it; it lands at the end of the shortcut. Drag it to move it.
- To use an earlier result in a field, tap the field, then pick the variable or the action's output from the menu.
- **Set variable** keeps a value only until the run ends. Anything the next run needs (the token, the pairing secret, the status) goes through **Store Content**.
- In every **Store Content**, **Get Stored Content** and **Delete Stored Content**, leave **Global Value** off.
- A key you have never stored isn't in the key menu yet. Type its name.

---

## Part 2. The top of the shortcut (5 actions)

1. **Text**. Type the base URL: `https://nutrition-mcp.com`. While testing, use the dev deploy's origin instead, for example `https://stingray-app-uo24c.ondigitalocean.app`, with no slash at the end.
2. **Set Variable**. Name `BaseURL`, Input = the **Text** above.
3. **Get Stored Content**. Key: type `token`. Then **Set Variable** `Token` = **Stored Content**.
4. **Text**. Tap inside it → choose **Shortcut Input**, and type nothing else: no space and no line break after the pill. Then **Set Variable** `Input` = that **Text**. A stray line break makes `manual` arrive as 7 characters, so **Sync now** never matches and just shows the menu again. To check it, a temporary **Show Result** of `InputLength` must show 0 when you run it by hand and 6 after **Sync now**.
5. **Count**. Set it to **Characters** in `Input`. Then **Set Variable** `InputLength` = **Count**.

Why the text copies: an **If** on **Shortcut Input** only offers "has any value", but on a Text variable it offers **is** and **contains**.

Below this come four blocks, A to D, each a flat **If … End If** that ends with **Stop This Shortcut**. Exactly one block runs each time.

---

## Part 3. Block A: Sync (runs when `Input` is `auto` or `manual`)

### A1. The condition

1. **If**. Tap **Input** → choose the `Input` variable, condition **is**, value `auto`.
2. Tap the **If** action's condition area → **Add Condition** → `Input` **is** `manual`. At the top of the conditions, switch **All** to **Any**.

Everything up to A6 goes **inside** this **If**.

### A2. Stop if not connected

1. **If** `Token` **does not have any value**
2. **Stop This Shortcut**
3. **End If** (already there, below the **Stop**)

### A3. The phone's timezone

1. **Date**. It defaults to **Current Date**; leave it.
2. **Format Date**. Input = that **Date**, tap **›** → **Date Format** **Custom**, format `VV`.
3. **Set Variable** `PhoneTZ` = **Formatted Date**

### A4. Read three days from Health

1. **Repeat**. Set it to **3** times.

Inside the **Repeat**:

2. **Calculate**. **Repeat Index** **−** `1`. Then **Set Variable** `DaysBack`. This gives 0 on the first pass, then 1, then 2.
3. **Date** (Current Date).
4. **Adjust Date**. **Subtract** `DaysBack` **days** from that **Date**.
5. **Adjust Date** again. Operation **Get Start of Day**, input = the adjusted date above. Then **Set Variable** `DayStart`.
6. **Adjust Date**. **Add** `1` **days**, and tap the date field and pick `DayStart` explicitly (not **Adjusted Date**, which is ambiguous here). Then **Set Variable** `DayEnd`.
7. **Find Health Samples**. Add this on the iPhone. Tap **Type** → **Active Calories** (iOS 27's name for Active Energy). Then:
    - **Add Filter** → **Start Date** **is between** `DayStart` and `DayEnd`.
    - **Unit** → **kcal**.
    - **Group By** → **Day**.
    - **Fill Missing**: on is fine; a day without data then comes back as 0 instead of empty.
    - **Sort by**, **Limit**: leave as they are, with the limit off.

    The first time the shortcut runs, iOS asks for permission to read Active Energy. Then, at **Get Contents of URL**, it asks whether the shortcut may send health samples to the site. Choose **Always Allow**: with **Allow Once**, every automation stops at that prompt. The prompt lists the raw daily sums, in your region's number format (`922,774 kcal` is 922.774 kcal where a comma is the decimal separator), plus one 0 kcal group per day for midnight of the next day; the shortcut rounds before sending, and the 0 groups add nothing.

8. **Set Variable** `Samples` = **Health Samples**
9. **Number**. Type `0` → **Set Variable** `Kcal`. This is the value for a day with nothing recorded.
10. **If** `Samples` **has any value**:
    1. **Get Details of Health Sample**. Choose **Value**, input `Samples`.
    2. **Calculate Statistics**. **Sum** of **Details of Health Sample**.
    3. **Round Number**. Tap **Number** and choose **Statistics** (the sum above; left as the grey placeholder, nothing is rounded), then round to **Integer** (older iOS calls it **Ones Place**).
    4. **Set Variable** `Kcal` = **Rounded Number**
11. **End If**
12. **If** `DaysBack` **is** `0` → **Set Variable** `TodayKcal` = `Kcal` → **End If**. This keeps today's number for the notification in A6.
13. **Format Date**. Input `DayStart`, **›** → **Custom** `yyyy-MM-dd` → **Set Variable** `DayText`
14. **Text**. Type exactly: `{"date":"` then insert `DayText`, then type `","active_kcal":`, then insert `Kcal`, then type `}`. The result looks like `{"date":"2026-11-02","active_kcal":412}`.
15. **Add to Variable**. Add that **Text** to `DayItems`. It must be **Add to Variable**, not **Set Variable**: **Set** keeps only the last pass, so only the day 2 days ago would be sent.

16. **End Repeat** (already there).

After the **Repeat**:

17. **Combine Text**. Input `DayItems`, separator **Custom** `,`. Then **Set Variable** `DaysJSON`.

### A5. Send the three days

1. **Text**. Type `{"tz":"`, insert `PhoneTZ`, type `","days":[`, insert `DaysJSON`, type `]}`.
2. **Get Contents of URL**. URL: insert `BaseURL` and type `/api/v1/health-sync/activity` right after it. Tap **›**:
    - **Method** **POST**
    - **Headers**: `Authorization` = type `Bearer ` (with the space) and insert `Token`; `Content-Type` = `application/json`
    - **Request Body** **File**, then the **Text** from step 1
3. **Set Variable** `Reply` = **Contents of URL**
4. **Text** containing **Contents of URL** → **Set Variable** `ReplyText`

### A6. Check the reply

1. **If** `ReplyText` **does not contain** `"ok":true` (type it with the quotes):
    1. **If** `ReplyText` **contains** `invalid_token`:
        1. **Delete Stored Content**, key `token`
        2. **Show Notification** "Activity sync was disconnected. Run Nutrition MCP Activity to connect again."
    2. **End If**
    3. **If** `Input` **is** `manual`:
        1. **Get Dictionary Value**. Key `message`, dictionary `Reply`. Pick `Reply` explicitly, not the default **Dictionary**.
        2. **Show Notification**. Body = **Dictionary Value**.
    4. **End If**
    5. **Stop This Shortcut**
2. **End If**
3. **Get Dictionary Value** `status` in `Reply` → **Store Content**, key `status`
4. **If** `Input` **is** `manual` → **Show Notification** "Active calories sent: " + `TodayKcal` + " kcal today so far." → **End If**
5. **Stop This Shortcut**

Then the **End If** of A1 closes block A.

---

## Part 4. Block B: Claim (runs when `Input` is the code from the sign-in page)

A claim code is 43 characters; `auto` and `manual` are short, so the length decides.

1. **If** `InputLength` **is greater than** `20`
    1. **Get Stored Content**. Type the key `pairing` → **Set Variable** `Pairing`.
    2. **If** `Pairing` **does not have any value** → **Show Alert** "This iPhone didn't start connecting. Run Nutrition MCP Activity again." → **Stop This Shortcut** → **End If**
    3. **Get Contents of URL**. URL `BaseURL` + `/api/v1/health-sync/claim`, **›** → **Method** **POST**, **Request Body** **JSON**, with two Text fields: `claim_code` = `Input` and `device_secret` = `Pairing`.
    4. **Set Variable** `Reply` = **Contents of URL** → **Text** [Contents of URL] → **Set Variable** `ReplyText`
    5. **Delete Stored Content** `pairing`
    6. **If** `ReplyText` **does not contain** `"ok":true` → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value] → **Stop This Shortcut** → **End If**
    7. **Get Dictionary Value** `site` in `Reply` → **Text** [Dictionary Value] → **Set Variable** `Site`
    8. **If** `Site` **is not** `BaseURL` → **Show Alert** "Unexpected server. Nothing was saved." → **Stop This Shortcut** → **End If**
    9. **Get Dictionary Value** `token` in `Reply` → **Store Content**, key `token`. Use **Store Content**, not **Set Variable**.
    10. **Show Notification** "Activity sync is connected."
    11. **Text** `manual` → **Run Shortcut** `Nutrition MCP Activity`, input = that **Text**, **›** → **Show While Running** off. This first sync runs in the foreground, so iOS shows the Health permission sheet. Allow **Active Energy**.
    12. **Stop This Shortcut**
2. **End If**

---

## Part 5. Block C: Connect (started by hand, not connected yet)

1. **If** `Token` **does not have any value**. Use `Token` here, not `Input`.
    1. **Show Alert** "This reads your Active Energy total from Apple Health for today and the 2 days before, and sends only those totals to Nutrition MCP. Nothing else from Health is read." Turn **Show Cancel Button** on. Cancel stops the shortcut.
    2. **Date** → **Format Date** **Custom** `VV` → **Set Variable** `PhoneTZ`
    3. **Get Contents of URL**. URL `BaseURL` + `/api/v1/health-sync/start`, **›** → **Method** **POST**, **Request Body** **JSON**, with two Text fields: `kind` = `activity` and `tz` = `PhoneTZ`.
    4. **Set Variable** `Reply` → **Text** [Contents of URL] → **Set Variable** `ReplyText`
    5. **If** `ReplyText` **does not contain** `"ok":true` → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value] → **Stop This Shortcut** → **End If**
    6. **Get Dictionary Value** `device_secret` in `Reply` → **Store Content**, key `pairing`
    7. **Get Dictionary Value** `connect_url` in `Reply` → **Open URLs**. Safari opens the sign-in page. Sign in with the same account the AI app uses, then tap **Open in Shortcuts** when asked.
    8. **Stop This Shortcut**
2. **End If**

An automation run never gets here: block A stops quietly when there is no token, and the shortcut must never open Safari on its own.

---

## Part 6. Block D: Menu (started by hand, connected)

This is the last thing in the shortcut, after block C's **End If**.

1. **Choose from Menu**. Prompt `Nutrition MCP Activity`, three options: **Sync now**, **Status**, **Disconnect**.
2. Under **Sync now**:
    1. **Text** `manual`
    2. **Run Shortcut** `Nutrition MCP Activity`, input = that **Text**, **Show While Running** off
3. Under **Status**:
    1. **Get Stored Content** `status`
    2. **Get Dictionary Value** `through` in **Stored Content** → **Set Variable** `Through`
    3. **If** `Through` **has any value** → **Show Alert** "Sent through " + `Through` → **End If**
    4. **If** `Through` **does not have any value** → **Show Alert** "Connected. Nothing has been sent yet." → **End If**
4. Under **Disconnect**:
    1. **Get Contents of URL**. URL `BaseURL` + `/api/v1/health-sync/revoke`, **›** → **Method** **POST**, Header `Authorization` = `Bearer ` + `Token`.
    2. **Set Variable** `Reply` → **Text** [Contents of URL] → **Set Variable** `ReplyText`
    3. **If** (**Any**) `ReplyText` **contains** `"ok":true` / `ReplyText` **contains** `invalid_token`:
        1. **Delete Stored Content** `token`
        2. **Delete Stored Content** `status`
        3. **Show Alert** "Disconnected. Active calories already sent stay in Nutrition MCP; delete them there if you want them gone."
    4. **End If**
    5. **If** `ReplyText` **does not contain** `"ok":true` **and** **does not contain** `invalid_token` (switch to **All**) → **Get Dictionary Value** `message` in `Reply` → **Show Alert** [Dictionary Value] → **End If**
5. **End Menu** (already there)

Delete any leftover empty **Comment** actions.

---

## Part 7. The automation shortcut

1. In Shortcuts, tap **+** and name it `Nutrition MCP Activity Auto`.
2. Its only actions: **Text** `auto` → **Run Shortcut** `Nutrition MCP Activity`, input = that **Text**, **Show While Running** off.
3. Add triggers. In iOS 27 they are at the top of the shortcut; on a phone that still has an **Automation** tab, they are there. Each one runs this shortcut:
    - **App** → **Claude** (or **ChatGPT**, whichever AI app you use) → **Is Opened**: the main one, so today's burn is current before you ask about your day
    - **App** → **Health** → **Is Opened**
    - **App** → **Fitness** → **Is Opened**
    - A workout-ended trigger, if your iOS offers one (look for **Workout** or **Apple Watch Workout**)
    - **Charger** → **Is Connected**
    - **Time of Day** at 12:00, another at 18:00, another at 22:00. There's no "every hour" trigger, so each time is its own trigger.
4. For every trigger: **Run Immediately**, **Notify When Run** off where offered.

Extra runs are harmless. Every sync replaces the last 3 days' totals, so a missed run is caught up by the next one.

---

## Part 8. Before the server side exists: device checks

Do these now; they decide whether the plan works. Make a scratch shortcut with only Part 3's A4 steps 3 to 11 plus a **Show Result** of `Kcal`, and run it:

1. **Does the number match Health?** Compare it with **Health → Browse → Activity → Active Energy** for today. If it's higher, **Group By Day** didn't merge the iPhone's and the Watch's overlapping samples. Note what **Find Health Samples** offers instead.
2. **Is the value in kcal?** If **Get Details of Health Sample → Value** comes back in another unit, note which.
3. **Locked phone:** set a **Charger** trigger on the scratch shortcut with **Show Notification** of `Kcal`, lock the phone and plug it in. Does it show a number, 0, or nothing?
4. **Denied permission:** in **Settings → Health → Data Access & Devices → Shortcuts**, turn Active Energy off and run it again. Does it show 0? (iOS may not tell shortcuts a read was denied.)
5. **Which triggers exist:** Time of Day, App Is Opened (Health, Fitness), and anything for a finished workout.
6. **Speed:** how long three passes take from a background trigger.

Send me the answers. They decide the server's rules, especially what a 0 means.

---

## Part 9. Test on a dev deploy (once the server side exists)

1. Set the first **Text** to the dev origin.
2. Run **Nutrition MCP Activity** from the Shortcuts list → the alert → **OK** → Safari sign-in with a dev account → **Open in Shortcuts** → "Activity sync is connected." → allow **Active Energy**.
3. In chat with the dev connector, `get_active_calories` for today shows one Health entry with the same number as the Health app.
4. Run **Sync now** twice. There is still one entry per day, not two.
5. Walk for a few minutes → **Sync now**. Today's entry goes up and there is still only one.
6. Run the shortcut again → the menu appears, not the alert, so the token was kept.
7. **Status** → "Sent through <today>".
8. **Disconnect** → the alert. The next run asks to connect again. If the Nutrition MCP Health shortcut is connected, it still works.

## Part 10. Publishing

1. Set the first **Text** to `https://nutrition-mcp.com`.
2. **Share** → **Copy iCloud Link**.
3. Open the link in Safari on another device. iCloud's page must show **Nutrition MCP Activity** with **Get Shortcut**. If it says it can't connect, a Health action was added or saved on a Mac: delete and re-add **Find Health Samples** on the iPhone and share again.
4. Don't import the link on the iPhone that built it. iOS would add **Nutrition MCP Activity 2**, and the sign-in page reopens the shortcut by its exact name.
5. Send me the link. It goes into the site's build settings and the `/apple-health` page once the server side ships.
6. Share **Nutrition MCP Activity Auto** the same way, or let the setup page tell people to make it themselves, since it's two actions.

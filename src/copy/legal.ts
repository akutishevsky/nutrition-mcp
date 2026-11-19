// Typed content for /privacy and /terms, rendered by scripts/gen-legal.ts.
// Extracted from the previously hand-authored public/privacy.html and
// public/terms.html so both English and every translation go through the
// same generator instead of a hand-authored English file sitting next to
// generated ones (see CLAUDE.md's "Public site" section).
//
// `html` strings below carry trusted inline markup (<strong>, <a href>) —
// same trust level as the rest of the scripts/gen-*.ts family: developer-
// authored constants, not visitor input, so nothing here is HTML-escaped
// on the way out.
//
// PRIVACY/TERMS are `Partial<Record<SiteLocale, ...>>`, not the full
// `Record`, while translation is still in progress — a locale absent here
// means scripts/gen-legal.ts simply doesn't emit that locale's page yet,
// not a bug. Once every locale in src/routes.ts's LOCALES has a real
// (reviewed, not just present) entry, tighten both to
// `Record<SiteLocale, LegalDoc>` so a newly added locale that forgets one
// of these two documents fails `bun run typecheck`, the same guarantee the
// rest of the site's copy dictionaries are built around.

import type { SiteLocale } from "../routes.js";
import { mergeCopy } from "./merge.js";
import { type NonEnLocale, TRANSLATIONS } from "./translations.js";

export type LegalBlock =
    { type: "p"; html: string } | { type: "ul"; items: string[] };

export interface LegalSection {
    heading: string;
    blocks: LegalBlock[];
}

export interface LegalDoc {
    /** <title> minus " — Nutrition MCP", and the visible <h1>. */
    title: string;
    metaDescription: string;
    ogDescription: string;
    /** Human-readable, already in the target locale's date convention. */
    lastUpdated: string;
    sections: LegalSection[];
    /** Text for the two footer links — "Back to home" and the link to the
     * other legal doc ("Terms of Service" on the privacy page, and vice
     * versa). The other doc's own `title` is reused for the cross-link text
     * itself, so only the "back to home" phrase needs to live here. */
    backToHome: string;
    /** Lead paragraph under the <h1> (plain text, escaped at render). On
     * the privacy page it equals `metaDescription`; on the terms page it is
     * the first sentence of it. */
    lead: string;
    /** aria-label of the Privacy Policy / Terms of Service switcher pill
     * in the page hero (plain text). Same value on both docs of a locale. */
    documentsLabel: string;
    /** aria-label of the numbered table of contents (plain text). Same
     * value on both docs of a locale. */
    tocLabel: string;
}

const p = (html: string): LegalBlock => ({ type: "p", html });
const ul = (items: string[]): LegalBlock => ({ type: "ul", items });

// ---------------------------------------------------------------- English

const PRIVACY_EN: LegalDoc = {
    title: "Privacy Policy",
    metaDescription:
        "How Nutrition MCP handles your data: what we store, how it is used, where it lives, and how to delete your account and everything in it at any time.",
    ogDescription:
        "How Nutrition MCP handles your data: what we store, how it is used, where it lives, and how to delete your account and everything in it at any time.",
    lastUpdated: "November 7, 2026",
    backToHome: "Back to home",
    lead: "How Nutrition MCP handles your data: what we store, how it is used, where it lives, and how to delete your account and everything in it at any time.",
    documentsLabel: "Legal documents",
    tocLabel: "On this page",
    sections: [
        {
            heading: "What we collect",
            blocks: [
                p(
                    "When you register, we store your <strong>email address</strong> and a securely hashed password via Supabase Auth. If you sign in with Google instead, we ask Google only for your email address, and receive it together with Google's account identifier for you, which Supabase Auth keeps so it can recognise your next Google sign-in. We never see a Google password. Accounts that signed in with Google before September 27, 2026 may also still hold the name and profile picture Google sent back then; nothing in the service reads or shows them except your data export, and they are deleted with your account.",
                ),
                p("When you use the service, we store:"),
                ul([
                    "<strong>Meal logs</strong> — description, meal type, calories, macros, fiber, total sugar, added sugar, saturated fat, trans fat, milligrams of sodium, grams of alcohol, milligrams of caffeine, notes, and timestamps. Each nutrient value also records its source: a USDA FoodData Central or Open Food Facts record it matches for the amount logged, a value you gave yourself, or an estimate. If you log a meal with its ingredients, each ingredient is kept too — its name, amount, unit and nutrients — along with the saved meal it was logged from, if any. Food photos are interpreted by your AI assistant and are never uploaded to or stored by us.",
                    "<strong>Saved meals</strong> — a meal you save under a name: its name, description, default meal type and values per serving, its ingredients if you gave them (name, amount, unit and nutrients for each), and when it was created and last changed. Meals you log from a saved meal keep their own copy of its values, so changing or deleting the saved meal leaves them as they were.",
                    "<strong>Water logs</strong> — amount, notes, and timestamps.",
                    "<strong>Active calories</strong> — the calories you log as burned through exercise, usually taken from a watch or fitness app: the amount, the percentage of it counted toward your intake (the share you chose, saved with each entry so that changing it later leaves past entries as they were), an optional note, and timestamps. This is health data, and it is treated exactly like the rest of your logs.",
                    "<strong>Body weight logs</strong> — weight, notes, and timestamps. This is health data, and it is treated exactly like the rest of your logs.",
                    "<strong>Body measurement logs</strong> — which site was measured (waist, hips, neck, chest, shoulders, upper arm, forearm, thigh or calf), the value as you entered it and its unit (cm or in), notes, and timestamps. This is health data, and it is treated exactly like the rest of your logs.",
                    "<strong>Goals</strong> — your daily calorie, protein, carb, fat, saturated fat, fiber, sugar, added sugar, alcohol, caffeine, sodium, and water targets, and your target weight. Each time they change, we also keep a dated copy, so a past day can be compared with the goals that applied on it.",
                    "<strong>Profile settings</strong> — your IANA timezone, preferred weight unit, preferred length unit for body measurements, the percentage of active calories counted toward your intake, whether alcohol tracking is switched on and which standard drink it is shown in, whether in-chat widgets are enabled and whether they open expanded, and the language in-chat widgets are shown in.",
                    "<strong>Apple Health sync</strong> — only if you connect it from the Nutrition MCP Health shortcut on your iPhone: the connection (which daily totals it sends, whether water is included, the date it starts from, the timezone your phone reported, used only while your profile has none, and when it was created, last used and last synced); for each of the last 8 days, the totals already sent to Apple Health and when, so that a day is sent once and afterwards only topped up by what was added; and, while you are connecting, a pending connect request for up to 30 minutes. Alcohol is never sent.",
                    "<strong>Apple Health activity sync</strong> — only if you connect the optional Nutrition MCP Activity shortcut on your iPhone: the daily Active Energy totals it reads from Apple Health for today and the 2 days before, stored as your active calories (one entry per day, which each sync replaces, marked as coming from Apple Health); the connection (the timezone your phone reported, used only while your profile has none, and when it was created, last used and last synced); and, while you are connecting, a pending connect request for up to 30 minutes. Nothing else is read from Apple Health.",
                    "<strong>Dashboard sessions</strong> — only if you sign in to the web dashboard at nutrition-mcp.com/dashboard: for each browser you are signed in on, when the session started, when it was last used and when it expires. Your browser keeps the session in a strictly necessary cookie (<code>__Host-nm_dash</code>) that holds only a random value, which we store only as a one-way hash. Starting a sign-in there sets one more strictly necessary cookie for at most 10 minutes, holding only a random value, the page's language and when the cookie expires; it is deleted when sign-in finishes.",
                    "<strong>Tool-usage telemetry</strong> — for each MCP tool call, which tool ran, whether it succeeded, how long it took, a coarse error category when it failed, the span in days of any date range you asked for, the MCP session id, which revision of the MCP protocol your AI app connected with, and the name and version that app reports for itself (for example &ldquo;claude-ai/1.0&rdquo;) when it sends them. It is linked to your account id. It never includes the content of your logs.",
                    "<strong>Server runtime log</strong> — for each request to the server: the method, path, response status and response time, your IP address with its last part removed, and for MCP requests the protocol revision and the name and version your AI app reports. For each tool call it also records the tool's name, whether it succeeded, how long it took and, when it failed, a short reference code and the error message — which can repeat back a value your AI app sent, such as an invalid date. When your AI app signs in or renews its connection, it records the outcome, the random identifier your AI app was given when it registered with our sign-in service, and the site it asked to be sent back to (for example claude.ai). It is written to our hosting provider's runtime log, does not contain your account id or email address, and is kept only briefly: that log is a rolling buffer that overwrites older lines as new traffic arrives.",
                ]),
                p(
                    "<strong>Alcohol is health data too</strong>, and of a more sensitive kind than a calorie count, so it works differently from everything above. Alcohol tracking is off by default, and we only ever record alcohol when it comes from you — a drink you log, or a column in a file you import. Nothing infers it on your behalf. Switching the setting off does two things: the bulk importer stops reading the alcohol column out of files you upload, and everything else stops showing alcohol in the meals, goals, progress and widgets you see. It is not a delete switch. Alcohol you logged directly is still recorded whether the setting is on or off, anything already stored stays in the database, and all of it still appears in the meals file of any export you take. To actually remove an alcohol figure, delete the meal it belongs to, or delete your account.",
                ),
                p(
                    "We also keep the OAuth access and refresh tokens and authorization codes that let your AI assistant stay connected to your account; how long each one lasts is under &ldquo;How long we keep data&rdquo;. They are stored only as one-way hashes. Apple Health sync and the optional activity shortcut each have an access token of their own, which we also store only as one-way hashes; each shortcut needs its token itself to make its requests, so the Shortcuts app keeps it in that shortcut&rsquo;s own storage on your iPhone, not in a file, and may sync it to your other devices if your shortcuts sync through iCloud. Anyone who can run one of those shortcuts on your devices can use its sync until you disconnect it.",
                ),
            ],
        },
        {
            heading: "How we use it",
            blocks: [
                p(
                    "Your meal, saved meal, water, weight, body measurement, active calorie, and goal data is used solely to provide the nutrition tracking service and, in anonymous aggregate form, the public statistics on the home page. We <strong>never sell it, never share it with third parties, and never use it for advertising</strong> or feed it into any ad or profiling system. Apple Health sync, described below, does not change this: it is a transfer you start yourself, to your own iPhone, and we send nothing to Apple. Neither does the optional activity shortcut, which is a transfer you start yourself in the other direction, from Apple Health on your own iPhone to us; we receive nothing from Apple directly.",
                ),
                p(
                    "The home page and the public statistics feed behind it show anonymous site-wide totals — how many meals have been logged, their calories and macros, the water logged and the net weight lost across all accounts — and the timezones set in profiles, which the home page draws as a world map. A timezone appears on the map only once at least three profiles use it, and no figure is linked to a person.",
                ),
                p(
                    'When you or your AI assistant look up a barcode, our server sends only the barcode digits to <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> — never your account, email or logs — and keeps the product data it returns in a shared cache that is not linked to any user.',
                ),
                p(
                    'When you or your AI assistant search for generic foods, our server sends the search words your assistant used — cleaned of search operators and cut to 200 characters — and the FoodData Central ids of the foods it looks up to the API of <a href="https://fdc.nal.usda.gov" target="_blank" rel="noopener noreferrer">USDA FoodData Central</a>, with our own API key. It sends no account id, email address or log entry. The API is run by the United States Department of Agriculture, so these requests leave the EU. The records it returns are public reference data: they are reused for up to 30 days before being fetched again, are not linked to any account and are not personal data.',
                ),
                p(
                    "Food values from FoodData Central are cited as: U.S. Department of Agriculture, Agricultural Research Service, Beltsville Human Nutrition Research Center. FoodData Central. [Internet]. [cited 2026-10-10]. Available from https://fdc.nal.usda.gov/. Nutrition MCP is an independent project; USDA does not endorse this service.",
                ),
                p(
                    "If you connect Apple Health sync, the shortcut on your iPhone asks our server for the daily totals of your finished days — calories, protein, carbs, fat, fiber, caffeine and, if you chose it, water — and writes them into Apple Health on that iPhone. That happens at your request and on your device: our server only answers the shortcut and sends nothing to Apple. Once the totals are in Apple Health, they are stored and shared there under your own settings and your agreement with Apple, not ours.",
                ),
                p(
                    "If you connect the optional activity shortcut (Nutrition MCP Activity), it works the other way round, for one value only: it reads the Active Energy total for today and the 2 days before from Apple Health on your iPhone and sends those daily totals to our server, where they are stored as your active calories, one entry per day that each sync replaces. It reads nothing else from Health. The reading happens on your device, with the permission you give it in the Health app, which you can withdraw there at any time; we receive nothing from Apple directly.",
                ),
                p(
                    "The dashboard at nutrition-mcp.com/dashboard shows your own logs, goals and trends in your browser once you sign in with the same account your AI assistant uses. It only reads: nothing can be logged, changed or deleted from it, so every change still goes through your AI assistant. What it shows travels only between our server and your browser; the dashboard loads neither Google Analytics nor Microsoft Clarity, and reading your data there writes no tool-usage telemetry.",
                ),
                p(
                    "Two kinds of analytics do exist, and neither touches the content of your logs:",
                ),
                ul([
                    "<strong>Website analytics.</strong> With your consent, these pages load Google Analytics, which gives us aggregate traffic statistics — page views, referrers, rough geography, device type — and Microsoft Clarity, which records how visitors use the site — clicks, taps, scrolling, mouse movement — as session replays and heatmaps, so we can see where the pages confuse people. Neither loads until you accept in the cookie banner; if you reject, neither loads at all, and if your browser sends a Global Privacy Control signal, neither loads unless you opt in yourself from the footer. Accepting grants analytics storage only: advertising storage and Google signals stay off. Google receives your IP address with each request but, according to Google, does not log or store it for visitors from the EU, Switzerland or the UK, and uses it only to derive an approximate location. Clarity masks what you type into forms and also receives your IP address and browser details. Neither runs on the sign-in page or the dashboard. You can withdraw at any time with &ldquo;Cookie settings&rdquo; in the footer, which also deletes the analytics cookies set on this site; your choice is kept in your browser's local storage for up to 6 months.",
                    "<strong>Server telemetry.</strong> Every MCP tool call writes one row of usage telemetry — which tool ran, whether it succeeded, how long it took, which MCP protocol revision and which AI app (by the name and version it reports) made the call — linked to your account id but not to what you logged. We use it to find slow and broken tools. It is not shared with anyone, and it is deleted along with everything else when you delete your account.",
                ]),
                p(
                    "Because the site loads fonts and icons from Google Fonts and jsDelivr, visiting these pages exposes your IP address to those providers. The project's GitHub star count is fetched by our server, not your browser, so GitHub never sees your visit.",
                ),
            ],
        },
        {
            heading: "Where it's stored",
            blocks: [
                p(
                    'All data is stored in <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) in the EU, in AWS&rsquo;s Ireland region (eu-west-1). Authentication and export storage are handled by Supabase in the same region. The server runs on DigitalOcean in Frankfurt, Germany. Requests to the site and the server pass through Cloudflare&rsquo;s network (used by our hosting provider), which decrypts the connection and so handles everything sent to and from the service in transit, including your IP address, and may set a strictly necessary bot-protection cookie (<code>__cf_bm</code>, 30 minutes).',
                ),
            ],
        },
        {
            heading: "How long we keep data",
            blocks: [
                p(
                    "Your meal logs, saved meals, water, weight, body measurement and active calorie logs, goals and their change history, profile settings, and tool-usage telemetry are kept for as long as your account exists — none of them has a separate expiry date or a scheduled purge. When you delete your account, all of it is deleted immediately and irreversibly, as described below. The only traces left are the telemetry row for the deletion itself, recorded without your account id; the short-lived server runtime log described above, which never carries your account id; our database provider's own operational logs, kept for a limited period (up to 7 days on our plan); and its rolling backups, which age out on their own schedule.",
                ),
                p(
                    "Sign-in credentials are short-lived by design. The sign-in page's session lasts 10 minutes and is held in the server's memory; it is tied to your browser by a strictly necessary cookie that holds only a random value, expires after the same 10 minutes and is deleted when sign-in finishes. To check your password or Google sign-in we use Supabase Auth, which creates a Supabase sign-in session each time; we never use it and end it immediately. The one-time authorization code handed to your AI app expires after 10 minutes and is deleted as soon as it is used. An access token is valid for 24 hours (the few issued on or before September 27, 2026 expire no later than October 6, 2026); a refresh token is valid for 90 days, and it is deleted the moment it is used to get a new pair. Expired tokens and codes are deleted automatically within an hour. A dashboard session ends after 7 days without use, and in any case 30 days after you signed in; signing out ends it at once, and expired sessions are deleted automatically within an hour. Deleting your account removes all of them immediately.",
                ),
                p(
                    "Apple Health sync is time-limited too. The connection ends once it has gone 90 days without being used, and in any case 365 days after you connected it; after that the shortcut has to be connected again. The record of what was sent keeps only the last 8 days, and a connect request you do not finish lasts 30 minutes. Expired connections, records and requests are deleted automatically within an hour. Choosing Disconnect in the shortcut deletes the connection and its record immediately. The optional activity shortcut&rsquo;s connection follows the same 90-day and 365-day limits, and its connect request lasts 30 minutes; choosing Disconnect in that shortcut deletes its connection immediately. The active calories it already sent are kept like the ones you log yourself, until you delete them or your account.",
                ),
                p(
                    "Export archives are short-lived. Each new export overwrites the previous one, and the file is deleted automatically once its 60-minute download link has expired — a cleanup runs every ten minutes, so an archive normally stays in storage for no more than about 70 minutes.",
                ),
            ],
        },
        {
            heading: "Data deletion",
            blocks: [
                p(
                    "You can delete your account and all associated data at any time by asking your AI assistant to <strong>delete your account</strong> while connected to the Nutrition MCP server. This action is immediate and irreversible. It removes your meal logs and the ingredients of each, your saved meals and their ingredients, your water, weight, body measurement and active calorie logs, goals and their change history, profile settings, any export archive still in storage, your tool-usage telemetry, your access tokens, your dashboard sessions, your Apple Health sync connection and its record of what was sent, the activity shortcut&rsquo;s connection, and the account itself. That includes every alcohol figure you ever logged, whether or not alcohol tracking was switched on. Totals the shortcut already wrote into Apple Health are on your iPhone, not on our servers; they stay there until you delete them in the Health app.",
                ),
            ],
        },
        {
            heading: "Contact and your rights",
            blocks: [
                p(
                    'Nutrition MCP is run by Anton Kutishevskyi, an individual developer, who is the controller of your personal data for this service. For anything about your data or this policy, email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Why we are allowed to process it:"),
                ul([
                    "<strong>Your account and logs</strong> — to provide the service you signed up for (performance of a contract). Meals, weight, body measurements, active calories and alcohol are health data, so we process them on the basis of your explicit consent, given when you create your account and each time you sign in (for an app connected before the sign-in page asked for this consent, by logging the entries until you next sign in), which you can withdraw at any time by deleting the entries or your account. Apple Health sync rests on the same consent and runs only once you connect it; disconnecting it in the shortcut withdraws that consent for the sync. The optional activity shortcut rests on the same consent and reads Active Energy only once you connect it and allow it in the Health app; disconnecting it, or turning that permission off, withdraws that consent for the reading.",
                    "<strong>Tool-usage telemetry and the server runtime log</strong> — our legitimate interest in keeping the service working, fast and secure (finding broken tools, rate-limiting abuse). Neither contains the content of your logs.",
                    "<strong>Website analytics</strong> — your consent, given in the cookie banner and withdrawable at any time with &ldquo;Cookie settings&rdquo; in the footer.",
                ]),
                p(
                    "Your rights, and how to use them — most need no email at all:",
                ),
                ul([
                    "<strong>Access and portability</strong> — ask your AI assistant to export your data. You get a ZIP of CSV files with everything we store about you, including where each nutrient value came from (a USDA FoodData Central or Open Food Facts record, a value you gave yourself, or an estimate): your meal logs (meals.csv, with saturated fat, trans fat and sodium columns), the ingredients of each logged meal (meal_items.csv), your saved meals (saved_meals.csv) and their ingredients (saved_meal_items.csv), your water, weight, body measurement and active calorie logs (active_calories.csv, which also records the share counted toward your intake that each entry was saved with, and which entries are daily totals the activity shortcut read from Apple Health), your goals and the history of your goal changes, your settings (profile.csv), your account record (email address, sign-in methods and sign-in dates, and any name or picture Google sent), your tool-usage telemetry, the connections that keep your AI apps and your Apple Health shortcuts signed in, and your dashboard sessions (without the tokens or cookie values themselves), and the record of the daily totals sent to Apple Health over the last 8 days. Not in it: the values we keep only as one-way hashes for security (your password, your connections&rsquo; tokens and your dashboard session cookies), internal bookkeeping such as duplicate-detection keys, the server runtime log, which does not contain your account id, and our providers&rsquo; own short-lived logs and rolling backups.",
                    "<strong>Rectification</strong> — ask your AI assistant to correct or delete any meal, water, weight or active calorie entry, any body measurement entry or any saved meal, or to change your goals and settings.",
                    "<strong>Erasure</strong> — ask your AI assistant to delete your account, which removes everything at once.",
                    "<strong>Objection and restriction</strong> — email us.",
                    "<strong>Complaint</strong> — you can complain to the data protection authority where you live or work. We would appreciate the chance to fix it first.",
                ]),
                p(
                    "Everything we store stays in the EU region named above. Whatever your AI assistant reads through the tools is sent to that assistant's provider, which may be outside the EU; that happens under your own agreement with them, not ours. Cloudflare (the network every request passes through), Google and Microsoft (website analytics, Google Sign-In) and Google and jsDelivr (the font and icon requests described above) are outside the EU too; where they receive personal data from outside the EU, they rely on the European Commission's standard contractual clauses or the EU–US Data Privacy Framework. Apple Health sync adds no transfer of ours: the totals travel from our server to the shortcut on your iPhone, and what Apple Health does with them after that is up to your own Apple settings. The optional activity shortcut adds none either: its daily totals travel from your iPhone to our server, in the EU region named above.",
                ),
                p(
                    'The service is not meant for anyone under 16, and the <a href="/terms" data-legal-link="terms">Terms of Service</a> require you to be at least 16. If you believe someone younger has created an account, email us and we will delete it.',
                ),
                p(
                    "If this policy changes, the date at the top changes with it.",
                ),
            ],
        },
        {
            heading: "Terms of Service",
            blocks: [
                p(
                    'Use of the service is also governed by our <a href="/terms" data-legal-link="terms">Terms of Service</a>, which cover acceptable use, the fact that nothing here is medical advice, and the absence of any warranty — the service is provided as-is, free of charge, with no guarantees of availability, accuracy, or fitness for any purpose.',
                ),
            ],
        },
    ],
};

const TERMS_EN: LegalDoc = {
    title: "Terms of Service",
    metaDescription:
        "The terms that govern use of Nutrition MCP — the free, open-source nutrition tracker and remote MCP server for Claude and ChatGPT. Plain-language terms covering accounts, acceptable use, your data, and liability.",
    ogDescription:
        "The terms that govern use of Nutrition MCP — the free, open-source nutrition tracker and remote MCP server for Claude and ChatGPT.",
    lastUpdated: "November 7, 2026",
    backToHome: "Back to home",
    lead: "The terms that govern use of Nutrition MCP — the free, open-source nutrition tracker and remote MCP server for Claude and ChatGPT.",
    documentsLabel: "Legal documents",
    tocLabel: "On this page",
    sections: [
        {
            heading: "Agreement",
            blocks: [
                p(
                    "These terms govern your use of Nutrition MCP (the &ldquo;service&rdquo;) — the website at nutrition-mcp.com and the remote MCP server at <strong>https://nutrition-mcp.com/mcp</strong>. By creating an account or connecting an AI assistant to the server, you agree to these terms. If you do not agree, please do not use the service.",
                ),
                p(
                    "The service is run by Anton Kutishevskyi, an individual developer (&ldquo;we&rdquo;, &ldquo;us&rdquo;).",
                ),
            ],
        },
        {
            heading: "The service",
            blocks: [
                p(
                    'Nutrition MCP is a free, open-source nutrition tracker that runs as an MCP server, letting AI assistants such as Claude and ChatGPT log meals, water, body weight, body measurements and active calories on your behalf. Optionally, a shortcut on your iPhone can copy your daily totals into Apple Health, and a second, separate shortcut can bring your daily Active Energy from Apple Health in as active calories. You can also sign in to a read-only web dashboard at nutrition-mcp.com/dashboard with the same account to see your logs, goals and trends; changes are still made through your AI assistant. There is no paid tier, no advertising, and no charge for using the service. We accept voluntary donations on Patreon to help cover hosting and database costs; they are a gift, not a purchase, and they buy no features, no tier, and no priority of any kind. Paid supporters also get access to a community Discord, which is not part of the service. The source code is published under the MIT license on <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> and you are free to self-host it.',
                ),
            ],
        },
        {
            heading: "Your account",
            blocks: [
                p(
                    "You must be at least 16 years old to use the service. We do not verify age, so by creating an account you confirm you meet that requirement. You are responsible for keeping your login credentials confidential and for all activity that happens under your account. If you sign in to the dashboard on a computer other people use, sign out when you are done. Please provide an email address you actually control — it is the only way to recover access.",
                ),
                p(
                    "You may use the service only where your AI provider supports it and where applicable sanctions and export-control laws allow.",
                ),
            ],
        },
        {
            heading: "Not medical advice",
            blocks: [
                p(
                    "Nutrition MCP is a logging and reporting tool, not a healthcare service. Nothing it produces — calorie and macro figures, goals, trends, or any commentary your AI assistant adds — is medical, nutritional, or dietary advice, and none of it is a substitute for a qualified professional. Consult a doctor or dietitian before making decisions about your health, especially if you have a medical condition or a history of disordered eating.",
                ),
                p(
                    "The service is not designed for clinical use and should not be used by anyone with an active eating disorder, or by anyone who is pregnant or under clinical supervision for a nutrition-related condition, without their clinician's involvement. Calorie and macro tracking can be harmful in those situations. If that describes you, talk to your clinician before using it.",
                ),
                p(
                    "Nutrition figures are <strong>estimates</strong>. They come from AI models interpreting your descriptions and photos, from third-party databases such as Open Food Facts, and from whatever you enter yourself. They can be wrong. Verify anything that matters.",
                ),
                p(
                    "Food photos are never sent to our server. Your AI assistant interprets the picture on its own side and sends us only the resulting text and numbers — a description, a meal type, calories, macros, notes, a barcode.",
                ),
                p(
                    "Each nutrition figure shows where it came from. For generic foods, values are USDA FoodData Central values when a record is available, and estimates otherwise. Each figure is labelled with its source — USDA FoodData Central, Open Food Facts, a value you gave yourself, or an estimate — and a record counts as a source only when it matches the amount you logged.",
                ),
            ],
        },
        {
            heading: "Acceptable use",
            blocks: [
                p("When using the service, you agree not to:"),
                ul([
                    "use it for any unlawful purpose, or in breach of any applicable law or regulation;",
                    "attempt to access another user's account or data, or to bypass authentication, rate limits, or any other technical control;",
                    "probe, scan, overload, or disrupt the service or the infrastructure it runs on, including through automated bulk requests;",
                    "upload content that is illegal, or that you have no right to share;",
                    "resell the hosted service or present it as your own;",
                    "use it to pursue extreme calorie restriction, or to promote, coach, or encourage that in anyone else.",
                ]),
                p(
                    "The service is rate-limited to keep it available for everyone. If you need higher volume, self-host it — that is what the MIT license is for.",
                ),
            ],
        },
        {
            heading: "Your data",
            blocks: [
                p(
                    'Your logs remain yours. We store and process them to operate the service for you, as described in our <a href="/privacy" data-legal-link="privacy">Privacy Policy</a>. You are responsible for the content you log.',
                ),
                p(
                    "You can export all of your data at any time by asking your AI assistant to export it. The export is a ZIP archive containing CSV files for your meals and their ingredients, saved meals and their ingredients, water, weight, body measurements, active calories, goals, goal history, profile settings, account record, tool-usage telemetry, connected AI apps, dashboard sessions and Apple Health sync; alcohol is included whether or not alcohol tracking is switched on. The download link we hand back is private and expires after 60 minutes.",
                ),
                p(
                    "If you connect Apple Health sync, your daily totals are written into Apple Health on your iPhone at your request. Once there, they are in your hands and under Apple&rsquo;s terms: disconnecting or deleting your account does not remove them, and because Apple Health cannot lower a value it already holds, a day you later correct downwards is not corrected there — delete those entries in the Health app yourself. Keep the shortcut on devices only you use: it holds the token that lets it use your account&rsquo;s sync, and disconnecting it from the shortcut&rsquo;s menu ends that token at once.",
                ),
                p(
                    "If you connect the optional activity shortcut, it reads your daily Active Energy total from Apple Health and, on each sync, replaces that day&rsquo;s Apple Health entry in your active calories with it; on such a day, active calories you logged yourself stay in your log but are not added on top. Those totals come from your own devices and apps; we do not check them, and like every figure here they are estimates. The same rules apply to its token: keep the shortcut on devices only you use, and disconnecting it from its menu ends that token at once. What it already sent stays until you delete it.",
                ),
                p(
                    "We also record basic operational telemetry about how the service is used: for every tool call, the tool's name, whether it succeeded, how long it took, a coarse error category when it fails, the length of any date range you asked for, the session id, the MCP protocol revision your AI app connected with, and the name and version that app reports for itself. These rows are linked to your account id. They do not contain what you logged — no food descriptions, no calories, no weights or measurements. We use them to keep the service working and to see which tools are worth improving, and they are deleted along with everything else when you delete your account.",
                ),
                p(
                    "You can delete your account and all associated data at any time by asking your AI assistant to <strong>delete your account</strong> while connected — that action is immediate and irreversible.",
                ),
            ],
        },
        {
            heading: "Availability and changes",
            blocks: [
                p(
                    "The service is offered free of charge with no uptime commitment and no service-level agreement. We may change, suspend, or discontinue any part of it — including tools, features, and the hosted server itself — at any time and without notice. We may also modify or remove content that breaches these terms.",
                ),
            ],
        },
        {
            heading: "Third-party services",
            blocks: [
                p(
                    "The service depends on third parties: Supabase for database, authentication, and export storage, DigitalOcean for hosting, Cloudflare (through our hosting provider) for the network every request passes through, Open Food Facts for barcode data, Apple&rsquo;s Shortcuts and Health apps if you connect either Apple Health shortcut, and whichever AI assistant you connect from.",
                ),
                p(
                    "Generic food data comes from the FoodData Central API of the United States Department of Agriculture (USDA). We send it only the search words and food ids described in our Privacy Policy, and its records are reference data, not your data.",
                ),
                p(
                    'Barcode product data &copy; <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> contributors, available under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Food values from FoodData Central are cited as: U.S. Department of Agriculture, Agricultural Research Service, Beltsville Human Nutrition Research Center. FoodData Central. [Internet]. [cited 2026-10-10]. Available from https://fdc.nal.usda.gov/. Nutrition MCP is an independent project; USDA does not endorse this service.",
                ),
                p(
                    "The website itself also uses, with your consent, Google Analytics and Microsoft Clarity to measure traffic and how the pages are used, Google Fonts and the jsDelivr CDN to load fonts and icons, Google Sign-In if you choose that way of logging in, and the GitHub API, which our server (not your browser) queries for the project's star count, so no visitor data reaches GitHub. Loading a page therefore makes requests to Google Fonts and jsDelivr, which can see your IP address and browser; Google Analytics and Microsoft Clarity are contacted only after you accept analytics.",
                ),
                p(
                    "Their terms and their availability are their own, and we are not responsible for them.",
                ),
            ],
        },
        {
            heading: "No warranty",
            blocks: [
                p(
                    "The service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>, without warranties of any kind, express or implied, including any implied warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We do not warrant that the service will be uninterrupted, secure, error-free, or that any data or nutrition figure it produces is accurate. You use it at your own risk.",
                ),
            ],
        },
        {
            heading: "Limitation of liability",
            blocks: [
                p(
                    "To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or exemplary damages, nor for any loss of data or profits, arising out of or in connection with your use of the service.",
                ),
            ],
        },
        {
            heading: "Your legal rights",
            blocks: [
                p(
                    "Some liability can never be excluded, and we do not try to. We remain fully liable for death or personal injury caused by our negligence, and for fraud or fraudulent misrepresentation.",
                ),
                p(
                    "You also keep every right the law gives you as a consumer. These terms sit alongside those rights and do not reduce them. Where a section above conflicts with a right you cannot sign away, your legal right wins.",
                ),
            ],
        },
        {
            heading: "Termination",
            blocks: [
                p(
                    "You may stop using the service at any time and delete your account as described above. We may suspend or terminate access that breaches these terms or that threatens the stability or security of the service. The &ldquo;No warranty&rdquo;, &ldquo;Limitation of liability&rdquo;, and &ldquo;Your legal rights&rdquo; sections survive termination.",
                ),
            ],
        },
        {
            heading: "Changes to these terms",
            blocks: [
                p(
                    "We may update these terms from time to time. The current version always lives at this page, with the date at the top showing when it last changed. Continuing to use the service after an update means you accept the revised terms.",
                ),
            ],
        },
        {
            heading: "Severability",
            blocks: [
                p(
                    "If any part of these terms is found to be unenforceable, that part is removed and the rest stays in force.",
                ),
            ],
        },
        {
            heading: "Contact",
            blocks: [
                p(
                    'Questions about these terms or your data? Email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

export const PRIVACY: Partial<Record<SiteLocale, LegalDoc>> = {
    en: PRIVACY_EN,
};

export const TERMS: Partial<Record<SiteLocale, LegalDoc>> = {
    en: TERMS_EN,
};

for (const locale of Object.keys(TRANSLATIONS) as NonEnLocale[]) {
    const bundle = TRANSLATIONS[locale];
    if (bundle.privacy) {
        PRIVACY[locale] = mergeCopy(PRIVACY_EN, bundle.privacy);
    }
    if (bundle.terms) {
        TERMS[locale] = mergeCopy(TERMS_EN, bundle.terms);
    }
}

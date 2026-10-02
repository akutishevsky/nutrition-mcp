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
import { PRIVACY_ES, TERMS_ES } from "./legal.es.js";
import { PRIVACY_FR, TERMS_FR } from "./legal.fr.js";
import { PRIVACY_NL, TERMS_NL } from "./legal.nl.js";
import { PRIVACY_PL, TERMS_PL } from "./legal.pl.js";
import { PRIVACY_IT, TERMS_IT } from "./legal.it.js";
import { PRIVACY_UK, TERMS_UK } from "./legal.uk.js";
import { PRIVACY_JA, TERMS_JA } from "./legal.ja.js";

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
    lastUpdated: "September 29, 2026",
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
                    "<strong>Meal logs</strong> — description, meal type, calories, macros, fiber, total sugar, grams of alcohol, milligrams of caffeine, notes, and timestamps. Food photos are interpreted by your AI assistant and are never uploaded to or stored by us.",
                    "<strong>Water logs</strong> — amount, notes, and timestamps.",
                    "<strong>Body weight logs</strong> — weight, notes, and timestamps. This is health data, and it is treated exactly like the rest of your logs.",
                    "<strong>Goals</strong> — your daily calorie, protein, carb, fat, fiber, sugar, alcohol, caffeine, and water targets, and your target weight.",
                    "<strong>Profile settings</strong> — your IANA timezone, preferred weight unit, whether alcohol tracking is switched on and which standard drink it is shown in, whether in-chat widgets are enabled, and the language in-chat widgets are shown in.",
                    "<strong>Tool-usage telemetry</strong> — for each MCP tool call, which tool ran, whether it succeeded, how long it took, a coarse error category when it failed, the span in days of any date range you asked for, the MCP session id, which revision of the MCP protocol your AI app connected with, and the name and version that app reports for itself (for example &ldquo;claude-ai/1.0&rdquo;) when it sends them. It is linked to your account id. It never includes the content of your logs.",
                    "<strong>Server runtime log</strong> — for each request to the server: the method, path, response status and response time, your IP address with its last part removed, and for MCP requests the protocol revision and the name and version your AI app reports. For each tool call it also records the tool's name, whether it succeeded, how long it took and, when it failed, a short reference code and the error message — which can repeat back a value your AI app sent, such as an invalid date. When your AI app signs in or renews its connection, it records the outcome, the random identifier your AI app was given when it registered with our sign-in service, and the site it asked to be sent back to (for example claude.ai). It is written to our hosting provider's runtime log, does not contain your account id or email address, and is kept only briefly: that log is a rolling buffer that overwrites older lines as new traffic arrives.",
                ]),
                p(
                    "<strong>Alcohol is health data too</strong>, and of a more sensitive kind than a calorie count, so it works differently from everything above. Alcohol tracking is off by default, and we only ever record alcohol when it comes from you — a drink you log, or a column in a file you import. Nothing infers it on your behalf. Switching the setting off does two things: the bulk importer stops reading the alcohol column out of files you upload, and everything else stops showing alcohol in the meals, goals, progress and widgets you see. It is not a delete switch. Alcohol you logged directly is still recorded whether the setting is on or off, anything already stored stays in the database, and all of it still appears in the meals file of any export you take. To actually remove an alcohol figure, delete the meal it belongs to, or delete your account.",
                ),
                p(
                    "We also keep the OAuth access and refresh tokens and authorization codes that let your AI assistant stay connected to your account; how long each one lasts is under &ldquo;How long we keep data&rdquo;. They are stored only as one-way hashes.",
                ),
            ],
        },
        {
            heading: "How we use it",
            blocks: [
                p(
                    "Your meal, water, weight, and goal data is used solely to provide the nutrition tracking service and, in anonymous aggregate form, the public statistics on the home page. We <strong>never sell it, never share it with third parties, and never use it for advertising</strong> or feed it into any ad or profiling system.",
                ),
                p(
                    "The home page and the public statistics feed behind it show anonymous site-wide totals — how many meals have been logged, their calories and macros, the water logged and the net weight lost across all accounts — and the timezones set in profiles, which the home page draws as a world map. A timezone appears on the map only once at least three profiles use it, and no figure is linked to a person.",
                ),
                p(
                    'When you or your AI assistant look up a barcode, our server sends only the barcode digits to <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> — never your account, email or logs — and keeps the product data it returns in a shared cache that is not linked to any user.',
                ),
                p(
                    "Two kinds of analytics do exist, and neither touches the content of your logs:",
                ),
                ul([
                    "<strong>Website analytics.</strong> With your consent, these pages load Google Analytics, which gives us aggregate traffic statistics — page views, referrers, rough geography, device type — and Microsoft Clarity, which records how visitors use the site — clicks, taps, scrolling, mouse movement — as session replays and heatmaps, so we can see where the pages confuse people. Neither loads until you accept in the cookie banner; if you reject, neither loads at all, and if your browser sends a Global Privacy Control signal, neither loads unless you opt in yourself from the footer. Accepting grants analytics storage only: advertising storage and Google signals stay off. Google receives your IP address with each request but, according to Google, does not log or store it for visitors from the EU, Switzerland or the UK, and uses it only to derive an approximate location. Clarity masks what you type into forms and also receives your IP address and browser details. Neither runs on the sign-in page. You can withdraw at any time with &ldquo;Cookie settings&rdquo; in the footer, which also deletes the analytics cookies set on this site; your choice is kept in your browser's local storage for up to 6 months.",
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
                    "Your meal, water and weight logs, goals, profile settings, and tool-usage telemetry are kept for as long as your account exists — none of them has a separate expiry date or a scheduled purge. When you delete your account, all of it is deleted immediately and irreversibly, as described below. The only traces left are the telemetry row for the deletion itself, recorded without your account id; the short-lived server runtime log described above, which never carries your account id; our database provider's own operational logs, kept for a limited period (up to 7 days on our plan); and its rolling backups, which age out on their own schedule.",
                ),
                p(
                    "Sign-in credentials are short-lived by design. The sign-in page's session lasts 10 minutes and is held in the server's memory; it is tied to your browser by a strictly necessary cookie that holds only a random value, expires after the same 10 minutes and is deleted when sign-in finishes. To check your password or Google sign-in we use Supabase Auth, which creates a Supabase sign-in session each time; we never use it and end it immediately. The one-time authorization code handed to your AI app expires after 10 minutes and is deleted as soon as it is used. An access token is valid for 24 hours (the few issued on or before September 27, 2026 expire no later than October 6, 2026); a refresh token is valid for 90 days, and it is deleted the moment it is used to get a new pair. Expired tokens and codes are deleted automatically within an hour. Deleting your account removes all of them immediately.",
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
                    "You can delete your account and all associated data at any time by asking your AI assistant to <strong>delete your account</strong> while connected to the Nutrition MCP server. This action is immediate and irreversible. It removes your meals, water and weight logs, goals, profile settings, any export archive still in storage, your tool-usage telemetry, your access tokens, and the account itself. That includes every alcohol figure you ever logged, whether or not alcohol tracking was switched on.",
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
                    "<strong>Your account and logs</strong> — to provide the service you signed up for (performance of a contract). Meals, weight and alcohol are health data, so we process them on the basis of your explicit consent, given when you create your account and each time you sign in (for an app connected before the sign-in page asked for this consent, by logging the entries until you next sign in), which you can withdraw at any time by deleting the entries or your account.",
                    "<strong>Tool-usage telemetry and the server runtime log</strong> — our legitimate interest in keeping the service working, fast and secure (finding broken tools, rate-limiting abuse). Neither contains the content of your logs.",
                    "<strong>Website analytics</strong> — your consent, given in the cookie banner and withdrawable at any time with &ldquo;Cookie settings&rdquo; in the footer.",
                ]),
                p(
                    "Your rights, and how to use them — most need no email at all:",
                ),
                ul([
                    "<strong>Access and portability</strong> — ask your AI assistant to export your data. You get a ZIP of CSV files with everything we store about you: your meal, water and weight logs, your goals, your settings, your account record (email address, sign-in methods and sign-in dates, and any name or picture Google sent), your tool-usage telemetry, and the connections that keep your AI apps signed in — without the tokens themselves. Not in it: the values we keep only as one-way hashes for security (your password and your connections&rsquo; tokens), internal bookkeeping such as duplicate-detection keys, the server runtime log, which does not contain your account id, and our providers&rsquo; own short-lived logs and rolling backups.",
                    "<strong>Rectification</strong> — ask your AI assistant to correct or delete any meal, water or weight entry, or to change your goals and settings.",
                    "<strong>Erasure</strong> — ask your AI assistant to delete your account, which removes everything at once.",
                    "<strong>Objection and restriction</strong> — email us.",
                    "<strong>Complaint</strong> — you can complain to the data protection authority where you live or work. We would appreciate the chance to fix it first.",
                ]),
                p(
                    "Everything we store stays in the EU region named above. Whatever your AI assistant reads through the tools is sent to that assistant's provider, which may be outside the EU; that happens under your own agreement with them, not ours. Cloudflare (the network every request passes through), Google and Microsoft (website analytics, Google Sign-In) and Google and jsDelivr (the font and icon requests described above) are outside the EU too; where they receive personal data from outside the EU, they rely on the European Commission's standard contractual clauses or the EU–US Data Privacy Framework.",
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
    lastUpdated: "September 29, 2026",
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
                    'Nutrition MCP is a free, open-source nutrition tracker that runs as an MCP server, letting AI assistants such as Claude and ChatGPT log meals, water, and body weight on your behalf. There is no paid tier, no advertising, and no charge for using the service. We accept voluntary donations on Patreon to help cover hosting and database costs; they are a gift, not a purchase, and they buy no features, no tier, and no priority of any kind. The source code is published under the MIT license on <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> and you are free to self-host it.',
                ),
            ],
        },
        {
            heading: "Your account",
            blocks: [
                p(
                    "You must be at least 16 years old to use the service. We do not verify age, so by creating an account you confirm you meet that requirement. You are responsible for keeping your login credentials confidential and for all activity that happens under your account. Please provide an email address you actually control — it is the only way to recover access.",
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
                    "You can export all of your data at any time by asking your AI assistant to export it. The export is a ZIP archive containing CSV files for your meals, water, weight, goals, profile settings, account record, tool-usage telemetry and connected AI apps; alcohol is included whether or not alcohol tracking is switched on. The download link we hand back is private and expires after 60 minutes.",
                ),
                p(
                    "We also record basic operational telemetry about how the service is used: for every tool call, the tool's name, whether it succeeded, how long it took, a coarse error category when it fails, the length of any date range you asked for, the session id, the MCP protocol revision your AI app connected with, and the name and version that app reports for itself. These rows are linked to your account id. They do not contain what you logged — no food descriptions, no calories, no weights. We use them to keep the service working and to see which tools are worth improving, and they are deleted along with everything else when you delete your account.",
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
                    "The service depends on third parties: Supabase for database, authentication, and export storage, DigitalOcean for hosting, Cloudflare (through our hosting provider) for the network every request passes through, Open Food Facts for barcode data, and whichever AI assistant you connect from.",
                ),
                p(
                    'Barcode product data &copy; <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> contributors, available under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
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

// ----------------------------------------------------------------- German
//
// Kept in the direct, plain-spoken register of the English source rather
// than shifting to formal legalese ("hiermit", "im Sinne von") — the
// English document deliberately reads like a person wrote it, and a
// register shift in translation would change the document's character
// more than its wording. No human review pass (product decision, see
// git history) — legal terminology below follows standard German privacy-
// policy / AGB conventions (Auftragsverarbeiter-style third-party framing,
// "Widerspruch" for objection) as closely as a single AI pass reasonably
// can, but this is exactly the page most worth a native-speaker legal
// review before it's relied on.

const PRIVACY_DE: LegalDoc = {
    title: "Datenschutzerklärung",
    lead: "Wie Nutrition MCP mit deinen Daten umgeht: was wir speichern, wofür wir es nutzen, wo es liegt und wie du dein Konto samt allen Daten jederzeit löschen kannst.",
    documentsLabel: "Rechtliche Dokumente",
    tocLabel: "Auf dieser Seite",
    metaDescription:
        "Wie Nutrition MCP mit deinen Daten umgeht: was wir speichern, wofür wir es nutzen, wo es liegt und wie du dein Konto samt allen Daten jederzeit löschen kannst.",
    ogDescription:
        "Wie Nutrition MCP mit deinen Daten umgeht: was wir speichern, wofür wir es nutzen, wo es liegt und wie du dein Konto samt allen Daten jederzeit löschen kannst.",
    lastUpdated: "29. September 2026",
    backToHome: "Zurück zur Startseite",
    sections: [
        {
            heading: "Welche Daten wir erheben",
            blocks: [
                p(
                    "Bei der Registrierung speichern wir über Supabase Auth deine <strong>E-Mail-Adresse</strong> und ein sicher gehashtes Passwort. Meldest du dich stattdessen mit Google an, fragen wir bei Google nur deine E-Mail-Adresse an und erhalten sie zusammen mit der Konto-Kennung, die Google für dich vergibt; Supabase Auth speichert diese, um dich bei der nächsten Google-Anmeldung wiederzuerkennen. Dein Google-Passwort bekommen wir nie zu sehen. Bei Konten, die sich vor dem 27. September 2026 mit Google angemeldet haben, können außerdem noch der Name und das Profilbild gespeichert sein, die Google damals mitgeschickt hat. Der Dienst liest oder zeigt sie nirgends an, außer in deinem Datenexport, und sie werden mit deinem Konto gelöscht.",
                ),
                p("Wenn du den Dienst nutzt, speichern wir:"),
                ul([
                    "<strong>Mahlzeiten-Einträge</strong> – Beschreibung, Mahlzeitentyp, Kalorien, Makronährstoffe, Ballaststoffe, Gesamtzucker, Gramm Alkohol, Milligramm Koffein, Notizen und Zeitstempel. Essensfotos wertet dein KI-Assistent aus; sie werden nie zu uns hochgeladen oder bei uns gespeichert.",
                    "<strong>Wasser-Einträge</strong> – Menge, Notizen und Zeitstempel.",
                    "<strong>Gewichtseinträge</strong> – Körpergewicht, Notizen und Zeitstempel. Das sind Gesundheitsdaten, und wir behandeln sie genauso wie alle deine anderen Einträge.",
                    "<strong>Ziele</strong> – deine täglichen Ziele für Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker, Alkohol, Koffein und Wasser sowie dein Zielgewicht.",
                    "<strong>Profileinstellungen</strong> – deine IANA-Zeitzone, deine bevorzugte Gewichtseinheit, ob die Alkohol-Erfassung eingeschaltet ist und in welcher Standardgetränk-Einheit Alkohol angezeigt wird, ob In-Chat-Widgets aktiviert sind und in welcher Sprache sie angezeigt werden.",
                    "<strong>Telemetrie zur Werkzeugnutzung</strong> – für jeden MCP-Werkzeugaufruf: welches Werkzeug ausgeführt wurde, ob der Aufruf erfolgreich war, wie lange er dauerte, bei einem Fehler eine grobe Fehlerkategorie, bei einer Abfrage über einen Zeitraum dessen Länge in Tagen, die MCP-Sitzungs-ID, die Revision des MCP-Protokolls, mit der sich deine KI-App verbunden hat, sowie Name und Version, die diese App von sich angibt (zum Beispiel &bdquo;claude-ai/1.0&ldquo;), sofern sie diese mitsendet. Diese Telemetrie ist mit deiner Konto-ID verknüpft und enthält nie den Inhalt deiner Einträge.",
                    "<strong>Server-Laufzeitprotokoll</strong> – für jede Anfrage an den Server: Methode, Pfad, Antwortstatus und Antwortzeit, deine IP-Adresse ohne ihren letzten Teil sowie bei MCP-Anfragen die Protokollrevision und Name und Version, die deine KI-App angibt. Für jeden Werkzeugaufruf hält es außerdem den Namen des Werkzeugs fest, ob der Aufruf erfolgreich war, wie lange er dauerte und bei einem Fehler einen kurzen Referenzcode und die Fehlermeldung – die einen Wert wiedergeben kann, den deine KI-App gesendet hat, etwa ein ungültiges Datum. Wenn sich deine KI-App anmeldet oder ihre Verbindung erneuert, hält es das Ergebnis fest, die zufällige Kennung, die deine KI-App bei der Registrierung bei unserem Anmeldedienst erhalten hat, und die Website, zu der sie zurückgeleitet werden wollte (zum Beispiel claude.ai). Das Protokoll wird in das Laufzeitprotokoll unseres Hosting-Anbieters geschrieben, enthält weder deine Konto-ID noch deine E-Mail-Adresse und wird nur kurz aufbewahrt: Es ist ein Ringpuffer, in dem neue Anfragen die jeweils ältesten Zeilen überschreiben.",
                ]),
                p(
                    "<strong>Auch Alkoholangaben sind Gesundheitsdaten</strong>, und zwar sensiblere als eine Kalorienzahl. Deshalb gelten für sie andere Regeln als für alles oben Genannte. Die Alkohol-Erfassung ist standardmäßig ausgeschaltet, und wir speichern Alkohol nur, wenn die Angabe von dir stammt – ein Getränk, das du einträgst, oder eine Spalte in einer Datei, die du importierst. Nichts im Dienst leitet ihn für dich ab. Schaltest du die Einstellung aus, hat das zwei Folgen: Der Massenimport liest die Alkoholspalte aus hochgeladenen Dateien nicht mehr aus, und überall sonst wird Alkohol in den Mahlzeiten, Zielen, Fortschritten und Widgets, die du siehst, nicht mehr angezeigt. Gelöscht wird dadurch nichts. Alkohol, den du direkt einträgst, wird weiterhin gespeichert, egal ob die Einstellung ein- oder ausgeschaltet ist; bereits Gespeichertes bleibt in der Datenbank, und all das erscheint weiterhin in der Mahlzeiten-Datei jedes Exports, den du erstellst. Um einen Alkoholwert wirklich zu entfernen, lösche die zugehörige Mahlzeit oder dein Konto.",
                ),
                p(
                    "Außerdem speichern wir die OAuth-Zugriffs- und Refresh-Tokens sowie die Autorisierungscodes, über die dein KI-Assistent mit deinem Konto verbunden bleibt; wie lange sie jeweils gültig sind, steht unter &bdquo;Wie lange wir Daten aufbewahren&ldquo;. Wir speichern sie ausschließlich als Einweg-Hashes.",
                ),
            ],
        },
        {
            heading: "Wofür wir die Daten nutzen",
            blocks: [
                p(
                    "Deine Mahlzeiten-, Wasser-, Gewichts- und Zieldaten verwenden wir ausschließlich, um den Dienst zur Ernährungserfassung bereitzustellen, und in anonymer, aggregierter Form für die öffentlichen Statistiken auf der Startseite. Wir <strong>verkaufen sie nie, geben sie nie an Dritte weiter und nutzen sie nie für Werbung</strong>; wir speisen sie auch in kein Werbe- oder Profiling-System ein.",
                ),
                p(
                    "Die Startseite und der öffentliche Statistik-Feed dahinter zeigen anonyme Gesamtwerte über alle Konten hinweg – wie viele Mahlzeiten erfasst wurden, ihre Kalorien und Makronährstoffe, die erfasste Wassermenge und die Netto-Gewichtsabnahme – sowie die in den Profilen eingestellten Zeitzonen, die die Startseite als Weltkarte darstellt. Eine Zeitzone erscheint erst auf der Karte, wenn mindestens drei Profile sie nutzen, und keine Zahl ist mit einer Person verknüpft.",
                ),
                p(
                    'Wenn du oder dein KI-Assistent einen Barcode nachschlägt, sendet unser Server nur die Ziffern des Barcodes an <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> – nie dein Konto, deine E-Mail-Adresse oder deine Einträge – und legt die zurückgelieferten Produktdaten in einem gemeinsam genutzten Cache ab, der mit keiner Nutzerin und keinem Nutzer verknüpft ist.',
                ),
                p(
                    "Zwei Arten von Analysen gibt es allerdings, und keine davon berührt den Inhalt deiner Einträge:",
                ),
                ul([
                    "<strong>Website-Analyse.</strong> Mit deiner Einwilligung laden diese Seiten Google Analytics, das uns aggregierte Statistiken zu den Besucherzahlen liefert (Seitenaufrufe, verweisende Seiten, ungefähre Herkunftsregion, Gerätetyp), und Microsoft Clarity, das als Sitzungsaufzeichnungen und Heatmaps festhält, wie Besucherinnen und Besucher die Website nutzen (Klicks, Tippen, Scrollen, Mausbewegungen), damit wir sehen, an welchen Stellen die Seiten für Verwirrung sorgen. Beide werden erst geladen, wenn du im Cookie-Banner zustimmst. Lehnst du ab, wird keines von beiden geladen; sendet dein Browser ein Global-Privacy-Control-Signal, wird keines von beiden geladen, es sei denn, du willigst selbst über die Fußzeile ein. Deine Zustimmung erlaubt nur das Speichern zu Analysezwecken: Das Speichern zu Werbezwecken und Google Signals bleiben ausgeschaltet. Google erhält bei jeder Anfrage deine IP-Adresse, protokolliert oder speichert sie nach eigenen Angaben bei Besucherinnen und Besuchern aus der EU, der Schweiz und dem Vereinigten Königreich aber nicht und nutzt sie nur, um einen ungefähren Standort abzuleiten. Clarity maskiert, was du in Formulare eingibst, und erhält ebenfalls deine IP-Adresse und Angaben zu deinem Browser. Auf der Anmeldeseite läuft keines von beiden. Du kannst deine Einwilligung jederzeit über &bdquo;Cookie-Einstellungen&ldquo; in der Fußzeile widerrufen; dabei werden auch die auf dieser Website gesetzten Analyse-Cookies gelöscht. Deine Wahl wird bis zu 6 Monate im lokalen Speicher deines Browsers aufbewahrt.",
                    "<strong>Server-Telemetrie.</strong> Jeder MCP-Werkzeugaufruf erzeugt einen Telemetrie-Datensatz – welches Werkzeug ausgeführt wurde, ob der Aufruf erfolgreich war, wie lange er dauerte, welche MCP-Protokollrevision verwendet wurde und welche KI-App (mit dem Namen und der Version, die sie angibt) den Aufruf ausgelöst hat. Er ist mit deiner Konto-ID verknüpft, aber nicht mit dem, was du eingetragen hast. Wir nutzen ihn, um langsame und fehlerhafte Werkzeuge zu finden. Er wird an niemanden weitergegeben und zusammen mit allem anderen gelöscht, wenn du dein Konto löschst.",
                ]),
                p(
                    "Da die Website Schriftarten und Icons von Google Fonts und jsDelivr lädt, erfahren diese Anbieter beim Besuch der Seiten deine IP-Adresse. Die Anzahl der GitHub-Sterne des Projekts ruft unser Server ab, nicht dein Browser; GitHub bekommt von deinem Besuch also nichts mit.",
                ),
            ],
        },
        {
            heading: "Wo die Daten gespeichert werden",
            blocks: [
                p(
                    'Alle Daten werden bei <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) in der EU gespeichert, in der AWS-Region Irland (eu-west-1). Authentifizierung und Speicherung der Exporte übernimmt ebenfalls Supabase in derselben Region. Der Server läuft bei DigitalOcean in Frankfurt am Main. Anfragen an die Website und den Server werden über das Netzwerk von Cloudflare geleitet (das unser Hosting-Anbieter nutzt). Cloudflare entschlüsselt die Verbindung und verarbeitet daher während der Übertragung alles, was an den Dienst gesendet wird oder von ihm kommt, einschließlich deiner IP-Adresse, und kann ein unbedingt erforderliches Cookie zum Schutz vor Bots setzen (<code>__cf_bm</code>, 30 Minuten).',
                ),
            ],
        },
        {
            heading: "Wie lange wir Daten aufbewahren",
            blocks: [
                p(
                    "Deine Mahlzeiten-, Wasser- und Gewichtseinträge, Ziele, Profileinstellungen und deine Telemetrie zur Werkzeugnutzung bewahren wir auf, solange dein Konto besteht – für keine dieser Daten gibt es ein eigenes Ablaufdatum oder eine planmäßige Löschung. Wenn du dein Konto löschst, wird all das sofort und unwiderruflich gelöscht, wie unten beschrieben. Zurück bleiben nur: der Telemetrie-Datensatz zur Löschung selbst, der ohne deine Konto-ID gespeichert wird; das oben beschriebene kurzlebige Server-Laufzeitprotokoll, das nie deine Konto-ID enthält; die eigenen Betriebsprotokolle unseres Datenbankanbieters, die für begrenzte Zeit aufbewahrt werden (in unserem Tarif bis zu 7 Tage); sowie seine rollierenden Backups, die nach einem eigenen Zeitplan automatisch auslaufen.",
                ),
                p(
                    "Anmeldedaten sind bewusst kurzlebig. Die Sitzung der Anmeldeseite ist 10 Minuten gültig und wird im Arbeitsspeicher des Servers gehalten; sie ist über ein unbedingt erforderliches Cookie an deinen Browser gebunden, das nur einen Zufallswert enthält, ebenfalls nach 10 Minuten abläuft und gelöscht wird, sobald die Anmeldung abgeschlossen ist. Um dein Passwort oder deine Google-Anmeldung zu prüfen, nutzen wir Supabase Auth, das dabei jedes Mal eine Supabase-Anmeldesitzung anlegt; wir verwenden sie nie und beenden sie sofort. Der einmalige Autorisierungscode, den deine KI-App erhält, läuft nach 10 Minuten ab und wird gelöscht, sobald er verwendet wurde. Ein Zugriffstoken ist 24 Stunden gültig (die wenigen, die bis einschließlich 27. September 2026 ausgestellt wurden, laufen spätestens am 6. Oktober 2026 ab); ein Refresh-Token ist 90 Tage gültig und wird gelöscht, sobald damit ein neues Token-Paar abgerufen wird. Abgelaufene Tokens und Codes werden innerhalb einer Stunde automatisch gelöscht. Wenn du dein Konto löschst, werden sie alle sofort entfernt.",
                ),
                p(
                    "Exportarchive sind kurzlebig. Jeder neue Export überschreibt den vorherigen, und die Datei wird automatisch gelöscht, sobald ihr Download-Link nach 60 Minuten abgelaufen ist – eine Bereinigung läuft alle zehn Minuten, sodass ein Archiv normalerweise nicht länger als etwa 70 Minuten gespeichert bleibt.",
                ),
            ],
        },
        {
            heading: "Löschung deiner Daten",
            blocks: [
                p(
                    "Du kannst dein Konto und alle zugehörigen Daten jederzeit löschen, indem du deinen KI-Assistenten, während er mit dem Nutrition-MCP-Server verbunden ist, bittest, <strong>dein Konto zu löschen</strong>. Die Löschung erfolgt sofort und ist unwiderruflich. Sie entfernt deine Mahlzeiten-, Wasser- und Gewichtseinträge, Ziele, Profileinstellungen, ein noch gespeichertes Exportarchiv, deine Telemetrie zur Werkzeugnutzung, deine Zugriffstokens und das Konto selbst. Dazu gehört auch jeder Alkoholwert, den du je eingetragen hast, unabhängig davon, ob die Alkohol-Erfassung eingeschaltet war.",
                ),
            ],
        },
        {
            heading: "Kontakt und deine Rechte",
            blocks: [
                p(
                    'Nutrition MCP wird von Anton Kutishevskyi betrieben, einem Einzelentwickler, der für diesen Dienst Verantwortlicher für deine personenbezogenen Daten ist. Bei allen Fragen zu deinen Daten oder zu dieser Datenschutzerklärung schreib an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Auf welcher Grundlage wir deine Daten verarbeiten dürfen:"),
                ul([
                    "<strong>Dein Konto und deine Einträge</strong> – um den Dienst bereitzustellen, für den du dich registriert hast (Vertragserfüllung). Mahlzeiten, Gewicht und Alkohol sind Gesundheitsdaten. Wir verarbeiten sie daher auf Grundlage deiner ausdrücklichen Einwilligung, die du bei der Kontoerstellung und bei jeder Anmeldung erteilst (bei einer App, die verbunden wurde, bevor die Anmeldeseite nach dieser Einwilligung fragte, indem du bis zu deiner nächsten Anmeldung Einträge vornimmst) und jederzeit widerrufen kannst, indem du die Einträge oder dein Konto löschst.",
                    "<strong>Telemetrie zur Werkzeugnutzung und Server-Laufzeitprotokoll</strong> – unser berechtigtes Interesse daran, den Dienst funktionsfähig, schnell und sicher zu halten (fehlerhafte Werkzeuge finden, Missbrauch durch Ratenbegrenzung eindämmen). Keines von beiden enthält den Inhalt deiner Einträge.",
                    "<strong>Website-Analyse</strong> – deine Einwilligung, die du im Cookie-Banner erteilst und jederzeit über &bdquo;Cookie-Einstellungen&ldquo; in der Fußzeile widerrufen kannst.",
                ]),
                p(
                    "Deine Rechte und wie du sie ausübst – für die meisten brauchst du nicht einmal eine E-Mail:",
                ),
                ul([
                    "<strong>Auskunft und Datenübertragbarkeit</strong> – bitte deinen KI-Assistenten, deine Daten zu exportieren. Du erhältst ein ZIP-Archiv mit CSV-Dateien, das alles enthält, was wir über dich speichern: deine Mahlzeiten-, Wasser- und Gewichtseinträge, deine Ziele, deine Einstellungen, deinen Kontodatensatz (E-Mail-Adresse, Anmeldemethoden und Anmeldezeitpunkte sowie gegebenenfalls den Namen oder das Bild, das Google übermittelt hat), deine Telemetrie zur Werkzeugnutzung und die Verbindungen, über die deine KI-Apps angemeldet bleiben – ohne die Tokens selbst. Nicht enthalten sind: die Werte, die wir aus Sicherheitsgründen nur als Einweg-Hashes speichern (dein Passwort und die Tokens deiner Verbindungen), interne Verwaltungsdaten wie Schlüssel zur Duplikaterkennung, das Server-Laufzeitprotokoll, das deine Konto-ID nicht enthält, sowie die kurzlebigen Protokolle und rollierenden Backups unserer Anbieter.",
                    "<strong>Berichtigung</strong> – bitte deinen KI-Assistenten, einen Mahlzeiten-, Wasser- oder Gewichtseintrag zu korrigieren oder zu löschen oder deine Ziele und Einstellungen zu ändern.",
                    "<strong>Löschung</strong> – bitte deinen KI-Assistenten, dein Konto zu löschen; damit wird alles auf einmal entfernt.",
                    "<strong>Widerspruch und Einschränkung der Verarbeitung</strong> – schreib uns eine E-Mail.",
                    "<strong>Beschwerde</strong> – du kannst dich bei der Datenschutzaufsichtsbehörde an deinem Wohn- oder Arbeitsort beschweren. Wir wären dir aber dankbar, wenn du uns vorher die Gelegenheit gibst, das Problem zu beheben.",
                ]),
                p(
                    "Alles, was wir speichern, bleibt in der oben genannten EU-Region. Was dein KI-Assistent über die Werkzeuge abruft, wird an den Anbieter dieses Assistenten übermittelt, der seinen Sitz außerhalb der EU haben kann; das geschieht auf Grundlage deiner eigenen Vereinbarung mit diesem Anbieter, nicht unserer. Auch Cloudflare (das Netzwerk, über das jede Anfrage läuft), Google und Microsoft (Website-Analyse, Google Sign-In) sowie Google und jsDelivr (die oben beschriebenen Abrufe von Schriftarten und Icons) sitzen außerhalb der EU; soweit sie personenbezogene Daten außerhalb der EU empfangen, stützen sie sich auf die Standardvertragsklauseln der Europäischen Kommission oder den EU-US-Datenschutzrahmen (EU–US Data Privacy Framework).",
                ),
                p(
                    'Der Dienst ist nicht für Personen unter 16 Jahren gedacht, und die <a href="/terms" data-legal-link="terms">Nutzungsbedingungen</a> setzen voraus, dass du mindestens 16 bist. Wenn du glaubst, dass eine jüngere Person ein Konto erstellt hat, schreib uns eine E-Mail, und wir löschen es.',
                ),
                p(
                    "Ändert sich diese Datenschutzerklärung, ändert sich auch das Datum oben.",
                ),
            ],
        },
        {
            heading: "Nutzungsbedingungen",
            blocks: [
                p(
                    'Für die Nutzung des Dienstes gelten außerdem unsere <a href="/terms" data-legal-link="terms">Nutzungsbedingungen</a>. Sie regeln die zulässige Nutzung, stellen klar, dass nichts davon eine medizinische Beratung darstellt, und schließen jede Gewährleistung aus – der Dienst wird &bdquo;wie besehen&ldquo; und kostenlos bereitgestellt, ohne Garantie für Verfügbarkeit, Richtigkeit oder Eignung für einen bestimmten Zweck.',
                ),
            ],
        },
    ],
};

const TERMS_DE: LegalDoc = {
    title: "Nutzungsbedingungen",
    lead: "Die Bedingungen für die Nutzung von Nutrition MCP – dem kostenlosen Open-Source-Ernährungs-Tracker und Remote-MCP-Server für Claude und ChatGPT.",
    documentsLabel: "Rechtliche Dokumente",
    tocLabel: "Auf dieser Seite",
    metaDescription:
        "Die Bedingungen für die Nutzung von Nutrition MCP – dem kostenlosen Open-Source-Ernährungs-Tracker und Remote-MCP-Server für Claude und ChatGPT. Verständliche Regeln zu Konto, zulässiger Nutzung, deinen Daten und Haftung.",
    ogDescription:
        "Die Bedingungen für die Nutzung von Nutrition MCP – dem kostenlosen Open-Source-Ernährungs-Tracker und Remote-MCP-Server für Claude und ChatGPT.",
    lastUpdated: "29. September 2026",
    backToHome: "Zurück zur Startseite",
    sections: [
        {
            heading: "Vereinbarung",
            blocks: [
                p(
                    "Diese Bedingungen regeln deine Nutzung von Nutrition MCP (der &bdquo;Dienst&ldquo;) – der Website unter nutrition-mcp.com und des Remote-MCP-Servers unter <strong>https://nutrition-mcp.com/mcp</strong>. Indem du ein Konto erstellst oder einen KI-Assistenten mit dem Server verbindest, stimmst du diesen Bedingungen zu. Wenn du nicht einverstanden bist, nutze den Dienst bitte nicht.",
                ),
                p(
                    "Der Dienst wird von Anton Kutishevskyi betrieben, einem Einzelentwickler (&bdquo;wir&ldquo;, &bdquo;uns&ldquo;).",
                ),
            ],
        },
        {
            heading: "Der Dienst",
            blocks: [
                p(
                    'Nutrition MCP ist ein kostenloser Open-Source-Ernährungs-Tracker, der als MCP-Server läuft und mit dem KI-Assistenten wie Claude und ChatGPT in deinem Namen Mahlzeiten, Wasser und Körpergewicht erfassen können. Es gibt keinen kostenpflichtigen Tarif, keine Werbung und keine Gebühr für die Nutzung des Dienstes. Wir nehmen freiwillige Spenden auf Patreon an, die helfen, die Kosten für Hosting und Datenbank zu decken; sie sind ein Geschenk, kein Kauf, und mit ihnen erwirbst du keine Funktionen, keinen Tarif und keinerlei Vorrang. Der Quellcode ist unter der MIT-Lizenz auf <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> veröffentlicht, und es steht dir frei, ihn selbst zu hosten.',
                ),
            ],
        },
        {
            heading: "Dein Konto",
            blocks: [
                p(
                    "Du musst mindestens 16 Jahre alt sein, um den Dienst zu nutzen. Wir prüfen das Alter nicht; mit der Erstellung eines Kontos bestätigst du daher, dass du diese Voraussetzung erfüllst. Du bist dafür verantwortlich, deine Anmeldedaten geheim zu halten, und ebenso für alle Aktivitäten, die über dein Konto erfolgen. Bitte gib eine E-Mail-Adresse an, auf die du tatsächlich Zugriff hast – nur über sie lässt sich der Zugang wiederherstellen.",
                ),
                p(
                    "Du darfst den Dienst nur dort nutzen, wo dein KI-Anbieter ihn unterstützt und wo geltende Sanktions- und Exportkontrollgesetze es erlauben.",
                ),
            ],
        },
        {
            heading: "Keine medizinische Beratung",
            blocks: [
                p(
                    "Nutrition MCP ist ein Werkzeug zum Erfassen und Auswerten, kein Gesundheitsdienst. Nichts, was der Dienst ausgibt – Kalorien- und Makronährstoffwerte, Ziele, Trends oder Kommentare, die dein KI-Assistent ergänzt –, ist eine medizinische, ernährungswissenschaftliche oder diätetische Beratung, und nichts davon ersetzt eine qualifizierte Fachperson. Sprich mit einer Ärztin, einem Arzt oder einer Ernährungsfachkraft, bevor du Entscheidungen über deine Gesundheit triffst, besonders wenn du eine Erkrankung hast oder schon einmal ein gestörtes Essverhalten hattest.",
                ),
                p(
                    "Der Dienst ist nicht für den klinischen Einsatz ausgelegt und sollte von Personen mit einer akuten Essstörung, von Schwangeren und von Personen, die wegen einer ernährungsbedingten Erkrankung in klinischer Betreuung sind, nicht ohne Einbeziehung ihrer behandelnden Fachperson genutzt werden. Kalorien- und Makro-Tracking kann in solchen Situationen schaden. Wenn das auf dich zutrifft, sprich vor der Nutzung mit deiner behandelnden Fachperson.",
                ),
                p(
                    "Ernährungswerte sind <strong>Schätzungen</strong>. Sie stammen von KI-Modellen, die deine Beschreibungen und Fotos auswerten, aus Datenbanken Dritter wie Open Food Facts und aus deinen eigenen Eingaben. Sie können falsch sein. Prüf alles nach, was für dich wichtig ist.",
                ),
                p(
                    "Essensfotos werden nie an unseren Server gesendet. Dein KI-Assistent wertet das Bild selbst aus und sendet uns nur den daraus entstandenen Text und die Zahlen – eine Beschreibung, einen Mahlzeitentyp, Kalorien, Makronährstoffe, Notizen, einen Barcode.",
                ),
            ],
        },
        {
            heading: "Zulässige Nutzung",
            blocks: [
                p(
                    "Bei der Nutzung des Dienstes verpflichtest du dich, Folgendes zu unterlassen:",
                ),
                ul([
                    "den Dienst für rechtswidrige Zwecke oder unter Verstoß gegen geltendes Recht oder geltende Vorschriften zu nutzen;",
                    "zu versuchen, auf das Konto oder die Daten einer anderen Nutzerin oder eines anderen Nutzers zuzugreifen oder die Authentifizierung, Ratenbegrenzungen oder andere technische Schutzmaßnahmen zu umgehen;",
                    "den Dienst oder die Infrastruktur, auf der er läuft, auszuspähen, zu scannen, zu überlasten oder zu stören, auch durch automatisierte Massenanfragen;",
                    "Inhalte hochzuladen, die rechtswidrig sind oder die du nicht weitergeben darfst;",
                    "den gehosteten Dienst weiterzuverkaufen oder als deinen eigenen auszugeben;",
                    "den Dienst zu nutzen, um extreme Kalorienrestriktion zu betreiben oder sie bei anderen zu propagieren, anzuleiten oder zu fördern.",
                ]),
                p(
                    "Für den Dienst gelten Ratenbegrenzungen, damit er für alle verfügbar bleibt. Brauchst du mehr Kapazität, hoste ihn selbst – genau dafür gibt es die MIT-Lizenz.",
                ),
            ],
        },
        {
            heading: "Deine Daten",
            blocks: [
                p(
                    'Deine Einträge gehören weiterhin dir. Wir speichern und verarbeiten sie, um den Dienst für dich zu betreiben, wie in unserer <a href="/privacy" data-legal-link="privacy">Datenschutzerklärung</a> beschrieben. Für die Inhalte, die du einträgst, bist du selbst verantwortlich.',
                ),
                p(
                    "Du kannst jederzeit alle deine Daten exportieren, indem du deinen KI-Assistenten darum bittest. Der Export ist ein ZIP-Archiv mit CSV-Dateien zu deinen Mahlzeiten-, Wasser- und Gewichtseinträgen, Zielen, Profileinstellungen, deinem Kontodatensatz, deiner Telemetrie zur Werkzeugnutzung und deinen verbundenen KI-Apps; Alkohol ist enthalten, unabhängig davon, ob die Alkohol-Erfassung eingeschaltet ist. Der Download-Link, den du von uns erhältst, ist privat und läuft nach 60 Minuten ab.",
                ),
                p(
                    "Außerdem erfassen wir grundlegende Betriebstelemetrie darüber, wie der Dienst genutzt wird: für jeden Werkzeugaufruf den Namen des Werkzeugs, ob der Aufruf erfolgreich war, wie lange er dauerte, bei einem Fehler eine grobe Fehlerkategorie, die Länge eines abgefragten Zeitraums, die Sitzungs-ID, die MCP-Protokollrevision, mit der sich deine KI-App verbunden hat, sowie Name und Version, die diese App von sich angibt. Diese Datensätze sind mit deiner Konto-ID verknüpft. Sie enthalten nicht, was du eingetragen hast – keine Lebensmittelbeschreibungen, keine Kalorien, keine Gewichtswerte. Wir nutzen sie, um den Dienst am Laufen zu halten und zu erkennen, bei welchen Werkzeugen sich Verbesserungen lohnen; sie werden zusammen mit allem anderen gelöscht, wenn du dein Konto löschst.",
                ),
                p(
                    "Du kannst dein Konto und alle zugehörigen Daten jederzeit löschen, indem du deinen KI-Assistenten, während er verbunden ist, bittest, <strong>dein Konto zu löschen</strong> – die Löschung erfolgt sofort und ist unwiderruflich.",
                ),
            ],
        },
        {
            heading: "Verfügbarkeit und Änderungen",
            blocks: [
                p(
                    "Der Dienst wird kostenlos angeboten, ohne Verfügbarkeitszusage und ohne Service-Level-Agreement. Wir können jeden Teil davon – einschließlich der Werkzeuge, Funktionen und des gehosteten Servers selbst – jederzeit und ohne Vorankündigung ändern, aussetzen oder einstellen. Außerdem können wir Inhalte ändern oder entfernen, die gegen diese Bedingungen verstoßen.",
                ),
            ],
        },
        {
            heading: "Dienste Dritter",
            blocks: [
                p(
                    "Der Dienst ist auf Dritte angewiesen: Supabase für Datenbank, Authentifizierung und Speicherung der Exporte, DigitalOcean für das Hosting, Cloudflare (über unseren Hosting-Anbieter) für das Netzwerk, über das jede Anfrage läuft, Open Food Facts für Barcode-Daten sowie den KI-Assistenten, über den du dich verbindest.",
                ),
                p(
                    'Barcode-Produktdaten &copy; Mitwirkende von <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, verfügbar unter der <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Die Website selbst nutzt außerdem mit deiner Einwilligung Google Analytics und Microsoft Clarity, um die Besucherzahlen und die Nutzung der Seiten zu messen, Google Fonts und das CDN jsDelivr, um Schriftarten und Icons zu laden, Google Sign-In, falls du dich auf diesem Weg anmeldest, sowie die GitHub-API, über die unser Server (nicht dein Browser) die Anzahl der GitHub-Sterne des Projekts abfragt, sodass keine Besucherdaten zu GitHub gelangen. Beim Laden einer Seite gehen daher Anfragen an Google Fonts und jsDelivr, die deine IP-Adresse und deinen Browser sehen können; Google Analytics und Microsoft Clarity werden erst kontaktiert, nachdem du der Analyse zugestimmt hast.",
                ),
                p(
                    "Für ihre Bedingungen und ihre Verfügbarkeit sind diese Anbieter selbst verantwortlich, nicht wir.",
                ),
            ],
        },
        {
            heading: "Keine Gewährleistung",
            blocks: [
                p(
                    "Der Dienst wird <strong>&bdquo;wie besehen&ldquo; und &bdquo;nach Verfügbarkeit&ldquo;</strong> bereitgestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung, einschließlich stillschweigender Gewährleistungen der Marktgängigkeit, der Eignung für einen bestimmten Zweck, der Richtigkeit oder der Nichtverletzung von Rechten Dritter. Wir gewährleisten nicht, dass der Dienst unterbrechungsfrei, sicher oder fehlerfrei ist oder dass Daten oder Ernährungswerte, die er liefert, korrekt sind. Die Nutzung erfolgt auf eigenes Risiko.",
                ),
            ],
        },
        {
            heading: "Haftungsbeschränkung",
            blocks: [
                p(
                    "Im größtmöglichen gesetzlich zulässigen Umfang haften wir nicht für indirekte Schäden, Begleitschäden, besondere Schäden, Folgeschäden oder Schadensersatz mit Strafcharakter und auch nicht für Daten- oder Gewinnverluste, die aus oder im Zusammenhang mit deiner Nutzung des Dienstes entstehen.",
                ),
            ],
        },
        {
            heading: "Deine gesetzlichen Rechte",
            blocks: [
                p(
                    "Für manches lässt sich die Haftung nie ausschließen, und das versuchen wir auch nicht. Wir haften weiterhin uneingeschränkt für Tod oder Körperverletzung, die durch unsere Fahrlässigkeit verursacht werden, sowie für Betrug und arglistige Täuschung.",
                ),
                p(
                    "Außerdem behältst du alle Rechte, die dir das Gesetz als Verbraucherin oder Verbraucher einräumt. Diese Bedingungen gelten neben diesen Rechten und schränken sie nicht ein. Steht ein Abschnitt oben im Widerspruch zu einem Recht, auf das du nicht verzichten kannst, hat dein gesetzliches Recht Vorrang.",
                ),
            ],
        },
        {
            heading: "Beendigung",
            blocks: [
                p(
                    "Du kannst die Nutzung des Dienstes jederzeit beenden und dein Konto wie oben beschrieben löschen. Wir können einen Zugang sperren oder beenden, wenn seine Nutzung gegen diese Bedingungen verstößt oder die Stabilität oder Sicherheit des Dienstes gefährdet. Die Abschnitte &bdquo;Keine Gewährleistung&ldquo;, &bdquo;Haftungsbeschränkung&ldquo; und &bdquo;Deine gesetzlichen Rechte&ldquo; gelten auch nach der Beendigung fort.",
                ),
            ],
        },
        {
            heading: "Änderungen dieser Bedingungen",
            blocks: [
                p(
                    "Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Die jeweils aktuelle Fassung findest du immer auf dieser Seite; das Datum oben zeigt, wann sie zuletzt geändert wurde. Wenn du den Dienst nach einer Aktualisierung weiter nutzt, akzeptierst du die überarbeiteten Bedingungen.",
                ),
            ],
        },
        {
            heading: "Salvatorische Klausel",
            blocks: [
                p(
                    "Sollte sich ein Teil dieser Bedingungen als nicht durchsetzbar erweisen, entfällt dieser Teil, und die übrigen Bestimmungen bleiben in Kraft.",
                ),
            ],
        },
        {
            heading: "Kontakt",
            blocks: [
                p(
                    'Fragen zu diesen Bedingungen oder zu deinen Daten? Schreib an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

export const PRIVACY: Partial<Record<SiteLocale, LegalDoc>> = {
    en: PRIVACY_EN,
    de: PRIVACY_DE,
    es: PRIVACY_ES,
    fr: PRIVACY_FR,
    nl: PRIVACY_NL,
    pl: PRIVACY_PL,
    it: PRIVACY_IT,
    uk: PRIVACY_UK,
    ja: PRIVACY_JA,
};

export const TERMS: Partial<Record<SiteLocale, LegalDoc>> = {
    en: TERMS_EN,
    de: TERMS_DE,
    es: TERMS_ES,
    fr: TERMS_FR,
    nl: TERMS_NL,
    pl: TERMS_PL,
    it: TERMS_IT,
    uk: TERMS_UK,
    ja: TERMS_JA,
};

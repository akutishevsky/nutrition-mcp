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
    lastUpdated: "July 26, 2026",
    backToHome: "Back to home",
    sections: [
        {
            heading: "What we collect",
            blocks: [
                p(
                    "When you register, we store your <strong>email address</strong> and a securely hashed password via Supabase Auth. If you sign in with Google instead, we receive your email address from Google and never see a password at all.",
                ),
                p("When you use the service, we store:"),
                ul([
                    "<strong>Meal logs</strong> — description, meal type, calories, macros, fiber, total sugar, grams of alcohol, milligrams of caffeine, notes, and timestamps. Food photos are interpreted by your AI assistant and are never uploaded to or stored by us.",
                    "<strong>Water logs</strong> — amount, notes, and timestamps.",
                    "<strong>Body weight logs</strong> — weight, notes, and timestamps. This is health data, and it is treated exactly like the rest of your logs.",
                    "<strong>Goals</strong> — your daily calorie, protein, carb, fat, fiber, sugar, alcohol, caffeine, and water targets, and your target weight.",
                    "<strong>Profile settings</strong> — your IANA timezone, preferred weight unit, whether alcohol tracking is switched on and which standard drink it is shown in, and whether in-chat widgets are enabled.",
                    "<strong>Tool-usage telemetry</strong> — for each MCP tool call, which tool ran, whether it succeeded, how long it took, a coarse error category when it failed, the span in days of any date range you asked for, and the MCP session id. It is linked to your account id. It never includes the content of your logs.",
                ]),
                p(
                    "<strong>Alcohol is health data too</strong>, and of a more sensitive kind than a calorie count, so it works differently from everything above. Alcohol tracking is off by default, and we only ever record alcohol when it comes from you — a drink you log, or a column in a file you import. Nothing infers it on your behalf. Switching the setting off does two things: the bulk importer stops reading the alcohol column out of files you upload, and everything else stops showing alcohol in the meals, goals, progress and widgets you see. It is not a delete switch. Alcohol you logged directly is still recorded whether the setting is on or off, anything already stored stays in the database, and all of it still appears in the meals file of any export you take. To actually remove an alcohol figure, delete the meal it belongs to, or delete your account.",
                ),
                p(
                    "We also keep the OAuth access and refresh tokens and authorization codes that let your AI assistant stay connected to your account.",
                ),
            ],
        },
        {
            heading: "How we use it",
            blocks: [
                p(
                    "Your meal, water, weight, and goal data is used solely to provide the nutrition tracking service. We <strong>never sell it, never share it with third parties, and never use it for advertising</strong> or feed it into any ad or profiling system.",
                ),
                p(
                    "Two kinds of analytics do exist, and neither touches the content of your logs:",
                ),
                ul([
                    "<strong>Website analytics.</strong> These pages load Google Analytics, which gives us aggregate traffic statistics — page views, referrers, rough geography, device type. It runs on every page, including this one, and there is currently no consent banner and no IP anonymization, so Google receives your IP address as part of the standard measurement. If you would rather not be measured, a tracker blocker or your browser's &ldquo;do not track&rdquo;-style protections will stop it.",
                    "<strong>Server telemetry.</strong> Every MCP tool call writes one row of usage telemetry — which tool ran, whether it succeeded, how long it took — linked to your account id but not to what you logged. We use it to find slow and broken tools. It is not shared with anyone, and it is deleted along with everything else when you delete your account.",
                ]),
                p(
                    "Because the site loads fonts and icons from Google Fonts and jsDelivr, and the home page fetches the project's star count from the GitHub API, visiting these pages exposes your IP address to those providers.",
                ),
            ],
        },
        {
            heading: "Where it's stored",
            blocks: [
                p(
                    'All data is stored in <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL). Authentication is handled by Supabase Auth. The server is hosted on DigitalOcean.',
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
    lastUpdated: "July 26, 2026",
    backToHome: "Back to home",
    sections: [
        {
            heading: "Agreement",
            blocks: [
                p(
                    "These terms govern your use of Nutrition MCP (the &ldquo;service&rdquo;) — the website at nutrition-mcp.com and the remote MCP server at <strong>https://nutrition-mcp.com/mcp</strong>. By creating an account or connecting an AI assistant to the server, you agree to these terms. If you do not agree, please do not use the service.",
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
                    "You can export your <strong>meal log</strong> to CSV at any time by asking your AI assistant to export your meals. The export covers meals only — one row per meal with its time, timezone, meal type, description, calories, protein, carbs, fat, fiber, sugar, alcohol, caffeine, and notes. Alcohol is included whether or not alcohol tracking is switched on for your account. Water, weight, goals, and settings are not included in the export today. The download link we hand back is private and expires after 60 minutes.",
                ),
                p(
                    "We also record basic operational telemetry about how the service is used: for every tool call, the tool's name, whether it succeeded, how long it took, a coarse error category when it fails, the length of any date range you asked for, and the session id. These rows are linked to your account id. They do not contain what you logged — no food descriptions, no calories, no weights. We use them to keep the service working and to see which tools are worth improving, and they are deleted along with everything else when you delete your account.",
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
                    "The service depends on third parties: Supabase for database, authentication, and export storage, DigitalOcean for hosting, Open Food Facts for barcode data, and whichever AI assistant you connect from.",
                ),
                p(
                    "The website itself also uses Google Analytics to measure traffic, Google Fonts and the jsDelivr CDN to load fonts and icons, Google Sign-In if you choose that way of logging in, and the GitHub API to show the project's star count. Loading a page therefore makes requests to those services, which can see your IP address and browser.",
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
                    'Questions about these terms? Email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
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
    metaDescription:
        "Wie Nutrition MCP mit deinen Daten umgeht: was wir speichern, wie es genutzt wird, wo es liegt und wie du dein Konto samt allem darin jederzeit löschen kannst.",
    ogDescription:
        "Wie Nutrition MCP mit deinen Daten umgeht: was wir speichern, wie es genutzt wird, wo es liegt und wie du dein Konto samt allem darin jederzeit löschen kannst.",
    lastUpdated: "26. Juli 2026",
    backToHome: "Zurück zur Startseite",
    sections: [
        {
            heading: "Was wir erfassen",
            blocks: [
                p(
                    "Bei der Registrierung speichern wir deine <strong>E-Mail-Adresse</strong> und ein sicher gehashtes Passwort über Supabase Auth. Meldest du dich stattdessen mit Google an, erhalten wir deine E-Mail-Adresse von Google und bekommen niemals ein Passwort zu sehen.",
                ),
                p("Bei der Nutzung des Dienstes speichern wir:"),
                ul([
                    "<strong>Mahlzeiten-Einträge</strong> — Beschreibung, Mahlzeitentyp, Kalorien, Makronährstoffe, Ballaststoffe, Gesamtzucker, Gramm Alkohol, Milligramm Koffein, Notizen und Zeitstempel. Essensfotos werden von deinem KI-Assistenten interpretiert und niemals zu uns hochgeladen oder bei uns gespeichert.",
                    "<strong>Wasser-Einträge</strong> — Menge, Notizen und Zeitstempel.",
                    "<strong>Körpergewichts-Einträge</strong> — Gewicht, Notizen und Zeitstempel. Das sind Gesundheitsdaten und werden genauso behandelt wie alle anderen Einträge.",
                    "<strong>Ziele</strong> — deine täglichen Ziele für Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker, Alkohol, Koffein und Wasser sowie dein Zielgewicht.",
                    "<strong>Profileinstellungen</strong> — deine IANA-Zeitzone, bevorzugte Gewichtseinheit, ob die Alkohol-Erfassung aktiviert ist und in welchem Standardgetränk sie angezeigt wird, sowie ob In-Chat-Widgets aktiviert sind.",
                    "<strong>Nutzungs-Telemetrie der Werkzeuge</strong> — für jeden MCP-Tool-Aufruf, welches Werkzeug ausgeführt wurde, ob es erfolgreich war, wie lange es dauerte, eine grobe Fehlerkategorie bei einem Fehlschlag, die Länge in Tagen eines angefragten Datumsbereichs sowie die MCP-Sitzungs-ID. Sie ist mit deiner Konto-ID verknüpft und enthält niemals den Inhalt deiner Einträge.",
                ]),
                p(
                    "<strong>Auch Alkohol ist ein Gesundheitsdatum</strong>, und zwar ein sensibleres als eine Kalorienzahl, daher funktioniert es anders als alles oben Genannte. Die Alkohol-Erfassung ist standardmäßig deaktiviert, und wir erfassen Alkohol ausschließlich, wenn er von dir stammt — ein von dir eingetragenes Getränk oder eine Spalte in einer importierten Datei. Nichts wird stellvertretend für dich abgeleitet. Das Deaktivieren der Einstellung bewirkt zwei Dinge: Der Massenimport liest die Alkoholspalte in hochgeladenen Dateien nicht mehr aus, und überall sonst wird Alkohol in den Mahlzeiten, Zielen, Fortschritten und Widgets, die du siehst, nicht mehr angezeigt. Es ist kein Löschschalter. Direkt von dir erfasster Alkohol bleibt unabhängig vom Zustand dieser Einstellung gespeichert, bereits Gespeichertes bleibt in der Datenbank, und all das erscheint weiterhin in der Mahlzeiten-Datei jedes Exports, den du erstellst. Um einen Alkoholwert tatsächlich zu entfernen, lösche die zugehörige Mahlzeit oder dein Konto.",
                ),
                p(
                    "Außerdem speichern wir die OAuth-Zugriffs- und Refresh-Tokens sowie Autorisierungscodes, die deinem KI-Assistenten die dauerhafte Verbindung mit deinem Konto ermöglichen.",
                ),
            ],
        },
        {
            heading: "Wie wir es nutzen",
            blocks: [
                p(
                    "Deine Mahlzeiten-, Wasser-, Gewichts- und Zieldaten werden ausschließlich zur Bereitstellung des Ernährungs-Tracking-Dienstes verwendet. Wir <strong>verkaufen sie niemals, geben sie niemals an Dritte weiter und nutzen sie niemals für Werbung</strong> oder speisen sie in ein Werbe- oder Profiling-System ein.",
                ),
                p(
                    "Es gibt zwei Arten von Analysen, und keine berührt den Inhalt deiner Einträge:",
                ),
                ul([
                    "<strong>Website-Analyse.</strong> Diese Seiten laden Google Analytics, das uns aggregierte Traffic-Statistiken liefert — Seitenaufrufe, Referrer, grobe Geografie, Gerätetyp. Es läuft auf jeder Seite, auch dieser hier, und derzeit gibt es weder ein Consent-Banner noch eine IP-Anonymisierung, sodass Google im Rahmen der Standardmessung deine IP-Adresse erhält. Möchtest du nicht erfasst werden, verhindert das ein Tracker-Blocker oder die &bdquo;Do-Not-Track&ldquo;-Einstellungen deines Browsers.",
                    "<strong>Server-Telemetrie.</strong> Jeder MCP-Tool-Aufruf schreibt eine Zeile Nutzungs-Telemetrie — welches Werkzeug ausgeführt wurde, ob es erfolgreich war, wie lange es dauerte — verknüpft mit deiner Konto-ID, aber nicht mit dem, was du eingetragen hast. Wir nutzen sie, um langsame und defekte Werkzeuge zu finden. Sie wird mit niemandem geteilt und zusammen mit allem anderen gelöscht, wenn du dein Konto löschst.",
                ]),
                p(
                    "Da die Seite Schriftarten und Icons von Google Fonts und jsDelivr lädt und die Startseite die Star-Anzahl des Projekts über die GitHub-API abruft, wird beim Besuch dieser Seiten deine IP-Adresse gegenüber diesen Anbietern offengelegt.",
                ),
            ],
        },
        {
            heading: "Wo es gespeichert wird",
            blocks: [
                p(
                    'Alle Daten werden bei <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) gespeichert. Die Authentifizierung erfolgt über Supabase Auth. Der Server wird bei DigitalOcean gehostet.',
                ),
            ],
        },
        {
            heading: "Löschung deiner Daten",
            blocks: [
                p(
                    "Du kannst dein Konto und alle zugehörigen Daten jederzeit löschen, indem du deinen KI-Assistenten bittest, während er mit dem Nutrition-MCP-Server verbunden ist, <strong>dein Konto zu löschen</strong>. Diese Aktion erfolgt sofort und ist unumkehrbar. Sie entfernt deine Mahlzeiten-, Wasser- und Gewichts-Einträge, Ziele, Profileinstellungen, ein noch gespeichertes Exportarchiv, deine Nutzungs-Telemetrie, deine Zugriffstoken sowie das Konto selbst. Das schließt jeden jemals erfassten Alkoholwert ein, unabhängig davon, ob die Alkohol-Erfassung aktiviert war.",
                ),
            ],
        },
        {
            heading: "Nutzungsbedingungen",
            blocks: [
                p(
                    'Die Nutzung des Dienstes unterliegt außerdem unseren <a href="/terms" data-legal-link="terms">Nutzungsbedingungen</a>, die die zulässige Nutzung, den Umstand, dass nichts hier medizinischer Rat ist, sowie den Ausschluss jeglicher Gewährleistung regeln — der Dienst wird wie besehen, kostenlos und ohne Garantien für Verfügbarkeit, Genauigkeit oder Eignung für einen bestimmten Zweck bereitgestellt.',
                ),
            ],
        },
    ],
};

const TERMS_DE: LegalDoc = {
    title: "Nutzungsbedingungen",
    metaDescription:
        "Die Bedingungen für die Nutzung von Nutrition MCP — dem kostenlosen, quelloffenen Ernährungs-Tracker und Remote-MCP-Server für Claude und ChatGPT. Verständliche Bedingungen zu Konten, zulässiger Nutzung, deinen Daten und Haftung.",
    ogDescription:
        "Die Bedingungen für die Nutzung von Nutrition MCP — dem kostenlosen, quelloffenen Ernährungs-Tracker und Remote-MCP-Server für Claude und ChatGPT.",
    lastUpdated: "26. Juli 2026",
    backToHome: "Zurück zur Startseite",
    sections: [
        {
            heading: "Vereinbarung",
            blocks: [
                p(
                    "Diese Bedingungen regeln deine Nutzung von Nutrition MCP (der &bdquo;Dienst&ldquo;) — der Website unter nutrition-mcp.com und dem Remote-MCP-Server unter <strong>https://nutrition-mcp.com/mcp</strong>. Mit der Erstellung eines Kontos oder der Verbindung eines KI-Assistenten mit dem Server stimmst du diesen Bedingungen zu. Bist du nicht einverstanden, nutze den Dienst bitte nicht.",
                ),
            ],
        },
        {
            heading: "Der Dienst",
            blocks: [
                p(
                    'Nutrition MCP ist ein kostenloser, quelloffener Ernährungs-Tracker, der als MCP-Server läuft und es KI-Assistenten wie Claude und ChatGPT ermöglicht, in deinem Namen Mahlzeiten, Wasser und Körpergewicht zu erfassen. Es gibt keine kostenpflichtige Stufe, keine Werbung und keine Gebühr für die Nutzung des Dienstes. Wir nehmen freiwillige Spenden auf Patreon an, um Hosting- und Datenbankkosten zu decken; sie sind ein Geschenk, kein Kauf, und erwerben keine Funktionen, keine Stufe und keinerlei Priorität. Der Quellcode ist unter der MIT-Lizenz auf <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> veröffentlicht, und du kannst ihn frei selbst hosten.',
                ),
            ],
        },
        {
            heading: "Dein Konto",
            blocks: [
                p(
                    "Du musst mindestens 16 Jahre alt sein, um den Dienst zu nutzen. Wir überprüfen das Alter nicht, daher bestätigst du diese Voraussetzung mit der Kontoerstellung. Du bist dafür verantwortlich, deine Anmeldedaten vertraulich zu behandeln, sowie für alle Aktivitäten unter deinem Konto. Bitte gib eine E-Mail-Adresse an, auf die du tatsächlich Zugriff hast — sie ist der einzige Weg, den Zugang wiederherzustellen.",
                ),
            ],
        },
        {
            heading: "Kein medizinischer Rat",
            blocks: [
                p(
                    "Nutrition MCP ist ein Werkzeug zur Erfassung und Auswertung, kein Gesundheitsdienst. Nichts, was es liefert — Kalorien- und Makronährstoffwerte, Ziele, Trends oder jeglicher von deinem KI-Assistenten hinzugefügte Kommentar — ist medizinischer, ernährungswissenschaftlicher oder diätetischer Rat, und nichts davon ersetzt eine qualifizierte Fachperson. Ziehe vor Entscheidungen zu deiner Gesundheit einen Arzt oder eine Ernährungsberatung hinzu, besonders bei einer medizinischen Erkrankung oder einer Vorgeschichte gestörten Essverhaltens.",
                ),
                p(
                    "Der Dienst ist nicht für den klinischen Einsatz konzipiert und sollte nicht ohne Einbindung der behandelnden Fachperson von Personen mit einer aktiven Essstörung, in der Schwangerschaft oder unter klinischer Betreuung wegen einer ernährungsbezogenen Erkrankung genutzt werden. Kalorien- und Makronährstoff-Tracking kann in solchen Situationen schädlich sein. Trifft das auf dich zu, sprich vor der Nutzung mit deiner behandelnden Fachperson.",
                ),
                p(
                    "Ernährungswerte sind <strong>Schätzungen</strong>. Sie stammen von KI-Modellen, die deine Beschreibungen und Fotos interpretieren, von Datenbanken Dritter wie Open Food Facts sowie von dem, was du selbst einträgst. Sie können falsch sein. Überprüfe alles, worauf es ankommt.",
                ),
                p(
                    "Essensfotos werden niemals an unseren Server gesendet. Dein KI-Assistent interpretiert das Bild auf seiner eigenen Seite und sendet uns nur den resultierenden Text und die Zahlen — eine Beschreibung, einen Mahlzeitentyp, Kalorien, Makronährstoffe, Notizen, einen Barcode.",
                ),
            ],
        },
        {
            heading: "Zulässige Nutzung",
            blocks: [
                p(
                    "Bei der Nutzung des Dienstes verpflichtest du dich, ihn nicht zu nutzen, um:",
                ),
                ul([
                    "ihn für einen rechtswidrigen Zweck oder unter Verstoß gegen geltendes Recht oder anwendbare Vorschriften zu nutzen;",
                    "zu versuchen, auf das Konto oder die Daten einer anderen Nutzerin oder eines anderen Nutzers zuzugreifen oder Authentifizierung, Ratenbegrenzungen oder andere technische Kontrollen zu umgehen;",
                    "den Dienst oder die Infrastruktur, auf der er läuft, zu untersuchen, zu scannen, zu überlasten oder zu stören, auch durch automatisierte Massenanfragen;",
                    "Inhalte hochzuladen, die rechtswidrig sind oder an denen du kein Weitergaberecht hast;",
                    "den gehosteten Dienst weiterzuverkaufen oder als deinen eigenen auszugeben;",
                    "ihn zu nutzen, um extreme Kalorienrestriktion zu verfolgen oder bei anderen dazu zu ermutigen, zu coachen oder sie dazu zu fördern.",
                ]),
                p(
                    "Der Dienst ist ratenbegrenzt, damit er für alle verfügbar bleibt. Benötigst du ein höheres Volumen, hoste ihn selbst — dafür ist die MIT-Lizenz da.",
                ),
            ],
        },
        {
            heading: "Deine Daten",
            blocks: [
                p(
                    'Deine Einträge bleiben deine. Wir speichern und verarbeiten sie, um den Dienst für dich zu betreiben, wie in unserer <a href="/privacy" data-legal-link="privacy">Datenschutzerklärung</a> beschrieben. Du bist für die Inhalte verantwortlich, die du einträgst.',
                ),
                p(
                    "Du kannst dein <strong>Mahlzeitenprotokoll</strong> jederzeit als CSV exportieren, indem du deinen KI-Assistenten bittest, deine Mahlzeiten zu exportieren. Der Export umfasst ausschließlich Mahlzeiten — eine Zeile pro Mahlzeit mit Uhrzeit, Zeitzone, Mahlzeitentyp, Beschreibung, Kalorien, Protein, Kohlenhydraten, Fett, Ballaststoffen, Zucker, Alkohol, Koffein und Notizen. Alkohol ist enthalten, unabhängig davon, ob die Alkohol-Erfassung für dein Konto aktiviert ist. Wasser, Gewicht, Ziele und Einstellungen sind im heutigen Export nicht enthalten. Der von uns zurückgegebene Download-Link ist privat und läuft nach 60 Minuten ab.",
                ),
                p(
                    "Außerdem erfassen wir grundlegende betriebliche Telemetrie zur Nutzung des Dienstes: für jeden Tool-Aufruf den Namen des Werkzeugs, ob er erfolgreich war, wie lange er dauerte, eine grobe Fehlerkategorie bei einem Fehlschlag, die Länge eines angefragten Datumsbereichs sowie die Sitzungs-ID. Diese Zeilen sind mit deiner Konto-ID verknüpft. Sie enthalten nicht, was du eingetragen hast — keine Lebensmittelbeschreibungen, keine Kalorien, keine Gewichte. Wir nutzen sie, um den Dienst am Laufen zu halten und zu erkennen, welche Werkzeuge eine Verbesserung wert sind; sie werden zusammen mit allem anderen gelöscht, wenn du dein Konto löschst.",
                ),
                p(
                    "Du kannst dein Konto und alle zugehörigen Daten jederzeit löschen, indem du deinen KI-Assistenten bittest, während er verbunden ist, <strong>dein Konto zu löschen</strong> — diese Aktion erfolgt sofort und ist unumkehrbar.",
                ),
            ],
        },
        {
            heading: "Verfügbarkeit und Änderungen",
            blocks: [
                p(
                    "Der Dienst wird kostenlos angeboten, ohne Verfügbarkeitszusage und ohne Service-Level-Agreement. Wir können jederzeit und ohne Vorankündigung jeden Teil davon ändern, aussetzen oder einstellen — einschließlich Werkzeugen, Funktionen und des gehosteten Servers selbst. Wir können außerdem Inhalte ändern oder entfernen, die gegen diese Bedingungen verstoßen.",
                ),
            ],
        },
        {
            heading: "Dienste Dritter",
            blocks: [
                p(
                    "Der Dienst ist von Dritten abhängig: Supabase für Datenbank, Authentifizierung und Export-Speicherung, DigitalOcean für das Hosting, Open Food Facts für Barcode-Daten sowie den jeweiligen KI-Assistenten, mit dem du dich verbindest.",
                ),
                p(
                    "Die Website selbst nutzt außerdem Google Analytics zur Traffic-Messung, Google Fonts und das jsDelivr-CDN zum Laden von Schriftarten und Icons, Google Sign-In, falls du dich auf diesem Weg anmeldest, sowie die GitHub-API zur Anzeige der Star-Anzahl des Projekts. Das Laden einer Seite löst daher Anfragen an diese Dienste aus, die deine IP-Adresse und deinen Browser sehen können.",
                ),
                p(
                    "Deren Bedingungen und Verfügbarkeit liegen in deren eigener Verantwortung, nicht in unserer.",
                ),
            ],
        },
        {
            heading: "Keine Gewährleistung",
            blocks: [
                p(
                    "Der Dienst wird <strong>&bdquo;wie besehen&ldquo; und &bdquo;wie verfügbar&ldquo;</strong> bereitgestellt, ohne jegliche Gewährleistung, ausdrücklich oder stillschweigend, einschließlich stillschweigender Gewährleistungen der Marktgängigkeit, Eignung für einen bestimmten Zweck, Genauigkeit oder Nichtverletzung von Rechten Dritter. Wir gewährleisten nicht, dass der Dienst unterbrechungsfrei, sicher, fehlerfrei ist oder dass Daten oder Ernährungswerte, die er liefert, korrekt sind. Die Nutzung erfolgt auf eigenes Risiko.",
                ),
            ],
        },
        {
            heading: "Haftungsbeschränkung",
            blocks: [
                p(
                    "Soweit gesetzlich zulässig, haften wir nicht für indirekte, zufällige, besondere, Folge- oder exemplarische Schäden noch für Daten- oder Gewinnverluste, die aus oder im Zusammenhang mit deiner Nutzung des Dienstes entstehen.",
                ),
            ],
        },
        {
            heading: "Deine gesetzlichen Rechte",
            blocks: [
                p(
                    "Manche Haftung kann niemals ausgeschlossen werden, und das versuchen wir auch nicht. Wir haften uneingeschränkt für Tod oder Personenschäden, die durch unsere Fahrlässigkeit verursacht wurden, sowie für Betrug oder arglistige Täuschung.",
                ),
                p(
                    "Außerdem behältst du jedes Recht, das dir das Gesetz als Verbraucherin oder Verbraucher einräumt. Diese Bedingungen bestehen neben diesen Rechten und schmälern sie nicht. Widerspricht ein Abschnitt oben einem Recht, auf das du nicht verzichten kannst, gilt dein gesetzliches Recht.",
                ),
            ],
        },
        {
            heading: "Beendigung",
            blocks: [
                p(
                    "Du kannst die Nutzung des Dienstes jederzeit beenden und dein Konto wie oben beschrieben löschen. Wir können den Zugang aussetzen oder beenden, wenn er gegen diese Bedingungen verstößt oder die Stabilität oder Sicherheit des Dienstes gefährdet. Die Abschnitte &bdquo;Keine Gewährleistung&ldquo;, &bdquo;Haftungsbeschränkung&ldquo; und &bdquo;Deine gesetzlichen Rechte&ldquo; gelten über die Beendigung hinaus fort.",
                ),
            ],
        },
        {
            heading: "Änderungen dieser Bedingungen",
            blocks: [
                p(
                    "Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Die jeweils aktuelle Fassung befindet sich stets auf dieser Seite, mit dem Datum oben, das die letzte Änderung anzeigt. Die weitere Nutzung des Dienstes nach einer Aktualisierung bedeutet, dass du die überarbeiteten Bedingungen akzeptierst.",
                ),
            ],
        },
        {
            heading: "Salvatorische Klausel",
            blocks: [
                p(
                    "Sollte sich ein Teil dieser Bedingungen als nicht durchsetzbar erweisen, entfällt dieser Teil, während der Rest in Kraft bleibt.",
                ),
            ],
        },
        {
            heading: "Kontakt",
            blocks: [
                p(
                    'Fragen zu diesen Bedingungen? Schreib eine E-Mail an <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
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
};

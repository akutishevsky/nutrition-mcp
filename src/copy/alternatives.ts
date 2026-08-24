// Translatable prose for the /alternatives comparison pages, extracted out
// of scripts/gen-alternatives.ts's APPS array (which keeps only the
// structural, non-translatable fields: name, slug, file, icon). See
// src/copy/legal.ts for the same shape of extraction and the reasoning
// behind `Partial<Record<SiteLocale, ...>>` — only 'en' is populated here;
// other locales land one at a time and scripts/gen-alternatives.ts's
// copyFor() falls back to English until they do.
//
// Every string below is copied verbatim from the previously hand-authored
// APPS array — see scripts/gen-alternatives.ts's App type doc comments for
// what each field means and the accuracy rules (e.g. Yazio/Lifesum aren't
// recognised-by-name imports, Cronometer's caffeine column, etc.) that
// still apply to this content wherever it now lives.

import type { SiteLocale } from "../routes.js";
import { ALTERNATIVES_DE } from "./alternatives.de.js";
import { ALTERNATIVES_ES } from "./alternatives.es.js";
import { ALTERNATIVES_FR } from "./alternatives.fr.js";
import { ALTERNATIVES_NL } from "./alternatives.nl.js";
import { ALTERNATIVES_PL } from "./alternatives.pl.js";
import { ALTERNATIVES_IT } from "./alternatives.it.js";
import { ALTERNATIVES_UK } from "./alternatives.uk.js";
import { ALTERNATIVES_JA, ALT_PAGE_META_JA } from "./alternatives.ja.js";

/** One /alternatives comparison page's slug (a PAGE_ROUTES / ALT_PAGES key
 * minus the leading slash), matching APPS[].slug in scripts/gen-alternatives.ts. */
export type AppSlug =
    | "myfitnesspal-mcp"
    | "cronometer-mcp"
    | "lose-it-mcp"
    | "macrofactor-mcp"
    | "yazio-mcp"
    | "lifesum-mcp";

export interface AppCopy {
    /** One-line blurb on the /alternatives hub card. */
    hubBlurb: string;
    /** The four honest "cons" bullets for the comparison table (left column). */
    cons: string[];
    /** Gracious closing note under the comparison — acknowledges the app's strength. */
    note: string;
    /** Genuinely per-app prose (title + paragraphs) for the "Moving from X" section. */
    migrate: { title: string; body: string[] };
    /** Per-app prose for the "Bring your history with you" section. */
    importSection: { title: string; body: string[] };
    /** Answer to the shared "Can I import my X data?" FAQ (see faqsFor). */
    importFaq: string;
    /** Two app-specific FAQ entries interleaved into the shared FAQ set. */
    extraFaqs: { q: string; a: string }[];
    /** Optional override for the "Is Nutrition MCP free?" FAQ answer. */
    freeAnswer?: string;
}

/**
 * <title>/description/og:description templates for the per-app comparison
 * pages and the /alternatives hub — the one piece of this generator's
 * output that shipped English-only for a while even after AppCopy above
 * was translated into every locale (caught by src/alt-pages.test.ts once
 * real /{locale}/alternatives pages existed to check: a translated
 * comparison page still had an English <title>). appTitle/appDesc/
 * appOgDesc take a "{app}" placeholder for the untranslated brand name
 * (e.g. "MyFitnessPal" — app names are never translated); the hub strings
 * are fixed, no placeholder.
 */
export interface AltPageMeta {
    appTitle: string;
    appDesc: string;
    appOgDesc: string;
    hubTitle: string;
    hubDesc: string;
    hubOgDesc: string;
}

export const ALT_PAGE_META: Partial<Record<SiteLocale, AltPageMeta>> = {
    en: {
        appTitle: "{app} MCP Server? Track Nutrition in Claude & ChatGPT",
        appDesc:
            "No MCP server for {app}? Nutrition MCP logs meals and macros inside Claude or ChatGPT — free, open source, and it imports your CSV export.",
        appOgDesc:
            "{app} has no MCP server. Nutrition MCP is a free, open-source alternative that logs meals, macros, and weight in Claude or ChatGPT — and imports your {app} history from a CSV export.",
        hubTitle:
            "Nutrition App MCP Alternatives — Track Food in Claude & ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer, and Lose It! have no MCP server. Nutrition MCP is the free, open-source alternative for Claude and ChatGPT — and imports your history.",
        hubOgDesc:
            "Your nutrition app doesn't have an MCP server. Nutrition MCP is a free, open-source alternative that works inside Claude or ChatGPT — and imports your history from a CSV export.",
    },
    de: {
        appTitle: "{app} MCP-Server? Ernährung in Claude & ChatGPT verfolgen",
        appDesc:
            "Kein MCP-Server für {app}? Nutrition MCP protokolliert Mahlzeiten und Makros in Claude oder ChatGPT — kostenlos, quelloffen, und importiert deinen CSV-Export.",
        appOgDesc:
            "{app} hat keinen MCP-Server. Nutrition MCP ist eine kostenlose, quelloffene Alternative, die Mahlzeiten, Makros und Gewicht in Claude oder ChatGPT protokolliert — und importiert deinen {app}-Verlauf aus einem CSV-Export.",
        hubTitle:
            "Nutrition App MCP-Alternativen — Ernährung in Claude & ChatGPT verfolgen",
        hubDesc:
            "MyFitnessPal, Cronometer und Lose It! haben keinen MCP-Server. Nutrition MCP ist die kostenlose, quelloffene Alternative für Claude und ChatGPT — und importiert deinen Verlauf.",
        hubOgDesc:
            "Deine Ernährungs-App hat keinen MCP-Server? Nutrition MCP ist eine kostenlose, quelloffene Alternative, die in Claude oder ChatGPT läuft — und importiert deinen Verlauf aus einem CSV-Export.",
    },
    es: {
        appTitle:
            "¿Servidor MCP para {app}? Controla tu nutrición en Claude y ChatGPT",
        appDesc:
            "¿{app} no tiene servidor MCP? Nutrition MCP registra comidas y macros dentro de Claude o ChatGPT — gratuito, de código abierto, e importa tu exportación CSV.",
        appOgDesc:
            "{app} no tiene servidor MCP. Nutrition MCP es una alternativa gratuita y de código abierto que registra comidas, macros y peso en Claude o ChatGPT — e importa tu historial de {app} desde una exportación CSV.",
        hubTitle:
            "Alternativas MCP a apps de nutrición — Controla tu comida en Claude y ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer y Lose It! no tienen servidor MCP. Nutrition MCP es la alternativa gratuita y de código abierto para Claude y ChatGPT — e importa tu historial.",
        hubOgDesc:
            "Tu app de nutrición no tiene servidor MCP. Nutrition MCP es una alternativa gratuita y de código abierto que funciona dentro de Claude o ChatGPT — e importa tu historial desde una exportación CSV.",
    },
    fr: {
        appTitle:
            "Serveur MCP pour {app} ? Suis ta nutrition dans Claude et ChatGPT",
        appDesc:
            "Pas de serveur MCP pour {app} ? Nutrition MCP enregistre les repas et les macros dans Claude ou ChatGPT — gratuit, open source, et importe ton export CSV.",
        appOgDesc:
            "{app} n'a pas de serveur MCP. Nutrition MCP est une alternative gratuite et open source qui enregistre repas, macros et poids dans Claude ou ChatGPT — et importe ton historique {app} depuis un export CSV.",
        hubTitle:
            "Alternatives MCP aux apps de nutrition — Suis ton alimentation dans Claude et ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer et Lose It! n'ont pas de serveur MCP. Nutrition MCP est l'alternative gratuite et open source pour Claude et ChatGPT — et importe ton historique.",
        hubOgDesc:
            "Ton app de nutrition n'a pas de serveur MCP ? Nutrition MCP est une alternative gratuite et open source qui fonctionne dans Claude ou ChatGPT — et importe ton historique depuis un export CSV.",
    },
    nl: {
        appTitle:
            "MCP-server voor {app}? Houd je voeding bij in Claude en ChatGPT",
        appDesc:
            "Geen MCP-server voor {app}? Nutrition MCP logt maaltijden en macro's in Claude of ChatGPT — gratis, open source, en importeert je CSV-export.",
        appOgDesc:
            "{app} heeft geen MCP-server. Nutrition MCP is een gratis, open source alternatief dat maaltijden, macro's en gewicht logt in Claude of ChatGPT — en importeert je {app}-geschiedenis vanuit een CSV-export.",
        hubTitle:
            "MCP-alternatieven voor voedingsapps — Houd je voeding bij in Claude en ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer en Lose It! hebben geen MCP-server. Nutrition MCP is het gratis, open source alternatief voor Claude en ChatGPT — en importeert je geschiedenis.",
        hubOgDesc:
            "Jouw voedingsapp heeft geen MCP-server? Nutrition MCP is een gratis, open source alternatief dat werkt binnen Claude of ChatGPT — en importeert je geschiedenis vanuit een CSV-export.",
    },
    pl: {
        appTitle: "Serwer MCP dla {app}? Śledź odżywianie w Claude i ChatGPT",
        appDesc:
            "Brak serwera MCP dla {app}? Nutrition MCP zapisuje posiłki i makroskładniki w Claude lub ChatGPT — za darmo, open source, i importuje Twój eksport CSV.",
        appOgDesc:
            "{app} nie ma serwera MCP. Nutrition MCP to darmowa alternatywa open source, która zapisuje posiłki, makroskładniki i wagę w Claude lub ChatGPT — i importuje Twoją historię z {app} z eksportu CSV.",
        hubTitle:
            "Alternatywy MCP dla aplikacji żywieniowych — Śledź jedzenie w Claude i ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer i Lose It! nie mają serwera MCP. Nutrition MCP to darmowa alternatywa open source dla Claude i ChatGPT — i importuje Twoją historię.",
        hubOgDesc:
            "Twoja aplikacja żywieniowa nie ma serwera MCP? Nutrition MCP to darmowa alternatywa open source, działająca w Claude lub ChatGPT — i importuje Twoją historię z eksportu CSV.",
    },
    it: {
        appTitle:
            "Server MCP per {app}? Monitora la tua alimentazione in Claude e ChatGPT",
        appDesc:
            "Nessun server MCP per {app}? Nutrition MCP registra pasti e macro in Claude o ChatGPT — gratuito, open source, e importa il tuo export CSV.",
        appOgDesc:
            "{app} non ha un server MCP. Nutrition MCP è un'alternativa gratuita e open source che registra pasti, macro e peso in Claude o ChatGPT — e importa la tua cronologia {app} da un export CSV.",
        hubTitle:
            "Alternative MCP alle app di nutrizione — Monitora il cibo in Claude e ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer e Lose It! non hanno un server MCP. Nutrition MCP è l'alternativa gratuita e open source per Claude e ChatGPT — e importa la tua cronologia.",
        hubOgDesc:
            "La tua app di nutrizione non ha un server MCP? Nutrition MCP è un'alternativa gratuita e open source che funziona in Claude o ChatGPT — e importa la tua cronologia da un export CSV.",
    },
    uk: {
        appTitle:
            "MCP-сервер для {app}? Відстежуй харчування в Claude та ChatGPT",
        appDesc:
            "Немає MCP-сервера для {app}? Nutrition MCP записує прийоми їжі та макронутрієнти прямо в Claude чи ChatGPT — безкоштовно, з відкритим кодом, і імпортує твій CSV-експорт.",
        appOgDesc:
            "{app} не має MCP-сервера. Nutrition MCP — безкоштовна альтернатива з відкритим кодом, яка записує прийоми їжі, макронутрієнти та вагу в Claude чи ChatGPT — і імпортує твою історію з {app} із CSV-експорту.",
        hubTitle:
            "MCP-альтернативи додаткам для харчування — Відстежуй їжу в Claude та ChatGPT",
        hubDesc:
            "MyFitnessPal, Cronometer і Lose It! не мають MCP-сервера. Nutrition MCP — безкоштовна альтернатива з відкритим кодом для Claude та ChatGPT — і імпортує твою історію.",
        hubOgDesc:
            "Твій додаток для харчування не має MCP-сервера? Nutrition MCP — безкоштовна альтернатива з відкритим кодом, яка працює в Claude чи ChatGPT — і імпортує твою історію з CSV-експорту.",
    },
    ja: ALT_PAGE_META_JA,
};

export const ALTERNATIVES_COPY: Partial<
    Record<SiteLocale, Record<AppSlug, AppCopy>>
> = {
    en: {
        "myfitnesspal-mcp": {
            hubBlurb:
                "No MCP server, and some features need a paid plan. See the free, conversational alternative.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "Search a database and pick the right entry for every item",
                "Some features, like the barcode scanner, need a paid plan",
                "A separate app and account, with ads on the free tier",
            ],
            note: "MyFitnessPal is a capable app with a huge food database. This isn't a knock on it — it's simply a different approach for people who'd rather talk to their AI than tap through a tracker.",
            migrate: {
                title: "Leaving the database behind",
                body: [
                    "MyFitnessPal built its following on one of the largest food databases anywhere — tens of millions of crowd-sourced entries. That scale is also its friction: for any given food you scroll past near-duplicates and have to guess which entry is accurate. Conversational logging skips the lookup entirely — you describe the food and your AI estimates the macros.",
                    "You don't have to leave the diary behind to do it: a MyFitnessPal CSV export imports directly, quirks and all, so the years you've already logged come with you. Everything you record from then on is yours to export as CSV whenever you want.",
                    "The features MyFitnessPal gradually moved behind Premium — barcode scanning, macros by gram, no ads — are simply included here. You're not weighing a free tier against a $20-a-month upgrade; there's one free, open-source tier, and the only account you need is the Claude or ChatGPT one you already have.",
                ],
            },
            importSection: {
                title: "Bring the diary with you",
                body: [
                    "Years of logged history is the real reason people stay, and you don't have to abandon it. Ask to import and an importer panel opens in the chat: you choose the CSV MyFitnessPal exports, it's parsed in your browser, the columns it recognises are matched for you, and you see what will be added before anything is written. That match covers calories, protein, carbs, and fat, plus fiber, total sugar, and caffeine in milligrams where your export carries those columns. The rows never pass through the AI, so there's nothing for it to mistype.",
                    "A MyFitnessPal export is handled by name, quirks included. The file arrives with a byte-order mark that would otherwise corrupt the first column heading; its notes can contain line breaks inside a quoted cell, which naive line-splitting would shred along with every row after it; and each day's block ends with a totals row that must not become a meal. The one that matters most: MyFitnessPal exports one aggregated row per meal per day and no food-name column at all, so rather than rejecting those rows for having no description, the importer recognises the shape and labels them by their slot — they arrive as “Breakfast (imported from MyFitnessPal)”.",
                    "Dates are confirmed, not assumed. A column of 05/06/2024 is genuinely undecidable — May or June — so the importer shows you its reading next to a real row from your own file and lets you correct it before writing. And every row carries a content fingerprint, so re-running the same file reports those meals as already logged instead of duplicating them. Import a partial export, spot a column you mapped wrongly, and simply do it again.",
                ],
            },
            importFaq:
                "Yes. Ask to import your history and an importer opens in the chat: you pick the CSV MyFitnessPal exports, it's parsed in your browser rather than read by the AI, you map or confirm the columns, preview what will be added, and confirm. Calories, protein, carbs, and fat come across, and so do fiber, total sugar, and caffeine when your export includes them. MyFitnessPal's export is recognised by name — including its byte-order mark, its trailing totals rows, and the fact that it writes one aggregated row per meal per day with no food name, which get labelled by meal slot. Re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Can Nutrition MCP scan barcodes like MyFitnessPal Premium?",
                    a: "Yes, and it's free. Send a product's barcode and Nutrition MCP pulls the label macros from Open Food Facts — whereas MyFitnessPal moved its barcode scanner behind a paid Premium subscription.",
                },
                {
                    q: "How does logging work without MyFitnessPal's food database?",
                    a: "You describe what you ate in plain language — “a chicken burrito bowl with extra rice” — and your AI estimates the calories and macros. There's no database of millions of crowd-sourced entries to search through and no guessing which one is accurate.",
                },
            ],
        },
        "cronometer-mcp": {
            hubBlurb:
                "No MCP server. See the free, conversational way to track calories and macros inside your AI.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "Log by searching its database, entry by entry",
                "Some features require a paid Gold plan",
                "A separate app to open every time you eat",
            ],
            note: "Cronometer is excellent if you want deep micronutrient precision. Nutrition MCP takes a lighter, conversational approach to calories, macros, and weight — right inside your AI.",
            migrate: {
                title: "When accuracy is the whole point",
                body: [
                    "Cronometer earned its reputation on precision — curated databases and tracking for 80+ micronutrients, vitamins and minerals included. If that micronutrient depth is why you open it, be honest with yourself: conversational estimates won't match a lab-grade database entry gram for gram.",
                    "But most people log to keep calories and macros in range, not to audit their selenium intake. That range is wider than it sounds: alongside protein, carbs, and fat you get fiber, total sugar, and caffeine in milligrams, and optional alcohol in grams of ethanol if you switch it on. For that, describing a meal to your AI is far less work than searching for and weighing every component — and you still get daily totals, trends, and a target weight to track against, for free.",
                    "There's also a middle path: because you're inside an AI assistant, you can ask for the micronutrient angle when you actually want it — “roughly how much iron and B12 was in today's meals?” — and get a reasoned estimate on demand, without the overhead of logging every gram to a curated entry the rest of the time.",
                ],
            },
            importSection: {
                title: "Ten years of entries, kept",
                body: [
                    "Precision is why you used Cronometer, so a sloppy import would be worse than none. Ask to import and a panel opens in the chat: you pick your Cronometer CSV, it's parsed in your browser, and you approve a preview before a single row is written. The numbers are read straight out of the file — the AI never sees the rows, so it can't round or retype one.",
                    "Cronometer's export shape is recognised by name. It splits the timestamp across separate date and time columns, and both are read, so a breakfast logged at 07:12 keeps its time instead of landing at a default midday. It writes a quantity with the unit inside the same cell — “58.00 g”, “1.00 cup” — and a value written that way still reads as the number it is rather than as nothing. And it repeats the “Amount” heading more than once, so columns are keyed by position rather than by name: the duplicates can't silently collide, and the mapper tells you which one you're pointing at.",
                    "Be clear about what crosses over: the date and time, food name, meal, calories, protein, carbs, fat, fiber, total sugar, caffeine, and notes. Cronometer is the one export in this list that ships a Caffeine (mg) column, and it lands as milligrams — the unit it is already in, and the one caffeine is stored in here, so nothing is converted. A caffeine column headed in grams is left unmapped instead, with the reason shown, rather than recording 0.18 where the label says 180 mg. Sugar means total sugars, the fruit and milk included — not added sugar, which no export reliably carries. Cronometer's separate “Sugar Alcohols” column is a polyol rather than a sugar or an ethanol, and it can't land in either field. Alcohol is a special case: Cronometer exports it as ethyl alcohol in grams, and it comes across only if you've turned alcohol tracking on here first, since it's off until you do. Portion amounts and Cronometer's 80-plus vitamins and minerals don't cross over at all — that micronutrient depth stays in Cronometer's own export. Re-importing is harmless: each row carries a content fingerprint, so a second run of the same file reports the meals as already logged rather than adding them twice.",
                ],
            },
            importFaq:
                "Yes. Ask to import and an importer opens in the chat: you choose your Cronometer CSV, it's parsed in your browser rather than read by the AI, and you preview what will be added before confirming. Cronometer's export is recognised by name — its separate date and time columns are both read, and its repeated “Amount” heading can't collide because columns are keyed by position. The date and time, food name, meal, calories, protein, carbs, fat, fiber, total sugar, caffeine in milligrams, and notes come across; alcohol does too, but only if you've switched alcohol tracking on first. Vitamins, minerals, and portion amounts don't. Re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Does Nutrition MCP track micronutrients like Cronometer?",
                    a: "No. Cronometer's tracking of 80+ vitamins and minerals is its specialty, and Nutrition MCP has no micronutrient data at all — no sodium, no vitamins. What it does track is calories, protein, carbs, fat, fiber, total sugar, caffeine in milligrams, optional alcohol, water, and weight. You can still ask your AI for a rough micronutrient read on a meal, but if lab-grade micronutrient depth is essential, Cronometer is the better fit.",
                },
                {
                    q: "Is Nutrition MCP as accurate as Cronometer?",
                    a: "For calories, macros, fiber, and sugar, conversational estimates are close enough for most goals — but they won't match Cronometer's curated, gram-for-gram database. It trades a little precision for far less logging effort, which is the right trade for most people.",
                },
            ],
        },
        "lose-it-mcp": {
            hubBlurb:
                "No MCP server. Log meals by talking to Claude or ChatGPT instead — free.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "Search and log each item by hand",
                "Some features, like photo logging, need a paid plan",
                "Another app, another account, ads on the free tier",
            ],
            note: "Lose It! is a friendly calorie counter. Nutrition MCP does the same core logging by conversation, free, without ever leaving Claude or ChatGPT.",
            migrate: {
                title: "The same simplicity, minus the app",
                body: [
                    "Lose It! won people over by keeping calorie counting light and a little gamified, with its Snap It photo logging as the headline trick. Nutrition MCP does the photo trick too — send a picture of your plate and your AI reads it — except it lives inside the assistant you already chat with, so there's no separate app to open.",
                    "If what you liked about Lose It! was low-friction logging and quick daily feedback, you'll feel at home: say what you ate, get your remaining calories and macros back, and move on. No ads, no upsell, and no account to juggle.",
                    "The one thing you give up is the streaks-and-badges layer Lose It! uses to keep you coming back. If that gamification is what motivates you, that's a fair reason to stay. If it always felt like noise on top of the actual logging, you won't miss it — the daily number is right there in the chat whenever you ask.",
                ],
            },
            importSection: {
                title: "Your logged days come too",
                body: [
                    "Switching doesn't mean starting from zero. Ask to import and an importer opens in the chat: you pick the CSV Lose It! exports, it's parsed in your browser, the columns it recognises map themselves — the date, food, meal, calories, protein, carbs, and fat, plus fiber, total sugar, and caffeine where your export carries them — and you confirm a preview of what will be added. It's a file picker and a preview, not a dictation exercise — on that path the AI never reads or retypes your rows.",
                    "Two Lose It! specifics are handled deliberately. Its export carries a deleted flag, and rows marked deleted are skipped rather than imported: bringing them back would resurrect food you removed on purpose, and no total on the preview would reveal it. It also writes the literal string “n/a” for cells with no value, which is read as empty rather than as a zero — so a macro you never tracked stays absent instead of being recorded as a real 0 g and dragging your averages down.",
                    "Run it as often as you like. Each row carries a content fingerprint, so a repeat import of the same file reports the meals as already logged and adds nothing. And if the dates in your export could be read two ways — 05/06 being May or June — the importer shows its reading against a row from your own file and asks you to confirm it before writing.",
                ],
            },
            importFaq:
                "Yes. Ask to import and an importer opens in the chat: you pick the CSV Lose It! exports, it's parsed in your browser rather than read by the AI, and you confirm a preview before anything is written. The date, food, meal, calories, protein, carbs, and fat map themselves, and fiber, total sugar, and caffeine do too when your export carries them. Lose It!'s export is recognised by name — rows flagged as deleted are skipped instead of resurrected, and its “n/a” cells are read as empty rather than as zeros. Re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Does Nutrition MCP have photo logging like Lose It!'s Snap It?",
                    a: "Yes — send a photo of your plate and your AI identifies the food and estimates the macros, then logs it after you confirm. In Lose It! photo logging sits behind a paid plan; with Nutrition MCP it's free and works right in the chat.",
                },
                {
                    q: "Can I count calories the same way I did in Lose It!?",
                    a: "Yes. The core loop is identical — say what you ate and get your remaining calories and macros back instantly. The difference is you talk to your AI instead of tapping through an app, and there are no ads or upsells on the way.",
                },
            ],
        },
        "macrofactor-mcp": {
            hubBlurb:
                "Subscription-only and no MCP server. See the free alternative that lives in your AI.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "A paid subscription after the free trial (no free tier)",
                "You still open a separate app to log every meal",
                "Its adaptive coaching is the product, not effortless logging",
            ],
            note: "MacroFactor's adaptive TDEE coaching is genuinely good. If you mainly want fast, free macro logging inside your AI, Nutrition MCP is a simpler, no-cost fit.",
            migrate: {
                title: "Coaching versus logging",
                body: [
                    "MacroFactor's pitch is its algorithm: it watches your logged intake and weight and quietly recalculates your calorie and macro targets each week — genuinely clever, adaptive coaching from the Stronger By Science team. That coaching is the product, which is why it's subscription-only.",
                    "Nutrition MCP doesn't run a coaching algorithm — but because you're already inside an AI assistant, you can just ask. “Given my last three weeks, should I adjust my calories?” gets you a reasoned answer on demand. It's a different model: analysis when you want it, conversationally, instead of a fixed weekly recalculation — and it's free.",
                    "The honest trade-off is discipline versus flexibility. MacroFactor's weekly recalculation happens whether or not you think to ask, which keeps you honest; the conversational model only adjusts when you prompt it. If you want a hands-off algorithm steering your numbers, MacroFactor is worth the subscription. If you'd rather log for free and pull analysis when you care, this fits better.",
                ],
            },
            importSection: {
                title: "The log moves even if the coaching doesn't",
                body: [
                    "What you'd be leaving is the algorithm, not the data. Ask to import and an importer panel opens in the chat: you choose your MacroFactor CSV export, it's parsed in your browser, the columns it recognises are mapped for you, and you confirm a preview before anything is written. The rows never pass through the AI, so nothing gets mistranscribed on the way in.",
                    "MacroFactor's export is recognised by name — its serving-size column is the giveaway — and its date, food, meal, calorie, and macro columns map themselves, fiber, total sugar, and caffeine included where the file carries them. If your export reports energy in kilojoules rather than kilocalories, that's converted rather than stored 4.184x too high. Because a column simply headed “Calories” can hold either unit, the unit is offered as a control next to a worked example from your own first row, so you confirm it instead of trusting a guess that would silently inflate every day.",
                    "That history is immediately useful rather than just archived. Once weeks of intake and weight are in, you can ask the question MacroFactor's algorithm answered on a schedule — “given the last three weeks, should I adjust my calories?” — and get a reasoned answer on demand. A second import of the same file changes nothing, since each row carries a content fingerprint and repeats come back reported as already logged.",
                ],
            },
            importFaq:
                "Yes. Ask to import and an importer opens in the chat: you pick your MacroFactor CSV export, it's parsed in your browser rather than read by the AI, and you confirm a preview before anything is written. MacroFactor's export is recognised by name — the date, food, meal, calories, protein, carbs, and fat map themselves, along with fiber, total sugar, and caffeine when the file has them — and if it reports energy in kilojoules that's converted to kilocalories once you confirm the unit next to an example from your own file. Re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Does Nutrition MCP adjust my calorie targets like MacroFactor?",
                    a: "Not automatically. MacroFactor's weekly, algorithmic recalculation is its paid core feature. With Nutrition MCP you ask — “based on my last three weeks of intake and weight, should I adjust my calories?” — and your AI reasons through it on demand, rather than a fixed weekly update.",
                },
                {
                    q: "Is Nutrition MCP really free when MacroFactor is subscription-only?",
                    a: "Yes. Nutrition MCP is completely free and open source, with no trial-then-pay and no free-tier limits — unlike MacroFactor, which has no free tier and requires a subscription after its trial. You only need a Claude or ChatGPT account.",
                },
            ],
            freeAnswer:
                "Yes. Nutrition MCP is completely free and open source, with no subscription — whereas MacroFactor requires a paid subscription after its free trial. You just need a Claude or ChatGPT account to connect.",
        },
        "yazio-mcp": {
            hubBlurb:
                "No MCP server. Track meals and macros by conversation — free and open source.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "Search the database for each food you log",
                "Some features, like meal plans, need a paid PRO plan",
                "A separate app and account to manage",
            ],
            note: "Yazio is a polished tracker with good meal plans. Nutrition MCP focuses on effortless conversational logging that lives inside Claude or ChatGPT — free and open source.",
            migrate: {
                title: "Plans on one side, logging on the other",
                body: [
                    "Yazio pairs tracking with structured meal plans, recipes, and fasting tools, polished for a European audience. If a guided plan is what keeps you on track, Yazio does that well and Nutrition MCP doesn't try to — it isn't a meal-plan app.",
                    "What it does do is make the logging half effortless. Instead of searching Yazio's database for each ingredient, you describe the dish and your AI handles the macros — then answers “how am I doing today?” in the same breath. Pair it with whatever eating plan you already follow.",
                    "This actually makes the two complementary rather than competing. Keep following a Yazio plan, or any plan, for the “what to eat” side; use Nutrition MCP for the “did I stay on track” side, logged by conversation and free. The one place it won't help is fasting timers — that's Yazio's territory, not a nutrition log's.",
                ],
            },
            importSection: {
                title: "Bring the log, map the columns",
                body: [
                    "Your Yazio history can come across, though you'll do a little of the work. Ask to import and an importer panel opens in the chat: you pick your CSV export, it's parsed in your browser, and you point its columns at date, food, meal, calories, protein, carbs, fat, fiber, total sugar, and caffeine yourself. Four apps' exports — MyFitnessPal, Cronometer, Lose It!, and MacroFactor — are recognised by their column names; Yazio isn't one of them, so expect to set that mapping once. Everything after it is the same: a preview of what will be added, then your confirmation.",
                    "The European quirks that defeat most importers are handled. A semicolon-delimited file whose numbers use comma decimals — the shape Excel produces in a German or Austrian locale — is read correctly, instead of the delimiter being mistaken for a decimal point or every macro being scaled by a thousand. The headings the mapper knows aren't English-only either: a German export's Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker and Koffein are all recognised, and fiber, sugar and caffeine are matched in Spanish, French, Italian and Dutch as well — fibra, sucres, zuccheri, suikers, cafeína, caffeina — so a localised file often arrives part-mapped, leaving you fewer columns to set by hand. Quoted fields, line breaks inside a cell, blank-ish values, and stray totals rows are handled too, and the AI never reads the file, so no number can be mistyped in transit.",
                    "Dates and energy are confirmed rather than guessed. A DD/MM/YYYY column is read day-first, and where the values genuinely can't settle it — 05/06 being either May or June — the importer shows its reading beside a row from your own file so you can correct it. If the energy column is in kilojoules it's converted to kilocalories, with the unit shown as a control next to a worked example. Re-importing the same file adds nothing: each row carries a content fingerprint, so repeats come back as already logged.",
                ],
            },
            importFaq:
                "Yes, using manual column mapping. Ask to import and an importer opens in the chat: you pick your Yazio CSV export, it's parsed in your browser rather than read by the AI, and you point its columns at date, food, meal, calories, and macros — fiber, total sugar and caffeine among them — yourself. Yazio isn't one of the four exports recognised by column name, so that mapping is a one-time manual step, though headings the mapper already knows (in German, and for fiber, sugar and caffeine in Spanish, French, Italian and Dutch too) fill themselves in. Semicolon-delimited European files with comma decimals, DD/MM/YYYY dates, and kilojoules are all handled, and re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Does Nutrition MCP include meal plans like Yazio PRO?",
                    a: "No. Yazio's structured meal plans, recipes, and fasting tools are its strength, and Nutrition MCP doesn't try to replace them — it handles the logging half. Many people keep following their Yazio (or any) plan and simply log against it here for free.",
                },
                {
                    q: "Can I log meals faster than searching Yazio's database?",
                    a: "Usually, yes. Rather than searching Yazio's database for each ingredient and setting portions, you describe the finished dish once — “a bowl of muesli with yogurt and berries” — and your AI estimates and logs the macros in a single step.",
                },
            ],
        },
        "lifesum-mcp": {
            hubBlurb:
                "No MCP server. A leaner, free way to log food inside Claude or ChatGPT.",
            cons: [
                "No MCP server — can't run inside Claude or ChatGPT",
                "Log foods by searching its database one by one",
                "Some features, like diet plans, need a paid plan",
                "Yet another app and subscription to manage",
            ],
            note: "Lifesum pairs tracking with structured diet plans. Nutrition MCP is a leaner, free way to log calories, macros, and weight by talking to your AI.",
            migrate: {
                title: "Ratings you can just ask about",
                body: [
                    "Lifesum leans on structure and feedback — diet plans, recipes, and its food-rating system that scores what you eat. Nutrition MCP doesn't grade your foods with a badge, so if that scoring loop is what motivates you, Lifesum has an edge there.",
                    "The trade is flexibility: rather than a fixed rating, you can ask your AI “is this a good choice for my goals?” and get a real answer in context. Logging is a single sentence, trends and a target weight come built in, and there's no premium tier gating the useful parts.",
                    "A badge tells you a food scored 3 out of 5; a conversation tells you why, and what to do about it — “swap half the rice for greens and this fits your day.” It's the difference between a score and a coach, and because Lifesum puts diet plans and some tracking behind Premium, it's the free option of the two.",
                ],
            },
            importSection: {
                title: "Nothing to retype",
                body: [
                    "Moving trackers means moving your history, and you don't have to retype a line of it. Ask to import and an importer panel opens in the chat: you pick your Lifesum CSV export, it's parsed in your browser, and you point its columns at date, food, meal, calories, protein, carbs, fat, fiber, total sugar, and caffeine. Lifesum's headings aren't recognised by name the way MyFitnessPal's, Cronometer's, Lose It!'s, and MacroFactor's are, so that mapping is a one-time manual step — after it you preview what will be added and confirm.",
                    "Nothing hides behind an assumption. The mapper shows you your own file — its real headings, real cells, and a running count of the rows that will be created — so a column aimed at the wrong field is visible before anything is written rather than discovered afterwards. Quoted fields, line breaks inside a cell, blank-ish values, and totals rows are all handled, and because the file is read in your browser the AI never sees a row it could mistype.",
                    "European exports are covered: a semicolon-delimited file with comma decimals reads correctly, DD/MM/YYYY dates convert once you've confirmed the order, and kilojoules become kilocalories with the unit shown next to a worked example from your own first row. Localised headings help too — a German export's Kalorien, Kohlenhydrate, Ballaststoffe or Koffein fills itself in, and fiber, sugar and caffeine are matched in Spanish, French, Italian and Dutch as well — so the manual mapping is usually shorter than it sounds. Run the import twice and nothing doubles — each row carries a content fingerprint, so repeats are reported as already logged.",
                ],
            },
            importFaq:
                "Yes, using manual column mapping. Ask to import and an importer opens in the chat: you pick your Lifesum CSV export, it's parsed in your browser rather than read by the AI, and you point its columns at date, food, meal, calories, and macros — fiber, total sugar and caffeine included — yourself. Lifesum isn't one of the four exports recognised by column name, so that mapping is a one-time manual step, though headings the mapper already knows fill themselves in. Semicolon-delimited European files with comma decimals, DD/MM/YYYY dates, and kilojoules are all handled, and re-importing the same file never creates duplicates.",
            extraFaqs: [
                {
                    q: "Does Nutrition MCP rate my food like Lifesum's food ratings?",
                    a: "No — there's no badge or numeric score. Instead you can ask your AI “is this a good choice for my goals?” and get a contextual answer that explains the trade-offs, rather than a fixed rating on the food itself.",
                },
                {
                    q: "Is Nutrition MCP free without a Lifesum Premium-style plan?",
                    a: "Yes. Nutrition MCP is completely free and open source, with no premium tier — whereas Lifesum puts diet plans and some tracking features behind a Premium subscription. You only need a Claude or ChatGPT account to connect.",
                },
            ],
        },
    },
    de: ALTERNATIVES_DE,
    es: ALTERNATIVES_ES,
    fr: ALTERNATIVES_FR,
    nl: ALTERNATIVES_NL,
    pl: ALTERNATIVES_PL,
    it: ALTERNATIVES_IT,
    uk: ALTERNATIVES_UK,
    ja: ALTERNATIVES_JA,
};

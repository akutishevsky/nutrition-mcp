/**
 * Generates the SEO "alternative to X" comparison pages under
 * public/alternatives/ from a single template plus the per-app data below.
 *
 * These pages target long-tail bridge queries seen in Search Console — e.g.
 * "myfitnesspal mcp", "connect cronometer to claude" — that the single-page
 * site can't rank for. Each page carries unique title/description/canonical/OG
 * plus FAQPage and BreadcrumbList JSON-LD.
 *
 * Edit the APPS data (or the shared template) here and re-run:
 *   bun run scripts/gen-alternatives.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 *
 * Self-hosting: scripts/depersonalize.ts cleans the generated .html files but
 * NOT this generator. If you regenerate, update SITE below and the GA tag,
 * GitHub links, and contact email in the shared fragments first.
 */

import {
    HTML_LANG,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";

type App = {
    /** Display name, e.g. "MyFitnessPal". */
    name: string;
    /** URL path (no leading slash), e.g. "myfitnesspal-mcp". */
    slug: string;
    /** Output filename under public/alternatives/. */
    file: string;
    /** Font Awesome icon class for the hub card. */
    icon: string;
    /** One-line blurb on the /alternatives hub card. */
    hubBlurb: string;
    /** The four honest "cons" bullets for the comparison table (left column). */
    cons: string[];
    /** Gracious closing note under the comparison — acknowledges the app's strength. */
    note: string;
    /**
     * Genuinely per-app prose (title + paragraphs) for the "Moving from X"
     * section. This is what differentiates each page from the shared template so
     * they don't read as thin/duplicate content.
     */
    migrate: { title: string; body: string[] };
    /**
     * Per-app prose for the "Bring your history with you" section — the answer
     * to the single biggest reason people don't switch trackers (abandoning
     * years of logged history). Kept app-specific on purpose: four of these
     * exports are recognised by name (see ALIASES / guessSourceApp in
     * public/widgets/src/templates/import-meals.html and the quirk list at the
     * top of src/csv.ts), so each page can cite what its own export actually
     * looks like rather than repeating a boilerplate reassurance.
     *
     * Accuracy rules for this copy, all load-bearing:
     *   - Yazio and Lifesum are NOT recognised by name. Their pages must say
     *     manual column mapping and must not imply named support.
     *   - The date format and energy unit are SNIFFED then CONFIRMED by the
     *     user, so never call them auto-detected and leave it there.
     *   - The file is parsed in the browser; the AI never reads the rows.
     */
    importSection: { title: string; body: string[] };
    /** Answer to the shared "Can I import my X data?" FAQ (see faqsFor). */
    importFaq: string;
    /**
     * Two app-specific FAQ entries interleaved into the shared FAQ set. These
     * carry unique text AND unique FAQPage structured-data entries per page, so
     * each page competes on more than a name-swapped template.
     */
    extraFaqs: { q: string; a: string }[];
    /** Optional override for the "Is Nutrition MCP free?" FAQ answer (e.g. paid-only apps). */
    freeAnswer?: string;
};

const APPS: App[] = [
    {
        name: "MyFitnessPal",
        slug: "myfitnesspal-mcp",
        file: "myfitnesspal.html",
        icon: "fa-fire-flame-curved",
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
    {
        name: "Cronometer",
        slug: "cronometer-mcp",
        file: "cronometer.html",
        icon: "fa-seedling",
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
    {
        name: "Lose It!",
        slug: "lose-it-mcp",
        file: "lose-it.html",
        icon: "fa-bullseye",
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
    {
        name: "MacroFactor",
        slug: "macrofactor-mcp",
        file: "macrofactor.html",
        icon: "fa-chart-simple",
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
    {
        name: "Yazio",
        slug: "yazio-mcp",
        file: "yazio.html",
        icon: "fa-carrot",
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
    {
        name: "Lifesum",
        slug: "lifesum-mcp",
        file: "lifesum.html",
        icon: "fa-leaf",
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
];

/**
 * Trademark / non-affiliation notice shown near the footer of every comparison
 * page. Keeps the pages clearly independent and hedges the comparisons as
 * point-in-time — the main legal safeguards for "alternative to X" content.
 */
function disclaimerBand(text: string): string {
    return `        <div class="disclaimer-band">
            <div class="container">
                <p class="page-disclaimer">${text}</p>
            </div>
        </div>`;
}

// The "What you get instead" feature grid describes Nutrition MCP, so it's the
// same on every page.
const FEATURES = `                    <div class="features-grid" data-reveal="stagger">
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-utensils"></i
                            ></span>
                            <h3>Meals in plain language</h3>
                            <p>
                                Say &ldquo;oatmeal with banana and peanut
                                butter&rdquo; — your AI estimates calories and
                                macros, fiber, total sugar and caffeine included, and logs
                                it. No database search.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-barcode"></i
                            ></span>
                            <h3>Barcode scanning — free</h3>
                            <p>
                                Send a product barcode and pull the label macros
                                from Open Food Facts — fiber and sugar too, where
                                the label lists them. No Premium subscription to
                                unlock it.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-weight-scale"></i
                            ></span>
                            <h3>Weight &amp; goals</h3>
                            <p>
                                Log body weight in kg or lb, set calorie, macro,
                                fiber, sugar, caffeine, and water goals — fiber a
                                target to reach, sugar and caffeine limits to
                                stay under — and track
                                trends toward a goal weight. Alcohol tracking is
                                there too, opt-in and off unless you turn it on.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-chart-area"></i
                            ></span>
                            <h3>Summaries &amp; trends</h3>
                            <p>
                                Ask for daily totals, weekly trends, streaks, and
                                recurring meal patterns — right in the chat.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-file-csv"></i
                            ></span>
                            <h3>Import &amp; own your data</h3>
                            <p>
                                Import your meal history from another app's CSV
                                export — parsed in your browser, not by the AI.
                                Take everything back out whenever you want: one
                                ZIP with your meals, water, weight, goals and
                                profile as CSV files. Meals are the only part
                                that can be imported back in for now. Or delete
                                your account, just as easily.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-code-branch"></i
                            ></span>
                            <h3>Open source &amp; free</h3>
                            <p>
                                MIT-licensed and self-hostable — no ads, no
                                paywall, no upsell. Audit the code or run your own
                                instance.
                            </p>
                        </article>
                    </div>`;

function installBlock(locale: SiteLocale): string {
    return `                    <div class="card install-card">
                        <ol class="steps">
                            <li>
                                Open <strong>Claude</strong> (web or desktop) and
                                click <strong>Customize</strong> →
                                <strong>Connectors</strong>.
                            </li>
                            <li>
                                Click <strong>+</strong>, then
                                <strong>Add custom connector</strong>, and give it
                                a name like <strong>Nutrition</strong>.
                            </li>
                            <li>
                                Paste
                                <span class="copy-url"
                                    ><code>https://nutrition-mcp.com/mcp</code
                                    ><button
                                        class="copy-mini"
                                        type="button"
                                        data-copy="https://nutrition-mcp.com/mcp"
                                        aria-label="Copy server URL"
                                    >
                                        <i class="fa-solid fa-copy"></i></button
                                ></span>
                                into the
                                <strong>Remote MCP server URL</strong> field and
                                click <strong>Add</strong>.
                            </li>
                            <li>
                                Click <strong>Connect</strong>, sign in, and start
                                logging by saying what you ate.
                            </li>
                        </ol>
                        <p class="note">
                            Using ChatGPT or another client instead? The
                            <a href="${hashPath(locale, "install")}">full install guide</a> covers
                            ChatGPT, Cursor, VS Code, Claude Code, and more.
                        </p>
                    </div>`;
}

// The Nutrition MCP (right) column of the comparison is identical everywhere.
const PROS = [
    "Built as an MCP server — lives inside Claude &amp; ChatGPT",
    "Describe meals in plain language; calories, macros, fiber, sugar &amp; caffeine estimated for you",
    "Barcode scanning, trends, CSV import &amp; export — all free",
    "No separate app, no ads, open source",
];

// ---------- helpers ----------

/**
 * Every import answer promises a panel that opens in the chat. That is the
 * widget path; a client with widgets off gets the paste fallback instead, where
 * the model does parse the rows (start_meal_import says so at src/mcp.ts). The
 * caveat is appended centrally so all seven pages carry the same wording rather
 * than six hand-edited variants.
 */
const IMPORT_FALLBACK_NOTE =
    " In clients without in-chat panels you can paste your export instead.";

function faqsFor(app: App): { q: string; a: string }[] {
    return [
        {
            q: `Does ${app.name} have an MCP server?`,
            a: `No. ${app.name} does not offer a Model Context Protocol (MCP) server, so there is no official way to connect it to Claude, ChatGPT, or other AI assistants. Nutrition MCP is a free, open-source alternative built as an MCP server from the ground up, so you can log meals and macros directly inside your AI.`,
        },
        {
            q: `How do I connect ${app.name} to Claude?`,
            a: `There is no official ${app.name} connector for Claude, because ${app.name} has no MCP server or public MCP integration. The closest option is Nutrition MCP, a free MCP server: add https://nutrition-mcp.com/mcp as a custom connector in Claude, sign in, and start logging by conversation.`,
        },
        ...app.extraFaqs,
        {
            q: `Is Nutrition MCP a good ${app.name} alternative?`,
            a: `If you want to track calories, macros — fiber, total sugar, and caffeine included — water, and weight without opening a separate app or searching a food database, yes. Instead of tapping through a database, you describe what you ate in plain language, send a photo, or scan a barcode, and your AI logs it — completely free and open source.`,
        },
        {
            q: `Can I import my ${app.name} data?`,
            a: app.importFaq + IMPORT_FALLBACK_NOTE,
        },
        {
            q: `Does the AI read my export file when I import?`,
            a: `Not when the importer opens. It parses the CSV in your browser and shows you what will be added before anything is written: how many meals, the calorie total, anything it had to flag, and the rows themselves — a long file lists the first of them plus a count of the rest rather than every line. Only the rows you confirm are sent, and they go as structured data rather than through the AI's reply, so no row can be mistyped or invented in transit. Each row also carries a content fingerprint, so running the same file again reports those meals as already logged instead of duplicating them. If your client can't display in-chat panels, the fallback is to paste the export — the AI does read it on that path, so prefer the importer when you have the choice.`,
        },
        {
            q: `Is Nutrition MCP free?`,
            a:
                app.freeAnswer ??
                `Yes. Nutrition MCP is completely free with no premium tier, ads, or paywalled features — unlike apps that put some features behind a subscription. You only need a Claude or ChatGPT account to connect.`,
        },
    ];
}

// ---------- per-app page ----------

function renderApp(app: App, locale: SiteLocale = "en"): string {
    const url = urlFor(locale, `/${app.slug}`);
    // The <title> deliberately does NOT mention import: these pages rank on the
    // exact bridge query ("<app> mcp", "connect <app> to claude") and diluting
    // that head term would cost more than an import keyword gains. The
    // description is a click-through lever rather than a ranking one, so it does
    // carry import — abandoning logged history is the top objection to switching.
    const desc = `No MCP server for ${app.name}? Nutrition MCP logs meals and macros inside Claude or ChatGPT — free, open source, and it imports your CSV export.`;
    const ogDesc = `${app.name} has no MCP server. Nutrition MCP is a free, open-source alternative that logs meals, macros, and weight in Claude or ChatGPT — and imports your ${app.name} history from a CSV export.`;
    const title = `${app.name} MCP Server? Track Nutrition in Claude & ChatGPT`;
    const faqs = faqsFor(app);

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: SITE,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Alternatives",
                item: urlFor(locale, "/alternatives"),
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `${app.name} MCP`,
                item: url,
            },
        ],
    };
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    const cons = app.cons
        .map(
            (c) =>
                `                                <li>\n                                    <i class="fa-solid fa-xmark"></i> ${esc(c)}\n                                </li>`,
        )
        .join("\n");
    const pros = PROS.map(
        (p) =>
            `                                <li>\n                                    <i class="fa-solid fa-circle-check"></i>\n                                    ${p}\n                                </li>`,
    ).join("\n");
    const faqDetails = faqs
        .map(
            (f) =>
                `                        <details>\n                            <summary>${esc(f.q)}</summary>\n                            <p>${esc(f.a)}</p>\n                        </details>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
${localeHead(locale, `/${app.slug}`)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${jsonLd(breadcrumb)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}
${nav(locale, `/${app.slug}`)}

        <main id="main">
            <!-- Hero -->
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="${pathFor(locale, "")}">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <a href="${pathFor(locale, "/alternatives")}">Alternatives</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>${esc(app.name)}</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">${esc(app.name)} alternative</p>
                        <h1 class="hero-title">
                            Looking for a <em>${esc(app.name)} MCP</em> server?
                        </h1>
                        <p class="lead">
                            ${esc(app.name)} doesn't have one — so you can't use
                            it inside Claude or ChatGPT. Nutrition MCP does the
                            same job by conversation, and it's free and open
                            source.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="#switch"
                                >Connect in under a minute</a
                            >
                            <a class="btn btn-secondary" href="#compare"
                                >See the comparison</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <!-- The honest answer -->
            <section class="section band" id="answer">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">The short answer</p>
                        <h2 class="section-title">
                            No, ${esc(app.name)} has no MCP server.
                        </h2>
                        <p class="section-sub">
                            The Model Context Protocol (MCP) is the open standard
                            that lets AI assistants like Claude and ChatGPT
                            connect to outside tools. ${esc(app.name)} doesn't
                            publish an MCP server, so there's no official way to
                            log food to it from your AI. If you searched for
                            &ldquo;${esc(app.name)} MCP&rdquo; or &ldquo;connect
                            ${esc(app.name)} to Claude,&rdquo; what you're really
                            after is a nutrition tracker that lives
                            <em>inside</em> your AI — that's exactly what
                            Nutrition MCP is.
                        </p>
                    </div>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="section" id="instead">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">What you get instead</p>
                        <h2 class="section-title">
                            The same tracking, just by talking
                        </h2>
                    </div>
${FEATURES}
                </div>
            </section>

            <!-- Comparison -->
            <section class="section band" id="compare">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(app.name)} vs. Nutrition MCP</p>
                        <h2 class="section-title">How they stack up</h2>
                    </div>
                    <div class="compare">
                        <div class="compare-col">
                            <h3 class="compare-h compare-h-old">
                                ${esc(app.name)}
                            </h3>
                            <ul>
${cons}
                            </ul>
                        </div>
                        <div class="compare-col compare-col-new">
                            <h3 class="compare-h compare-h-new">
                                Nutrition MCP
                            </h3>
                            <ul>
${pros}
                            </ul>
                        </div>
                    </div>
                    <p class="note compare-note">
                        ${esc(app.note)}
                    </p>
                </div>
            </section>

            <!-- Moving from X (per-app, unique content) -->
            <section class="section" id="moving">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Moving from ${esc(app.name)}</p>
                        <h2 class="section-title">
                            ${esc(app.migrate.title)}
                        </h2>
                    </div>
                    <div class="prose">
${app.migrate.body
    .map((p) => `                        <p>${esc(p)}</p>`)
    .join("\n")}
                    </div>
                </div>
            </section>

            <!-- Bring your history (per-app, unique content) -->
            <section class="section band" id="import">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Your ${esc(app.name)} history</p>
                        <h2 class="section-title">
                            ${esc(app.importSection.title)}
                        </h2>
                        <p class="section-sub">
                            Ask to import and an importer opens right in the
                            chat: pick your export, map the columns, preview
                            what will be added, then confirm. The file
                            is read in your browser — the AI never sees the
                            rows. In clients without in-chat panels, paste your
                            export instead.
                        </p>
                    </div>
                    <div class="prose">
${app.importSection.body
    .map((p) => `                        <p>${esc(p)}</p>`)
    .join("\n")}
                    </div>
                </div>
            </section>

            <!-- How to switch -->
            <section class="section" id="switch">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">How to switch</p>
                        <h2 class="section-title">Connect in under a minute</h2>
                        <p class="section-sub">
                            Works with any MCP client that supports OAuth 2.0
                            with PKCE. On first connect you create an account
                            with Google or an email and password.
                        </p>
                    </div>
${installBlock(locale)}
                </div>
            </section>

            <!-- FAQ -->
            <section class="section band" id="faq">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">FAQ</p>
                        <h2 class="section-title">
                            ${esc(app.name)} &amp; MCP questions
                        </h2>
                    </div>
                    <div class="faq">
${faqDetails}
                    </div>
                </div>
            </section>

            <!-- Closing CTA -->
            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — no ${esc(app.name)} account, no app
                        to open.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="#switch"
                            >Quick install</a
                        >
                        <a class="btn btn-ghost-accent" href="${pathFor(locale, "/alternatives")}"
                            >Other alternatives</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${esc(app.name)} is a trademark of its respective owner. Nutrition MCP is an independent, open-source project and is not affiliated with, endorsed by, or sponsored by ${esc(app.name)}. Comparisons reflect publicly available information at the time of writing and may change.`)}

${footer(locale)}

${SITE_SCRIPT}
    </body>
</html>
`;
}

// ---------- hub page ----------

function renderHub(locale: SiteLocale = "en"): string {
    const url = urlFor(locale, "/alternatives");
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: urlFor(locale, ""),
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Alternatives",
                item: url,
            },
        ],
    };
    const cards = APPS.map(
        (app) =>
            `                        <a class="card feature alt-card" href="${pathFor(locale, `/${app.slug}`)}">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid ${app.icon}"></i
                            ></span>
                            <h3>${esc(app.name)} &rarr;</h3>
                            <p>${esc(app.hubBlurb)}</p>
                        </a>`,
    ).join("\n");

    const title =
        "Nutrition App MCP Alternatives — Track Food in Claude & ChatGPT";
    // As on the per-app pages, the title keeps the head term and the description
    // carries the import hook. See renderApp for the reasoning.
    const desc =
        "MyFitnessPal, Cronometer, and Lose It! have no MCP server. Nutrition MCP is the free, open-source alternative for Claude and ChatGPT — and imports your history.";
    const ogDesc =
        "Your nutrition app doesn't have an MCP server. Nutrition MCP is a free, open-source alternative that works inside Claude or ChatGPT — and imports your history from a CSV export.";

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
${localeHead(locale, "/alternatives")}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}
${nav(locale, "/alternatives", "/alternatives")}

        <main id="main">
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="${pathFor(locale, "")}">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>Alternatives</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">MCP alternatives</p>
                        <h1 class="hero-title">
                            Your nutrition app doesn't have an
                            <em>MCP server</em>.
                        </h1>
                        <p class="lead">
                            Apps like MyFitnessPal, Cronometer, and Lose It can't
                            connect to Claude or ChatGPT. Nutrition MCP is the
                            free, open-source way to track meals, macros, and
                            weight by talking to your AI.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="${hashPath(locale, "install")}"
                                >Quick install</a
                            >
                            <a class="btn btn-secondary" href="${hashPath(locale, "try")}"
                                >See examples</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <section class="section band" id="apps">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Switching from…</p>
                        <h2 class="section-title">Pick your current app</h2>
                        <p class="section-sub">
                            See how Nutrition MCP compares to the tracker you use
                            today — and how to move your logging, and your
                            existing history, into your AI.
                        </p>
                    </div>
                    <div class="features-grid" data-reveal="stagger">
${cards}
                    </div>
                    <p class="note compare-note">
                        Don't see your app? It almost certainly has no MCP server
                        either — Nutrition MCP works the same way regardless of
                        what you're switching from.
                        <a href="mailto:anton@nutrition-mcp.com"
                            >Request a comparison</a
                        >.
                    </p>
                </div>
            </section>

            <section class="section" id="import">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Bringing your history</p>
                        <h2 class="section-title">
                            You don't have to start from zero
                        </h2>
                        <p class="section-sub">
                            The usual reason people stay put is the years already
                            logged. Ask to import and an importer opens right in
                            the chat: pick your export, map the columns, preview
                            what will be added, then confirm — or paste
                            the export if your client has no in-chat panels.
                        </p>
                    </div>
                    <div class="prose">
                        <p>
                            The file is parsed in your browser, not read by the
                            AI — so the rows can't be mistyped on the way in, and
                            you see the exact meals before any of them are
                            written. Exports from MyFitnessPal, Cronometer, Lose
                            It!, and MacroFactor have their columns recognised by
                            name; any other CSV works too, you just point the
                            mapper at each column once. What comes across is the
                            date and time, food, meal, calories, protein, carbs,
                            fat, fiber, total sugar, and caffeine in
                            milligrams — and alcohol as well, if
                            you've switched alcohol tracking on first.
                        </p>
                        <p>
                            The awkward parts of real export files are handled:
                            DD/MM/YYYY and MM/DD/YYYY dates, energy in kilojoules
                            as well as kilocalories, semicolon-delimited European
                            files whose numbers use comma decimals, quoted fields
                            with line breaks inside them, trailing totals rows,
                            and deleted-row flags. Column headings don't have to
                            be English either — a German export's Kalorien or
                            Ballaststoffe is recognised, and fiber, sugar, and
                            caffeine are matched in Spanish, French, Italian,
                            and Dutch too.
                            Where a file is genuinely
                            ambiguous — 05/06 could be May or June — the importer
                            shows its reading next to a row from your own file and
                            asks you to confirm rather than guessing. And each row
                            carries a content fingerprint, so re-importing the
                            same file reports the meals as already logged instead
                            of duplicating them.
                        </p>
                    </div>
                </div>
            </section>

            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — it works with Claude, ChatGPT, and
                        any MCP client.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="${hashPath(locale, "install")}"
                            >Quick install</a
                        >
                        <a
                            class="btn btn-ghost-accent"
                            href="https://github.com/akutishevsky/nutrition-mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                            ><i class="fa-brands fa-github"></i> Star on GitHub</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${APPS.map((a) => esc(a.name)).join(", ")}, and other product names are trademarks of their respective owners. Nutrition MCP is an independent, open-source project and is not affiliated with or endorsed by them. Comparisons reflect publicly available information at the time of writing and may change.`)}

${footer(locale, "/alternatives")}

${SITE_SCRIPT}
    </body>
</html>
`;
}

// ---------- write + sitemap ----------

const OUT_DIR = "./public/alternatives";

// English only for now — the per-app APPS data (cons, migrate, FAQ, etc.)
// isn't translated yet, so generating other locales here would ship pages
// with a translated header/footer around untranslated English body copy.
// The `locale` parameter threaded through renderApp/renderHub above is
// ready for when that data lands; this loop is the only place to extend
// once it does. src/routes.ts's ALT_PAGES is the source of truth for the
// route -> file map src/index.ts serves these from — keep app.slug/app.file
// here in sync with it by hand, the same as before.
for (const app of APPS) {
    await Bun.write(`${OUT_DIR}/${app.file}`, renderApp(app));
    console.log(`wrote ${app.file}  (/${app.slug})`);
}
await Bun.write(`${OUT_DIR}/index.html`, renderHub());
console.log("wrote index.html  (/alternatives)");

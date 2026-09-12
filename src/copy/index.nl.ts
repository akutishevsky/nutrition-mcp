// Dutch (nl) translation of IndexDoc for the landing page. See
// src/copy/index.ts for the full type shape and for which four fields carry
// trusted HTML (`connect.claude.steps`, `connect.chatgpt.steps`,
// `connect.other.noteHtml`, `faq[].visibleHtml`) — every tag there is kept
// verbatim from the English source and no other field contains markup.
// The hero chat's nutrient deltas (`add`) and clock strings are numbers,
// not copy, and are copied unchanged. On-screen UI labels inside the
// install steps (Customize, Connectors, Settings → Apps, …) stay English
// because that is what the Claude and ChatGPT interfaces actually show.
//
// Numbers follow Dutch formatting (a period as thousands separator: 2.000,
// 1.830) because the page's own figures and the widget cards both group
// that way, so a hand-typed "2,000" next to a rendered "1.059" would read
// as two different conventions on one screen.

import type { IndexDoc } from "./index.js";

export const INDEX_NL: IndexDoc = {
    title: "Nutrition MCP — Gratis calorie- & macrotracker voor Claude, ChatGPT en Cursor",
    metaDescription:
        "Houd calorieën, eiwit, koolhydraten, vet, vezels, suiker en cafeïne bij door met je AI te praten. Nutrition MCP is een gratis, open-source MCP-server die werkt in Claude, ChatGPT, Cursor en elke MCP-client. Geen app om te installeren.",
    ogDescription:
        "Gratis, open-source MCP-server voor calorieën en macro's bijhouden in Claude, ChatGPT en Cursor. Zeg wat je hebt gegeten; het rekenwerk wordt voor je gedaan.",
    keywords:
        "voedingstracker, calorieënteller, macrotracker, MCP-server, Claude-connector, ChatGPT-app, AI-voedingstracking, eten loggen, barcodescanner, open source, MyFitnessPal-alternatief",

    hero: {
        titleBeforeEm: "Houd je voeding bij door te ",
        titleEm: "praten",
        titleAfterEm: " met je AI.",
        lead: "Nutrition MCP is een gratis, open-source calorie- en macrotracker die in Claude, ChatGPT, Cursor leeft — elke AI die MCP ondersteunt. Zeg wat je hebt gegeten; het berekent de calorieën, eiwit, koolhydraten, vet, vezels, suiker en cafeïne, logt het en laat je de dag zien. Geen app om te installeren.",
        ctaPrimary: "Verbind binnen een minuut",
        ctaGithub: "GitHub",
        moreExamples: "Meer voorbeelden",
        chat: {
            status: "Nutrition · verbonden",
            photoCaption: "📷 Foto",
            pauseLabel: "Demo pauzeren",
            exchanges: [
                {
                    userText:
                        "Havermout met bessen en een flat white als ontbijt",
                    aiText: "Gelogd — ongeveer 380 kcal, 14 g eiwit. De flat white voegt 130 mg cafeïne toe.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description: "Havermout met bessen en een flat white",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "Dat is een Coca-Cola van 330 ml — 139 kcal, 35 g suiker, via Open Food Facts. Gelogd als snack.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Een halve liter water",
                    aiText: "Gedaan. Vandaag tot nu toe 500 ml.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "Grote salade met gegrilde kip als lunch",
                    aiText: "Gelogd — ongeveer 540 kcal, 46 g eiwit. Je zit op de helft van je 2.000 voor vandaag.",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "Grote salade met gegrilde kip",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "Hoe sta ik ervoor vandaag?",
                    aiText: "Dit is vandaag tot nu toe — eiwit ligt op koers, suiker zit dicht bij de limiet.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "Hoe het werkt",
        title: "Drie stappen. Geen app om te leren.",
        sub: "Zo werkt voeding bijhouden met AI via een MCP-server: één keer verbinden, je maaltijden omschrijven en om overzichten vragen wanneer je maar wilt.",
        steps: [
            {
                title: "Eén keer verbinden",
                body: "Voeg de server toe aan Claude, ChatGPT of elke MCP-client en log in met Google of e-mail. Het duurt minder dan een minuut en je hoeft het nooit meer te doen.",
            },
            {
                title: "Zeg gewoon wat je hebt gegeten",
                body: "Omschrijf het in gewone taal — of stuur een foto van je maaltijd, een screenshot van een bezorgapp, of een barcode (het product wordt online opgezocht). Macro's worden automatisch gelogd.",
            },
            {
                title: "Bijhouden & bekijken",
                body: "Vraag om dagelijkse overzichten, wekelijkse trends, voortgang op je doelen, of exporteer alles wat je hebt gelogd als CSV-bestanden — helemaal gratis.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Snel installeren",
        title: "Verbind met Claude, ChatGPT of Cursor in minder dan een minuut.",
        sub: "Voeg de Nutrition MCP-server toe aan je AI-client, log in met Google of een e-mailadres en wachtwoord, en begin met maaltijden loggen. Niets te installeren, niets te leren.",
        copyLabel: "Kopieer",
        copiedLabel: "Gekopieerd",
        copyAriaLabel: "Server-URL kopiëren",
        bullets: [
            "Werkt op elk Claude- en ChatGPT-abonnement",
            "OAuth 2.0 — je client regelt de login",
            "Eenmaal verbonden in Claude of ChatGPT gaat het mee naar iOS en Android",
        ],
        otherTabLabel: "Andere agents",
        tabsLabel: "Kies je AI-client",
        claude: {
            steps: [
                "Open <b>Claude</b> (web of desktop) en klik op <b>Customize</b> in de linkerbovenhoek.",
                "Klik op <b>Connectors</b>.",
                "Klik op <b>+</b> en daarna op <b>Add custom connector</b>.",
                "Geef het een naam, bijvoorbeeld <b>Nutrition</b>.",
                "Plak <code>https://nutrition-mcp.com/mcp</code> in het veld <b>Remote MCP server URL</b>.",
                "Klik op <b>Add</b>.",
                "Klik op <b>Connect</b> — de inlogpagina opent; ga verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
            note: "Werkt op elk Claude-abonnement. Het gratis abonnement staat één gekoppelde MCP-server tegelijk toe.",
        },
        chatgpt: {
            steps: [
                "Open <b>ChatGPT op het web</b> → <b>Settings</b> → <b>Apps</b>.",
                "Klik onderaan de popup op <b>Create app</b>. Zie je die niet, zet dan <b>Developer mode</b> aan bij <b>Advanced settings</b>.",
                "Geef het een naam, bijvoorbeeld <b>Nutrition</b>.",
                "Plak bij <b>Connection</b> <code>https://nutrition-mcp.com/mcp</code>.",
                "Kies bij <b>Authentication</b> voor <b>OAuth</b> — laat de rest ongewijzigd.",
                "Klik op <b>Create</b> en daarna op <b>Sign in with Nutrition</b>.",
            ],
            note: "Werkt op elk ChatGPT-abonnement.",
        },
        other: {
            noteHtml:
                "Voeg de configuratie hierboven toe aan je client (Cursor, VS Code, Claude Code en meer). Windsurf gebruikt <code>serverUrl</code> in plaats van <code>url</code>. Voer in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> uit. Je client handelt de OAuth-login automatisch af.",
        },
    },

    onboarding: {
        title: "Ingesteld in je eerste vijf minuten.",
        sub: "Geen instellingenschermen. Tijdzone, calorie- en macrodoelen, widgettaal — elk daarvan is één zin die je één keer zegt.",
        stepLabel: "Stap {n}",
        justSay: "Zeg gewoon ",
        steps: [
            {
                title: "Stel je tijdzone in",
                body: "Zodat dagen om jouw lokale middernacht overgaan, niet die van iemand anders.",
                say: "Zet mijn tijdzone op New York",
            },
            {
                title: "Stel je doelen in",
                body: "Dagelijkse calorieën, macro's en water, plus een optioneel streefgewicht.",
                say: "Zet mijn dagelijkse doel op 2.000 calorieën en 150 g eiwit",
            },
            {
                title: "Kies een widgettaal",
                body: "De taal waarin de in-chat widgets worden getoond — niet wat de AI je terugschrijft.",
                say: "Toon mijn widgets in het Duits",
            },
            {
                title: "Begin met loggen",
                body: "Zeg wat je hebt gegeten, stuur een foto of scan een barcode.",
                say: "Ik had havermout met bessen als ontbijt",
            },
        ],
    },

    examples: {
        title: "Praten wint van tikken.",
        sub: "Log een maaltijd, scan een barcode, bekijk je week — echte gesprekken met echte in-chat widgets. Blader er een paar door.",
        status: "Nutrition · verbonden",
        prevLabel: "Vorige",
        nextLabel: "Volgende",
        pickerLabel: "Kies een voorbeeld",
        slides: [
            {
                title: "Log een maaltijd",
                sub: "Gewone woorden, geen database",
                userText:
                    "Ik had havermout met bessen en een koffie als ontbijt",
                aiText: "Ontbijt gelogd — ongeveer 320 kcal, 11 g eiwit. De koffie voegde 95 mg cafeïne toe.",
            },
            {
                title: "Scan een barcode",
                sub: "Open Food Facts, geschaald naar jouw portie",
                userText: "Scan deze barcode: 5449000000996",
                aiText: "Dat is een Coca-Cola van 330 ml — 139 kcal, 35 g suiker, via Open Food Facts. Hoeveel heb je ervan gehad?",
            },
            {
                title: "Bekijk de week",
                sub: "Trendswidget, gewoon in de chat",
                userText: "Hoe zag vorige week eruit?",
                aiText: "Je zat de afgelopen 14 dagen gemiddeld op 1.830 kcal per dag, waarvan 13 gelogd — 170 onder je doel. Eiwit was je stabielste macro.",
                widget: "trends",
            },
        ],
    },

    live: {
        eyebrow: "Live · iedereen, tot nu toe",
        title: "Ergens ontbijt, ergens anders avondeten.",
        sub: "Live voedingsstatistieken over alle Nutrition MCP-accounts — calorieën, voedingslogs, macro's en verloren gewicht — elke vijf seconden ververst.",
        unitGroupLabel: "Eenheden",
        unitMetricLabel: "Metrisch",
        unitImperialLabel: "Imperiaal",
        refreshBefore: "Ververst elke 5 s · volgende over ",
        refreshAfter: "s",
        sinceOpenLabel: "sinds je deze pagina opende",
        cards: {
            calories: "Calorieën gelogd",
            foodLogs: "Voedingslogs",
            protein: "Eiwit gelogd",
            carbs: "Koolhydraten gelogd",
            fat: "Vet gelogd",
            weightLost: "Gewicht verloren sinds 2 juli 2026",
            water: "Water gelogd",
        },
        foodLogsUnit: "logs",
        timezonesAfter:
            " tijdzones · dagen gaan over om ieders eigen middernacht",
        mapNote: "stipgrootte = aandeel accounts · beweeg over een stip",
        mapShare: "{share} van de accounts",
        mapAriaLabel:
            "Wereldkaart van stippen met Nutrition MCP-accounts per tijdzone; grotere stippen betekenen een groter aandeel",
    },

    support: {
        eyebrow: "Altijd gratis",
        title: "Gratis voeding bijhouden. Geen premium-laag. Nooit.",
        sub: "Elke tool, elke widget, elke export — voor iedereen, zonder kosten. Het is het open-source project van één persoon, en de code is MIT-gelicentieerd zodat dat zo blijft.",
        bullets: [
            "Alle 36 tools en zes widgets inbegrepen",
            "Geen advertenties, geen upsells, geen vergrendelde functies",
            "Exporteer of verwijder je gegevens wanneer je wilt",
            "Host het zelf als je dat liever hebt — Dockerfile inbegrepen",
        ],
        patreon: {
            eyebrow: "Optioneel · Patreon",
            title: "Als het zijn nut bewijst, help dan de server online te houden.",
            sub: "De enige kosten zijn hosting en de database. Patrons dekken die — elk bedrag, opzeggen wanneer je wilt. Er wordt niets ontgrendeld; je krijgt alleen de bouwnotities als eerste en inspraak in wat er daarna komt.",
            cta: "Steun op Patreon",
            starCta: "Liever een ster",
        },
        postsTitle: "Laatste berichten op Patreon",
        postsAll: "Alle berichten",
        postLinkLabel: "Lees op Patreon",
    },

    contact: {
        eyebrow: "Contact",
        title: "Zeg hallo.",
        sub: "Een bug gevonden, een idee, of heeft het een maaltijd helemaal verkeerd ingeschat? Mail me rechtstreeks — ik lees elk bericht.",
        emailAriaLabel: "E-mail anton@nutrition-mcp.com",
        cards: {
            email: { title: "E-mail", sub: "Alles — de directe lijn" },
            issues: {
                title: "GitHub-issues",
                sub: "Bugs en functiewensen, in het openbaar",
            },
            patreon: {
                title: "Patreon",
                sub: "Bouwnotities, stemmingen en patronchat",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Vragen over Nutrition MCP.",
        subBefore:
            "Wat het is, waar het werkt, wat het kost en wie je gegevens ziet. Mis je iets? ",
        subLink: "Vraag het me rechtstreeks",
        subAfter: ".",
        categoriesLabel: "Vragen filteren op categorie",
        categories: {
            all: "Alles",
            basics: "Basis",
            clients: "Clients",
            tracking: "Bijhouden",
            data: "Je gegevens",
        },
    },
    faq: [
        // Basis
        {
            question: "Wat is Nutrition MCP?",
            visibleHtml:
                "Een gratis, open-source MCP-server (Model Context Protocol) voor voeding bijhouden. Verbind hem met Claude, ChatGPT, Cursor of elke MCP-client en log maaltijden, calorieën, macro's, water en gewicht door te praten.",
            category: "basics",
        },
        {
            question: "Wat is een MCP-server?",
            visibleHtml:
                "Een kleine dienst die je AI kan aanroepen terwijl je chat. Nutrition MCP geeft Claude, ChatGPT, Cursor en consorten 36 voedingstools — loggen, doelen, trends, importeren en exporteren. Je ziet de tools nooit; je praat gewoon.",
            category: "basics",
        },
        {
            question: "Is Nutrition MCP gratis?",
            visibleHtml:
                "Ja. Geen premium-laag, geen advertenties, geen vergrendelde functies. Je hebt alleen een Claude- of ChatGPT-account nodig om te verbinden. Donaties op Patreon dekken de serverkosten.",
            category: "basics",
        },
        // Clients
        {
            // Het zichtbare antwoord noemt de server-URL nu zelf, dus de
            // JSON-LD-override die de oude pagina droeg is niet meer nodig;
            // tags strippen levert dezelfde zin op.
            question: "Werkt het met ChatGPT?",
            visibleHtml:
                "Ja. Open in ChatGPT op het web Settings → Apps → Create app, plak <code>https://nutrition-mcp.com/mcp</code> met OAuth-authenticatie en log in. Het werkt op elk ChatGPT-abonnement.",
            category: "clients",
        },
        {
            question: "Werkt het met Cursor, VS Code of Claude Code?",
            visibleHtml:
                "Ja — elke client die remote MCP-servers over HTTP ondersteunt. Voeg de URL toe aan je <code>mcp.json</code>, of voer in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> uit.",
            category: "clients",
        },
        {
            question: "Werkt het op mijn telefoon?",
            visibleHtml:
                "Ja. Verbind het één keer in Claude of ChatGPT op het web of desktop en het verschijnt automatisch in hun iOS- en Android-apps.",
            category: "clients",
        },
        // Bijhouden
        {
            // Ongewijzigd overgenomen van de vorige landingspagina: vastgepind
            // door tests (src/site-copy.test.ts controleert dat cafeïne hier
            // "in milligram" wordt genoemd en dat het JSON-LD-antwoord
            // overeenkomt).
            question: "Wat kan ik bijhouden?",
            visibleHtml:
                "Calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en water voor elke registratie — omschreven in gewone taal of opgehaald via een productbarcode met Open Food Facts. Cafeïne wordt ook bijgehouden, in milligram, de eenheid die elk label gebruikt, en het levert geen calorieën. Alcohol wordt ook bijgehouden, in gram zuivere ethanol, zodra je het aanzet. Je kunt ook je lichaamsgewicht loggen in kg of lb en trends volgen richting een streefgewicht. Bekijk dagelijkse overzichten, vraag maaltijden op per periode, werk eerdere registraties bij of verwijder ze, stel doelen in, en volg trends in de tijd.",
            category: "tracking",
        },
        {
            question: "Hoe nauwkeurig is het calorieën tellen?",
            visibleHtml:
                "De cijfers zijn schattingen op basis van wat je omschrijft, zoals een goed ingevoerde vriend ze zou schatten — goed voor trends, niet voor medische beslissingen. Barcodescans gebruiken gegevens van Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Houdt het alcohol bij?",
            visibleHtml:
                "Alleen als je het aanzet. Alcoholregistratie staat standaard uit; eenmaal aangezet worden drankjes vastgelegd in gram ethanol en getoond als Amerikaanse standaardglazen of Britse eenheden.",
            category: "tracking",
        },
        // Je gegevens
        {
            // De slotzin is vastgepind door src/site-copy.test.ts: de export
            // neemt alles mee naar buiten, maar alleen maaltijden komen terug.
            question:
                "Kan ik mijn geschiedenis uit MyFitnessPal of Cronometer importeren?",
            visibleHtml:
                "Ja. Importeer je maaltijdgeschiedenis uit MyFitnessPal, Cronometer, Lose It!, MacroFactor of elke andere CSV door de kolommen te koppelen — tot 50 regels per aanroep. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren.",
            category: "data",
        },
        {
            // Moet maaltijden, water, gewicht, doelen en profiel noemen — de
            // vijf bestanden in het exportarchief (src/site-copy.test.ts).
            question: "Wie kan mijn gegevens zien, en kan ik ze exporteren?",
            visibleHtml:
                "Alleen jij. Exporteer alles — maaltijden, water, gewicht, doelen, profiel — als een ZIP met CSV-bestanden met een downloadlink van 60 minuten, of verwijder je account helemaal. MIT-gelicentieerd, dus je kunt het ook zelf hosten.",
            category: "data",
        },
        {
            // Overgenomen van de vorige landingspagina.
            question: "Kan ik het zelf hosten?",
            visibleHtml:
                'Ja. Nutrition MCP is open source (MIT). Je kunt je eigen instantie draaien met je eigen Supabase-project — de <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-repository</a> bevat een volledige zelfhostingshandleiding en een Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Je volgende maaltijd is één zin ver.",
        sub: "Gratis, open-source voeding bijhouden voor Claude, ChatGPT en Cursor — en je gegevens zijn van jou, om te exporteren of te verwijderen wanneer je maar wilt.",
        primary: "Verbind nu",
        secondary: "Ster op GitHub",
    },
};

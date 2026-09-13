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
        carouselLabel: "Voorbeeldgesprekken",
        slideLabel: "{n} van {total}",
        carouselRole: "carrousel",
        slideRole: "dia",

        moreToolsLabel: "Gebruikt ook",
        toolLinkLabel: "{tool} op de toolspagina",
        photoMealAlt:
            "Foto: een kom borsjtsj met een schepje zure room en dille, met een snee roggebrood ernaast",
        photoPackageAlt:
            "Foto: de barcode op een blikje Coca-Cola, nummer 5449000000996",
        threadLabel: "Gesprek",
        importerAlt:
            "De importer in de chat bij de eerste stap: kies je geëxporteerde CSV-bestand uit MyFitnessPal, Cronometer, Lose It! of MacroFactor",
        importerCaption:
            "Voorbeeld van de importer zoals die in je chat verschijnt",
        slides: [
            {
                id: "log-meal",
                title: "In gewone woorden loggen",
                description:
                    "Zeg het zoals je het een vriend zou vertellen. Ontbreekt de portie of de maaltijd, dan wordt eerst gevraagd en pas daarna geschat. Vezels en suiker staan bij elke invoer, cafeïne bij alles waar het in zit, en “vanochtend” valt in jouw tijdzone.",
                toolNotes: {
                    log_meal:
                        "Slaat het ontbijt op met macro's, vezels, suiker en cafeïne",
                    log_water:
                        "Telt de 500 ml om 07:00 mee in het water van vandaag",
                    get_current_time:
                        "Zoekt datum en tijd op, zodat “rond 7 uur vanochtend” klopt",
                },
                messages: [
                    {
                        from: "user",
                        text: "Een kom havermout met bessen en een kop koffie als ontbijt",
                    },
                    {
                        from: "ai",
                        text: "Ontbijt gelogd: ongeveer 320 kcal, 11 g eiwit, 6 g vezels. De koffie voegde 95 mg cafeïne toe.",
                    },
                    {
                        from: "user",
                        text: "En 500 ml water rond 7 uur vanochtend, na het hardlopen",
                    },
                    {
                        from: "ai",
                        text: "500 ml water toegevoegd om 07:00 vanochtend.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 1,
                cardMeals: ["Havermout met bessen (1 kom) en koffie (1 kop)"],
            },
            {
                id: "photo-meal",
                title: "Fotografeer je bord",
                description:
                    "Een foto start een vraaggesprek, geen gok. Eerst: zelfgemaakt of restaurant? Dan worden je eerdere logs bekeken, volgt per bericht één vraag over porties en verborgen olie of saus, en wordt pas gelogd als je de samenvatting goedkeurt.",
                toolNotes: {
                    log_meal:
                        "Logt pas als alle vragen beantwoord zijn en je ja zegt",
                    search_meals:
                        "Vindt hoe je borsjtsj eerder logde, om te vragen welke",
                },
                messages: [
                    { from: "user", photo: "meal", text: "Lunch" },
                    {
                        from: "ai",
                        text: "Borsjtsj met zure room en een snee roggebrood. Ziet er zelfgemaakt uit, toch?",
                    },
                    { from: "user", text: "Ja, het recept van mijn moeder" },
                    {
                        from: "ai",
                        text: "Je hebt borsjtsj al op twee manieren gelogd: met rundvlees (~320 kcal per kom) en vegetarisch (~180). Welke is dit?",
                    },
                    {
                        from: "user",
                        text: "Met rundvlees. Ik heb er twee eetlepels zure room bij gedaan",
                    },
                    {
                        from: "ai",
                        text: "Helder. Ervan uitgaande dat je de kom leeg hebt gegeten: borsjtsj met rundvlees, 2 el zure room en een snee roggebrood, ongeveer 470 kcal, 24 g eiwit. Loggen als lunch?",
                    },
                    { from: "user", text: "Ja" },
                    {
                        from: "ai",
                        text: "Lunch gelogd: 470 kcal · 24 g eiwit · 43 g koolhydraten · 22 g vet · 7 g vezels · 10 g suiker.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 7,
                cardMeals: [
                    "Borsjtsj met rundvlees (1 kom) met zure room (2 el) en roggebrood (1 snee)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scan een barcode",
                description:
                    "Fotografeer de verpakking: de cijfers onder de barcode worden opgezocht in Open Food Facts, en er volgt de vraag hoeveel je had. Cafeïne, die Open Food Facts mist, komt van het merk of online; ontbrekende vezels of suiker worden geschat.",
                toolNotes: {
                    lookup_barcode:
                        "Haalt de etiketwaarden van het blikje uit Open Food Facts",
                    log_meal:
                        "Logt het hele blikje bij de lunch, cafeïne inbegrepen",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "Had ik bij de lunch",
                    },
                    {
                        from: "ai",
                        text: "Dat is een Coca-Cola van 330 ml: 139 kcal en 35 g suiker, via Open Food Facts. Heb je het hele blikje gedronken?",
                    },
                    { from: "user", text: "Helemaal" },
                    {
                        from: "ai",
                        text: "Gelogd bij de lunch: 139 kcal en 35 g suiker. Open Food Facts heeft geen cafeïnewaarde, dus ik heb die van Coca-Cola zelf gebruikt: ongeveer 32 mg per blikje.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 3,
                cardMeals: ["Coca-Cola (blikje van 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Doelen stellen, stand checken",
                description:
                    "Stel doelen in om te halen, zoals calorieën en eiwit, en limieten om onder te blijven voor suiker, alcohol en cafeïne; alleen wat je noemt verandert. Vraag daarna naar elke dag en zie elk getal naast zijn doel, en wat er nog te gaan is.",
                toolNotes: {
                    set_nutrition_goals:
                        "Slaat calorie- en eiwitdoel op en een cafeïnelimiet van 400 mg",
                    get_goal_progress:
                        "Toont vandaag naast elk doel en wat er nog te gaan is",
                },
                messages: [
                    {
                        from: "user",
                        text: "Stel mijn doelen in: 2.000 kcal, 160 g eiwit en een cafeïnelimiet. Wat is verstandig?",
                    },
                    {
                        from: "ai",
                        text: "Een gangbare richtlijn is de bovengrens van EFSA en FDA voor gezonde volwassenen: 400 mg per dag, ongeveer vier koppen filterkoffie. Zal ik die nemen?",
                    },
                    { from: "user", text: "Ja, 400" },
                    {
                        from: "ai",
                        text: "Doelen bijgewerkt: 2.000 kcal en 160 g eiwit om te halen, cafeïne onder 400 mg.",
                    },
                    {
                        from: "user",
                        text: "Past er vanavond nog een toetje in?",
                    },
                    {
                        from: "ai",
                        text: "Je zit op 1.540 kcal en 104 g eiwit: nog 460 kcal en 56 g eiwit te gaan tot je doelen. Dus ja, een toetje van zo'n 200 kcal past, zolang de rest vooral eiwit is.",
                    },
                ],
                widget: "goal-progress",
                widgetAfter: 5,
                cardMeals: [
                    "Griekse yoghurt met granola en bessen (1 kom)",
                    "Kipwrap met salade (1 wrap)",
                    "Flat white (1 kop)",
                    "Zalm met rijst en broccoli (1 bord)",
                ],
            },
            {
                id: "review-week",
                title: "Bekijk de week",
                description:
                    "Vraag hoe je week ging en de trendswidget opent in de chat met je gemiddelden en gelogde dagen. Wissel tussen 7, 14 en 30 dagen of tik op een voedingsstof voor een grafiek, zonder nieuw verzoek. Ook je reeksen en dagen op doel kun je opvragen.",
                toolNotes: {
                    get_trends:
                        "Middelt je laatste 7, 14 en 30 dagen en opent de trendswidget",
                },
                messages: [
                    {
                        from: "user",
                        text: "Hoe zijn de afgelopen twee weken gegaan?",
                    },
                    {
                        from: "ai",
                        text: "Je zat de afgelopen 14 dagen gemiddeld op 1.830 kcal per dag (13 daarvan gelogd), 170 onder je doel. Eiwit was je stabielste macro.",
                    },
                ],
                widget: "trends",
                widgetAfter: 1,
            },
            {
                id: "weight-trend",
                title: "Volg je gewicht",
                description:
                    "Log een weging in kg of lb en zie de trend achter de dagelijkse schommelingen: een afgevlakt gemiddelde, de verandering over de maand en de afstand tot je streefgewicht. Een onmogelijke meting, zoals gram als kilo, wordt vóór opslaan geweigerd.",
                toolNotes: {
                    log_weight:
                        "Slaat 78,4 kg op en weigert een fysiek onmogelijke meting",
                    get_weight_trends:
                        "Middelt 30 dagen voortschrijdend, met de afstand tot je doel",
                },
                messages: [
                    {
                        from: "user",
                        text: "Net gewogen: 78,4 kg. Hoe gaat de trend?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg gelogd. Je bent de afgelopen 30 dagen 1,8 kg afgevallen, met een 7-daags gemiddelde van 78,7 kg. Nog 3,4 kg tot je streefgewicht van 75 kg.",
                    },
                ],
                widget: "weight-trends",
                widgetAfter: 1,
            },
            {
                id: "meal-patterns",
                title: "Ontdek je patronen",
                description:
                    "Vraag wanneer je meer eet en het vergelijkt je eigen logs: doordeweeks met het weekend, dagen met en zonder ontbijt, grote lunches, vroeg met laat avondeten. Het markeert ook ongewone dagen en meldt patronen, geen oorzaken.",
                toolNotes: {
                    get_meal_patterns:
                        "Vergelijkt doordeweeks, weekend en tijden van avondeten over 30 dagen",
                },
                messages: [
                    { from: "user", text: "Eet ik meer in het weekend?" },
                    {
                        from: "ai",
                        text: "Niet echt. De afgelopen 30 dagen zit je doordeweeks gemiddeld op 1.986 kcal en in het weekend op 1.977.",
                    },
                    {
                        from: "user",
                        text: "Is er iets dat wel verschil maakt?",
                    },
                    {
                        from: "ai",
                        text: "Het tijdstip van je avondeten. Op dagen met avondeten om 20:00 of later zit je gemiddeld op 2.150 kcal, tegenover 1.915 als je eerder eet.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Ook drankjes bijhouden",
                description:
                    "Alcoholregistratie blijft uit tot je erom vraagt. Kies Amerikaanse standaardglazen of Britse eenheden, en elk drankje wordt omgerekend naar gram alcohol uit hoeveelheid en sterkte. Zet je het later uit, dan blijft alles verborgen, nooit gewist.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Zet alcohol aan, in gram met Britse eenheden erbij",
                    log_meal:
                        "Berekent de alcohol in de pint uit hoeveelheid en sterkte",
                },
                messages: [
                    { from: "user", text: "Ik wil ook bijhouden wat ik drink" },
                    {
                        from: "ai",
                        text: "Prima. Moet het tellen in Amerikaanse standaardglazen of Britse eenheden?",
                    },
                    { from: "user", text: "Britse eenheden" },
                    {
                        from: "ai",
                        text: "Alcoholregistratie staat aan, in gram met Britse eenheden erbij. Het werkt vanaf je volgende bericht, een nieuwe chat is niet nodig.",
                    },
                    {
                        from: "user",
                        text: "Had een pint pils van 4% bij het avondeten",
                    },
                    {
                        from: "ai",
                        text: "Gelogd bij het avondeten: een pint van 568 ml met 4% is 17,9 g alcohol, 2,3 Britse eenheden, ongeveer 180 kcal.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 5,
                cardMeals: ["Pils, 4% (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Neem je geschiedenis mee",
                description:
                    "Overstappen van MyFitnessPal, Cronometer, Lose It! of MacroFactor? Eerst wordt je tijdzone gecheckt, dan je export in de browser omgezet. Niets wordt opgeslagen tot je het voorbeeld bevestigt, en opnieuw hetzelfde bestand importeren geeft geen dubbele maaltijden.",
                toolNotes: {
                    start_meal_import:
                        "Opent de importer in de chat voor je exportbestand",
                    get_profile:
                        "Merkt op dat er nog geen tijdzone is ingesteld",
                    set_timezone:
                        "Stelt America/Chicago in, zodat tijden op de juiste dag vallen",
                },
                messages: [
                    {
                        from: "user",
                        text: "Kun je mijn MyFitnessPal-geschiedenis overzetten?",
                    },
                    {
                        from: "ai",
                        text: "Zeker. Eerst: je tijdzone is niet ingesteld, dus geïmporteerde tijden zouden als UTC worden gelezen. Waar woon je?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Tijdzone ingesteld op America/Chicago. Kies nu je exportbestand in de importer hieronder. Het wordt in je browser gelezen en er wordt niets opgeslagen tot je het voorbeeld bevestigt.",
                    },
                ],
                widget: "import-meals",
                widgetAfter: 3,
            },
            {
                id: "export-data",
                title: "Neem je gegevens mee",
                description:
                    "Eén verzoek pakt al je maaltijden, waterregistraties en wegingen, plus je doelen en instellingen, in een ZIP met CSV-bestanden en een README in eenvoudig Engels. Elk tijdstip noemt zijn tijdzone, en meals.csv importeer je zo weer terug.",
                toolNotes: {
                    export_all_data:
                        "Zipt zes bestanden en geeft een privélink die 60 minuten werkt",
                },
                messages: [
                    {
                        from: "user",
                        text: "Maak een back-up van al mijn gegevens",
                    },
                    {
                        from: "ai",
                        text: "Klaar: één ZIP met 1.204 maaltijden, 318 waterregistraties, 64 wegingen, je doelen en je profielinstellingen. Hier is de downloadlink. Die werkt 60 minuten.",
                    },
                    { from: "user", text: "Kan ik daar later mee herstellen?" },
                    {
                        from: "ai",
                        text: "Je maaltijden wel. meals.csv importeer je zo weer terug, en elke maaltijd die je nog hebt wordt herkend aan zijn id en overgeslagen, dus niets komt dubbel. Water, gewicht, doelen en instellingen zijn alleen te exporteren, dus bewaar de ZIP.",
                    },
                ],
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

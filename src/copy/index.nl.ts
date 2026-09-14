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
            photoAlt:
                "Foto: een smoothiebowl met banaan, bessen en granola, met een americano ernaast",
            pauseLabel: "Demo pauzeren",
            replayLabel: "Demo opnieuw afspelen",
            exchanges: [
                {
                    photo: true,
                    userText: "ontbijt + americano",
                    aiText: "Een smoothiebowl, zo te zien zelfgemaakt. Je had hem tot nu toe op twee manieren: met granola en honing, of alleen met fruit. Welke is dit?",
                    add: {},
                    clock: "08:40",
                },
                {
                    userText: "granola en honing, een volle lepel",
                    aiText: "Helder. En de americano: zwart of met melk?",
                    add: {},
                    clock: "08:40",
                },
                {
                    userText: "scheutje havermelk",
                    aiText: "Dus: de bowl met een handje granola en 1 el honing, en een americano met een scheutje havermelk. Ongeveer 480 kcal en 21 g eiwit. Loggen als ontbijt?",
                    add: {},
                    clock: "08:41",
                },
                {
                    userText: "ja",
                    aiText: "Ontbijt gelogd: 480 kcal, 21 g eiwit en 150 mg cafeïne. Er zit 51 g suiker in, waarvan 17 g uit de honing.",
                    add: {
                        kcal: 480,
                        pro: 21,
                        car: 85,
                        fat: 9,
                        fib: 9,
                        sugar: 51,
                        caf: 150,
                    },
                    clock: "08:41",
                    meal: {
                        description:
                            "Smoothiebowl (Griekse yoghurt, banaan, bessen) met granola (1 handje) en honing (1 el); americano met een scheutje havermelk",
                        type: "breakfast",
                    },
                    card: "meal-logged",
                },
                {
                    userText:
                        "restje wok van gisteravond, zelfde portie. en een flesje water van 500 ml",
                    aiText: "Lunch gelogd, hetzelfde als gisteravond: 620 kcal en 54 g eiwit, plus 500 ml water.",
                    add: {
                        kcal: 620,
                        pro: 54,
                        car: 56,
                        fat: 19,
                        fib: 5,
                        sugar: 8,
                        water: 500,
                    },
                    clock: "12:55",
                    meal: {
                        description:
                            "Roerbakgerecht met kip en rijst (1 bord, restjes van gisteravond)",
                        type: "lunch",
                    },
                },
                {
                    userText: "6 frietjes van mijn kind gejat. niet oordelen",
                    aiText: "Geen oordeel. Ongeveer 90 kcal, gelogd als snack.",
                    add: {
                        kcal: 90,
                        pro: 1,
                        car: 12,
                        fat: 5,
                        fib: 1,
                        sugar: 0,
                    },
                    clock: "16:40",
                    meal: {
                        description: "Patat (6 frietjes)",
                        type: "snack",
                    },
                },
                {
                    userText: "wat kan er nog in bij het avondeten?",
                    aiText: "810 kcal, en er moet nog 84 g eiwit bij. Hou het hartig: suiker zit al op 59 van je 60 g.",
                    add: {},
                    clock: "19:20",
                    card: "nutrition-summary",
                },
                {
                    userText: "en hoe gaat het met mijn gewicht?",
                    aiText: "Sinds 11 feb ben je 1,4 kg afgevallen, ongeveer 0,4 kg per week. Nog 3,8 kg tot je streefgewicht van 75 kg.",
                    add: {},
                    clock: "19:21",
                    card: "weight-trends",
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
        importerAlt: {
            file: "De importer in de chat, stap 1 van 4: kies je geëxporteerde CSV-bestand uit MyFitnessPal, Cronometer, Lose It! of MacroFactor",
            map: "Stap 2 van 4: de kolommen van het bestand zijn automatisch gekoppeld; deze export heeft geen namen van voedingsmiddelen",
            preview:
                "Stap 3 van 4: een voorbeeld van 603 maaltijden, 322.343 kcal, voordat er iets wordt opgeslagen",
            done: "Stap 4 van 4: 603 maaltijden geïmporteerd",
        },
        importerCaption:
            "De schermen van de importer op volgorde; in je chat is het één kaart die zichzelf bijwerkt",
        downloadExpires: "Verloopt over 60 minuten",
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
                        "Zoekt de datum van vandaag op, zodat “rond 7 uur” op 07:00 valt",
                },
                messages: [
                    {
                        from: "user",
                        text: "havermout met blauwe bessen en een bak koffie als ontbijt",
                    },
                    {
                        from: "ai",
                        text: "Hoe groot was de kom, en was de havermout met melk of met water? Zat er iets in de koffie?",
                    },
                    {
                        from: "user",
                        text: "gewone kom, met melk. koffie zwart",
                    },
                    {
                        from: "ai",
                        text: "Ontbijt gelogd: ongeveer 320 kcal, 11 g eiwit en 6 g vezels. Met de koffie zit je op 95 mg van je cafeïnelimiet van 400 mg.",
                    },
                    {
                        from: "user",
                        text: "o ja, en rond 7 uur heb ik zo'n halve liter water gedronken, voor het hardlopen",
                    },
                    {
                        from: "ai",
                        text: "500 ml water toegevoegd om 07:00 vanochtend.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Havermout met melk en blauwe bessen (1 kom) en zwarte koffie (1 kop)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografeer je bord",
                description:
                    "Een foto start een vraaggesprek, geen gok. Het checkt of het zelfgemaakt is of van een restaurant, leest de menukaart voor wat de foto niet laat zien, vraagt hoeveel je at en logt pas als je de samenvatting goedkeurt.",
                toolNotes: {
                    log_meal:
                        "Logt het met de naam van het restaurant, zodra je ja zegt",
                    search_meals:
                        "Kijkt of je daar al eens eerder een maaltijd hebt gelogd",
                },
                messages: [
                    { from: "user", photo: "meal", text: "lunch" },
                    {
                        from: "ai",
                        text: "Lijkt op borsjtsj met zure room en roggebrood, opgediend zoals in een restaurant, niet thuis. Welke zaak was het, en waar?",
                    },
                    { from: "user", text: "Tsybulya, in Podil in Kyiv" },
                    {
                        from: "ai",
                        text: "Hun menukaart gevonden: de borsjtsj wordt gekookt op runderbouillon met salo (gezouten varkensspek), en dat zie je niet op een foto. Er staan geen calorieën bij, dus dit wordt een schatting. Heb je alles op?",
                    },
                    { from: "user", text: "alles, het brood ook" },
                    {
                        from: "ai",
                        text: "Dus: borsjtsj met rundvlees en zure room en een snee roggebrood bij Tsybulya, Podil, Kyiv, helemaal op. Ongeveer 520 kcal en 24 g eiwit. Loggen als lunch?",
                    },
                    { from: "user", text: "ja" },
                    {
                        from: "ai",
                        text: "Lunch gelogd: 520 kcal · 24 g eiwit · 43 g koolhydraten · 27 g vet · 7 g vezels · 10 g suiker. Geschat op basis van hun menukaart, geen gepubliceerde waarden.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: [
                    "Borsjtsj met rundvlees en zure room (1 kom, helemaal op) en roggebrood (1 snee) bij Tsybulya, Podil, Kyiv",
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
                        text: "had ik bij de lunch. hoe erg is het eigenlijk?",
                    },
                    {
                        from: "ai",
                        text: "Dat is een blikje Coca-Cola van 330 ml: 139 kcal en 35 g suiker, volgens Open Food Facts. Heb je het hele blikje op?",
                    },
                    { from: "user", text: "hele blikje" },
                    {
                        from: "ai",
                        text: "Gelogd bij de lunch: 139 kcal, 35 g suiker en 33 mg cafeïne volgens Coca-Cola zelf, want Open Food Facts vermeldt geen cafeïne. En hoe erg: die suiker is in zijn eentje al meer dan de helft van je daglimiet van 60 g, en Open Food Facts geeft het Nutri-Score E en NOVA 4, ultrabewerkt.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
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
                        text: "wil een beetje afvallen. zet me op 2000 kcal en 160 g eiwit. en wat is een verstandige cafeïnegrens? ik leef zo'n beetje op koffie",
                    },
                    {
                        from: "ai",
                        text: "EFSA en de FDA leggen de bovengrens voor gezonde volwassenen op 400 mg per dag, ongeveer vier koppen filterkoffie; bij zwangerschap adviseert de EFSA 200 mg. Zal ik 400 als je limiet instellen?",
                    },
                    { from: "user", text: "ja, 400" },
                    {
                        from: "ai",
                        text: "Klaar: 2.000 kcal en 160 g eiwit om te halen, cafeïne onder 400 mg. De rest blijft zoals het was: 220 g koolhydraten, 70 g vet, 30 g vezels, 2,5 L water en je suikerlimiet van 60 g.",
                    },
                    {
                        from: "user",
                        text: "kan er vanavond nog een toetje in?",
                    },
                    {
                        from: "ai",
                        text: "Ja. Je zit op 1.540 kcal en 104 g eiwit, dus nog 460 kcal en 56 g eiwit te gaan. Suiker is krapper: 40 van je limiet van 60 g, dus Griekse yoghurt met bessen past beter dan taart, en die helpt ook nog met je eiwit.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
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
                        text: "hoe gingen de afgelopen twee weken? voelt alsof het alle kanten op ging",
                    },
                    {
                        from: "ai",
                        text: "Stabieler dan het voelt. Je zat gemiddeld op 1.830 kcal per dag, 170 onder je 2.000, maar daarin telt de ene dag van de 14 die je niet logde als nul. Op de 13 gelogde dagen was het ongeveer 1.970, met 9 dagen binnen 10% van je doel. En je logt nu 10 dagen op rij.",
                    },
                    { from: "user", text: "en suiker?" },
                    {
                        from: "ai",
                        text: "Die moet je in de gaten houden. Gemiddeld 52 g, en op 4 van de 13 dagen zat je boven je limiet van 60 g.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Volg je gewicht",
                description:
                    "Log een weging in kg of lb en zie de trend achter de dagelijkse schommelingen: een afgevlakt gemiddelde, de verandering over de maand en de afstand tot je streefgewicht. Een onmogelijke meting, zoals een vergeten komma, wordt vóór opslaan tegengehouden.",
                toolNotes: {
                    log_weight:
                        "Slaat 78,4 kg op en weigert een fysiek onmogelijke meting",
                    get_weight_trends:
                        "Middelt 30 dagen voortschrijdend, met de afstand tot je doel",
                },
                messages: [
                    { from: "user", text: "net gewogen, 784" },
                    {
                        from: "ai",
                        text: "784 kg kan een lichaam niet wegen, dus ik heb het niet opgeslagen. Bedoelde je 78,4?",
                    },
                    {
                        from: "user",
                        text: "haha ja, komma vergeten. hoe gaat mijn trend?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg opgeslagen. Sinds 11 feb ben je 1,8 kg afgevallen, ongeveer 0,4 kg per week, en je 7-daags gemiddelde is 78,7 kg. Nog 3,4 kg tot je streefgewicht van 75 kg.",
                    },
                ],
                cards: [{ kind: "weight-trends", after: 3 }],
            },
            {
                id: "meal-patterns",
                title: "Ontdek je patronen",
                description:
                    "Vraag wanneer je meer eet en het vergelijkt je eigen logs: doordeweeks met het weekend, dagen met en zonder ontbijt, grote lunches, vroeg met laat avondeten. Het markeert ook ongewone dagen en meldt patronen, geen oorzaken.",
                toolNotes: {
                    get_meal_patterns:
                        "Vergelijkt ontbijt, etenstijd en weekends over 30 dagen",
                },
                messages: [
                    {
                        from: "user",
                        text: "eet ik meer op dagen dat ik mijn ontbijt oversla? voelt wel zo",
                    },
                    {
                        from: "ai",
                        text: "Een beetje, ja. Je logde 28 van de afgelopen 30 dagen en sloeg op 6 daarvan je ontbijt over. Die dagen zaten gemiddeld op 2.215 kcal, tegenover 1.940 op de 22 dagen met ontbijt, en op zo'n 35 g minder eiwit.",
                    },
                    {
                        from: "user",
                        text: "en laat avondeten? op sportdagen eet ik pas om 9 uur",
                    },
                    {
                        from: "ai",
                        text: "Die vallen ook op: de 9 dagen met avondeten om 20:00 of later zaten gemiddeld op 2.165 kcal, tegenover 1.920 op de andere 19. Het zijn allebei patronen in je logs, geen bewijs dat een van beide de oorzaak is.",
                    },
                    { from: "user", text: "en in het weekend?" },
                    {
                        from: "ai",
                        text: "Nauwelijks verschil: in het weekend gemiddeld 2.010 kcal, doordeweeks 1.993.",
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
                    {
                        from: "user",
                        text: "kun je ook mijn drankjes bijhouden? ik wil wat minderen",
                    },
                    {
                        from: "ai",
                        text: "Zeker. Zal ik alcohol tonen in Amerikaanse standaardglazen of in Britse eenheden?",
                    },
                    {
                        from: "user",
                        text: "Britse eenheden, ik woon in Manchester",
                    },
                    {
                        from: "ai",
                        text: "Alcoholregistratie staat aan, in gram met Britse eenheden erbij.",
                    },
                    {
                        from: "user",
                        text: "had een pint pils bij het avondeten",
                    },
                    {
                        from: "ai",
                        text: "Hoe sterk was die? Pils zit meestal op 4 tot 5%, en dat staat op de tap of het blikje.",
                    },
                    { from: "user", text: "4% denk ik" },
                    {
                        from: "ai",
                        text: "Gelogd bij het avondeten: een pint van 568 ml met 4% is 17,9 g alcohol, 2,3 Britse eenheden, ongeveer 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
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
                        "Stelt America/Chicago in, zodat maaltijden in lokale tijd staan",
                },
                messages: [
                    {
                        from: "user",
                        text: "ik stap over van MyFitnessPal. kun je mijn eetdagboek overzetten? ik heb de export al",
                    },
                    {
                        from: "ai",
                        text: "Ja. Eerst één ding: je tijdzone is niet ingesteld, dus geïmporteerde maaltijden zouden op UTC-tijd komen te staan in plaats van je lokale tijd. Waar woon je?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Ingesteld op America/Chicago. Kies nu in de importer hieronder de Nutrition-Summary-CSV uit je MyFitnessPal-export. Die wordt gewoon in je browser gelezen, en er wordt niets opgeslagen tot je het voorbeeld bevestigt.",
                    },
                    {
                        from: "user",
                        text: "de kolommen zijn gekoppeld, maar bij naam voedingsmiddel staat „niet in dit bestand”?",
                    },
                    {
                        from: "ai",
                        text: "Dat is normaal bij MyFitnessPal: de export heeft één rij per maaltijd per dag, met de totalen maar zonder namen van voedingsmiddelen. Elke maaltijd krijgt in plaats daarvan de naam van zijn maaltijdsoort, met calorieën en macro's intact.",
                    },
                    {
                        from: "user",
                        text: "603 maaltijden. er staat dat ze op het middaguur worden gelogd?",
                    },
                    {
                        from: "ai",
                        text: "Klopt, de export heeft datums maar geen tijden. Met het middaguur staat elke maaltijd in Chicago op de juiste dag; je ziet alleen niet wanneer je echt hebt gegeten.",
                    },
                    { from: "user", text: "klaar! is alles erin gekomen?" },
                    {
                        from: "ai",
                        text: "Alles: 603 maaltijden geïmporteerd en geen enkele mislukt.",
                    },
                ],
                cards: [
                    { kind: "import-meals", after: 3, step: "file" },
                    { kind: "import-meals", after: 3, step: "map" },
                    { kind: "import-meals", after: 5, step: "preview" },
                    { kind: "import-meals", after: 7, step: "done" },
                ],
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
                        text: "mijn diëtist wil mijn eetdagboek zien. kun je het eruit halen als spreadsheet?",
                    },
                    {
                        from: "ai",
                        text: "Alsjeblieft: één ZIP met 1.204 maaltijden, 318 waterregistraties en 64 wegingen, plus je doelen en instellingen. Je eetdagboek is meals.csv daarin, en die opent in Excel of Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "kan ik haar niet gewoon de link sturen?",
                    },
                    {
                        from: "ai",
                        text: "Download hem liever en stuur haar het bestand. De link werkt na 60 minuten niet meer, en iedereen die hem heeft kan je hele export openen, gewicht en instellingen inbegrepen, niet alleen je maaltijden.",
                    },
                    {
                        from: "user",
                        text: "goed om te weten. kan ik er later ook mee herstellen als dat nodig is?",
                    },
                    {
                        from: "ai",
                        text: "Je maaltijden wel. meals.csv importeer je zo weer terug, en elke maaltijd die je nog hebt wordt herkend aan zijn id en overgeslagen, dus niets komt dubbel. Water, gewicht, doelen en instellingen zitten alleen voor je eigen administratie in de ZIP; die kun je niet terug importeren.",
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

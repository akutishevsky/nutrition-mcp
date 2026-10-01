// Dutch (nl) translation of IndexDoc for the landing page. See
// src/copy/index.ts for the full type shape and for which fields carry
// trusted HTML (`install.claude.steps`, `install.chatgpt.steps`,
// `install.other.note`, `why.noteHtml`, `faq[].visibleHtml`) — every tag
// there is kept verbatim from the English source. The hero chat and the
// example slides are structured data: `photo`, `card`, `meal.type`, `id`,
// `from`, `download`, `cards` and the `toolNotes` keys are copied verbatim;
// only the words are translated. On-screen UI labels inside the install
// steps (Customize, Connectors, Settings → Apps, …) stay English because
// that is what the Claude and ChatGPT interfaces actually show.
//
// Numbers in the dialogue follow Dutch formatting (a period as thousands
// separator, a comma as decimal separator: 2.000, 78,4) because the widget
// cards beside them render that way; the figures themselves are unchanged.

import type { IndexDoc } from "./index.js";

export const INDEX_NL: IndexDoc = {
    title: "Nutrition MCP — Calorieteller voor Claude & ChatGPT",
    metaDescription:
        "Calorieteller in Claude of ChatGPT: log maaltijden, calorieën en macro's door te praten. Gratis, open source MCP-server met barcodes, gewicht en volledige export.",
    ogDescription:
        "Calorieteller in Claude of ChatGPT: log maaltijden, calorieën en macro's door te praten. Gratis, open source MCP-server met barcodes, gewicht en volledige export.",
    keywords:
        "voedingstracker, maaltijdtracker, MCP-server, Claude AI, ChatGPT, calorieënteller, macrotracker, barcodescanner, eten loggen, dieettracker, gewichtstracker, gewichtslog, AI-voeding, Model Context Protocol",

    hero: {
        titleBeforeEm: "Houd je voeding bij door te ",
        titleEm: "praten",
        titleAfterEm: " met je AI.",
        lead: "Verbind Claude of ChatGPT en zeg gewoon wat je hebt gegeten. Calorieën en macro's, automatisch gelogd.",
        ctaPrimary: "Snel installeren",
        ctaSecondary: "Steun",
        moreExamples: "Meer voorbeelden",
        chat: {
            photoAlt:
                "Foto: een smoothiebowl met banaan, bessen en granola, met een americano ernaast",
            pauseLabel: "Demo pauzeren",
            replayLabel: "Demo opnieuw afspelen",
            exchanges: [
                {
                    photo: true,
                    userText: "ontbijt + americano",
                    aiText: "Een smoothiebowl, zo te zien zelfgemaakt. Je had hem tot nu toe op twee manieren: met granola en honing, of alleen met fruit. Welke is dit?",
                },
                {
                    userText: "granola en honing, een volle lepel",
                    aiText: "Helder. En de americano: zwart of met melk?",
                },
                {
                    userText: "scheutje havermelk",
                    aiText: "Dus: de bowl met een handje granola en 1 el honing, en een americano met een scheutje havermelk. Ongeveer 480 kcal en 21 g eiwit. Loggen als ontbijt?",
                },
                {
                    userText: "ja",
                    aiText: "Ontbijt gelogd: 480 kcal, 21 g eiwit en 150 mg cafeïne. Er zit 51 g suiker in, waarvan 17 g uit de honing.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothiebowl (Griekse yoghurt, banaan, bessen) met granola (1 handje) en honing (1 el); americano met een scheutje havermelk",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "restje wok van gisteravond, zelfde portie. en een flesje water van 500 ml",
                    aiText: "Lunch gelogd, hetzelfde als gisteravond: 620 kcal en 54 g eiwit, plus 500 ml water.",
                },
                {
                    userText: "6 frietjes van mijn kind gejat. niet oordelen",
                    aiText: "Geen oordeel. Ongeveer 90 kcal, gelogd als snack.",
                },
                {
                    userText: "wat kan er nog in bij het avondeten?",
                    aiText: "810 kcal, en er moet nog 84 g eiwit bij. Hou het hartig: suiker zit al op 59 van je 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "en hoe gaat het met mijn gewicht?",
                    aiText: "Sinds 11 feb ben je 1,4 kg afgevallen, ongeveer 0,4 kg per week. Nog 3,8 kg tot je streefgewicht van 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Drie stappen. Geen app om te leren.",
        steps: [
            {
                title: "Eén keer verbinden",
                body: "Werkt met elke AI-client die remote MCP-servers ondersteunt — Claude, ChatGPT en meer. Geen installatie, geen API-sleutels.",
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

    install: {
        title: "Verbind in minder dan een minuut",
        sub: "Werkt met elke MCP-client die OAuth 2.0 met PKCE ondersteunt. Bij de eerste verbinding maak je een account aan met Google of een e-mailadres en wachtwoord; log op dezelfde manier in om je gegevens te behouden.",
        copyAriaLabel: "Server-URL kopiëren",
        tabsLabel: "Kies je AI-client",
        claude: {
            cta: "Toevoegen aan Claude",
            steps: [
                "Klik op de directorypagina op <strong>Connect</strong> en ga daarna verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
            note: "Werkt op elk Claude-abonnement, ook het gratis abonnement. Wil je het liever handmatig toevoegen, gebruik dan Customize → Connectors → Add custom connector met https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Open <strong>ChatGPT op het web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klik onderaan de popup op <strong>Create app</strong>. Zie je die niet, zet dan <strong>Developer mode</strong> aan bij <strong>Advanced settings</strong>.",
                "Geef het een naam, bijvoorbeeld <strong>Nutrition</strong>.",
                "Plak bij <strong>Connection</strong> <code>https://nutrition-mcp.com/mcp</code>.",
                "Kies bij <strong>Authentication</strong> voor <strong>OAuth</strong> — laat de rest ongewijzigd.",
                'Vink <strong>"I understand and want to continue"</strong> aan.',
                "Klik op <strong>Create</strong>.",
                "Klik op <strong>Sign in with Nutrition</strong> — de inlogpagina opent; ga verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
        },
        other: {
            note: "Voeg de configuratie hierboven toe aan je client (Cursor, VS Code, Claude Code en meer). Windsurf gebruikt <code>serverUrl</code> in plaats van <code>url</code>. Voer in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> uit. Je client handelt de OAuth-login automatisch af.",
        },
        otherTabLabel: "Andere clients",
    },

    onboarding: {
        title: "Eén keer instellen — of begin gewoon te praten",
        sub: "Dit is volledig optioneel — Nutrition MCP werkt zodra je verbonden bent. Als je wilt, maken deze drie korte stappen het nauwkeuriger, maar je kunt ook meteen beginnen met loggen.",
        justSay: "Zeg gewoon ",
        steps: [
            {
                title: "Stel je tijdzone in",
                body: "zodat dagen om middernacht in jouw tijdzone overgaan en de totalen van vandaag altijd kloppen, waar je ook bent.",
                say: "Zet mijn tijdzone op New York",
            },
            {
                title: "Stel je doelen in",
                body: "dagelijkse doelen voor calorieën, macro's en water, plus een optioneel streefgewicht en je gewenste gewichtseenheid (kg of lb), om je voortgang tegen af te zetten.",
                say: "Zet mijn dagelijkse doel op 2.000 calorieën en 150 g eiwit",
            },
            {
                title: "Stel je taal in",
                body: "de taal waarin in-chat widgets (dashboards, grafieken) worden getoond, niet wat de AI je terugschrijft.",
                say: "Toon mijn widgets in het Duits",
            },
            {
                title: "Begin met loggen",
                body: "zeg gewoon wat je hebt gegeten, stuur een foto of scan een barcode. Dat is alles.",
                say: "Ik had havermout met bessen als ontbijt",
            },
        ],
        note: "Dit alles is optioneel. Je kunt het nu doen, later, of nooit — begin gewoon met loggen en stel dit in wanneer je wilt.",
        toolsCta: {
            heading: "Benieuwd wat het écht allemaal kan?",
            body: "Bekijk alle 36 tools — loggen, barcodes, water, gewicht, doelen en trends — met een beschrijving en een voorbeeldzin voor elk.",
            arrow: "Bekijk de tools",
        },
    },

    examples: {
        title: "Praat er gewoon tegen.",
        sub: "Een paar dingen die je kunt doen — gewoon door te praten.",
        prevLabel: "Vorig voorbeeld",
        nextLabel: "Volgend voorbeeld",
        pickerLabel: "Kies een voorbeeld",
        carouselLabel: "Voorbeelden",
        threadLabel: "Gesprek",
        moreToolsLabel: "Gebruikt ook",
        toolLinkLabel: "{tool} op de toolspagina",
        photoMealAlt:
            "Foto: een kom borsjtsj met een schepje zure room en dille, met een snee roggebrood ernaast",
        photoPackageAlt:
            "Foto: de barcode op een blikje Coca-Cola, nummer 5449000000996",
        downloadExpires: "Verloopt over 60 minuten",
        slides: [
            {
                id: "log-meal",
                title: "In gewone woorden loggen",
                description:
                    "Zeg het zoals je het een vriend zou vertellen. Ontbreekt de portie of de maaltijd, dan wordt eerst gevraagd en pas daarna geschat. Vezels en suiker staan bij elke invoer, cafeïne bij alles waar het in zit, en “vanochtend” valt in jouw tijdzone.",
                toolNotes: {
                    log_meal:
                        "Slaat het ontbijt op met macro's, vezels, suiker en de cafeïne van de koffie",
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
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Havermout met melk en blauwe bessen (1 kom) en zwarte koffie (1 kop)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografeer je bord",
                description:
                    "Een foto start een gesprek, geen gok. Er wordt gevraagd of de maaltijd zelfgemaakt was of uit een restaurant kwam, je eerdere logs worden nagekeken op wat de foto niet laat zien, je krijgt de vraag hoeveel je in gewone maten at, en er wordt pas gelogd als je de samenvatting goedkeurt.",
                toolNotes: {
                    search_meals:
                        "Vindt je eerdere borsjtsj bij Tsybulya en wat erin zat",
                    log_meal:
                        "Logt het met de naam van het restaurant, zodra je ja zegt",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "lunch",
                    },
                    {
                        from: "ai",
                        text: "Lijkt op borsjtsj met zure room en een snee roggebrood. Zelfgemaakt, of uit een restaurant? Als het een restaurant was, welk?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, in Podil in Kyiv",
                    },
                    {
                        from: "ai",
                        text: "Je hebt al twee keer borsjtsj bij Tsybulya gelogd, beide keren de versie met rundvlees en zure room. Weer dezelfde? En heb je de kom en het brood helemaal op?",
                    },
                    {
                        from: "user",
                        text: "zelfde, alles op, het brood ook",
                    },
                    {
                        from: "ai",
                        text: "Dus: borsjtsj met rundvlees en zure room (1 kom, helemaal op) en roggebrood (1 snee) bij Tsybulya, Podil, Kyiv. Ongeveer 520 kcal en 24 g eiwit, geschat, geen gepubliceerde waarden. Loggen als lunch?",
                    },
                    {
                        from: "user",
                        text: "ja",
                    },
                    {
                        from: "ai",
                        text: "Lunch gelogd: 520 kcal · 24 g eiwit · 43 g koolhydraten · 27 g vet · 7 g vezels · 10 g suiker.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Borsjtsj met rundvlees en zure room (1 kom, helemaal op) en roggebrood (1 snee) bij Tsybulya, Podil, Kyiv",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scan een barcode",
                description:
                    "Fotografeer de verpakking: de cijfers onder de barcode worden opgezocht in Open Food Facts, en er volgt de vraag hoeveel je had. Open Food Facts vermeldt geen cafeïne, dus die komt van het etiket of uit gangbare hoeveelheden; ontbreken vezels of suiker, dan worden die geschat in plaats van leeg gelaten.",
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
                    {
                        from: "user",
                        text: "hele blikje",
                    },
                    {
                        from: "ai",
                        text: "Gelogd bij de lunch: 139 kcal, 35 g suiker en 33 mg cafeïne volgens het etiket van het blikje, want Open Food Facts vermeldt geen cafeïne. En hoe erg: die suiker is in zijn eentje al meer dan de helft van je daglimiet van 60 g, en Open Food Facts geeft het Nutri-Score E en NOVA 4, ultrabewerkt.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
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
                        text: "Voor gezonde volwassenen leggen EFSA en de FDA de grens op maximaal 400 mg per dag, ongeveer vier koppen filterkoffie, en bij zwangerschap adviseert de EFSA 200 mg. De limiet bepaal jij; wil je 400?",
                    },
                    {
                        from: "user",
                        text: "ja, 400",
                    },
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
                        text: "Je zit op 1.540 kcal en 104 g eiwit, dus nog 460 kcal en 56 g eiwit te gaan. Suiker is krapper: 40 van je limiet van 60 g, dus nog 20 g over. Cafeïne staat op 130 van 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Bekijk de week",
                description:
                    "Vraag hoe je week ging en de trendkaart opent in de chat met je gemiddelden en gelogde dagen. Wissel tussen 7, 14 en 30 dagen of tik op een voedingsstof voor een grafiek, zonder nieuw verzoek. Ook je reeksen en dagen op doel kun je opvragen.",
                toolNotes: {
                    get_trends:
                        "Middelt je laatste 7, 14 en 30 dagen en opent de trendkaart",
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
                    {
                        from: "user",
                        text: "en suiker?",
                    },
                    {
                        from: "ai",
                        text: "Die moet je in de gaten houden. Gemiddeld 52 g, en op 4 van de 13 dagen zat je boven je limiet van 60 g.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Volg je gewicht",
                description:
                    "Log een weging in kg of lb en zie de trend achter de dagelijkse schommelingen: een afgevlakt gemiddelde, de verandering over de maand en de afstand tot je streefgewicht. Een onmogelijke meting, zoals een vergeten komma, wordt vóór opslaan tegengehouden.",
                toolNotes: {
                    log_weight:
                        "Weigert 784 kg als onwaarschijnlijk en slaat daarna 78,4 kg op",
                    get_weight_trends:
                        "Vlakt 30 dagen af tot voortschrijdende gemiddelden en de afstand tot je doel",
                },
                messages: [
                    {
                        from: "user",
                        text: "net gewogen, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg valt buiten het aannemelijke bereik voor lichaamsgewicht (20–500 kg), dus er is niets opgeslagen. Bedoelde je 78,4 kg?",
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
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Ontdek je patronen",
                description:
                    "Vraag wanneer je meer eet, en je eigen logs worden vergeleken: doordeweeks met het weekend, dagen met en zonder ontbijt, grote lunches, vroeg met laat avondeten. Ongewone dagen worden ook gemarkeerd, en je krijgt patronen te zien, geen oorzaken.",
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
                    {
                        from: "user",
                        text: "en in het weekend?",
                    },
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
                    "Alcohol blijft verborgen tot je de registratie aanzet. Kies Amerikaanse standaardglazen of Britse eenheden, en elk drankje wordt omgerekend naar gram alcohol uit hoeveelheid en sterkte. Zet je het later weer uit, dan wordt alcohol weer verborgen; het wordt niet gewist.",
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
                    {
                        from: "user",
                        text: "4% denk ik",
                    },
                    {
                        from: "ai",
                        text: "Gelogd bij het avondeten: een pint van 568 ml met 4% is 17,9 g alcohol, 2,3 Britse eenheden, ongeveer 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Pils, 4% (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Neem je geschiedenis mee",
                description:
                    "Overstappen van MyFitnessPal, Cronometer, Lose It! of MacroFactor? De importer opent in de chat, leest en koppelt je export in de browser, slaat niets op tot je een voorbeeld bevestigt, en maakt geen maaltijd dubbel als je hetzelfde bestand opnieuw importeert met dezelfde tijdzone. Een ontbrekende tijdzone wordt gemeld voordat je begint.",
                toolNotes: {
                    start_meal_import:
                        "Opent de importer in de chat voor je exportbestand",
                    set_timezone:
                        "Stelt America/Chicago in, zodat maaltijden in lokale tijd staan",
                },
                messages: [
                    {
                        from: "user",
                        text: "ik stap over van myfitnesspal. kun je mijn eetdagboek overzetten? ik heb de export al",
                    },
                    {
                        from: "ai",
                        text: "De importer staat hieronder open. Eén ding voordat je het bestand kiest: in je account is geen tijdzone ingesteld, dus tijden zouden als UTC worden gelezen. Waar woon je?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Ingesteld op America/Chicago. Kies nu de Nutrition-Summary-CSV uit je MyFitnessPal-export. Die wordt gewoon in je browser gelezen, en er wordt niets opgeslagen tot je het voorbeeld bevestigt.",
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
                        text: "603 maaltijden. er staat dat ze om 12 uur 's middags worden ingevoerd?",
                    },
                    {
                        from: "ai",
                        text: "Klopt, de export heeft datums maar geen tijdstippen van maaltijden, dus elke maaltijd wordt op 12:00 lokale tijd gezet. Zo staat elke maaltijd in Chicago op de juiste dag; je ziet alleen niet wanneer je echt hebt gegeten.",
                    },
                    {
                        from: "user",
                        text: "klaar! is alles erin gekomen?",
                    },
                    {
                        from: "ai",
                        text: "Alles: 603 maaltijden geïmporteerd en geen enkele mislukt.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Neem je gegevens mee",
                description:
                    "Eén verzoek pakt alles wat over je is opgeslagen — maaltijden, water, wegingen, doelen, profielinstellingen, je accountgegevens, gebruikstelemetrie en app-koppelingen — in een ZIP met CSV-bestanden en een README. Tijdstippen staan in jouw tijdzone, en meals.csv importeer je zo weer terug.",
                toolNotes: {
                    export_all_data:
                        "Zipt acht CSV-bestanden en een README achter een link die 60 minuten werkt",
                },
                messages: [
                    {
                        from: "user",
                        text: "mijn diëtist wil mijn eetdagboek zien. kun je het eruit halen als spreadsheet?",
                    },
                    {
                        from: "ai",
                        text: "Alsjeblieft: één ZIP met 1.204 maaltijden, 318 waterregistraties en 64 wegingen, plus je doelen, profielinstellingen, accountgegevens, telemetrie over toolgebruik en app-koppelingen. Je eetdagboek is meals.csv daarin, en die opent in Excel of Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "kan ik haar niet gewoon de link sturen?",
                    },
                    {
                        from: "ai",
                        text: "Download hem liever en stuur haar het bestand. De link werkt na 60 minuten niet meer, en iedereen die hem heeft kan je hele export openen — gewicht, accountgegevens en instellingen inbegrepen, niet alleen je maaltijden.",
                    },
                    {
                        from: "user",
                        text: "goed om te weten. kan ik er later ook mee herstellen als dat nodig is?",
                    },
                    {
                        from: "ai",
                        text: "Je maaltijden wel. meals.csv gebruikt de kolomnamen van de importer zelf, dus die gaat zo weer terug, en maaltijden die al in je log staan worden herkend en overgeslagen, dus niets komt dubbel. De andere bestanden zijn alleen voor je eigen administratie; die kun je niet terug importeren.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Ergens ontbijt, ergens anders avondeten.",
        sub: "Live voedingsstatistieken over alle Nutrition MCP-accounts — calorieën, voedingslogs, macro's en gewichtsverlies — elke vijf seconden ververst.",
        liveLabel: "Live",
        unitGroupLabel: "Eenheden",
        unitMetricLabel: "Metrisch",
        unitImperialLabel: "Imperiaal",
        unitKgLabel: "Metrisch (kg)",
        unitLbLabel: "Imperiaal (lb)",
        refreshBefore: "Ververst elke 5 s · volgende over ",
        refreshAfter: "s",
        sinceOpenLabel: "sinds je deze pagina opende",
        calCaption: "Calorieën gelogd",
        cards: {
            foodLogs: "Voedingslogs",
            protein: "Eiwit gelogd",
            carbs: "Koolhydraten gelogd",
            fat: "Vet gelogd",
            weightLost: "Afgevallen sinds 2 juli 2026",
            water: "Water gelogd",
        },
        foodLogsUnit: { one: "log", other: "logs" },
        timezonesAfter:
            " tijdzones · dagen gaan over om ieders eigen middernacht",
        mapNote: "stipgrootte = aandeel profielen",
        mapAriaLabel:
            "Wereldkaart van de tijdzones die in profielen zijn ingesteld, elke tijdzone pas getoond zodra minstens drie profielen die gebruiken",
        foot: "Totalen over alle accounts, bijgewerkt zodra maaltijden worden gelogd. Individuele gegevens worden nooit getoond.",
    },

    features: {
        title: "Wat je kunt bijhouden",
        cards: [
            {
                title: "Maaltijden in gewone taal",
                body: "Omschrijf wat je hebt gegeten — je AI schat calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne in milligram, en logt het.",
            },
            {
                title: "Scan een barcode",
                body: "Maak een foto van een productbarcode of typ hem, en haal macro's, vezels en suiker op bij Open Food Facts, geschaald naar hoeveel je hebt gegeten.",
            },
            {
                title: "Doelen & voortgang",
                body: "Stel dagelijkse doelen in voor calorieën, macro's, vezels en water — plus limieten voor suiker, cafeïne en alcohol — en bekijk live je voortgang daarop.",
            },
            {
                title: "Overzichten & trends",
                body: "Dagelijkse en wekelijkse uitsplitsingen, trends over 7/14/30 dagen, streaks en terugkerende maaltijdpatronen.",
            },
            {
                title: "Water loggen",
                body: "Houd je hydratatie in milliliters bij naast je maaltijden en bekijk het per dag.",
            },
            {
                title: "Gewicht bijhouden",
                body: "Log je lichaamsgewicht in kg of lb, bekijk trends over 7/14/30 dagen en volg de voortgang naar een streefgewicht.",
            },
            {
                title: "Tijdzonebewust",
                body: "Dagen gaan over in jouw lokale tijd, waar je ook bent in de wereld.",
            },
            {
                title: "Importeren uit een andere app",
                body: "Neem je maaltijdgeschiedenis over uit MyFitnessPal, Cronometer, Lose It! of MacroFactor — of elke andere CSV, door de kolommen zelf te koppelen. Jij bevestigt wat wordt toegevoegd voordat er iets wordt opgeslagen.",
            },
            {
                title: "Exporteer & bezit je gegevens",
                body: "Neem alles wat we over je bewaren — maaltijden, water, gewicht, doelen en profiel, plus je accountgegevens, gebruikstelemetrie en gekoppelde apps — mee als één ZIP met CSV-bestanden. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren. Verwijder je account en gegevens wanneer je maar wilt.",
            },
        ],
    },

    why: {
        title: "Praten wint van tikken.",
        sub: "Scan een barcode of zeg gewoon wat je hebt gegeten — geen database om in te graven, geen aparte app om te openen.",
        oldHeading: "Traditionele apps",
        oldItems: [
            "Doorzoek een database voor elk item",
            "Corrigeer foute database-vermeldingen met de hand",
            "Wéér een app om te openen, vaak achter een betaalmuur",
            "Vervelend handmatig loggen",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Omschrijf maaltijden in gewone taal",
            "Calorieën & macro's voor je geschat",
            "Werkt binnen Claude of ChatGPT, gratis",
            "Vraag om trends, overzichten en doelen",
        ],
        noteHtml:
            'Stap je over van een specifieke app? Bekijk hoe Nutrition MCP zich verhoudt tot <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer en andere trackers</a>.',
    },

    trust: [
        {
            label: "Privé, standaard",
            small: "Nooit verkocht, gedeeld of gebruikt voor advertenties.",
        },
        { label: "Open source", small: "Controleer het of host het zelf." },
        {
            label: "Exporteer wanneer je wilt",
            small: "Alles wat we opslaan, als CSV in één ZIP.",
        },
        {
            label: "Direct verwijderen",
            small: "Verwijder je account & gegevens.",
        },
    ],

    support: {
        title: "Help het draaiende houden.",
        sub: "Nutrition MCP is gratis en reclamevrij. Patreon dekt de server- en databasekosten.",
        updatesTitle: "Laatste nieuws van Patreon",
        updatesBadge: "Gratis",
        updatesNote: "Gratis te lezen — geen lidmaatschap nodig.",
        updatesPrevLabel: "Vorige update",
        updatesNextLabel: "Volgende update",
        updatesDotLabel: "Update",
        postLinkLabel: "Lees op Patreon",
        free: {
            tier: "Gratis lid",
            price: "$0",
            desc: "Blijf op de hoogte — nieuws en updates over de server, nieuwe tools, en wat eraan komt.",
            cta: "Volg op Patreon",
        },
        paid: {
            tier: "Betalend lid",
            price: "Betaal wat je wilt",
            desc: "Draag bij aan hosting- en databasekosten. Het is een gift, geen aankoop — het ontgrendelt niets, en alles blijft gratis voor iedereen.",
            cta: "Word supporter",
        },
    },

    cta: {
        title: "Begin binnen een minuut met bijhouden.",
        sub: "Gratis en open source — het werkt met de AI die je al gebruikt.",
        primary: "Snel installeren",
        secondary: "Star op GitHub",
    },

    contact: {
        title: "Vragen of feedback?",
        sub: "Een bug gevonden, een functiewens, of gewoon een vraag? Mail me rechtstreeks — ik lees elk bericht.",
        cta: "Stuur een e-mail",
    },

    faqSection: {
        title: "Veelgestelde vragen",
    },
    faq: [
        {
            question: "Wat is Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP is een gratis, open source Model Context Protocol (MCP)-server die van Claude, ChatGPT of een andere MCP-client een calorieteller en macrotracker maakt. In plaats van een voedingsdatabase te doorzoeken, vertel je je AI wat je hebt gegeten en die legt de calorieën, macro's, vezels, suikers en cafeïne vast in je eigen eetdagboek.",
        },
        {
            question: "Wat is het Model Context Protocol (MCP)?",
            visibleHtml:
                "Het Model Context Protocol is een open standaard waarmee AI-assistenten zoals Claude en ChatGPT verbinding kunnen maken met externe tools en gegevensbronnen. Een MCP-server biedt specifieke mogelijkheden — hier voedingstracking — die de AI tijdens een gesprek kan gebruiken. Zie het als een pluginsysteem voor AI-assistenten.",
        },
        {
            question: "Hoe tel ik calorieën met Claude of ChatGPT?",
            visibleHtml:
                "Verbind Nutrition MCP één keer — in Claude via de connectordirectory, in ChatGPT als custom app met de server-URL — en log in. Vertel je AI daarna in je eigen woorden wat je hebt gegeten, laat een foto van de maaltijd zien of geef een productbarcode. Je AI schat de calorieën, eiwitten, koolhydraten, vetten, vezels en suikers, en Nutrition MCP slaat de registratie op in je eetdagboek. Vraag op elk moment naar je totalen van vandaag, je weektrends of je voortgang richting je doelen.",
        },
        {
            // Het zichtbare antwoord laat de server-URL bewust weg (die staat
            // al elders op de pagina); het JSON-LD-antwoord, dat op zichzelf
            // door zoekmachines wordt gelezen, noemt hem expliciet. Dit
            // verschil bestond al in de Engelse bron — hier onveranderd
            // overgenomen in plaats van stilzwijgend gelijkgetrokken.
            question: "Werkt het met ChatGPT?",
            visibleHtml:
                "Ja. Open in ChatGPT op het web Settings → Apps, maak een custom app aan met de server-URL via OAuth, en log in. Voor een custom app heb je de Developer mode van ChatGPT nodig, die OpenAI bij sommige ChatGPT-abonnementen aanbiedt.",
            jsonLdText:
                "Ja. Open in ChatGPT op het web Settings → Apps, maak een custom app aan met de server-URL https://nutrition-mcp.com/mcp via OAuth, en log in. Voor een custom app heb je de Developer mode van ChatGPT nodig, die OpenAI bij sommige ChatGPT-abonnementen aanbiedt.",
        },
        {
            question: "Welke andere clients worden ondersteund?",
            visibleHtml:
                "Elke MCP-client die OAuth 2.0 met PKCE ondersteunt — waaronder Claude.ai, de Claude desktop- en mobiele apps, Claude Code, Cursor, Windsurf en VS Code.",
        },
        {
            question: "Kan ik het zelf hosten?",
            visibleHtml:
                'Ja. Nutrition MCP is open source (MIT). Je kunt je eigen instantie draaien met je eigen Supabase-project — de <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-repository</a> bevat een volledige zelfhostingshandleiding en een Dockerfile.',
        },
        {
            question: "Is Nutrition MCP gratis?",
            visibleHtml:
                "Ja, het is volledig gratis — geen betaalde laag, geen advertenties, geen verborgen kosten. Je hebt een AI-app nodig die MCP-connectors ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je aanmaakt wanneer je voor het eerst verbindt. Vrijwillige donaties op Patreon helpen de serverkosten te dekken en ontgrendelen niets.",
        },
        {
            question: "Wat kan ik bijhouden?",
            visibleHtml:
                "Calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en water voor elke registratie — omschreven in gewone taal of opgehaald via een productbarcode met Open Food Facts. Cafeïne wordt ook bijgehouden, in milligram, de eenheid die elk label gebruikt, en het levert geen calorieën. Alcohol kan ook worden bijgehouden, in gram zuivere ethanol; het wordt getoond zodra je alcoholregistratie aanzet. Je kunt ook je lichaamsgewicht loggen in kg of lb en trends volgen richting een streefgewicht. Bekijk dagelijkse overzichten, vraag maaltijden op per periode, werk eerdere registraties bij of verwijder ze, stel doelen in, en volg trends in de tijd.",
        },
        {
            question: "Hoe nauwkeurig zijn de calorieën?",
            visibleHtml:
                "Het zijn schattingen. Voor een maaltijd die je beschrijft of fotografeert, schat je AI de cijfers; bij een barcode komen ze uit de etiketgegevens van het product in Open Food Facts, die je AI omrekent naar de hoeveelheid die je hebt gegeten. Beide kunnen fout zijn, dus controleer alles wat ertoe doet — je kunt elke registratie corrigeren of verwijderen door het gewoon te vragen. Nutrition MCP is een hulpmiddel om te loggen, geen medisch of voedingsadvies: overleg met een arts of diëtist voordat je beslissingen over je gezondheid neemt, zeker als je zwanger bent, een medische aandoening hebt of een eetstoornis hebt gehad.",
        },
        {
            question: "Houdt het alcohol bij?",
            visibleHtml:
                "Ja, als je ervoor kiest: alcoholregistratie staat standaard uit, en alcohol blijft verborgen in je maaltijden, doelen en overzichten tot je het aanzet. Daarna worden drankjes getoond in gram zuivere ethanol en als Amerikaanse standaardglazen of Britse eenheden, wat je voorkeur heeft. Niets leidt alcohol voor je af: het wordt alleen vastgelegd uit een drankje dat je logt of een alcoholkolom in een bestand dat je importeert, en een drankje dat je logt wordt ook opgeslagen als de registratie uit staat. Zet je het weer uit, dan wordt alcohol weer verborgen en leest de importer geen alcoholkolommen meer — het is geen verwijderschakelaar, en je export bevat altijd wat je hebt gelogd. Wil je een alcoholwaarde verwijderen, verwijder dan de maaltijd waar die bij hoort.",
        },
        {
            question:
                "Kan ik mijn geschiedenis importeren uit MyFitnessPal of een andere app?",
            visibleHtml:
                "Ja. Vraag om je geschiedenis te importeren en er opent een importvenster in de chat: je kiest de CSV die je oude app heeft geëxporteerd, controleert hoe de kolommen worden gekoppeld, en ziet wat er wordt toegevoegd voordat je bevestigt. Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden automatisch herkend, en elke andere CSV werkt door de kolommen zelf te koppelen. Je browser leest het bestand, dus de AI typt je regels nooit over. In clients zonder in-chat-panelen kun je je export in plaats daarvan plakken — en hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone tussendoor niet is veranderd.",
        },
        {
            question: "Zijn mijn gegevens privé?",
            visibleHtml:
                'Je registraties worden opgeslagen in de EU en gekoppeld aan je eigen account, dat je bereikt via de AI-apps die je verbindt. Nutrition MCP verkoopt je gegevens nooit, deelt ze nooit met derden en gebruikt ze nooit voor advertenties; de startpagina toont alleen anonieme totalen over de hele site. Wat je AI via de tools leest, wordt naar de aanbieder van die AI gestuurd op grond van je eigen overeenkomst met die aanbieder. Je kunt op elk moment alles exporteren wat we over je opslaan, of je account en al je gegevens verwijderen — het <a href="/privacy" data-link="privacy">privacybeleid</a> geeft de details.',
        },
    ],
};

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
        "calorieteller, calorieën tellen, calorieën bijhouden, macro's bijhouden, eetdagboek, voedingsdagboek, MCP-server, Claude AI, ChatGPT, macrotracker, barcodescanner, eten loggen, gewicht bijhouden, MyFitnessPal alternatief, AI-voeding, Model Context Protocol",

    hero: {
        titleBeforeEm: "Houd je voeding bij door te ",
        titleEm: "praten",
        titleAfterEm: " met je AI.",
        lead: "Verbind Claude of ChatGPT en zeg gewoon wat je hebt gegeten. Calorieën en macro's worden automatisch gelogd.",
        ctaPrimary: "Snel installeren",
        ctaSecondary: "Steun ons",
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
                    aiText: "Een smoothiebowl, zo te zien zelfgemaakt. Je hebt hem eerder op twee manieren gegeten: met granola en honing, of alleen met fruit. Welke is het?",
                },
                {
                    userText: "granola en honing, een volle lepel",
                    aiText: "Helder. En de americano: enkel of dubbel, met melk?",
                },
                {
                    userText: "dubbel, scheutje havermelk",
                    aiText: "Dus: de bowl met een handje granola en 1 el honing, en een dubbele americano met een scheutje havermelk. Ongeveer 480 kcal en 21 g eiwit. Zal ik het loggen?",
                },
                {
                    userText: "ja",
                    aiText: "Ontbijt gelogd: 480 kcal, 21 g eiwit en 126 mg cafeïne. Toegevoegde suiker zit op 20 van je limiet van 25 g, vooral door de honing; de rest van de 51 g totale suiker komt uit fruit en yoghurt.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothiebowl (1 bowl: Griekse yoghurt, banaan, bessen) met granola (1 handje) en honing (1 el); americano (dubbele shot) met een scheutje havermelk",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "lunch: restje wok van gisteravond, zelfde portie. en een flesje water van 500 ml",
                    aiText: "Lunch gelogd, hetzelfde als gisteravond: 620 kcal en 54 g eiwit, plus 500 ml water.",
                    meal: {
                        description:
                            "Restje wok (1 portie, zelfde als gisteravond)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "snack: 6 frietjes van mijn kind gejat. niet oordelen",
                    aiText: "Ik oordeel niet. Ongeveer 50 kcal, gelogd als snack.",
                    meal: {
                        description:
                            "Friet (6 stuks, van het bord van mijn kind)",
                        type: "snack",
                    },
                },
                {
                    userText: "wat kan er nog in bij het avondeten?",
                    aiText: "Nog 850 kcal en 84 g eiwit te gaan. Toegevoegde suiker zit op 23 van je limiet van 25 g, en het meeste van de 59 g totale suiker van vandaag komt uit fruit.",
                    card: "nutrition-summary",
                },
                {
                    userText: "en hoe gaat het met mijn gewicht?",
                    aiText: "Sinds 11 februari ben je 1,4 kg afgevallen, van 80,2 naar 78,8 kg. Nog 3,8 kg tot je streefgewicht van 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Drie stappen. Geen app die je hoeft te leren.",
        steps: [
            {
                title: "Eén keer verbinden",
                body: "Werkt met elke AI-client die remote MCP-servers ondersteunt, zoals Claude en ChatGPT. Geen installatie, geen API-sleutels.",
            },
            {
                title: "Zeg gewoon wat je hebt gegeten",
                body: "Omschrijf het in gewone taal, of stuur een foto van je maaltijd, een screenshot uit een bezorgapp of een barcode (het product wordt online opgezocht). Je macro's worden automatisch gelogd.",
            },
            {
                title: "Bijhouden & bekijken",
                body: "Vraag om dagoverzichten, weektrends of je voortgang richting je doelen, of exporteer alles wat je hebt gelogd als CSV-bestanden. Helemaal gratis.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "In minder dan een minuut verbonden",
        sub: "Werkt met elke MCP-client die OAuth 2.0 met PKCE ondersteunt. Bij de eerste verbinding maak je een account aan met Google of een e-mailadres en wachtwoord; log daarna steeds op dezelfde manier in, zodat je bij je gegevens blijft.",
        copyAriaLabel: "Server-URL kopiëren",
        tabsLabel: "Kies je AI-client",
        claude: {
            cta: "Toevoegen aan Claude",
            steps: [
                "Klik op de directorypagina op <strong>Connect</strong> en ga daarna verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
            note: "Werkt met elk Claude-abonnement, ook het gratis abonnement. Liever handmatig toevoegen? Gebruik dan Customize → Connectors → Add custom connector met https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Open <strong>ChatGPT op het web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klik onder in de pop-up op <strong>Create app</strong>. Zie je die niet, zet dan <strong>Developer mode</strong> aan bij <strong>Advanced settings</strong>.",
                "Geef het een naam, bijvoorbeeld <strong>Nutrition</strong>.",
                "Plak bij <strong>Connection</strong> <code>https://nutrition-mcp.com/mcp</code>.",
                "Kies bij <strong>Authentication</strong> voor <strong>OAuth</strong> en laat de rest zoals het is.",
                'Vink <strong>"I understand and want to continue"</strong> aan.',
                "Klik op <strong>Create</strong>.",
                "Klik op <strong>Sign in with Nutrition</strong>. De inlogpagina opent; ga verder met Google of log in met een e-mailadres en wachtwoord.",
                "Klaar. Het werkt meteen en verschijnt automatisch in je iOS- en Android-apps.",
            ],
        },
        other: {
            note: "Voeg de configuratie hierboven toe aan je client (Cursor, VS Code, Claude Code en meer). Windsurf gebruikt <code>serverUrl</code> in plaats van <code>url</code>. Voer in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> uit. Je client regelt het inloggen via OAuth automatisch.",
        },
        otherTabLabel: "Andere clients",
    },

    onboarding: {
        title: "Eén keer instellen, of gewoon meteen praten",
        sub: "Dit is helemaal optioneel: Nutrition MCP werkt zodra je verbonden bent. Wil je het nauwkeuriger, dan helpen deze drie korte stappen, maar je kunt ook meteen gaan loggen.",
        justSay: "Zeg gewoon ",
        steps: [
            {
                title: "Stel je tijdzone in",
                body: "zodat een nieuwe dag begint om middernacht in jouw tijdzone en je totalen van vandaag kloppen, waar je ook bent.",
                say: "Zet mijn tijdzone op New York",
            },
            {
                title: "Stel je doelen in",
                body: "dagelijkse doelen voor calorieën, macro's en water, plus een optioneel streefgewicht en je gewenste gewichtseenheid (kg of lb), om je voortgang aan af te meten.",
                say: "Zet mijn dagelijkse doel op 2.000 calorieën en 150 g eiwit",
            },
            {
                title: "Stel je taal in",
                body: "de taal van de widgets in de chat (dashboards, grafieken), niet de taal waarin de AI je antwoordt.",
                say: "Toon mijn widgets in het Duits",
            },
            {
                title: "Begin met loggen",
                body: "zeg gewoon wat je hebt gegeten, stuur een foto of scan een barcode. Dat is alles.",
                say: "Ik had havermout met bessen als ontbijt",
            },
        ],
        note: "Dit is allemaal optioneel. Doe het nu, later of nooit: begin met loggen en stel het in wanneer het jou uitkomt.",
        toolsCta: {
            heading: "Benieuwd wat het écht allemaal kan?",
            body: "Bekijk alle 46 tools (loggen, barcodes, water, gewicht en lichaamsmaten, doelen en trends), elk met een beschrijving en een voorbeeldzin.",
            arrow: "Bekijk de tools",
        },
    },

    examples: {
        title: "Zeg het gewoon.",
        sub: "Een paar dingen die je kunt doen, alleen door te praten.",
        prevLabel: "Vorig voorbeeld",
        nextLabel: "Volgend voorbeeld",
        pickerLabel: "Kies een voorbeeld",
        carouselLabel: "Voorbeelden",
        carouselRoleDescription: "carrousel",
        threadLabel: "Gesprek",
        moreToolsLabel: "Gebruikt ook",
        toolLinkLabel: "{tool} op de toolspagina (opent in een nieuw tabblad)",
        photoMealAlt:
            "Foto: een kom borsjtsj met een schepje zure room en dille, met een snee roggebrood ernaast",
        photoPackageAlt:
            "Foto: de barcode op een bakje Griekse yoghurt naturel, nummer 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "In gewone woorden loggen",
                description:
                    "Zeg het zoals je het een vriend zou vertellen. Ontbreekt de portie of om welke maaltijd het gaat, dan volgt eerst een vraag en pas daarna een schatting. Vezels, suiker en toegevoegde suiker staan bij elke registratie, cafeïne bij alles waar het in zit, en “rond 7 uur” valt op 07:00 in jouw tijdzone.",
                toolNotes: {
                    log_meal:
                        "Slaat het ontbijt op met macro's, vezels, suiker, toegevoegde suiker en de cafeïne van de koffie",
                    log_water:
                        "Telt de 500 ml van 07:00 mee bij je water van vandaag",
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
                        text: "500 ml water toegevoegd, vanochtend om 07:00.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
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
                    "Een foto is het begin van een gesprek, geen gok. Eerst komt de vraag of de maaltijd zelfgemaakt was of uit een restaurant kwam. Daarna worden je eerdere logs erbij gepakt voor wat de foto niet laat zien, volgt de vraag hoeveel je at in gewone maten, en wordt er pas gelogd als je de samenvatting goedkeurt.",
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
                        text: "Dit lijkt borsjtsj met zure room en een snee roggebrood. Zelfgemaakt of uit een restaurant? Als het een restaurant was, welk?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, in Podil in Kyiv",
                    },
                    {
                        from: "ai",
                        text: "Je hebt al twee keer borsjtsj bij Tsybulya gelogd, beide keren met rundvlees, zure room en een snee roggebrood, ongeveer 520 kcal. Weer hetzelfde? En heb je de kom en het brood helemaal op?",
                    },
                    {
                        from: "user",
                        text: "zelfde, alles op, het brood ook",
                    },
                    {
                        from: "ai",
                        text: "Dus: borsjtsj met rundvlees en zure room (1 kom, helemaal op) en roggebrood (1 snee) bij Tsybulya, Podil, Kyiv. Net als vorige keer ongeveer 520 kcal en 24 g eiwit; dat zijn schattingen, geen gepubliceerde waarden. Zal ik het loggen?",
                    },
                    {
                        from: "user",
                        text: "ja",
                    },
                    {
                        from: "ai",
                        text: "Gelogd. Dat is 520 van je 2.000 kcal voor vandaag, nog 1.480 te gaan.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
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
                    "Fotografeer de verpakking: de cijfers onder de barcode worden opgezocht in Open Food Facts, en er volgt de vraag hoeveel je ervan nam. Toegevoegde suiker wordt overgenomen waar Open Food Facts die vermeldt. Open Food Facts vermeldt geen cafeïne, dus die komt van het etiket of uit gangbare hoeveelheden; ontbreken vezels, suiker of toegevoegde suiker, dan worden die geschat in plaats van leeg gelaten.",
                toolNotes: {
                    lookup_barcode:
                        "Haalt de etiketwaarden en de Nutri-Score van het bakje op uit Open Food Facts",
                    log_meal:
                        "Registreert het hele bakje als ontbijt, omgerekend van de waarden per 100 g",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "had ik bij het ontbijt. is dit goed?",
                    },
                    {
                        from: "ai",
                        text: "Dat is een bakje Griekse yoghurt naturel van 150 g (0% vet): 87 kcal, 15 g eiwit en 5 g suiker, waarvan niets toegevoegd, en Open Food Facts geeft het Nutri-Score A. Heb je het hele bakje gegeten?",
                    },
                    {
                        from: "user",
                        text: "het hele bakje",
                    },
                    {
                        from: "ai",
                        text: "Geregistreerd als ontbijt: 87 kcal, 15 g eiwit en 5 g suiker. Nog 145 g eiwit te gaan vandaag.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Griekse yoghurt naturel 0% (bakje van 150 g)"],
            },
            {
                id: "goals-progress",
                title: "Doelen stellen, stand checken",
                description:
                    "Stel doelen in om te halen, zoals calorieën en eiwit, en limieten om onder te blijven, voor toegevoegde suiker, totale suiker, alcohol en cafeïne; alleen wat je noemt, verandert. Vraag daarna naar een willekeurige dag en zie wat er nog over is tot elk doel en waar je staat ten opzichte van elke limiet.",
                toolNotes: {
                    set_nutrition_goals:
                        "Slaat het calorie- en eiwitdoel op, plus een cafeïnelimiet van 400 mg",
                    get_goal_progress:
                        "Zet vandaag naast elk doel en elke limiet, in een kaart in de chat",
                },
                messages: [
                    {
                        from: "user",
                        text: "wil een beetje afvallen. zet me op 2000 kcal en 160 g eiwit. en wat is een verstandige cafeïnegrens? ik leef zo'n beetje op koffie",
                    },
                    {
                        from: "ai",
                        text: "Voor gezonde volwassenen leggen EFSA en de FDA de grens op maximaal 400 mg per dag, ongeveer vier koppen filterkoffie, en bij zwangerschap adviseert EFSA 200 mg. De limiet bepaal jij; wil je 400?",
                    },
                    {
                        from: "user",
                        text: "ja, 400",
                    },
                    {
                        from: "ai",
                        text: "Klaar: 2.000 kcal en 160 g eiwit om te halen, cafeïne onder de 400 mg. De rest blijft zoals het was: 220 g koolhydraten, 70 g vet, 30 g vezels, 2,5 L water, je limiet van 25 g toegevoegde suiker en je streefgewicht van 75 kg.",
                    },
                    {
                        from: "user",
                        text: "kan er vanavond nog een toetje in?",
                    },
                    {
                        from: "ai",
                        text: "Je zit op 1.540 van 2.000 kcal en 104 van 160 g eiwit, dus nog 460 kcal en 56 g eiwit te gaan. Toegevoegde suiker staat op 16 g van je limiet van 25 g en cafeïne op 130 van 400 mg, allebei eronder.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Bekijk de week",
                description:
                    "Vraag hoe je week ging, en de trendkaart opent in de chat met je gemiddelde calorieën en macro's naast je doelen en het aantal dagen dat je hebt gelogd. Wissel tussen 7, 14 en 30 dagen zonder nieuwe vraag. Je kunt ook je reeksen opvragen en hoeveel dagen je op doel zat.",
                toolNotes: {
                    get_trends:
                        "Berekent je gemiddelden over de laatste 7, 14 en 30 dagen en opent de trendkaart",
                },
                messages: [
                    {
                        from: "user",
                        text: "hoe gingen de afgelopen twee weken? voelt alsof het alle kanten op ging",
                    },
                    {
                        from: "ai",
                        text: "Je hebt 13 van de 14 dagen gelogd, de laatste 10 op rij, en op 9 daarvan zat je binnen 10% van je doel van 2.000 kcal. Gemiddeld kwam je op 1.830 kcal per dag, maar daarin telt de dag die je oversloeg mee als nul.",
                    },
                    {
                        from: "user",
                        text: "en suiker?",
                    },
                    {
                        from: "ai",
                        text: "Toegevoegde suiker was gemiddeld 22 g per dag, onder je limiet van 25 g, maar op 5 van de 13 dagen zat je erboven. Totale suiker was gemiddeld 52 g, vooral uit fruit en melk.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Volg gewicht en lichaamsmaten",
                description:
                    "Log een weegmoment in kg of lb en zie de trend achter de dagelijkse schommelingen: een afgevlakt gemiddelde, de verandering over de maand en de afstand tot je streefgewicht. Omtrekmaten van negen lichaamsdelen, van taille tot kuit, log je ernaast in cm of inch. Een onmogelijke meting, zoals een vergeten komma, wordt tegengehouden voordat hij wordt opgeslagen.",
                toolNotes: {
                    log_weight: "Slaat de weging van vanochtend op: 78,4 kg",
                    get_weight_trends:
                        "Vlakt dagelijkse schommelingen af tot een trendgewicht en een tempo per week, met de afstand tot je doel",
                    log_body_measurement: "Slaat de tailleomtrek van 84 cm op",
                    get_body_measurements:
                        "Zoekt de vorige taillemeting op om mee te vergelijken",
                },
                messages: [
                    {
                        from: "user",
                        text: "vanochtend 78,4 kg. hoe ziet mijn trend eruit?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg opgeslagen. Sinds 11 feb ben je 1,8 kg afgevallen (van 80,2 kg), en je 7-daags gemiddelde is 78,7 kg. Nog 3,4 kg tot je streefgewicht van 75 kg.",
                    },
                    {
                        from: "user",
                        text: "mijn taille was trouwens 84 cm. hoe verhoudt dat zich tot vorige keer?",
                    },
                    {
                        from: "ai",
                        text: "Tailleomtrek van 84 cm opgeslagen. De vorige meting was 86,5 cm op 14 feb, dus dat is 2,5 cm minder.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Ontdek je patronen",
                description:
                    "Vraag wanneer je meer eet, en je eigen logs worden vergeleken: doordeweekse dagen met het weekend, dagen met en zonder ontbijt, grote lunches, vroeg tegenover laat avondeten. Ongewone dagen worden ook gemarkeerd, en je krijgt patronen te zien, geen oorzaken.",
                toolNotes: {
                    get_meal_patterns:
                        "Vergelijkt over 30 dagen ontbijt, tijdstip van het avondeten en weekenddagen",
                },
                messages: [
                    {
                        from: "user",
                        text: "eet ik meer op dagen dat ik mijn ontbijt oversla? voelt wel zo",
                    },
                    {
                        from: "ai",
                        text: "Een beetje, ja. Je logde 28 van de afgelopen 30 dagen en sloeg op 6 daarvan je ontbijt over. Die dagen zaten gemiddeld op 2.215 kcal en 88 g eiwit, tegenover 1.940 kcal en 123 g op de 22 dagen met ontbijt.",
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
                    "Alcohol blijft verborgen tot je de alcoholregistratie aanzet. Kies Amerikaanse standaardglazen of Britse eenheden, en elk drankje wordt op basis van hoeveelheid en sterkte omgerekend naar gram alcohol. Zet je het later weer uit, dan wordt alcohol weer verborgen; het wordt niet gewist.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Zet alcohol aan, getoond in gram met Britse eenheden erbij",
                    log_meal:
                        "Logt de pint met de alcohol als gram ethanol (568 ml × 4% × 0,789)",
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
                        text: "britse eenheden, ik woon in manchester",
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
                        text: "Hoe sterk was die? Pils zit meestal tussen 4 en 5%; het staat op de tap of op het blikje.",
                    },
                    {
                        from: "user",
                        text: "4% denk ik",
                    },
                    {
                        from: "ai",
                        text: "Gelogd als avondeten: een pint van 568 ml van 4% is 17,9 g alcohol, 2,3 Britse eenheden, ongeveer 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Pils, 4% (1 pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Neem je geschiedenis mee",
                description:
                    "Overstappen van MyFitnessPal, Cronometer, Lose It! of MacroFactor? De importer opent in de chat, leest en koppelt je export in de browser, slaat niets op tot je een voorbeeld bevestigt, en voegt geen maaltijd dubbel toe als je hetzelfde bestand opnieuw importeert met dezelfde tijdzone. Is je tijdzone nog niet ingesteld, dan wordt dat eerst geregeld, zodat elke maaltijd op de juiste dag valt.",
                toolNotes: {
                    get_profile:
                        "Laat zien dat er in het account nog geen tijdzone is ingesteld",
                    set_timezone:
                        "Stelt America/Chicago in, zodat maaltijden in lokale tijd staan",
                    start_meal_import:
                        "Opent de importer in de chat voor je exportbestand",
                    bulk_import_meals:
                        "Slaat de bevestigde rijen op in batches van maximaal 50; al geïmporteerde rijen worden overgeslagen",
                },
                messages: [
                    {
                        from: "user",
                        text: "ik stap over van myfitnesspal. kun je mijn eetdagboek overzetten? ik heb de export al",
                    },
                    {
                        from: "ai",
                        text: "Voordat ik de importer open: in je account is geen tijdzone ingesteld, dus de datums in je export zouden als UTC worden gelezen en maaltijden kunnen op de verkeerde dag belanden. Wil je die eerst instellen? In welke tijdzone zit je?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Tijdzone ingesteld op America/Chicago, en de importer staat hierboven open: kies daar je MyFitnessPal-exportbestand. Het wordt direct in je browser gelezen, en er wordt niets opgeslagen tot je het voorbeeld bevestigt.",
                    },
                    {
                        from: "user",
                        text: "de kolommen zijn gekoppeld, maar bij naam voedingsmiddel staat “niet in dit bestand”?",
                    },
                    {
                        from: "ai",
                        text: "Dat is normaal bij MyFitnessPal: de export heeft één rij per maaltijd per dag, met de totalen maar zonder namen van voedingsmiddelen. Rijen zonder naam krijgen de naam van de app waar ze vandaan komen, en hun calorieën en macro's komen ongewijzigd mee.",
                    },
                    {
                        from: "user",
                        text: "603 maaltijden. er staat dat ze om 12 uur 's middags worden gelogd?",
                    },
                    {
                        from: "ai",
                        text: "Klopt, de export heeft datums maar geen tijdstippen, dus elke maaltijd wordt op 12:00 lokale tijd gezet. Zo staat elke maaltijd in Chicago op de juiste dag; je ziet alleen niet wanneer je echt hebt gegeten.",
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
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Neem je gegevens mee",
                description:
                    "Met één verzoek krijg je alles wat over je is opgeslagen (maaltijden, opgeslagen maaltijden en hun ingrediënten, water, weegmomenten, lichaamsmaten, doelen, profielinstellingen, je accountgegevens, gebruikstelemetrie en app-koppelingen) in een ZIP met CSV-bestanden en een README. Tijdstippen staan in jouw tijdzone, en meals.csv importeer je zo weer terug.",
                toolNotes: {
                    export_all_data:
                        "Zet alle CSV-bestanden en een README in een ZIP, achter een link die 60 minuten geldig is",
                },
                messages: [
                    {
                        from: "user",
                        text: "mijn diëtist wil mijn eetdagboek zien. kun je het exporteren als spreadsheet?",
                    },
                    {
                        from: "ai",
                        text: "Klaar. De ZIP bevat 1.204 maaltijden, 318 waterregistraties en 64 gewichtsregistraties, plus je voedingsdoelen, profielinstellingen, accountgegevens, telemetrie over toolgebruik en app-koppelingen. Je eetdagboek zit erin als meals.csv.",
                        link: "Download je export (link 60 minuten geldig)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Ergens ontbijt, ergens anders avondeten.",
        sub: "Live voedingsstatistieken van alle Nutrition MCP-accounts: calorieën, voedingslogs, macro's en gewichtsverlies, elke vijf seconden bijgewerkt.",
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
            " tijdzones · de dag begint om ieders eigen middernacht",
        mapNote: "stipgrootte = aandeel profielen",
        mapAriaLabel:
            "Wereldkaart van de tijdzones die in profielen zijn ingesteld; een tijdzone wordt pas getoond zodra minstens drie profielen hem gebruiken",
        foot: "Totalen over alle accounts, bijgewerkt zodra maaltijden worden gelogd. Individuele gegevens worden nooit getoond.",
    },

    features: {
        title: "Wat je kunt bijhouden",
        cards: [
            {
                title: "Maaltijden in gewone taal",
                body: "Omschrijf wat je hebt gegeten: je AI schat calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, toegevoegde suiker en cafeïne (in milligram) en logt het.",
            },
            {
                title: "Scan een barcode",
                body: "Fotografeer of typ de barcode van een product en haal macro's, vezels en suiker op uit Open Food Facts (ook toegevoegde suiker, waar die vermeld staat), omgerekend naar hoeveel je hebt gegeten.",
            },
            {
                title: "Doelen & voortgang",
                body: "Stel dagdoelen in voor calorieën, macro's, vezels en water, plus limieten voor toegevoegde suiker, totale suiker, cafeïne en alcohol om onder te blijven, en volg live je voortgang.",
            },
            {
                title: "Overzichten & trends",
                body: "Overzichten per dag en per week, trends over 7/14/30 dagen, reeksen en terugkerende maaltijdpatronen.",
            },
            {
                title: "Water loggen",
                body: "Houd naast je maaltijden bij hoeveel je drinkt, in milliliters, en bekijk het per dag.",
            },
            {
                title: "Gewicht bijhouden",
                body: "Log je lichaamsgewicht in kg of lb, bekijk je afgevlakte trendgewicht en tempo per week over je hele geschiedenis en volg je voortgang richting een streefgewicht. Omtrekmaten van negen lichaamsdelen, van taille tot kuit, log je ernaast in cm of inch.",
            },
            {
                title: "In je eigen tijdzone",
                body: "Een nieuwe dag begint in jouw lokale tijd, waar ter wereld je ook bent.",
            },
            {
                title: "Importeren uit een andere app",
                body: "Neem je maaltijdgeschiedenis over uit MyFitnessPal, Cronometer, Lose It! of MacroFactor, of uit elk ander CSV-bestand door zelf de kolommen te koppelen. Jij bevestigt wat er wordt toegevoegd voordat er iets wordt opgeslagen.",
            },
            {
                title: "Exporteer je gegevens: ze zijn van jou",
                body: "Neem alles mee wat we over je bewaren (maaltijden, opgeslagen maaltijden en hun ingrediënten, water, gewicht, lichaamsmaten, doelen en profiel, plus je accountgegevens, gebruikstelemetrie en gekoppelde apps) als één ZIP met CSV-bestanden. Voorlopig kun je alleen maaltijden weer importeren. Verwijder je account en gegevens wanneer je wilt.",
            },
        ],
    },

    why: {
        title: "Praten wint van tikken.",
        sub: "Scan een barcode of zeg gewoon wat je hebt gegeten: geen database doorspitten, geen aparte app openen.",
        oldHeading: "Traditionele apps",
        oldItems: [
            "Voor elk item een database doorzoeken",
            "Foute databasevermeldingen met de hand corrigeren",
            "Wéér een app om te openen, vaak achter een betaalmuur",
            "Omslachtig handmatig loggen",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Maaltijden omschrijven in gewone taal",
            "Calorieën en macro's worden voor je geschat",
            "Werkt gratis in Claude of ChatGPT",
            "Trends, overzichten en doelen opvragen",
        ],
        noteHtml:
            'Stap je over van een bepaalde app? Bekijk hoe Nutrition MCP zich verhoudt tot <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer en andere trackers</a>.',
    },

    trust: [
        {
            label: "Standaard privé",
            small: "Nooit verkocht, gedeeld of gebruikt voor advertenties.",
        },
        { label: "Open source", small: "Controleer de code of host het zelf." },
        {
            label: "Exporteer wanneer je wilt",
            small: "Alles wat we opslaan, als CSV in één ZIP.",
        },
        {
            label: "Direct verwijderen",
            small: "Verwijder je account en gegevens.",
        },
    ],

    support: {
        title: "Help mee om het draaiende te houden.",
        sub: "Nutrition MCP is gratis en reclamevrij. Patreon dekt de server- en databasekosten.",
        updatesTitle: "Nieuw op Patreon",
        updatesBadge: "Gratis",
        updatesNote: "Gratis te lezen, geen lidmaatschap nodig.",
        updatesPrevLabel: "Vorige update",
        updatesNextLabel: "Volgende update",
        updatesDotLabel: "Update",
        postLinkLabel: "Lees op Patreon",
        free: {
            tier: "Gratis lid",
            price: "$0",
            desc: "Blijf op de hoogte van nieuws en updates over de server, nieuwe tools en wat er gaat komen.",
            cta: "Volg op Patreon",
        },
        paid: {
            tier: "Betalend lid",
            price: "Betaal wat je wilt",
            desc: "Heb je iets aan Nutrition MCP? Dan kun je helpen met de kosten voor hosting en database. Iedereen krijgt dezelfde functies, supporters ook, en het blijft gratis voor iedereen.",
            cta: "Word supporter",
        },
    },

    cta: {
        title: "Begin binnen een minuut met bijhouden.",
        sub: "Gratis en open source, en het werkt met de AI die je al gebruikt.",
        primary: "Snel installeren",
        secondary: "Geef een ster op GitHub",
    },

    contact: {
        title: "Vragen of feedback?",
        sub: "Een bug gevonden, een idee voor een functie of gewoon een vraag? Mail me rechtstreeks, ik lees elk bericht.",
        cta: "Stuur een e-mail",
    },

    faqSection: {
        title: "Veelgestelde vragen",
    },
    faq: [
        {
            question: "Wat is Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP is een gratis, open source Model Context Protocol (MCP)-server die van Claude, ChatGPT of een andere MCP-client een calorieteller en macrotracker maakt. In plaats van een voedingsdatabase te doorzoeken, vertel je je AI wat je hebt gegeten en die legt de calorieën, macro's, vezels, suiker, toegevoegde suiker en cafeïne vast in je eigen eetdagboek.",
        },
        {
            question: "Wat is het Model Context Protocol (MCP)?",
            visibleHtml:
                "Het Model Context Protocol is een open standaard waarmee AI-assistenten zoals Claude en ChatGPT verbinding kunnen maken met externe tools en gegevensbronnen. Een MCP-server biedt specifieke functies (hier: voeding bijhouden) die de AI tijdens een gesprek kan gebruiken. Zie het als een pluginsysteem voor AI-assistenten.",
        },
        {
            question: "Hoe tel ik calorieën met Claude of ChatGPT?",
            visibleHtml:
                "Verbind Nutrition MCP één keer (in Claude via de connectordirectory, in ChatGPT als custom app met de server-URL) en log in. Vertel je AI daarna in je eigen woorden wat je hebt gegeten, laat een foto van de maaltijd zien of geef een productbarcode. Je AI schat de calorieën, eiwit, koolhydraten, vet, vezels, suiker en toegevoegde suiker, en Nutrition MCP slaat de registratie op in je eetdagboek. Vraag op elk moment naar je totalen van vandaag, je weektrends of je voortgang richting je doelen.",
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
                "Elke MCP-client die OAuth 2.0 met PKCE ondersteunt, waaronder Claude.ai, de desktop- en mobiele apps van Claude, Claude Code, Cursor, Windsurf en VS Code.",
        },
        {
            question: "Kan ik het zelf hosten?",
            visibleHtml:
                'Ja. Nutrition MCP is open source (MIT). Je kunt je eigen instantie draaien met je eigen Supabase-project; de <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-repository</a> bevat een volledige handleiding voor zelf hosten en een Dockerfile.',
        },
        {
            question: "Is Nutrition MCP gratis?",
            visibleHtml:
                "Ja, het is volledig gratis: geen betaald abonnement, geen advertenties, geen verborgen kosten. Je hebt een AI-app nodig die MCP-connectors ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je aanmaakt wanneer je voor het eerst verbinding maakt. Vrijwillige donaties op Patreon helpen de serverkosten te dekken en ontgrendelen niets.",
        },
        {
            question: "Wat kan ik bijhouden?",
            visibleHtml:
                "Calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, toegevoegde suiker en water voor elke registratie, omschreven in gewone taal of via een productbarcode opgehaald uit Open Food Facts. Cafeïne wordt ook bijgehouden, in milligram (de eenheid die op elk etiket staat), en levert geen calorieën op. Alcohol kan ook worden bijgehouden, in gram zuivere ethanol; het wordt getoond zodra je alcoholregistratie aanzet. Je kunt ook je lichaamsgewicht loggen in kg of lb en trends volgen richting een streefgewicht. Ook lichaamsmaten (taille, heupen, nek, borst, schouders, bovenarm, onderarm, dij en kuit) kun je in cm of inch loggen. Bekijk dagoverzichten, vraag maaltijden op over een periode, pas eerdere registraties aan of verwijder ze, stel doelen in en volg trends door de tijd.",
        },
        {
            question: "Hoe nauwkeurig zijn de calorieën?",
            visibleHtml:
                "Het zijn schattingen. Voor een maaltijd die je beschrijft of fotografeert, schat je AI de cijfers; bij een barcode komen ze uit de etiketgegevens van het product in Open Food Facts, die je AI omrekent naar de hoeveelheid die je hebt gegeten. Beide kunnen fout zijn, dus controleer alles wat ertoe doet: je kunt elke registratie corrigeren of verwijderen door het te vragen. Nutrition MCP is een hulpmiddel om te loggen, geen medisch of voedingsadvies: overleg met een arts of diëtist voordat je beslissingen over je gezondheid neemt, zeker als je zwanger bent, een medische aandoening hebt of een eetstoornis hebt gehad.",
        },
        {
            question: "Houdt het alcohol bij?",
            visibleHtml:
                "Ja, als je ervoor kiest: alcoholregistratie staat standaard uit, en alcohol blijft verborgen in je maaltijden, doelen en overzichten tot je het aanzet. Daarna worden drankjes getoond in gram zuivere ethanol en als Amerikaanse standaardglazen of Britse eenheden, naar keuze. Er wordt nooit alcohol voor je afgeleid: het wordt alleen vastgelegd uit een drankje dat je logt of een alcoholkolom in een bestand dat je importeert, en een drankje dat je logt wordt ook opgeslagen als de registratie uit staat. Zet je het weer uit, dan wordt alcohol weer verborgen en leest de importer geen alcoholkolommen meer. Het is geen verwijderknop, en je export bevat altijd wat je hebt gelogd. Wil je een alcoholwaarde verwijderen, verwijder dan de maaltijd waar die bij hoort.",
        },
        {
            question:
                "Kan ik mijn geschiedenis importeren uit MyFitnessPal of een andere app?",
            visibleHtml:
                "Ja. Vraag om je geschiedenis te importeren en er opent een importvenster in de chat: je kiest de CSV die je oude app heeft geëxporteerd, controleert hoe de kolommen worden gekoppeld, en ziet wat er wordt toegevoegd voordat je bevestigt. Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden automatisch herkend, en elke andere CSV werkt door de kolommen zelf te koppelen. Je browser leest het bestand, dus de AI typt je rijen nooit over. In clients die geen panelen in de chat tonen, plak je in plaats daarvan je export. Hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone tussendoor niet is veranderd.",
        },
        {
            question: "Zijn mijn gegevens privé?",
            visibleHtml:
                'Je registraties worden opgeslagen in de EU en gekoppeld aan je eigen account, dat je bereikt via de AI-apps die je verbindt. Nutrition MCP verkoopt je gegevens nooit, deelt ze nooit met derden en gebruikt ze nooit voor advertenties; de startpagina toont alleen anonieme totalen over de hele site. Wat je AI via de tools leest, wordt naar de aanbieder van die AI gestuurd op grond van je eigen overeenkomst met die aanbieder. Je kunt op elk moment alles exporteren wat we over je opslaan, of je account en al je gegevens verwijderen. Alle details staan in het <a href="/privacy" data-link="privacy">privacybeleid</a>.',
        },
    ],
};

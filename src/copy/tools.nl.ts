// Dutch (nl) translation of ToolsDoc for /tools. See src/copy/tools.ts for
// the structural types (TOOLS, BADGE_META, CategoryId, BadgeKind) — those
// stay untranslated and shared across every locale. Only this file's
// prose is new. Tool names, parameter names, and category slugs are never
// translated; see tools.ts's header comment for the full reasoning.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_NL: ToolsDoc = {
    meta: {
        title: "Toolreferentie: alle 36 tools",
        description:
            "Alle 36 tools die de Nutrition MCP-server aan je AI geeft — maaltijden loggen, barcodes scannen, je geschiedenis uit een andere app importeren, water en gewicht bijhouden, doelen instellen en trends bekijken. Volledige referentie met beschrijvingen en voorbeeldzinnen.",
        ogDescription:
            "Alle 36 tools die de Nutrition MCP-server aan je AI geeft, inclusief een CSV-importer voor je geschiedenis uit een andere app — met beschrijvingen en voorbeeldzinnen.",
    },
    hero: {
        eyebrow: "Referentie",
        title: "Alles wat je AI kan doen",
        lead: "Je roept deze tools nooit rechtstreeks aan — je praat gewoon, en de assistent kiest de juiste tool. Hier is de volledige set die de Nutrition MCP-server aanbiedt, met wat elke tool doet en een zin die hem activeert.",
        countBold: "36 tools",
        countTail: "verdeeld over 7 categorieën",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Loggen",
            title: "Eten & maaltijden loggen",
            description:
                "De kern — leg vast wat je hebt gegeten, hoe je het ook omschrijft.",
        },
        "reviewing-your-meals": {
            pillLabel: "Bekijken",
            title: "Je maaltijden bekijken",
            description:
                "Kijk terug op wat je hebt gelogd, één dag of een hele periode tegelijk.",
        },
        water: {
            pillLabel: "Water",
            title: "Water",
            description: "Houd je hydratatie bij naast je eten.",
        },
        weight: {
            pillLabel: "Gewicht",
            title: "Gewicht",
            description:
                "Log weegmomenten, bekijk ze terug en volg de trend richting je streefgewicht.",
        },
        "goals-progress": {
            pillLabel: "Doelen",
            title: "Doelen & voortgang",
            description:
                "Stel doelen in en zie hoe elke dag zich daartoe verhoudt.",
        },
        "insights-trends": {
            pillLabel: "Inzichten",
            title: "Inzichten & trends",
            description:
                "Vooraf berekende analyses, zodat de AI patronen kan herkennen zonder zelf te rekenen.",
        },
        "settings-account": {
            pillLabel: "Instellingen",
            title: "Instellingen & account",
            description:
                "Voorkeuren die alles kloppend houden, plus volledige controle over je gegevens.",
        },
    },
    badges: {
        log: "Loggen",
        widget: "Interactieve UI",
        lookup: "Opzoeken",
        import: "Importeren",
        edit: "Bewerken",
        remove: "Verwijderen",
        view: "Bekijken",
        export: "Exporteren",
        setting: "Instelling",
    },
    ui: {
        parametersLabel: "Parameters",
        requiredLabel: "vereist",
        optionalLabel: "optioneel",
        trySayingLabel: "Probeer te zeggen",
    },
    tools: {
        log_meal: {
            description:
                "Log wat je hebt gegeten met calorieën en macro's — plus vezels, totale suikers, alcohol en cafeïne wanneer die cijfers bekend zijn. Omschrijf het in gewone taal — de AI schat de cijfers, vraagt naar de portiegrootte als dat onduidelijk is, en kan eerst labelgegevens ophalen via een barcode of het web.",
            params: {
                description: "Wat er is gegeten",
                meal_type: "ontbijt, lunch, diner of snack",
                calories: "Totaal aantal calorieën",
                protein_g: "Eiwit in gram",
                carbs_g: "Koolhydraten in gram",
                fat_g: "Vet in gram",
                fiber_g:
                    "Voedingsvezels in gram. De AI krijgt de instructie dit bij elke maaltijd in te vullen, geschat aan de hand van de ingrediënten als er geen labelwaarde is, want een leeg veld is geen nul — het laat de hele dag buiten je vezelgemiddelde vallen",
                sugar_g:
                    '<b>Totale</b> suikers in gram — het cijfer dat op een label onder "Suikers" staat, inclusief de suiker die van nature in fruit en zuivel zit, niet alleen toegevoegde suiker. Wordt op dezelfde voorwaarden als vezels bij elke maaltijd ingevuld',
                alcohol_g:
                    "Gram <b>zuivere ethanol</b>, niet het volume van de drank en niet het alcoholpercentage — de AI berekent dit op basis van de schenkmaat en sterkte (een flesje bier van 330 ml met 5% is 13 g)",
                caffeine_mg:
                    "Cafeïne in <b>milligram</b>, niet gram — het enige veld hier dat niet in gram is, omdat elk label en elke richtlijn het zo vermeldt (een gezette koffie is ongeveer 95 mg, een espresso 63 mg, een blikje cola 34 mg). Cafeïne levert geen calorieën. In tegenstelling tot vezels en suiker wordt dit alleen doorgegeven bij dingen die echt cafeïne bevatten — een genoteerde 0 zou een cafeïneregel op je dashboard zetten voor een voedingsstof die je nooit binnenkrijgt",
                logged_at:
                    "Wanneer je het gegeten hebt, als dat niet nu is — hiermee log je iets achteraf",
                notes: "Extra notities",
            },
            example:
                "Log een kip-burritobowl met extra guacamole voor de lunch",
            photoHint:
                "…of maak gewoon een foto van je bord — de AI benoemt elk gerecht, schat de porties in alledaagse maten (een glas, een handvol), checkt hoe je het eerder hebt gelogd en bevestigt met jou voordat het gelogd wordt.",
        },
        lookup_barcode: {
            description:
                "Haal de labelvoeding van een verpakt product op bij Open Food Facts via de barcode (8–14 cijfers, EAN/UPC). Je kunt de cijfers typen of ze van een foto van de verpakking laten aflezen; het resultaat kan daarna gelogd worden, geschaald naar hoeveel je hebt gegeten.",
            params: {},
            example: "Scan deze barcode: 3017620422003",
            photoHint:
                "…of stuur een foto van de verpakking — de AI leest de barcodecijfers eraf.",
        },
        start_meal_import: {
            description:
                "Open een importer in de chat om je geschiedenis over te zetten uit een andere app — kies het bestand dat je hebt geëxporteerd uit MyFitnessPal, Cronometer, Lose It! of MacroFactor, koppel de kolommen aan calorieën, macro's, vezels, suiker en cafeïne — plus alcohol als je alcoholregistratie hebt aangezet — en bekijk wat er wordt toegevoegd voordat je bevestigt. Het bestand wordt in je browser gelezen, er wordt niets opgeslagen tot je de preview goedkeurt, en hetzelfde bestand nog eens importeren levert geen dubbele regels op.",
            params: {},
            example: "Importeer mijn maaltijdgeschiedenis uit MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Voeg in één keer een reeks eerdere maaltijden toe — tot 50 tegelijk — in plaats van ze één voor één te loggen. De importer hierboven schrijft via deze tool, en de AI kan hem ook rechtstreeks gebruiken voor maaltijdgegevens die je in de chat hebt geplakt. Elke regel wordt eerst gecontroleerd en wat niet klopt wordt regel voor regel gerapporteerd, dus dezelfde regels opnieuw versturen is veilig en levert geen dubbele registraties op, zolang je tijdzone intussen niet is gewijzigd.",
            params: {
                meals: "De regels om te importeren, in de volgorde van het bronbestand (1–50 per aanroep). Elke regel kan een tijd, maaltijdtype, omschrijving, notities en dezelfde cijfers als een gelogde maaltijd bevatten: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (totale suikers), <code>alcohol_g</code> (gram zuivere ethanol) en <code>caffeine_mg</code> (milligram, niet gram)",
                expected_row_count:
                    "Hoeveel regels deze aanroep bevat, geteld vanuit het bronbestand, zodat een weggevallen regel wordt opgemerkt",
                expected_total_kcal:
                    "Caloriëntotaal uit het bronbestand, afgestemd op wat er binnenkomt",
                dry_run:
                    "Rapporteer wat er zou gebeuren zonder iets te schrijven",
                on_error:
                    "Importeer de geldige regels en rapporteer de rest, of schrijf niets als er ook maar één regel mislukt",
                source_app: "Uit welke app het bestand afkomstig is",
            },
            example:
                "Hier zijn de maaltijden van vorige week, geplakt uit mijn oude app — voeg ze allemaal toe",
        },
        update_meal: {
            description:
                "Wijzig de gegevens van een maaltijd die je al hebt gelogd — de omschrijving, een macro, vezels, suiker, alcohol of cafeïne, de tijd, of notities. Ook zo wordt een ontbrekend gegeven achteraf aangevuld: als een maaltijd zonder vezel- of suikerwaarde is gelogd, meldt de server dat en vult de AI het hier in als je akkoord gaat.",
            params: {
                id: "UUID van de te wijzigen maaltijd",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Totale suikers, niet toegevoegde suiker",
                alcohol_g: "Gram zuivere ethanol, niet het volume van de drank",
                caffeine_mg: "Milligram, niet gram",
                logged_at: "",
                notes: "",
            },
            example:
                "Die lunch was eigenlijk 600 calorieën, niet 500 — corrigeer dat",
        },
        delete_meal: {
            description:
                "Verwijder een maaltijd die je per ongeluk hebt gelogd.",
            params: {
                id: "UUID van de te verwijderen maaltijd",
            },
            example: "Verwijder de snack die ik vanmiddag heb gelogd",
        },
        search_meals: {
            description:
                'Doorzoek je eerdere maaltijden op trefwoord en zie ze gegroepeerd naar terugkerende varianten — hoe vaak elke is gelogd, wanneer voor het laatst, en het gebruikelijke aantal calorieën. Zo checkt de AI een foto van je bord tegen hoe je die maaltijd eerder daadwerkelijk hebt gelogd, en zo werkt "log mijn gebruikelijke ontbijt".',
            params: {
                queries:
                    "Alternatieve zoekwoorden voor eten, in elke taal waarin je hebt gelogd",
                days: "Hoe ver terug te kijken (standaard een jaar)",
                limit: "Maximum aantal te analyseren regels",
            },
            example: "Log mijn gebruikelijke ontbijt",
        },
        get_meals_today: {
            description: "Bekijk alle maaltijden die je vandaag hebt gelogd.",
            params: {
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met de id, of <code>full</code> om ook notities en exacte tijden op te nemen",
            },
            example: "Wat heb ik vandaag gegeten?",
        },
        get_meals_by_date: {
            description:
                "Bekijk alle maaltijden die je op een specifieke dag hebt gelogd.",
            params: {
                date: "Datum in JJJJ-MM-DD-formaat",
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met de id, of <code>full</code> om ook notities en exacte tijden op te nemen",
            },
            example: "Laat me alles zien wat ik op 4 juli heb gegeten",
        },
        get_meals_by_date_range: {
            description:
                "Haal in één keer alle maaltijden tussen twee datums op — handig om een week of een maand te overzien. Eén aanroep beslaat maximaal 31 dagen; voor langere periodes geven trends en overzichten dagtotalen.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date:
                    "Einddatum (JJJJ-MM-DD), hoogstens 31 dagen inclusief de startdag",
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met de id, of <code>full</code> om ook notities en exacte tijden op te nemen",
            },
            example: "Toon mijn maaltijden van maandag tot vrijdag",
        },
        export_all_data: {
            description:
                "Exporteer alles wat de dienst over je bewaart als één ZIP-bestand — meals.csv, water.csv, weight.csv, goals.csv, profile.csv, account.csv (je aanmeldaccount), telemetry.csv (gebruiksgegevens van tools), connections.csv (je gekoppelde AI-apps, zonder tokens) en een README.txt die de kolommen, de eenheden en wat er niet in zit uitlegt — met dezelfde privélink, 60 minuten geldig. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren.",
            params: {},
            example:
                "Exporteer al mijn gegevens — maaltijden, water, gewicht en doelen",
        },
        log_water: {
            description:
                "Log een hydratatie-invoer. Geef het op in elke eenheid — bekers, ounces, liters — en het wordt voor je omgerekend naar milliliters.",
            params: {
                amount_ml: "Hoeveelheid in milliliter (geheel getal, &gt; 0).",
            },
            example: "Ik heb net een flesje water van 500 ml gedronken",
        },
        get_water_today: {
            description:
                "Bekijk de totale waterinname van vandaag en elke afzonderlijke registratie.",
            params: {},
            example: "Hoeveel water heb ik vandaag gedronken?",
        },
        get_water_by_date: {
            description:
                "Bekijk je watertotaal en registraties voor een specifieke dag.",
            params: {
                date: "Datum in JJJJ-MM-DD-formaat",
            },
            example: "Hoeveel heb ik gisteren gedronken?",
        },
        delete_water: {
            description:
                "Verwijder een waterregistratie die je per ongeluk hebt toegevoegd.",
            params: {
                id: "UUID van de te verwijderen waterregistratie",
            },
            example: "Verwijder die laatste waterregistratie",
        },
        log_weight: {
            description:
                "Leg een lichaamsgewicht vast in kg of lb. Meerdere weegmomenten per dag kan gewoon, en de server slaat het canoniek op zodat je eenheidvoorkeur het cijfer nooit vertekent.",
            params: {
                weight: "Lichaamsgewicht, in `unit` (&gt; 0).",
            },
            example: "Log mijn gewicht — 74,2 kg vanmorgen",
        },
        update_weight: {
            description:
                "Corrigeer een bestaand weegmoment — de waarde, het tijdstip of de notities.",
            params: {
                id: "UUID van het te wijzigen gewicht",
                weight: "Nieuwe gewichtswaarde, in `unit`.",
                logged_at: "ISO 8601-tijdstempel",
                notes: "",
            },
            example: "Corrigeer het weegmoment van vanmorgen naar 73,8 kg",
        },
        delete_weight: {
            description: "Verwijder een gewichtsregistratie.",
            params: {
                id: "UUID van de te verwijderen gewichtsregistratie",
            },
            example: "Verwijder de gewichtsregistratie van vandaag",
        },
        get_weight_today: {
            description:
                "Bekijk de weegmomenten van vandaag, getoond in je voorkeurseenheid.",
            params: {},
            example: "Wat woog ik vandaag?",
        },
        get_weight_by_date: {
            description: "Bekijk je weegmomenten voor een specifieke dag.",
            params: {
                date: "Datum in JJJJ-MM-DD-formaat",
            },
            example: "Wat was mijn gewicht op de 1e?",
        },
        get_weight_by_date_range: {
            description:
                "Haal elk weegmoment tussen twee datums op, gegroepeerd per dag met het dagelijkse gemiddelde.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date: "Einddatum (JJJJ-MM-DD)",
            },
            example: "Toon mijn weegmomenten van de laatste twee weken",
        },
        get_weight_trends: {
            description:
                "Bekijk je gewichtstrend over een periode: laatste meting, totale verandering, voortschrijdende gemiddelden over 7/14/30 dagen, min/max, en voortgang richting je streefgewicht.",
            params: {
                days: "Periode in dagen (standaard 30, max 365).",
            },
            example: "Hoe ontwikkelt mijn gewicht zich deze maand?",
        },
        set_weight_unit: {
            description:
                "Kies of gewicht wordt getoond en ingevoerd in kg of lb. Opgeslagen waarden veranderen niet — alleen de weergave en de standaard interpretatie bij invoer.",
            params: {},
            example: "Gebruik vanaf nu pond voor mijn gewicht",
        },
        set_nutrition_goals: {
            description:
                "Stel je dagelijkse doelen in voor calorieën, macro's, vezels, suiker, alcohol, cafeïne en water, plus een optioneel streefgewicht. Calorieën, eiwit, koolhydraten, vet, vezels en water zijn doelen om te halen; suiker, alcohol en cafeïne zijn limieten om onder te blijven, en de voortgang wordt daarnaar verwoord. Alleen de velden die je noemt worden bijgewerkt; de rest blijft ongewijzigd.",
            params: {
                daily_calories:
                    "Dagelijks caloriedoel (kcal). Null om te wissen.",
                daily_protein_g:
                    "Dagelijks eiwitdoel (gram). Null om te wissen.",
                daily_carbs_g:
                    "Dagelijks doel voor koolhydraten (gram). Null om te wissen.",
                daily_fat_g: "Dagelijks vetdoel (gram). Null om te wissen.",
                daily_fiber_g:
                    "Dagelijks vezeldoel (gram), een minimum om te halen. Null om te wissen.",
                daily_sugar_g:
                    "Dagelijkse limiet voor <b>totale</b> suikers (gram), een maximum om onder te blijven. Totale suikers omvatten de suiker die van nature in fruit en zuivel zit, dus de publieke richtlijn voor toegevoegde suiker ligt veel lager. Null om te wissen.",
                daily_alcohol_g:
                    "Dagelijkse alcohollimiet in gram <b>zuivere ethanol</b>, een maximum om onder te blijven. Eén Amerikaans standaardglas is 14 g, één Britse eenheid 7,9 g. Null om te wissen.",
                daily_caffeine_mg:
                    "Dagelijkse cafeïnelimiet in <b>milligram</b>, een maximum om onder te blijven. De grens van EFSA en FDA voor gezonde volwassenen is 400 mg per dag (ongeveer vier gezette koffies), en 200 mg tijdens de zwangerschap. 0 is een geldige limiet die inhoudt: helemaal geen. Null om te wissen.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Zet mijn doelen op 2.200 calorieën, 160 g eiwit en een streefgewicht van 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Bekijk je huidige dagelijkse doelen voor calorieën en macro's, een eventueel vezeldoel en suiker- of cafeïnelimiet, en — als je alcohol bijhoudt — je alcohollimiet.",
            params: {},
            example: "Wat zijn mijn dagelijkse doelen?",
        },
        get_goal_progress: {
            description:
                "Bekijk hoe je inname van vandaag zich verhoudt tot je doelen — ringen met inname versus doel plus voortgang van je lichaamsgewicht. Tik op een macroring om te zien welke maaltijden eraan hebben bijgedragen.",
            params: {},
            example: "Hoe doe ik het vandaag ten opzichte van mijn doelen?",
        },
        get_nutrition_summary: {
            description:
                "Krijg dagelijkse voedingstotalen over een periode als interactief dashboard: macrotegels ten opzichte van doelen en een uitsplitsing per dag. Eén aanroep beslaat maximaal 92 dagen; voor langere periodes geven trends voortschrijdende gemiddelden.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date:
                    "Einddatum (JJJJ-MM-DD), hoogstens 92 dagen inclusief de startdag",
            },
            example: "Geef me een overzicht van de afgelopen week",
        },
        get_trends: {
            description:
                "Voortschrijdende gemiddelden over 7/14/30 dagen, variabiliteit, logstreaks, gemiddelde calorieën per weekdag, en je beste en slechtste dagen op basis van calorieën — vooraf berekend zodat de AI ze zo kan navertellen.",
            params: {
                days: "Periode in dagen (standaard 30, max 365).",
            },
            example:
                "Wat zijn mijn calorie- en macrotrends over de afgelopen 30 dagen?",
        },
        get_meal_patterns: {
            description:
                "Breng gedragspatronen aan het licht: hoe vaak je elk maaltijdtype eet, het ontbijteffect, calorierijke lunches, late diners, doordeweeks versus weekend, en uitschieterdagen.",
            params: {
                days: "Periode in dagen (standaard 30, min 7, max 365).",
            },
            example:
                "Zitten er patronen in hoe ik eet — zoals late diners of het overslaan van het ontbijt?",
        },
        get_profile: {
            description:
                "Bekijk al je huidige instellingen in één keer: tijdzone (plus je lokale datum en tijd), de widgettaal, je gewichtseenheid, of de widgets in de chat worden getoond, en of alcoholregistratie aanstaat.",
            params: {},
            example: "Wat zijn mijn huidige instellingen?",
        },
        set_timezone: {
            description:
                "Stel je IANA-tijdzone in zodat dagen om middernacht in jouw tijdzone overgaan — een maaltijd die om 23:00 is gelogd, telt op die dag, niet op de volgende UTC-dag.",
            params: {},
            example: "Ik zit in Berlijn — stel mijn tijdzone in",
        },
        set_language: {
            description:
                "Stel de taal in voor de widgets in de chat — de dashboards en grafieken, niet wat de AI aan je terugschrijft.",
            params: {
                locale: "ISO 639-1-code, bijv. <code>de</code>, <code>uk</code>. Ondersteund: Engels, Duits, Spaans, Frans, Nederlands, Pools, Italiaans en Oekraïens.",
            },
            example: "Zet mijn widgets in het Duits",
        },
        get_current_time: {
            description:
                'Bekijk de datum en tijd op dit moment in jouw tijdzone, plus het UTC-tijdstip. Sommige apps vertellen de assistent niet hoe laat het is, dus zo bepaalt hij wat "vanmorgen" of "vandaag" betekent zonder het jou te vragen (standaard UTC als er geen tijdzone is ingesteld).',
            params: {},
            example: "Hoe laat is het nu voor mij?",
        },
        set_widget_display: {
            description:
                "Zet de visuele widgets in de chat aan of uit — de dashboards, doelringen en trendgrafieken. Uitgeschakeld antwoorden dezelfde tools alleen met tekst en gegevens. Standaard ingeschakeld; de wijziging geldt voor nieuwe gesprekken.",
            params: {
                enabled: "true om widgets te tonen, false voor alleen tekst",
            },
            example: "Zet de widgets uit",
        },
        set_alcohol_tracking: {
            description:
                "Zet alcoholregistratie aan of uit, en kies of drankjes worden geteld in Amerikaanse standaardglazen of Britse eenheden. Standaard staat het uit, dus je moet er zelf om vragen. Het weer uitzetten verbergt alcohol uit maaltijden, doelen en voortgang en zorgt dat de bestandsimporter de alcoholkolom van een bestand niet meer leest — niets dat al gelogd is wordt verwijderd, je CSV-export bevat het nog steeds, en het verschijnt weer zodra je het weer aanzet. De wijziging geldt vanaf je volgende bericht, zonder dat er iets herstart hoeft te worden.",
            params: {
                enabled:
                    "true om alcohol te tonen in maaltijden, doelen en voortgang, false om het te verbergen",
                drink_unit:
                    "Welk standaardglas naast de gramwaarde wordt getoond: <code>us</code> (14 g per glas) of <code>uk</code> (7,9 g per eenheid). Standaard <code>us</code>; wat daadwerkelijk wordt opgeslagen is gram zuivere ethanol.",
            },
            example:
                "Begin met het bijhouden van mijn drankgebruik, in Britse eenheden",
        },
        delete_account: {
            description:
                "Verwijder permanent je Nutrition MCP-account en alle gegevens die het over je bewaart. Dit is onomkeerbaar — de AI vraagt altijd eerst om jouw bevestiging.",
            params: {},
            example: "Verwijder mijn account en al mijn gegevens",
        },
    },
    troubleshooting: {
        pillLabel: "Hulp",
        title: "Problemen oplossen",
        description:
            "Werkt er iets niet? Voor de meeste problemen is er een snelle oplossing.",
        items: {
            "cannot-connect": {
                question:
                    "De connector maakt geen verbinding of vraagt steeds opnieuw om in te loggen",
                answerHtml:
                    "Verwijder de connector en voeg hem opnieuw toe met precies <code>https://nutrition-mcp.com/mcp</code> — het deel <code>/mcp</code> is verplicht. Open in Claude <strong>Customize</strong> → <strong>Connectors</strong>, verbreek de verbinding met Nutrition en maak opnieuw verbinding; in ChatGPT ga je naar <strong>Settings</strong> → <strong>Apps</strong>. Log in met hetzelfde e-mailadres en wachtwoord, of hetzelfde Google-account, als eerder: je gegevens horen bij je account, niet bij de verbinding, dus bij opnieuw verbinden gaat er niets verloren. Eenmaal verbonden blijft de verbinding actief zolang je hem minstens elke 90 dagen gebruikt; werkt hij niet meer, dan lost opnieuw verbinden op dezelfde manier het op.",
            },
            "session-expired": {
                question: 'De inlogpagina toont {"error":"session_expired"}',
                answerHtml:
                    "De inlogpagina is maar 10 minuten geldig en wordt ook gereset wanneer de server voor een update herstart. Ga terug naar de inlogpagina en laad hem opnieuw, of begin opnieuw met verbinden vanuit je AI-app, en log daarna in zonder lang te wachten. Staat er in plaats daarvan <code>session_mismatch</code>, dan is het inloggen afgerond in een andere browser dan de browser waarin het begon: begin opnieuw vanuit je AI-app en rond het af in diezelfde browser.",
            },
            "cannot-sign-in": {
                question:
                    "Ik kan niet inloggen, of ik ben mijn wachtwoord vergeten",
                answerHtml:
                    'Gebruik <strong>Inloggen</strong> voor een account dat je al hebt: een verkeerd e-mailadres of wachtwoord geeft daar "Verkeerd e-mailadres of wachtwoord" en maakt nooit een nieuw account aan. <strong>Account aanmaken</strong> is alleen voor je eerste bezoek. Controleer het e-mailadres op typfouten. Heb je je account aangemaakt met <strong>Doorgaan met Google</strong>, gebruik dan weer die knop. Zelf je wachtwoord resetten kan nog niet: mail vanaf het adres van je account naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>, dan reset ik het voor je.',
            },
            "history-missing": {
                question:
                    "Ik heb opnieuw verbinding gemaakt en mijn geschiedenis is weg",
                answerHtml:
                    'Elk e-mailadres is een apart account, dus als je inlogt met een ander e-mailadres, begin je met een leeg account — er is niets verwijderd. Verbreek de verbinding en log opnieuw in met het adres dat je oorspronkelijk gebruikte. Weet je niet zeker welk adres dat was, mail dan naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "De AI antwoordt, maar logt niets",
                answerHtml:
                    'Controleer of de connector voor dit gesprek aanstaat — in Claude zie je dat in het toolsmenu in het berichtvak — en vraag het rechtstreeks, bijvoorbeeld "log mijn ontbijt in Nutrition". Vraagt je app om toestemming om een tool te gebruiken, geef die dan.',
            },
            "wrong-day": {
                question: "Mijn maaltijden staan op de verkeerde dag",
                answerHtml:
                    'Dagen worden geteld in jouw tijdzone, en als je er nooit een hebt ingesteld, wordt UTC gebruikt. Vraag "welke tijdzone heb ik ingesteld?" (<a href="#get_profile"><code>get_profile</code></a>) en, als die niet klopt, "stel mijn tijdzone in op Europe/Berlin" (<a href="#set_timezone"><code>set_timezone</code></a>). Alles wat je hebt gelogd wordt dan gegroepeerd per lokale dag, oudere items inbegrepen. De enige uitzondering is een item waaraan je een specifiek tijdstip gaf terwijl de tijdzone verkeerd stond: dat behoudt het moment waarmee het is opgeslagen, dus het kan nog steeds een uur of een dag verschoven zijn — vraag de AI om het naar de juiste datum en tijd te verplaatsen (<a href="#update_meal"><code>update_meal</code></a>). Stel je tijdzone ook in voordat je je geschiedenis importeert: geïmporteerde maaltijden behouden het moment waarop ze zijn geplaatst, en als je het bestand van een andere app na het wijzigen van je tijdzone opnieuw importeert, worden ze een tweede keer toegevoegd. Een export van Nutrition MCP wordt herkend en niet dubbel toegevoegd.',
            },
            "no-widgets": {
                question: "Ik zie alleen tekst, geen grafieken of kaarten",
                answerHtml:
                    'De visuele kaarten hebben een app nodig die interactieve MCP Apps-panelen ondersteunt, zoals Claude of ChatGPT; andere clients krijgen dezelfde informatie als tekst. Heb je de widgets uitgezet, vraag dan om ze weer aan te zetten (<a href="#set_widget_display"><code>set_widget_display</code></a>) en begin een nieuw gesprek — een open chat houdt zijn oude instelling tot hij opnieuw verbinding maakt. De kleine kaart na het loggen van een maaltijd verschijnt pas als je dagdoelen hebt ingesteld (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "De importer opent niet, of zegt dat hij niet kan opslaan",
                answerHtml:
                    'Het importerpaneel heeft een app nodig die interactieve panelen toont en waarin widgets aanstaan. Staat er <em>Deze host staat dit venster niet toe om in je logboek te schrijven</em>, of verschijnt het paneel helemaal niet, vraag de AI dan om het bestand zelf te importeren: voeg de CSV toe of plak hem, en de AI gebruikt <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, dat elke rij controleert en duplicaten overslaat, dus opnieuw versturen is veilig zolang je tijdzone intussen niet is gewijzigd. Stel je tijdzone in vóór de eerste import: als je het bestand van een andere app na een wijziging opnieuw importeert, worden de rijen nogmaals toegevoegd. Gebruik je het importerpaneel en wil je een alcoholkolom meenemen, zet alcoholregistratie dan eerst aan — het paneel slaat die kolom over zolang registratie uitstaat, en later opnieuw importeren vult die niet alsnog in.',
            },
            "rate-limited": {
                question:
                    'Ik zie "Rate limit exceeded" of "Too many failed authentication attempts"',
                answerHtml:
                    "Elk account kan 60 verzoeken per minuut doen, en elke toolaanroep telt als minstens één. Wacht het aantal seconden dat de melding noemt en ga dan verder. Wil je veel maaltijden achteraf toevoegen, gebruik dan de importer in plaats van ze één voor één te loggen. Inlogpagina's staan 30 verzoeken per minuut per netwerk toe. Na 20 geweigerde verbindingspogingen op rij vanaf één netwerk — meestal een oude, losgekoppelde connector die het blijft proberen — worden verbindingen vanaf dat netwerk 5 minuten gepauzeerd, en herhaalde pauzes lopen op tot hooguit een uur. De oude connector verwijderen en opnieuw toevoegen stopt de pogingen.",
            },
            "barcode-not-found": {
                question:
                    "Een barcode wordt niet gevonden, of de waarden lijken niet te kloppen",
                answerHtml:
                    "Barcodegegevens komen van Open Food Facts, een communitydatabase, dus sommige producten ontbreken en sommige gegevens zijn verouderd. Controleer of alle 8–14 cijfers onder de barcode goed zijn gelezen. Staat het product er niet in, dan kan de AI een schatting maken op basis van de naam of een foto van het voedingsetiket, en je kunt elk getal achteraf corrigeren. Het product toevoegen op openfoodfacts.org helpt iedereen. Open Food Facts heeft geen cafeïnegegevens, dus cafeïne komt van het etiket of uit gangbare hoeveelheden.",
            },
            "export-link": {
                question: "Mijn downloadlink voor de export werkt niet",
                answerHtml:
                    'Exportlinks verlopen na 60 minuten, en elke nieuwe export vervangt het vorige bestand. Vraag een nieuwe export aan (<a href="#export_all_data"><code>export_all_data</code></a>) en download hem meteen. Meldt de export 0 maaltijden terwijl je je geschiedenis verwachtte, dan ben je waarschijnlijk ingelogd met een ander e-mailadres — zie <a href="#history-missing">geschiedenis is weg</a>.',
            },
            "delete-account": {
                question: "Hoe verwijder ik mijn account?",
                answerHtml:
                    'Vraag de AI om je Nutrition MCP-account te verwijderen (<a href="#delete_account"><code>delete_account</code></a>). Die vraagt je om te bevestigen en verwijdert daarna definitief je maaltijden, water, gewicht, doelen, instellingen, het overzicht van welke tools je AI-app heeft gebruikt, een eventueel exportbestand, je inloggegevens en het account zelf. Dit is niet terug te draaien, dus exporteer je gegevens eerst als je een kopie wilt. Verwijder daarna de connector uit je app. Log je later opnieuw in met hetzelfde e-mailadres, dan ontstaat er een nieuw, leeg account.',
            },
            "report-a-problem": {
                question: "Hoe meld ik een bug of een beveiligingsprobleem?",
                answerHtml:
                    'Meld bugs via <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: vermeld welke app je gebruikt (Claude, ChatGPT, …), wat je vroeg, wat er gebeurde en ongeveer wanneer. Zet er nooit je wachtwoord bij. Meld beveiligingsproblemen alsjeblieft niet openbaar, maar privé via <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">GitHubs privémelding van kwetsbaarheden</a> of per e-mail, zoals het <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">beveiligingsbeleid</a> beschrijft. Voor al het andere mail je naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

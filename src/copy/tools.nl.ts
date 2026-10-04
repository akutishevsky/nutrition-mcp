// Dutch (nl) translation of ToolsDoc for /tools. See src/copy/tools.ts for
// the structural types (TOOLS, BADGE_META, CategoryId, BadgeKind) — those
// stay untranslated and shared across every locale. Only this file's
// prose is new. Tool names, parameter names, and category slugs are never
// translated; see tools.ts's header comment for the full reasoning.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_NL: ToolsDoc = {
    meta: {
        title: "41 tools voor calorieën, macro's, water & gewicht",
        description:
            "Alle 41 Nutrition MCP-tools voor Claude, ChatGPT en meer: eten loggen, barcodes scannen, MyFitnessPal- of Cronometer-CSV importeren, water, gewicht en lichaamsmaten bijhouden.",
        ogDescription:
            "Alle 41 tools die de Nutrition MCP-server aan je AI geeft, inclusief een CSV-importer om je geschiedenis uit een andere app over te zetten. Met beschrijvingen en voorbeeldzinnen.",
    },
    hero: {
        eyebrow: "Naslag",
        titleBeforeEm: "Alles wat je AI kan ",
        titleEm: "doen",
        titleAfterEm: "",
        lead: "Je roept deze tools nooit zelf aan: je praat gewoon met Claude, ChatGPT of een andere MCP-client, en die kiest de juiste tool. Hieronder staat elke tool die de Nutrition MCP-server biedt voor maaltijden, calorieën en macro's, water en gewicht, met wat hij doet en een zin waarmee je hem aan het werk zet.",
        countBold: "41 tools",
        countTail: "verdeeld over 7 categorieën",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Loggen",
            title: "Eten & maaltijden loggen",
            description:
                "De kern: leg vast wat je hebt gegeten, hoe je het ook omschrijft.",
        },
        "reviewing-your-meals": {
            pillLabel: "Bekijken",
            title: "Je maaltijden bekijken",
            description:
                "Kijk terug op wat je hebt gelogd, per dag of over een hele periode.",
        },
        water: {
            pillLabel: "Water",
            title: "Water bijhouden",
            description: "Houd naast je eten ook bij hoeveel je drinkt.",
        },
        weight: {
            pillLabel: "Lichaam",
            title: "Gewicht en lichaamsmaten",
            description:
                "Log weegmomenten en omtrekmetingen, bekijk ze terug en volg de trend van je gewicht richting je streefgewicht.",
        },
        "goals-progress": {
            pillLabel: "Doelen",
            title: "Doelen & voortgang",
            description: "Stel doelen in en zie hoe je er elke dag voor staat.",
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
                "Voorkeuren die zorgen dat alles klopt, plus volledige controle over je gegevens.",
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
        requiredLabel: "verplicht",
        optionalLabel: "optioneel",
        trySayingLabel: "Zeg bijvoorbeeld",
        categoriesLabel: "Toolcategorieën",
    },
    tools: {
        log_meal: {
            description:
                "Log wat je hebt gegeten, met calorieën en macro's, plus vezels, totale en toegevoegde suikers, alcohol en cafeïne als die cijfers er zijn. Omschrijf het in gewone woorden: de AI schat de cijfers, vraagt naar de portie als die onduidelijk is en kan eerst de voedingswaarden van het etiket ophalen via een barcode of het web.",
            params: {
                description: "Wat er is gegeten",
                meal_type: "ontbijt, lunch, diner of snack",
                calories: "Totaal aantal calorieën",
                protein_g: "Eiwit in gram",
                carbs_g: "Koolhydraten in gram",
                fat_g: "Vet in gram",
                fiber_g:
                    "Voedingsvezels in gram. De AI krijgt de opdracht dit bij elke maaltijd in te vullen en schat het aan de hand van de ingrediënten als het etiket geen waarde geeft, want een leeg veld is geen nul: daarmee valt de hele dag buiten je vezelgemiddelde",
                sugar_g:
                    "<b>Totale</b> suikers in gram: het getal dat op het etiket bij “waarvan suikers” staat, inclusief de suiker die van nature in fruit en zuivel zit, niet alleen toegevoegde suiker. Wordt net als vezels bij elke maaltijd ingevuld",
                added_sugar_g:
                    "<b>Toegevoegde</b> suikers in gram: suiker die bij verwerking of bereiding is toegevoegd (kristalsuiker, siropen, honing, de suiker in gezoete dranken en producten). Onderdeel van de totale suikers, nooit meer dan dat. De suiker die van nature in heel fruit, groente en ongezoete melk zit, is niet toegevoegd, en die in 100% vruchtensap ook niet. Wordt net als vezels bij elke maaltijd ingevuld: onbewerkte producten zijn 0, de suiker in frisdrank is helemaal toegevoegd, en de Amerikaanse etiketregel “Includes Xg Added Sugars” wordt gebruikt als die er is. Hoort bij <code>sugar_g</code>: een maaltijd met totale suikers maar zonder toegevoegde suikers wordt mogelijk niet opgeslagen",
                alcohol_g:
                    "Gram <b>zuivere ethanol</b>, niet het volume van de drank en niet het alcoholpercentage. De AI rekent het uit op basis van de hoeveelheid en de sterkte (een flesje bier van 330 ml met 5% is 13 g)",
                caffeine_mg:
                    "Cafeïne in <b>milligram</b>, niet in gram: het enige veld hier dat niet in gram is, omdat elk etiket en elke richtlijn het zo vermeldt (een kop filterkoffie bevat ongeveer 95 mg, een espresso 63 mg, een blikje cola 34 mg). Cafeïne levert geen calorieën. Anders dan vezels en suiker wordt dit alleen meegestuurd voor wat echt cafeïne bevat: een vastgelegde 0 zou op je dashboard een cafeïneregel zetten voor een stof die je nooit binnenkrijgt",
                logged_at:
                    "Wanneer je het hebt gegeten, als dat niet nu was. Zo kun je iets achteraf loggen",
                notes: "Extra notities",
            },
            example: "Log een burritobowl met kip en extra guacamole als lunch",
            photoHint:
                "…of maak gewoon een foto van je bord. De AI herkent elk gerecht, schat de porties in alledaagse maten (een glas, een handvol), kijkt hoe je het eerder hebt gelogd en vraagt je om bevestiging voordat er iets wordt gelogd.",
        },
        lookup_barcode: {
            description:
                "Haal de voedingswaarden van het etiket van een verpakt product op bij Open Food Facts via de barcode (EAN/UPC met 8–14 cijfers), plus de Nutri-Score en de NOVA-verwerkingsgroep als Open Food Facts die heeft. Toegevoegde suiker wordt getoond als Open Food Facts die vermeldt, en gemarkeerd als Open Food Facts die uit de ingrediënten heeft geschat. Je kunt de cijfers typen of laten aflezen van een foto van de verpakking; daarna kun je het resultaat loggen, omgerekend naar hoeveel je hebt gegeten.",
            params: {},
            example: "Scan deze barcode: 3017620422003",
            photoHint:
                "…of stuur een foto van de verpakking; de AI leest de cijfers van de barcode af.",
        },
        start_meal_import: {
            description:
                "Open een importvenster in de chat om je geschiedenis uit een andere app over te zetten. Kies de CSV die je uit MyFitnessPal, Cronometer, Lose It!, MacroFactor of een andere tracker hebt geëxporteerd, koppel de kolommen aan calorieën, macro's, vezels, totale en toegevoegde suiker en cafeïne (plus alcohol als je alcoholregistratie hebt aangezet) en bekijk wat er wordt toegevoegd voordat je bevestigt. Het bestand wordt in je browser gelezen, er wordt niets opgeslagen tot je het voorbeeld goedkeurt, en hetzelfde bestand opnieuw importeren levert geen dubbele registraties op.",
            params: {},
            example: "Importeer mijn maaltijdgeschiedenis uit MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Voeg een reeks eerdere maaltijden in één keer toe (tot 50 tegelijk) in plaats van ze één voor één te loggen. De importer hierboven schrijft via deze tool, en de AI kan hem ook zelf gebruiken voor maaltijdgegevens die je in de chat hebt geplakt. Elke rij wordt eerst gecontroleerd en wat niet klopt, wordt per rij gemeld. Dezelfde rijen opnieuw versturen is dus veilig en levert geen dubbele registraties op, zolang je tijdzone intussen niet is gewijzigd.",
            params: {
                meals: "De rijen om te importeren, in de volgorde van het bronbestand (1–50 per aanroep). Elke rij kan een tijd, maaltijdtype, omschrijving, notities en dezelfde cijfers als een gelogde maaltijd bevatten: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (totale suikers), <code>added_sugar_g</code> (toegevoegde suikers, onderdeel van het totaal), <code>alcohol_g</code> (gram zuivere ethanol) en <code>caffeine_mg</code> (milligram, niet gram)",
                expected_row_count:
                    "Hoeveel rijen deze aanroep bevat, geteld in het bronbestand, zodat een ontbrekende rij opvalt",
                expected_total_kcal:
                    "Totaal aantal calorieën in het bronbestand, om te controleren of alles is binnengekomen",
                dry_run: "Meld wat er zou gebeuren, zonder iets op te slaan",
                on_error:
                    "Importeer de geldige rijen en meld de rest, of sla niets op als er ook maar één rij mislukt",
                source_app: "Uit welke app het bestand komt",
            },
            example:
                "Hier zijn mijn maaltijden van vorige week, gekopieerd uit mijn oude app. Voeg ze allemaal toe.",
        },
        update_meal: {
            description:
                "Wijzig een maaltijd die je al hebt gelogd: de omschrijving, een macro, vezels, totale of toegevoegde suiker, alcohol of cafeïne, de tijd of de notities. Zo wordt ook een ontbrekende waarde achteraf aangevuld: is een maaltijd zonder vezels, suiker of toegevoegde suiker gelogd, dan meldt de server dat en vult de AI die waarde hier aan als je akkoord gaat.",
            params: {
                id: "UUID van de te wijzigen maaltijd",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Totale suikers, niet toegevoegde suiker",
                added_sugar_g:
                    "Alleen toegevoegde suikers, nooit meer dan de totale suikers. Hoort bij <code>sugar_g</code>: een wijziging van de totale suikers bij een maaltijd zonder vastgelegde toegevoegde suikers wordt zonder deze waarde mogelijk niet opgeslagen",
                alcohol_g: "Gram zuivere ethanol, niet het volume van de drank",
                caffeine_mg: "Milligram, niet gram",
                logged_at: "",
                notes: "",
            },
            example:
                "Die lunch was eigenlijk 600 calorieën, geen 500. Pas dat even aan.",
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
                "Doorzoek je eerdere maaltijden op trefwoord en zie ze gegroepeerd in je terugkerende varianten: hoe vaak je elke variant hebt gelogd, wanneer voor het laatst en hoeveel calorieën die meestal heeft. Zo vergelijkt de AI een foto van je bord met hoe je die maaltijd eerder echt hebt gelogd, en zo werkt “log mijn vaste ontbijt”.",
            params: {
                queries:
                    "Varianten van de zoekterm voor het eten, in elke taal waarin je hebt gelogd",
                days: "Hoe ver je terugkijkt (standaard een jaar)",
                limit: "Maximaal aantal registraties om te analyseren",
            },
            example: "Log mijn vaste ontbijt",
        },
        get_meals_today: {
            description: "Bekijk alle maaltijden die je vandaag hebt gelogd.",
            params: {
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met het id, of <code>full</code> om ook notities en exacte tijden te tonen",
            },
            example: "Wat heb ik vandaag gegeten?",
        },
        get_meals_by_date: {
            description:
                "Bekijk alle maaltijden die je op een bepaalde dag hebt gelogd.",
            params: {
                date: "Datum in de notatie JJJJ-MM-DD",
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met het id, of <code>full</code> om ook notities en exacte tijden te tonen",
            },
            example: "Laat alles zien wat ik op 4 juli heb gegeten",
        },
        get_meals_by_date_range: {
            description:
                "Haal alle maaltijden tussen twee datums in één keer op, handig om een week of maand terug te kijken. Eén aanroep beslaat maximaal 31 dagen; voor langere periodes geven trends en overzichten je dagtotalen.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date:
                    "Einddatum (JJJJ-MM-DD), maximaal 31 dagen inclusief de startdatum",
                detail: "<code>compact</code> (standaard) voor één regel per maaltijd met het id, of <code>full</code> om ook notities en exacte tijden te tonen",
            },
            example: "Toon mijn maaltijden van maandag tot en met vrijdag",
        },
        export_all_data: {
            description:
                "Exporteer alles wat de dienst over je bewaart in één ZIP-bestand: meals.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv (elke wijziging van je doelen, met datum), profile.csv, account.csv (je inlogaccount), telemetry.csv (gegevens over het gebruik van tools), connections.csv (je gekoppelde AI-apps en Apple Health-synchronisatie, zonder tokens), health_sync.csv (wat Apple Health-synchronisatie de afgelopen 8 dagen heeft verstuurd) en een README.txt die de kolommen en eenheden uitlegt en vermeldt wat er niet in staat. Je krijgt een privélink om het bestand te downloaden, die 60 minuten geldig is. Voorlopig kun je alleen de maaltijden weer importeren.",
            params: {},
            example:
                "Exporteer al mijn gegevens: maaltijden, water, gewicht en doelen",
        },
        log_water: {
            description:
                "Log hoeveel water je hebt gedronken. Geef het op in welke eenheid je maar wilt (bekers, ounces, liters); het wordt voor je omgerekend naar milliliters.",
            params: {
                amount_ml: "Hoeveelheid in milliliter (geheel getal, &gt; 0).",
            },
            example: "Ik heb net een flesje water van 500 ml gedronken",
        },
        get_water_today: {
            description:
                "Bekijk hoeveel water je vandaag in totaal hebt gedronken, met elke registratie apart.",
            params: {},
            example: "Hoeveel water heb ik vandaag gedronken?",
        },
        get_water_by_date: {
            description:
                "Bekijk hoeveel water je op een bepaalde dag hebt gedronken, met alle registraties.",
            params: {
                date: "Datum in de notatie JJJJ-MM-DD",
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
                "Leg je lichaamsgewicht vast in kg of lb. Meerdere weegmomenten per dag zijn geen probleem, en de server slaat het op in één vaste eenheid, zodat je voorkeurseenheid de waarde nooit vertekent.",
            params: {
                weight: "Lichaamsgewicht, in <code>unit</code> (&gt; 0).",
            },
            example: "Log mijn gewicht: 74,2 kg vanochtend",
        },
        update_weight: {
            description:
                "Corrigeer een bestaand weegmoment: de waarde, het tijdstip of de notities.",
            params: {
                id: "UUID van de te wijzigen gewichtsregistratie",
                weight: "Nieuw gewicht, in <code>unit</code>.",
                logged_at: "ISO 8601-tijdstempel",
                notes: "",
            },
            example: "Zet het weegmoment van vanochtend op 73,8 kg",
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
            description: "Bekijk je weegmomenten op een bepaalde dag.",
            params: {
                date: "Datum in de notatie JJJJ-MM-DD",
            },
            example: "Wat woog ik op de 1e?",
        },
        get_weight_by_date_range: {
            description:
                "Haal elk weegmoment tussen twee datums op, gegroepeerd per dag, met het gemiddelde van elke dag.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date: "Einddatum (JJJJ-MM-DD)",
            },
            example: "Toon mijn weegmomenten van de afgelopen twee weken",
        },
        get_weight_trends: {
            description:
                "Bekijk je gewichtstrend over een periode: een afgevlakt trendgewicht dat dagelijkse schommelingen uitmiddelt, je wekelijkse veranderingstempo, laatste meting, totale verandering, min/max en je voortgang richting je streefgewicht. De grafiek kan ook 90 dagen, een jaar of je hele geschiedenis tonen.",
            params: {
                days: "Periode in dagen (standaard 30, max 365).",
            },
            example: "Hoe ontwikkelt mijn gewicht zich deze maand?",
        },
        set_weight_unit: {
            description:
                "Kies of je gewicht in kg of lb wordt getoond en ingevoerd. Opgeslagen waarden blijven hetzelfde; alleen de weergave verandert en de eenheid die wordt aangenomen als je er geen noemt.",
            params: {},
            example: "Gebruik voortaan lb voor mijn gewicht",
        },
        log_body_measurement: {
            description:
                "Leg een omtrekmeting van één lichaamsdeel vast (taille, heupen, nek, borst, schouders, bovenarm, onderarm, dij of kuit) in cm of inch. De waarde wordt precies zo opgeslagen als je hem invoert, naast een vaste standaardwaarde, zodat wisselen van eenheid nooit een getal verschuift. Getallen ver buiten een realistisch bereik voor dat lichaamsdeel worden geweigerd als waarschijnlijke tikfout.",
            params: {
                kind: "Welk lichaamsdeel: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> of <code>calf</code>. Eén waarde per lichaamsdeel; een kant (links/rechts) kan in de notities.",
                value: "De meting, in <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> of <code>in</code>; standaard je opgeslagen lengte-eenheid.",
                logged_at: "Wanneer je hebt gemeten, als dat niet nu was",
                notes: "Extra notities",
            },
            example: "Log mijn taille: 82 cm vanochtend",
        },
        get_body_measurements: {
            description:
                "Bekijk je lichaamsmaten per dag, oudste eerst, eventueel voor één lichaamsdeel. Zonder datums gaat het om de afgelopen 30 dagen, met maximaal 366 dagen per aanroep.",
            params: {
                kind: "Alleen dit lichaamsdeel (bijv. <code>waist</code>)",
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date:
                    "Einddatum (JJJJ-MM-DD), maximaal 366 dagen inclusief de startdatum",
            },
            example: "Toon mijn tailleomtrek van de afgelopen drie maanden",
        },
        update_body_measurement: {
            description:
                "Corrigeer een bestaande meting: de waarde, de eenheid, het tijdstip of de notities. Het lichaamsdeel zelf ligt vast; een ander lichaamsdeel is een nieuwe registratie.",
            params: {
                id: "UUID van de te wijzigen meting",
                value: "Nieuwe waarde, in <code>unit</code>.",
                unit: "Standaard de eenheid waarin de meting is vastgelegd.",
                logged_at: "ISO 8601-tijdstempel",
                notes: "Nieuwe notities",
            },
            example: "Die heupomtrek was 98 cm, niet 89",
        },
        delete_body_measurement: {
            description: "Verwijder een lichaamsmeting.",
            params: {
                id: "UUID van de te verwijderen meting",
            },
            example: "Verwijder de nekmeting van vandaag",
        },
        set_length_unit: {
            description:
                "Kies of lichaamsmaten in centimeters of inches worden getoond en ingevoerd. Dit staat los van je gewichtseenheid. Opgeslagen waarden blijven hetzelfde; alleen de weergave verandert en de eenheid die wordt aangenomen als je er geen noemt.",
            params: {},
            example: "Gebruik inches voor mijn lichaamsmaten",
        },
        set_nutrition_goals: {
            description:
                "Stel je dagelijkse doelen in voor calorieën, macro's, vezels, suiker, toegevoegde suiker, alcohol, cafeïne en water, plus een optioneel streefgewicht. Calorieën, eiwit, koolhydraten, vet, vezels en water zijn doelen om te halen; totale suiker, toegevoegde suiker, alcohol en cafeïne zijn limieten om onder te blijven, en zo wordt de voortgang ook verwoord. Alleen de velden die je noemt, worden bijgewerkt; de rest blijft zoals het was.",
            params: {
                daily_calories:
                    "Dagelijks caloriedoel (kcal). Null om te wissen.",
                daily_protein_g:
                    "Dagelijks eiwitdoel (gram). Null om te wissen.",
                daily_carbs_g:
                    "Dagelijks koolhydraatdoel (gram). Null om te wissen.",
                daily_fat_g: "Dagelijks vetdoel (gram). Null om te wissen.",
                daily_fiber_g:
                    "Dagelijks vezeldoel (gram), een minimum om te halen. Null om te wissen.",
                daily_sugar_g:
                    "Dagelijkse limiet voor <b>totale</b> suikers (gram), een maximum om onder te blijven. Totale suikers omvatten ook de suiker die van nature in fruit en zuivel zit; de officiële richtlijn voor toegevoegde suiker ligt daarom veel lager. Null om te wissen.",
                daily_added_sugar_g:
                    "Dagelijkse limiet voor <b>toegevoegde</b> suikers (gram), een maximum om onder te blijven. Telt alleen toegevoegde suikers, niet de suiker die van nature in fruit en zuivel zit; officiële richtlijnen voor suiker gaan meestal over deze maat (de American Heart Association houdt maximaal 25 g per dag aan voor vrouwen en 36 g voor mannen). 0 is een echte limiet en betekent helemaal niets. Null om te wissen.",
                daily_alcohol_g:
                    "Dagelijkse alcohollimiet in gram <b>zuivere ethanol</b>, een maximum om onder te blijven. Eén Amerikaans standaardglas is 14 g, één Britse eenheid 7,9 g. Null om te wissen.",
                daily_caffeine_mg:
                    "Dagelijkse cafeïnelimiet in <b>milligram</b>, een maximum om onder te blijven. EFSA en de FDA houden voor gezonde volwassenen een bovengrens aan van 400 mg per dag (ongeveer vier koppen filterkoffie); tijdens de zwangerschap houdt EFSA 200 mg aan. 0 is een echte limiet en betekent: helemaal geen. Null om te wissen.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Zet mijn doelen op 2.200 calorieën, 160 g eiwit en een streefgewicht van 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Bekijk je huidige dagelijkse doelen voor calorieën en macro's, een eventueel vezeldoel, eventuele limieten voor suiker of cafeïne en, als je alcohol bijhoudt, je alcohollimiet.",
            params: {},
            example: "Wat zijn mijn dagdoelen?",
        },
        get_goal_progress: {
            description:
                "Bekijk hoe je er vandaag voor staat ten opzichte van je doelen: ringen die je inname afzetten tegen je doel, plus de voortgang van je gewicht. Tik op een macroring om te zien welke maaltijden eraan bijdroegen.",
            params: {},
            example: "Hoe sta ik er vandaag voor met mijn doelen?",
        },
        get_nutrition_summary: {
            description:
                "Bekijk je dagtotalen over een periode in een interactief dashboard: macrotegels afgezet tegen je doelen en een overzicht per dag. Eén aanroep beslaat maximaal 92 dagen; voor langere periodes geven trends je voortschrijdende gemiddelden.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date:
                    "Einddatum (JJJJ-MM-DD), maximaal 92 dagen inclusief de startdatum",
            },
            example: "Geef me een overzicht van de afgelopen week",
        },
        get_trends: {
            description:
                "Voortschrijdende gemiddelden over 7/14/30 dagen, variabiliteit, logreeksen, gemiddelde calorieën per dag van de week en je beste en slechtste dagen qua calorieën. Vooraf berekend, zodat de AI ze alleen nog hoeft na te vertellen. Met group_by geeft het ook gemiddelden per week, maand, kwartaal of jaar — per gelogde dag, dus dagen zonder maaltijden tellen niet mee — afgezet tegen de doelen die toen golden, met hoeveel dagen binnen het doel vielen en hoeveel mogelijk onvolledig zijn.",
            params: {
                days: "Periode in dagen (standaard 30, max 365).",
                group_by:
                    "<code>week</code>, <code>month</code>, <code>quarter</code> of <code>year</code>: 26 weken, 24 maanden, 12 kwartalen of 5 jaar, tot en met de periode waarin de einddatum valt (standaard vandaag). De periode ligt vast; <code>days</code> bepaalt nog steeds de voortschrijdende gemiddelden.",
            },
            example: "Hoe gingen mijn maanden vergeleken met mijn doelen?",
        },
        get_meal_patterns: {
            description:
                "Breng je eetpatronen in beeld: hoe vaak je elk maaltijdtype eet, het ontbijteffect, calorierijke lunches, late diners, doordeweeks tegenover het weekend en dagen die eruit springen.",
            params: {
                days: "Periode in dagen (standaard 30, min 7, max 365).",
            },
            example:
                "Zie je patronen in hoe ik eet, zoals laat dineren of het ontbijt overslaan?",
        },
        get_profile: {
            description:
                "Bekijk al je huidige instellingen in één keer: tijdzone (plus je lokale datum en tijd), de widgettaal, je gewichts- en lengte-eenheid, of de widgets in de chat worden getoond en of alcoholregistratie aanstaat.",
            params: {},
            example: "Wat zijn mijn huidige instellingen?",
        },
        set_timezone: {
            description:
                "Stel je IANA-tijdzone in, zodat de dag om middernacht in jouw tijdzone wisselt. Een maaltijd die je om 23:00 logt, telt dan voor die dag en niet voor de volgende UTC-dag.",
            params: {},
            example: "Ik zit in Berlijn, stel mijn tijdzone in",
        },
        set_language: {
            description:
                "Stel de taal in van de widgets in de chat: de dashboards en grafieken, niet de taal waarin de AI je antwoordt.",
            params: {
                locale: "ISO 639-1-code, bijv. <code>de</code>, <code>ja</code>. Ondersteund: Engels, Duits, Spaans, Frans, Nederlands, Pools, Italiaans, Oekraïens en Japans.",
            },
            example: "Toon mijn widgets in het Duits",
        },
        get_current_time: {
            description:
                "Bekijk de huidige datum en tijd in jouw tijdzone, plus het tijdstip in UTC. Sommige apps vertellen de assistent niet hoe laat het is; zo weet hij toch wat “vanochtend” of “vandaag” betekent zonder het je te vragen (standaard UTC als er geen tijdzone is ingesteld).",
            params: {},
            example: "Hoe laat is het nu bij mij?",
        },
        set_widget_display: {
            description:
                "Zet de visuele widgets in de chat aan of uit: de dashboards, doelringen en trendgrafieken. Staan ze uit, dan antwoorden dezelfde tools alleen met tekst en gegevens. Standaard staan ze aan; de wijziging geldt voor nieuwe gesprekken.",
            params: {
                enabled: "true om widgets te tonen, false voor alleen tekst",
            },
            example: "Zet de widgets uit",
        },
        set_alcohol_tracking: {
            description:
                "Zet alcoholregistratie aan of uit en kies of drankjes worden geteld in Amerikaanse standaardglazen of Britse eenheden. Het staat standaard uit, dus je moet er zelf om vragen. Zet je het weer uit, dan verdwijnt alcohol uit maaltijden, doelen en voortgang en leest de importer de alcoholkolom van een bestand niet meer. Wat al gelogd is, wordt niet verwijderd: je CSV-export bevat het nog steeds en het komt terug zodra je de registratie weer aanzet. De wijziging geldt vanaf je volgende bericht; er hoeft niets opnieuw te worden opgestart.",
            params: {
                enabled:
                    "true om alcohol te tonen in maaltijden, doelen en voortgang, false om het te verbergen",
                drink_unit:
                    "Welk standaardglas naast de grammen wordt getoond: <code>us</code> (14 g per glas) of <code>uk</code> (7,9 g per eenheid). Standaard <code>us</code>; opgeslagen wordt altijd het aantal gram zuivere ethanol.",
            },
            example:
                "Houd vanaf nu bij hoeveel alcohol ik drink, in Britse eenheden",
        },
        delete_account: {
            description:
                "Verwijder je Nutrition MCP-account definitief, met alle gegevens die erin over je zijn opgeslagen. Dit kan niet ongedaan worden gemaakt, dus de tool doet niets zonder uitdrukkelijke bevestiging, en de AI wordt gevraagd die pas te versturen nadat hij het eerst aan je heeft voorgelegd.",
            params: {},
            example: "Verwijder mijn account en al mijn gegevens",
        },
    },
    troubleshooting: {
        pillLabel: "Hulp",
        title: "Problemen oplossen",
        description:
            "Werkt er iets niet? De meeste problemen zijn snel opgelost.",
        stillStuck: "Kom je er nog steeds niet uit?",
        items: {
            "cannot-connect": {
                question:
                    "De connector maakt geen verbinding of vraagt steeds om opnieuw in te loggen",
                answerHtml:
                    "Verwijder de connector en voeg hem opnieuw toe met precies <code>https://nutrition-mcp.com/mcp</code>; het stuk <code>/mcp</code> moet erbij. Open in Claude <strong>Customize</strong> → <strong>Connectors</strong>, verbreek de verbinding met Nutrition en maak opnieuw verbinding; in ChatGPT ga je naar <strong>Settings</strong> → <strong>Apps</strong>. Log in met hetzelfde e-mailadres en wachtwoord (of hetzelfde Google-account) als eerst: je gegevens horen bij je account, niet bij de verbinding, dus bij opnieuw verbinden gaat er niets verloren. De verbinding blijft daarna actief zolang je hem minstens eens per 90 dagen gebruikt; werkt hij niet meer, maak dan op dezelfde manier opnieuw verbinding.",
            },
            "session-expired": {
                question: 'De inlogpagina toont {"error":"session_expired"}',
                answerHtml:
                    "De inlogpagina is maar 10 minuten geldig en vervalt ook als de server voor een update opnieuw opstart. Ga terug naar de inlogpagina en laad die opnieuw, of maak opnieuw verbinding vanuit je AI-app, en log daarna in zonder lang te wachten. Staat er <code>session_mismatch</code>, dan is het inloggen afgerond in een andere browser dan waarin het begon: begin opnieuw vanuit je AI-app en rond het af in dezelfde browser.",
            },
            "cannot-sign-in": {
                question:
                    "Ik kan niet inloggen, of ik ben mijn wachtwoord vergeten",
                answerHtml:
                    'Gebruik <strong>Inloggen</strong> voor een account dat je al hebt: bij een verkeerd e-mailadres of wachtwoord zie je daar “Onjuist e-mailadres of wachtwoord” en wordt er nooit een nieuw account aangemaakt. <strong>Account aanmaken</strong> is alleen voor je eerste bezoek. Controleer het e-mailadres op typfouten. Heb je je account aangemaakt met <strong>Doorgaan met Google</strong>, gebruik dan weer die knop. Je wachtwoord zelf resetten kan nog niet: mail vanaf het e-mailadres van je account naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>, dan reset ik het voor je.',
            },
            "history-missing": {
                question:
                    "Ik heb opnieuw verbinding gemaakt en mijn geschiedenis is weg",
                answerHtml:
                    'Elk e-mailadres is een apart account, dus als je inlogt met een ander e-mailadres, begin je met een leeg account; er is niets verwijderd. Verbreek de verbinding en log opnieuw in met het adres dat je oorspronkelijk gebruikte. Weet je niet zeker welk adres dat was, mail dan naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "De AI antwoordt, maar logt niets",
                answerHtml:
                    "Controleer of de connector voor dit gesprek aanstaat (in Claude zie je dat in het toolsmenu in het berichtvak) en vraag het rechtstreeks, bijvoorbeeld “log mijn ontbijt in Nutrition”. Vraagt je app toestemming om een tool te gebruiken, geef die dan.",
            },
            "wrong-day": {
                question: "Mijn maaltijden staan op de verkeerde dag",
                answerHtml:
                    'Dagen worden geteld in jouw tijdzone; heb je er nooit een ingesteld, dan geldt UTC. Vraag “welke tijdzone heb ik ingesteld?” (<a href="#get_profile"><code>get_profile</code></a>) en, als die niet klopt, “stel mijn tijdzone in op Europe/Berlin” (<a href="#set_timezone"><code>set_timezone</code></a>). Alles wat je hebt gelogd, wordt dan per lokale dag gegroepeerd, ook oudere registraties. De enige uitzondering is een registratie waaraan je een specifiek tijdstip gaf terwijl de tijdzone verkeerd stond: die behoudt het tijdstip waarmee ze is opgeslagen, dus ze kan nog een uur of een dag verschoven staan. Vraag de AI dan om die naar de juiste datum en tijd te verplaatsen (<a href="#update_meal"><code>update_meal</code></a>). Stel je tijdzone ook in voordat je je geschiedenis importeert: geïmporteerde maaltijden behouden het tijdstip dat ze bij het importeren kregen, en importeer je het bestand van een andere app opnieuw nadat je je tijdzone hebt gewijzigd, dan worden ze een tweede keer toegevoegd. Een export van Nutrition MCP wordt herkend en niet dubbel toegevoegd.',
            },
            "no-widgets": {
                question: "Ik zie alleen tekst, geen grafieken of kaarten",
                answerHtml:
                    'De visuele kaarten hebben een app nodig die interactieve MCP Apps-panelen ondersteunt, zoals Claude of ChatGPT; andere clients krijgen dezelfde informatie als tekst. Heb je de widgets uitgezet, vraag dan om ze weer aan te zetten (<a href="#set_widget_display"><code>set_widget_display</code></a>) en begin een nieuw gesprek: een chat die al openstaat, houdt de oude instelling tot hij opnieuw verbinding maakt. De kleine kaart na het loggen van een maaltijd verschijnt pas als je dagdoelen hebt ingesteld (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "De importer opent niet, of zegt dat hij niet kan opslaan",
                answerHtml:
                    'Het importvenster heeft een app nodig die interactieve panelen toont en waarin de widgets aanstaan. Staat er <em>Deze app laat dit venster niet in je eetdagboek schrijven</em>, of verschijnt het venster helemaal niet, vraag de AI dan om het bestand zelf te importeren: voeg de CSV toe of plak hem, en de AI gebruikt <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, dat elke rij controleert en dubbele rijen overslaat. Opnieuw versturen is dus veilig, zolang je tijdzone intussen niet is gewijzigd. Stel je tijdzone in vóór de eerste import: importeer je het bestand van een andere app na een wijziging opnieuw, dan worden de rijen nog een keer toegevoegd. Gebruik je het importvenster en wil je een alcoholkolom meenemen, zet dan eerst alcoholregistratie aan: het venster slaat die kolom over zolang de registratie uitstaat, en later opnieuw importeren vult hem niet alsnog in.',
            },
            "rate-limited": {
                question:
                    "Ik zie “Rate limit exceeded” of “Too many failed authentication attempts”",
                answerHtml:
                    "Elk account mag 60 verzoeken per minuut doen, en elke toolaanroep telt als minstens één verzoek. Wacht het aantal seconden dat in de melding staat en ga dan verder. Wil je veel maaltijden achteraf toevoegen, gebruik dan de importer in plaats van ze één voor één te loggen. Inlogpagina's staan 30 verzoeken per minuut per netwerk toe. Na 20 geweigerde verbindingspogingen op rij vanaf één netwerk (meestal een oude, ontkoppelde connector die het blijft proberen) worden verbindingen vanaf dat netwerk 5 minuten gepauzeerd; bij herhaling lopen de pauzes op tot hooguit een uur. Verwijder de oude connector en voeg hem opnieuw toe, dan stoppen de pogingen.",
            },
            "barcode-not-found": {
                question:
                    "Een barcode wordt niet gevonden, of de waarden lijken niet te kloppen",
                answerHtml:
                    "Barcodegegevens komen van Open Food Facts, een communitydatabase, dus sommige producten ontbreken en sommige gegevens zijn verouderd. Controleer of alle 8–14 cijfers onder de barcode goed zijn gelezen. Staat het product er niet in, dan kan de AI een schatting maken op basis van de naam of een foto van het voedingsetiket, en je kunt elk getal achteraf corrigeren. Voeg je het product toe op openfoodfacts.org, dan heeft iedereen er wat aan. Open Food Facts heeft geen cafeïnegegevens, dus cafeïne komt van het etiket of wordt geschat op basis van gangbare hoeveelheden.",
            },
            "health-sync-yesterday": {
                question: "Gisteren staat nog niet in Apple Health",
                answerHtml:
                    'De synchronisatie met Apple Health stuurt alleen afgeronde dagen. Een dag is afgerond om 05:00 de volgende ochtend in jouw tijdzone, dus gisteren komt binnen met de eerste synchronisatie na 05:00 vandaag, en vandaag verschijnt pas morgen in Gezondheid. Een synchronisatie draait wanneer een van de automatiseringen van de opdracht afgaat (de Gezondheid-app openen, je wekker stoppen) of wanneer je <strong>Nutrition MCP Health</strong> in de Opdrachten-app uitvoert en <strong>Sync now</strong> kiest. Een gemiste ochtend wordt vanzelf ingehaald: elke synchronisatie kijkt terug over de laatste 7 dagen. Dagen volgen de tijdzone in je profiel (<a href="#get_profile"><code>get_profile</code></a>) of, als je er nooit een hebt ingesteld, de tijdzone die je iPhone bij het verbinden doorgaf (<a href="#wrong-day">maaltijden op de verkeerde dag</a>). Dagen van vóór het verbinden worden alleen gestuurd als je bij het verbinden koos om tot 7 eerdere dagen op te halen.',
            },
            "health-sync-higher": {
                question: "Apple Health toont meer dan mijn chat",
                answerHtml:
                    "Apple Health kan iets bij een waarde optellen, maar een waarde die het al heeft nooit verlagen. Een maaltijd die je toevoegt aan een dag die al is verstuurd, volgt als een kleine extra invoer om 12:01, 12:02 enzovoort, zolang de dag binnen de laatste 7 dagen valt. Verwijder of verklein je een maaltijd nadat de dag is verstuurd, dan blijft Gezondheid hoger en toont de opdracht een melding met het verschil. Zo los je het op: open de Gezondheid-app, ga naar <strong>Blader</strong> → <strong>Voeding</strong>, open het betreffende type, tik op <strong>Toon alle gegevens</strong>, verwijder de invoer van die dag afkomstig van Opdrachten en voer het juiste totaal met de hand in. Gebruik nooit <strong>Verwijder alle gegevens van ‘Opdrachten’</strong>: dat wist ook wat je andere opdrachten hebben vastgelegd. Lijkt elke dag verdubbeld, dan schrijft een andere app dezelfde types en telt Gezondheid ze op: zet er één uit onder <strong>Deel</strong> → <strong>Apps</strong> in de Gezondheid-app.",
            },
            "health-sync-stopped": {
                question: "De synchronisatie met Apple Health is gestopt",
                answerHtml:
                    "Open de Opdrachten-app en voer <strong>Nutrition MCP Health</strong> met de hand uit: de opdracht vertelt wat er misging. Vraagt ze je opnieuw te verbinden, dan is de verbinding beëindigd (na 90 dagen zonder synchronisatie, 365 dagen na het verbinden of na <strong>Disconnect</strong>): voer haar uit, log op de pagina die opent in met hetzelfde account als in je AI-app en rond dat binnen 30 minuten af. Synchroniseert ze als je haar uitvoert, maar niet vanzelf, controleer dan of haar automatiseringen in het tabblad <strong>Automatisering</strong> van Opdrachten aan staan en zijn ingesteld op <strong>Voer direct uit</strong>. Meldt een bericht dat een dag Apple Health niet heeft bereikt, geef Opdrachten dan in de Gezondheid-app onder <strong>Deel</strong> → <strong>Apps</strong> → <strong>Opdrachten</strong> toestemming om elk voedingstype te schrijven en voer haar opnieuw uit. Een nieuwe iPhone verbinden vervangt de verbinding van de oude.",
            },
            "export-link": {
                question: "Mijn downloadlink voor de export werkt niet",
                answerHtml:
                    'Exportlinks verlopen na 60 minuten, en elke nieuwe export vervangt het vorige bestand. Vraag een nieuwe export aan (<a href="#export_all_data"><code>export_all_data</code></a>) en download hem meteen. Meldt de export 0 maaltijden terwijl je je geschiedenis verwachtte, dan ben je waarschijnlijk ingelogd met een ander e-mailadres: zie <a href="#history-missing">geschiedenis is weg</a>.',
            },
            "delete-account": {
                question: "Hoe verwijder ik mijn account?",
                answerHtml:
                    'Vraag de AI om je Nutrition MCP-account te verwijderen (<a href="#delete_account"><code>delete_account</code></a>). Die vraagt je om bevestiging en verwijdert daarna definitief je maaltijden, water, gewicht, lichaamsmaten, doelen, instellingen, het overzicht van welke tools je AI-app heeft gebruikt, een eventueel exportbestand, je inloggegevens en het account zelf. Dit kan niet ongedaan worden gemaakt, dus exporteer eerst je gegevens als je een kopie wilt. Verwijder daarna de connector uit je app. Log je later opnieuw in met hetzelfde e-mailadres, dan krijg je een nieuw, leeg account.',
            },
            "report-a-problem": {
                question: "Hoe meld ik een bug of een beveiligingsprobleem?",
                answerHtml:
                    'Meld bugs via <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: vermeld welke app je gebruikt (Claude, ChatGPT, …), wat je vroeg, wat er gebeurde en ongeveer wanneer. Zet er nooit je wachtwoord bij. Meld beveiligingsproblemen alsjeblieft niet openbaar, maar privé via <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">de privémelding van kwetsbaarheden op GitHub</a> of per e-mail, zoals het <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">beveiligingsbeleid</a> beschrijft. Voor al het andere mail je naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

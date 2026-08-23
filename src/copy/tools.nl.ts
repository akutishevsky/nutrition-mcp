// Dutch (nl) translation of ToolsDoc for /tools. See src/copy/tools.ts for
// the structural types (TOOLS, BADGE_META, CategoryId, BadgeKind) — those
// stay untranslated and shared across every locale. Only this file's
// prose is new. Tool names, parameter names, and category slugs are never
// translated; see tools.ts's header comment for the full reasoning.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_NL: ToolsDoc = {
    meta: {
        title: "Toolreferentie: alle 38 tools",
        description:
            "Alle 38 tools die de Nutrition MCP-server aan je AI geeft — maaltijden loggen, barcodes scannen, je geschiedenis uit een andere app importeren, water en gewicht bijhouden, doelen instellen en trends bekijken. Volledige referentie met beschrijvingen en voorbeeldzinnen.",
        ogDescription:
            "Alle 38 tools die de Nutrition MCP-server aan je AI geeft, inclusief een CSV-importer voor je geschiedenis uit een andere app — met beschrijvingen en voorbeeldzinnen.",
    },
    hero: {
        eyebrow: "Referentie",
        title: "Alles wat je AI kan doen",
        lead: "Je roept deze tools nooit rechtstreeks aan — je praat gewoon, en de assistent kiest de juiste tool. Hier is de volledige set die de Nutrition MCP-server aanbiedt, met wat elke tool doet en een zin die hem activeert.",
        countBold: "38 tools",
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
                "Voeg in één keer een reeks eerdere maaltijden toe — tot 50 tegelijk — in plaats van ze één voor één te loggen. De importer hierboven schrijft via deze tool, en de AI kan hem ook rechtstreeks gebruiken voor maaltijdgegevens die je in de chat hebt geplakt. Elke regel wordt eerst gecontroleerd en wat niet klopt wordt regel voor regel gerapporteerd, dus dezelfde regels opnieuw versturen is veilig en levert geen dubbele registraties op.",
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
                "Wijzig de gegevens van een maaltijd die je al hebt gelogd — de omschrijving, een macro, vezels, suiker, alcohol of cafeïne, de tijd, of notities. Ook zo wordt een ontbrekend gegeven achteraf aangevuld: als een maaltijd zonder vezel- of suikerwaarde is gelogd, meldt de server dat en vult de AI het hier in.",
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
            params: {},
            example: "Wat heb ik vandaag gegeten?",
        },
        get_meals_by_date: {
            description:
                "Bekijk alle maaltijden die je op een specifieke dag hebt gelogd.",
            params: {
                date: "Datum in JJJJ-MM-DD-formaat",
            },
            example: "Laat me alles zien wat ik op 4 juli heb gegeten",
        },
        get_meals_by_date_range: {
            description:
                "Haal in één keer alle maaltijden tussen twee datums op — handig om een week of een maand te overzien.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date: "Einddatum (JJJJ-MM-DD)",
            },
            example: "Toon mijn maaltijden van maandag tot vrijdag",
        },
        export_all_data: {
            description:
                "Exporteer alles wat je hebt bijgehouden als één ZIP-bestand — meals.csv, water.csv, weight.csv, goals.csv, profile.csv en een README.txt die de kolommen en eenheden uitlegt — met dezelfde privélink, 60 minuten geldig. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren.",
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
        get_weight_unit: {
            description:
                "Bekijk welke gewichtseenheid je op dit moment gebruikt.",
            params: {},
            example: "Welke gewichtseenheid gebruik ik?",
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
                "Krijg dagelijkse voedingstotalen over een periode als interactief dashboard: macrotegels ten opzichte van doelen en een uitsplitsing per dag.",
            params: {
                start_date: "Startdatum (JJJJ-MM-DD)",
                end_date: "Einddatum (JJJJ-MM-DD)",
            },
            example: "Geef me een overzicht van de afgelopen week",
        },
        get_trends: {
            description:
                "Voortschrijdende gemiddelden over 7/14/30 dagen, variabiliteit, logstreaks, uitsplitsingen per weekdag, en je beste en slechtste dagen voor calorieën en elke macro — vooraf berekend zodat de AI ze zo kan navertellen.",
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
        set_timezone: {
            description:
                "Stel je IANA-tijdzone in zodat dagen om middernacht in jouw tijdzone overgaan — een maaltijd die om 23:00 is gelogd, telt op die dag, niet op de volgende UTC-dag.",
            params: {},
            example: "Ik zit in Berlijn — stel mijn tijdzone in",
        },
        get_timezone: {
            description:
                "Bekijk voor welke tijdzone je bent ingesteld, samen met je huidige lokale datum en tijd (standaard UTC als niets is ingesteld).",
            params: {},
            example: "Op welke tijdzone sta ik ingesteld?",
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
        get_widget_display: {
            description:
                "Bekijk of de visuele widgets in de chat op dit moment zijn ingeschakeld.",
            params: {},
            example: "Staan de widgets aan?",
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
        get_alcohol_tracking: {
            description:
                "Bekijk of alcoholregistratie aanstaat, en in welk standaardglas je gramwaarden worden getoond.",
            params: {},
            example: "Houd ik alcohol bij?",
        },
        delete_account: {
            description:
                "Verwijder je account en alle bijbehorende gegevens permanent. Dit is onomkeerbaar — de AI vraagt altijd eerst om jouw bevestiging.",
            params: {},
            example: "Verwijder mijn account en al mijn gegevens",
        },
    },
};

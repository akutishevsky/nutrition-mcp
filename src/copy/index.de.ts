// German translation of src/copy/index.ts's IndexDoc. See that file's header
// for the shape/trust-level rules this follows: exactly four fields carry
// trusted inline markup (`connect.claude.steps`, `connect.chatgpt.steps`,
// `connect.other.noteHtml`, `faq[].visibleHtml`); everything else is plain
// text and is escaped by the generator. The hero chat's nutrient deltas
// (`add`) and clock strings are numbers, not copy, and are copied verbatim
// from the English source.
//
// Locale notes: the on-screen UI labels inside the install steps (Customize,
// Connectors, Add custom connector, Settings → Apps, Developer mode, …) stay
// in English because that is what the Claude and ChatGPT interfaces show a
// German user; only the instructions around them are translated. Numbers
// follow German formatting (2.000, 2.035) since they are copy the visitor
// reads, The two widget CARDS on the page are the real in-chat widgets, rendered at build time; every word on them comes from WIDGET_STRINGS (src/copy/widgets.ts), not from here.

import type { IndexDoc } from "./index.js";

export const INDEX_DE: IndexDoc = {
    title: "Nutrition MCP — Kostenloser Kalorien- & Makro-Tracker für Claude, ChatGPT und Cursor",
    metaDescription:
        "Erfasse Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker und Koffein im Gespräch mit deiner KI. Nutrition MCP ist ein kostenloser, quelloffener MCP-Server, der in Claude, ChatGPT, Cursor und jedem MCP-Client funktioniert. Keine App zu installieren.",
    ogDescription:
        "Kostenloser, quelloffener MCP-Server für Kalorien- und Makro-Tracking direkt in Claude, ChatGPT und Cursor. Sag, was du gegessen hast; er rechnet für dich.",
    keywords:
        "Ernährungs-Tracker, Kalorienzähler, Makro-Tracker, MCP-Server, Claude Connector, ChatGPT App, KI-Ernährungs-Tracking, Essensprotokoll, Barcode-Scanner, quelloffen, MyFitnessPal Alternative",

    hero: {
        titleBeforeEm: "Erfasse deine Ernährung, indem du mit deiner KI ",
        titleEm: "sprichst",
        titleAfterEm: ".",
        lead: "Nutrition MCP ist ein kostenloser, quelloffener Kalorien- und Makro-Tracker, der direkt in Claude, ChatGPT, Cursor lebt — in jeder KI, die MCP unterstützt. Sag, was du gegessen hast; er ermittelt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Zucker und Koffein, erfasst alles und zeigt dir den Tag. Keine App zu installieren.",
        ctaPrimary: "In einer Minute verbinden",
        ctaGithub: "GitHub",
        moreExamples: "Mehr Beispiele",
        chat: {
            status: "Nutrition · verbunden",
            photoCaption: "📷 Foto",
            pauseLabel: "Demo anhalten",
            exchanges: [
                {
                    userText:
                        "Haferflocken mit Beeren und ein Flat White zum Frühstück",
                    aiText: "Erfasst — etwa 380 kcal, 14 g Protein. Der Flat White bringt 130 mg Koffein mit.",
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
                        description:
                            "Haferflocken mit Beeren und ein Flat White",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "Das ist eine 330-ml-Coca-Cola — 139 kcal, 35 g Zucker, laut Open Food Facts. Als Snack erfasst.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Einen halben Liter Wasser",
                    aiText: "Erledigt. Heute bisher 500 ml.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText:
                        "Großer Salat mit gegrilltem Hähnchen zum Mittagessen",
                    aiText: "Erfasst — etwa 540 kcal, 46 g Protein. Du bist bei der Hälfte deiner 2.000 für heute.",
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
                        description: "Großer Salat mit gegrilltem Hähnchen",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "Wie stehe ich heute da?",
                    aiText: "Hier ist dein Tag bisher — Protein liegt im Plan, Zucker ist nah am Limit.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "So funktioniert's",
        title: "Drei Schritte. Keine App zu lernen.",
        sub: "So funktioniert KI-Ernährungs-Tracking mit einem MCP-Server: einmal verbinden, Mahlzeiten beschreiben und Übersichten abfragen, wann immer du willst.",
        steps: [
            {
                title: "Einmal verbinden",
                body: "Füge den Server zu Claude, ChatGPT oder einem beliebigen MCP-Client hinzu und melde dich mit Google oder E-Mail an. Das dauert unter einer Minute, und du musst es nie wieder tun.",
            },
            {
                title: "Sag einfach, was du gegessen hast",
                body: "Beschreib es in normalen Worten — oder schick ein Foto deines Essens, einen Screenshot aus einer Lieferapp oder einen Barcode (das Produkt wird online nachgeschlagen). Makros werden automatisch erfasst.",
            },
            {
                title: "Erfassen & auswerten",
                body: "Frag nach Tagesübersichten, wöchentlichen Trends, Zielfortschritt oder exportiere alles, was du erfasst hast, als CSV-Dateien — völlig kostenlos.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Schnell installieren",
        title: "In unter einer Minute mit Claude, ChatGPT oder Cursor verbunden.",
        sub: "Füge den Nutrition-MCP-Server zu deinem KI-Client hinzu, melde dich mit Google oder E-Mail und Passwort an und fang an, Mahlzeiten zu erfassen. Nichts zu installieren, nichts zu lernen.",
        copyLabel: "Kopieren",
        copiedLabel: "Kopiert",
        copyAriaLabel: "Server-URL kopieren",
        bullets: [
            "Funktioniert mit jedem Claude- und ChatGPT-Plan",
            "OAuth 2.0 — dein Client übernimmt die Anmeldung",
            "Einmal in Claude oder ChatGPT verbunden, folgt es dir auf iOS und Android",
        ],
        otherTabLabel: "Andere Clients",
        tabsLabel: "Wähle deinen KI-Client",
        claude: {
            steps: [
                "Öffne <b>Claude</b> (Web oder Desktop) und klick oben links auf <b>Customize</b>.",
                "Klick auf <b>Connectors</b>.",
                "Klick auf <b>+</b> und dann auf <b>Add custom connector</b>.",
                "Gib ihm einen Namen, zum Beispiel <b>Nutrition</b>.",
                "Füge <code>https://nutrition-mcp.com/mcp</code> in das Feld <b>Remote MCP server URL</b> ein.",
                "Klick auf <b>Add</b>.",
                "Klick auf <b>Connect</b> — die Anmeldeseite öffnet sich; fahre mit Google fort oder melde dich mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und erscheint automatisch auch in deinen iOS- und Android-Apps.",
            ],
            note: "Funktioniert mit jedem Claude-Plan. Der kostenlose Plan erlaubt jeweils einen verbundenen MCP-Server.",
        },
        chatgpt: {
            steps: [
                "Öffne <b>ChatGPT im Web</b> → <b>Settings</b> → <b>Apps</b>.",
                "Klick unten im Popup auf <b>Create app</b>. Falls du es nicht siehst, aktiviere <b>Developer mode</b> in den <b>Advanced settings</b>.",
                "Gib ihr einen Namen, zum Beispiel <b>Nutrition</b>.",
                "Füge bei <b>Connection</b> <code>https://nutrition-mcp.com/mcp</code> ein.",
                "Wähl bei <b>Authentication</b> <b>OAuth</b> — lass alles andere unverändert.",
                "Klick auf <b>Create</b> und dann auf <b>Sign in with Nutrition</b>.",
            ],
            note: "Funktioniert mit jedem ChatGPT-Plan.",
        },
        other: {
            noteHtml:
                "Füge die Konfiguration oben zu deinem Client hinzu (Cursor, VS Code, Claude Code und weitere). Windsurf verwendet <code>serverUrl</code> statt <code>url</code>. Führe in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> aus. Dein Client übernimmt die OAuth-Anmeldung automatisch.",
        },
    },

    onboarding: {
        title: "In den ersten fünf Minuten eingerichtet.",
        sub: "Keine Einstellungsseiten. Zeitzone, Kalorien- und Makroziele, Widget-Sprache — jedes davon ist ein Satz, den du einmal sagst.",
        stepLabel: "Schritt {n}",
        justSay: "Sag einfach ",
        steps: [
            {
                title: "Zeitzone einstellen",
                body: "Damit der Tag um deine lokale Mitternacht wechselt, nicht um die von jemand anderem.",
                say: "Stell meine Zeitzone auf New York",
            },
            {
                title: "Ziele festlegen",
                body: "Tägliche Kalorien, Makros und Wasser, dazu optional ein Zielgewicht.",
                say: "Setze mein Tagesziel auf 2.000 Kalorien und 150 g Protein",
            },
            {
                title: "Widget-Sprache wählen",
                body: "Die Sprache der In-Chat-Widgets — nicht das, was die KI dir zurückschreibt.",
                say: "Zeig meine Widgets auf Deutsch an",
            },
            {
                title: "Loslegen",
                body: "Sag, was du gegessen hast, schick ein Foto oder scanne einen Barcode.",
                say: "Ich hatte Haferflocken mit Beeren zum Frühstück",
            },
        ],
    },

    examples: {
        title: "Reden schlägt Tippen.",
        sub: "Eine Mahlzeit erfassen, einen Barcode scannen, die Woche durchsehen — echte Gespräche mit echten In-Chat-Widgets. Blätter durch ein paar davon.",
        status: "Nutrition · verbunden",
        prevLabel: "Zurück",
        nextLabel: "Weiter",
        pickerLabel: "Beispiel wählen",
        carouselLabel: "Beispielgespräche",
        slideLabel: "{n} von {total}",
        carouselRole: "Karussell",
        slideRole: "Folie",

        moreToolsLabel: "Nutzt außerdem",
        toolLinkLabel: "{tool} auf der Werkzeuge-Seite",
        photoMealAlt:
            "Foto: ein Teller Borschtsch mit einem Löffel Schmand und Dill, daneben eine Scheibe Roggenbrot",
        photoPackageAlt:
            "Foto: der Barcode auf einer Dose Coca-Cola, Nummer 5449000000996",
        threadLabel: "Unterhaltung",
        importerAlt: {
            file: "Der Importer im Chat, Schritt 1 von 4: Wähl deine exportierte CSV-Datei aus MyFitnessPal, Cronometer, Lose It! oder MacroFactor",
            map: "Schritt 2 von 4: Die Spalten der Datei wurden automatisch zugeordnet; dieser Export enthält keine Lebensmittelnamen",
            preview:
                "Schritt 3 von 4: eine Vorschau von 603 Mahlzeiten mit 322.343 kcal, bevor etwas gespeichert wird",
            done: "Schritt 4 von 4: 603 Mahlzeiten importiert",
        },
        importerCaption:
            "Die Ansichten des Importers der Reihe nach; in deinem Chat ist es eine einzige Karte, die sich laufend aktualisiert",
        downloadExpires: "Läuft in 60 Minuten ab",
        slides: [
            {
                id: "log-meal",
                title: "In normalen Worten erfassen",
                description:
                    "Sag es, wie du es einem Freund erzählen würdest. Fehlen Portion oder Mahlzeit, wird vor dem Schätzen nachgefragt. Ballaststoffe und Zucker stehen in jedem Eintrag, Koffein bei allem, was welches enthält, und „heute Morgen“ gilt in deiner Zeitzone.",
                toolNotes: {
                    log_meal:
                        "Speichert Frühstück mit Makros, Ballaststoffen, Zucker und Koffein",
                    log_water:
                        "Zählt die 500 ml um 07:00 zur heutigen Wassermenge",
                    get_current_time:
                        "Ermittelt das heutige Datum, damit „gegen 7“ auf 07:00 fällt",
                },
                messages: [
                    {
                        from: "user",
                        text: "Porridge mit Blaubeeren und nen Kaffee zum Frühstück",
                    },
                    {
                        from: "ai",
                        text: "Wie groß war die Schüssel, und hast du den Porridge mit Milch oder mit Wasser gemacht? War was im Kaffee?",
                    },
                    {
                        from: "user",
                        text: "normale Schüssel, mit Milch. Kaffee schwarz",
                    },
                    {
                        from: "ai",
                        text: "Frühstück erfasst: etwa 320 kcal, 11 g Protein und 6 g Ballaststoffe. Mit dem Kaffee bist du bei 95 mg von deinem Koffeinlimit von 400 mg.",
                    },
                    {
                        from: "user",
                        text: "ach, und so gegen 7 hab ich nen halben Liter Wasser getrunken, vorm Laufen",
                    },
                    {
                        from: "ai",
                        text: "500 ml Wasser um 07:00 heute Morgen hinzugefügt.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Porridge mit Milch und Blaubeeren (1 Schüssel) und schwarzer Kaffee (1 Tasse)",
                ],
            },
            {
                id: "photo-meal",
                title: "Foto vom Teller",
                description:
                    "Ein Foto startet ein Gespräch statt einer Schätzung: selbst gekocht oder Restaurant, wie du das Gericht bisher erfasst hast, dann eine Frage pro Nachricht zu Portion und Extras. Erfasst wird erst, wenn du die Zusammenfassung bestätigst.",
                toolNotes: {
                    log_meal:
                        "Erfasst erst, wenn alle Fragen geklärt sind und du Ja sagst",
                    search_meals:
                        "Findet deine bisherigen Borschtsch-Einträge für die Rückfrage",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "Mamas Borschtsch zum Mittagessen",
                    },
                    {
                        from: "ai",
                        text: "Sieht super aus. Du hast Borschtsch schon 6-mal erfasst: 5-mal mit Rindfleisch (etwa 320 kcal pro Teller, zuletzt am 2. Sept.) und einmal ohne Fleisch (etwa 180). Welcher ist es diesmal?",
                    },
                    { from: "user", text: "mit Rind" },
                    {
                        from: "ai",
                        text: "Alles klar, mit Rindfleisch. Zwei Dinge fehlen noch: der Schmand und wie viel du gegessen hast. Wie viele Löffel Schmand kamen ungefähr rein?",
                    },
                    {
                        from: "user",
                        text: "2 Esslöffel, vielleicht bisschen mehr",
                    },
                    {
                        from: "ai",
                        text: "Ich rechne mit 2 gut gehäuften Esslöffeln. Hast du den Teller leer gegessen?",
                    },
                    { from: "user", text: "komplett, das Brot auch" },
                    {
                        from: "ai",
                        text: "Also: Borschtsch mit Rindfleisch (1 Teller) mit 2 gehäuften EL Schmand, dazu laut Foto eine Scheibe Roggenbrot. Etwa 470 kcal und 24 g Protein. Als Mittagessen erfassen?",
                    },
                    { from: "user", text: "ja" },
                    {
                        from: "ai",
                        text: "Mittagessen erfasst: 470 kcal · 24 g Protein · 43 g Kohlenhydrate · 22 g Fett · 7 g Ballaststoffe · 10 g Zucker.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 9 }],
                cardMeals: [
                    "Borschtsch mit Rindfleisch (1 Teller, aufgegessen) mit Schmand (2 EL) und Roggenbrot (1 Scheibe)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Barcode scannen",
                description:
                    "Fotografier die Verpackung: Die Ziffern unter dem Barcode werden in Open Food Facts gesucht, dann wird gefragt, wie viel du hattest. Koffein fehlt dort und kommt vom Hersteller oder per Websuche; fehlende Ballaststoffe oder Zucker werden geschätzt.",
                toolNotes: {
                    lookup_barcode:
                        "Holt die Nährwerte vom Etikett der Dose aus Open Food Facts",
                    log_meal:
                        "Erfasst die ganze Dose zum Mittagessen, Koffein inklusive",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "hatte ich zum Mittagessen. wie schlimm ist das wirklich?",
                    },
                    {
                        from: "ai",
                        text: "Das ist eine 330-ml-Dose Coca-Cola: 139 kcal und 35 g Zucker, laut Open Food Facts. Hattest du die ganze Dose?",
                    },
                    { from: "user", text: "die ganze Dose" },
                    {
                        from: "ai",
                        text: "Zum Mittagessen erfasst: 139 kcal, 35 g Zucker und 33 mg Koffein nach Coca-Colas eigener Angabe, weil Open Food Facts kein Koffein listet. Und wie schlimm: Allein dieser Zucker ist mehr als die Hälfte deines Tageslimits von 60 g, und Open Food Facts stuft die Dose mit Nutri-Score E und NOVA 4 ein, also hochverarbeitet.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: ["Coca-Cola (330-ml-Dose)"],
            },
            {
                id: "goals-progress",
                title: "Ziele setzen, Stand abfragen",
                description:
                    "Leg Ziele wie Kalorien und Protein fest, dazu Limits für Zucker, Alkohol und Koffein, unter denen du bleiben willst; geändert wird nur, was du nennst. Frag dann nach einem beliebigen Tag und sieh jeden Wert neben seinem Ziel und was noch fehlt.",
                toolNotes: {
                    set_nutrition_goals:
                        "Speichert Kalorien- und Proteinziel und ein Koffeinlimit von 400 mg",
                    get_goal_progress:
                        "Zeigt den heutigen Stand je Ziel und was noch fehlt",
                },
                messages: [
                    {
                        from: "user",
                        text: "will ein bisschen abnehmen. stell mich auf 2000 kcal und 160 g Protein. und was ist ein vernünftiges Koffeinlimit? ich leb quasi von Kaffee",
                    },
                    {
                        from: "ai",
                        text: "EFSA und FDA setzen die Obergrenze für gesunde Erwachsene bei 400 mg am Tag an, etwa vier Tassen Filterkaffee; in der Schwangerschaft rät die EFSA zu 200 mg. Soll ich 400 als dein Limit nehmen?",
                    },
                    { from: "user", text: "ja, 400" },
                    {
                        from: "ai",
                        text: "Erledigt: 2.000 kcal und 160 g Protein als Ziel, Koffein unter 400 mg. Alles andere bleibt, wie es war: 220 g Kohlenhydrate, 70 g Fett, 30 g Ballaststoffe, 2,5 L Wasser und dein Zuckerlimit von 60 g.",
                    },
                    {
                        from: "user",
                        text: "passt heute Abend noch ein Nachtisch rein?",
                    },
                    {
                        from: "ai",
                        text: "Ja. Du bist bei 1.540 kcal und 104 g Protein, es fehlen also noch 460 kcal und 56 g Protein. Knapper ist der Zucker: 40 von deinen 60 g Limit. Griechischer Joghurt mit Beeren passt deshalb besser als Kuchen und hilft auch beim Protein.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
                cardMeals: [
                    "Griechischer Joghurt mit Granola und Beeren (1 Schüssel)",
                    "Hähnchen-Wrap mit Salat (1 Wrap)",
                    "Flat White (1 Tasse)",
                    "Lachs mit Reis und Brokkoli (1 Teller)",
                ],
            },
            {
                id: "review-week",
                title: "Die Woche durchsehen",
                description:
                    "Frag, wie die Woche lief: Das Trends-Widget öffnet sich im Chat mit Durchschnitten und erfassten Tagen. Wechsle zwischen 7, 14 und 30 Tagen oder tippe auf einen Nährstoff für seinen Verlauf, ohne neue Anfrage. Serien und Tage im Zielbereich kannst du auch erfragen.",
                toolNotes: {
                    get_trends:
                        "Mittelt deine letzten 7, 14 und 30 Tage, öffnet das Trends-Widget",
                },
                messages: [
                    {
                        from: "user",
                        text: "wie liefen die letzten zwei Wochen? fühlt sich ziemlich durcheinander an",
                    },
                    {
                        from: "ai",
                        text: "Stabiler, als es sich anfühlt. Du lagst im Schnitt bei 1.830 kcal am Tag, 170 unter deinen 2.000, aber dabei zählt der eine von 14 Tagen, den du nicht erfasst hast, als null. An den 13 erfassten Tagen waren es etwa 1.970, und an 9 Tagen lagst du weniger als 10 % neben deinem Ziel. Außerdem erfasst du seit 10 Tagen ohne Lücke.",
                    },
                    { from: "user", text: "und Zucker?" },
                    {
                        from: "ai",
                        text: "Den solltest du im Blick behalten. Im Schnitt waren es 52 g, und an 4 der 13 Tage lagst du über deinem Limit von 60 g.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Gewicht verfolgen",
                description:
                    "Erfasse dein Gewicht in kg oder lb und sieh den Trend hinter den Tagesschwankungen: geglätteter Durchschnitt, Veränderung über den Monat, Abstand zum Zielgewicht. Ein unmöglicher Wert, etwa mit vergessenem Komma, wird vor dem Speichern abgefangen.",
                toolNotes: {
                    log_weight:
                        "Speichert 78,4 kg und weist physikalisch unmögliche Werte ab",
                    get_weight_trends:
                        "Glättet 30 Tage und zeigt den Abstand zum Zielgewicht",
                },
                messages: [
                    { from: "user", text: "gerade gewogen, 784" },
                    {
                        from: "ai",
                        text: "784 kg kann ein Mensch nicht wiegen, deshalb habe ich das nicht gespeichert. Meintest du 78,4?",
                    },
                    {
                        from: "user",
                        text: "haha ja, Komma vergessen. wie ist mein Trend?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg gespeichert. Seit dem 14. Aug. hast du 1,8 kg abgenommen, etwa 0,4 kg pro Woche, und dein 7-Tage-Schnitt liegt bei 78,7 kg. Noch 3,4 kg bis zu deinem Zielgewicht von 75 kg.",
                    },
                ],
                cards: [{ kind: "weight-trends", after: 3 }],
            },
            {
                id: "meal-patterns",
                title: "Muster erkennen",
                description:
                    "Frag, wann du mehr isst, und deine eigenen Einträge werden verglichen: Werktage mit Wochenenden, Tage mit und ohne Frühstück, große Mittagessen, frühes mit spätem Abendessen. Auffällige Tage werden markiert, und du bekommst Muster, keine Ursachen.",
                toolNotes: {
                    get_meal_patterns:
                        "Vergleicht Frühstück, Abendessenszeit und Wochenenden über 30 Tage",
                },
                messages: [
                    {
                        from: "user",
                        text: "esse ich an Tagen ohne Frühstück mehr? fühlt sich so an",
                    },
                    {
                        from: "ai",
                        text: "Ein bisschen, ja. Du hast 28 der letzten 30 Tage erfasst und an 6 davon das Frühstück ausgelassen. Diese Tage lagen im Schnitt bei 2.215 kcal, gegenüber 1.940 an den 22 Tagen mit Frühstück, und bei etwa 35 g weniger Protein.",
                    },
                    {
                        from: "user",
                        text: "und spätes Abendessen? an Trainingstagen esse ich erst um 9",
                    },
                    {
                        from: "ai",
                        text: "Das fällt auch auf: Die 9 Tage mit Abendessen ab 20 Uhr lagen im Schnitt bei 2.165 kcal, gegenüber 1.920 an den anderen 19. Beides sind Muster in deinen Einträgen, kein Beweis, dass eins davon die Ursache ist.",
                    },
                    { from: "user", text: "und am Wochenende?" },
                    {
                        from: "ai",
                        text: "Kaum ein Unterschied: Wochenenden liegen im Schnitt bei 2.010 kcal, Werktage bei 1.993.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Auch Getränke erfassen",
                description:
                    "Die Alkohol-Erfassung bleibt aus, bis du danach fragst. Wähl US-Standard-Drinks oder UK-Einheiten, und jedes Getränk wird aus Menge und Alkoholgehalt in Gramm Alkohol umgerechnet. Schaltest du sie später aus, bleibt alles ausgeblendet, nie gelöscht.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Schaltet Alkohol ein, in Gramm und dazu in UK-Einheiten",
                    log_meal:
                        "Berechnet den Alkohol des Pints aus Menge und Alkoholgehalt",
                },
                messages: [
                    {
                        from: "user",
                        text: "kannst du auch meine Drinks mitzählen? will ein bisschen weniger trinken",
                    },
                    {
                        from: "ai",
                        text: "Klar. Soll ich Alkohol in US-Standard-Drinks oder in UK-Einheiten anzeigen?",
                    },
                    {
                        from: "user",
                        text: "UK-Einheiten, ich wohne in Manchester",
                    },
                    {
                        from: "ai",
                        text: "Die Alkohol-Erfassung ist an, in Gramm und dazu in UK-Einheiten.",
                    },
                    {
                        from: "user",
                        text: "hatte ein Pint Lagerbier zum Abendessen",
                    },
                    {
                        from: "ai",
                        text: "Wie stark war es? Lagerbier hat meist 4 bis 5 %, das steht am Zapfhahn oder auf der Dose.",
                    },
                    { from: "user", text: "4 %, glaub ich" },
                    {
                        from: "ai",
                        text: "Zum Abendessen erfasst: Ein Pint mit 568 ml und 4 % sind 17,9 g Alkohol, 2,3 UK-Einheiten, etwa 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: ["Lagerbier, 4 % (1 Pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Deine Historie mitnehmen",
                description:
                    "Du wechselst von MyFitnessPal, Cronometer, Lose It! oder MacroFactor? Erst wird deine Zeitzone geprüft, dann dein Export im Browser zugeordnet. Gespeichert wird erst nach deinem Okay zur Vorschau, und ein erneuter Import derselben Datei legt nichts doppelt an.",
                toolNotes: {
                    start_meal_import:
                        "Öffnet den Importer im Chat für deine Exportdatei",
                    get_profile:
                        "Bemerkt, dass noch keine Zeitzone eingestellt ist",
                    set_timezone:
                        "Setzt America/Chicago, damit Mahlzeiten in Ortszeit landen",
                },
                messages: [
                    {
                        from: "user",
                        text: "ich steig von MyFitnessPal um. kannst du mein Ernährungstagebuch rüberholen? den Export hab ich schon",
                    },
                    {
                        from: "ai",
                        text: "Ja. Vorher noch eins: Deine Zeitzone ist nicht eingestellt, importierte Mahlzeiten würden also nach UTC statt nach deiner Ortszeit eingeordnet. Wo wohnst du?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Auf America/Chicago gesetzt. Wähl jetzt im Importer unten die Nutrition-Summary-CSV aus deinem MyFitnessPal-Export. Sie wird direkt in deinem Browser gelesen, und gespeichert wird erst, wenn du die Vorschau bestätigst.",
                    },
                    {
                        from: "user",
                        text: "die Spalten hat er zugeordnet, aber bei Name des Lebensmittels steht „nicht in dieser Datei“?",
                    },
                    {
                        from: "ai",
                        text: "Das ist bei MyFitnessPal normal: Der Export hat pro Tag eine Zeile je Mahlzeit, mit den Summen, aber ohne Lebensmittelnamen. Jede Mahlzeit wird stattdessen nach ihrer Mahlzeitenart benannt, Kalorien und Makros bleiben erhalten.",
                    },
                    {
                        from: "user",
                        text: "603 Mahlzeiten. da steht, die werden für die Mittagszeit eingetragen?",
                    },
                    {
                        from: "ai",
                        text: "Genau, der Export hat Datumsangaben, aber keine Uhrzeiten. Mit der Mittagszeit landet jede Mahlzeit in Chicago am richtigen Tag; du siehst nur nicht, wann du wirklich gegessen hast.",
                    },
                    { from: "user", text: "fertig! ist alles angekommen?" },
                    {
                        from: "ai",
                        text: "Alles: 603 Mahlzeiten importiert, keine fehlgeschlagen.",
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
                title: "Nimm deine Daten mit",
                description:
                    "Eine Anfrage packt alle Mahlzeiten, Wasser-Einträge, Wägungen, Ziele und Einstellungen in ein ZIP aus CSV-Dateien mit README auf Englisch. Jeder Zeitstempel nennt seine Zeitzone, und meals.csv lässt sich direkt wieder importieren.",
                toolNotes: {
                    export_all_data:
                        "Packt sechs Dateien in ein ZIP, privater Link für 60 Minuten",
                },
                messages: [
                    {
                        from: "user",
                        text: "meine Ernährungsberaterin will mein Ernährungstagebuch sehen. kannst du mir das als Tabelle rausgeben?",
                    },
                    {
                        from: "ai",
                        text: "Bitte schön: ein ZIP mit 1.204 Mahlzeiten, 318 Wasser-Einträgen und 64 Wägungen, dazu deine Ziele und Einstellungen. Dein Ernährungstagebuch ist die meals.csv darin, die sich in Excel oder Google Sheets öffnen lässt.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "kann ich ihr nicht einfach den Link schicken?",
                    },
                    {
                        from: "ai",
                        text: "Lad es lieber herunter und schick ihr die Datei. Der Link funktioniert nach 60 Minuten nicht mehr, und wer ihn hat, kann deinen ganzen Export öffnen, Gewicht und Einstellungen inklusive, nicht nur die Mahlzeiten.",
                    },
                    {
                        from: "user",
                        text: "gut zu wissen. könnte ich später daraus wiederherstellen, falls nötig?",
                    },
                    {
                        from: "ai",
                        text: "Deine Mahlzeiten ja. meals.csv lässt sich direkt wieder importieren, und jede Mahlzeit, die du noch hast, wird an ihrer ID erkannt und übersprungen, sodass nichts doppelt vorkommt. Wasser, Gewicht, Ziele und Einstellungen liegen nur für deine Unterlagen im ZIP; sie lassen sich nicht wieder importieren.",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "Live · alle, bisher",
        title: "Frühstück hier, Abendessen woanders.",
        sub: "Live-Statistiken über alle Nutrition-MCP-Konten — Kalorien, Mahlzeiten-Einträge, Makros und abgenommenes Gewicht — alle fünf Sekunden aktualisiert.",
        unitGroupLabel: "Einheiten",
        unitMetricLabel: "Metrisch",
        unitImperialLabel: "Imperial",
        refreshBefore: "Aktualisiert alle 5 s · nächste in ",
        refreshAfter: "s",
        sinceOpenLabel: "seit dem Öffnen dieser Seite",
        cards: {
            calories: "Erfasste Kalorien",
            foodLogs: "Mahlzeiten-Einträge",
            protein: "Erfasstes Protein",
            carbs: "Erfasste Kohlenhydrate",
            fat: "Erfasstes Fett",
            weightLost: "Abgenommen seit 2. Juli 2026",
            water: "Erfasstes Wasser",
        },
        foodLogsUnit: "Einträge",
        timezonesAfter:
            " Zeitzonen · der Tag wechselt um die jeweils eigene Mitternacht",
        mapNote: "Punktgröße = Anteil der Konten · fahr über einen Punkt",
        mapShare: "{share} der Konten",
        mapAriaLabel:
            "Punktraster-Weltkarte der Nutrition-MCP-Konten nach Zeitzone; größere Punkte bedeuten einen größeren Anteil",
    },

    support: {
        eyebrow: "Immer kostenlos",
        title: "Kostenloses Ernährungs-Tracking. Keine Premium-Stufe. Niemals.",
        sub: "Jedes Werkzeug, jedes Widget, jeder Export — für alle, ohne Kosten. Es ist das quelloffene Projekt einer einzelnen Person, und der Code steht unter MIT-Lizenz, damit das so bleibt.",
        bullets: [
            "Alle 36 Werkzeuge und sechs Widgets inklusive",
            "Keine Werbung, keine Upsells, keine gesperrten Funktionen",
            "Exportiere oder lösch deine Daten jederzeit",
            "Hoste es selbst, wenn du magst — Dockerfile inklusive",
        ],
        patreon: {
            eyebrow: "Optional · Patreon",
            title: "Wenn es sich für dich lohnt, hilf mit, den Server am Laufen zu halten.",
            sub: "Die einzigen Kosten sind Hosting und Datenbank. Unterstützer decken sie — jeder Betrag, jederzeit kündbar. Nichts wird freigeschaltet; du bekommst nur die Build-Notizen zuerst und ein Mitspracherecht, was als Nächstes kommt.",
            cta: "Auf Patreon unterstützen",
            starCta: "Lieber einen Stern geben",
        },
        postsTitle: "Neueste Beiträge auf Patreon",
        postsAll: "Alle Beiträge",
        postLinkLabel: "Auf Patreon lesen",
    },

    contact: {
        eyebrow: "Kontakt",
        title: "Sag Hallo.",
        sub: "Einen Bug gefunden, eine Idee oder hat es eine Mahlzeit komplett falsch eingeschätzt? Schreib mir direkt eine E-Mail — ich lese jede Nachricht.",
        emailAriaLabel: "E-Mail an anton@nutrition-mcp.com",
        cards: {
            email: { title: "E-Mail", sub: "Für alles — der direkte Draht" },
            issues: {
                title: "GitHub Issues",
                sub: "Bugs und Feature-Wünsche, öffentlich",
            },
            patreon: {
                title: "Patreon",
                sub: "Build-Notizen, Abstimmungen und Unterstützer-Chat",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Fragen zu Nutrition MCP.",
        subBefore:
            "Was es ist, wo es funktioniert, was es kostet und wer deine Daten sieht. Fehlt etwas? ",
        subLink: "Frag mich direkt",
        subAfter: ".",
        categoriesLabel: "Fragen nach Kategorie filtern",
        categories: {
            all: "Alle",
            basics: "Grundlagen",
            clients: "Clients",
            tracking: "Erfassen",
            data: "Deine Daten",
        },
    },
    faq: [
        // Grundlagen
        {
            question: "Was ist Nutrition MCP?",
            visibleHtml:
                "Ein kostenloser, quelloffener MCP-Server (Model Context Protocol) für Ernährungs-Tracking. Verbinde ihn mit Claude, ChatGPT, Cursor oder jedem MCP-Client und erfasse Mahlzeiten, Kalorien, Makros, Wasser und Gewicht im Gespräch.",
            category: "basics",
        },
        {
            question: "Was ist ein MCP-Server?",
            visibleHtml:
                "Ein kleiner Dienst, den deine KI während des Gesprächs aufrufen kann. Nutrition MCP gibt Claude, ChatGPT, Cursor und Co. 36 Ernährungs-Werkzeuge — Erfassen, Ziele, Trends, Import und Export. Du siehst die Werkzeuge nie; du sprichst einfach.",
            category: "basics",
        },
        {
            question: "Ist Nutrition MCP kostenlos?",
            visibleHtml:
                "Ja. Keine Premium-Stufe, keine Werbung, keine gesperrten Funktionen. Du brauchst nur ein Claude- oder ChatGPT-Konto, um dich zu verbinden. Spenden auf Patreon decken die Serverkosten.",
            category: "basics",
        },
        // Clients
        {
            // The visible answer states the server URL itself, so no
            // jsonLdText override is needed — stripping tags gives the same
            // sentence (mirrors the English source).
            question: "Funktioniert es mit ChatGPT?",
            visibleHtml:
                "Ja. Öffne in ChatGPT im Web Settings → Apps → Create app, füge <code>https://nutrition-mcp.com/mcp</code> mit OAuth-Authentifizierung ein und melde dich an. Es funktioniert mit jedem ChatGPT-Plan.",
            category: "clients",
        },
        {
            question: "Funktioniert es mit Cursor, VS Code oder Claude Code?",
            visibleHtml:
                "Ja — mit jedem Client, der Remote-MCP-Server über HTTP unterstützt. Füge die URL in deine <code>mcp.json</code> ein oder führe in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> aus.",
            category: "clients",
        },
        {
            question: "Funktioniert es auf meinem Handy?",
            visibleHtml:
                "Ja. Verbinde es einmal in Claude oder ChatGPT im Web oder auf dem Desktop, und es erscheint automatisch in deren iOS- und Android-Apps.",
            category: "clients",
        },
        // Erfassen
        {
            // Kept from the previous landing page verbatim: test-pinned
            // (src/site-copy.test.ts checks that caffeine is named "in
            // Milligramm" here and that the JSON-LD answer matches).
            question: "Was kann ich erfassen?",
            visibleHtml:
                "Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Wasser für jeden Eintrag — beschrieben in normaler Sprache oder über einen Produkt-Barcode via Open Food Facts abgerufen. Koffein wird ebenfalls erfasst, in Milligramm, der Einheit, die jedes Etikett verwendet, und es liefert keine Kalorien. Auch Alkohol wird erfasst, in Gramm reinen Alkohols, sobald du das aktivierst. Du kannst außerdem dein Körpergewicht in kg oder lb erfassen und Trends zu einem Zielgewicht verfolgen. Sieh dir Tagesübersichten an, frag Mahlzeiten nach Datumsbereich ab, ändere oder lösche vergangene Einträge, leg Ziele fest und beobachte Trends über die Zeit.",
            category: "tracking",
        },
        {
            question: "Wie genau ist die Kalorienzählung?",
            visibleHtml:
                "Die Werte sind Schätzungen aus dem, was du beschreibst — so, wie ein kundiger Freund sie schätzen würde. Gut für Trends, nicht für medizinische Entscheidungen. Barcode-Scans nutzen Daten von Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Wird Alkohol erfasst?",
            visibleHtml:
                "Nur wenn du es aktivierst. Die Alkohol-Erfassung ist standardmäßig ausgeschaltet; eingeschaltet werden Getränke in Gramm reinen Alkohols erfasst und als US-Standard-Drinks oder UK-Einheiten angezeigt.",
            category: "tracking",
        },
        // Deine Daten
        {
            // The closing sentence is pinned by src/site-copy.test.ts: the
            // export takes everything out, but only meals come back in.
            question:
                "Kann ich meine Historie aus MyFitnessPal oder Cronometer importieren?",
            visibleHtml:
                "Ja. Importiere deine Mahlzeiten-Historie aus MyFitnessPal, Cronometer, Lose It!, MacroFactor oder jeder anderen CSV, indem du die Spalten zuordnest — bis zu 50 Zeilen pro Aufruf. Mahlzeiten sind bisher der einzige Teil, der wieder importiert werden kann.",
            category: "data",
        },
        {
            // Must name meals, water, weight, goals and profile — the five
            // files in the export archive (src/site-copy.test.ts).
            question: "Wer sieht meine Daten, und kann ich sie exportieren?",
            visibleHtml:
                "Nur du. Exportiere alles — Mahlzeiten, Wasser, Gewicht, Ziele, Profil — als ZIP mit CSV-Dateien über einen 60 Minuten gültigen Download-Link, oder lösch dein Konto komplett. MIT-lizenziert, du kannst es also auch selbst hosten.",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "Kann ich es selbst hosten?",
            visibleHtml:
                'Ja. Nutrition MCP ist quelloffen (MIT-Lizenz). Du kannst deine eigene Instanz mit deinem eigenen Supabase-Projekt betreiben — das <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-Repository</a> enthält eine vollständige Anleitung zum Selbst-Hosten und ein Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Deine nächste Mahlzeit ist nur einen Satz entfernt.",
        sub: "Kostenloses, quelloffenes Ernährungs-Tracking für Claude, ChatGPT und Cursor — und deine Daten gehören dir, zum Exportieren oder Löschen, wann immer du willst.",
        primary: "Jetzt verbinden",
        secondary: "Stern auf GitHub geben",
    },
};

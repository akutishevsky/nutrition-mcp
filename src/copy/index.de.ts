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
        slides: [
            {
                id: "log-meal",
                title: "In normalen Worten erfassen",
                description:
                    "Sag, was du gegessen und getrunken hast, so wie du es einem Freund erzählen würdest. Kalorien, Makros, Ballaststoffe und Koffein werden berechnet, Uhrzeiten automatisch zugeordnet.",
                messages: [
                    {
                        from: "user",
                        text: "Eine Schüssel Haferflocken mit Beeren und eine Tasse Kaffee zum Frühstück",
                    },
                    {
                        from: "ai",
                        text: "Frühstück erfasst: etwa 320 kcal, 11 g Protein, 6 g Ballaststoffe. Der Kaffee bringt 95 mg Koffein mit.",
                    },
                    {
                        from: "user",
                        text: "Und 500 ml Wasser heute Morgen gegen 7, nach dem Laufen",
                    },
                    {
                        from: "ai",
                        text: "500 ml Wasser um 07:00 heute Morgen hinzugefügt.",
                    },
                ],
            },
            {
                id: "photo-meal",
                title: "Foto vom Teller",
                description:
                    "Schick ein Foto: Erst wird geklärt, woher das Essen stammt, dann werden deine bisherigen Einträge geprüft, und es kommt immer nur eine kurze Frage. Erfasst wird nie allein anhand des Bildes.",
                messages: [
                    { from: "user", photo: "meal", text: "Mittagessen" },
                    {
                        from: "ai",
                        text: "Borschtsch mit Schmand und einer Scheibe Roggenbrot. Sieht selbst gemacht aus, oder?",
                    },
                    { from: "user", text: "Ja, nach Mamas Rezept" },
                    {
                        from: "ai",
                        text: "Du hast Borschtsch schon auf zwei Arten erfasst: mit Rindfleisch (~320 kcal pro Teller) und ohne Fleisch (~180). Welcher ist es diesmal?",
                    },
                    {
                        from: "user",
                        text: "Mit Rindfleisch. Ich habe zwei Esslöffel Schmand dazugegeben",
                    },
                    {
                        from: "ai",
                        text: "Alles klar. Du hast also einen ganzen Teller Borschtsch mit Rindfleisch und 2 EL Schmand gegessen, dazu die Scheibe Roggenbrot: etwa 470 kcal, 24 g Protein. Als Mittagessen erfassen?",
                    },
                    { from: "user", text: "Ja" },
                    {
                        from: "ai",
                        text: "Mittagessen erfasst: 470 kcal · 24 g Protein · 43 g Kohlenhydrate · 22 g Fett · 7 g Ballaststoffe · 10 g Zucker.",
                    },
                ],
            },
            {
                id: "scan-barcode",
                title: "Barcode scannen",
                description:
                    "Fotografier die Verpackung. Das Produkt kommt von Open Food Facts, umgerechnet auf die Menge, die du tatsächlich hattest, und Lücken in den Daten werden ergänzt.",
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "Hatte ich zum Mittagessen",
                    },
                    {
                        from: "ai",
                        text: "Das ist eine 330-ml-Coca-Cola: 139 kcal und 35 g Zucker, laut Open Food Facts. Hattest du die ganze Dose?",
                    },
                    { from: "user", text: "Ja, die ganze" },
                    {
                        from: "ai",
                        text: "Zum Mittagessen erfasst: 139 kcal, 35 g Zucker, 0 g Ballaststoffe. Open Food Facts hat keinen Koffeinwert, daher habe ich den von Coca-Cola selbst genommen: etwa 32 mg pro Dose.",
                    },
                ],
            },
            {
                id: "goals-progress",
                title: "Ziele setzen, Stand abfragen",
                description:
                    "Leg Tagesziele und Limits in einem Satz fest und frag dann, wo du heute stehst und wie viel noch fehlt.",
                messages: [
                    {
                        from: "user",
                        text: "Setz meine Ziele: 2.000 kcal, 160 g Protein und ein Koffeinlimit. Was wäre sinnvoll?",
                    },
                    {
                        from: "ai",
                        text: "Ein gängiger Richtwert ist die Obergrenze von EFSA und FDA für gesunde Erwachsene: 400 mg am Tag, etwa vier Tassen Filterkaffee. Soll ich das nehmen?",
                    },
                    { from: "user", text: "Ja, 400" },
                    {
                        from: "ai",
                        text: "Ziele aktualisiert: 2.000 kcal und 160 g Protein als Ziel, Koffein unter 400 mg.",
                    },
                    {
                        from: "user",
                        text: "Passt heute Abend noch ein Dessert rein?",
                    },
                    {
                        from: "ai",
                        text: "Du bist heute bei 1.540 kcal und 104 g Protein: Bis zu deinen Zielen fehlen noch 460 kcal und 56 g Protein. Ein Dessert mit etwa 200 kcal passt also noch, solange der Rest vor allem Protein ist.",
                    },
                ],
            },
            {
                id: "review-week",
                title: "Die Woche durchsehen",
                description:
                    "Frag, wie die Woche lief, und das Trends-Widget öffnet sich direkt im Chat. Wechsle zwischen 7, 14 und 30 Tagen oder tippe auf einen Nährstoff, um seinen Verlauf zu sehen.",
                messages: [
                    { from: "user", text: "Wie sah letzte Woche aus?" },
                    {
                        from: "ai",
                        text: "Du lagst über die letzten 14 Tage im Schnitt bei 1.830 kcal am Tag, an 13 davon mit Einträgen — 170 unter deinem Ziel. Protein war dein konstantester Makro.",
                    },
                ],
                widget: "trends",
            },
            {
                id: "weight-trend",
                title: "Gewicht verfolgen",
                description:
                    "Erfasse dein Gewicht in kg oder lb und sieh den echten Trend: die Veränderung über den Monat, einen geglätteten Durchschnitt und den Abstand zu deinem Zielgewicht.",
                messages: [
                    {
                        from: "user",
                        text: "Gerade gewogen: 78,4 kg. Wie ist der Trend?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg erfasst. Du hast in den letzten 30 Tagen 1,8 kg abgenommen, der 7-Tage-Schnitt liegt bei 78,7 kg. Noch 3,4 kg bis zu deinem Zielgewicht von 75 kg.",
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Muster erkennen",
                description:
                    "Frag, was deine Kalorienaufnahme beeinflusst. Verglichen werden Werktage mit Wochenenden, Tage mit und ohne Frühstück sowie frühes mit spätem Abendessen.",
                messages: [
                    { from: "user", text: "Esse ich am Wochenende mehr?" },
                    {
                        from: "ai",
                        text: "Nicht wirklich. In den letzten 30 Tagen liegen deine Werktage im Schnitt bei 1.986 kcal und deine Wochenenden bei 1.977.",
                    },
                    {
                        from: "user",
                        text: "Gibt es etwas, das einen Unterschied macht?",
                    },
                    {
                        from: "ai",
                        text: "Die Uhrzeit des Abendessens. An Tagen mit Abendessen ab 20 Uhr liegst du im Schnitt bei 2.150 kcal, bei früherem Abendessen bei 1.915.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Auch Getränke erfassen",
                description:
                    "Die Alkohol-Erfassung ist optional. Wähl US-Standard-Drinks oder UK-Einheiten, und jedes Getränk wird anhand von Menge und Alkoholgehalt in Gramm Alkohol erfasst.",
                messages: [
                    {
                        from: "user",
                        text: "Ich möchte auch erfassen, was ich trinke",
                    },
                    {
                        from: "ai",
                        text: "Gern. Soll in US-Standard-Drinks oder UK-Einheiten gezählt werden?",
                    },
                    { from: "user", text: "UK-Einheiten" },
                    {
                        from: "ai",
                        text: "Die Alkohol-Erfassung ist an, in Gramm und dazu in UK-Einheiten. Sie gilt ab deiner nächsten Nachricht, ein neuer Chat ist nicht nötig.",
                    },
                    {
                        from: "user",
                        text: "Hatte ein Pint Lagerbier mit 4 % zum Abendessen",
                    },
                    {
                        from: "ai",
                        text: "Zum Abendessen erfasst: Ein Pint mit 568 ml und 4 % sind 18 g Alkohol, 2,3 UK-Einheiten, etwa 180 kcal.",
                    },
                ],
            },
            {
                id: "import-history",
                title: "Deine Historie mitnehmen",
                description:
                    "Du wechselst von MyFitnessPal, Cronometer, Lose It! oder MacroFactor? Dein Export wird im Browser gelesen, und gespeichert wird erst, wenn du bestätigst.",
                messages: [
                    {
                        from: "user",
                        text: "Kannst du meine MyFitnessPal-Historie übernehmen?",
                    },
                    {
                        from: "ai",
                        text: "Gern. Zuerst: Deine Zeitzone ist nicht eingestellt, importierte Uhrzeiten würden also als UTC gelesen. Wo wohnst du?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Zeitzone auf America/Chicago gesetzt. Wähl jetzt im Importer deine Exportdatei aus. Sie wird in deinem Browser gelesen, und gespeichert wird erst, wenn du die Vorschau bestätigst.",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Nimm deine Daten mit",
                description:
                    "Eine Anfrage genügt für ein ZIP mit allen Mahlzeiten, Wasser-Einträgen, Wägungen, Zielen und Einstellungen, und die Mahlzeiten-Datei lässt sich direkt wieder importieren.",
                messages: [
                    { from: "user", text: "Sichere alle meine Daten" },
                    {
                        from: "ai",
                        text: "Erledigt: ein ZIP mit 1.204 Mahlzeiten, 318 Wasser-Einträgen, 64 Wägungen, deinen Zielen und deinen Profileinstellungen. Hier ist der Download-Link. Er ist 60 Minuten gültig.",
                    },
                    {
                        from: "user",
                        text: "Kann ich daraus später wiederherstellen?",
                    },
                    {
                        from: "ai",
                        text: "Deine Mahlzeiten ja. meals.csv lässt sich direkt wieder importieren, und jede Mahlzeit, die du noch hast, wird an ihrer ID erkannt und übersprungen, sodass nichts doppelt vorkommt. Wasser, Gewicht, Ziele und Einstellungen gibt es nur als Export, also bewahr das ZIP auf.",
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

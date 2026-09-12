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
        slides: [
            {
                title: "Mahlzeit erfassen",
                sub: "Normale Worte, keine Datenbank",
                userText:
                    "Ich hatte Haferflocken mit Beeren und einen Kaffee zum Frühstück",
                aiText: "Frühstück erfasst — etwa 320 kcal, 11 g Protein. Der Kaffee bringt 95 mg Koffein mit.",
            },
            {
                title: "Barcode scannen",
                sub: "Open Food Facts, auf deine Portion skaliert",
                userText: "Scanne diesen Barcode: 5449000000996",
                aiText: "Das ist eine 330-ml-Coca-Cola — 139 kcal, 35 g Zucker, laut Open Food Facts. Wie viel hattest du davon?",
            },
            {
                title: "Die Woche durchsehen",
                sub: "Trends-Widget, direkt im Chat",
                userText: "Wie sah letzte Woche aus?",
                aiText: "Du lagst über die letzten 14 Tage im Schnitt bei 1.830 kcal am Tag, an 13 davon mit Einträgen — 170 unter deinem Ziel. Protein war dein konstantester Makro.",
                widget: "trends",
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

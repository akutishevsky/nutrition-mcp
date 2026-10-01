// German translation of src/copy/index.ts's IndexDoc. See that file's header
// for the shape/trust-level rules this follows: the hero chat and the example
// slides are structured (one field per message), so only words are translated
// here; `photo`, `card`, `meal.type`, slide ids, tool-note keys, `from`,
// `download` and `cards` are structure, copied verbatim from English. Every
// figure a card draws is quoted unchanged, in German number formatting.
//
// The on-screen UI labels inside the install steps (Customize, Connectors,
// Settings → Apps, Developer mode, …) stay in English because that is what
// the Claude and ChatGPT interfaces show a German user.

import type { IndexDoc } from "./index.js";

export const INDEX_DE: IndexDoc = {
    title: "Nutrition MCP — Kalorien- & Makro-Tracker für Claude & ChatGPT",
    metaDescription:
        "Mahlzeiten, Kalorien und Makros im Gespräch mit Claude oder ChatGPT erfassen. Kostenloser, quelloffener MCP-Server mit Barcode-Suche, Gewicht und Datenexport.",
    ogDescription:
        "Mahlzeiten, Kalorien und Makros im Gespräch mit Claude oder ChatGPT erfassen. Kostenloser, quelloffener MCP-Server mit Barcode-Suche, Gewicht und Datenexport.",
    keywords:
        "Ernährungs-Tracker, Mahlzeiten-Tracker, MCP-Server, Claude AI, ChatGPT, Kalorienzähler, Makro-Tracker, Barcode-Scanner, Essensprotokoll, Diät-Tracker, Gewichts-Tracker, Gewichtsprotokoll, KI-Ernährung, Model Context Protocol",

    hero: {
        titleBeforeEm: "Erfasse deine Ernährung, indem du mit deiner KI ",
        titleEm: "sprichst",
        titleAfterEm: ".",
        lead: "Verbinde Claude oder ChatGPT und sag einfach, was du gegessen hast. Kalorien und Makros werden automatisch erfasst.",
        ctaPrimary: "Schnell installieren",
        ctaSecondary: "Unterstützen",
        moreExamples: "Mehr Beispiele",
        chat: {
            photoAlt:
                "Foto: eine Smoothie-Bowl mit Banane, Beeren und Granola, daneben ein Americano",
            pauseLabel: "Demo anhalten",
            replayLabel: "Demo wiederholen",
            exchanges: [
                {
                    photo: true,
                    userText: "Frühstück + Americano",
                    aiText: "Eine Smoothie-Bowl, so wie es aussieht selbst gemacht. Du hattest sie bisher in zwei Varianten: mit Granola und Honig oder nur mit Obst. Welche ist es diesmal?",
                },
                {
                    userText: "Granola und Honig, ein voller Löffel",
                    aiText: "Alles klar. Und der Americano: schwarz oder mit Milch?",
                },
                {
                    userText: "ein Schuss Hafermilch",
                    aiText: "Also: die Bowl mit einer Handvoll Granola und 1 EL Honig, dazu ein Americano mit einem Schuss Hafermilch. Etwa 480 kcal und 21 g Protein. Als Frühstück erfassen?",
                },
                {
                    userText: "ja",
                    aiText: "Frühstück erfasst: 480 kcal, 21 g Protein und 150 mg Koffein. Drin stecken 51 g Zucker, 17 g davon aus dem Honig.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie-Bowl (griechischer Joghurt, Banane, Beeren) mit Granola (1 Handvoll) und Honig (1 EL); Americano mit einem Schuss Hafermilch",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "Reste von der Wokpfanne von gestern Abend, gleiche Portion. und ne 500-ml-Flasche Wasser",
                    aiText: "Mittagessen erfasst, wie gestern Abend: 620 kcal und 54 g Protein, dazu 500 ml Wasser.",
                },
                {
                    userText:
                        "hab meinem Kind 6 Pommes geklaut. nicht urteilen",
                    aiText: "Ich sag nix. Etwa 90 kcal, als Snack erfasst.",
                },
                {
                    userText: "was ist noch drin fürs Abendessen?",
                    aiText: "Noch 810 kcal frei, und 84 g Protein fehlen dir noch. Lieber was Herzhaftes: Beim Zucker bist du schon bei 59 von deinen 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "und wie läuft's mit meinem Gewicht?",
                    aiText: "Seit dem 11. Feb. hast du 1,4 kg abgenommen, etwa 0,4 kg pro Woche. Noch 3,8 kg bis zu deinem Zielgewicht von 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Drei Schritte. Keine App zu lernen.",
        steps: [
            {
                title: "Einmal verbinden",
                body: "Funktioniert mit jedem KI-Client, der Remote-MCP-Server unterstützt — Claude, ChatGPT und mehr. Keine Installation, keine API-Schlüssel.",
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

    install: {
        title: "In unter einer Minute verbunden",
        sub: "Funktioniert mit jedem MCP-Client, der OAuth 2.0 mit PKCE unterstützt. Bei der ersten Verbindung erstellst du ein Konto mit Google oder einer E-Mail-Adresse und einem Passwort; melde dich auf demselben Weg an, um deine Daten zu behalten.",
        copyAriaLabel: "Server-URL kopieren",
        tabsLabel: "Wähle deinen KI-Client",
        claude: {
            cta: "Zu Claude hinzufügen",
            steps: [
                "Klick auf der Verzeichnisseite auf <strong>Connect</strong> und fahre dann mit Google fort oder melde dich mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und erscheint automatisch auch in deinen iOS- und Android-Apps.",
            ],
            note: "Funktioniert mit jedem Claude-Plan, auch mit dem kostenlosen. Um es stattdessen manuell hinzuzufügen, nutze Customize → Connectors → Add custom connector mit https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Öffne <strong>ChatGPT on the web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klick unten im Popup auf <strong>Create app</strong>. Falls du es nicht siehst, aktiviere <strong>Developer mode</strong> in den <strong>Advanced settings</strong>.",
                "Gib ihr einen Namen, zum Beispiel <strong>Nutrition</strong>.",
                "Füge bei <strong>Connection</strong> <code>https://nutrition-mcp.com/mcp</code> ein.",
                "Wähl bei <strong>Authentication</strong> <strong>OAuth</strong> — lass alles andere unverändert.",
                "Aktiviere <strong>„I understand and want to continue“</strong>.",
                "Klick auf <strong>Create</strong>.",
                "Klick auf <strong>Sign in with Nutrition</strong> — die Anmeldeseite öffnet sich; fahre mit Google fort oder melde dich mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und erscheint automatisch auch in deinen iOS- und Android-Apps.",
            ],
        },
        other: {
            note: "Füge die Konfiguration oben zu deinem Client hinzu (Cursor, VS Code, Claude Code und weitere). Windsurf verwendet <code>serverUrl</code> statt <code>url</code>. Führe in Claude Code <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> aus. Dein Client übernimmt die OAuth-Anmeldung automatisch.",
        },
        otherTabLabel: "Andere Clients",
    },

    onboarding: {
        title: "Einmal einrichten — oder einfach loslegen",
        sub: "Das ist völlig optional — Nutrition MCP funktioniert, sobald du verbunden bist. Wenn du willst, machen dich diese drei kurzen Schritte genauer, aber du kannst auch direkt mit dem Erfassen loslegen.",
        justSay: "Sag einfach ",
        steps: [
            {
                title: "Zeitzone einstellen",
                body: "damit der Tag um deine lokale Mitternacht wechselt und die heutigen Werte stimmen, egal wo du bist.",
                say: "Stell meine Zeitzone auf New York",
            },
            {
                title: "Ziele festlegen",
                body: "tägliche Kalorien-, Makro- und Wasserziele, dazu optional ein Zielgewicht und deine bevorzugte Gewichtseinheit (kg oder lb), um deinen Fortschritt daran zu messen.",
                say: "Setz mein Tagesziel auf 2.000 Kalorien und 150 g Protein",
            },
            {
                title: "Sprache einstellen",
                body: "die Sprache, in der In-Chat-Widgets (Dashboards, Diagramme) angezeigt werden, nicht das, was die KI dir zurückschreibt.",
                say: "Zeig meine Widgets auf Deutsch an",
            },
            {
                title: "Loslegen",
                body: "sag einfach, was du gegessen hast, schick ein Foto oder scanne einen Barcode. Das war's.",
                say: "Ich hatte Haferflocken mit Beeren zum Frühstück",
            },
        ],
        note: "Das alles ist optional. Du kannst es jetzt, später oder nie machen — leg einfach mit dem Erfassen los und stell das ein, wann immer du willst.",
        toolsCta: {
            heading: "Neugierig, was es wirklich kann?",
            body: "Sieh dir alle 36 Werkzeuge an — Erfassen, Barcodes, Wasser, Gewicht, Ziele und Trends — jeweils mit Beschreibung und einem Beispielsatz.",
            arrow: "Werkzeuge entdecken",
        },
    },

    examples: {
        title: "Sprich einfach mit ihr.",
        sub: "Ein paar Dinge, die du einfach so sagen kannst.",
        prevLabel: "Vorheriges Beispiel",
        nextLabel: "Nächstes Beispiel",
        pickerLabel: "Beispiel wählen",
        carouselLabel: "Beispiele",
        threadLabel: "Unterhaltung",
        moreToolsLabel: "Nutzt außerdem",
        toolLinkLabel:
            "{tool} auf der Werkzeuge-Seite (öffnet in einem neuen Tab)",
        photoMealAlt:
            "Foto: ein Teller Borschtsch mit einem Löffel Schmand und Dill, daneben eine Scheibe Roggenbrot",
        photoPackageAlt:
            "Foto: der Barcode auf einer Dose Coca-Cola, Nummer 5449000000996",
        downloadExpires: "Läuft in 60 Minuten ab",
        slides: [
            {
                id: "log-meal",
                title: "In normalen Worten erfassen",
                description:
                    "Sag es, wie du es einem Freund erzählen würdest. Fehlen Portion oder Mahlzeit, wird vor dem Schätzen nachgefragt. Ballaststoffe und Zucker stehen in jedem Eintrag, Koffein bei allem, was welches enthält, und „heute Morgen“ gilt in deiner Zeitzone.",
                toolNotes: {
                    log_meal:
                        "Speichert das Frühstück mit Makros, Ballaststoffen, Zucker und dem Koffein des Kaffees",
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
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Porridge mit Milch und Blaubeeren (1 Schüssel) und schwarzer Kaffee (1 Tasse)",
                ],
            },
            {
                id: "photo-meal",
                title: "Foto vom Teller",
                description:
                    "Ein Foto startet ein Gespräch, keine Schätzung. Es wird gefragt, ob selbst gekocht oder aus dem Restaurant, in deinen früheren Einträgen nachgesehen, was das Foto nicht zeigt, in einfachen Mengen nach der Portion gefragt — und erst erfasst, wenn du die Zusammenfassung bestätigst.",
                toolNotes: {
                    search_meals:
                        "Findet deinen früheren Borschtsch im Tsybulya und was drin war",
                    log_meal:
                        "Erfasst die Mahlzeit mit dem Namen des Restaurants, sobald du Ja sagst",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "Mittagessen",
                    },
                    {
                        from: "ai",
                        text: "Sieht nach Borschtsch mit Schmand und einer Scheibe Roggenbrot aus. Selbst gekocht oder aus dem Restaurant? Und falls Restaurant: welches?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, in Podil in Kyjiw",
                    },
                    {
                        from: "ai",
                        text: "Du hast Borschtsch im Tsybulya schon zweimal erfasst, beide Male die Variante mit Rindfleisch und Schmand. Wieder dasselbe? Und hast du Teller und Brot aufgegessen?",
                    },
                    {
                        from: "user",
                        text: "dasselbe, alles aufgegessen, das Brot auch",
                    },
                    {
                        from: "ai",
                        text: "Also: Borschtsch mit Rindfleisch und Schmand (1 Teller, aufgegessen) und Roggenbrot (1 Scheibe) im Tsybulya, Podil, Kyjiw. Etwa 520 kcal und 24 g Protein, geschätzt, keine veröffentlichten Werte. Als Mittagessen erfassen?",
                    },
                    {
                        from: "user",
                        text: "ja",
                    },
                    {
                        from: "ai",
                        text: "Mittagessen erfasst: 520 kcal · 24 g Protein · 43 g Kohlenhydrate · 27 g Fett · 7 g Ballaststoffe · 10 g Zucker.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Borschtsch mit Rindfleisch und Schmand (1 Teller, aufgegessen) und Roggenbrot (1 Scheibe) im Tsybulya, Podil, Kyjiw",
                ],
            },
            {
                id: "scan-barcode",
                title: "Barcode scannen",
                description:
                    "Fotografier die Verpackung: Die Ziffern unter dem Barcode werden in Open Food Facts nachgeschlagen, dann wird gefragt, wie viel du hattest. Open Food Facts führt kein Koffein, das kommt deshalb vom Etikett oder aus typischen Mengen; fehlen Ballaststoffe oder Zucker, werden sie geschätzt statt leer gelassen.",
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
                    {
                        from: "user",
                        text: "die ganze Dose",
                    },
                    {
                        from: "ai",
                        text: "Zum Mittagessen erfasst: 139 kcal, 35 g Zucker und 33 mg Koffein laut Etikett der Dose, weil Open Food Facts kein Koffein listet. Und wie schlimm: Allein dieser Zucker ist mehr als die Hälfte deines Tageslimits von 60 g, und Open Food Facts stuft die Dose mit Nutri-Score E und NOVA 4 ein, also hochverarbeitet.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
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
                        text: "will ein bisschen abspecken. stell mich auf 2000 kcal und 160 g Protein. und was ist ein vernünftiges Koffeinlimit? ich leb quasi von Kaffee",
                    },
                    {
                        from: "ai",
                        text: "Für gesunde Erwachsene setzen EFSA und FDA bis zu 400 mg am Tag an, etwa vier Tassen Filterkaffee; in der Schwangerschaft rät die EFSA zu 200 mg. Das Limit legst du selbst fest; sollen es 400 sein?",
                    },
                    {
                        from: "user",
                        text: "ja, 400",
                    },
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
                        text: "Du bist bei 1.540 kcal und 104 g Protein, es fehlen also noch 460 kcal und 56 g Protein. Knapper ist der Zucker: 40 von deinen 60 g Limit, also noch 20 g. Beim Koffein bist du bei 130 von 400 mg.",
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
                title: "Die Woche durchsehen",
                description:
                    "Frag, wie die Woche lief, und die Trends-Karte öffnet sich im Chat mit deinen Durchschnitten und erfassten Tagen. Wechsle zwischen 7, 14 und 30 Tagen oder tippe auf einen Nährstoff für seinen Verlauf, ohne neue Anfrage. Serien und Tage im Zielbereich kannst du auch erfragen.",
                toolNotes: {
                    get_trends:
                        "Mittelt deine letzten 7, 14 und 30 Tage und öffnet die Trends-Karte",
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
                    {
                        from: "user",
                        text: "und Zucker?",
                    },
                    {
                        from: "ai",
                        text: "Den solltest du im Blick behalten. Im Schnitt waren es 52 g, und an 4 der 13 Tage lagst du über deinem Limit von 60 g.",
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
                title: "Gewicht verfolgen",
                description:
                    "Erfasse dein Gewicht in kg oder lb und sieh den Trend hinter den Tagesschwankungen: geglätteter Durchschnitt, Veränderung über den Monat, Abstand zum Zielgewicht. Ein unmöglicher Wert, etwa mit vergessenem Komma, wird vor dem Speichern abgefangen.",
                toolNotes: {
                    log_weight:
                        "Weist 784 kg als unplausibel ab und speichert dann 78,4 kg",
                    get_weight_trends:
                        "Glättet 30 Tage zu gleitenden Durchschnitten und zeigt den Abstand zum Ziel",
                },
                messages: [
                    {
                        from: "user",
                        text: "gerade gewogen, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg liegt außerhalb des plausiblen Bereichs für ein Körpergewicht (20–500 kg), deshalb wurde nichts gespeichert. Meintest du 78,4 kg?",
                    },
                    {
                        from: "user",
                        text: "haha ja, Komma vergessen. wie ist mein Trend?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg gespeichert. Seit dem 11. Feb. hast du 1,8 kg abgenommen, etwa 0,4 kg pro Woche, und dein 7-Tage-Schnitt liegt bei 78,7 kg. Noch 3,4 kg bis zu deinem Zielgewicht von 75 kg.",
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
                    {
                        from: "user",
                        text: "und am Wochenende?",
                    },
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
                    "Alkohol bleibt ausgeblendet, bis du die Erfassung einschaltest. Wähl US-Standard-Drinks oder UK-Einheiten, und jedes Getränk wird aus Menge und Alkoholgehalt in Gramm Alkohol umgerechnet. Schaltest du sie später wieder aus, wird Alkohol erneut ausgeblendet, aber nicht gelöscht.",
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
                    {
                        from: "user",
                        text: "4 %, glaub ich",
                    },
                    {
                        from: "ai",
                        text: "Zum Abendessen erfasst: Ein Pint mit 568 ml und 4 % sind 17,9 g Alkohol, 2,3 UK-Einheiten, etwa 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lagerbier, 4 % (1 Pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Deine Historie mitnehmen",
                description:
                    "Du wechselst von MyFitnessPal, Cronometer, Lose It! oder MacroFactor? Der Importer öffnet sich im Chat, liest deinen Export im Browser und ordnet ihn zu, speichert nichts, bevor du eine Vorschau bestätigst, und legt keine Mahlzeit doppelt an, wenn du dieselbe Datei bei unveränderter Zeitzone noch einmal importierst. Eine fehlende Zeitzone meldet er, bevor du loslegst.",
                toolNotes: {
                    start_meal_import:
                        "Öffnet den Importer im Chat für deine Exportdatei",
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
                        text: "Der Importer ist unten geöffnet. Eins noch, bevor du die Datei auswählst: In deinem Konto ist keine Zeitzone eingestellt, Uhrzeiten würden also als UTC gelesen. Wo wohnst du?",
                    },
                    {
                        from: "user",
                        text: "Chicago",
                    },
                    {
                        from: "ai",
                        text: "Auf America/Chicago gesetzt. Wähl jetzt die Nutrition-Summary-CSV aus deinem MyFitnessPal-Export. Sie wird direkt in deinem Browser gelesen, und gespeichert wird erst, wenn du die Vorschau bestätigst.",
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
                        text: "Genau, der Export hat Datumsangaben, aber keine Uhrzeiten, deshalb wird jede Mahlzeit auf 12 Uhr Ortszeit gesetzt. So landet jede Mahlzeit in Chicago am richtigen Tag; du siehst nur nicht, wann du wirklich gegessen hast.",
                    },
                    {
                        from: "user",
                        text: "fertig! ist alles angekommen?",
                    },
                    {
                        from: "ai",
                        text: "Alles: 603 Mahlzeiten importiert, keine fehlgeschlagen.",
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
                title: "Nimm deine Daten mit",
                description:
                    "Eine Anfrage packt alles, was über dich gespeichert ist — Mahlzeiten, Wasser, Wägungen, Ziele, Profileinstellungen, deinen Kontodatensatz, Nutzungs-Telemetrie und App-Verbindungen — in ein ZIP aus CSV-Dateien mit README. Zeitstempel stehen in deiner Zeitzone, und meals.csv lässt sich direkt wieder importieren.",
                toolNotes: {
                    export_all_data:
                        "Packt acht CSV-Dateien und ein README in ein ZIP hinter einem 60-Minuten-Link",
                },
                messages: [
                    {
                        from: "user",
                        text: "meine Ernährungsberaterin will mein Ernährungstagebuch sehen. kannst du mir das als Tabelle rausgeben?",
                    },
                    {
                        from: "ai",
                        text: "Bitte schön: ein ZIP mit 1.204 Mahlzeiten, 318 Wasser-Einträgen und 64 Wägungen, dazu deine Ziele, Profileinstellungen, Kontodaten, Telemetrie zur Werkzeugnutzung und App-Verbindungen. Dein Ernährungstagebuch ist die meals.csv darin, die sich in Excel oder Google Sheets öffnen lässt.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "kann ich ihr nicht einfach den Link schicken?",
                    },
                    {
                        from: "ai",
                        text: "Lad es lieber herunter und schick ihr die Datei. Der Link funktioniert nach 60 Minuten nicht mehr, und wer ihn hat, kann deinen ganzen Export öffnen — Gewicht, Kontodaten und Einstellungen inklusive, nicht nur die Mahlzeiten.",
                    },
                    {
                        from: "user",
                        text: "gut zu wissen. könnte ich später daraus wiederherstellen, falls nötig?",
                    },
                    {
                        from: "ai",
                        text: "Deine Mahlzeiten ja. meals.csv verwendet die Spaltennamen des Importers und lässt sich deshalb direkt wieder importieren; Mahlzeiten, die schon in deinem Tagebuch stehen, werden erkannt und übersprungen, sodass nichts doppelt vorkommt. Die anderen Dateien sind nur für deine Unterlagen; sie lassen sich nicht wieder importieren.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Frühstück hier, Abendessen woanders.",
        sub: "Live-Statistiken über alle Nutrition-MCP-Konten — Kalorien, Mahlzeiten-Einträge, Makros und abgenommenes Gewicht — alle fünf Sekunden aktualisiert.",
        liveLabel: "Live",
        unitGroupLabel: "Einheiten",
        unitMetricLabel: "Metrisch",
        unitImperialLabel: "Imperial",
        unitKgLabel: "Metrisch (kg)",
        unitLbLabel: "Imperial (lb)",
        refreshBefore: "Aktualisierung alle 5 s · nächste in ",
        refreshAfter: " s",
        sinceOpenLabel: "seit dem Öffnen dieser Seite",
        calCaption: "Erfasste Kalorien",
        cards: {
            foodLogs: "Mahlzeiten-Einträge",
            protein: "Erfasstes Protein",
            carbs: "Erfasste Kohlenhydrate",
            fat: "Erfasstes Fett",
            weightLost: "Abgenommen seit dem 2. Juli 2026",
            water: "Erfasstes Wasser",
        },
        foodLogsUnit: { one: "Eintrag", other: "Einträge" },
        timezonesAfter:
            " Zeitzonen · der Tag wechselt jeweils um Mitternacht Ortszeit",
        mapNote: "Punktgröße = Anteil der Profile",
        mapAriaLabel:
            "Weltkarte der in Profilen eingestellten Zeitzonen; eine Zeitzone erscheint erst, wenn mindestens drei Profile sie nutzen",
        foot: "Summen über alle Konten, aktualisiert bei jeder erfassten Mahlzeit. Individuelle Daten werden nie angezeigt.",
    },

    features: {
        title: "Was du erfassen kannst",
        cards: [
            {
                title: "Mahlzeiten in normaler Sprache",
                body: "Beschreib, was du gegessen hast — deine KI schätzt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein in Milligramm und erfasst es.",
            },
            {
                title: "Barcode scannen",
                body: "Fotografier oder tipp einen Produkt-Barcode ein und hol Makros, Ballaststoffe und Zucker von Open Food Facts — skaliert auf die Menge, die du gegessen hast.",
            },
            {
                title: "Ziele & Fortschritt",
                body: "Leg tägliche Ziele für Kalorien, Makros, Ballaststoffe und Wasser fest — dazu Grenzwerte für Zucker, Koffein und Alkohol — und verfolg deinen Fortschritt live.",
            },
            {
                title: "Übersichten & Trends",
                body: "Tages- und Wochenübersichten, 7/14/30-Tage-Trends, Serien und wiederkehrende Essgewohnheiten.",
            },
            {
                title: "Wasser erfassen",
                body: "Verfolg deine Flüssigkeitszufuhr in Millilitern neben deinen Mahlzeiten und sieh sie dir tagesweise an.",
            },
            {
                title: "Gewichts-Tracking",
                body: "Erfasse dein Körpergewicht in kg oder lb, sieh dir 7/14/30-Tage-Trends an und verfolg deinen Fortschritt zu einem Zielgewicht.",
            },
            {
                title: "Zeitzonenbewusst",
                body: "Der Tag wechselt in deiner lokalen Zeit, egal wo auf der Welt du bist.",
            },
            {
                title: "Import aus einer anderen App",
                body: "Bring deine Mahlzeiten-Historie aus MyFitnessPal, Cronometer, Lose It! oder MacroFactor mit — oder aus jeder anderen CSV, indem du die Spalten selbst zuordnest. Du bestätigst, was hinzugefügt wird, bevor irgendetwas gespeichert wird.",
            },
            {
                title: "Export & Eigentum an deinen Daten",
                body: "Nimm alles mit, was wir über dich speichern — Mahlzeiten, Wasser, Gewicht, Ziele und Profil, dazu deinen Kontodatensatz, die Nutzungs-Telemetrie und deine verbundenen Apps — als ein ZIP mit CSV-Dateien. Mahlzeiten sind bisher der einzige Teil, der wieder importiert werden kann. Lösch dein Konto und deine Daten, wann immer du willst.",
            },
        ],
    },

    why: {
        title: "Reden schlägt Tippen.",
        sub: "Fotografier einen Barcode oder sag einfach, was du gegessen hast — kein Wühlen in einer Datenbank, keine separate App zu öffnen.",
        oldHeading: "Klassische Apps",
        oldItems: [
            "Für jedes Lebensmittel eine Datenbank durchsuchen",
            "Falsche Datenbankeinträge von Hand korrigieren",
            "Noch eine App zum Öffnen, oft hinter einer Bezahlschranke",
            "Mühsames manuelles Erfassen",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Mahlzeiten in normaler Sprache beschreiben",
            "Kalorien & Makros werden für dich geschätzt",
            "Läuft kostenlos in Claude oder ChatGPT",
            "Frag nach Trends, Übersichten und Zielen",
        ],
        noteHtml:
            'Wechselst du von einer bestimmten App? Sieh dir an, wie Nutrition MCP im Vergleich zu <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer und anderen Trackern</a> abschneidet.',
    },

    trust: [
        {
            label: "Privat per Voreinstellung",
            small: "Nie verkauft, weitergegeben oder für Werbung genutzt.",
        },
        { label: "Quelloffen", small: "Selbst prüfen oder hosten." },
        {
            label: "Jederzeit exportieren",
            small: "Alles Gespeicherte als CSV in einem ZIP.",
        },
        { label: "Sofort löschen", small: "Konto & Daten entfernen." },
    ],

    support: {
        title: "Hilf mit, es am Laufen zu halten.",
        sub: "Nutrition MCP ist kostenlos und werbefrei. Patreon deckt die Server- und Datenbankkosten.",
        updatesTitle: "Neuestes von Patreon",
        updatesBadge: "Kostenlos",
        updatesNote: "Kostenlos zu lesen — keine Mitgliedschaft nötig.",
        updatesPrevLabel: "Vorheriges Update",
        updatesNextLabel: "Nächstes Update",
        updatesDotLabel: "Update",
        postLinkLabel: "Auf Patreon lesen",
        free: {
            tier: "Kostenloses Mitglied",
            price: "0 $",
            desc: "Bleib auf dem Laufenden — Neuigkeiten und Updates zum Server, neue Werkzeuge und was als Nächstes kommt.",
            cta: "Auf Patreon folgen",
        },
        paid: {
            tier: "Zahlendes Mitglied",
            price: "Zahl, was du willst",
            desc: "Wenn dir Nutrition MCP hilft, kannst du die Kosten für Hosting und Datenbank mittragen. Alle bekommen dieselben Funktionen, Unterstützer eingeschlossen, und es bleibt für alle kostenlos.",
            cta: "Unterstützer werden",
        },
    },

    cta: {
        title: "Starte in unter einer Minute mit dem Erfassen.",
        sub: "Kostenlos und quelloffen — funktioniert mit der KI, die du schon nutzt.",
        primary: "Schnell installieren",
        secondary: "Stern auf GitHub geben",
    },

    contact: {
        title: "Fragen oder Feedback?",
        sub: "Einen Bug gefunden, wünschst dir ein Feature oder hast einfach eine Frage? Schreib mir direkt eine E-Mail — ich lese jede Nachricht.",
        cta: "E-Mail senden",
    },

    faqSection: {
        title: "Häufig gestellte Fragen",
    },
    faq: [
        {
            question: "Was ist Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP ist ein kostenloser, quelloffener Model Context Protocol (MCP) Server, der Claude, ChatGPT oder einen anderen MCP-Client zum Kalorienzähler und Makro-Tracker macht. Statt eine Lebensmitteldatenbank zu durchsuchen, sagst du deiner KI, was du gegessen hast, und sie trägt Kalorien, Makros, Ballaststoffe, Zucker und Koffein in dein eigenes Ernährungstagebuch ein.",
        },
        {
            question: "Was ist das Model Context Protocol (MCP)?",
            visibleHtml:
                "Das Model Context Protocol ist ein offener Standard, der es KI-Assistenten wie Claude und ChatGPT ermöglicht, sich mit externen Werkzeugen und Datenquellen zu verbinden. Ein MCP-Server stellt bestimmte Fähigkeiten bereit — hier: Ernährungs-Tracking —, die die KI während eines Gesprächs nutzen kann. Man kann es sich wie ein Plugin-System für KI-Assistenten vorstellen.",
        },
        {
            question: "Wie zähle ich Kalorien mit Claude oder ChatGPT?",
            visibleHtml:
                "Verbinde Nutrition MCP einmal — in Claude über das Connector-Verzeichnis, in ChatGPT als benutzerdefinierte App mit der Server-URL — und melde dich an. Dann sag deiner KI in eigenen Worten, was du gegessen hast, zeig ihr ein Foto der Mahlzeit oder gib ihr einen Produkt-Barcode. Deine KI schätzt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe und Zucker, und Nutrition MCP speichert den Eintrag in deinem Ernährungstagebuch. Frag jederzeit nach deinen Tagessummen, Wochentrends oder deinem Fortschritt bei deinen Zielen.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly — same
            // divergence as the English source's "Does it work with
            // ChatGPT?" entry.
            question: "Funktioniert es mit ChatGPT?",
            visibleHtml:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle eine benutzerdefinierte App mit der Server-URL über OAuth und melde dich an. Für eine benutzerdefinierte App brauchst du den Entwicklermodus (Developer mode) von ChatGPT, den OpenAI in einigen ChatGPT-Tarifen anbietet.",
            jsonLdText:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle eine benutzerdefinierte App mit der Server-URL https://nutrition-mcp.com/mcp über OAuth und melde dich an. Für eine benutzerdefinierte App brauchst du den Entwicklermodus (Developer mode) von ChatGPT, den OpenAI in einigen ChatGPT-Tarifen anbietet.",
        },
        {
            question: "Welche anderen Clients werden unterstützt?",
            visibleHtml:
                "Jeder MCP-Client, der OAuth 2.0 mit PKCE unterstützt — darunter Claude.ai, die Claude-Desktop- und -Mobil-Apps, Claude Code, Cursor, Windsurf und VS Code.",
        },
        {
            question: "Kann ich es selbst hosten?",
            visibleHtml:
                'Ja. Nutrition MCP ist quelloffen (MIT-Lizenz). Du kannst deine eigene Instanz mit deinem eigenen Supabase-Projekt betreiben — das <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-Repository</a> enthält eine vollständige Anleitung zum Selbst-Hosten und ein Dockerfile.',
        },
        {
            question: "Ist Nutrition MCP kostenlos?",
            visibleHtml:
                "Ja, es ist komplett kostenlos — keine kostenpflichtige Stufe, keine Werbung, keine versteckten Kosten. Du brauchst eine KI-App, die MCP-Connectors unterstützt, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden anlegst. Freiwillige Spenden auf Patreon helfen, die Serverkosten zu decken, und schalten nichts frei.",
        },
        {
            question: "Was kann ich erfassen?",
            visibleHtml:
                "Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Wasser für jeden Eintrag — beschrieben in normaler Sprache oder über einen Produkt-Barcode via Open Food Facts abgerufen. Koffein wird ebenfalls erfasst, in Milligramm, der Einheit, die jedes Etikett verwendet, und es liefert keine Kalorien. Auch Alkohol lässt sich erfassen, in Gramm reinen Alkohols; er wird angezeigt, sobald du die Alkohol-Erfassung einschaltest. Du kannst außerdem dein Körpergewicht in kg oder lb erfassen und Trends zu einem Zielgewicht verfolgen. Sieh dir Tagesübersichten an, frag Mahlzeiten nach Datumsbereich ab, ändere oder lösche vergangene Einträge, leg Ziele fest und beobachte Trends über die Zeit.",
        },
        {
            question: "Wie genau sind die Kalorienangaben?",
            visibleHtml:
                "Es sind Schätzungen. Bei einer Mahlzeit, die du beschreibst oder fotografierst, schätzt deine KI die Werte; bei einem Barcode stammen sie aus den Etikettdaten des Produkts in Open Food Facts, die deine KI auf deine Menge umrechnet. Beides kann falsch sein, also prüf alles, worauf es ankommt — du kannst jeden Eintrag korrigieren oder löschen, indem du einfach danach fragst. Nutrition MCP ist ein Werkzeug zum Erfassen, keine medizinische Beratung und keine Ernährungsberatung: Sprich mit einer Ärztin, einem Arzt oder einer Ernährungsfachkraft, bevor du Entscheidungen über deine Gesundheit triffst, besonders in der Schwangerschaft, bei einer Erkrankung oder wenn du schon einmal eine Essstörung hattest.",
        },
        {
            question: "Wird Alkohol erfasst?",
            visibleHtml:
                "Ja, als Opt-in: Die Alkohol-Erfassung ist standardmäßig ausgeschaltet, und Alkohol bleibt in Mahlzeiten, Zielen und Übersichten ausgeblendet, bis du sie einschaltest. Dann werden Getränke in Gramm reinen Alkohols und wahlweise als US-Standard-Drinks oder UK-Einheiten angezeigt. Nichts leitet Alkohol stellvertretend für dich ab: Er wird nur aus einem Getränk erfasst, das du einträgst, oder aus einer Alkohol-Spalte in einer importierten Datei, und ein eingetragenes Getränk wird auch bei ausgeschalteter Erfassung gespeichert. Schaltest du sie wieder aus, wird Alkohol erneut ausgeblendet, und der Importer liest keine Alkohol-Spalten mehr — das ist kein Löschschalter, und dein Export enthält immer, was du erfasst hast. Um einen Alkoholwert zu entfernen, lösch die Mahlzeit, zu der er gehört.",
        },
        {
            question:
                "Kann ich meine Historie aus MyFitnessPal oder einer anderen App importieren?",
            visibleHtml:
                "Ja. Bitte um den Import deiner Historie, und ein Importer öffnet sich im Chat: Du wählst die CSV, die deine alte App exportiert hat, prüfst, wie ihre Spalten zugeordnet werden, und siehst, was hinzugefügt wird, bevor du bestätigst. Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden automatisch erkannt, und jede andere CSV funktioniert, indem du die Spalten selbst zuordnest. Dein Browser liest die Datei, die KI tippt deine Zeilen also nie ab. In Clients ohne In-Chat-Panels kannst du deinen Export stattdessen einfügen — und ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        },
        {
            question: "Sind meine Daten privat?",
            visibleHtml:
                'Deine Einträge werden in der EU gespeichert und mit deinem eigenen Konto verknüpft, auf das du über die KI-Apps zugreifst, die du verbindest. Nutrition MCP verkauft deine Daten nie, gibt sie nie an Dritte weiter und nutzt sie nie für Werbung; die Startseite zeigt nur anonyme Gesamtzahlen über die ganze Website. Was deine KI über die Werkzeuge liest, geht an den Anbieter dieser KI, im Rahmen deiner eigenen Vereinbarung mit ihm. Du kannst jederzeit alles exportieren, was wir über dich speichern, oder dein Konto samt allen Daten löschen — Details stehen in der <a href="/privacy" data-link="privacy">Datenschutzerklärung</a>.',
        },
    ],
};

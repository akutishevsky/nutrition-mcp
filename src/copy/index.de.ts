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
    title: "Nutrition MCP – Kalorien- & Makro-Tracker für Claude & ChatGPT",
    metaDescription:
        "Mahlzeiten, Kalorien und Makros im Chat mit Claude oder ChatGPT erfassen. Kostenloser Open-Source-MCP-Server mit Barcode-Suche, Gewichtsverlauf und vollem Export.",
    ogDescription:
        "Mahlzeiten, Kalorien und Makros im Chat mit Claude oder ChatGPT erfassen. Kostenloser Open-Source-MCP-Server mit Barcode-Suche, Gewichtsverlauf und vollem Export.",
    keywords:
        "Ernährungs-Tracker, Mahlzeiten-Tracker, MCP-Server, Claude AI, ChatGPT, Kalorienzähler, Kalorienzähler kostenlos, Makro-Tracker, Barcode-Scanner, Ernährungstagebuch, Essensprotokoll, Diät-Tracker, Gewichts-Tracker, Gewichtsprotokoll, Yazio Alternative, KI-Ernährung, Model Context Protocol",

    hero: {
        titleBeforeEm: "Erfasse deine Ernährung – einfach im ",
        titleEm: "Gespräch",
        titleAfterEm: " mit deiner KI.",
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
                    aiText: "Eine Smoothie-Bowl, sieht selbst gemacht aus. Die hattest du bisher in zwei Varianten: mit Granola und Honig oder nur mit Obst. Welche ist es diesmal?",
                },
                {
                    userText: "Granola und Honig, ein voller Löffel",
                    aiText: "Alles klar. Und der Americano: einfach oder doppelt, mit oder ohne Milch?",
                },
                {
                    userText: "doppelt, ein Schuss Hafermilch",
                    aiText: "Also: die Bowl mit einer Handvoll Granola und 1 EL Honig, dazu ein doppelter Americano mit einem Schuss Hafermilch. Etwa 480 kcal und 21 g Protein. Soll ich das erfassen?",
                },
                {
                    userText: "ja",
                    aiText: "Frühstück erfasst: 480 kcal, 21 g Protein und 126 mg Koffein. Beim Zucker bist du schon bei 51 g, dein Limit liegt bei 60 g.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie-Bowl (1 Bowl: griechischer Joghurt, Banane, Beeren) mit Granola (1 Handvoll) und Honig (1 EL); Americano (doppelt) mit einem Schuss Hafermilch",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "Mittagessen: Reste der Wokpfanne von gestern Abend, gleiche Portion. und ne 500-ml-Flasche Wasser",
                    aiText: "Mittagessen erfasst, wie gestern Abend: 620 kcal und 54 g Protein, dazu 500 ml Wasser.",
                    meal: {
                        description:
                            "Reste Wokpfanne (1 Portion, wie gestern Abend)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "Snack: hab meinem Kind 6 Pommes geklaut. bitte nicht urteilen",
                    aiText: "Hier wird nicht geurteilt. Etwa 50 kcal, als Snack erfasst.",
                    meal: {
                        description:
                            "Pommes (6 Stück, vom Teller meines Kindes)",
                        type: "snack",
                    },
                },
                {
                    userText: "was ist noch drin fürs Abendessen?",
                    aiText: "Es bleiben noch 850 kcal und 84 g Protein. Beim Zucker bist du bei 59 g, dein Limit liegt bei 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "und wie läuft's mit meinem Gewicht?",
                    aiText: "Seit dem 11. Feb. hast du 1,4 kg abgenommen, von 80,2 auf 78,8 kg. Noch 3,8 kg bis zu deinem Zielgewicht von 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Drei Schritte. Keine neue App.",
        steps: [
            {
                title: "Einmal verbinden",
                body: "Funktioniert mit jedem KI-Client, der Remote-MCP-Server unterstützt – Claude, ChatGPT und mehr. Keine Installation, keine API-Schlüssel.",
            },
            {
                title: "Sag einfach, was du gegessen hast",
                body: "Beschreib es in eigenen Worten – oder schick ein Foto deines Essens, einen Screenshot aus einer Liefer-App oder einen Barcode (das Produkt wird online nachgeschlagen). Die Makros werden automatisch erfasst.",
            },
            {
                title: "Erfassen & auswerten",
                body: "Frag nach Tagesübersichten, Wochentrends oder deinem Zielfortschritt – oder exportiere alles, was du erfasst hast, als CSV-Dateien. Komplett kostenlos.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "In unter einer Minute verbunden",
        sub: "Funktioniert mit jedem MCP-Client, der OAuth 2.0 mit PKCE unterstützt. Bei der ersten Verbindung erstellst du ein Konto – mit Google oder mit E-Mail-Adresse und Passwort. Melde dich später auf demselben Weg an, damit du deine Daten behältst.",
        copyAriaLabel: "Server-URL kopieren",
        tabsLabel: "Wähl deinen KI-Client",
        claude: {
            cta: "Zu Claude hinzufügen",
            steps: [
                "Klick auf der Verzeichnisseite auf <strong>Connect</strong> und melde dich dann mit Google oder mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und taucht automatisch auch in deinen iOS- und Android-Apps auf.",
            ],
            note: "Funktioniert mit jedem Claude-Plan, auch mit dem kostenlosen. Wenn du es lieber von Hand hinzufügen willst: Customize → Connectors → Add custom connector mit https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Öffne <strong>ChatGPT im Web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Klick unten im Pop-up auf <strong>Create app</strong>. Siehst du die Option nicht, aktiviere <strong>Developer mode</strong> unter <strong>Advanced settings</strong>.",
                "Gib der App einen Namen, zum Beispiel <strong>Nutrition</strong>.",
                "Füge bei <strong>Connection</strong> <code>https://nutrition-mcp.com/mcp</code> ein.",
                "Wähl bei <strong>Authentication</strong> <strong>OAuth</strong> aus – alles andere lässt du, wie es ist.",
                "Setz das Häkchen bei <strong>„I understand and want to continue“</strong>.",
                "Klick auf <strong>Create</strong>.",
                "Klick auf <strong>Sign in with Nutrition</strong> – die Anmeldeseite öffnet sich. Melde dich mit Google oder mit E-Mail und Passwort an.",
                "Fertig. Es funktioniert sofort und taucht automatisch auch in deinen iOS- und Android-Apps auf.",
            ],
        },
        other: {
            note: "Füge die Konfiguration oben in deinen Client ein (Cursor, VS Code, Claude Code und weitere). Windsurf verwendet <code>serverUrl</code> statt <code>url</code>. In Claude Code führst du <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code> aus. Die OAuth-Anmeldung übernimmt dein Client automatisch.",
        },
        otherTabLabel: "Andere Clients",
    },

    onboarding: {
        title: "Einmal einrichten – oder einfach drauflosreden",
        sub: "Das ist komplett optional – Nutrition MCP funktioniert, sobald du verbunden bist. Wenn du willst, sorgen diese drei kurzen Schritte für genauere Werte, du kannst aber auch direkt mit dem Erfassen loslegen.",
        justSay: "Sag einfach ",
        steps: [
            {
                title: "Zeitzone einstellen",
                body: "damit der Tag um Mitternacht deiner Ortszeit wechselt und die heutigen Summen stimmen, egal wo du gerade bist.",
                say: "Stell meine Zeitzone auf New York",
            },
            {
                title: "Ziele festlegen",
                body: "tägliche Ziele für Kalorien, Makros und Wasser, dazu optional ein Zielgewicht und deine bevorzugte Gewichtseinheit (kg oder lb), damit du deinen Fortschritt verfolgen kannst.",
                say: "Setz mein Tagesziel auf 2.000 Kalorien und 150 g Protein",
            },
            {
                title: "Sprache einstellen",
                body: "in welcher Sprache die Widgets im Chat (Dashboards, Diagramme) angezeigt werden – nicht, in welcher Sprache die KI dir antwortet.",
                say: "Zeig meine Widgets auf Deutsch an",
            },
            {
                title: "Loslegen",
                body: "sag einfach, was du gegessen hast, schick ein Foto oder scanne einen Barcode. Das war's.",
                say: "Ich hatte Haferflocken mit Beeren zum Frühstück",
            },
        ],
        note: "Das alles ist optional. Ob jetzt, später oder nie – fang einfach an zu erfassen und stell das ein, wann immer du willst.",
        toolsCta: {
            heading: "Neugierig, was es alles kann?",
            body: "Sieh dir alle 41 Werkzeuge an – Erfassen, Barcodes, Wasser, Gewicht und Körpermaße, Ziele und Trends –, jeweils mit Beschreibung und Beispielsatz.",
            arrow: "Werkzeuge entdecken",
        },
    },

    examples: {
        title: "Sag's einfach.",
        sub: "Ein paar Beispiele dafür, was alles geht – einfach im Gespräch.",
        prevLabel: "Vorheriges Beispiel",
        nextLabel: "Nächstes Beispiel",
        pickerLabel: "Beispiel wählen",
        carouselLabel: "Beispiele",
        carouselRoleDescription: "Karussell",
        threadLabel: "Unterhaltung",
        moreToolsLabel: "Nutzt außerdem",
        toolLinkLabel:
            "{tool} auf der Werkzeugseite (öffnet sich in einem neuen Tab)",
        photoMealAlt:
            "Foto: ein Teller Borschtsch mit einem Löffel Schmand und Dill, daneben eine Scheibe Roggenbrot",
        photoPackageAlt:
            "Foto: der Barcode auf einem Becher Naturjoghurt griechischer Art, Nummer 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "In eigenen Worten erfassen",
                description:
                    "Sag es so, wie du es Freunden erzählen würdest. Fehlt die Portion oder welche Mahlzeit es war, kommt erst eine Rückfrage, bevor geschätzt wird. Ballaststoffe und Zucker stehen bei jedem Eintrag, Koffein bei allem, was welches enthält, und „gegen 7“ landet in deiner Zeitzone auf 07:00.",
                toolNotes: {
                    log_meal:
                        "Speichert das Frühstück mit Makros, Ballaststoffen, Zucker und dem Koffein des Kaffees",
                    log_water:
                        "Zählt die 500 ml um 07:00 zur heutigen Wassermenge",
                    get_current_time:
                        "Ermittelt das heutige Datum, damit „gegen 7“ als 07:00 erfasst wird",
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
                        text: "Frühstück erfasst: etwa 320 kcal, 11 g Protein und 6 g Ballaststoffe. Mit dem Kaffee stehst du bei 95 von maximal 400 mg Koffein.",
                    },
                    {
                        from: "user",
                        text: "ach, und so gegen 7 hab ich nen halben Liter Wasser getrunken, vorm Laufen",
                    },
                    {
                        from: "ai",
                        text: "500 ml Wasser für heute Morgen um 07:00 eingetragen.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
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
                    "Ein Foto startet ein Gespräch, kein Ratespiel. Es wird gefragt, ob selbst gekocht oder aus dem Restaurant, in deinen früheren Einträgen nachgesehen, was das Foto nicht zeigt, und in einfachen Mengen nach der Portion gefragt – erfasst wird erst, wenn du die Zusammenfassung bestätigst.",
                toolNotes: {
                    search_meals:
                        "Findet deinen früheren Borschtsch aus dem Tsybulya und was drin war",
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
                        text: "Tsybulya, im Podil in Kyjiw",
                    },
                    {
                        from: "ai",
                        text: "Du hast Borschtsch im Tsybulya schon zweimal erfasst, beide Male mit Rindfleisch, Schmand und einer Scheibe Roggenbrot, etwa 520 kcal. Wieder dasselbe? Und hast du den Teller und das Brot ganz aufgegessen?",
                    },
                    {
                        from: "user",
                        text: "dasselbe, alles aufgegessen, das Brot auch",
                    },
                    {
                        from: "ai",
                        text: "Also: Borschtsch mit Rindfleisch und Schmand (1 Teller, aufgegessen) und Roggenbrot (1 Scheibe) im Tsybulya, Podil, Kyjiw. Wie beim letzten Mal etwa 520 kcal und 24 g Protein – Schätzwerte, keine veröffentlichten Angaben. Soll ich das erfassen?",
                    },
                    {
                        from: "user",
                        text: "ja",
                    },
                    {
                        from: "ai",
                        text: "Erfasst. Das sind 520 deiner 2.000 kcal für heute, es bleiben noch 1.480.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
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
                    "Fotografier die Verpackung: Die Ziffern unter dem Barcode werden in Open Food Facts nachgeschlagen, dann kommt die Frage, wie viel du hattest. Open Food Facts führt kein Koffein, deshalb kommt es vom Etikett oder aus typischen Mengen; fehlen Ballaststoffe oder Zucker, werden sie geschätzt statt leer gelassen.",
                toolNotes: {
                    lookup_barcode:
                        "Holt die Etikettwerte und den Nutri-Score des Bechers aus Open Food Facts",
                    log_meal:
                        "Erfasst den ganzen Becher zum Frühstück, umgerechnet von den Werten pro 100 g",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "hatte ich zum Frühstück. ist der gut?",
                    },
                    {
                        from: "ai",
                        text: "Das ist ein 150-g-Becher Naturjoghurt griechischer Art (0 % Fett): 87 kcal, 15 g Protein und 5 g Zucker, und Open Food Facts bewertet ihn mit Nutri-Score A. Hattest du den ganzen Becher?",
                    },
                    {
                        from: "user",
                        text: "den ganzen Becher",
                    },
                    {
                        from: "ai",
                        text: "Zum Frühstück erfasst: 87 kcal, 15 g Protein und 5 g Zucker. Für heute fehlen noch 145 g Protein.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Naturjoghurt griechischer Art 0 % (150-g-Becher)"],
            },
            {
                id: "goals-progress",
                title: "Ziele setzen, Stand checken",
                description:
                    "Leg Ziele fest, die du erreichen willst, etwa Kalorien und Protein, und Limits für Zucker, Alkohol und Koffein, unter denen du bleiben willst; geändert wird nur, was du nennst. Dann frag nach einem beliebigen Tag und sieh, was dir bei jedem Ziel noch fehlt und wo du bei jedem Limit stehst.",
                toolNotes: {
                    set_nutrition_goals:
                        "Speichert Kalorien- und Proteinziel sowie ein Koffeinlimit von 400 mg",
                    get_goal_progress:
                        "Zeigt den heutigen Stand je Ziel und Limit in einer Karte im Chat",
                },
                messages: [
                    {
                        from: "user",
                        text: "will ein bisschen abspecken. stell mir 2000 kcal und 160 g Protein ein. und was ist ein vernünftiges Koffeinlimit? ich leb quasi von Kaffee",
                    },
                    {
                        from: "ai",
                        text: "Für gesunde Erwachsene setzen EFSA und FDA bis zu 400 mg am Tag an, etwa vier Tassen Filterkaffee; in der Schwangerschaft rät die EFSA zu 200 mg. Das Limit legst du selbst fest – sollen es 400 sein?",
                    },
                    {
                        from: "user",
                        text: "ja, 400",
                    },
                    {
                        from: "ai",
                        text: "Erledigt: Ziel 2.000 kcal und 160 g Protein, Koffein unter 400 mg. Alles andere bleibt, wie es war: 220 g Kohlenhydrate, 70 g Fett, 30 g Ballaststoffe, 2,5 l Wasser, dein Zuckerlimit von 60 g und dein Zielgewicht von 75 kg.",
                    },
                    {
                        from: "user",
                        text: "passt heute Abend noch ein Nachtisch rein?",
                    },
                    {
                        from: "ai",
                        text: "Du bist bei 1.540 von 2.000 kcal und 104 von 160 g Protein, es fehlen also noch 460 kcal und 56 g Protein. Zucker liegt bei 40 von maximal 60 g, Koffein bei 130 von 400 mg – beides unter dem Limit.",
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
                title: "Wochenrückblick",
                description:
                    "Frag, wie die Woche lief, und die Trends-Karte öffnet sich im Chat: deine durchschnittlichen Kalorien und Makros im Vergleich zu deinen Zielen und wie viele Tage du erfasst hast. Wechsle zwischen 7, 14 und 30 Tagen, ohne neue Anfrage. Auch deine Serien und Tage im Zielbereich kannst du abfragen.",
                toolNotes: {
                    get_trends:
                        "Bildet Durchschnitte über deine letzten 7, 14 und 30 Tage und öffnet die Trends-Karte",
                },
                messages: [
                    {
                        from: "user",
                        text: "wie liefen die letzten zwei Wochen? fühlt sich ziemlich chaotisch an",
                    },
                    {
                        from: "ai",
                        text: "Du hast 13 der 14 Tage erfasst, die letzten 10 am Stück, und an 9 davon bist du höchstens 10 % von deinem Ziel von 2.000 kcal abgewichen. Im Schnitt waren es 1.830 kcal am Tag, allerdings zählt dabei der Tag ohne Eintrag als null.",
                    },
                    {
                        from: "user",
                        text: "und Zucker?",
                    },
                    {
                        from: "ai",
                        text: "Im Schnitt 52 g am Tag, also unter deinem Limit von 60 g, aber an 4 der 13 Tage lagst du darüber.",
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
                title: "Gewicht & Körpermaße",
                description:
                    "Trag dein Gewicht in kg oder lb ein und sieh den Trend hinter den täglichen Schwankungen: geglätteter Durchschnitt, Veränderung im Monat, Abstand zum Zielgewicht. Maßband-Maße von neun Körperstellen, von der Taille bis zur Wade, erfasst du daneben in cm oder Zoll. Ein unmöglicher Wert, etwa mit vergessenem Komma, wird abgefangen, bevor er gespeichert wird.",
                toolNotes: {
                    log_weight:
                        "Speichert die Messung von heute Morgen: 78,4 kg",
                    get_weight_trends:
                        "Glättet Tagesschwankungen zu einem Trendgewicht und einer Wochenrate und zeigt den Abstand zum Ziel",
                    log_body_measurement: "Speichert den Taillenumfang: 84 cm",
                    get_body_measurements:
                        "Sucht den letzten Taillenwert zum Vergleich",
                },
                messages: [
                    {
                        from: "user",
                        text: "heute Morgen 78,4 kg. wie sieht mein Trend aus?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg gespeichert. Seit dem 11. Februar hast du 1,8 kg abgenommen (von 80,2 kg), und dein 7-Tage-Schnitt liegt bei 78,7 kg. Noch 3,4 kg bis zu deinem Zielgewicht von 75 kg.",
                    },
                    {
                        from: "user",
                        text: "Taille war übrigens 84 cm. wie ist das im Vergleich?",
                    },
                    {
                        from: "ai",
                        text: "Taillenumfang von 84 cm gespeichert. Am 14. Februar waren es noch 86,5 cm, also 2,5 cm weniger.",
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
                title: "Muster erkennen",
                description:
                    "Frag, wann du mehr isst, und deine eigenen Einträge werden verglichen: Werktage mit Wochenenden, Tage mit und ohne Frühstück, große Mittagessen, frühes mit spätem Abendessen. Auffällige Tage werden ebenfalls markiert – gezeigt werden Muster, keine Ursachen.",
                toolNotes: {
                    get_meal_patterns:
                        "Vergleicht Frühstück, Abendessenszeiten und Wochenenden über 30 Tage",
                },
                messages: [
                    {
                        from: "user",
                        text: "esse ich an Tagen ohne Frühstück mehr? kommt mir so vor",
                    },
                    {
                        from: "ai",
                        text: "Ein bisschen, ja. Du hast 28 der letzten 30 Tage erfasst und an 6 davon kein Frühstück gegessen. An diesen Tagen lagst du im Schnitt bei 2.215 kcal und 88 g Protein, an den 22 Tagen mit Frühstück bei 1.940 kcal und 123 g.",
                    },
                    {
                        from: "user",
                        text: "und spätes Abendessen? an Trainingstagen esse ich erst um 9",
                    },
                    {
                        from: "ai",
                        text: "Das fällt auch auf: An den 9 Tagen mit Abendessen ab 20 Uhr lagst du im Schnitt bei 2.165 kcal, an den anderen 19 bei 1.920. Beides sind Muster in deinen Einträgen, kein Beweis, dass eins davon die Ursache ist.",
                    },
                    {
                        from: "user",
                        text: "und am Wochenende?",
                    },
                    {
                        from: "ai",
                        text: "Kaum ein Unterschied: am Wochenende im Schnitt 2.010 kcal, unter der Woche 1.993.",
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
                        "Schaltet Alkohol ein, in Gramm und zusätzlich in UK-Einheiten",
                    log_meal:
                        "Erfasst das Pint mit seinem Alkoholgehalt in Gramm reinen Alkohols (568 ml × 4 % × 0,789)",
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
                        text: "Die Alkohol-Erfassung ist an – in Gramm und zusätzlich in UK-Einheiten.",
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
                        text: "Zum Abendessen erfasst: Ein Pint mit 568 ml und 4 % entspricht 17,9 g Alkohol bzw. 2,3 UK-Einheiten, etwa 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Lagerbier, 4 % (1 Pint, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Deinen Verlauf mitnehmen",
                description:
                    "Du wechselst von MyFitnessPal, Cronometer, Lose It! oder MacroFactor? Der Importer öffnet sich im Chat, liest deinen Export im Browser und ordnet ihn zu, speichert nichts, bevor du die Vorschau bestätigst, und legt keine Mahlzeit doppelt an, wenn du dieselbe Datei bei unveränderter Zeitzone erneut importierst. Ist noch keine Zeitzone eingestellt, wird das zuerst geklärt, damit jede Mahlzeit am richtigen Tag landet.",
                toolNotes: {
                    get_profile:
                        "Zeigt, dass im Konto noch keine Zeitzone eingestellt ist",
                    set_timezone:
                        "Setzt America/Chicago, damit Mahlzeiten in deiner Ortszeit landen",
                    start_meal_import:
                        "Öffnet den Importer für deine Exportdatei im Chat",
                    bulk_import_meals:
                        "Speichert die bestätigten Zeilen in Paketen von bis zu 50 und überspringt bereits importierte",
                },
                messages: [
                    {
                        from: "user",
                        text: "ich steig von MyFitnessPal um. kannst du mein Ernährungstagebuch rüberholen? den Export hab ich schon",
                    },
                    {
                        from: "ai",
                        text: "Bevor ich den Importer öffne: In deinem Konto ist keine Zeitzone eingestellt, die Datumsangaben in deinem Export würden also als UTC gelesen, und Mahlzeiten könnten am falschen Tag landen. Willst du sie zuerst einstellen? In welcher Zeitzone bist du?",
                    },
                    {
                        from: "user",
                        text: "Chicago",
                    },
                    {
                        from: "ai",
                        text: "Zeitzone auf America/Chicago gesetzt, und der Importer ist oben geöffnet: Wähl dort deine MyFitnessPal-Exportdatei aus. Sie wird direkt in deinem Browser gelesen, und gespeichert wird erst, wenn du die Vorschau bestätigst.",
                    },
                    {
                        from: "user",
                        text: "die Spalten hat er zugeordnet, aber bei Name des Lebensmittels steht „nicht in dieser Datei“?",
                    },
                    {
                        from: "ai",
                        text: "Das ist bei MyFitnessPal normal: Der Export hat pro Tag eine Zeile je Mahlzeit, mit den Summen, aber ohne Lebensmittelnamen. Zeilen ohne Lebensmittelnamen werden mit der App beschriftet, aus der sie stammen, und Kalorien und Makros werden unverändert übernommen.",
                    },
                    {
                        from: "user",
                        text: "603 Mahlzeiten. da steht, die werden mittags eingetragen?",
                    },
                    {
                        from: "ai",
                        text: "Genau, der Export hat Datumsangaben, aber keine Uhrzeiten, deshalb wird jede Mahlzeit auf 12 Uhr Ortszeit gesetzt. So landet jede in Chicago am richtigen Tag – du siehst nur nicht, wann du tatsächlich gegessen hast.",
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
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Deine Daten mitnehmen",
                description:
                    "Eine Anfrage packt alles, was über dich gespeichert ist – Mahlzeiten, Wasser, Gewichtseinträge, Körpermaße, Ziele, Profileinstellungen, deinen Kontodatensatz, Nutzungstelemetrie und App-Verbindungen –, in ein ZIP aus CSV-Dateien samt README. Zeitstempel stehen in deiner Zeitzone, und meals.csv lässt sich direkt wieder importieren.",
                toolNotes: {
                    export_all_data:
                        "Packt neun CSV-Dateien und ein README in ein ZIP hinter einem 60-Minuten-Link",
                },
                messages: [
                    {
                        from: "user",
                        text: "meine Ernährungsberaterin will mein Ernährungstagebuch sehen. kannst du das als Tabelle exportieren?",
                    },
                    {
                        from: "ai",
                        text: "Erledigt. Das ZIP enthält 1.204 Mahlzeiten, 318 Wasser-Einträge und 64 Gewichtseinträge, dazu deine Ernährungsziele, Profileinstellungen, Kontodaten, Telemetrie zur Werkzeugnutzung und App-Verbindungen. Dein Ernährungstagebuch ist die meals.csv darin.",
                        link: "Deinen Export herunterladen (Link 60 Minuten gültig)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Frühstück hier, Abendessen woanders.",
        sub: "Live-Statistiken über alle Nutrition-MCP-Konten – Kalorien, Mahlzeiten-Einträge, Makros und abgenommenes Gewicht –, alle fünf Sekunden aktualisiert.",
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
        foot: "Summen über alle Konten, aktualisiert mit jeder erfassten Mahlzeit. Daten einzelner Personen werden nie angezeigt.",
    },

    features: {
        title: "Was du erfassen kannst",
        cards: [
            {
                title: "Mahlzeiten in eigenen Worten",
                body: "Beschreib, was du gegessen hast – deine KI schätzt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein in Milligramm und erfasst alles.",
            },
            {
                title: "Barcode scannen",
                body: "Fotografier einen Produkt-Barcode oder tipp ihn ein und hol dir Makros, Ballaststoffe und Zucker von Open Food Facts – umgerechnet auf die Menge, die du gegessen hast.",
            },
            {
                title: "Ziele & Fortschritt",
                body: "Leg tägliche Ziele für Kalorien, Makros, Ballaststoffe und Wasser fest – dazu Limits für Zucker, Koffein und Alkohol, unter denen du bleiben willst – und verfolg deinen Fortschritt live.",
            },
            {
                title: "Übersichten & Trends",
                body: "Tages- und Wochenübersichten, 7/14/30-Tage-Trends, Serien und wiederkehrende Essmuster.",
            },
            {
                title: "Wasser erfassen",
                body: "Erfasse deine Flüssigkeitszufuhr in Millilitern neben deinen Mahlzeiten und sieh sie dir pro Tag an.",
            },
            {
                title: "Gewichts-Tracking",
                body: "Erfasse dein Körpergewicht in kg oder lb, sieh dir dein geglättetes Trendgewicht und deine Wochenrate über deine gesamte Historie an und verfolg deinen Fortschritt Richtung Zielgewicht. Maßband-Maße von neun Körperstellen – von der Taille bis zur Wade – erfasst du daneben in cm oder in.",
            },
            {
                title: "Passt sich deiner Zeitzone an",
                body: "Der Tag wechselt nach deiner Ortszeit, egal wo auf der Welt du bist.",
            },
            {
                title: "Import aus einer anderen App",
                body: "Bring deinen Mahlzeiten-Verlauf aus MyFitnessPal, Cronometer, Lose It! oder MacroFactor mit – oder aus jeder anderen CSV-Datei, deren Spalten du selbst zuordnest. Bevor etwas gespeichert wird, bestätigst du, was hinzugefügt wird.",
            },
            {
                title: "Export & volle Kontrolle über deine Daten",
                body: "Nimm alles mit, was wir über dich speichern – Mahlzeiten, Wasser, Gewicht, Körpermaße, Ziele und Profil, dazu deinen Kontodatensatz, die Nutzungstelemetrie und deine verbundenen Apps – als ein ZIP mit CSV-Dateien. Bisher lassen sich nur die Mahlzeiten wieder importieren. Lösch dein Konto und deine Daten, wann immer du willst.",
            },
        ],
    },

    why: {
        title: "Reden schlägt Tippen.",
        sub: "Fotografier einen Barcode oder sag einfach, was du gegessen hast – kein Suchen in Datenbanken, keine extra App.",
        oldHeading: "Klassische Apps",
        oldItems: [
            "Jedes Lebensmittel in einer Datenbank suchen",
            "Falsche Datenbankeinträge von Hand korrigieren",
            "Noch eine App mehr, oft hinter einer Bezahlschranke",
            "Mühsames Eintippen von Hand",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Mahlzeiten in eigenen Worten beschreiben",
            "Kalorien & Makros werden für dich geschätzt",
            "Läuft kostenlos in Claude oder ChatGPT",
            "Trends, Übersichten und Ziele einfach abfragen",
        ],
        noteHtml:
            'Du wechselst von einer bestimmten App? Sieh dir an, wie sich Nutrition MCP im Vergleich zu <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer und anderen Trackern</a> schlägt.',
    },

    trust: [
        {
            label: "Standardmäßig privat",
            small: "Nie verkauft, weitergegeben oder für Werbung genutzt.",
        },
        { label: "Open Source", small: "Selbst prüfen oder hosten." },
        {
            label: "Jederzeit exportieren",
            small: "Alles Gespeicherte als CSV in einem ZIP.",
        },
        { label: "Sofort löschen", small: "Konto & Daten entfernen." },
    ],

    support: {
        title: "Hilf mit, das Projekt am Laufen zu halten.",
        sub: "Nutrition MCP ist kostenlos und werbefrei. Patreon deckt die Kosten für Server und Datenbank.",
        updatesTitle: "Neues auf Patreon",
        updatesBadge: "Kostenlos",
        updatesNote: "Kostenlos lesbar – keine Mitgliedschaft nötig.",
        updatesPrevLabel: "Vorheriges Update",
        updatesNextLabel: "Nächstes Update",
        updatesDotLabel: "Update",
        postLinkLabel: "Auf Patreon lesen",
        free: {
            tier: "Kostenloses Mitglied",
            price: "0 $",
            desc: "Bleib auf dem Laufenden: Neuigkeiten und Updates zum Server, neue Werkzeuge und was als Nächstes kommt.",
            cta: "Auf Patreon folgen",
        },
        paid: {
            tier: "Zahlendes Mitglied",
            price: "Zahl, was du willst",
            desc: "Wenn dir Nutrition MCP hilft, kannst du dich an den Kosten für Hosting und Datenbank beteiligen. Alle bekommen dieselben Funktionen – Unterstützer eingeschlossen –, und es bleibt für alle kostenlos.",
            cta: "Unterstützer werden",
        },
    },

    cta: {
        title: "In unter einer Minute mit dem Erfassen loslegen.",
        sub: "Kostenlos und Open Source – funktioniert mit der KI, die du schon nutzt.",
        primary: "Schnell installieren",
        secondary: "Auf GitHub einen Stern geben",
    },

    contact: {
        title: "Fragen oder Feedback?",
        sub: "Einen Bug gefunden, einen Feature-Wunsch oder einfach eine Frage? Schreib mir direkt eine E-Mail – ich lese jede Nachricht.",
        cta: "E-Mail schreiben",
    },

    faqSection: {
        title: "Häufig gestellte Fragen",
    },
    faq: [
        {
            question: "Was ist Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP ist ein kostenloser Open-Source-MCP-Server (Model Context Protocol), der Claude, ChatGPT oder einen anderen MCP-Client in einen Kalorienzähler und Makro-Tracker verwandelt. Statt eine Lebensmitteldatenbank zu durchsuchen, sagst du deiner KI, was du gegessen hast, und sie trägt Kalorien, Makros, Ballaststoffe, Zucker und Koffein in dein eigenes Ernährungstagebuch ein.",
        },
        {
            question: "Was ist das Model Context Protocol (MCP)?",
            visibleHtml:
                "Das Model Context Protocol ist ein offener Standard, über den sich KI-Assistenten wie Claude und ChatGPT mit externen Werkzeugen und Datenquellen verbinden können. Ein MCP-Server stellt bestimmte Fähigkeiten bereit – hier das Ernährungs-Tracking –, die die KI während eines Gesprächs nutzen kann. Stell es dir wie ein Plugin-System für KI-Assistenten vor.",
        },
        {
            question: "Wie zähle ich Kalorien mit Claude oder ChatGPT?",
            visibleHtml:
                "Verbinde Nutrition MCP einmal – in Claude über das Connector-Verzeichnis, in ChatGPT als benutzerdefinierte App mit der Server-URL – und melde dich an. Dann sag deiner KI in eigenen Worten, was du gegessen hast, zeig ihr ein Foto der Mahlzeit oder gib ihr einen Produkt-Barcode. Deine KI schätzt Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe und Zucker, und Nutrition MCP speichert den Eintrag in deinem Ernährungstagebuch. Frag jederzeit nach deinen heutigen Summen, Wochentrends oder deinem Fortschritt bei deinen Zielen.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly — same
            // divergence as the English source's "Does it work with
            // ChatGPT?" entry.
            question: "Funktioniert es mit ChatGPT?",
            visibleHtml:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle mit der Server-URL eine benutzerdefinierte App mit OAuth und melde dich an. Dafür brauchst du den Entwicklermodus (Developer mode) von ChatGPT, den OpenAI in einigen ChatGPT-Tarifen anbietet.",
            jsonLdText:
                "Ja. Öffne in ChatGPT im Web Settings → Apps, erstelle mit der Server-URL https://nutrition-mcp.com/mcp eine benutzerdefinierte App mit OAuth und melde dich an. Dafür brauchst du den Entwicklermodus (Developer mode) von ChatGPT, den OpenAI in einigen ChatGPT-Tarifen anbietet.",
        },
        {
            question: "Welche anderen Clients werden unterstützt?",
            visibleHtml:
                "Jeder MCP-Client, der OAuth 2.0 mit PKCE unterstützt – darunter Claude.ai, die Desktop- und Mobil-Apps von Claude, Claude Code, Cursor, Windsurf und VS Code.",
        },
        {
            question: "Kann ich es selbst hosten?",
            visibleHtml:
                'Ja. Nutrition MCP ist Open Source (MIT-Lizenz). Du kannst eine eigene Instanz mit deinem eigenen Supabase-Projekt betreiben – das <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub-Repository</a> enthält eine vollständige Anleitung zum Selbsthosten und ein Dockerfile.',
        },
        {
            question: "Ist Nutrition MCP kostenlos?",
            visibleHtml:
                "Ja, es ist komplett kostenlos – keine kostenpflichtige Version, keine Werbung, keine versteckten Kosten. Du brauchst eine KI-App, die MCP-Connectors unterstützt, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden anlegst. Freiwillige Spenden auf Patreon helfen, die Serverkosten zu decken, und schalten nichts frei.",
        },
        {
            question: "Was kann ich erfassen?",
            visibleHtml:
                "Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Wasser für jeden Eintrag – in eigenen Worten beschrieben oder per Produkt-Barcode aus Open Food Facts abgerufen. Auch Koffein wird erfasst, in Milligramm, der Einheit auf jedem Etikett; es liefert keine Kalorien. Alkohol lässt sich ebenfalls erfassen, in Gramm reinen Alkohols; er wird angezeigt, sobald du die Alkohol-Erfassung einschaltest. Außerdem kannst du dein Körpergewicht in kg oder lb erfassen und deinen Trend Richtung Zielgewicht verfolgen. Auch Körpermaße (Taille, Hüfte, Hals, Brust, Schultern, Oberarm, Unterarm, Oberschenkel und Wade) lassen sich in cm oder Zoll erfassen. Sieh dir Tagesübersichten an, frag Mahlzeiten nach Zeitraum ab, ändere oder lösche frühere Einträge, leg Ziele fest und verfolg Trends über die Zeit.",
        },
        {
            question: "Wie genau sind die Kalorienangaben?",
            visibleHtml:
                "Es sind Schätzungen. Bei einer Mahlzeit, die du beschreibst oder fotografierst, schätzt deine KI die Werte; bei einem Barcode stammen sie aus den Etikettdaten des Produkts in Open Food Facts, die deine KI auf deine Menge umrechnet. Beides kann danebenliegen, also prüf alles, worauf es dir ankommt – du kannst jeden Eintrag korrigieren oder löschen, indem du einfach danach fragst. Nutrition MCP ist ein Werkzeug zum Erfassen, keine medizinische Beratung und keine Ernährungsberatung: Sprich mit einer Ärztin, einem Arzt oder einer Ernährungsfachkraft, bevor du Entscheidungen über deine Gesundheit triffst – besonders in der Schwangerschaft, bei einer Erkrankung oder wenn du schon einmal ein gestörtes Essverhalten hattest.",
        },
        {
            question: "Wird Alkohol erfasst?",
            visibleHtml:
                "Ja, als Opt-in: Die Alkohol-Erfassung ist standardmäßig aus, und Alkohol bleibt in Mahlzeiten, Zielen und Übersichten ausgeblendet, bis du sie einschaltest. Dann werden Getränke in Gramm reinen Alkohols und – je nach Wahl – als US-Standard-Drinks oder UK-Einheiten angezeigt. Alkohol wird nie automatisch ermittelt: Er wird nur aus einem Getränk erfasst, das du einträgst, oder aus einer Alkohol-Spalte in einer importierten Datei, und ein eingetragenes Getränk wird auch bei ausgeschalteter Erfassung gespeichert. Schaltest du sie wieder aus, wird Alkohol erneut ausgeblendet, und der Importer liest keine Alkohol-Spalten mehr – das ist kein Löschschalter, und dein Export enthält immer, was du erfasst hast. Um einen Alkoholwert zu entfernen, lösch die Mahlzeit, zu der er gehört.",
        },
        {
            question:
                "Kann ich meinen Verlauf aus MyFitnessPal oder einer anderen App importieren?",
            visibleHtml:
                "Ja. Sag, dass du deinen Verlauf importieren willst, und im Chat öffnet sich ein Importer: Du wählst die CSV, die deine alte App exportiert hat, prüfst, wie die Spalten zugeordnet werden, und siehst vor dem Bestätigen, was hinzugefügt wird. Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden automatisch erkannt; jede andere CSV funktioniert, wenn du die Spalten selbst zuordnest. Die Datei liest dein Browser, die KI tippt deine Zeilen also nie ab. In Clients ohne In-Chat-Panels kannst du deinen Export stattdessen einfügen – und wenn du dieselbe Datei erneut importierst, entstehen keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        },
        {
            question: "Sind meine Daten privat?",
            visibleHtml:
                'Deine Einträge werden in der EU gespeichert und mit deinem eigenen Konto verknüpft, auf das du über die verbundenen KI-Apps zugreifst. Nutrition MCP verkauft deine Daten nie, gibt sie nie an Dritte weiter und nutzt sie nie für Werbung; die Startseite zeigt nur anonyme Gesamtzahlen über die ganze Website. Was deine KI über die Werkzeuge liest, geht an den Anbieter dieser KI – im Rahmen deiner eigenen Vereinbarung mit ihm. Du kannst jederzeit alles exportieren, was wir über dich speichern, oder dein Konto samt allen Daten löschen – Details stehen in der <a href="/privacy" data-link="privacy">Datenschutzerklärung</a>.',
        },
    ],
};

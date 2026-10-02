// German translation of src/copy/alt-ui.ts's ALT_UI_EN. See that file's
// header for the shape/trust-level rules (Html-suffixed / documented "raw"
// fields carry literal markup and pre-escaped entities that must survive
// translation verbatim; placeholders like {app}/{link}/{apps} are
// substituted by the generator at render time).

import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_DE: AltUiCopy = {
    breadcrumbHome: "Startseite",
    breadcrumbAlternatives: "Alternativen",
    breadcrumbAriaLabel: "Brotkrümelnavigation",
    ctaQuickInstall: "Schnell installieren",
    ctaClosingTitle: "Erfasse deine Ernährung in der KI, die du schon nutzt.",
    disclaimerAppHtml:
        "{app} ist eine Marke des jeweiligen Inhabers. Nutrition MCP ist ein unabhängiges Open-Source-Projekt und steht in keiner Verbindung zu {app}; es wird von {app} weder unterstützt noch gesponsert. Die Vergleiche geben öffentlich verfügbare Informationen zum Zeitpunkt der Erstellung wieder und können sich ändern.",
    disclaimerHubHtml:
        "{apps} und andere Produktnamen sind Marken ihrer jeweiligen Inhaber. Nutrition MCP ist ein unabhängiges Open-Source-Projekt, steht in keiner Verbindung zu ihnen und wird von ihnen nicht unterstützt. Die Vergleiche geben öffentlich verfügbare Informationen zum Zeitpunkt der Erstellung wieder und können sich ändern.",

    app: {
        heroEyebrow: "{app}-Alternative",
        heroTitleHtml: "Du suchst einen <em>{app} MCP</em>-Server?",
        heroLead:
            "{app} bietet keinen an, den du verbinden kannst – dein {app}-Tagebuch lässt sich also nicht aus Claude oder ChatGPT heraus führen. Nutrition MCP erledigt dasselbe im Gespräch, kostenlos und Open Source.",
        ctaConnect: "In unter einer Minute verbinden",
        ctaSeeComparison: "Zum Vergleich",

        answerEyebrow: "Kurz gesagt",
        answerTitle:
            "Nein – {app} hat keinen offiziellen, öffentlichen MCP-Server.",
        answerBodyHtml:
            "Das Model Context Protocol (MCP) ist der offene Standard, über den sich KI-Assistenten wie Claude und ChatGPT mit externen Werkzeugen verbinden. {app} bietet keinen öffentlichen MCP-Server an, es gibt also keinen offiziellen Weg, aus deiner KI heraus Essen in dein {app}-Tagebuch einzutragen. Wenn du nach „{app} MCP“ oder „{app} mit Claude verbinden“ gesucht hast, suchst du eigentlich einen Ernährungs-Tracker, der <em>direkt in</em> deiner KI läuft – und genau das ist Nutrition MCP.",

        insteadEyebrow: "Was du stattdessen bekommst",
        insteadTitle: "Dasselbe Tracking – einfach im Gespräch",
        features: [
            {
                title: "Mahlzeiten in eigenen Worten",
                body: "Sag „Haferflocken mit Banane und Erdnussbutter“ – deine KI schätzt Kalorien und Makros samt Ballaststoffen, Gesamtzucker und Koffein und erfasst die Mahlzeit. Keine Datenbanksuche.",
            },
            {
                title: "Barcode-Scan – kostenlos",
                body: "Schick einen Produkt-Barcode, und die Makros laut Etikett kommen von Open Food Facts – auch Ballaststoffe und Zucker, sofern das Etikett sie angibt. Kostenlos für alle, ohne Abo.",
            },
            {
                title: "Gewicht &amp; Ziele",
                body: "Erfasse dein Körpergewicht in kg oder lb und leg Ziele für Kalorien, Makros, Ballaststoffe, Zucker, Koffein und Wasser fest – Ballaststoffe als Ziel, das du erreichen willst, Zucker und Koffein als Limits, unter denen du bleiben willst – und verfolge deinen Trend in Richtung Zielgewicht. Auch Alkohol lässt sich erfassen – per Opt-in und standardmäßig aus, bis du es einschaltest.",
            },
            {
                title: "Übersichten &amp; Trends",
                body: "Frag nach Tagessummen, Wochentrends, Serien und wiederkehrenden Essgewohnheiten – direkt im Chat.",
            },
            {
                title: "Import &amp; volle Kontrolle über deine Daten",
                body: "Importier deinen Mahlzeiten-Verlauf aus dem CSV-Export einer anderen App – eingelesen in deinem Browser, nicht von der KI. Nimm jederzeit alles wieder mit: ein ZIP mit deinen Mahlzeiten, Wasser, Gewicht, Zielen und deinem Profil, dazu deinen Kontodaten, der Nutzungs-Telemetrie und deinen verbundenen Apps, als CSV-Dateien. Bisher lassen sich nur Mahlzeiten wieder importieren. Oder lösch dein Konto – genauso einfach.",
            },
            {
                title: "Open Source &amp; kostenlos",
                body: "MIT-lizenziert und selbst hostbar – keine Werbung, keine Bezahlschranke, kein Upselling. Prüf den Code oder betreib deine eigene Instanz.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Weitere Vergleiche:",
        compareTitle: "Der direkte Vergleich",
        pros: [
            "Als MCP-Server gebaut – läuft direkt in Claude &amp; ChatGPT",
            "Mahlzeiten in eigenen Worten beschreiben – Kalorien, Makros, Ballaststoffe, Zucker &amp; Koffein werden für dich geschätzt",
            "Barcode-Scan, Trends, CSV-Import &amp; -Export – alles kostenlos",
            "Keine separate App, keine Werbung, Open Source",
        ],

        movingEyebrow: "Umstieg von {app}",

        importEyebrow: "Dein {app}-Verlauf",
        importSub:
            "Sag, dass du importieren willst, und direkt im Chat öffnet sich ein Importer: Wähl deinen Export, ordne die Spalten zu, prüf in der Vorschau, was dazukommt, und bestätige. Die Datei wird in deinem Browser eingelesen – die KI sieht die Zeilen nie. In Clients ohne In-Chat-Panels fügst du deinen Export stattdessen ein.",

        switchEyebrow: "So wechselst du",
        switchSub:
            "Funktioniert mit jedem MCP-Client, der OAuth 2.0 mit PKCE unterstützt. Beim ersten Verbinden legst du ein Konto an – mit Google oder mit E-Mail-Adresse und Passwort.",
        installSteps: [
            'Öffne <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP im Claude-Verzeichnis</a>.',
            "Klick auf <strong>Connect</strong> und melde dich mit Google oder mit E-Mail und Passwort an.",
            "Leg los: Sag einfach, was du gegessen hast.",
        ],
        installNoteTemplate:
            "Du nutzt stattdessen ChatGPT oder einen anderen Client? Die {link} deckt ChatGPT, Cursor, VS Code, Claude Code und mehr ab.",
        installLinkText: "vollständige Installationsanleitung",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Fragen zu {app} &amp; MCP",
        faq: {
            mcpQ: "Hat {app} einen MCP-Server?",
            mcpA: "Keinen offiziellen. {app} bietet keinen öffentlichen MCP-Server (Model Context Protocol) an, es gibt also keinen offiziellen Weg, aus Claude, ChatGPT oder anderen MCP-Clients heraus etwas in dein {app}-Tagebuch einzutragen. Es gibt einige inoffizielle Server aus der Community; sie stammen nicht von {app} und werden von {app} nicht unterstützt. Nutrition MCP ist etwas anderes: ein kostenloser Open-Source-Tracker, von Grund auf als MCP-Server gebaut, mit eigenem Konto, der deinen {app}-CSV-Export importieren kann.",
            connectQ: "Wie verbinde ich {app} mit Claude?",
            connectA:
                "Es gibt keinen offiziellen {app}-Connector für Claude, weil {app} keinen öffentlichen MCP-Server anbietet. Eine Möglichkeit ist Nutrition MCP, ein kostenloser MCP-Server aus dem Claude-Verzeichnis: Öffne ihn unter https://claude.ai/directory/nutrition-mcp, klick auf Connect, melde dich an und erfasse ab dann alles im Gespräch.",
            goodAltQ: "Ist Nutrition MCP eine gute {app}-Alternative?",
            goodAltA:
                "Ja, wenn du Kalorien, Makros (samt Ballaststoffen, Gesamtzucker und Koffein), Wasser und Gewicht erfassen willst, ohne eine separate App zu öffnen oder eine Lebensmitteldatenbank zu durchsuchen. Statt dich durch eine Datenbank zu tippen, beschreibst du in eigenen Worten, was du gegessen hast, schickst ein Foto oder scannst einen Barcode, und deine KI erfasst es – komplett kostenlos und Open Source.",
            importQ: "Kann ich meine {app}-Daten importieren?",
            readExportQ: "Liest die KI beim Import meine Exportdatei?",
            readExportA:
                "Nicht, wenn sich der Importer öffnet. Er liest die CSV in deinem Browser ein und zeigt dir, was dazukommt, bevor irgendetwas gespeichert wird: wie viele Mahlzeiten, die Kaloriensumme, alles, was er markieren musste, und die Zeilen selbst – bei einer langen Datei die ersten davon plus die Anzahl der übrigen statt jeder einzelnen Zeile. Übertragen werden nur die Zeilen, die du bestätigst, und zwar als strukturierte Daten statt über die Antwort der KI, sodass unterwegs keine Zeile vertippt oder erfunden werden kann. Außerdem trägt jede Zeile einen Inhalts-Fingerabdruck: Importierst du dieselbe Datei noch einmal, werden diese Mahlzeiten als bereits erfasst gemeldet statt verdoppelt – solange sich deine Zeitzone zwischendurch nicht geändert hat. Kann dein Client keine In-Chat-Panels anzeigen, bleibt als Ausweg, den Export einzufügen – auf diesem Weg liest die KI ihn tatsächlich, nimm also lieber den Importer, wenn du die Wahl hast.",
            freeQ: "Ist Nutrition MCP kostenlos?",
            freeAFallback:
                "Ja. Nutrition MCP ist komplett kostenlos – ohne Premium-Version, Werbung oder Funktionen hinter einer Bezahlschranke, anders als Apps, die manche Funktionen nur im Abo anbieten. Du brauchst eine KI-App mit MCP-Unterstützung, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden mit Google oder mit E-Mail und Passwort anlegst.",
        },
        importFallbackNote:
            " In Clients ohne In-Chat-Panels kannst du deinen Export stattdessen einfügen.",

        ctaClosingSub:
            "Kostenlos und Open Source – kein {app}-Konto, keine zusätzliche App.",
        ctaOtherAlternatives: "Weitere Alternativen",
    },

    hub: {
        heroEyebrow: "MCP-Alternativen",
        heroTitleHtml:
            "Deine Ernährungs-App hat keinen offiziellen <em>MCP-Server</em>.",
        heroLead:
            "Apps wie MyFitnessPal, Cronometer und Lose It! bieten keinen offiziellen Weg, dein Tagebuch aus Claude oder ChatGPT heraus zu führen. Mit Nutrition MCP – kostenlos und Open Source – erfasst du Mahlzeiten, Makros und Gewicht, indem du einfach mit deiner KI sprichst. Deinen bisherigen Verlauf kannst du importieren.",
        ctaSeeExamples: "Beispiele ansehen",

        appsEyebrow: "Umstieg von …",
        appsTitle: "Wähl deine aktuelle App",
        appsSub:
            "Sieh dir an, wie Nutrition MCP im Vergleich zu deinem jetzigen Tracker abschneidet – und wie du samt deinem bisherigen Verlauf in deine KI umziehst.",
        noAppNote:
            "Deine App ist nicht dabei? Die meisten Ernährungs-Apps bieten ebenfalls keinen offiziellen MCP-Server an – Nutrition MCP funktioniert gleich, egal von welcher App du wechselst.",
        requestComparisonLinkText: "Vergleich anfragen",

        importEyebrow: "Deinen Verlauf mitnehmen",
        importTitle: "Du musst nicht bei null anfangen",
        importSub:
            "Meist bleibt man wegen der Jahre an Einträgen, die schon drinstecken. Sag, dass du importieren willst, und direkt im Chat öffnet sich ein Importer: Wähl deinen Export, ordne die Spalten zu, prüf in der Vorschau, was dazukommt, und bestätige – oder füg den Export ein, wenn dein Client keine In-Chat-Panels hat.",
        importBody: [
            "Die Datei wird in deinem Browser eingelesen, nicht von der KI – so kann beim Übertragen keine Zeile vertippt werden, und du siehst die genauen Mahlzeiten, bevor auch nur eine davon gespeichert wird. Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden an ihren Spaltennamen erkannt; jede andere CSV funktioniert auch, du ordnest jede Spalte nur einmal zu. Übernommen werden Datum und Uhrzeit, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein in Milligramm – und auch Alkohol, wenn du die Alkohol-Erfassung vorher eingeschaltet hast.",
            "Der Importer kommt mit den Tücken echter Exportdateien zurecht: Datumsangaben im Format TT.MM.JJJJ und MM/TT/JJJJ, Energie in Kilojoule ebenso wie in Kilokalorien, europäische Dateien mit Semikolon als Trennzeichen und Komma als Dezimalzeichen, Felder in Anführungszeichen mit Zeilenumbrüchen darin, Summenzeilen am Ende und Markierungen für gelöschte Zeilen. Auch die Spaltenüberschriften müssen nicht auf Englisch sein – Kalorien oder Ballaststoffe aus einem deutschen Export werden erkannt, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet. Wo eine Datei wirklich mehrdeutig ist – 05/06 kann Mai oder Juni sein –, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei und lässt dich bestätigen, statt zu raten. Und jede Zeile trägt einen Inhalts-Fingerabdruck: Importierst du dieselbe Datei erneut, werden die Mahlzeiten als bereits erfasst gemeldet statt verdoppelt – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        ],

        ctaSub: "Kostenlos und Open Source – funktioniert mit Claude, ChatGPT und jedem MCP-Client.",
        ctaStarGithub: "Auf GitHub einen Stern geben",
    },
};

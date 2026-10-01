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
        "{app} ist eine Marke des jeweiligen Eigentümers. Nutrition MCP ist ein unabhängiges, quelloffenes Projekt und steht in keiner Verbindung zu {app}, wird von ihm nicht unterstützt oder gesponsert. Die Vergleiche spiegeln öffentlich verfügbare Informationen zum Zeitpunkt der Erstellung wider und können sich ändern.",
    disclaimerHubHtml:
        "{apps} und andere Produktnamen sind Marken ihrer jeweiligen Eigentümer. Nutrition MCP ist ein unabhängiges, quelloffenes Projekt und steht in keiner Verbindung zu ihnen und wird nicht von ihnen unterstützt. Die Vergleiche spiegeln öffentlich verfügbare Informationen zum Zeitpunkt der Erstellung wider und können sich ändern.",

    app: {
        heroEyebrow: "{app}-Alternative",
        heroTitleHtml: "Auf der Suche nach einem <em>{app} MCP</em>-Server?",
        heroLead:
            "{app} stellt keinen bereit, den du verbinden kannst — du kannst dein {app}-Tagebuch also nicht aus Claude oder ChatGPT heraus führen. Nutrition MCP erledigt dieselbe Aufgabe im Gespräch, und das kostenlos und quelloffen.",
        ctaConnect: "In unter einer Minute verbinden",
        ctaSeeComparison: "Zum Vergleich",

        answerEyebrow: "Die kurze Antwort",
        answerTitle:
            "Nein — {app} hat keinen offiziellen, öffentlichen MCP-Server.",
        answerBodyHtml:
            'Das Model Context Protocol (MCP) ist der offene Standard, der es KI-Assistenten wie Claude und ChatGPT erlaubt, sich mit externen Werkzeugen zu verbinden. {app} stellt keinen öffentlichen MCP-Server bereit, es gibt also keinen offiziellen Weg, aus deiner KI heraus Essen in dein {app}-Ernährungstagebuch einzutragen. Wenn du nach „{app} MCP" oder „{app} mit Claude verbinden" gesucht hast, bist du eigentlich auf der Suche nach einem Ernährungs-Tracker, der <em>direkt in</em> deiner KI lebt — genau das ist Nutrition MCP.',

        insteadEyebrow: "Was du stattdessen bekommst",
        insteadTitle: "Dasselbe Tracking, einfach durch Reden",
        features: [
            {
                title: "Mahlzeiten in normaler Sprache",
                body: 'Sag „Haferflocken mit Banane und Erdnussbutter" — deine KI schätzt Kalorien und Makros, inklusive Ballaststoffe, Gesamtzucker und Koffein, und erfasst es. Keine Datenbanksuche.',
            },
            {
                title: "Barcode scannen — kostenlos",
                body: "Schick einen Produkt-Barcode und hol die Etikett-Makros von Open Food Facts — auch Ballaststoffe und Zucker, wenn das Etikett sie listet. Kostenlos für alle, ohne Abo.",
            },
            {
                title: "Gewicht &amp; Ziele",
                body: "Erfasse dein Körpergewicht in kg oder lb, leg Ziele für Kalorien, Makros, Ballaststoffe, Zucker, Koffein und Wasser fest — Ballaststoffe als Zielwert, den du erreichen willst, Zucker und Koffein als Grenzwerte, die du unterschreiten willst — und verfolge Trends zu einem Zielgewicht. Alkohol-Tracking gibt es auch, opt-in und standardmäßig ausgeschaltet, bis du es aktivierst.",
            },
            {
                title: "Übersichten &amp; Trends",
                body: "Frag nach Tagessummen, Wochentrends, Serien und wiederkehrenden Essgewohnheiten — direkt im Chat.",
            },
            {
                title: "Import &amp; Eigentum an deinen Daten",
                body: "Importier deine Mahlzeiten-Historie aus dem CSV-Export einer anderen App — geparst in deinem Browser, nicht von der KI. Nimm jederzeit alles wieder mit heraus: ein ZIP mit deinen Mahlzeiten, Wasser, Gewicht, Zielen und deinem Profil, dazu deinem Kontodatensatz, der Nutzungs-Telemetrie und deinen verbundenen Apps, als CSV-Dateien. Mahlzeiten sind bisher der einzige Teil, der wieder importiert werden kann. Oder lösch dein Konto, genauso einfach.",
            },
            {
                title: "Quelloffen &amp; kostenlos",
                body: "MIT-lizenziert und selbst hostbar — keine Werbung, keine Bezahlschranke, kein Upselling. Prüf den Code oder betreib deine eigene Instanz.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Ebenfalls verglichen:",
        compareTitle: "Wie sie im Vergleich abschneiden",
        pros: [
            "Als MCP-Server gebaut — läuft direkt in Claude &amp; ChatGPT",
            "Mahlzeiten in normaler Sprache beschreiben; Kalorien, Makros, Ballaststoffe, Zucker &amp; Koffein werden für dich geschätzt",
            "Barcode-Scan, Trends, CSV-Import &amp; -Export — alles kostenlos",
            "Keine separate App, keine Werbung, quelloffen",
        ],

        movingEyebrow: "Wechsel von {app}",

        importEyebrow: "Deine {app}-Historie",
        importSub:
            "Bitte um den Import, und ein Importer öffnet sich direkt im Chat: Wähl deinen Export, ordne die Spalten zu, sieh eine Vorschau, was hinzugefügt wird, und bestätige. Die Datei wird in deinem Browser gelesen — die KI sieht die Zeilen nie. In Clients ohne In-Chat-Panels fügst du deinen Export stattdessen ein.",

        switchEyebrow: "So wechselst du",
        switchSub:
            "Funktioniert mit jedem MCP-Client, der OAuth 2.0 mit PKCE unterstützt. Bei der ersten Verbindung erstellst du ein Konto mit Google oder einer E-Mail-Adresse und einem Passwort.",
        installSteps: [
            'Öffne <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP im Claude-Verzeichnis</a>.',
            "Klick auf <strong>Connect</strong> und melde dich mit Google oder mit E-Mail und Passwort an.",
            "Leg los, indem du sagst, was du gegessen hast.",
        ],
        installNoteTemplate:
            "Nutzt du stattdessen ChatGPT oder einen anderen Client? Die {link} deckt ChatGPT, Cursor, VS Code, Claude Code und mehr ab.",
        installLinkText: "vollständige Installationsanleitung",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "{app} &amp; MCP-Fragen",
        faq: {
            mcpQ: "Hat {app} einen MCP-Server?",
            mcpA: "Keinen offiziellen. {app} stellt keinen öffentlichen Model Context Protocol (MCP) Server bereit, es gibt also keinen offiziellen Weg, aus Claude, ChatGPT oder anderen MCP-Clients heraus in dein {app}-Tagebuch einzutragen. Es gibt einige inoffizielle, von der Community gebaute Server; sie stammen nicht von {app} und werden von {app} nicht unterstützt. Nutrition MCP ist etwas anderes: ein kostenloser, quelloffener Tracker, von Grund auf als MCP-Server gebaut, mit eigenem Konto, der deinen {app}-CSV-Export importieren kann.",
            connectQ: "Wie verbinde ich {app} mit Claude?",
            connectA:
                "Es gibt keinen offiziellen {app}-Connector für Claude, weil {app} keinen öffentlichen MCP-Server bereitstellt. Eine Option ist Nutrition MCP, ein kostenloser MCP-Server, der im Claude-Verzeichnis gelistet ist: Öffne ihn unter https://claude.ai/directory/nutrition-mcp, klick auf Connect, melde dich an, und erfasse im Gespräch.",
            goodAltQ: "Ist Nutrition MCP eine gute {app}-Alternative?",
            goodAltA:
                "Wenn du Kalorien, Makros — inklusive Ballaststoffe, Gesamtzucker und Koffein —, Wasser und Gewicht erfassen willst, ohne eine separate App zu öffnen oder eine Lebensmitteldatenbank zu durchsuchen, dann ja. Statt dich durch eine Datenbank zu tippen, beschreibst du in normaler Sprache, was du gegessen hast, schickst ein Foto oder scannst einen Barcode, und deine KI erfasst es — komplett kostenlos und quelloffen.",
            importQ: "Kann ich meine {app}-Daten importieren?",
            readExportQ: "Liest die KI meine Exportdatei, wenn ich importiere?",
            readExportA:
                "Nicht, wenn sich der Importer öffnet. Er parst die CSV in deinem Browser und zeigt dir, was hinzugefügt wird, bevor irgendetwas geschrieben wird: wie viele Mahlzeiten, die Kalorien-Summe, alles, was er markieren musste, und die Zeilen selbst — bei einer langen Datei werden die ersten davon plus eine Anzahl der restlichen gelistet statt jeder Zeile. Nur die Zeilen, die du bestätigst, werden gesendet, und zwar als strukturierte Daten statt über die Antwort der KI, sodass keine Zeile unterwegs vertippt oder erfunden werden kann. Jede Zeile trägt außerdem einen Inhalts-Fingerabdruck, sodass ein erneuter Lauf derselben Datei diese Mahlzeiten als bereits erfasst meldet, statt sie zu verdoppeln, solange sich deine Zeitzone zwischendurch nicht geändert hat. Kann dein Client keine In-Chat-Panels anzeigen, ist der Fallback, den Export einzufügen — die KI liest ihn auf diesem Weg tatsächlich, bevorzuge also den Importer, wenn du die Wahl hast.",
            freeQ: "Ist Nutrition MCP kostenlos?",
            freeAFallback:
                "Ja. Nutrition MCP ist komplett kostenlos, ohne Premium-Stufe, Werbung oder Bezahlschranken — anders als Apps, die manche Funktionen hinter ein Abo packen. Du brauchst eine KI-App, die MCP unterstützt, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden mit Google oder mit E-Mail und Passwort anlegst.",
        },
        importFallbackNote:
            " In Clients ohne In-Chat-Panels kannst du deinen Export stattdessen einfügen.",

        ctaClosingSub:
            "Kostenlos und quelloffen — kein {app}-Konto, keine App zu öffnen.",
        ctaOtherAlternatives: "Weitere Alternativen",
    },

    hub: {
        heroEyebrow: "MCP-Alternativen",
        heroTitleHtml:
            "Deine Ernährungs-App hat keinen offiziellen <em>MCP-Server</em>.",
        heroLead:
            "Apps wie MyFitnessPal, Cronometer und Lose It! bieten keinen offiziellen Weg, dein Tagebuch aus Claude oder ChatGPT heraus zu führen. Nutrition MCP ist ein kostenloser, quelloffener Weg, Mahlzeiten, Makros und Gewicht zu erfassen, indem du mit deiner KI sprichst — inklusive Import deiner Historie.",
        ctaSeeExamples: "Beispiele ansehen",

        appsEyebrow: "Wechsel von …",
        appsTitle: "Wähl deine aktuelle App",
        appsSub:
            "Sieh dir an, wie Nutrition MCP im Vergleich zu dem Tracker abschneidet, den du heute nutzt — und wie du dein Erfassen und deine bestehende Historie in deine KI überträgst.",
        noAppNote:
            "Siehst du deine App nicht? Die meisten Ernährungs-Apps stellen ebenfalls keinen offiziellen MCP-Server bereit — Nutrition MCP funktioniert unabhängig davon gleich, wovon du wechselst.",
        requestComparisonLinkText: "Vergleich anfragen",

        importEyebrow: "Deine Historie mitbringen",
        importTitle: "Du musst nicht bei null anfangen",
        importSub:
            "Der übliche Grund, warum Leute bleiben, sind die Jahre, die schon erfasst sind. Bitte um den Import, und ein Importer öffnet sich direkt im Chat: Wähl deinen Export, ordne die Spalten zu, sieh eine Vorschau, was hinzugefügt wird, und bestätige — oder füge den Export ein, wenn dein Client keine In-Chat-Panels hat.",
        importBody: [
            "Die Datei wird in deinem Browser geparst, nicht von der KI gelesen — die Zeilen können also auf dem Weg hinein nicht vertippt werden, und du siehst die genauen Mahlzeiten, bevor auch nur eine geschrieben wird. Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden anhand ihrer Spaltennamen erkannt; jede andere CSV funktioniert auch, du zeigst dem Mapper nur einmal jede Spalte. Was mitkommt, sind Datum und Uhrzeit, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein in Milligramm — und ebenso Alkohol, wenn du die Alkohol-Erfassung vorher aktiviert hast.",
            "Die unangenehmen Seiten echter Exportdateien werden abgedeckt: Daten im Format TT.MM.JJJJ und MM/TT/JJJJ, Energie in Kilojoule ebenso wie in Kilokalorien, semikolon-getrennte europäische Dateien, deren Zahlen Komma-Dezimalstellen verwenden, in Anführungszeichen gesetzte Felder mit Zeilenumbrüchen darin, abschließende Summenzeilen und Flags für gelöschte Zeilen. Spaltenüberschriften müssen auch nicht englisch sein — Kalorien oder Ballaststoffe aus einem deutschen Export werden erkannt, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet. Wo eine Datei wirklich mehrdeutig ist — 05/06 könnte Mai oder Juni sein —, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei und bittet dich um Bestätigung, statt zu raten. Und jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein erneuter Import derselben Datei die Mahlzeiten als bereits erfasst meldet, statt sie zu verdoppeln, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        ],

        ctaSub: "Kostenlos und quelloffen — funktioniert mit Claude, ChatGPT und jedem MCP-Client.",
        ctaStarGithub: "Stern auf GitHub geben",
    },
};

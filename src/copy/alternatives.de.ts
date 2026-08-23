// German translation of src/copy/alternatives.ts's per-app AppCopy. See that
// file's header for the accuracy rules (which apps' exports are recognised
// by column name vs. need manual mapping, sniffed-then-confirmed dates and
// units, browser-side parsing) that still apply to this content — only the
// language changed, not the factual claims about the importer.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_DE: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Kein MCP-Server, und manche Funktionen brauchen einen Bezahl-Plan. Sieh dir die kostenlose, konversationelle Alternative an.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Für jedes Lebensmittel eine Datenbank durchsuchen und den richtigen Eintrag auswählen",
            "Manche Funktionen, wie der Barcode-Scanner, brauchen einen Bezahl-Plan",
            "Eine separate App und ein Konto, mit Werbung in der kostenlosen Stufe",
        ],
        note: "MyFitnessPal ist eine leistungsfähige App mit einer riesigen Lebensmitteldatenbank. Das ist keine Kritik daran — es ist einfach ein anderer Ansatz für alle, die lieber mit ihrer KI reden als sich durch einen Tracker zu tippen.",
        migrate: {
            title: "Die Datenbank hinter dir lassen",
            body: [
                "MyFitnessPal hat sich seinen Ruf mit einer der größten Lebensmitteldatenbanken überhaupt aufgebaut — zig Millionen crowdgesourcte Einträge. Diese Größe ist auch ihre Reibung: Bei jedem Lebensmittel scrollst du an Fast-Duplikaten vorbei und musst raten, welcher Eintrag stimmt. Konversationelles Erfassen überspringt die Suche komplett — du beschreibst das Essen, und deine KI schätzt die Makros.",
                "Du musst dein Tagebuch dafür nicht zurücklassen: Ein MyFitnessPal-CSV-Export lässt sich direkt importieren, samt aller Eigenheiten, sodass die Jahre, die du schon erfasst hast, mitkommen. Alles, was du danach aufzeichnest, kannst du jederzeit als CSV exportieren.",
                "Die Funktionen, die MyFitnessPal nach und nach hinter Premium gepackt hat — Barcode-Scan, Makros aufs Gramm genau, keine Werbung — sind hier einfach enthalten. Du wägst nicht eine kostenlose Stufe gegen ein Upgrade für 20 $ im Monat ab; es gibt eine kostenlose, quelloffene Stufe, und das einzige Konto, das du brauchst, ist das Claude- oder ChatGPT-Konto, das du schon hast.",
            ],
        },
        importSection: {
            title: "Bring das Tagebuch mit",
            body: [
                "Jahre erfasster Historie sind der eigentliche Grund, warum Leute bleiben, und du musst sie nicht aufgeben. Bitte um den Import, und im Chat öffnet sich ein Importer-Panel: Du wählst die CSV, die MyFitnessPal exportiert, sie wird in deinem Browser geparst, die erkannten Spalten werden für dich zugeordnet, und du siehst, was hinzugefügt wird, bevor etwas geschrieben wird. Diese Zuordnung deckt Kalorien, Protein, Kohlenhydrate und Fett ab, plus Ballaststoffe, Gesamtzucker und Koffein in Milligramm, wo dein Export diese Spalten enthält. Die Zeilen laufen nie durch die KI, es gibt also nichts, was sie vertippen könnte.",
                'Ein MyFitnessPal-Export wird namentlich erkannt, Eigenheiten inklusive. Die Datei kommt mit einem Byte Order Mark an, der sonst die erste Spaltenüberschrift beschädigen würde; ihre Notizen können Zeilenumbrüche innerhalb einer in Anführungszeichen gesetzten Zelle enthalten, was naives Zeilen-Splitten zusammen mit jeder folgenden Zeile zerfetzen würde; und jeder Tagesblock endet mit einer Summenzeile, die keinesfalls zu einer Mahlzeit werden darf. Am wichtigsten: MyFitnessPal exportiert eine aggregierte Zeile pro Mahlzeit und Tag und überhaupt keine Lebensmittel-Spalte, daher werden diese Zeilen nicht wegen fehlender Beschreibung abgelehnt, sondern anhand ihrer Form erkannt und nach ihrem Platz benannt — sie kommen als „Frühstück (importiert aus MyFitnessPal)" an.',
                "Daten werden bestätigt, nicht angenommen. Eine Spalte mit 05.06.2024 ist tatsächlich nicht eindeutig entscheidbar — Mai oder Juni —, daher zeigt dir der Importer seine Lesart neben einer echten Zeile aus deiner eigenen Datei und lässt dich vor dem Schreiben korrigieren. Und jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein erneuter Lauf derselben Datei diese Mahlzeiten als bereits erfasst meldet, statt sie zu verdoppeln. Importier einen Teil-Export, entdeck eine falsch zugeordnete Spalte und mach es einfach noch einmal.",
            ],
        },
        importFaq:
            "Ja. Bitte um den Import deiner Historie, und im Chat öffnet sich ein Importer: Du wählst die CSV, die MyFitnessPal exportiert, sie wird in deinem Browser geparst statt von der KI gelesen, du ordnest oder bestätigst die Spalten, siehst eine Vorschau, was hinzugefügt wird, und bestätigst. Kalorien, Protein, Kohlenhydrate und Fett kommen mit, ebenso Ballaststoffe, Gesamtzucker und Koffein, wenn dein Export sie enthält. MyFitnessPals Export wird namentlich erkannt — einschließlich seines Byte Order Mark, seiner abschließenden Summenzeilen und der Tatsache, dass er eine aggregierte Zeile pro Mahlzeit und Tag ohne Lebensmittelnamen schreibt, die nach Mahlzeiten-Platz benannt werden. Ein erneuter Import derselben Datei erzeugt nie Duplikate.",
        extraFaqs: [
            {
                q: "Kann Nutrition MCP Barcodes scannen wie MyFitnessPal Premium?",
                a: "Ja, und zwar kostenlos. Schick den Barcode eines Produkts, und Nutrition MCP holt die Etikett-Makros von Open Food Facts — während MyFitnessPal seinen Barcode-Scanner hinter ein kostenpflichtiges Premium-Abo verschoben hat.",
            },
            {
                q: "Wie funktioniert das Erfassen ohne MyFitnessPals Lebensmitteldatenbank?",
                a: 'Du beschreibst, was du gegessen hast, in normaler Sprache — „eine Chicken-Burrito-Bowl mit extra Reis" —, und deine KI schätzt Kalorien und Makros. Es gibt keine Datenbank mit Millionen crowdgesourcter Einträge zu durchsuchen und kein Raten, welcher stimmt.',
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Kein MCP-Server. Sieh dir den kostenlosen, konversationellen Weg an, Kalorien und Makros in deiner KI zu erfassen.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Erfassen durch Durchsuchen der Datenbank, Eintrag für Eintrag",
            "Manche Funktionen erfordern einen kostenpflichtigen Gold-Plan",
            "Eine separate App, die du jedes Mal öffnen musst, wenn du isst",
        ],
        note: "Cronometer ist hervorragend, wenn du tiefe Mikronährstoff-Präzision willst. Nutrition MCP verfolgt einen leichteren, konversationellen Ansatz für Kalorien, Makros und Gewicht — direkt in deiner KI.",
        migrate: {
            title: "Wenn Genauigkeit der ganze Punkt ist",
            body: [
                "Cronometer hat sich seinen Ruf mit Präzision verdient — kuratierte Datenbanken und Tracking für über 80 Mikronährstoffe, Vitamine und Mineralstoffe inklusive. Wenn dich diese Mikronährstoff-Tiefe zum Öffnen bewegt, sei ehrlich zu dir selbst: Konversationelle Schätzungen kommen an einen laborgenauen Datenbankeintrag nicht Gramm für Gramm heran.",
                "Aber die meisten Leute erfassen, um Kalorien und Makros im Rahmen zu halten, nicht um ihre Selen-Zufuhr zu prüfen. Dieser Rahmen ist breiter, als er klingt: Neben Protein, Kohlenhydraten und Fett bekommst du Ballaststoffe, Gesamtzucker und Koffein in Milligramm sowie optional Alkohol in Gramm Ethanol, sobald du ihn aktivierst. Dafür ist es weit weniger Aufwand, deiner KI eine Mahlzeit zu beschreiben, als jede Zutat zu suchen und zu wiegen — und du bekommst trotzdem kostenlos Tagessummen, Trends und ein Zielgewicht, an dem du dich orientieren kannst.",
                'Es gibt auch einen Mittelweg: Weil du dich in einem KI-Assistenten befindest, kannst du nach dem Mikronährstoff-Blickwinkel fragen, wenn du ihn wirklich willst — „wie viel Eisen und B12 waren ungefähr in den heutigen Mahlzeiten?" — und bekommst eine begründete Schätzung auf Abruf, ohne den Aufwand, jedes Gramm die restliche Zeit in einen kuratierten Eintrag einzutragen.',
            ],
        },
        importSection: {
            title: "Zehn Jahre Einträge, erhalten",
            body: [
                "Präzision ist der Grund, warum du Cronometer benutzt hast, also wäre ein schlampiger Import schlimmer als gar keiner. Bitte um den Import, und im Chat öffnet sich ein Panel: Du wählst deine Cronometer-CSV, sie wird in deinem Browser geparst, und du bestätigst eine Vorschau, bevor auch nur eine Zeile geschrieben wird. Die Zahlen werden direkt aus der Datei gelesen — die KI sieht die Zeilen nie, sie kann also keine runden oder vertippen.",
                'Cronometers Export-Form wird namentlich erkannt. Er trennt den Zeitstempel in eigene Datums- und Zeitspalten, und beide werden gelesen, sodass ein um 07:12 erfasstes Frühstück seine Uhrzeit behält, statt auf einer Standard-Mittagszeit zu landen. Er schreibt eine Menge mit der Einheit in derselben Zelle — „58,00 g", „1,00 cup" —, und ein so geschriebener Wert liest sich weiterhin als die Zahl, die er ist, statt als nichts. Und er wiederholt die Überschrift „Amount" mehrfach, daher werden Spalten nach Position statt nach Namen zugeordnet: Die Duplikate können nicht stillschweigend kollidieren, und der Mapper zeigt dir, auf welche du gerade zeigst.',
                'Sei dir klar darüber, was hinüberkommt: Datum und Uhrzeit, Lebensmittelname, Mahlzeit, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein und Notizen. Cronometer ist der einzige Export in dieser Liste, der eine Spalte „Caffeine (mg)" mitbringt, und sie landet als Milligramm — die Einheit, in der sie ohnehin ist und in der Koffein hier gespeichert wird, es wird also nichts umgerechnet. Eine in Gramm überschriebene Koffein-Spalte bleibt stattdessen unzugeordnet, mit sichtbarem Grund, statt 0,18 zu erfassen, wo das Etikett 180 mg sagt. Zucker meint Gesamtzucker, Obst und Milch eingeschlossen — nicht zugesetzten Zucker, den kein Export zuverlässig mitführt. Cronometers separate Spalte „Sugar Alcohols" ist ein Zuckeralkohol und weder Zucker noch Ethanol, sie kann in keinem der beiden Felder landen. Alkohol ist ein Sonderfall: Cronometer exportiert ihn als Ethylalkohol in Gramm, und er kommt nur mit, wenn du die Alkohol-Erfassung hier vorher aktiviert hast, denn sie ist ausgeschaltet, bis du das tust. Portionsmengen und Cronometers über 80 Vitamine und Mineralstoffe kommen überhaupt nicht mit — diese Mikronährstoff-Tiefe bleibt in Cronometers eigenem Export. Ein erneuter Import ist unschädlich: Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein zweiter Lauf derselben Datei die Mahlzeiten als bereits erfasst meldet, statt sie doppelt hinzuzufügen.',
            ],
        },
        importFaq:
            'Ja. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst deine Cronometer-CSV, sie wird in deinem Browser geparst statt von der KI gelesen, und du bestätigst eine Vorschau, bevor etwas hinzugefügt wird. Cronometers Export wird namentlich erkannt — seine getrennten Datums- und Zeitspalten werden beide gelesen, und seine wiederholte Überschrift „Amount" kann nicht kollidieren, weil Spalten nach Position zugeordnet werden. Datum und Uhrzeit, Lebensmittelname, Mahlzeit, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein in Milligramm und Notizen kommen mit; Alkohol auch, aber nur, wenn du die Alkohol-Erfassung vorher eingeschaltet hast. Vitamine, Mineralstoffe und Portionsmengen nicht. Ein erneuter Import derselben Datei erzeugt nie Duplikate.',
        extraFaqs: [
            {
                q: "Erfasst Nutrition MCP Mikronährstoffe wie Cronometer?",
                a: "Nein. Cronometers Tracking von über 80 Vitaminen und Mineralstoffen ist seine Spezialität, und Nutrition MCP hat überhaupt keine Mikronährstoffdaten — kein Natrium, keine Vitamine. Was es erfasst, sind Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein in Milligramm, optional Alkohol, Wasser und Gewicht. Du kannst deine KI trotzdem nach einer groben Mikronährstoff-Einschätzung zu einer Mahlzeit fragen, aber wenn laborgenaue Mikronährstoff-Tiefe unverzichtbar ist, ist Cronometer die bessere Wahl.",
            },
            {
                q: "Ist Nutrition MCP so genau wie Cronometer?",
                a: "Für Kalorien, Makros, Ballaststoffe und Zucker sind konversationelle Schätzungen für die meisten Ziele genau genug — aber sie kommen an Cronometers kuratierte, aufs Gramm genaue Datenbank nicht heran. Es tauscht ein wenig Präzision gegen deutlich weniger Erfassungsaufwand, was für die meisten Leute der richtige Tausch ist.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Kein MCP-Server. Erfass Mahlzeiten stattdessen im Gespräch mit Claude oder ChatGPT — kostenlos.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Jedes Lebensmittel von Hand suchen und erfassen",
            "Manche Funktionen, wie Foto-Erfassung, brauchen einen Bezahl-Plan",
            "Noch eine App, noch ein Konto, Werbung in der kostenlosen Stufe",
        ],
        note: "Lose It! ist ein freundlicher Kalorienzähler. Nutrition MCP macht dasselbe Kern-Erfassen per Gespräch, kostenlos, ohne Claude oder ChatGPT je zu verlassen.",
        migrate: {
            title: "Dieselbe Einfachheit, minus die App",
            body: [
                "Lose It! hat Menschen mit leichtem, etwas spielerischem Kalorienzählen überzeugt, mit seiner Snap-It-Foto-Erfassung als Hauptkniff. Nutrition MCP kann den Foto-Trick auch — schick ein Bild deines Tellers, und deine KI liest es — nur dass es in dem Assistenten lebt, mit dem du schon chattest, es gibt also keine separate App zu öffnen.",
                "Wenn dir an Lose It! die reibungsarme Erfassung und das schnelle Tages-Feedback gefallen haben, fühlst du dich hier zu Hause: Sag, was du gegessen hast, bekomm deine verbleibenden Kalorien und Makros zurück, und mach weiter. Keine Werbung, kein Upselling, kein Konto zu jonglieren.",
                "Das Einzige, worauf du verzichtest, ist die Serien-und-Abzeichen-Schicht, mit der Lose It! dich zum Wiederkommen bewegt. Wenn dich diese Gamification motiviert, ist das ein fairer Grund zu bleiben. Wenn es sich immer wie Nebengeräusch über dem eigentlichen Erfassen angefühlt hat, wirst du es nicht vermissen — die Tageszahl steht direkt im Chat, sobald du fragst.",
            ],
        },
        importSection: {
            title: "Deine erfassten Tage kommen auch mit",
            body: [
                "Wechseln heißt nicht, bei null anzufangen. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst die CSV, die Lose It! exportiert, sie wird in deinem Browser geparst, die erkannten Spalten ordnen sich selbst zu — Datum, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate und Fett, plus Ballaststoffe, Gesamtzucker und Koffein, wo dein Export sie enthält —, und du bestätigst eine Vorschau, was hinzugefügt wird. Es ist eine Dateiauswahl und eine Vorschau, keine Diktatübung — auf diesem Weg liest oder tippt die KI deine Zeilen nie ab.",
                'Zwei Lose-It!-Besonderheiten werden gezielt behandelt. Sein Export trägt ein Gelöscht-Flag, und als gelöscht markierte Zeilen werden übersprungen statt importiert: Diese zurückzubringen würde absichtlich entferntes Essen wiederbeleben, und keine Summe in der Vorschau würde das aufdecken. Außerdem schreibt er den wörtlichen String „n/a" für Zellen ohne Wert, was als leer gelesen wird statt als Null — ein nie erfasster Makro bleibt also abwesend, statt als echte 0 g erfasst zu werden und deine Durchschnitte nach unten zu ziehen.',
                "Führ es so oft aus, wie du willst. Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein wiederholter Import derselben Datei die Mahlzeiten als bereits erfasst meldet und nichts hinzufügt. Und wenn sich die Daten in deinem Export auf zwei Arten lesen lassen — 05/06 als Mai oder Juni —, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei und bittet dich, sie vor dem Schreiben zu bestätigen.",
            ],
        },
        importFaq:
            'Ja. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst die CSV, die Lose It! exportiert, sie wird in deinem Browser geparst statt von der KI gelesen, und du bestätigst eine Vorschau, bevor etwas geschrieben wird. Datum, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate und Fett ordnen sich selbst zu, ebenso Ballaststoffe, Gesamtzucker und Koffein, wenn dein Export sie enthält. Lose It!s Export wird namentlich erkannt — als gelöscht markierte Zeilen werden übersprungen statt wiederbelebt, und seine „n/a"-Zellen werden als leer gelesen statt als Nullen. Ein erneuter Import derselben Datei erzeugt nie Duplikate.',
        extraFaqs: [
            {
                q: "Hat Nutrition MCP Foto-Erfassung wie Lose It!s Snap It?",
                a: "Ja — schick ein Foto deines Tellers, und deine KI identifiziert das Essen und schätzt die Makros, dann erfasst sie es, nachdem du bestätigst. In Lose It! steckt Foto-Erfassung hinter einem Bezahl-Plan; mit Nutrition MCP ist es kostenlos und funktioniert direkt im Chat.",
            },
            {
                q: "Kann ich genauso Kalorien zählen wie in Lose It!?",
                a: "Ja. Der Kern-Ablauf ist identisch — sag, was du gegessen hast, und bekomm sofort deine verbleibenden Kalorien und Makros zurück. Der Unterschied ist, dass du mit deiner KI redest statt dich durch eine App zu tippen, und es gibt unterwegs keine Werbung oder Upsells.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Nur im Abo und kein MCP-Server. Sieh dir die kostenlose Alternative an, die in deiner KI lebt.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Ein kostenpflichtiges Abo nach der kostenlosen Testphase (keine kostenlose Stufe)",
            "Du öffnest weiterhin eine separate App, um jede Mahlzeit zu erfassen",
            "Sein adaptives Coaching ist das Produkt, nicht müheloses Erfassen",
        ],
        note: "MacroFactors adaptives TDEE-Coaching ist wirklich gut. Wenn du hauptsächlich schnelles, kostenloses Makro-Erfassen in deiner KI willst, ist Nutrition MCP eine einfachere, kostenlose Lösung.",
        migrate: {
            title: "Coaching versus Erfassen",
            body: [
                "MacroFactors Verkaufsargument ist sein Algorithmus: Er beobachtet deine erfasste Aufnahme und dein Gewicht und berechnet still jede Woche deine Kalorien- und Makro-Ziele neu — wirklich cleveres, adaptives Coaching vom Stronger-By-Science-Team. Dieses Coaching ist das Produkt, weshalb es nur im Abo erhältlich ist.",
                'Nutrition MCP betreibt keinen Coaching-Algorithmus — aber weil du dich schon in einem KI-Assistenten befindest, kannst du einfach fragen. „Sollte ich meine Kalorien anpassen, angesichts der letzten drei Wochen?" liefert dir eine begründete Antwort auf Abruf. Es ist ein anderes Modell: Analyse, wenn du sie willst, im Gespräch, statt einer festen wöchentlichen Neuberechnung — und es ist kostenlos.',
                "Der ehrliche Kompromiss ist Disziplin gegen Flexibilität. MacroFactors wöchentliche Neuberechnung passiert, egal ob du daran denkst zu fragen, was dich ehrlich hält; das Gesprächsmodell passt sich nur an, wenn du danach fragst. Wenn du einen Algorithmus ohne Zutun willst, der deine Zahlen steuert, ist MacroFactor das Abo wert. Wenn du lieber kostenlos erfasst und Analyse ziehst, wenn es dich interessiert, passt das hier besser.",
            ],
        },
        importSection: {
            title: "Das Protokoll zieht um, auch wenn das Coaching nicht mitkommt",
            body: [
                "Was du zurücklassen würdest, ist der Algorithmus, nicht die Daten. Bitte um den Import, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen MacroFactor-CSV-Export, er wird in deinem Browser geparst, die erkannten Spalten werden für dich zugeordnet, und du bestätigst eine Vorschau, bevor etwas geschrieben wird. Die Zeilen laufen nie durch die KI, es kann also nichts auf dem Weg falsch übertragen werden.",
                'MacroFactors Export wird namentlich erkannt — seine Portionsgrößen-Spalte ist der Verräter —, und seine Spalten für Datum, Lebensmittel, Mahlzeit, Kalorien und Makros ordnen sich selbst zu, Ballaststoffe, Gesamtzucker und Koffein eingeschlossen, wo die Datei sie enthält. Meldet dein Export Energie in Kilojoule statt Kilokalorien, wird das umgerechnet, statt 4,184-mal zu hoch gespeichert zu werden. Weil eine Spalte, die einfach „Calories" heißt, beide Einheiten enthalten kann, wird die Einheit als Kontrolle neben einem durchgerechneten Beispiel aus deiner eigenen ersten Zeile angeboten, du bestätigst sie also, statt dich auf eine Vermutung zu verlassen, die jeden Tag stillschweigend aufblasen würde.',
                'Diese Historie ist sofort nützlich, nicht nur archiviert. Sobald Wochen an Aufnahme und Gewicht vorliegen, kannst du die Frage stellen, die MacroFactors Algorithmus nach Plan beantwortet hat — „sollte ich meine Kalorien anpassen, angesichts der letzten drei Wochen?" — und bekommst eine begründete Antwort auf Abruf. Ein zweiter Import derselben Datei ändert nichts, denn jede Zeile trägt einen Inhalts-Fingerabdruck, und Wiederholungen kommen als bereits erfasst gemeldet zurück.',
            ],
        },
        importFaq:
            "Ja. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst deinen MacroFactor-CSV-Export, er wird in deinem Browser geparst statt von der KI gelesen, und du bestätigst eine Vorschau, bevor etwas geschrieben wird. MacroFactors Export wird namentlich erkannt — Datum, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate und Fett ordnen sich selbst zu, zusammen mit Ballaststoffen, Gesamtzucker und Koffein, wenn die Datei sie enthält —, und meldet er Energie in Kilojoule, wird das in Kilokalorien umgerechnet, sobald du die Einheit neben einem Beispiel aus deiner eigenen Datei bestätigst. Ein erneuter Import derselben Datei erzeugt nie Duplikate.",
        extraFaqs: [
            {
                q: "Passt Nutrition MCP meine Kalorienziele an wie MacroFactor?",
                a: 'Nicht automatisch. MacroFactors wöchentliche, algorithmische Neuberechnung ist sein kostenpflichtiges Kernfeature. Mit Nutrition MCP fragst du — „sollte ich meine Kalorien anpassen, basierend auf den letzten drei Wochen Aufnahme und Gewicht?" —, und deine KI denkt auf Abruf durch, statt eines festen wöchentlichen Updates.',
            },
            {
                q: "Ist Nutrition MCP wirklich kostenlos, wenn MacroFactor nur im Abo erhältlich ist?",
                a: "Ja. Nutrition MCP ist komplett kostenlos und quelloffen, ohne Testphase-dann-Bezahlen und ohne Limits in einer kostenlosen Stufe — anders als MacroFactor, das keine kostenlose Stufe hat und nach seiner Testphase ein Abo erfordert. Du brauchst nur ein Claude- oder ChatGPT-Konto.",
            },
        ],
        freeAnswer:
            "Ja. Nutrition MCP ist komplett kostenlos und quelloffen, ohne Abo — während MacroFactor nach seiner kostenlosen Testphase ein kostenpflichtiges Abo erfordert. Du brauchst nur ein Claude- oder ChatGPT-Konto, um dich zu verbinden.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Kein MCP-Server. Erfasse Mahlzeiten und Makros im Gespräch — kostenlos und quelloffen.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Für jedes erfasste Lebensmittel die Datenbank durchsuchen",
            "Manche Funktionen, wie Ernährungspläne, brauchen einen Bezahl-PRO-Plan",
            "Eine separate App und ein Konto zu verwalten",
        ],
        note: "Yazio ist ein ausgereifter Tracker mit guten Ernährungsplänen. Nutrition MCP konzentriert sich auf müheloses konversationelles Erfassen direkt in Claude oder ChatGPT — kostenlos und quelloffen.",
        migrate: {
            title: "Pläne auf der einen Seite, Erfassen auf der anderen",
            body: [
                "Yazio kombiniert Tracking mit strukturierten Ernährungsplänen, Rezepten und Fasten-Tools, poliert für ein europäisches Publikum. Wenn ein geführter Plan dich auf Kurs hält, macht Yazio das gut, und Nutrition MCP versucht das gar nicht erst — es ist keine Ernährungsplan-App.",
                "Was es tut, ist die Erfassungs-Hälfte mühelos zu machen. Statt Yazios Datenbank für jede Zutat zu durchsuchen, beschreibst du das Gericht, und deine KI übernimmt die Makros — und beantwortet im selben Atemzug „wie steht's heute bei mir?\". Kombinier es mit welchem Essensplan auch immer du schon befolgst.",
                'Das macht die beiden eigentlich komplementär statt konkurrierend. Folg weiter einem Yazio-Plan, oder jedem Plan, für die „was esse ich"-Seite; nutze Nutrition MCP für die „bin ich auf Kurs geblieben"-Seite, im Gespräch erfasst und kostenlos. Der einzige Ort, an dem es nicht hilft, sind Fasten-Timer — das ist Yazios Terrain, nicht das eines Ernährungsprotokolls.',
            ],
        },
        importSection: {
            title: "Bring das Protokoll mit, ordne die Spalten zu",
            body: [
                "Deine Yazio-Historie kann mitkommen, auch wenn du etwas Arbeit selbst erledigst. Bitte um den Import, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen CSV-Export, er wird in deinem Browser geparst, und du zeigst seine Spalten selbst auf Datum, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein. Vier App-Exporte — MyFitnessPal, Cronometer, Lose It! und MacroFactor — werden anhand ihrer Spaltennamen erkannt; Yazio gehört nicht dazu, rechne also damit, diese Zuordnung einmal einzurichten. Alles danach läuft gleich: eine Vorschau, was hinzugefügt wird, dann deine Bestätigung.",
                "Die europäischen Eigenheiten, an denen die meisten Importer scheitern, werden behandelt. Eine Semikolon-getrennte Datei, deren Zahlen Komma-Dezimalstellen verwenden — die Form, die Excel in einer deutschen oder österreichischen Locale erzeugt —, wird korrekt gelesen, statt dass das Trennzeichen für ein Dezimaltrennzeichen gehalten oder jeder Makro-Wert um das Tausendfache verzerrt wird. Die Überschriften, die der Mapper kennt, sind auch nicht nur englisch: Ein deutscher Export mit Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker und Koffein wird vollständig erkannt, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet — fibra, sucres, zuccheri, suikers, cafeína, caffeina —, sodass eine lokalisierte Datei oft schon teilweise zugeordnet ankommt und dir weniger Spalten von Hand bleiben. In Anführungszeichen gesetzte Felder, Zeilenumbrüche innerhalb einer Zelle, halbleere Werte und vereinzelte Summenzeilen werden ebenfalls behandelt, und die KI liest die Datei nie, es kann also keine Zahl unterwegs vertippt werden.",
                "Daten und Energie werden bestätigt statt geraten. Eine Spalte im Format TT.MM.JJJJ wird tagesbasiert gelesen, und wo die Werte sich tatsächlich nicht eindeutig klären lassen — 05/06 als Mai oder Juni —, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei, damit du sie korrigieren kannst. Ist die Energiespalte in Kilojoule, wird sie in Kilokalorien umgerechnet, mit der Einheit als Kontrolle neben einem durchgerechneten Beispiel. Ein erneuter Import derselben Datei fügt nichts hinzu: Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass Wiederholungen als bereits erfasst zurückkommen.",
            ],
        },
        importFaq:
            "Ja, mit manueller Spaltenzuordnung. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst deinen Yazio-CSV-Export, er wird in deinem Browser geparst statt von der KI gelesen, und du zeigst seine Spalten selbst auf Datum, Lebensmittel, Mahlzeit, Kalorien und Makros — Ballaststoffe, Gesamtzucker und Koffein eingeschlossen. Yazio gehört nicht zu den vier Exporten, die per Spaltenname erkannt werden, diese Zuordnung ist also ein einmaliger manueller Schritt, auch wenn Überschriften, die der Mapper schon kennt (auf Deutsch, und für Ballaststoffe, Zucker und Koffein auch auf Spanisch, Französisch, Italienisch und Niederländisch), sich von selbst ausfüllen. Semikolon-getrennte europäische Dateien mit Komma-Dezimalstellen, Daten im Format TT.MM.JJJJ und Kilojoule werden alle behandelt, und ein erneuter Import derselben Datei erzeugt nie Duplikate.",
        extraFaqs: [
            {
                q: "Enthält Nutrition MCP Ernährungspläne wie Yazio PRO?",
                a: "Nein. Yazios strukturierte Ernährungspläne, Rezepte und Fasten-Tools sind seine Stärke, und Nutrition MCP versucht nicht, sie zu ersetzen — es übernimmt die Erfassungs-Hälfte. Viele Leute folgen weiter ihrem Yazio- (oder jedem anderen) Plan und erfassen hier einfach kostenlos dagegen.",
            },
            {
                q: "Kann ich Mahlzeiten schneller erfassen als mit Yazios Datenbanksuche?",
                a: 'Meistens ja. Statt Yazios Datenbank für jede Zutat zu durchsuchen und Portionen einzustellen, beschreibst du das fertige Gericht einmal — „eine Schüssel Müsli mit Joghurt und Beeren" —, und deine KI schätzt und erfasst die Makros in einem einzigen Schritt.',
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Kein MCP-Server. Ein schlankerer, kostenloser Weg, Essen in Claude oder ChatGPT zu erfassen.",
        cons: [
            "Kein MCP-Server — läuft nicht in Claude oder ChatGPT",
            "Lebensmittel durch Durchsuchen der Datenbank einzeln erfassen",
            "Manche Funktionen, wie Diätpläne, brauchen einen Bezahl-Plan",
            "Noch eine App und ein Abo zu verwalten",
        ],
        note: "Lifesum kombiniert Tracking mit strukturierten Diätplänen. Nutrition MCP ist ein schlankerer, kostenloser Weg, Kalorien, Makros und Gewicht zu erfassen, indem du mit deiner KI sprichst.",
        migrate: {
            title: "Bewertungen, die du einfach erfragen kannst",
            body: [
                "Lifesum setzt auf Struktur und Feedback — Diätpläne, Rezepte und sein Lebensmittelbewertungssystem, das benotet, was du isst. Nutrition MCP benotet dein Essen nicht mit einem Abzeichen, wenn dich also diese Bewertungsschleife motiviert, hat Lifesum dort einen Vorteil.",
                'Der Tausch ist Flexibilität: Statt einer festen Bewertung kannst du deine KI fragen „ist das eine gute Wahl für meine Ziele?" und bekommst eine echte, kontextbezogene Antwort. Erfassen ist ein einziger Satz, Trends und ein Zielgewicht sind eingebaut, und es gibt keine Premium-Stufe, die die nützlichen Teile versperrt.',
                'Ein Abzeichen sagt dir, dass ein Lebensmittel 3 von 5 Punkten bekommen hat; ein Gespräch sagt dir, warum, und was du dagegen tun kannst — „tausch die Hälfte des Reises gegen Gemüse, dann passt das in deinen Tag." Das ist der Unterschied zwischen einer Punktzahl und einem Coach, und weil Lifesum Diätpläne und Teile des Trackings hinter Premium packt, ist Nutrition MCP von beiden die kostenlose Option.',
            ],
        },
        importSection: {
            title: "Nichts abzutippen",
            body: [
                "Den Tracker zu wechseln heißt, deine Historie umzuziehen, und du musst keine Zeile davon abtippen. Bitte um den Import, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen Lifesum-CSV-Export, er wird in deinem Browser geparst, und du zeigst seine Spalten auf Datum, Lebensmittel, Mahlzeit, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker und Koffein. Lifesums Überschriften werden nicht namentlich erkannt, wie es bei MyFitnessPal, Cronometer, Lose It! und MacroFactor der Fall ist, diese Zuordnung ist also ein einmaliger manueller Schritt — danach siehst du eine Vorschau, was hinzugefügt wird, und bestätigst.",
                "Nichts versteckt sich hinter einer Annahme. Der Mapper zeigt dir deine eigene Datei — ihre echten Überschriften, echten Zellen und eine laufende Zählung der Zeilen, die erstellt werden — sodass eine falsch ausgerichtete Spalte sichtbar wird, bevor etwas geschrieben wird, statt hinterher entdeckt zu werden. In Anführungszeichen gesetzte Felder, Zeilenumbrüche innerhalb einer Zelle, halbleere Werte und Summenzeilen werden alle behandelt, und weil die Datei in deinem Browser gelesen wird, sieht die KI nie eine Zeile, die sie vertippen könnte.",
                "Europäische Exporte sind abgedeckt: Eine Semikolon-getrennte Datei mit Komma-Dezimalstellen wird korrekt gelesen, Daten im Format TT.MM.JJJJ werden umgewandelt, sobald du die Reihenfolge bestätigt hast, und Kilojoule werden zu Kilokalorien, mit der Einheit neben einem durchgerechneten Beispiel aus deiner eigenen ersten Zeile. Lokalisierte Überschriften helfen ebenfalls — ein deutscher Export mit Kalorien, Kohlenhydrate, Ballaststoffe oder Koffein füllt sich von selbst aus, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet —, die manuelle Zuordnung ist also meist kürzer, als es klingt. Führ den Import zweimal aus, und nichts verdoppelt sich — jede Zeile trägt einen Inhalts-Fingerabdruck, sodass Wiederholungen als bereits erfasst gemeldet werden.",
            ],
        },
        importFaq:
            "Ja, mit manueller Spaltenzuordnung. Bitte um den Import, und im Chat öffnet sich ein Importer: Du wählst deinen Lifesum-CSV-Export, er wird in deinem Browser geparst statt von der KI gelesen, und du zeigst seine Spalten auf Datum, Lebensmittel, Mahlzeit, Kalorien und Makros — Ballaststoffe, Gesamtzucker und Koffein eingeschlossen. Lifesum gehört nicht zu den vier Exporten, die per Spaltenname erkannt werden, diese Zuordnung ist also ein einmaliger manueller Schritt, auch wenn Überschriften, die der Mapper schon kennt, sich von selbst ausfüllen. Semikolon-getrennte europäische Dateien mit Komma-Dezimalstellen, Daten im Format TT.MM.JJJJ und Kilojoule werden alle behandelt, und ein erneuter Import derselben Datei erzeugt nie Duplikate.",
        extraFaqs: [
            {
                q: "Bewertet Nutrition MCP mein Essen wie Lifesums Lebensmittelbewertungen?",
                a: 'Nein — es gibt kein Abzeichen und keine numerische Punktzahl. Stattdessen kannst du deine KI fragen „ist das eine gute Wahl für meine Ziele?" und bekommst eine kontextbezogene Antwort, die die Abwägungen erklärt, statt einer festen Bewertung des Lebensmittels selbst.',
            },
            {
                q: "Ist Nutrition MCP kostenlos, ohne einen Lifesum-Premium-artigen Plan?",
                a: "Ja. Nutrition MCP ist komplett kostenlos und quelloffen, ohne Premium-Stufe — während Lifesum Diätpläne und manche Tracking-Funktionen hinter ein Premium-Abo packt. Du brauchst nur ein Claude- oder ChatGPT-Konto, um dich zu verbinden.",
            },
        ],
    },
};

// German translation of src/copy/alternatives.ts's per-app AppCopy. See that
// file's header for the accuracy rules (which apps' exports are recognised
// by column name vs. need manual mapping, sniffed-then-confirmed dates and
// units, browser-side parsing) that still apply to this content — only the
// language changed, not the factual claims about the importer.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_DE: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Kein offizieller MCP-Server, und manche Funktionen gibt es nur im Bezahl-Abo. Sieh dir die kostenlose Chat-Alternative an.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Für jedes Lebensmittel die Datenbank durchsuchen und den richtigen Eintrag finden",
            "Manche Funktionen wie der Barcode-Scanner brauchen ein Bezahl-Abo",
            "Eine separate App mit eigenem Konto, in der Gratisversion mit Werbung",
        ],
        note: "MyFitnessPal ist eine starke App mit einer riesigen Lebensmitteldatenbank. Das ist keine Kritik – nur ein anderer Ansatz für alle, die lieber mit ihrer KI reden, als sich durch einen Tracker zu tippen.",
        migrate: {
            title: "Die Datenbank hinter dir lassen",
            body: [
                "MyFitnessPal ist mit einer der größten Lebensmitteldatenbanken überhaupt groß geworden – zig Millionen Einträge aus der Community. Genau diese Größe macht sie aber auch mühsam: Bei jedem Lebensmittel scrollst du an Beinahe-Duplikaten vorbei und musst raten, welcher Eintrag stimmt. Im Gespräch zu erfassen spart dir die Suche komplett – du beschreibst das Essen, und deine KI schätzt die Makros.",
                "Dein Tagebuch musst du dafür nicht zurücklassen: Ein CSV-Export von MyFitnessPal lässt sich direkt importieren, samt aller Eigenheiten, sodass die Jahre, die du schon erfasst hast, mitkommen. Alles, was du ab dann erfasst, kannst du jederzeit als CSV exportieren.",
                "Die Funktionen, die MyFitnessPal nach und nach ins Premium-Abo verschoben hat – Barcode-Scan, Makros in Gramm, keine Werbung –, sind hier einfach dabei. Du wägst nicht eine Gratisversion gegen ein Upgrade für 20 $ im Monat ab: Es gibt nur eine Version, kostenlos und Open Source – neu ist nur die kostenlose Anmeldung beim ersten Verbinden.",
            ],
        },
        importSection: {
            title: "MyFitnessPal-Tagebuch per CSV importieren",
            body: [
                "Jahre an Einträgen sind der eigentliche Grund, warum man bleibt – und die musst du nicht aufgeben. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer-Panel: Du wählst die CSV-Datei, die MyFitnessPal exportiert, sie wird in deinem Browser eingelesen, die erkannten Spalten werden automatisch zugeordnet, und du siehst, was dazukommt, bevor etwas gespeichert wird. Diese Zuordnung umfasst Kalorien, Protein, Kohlenhydrate und Fett sowie Ballaststoffe, Gesamtzucker und Koffein in Milligramm, sofern dein Export diese Spalten enthält. Die Zeilen laufen nie durch die KI – sie kann also nichts vertippen.",
                "Ein MyFitnessPal-Export wird anhand seiner Spaltennamen erkannt, Eigenheiten inklusive. Die Datei beginnt mit einem Byte Order Mark, das sonst die erste Spaltenüberschrift verfälschen würde; ihre Notizen können Zeilenumbrüche innerhalb einer Zelle in Anführungszeichen enthalten – ein simples Aufteilen nach Zeilen würde solche Notizen zerstückeln und jede folgende Zeile gleich mit; und jeder Tagesblock endet mit einer Summenzeile, die auf keinen Fall zur Mahlzeit werden darf. Am wichtigsten: MyFitnessPal exportiert pro Mahlzeit und Tag eine zusammengefasste Zeile und überhaupt keine Spalte mit Lebensmittelnamen. Statt diese Zeilen wegen fehlender Beschreibung abzulehnen, erkennt der Importer ihre Form und benennt sie nach der jeweiligen Mahlzeit – sie kommen als „Frühstück (importiert aus MyFitnessPal)“ an.",
                "Datumsangaben werden bestätigt, nicht einfach angenommen. Eine Spalte mit 05/06/2024 lässt sich tatsächlich nicht eindeutig lesen – Mai oder Juni? –, deshalb zeigt dir der Importer seine Lesart neben einer echten Zeile aus deiner eigenen Datei, und du kannst sie vor dem Speichern korrigieren. Außerdem trägt jede Zeile einen Inhalts-Fingerabdruck: Importierst du dieselbe Datei noch einmal, werden diese Mahlzeiten als bereits erfasst gemeldet statt verdoppelt – solange sich deine Zeitzone zwischendurch nicht geändert hat. Teil-Export importiert und dann eine falsch zugeordnete Spalte entdeckt? Mach es einfach noch einmal.",
            ],
        },
        importFaq:
            "Ja. Sag, dass du deinen Verlauf importieren willst, und im Chat öffnet sich ein Importer: Du wählst die CSV-Datei, die MyFitnessPal exportiert, sie wird in deinem Browser eingelesen statt von der KI gelesen, du ordnest die Spalten zu oder bestätigst sie, prüfst in der Vorschau, was dazukommt, und bestätigst. Kalorien, Protein, Kohlenhydrate und Fett werden übernommen, ebenso Ballaststoffe, Gesamtzucker und Koffein, wenn dein Export sie enthält. Der Export von MyFitnessPal wird anhand seiner Spaltennamen erkannt – samt Byte Order Mark, Summenzeilen am Ende und der Eigenheit, pro Mahlzeit und Tag eine zusammengefasste Zeile ohne Lebensmittelnamen zu schreiben; diese Zeilen werden nach der jeweiligen Mahlzeit benannt. Ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Kann Nutrition MCP Barcodes scannen wie MyFitnessPal Premium?",
                a: "Ja, und zwar kostenlos. Schick den Barcode eines Produkts, und Nutrition MCP holt die Makros laut Etikett von Open Food Facts – MyFitnessPal dagegen hat seinen Barcode-Scanner ins kostenpflichtige Premium-Abo verschoben.",
            },
            {
                q: "Wie funktioniert das Erfassen ohne die Lebensmitteldatenbank von MyFitnessPal?",
                a: "Du beschreibst in eigenen Worten, was du gegessen hast – „eine Chicken-Burrito-Bowl mit extra Reis“ –, und deine KI schätzt Kalorien und Makros. Du musst keine Datenbank mit Millionen Community-Einträgen durchsuchen und nicht raten, welcher stimmt.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Kein offizieller MCP-Server. So erfasst du Kalorien und Makros kostenlos im Gespräch mit deiner KI.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Erfassen per Datenbanksuche, Eintrag für Eintrag",
            "Manche Funktionen gibt es nur mit dem kostenpflichtigen Gold-Abo",
            "Eine separate App, die du bei jeder Mahlzeit öffnen musst",
        ],
        note: "Cronometer ist hervorragend, wenn du Mikronährstoffe ganz genau im Blick haben willst. Nutrition MCP geht Kalorien, Makros und Gewicht leichter an – im Gespräch, direkt in deiner KI.",
        migrate: {
            title: "Wenn es dir vor allem auf Genauigkeit ankommt",
            body: [
                "Cronometer hat sich seinen Ruf mit Präzision verdient – kuratierte Datenbanken und Tracking für über 80 Mikronährstoffe, Vitamine und Mineralstoffe inklusive. Wenn du die App genau wegen dieser Mikronährstoff-Tiefe öffnest, sei ehrlich zu dir: Schätzungen im Gespräch kommen nicht Gramm für Gramm an einen laborgenauen Datenbankeintrag heran.",
                "Die meisten erfassen aber, um Kalorien und Makros im Rahmen zu halten, nicht um ihre Selenzufuhr zu kontrollieren. Und dieser Rahmen ist breiter, als er klingt: Neben Protein, Kohlenhydraten und Fett bekommst du Ballaststoffe, Gesamtzucker und Koffein in Milligramm sowie optional Alkohol in Gramm reinen Alkohols, wenn du ihn einschaltest. Dafür ist es viel weniger Aufwand, deiner KI eine Mahlzeit zu beschreiben, als jede Zutat zu suchen und abzuwiegen – und Tagessummen, Trends und ein Zielgewicht bekommst du trotzdem, kostenlos.",
                "Es gibt auch einen Mittelweg: Weil du ohnehin in einem KI-Assistenten bist, kannst du nach den Mikronährstoffen fragen, wenn es dich wirklich interessiert – „Wie viel Eisen und B12 hatten meine Mahlzeiten heute ungefähr?“ – und bekommst auf Abruf eine begründete Schätzung, ohne den Rest der Zeit jedes Gramm einem kuratierten Eintrag zuzuordnen.",
            ],
        },
        importSection: {
            title: "Zehn Jahre Einträge – nichts geht verloren",
            body: [
                "Präzision ist der Grund, warum du Cronometer genutzt hast – ein schlampiger Import wäre also schlimmer als keiner. Sag, dass du importieren willst, und im Chat öffnet sich ein Panel: Du wählst deine Cronometer-CSV, sie wird in deinem Browser eingelesen, und du gibst eine Vorschau frei, bevor auch nur eine Zeile gespeichert wird. Die Zahlen kommen direkt aus der Datei – die KI sieht die Zeilen nie, kann also keinen Wert runden oder falsch abtippen.",
                "Das Exportformat von Cronometer wird anhand der Spaltennamen erkannt. Es verteilt den Zeitstempel auf getrennte Datums- und Uhrzeitspalten, und beide werden gelesen – ein um 07:12 erfasstes Frühstück behält also seine Uhrzeit, statt standardmäßig auf 12 Uhr mittags gesetzt zu werden. Es schreibt Menge und Einheit in dieselbe Zelle – „58.00 g“, „1.00 cup“ –, und ein so geschriebener Wert wird trotzdem als die Zahl gelesen, die er ist, statt als gar nichts. Und es wiederholt die Überschrift „Amount“ mehrmals, deshalb werden Spalten nach Position statt nach Namen zugeordnet: Die Duplikate können nicht unbemerkt kollidieren, und die Zuordnung zeigt dir, welche du gerade auswählst.",
                "Damit klar ist, was übernommen wird: Datum und Uhrzeit, Lebensmittelname, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein und Notizen. Cronometer ist der einzige Export in dieser Liste mit einer Spalte „Caffeine (mg)“, und sie wird in Milligramm übernommen – der Einheit, in der sie schon vorliegt und in der Koffein hier gespeichert wird; umgerechnet wird also nichts. Eine Koffein-Spalte mit Gramm in der Überschrift bleibt dagegen unzugeordnet, mit sichtbarer Begründung, statt 0,18 zu erfassen, wo auf dem Etikett 180 mg stehen. Zucker heißt Gesamtzucker, inklusive Zucker aus Obst und Milch – nicht zugesetzter Zucker, den kein Export zuverlässig enthält. Cronometers separate Spalte „Sugar Alcohols“ steht für Zuckeralkohole (Polyole), also weder Zucker noch Ethanol, und kann in keinem der beiden Felder landen. Alkohol ist ein Sonderfall: Cronometer exportiert ihn als Ethylalkohol in Gramm, und er wird nur übernommen, wenn du die Alkohol-Erfassung hier vorher eingeschaltet hast – bis dahin ist sie aus. Portionsmengen und Cronometers über 80 Vitamine und Mineralstoffe werden gar nicht übernommen – diese Mikronährstoff-Tiefe bleibt in Cronometers eigenem Export. Ein erneuter Import schadet nicht: Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein zweiter Durchlauf derselben Datei die Mahlzeiten als bereits erfasst meldet, statt sie doppelt anzulegen – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
            ],
        },
        importFaq:
            "Ja. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst deine Cronometer-CSV, sie wird in deinem Browser eingelesen statt von der KI gelesen, und du prüfst in der Vorschau, was dazukommt, bevor du bestätigst. Der Export von Cronometer wird anhand seiner Spaltennamen erkannt – die getrennten Datums- und Uhrzeitspalten werden beide gelesen, und die wiederholte Überschrift „Amount“ kann nicht kollidieren, weil Spalten nach Position zugeordnet werden. Übernommen werden Datum und Uhrzeit, Lebensmittelname, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein in Milligramm und Notizen; Alkohol ebenfalls, aber nur, wenn du die Alkohol-Erfassung vorher eingeschaltet hast. Vitamine, Mineralstoffe und Portionsmengen nicht. Ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Erfasst Nutrition MCP Mikronährstoffe wie Cronometer?",
                a: "Nein. Das Tracking von über 80 Vitaminen und Mineralstoffen ist Cronometers Spezialität, und Nutrition MCP hat überhaupt keine Mikronährstoffdaten – kein Natrium, keine Vitamine. Erfasst werden Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Gesamtzucker, Koffein in Milligramm, optional Alkohol, Wasser und Gewicht. Du kannst deine KI trotzdem um eine grobe Mikronährstoff-Einschätzung zu einer Mahlzeit bitten – aber wenn du auf laborgenaue Mikronährstoff-Tiefe angewiesen bist, ist Cronometer die bessere Wahl.",
            },
            {
                q: "Ist Nutrition MCP so genau wie Cronometer?",
                a: "Nein. Werte aus dem Gespräch sind KI-Schätzungen und kommen nicht an Cronometers kuratierte, grammgenaue Datenbank heran – sie können falsch sein, prüf also alles, worauf es ankommt. Bei verpackten Lebensmitteln nutzt ein Barcode-Abruf stattdessen die Etikettdaten von Open Food Facts, die allerdings ebenfalls nicht geprüft sind. Du tauschst etwas Präzision gegen deutlich weniger Aufwand beim Erfassen.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Kein offizieller MCP-Server. Erfass deine Mahlzeiten stattdessen im Gespräch mit Claude oder ChatGPT – kostenlos.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Jedes Lebensmittel von Hand suchen und eintragen",
            "Manche Funktionen wie unbegrenzte Foto-Erfassung mit Snap It brauchen ein Bezahl-Abo",
            "Noch eine App, noch ein Konto, Werbung in der Gratisversion",
        ],
        note: "Lose It! ist ein sympathischer Kalorienzähler. Nutrition MCP erledigt das Wesentliche – das Erfassen – im Gespräch, kostenlos und ohne dass du Claude oder ChatGPT je verlässt.",
        migrate: {
            title: "Genauso einfach – nur ohne App",
            body: [
                "Lose It! hat viele mit leichtem, ein bisschen spielerischem Kalorienzählen überzeugt, allen voran mit der Foto-Erfassung Snap It. Den Foto-Trick kann Nutrition MCP auch – schick ein Bild deines Tellers, und deine KI liest es –, nur läuft es in dem Assistenten, mit dem du sowieso chattest. Eine separate App musst du also nicht öffnen.",
                "Wenn dir an Lose It! das unkomplizierte Erfassen und das schnelle Feedback zum Tag gefallen haben, fühlst du dich hier gleich zu Hause: Sag, was du gegessen hast, sieh deine verbleibenden Kalorien und Makros und mach weiter. Keine Werbung, kein Upselling.",
                "Verzichten musst du nur auf die Serien und Abzeichen, mit denen Lose It! dich zum Wiederkommen bringt. Wenn dich diese Gamification motiviert, ist das ein guter Grund zu bleiben. Hat sie sich für dich eher wie Ablenkung vom eigentlichen Erfassen angefühlt, wirst du sie nicht vermissen – die Tageszahl steht direkt im Chat, sobald du fragst.",
            ],
        },
        importSection: {
            title: "Deine erfassten Tage nimmst du mit",
            body: [
                "Wechseln heißt nicht, bei null anzufangen. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst die CSV-Datei, die Lose It! exportiert, sie wird in deinem Browser eingelesen, und die erkannten Spalten werden automatisch zugeordnet – Datum, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate und Fett sowie Ballaststoffe, Gesamtzucker und Koffein, sofern dein Export sie enthält. Dann bestätigst du in der Vorschau, was dazukommt. Eine Dateiauswahl und eine Vorschau, kein Diktat – auf diesem Weg liest oder tippt die KI deine Zeilen nie ab.",
                "Zwei Besonderheiten von Lose It! werden gezielt behandelt. Der Export enthält eine Markierung für gelöschte Einträge, und so markierte Zeilen werden übersprungen statt importiert: Sonst kämen Lebensmittel zurück, die du absichtlich entfernt hast, und keine Summe in der Vorschau würde das verraten. Außerdem steht in Zellen ohne Wert die Zeichenfolge „n/a“, die als leer gelesen wird statt als Null – ein Makrowert, den du nie erfasst hast, fehlt also weiterhin, statt als echte 0 g gespeichert zu werden und deine Durchschnitte nach unten zu ziehen.",
                "Führ den Import so oft aus, wie du willst. Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass ein wiederholter Import derselben Datei die Mahlzeiten als bereits erfasst meldet und nichts hinzufügt – solange sich deine Zeitzone zwischendurch nicht geändert hat. Und wenn sich die Datumsangaben in deinem Export auf zwei Arten lesen lassen – 05/06 als Mai oder Juni –, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei und lässt dich bestätigen, bevor er etwas speichert.",
            ],
        },
        importFaq:
            "Ja. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst die CSV-Datei, die Lose It! exportiert, sie wird in deinem Browser eingelesen statt von der KI gelesen, und du bestätigst eine Vorschau, bevor etwas gespeichert wird. Datum, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate und Fett werden automatisch zugeordnet, ebenso Ballaststoffe, Gesamtzucker und Koffein, wenn dein Export sie enthält. Der Export von Lose It! wird anhand seiner Spaltennamen erkannt – als gelöscht markierte Zeilen werden übersprungen statt wiederhergestellt, und Zellen mit „n/a“ werden als leer gelesen statt als Null. Ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Kann Nutrition MCP Mahlzeiten per Foto erfassen wie Snap It von Lose It!?",
                a: "Ja – schick ein Foto deines Tellers, und deine KI erkennt das Essen, schätzt die Makros und erfasst die Mahlzeit, sobald du die Details bestätigt hast. Lose It! begrenzt Snap It in der Gratisversion und schaltet die unbegrenzte Nutzung erst mit Premium frei; bei Nutrition MCP kostet die Foto-Erfassung nichts extra und funktioniert direkt im Chat – in jeder KI-App, die Bilder lesen kann.",
            },
            {
                q: "Kann ich Kalorien genauso zählen wie mit Lose It!?",
                a: "Ja. Der Ablauf ist im Kern derselbe – sag, was du gegessen hast, und sieh sofort deine verbleibenden Kalorien und Makros. Der Unterschied: Du redest mit deiner KI, statt dich durch eine App zu tippen, und unterwegs gibt es weder Werbung noch Upgrade-Hinweise.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Nur im Abo und ohne offiziellen MCP-Server. Sieh dir die kostenlose Alternative an, die direkt in deiner KI läuft.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Nach der Testphase ein kostenpflichtiges Abo (keine Gratisversion)",
            "Für jede Mahlzeit öffnest du weiterhin eine separate App",
            "Das Produkt ist das adaptive Coaching, nicht müheloses Erfassen",
        ],
        note: "MacroFactors adaptives TDEE-Coaching ist wirklich gut. Wenn du vor allem schnell und kostenlos Makros in deiner KI erfassen willst, ist Nutrition MCP die einfachere, kostenlose Lösung.",
        migrate: {
            title: "Coaching oder Erfassen",
            body: [
                "MacroFactors Verkaufsargument ist sein Algorithmus: Er wertet aus, was du an Ernährung und Gewicht erfasst, und berechnet im Hintergrund jede Woche deine Kalorien- und Makroziele neu – wirklich cleveres, adaptives Coaching vom Team hinter Stronger By Science. Dieses Coaching ist das Produkt, deshalb gibt es MacroFactor nur im Abo.",
                "Nutrition MCP hat keinen Coaching-Algorithmus – aber weil du ohnehin in einem KI-Assistenten bist, kannst du einfach fragen. Auf „Sollte ich meine Kalorien anpassen, wenn ich mir die letzten drei Wochen ansehe?“ bekommst du auf Abruf die Einschätzung deiner KI zu deinen eigenen erfassten Werten – eine Schätzung zum Abwägen, keine Ernährungsberatung. Das ist ein anderes Modell: Auswertung, wann du sie willst, im Gespräch statt als feste wöchentliche Neuberechnung – und kostenlos.",
                "Ehrlich gesagt ist es ein Tausch: Disziplin gegen Flexibilität. MacroFactors wöchentliche Neuberechnung läuft, ob du daran denkst zu fragen oder nicht – das hält dich bei der Stange. Das Gesprächsmodell passt sich nur an, wenn du es ansprichst. Willst du einen Algorithmus, der deine Zahlen ohne dein Zutun steuert, ist MacroFactor das Abo wert. Erfasst du lieber kostenlos und holst dir Auswertungen, wann immer du willst, passt das hier besser.",
            ],
        },
        importSection: {
            title: "Das Coaching bleibt zurück, deine Einträge ziehen um",
            body: [
                "Zurücklassen würdest du den Algorithmus, nicht deine Daten. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen CSV-Export aus MacroFactor, er wird in deinem Browser eingelesen, die erkannten Spalten werden automatisch zugeordnet, und du bestätigst eine Vorschau, bevor etwas gespeichert wird. Die Zeilen laufen nie durch die KI, unterwegs kann also nichts falsch übertragen werden.",
                "Der Export von MacroFactor wird anhand seiner Spaltennamen erkannt – die Spalte für die Portionsgröße ist das Erkennungsmerkmal –, und die Spalten für Datum, Lebensmittel, Mahlzeitentyp, Kalorien und Makros werden automatisch zugeordnet, samt Ballaststoffen, Gesamtzucker und Koffein, sofern die Datei sie enthält. Gibt dein Export die Energie in Kilojoule statt Kilokalorien an, wird umgerechnet, statt 4,184-mal zu hohe Werte zu speichern. Weil eine Spalte, die einfach „Calories“ heißt, beide Einheiten enthalten kann, wird dir die Einheit zur Auswahl angeboten, neben einem durchgerechneten Beispiel aus deiner eigenen ersten Zeile – du bestätigst sie also, statt dich auf eine Vermutung zu verlassen, die unbemerkt jeden Tag aufblähen würde.",
                "Dieser Verlauf ist sofort nützlich, nicht bloß archiviert. Sobald einige Wochen Ernährung und Gewicht erfasst sind, kannst du die Frage stellen, die MacroFactors Algorithmus nach festem Zeitplan beantwortet hat – „Sollte ich meine Kalorien anpassen, wenn ich mir die letzten drei Wochen ansehe?“ –, und bekommst auf Abruf die Einschätzung deiner KI zu deinen eigenen Werten: eine Schätzung, keine Ernährungsberatung. Ein zweiter Import derselben Datei ändert nichts, denn jede Zeile trägt einen Inhalts-Fingerabdruck, und Wiederholungen werden als bereits erfasst gemeldet – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
            ],
        },
        importFaq:
            "Ja. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst deinen CSV-Export aus MacroFactor, er wird in deinem Browser eingelesen statt von der KI gelesen, und du bestätigst eine Vorschau, bevor etwas gespeichert wird. Der Export von MacroFactor wird anhand seiner Spaltennamen erkannt – Datum, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydrate und Fett werden automatisch zugeordnet, ebenso Ballaststoffe, Gesamtzucker und Koffein, wenn die Datei sie enthält –, und gibt er die Energie in Kilojoule an, wird sie in Kilokalorien umgerechnet, sobald du die Einheit neben einem Beispiel aus deiner eigenen Datei bestätigst. Ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Passt Nutrition MCP meine Kalorienziele an wie MacroFactor?",
                a: "Nicht automatisch. Die wöchentliche Neuberechnung per Algorithmus ist MacroFactors kostenpflichtige Kernfunktion. Bei Nutrition MCP fragst du – „Sollte ich meine Kalorien anpassen, wenn ich mir Ernährung und Gewicht der letzten drei Wochen ansehe?“ –, und deine KI denkt es auf Abruf durch, statt dir ein festes wöchentliches Update zu liefern.",
            },
            {
                q: "Ist Nutrition MCP wirklich kostenlos, wenn es MacroFactor nur im Abo gibt?",
                a: "Ja. Nutrition MCP ist komplett kostenlos und Open Source – keine Testphase mit anschließender Bezahlung, keine Einschränkungen in einer Gratisversion. MacroFactor dagegen hat keine Gratisversion und verlangt nach der Testphase ein Abo. Du brauchst eine KI-App mit MCP-Unterstützung, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden mit Google oder mit E-Mail und Passwort anlegst.",
            },
        ],
        freeAnswer:
            "Ja. Nutrition MCP ist komplett kostenlos und Open Source, ganz ohne Abo – MacroFactor dagegen verlangt nach der kostenlosen Testphase ein kostenpflichtiges Abo. Du brauchst eine KI-App mit MCP-Unterstützung, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden mit Google oder mit E-Mail und Passwort anlegst.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Kein offizieller MCP-Server. Erfasse Mahlzeiten und Makros im Gespräch – kostenlos und Open Source.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Jedes Lebensmittel, das du erfasst, in der Datenbank suchen",
            "Manche Funktionen wie Ernährungspläne gibt es nur mit dem kostenpflichtigen PRO-Abo",
            "Noch eine App und ein Konto, die du verwalten musst",
        ],
        note: "Yazio ist ein ausgereifter Tracker mit guten Ernährungsplänen. Nutrition MCP konzentriert sich auf müheloses Erfassen im Gespräch, direkt in Claude oder ChatGPT – kostenlos und Open Source.",
        migrate: {
            title: "Pläne hier, Erfassen dort",
            body: [
                "Yazio verbindet Tracking mit strukturierten Ernährungsplänen, Rezepten und Fasten-Tools, ganz auf ein europäisches Publikum zugeschnitten. Wenn dich ein geführter Plan auf Kurs hält, macht Yazio das gut – und Nutrition MCP versucht es gar nicht erst: Es ist keine App für Ernährungspläne.",
                "Was es dagegen kann: das Erfassen mühelos machen. Statt Yazios Datenbank für jede Zutat zu durchsuchen, beschreibst du das Gericht, und deine KI kümmert sich um die Makros – und beantwortet im selben Atemzug „Wie sieht’s heute bei mir aus?“. Kombinier es mit jedem Ernährungsplan, dem du schon folgst.",
                "Damit ergänzen sich die beiden eher, als dass sie konkurrieren. Folge für das „Was esse ich?“ weiter einem Yazio-Plan oder jedem anderen Plan; nutze Nutrition MCP für das „Bin ich auf Kurs geblieben?“ – erfasst im Gespräch und kostenlos. Nur bei Fasten-Timern hilft es nicht – das ist Yazios Terrain, nicht das eines Ernährungstagebuchs.",
            ],
        },
        importSection: {
            title: "Tagebuch mitnehmen, Spalten zuordnen",
            body: [
                "Dein Yazio-Verlauf kann mitkommen, auch wenn du dafür ein wenig selbst Hand anlegst. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen CSV-Export, er wird in deinem Browser eingelesen, und du ordnest seine Spalten selbst Datum, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydraten, Fett, Ballaststoffen, Gesamtzucker und Koffein zu. Die Exporte von vier Apps – MyFitnessPal, Cronometer, Lose It! und MacroFactor – werden an ihren Spaltennamen erkannt; Yazio gehört nicht dazu, du richtest die Zuordnung also einmal selbst ein. Alles Weitere läuft gleich: eine Vorschau, was dazukommt, dann deine Bestätigung.",
                "Die europäischen Eigenheiten, an denen die meisten Importer scheitern, sind abgedeckt. Eine Datei mit Semikolon als Trennzeichen und Komma als Dezimalzeichen – so, wie Excel sie mit deutschen oder österreichischen Regionaleinstellungen erzeugt –, wird korrekt gelesen: Das Trennzeichen wird weder für ein Dezimalzeichen gehalten, noch wird jeder Makrowert um das Tausendfache verzerrt. Die Überschriften, die der Importer kennt, sind auch nicht nur englisch: Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker und Koffein aus einem deutschen Export werden alle erkannt, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet – fibra, sucres, zuccheri, suikers, cafeína, caffeina –, sodass eine lokalisierte Datei oft schon teilweise zugeordnet ankommt und dir weniger Spalten von Hand bleiben. Felder in Anführungszeichen, Zeilenumbrüche innerhalb einer Zelle, halb leere Werte und vereinzelte Summenzeilen werden ebenfalls behandelt, und die KI liest die Datei nie – unterwegs kann also keine Zahl vertippt werden.",
                "Datum und Energie werden bestätigt statt geraten. Eine Spalte im Format TT.MM.JJJJ wird mit dem Tag zuerst gelesen, und wo die Werte es wirklich nicht klären – 05/06 kann Mai oder Juni sein –, zeigt dir der Importer seine Lesart neben einer Zeile aus deiner eigenen Datei, damit du sie korrigieren kannst. Steht die Energie in Kilojoule, wird sie in Kilokalorien umgerechnet, und die Einheit wird dir zur Auswahl neben einem durchgerechneten Beispiel angezeigt. Ein erneuter Import derselben Datei fügt nichts hinzu: Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass Wiederholungen als bereits erfasst zurückkommen – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
            ],
        },
        importFaq:
            "Ja, mit manueller Spaltenzuordnung. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst deinen Yazio-CSV-Export, er wird in deinem Browser eingelesen statt von der KI gelesen, und du ordnest seine Spalten selbst Datum, Lebensmittel, Mahlzeitentyp, Kalorien und Makros zu – Ballaststoffe, Gesamtzucker und Koffein eingeschlossen. Yazio gehört nicht zu den vier Exporten, die an ihren Spaltennamen erkannt werden, die Zuordnung ist also ein einmaliger manueller Schritt – Überschriften, die der Importer schon kennt (auf Deutsch sowie für Ballaststoffe, Zucker und Koffein auch auf Spanisch, Französisch, Italienisch und Niederländisch), füllen sich aber von selbst aus. Europäische Dateien mit Semikolon als Trennzeichen und Komma als Dezimalzeichen, Datumsangaben im Format TT.MM.JJJJ und Kilojoule werden alle behandelt, und ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Bietet Nutrition MCP Ernährungspläne wie Yazio PRO?",
                a: "Nein. Yazios strukturierte Ernährungspläne, Rezepte und Fasten-Tools sind seine Stärke, und Nutrition MCP versucht nicht, sie zu ersetzen – es übernimmt das Erfassen. Viele folgen weiter ihrem Yazio-Plan (oder einem anderen) und halten hier einfach kostenlos fest, was sie tatsächlich essen.",
            },
            {
                q: "Erfasse ich Mahlzeiten schneller als mit der Datenbanksuche von Yazio?",
                a: "Meistens ja. Statt für jede Zutat Yazios Datenbank zu durchsuchen und Portionen einzustellen, beschreibst du das fertige Gericht einmal – „eine Schüssel Müsli mit Joghurt und Beeren“ –, und deine KI schätzt und erfasst die Makros in einem Schritt.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Kein offizieller MCP-Server. Ein schlankerer, kostenloser Weg, dein Essen in Claude oder ChatGPT zu erfassen.",
        cons: [
            "Kein offizieller MCP-Server – dein Tagebuch lässt sich nicht aus Claude oder ChatGPT führen",
            "Lebensmittel einzeln per Datenbanksuche erfassen",
            "Manche Funktionen wie Diätpläne brauchen ein Bezahl-Abo",
            "Noch eine App und noch ein Abo, die du verwalten musst",
        ],
        note: "Lifesum verbindet Tracking mit strukturierten Diätplänen. Nutrition MCP ist ein schlankerer, kostenloser Weg, Kalorien, Makros und Gewicht zu erfassen – indem du mit deiner KI sprichst.",
        migrate: {
            title: "Bewertungen? Frag einfach nach",
            body: [
                "Lifesum setzt auf Struktur und Feedback – Diätpläne, Rezepte und ein Bewertungssystem, das dein Essen benotet. Nutrition MCP bewertet dein Essen nicht mit Abzeichen; wenn dich diese Bewertungen motivieren, hat Lifesum hier die Nase vorn.",
                "Dafür bekommst du Flexibilität: Statt einer festen Bewertung fragst du deine KI „Ist das eine gute Wahl für meine Ziele?“ und bekommst eine echte Antwort im Kontext. Erfassen ist ein einziger Satz, Trends und Zielgewicht sind eingebaut, und es gibt keine Premium-Version, die die nützlichen Teile sperrt.",
                "Ein Abzeichen sagt dir, dass ein Lebensmittel 3 von 5 Punkten bekommen hat; im Gespräch erfährst du, warum – im Kontext deiner eigenen Einträge: „Tausch die Hälfte des Reises gegen Gemüse, dann passt das in deinen Tag.“ Und weil Lifesum Diätpläne und Teile des Trackings ins Premium-Abo packt, ist Nutrition MCP von beiden die kostenlose Option.",
            ],
        },
        importSection: {
            title: "Kein Abtippen nötig",
            body: [
                "Ein Trackerwechsel heißt: Dein Verlauf zieht mit um – und du musst keine Zeile davon abtippen. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer-Panel: Du wählst deinen Lifesum-CSV-Export, er wird in deinem Browser eingelesen, und du ordnest seine Spalten Datum, Lebensmittel, Mahlzeitentyp, Kalorien, Protein, Kohlenhydraten, Fett, Ballaststoffen, Gesamtzucker und Koffein zu. Lifesums Überschriften werden nicht am Namen erkannt wie die von MyFitnessPal, Cronometer, Lose It! und MacroFactor, die Zuordnung ist also ein einmaliger manueller Schritt – danach prüfst du in der Vorschau, was dazukommt, und bestätigst.",
                "Nichts versteckt sich hinter einer Annahme. Die Zuordnung zeigt dir deine eigene Datei – ihre echten Überschriften, echten Zellen und laufend die Zahl der Zeilen, die angelegt werden –, sodass du eine falsch zugeordnete Spalte siehst, bevor etwas gespeichert wird, statt sie erst hinterher zu entdecken. Felder in Anführungszeichen, Zeilenumbrüche innerhalb einer Zelle, halb leere Werte und Summenzeilen werden alle behandelt, und weil die Datei in deinem Browser eingelesen wird, sieht die KI keine einzige Zeile, die sie vertippen könnte.",
                "Europäische Exporte sind abgedeckt: Eine Datei mit Semikolon als Trennzeichen und Komma als Dezimalzeichen wird korrekt gelesen, Datumsangaben im Format TT.MM.JJJJ werden umgewandelt, sobald du die Reihenfolge bestätigt hast, und Kilojoule werden zu Kilokalorien – mit der Einheit neben einem durchgerechneten Beispiel aus deiner eigenen ersten Zeile. Lokalisierte Überschriften helfen ebenfalls: Kalorien, Kohlenhydrate, Ballaststoffe oder Koffein aus einem deutschen Export werden von selbst zugeordnet, und Ballaststoffe, Zucker und Koffein werden auch auf Spanisch, Französisch, Italienisch und Niederländisch zugeordnet – die manuelle Zuordnung geht also meist schneller, als es klingt. Führ den Import zweimal aus, und nichts verdoppelt sich: Jede Zeile trägt einen Inhalts-Fingerabdruck, sodass Wiederholungen als bereits erfasst gemeldet werden – solange sich deine Zeitzone zwischendurch nicht geändert hat.",
            ],
        },
        importFaq:
            "Ja, mit manueller Spaltenzuordnung. Sag, dass du importieren willst, und im Chat öffnet sich ein Importer: Du wählst deinen Lifesum-CSV-Export, er wird in deinem Browser eingelesen statt von der KI gelesen, und du ordnest seine Spalten selbst Datum, Lebensmittel, Mahlzeitentyp, Kalorien und Makros zu – Ballaststoffe, Gesamtzucker und Koffein eingeschlossen. Lifesum gehört nicht zu den vier Exporten, die an ihren Spaltennamen erkannt werden, die Zuordnung ist also ein einmaliger manueller Schritt – Überschriften, die der Importer schon kennt, füllen sich aber von selbst aus. Europäische Dateien mit Semikolon als Trennzeichen und Komma als Dezimalzeichen, Datumsangaben im Format TT.MM.JJJJ und Kilojoule werden alle behandelt, und ein erneuter Import derselben Datei erzeugt keine Duplikate, solange sich deine Zeitzone zwischendurch nicht geändert hat.",
        extraFaqs: [
            {
                q: "Bewertet Nutrition MCP mein Essen wie die Lebensmittelbewertungen von Lifesum?",
                a: "Nein – es gibt keine Abzeichen und keine Punktzahl. Stattdessen kannst du deine KI fragen: „Ist das eine gute Wahl für meine Ziele?“ – und bekommst eine Antwort im Kontext, die die Vor- und Nachteile erklärt, statt einer festen Bewertung des Lebensmittels selbst.",
            },
            {
                q: "Ist Nutrition MCP kostenlos, ganz ohne Premium-Abo wie bei Lifesum?",
                a: "Ja. Nutrition MCP ist komplett kostenlos und Open Source, ohne Premium-Version – Lifesum dagegen packt Diätpläne und manche Tracking-Funktionen in ein Premium-Abo. Du brauchst eine KI-App mit MCP-Unterstützung, etwa Claude oder ChatGPT, und ein kostenloses Nutrition-MCP-Konto, das du beim ersten Verbinden mit Google oder mit E-Mail und Passwort anlegst.",
            },
        ],
    },
};

// German /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcut's name, its menu items
// (Sync now, Status, Disconnect) and the automation input `auto` stay in
// English: one shared shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_DE: AppleHealthDoc = {
    meta: {
        title: "Synchronisierung mit Apple Health",
        description:
            "Richte den kostenlosen Kurzbefehl Nutrition MCP Health auf deinem iPhone ein: Er überträgt die Tagessummen, die du im Chat mit deiner KI erfasst (Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Koffein und auf Wunsch Wasser), in Apple Health.",
        ogDescription:
            "Übertrage die Tagessummen, die du mit deiner KI erfasst, mit einem kostenlosen iPhone-Kurzbefehl in Apple Health.",
    },
    tocLabel: "Auf dieser Seite",
    hero: {
        eyebrow: "Synchronisierung mit Apple Health · iPhone",
        title: "Deine Tagessummen in Apple Health",
        lead: "Ein kostenloser iPhone-Kurzbefehl überträgt die Summen jedes abgeschlossenen Tages von Nutrition MCP in Apple Health. Das Erfassen übernimmt weiter deine KI-App; der Kurzbefehl sendet nur Tage, die vorbei sind.",
        seeTitle: "Was du in Apple Health siehst",
        seeItems: [
            "Einen Eintrag pro Nährwert für jeden abgeschlossenen Tag, um <strong>12:00</strong>, von <strong>Kurzbefehle</strong>.",
            "Ein Tag ist um <strong>05:00</strong> am nächsten Morgen in deiner Zeitzone abgeschlossen, gestern kommt also heute nach 05:00 an. Der heutige Tag ist nie dabei.",
        ],
        nutrientsLabel: "Jeden Tag gesendet",
        nutrients: {
            energy_kcal: "Nahrungsenergie",
            protein_g: "Protein",
            carbohydrates_g: "Kohlenhydrate",
            fat_g: "Fett gesamt",
            fiber_g: "Ballaststoffe",
            caffeine_mg: "Koffein",
            water_ml: "Wasser",
        },
        waterNote: "wenn du willst",
        alcoholNote: "Alkohol wird nie gesendet.",
    },
    before: {
        title: "Bevor du anfängst",
        items: [
            "Ein iPhone mit den Apps <strong>Kurzbefehle</strong> und <strong>Health</strong>. Beide sind in iOS enthalten.",
            "Ein Nutrition-MCP-Konto, das bereits mit deiner KI-App verbunden ist, etwa Claude oder ChatGPT. Der Kurzbefehl meldet sich mit genau diesem Konto an.",
            "Empfohlen: deine Zeitzone im Profil, denn sie bestimmt, wo ein Tag endet. Sag einfach <em>&bdquo;Stell meine Zeitzone ein&ldquo;</em> im Chat. Hast du nie eine festgelegt, gilt die Zeitzone, die dein iPhone beim Verbinden meldet.",
        ],
    },
    install: {
        title: "Kurzbefehl installieren",
        lead: "Öffne den Link auf deinem iPhone und tippe auf <strong>Kurzbefehl hinzufügen</strong>. In der Kurzbefehle-App erscheint er als <strong>Nutrition MCP Health</strong>.",
        button: "Kurzbefehl laden",
        pending: "Der Link zum Kurzbefehl wird bald hier veröffentlicht.",
        leadPending:
            "Der Kurzbefehl ist noch nicht veröffentlicht. Sobald er es ist, öffnest du seinen Link auf deinem iPhone und tippst auf <strong>Kurzbefehl hinzufügen</strong>; in der Kurzbefehle-App erscheint er dann als <strong>Nutrition MCP Health</strong>. Die Schritte unten zeigen, wie es danach weitergeht.",
        nameNote:
            "Lass den Namen genau so: <strong>Nutrition MCP Health</strong>. Die Anmeldeseite öffnet den Kurzbefehl unter diesem Namen wieder; benennst du ihn um, bleibt das Verbinden auf halbem Weg stehen.",
    },
    connect: {
        title: "Verbinden",
        steps: [
            "Tippe in der Kurzbefehle-App auf <strong>Nutrition MCP Health</strong>, um ihn auszuführen.",
            "Beantworte zwei Fragen: ob auch <strong>Wasser</strong> gesendet werden soll (lass es aus, wenn deine Apple Watch oder eine andere App Wasser schon erfasst), und welche Tage gesendet werden, <strong>From today</strong> oder <strong>Also the last 7 days</strong>.",
            "Safari öffnet eine Anmeldeseite. Melde dich mit <strong>demselben Konto an wie in deiner KI-App</strong>. Die Seite zeigt einen Hinweis zum Verbinden von Apple Health: Mach nur weiter, wenn du das gerade selbst gestartet hast, über den Kurzbefehl auf deinem eigenen iPhone.",
            "Fragt Safari, ob Kurzbefehle geöffnet werden soll, tippe auf <strong>Öffnen</strong>. Der Kurzbefehl schließt das Verbinden ab.",
            "Wenn zum ersten Mal ein Tag gesendet wird, fragt Apple Health, was Kurzbefehle schreiben darf: Schalte <strong>jede Kategorie</strong> ein und tippe auf <strong>Erlauben</strong>. Hast du <strong>Also the last 7 days</strong> gewählt und an diesen Tagen Mahlzeiten erfasst, passiert das sofort. Sonst gibt es noch nichts zu senden: Öffne morgen nach 05:00 den Kurzbefehl und tippe einmal auf <strong>Sync now</strong>, um die Frage zu beantworten.",
        ],
        note: "Der Anmeldelink funktioniert einmal, 30 Minuten lang. Ist er abgelaufen, führ den Kurzbefehl einfach erneut aus. Dein erster abgeschlossener Tag kommt morgen nach 05:00 an; hast du die letzten 7 Tage gewählt, werden diese sofort gesendet.",
    },
    automate: {
        title: "Automatisch laufen lassen",
        lead: "Ein geteilter Kurzbefehl kann seine Automationen nicht mitbringen. Leg sie deshalb einmal im Tab <strong>Automation</strong> der Kurzbefehle-App an. Die erste ist die wichtige; die anderen holen nach, wenn du Health nicht öffnest.",
        triggersLabel: "Wann er laufen soll",
        triggers: [
            {
                when: "App → Health → Wird geöffnet",
                tag: "Wichtigste",
                body: "Wenn du Health öffnest, willst du genau dann aktuelle Werte sehen.",
            },
            {
                when: "Wecker → Wird gestoppt",
                tag: "Morgendliches Nachholen",
                body: "Ein Wecker, den du nach 05:00 stoppst, etwa dein Wecker am Morgen, sendet gestern, sobald der Tag abgeschlossen ist.",
            },
            {
                when: "Ladegerät → Ist verbunden",
                tag: "Optional",
                body: "Das iPhone nachts oder am Schreibtisch anzuschließen, ist eine weitere Gelegenheit zum Synchronisieren.",
            },
        ],
        stepsLabel: "Für jede davon",
        steps: [
            "Öffne in der Kurzbefehle-App den Tab <strong>Automation</strong> und tippe auf <strong>+</strong>, um eine persönliche Automation zu erstellen.",
            "Wähle den Auslöser, zum Beispiel <strong>App</strong> → <strong>Health</strong> → <strong>Wird geöffnet</strong>.",
            "Wähle <strong>Sofort ausführen</strong> und schalte <strong>Bei Ausführung mitteilen</strong> aus, falls dein iPhone das anbietet.",
            "Füge die Aktion <strong>Kurzbefehl ausführen</strong> hinzu, wähle <strong>Nutrition MCP Health</strong> und setze als Eingabe den Text <code>auto</code>.",
        ],
        note: "Die Eingabe <code>auto</code> hält automatische Ausführungen still: Sie melden sich nur, wenn etwas deine Aufmerksamkeit braucht. Eine genaue Uhrzeit ist nicht nötig: Jede Synchronisierung schaut über die letzten 7 abgeschlossenen Tage zurück, ein verpasster Morgen wird also von selbst nachgeholt.",
    },
    everyday: {
        title: "Im Alltag",
        cards: [
            {
                title: "Etwas vergessen einzutragen?",
                body: "Trag es wie gewohnt im Chat nach. Wurde sein Tag schon gesendet und liegt er innerhalb der letzten 7 Tage, ergänzt die nächste Synchronisierung den Tag mit einem kleinen zusätzlichen Eintrag um 12:01, 12:02 und so weiter. Änderungen unter etwa 20 kcal oder 2 g werden übersprungen; ein sehr großer Sprung oder eine Änderung nach 9 Ergänzungen kommt stattdessen als Mitteilung, damit du sie von Hand einträgst.",
            },
            {
                title: "Eine Mahlzeit gelöscht oder verkleinert?",
                body: "Apple Health kann einen Wert ergänzen, aber nicht verringern. Du bekommst deshalb eine Mitteilung, um wie viel der Tag jetzt zu hoch ist. So behebst du es: Öffne Health → <strong>Entdecken</strong> → <strong>Ernährung</strong>, wähle den Wert, tippe auf <strong>Alle Daten anzeigen</strong> und wisch bei den Einträgen dieses Tages von Kurzbefehle nach links, um sie zu löschen, und trag dann die richtige Summe aus der Mitteilung von Hand ein. Verwende nie <strong>Alle Daten von &bdquo;Kurzbefehle&ldquo; löschen</strong>: Das entfernt auch, was deine anderen Kurzbefehle erfasst haben.",
            },
            {
                title: "Von Hand ausführen",
                body: "Tippe in der Kurzbefehle-App auf <strong>Nutrition MCP Health</strong>, um sein Menü zu öffnen: <strong>Sync now</strong> sendet alles, was ansteht, <strong>Status</strong> zeigt den zuletzt gesendeten Tag und wann der nächste bereit ist, und <strong>Disconnect</strong> beendet die Verbindung.",
            },
            {
                title: "In deiner KI-App nachsehen",
                body: "Bitte deine KI, dein Profil anzuzeigen (<code>get_profile</code>): Dort steht, wann die Synchronisierung verbunden wurde, bis zu welchem Tag sie gesendet hat und wann sie zuletzt lief.",
            },
        ],
    },
    privacy: {
        title: "Datenschutz und Grenzen",
        items: [
            "Unser Server speichert die Verbindung und 8 Tage lang eine Aufzeichnung der gesendeten Summen, damit jeder Tag einmal gesendet und danach nur noch ergänzt wird. Beides ist in deinem Datenexport enthalten.",
            "Der Kurzbefehl bewahrt sein Zugriffstoken in seinem eigenen Speicher in der Kurzbefehle-App auf deinem iPhone auf, nicht in einer Datei, und die Kurzbefehle-App synchronisiert es eventuell über iCloud auf deine anderen Geräte. Wer den Kurzbefehl auf deinen Geräten ausführen kann, kann die Synchronisierung nutzen, bis du sie trennst. Halte ihn also auf Geräten, die nur du nutzt.",
            "Wir senden nichts an Apple. Der Kurzbefehl fragt unseren Server nach deinen Summen und schreibt sie auf deinem iPhone in Health; ab dort gelten deine eigenen Apple-Einstellungen.",
            "Wähle jederzeit <strong>Disconnect</strong>, und die Verbindung samt Aufzeichnung wird sofort gelöscht. Sie endet außerdem von selbst nach 90 Tagen ohne Synchronisierung und 365 Tage nach dem Verbinden. Was schon in Apple Health ist, bleibt dort, bis du es löschst.",
        ],
        policyLink: "Datenschutzerklärung lesen",
    },
    troubleshooting: {
        title: "Fehlerbehebung",
        lead: "Passt etwas nicht zusammen? Diese Antworten decken die üblichen Fälle ab.",
        readMore: "Zur Antwort",
    },
    selfHost: {
        textHtml:
            "Betreibst du deinen eigenen Server? Wie der Kurzbefehl Schritt für Schritt gebaut wird, steht in {link}.",
        linkText: "der Bauanleitung",
    },
};

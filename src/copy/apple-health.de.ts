// German /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcuts' names (Nutrition MCP
// Health, Nutrition MCP Activity), their menu items (Sync now, Status,
// Disconnect) and the automation input `auto` stay in English: one shared
// shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_DE: AppleHealthDoc = {
    meta: {
        title: "Kurzbefehle für Apple Health",
        description:
            "Zwei kostenlose iPhone-Kurzbefehle verbinden Nutrition MCP und Apple Health: Nutrition MCP Health kopiert die Tagessummen, die du mit deiner KI erfasst (Kalorien, Protein, Kohlenhydrate, Fett, Ballaststoffe, Koffein und auf Wunsch Wasser), in Apple Health, und Nutrition MCP Activity bringt deine tägliche Aktive Energie als Aktivkalorien zurück.",
        ogDescription:
            "Tagessummen in Apple Health, Aktive Energie zurück in Nutrition MCP: zwei kostenlose iPhone-Kurzbefehle, einer oder beide.",
    },
    tocLabel: "Auf dieser Seite",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP und Apple Health, in beide Richtungen",
        lead: "Zwei kostenlose iPhone-Kurzbefehle, je einer pro Richtung. Der eine kopiert, was du isst, in Apple Health, der andere bringt die Energie, die du verbrennst, zurück zu Nutrition MCP. Nutze einen oder beide: Beide verbinden sich, synchronisieren und trennen sich von selbst.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Deine Tagessummen in Apple Health",
            items: [
                "Ein Eintrag pro Nährwert für jeden abgeschlossenen Tag, um <strong>12:00</strong>, von <strong>Kurzbefehle</strong>.",
                "Ein Tag ist um <strong>05:00</strong> am nächsten Morgen in deiner Zeitzone abgeschlossen, gestern kommt also heute nach 05:00 an. Der heutige Tag ist nie dabei.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Deine Aktive Energie als Aktivkalorien",
            items: [
                "Deine Summe der <strong>Aktiven Energie</strong> für heute und die 2 Tage davor, neben dem, was du gegessen hast. Dein Kalorienziel ändert sich nie.",
                "Ein Eintrag pro Tag, der bei jeder Synchronisierung ersetzt wird, damit häufiges Synchronisieren nie einen Tag doppelt zählt.",
            ],
        },
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
        readLabel: "Bei jeder Synchronisierung gelesen",
        activeEnergy: "Aktive Energie",
    },
    before: {
        title: "Bevor du anfängst",
        items: [
            "Ein iPhone mit den Apps <strong>Kurzbefehle</strong> und <strong>Health</strong>. Beide sind in iOS enthalten.",
            "Ein Nutrition-MCP-Konto, das bereits mit deiner KI-App verbunden ist, etwa Claude oder ChatGPT. Beide Kurzbefehle melden sich mit genau diesem Konto an.",
            "Empfohlen: deine Zeitzone im Profil, denn sie bestimmt, wo ein Tag endet. Sag einfach <em>&bdquo;Stell meine Zeitzone ein&ldquo;</em> im Chat. Hast du nie eine festgelegt, gilt die Zeitzone, die dein iPhone beim Verbinden meldet.",
        ],
    },
    install: {
        title: "Kurzbefehle installieren",
        lead: "Installiere einen oder beide. Öffne einen Link auf deinem iPhone und tippe auf <strong>Kurzbefehl hinzufügen</strong>; er erscheint in der Kurzbefehle-App unter seinem eigenen Namen.",
        button: "Kurzbefehl laden",
        pending: "Der Link zum Kurzbefehl wird bald hier veröffentlicht.",
        leadPending:
            "Die Kurzbefehle sind noch nicht veröffentlicht. Sobald sie es sind, öffnest du einen Link auf deinem iPhone und tippst auf <strong>Kurzbefehl hinzufügen</strong>; der Kurzbefehl erscheint dann in der Kurzbefehle-App unter seinem eigenen Namen. Die Schritte unten zeigen, was danach kommt.",
        healthBlurb: "Sendet deine Tagessummen an Apple Health.",
        activityBlurb: "Liest deine Aktive Energie aus Apple Health.",
        nameNote:
            "Behalte die Namen genau so: <strong>Nutrition MCP Health</strong> und <strong>Nutrition MCP Activity</strong>. Die Anmeldeseite öffnet jeden Kurzbefehl unter seinem Namen wieder; wird einer umbenannt, bleibt das Verbinden auf halbem Weg stehen.",
    },
    connect: {
        title: "Verbinden",
        steps: [
            "Tippe in der Kurzbefehle-App auf den Kurzbefehl, um ihn auszuführen.",
            "Beantworte seine Fragen (unten), dann öffnet Safari eine Anmeldeseite. Melde dich mit <strong>demselben Konto an, das deine KI-App verwendet</strong>. Die Seite zeigt einen Hinweis zum Verbinden von Apple Health: Mach nur weiter, wenn du das gerade selbst gestartet hast, über den Kurzbefehl auf deinem eigenen iPhone.",
            "Fragt Safari, ob Kurzbefehle geöffnet werden soll, tippe auf <strong>Öffnen</strong>. Der Kurzbefehl schließt das Verbinden ab.",
        ],
        health: {
            label: "Nutrition MCP Health fragt",
            items: [
                "Ob auch <strong>Wasser</strong> gesendet werden soll (lass es aus, wenn deine Apple Watch oder eine andere App Wasser schon erfasst), und welche Tage gesendet werden, <strong>From today</strong> oder <strong>Also the last 7 days</strong>.",
                "Wenn zum ersten Mal ein Tag gesendet wird, fragt Apple Health, was Kurzbefehle schreiben darf: Schalte <strong>jede Kategorie</strong> ein und tippe auf <strong>Erlauben</strong>. Hast du <strong>Also the last 7 days</strong> gewählt und an diesen Tagen Mahlzeiten erfasst, passiert das sofort. Sonst gibt es noch nichts zu senden: Öffne morgen nach 05:00 den Kurzbefehl und tippe einmal auf <strong>Sync now</strong>, um die Frage zu beantworten.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity fragt",
            items: [
                "Nichts vor der Anmeldung, außer einem kurzen Hinweis, was er liest. Seine erste Synchronisierung läuft direkt nach dem Verbinden.",
                "Apple Health fragt, ob Kurzbefehle <strong>Aktive Energie</strong> lesen darf: tippe auf <strong>Erlauben</strong>. Dann fragt iOS, ob der Kurzbefehl Health-Daten an nutrition-mcp.com senden darf: wähle <strong>Immer erlauben</strong>, sonst bleibt jeder automatische Lauf an dieser Frage hängen.",
            ],
        },
        note: "Jeder Anmeldelink funktioniert einmal, 30 Minuten lang. Ist er abgelaufen, führe den Kurzbefehl einfach erneut aus. Verbinde die beiden Kurzbefehle nacheinander, nicht gleichzeitig. Bei Nutrition MCP Health kommt dein erster abgeschlossener Tag morgen nach 05:00 an; hast du die letzten 7 Tage gewählt, werden diese sofort gesendet.",
    },
    automate: {
        title: "Automatisch laufen lassen",
        lead: "Ein geteilter Kurzbefehl kann seine Automationen nicht mitbringen. Leg sie deshalb im Tab <strong>Automation</strong> der Kurzbefehle-App an, für jeden Kurzbefehl, den du nutzt. Der erste Auslöser jedes Kurzbefehls ist der wichtige; die anderen holen nach.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "App → Health → Wird geöffnet",
                tag: "Wichtigste",
                body: "Wenn du Health öffnest, willst du genau dann aktuelle Werte sehen.",
            },
            {
                when: "Wecker → Wird gestoppt",
                tag: "Morgendliches Nachholen",
                body: "Ein Wecker, den du nach 05:00 stoppst, etwa dein Morgenwecker, sendet gestern, sobald der Tag abgeschlossen ist.",
            },
            {
                when: "Ladegerät → Ist verbunden",
                tag: "Optional",
                body: "Das iPhone nachts oder am Schreibtisch anzuschließen, ist eine weitere Gelegenheit zum Synchronisieren.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude oder ChatGPT → Wird geöffnet",
                tag: "Wichtigste",
                body: "Wenn du deine KI-App öffnest, willst du gleich fragen, wie dein Tag läuft. So ist die heutige Verbrennung aktuell, bevor du fragst.",
            },
            {
                when: "App → Health oder Fitness → Wird geöffnet",
                tag: "Außerdem",
                body: "Ein Blick auf deine Ringe oder deine Trainings ist eine weitere Gelegenheit zum Synchronisieren.",
            },
            {
                when: "Tageszeit",
                tag: "Über den Tag verteilt",
                body: "Es gibt keinen Auslöser &bdquo;jede Stunde&ldquo;, also lege ein paar an, zum Beispiel um 12:00, 18:00 und 22:00, um Tage zu erfassen, an denen du keine der beiden Apps öffnest.",
            },
        ],
        stepsLabel: "Für jeden davon",
        steps: [
            "Öffne in der Kurzbefehle-App den Tab <strong>Automation</strong> und tippe auf <strong>+</strong>, um eine persönliche Automation zu erstellen.",
            "Wähle den Auslöser, zum Beispiel <strong>App</strong> → <strong>Health</strong> → <strong>Wird geöffnet</strong>.",
            "Wähle <strong>Sofort ausführen</strong> und schalte <strong>Bei Ausführung benachrichtigen</strong> aus, falls dein iPhone das anbietet.",
            "Füge die Aktion <strong>Kurzbefehl ausführen</strong> hinzu, wähle <strong>Nutrition MCP Health</strong> oder <strong>Nutrition MCP Activity</strong> und setze als Eingabe den Text <code>auto</code>.",
        ],
        note: "Die Eingabe <code>auto</code> hält automatische Ausführungen still: Sie melden sich nur, wenn etwas deine Aufmerksamkeit braucht. Eine genaue Uhrzeit ist nicht nötig: Nutrition MCP Health schaut bei jeder Synchronisierung über die letzten 7 abgeschlossenen Tage zurück, und Nutrition MCP Activity sendet heute und die 2 Tage davor erneut, sodass ein verpasster Lauf sich von selbst nachholt.",
    },
    everyday: {
        title: "Im Alltag",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
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
                body: "Bitte deine KI, dein Profil anzuzeigen (<code>get_profile</code>): Dort steht, wann jeder Kurzbefehl verbunden wurde, bis zu welchem Tag Nutrition MCP Health gesendet hat und wann jeder zuletzt lief.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Große Kalorienzahlen, wenn er senden will?",
                body: "Keine Sorge: Der Kurzbefehl rundet jeden Tag auf ganze Kilokalorien, bevor er etwas sendet. Die Frage, die iOS vor dem Senden zeigt, listet die rohen Tagessummen aus Health mit allen Nachkommastellen im Zahlenformat deiner Region. Dort kann etwa <strong>922,774 kcal</strong> stehen: Das Komma ist in diesem Format das Dezimaltrennzeichen, gemeint sind also knapp 923 kcal. Die <strong>0 kcal</strong>-Einträge in dieser Liste ändern nichts.",
            },
            {
                title: "Ein Training auch im Chat erfasst?",
                body: "An einem Tag, den der Kurzbefehl gesendet hat, zählt die Summe aus Apple Health, und im Chat erfasste Trainings bleiben in deinem Protokoll, ohne obendrauf addiert zu werden: Die Aktive Energie deiner Uhr enthält sie bereits. An anderen Tagen zählen sie wie gewohnt.",
            },
            {
                title: "Ein Tag, der 0 anzeigt?",
                body: "Ein Tag ohne Aktive Energie, oder einer, den Health dem Kurzbefehl nicht zu lesen erlaubt hat, sendet nichts und ändert nichts. Bleibt jeder Tag bei 0, erlaube Kurzbefehlen unter Health → <strong>Freigabe</strong> → <strong>Apps</strong> → <strong>Kurzbefehle</strong>, Aktive Energie zu lesen.",
            },
            {
                title: "Von Hand ausführen",
                body: "Tippe in der Kurzbefehle-App auf <strong>Nutrition MCP Activity</strong>, um sein Menü zu öffnen: <strong>Sync now</strong> sendet heute und die 2 Tage davor, <strong>Status</strong> zeigt den zuletzt gesendeten Tag, und <strong>Disconnect</strong> beendet seine Verbindung und lässt Nutrition MCP Health verbunden.",
            },
        ],
    },
    privacy: {
        title: "Datenschutz und Grenzen",
        items: [
            "Nutrition MCP Health: Unser Server speichert die Verbindung und 8 Tage lang eine Aufzeichnung der gesendeten Summen, damit jeder Tag einmal gesendet und danach nur noch ergänzt wird. Wir senden nichts an Apple; der Kurzbefehl fragt unseren Server nach deinen Summen und schreibt sie auf deinem iPhone in Health, wo deine eigenen Apple-Einstellungen gelten.",
            "Nutrition MCP Activity liest nur die tägliche Summe der <strong>Aktiven Energie</strong>, sonst nichts aus Health. Unser Server speichert diese Summen als deine Aktivkalorien, in deinem Datenexport und gelöscht mit deinem Konto, wie die, die du im Chat erfasst.",
            "Jeder Kurzbefehl bewahrt sein eigenes Zugriffstoken in seinem eigenen Speicher in der Kurzbefehle-App auf deinem iPhone auf, nicht in einer Datei, und die Kurzbefehle-App synchronisiert es eventuell über iCloud auf deine anderen Geräte. Wer einen Kurzbefehl auf deinen Geräten ausführen kann, kann seine Synchronisierung nutzen, bis du sie trennst. Halte sie also auf Geräten, die nur du nutzt.",
            "Wähle jederzeit <strong>Disconnect</strong>, und die Verbindung von Nutrition MCP Health samt ihrer Aufzeichnung wird sofort gelöscht. Jede Verbindung endet außerdem von selbst nach 90 Tagen ohne Synchronisierung und 365 Tage nach dem Verbinden. Was schon in Apple Health ist, bleibt dort, bis du es löschst, und bereits gesendete Aktivkalorien bleiben, bis du sie löschst.",
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
            "Betreibst du deinen eigenen Server? Wie die Kurzbefehle Schritt für Schritt gebaut werden, steht in {link} und {activityLink}.",
        linkText: "der Bauanleitung für Nutrition MCP Health",
        activityLinkText: "der Bauanleitung für Nutrition MCP Activity",
    },
};

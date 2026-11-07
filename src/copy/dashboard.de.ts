import type { DashboardDoc } from "./dashboard.js";

export const DASHBOARD_DE: DashboardDoc = {
    meta: {
        title: "Nutrition MCP – Dashboard",
        description:
            "Deine Mahlzeiten, Ziele, Trends und Körpermaße aus Nutrition MCP auf einer Seite.",
    },
    noScript:
        "Das Dashboard braucht JavaScript, um deine Daten zu laden. Aktiviere es und lade die Seite neu.",
    tabs: {
        today: "Heute",
        history: "Verlauf",
        trends: "Trends",
        body: "Körper",
    },
    navAriaLabel: "Dashboard",
    pagesAriaLabel: "Dashboard-Seiten",
    signOut: "Abmelden",
    signOutFailed:
        "Die Abmeldung hat gerade nicht geklappt, dieser Browser ist also noch angemeldet. Versuche es gleich noch einmal.",

    sync: {
        updated: "Aktualisiert um {time}",
        updating: "Wird aktualisiert …",
        offline: "Offline · zuletzt aktualisiert um {time}",
        offlineNever: "Offline",
        empty: "Noch keine Einträge",
    },
    error: {
        lead: "Aktualisierung fehlgeschlagen.",
        leadFirst: "Deine Daten konnten nicht geladen werden.",
        stale: "Du siehst den Stand von {time}. Alles, was du seitdem erfasst hast, erscheint, sobald die Verbindung wieder steht.",
        first: "Prüf deine Verbindung und versuch es dann noch einmal.",
        retry: "Erneut versuchen",
    },
    loading: "Dein Tag wird geladen",

    today: {
        dateAriaLabel: "Datum",
        titleToday: "Heute",
        titleYesterday: "Gestern",
        prevDay: "Vorheriger Tag",
        nextDay: "Nächster Tag",
        pickDate: "Datum wählen",
        calendar: "Kalender",
    },
    empty: {
        title: "Noch nichts erfasst",
        body: "Sag deinem KI-Assistenten, was du gegessen oder getrunken hast. Jeder Eintrag erscheint hier innerhalb einer Minute – mit Summen, Zielen und Trends.",
        trySaying: "Sag zum Beispiel",
        examples: [
            "„Ich hatte zwei Eier und Toast zum Frühstück“",
            "„Setz mein Kalorienziel auf 2.200 und Protein auf 150 g“",
            "„Trag 500 ml Wasser ein“",
        ],
        stepsTitle: "Noch nicht verbunden?",
        steps: [
            "Füge Nutrition MCP zu Claude, ChatGPT oder einem anderen MCP-Client hinzu.",
            "Melde dich mit genau diesem Konto an, wenn du dazu aufgefordert wirst.",
            "Erfasse deine erste Mahlzeit im Chat. Diese Seite aktualisiert sich von selbst.",
        ],
        connectCta: "So verbindest du dich",
    },
    history: {
        rangeAriaLabel: "Zeitraum",
        title: "Verlauf",
        loggedPill: {
            one: "{logged} von {total} Tag erfasst",
            other: "{logged} von {total} Tagen erfasst",
        },
        searchPlaceholder: "Mahlzeiten oder Zutaten suchen",
        searchLabel: "Mahlzeiten und Zutaten durchsuchen",
        clearSearch: "Suche löschen",
        earlier: "Fünf Wochen zurück",
        later: "Fünf Wochen vor",
        resultsTitle: {
            one: "{n} Mahlzeit passt zu „{q}“",
            other: "{n} Mahlzeiten passen zu „{q}“",
        },
        resultsSub: "Namen und Zutaten, neueste zuerst",
        ingredient: "Zutat: {item}",
        kcal: "kcal",
        noResults:
            "Keine Mahlzeit und keine Zutat passt. Versuch es mit einem kürzeren Wort, etwa „Reis“.",
        tooShort: "Gib mindestens zwei Buchstaben ein, um zu suchen.",
        searching: "Suche läuft …",
        searchFailed:
            "Die Suche ist gerade nicht verfügbar. Versuch es gleich noch einmal.",
        savedHit:
            "Auch eine gespeicherte Mahlzeit: {name}, {kcal} kcal pro Portion",
        calendarTitle: "Kalender",
        legendOn: "Im Ziel ±5 %",
        legendUnder: "Darunter",
        legendOver: "Darüber",
        calendarAriaLabel: "Kalorien pro Tag, {from} bis {to}",
        cellToday: "heute",
        cellTodaySuffix: " (heute)",
        cellNothing: ", nichts erfasst",
        cellKcal: ", {kcal} kcal",
        summary:
            "Ø {avg} kcal über {n} vollständige Tage · {on} im Ziel · {over} darüber · {under} darunter · {missing} nicht erfasst",
        summaryNone:
            "In diesen fünf Wochen wurde kein vollständiger Tag erfasst.",
        dayEmpty: "Am {date} wurde nichts erfasst.",
        dayFailed:
            "{date} konnte nicht geladen werden. Versuche es gleich noch einmal.",
        savedTitle: "Gespeicherte Mahlzeiten",
        savedSub: "Erfasse eine per Name im Chat – „Trag {name} ein“.",
        savedSubNone:
            "Mahlzeiten, die du im Chat speicherst, erscheinen hier und lassen sich per Name erfassen.",
        perServing: " kcal / Portion",
        protein: "P {g} g",
        carbs: "K {g} g",
        fat: "F {g} g",
        items: { one: "{n} Zutat", other: "{n} Zutaten" },
        savedNone: "Noch keine gespeicherten Mahlzeiten.",
    },
    trends: {
        eyebrow: "Kalorien, Makros und Nährstoffe im Zeitverlauf",
        title: "Trends",
    },
    body: {
        eyebrow: "Gewicht und Körpermaße",
        title: "Körper",
        measTitle: "Körpermaße",
        measSub: "Umfänge, wie du sie erfasst hast · zuletzt am {date}",
        notMeasured: "Noch nicht gemessen:",
        hintCm: "Für einen neuen Wert sag deinem Assistenten „Taille 83,5 cm“. Veränderungen werden ab deinem ersten Eintrag am {date} gemessen. Im Chat lässt sich die Einheit auf Zoll umstellen.",
        hintIn: "Für einen neuen Wert sag deinem Assistenten „Taille 33 Zoll“. Veränderungen werden ab deinem ersten Eintrag am {date} gemessen. Im Chat lässt sich die Einheit auf Zentimeter umstellen.",
        sinceFirst: "{delta} seit dem ersten",
        firstEntry: "Erster Eintrag",
        noMeasurements:
            "Noch keine Körpermaße. Taille, Hüfte und sieben weitere Stellen lassen sich in Zentimetern oder Zoll erfassen.",
        kinds: {
            waist: "Taille",
            hips: "Hüfte",
            neck: "Hals",
            chest: "Brust",
            shoulders: "Schultern",
            upper_arm: "Oberarm",
            forearm: "Unterarm",
            thigh: "Oberschenkel",
            calf: "Wade",
        },
        kindsInline: {
            waist: "Taille",
            hips: "Hüfte",
            neck: "Hals",
            chest: "Brust",
            shoulders: "Schultern",
            upper_arm: "Oberarm",
            forearm: "Unterarm",
            thigh: "Oberschenkel",
            calf: "Wade",
        },
    },
    widgets: {
        summary: "Ernährungsübersicht",
        digest: "Ernährungsbericht",
        goals: "Zielfortschritt",
        weight: "Gewichtsverlauf",
        trends: "Trends",
    },
};

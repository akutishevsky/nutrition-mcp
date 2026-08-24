import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_DE: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalorien",
            protein_g: "Eiweiß",
            // Not the full "Kohlenhydrate": it truncates in the compact
            // three-column macro tile (visually confirmed against the
            // assembled widget) the way "Eiweiß"/"Fett" don't.
            carbs_g: "Kohlenh.",
            fat_g: "Fett",
            sugar_g: "Zucker",
            alcohol_g: "Alkohol",
            caffeine_mg: "Koffein",
            fiber_g: "Ballaststoffe",
            water_ml: "Wasser",
        },
        noGoalSet: "kein Ziel festgelegt",
        atLimit: "am Limit",
        floorUnder: "übrig",
        ceilingUnder: "unter",
        over: "über",
        limitPrefix: "Limit",
        ofPrefix: "von",
        drinkLabels: { us: "US-Drinks", uk: "UK-Einheiten" },
        noneLogged: "nichts protokolliert",
        tapHint: "Für die zugehörigen Mahlzeiten auf einen Wert tippen",
        showMealsContributed:
            "Zeigt die Mahlzeiten, die dazu beigetragen haben.",
        byMealTitle: "{label} nach Mahlzeit",
        closeBreakdown: "Aufschlüsselung schließen",
        noMealsContributed:
            "Keine protokollierten Mahlzeiten haben zu {label} beigetragen.",
        untitledMeal: "Unbenannte Mahlzeit",
        moreMeals: {
            one: "+ {n} kleinere Mahlzeit",
            other: "+ {n} kleinere Mahlzeiten",
        },
    },
    nutritionSummary: {
        title: "Ernährungsübersicht",
        loading: "Ernährungsübersicht wird geladen…",
        empty: "In diesem Zeitraum wurden keine Mahlzeiten oder kein Wasser protokolliert.",
        caloriesPerDay: "Kalorien / Tag",
        avg: "Ø",
        goal: "Ziel",
        dailyAvgLoggedDays: "Tagesdurchschnitt · protokollierte Tage",
        total: "Gesamt",
        daysLogged: {
            one: "{n} Tag protokolliert",
            other: "{n} Tage protokolliert",
        },
        daysOfLogged: "{logged} von {span} Tagen protokolliert",
        months: [
            "Jan",
            "Feb",
            "Mär",
            "Apr",
            "Mai",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dez",
        ],
    },
};

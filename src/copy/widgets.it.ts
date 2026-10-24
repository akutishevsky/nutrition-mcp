import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_IT: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorie",
            protein_g: "Proteine",
            carbs_g: "Carboidrati",
            fat_g: "Grassi",
            sugar_g: "Zuccheri",
            added_sugar_g: "Zuccheri aggiunti",
            saturated_fat_g: "Grassi saturi",
            trans_fat_g: "Grassi trans",
            alcohol_g: "Alcol",
            caffeine_mg: "Caffeina",
            sodium_mg: "Sodio",
            fiber_g: "Fibre",
            water_ml: "Acqua",
        },
        noGoalSet: "nessun obiettivo",
        atLimit: "al limite",
        floorUnder: "rimanenti",
        ceilingUnder: "sotto",
        over: "in eccesso",
        limitPrefix: "limite",
        ofPrefix: "su",
        drinkLabels: { us: "drink USA", uk: "unità UK" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nessun dato",
        notRecorded: "non registrato",
        caloriesToday: "Calorie di oggi",
        caloriesOn: "Calorie · {date}",
        tapHint: "Tocca un valore per vedere da quali pasti proviene",
        showMealsContributed: "Mostra i pasti che hanno contribuito.",
        byMealTitle: "{label} per pasto",
        closeBreakdown: "Chiudi il dettaglio",
        noMealsContributed: "Nessun pasto registrato apporta {label}.",
        untitledMeal: "Pasto senza nome",
        moreMeals: {
            one: "+ {n} pasto più piccolo",
            other: "+ {n} pasti più piccoli",
        },
        moreMealsAtLeast: {
            one: "+ almeno {n} pasto più piccolo",
            other: "+ almeno {n} pasti più piccoli",
        },
        moreMealsMaybe: "+ forse altri pasti più piccoli",
        ingredientCount: {
            one: "{n} ingrediente",
            other: "{n} ingredienti",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "tuo",
        sourceEst: "stim.",
        sourceMixed: "misto",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "codice a barre",
        sourceDataType: "tipo di dato",
        sourceAria: "Fonte: {source}",
        sourceDetailsAria: "Mostra dettagli della fonte",
    },
    bridge: {
        settingsFooter:
            "Puoi attivare o disattivare questi widget quando vuoi: basta chiedere di cambiare le impostazioni.",
        connectFailed: "Questo pannello non è riuscito a collegarsi all'app.",
    },
    nutritionSummary: {
        title: "Riepilogo nutrizionale",
        loading: "Caricamento del riepilogo nutrizionale…",
        empty: "Niente pasti né acqua registrati in questo periodo.",
        caloriesPerDay: "Calorie / giorno",
        daysLogged: {
            one: "{n} giorno registrato",
            other: "{n} giorni registrati",
        },
        daysOfLogged: "{logged} giorni registrati su {span}",
        periodToday: "Today", // i18n:pending
        periodPastDay: "Past day", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        ofGoal: "of {goal} kcal", // i18n:pending
        avgOfGoal: "avg/day of {goal} kcal", // i18n:pending
        left: "{amount} left", // i18n:pending
        over: "{amount} over", // i18n:pending
        toGo: "{amount} to go", // i18n:pending
        above: "{amount} above", // i18n:pending
        onTarget: "on target", // i18n:pending
        goalMet: "goal met", // i18n:pending
        noLimit: "no limit", // i18n:pending
        none: "none", // i18n:pending
        notRecorded: "Not recorded", // i18n:pending
        leftToday: "{amount} left today", // i18n:pending
        overToday: "{amount} over today", // i18n:pending
        leftThatDay: "{amount} left that day", // i18n:pending
        overThatDay: "{amount} over that day", // i18n:pending
        underGoal: "{amount} under goal", // i18n:pending
        overGoal: "{amount} over goal", // i18n:pending
        peak: "peak {amount}", // i18n:pending
        mealsCount: {
            one: "{n} meal", // i18n:pending
            other: "{n} meals", // i18n:pending
        },
        emptyToday: "No meals logged today yet", // i18n:pending
        emptyThatDay: "No meals logged that day", // i18n:pending
        emptyRange: "No meals logged in this range", // i18n:pending
        statEatenSoFar: "Eaten so far", // i18n:pending
        statEaten: "Eaten", // i18n:pending
        statRemaining: "Remaining", // i18n:pending
        statOverGoal: "Over goal", // i18n:pending
        statMeals: "Meals", // i18n:pending
        statLogged: "logged", // i18n:pending
        statAvgDay: "Avg / day", // i18n:pending
        statPeakDay: "Peak day", // i18n:pending
        statLoggedDays: "Logged", // i18n:pending
        statOfDays: "of {n} days", // i18n:pending
        gaugeAriaToday:
            "{eaten} of {goal} kcal today, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaThatDay:
            "{eaten} of {goal} kcal that day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaRange:
            "Average {eaten} of {goal} kcal a day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaNoGoal: "{eaten} kcal.", // i18n:pending
        gaugeAriaMeals: "Meals: {list}.", // i18n:pending
        caloriesByDay: "Calories by day", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        items: {
            one: "{n} item", // i18n:pending
            other: "{n} items", // i18n:pending
        },
        totalOnlyShort: "total only", // i18n:pending
        totalOnly: "Logged as a total, without ingredients.", // i18n:pending
        goalLine: "goal", // i18n:pending
        byDay: "By day", // i18n:pending
        byDayPartial: "By day · recorded on {rec} of {logged} logged days", // i18n:pending
        byMealCount: {
            one: "By meal · {n} meal", // i18n:pending
            other: "By meal · {n} meals", // i18n:pending
        },
        notRecordedCount: {
            one: "{n} not recorded", // i18n:pending
            other: "{n} not recorded", // i18n:pending
        },
        notRecordedToday: "{label} wasn't recorded for today's meals.", // i18n:pending
        notRecordedThatDay: "{label} wasn't recorded for that day's meals.", // i18n:pending
        notRecordedRange: "{label} wasn't recorded on any day in this range.", // i18n:pending
        waterToday:
            "Water is logged on its own, not with meals: {amount} today.", // i18n:pending
        waterThatDay:
            "Water is logged on its own, not with meals: {amount} that day.", // i18n:pending
        waterRange: "Water is logged on its own, not with meals.", // i18n:pending
        noneInToday: "{label}: none in today's meals.", // i18n:pending
        noneInThatDay: "{label}: none in that day's meals.", // i18n:pending
        noneInRange: "{label}: none in the listed meals.", // i18n:pending
        topMeals: "Top meals", // i18n:pending
        dailyAverages: {
            one: "Daily averages · {n} logged day", // i18n:pending
            other: "Daily averages · {n} logged days", // i18n:pending
        },
        selected: "Selected {tip}", // i18n:pending
        months: [
            "gen",
            "feb",
            "mar",
            "apr",
            "mag",
            "giu",
            "lug",
            "ago",
            "set",
            "ott",
            "nov",
            "dic",
        ],
    },
    goalProgress: {
        loading: "Caricamento dei progressi…",
        eyebrow: "Goal progress · {when}", // i18n:pending
        today: "Today", // i18n:pending
        todayAt: "Today, {time}", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein: "Protein", // i18n:pending
            carbs: "Carbs", // i18n:pending
            fat: "Fat", // i18n:pending
            fiber: "Fiber", // i18n:pending
            sugar: "Sugar", // i18n:pending
            added_sugar: "Added sugar", // i18n:pending
            saturated: "Saturated fat", // i18n:pending
            trans: "Trans fat", // i18n:pending
            sodium: "Sodium", // i18n:pending
            caffeine: "Caffeine", // i18n:pending
            alcohol: "Alcohol", // i18n:pending
            water: "Water", // i18n:pending
        },
        names: {
            calories: "calories", // i18n:pending
            protein: "protein", // i18n:pending
            carbs: "carbs", // i18n:pending
            fat: "fat", // i18n:pending
            fiber: "fiber", // i18n:pending
            sugar: "sugar", // i18n:pending
            added_sugar: "added sugar", // i18n:pending
            saturated: "saturated fat", // i18n:pending
            trans: "trans fat", // i18n:pending
            sodium: "sodium", // i18n:pending
            caffeine: "caffeine", // i18n:pending
            alcohol: "alcohol", // i18n:pending
            water: "water", // i18n:pending
        },
        satFatShort: "Sat. fat", // i18n:pending
        kinds: { budget: "budget", target: "target", limit: "limit" }, // i18n:pending
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            ml: "ml", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        listPair: "{a} and {b}", // i18n:pending
        listMore: "{rest} and {last}", // i18n:pending
        listSep: ", ", // i18n:pending
        titleSep: " · ", // i18n:pending
        titleSepPast: ", ", // i18n:pending
        nothingToday: "Nothing logged today yet", // i18n:pending
        nothingPast: "Nothing was logged that day", // i18n:pending
        allOnTrack: {
            one: "Your {n} goal is on track", // i18n:pending
            other: "All {n} goals on track", // i18n:pending
        },
        allMet: { one: "Your {n} goal was met", other: "All {n} goals met" }, // i18n:pending
        overOne: "{a} is over", // i18n:pending
        overNamed: "{list} are over", // i18n:pending
        overMany: { one: "{n} limit is over", other: "{n} limits are over" }, // i18n:pending
        nearNamed: "{list} near the limit", // i18n:pending
        nearMany: {
            one: "{n} goal near the limit", // i18n:pending
            other: "{n} goals near the limit", // i18n:pending
        },
        toGoNamed: "{list} still to go", // i18n:pending
        toGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        briefOverOne: "{a} over", // i18n:pending
        briefOverMany: { one: "{n} over", other: "{n} over" }, // i18n:pending
        briefNear: { one: "{n} near the limit", other: "{n} near the limit" }, // i18n:pending
        briefToGoOne: "{a} to go", // i18n:pending
        briefToGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        pastOverNamed: "{list} went over", // i18n:pending
        pastOverMany: {
            one: "{n} limit went over", // i18n:pending
            other: "{n} limits went over", // i18n:pending
        },
        pastShortNamed: "{list} fell short", // i18n:pending
        pastShortMany: {
            one: "{n} target fell short", // i18n:pending
            other: "{n} targets fell short", // i18n:pending
        },
        pastCloseNamed: "{list} came close", // i18n:pending
        pastBriefOver: { one: "{n} over", other: "{n} over" }, // i18n:pending
        pastBriefShort: { one: "{n} short", other: "{n} short" }, // i18n:pending
        pastBriefMet: { one: "{n} met", other: "{n} met" }, // i18n:pending
        noGoalsTitle: "No daily goals set", // i18n:pending
        countersAria: "Goals by status", // i18n:pending
        counters: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "To go", // i18n:pending
            ok: "On track", // i18n:pending
        },
        countersPast: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "Short", // i18n:pending
            ok: "Met", // i18n:pending
        },
        counterAria: "{label}: {n}. Show them", // i18n:pending
        counterAriaZero: "{label}: {n}", // i18n:pending
        nrNoteToday: "Not recorded today, so not counted: {list}", // i18n:pending
        nrNotePast: "Not recorded that day, so not counted: {list}", // i18n:pending
        emptyToday:
            "Once a meal or water is logged, this shows what is over, what is close and what is still to go.", // i18n:pending
        emptyPast: "There is nothing to compare with the goals for that day.", // i18n:pending
        dailyGoals: "Daily goals: {list}.", // i18n:pending
        goalItem: "{value} {name}", // i18n:pending
        goalLimitItem: "{value} {name} limit", // i18n:pending
        noGoalsToday:
            "No daily goals are set, so there is nothing to compare with. Logged today: {list}.", // i18n:pending
        noGoalsPast:
            "No daily goals are set, so there is nothing to compare with. Logged that day: {list}.", // i18n:pending
        sections: {
            over: "Over the limit", // i18n:pending
            near: "Near the limit", // i18n:pending
            togo: "Still to go", // i18n:pending
            ok: "On track", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        sectionsPast: {
            over: "Went over", // i18n:pending
            near: "Close to the limit", // i18n:pending
            togo: "Fell short", // i18n:pending
            ok: "Met", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        showAll: "Show all goals", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        done: "Done", // i18n:pending
        met: "Met", // i18n:pending
        toGo: "to go", // i18n:pending
        short: "short", // i18n:pending
        over: "over", // i18n:pending
        left: "left", // i18n:pending
        under: "under", // i18n:pending
        ofLimit: "of limit", // i18n:pending
        notRecorded: "not recorded", // i18n:pending
        noDayTotal: "no day total", // i18n:pending
        ofGoal: "{value} of {goal}", // i18n:pending
        rowAria: "{label} {kind}: {status}, {detail}", // i18n:pending
        restTitle: "For the rest of today", // i18n:pending
        cellCaloriesLeft: "Calories left", // i18n:pending
        cellCalories: "Calories", // i18n:pending
        cellToGo: "{label} to go", // i18n:pending
        cellOver: "+{value} over", // i18n:pending
        cellPct: "{pct}% of limit", // i18n:pending
        cellAria: "{key}: {value}", // i18n:pending
        hintOverK: "Over budget:", // i18n:pending
        hintOver: "{over} above the {goal} budget.", // i18n:pending
        hintOverWater: "{over} above the {goal} budget; water {left} to go.", // i18n:pending
        hintFoodK: "Logged before:", // i18n:pending
        hintFood: "{food} — {facts}.", // i18n:pending
        hintToGoK: "Still to go:", // i18n:pending
        hintWaterK: "Water:", // i18n:pending
        hintOverLimitK: "Over the limit:", // i18n:pending
        hintNearK: "Close to the limit:", // i18n:pending
        hintList: "{list}.", // i18n:pending
        waterLeft: {
            one: "{left} to go, about {n} glass of 250 ml.", // i18n:pending
            other: "{left} to go, about {n} glasses of 250 ml.", // i18n:pending
        },
        hintAllK: "All set:", // i18n:pending
        hintAll: "every goal is on track.", // i18n:pending
        leadK: "Biggest source:", // i18n:pending
        leadV: "{name} — {value} {nutrient}", // i18n:pending
        gapTitle: "Foods you’ve logged before", // i18n:pending
        mealsTitle: "Where it came from", // i18n:pending
        waterToday: "Logged today", // i18n:pending
        waterPast: "Logged that day", // i18n:pending
        totalOnly: "total only", // i18n:pending
        mealFallback: "Meal", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        noMealsToday: "No meals logged today.", // i18n:pending
        noMealsPast: "No meals logged that day.", // i18n:pending
        noWaterToday: "No water logged today.", // i18n:pending
        noWaterPast: "No water logged that day.", // i18n:pending
        otherMealsNone: {
            one: "{n} other meal had none.", // i18n:pending
            other: "{n} other meals had none.", // i18n:pending
        },
        missingNote: {
            one: "Not recorded for {n} meal; the total counts only the meals that had it.", // i18n:pending
            other: "Not recorded for {n} meals; the total counts only the meals that had it.", // i18n:pending
        },
        nrOne: "{label} wasn’t recorded for “{meal}”, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        nrMany: {
            one: "{label} wasn’t recorded for {n} meal, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
            other: "{label} wasn’t recorded for {n} meals, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        },
        sources: {
            usda: "USDA", // i18n:pending
            openfoodfacts: "Open Food Facts", // i18n:pending
            user: "your figure", // i18n:pending
            estimate: "estimate", // i18n:pending
            mixed: "mixed sources", // i18n:pending
        },
        weight: "Weight", // i18n:pending
        weightAbove: "{delta} above your {target} goal", // i18n:pending
        weightBelow: "{delta} below your {target} goal", // i18n:pending
        weightAt: "at your {target} goal", // i18n:pending
        weightNoGoal: "no goal set", // i18n:pending
        weightLatest: "latest reading, {date}", // i18n:pending
        weightNone: "no reading yet", // i18n:pending
        weightNoneGoal: "no reading yet · goal {target}", // i18n:pending
        transNote: "no limit set, shown for reference", // i18n:pending
        drinks: {
            us: { one: "{n} US drink", other: "{n} US drinks" }, // i18n:pending
            uk: { one: "{n} UK unit", other: "{n} UK units" }, // i18n:pending
        },
    },
    mealLogged: {
        logged: "logged", // i18n:pending
        edited: "edited", // i18n:pending
        thisMeal: "{amount} this meal", // i18n:pending
        statThisMeal: "This meal", // i18n:pending
        statToday: "Today", // i18n:pending
        statLeftToday: "Left today", // i18n:pending
        statLeftThatDay: "Left that day", // i18n:pending
    },
    trends: {
        loading: "Caricamento dell'andamento…",
        windowAriaLabel: "Periodo",
        segWeek: "Sett.",
        segMonth: "Mese",
        segQuarter: "Trim.",
        segYear: "Anno",
        segDays: "Giorni",
        segWeekAria: "Mostra medie settimanali",
        segMonthAria: "Mostra medie mensili",
        segQuarterAria: "Mostra medie trimestrali",
        segYearAria: "Mostra medie annuali",
        segDaysAria: "Mostra andamento giornaliero",
        periodTitleWeek: "Medie settimanali",
        periodTitleMonth: "Medie mensili",
        periodTitleQuarter: "Medie trimestrali",
        periodTitleYear: "Medie annuali",
        perLoggedDay: "per giorno registrato",
        daysLogged: "{logged}/{total} giorni",
        onTarget: "nell'obiettivo {k}/{n}",
        possiblyIncomplete: {
            one: "{n} forse incompleto",
            other: "{n} forse incompleti",
        },
        partial: "in corso",
        nothingLogged: "niente registrato",
        targetsChanged: "obiettivi cambiati nel periodo",
        targetsAssumed: "obiettivi prima del {date} non registrati",
        noTargets: "Nessun obiettivo impostato: solo medie.",
        quarter: "T{q} {year}",
        today: "Today", // i18n:pending
        daySoFar: "{day} (so far)", // i18n:pending
        soFar: "so far", // i18n:pending
        lastNDays: "Last {n} days", // i18n:pending
        nDays: "{n} days", // i18n:pending
        titleMetric: "{n}-day {metric} trend", // i18n:pending
        metricLabel: {
            calories: "Calories", // i18n:pending
            protein: "Protein", // i18n:pending
            carbs: "Carbs", // i18n:pending
            fat: "Fat", // i18n:pending
            fiber: "Fiber", // i18n:pending
            sugar: "Sugar", // i18n:pending
            addedSugar: "Added sugar", // i18n:pending
            saturated: "Saturated fat", // i18n:pending
            trans: "Trans fat", // i18n:pending
            sodium: "Sodium", // i18n:pending
            caffeine: "Caffeine", // i18n:pending
            water: "Water", // i18n:pending
            alcohol: "Alcohol", // i18n:pending
        },
        metricInTitle: {
            calories: "calorie", // i18n:pending
            protein: "protein", // i18n:pending
            carbs: "carb", // i18n:pending
            fat: "fat", // i18n:pending
            fiber: "fiber", // i18n:pending
            sugar: "sugar", // i18n:pending
            addedSugar: "added sugar", // i18n:pending
            saturated: "saturated fat", // i18n:pending
            trans: "trans fat", // i18n:pending
            sodium: "sodium", // i18n:pending
            caffeine: "caffeine", // i18n:pending
            water: "water", // i18n:pending
            alcohol: "alcohol", // i18n:pending
        },
        pill: "{n}d", // i18n:pending
        pillAria: "Show {n} days", // i18n:pending
        metricsAria: "Choose a nutrient", // i18n:pending
        scrollLeft: "Scroll left", // i18n:pending
        scrollRight: "Scroll right", // i18n:pending
        avgWord: "avg", // i18n:pending
        perDay: "{unit}/day", // i18n:pending
        chartTitle: "{metric} per day", // i18n:pending
        chartAria: "{metric} per day over {n} days", // i18n:pending
        loggedOf: "{a} of {n}", // i18n:pending
        daysLoggedWord: "days logged", // i18n:pending
        daysRecordedWord: "days recorded", // i18n:pending
        belowGoal: "below goal", // i18n:pending
        overGoal: "over goal", // i18n:pending
        underLimit: "under limit", // i18n:pending
        overLimit: "over limit", // i18n:pending
        noGoalSet: "no goal set", // i18n:pending
        heroGoal: "Goal {goal} · {pct} reached", // i18n:pending
        heroGoalOver: "Goal {goal} · {pct} of goal", // i18n:pending
        heroLimit: "Limit {goal} · {pct} used", // i18n:pending
        heroNoGoal: "No goal set", // i18n:pending
        todayNote: "Today is still in progress, so it isn’t averaged yet.", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        notRecorded: "not recorded", // i18n:pending
        pctOfGoal: "{pct} of goal", // i18n:pending
        pctOfLimit: "{pct} of limit", // i18n:pending
        amountOverGoal: "{amount} over goal", // i18n:pending
        amountOverLimit: "{amount} over limit", // i18n:pending
        onTargetPct: "on target · {pct}", // i18n:pending
        steady: "steady", // i18n:pending
        noGoal: "no goal", // i18n:pending
        notRecordedInRange:
            "{metric} wasn’t recorded on any day in this range.", // i18n:pending
        chipHigh: "High {value} {day}", // i18n:pending
        chipLow: "Low {value} {day}", // i18n:pending
        chipOnTarget: {
            one: "{value} day on target", // i18n:pending
            other: "{value} days on target", // i18n:pending
        },
        chipOverLimit: {
            one: "{value} day over limit", // i18n:pending
            other: "{value} days over limit", // i18n:pending
        },
        statDaysLogged: "Days logged", // i18n:pending
        statDaysRecorded: "Days recorded", // i18n:pending
        statOnTarget: "On target", // i18n:pending
        statDaysOverLimit: "Days over limit", // i18n:pending
        statBelowGoal: "Below goal", // i18n:pending
        statOverGoal: "Over goal", // i18n:pending
        statUnderLimit: "Under limit", // i18n:pending
        statOverLimit: "Over limit", // i18n:pending
        statNoGoal: "No goal set", // i18n:pending
        daysUnit: {
            one: "day", // i18n:pending
            other: "days", // i18n:pending
        },
        showAllDays: "Show all {n} days", // i18n:pending
        emptyTitle: "No meals logged in this period", // i18n:pending
        emptyBody: "Your trend appears here once meals are logged.", // i18n:pending
        drinkUnit: {
            us: "drinks", // i18n:pending
            uk: "units", // i18n:pending
        },
        dayAria: "{day}, {value}", // i18n:pending
    },
    weightTrends: {
        loading: "Caricamento dell'andamento del peso…",
        empty: "Ancora nessuna pesata in questo periodo.",
        eyebrowToday: "Peso · oggi",
        eyebrowLast: "Peso · ultima pesata {date}",
        titleFirst: "Prima pesata registrata",
        titleFew: "Ancora poche pesate",
        titleNoRate: "Pesate recenti insufficienti per un ritmo settimanale",
        titleSteady: "Stabile",
        titleDown: "In calo",
        titleUp: "In aumento",
        titleGoalReached: "Obiettivo raggiunto",
        titleAway: "Ti stai allontanando dall'obiettivo",
        titleOnTrack: "In linea con il tuo obiettivo",
        titleShortSteady: "Stabile, obiettivo non ancora raggiunto",
        rangeGroupAriaLabel: "Periodo",
        ranges: {
            "7": {
                label: "7 g",
                aria: "Mostra gli ultimi 7 giorni",
                word: "negli ultimi 7 giorni",
                inRange: "in 7 giorni",
                heading: "ultimi 7 giorni",
                chip: "7 g",
            },
            "30": {
                label: "30 g",
                aria: "Mostra gli ultimi 30 giorni",
                word: "negli ultimi 30 giorni",
                inRange: "in 30 giorni",
                heading: "ultimi 30 giorni",
                chip: "30 g",
            },
            "90": {
                label: "90 g",
                aria: "Mostra gli ultimi 90 giorni",
                word: "negli ultimi 90 giorni",
                inRange: "in 90 giorni",
                heading: "ultimi 90 giorni",
                chip: "90 g",
            },
            "1y": {
                label: "1 a",
                aria: "Mostra l'ultimo anno",
                word: "nell'ultimo anno",
                inRange: "in un anno",
                heading: "ultimo anno",
                chip: "1 a",
            },
            all: {
                label: "Tutto",
                aria: "Mostra tutto lo storico",
                word: "in tutto lo storico",
                inRange: "in totale",
                heading: "tutto lo storico",
                chip: "Tutto",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} a settimana",
        perWeekAvg: "{amount} a settimana in media",
        toGoal: "{value} all'obiettivo",
        weeksApprox: {
            one: "~{n} settimana",
            other: "~{n} settimane",
        },
        yearsPlus: "2+ anni",
        reachedOn: "raggiunto il {date}",
        movingAway: "si allontana dall'obiettivo",
        tooFlat: "troppo piatto per stimare una data",
        hintFew: "Una linea di tendenza richiede almeno 4 pesate nel periodo",
        hintNoRate:
            "Il ritmo settimanale richiede 4 pesate nelle ultime 3 settimane",
        statPerWeek: "A settimana",
        statGoalPace: "Obiettivo a questo ritmo",
        statGoalReached: "Obiettivo raggiunto",
        statToGoal: "All'obiettivo",
        statSince: "Dal {date}",
        unitWeeks: {
            one: "settimana",
            other: "settimane",
        },
        unitYears: "anni",
        goalPill: "Obiettivo {goal} · mancano {left}",
        goalPillReached: "Obiettivo {goal} ✓",
        goalBelow: "Obiettivo {goal}  ↓ {left} sotto",
        goalAbove: "Obiettivo {goal}  ↑ {left} sopra",
        today: "Oggi",
        yesterday: "Ieri",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (media di {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, media di {n}",
        chartAriaLabel:
            "Grafico del peso, ultimo {latest}{goal}{change}. Tocca un giorno per leggerne il valore.",
        chartAriaGoal: ", obiettivo {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Chiudi",
        oneTitleFirst: "Il tuo andamento parte da qui",
        oneTitle: "Una sola pesata {range}",
        oneFirst: "Prima pesata · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "Il grafico parte dalla seconda pesata",
        oneHintEarlier: {
            one: "{n} giorno di pesata precedente nei periodi più lunghi",
            other: "{n} giorni di pesata precedenti nei periodi più lunghi",
        },
        emptyRange: "Nessuna pesata {range}.",
        emptyRangeLast: "Nessuna pesata {range}. L'ultima risale al {date}.",
        showMore: "Mostra di più",
        showLess: "Mostra meno",
        detailsAria: "{action}: pesate e misure",
        detailsAriaWeighIns: "{action}: pesate",
        collapseAll: "Comprimi tutto",
        sectionWeighIns: "Pesate",
        sectionMeasurements: "Misure corporee · {range}",
        accLabel: {
            one: "{n} pesata {range}",
            other: "{n} pesate {range}",
        },
        accEmpty: "Nessuna pesata {range}",
        accAvgRange: "media {avg} · intervallo {min}–{max}",
        loggedToday: "registrata oggi",
        loggedYesterday: "registrata ieri",
        loggedOn: "registrata il {date}",
        weekThis: "Questa settimana",
        weekLast: "Settimana scorsa",
        weekAvg: "media {value}",
        weekVsLast: "{change} rispetto alla settimana scorsa",
        weekVsBefore: "{change} rispetto alla settimana prima",
        dayMulti: {
            one: "{n} pesata · media",
            other: "{n} pesate · media",
        },
        showEarlierWeeks: {
            one: "Mostra {n} settimana precedente",
            other: "Mostra {n} settimane precedenti",
        },
        sites: {
            waist: "Vita",
            hips: "Fianchi",
            neck: "Collo",
            chest: "Petto",
            shoulders: "Spalle",
            upper_arm: "Braccio",
            forearm: "Avambraccio",
            thigh: "Coscia",
            calf: "Polpaccio",
        },
        measSince: "{change} dal {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ invariato",
        measFirst: "prima misura · {date}",
        measFirstRow: "prima",
        measStale: "non misurato in questo periodo · l'ultima il {date}",
        measEarlier: "Misure precedenti",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "Mostra ancora {n}",
            other: "Mostra ancora {n}",
        },
        noMeasurements:
            "Nessuna misura corporea nell'ultimo anno. Vita, fianchi e altre sette zone si possono registrare in centimetri o pollici.",
    },
    importMeals: {
        loading: "Preparazione dell'importazione…",
        stepFile: "File",
        stepMap: "Abbina colonne",
        stepPreview: "Anteprima",
        stepImport: "Importa",
        fieldLabels: {
            logged_at: "Data / ora",
            description: "Nome alimento",
            meal_type: "Pasto",
            calories: "Calorie",
            protein_g: "Proteine (g)",
            carbs_g: "Carboidrati (g)",
            fat_g: "Grassi (g)",
            fiber_g: "Fibre (g)",
            sugar_g: "Zuccheri, totali (g)",
            added_sugar_g: "Zuccheri aggiunti (g)",
            saturated_fat_g: "Grassi saturi (g)",
            trans_fat_g: "Grassi trans (g)",
            alcohol_g: "Alcol (g)",
            caffeine_mg: "Caffeina (mg)",
            sodium_mg: "Sodio (mg)",
            notes: "Note",
            time: "Ora (colonna separata)",
            deleted: "Indicatore di eliminazione",
            source_id: "ID pasto (dalla nostra esportazione)",
            timezone: "Fuso orario (dalla nostra esportazione)",
        },
        chooseExportHeading: "Scegli il file esportato",
        noToolsWarning:
            "Questa app non consente al pannello di scrivere nel tuo diario. Chiedi a Claude di importare il file al posto tuo: può farlo direttamente.",
        emailFallback:
            "Se neanche chiedere a Claude funziona, scrivi a {email}.",
        tzWarning:
            "Il tuo fuso orario non è impostato, quindi gli orari saranno letti come UTC e potrebbero finire nel giorno sbagliato. Chiedi prima a Claude di impostare il tuo fuso orario.",
        dropChoose: "Scegli un file CSV",
        dropOr: "oppure trascinalo qui",
        recognizedHint:
            "Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute in automatico. Non viene salvato nulla finché non confermi.",
        dateMapHint:
            "Abbina una colonna della data qui sopra per vedere come viene convertito un valore del tuo file.",
        dateNoneHint: "Quella colonna non contiene date.",
        dateUnreadable:
            "{raw} → non leggibile come {format}, quindi le righe come questa verranno saltate",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Abbina una colonna delle calorie qui sopra per vedere come viene convertito un valore del tuo file.",
        energyNoneHint: "Quella colonna non contiene numeri.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (nessuna conversione)",
        dateAmbiguousWarning:
            "Da questo file non è possibile capire il formato della data: le date si leggono allo stesso modo con il giorno o con il mese al primo posto. Conferma quale formato esporta la tua app. Con quello sbagliato, i pasti finiscono nel giorno sbagliato senza alcun messaggio di errore.",
        dateFormatLabel: "Formato data in questo file",
        dateFormatYmd: "Anno-Mese-Giorno",
        dateFormatDmy: "Giorno/Mese/Anno",
        dateFormatMdy: "Mese/Giorno/Anno",
        energyUnitLabel: "Unità di energia della colonna delle calorie",
        energyUnitKcal: "Calorie",
        energyUnitKj: "Chilojoule",
        mapColumnsHeading: "Abbina colonne",
        rowsCount: { one: "{n} riga", other: "{n} righe" },
        columnsCount: { one: "{n} colonna", other: "{n} colonne" },
        delimiterLabel: "separatore",
        tabLabel: "tabulazione",
        notInFile: "(non presente in questo file)",
        columnFallback: "colonna {n}",
        caffeineGramsNotice:
            "La colonna della caffeina di questo file ({column}) è in grammi, ma la caffeina viene salvata in milligrammi, quindi Caffeina non è stata abbinata. Abbinarla registrerebbe 0,18 dove l'etichetta indica 180 mg. Reimportare lo stesso file in seguito non recupererà questi valori: quelle righe risulteranno già registrate e verranno saltate come duplicati. Se l'intestazione è sbagliata e i valori sono davvero in milligrammi, selezionala qui sopra; se sono davvero grammi, moltiplicali per 1000 nel file prima di importarlo, non dopo.",
        alcoholNotice:
            "Questo file ha una colonna dell'alcol ({column}), ma il monitoraggio dell'alcol è disattivato per questo account, quindi non verrà importata. Reimportare lo stesso file in seguito non recupererà questi valori: quelle righe risulteranno già registrate e verranno saltate come duplicati. Per conservare questi dati, chiedi a Claude di attivare il monitoraggio dell'alcol (set_alcohol_tracking) prima di importare.",
        sampleValue: "es. {sample}",
        sourceAppLabel: "App di origine (facoltativa)",
        sourceAppHint:
            "Serve a etichettare le righe che non hanno il nome dell'alimento.",
        previewButton: "Mostra anteprima",
        chooseAnotherButton: "Scegli un altro file",
        previewHeading: "Anteprima",
        datesReadAs: "Date lette come {format}; energia {conversion}.",
        energyConvertedNote: "convertita da kJ a kcal",
        energyReadAsKcal: "letta come kcal",
        badDatesWarning: {
            one: "{n} riga è stata saltata perché non è stato possibile leggerne la data come {format}{sample}. Torna indietro e imposta il formato data che corrisponde al tuo file.",
            other: "{n} righe sono state saltate perché non è stato possibile leggerne la data come {format}{sample}. Torna indietro e imposta il formato data che corrisponde al tuo file.",
        },
        badDateSample: " (es. riga {line}: {value})",
        noTimeWarning: {
            one: "{n} riga ha la data ma non l'orario: verrà registrata a mezzogiorno.",
            other: "{n} righe hanno la data ma non l'orario: verranno registrate a mezzogiorno.",
        },
        splitDatesCount: {
            one: "{n} data ha",
            other: "{n} date hanno",
        },
        splitDatesWarning:
            " più di {max} pasti (es. {date}), quindi l'importazione è stata divisa in più lotti. Se quella data contiene due voci con lo stesso identico alimento, tipo di pasto e macro, una delle due potrebbe essere saltata come duplicato invece di essere importata.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "C",
            fat_g: "G",
            fiber_g: "Fib",
            sugar_g: "Zucc",
            added_sugar_g: "Agg",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caff",
            sodium_mg: "Na",
        },
        tableLine: "Riga",
        tableWhen: "Quando",
        tableMeal: "Pasto",
        tableFood: "Alimento",
        tableProblem: "Problema",
        noNameFallback: "(senza nome: verrà usato il tipo di pasto)",
        showingRows: "Righe mostrate: {shown} su {total}",
        checkingRows: {
            one: "Controllo di {n} riga…",
            other: "Controllo di {n} righe…",
        },
        importingRows: {
            one: "Importazione di {n} riga…",
            other: "Importazione di {n} righe…",
        },
        batchProgress: "{label} (lotto {done} su {total})",
        rowsRange: "Righe {a}–{b}: {msg}",
        preflightFailed: "Il controllo preliminare non è riuscito.",
        rowsWouldFail: {
            one: "{n} riga darebbe errore, es. riga {line}: {message}",
            other: "{n} righe darebbero errore, es. riga {line}: {message}",
        },
        importingEllipsis: "Importazione in corso…",
        importButton: {
            one: "Importa {n} pasto",
            other: "Importa {n} pasti",
        },
        backToMapping: "Torna alla mappatura",
        importCompleteHeading: "Importazione completata",
        resultMealsImported: {
            one: "{n} pasto importato",
            other: "{n} pasti importati",
        },
        resultAlreadyLogged: {
            one: ", {n} già registrato",
            other: ", {n} già registrati",
        },
        resultFailed: {
            one: ", {n} non riuscito",
            other: ", {n} non riusciti",
        },
        resultSkipped: {
            one: ", {n} saltato",
            other: ", {n} saltati",
        },
        restartButton: "Importa un altro file",
        couldNotReadFile: "Impossibile leggere il file: {msg}",
        noDataRows: "Nessuna riga di dati trovata in quel file.",
        emailNotice:
            "Qualcosa non funziona? Scrivi a {email} e includi le righe qui sotto: contengono tutto ciò che serve per capire il problema.",
        eyebrow: "Importa pasti",
        eyebrowWithFile: "Importa pasti · {file}",
        stepsLabel: "Passaggi dell'importazione",
        stepAriaDone: "Passaggio {i} di 4: {name}, completato",
        stepAriaCurrent: "Passaggio {i} di 4: {name}, attuale",
        stepAriaUpcoming: "Passaggio {i} di 4: {name}",
        browseFiles: "Sfoglia i file",
        dropAccept: ".csv o testo separato da tabulazioni",
        dropAria: "Scegli un file CSV o trascinalo qui",
        privacyNote:
            "Il file viene letto qui, in questo pannello. Le sue righe non passano mai dalla chat: l'assistente riceve solo un riepilogo di una riga al termine dell'importazione.",
        binaryFile:
            "Impossibile leggere il file: sembra un file binario (una cartella di lavoro Excel?), non testo CSV. Esportalo come CSV e riprova.",
        columnsHeading: "Colonne",
        fieldsMatched: {
            one: "{n} campo su {total} abbinato",
            other: "{n} campi su {total} abbinati",
        },
        tableFieldHead: "Campo",
        tableColumnHead: "Colonna nel tuo file",
        tableRow1Head: "Valore nella riga 1",
        badgeNew: "nuovo",
        colNumber: "Col. {n}",
        colNumberAuto: "Col. {n} · automatica",
        colNumberManual: "Col. {n} · scelta da te",
        row1Empty: "riga 1 vuota",
        alsoUsed: "anche {field}",
        sameColumn: "Stessa colonna di {fields}",
        columnForAria: "Colonna per {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", obbligatorio",
        columnAria: "colonna {n}, {name}",
        notInFileAria: "non presente in questo file",
        sampleAria: ", {sample}",
        howRead: "Come vengono letti i valori",
        appExport: "Esportazione di {app}",
        tileMeals: { one: "pasto da importare", other: "pasti da importare" },
        tileKcal: "kcal in totale",
        tileSkipped: { one: "riga saltata", other: "righe saltate" },
        tileBatches: { one: "lotto", other: "lotti" },
        rowsHeading: "Righe",
        scrollLeft: "Scorri la tabella a sinistra",
        scrollRight: "Scorri la tabella a destra",
        previewRegionAria: "Anteprima delle righe da importare",
        expandAllDays: "Espandi tutti i giorni",
        collapseAllDays: "Comprimi tutti i giorni",
        dayRows: { one: "{n} riga", other: "{n} righe" },
        dayRowsKcal: {
            one: "{n} riga · {kcal} kcal",
            other: "{n} righe · {kcal} kcal",
        },
        noTimeShort: "senza ora",
        lineN: "Riga {n}",
        rowCardAria: "Riga {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "nessun pasto",
        noKcalAria: "nessuna caloria",
        noRowsToImport: "Nessuna riga da importare con l'abbinamento attuale.",
        importOff:
            "L'importazione è disattivata: questo host non consente a questa vista di scrivere nel tuo diario. Chiedi invece a Claude di importare il file.",
        backBusy: "Non puoi tornare indietro mentre i lotti vengono inviati.",
        progressAria: "Avanzamento dell'importazione, lotti",
        failedRowsAria: "Righe non riuscite",
        toldOnly: "All'assistente è stato detto solo: {summary}",
        liveStep: "Passaggio {i} di 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Importazione in corso. {n} lotto.",
            other: "Importazione in corso. {n} lotti.",
        },
        liveDone: {
            one: "Importazione completata. {n} pasto importato.",
            other: "Importazione completata. {n} pasti importati.",
        },
        liveNoWrite:
            "Il controllo preliminare non è riuscito. Non è stato salvato nulla.",
        liveFileError: "Impossibile usare questo file.",
    },
    digest: {
        loading: "Loading your digest…", // i18n:pending
        eyebrow: "Nutrition digest · {range}", // i18n:pending
        daySoFar: "{date} · so far, {time}", // i18n:pending
        rangeEnds: "{range} · ends yesterday", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein_g: "Protein", // i18n:pending
            carbs_g: "Carbs", // i18n:pending
            fat_g: "Fat", // i18n:pending
            fiber_g: "Fiber", // i18n:pending
            sugar_g: "Sugar", // i18n:pending
            added_sugar_g: "Added sugar", // i18n:pending
            saturated_fat_g: "Saturated fat", // i18n:pending
            trans_fat_g: "Trans fat", // i18n:pending
            sodium_mg: "Sodium", // i18n:pending
            caffeine_mg: "Caffeine", // i18n:pending
            alcohol_g: "Alcohol", // i18n:pending
            water_ml: "Water", // i18n:pending
            weight: "Weight", // i18n:pending
        },
        inline: {
            calories: "calories", // i18n:pending
            protein_g: "protein", // i18n:pending
            carbs_g: "carbs", // i18n:pending
            fat_g: "fat", // i18n:pending
            fiber_g: "fiber", // i18n:pending
            sugar_g: "sugar", // i18n:pending
            added_sugar_g: "added sugar", // i18n:pending
            saturated_fat_g: "saturated fat", // i18n:pending
            trans_fat_g: "trans fat", // i18n:pending
            sodium_mg: "sodium", // i18n:pending
            caffeine_mg: "caffeine", // i18n:pending
            alcohol_g: "alcohol", // i18n:pending
            water_ml: "water", // i18n:pending
            weight: "weight", // i18n:pending
        },
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        drinkLabels: { us: "US drinks", uk: "UK units" }, // i18n:pending
        sep: " · ", // i18n:pending
        verdict: {
            calOverPast: "calories went over", // i18n:pending
            calOverToday: "calories over budget", // i18n:pending
            calOnTrack: "calories on track", // i18n:pending
            calOnTarget: "calories on target", // i18n:pending
            calJustUnder: "calories just under target", // i18n:pending
            calUnder: "calories under target", // i18n:pending
            calMostly: "calories mostly on target", // i18n:pending
            calOverMost: "calories over most days", // i18n:pending
            calUnderMost: "calories under target most days", // i18n:pending
            calSome: "calories on target some days", // i18n:pending
            overPast: "{list} went over", // i18n:pending
            overToday: "{list} over", // i18n:pending
            limitsOver: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            shortPast: "{list} fell short", // i18n:pending
            shortToday: "{list} to go", // i18n:pending
            targetsShortPast: {
                one: "{n} target fell short", // i18n:pending
                other: "{n} targets fell short", // i18n:pending
            },
            targetsShortToday: {
                one: "{n} target to go", // i18n:pending
                other: "{n} targets to go", // i18n:pending
            },
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            rising: "{label} rising", // i18n:pending
            falling: "{label} falling", // i18n:pending
            logged: "logged {n} of {of} days", // i18n:pending
            missTarget: "{label} short most days", // i18n:pending
            missLimit: "{label} often over", // i18n:pending
            noMiss: "no goal missed most days", // i18n:pending
        },
        emptyTitle: {
            today: "Nothing logged today yet", // i18n:pending
            yesterday: "Nothing was logged yesterday", // i18n:pending
            range: "Nothing logged in the last {n} days", // i18n:pending
        },
        emptyText: {
            today: "Meals, water and weigh-ins you log today show up here, with goals and trends.", // i18n:pending
            day: "Meals, water and weigh-ins you log for a day show up here, with goals and trends.", // i18n:pending
            range: "Meals, water and weigh-ins you log over a period show up here, with goals and trends.", // i18n:pending
        },
        intakeDay: "{kcal} kcal · {meals}", // i18n:pending
        intakeRange: "{kcal} kcal a day · logged {n} of {of} days", // i18n:pending
        mealCount: { one: "{n} meal", other: "{n} meals" }, // i18n:pending
        noGoals: "No goals set", // i18n:pending
        averagesOnly: "Only the averages and goals are available in this view.", // i18n:pending
        score: {
            met: "{n} of {of} goals met", // i18n:pending
            onTrack: "{n} of {of} goals on track", // i18n:pending
            mostly: "{n} of {of} goals mostly met", // i18n:pending
            partial: "{score} · partial logs", // i18n:pending
        },
        sections: {
            calories: "Calories", // i18n:pending
            goals: "Goals at a glance", // i18n:pending
            trends: "Trends", // i18n:pending
            nutrients: "Nutrients", // i18n:pending
            cards: "Water & weight", // i18n:pending
            cardsHidden: "Water and weight", // i18n:pending
            meals: "Meals", // i18n:pending
            highlights: "Highlights", // i18n:pending
            rest: "For the rest of today", // i18n:pending
        },
        meta: {
            final: "final", // i18n:pending
            soFar: "so far", // i18n:pending
            rightNow: "right now", // i18n:pending
            daysMet: "days met / logged", // i18n:pending
            dailyAvg: "Daily average, logged days", // i18n:pending
            dayTotal: "Day total", // i18n:pending
            soFarToday: "So far today", // i18n:pending
            tapMeal: "tap a meal for items", // i18n:pending
            habits: "logging habits", // i18n:pending
            last14: "last 14 days", // i18n:pending
            last14Today: "last 14 days · today so far", // i18n:pending
            fewDays: "few days logged · read loosely", // i18n:pending
            vsPrev: "vs previous {n} days (grey)", // i18n:pending
            waterAvg: "water: daily avg", // i18n:pending
        },
        fold: "Fold {section}", // i18n:pending
        unfold: "Unfold {section}", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        gauge: {
            ofGoal: "of {goal} kcal", // i18n:pending
            kcal: "kcal", // i18n:pending
            aria: "{kcal} of {goal} kcal {when}, {pct}% of goal.", // i18n:pending
            ariaNoGoal: "{kcal} kcal {when}.", // i18n:pending
            onDate: "on {date}", // i18n:pending
            soFarToday: "so far today", // i18n:pending
            ariaMeals: "Meals: {list}", // i18n:pending
            ariaMeal: "{name} {kcal} kcal", // i18n:pending
            segment: "{name}, {kcal} kcal", // i18n:pending
            finished: "You finished {b} your goal", // i18n:pending
            kcalUnder: "{x} kcal under", // i18n:pending
            kcalOver: "{x} kcal over", // i18n:pending
            kcalLeft: "{x} kcal left", // i18n:pending
            todayLine: "{b} · {meals} so far", // i18n:pending
            mealsOnly: "{meals}", // i18n:pending
            hint: "Tap a meal piece for details", // i18n:pending
            popMeta: "{meta} · {pct}% of the day’s goal", // i18n:pending
            popMetaNoGoal: "{meta}", // i18n:pending
            totalOnly: "Logged as a total, no items", // i18n:pending
            closeMeal: "Close meal details", // i18n:pending
        },
        range: {
            avg: "avg", // i18n:pending
            kcalDay: "kcal/day", // i18n:pending
            rightOn: "right on your {goal} kcal goal", // i18n:pending
            overGoal: "{x} kcal over your {goal} kcal goal", // i18n:pending
            underGoal: "{x} kcal under your {goal} kcal goal", // i18n:pending
            footMet: "{met} of {n}", // i18n:pending
            footRest: "logged days on target", // i18n:pending
            footOver: "{n} over", // i18n:pending
            footUnder: "{n} under", // i18n:pending
            legendOn: "on target", // i18n:pending
            legendUnder: "under", // i18n:pending
            legendOver: "over", // i18n:pending
            zone: "Target zone {lo}–{hi} kcal", // i18n:pending
            prev: "Previous {n} days: {avg} kcal/day", // i18n:pending
            barNone: "{date}: nothing logged", // i18n:pending
            barOver: "{date}: {kcal} kcal, over goal", // i18n:pending
            barOn: "{date}: {kcal} kcal, on target", // i18n:pending
            barUnder: "{date}: {kcal} kcal, under target", // i18n:pending
            barPlain: "{date}: {kcal} kcal", // i18n:pending
            popSub: "{kcal} kcal · {meals}", // i18n:pending
            popOver: "{x} over", // i18n:pending
            nothingThisDay: "Nothing logged this day", // i18n:pending
            closeDay: "Close day details", // i18n:pending
        },
        groups: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            short: "Short", // i18n:pending
            togo: "To go", // i18n:pending
            met: "Met", // i18n:pending
            onTrack: "On track", // i18n:pending
            mostlyMet: "Mostly met", // i18n:pending
            mixed: "Mixed", // i18n:pending
            mostlyMissed: "Mostly missed", // i18n:pending
            days: { one: "day", other: "days" }, // i18n:pending
            nrDay: {
                one: "{list} wasn’t recorded — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded — left out of the goals.", // i18n:pending
            },
            nrRange: {
                one: "{list} wasn’t recorded on any day — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded on any day — left out of the goals.", // i18n:pending
            },
        },
        trends: {
            rising: "↑ rising", // i18n:pending
            falling: "↓ falling", // i18n:pending
            noClear: "→ no clear trend", // i18n:pending
            steady: "→ steady", // i18n:pending
            avg7: "7-day avg {a}, was {b}", // i18n:pending
            todaySoFar: "Today so far {v}", // i18n:pending
            noneToday: "None so far today", // i18n:pending
            nothingToday: "Nothing logged yet today", // i18n:pending
            dayAboutAvg: "Yesterday ≈ avg", // i18n:pending
            dayVsAvg: "Yesterday {pct}% vs avg", // i18n:pending
            noneDay: "None yesterday", // i18n:pending
            notLoggedDay: "Not logged yesterday", // i18n:pending
            perDay: "{d} a day", // i18n:pending
            was: "was {b} a day", // i18n:pending
            wasAvg: "was {b} avg", // i18n:pending
            steadyNote: "Steady: {list}.", // i18n:pending
            alsoNote: "Also moving: {list}.", // i18n:pending
            mixedNote: "Up and down, no clear trend: {list}.", // i18n:pending
            fewNote: "Too few logged days to tell: {list}.", // i18n:pending
            none: "Not enough logged days yet to show trends.", // i18n:pending
            aria: "{label}: {dir}, {l1}, {l2}", // i18n:pending
            dirWord: {
                rising: "rising", // i18n:pending
                falling: "falling", // i18n:pending
                noClear: "no clear trend", // i18n:pending
                steady: "steady", // i18n:pending
            },
        },
        table: {
            noGoal: "no goal", // i18n:pending
            notRecorded: "not recorded", // i18n:pending
            notLogged: "not logged", // i18n:pending
            over: "+{x} over", // i18n:pending
            short: "{x} short", // i18n:pending
            togo: "{x} to go", // i18n:pending
            met: "met", // i18n:pending
            done: "done", // i18n:pending
            none: "none", // i18n:pending
            under: "{x} under", // i18n:pending
            left: "{x} left", // i18n:pending
            onTarget: "on target", // i18n:pending
            nearLimit: "near limit", // i18n:pending
            atLimit: "at limit", // i18n:pending
            target: "/ ≥ {g}", // i18n:pending
            limit: "/ ≤ {g}", // i18n:pending
            noGoalUnit: "{u} · no goal", // i18n:pending
            sparse: "Only {n} of {of} days logged — averages cover logged days only.", // i18n:pending
            partial: "Recorded on fewer days: {list}.", // i18n:pending
            partialItem: "{label} {n} of {of}", // i18n:pending
            ariaTarget: "{label}: {value}, target {goal}, {delta}", // i18n:pending
            ariaLimit: "{label}: {value}, limit {goal}, {delta}", // i18n:pending
            ariaPlain: "{label}: {value}", // i18n:pending
        },
        water: {
            of: "of {goal}", // i18n:pending
            aDay: "a day", // i18n:pending
            metDays: "goal met {n} of {of} days", // i18n:pending
            noneToday: "No water logged yet today", // i18n:pending
            noneDay: "No water logged that day", // i18n:pending
            noneRange: "No water logged in this period", // i18n:pending
            dot: "{date}: {v}", // i18n:pending
        },
        weight: {
            thisMorning: "Weighed in this morning", // i18n:pending
            thatMorning: "Weighed in that day", // i18n:pending
            last: "Last weigh-in {date}", // i18n:pending
            noChange: "no change", // i18n:pending
            vs: "vs {date}", // i18n:pending
            first: "first weigh-in", // i18n:pending
            latest: "Latest · {date}", // i18n:pending
            since: {
                one: "since {date} · {n} weigh‑in", // i18n:pending
                other: "since {date} · {n} weigh‑ins", // i18n:pending
            },
            only1: "only 1 weigh‑in this period", // i18n:pending
            goal: "Goal {v}", // i18n:pending
            noneRecent: "No recent weigh-in · last {v} on {date}", // i18n:pending
            noneYet: "No weigh-ins yet", // i18n:pending
            nonePeriod: "No weigh-in this period · last {v} on {date}", // i18n:pending
        },
        meals: {
            types: {
                breakfast: "Breakfast", // i18n:pending
                lunch: "Lunch", // i18n:pending
                dinner: "Dinner", // i18n:pending
                snack: "Snack", // i18n:pending
                drink: "Drink", // i18n:pending
            },
            macro: "{x} {label}", // i18n:pending
            totalOnly: "total only", // i18n:pending
            daysLogged: "Days logged", // i18n:pending
            mealsADay: "Meals a day", // i18n:pending
            ofDays: "{n} of {of}", // i18n:pending
            typical: "Typical times", // i18n:pending
            typicalItem: "{type} {time}", // i18n:pending
            topFoods: "Top foods by calories", // i18n:pending
            times: "×{n}", // i18n:pending
            best: "Best day", // i18n:pending
            tough: "Toughest day", // i18n:pending
            goalsMet: "{n} of {of} goals met", // i18n:pending
            whyOver: "{list} over", // i18n:pending
            whyLimits: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            whyShort: "{list} short", // i18n:pending
            whyAll: "every recorded goal met", // i18n:pending
        },
        highlights: {
            count: { one: "{n} highlight", other: "{n} highlights" }, // i18n:pending
            sugarA: "Biggest sugar source: ", // i18n:pending
            sugarAToday: "Biggest sugar source so far: ", // i18n:pending
            times: " (×{n})", // i18n:pending
            sugarDay: " — {g}, {pct}% of the day’s sugar.", // i18n:pending
            sugarToday: " — {g}, {pct}% of today’s sugar.", // i18n:pending
            sugarRange: " — {g}, {pct}% of the period’s sugar.", // i18n:pending
            streakA: "Calories in the target zone ", // i18n:pending
            streakB: { one: "{n} day in a row", other: "{n} days in a row" }, // i18n:pending
            streakToday: " up to yesterday.", // i18n:pending
            streakPast: " — the current streak.", // i18n:pending
            gapsA: "Gaps in the log: ", // i18n:pending
            gapsB: {
                one: "{n} day with nothing logged", // i18n:pending
                other: "{n} days with nothing logged", // i18n:pending
            },
            gapsC: " — averages cover logged days only.", // i18n:pending
            overRange: {
                one: "{label} went over on {n} day", // i18n:pending
                other: "{label} went over on {n} days", // i18n:pending
            },
            overToday: "{label} is over so far", // i18n:pending
            overPast: "{label} went over", // i18n:pending
            overEach: " — largest source: {name}, {x} each time (×{n}).", // i18n:pending
            overTotal: " — largest source: {name}, {x} in total (×{n}).", // i18n:pending
            overOnce: " — largest source: {name}, {x}.", // i18n:pending
            shortRange: {
                one: "{label} fell short on {n} day", // i18n:pending
                other: "{label} fell short on {n} days", // i18n:pending
            },
            shortToday: "{label} is still short", // i18n:pending
            shortPast: "{label} fell short", // i18n:pending
            shortFood: " — {name}, logged before, has {x} for {kcal} kcal.", // i18n:pending
            allMetA: "Nothing missed: ", // i18n:pending
            allMetRange: "every goal mostly met", // i18n:pending
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            allMetC: ".", // i18n:pending
        },
        rest: {
            kcalLeft: "Calories left", // i18n:pending
            kcalOver: "Calories over", // i18n:pending
            water: "Water still to drink", // i18n:pending
            togo: "{label} still to go", // i18n:pending
            foodLabel: "Logged before:", // i18n:pending
            food: "{name} — {x} {label}, {kcal} kcal.", // i18n:pending
            summary: {
                one: "{n} amount left", // i18n:pending
                other: "{n} amounts left", // i18n:pending
            },
            reached: "every target reached so far", // i18n:pending
        },
        facts: {
            water: "Water {v}", // i18n:pending
            waterOf: "Water {v} of {goal}", // i18n:pending
            waterDay: "Water {v} a day", // i18n:pending
            weight: "{v}", // i18n:pending
            weightChg: "{v} ({chg})", // i18n:pending
            trend: "{label} {dir}", // i18n:pending
            biggest: "Biggest meal: {name}", // i18n:pending
        },
        summaries: {
            over: "{n} over", // i18n:pending
            near: "{n} near limit", // i18n:pending
            short: "{n} short", // i18n:pending
            togo: "{n} to go", // i18n:pending
            met: "{n} met", // i18n:pending
            onTrack: "{n} on track", // i18n:pending
            mostlyMet: "{n} mostly met", // i18n:pending
            mixed: "{n} mixed", // i18n:pending
            mostlyMissed: "{n} mostly missed", // i18n:pending
            noGoals: "no goals recorded", // i18n:pending
            rising: "{n} rising", // i18n:pending
            falling: "{n} falling", // i18n:pending
            steady: "{n} steady", // i18n:pending
            notEnough: "not enough data", // i18n:pending
            metrics: { one: "{n} metric", other: "{n} metrics" }, // i18n:pending
            water: "Water {v}", // i18n:pending
            noWater: "no water", // i18n:pending
            weight: "Weight {v}", // i18n:pending
            noWeigh: "no weigh-in", // i18n:pending
            daysLogged: "{n} of {of} days logged", // i18n:pending
            mealSpan: "{meals} · {from}–{to}", // i18n:pending
        },
    },
};

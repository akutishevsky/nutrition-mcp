import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_FR: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calories",
            protein_g: "Protéines",
            carbs_g: "Glucides",
            fat_g: "Lipides",
            sugar_g: "Sucres",
            added_sugar_g: "Sucres ajoutés",
            saturated_fat_g: "Acides gras saturés",
            trans_fat_g: "Acides gras trans",
            alcohol_g: "Alcool",
            caffeine_mg: "Caféine",
            sodium_mg: "Sodium",
            fiber_g: "Fibres",
            water_ml: "Eau",
        },
        noGoalSet: "aucun objectif",
        atLimit: "limite atteinte",
        floorUnder: "à prendre",
        ceilingUnder: "de marge",
        over: "en trop",
        limitPrefix: "limite",
        ofPrefix: "sur",
        drinkLabels: { us: "verres US", uk: "unités UK" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "rien d'enregistré",
        notRecorded: "non renseigné",
        caloriesToday: "Calories du jour",
        caloriesOn: "Calories · {date}",
        tapHint: "Touche une valeur pour voir les repas concernés",
        showMealsContributed: "Afficher les repas concernés.",
        byMealTitle: "{label} par repas",
        closeBreakdown: "Fermer le détail",
        noMealsContributed: "{label} : aucun repas enregistré n'y a contribué.",
        untitledMeal: "Repas sans nom",
        moreMeals: {
            one: "+ {n} repas plus petit",
            other: "+ {n} repas plus petits",
        },
        moreMealsAtLeast: {
            one: "+ au moins {n} repas plus petit",
            other: "+ au moins {n} repas plus petits",
        },
        moreMealsMaybe: "+ peut-être d'autres repas plus petits",
        ingredientCount: {
            one: "{n} ingrédient",
            other: "{n} ingrédients",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "perso",
        sourceEst: "est.",
        sourceMixed: "mixte",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "code-barres",
        sourceDataType: "type de données",
        sourceAria: "Source : {source}",
        sourceDetailsAria: "Afficher les détails de la source",
    },
    bridge: {
        settingsFooter:
            "Tu peux activer ou désactiver ces widgets quand tu veux : il suffit de demander à modifier tes paramètres.",
        connectFailed: "Cette vue n'a pas pu se connecter à son hôte.",
    },
    nutritionSummary: {
        title: "Résumé nutritionnel",
        loading: "Chargement de ton résumé nutritionnel…",
        empty: "Aucun repas ni apport d'eau enregistré sur cette période.",
        caloriesPerDay: "Calories / jour",
        daysLogged: {
            one: "{n} jour renseigné",
            other: "{n} jours renseignés",
        },
        daysOfLogged: "{logged} jours renseignés sur {span}",
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
            "janv.",
            "févr.",
            "mars",
            "avr.",
            "mai",
            "juin",
            "juil.",
            "août",
            "sept.",
            "oct.",
            "nov.",
            "déc.",
        ],
    },
    goalProgress: {
        loading: "Chargement de ta progression…",
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
        loading: "Chargement de tes tendances…",
        windowAriaLabel: "Période",
        segWeek: "Sem.",
        segMonth: "Mois",
        segQuarter: "Trim.",
        segYear: "Année",
        segDays: "Jours",
        segWeekAria: "Afficher les moyennes hebdomadaires",
        segMonthAria: "Afficher les moyennes mensuelles",
        segQuarterAria: "Afficher les moyennes trimestrielles",
        segYearAria: "Afficher les moyennes annuelles",
        segDaysAria: "Afficher les tendances quotidiennes",
        periodTitleWeek: "Moyennes hebdomadaires",
        periodTitleMonth: "Moyennes mensuelles",
        periodTitleQuarter: "Moyennes trimestrielles",
        periodTitleYear: "Moyennes annuelles",
        perLoggedDay: "par jour renseigné",
        daysLogged: "{logged}/{total} jours",
        onTarget: "dans l'objectif {k}/{n}",
        possiblyIncomplete: {
            one: "{n} peut-être incomplet",
            other: "{n} peut-être incomplets",
        },
        partial: "en cours",
        nothingLogged: "rien de renseigné",
        targetsChanged: "objectifs modifiés en cours de période",
        targetsAssumed: "objectifs avant le {date} non enregistrés",
        noTargets: "Aucun objectif défini : moyennes seules.",
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
        loading: "Chargement de l'évolution de ton poids…",
        empty: "Aucun poids enregistré sur cette période pour l'instant.",
        eyebrowToday: "Poids · aujourd'hui",
        eyebrowLast: "Poids · dernière pesée {date}",
        titleFirst: "Première pesée enregistrée",
        titleFew: "Encore peu de pesées",
        titleNoRate: "Pas assez de pesées récentes pour un rythme hebdomadaire",
        titleSteady: "Stable",
        titleDown: "Tendance à la baisse",
        titleUp: "Tendance à la hausse",
        titleGoalReached: "Objectif atteint",
        titleAway: "Tu t'éloignes de ton objectif",
        titleOnTrack: "En bonne voie vers ton objectif",
        titleShortSteady: "Stable, objectif pas encore atteint",
        rangeGroupAriaLabel: "Période",
        ranges: {
            "7": {
                label: "7 j",
                aria: "Afficher les 7 derniers jours",
                word: "les 7 derniers jours",
                inRange: "en 7 jours",
                heading: "7 derniers jours",
                chip: "7 j",
            },
            "30": {
                label: "30 j",
                aria: "Afficher les 30 derniers jours",
                word: "les 30 derniers jours",
                inRange: "en 30 jours",
                heading: "30 derniers jours",
                chip: "30 j",
            },
            "90": {
                label: "90 j",
                aria: "Afficher les 90 derniers jours",
                word: "les 90 derniers jours",
                inRange: "en 90 jours",
                heading: "90 derniers jours",
                chip: "90 j",
            },
            "1y": {
                label: "1 an",
                aria: "Afficher la dernière année",
                word: "la dernière année",
                inRange: "en un an",
                heading: "dernière année",
                chip: "1 an",
            },
            all: {
                label: "Tout",
                aria: "Afficher tout l'historique",
                word: "tout l'historique",
                inRange: "au total",
                heading: "tout l'historique",
                chip: "Tout",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} par semaine",
        perWeekAvg: "{amount} par semaine en moyenne",
        toGoal: "{value} avant l'objectif",
        weeksApprox: {
            one: "~{n} semaine",
            other: "~{n} semaines",
        },
        yearsPlus: "2 ans et +",
        reachedOn: "atteint le {date}",
        movingAway: "s'éloigne de l'objectif",
        tooFlat: "trop plat pour estimer une date",
        hintFew:
            "Une courbe de tendance demande au moins 4 pesées sur la période",
        hintNoRate:
            "Le rythme hebdomadaire demande 4 pesées sur les 3 dernières semaines",
        statPerWeek: "Par semaine",
        statGoalPace: "Objectif à ce rythme",
        statGoalReached: "Objectif atteint",
        statToGoal: "Avant l'objectif",
        statSince: "Depuis {date}",
        unitWeeks: {
            one: "semaine",
            other: "semaines",
        },
        unitYears: "ans",
        goalPill: "Objectif {goal} · encore {left}",
        goalPillReached: "Objectif {goal} ✓",
        goalBelow: "Objectif {goal}  ↓ {left} en dessous",
        goalAbove: "Objectif {goal}  ↑ {left} au-dessus",
        today: "Aujourd'hui",
        yesterday: "Hier",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (moyenne de {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, moyenne de {n}",
        chartAriaLabel:
            "Graphique du poids, dernier {latest}{goal}{change}. Touche un jour pour lire sa valeur.",
        chartAriaGoal: ", objectif {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Fermer",
        oneTitleFirst: "Ta tendance commence ici",
        oneTitle: "Une seule pesée sur {range}",
        oneFirst: "Première pesée · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "Le graphique commence avec une deuxième pesée",
        oneHintEarlier: {
            one: "{n} jour de pesée antérieur dans les périodes plus longues",
            other: "{n} jours de pesée antérieurs dans les périodes plus longues",
        },
        emptyRange: "Aucune pesée sur {range}.",
        emptyRangeLast: "Aucune pesée sur {range}. La dernière date du {date}.",
        showMore: "Afficher plus",
        showLess: "Afficher moins",
        detailsAria: "{action} : pesées et mensurations",
        detailsAriaWeighIns: "{action} : pesées",
        collapseAll: "Tout replier",
        sectionWeighIns: "Pesées",
        sectionMeasurements: "Mensurations · {range}",
        accLabel: {
            one: "{n} pesée {range}",
            other: "{n} pesées {range}",
        },
        accEmpty: "Aucune pesée {range}",
        accAvgRange: "moy. {avg} · plage {min}–{max}",
        loggedToday: "enregistrée aujourd'hui",
        loggedYesterday: "enregistrée hier",
        loggedOn: "enregistrée le {date}",
        weekThis: "Cette semaine",
        weekLast: "La semaine dernière",
        weekAvg: "moy. {value}",
        weekVsLast: "{change} vs la semaine dernière",
        weekVsBefore: "{change} vs la semaine précédente",
        dayMulti: {
            one: "{n} pesée · moyenne",
            other: "{n} pesées · moyenne",
        },
        showEarlierWeeks: {
            one: "Afficher {n} semaine précédente",
            other: "Afficher {n} semaines précédentes",
        },
        sites: {
            waist: "Taille",
            hips: "Hanches",
            neck: "Cou",
            chest: "Poitrine",
            shoulders: "Épaules",
            upper_arm: "Bras",
            forearm: "Avant-bras",
            thigh: "Cuisse",
            calf: "Mollet",
        },
        measSince: "{change} depuis le {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ inchangé",
        measFirst: "première mesure · {date}",
        measFirstRow: "première",
        measStale: "pas mesuré sur cette période · dernière fois le {date}",
        measEarlier: "Mesures précédentes",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "Afficher {n} de plus",
            other: "Afficher {n} de plus",
        },
        noMeasurements:
            "Aucune mensuration sur la dernière année. La taille, les hanches et sept autres zones peuvent être suivies en centimètres ou en pouces.",
    },
    importMeals: {
        loading: "Préparation de l'import…",
        stepFile: "Fichier",
        stepMap: "Colonnes",
        stepPreview: "Aperçu",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Date et heure",
            description: "Nom de l'aliment",
            meal_type: "Repas",
            calories: "Calories",
            protein_g: "Protéines (g)",
            carbs_g: "Glucides (g)",
            fat_g: "Lipides (g)",
            fiber_g: "Fibres (g)",
            sugar_g: "Sucres totaux (g)",
            added_sugar_g: "Sucres ajoutés (g)",
            saturated_fat_g: "Acides gras saturés (g)",
            trans_fat_g: "Acides gras trans (g)",
            alcohol_g: "Alcool (g)",
            caffeine_mg: "Caféine (mg)",
            sodium_mg: "Sodium (mg)",
            notes: "Notes",
            time: "Heure (colonne à part)",
            deleted: "Indicateur de suppression",
            source_id: "ID du repas (de notre export)",
            timezone: "Fuseau horaire (de notre export)",
        },
        chooseExportHeading: "Choisis ton export",
        noToolsWarning:
            "Cet hôte ne permet pas à cette vue d'écrire dans ton journal. Demande plutôt à Claude d'importer le fichier : il peut le faire directement.",
        emailFallback:
            "Si ça ne marche pas non plus en passant par Claude, écris à {email}.",
        tzWarning:
            "Ton fuseau horaire n'est pas défini : les heures seront lues en UTC et risquent de tomber sur le mauvais jour. Demande d'abord à Claude de définir ton fuseau horaire.",
        dropChoose: "Choisis un fichier CSV",
        dropOr: "ou glisse-le ici",
        recognizedHint:
            "Les exports de MyFitnessPal, Cronometer, Lose It! et MacroFactor sont reconnus automatiquement. Rien n'est enregistré tant que tu n'as pas confirmé.",
        dateMapHint:
            "Associe une colonne de date ci-dessus pour voir comment une valeur de ton fichier est convertie.",
        dateNoneHint: "Cette colonne ne contient aucune date.",
        dateUnreadable:
            "{raw} → illisible au format {format}, les lignes de ce type seront donc ignorées",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Associe une colonne de calories ci-dessus pour voir comment une valeur de ton fichier est convertie.",
        energyNoneHint: "Cette colonne ne contient aucun nombre.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (sans conversion)",
        dateAmbiguousWarning:
            "Impossible de déterminer le format de date de ce fichier : ses dates se lisent aussi bien jour en premier que mois en premier. Confirme le format exporté par ton app : un mauvais choix classe les repas au mauvais jour, sans aucun message d'erreur.",
        dateFormatLabel: "Format de date de ce fichier",
        dateFormatYmd: "Année-Mois-Jour",
        dateFormatDmy: "Jour/Mois/Année",
        dateFormatMdy: "Mois/Jour/Année",
        energyUnitLabel: "Unité d'énergie de la colonne calories",
        energyUnitKcal: "Calories",
        energyUnitKj: "Kilojoules",
        mapColumnsHeading: "Associer les colonnes",
        rowsCount: { one: "{n} ligne", other: "{n} lignes" },
        columnsCount: { one: "{n} colonne", other: "{n} colonnes" },
        delimiterLabel: "séparateur",
        tabLabel: "tabulation",
        notInFile: "(pas dans ce fichier)",
        columnFallback: "colonne {n}",
        caffeineGramsNotice:
            "La colonne caféine de ce fichier ({column}) est en grammes, alors que la caféine est enregistrée en milligrammes : Caféine n'a donc pas été associée. L'associer enregistrerait 0,18 là où l'étiquette indique 180 mg. Réimporter le même fichier plus tard ne comblera pas ce manque : ces lignes seront déjà enregistrées et seront ignorées comme doublons. Si l'en-tête est mal libellé et que les valeurs sont bien en milligrammes, sélectionne-la ci-dessus ; si elles sont bien en grammes, multiplie-les par 1 000 dans le fichier avant l'import, pas après.",
        alcoholNotice:
            "Ce fichier contient une colonne alcool ({column}), mais le suivi de l'alcool est désactivé pour ce compte : elle ne sera donc pas importée. Réimporter le même fichier plus tard ne comblera pas ce manque : ces lignes seront déjà enregistrées et seront ignorées comme doublons. Pour conserver ces données, demande à Claude d'activer le suivi de l'alcool (set_alcohol_tracking) avant l'import.",
        sampleValue: "ex. {sample}",
        sourceAppLabel: "App source (facultatif)",
        sourceAppHint: "Sert à nommer les lignes sans nom d'aliment.",
        previewButton: "Aperçu de l'import",
        chooseAnotherButton: "Choisir un autre fichier",
        previewHeading: "Aperçu",
        datesReadAs: "Dates lues au format {format} ; énergie {conversion}.",
        energyConvertedNote: "convertie de kJ en kcal",
        energyReadAsKcal: "lue en kcal",
        badDatesWarning: {
            one: "{n} ligne a été ignorée, car sa date n'a pas pu être lue au format {format}{sample}. Reviens en arrière et choisis le format de date de ton fichier.",
            other: "{n} lignes ont été ignorées, car leur date n'a pas pu être lue au format {format}{sample}. Reviens en arrière et choisis le format de date de ton fichier.",
        },
        badDateSample: " (ex. ligne {line} : {value})",
        noTimeWarning: {
            one: "{n} ligne a une date mais pas d'heure : elle sera enregistrée à midi.",
            other: "{n} lignes ont une date mais pas d'heure : elles seront enregistrées à midi.",
        },
        splitDatesCount: {
            one: "{n} date compte",
            other: "{n} dates comptent",
        },
        splitDatesWarning:
            " plus de {max} repas (ex. {date}), l'import a donc dû être réparti sur plusieurs lots. Si cette date contient deux entrées avec exactement le même aliment, le même type de repas et les mêmes macros, l'une d'elles risque d'être ignorée comme doublon au lieu d'être importée.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "G",
            fat_g: "L",
            fiber_g: "Fib",
            sugar_g: "Suc",
            added_sugar_g: "Ajout",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Ligne",
        tableWhen: "Quand",
        tableMeal: "Repas",
        tableFood: "Aliment",
        tableProblem: "Problème",
        noNameFallback: "(sans nom : sera nommé d'après le repas)",
        showingRows: "{shown} lignes affichées sur {total}",
        checkingRows: {
            one: "Vérification de {n} ligne…",
            other: "Vérification de {n} lignes…",
        },
        importingRows: {
            one: "Import de {n} ligne…",
            other: "Import de {n} lignes…",
        },
        batchProgress: "{label} (lot {done} sur {total})",
        rowsRange: "Lignes {a}–{b} : {msg}",
        preflightFailed: "Échec de la vérification préalable.",
        rowsWouldFail: {
            one: "{n} ligne échouerait, ex. ligne {line} : {message}",
            other: "{n} lignes échoueraient, ex. ligne {line} : {message}",
        },
        importingEllipsis: "Import en cours…",
        importButton: {
            one: "Importer {n} repas",
            other: "Importer {n} repas",
        },
        backToMapping: "Retour aux colonnes",
        importCompleteHeading: "Import terminé",
        resultMealsImported: {
            one: "{n} repas importé",
            other: "{n} repas importés",
        },
        resultAlreadyLogged: {
            one: ", {n} déjà enregistré",
            other: ", {n} déjà enregistrés",
        },
        resultFailed: {
            one: ", {n} en échec",
            other: ", {n} en échec",
        },
        resultSkipped: {
            one: ", {n} ignoré",
            other: ", {n} ignorés",
        },
        restartButton: "Importer un autre fichier",
        couldNotReadFile: "Impossible de lire ce fichier : {msg}",
        noDataRows: "Aucune ligne de données dans ce fichier.",
        emailNotice:
            "Ça ne marche pas comme prévu ? Écris à {email} en joignant les lignes ci-dessous : c'est tout ce qu'il faut pour diagnostiquer le problème.",
        eyebrow: "Importer des repas",
        eyebrowWithFile: "Importer des repas · {file}",
        stepsLabel: "Étapes de l'import",
        stepAriaDone: "Étape {i} sur 4 : {name}, terminée",
        stepAriaCurrent: "Étape {i} sur 4 : {name}, en cours",
        stepAriaUpcoming: "Étape {i} sur 4 : {name}",
        browseFiles: "Parcourir les fichiers",
        dropAccept: ".csv ou texte séparé par des tabulations",
        dropAria: "Choisis un fichier CSV ou glisse-le ici",
        privacyNote:
            "Le fichier est lu ici, dans ce panneau. Ses lignes ne passent jamais par le chat : l'assistant ne reçoit qu'un résumé d'une ligne à la fin de l'import.",
        binaryFile:
            "Impossible de lire ce fichier : il ressemble à un fichier binaire (un classeur Excel ?), pas à du texte CSV. Exporte-le en CSV et réessaie.",
        columnsHeading: "Colonnes",
        fieldsMatched: {
            one: "{n} champ associé sur {total}",
            other: "{n} champs associés sur {total}",
        },
        tableFieldHead: "Champ",
        tableColumnHead: "Colonne de ton fichier",
        tableRow1Head: "Valeur de la ligne 1",
        badgeNew: "nouveau",
        colNumber: "Col. {n}",
        colNumberAuto: "Col. {n} · auto",
        colNumberManual: "Col. {n} · choisie par toi",
        row1Empty: "ligne 1 vide",
        alsoUsed: "aussi {field}",
        sameColumn: "Même colonne que {fields}",
        columnForAria: "Colonne pour {field}",
        mapRowAria: "{field}{required} : {column}{sample}",
        requiredAria: ", obligatoire",
        columnAria: "colonne {n}, {name}",
        notInFileAria: "pas dans ce fichier",
        sampleAria: ", {sample}",
        howRead: "Lecture des valeurs",
        appExport: "Export {app}",
        tileMeals: { one: "repas à importer", other: "repas à importer" },
        tileKcal: "kcal au total",
        tileSkipped: { one: "ligne ignorée", other: "lignes ignorées" },
        tileBatches: { one: "lot", other: "lots" },
        rowsHeading: "Lignes",
        scrollLeft: "Faire défiler le tableau vers la gauche",
        scrollRight: "Faire défiler le tableau vers la droite",
        previewRegionAria: "Aperçu des lignes à importer",
        expandAllDays: "Déplier tous les jours",
        collapseAllDays: "Replier tous les jours",
        dayRows: { one: "{n} ligne", other: "{n} lignes" },
        dayRowsKcal: {
            one: "{n} ligne · {kcal} kcal",
            other: "{n} lignes · {kcal} kcal",
        },
        noTimeShort: "sans heure",
        lineN: "Ligne {n}",
        rowCardAria: "Ligne {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "aucun repas",
        noKcalAria: "aucune calorie",
        noRowsToImport: "Aucune ligne à importer avec l'association actuelle.",
        importOff:
            "L'import est désactivé : cet hôte ne permet pas à cette vue d'écrire dans ton journal. Demande plutôt à Claude d'importer le fichier.",
        backBusy: "Retour indisponible pendant l'envoi des lots.",
        progressAria: "Progression de l'import, lots",
        failedRowsAria: "Lignes en échec",
        toldOnly: "L'assistant a seulement reçu : {summary}",
        liveStep: "Étape {i} sur 4, {name}.",
        liveMapped: "{field} : {column}",
        liveImporting: {
            one: "Import en cours. {n} lot.",
            other: "Import en cours. {n} lots.",
        },
        liveDone: {
            one: "Import terminé. {n} repas importé.",
            other: "Import terminé. {n} repas importés.",
        },
        liveNoWrite:
            "La vérification préalable a échoué. Rien n'a été enregistré.",
        liveFileError: "Impossible d'utiliser ce fichier.",
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

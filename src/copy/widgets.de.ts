import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_DE: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalorien",
            protein_g: "Protein",
            // Not the full "Kohlenhydrate": it truncates in the compact
            // three-column macro tile (visually confirmed against the
            // assembled widget) the way "Protein"/"Fett" don't.
            carbs_g: "Kohlenh.",
            fat_g: "Fett",
            sugar_g: "Zucker",
            added_sugar_g: "Zugesetzter Zucker",
            saturated_fat_g: "Gesättigte Fettsäuren",
            trans_fat_g: "Transfette",
            alcohol_g: "Alkohol",
            caffeine_mg: "Koffein",
            sodium_mg: "Natrium",
            fiber_g: "Ballaststoffe",
            water_ml: "Wasser",
        },
        noGoalSet: "kein Ziel gesetzt",
        atLimit: "am Limit",
        floorUnder: "übrig",
        ceilingUnder: "darunter",
        over: "darüber",
        limitPrefix: "Limit",
        ofPrefix: "von",
        drinkLabels: { us: "US-Drinks", uk: "UK-Einheiten" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "l",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nichts erfasst",
        notRecorded: "nicht erfasst",
        caloriesToday: "Kalorien heute",
        caloriesOn: "Kalorien · {date}",
        tapHint: "Tipp auf einen Wert, um die Mahlzeiten dazu zu sehen",
        showMealsContributed:
            "Mahlzeiten anzeigen, die dazu beigetragen haben.",
        byMealTitle: "{label} pro Mahlzeit",
        closeBreakdown: "Aufschlüsselung schließen",
        noMealsContributed: "Keine erfasste Mahlzeit enthält {label}.",
        untitledMeal: "Mahlzeit ohne Namen",
        moreMeals: {
            one: "+ {n} kleinere Mahlzeit",
            other: "+ {n} kleinere Mahlzeiten",
        },
        moreMealsAtLeast: {
            one: "+ {n} oder mehr kleinere Mahlzeiten",
            other: "+ {n} oder mehr kleinere Mahlzeiten",
        },
        moreMealsMaybe: "+ evtl. weitere kleinere Mahlzeiten",
        ingredientCount: {
            one: "{n} Zutat",
            other: "{n} Zutaten",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "eigene",
        sourceEst: "gesch.",
        sourceMixed: "gemischt",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "Barcode",
        sourceDataType: "Datentyp",
        sourceAria: "Quelle: {source}",
        sourceDetailsAria: "Quellendetails anzeigen",
    },
    bridge: {
        settingsFooter:
            "Du kannst diese Widgets jederzeit ein- oder ausschalten – sag einfach Bescheid, wenn du deine Einstellungen ändern willst.",
        connectFailed:
            "Diese Ansicht konnte sich nicht mit ihrem Host verbinden.",
    },
    nutritionSummary: {
        title: "Ernährungsübersicht",
        loading: "Ernährungsübersicht wird geladen …",
        empty: "Keine Mahlzeiten und kein Wasser in diesem Zeitraum erfasst.",
        caloriesPerDay: "Kalorien / Tag",
        daysLogged: {
            one: "{n} Tag erfasst",
            other: "{n} Tage erfasst",
        },
        daysOfLogged: "{logged} von {span} Tagen erfasst",
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
    goalProgress: {
        loading: "Zielfortschritt wird geladen …",
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
        loading: "Trends werden geladen …",
        windowAriaLabel: "Trendzeitraum",
        segWeek: "Woche",
        segMonth: "Monat",
        segQuarter: "Quart.",
        segYear: "Jahr",
        segDays: "Tage",
        segWeekAria: "Wochendurchschnitte anzeigen",
        segMonthAria: "Monatsdurchschnitte anzeigen",
        segQuarterAria: "Quartalsdurchschnitte anzeigen",
        segYearAria: "Jahresdurchschnitte anzeigen",
        segDaysAria: "Tagestrends anzeigen",
        periodTitleWeek: "Wochendurchschnitte",
        periodTitleMonth: "Monatsdurchschnitte",
        periodTitleQuarter: "Quartalsdurchschnitte",
        periodTitleYear: "Jahresdurchschnitte",
        perLoggedDay: "pro erfasstem Tag",
        daysLogged: "{logged}/{total} Tage",
        onTarget: "im Ziel {k}/{n}",
        possiblyIncomplete: {
            one: "{n} evtl. unvollständig",
            other: "{n} evtl. unvollständig",
        },
        partial: "laufend",
        nothingLogged: "nichts erfasst",
        targetsChanged: "Ziele im Zeitraum geändert",
        targetsAssumed: "Ziele vor dem {date} nicht erfasst",
        noTargets: "Keine Ziele gesetzt – nur Durchschnitte.",
        quarter: "Q{q} {year}",
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
        loading: "Gewichtsverlauf wird geladen …",
        empty: "Noch kein Gewicht in diesem Zeitraum erfasst.",
        eyebrowToday: "Gewicht · heute",
        eyebrowLast: "Gewicht · zuletzt gewogen {date}",
        titleFirst: "Erste Messung erfasst",
        titleFew: "Bisher erst wenige Messungen",
        titleNoRate: "Zu wenige aktuelle Messungen für eine Wochenrate",
        titleSteady: "Stabil",
        titleDown: "Tendenz fallend",
        titleUp: "Tendenz steigend",
        titleGoalReached: "Ziel erreicht",
        titleAway: "Du entfernst dich von deinem Ziel",
        titleOnTrack: "Auf Kurs zu deinem Ziel",
        titleShortSteady: "Stabil, aber noch nicht am Ziel",
        rangeGroupAriaLabel: "Zeitraum",
        ranges: {
            "7": {
                label: "7 T",
                aria: "Letzte 7 Tage anzeigen",
                word: "in den letzten 7 Tagen",
                inRange: "in 7 Tagen",
                heading: "letzte 7 Tage",
                chip: "7 T",
            },
            "30": {
                label: "30 T",
                aria: "Letzte 30 Tage anzeigen",
                word: "in den letzten 30 Tagen",
                inRange: "in 30 Tagen",
                heading: "letzte 30 Tage",
                chip: "30 T",
            },
            "90": {
                label: "90 T",
                aria: "Letzte 90 Tage anzeigen",
                word: "in den letzten 90 Tagen",
                inRange: "in 90 Tagen",
                heading: "letzte 90 Tage",
                chip: "90 T",
            },
            "1y": {
                label: "1 J",
                aria: "Letztes Jahr anzeigen",
                word: "im letzten Jahr",
                inRange: "in einem Jahr",
                heading: "letztes Jahr",
                chip: "1 J",
            },
            all: {
                label: "Alle",
                aria: "Gesamten Verlauf anzeigen",
                word: "im gesamten Verlauf",
                inRange: "insgesamt",
                heading: "gesamter Verlauf",
                chip: "Alle",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} pro Woche",
        perWeekAvg: "{amount} pro Woche im Schnitt",
        toGoal: "{value} bis zum Ziel",
        weeksApprox: {
            one: "~{n} Woche",
            other: "~{n} Wochen",
        },
        yearsPlus: "2+ Jahre",
        reachedOn: "erreicht am {date}",
        movingAway: "entfernt sich vom Ziel",
        tooFlat: "zu flach für ein Zieldatum",
        hintFew: "Eine Trendlinie braucht mindestens 4 Messungen im Zeitraum",
        hintNoRate:
            "Die Wochenrate braucht 4 Messungen in den letzten 3 Wochen",
        statPerWeek: "Pro Woche",
        statGoalPace: "Ziel bei diesem Tempo",
        statGoalReached: "Ziel erreicht",
        statToGoal: "Bis zum Ziel",
        statSince: "Seit {date}",
        unitWeeks: {
            one: "Woche",
            other: "Wochen",
        },
        unitYears: "Jahre",
        goalPill: "Ziel {goal} · noch {left}",
        goalPillReached: "Ziel {goal} ✓",
        goalBelow: "Ziel {goal}  ↓ {left} darunter",
        goalAbove: "Ziel {goal}  ↑ {left} darüber",
        today: "Heute",
        yesterday: "Gestern",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (Ø aus {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, Durchschnitt aus {n}",
        chartAriaLabel:
            "Gewichtsdiagramm, zuletzt {latest}{goal}{change}. Tippe auf einen Tag, um seinen Wert zu sehen.",
        chartAriaGoal: ", Ziel {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Schließen",
        oneTitleFirst: "Hier beginnt dein Verlauf",
        oneTitle: "Nur eine Messung {range}",
        oneFirst: "Erste Messung · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "Das Diagramm beginnt mit der zweiten Messung",
        oneHintEarlier: {
            one: "{n} früherer Messtag in längeren Zeiträumen",
            other: "{n} frühere Messtage in längeren Zeiträumen",
        },
        emptyRange: "Keine Messungen {range}.",
        emptyRangeLast: "Keine Messungen {range}. Die letzte war am {date}.",
        showMore: "Mehr anzeigen",
        showLess: "Weniger anzeigen",
        detailsAria: "{action}: Messungen und Körpermaße",
        detailsAriaWeighIns: "{action}: Messungen",
        collapseAll: "Alle einklappen",
        sectionWeighIns: "Messungen",
        sectionMeasurements: "Körpermaße · {range}",
        accLabel: {
            one: "{n} Messung {range}",
            other: "{n} Messungen {range}",
        },
        accEmpty: "Keine Messungen {range}",
        accAvgRange: "Ø {avg} · Spanne {min}–{max}",
        loggedToday: "heute erfasst",
        loggedYesterday: "gestern erfasst",
        loggedOn: "erfasst am {date}",
        weekThis: "Diese Woche",
        weekLast: "Letzte Woche",
        weekAvg: "Ø {value}",
        weekVsLast: "{change} ggü. letzter Woche",
        weekVsBefore: "{change} ggü. der Woche davor",
        dayMulti: {
            one: "{n} Messung · gemittelt",
            other: "{n} Messungen · gemittelt",
        },
        showEarlierWeeks: {
            one: "{n} frühere Woche anzeigen",
            other: "{n} frühere Wochen anzeigen",
        },
        sites: {
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
        measSince: "{change} seit {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ unverändert",
        measFirst: "erste Messung · {date}",
        measFirstRow: "erste",
        measStale: "in diesem Zeitraum nicht gemessen · zuletzt am {date}",
        measEarlier: "Frühere Messungen",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "{n} weitere anzeigen",
            other: "{n} weitere anzeigen",
        },
        noMeasurements:
            "Keine Körpermaße im letzten Jahr. Taille, Hüfte und sieben weitere Stellen lassen sich in Zentimetern oder Zoll erfassen.",
    },
    importMeals: {
        loading: "Import wird vorbereitet …",
        stepFile: "Datei",
        stepMap: "Zuordnen",
        stepPreview: "Vorschau",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Datum / Uhrzeit",
            description: "Name des Lebensmittels",
            meal_type: "Mahlzeit",
            calories: "Kalorien",
            protein_g: "Protein (g)",
            carbs_g: "Kohlenhydrate (g)",
            fat_g: "Fett (g)",
            fiber_g: "Ballaststoffe (g)",
            sugar_g: "Gesamtzucker (g)",
            added_sugar_g: "Zugesetzter Zucker (g)",
            saturated_fat_g: "Gesättigte Fettsäuren (g)",
            trans_fat_g: "Transfette (g)",
            alcohol_g: "Alkohol (g)",
            caffeine_mg: "Koffein (mg)",
            sodium_mg: "Natrium (mg)",
            notes: "Notizen",
            time: "Uhrzeit (eigene Spalte)",
            deleted: "Markierung „gelöscht“",
            source_id: "Mahlzeiten-ID (aus unserem Export)",
            timezone: "Zeitzone (aus unserem Export)",
        },
        chooseExportHeading: "Wähl deinen Export",
        noToolsWarning:
            "Dieser Host erlaubt dieser Ansicht nicht, in dein Ernährungstagebuch zu schreiben. Bitte stattdessen Claude, die Datei zu importieren – Claude kann das direkt erledigen.",
        emailFallback: "Klappt es auch über Claude nicht, schreib an {email}.",
        tzWarning:
            "Deine Zeitzone ist nicht festgelegt. Uhrzeiten werden deshalb als UTC gelesen und können auf dem falschen Tag landen. Bitte Claude, zuerst deine Zeitzone festzulegen.",
        dropChoose: "CSV-Datei auswählen",
        dropOr: "oder hierher ziehen",
        recognizedHint:
            "Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden automatisch erkannt. Gespeichert wird erst, wenn du bestätigst.",
        dateMapHint:
            "Ordne oben eine Datumsspalte zu, um zu sehen, wie ein Wert aus deiner Datei umgewandelt wird.",
        dateNoneHint: "Diese Spalte enthält keine Datumsangaben.",
        dateUnreadable:
            "{raw} → nicht als {format} lesbar – Zeilen wie diese werden übersprungen",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Ordne oben eine Kalorienspalte zu, um zu sehen, wie ein Wert aus deiner Datei umgewandelt wird.",
        energyNoneHint: "Diese Spalte enthält keine Zahlen.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (keine Umrechnung)",
        dateAmbiguousWarning:
            "Das Datumsformat lässt sich aus dieser Datei nicht bestimmen – die Datumsangaben ergeben mit dem Tag zuerst genauso Sinn wie mit dem Monat zuerst. Bitte bestätige, welches Format deine App exportiert: Bei falscher Wahl landen Mahlzeiten ohne Fehlermeldung am falschen Tag.",
        dateFormatLabel: "Datumsformat in dieser Datei",
        dateFormatYmd: "Jahr-Monat-Tag",
        dateFormatDmy: "Tag/Monat/Jahr",
        dateFormatMdy: "Monat/Tag/Jahr",
        energyUnitLabel: "Energieeinheit der Kalorienspalte",
        energyUnitKcal: "Kalorien",
        energyUnitKj: "Kilojoule",
        mapColumnsHeading: "Spalten zuordnen",
        rowsCount: { one: "{n} Zeile", other: "{n} Zeilen" },
        columnsCount: { one: "{n} Spalte", other: "{n} Spalten" },
        delimiterLabel: "Trennzeichen",
        tabLabel: "Tab",
        notInFile: "(nicht in dieser Datei)",
        columnFallback: "Spalte {n}",
        caffeineGramsNotice:
            "Die Koffeinspalte dieser Datei ({column}) ist in Gramm angegeben, Koffein wird aber in Milligramm gespeichert, deshalb wurde Koffein nicht zugeordnet. Sonst würde 0,18 erfasst, wo auf dem Etikett 180 mg steht. Ein erneuter Import derselben Datei trägt das später nicht nach – diese Zeilen sind dann schon erfasst und werden als Duplikate übersprungen. Ist die Spalte falsch beschriftet und sind die Werte wirklich Milligramm, wähl sie oben aus; sind es wirklich Gramm, multipliziere sie vor dem Import in der Datei mit 1000, nicht danach.",
        alcoholNotice:
            "Diese Datei hat eine Alkoholspalte ({column}), aber die Alkohol-Erfassung ist für dieses Konto ausgeschaltet, deshalb wird sie nicht importiert. Ein erneuter Import derselben Datei trägt das später nicht nach – diese Zeilen sind dann schon erfasst und werden als Duplikate übersprungen. Wenn du diese Daten behalten willst, bitte Claude, vor dem Import die Alkohol-Erfassung einzuschalten (set_alcohol_tracking).",
        sampleValue: "z. B. {sample}",
        sourceAppLabel: "Quell-App (optional)",
        sourceAppHint:
            "Dient als Bezeichnung für Zeilen ohne eigenen Lebensmittelnamen.",
        previewButton: "Vorschau anzeigen",
        chooseAnotherButton: "Andere Datei wählen",
        previewHeading: "Vorschau",
        datesReadAs:
            "Datumsangaben als {format} gelesen; Energie {conversion}.",
        energyConvertedNote: "von kJ in kcal umgerechnet",
        energyReadAsKcal: "als kcal gelesen",
        badDatesWarning: {
            one: "{n} Zeile wurde übersprungen, weil ihr Datum nicht als {format} gelesen werden konnte{sample}. Geh zurück und wähl das Datumsformat, das zu deiner Datei passt.",
            other: "{n} Zeilen wurden übersprungen, weil ihr Datum nicht als {format} gelesen werden konnte{sample}. Geh zurück und wähl das Datumsformat, das zu deiner Datei passt.",
        },
        badDateSample: " (z. B. Zeile {line}: {value})",
        noTimeWarning: {
            one: "{n} Zeile hat ein Datum, aber keine Uhrzeit – sie wird um 12 Uhr mittags erfasst.",
            other: "{n} Zeilen haben ein Datum, aber keine Uhrzeit – sie werden um 12 Uhr mittags erfasst.",
        },
        splitDatesCount: {
            one: "{n} Tag hat",
            other: "{n} Tage haben",
        },
        splitDatesWarning:
            " mehr als {max} Mahlzeiten (z. B. {date}), deshalb wurde der Import auf mehrere Stapel aufgeteilt. Stehen an so einem Tag zwei Einträge mit genau demselben Lebensmittel, Mahlzeitentyp und denselben Makros, kann einer davon als Duplikat übersprungen statt importiert werden.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "KH",
            fat_g: "F",
            fiber_g: "Ball.",
            sugar_g: "Zucker",
            added_sugar_g: "Zuges.",
            saturated_fat_g: "Ges.",
            trans_fat_g: "Trans",
            alcohol_g: "Alk.",
            caffeine_mg: "Koff.",
            sodium_mg: "Na",
        },
        tableLine: "Zeile",
        tableWhen: "Zeitpunkt",
        tableMeal: "Mahlzeit",
        tableFood: "Lebensmittel",
        tableProblem: "Problem",
        noNameFallback: "(kein Name – wird nach Mahlzeit benannt)",
        showingRows: "{shown} von {total} Zeilen angezeigt",
        checkingRows: {
            one: "{n} Zeile wird geprüft …",
            other: "{n} Zeilen werden geprüft …",
        },
        importingRows: {
            one: "{n} Zeile wird importiert …",
            other: "{n} Zeilen werden importiert …",
        },
        batchProgress: "{label} (Stapel {done} von {total})",
        rowsRange: "Zeilen {a}–{b}: {msg}",
        preflightFailed: "Vorabprüfung fehlgeschlagen.",
        rowsWouldFail: {
            one: "{n} Zeile würde fehlschlagen, z. B. Zeile {line}: {message}",
            other: "{n} Zeilen würden fehlschlagen, z. B. Zeile {line}: {message}",
        },
        importingEllipsis: "Wird importiert …",
        importButton: {
            one: "{n} Mahlzeit importieren",
            other: "{n} Mahlzeiten importieren",
        },
        backToMapping: "Zurück zur Zuordnung",
        importCompleteHeading: "Import abgeschlossen",
        resultMealsImported: {
            one: "{n} Mahlzeit importiert",
            other: "{n} Mahlzeiten importiert",
        },
        resultAlreadyLogged: {
            one: ", {n} bereits erfasst",
            other: ", {n} bereits erfasst",
        },
        resultFailed: {
            one: ", {n} fehlgeschlagen",
            other: ", {n} fehlgeschlagen",
        },
        resultSkipped: {
            one: ", {n} übersprungen",
            other: ", {n} übersprungen",
        },
        restartButton: "Weitere Datei importieren",
        couldNotReadFile: "Die Datei konnte nicht gelesen werden: {msg}",
        noDataRows: "Keine Datenzeilen in der Datei gefunden.",
        emailNotice:
            "Läuft etwas nicht wie erwartet? Schreib an {email} und füg die Zeilen unten bei – mehr braucht es zur Fehlersuche nicht.",
        eyebrow: "Mahlzeiten importieren",
        eyebrowWithFile: "Mahlzeiten importieren · {file}",
        stepsLabel: "Import-Schritte",
        stepAriaDone: "Schritt {i} von 4: {name}, erledigt",
        stepAriaCurrent: "Schritt {i} von 4: {name}, aktuell",
        stepAriaUpcoming: "Schritt {i} von 4: {name}",
        browseFiles: "Dateien durchsuchen",
        dropAccept: ".csv oder tabulatorgetrennter Text",
        dropAria: "CSV-Datei auswählen oder hierher ziehen",
        privacyNote:
            "Die Datei wird hier in diesem Fenster gelesen. Ihre Zeilen gehen nie durch den Chat – der Assistent erhält nach dem Import nur eine einzeilige Zusammenfassung.",
        binaryFile:
            "Die Datei konnte nicht gelesen werden: Sie sieht nach einer Binärdatei aus (einer Excel-Arbeitsmappe?), nicht nach CSV-Text. Exportiere sie als CSV und versuch es noch einmal.",
        columnsHeading: "Spalten",
        fieldsMatched: {
            one: "{n} von {total} Feld zugeordnet",
            other: "{n} von {total} Feldern zugeordnet",
        },
        tableFieldHead: "Feld",
        tableColumnHead: "Spalte in deiner Datei",
        tableRow1Head: "Wert in Zeile 1",
        badgeNew: "neu",
        colNumber: "Sp. {n}",
        colNumberAuto: "Sp. {n} · automatisch",
        colNumberManual: "Sp. {n} · von dir gewählt",
        row1Empty: "Zeile 1 leer",
        alsoUsed: "auch {field}",
        sameColumn: "Gleiche Spalte wie {fields}",
        columnForAria: "Spalte für {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", erforderlich",
        columnAria: "Spalte {n}, {name}",
        notInFileAria: "nicht in dieser Datei",
        sampleAria: ", {sample}",
        howRead: "So werden die Werte gelesen",
        appExport: "{app}-Export",
        tileMeals: {
            one: "Mahlzeit zu importieren",
            other: "Mahlzeiten zu importieren",
        },
        tileKcal: "kcal insgesamt",
        tileSkipped: {
            one: "Zeile übersprungen",
            other: "Zeilen übersprungen",
        },
        tileBatches: { one: "Stapel", other: "Stapel" },
        rowsHeading: "Zeilen",
        scrollLeft: "Tabelle nach links scrollen",
        scrollRight: "Tabelle nach rechts scrollen",
        previewRegionAria: "Vorschau der zu importierenden Zeilen",
        expandAllDays: "Alle Tage aufklappen",
        collapseAllDays: "Alle Tage zuklappen",
        dayRows: { one: "{n} Zeile", other: "{n} Zeilen" },
        dayRowsKcal: {
            one: "{n} Zeile · {kcal} kcal",
            other: "{n} Zeilen · {kcal} kcal",
        },
        noTimeShort: "keine Uhrzeit",
        lineN: "Zeile {n}",
        rowCardAria: "Zeile {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "keine Mahlzeit",
        noKcalAria: "keine Kalorien",
        noRowsToImport:
            "Mit der aktuellen Zuordnung gibt es keine Zeilen zu importieren.",
        importOff:
            "Import ist aus: Dieser Host erlaubt dieser Ansicht nicht, in dein Ernährungstagebuch zu schreiben. Bitte stattdessen Claude, die Datei zu importieren.",
        backBusy: "Zurück ist nicht möglich, solange Stapel gesendet werden.",
        progressAria: "Import-Fortschritt, Stapel",
        failedRowsAria: "Fehlgeschlagene Zeilen",
        toldOnly: "Der Assistent hat nur das erfahren: {summary}",
        liveStep: "Schritt {i} von 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Import läuft. {n} Stapel.",
            other: "Import läuft. {n} Stapel.",
        },
        liveDone: {
            one: "Import abgeschlossen. {n} Mahlzeit importiert.",
            other: "Import abgeschlossen. {n} Mahlzeiten importiert.",
        },
        liveNoWrite:
            "Vorabprüfung fehlgeschlagen. Es wurde nichts gespeichert.",
        liveFileError: "Diese Datei kann nicht verwendet werden.",
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

import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_PL: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalorie",
            protein_g: "Białko",
            carbs_g: "Węglowodany",
            fat_g: "Tłuszcz",
            sugar_g: "Cukier",
            added_sugar_g: "Cukier dodany",
            saturated_fat_g: "Tłuszcze nasycone",
            trans_fat_g: "Tłuszcze trans",
            alcohol_g: "Alkohol",
            caffeine_mg: "Kofeina",
            sodium_mg: "Sód",
            fiber_g: "Błonnik",
            water_ml: "Woda",
        },
        noGoalSet: "brak celu",
        atLimit: "limit osiągnięty",
        floorUnder: "zostało",
        ceilingUnder: "do limitu",
        over: "powyżej",
        limitPrefix: "limit",
        ofPrefix: "z",
        drinkLabels: { us: "porcje (USA)", uk: "jednostki (UK)" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "l",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "brak wpisów",
        notRecorded: "nie zapisano",
        caloriesToday: "Kalorie dziś",
        caloriesOn: "Kalorie · {date}",
        tapHint: "Dotknij wskaźnika, by zobaczyć posiłki",
        showMealsContributed: "Pokaż posiłki, które się na to złożyły.",
        byMealTitle: "{label} w posiłkach",
        closeBreakdown: "Zamknij szczegóły",
        noMealsContributed:
            "{label}: żaden zapisany posiłek tego nie zawierał.",
        untitledMeal: "Posiłek bez nazwy",
        moreMeals: {
            one: "+ {n} mniejszy posiłek",
            few: "+ {n} mniejsze posiłki",
            many: "+ {n} mniejszych posiłków",
            other: "+ {n} mniejszych posiłków",
        },
        moreMealsAtLeast: {
            one: "+ co najmniej {n} mniejszy posiłek",
            few: "+ co najmniej {n} mniejsze posiłki",
            many: "+ co najmniej {n} mniejszych posiłków",
            other: "+ co najmniej {n} mniejszych posiłków",
        },
        moreMealsMaybe: "+ być może więcej mniejszych posiłków",
        ingredientCount: {
            one: "{n} składnik",
            few: "{n} składniki",
            many: "{n} składników",
            other: "{n} składników",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "własne",
        sourceEst: "szac.",
        sourceMixed: "mieszane",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "kod kreskowy",
        sourceDataType: "typ danych",
        sourceAria: "Źródło: {source}",
        sourceDetailsAria: "Pokaż szczegóły źródła",
    },
    bridge: {
        settingsFooter:
            "Możesz w każdej chwili włączyć lub wyłączyć te widżety — wystarczy poprosić o zmianę ustawień.",
        connectFailed: "Nie udało się połączyć tego widoku z aplikacją hosta.",
    },
    nutritionSummary: {
        title: "Podsumowanie odżywiania",
        loading: "Wczytuję podsumowanie odżywiania…",
        empty: "Brak zapisanych posiłków lub wody w tym okresie.",
        caloriesPerDay: "Kalorie / dzień",
        daysLogged: {
            one: "{n} dzień z wpisem",
            few: "{n} dni z wpisami",
            many: "{n} dni z wpisami",
            other: "{n} dni z wpisami",
        },
        daysOfLogged: "Dni z wpisami: {logged} z {span}",
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
            "sty",
            "lut",
            "mar",
            "kwi",
            "maj",
            "cze",
            "lip",
            "sie",
            "wrz",
            "paź",
            "lis",
            "gru",
        ],
    },
    goalProgress: {
        loading: "Wczytuję realizację celów…",
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
        loading: "Wczytuję trendy…",
        windowAriaLabel: "Zakres trendu",
        segWeek: "Tydz.",
        segMonth: "Mies.",
        segQuarter: "Kw.",
        segYear: "Rok",
        segDays: "Dni",
        segWeekAria: "Pokaż średnie tygodniowe",
        segMonthAria: "Pokaż średnie miesięczne",
        segQuarterAria: "Pokaż średnie kwartalne",
        segYearAria: "Pokaż średnie roczne",
        segDaysAria: "Pokaż trendy dzienne",
        periodTitleWeek: "Średnie tygodniowe",
        periodTitleMonth: "Średnie miesięczne",
        periodTitleQuarter: "Średnie kwartalne",
        periodTitleYear: "Średnie roczne",
        perLoggedDay: "na dzień z wpisami",
        daysLogged: "{logged}/{total} dni",
        onTarget: "w celu {k}/{n}",
        possiblyIncomplete: {
            one: "{n} dzień może być niepełny",
            few: "{n} dni mogą być niepełne",
            many: "{n} dni może być niepełnych",
            other: "{n} dni może być niepełnych",
        },
        partial: "w toku",
        nothingLogged: "brak wpisów",
        targetsChanged: "cele zmienione w trakcie okresu",
        targetsAssumed: "brak zapisanych celów sprzed {date}",
        noTargets: "Brak ustawionych celów — tylko średnie.",
        quarter: "{q} kw. {year}",
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
        loading: "Wczytuję trendy wagi…",
        empty: "W tym okresie nie ma jeszcze pomiarów wagi.",
        eyebrowToday: "Waga · dziś",
        eyebrowLast: "Waga · ostatni pomiar {date}",
        titleFirst: "Zapisano pierwszy pomiar",
        titleFew: "Na razie tylko kilka pomiarów",
        titleNoRate: "Za mało ostatnich pomiarów, by wyliczyć tempo tygodniowe",
        titleSteady: "Bez zmian",
        titleDown: "Trend spadkowy",
        titleUp: "Trend wzrostowy",
        titleGoalReached: "Cel osiągnięty",
        titleAway: "Oddalasz się od celu",
        titleOnTrack: "Zmierzasz do celu",
        titleShortSteady: "Bez zmian, cel jeszcze nieosiągnięty",
        rangeGroupAriaLabel: "Zakres",
        ranges: {
            "7": {
                label: "7 d",
                aria: "Pokaż ostatnie 7 dni",
                word: "z ostatnich 7 dni",
                inRange: "w ciągu 7 dni",
                heading: "ostatnie 7 dni",
                chip: "7 d",
            },
            "30": {
                label: "30 d",
                aria: "Pokaż ostatnie 30 dni",
                word: "z ostatnich 30 dni",
                inRange: "w ciągu 30 dni",
                heading: "ostatnie 30 dni",
                chip: "30 d",
            },
            "90": {
                label: "90 d",
                aria: "Pokaż ostatnie 90 dni",
                word: "z ostatnich 90 dni",
                inRange: "w ciągu 90 dni",
                heading: "ostatnie 90 dni",
                chip: "90 d",
            },
            "1y": {
                label: "1 r",
                aria: "Pokaż ostatni rok",
                word: "z ostatniego roku",
                inRange: "w ciągu roku",
                heading: "ostatni rok",
                chip: "1 r.",
            },
            all: {
                label: "Wszystko",
                aria: "Pokaż całą historię",
                word: "w całej historii",
                inRange: "łącznie",
                heading: "cała historia",
                chip: "Wszystko",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} tygodniowo",
        perWeekAvg: "średnio {amount} tygodniowo",
        toGoal: "{value} do celu",
        weeksApprox: {
            one: "~{n} tydzień",
            few: "~{n} tygodnie",
            many: "~{n} tygodni",
            other: "~{n} tygodni",
        },
        yearsPlus: "2+ lata",
        reachedOn: "osiągnięty {date}",
        movingAway: "oddala się od celu",
        tooFlat: "zbyt płasko, by przewidzieć datę",
        hintFew: "Linia trendu wymaga co najmniej 4 pomiarów w zakresie",
        hintNoRate:
            "Tempo tygodniowe wymaga 4 pomiarów w ostatnich 3 tygodniach",
        statPerWeek: "Tygodniowo",
        statGoalPace: "Cel w tym tempie",
        statGoalReached: "Cel osiągnięty",
        statToGoal: "Do celu",
        statSince: "Od {date}",
        unitWeeks: {
            one: "tydzień",
            few: "tygodnie",
            many: "tygodni",
            other: "tygodni",
        },
        unitYears: "lata",
        goalPill: "Cel {goal} · zostało {left}",
        goalPillReached: "Cel {goal} ✓",
        goalBelow: "Cel {goal}  ↓ {left} niżej",
        goalAbove: "Cel {goal}  ↑ {left} wyżej",
        today: "Dziś",
        yesterday: "Wczoraj",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (średnia z {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, średnia z {n}",
        chartAriaLabel:
            "Wykres wagi, ostatnio {latest}{goal}{change}. Dotknij dnia, aby odczytać wartość.",
        chartAriaGoal: ", cel {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Zamknij",
        oneTitleFirst: "Tu zaczyna się Twój trend",
        oneTitle: "Tylko jeden pomiar {range}",
        oneFirst: "Pierwszy pomiar · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "Wykres zacznie się od drugiego pomiaru",
        oneHintEarlier: {
            one: "{n} wcześniejszy dzień z pomiarem w dłuższych zakresach",
            few: "{n} wcześniejsze dni z pomiarem w dłuższych zakresach",
            many: "{n} wcześniejszych dni z pomiarem w dłuższych zakresach",
            other: "{n} wcześniejszych dni z pomiarem w dłuższych zakresach",
        },
        emptyRange: "Brak pomiarów {range}.",
        emptyRangeLast: "Brak pomiarów {range}. Ostatni był {date}.",
        showMore: "Pokaż więcej",
        showLess: "Pokaż mniej",
        detailsAria: "{action}: pomiary wagi i obwody",
        detailsAriaWeighIns: "{action}: pomiary wagi",
        collapseAll: "Zwiń wszystko",
        sectionWeighIns: "Pomiary wagi",
        sectionMeasurements: "Obwody ciała · {range}",
        accLabel: {
            one: "{n} pomiar {range}",
            few: "{n} pomiary {range}",
            many: "{n} pomiarów {range}",
            other: "{n} pomiarów {range}",
        },
        accEmpty: "Brak pomiarów {range}",
        accAvgRange: "średnio {avg} · zakres {min}–{max}",
        loggedToday: "zapisany dziś",
        loggedYesterday: "zapisany wczoraj",
        loggedOn: "zapisany {date}",
        weekThis: "Ten tydzień",
        weekLast: "Poprzedni tydzień",
        weekAvg: "średnio {value}",
        weekVsLast: "{change} wobec poprzedniego tygodnia",
        weekVsBefore: "{change} wobec tygodnia wcześniej",
        dayMulti: {
            one: "{n} pomiar · uśredniony",
            few: "{n} pomiary · uśrednione",
            many: "{n} pomiarów · uśrednione",
            other: "{n} pomiarów · uśrednione",
        },
        showEarlierWeeks: {
            one: "Pokaż {n} wcześniejszy tydzień",
            few: "Pokaż {n} wcześniejsze tygodnie",
            many: "Pokaż {n} wcześniejszych tygodni",
            other: "Pokaż {n} wcześniejszych tygodni",
        },
        sites: {
            waist: "Talia",
            hips: "Biodra",
            neck: "Szyja",
            chest: "Klatka piersiowa",
            shoulders: "Barki",
            upper_arm: "Ramię",
            forearm: "Przedramię",
            thigh: "Udo",
            calf: "Łydka",
        },
        measSince: "{change} od {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ bez zmian",
        measFirst: "pierwszy pomiar · {date}",
        measFirstRow: "pierwszy",
        measStale: "brak pomiaru w tym zakresie · ostatni {date}",
        measEarlier: "Wcześniejsze pomiary",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "Pokaż jeszcze {n}",
            few: "Pokaż jeszcze {n}",
            many: "Pokaż jeszcze {n}",
            other: "Pokaż jeszcze {n}",
        },
        noMeasurements:
            "Brak obwodów ciała z ostatniego roku. Talię, biodra i siedem innych miejsc można zapisywać w centymetrach lub calach.",
    },
    importMeals: {
        loading: "Przygotowuję import…",
        stepFile: "Plik",
        stepMap: "Dopasuj kolumny",
        stepPreview: "Podgląd",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Data / godzina",
            description: "Nazwa produktu",
            meal_type: "Posiłek",
            calories: "Kalorie",
            protein_g: "Białko (g)",
            carbs_g: "Węglowodany (g)",
            fat_g: "Tłuszcz (g)",
            fiber_g: "Błonnik (g)",
            sugar_g: "Cukry ogółem (g)",
            added_sugar_g: "Cukry dodane (g)",
            saturated_fat_g: "Tłuszcze nasycone (g)",
            trans_fat_g: "Tłuszcze trans (g)",
            alcohol_g: "Alkohol (g)",
            caffeine_mg: "Kofeina (mg)",
            sodium_mg: "Sód (mg)",
            notes: "Notatki",
            time: "Godzina (osobna kolumna)",
            deleted: "Znacznik usunięcia",
            source_id: "ID posiłku (z naszego eksportu)",
            timezone: "Strefa czasowa (z naszego eksportu)",
        },
        chooseExportHeading: "Wybierz plik eksportu",
        noToolsWarning:
            "Ta aplikacja nie pozwala temu widokowi zapisywać w Twoim dzienniku. Zamiast tego poproś Claude o zaimportowanie pliku — Claude może to zrobić bezpośrednio.",
        emailFallback:
            "Jeśli prośba do Claude też nie pomoże, napisz na {email}.",
        tzWarning:
            "Nie masz ustawionej strefy czasowej, więc godziny zostaną odczytane jako UTC, a posiłki mogą trafić pod niewłaściwą datę. Najpierw poproś Claude o ustawienie strefy czasowej.",
        dropChoose: "Wybierz plik CSV",
        dropOr: "lub przeciągnij go tutaj",
        recognizedHint:
            "Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor są rozpoznawane automatycznie. Nic nie zostanie zapisane, dopóki nie potwierdzisz.",
        dateMapHint:
            "Wybierz powyżej kolumnę z datą, by zobaczyć, jak zostanie odczytana wartość z Twojego pliku.",
        dateNoneHint: "Ta kolumna nie zawiera dat.",
        dateUnreadable:
            "{raw} → nie da się odczytać jako {format}, więc takie wiersze zostaną pominięte",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Wybierz powyżej kolumnę z kaloriami, by zobaczyć, jak zostanie przeliczona wartość z Twojego pliku.",
        energyNoneHint: "Ta kolumna nie zawiera liczb.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (bez przeliczania)",
        dateAmbiguousWarning:
            "Nie udało się ustalić formatu daty w tym pliku — daty da się odczytać zarówno z dniem, jak i z miesiącem na początku. Potwierdź, jaki format eksportuje Twoja aplikacja: zły wybór po cichu zapisze posiłki pod niewłaściwą datą.",
        dateFormatLabel: "Format daty w tym pliku",
        dateFormatYmd: "Rok-miesiąc-dzień",
        dateFormatDmy: "Dzień/miesiąc/rok",
        dateFormatMdy: "Miesiąc/dzień/rok",
        energyUnitLabel: "Jednostka energii w kolumnie kalorii",
        energyUnitKcal: "Kalorie",
        energyUnitKj: "Kilodżule",
        mapColumnsHeading: "Dopasuj kolumny",
        rowsCount: {
            one: "{n} wiersz",
            few: "{n} wiersze",
            many: "{n} wierszy",
            other: "{n} wierszy",
        },
        columnsCount: {
            one: "{n} kolumna",
            few: "{n} kolumny",
            many: "{n} kolumn",
            other: "{n} kolumn",
        },
        delimiterLabel: "separator",
        tabLabel: "tabulator",
        notInFile: "(brak w tym pliku)",
        columnFallback: "kolumna {n}",
        caffeineGramsNotice:
            "Kolumna kofeiny w tym pliku ({column}) jest w gramach, a kofeina jest zapisywana w miligramach, więc pola Kofeina nie dopasowano do żadnej kolumny. Po dopasowaniu zapisałoby się 0,18 tam, gdzie etykieta podaje 180 mg. Ponowny import tego samego pliku później tego nie uzupełni — te wiersze będą już zapisane i zostaną pominięte jako duplikaty. Jeśli nagłówek jest źle opisany, a wartości naprawdę są w miligramach, wybierz tę kolumnę powyżej; jeśli naprawdę są w gramach, pomnóż je w pliku przez 1000 przed importem, a nie po nim.",
        alcoholNotice:
            "Ten plik ma kolumnę alkoholu ({column}), ale śledzenie alkoholu jest na tym koncie wyłączone, więc ta kolumna nie zostanie zaimportowana. Ponowny import tego samego pliku później tego nie uzupełni — te wiersze będą już zapisane i zostaną pominięte jako duplikaty. Aby zachować te dane, przed importem poproś Claude o włączenie śledzenia alkoholu (set_alcohol_tracking).",
        sampleValue: "np. {sample}",
        sourceAppLabel: "Aplikacja źródłowa (opcjonalnie)",
        sourceAppHint: "Służy do opisania wierszy bez własnej nazwy produktu.",
        previewButton: "Pokaż podgląd",
        chooseAnotherButton: "Wybierz inny plik",
        previewHeading: "Podgląd",
        datesReadAs: "Daty odczytane jako {format}; energia {conversion}.",
        energyConvertedNote: "przeliczona z kJ na kcal",
        energyReadAsKcal: "odczytana jako kcal",
        badDatesWarning: {
            one: "Pominięto {n} wiersz, bo jego daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            few: "Pominięto {n} wiersze, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            many: "Pominięto {n} wierszy, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            other: "Pominięto {n} wierszy, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
        },
        badDateSample: " (np. wiersz {line}: {value})",
        noTimeWarning: {
            one: "{n} wiersz ma datę, ale nie ma godziny — zostanie zapisany w południe.",
            few: "{n} wiersze mają datę, ale nie mają godziny — zostaną zapisane w południe.",
            many: "{n} wierszy ma datę, ale nie ma godziny — zostanie zapisanych w południe.",
            other: "{n} wierszy ma datę, ale nie ma godziny — zostanie zapisanych w południe.",
        },
        splitDatesCount: {
            one: "{n} data ma",
            few: "{n} daty mają",
            many: "{n} dat ma",
            other: "{n} dat ma",
        },
        splitDatesWarning:
            " więcej niż {max} posiłków (np. {date}), więc trzeba było rozdzielić je między osobne partie importu. Jeśli pod tą datą są dwa wpisy z dokładnie tym samym jedzeniem, rodzajem posiłku i makroskładnikami, jeden z nich może zostać pominięty jako duplikat, zamiast trafić do importu.",
        tableAbbr: {
            protein_g: "B",
            carbs_g: "W",
            fat_g: "T",
            fiber_g: "Bł",
            sugar_g: "Cuk",
            added_sugar_g: "Dod",
            saturated_fat_g: "Nas.",
            trans_fat_g: "Trans",
            alcohol_g: "Alk",
            caffeine_mg: "Kof",
            sodium_mg: "Na",
        },
        tableLine: "Wiersz",
        tableWhen: "Kiedy",
        tableMeal: "Posiłek",
        tableFood: "Produkt",
        tableProblem: "Problem",
        noNameFallback: "(bez nazwy — użyjemy rodzaju posiłku)",
        showingRows: "Wyświetlono {shown} z {total} wierszy",
        checkingRows: {
            one: "Sprawdzanie {n} wiersza…",
            few: "Sprawdzanie {n} wierszy…",
            many: "Sprawdzanie {n} wierszy…",
            other: "Sprawdzanie {n} wierszy…",
        },
        importingRows: {
            one: "Importowanie {n} wiersza…",
            few: "Importowanie {n} wierszy…",
            many: "Importowanie {n} wierszy…",
            other: "Importowanie {n} wierszy…",
        },
        batchProgress: "{label} (partia {done} z {total})",
        rowsRange: "Wiersze {a}–{b}: {msg}",
        preflightFailed: "Wstępne sprawdzenie nie powiodło się.",
        rowsWouldFail: {
            one: "{n} wiersz zakończy się błędem, np. wiersz {line}: {message}",
            few: "{n} wiersze zakończą się błędem, np. wiersz {line}: {message}",
            many: "{n} wierszy zakończy się błędem, np. wiersz {line}: {message}",
            other: "{n} wierszy zakończy się błędem, np. wiersz {line}: {message}",
        },
        importingEllipsis: "Importowanie…",
        importButton: {
            one: "Importuj {n} posiłek",
            few: "Importuj {n} posiłki",
            many: "Importuj {n} posiłków",
            other: "Importuj {n} posiłków",
        },
        backToMapping: "Wróć do dopasowania kolumn",
        importCompleteHeading: "Import zakończony",
        resultMealsImported: {
            one: "Zaimportowano {n} posiłek",
            few: "Zaimportowano {n} posiłki",
            many: "Zaimportowano {n} posiłków",
            other: "Zaimportowano {n} posiłków",
        },
        resultAlreadyLogged: {
            one: ", {n} już zapisany",
            few: ", {n} już zapisane",
            many: ", {n} już zapisanych",
            other: ", {n} już zapisanych",
        },
        resultFailed: {
            one: ", {n} nieudany",
            few: ", {n} nieudane",
            many: ", {n} nieudanych",
            other: ", {n} nieudanych",
        },
        resultSkipped: {
            one: ", {n} pominięty",
            few: ", {n} pominięte",
            many: ", {n} pominiętych",
            other: ", {n} pominiętych",
        },
        restartButton: "Zaimportuj kolejny plik",
        couldNotReadFile: "Nie udało się odczytać tego pliku: {msg}",
        noDataRows: "W tym pliku nie ma wierszy z danymi.",
        emailNotice:
            "Coś nie działa tak, jak powinno? Napisz na {email} i dołącz poniższe informacje — to wszystko, czego potrzeba do zdiagnozowania problemu.",
        eyebrow: "Import posiłków",
        eyebrowWithFile: "Import posiłków · {file}",
        stepsLabel: "Kroki importu",
        stepAriaDone: "Krok {i} z 4: {name}, ukończony",
        stepAriaCurrent: "Krok {i} z 4: {name}, bieżący",
        stepAriaUpcoming: "Krok {i} z 4: {name}",
        browseFiles: "Przeglądaj pliki",
        dropAccept: ".csv lub tekst rozdzielany tabulatorami",
        dropAria: "Wybierz plik CSV lub przeciągnij go tutaj",
        privacyNote:
            "Plik jest odczytywany tutaj, w tym panelu. Jego wiersze nigdy nie trafiają do czatu — asystent dostaje tylko jednowierszowe podsumowanie po zakończeniu importu.",
        binaryFile:
            "Nie udało się odczytać tego pliku: wygląda na plik binarny (skoroszyt Excela?), a nie tekst CSV. Wyeksportuj go jako CSV i spróbuj ponownie.",
        columnsHeading: "Kolumny",
        fieldsMatched: {
            one: "Dopasowano {n} z {total} pola",
            few: "Dopasowano {n} z {total} pól",
            many: "Dopasowano {n} z {total} pól",
            other: "Dopasowano {n} z {total} pól",
        },
        tableFieldHead: "Pole",
        tableColumnHead: "Kolumna w Twoim pliku",
        tableRow1Head: "Wartość w wierszu 1",
        badgeNew: "nowe",
        colNumber: "Kol. {n}",
        colNumberAuto: "Kol. {n} · automatycznie",
        colNumberManual: "Kol. {n} · wybrana przez Ciebie",
        row1Empty: "wiersz 1 pusty",
        alsoUsed: "także {field}",
        sameColumn: "Ta sama kolumna co {fields}",
        columnForAria: "Kolumna dla pola {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", wymagane",
        columnAria: "kolumna {n}, {name}",
        notInFileAria: "brak w tym pliku",
        sampleAria: ", {sample}",
        howRead: "Jak odczytywane są wartości",
        appExport: "Eksport z {app}",
        tileMeals: {
            one: "posiłek do zaimportowania",
            few: "posiłki do zaimportowania",
            many: "posiłków do zaimportowania",
            other: "posiłków do zaimportowania",
        },
        tileKcal: "kcal łącznie",
        tileSkipped: {
            one: "pominięty wiersz",
            few: "pominięte wiersze",
            many: "pominiętych wierszy",
            other: "pominiętych wierszy",
        },
        tileBatches: {
            one: "partia",
            few: "partie",
            many: "partii",
            other: "partii",
        },
        rowsHeading: "Wiersze",
        scrollLeft: "Przewiń tabelę w lewo",
        scrollRight: "Przewiń tabelę w prawo",
        previewRegionAria: "Podgląd wierszy do zaimportowania",
        expandAllDays: "Rozwiń wszystkie dni",
        collapseAllDays: "Zwiń wszystkie dni",
        dayRows: {
            one: "{n} wiersz",
            few: "{n} wiersze",
            many: "{n} wierszy",
            other: "{n} wierszy",
        },
        dayRowsKcal: {
            one: "{n} wiersz · {kcal} kcal",
            few: "{n} wiersze · {kcal} kcal",
            many: "{n} wierszy · {kcal} kcal",
            other: "{n} wierszy · {kcal} kcal",
        },
        noTimeShort: "bez godziny",
        lineN: "Wiersz {n}",
        rowCardAria: "Wiersz {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "bez posiłku",
        noKcalAria: "bez kalorii",
        noRowsToImport:
            "Przy obecnym dopasowaniu nie ma wierszy do zaimportowania.",
        importOff:
            "Import jest wyłączony: ta aplikacja nie pozwala temu widokowi zapisywać w Twoim dzienniku. Zamiast tego poproś Claude o zaimportowanie pliku.",
        backBusy: "Nie można wrócić podczas wysyłania partii.",
        progressAria: "Postęp importu, partie",
        failedRowsAria: "Wiersze z błędem",
        toldOnly: "Asystent dostał tylko to: {summary}",
        liveStep: "Krok {i} z 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Importowanie. {n} partia.",
            few: "Importowanie. {n} partie.",
            many: "Importowanie. {n} partii.",
            other: "Importowanie. {n} partii.",
        },
        liveDone: {
            one: "Import zakończony. Zaimportowano {n} posiłek.",
            few: "Import zakończony. Zaimportowano {n} posiłki.",
            many: "Import zakończony. Zaimportowano {n} posiłków.",
            other: "Import zakończony. Zaimportowano {n} posiłków.",
        },
        liveNoWrite:
            "Wstępna kontrola nie powiodła się. Nic nie zostało zapisane.",
        liveFileError: "Nie można użyć tego pliku.",
    },
};

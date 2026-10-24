import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_NL: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorieën",
            protein_g: "Eiwitten",
            carbs_g: "Koolhydraten",
            fat_g: "Vet",
            sugar_g: "Suiker",
            added_sugar_g: "Toegevoegde suiker",
            saturated_fat_g: "Verzadigd vet",
            trans_fat_g: "Transvet",
            alcohol_g: "Alcohol",
            caffeine_mg: "Cafeïne",
            sodium_mg: "Natrium",
            fiber_g: "Vezels",
            water_ml: "Water",
        },
        noGoalSet: "geen doel ingesteld",
        atLimit: "op de limiet",
        floorUnder: "te gaan",
        ceilingUnder: "eronder",
        over: "erboven",
        limitPrefix: "limiet",
        ofPrefix: "van",
        drinkLabels: { us: "VS-standaardglazen", uk: "Britse eenheden" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "niets gelogd",
        notRecorded: "niet vastgelegd",
        caloriesToday: "Calorieën vandaag",
        caloriesOn: "Calorieën · {date}",
        tapHint: "Tik op een waarde voor de bijbehorende maaltijden",
        showMealsContributed: "Toon de maaltijden die hieraan bijdroegen.",
        byMealTitle: "{label} per maaltijd",
        closeBreakdown: "Overzicht sluiten",
        noMealsContributed: "Geen gelogde maaltijd bevat {label}.",
        untitledMeal: "Naamloze maaltijd",
        moreMeals: {
            one: "+ {n} kleinere maaltijd",
            other: "+ {n} kleinere maaltijden",
        },
        moreMealsAtLeast: {
            one: "+ {n} of meer kleinere maaltijden",
            other: "+ {n} of meer kleinere maaltijden",
        },
        moreMealsMaybe: "+ mogelijk meer kleinere maaltijden",
        ingredientCount: {
            one: "{n} ingrediënt",
            other: "{n} ingrediënten",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "eigen",
        sourceEst: "sch.",
        sourceMixed: "gemengd",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "barcode",
        sourceDataType: "gegevenstype",
        sourceAria: "Bron: {source}",
        sourceDetailsAria: "Bronnen tonen",
    },
    bridge: {
        settingsFooter:
            "Je kunt deze widgets altijd aan- of uitzetten. Vraag gewoon om je instellingen aan te passen.",
        connectFailed: "Deze weergave kon geen verbinding maken met de app.",
    },
    nutritionSummary: {
        title: "Voedingsoverzicht",
        loading: "Je voedingsoverzicht wordt geladen…",
        empty: "Geen maaltijden of water gelogd in deze periode.",
        caloriesPerDay: "Calorieën / dag",
        daysLogged: {
            one: "{n} dag gelogd",
            other: "{n} dagen gelogd",
        },
        daysOfLogged: "{logged} van {span} dagen gelogd",
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
            "jan",
            "feb",
            "mrt",
            "apr",
            "mei",
            "jun",
            "jul",
            "aug",
            "sep",
            "okt",
            "nov",
            "dec",
        ],
    },
    goalProgress: {
        loading: "Je doelvoortgang wordt geladen…",
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
        loading: "Je trends worden geladen…",
        windowAriaLabel: "Trendperiode",
        segWeek: "Week",
        segMonth: "Maand",
        segQuarter: "Kwart.",
        segYear: "Jaar",
        segDays: "Dagen",
        segWeekAria: "Weekgemiddelden tonen",
        segMonthAria: "Maandgemiddelden tonen",
        segQuarterAria: "Kwartaalgemiddelden tonen",
        segYearAria: "Jaargemiddelden tonen",
        segDaysAria: "Dagtrends tonen",
        periodTitleWeek: "Weekgemiddelden",
        periodTitleMonth: "Maandgemiddelden",
        periodTitleQuarter: "Kwartaalgemiddelden",
        periodTitleYear: "Jaargemiddelden",
        perLoggedDay: "per gelogde dag",
        daysLogged: "{logged}/{total} dagen",
        onTarget: "op doel {k}/{n}",
        possiblyIncomplete: {
            one: "{n} mogelijk onvolledig",
            other: "{n} mogelijk onvolledig",
        },
        partial: "lopend",
        nothingLogged: "niets gelogd",
        targetsChanged: "doelen gewijzigd in deze periode",
        targetsAssumed: "doelen vóór {date} niet vastgelegd",
        noTargets: "Geen doelen ingesteld — alleen gemiddelden.",
        quarter: "K{q} {year}",
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
        loading: "Je gewichtsverloop wordt geladen…",
        empty: "Nog geen gewicht gelogd in deze periode.",
        eyebrowToday: "Gewicht · vandaag",
        eyebrowLast: "Gewicht · laatste weging {date}",
        titleFirst: "Eerste weging gelogd",
        titleFew: "Nog maar een paar wegingen",
        titleNoRate: "Te weinig recente wegingen voor een weektempo",
        titleSteady: "Stabiel",
        titleDown: "Dalende trend",
        titleUp: "Stijgende trend",
        titleGoalReached: "Doel bereikt",
        titleAway: "Je raakt verder van je doel af",
        titleOnTrack: "Op koers naar je doel",
        titleShortSteady: "Stabiel, doel nog niet bereikt",
        rangeGroupAriaLabel: "Periode",
        ranges: {
            "7": {
                label: "7 d",
                aria: "Laatste 7 dagen tonen",
                word: "de laatste 7 dagen",
                inRange: "in 7 dagen",
                heading: "laatste 7 dagen",
                chip: "7 d",
            },
            "30": {
                label: "30 d",
                aria: "Laatste 30 dagen tonen",
                word: "de laatste 30 dagen",
                inRange: "in 30 dagen",
                heading: "laatste 30 dagen",
                chip: "30 d",
            },
            "90": {
                label: "90 d",
                aria: "Laatste 90 dagen tonen",
                word: "de laatste 90 dagen",
                inRange: "in 90 dagen",
                heading: "laatste 90 dagen",
                chip: "90 d",
            },
            "1y": {
                label: "1 j",
                aria: "Afgelopen jaar tonen",
                word: "het afgelopen jaar",
                inRange: "in een jaar",
                heading: "afgelopen jaar",
                chip: "1 j",
            },
            all: {
                label: "Alles",
                aria: "Volledige geschiedenis tonen",
                word: "de hele geschiedenis",
                inRange: "in totaal",
                heading: "hele geschiedenis",
                chip: "Alles",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} per week",
        perWeekAvg: "gemiddeld {amount} per week",
        toGoal: "{value} tot je doel",
        weeksApprox: {
            one: "~{n} week",
            other: "~{n} weken",
        },
        yearsPlus: "2+ jaar",
        reachedOn: "bereikt op {date}",
        movingAway: "verder van het doel af",
        tooFlat: "te vlak om een doeldatum te schatten",
        hintFew: "Een trendlijn heeft minstens 4 wegingen in de periode nodig",
        hintNoRate:
            "Het weektempo heeft 4 wegingen in de laatste 3 weken nodig",
        statPerWeek: "Per week",
        statGoalPace: "Doel in dit tempo",
        statGoalReached: "Doel bereikt",
        statToGoal: "Tot je doel",
        statSince: "Sinds {date}",
        unitWeeks: {
            one: "week",
            other: "weken",
        },
        unitYears: "jaar",
        goalPill: "Doel {goal} · nog {left}",
        goalPillReached: "Doel {goal} ✓",
        goalBelow: "Doel {goal}  ↓ {left} lager",
        goalAbove: "Doel {goal}  ↑ {left} hoger",
        today: "Vandaag",
        yesterday: "Gisteren",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (gem. van {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, gemiddelde van {n}",
        chartAriaLabel:
            "Gewichtsgrafiek, laatst {latest}{goal}{change}. Tik op een dag om de waarde te zien.",
        chartAriaGoal: ", doel {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Sluiten",
        oneTitleFirst: "Je trend begint hier",
        oneTitle: "Maar één weging in {range}",
        oneFirst: "Eerste weging · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "De grafiek begint bij een tweede weging",
        oneHintEarlier: {
            one: "{n} eerdere wegingsdag in langere periodes",
            other: "{n} eerdere wegingsdagen in langere periodes",
        },
        emptyRange: "Geen wegingen in {range}.",
        emptyRangeLast: "Geen wegingen in {range}. De laatste was op {date}.",
        showMore: "Meer tonen",
        showLess: "Minder tonen",
        detailsAria: "{action}: wegingen en lichaamsmaten",
        detailsAriaWeighIns: "{action}: wegingen",
        collapseAll: "Alles inklappen",
        sectionWeighIns: "Wegingen",
        sectionMeasurements: "Lichaamsmaten · {range}",
        accLabel: {
            one: "{n} weging {range}",
            other: "{n} wegingen {range}",
        },
        accEmpty: "Geen wegingen {range}",
        accAvgRange: "gem. {avg} · bereik {min}–{max}",
        loggedToday: "vandaag gelogd",
        loggedYesterday: "gisteren gelogd",
        loggedOn: "gelogd op {date}",
        weekThis: "Deze week",
        weekLast: "Vorige week",
        weekAvg: "gem. {value}",
        weekVsLast: "{change} t.o.v. vorige week",
        weekVsBefore: "{change} t.o.v. de week ervoor",
        dayMulti: {
            one: "{n} weging · gemiddeld",
            other: "{n} wegingen · gemiddeld",
        },
        showEarlierWeeks: {
            one: "{n} eerdere week tonen",
            other: "{n} eerdere weken tonen",
        },
        sites: {
            waist: "Taille",
            hips: "Heupen",
            neck: "Nek",
            chest: "Borst",
            shoulders: "Schouders",
            upper_arm: "Bovenarm",
            forearm: "Onderarm",
            thigh: "Dij",
            calf: "Kuit",
        },
        measSince: "{change} sinds {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ geen verandering",
        measFirst: "eerste meting · {date}",
        measFirstRow: "eerste",
        measStale: "niet gemeten in deze periode · laatst op {date}",
        measEarlier: "Eerdere metingen",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "Nog {n} tonen",
            other: "Nog {n} tonen",
        },
        noMeasurements:
            "Geen lichaamsmaten in het afgelopen jaar. Taille, heupen en zeven andere plekken kun je bijhouden in centimeters of inches.",
    },
    importMeals: {
        loading: "Import wordt voorbereid…",
        stepFile: "Bestand",
        stepMap: "Kolommen koppelen",
        stepPreview: "Voorbeeld",
        stepImport: "Importeren",
        fieldLabels: {
            logged_at: "Datum / tijd",
            description: "Naam voedingsmiddel",
            meal_type: "Maaltijd",
            calories: "Calorieën",
            protein_g: "Eiwitten (g)",
            carbs_g: "Koolhydraten (g)",
            fat_g: "Vet (g)",
            fiber_g: "Vezels (g)",
            sugar_g: "Suiker, totaal (g)",
            added_sugar_g: "Toegevoegde suiker (g)",
            saturated_fat_g: "Verzadigd vet (g)",
            trans_fat_g: "Transvet (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Cafeïne (mg)",
            sodium_mg: "Natrium (mg)",
            notes: "Notities",
            time: "Tijd (aparte kolom)",
            deleted: "Markering ‘verwijderd’",
            source_id: "Maaltijd-id (uit onze export)",
            timezone: "Tijdzone (uit onze export)",
        },
        chooseExportHeading: "Kies je export",
        noToolsWarning:
            "Deze app laat dit venster niet in je eetdagboek schrijven. Vraag Claude dan om het bestand zelf te importeren; dat kan rechtstreeks.",
        emailFallback: "Lukt het via Claude ook niet? Mail dan naar {email}.",
        tzWarning:
            "Je tijdzone is niet ingesteld, dus tijden worden als UTC gelezen en kunnen op de verkeerde dag terechtkomen. Vraag Claude om eerst je tijdzone in te stellen.",
        dropChoose: "Kies een CSV-bestand",
        dropOr: "of sleep het hierheen",
        recognizedHint:
            "Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden automatisch herkend. Er wordt niets opgeslagen totdat je bevestigt.",
        dateMapHint:
            "Koppel hierboven een datumkolom om te zien hoe een waarde uit je bestand wordt omgezet.",
        dateNoneHint: "Die kolom bevat geen datums.",
        dateUnreadable:
            "{raw} → niet te lezen als {format}, dus rijen zoals deze worden overgeslagen",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Koppel hierboven een caloriekolom om te zien hoe een waarde uit je bestand wordt omgezet.",
        energyNoneHint: "Die kolom bevat geen getallen.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (geen omrekening)",
        dateAmbiguousWarning:
            "Uit dit bestand valt het datumformaat niet af te leiden: de datums zijn net zo goed te lezen met de dag vooraan als met de maand vooraan. Bevestig welk formaat je app exporteert. Kies je verkeerd, dan komen maaltijden zonder foutmelding op de verkeerde dag terecht.",
        dateFormatLabel: "Datumformaat in dit bestand",
        dateFormatYmd: "Jaar-maand-dag",
        dateFormatDmy: "Dag/maand/jaar",
        dateFormatMdy: "Maand/dag/jaar",
        energyUnitLabel: "Energie-eenheid van de caloriekolom",
        energyUnitKcal: "Calorieën",
        energyUnitKj: "Kilojoules",
        mapColumnsHeading: "Kolommen koppelen",
        rowsCount: { one: "{n} rij", other: "{n} rijen" },
        columnsCount: { one: "{n} kolom", other: "{n} kolommen" },
        delimiterLabel: "scheidingsteken",
        tabLabel: "tab",
        notInFile: "(niet in dit bestand)",
        columnFallback: "kolom {n}",
        caffeineGramsNotice:
            "De cafeïnekolom in dit bestand ({column}) staat in gram, maar cafeïne wordt opgeslagen in milligram, dus Cafeïne is niet gekoppeld. Wel koppelen zou 0,18 vastleggen waar op het etiket 180 mg staat. Hetzelfde bestand later opnieuw importeren vult dit niet alsnog aan: die rijen zijn dan al gelogd en worden als duplicaten overgeslagen. Klopt de kolomkop niet en staan de waarden echt in milligram, kies de kolom dan hierboven. Staan ze echt in gram, vermenigvuldig ze dan vóór het importeren met 1000 in het bestand, niet erna.",
        alcoholNotice:
            "Dit bestand heeft een alcoholkolom ({column}), maar alcoholregistratie staat uit voor dit account, dus die kolom wordt niet geïmporteerd. Hetzelfde bestand later opnieuw importeren vult dit niet alsnog aan: die rijen zijn dan al gelogd en worden als duplicaten overgeslagen. Wil je deze gegevens bewaren, vraag Claude dan vóór het importeren om alcoholregistratie (set_alcohol_tracking) aan te zetten.",
        sampleValue: "bijv. {sample}",
        sourceAppLabel: "Bron-app (optioneel)",
        sourceAppHint:
            "Hiermee krijgen rijen zonder eigen productnaam toch een label.",
        previewButton: "Voorbeeld bekijken",
        chooseAnotherButton: "Ander bestand kiezen",
        previewHeading: "Voorbeeld",
        datesReadAs: "Datums gelezen als {format}; energie {conversion}.",
        energyConvertedNote: "omgerekend van kJ naar kcal",
        energyReadAsKcal: "gelezen als kcal",
        badDatesWarning: {
            one: "{n} rij is overgeslagen omdat de datum niet als {format} te lezen was{sample}. Ga terug en kies het datumformaat dat bij je bestand past.",
            other: "{n} rijen zijn overgeslagen omdat de datum niet als {format} te lezen was{sample}. Ga terug en kies het datumformaat dat bij je bestand past.",
        },
        badDateSample: " (bijv. regel {line}: {value})",
        noTimeWarning: {
            one: "{n} rij heeft een datum maar geen tijd en wordt om 12:00 gelogd.",
            other: "{n} rijen hebben een datum maar geen tijd en worden om 12:00 gelogd.",
        },
        splitDatesCount: {
            one: "{n} datum heeft",
            other: "{n} datums hebben",
        },
        splitDatesWarning:
            " meer dan {max} maaltijden (bijv. {date}), dus de import is over meerdere batches verdeeld. Staan er op die datum twee registraties met precies hetzelfde voedingsmiddel, hetzelfde maaltijdtype en dezelfde macro's, dan kan er één als duplicaat worden overgeslagen in plaats van geïmporteerd.",
        tableAbbr: {
            protein_g: "E",
            carbs_g: "K",
            fat_g: "V",
            fiber_g: "Vezels",
            sugar_g: "Suiker",
            added_sugar_g: "Toegev",
            saturated_fat_g: "Verz.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Regel",
        tableWhen: "Tijdstip",
        tableMeal: "Maaltijd",
        tableFood: "Voedingsmiddel",
        tableProblem: "Probleem",
        noNameFallback: "(geen naam, krijgt het maaltijdtype als naam)",
        showingRows: "{shown} van {total} rijen weergegeven",
        checkingRows: {
            one: "{n} rij wordt gecontroleerd…",
            other: "{n} rijen worden gecontroleerd…",
        },
        importingRows: {
            one: "{n} rij wordt geïmporteerd…",
            other: "{n} rijen worden geïmporteerd…",
        },
        batchProgress: "{label} (batch {done} van {total})",
        rowsRange: "Rijen {a}–{b}: {msg}",
        preflightFailed: "Controle vooraf mislukt.",
        rowsWouldFail: {
            one: "{n} rij zou mislukken, bijv. regel {line}: {message}",
            other: "{n} rijen zouden mislukken, bijv. regel {line}: {message}",
        },
        importingEllipsis: "Bezig met importeren…",
        importButton: {
            one: "{n} maaltijd importeren",
            other: "{n} maaltijden importeren",
        },
        backToMapping: "Terug naar koppelen",
        importCompleteHeading: "Import voltooid",
        resultMealsImported: {
            one: "{n} maaltijd geïmporteerd",
            other: "{n} maaltijden geïmporteerd",
        },
        resultAlreadyLogged: {
            one: ", {n} al gelogd",
            other: ", {n} al gelogd",
        },
        resultFailed: {
            one: ", {n} mislukt",
            other: ", {n} mislukt",
        },
        resultSkipped: {
            one: ", {n} overgeslagen",
            other: ", {n} overgeslagen",
        },
        restartButton: "Nog een bestand importeren",
        couldNotReadFile: "Dat bestand kon niet worden gelezen: {msg}",
        noDataRows: "Geen datarijen gevonden in dat bestand.",
        emailNotice:
            "Werkt het niet zoals verwacht? Mail naar {email} en stuur de regels hieronder mee; meer is er niet nodig om het probleem te achterhalen.",
        eyebrow: "Maaltijden importeren",
        eyebrowWithFile: "Maaltijden importeren · {file}",
        stepsLabel: "Importstappen",
        stepAriaDone: "Stap {i} van 4: {name}, voltooid",
        stepAriaCurrent: "Stap {i} van 4: {name}, huidige stap",
        stepAriaUpcoming: "Stap {i} van 4: {name}",
        browseFiles: "Bestanden kiezen",
        dropAccept: ".csv of tekst gescheiden door tabs",
        dropAria: "Kies een CSV-bestand of sleep het hierheen",
        privacyNote:
            "Het bestand wordt hier gelezen, in dit paneel. De rijen gaan nooit via de chat: de assistent krijgt alleen een samenvatting van één regel als de import klaar is.",
        binaryFile:
            "Dat bestand kon niet worden gelezen: het lijkt een binair bestand (een Excel-werkmap?), geen CSV-tekst. Exporteer het als CSV en probeer het opnieuw.",
        columnsHeading: "Kolommen",
        fieldsMatched: {
            one: "{n} van {total} veld gekoppeld",
            other: "{n} van {total} velden gekoppeld",
        },
        tableFieldHead: "Veld",
        tableColumnHead: "Kolom in je bestand",
        tableRow1Head: "Waarde in rij 1",
        badgeNew: "nieuw",
        colNumber: "Kol. {n}",
        colNumberAuto: "Kol. {n} · automatisch",
        colNumberManual: "Kol. {n} · door jou gekozen",
        row1Empty: "rij 1 leeg",
        alsoUsed: "ook {field}",
        sameColumn: "Zelfde kolom als {fields}",
        columnForAria: "Kolom voor {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", verplicht",
        columnAria: "kolom {n}, {name}",
        notInFileAria: "niet in dit bestand",
        sampleAria: ", {sample}",
        howRead: "Hoe waarden worden gelezen",
        appExport: "Export uit {app}",
        tileMeals: {
            one: "maaltijd te importeren",
            other: "maaltijden te importeren",
        },
        tileKcal: "kcal in totaal",
        tileSkipped: { one: "rij overgeslagen", other: "rijen overgeslagen" },
        tileBatches: { one: "batch", other: "batches" },
        rowsHeading: "Rijen",
        scrollLeft: "Tabel naar links scrollen",
        scrollRight: "Tabel naar rechts scrollen",
        previewRegionAria: "Voorbeeld van de rijen die worden geïmporteerd",
        expandAllDays: "Alle dagen uitklappen",
        collapseAllDays: "Alle dagen inklappen",
        dayRows: { one: "{n} rij", other: "{n} rijen" },
        dayRowsKcal: {
            one: "{n} rij · {kcal} kcal",
            other: "{n} rijen · {kcal} kcal",
        },
        noTimeShort: "geen tijd",
        lineN: "Regel {n}",
        rowCardAria: "Regel {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "geen maaltijd",
        noKcalAria: "geen calorieën",
        noRowsToImport:
            "Met de huidige koppeling zijn er geen rijen om te importeren.",
        importOff:
            "Importeren staat uit: deze host laat deze weergave niet in je logboek schrijven. Vraag Claude in plaats daarvan om het bestand te importeren.",
        backBusy: "Terug kan niet zolang er batches worden verstuurd.",
        progressAria: "Voortgang van de import, batches",
        failedRowsAria: "Mislukte rijen",
        toldOnly: "De assistent kreeg alleen te horen: {summary}",
        liveStep: "Stap {i} van 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Bezig met importeren. {n} batch.",
            other: "Bezig met importeren. {n} batches.",
        },
        liveDone: {
            one: "Import voltooid. {n} maaltijd geïmporteerd.",
            other: "Import voltooid. {n} maaltijden geïmporteerd.",
        },
        liveNoWrite:
            "De voorafgaande controle is mislukt. Er is niets opgeslagen.",
        liveFileError: "Dat bestand kon niet worden gebruikt.",
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

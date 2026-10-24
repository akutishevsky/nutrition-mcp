import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_ES: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorías",
            protein_g: "Proteínas",
            carbs_g: "Carbohidratos",
            fat_g: "Grasas",
            sugar_g: "Azúcar",
            added_sugar_g: "Azúcar añadido",
            saturated_fat_g: "Grasas saturadas",
            trans_fat_g: "Grasas trans",
            alcohol_g: "Alcohol",
            caffeine_mg: "Cafeína",
            sodium_mg: "Sodio",
            fiber_g: "Fibra",
            water_ml: "Agua",
        },
        noGoalSet: "sin objetivo",
        atLimit: "en el límite",
        floorUnder: "restantes",
        ceilingUnder: "por debajo",
        over: "de más",
        limitPrefix: "límite",
        ofPrefix: "de",
        drinkLabels: {
            us: "bebidas estándar (EE. UU.)",
            uk: "unidades (R. U.)",
        },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nada registrado",
        notRecorded: "sin registrar",
        caloriesToday: "Calorías de hoy",
        caloriesOn: "Calorías · {date}",
        tapHint: "Toca un valor para ver qué comidas lo aportan",
        showMealsContributed: "Ver qué comidas lo aportaron.",
        byMealTitle: "{label} por comida",
        closeBreakdown: "Cerrar desglose",
        noMealsContributed: "Ninguna comida registrada aportó {label}.",
        untitledMeal: "Comida sin nombre",
        moreMeals: {
            one: "+ {n} comida más pequeña",
            other: "+ {n} comidas más pequeñas",
        },
        moreMealsAtLeast: {
            one: "+ al menos {n} comida más pequeña",
            other: "+ al menos {n} comidas más pequeñas",
        },
        moreMealsMaybe: "+ quizá otras comidas más pequeñas",
        ingredientCount: {
            one: "{n} ingrediente",
            other: "{n} ingredientes",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "tuya",
        sourceEst: "est.",
        sourceMixed: "mixto",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "código de barras",
        sourceDataType: "tipo de dato",
        sourceAria: "Fuente: {source}",
        sourceDetailsAria: "Mostrar detalles de la fuente",
    },
    bridge: {
        settingsFooter:
            "Puedes activar o desactivar estos widgets cuando quieras: solo tienes que pedir que se actualice tu configuración.",
        connectFailed: "Este panel no pudo conectarse con la app.",
    },
    nutritionSummary: {
        title: "Resumen nutricional",
        loading: "Cargando tu resumen nutricional…",
        empty: "No hay comidas ni agua registradas en este periodo.",
        caloriesPerDay: "Calorías / día",
        daysLogged: {
            one: "{n} día registrado",
            other: "{n} días registrados",
        },
        daysOfLogged: "{logged} de {span} días registrados",
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
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
        ],
    },
    goalProgress: {
        loading: "Cargando el progreso de tus objetivos…",
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
        loading: "Cargando tus tendencias…",
        windowAriaLabel: "Periodo de la tendencia",
        segWeek: "Sem.",
        segMonth: "Mes",
        segQuarter: "Trim.",
        segYear: "Año",
        segDays: "Días",
        segWeekAria: "Mostrar medias semanales",
        segMonthAria: "Mostrar medias mensuales",
        segQuarterAria: "Mostrar medias trimestrales",
        segYearAria: "Mostrar medias anuales",
        segDaysAria: "Mostrar tendencias diarias",
        periodTitleWeek: "Medias semanales",
        periodTitleMonth: "Medias mensuales",
        periodTitleQuarter: "Medias trimestrales",
        periodTitleYear: "Medias anuales",
        perLoggedDay: "por día registrado",
        daysLogged: "{logged}/{total} días",
        onTarget: "en objetivo {k}/{n}",
        possiblyIncomplete: {
            one: "{n} posiblemente incompleto",
            other: "{n} posiblemente incompletos",
        },
        partial: "en curso",
        nothingLogged: "nada registrado",
        targetsChanged: "objetivos cambiados en el periodo",
        targetsAssumed: "objetivos anteriores al {date} sin registrar",
        noTargets: "Sin objetivos: solo medias.",
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
        loading: "Cargando la evolución de tu peso…",
        empty: "Aún no hay pesos registrados en este periodo.",
        eyebrowToday: "Peso · hoy",
        eyebrowLast: "Peso · último pesaje {date}",
        titleFirst: "Primer pesaje registrado",
        titleFew: "Pocos pesajes por ahora",
        titleNoRate:
            "No hay suficientes pesajes recientes para un ritmo semanal",
        titleSteady: "Estable",
        titleDown: "Tendencia a la baja",
        titleUp: "Tendencia al alza",
        titleGoalReached: "Objetivo alcanzado",
        titleAway: "Te estás alejando de tu objetivo",
        titleOnTrack: "En camino a tu objetivo",
        titleShortSteady: "Estable, aún sin llegar a tu objetivo",
        rangeGroupAriaLabel: "Periodo",
        ranges: {
            "7": {
                label: "7 d",
                aria: "Mostrar los últimos 7 días",
                word: "los últimos 7 días",
                inRange: "en 7 días",
                heading: "últimos 7 días",
                chip: "7 d",
            },
            "30": {
                label: "30 d",
                aria: "Mostrar los últimos 30 días",
                word: "los últimos 30 días",
                inRange: "en 30 días",
                heading: "últimos 30 días",
                chip: "30 d",
            },
            "90": {
                label: "90 d",
                aria: "Mostrar los últimos 90 días",
                word: "los últimos 90 días",
                inRange: "en 90 días",
                heading: "últimos 90 días",
                chip: "90 d",
            },
            "1y": {
                label: "1 a",
                aria: "Mostrar el último año",
                word: "el último año",
                inRange: "en un año",
                heading: "último año",
                chip: "1 a",
            },
            all: {
                label: "Todo",
                aria: "Mostrar todo el historial",
                word: "todo el historial",
                inRange: "en total",
                heading: "todo el historial",
                chip: "Todo",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} por semana",
        perWeekAvg: "{amount} por semana de media",
        toGoal: "{value} hasta el objetivo",
        weeksApprox: {
            one: "~{n} semana",
            other: "~{n} semanas",
        },
        yearsPlus: "2+ años",
        reachedOn: "alcanzado el {date}",
        movingAway: "alejándose del objetivo",
        tooFlat: "demasiado plano para estimar una fecha",
        hintFew:
            "Una línea de tendencia necesita al menos 4 pesajes en el periodo",
        hintNoRate:
            "El ritmo semanal necesita 4 pesajes en las últimas 3 semanas",
        statPerWeek: "Por semana",
        statGoalPace: "Objetivo a este ritmo",
        statGoalReached: "Objetivo alcanzado",
        statToGoal: "Hasta el objetivo",
        statSince: "Desde {date}",
        unitWeeks: {
            one: "semana",
            other: "semanas",
        },
        unitYears: "años",
        goalPill: "Objetivo {goal} · faltan {left}",
        goalPillReached: "Objetivo {goal} ✓",
        goalBelow: "Objetivo {goal}  ↓ {left} por debajo",
        goalAbove: "Objetivo {goal}  ↑ {left} por encima",
        today: "Hoy",
        yesterday: "Ayer",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (media de {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, media de {n}",
        chartAriaLabel:
            "Gráfico de peso, último {latest}{goal}{change}. Toca un día para ver su valor.",
        chartAriaGoal: ", objetivo {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Cerrar",
        oneTitleFirst: "Tu tendencia empieza aquí",
        oneTitle: "Solo un pesaje en {range}",
        oneFirst: "Primer pesaje · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "El gráfico empieza con un segundo pesaje",
        oneHintEarlier: {
            one: "{n} día anterior con pesaje en periodos más largos",
            other: "{n} días anteriores con pesaje en periodos más largos",
        },
        emptyRange: "Sin pesajes en {range}.",
        emptyRangeLast: "Sin pesajes en {range}. El último fue el {date}.",
        showMore: "Mostrar más",
        showLess: "Mostrar menos",
        detailsAria: "{action}: pesajes y medidas",
        detailsAriaWeighIns: "{action}: pesajes",
        collapseAll: "Contraer todo",
        sectionWeighIns: "Pesajes",
        sectionMeasurements: "Medidas corporales · {range}",
        accLabel: {
            one: "{n} pesaje {range}",
            other: "{n} pesajes {range}",
        },
        accEmpty: "Sin pesajes {range}",
        accAvgRange: "media {avg} · rango {min}–{max}",
        loggedToday: "registrado hoy",
        loggedYesterday: "registrado ayer",
        loggedOn: "registrado el {date}",
        weekThis: "Esta semana",
        weekLast: "La semana pasada",
        weekAvg: "media {value}",
        weekVsLast: "{change} vs. la semana pasada",
        weekVsBefore: "{change} vs. la semana anterior",
        dayMulti: {
            one: "{n} pesaje · promediado",
            other: "{n} pesajes · promediados",
        },
        showEarlierWeeks: {
            one: "Mostrar {n} semana anterior",
            other: "Mostrar {n} semanas anteriores",
        },
        sites: {
            waist: "Cintura",
            hips: "Cadera",
            neck: "Cuello",
            chest: "Pecho",
            shoulders: "Hombros",
            upper_arm: "Brazo",
            forearm: "Antebrazo",
            thigh: "Muslo",
            calf: "Pantorrilla",
        },
        measSince: "{change} desde el {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ sin cambios",
        measFirst: "primera medida · {date}",
        measFirstRow: "primera",
        measStale: "sin medir en este periodo · última el {date}",
        measEarlier: "Medidas anteriores",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "Mostrar {n} más",
            other: "Mostrar {n} más",
        },
        noMeasurements:
            "No hay medidas corporales del último año. Cintura, cadera y otras siete zonas se pueden registrar en centímetros o pulgadas.",
    },
    importMeals: {
        loading: "Preparando la importación…",
        stepFile: "Archivo",
        stepMap: "Asignar columnas",
        stepPreview: "Vista previa",
        stepImport: "Importar",
        fieldLabels: {
            logged_at: "Fecha / hora",
            description: "Nombre del alimento",
            meal_type: "Tipo de comida",
            calories: "Calorías",
            protein_g: "Proteínas (g)",
            carbs_g: "Carbohidratos (g)",
            fat_g: "Grasas (g)",
            fiber_g: "Fibra (g)",
            sugar_g: "Azúcares totales (g)",
            added_sugar_g: "Azúcares añadidos (g)",
            saturated_fat_g: "Grasas saturadas (g)",
            trans_fat_g: "Grasas trans (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Cafeína (mg)",
            sodium_mg: "Sodio (mg)",
            notes: "Notas",
            time: "Hora (columna aparte)",
            deleted: "Marca de eliminado",
            source_id: "ID de comida (de nuestra exportación)",
            timezone: "Zona horaria (de nuestra exportación)",
        },
        chooseExportHeading: "Elige el archivo exportado",
        noToolsWarning:
            "Esta app no permite que este panel guarde datos en tu registro. Pídele a Claude que importe el archivo: puede hacerlo directamente.",
        emailFallback:
            "Si pedírselo a Claude tampoco funciona, escribe a {email}.",
        tzWarning:
            "Tu zona horaria no está configurada, así que las horas se leerán en UTC y podrían caer en el día equivocado. Pídele a Claude que configure primero tu zona horaria.",
        dropChoose: "Elige un archivo CSV",
        dropOr: "o arrástralo aquí",
        recognizedHint:
            "Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor se reconocen automáticamente. No se guarda nada hasta que confirmes.",
        dateMapHint:
            "Asigna arriba una columna de fecha para ver cómo se convierte un valor de tu archivo.",
        dateNoneHint: "Esa columna no contiene fechas.",
        dateUnreadable:
            "{raw} → no se puede leer como {format}, así que se omitirán las filas como esta",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Asigna arriba una columna de calorías para ver cómo se convierte un valor de tu archivo.",
        energyNoneHint: "Esa columna no contiene números.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (sin conversión)",
        dateAmbiguousWarning:
            "No se pudo determinar el formato de fecha de este archivo, porque sus fechas pueden leerse tanto con el día primero como con el mes primero. Confirma cuál usa tu app al exportar: si eliges mal, las comidas se registrarán en el día equivocado sin que aparezca ningún error.",
        dateFormatLabel: "Formato de fecha en este archivo",
        dateFormatYmd: "Año-Mes-Día",
        dateFormatDmy: "Día/Mes/Año",
        dateFormatMdy: "Mes/Día/Año",
        energyUnitLabel: "Unidad de energía de la columna de calorías",
        energyUnitKcal: "Calorías",
        energyUnitKj: "Kilojulios",
        mapColumnsHeading: "Asignar columnas",
        rowsCount: { one: "{n} fila", other: "{n} filas" },
        columnsCount: { one: "{n} columna", other: "{n} columnas" },
        delimiterLabel: "separador",
        tabLabel: "tabulación",
        notInFile: "(no está en este archivo)",
        columnFallback: "columna {n}",
        caffeineGramsNotice:
            "La columna de cafeína de este archivo ({column}) está en gramos, pero la cafeína se guarda en miligramos, así que el campo Cafeína quedó sin asignar. Si la asignaras, se registraría 0,18 donde la etiqueta dice 180 mg. Si vuelves a importar el mismo archivo más tarde, ese dato no se añadirá: esas filas ya estarán registradas y se omitirán como duplicadas. Si el encabezado está mal etiquetado y los valores son en realidad miligramos, selecciónala arriba; si de verdad son gramos, multiplícalos por 1000 en el archivo antes de importar, no después.",
        alcoholNotice:
            "Este archivo tiene una columna de alcohol ({column}), pero el seguimiento de alcohol está desactivado en esta cuenta, así que no se importará. Si vuelves a importar el mismo archivo más tarde, ese dato no se añadirá: esas filas ya estarán registradas y se omitirán como duplicadas. Para conservar estos datos, pídele a Claude que active el seguimiento de alcohol (set_alcohol_tracking) antes de importar.",
        sampleValue: "p. ej. {sample}",
        sourceAppLabel: "App de origen (opcional)",
        sourceAppHint:
            "Sirve para etiquetar las filas que no tienen nombre de alimento propio.",
        previewButton: "Previsualizar importación",
        chooseAnotherButton: "Elegir otro archivo",
        previewHeading: "Vista previa",
        datesReadAs: "Fechas leídas como {format}; energía {conversion}.",
        energyConvertedNote: "convertida de kJ a kcal",
        energyReadAsKcal: "leída como kcal",
        badDatesWarning: {
            one: "Se omitió {n} fila porque su fecha no se pudo leer como {format}{sample}. Vuelve atrás y elige el formato de fecha de tu archivo.",
            other: "Se omitieron {n} filas porque sus fechas no se pudieron leer como {format}{sample}. Vuelve atrás y elige el formato de fecha de tu archivo.",
        },
        badDateSample: " (p. ej. línea {line}: {value})",
        noTimeWarning: {
            one: "{n} fila tiene fecha, pero no hora: se registrará al mediodía.",
            other: "{n} filas tienen fecha, pero no hora: se registrarán al mediodía.",
        },
        splitDatesCount: {
            one: "{n} fecha tiene",
            other: "{n} fechas tienen",
        },
        splitDatesWarning:
            " más de {max} comidas (p. ej. {date}), así que hubo que repartir la importación en varios lotes. Si esa fecha contiene dos entradas con exactamente el mismo alimento, tipo de comida y macros, una de ellas podría omitirse como duplicada en vez de importarse.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "Carb",
            fat_g: "G",
            fiber_g: "Fib",
            sugar_g: "Azúc",
            added_sugar_g: "Añad",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Línea",
        tableWhen: "Fecha",
        tableMeal: "Comida",
        tableFood: "Alimento",
        tableProblem: "Problema",
        noNameFallback: "(sin nombre: se etiquetará según la comida)",
        showingRows: "Mostrando {shown} de {total} filas",
        checkingRows: {
            one: "Comprobando {n} fila…",
            other: "Comprobando {n} filas…",
        },
        importingRows: {
            one: "Importando {n} fila…",
            other: "Importando {n} filas…",
        },
        batchProgress: "{label} (lote {done} de {total})",
        rowsRange: "Filas {a}–{b}: {msg}",
        preflightFailed: "Falló la comprobación previa.",
        rowsWouldFail: {
            one: "{n} fila fallaría, p. ej. línea {line}: {message}",
            other: "{n} filas fallarían, p. ej. línea {line}: {message}",
        },
        importingEllipsis: "Importando…",
        importButton: {
            one: "Importar {n} comida",
            other: "Importar {n} comidas",
        },
        backToMapping: "Volver a la asignación",
        importCompleteHeading: "Importación completada",
        resultMealsImported: {
            one: "{n} comida importada",
            other: "{n} comidas importadas",
        },
        resultAlreadyLogged: {
            one: ", {n} ya registrada",
            other: ", {n} ya registradas",
        },
        resultFailed: {
            one: ", {n} fallida",
            other: ", {n} fallidas",
        },
        resultSkipped: {
            one: ", {n} omitida",
            other: ", {n} omitidas",
        },
        restartButton: "Importar otro archivo",
        couldNotReadFile: "No se pudo leer ese archivo: {msg}",
        noDataRows: "No se encontraron filas de datos en ese archivo.",
        emailNotice:
            "¿No funciona como esperabas? Escribe a {email} e incluye las líneas de abajo: es todo lo que hace falta para diagnosticarlo.",
        eyebrow: "Importar comidas",
        eyebrowWithFile: "Importar comidas · {file}",
        stepsLabel: "Pasos de la importación",
        stepAriaDone: "Paso {i} de 4: {name}, completado",
        stepAriaCurrent: "Paso {i} de 4: {name}, actual",
        stepAriaUpcoming: "Paso {i} de 4: {name}",
        browseFiles: "Buscar archivos",
        dropAccept: ".csv o texto separado por tabulaciones",
        dropAria: "Elige un archivo CSV o arrástralo aquí",
        privacyNote:
            "El archivo se lee aquí, en este panel. Sus filas nunca pasan por el chat: el asistente solo recibe un resumen de una línea cuando termina la importación.",
        binaryFile:
            "No se pudo leer ese archivo: parece un archivo binario (¿un libro de Excel?), no texto CSV. Expórtalo como CSV e inténtalo de nuevo.",
        columnsHeading: "Columnas",
        fieldsMatched: {
            one: "{n} de {total} campo asignado",
            other: "{n} de {total} campos asignados",
        },
        tableFieldHead: "Campo",
        tableColumnHead: "Columna en tu archivo",
        tableRow1Head: "Valor de la fila 1",
        badgeNew: "nuevo",
        colNumber: "Col. {n}",
        colNumberAuto: "Col. {n} · automática",
        colNumberManual: "Col. {n} · elegida por ti",
        row1Empty: "fila 1 vacía",
        alsoUsed: "también {field}",
        sameColumn: "Misma columna que {fields}",
        columnForAria: "Columna para {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", obligatorio",
        columnAria: "columna {n}, {name}",
        notInFileAria: "no está en este archivo",
        sampleAria: ", {sample}",
        howRead: "Cómo se leen los valores",
        appExport: "Exportación de {app}",
        tileMeals: {
            one: "comida por importar",
            other: "comidas por importar",
        },
        tileKcal: "kcal en total",
        tileSkipped: { one: "fila omitida", other: "filas omitidas" },
        tileBatches: { one: "lote", other: "lotes" },
        rowsHeading: "Filas",
        scrollLeft: "Desplazar la tabla a la izquierda",
        scrollRight: "Desplazar la tabla a la derecha",
        previewRegionAria: "Vista previa de las filas que se importarán",
        expandAllDays: "Desplegar todos los días",
        collapseAllDays: "Plegar todos los días",
        dayRows: { one: "{n} fila", other: "{n} filas" },
        dayRowsKcal: {
            one: "{n} fila · {kcal} kcal",
            other: "{n} filas · {kcal} kcal",
        },
        noTimeShort: "sin hora",
        lineN: "Línea {n}",
        rowCardAria: "Línea {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "sin comida",
        noKcalAria: "sin calorías",
        noRowsToImport: "No hay filas que importar con la asignación actual.",
        importOff:
            "La importación está desactivada: este host no permite que esta vista escriba en tu registro. Pídele a Claude que importe el archivo.",
        backBusy: "No puedes volver atrás mientras se envían los lotes.",
        progressAria: "Progreso de la importación, lotes",
        failedRowsAria: "Filas que fallaron",
        toldOnly: "Al asistente solo se le dijo: {summary}",
        liveStep: "Paso {i} de 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Importando. {n} lote.",
            other: "Importando. {n} lotes.",
        },
        liveDone: {
            one: "Importación completada. {n} comida importada.",
            other: "Importación completada. {n} comidas importadas.",
        },
        liveNoWrite: "La comprobación previa falló. No se guardó nada.",
        liveFileError: "No se pudo usar ese archivo.",
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

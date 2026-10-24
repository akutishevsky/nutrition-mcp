import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_JA: WidgetStrings = {
    macros: {
        labels: {
            calories: "カロリー",
            protein_g: "タンパク質",
            carbs_g: "炭水化物",
            fat_g: "脂質",
            sugar_g: "糖類",
            added_sugar_g: "添加糖",
            saturated_fat_g: "飽和脂肪酸",
            trans_fat_g: "トランス脂肪酸",
            alcohol_g: "アルコール",
            caffeine_mg: "カフェイン",
            sodium_mg: "ナトリウム",
            fiber_g: "食物繊維",
            water_ml: "水分",
        },
        noGoalSet: "目標未設定",
        atLimit: "上限に到達",
        floorUnder: "残り",
        ceilingUnder: "余裕",
        over: "超過",
        limitPrefix: "上限",
        ofPrefix: "目標",
        drinkLabels: { us: "US標準ドリンク", uk: "UKユニット" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "記録なし",
        notRecorded: "未記録",
        caloriesToday: "今日のカロリー",
        caloriesOn: "{date}のカロリー",
        tapHint: "項目をタップすると食事ごとの内訳を表示",
        showMealsContributed: "該当する食事を表示します。",
        byMealTitle: "{label}の食事別内訳",
        closeBreakdown: "内訳を閉じる",
        noMealsContributed: "{label}を含む食事の記録はありません。",
        untitledMeal: "名前のない食事",
        moreMeals: {
            one: "ほか少量の食事{n}件",
            other: "ほか少量の食事{n}件",
        },
        moreMealsAtLeast: {
            one: "ほか少量の食事{n}件以上",
            other: "ほか少量の食事{n}件以上",
        },
        moreMealsMaybe: "ほかにも少量の食事があるかもしれません",
        ingredientCount: {
            one: "材料{n}点",
            other: "材料{n}点",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "自分",
        sourceEst: "推定",
        sourceMixed: "混合",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "バーコード",
        sourceDataType: "データ種別",
        sourceAria: "出典: {source}",
        sourceDetailsAria: "出典の詳細を表示",
    },
    bridge: {
        settingsFooter:
            "ウィジェットはいつでもオン・オフできます。設定の変更を頼むだけでOKです。",
        connectFailed: "この画面はホストに接続できませんでした。",
    },
    nutritionSummary: {
        title: "栄養サマリー",
        loading: "栄養サマリーを読み込み中…",
        empty: "この期間に記録された食事や水分はありません。",
        caloriesPerDay: "1日あたりのカロリー",
        daysLogged: {
            one: "{n}日分を記録",
            other: "{n}日分を記録",
        },
        daysOfLogged: "{span}日中{logged}日を記録",
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
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
        ],
    },
    goalProgress: {
        loading: "目標の進捗を読み込み中…",
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
        loading: "トレンドを読み込み中…",
        windowAriaLabel: "期間の切り替え",
        segWeek: "週",
        segMonth: "月",
        segQuarter: "四半期",
        segYear: "年",
        segDays: "日別",
        segWeekAria: "週ごとの平均を表示",
        segMonthAria: "月ごとの平均を表示",
        segQuarterAria: "四半期ごとの平均を表示",
        segYearAria: "年ごとの平均を表示",
        segDaysAria: "日ごとのトレンドを表示",
        periodTitleWeek: "週ごとの平均",
        periodTitleMonth: "月ごとの平均",
        periodTitleQuarter: "四半期ごとの平均",
        periodTitleYear: "年ごとの平均",
        perLoggedDay: "記録日あたり",
        daysLogged: "{logged}/{total}日",
        onTarget: "目標内 {k}/{n}",
        possiblyIncomplete: {
            one: "{n}日は不完全の可能性",
            other: "{n}日は不完全の可能性",
        },
        partial: "途中",
        nothingLogged: "記録なし",
        targetsChanged: "期間中に目標を変更",
        targetsAssumed: "{date}より前の目標は未記録",
        noTargets: "目標が未設定のため、平均のみ表示しています。",
        quarter: "{year}年 第{q}四半期",
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
        loading: "体重の推移を読み込み中…",
        empty: "この期間の体重の記録はまだありません。",
        eyebrowToday: "体重 · 今日",
        eyebrowLast: "体重 · 最終計測 {date}",
        titleFirst: "初めての体重を記録しました",
        titleFew: "まだ記録が少なめです",
        titleNoRate: "週ペースを出すには最近の記録が足りません",
        titleSteady: "横ばい",
        titleDown: "減少傾向",
        titleUp: "増加傾向",
        titleGoalReached: "目標達成",
        titleAway: "目標から離れています",
        titleOnTrack: "目標に向けて順調です",
        titleShortSteady: "横ばい、目標は未達成",
        rangeGroupAriaLabel: "期間",
        ranges: {
            "7": {
                label: "7日",
                aria: "過去7日間を表示",
                word: "過去7日間",
                inRange: "7日間",
                heading: "過去7日間",
                chip: "7日",
            },
            "30": {
                label: "30日",
                aria: "過去30日間を表示",
                word: "過去30日間",
                inRange: "30日間",
                heading: "過去30日間",
                chip: "30日",
            },
            "90": {
                label: "90日",
                aria: "過去90日間を表示",
                word: "過去90日間",
                inRange: "90日間",
                heading: "過去90日間",
                chip: "90日",
            },
            "1y": {
                label: "1年",
                aria: "過去1年を表示",
                word: "過去1年",
                inRange: "1年間",
                heading: "過去1年",
                chip: "1年",
            },
            all: {
                label: "全期間",
                aria: "全期間を表示",
                word: "全期間",
                inRange: "全期間",
                heading: "全期間",
                chip: "全期間",
            },
        },
        chip: "{change} · {range}",
        perWeek: "週あたり{amount}",
        perWeekAvg: "平均で週あたり{amount}",
        toGoal: "目標まで{value}",
        weeksApprox: {
            one: "約{n}週",
            other: "約{n}週",
        },
        yearsPlus: "2年以上",
        reachedOn: "{date}に達成",
        movingAway: "目標から離れています",
        tooFlat: "変化が小さく達成日を予測できません",
        hintFew: "傾向線には期間内に4件以上の記録が必要です",
        hintNoRate: "週ペースには直近3週間に4件の記録が必要です",
        statPerWeek: "週あたり",
        statGoalPace: "このペースで目標まで",
        statGoalReached: "目標達成",
        statToGoal: "目標まで",
        statSince: "{date}から",
        unitWeeks: {
            one: "週",
            other: "週",
        },
        unitYears: "年",
        goalPill: "目標 {goal} · あと{left}",
        goalPillReached: "目標 {goal} ✓",
        goalBelow: "目標 {goal}  ↓ {left}下",
        goalAbove: "目標 {goal}  ↑ {left}上",
        today: "今日",
        yesterday: "昨日",
        whenTime: "{date} {time}",
        scrubAvg: "{value}（{n}件の平均）",
        hitLabel: "{date}、{value}",
        hitLabelAvg: "{date}、{value}、{n}件の平均",
        chartAriaLabel:
            "体重グラフ、最新 {latest}{goal}{change}。日付をタップすると値が表示されます。",
        chartAriaGoal: "、目標 {goal}",
        chartAriaChange: "、{range}で{change}",
        close: "閉じる",
        oneTitleFirst: "ここから推移が始まります",
        oneTitle: "{range}の記録は1件のみ",
        oneFirst: "初回の記録 · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "2回目の記録からグラフが表示されます",
        oneHintEarlier: {
            one: "より長い期間に以前の記録日が{n}日あります",
            other: "より長い期間に以前の記録日が{n}日あります",
        },
        emptyRange: "{range}の記録はありません。",
        emptyRangeLast: "{range}の記録はありません。最後の記録は{date}です。",
        showMore: "もっと見る",
        showLess: "表示を減らす",
        detailsAria: "{action}：体重記録と身体サイズ",
        detailsAriaWeighIns: "{action}：体重記録",
        collapseAll: "すべて折りたたむ",
        sectionWeighIns: "体重記録",
        sectionMeasurements: "身体サイズ · {range}",
        accLabel: {
            one: "{range}の記録 {n}件",
            other: "{range}の記録 {n}件",
        },
        accEmpty: "{range}の記録なし",
        accAvgRange: "平均 {avg} · 範囲 {min}–{max}",
        loggedToday: "今日記録",
        loggedYesterday: "昨日記録",
        loggedOn: "{date}に記録",
        weekThis: "今週",
        weekLast: "先週",
        weekAvg: "平均 {value}",
        weekVsLast: "先週比 {change}",
        weekVsBefore: "前週比 {change}",
        dayMulti: {
            one: "{n}件 · 平均",
            other: "{n}件 · 平均",
        },
        showEarlierWeeks: {
            one: "以前の{n}週を表示",
            other: "以前の{n}週を表示",
        },
        sites: {
            waist: "ウエスト",
            hips: "ヒップ",
            neck: "首",
            chest: "胸囲",
            shoulders: "肩幅",
            upper_arm: "上腕",
            forearm: "前腕",
            thigh: "太もも",
            calf: "ふくらはぎ",
        },
        measSince: "{date}から{change}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ 変化なし",
        measFirst: "初回の計測 · {date}",
        measFirstRow: "初回",
        measStale: "この期間は未計測 · 最終 {date}",
        measEarlier: "以前の計測",
        measHeading: "{site} · {range}",
        showMoreN: {
            one: "さらに{n}件表示",
            other: "さらに{n}件表示",
        },
        noMeasurements:
            "過去1年の身体サイズの記録はありません。ウエスト、ヒップなど9か所をセンチまたはインチで記録できます。",
    },
    importMeals: {
        loading: "インポートを準備中…",
        stepFile: "ファイル",
        stepMap: "列の対応付け",
        stepPreview: "プレビュー",
        stepImport: "インポート",
        fieldLabels: {
            logged_at: "日付・時刻",
            description: "食品名",
            meal_type: "食事の種類",
            calories: "カロリー",
            protein_g: "タンパク質（g）",
            carbs_g: "炭水化物（g）",
            fat_g: "脂質（g）",
            fiber_g: "食物繊維（g）",
            sugar_g: "糖類（総量）（g）",
            added_sugar_g: "添加糖（g）",
            saturated_fat_g: "飽和脂肪酸（g）",
            trans_fat_g: "トランス脂肪酸（g）",
            alcohol_g: "アルコール（g）",
            caffeine_mg: "カフェイン（mg）",
            sodium_mg: "ナトリウム（mg）",
            notes: "メモ",
            time: "時刻（別列）",
            deleted: "削除フラグ",
            source_id: "食事ID（本サービスのエクスポート）",
            timezone: "タイムゾーン（本サービスのエクスポート）",
        },
        chooseExportHeading: "エクスポートファイルを選択",
        noToolsWarning:
            "このホストでは、この画面から記録に書き込めません。代わりにClaudeにファイルのインポートを頼んでください。Claudeなら直接インポートできます。",
        emailFallback:
            "Claudeに頼んでもうまくいかない場合は、{email}までメールでご連絡ください。",
        tzWarning:
            "タイムゾーンが未設定のため、時刻はUTCとして読み取られ、別の日に記録されることがあります。先にClaudeにタイムゾーンの設定を頼んでください。",
        dropChoose: "CSVファイルを選択",
        dropOr: "またはここにドラッグ",
        recognizedHint:
            "MyFitnessPal、Cronometer、Lose It!、MacroFactorのエクスポートは自動で認識されます。確定するまで何も保存されません。",
        dateMapHint:
            "上で日付の列を選ぶと、ファイルの値がどう変換されるかを確認できます。",
        dateNoneHint: "この列には日付がありません。",
        dateUnreadable:
            "{raw} → {format}として読み取れないため、このような行はスキップされます",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "上でカロリーの列を選ぶと、ファイルの値がどう変換されるかを確認できます。",
        energyNoneHint: "この列には数値がありません。",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal（変換なし）",
        dateAmbiguousWarning:
            "このファイルの日付は「日が先」とも「月が先」とも読めるため、形式を判別できませんでした。お使いのアプリがどちらの形式で書き出すかを確認してください。選択を誤ると、エラーが出ないまま食事が別の日に記録されます。",
        dateFormatLabel: "このファイルの日付形式",
        dateFormatYmd: "年-月-日",
        dateFormatDmy: "日/月/年",
        dateFormatMdy: "月/日/年",
        energyUnitLabel: "カロリー列のエネルギー単位",
        energyUnitKcal: "キロカロリー",
        energyUnitKj: "キロジュール",
        mapColumnsHeading: "列の対応付け",
        rowsCount: { one: "{n}行", other: "{n}行" },
        columnsCount: { one: "{n}列", other: "{n}列" },
        delimiterLabel: "区切り文字",
        tabLabel: "タブ",
        notInFile: "（このファイルにはありません）",
        columnFallback: "{n}列目",
        caffeineGramsNotice:
            "このファイルのカフェイン列（{column}）はグラム単位ですが、カフェインはミリグラム単位で保存されるため、対応付けていません。そのまま対応付けると、栄養成分表示で180 mgのものが0.18として記録されます。後で同じファイルを再インポートしても補完されません。それらの行は記録済みのため、重複としてスキップされます。列名が誤っていて実際の値がミリグラムなら、上でこの列を選択してください。本当にグラムなら、インポートの前に（後ではなく）ファイル内で値を1000倍してください。",
        alcoholNotice:
            "このファイルにはアルコール列（{column}）がありますが、このアカウントではアルコール記録がオフのため、インポートされません。後で同じファイルを再インポートしても補完されません。それらの行は記録済みのため、重複としてスキップされます。このデータを残すには、インポートの前にClaudeにアルコール記録をオンにするよう頼んでください（set_alcohol_tracking）。",
        sampleValue: "例：{sample}",
        sourceAppLabel: "元のアプリ（任意）",
        sourceAppHint: "食品名のない行のラベルに使われます。",
        previewButton: "インポート内容をプレビュー",
        chooseAnotherButton: "別のファイルを選択",
        previewHeading: "プレビュー",
        datesReadAs:
            "日付は{format}として読み取り、エネルギーは{conversion}しました。",
        energyConvertedNote: "kJからkcalに変換",
        energyReadAsKcal: "kcalとして処理",
        badDatesWarning: {
            one: "{n}行は、日付を{format}として読み取れなかったため、スキップされました{sample}。前の画面に戻り、ファイルに合う日付形式を選んでください。",
            other: "{n}行は、日付を{format}として読み取れなかったため、スキップされました{sample}。前の画面に戻り、ファイルに合う日付形式を選んでください。",
        },
        badDateSample: "（例：{line}行目の「{value}」）",
        noTimeWarning: {
            one: "{n}行は日付のみで時刻がないため、正午に記録されます。",
            other: "{n}行は日付のみで時刻がないため、正午に記録されます。",
        },
        splitDatesCount: {
            one: "{n}日分の日付で",
            other: "{n}日分の日付で",
        },
        splitDatesWarning:
            "、1日の食事が{max}件を超えたため（例：{date}）、複数のインポートバッチに分けました。その日に食品名・食事の種類・栄養素がまったく同じ記録が2件あると、一方が重複としてスキップされ、インポートされないことがあります。",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "C",
            fat_g: "F",
            fiber_g: "繊維",
            sugar_g: "糖類",
            added_sugar_g: "添加糖",
            saturated_fat_g: "飽和",
            trans_fat_g: "トランス",
            alcohol_g: "アルコール",
            caffeine_mg: "カフェイン",
            sodium_mg: "Na",
        },
        tableLine: "行",
        tableWhen: "日時",
        tableMeal: "食事",
        tableFood: "食品",
        tableProblem: "問題",
        noNameFallback: "（名前なし：食事の種類名で表示されます）",
        showingRows: "{total}行中{shown}行を表示",
        checkingRows: {
            one: "{n}行を確認中…",
            other: "{n}行を確認中…",
        },
        importingRows: {
            one: "{n}行をインポート中…",
            other: "{n}行をインポート中…",
        },
        batchProgress: "{label}（バッチ {done}/{total}）",
        rowsRange: "{a}〜{b}行目：{msg}",
        preflightFailed: "事前チェックに失敗しました。",
        rowsWouldFail: {
            one: "{n}行がエラーになる見込みです（例：{line}行目：{message}）",
            other: "{n}行がエラーになる見込みです（例：{line}行目：{message}）",
        },
        importingEllipsis: "インポート中…",
        importButton: {
            one: "{n}件の食事をインポート",
            other: "{n}件の食事をインポート",
        },
        backToMapping: "列の対応付けに戻る",
        importCompleteHeading: "インポート完了",
        resultMealsImported: {
            one: "{n}件の食事をインポート",
            other: "{n}件の食事をインポート",
        },
        resultAlreadyLogged: {
            one: "、{n}件は記録済み",
            other: "、{n}件は記録済み",
        },
        resultFailed: {
            one: "、{n}件が失敗",
            other: "、{n}件が失敗",
        },
        resultSkipped: {
            one: "、{n}件をスキップ",
            other: "、{n}件をスキップ",
        },
        restartButton: "別のファイルをインポート",
        couldNotReadFile: "ファイルを読み込めませんでした：{msg}",
        noDataRows: "このファイルにはデータ行がありません。",
        emailNotice:
            "うまく動きませんか？　下の内容を添えて{email}までメールでご連絡ください。原因の調査に必要な情報はすべてそろっています。",
        eyebrow: "食事のインポート",
        eyebrowWithFile: "食事のインポート · {file}",
        stepsLabel: "インポートの手順",
        stepAriaDone: "手順 {i}/4：{name}（完了）",
        stepAriaCurrent: "手順 {i}/4：{name}（現在）",
        stepAriaUpcoming: "手順 {i}/4：{name}",
        browseFiles: "ファイルを選ぶ",
        dropAccept: ".csv またはタブ区切りテキスト",
        dropAria: "CSVファイルを選択するか、ここにドラッグ",
        privacyNote:
            "ファイルはこのパネルの中で読み込まれます。行の内容がチャットを通ることはなく、アシスタントにはインポート完了時に1行の要約だけが伝わります。",
        binaryFile:
            "ファイルを読み込めませんでした。CSVテキストではなくバイナリファイル（Excelブック？）のようです。CSVとして書き出してから、もう一度お試しください。",
        columnsHeading: "列",
        fieldsMatched: {
            one: "{total}項目中{n}項目を対応付け",
            other: "{total}項目中{n}項目を対応付け",
        },
        tableFieldHead: "項目",
        tableColumnHead: "ファイルの列",
        tableRow1Head: "1行目の値",
        badgeNew: "新規",
        colNumber: "{n}列目",
        colNumberAuto: "{n}列目 · 自動",
        colNumberManual: "{n}列目 · 手動で選択",
        row1Empty: "1行目は空",
        alsoUsed: "{field}にも使用",
        sameColumn: "{fields}と同じ列",
        columnForAria: "{field}の列",
        mapRowAria: "{field}{required}：{column}{sample}",
        requiredAria: "、必須",
        columnAria: "{n}列目、{name}",
        notInFileAria: "このファイルにはありません",
        sampleAria: "、{sample}",
        howRead: "値の読み取り方",
        appExport: "{app}のエクスポート",
        tileMeals: {
            one: "件の食事をインポート",
            other: "件の食事をインポート",
        },
        tileKcal: "kcal（合計）",
        tileSkipped: { one: "行をスキップ", other: "行をスキップ" },
        tileBatches: { one: "バッチ", other: "バッチ" },
        rowsHeading: "行",
        scrollLeft: "表を左にスクロール",
        scrollRight: "表を右にスクロール",
        previewRegionAria: "インポートする行のプレビュー",
        expandAllDays: "すべての日を開く",
        collapseAllDays: "すべての日を閉じる",
        dayRows: { one: "{n}行", other: "{n}行" },
        dayRowsKcal: {
            one: "{n}行 · {kcal} kcal",
            other: "{n}行 · {kcal} kcal",
        },
        noTimeShort: "時刻なし",
        lineN: "{n}行目",
        rowCardAria: "{line}行目、{when}、{meal}、{food}、{kcal}",
        noMealAria: "食事区分なし",
        noKcalAria: "カロリーなし",
        noRowsToImport: "現在の対応付けではインポートする行がありません。",
        importOff:
            "インポートはオフです。このホストでは、この画面から記録に書き込めません。代わりにClaudeにファイルのインポートを頼んでください。",
        backBusy: "バッチの送信中は戻れません。",
        progressAria: "インポートの進捗（バッチ）",
        failedRowsAria: "失敗した行",
        toldOnly: "アシスタントに伝えたのはこれだけです：{summary}",
        liveStep: "手順 {i}/4、{name}。",
        liveMapped: "{field}：{column}",
        liveImporting: {
            one: "インポート中。{n}バッチ。",
            other: "インポート中。{n}バッチ。",
        },
        liveDone: {
            one: "インポート完了。{n}件の食事をインポートしました。",
            other: "インポート完了。{n}件の食事をインポートしました。",
        },
        liveNoWrite: "事前チェックに失敗しました。何も保存されていません。",
        liveFileError: "このファイルは使用できません。",
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

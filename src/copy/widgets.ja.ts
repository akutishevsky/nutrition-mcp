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
        chartAriaLabel: "選択した期間の1日あたりのカロリー",
        avg: "平均",
        goal: "目標",
        dailyAvgLoggedDays: "1日平均（記録した日）",
        total: "合計",
        daysLogged: {
            one: "{n}日分を記録",
            other: "{n}日分を記録",
        },
        daysOfLogged: "{span}日中{logged}日を記録",
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
        title: "目標の進捗",
        empty: "表示できる目標の進捗はありません。",
        nothingLoggedFor: "{date}の記録はまだありません。",
        thisDay: "この日",
        mealsCount: { one: "食事{n}件", other: "食事{n}件" },
        waterCount: { one: "水分{n}件", other: "水分{n}件" },
        weightLabel: "体重",
        weightNoneNoTarget:
            "体重の記録はまだありません。log_weightで記録すると、進捗を確認できます。",
        weightNoneWithTarget:
            "体重の記録はまだありません。log_weightで記録すると、目標の{target}までの進捗を確認できます。",
        weightNoGoal:
            "体重 {reading}（目標未設定）。set_nutrition_goalsで目標を設定すると、ここに進捗が表示されます。",
        atTarget: "目標達成",
        toLose: "あと{amount}減量",
        toGain: "あと{amount}増量",
        lastLogged: "最終記録：{date}",
        weightAria: "体重 {current}、目標 {target}、{state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "食事を記録しました",
        titleUpdated: "食事を更新しました",
        addedKcal: "+{kcal} kcal",
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
        title: "体重",
        empty: "この期間の体重の記録はまだありません。",
        rangeEmpty:
            "過去{range}日間の体重記録はありません。期間を広げてみてください。",
        windowAriaLabel: "期間の切り替え",
        rangeAriaLabel: "過去{n}日間",
        chartAriaLabel: "{from}〜{to}の体重の推移、最新 {latest}",
        trendChartAriaLabel:
            "{from}〜{to}の体重の推移と平滑化したトレンド線、最新 {latest}",
        latest: "最新",
        needTwo: "体重記録が2件以上必要です",
        sinceDate: "{date}から{change}",
        weighIns: { one: "体重記録{n}件", other: "体重記録{n}件" },
        atTarget: "目標達成",
        toLose: "あと{amount}減量",
        toGain: "あと{amount}増量",
        target: "目標 {value}",
        noTarget: "目標未設定",
        trend: "トレンド",
        scaleToday: "今日の計測値 {value}",
        perWeek: "{amount}/週",
        rateAriaLabel: "直近2週間のトレンドは週あたり{amount}の変化",
        rateTwoWeeks: "2週間ペース",
        range1y: "1年",
        rangeAll: "全期間",
        range1yAriaLabel: "過去1年",
        rangeAllAriaLabel: "全期間の記録",
        sinceMonth: "{date}から{change}",
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
        mealsToImport: {
            one: "インポートする食事：{n}件",
            other: "インポートする食事：{n}件",
        },
        kcalTotal: "合計 {kcal} kcal",
        rowsSkipped: {
            one: "{n}行をスキップ",
            other: "{n}行をスキップ",
        },
        batchCount: { one: "{n}バッチ", other: "{n}バッチ" },
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
    },
};

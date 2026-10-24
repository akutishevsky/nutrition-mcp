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
        title: "トレンド",
        empty: "この期間の食事や水分の記録はまだありません。",
        avgUnder: "不足",
        loggedOfTotal: "{logged}/{total}日を記録",
        caloriesOverRange: "過去{range}日間の1日あたりのカロリー",
        windowAriaLabel: "期間の切り替え",
        rangeDaysAriaLabel: "{n}日間",
        avgAllDays: "{range}日間の平均（全日）",
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

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
        empty: "この期間の体重の記録はまだありません。",
        eyebrowToday: "Weight · today", // i18n:pending
        eyebrowLast: "Weight · last weigh-in {date}", // i18n:pending
        titleFirst: "First weigh-in logged", // i18n:pending
        titleFew: "A few weigh-ins so far", // i18n:pending
        titleNoRate: "Not enough recent weigh-ins for a weekly rate", // i18n:pending
        titleSteady: "Holding steady", // i18n:pending
        titleDown: "Trending down", // i18n:pending
        titleUp: "Trending up", // i18n:pending
        titleGoalReached: "Goal reached", // i18n:pending
        titleAway: "Drifting away from your goal", // i18n:pending
        titleOnTrack: "On track for your goal", // i18n:pending
        titleShortSteady: "Holding steady, short of your goal", // i18n:pending
        rangeGroupAriaLabel: "Range", // i18n:pending
        ranges: {
            // i18n:pending
            "7": {
                // i18n:pending
                label: "7d", // i18n:pending
                aria: "Show last 7 days", // i18n:pending
                word: "the last 7 days", // i18n:pending
                inRange: "in 7 days", // i18n:pending
                heading: "last 7 days", // i18n:pending
                chip: "7 d", // i18n:pending
            }, // i18n:pending
            "30": {
                // i18n:pending
                label: "30d", // i18n:pending
                aria: "Show last 30 days", // i18n:pending
                word: "the last 30 days", // i18n:pending
                inRange: "in 30 days", // i18n:pending
                heading: "last 30 days", // i18n:pending
                chip: "30 d", // i18n:pending
            }, // i18n:pending
            "90": {
                // i18n:pending
                label: "90d", // i18n:pending
                aria: "Show last 90 days", // i18n:pending
                word: "the last 90 days", // i18n:pending
                inRange: "in 90 days", // i18n:pending
                heading: "last 90 days", // i18n:pending
                chip: "90 d", // i18n:pending
            }, // i18n:pending
            "1y": {
                // i18n:pending
                label: "1y", // i18n:pending
                aria: "Show last year", // i18n:pending
                word: "the last year", // i18n:pending
                inRange: "in a year", // i18n:pending
                heading: "last year", // i18n:pending
                chip: "1 y", // i18n:pending
            }, // i18n:pending
            all: {
                // i18n:pending
                label: "All", // i18n:pending
                aria: "Show all time", // i18n:pending
                word: "all time", // i18n:pending
                inRange: "overall", // i18n:pending
                heading: "all time", // i18n:pending
                chip: "All", // i18n:pending
            }, // i18n:pending
        }, // i18n:pending
        chip: "{change} · {range}", // i18n:pending
        perWeek: "{amount} per week", // i18n:pending
        perWeekAvg: "{amount} per week on average", // i18n:pending
        toGoal: "{value} to goal", // i18n:pending
        weeksApprox: { one: "~{n} week", other: "~{n} weeks" }, // i18n:pending
        yearsPlus: "2+ years", // i18n:pending
        reachedOn: "reached on {date}", // i18n:pending
        movingAway: "moving away from goal", // i18n:pending
        tooFlat: "too flat to project a goal date", // i18n:pending
        hintFew: "A trend line needs at least 4 weigh-ins in the range", // i18n:pending
        hintNoRate: "The weekly rate needs 4 weigh-ins in the last 3 weeks", // i18n:pending
        statPerWeek: "Per week", // i18n:pending
        statGoalPace: "Goal at this pace", // i18n:pending
        statGoalReached: "Goal reached", // i18n:pending
        statToGoal: "To goal", // i18n:pending
        statSince: "Since {date}", // i18n:pending
        unitWeeks: { one: "week", other: "weeks" }, // i18n:pending
        unitYears: "years", // i18n:pending
        goalPill: "Goal {goal} · {left} to go", // i18n:pending
        goalPillReached: "Goal {goal} ✓", // i18n:pending
        goalBelow: "Goal {goal}  ↓ {left} below", // i18n:pending
        goalAbove: "Goal {goal}  ↑ {left} above", // i18n:pending
        today: "Today", // i18n:pending
        yesterday: "Yesterday", // i18n:pending
        whenTime: "{date}, {time}", // i18n:pending
        scrubAvg: "{value} (avg of {n})", // i18n:pending
        hitLabel: "{date}, {value}", // i18n:pending
        hitLabelAvg: "{date}, {value}, average of {n}", // i18n:pending
        chartAriaLabel:
            "Weight chart, latest {latest}{goal}{change}. Tap a day to read its value.", // i18n:pending
        chartAriaGoal: ", goal {goal}", // i18n:pending
        chartAriaChange: ", {change} {range}", // i18n:pending
        close: "Close", // i18n:pending
        oneTitleFirst: "Your trend starts here", // i18n:pending
        oneTitle: "Only one weigh-in in {range}", // i18n:pending
        oneFirst: "First weigh-in · {when} · {value}", // i18n:pending
        oneLine: "{when} · {value}", // i18n:pending
        oneHintFirst: "The chart starts with a second weigh-in", // i18n:pending
        oneHintEarlier: {
            one: "{n} earlier weigh-in day in longer ranges",
            other: "{n} earlier weigh-in days in longer ranges",
        }, // i18n:pending
        emptyRange: "No weigh-ins in {range}.", // i18n:pending
        emptyRangeLast: "No weigh-ins in {range}. The last one was on {date}.", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        detailsAria: "{action}: weigh-ins and measurements", // i18n:pending
        detailsAriaWeighIns: "{action}: weigh-ins", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        sectionWeighIns: "Weigh-ins", // i18n:pending
        sectionMeasurements: "Body measurements · {range}", // i18n:pending
        accLabel: {
            one: "{n} weigh-in {range}",
            other: "{n} weigh-ins {range}",
        }, // i18n:pending
        accEmpty: "No weigh-ins {range}", // i18n:pending
        accAvgRange: "avg {avg} · range {min}–{max}", // i18n:pending
        loggedToday: "logged today", // i18n:pending
        loggedYesterday: "logged yesterday", // i18n:pending
        loggedOn: "logged on {date}", // i18n:pending
        weekThis: "This week", // i18n:pending
        weekLast: "Last week", // i18n:pending
        weekAvg: "avg {value}", // i18n:pending
        weekVsLast: "{change} vs last week", // i18n:pending
        weekVsBefore: "{change} vs week before", // i18n:pending
        dayMulti: {
            one: "{n} weigh-in · averaged",
            other: "{n} weigh-ins · averaged",
        }, // i18n:pending
        showEarlierWeeks: {
            one: "Show {n} earlier week",
            other: "Show {n} earlier weeks",
        }, // i18n:pending
        sites: {
            // i18n:pending
            waist: "Waist", // i18n:pending
            hips: "Hips", // i18n:pending
            neck: "Neck", // i18n:pending
            chest: "Chest", // i18n:pending
            shoulders: "Shoulders", // i18n:pending
            upper_arm: "Upper arm", // i18n:pending
            forearm: "Forearm", // i18n:pending
            thigh: "Thigh", // i18n:pending
            calf: "Calf", // i18n:pending
        }, // i18n:pending
        measSince: "{change} since {date}", // i18n:pending
        changeDown: "↓ {delta}", // i18n:pending
        changeUp: "↑ {delta}", // i18n:pending
        changeFlat: "→ no change", // i18n:pending
        measFirst: "first measurement · {date}", // i18n:pending
        measFirstRow: "first", // i18n:pending
        measStale: "not measured in this range · last on {date}", // i18n:pending
        measEarlier: "Earlier measurements", // i18n:pending
        measHeading: "{site} · {range}", // i18n:pending
        showMoreN: { one: "Show {n} more", other: "Show {n} more" }, // i18n:pending
        noMeasurements:
            "No body measurements in the last year. Waist, hips and seven other sites can be tracked in centimetres or inches.", // i18n:pending
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

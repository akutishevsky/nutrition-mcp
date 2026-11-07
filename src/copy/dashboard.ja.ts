import type { DashboardDoc } from "./dashboard.js";

export const DASHBOARD_JA: DashboardDoc = {
    meta: {
        title: "Nutrition MCP — ダッシュボード",
        description:
            "Nutrition MCP に記録した食事、目標、トレンド、体のサイズを1ページで確認できます。",
    },
    noScript:
        "ダッシュボードでデータを読み込むには JavaScript が必要です。JavaScript を有効にして、ページを再読み込みしてください。",
    tabs: {
        today: "今日",
        history: "履歴",
        trends: "トレンド",
        body: "体",
    },
    navAriaLabel: "ダッシュボード",
    pagesAriaLabel: "ダッシュボードのページ",
    signOut: "サインアウト",
    signOutFailed:
        "現在サインアウトできませんでした。このブラウザはまだサインインしたままです。しばらくしてからもう一度お試しください。",

    sync: {
        updated: "{time} に更新",
        updating: "更新中…",
        offline: "オフライン · 最終更新 {time}",
        offlineNever: "オフライン",
        empty: "まだ記録がありません",
    },
    error: {
        lead: "更新できませんでした。",
        leadFirst: "データを読み込めませんでした。",
        stale: "{time} 時点で保存された内容を表示しています。それ以降の記録は、再接続すると表示されます。",
        first: "接続を確認して、もう一度お試しください。",
        retry: "再試行",
    },
    loading: "今日のデータを読み込み中",

    today: {
        dateAriaLabel: "日付",
        titleToday: "今日",
        titleYesterday: "昨日",
        prevDay: "前の日",
        nextDay: "次の日",
        pickDate: "日付を選択",
        calendar: "カレンダー",
    },
    empty: {
        title: "まだ何も記録されていません",
        body: "食べたものや飲んだものを AI アシスタントに伝えてください。記録は1分以内にここに表示され、合計、目標、トレンドも確認できます。",
        trySaying: "たとえば",
        examples: [
            "「朝食に卵2個とトーストを食べた」",
            "「カロリー目標を2,200、タンパク質を150 gにして」",
            "「水を500 ml記録して」",
        ],
        stepsTitle: "まだ接続していませんか？",
        steps: [
            "Claude、ChatGPT などの MCP クライアントに Nutrition MCP を追加します。",
            "求められたら、このアカウントでサインインします。",
            "チャットで最初の食事を記録します。このページは自動で更新されます。",
        ],
        connectCta: "接続方法",
    },
    history: {
        rangeAriaLabel: "期間",
        title: "履歴",
        loggedPill: {
            other: "{total}日中{logged}日を記録",
        },
        searchPlaceholder: "食事や材料を検索",
        searchLabel: "食事と材料を検索",
        clearSearch: "検索をクリア",
        earlier: "前の5週間",
        later: "次の5週間",
        resultsTitle: {
            other: "「{q}」に一致する食事：{n}件",
        },
        resultsSub: "名前と材料、新しい順",
        ingredient: "材料：{item}",
        kcal: "kcal",
        noResults:
            "一致する食事や材料はありません。「ご飯」のように短い言葉で試してください。",
        tooShort: "2文字以上入力して検索してください。",
        searching: "検索中…",
        searchFailed:
            "現在、検索を利用できません。少し待ってからもう一度お試しください。",
        savedHit: "保存した食事にもあります：{name}、1人前 {kcal} kcal",
        calendarTitle: "カレンダー",
        legendOn: "目標どおり ±5%",
        legendUnder: "目標未満",
        legendOver: "目標超過",
        calendarAriaLabel: "1日のカロリー、{from}〜{to}",
        cellToday: "今日",
        cellTodaySuffix: "（今日）",
        cellNothing: "、記録なし",
        cellKcal: "、{kcal} kcal",
        summary:
            "記録が揃った{n}日間の平均 {avg} kcal · 目標どおり {on}日 · 超過 {over}日 · 未満 {under}日 · 未記録 {missing}日",
        summaryNone: "この5週間に、記録が揃った日はありません。",
        dayEmpty: "{date}の記録はありません。",
        dayFailed:
            "{date}を読み込めませんでした。しばらくしてからもう一度お試しください。",
        savedTitle: "保存した食事",
        savedSub:
            "チャットで名前を伝えれば記録できます —「{name}を記録して」。",
        savedSubNone:
            "チャットで保存した食事がここに表示され、名前を伝えるだけで記録できます。",
        perServing: " kcal / 1人前",
        protein: "P {g} g",
        carbs: "C {g} g",
        fat: "F {g} g",
        items: { other: "材料{n}点" },
        savedNone: "保存した食事はまだありません。",
    },
    trends: {
        eyebrow: "カロリー・PFC・栄養素の推移",
        title: "トレンド",
    },
    body: {
        eyebrow: "体重とサイズ",
        title: "体",
        measTitle: "サイズ",
        measSub: "記録した周囲径 · 最終計測 {date}",
        notMeasured: "未計測：",
        hintCm: "追加するには、アシスタントに「ウエスト 83.5 cm」のように伝えてください。変化は最初の記録（{date}）から計算されます。単位はチャットでインチに切り替えられます。",
        hintIn: "追加するには、アシスタントに「ウエスト 33 in」のように伝えてください。変化は最初の記録（{date}）から計算されます。単位はチャットでセンチメートルに切り替えられます。",
        sinceFirst: "最初から {delta}",
        firstEntry: "最初の記録",
        noMeasurements:
            "体のサイズの記録はまだありません。ウエスト、ヒップなど9か所を、センチメートルまたはインチで記録できます。",
        kinds: {
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
        kindsInline: {
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
    },
    widgets: {
        summary: "栄養サマリー",
        digest: "栄養ダイジェスト",
        goals: "目標の進捗",
        weight: "体重の推移",
        trends: "トレンド",
    },
};

// Japanese (ja) translation of the /tools reference page content — see
// src/copy/tools.ts for the authoritative shape (`ToolsDoc`) and the full
// doc comments on what is/isn't translatable (tool names, param names,
// category slugs are structural and stay in TOOLS/BADGE_META; only prose
// lives here).
//
// Terminology kept consistent with other locale files' English anchors:
// protein → タンパク質, carbs → 炭水化物, fat → 脂質, fiber → 食物繊維,
// (total) sugar → 糖類（総糖類）, alcohol → アルコール（純アルコールのグラム数）,
// caffeine → カフェイン, meal → 食事, water → 水分, weigh-in → 体重記録,
// goals → 目標, timezone → タイムゾーン, export → エクスポート, widget → ウィジェット.
// Standard polite register (です/ます) throughout, matching the friendly but
// professional tone of a modern consumer SaaS product; button/link-style
// short labels use plain/dictionary form where that's the natural Japanese
// UI convention. Proper nouns (Nutrition MCP, Claude, ChatGPT, MyFitnessPal,
// Cronometer, Lose It!, MacroFactor, MCP) are kept in Latin script, never
// transliterated into katakana. Numerals stay half-width (1, 2, 3).

import type { ToolsDoc } from "./tools.js";

export const TOOLS_JA: ToolsDoc = {
    meta: {
        title: "ツールリファレンス：36個の全ツール",
        description:
            "Nutrition MCPサーバーがあなたのAIに提供する36個すべてのツール — 食事の記録、バーコードのスキャン、他のアプリからの履歴インポート、水分と体重の記録、目標の設定、トレンドの確認。説明と例文つきの完全なリファレンスです。",
        ogDescription:
            "Nutrition MCPサーバーがあなたのAIに提供する36個のツール。他のアプリからの履歴用CSVインポーターを含み、説明と例文つき。",
    },
    hero: {
        eyebrow: "リファレンス",
        title: "あなたのAIができること、すべて",
        lead: "これらのツールを直接呼び出すことはありません — ただ話しかけるだけで、アシスタントが適切なツールを選びます。Nutrition MCPサーバーが公開する全ツールと、それぞれの機能、呼び出すきっかけとなるフレーズをまとめました。",
        countBold: "36個のツール",
        countTail: "7つの分野にわたる",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "記録",
            title: "食事の記録",
            description:
                "基本の流れ — どんな表現で伝えても、食べたものを記録します。",
        },
        "reviewing-your-meals": {
            pillLabel: "履歴確認",
            title: "食事履歴の確認",
            description:
                "記録した内容を、1日単位でも期間単位でも振り返れます。",
        },
        water: {
            pillLabel: "水分",
            title: "水分",
            description: "食事と合わせて水分摂取量を記録します。",
        },
        weight: {
            pillLabel: "体重",
            title: "体重",
            description: "体重を記録・確認し、目標に向かう推移を見守ります。",
        },
        "goals-progress": {
            pillLabel: "目標",
            title: "目標と進捗",
            description: "目標を設定し、毎日の達成度を確認します。",
        },
        "insights-trends": {
            pillLabel: "インサイト",
            title: "インサイトとトレンド",
            description:
                "AIが計算をせずにパターンを把握できるよう、あらかじめ集計された分析です。",
        },
        "settings-account": {
            pillLabel: "設定",
            title: "設定とアカウント",
            description:
                "すべてを正確に保つための各種設定と、データの完全な管理。",
        },
    },
    badges: {
        log: "記録",
        widget: "インタラクティブUI",
        lookup: "検索",
        import: "インポート",
        edit: "編集",
        remove: "削除",
        view: "表示",
        export: "エクスポート",
        setting: "設定",
    },
    ui: {
        parametersLabel: "パラメーター",
        requiredLabel: "必須",
        optionalLabel: "任意",
        trySayingLabel: "こう話しかけてみましょう",
    },
    tools: {
        log_meal: {
            description:
                "食べたものをカロリーとマクロ栄養素とともに記録します — さらに数値がわかる場合は食物繊維、総糖類、アルコール、カフェインも記録できます。普段の言葉で説明するだけで、AIが数値を推定し、分量がはっきりしない場合は尋ね、必要に応じてバーコードやWeb検索から先にラベル情報を取得することもできます。",
            params: {
                description: "何を食べたか",
                meal_type: "朝食、昼食、夕食、間食のいずれか",
                calories: "総カロリー",
                protein_g: "タンパク質（グラム）",
                carbs_g: "炭水化物（グラム）",
                fat_g: "脂質（グラム）",
                fiber_g:
                    "食物繊維（グラム）。ラベルに数値がない場合はAIが材料から推定し、すべての食事でこの項目を入力するよう指示されています。空欄はゼロを意味するのではなく、その日全体を食物繊維の平均から除外してしまうためです",
                sugar_g:
                    "<b>総</b>糖類（グラム） — ラベルに「糖類」として表示される数値で、果物や牛乳に自然に含まれる糖分も含み、添加糖だけではありません。食物繊維と同じ基準で、すべての食事に入力されます",
                alcohol_g:
                    "<b>純アルコール</b>のグラム数であり、飲み物の量でもアルコール度数でもありません — AIが注いだ量と度数から算出します（330mlの5%のビールなら13g）",
                caffeine_mg:
                    "カフェインは<b>ミリグラム</b>単位で、グラムではありません — ここで唯一グラム単位ではない項目です。これはあらゆるラベルやガイドラインがそう表記しているためです（ドリップコーヒーは約95mg、エスプレッソは63mg、コーラ1缶は34mg）。カフェインはカロリーを加えません。食物繊維や糖類と違い、実際にカフェインを含むものにのみ送信されます — 0を記録すると、あなたが一切摂取していない栄養素についてのカフェインの行がダッシュボードに表示されてしまいます",
                logged_at: "今でなければ、食べた時刻 — 後からの記録に使えます",
                notes: "追加のメモ",
            },
            example: "ランチにチキンブリトーボウルを、ワカモレ多めで記録して",
            photoHint:
                "…または、お皿の写真を撮るだけでも構いません — AIが各料理を特定し、日常的な単位（グラス1杯、ひとつかみなど）で分量を見積もり、これまでの記録内容と照合したうえで、記録する前にあなたに確認します。",
        },
        lookup_barcode: {
            description:
                "バーコード（8〜14桁のEAN/UPC）から、パッケージ商品の栄養成分をOpen Food Factsで検索します。数字を入力するか、パッケージの写真から読み取らせることができます。結果はそのまま、実際に食べた量に換算して記録できます。",
            params: {},
            example: "このバーコードをスキャンして：3017620422003",
            photoHint:
                "…またはパッケージの写真を送ってください — AIがそこからバーコードの数字を読み取ります。",
        },
        start_meal_import: {
            description:
                "チャット内でインポーターを開き、他のアプリから履歴を取り込みます — MyFitnessPal、Cronometer、Lose It!、MacroFactorからエクスポートしたファイルを選び、その列をカロリー、マクロ栄養素、食物繊維、糖類、カフェイン（アルコール記録をオンにしている場合はアルコールも）に対応づけ、確定前に追加内容を確認できます。ファイルはブラウザ内で読み込まれ、プレビューを承認するまで何も保存されません。同じファイルを再度インポートしても重複は作成されません。",
            params: {},
            example: "MyFitnessPalから食事履歴をインポートして",
        },
        bulk_import_meals: {
            description:
                "過去の食事をまとめて追加します — 一度に最大50件 — 1件ずつ記録する手間を省けます。上記のインポーターも内部でこのツールを使っており、AIはチャットに貼り付けられた食事データに対して直接使うこともできます。すべての行が事前にチェックされ、合わないものは行ごとに報告されるため、同じ行を再送しても安全で、すでに記録済みの内容が重複することはありません。",
            params: {
                meals: "インポートする行を、元ファイルの順序で指定します（1回の呼び出しにつき1〜50件）。各行には時刻、食事の種類、説明、メモ、そして記録済みの食事と同じ数値 — <code>calories</code>、<code>protein_g</code>、<code>carbs_g</code>、<code>fat_g</code>、<code>fiber_g</code>、<code>sugar_g</code>（総糖類）、<code>alcohol_g</code>（純アルコールのグラム数）、<code>caffeine_mg</code>（ミリグラム、グラムではありません）— を含められます",
                expected_row_count:
                    "この呼び出しに含まれる行数を、元ファイルから数えたもの。行の欠落を検出するために使います",
                expected_total_kcal:
                    "元ファイルのカロリー合計。届いた内容と照合されます",
                dry_run: "実際には何も書き込まずに、何が起こるかを報告します",
                on_error:
                    "有効な行だけをインポートして残りを報告するか、いずれかの行が失敗した場合は何も書き込まないかを指定します",
                source_app: "ファイルの取得元アプリ",
            },
            example:
                "先週の食事を古いアプリから貼り付けました — すべて追加して",
        },
        update_meal: {
            description:
                "すでに記録した食事の内容 — 説明、各マクロ栄養素、食物繊維、糖類、アルコール、カフェイン、時刻、メモ — を変更します。抜けていた情報を後から埋める方法でもあります。食物繊維や糖類が入力されずに記録された場合、サーバーがそれを伝え、AIがここで入力します。",
            params: {
                id: "更新する食事のUUID",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "総糖類であり、添加糖ではありません",
                alcohol_g:
                    "純アルコールのグラム数であり、飲み物の量ではありません",
                caffeine_mg: "ミリグラムであり、グラムではありません",
                logged_at: "",
                notes: "",
            },
            example:
                "そういえばあのランチは500カロリーじゃなくて600カロリーだった — 修正して",
        },
        delete_meal: {
            description: "誤って記録した食事のエントリを削除します。",
            params: {
                id: "削除する食事のUUID",
            },
            example: "今日の午後に記録した間食を削除して",
        },
        search_meals: {
            description:
                "過去の食事をキーワードで検索し、繰り返し登場する記録のバリエーションごとにまとめて表示します — それぞれの記録頻度、最後に記録した日時、標準的なカロリーなどです。AIがお皿の写真をこれまでの実際の記録内容と照合したり、「いつもの朝食を記録して」を実現したりするのに使われます。",
            params: {
                queries:
                    "食品に関するキーワードの候補。これまで記録に使ったどの言語でも構いません",
                days: "どこまで遡るか（デフォルトは1年）",
                limit: "分析する最大エントリ数",
            },
            example: "いつもの朝食を記録して",
        },
        get_meals_today: {
            description: "今日記録したすべての食事を確認します。",
            params: {},
            example: "今日は何を食べた？",
        },
        get_meals_by_date: {
            description: "特定の日に記録したすべての食事を確認します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
            },
            example: "7月4日に食べたものを全部見せて",
        },
        get_meals_by_date_range: {
            description:
                "2つの日付の間のすべての食事を一度に取得します — 1週間や1か月分をまとめて振り返るのに便利です。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）",
            },
            example: "月曜から金曜までの食事を一覧にして",
        },
        export_all_data: {
            description:
                "記録したすべてのデータを1つのZIPとしてエクスポートします — meals.csv、water.csv、weight.csv、goals.csv、profile.csv、そして列と単位を説明するREADME.txt — 有効期限60分の同じプライベートリンクで提供されます。現時点で再インポートできるのは食事データのみです。",
            params: {},
            example:
                "食事、水分、体重、目標など、すべてのデータをエクスポートして",
        },
        log_water: {
            description:
                "水分摂取を記録します。カップ、オンス、リットルなど任意の単位で入力でき、ミリリットルに自動変換されます。",
            params: {
                amount_ml: "ミリリットル単位の量（整数、&gt; 0）。",
            },
            example: "500mlのボトルの水を飲んだところ",
        },
        get_water_today: {
            description: "今日の水分摂取量の合計と、各エントリを確認します。",
            params: {},
            example: "今日はどれくらい水を飲んだ？",
        },
        get_water_by_date: {
            description: "特定の日の水分摂取量の合計とエントリを確認します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
            },
            example: "昨日はどれくらい飲んだ？",
        },
        delete_water: {
            description: "誤って追加した水分エントリを削除します。",
            params: {
                id: "削除する水分エントリのUUID",
            },
            example: "最後の水分エントリを削除して",
        },
        log_weight: {
            description:
                "体重測定値をkgまたはlbで記録します。1日に複数回記録しても問題なく、サーバーが正規の形式で保存するため、単位の設定によって数値が歪むことはありません。",
            params: {
                weight: "`unit`単位での体重の値（&gt; 0）。",
            },
            example: "体重を記録して — 今朝は74.2kg",
        },
        update_weight: {
            description:
                "既存の体重記録 — 数値、タイムスタンプ、メモ — を修正します。",
            params: {
                id: "更新する体重記録のUUID",
                weight: "`unit`単位での新しい体重の値。",
                logged_at: "ISO 8601形式のタイムスタンプ",
                notes: "",
            },
            example: "今朝の体重記録を73.8kgに修正して",
        },
        delete_weight: {
            description: "体重記録を削除します。",
            params: {
                id: "削除する体重記録のUUID",
            },
            example: "今日の体重記録を削除して",
        },
        get_weight_today: {
            description: "今日の体重記録を、お好みの単位で確認します。",
            params: {},
            example: "今日の体重はどうだった？",
        },
        get_weight_by_date: {
            description: "特定の日の体重記録を確認します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
            },
            example: "1日の体重はどうだった？",
        },
        get_weight_by_date_range: {
            description:
                "2つの日付の間のすべての体重記録を、日ごとの平均とともにグループ化して取得します。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）",
            },
            example: "この2週間の体重記録を見せて",
        },
        get_weight_trends: {
            description:
                "一定期間の体重の推移を確認します：最新の記録、全体の変化量、7/14/30日移動平均、最小値/最大値、目標体重への進捗。",
            params: {
                days: "期間の日数（デフォルト30日、最大365日）。",
            },
            example: "今月の体重の推移はどう？",
        },
        set_weight_unit: {
            description:
                "体重の表示・入力単位をkgとlbのどちらにするか選びます。保存されている値自体は変わりません — 表示とデフォルトの解釈のみが変わります。",
            params: {},
            example: "これから体重はポンドで表示して",
        },
        set_nutrition_goals: {
            description:
                "カロリー、マクロ栄養素、食物繊維、糖類、アルコール、カフェイン、水分の1日の目標を設定し、任意で目標体重も設定できます。カロリー、タンパク質、炭水化物、脂質、食物繊維、水分は達成すべき目標値、糖類、アルコール、カフェインは超えないようにすべき上限値であり、進捗の表現もそれに応じて変わります。指定したフィールドのみが更新され、それ以外はそのまま維持されます。",
            params: {
                daily_calories: "1日のカロリー目標（kcal）。nullでクリア。",
                daily_protein_g:
                    "1日のタンパク質目標（グラム）。nullでクリア。",
                daily_carbs_g: "1日の炭水化物目標（グラム）。nullでクリア。",
                daily_fat_g: "1日の脂質目標（グラム）。nullでクリア。",
                daily_fiber_g:
                    "1日の食物繊維目標（グラム）— 達成すべき最小値です。nullでクリア。",
                daily_sugar_g:
                    "1日の<b>総</b>糖類の上限（グラム）— 超えないようにすべき最大値です。総糖類には果物や牛乳に自然に含まれる糖分も含まれるため、公的な添加糖ガイドラインの数値よりかなり大きくなります。nullでクリア。",
                daily_alcohol_g:
                    "1日のアルコール上限を<b>純アルコール</b>のグラム数で指定します — 超えないようにすべき最大値です。米国の標準的な1杯は14g、英国の1ユニットは7.9gです。nullでクリア。",
                daily_caffeine_mg:
                    "1日のカフェイン上限を<b>ミリグラム</b>単位で指定します — 超えないようにすべき最大値です。EFSAおよびFDAが定める健康な成人の上限は1日400mg（ドリップコーヒー約4杯分）、妊娠中は200mgです。0は「まったく摂らない」という実際の上限を意味します。nullでクリア。",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "目標をカロリー2,200、タンパク質160g、目標体重75kgに設定して",
        },
        get_nutrition_goals: {
            description:
                "現在のカロリー・マクロ栄養素の1日の目標、食物繊維の目標、糖類やカフェインの上限、そして（アルコールを記録している場合は）アルコールの上限を確認します。",
            params: {},
            example: "1日の目標は何？",
        },
        get_goal_progress: {
            description:
                "今日の摂取量が目標に対してどうなっているかを確認します — 摂取量対目標のリングと体重の進捗です。マクロのリングをタップすると、どの食事が寄与したかがわかります。",
            params: {},
            example: "今日の目標に対する達成状況は？",
        },
        get_nutrition_summary: {
            description:
                "期間内の1日ごとの栄養合計を、インタラクティブなダッシュボードとして取得します：目標に対するマクロのタイルと、日ごとの内訳です。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）",
            },
            example: "先週分のサマリーをちょうだい",
        },
        get_trends: {
            description:
                "7/14/30日の移動平均、変動幅、記録の連続日数、曜日ごとの内訳、カロリーと各マクロ栄養素についての最も良かった日・悪かった日 — あらかじめ計算済みなので、AIはそれをそのまま説明するだけで済みます。",
            params: {
                days: "期間の日数（デフォルト30日、最大365日）。",
            },
            example: "この30日間のカロリーとマクロ栄養素のトレンドはどう？",
        },
        get_meal_patterns: {
            description:
                "行動パターンを可視化します：各食事タイプの頻度、朝食効果、高カロリーなランチ、遅い夕食、平日と週末の違い、外れ値となる日。",
            params: {
                days: "期間の日数（デフォルト30日、最小7日、最大365日）。",
            },
            example: "遅い夕食や朝食抜きなど、食べ方に何かパターンはある？",
        },
        get_profile: {
            description:
                "現在の設定を一度に確認します：タイムゾーン（現地の日付と時刻も）、ウィジェットの言語、優先する体重の単位、チャット内ウィジェットを表示するかどうか、アルコール記録がオンかどうか。",
            params: {},
            example: "今の設定を教えて",
        },
        set_timezone: {
            description:
                "IANAタイムゾーンを設定し、日付が現地時間の深夜0時で切り替わるようにします — 午後11時に記録した食事は、翌日のUTCとしてではなく、その日としてカウントされます。",
            params: {},
            example: "ベルリンにいます — タイムゾーンを設定して",
        },
        set_language: {
            description:
                "チャット内ウィジェット（ダッシュボードやグラフ）のUI言語を設定します。AIがあなたに返す文章の言語ではありません。",
            params: {
                locale: "ISO 639-1コード。例：<code>de</code>、<code>uk</code>。対応言語：英語、ドイツ語、スペイン語、フランス語、オランダ語、ポーランド語、イタリア語、ウクライナ語。",
            },
            example: "ウィジェットをドイツ語で表示して",
        },
        get_current_time: {
            description:
                "あなたのタイムゾーンでの現在の日付と時刻、そしてUTCでの時刻を確認します。今が何時かをアシスタントに伝えないアプリもあるため、これは「今朝」や「今日」が何を指すかを、あなたに尋ねずに判断するための仕組みです（タイムゾーンが未設定の場合はUTCが既定になります）。",
            params: {},
            example: "今の私の時間は何時？",
        },
        set_widget_display: {
            description:
                "チャット内のビジュアルウィジェット — ダッシュボード、目標リング、トレンドグラフ — のオン/オフを切り替えます。オフにすると、同じツールがテキストとデータのみで応答します。デフォルトで有効で、変更は新しい会話から適用されます。",
            params: {
                enabled: "trueでウィジェットを表示、falseでテキストのみの応答",
            },
            example: "ウィジェットをオフにして",
        },
        set_alcohol_tracking: {
            description:
                "アルコール記録のオン/オフを切り替え、飲み物を米国の標準ドリンクと英国のユニットのどちらでカウントするかを選びます。デフォルトではオフなので、有効にするには明示的にリクエストする必要があります。再びオフにすると、食事・目標・進捗からアルコールが非表示になり、ファイルインポーターもファイルのアルコール列を読み込まなくなります。すでに記録された内容が削除されることはなく、CSVエクスポートには引き続き含まれ、再度オンにすれば表示が戻ります。変更は次のメッセージから適用され、再起動などは不要です。",
            params: {
                enabled:
                    "trueで食事・目標・進捗にアルコールを表示、falseで非表示",
                drink_unit:
                    "グラム数と併せて表示する標準ドリンクの単位：<code>us</code>（1杯14g）または<code>uk</code>（1ユニット7.9g）。デフォルトは<code>us</code>。実際に保存されるのは純アルコールのグラム数です。",
            },
            example: "飲酒の記録を英国ユニットで始めて",
        },
        delete_account: {
            description:
                "アカウントと関連するすべてのデータを完全に削除します。これは取り消せません — AIは必ず事前に確認します。",
            params: {},
            example: "アカウントとすべてのデータを削除して",
        },
    },
};

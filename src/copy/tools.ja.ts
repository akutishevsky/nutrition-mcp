// Japanese (ja) translation of the /tools reference page content — see
// src/copy/tools.ts for the authoritative shape (`ToolsDoc`) and the full
// doc comments on what is/isn't translatable (tool names, param names,
// category slugs are structural and stay in TOOLS/BADGE_META; only prose
// lives here).
//
// Terminology follows the ja glossary (.git/nm-i18n/glossary-ja.md):
// protein → タンパク質, carbs → 炭水化物, fat → 脂質, fiber → 食物繊維,
// (total) sugar → 糖類（総糖類）— never 糖質, which is net carbs in Japanese
// labelling — alcohol → アルコール（純アルコールのグラム数）, caffeine → カフェイン,
// macros → PFC on SEO/hero surfaces and in widget labels, マクロ栄養素 in the
// tool reference itself, meal → 食事, water → 水分, weigh-in → 体重記録,
// goals → 目標, limit → 上限, timezone → タイムゾーン, export → エクスポート,
// widget → ウィジェット, connector → コネクタ (Claude's ja UI), default → デフォルト,
// standard drink / UK unit → US標準ドリンク / UKユニット.
// Plain です/ます prose with the subject left implicit (「お使いのAI」 for
// "your AI", 「あなたの」 only where ownership must be explicit); headings,
// pills and badges are noun phrases; example prompts are casual, the way
// people actually type to an AI. Latin units take a half-width space
// (「13 g」「95 mg」) except inside casual example prompts. Proper nouns
// (Nutrition MCP, Claude, ChatGPT, MyFitnessPal, Cronometer, Lose It!,
// MacroFactor, MCP) stay in Latin script. Numerals stay half-width.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_JA: ToolsDoc = {
    meta: {
        title: "カロリー計算・PFC・水分・体重・体の計測値の全41ツール",
        description:
            "Claude、ChatGPTなどのAIアプリで使えるNutrition MCPの全41ツール。食事記録、バーコード検索、MyFitnessPalやCronometerのCSVインポート、水分・体重・体の計測値の記録に対応。",
        ogDescription:
            "Nutrition MCPサーバーがお使いのAIに追加する全41ツールを、説明と例文つきで紹介。他のアプリの履歴を取り込めるCSVインポーターも含みます。",
    },
    hero: {
        eyebrow: "リファレンス",
        titleBeforeEm: "お使いのAIに",
        titleEm: "できる",
        titleAfterEm: "こと、すべて",
        lead: "ツールを直接呼び出す必要はありません。Claude、ChatGPTなどのMCPクライアントに話しかけるだけで、AIが適切なツールを選びます。ここでは、Nutrition MCPサーバーが提供する食事・カロリーとPFC・水分・体重のツールをすべて取り上げ、それぞれの機能と、そのツールが使われるきっかけになるフレーズを紹介します。",
        countBold: "全41ツール",
        countTail: "· 7分野",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "記録",
            title: "食事の記録",
            description:
                "基本となる機能。食べたものを、どんな言い方で伝えても記録できます。",
        },
        "reviewing-your-meals": {
            pillLabel: "振り返り",
            title: "食事の振り返り",
            description:
                "記録した内容を、1日単位でも期間単位でも振り返れます。",
        },
        water: {
            pillLabel: "水分",
            title: "水分記録",
            description: "食事と合わせて水分摂取量を記録します。",
        },
        weight: {
            pillLabel: "体",
            title: "体重と体の計測値",
            description:
                "体重と体の計測値を記録して見返し、目標体重までの推移を確認できます。",
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
                "AIが自分で計算しなくても傾向をつかめるよう、あらかじめ集計したデータです。",
        },
        "settings-account": {
            pillLabel: "設定",
            title: "設定とアカウント",
            description:
                "記録を正確に保つための設定と、データを自分で管理するための機能。",
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
        categoriesLabel: "ツールのカテゴリー",
    },
    tools: {
        log_meal: {
            description:
                "食べたものをカロリーとマクロ栄養素つきで記録します。数値がわかれば、食物繊維・総糖類・添加糖・アルコール・カフェインも記録できます。ふだんの言葉で伝えるだけで、AIが数値を推定し、量がはっきりしないときは確認します。先にバーコードやWebからラベル情報を取得することもできます。",
            params: {
                description: "何を食べたか",
                meal_type: "朝食・昼食・夕食・間食のいずれか",
                calories: "総カロリー",
                protein_g: "タンパク質（グラム）",
                carbs_g: "炭水化物（グラム）",
                fat_g: "脂質（グラム）",
                fiber_g:
                    "食物繊維（グラム）。ラベルに数値がなければ材料から推定してでも、すべての食事で入力するようAIに指示されています。空欄はゼロ扱いにはならず、その日全体が食物繊維の平均から外れてしまうためです",
                sugar_g:
                    "<b>総</b>糖類（グラム）。ラベルの「糖類」欄に表示される数値で、添加糖だけでなく果物や牛乳に自然に含まれる糖も含みます。食物繊維と同じく、すべての食事で入力されます",
                added_sugar_g:
                    "<b>添加</b>糖（グラム）。加工や調理の際に加えられた糖（砂糖、シロップ、はちみつ、甘味飲料や加糖食品の糖）です。総糖類の一部で、それを超えることはありません。丸ごとの果物、野菜、無糖の牛乳に自然に含まれる糖は添加糖ではなく、果汁100%ジュースの糖も同様です。食物繊維と同じく、すべての食事で入力されます。未加工の食品は0、清涼飲料の糖はすべて添加糖で、米国のラベルに「Includes Xg Added Sugars」の行があればその値を使います。<code>sugar_g</code>とセットで指定します。総糖類があり添加糖がない食事は保存されない場合があります",
                alcohol_g:
                    "<b>純アルコール</b>のグラム数。飲み物の量でもアルコール度数でもありません。AIが注いだ量と度数から計算します（5%のビール330 mlなら13 g）",
                caffeine_mg:
                    "カフェインは<b>ミリグラム</b>単位で、グラムではありません。ここでグラム単位でないのはこの項目だけで、どの表示ラベルやガイドラインもミリグラムで表記しているためです（ドリップコーヒーは約95 mg、エスプレッソは63 mg、コーラ1缶は34 mg）。カフェインにカロリーはありません。食物繊維や糖類と違い、実際にカフェインを含むものにだけ送信されます。0を記録すると、まったく摂っていないカフェインの行がダッシュボードに表示されてしまうためです",
                logged_at:
                    "食べた時刻（今ではない場合）。後から記録するときに使います",
                notes: "追加のメモ",
            },
            example: "お昼にチキンブリトーボウル、ワカモレ多めで記録して",
            photoHint:
                "…または、お皿の写真を撮るだけでもOK。AIが料理を一つずつ特定し、グラス1杯、ひとつかみといった身近な単位で量を見積もり、過去にどう記録したかも参照したうえで、記録する前に確認します。",
        },
        lookup_barcode: {
            description:
                "バーコード（8〜14桁のEAN/UPC）から、パッケージ商品の栄養成分表示をOpen Food Factsで取得します。Open Food FactsにNutri-ScoreやNOVA分類（加工度のグループ）があれば、それも取得します。Open Food Factsに添加糖の値があれば表示し、Open Food Factsが原材料から推定した値であればその旨を示します。数字は入力しても、パッケージの写真から読み取ってもかまいません。結果は、実際に食べた量に換算して記録できます。",
            params: {},
            example: "このバーコードをスキャンして：3017620422003",
            photoHint:
                "…または、パッケージの写真を送るだけでもOK。AIが写真からバーコードの数字を読み取ります。",
        },
        start_meal_import: {
            description:
                "チャット内でインポーターを開き、他のアプリの履歴を取り込みます。MyFitnessPal、Cronometer、Lose It!、MacroFactorなどからエクスポートしたCSVを選び、列をカロリー、マクロ栄養素、食物繊維、総糖類と添加糖、カフェイン（アルコール記録をオンにしている場合はアルコールも）に対応付けて、確定する前に追加される内容を確認できます。ファイルはブラウザ内で読み込まれ、プレビューを承認するまで何も保存されません。同じファイルをもう一度インポートしても、重複は作られません。",
            params: {},
            example: "MyFitnessPalから食事の履歴をインポートして",
        },
        bulk_import_meals: {
            description:
                "過去の食事を1件ずつ記録する代わりに、まとめて追加します（1回につき最大50件）。上のインポーターもこのツールを通して書き込んでおり、チャットに貼り付けた食事データならAIが直接使うこともできます。すべての行を事前にチェックし、合わない行は1行ずつ報告します。そのため、間にタイムゾーンを変更していなければ、同じ行を再送しても安全で、記録済みの内容が重複することはありません。",
            params: {
                meals: "インポートする行。元ファイルの順序で指定します（1回につき1〜50件）。各行には時刻、食事の種類、説明、メモと、記録済みの食事と同じ数値を含められます：<code>calories</code>、<code>protein_g</code>、<code>carbs_g</code>、<code>fat_g</code>、<code>fiber_g</code>、<code>sugar_g</code>（総糖類）、<code>added_sugar_g</code>（添加糖、総糖類の一部）、<code>alcohol_g</code>（純アルコールのグラム数）、<code>caffeine_mg</code>（グラムではなくミリグラム）",
                expected_row_count:
                    "この呼び出しに含まれる行数（元ファイルで数えたもの）。行の抜け落ちを検出するために使います",
                expected_total_kcal:
                    "元ファイルのカロリー合計。受け取った内容と照合します",
                dry_run: "何も書き込まずに、実行した場合の結果を報告します",
                on_error:
                    "有効な行だけをインポートして残りを報告するか、1行でも失敗したら何も書き込まないか",
                source_app: "ファイルのエクスポート元のアプリ",
            },
            example: "前のアプリから先週の食事を貼り付けたよ。全部追加して",
        },
        update_meal: {
            description:
                "記録済みの食事の内容（説明、各マクロ栄養素、食物繊維、総糖類、添加糖、アルコール、カフェイン、時刻、メモ）を変更します。抜けている値を後から補うときにも使います。食物繊維、糖類、添加糖が入らないまま記録された場合はサーバーがそのことを伝え、同意すればAIがここで入力します。",
            params: {
                id: "更新する食事のUUID",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "総糖類（添加糖ではありません）",
                added_sugar_g:
                    "添加糖のみ（総糖類を超えることはありません）。<code>sugar_g</code>とセットで指定します。添加糖が未記録の食事で総糖類を変更する場合、この値がないと保存されないことがあります",
                alcohol_g: "純アルコールのグラム数（飲み物の量ではありません）",
                caffeine_mg: "グラムではなくミリグラム",
                logged_at: "",
                notes: "",
            },
            example:
                "やっぱりあのお昼、500カロリーじゃなくて600カロリーだった。直して",
        },
        delete_meal: {
            description: "間違えて記録した食事を削除します。",
            params: {
                id: "削除する食事のUUID",
            },
            example: "今日の午後に記録した間食を消して",
        },
        search_meals: {
            description:
                "キーワードで過去の食事を検索し、よく記録する食事をバリエーションごとにまとめて表示します。それぞれの記録回数、最後に記録した日、いつものカロリーがわかります。お皿の写真を実際の過去の記録と照らし合わせたり、「いつもの朝食を記録して」に応えたりするときに、AIがこのツールを使います。",
            params: {
                queries:
                    "食品を表すキーワードの候補（これまで記録に使ったどの言語でも可）",
                days: "どこまでさかのぼるか（デフォルトは1年）",
                limit: "分析する最大件数",
            },
            example: "いつもの朝食を記録して",
        },
        get_meals_today: {
            description: "今日記録した食事をすべて表示します。",
            params: {
                detail: "<code>compact</code>（デフォルト）は1食につきIDつきの1行、<code>full</code>はメモと正確な時刻も表示します",
            },
            example: "今日、何食べたっけ？",
        },
        get_meals_by_date: {
            description: "特定の日に記録した食事をすべて表示します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
                detail: "<code>compact</code>（デフォルト）は1食につきIDつきの1行、<code>full</code>はメモと正確な時刻も表示します",
            },
            example: "7月4日に食べたものを全部見せて",
        },
        get_meals_by_date_range: {
            description:
                "2つの日付の間の食事をまとめて取得します。1週間や1か月を振り返るのに便利です。1回で取得できるのは最大31日分で、それより長い期間はトレンドやサマリーで日ごとの合計を確認できます。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）。開始日を含めて最大31日",
                detail: "<code>compact</code>（デフォルト）は1食につきIDつきの1行、<code>full</code>はメモと正確な時刻も表示します",
            },
            example: "月曜から金曜までの食事を一覧にして",
        },
        export_all_data: {
            description:
                "本サービスが保存しているあなたのデータを、すべて1つのZIPにまとめてエクスポートし、60分間有効な非公開のダウンロードリンクを返します。中身はmeals.csv、water.csv、weight.csv、body_measurements.csv、goals.csv、goals_history.csv（目標の変更履歴と日付）、profile.csv、account.csv（サインイン用アカウント）、telemetry.csv（ツールの利用記録）、connections.csv（接続中のAIアプリとApple Health同期。トークンは含みません）、health_sync.csv（Apple Health同期が直近8日間に送信した内容）と、列・単位・含まれないものを説明したREADME.txtです。現時点で再インポートできるのは食事データだけです。",
            params: {},
            example: "食事・水分・体重・目標、データを全部エクスポートして",
        },
        log_water: {
            description:
                "水分摂取を記録します。カップ、オンス、リットルなど、どの単位で伝えてもミリリットルに換算されます。",
            params: {
                amount_ml: "ミリリットル単位の量（整数、&gt; 0）。",
            },
            example: "いま500mlのペットボトルの水を飲んだ",
        },
        get_water_today: {
            description: "今日の水分摂取量の合計と、各記録を表示します。",
            params: {},
            example: "今日は水をどれくらい飲んだ？",
        },
        get_water_by_date: {
            description: "特定の日の水分摂取量の合計と、各記録を表示します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
            },
            example: "昨日はどれくらい飲んだ？",
        },
        delete_water: {
            description: "間違えて追加した水分の記録を削除します。",
            params: {
                id: "削除する水分記録のUUID",
            },
            example: "さっきの水分の記録を消して",
        },
        log_weight: {
            description:
                "体重をkgまたはlbで記録します。1日に何回記録してもかまいません。サーバーが統一した形式で保存するため、単位の設定で数値がずれることはありません。",
            params: {
                weight: "<code>unit</code>で指定した単位の体重（&gt; 0）。",
            },
            example: "体重を記録して。今朝は74.2kg",
        },
        update_weight: {
            description: "記録済みの体重（数値、日時、メモ）を修正します。",
            params: {
                id: "更新する体重記録のUUID",
                weight: "<code>unit</code>で指定した単位の新しい体重。",
                logged_at: "ISO 8601形式のタイムスタンプ",
                notes: "",
            },
            example: "今朝の体重、73.8kgに直して",
        },
        delete_weight: {
            description: "体重記録を削除します。",
            params: {
                id: "削除する体重記録のUUID",
            },
            example: "今日の体重記録を消して",
        },
        get_weight_today: {
            description: "今日の体重記録を、設定した単位で表示します。",
            params: {},
            example: "今日の体重、いくつだった？",
        },
        get_weight_by_date: {
            description: "特定の日の体重記録を表示します。",
            params: {
                date: "YYYY-MM-DD形式の日付",
            },
            example: "今月1日の体重っていくつだった？",
        },
        get_weight_by_date_range: {
            description:
                "2つの日付の間の体重記録をすべて取得し、日ごとの平均つきで日別にまとめます。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）",
            },
            example: "この2週間の体重記録を見せて",
        },
        get_weight_trends: {
            description:
                "期間内の体重の推移を確認できます。日々の変動をならしたトレンド体重、1週間あたりの変化ペース、最新の記録、全体の増減、最小値・最大値、目標体重までの進捗を表示します。グラフは90日、1年、全期間にも切り替えられます。",
            params: {
                days: "期間の日数（デフォルト30日、最大365日）。",
            },
            example: "今月の体重の推移はどう？",
        },
        set_weight_unit: {
            description:
                "体重の表示と入力の単位を、kgとlbから選びます。保存済みの値は変わらず、変わるのは表示と、単位なしで入力したときの解釈だけです。",
            params: {},
            example: "これからは体重をポンドにして",
        },
        log_body_measurement: {
            description:
                "メジャーで測った体の1部位の計測値（ウエスト、ヒップ、首、胸囲、肩幅、上腕、前腕、太もも、ふくらはぎ）を、cmまたはインチで記録します。入力したとおりの値を標準化した値とあわせて保存するため、単位を切り替えても数値がずれることはありません。その部位として現実的な範囲から大きく外れた数値は、入力ミスの可能性が高いものとして受け付けません。",
            params: {
                kind: "部位：<code>waist</code>、<code>hips</code>、<code>neck</code>、<code>chest</code>、<code>shoulders</code>、<code>upper_arm</code>、<code>forearm</code>、<code>thigh</code>、<code>calf</code>のいずれか。1部位につき値は1つで、左右の区別はメモに書けます。",
                value: "<code>unit</code>で指定した単位の計測値（&gt; 0）。",
                unit: "<code>cm</code>または<code>in</code>。省略時は保存済みの長さの単位。",
                logged_at: "測った時刻（今ではない場合）",
                notes: "追加のメモ",
            },
            example: "ウエストを記録して。今朝は82cm",
        },
        get_body_measurements: {
            description:
                "体の計測値を日ごとに古い順で一覧表示します。1つの部位だけに絞ることもできます。日付を指定しなければ直近30日間が対象で、1回あたり最大366日まで指定できます。",
            params: {
                kind: "この部位だけ（例：<code>waist</code>）",
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）。開始日を含めて最大366日",
            },
            example: "この3か月のウエストの計測値を見せて",
        },
        update_body_measurement: {
            description:
                "記録済みの計測値（数値、単位、日時、メモ）を修正します。部位そのものは変更できず、別の部位は新しい記録になります。",
            params: {
                id: "更新する計測値のUUID",
                value: "<code>unit</code>で指定した単位の新しい値。",
                unit: "省略時は記録したときの単位。",
                logged_at: "ISO 8601形式のタイムスタンプ",
                notes: "置き換えるメモ",
            },
            example: "ヒップの計測値、89じゃなくて98cmだった",
        },
        delete_body_measurement: {
            description: "体の計測値の記録を削除します。",
            params: {
                id: "削除する計測値のUUID",
            },
            example: "今日の首の計測値を消して",
        },
        set_length_unit: {
            description:
                "体の計測値の表示と入力の単位を、cmとインチから選びます。体重の単位とは別の設定です。保存済みの値は変わらず、変わるのは表示と、単位なしで入力したときの解釈だけです。",
            params: {},
            example: "計測値はこれからインチで表示して",
        },
        set_nutrition_goals: {
            description:
                "1日のカロリー、マクロ栄養素、食物繊維、糖類、添加糖、アルコール、カフェイン、水分の目標と、必要に応じて目標体重を設定します。カロリー・タンパク質・炭水化物・脂質・食物繊維・水分は達成を目指す目標、総糖類・添加糖・アルコール・カフェインは超えないようにする上限で、進捗の伝え方もそれに合わせて変わります。更新されるのは指定した項目だけで、ほかはそのまま残ります。",
            params: {
                daily_calories: "1日のカロリー目標（kcal）。nullでクリア。",
                daily_protein_g:
                    "1日のタンパク質目標（グラム）。nullでクリア。",
                daily_carbs_g: "1日の炭水化物目標（グラム）。nullでクリア。",
                daily_fat_g: "1日の脂質目標（グラム）。nullでクリア。",
                daily_fiber_g:
                    "1日の食物繊維目標（グラム）。達成を目指す最低量です。nullでクリア。",
                daily_sugar_g:
                    "1日の<b>総</b>糖類の上限（グラム）。超えないようにする最大量です。総糖類には果物や牛乳に自然に含まれる糖も含まれるため、公的機関が示す添加糖の目安はこれよりずっと低い数値です。nullでクリア。",
                daily_added_sugar_g:
                    "1日の<b>添加</b>糖の上限（グラム）。超えないようにする最大量です。添加糖だけを数え、果物や牛乳に自然に含まれる糖は含みません。公的機関が示す糖の目安は、たいていこの指標を指しています（米国心臓協会（American Heart Association）は女性で1日25g、男性で36gまでとしています）。0は「まったくとらない」という実際の上限です。nullでクリア。",
                daily_alcohol_g:
                    "1日のアルコール上限（<b>純アルコール</b>のグラム数）。超えないようにする最大量です。US標準ドリンクは1杯14 g、UKユニットは1ユニット7.9 gです。nullでクリア。",
                daily_caffeine_mg:
                    "1日のカフェイン上限（<b>ミリグラム</b>）。超えないようにする最大量です。EFSAとFDAは健康な成人の上限を1日400 mg（ドリップコーヒー約4杯分）としており、妊娠中についてはEFSAが200 mgとしています。0は「まったく摂らない」という実際の上限として扱われます。nullでクリア。",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "目標をカロリー2,200、タンパク質160g、目標体重75kgに設定して",
        },
        get_nutrition_goals: {
            description:
                "現在の1日のカロリー・マクロ栄養素の目標と、食物繊維の目標、糖類やカフェインの上限、さらに（アルコールを記録している場合は）アルコールの上限を表示します。",
            params: {},
            example: "1日の目標って何だっけ？",
        },
        get_goal_progress: {
            description:
                "今日の摂取量が目標に対してどのくらいかを確認します。摂取量と目標を比べるリングと、体重の進捗を表示します。PFCのリングをタップすると、どの食事によるものかがわかります。",
            params: {},
            example: "今日の目標に対して、いまどんな感じ？",
        },
        get_nutrition_summary: {
            description:
                "期間内の1日ごとの栄養の合計を、インタラクティブなダッシュボードで表示します。目標と比べたPFCのタイルと、日ごとの内訳を確認できます。1回で取得できるのは最大92日分で、それより長い期間はトレンドで移動平均を確認できます。",
            params: {
                start_date: "開始日（YYYY-MM-DD）",
                end_date: "終了日（YYYY-MM-DD）。開始日を含めて最大92日",
            },
            example: "この1週間のサマリーを見せて",
        },
        get_trends: {
            description:
                "7/14/30日の移動平均、ばらつき、連続記録日数、曜日ごとの平均カロリー、カロリーで見て最も良かった日と悪かった日を表示します。あらかじめ計算済みなので、AIはそれを説明するだけで済みます。group_byを指定すると、週・月・四半期・年ごとの平均も出します。平均は記録した日あたり（食事のない日は除外）で、その時点で有効だった目標と比較し、目標内だった日数と記録が不完全かもしれない日数も示します。",
            params: {
                days: "期間の日数（デフォルト30日、最大365日）。",
                group_by:
                    "<code>week</code>、<code>month</code>、<code>quarter</code>、<code>year</code>のいずれか：終了日（デフォルトは今日）を含む期間までの26週、24か月、12四半期、5年。期間は固定です。<code>days</code>は引き続き移動平均の期間を決めます。",
            },
            example: "月ごとに見て、目標に対してどうだった？",
        },
        get_meal_patterns: {
            description:
                "食べ方の傾向を明らかにします。対象は、食事の種類ごとの頻度、朝食の有無による違い、高カロリーな昼食、遅い夕食、平日と週末の違い、いつもと違う日です。",
            params: {
                days: "期間の日数（デフォルト30日、最小7日、最大365日）。",
            },
            example: "夕食が遅いとか朝食を抜くとか、食べ方に何か傾向ある？",
        },
        get_profile: {
            description:
                "現在の設定をまとめて確認できます。対象は、タイムゾーン（現地の日付と時刻も）、ウィジェットの言語、体重と長さの単位、チャット内ウィジェットの表示の有無、アルコール記録のオン/オフです。",
            params: {},
            example: "今の設定を教えて",
        },
        set_timezone: {
            description:
                "IANAタイムゾーンを設定し、現地時間の午前0時で日付が切り替わるようにします。午後11時に記録した食事は、UTCの翌日ではなく、その日の分として数えられます。",
            params: {},
            example: "今ベルリンにいるから、タイムゾーンを設定して",
        },
        set_language: {
            description:
                "チャット内ウィジェット（ダッシュボードやグラフ）の表示言語を設定します。AIが返答する言語は変わりません。",
            params: {
                locale: "ISO 639-1コード（例：<code>de</code>、<code>ja</code>）。対応言語：英語、ドイツ語、スペイン語、フランス語、オランダ語、ポーランド語、イタリア語、ウクライナ語、日本語。",
            },
            example: "ウィジェットをドイツ語で表示して",
        },
        get_current_time: {
            description:
                "設定したタイムゾーンでの現在の日付と時刻、そしてUTCでの時刻を確認します。アシスタントに現在時刻を伝えないアプリもあるため、AIはこのツールで「今朝」や「今日」がいつを指すのかを、聞き返さずに判断します（タイムゾーンが未設定ならUTCになります）。",
            params: {},
            example: "こっちの時間で今何時？",
        },
        set_widget_display: {
            description:
                "チャット内のビジュアルウィジェット（ダッシュボード、目標リング、トレンドグラフ）のオン/オフを切り替えます。オフにすると、同じツールがテキストとデータだけで応答します。デフォルトはオンで、変更は新しい会話から反映されます。",
            params: {
                enabled: "trueでウィジェットを表示、falseでテキストのみで応答",
            },
            example: "ウィジェットをオフにして",
        },
        set_alcohol_tracking: {
            description:
                "アルコール記録のオン/オフを切り替え、飲み物をUS標準ドリンクとUKユニットのどちらで数えるかを選びます。デフォルトはオフなので、使うにはオンにするよう頼む必要があります。再びオフにすると、食事・目標・進捗にアルコールが表示されなくなり、ファイルインポーターもファイルのアルコール列を読み込まなくなります。記録済みのデータは削除されず、CSVエクスポートにも引き続き含まれ、オンに戻せば再び表示されます。変更は次のメッセージから反映され、再起動などは必要ありません。",
            params: {
                enabled:
                    "trueで食事・目標・進捗にアルコールを表示、falseで非表示",
                drink_unit:
                    "グラム数と並べて表示する標準ドリンクの単位：<code>us</code>（1杯14 g）または<code>uk</code>（1ユニット7.9 g）。デフォルトは<code>us</code>。実際に保存されるのは純アルコールのグラム数です。",
            },
            example: "お酒の記録を始めて。UKユニットで",
        },
        delete_account: {
            description:
                "Nutrition MCPのアカウントと、そこに保存されているあなたのデータをすべて完全に削除します。元に戻せないため、明示的な確認がない限りツールは何も実行しません。また、実行する前にユーザーに確認するよう、AIにも求めています。",
            params: {},
            example: "アカウントとデータを全部削除して",
        },
    },
    troubleshooting: {
        pillLabel: "ヘルプ",
        title: "トラブルシューティング",
        description:
            "うまく動かないときは？　ほとんどの問題はすぐに解決できます。",
        stillStuck: "それでも解決しないときは？",
        items: {
            "cannot-connect": {
                question:
                    "コネクタが接続できない、または何度もサインインを求められる",
                answerHtml: `コネクタを削除し、<code>https://nutrition-mcp.com/mcp</code>を正確に入力して追加し直してください。<code>/mcp</code>の部分も必要です。Claudeでは「<strong>カスタマイズ</strong>」→「<strong>コネクタ</strong>」を開き、Nutritionを切断してから接続し直します。ChatGPTでは「<strong>設定</strong>」→「<strong>アプリ</strong>」から操作します。以前と同じメールアドレスとパスワード、または同じGoogleアカウントでサインインしてください。データは接続ではなくアカウントに紐づいているため、再接続しても何も失われません。一度接続すれば、少なくとも90日に1回使っている限り接続は維持されます。動かなくなったときも、同じ手順で再接続すれば直ります。`,
            },
            "session-expired": {
                question:
                    'サインインページに{"error":"session_expired"}と表示される',
                answerHtml: `サインインページの有効期限は10分で、アップデートでサーバーが再起動したときにもリセットされます。サインインページに戻って再読み込みするか、AIアプリから接続をやり直し、時間を空けずにサインインしてください。代わりに<code>session_mismatch</code>と表示される場合は、サインインを始めたのとは別のブラウザで完了しようとしています。AIアプリからやり直し、同じブラウザで最後まで進めてください。`,
            },
            "cannot-sign-in": {
                question: "サインインできない、またはパスワードを忘れた",
                answerHtml: `すでにアカウントがある場合は「<strong>サインイン</strong>」を使ってください。メールアドレスかパスワードが違うときは「メールアドレスまたはパスワードが正しくありません」と表示され、新しいアカウントが作られることはありません。「<strong>アカウントを作成</strong>」を使うのは初回だけです。メールアドレスに入力ミスがないかも確認してください。「<strong>Googleで続行</strong>」でアカウントを作成した場合は、もう一度そのボタンを使ってください。パスワードを自分でリセットする機能はまだありません。アカウントのメールアドレスから<a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>にメールをいただければ、こちらでリセットします。`,
            },
            "history-missing": {
                question: "再接続したら履歴が消えた",
                answerHtml: `メールアドレスごとに別のアカウントになるため、別のメールアドレスでサインインすると、空のアカウントが新しく作られます。何も削除されてはいません。一度切断して、最初に使ったメールアドレスでサインインし直してください。どのアドレスだったかわからない場合は、<a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>までメールしてください。`,
            },
            "tools-not-used": {
                question: "AIは返答するのに、何も記録されない",
                answerHtml: `この会話でコネクタがオンになっているか確認してください（Claudeではメッセージ入力欄のツールメニューで確認できます）。そのうえで、「Nutritionに朝食を記録して」のように直接頼んでみてください。アプリからツールの使用許可を求められたら、許可してください。`,
            },
            "wrong-day": {
                question: "食事が違う日に表示される",
                answerHtml: `日付はタイムゾーンを基準に区切られ、一度も設定していない場合はUTCが使われます。「タイムゾーンは何に設定されてる？」と聞き（<a href="#get_profile"><code>get_profile</code></a>）、間違っていれば「タイムゾーンをEurope/Berlinに設定して」と頼んでください（<a href="#set_timezone"><code>set_timezone</code></a>）。これで、過去の分も含め、記録したものはすべて現地の日付でまとめられます。唯一の例外は、タイムゾーンが間違っていた間に時刻を指定して記録したものです。保存された時点の日時がそのまま残るため、1時間や1日ずれたままになることがあります。AIに正しい日付と時刻へ移すよう頼んでください（<a href="#update_meal"><code>update_meal</code></a>）。履歴をインポートする前にも、タイムゾーンを設定しておきましょう。インポートした食事は割り当てられた日時がそのまま残るため、タイムゾーンを変えた後で他のアプリのファイルをもう一度インポートすると、同じ食事が二重に追加されます。Nutrition MCPのエクスポートファイルは認識されるため、重複しません。`,
            },
            "no-widgets": {
                question: "テキストだけで、グラフやカードが表示されない",
                answerHtml: `ビジュアルカードを表示するには、ClaudeやChatGPTのように、インタラクティブなMCP Appsパネルに対応したアプリが必要です。それ以外のクライアントでは、同じ情報がテキストで届きます。ウィジェットをオフにしていた場合は、オンに戻すよう頼んで（<a href="#set_widget_display"><code>set_widget_display</code></a>）、新しい会話を始めてください。開いているチャットは、再接続するまで以前の設定のままです。食事を記録した後の小さなカードは、1日の目標を設定するまで表示されません（<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>）。`,
            },
            "import-problems": {
                question:
                    "インポーターが開かない、または保存できないと表示される",
                answerHtml: `インポーターパネルを使うには、インタラクティブなパネルを表示でき、ウィジェットがオンになっているアプリが必要です。「<em>このホストでは、この画面から記録に書き込めません</em>」と表示される場合や、パネルがまったく表示されない場合は、AIにファイルを直接インポートするよう頼んでください。CSVを添付するか貼り付ければ、AIが<a href="#bulk_import_meals"><code>bulk_import_meals</code></a>を使います。このツールはすべての行をチェックして重複をスキップするため、間にタイムゾーンを変更していなければ再送しても安全です。最初のインポートの前に、タイムゾーンを設定しておきましょう。変更後に他のアプリのファイルを再インポートすると、同じ行がもう一度追加されます。インポーターパネルでアルコール列も取り込みたい場合は、先にアルコール記録をオンにしてください。オフの間、パネルはその列をスキップし、後から再インポートしてもその列は埋まりません。`,
            },
            "rate-limited": {
                question:
                    "「Rate limit exceeded」または「Too many failed authentication attempts」と表示される",
                answerHtml: `1つのアカウントにつき1分あたり60リクエストまで送信でき、ツール呼び出しは1回ごとに少なくとも1リクエストとして数えられます。メッセージに表示された秒数だけ待ってから続けてください。たくさんの食事をさかのぼって記録するときは、1件ずつ記録せずにインポーターを使ってください。サインインページは、ネットワークごとに1分あたり30リクエストまでです。同じネットワークから接続が20回連続で拒否されると（たいていは、切断済みの古いコネクタが再試行を続けているのが原因です）、そのネットワークからの接続は5分間停止され、繰り返すたびに停止時間は最長1時間まで延びます。古いコネクタを削除して追加し直せば、再試行は止まります。`,
            },
            "barcode-not-found": {
                question: "バーコードが見つからない、または数値がおかしい",
                answerHtml: `バーコードのデータは、コミュニティが運営するデータベースOpen Food Factsから取得しているため、登録されていない商品や、情報が古い商品もあります。バーコードの下の8〜14桁の数字がすべて正しく読み取られているか確認してください。商品が見つからなくても、AIが商品名や栄養成分表示の写真から推定でき、どの数値も後から修正できます。openfoodfacts.orgに商品を登録すると、ほかの人の役にも立ちます。Open Food Factsにはカフェインのデータがないため、カフェインは表示ラベルや一般的な含有量をもとにします。`,
            },
            "health-sync-yesterday": {
                question: "昨日の分がまだApple Healthにない",
                answerHtml:
                    'Apple Healthとの同期は、終わった日だけを送ります。1日はタイムゾーンで翌朝05:00に締まるため、昨日の分は今日の05:00以降の最初の同期で届き、今日の分がヘルスケアに表示されるのは明日です。同期は、ショートカットのオートメーションが動いたとき（ヘルスケアAppを開く、アラームを止める）か、ショートカットAppで<strong>Nutrition MCP Health</strong>を実行して<strong>Sync now</strong>を選んだときに行われます。同期しなかった朝の分は自動で取り戻されます。毎回の同期で直近7日間をさかのぼるからです。日付はプロフィールのタイムゾーン（<a href="#get_profile"><code>get_profile</code></a>）、一度も設定していない場合は接続時にiPhoneが伝えたタイムゾーンで区切られます（<a href="#wrong-day">食事が違う日に表示される</a>）。接続より前の日は、接続時に最大7日前までさかのぼることを選んだ場合にだけ送られます。',
            },
            "health-sync-higher": {
                question: "Apple Healthの数値がチャットより多い",
                answerHtml:
                    "Apple Healthは値を足すことはできても、すでにある値を減らすことはできません。送信済みの日に食事を追加すると、その日が直近7日間に入っている限り、12:01、12:02…の小さな追加エントリとして届きます。日が送信された後に食事を削除したり減らしたりすると、ヘルスケアの値は高いまま残り、ショートカットがその差を通知します。直すには、ヘルスケアAppで<strong>ブラウズ</strong> → <strong>栄養</strong>を開き、該当する項目で<strong>すべてのデータを表示</strong>をタップし、その日の「ショートカット」からのエントリを削除して、正しい合計を手入力してください。<strong>“ショートカット”からのすべてのデータを削除</strong>は使わないでください。ほかのショートカットが記録したデータも消えます。毎日が2倍に見える場合は、別のAppも同じ項目を書き込んでいて、ヘルスケアが両方を合計しています。ヘルスケアAppの<strong>共有</strong> → <strong>App</strong>でどちらかをオフにしてください。",
            },
            "health-sync-stopped": {
                question: "Apple Healthとの同期が止まった",
                answerHtml:
                    "ショートカットAppで<strong>Nutrition MCP Health</strong>を手動で実行してください。何が問題かを表示します。もう一度接続するよう求められたら、接続は終了しています（同期のないまま90日たった、接続から365日たった、または<strong>Disconnect</strong>を選んだ）。実行して、開いたページでAIアプリと同じアカウントでサインインし、30分以内に完了してください。手動なら同期するのに自動では動かない場合は、ショートカットAppの<strong>オートメーション</strong>タブでそのオートメーションがオンで、<strong>すぐに実行</strong>になっているか確認してください。ある日がApple Healthに届かなかったと通知された場合は、ヘルスケアAppの<strong>共有</strong> → <strong>App</strong> → <strong>ショートカット</strong>で、すべての栄養項目への書き込みを許可してから、もう一度実行してください。新しいiPhoneを接続すると、古いiPhoneの接続は置き換えられます。",
            },
            "export-link": {
                question: "エクスポートのダウンロードリンクが使えない",
                answerHtml: `エクスポートのリンクは60分で期限切れになり、新しくエクスポートするたびに前のファイルは置き換えられます。もう一度エクスポートを頼み（<a href="#export_all_data"><code>export_all_data</code></a>）、すぐにダウンロードしてください。記録があるはずなのにエクスポートの食事が0件になっている場合は、別のメールアドレスでサインインしている可能性があります（<a href="#history-missing">履歴が消えた場合</a>を参照）。`,
            },
            "delete-account": {
                question: "アカウントを削除するには？",
                answerHtml: `AIにNutrition MCPのアカウントを削除するよう頼んでください（<a href="#delete_account"><code>delete_account</code></a>）。AIが確認を求め、確認すると食事、水分、体重、体の計測値、目標、設定、AIアプリがどのツールを使ったかの記録、エクスポートファイル（ある場合）、サインイン情報、そしてアカウント自体が完全に削除されます。元に戻せないため、コピーを残したい場合は先にデータをエクスポートしてください。そのあと、アプリからコネクタを削除してください。後で同じメールアドレスでサインインし直すと、新しい空のアカウントが作成されます。`,
            },
            "report-a-problem": {
                question: "バグやセキュリティの問題を報告するには？",
                answerHtml: `バグは<a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>で報告してください。使っているアプリ（Claude、ChatGPTなど）、何を頼んだか、何が起きたか、おおよその日時を書いてください。パスワードは絶対に書かないでください。セキュリティの問題は公開の場では報告せず、<a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">セキュリティポリシー</a>に記載のとおり、<a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">GitHubの非公開脆弱性報告</a>またはメールで非公開で報告してください。その他のお問い合わせは、<a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>までメールでどうぞ。`,
            },
        },
    },
};

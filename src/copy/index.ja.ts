// Japanese (ja) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means, which fields carry trusted HTML, and which fields of the
// demo conversations are structure (copied verbatim) rather than copy.
//
// NOTE on sugar: the in-chat widget strings (src/copy/widgets.ja.ts, not
// this file) label the sugar tile 糖質, while this prose says 糖類, so an
// examples reply that names sugar sits above a real card that says 糖質.
// Known and deliberate: 糖質 means net carbohydrate, so the prose keeps the
// accurate 糖類, and the card's label is the widget copy's to change.
//
// Terminology kept consistent across the widget labels and prose:
// protein → タンパク質, carbs → 炭水化物, fat → 脂質, fiber → 食物繊維,
// (total) sugar → 糖類, alcohol → アルコール（純アルコール換算のグラム）,
// caffeine → カフェイン, meal → 食事, water → 水分, weigh-in → 記録,
// goals/target → 目標, limit → 上限, timezone → タイムゾーン,
// export → エクスポート, trends → トレンド, examples → 使用例. Standard
// polite です/ます register throughout the prose, matching how a modern
// consumer SaaS product speaks in Japanese; the user's side of the demo
// chats is casual, as people actually type. Link/button labels use
// plain/dictionary form where that's the natural Japanese UI convention
// (e.g. a bare noun phrase like "食事を記録"). Proper nouns (Nutrition MCP,
// Claude, ChatGPT, GitHub, Patreon, MyFitnessPal, Cronometer, Lose It!,
// MacroFactor, Open Food Facts, MCP) stay in Latin script, never
// transliterated into katakana. Numbers stay half-width digits with the
// same comma thousands-separator and unit spacing as the English source
// (e.g. "2,000", "480 kcal", "21 g"), so every figure the cards draw is
// quoted byte-identically.
//
// Three spacing fields deliberately differ from the English contract:
// `onboarding.justSay` ends in a full-width colon instead of a trailing
// space, and `stats.refreshBefore` / `stats.timezonesAfter` carry no space
// next to the number — Japanese sets no space between a numeral and the
// counter/particle around it (「12か所のタイムゾーン」), so the English
// pattern would render a stray gap beside the <b>{n}</b>.

import type { IndexDoc } from "./index.js";

export const INDEX_JA: IndexDoc = {
    title: "Nutrition MCP — ClaudeとChatGPTで使えるAI食事・栄養トラッカー",
    metaDescription:
        "ClaudeやChatGPTに話しかけるだけで、食事記録・カロリー計算・PFC管理。バーコード検索、体重管理、全データのエクスポートに対応した、無料・オープンソースのMCPサーバーです。",
    ogDescription:
        "ClaudeやChatGPTに話しかけるだけで、食事記録・カロリー計算・PFC管理。バーコード検索、体重管理、全データのエクスポートに対応した、無料・オープンソースのMCPサーバーです。",
    keywords:
        "栄養トラッカー, 食事記録, MCPサーバー, Claude AI, ChatGPT, カロリーカウンター, 栄養素トラッカー, バーコードスキャナー, 食事ログ, ダイエット管理, 体重トラッカー, 体重記録, AI栄養管理, Model Context Protocol",

    hero: {
        titleBeforeEm: "AIに",
        titleEm: "話しかける",
        titleAfterEm: "だけで栄養管理。",
        lead: "ClaudeまたはChatGPTを接続して、食べたものを話すだけ。カロリーと栄養素が自動で記録されます。",
        ctaPrimary: "かんたん導入",
        ctaSecondary: "サポート",
        moreExamples: "使用例をもっと見る",
        chat: {
            photoAlt:
                "写真：バナナ、ベリー、グラノーラをのせたスムージーボウルと、横に置いたアメリカーノ",
            pauseLabel: "デモを一時停止",
            replayLabel: "デモをもう一度再生",
            exchanges: [
                {
                    photo: true,
                    userText: "朝ごはん + アメリカーノ",
                    aiText: "スムージーボウルですね。見たところ手作りのようです。これまで2通りで記録しています：グラノーラとはちみつ入りか、フルーツだけか。今回はどちらですか?",
                },
                {
                    userText: "グラノーラとはちみつ。スプーンにたっぷり1杯",
                    aiText: "わかりました。アメリカーノはブラックですか、ミルク入りですか?",
                },
                {
                    userText: "オーツミルクをちょっとだけ",
                    aiText: "では：グラノーラ1つかみとはちみつ大さじ1のボウルに、オーツミルクを少し入れたアメリカーノ。約480 kcal、タンパク質21 gです。朝食として記録しますか?",
                },
                {
                    userText: "うん",
                    aiText: "朝食を記録しました：480 kcal、タンパク質21 g、カフェイン150 mg。糖類は51 gで、そのうち17 gははちみつの分です。",
                    card: "meal-logged",
                    meal: {
                        description:
                            "グラノーラ（1つかみ）とはちみつ（大さじ1）をのせたスムージーボウル（ギリシャヨーグルト、バナナ、ベリー）、オーツミルク少量入りのアメリカーノ",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "昨日の夜の残りの炒め物、量は同じ。あと500 mlの水を1本",
                    aiText: "昼食を記録しました。昨夜と同じく620 kcal、タンパク質54 g、それに水500 mlです。",
                },
                {
                    userText: "子どものポテト6本つまんじゃった。何も言わないで",
                    aiText: "何も言いませんよ。約90 kcal、間食として記録しました。",
                },
                {
                    userText: "夕飯、あとどれくらい食べられる?",
                    aiText: "残りは810 kcalで、タンパク質はまだ84 g足りません。甘くないものにしましょう：糖類はすでに上限60 gのうち59 gです。",
                    card: "nutrition-summary",
                },
                {
                    userText: "体重はどんな感じ?",
                    aiText: "2月11日から1.4 kg減で、週に約0.4 kgのペースです。目標の75 kgまであと3.8 kgです。",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "3ステップ。覚えるアプリはありません。",
        steps: [
            {
                title: "一度接続するだけ",
                body: "リモートMCPサーバーに対応したAIクライアントならどれでも使えます — Claude、ChatGPTなど。インストールもAPIキーも不要です。",
            },
            {
                title: "食べたものを話すだけ",
                body: "普通の言葉で説明するだけ — 食事の写真、デリバリーアプリのスクリーンショット、バーコード（オンラインで商品を検索します）を送ってもOKです。栄養素は自動で記録されます。",
            },
            {
                title: "記録して振り返る",
                body: "日次サマリー、週次トレンド、目標の進捗を聞いたり、記録したすべてをCSVファイルとしてエクスポートしたりできます — すべて無料です。",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "1分足らずで接続完了",
        sub: "OAuth 2.0（PKCE対応）をサポートするMCPクライアントならどれでも使えます。初回接続時にGoogleまたはメールアドレスとパスワードでアカウントを作成し、同じ方法でサインインすればデータを引き継げます。",
        copyAriaLabel: "サーバーURLをコピー",
        tabsLabel: "AIクライアントを選択",
        claude: {
            cta: "Claudeに追加",
            steps: [
                "ディレクトリのページで<strong>接続</strong>をクリックし、Googleで続行するか、メールアドレスとパスワードでサインインしてください。",
                "完了です。すぐに使えるようになり、iOS・Androidアプリにも自動的に反映されます。",
            ],
            note: "無料プランを含むすべてのClaudeプランで利用できます。手動で追加する場合は、「カスタマイズ」→「コネクタ」→「カスタムコネクタを追加」から https://nutrition-mcp.com/mcp を追加してください。",
        },
        chatgpt: {
            steps: [
                "<strong>ChatGPT（Web版）</strong>を開き、<strong>設定</strong> → <strong>アプリ</strong>に進みます。",
                "ポップアップ下部の<strong>アプリを作成</strong>をクリックします。表示されない場合は、<strong>詳細設定</strong>で<strong>開発者モード</strong>をオンにしてください。",
                "名前を付けます（例:<strong>Nutrition</strong>）。",
                "<strong>Connection</strong>には<code>https://nutrition-mcp.com/mcp</code>を貼り付けます。",
                "<strong>Authentication</strong>では<strong>OAuth</strong>を選択し、それ以外はそのままにします。",
                '<strong>"I understand and want to continue"</strong>にチェックを入れます。',
                "<strong>作成</strong>をクリックします。",
                "<strong>Nutritionでサインイン</strong>をクリックすると、ログインページが開きます。Googleで続行するか、メールアドレスとパスワードでサインインしてください。",
                "完了です。すぐに使えるようになり、iOS・Androidアプリにも自動的に反映されます。",
            ],
        },
        other: {
            note: "上記の設定をお使いのクライアント（Cursor、VS Code、Claude Codeなど）に追加してください。Windsurfでは<code>url</code>の代わりに<code>serverUrl</code>を使います。Claude Codeでは<code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>を実行します。OAuthログインはクライアントが自動的に処理します。",
        },
        otherTabLabel: "その他のエージェント",
    },

    onboarding: {
        title: "一度設定するか、そのまま話し始めるか",
        sub: "こちらは完全に任意です — Nutrition MCPは接続した瞬間から使えます。より正確にしたい場合は、次の3つの簡単なステップを行ってください。もちろん、そのまま記録を始めてもかまいません。",
        justSay: "こう言うだけ：",
        steps: [
            {
                title: "タイムゾーンを設定",
                body: "現地時間の深夜0時に日付が切り替わり、どこにいても今日の合計が正確になります。",
                say: "タイムゾーンをニューヨークに設定して",
            },
            {
                title: "目標を設定",
                body: "1日あたりのカロリー・栄養素・水分の目標に加え、任意で目標体重と単位（kgまたはlb）を設定して、進捗を追跡できます。",
                say: "1日の目標を2,000カロリーとタンパク質150gに設定して",
            },
            {
                title: "言語を設定",
                body: "チャット内ウィジェット（ダッシュボードやグラフ）を表示する言語です。AIがあなたに返す文章の言語ではありません。",
                say: "ウィジェットをドイツ語で表示して",
            },
            {
                title: "記録を始める",
                body: "食べたものを話すか、写真を送るか、バーコードをスキャンするだけ。それだけです。",
                say: "朝食にベリー入りオートミールを食べました",
            },
        ],
        note: "ここでの設定はすべて任意です。今すぐでも、後からでも、しなくても構いません — まずは記録を始めて、好きなタイミングで設定してください。",
        toolsCta: {
            heading: "実際に何ができるか気になりますか?",
            body: "記録、バーコード、水分、体重、目標、トレンドなど、全36個のツールをそれぞれの説明とプロンプト例つきで確認できます。",
            arrow: "ツールを見る",
        },
    },

    examples: {
        title: "話しかけるだけ。",
        sub: "話しかけるだけでできることの一部です。",
        prevLabel: "前の例",
        nextLabel: "次の例",
        pickerLabel: "例を選択",
        carouselLabel: "使用例",
        threadLabel: "会話",
        moreToolsLabel: "あわせて使用",
        toolLinkLabel: "ツールページの{tool}",
        photoMealAlt:
            "写真：サワークリームとディルをのせたボルシチと、横に添えたライ麦パン1枚",
        photoPackageAlt:
            "写真：コカ・コーラの缶のバーコード、番号5449000000996",
        downloadExpires: "60分後に期限切れ",
        slides: [
            {
                id: "log-meal",
                title: "ふだんの言葉で記録",
                description:
                    "友だちに話すように伝えるだけ。量やどの食事かがわからなければ、推定する前に確認します。食物繊維と糖類はすべての記録に、カフェインは含まれるものに入り、「今朝」もあなたのタイムゾーンで記録されます。",
                toolNotes: {
                    log_meal:
                        "主要栄養素、食物繊維、糖類、コーヒーのカフェイン込みで朝食を記録",
                    log_water: "07:00の500 mlを今日の水分の合計に加算",
                    get_current_time:
                        "今日の日付を確認し、「7時ごろ」を07:00として記録",
                },
                messages: [
                    {
                        from: "user",
                        text: "朝ごはんはブルーベリー入りのオートミールとコーヒー",
                    },
                    {
                        from: "ai",
                        text: "器はどのくらいの大きさで、オートミールは牛乳と水のどちらで作りましたか? コーヒーには何か入れましたか?",
                    },
                    {
                        from: "user",
                        text: "普通サイズ、牛乳で。コーヒーはブラック",
                    },
                    {
                        from: "ai",
                        text: "朝食を記録しました：約320 kcal、タンパク質11 g、食物繊維6 g。コーヒーのカフェインで、上限400 mgのうち95 mgになりました。",
                    },
                    {
                        from: "user",
                        text: "あ、あと7時ごろ、ランニングの前に水を半リットルくらい飲んだ",
                    },
                    {
                        from: "ai",
                        text: "今朝07:00に水500 mlを追加しました。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "牛乳で作ったブルーベリー入りオートミール（1杯）とブラックコーヒー（1杯）",
                ],
            },
            {
                id: "photo-meal",
                title: "お皿を撮るだけ",
                description:
                    "写真は推測ではなく、会話のきっかけです。手作りか外食かを確かめ、写真ではわからないことは過去の記録から調べ、食べた量を身近な単位でたずねます。記録するのは、まとめをあなたが承認してからです。",
                toolNotes: {
                    search_meals:
                        "以前Tsybulyaで記録したボルシチと、その中身を見つける",
                    log_meal: "承認を受けてから、お店の名前つきで記録",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "お昼",
                    },
                    {
                        from: "ai",
                        text: "サワークリームを添えたボルシチと、ライ麦パン1枚のようですね。手作りですか、それともお店のものですか? お店なら、どちらのお店ですか?",
                    },
                    {
                        from: "user",
                        text: "キーウのポジールにあるTsybulya",
                    },
                    {
                        from: "ai",
                        text: "Tsybulyaのボルシチは以前に2回記録していて、どちらもサワークリーム添えの牛肉のボルシチでした。今回も同じですか? ボルシチとパンは全部食べましたか?",
                    },
                    {
                        from: "user",
                        text: "同じやつ。全部食べた、パンも",
                    },
                    {
                        from: "ai",
                        text: "では：キーウ・ポジールのTsybulyaで、サワークリームを添えた牛肉のボルシチ（1杯、完食）とライ麦パン（1枚）。約520 kcal、タンパク質24 gで、公表値ではなく推定です。昼食として記録しますか?",
                    },
                    {
                        from: "user",
                        text: "うん",
                    },
                    {
                        from: "ai",
                        text: "昼食を記録しました：520 kcal · タンパク質24 g · 炭水化物43 g · 脂質27 g · 食物繊維7 g · 糖類10 g。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "サワークリームを添えた牛肉のボルシチ（1杯、完食）とライ麦パン（1枚）、Tsybulya（キーウ・ポジール）",
                ],
            },
            {
                id: "scan-barcode",
                title: "バーコードをスキャン",
                description:
                    "パッケージを撮影すると、バーコードの下の数字をOpen Food Factsで検索し、どれだけ口にしたかを尋ねます。Open Food Factsにはカフェインの情報がないため、カフェインはラベルか一般的な含有量から補い、欠けている食物繊維や糖類の数値も空欄にせず推定します。",
                toolNotes: {
                    lookup_barcode: "缶のラベルの数値をOpen Food Factsから取得",
                    log_meal: "缶1本分をカフェイン込みで昼食に記録",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "これお昼と一緒に飲んだ。実際どれくらい体に悪い?",
                    },
                    {
                        from: "ai",
                        text: "コカ・コーラの330 ml缶ですね：139 kcal、糖類35 g（Open Food Factsより）。1缶まるごと飲みましたか?",
                    },
                    {
                        from: "user",
                        text: "1缶全部",
                    },
                    {
                        from: "ai",
                        text: "昼食に追加して記録しました：139 kcal、糖類35 g、カフェイン33 mg。Open Food Factsにはカフェインの記載がないため、カフェインは缶のラベルの値です。どれくらい悪いかというと、この糖類だけで1日の上限60 gの半分を超えます。Open Food Factsの評価はNutri-Score E、NOVA 4（超加工食品）です。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: ["コカ・コーラ（330 ml缶）"],
            },
            {
                id: "goals-progress",
                title: "目標を決めて確認",
                description:
                    "カロリーやタンパク質のように達成したい目標と、糖類・アルコール・カフェインのように超えたくない上限を設定。変わるのは伝えた項目だけです。どの日についても、各数値を目標と比べ、あとどれだけ残っているかを確認できます。",
                toolNotes: {
                    set_nutrition_goals:
                        "カロリーとタンパク質の目標、カフェイン上限400 mgを保存",
                    get_goal_progress: "今日の各目標に対する状況と残りを表示",
                },
                messages: [
                    {
                        from: "user",
                        text: "ちょっと絞りたい。2000 kcalとタンパク質160 gに設定して。あとカフェインの上限ってどれくらいが妥当? ほぼコーヒーで生きてる",
                    },
                    {
                        from: "ai",
                        text: "健康な成人については、EFSAとFDAが1日400 mgまでとしています。ドリップコーヒー約4杯分で、妊娠中はEFSAが200 mgを推奨しています。上限はご自身で決められます。400にしますか?",
                    },
                    {
                        from: "user",
                        text: "うん、400で",
                    },
                    {
                        from: "ai",
                        text: "設定しました：2,000 kcalとタンパク質160 gを目標に、カフェインは400 mg未満。ほかはそのままです：炭水化物220 g、脂質70 g、食物繊維30 g、水分2.5 L、糖類の上限60 g。",
                    },
                    {
                        from: "user",
                        text: "今夜まだデザート食べられる?",
                    },
                    {
                        from: "ai",
                        text: "ここまで1,540 kcal、タンパク質104 gなので、残りは460 kcal、タンパク質56 gです。厳しいのは糖類で、上限60 gのうち40 g、残りは20 gです。カフェインは400 mgのうち130 mgです。",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "1週間を振り返る",
                description:
                    "1週間の様子を聞くと、平均と記録日数を載せたトレンドカードがチャット内に開きます。7日・14日・30日の切り替えも、栄養素をタップしたグラフ表示も、新たなリクエストなしで。連続記録や目標達成日数も答えられます。",
                toolNotes: {
                    get_trends:
                        "直近7日・14日・30日を平均し、トレンドカードを開く",
                },
                messages: [
                    {
                        from: "user",
                        text: "この2週間どうだった? なんかバラバラだった気がする",
                    },
                    {
                        from: "ai",
                        text: "感じているより安定しています。1日平均1,830 kcalで、目標の2,000より170少ないですが、これは14日のうち記録しなかった1日を0として数えた値です。記録した13日だけなら約1,970で、目標の±10%以内が9日。しかも10日連続で記録中です。",
                    },
                    {
                        from: "user",
                        text: "糖類は?",
                    },
                    {
                        from: "ai",
                        text: "そこは要注意です。平均52 gで、13日のうち4日は上限の60 gを超えました。",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "体重を記録",
                description:
                    "体重をkgまたはlbで記録すれば、日々の変動に隠れたトレンドがわかります。平滑化した平均、1か月の変化、目標までの差を表示。小数点の打ち忘れのようなありえない値は、保存前に弾きます。",
                toolNotes: {
                    log_weight: "784 kgをありえない値として退け、78.4 kgを保存",
                    get_weight_trends:
                        "30日分を移動平均で平滑化し、目標までの差を算出",
                },
                messages: [
                    {
                        from: "user",
                        text: "今量った、784",
                    },
                    {
                        from: "ai",
                        text: "784 kgは体重としてありえる範囲（20〜500 kg）を外れているため、何も保存していません。78.4 kgのことですか?",
                    },
                    {
                        from: "user",
                        text: "笑 そう、点を忘れた。推移はどう?",
                    },
                    {
                        from: "ai",
                        text: "78.4 kgを記録しました。2月11日から1.8 kg減で、週に約0.4 kgのペース、7日間平均は78.7 kgです。目標の75 kgまであと3.4 kgです。",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "自分の傾向を知る",
                description:
                    "いつ多く食べているかを聞くと、あなた自身の記録を比較します：平日と週末、朝食のある日とない日、しっかりした昼食、早めと遅めの夕食。いつもと違う日も知らせ、伝えるのは原因ではなく傾向です。",
                toolNotes: {
                    get_meal_patterns:
                        "30日分で朝食の有無、夕食の時間、週末を比較",
                },
                messages: [
                    {
                        from: "user",
                        text: "朝ごはん抜いた日の方が食べ過ぎてる? そんな気がする",
                    },
                    {
                        from: "ai",
                        text: "少しそうです。直近30日のうち28日を記録していて、朝食を抜いたのは6日。その日の平均は2,215 kcalで、朝食をとった22日の1,940 kcalより多く、タンパク質は約35 g少なめでした。",
                    },
                    {
                        from: "user",
                        text: "夜遅い夕食は? ジムの日は9時まで食べないんだけど",
                    },
                    {
                        from: "ai",
                        text: "そちらも目立ちます：夕食が20時以降だった9日は平均2,165 kcal、残りの19日は1,920 kcalでした。どちらも記録に見られる傾向で、それが原因だという証拠ではありません。",
                    },
                    {
                        from: "user",
                        text: "週末は?",
                    },
                    {
                        from: "ai",
                        text: "ほとんど変わりません：週末の平均は2,010 kcal、平日は1,993 kcalです。",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "お酒も記録",
                description:
                    "アルコールは、記録をオンにするまで表示されません。US標準ドリンクかUKユニットを選ぶと、どの飲み物も量と度数から純アルコールのグラム数を算出します。あとでオフにするとアルコールは再び非表示になりますが、削除はされません。",
                toolNotes: {
                    set_alcohol_tracking:
                        "アルコール記録をオンにし、グラム数とUKユニットを併記",
                    log_meal: "パイントの純アルコール量を量と度数から算出",
                },
                messages: [
                    {
                        from: "user",
                        text: "お酒も数えてくれる? ちょっと控えたくて",
                    },
                    {
                        from: "ai",
                        text: "わかりました。アルコールはUS標準ドリンクとUKユニット、どちらで表示しますか?",
                    },
                    {
                        from: "user",
                        text: "UKユニットで。マンチェスター住みだから",
                    },
                    {
                        from: "ai",
                        text: "アルコール記録をオンにしました。グラム数とUKユニットを併記します。",
                    },
                    {
                        from: "user",
                        text: "夕食でラガーを1パイント飲んだ",
                    },
                    {
                        from: "ai",
                        text: "度数はどれくらいでしたか? ラガーはだいたい4〜5%で、サーバーや缶に書いてあります。",
                    },
                    {
                        from: "user",
                        text: "たぶん4%",
                    },
                    {
                        from: "ai",
                        text: "夕食に追加して記録しました：568 mlの1パイント、度数4%で純アルコール17.9 g、2.3 UKユニット、約180 kcalです。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["ラガー、4%（1パイント、568 ml）"],
            },
            {
                id: "import-history",
                title: "履歴を引き継ぐ",
                description:
                    "MyFitnessPal、Cronometer、Lose It!、MacroFactorからの乗り換えですか? インポーターがチャット内に開き、エクスポートをブラウザ内で読み込んで対応付けます。プレビューを確認するまで何も保存されず、タイムゾーンが同じなら、同じファイルを再度インポートしても食事は重複しません。タイムゾーンが未設定なら、始める前に知らせます。",
                toolNotes: {
                    start_meal_import:
                        "エクスポートファイル用のチャット内インポーターを開く",
                    set_timezone:
                        "America/Chicagoに設定し、食事を現地時刻で記録",
                },
                messages: [
                    {
                        from: "user",
                        text: "myfitnesspalから乗り換え中。食事記録を移せる? エクスポートはある",
                    },
                    {
                        from: "ai",
                        text: "下にインポーターを開きました。ファイルを選ぶ前にひとつ：アカウントにタイムゾーンが設定されていないため、時刻がUTCとして読み込まれてしまいます。どちらにお住まいですか?",
                    },
                    {
                        from: "user",
                        text: "シカゴ",
                    },
                    {
                        from: "ai",
                        text: "America/Chicagoに設定しました。では、MyFitnessPalのエクスポートからNutrition-SummaryのCSVを選んでください。ファイルはブラウザ内で直接読み込まれ、プレビューを確認するまで何も保存されません。",
                    },
                    {
                        from: "user",
                        text: "列は対応付けされたけど、食品名が（このファイルにはありません）になってる?",
                    },
                    {
                        from: "ai",
                        text: "MyFitnessPalではそれが普通です：エクスポートは1日の食事ごとに1行で、合計値はあっても食品名がありません。代わりに各食事は食事の種類でラベル付けされ、カロリーと主要栄養素はそのまま残ります。",
                    },
                    {
                        from: "user",
                        text: "603件だって。正午で登録されるって書いてあるけど?",
                    },
                    {
                        from: "ai",
                        text: "そのとおりです。エクスポートには日付はあっても食事の時刻がないので、それぞれ現地時間の正午に置かれます。これでどの食事もシカゴ時間で正しい日に入ります。実際に食べた時刻がわからなくなるだけです。",
                    },
                    {
                        from: "user",
                        text: "できた! 全部入った?",
                    },
                    {
                        from: "ai",
                        text: "全部です：603件の食事をインポートし、失敗はありません。",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "データを持ち出す",
                description:
                    "一度頼むだけで、あなたについて保存されているすべて — 食事、水分、体重の記録、目標、プロフィール設定、アカウントの記録、利用テレメトリ、アプリの接続 — を、READMEつきのCSVファイルのZIPにまとめます。タイムスタンプはあなたのタイムゾーンで記載され、meals.csvはそのままインポートし直せます。",
                toolNotes: {
                    export_all_data:
                        "8つのCSVファイルとREADMEをZIPにまとめ、60分間有効なリンクで渡す",
                },
                messages: [
                    {
                        from: "user",
                        text: "管理栄養士さんが食事記録を見たいって。スプレッドシートで出せる?",
                    },
                    {
                        from: "ai",
                        text: "どうぞ：食事1,204件、水分318件、体重64件に、目標、プロフィール設定、アカウント情報、ツールの利用テレメトリ、アプリの接続をまとめたZIPです。食事記録は中のmeals.csvで、ExcelやGoogleスプレッドシートで開けます。",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "リンクをそのまま送ればいい?",
                    },
                    {
                        from: "ai",
                        text: "ダウンロードしてファイルを送る方が安心です。リンクは60分で使えなくなりますし、リンクを持っている人なら誰でも、食事だけでなく体重やアカウント情報、設定も含めたエクスポート全体を開けてしまいます。",
                    },
                    {
                        from: "user",
                        text: "なるほど。必要になったら、あとでこれから復元できる?",
                    },
                    {
                        from: "ai",
                        text: "食事はできます。meals.csvはインポーターと同じ列名を使っているのでそのままインポートし直せ、すでに記録にある食事は認識してスキップするので、重複しません。ほかのファイルは控え用で、インポートし直すことはできません。",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "どこかで朝食、別のどこかで夕食。",
        sub: "Nutrition MCP全アカウントのライブ栄養統計 — カロリー、食事ログ、栄養素、減った体重 — 5秒ごとに更新されます。",
        liveLabel: "ライブ",
        unitGroupLabel: "単位",
        unitMetricLabel: "メートル法",
        unitImperialLabel: "ヤード・ポンド法",
        // Full-width parentheses around half-width Latin, as everywhere
        // else in this file (「カフェイン（mg）」). Each starts with its
        // button's visible text and carries the Latin symbol (see the note
        // on the field in src/copy/index.ts).
        unitKgLabel: "メートル法（kg）",
        unitLbLabel: "ヤード・ポンド法（lb）",
        refreshBefore: "5秒ごとに更新 · 次の更新まで",
        refreshAfter: "秒",
        sinceOpenLabel: "このページを開いてから",
        calCaption: "記録されたカロリー",
        cards: {
            foodLogs: "食事ログ",
            protein: "記録されたタンパク質",
            carbs: "記録された炭水化物",
            fat: "記録された脂質",
            weightLost: "2026年7月2日からの減量",
            water: "記録された水分",
        },
        foodLogsUnit: { one: "件", other: "件" },
        timezonesAfter:
            "か所のタイムゾーン · 日付はそれぞれの現地時間の深夜0時に切り替わります",
        mapNote: "点の大きさ = プロフィールの割合",
        mapAriaLabel:
            "プロフィールに設定されたタイムゾーンの世界地図。3件以上のプロフィールで使われているタイムゾーンのみを表示",
        foot: "全アカウントの合計値で、食事が記録されるたびに更新されます。個人のデータが表示されることはありません。",
    },

    features: {
        title: "記録できること",
        cards: [
            {
                title: "自然な言葉で食事記録",
                body: "食べたものを説明するだけで、AIがカロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、カフェイン（mg）を推定して記録します。",
            },
            {
                title: "バーコードをスキャン",
                body: "商品のバーコードを撮影または入力すると、Open Food Factsから栄養素・食物繊維・糖類を取得し、食べた量に合わせて調整します。",
            },
            {
                title: "目標と進捗",
                body: "1日あたりのカロリー・栄養素・食物繊維・水分の目標を設定し、糖類・カフェイン・アルコールの上限も決められます。進捗はリアルタイムで確認できます。",
            },
            {
                title: "サマリーとトレンド",
                body: "日次・週次の内訳、7/14/30日間のトレンド、連続記録日数、よく食べるパターンを確認できます。",
            },
            {
                title: "水分記録",
                body: "食事と合わせて水分摂取量（ml）を記録し、日ごとに振り返れます。",
            },
            {
                title: "体重管理",
                body: "体重をkgまたはlbで記録し、7/14/30日間のトレンドを確認して、目標体重への進捗を追跡できます。",
            },
            {
                title: "タイムゾーン対応",
                body: "世界のどこにいても、現地時間で日付が切り替わります。",
            },
            {
                title: "他のアプリからインポート",
                body: "MyFitnessPal、Cronometer、Lose It!、MacroFactorから食事履歴を持ち込めます — その他のCSVでも列を自分で対応付ければ利用できます。保存する前に、追加内容を確認できます。",
            },
            {
                title: "エクスポートしてデータを所有",
                body: "食事、水分、体重、目標、プロフィールに加え、アカウントの記録、利用テレメトリ、接続中のアプリまで、当社があなたについて保存しているすべてのデータをCSVファイルのZIPとして取得できます。現時点で再インポートできるのは食事のみです。アカウントとデータはいつでも削除できます。",
            },
        ],
    },

    why: {
        title: "タップより、話す方が早い。",
        sub: "バーコードを撮るか、食べたものを話すだけ — データベースを探し回る必要も、別のアプリを開く必要もありません。",
        oldHeading: "従来のアプリ",
        oldItems: [
            "食品ごとにデータベースを検索",
            "間違ったデータを手作業で修正",
            "また開くアプリが増え、有料のことも多い",
            "面倒な手入力",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "自然な言葉で食事を説明するだけ",
            "カロリーと栄養素を自動で推定",
            "ClaudeやChatGPT内で無料で使える",
            "トレンド・サマリー・目標もすぐ聞ける",
        ],
        noteHtml:
            '特定のアプリから乗り換えを検討中ですか? Nutrition MCPが<a href="/alternatives" data-link="alternatives">MyFitnessPal、Cronometerなど他のトラッカー</a>とどう違うかご覧ください。',
    },

    trust: [
        {
            label: "デフォルトで非公開",
            small: "販売・共有・広告利用は一切しません。",
        },
        {
            label: "オープンソース",
            small: "コードを確認したり、自分でホストしたりできます。",
        },
        {
            label: "いつでもエクスポート",
            small: "保存している全データを、CSVで1つのZIPに。",
        },
        {
            label: "即座に削除",
            small: "アカウントとデータを削除できます。",
        },
    ],

    support: {
        title: "運営を支えてください。",
        sub: "Nutrition MCPは無料・広告なしです。サーバーとデータベースの費用はPatreonでまかなっています。",
        updatesTitle: "Patreonの最新情報",
        updatesBadge: "無料",
        updatesNote: "無料で読めます — メンバー登録は不要です。",
        updatesPrevLabel: "前の投稿",
        updatesNextLabel: "次の投稿",
        updatesDotLabel: "投稿",
        postLinkLabel: "Patreonで読む",
        free: {
            tier: "無料メンバー",
            price: "$0",
            desc: "フォローして最新情報をチェック — サーバー、新しいツール、今後の予定についてのニュースが届きます。",
            cta: "Patreonでフォロー",
        },
        paid: {
            tier: "有料メンバー",
            price: "任意の金額で支援",
            desc: "ホスティングとデータベースの費用を支援できます。支援は購入ではなく贈与です — 解放される機能はなく、すべて誰でも無料のまま使えます。",
            cta: "支援者になる",
        },
    },

    cta: {
        title: "1分足らずで記録を始めよう。",
        sub: "無料でオープンソース — すでに使っているAIでそのまま使えます。",
        primary: "かんたん導入",
        secondary: "GitHubでStar",
    },

    contact: {
        title: "質問やフィードバックはありますか?",
        sub: "バグを見つけた、機能の要望がある、質問がある — どんなことでも直接メールしてください。すべてのメッセージに目を通しています。",
        cta: "メールを送る",
    },

    faqSection: {
        title: "よくある質問",
    },
    faq: [
        {
            question: "Nutrition MCPとは?",
            visibleHtml:
                "Nutrition MCPは、Claude、ChatGPTなどのMCPクライアントをカロリー計算・PFC管理ツールに変える、無料・オープンソースのModel Context Protocol（MCP）サーバーです。食品データベースを検索する代わりに、AIに食べたものを伝えるだけで、カロリー、PFC（タンパク質・脂質・炭水化物）、食物繊維、糖類、カフェインがあなた専用の食事記録に保存されます。",
        },
        {
            question: "Model Context Protocol（MCP）とは?",
            visibleHtml:
                "Model Context Protocolは、ClaudeやChatGPTのようなAIアシスタントが外部のツールやデータソースに接続できるようにするオープンな標準規格です。MCPサーバーは特定の機能（ここでは栄養管理）を提供し、AIは会話の中でそれを利用できます。AIアシスタント向けのプラグインシステムのようなものだと考えてください。",
        },
        {
            question: "ClaudeやChatGPTでカロリー計算するには?",
            visibleHtml:
                "Nutrition MCPを一度接続して — Claudeではコネクタディレクトリから、ChatGPTではサーバーURLを使ったカスタムアプリとして — サインインします。あとは食べたものをふだんの言葉で伝えるか、食事の写真を見せるか、商品のバーコードを伝えるだけ。AIがカロリー、タンパク質、炭水化物、脂質、食物繊維、糖類を推定し、Nutrition MCPがあなたの食事記録に保存します。今日の合計、週ごとの傾向、目標への進捗はいつでも聞けます。",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "ChatGPTでも使えますか?",
            visibleHtml:
                "はい。ChatGPT（Web版）で設定 → アプリを開き、サーバーURLを使ってOAuthでカスタムアプリを作成し、サインインしてください。カスタムアプリの作成にはChatGPTの開発者モードが必要で、OpenAIはこれを一部のChatGPTプランで提供しています。",
            jsonLdText:
                "はい。ChatGPT（Web版）で設定 → アプリを開き、サーバーURL https://nutrition-mcp.com/mcp を使ってOAuthでカスタムアプリを作成し、サインインしてください。カスタムアプリの作成にはChatGPTの開発者モードが必要で、OpenAIはこれを一部のChatGPTプランで提供しています。",
        },
        {
            question: "他にどのクライアントに対応していますか?",
            visibleHtml:
                "OAuth 2.0（PKCE対応）をサポートするMCPクライアントであれば利用できます — Claude.ai、Claudeのデスクトップ・モバイルアプリ、Claude Code、Cursor、Windsurf、VS Codeなど。",
        },
        {
            question: "セルフホストできますか?",
            visibleHtml:
                'はい。Nutrition MCPはオープンソース（MITライセンス）です。独自のSupabaseプロジェクトで自分のインスタンスを運用できます — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHubリポジトリ</a>には、詳しいセルフホスティングガイドとDockerfileが含まれています。',
        },
        {
            question: "Nutrition MCPは無料ですか?",
            visibleHtml:
                "はい、完全に無料です — 有料プランも広告も隠れた費用もありません。必要なのは、ClaudeやChatGPTなどMCPコネクタに対応したAIアプリと、初回接続時に作成する無料のNutrition MCPアカウントだけです。Patreonでの任意の寄付がサーバー費用を支えていますが、寄付で解放される機能はありません。",
        },
        {
            question: "何を記録できますか?",
            visibleHtml:
                "カロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、水分をすべての記録について確認できます — 自然な言葉で説明するか、Open Food Facts経由で商品バーコードから取得します。カフェインもすべての表示ラベルで使われる単位、ミリグラムで記録され、カロリーには加算されません。アルコールも純アルコール量（グラム）で記録でき、アルコール記録をオンにすると表示されます。体重もkgまたはlbで記録し、目標体重へのトレンドを追跡できます。日次サマリーの表示、期間指定での食事の検索、過去の記録の更新・削除、目標の設定、時系列でのトレンドの確認も可能です。",
        },
        {
            question: "カロリー計算はどのくらい正確ですか?",
            visibleHtml:
                "数値は推定値です。説明や写真で記録した食事はAIが数値を推定し、バーコードの場合はOpen Food Factsにある商品の表示データを、食べた量に合わせてAIが換算します。どちらも誤りがありうるので、大事な数値は確認してください — どの記録も、頼むだけで修正・削除できます。Nutrition MCPは記録ツールであり、医療・食事に関するアドバイスではありません。健康に関する判断を下す前には、特に妊娠中の方、持病のある方、摂食障害の既往がある方は、医師または管理栄養士に相談してください。",
        },
        {
            question: "アルコールも記録できますか?",
            visibleHtml:
                "はい、オプトイン方式です。アルコール記録はデフォルトでオフで、オンにするまでアルコールは食事・目標・サマリーに表示されません。オンにすると、飲み物は純アルコール量（グラム）と、お好みでUS標準ドリンクまたはUKユニットで表示されます。AIが勝手にアルコールを推測することはありません。記録した飲み物か、インポートしたファイルのアルコール列からのみ記録され、記録した飲み物は記録がオフの間も保存されます。再びオフにするとアルコールは再び非表示になり、インポート時もアルコール列を読み込まなくなります — 削除のスイッチではなく、エクスポートには常に記録した内容が含まれます。アルコールの数値を消すには、それを含む食事を削除してください。",
        },
        {
            question:
                "MyFitnessPalなど他のアプリから履歴をインポートできますか?",
            visibleHtml:
                "はい。履歴のインポートを依頼すると、チャット内にインポーターが開きます。以前のアプリがエクスポートしたCSVを選び、列の対応付けを確認し、追加される内容を確認してから確定できます。MyFitnessPal、Cronometer、Lose It!、MacroFactorのエクスポートは自動的に認識され、その他のCSVも列を自分で対応付ければ利用できます。ファイルを読み込むのはブラウザなので、AIが行を書き写すことはありません。チャット内パネルに対応していないクライアントでは、エクスポートを貼り付けることもできます。タイムゾーンを変更していなければ、同じファイルを再度インポートしても重複は作成されません。",
        },
        {
            question: "データはプライベートに保たれますか?",
            visibleHtml:
                '記録はEU域内に保存され、あなた自身のアカウントに紐づけられます。アカウントには、接続したAIアプリを通じてアクセスします。Nutrition MCPがデータを販売することも、第三者と共有することも、広告に利用することも一切ありません。ホームページに表示されるのは、サイト全体の匿名の合計値だけです。AIがツールを通じて読み取った内容は、あなたとそのAIの提供者との契約に基づいて、提供者に送信されます。当社が保存しているすべてのデータのエクスポートや、アカウントとすべてのデータの削除はいつでも可能です — 詳しくは<a href="/privacy" data-link="privacy">プライバシーポリシー</a>をご覧ください。',
        },
    ],
};

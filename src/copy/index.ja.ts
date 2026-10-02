// Japanese (ja) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means, which fields carry trusted HTML, and which fields of the
// demo conversations are structure (copied verbatim) rather than copy.
//
// NOTE on sugar: this prose says 糖類 (total sugars). 糖質 means net
// carbohydrate in Japanese labelling, so it would be a meaning error here; if
// the in-chat widget strings (src/copy/widgets.ja.ts, not this file) still
// label the sugar tile 糖質, that label is the widget copy's to change.
//
// Terminology follows .git/nm-i18n/glossary-ja.md: macros → PFC (first
// mention spelled out in the FAQ), protein → タンパク質, carbs → 炭水化物,
// fat → 脂質, fiber → 食物繊維, (total) sugar → 糖類 / 総糖類,
// alcohol → アルコール（純アルコール量）, caffeine → カフェイン, meal → 食事,
// water → 水分, goals/target → 目標, limit → 上限, timezone → タイムゾーン,
// export → エクスポート, trends → トレンド, sign-in → サインイン,
// examples → 使用例. Plain です/ます register in the prose; the user's side
// of the demo chats is casual, as people actually type. Link/button labels
// use plain/dictionary form. No 「当社」: the service is run by one person,
// so "we store" reads as 「保存している」 with the subject dropped. Proper
// nouns stay in Latin script. Numbers stay half-width with the same comma
// thousands-separator and a half-width space before Latin units ("2,000",
// "480 kcal", "21 g"), so every figure the cards draw is quoted
// byte-identically. ？ and ！ are full-width, followed by a full-width space
// when another sentence follows in the same string.
//
// Three spacing fields deliberately differ from the English contract:
// `onboarding.justSay` ends in a full-width colon instead of a trailing
// space, and `stats.refreshBefore` / `stats.timezonesAfter` carry no space
// next to the number — Japanese sets no space between a numeral and the
// counter/particle around it (「12か所のタイムゾーン」), so the English
// pattern would render a stray gap beside the <b>{n}</b>.

import type { IndexDoc } from "./index.js";

export const INDEX_JA: IndexDoc = {
    title: "Nutrition MCP — ClaudeとChatGPTでカロリー計算・PFC管理",
    metaDescription:
        "ClaudeやChatGPTに話しかけるだけで、食事記録・カロリー計算・PFC管理。バーコード検索、体重管理、全データのエクスポートに対応した、無料・オープンソースのMCPサーバーです。",
    ogDescription:
        "ClaudeやChatGPTに話しかけるだけで、食事記録・カロリー計算・PFC管理。バーコード検索、体重管理、全データのエクスポートに対応した、無料・オープンソースのMCPサーバーです。",
    keywords:
        "栄養トラッカー, 食事記録, MCPサーバー, Claude AI, ChatGPT, カロリー計算, PFC管理, バーコード検索, 食事ログ, ダイエット管理, 体重トラッカー, 体重記録, AI栄養管理, レコーディングダイエット, Model Context Protocol",

    hero: {
        titleBeforeEm: "AIに",
        titleEm: "話しかける",
        titleAfterEm: "だけで栄養管理。",
        lead: "ClaudeかChatGPTを接続して、食べたものを伝えるだけ。カロリーとPFCが自動で記録されます。",
        ctaPrimary: "かんたん導入",
        ctaSecondary: "応援する",
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
                    aiText: "スムージーボウルですね。手作りのようです。これまでは、グラノーラとはちみつをのせたものと、フルーツだけのものの2通りがありました。今回はどちらですか？",
                },
                {
                    userText: "グラノーラとはちみつ。スプーンたっぷり1杯",
                    aiText: "わかりました。アメリカーノはシングルですか、ダブルですか？　ミルクは入れましたか？",
                },
                {
                    userText: "ダブル。オーツミルクをちょっとだけ",
                    aiText: "では、グラノーラ1つかみとはちみつ大さじ1のボウルと、オーツミルクを少し入れたダブルのアメリカーノですね。約480 kcal、タンパク質21 gです。記録しますか？",
                },
                {
                    userText: "うん",
                    aiText: "朝食を記録しました：480 kcal、タンパク質21 g、カフェイン126 mg。糖類はもう上限60 gのうち51 gです。",
                    card: "meal-logged",
                    meal: {
                        description:
                            "グラノーラ（1つかみ）とはちみつ（大さじ1）をのせたスムージーボウル（1杯：ギリシャヨーグルト、バナナ、ベリー）、オーツミルク少量入りのアメリカーノ（ダブル）",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "昼ごはんは昨日の夜の残りの炒め物、量は同じで。あと500 mlの水を1本",
                    aiText: "昼食を記録しました。昨夜と同じ620 kcal、タンパク質54 gで、水500 mlも追加しています。",
                    meal: {
                        description: "残りものの炒め物（1人前、昨夜と同じ量）",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "間食：子どものポテト6本つまんじゃった。何も言わないで",
                    aiText: "何も言いませんよ。約50 kcal、間食として記録しました。",
                    meal: {
                        description: "フライドポテト（6本、子どもの皿から）",
                        type: "snack",
                    },
                },
                {
                    userText: "夕飯、あとどれくらい食べられる？",
                    aiText: "残りは850 kcal、タンパク質はあと84 gです。糖類は上限60 gのうち、もう59 gです。",
                    card: "nutrition-summary",
                },
                {
                    userText: "あと、体重はどんな感じ？",
                    aiText: "2月11日から1.4 kg減って、80.2 kgから78.8 kgになりました。目標の75 kgまであと3.8 kgです。",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "たった3ステップ。新しいアプリを覚える必要はありません。",
        steps: [
            {
                title: "一度接続するだけ",
                body: "ClaudeやChatGPTをはじめ、リモートMCPサーバーに対応したAIクライアントならどれでも使えます。インストールもAPIキーも不要です。",
            },
            {
                title: "食べたものを話すだけ",
                body: "ふだんの言葉で説明するだけ。食事の写真、デリバリーアプリのスクリーンショット、バーコード（商品はオンラインで検索します）を送ってもOKです。PFCは自動で記録されます。",
            },
            {
                title: "記録して振り返る",
                body: "日ごとのサマリー、週ごとのトレンド、目標の進捗を聞いたり、記録したすべてをCSVファイルでエクスポートしたりできます。すべて無料です。",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "1分足らずで接続完了",
        sub: "OAuth 2.0（PKCE）に対応したMCPクライアントならどれでも使えます。初回接続時にGoogleかメールアドレスとパスワードでアカウントを作成します。次回以降も同じ方法でサインインすれば、データはそのまま引き継がれます。",
        copyAriaLabel: "サーバーURLをコピー",
        tabsLabel: "AIクライアントを選択",
        claude: {
            cta: "Claudeに追加",
            steps: [
                "ディレクトリのページで<strong>接続</strong>をクリックし、Googleで続行するか、メールアドレスとパスワードでサインインします。",
                "完了です。すぐに使えて、iOS・Androidアプリにも自動で反映されます。",
            ],
            note: "無料プランを含め、すべてのClaudeプランで使えます。手動で追加する場合は、「カスタマイズ」→「コネクタ」→「カスタムコネクタを追加」で https://nutrition-mcp.com/mcp を追加してください。",
        },
        chatgpt: {
            steps: [
                "<strong>ChatGPT（Web版）</strong>を開き、<strong>設定</strong> → <strong>アプリ</strong>に進みます。",
                "ポップアップ下部の<strong>アプリを作成</strong>をクリックします。表示されない場合は、<strong>詳細設定</strong>で<strong>開発者モード</strong>をオンにしてください。",
                "名前を付けます（例：<strong>Nutrition</strong>）。",
                "<strong>Connection</strong>に<code>https://nutrition-mcp.com/mcp</code>を貼り付けます。",
                "<strong>Authentication</strong>で<strong>OAuth</strong>を選び、ほかの項目はそのままにします。",
                '<strong>"I understand and want to continue"</strong>にチェックを入れます。',
                "<strong>作成</strong>をクリックします。",
                "<strong>Nutritionでサインイン</strong>をクリックするとサインインページが開くので、Googleで続行するか、メールアドレスとパスワードでサインインします。",
                "完了です。すぐに使えて、iOS・Androidアプリにも自動で反映されます。",
            ],
        },
        other: {
            note: "上の設定を、お使いのクライアント（Cursor、VS Code、Claude Codeなど）に追加してください。Windsurfでは<code>url</code>の代わりに<code>serverUrl</code>を使います。Claude Codeでは<code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>を実行します。OAuthのサインインはクライアントが自動で処理します。",
        },
        otherTabLabel: "その他のエージェント",
    },

    onboarding: {
        title: "最初に設定しておくか、すぐに話し始めるか",
        sub: "設定はまったくの任意で、Nutrition MCPは接続したその瞬間から使えます。お好みで次の3つの簡単なステップを済ませればより正確になりますが、飛ばしてすぐに記録を始めてもかまいません。",
        justSay: "こう言うだけ：",
        steps: [
            {
                title: "タイムゾーンを設定",
                body: "現地時間の深夜0時に日付が切り替わるので、どこにいても今日の合計が正確になります。",
                say: "タイムゾーンをニューヨークに設定して",
            },
            {
                title: "目標を設定",
                body: "1日のカロリー・PFC・水分の目標に加え、必要なら目標体重と体重の単位（kgまたはlb）も設定して、進捗を確認できます。",
                say: "1日の目標をカロリー2,000、タンパク質150 gにして",
            },
            {
                title: "言語を設定",
                body: "チャット内ウィジェット（ダッシュボードやグラフ）の表示言語です。AIの返答の言語は変わりません。",
                say: "ウィジェットをドイツ語で表示して",
            },
            {
                title: "記録を始める",
                body: "食べたものを話すか、写真を送るか、バーコードをスキャンするだけ。これだけです。",
                say: "朝ごはんにベリー入りのオートミールを食べた",
            },
        ],
        note: "どれも任意です。今すぐでも、後からでも、設定しなくてもかまいません。まずは記録を始めて、好きなときに設定してください。",
        toolsCta: {
            heading: "実際に何ができるのか気になりますか？",
            body: "記録、バーコード、水分、体重、目標、トレンドなど、全36個のツールをそれぞれの説明とプロンプト例つきで紹介しています。",
            arrow: "ツールを見る",
        },
    },

    examples: {
        title: "話しかけるだけ。",
        sub: "話しかけるだけでできることを、いくつか紹介します。",
        prevLabel: "前の例",
        nextLabel: "次の例",
        pickerLabel: "例を選択",
        carouselLabel: "使用例",
        carouselRoleDescription: "カルーセル",
        threadLabel: "会話",
        moreToolsLabel: "あわせて使うツール",
        toolLinkLabel: "ツールページの{tool}（新しいタブで開きます）",
        photoMealAlt:
            "写真：サワークリームとディルをのせたボルシチと、横に添えたライ麦パン1枚",
        photoPackageAlt:
            "写真：プレーンのギリシャヨーグルトのカップのバーコード、番号2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "ふだんの言葉で記録",
                description:
                    "友だちに話すように伝えるだけ。量やどの食事かが抜けていれば、推定する前に確認します。食物繊維と糖類はすべての記録に、カフェインは含まれるものだけに付き、「7時ごろ」はあなたのタイムゾーンの07:00として記録されます。",
                toolNotes: {
                    log_meal:
                        "PFC、食物繊維、糖類、コーヒーのカフェインを含めて朝食を保存",
                    log_water: "07:00の500 mlを今日の水分合計に記録",
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
                        text: "器の大きさはどのくらいで、オートミールは牛乳と水のどちらで作りましたか？　コーヒーには何か入れましたか？",
                    },
                    {
                        from: "user",
                        text: "普通サイズ、牛乳で。コーヒーはブラック",
                    },
                    {
                        from: "ai",
                        text: "朝食を記録しました：約320 kcal、タンパク質11 g、食物繊維6 g。コーヒーで、カフェインは上限400 mgのうち95 mgになりました。",
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
                        after: 2,
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
                    "写真は推測ではなく、会話のきっかけです。手作りか外食かを確かめ、写真ではわからないことは過去の記録から探し、食べた量を身近な単位でたずねます。記録するのは、まとめを承認してからです。",
                toolNotes: {
                    search_meals:
                        "以前Tsybulyaで記録したボルシチと、その中身を探す",
                    log_meal: "OKをもらってから、お店の名前つきで記録",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "お昼",
                    },
                    {
                        from: "ai",
                        text: "サワークリームを添えたボルシチと、ライ麦パン1枚のようですね。手作りですか、それとも外食ですか？　お店なら、どちらのお店ですか？",
                    },
                    {
                        from: "user",
                        text: "キーウのポジールにあるTsybulya",
                    },
                    {
                        from: "ai",
                        text: "Tsybulyaのボルシチは以前に2回記録していて、どちらも牛肉のボルシチにサワークリームとライ麦パン1枚で、約520 kcalでした。今回も同じですか？　ボルシチとパンは全部食べましたか？",
                    },
                    {
                        from: "user",
                        text: "同じやつ。全部食べた、パンも",
                    },
                    {
                        from: "ai",
                        text: "では、キーウ・ポジールのTsybulyaで、サワークリームを添えた牛肉のボルシチ（1杯、完食）とライ麦パン（1枚）ですね。前回と同じく約520 kcal、タンパク質24 gで、公表値ではなく推定値です。記録しますか？",
                    },
                    {
                        from: "user",
                        text: "うん",
                    },
                    {
                        from: "ai",
                        text: "記録しました。今日は2,000 kcalのうち520 kcalで、残りは1,480 kcalです。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
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
                    "パッケージを撮影すると、バーコードの下の数字をOpen Food Factsで検索し、どれだけ口にしたかをたずねます。Open Food Factsにはカフェインの情報がないため、カフェインはラベルや一般的な含有量から補います。食物繊維や糖類の数値が欠けている場合も、空欄にせず推定します。",
                toolNotes: {
                    lookup_barcode:
                        "カップのラベルの数値とNutri-ScoreをOpen Food Factsから取得",
                    log_meal:
                        "カップ1個分を、100 gあたりの値から換算して朝食として記録",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "朝ごはんに食べた。これって体にいい？",
                    },
                    {
                        from: "ai",
                        text: "プレーンのギリシャヨーグルト（無脂肪）150 gカップですね。87 kcal、タンパク質15 g、糖類5 gで、Open Food Factsの評価はNutri-Score Aです。1カップまるごと食べましたか？",
                    },
                    {
                        from: "user",
                        text: "1カップ全部",
                    },
                    {
                        from: "ai",
                        text: "朝食として記録しました：87 kcal、タンパク質15 g、糖類5 g。今日のタンパク質の目標まで、あと145 gです。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["プレーンギリシャヨーグルト 無脂肪（150 gカップ）"],
            },
            {
                id: "goals-progress",
                title: "目標を決めて確認",
                description:
                    "カロリーやタンパク質のように達成したい目標と、糖類・アルコール・カフェインのように超えたくない上限を設定できます。変わるのは伝えた項目だけです。あとはどの日のことでも聞けば、各目標まであとどれだけか、各上限に対して今どのくらいかがわかります。",
                toolNotes: {
                    set_nutrition_goals:
                        "カロリーとタンパク質の目標、カフェイン上限400 mgを保存",
                    get_goal_progress:
                        "今日の状況を各目標・上限と比べ、チャット内のカードに表示",
                },
                messages: [
                    {
                        from: "user",
                        text: "ちょっと絞りたい。2000 kcalとタンパク質160 gに設定して。あとカフェインの上限ってどれくらいが妥当？　ほぼコーヒーで生きてる",
                    },
                    {
                        from: "ai",
                        text: "健康な成人なら、EFSAとFDAはいずれも1日400 mgまでとしています。ドリップコーヒー約4杯分です。妊娠中については、EFSAは200 mgまでとしています。上限はご自身で決められますが、400 mgにしますか？",
                    },
                    {
                        from: "user",
                        text: "うん、400で",
                    },
                    {
                        from: "ai",
                        text: "設定しました：目標は2,000 kcalとタンパク質160 g、カフェインの上限は400 mgです。ほかはそのままです：炭水化物220 g、脂質70 g、食物繊維30 g、水分2.5 L、糖類の上限60 g、目標体重75 kg。",
                    },
                    {
                        from: "user",
                        text: "今夜まだデザート食べられる？",
                    },
                    {
                        from: "ai",
                        text: "今は2,000 kcalのうち1,540 kcal、タンパク質は160 gのうち104 gなので、残りは460 kcalとタンパク質56 gです。糖類は上限60 gのうち40 g、カフェインは400 mgのうち130 mgで、どちらも上限内です。",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "1週間を振り返る",
                description:
                    "1週間の調子を聞くと、カロリーとPFCの平均を目標と比べ、記録した日数もまとめたトレンドカードがチャット内に開きます。7日・14日・30日の切り替えは、改めて頼まなくてもできます。連続記録日数や目標を達成した日数も答えられます。",
                toolNotes: {
                    get_trends:
                        "直近7日・14日・30日の平均を出し、トレンドカードを開く",
                },
                messages: [
                    {
                        from: "user",
                        text: "この2週間どうだった？　なんかバラバラだった気がする",
                    },
                    {
                        from: "ai",
                        text: "14日のうち13日を記録していて、直近10日は連続です。記録した日のうち9日は、目標の2,000 kcalから±10%以内に収まりました。1日平均は1,830 kcalですが、これは記録しなかった1日を0として数えた値です。",
                    },
                    {
                        from: "user",
                        text: "糖類は？",
                    },
                    {
                        from: "ai",
                        text: "平均は1日52 gで上限の60 gを下回っていますが、13日のうち4日は上限を超えました。",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "体重を記録",
                description:
                    "体重をkgかlbで記録すると、日々の増減に埋もれたトレンドが見えてきます。平滑化した平均、1か月の変化、目標までの差を表示。小数点の打ち忘れのようなありえない値は、保存する前にはじきます。",
                toolNotes: {
                    log_weight: "今朝の体重78.4 kgを記録",
                    get_weight_trends:
                        "30日分を移動平均で平滑化し、目標までの差を算出",
                },
                messages: [
                    { from: "user", text: "今朝は78.4 kgでした。推移はどう？" },
                    {
                        from: "ai",
                        text: "78.4 kgを記録しました。2月11日（80.2 kg）から1.8 kg減で、7日間平均は78.7 kgです。目標の75 kgまであと3.4 kgです。",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "自分の傾向を知る",
                description:
                    "どんなときに多く食べているかを聞くと、自分の記録同士を比べます：平日と週末、朝食をとった日と抜いた日、量の多い昼食、早めの夕食と遅めの夕食。いつもと違う日も知らせますが、伝えるのは原因ではなく傾向です。",
                toolNotes: {
                    get_meal_patterns:
                        "30日分で、朝食の有無・夕食の時間・週末を比較",
                },
                messages: [
                    {
                        from: "user",
                        text: "朝ごはん抜いた日の方が食べ過ぎてる？　そんな気がする",
                    },
                    {
                        from: "ai",
                        text: "少しだけ多いです。直近30日のうち28日を記録していて、朝食を抜いたのは6日。その6日間の平均は2,215 kcal、タンパク質88 gで、朝食をとった22日は1,940 kcal、123 gでした。",
                    },
                    {
                        from: "user",
                        text: "夜遅い夕食は？　ジムの日は9時まで食べないんだけど",
                    },
                    {
                        from: "ai",
                        text: "そちらも目立ちます：夕食が20時以降だった9日は平均2,165 kcal、残りの19日は1,920 kcalでした。どちらも記録に見られる傾向で、どちらかが原因だという証拠ではありません。",
                    },
                    {
                        from: "user",
                        text: "週末は？",
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
                    "アルコールは、記録をオンにするまで表示されません。US標準ドリンクかUKユニットを選ぶと、どの飲み物も量と度数から純アルコール量（g）を計算します。あとでオフにするとアルコールはまた非表示になりますが、削除はされません。",
                toolNotes: {
                    set_alcohol_tracking:
                        "アルコール記録をオンにし、グラム数とUKユニットを併記",
                    log_meal:
                        "パイントのアルコールを純アルコール量（g）で記録（568 ml × 4% × 0.789）",
                },
                messages: [
                    {
                        from: "user",
                        text: "お酒も数えてくれる？　ちょっと控えたくて",
                    },
                    {
                        from: "ai",
                        text: "わかりました。アルコールはUS標準ドリンクとUKユニットのどちらで表示しますか？",
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
                        text: "度数はどれくらいでしたか？　ラガーはたいてい4〜5%で、ビールサーバーや缶に書いてあります。",
                    },
                    {
                        from: "user",
                        text: "たぶん4%",
                    },
                    {
                        from: "ai",
                        text: "夕食として記録しました：1パイント568 ml、度数4%で純アルコール17.9 g、2.3 UKユニット、約180 kcalです。",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["ラガー、4%（1パイント、568 ml）"],
            },
            {
                id: "import-history",
                title: "履歴を引き継ぐ",
                description:
                    "MyFitnessPal、Cronometer、Lose It!、MacroFactorから乗り換えますか？　チャット内でインポーターが開き、エクスポートしたファイルをブラウザ内で読み込んで列を対応付けます。プレビューを確定するまで何も保存されず、タイムゾーンが同じなら、同じファイルをもう一度インポートしても食事は重複しません。タイムゾーンが未設定なら先にそれを済ませるので、どの食事も正しい日付に入ります。",
                toolNotes: {
                    get_profile:
                        "アカウントにタイムゾーンがまだ設定されていないことを表示",
                    set_timezone:
                        "America/Chicagoに設定し、食事を現地時間で記録",
                    start_meal_import:
                        "エクスポートファイル用のインポーターをチャット内に開く",
                    bulk_import_meals:
                        "確定した行を最大50件ずつ保存し、取り込み済みの行はスキップ",
                },
                messages: [
                    {
                        from: "user",
                        text: "myfitnesspalから乗り換え中。食事記録を移せる？　エクスポートはある",
                    },
                    {
                        from: "ai",
                        text: "インポーターを開く前にひとつ：アカウントにタイムゾーンが設定されていないので、エクスポートの日付がUTCとして読み込まれ、食事が別の日に入ってしまうおそれがあります。先に設定しますか？　どのタイムゾーンにお住まいですか？",
                    },
                    {
                        from: "user",
                        text: "シカゴ",
                    },
                    {
                        from: "ai",
                        text: "タイムゾーンをAmerica/Chicagoに設定し、上にインポーターを開きました。そこでMyFitnessPalのエクスポートファイルを選んでください。ファイルはブラウザ内で読み込まれ、プレビューを確定するまで何も保存されません。",
                    },
                    {
                        from: "user",
                        text: "列は対応付けしてくれたけど、食品名が「このファイルにはありません」になってる？",
                    },
                    {
                        from: "ai",
                        text: "MyFitnessPalならそれで正常です。エクスポートは1日の食事ごとに1行で、合計値はあっても食品名がありません。食品名のない行には取り込み元のアプリ名がラベルとして付き、カロリーとPFCはそのまま取り込まれます。",
                    },
                    {
                        from: "user",
                        text: "603件だって。正午で記録されるって書いてあるけど？",
                    },
                    {
                        from: "ai",
                        text: "そのとおりです。エクスポートには日付はあっても食事の時刻がないので、それぞれ現地時間の正午に置かれます。これでどの食事もシカゴ時間で正しい日付に入ります。わからなくなるのは、実際に食べた時刻だけです。",
                    },
                    {
                        from: "user",
                        text: "できた！　全部入った？",
                    },
                    {
                        from: "ai",
                        text: "全部入りました：603件の食事をインポートし、失敗は0件です。",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "データを持ち出す",
                description:
                    "一度頼むだけで、保存されているあなたのデータすべて（食事、水分、体重の記録、目標、プロフィール設定、アカウント情報、利用テレメトリ、アプリの接続）を、README付きのCSVファイルのZIPにまとめます。タイムスタンプはあなたのタイムゾーンで記載され、meals.csvはそのままインポートし直せます。",
                toolNotes: {
                    export_all_data:
                        "8つのCSVファイルとREADMEをZIPにまとめ、60分間有効なリンクで渡す",
                },
                messages: [
                    {
                        from: "user",
                        text: "管理栄養士さんが食事記録を見たいって。スプレッドシートで出せる？",
                    },
                    {
                        from: "ai",
                        text: "用意しました。ZIPには食事1,204件、水分318件、体重64件に加えて、栄養目標、プロフィール設定、アカウント情報、ツールの利用テレメトリ、アプリの接続が入っています。食事記録はZIP内のmeals.csvです。",
                        link: "エクスポートをダウンロード（リンクの有効期限は60分）",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "ある街では朝食、別の街ではもう夕食。",
        sub: "Nutrition MCPの全アカウントを合わせたライブ栄養統計（カロリー、食事ログ、PFC、減った体重）を、5秒ごとに更新しています。",
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
        mapNote: "点の大きさ＝プロフィールの割合",
        mapAriaLabel:
            "プロフィールに設定されたタイムゾーンの世界地図。3件以上のプロフィールで使われているタイムゾーンのみを表示",
        foot: "全アカウントの合計値で、食事が記録されるたびに更新されます。個人のデータが表示されることはありません。",
    },

    features: {
        title: "記録できること",
        cards: [
            {
                title: "ふだんの言葉で食事を記録",
                body: "食べたものを伝えるだけで、AIがカロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、カフェイン（mg）を推定して記録します。",
            },
            {
                title: "バーコードをスキャン",
                body: "商品のバーコードを撮影または入力すると、Open Food FactsからPFC・食物繊維・糖類を取得し、食べた量に合わせて換算します。",
            },
            {
                title: "目標と進捗",
                body: "1日のカロリー・PFC・食物繊維・水分の目標に加え、糖類・カフェイン・アルコールの上限も設定でき、進捗をリアルタイムで確認できます。",
            },
            {
                title: "サマリーとトレンド",
                body: "日ごと・週ごとの内訳、7/14/30日間のトレンド、連続記録日数、よく食べる食事のパターンを確認できます。",
            },
            {
                title: "水分記録",
                body: "食事と一緒に水分摂取量（ml）を記録し、日ごとに振り返れます。",
            },
            {
                title: "体重管理",
                body: "体重をkgまたはlbで記録し、7/14/30日間のトレンドを確認して、目標体重への進捗を追えます。",
            },
            {
                title: "タイムゾーン対応",
                body: "世界のどこにいても、現地時間で日付が切り替わります。",
            },
            {
                title: "他のアプリからインポート",
                body: "MyFitnessPal、Cronometer、Lose It!、MacroFactorから食事の履歴を移せます。その他のCSVも、列を自分で対応付ければ取り込めます。保存する前に、追加される内容を確認できます。",
            },
            {
                title: "データはエクスポートして手元に",
                body: "食事、水分、体重、目標、プロフィールに加え、アカウント情報、利用テレメトリ、接続中のアプリまで、保存しているあなたのデータすべてをCSVファイルのZIPひとつで受け取れます。現時点で再インポートできるのは食事だけです。アカウントとデータはいつでも削除できます。",
            },
        ],
    },

    why: {
        title: "タップより、話す方が早い。",
        sub: "バーコードを撮るか、食べたものを話すだけ。データベースを探し回る必要も、別のアプリを開く必要もありません。",
        oldHeading: "従来のアプリ",
        oldItems: [
            "食品ごとにデータベースを検索",
            "間違ったデータを手作業で修正",
            "開くアプリがまた増え、有料のことも多い",
            "面倒な手入力",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "ふだんの言葉で食事を説明するだけ",
            "カロリーとPFCを自動で推定",
            "ClaudeやChatGPTの中で無料で使える",
            "トレンド・サマリー・目標もすぐ聞ける",
        ],
        noteHtml:
            '特定のアプリからの乗り換えをお考えですか？　Nutrition MCPと<a href="/alternatives" data-link="alternatives">MyFitnessPal、Cronometerなどの記録アプリ</a>との違いをご覧ください。',
    },

    trust: [
        {
            label: "最初から非公開",
            small: "販売・共有・広告への利用は一切しません。",
        },
        {
            label: "オープンソース",
            small: "コードの確認もセルフホストもできます。",
        },
        {
            label: "いつでもエクスポート",
            small: "保存している全データを、CSVでZIPひとつに。",
        },
        {
            label: "すぐに削除",
            small: "アカウントとデータを削除できます。",
        },
    ],

    support: {
        title: "運営を応援してください。",
        sub: "Nutrition MCPは無料で、広告もありません。サーバーとデータベースの費用はPatreonでまかなっています。",
        updatesTitle: "Patreonの最新情報",
        updatesBadge: "無料",
        updatesNote: "無料で読めます。メンバー登録は不要です。",
        updatesPrevLabel: "前の投稿",
        updatesNextLabel: "次の投稿",
        updatesDotLabel: "投稿",
        postLinkLabel: "Patreonで読む",
        free: {
            tier: "無料メンバー",
            price: "$0",
            desc: "フォローすると、サーバーや新しいツール、今後の予定についてのお知らせが届きます。",
            cta: "Patreonでフォロー",
        },
        paid: {
            tier: "有料メンバー",
            price: "金額は自由",
            desc: "Nutrition MCPが役に立っていたら、ホスティングとデータベースの費用を支援していただけると嬉しいです。支援者も含めて全員が同じ機能を使え、誰でも無料のままご利用いただけます。",
            cta: "支援者になる",
        },
    },

    cta: {
        title: "1分足らずで記録を始めよう。",
        sub: "無料でオープンソース。いつものAIでそのまま使えます。",
        primary: "かんたん導入",
        secondary: "GitHubでスターを付ける",
    },

    contact: {
        title: "質問やフィードバックはありますか？",
        sub: "バグを見つけた、ほしい機能がある、ちょっと聞きたいことがある。そんなときは直接メールしてください。すべてのメッセージに目を通しています。",
        cta: "メールを送る",
    },

    faqSection: {
        title: "よくある質問",
    },
    faq: [
        {
            question: "Nutrition MCPとは？",
            visibleHtml:
                "Nutrition MCPは、Claude、ChatGPTなどのMCPクライアントをカロリー計算・PFC管理ツールに変える、無料・オープンソースのModel Context Protocol（MCP）サーバーです。食品データベースを検索する代わりに、AIに食べたものを伝えるだけで、カロリー、PFC（タンパク質・脂質・炭水化物）、食物繊維、糖類、カフェインが自分専用の食事記録に保存されます。",
        },
        {
            question: "Model Context Protocol（MCP）とは？",
            visibleHtml:
                "Model Context Protocolは、ClaudeやChatGPTのようなAIアシスタントが外部のツールやデータソースに接続するためのオープンな標準規格です。MCPサーバーは特定の機能（ここでは栄養管理）を提供し、AIは会話の中でそれを使えます。AIアシスタント向けのプラグインのような仕組みです。",
        },
        {
            question: "ClaudeやChatGPTでカロリー計算するには？",
            visibleHtml:
                "まずNutrition MCPを一度だけ接続して、サインインします。Claudeではコネクタディレクトリから、ChatGPTではサーバーURLを使ったカスタムアプリとして追加します。あとは食べたものをふだんの言葉で伝えるか、食事の写真を見せるか、商品のバーコードを伝えるだけ。AIがカロリー、タンパク質、炭水化物、脂質、食物繊維、糖類を推定し、Nutrition MCPが食事記録に保存します。今日の合計、週ごとのトレンド、目標への進捗はいつでも聞けます。",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "ChatGPTでも使えますか？",
            visibleHtml:
                "はい。ChatGPT（Web版）で「設定」→「アプリ」を開き、サーバーURLを使ってOAuthでカスタムアプリを作成し、サインインしてください。カスタムアプリの作成にはChatGPTの開発者モードが必要で、OpenAIはこれを一部のChatGPTプランで提供しています。",
            jsonLdText:
                "はい。ChatGPT（Web版）で「設定」→「アプリ」を開き、サーバーURL https://nutrition-mcp.com/mcp を使ってOAuthでカスタムアプリを作成し、サインインしてください。カスタムアプリの作成にはChatGPTの開発者モードが必要で、OpenAIはこれを一部のChatGPTプランで提供しています。",
        },
        {
            question: "ほかにどのクライアントに対応していますか？",
            visibleHtml:
                "OAuth 2.0（PKCE）に対応したMCPクライアントなら使えます。Claude.ai、Claudeのデスクトップ・モバイルアプリ、Claude Code、Cursor、Windsurf、VS Codeなどです。",
        },
        {
            question: "セルフホストできますか？",
            visibleHtml:
                'はい。Nutrition MCPはオープンソース（MITライセンス）です。自分のSupabaseプロジェクトで独自のインスタンスを運用できます。<a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHubリポジトリ</a>に、詳しいセルフホスティングガイドとDockerfileがあります。',
        },
        {
            question: "Nutrition MCPは無料ですか？",
            visibleHtml:
                "はい、完全に無料です。有料プランも広告も、隠れた費用もありません。必要なのは、ClaudeやChatGPTなどMCPコネクタに対応したAIアプリと、初回接続時に作成する無料のNutrition MCPアカウントだけです。Patreonでの任意の寄付がサーバー費用を支えていますが、寄付で使えるようになる機能はありません。",
        },
        {
            question: "何を記録できますか？",
            visibleHtml:
                "すべての記録について、カロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、水分を記録できます。ふだんの言葉で説明するか、Open Food Facts経由で商品のバーコードから取得します。カフェインも、どの栄養成分表示でも使われるミリグラム単位で記録され、カロリーには加算されません。アルコールも純アルコール量（g）で記録でき、アルコール記録をオンにすると表示されます。体重もkgまたはlbで記録し、目標体重までのトレンドを追えます。日ごとのサマリーの表示、期間を指定した食事の検索、過去の記録の修正・削除、目標の設定、長期的なトレンドの確認もできます。",
        },
        {
            question: "カロリー計算はどのくらい正確ですか？",
            visibleHtml:
                "数値は推定値です。説明や写真で記録した食事はAIが数値を推定し、バーコードの場合はOpen Food Factsにある商品の表示データを、食べた量に合わせてAIが換算します。どちらも間違うことがあるので、大事な数値は確認してください。どの記録も、頼むだけで修正・削除できます。Nutrition MCPは記録ツールであり、医療や食事のアドバイスではありません。健康に関わる判断をする前に、医師または管理栄養士に相談してください。妊娠中の方、持病のある方、摂食障害の既往がある方は特に重要です。",
        },
        {
            question: "アルコールも記録できますか？",
            visibleHtml:
                "はい、オプトイン方式です。アルコール記録はデフォルトでオフで、オンにするまでアルコールは食事・目標・サマリーに表示されません。オンにすると、飲み物は純アルコール量（g）と、US標準ドリンクかUKユニットのお好きな方で表示されます。AIがアルコールを推測して記録することはなく、記録されるのは自分で記録した飲み物か、インポートしたファイルのアルコール列だけです。記録した飲み物は、アルコール記録がオフの間も保存されます。再びオフにするとアルコールはまた非表示になり、インポーターもアルコール列を読み込まなくなります。削除のスイッチではなく、エクスポートには記録した内容が常に含まれます。アルコールの数値を消すには、その数値を含む食事を削除してください。",
        },
        {
            question:
                "MyFitnessPalなど他のアプリから履歴をインポートできますか？",
            visibleHtml:
                "はい。履歴のインポートを頼むと、チャット内にインポーターが開きます。以前のアプリから書き出したCSVを選び、列の対応付けを確認し、追加される内容を見てから確定します。MyFitnessPal、Cronometer、Lose It!、MacroFactorのエクスポートは自動で認識され、その他のCSVも列を自分で対応付ければ使えます。ファイルを読み込むのはブラウザなので、AIが行を書き写すことはありません。チャット内パネルに対応していないクライアントでは、エクスポートを貼り付けることもできます。また、途中でタイムゾーンを変えていなければ、同じファイルをもう一度インポートしても重複は作られません。",
        },
        {
            question: "データはプライベートに保たれますか？",
            visibleHtml:
                '記録はEU域内に保存され、ご自身のアカウントに紐づきます。アカウントには、接続したAIアプリからアクセスします。Nutrition MCPがデータを販売したり、第三者と共有したり、広告に使ったりすることは一切ありません。ホームページに表示されるのは、サイト全体の匿名の合計値だけです。AIがツールを通じて読み取った内容は、あなたとそのAIの提供元との契約に基づいて、提供元に送られます。保存しているあなたのデータはいつでもすべてエクスポートでき、アカウントとすべてのデータを削除することもできます。詳しくは<a href="/privacy" data-link="privacy">プライバシーポリシー</a>をご覧ください。',
        },
    ],
};

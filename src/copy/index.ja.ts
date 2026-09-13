// Japanese (ja) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means, which four fields carry trusted HTML, and why the hero
// chat's nutrient deltas / clock strings are copied verbatim from INDEX_EN
// rather than translated.
//
// Terminology kept consistent across the widget labels and prose:
// protein → タンパク質, carbs → 炭水化物, fat → 脂質, fiber → 食物繊維,
// (total) sugar → 糖類, alcohol → アルコール（純アルコール換算のグラム）,
// caffeine → カフェイン, meal → 食事, water → 水分, weigh-in → 記録,
// goals/target → 目標, limit → 上限, timezone → タイムゾーン,
// export → エクスポート, trends → トレンド, live stats → ライブ統計,
// connect → 接続, tools → ツール, examples → 使用例 (the last four match
// src/copy/chrome.ja.ts so the landing header/footer agree with every other
// page's nav). Standard polite です/ます register throughout the prose,
// matching how a modern consumer SaaS product speaks in Japanese;
// link/button labels use plain/dictionary form where that's the natural
// Japanese UI convention (e.g. a bare noun phrase like "食事を記録"), even
// inside an otherwise です/ます page. Proper nouns (Nutrition MCP, Claude,
// ChatGPT, Cursor, GitHub, Patreon, MyFitnessPal, Cronometer, Lose It!,
// MacroFactor, Open Food Facts, MCP) stay in Latin script, never
// transliterated into katakana. Numbers stay half-width digits with the
// same comma thousands-separator and unit spacing as the English source
// (e.g. "2,000", "380 kcal", "14 g") — unlike French's narrow-space
// grouping, Japanese numeral convention matches English here, so figures
// are byte-identical to src/copy/index.ts.
//
// Two spacing fields deliberately differ from the English contract:
// `onboarding.justSay` ends in a full-width colon instead of a trailing
// space, and `live.timezonesAfter` has no leading space — Japanese sets no
// space between a numeral and the counter/particle that follows it
// (「12か所のタイムゾーン」), so the English " timezones" pattern would
// render a stray gap after the <b>{n}</b>.

import type { IndexDoc } from "./index.js";

export const INDEX_JA: IndexDoc = {
    title: "Nutrition MCP — Claude・ChatGPT・Cursorで使える無料のカロリー＆栄養素トラッカー",
    metaDescription:
        "AIに話しかけるだけで、カロリー、タンパク質、炭水化物、脂質、食物繊維、糖類、カフェインを記録。Nutrition MCPは、Claude、ChatGPT、CursorをはじめあらゆるMCPクライアントで使える無料・オープンソースのMCPサーバーです。アプリのインストールは不要。",
    ogDescription:
        "Claude、ChatGPT、Cursorの中でカロリーと栄養素を記録できる無料・オープンソースのMCPサーバー。食べたものを話すだけで、計算はおまかせ。",
    keywords:
        "栄養トラッカー, カロリートラッカー, 栄養素トラッカー, MCPサーバー, Claudeコネクタ, ChatGPTアプリ, AI栄養管理, 食事記録, バーコードスキャナー, オープンソース, MyFitnessPal 代替",

    hero: {
        titleBeforeEm: "AIに",
        titleEm: "話しかける",
        titleAfterEm: "だけで栄養管理。",
        lead: "Nutrition MCPは、Claude、ChatGPT、Cursorなど、MCPに対応したあらゆるAIの中で動く無料・オープンソースのカロリー＆栄養素トラッカーです。食べたものを話すだけで、カロリー、タンパク質、炭水化物、脂質、食物繊維、糖類、カフェインを計算して記録し、その日の状況を表示します。アプリのインストールは不要です。",
        ctaPrimary: "1分で接続",
        ctaGithub: "GitHub",
        moreExamples: "使用例をもっと見る",
        chat: {
            status: "Nutrition · 接続済み",
            photoCaption: "📷 写真",
            pauseLabel: "デモを一時停止",
            exchanges: [
                {
                    userText: "朝食にベリー入りオートミールとフラットホワイト",
                    aiText: "記録しました — 約380 kcal、タンパク質14 g。フラットホワイトでカフェイン130 mgが加わります。",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description: "ベリー入りオートミールとフラットホワイト",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "コカ・コーラ330 mlですね — 139 kcal、糖類35 g（Open Food Factsより）。間食として記録しました。",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "コカ・コーラ 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "水を500 ml",
                    aiText: "完了。今日はここまでで500 mlです。",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "昼食に大盛りのグリルチキンサラダ",
                    aiText: "記録しました — 約540 kcal、タンパク質46 g。今日の目標2,000の半分に達しました。",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "大盛りのグリルチキンサラダ",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "今日の調子はどう?",
                    aiText: "今日のここまでの状況です — タンパク質は順調、糖類は上限に近づいています。",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "使い方",
        title: "3ステップ。覚えるアプリはありません。",
        sub: "MCPサーバーによるAI栄養管理の仕組み：一度接続し、食事を説明し、好きなときにサマリーを聞くだけです。",
        steps: [
            {
                title: "一度接続するだけ",
                body: "Claude、ChatGPT、または任意のMCPクライアントにサーバーを追加し、Googleかメールアドレスでサインインします。1分もかからず、二度と繰り返す必要はありません。",
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

    connect: {
        eyebrow: "かんたん導入",
        title: "Claude、ChatGPT、Cursorに1分足らずで接続。",
        sub: "お使いのAIクライアントにNutrition MCPサーバーを追加し、Googleまたはメールアドレスとパスワードでサインインすれば、すぐに食事を記録し始められます。インストールも、覚えることも不要です。",
        copyLabel: "コピー",
        copiedLabel: "コピーしました",
        copyAriaLabel: "サーバーURLをコピー",
        bullets: [
            "すべてのClaude・ChatGPTプランで利用可能",
            "OAuth 2.0 — ログインはクライアントが処理",
            "ClaudeまたはChatGPTで接続すれば、iOS・Androidでもそのまま使える",
        ],
        otherTabLabel: "その他のエージェント",
        tabsLabel: "AIクライアントを選択",
        claude: {
            steps: [
                "<b>Claude</b>（Webまたはデスクトップ版）を開き、左上の<b>カスタマイズ</b>をクリックします。",
                "<b>コネクタ</b>をクリックします。",
                "<b>+</b>をクリックし、<b>カスタムコネクタを追加</b>を選択します。",
                "名前を付けます（例:<b>Nutrition</b>）。",
                "<b>リモートMCPサーバーURL</b>欄に<code>https://nutrition-mcp.com/mcp</code>を貼り付けます。",
                "<b>追加</b>をクリックします。",
                "<b>接続</b>をクリックすると、ログインページが開きます。Googleで続行するか、メールアドレスとパスワードでサインインしてください。",
                "完了です。すぐに使えるようになり、iOS・Androidアプリにも自動的に反映されます。",
            ],
            note: "すべてのClaudeプランで利用できます。無料プランでは同時に接続できるMCPサーバーは1つまでです。",
        },
        chatgpt: {
            steps: [
                "<b>ChatGPT（Web版）</b>を開き、<b>設定</b> → <b>アプリ</b>に進みます。",
                "ポップアップ下部の<b>アプリを作成</b>をクリックします。表示されない場合は、<b>詳細設定</b>で<b>開発者モード</b>をオンにしてください。",
                "名前を付けます（例:<b>Nutrition</b>）。",
                "<b>Connection</b>には<code>https://nutrition-mcp.com/mcp</code>を貼り付けます。",
                "<b>Authentication</b>では<b>OAuth</b>を選択し、それ以外はそのままにします。",
                "<b>作成</b>をクリックし、続けて<b>Nutritionでサインイン</b>をクリックします。",
            ],
            note: "すべてのChatGPTプランで利用できます。",
        },
        other: {
            noteHtml:
                "上記の設定をお使いのクライアント（Cursor、VS Code、Claude Codeなど）に追加してください。Windsurfでは<code>url</code>の代わりに<code>serverUrl</code>を使います。Claude Codeでは<code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>を実行します。OAuthログインはクライアントが自動的に処理します。",
        },
    },

    onboarding: {
        title: "最初の5分で設定完了。",
        sub: "設定画面はありません。タイムゾーン、カロリーと栄養素の目標、ウィジェットの言語 — どれも一言伝えるだけで、一度きりです。",
        stepLabel: "ステップ {n}",
        justSay: "こう言うだけ：",
        steps: [
            {
                title: "タイムゾーンを設定",
                body: "日付の切り替わりが、他の誰かではなくあなたの現地時間の深夜0時になります。",
                say: "タイムゾーンをニューヨークに設定して",
            },
            {
                title: "目標を設定",
                body: "1日のカロリー、栄養素、水分に加え、任意で目標体重も。",
                say: "1日の目標を2,000カロリーとタンパク質150 gに設定して",
            },
            {
                title: "ウィジェットの言語を選ぶ",
                body: "チャット内ウィジェットが使う言語です — AIが返す文章の言語ではありません。",
                say: "ウィジェットをドイツ語で表示して",
            },
            {
                title: "記録を始める",
                body: "食べたものを話すか、写真を送るか、バーコードをスキャンするだけ。",
                say: "朝食にベリー入りオートミールを食べました",
            },
        ],
    },

    examples: {
        title: "タップより、話す方が早い。",
        sub: "食事の記録、バーコードのスキャン、1週間の振り返り — 実際のチャット内ウィジェットを使った本物の会話です。いくつか見てみましょう。",
        status: "Nutrition · 接続済み",
        prevLabel: "前へ",
        nextLabel: "次へ",
        pickerLabel: "例を選択",
        carouselLabel: "会話の例",
        slideLabel: "{total}件中{n}件目",
        carouselRole: "カルーセル",
        slideRole: "スライド",
        moreToolsLabel: "あわせて使用",
        photoMealAlt:
            "写真：サワークリームとディルをのせたボルシチと、横に添えたライ麦パン1枚",
        photoPackageAlt:
            "写真：コカ・コーラの缶のバーコード、番号5449000000996",
        slides: [
            {
                id: "log-meal",
                title: "ふだんの言葉で記録",
                description:
                    "食べたもの・飲んだものを、友だちに話すように伝えるだけ。カロリー、主要栄養素、食物繊維、カフェインを計算し、時刻も自動で割り出します。",
                messages: [
                    {
                        from: "user",
                        text: "朝食にベリー入りオートミール1杯とコーヒー1杯",
                    },
                    {
                        from: "ai",
                        text: "朝食を記録しました：約320 kcal、タンパク質11 g、食物繊維6 g。コーヒーでカフェイン95 mgが加わりました。",
                    },
                    {
                        from: "user",
                        text: "あと、今朝7時ごろ、ランニングの後に水を500 ml",
                    },
                    {
                        from: "ai",
                        text: "今朝07:00に水500 mlを追加しました。",
                    },
                ],
            },
            {
                id: "photo-meal",
                title: "お皿を撮るだけ",
                description:
                    "写真を送ると、どこの料理かを確かめ、過去の記録を参照してから、短い質問を1つずつします。写真だけで記録することはありません。",
                messages: [
                    { from: "user", photo: "meal", text: "昼食" },
                    {
                        from: "ai",
                        text: "サワークリームを添えたボルシチと、ライ麦パン1枚ですね。手作りのようですが、合っていますか?",
                    },
                    { from: "user", text: "うん、母のレシピ" },
                    {
                        from: "ai",
                        text: "以前、ボルシチを2通りで記録しています：牛肉入り（1杯あたり約320 kcal）と肉なし（約180）。今回はどちらですか?",
                    },
                    {
                        from: "user",
                        text: "牛肉入り。サワークリームを大さじ2杯足した",
                    },
                    {
                        from: "ai",
                        text: "わかりました。牛肉入りボルシチ1杯、サワークリーム大さじ2、ライ麦パン1枚をすべて食べたとして、約470 kcal、タンパク質24 gです。昼食として記録しますか?",
                    },
                    { from: "user", text: "はい" },
                    {
                        from: "ai",
                        text: "昼食を記録しました：470 kcal · タンパク質24 g · 炭水化物43 g · 脂質22 g · 食物繊維7 g · 糖類10 g。",
                    },
                ],
            },
            {
                id: "scan-barcode",
                title: "バーコードをスキャン",
                description:
                    "パッケージを撮影するだけ。Open Food Factsの商品データを実際に口にした量に合わせて換算し、データの欠けている部分も補います。",
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "昼食と一緒に飲んだ",
                    },
                    {
                        from: "ai",
                        text: "コカ・コーラ330 mlですね：139 kcal、糖類35 g（Open Food Factsより）。1缶まるごと飲みましたか?",
                    },
                    { from: "user", text: "全部飲んだ" },
                    {
                        from: "ai",
                        text: "昼食に追加して記録しました：139 kcal、糖類35 g、食物繊維0 g。Open Food Factsにはカフェインの数値がないため、コカ・コーラ公式の値を使いました：1缶あたり約32 mgです。",
                    },
                ],
            },
            {
                id: "goals-progress",
                title: "目標を決めて確認",
                description:
                    "1日の目標と上限を一言で設定し、今日の状況とあとどれくらい残っているかを聞くだけ。",
                messages: [
                    {
                        from: "user",
                        text: "目標を設定して：2,000 kcal、タンパク質160 g、それとカフェインの上限。どのくらいが妥当?",
                    },
                    {
                        from: "ai",
                        text: "よく使われる目安は、健康な成人に対するEFSAとFDAの上限値で、1日400 mg（ドリップコーヒー約4杯分）です。これにしますか?",
                    },
                    { from: "user", text: "うん、400で" },
                    {
                        from: "ai",
                        text: "目標を更新しました：2,000 kcalとタンパク質160 gを目指し、カフェインは400 mg未満に。",
                    },
                    {
                        from: "user",
                        text: "今夜、まだデザートを食べても大丈夫?",
                    },
                    {
                        from: "ai",
                        text: "今日はここまで1,540 kcal、タンパク質104 g。目標まではあと460 kcal、タンパク質56 gです。残りをほぼタンパク質でとるなら、200 kcalくらいのデザートは大丈夫です。",
                    },
                ],
            },
            {
                id: "review-week",
                title: "1週間を振り返る",
                description:
                    "1週間の様子を聞くと、チャットの中でトレンドウィジェットが開きます。7日・14日・30日を切り替えたり、栄養素をタップしてグラフで確認したりできます。",
                messages: [
                    { from: "user", text: "先週はどうだった?" },
                    {
                        from: "ai",
                        text: "直近14日間（うち13日を記録）の平均は1日1,830 kcalで、目標より170少ない結果でした。タンパク質が最も安定した栄養素です。",
                    },
                ],
                widget: "trends",
            },
            {
                id: "weight-trend",
                title: "体重を記録",
                description:
                    "体重をkgまたはlbで記録すれば、本当のトレンドがわかります。1か月の変化、平滑化した平均、目標までの差を確認できます。",
                messages: [
                    {
                        from: "user",
                        text: "今量ったら78.4 kg。推移はどう?",
                    },
                    {
                        from: "ai",
                        text: "78.4 kgを記録しました。直近30日間で1.8 kg減、7日間平均は78.7 kgです。目標の75 kgまであと3.4 kgです。",
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "自分の傾向を知る",
                description:
                    "摂取量を左右しているものを聞いてみましょう。平日と週末、朝食のある日とない日、早めの夕食と遅めの夕食を比較します。",
                messages: [
                    { from: "user", text: "週末の方がたくさん食べてる?" },
                    {
                        from: "ai",
                        text: "それほどでもありません。直近30日間の平均は、平日が1,986 kcal、週末が1,977 kcalです。",
                    },
                    {
                        from: "user",
                        text: "何か差が出る要因はある?",
                    },
                    {
                        from: "ai",
                        text: "夕食の時間です。夕食が20時以降の日は平均2,150 kcal、それより早い日は1,915 kcalでした。",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "お酒も記録",
                description:
                    "アルコール記録はオンにした場合のみ。US標準ドリンクかUKユニットを選ぶと、どの飲み物も量と度数から純アルコールのグラム数で記録されます。",
                messages: [
                    {
                        from: "user",
                        text: "お酒も記録したい",
                    },
                    {
                        from: "ai",
                        text: "わかりました。US標準ドリンクとUKユニット、どちらで数えますか?",
                    },
                    { from: "user", text: "UKユニットで" },
                    {
                        from: "ai",
                        text: "アルコール記録をオンにしました。グラム数とUKユニットを併記します。次のメッセージから使えるので、新しいチャットは不要です。",
                    },
                    {
                        from: "user",
                        text: "夕食でアルコール度数4%のラガーを1パイント飲んだ",
                    },
                    {
                        from: "ai",
                        text: "夕食に追加して記録しました：568 mlの1パイント、度数4%で純アルコール18 g、2.3 UKユニット、約180 kcalです。",
                    },
                ],
            },
            {
                id: "import-history",
                title: "履歴を引き継ぐ",
                description:
                    "MyFitnessPal、Cronometer、Lose It!、MacroFactorからの乗り換えですか? エクスポートはブラウザ内で読み込まれ、確認するまで何も保存されません。",
                messages: [
                    {
                        from: "user",
                        text: "MyFitnessPalの履歴を移せる?",
                    },
                    {
                        from: "ai",
                        text: "もちろんです。まず、タイムゾーンが未設定なので、インポートした時刻はUTCとして扱われてしまいます。どちらにお住まいですか?",
                    },
                    { from: "user", text: "シカゴ" },
                    {
                        from: "ai",
                        text: "タイムゾーンをAmerica/Chicagoに設定しました。次に、インポーターでエクスポートファイルを選んでください。ファイルはブラウザ内で読み込まれ、プレビューを確認するまで何も保存されません。",
                    },
                ],
            },
            {
                id: "export-data",
                title: "データを持ち出す",
                description:
                    "一度頼むだけで、すべての食事、水分、体重、目標、設定をまとめたZIPが手に入ります。食事のファイルはそのままインポートし直せます。",
                messages: [
                    { from: "user", text: "データを全部バックアップして" },
                    {
                        from: "ai",
                        text: "完了です：食事1,204件、水分318件、体重64件、目標、プロフィール設定をまとめたZIPです。ダウンロードリンクはこちらで、60分間有効です。",
                    },
                    {
                        from: "user",
                        text: "あとでここから復元できる?",
                    },
                    {
                        from: "ai",
                        text: "食事はできます。meals.csvはそのままインポートし直せて、まだ残っている食事はidで照合してスキップするので、重複しません。水分、体重、目標、設定はエクスポートのみなので、ZIPは保管しておいてください。",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "ライブ · これまでの全員",
        title: "どこかで朝食、どこかで夕食。",
        sub: "Nutrition MCP全アカウントのライブ栄養統計 — カロリー、食事ログ、栄養素、減った体重 — 5秒ごとに更新されます。",
        unitGroupLabel: "単位",
        unitMetricLabel: "メートル法",
        unitImperialLabel: "ヤード・ポンド法",
        refreshBefore: "5秒ごとに更新 · 次回まで ",
        refreshAfter: "秒",
        sinceOpenLabel: "このページを開いてから",
        cards: {
            calories: "記録されたカロリー",
            foodLogs: "食事ログ",
            protein: "記録されたタンパク質",
            carbs: "記録された炭水化物",
            fat: "記録された脂質",
            weightLost: "2026年7月2日からの減量",
            water: "記録された水分",
        },
        foodLogsUnit: "件",
        timezonesAfter:
            "か所のタイムゾーン · 日付はそれぞれの現地時間の深夜0時に切り替わります",
        mapNote: "点の大きさ = アカウントの割合 · 点にカーソルを合わせると詳細",
        mapShare: "アカウントの{share}",
        mapAriaLabel:
            "Nutrition MCPアカウントをタイムゾーン別に示したドット地図。点が大きいほど割合が高いことを表します",
    },

    support: {
        eyebrow: "ずっと無料",
        title: "無料の栄養管理。プレミアムプランはありません。これからも。",
        sub: "すべてのツール、すべてのウィジェット、すべてのエクスポートを、誰でも無料で。一人で運営するオープンソースプロジェクトで、コードはMITライセンスなので、この先も変わりません。",
        bullets: [
            "36個のツールと6つのウィジェットをすべて利用可能",
            "広告なし、アップセルなし、機能制限なし",
            "データはいつでもエクスポート・削除可能",
            "お望みならセルフホストも — Dockerfile付き",
        ],
        patreon: {
            eyebrow: "任意 · Patreon",
            title: "役に立ったなら、サーバーの維持にご協力ください。",
            sub: "かかる費用はホスティングとデータベースだけ。それを支援者のみなさんがまかなっています — 金額は自由、いつでも解約できます。解放される機能はありません。開発ノートをいち早く読めて、次に何を作るかに意見を出せるだけです。",
            cta: "Patreonで支援",
            starCta: "代わりにStarを",
        },
        postsTitle: "Patreonの最新投稿",
        postsAll: "すべての投稿",
        postLinkLabel: "Patreonで読む",
    },

    contact: {
        eyebrow: "お問い合わせ",
        title: "気軽にどうぞ。",
        sub: "バグを見つけた、アイデアがある、食事の推定が大はずれだった — 直接メールしてください。すべてのメッセージに目を通しています。",
        emailAriaLabel: "anton@nutrition-mcp.com にメールを送る",
        cards: {
            email: { title: "メール", sub: "どんなことでも — 直通です" },
            issues: {
                title: "GitHub Issues",
                sub: "バグと機能要望を、公開の場で",
            },
            patreon: {
                title: "Patreon",
                sub: "開発ノート、投票、支援者チャット",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Nutrition MCPについてのよくある質問。",
        subBefore:
            "何なのか、どこで使えるのか、いくらかかるのか、誰がデータを見られるのか。足りないことがあれば、",
        subLink: "直接聞いてください",
        subAfter: "。",
        categoriesLabel: "カテゴリーで質問を絞り込む",
        categories: {
            all: "すべて",
            basics: "基本",
            clients: "クライアント",
            tracking: "記録",
            data: "あなたのデータ",
        },
    },
    faq: [
        // Basics
        {
            question: "Nutrition MCPとは?",
            visibleHtml:
                "栄養管理のための無料・オープンソースのMCP（Model Context Protocol）サーバーです。Claude、ChatGPT、Cursor、その他任意のMCPクライアントに接続して、食事、カロリー、栄養素、水分、体重を話すだけで記録できます。",
            category: "basics",
        },
        {
            question: "MCPサーバーとは?",
            visibleHtml:
                "チャット中にAIが呼び出せる小さなサービスです。Nutrition MCPは、Claude、ChatGPT、Cursorなどに36個の栄養ツール — 記録、目標、トレンド、インポート、エクスポート — を提供します。ツールを目にすることはなく、ただ話しかけるだけです。",
            category: "basics",
        },
        {
            question: "Nutrition MCPは無料ですか?",
            visibleHtml:
                "はい。プレミアムプラン、広告、機能制限は一切ありません。接続にはClaudeまたはChatGPTのアカウントが必要なだけです。Patreonでの寄付がサーバー費用を支えています。",
            category: "basics",
        },
        // Clients
        {
            // The visible answer states the server URL itself, so no
            // jsonLdText override is needed (mirrors INDEX_EN).
            question: "ChatGPTでも使えますか?",
            visibleHtml:
                "はい。ChatGPT（Web版）で設定 → アプリ → アプリを作成を開き、<code>https://nutrition-mcp.com/mcp</code>をOAuth認証で貼り付けてサインインしてください。すべてのChatGPTプランで利用できます。",
            category: "clients",
        },
        {
            question: "Cursor、VS Code、Claude Codeでも使えますか?",
            visibleHtml:
                "はい — HTTP経由のリモートMCPサーバーに対応するクライアントならどれでも使えます。<code>mcp.json</code>にURLを追加するか、Claude Codeでは<code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>を実行してください。",
            category: "clients",
        },
        {
            question: "スマートフォンでも使えますか?",
            visibleHtml:
                "はい。ClaudeまたはChatGPTのWeb版かデスクトップ版で一度接続すれば、iOS・Androidアプリにも自動的に表示されます。",
            category: "clients",
        },
        // Tracking
        {
            // Kept from the previous landing page verbatim (the English
            // original is test-pinned in src/site-copy.test.ts).
            question: "何を記録できますか?",
            visibleHtml:
                "カロリー、タンパク質、炭水化物、脂質、食物繊維、総糖類、水分をすべての記録について確認できます — 自然な言葉で説明するか、Open Food Facts経由で商品バーコードから取得します。カフェインもすべての表示ラベルで使われる単位、ミリグラムで記録され、カロリーには加算されません。アルコールもオンにすれば純アルコール量（グラム）で記録できます。体重もkgまたはlbで記録し、目標体重へのトレンドを追跡できます。日次サマリーの表示、期間指定での食事の検索、過去の記録の更新・削除、目標の設定、時系列でのトレンドの確認も可能です。",
            category: "tracking",
        },
        {
            question: "カロリー計算の精度はどのくらいですか?",
            visibleHtml:
                "数値は、説明した内容から推定したものです — 知識のある友人が見積もるような精度で、トレンドの把握には十分ですが、医療上の判断には向きません。バーコードスキャンはOpen Food Factsのデータを使用します。",
            category: "tracking",
        },
        {
            question: "アルコールも記録できますか?",
            visibleHtml:
                "オンにした場合のみです。アルコール記録はデフォルトでオフになっています。オンにすると、飲み物は純アルコール量（グラム）で記録され、US標準ドリンクまたはUKユニットとして表示されます。",
            category: "tracking",
        },
        // Your data
        {
            // The closing sentence mirrors the English one pinned by
            // src/site-copy.test.ts: the export takes everything out, but
            // only meals come back in.
            question: "MyFitnessPalやCronometerの履歴をインポートできますか?",
            visibleHtml:
                "はい。MyFitnessPal、Cronometer、Lose It!、MacroFactor、または任意のCSVから、列を対応付けて食事履歴をインポートできます — 1回の呼び出しにつき最大50行です。現時点で再インポートできるのは食事のみです。",
            category: "data",
        },
        {
            // Must name meals, water, weight, goals and profile — the five
            // files in the export archive.
            question: "データを見られるのは誰ですか? エクスポートはできますか?",
            visibleHtml:
                "あなただけです。すべて — 食事、水分、体重、目標、プロフィール — をCSVファイルのZIPとして、60分間有効なダウンロードリンクでエクスポートできます。アカウントをまるごと削除することも可能です。MITライセンスなので、セルフホストもできます。",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "セルフホストできますか?",
            visibleHtml:
                'はい。Nutrition MCPはオープンソース（MITライセンス）です。独自のSupabaseプロジェクトで自分のインスタンスを運用できます — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHubリポジトリ</a>には、詳しいセルフホスティングガイドとDockerfileが含まれています。',
            category: "data",
        },
    ],

    cta: {
        title: "次の食事は、一言で記録。",
        sub: "Claude、ChatGPT、Cursorで使える無料・オープンソースの栄養管理 — データはあなたのもので、いつでもエクスポートも削除もできます。",
        primary: "今すぐ接続",
        secondary: "GitHubでStar",
    },
};

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
        slides: [
            {
                title: "食事を記録",
                sub: "普通の言葉で、データベース検索なし",
                userText: "朝食にベリー入りオートミールとコーヒーを食べました",
                aiText: "朝食を記録しました — 約320 kcal、タンパク質11 g。コーヒーでカフェイン95 mgが加わりました。",
            },
            {
                title: "バーコードをスキャン",
                sub: "Open Food Factsのデータを、食べた量に合わせて",
                userText: "このバーコードをスキャンして: 5449000000996",
                aiText: "コカ・コーラ330 mlですね — 139 kcal、糖類35 g（Open Food Factsより）。どのくらい飲みましたか?",
            },
            {
                title: "1週間を振り返る",
                sub: "トレンドウィジェットを、チャットの中で",
                userText: "先週はどうだった?",
                aiText: "直近14日間（うち13日を記録）の平均は1日1,830 kcalで、目標より170少ない結果でした。タンパク質が最も安定した栄養素です。",
                widget: "trends",
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

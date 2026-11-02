// Japanese translation of the /apple-health setup guide (see
// src/copy/apple-health.ts for the field contract: RAW HTML fields keep every
// tag, entity and {link} / {activityLink} token verbatim). Both shortcuts'
// names, the `auto` input and the menu items (Sync now, Status, Disconnect)
// stay English: one shared shortcut serves every locale. Health and Shortcuts
// labels follow tools.ja.ts's troubleshooting entries.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_JA: AppleHealthDoc = {
    meta: {
        title: "Apple Healthのショートカット",
        description:
            "Nutrition MCPとApple Healthをつなぐ、無料の2つのiPhoneショートカット。Nutrition MCP Healthは、AIとのチャットで記録した1日の合計（カロリー、たんぱく質、炭水化物、脂質、食物繊維、カフェイン、選択すれば水分）をApple Healthにコピーし、Nutrition MCP Activityは1日のアクティブエネルギーをアクティブカロリーとして取り込みます。",
        ogDescription:
            "1日の合計をApple Healthへ、アクティブエネルギーをNutrition MCPへ。無料のiPhoneショートカット2つで、どちらか一方でも両方でも使えます。",
    },
    tocLabel: "このページの内容",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCPとApple Health、双方向に",
        lead: "無料のiPhoneショートカットは2つで、それぞれ反対方向に動きます。1つは食べたものをApple Healthにコピーし、もう1つは消費したエネルギーをNutrition MCPに戻します。どちらか一方でも両方でも使えます。接続、同期、解除はそれぞれ独立して行われます。",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "1日の合計を、Apple Healthに",
            items: [
                "終わった日ごとに、栄養素ごとのエントリが1件ずつ、<strong>12:00</strong>の時刻で<strong>ショートカット</strong>から記録されます。",
                "1日はタイムゾーンで翌朝<strong>05:00</strong>に締まるため、昨日の分は今日の05:00以降に届きます。今日の分が表示されることはありません。",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "アクティブエネルギーを、アクティブカロリーとして",
            items: [
                "今日と前2日間の<strong>アクティブエネルギー</strong>の合計を、食べたものと並べて表示します。カロリー目標が変わることはありません。",
                "1日1件のエントリとして、同期のたびに置き換えられます。そのため、こまめに同期しても同じ日を二重に数えることはありません。",
            ],
        },
        nutrientsLabel: "毎日送信される項目",
        nutrients: {
            energy_kcal: "摂取エネルギー",
            protein_g: "タンパク質",
            carbohydrates_g: "炭水化物",
            fat_g: "総脂肪",
            fiber_g: "食物繊維",
            caffeine_mg: "カフェイン",
            water_ml: "水分",
        },
        waterNote: "選択した場合",
        alcoholNote: "アルコールが送信されることはありません。",
        readLabel: "同期のたびに読み取る項目",
        activeEnergy: "アクティブエネルギー",
    },
    before: {
        title: "始める前に",
        items: [
            "<strong>ショートカット</strong>アプリと<strong>ヘルスケア</strong>アプリが入ったiPhone。どちらもiOSに標準で入っています。",
            "ClaudeやChatGPTなどのAIアプリにすでに接続済みのNutrition MCPアカウント。ショートカットも同じアカウントでサインインします。",
            "推奨：プロフィールにタイムゾーンを設定しておくこと。1日の区切りはタイムゾーンで決まります。チャットで<em>&ldquo;タイムゾーンを設定して&rdquo;</em>と伝えるだけです。一度も設定していない場合は、接続時にiPhoneが伝えたタイムゾーンが使われます。",
        ],
    },
    install: {
        title: "ショートカットをインストール",
        lead: "1つだけでも両方でもかまいません。iPhoneでリンクを開き、<strong>ショートカットを追加</strong>をタップします。ショートカットアプリにはそれぞれの名前で表示されます。",
        button: "ショートカットを入手",
        pending: "ショートカットのリンクは近日中にここで公開します。",
        leadPending:
            "ショートカットはまだ公開されていません。公開後は、iPhoneでリンクを開いて<strong>ショートカットを追加</strong>をタップすると、ショートカットアプリにそれぞれの名前で表示されます。以下の手順は、その後の流れを説明しています。",
        healthBlurb: "1日の合計をApple Healthに送ります。",
        activityBlurb: "Apple Healthからアクティブエネルギーを読み取ります。",
        nameNote:
            "名前は<strong>Nutrition MCP Health</strong>と<strong>Nutrition MCP Activity</strong>のまま変えないでください。サインインページはショートカットを名前で再び開くため、どちらかの名前を変えると接続が途中で止まります。",
    },
    connect: {
        title: "接続する",
        steps: [
            "ショートカットアプリで、ショートカットをタップして実行します。",
            "質問（下記）に答えると、Safariでサインインページが開きます。<strong>AIアプリと同じアカウント</strong>でサインインしてください。ページにはApple Healthの接続についての注意が表示されます。自分のiPhoneのショートカットから今まさに自分で始めた場合にだけ、先に進んでください。",
            "Safariがショートカットを開くか尋ねたら、<strong>開く</strong>をタップします。ショートカットが接続を完了します。",
        ],
        health: {
            label: "Nutrition MCP Health が尋ねること",
            items: [
                "<strong>水分</strong>も送るかどうか（Apple Watchや別のアプリがすでに水分を記録している場合はオフのままに）と、どの日を送るか（<strong>From today</strong>＝今日から、または<strong>Also the last 7 days</strong>＝直近7日間も）です。",
                "初めて1日分が送られるときに、Apple Healthがショートカットに書き込みを許可する項目を尋ねます。<strong>すべての項目</strong>をオンにして、<strong>許可</strong>をタップします。<strong>Also the last 7 days</strong>を選び、その期間に食事を記録していれば、すぐに尋ねられます。そうでない場合はまだ送るものがないため、明日の05:00以降にショートカットを開き、<strong>Sync now</strong>を一度タップして許可してください。",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity が尋ねること",
            items: [
                "サインインの前には、何を読み取るかの短い注意が表示されるだけで、ほかには何も尋ねられません。最初の同期は接続直後に実行されます。",
                "Apple Healthが、ショートカットに<strong>アクティブエネルギー</strong>の読み取りを許可するか尋ねます。<strong>許可</strong>をタップします。続いてiOSが、ショートカットがヘルスケアのデータをnutrition-mcp.comに送ってよいか尋ねます。<strong>常に許可</strong>を選んでください。選ばないと、自動実行のたびにこの質問で止まります。",
            ],
        },
        note: "サインインのリンクは1回限りで、30分間有効です。期限が切れたら、ショートカットをもう一度実行してください。2つのショートカットは同時にではなく、1つずつ続けて接続してください。Nutrition MCP Healthでは、最初に終わった日は明日の05:00以降に届きます。直近7日間を選んだ場合は、その分がすぐに送られます。",
    },
    automate: {
        title: "自動で動かす",
        lead: "共有されたショートカットにはオートメーションを含められないため、使うショートカットごとに、ショートカットアプリの<strong>オートメーション</strong>タブで一度作成してください。それぞれ最初のトリガーが大事で、ほかのトリガーは取り残された分を取り戻します。",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "App → ヘルスケア → 開いたとき",
                tag: "メイン",
                body: "ヘルスケアを開くときこそ、データが最新であってほしいタイミングです。",
            },
            {
                when: "アラーム → 停止したとき",
                tag: "朝の取り戻し",
                body: "目覚ましなど、05:00以降にアラームを止めると、終わった昨日の分がすぐに送られます。",
            },
            {
                when: "充電器 → 接続されたとき",
                tag: "任意",
                body: "夜や仕事中に充電器につなぐたびに、同期の機会が1回増えます。",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude または ChatGPT → 開いたとき",
                tag: "メイン",
                body: "AIアプリを開くのは、今日の調子を聞こうとしているときです。聞く前に、今日の消費分が最新になっています。",
            },
            {
                when: "App → ヘルスケアまたはフィットネス → 開いたとき",
                tag: "追加",
                body: "アクティビティのリングやワークアウトを確認するときも、同期の機会がもう1回増えます。",
            },
            {
                when: "時刻",
                tag: "1日を通して",
                body: "&ldquo;毎時&rdquo;のトリガーはないため、12:00、18:00、22:00などいくつか追加して、どちらのアプリも開かなかった日を拾ってください。",
            },
        ],
        stepsLabel: "それぞれの作成手順",
        steps: [
            "ショートカットアプリで<strong>オートメーション</strong>タブを開き、<strong>+</strong>をタップして個人用オートメーションを作成します。",
            "トリガーを選びます。例：<strong>App</strong> → <strong>ヘルスケア</strong> → <strong>開いたとき</strong>。",
            "<strong>すぐに実行</strong>を選び、表示される場合は<strong>実行時に通知</strong>をオフにします。",
            "アクション<strong>ショートカットを実行</strong>を追加して、<strong>Nutrition MCP Health</strong>か<strong>Nutrition MCP Activity</strong>を選び、入力にテキスト<code>auto</code>を設定します。",
        ],
        note: "入力を<code>auto</code>にすると、自動実行は静かに動き、対応が必要なときだけ通知します。正確な時刻を決める必要はありません。Nutrition MCP Healthは毎回の同期で直近7日間の終わった日をさかのぼり、Nutrition MCP Activityは今日と前2日間を送り直すため、実行し忘れた分も自動で取り戻されます。",
    },
    everyday: {
        title: "日々の使い方",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "記録し忘れたときは",
                body: "いつもどおりチャットで追加してください。その日がすでに送信済みで直近7日間に入っていれば、次の同期で12:01、12:02…の小さな追加エントリとして補われます。約20 kcalまたは2 g未満の変化は送られません。極端に大きな増加や、9回の追加後の変化は送られず、手動で入力するよう通知が届きます。",
            },
            {
                title: "食事を削除した・減らしたときは",
                body: "Apple Healthは値を足すことはできても減らすことはできないため、その日がどれだけ多くなっているかを通知でお知らせします。直すには、ヘルスケアで<strong>ブラウズ</strong> → <strong>栄養</strong>を開いて項目を選び、<strong>すべてのデータを表示</strong>をタップして、その日の&ldquo;ショートカット&rdquo;からのエントリを左にスワイプして削除し、通知に書かれた正しい合計を手動で入力します。<strong>&ldquo;ショートカット&rdquo;からのすべてのデータを削除</strong>は使わないでください。ほかのショートカットが記録したデータも消えます。",
            },
            {
                title: "手動で実行する",
                body: "ショートカットアプリで<strong>Nutrition MCP Health</strong>をタップするとメニューが開きます。<strong>Sync now</strong>は未送信の分を送り、<strong>Status</strong>は最後に送った日と次の日が準備できる時刻を表示し、<strong>Disconnect</strong>は接続を終了します。",
            },
            {
                title: "AIアプリで確認する",
                body: "AIにプロフィールの表示を頼むと（<code>get_profile</code>）、同期を接続した日、どの日まで送信したか、最後に実行された日時がわかります。",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "送信の確認に大きなカロリーの数字が出てきたら？",
                body: "心配はいりません。iOSが送信前に表示する確認には、Healthの1日の生の合計が小数点以下の桁まで並ぶことがあります。たとえば<strong>922.774 kcal</strong>と表示されていても、送信されるのは整数のキロカロリーに丸めた値（この例では923 kcal）です。ショートカットは送信前に毎日の値を必ず整数のキロカロリーに丸めます。同じ一覧にある<strong>0 kcal</strong>の項目は何も加えません。",
            },
            {
                title: "チャットでもワークアウトを記録した？",
                body: "ショートカットが送信した日は、Apple Healthの合計が優先されます。チャットで記録したワークアウトは記録に残るものの、その上には加算されません。時計のアクティブエネルギーにはそれらがすでに含まれているためです。ほかの日は、いつもどおり加算されます。",
            },
            {
                title: "0と表示される日がある？",
                body: "アクティブエネルギーがない日、またはヘルスケアがショートカットの読み取りを許可しなかった日は、何も送らず、何も変えません。すべての日が0のままなら、ヘルスケアの<strong>共有</strong> → <strong>App</strong> → <strong>ショートカット</strong>で、ショートカットによるアクティブエネルギーの読み取りを許可してください。",
            },
            {
                title: "手動で実行する",
                body: "ショートカットアプリで<strong>Nutrition MCP Activity</strong>をタップするとメニューが開きます。<strong>Sync now</strong>は今日と前2日間を送り、<strong>Status</strong>は最後に送った日を表示し、<strong>Disconnect</strong>はそのショートカットの接続を終了します。Nutrition MCP Healthの接続はそのまま残ります。",
            },
        ],
    },
    privacy: {
        title: "プライバシーと制限",
        items: [
            "Nutrition MCP Healthでは、本サービスのサーバーが接続と、送信した合計の記録を8日間保存します。これにより各日を1回だけ送り、その後は追加分だけを補います。本サービスがAppleに何かを送ることはありません。ショートカットがサーバーに合計を問い合わせ、iPhoneのヘルスケアに書き込みます。その後は、あなた自身のAppleの設定に従います。",
            "Nutrition MCP Activityが読み取るのは、1日の<strong>アクティブエネルギー</strong>の合計だけで、ヘルスケアからほかは読み取りません。本サービスのサーバーはその合計をアクティブカロリーとして保存し、チャットで記録したものと同様に、データのエクスポートに含め、アカウントを削除すると一緒に削除します。",
            "各ショートカットは、アクセストークンを、ファイルではなく、iPhone上のショートカットアプリ内にある自身の保存領域に保存します。ショートカットアプリがこのトークンをiCloud経由でほかのデバイスに同期することがあります。お使いのデバイスでショートカットを実行できる人は、同期を解除するまで同期を利用できるため、ショートカットは自分だけが使うデバイスに置いてください。",
            "いつでもショートカットで<strong>Disconnect</strong>を選べば、その接続は即座に削除され、Nutrition MCP Healthの記録も一緒に削除されます。どの接続も、同期のないまま90日たった場合と、接続から365日たった場合に自動で終了します。すでにApple Healthにあるデータは、削除するまでそこに残ります。送信済みのアクティブカロリーも、削除するまで残ります。",
        ],
        policyLink: "プライバシーポリシーを読む",
    },
    troubleshooting: {
        title: "トラブルシューティング",
        lead: "数字が合わないときは、よくあるケースをこちらで確認してください。",
        readMore: "回答を読む",
    },
    selfHost: {
        textHtml:
            "ご自身のサーバーで運用していますか？ショートカットの作り方は、{link}と{activityLink}に順を追って書かれています。",
        linkText: "Nutrition MCP Healthの作成手順書",
        activityLinkText: "Nutrition MCP Activityの作成手順書",
    },
};

// Japanese translation of the /apple-health setup guide (see
// src/copy/apple-health.ts for the field contract: RAW HTML fields keep every
// tag, entity and {link} token verbatim). The shortcut's name, its `auto`
// input and its menu items (Sync now, Status, Disconnect) stay English: one
// shared shortcut serves every locale. Health and Shortcuts labels follow
// tools.ja.ts's troubleshooting entries.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_JA: AppleHealthDoc = {
    meta: {
        title: "Apple Healthとの同期",
        description:
            "無料のショートカット「Nutrition MCP Health」をiPhoneに設定しましょう。AIとのチャットで記録した1日の合計（カロリー、たんぱく質、炭水化物、脂質、食物繊維、糖質、カフェイン、選択すれば水分）をApple Healthにコピーします。",
        ogDescription:
            "AIで記録した1日の合計を、無料のiPhoneショートカット1つでApple Healthにコピーします。",
    },
    tocLabel: "このページの内容",
    hero: {
        eyebrow: "Apple Healthとの同期 · iPhone",
        title: "1日の合計を、Apple Healthに",
        lead: "無料のiPhoneショートカットが、終わった日の合計をNutrition MCPからApple Healthにコピーします。記録はこれまでどおりAIアプリで行い、ショートカットは終わった日だけを送ります。",
        seeTitle: "Apple Healthに表示される内容",
        seeItems: [
            "終わった日ごとに、栄養素ごとのエントリが1件、<strong>12:00</strong>の時刻で<strong>ショートカット</strong>から記録されます。",
            "1日はタイムゾーンで翌朝<strong>05:00</strong>に締まるため、昨日の分は今日の05:00以降に届きます。今日の分が表示されることはありません。",
        ],
        nutrientsLabel: "毎日送信される項目",
        nutrients: {
            energy_kcal: "摂取エネルギー",
            protein_g: "タンパク質",
            carbohydrates_g: "炭水化物",
            fat_g: "総脂肪",
            fiber_g: "食物繊維",
            sugar_g: "糖分",
            caffeine_mg: "カフェイン",
            water_ml: "水分",
        },
        waterNote: "選択した場合",
        alcoholNote: "アルコールが送信されることはありません。",
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
        lead: "iPhoneでリンクを開き、<strong>ショートカットを追加</strong>をタップします。ショートカットアプリに<strong>Nutrition MCP Health</strong>として表示されます。",
        button: "ショートカットを入手",
        pending: "ショートカットのリンクは近日中にここで公開します。",
        leadPending:
            "ショートカットはまだ公開されていません。公開後は、iPhoneでリンクを開いて<strong>ショートカットを追加</strong>をタップすると、ショートカットアプリに<strong>Nutrition MCP Health</strong>として表示されます。以下の手順は、その後の流れを説明しています。",
        nameNote:
            "名前は<strong>Nutrition MCP Health</strong>のまま変えないでください。サインインページはこの名前でショートカットを再び開くため、名前を変えると接続が途中で止まります。",
    },
    connect: {
        title: "接続する",
        steps: [
            "ショートカットアプリで<strong>Nutrition MCP Health</strong>をタップして実行します。",
            "2つの質問に答えます。<strong>水分</strong>も送るかどうか（Apple Watchや別のアプリがすでに水分を記録している場合はオフのままに）と、どの日を送るか（<strong>From today</strong>＝今日から、または<strong>Also the last 7 days</strong>＝直近7日間も）です。",
            "Safariでサインインページが開きます。<strong>AIアプリと同じアカウント</strong>でサインインしてください。ページにはApple Healthの接続についての注意が表示されます。自分のiPhoneのショートカットから今まさに自分で始めた場合にだけ、先に進んでください。",
            "Safariがショートカットを開くか尋ねたら、<strong>開く</strong>をタップします。ショートカットが接続を完了します。",
            "初めて1日分が送られるときに、Apple Healthがショートカットに書き込みを許可する項目を尋ねます。<strong>すべての項目</strong>をオンにして、<strong>許可</strong>をタップします。<strong>Also the last 7 days</strong>を選び、その期間に食事を記録していれば、すぐに尋ねられます。そうでない場合はまだ送るものがないため、明日の05:00以降にショートカットを開き、<strong>Sync now</strong>を一度タップして許可してください。",
        ],
        note: "サインインのリンクは1回限りで、30分間有効です。期限が切れたら、もう一度ショートカットを実行してください。最初に終わった日は明日の05:00以降に届きます。直近7日間を選んだ場合は、その分がすぐに送られます。",
    },
    automate: {
        title: "自動で動かす",
        lead: "共有されたショートカットにはオートメーションを含められないため、ショートカットアプリの<strong>オートメーション</strong>タブで一度だけ作成してください。大事なのは1つ目です。ほかの2つは、ヘルスケアを開かなかった日の分を取り戻します。",
        triggersLabel: "実行するタイミング",
        triggers: [
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
        stepsLabel: "それぞれの作成手順",
        steps: [
            "ショートカットアプリで<strong>オートメーション</strong>タブを開き、<strong>+</strong>をタップして個人用オートメーションを作成します。",
            "トリガーを選びます。例：<strong>App</strong> → <strong>ヘルスケア</strong> → <strong>開いたとき</strong>。",
            "<strong>すぐに実行</strong>を選び、表示される場合は<strong>実行時に通知</strong>をオフにします。",
            "アクション<strong>ショートカットを実行</strong>を追加して<strong>Nutrition MCP Health</strong>を選び、入力にテキスト<code>auto</code>を設定します。",
        ],
        note: "入力を<code>auto</code>にすると、自動実行は静かに動き、対応が必要なときだけ通知します。正確な時刻を決める必要はありません。毎回の同期で直近7日間の終わった日をさかのぼるため、同期しなかった朝の分は自動で取り戻されます。",
    },
    everyday: {
        title: "日々の使い方",
        cards: [
            {
                title: "記録し忘れたときは",
                body: "いつもどおりチャットで追加してください。その日がすでに送信済みで直近7日間に入っていれば、次の同期で12:01、12:02…の小さな追加エントリとして補われます。約20 kcalまたは2 g未満の変化は送られません。極端に大きな増加や、9回の追加後の変化は送られず、手動で入力するよう通知が届きます。",
            },
            {
                title: "食事を削除した・減らしたときは",
                body: "Apple Healthは値を足すことはできても減らすことはできないため、その日がどれだけ多くなっているかを通知でお知らせします。直すには、ヘルスケアで<strong>ブラウズ</strong> → <strong>栄養</strong>を開いて項目を選び、<strong>すべてのデータを表示</strong>をタップして、その日の「ショートカット」からのエントリを左にスワイプして削除し、通知に書かれた正しい合計を手動で入力します。<strong>“ショートカット”からのすべてのデータを削除</strong>は使わないでください。ほかのショートカットが記録したデータも消えます。",
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
    },
    privacy: {
        title: "プライバシーと制限",
        items: [
            "本サービスのサーバーは接続と、送信した合計の記録を8日間保存します。これにより各日を1回だけ送り、その後は追加分だけを補います。どちらもデータのエクスポートに含まれます。",
            "ショートカットはアクセストークンを、ファイルではなく、iPhone上のショートカットアプリ内にある自身の保存領域に保存します。ショートカットアプリがこのトークンをiCloud経由でほかのデバイスに同期することがあります。お使いのデバイスでショートカットを実行できる人は、同期を解除するまで同期を利用できるため、ショートカットは自分だけが使うデバイスに置いてください。",
            "本サービスがAppleに何かを送ることはありません。ショートカットがサーバーに合計を問い合わせ、iPhoneのヘルスケアに書き込みます。その後は、あなた自身のAppleの設定に従います。",
            "<strong>Disconnect</strong>を選べばいつでも、接続とその記録がすぐに削除されます。同期のないまま90日たった場合と、接続から365日たった場合にも自動で終了します。すでにApple Healthにあるデータは、削除するまでそこに残ります。",
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
            "ご自身のサーバーで運用していますか？ショートカットの作り方は{link}で一つずつ説明しています。",
        linkText: "作成手順書",
    },
};

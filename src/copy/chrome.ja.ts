import type { ChromeCopy } from "./chrome.js";

export const CHROME_JA: ChromeCopy = {
    skipToContent: "コンテンツにスキップ",
    brandHomeAriaLabel: "Nutrition MCP ホーム",

    nav: {
        how: "使い方",
        tools: "ツール",
        examples: "使用例",
        liveStats: "ライブ",
        liveStatsBadgeLabel: {
            other: "件の新しい食事ログがページを開いてから追加されました",
        },
        donate: "寄付",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "メインナビゲーション",
        menu: "メニュー",
        footer: "フッター",
    },

    githubAriaLabel: "GitHubリポジトリ",
    changeLanguageAriaLabel: "言語を変更",
    languageTitle: "言語",
    theme: {
        ariaLabel: "テーマを変更",
        title: "テーマ",
        system: "システム",
        light: "ライト",
        dark: "ダーク",
    },
    connectCta: "接続する",
    openMenuAriaLabel: "メニューを開く",
    closeMenuAriaLabel: "メニューを閉じる",

    menu: {
        howSmall: "3ステップ",
        installSmall: "1分足らず",
        toolsSmall: "36個のツール",
        examplesSmall: "ライブデモ",
        liveStatsSmall: "開いてから",
        alternatives: "代替アプリ",
        alternativesSmall: "アプリの乗り換え",
        support: "サポート",
        contact: "お問い合わせ",
        github: "GitHub",
        privacy: "プライバシー",
        terms: "利用規約",
        connectInMinute: "1分で接続",
    },

    footer: {
        blurb: "AIに話しかけるだけの、無料・オープンソースの栄養管理。akutishevskyが一人で開発・運営しています。",
        copyEndpointAriaLabel: "エンドポイントをコピー",
        social: { github: "GitHub", patreon: "Patreon", email: "メール" },
        product: {
            heading: "プロダクト",
            connect: "接続",
            onboarding: "最初の5分",
            examples: "使用例",
            live: "ライブ統計",
            tools: "36個の栄養ツールすべて",
            alternatives: "MyFitnessPalなどの代替アプリ",
            contact: "お問い合わせ",
        },
        openSource: {
            heading: "オープンソース",
            source: "GitHubのソースコード",
            selfHost: "セルフホスティングガイド",
            bug: "バグを報告",
            llms: "llms.txt",
            licence: "MITライセンス",
        },
        copyright:
            "© 2026 akutishevsky · MIT · バーコードデータはOpen Food Facts提供",
        bottomPrivacy: "プライバシー",
        bottomTerms: "利用規約",
        bottomAlternatives: "代替アプリ",
        disclaimer:
            "栄養データはあくまで目安であり、医療アドバイスではありません。",
    },
};

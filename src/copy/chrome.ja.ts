import type { ChromeCopy } from "./chrome.js";

export const CHROME_JA: ChromeCopy = {
    skipToContent: "コンテンツにスキップ",
    brandHomeAriaLabel: "Nutrition MCP ホーム",

    nav: {
        how: "使い方",
        install: "インストール",
        tools: "ツール",
        examples: "使用例",
        liveStats: "ライブ統計",
        liveStatsBadgeLabel: {
            other: "件の新しい食事ログがページを開いてから追加されました",
        },
        faq: "よくある質問",
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
        github: "GitHub",
    },

    footer: {
        tools: "ツール",
        troubleshooting: "トラブルシューティング",
        alternatives: "代替アプリ",
        howIBuiltThis: "開発の舞台裏",
        demo: "デモ",
        github: "GitHub",
        contact: "お問い合わせ",
        privacyPolicy: "プライバシーポリシー",
        termsOfService: "利用規約",
        note: "無料のオープンソースです。栄養データはあくまで目安であり、医療アドバイスではありません。",
    },

    consent: {
        title: "【分析用Cookie】",
        body: "許可していただいた場合、Google Analyticsが訪問数を計測し、Microsoft Clarityがクリックやスクロールをセッション記録として残します。どのページが役立ち、どこでつまずいているかを把握するためです。どちらも、同意いただくまで読み込まれません。",
        accept: "許可する",
        reject: "拒否する",
        settings: "Cookie設定",
    },
};

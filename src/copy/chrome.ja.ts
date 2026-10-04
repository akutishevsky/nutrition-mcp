import type { ChromeCopy } from "./chrome.js";

export const CHROME_JA: ChromeCopy = {
    skipToContent: "本文へスキップ",
    brandHomeAriaLabel: "Nutrition MCPのトップページ",

    nav: {
        how: "使い方",
        install: "導入方法",
        tools: "ツール",
        examples: "使用例",
        liveStats: "ライブ統計",
        liveStatsBadgeLabel: {
            one: "件の食事ログが、このページを開いてから追加されました",
            other: "件の食事ログが、このページを開いてから追加されました",
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
        appleHealth: "Apple Health",
        alternatives: "代替アプリ",
        howIBuiltThis: "開発の舞台裏",
        demo: "デモ",
        github: "GitHub",
        contact: "お問い合わせ",
        privacyPolicy: "プライバシーポリシー",
        termsOfService: "利用規約",
        note: "無料のオープンソースです。栄養価は推定値であり、医学的なアドバイスではありません。",
    },

    consent: {
        title: "分析用Cookieについて",
        body: "同意いただくと、Google Analyticsが訪問数を計測し、Microsoft Clarityがクリックやスクロールをセッションリプレイとして記録します。どのページが役に立ち、どこでつまずきやすいかを知るためです。同意いただくまで、どちらも読み込まれません。",
        accept: "同意する",
        reject: "拒否する",
        settings: "Cookie設定",
    },
};

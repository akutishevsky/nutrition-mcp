import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_JA: HealthSyncCopy = {
    opening: {
        title: "ショートカットを開いています…",
        heading: "ショートカットを開いています…",
        body: "サインインしました。Apple Health との同期の接続を完了するため、Nutrition MCP Health ショートカットを開いています。自動で開かない場合は、ボタンをタップしてください。",
        button: "ショートカットを開く",
        note: "ショートカットに接続完了と表示されたら、このページは閉じてかまいません。",
    },
    errors: {
        expired: {
            title: "リンクの有効期限切れ",
            heading: "このリンクは有効期限が切れています",
            body: "接続用リンクは1回限り、30分間だけ有効です。新しいリンクを取得するには、iPhone で Nutrition MCP Health ショートカットをもう一度実行してください。",
        },
        signInFailed: {
            title: "接続できませんでした",
            heading: "サインインを完了できませんでした",
            body: "Apple Health との同期は接続されていません。iPhone で Nutrition MCP Health ショートカットをもう一度実行し、開いたページでサインインしてください。",
        },
        generic: {
            title: "問題が発生しました",
            heading: "問題が発生しました",
            body: "Apple Health との同期は接続されていません。少し待ってから、iPhone で Nutrition MCP Health ショートカットをもう一度実行してください。",
        },
    },
};

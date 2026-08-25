import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_JA: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "接続するにはサインイン",
    googleButton: "Googleで続行",
    dividerText: "またはメールアドレスで",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    continueButton: "続行",
    consentNote:
        "続行すると、16歳以上であることを確認し、{terms}と{privacy}に同意したことになります。",
    termsLinkText: "利用規約",
    privacyLinkText: "プライバシーポリシー",
    newHereNote:
        "初めてですか？メールアドレスとパスワードを入力するだけで、アカウントが自動的に作成されます。",
    afterConnectNote:
        "クライアントでの接続が完了したら、パスワードを安全な場所に保存して、このブラウザタブを閉じてください。",
};

export const LOGIN_ERRORS_JA: LoginErrors = {
    googleCancelled:
        "Googleでのサインインがキャンセルされました。もう一度お試しください。",
    googleFailed:
        "Googleでのサインインに失敗しました。もう一度お試しください。",
};

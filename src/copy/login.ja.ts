import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

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

export const LOGIN_CLIENT_NOTICE_JA: LoginClientNotice = {
    returnTo: "サインイン後、{host}に戻ります。",
    unknownHost:
        "{host}は当サービスが把握しているアシスタントではありません。ご自身で{host}から接続を開始した場合のみ続行してください。",
    loopback:
        "このコンピューター上で動作しているプログラム（{host}）に戻ります。ご自身でこのプログラムから接続を開始した場合のみ続行してください。",
};

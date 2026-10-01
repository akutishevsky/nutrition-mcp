import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_JA: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "接続するにはサインイン",
    googleButton: "Googleで続行",
    dividerText: "またはメールアドレスで",
    emailLabel: "メールアドレス",
    passwordLabel: "パスワード",
    signInButton: "サインイン",
    createAccountButton: "アカウントを作成",
    modeGroupAriaLabel: "アカウント",
    showPasswordLabel: "パスワードを表示",
    hidePasswordLabel: "パスワードを非表示",
    consentNote:
        "続行することで、16歳以上であることを確認し、{terms}と{privacy}に同意し、あなたが記録する食事、体重、アルコール（健康データにあたります）を当社が保存することに同意します。",
    termsLinkText: "利用規約",
    privacyLinkText: "プライバシーポリシー",
    newHereNote:
        "初めてですか？メールアドレスとパスワードを入力して、「アカウントを作成」を選んでください。",
    afterConnectNote:
        "クライアントでの接続が完了したら、パスワードを安全な場所に保存して、このブラウザタブを閉じてください。",
};

export const LOGIN_ERRORS_JA: LoginErrors = {
    googleCancelled:
        "Googleでのサインインがキャンセルされました。もう一度お試しください。",
    googleFailed:
        "Googleでのサインインに失敗しました。もう一度お試しください。",
    invalidCredentials: "メールアドレスまたはパスワードが違います。",
    signInFailed: "現在サインインできません。数分後にもう一度お試しください。",
    weakPassword:
        "このパスワードは強度が不十分です。英字・数字・記号を組み合わせた、より長いパスワードを選んでください。",
    passwordTooLong:
        "このパスワードは長すぎます。72文字以内のパスワードを選んでください。",
    emailInvalid:
        "このメールアドレスは無効です。入力ミスがないか確認してください。",
    signUpFailed:
        "アカウントを作成できませんでした。しばらくしてからもう一度お試しください。",
};

export const LOGIN_CLIENT_NOTICE_JA: LoginClientNotice = {
    returnTo: "サインイン後、{host}に戻ります。",
    unknownHost:
        "{host}は当サービスが把握しているアシスタントではありません。ご自身で{host}から接続を開始した場合のみ続行してください。",
    loopback:
        "このコンピューター上で動作しているプログラム（{host}）に戻ります。ご自身でこのプログラムから接続を開始した場合のみ続行してください。",
};

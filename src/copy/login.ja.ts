import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_JA: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "サインインして接続",
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
        "続行すると、16歳以上であることを確認し、{terms}と{privacy}に同意します。また、記録する食事・体重・アルコール（健康データにあたります）を本サービスが保存することにも同意します。",
    termsLinkText: "利用規約",
    privacyLinkText: "プライバシーポリシー",
    newHereNote:
        "初めての方は、メールアドレスとパスワードを入力して「アカウントを作成」を選んでください。",
    afterConnectNote:
        "お使いのクライアントで接続が完了したら、パスワードをどこかに控えておき、このブラウザタブを閉じてください。",
};

export const LOGIN_ERRORS_JA: LoginErrors = {
    googleCancelled:
        "Googleでのサインインがキャンセルされました。もう一度お試しください。",
    googleFailed:
        "Googleでのサインインに失敗しました。もう一度お試しください。",
    invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
    signInFailed: "現在サインインできません。数分後にもう一度お試しください。",
    weakPassword:
        "パスワードが弱すぎます。英字・数字・記号を組み合わせた、より長いパスワードを設定してください。",
    passwordTooLong: "パスワードが長すぎます。72文字以内で設定してください。",
    emailInvalid:
        "メールアドレスの形式が正しくありません。入力ミスがないか確認してください。",
    signUpFailed:
        "アカウントを作成できませんでした。しばらくしてからもう一度お試しください。",
};

export const LOGIN_CLIENT_NOTICE_JA: LoginClientNotice = {
    returnTo: "サインイン後、{host}に戻ります。",
    unknownHost:
        "{host}は、本サービスが把握しているアシスタントではありません。ご自身で{host}から接続を始めた場合にのみ、続行してください。",
    loopback:
        "このコンピューター上で動作しているプログラム（{host}）に戻ります。ご自身でこのプログラムから接続を始めた場合にのみ、続行してください。",
};

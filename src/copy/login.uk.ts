import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_UK: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Увійди, щоб підключитися",
    googleButton: "Продовжити через Google",
    dividerText: "або через електронну пошту",
    emailLabel: "Електронна пошта",
    passwordLabel: "Пароль",
    continueButton: "Продовжити",
    // "погоджуєшся з" governs the instrumental case, so both link texts are
    // in the instrumental rather than the nominative the footer uses.
    consentNote:
        "Продовжуючи, ти підтверджуєш, що тобі щонайменше 16 років, і погоджуєшся з {terms} та {privacy}.",
    termsLinkText: "Умовами використання",
    privacyLinkText: "Політикою приватності",
    newHereNote:
        "Уперше тут? Просто введи свою електронну пошту та пароль — обліковий запис створиться автоматично.",
    afterConnectNote:
        "Після успішного підключення у твоєму клієнті збережи пароль у надійному місці й закрий цю вкладку браузера.",
};

export const LOGIN_ERRORS_UK: LoginErrors = {
    googleCancelled: "Вхід через Google скасовано. Спробуй ще раз.",
    googleFailed: "Не вдалося увійти через Google. Спробуй ще раз.",
};

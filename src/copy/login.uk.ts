import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

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

export const LOGIN_CLIENT_NOTICE_UK: LoginClientNotice = {
    returnTo: "Після входу тебе буде переспрямовано до {host}.",
    unknownHost:
        "{host} — невідомий нам асистент. Продовжуй, лише якщо саме ти зараз підключаєшся з {host}.",
    loopback:
        "Тебе буде переспрямовано до програми, що працює на цьому комп'ютері ({host}). Продовжуй, лише якщо саме з неї ти зараз підключаєшся.",
};

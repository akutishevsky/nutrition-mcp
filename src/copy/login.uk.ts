import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_UK: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Увійди, щоб підключитися",
    googleButton: "Продовжити через Google",
    dividerText: "або через електронну пошту",
    emailLabel: "Електронна пошта",
    passwordLabel: "Пароль",
    signInButton: "Увійти",
    createAccountButton: "Створити акаунт",
    modeGroupAriaLabel: "Акаунт",
    showPasswordLabel: "Показати пароль",
    hidePasswordLabel: "Сховати пароль",
    // "погоджуєшся з" governs the instrumental case, so both link texts are
    // in the instrumental rather than the nominative the footer uses.
    consentNote:
        "Продовжуючи, ти підтверджуєш, що тобі щонайменше 16 років, погоджуєшся з {terms} та {privacy} і даєш згоду на те, щоб ми зберігали записані тобою прийоми їжі, вагу, заміри тіла й алкоголь (це дані про здоров’я).",
    termsLinkText: "Умовами використання",
    privacyLinkText: "Політикою приватності",
    newHereNote:
        "Уперше тут? Введи електронну пошту й пароль, а тоді натисни «Створити акаунт».",
    afterConnectNote:
        "Щойно твій клієнт успішно підключиться, збережи пароль у надійному місці й закрий цю вкладку браузера.",
};

export const LOGIN_ERRORS_UK: LoginErrors = {
    googleCancelled: "Вхід через Google скасовано. Спробуй ще раз.",
    googleFailed: "Не вдалося увійти через Google. Спробуй ще раз.",
    invalidCredentials: "Неправильна електронна пошта або пароль.",
    signInFailed: "Зараз увійти не вдається. Спробуй ще раз за кілька хвилин.",
    weakPassword:
        "Цей пароль надто слабкий. Обери довший пароль, у якому поєднуються літери, цифри й символи.",
    passwordTooLong:
        "Цей пароль задовгий. Обери пароль, не довший за 72 символи.",
    emailInvalid:
        "Ця адреса електронної пошти недійсна. Перевір, чи немає в ній одруківок.",
    signUpFailed: "Не вдалося створити акаунт. Спробуй пізніше.",
};

export const LOGIN_CLIENT_NOTICE_UK: LoginClientNotice = {
    returnTo: "Після входу ти повернешся на {host}.",
    unknownHost:
        "{host} — невідомий нам асистент. Продовжуй, лише якщо саме ти зараз підключаєшся з {host}.",
    loopback:
        "Ти повернешся до застосунку, що працює на цьому комп’ютері ({host}). Продовжуй, лише якщо саме з нього ти зараз підключаєшся.",
    healthSync:
        "Вхід підключає синхронізацію з Apple Health на пристрої, який відкрив цю сторінку. Якщо ти щойно не запустив це сам зі швидкої команди Nutrition MCP на власному iPhone, закрий цю сторінку.",
};

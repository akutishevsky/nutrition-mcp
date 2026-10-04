import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_PL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Zaloguj się i połącz",
    googleButton: "Kontynuuj z Google",
    dividerText: "lub przez e-mail",
    emailLabel: "E-mail",
    passwordLabel: "Hasło",
    signInButton: "Zaloguj się",
    createAccountButton: "Załóż konto",
    modeGroupAriaLabel: "Konto",
    showPasswordLabel: "Pokaż hasło",
    hidePasswordLabel: "Ukryj hasło",
    // {terms}/{privacy} stand mid-sentence after "akceptujesz", so both link
    // texts are in the accusative — Polish inflects them there, and the
    // nominative "Polityka prywatności" would read as a grammatical error.
    consentNote:
        "Kontynuując, potwierdzasz, że masz ukończone 16 lat, akceptujesz {terms} i {privacy} oraz zgadzasz się, abyśmy przechowywali zapisywane przez Ciebie posiłki, wagę, wymiary ciała i spożycie alkoholu, które są danymi dotyczącymi zdrowia.",
    termsLinkText: "Regulamin",
    privacyLinkText: "Politykę prywatności",
    newHereNote:
        "Pierwszy raz tutaj? Wpisz e-mail i hasło, a potem wybierz „Załóż konto”.",
    afterConnectNote:
        "Gdy aplikacja potwierdzi połączenie, zapisz hasło w bezpiecznym miejscu i zamknij tę kartę przeglądarki.",
};

export const LOGIN_ERRORS_PL: LoginErrors = {
    googleCancelled:
        "Logowanie przez Google zostało anulowane. Spróbuj ponownie.",
    googleFailed: "Logowanie przez Google nie powiodło się. Spróbuj ponownie.",
    invalidCredentials: "Nieprawidłowy e-mail lub hasło.",
    signInFailed:
        "Logowanie chwilowo nie działa. Spróbuj ponownie za kilka minut.",
    weakPassword:
        "To hasło jest za słabe. Ustaw dłuższe hasło z literami, cyframi i symbolami.",
    passwordTooLong: "To hasło jest za długie. Może mieć najwyżej 72 znaki.",
    emailInvalid:
        "Ten adres e-mail jest nieprawidłowy. Sprawdź, czy nie ma w nim literówek.",
    signUpFailed: "Nie udało się założyć konta. Spróbuj ponownie później.",
};

export const LOGIN_CLIENT_NOTICE_PL: LoginClientNotice = {
    returnTo: "Po zalogowaniu wrócisz do {host}.",
    unknownHost:
        "{host} nie jest znanym nam asystentem. Kontynuuj tylko wtedy, gdy to Ty rozpoczynasz połączenie z poziomu {host}.",
    loopback:
        "Wrócisz do programu działającego na tym komputerze ({host}). Kontynuuj tylko wtedy, gdy właśnie z niego rozpoczynasz to połączenie.",
    healthSync:
        "Logowanie łączy synchronizację z Apple Health na urządzeniu, na którym otwarto tę stronę. Jeśli nie rozpoczynasz tego właśnie teraz ze skrótu Nutrition MCP na swoim własnym urządzeniu iPhone, zamknij tę stronę.",
};

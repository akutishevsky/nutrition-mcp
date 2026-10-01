import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_PL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Zaloguj się, aby się połączyć",
    googleButton: "Kontynuuj z Google",
    dividerText: "albo użyj e-maila",
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
        "Kontynuując, potwierdzasz, że masz co najmniej 16 lat, akceptujesz {terms} oraz {privacy} i zgadzasz się, abyśmy przechowywali zapisywane przez Ciebie posiłki, wagę i alkohol, które są danymi dotyczącymi zdrowia.",
    termsLinkText: "Regulamin",
    privacyLinkText: "Politykę prywatności",
    newHereNote:
        "Pierwszy raz? Podaj e-mail i hasło, a potem wybierz „Załóż konto”.",
    afterConnectNote:
        "Po udanym połączeniu w Twoim kliencie zapisz hasło w bezpiecznym miejscu i zamknij tę kartę przeglądarki.",
};

export const LOGIN_ERRORS_PL: LoginErrors = {
    googleCancelled:
        "Logowanie przez Google zostało anulowane. Spróbuj ponownie.",
    googleFailed: "Logowanie przez Google nie powiodło się. Spróbuj ponownie.",
    invalidCredentials: "Nieprawidłowy e-mail lub hasło.",
    signInFailed:
        "Logowanie chwilowo nie działa. Spróbuj ponownie za kilka minut.",
    weakPassword:
        "To hasło jest za słabe. Wybierz dłuższe, łączące litery, cyfry i symbole.",
    passwordTooLong:
        "To hasło jest za długie. Wybierz takie, które ma najwyżej 72 znaki.",
    emailInvalid:
        "Ten adres e-mail jest nieprawidłowy. Sprawdź, czy nie ma w nim literówki.",
    signUpFailed: "Nie udało się założyć konta. Spróbuj ponownie później.",
};

export const LOGIN_CLIENT_NOTICE_PL: LoginClientNotice = {
    returnTo: "Po zalogowaniu wrócisz do {host}.",
    unknownHost:
        "Nie rozpoznajemy {host} jako asystenta. Kontynuuj tylko wtedy, gdy to Ty rozpoczynasz połączenie z {host}.",
    loopback:
        "Wrócisz do programu działającego na tym komputerze ({host}). Kontynuuj tylko wtedy, gdy to z niego rozpoczynasz to połączenie.",
};

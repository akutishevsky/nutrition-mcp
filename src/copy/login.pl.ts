import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_PL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Zaloguj się, aby się połączyć",
    googleButton: "Kontynuuj z Google",
    dividerText: "albo użyj e-maila",
    emailLabel: "E-mail",
    passwordLabel: "Hasło",
    continueButton: "Kontynuuj",
    // {terms}/{privacy} stand mid-sentence after "akceptujesz", so both link
    // texts are in the accusative — Polish inflects them there, and the
    // nominative "Polityka prywatności" would read as a grammatical error.
    consentNote:
        "Kontynuując, potwierdzasz, że masz co najmniej 16 lat, i akceptujesz {terms} oraz {privacy}.",
    termsLinkText: "Regulamin",
    privacyLinkText: "Politykę prywatności",
    newHereNote:
        "Pierwszy raz? Po prostu podaj e-mail i hasło — konto utworzy się automatycznie.",
    afterConnectNote:
        "Po udanym połączeniu w Twoim kliencie zapisz hasło w bezpiecznym miejscu i zamknij tę kartę przeglądarki.",
};

export const LOGIN_ERRORS_PL: LoginErrors = {
    googleCancelled:
        "Logowanie przez Google zostało anulowane. Spróbuj ponownie.",
    googleFailed: "Logowanie przez Google nie powiodło się. Spróbuj ponownie.",
};

export const LOGIN_CLIENT_NOTICE_PL: LoginClientNotice = {
    returnTo: "Po zalogowaniu wrócisz do {host}.",
    unknownHost:
        "Nie rozpoznajemy {host} jako asystenta. Kontynuuj tylko wtedy, gdy to Ty rozpoczynasz połączenie z {host}.",
    loopback:
        "Wrócisz do programu działającego na tym komputerze ({host}). Kontynuuj tylko wtedy, gdy to z niego rozpoczynasz to połączenie.",
};

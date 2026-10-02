import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_NL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Log in om verbinding te maken",
    googleButton: "Doorgaan met Google",
    dividerText: "of met e-mail",
    emailLabel: "E-mailadres",
    passwordLabel: "Wachtwoord",
    signInButton: "Inloggen",
    createAccountButton: "Account aanmaken",
    modeGroupAriaLabel: "Account",
    showPasswordLabel: "Wachtwoord tonen",
    hidePasswordLabel: "Wachtwoord verbergen",
    consentNote:
        "Als je doorgaat, bevestig je dat je minstens 16 jaar bent, ga je akkoord met de {terms} en het {privacy} en geef je ons toestemming om de maaltijden, het gewicht en de alcohol die je logt op te slaan. Dat zijn gezondheidsgegevens.",
    termsLinkText: "Gebruiksvoorwaarden",
    privacyLinkText: "Privacybeleid",
    newHereNote:
        "Nieuw hier? Vul je e-mailadres en een wachtwoord in en kies dan ‘Account aanmaken’.",
    afterConnectNote:
        "Is de verbinding in je client gelukt? Bewaar je wachtwoord dan ergens goed en sluit dit browsertabblad.",
};

export const LOGIN_ERRORS_NL: LoginErrors = {
    googleCancelled: "Inloggen met Google is geannuleerd. Probeer het opnieuw.",
    googleFailed: "Inloggen met Google is mislukt. Probeer het opnieuw.",
    invalidCredentials: "Onjuist e-mailadres of wachtwoord.",
    signInFailed:
        "Inloggen lukt op dit moment niet. Probeer het over een paar minuten opnieuw.",
    weakPassword:
        "Dat wachtwoord is te zwak. Kies een langer wachtwoord met een combinatie van letters, cijfers en symbolen.",
    passwordTooLong:
        "Dat wachtwoord is te lang. Kies er een van maximaal 72 tekens.",
    emailInvalid:
        "Dit e-mailadres is ongeldig. Controleer of er een typfout in zit.",
    signUpFailed:
        "We konden je account niet aanmaken. Probeer het later opnieuw.",
};

export const LOGIN_CLIENT_NOTICE_NL: LoginClientNotice = {
    returnTo: "Na het inloggen word je teruggestuurd naar {host}.",
    unknownHost:
        "{host} is geen assistent die we kennen. Ga alleen verder als je de verbinding zelf vanuit {host} hebt gestart.",
    loopback:
        "Je wordt teruggestuurd naar een programma dat op deze computer draait ({host}). Ga alleen verder als je deze verbinding daar zelf hebt gestart.",
};

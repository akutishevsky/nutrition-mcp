import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_NL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Log in om verbinding te maken",
    googleButton: "Doorgaan met Google",
    dividerText: "of gebruik e-mail",
    emailLabel: "E-mail",
    passwordLabel: "Wachtwoord",
    signInButton: "Inloggen",
    createAccountButton: "Account aanmaken",
    consentNote:
        "Als je doorgaat, bevestig je dat je minstens 16 jaar oud bent en ga je akkoord met de {terms} en het {privacy}.",
    termsLinkText: "Gebruiksvoorwaarden",
    privacyLinkText: "Privacybeleid",
    newHereNote:
        "Nieuw hier? Vul je e-mailadres en een wachtwoord in en kies dan ‘Account aanmaken’.",
    afterConnectNote:
        "Als de verbinding in je client is gelukt, bewaar je wachtwoord dan op een veilige plek en sluit dit browsertabblad.",
};

export const LOGIN_ERRORS_NL: LoginErrors = {
    googleCancelled: "Inloggen met Google is geannuleerd. Probeer het opnieuw.",
    googleFailed: "Inloggen met Google is mislukt. Probeer het opnieuw.",
    invalidCredentials: "Verkeerd e-mailadres of wachtwoord.",
    signInFailed:
        "Inloggen werkt op dit moment niet. Probeer het over een paar minuten opnieuw.",
    weakPassword:
        "Dat wachtwoord is te zwak. Kies een langer wachtwoord met een mix van letters, cijfers en symbolen.",
    passwordTooLong:
        "Dat wachtwoord is te lang. Kies er een van hoogstens 72 tekens.",
    emailInvalid: "Dat e-mailadres is ongeldig. Controleer het op typfouten.",
    signUpFailed:
        "We konden je account niet aanmaken. Probeer het later opnieuw.",
};

export const LOGIN_CLIENT_NOTICE_NL: LoginClientNotice = {
    returnTo: "Na het inloggen word je teruggestuurd naar {host}.",
    unknownHost:
        "{host} is geen assistent die we kennen. Ga alleen verder als je zelf vanuit {host} bent begonnen met verbinden.",
    loopback:
        "Je wordt teruggestuurd naar een programma dat op deze computer draait ({host}). Ga alleen verder als je deze verbinding daar zelf hebt gestart.",
};

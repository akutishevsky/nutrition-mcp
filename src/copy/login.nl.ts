import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_NL: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Log in om te verbinden",
    googleButton: "Doorgaan met Google",
    dividerText: "of gebruik e-mail",
    emailLabel: "E-mail",
    passwordLabel: "Wachtwoord",
    continueButton: "Doorgaan",
    consentNote:
        "Als je doorgaat, bevestig je dat je minstens 16 bent en ga je akkoord met de {terms} en het {privacy}.",
    termsLinkText: "Gebruiksvoorwaarden",
    privacyLinkText: "Privacybeleid",
    newHereNote:
        "Nieuw hier? Vul gewoon je e-mailadres en een wachtwoord in — je account wordt automatisch aangemaakt.",
    afterConnectNote:
        "Bewaar je wachtwoord na een geslaagde verbinding in je client op een veilige plek en sluit dit browsertabblad.",
};

export const LOGIN_ERRORS_NL: LoginErrors = {
    googleCancelled: "Inloggen met Google is geannuleerd. Probeer het opnieuw.",
    googleFailed: "Inloggen met Google is mislukt. Probeer het opnieuw.",
};

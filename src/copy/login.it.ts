import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_IT: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Accedi per collegarti",
    googleButton: "Continua con Google",
    dividerText: "oppure usa l'email",
    emailLabel: "Email",
    passwordLabel: "Password",
    continueButton: "Continua",
    consentNote:
        "Continuando, confermi di avere almeno 16 anni e accetti i {terms} e l'{privacy}.",
    termsLinkText: "Termini di servizio",
    privacyLinkText: "Informativa sulla privacy",
    newHereNote:
        "Prima volta qui? Inserisci la tua email e una password — l'account verrà creato automaticamente.",
    afterConnectNote:
        "Una volta completato il collegamento nel tuo client, salva la password in un posto sicuro e chiudi questa scheda del browser.",
};

export const LOGIN_ERRORS_IT: LoginErrors = {
    googleCancelled: "L'accesso con Google è stato annullato. Riprova.",
    googleFailed: "L'accesso con Google non è riuscito. Riprova.",
};

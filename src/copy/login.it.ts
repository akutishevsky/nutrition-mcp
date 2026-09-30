import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_IT: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Accedi per collegarti",
    googleButton: "Continua con Google",
    dividerText: "oppure usa l'email",
    emailLabel: "Email",
    passwordLabel: "Password",
    signInButton: "Accedi",
    createAccountButton: "Crea account",
    consentNote:
        "Continuando, confermi di avere almeno 16 anni, accetti i {terms} e l'{privacy} e acconsenti a che conserviamo i pasti, il peso e l'alcol che registri, che sono dati sanitari.",
    termsLinkText: "Termini di servizio",
    privacyLinkText: "Informativa sulla privacy",
    newHereNote:
        "Prima volta qui? Inserisci la tua email e una password, poi scegli «Crea account».",
    afterConnectNote:
        "Una volta completato il collegamento nel tuo client, salva la password in un posto sicuro e chiudi questa scheda del browser.",
};

export const LOGIN_ERRORS_IT: LoginErrors = {
    googleCancelled: "L'accesso con Google è stato annullato. Riprova.",
    googleFailed: "L'accesso con Google non è riuscito. Riprova.",
    invalidCredentials: "Email o password errate.",
    signInFailed:
        "L'accesso non funziona in questo momento. Riprova tra qualche minuto.",
    weakPassword:
        "Questa password è troppo debole. Scegline una più lunga che combini lettere, numeri e simboli.",
    passwordTooLong:
        "Questa password è troppo lunga. Scegline una di massimo 72 caratteri.",
    emailInvalid:
        "Questo indirizzo email non è valido. Controlla che non ci siano errori di battitura.",
    signUpFailed:
        "Non siamo riusciti a creare il tuo account. Riprova più tardi.",
};

export const LOGIN_CLIENT_NOTICE_IT: LoginClientNotice = {
    returnTo: "Dopo l'accesso ti riporteremo a {host}.",
    unknownHost:
        "{host} non è un assistente che conosciamo. Continua solo se la connessione l'hai avviata tu da {host}.",
    loopback:
        "Ti riporteremo a un programma in esecuzione su questo computer ({host}). Continua solo se questa connessione l'hai avviata tu da lì.",
};

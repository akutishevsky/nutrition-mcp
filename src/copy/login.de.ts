import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_DE: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Anmelden, um die Verbindung herzustellen",
    googleButton: "Weiter mit Google",
    dividerText: "oder E-Mail verwenden",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    signInButton: "Anmelden",
    createAccountButton: "Konto erstellen",
    consentNote:
        "Wenn du fortfährst, bestätigst du, mindestens 16 Jahre alt zu sein, und stimmst den {terms} und der {privacy} zu.",
    termsLinkText: "Nutzungsbedingungen",
    privacyLinkText: "Datenschutzerklärung",
    newHereNote:
        "Neu hier? Gib deine E-Mail-Adresse und ein Passwort ein und wähl dann „Konto erstellen“.",
    afterConnectNote:
        "Speichere dein Passwort nach erfolgreicher Verbindung in deinem Client an einem sicheren Ort und schließe diesen Browser-Tab.",
};

export const LOGIN_ERRORS_DE: LoginErrors = {
    googleCancelled:
        "Die Anmeldung mit Google wurde abgebrochen. Bitte versuche es erneut.",
    googleFailed:
        "Die Anmeldung mit Google ist fehlgeschlagen. Bitte versuche es erneut.",
    invalidCredentials: "Falsche E-Mail-Adresse oder falsches Passwort.",
    signInFailed:
        "Die Anmeldung funktioniert gerade nicht. Bitte versuche es in ein paar Minuten erneut.",
    weakPassword:
        "Dieses Passwort ist zu schwach. Wähl ein längeres, das Buchstaben, Ziffern und Sonderzeichen mischt.",
    passwordTooLong:
        "Dieses Passwort ist zu lang. Wähl eines mit höchstens 72 Zeichen.",
    emailInvalid: "Diese E-Mail-Adresse ist ungültig. Prüf sie auf Tippfehler.",
    signUpFailed:
        "Wir konnten dein Konto nicht erstellen. Bitte versuche es später erneut.",
};

export const LOGIN_CLIENT_NOTICE_DE: LoginClientNotice = {
    returnTo: "Nach der Anmeldung wirst du zu {host} zurückgeleitet.",
    unknownHost:
        "{host} ist kein Assistent, den wir kennen. Fahre nur fort, wenn du die Verbindung selbst von {host} aus gestartet hast.",
    loopback:
        "Du wirst zu einem Programm zurückgeleitet, das auf diesem Computer läuft ({host}). Fahre nur fort, wenn du diese Verbindung selbst von dort aus gestartet hast.",
};

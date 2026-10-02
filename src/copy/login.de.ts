import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_DE: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Zum Verbinden anmelden",
    googleButton: "Weiter mit Google",
    dividerText: "oder mit E-Mail",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    signInButton: "Anmelden",
    createAccountButton: "Konto erstellen",
    modeGroupAriaLabel: "Konto",
    showPasswordLabel: "Passwort anzeigen",
    hidePasswordLabel: "Passwort verbergen",
    consentNote:
        "Wenn du fortfährst, bestätigst du, dass du mindestens 16 Jahre alt bist, stimmst den {terms} und der {privacy} zu und willigst ein, dass wir die von dir erfassten Mahlzeiten-, Gewichts-, Körpermaß- und Alkoholangaben speichern – das sind Gesundheitsdaten.",
    termsLinkText: "Nutzungsbedingungen",
    privacyLinkText: "Datenschutzerklärung",
    newHereNote:
        "Neu hier? Gib deine E-Mail-Adresse und ein Passwort ein und wähl dann „Konto erstellen“.",
    afterConnectNote:
        "Sobald die Verbindung in deinem Client steht, speichere dein Passwort irgendwo ab und schließ diesen Browser-Tab.",
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
        "Dieses Passwort ist zu schwach. Wähl ein längeres mit einer Mischung aus Buchstaben, Ziffern und Sonderzeichen.",
    passwordTooLong:
        "Dieses Passwort ist zu lang. Wähl eines mit höchstens 72 Zeichen.",
    emailInvalid: "Diese E-Mail-Adresse ist ungültig. Prüf sie auf Tippfehler.",
    signUpFailed:
        "Wir konnten dein Konto nicht erstellen. Bitte versuche es später erneut.",
};

export const LOGIN_CLIENT_NOTICE_DE: LoginClientNotice = {
    returnTo: "Nach der Anmeldung wirst du zu {host} zurückgeleitet.",
    unknownHost:
        "{host} ist kein Assistent, den wir kennen. Fahr nur dann fort, wenn du die Verbindung selbst von {host} aus gestartet hast.",
    loopback:
        "Du wirst zu einem Programm zurückgeleitet, das auf diesem Computer läuft ({host}). Fahr nur dann fort, wenn du diese Verbindung selbst von dort aus gestartet hast.",
};

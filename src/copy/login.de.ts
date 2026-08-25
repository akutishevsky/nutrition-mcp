import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_DE: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Anmelden, um zu verbinden",
    googleButton: "Weiter mit Google",
    dividerText: "oder E-Mail verwenden",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    continueButton: "Weiter",
    consentNote:
        "Mit dem Fortfahren bestätigst du, mindestens 16 Jahre alt zu sein, und stimmst den {terms} und der {privacy} zu.",
    termsLinkText: "Nutzungsbedingungen",
    privacyLinkText: "Datenschutzerklärung",
    newHereNote:
        "Neu hier? Gib einfach deine E-Mail-Adresse und ein Passwort ein — ein Konto wird automatisch erstellt.",
    afterConnectNote:
        "Speichere dein Passwort nach erfolgreicher Verbindung in deinem Client an einem sicheren Ort und schließe diesen Browser-Tab.",
};

export const LOGIN_ERRORS_DE: LoginErrors = {
    googleCancelled:
        "Die Anmeldung mit Google wurde abgebrochen. Bitte versuch es erneut.",
    googleFailed:
        "Die Anmeldung mit Google ist fehlgeschlagen. Bitte versuch es erneut.",
};

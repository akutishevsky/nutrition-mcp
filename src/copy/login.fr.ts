import type { LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_FR: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Connecte-toi pour autoriser l'accès",
    googleButton: "Continuer avec Google",
    dividerText: "ou utilise ton e-mail",
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    continueButton: "Continuer",
    consentNote:
        "En continuant, tu confirmes avoir au moins 16 ans et tu acceptes les {terms} et la {privacy}.",
    termsLinkText: "Conditions d'utilisation",
    privacyLinkText: "Politique de confidentialité",
    newHereNote:
        "Première visite ? Saisis simplement ton e-mail et un mot de passe — le compte sera créé automatiquement.",
    afterConnectNote:
        "Une fois la connexion établie dans ton client, conserve ton mot de passe en lieu sûr et ferme cet onglet du navigateur.",
};

export const LOGIN_ERRORS_FR: LoginErrors = {
    googleCancelled: "La connexion avec Google a été annulée. Réessaie.",
    googleFailed: "La connexion avec Google a échoué. Réessaie.",
};

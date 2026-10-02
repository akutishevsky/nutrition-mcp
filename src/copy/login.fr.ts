import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_FR: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Connecte-toi pour autoriser l'accès",
    googleButton: "Continuer avec Google",
    dividerText: "ou avec ton e-mail",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    signInButton: "Se connecter",
    createAccountButton: "Créer un compte",
    consentNote:
        "En continuant, tu confirmes avoir au moins 16 ans, tu acceptes les {terms} et la {privacy}, et tu consens à ce que nous conservions les repas, le poids, les mensurations et l'alcool que tu enregistres, qui relèvent des données de santé.",
    termsLinkText: "Conditions d'utilisation",
    privacyLinkText: "Politique de confidentialité",
    newHereNote:
        "Pour ta première visite, saisis ton e-mail et un mot de passe, puis choisis Créer un compte.",
    afterConnectNote:
        "Une fois la connexion réussie dans ton client, garde ton mot de passe en lieu sûr et ferme cet onglet du navigateur.",
    modeGroupAriaLabel: "Compte",
    showPasswordLabel: "Afficher le mot de passe",
    hidePasswordLabel: "Masquer le mot de passe",
};

export const LOGIN_ERRORS_FR: LoginErrors = {
    googleCancelled: "La connexion avec Google a été annulée. Réessaie.",
    googleFailed: "La connexion avec Google a échoué. Réessaie.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    signInFailed:
        "La connexion est momentanément indisponible. Réessaie dans quelques minutes.",
    weakPassword:
        "Ce mot de passe est trop faible. Choisis-en un plus long qui mélange lettres, chiffres et symboles.",
    passwordTooLong:
        "Ce mot de passe est trop long. Choisis-en un de 72 caractères maximum.",
    emailInvalid:
        "Cette adresse e-mail n'est pas valide. Vérifie qu'il n'y a pas de faute de frappe.",
    signUpFailed: "Impossible de créer ton compte. Réessaie plus tard.",
};

export const LOGIN_CLIENT_NOTICE_FR: LoginClientNotice = {
    returnTo: "Après ta connexion, nous te renverrons vers {host}.",
    unknownHost:
        "{host} ne fait pas partie des assistants que nous connaissons. Ne continue que si tu as toi-même lancé la connexion depuis {host}.",
    loopback:
        "Nous te renverrons vers un programme qui tourne sur cet ordinateur ({host}). Ne continue que si tu as lancé cette connexion depuis ce programme.",
};

import type { LoginClientNotice, LoginDoc, LoginErrors } from "./login.js";

export const LOGIN_FR: LoginDoc = {
    title: "Nutrition MCP",
    subtitle: "Connecte-toi pour autoriser l'accès",
    googleButton: "Continuer avec Google",
    dividerText: "ou utilise ton e-mail",
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    signInButton: "Se connecter",
    createAccountButton: "Créer un compte",
    consentNote:
        "En continuant, tu confirmes avoir au moins 16 ans, tu acceptes les {terms} et la {privacy}, et tu consens à ce que nous conservions les repas, le poids et l'alcool que tu enregistres, qui sont des données de santé.",
    termsLinkText: "Conditions d'utilisation",
    privacyLinkText: "Politique de confidentialité",
    newHereNote:
        "Première visite ? Saisis ton e-mail et un mot de passe, puis choisis « Créer un compte ».",
    afterConnectNote:
        "Une fois la connexion établie dans ton client, conserve ton mot de passe en lieu sûr et ferme cet onglet du navigateur.",
    modeGroupAriaLabel: "Compte",
    showPasswordLabel: "Afficher le mot de passe",
    hidePasswordLabel: "Masquer le mot de passe",
};

export const LOGIN_ERRORS_FR: LoginErrors = {
    googleCancelled: "La connexion avec Google a été annulée. Réessaie.",
    googleFailed: "La connexion avec Google a échoué. Réessaie.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    signInFailed:
        "La connexion ne fonctionne pas pour le moment. Réessaie dans quelques minutes.",
    weakPassword:
        "Ce mot de passe est trop faible. Choisis-en un plus long qui mélange lettres, chiffres et symboles.",
    passwordTooLong:
        "Ce mot de passe est trop long. Choisis-en un de 72 caractères maximum.",
    emailInvalid:
        "Cette adresse e-mail n'est pas valide. Vérifie qu'elle ne contient pas de faute de frappe.",
    signUpFailed: "Impossible de créer ton compte. Réessaie plus tard.",
};

export const LOGIN_CLIENT_NOTICE_FR: LoginClientNotice = {
    returnTo: "Après ta connexion, nous te renverrons vers {host}.",
    unknownHost:
        "{host} n'est pas un assistant que nous connaissons. Ne continue que si c'est toi qui as lancé la connexion depuis {host}.",
    loopback:
        "Nous te renverrons vers un programme qui tourne sur cet ordinateur ({host}). Ne continue que si c'est depuis ce programme que tu as lancé cette connexion.",
};

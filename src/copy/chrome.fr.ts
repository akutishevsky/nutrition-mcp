import type { ChromeCopy } from "./chrome.js";

export const CHROME_FR: ChromeCopy = {
    skipToContent: "Aller au contenu",
    brandHomeAriaLabel: "Accueil Nutrition MCP",

    nav: {
        how: "Comment ça marche",
        install: "Installation",
        tools: "Outils",
        examples: "Exemples",
        liveStats: "Stats en direct",
        liveStatsBadgeLabel: {
            one: "nouveau repas enregistré depuis ton arrivée",
            other: "nouveaux repas enregistrés depuis ton arrivée",
        },
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Navigation principale",
        menu: "Menu",
        footer: "Pied de page",
    },

    githubAriaLabel: "Dépôt GitHub",
    changeLanguageAriaLabel: "Changer de langue",
    languageTitle: "Langue",
    theme: {
        ariaLabel: "Changer de thème",
        title: "Thème",
        system: "Système",
        light: "Clair",
        dark: "Sombre",
    },
    connectCta: "Connecter",
    openMenuAriaLabel: "Ouvrir le menu",
    closeMenuAriaLabel: "Fermer le menu",

    menu: {
        github: "GitHub",
    },

    footer: {
        tools: "Outils",
        troubleshooting: "Dépannage",
        alternatives: "Alternatives",
        howIBuiltThis: "Comment je l'ai conçu",
        demo: "Démo",
        github: "GitHub",
        contact: "Contact",
        privacyPolicy: "Politique de confidentialité",
        termsOfService: "Conditions d'utilisation",
        note: "Gratuit et open source. Les valeurs nutritionnelles sont des estimations, pas des conseils médicaux.",
    },

    consent: {
        title: "Cookies de mesure d'audience.",
        body: "Avec ton accord, Google Analytics compte les visites et Microsoft Clarity enregistre les clics et le défilement sous forme de rediffusions de session. Cela nous permet de voir quelles pages sont utiles et où ça coince. Aucun des deux ne se charge tant que tu n'as pas accepté.",
        accept: "Accepter",
        reject: "Refuser",
        settings: "Paramètres des cookies",
    },
};

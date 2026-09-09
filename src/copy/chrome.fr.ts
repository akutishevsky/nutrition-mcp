import type { ChromeCopy } from "./chrome.js";

export const CHROME_FR: ChromeCopy = {
    skipToContent: "Aller au contenu",
    brandHomeAriaLabel: "Accueil Nutrition MCP",

    nav: {
        how: "Comment",
        tools: "Outils",
        examples: "Exemples",
        liveStats: "En direct",
        liveStatsBadgeLabel: {
            one: "nouveau repas enregistré depuis l'ouverture de la page",
            other: "nouveaux repas enregistrés depuis l'ouverture de la page",
        },
        donate: "Soutenir",
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
        howSmall: "3 étapes",
        installSmall: "moins d'une minute",
        toolsSmall: "36 outils",
        examplesSmall: "démos en direct",
        liveStatsSmall: "depuis l'ouverture",
        alternatives: "Alternatives",
        alternativesSmall: "changer d'appli",
        support: "Soutien",
        contact: "Contact",
        github: "GitHub",
        privacy: "Confidentialité",
        terms: "Conditions",
        connectInMinute: "Connecte-toi en une minute",
    },

    footer: {
        blurb: "Suivi nutritionnel gratuit et open source, en parlant à ton IA. Conçu et géré par une seule personne, akutishevsky.",
        copyEndpointAriaLabel: "Copier l'adresse du serveur",
        social: { github: "GitHub", patreon: "Patreon", email: "E-mail" },
        product: {
            heading: "Produit",
            connect: "Connecter",
            onboarding: "Les cinq premières minutes",
            examples: "Exemples",
            live: "Stats en direct",
            tools: "Les 36 outils de nutrition",
            alternatives: "Alternatives à MyFitnessPal et cie",
        },
        openSource: {
            heading: "Open source",
            source: "Code source sur GitHub",
            selfHost: "Guide d'auto-hébergement",
            bug: "Signaler un bug",
            llms: "llms.txt",
            licence: "Licence MIT",
        },
        yourData: {
            heading: "Tes données",
            privacy: "Politique de confidentialité",
            terms: "Conditions d'utilisation",
            exportCsv: "Exporter en CSV",
            deleteAccount: "Supprimer le compte",
            patreon: "Soutenir sur Patreon",
            contact: "Contact",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Données de codes-barres d'Open Food Facts",
        bottomPrivacy: "Confidentialité",
        bottomTerms: "Conditions",
        bottomAlternatives: "Alternatives",
        disclaimer:
            "Les valeurs nutritionnelles sont des estimations, pas des conseils médicaux.",
    },
};

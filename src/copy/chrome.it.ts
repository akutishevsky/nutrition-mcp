import type { ChromeCopy } from "./chrome.js";

export const CHROME_IT: ChromeCopy = {
    skipToContent: "Vai al contenuto",
    brandHomeAriaLabel: "Home di Nutrition MCP",

    nav: {
        how: "Come funziona",
        tools: "Strumenti",
        examples: "Esempi",
        liveStats: "Live",
        liveStatsBadgeLabel: {
            one: "nuovo pasto registrato da quando hai aperto la pagina",
            other: "nuovi pasti registrati da quando hai aperto la pagina",
        },
        donate: "Dona",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Navigazione principale",
        menu: "Menu",
        footer: "Piè di pagina",
    },

    githubAriaLabel: "Repository GitHub",
    changeLanguageAriaLabel: "Cambia lingua",
    languageTitle: "Lingua",
    theme: {
        ariaLabel: "Cambia tema",
        title: "Tema",
        system: "Sistema",
        light: "Chiaro",
        dark: "Scuro",
    },
    connectCta: "Connetti",
    openMenuAriaLabel: "Apri il menu",
    closeMenuAriaLabel: "Chiudi il menu",

    menu: {
        howSmall: "3 passaggi",
        installSmall: "meno di un minuto",
        toolsSmall: "36 strumenti",
        examplesSmall: "demo live",
        liveStatsSmall: "da quando hai aperto la pagina",
        alternatives: "Alternative",
        alternativesSmall: "cambio app",
        support: "Supporto",
        contact: "Contatti",
        github: "GitHub",
        privacy: "Privacy",
        terms: "Termini",
        connectInMinute: "Connetti in un minuto",
    },

    footer: {
        blurb: "Tracciamento nutrizionale gratuito e open source, parlando con la tua IA. Creato e gestito da una sola persona, akutishevsky.",
        copyEndpointAriaLabel: "Copia l'endpoint",
        social: { github: "GitHub", patreon: "Patreon", email: "Email" },
        product: {
            heading: "Prodotto",
            connect: "Connetti",
            onboarding: "I primi cinque minuti",
            examples: "Esempi",
            live: "Statistiche live",
            tools: "Tutti i 36 strumenti per la nutrizione",
            alternatives: "Alternative a MyFitnessPal e simili",
        },
        openSource: {
            heading: "Open source",
            source: "Codice sorgente su GitHub",
            selfHost: "Guida al self-hosting",
            bug: "Segnala un bug",
            llms: "llms.txt",
            licence: "Licenza MIT",
        },
        yourData: {
            heading: "I tuoi dati",
            privacy: "Informativa sulla privacy",
            terms: "Termini di servizio",
            exportCsv: "Esporta in CSV",
            deleteAccount: "Elimina l'account",
            patreon: "Sostieni su Patreon",
            contact: "Contatti",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Dati dei codici a barre da Open Food Facts",
        bottomPrivacy: "Privacy",
        bottomTerms: "Termini",
        bottomAlternatives: "Alternative",
        disclaimer: "I valori nutrizionali sono stime, non consigli medici.",
    },
};

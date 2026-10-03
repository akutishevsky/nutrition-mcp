import type { ChromeCopy } from "./chrome.js";

export const CHROME_IT: ChromeCopy = {
    skipToContent: "Vai al contenuto",
    brandHomeAriaLabel: "Home di Nutrition MCP",

    nav: {
        how: "Come funziona",
        install: "Installazione",
        tools: "Strumenti",
        examples: "Esempi",
        liveStats: "Statistiche live",
        liveStatsBadgeLabel: {
            one: "nuovo pasto registrato da quando hai aperto la pagina",
            other: "nuovi pasti registrati da quando hai aperto la pagina",
        },
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
        github: "GitHub",
    },

    footer: {
        tools: "Strumenti",
        troubleshooting: "Risoluzione dei problemi",
        appleHealth: "Apple Health",
        alternatives: "Alternative",
        howIBuiltThis: "Come l'ho realizzato",
        demo: "Demo",
        github: "GitHub",
        contact: "Contatti",
        privacyPolicy: "Informativa sulla privacy",
        termsOfService: "Termini di servizio",
        note: "Gratuito e open source. I valori nutrizionali sono stime, non consigli medici.",
    },

    consent: {
        title: "Cookie analitici.",
        body: "Con il tuo consenso, Google Analytics conta le visite e Microsoft Clarity salva clic e scorrimento come registrazioni di sessione, così capiamo quali pagine sono utili e dove le persone si bloccano. Nessuno dei due si carica finché non accetti.",
        accept: "Accetta",
        reject: "Rifiuta",
        settings: "Impostazioni cookie",
    },
};

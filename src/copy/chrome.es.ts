import type { ChromeCopy } from "./chrome.js";

export const CHROME_ES: ChromeCopy = {
    skipToContent: "Saltar al contenido",
    brandHomeAriaLabel: "Inicio de Nutrition MCP",

    nav: {
        how: "Cómo funciona",
        install: "Instalación",
        tools: "Herramientas",
        examples: "Ejemplos",
        liveStats: "Estadísticas en vivo",
        liveStatsBadgeLabel: {
            one: "nuevo registro de comida desde que abriste la página",
            other: "nuevos registros de comida desde que abriste la página",
        },
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Navegación principal",
        menu: "Menú",
        footer: "Pie de página",
    },

    githubAriaLabel: "Repositorio de GitHub",
    changeLanguageAriaLabel: "Cambiar idioma",
    languageTitle: "Idioma",
    theme: {
        ariaLabel: "Cambiar tema",
        title: "Tema",
        system: "Sistema",
        light: "Claro",
        dark: "Oscuro",
    },
    connectCta: "Conectar",
    openMenuAriaLabel: "Abrir menú",
    closeMenuAriaLabel: "Cerrar menú",

    menu: {
        howSmall: "3 pasos",
        installSmall: "en menos de un minuto",
        toolsSmall: "36 herramientas",
        examplesSmall: "demos en vivo",
        liveStatsSmall: "desde que abriste la página",
        alternatives: "Alternativas",
        alternativesSmall: "cambiar de app",
        support: "Apoyo",
        contact: "Contacto",
        github: "GitHub",
        privacy: "Privacidad",
        terms: "Términos",
        connectInMinute: "Conéctate en un minuto",
    },

    footer: {
        tools: "Herramientas",
        alternatives: "Alternativas",
        howIBuiltThis: "Cómo lo construí",
        demo: "Demo",
        github: "GitHub",
        contact: "Contacto",
        privacyPolicy: "Política de privacidad",
        termsOfService: "Términos de servicio",
        note: "Gratis y de código abierto. Las cifras de nutrición son estimaciones, no son un consejo médico.",
    },

    consent: {
        title: "Cookies de analítica.",
        body: "Con tu permiso, Google Analytics y Microsoft Clarity nos muestran qué páginas ayudan y dónde se atasca la gente. No se carga nada hasta que aceptes.",
        accept: "Aceptar",
        reject: "Rechazar",
        settings: "Configuración de cookies",
    },
};

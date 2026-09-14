import type { ChromeCopy } from "./chrome.js";

export const CHROME_ES: ChromeCopy = {
    skipToContent: "Saltar al contenido",
    brandHomeAriaLabel: "Inicio de Nutrition MCP",

    nav: {
        how: "Cómo funciona",
        tools: "Herramientas",
        examples: "Ejemplos",
        liveStats: "Estadísticas en vivo",
        liveStatsBadgeLabel: {
            one: "nuevo registro de comida desde que abriste la página",
            other: "nuevos registros de comida desde que abriste la página",
        },
        support: "Apoyo",
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
        toolsSmall: "36 herramientas",
        examplesSmall: "chats reales",
        liveStatsSmall: "desde que abriste la página",
        alternatives: "Alternativas",
        contact: "Contacto",
        github: "GitHub",
        privacy: "Privacidad",
        terms: "Términos",
        connectInMinute: "Conéctate en un minuto",
    },

    footer: {
        blurb: "Seguimiento de nutrición gratuito y de código abierto hablando con tu IA. Creado y mantenido por una sola persona, akutishevsky.",
        copyEndpointAriaLabel: "Copiar endpoint",
        social: { github: "GitHub", patreon: "Patreon", email: "Correo" },
        product: {
            heading: "Producto",
            connect: "Conectar",
            onboarding: "Los primeros cinco minutos",
            examples: "Ejemplos",
            live: "Estadísticas en vivo",
            tools: "Las 36 herramientas de nutrición",
            alternatives: "Alternativas a MyFitnessPal y compañía",
            contact: "Contacto",
        },
        openSource: {
            heading: "Código abierto",
            source: "Código en GitHub",
            selfHost: "Guía de autoalojamiento",
            bug: "Informar de un error",
            llms: "llms.txt",
            licence: "Licencia MIT",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Datos de códigos de barras de Open Food Facts",
        bottomPrivacy: "Privacidad",
        bottomTerms: "Términos",
        bottomAlternatives: "Alternativas",
        disclaimer:
            "Las cifras de nutrición son estimaciones, no son un consejo médico.",
    },
};

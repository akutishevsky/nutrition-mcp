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
        github: "GitHub",
    },

    footer: {
        tools: "Herramientas",
        troubleshooting: "Solución de problemas",
        alternatives: "Alternativas",
        howIBuiltThis: "Cómo lo hice",
        demo: "Demo",
        github: "GitHub",
        contact: "Contacto",
        privacyPolicy: "Política de privacidad",
        termsOfService: "Términos de servicio",
        note: "Gratis y de código abierto. Las cifras nutricionales son estimaciones, no consejo médico.",
    },

    consent: {
        title: "Cookies analíticas.",
        body: "Con tu permiso, Google Analytics cuenta las visitas y Microsoft Clarity guarda los clics y el desplazamiento como grabaciones de sesión, para que sepamos qué páginas son útiles y dónde se atasca la gente. Ninguno de los dos se carga hasta que aceptes.",
        accept: "Aceptar",
        reject: "Rechazar",
        settings: "Configuración de cookies",
    },
};

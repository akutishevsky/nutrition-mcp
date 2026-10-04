import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_ES: HealthSyncCopy = {
    opening: {
        title: "Abriendo Atajos…",
        heading: "Abriendo Atajos…",
        body: "Has iniciado sesión. El atajo Nutrition MCP Health se está abriendo para terminar de conectar la sincronización con Apple Health. Si no se abre solo, toca el botón.",
        button: "Abrir Atajos",
        note: "Cuando el atajo indique que está conectado, puedes cerrar esta página.",
    },
    errors: {
        expired: {
            title: "Enlace caducado",
            heading: "Este enlace ha caducado",
            body: "Un enlace de conexión funciona una sola vez y solo durante 30 minutos. Vuelve a ejecutar el atajo Nutrition MCP Health en tu iPhone para obtener uno nuevo.",
        },
        signInFailed: {
            title: "No se pudo conectar",
            heading: "No se pudo completar el inicio de sesión",
            body: "La sincronización con Apple Health no se ha conectado. Vuelve a ejecutar el atajo Nutrition MCP Health en tu iPhone e inicia sesión en la página que abre.",
        },
        generic: {
            title: "Algo ha salido mal",
            heading: "Algo ha salido mal",
            body: "La sincronización con Apple Health no se ha conectado. Espera un momento y vuelve a ejecutar el atajo Nutrition MCP Health en tu iPhone.",
        },
    },
};

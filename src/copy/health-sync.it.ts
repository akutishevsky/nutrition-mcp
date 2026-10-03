import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_IT: HealthSyncCopy = {
    opening: {
        title: "Apertura di Comandi Rapidi…",
        heading: "Apertura di Comandi Rapidi…",
        body: "Hai effettuato l'accesso. Si sta aprendo il comando rapido Nutrition MCP Health per completare il collegamento della sincronizzazione con Apple Health. Se non si apre da solo, tocca il pulsante.",
        button: "Apri Comandi Rapidi",
        note: "Quando il comando rapido conferma il collegamento, puoi chiudere questa pagina.",
    },
    errors: {
        expired: {
            title: "Link scaduto",
            heading: "Questo link è scaduto",
            body: "Un link di collegamento funziona una sola volta e solo per 30 minuti. Esegui di nuovo il comando rapido Nutrition MCP Health sul tuo iPhone per ottenerne uno nuovo.",
        },
        signInFailed: {
            title: "Collegamento non riuscito",
            heading: "Non è stato possibile completare l'accesso",
            body: "La sincronizzazione con Apple Health non è stata collegata. Esegui di nuovo il comando rapido Nutrition MCP Health sul tuo iPhone e accedi dalla pagina che apre.",
        },
        generic: {
            title: "Qualcosa è andato storto",
            heading: "Qualcosa è andato storto",
            body: "La sincronizzazione con Apple Health non è stata collegata. Attendi un momento, poi esegui di nuovo il comando rapido Nutrition MCP Health sul tuo iPhone.",
        },
    },
};

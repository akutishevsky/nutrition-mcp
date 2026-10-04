import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_FR: HealthSyncCopy = {
    opening: {
        title: "Ouverture de Raccourcis…",
        heading: "Ouverture de Raccourcis…",
        body: "Connexion réussie. Le raccourci Nutrition MCP Health s'ouvre pour terminer la connexion de la synchronisation avec Apple Health. S'il ne s'ouvre pas tout seul, touche le bouton.",
        button: "Ouvrir Raccourcis",
        note: "Une fois que le raccourci indique que la connexion est établie, tu peux fermer cette page.",
    },
    errors: {
        expired: {
            title: "Lien expiré",
            heading: "Ce lien a expiré",
            body: "Un lien de connexion ne fonctionne qu'une fois et seulement pendant 30 minutes. Relance le raccourci Nutrition MCP Health sur ton iPhone pour en obtenir un nouveau.",
        },
        signInFailed: {
            title: "Connexion impossible",
            heading: "La connexion n'a pas pu aboutir",
            body: "La synchronisation avec Apple Health n'a pas été activée. Relance le raccourci Nutrition MCP Health sur ton iPhone et connecte-toi sur la page qu'il ouvre.",
        },
        generic: {
            title: "Un problème est survenu",
            heading: "Un problème est survenu",
            body: "La synchronisation avec Apple Health n'a pas été activée. Attends un instant, puis relance le raccourci Nutrition MCP Health sur ton iPhone.",
        },
    },
};

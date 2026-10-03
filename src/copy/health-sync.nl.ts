import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_NL: HealthSyncCopy = {
    opening: {
        title: "Opdrachten wordt geopend…",
        heading: "Opdrachten wordt geopend…",
        body: "Je bent ingelogd. De opdracht Nutrition MCP Health wordt geopend om het koppelen van de synchronisatie met Apple Health af te ronden. Opent hij niet vanzelf, tik dan op de knop.",
        button: "Open Opdrachten",
        note: "Zodra de opdracht meldt dat de koppeling klaar is, kun je deze pagina sluiten.",
    },
    errors: {
        expired: {
            title: "Link verlopen",
            heading: "Deze link is verlopen",
            body: "Een koppellink werkt maar één keer en maar 30 minuten. Voer de opdracht Nutrition MCP Health op je iPhone opnieuw uit voor een nieuwe.",
        },
        signInFailed: {
            title: "Koppelen mislukt",
            heading: "Het inloggen kon niet worden afgerond",
            body: "De synchronisatie met Apple Health is niet gekoppeld. Voer de opdracht Nutrition MCP Health op je iPhone opnieuw uit en log in op de pagina die hij opent.",
        },
        generic: {
            title: "Er ging iets mis",
            heading: "Er ging iets mis",
            body: "De synchronisatie met Apple Health is niet gekoppeld. Wacht even en voer daarna de opdracht Nutrition MCP Health op je iPhone opnieuw uit.",
        },
    },
};

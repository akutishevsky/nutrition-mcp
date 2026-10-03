import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_DE: HealthSyncCopy = {
    opening: {
        title: "Kurzbefehle wird geöffnet …",
        heading: "Kurzbefehle wird geöffnet …",
        body: "Du bist angemeldet. Der Kurzbefehl Nutrition MCP Health öffnet sich jetzt, um die Synchronisierung mit Apple Health fertig zu verbinden. Falls er sich nicht von selbst öffnet, tippe auf die Schaltfläche.",
        button: "Kurzbefehle öffnen",
        note: "Sobald der Kurzbefehl meldet, dass die Verbindung steht, kannst du diese Seite schließen.",
    },
    errors: {
        expired: {
            title: "Link abgelaufen",
            heading: "Dieser Link ist abgelaufen",
            body: "Ein Verbindungslink funktioniert nur einmal und nur 30 Minuten lang. Führe den Kurzbefehl Nutrition MCP Health auf deinem iPhone erneut aus, um einen neuen zu bekommen.",
        },
        signInFailed: {
            title: "Verbindung fehlgeschlagen",
            heading: "Die Anmeldung konnte nicht abgeschlossen werden",
            body: "Die Synchronisierung mit Apple Health wurde nicht verbunden. Führe den Kurzbefehl Nutrition MCP Health auf deinem iPhone erneut aus und melde dich auf der Seite an, die er öffnet.",
        },
        generic: {
            title: "Etwas ist schiefgelaufen",
            heading: "Etwas ist schiefgelaufen",
            body: "Die Synchronisierung mit Apple Health wurde nicht verbunden. Warte einen Moment und führe dann den Kurzbefehl Nutrition MCP Health auf deinem iPhone erneut aus.",
        },
    },
};

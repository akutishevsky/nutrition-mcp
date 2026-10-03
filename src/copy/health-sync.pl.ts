import type { HealthSyncCopy } from "./health-sync.js";

export const HEALTH_SYNC_PL: HealthSyncCopy = {
    opening: {
        title: "Otwieranie aplikacji Skróty…",
        heading: "Otwieranie aplikacji Skróty…",
        body: "Logowanie się udało. Otwiera się skrót Nutrition MCP Health, który dokończy łączenie synchronizacji z Apple Health. Jeśli nie otworzy się sam, stuknij przycisk.",
        button: "Otwórz aplikację Skróty",
        note: "Gdy skrót potwierdzi połączenie, możesz zamknąć tę stronę.",
    },
    errors: {
        expired: {
            title: "Link wygasł",
            heading: "Ten link wygasł",
            body: "Link do połączenia działa tylko raz i tylko przez 30 minut. Uruchom ponownie skrót Nutrition MCP Health na telefonie iPhone, aby dostać nowy.",
        },
        signInFailed: {
            title: "Nie udało się połączyć",
            heading: "Nie udało się dokończyć logowania",
            body: "Synchronizacja z Apple Health nie została połączona. Uruchom ponownie skrót Nutrition MCP Health na telefonie iPhone i zaloguj się na stronie, którą otworzy.",
        },
        generic: {
            title: "Coś poszło nie tak",
            heading: "Coś poszło nie tak",
            body: "Synchronizacja z Apple Health nie została połączona. Odczekaj chwilę, a potem uruchom ponownie skrót Nutrition MCP Health na telefonie iPhone.",
        },
    },
};

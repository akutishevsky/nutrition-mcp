import type { DashboardDoc } from "./dashboard.js";

export const DASHBOARD_ES: DashboardDoc = {
    meta: {
        title: "Nutrition MCP — Panel",
        description:
            "Tus comidas, objetivos, tendencias y medidas corporales de Nutrition MCP, en una sola página.",
    },
    noScript:
        "El panel necesita JavaScript para cargar tus datos. Actívalo y vuelve a cargar la página.",
    tabs: {
        today: "Hoy",
        history: "Historial",
        trends: "Tendencias",
        body: "Cuerpo",
    },
    navAriaLabel: "Panel",
    pagesAriaLabel: "Páginas del panel",
    signOut: "Cerrar sesión",
    signOutFailed:
        "No hemos podido cerrar la sesión ahora mismo, así que este navegador sigue con la sesión iniciada. Vuelve a intentarlo en un momento.",

    sync: {
        updated: "Actualizado: {time}",
        updating: "Actualizando…",
        offline: "Sin conexión · última actualización: {time}",
        offlineNever: "Sin conexión",
        empty: "Aún no hay registros",
    },
    error: {
        lead: "No se pudo actualizar.",
        leadFirst: "No se pudieron cargar tus datos.",
        stale: "Estás viendo los datos de la última actualización ({time}); lo que hayas registrado después aparecerá cuando se recupere la conexión.",
        first: "Comprueba tu conexión y vuelve a intentarlo.",
        retry: "Reintentar",
    },
    loading: "Cargando tu día",

    today: {
        dateAriaLabel: "Fecha",
        titleToday: "Hoy",
        titleYesterday: "Ayer",
        prevDay: "Día anterior",
        nextDay: "Día siguiente",
        pickDate: "Elegir una fecha",
        calendar: "Calendario",
    },
    empty: {
        title: "Aún no hay nada registrado",
        body: "Cuéntale a tu asistente de IA qué has comido o bebido. Cada registro aparece aquí en menos de un minuto, con totales, objetivos y tendencias.",
        trySaying: "Prueba con",
        examples: [
            "«Desayuné dos huevos y una tostada»",
            "«Pon mi objetivo de calorías en 2200 y el de proteínas en 150 g»",
            "«Registra 500 ml de agua»",
        ],
        stepsTitle: "¿Aún no lo has conectado?",
        steps: [
            "Añade Nutrition MCP a Claude, ChatGPT u otro cliente MCP.",
            "Inicia sesión con esta misma cuenta cuando te lo pida.",
            "Registra tu primera comida en el chat. Esta página se actualiza sola.",
        ],
        connectCta: "Cómo conectarlo",
    },
    history: {
        rangeAriaLabel: "Periodo",
        title: "Historial",
        loggedPill: {
            one: "{logged} de {total} día registrado",
            other: "{logged} de {total} días registrados",
        },
        searchPlaceholder: "Buscar comidas o ingredientes",
        searchLabel: "Buscar en comidas e ingredientes",
        clearSearch: "Borrar búsqueda",
        earlier: "Cinco semanas antes",
        later: "Cinco semanas después",
        resultsTitle: {
            one: "{n} comida coincide con «{q}»",
            other: "{n} comidas coinciden con «{q}»",
        },
        resultsSub:
            "Nombres e ingredientes, de la más reciente a la más antigua",
        ingredient: "Ingrediente: {item}",
        kcal: "kcal",
        noResults:
            "Ninguna comida ni ingrediente coincide. Prueba con una palabra más corta, como «arroz».",
        tooShort: "Escribe al menos dos letras para buscar.",
        searching: "Buscando…",
        searchFailed:
            "La búsqueda no está disponible ahora mismo. Inténtalo de nuevo en un momento.",
        savedHit:
            "También es una comida guardada: {name}, {kcal} kcal por ración",
        calendarTitle: "Calendario",
        legendOn: "En el objetivo ±5 %",
        legendUnder: "Por debajo",
        legendOver: "Por encima",
        calendarAriaLabel: "Calorías diarias, del {from} al {to}",
        cellToday: "hoy",
        cellTodaySuffix: " (hoy)",
        cellNothing: ", nada registrado",
        cellKcal: ", {kcal} kcal",
        summary:
            "Media de {avg} kcal en {n} días completos · {on} en el objetivo · {over} por encima · {under} por debajo · {missing} sin registrar",
        summaryNone:
            "No hay ningún día completo registrado en estas cinco semanas.",
        dayEmpty: "No hay nada registrado el {date}.",
        dayFailed:
            "No se ha podido cargar el {date}. Vuelve a intentarlo en breve.",
        savedTitle: "Comidas guardadas",
        savedSub:
            "Registra una por su nombre en el chat: «registra mi {name}».",
        savedSubNone:
            "Las comidas que guardes en el chat aparecen aquí, listas para registrarlas por su nombre.",
        perServing: " kcal / ración",
        protein: "P {g} g",
        carbs: "C {g} g",
        fat: "G {g} g",
        items: { one: "{n} ingrediente", other: "{n} ingredientes" },
        savedNone: "Aún no hay comidas guardadas.",
    },
    trends: {
        eyebrow: "Calorías, macros y nutrientes a lo largo del tiempo",
        title: "Tendencias",
    },
    body: {
        eyebrow: "Peso y medidas",
        title: "Cuerpo",
        measTitle: "Medidas",
        measSub: "Perímetros tal como los registraste · última el {date}",
        notMeasured: "Aún sin medir:",
        hintCm: "Para añadir una, dile a tu asistente «cintura 83,5 cm». Los cambios se miden desde tu primer registro, el {date}. Puedes cambiar la unidad a pulgadas en el chat.",
        hintIn: "Para añadir una, dile a tu asistente «cintura 33 pulgadas». Los cambios se miden desde tu primer registro, el {date}. Puedes cambiar la unidad a centímetros en el chat.",
        sinceFirst: "{delta} desde la primera",
        firstEntry: "Primer registro",
        noMeasurements:
            "Aún no hay medidas corporales. Cintura, cadera y otras siete zonas se pueden registrar en centímetros o pulgadas.",
        kinds: {
            waist: "Cintura",
            hips: "Cadera",
            neck: "Cuello",
            chest: "Pecho",
            shoulders: "Hombros",
            upper_arm: "Brazo",
            forearm: "Antebrazo",
            thigh: "Muslo",
            calf: "Pantorrilla",
        },
        kindsInline: {
            waist: "cintura",
            hips: "cadera",
            neck: "cuello",
            chest: "pecho",
            shoulders: "hombros",
            upper_arm: "brazo",
            forearm: "antebrazo",
            thigh: "muslo",
            calf: "pantorrilla",
        },
    },
    widgets: {
        summary: "Resumen nutricional",
        digest: "Informe nutricional",
        goals: "Progreso de objetivos",
        weight: "Evolución del peso",
        trends: "Tendencias",
    },
};

import type { DashboardDoc } from "./dashboard.js";

export const DASHBOARD_FR: DashboardDoc = {
    meta: {
        title: "Nutrition MCP — Tableau de bord",
        description:
            "Tes repas, objectifs, tendances et mensurations de Nutrition MCP, sur une seule page.",
    },
    noScript:
        "Le tableau de bord a besoin de JavaScript pour charger tes données. Active-le, puis recharge la page.",
    tabs: {
        today: "Aujourd'hui",
        history: "Historique",
        trends: "Tendances",
        body: "Corps",
    },
    navAriaLabel: "Tableau de bord",
    pagesAriaLabel: "Pages du tableau de bord",
    signOut: "Se déconnecter",
    signOutFailed:
        "Impossible de vous déconnecter pour le moment : ce navigateur est toujours connecté. Réessayez dans un instant.",

    sync: {
        updated: "Mis à jour à {time}",
        updating: "Mise à jour…",
        offline: "Hors ligne · dernière mise à jour à {time}",
        offlineNever: "Hors ligne",
        empty: "Aucune entrée pour l'instant",
    },
    error: {
        lead: "Échec de l'actualisation.",
        leadFirst: "Impossible de charger tes données.",
        stale: "Tu vois les données enregistrées à {time} ; tout ce que tu as noté depuis apparaîtra dès que la connexion sera rétablie.",
        first: "Vérifie ta connexion, puis réessaie.",
        retry: "Réessayer",
    },
    loading: "Chargement de ta journée",

    today: {
        dateAriaLabel: "Date",
        titleToday: "Aujourd'hui",
        titleYesterday: "Hier",
        prevDay: "Jour précédent",
        nextDay: "Jour suivant",
        pickDate: "Choisir une date",
        calendar: "Calendrier",
    },
    empty: {
        title: "Rien d'enregistré pour l'instant",
        body: "Dis à ton assistant IA ce que tu as mangé ou bu. Chaque entrée apparaît ici en moins d'une minute, avec les totaux, les objectifs et les tendances.",
        trySaying: "Dis par exemple",
        examples: [
            "« J'ai mangé deux œufs et une tartine au petit-déjeuner »",
            "« Fixe mon objectif de calories à 2 200 et de protéines à 150 g »",
            "« Enregistre 500 ml d'eau »",
        ],
        stepsTitle: "Pas encore connecté ?",
        steps: [
            "Ajoute Nutrition MCP à Claude, ChatGPT ou un autre client MCP.",
            "Connecte-toi avec ce même compte quand on te le demande.",
            "Enregistre ton premier repas dans le chat. Cette page se met à jour toute seule.",
        ],
        connectCta: "Comment se connecter",
    },
    history: {
        rangeAriaLabel: "Période",
        title: "Historique",
        loggedPill: {
            one: "Jour renseigné : {logged} sur {total}",
            other: "Jours renseignés : {logged} sur {total}",
        },
        searchPlaceholder: "Chercher des repas ou des ingrédients",
        searchLabel: "Rechercher dans les repas et les ingrédients",
        clearSearch: "Effacer la recherche",
        earlier: "Cinq semaines plus tôt",
        later: "Cinq semaines plus tard",
        resultsTitle: {
            one: "{n} repas correspond à « {q} »",
            other: "{n} repas correspondent à « {q} »",
        },
        resultsSub: "Noms et ingrédients, du plus récent au plus ancien",
        ingredient: "Ingrédient : {item}",
        kcal: "kcal",
        noResults:
            "Aucun repas ni ingrédient ne correspond. Essaie un mot plus court, comme « riz ».",
        tooShort: "Tape au moins deux lettres pour lancer la recherche.",
        searching: "Recherche…",
        searchFailed:
            "La recherche n'est pas disponible pour le moment. Réessaie dans un instant.",
        savedHit:
            "C'est aussi un repas sauvegardé : {name}, {kcal} kcal par portion",
        calendarTitle: "Calendrier",
        legendOn: "Dans l'objectif ±5 %",
        legendUnder: "En dessous",
        legendOver: "Au-dessus",
        calendarAriaLabel: "Calories par jour, du {from} au {to}",
        cellToday: "auj.",
        cellTodaySuffix: " (aujourd'hui)",
        cellNothing: ", rien d'enregistré",
        cellKcal: ", {kcal} kcal",
        summary:
            "Moyenne de {avg} kcal sur {n} journées complètes · {on} dans l'objectif · {over} au-dessus · {under} en dessous · {missing} non renseignées",
        summaryNone:
            "Aucune journée complète renseignée sur ces cinq semaines.",
        dayEmpty: "Rien d'enregistré le {date}.",
        dayFailed:
            "Impossible de charger le {date}. Réessayez dans un instant.",
        savedTitle: "Repas sauvegardés",
        savedSub:
            "Enregistre-en un par son nom dans le chat : « enregistre {name} ».",
        savedSubNone:
            "Les repas que tu sauvegardes dans le chat apparaissent ici, prêts à être enregistrés par leur nom.",
        perServing: " kcal / portion",
        protein: "P {g} g",
        carbs: "G {g} g",
        fat: "L {g} g",
        items: { one: "{n} ingrédient", other: "{n} ingrédients" },
        savedNone: "Aucun repas sauvegardé pour l'instant.",
    },
    trends: {
        eyebrow: "Calories, macros et nutriments dans le temps",
        title: "Tendances",
    },
    body: {
        eyebrow: "Poids et mensurations",
        title: "Corps",
        measTitle: "Mensurations",
        measSub: "Tours tels que tu les as enregistrés · dernier le {date}",
        notMeasured: "Pas encore mesuré :",
        hintCm: "Pour en ajouter une, dis à ton assistant « tour de taille 83,5 cm ». Les variations sont calculées depuis ta première entrée, le {date}. Tu peux passer aux pouces dans le chat.",
        hintIn: "Pour en ajouter une, dis à ton assistant « tour de taille 33 pouces ». Les variations sont calculées depuis ta première entrée, le {date}. Tu peux passer aux centimètres dans le chat.",
        sinceFirst: "{delta} depuis la première",
        firstEntry: "Première entrée",
        noMeasurements:
            "Aucune mensuration pour l'instant. La taille, les hanches et sept autres zones peuvent être suivies en centimètres ou en pouces.",
        kinds: {
            waist: "Taille",
            hips: "Hanches",
            neck: "Cou",
            chest: "Poitrine",
            shoulders: "Épaules",
            upper_arm: "Bras",
            forearm: "Avant-bras",
            thigh: "Cuisse",
            calf: "Mollet",
        },
        kindsInline: {
            waist: "taille",
            hips: "hanches",
            neck: "cou",
            chest: "poitrine",
            shoulders: "épaules",
            upper_arm: "bras",
            forearm: "avant-bras",
            thigh: "cuisse",
            calf: "mollet",
        },
    },
    widgets: {
        summary: "Résumé nutritionnel",
        digest: "Bilan nutritionnel",
        goals: "Progression des objectifs",
        weight: "Évolution du poids",
        trends: "Tendances",
    },
};

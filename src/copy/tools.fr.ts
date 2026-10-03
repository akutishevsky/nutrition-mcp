// French (fr) translation of the /tools reference page content — see
// src/copy/tools.ts for the authoritative shape (`ToolsDoc`) and the full
// doc comments on what is/isn't translatable (tool names, param names,
// category slugs are structural and stay in TOOLS/BADGE_META; only prose
// lives here).
//
// Terminology follows .git/nm-i18n/glossary-fr.md and matches index.fr.ts
// and alternatives.fr.ts: protein → protéines, carbs → glucides, fat →
// lipides, fiber → fibres, (total) sugar → sucres (totaux), alcohol → alcool
// (grammes d'éthanol pur), caffeine → caféine, meal → repas, water entry →
// entrée d'eau, weigh-in → pesée, goals → objectifs, timezone → fuseau
// horaire, importer → outil d'import, widget → widget. Informal "tu"
// register throughout. French typography: a no-break space (U+00A0) before
// high punctuation, inside guillemets, between a number and its unit and as
// the thousands separator.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_FR: ToolsDoc = {
    meta: {
        title: "41 outils pour suivre calories, macros, eau et poids",
        description:
            "Les 41 outils Nutrition MCP pour Claude, ChatGPT et autres : repas, scan de codes-barres, import CSV MyFitnessPal ou Cronometer, suivi de l'eau, du poids et des mensurations.",
        ogDescription:
            "Les 41 outils que le serveur Nutrition MCP donne à ton IA, dont un outil d'import CSV pour récupérer ton historique d'une autre app, avec descriptions et exemples de demandes.",
    },
    hero: {
        eyebrow: "Référence",
        titleBeforeEm: "Tout ce que ton IA peut ",
        titleEm: "faire",
        titleAfterEm: "",
        lead: "Tu n'appelles jamais ces outils toi-même : tu parles simplement à Claude, à ChatGPT ou à un autre client MCP, et il choisit le bon outil. Voici tous les outils que le serveur Nutrition MCP met à disposition pour les repas, les calories et les macros, l'eau et le poids, avec ce que fait chacun et une phrase qui le déclenche.",
        countBold: "41 outils",
        countTail: "répartis en 7 catégories",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Repas",
            title: "Enregistrer tes repas",
            description:
                "Le cœur de l'app : note ce que tu as mangé, quelle que soit la façon dont tu le décris.",
        },
        "reviewing-your-meals": {
            pillLabel: "Historique",
            title: "Consulter tes repas",
            description:
                "Reviens sur ce que tu as enregistré, jour par jour ou sur toute une période.",
        },
        water: {
            pillLabel: "Eau",
            title: "Suivi de l'eau",
            description: "Suis ton hydratation en même temps que tes repas.",
        },
        weight: {
            pillLabel: "Corps",
            title: "Poids et mensurations",
            description:
                "Enregistre tes pesées et tes mensurations, consulte-les et suis l'évolution de ton poids vers ton poids cible.",
        },
        "goals-progress": {
            pillLabel: "Objectifs",
            title: "Objectifs et progression",
            description: "Fixe tes objectifs et vois où tu en es chaque jour.",
        },
        "insights-trends": {
            pillLabel: "Analyses",
            title: "Analyses et tendances",
            description:
                "Des analyses précalculées pour que l'IA repère les tendances sans faire de calculs.",
        },
        "settings-account": {
            pillLabel: "Réglages",
            title: "Réglages et compte",
            description:
                "Des préférences pour que tout reste exact, et le contrôle total de tes données.",
        },
    },
    badges: {
        log: "Enregistrer",
        widget: "Widget interactif",
        lookup: "Rechercher",
        import: "Importer",
        edit: "Modifier",
        remove: "Supprimer",
        view: "Consulter",
        export: "Exporter",
        setting: "Régler",
    },
    ui: {
        parametersLabel: "Paramètres",
        requiredLabel: "requis",
        optionalLabel: "facultatif",
        trySayingLabel: "Dis par exemple",
        categoriesLabel: "Catégories d'outils",
    },
    tools: {
        log_meal: {
            description:
                "Enregistre ce que tu as mangé avec les calories et les macros, plus les fibres, les sucres totaux, l'alcool et la caféine quand ces valeurs sont disponibles. Décris-le avec tes mots : l'IA estime les valeurs, te demande la taille de la portion si elle n'est pas claire, et peut d'abord récupérer les données de l'étiquette via un code-barres ou sur le web.",
            params: {
                description: "Ce qui a été mangé",
                meal_type: "petit-déjeuner, déjeuner, dîner ou collation",
                calories: "Calories totales",
                protein_g: "Protéines en grammes",
                carbs_g: "Glucides en grammes",
                fat_g: "Lipides en grammes",
                fiber_g:
                    "Fibres alimentaires en grammes. L'IA a pour consigne de remplir ce champ à chaque repas, en l'estimant à partir des ingrédients quand aucune étiquette ne donne la valeur, car un champ vide n'est pas un zéro : il exclut toute la journée de ta moyenne de fibres",
                sugar_g:
                    "Sucres <b>totaux</b> en grammes : la valeur qu'une étiquette indique sous « dont sucres », y compris le sucre naturellement présent dans les fruits et le lait, pas seulement le sucre ajouté. Renseigné à chaque repas, selon les mêmes règles que les fibres",
                alcohol_g:
                    "Grammes d'<b>éthanol pur</b>, ni le volume de la boisson ni son degré d'alcool : l'IA le calcule à partir de la quantité servie et du degré (une bière de 330 ml à 5 % en contient 13 g)",
                caffeine_mg:
                    "Caféine en <b>milligrammes</b>, pas en grammes : c'est le seul champ ici qui n'est pas en grammes, car c'est l'unité qu'emploient toutes les étiquettes et toutes les recommandations (un café filtre contient environ 95 mg, un expresso 63 mg, une canette de cola 34 mg). La caféine n'apporte aucune calorie. Contrairement aux fibres et aux sucres, elle n'est envoyée que pour ce qui contient réellement de la caféine : un 0 enregistré ferait apparaître une ligne caféine sur ton tableau de bord pour un nutriment que tu ne consommes jamais",
                logged_at:
                    "Quand tu l'as mangé, si ce n'est pas maintenant : permet d'enregistrer quelque chose après coup",
                notes: "Notes supplémentaires",
            },
            example:
                "Enregistre pour le déjeuner un burrito bowl au poulet avec supplément guacamole",
            photoHint:
                "…ou prends simplement ton assiette en photo : l'IA identifie chaque plat, estime les portions avec des mesures du quotidien (un verre, une poignée), regarde comment tu l'as enregistré les fois précédentes et te demande confirmation avant d'enregistrer.",
        },
        lookup_barcode: {
            description:
                "Récupère sur Open Food Facts les valeurs nutritionnelles indiquées sur l'étiquette d'un produit emballé, à partir de son code-barres (EAN/UPC de 8 à 14 chiffres), ainsi que son Nutri-Score et son groupe de transformation NOVA quand Open Food Facts les connaît. Tu peux taper les chiffres ou les lire sur une photo de l'emballage ; le résultat peut ensuite être enregistré, ajusté à la quantité que tu as mangée.",
            params: {},
            example: "Scanne ce code-barres : 3017620422003",
            photoHint:
                "…ou envoie une photo de l'emballage : l'IA y lit les chiffres du code-barres.",
        },
        start_meal_import: {
            description:
                "Ouvre un outil d'import dans le chat pour récupérer ton historique depuis une autre app : choisis le CSV exporté depuis MyFitnessPal, Cronometer, Lose It!, MacroFactor ou une autre app de suivi, associe ses colonnes aux calories, aux macros, aux fibres, aux sucres et à la caféine (plus l'alcool si tu as activé son suivi), puis vérifie ce qui sera ajouté avant de confirmer. Le fichier est lu dans ton navigateur, rien n'est enregistré tant que tu n'as pas validé l'aperçu, et réimporter le même fichier ne crée pas de doublons.",
            params: {},
            example: "Importe mon historique de repas depuis MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Ajoute d'un coup un lot de repas passés (jusqu'à 50 à la fois) au lieu de les enregistrer un par un. L'outil d'import ci-dessus passe par lui pour enregistrer les repas, et l'IA peut aussi l'utiliser directement pour des repas que tu as collés dans le chat. Chaque ligne est d'abord vérifiée, et tout ce qui ne convient pas est signalé ligne par ligne : renvoyer les mêmes lignes est donc sans risque et ne crée pas de doublons de ce qui est déjà enregistré, tant que ton fuseau horaire n'a pas changé entre-temps.",
            params: {
                meals: "Les lignes à importer, dans l'ordre du fichier source (1 à 50 par appel). Chaque ligne peut contenir une heure, un type de repas, une description, des notes et les mêmes valeurs qu'un repas enregistré : <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (sucres totaux), <code>alcohol_g</code> (grammes d'éthanol pur) et <code>caffeine_mg</code> (milligrammes, pas grammes)",
                expected_row_count:
                    "Nombre de lignes transmises par cet appel, compté dans le fichier source, pour repérer une ligne perdue",
                expected_total_kcal:
                    "Total des calories du fichier source, rapproché de ce qui est reçu",
                dry_run: "Indiquer ce qui se passerait, sans rien écrire",
                on_error:
                    "Importer les lignes valides et signaler les autres, ou ne rien écrire si une ligne échoue",
                source_app: "L'app d'où provient le fichier",
            },
            example:
                "Voici les repas de la semaine dernière, copiés depuis mon ancienne app : ajoute-les tous",
        },
        update_meal: {
            description:
                "Modifie un repas déjà enregistré : sa description, une macro, les fibres, les sucres, l'alcool ou la caféine, l'heure ou les notes. C'est aussi comme ça qu'on complète une valeur manquante : si un repas a été enregistré sans ses fibres ou ses sucres, le serveur le signale et l'IA les ajoute ici une fois que tu as donné ton accord.",
            params: {
                id: "UUID du repas à modifier",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Sucres totaux, pas le sucre ajouté",
                alcohol_g: "Grammes d'éthanol pur, pas le volume de la boisson",
                caffeine_mg: "Milligrammes, pas grammes",
                logged_at: "",
                notes: "",
            },
            example:
                "En fait, ce déjeuner faisait 600 calories, pas 500 : corrige-le",
        },
        delete_meal: {
            description: "Supprime un repas enregistré par erreur.",
            params: {
                id: "UUID du repas à supprimer",
            },
            example:
                "Supprime la collation que j'ai enregistrée cet après-midi",
        },
        search_meals: {
            description:
                "Recherche tes anciens repas par mot-clé et vois-les regroupés selon tes variantes récurrentes : combien de fois chacune a été enregistrée, la dernière fois, et ses calories typiques. C'est ainsi que l'IA compare une photo de ton assiette à la façon dont tu as réellement enregistré ce repas auparavant, et c'est ce qui fait fonctionner « enregistre mon petit-déjeuner habituel ».",
            params: {
                queries:
                    "Différentes façons de nommer l'aliment, dans n'importe quelle langue utilisée dans ton journal",
                days: "Jusqu'où remonter (un an par défaut)",
                limit: "Nombre maximal d'entrées à analyser",
            },
            example: "Enregistre mon petit-déjeuner habituel",
        },
        get_meals_today: {
            description: "Affiche tous les repas enregistrés aujourd'hui.",
            params: {
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Qu'est-ce que j'ai mangé aujourd'hui ?",
        },
        get_meals_by_date: {
            description: "Affiche tous les repas enregistrés un jour donné.",
            params: {
                date: "Date au format AAAA-MM-JJ",
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Montre-moi tout ce que j'ai mangé le 4 juillet",
        },
        get_meals_by_date_range: {
            description:
                "Récupère d'un coup tous les repas entre deux dates : pratique pour faire le point sur une semaine ou un mois. Un appel couvre jusqu'à 31 jours ; pour des périodes plus longues, les tendances et les résumés donnent les totaux quotidiens.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date:
                    "Date de fin (AAAA-MM-JJ), 31 jours maximum, jour de début compris",
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Liste mes repas du lundi au vendredi",
        },
        export_all_data: {
            description:
                "Exporte tout ce que le service conserve à ton sujet dans un seul fichier ZIP : meals.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, profile.csv, account.csv (ton compte de connexion), telemetry.csv (l'historique d'utilisation des outils), connections.csv (tes apps d'IA connectées et la synchronisation Apple Health, sans aucun jeton), health_sync.csv (ce que la synchronisation Apple Health a envoyé ces 8 derniers jours) et un README.txt qui explique les colonnes, les unités et ce qui n'est pas inclus. Tu reçois en retour un lien de téléchargement privé, valable 60 minutes. Pour l'instant, seuls les repas peuvent être réimportés.",
            params: {},
            example:
                "Exporte toutes mes données : repas, eau, poids et objectifs",
        },
        log_water: {
            description:
                "Enregistre une entrée d'eau. Donne la quantité dans l'unité de ton choix (tasses, onces, litres) : elle est convertie en millilitres pour toi.",
            params: {
                amount_ml: "Quantité en millilitres (nombre entier, &gt; 0).",
            },
            example: "Je viens de boire une bouteille d'eau de 500 ml",
        },
        get_water_today: {
            description: "Affiche ton total d'eau du jour et chaque entrée.",
            params: {},
            example: "Combien d'eau ai-je bu aujourd'hui ?",
        },
        get_water_by_date: {
            description:
                "Affiche ton total d'eau et tes entrées d'un jour donné.",
            params: {
                date: "Date au format AAAA-MM-JJ",
            },
            example: "Combien ai-je bu hier ?",
        },
        delete_water: {
            description: "Supprime une entrée d'eau ajoutée par erreur.",
            params: {
                id: "UUID de l'entrée d'eau à supprimer",
            },
            example: "Supprime ma dernière entrée d'eau",
        },
        log_weight: {
            description:
                "Enregistre une mesure de ton poids en kg ou en lb. Tu peux te peser plusieurs fois par jour, et le serveur enregistre la valeur dans une unité de référence, pour que ta préférence d'unité ne fausse jamais le chiffre.",
            params: {
                weight: "Valeur du poids, en <code>unit</code> (&gt; 0).",
            },
            example: "Enregistre mon poids : 74,2 kg ce matin",
        },
        update_weight: {
            description:
                "Corrige une pesée existante : la valeur, l'horodatage ou ses notes.",
            params: {
                id: "UUID de la pesée à modifier",
                weight: "Nouvelle valeur du poids, en <code>unit</code>.",
                logged_at: "Horodatage ISO 8601",
                notes: "",
            },
            example: "Corrige la pesée de ce matin : 73,8 kg",
        },
        delete_weight: {
            description: "Supprime une pesée.",
            params: {
                id: "UUID de la pesée à supprimer",
            },
            example: "Supprime la pesée d'aujourd'hui",
        },
        get_weight_today: {
            description: "Affiche tes pesées du jour, dans ton unité préférée.",
            params: {},
            example: "Quel est mon poids aujourd'hui ?",
        },
        get_weight_by_date: {
            description: "Affiche tes pesées d'un jour donné.",
            params: {
                date: "Date au format AAAA-MM-JJ",
            },
            example: "Combien je pesais le 1er ?",
        },
        get_weight_by_date_range: {
            description:
                "Récupère toutes les pesées entre deux dates, regroupées par jour avec la moyenne de chaque jour.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date: "Date de fin (AAAA-MM-JJ)",
            },
            example: "Montre mes pesées des deux dernières semaines",
        },
        get_weight_trends: {
            description:
                "Affiche l'évolution de ton poids sur une période : dernière mesure, variation globale, moyennes mobiles sur 7/14/30 jours, min./max. et progression vers ton poids cible.",
            params: {
                days: "Durée de la période en jours (30 par défaut, 365 maximum).",
            },
            example: "Comment évolue mon poids ce mois-ci ?",
        },
        set_weight_unit: {
            description:
                "Choisis si les poids s'affichent et se saisissent en kg ou en lb. Les valeurs enregistrées ne changent pas : seuls l'affichage et l'unité retenue par défaut à la saisie changent.",
            params: {},
            example: "Passe mon poids en livres à partir de maintenant",
        },
        log_body_measurement: {
            description:
                "Enregistre une mesure au mètre ruban d'une zone du corps (taille, hanches, cou, poitrine, épaules, haut du bras, avant-bras, cuisse ou mollet) en cm ou en pouces. La valeur est conservée telle que tu l'as saisie, avec une valeur de référence, pour qu'un changement d'unité ne modifie jamais un chiffre. Les nombres très éloignés d'une plage réaliste pour la zone sont refusés, car il s'agit probablement de fautes de frappe.",
            params: {
                kind: "La zone mesurée : <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> ou <code>calf</code>. Une valeur par zone ; le côté (gauche ou droit) peut figurer dans les notes.",
                value: "La mesure, en <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> ou <code>in</code> ; par défaut, ton unité de longueur enregistrée.",
                logged_at: "Moment de la mesure, si ce n'est pas maintenant",
                notes: "Notes supplémentaires",
            },
            example: "Enregistre mon tour de taille : 82 cm ce matin",
        },
        get_body_measurements: {
            description:
                "Liste tes mensurations par jour, de la plus ancienne à la plus récente, éventuellement pour une seule zone. Couvre les 30 derniers jours si tu n'indiques pas de dates, jusqu'à 366 jours par appel.",
            params: {
                kind: "Uniquement cette zone (par ex. <code>waist</code>)",
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date:
                    "Date de fin (AAAA-MM-JJ), jusqu'à 366 jours en comptant le premier",
            },
            example: "Montre mes tours de taille des trois derniers mois",
        },
        update_body_measurement: {
            description:
                "Corrige une mesure existante : la valeur, son unité, l'heure ou les notes. La zone elle-même ne change pas ; une autre zone fait l'objet d'une nouvelle entrée.",
            params: {
                id: "UUID de la mesure à modifier",
                value: "Nouvelle valeur, en <code>unit</code>.",
                unit: "Par défaut, l'unité dans laquelle l'entrée a été enregistrée.",
                logged_at: "Horodatage ISO 8601",
                notes: "Notes de remplacement",
            },
            example: "Mon tour de hanches faisait 98 cm, pas 89",
        },
        delete_body_measurement: {
            description: "Supprime une mensuration.",
            params: {
                id: "UUID de la mesure à supprimer",
            },
            example: "Supprime la mesure du tour de cou d'aujourd'hui",
        },
        set_length_unit: {
            description:
                "Choisis si les mensurations s'affichent et se saisissent en centimètres ou en pouces. Ce réglage est distinct de ton unité de poids. Les valeurs enregistrées ne changent pas : seuls l'affichage et l'unité retenue par défaut à la saisie changent.",
            params: {},
            example: "Passe mes mensurations en pouces",
        },
        set_nutrition_goals: {
            description:
                "Fixe tes objectifs quotidiens de calories, macros, fibres, sucres, alcool, caféine et eau, plus un poids cible facultatif. Les calories, les protéines, les glucides, les lipides, les fibres et l'eau sont des cibles à atteindre ; les sucres, l'alcool et la caféine sont des limites à ne pas dépasser, et la progression est formulée en conséquence. Seuls les champs que tu mentionnes sont mis à jour ; les autres restent inchangés.",
            params: {
                daily_calories:
                    "Objectif calorique quotidien (kcal). Mettre à null pour supprimer cet objectif.",
                daily_protein_g:
                    "Objectif quotidien de protéines (grammes). Mettre à null pour supprimer cet objectif.",
                daily_carbs_g:
                    "Objectif quotidien de glucides (grammes). Mettre à null pour supprimer cet objectif.",
                daily_fat_g:
                    "Objectif quotidien de lipides (grammes). Mettre à null pour supprimer cet objectif.",
                daily_fiber_g:
                    "Objectif quotidien de fibres (grammes), un minimum à atteindre. Mettre à null pour supprimer cet objectif.",
                daily_sugar_g:
                    "Limite quotidienne de sucres <b>totaux</b> (grammes), un maximum à ne pas dépasser. Les sucres totaux incluent le sucre naturellement présent dans les fruits et le lait : les recommandations officielles sur les sucres ajoutés donnent donc un chiffre bien plus bas. Mettre à null pour supprimer cette limite.",
                daily_alcohol_g:
                    "Limite quotidienne d'alcool en grammes d'<b>éthanol pur</b>, un maximum à ne pas dépasser. Un verre standard américain contient 14 g, une unité d'alcool britannique 7,9 g. Mettre à null pour supprimer cette limite.",
                daily_caffeine_mg:
                    "Limite quotidienne de caféine en <b>milligrammes</b>, un maximum à ne pas dépasser. L'EFSA et la FDA fixent le plafond à 400 mg par jour pour un adulte en bonne santé (environ quatre cafés filtre) ; pendant la grossesse, l'EFSA retient 200 mg. 0 est une vraie limite : aucune caféine du tout. Mettre à null pour supprimer cette limite.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Fixe mes objectifs à 2 200 calories, 160 g de protéines et un poids cible de 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Affiche tes objectifs quotidiens actuels de calories et de macros, ton éventuel objectif de fibres, tes éventuelles limites de sucres ou de caféine et, si tu suis l'alcool, ta limite d'alcool.",
            params: {},
            example: "Quels sont mes objectifs quotidiens ?",
        },
        get_goal_progress: {
            description:
                "Compare ce que tu as consommé aujourd'hui à tes objectifs : anneaux consommé/objectif et progression de ton poids. Touche l'anneau d'une macro pour voir quels repas y ont contribué.",
            params: {},
            example: "Où j'en suis par rapport à mes objectifs aujourd'hui ?",
        },
        get_nutrition_summary: {
            description:
                "Affiche tes totaux nutritionnels quotidiens sur une période, sous forme de tableau de bord interactif : tuiles de macros comparées aux objectifs et détail jour par jour. Un appel couvre jusqu'à 92 jours ; pour des périodes plus longues, les tendances donnent des moyennes glissantes.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date:
                    "Date de fin (AAAA-MM-JJ), 92 jours maximum, jour de début compris",
            },
            example: "Fais-moi un résumé de la semaine écoulée",
        },
        get_trends: {
            description:
                "Moyennes glissantes sur 7/14/30 jours, variabilité, séries d'enregistrement, moyenne des calories par jour de la semaine, et tes meilleurs et pires jours en calories : tout est précalculé pour que l'IA n'ait plus qu'à les commenter.",
            params: {
                days: "Durée de la période en jours (30 par défaut, 365 maximum).",
            },
            example:
                "Quelles sont mes tendances de calories et de macros sur les 30 derniers jours ?",
        },
        get_meal_patterns: {
            description:
                "Met en évidence tes habitudes alimentaires : la fréquence de chaque type de repas, l'effet du petit-déjeuner, les déjeuners très caloriques, les dîners tardifs, la semaine comparée au week-end, et les journées inhabituelles.",
            params: {
                days: "Durée de la période en jours (30 par défaut, 7 minimum, 365 maximum).",
            },
            example:
                "Tu repères des habitudes dans ma façon de manger, comme des dîners tardifs ou des petits-déjeuners sautés ?",
        },
        get_profile: {
            description:
                "Affiche tous tes réglages actuels d'un coup : fuseau horaire (avec la date et l'heure locales), langue des widgets, unités de poids et de longueur préférées, si les widgets s'affichent dans le chat et si le suivi de l'alcool est activé.",
            params: {},
            example: "Quels sont mes réglages actuels ?",
        },
        set_timezone: {
            description:
                "Définis ton fuseau horaire IANA pour que tes journées basculent à minuit, heure locale : un repas enregistré à 23 h compte pour ce jour-là, pas pour le lendemain en UTC.",
            params: {},
            example: "Je suis à Berlin, règle mon fuseau horaire",
        },
        set_language: {
            description:
                "Choisis la langue de l'interface des widgets interactifs dans le chat (tableaux de bord et graphiques), pas celle dans laquelle l'IA te répond.",
            params: {
                locale: "Code ISO 639-1, par exemple <code>de</code>, <code>ja</code>. Langues prises en charge : anglais, allemand, espagnol, français, néerlandais, polonais, italien, ukrainien, japonais.",
            },
            example: "Affiche mes widgets en allemand",
        },
        get_current_time: {
            description:
                "Donne la date et l'heure actuelles dans ton fuseau horaire, ainsi que l'instant UTC. Certaines apps n'indiquent pas l'heure à l'assistant : c'est ainsi qu'il sait ce que veulent dire « ce matin » ou « aujourd'hui » sans avoir à te le demander (UTC par défaut si aucun fuseau horaire n'est défini).",
            params: {},
            example: "Quelle heure est-il chez moi en ce moment ?",
        },
        set_widget_display: {
            description:
                "Active ou désactive les widgets visuels dans le chat : tableaux de bord, anneaux d'objectifs et graphiques de tendances. Quand ils sont désactivés, les mêmes outils répondent uniquement avec du texte et des données. Activés par défaut ; le changement s'applique aux nouvelles conversations.",
            params: {
                enabled:
                    "true pour afficher les widgets, false pour des réponses en texte seul",
            },
            example: "Désactive les widgets",
        },
        set_alcohol_tracking: {
            description:
                "Active ou désactive le suivi de l'alcool, et choisis si les boissons sont comptées en verres standards américains ou en unités d'alcool britanniques. Il est désactivé par défaut : il faut donc le demander. Le désactiver à nouveau masque l'alcool dans les repas, les objectifs et la progression, et empêche l'outil d'import de lire la colonne alcool d'un fichier. Rien de ce qui est déjà enregistré n'est supprimé, ton export CSV l'inclut toujours, et il réapparaît si tu réactives le suivi. Le changement s'applique dès ton prochain message, sans rien redémarrer.",
            params: {
                enabled:
                    "true pour afficher l'alcool dans les repas, les objectifs et la progression, false pour le masquer",
                drink_unit:
                    "Le verre standard à afficher à côté des grammes : <code>us</code> (14 g par verre) ou <code>uk</code> (7,9 g par unité). <code>us</code> par défaut ; ce qui est réellement enregistré, ce sont des grammes d'éthanol pur.",
            },
            example:
                "Commence à suivre ma consommation d'alcool, en unités britanniques",
        },
        delete_account: {
            description:
                "Supprime définitivement ton compte Nutrition MCP et toutes les données qu'il conserve sur toi. C'est irréversible : l'outil ne fait rien sans confirmation explicite, et l'IA a pour consigne de vérifier avec toi avant d'envoyer la confirmation.",
            params: {},
            example: "Supprime mon compte et toutes mes données",
        },
    },
    troubleshooting: {
        pillLabel: "Aide",
        title: "Dépannage",
        description:
            "Quelque chose ne fonctionne pas ? La plupart des problèmes se règlent vite.",
        stillStuck: "Le problème persiste ?",
        items: {
            "cannot-connect": {
                question:
                    "Le connecteur ne se connecte pas, ou me demande sans cesse de me connecter",
                answerHtml:
                    "Supprime le connecteur et ajoute-le à nouveau avec exactement <code>https://nutrition-mcp.com/mcp</code> : la partie <code>/mcp</code> est indispensable. Dans Claude, ouvre <strong>Personnaliser</strong> → <strong>Connecteurs</strong>, déconnecte Nutrition puis reconnecte-le ; dans ChatGPT, passe par <strong>Paramètres</strong> → <strong>Applications</strong>. Connecte-toi avec la même adresse e-mail et le même mot de passe, ou le même compte Google, qu'auparavant : tes données appartiennent à ton compte, pas à la connexion, donc te reconnecter ne te fait rien perdre. Une fois connecté, le connecteur le reste tant que tu t'en sers au moins une fois tous les 90 jours ; s'il cesse de fonctionner, il suffit de le reconnecter de la même façon.",
            },
            "session-expired": {
                question:
                    'La page de connexion affiche {"error":"session_expired"}',
                answerHtml:
                    "La page de connexion n'est valable que 10 minutes, et elle est aussi réinitialisée chaque fois que le serveur redémarre pour une mise à jour. Retourne sur la page de connexion et recharge-la, ou relance la connexion depuis ton app d'IA, puis connecte-toi sans trop tarder. Si elle affiche plutôt <code>session_mismatch</code>, la connexion a été finalisée dans un autre navigateur que celui qui l'a ouverte : recommence depuis ton app d'IA et va jusqu'au bout dans ce même navigateur.",
            },
            "cannot-sign-in": {
                question:
                    "Je n'arrive pas à me connecter, ou j'ai oublié mon mot de passe",
                answerHtml:
                    "Utilise <strong>Se connecter</strong> pour un compte que tu as déjà : avec un e-mail ou un mot de passe incorrect, ce bouton affiche « E-mail ou mot de passe incorrect » et ne crée jamais de nouveau compte. <strong>Créer un compte</strong> ne sert que lors de ta première visite. Vérifie que l'adresse e-mail ne contient pas de faute de frappe. Si tu as créé ton compte avec <strong>Continuer avec Google</strong>, utilise de nouveau ce bouton. La réinitialisation du mot de passe en libre-service n'existe pas encore : écris à <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a> depuis l'adresse de ton compte et je réinitialiserai ton mot de passe.",
            },
            "history-missing": {
                question: "Après une reconnexion, mon historique a disparu",
                answerHtml:
                    "Chaque adresse e-mail correspond à un compte distinct : te connecter avec une autre adresse ouvre donc un compte vide, mais rien n'a été supprimé. Déconnecte le connecteur et reconnecte-toi avec l'adresse que tu utilisais au départ. Si tu ne sais plus laquelle c'était, écris à <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a>.",
            },
            "tools-not-used": {
                question: "L'IA répond mais n'enregistre rien",
                answerHtml:
                    "Vérifie que le connecteur est activé pour cette conversation (dans Claude, regarde le menu des outils dans la zone de saisie) et demande-le explicitement, par exemple « enregistre mon petit-déjeuner dans Nutrition ». Si ton app te demande l'autorisation d'utiliser un outil, accepte.",
            },
            "wrong-day": {
                question: "Mes repas apparaissent au mauvais jour",
                answerHtml:
                    "Les journées sont comptées dans ton fuseau horaire ; si tu n'en as jamais défini, c'est l'UTC qui s'applique. Demande « quel fuseau horaire est configuré ? » (<a href=\"#get_profile\"><code>get_profile</code></a>) et, s'il est faux, « règle mon fuseau horaire sur Europe/Berlin » (<a href=\"#set_timezone\"><code>set_timezone</code></a>). Tout ce que tu as enregistré est alors regroupé selon ta journée locale, y compris les entrées passées. Seule exception : une entrée pour laquelle tu as indiqué une heure précise alors que le fuseau était faux garde l'instant auquel elle a été enregistrée, et peut donc rester décalée d'une heure ou d'un jour. Demande à l'IA de la déplacer à la bonne date et à la bonne heure (<a href=\"#update_meal\"><code>update_meal</code></a>). Définis aussi ton fuseau horaire avant d'importer ton historique : les repas importés gardent l'instant auquel ils ont été placés, et réimporter le fichier d'une autre app après avoir changé de fuseau les ajoute une seconde fois. Un export Nutrition MCP, lui, est reconnu et n'est pas dupliqué.",
            },
            "no-widgets": {
                question: "Je ne vois que du texte, ni graphiques ni cartes",
                answerHtml:
                    "Les cartes visuelles nécessitent une app compatible avec les panneaux interactifs MCP Apps, comme Claude ou ChatGPT ; les autres clients reçoivent les mêmes informations sous forme de texte. Si tu as désactivé les widgets, demande à les réactiver (<a href=\"#set_widget_display\"><code>set_widget_display</code></a>) et ouvre une nouvelle conversation : une conversation déjà ouverte garde l'ancien réglage jusqu'à sa reconnexion. La petite carte qui s'affiche après l'enregistrement d'un repas n'apparaît que si tu as défini des objectifs quotidiens (<a href=\"#set_nutrition_goals\"><code>set_nutrition_goals</code></a>).",
            },
            "import-problems": {
                question:
                    "L'outil d'import ne s'ouvre pas, ou indique qu'il ne peut pas enregistrer",
                answerHtml:
                    "Le panneau d'import nécessite une app qui affiche les panneaux interactifs, avec les widgets activés. S'il affiche <em>Cet hôte ne permet pas à cette vue d'écrire dans ton journal</em>, ou s'il n'apparaît pas du tout, demande à l'IA d'importer le fichier elle-même : joins ou colle le CSV et elle utilisera <a href=\"#bulk_import_meals\"><code>bulk_import_meals</code></a>, qui vérifie chaque ligne et ignore les doublons ; tu peux donc le renvoyer sans risque, tant que ton fuseau horaire n'a pas changé entre-temps. Définis ton fuseau horaire avant le premier import : réimporter le fichier d'une autre app après un changement de fuseau ajoute de nouveau les lignes. Si tu utilises le panneau d'import et veux conserver une colonne d'alcool, active d'abord le suivi de l'alcool : le panneau ignore cette colonne tant que le suivi est désactivé, et un nouvel import plus tard ne la complétera pas.",
            },
            "rate-limited": {
                question:
                    "Je vois « Rate limit exceeded » ou « Too many failed authentication attempts »",
                answerHtml:
                    "Chaque compte peut envoyer 60 requêtes par minute, et chaque appel d'outil en compte au moins une. Attends le nombre de secondes indiqué dans le message, puis continue. Pour rattraper beaucoup de repas passés, utilise l'outil d'import plutôt que de les enregistrer un par un. Les pages de connexion acceptent 30 requêtes par minute et par réseau. Après 20 tentatives de connexion refusées d'affilée depuis un même réseau (en général, un ancien connecteur déconnecté qui réessaie encore), les connexions depuis ce réseau sont suspendues pendant 5 minutes, et les suspensions suivantes s'allongent, jusqu'à une heure au maximum. Supprimer l'ancien connecteur puis l'ajouter à nouveau met fin à ces tentatives.",
            },
            "barcode-not-found": {
                question:
                    "Un code-barres est introuvable, ou ses valeurs semblent fausses",
                answerHtml:
                    "Les données des codes-barres viennent d'Open Food Facts, une base de données collaborative : certains produits y manquent et certaines fiches ne sont plus à jour. Vérifie que les 8 à 14 chiffres sous le code-barres ont tous été lus correctement. Si le produit n'y figure pas, l'IA peut faire une estimation à partir de son nom ou d'une photo de l'étiquette nutritionnelle, et tu peux corriger n'importe quelle valeur ensuite. Ajouter le produit sur openfoodfacts.org aide tout le monde. Open Food Facts ne fournit pas de données sur la caféine : elle provient donc de l'étiquette ou de quantités typiques.",
            },
            "health-sync-yesterday": {
                question: "Hier n'apparaît pas encore dans Apple Health",
                answerHtml:
                    "La synchronisation avec Apple Health n'envoie que les journées terminées. Une journée est terminée à 05:00 le lendemain matin dans ton fuseau horaire : hier arrive donc avec la première synchronisation après 05:00 aujourd'hui, et aujourd'hui n'apparaît dans Santé que demain. Une synchronisation se lance quand l'une des automatisations du raccourci se déclenche (ouvrir l'app Santé, arrêter ton alarme) ou quand tu exécutes <strong>Nutrition MCP Health</strong> dans l'app Raccourcis et choisis <strong>Sync now</strong>. Un matin manqué se rattrape tout seul : chaque synchronisation remonte sur les 7 derniers jours. Les journées suivent le fuseau horaire de ton profil (<a href=\"#get_profile\"><code>get_profile</code></a>) ou, si tu n'en as jamais défini, celui que ton iPhone a indiqué à la connexion (<a href=\"#wrong-day\">repas au mauvais jour</a>). Les jours antérieurs à la connexion ne sont envoyés que si tu as choisi, en te connectant, de récupérer jusqu'à 7 jours précédents.",
            },
            "health-sync-higher": {
                question: "Apple Health affiche plus que mon chat",
                answerHtml:
                    "Apple Health peut ajouter à une valeur, mais jamais diminuer une valeur qu'il a déjà. Un repas que tu ajoutes à une journée déjà envoyée suit sous forme d'une petite entrée supplémentaire à 12:01, 12:02, etc., tant que la journée fait partie des 7 derniers jours. Si tu supprimes ou réduis un repas après l'envoi de sa journée, Santé reste plus haut et le raccourci affiche un avis indiquant l'écart. Pour corriger, ouvre l'app Santé, va dans <strong>Parcourir</strong> → <strong>Nutrition</strong>, ouvre le type concerné, touche <strong>Afficher toutes les données</strong>, supprime les entrées de ce jour provenant de Raccourcis et saisis le bon total à la main. N'utilise jamais <strong>Supprimer toutes les données de « Raccourcis »</strong> : cela efface aussi ce que tes autres raccourcis ont enregistré. Si chaque journée semble doublée, une autre app écrit les mêmes types et Santé additionne les deux : désactive l'une d'elles dans <strong>Partage</strong> → <strong>Apps</strong> de l'app Santé.",
            },
            "health-sync-stopped": {
                question: "La synchronisation avec Apple Health s'est arrêtée",
                answerHtml:
                    "Ouvre l'app Raccourcis et exécute <strong>Nutrition MCP Health</strong> à la main : il te dit ce qui n'a pas marché. S'il te demande de te reconnecter, la connexion a pris fin (après 90 jours sans synchronisation, 365 jours après la connexion ou après <strong>Disconnect</strong>) : exécute-le, connecte-toi sur la page qu'il ouvre avec le même compte que dans ton app d'IA, et termine en moins de 30 minutes. S'il synchronise quand tu l'exécutes mais pas tout seul, vérifie que ses automatisations dans l'onglet <strong>Automatisation</strong> de Raccourcis sont activées et réglées sur <strong>Exécuter immédiatement</strong>. Si un avis indique qu'une journée n'a pas atteint Apple Health, autorise Raccourcis à écrire chaque type de nutrition dans <strong>Partage</strong> → <strong>Apps</strong> → <strong>Raccourcis</strong> de l'app Santé, puis relance-le. Connecter un nouvel iPhone remplace la connexion de l'ancien.",
            },
            "export-link": {
                question:
                    "Le lien de téléchargement de mon export ne fonctionne pas",
                answerHtml:
                    'Les liens d\'export expirent au bout de 60 minutes, et chaque nouvel export remplace le fichier précédent. Demande un nouvel export (<a href="#export_all_data"><code>export_all_data</code></a>) et télécharge-le tout de suite. Si l\'export indique 0 repas alors que tu attendais ton historique, tu utilises probablement une autre adresse e-mail pour te connecter : voir <a href="#history-missing">« Après une reconnexion, mon historique a disparu »</a>.',
            },
            "delete-account": {
                question: "Comment supprimer mon compte ?",
                answerHtml:
                    "Demande à l'IA de supprimer ton compte Nutrition MCP (<a href=\"#delete_account\"><code>delete_account</code></a>). Elle te demandera confirmation, puis supprimera définitivement tes repas, tes entrées d'eau, de poids et de mensurations, tes objectifs, tes réglages, l'historique des outils utilisés par ton app d'IA, tout fichier d'export, tes identifiants de connexion et le compte lui-même. C'est irréversible : exporte d'abord tes données si tu veux en garder une copie. Retire ensuite le connecteur de ton app. Si tu te reconnectes plus tard avec la même adresse e-mail, un nouveau compte vide sera créé.",
            },
            "report-a-problem": {
                question:
                    "Comment signaler un bug ou un problème de sécurité ?",
                answerHtml:
                    'Signale les bugs sur <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> : précise quelle app tu utilises (Claude, ChatGPT, …), ce que tu as demandé, ce qui s\'est passé et à peu près quand. N\'indique jamais ton mot de passe. Merci de ne pas signaler publiquement les problèmes de sécurité : signale-les en privé via le <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">formulaire de signalement de vulnérabilités de GitHub</a> ou par e-mail, comme l\'explique la <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">politique de sécurité</a>. Pour tout le reste, écris à <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

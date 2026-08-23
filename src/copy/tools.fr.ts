// French (fr) translation of the /tools reference page content — see
// src/copy/tools.ts for the authoritative shape (`ToolsDoc`) and the full
// doc comments on what is/isn't translatable (tool names, param names,
// category slugs are structural and stay in TOOLS/BADGE_META; only prose
// lives here).
//
// Terminology kept consistent with index.fr.ts and alternatives.fr.ts:
// protein → protéines, carbs → glucides, fat → lipides, fiber → fibres,
// (total) sugar → sucres (totaux), alcohol → alcool (grammes d'éthanol pur),
// caffeine → caféine, meal → repas, water → eau, weigh-in → pesée,
// goals → objectifs, timezone → fuseau horaire, export → exporter/export,
// widget → widget. Informal "tu" register throughout, matching the English
// source's direct, plain-spoken address to the reader.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_FR: ToolsDoc = {
    meta: {
        title: "Référence des outils : les 38 outils",
        description:
            "Les 38 outils que le serveur Nutrition MCP donne à ton IA — enregistrer des repas, scanner des codes-barres, importer ton historique depuis une autre app, suivre l'eau et le poids, définir des objectifs et consulter les tendances. Référence complète avec descriptions et exemples de formulations.",
        ogDescription:
            "Les 38 outils que le serveur Nutrition MCP donne à ton IA, dont un importateur CSV pour ton historique venu d'une autre app — avec descriptions et exemples de formulations.",
    },
    hero: {
        eyebrow: "Référence",
        title: "Tout ce que ton IA peut faire",
        lead: "Tu n'appelles jamais ces outils directement — tu parles simplement, et l'assistant choisit le bon outil. Voici l'ensemble complet exposé par le serveur Nutrition MCP, avec ce que fait chacun et une phrase qui le déclenche.",
        countBold: "38 outils",
        countTail: "répartis en 7 catégories",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Repas",
            title: "Enregistrer repas et aliments",
            description:
                "Le cœur de l'app — note ce que tu as mangé, peu importe comment tu le décris.",
        },
        "reviewing-your-meals": {
            pillLabel: "Historique",
            title: "Consulter tes repas",
            description:
                "Reviens sur ce que tu as enregistré, un jour ou toute une période à la fois.",
        },
        water: {
            pillLabel: "Eau",
            title: "Eau",
            description: "Suis ton hydratation en plus de tes repas.",
        },
        weight: {
            pillLabel: "Poids",
            title: "Poids",
            description:
                "Enregistre tes pesées, consulte-les et observe la tendance vers ton objectif.",
        },
        "goals-progress": {
            pillLabel: "Objectifs",
            title: "Objectifs et progression",
            description: "Définis des cibles et vois où tu en es chaque jour.",
        },
        "insights-trends": {
            pillLabel: "Analyses",
            title: "Analyses et tendances",
            description:
                "Une analyse pré-calculée pour que l'IA repère les tendances sans faire de calculs.",
        },
        "settings-account": {
            pillLabel: "Réglages",
            title: "Réglages et compte",
            description:
                "Des préférences qui gardent tout précis, plus un contrôle total de tes données.",
        },
    },
    badges: {
        log: "Enregistrer",
        widget: "Interface interactive",
        lookup: "Rechercher",
        import: "Importer",
        edit: "Modifier",
        remove: "Supprimer",
        view: "Consulter",
        export: "Exporter",
        setting: "Paramètre",
    },
    ui: {
        parametersLabel: "Paramètres",
        requiredLabel: "requis",
        optionalLabel: "facultatif",
        trySayingLabel: "Essaie de dire",
    },
    tools: {
        log_meal: {
            description:
                "Enregistre ce que tu as mangé avec les calories et les macros — plus les fibres, le sucre total, l'alcool et la caféine quand les chiffres sont disponibles. Décris-le en langage courant — l'IA estime les chiffres, demande la taille de la portion quand ce n'est pas clair, et peut d'abord récupérer les données d'une étiquette via un code-barres ou le web.",
            params: {
                description: "Ce qui a été mangé",
                meal_type: "petit-déjeuner, déjeuner, dîner ou collation",
                calories: "Calories totales",
                protein_g: "Protéines en grammes",
                carbs_g: "Glucides en grammes",
                fat_g: "Lipides en grammes",
                fiber_g:
                    "Fibres alimentaires en grammes. L'IA est invitée à renseigner ce champ pour chaque repas, en l'estimant à partir des ingrédients quand aucune étiquette n'indique la valeur, car un champ vide n'est pas un zéro — il exclut toute la journée de ta moyenne de fibres",
                sugar_g:
                    "Sucres <b>totaux</b> en grammes — le chiffre qu'une étiquette indique sous « Sucres », incluant le sucre naturellement présent dans les fruits et le lait, pas seulement le sucre ajouté. Renseigné à chaque repas selon les mêmes règles que les fibres",
                alcohol_g:
                    "Grammes d'<b>éthanol pur</b>, pas le volume de la boisson ni son degré d'alcool — l'IA le calcule à partir de la quantité servie et du degré (une bière de 330 ml à 5% fait 13 g)",
                caffeine_mg:
                    "Caféine en <b>milligrammes</b>, pas en grammes — le seul champ ici qui n'est pas en grammes, car c'est ainsi que chaque étiquette et chaque recommandation l'indique (un café filtre fait environ 95 mg, un espresso 63 mg, une canette de cola 34 mg). La caféine n'ajoute aucune calorie. Contrairement aux fibres et au sucre, elle n'est envoyée que pour les aliments qui en contiennent réellement — un 0 enregistré ferait apparaître une ligne caféine sur ton tableau de bord pour un nutriment que tu ne consommes jamais",
                logged_at:
                    "Quand tu l'as mangé, si ce n'est pas maintenant — permet d'enregistrer quelque chose a posteriori",
                notes: "Notes supplémentaires",
            },
            example:
                "Enregistre un burrito bowl au poulet avec supplément de guacamole pour le déjeuner",
            photoHint:
                "…ou prends simplement ton assiette en photo — l'IA identifie chaque plat, estime les portions avec des mesures courantes (un verre, une poignée), vérifie comment tu l'as enregistré auparavant, et confirme avec toi avant d'enregistrer.",
        },
        lookup_barcode: {
            description:
                "Récupère les valeurs nutritionnelles d'un produit emballé depuis Open Food Facts à partir de son code-barres (EAN/UPC de 8 à 14 chiffres). Tu peux taper les chiffres ou les lire sur une photo de l'emballage ; le résultat peut ensuite être enregistré, ajusté à la quantité que tu as mangée.",
            params: {},
            example: "Scanne ce code-barres : 3017620422003",
            photoHint:
                "…ou envoie une photo de l'emballage — l'IA y lit les chiffres du code-barres.",
        },
        start_meal_import: {
            description:
                "Ouvre un importateur dans le chat pour récupérer ton historique depuis une autre app — choisis le fichier exporté depuis MyFitnessPal, Cronometer, Lose It! ou MacroFactor, associe ses colonnes aux calories, macros, fibres, sucre et caféine — plus l'alcool si tu as activé son suivi — et vérifie ce qui sera ajouté avant de confirmer. Le fichier est lu dans ton navigateur, rien n'est enregistré tant que tu n'as pas validé l'aperçu, et importer le même fichier à nouveau ne crée pas de doublons.",
            params: {},
            example: "Importe mon historique de repas depuis MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Ajoute un lot de repas passés en une seule fois — jusqu'à 50 à la fois — plutôt que de les enregistrer un par un. L'importateur ci-dessus passe par cet outil, et l'IA peut aussi l'utiliser directement pour des données de repas que tu as collées dans le chat. Chaque ligne est d'abord vérifiée et tout ce qui ne convient pas est signalé ligne par ligne, donc renvoyer les mêmes lignes est sans risque et ne dupliquera pas ce qui est déjà enregistré.",
            params: {
                meals: "Les lignes à importer, dans l'ordre du fichier source (1 à 50 par appel). Chaque ligne peut porter une heure, un type de repas, une description, des notes et les mêmes chiffres qu'un repas enregistré : <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (sucres totaux), <code>alcohol_g</code> (grammes d'éthanol pur) et <code>caffeine_mg</code> (milligrammes, pas grammes)",
                expected_row_count:
                    "Le nombre de lignes que cet appel transporte, compté depuis le fichier source, pour détecter une ligne perdue",
                expected_total_kcal:
                    "Le total de calories du fichier source, comparé à ce qui arrive",
                dry_run: "Signale ce qui se passerait sans rien écrire",
                on_error:
                    "Importe les lignes valides et signale les autres, ou n'écrit rien si une ligne échoue",
                source_app: "De quelle app provient le fichier",
            },
            example:
                "Voici les repas de la semaine dernière collés depuis mon ancienne app — ajoute-les tous",
        },
        update_meal: {
            description:
                "Modifie les détails d'un repas déjà enregistré — sa description, une macro, les fibres, le sucre, l'alcool ou la caféine, l'heure, ou les notes. C'est aussi comme ça qu'un manque est comblé : si un repas a été enregistré sans ses fibres ou son sucre, le serveur le signale et l'IA les renseigne ici.",
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
                "En fait ce déjeuner faisait 600 calories, pas 500 — corrige-le",
        },
        delete_meal: {
            description: "Supprime un repas que tu as enregistré par erreur.",
            params: {
                id: "UUID du repas à supprimer",
            },
            example:
                "Supprime la collation que j'ai enregistrée cet après-midi",
        },
        search_meals: {
            description:
                "Recherche tes repas passés par mot-clé et vois-les regroupés par variantes récurrentes — la fréquence d'enregistrement de chacune, sa dernière occurrence, et ses calories habituelles. C'est ainsi que l'IA compare une photo de ton assiette à la façon dont tu as réellement enregistré ce repas auparavant, et comment fonctionne « enregistre mon petit-déjeuner habituel ».",
            params: {
                queries:
                    "Mots-clés alternatifs pour l'aliment, dans n'importe quelle langue que tu as utilisée",
                days: "Jusqu'où remonter (un an par défaut)",
                limit: "Nombre maximal d'entrées à analyser",
            },
            example: "Enregistre mon petit-déjeuner habituel",
        },
        get_meals_today: {
            description:
                "Affiche tous les repas que tu as enregistrés aujourd'hui.",
            params: {},
            example: "Qu'est-ce que j'ai mangé aujourd'hui ?",
        },
        get_meals_by_date: {
            description: "Affiche tous les repas enregistrés un jour précis.",
            params: {
                date: "Date au format AAAA-MM-JJ",
            },
            example: "Montre-moi tout ce que j'ai mangé le 4 juillet",
        },
        get_meals_by_date_range: {
            description:
                "Récupère tous les repas entre deux dates en une fois — pratique pour passer en revue une semaine ou un mois.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date: "Date de fin (AAAA-MM-JJ)",
            },
            example: "Liste mes repas du lundi au vendredi",
        },
        export_all_data: {
            description:
                "Exporte tout ce que tu as suivi dans un seul ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv, et un README.txt expliquant les colonnes et les unités — avec le même lien privé, valable 60 minutes. Les repas sont pour l'instant la seule partie qui peut être réimportée.",
            params: {},
            example:
                "Exporte toutes mes données — repas, eau, poids et objectifs",
        },
        log_water: {
            description:
                "Enregistre une entrée d'hydratation. Donne-la dans n'importe quelle unité — tasses, onces, litres — elle est convertie en millilitres pour toi.",
            params: {
                amount_ml: "Quantité en millilitres (entier, &gt; 0).",
            },
            example: "Je viens de boire une bouteille d'eau de 500 ml",
        },
        get_water_today: {
            description:
                "Affiche ta consommation d'eau totale du jour et chaque entrée.",
            params: {},
            example: "Combien d'eau ai-je bu aujourd'hui ?",
        },
        get_water_by_date: {
            description:
                "Affiche ton total d'eau et les entrées d'un jour précis.",
            params: {
                date: "Date au format AAAA-MM-JJ",
            },
            example: "Combien ai-je bu hier ?",
        },
        delete_water: {
            description: "Supprime une entrée d'eau ajoutée par erreur.",
            params: {
                id: "UUID de l'entrée d'eau à supprimer",
            },
            example: "Supprime cette dernière entrée d'eau",
        },
        log_weight: {
            description:
                "Enregistre une mesure de poids corporel en kg ou en lb. Plusieurs pesées par jour ne posent aucun problème, et le serveur la stocke de façon canonique pour que ta préférence d'unité ne déforme jamais le chiffre.",
            params: {
                weight: "Valeur du poids corporel, dans `unit` (&gt; 0).",
            },
            example: "Enregistre mon poids — 74,2 kg ce matin",
        },
        update_weight: {
            description:
                "Corrige une pesée existante — la valeur, l'horodatage, ou ses notes.",
            params: {
                id: "UUID de la pesée à modifier",
                weight: "Nouvelle valeur du poids, dans `unit`.",
                logged_at: "Horodatage ISO 8601",
                notes: "",
            },
            example: "Corrige la pesée de ce matin à 73,8 kg",
        },
        delete_weight: {
            description: "Supprime une pesée.",
            params: {
                id: "UUID de la pesée à supprimer",
            },
            example: "Supprime la pesée d'aujourd'hui",
        },
        get_weight_today: {
            description: "Affiche les pesées du jour, dans ton unité préférée.",
            params: {},
            example: "Combien j'ai pesé aujourd'hui ?",
        },
        get_weight_by_date: {
            description: "Affiche tes pesées d'un jour précis.",
            params: {
                date: "Date au format AAAA-MM-JJ",
            },
            example: "Quel était mon poids le 1er ?",
        },
        get_weight_by_date_range: {
            description:
                "Récupère chaque pesée entre deux dates, regroupées par jour avec la moyenne de chaque jour.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date: "Date de fin (AAAA-MM-JJ)",
            },
            example: "Montre mes pesées des deux dernières semaines",
        },
        get_weight_trends: {
            description:
                "Affiche la tendance de ton poids sur une période : dernier relevé, évolution globale, moyennes mobiles sur 7/14/30 jours, min/max, et progression vers ton poids cible.",
            params: {
                days: "Taille de la période en jours (30 par défaut, 365 maximum).",
            },
            example: "Comment évolue mon poids ce mois-ci ?",
        },
        set_weight_unit: {
            description:
                "Choisis si les poids s'affichent et se saisissent en kg ou en lb. Les valeurs stockées ne changent pas — seuls l'affichage et l'interprétation par défaut changent.",
            params: {},
            example: "Utilise les livres pour mon poids à partir de maintenant",
        },
        get_weight_unit: {
            description:
                "Vérifie quelle unité de poids tu utilises actuellement.",
            params: {},
            example: "Quelle unité de poids j'utilise ?",
        },
        set_nutrition_goals: {
            description:
                "Définis tes objectifs quotidiens de calories, macros, fibres, sucre, alcool, caféine et eau, plus un poids cible facultatif. Les calories, protéines, glucides, lipides, fibres et eau sont des cibles à atteindre ; le sucre, l'alcool et la caféine sont des limites à ne pas dépasser, et la progression est formulée en conséquence. Seuls les champs que tu nommes sont mis à jour ; les autres restent inchangés.",
            params: {
                daily_calories:
                    "Objectif calorique quotidien (kcal). Null pour effacer.",
                daily_protein_g:
                    "Objectif quotidien de protéines (grammes). Null pour effacer.",
                daily_carbs_g:
                    "Objectif quotidien de glucides (grammes). Null pour effacer.",
                daily_fat_g:
                    "Objectif quotidien de lipides (grammes). Null pour effacer.",
                daily_fiber_g:
                    "Objectif quotidien de fibres (grammes), un minimum à atteindre. Null pour effacer.",
                daily_sugar_g:
                    "Limite quotidienne de sucres <b>totaux</b> (grammes), un maximum à ne pas dépasser. Les sucres totaux incluent le sucre naturellement présent dans les fruits et le lait, donc les recommandations publiques sur le sucre ajouté donnent un chiffre bien plus bas. Null pour effacer.",
                daily_alcohol_g:
                    "Limite quotidienne d'alcool en grammes d'<b>éthanol pur</b>, un maximum à ne pas dépasser. Un verre standard américain fait 14 g, une unité britannique 7,9 g. Null pour effacer.",
                daily_caffeine_mg:
                    "Limite quotidienne de caféine en <b>milligrammes</b>, un maximum à ne pas dépasser. Le plafond de l'EFSA et de la FDA pour un adulte en bonne santé est de 400 mg par jour (environ quatre cafés filtre), et 200 mg pendant la grossesse. 0 est une limite réelle signifiant aucune caféine du tout. Null pour effacer.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Mets mes objectifs à 2 200 calories, 160 g de protéines et un poids cible de 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Affiche tes objectifs quotidiens actuels de calories et macros, ton éventuel objectif de fibres et tes limites de sucre ou de caféine, et — si tu suis l'alcool — ta limite d'alcool.",
            params: {},
            example: "Quels sont mes objectifs quotidiens ?",
        },
        get_goal_progress: {
            description:
                "Affiche comment ta consommation du jour se compare à tes objectifs — anneaux consommation/objectif plus progression du poids corporel. Touche un anneau de macro pour voir quels repas y ont contribué.",
            params: {},
            example: "Où j'en suis par rapport à mes objectifs aujourd'hui ?",
        },
        get_nutrition_summary: {
            description:
                "Obtiens les totaux nutritionnels quotidiens sur une période sous forme de tableau de bord interactif : tuiles de macros comparées aux objectifs et un détail jour par jour.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date: "Date de fin (AAAA-MM-JJ)",
            },
            example: "Donne-moi un résumé de la semaine dernière",
        },
        get_trends: {
            description:
                "Moyennes glissantes sur 7/14/30 jours, variabilité, séries d'enregistrement, répartition par jour de la semaine, et tes meilleurs et pires jours pour les calories et chaque macro — précalculés pour que l'IA puisse simplement les commenter.",
            params: {
                days: "Taille de la période en jours (30 par défaut, 365 maximum).",
            },
            example:
                "Quelles sont mes tendances de calories et de macros sur les 30 derniers jours ?",
        },
        get_meal_patterns: {
            description:
                "Fait ressortir des habitudes de comportement : la fréquence de chaque type de repas, l'effet petit-déjeuner, les déjeuners très caloriques, les dîners tardifs, semaine contre week-end, et les journées atypiques.",
            params: {
                days: "Taille de la période en jours (30 par défaut, 7 minimum, 365 maximum).",
            },
            example:
                "Des habitudes dans ma façon de manger — comme des dîners tardifs ou sauter le petit-déjeuner ?",
        },
        set_timezone: {
            description:
                "Définis ton fuseau horaire IANA pour que tes journées basculent à minuit heure locale — un repas enregistré à 23h compte pour ce jour-là, pas le suivant en UTC.",
            params: {},
            example: "Je suis à Berlin — configure mon fuseau horaire",
        },
        get_timezone: {
            description:
                "Vérifie le fuseau horaire configuré, ainsi que ta date et heure locales actuelles (UTC par défaut si non configuré).",
            params: {},
            example: "Sur quel fuseau horaire suis-je réglé ?",
        },
        get_current_time: {
            description:
                "Vérifie la date et l'heure actuelles dans ton fuseau horaire, plus l'instant UTC. Certaines apps ne disent pas à l'assistant quelle heure il est, c'est donc ainsi qu'il détermine ce que « ce matin » ou « aujourd'hui » signifie sans avoir à te le demander (UTC par défaut si aucun fuseau horaire n'est configuré).",
            params: {},
            example: "Quelle heure est-il pour moi en ce moment ?",
        },
        set_widget_display: {
            description:
                "Active ou désactive les widgets visuels dans le chat — les tableaux de bord, anneaux d'objectifs et graphiques de tendances. Une fois désactivés, les mêmes outils répondent uniquement en texte et données. Activés par défaut ; le changement s'applique aux nouvelles conversations.",
            params: {
                enabled:
                    "true pour afficher les widgets, false pour des réponses en texte seul",
            },
            example: "Désactive les widgets",
        },
        get_widget_display: {
            description:
                "Vérifie si les widgets visuels du chat sont actuellement activés.",
            params: {},
            example: "Est-ce que les widgets sont activés ?",
        },
        set_alcohol_tracking: {
            description:
                "Active ou désactive le suivi de l'alcool, et choisis si les boissons sont comptées en verres standards américains ou en unités britanniques. C'est désactivé par défaut, il faut donc le demander explicitement. Le redésactiver masque l'alcool des repas, objectifs et progression et empêche l'importateur de fichiers de lire la colonne alcool d'un fichier — rien de déjà enregistré n'est supprimé, ton export CSV l'inclut toujours, et il réapparaît si tu le réactives. Le changement s'applique dès ton prochain message, rien à redémarrer.",
            params: {
                enabled:
                    "true pour afficher l'alcool dans les repas, objectifs et progression, false pour le masquer",
                drink_unit:
                    "Quel verre standard afficher à côté des grammes : <code>us</code> (14 g par verre) ou <code>uk</code> (7,9 g par unité). Par défaut <code>us</code> ; ce qui est réellement stocké, ce sont des grammes d'éthanol pur.",
            },
            example:
                "Commence à suivre ma consommation d'alcool, en unités britanniques",
        },
        get_alcohol_tracking: {
            description:
                "Vérifie si le suivi de l'alcool est activé, et à quel verre standard tes grammes sont associés.",
            params: {},
            example: "Est-ce que je suis ma consommation d'alcool ?",
        },
        delete_account: {
            description:
                "Supprime définitivement ton compte et toutes les données associées. C'est irréversible — l'IA te demande toujours confirmation avant.",
            params: {},
            example: "Supprime mon compte et toutes mes données",
        },
    },
};

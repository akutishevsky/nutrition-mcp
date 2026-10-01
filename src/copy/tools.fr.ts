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
        title: "36 outils : calories, macros, eau et poids",
        description:
            "Les 36 outils Nutrition MCP pour Claude, ChatGPT et d'autres IA : repas, codes-barres, import CSV MyFitnessPal ou Cronometer, suivi de l'eau et du poids.",
        ogDescription:
            "Les 36 outils que le serveur Nutrition MCP donne à ton IA, dont un importateur CSV pour ton historique venu d'une autre app — avec descriptions et exemples de formulations.",
    },
    hero: {
        eyebrow: "Référence",
        titleBeforeEm: "Tout ce que ton IA peut ",
        titleEm: "faire",
        titleAfterEm: "",
        lead: "Tu n'appelles jamais ces outils directement — tu parles simplement à Claude, à ChatGPT ou à un autre client MCP, et il choisit le bon outil. Voici tous les outils que le serveur Nutrition MCP expose pour les repas, les calories et les macros, l'eau et le poids, avec ce que fait chacun et une phrase qui le déclenche.",
        countBold: "36 outils",
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
            title: "Suivi de l'eau",
            description: "Suis ton hydratation en plus de tes repas.",
        },
        weight: {
            pillLabel: "Poids",
            title: "Suivi du poids",
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
        categoriesLabel: "Catégories d'outils",
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
                "Récupère les valeurs nutritionnelles de l'étiquette d'un produit emballé depuis Open Food Facts à partir de son code-barres (EAN/UPC de 8 à 14 chiffres), ainsi que son Nutri-Score et son groupe de transformation NOVA quand Open Food Facts les a. Tu peux taper les chiffres ou les lire sur une photo de l'emballage ; le résultat peut ensuite être enregistré, ajusté à la quantité que tu as mangée.",
            params: {},
            example: "Scanne ce code-barres : 3017620422003",
            photoHint:
                "…ou envoie une photo de l'emballage — l'IA y lit les chiffres du code-barres.",
        },
        start_meal_import: {
            description:
                "Ouvre un importateur dans le chat pour récupérer ton historique depuis une autre app — choisis le CSV exporté depuis MyFitnessPal, Cronometer, Lose It!, MacroFactor ou une autre app de suivi, associe ses colonnes aux calories, macros, fibres, sucre et caféine — plus l'alcool si tu as activé son suivi — et vérifie ce qui sera ajouté avant de confirmer. Le fichier est lu dans ton navigateur, rien n'est enregistré tant que tu n'as pas validé l'aperçu, et importer le même fichier à nouveau ne crée pas de doublons.",
            params: {},
            example: "Importe mon historique de repas depuis MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Ajoute un lot de repas passés en une seule fois — jusqu'à 50 à la fois — plutôt que de les enregistrer un par un. L'importateur ci-dessus passe par cet outil, et l'IA peut aussi l'utiliser directement pour des données de repas que tu as collées dans le chat. Chaque ligne est d'abord vérifiée et tout ce qui ne convient pas est signalé ligne par ligne, donc renvoyer les mêmes lignes est sans risque et ne dupliquera pas ce qui est déjà enregistré, tant que ton fuseau horaire n'a pas changé entre-temps.",
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
                "Modifie les détails d'un repas déjà enregistré — sa description, une macro, les fibres, le sucre, l'alcool ou la caféine, l'heure, ou les notes. C'est aussi comme ça qu'un manque est comblé : si un repas a été enregistré sans ses fibres ou son sucre, le serveur le signale et l'IA les renseigne ici si tu es d'accord.",
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
            params: {
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Qu'est-ce que j'ai mangé aujourd'hui ?",
        },
        get_meals_by_date: {
            description: "Affiche tous les repas enregistrés un jour précis.",
            params: {
                date: "Date au format AAAA-MM-JJ",
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Montre-moi tout ce que j'ai mangé le 4 juillet",
        },
        get_meals_by_date_range: {
            description:
                "Récupère tous les repas entre deux dates en une fois — pratique pour passer en revue une semaine ou un mois. Un appel couvre jusqu'à 31 jours ; pour des périodes plus longues, les tendances et les résumés donnent des totaux quotidiens.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date:
                    "Date de fin (AAAA-MM-JJ), au plus 31 jours, jour de début compris",
                detail: "<code>compact</code> (par défaut) pour une ligne par repas avec son identifiant, ou <code>full</code> pour inclure les notes et les heures exactes",
            },
            example: "Liste mes repas du lundi au vendredi",
        },
        export_all_data: {
            description:
                "Exporte tout ce que le service stocke à ton sujet dans un seul ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv, account.csv (ton compte de connexion), telemetry.csv (l'historique d'utilisation des outils), connections.csv (tes applications d'IA connectées, sans aucun jeton), et un README.txt expliquant les colonnes, les unités et ce qui n'est pas inclus — et te renvoie un lien de téléchargement privé, valable 60 minutes. Les repas sont pour l'instant la seule partie qui peut être réimportée.",
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
                weight: "Valeur du poids corporel, en <code>unit</code> (&gt; 0).",
            },
            example: "Enregistre mon poids — 74,2 kg ce matin",
        },
        update_weight: {
            description:
                "Corrige une pesée existante — la valeur, l'horodatage, ou ses notes.",
            params: {
                id: "UUID de la pesée à modifier",
                weight: "Nouvelle valeur du poids, en <code>unit</code>.",
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
                    "Limite quotidienne de caféine en <b>milligrammes</b>, un maximum à ne pas dépasser. L'EFSA et la FDA fixent le plafond pour un adulte en bonne santé à 400 mg par jour (environ quatre cafés filtre) ; le chiffre de l'EFSA pour la grossesse est de 200 mg. 0 est une limite réelle signifiant aucune caféine du tout. Null pour effacer.",
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
                "Obtiens les totaux nutritionnels quotidiens sur une période sous forme de tableau de bord interactif : tuiles de macros comparées aux objectifs et un détail jour par jour. Un appel couvre jusqu'à 92 jours ; pour des périodes plus longues, les tendances donnent des moyennes glissantes.",
            params: {
                start_date: "Date de début (AAAA-MM-JJ)",
                end_date:
                    "Date de fin (AAAA-MM-JJ), au plus 92 jours, jour de début compris",
            },
            example: "Donne-moi un résumé de la semaine dernière",
        },
        get_trends: {
            description:
                "Moyennes glissantes sur 7/14/30 jours, variabilité, séries d'enregistrement, moyennes de calories par jour de la semaine, et tes meilleurs et pires jours selon les calories — précalculés pour que l'IA puisse simplement les commenter.",
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
        get_profile: {
            description:
                "Affiche tes réglages actuels en un coup d'œil : fuseau horaire (plus la date et l'heure locales), langue des widgets, unité de poids préférée, si les widgets interactifs dans le chat sont activés, et si le suivi de l'alcool est activé.",
            params: {},
            example: "Quels sont mes réglages actuels ?",
        },
        set_timezone: {
            description:
                "Définis ton fuseau horaire IANA pour que tes journées basculent à minuit heure locale — un repas enregistré à 23h compte pour ce jour-là, pas le suivant en UTC.",
            params: {},
            example: "Je suis à Berlin — configure mon fuseau horaire",
        },
        set_language: {
            description:
                "Définis la langue de l'interface pour les widgets interactifs dans le chat — les tableaux de bord et graphiques, pas ce que l'IA t'écrit.",
            params: {
                locale: "Code ISO 639-1, par exemple <code>de</code>, <code>ja</code>. Langues prises en charge : anglais, allemand, espagnol, français, néerlandais, polonais, italien, ukrainien, japonais.",
            },
            example: "Affiche mes widgets en allemand",
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
        delete_account: {
            description:
                "Supprime définitivement ton compte Nutrition MCP et toutes les données qu'il conserve sur toi. C'est irréversible : l'outil ne fait rien sans confirmation explicite, et l'IA est invitée à vérifier avec toi avant de l'envoyer.",
            params: {},
            example: "Supprime mon compte et toutes mes données",
        },
    },
    troubleshooting: {
        pillLabel: "Aide",
        title: "Dépannage",
        description:
            "Quelque chose ne marche pas ? La plupart des problèmes se règlent vite.",
        stillStuck: "Toujours bloqué ?",
        items: {
            "cannot-connect": {
                question:
                    "Le connecteur ne se connecte pas, ou me redemande sans cesse de me connecter",
                answerHtml:
                    "Supprime le connecteur et ajoute-le à nouveau avec exactement <code>https://nutrition-mcp.com/mcp</code> — la partie <code>/mcp</code> est indispensable. Dans Claude, ouvre <strong>Customize</strong> → <strong>Connectors</strong>, déconnecte Nutrition puis reconnecte-le ; dans ChatGPT, passe par <strong>Settings</strong> → <strong>Apps</strong>. Connecte-toi avec la même adresse e-mail et le même mot de passe, ou le même compte Google, qu'avant : tes données appartiennent à ton compte, pas à la connexion, donc te reconnecter ne te fait rien perdre. Une fois connecté, le connecteur le reste tant que tu l'utilises au moins une fois tous les 90 jours ; s'il cesse de fonctionner, le reconnecter de la même façon règle le problème.",
            },
            "session-expired": {
                question:
                    'La page de connexion affiche {"error":"session_expired"}',
                answerHtml:
                    "La page de connexion n'est valable que 10 minutes, et elle est aussi réinitialisée à chaque redémarrage du serveur pour une mise à jour. Retourne sur la page de connexion et recharge-la, ou relance la connexion depuis ton app d'IA, puis connecte-toi sans trop attendre. Si elle affiche plutôt <code>session_mismatch</code>, la connexion a été terminée dans un autre navigateur que celui qui l'avait ouverte : recommence depuis ton app d'IA et va jusqu'au bout dans ce même navigateur.",
            },
            "cannot-sign-in": {
                question:
                    "Je n'arrive pas à me connecter, ou j'ai oublié mon mot de passe",
                answerHtml:
                    "Utilise <strong>Se connecter</strong> pour un compte que tu as déjà : un e-mail ou un mot de passe incorrect y affiche « E-mail ou mot de passe incorrect » et ne crée jamais de nouveau compte. <strong>Créer un compte</strong> ne sert qu'à ta première visite. Vérifie qu'il n'y a pas de faute de frappe dans l'e-mail. Si tu as créé ton compte avec <strong>Continuer avec Google</strong>, utilise à nouveau ce bouton. Il n'y a pas encore de réinitialisation du mot de passe en libre-service : écris à <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a> depuis l'adresse de ton compte et je le réinitialiserai.",
            },
            "history-missing": {
                question: "Après une reconnexion, mon historique a disparu",
                answerHtml:
                    "Chaque adresse e-mail est un compte distinct : te connecter avec un autre e-mail ouvre donc un compte vide — rien n'a été supprimé. Déconnecte le connecteur et reconnecte-toi avec l'adresse que tu utilisais au départ. Si tu ne sais plus laquelle c'était, écris à <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a>.",
            },
            "tools-not-used": {
                question: "L'IA répond mais n'enregistre rien",
                answerHtml:
                    "Vérifie que le connecteur est activé pour cette conversation — dans Claude, regarde le menu des outils dans la zone de message — et demande-le directement, par exemple « enregistre mon petit-déjeuner dans Nutrition ». Si ton app demande l'autorisation d'utiliser un outil, accepte.",
            },
            "wrong-day": {
                question: "Mes repas apparaissent au mauvais jour",
                answerHtml:
                    "Les jours sont comptés dans ton fuseau horaire ; si tu n'en as jamais défini, c'est l'UTC qui s'applique. Demande « quel fuseau horaire est configuré ? » (<a href=\"#get_profile\"><code>get_profile</code></a>) et, s'il est faux, « règle mon fuseau horaire sur Europe/Berlin » (<a href=\"#set_timezone\"><code>set_timezone</code></a>). Tout ce que tu as enregistré est alors regroupé selon ton jour local, entrées passées comprises. Seule exception : une entrée à laquelle tu as donné une heure précise pendant que le fuseau était faux garde l'instant auquel elle a été enregistrée, et peut donc rester décalée d'une heure ou d'un jour — demande à l'IA de la déplacer à la bonne date et à la bonne heure (<a href=\"#update_meal\"><code>update_meal</code></a>). Définis aussi ton fuseau horaire avant d'importer ton historique : les repas importés gardent l'instant auquel ils ont été placés, et importer à nouveau le fichier d'une autre app après avoir changé de fuseau les ajoute une seconde fois. Un export Nutrition MCP est reconnu et n'est pas dupliqué.",
            },
            "no-widgets": {
                question: "Je ne vois que du texte, sans graphiques ni cartes",
                answerHtml:
                    "Les cartes visuelles nécessitent une app compatible avec les panneaux interactifs MCP Apps, comme Claude ou ChatGPT ; les autres clients reçoivent les mêmes informations sous forme de texte. Si tu as désactivé les widgets, demande à les réactiver (<a href=\"#set_widget_display\"><code>set_widget_display</code></a>) et ouvre une nouvelle conversation — un chat déjà ouvert garde l'ancien réglage jusqu'à sa reconnexion. La petite carte qui suit l'enregistrement d'un repas n'apparaît qu'une fois tes objectifs quotidiens définis (<a href=\"#set_nutrition_goals\"><code>set_nutrition_goals</code></a>).",
            },
            "import-problems": {
                question:
                    "L'importateur ne s'ouvre pas, ou dit qu'il ne peut pas enregistrer",
                answerHtml:
                    "Le panneau d'import nécessite une app qui affiche les panneaux interactifs, avec les widgets activés. S'il affiche <em>Cet hôte ne permet pas à cette vue d'écrire dans ton journal</em>, ou s'il n'apparaît pas du tout, demande à l'IA d'importer le fichier elle-même : joins ou colle le CSV et elle utilisera <a href=\"#bulk_import_meals\"><code>bulk_import_meals</code></a>, qui vérifie chaque ligne et ignore les doublons, donc le renvoyer est sans risque tant que ton fuseau horaire n'a pas changé entre-temps. Définis ton fuseau horaire avant le premier import : réimporter le fichier d'une autre app après un changement ajoute les lignes une nouvelle fois. Si tu utilises le panneau d'import et veux conserver une colonne d'alcool, active d'abord le suivi de l'alcool : le panneau ignore cette colonne tant que le suivi est désactivé, et un nouvel import plus tard ne la remplira pas.",
            },
            "rate-limited": {
                question:
                    "Je vois « Rate limit exceeded » ou « Too many failed authentication attempts »",
                answerHtml:
                    "Chaque compte peut faire 60 requêtes par minute, et chaque appel d'outil en compte au moins une. Attends le nombre de secondes indiqué dans le message, puis continue. Pour rattraper beaucoup de repas passés, utilise l'importateur plutôt que de les enregistrer un par un. Les pages de connexion acceptent 30 requêtes par minute par réseau. Après 20 tentatives de connexion refusées d'affilée depuis un même réseau — en général un ancien connecteur déconnecté qui réessaie encore — les connexions depuis ce réseau sont suspendues pendant 5 minutes, et les suspensions suivantes s'allongent jusqu'à une heure au maximum. Supprimer l'ancien connecteur puis l'ajouter à nouveau met fin à ces tentatives.",
            },
            "barcode-not-found": {
                question:
                    "Un code-barres est introuvable, ou ses valeurs semblent fausses",
                answerHtml:
                    "Les données des codes-barres viennent d'Open Food Facts, une base de données collaborative : certains produits y manquent et certaines fiches sont obsolètes. Vérifie que les 8 à 14 chiffres sous le code-barres ont tous été lus correctement. Si le produit n'y figure pas, l'IA peut faire une estimation à partir du nom ou d'une photo de l'étiquette nutritionnelle, et tu peux corriger n'importe quelle valeur ensuite. Ajouter le produit sur openfoodfacts.org aide tout le monde. Open Food Facts n'a pas de données sur la caféine : elle vient donc de l'étiquette ou de quantités typiques.",
            },
            "export-link": {
                question:
                    "Mon lien de téléchargement d'export ne fonctionne pas",
                answerHtml:
                    'Les liens d\'export expirent au bout de 60 minutes, et chaque nouvel export remplace le fichier précédent. Demande un nouvel export (<a href="#export_all_data"><code>export_all_data</code></a>) et télécharge-le tout de suite. Si l\'export indique 0 repas alors que tu attendais ton historique, tu utilises probablement une autre adresse e-mail pour te connecter — voir <a href="#history-missing">historique disparu</a>.',
            },
            "delete-account": {
                question: "Comment supprimer mon compte ?",
                answerHtml:
                    "Demande à l'IA de supprimer ton compte Nutrition MCP (<a href=\"#delete_account\"><code>delete_account</code></a>). Elle te demandera de confirmer, puis supprimera définitivement tes repas, ton eau, ton poids, tes objectifs, tes réglages, l'historique des outils utilisés par ton app d'IA, tout fichier d'export, tes identifiants de connexion et le compte lui-même. C'est irréversible : exporte d'abord tes données si tu veux en garder une copie. Retire ensuite le connecteur de ton app. Te reconnecter plus tard avec le même e-mail crée un nouveau compte, vide.",
            },
            "report-a-problem": {
                question:
                    "Comment signaler un bug ou un problème de sécurité ?",
                answerHtml:
                    'Signale les bugs sur <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> : indique quelle app tu utilises (Claude, ChatGPT, …), ce que tu as demandé, ce qui s\'est passé et à peu près quand. N\'inclus jamais ton mot de passe. Merci de ne pas signaler publiquement les problèmes de sécurité : signale-les en privé via le <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">signalement privé de vulnérabilités de GitHub</a> ou par e-mail, comme le décrit la <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">politique de sécurité</a>. Pour tout le reste, écris à <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

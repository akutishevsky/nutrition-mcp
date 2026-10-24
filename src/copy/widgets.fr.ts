import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_FR: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calories",
            protein_g: "Protéines",
            carbs_g: "Glucides",
            fat_g: "Lipides",
            sugar_g: "Sucres",
            added_sugar_g: "Sucres ajoutés",
            saturated_fat_g: "Acides gras saturés",
            trans_fat_g: "Acides gras trans",
            alcohol_g: "Alcool",
            caffeine_mg: "Caféine",
            sodium_mg: "Sodium",
            fiber_g: "Fibres",
            water_ml: "Eau",
        },
        noGoalSet: "aucun objectif",
        atLimit: "limite atteinte",
        floorUnder: "à prendre",
        ceilingUnder: "de marge",
        over: "en trop",
        limitPrefix: "limite",
        ofPrefix: "sur",
        drinkLabels: { us: "verres US", uk: "unités UK" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "rien d'enregistré",
        notRecorded: "non renseigné",
        caloriesToday: "Calories du jour",
        caloriesOn: "Calories · {date}",
        tapHint: "Touche une valeur pour voir les repas concernés",
        showMealsContributed: "Afficher les repas concernés.",
        byMealTitle: "{label} par repas",
        closeBreakdown: "Fermer le détail",
        noMealsContributed: "{label} : aucun repas enregistré n'y a contribué.",
        untitledMeal: "Repas sans nom",
        moreMeals: {
            one: "+ {n} repas plus petit",
            other: "+ {n} repas plus petits",
        },
        moreMealsAtLeast: {
            one: "+ au moins {n} repas plus petit",
            other: "+ au moins {n} repas plus petits",
        },
        moreMealsMaybe: "+ peut-être d'autres repas plus petits",
        ingredientCount: {
            one: "{n} ingrédient",
            other: "{n} ingrédients",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "perso",
        sourceEst: "est.",
        sourceMixed: "mixte",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "code-barres",
        sourceDataType: "type de données",
        sourceAria: "Source : {source}",
        sourceDetailsAria: "Afficher les détails de la source",
    },
    bridge: {
        settingsFooter:
            "Tu peux activer ou désactiver ces widgets quand tu veux : il suffit de demander à modifier tes paramètres.",
        connectFailed: "Cette vue n'a pas pu se connecter à son hôte.",
    },
    nutritionSummary: {
        title: "Résumé nutritionnel",
        loading: "Chargement de ton résumé nutritionnel…",
        empty: "Aucun repas ni apport d'eau enregistré sur cette période.",
        caloriesPerDay: "Calories / jour",
        chartAriaLabel: "Calories par jour sur la période sélectionnée",
        avg: "moy.",
        goal: "objectif",
        dailyAvgLoggedDays: "Moy. par jour · jours renseignés",
        total: "Total",
        daysLogged: {
            one: "{n} jour renseigné",
            other: "{n} jours renseignés",
        },
        daysOfLogged: "{logged} jours renseignés sur {span}",
        months: [
            "janv.",
            "févr.",
            "mars",
            "avr.",
            "mai",
            "juin",
            "juil.",
            "août",
            "sept.",
            "oct.",
            "nov.",
            "déc.",
        ],
    },
    goalProgress: {
        loading: "Chargement de ta progression…",
        title: "Progression des objectifs",
        empty: "Aucune progression à afficher.",
        nothingLoggedFor: "{date} : rien d'enregistré pour l'instant.",
        thisDay: "Ce jour",
        mealsCount: { one: "{n} repas", other: "{n} repas" },
        waterCount: { one: "{n} entrée d'eau", other: "{n} entrées d'eau" },
        weightLabel: "Poids",
        weightNoneNoTarget:
            "Aucun poids enregistré pour l'instant. Enregistre une pesée avec log_weight pour suivre ta progression.",
        weightNoneWithTarget:
            "Aucun poids enregistré pour l'instant. Enregistre une pesée avec log_weight pour suivre ta progression vers ton objectif de {target}.",
        weightNoGoal:
            "Poids : {reading}, aucun objectif défini. Définis-en un avec set_nutrition_goals pour suivre ta progression ici.",
        atTarget: "objectif atteint",
        toLose: "{amount} à perdre",
        toGain: "{amount} à prendre",
        lastLogged: "dernière pesée le {date}",
        weightAria: "Poids {current}, objectif {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Repas enregistré",
        titleUpdated: "Repas mis à jour",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Chargement de tes tendances…",
        title: "Tendances",
        empty: "Aucun repas ni apport d'eau enregistré sur cette période pour l'instant.",
        avgUnder: "en moins",
        loggedOfTotal: "{logged}/{total} jours renseignés",
        caloriesOverRange: "Calories par jour sur les {range} derniers jours",
        windowAriaLabel: "Période",
        rangeDaysAriaLabel: "{n} jours",
        avgAllDays: "Moy. sur {range} jours · tous les jours",
        segWeek: "Sem.",
        segMonth: "Mois",
        segQuarter: "Trim.",
        segYear: "Année",
        segDays: "Jours",
        segWeekAria: "Afficher les moyennes hebdomadaires",
        segMonthAria: "Afficher les moyennes mensuelles",
        segQuarterAria: "Afficher les moyennes trimestrielles",
        segYearAria: "Afficher les moyennes annuelles",
        segDaysAria: "Afficher les tendances quotidiennes",
        periodTitleWeek: "Moyennes hebdomadaires",
        periodTitleMonth: "Moyennes mensuelles",
        periodTitleQuarter: "Moyennes trimestrielles",
        periodTitleYear: "Moyennes annuelles",
        perLoggedDay: "par jour renseigné",
        daysLogged: "{logged}/{total} jours",
        onTarget: "dans l'objectif {k}/{n}",
        possiblyIncomplete: {
            one: "{n} peut-être incomplet",
            other: "{n} peut-être incomplets",
        },
        partial: "en cours",
        nothingLogged: "rien de renseigné",
        targetsChanged: "objectifs modifiés en cours de période",
        targetsAssumed: "objectifs avant le {date} non enregistrés",
        noTargets: "Aucun objectif défini : moyennes seules.",
        quarter: "T{q} {year}",
    },
    weightTrends: {
        loading: "Chargement de l'évolution de ton poids…",
        empty: "Aucun poids enregistré sur cette période pour l'instant.",
        eyebrowToday: "Weight · today", // i18n:pending
        eyebrowLast: "Weight · last weigh-in {date}", // i18n:pending
        titleFirst: "First weigh-in logged", // i18n:pending
        titleFew: "A few weigh-ins so far", // i18n:pending
        titleNoRate: "Not enough recent weigh-ins for a weekly rate", // i18n:pending
        titleSteady: "Holding steady", // i18n:pending
        titleDown: "Trending down", // i18n:pending
        titleUp: "Trending up", // i18n:pending
        titleGoalReached: "Goal reached", // i18n:pending
        titleAway: "Drifting away from your goal", // i18n:pending
        titleOnTrack: "On track for your goal", // i18n:pending
        titleShortSteady: "Holding steady, short of your goal", // i18n:pending
        rangeGroupAriaLabel: "Range", // i18n:pending
        ranges: {
            // i18n:pending
            "7": {
                // i18n:pending
                label: "7d", // i18n:pending
                aria: "Show last 7 days", // i18n:pending
                word: "the last 7 days", // i18n:pending
                inRange: "in 7 days", // i18n:pending
                heading: "last 7 days", // i18n:pending
                chip: "7 d", // i18n:pending
            }, // i18n:pending
            "30": {
                // i18n:pending
                label: "30d", // i18n:pending
                aria: "Show last 30 days", // i18n:pending
                word: "the last 30 days", // i18n:pending
                inRange: "in 30 days", // i18n:pending
                heading: "last 30 days", // i18n:pending
                chip: "30 d", // i18n:pending
            }, // i18n:pending
            "90": {
                // i18n:pending
                label: "90d", // i18n:pending
                aria: "Show last 90 days", // i18n:pending
                word: "the last 90 days", // i18n:pending
                inRange: "in 90 days", // i18n:pending
                heading: "last 90 days", // i18n:pending
                chip: "90 d", // i18n:pending
            }, // i18n:pending
            "1y": {
                // i18n:pending
                label: "1y", // i18n:pending
                aria: "Show last year", // i18n:pending
                word: "the last year", // i18n:pending
                inRange: "in a year", // i18n:pending
                heading: "last year", // i18n:pending
                chip: "1 y", // i18n:pending
            }, // i18n:pending
            all: {
                // i18n:pending
                label: "All", // i18n:pending
                aria: "Show all time", // i18n:pending
                word: "all time", // i18n:pending
                inRange: "overall", // i18n:pending
                heading: "all time", // i18n:pending
                chip: "All", // i18n:pending
            }, // i18n:pending
        }, // i18n:pending
        chip: "{change} · {range}", // i18n:pending
        perWeek: "{amount} per week", // i18n:pending
        perWeekAvg: "{amount} per week on average", // i18n:pending
        toGoal: "{value} to goal", // i18n:pending
        weeksApprox: { one: "~{n} week", other: "~{n} weeks" }, // i18n:pending
        yearsPlus: "2+ years", // i18n:pending
        reachedOn: "reached on {date}", // i18n:pending
        movingAway: "moving away from goal", // i18n:pending
        tooFlat: "too flat to project a goal date", // i18n:pending
        hintFew: "A trend line needs at least 4 weigh-ins in the range", // i18n:pending
        hintNoRate: "The weekly rate needs 4 weigh-ins in the last 3 weeks", // i18n:pending
        statPerWeek: "Per week", // i18n:pending
        statGoalPace: "Goal at this pace", // i18n:pending
        statGoalReached: "Goal reached", // i18n:pending
        statToGoal: "To goal", // i18n:pending
        statSince: "Since {date}", // i18n:pending
        unitWeeks: { one: "week", other: "weeks" }, // i18n:pending
        unitYears: "years", // i18n:pending
        goalPill: "Goal {goal} · {left} to go", // i18n:pending
        goalPillReached: "Goal {goal} ✓", // i18n:pending
        goalBelow: "Goal {goal}  ↓ {left} below", // i18n:pending
        goalAbove: "Goal {goal}  ↑ {left} above", // i18n:pending
        today: "Today", // i18n:pending
        yesterday: "Yesterday", // i18n:pending
        whenTime: "{date}, {time}", // i18n:pending
        scrubAvg: "{value} (avg of {n})", // i18n:pending
        hitLabel: "{date}, {value}", // i18n:pending
        hitLabelAvg: "{date}, {value}, average of {n}", // i18n:pending
        chartAriaLabel:
            "Weight chart, latest {latest}{goal}{change}. Tap a day to read its value.", // i18n:pending
        chartAriaGoal: ", goal {goal}", // i18n:pending
        chartAriaChange: ", {change} {range}", // i18n:pending
        close: "Close", // i18n:pending
        oneTitleFirst: "Your trend starts here", // i18n:pending
        oneTitle: "Only one weigh-in in {range}", // i18n:pending
        oneFirst: "First weigh-in · {when} · {value}", // i18n:pending
        oneLine: "{when} · {value}", // i18n:pending
        oneHintFirst: "The chart starts with a second weigh-in", // i18n:pending
        oneHintEarlier: {
            one: "{n} earlier weigh-in day in longer ranges",
            other: "{n} earlier weigh-in days in longer ranges",
        }, // i18n:pending
        emptyRange: "No weigh-ins in {range}.", // i18n:pending
        emptyRangeLast: "No weigh-ins in {range}. The last one was on {date}.", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        detailsAria: "{action}: weigh-ins and measurements", // i18n:pending
        detailsAriaWeighIns: "{action}: weigh-ins", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        sectionWeighIns: "Weigh-ins", // i18n:pending
        sectionMeasurements: "Body measurements · {range}", // i18n:pending
        accLabel: {
            one: "{n} weigh-in {range}",
            other: "{n} weigh-ins {range}",
        }, // i18n:pending
        accEmpty: "No weigh-ins {range}", // i18n:pending
        accAvgRange: "avg {avg} · range {min}–{max}", // i18n:pending
        loggedToday: "logged today", // i18n:pending
        loggedYesterday: "logged yesterday", // i18n:pending
        loggedOn: "logged on {date}", // i18n:pending
        weekThis: "This week", // i18n:pending
        weekLast: "Last week", // i18n:pending
        weekAvg: "avg {value}", // i18n:pending
        weekVsLast: "{change} vs last week", // i18n:pending
        weekVsBefore: "{change} vs week before", // i18n:pending
        dayMulti: {
            one: "{n} weigh-in · averaged",
            other: "{n} weigh-ins · averaged",
        }, // i18n:pending
        showEarlierWeeks: {
            one: "Show {n} earlier week",
            other: "Show {n} earlier weeks",
        }, // i18n:pending
        sites: {
            // i18n:pending
            waist: "Waist", // i18n:pending
            hips: "Hips", // i18n:pending
            neck: "Neck", // i18n:pending
            chest: "Chest", // i18n:pending
            shoulders: "Shoulders", // i18n:pending
            upper_arm: "Upper arm", // i18n:pending
            forearm: "Forearm", // i18n:pending
            thigh: "Thigh", // i18n:pending
            calf: "Calf", // i18n:pending
        }, // i18n:pending
        measSince: "{change} since {date}", // i18n:pending
        changeDown: "↓ {delta}", // i18n:pending
        changeUp: "↑ {delta}", // i18n:pending
        changeFlat: "→ no change", // i18n:pending
        measFirst: "first measurement · {date}", // i18n:pending
        measFirstRow: "first", // i18n:pending
        measStale: "not measured in this range · last on {date}", // i18n:pending
        measEarlier: "Earlier measurements", // i18n:pending
        measHeading: "{site} · {range}", // i18n:pending
        showMoreN: { one: "Show {n} more", other: "Show {n} more" }, // i18n:pending
        noMeasurements:
            "No body measurements in the last year. Waist, hips and seven other sites can be tracked in centimetres or inches.", // i18n:pending
    },
    importMeals: {
        loading: "Préparation de l'import…",
        stepFile: "Fichier",
        stepMap: "Colonnes",
        stepPreview: "Aperçu",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Date et heure",
            description: "Nom de l'aliment",
            meal_type: "Repas",
            calories: "Calories",
            protein_g: "Protéines (g)",
            carbs_g: "Glucides (g)",
            fat_g: "Lipides (g)",
            fiber_g: "Fibres (g)",
            sugar_g: "Sucres totaux (g)",
            added_sugar_g: "Sucres ajoutés (g)",
            saturated_fat_g: "Acides gras saturés (g)",
            trans_fat_g: "Acides gras trans (g)",
            alcohol_g: "Alcool (g)",
            caffeine_mg: "Caféine (mg)",
            sodium_mg: "Sodium (mg)",
            notes: "Notes",
            time: "Heure (colonne à part)",
            deleted: "Indicateur de suppression",
            source_id: "ID du repas (de notre export)",
            timezone: "Fuseau horaire (de notre export)",
        },
        chooseExportHeading: "Choisis ton export",
        noToolsWarning:
            "Cet hôte ne permet pas à cette vue d'écrire dans ton journal. Demande plutôt à Claude d'importer le fichier : il peut le faire directement.",
        emailFallback:
            "Si ça ne marche pas non plus en passant par Claude, écris à {email}.",
        tzWarning:
            "Ton fuseau horaire n'est pas défini : les heures seront lues en UTC et risquent de tomber sur le mauvais jour. Demande d'abord à Claude de définir ton fuseau horaire.",
        dropChoose: "Choisis un fichier CSV",
        dropOr: "ou glisse-le ici",
        recognizedHint:
            "Les exports de MyFitnessPal, Cronometer, Lose It! et MacroFactor sont reconnus automatiquement. Rien n'est enregistré tant que tu n'as pas confirmé.",
        dateMapHint:
            "Associe une colonne de date ci-dessus pour voir comment une valeur de ton fichier est convertie.",
        dateNoneHint: "Cette colonne ne contient aucune date.",
        dateUnreadable:
            "{raw} → illisible au format {format}, les lignes de ce type seront donc ignorées",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Associe une colonne de calories ci-dessus pour voir comment une valeur de ton fichier est convertie.",
        energyNoneHint: "Cette colonne ne contient aucun nombre.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (sans conversion)",
        dateAmbiguousWarning:
            "Impossible de déterminer le format de date de ce fichier : ses dates se lisent aussi bien jour en premier que mois en premier. Confirme le format exporté par ton app : un mauvais choix classe les repas au mauvais jour, sans aucun message d'erreur.",
        dateFormatLabel: "Format de date de ce fichier",
        dateFormatYmd: "Année-Mois-Jour",
        dateFormatDmy: "Jour/Mois/Année",
        dateFormatMdy: "Mois/Jour/Année",
        energyUnitLabel: "Unité d'énergie de la colonne calories",
        energyUnitKcal: "Calories",
        energyUnitKj: "Kilojoules",
        mapColumnsHeading: "Associer les colonnes",
        rowsCount: { one: "{n} ligne", other: "{n} lignes" },
        columnsCount: { one: "{n} colonne", other: "{n} colonnes" },
        delimiterLabel: "séparateur",
        tabLabel: "tabulation",
        notInFile: "(pas dans ce fichier)",
        columnFallback: "colonne {n}",
        caffeineGramsNotice:
            "La colonne caféine de ce fichier ({column}) est en grammes, alors que la caféine est enregistrée en milligrammes : Caféine n'a donc pas été associée. L'associer enregistrerait 0,18 là où l'étiquette indique 180 mg. Réimporter le même fichier plus tard ne comblera pas ce manque : ces lignes seront déjà enregistrées et seront ignorées comme doublons. Si l'en-tête est mal libellé et que les valeurs sont bien en milligrammes, sélectionne-la ci-dessus ; si elles sont bien en grammes, multiplie-les par 1 000 dans le fichier avant l'import, pas après.",
        alcoholNotice:
            "Ce fichier contient une colonne alcool ({column}), mais le suivi de l'alcool est désactivé pour ce compte : elle ne sera donc pas importée. Réimporter le même fichier plus tard ne comblera pas ce manque : ces lignes seront déjà enregistrées et seront ignorées comme doublons. Pour conserver ces données, demande à Claude d'activer le suivi de l'alcool (set_alcohol_tracking) avant l'import.",
        sampleValue: "ex. {sample}",
        sourceAppLabel: "App source (facultatif)",
        sourceAppHint: "Sert à nommer les lignes sans nom d'aliment.",
        previewButton: "Aperçu de l'import",
        chooseAnotherButton: "Choisir un autre fichier",
        previewHeading: "Aperçu",
        mealsToImport: {
            one: "{n} repas à importer",
            other: "{n} repas à importer",
        },
        kcalTotal: "{kcal} kcal au total",
        rowsSkipped: {
            one: "{n} ligne ignorée",
            other: "{n} lignes ignorées",
        },
        batchCount: { one: "{n} lot", other: "{n} lots" },
        datesReadAs: "Dates lues au format {format} ; énergie {conversion}.",
        energyConvertedNote: "convertie de kJ en kcal",
        energyReadAsKcal: "lue en kcal",
        badDatesWarning: {
            one: "{n} ligne a été ignorée, car sa date n'a pas pu être lue au format {format}{sample}. Reviens en arrière et choisis le format de date de ton fichier.",
            other: "{n} lignes ont été ignorées, car leur date n'a pas pu être lue au format {format}{sample}. Reviens en arrière et choisis le format de date de ton fichier.",
        },
        badDateSample: " (ex. ligne {line} : {value})",
        noTimeWarning: {
            one: "{n} ligne a une date mais pas d'heure : elle sera enregistrée à midi.",
            other: "{n} lignes ont une date mais pas d'heure : elles seront enregistrées à midi.",
        },
        splitDatesCount: {
            one: "{n} date compte",
            other: "{n} dates comptent",
        },
        splitDatesWarning:
            " plus de {max} repas (ex. {date}), l'import a donc dû être réparti sur plusieurs lots. Si cette date contient deux entrées avec exactement le même aliment, le même type de repas et les mêmes macros, l'une d'elles risque d'être ignorée comme doublon au lieu d'être importée.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "G",
            fat_g: "L",
            fiber_g: "Fib",
            sugar_g: "Suc",
            added_sugar_g: "Ajout",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Ligne",
        tableWhen: "Quand",
        tableMeal: "Repas",
        tableFood: "Aliment",
        tableProblem: "Problème",
        noNameFallback: "(sans nom : sera nommé d'après le repas)",
        showingRows: "{shown} lignes affichées sur {total}",
        checkingRows: {
            one: "Vérification de {n} ligne…",
            other: "Vérification de {n} lignes…",
        },
        importingRows: {
            one: "Import de {n} ligne…",
            other: "Import de {n} lignes…",
        },
        batchProgress: "{label} (lot {done} sur {total})",
        rowsRange: "Lignes {a}–{b} : {msg}",
        preflightFailed: "Échec de la vérification préalable.",
        rowsWouldFail: {
            one: "{n} ligne échouerait, ex. ligne {line} : {message}",
            other: "{n} lignes échoueraient, ex. ligne {line} : {message}",
        },
        importingEllipsis: "Import en cours…",
        importButton: {
            one: "Importer {n} repas",
            other: "Importer {n} repas",
        },
        backToMapping: "Retour aux colonnes",
        importCompleteHeading: "Import terminé",
        resultMealsImported: {
            one: "{n} repas importé",
            other: "{n} repas importés",
        },
        resultAlreadyLogged: {
            one: ", {n} déjà enregistré",
            other: ", {n} déjà enregistrés",
        },
        resultFailed: {
            one: ", {n} en échec",
            other: ", {n} en échec",
        },
        resultSkipped: {
            one: ", {n} ignoré",
            other: ", {n} ignorés",
        },
        restartButton: "Importer un autre fichier",
        couldNotReadFile: "Impossible de lire ce fichier : {msg}",
        noDataRows: "Aucune ligne de données dans ce fichier.",
        emailNotice:
            "Ça ne marche pas comme prévu ? Écris à {email} en joignant les lignes ci-dessous : c'est tout ce qu'il faut pour diagnostiquer le problème.",
    },
};

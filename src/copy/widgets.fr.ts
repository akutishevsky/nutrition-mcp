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
        title: "Poids",
        empty: "Aucun poids enregistré sur cette période pour l'instant.",
        rangeEmpty:
            "Aucune pesée sur les {range} derniers jours. Essaie une période plus longue.",
        windowAriaLabel: "Période",
        rangeAriaLabel: "{n} derniers jours",
        chartAriaLabel: "Poids du {from} au {to}, dernière pesée : {latest}",
        trendChartAriaLabel:
            "Poids du {from} au {to} avec courbe de tendance lissée, dernière pesée : {latest}",
        latest: "Dernière pesée",
        needTwo: "il faut au moins 2 pesées",
        sinceDate: "{change} depuis le {date}",
        weighIns: { one: "{n} pesée", other: "{n} pesées" },
        atTarget: "objectif atteint",
        toLose: "{amount} à perdre",
        toGain: "{amount} à prendre",
        target: "Objectif {value}",
        noTarget: "Aucun objectif",
        trend: "Tendance",
        scaleToday: "Balance aujourd'hui {value}",
        perWeek: "{amount}/sem.",
        rateAriaLabel:
            "Tendance : {amount} par semaine sur les 2 dernières semaines",
        rateTwoWeeks: "rythme 2 sem.",
        range1y: "1 an",
        rangeAll: "Tout",
        range1yAriaLabel: "Dernière année",
        rangeAllAriaLabel: "Tout l'historique",
        sinceMonth: "{change} depuis {date}",
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
        eyebrow: "Import meals", // i18n:pending
        eyebrowWithFile: "Import meals · {file}", // i18n:pending
        stepsLabel: "Import steps", // i18n:pending
        stepAriaDone: "Step {i} of 4: {name}, completed", // i18n:pending
        stepAriaCurrent: "Step {i} of 4: {name}, current", // i18n:pending
        stepAriaUpcoming: "Step {i} of 4: {name}", // i18n:pending
        browseFiles: "Browse files", // i18n:pending
        dropAccept: ".csv or tab-separated text", // i18n:pending
        dropAria: "Choose a CSV file, or drag it here", // i18n:pending
        privacyNote:
            "The file is read here, in this panel. Its rows never pass through the chat — the assistant only gets a one-line summary when the import finishes.", // i18n:pending
        binaryFile:
            "Could not read that file: this looks like a binary file (an Excel workbook?), not CSV text. Export it as CSV and try again.", // i18n:pending
        columnsHeading: "Columns", // i18n:pending
        fieldsMatched: {
            one: "{n} of {total} field matched",
            other: "{n} of {total} fields matched",
        }, // i18n:pending
        tableFieldHead: "Field", // i18n:pending
        tableColumnHead: "Column in your file", // i18n:pending
        tableRow1Head: "Row 1 value", // i18n:pending
        badgeNew: "new", // i18n:pending
        colNumber: "Col {n}", // i18n:pending
        colNumberAuto: "Col {n} · auto", // i18n:pending
        colNumberManual: "Col {n} · set by you", // i18n:pending
        row1Empty: "row 1 empty", // i18n:pending
        alsoUsed: "also {field}", // i18n:pending
        sameColumn: "Same column as {fields}", // i18n:pending
        columnForAria: "Column for {field}", // i18n:pending
        mapRowAria: "{field}{required}: {column}{sample}", // i18n:pending
        requiredAria: ", required", // i18n:pending
        columnAria: "column {n}, {name}", // i18n:pending
        notInFileAria: "not in this file", // i18n:pending
        sampleAria: ", {sample}", // i18n:pending
        howRead: "How values are read", // i18n:pending
        appExport: "{app} export", // i18n:pending
        tileMeals: { one: "meal to import", other: "meals to import" }, // i18n:pending
        tileKcal: "kcal total", // i18n:pending
        tileSkipped: { one: "row skipped", other: "rows skipped" }, // i18n:pending
        tileBatches: { one: "batch", other: "batches" }, // i18n:pending
        rowsHeading: "Rows", // i18n:pending
        scrollLeft: "Scroll table left", // i18n:pending
        scrollRight: "Scroll table right", // i18n:pending
        previewRegionAria: "Preview of the rows to import", // i18n:pending
        expandAllDays: "Expand all days", // i18n:pending
        collapseAllDays: "Collapse all days", // i18n:pending
        dayRows: { one: "{n} row", other: "{n} rows" }, // i18n:pending
        dayRowsKcal: {
            one: "{n} row · {kcal} kcal",
            other: "{n} rows · {kcal} kcal",
        }, // i18n:pending
        noTimeShort: "no time", // i18n:pending
        lineN: "Line {n}", // i18n:pending
        rowCardAria: "Line {line}, {when}, {meal}, {food}, {kcal}", // i18n:pending
        noMealAria: "no meal", // i18n:pending
        noKcalAria: "no calories", // i18n:pending
        noRowsToImport: "No rows to import with the current mapping.", // i18n:pending
        importOff:
            "Import is off: this host does not let this view write to your log. Ask Claude to import the file instead.", // i18n:pending
        backBusy: "Back is unavailable while batches are being sent.", // i18n:pending
        progressAria: "Import progress, batches", // i18n:pending
        failedRowsAria: "Rows that failed", // i18n:pending
        toldOnly: "The assistant was told only: {summary}", // i18n:pending
        liveStep: "Step {i} of 4, {name}.", // i18n:pending
        liveMapped: "{field}: {column}", // i18n:pending
        liveImporting: {
            one: "Importing. {n} batch.",
            other: "Importing. {n} batches.",
        }, // i18n:pending
        liveDone: {
            one: "Import complete. {n} meal imported.",
            other: "Import complete. {n} meals imported.",
        }, // i18n:pending
        liveNoWrite: "Preflight check failed. Nothing was written.", // i18n:pending
        liveFileError: "Could not use that file.", // i18n:pending
    },
};

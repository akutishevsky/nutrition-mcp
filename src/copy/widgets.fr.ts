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
    digest: {
        loading: "Loading your digest…", // i18n:pending
        eyebrow: "Nutrition digest · {range}", // i18n:pending
        daySoFar: "{date} · so far, {time}", // i18n:pending
        rangeEnds: "{range} · ends yesterday", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein_g: "Protein", // i18n:pending
            carbs_g: "Carbs", // i18n:pending
            fat_g: "Fat", // i18n:pending
            fiber_g: "Fiber", // i18n:pending
            sugar_g: "Sugar", // i18n:pending
            added_sugar_g: "Added sugar", // i18n:pending
            saturated_fat_g: "Saturated fat", // i18n:pending
            trans_fat_g: "Trans fat", // i18n:pending
            sodium_mg: "Sodium", // i18n:pending
            caffeine_mg: "Caffeine", // i18n:pending
            alcohol_g: "Alcohol", // i18n:pending
            water_ml: "Water", // i18n:pending
            weight: "Weight", // i18n:pending
        },
        inline: {
            calories: "calories", // i18n:pending
            protein_g: "protein", // i18n:pending
            carbs_g: "carbs", // i18n:pending
            fat_g: "fat", // i18n:pending
            fiber_g: "fiber", // i18n:pending
            sugar_g: "sugar", // i18n:pending
            added_sugar_g: "added sugar", // i18n:pending
            saturated_fat_g: "saturated fat", // i18n:pending
            trans_fat_g: "trans fat", // i18n:pending
            sodium_mg: "sodium", // i18n:pending
            caffeine_mg: "caffeine", // i18n:pending
            alcohol_g: "alcohol", // i18n:pending
            water_ml: "water", // i18n:pending
            weight: "weight", // i18n:pending
        },
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        drinkLabels: { us: "US drinks", uk: "UK units" }, // i18n:pending
        sep: " · ", // i18n:pending
        verdict: {
            calOverPast: "calories went over", // i18n:pending
            calOverToday: "calories over budget", // i18n:pending
            calOnTrack: "calories on track", // i18n:pending
            calOnTarget: "calories on target", // i18n:pending
            calJustUnder: "calories just under target", // i18n:pending
            calUnder: "calories under target", // i18n:pending
            calMostly: "calories mostly on target", // i18n:pending
            calOverMost: "calories over most days", // i18n:pending
            calUnderMost: "calories under target most days", // i18n:pending
            calSome: "calories on target some days", // i18n:pending
            overPast: "{list} went over", // i18n:pending
            overToday: "{list} over", // i18n:pending
            limitsOver: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            shortPast: "{list} fell short", // i18n:pending
            shortToday: "{list} to go", // i18n:pending
            targetsShortPast: {
                one: "{n} target fell short", // i18n:pending
                other: "{n} targets fell short", // i18n:pending
            },
            targetsShortToday: {
                one: "{n} target to go", // i18n:pending
                other: "{n} targets to go", // i18n:pending
            },
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            rising: "{label} rising", // i18n:pending
            falling: "{label} falling", // i18n:pending
            logged: "logged {n} of {of} days", // i18n:pending
            missTarget: "{label} short most days", // i18n:pending
            missLimit: "{label} often over", // i18n:pending
            noMiss: "no goal missed most days", // i18n:pending
        },
        emptyTitle: {
            today: "Nothing logged today yet", // i18n:pending
            yesterday: "Nothing was logged yesterday", // i18n:pending
            range: "Nothing logged in the last {n} days", // i18n:pending
        },
        emptyText: {
            today: "Meals, water and weigh-ins you log today show up here, with goals and trends.", // i18n:pending
            day: "Meals, water and weigh-ins you log for a day show up here, with goals and trends.", // i18n:pending
            range: "Meals, water and weigh-ins you log over a period show up here, with goals and trends.", // i18n:pending
        },
        intakeDay: "{kcal} kcal · {meals}", // i18n:pending
        intakeRange: "{kcal} kcal a day · logged {n} of {of} days", // i18n:pending
        mealCount: { one: "{n} meal", other: "{n} meals" }, // i18n:pending
        noGoals: "No goals set", // i18n:pending
        score: {
            met: "{n} of {of} goals met", // i18n:pending
            onTrack: "{n} of {of} goals on track", // i18n:pending
            mostly: "{n} of {of} goals mostly met", // i18n:pending
            partial: "{score} · partial logs", // i18n:pending
        },
        sections: {
            calories: "Calories", // i18n:pending
            goals: "Goals at a glance", // i18n:pending
            trends: "Trends", // i18n:pending
            nutrients: "Nutrients", // i18n:pending
            cards: "Water & weight", // i18n:pending
            cardsHidden: "Water and weight", // i18n:pending
            meals: "Meals", // i18n:pending
            highlights: "Highlights", // i18n:pending
            rest: "For the rest of today", // i18n:pending
        },
        meta: {
            final: "final", // i18n:pending
            soFar: "so far", // i18n:pending
            rightNow: "right now", // i18n:pending
            daysMet: "days met / logged", // i18n:pending
            dailyAvg: "Daily average, logged days", // i18n:pending
            dayTotal: "Day total", // i18n:pending
            soFarToday: "So far today", // i18n:pending
            tapMeal: "tap a meal for items", // i18n:pending
            habits: "logging habits", // i18n:pending
            last14: "last 14 days", // i18n:pending
            last14Today: "last 14 days · today so far", // i18n:pending
            fewDays: "few days logged · read loosely", // i18n:pending
            vsPrev: "vs previous {n} days (grey)", // i18n:pending
            waterAvg: "water: daily avg", // i18n:pending
        },
        fold: "Fold {section}", // i18n:pending
        unfold: "Unfold {section}", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        gauge: {
            ofGoal: "of {goal} kcal", // i18n:pending
            kcal: "kcal", // i18n:pending
            aria: "{kcal} of {goal} kcal {when}, {pct}% of goal.", // i18n:pending
            ariaNoGoal: "{kcal} kcal {when}.", // i18n:pending
            onDate: "on {date}", // i18n:pending
            soFarToday: "so far today", // i18n:pending
            ariaMeals: "Meals: {list}", // i18n:pending
            ariaMeal: "{name} {kcal} kcal", // i18n:pending
            segment: "{name}, {kcal} kcal", // i18n:pending
            finished: "You finished {b} your goal", // i18n:pending
            kcalUnder: "{x} kcal under", // i18n:pending
            kcalOver: "{x} kcal over", // i18n:pending
            kcalLeft: "{x} kcal left", // i18n:pending
            todayLine: "{b} · {meals} so far", // i18n:pending
            mealsOnly: "{meals}", // i18n:pending
            hint: "Tap a meal piece for details", // i18n:pending
            popMeta: "{meta} · {pct}% of the day’s goal", // i18n:pending
            popMetaNoGoal: "{meta}", // i18n:pending
            totalOnly: "Logged as a total, no items", // i18n:pending
            closeMeal: "Close meal details", // i18n:pending
        },
        range: {
            avg: "avg", // i18n:pending
            kcalDay: "kcal/day", // i18n:pending
            rightOn: "right on your {goal} kcal goal", // i18n:pending
            overGoal: "{x} kcal over your {goal} kcal goal", // i18n:pending
            underGoal: "{x} kcal under your {goal} kcal goal", // i18n:pending
            footMet: "{met} of {n}", // i18n:pending
            footRest: "logged days on target", // i18n:pending
            footOver: "{n} over", // i18n:pending
            footUnder: "{n} under", // i18n:pending
            legendOn: "on target", // i18n:pending
            legendUnder: "under", // i18n:pending
            legendOver: "over", // i18n:pending
            zone: "Target zone {lo}–{hi} kcal", // i18n:pending
            prev: "Previous {n} days: {avg} kcal/day", // i18n:pending
            barNone: "{date}: nothing logged", // i18n:pending
            barOver: "{date}: {kcal} kcal, over goal", // i18n:pending
            barOn: "{date}: {kcal} kcal, on target", // i18n:pending
            barUnder: "{date}: {kcal} kcal, under target", // i18n:pending
            barPlain: "{date}: {kcal} kcal", // i18n:pending
            popSub: "{kcal} kcal · {meals}", // i18n:pending
            popOver: "{x} over", // i18n:pending
            nothingThisDay: "Nothing logged this day", // i18n:pending
            closeDay: "Close day details", // i18n:pending
        },
        groups: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            short: "Short", // i18n:pending
            togo: "To go", // i18n:pending
            met: "Met", // i18n:pending
            onTrack: "On track", // i18n:pending
            mostlyMet: "Mostly met", // i18n:pending
            mixed: "Mixed", // i18n:pending
            mostlyMissed: "Mostly missed", // i18n:pending
            days: { one: "day", other: "days" }, // i18n:pending
            nrDay: {
                one: "{list} wasn’t recorded — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded — left out of the goals.", // i18n:pending
            },
            nrRange: {
                one: "{list} wasn’t recorded on any day — left out of the goals.", // i18n:pending
                other: "{list} weren’t recorded on any day — left out of the goals.", // i18n:pending
            },
        },
        trends: {
            rising: "↑ rising", // i18n:pending
            falling: "↓ falling", // i18n:pending
            noClear: "→ no clear trend", // i18n:pending
            steady: "→ steady", // i18n:pending
            avg7: "7-day avg {a}, was {b}", // i18n:pending
            todaySoFar: "Today so far {v}", // i18n:pending
            noneToday: "None so far today", // i18n:pending
            nothingToday: "Nothing logged yet today", // i18n:pending
            dayAboutAvg: "Yesterday ≈ avg", // i18n:pending
            dayVsAvg: "Yesterday {pct}% vs avg", // i18n:pending
            noneDay: "None yesterday", // i18n:pending
            notLoggedDay: "Not logged yesterday", // i18n:pending
            perDay: "{d} a day", // i18n:pending
            was: "was {b} a day", // i18n:pending
            wasAvg: "was {b} avg", // i18n:pending
            steadyNote: "Steady: {list}.", // i18n:pending
            alsoNote: "Also moving: {list}.", // i18n:pending
            mixedNote: "Up and down, no clear trend: {list}.", // i18n:pending
            fewNote: "Too few logged days to tell: {list}.", // i18n:pending
            none: "Not enough logged days yet to show trends.", // i18n:pending
            aria: "{label}: {dir}, {l1}, {l2}", // i18n:pending
            dirWord: {
                rising: "rising", // i18n:pending
                falling: "falling", // i18n:pending
                noClear: "no clear trend", // i18n:pending
                steady: "steady", // i18n:pending
            },
        },
        table: {
            noGoal: "no goal", // i18n:pending
            notRecorded: "not recorded", // i18n:pending
            notLogged: "not logged", // i18n:pending
            over: "+{x} over", // i18n:pending
            short: "{x} short", // i18n:pending
            togo: "{x} to go", // i18n:pending
            met: "met", // i18n:pending
            done: "done", // i18n:pending
            none: "none", // i18n:pending
            under: "{x} under", // i18n:pending
            left: "{x} left", // i18n:pending
            onTarget: "on target", // i18n:pending
            nearLimit: "near limit", // i18n:pending
            atLimit: "at limit", // i18n:pending
            target: "/ ≥ {g}", // i18n:pending
            limit: "/ ≤ {g}", // i18n:pending
            noGoalUnit: "{u} · no goal", // i18n:pending
            sparse: "Only {n} of {of} days logged — averages cover logged days only.", // i18n:pending
            partial: "Recorded on fewer days: {list}.", // i18n:pending
            partialItem: "{label} {n} of {of}", // i18n:pending
            ariaTarget: "{label}: {value}, target {goal}, {delta}", // i18n:pending
            ariaLimit: "{label}: {value}, limit {goal}, {delta}", // i18n:pending
            ariaPlain: "{label}: {value}", // i18n:pending
        },
        water: {
            of: "of {goal}", // i18n:pending
            aDay: "a day", // i18n:pending
            metDays: "goal met {n} of {of} days", // i18n:pending
            noneToday: "No water logged yet today", // i18n:pending
            noneDay: "No water logged that day", // i18n:pending
            noneRange: "No water logged in this period", // i18n:pending
            dot: "{date}: {v}", // i18n:pending
        },
        weight: {
            thisMorning: "Weighed in this morning", // i18n:pending
            thatMorning: "Weighed in that day", // i18n:pending
            last: "Last weigh-in {date}", // i18n:pending
            noChange: "no change", // i18n:pending
            vs: "vs {date}", // i18n:pending
            first: "first weigh-in", // i18n:pending
            latest: "Latest · {date}", // i18n:pending
            since: {
                one: "since {date} · {n} weigh‑in", // i18n:pending
                other: "since {date} · {n} weigh‑ins", // i18n:pending
            },
            only1: "only 1 weigh‑in this period", // i18n:pending
            goal: "Goal {v}", // i18n:pending
            noneRecent: "No recent weigh-in · last {v} on {date}", // i18n:pending
            noneYet: "No weigh-ins yet", // i18n:pending
            nonePeriod: "No weigh-in this period · last {v} on {date}", // i18n:pending
        },
        meals: {
            types: {
                breakfast: "Breakfast", // i18n:pending
                lunch: "Lunch", // i18n:pending
                dinner: "Dinner", // i18n:pending
                snack: "Snack", // i18n:pending
                drink: "Drink", // i18n:pending
            },
            macro: "{x} {label}", // i18n:pending
            totalOnly: "total only", // i18n:pending
            daysLogged: "Days logged", // i18n:pending
            mealsADay: "Meals a day", // i18n:pending
            ofDays: "{n} of {of}", // i18n:pending
            typical: "Typical times", // i18n:pending
            typicalItem: "{type} {time}", // i18n:pending
            topFoods: "Top foods by calories", // i18n:pending
            times: "×{n}", // i18n:pending
            best: "Best day", // i18n:pending
            tough: "Toughest day", // i18n:pending
            goalsMet: "{n} of {of} goals met", // i18n:pending
            whyOver: "{list} over", // i18n:pending
            whyLimits: { one: "{n} limit over", other: "{n} limits over" }, // i18n:pending
            whyShort: "{list} short", // i18n:pending
            whyAll: "every recorded goal met", // i18n:pending
        },
        highlights: {
            count: { one: "{n} highlight", other: "{n} highlights" }, // i18n:pending
            sugarA: "Biggest sugar source: ", // i18n:pending
            sugarAToday: "Biggest sugar source so far: ", // i18n:pending
            times: " (×{n})", // i18n:pending
            sugarDay: " — {g}, {pct}% of the day’s sugar.", // i18n:pending
            sugarToday: " — {g}, {pct}% of today’s sugar.", // i18n:pending
            sugarRange: " — {g}, {pct}% of the period’s sugar.", // i18n:pending
            streakA: "Calories in the target zone ", // i18n:pending
            streakB: { one: "{n} day in a row", other: "{n} days in a row" }, // i18n:pending
            streakToday: " up to yesterday.", // i18n:pending
            streakPast: " — the current streak.", // i18n:pending
            gapsA: "Gaps in the log: ", // i18n:pending
            gapsB: {
                one: "{n} day with nothing logged", // i18n:pending
                other: "{n} days with nothing logged", // i18n:pending
            },
            gapsC: " — averages cover logged days only.", // i18n:pending
            overRange: {
                one: "{label} went over on {n} day", // i18n:pending
                other: "{label} went over on {n} days", // i18n:pending
            },
            overToday: "{label} is over so far", // i18n:pending
            overPast: "{label} went over", // i18n:pending
            overEach: " — largest source: {name}, {x} each time (×{n}).", // i18n:pending
            overOnce: " — largest source: {name}, {x}.", // i18n:pending
            shortRange: {
                one: "{label} fell short on {n} day", // i18n:pending
                other: "{label} fell short on {n} days", // i18n:pending
            },
            shortToday: "{label} is still short", // i18n:pending
            shortPast: "{label} fell short", // i18n:pending
            shortFood: " — {name}, logged before, has {x} for {kcal} kcal.", // i18n:pending
            allMetA: "Nothing missed: ", // i18n:pending
            allMetRange: "every goal mostly met", // i18n:pending
            allMetPast: "every goal met", // i18n:pending
            allMetToday: "every goal on track", // i18n:pending
            allMetC: ".", // i18n:pending
        },
        rest: {
            kcalLeft: "Calories left", // i18n:pending
            kcalOver: "Calories over", // i18n:pending
            water: "Water still to drink", // i18n:pending
            togo: "{label} still to go", // i18n:pending
            foodLabel: "Logged before:", // i18n:pending
            food: "{name} — {x} {label}, {kcal} kcal.", // i18n:pending
            summary: {
                one: "{n} amount left", // i18n:pending
                other: "{n} amounts left", // i18n:pending
            },
            reached: "every target reached so far", // i18n:pending
        },
        facts: {
            water: "Water {v}", // i18n:pending
            waterOf: "Water {v} of {goal}", // i18n:pending
            waterDay: "Water {v} a day", // i18n:pending
            weight: "{v}", // i18n:pending
            weightChg: "{v} ({chg})", // i18n:pending
            trend: "{label} {dir}", // i18n:pending
            biggest: "Biggest meal: {name}", // i18n:pending
        },
        summaries: {
            over: "{n} over", // i18n:pending
            near: "{n} near limit", // i18n:pending
            short: "{n} short", // i18n:pending
            togo: "{n} to go", // i18n:pending
            met: "{n} met", // i18n:pending
            onTrack: "{n} on track", // i18n:pending
            mostlyMet: "{n} mostly met", // i18n:pending
            mixed: "{n} mixed", // i18n:pending
            mostlyMissed: "{n} mostly missed", // i18n:pending
            noGoals: "no goals recorded", // i18n:pending
            rising: "{n} rising", // i18n:pending
            falling: "{n} falling", // i18n:pending
            steady: "{n} steady", // i18n:pending
            notEnough: "not enough data", // i18n:pending
            metrics: { one: "{n} metric", other: "{n} metrics" }, // i18n:pending
            water: "Water {v}", // i18n:pending
            noWater: "no water", // i18n:pending
            weight: "Weight {v}", // i18n:pending
            noWeigh: "no weigh-in", // i18n:pending
            daysLogged: "{n} of {of} days logged", // i18n:pending
            mealSpan: "{meals} · {from}–{to}", // i18n:pending
        },
    },
};

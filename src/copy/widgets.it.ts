import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_IT: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorie",
            protein_g: "Proteine",
            carbs_g: "Carboidrati",
            fat_g: "Grassi",
            sugar_g: "Zuccheri",
            added_sugar_g: "Zuccheri aggiunti",
            saturated_fat_g: "Grassi saturi",
            trans_fat_g: "Grassi trans",
            alcohol_g: "Alcol",
            caffeine_mg: "Caffeina",
            sodium_mg: "Sodio",
            fiber_g: "Fibre",
            water_ml: "Acqua",
        },
        noGoalSet: "nessun obiettivo",
        atLimit: "al limite",
        floorUnder: "rimanenti",
        ceilingUnder: "sotto",
        over: "in eccesso",
        limitPrefix: "limite",
        ofPrefix: "su",
        drinkLabels: { us: "drink USA", uk: "unità UK" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nessun dato",
        notRecorded: "non registrato",
        caloriesToday: "Calorie di oggi",
        caloriesOn: "Calorie · {date}",
        tapHint: "Tocca un valore per vedere da quali pasti proviene",
        showMealsContributed: "Mostra i pasti che hanno contribuito.",
        byMealTitle: "{label} per pasto",
        closeBreakdown: "Chiudi il dettaglio",
        noMealsContributed: "Nessun pasto registrato apporta {label}.",
        untitledMeal: "Pasto senza nome",
        moreMeals: {
            one: "+ {n} pasto più piccolo",
            other: "+ {n} pasti più piccoli",
        },
        moreMealsAtLeast: {
            one: "+ almeno {n} pasto più piccolo",
            other: "+ almeno {n} pasti più piccoli",
        },
        moreMealsMaybe: "+ forse altri pasti più piccoli",
        ingredientCount: {
            one: "{n} ingrediente",
            other: "{n} ingredienti",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "tuo",
        sourceEst: "stim.",
        sourceMixed: "misto",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "codice a barre",
        sourceDataType: "tipo di dato",
        sourceAria: "Fonte: {source}",
        sourceDetailsAria: "Mostra dettagli della fonte",
    },
    bridge: {
        settingsFooter:
            "Puoi attivare o disattivare questi widget quando vuoi: basta chiedere di cambiare le impostazioni.",
        connectFailed: "Questo pannello non è riuscito a collegarsi all'app.",
    },
    nutritionSummary: {
        title: "Riepilogo nutrizionale",
        loading: "Caricamento del riepilogo nutrizionale…",
        empty: "Niente pasti né acqua registrati in questo periodo.",
        caloriesPerDay: "Calorie / giorno",
        daysLogged: {
            one: "{n} giorno registrato",
            other: "{n} giorni registrati",
        },
        daysOfLogged: "{logged} giorni registrati su {span}",
        periodToday: "Today", // i18n:pending
        periodPastDay: "Past day", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        ofGoal: "of {goal} kcal", // i18n:pending
        avgOfGoal: "avg/day of {goal} kcal", // i18n:pending
        left: "{amount} left", // i18n:pending
        over: "{amount} over", // i18n:pending
        toGo: "{amount} to go", // i18n:pending
        above: "{amount} above", // i18n:pending
        onTarget: "on target", // i18n:pending
        goalMet: "goal met", // i18n:pending
        noLimit: "no limit", // i18n:pending
        none: "none", // i18n:pending
        notRecorded: "Not recorded", // i18n:pending
        leftToday: "{amount} left today", // i18n:pending
        overToday: "{amount} over today", // i18n:pending
        leftThatDay: "{amount} left that day", // i18n:pending
        overThatDay: "{amount} over that day", // i18n:pending
        underGoal: "{amount} under goal", // i18n:pending
        overGoal: "{amount} over goal", // i18n:pending
        peak: "peak {amount}", // i18n:pending
        mealsCount: {
            one: "{n} meal", // i18n:pending
            other: "{n} meals", // i18n:pending
        },
        emptyToday: "No meals logged today yet", // i18n:pending
        emptyThatDay: "No meals logged that day", // i18n:pending
        emptyRange: "No meals logged in this range", // i18n:pending
        statEatenSoFar: "Eaten so far", // i18n:pending
        statEaten: "Eaten", // i18n:pending
        statRemaining: "Remaining", // i18n:pending
        statOverGoal: "Over goal", // i18n:pending
        statMeals: "Meals", // i18n:pending
        statLogged: "logged", // i18n:pending
        statAvgDay: "Avg / day", // i18n:pending
        statPeakDay: "Peak day", // i18n:pending
        statLoggedDays: "Logged", // i18n:pending
        statOfDays: "of {n} days", // i18n:pending
        gaugeAriaToday:
            "{eaten} of {goal} kcal today, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaThatDay:
            "{eaten} of {goal} kcal that day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaRange:
            "Average {eaten} of {goal} kcal a day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaNoGoal: "{eaten} kcal.", // i18n:pending
        gaugeAriaMeals: "Meals: {list}.", // i18n:pending
        caloriesByDay: "Calories by day", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        items: {
            one: "{n} item", // i18n:pending
            other: "{n} items", // i18n:pending
        },
        totalOnlyShort: "total only", // i18n:pending
        totalOnly: "Logged as a total, without ingredients.", // i18n:pending
        goalLine: "goal", // i18n:pending
        byDay: "By day", // i18n:pending
        byDayPartial: "By day · recorded on {rec} of {logged} logged days", // i18n:pending
        byMealCount: {
            one: "By meal · {n} meal", // i18n:pending
            other: "By meal · {n} meals", // i18n:pending
        },
        notRecordedCount: {
            one: "{n} not recorded", // i18n:pending
            other: "{n} not recorded", // i18n:pending
        },
        notRecordedToday: "{label} wasn't recorded for today's meals.", // i18n:pending
        notRecordedThatDay: "{label} wasn't recorded for that day's meals.", // i18n:pending
        notRecordedRange: "{label} wasn't recorded on any day in this range.", // i18n:pending
        waterToday:
            "Water is logged on its own, not with meals: {amount} today.", // i18n:pending
        waterThatDay:
            "Water is logged on its own, not with meals: {amount} that day.", // i18n:pending
        waterRange: "Water is logged on its own, not with meals.", // i18n:pending
        noneInToday: "{label}: none in today's meals.", // i18n:pending
        noneInThatDay: "{label}: none in that day's meals.", // i18n:pending
        noneInRange: "{label}: none in the listed meals.", // i18n:pending
        topMeals: "Top meals", // i18n:pending
        dailyAverages: {
            one: "Daily averages · {n} logged day", // i18n:pending
            other: "Daily averages · {n} logged days", // i18n:pending
        },
        selected: "Selected {tip}", // i18n:pending
        months: [
            "gen",
            "feb",
            "mar",
            "apr",
            "mag",
            "giu",
            "lug",
            "ago",
            "set",
            "ott",
            "nov",
            "dic",
        ],
    },
    goalProgress: {
        loading: "Caricamento dei progressi…",
        title: "Progressi verso gli obiettivi",
        empty: "Nessun progresso da mostrare.",
        nothingLoggedFor: "Ancora nulla registrato per {date}.",
        thisDay: "questo giorno",
        mealsCount: { one: "{n} pasto", other: "{n} pasti" },
        waterCount: { one: "{n} voce d'acqua", other: "{n} voci d'acqua" },
        weightLabel: "Peso",
        weightNoneNoTarget:
            "Ancora nessuna pesata registrata. Registrane una con log_weight per seguire i progressi.",
        weightNoneWithTarget:
            "Ancora nessuna pesata registrata. Registrane una con log_weight per seguire i progressi verso il tuo obiettivo di {target}.",
        weightNoGoal:
            "Peso {reading}: nessun obiettivo impostato. Impostane uno con set_nutrition_goals per vedere qui i progressi.",
        atTarget: "obiettivo raggiunto",
        toLose: "{amount} da perdere",
        toGain: "{amount} da prendere",
        lastLogged: "ultima pesata {date}",
        weightAria: "Peso {current}, obiettivo {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        logged: "logged", // i18n:pending
        edited: "edited", // i18n:pending
        thisMeal: "{amount} this meal", // i18n:pending
        statThisMeal: "This meal", // i18n:pending
        statToday: "Today", // i18n:pending
        statLeftToday: "Left today", // i18n:pending
        statLeftThatDay: "Left that day", // i18n:pending
    },
    trends: {
        loading: "Caricamento dell'andamento…",
        title: "Andamento",
        empty: "Ancora niente pasti né acqua registrati in questo periodo.",
        avgUnder: "sotto",
        loggedOfTotal: "{logged}/{total} giorni registrati",
        caloriesOverRange: "Calorie al giorno negli ultimi {range} giorni",
        windowAriaLabel: "Periodo",
        rangeDaysAriaLabel: "{n} giorni",
        avgAllDays: "media su {range} giorni · tutti i giorni",
        segWeek: "Sett.",
        segMonth: "Mese",
        segQuarter: "Trim.",
        segYear: "Anno",
        segDays: "Giorni",
        segWeekAria: "Mostra medie settimanali",
        segMonthAria: "Mostra medie mensili",
        segQuarterAria: "Mostra medie trimestrali",
        segYearAria: "Mostra medie annuali",
        segDaysAria: "Mostra andamento giornaliero",
        periodTitleWeek: "Medie settimanali",
        periodTitleMonth: "Medie mensili",
        periodTitleQuarter: "Medie trimestrali",
        periodTitleYear: "Medie annuali",
        perLoggedDay: "per giorno registrato",
        daysLogged: "{logged}/{total} giorni",
        onTarget: "nell'obiettivo {k}/{n}",
        possiblyIncomplete: {
            one: "{n} forse incompleto",
            other: "{n} forse incompleti",
        },
        partial: "in corso",
        nothingLogged: "niente registrato",
        targetsChanged: "obiettivi cambiati nel periodo",
        targetsAssumed: "obiettivi prima del {date} non registrati",
        noTargets: "Nessun obiettivo impostato: solo medie.",
        quarter: "T{q} {year}",
    },
    weightTrends: {
        loading: "Caricamento dell'andamento del peso…",
        title: "Peso",
        empty: "Ancora nessuna pesata in questo periodo.",
        rangeEmpty:
            "Nessuna pesata negli ultimi {range} giorni. Prova un periodo più ampio.",
        windowAriaLabel: "Periodo",
        rangeAriaLabel: "Ultimi {n} giorni",
        chartAriaLabel: "Peso da {from} a {to}, ultimo {latest}",
        trendChartAriaLabel:
            "Peso da {from} a {to} con linea di tendenza smussata, ultimo {latest}",
        latest: "Ultimo",
        needTwo: "servono almeno 2 pesate",
        sinceDate: "{change} da {date}",
        weighIns: { one: "{n} pesata", other: "{n} pesate" },
        atTarget: "obiettivo raggiunto",
        toLose: "{amount} da perdere",
        toGain: "{amount} da prendere",
        target: "Obiettivo {value}",
        noTarget: "Nessun obiettivo impostato",
        trend: "Tendenza",
        scaleToday: "Bilancia oggi {value}",
        perWeek: "{amount}/sett.",
        rateAriaLabel:
            "La tendenza cambia di {amount} a settimana nelle ultime 2 settimane",
        rateTwoWeeks: "ritmo 2 sett.",
        range1y: "1 anno",
        rangeAll: "Tutto",
        range1yAriaLabel: "Ultimo anno",
        rangeAllAriaLabel: "Tutta la cronologia",
        sinceMonth: "{change} da {date}",
    },
    importMeals: {
        loading: "Preparazione dell'importazione…",
        stepFile: "File",
        stepMap: "Abbina colonne",
        stepPreview: "Anteprima",
        stepImport: "Importa",
        fieldLabels: {
            logged_at: "Data / ora",
            description: "Nome alimento",
            meal_type: "Pasto",
            calories: "Calorie",
            protein_g: "Proteine (g)",
            carbs_g: "Carboidrati (g)",
            fat_g: "Grassi (g)",
            fiber_g: "Fibre (g)",
            sugar_g: "Zuccheri, totali (g)",
            added_sugar_g: "Zuccheri aggiunti (g)",
            saturated_fat_g: "Grassi saturi (g)",
            trans_fat_g: "Grassi trans (g)",
            alcohol_g: "Alcol (g)",
            caffeine_mg: "Caffeina (mg)",
            sodium_mg: "Sodio (mg)",
            notes: "Note",
            time: "Ora (colonna separata)",
            deleted: "Indicatore di eliminazione",
            source_id: "ID pasto (dalla nostra esportazione)",
            timezone: "Fuso orario (dalla nostra esportazione)",
        },
        chooseExportHeading: "Scegli il file esportato",
        noToolsWarning:
            "Questa app non consente al pannello di scrivere nel tuo diario. Chiedi a Claude di importare il file al posto tuo: può farlo direttamente.",
        emailFallback:
            "Se neanche chiedere a Claude funziona, scrivi a {email}.",
        tzWarning:
            "Il tuo fuso orario non è impostato, quindi gli orari saranno letti come UTC e potrebbero finire nel giorno sbagliato. Chiedi prima a Claude di impostare il tuo fuso orario.",
        dropChoose: "Scegli un file CSV",
        dropOr: "oppure trascinalo qui",
        recognizedHint:
            "Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute in automatico. Non viene salvato nulla finché non confermi.",
        dateMapHint:
            "Abbina una colonna della data qui sopra per vedere come viene convertito un valore del tuo file.",
        dateNoneHint: "Quella colonna non contiene date.",
        dateUnreadable:
            "{raw} → non leggibile come {format}, quindi le righe come questa verranno saltate",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Abbina una colonna delle calorie qui sopra per vedere come viene convertito un valore del tuo file.",
        energyNoneHint: "Quella colonna non contiene numeri.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (nessuna conversione)",
        dateAmbiguousWarning:
            "Da questo file non è possibile capire il formato della data: le date si leggono allo stesso modo con il giorno o con il mese al primo posto. Conferma quale formato esporta la tua app. Con quello sbagliato, i pasti finiscono nel giorno sbagliato senza alcun messaggio di errore.",
        dateFormatLabel: "Formato data in questo file",
        dateFormatYmd: "Anno-Mese-Giorno",
        dateFormatDmy: "Giorno/Mese/Anno",
        dateFormatMdy: "Mese/Giorno/Anno",
        energyUnitLabel: "Unità di energia della colonna delle calorie",
        energyUnitKcal: "Calorie",
        energyUnitKj: "Chilojoule",
        mapColumnsHeading: "Abbina colonne",
        rowsCount: { one: "{n} riga", other: "{n} righe" },
        columnsCount: { one: "{n} colonna", other: "{n} colonne" },
        delimiterLabel: "separatore",
        tabLabel: "tabulazione",
        notInFile: "(non presente in questo file)",
        columnFallback: "colonna {n}",
        caffeineGramsNotice:
            "La colonna della caffeina di questo file ({column}) è in grammi, ma la caffeina viene salvata in milligrammi, quindi Caffeina non è stata abbinata. Abbinarla registrerebbe 0,18 dove l'etichetta indica 180 mg. Reimportare lo stesso file in seguito non recupererà questi valori: quelle righe risulteranno già registrate e verranno saltate come duplicati. Se l'intestazione è sbagliata e i valori sono davvero in milligrammi, selezionala qui sopra; se sono davvero grammi, moltiplicali per 1000 nel file prima di importarlo, non dopo.",
        alcoholNotice:
            "Questo file ha una colonna dell'alcol ({column}), ma il monitoraggio dell'alcol è disattivato per questo account, quindi non verrà importata. Reimportare lo stesso file in seguito non recupererà questi valori: quelle righe risulteranno già registrate e verranno saltate come duplicati. Per conservare questi dati, chiedi a Claude di attivare il monitoraggio dell'alcol (set_alcohol_tracking) prima di importare.",
        sampleValue: "es. {sample}",
        sourceAppLabel: "App di origine (facoltativa)",
        sourceAppHint:
            "Serve a etichettare le righe che non hanno il nome dell'alimento.",
        previewButton: "Mostra anteprima",
        chooseAnotherButton: "Scegli un altro file",
        previewHeading: "Anteprima",
        mealsToImport: {
            one: "{n} pasto da importare",
            other: "{n} pasti da importare",
        },
        kcalTotal: "{kcal} kcal in totale",
        rowsSkipped: {
            one: "{n} riga saltata",
            other: "{n} righe saltate",
        },
        batchCount: { one: "{n} lotto", other: "{n} lotti" },
        datesReadAs: "Date lette come {format}; energia {conversion}.",
        energyConvertedNote: "convertita da kJ a kcal",
        energyReadAsKcal: "letta come kcal",
        badDatesWarning: {
            one: "{n} riga è stata saltata perché non è stato possibile leggerne la data come {format}{sample}. Torna indietro e imposta il formato data che corrisponde al tuo file.",
            other: "{n} righe sono state saltate perché non è stato possibile leggerne la data come {format}{sample}. Torna indietro e imposta il formato data che corrisponde al tuo file.",
        },
        badDateSample: " (es. riga {line}: {value})",
        noTimeWarning: {
            one: "{n} riga ha la data ma non l'orario: verrà registrata a mezzogiorno.",
            other: "{n} righe hanno la data ma non l'orario: verranno registrate a mezzogiorno.",
        },
        splitDatesCount: {
            one: "{n} data ha",
            other: "{n} date hanno",
        },
        splitDatesWarning:
            " più di {max} pasti (es. {date}), quindi l'importazione è stata divisa in più lotti. Se quella data contiene due voci con lo stesso identico alimento, tipo di pasto e macro, una delle due potrebbe essere saltata come duplicato invece di essere importata.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "C",
            fat_g: "G",
            fiber_g: "Fib",
            sugar_g: "Zucc",
            added_sugar_g: "Agg",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caff",
            sodium_mg: "Na",
        },
        tableLine: "Riga",
        tableWhen: "Quando",
        tableMeal: "Pasto",
        tableFood: "Alimento",
        tableProblem: "Problema",
        noNameFallback: "(senza nome: verrà usato il tipo di pasto)",
        showingRows: "Righe mostrate: {shown} su {total}",
        checkingRows: {
            one: "Controllo di {n} riga…",
            other: "Controllo di {n} righe…",
        },
        importingRows: {
            one: "Importazione di {n} riga…",
            other: "Importazione di {n} righe…",
        },
        batchProgress: "{label} (lotto {done} su {total})",
        rowsRange: "Righe {a}–{b}: {msg}",
        preflightFailed: "Il controllo preliminare non è riuscito.",
        rowsWouldFail: {
            one: "{n} riga darebbe errore, es. riga {line}: {message}",
            other: "{n} righe darebbero errore, es. riga {line}: {message}",
        },
        importingEllipsis: "Importazione in corso…",
        importButton: {
            one: "Importa {n} pasto",
            other: "Importa {n} pasti",
        },
        backToMapping: "Torna alla mappatura",
        importCompleteHeading: "Importazione completata",
        resultMealsImported: {
            one: "{n} pasto importato",
            other: "{n} pasti importati",
        },
        resultAlreadyLogged: {
            one: ", {n} già registrato",
            other: ", {n} già registrati",
        },
        resultFailed: {
            one: ", {n} non riuscito",
            other: ", {n} non riusciti",
        },
        resultSkipped: {
            one: ", {n} saltato",
            other: ", {n} saltati",
        },
        restartButton: "Importa un altro file",
        couldNotReadFile: "Impossibile leggere il file: {msg}",
        noDataRows: "Nessuna riga di dati trovata in quel file.",
        emailNotice:
            "Qualcosa non funziona? Scrivi a {email} e includi le righe qui sotto: contengono tutto ciò che serve per capire il problema.",
    },
};

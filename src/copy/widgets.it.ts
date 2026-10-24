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
        chartAriaLabel: "Calorie al giorno nel periodo selezionato",
        avg: "media",
        goal: "obiettivo",
        dailyAvgLoggedDays: "Media giornaliera · giorni registrati",
        total: "Totale",
        daysLogged: {
            one: "{n} giorno registrato",
            other: "{n} giorni registrati",
        },
        daysOfLogged: "{logged} giorni registrati su {span}",
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
        titleLogged: "Pasto registrato",
        titleUpdated: "Pasto aggiornato",
        addedKcal: "+{kcal} kcal",
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
        empty: "Ancora nessuna pesata in questo periodo.",
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

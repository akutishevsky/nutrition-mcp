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
        eyebrow: "Goal progress · {when}", // i18n:pending
        today: "Today", // i18n:pending
        todayAt: "Today, {time}", // i18n:pending
        labels: {
            calories: "Calories", // i18n:pending
            protein: "Protein", // i18n:pending
            carbs: "Carbs", // i18n:pending
            fat: "Fat", // i18n:pending
            fiber: "Fiber", // i18n:pending
            sugar: "Sugar", // i18n:pending
            added_sugar: "Added sugar", // i18n:pending
            saturated: "Saturated fat", // i18n:pending
            trans: "Trans fat", // i18n:pending
            sodium: "Sodium", // i18n:pending
            caffeine: "Caffeine", // i18n:pending
            alcohol: "Alcohol", // i18n:pending
            water: "Water", // i18n:pending
        },
        names: {
            calories: "calories", // i18n:pending
            protein: "protein", // i18n:pending
            carbs: "carbs", // i18n:pending
            fat: "fat", // i18n:pending
            fiber: "fiber", // i18n:pending
            sugar: "sugar", // i18n:pending
            added_sugar: "added sugar", // i18n:pending
            saturated: "saturated fat", // i18n:pending
            trans: "trans fat", // i18n:pending
            sodium: "sodium", // i18n:pending
            caffeine: "caffeine", // i18n:pending
            alcohol: "alcohol", // i18n:pending
            water: "water", // i18n:pending
        },
        satFatShort: "Sat. fat", // i18n:pending
        kinds: { budget: "budget", target: "target", limit: "limit" }, // i18n:pending
        units: {
            kcal: "kcal", // i18n:pending
            g: "g", // i18n:pending
            mg: "mg", // i18n:pending
            L: "L", // i18n:pending
            ml: "ml", // i18n:pending
            kg: "kg", // i18n:pending
            lb: "lb", // i18n:pending
        },
        listPair: "{a} and {b}", // i18n:pending
        listMore: "{rest} and {last}", // i18n:pending
        listSep: ", ", // i18n:pending
        titleSep: " · ", // i18n:pending
        titleSepPast: ", ", // i18n:pending
        nothingToday: "Nothing logged today yet", // i18n:pending
        nothingPast: "Nothing was logged that day", // i18n:pending
        allOnTrack: {
            one: "Your {n} goal is on track", // i18n:pending
            other: "All {n} goals on track", // i18n:pending
        },
        allMet: { one: "Your {n} goal was met", other: "All {n} goals met" }, // i18n:pending
        overOne: "{a} is over", // i18n:pending
        overNamed: "{list} are over", // i18n:pending
        overMany: { one: "{n} limit is over", other: "{n} limits are over" }, // i18n:pending
        nearNamed: "{list} near the limit", // i18n:pending
        nearMany: {
            one: "{n} goal near the limit", // i18n:pending
            other: "{n} goals near the limit", // i18n:pending
        },
        toGoNamed: "{list} still to go", // i18n:pending
        toGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        briefOverOne: "{a} over", // i18n:pending
        briefOverMany: { one: "{n} over", other: "{n} over" }, // i18n:pending
        briefNear: { one: "{n} near the limit", other: "{n} near the limit" }, // i18n:pending
        briefToGoOne: "{a} to go", // i18n:pending
        briefToGoMany: { one: "{n} target to go", other: "{n} targets to go" }, // i18n:pending
        pastOverNamed: "{list} went over", // i18n:pending
        pastOverMany: {
            one: "{n} limit went over", // i18n:pending
            other: "{n} limits went over", // i18n:pending
        },
        pastShortNamed: "{list} fell short", // i18n:pending
        pastShortMany: {
            one: "{n} target fell short", // i18n:pending
            other: "{n} targets fell short", // i18n:pending
        },
        pastCloseNamed: "{list} came close", // i18n:pending
        pastBriefOver: { one: "{n} over", other: "{n} over" }, // i18n:pending
        pastBriefShort: { one: "{n} short", other: "{n} short" }, // i18n:pending
        pastBriefMet: { one: "{n} met", other: "{n} met" }, // i18n:pending
        noGoalsTitle: "No daily goals set", // i18n:pending
        countersAria: "Goals by status", // i18n:pending
        counters: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "To go", // i18n:pending
            ok: "On track", // i18n:pending
        },
        countersPast: {
            over: "Over", // i18n:pending
            near: "Near limit", // i18n:pending
            togo: "Short", // i18n:pending
            ok: "Met", // i18n:pending
        },
        counterAria: "{label}: {n}. Show them", // i18n:pending
        counterAriaZero: "{label}: {n}", // i18n:pending
        nrNoteToday: "Not recorded today, so not counted: {list}", // i18n:pending
        nrNotePast: "Not recorded that day, so not counted: {list}", // i18n:pending
        emptyToday:
            "Nothing logged today yet. Once a meal or water is logged, this shows what is over, what is close and what is still to go.", // i18n:pending
        emptyPast: "Nothing was logged that day.", // i18n:pending
        dailyGoals: "Daily goals: {list}.", // i18n:pending
        goalItem: "{value} {name}", // i18n:pending
        goalLimitItem: "{value} {name} limit", // i18n:pending
        noGoalsToday:
            "No daily goals are set, so there is nothing to compare with. Logged today: {list}.", // i18n:pending
        noGoalsPast:
            "No daily goals are set, so there is nothing to compare with. Logged that day: {list}.", // i18n:pending
        sections: {
            over: "Over the limit", // i18n:pending
            near: "Near the limit", // i18n:pending
            togo: "Still to go", // i18n:pending
            ok: "On track", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        sectionsPast: {
            over: "Went over", // i18n:pending
            near: "Close to the limit", // i18n:pending
            togo: "Fell short", // i18n:pending
            ok: "Met", // i18n:pending
            nr: "Not recorded", // i18n:pending
        },
        showAll: "Show all goals", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        done: "Done", // i18n:pending
        met: "Met", // i18n:pending
        toGo: "to go", // i18n:pending
        short: "short", // i18n:pending
        over: "over", // i18n:pending
        left: "left", // i18n:pending
        under: "under", // i18n:pending
        ofLimit: "of limit", // i18n:pending
        notRecorded: "not recorded", // i18n:pending
        noDayTotal: "no day total", // i18n:pending
        ofGoal: "{value} of {goal}", // i18n:pending
        rowAria: "{label} {kind}: {status}, {detail}", // i18n:pending
        restTitle: "For the rest of today", // i18n:pending
        cellCaloriesLeft: "Calories left", // i18n:pending
        cellCalories: "Calories", // i18n:pending
        cellToGo: "{label} to go", // i18n:pending
        cellOver: "+{value} over", // i18n:pending
        cellPct: "{pct}% of limit", // i18n:pending
        cellAria: "{key}: {value}", // i18n:pending
        hintOverK: "Over budget:", // i18n:pending
        hintOver: "{over} above the {goal} budget.", // i18n:pending
        hintOverWater: "{over} above the {goal} budget; water {left} to go.", // i18n:pending
        hintFoodK: "Logged before:", // i18n:pending
        hintFood: "{food} — {facts}.", // i18n:pending
        hintToGoK: "Still to go:", // i18n:pending
        hintWaterK: "Water:", // i18n:pending
        hintOverLimitK: "Over the limit:", // i18n:pending
        hintNearK: "Close to the limit:", // i18n:pending
        hintList: "{list}.", // i18n:pending
        waterLeft: {
            one: "{left} to go, about {n} glass of 250 ml.", // i18n:pending
            other: "{left} to go, about {n} glasses of 250 ml.", // i18n:pending
        },
        hintAllK: "All set:", // i18n:pending
        hintAll: "every goal is on track.", // i18n:pending
        leadK: "Largest source:", // i18n:pending
        leadV: "{name}, {value}", // i18n:pending
        gapTitle: "Foods you’ve logged before", // i18n:pending
        mealsTitle: "Where it came from", // i18n:pending
        waterToday: "Logged today", // i18n:pending
        waterPast: "Logged that day", // i18n:pending
        totalOnly: "total only", // i18n:pending
        mealFallback: "Meal", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        noMealsToday: "No meals logged today.", // i18n:pending
        noMealsPast: "No meals logged that day.", // i18n:pending
        noWaterToday: "No water logged today.", // i18n:pending
        noWaterPast: "No water logged that day.", // i18n:pending
        otherMealsNone: {
            one: "{n} other meal had none.", // i18n:pending
            other: "{n} other meals had none.", // i18n:pending
        },
        missingNote: {
            one: "Not recorded for {n} meal; the total counts only the meals that had it.", // i18n:pending
            other: "Not recorded for {n} meals; the total counts only the meals that had it.", // i18n:pending
        },
        nrOne: "{label} wasn’t recorded for “{meal}”, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        nrMany: {
            one: "{label} wasn’t recorded for {n} meal, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
            other: "{label} wasn’t recorded for {n} meals, so there is no day total to compare with the {goal} {kind}.", // i18n:pending
        },
        sources: {
            usda: "USDA", // i18n:pending
            openfoodfacts: "Open Food Facts", // i18n:pending
            user: "your figure", // i18n:pending
            estimate: "estimate", // i18n:pending
            mixed: "mixed sources", // i18n:pending
        },
        weight: "Weight", // i18n:pending
        weightAbove: "{delta} above your {target} goal", // i18n:pending
        weightBelow: "{delta} below your {target} goal", // i18n:pending
        weightAt: "at your {target} goal", // i18n:pending
        weightNoGoal: "no goal set", // i18n:pending
        weightLatest: "latest reading, {date}", // i18n:pending
        weightNone: "no reading yet", // i18n:pending
        weightNoneGoal: "no reading yet · goal {target}", // i18n:pending
        transNote: "no limit set, shown for reference", // i18n:pending
        drinks: {
            us: { one: "{n} US drink", other: "{n} US drinks" }, // i18n:pending
            uk: { one: "{n} UK unit", other: "{n} UK units" }, // i18n:pending
        },
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

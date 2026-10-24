import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_NL: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorieën",
            protein_g: "Eiwitten",
            carbs_g: "Koolhydraten",
            fat_g: "Vet",
            sugar_g: "Suiker",
            added_sugar_g: "Toegevoegde suiker",
            saturated_fat_g: "Verzadigd vet",
            trans_fat_g: "Transvet",
            alcohol_g: "Alcohol",
            caffeine_mg: "Cafeïne",
            sodium_mg: "Natrium",
            fiber_g: "Vezels",
            water_ml: "Water",
        },
        noGoalSet: "geen doel ingesteld",
        atLimit: "op de limiet",
        floorUnder: "te gaan",
        ceilingUnder: "eronder",
        over: "erboven",
        limitPrefix: "limiet",
        ofPrefix: "van",
        drinkLabels: { us: "VS-standaardglazen", uk: "Britse eenheden" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "niets gelogd",
        notRecorded: "niet vastgelegd",
        caloriesToday: "Calorieën vandaag",
        caloriesOn: "Calorieën · {date}",
        tapHint: "Tik op een waarde voor de bijbehorende maaltijden",
        showMealsContributed: "Toon de maaltijden die hieraan bijdroegen.",
        byMealTitle: "{label} per maaltijd",
        closeBreakdown: "Overzicht sluiten",
        noMealsContributed: "Geen gelogde maaltijd bevat {label}.",
        untitledMeal: "Naamloze maaltijd",
        moreMeals: {
            one: "+ {n} kleinere maaltijd",
            other: "+ {n} kleinere maaltijden",
        },
        moreMealsAtLeast: {
            one: "+ {n} of meer kleinere maaltijden",
            other: "+ {n} of meer kleinere maaltijden",
        },
        moreMealsMaybe: "+ mogelijk meer kleinere maaltijden",
        ingredientCount: {
            one: "{n} ingrediënt",
            other: "{n} ingrediënten",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "eigen",
        sourceEst: "sch.",
        sourceMixed: "gemengd",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "barcode",
        sourceDataType: "gegevenstype",
        sourceAria: "Bron: {source}",
        sourceDetailsAria: "Bronnen tonen",
    },
    bridge: {
        settingsFooter:
            "Je kunt deze widgets altijd aan- of uitzetten. Vraag gewoon om je instellingen aan te passen.",
        connectFailed: "Deze weergave kon geen verbinding maken met de app.",
    },
    nutritionSummary: {
        title: "Voedingsoverzicht",
        loading: "Je voedingsoverzicht wordt geladen…",
        empty: "Geen maaltijden of water gelogd in deze periode.",
        caloriesPerDay: "Calorieën / dag",
        chartAriaLabel: "Calorieën per dag in de geselecteerde periode",
        avg: "gem.",
        goal: "doel",
        dailyAvgLoggedDays: "Gem. per dag · gelogde dagen",
        total: "Totaal",
        daysLogged: {
            one: "{n} dag gelogd",
            other: "{n} dagen gelogd",
        },
        daysOfLogged: "{logged} van {span} dagen gelogd",
        months: [
            "jan",
            "feb",
            "mrt",
            "apr",
            "mei",
            "jun",
            "jul",
            "aug",
            "sep",
            "okt",
            "nov",
            "dec",
        ],
    },
    goalProgress: {
        loading: "Je doelvoortgang wordt geladen…",
        title: "Doelvoortgang",
        empty: "Geen doelvoortgang om te tonen.",
        nothingLoggedFor: "Nog niets gelogd voor {date}.",
        thisDay: "deze dag",
        mealsCount: { one: "{n} maaltijd", other: "{n} maaltijden" },
        waterCount: { one: "{n} keer water", other: "{n} keer water" },
        weightLabel: "Gewicht",
        weightNoneNoTarget:
            "Nog geen gewicht gelogd. Leg het vast met log_weight om je voortgang te volgen.",
        weightNoneWithTarget:
            "Nog geen gewicht gelogd. Leg het vast met log_weight om je voortgang naar je streefgewicht van {target} te volgen.",
        weightNoGoal:
            "Gewicht {reading}, geen doel ingesteld. Stel er een in met set_nutrition_goals om hier je voortgang te zien.",
        atTarget: "op streefgewicht",
        toLose: "{amount} af te vallen",
        toGain: "{amount} aan te komen",
        lastLogged: "laatst gelogd op {date}",
        weightAria:
            "Gewicht {current}, streefgewicht {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Maaltijd gelogd",
        titleUpdated: "Maaltijd bijgewerkt",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Je trends worden geladen…",
        windowAriaLabel: "Trendperiode",
        segWeek: "Week",
        segMonth: "Maand",
        segQuarter: "Kwart.",
        segYear: "Jaar",
        segDays: "Dagen",
        segWeekAria: "Weekgemiddelden tonen",
        segMonthAria: "Maandgemiddelden tonen",
        segQuarterAria: "Kwartaalgemiddelden tonen",
        segYearAria: "Jaargemiddelden tonen",
        segDaysAria: "Dagtrends tonen",
        periodTitleWeek: "Weekgemiddelden",
        periodTitleMonth: "Maandgemiddelden",
        periodTitleQuarter: "Kwartaalgemiddelden",
        periodTitleYear: "Jaargemiddelden",
        perLoggedDay: "per gelogde dag",
        daysLogged: "{logged}/{total} dagen",
        onTarget: "op doel {k}/{n}",
        possiblyIncomplete: {
            one: "{n} mogelijk onvolledig",
            other: "{n} mogelijk onvolledig",
        },
        partial: "lopend",
        nothingLogged: "niets gelogd",
        targetsChanged: "doelen gewijzigd in deze periode",
        targetsAssumed: "doelen vóór {date} niet vastgelegd",
        noTargets: "Geen doelen ingesteld — alleen gemiddelden.",
        quarter: "K{q} {year}",
        today: "Today", // i18n:pending
        daySoFar: "{day} (so far)", // i18n:pending
        soFar: "so far", // i18n:pending
        lastNDays: "Last {n} days", // i18n:pending
        nDays: "{n} days", // i18n:pending
        titleMetric: "{n}-day {metric} trend", // i18n:pending
        metricLabel: {
            calories: "Calories", // i18n:pending
            protein: "Protein", // i18n:pending
            carbs: "Carbs", // i18n:pending
            fat: "Fat", // i18n:pending
            fiber: "Fiber", // i18n:pending
            sugar: "Sugar", // i18n:pending
            addedSugar: "Added sugar", // i18n:pending
            saturated: "Saturated fat", // i18n:pending
            trans: "Trans fat", // i18n:pending
            sodium: "Sodium", // i18n:pending
            caffeine: "Caffeine", // i18n:pending
            water: "Water", // i18n:pending
            alcohol: "Alcohol", // i18n:pending
        },
        metricInTitle: {
            calories: "calorie", // i18n:pending
            protein: "protein", // i18n:pending
            carbs: "carb", // i18n:pending
            fat: "fat", // i18n:pending
            fiber: "fiber", // i18n:pending
            sugar: "sugar", // i18n:pending
            addedSugar: "added sugar", // i18n:pending
            saturated: "saturated fat", // i18n:pending
            trans: "trans fat", // i18n:pending
            sodium: "sodium", // i18n:pending
            caffeine: "caffeine", // i18n:pending
            water: "water", // i18n:pending
            alcohol: "alcohol", // i18n:pending
        },
        pill: "{n}d", // i18n:pending
        pillAria: "Show {n} days", // i18n:pending
        metricsAria: "Choose a nutrient", // i18n:pending
        scrollLeft: "Scroll left", // i18n:pending
        scrollRight: "Scroll right", // i18n:pending
        avgWord: "avg", // i18n:pending
        perDay: "{unit}/day", // i18n:pending
        chartTitle: "{metric} per day", // i18n:pending
        chartAria: "{metric} per day over {n} days", // i18n:pending
        loggedOf: "{a} of {n}", // i18n:pending
        daysLoggedWord: "days logged", // i18n:pending
        daysRecordedWord: "days recorded", // i18n:pending
        belowGoal: "below goal", // i18n:pending
        overGoal: "over goal", // i18n:pending
        underLimit: "under limit", // i18n:pending
        overLimit: "over limit", // i18n:pending
        noGoalSet: "no goal set", // i18n:pending
        heroGoal: "Goal {goal} · {pct} reached", // i18n:pending
        heroGoalOver: "Goal {goal} · {pct} of goal", // i18n:pending
        heroLimit: "Limit {goal} · {pct} used", // i18n:pending
        heroNoGoal: "No goal set", // i18n:pending
        todayNote: "Today is still in progress, so it isn’t averaged yet.", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        notRecorded: "not recorded", // i18n:pending
        pctOfGoal: "{pct} of goal", // i18n:pending
        pctOfLimit: "{pct} of limit", // i18n:pending
        amountOverGoal: "{amount} over goal", // i18n:pending
        amountOverLimit: "{amount} over limit", // i18n:pending
        onTargetPct: "on target · {pct}", // i18n:pending
        steady: "steady", // i18n:pending
        noGoal: "no goal", // i18n:pending
        notRecordedInRange:
            "{metric} wasn’t recorded on any day in this range.", // i18n:pending
        chipHigh: "High {value} {day}", // i18n:pending
        chipLow: "Low {value} {day}", // i18n:pending
        chipOnTarget: {
            one: "{value} day on target", // i18n:pending
            other: "{value} days on target", // i18n:pending
        },
        chipOverLimit: {
            one: "{value} day over limit", // i18n:pending
            other: "{value} days over limit", // i18n:pending
        },
        statDaysLogged: "Days logged", // i18n:pending
        statDaysRecorded: "Days recorded", // i18n:pending
        statOnTarget: "On target", // i18n:pending
        statDaysOverLimit: "Days over limit", // i18n:pending
        statBelowGoal: "Below goal", // i18n:pending
        statOverGoal: "Over goal", // i18n:pending
        statUnderLimit: "Under limit", // i18n:pending
        statOverLimit: "Over limit", // i18n:pending
        statNoGoal: "No goal set", // i18n:pending
        daysUnit: {
            one: "day", // i18n:pending
            other: "days", // i18n:pending
        },
        showAllDays: "Show all {n} days", // i18n:pending
        emptyTitle: "No meals logged in this period", // i18n:pending
        emptyBody: "Your trend appears here once meals are logged.", // i18n:pending
        drinkUnit: {
            us: "drinks", // i18n:pending
            uk: "units", // i18n:pending
        },
        dayAria: "{day}, {value}", // i18n:pending
    },
    weightTrends: {
        loading: "Je gewichtsverloop wordt geladen…",
        title: "Gewicht",
        empty: "Nog geen gewicht gelogd in deze periode.",
        rangeEmpty:
            "Geen weegmomenten in de afgelopen {range} dagen. Kies een langere periode.",
        windowAriaLabel: "Trendperiode",
        rangeAriaLabel: "Laatste {n} dagen",
        chartAriaLabel: "Gewicht van {from} tot {to}, laatste meting {latest}",
        trendChartAriaLabel:
            "Gewicht van {from} tot {to} met afgevlakte trendlijn, laatste meting {latest}",
        latest: "Laatste meting",
        needTwo: "minstens 2 weegmomenten nodig",
        sinceDate: "{change} sinds {date}",
        weighIns: { one: "{n} weegmoment", other: "{n} weegmomenten" },
        atTarget: "op streefgewicht",
        toLose: "{amount} af te vallen",
        toGain: "{amount} aan te komen",
        target: "Doel {value}",
        noTarget: "Geen doel ingesteld",
        trend: "Trend",
        scaleToday: "Weegschaal vandaag {value}",
        perWeek: "{amount}/wk",
        rateAriaLabel:
            "Trend verandert {amount} per week over de afgelopen 2 weken",
        rateTwoWeeks: "tempo 2 wk",
        range1y: "1 jr",
        rangeAll: "Alles",
        range1yAriaLabel: "Afgelopen jaar",
        rangeAllAriaLabel: "Volledige geschiedenis",
        sinceMonth: "{change} sinds {date}",
    },
    importMeals: {
        loading: "Import wordt voorbereid…",
        stepFile: "Bestand",
        stepMap: "Kolommen koppelen",
        stepPreview: "Voorbeeld",
        stepImport: "Importeren",
        fieldLabels: {
            logged_at: "Datum / tijd",
            description: "Naam voedingsmiddel",
            meal_type: "Maaltijd",
            calories: "Calorieën",
            protein_g: "Eiwitten (g)",
            carbs_g: "Koolhydraten (g)",
            fat_g: "Vet (g)",
            fiber_g: "Vezels (g)",
            sugar_g: "Suiker, totaal (g)",
            added_sugar_g: "Toegevoegde suiker (g)",
            saturated_fat_g: "Verzadigd vet (g)",
            trans_fat_g: "Transvet (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Cafeïne (mg)",
            sodium_mg: "Natrium (mg)",
            notes: "Notities",
            time: "Tijd (aparte kolom)",
            deleted: "Markering ‘verwijderd’",
            source_id: "Maaltijd-id (uit onze export)",
            timezone: "Tijdzone (uit onze export)",
        },
        chooseExportHeading: "Kies je export",
        noToolsWarning:
            "Deze app laat dit venster niet in je eetdagboek schrijven. Vraag Claude dan om het bestand zelf te importeren; dat kan rechtstreeks.",
        emailFallback: "Lukt het via Claude ook niet? Mail dan naar {email}.",
        tzWarning:
            "Je tijdzone is niet ingesteld, dus tijden worden als UTC gelezen en kunnen op de verkeerde dag terechtkomen. Vraag Claude om eerst je tijdzone in te stellen.",
        dropChoose: "Kies een CSV-bestand",
        dropOr: "of sleep het hierheen",
        recognizedHint:
            "Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden automatisch herkend. Er wordt niets opgeslagen totdat je bevestigt.",
        dateMapHint:
            "Koppel hierboven een datumkolom om te zien hoe een waarde uit je bestand wordt omgezet.",
        dateNoneHint: "Die kolom bevat geen datums.",
        dateUnreadable:
            "{raw} → niet te lezen als {format}, dus rijen zoals deze worden overgeslagen",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Koppel hierboven een caloriekolom om te zien hoe een waarde uit je bestand wordt omgezet.",
        energyNoneHint: "Die kolom bevat geen getallen.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (geen omrekening)",
        dateAmbiguousWarning:
            "Uit dit bestand valt het datumformaat niet af te leiden: de datums zijn net zo goed te lezen met de dag vooraan als met de maand vooraan. Bevestig welk formaat je app exporteert. Kies je verkeerd, dan komen maaltijden zonder foutmelding op de verkeerde dag terecht.",
        dateFormatLabel: "Datumformaat in dit bestand",
        dateFormatYmd: "Jaar-maand-dag",
        dateFormatDmy: "Dag/maand/jaar",
        dateFormatMdy: "Maand/dag/jaar",
        energyUnitLabel: "Energie-eenheid van de caloriekolom",
        energyUnitKcal: "Calorieën",
        energyUnitKj: "Kilojoules",
        mapColumnsHeading: "Kolommen koppelen",
        rowsCount: { one: "{n} rij", other: "{n} rijen" },
        columnsCount: { one: "{n} kolom", other: "{n} kolommen" },
        delimiterLabel: "scheidingsteken",
        tabLabel: "tab",
        notInFile: "(niet in dit bestand)",
        columnFallback: "kolom {n}",
        caffeineGramsNotice:
            "De cafeïnekolom in dit bestand ({column}) staat in gram, maar cafeïne wordt opgeslagen in milligram, dus Cafeïne is niet gekoppeld. Wel koppelen zou 0,18 vastleggen waar op het etiket 180 mg staat. Hetzelfde bestand later opnieuw importeren vult dit niet alsnog aan: die rijen zijn dan al gelogd en worden als duplicaten overgeslagen. Klopt de kolomkop niet en staan de waarden echt in milligram, kies de kolom dan hierboven. Staan ze echt in gram, vermenigvuldig ze dan vóór het importeren met 1000 in het bestand, niet erna.",
        alcoholNotice:
            "Dit bestand heeft een alcoholkolom ({column}), maar alcoholregistratie staat uit voor dit account, dus die kolom wordt niet geïmporteerd. Hetzelfde bestand later opnieuw importeren vult dit niet alsnog aan: die rijen zijn dan al gelogd en worden als duplicaten overgeslagen. Wil je deze gegevens bewaren, vraag Claude dan vóór het importeren om alcoholregistratie (set_alcohol_tracking) aan te zetten.",
        sampleValue: "bijv. {sample}",
        sourceAppLabel: "Bron-app (optioneel)",
        sourceAppHint:
            "Hiermee krijgen rijen zonder eigen productnaam toch een label.",
        previewButton: "Voorbeeld bekijken",
        chooseAnotherButton: "Ander bestand kiezen",
        previewHeading: "Voorbeeld",
        mealsToImport: {
            one: "{n} maaltijd te importeren",
            other: "{n} maaltijden te importeren",
        },
        kcalTotal: "{kcal} kcal in totaal",
        rowsSkipped: {
            one: "{n} rij overgeslagen",
            other: "{n} rijen overgeslagen",
        },
        batchCount: { one: "{n} batch", other: "{n} batches" },
        datesReadAs: "Datums gelezen als {format}; energie {conversion}.",
        energyConvertedNote: "omgerekend van kJ naar kcal",
        energyReadAsKcal: "gelezen als kcal",
        badDatesWarning: {
            one: "{n} rij is overgeslagen omdat de datum niet als {format} te lezen was{sample}. Ga terug en kies het datumformaat dat bij je bestand past.",
            other: "{n} rijen zijn overgeslagen omdat de datum niet als {format} te lezen was{sample}. Ga terug en kies het datumformaat dat bij je bestand past.",
        },
        badDateSample: " (bijv. regel {line}: {value})",
        noTimeWarning: {
            one: "{n} rij heeft een datum maar geen tijd en wordt om 12:00 gelogd.",
            other: "{n} rijen hebben een datum maar geen tijd en worden om 12:00 gelogd.",
        },
        splitDatesCount: {
            one: "{n} datum heeft",
            other: "{n} datums hebben",
        },
        splitDatesWarning:
            " meer dan {max} maaltijden (bijv. {date}), dus de import is over meerdere batches verdeeld. Staan er op die datum twee registraties met precies hetzelfde voedingsmiddel, hetzelfde maaltijdtype en dezelfde macro's, dan kan er één als duplicaat worden overgeslagen in plaats van geïmporteerd.",
        tableAbbr: {
            protein_g: "E",
            carbs_g: "K",
            fat_g: "V",
            fiber_g: "Vezels",
            sugar_g: "Suiker",
            added_sugar_g: "Toegev",
            saturated_fat_g: "Verz.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Regel",
        tableWhen: "Tijdstip",
        tableMeal: "Maaltijd",
        tableFood: "Voedingsmiddel",
        tableProblem: "Probleem",
        noNameFallback: "(geen naam, krijgt het maaltijdtype als naam)",
        showingRows: "{shown} van {total} rijen weergegeven",
        checkingRows: {
            one: "{n} rij wordt gecontroleerd…",
            other: "{n} rijen worden gecontroleerd…",
        },
        importingRows: {
            one: "{n} rij wordt geïmporteerd…",
            other: "{n} rijen worden geïmporteerd…",
        },
        batchProgress: "{label} (batch {done} van {total})",
        rowsRange: "Rijen {a}–{b}: {msg}",
        preflightFailed: "Controle vooraf mislukt.",
        rowsWouldFail: {
            one: "{n} rij zou mislukken, bijv. regel {line}: {message}",
            other: "{n} rijen zouden mislukken, bijv. regel {line}: {message}",
        },
        importingEllipsis: "Bezig met importeren…",
        importButton: {
            one: "{n} maaltijd importeren",
            other: "{n} maaltijden importeren",
        },
        backToMapping: "Terug naar koppelen",
        importCompleteHeading: "Import voltooid",
        resultMealsImported: {
            one: "{n} maaltijd geïmporteerd",
            other: "{n} maaltijden geïmporteerd",
        },
        resultAlreadyLogged: {
            one: ", {n} al gelogd",
            other: ", {n} al gelogd",
        },
        resultFailed: {
            one: ", {n} mislukt",
            other: ", {n} mislukt",
        },
        resultSkipped: {
            one: ", {n} overgeslagen",
            other: ", {n} overgeslagen",
        },
        restartButton: "Nog een bestand importeren",
        couldNotReadFile: "Dat bestand kon niet worden gelezen: {msg}",
        noDataRows: "Geen datarijen gevonden in dat bestand.",
        emailNotice:
            "Werkt het niet zoals verwacht? Mail naar {email} en stuur de regels hieronder mee; meer is er niet nodig om het probleem te achterhalen.",
    },
};

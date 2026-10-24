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
        titleLogged: "Maaltijd gelogd",
        titleUpdated: "Maaltijd bijgewerkt",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Je trends worden geladen…",
        title: "Trends",
        empty: "Nog geen maaltijden of water gelogd in deze periode.",
        avgUnder: "tekort",
        loggedOfTotal: "{logged}/{total} dagen gelogd",
        caloriesOverRange: "Calorieën per dag in de afgelopen {range} dagen",
        windowAriaLabel: "Trendperiode",
        rangeDaysAriaLabel: "{n} dagen",
        avgAllDays: "Gem. over {range} dagen · alle dagen",
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

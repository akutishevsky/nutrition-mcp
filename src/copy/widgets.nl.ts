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

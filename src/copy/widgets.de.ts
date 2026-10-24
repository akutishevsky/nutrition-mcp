import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_DE: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalorien",
            protein_g: "Protein",
            // Not the full "Kohlenhydrate": it truncates in the compact
            // three-column macro tile (visually confirmed against the
            // assembled widget) the way "Protein"/"Fett" don't.
            carbs_g: "Kohlenh.",
            fat_g: "Fett",
            sugar_g: "Zucker",
            added_sugar_g: "Zugesetzter Zucker",
            saturated_fat_g: "Gesättigte Fettsäuren",
            trans_fat_g: "Transfette",
            alcohol_g: "Alkohol",
            caffeine_mg: "Koffein",
            sodium_mg: "Natrium",
            fiber_g: "Ballaststoffe",
            water_ml: "Wasser",
        },
        noGoalSet: "kein Ziel gesetzt",
        atLimit: "am Limit",
        floorUnder: "übrig",
        ceilingUnder: "darunter",
        over: "darüber",
        limitPrefix: "Limit",
        ofPrefix: "von",
        drinkLabels: { us: "US-Drinks", uk: "UK-Einheiten" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "l",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nichts erfasst",
        notRecorded: "nicht erfasst",
        caloriesToday: "Kalorien heute",
        caloriesOn: "Kalorien · {date}",
        tapHint: "Tipp auf einen Wert, um die Mahlzeiten dazu zu sehen",
        showMealsContributed:
            "Mahlzeiten anzeigen, die dazu beigetragen haben.",
        byMealTitle: "{label} pro Mahlzeit",
        closeBreakdown: "Aufschlüsselung schließen",
        noMealsContributed: "Keine erfasste Mahlzeit enthält {label}.",
        untitledMeal: "Mahlzeit ohne Namen",
        moreMeals: {
            one: "+ {n} kleinere Mahlzeit",
            other: "+ {n} kleinere Mahlzeiten",
        },
        moreMealsAtLeast: {
            one: "+ {n} oder mehr kleinere Mahlzeiten",
            other: "+ {n} oder mehr kleinere Mahlzeiten",
        },
        moreMealsMaybe: "+ evtl. weitere kleinere Mahlzeiten",
        ingredientCount: {
            one: "{n} Zutat",
            other: "{n} Zutaten",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "eigene",
        sourceEst: "gesch.",
        sourceMixed: "gemischt",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "Barcode",
        sourceDataType: "Datentyp",
        sourceAria: "Quelle: {source}",
        sourceDetailsAria: "Quellendetails anzeigen",
    },
    bridge: {
        settingsFooter:
            "Du kannst diese Widgets jederzeit ein- oder ausschalten – sag einfach Bescheid, wenn du deine Einstellungen ändern willst.",
        connectFailed:
            "Diese Ansicht konnte sich nicht mit ihrem Host verbinden.",
    },
    nutritionSummary: {
        title: "Ernährungsübersicht",
        loading: "Ernährungsübersicht wird geladen …",
        empty: "Keine Mahlzeiten und kein Wasser in diesem Zeitraum erfasst.",
        caloriesPerDay: "Kalorien / Tag",
        chartAriaLabel: "Kalorien pro Tag im gewählten Zeitraum",
        avg: "Ø",
        goal: "Ziel",
        dailyAvgLoggedDays: "Ø pro Tag · erfasste Tage",
        total: "Gesamt",
        daysLogged: {
            one: "{n} Tag erfasst",
            other: "{n} Tage erfasst",
        },
        daysOfLogged: "{logged} von {span} Tagen erfasst",
        months: [
            "Jan",
            "Feb",
            "Mär",
            "Apr",
            "Mai",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dez",
        ],
    },
    goalProgress: {
        loading: "Zielfortschritt wird geladen …",
        title: "Zielfortschritt",
        empty: "Kein Zielfortschritt vorhanden.",
        nothingLoggedFor: "Für {date} noch nichts erfasst.",
        thisDay: "diesen Tag",
        mealsCount: { one: "{n} Mahlzeit", other: "{n} Mahlzeiten" },
        waterCount: { one: "{n} Wasser-Eintrag", other: "{n} Wasser-Einträge" },
        weightLabel: "Gewicht",
        weightNoneNoTarget:
            "Noch kein Gewicht erfasst. Trag es mit log_weight ein, um deinen Fortschritt zu verfolgen.",
        weightNoneWithTarget:
            "Noch kein Gewicht erfasst. Trag es mit log_weight ein, um deinen Fortschritt zum Zielgewicht von {target} zu verfolgen.",
        weightNoGoal:
            "Gewicht {reading} – kein Ziel gesetzt. Leg mit set_nutrition_goals eins fest, um hier deinen Fortschritt zu sehen.",
        atTarget: "am Ziel",
        toLose: "noch {amount} abnehmen",
        toGain: "noch {amount} zunehmen",
        lastLogged: "zuletzt erfasst am {date}",
        weightAria: "Gewicht {current}, Ziel {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Mahlzeit erfasst",
        titleUpdated: "Mahlzeit aktualisiert",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Trends werden geladen …",
        windowAriaLabel: "Trendzeitraum",
        segWeek: "Woche",
        segMonth: "Monat",
        segQuarter: "Quart.",
        segYear: "Jahr",
        segDays: "Tage",
        segWeekAria: "Wochendurchschnitte anzeigen",
        segMonthAria: "Monatsdurchschnitte anzeigen",
        segQuarterAria: "Quartalsdurchschnitte anzeigen",
        segYearAria: "Jahresdurchschnitte anzeigen",
        segDaysAria: "Tagestrends anzeigen",
        periodTitleWeek: "Wochendurchschnitte",
        periodTitleMonth: "Monatsdurchschnitte",
        periodTitleQuarter: "Quartalsdurchschnitte",
        periodTitleYear: "Jahresdurchschnitte",
        perLoggedDay: "pro erfasstem Tag",
        daysLogged: "{logged}/{total} Tage",
        onTarget: "im Ziel {k}/{n}",
        possiblyIncomplete: {
            one: "{n} evtl. unvollständig",
            other: "{n} evtl. unvollständig",
        },
        partial: "laufend",
        nothingLogged: "nichts erfasst",
        targetsChanged: "Ziele im Zeitraum geändert",
        targetsAssumed: "Ziele vor dem {date} nicht erfasst",
        noTargets: "Keine Ziele gesetzt – nur Durchschnitte.",
        quarter: "Q{q} {year}",
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
        pillAria: "Show the last {n} days", // i18n:pending
        metricsAria: "Choose a nutrient", // i18n:pending
        scrollLeft: "Scroll left", // i18n:pending
        scrollRight: "Scroll right", // i18n:pending
        avgWord: "avg", // i18n:pending
        perDay: "{unit}/day", // i18n:pending
        chartTitle: "{metric} per day", // i18n:pending
        chartAria: "{metric} per day over the last {n} days", // i18n:pending
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
        emptyTitle: "No meals logged in the last 30 days", // i18n:pending
        emptyBody: "Your trend appears here once meals are logged.", // i18n:pending
        drinkUnit: {
            us: "drinks", // i18n:pending
            uk: "units", // i18n:pending
        },
        dayAria: "{day}, {value}", // i18n:pending
    },
    weightTrends: {
        loading: "Gewichtsverlauf wird geladen …",
        title: "Gewicht",
        empty: "Noch kein Gewicht in diesem Zeitraum erfasst.",
        rangeEmpty:
            "Keine Messungen in den letzten {range} Tagen. Wähl einen längeren Zeitraum.",
        windowAriaLabel: "Trendzeitraum",
        rangeAriaLabel: "Letzte {n} Tage",
        chartAriaLabel: "Gewicht vom {from} bis {to}, zuletzt {latest}",
        trendChartAriaLabel:
            "Gewicht vom {from} bis {to} mit geglätteter Trendlinie, zuletzt {latest}",
        latest: "Zuletzt",
        needTwo: "mindestens 2 Messungen nötig",
        sinceDate: "{change} seit {date}",
        weighIns: { one: "{n} Messung", other: "{n} Messungen" },
        atTarget: "am Ziel",
        toLose: "noch {amount} abnehmen",
        toGain: "noch {amount} zunehmen",
        target: "Ziel {value}",
        noTarget: "Kein Ziel gesetzt",
        trend: "Trend",
        scaleToday: "Waage heute {value}",
        perWeek: "{amount}/Wo.",
        rateAriaLabel:
            "Trend ändert sich um {amount} pro Woche über die letzten 2 Wochen",
        rateTwoWeeks: "2-Wochen-Rate",
        range1y: "1 J.",
        rangeAll: "Alle",
        range1yAriaLabel: "Letztes Jahr",
        rangeAllAriaLabel: "Gesamter Verlauf",
        sinceMonth: "{change} seit {date}",
    },
    importMeals: {
        loading: "Import wird vorbereitet …",
        stepFile: "Datei",
        stepMap: "Zuordnen",
        stepPreview: "Vorschau",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Datum / Uhrzeit",
            description: "Name des Lebensmittels",
            meal_type: "Mahlzeit",
            calories: "Kalorien",
            protein_g: "Protein (g)",
            carbs_g: "Kohlenhydrate (g)",
            fat_g: "Fett (g)",
            fiber_g: "Ballaststoffe (g)",
            sugar_g: "Gesamtzucker (g)",
            added_sugar_g: "Zugesetzter Zucker (g)",
            saturated_fat_g: "Gesättigte Fettsäuren (g)",
            trans_fat_g: "Transfette (g)",
            alcohol_g: "Alkohol (g)",
            caffeine_mg: "Koffein (mg)",
            sodium_mg: "Natrium (mg)",
            notes: "Notizen",
            time: "Uhrzeit (eigene Spalte)",
            deleted: "Markierung „gelöscht“",
            source_id: "Mahlzeiten-ID (aus unserem Export)",
            timezone: "Zeitzone (aus unserem Export)",
        },
        chooseExportHeading: "Wähl deinen Export",
        noToolsWarning:
            "Dieser Host erlaubt dieser Ansicht nicht, in dein Ernährungstagebuch zu schreiben. Bitte stattdessen Claude, die Datei zu importieren – Claude kann das direkt erledigen.",
        emailFallback: "Klappt es auch über Claude nicht, schreib an {email}.",
        tzWarning:
            "Deine Zeitzone ist nicht festgelegt. Uhrzeiten werden deshalb als UTC gelesen und können auf dem falschen Tag landen. Bitte Claude, zuerst deine Zeitzone festzulegen.",
        dropChoose: "CSV-Datei auswählen",
        dropOr: "oder hierher ziehen",
        recognizedHint:
            "Exporte von MyFitnessPal, Cronometer, Lose It! und MacroFactor werden automatisch erkannt. Gespeichert wird erst, wenn du bestätigst.",
        dateMapHint:
            "Ordne oben eine Datumsspalte zu, um zu sehen, wie ein Wert aus deiner Datei umgewandelt wird.",
        dateNoneHint: "Diese Spalte enthält keine Datumsangaben.",
        dateUnreadable:
            "{raw} → nicht als {format} lesbar – Zeilen wie diese werden übersprungen",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Ordne oben eine Kalorienspalte zu, um zu sehen, wie ein Wert aus deiner Datei umgewandelt wird.",
        energyNoneHint: "Diese Spalte enthält keine Zahlen.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (keine Umrechnung)",
        dateAmbiguousWarning:
            "Das Datumsformat lässt sich aus dieser Datei nicht bestimmen – die Datumsangaben ergeben mit dem Tag zuerst genauso Sinn wie mit dem Monat zuerst. Bitte bestätige, welches Format deine App exportiert: Bei falscher Wahl landen Mahlzeiten ohne Fehlermeldung am falschen Tag.",
        dateFormatLabel: "Datumsformat in dieser Datei",
        dateFormatYmd: "Jahr-Monat-Tag",
        dateFormatDmy: "Tag/Monat/Jahr",
        dateFormatMdy: "Monat/Tag/Jahr",
        energyUnitLabel: "Energieeinheit der Kalorienspalte",
        energyUnitKcal: "Kalorien",
        energyUnitKj: "Kilojoule",
        mapColumnsHeading: "Spalten zuordnen",
        rowsCount: { one: "{n} Zeile", other: "{n} Zeilen" },
        columnsCount: { one: "{n} Spalte", other: "{n} Spalten" },
        delimiterLabel: "Trennzeichen",
        tabLabel: "Tab",
        notInFile: "(nicht in dieser Datei)",
        columnFallback: "Spalte {n}",
        caffeineGramsNotice:
            "Die Koffeinspalte dieser Datei ({column}) ist in Gramm angegeben, Koffein wird aber in Milligramm gespeichert, deshalb wurde Koffein nicht zugeordnet. Sonst würde 0,18 erfasst, wo auf dem Etikett 180 mg steht. Ein erneuter Import derselben Datei trägt das später nicht nach – diese Zeilen sind dann schon erfasst und werden als Duplikate übersprungen. Ist die Spalte falsch beschriftet und sind die Werte wirklich Milligramm, wähl sie oben aus; sind es wirklich Gramm, multipliziere sie vor dem Import in der Datei mit 1000, nicht danach.",
        alcoholNotice:
            "Diese Datei hat eine Alkoholspalte ({column}), aber die Alkohol-Erfassung ist für dieses Konto ausgeschaltet, deshalb wird sie nicht importiert. Ein erneuter Import derselben Datei trägt das später nicht nach – diese Zeilen sind dann schon erfasst und werden als Duplikate übersprungen. Wenn du diese Daten behalten willst, bitte Claude, vor dem Import die Alkohol-Erfassung einzuschalten (set_alcohol_tracking).",
        sampleValue: "z. B. {sample}",
        sourceAppLabel: "Quell-App (optional)",
        sourceAppHint:
            "Dient als Bezeichnung für Zeilen ohne eigenen Lebensmittelnamen.",
        previewButton: "Vorschau anzeigen",
        chooseAnotherButton: "Andere Datei wählen",
        previewHeading: "Vorschau",
        mealsToImport: {
            one: "{n} Mahlzeit zu importieren",
            other: "{n} Mahlzeiten zu importieren",
        },
        kcalTotal: "{kcal} kcal insgesamt",
        rowsSkipped: {
            one: "{n} Zeile übersprungen",
            other: "{n} Zeilen übersprungen",
        },
        batchCount: { one: "{n} Stapel", other: "{n} Stapel" },
        datesReadAs:
            "Datumsangaben als {format} gelesen; Energie {conversion}.",
        energyConvertedNote: "von kJ in kcal umgerechnet",
        energyReadAsKcal: "als kcal gelesen",
        badDatesWarning: {
            one: "{n} Zeile wurde übersprungen, weil ihr Datum nicht als {format} gelesen werden konnte{sample}. Geh zurück und wähl das Datumsformat, das zu deiner Datei passt.",
            other: "{n} Zeilen wurden übersprungen, weil ihr Datum nicht als {format} gelesen werden konnte{sample}. Geh zurück und wähl das Datumsformat, das zu deiner Datei passt.",
        },
        badDateSample: " (z. B. Zeile {line}: {value})",
        noTimeWarning: {
            one: "{n} Zeile hat ein Datum, aber keine Uhrzeit – sie wird um 12 Uhr mittags erfasst.",
            other: "{n} Zeilen haben ein Datum, aber keine Uhrzeit – sie werden um 12 Uhr mittags erfasst.",
        },
        splitDatesCount: {
            one: "{n} Tag hat",
            other: "{n} Tage haben",
        },
        splitDatesWarning:
            " mehr als {max} Mahlzeiten (z. B. {date}), deshalb wurde der Import auf mehrere Stapel aufgeteilt. Stehen an so einem Tag zwei Einträge mit genau demselben Lebensmittel, Mahlzeitentyp und denselben Makros, kann einer davon als Duplikat übersprungen statt importiert werden.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "KH",
            fat_g: "F",
            fiber_g: "Ball.",
            sugar_g: "Zucker",
            added_sugar_g: "Zuges.",
            saturated_fat_g: "Ges.",
            trans_fat_g: "Trans",
            alcohol_g: "Alk.",
            caffeine_mg: "Koff.",
            sodium_mg: "Na",
        },
        tableLine: "Zeile",
        tableWhen: "Zeitpunkt",
        tableMeal: "Mahlzeit",
        tableFood: "Lebensmittel",
        tableProblem: "Problem",
        noNameFallback: "(kein Name – wird nach Mahlzeit benannt)",
        showingRows: "{shown} von {total} Zeilen angezeigt",
        checkingRows: {
            one: "{n} Zeile wird geprüft …",
            other: "{n} Zeilen werden geprüft …",
        },
        importingRows: {
            one: "{n} Zeile wird importiert …",
            other: "{n} Zeilen werden importiert …",
        },
        batchProgress: "{label} (Stapel {done} von {total})",
        rowsRange: "Zeilen {a}–{b}: {msg}",
        preflightFailed: "Vorabprüfung fehlgeschlagen.",
        rowsWouldFail: {
            one: "{n} Zeile würde fehlschlagen, z. B. Zeile {line}: {message}",
            other: "{n} Zeilen würden fehlschlagen, z. B. Zeile {line}: {message}",
        },
        importingEllipsis: "Wird importiert …",
        importButton: {
            one: "{n} Mahlzeit importieren",
            other: "{n} Mahlzeiten importieren",
        },
        backToMapping: "Zurück zur Zuordnung",
        importCompleteHeading: "Import abgeschlossen",
        resultMealsImported: {
            one: "{n} Mahlzeit importiert",
            other: "{n} Mahlzeiten importiert",
        },
        resultAlreadyLogged: {
            one: ", {n} bereits erfasst",
            other: ", {n} bereits erfasst",
        },
        resultFailed: {
            one: ", {n} fehlgeschlagen",
            other: ", {n} fehlgeschlagen",
        },
        resultSkipped: {
            one: ", {n} übersprungen",
            other: ", {n} übersprungen",
        },
        restartButton: "Weitere Datei importieren",
        couldNotReadFile: "Die Datei konnte nicht gelesen werden: {msg}",
        noDataRows: "Keine Datenzeilen in der Datei gefunden.",
        emailNotice:
            "Läuft etwas nicht wie erwartet? Schreib an {email} und füg die Zeilen unten bei – mehr braucht es zur Fehlersuche nicht.",
    },
};

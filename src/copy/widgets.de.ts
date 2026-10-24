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
        title: "Trends",
        empty: "Noch keine Mahlzeiten und kein Wasser in diesem Zeitraum erfasst.",
        avgUnder: "darunter",
        loggedOfTotal: "{logged}/{total} Tage erfasst",
        caloriesOverRange: "Kalorien pro Tag in den letzten {range} Tagen",
        windowAriaLabel: "Trendzeitraum",
        rangeDaysAriaLabel: "{n} Tage",
        avgAllDays: "{range}-Tage-Ø · alle Tage",
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

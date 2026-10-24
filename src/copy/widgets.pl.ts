import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_PL: WidgetStrings = {
    macros: {
        labels: {
            calories: "Kalorie",
            protein_g: "Białko",
            carbs_g: "Węglowodany",
            fat_g: "Tłuszcz",
            sugar_g: "Cukier",
            added_sugar_g: "Cukier dodany",
            saturated_fat_g: "Tłuszcze nasycone",
            trans_fat_g: "Tłuszcze trans",
            alcohol_g: "Alkohol",
            caffeine_mg: "Kofeina",
            sodium_mg: "Sód",
            fiber_g: "Błonnik",
            water_ml: "Woda",
        },
        noGoalSet: "brak celu",
        atLimit: "limit osiągnięty",
        floorUnder: "zostało",
        ceilingUnder: "do limitu",
        over: "powyżej",
        limitPrefix: "limit",
        ofPrefix: "z",
        drinkLabels: { us: "porcje (USA)", uk: "jednostki (UK)" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "l",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "brak wpisów",
        notRecorded: "nie zapisano",
        caloriesToday: "Kalorie dziś",
        caloriesOn: "Kalorie · {date}",
        tapHint: "Dotknij wskaźnika, by zobaczyć posiłki",
        showMealsContributed: "Pokaż posiłki, które się na to złożyły.",
        byMealTitle: "{label} w posiłkach",
        closeBreakdown: "Zamknij szczegóły",
        noMealsContributed:
            "{label}: żaden zapisany posiłek tego nie zawierał.",
        untitledMeal: "Posiłek bez nazwy",
        moreMeals: {
            one: "+ {n} mniejszy posiłek",
            few: "+ {n} mniejsze posiłki",
            many: "+ {n} mniejszych posiłków",
            other: "+ {n} mniejszych posiłków",
        },
        moreMealsAtLeast: {
            one: "+ co najmniej {n} mniejszy posiłek",
            few: "+ co najmniej {n} mniejsze posiłki",
            many: "+ co najmniej {n} mniejszych posiłków",
            other: "+ co najmniej {n} mniejszych posiłków",
        },
        moreMealsMaybe: "+ być może więcej mniejszych posiłków",
        ingredientCount: {
            one: "{n} składnik",
            few: "{n} składniki",
            many: "{n} składników",
            other: "{n} składników",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "własne",
        sourceEst: "szac.",
        sourceMixed: "mieszane",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "kod kreskowy",
        sourceDataType: "typ danych",
        sourceAria: "Źródło: {source}",
        sourceDetailsAria: "Pokaż szczegóły źródła",
    },
    bridge: {
        settingsFooter:
            "Możesz w każdej chwili włączyć lub wyłączyć te widżety — wystarczy poprosić o zmianę ustawień.",
        connectFailed: "Nie udało się połączyć tego widoku z aplikacją hosta.",
    },
    nutritionSummary: {
        title: "Podsumowanie odżywiania",
        loading: "Wczytuję podsumowanie odżywiania…",
        empty: "Brak zapisanych posiłków lub wody w tym okresie.",
        caloriesPerDay: "Kalorie / dzień",
        chartAriaLabel: "Kalorie dziennie w wybranym okresie",
        avg: "śr.",
        goal: "cel",
        dailyAvgLoggedDays: "Śr. dzienna · dni z wpisami",
        total: "Razem",
        daysLogged: {
            one: "{n} dzień z wpisem",
            few: "{n} dni z wpisami",
            many: "{n} dni z wpisami",
            other: "{n} dni z wpisami",
        },
        daysOfLogged: "Dni z wpisami: {logged} z {span}",
        months: [
            "sty",
            "lut",
            "mar",
            "kwi",
            "maj",
            "cze",
            "lip",
            "sie",
            "wrz",
            "paź",
            "lis",
            "gru",
        ],
    },
    goalProgress: {
        loading: "Wczytuję realizację celów…",
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
        titleLogged: "Posiłek zapisany",
        titleUpdated: "Posiłek zaktualizowany",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Wczytuję trendy…",
        title: "Trendy",
        empty: "W tym okresie nie ma jeszcze posiłków ani wody.",
        avgUnder: "poniżej",
        loggedOfTotal: "{logged}/{total} dni z wpisami",
        caloriesOverRange: "Kalorie dziennie z ostatnich {range} dni",
        windowAriaLabel: "Zakres trendu",
        rangeDaysAriaLabel: "{n} dni",
        avgAllDays: "Śr. z {range} dni · wszystkie dni",
        segWeek: "Tydz.",
        segMonth: "Mies.",
        segQuarter: "Kw.",
        segYear: "Rok",
        segDays: "Dni",
        segWeekAria: "Pokaż średnie tygodniowe",
        segMonthAria: "Pokaż średnie miesięczne",
        segQuarterAria: "Pokaż średnie kwartalne",
        segYearAria: "Pokaż średnie roczne",
        segDaysAria: "Pokaż trendy dzienne",
        periodTitleWeek: "Średnie tygodniowe",
        periodTitleMonth: "Średnie miesięczne",
        periodTitleQuarter: "Średnie kwartalne",
        periodTitleYear: "Średnie roczne",
        perLoggedDay: "na dzień z wpisami",
        daysLogged: "{logged}/{total} dni",
        onTarget: "w celu {k}/{n}",
        possiblyIncomplete: {
            one: "{n} dzień może być niepełny",
            few: "{n} dni mogą być niepełne",
            many: "{n} dni może być niepełnych",
            other: "{n} dni może być niepełnych",
        },
        partial: "w toku",
        nothingLogged: "brak wpisów",
        targetsChanged: "cele zmienione w trakcie okresu",
        targetsAssumed: "brak zapisanych celów sprzed {date}",
        noTargets: "Brak ustawionych celów — tylko średnie.",
        quarter: "{q} kw. {year}",
    },
    weightTrends: {
        loading: "Wczytuję trendy wagi…",
        title: "Waga",
        empty: "W tym okresie nie ma jeszcze pomiarów wagi.",
        rangeEmpty:
            "Brak pomiarów wagi z ostatnich {range} dni. Wybierz dłuższy okres.",
        windowAriaLabel: "Zakres trendu",
        rangeAriaLabel: "Ostatnie {n} dni",
        chartAriaLabel: "Waga od {from} do {to}, ostatni pomiar {latest}",
        trendChartAriaLabel:
            "Waga od {from} do {to} z wygładzoną linią trendu, ostatni pomiar {latest}",
        latest: "Ostatni pomiar",
        needTwo: "potrzeba min. 2 pomiarów",
        sinceDate: "{change} od {date}",
        weighIns: {
            one: "{n} pomiar",
            few: "{n} pomiary",
            many: "{n} pomiarów",
            other: "{n} pomiarów",
        },
        atTarget: "cel osiągnięty",
        toLose: "{amount} do zrzucenia",
        toGain: "{amount} do przybrania",
        target: "Cel {value}",
        noTarget: "Brak celu",
        trend: "Trend",
        scaleToday: "Waga dziś {value}",
        perWeek: "{amount}/tydz.",
        rateAriaLabel:
            "Trend zmienia się o {amount} tygodniowo w ostatnich 2 tygodniach",
        rateTwoWeeks: "tempo 2 tyg.",
        range1y: "1 r.",
        rangeAll: "Wszystko",
        range1yAriaLabel: "Ostatni rok",
        rangeAllAriaLabel: "Cała historia",
        sinceMonth: "{change} od {date}",
    },
    importMeals: {
        loading: "Przygotowuję import…",
        stepFile: "Plik",
        stepMap: "Dopasuj kolumny",
        stepPreview: "Podgląd",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Data / godzina",
            description: "Nazwa produktu",
            meal_type: "Posiłek",
            calories: "Kalorie",
            protein_g: "Białko (g)",
            carbs_g: "Węglowodany (g)",
            fat_g: "Tłuszcz (g)",
            fiber_g: "Błonnik (g)",
            sugar_g: "Cukry ogółem (g)",
            added_sugar_g: "Cukry dodane (g)",
            saturated_fat_g: "Tłuszcze nasycone (g)",
            trans_fat_g: "Tłuszcze trans (g)",
            alcohol_g: "Alkohol (g)",
            caffeine_mg: "Kofeina (mg)",
            sodium_mg: "Sód (mg)",
            notes: "Notatki",
            time: "Godzina (osobna kolumna)",
            deleted: "Znacznik usunięcia",
            source_id: "ID posiłku (z naszego eksportu)",
            timezone: "Strefa czasowa (z naszego eksportu)",
        },
        chooseExportHeading: "Wybierz plik eksportu",
        noToolsWarning:
            "Ta aplikacja nie pozwala temu widokowi zapisywać w Twoim dzienniku. Zamiast tego poproś Claude o zaimportowanie pliku — Claude może to zrobić bezpośrednio.",
        emailFallback:
            "Jeśli prośba do Claude też nie pomoże, napisz na {email}.",
        tzWarning:
            "Nie masz ustawionej strefy czasowej, więc godziny zostaną odczytane jako UTC, a posiłki mogą trafić pod niewłaściwą datę. Najpierw poproś Claude o ustawienie strefy czasowej.",
        dropChoose: "Wybierz plik CSV",
        dropOr: "lub przeciągnij go tutaj",
        recognizedHint:
            "Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor są rozpoznawane automatycznie. Nic nie zostanie zapisane, dopóki nie potwierdzisz.",
        dateMapHint:
            "Wybierz powyżej kolumnę z datą, by zobaczyć, jak zostanie odczytana wartość z Twojego pliku.",
        dateNoneHint: "Ta kolumna nie zawiera dat.",
        dateUnreadable:
            "{raw} → nie da się odczytać jako {format}, więc takie wiersze zostaną pominięte",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Wybierz powyżej kolumnę z kaloriami, by zobaczyć, jak zostanie przeliczona wartość z Twojego pliku.",
        energyNoneHint: "Ta kolumna nie zawiera liczb.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (bez przeliczania)",
        dateAmbiguousWarning:
            "Nie udało się ustalić formatu daty w tym pliku — daty da się odczytać zarówno z dniem, jak i z miesiącem na początku. Potwierdź, jaki format eksportuje Twoja aplikacja: zły wybór po cichu zapisze posiłki pod niewłaściwą datą.",
        dateFormatLabel: "Format daty w tym pliku",
        dateFormatYmd: "Rok-miesiąc-dzień",
        dateFormatDmy: "Dzień/miesiąc/rok",
        dateFormatMdy: "Miesiąc/dzień/rok",
        energyUnitLabel: "Jednostka energii w kolumnie kalorii",
        energyUnitKcal: "Kalorie",
        energyUnitKj: "Kilodżule",
        mapColumnsHeading: "Dopasuj kolumny",
        rowsCount: {
            one: "{n} wiersz",
            few: "{n} wiersze",
            many: "{n} wierszy",
            other: "{n} wierszy",
        },
        columnsCount: {
            one: "{n} kolumna",
            few: "{n} kolumny",
            many: "{n} kolumn",
            other: "{n} kolumn",
        },
        delimiterLabel: "separator",
        tabLabel: "tabulator",
        notInFile: "(brak w tym pliku)",
        columnFallback: "kolumna {n}",
        caffeineGramsNotice:
            "Kolumna kofeiny w tym pliku ({column}) jest w gramach, a kofeina jest zapisywana w miligramach, więc pola Kofeina nie dopasowano do żadnej kolumny. Po dopasowaniu zapisałoby się 0,18 tam, gdzie etykieta podaje 180 mg. Ponowny import tego samego pliku później tego nie uzupełni — te wiersze będą już zapisane i zostaną pominięte jako duplikaty. Jeśli nagłówek jest źle opisany, a wartości naprawdę są w miligramach, wybierz tę kolumnę powyżej; jeśli naprawdę są w gramach, pomnóż je w pliku przez 1000 przed importem, a nie po nim.",
        alcoholNotice:
            "Ten plik ma kolumnę alkoholu ({column}), ale śledzenie alkoholu jest na tym koncie wyłączone, więc ta kolumna nie zostanie zaimportowana. Ponowny import tego samego pliku później tego nie uzupełni — te wiersze będą już zapisane i zostaną pominięte jako duplikaty. Aby zachować te dane, przed importem poproś Claude o włączenie śledzenia alkoholu (set_alcohol_tracking).",
        sampleValue: "np. {sample}",
        sourceAppLabel: "Aplikacja źródłowa (opcjonalnie)",
        sourceAppHint: "Służy do opisania wierszy bez własnej nazwy produktu.",
        previewButton: "Pokaż podgląd",
        chooseAnotherButton: "Wybierz inny plik",
        previewHeading: "Podgląd",
        mealsToImport: {
            one: "{n} posiłek do zaimportowania",
            few: "{n} posiłki do zaimportowania",
            many: "{n} posiłków do zaimportowania",
            other: "{n} posiłków do zaimportowania",
        },
        kcalTotal: "{kcal} kcal łącznie",
        rowsSkipped: {
            one: "{n} pominięty wiersz",
            few: "{n} pominięte wiersze",
            many: "{n} pominiętych wierszy",
            other: "{n} pominiętych wierszy",
        },
        batchCount: {
            one: "{n} partia",
            few: "{n} partie",
            many: "{n} partii",
            other: "{n} partii",
        },
        datesReadAs: "Daty odczytane jako {format}; energia {conversion}.",
        energyConvertedNote: "przeliczona z kJ na kcal",
        energyReadAsKcal: "odczytana jako kcal",
        badDatesWarning: {
            one: "Pominięto {n} wiersz, bo jego daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            few: "Pominięto {n} wiersze, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            many: "Pominięto {n} wierszy, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
            other: "Pominięto {n} wierszy, bo ich daty nie udało się odczytać jako {format}{sample}. Wróć i ustaw format daty zgodny z Twoim plikiem.",
        },
        badDateSample: " (np. wiersz {line}: {value})",
        noTimeWarning: {
            one: "{n} wiersz ma datę, ale nie ma godziny — zostanie zapisany w południe.",
            few: "{n} wiersze mają datę, ale nie mają godziny — zostaną zapisane w południe.",
            many: "{n} wierszy ma datę, ale nie ma godziny — zostanie zapisanych w południe.",
            other: "{n} wierszy ma datę, ale nie ma godziny — zostanie zapisanych w południe.",
        },
        splitDatesCount: {
            one: "{n} data ma",
            few: "{n} daty mają",
            many: "{n} dat ma",
            other: "{n} dat ma",
        },
        splitDatesWarning:
            " więcej niż {max} posiłków (np. {date}), więc trzeba było rozdzielić je między osobne partie importu. Jeśli pod tą datą są dwa wpisy z dokładnie tym samym jedzeniem, rodzajem posiłku i makroskładnikami, jeden z nich może zostać pominięty jako duplikat, zamiast trafić do importu.",
        tableAbbr: {
            protein_g: "B",
            carbs_g: "W",
            fat_g: "T",
            fiber_g: "Bł",
            sugar_g: "Cuk",
            added_sugar_g: "Dod",
            saturated_fat_g: "Nas.",
            trans_fat_g: "Trans",
            alcohol_g: "Alk",
            caffeine_mg: "Kof",
            sodium_mg: "Na",
        },
        tableLine: "Wiersz",
        tableWhen: "Kiedy",
        tableMeal: "Posiłek",
        tableFood: "Produkt",
        tableProblem: "Problem",
        noNameFallback: "(bez nazwy — użyjemy rodzaju posiłku)",
        showingRows: "Wyświetlono {shown} z {total} wierszy",
        checkingRows: {
            one: "Sprawdzanie {n} wiersza…",
            few: "Sprawdzanie {n} wierszy…",
            many: "Sprawdzanie {n} wierszy…",
            other: "Sprawdzanie {n} wierszy…",
        },
        importingRows: {
            one: "Importowanie {n} wiersza…",
            few: "Importowanie {n} wierszy…",
            many: "Importowanie {n} wierszy…",
            other: "Importowanie {n} wierszy…",
        },
        batchProgress: "{label} (partia {done} z {total})",
        rowsRange: "Wiersze {a}–{b}: {msg}",
        preflightFailed: "Wstępne sprawdzenie nie powiodło się.",
        rowsWouldFail: {
            one: "{n} wiersz zakończy się błędem, np. wiersz {line}: {message}",
            few: "{n} wiersze zakończą się błędem, np. wiersz {line}: {message}",
            many: "{n} wierszy zakończy się błędem, np. wiersz {line}: {message}",
            other: "{n} wierszy zakończy się błędem, np. wiersz {line}: {message}",
        },
        importingEllipsis: "Importowanie…",
        importButton: {
            one: "Importuj {n} posiłek",
            few: "Importuj {n} posiłki",
            many: "Importuj {n} posiłków",
            other: "Importuj {n} posiłków",
        },
        backToMapping: "Wróć do dopasowania kolumn",
        importCompleteHeading: "Import zakończony",
        resultMealsImported: {
            one: "Zaimportowano {n} posiłek",
            few: "Zaimportowano {n} posiłki",
            many: "Zaimportowano {n} posiłków",
            other: "Zaimportowano {n} posiłków",
        },
        resultAlreadyLogged: {
            one: ", {n} już zapisany",
            few: ", {n} już zapisane",
            many: ", {n} już zapisanych",
            other: ", {n} już zapisanych",
        },
        resultFailed: {
            one: ", {n} nieudany",
            few: ", {n} nieudane",
            many: ", {n} nieudanych",
            other: ", {n} nieudanych",
        },
        resultSkipped: {
            one: ", {n} pominięty",
            few: ", {n} pominięte",
            many: ", {n} pominiętych",
            other: ", {n} pominiętych",
        },
        restartButton: "Zaimportuj kolejny plik",
        couldNotReadFile: "Nie udało się odczytać tego pliku: {msg}",
        noDataRows: "W tym pliku nie ma wierszy z danymi.",
        emailNotice:
            "Coś nie działa tak, jak powinno? Napisz na {email} i dołącz poniższe informacje — to wszystko, czego potrzeba do zdiagnozowania problemu.",
    },
};

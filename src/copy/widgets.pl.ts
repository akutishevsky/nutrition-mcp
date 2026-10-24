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
        title: "Realizacja celów",
        empty: "Brak danych o realizacji celów.",
        nothingLoggedFor: "Nie ma jeszcze wpisów z {date}.",
        thisDay: "tego dnia",
        mealsCount: {
            one: "{n} posiłek",
            few: "{n} posiłki",
            many: "{n} posiłków",
            other: "{n} posiłków",
        },
        waterCount: {
            one: "{n} wpis wody",
            few: "{n} wpisy wody",
            many: "{n} wpisów wody",
            other: "{n} wpisów wody",
        },
        weightLabel: "Waga",
        weightNoneNoTarget:
            "Nie ma jeszcze zapisanej wagi. Zapisz ją przez log_weight, by śledzić postępy.",
        weightNoneWithTarget:
            "Nie ma jeszcze zapisanej wagi. Zapisz ją przez log_weight, by śledzić postępy w drodze do celu {target}.",
        weightNoGoal:
            "Waga {reading} — brak celu. Ustaw go przez set_nutrition_goals, by widzieć tu postępy.",
        atTarget: "cel osiągnięty",
        toLose: "{amount} do zrzucenia",
        toGain: "{amount} do przybrania",
        lastLogged: "ostatni pomiar {date}",
        weightAria: "Waga {current}, cel {target}, {state}{metaSuffix}",
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

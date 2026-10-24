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
        eyebrow: "Import meals", // i18n:pending
        eyebrowWithFile: "Import meals · {file}", // i18n:pending
        stepsLabel: "Import steps", // i18n:pending
        stepAriaDone: "Step {i} of 4: {name}, completed", // i18n:pending
        stepAriaCurrent: "Step {i} of 4: {name}, current", // i18n:pending
        stepAriaUpcoming: "Step {i} of 4: {name}", // i18n:pending
        browseFiles: "Browse files", // i18n:pending
        dropAccept: ".csv or tab-separated text", // i18n:pending
        dropAria: "Choose a CSV file, or drag it here", // i18n:pending
        privacyNote:
            "The file is read here, in this panel. Its rows never pass through the chat — the assistant only gets a one-line summary when the import finishes.", // i18n:pending
        binaryFile:
            "Could not read that file: this looks like a binary file (an Excel workbook?), not CSV text. Export it as CSV and try again.", // i18n:pending
        columnsHeading: "Columns", // i18n:pending
        fieldsMatched: {
            one: "{n} of {total} field matched",
            other: "{n} of {total} fields matched",
        }, // i18n:pending
        tableFieldHead: "Field", // i18n:pending
        tableColumnHead: "Column in your file", // i18n:pending
        tableRow1Head: "Row 1 value", // i18n:pending
        badgeNew: "new", // i18n:pending
        colNumber: "Col {n}", // i18n:pending
        colNumberAuto: "Col {n} · auto", // i18n:pending
        colNumberManual: "Col {n} · set by you", // i18n:pending
        row1Empty: "row 1 empty", // i18n:pending
        alsoUsed: "also {field}", // i18n:pending
        sameColumn: "Same column as {fields}", // i18n:pending
        columnForAria: "Column for {field}", // i18n:pending
        mapRowAria: "{field}{required}: {column}{sample}", // i18n:pending
        requiredAria: ", required", // i18n:pending
        columnAria: "column {n}, {name}", // i18n:pending
        notInFileAria: "not in this file", // i18n:pending
        sampleAria: ", {sample}", // i18n:pending
        howRead: "How values are read", // i18n:pending
        appExport: "{app} export", // i18n:pending
        tileMeals: { one: "meal to import", other: "meals to import" }, // i18n:pending
        tileKcal: "kcal total", // i18n:pending
        tileSkipped: { one: "row skipped", other: "rows skipped" }, // i18n:pending
        tileBatches: { one: "batch", other: "batches" }, // i18n:pending
        rowsHeading: "Rows", // i18n:pending
        scrollLeft: "Scroll table left", // i18n:pending
        scrollRight: "Scroll table right", // i18n:pending
        previewRegionAria: "Preview of the rows to import", // i18n:pending
        expandAllDays: "Expand all days", // i18n:pending
        collapseAllDays: "Collapse all days", // i18n:pending
        dayRows: { one: "{n} row", other: "{n} rows" }, // i18n:pending
        dayRowsKcal: {
            one: "{n} row · {kcal} kcal",
            other: "{n} rows · {kcal} kcal",
        }, // i18n:pending
        noTimeShort: "no time", // i18n:pending
        lineN: "Line {n}", // i18n:pending
        rowCardAria: "Line {line}, {when}, {meal}, {food}, {kcal}", // i18n:pending
        noMealAria: "no meal", // i18n:pending
        noKcalAria: "no calories", // i18n:pending
        noRowsToImport: "No rows to import with the current mapping.", // i18n:pending
        importOff:
            "Import is off: this host does not let this view write to your log. Ask Claude to import the file instead.", // i18n:pending
        backBusy: "Back is unavailable while batches are being sent.", // i18n:pending
        progressAria: "Import progress, batches", // i18n:pending
        failedRowsAria: "Rows that failed", // i18n:pending
        toldOnly: "The assistant was told only: {summary}", // i18n:pending
        liveStep: "Step {i} of 4, {name}.", // i18n:pending
        liveMapped: "{field}: {column}", // i18n:pending
        liveImporting: {
            one: "Importing. {n} batch.",
            other: "Importing. {n} batches.",
        }, // i18n:pending
        liveDone: {
            one: "Import complete. {n} meal imported.",
            other: "Import complete. {n} meals imported.",
        }, // i18n:pending
        liveNoWrite: "Preflight check failed. Nothing was written.", // i18n:pending
        liveFileError: "Could not use that file.", // i18n:pending
    },
};

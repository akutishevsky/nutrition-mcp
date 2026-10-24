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
        empty: "W tym okresie nie ma jeszcze pomiarów wagi.",
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

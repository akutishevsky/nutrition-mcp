import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_UK: WidgetStrings = {
    macros: {
        labels: {
            calories: "Калорії",
            protein_g: "Білки",
            carbs_g: "Вуглеводи",
            fat_g: "Жири",
            sugar_g: "Цукор",
            added_sugar_g: "Доданий цукор",
            saturated_fat_g: "Насичені жири",
            trans_fat_g: "Трансжири",
            alcohol_g: "Алкоголь",
            caffeine_mg: "Кофеїн",
            sodium_mg: "Натрій",
            fiber_g: "Клітковина",
            water_ml: "Вода",
        },
        noGoalSet: "без цілі",
        atLimit: "на межі",
        floorUnder: "лишилося",
        ceilingUnder: "до ліміту",
        over: "перевищено",
        limitPrefix: "ліміт",
        ofPrefix: "з",
        drinkLabels: { us: "станд. порції (США)", uk: "брит. од." },
        units: {
            kcal: "ккал",
            g: "г",
            mg: "мг",
            ml: "мл",
            L: "л",
            kg: "кг",
            lb: "фн",
        },
        noneLogged: "немає записів",
        notRecorded: "не записано",
        caloriesToday: "Калорії сьогодні",
        caloriesOn: "Калорії · {date}",
        tapHint: "Торкнися показника, щоб побачити страви",
        showMealsContributed: "Показати, з яких страв це складається.",
        byMealTitle: "{label} за стравами",
        closeBreakdown: "Закрити деталізацію",
        noMealsContributed: "У записаних стравах немає показника «{label}».",
        untitledMeal: "Страва без назви",
        moreMeals: {
            one: "+ ще {n} менша страва",
            few: "+ ще {n} менші страви",
            many: "+ ще {n} менших страв",
            other: "+ ще {n} менших страв",
        },
        moreMealsAtLeast: {
            one: "+ ще щонайменше {n} менша страва",
            few: "+ ще щонайменше {n} менші страви",
            many: "+ ще щонайменше {n} менших страв",
            other: "+ ще щонайменше {n} менших страв",
        },
        moreMealsMaybe: "+ можливо, є ще менші страви",
        ingredientCount: {
            one: "{n} інгредієнт",
            few: "{n} інгредієнти",
            many: "{n} інгредієнтів",
            other: "{n} інгредієнтів",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "власне",
        sourceEst: "оцін.",
        sourceMixed: "змішане",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "штрихкод",
        sourceDataType: "тип даних",
        sourceAria: "Джерело: {source}",
        sourceDetailsAria: "Показати деталі джерела",
    },
    bridge: {
        settingsFooter:
            "Ці віджети можна будь-коли ввімкнути або вимкнути — просто попроси змінити налаштування.",
        connectFailed: "Віджет не зміг під’єднатися до застосунку.",
    },
    nutritionSummary: {
        title: "Зведення харчування",
        loading: "Завантаження зведення…",
        empty: "За цей період немає записаних страв чи води.",
        caloriesPerDay: "Калорії / день",
        chartAriaLabel: "Калорії за день за обраний період",
        avg: "сер.",
        goal: "ціль",
        dailyAvgLoggedDays: "Середнє за день · дні із записами",
        total: "Усього",
        daysLogged: {
            one: "{n} день із записом",
            few: "{n} дні із записами",
            many: "{n} днів із записами",
            other: "{n} днів із записами",
        },
        daysOfLogged: "{logged} із {span} днів із записами",
        months: [
            "січ.",
            "лют.",
            "бер.",
            "квіт.",
            "трав.",
            "черв.",
            "лип.",
            "серп.",
            "вер.",
            "жовт.",
            "лист.",
            "груд.",
        ],
    },
    goalProgress: {
        loading: "Завантаження прогресу…",
        title: "Прогрес до цілей",
        empty: "Немає даних про прогрес.",
        nothingLoggedFor: "За {date} ще немає записів.",
        thisDay: "цей день",
        mealsCount: {
            one: "{n} страва",
            few: "{n} страви",
            many: "{n} страв",
            other: "{n} страв",
        },
        waterCount: {
            one: "{n} запис води",
            few: "{n} записи води",
            many: "{n} записів води",
            other: "{n} записів води",
        },
        weightLabel: "Вага",
        weightNoneNoTarget:
            "Ваги ще не записано. Запиши її через log_weight, щоб стежити за прогресом.",
        weightNoneWithTarget:
            "Ваги ще не записано. Запиши її через log_weight, щоб стежити, як наближаєшся до цілі {target}.",
        weightNoGoal:
            "Вага {reading} — ціль не встановлено. Встанови її через set_nutrition_goals, щоб бачити тут прогрес.",
        atTarget: "ціль досягнуто",
        toLose: "лишилося скинути {amount}",
        toGain: "лишилося набрати {amount}",
        lastLogged: "востаннє записано {date}",
        weightAria: "Вага {current}, ціль {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Страву записано",
        titleUpdated: "Страву оновлено",
        addedKcal: "+{kcal} ккал",
    },
    trends: {
        loading: "Завантаження трендів…",
        title: "Тренди",
        empty: "За цей період ще немає записаних страв чи води.",
        avgUnder: "нижче цілі",
        loggedOfTotal: "{logged}/{total} днів із записами",
        caloriesOverRange: "Калорії за день за останні {range} днів",
        windowAriaLabel: "Період тренду",
        rangeDaysAriaLabel: "{n} днів",
        avgAllDays: "Сер. за {range} дн. · усі дні",
        segWeek: "Тиж.",
        segMonth: "Міс.",
        segQuarter: "Кв.",
        segYear: "Рік",
        segDays: "Дні",
        segWeekAria: "Показати середні за тижнями",
        segMonthAria: "Показати середні за місяцями",
        segQuarterAria: "Показати середні за кварталами",
        segYearAria: "Показати середні за роками",
        segDaysAria: "Показати денні тренди",
        periodTitleWeek: "Середні за тиждень",
        periodTitleMonth: "Середні за місяць",
        periodTitleQuarter: "Середні за квартал",
        periodTitleYear: "Середні за рік",
        perLoggedDay: "на день із записами",
        daysLogged: "{logged}/{total} дн.",
        onTarget: "у цілі {k}/{n}",
        possiblyIncomplete: {
            one: "{n} день, можливо, неповний",
            few: "{n} дні, можливо, неповні",
            many: "{n} днів, можливо, неповні",
            other: "{n} днів, можливо, неповні",
        },
        partial: "триває",
        nothingLogged: "нічого не записано",
        targetsChanged: "цілі змінено протягом періоду",
        targetsAssumed: "цілі до {date} не збережено",
        noTargets: "Цілі не встановлено — лише середні.",
        quarter: "{q} кв. {year}",
    },
    weightTrends: {
        loading: "Завантаження динаміки ваги…",
        empty: "За цей період ваги ще не записано.",
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
        loading: "Підготовка імпорту…",
        stepFile: "Файл",
        stepMap: "Зіставлення колонок",
        stepPreview: "Перегляд",
        stepImport: "Імпорт",
        fieldLabels: {
            logged_at: "Дата / час",
            description: "Назва страви",
            meal_type: "Прийом їжі",
            calories: "Калорії",
            protein_g: "Білки (г)",
            carbs_g: "Вуглеводи (г)",
            fat_g: "Жири (г)",
            fiber_g: "Клітковина (г)",
            sugar_g: "Цукор, загальний (г)",
            added_sugar_g: "Доданий цукор (г)",
            saturated_fat_g: "Насичені жири (г)",
            trans_fat_g: "Трансжири (г)",
            alcohol_g: "Алкоголь (г)",
            caffeine_mg: "Кофеїн (мг)",
            sodium_mg: "Натрій (мг)",
            notes: "Примітки",
            time: "Час (окрема колонка)",
            deleted: "Позначка видалення",
            source_id: "ID страви (з нашого експорту)",
            timezone: "Часовий пояс (з нашого експорту)",
        },
        chooseExportHeading: "Обери свій експорт",
        noToolsWarning:
            "Цей застосунок не дає віджету записувати дані у твій щоденник. Попроси Claude імпортувати файл — він зробить це напряму.",
        emailFallback: "Якщо й через Claude не вийде, напиши на {email}.",
        tzWarning:
            "Твій часовий пояс не встановлено, тож час читатиметься як UTC і записи можуть потрапити не на той день. Спершу попроси Claude встановити часовий пояс.",
        dropChoose: "Обери CSV-файл",
        dropOr: "або перетягни його сюди",
        recognizedHint:
            "Експорти з MyFitnessPal, Cronometer, Lose It! і MacroFactor розпізнаються автоматично. Нічого не збережеться, доки ти не підтвердиш.",
        dateMapHint:
            "Вкажи вище колонку з датою, щоб побачити, як буде перетворено значення з твого файлу.",
        dateNoneHint: "У цій колонці немає дат.",
        dateUnreadable:
            "{raw} → не читається як {format}, тож такі рядки буде пропущено",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Вкажи вище колонку з калоріями, щоб побачити, як буде перетворено значення з твого файлу.",
        energyNoneHint: "У цій колонці немає чисел.",
        energyConverted: "{v} кДж → {kcal} ккал",
        energyNoConversion: "{v} ккал → {v} ккал (без конвертації)",
        dateAmbiguousWarning:
            "Не вдалося визначити формат дати: дати в цьому файлі однаково читаються і як «спершу день», і як «спершу місяць». Підтверди, у якому форматі експортує твій застосунок: якщо помилишся, прийоми їжі потраплять не на той день, і жодної помилки ти не побачиш.",
        dateFormatLabel: "Формат дати в цьому файлі",
        dateFormatYmd: "Рік-місяць-день",
        dateFormatDmy: "День/місяць/рік",
        dateFormatMdy: "Місяць/день/рік",
        energyUnitLabel: "Одиниця енергії в колонці калорій",
        energyUnitKcal: "Калорії",
        energyUnitKj: "Кілоджоулі",
        mapColumnsHeading: "Зіставлення колонок",
        rowsCount: {
            one: "{n} рядок",
            few: "{n} рядки",
            many: "{n} рядків",
            other: "{n} рядків",
        },
        columnsCount: {
            one: "{n} колонка",
            few: "{n} колонки",
            many: "{n} колонок",
            other: "{n} колонок",
        },
        delimiterLabel: "роздільник",
        tabLabel: "табуляція",
        notInFile: "(немає в цьому файлі)",
        columnFallback: "колонка {n}",
        caffeineGramsNotice:
            "Колонка кофеїну в цьому файлі ({column}) — у грамах, а кофеїн зберігається в міліграмах, тому поле «Кофеїн» не зіставлено. Інакше там, де на етикетці 180 мг, записалося б 0,18. Повторний імпорт того самого файлу згодом це поле не заповнить: ці рядки вже буде записано, і їх буде пропущено як дублікати. Якщо заголовок хибний і значення насправді в міліграмах, обери цю колонку вище; якщо вони справді в грамах, помнож їх на 1000 у файлі до імпорту, а не після.",
        alcoholNotice:
            "У цьому файлі є колонка алкоголю ({column}), але для цього акаунта відстеження алкоголю вимкнено, тож її не буде імпортовано. Повторний імпорт того самого файлу згодом це поле не заповнить: ці рядки вже буде записано, і їх буде пропущено як дублікати. Щоб зберегти ці дані, перед імпортом попроси Claude увімкнути відстеження алкоголю (set_alcohol_tracking).",
        sampleValue: "напр. {sample}",
        sourceAppLabel: "Застосунок-джерело (необов’язково)",
        sourceAppHint:
            "Потрібен, щоб підписати рядки без власної назви страви.",
        previewButton: "Переглянути імпорт",
        chooseAnotherButton: "Обрати інший файл",
        previewHeading: "Попередній перегляд",
        mealsToImport: {
            one: "{n} страва для імпорту",
            few: "{n} страви для імпорту",
            many: "{n} страв для імпорту",
            other: "{n} страв для імпорту",
        },
        kcalTotal: "{kcal} ккал загалом",
        rowsSkipped: {
            one: "{n} рядок пропущено",
            few: "{n} рядки пропущено",
            many: "{n} рядків пропущено",
            other: "{n} рядків пропущено",
        },
        batchCount: {
            one: "{n} пакет",
            few: "{n} пакети",
            many: "{n} пакетів",
            other: "{n} пакетів",
        },
        datesReadAs: "Дати читаються як {format}; енергія {conversion}.",
        energyConvertedNote: "переведена з кДж у ккал",
        energyReadAsKcal: "читається як ккал",
        badDatesWarning: {
            one: "{n} рядок пропущено: його дату не вдалося прочитати як {format}{sample}. Повернися й обери формат дати, що відповідає твоєму файлу.",
            few: "{n} рядки пропущено: їхню дату не вдалося прочитати як {format}{sample}. Повернися й обери формат дати, що відповідає твоєму файлу.",
            many: "{n} рядків пропущено: їхню дату не вдалося прочитати як {format}{sample}. Повернися й обери формат дати, що відповідає твоєму файлу.",
            other: "{n} рядків пропущено: їхню дату не вдалося прочитати як {format}{sample}. Повернися й обери формат дати, що відповідає твоєму файлу.",
        },
        badDateSample: " (напр. рядок {line}: {value})",
        noTimeWarning: {
            one: "{n} рядок має дату без часу — його буде записано опівдні.",
            few: "{n} рядки мають дату без часу — їх буде записано опівдні.",
            many: "{n} рядків мають дату без часу — їх буде записано опівдні.",
            other: "{n} рядків мають дату без часу — їх буде записано опівдні.",
        },
        splitDatesCount: {
            one: "{n} дата має",
            few: "{n} дати мають",
            many: "{n} дат мають",
            other: "{n} дат мають",
        },
        splitDatesWarning:
            " понад {max} страв (напр. {date}), тож їх довелося розділити на окремі пакети імпорту. Якщо цього дня є два записи з однаковою стравою, типом прийому їжі та макронутрієнтами, один із них може бути пропущено як дублікат, а не імпортовано.",
        tableAbbr: {
            protein_g: "Б",
            carbs_g: "В",
            fat_g: "Ж",
            fiber_g: "Клітк",
            sugar_g: "Цук",
            added_sugar_g: "Дод",
            saturated_fat_g: "Нас.",
            trans_fat_g: "Транс",
            alcohol_g: "Алк",
            caffeine_mg: "Коф",
            sodium_mg: "Na",
        },
        tableLine: "Рядок",
        tableWhen: "Коли",
        tableMeal: "Прийом їжі",
        tableFood: "Страва",
        tableProblem: "Проблема",
        noNameFallback: "(без назви — підпишемо назвою прийому їжі)",
        showingRows: "Показано {shown} з {total} рядків",
        checkingRows: {
            one: "Перевірка {n} рядка…",
            few: "Перевірка {n} рядків…",
            many: "Перевірка {n} рядків…",
            other: "Перевірка {n} рядків…",
        },
        importingRows: {
            one: "Імпортування {n} рядка…",
            few: "Імпортування {n} рядків…",
            many: "Імпортування {n} рядків…",
            other: "Імпортування {n} рядків…",
        },
        batchProgress: "{label} (пакет {done} з {total})",
        rowsRange: "Рядки {a}–{b}: {msg}",
        preflightFailed: "Попередня перевірка не вдалася.",
        rowsWouldFail: {
            one: "{n} рядок не вдасться імпортувати, напр. рядок {line}: {message}",
            few: "{n} рядки не вдасться імпортувати, напр. рядок {line}: {message}",
            many: "{n} рядків не вдасться імпортувати, напр. рядок {line}: {message}",
            other: "{n} рядків не вдасться імпортувати, напр. рядок {line}: {message}",
        },
        importingEllipsis: "Імпортування…",
        importButton: {
            one: "Імпортувати {n} страву",
            few: "Імпортувати {n} страви",
            many: "Імпортувати {n} страв",
            other: "Імпортувати {n} страв",
        },
        backToMapping: "Назад до зіставлення",
        importCompleteHeading: "Імпорт завершено",
        resultMealsImported: {
            one: "{n} страву імпортовано",
            few: "{n} страви імпортовано",
            many: "{n} страв імпортовано",
            other: "{n} страв імпортовано",
        },
        resultAlreadyLogged: {
            one: ", {n} вже записано",
            few: ", {n} вже записано",
            many: ", {n} вже записано",
            other: ", {n} вже записано",
        },
        resultFailed: {
            one: ", {n} з помилкою",
            few: ", {n} з помилками",
            many: ", {n} з помилками",
            other: ", {n} з помилками",
        },
        resultSkipped: {
            one: ", {n} пропущено",
            few: ", {n} пропущено",
            many: ", {n} пропущено",
            other: ", {n} пропущено",
        },
        restartButton: "Імпортувати інший файл",
        couldNotReadFile: "Не вдалося прочитати файл: {msg}",
        noDataRows: "У файлі немає рядків із даними.",
        emailNotice:
            "Щось не так? Напиши на {email} і додай рядки нижче — цього вистачить, щоб знайти причину.",
    },
};

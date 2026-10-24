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
        daysLogged: {
            one: "{n} день із записом",
            few: "{n} дні із записами",
            many: "{n} днів із записами",
            other: "{n} днів із записами",
        },
        daysOfLogged: "{logged} із {span} днів із записами",
        periodToday: "Today", // i18n:pending
        periodPastDay: "Past day", // i18n:pending
        showMore: "Show more", // i18n:pending
        showLess: "Show less", // i18n:pending
        collapseAll: "Collapse all", // i18n:pending
        ofGoal: "of {goal} kcal", // i18n:pending
        avgOfGoal: "avg/day of {goal} kcal", // i18n:pending
        left: "{amount} left", // i18n:pending
        over: "{amount} over", // i18n:pending
        toGo: "{amount} to go", // i18n:pending
        above: "{amount} above", // i18n:pending
        onTarget: "on target", // i18n:pending
        goalMet: "goal met", // i18n:pending
        noLimit: "no limit", // i18n:pending
        none: "none", // i18n:pending
        notRecorded: "Not recorded", // i18n:pending
        leftToday: "{amount} left today", // i18n:pending
        overToday: "{amount} over today", // i18n:pending
        leftThatDay: "{amount} left that day", // i18n:pending
        overThatDay: "{amount} over that day", // i18n:pending
        underGoal: "{amount} under goal", // i18n:pending
        overGoal: "{amount} over goal", // i18n:pending
        peak: "peak {amount}", // i18n:pending
        mealsCount: {
            one: "{n} meal", // i18n:pending
            other: "{n} meals", // i18n:pending
        },
        emptyToday: "No meals logged today yet", // i18n:pending
        emptyThatDay: "No meals logged that day", // i18n:pending
        emptyRange: "No meals logged in this range", // i18n:pending
        statEatenSoFar: "Eaten so far", // i18n:pending
        statEaten: "Eaten", // i18n:pending
        statRemaining: "Remaining", // i18n:pending
        statOverGoal: "Over goal", // i18n:pending
        statMeals: "Meals", // i18n:pending
        statLogged: "logged", // i18n:pending
        statAvgDay: "Avg / day", // i18n:pending
        statPeakDay: "Peak day", // i18n:pending
        statLoggedDays: "Logged", // i18n:pending
        statOfDays: "of {n} days", // i18n:pending
        gaugeAriaToday:
            "{eaten} of {goal} kcal today, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaThatDay:
            "{eaten} of {goal} kcal that day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaRange:
            "Average {eaten} of {goal} kcal a day, {pct}% of goal, {status}.", // i18n:pending
        gaugeAriaNoGoal: "{eaten} kcal.", // i18n:pending
        gaugeAriaMeals: "Meals: {list}.", // i18n:pending
        caloriesByDay: "Calories by day", // i18n:pending
        mealTypes: {
            breakfast: "Breakfast", // i18n:pending
            lunch: "Lunch", // i18n:pending
            dinner: "Dinner", // i18n:pending
            snack: "Snack", // i18n:pending
        },
        items: {
            one: "{n} item", // i18n:pending
            other: "{n} items", // i18n:pending
        },
        totalOnlyShort: "total only", // i18n:pending
        totalOnly: "Logged as a total, without ingredients.", // i18n:pending
        goalLine: "goal", // i18n:pending
        byDay: "By day", // i18n:pending
        byDayPartial: "By day · recorded on {rec} of {logged} logged days", // i18n:pending
        byMealCount: {
            one: "By meal · {n} meal", // i18n:pending
            other: "By meal · {n} meals", // i18n:pending
        },
        notRecordedCount: {
            one: "{n} not recorded", // i18n:pending
            other: "{n} not recorded", // i18n:pending
        },
        notRecordedToday: "{label} wasn't recorded for today's meals.", // i18n:pending
        notRecordedThatDay: "{label} wasn't recorded for that day's meals.", // i18n:pending
        notRecordedRange: "{label} wasn't recorded on any day in this range.", // i18n:pending
        waterToday:
            "Water is logged on its own, not with meals: {amount} today.", // i18n:pending
        waterThatDay:
            "Water is logged on its own, not with meals: {amount} that day.", // i18n:pending
        waterRange: "Water is logged on its own, not with meals.", // i18n:pending
        noneInToday: "{label}: none in today's meals.", // i18n:pending
        noneInThatDay: "{label}: none in that day's meals.", // i18n:pending
        noneInRange: "{label}: none in the listed meals.", // i18n:pending
        topMeals: "Top meals", // i18n:pending
        dailyAverages: {
            one: "Daily averages · {n} logged day", // i18n:pending
            other: "Daily averages · {n} logged days", // i18n:pending
        },
        selected: "Selected {tip}", // i18n:pending
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
        logged: "logged", // i18n:pending
        edited: "edited", // i18n:pending
        thisMeal: "{amount} this meal", // i18n:pending
        statThisMeal: "This meal", // i18n:pending
        statToday: "Today", // i18n:pending
        statLeftToday: "Left today", // i18n:pending
        statLeftThatDay: "Left that day", // i18n:pending
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
        title: "Вага",
        empty: "За цей період ваги ще не записано.",
        rangeEmpty:
            "За останні {range} днів зважувань немає. Спробуй довший період.",
        windowAriaLabel: "Період тренду",
        rangeAriaLabel: "Останні {n} днів",
        chartAriaLabel: "Вага з {from} по {to}, останнє значення {latest}",
        trendChartAriaLabel:
            "Вага з {from} по {to} зі згладженою лінією тренду, останнє значення {latest}",
        latest: "Останнє",
        needTwo: "потрібно 2+ зважування",
        sinceDate: "{change} з {date}",
        weighIns: {
            one: "{n} зважування",
            few: "{n} зважування",
            many: "{n} зважувань",
            other: "{n} зважувань",
        },
        atTarget: "ціль досягнуто",
        toLose: "лишилося скинути {amount}",
        toGain: "лишилося набрати {amount}",
        target: "Ціль {value}",
        noTarget: "Ціль не встановлено",
        trend: "Тренд",
        scaleToday: "Ваги сьогодні {value}",
        perWeek: "{amount}/тиж.",
        rateAriaLabel:
            "Тренд змінюється на {amount} за тиждень протягом останніх 2 тижнів",
        rateTwoWeeks: "темп за 2 тиж.",
        range1y: "1 р.",
        rangeAll: "Усе",
        range1yAriaLabel: "Останній рік",
        rangeAllAriaLabel: "Уся історія",
        sinceMonth: "{change} з {date}",
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

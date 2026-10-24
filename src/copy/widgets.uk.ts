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
        averagesOnly: "Only the averages and goals are available in this view.", // i18n:pending
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
            overTotal: " — largest source: {name}, {x} in total (×{n}).", // i18n:pending
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

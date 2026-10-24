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
            "Once a meal or water is logged, this shows what is over, what is close and what is still to go.", // i18n:pending
        emptyPast: "There is nothing to compare with the goals for that day.", // i18n:pending
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
        leadK: "Biggest source:", // i18n:pending
        leadV: "{name} — {value} {nutrient}", // i18n:pending
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
};

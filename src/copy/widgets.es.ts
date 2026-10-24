import type { WidgetStrings } from "./widgets.js";

export const WIDGET_STRINGS_ES: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calorías",
            protein_g: "Proteínas",
            carbs_g: "Carbohidratos",
            fat_g: "Grasas",
            sugar_g: "Azúcar",
            added_sugar_g: "Azúcar añadido",
            saturated_fat_g: "Grasas saturadas",
            trans_fat_g: "Grasas trans",
            alcohol_g: "Alcohol",
            caffeine_mg: "Cafeína",
            sodium_mg: "Sodio",
            fiber_g: "Fibra",
            water_ml: "Agua",
        },
        noGoalSet: "sin objetivo",
        atLimit: "en el límite",
        floorUnder: "restantes",
        ceilingUnder: "por debajo",
        over: "de más",
        limitPrefix: "límite",
        ofPrefix: "de",
        drinkLabels: {
            us: "bebidas estándar (EE. UU.)",
            uk: "unidades (R. U.)",
        },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "nada registrado",
        notRecorded: "sin registrar",
        caloriesToday: "Calorías de hoy",
        caloriesOn: "Calorías · {date}",
        tapHint: "Toca un valor para ver qué comidas lo aportan",
        showMealsContributed: "Ver qué comidas lo aportaron.",
        byMealTitle: "{label} por comida",
        closeBreakdown: "Cerrar desglose",
        noMealsContributed: "Ninguna comida registrada aportó {label}.",
        untitledMeal: "Comida sin nombre",
        moreMeals: {
            one: "+ {n} comida más pequeña",
            other: "+ {n} comidas más pequeñas",
        },
        moreMealsAtLeast: {
            one: "+ al menos {n} comida más pequeña",
            other: "+ al menos {n} comidas más pequeñas",
        },
        moreMealsMaybe: "+ quizá otras comidas más pequeñas",
        ingredientCount: {
            one: "{n} ingrediente",
            other: "{n} ingredientes",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "tuya",
        sourceEst: "est.",
        sourceMixed: "mixto",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "código de barras",
        sourceDataType: "tipo de dato",
        sourceAria: "Fuente: {source}",
        sourceDetailsAria: "Mostrar detalles de la fuente",
    },
    bridge: {
        settingsFooter:
            "Puedes activar o desactivar estos widgets cuando quieras: solo tienes que pedir que se actualice tu configuración.",
        connectFailed: "Este panel no pudo conectarse con la app.",
    },
    nutritionSummary: {
        title: "Resumen nutricional",
        loading: "Cargando tu resumen nutricional…",
        empty: "No hay comidas ni agua registradas en este periodo.",
        caloriesPerDay: "Calorías / día",
        chartAriaLabel: "Calorías por día en el periodo seleccionado",
        avg: "media",
        goal: "objetivo",
        dailyAvgLoggedDays: "Media diaria · días registrados",
        total: "Total",
        daysLogged: {
            one: "{n} día registrado",
            other: "{n} días registrados",
        },
        daysOfLogged: "{logged} de {span} días registrados",
        months: [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
        ],
    },
    goalProgress: {
        loading: "Cargando el progreso de tus objetivos…",
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
        titleLogged: "Comida registrada",
        titleUpdated: "Comida actualizada",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        loading: "Cargando tus tendencias…",
        title: "Tendencias",
        empty: "Aún no hay comidas ni agua registradas en este periodo.",
        avgUnder: "por debajo",
        loggedOfTotal: "{logged}/{total} días registrados",
        caloriesOverRange: "Calorías por día en los últimos {range} días",
        windowAriaLabel: "Periodo de la tendencia",
        rangeDaysAriaLabel: "{n} días",
        avgAllDays: "media de {range} días · todos los días",
        segWeek: "Sem.",
        segMonth: "Mes",
        segQuarter: "Trim.",
        segYear: "Año",
        segDays: "Días",
        segWeekAria: "Mostrar medias semanales",
        segMonthAria: "Mostrar medias mensuales",
        segQuarterAria: "Mostrar medias trimestrales",
        segYearAria: "Mostrar medias anuales",
        segDaysAria: "Mostrar tendencias diarias",
        periodTitleWeek: "Medias semanales",
        periodTitleMonth: "Medias mensuales",
        periodTitleQuarter: "Medias trimestrales",
        periodTitleYear: "Medias anuales",
        perLoggedDay: "por día registrado",
        daysLogged: "{logged}/{total} días",
        onTarget: "en objetivo {k}/{n}",
        possiblyIncomplete: {
            one: "{n} posiblemente incompleto",
            other: "{n} posiblemente incompletos",
        },
        partial: "en curso",
        nothingLogged: "nada registrado",
        targetsChanged: "objetivos cambiados en el periodo",
        targetsAssumed: "objetivos anteriores al {date} sin registrar",
        noTargets: "Sin objetivos: solo medias.",
        quarter: "T{q} {year}",
    },
    weightTrends: {
        loading: "Cargando la evolución de tu peso…",
        title: "Peso",
        empty: "Aún no hay pesos registrados en este periodo.",
        rangeEmpty:
            "No hay pesajes en los últimos {range} días. Prueba con un periodo más amplio.",
        windowAriaLabel: "Periodo de la tendencia",
        rangeAriaLabel: "Últimos {n} días",
        chartAriaLabel: "Peso del {from} al {to}, último: {latest}",
        trendChartAriaLabel:
            "Peso del {from} al {to} con línea de tendencia suavizada, último: {latest}",
        latest: "Último",
        needTwo: "se necesitan al menos 2 pesajes",
        sinceDate: "{change} desde {date}",
        weighIns: { one: "{n} pesaje", other: "{n} pesajes" },
        atTarget: "objetivo alcanzado",
        toLose: "{amount} por perder",
        toGain: "{amount} por ganar",
        target: "Objetivo {value}",
        noTarget: "Sin objetivo",
        trend: "Tendencia",
        scaleToday: "Báscula hoy {value}",
        perWeek: "{amount}/sem",
        rateAriaLabel:
            "La tendencia cambia {amount} por semana en las últimas 2 semanas",
        rateTwoWeeks: "ritmo 2 sem",
        range1y: "1 año",
        rangeAll: "Todo",
        range1yAriaLabel: "Último año",
        rangeAllAriaLabel: "Todo el historial",
        sinceMonth: "{change} desde {date}",
    },
    importMeals: {
        loading: "Preparando la importación…",
        stepFile: "Archivo",
        stepMap: "Asignar columnas",
        stepPreview: "Vista previa",
        stepImport: "Importar",
        fieldLabels: {
            logged_at: "Fecha / hora",
            description: "Nombre del alimento",
            meal_type: "Tipo de comida",
            calories: "Calorías",
            protein_g: "Proteínas (g)",
            carbs_g: "Carbohidratos (g)",
            fat_g: "Grasas (g)",
            fiber_g: "Fibra (g)",
            sugar_g: "Azúcares totales (g)",
            added_sugar_g: "Azúcares añadidos (g)",
            saturated_fat_g: "Grasas saturadas (g)",
            trans_fat_g: "Grasas trans (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Cafeína (mg)",
            sodium_mg: "Sodio (mg)",
            notes: "Notas",
            time: "Hora (columna aparte)",
            deleted: "Marca de eliminado",
            source_id: "ID de comida (de nuestra exportación)",
            timezone: "Zona horaria (de nuestra exportación)",
        },
        chooseExportHeading: "Elige el archivo exportado",
        noToolsWarning:
            "Esta app no permite que este panel guarde datos en tu registro. Pídele a Claude que importe el archivo: puede hacerlo directamente.",
        emailFallback:
            "Si pedírselo a Claude tampoco funciona, escribe a {email}.",
        tzWarning:
            "Tu zona horaria no está configurada, así que las horas se leerán en UTC y podrían caer en el día equivocado. Pídele a Claude que configure primero tu zona horaria.",
        dropChoose: "Elige un archivo CSV",
        dropOr: "o arrástralo aquí",
        recognizedHint:
            "Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor se reconocen automáticamente. No se guarda nada hasta que confirmes.",
        dateMapHint:
            "Asigna arriba una columna de fecha para ver cómo se convierte un valor de tu archivo.",
        dateNoneHint: "Esa columna no contiene fechas.",
        dateUnreadable:
            "{raw} → no se puede leer como {format}, así que se omitirán las filas como esta",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Asigna arriba una columna de calorías para ver cómo se convierte un valor de tu archivo.",
        energyNoneHint: "Esa columna no contiene números.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (sin conversión)",
        dateAmbiguousWarning:
            "No se pudo determinar el formato de fecha de este archivo, porque sus fechas pueden leerse tanto con el día primero como con el mes primero. Confirma cuál usa tu app al exportar: si eliges mal, las comidas se registrarán en el día equivocado sin que aparezca ningún error.",
        dateFormatLabel: "Formato de fecha en este archivo",
        dateFormatYmd: "Año-Mes-Día",
        dateFormatDmy: "Día/Mes/Año",
        dateFormatMdy: "Mes/Día/Año",
        energyUnitLabel: "Unidad de energía de la columna de calorías",
        energyUnitKcal: "Calorías",
        energyUnitKj: "Kilojulios",
        mapColumnsHeading: "Asignar columnas",
        rowsCount: { one: "{n} fila", other: "{n} filas" },
        columnsCount: { one: "{n} columna", other: "{n} columnas" },
        delimiterLabel: "separador",
        tabLabel: "tabulación",
        notInFile: "(no está en este archivo)",
        columnFallback: "columna {n}",
        caffeineGramsNotice:
            "La columna de cafeína de este archivo ({column}) está en gramos, pero la cafeína se guarda en miligramos, así que el campo Cafeína quedó sin asignar. Si la asignaras, se registraría 0,18 donde la etiqueta dice 180 mg. Si vuelves a importar el mismo archivo más tarde, ese dato no se añadirá: esas filas ya estarán registradas y se omitirán como duplicadas. Si el encabezado está mal etiquetado y los valores son en realidad miligramos, selecciónala arriba; si de verdad son gramos, multiplícalos por 1000 en el archivo antes de importar, no después.",
        alcoholNotice:
            "Este archivo tiene una columna de alcohol ({column}), pero el seguimiento de alcohol está desactivado en esta cuenta, así que no se importará. Si vuelves a importar el mismo archivo más tarde, ese dato no se añadirá: esas filas ya estarán registradas y se omitirán como duplicadas. Para conservar estos datos, pídele a Claude que active el seguimiento de alcohol (set_alcohol_tracking) antes de importar.",
        sampleValue: "p. ej. {sample}",
        sourceAppLabel: "App de origen (opcional)",
        sourceAppHint:
            "Sirve para etiquetar las filas que no tienen nombre de alimento propio.",
        previewButton: "Previsualizar importación",
        chooseAnotherButton: "Elegir otro archivo",
        previewHeading: "Vista previa",
        mealsToImport: {
            one: "{n} comida por importar",
            other: "{n} comidas por importar",
        },
        kcalTotal: "{kcal} kcal en total",
        rowsSkipped: {
            one: "{n} fila omitida",
            other: "{n} filas omitidas",
        },
        batchCount: { one: "{n} lote", other: "{n} lotes" },
        datesReadAs: "Fechas leídas como {format}; energía {conversion}.",
        energyConvertedNote: "convertida de kJ a kcal",
        energyReadAsKcal: "leída como kcal",
        badDatesWarning: {
            one: "Se omitió {n} fila porque su fecha no se pudo leer como {format}{sample}. Vuelve atrás y elige el formato de fecha de tu archivo.",
            other: "Se omitieron {n} filas porque sus fechas no se pudieron leer como {format}{sample}. Vuelve atrás y elige el formato de fecha de tu archivo.",
        },
        badDateSample: " (p. ej. línea {line}: {value})",
        noTimeWarning: {
            one: "{n} fila tiene fecha, pero no hora: se registrará al mediodía.",
            other: "{n} filas tienen fecha, pero no hora: se registrarán al mediodía.",
        },
        splitDatesCount: {
            one: "{n} fecha tiene",
            other: "{n} fechas tienen",
        },
        splitDatesWarning:
            " más de {max} comidas (p. ej. {date}), así que hubo que repartir la importación en varios lotes. Si esa fecha contiene dos entradas con exactamente el mismo alimento, tipo de comida y macros, una de ellas podría omitirse como duplicada en vez de importarse.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "Carb",
            fat_g: "G",
            fiber_g: "Fib",
            sugar_g: "Azúc",
            added_sugar_g: "Añad",
            saturated_fat_g: "Sat.",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Línea",
        tableWhen: "Fecha",
        tableMeal: "Comida",
        tableFood: "Alimento",
        tableProblem: "Problema",
        noNameFallback: "(sin nombre: se etiquetará según la comida)",
        showingRows: "Mostrando {shown} de {total} filas",
        checkingRows: {
            one: "Comprobando {n} fila…",
            other: "Comprobando {n} filas…",
        },
        importingRows: {
            one: "Importando {n} fila…",
            other: "Importando {n} filas…",
        },
        batchProgress: "{label} (lote {done} de {total})",
        rowsRange: "Filas {a}–{b}: {msg}",
        preflightFailed: "Falló la comprobación previa.",
        rowsWouldFail: {
            one: "{n} fila fallaría, p. ej. línea {line}: {message}",
            other: "{n} filas fallarían, p. ej. línea {line}: {message}",
        },
        importingEllipsis: "Importando…",
        importButton: {
            one: "Importar {n} comida",
            other: "Importar {n} comidas",
        },
        backToMapping: "Volver a la asignación",
        importCompleteHeading: "Importación completada",
        resultMealsImported: {
            one: "{n} comida importada",
            other: "{n} comidas importadas",
        },
        resultAlreadyLogged: {
            one: ", {n} ya registrada",
            other: ", {n} ya registradas",
        },
        resultFailed: {
            one: ", {n} fallida",
            other: ", {n} fallidas",
        },
        resultSkipped: {
            one: ", {n} omitida",
            other: ", {n} omitidas",
        },
        restartButton: "Importar otro archivo",
        couldNotReadFile: "No se pudo leer ese archivo: {msg}",
        noDataRows: "No se encontraron filas de datos en ese archivo.",
        emailNotice:
            "¿No funciona como esperabas? Escribe a {email} e incluye las líneas de abajo: es todo lo que hace falta para diagnosticarlo.",
    },
};

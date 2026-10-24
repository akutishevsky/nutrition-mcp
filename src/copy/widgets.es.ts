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
        title: "Progreso de objetivos",
        empty: "No hay progreso de objetivos que mostrar.",
        nothingLoggedFor: "Aún no hay nada registrado para {date}.",
        thisDay: "este día",
        mealsCount: { one: "{n} comida", other: "{n} comidas" },
        waterCount: {
            one: "{n} registro de agua",
            other: "{n} registros de agua",
        },
        weightLabel: "Peso",
        weightNoneNoTarget:
            "Aún no hay ningún peso registrado. Registra uno con log_weight para seguir tu progreso.",
        weightNoneWithTarget:
            "Aún no hay ningún peso registrado. Registra uno con log_weight para seguir tu progreso hacia tu objetivo de {target}.",
        weightNoGoal:
            "Peso {reading}: sin objetivo definido. Define uno con set_nutrition_goals para ver aquí tu progreso.",
        atTarget: "objetivo alcanzado",
        toLose: "{amount} por perder",
        toGain: "{amount} por ganar",
        lastLogged: "último registro: {date}",
        weightAria: "Peso {current}, objetivo {target}, {state}{metaSuffix}",
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

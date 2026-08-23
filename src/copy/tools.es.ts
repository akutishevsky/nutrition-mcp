// Spanish (es) translation of ToolsDoc — see src/copy/tools.ts for the
// canonical shape, the structural TOOLS/BADGE_META identity (kept there,
// never duplicated here), and the trust model for the HTML strings inside
// `tools.*.params` (developer-authored, not escaped further).
//
// Tool names, parameter names, and category ids are never translated —
// only prose (hero copy, category copy, badge labels, and each tool's
// description/params/example/photoHint).

import type { ToolsDoc } from "./tools.js";

export const TOOLS_ES: ToolsDoc = {
    meta: {
        title: "Referencia de herramientas: las 38 herramientas",
        description:
            "Las 38 herramientas que el servidor Nutrition MCP le da a tu IA: registra comidas, escanea códigos de barras, importa tu historial desde otra app, controla el agua y el peso, define objetivos y revisa tendencias. Referencia completa con descripciones y frases de ejemplo.",
        ogDescription:
            "Las 38 herramientas que el servidor Nutrition MCP le da a tu IA, incluido un importador CSV para tu historial desde otra app, con descripciones y frases de ejemplo.",
    },
    hero: {
        eyebrow: "Referencia",
        title: "Todo lo que tu IA puede hacer",
        lead: "Nunca llamas a estas herramientas directamente: tú solo hablas, y el asistente elige la herramienta correcta. Aquí tienes el conjunto completo que expone el servidor Nutrition MCP, con lo que hace cada una y una frase que la activa.",
        countBold: "38 herramientas",
        countTail: "en 7 áreas",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Registro",
            title: "Registrar comidas",
            description:
                "El ciclo principal: captura lo que comiste, como sea que lo describas.",
        },
        "reviewing-your-meals": {
            pillLabel: "Revisión",
            title: "Revisar tus comidas",
            description:
                "Repasa lo que has registrado, un día o un rango completo a la vez.",
        },
        water: {
            pillLabel: "Agua",
            title: "Agua",
            description: "Controla la hidratación junto con tu comida.",
        },
        weight: {
            pillLabel: "Peso",
            title: "Peso",
            description:
                "Registra tus pesajes, revísalos y observa la tendencia hacia tu objetivo.",
        },
        "goals-progress": {
            pillLabel: "Objetivos",
            title: "Objetivos y progreso",
            description: "Define metas y comprueba cómo va cada día.",
        },
        "insights-trends": {
            pillLabel: "Estadísticas",
            title: "Estadísticas y tendencias",
            description:
                "Análisis ya calculado para que la IA detecte patrones sin hacer cálculos.",
        },
        "settings-account": {
            pillLabel: "Ajustes",
            title: "Ajustes y cuenta",
            description:
                "Preferencias que mantienen todo preciso, además de control total sobre tus datos.",
        },
    },
    badges: {
        log: "Registrar",
        widget: "Interfaz interactiva",
        lookup: "Buscar",
        import: "Importar",
        edit: "Editar",
        remove: "Eliminar",
        view: "Ver",
        export: "Exportar",
        setting: "Ajuste",
    },
    tools: {
        log_meal: {
            description:
                "Registra lo que comiste con calorías y macros, además de fibra, azúcares totales, alcohol y cafeína cuando tengas esos datos. Descríbelo en lenguaje natural: la IA estima las cifras, pregunta por el tamaño de la porción cuando no está claro, y puede obtener antes los datos de la etiqueta a partir de un código de barras o de la web.",
            params: {
                description: "Qué comiste",
                meal_type: "desayuno, almuerzo, cena o snack",
                calories: "Calorías totales",
                protein_g: "Proteína en gramos",
                carbs_g: "Carbohidratos en gramos",
                fat_g: "Grasa en gramos",
                fiber_g:
                    "Fibra dietética en gramos. Se indica a la IA que la complete en cada comida, estimándola a partir de los ingredientes cuando no hay dato de etiqueta, porque un campo vacío no es un cero: deja fuera el día entero de tu promedio de fibra",
                sugar_g:
                    '<b>Azúcares totales</b> en gramos: la cifra que la etiqueta imprime bajo "Azúcares", incluyendo el azúcar natural de la fruta y la leche, no solo el azúcar añadido. Se completa en cada comida en los mismos términos que la fibra',
                alcohol_g:
                    "Gramos de <b>etanol puro</b>, no el volumen de la bebida ni su graduación: la IA lo calcula a partir del tamaño de la copa y la graduación (una cerveza de 330 ml al 5% son 13 g)",
                caffeine_mg:
                    "Cafeína en <b>miligramos</b>, no en gramos: el único campo aquí que no está en gramos, porque así es como lo indican todas las etiquetas y guías (un café de filtro tiene unos 95 mg, un espresso 63 mg, una lata de cola 34 mg). La cafeína no aporta calorías. A diferencia de la fibra y el azúcar, solo se envía para alimentos que realmente contienen cafeína: un 0 registrado pondría una fila de cafeína en tu panel para un nutriente que nunca consumes",
                logged_at:
                    "Cuándo lo comiste, si no fue ahora mismo; te permite registrar algo después de que ocurrió",
                notes: "Notas adicionales",
            },
            example:
                "Registra un bowl de burrito de pollo con guacamole extra para el almuerzo",
            photoHint:
                "…o simplemente saca una foto de tu plato: la IA nombra cada alimento, calcula las porciones en medidas cotidianas (un vaso, un puñado), revisa cómo lo has registrado antes y te confirma antes de guardarlo.",
        },
        lookup_barcode: {
            description:
                "Obtiene la información nutricional de un producto envasado desde Open Food Facts a partir de su código de barras (EAN/UPC de 8 a 14 dígitos). Puedes escribir los dígitos o leerlos de una foto del envase; el resultado luego se puede registrar, ajustado a la cantidad que comiste.",
            params: {},
            example: "Escanea este código de barras: 3017620422003",
            photoHint:
                "…o envía una foto del envase: la IA lee los dígitos del código de barras en ella.",
        },
        start_meal_import: {
            description:
                "Abre un importador en el chat para traer tu historial desde otra app: elige el archivo que exportaste de MyFitnessPal, Cronometer, Lose It! o MacroFactor, empareja sus columnas con calorías, macros, fibra, azúcar y cafeína (además de alcohol si has activado su seguimiento) y revisa qué se añadirá antes de confirmar. El archivo se lee en tu navegador, no se guarda nada hasta que apruebas la vista previa, y volver a importar el mismo archivo no crea duplicados.",
            params: {},
            example: "Importa mi historial de comidas desde MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Añade un lote de comidas pasadas de una sola vez (hasta 50 a la vez) en lugar de registrarlas una por una. El importador de arriba escribe a través de esta herramienta, y la IA puede usarla directamente para datos de comidas que hayas pegado en el chat. Cada fila se comprueba primero y lo que no encaje se informa fila por fila, así que reenviar las mismas filas es seguro y no duplicará lo ya registrado.",
            params: {
                meals: "Las filas a importar, en el orden del archivo de origen (1–50 por llamada). Cada fila puede llevar una hora, tipo de comida, descripción, notas y las mismas cifras que una comida registrada: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (azúcares totales), <code>alcohol_g</code> (gramos de etanol puro) y <code>caffeine_mg</code> (miligramos, no gramos)",
                expected_row_count:
                    "Cuántas filas trae esta llamada, contadas desde el archivo de origen, para detectar si se pierde alguna",
                expected_total_kcal:
                    "Total de calorías del archivo de origen, conciliado con lo que llega",
                dry_run: "Informa qué pasaría sin escribir nada",
                on_error:
                    "Importa las filas válidas e informa del resto, o no escribe nada si alguna fila falla",
                source_app: "De qué app viene el archivo",
            },
            example:
                "Aquí están las comidas de la semana pasada, pegadas desde mi app anterior: añádelas todas",
        },
        update_meal: {
            description:
                "Cambia los detalles de una comida que ya registraste: su descripción, cualquier macro, fibra, azúcar, alcohol o cafeína, la hora o las notas. También es cómo se rellena un dato que faltaba: si una comida se guardó sin su fibra o azúcar, el servidor lo indica y la IA lo completa aquí.",
            params: {
                id: "UUID de la comida a actualizar",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Azúcares totales, no azúcar añadido",
                alcohol_g: "Gramos de etanol puro, no el volumen de la bebida",
                caffeine_mg: "Miligramos, no gramos",
                logged_at: "",
                notes: "",
            },
            example:
                "En realidad ese almuerzo fueron 600 calorías, no 500: corrígelo",
        },
        delete_meal: {
            description: "Elimina una comida que registraste por error.",
            params: {
                id: "UUID de la comida a eliminar",
            },
            example: "Elimina el snack que registré esta tarde",
        },
        search_meals: {
            description:
                'Busca tus comidas pasadas por palabra clave y velas agrupadas en sus variaciones recurrentes: con qué frecuencia se registró cada una, cuándo fue la última vez y sus calorías habituales. Así es como la IA compara una foto de tu plato con la forma en que has registrado esa comida antes, y cómo funciona "registra mi desayuno habitual".',
            params: {
                queries:
                    "Alternativas de palabras clave de alimentos, en cualquier idioma en el que hayas registrado",
                days: "Cuánto retroceder en el tiempo (por defecto, un año)",
                limit: "Número máximo de entradas a analizar",
            },
            example: "Registra mi desayuno habitual",
        },
        get_meals_today: {
            description: "Consulta todas las comidas que has registrado hoy.",
            params: {},
            example: "¿Qué he comido hoy?",
        },
        get_meals_by_date: {
            description:
                "Consulta todas las comidas que registraste en un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
            },
            example: "Muéstrame todo lo que comí el 4 de julio",
        },
        get_meals_by_date_range: {
            description:
                "Obtén todas las comidas entre dos fechas de una sola vez: útil para revisar una semana o un mes.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date: "Fecha de fin (AAAA-MM-DD)",
            },
            example: "Lista mis comidas de lunes a viernes",
        },
        export_all_data: {
            description:
                "Exporta todo lo que has registrado en un único ZIP: meals.csv, water.csv, weight.csv, goals.csv, profile.csv, y un README.txt que explica las columnas y unidades, con el mismo enlace privado, válido durante 60 minutos. Por ahora, las comidas son la única parte que se puede volver a importar.",
            params: {},
            example: "Exporta todos mis datos: comidas, agua, peso y objetivos",
        },
        log_water: {
            description:
                "Registra una entrada de hidratación. Indícala en cualquier unidad (tazas, onzas, litros) y se convierte a mililitros automáticamente.",
            params: {
                amount_ml: "Cantidad en mililitros (entero, &gt; 0).",
            },
            example: "Acabo de beber una botella de agua de 500 ml",
        },
        get_water_today: {
            description: "Consulta el total de agua de hoy y cada entrada.",
            params: {},
            example: "¿Cuánta agua he bebido hoy?",
        },
        get_water_by_date: {
            description:
                "Consulta tu total de agua y las entradas de un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
            },
            example: "¿Cuánto bebí ayer?",
        },
        delete_water: {
            description: "Elimina una entrada de agua que añadiste por error.",
            params: {
                id: "UUID de la entrada de agua a eliminar",
            },
            example: "Elimina esa última entrada de agua",
        },
        log_weight: {
            description:
                "Registra una medición de peso corporal en kg o lb. Puedes tener varios pesajes al día sin problema, y el servidor lo guarda de forma canónica para que tu preferencia de unidad nunca distorsione el número.",
            params: {
                weight: "Valor del peso corporal, en `unit` (&gt; 0).",
            },
            example: "Registra mi peso: 74,2 kg esta mañana",
        },
        update_weight: {
            description:
                "Corrige un pesaje existente: el valor, la marca de tiempo o sus notas.",
            params: {
                id: "UUID de la entrada de peso a actualizar",
                weight: "Nuevo valor de peso, en `unit`.",
                logged_at: "Marca de tiempo ISO 8601",
                notes: "",
            },
            example: "Corrige el pesaje de esta mañana a 73,8 kg",
        },
        delete_weight: {
            description: "Elimina una entrada de peso.",
            params: {
                id: "UUID de la entrada de peso a eliminar",
            },
            example: "Elimina la entrada de peso de hoy",
        },
        get_weight_today: {
            description:
                "Consulta los pesajes de hoy, mostrados en tu unidad preferida.",
            params: {},
            example: "¿Cuánto pesé hoy?",
        },
        get_weight_by_date: {
            description: "Consulta tus pesajes de un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
            },
            example: "¿Cuál fue mi peso el día 1?",
        },
        get_weight_by_date_range: {
            description:
                "Obtén todos los pesajes entre dos fechas, agrupados por día con el promedio de cada uno.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date: "Fecha de fin (AAAA-MM-DD)",
            },
            example: "Muéstrame mis pesajes de las últimas dos semanas",
        },
        get_weight_trends: {
            description:
                "Consulta la tendencia de tu peso en una ventana de tiempo: última lectura, cambio total, promedios móviles de 7/14/30 días, mínimo/máximo y progreso hacia tu peso objetivo.",
            params: {
                days: "Tamaño de la ventana en días (por defecto 30, máximo 365).",
            },
            example: "¿Cómo va la tendencia de mi peso este mes?",
        },
        set_weight_unit: {
            description:
                "Elige si el peso se muestra y se introduce en kg o lb. Los valores guardados no se ven afectados: solo cambia la visualización y la interpretación por defecto.",
            params: {},
            example: "Usa libras para mi peso a partir de ahora",
        },
        get_weight_unit: {
            description:
                "Comprueba qué unidad de peso estás usando actualmente.",
            params: {},
            example: "¿Qué unidad de peso estoy usando?",
        },
        set_nutrition_goals: {
            description:
                "Define tus objetivos diarios de calorías, macros, fibra, azúcar, alcohol, cafeína y agua, además de un peso corporal objetivo opcional. Calorías, proteína, carbohidratos, grasa, fibra y agua son metas a alcanzar; azúcar, alcohol y cafeína son límites a no superar, y el progreso se expresa en consecuencia. Actualiza solo los campos que indiques; el resto se queda igual.",
            params: {
                daily_calories:
                    "Objetivo diario de calorías (kcal). Null para borrarlo.",
                daily_protein_g:
                    "Objetivo diario de proteína (gramos). Null para borrarlo.",
                daily_carbs_g:
                    "Objetivo diario de carbohidratos (gramos). Null para borrarlo.",
                daily_fat_g:
                    "Objetivo diario de grasa (gramos). Null para borrarlo.",
                daily_fiber_g:
                    "Objetivo diario de fibra (gramos), un mínimo a alcanzar. Null para borrarlo.",
                daily_sugar_g:
                    "Límite diario de azúcares <b>totales</b> (gramos), un máximo a no superar. Los azúcares totales incluyen el azúcar natural de la fruta y la leche, así que las recomendaciones públicas de azúcar añadido son una cifra mucho menor. Null para borrarlo.",
                daily_alcohol_g:
                    "Límite diario de alcohol en gramos de <b>etanol puro</b>, un máximo a no superar. Una bebida estándar de EE. UU. son 14 g; una unidad del Reino Unido, 7,9 g. Null para borrarlo.",
                daily_caffeine_mg:
                    "Límite diario de cafeína en <b>miligramos</b>, un máximo a no superar. El límite de la EFSA y la FDA para adultos sanos es de 400 mg al día (aproximadamente cuatro cafés de filtro), y 200 mg durante el embarazo. 0 es un límite real que significa ninguna cantidad. Null para borrarlo.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Ajusta mis objetivos a 2200 calorías, 160 g de proteína y un peso objetivo de 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Consulta tus objetivos diarios actuales de calorías y macros, cualquier objetivo de fibra y límite de azúcar o cafeína y, si controlas el alcohol, tu límite de alcohol.",
            params: {},
            example: "¿Cuáles son mis metas diarias?",
        },
        get_goal_progress: {
            description:
                "Consulta cómo va la ingesta de hoy frente a tus objetivos: anillos de ingesta frente a meta más el progreso de peso corporal. Toca un anillo de macro para ver qué comidas contribuyeron.",
            params: {},
            example: "¿Cómo voy hoy respecto a mis objetivos?",
        },
        get_nutrition_summary: {
            description:
                "Obtén los totales diarios de nutrición en un rango de fechas como un panel interactivo: fichas de macros frente a objetivos y un desglose por día.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date: "Fecha de fin (AAAA-MM-DD)",
            },
            example: "Dame un resumen de esta última semana",
        },
        get_trends: {
            description:
                "Promedios móviles de 7/14/30 días, variabilidad, rachas de registro, desgloses por día de la semana, y tus mejores y peores días de calorías y cada macro: ya calculados para que la IA solo tenga que narrarlos.",
            params: {
                days: "Tamaño de la ventana en días (por defecto 30, máximo 365).",
            },
            example:
                "¿Cuáles son mis tendencias de calorías y macros en los últimos 30 días?",
        },
        get_meal_patterns: {
            description:
                "Muestra patrones de comportamiento: con qué frecuencia comes cada tipo de comida, el efecto del desayuno, almuerzos altos en calorías, cenas tardías, entre semana frente a fin de semana, y días atípicos.",
            params: {
                days: "Tamaño de la ventana en días (por defecto 30, mínimo 7, máximo 365).",
            },
            example:
                "¿Hay patrones en cómo como, como cenas tardías o saltarme el desayuno?",
        },
        set_timezone: {
            description:
                "Define tu zona horaria IANA para que los días cambien a tu medianoche local: una comida registrada a las 23:00 cuenta para ese día, no para el siguiente en UTC.",
            params: {},
            example: "Estoy en Berlín: configura mi zona horaria",
        },
        get_timezone: {
            description:
                "Consulta la zona horaria configurada, junto con tu fecha y hora locales actuales (por defecto UTC si no está configurada).",
            params: {},
            example: "¿A qué zona horaria estoy configurado?",
        },
        get_current_time: {
            description:
                'Consulta la fecha y hora actuales en tu zona horaria, además del instante en UTC. Algunas apps no le dicen al asistente qué hora es, así que así es como averigua qué significa "esta mañana" o "hoy" sin preguntarte (por defecto UTC si no hay zona horaria configurada).',
            params: {},
            example: "¿Qué hora es para mí ahora mismo?",
        },
        set_widget_display: {
            description:
                "Activa o desactiva los widgets visuales del chat: los paneles, anillos de objetivos y gráficos de tendencias. Cuando están desactivados, las mismas herramientas responden solo con texto y datos. Activados por defecto; el cambio se aplica a las conversaciones nuevas.",
            params: {
                enabled:
                    "true para mostrar widgets, false para respuestas solo de texto",
            },
            example: "Desactiva los widgets",
        },
        get_widget_display: {
            description:
                "Comprueba si los widgets visuales del chat están activados actualmente.",
            params: {},
            example: "¿Están activados los widgets?",
        },
        set_alcohol_tracking: {
            description:
                "Activa o desactiva el seguimiento de alcohol, y elige si las bebidas se cuentan en bebidas estándar de EE. UU. o en unidades del Reino Unido. Está desactivado por defecto, así que tienes que pedirlo expresamente. Desactivarlo de nuevo oculta el alcohol de las comidas, objetivos y progreso, y hace que el importador de archivos deje de leer la columna de alcohol de un archivo; nada de lo ya registrado se elimina, tu exportación CSV lo sigue incluyendo, y vuelve a aparecer si lo reactivas. El cambio se aplica desde tu siguiente mensaje, sin necesidad de reiniciar nada.",
            params: {
                enabled:
                    "true para mostrar alcohol en comidas, objetivos y progreso, false para ocultarlo",
                drink_unit:
                    "Qué bebida estándar mostrar junto a los gramos: <code>us</code> (14 g por bebida) o <code>uk</code> (7,9 g por unidad). Por defecto <code>us</code>; lo que realmente se guarda son gramos de etanol puro.",
            },
            example:
                "Empieza a registrar lo que bebo, en unidades del Reino Unido",
        },
        get_alcohol_tracking: {
            description:
                "Comprueba si el seguimiento de alcohol está activado, y con qué bebida estándar se muestran tus gramos.",
            params: {},
            example: "¿Estoy registrando alcohol?",
        },
        delete_account: {
            description:
                "Elimina tu cuenta y todos los datos asociados de forma permanente. Esto es irreversible: la IA siempre te lo confirma antes.",
            params: {},
            example: "Elimina mi cuenta y todos mis datos",
        },
    },
};

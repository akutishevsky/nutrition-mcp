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
        title: "41 herramientas: calorías, macros, agua y peso",
        description:
            "Las 41 herramientas de Nutrition MCP para Claude, ChatGPT y más: registra comidas, agua, peso y medidas corporales, escanea códigos e importa CSV de MyFitnessPal o Cronometer.",
        ogDescription:
            "Las 41 herramientas que el servidor Nutrition MCP da a tu IA, incluido un importador CSV para traer tu historial de otra app, con descripciones y ejemplos.",
    },
    hero: {
        eyebrow: "Referencia",
        titleBeforeEm: "Todo lo que tu IA puede ",
        titleEm: "hacer",
        titleAfterEm: "",
        lead: "Nunca tienes que usar estas herramientas tú mismo: basta con hablar con Claude, ChatGPT u otro cliente MCP, y él elige la adecuada. Aquí tienes todas las herramientas que ofrece el servidor Nutrition MCP para comidas, calorías y macros, agua y peso, con lo que hace cada una y una frase que la activa.",
        countBold: "41 herramientas",
        countTail: "en 7 áreas",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Registro",
            title: "Registrar comidas",
            description:
                "Lo esencial: registra lo que comiste, lo describas como lo describas.",
        },
        "reviewing-your-meals": {
            pillLabel: "Revisión",
            title: "Revisar tus comidas",
            description:
                "Repasa lo que has registrado: un día concreto o un periodo entero de una vez.",
        },
        water: {
            pillLabel: "Agua",
            title: "Registro de agua",
            description: "Controla tu hidratación junto con lo que comes.",
        },
        weight: {
            pillLabel: "Cuerpo",
            title: "Peso y medidas corporales",
            description:
                "Registra tus pesajes y medidas con cinta métrica, revísalos y sigue la evolución de tu peso hacia el peso objetivo.",
        },
        "goals-progress": {
            pillLabel: "Objetivos",
            title: "Objetivos y progreso",
            description:
                "Define tus objetivos y comprueba cómo te va cada día.",
        },
        "insights-trends": {
            pillLabel: "Estadísticas",
            title: "Estadísticas y tendencias",
            description:
                "Análisis ya calculados para que la IA detecte patrones sin tener que hacer cuentas.",
        },
        "settings-account": {
            pillLabel: "Ajustes",
            title: "Ajustes y cuenta",
            description:
                "Preferencias para que todo sea exacto, y control total sobre tus datos.",
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
        setting: "Configurar",
    },
    ui: {
        parametersLabel: "Parámetros",
        requiredLabel: "obligatorio",
        optionalLabel: "opcional",
        trySayingLabel: "Prueba con",
        categoriesLabel: "Categorías de herramientas",
    },
    tools: {
        log_meal: {
            description:
                "Registra lo que comiste con sus calorías y macros, además de fibra, azúcares totales, alcohol y cafeína cuando haya datos. Descríbelo con tus propias palabras: la IA estima las cifras, te pregunta el tamaño de la porción si no está claro y puede consultar antes los datos de la etiqueta con el código de barras o en la web.",
            params: {
                description: "Qué comiste",
                meal_type: "desayuno, almuerzo, cena o snack",
                calories: "Calorías totales",
                protein_g: "Proteína en gramos",
                carbs_g: "Carbohidratos en gramos",
                fat_g: "Grasa en gramos",
                fiber_g:
                    "Fibra dietética en gramos. La IA tiene la instrucción de completarla en cada comida, estimándola a partir de los ingredientes cuando no hay dato de etiqueta, porque un campo vacío no cuenta como cero: saca ese día entero de tu promedio de fibra",
                sugar_g:
                    "Azúcares <b>totales</b> en gramos: la cifra que la etiqueta indica en «Azúcares», incluido el azúcar natural de la fruta y la leche, no solo el azúcar añadido. Se completa en cada comida, igual que la fibra",
                alcohol_g:
                    "Gramos de <b>etanol puro</b>, no el volumen de la bebida ni su graduación: la IA lo calcula a partir de la cantidad servida y la graduación (una cerveza de 330 ml al 5&nbsp;% son 13 g)",
                caffeine_mg:
                    "Cafeína en <b>miligramos</b>, no en gramos: es el único campo que no va en gramos, porque así la indican todas las etiquetas y guías (un café de filtro tiene unos 95 mg; un espresso, 63 mg; una lata de cola, 34 mg). La cafeína no aporta calorías. A diferencia de la fibra y el azúcar, solo se envía para lo que de verdad contiene cafeína: un 0 registrado añadiría a tu panel una fila de cafeína para un nutriente que nunca consumes",
                logged_at:
                    "Cuándo lo comiste, si no fue ahora: te permite registrarlo a posteriori",
                notes: "Notas adicionales",
            },
            example:
                "Registra un burrito bowl de pollo con guacamole extra como almuerzo",
            photoHint:
                "…o sácale una foto a tu plato: la IA identifica cada plato, calcula las porciones en medidas cotidianas (un vaso, un puñado), revisa cómo lo has registrado antes y lo confirma contigo antes de guardarlo.",
        },
        lookup_barcode: {
            description:
                "Obtén de Open Food Facts la información nutricional de la etiqueta de un producto envasado a partir de su código de barras (EAN/UPC de 8 a 14 dígitos), además de su Nutri-Score y su grupo de procesamiento NOVA cuando Open Food Facts los tiene. Puedes escribir los dígitos o leerlos de una foto del envase; después puedes registrar el resultado, ajustado a la cantidad que comiste.",
            params: {},
            example: "Escanea este código de barras: 3017620422003",
            photoHint:
                "…o envía una foto del envase: la IA lee en ella los dígitos del código de barras.",
        },
        start_meal_import: {
            description:
                "Abre en el chat un importador para traer tu historial desde otra app: elige el CSV que exportaste de MyFitnessPal, Cronometer, Lose It!, MacroFactor u otra app de seguimiento, asigna sus columnas a calorías, macros, fibra, azúcar y cafeína (y también alcohol, si activaste su seguimiento) y revisa lo que se añadirá antes de confirmar. El archivo se lee en tu navegador, no se guarda nada hasta que apruebas la vista previa y, si vuelves a importar el mismo archivo, no se crean duplicados.",
            params: {},
            example: "Importa mi historial de comidas de MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Añade de golpe un lote de comidas anteriores (hasta 50 a la vez) en lugar de registrarlas una por una. El importador de arriba guarda los datos a través de esta herramienta, y la IA puede usarla directamente con datos de comidas que hayas pegado en el chat. Antes de guardar, comprueba cada fila e informa, fila por fila, de lo que no encaje, así que reenviar las mismas filas es seguro y no duplica lo ya registrado, siempre que tu zona horaria no haya cambiado entretanto.",
            params: {
                meals: "Las filas que se van a importar, en el orden del archivo de origen (1–50 por llamada). Cada fila puede incluir hora, tipo de comida, descripción, notas y las mismas cifras que una comida registrada: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (azúcares totales), <code>alcohol_g</code> (gramos de etanol puro) y <code>caffeine_mg</code> (miligramos, no gramos)",
                expected_row_count:
                    "Cuántas filas trae esta llamada, contadas en el archivo de origen, para detectar si se pierde alguna",
                expected_total_kcal:
                    "Total de calorías del archivo de origen, para cotejarlo con lo que llega",
                dry_run: "Indica qué pasaría sin guardar nada",
                on_error:
                    "Importa las filas válidas e informa del resto, o no guarda nada si falla alguna fila",
                source_app: "De qué app viene el archivo",
            },
            example:
                "Aquí tienes las comidas de la semana pasada, copiadas de mi app anterior: añádelas todas",
        },
        update_meal: {
            description:
                "Cambia los datos de una comida que ya registraste: su descripción, cualquier macro, la fibra, el azúcar, el alcohol o la cafeína, la hora o las notas. También sirve para completar un dato que faltaba: si una comida se guardó sin fibra o sin azúcar, el servidor lo indica y la IA lo completa aquí si estás de acuerdo.",
            params: {
                id: "UUID de la comida que quieres actualizar",
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
                "En realidad ese almuerzo tenía 600 calorías, no 500: corrígelo",
        },
        delete_meal: {
            description: "Elimina una comida que registraste por error.",
            params: {
                id: "UUID de la comida que quieres eliminar",
            },
            example: "Borra el snack que registré esta tarde",
        },
        search_meals: {
            description:
                "Busca tus comidas anteriores por palabra clave y míralas agrupadas en sus variantes habituales: cuántas veces registraste cada una, cuándo fue la última y sus calorías típicas. Así es como la IA compara una foto de tu plato con cómo has registrado esa comida antes, y así funciona «registra mi desayuno habitual».",
            params: {
                queries:
                    "Palabras clave alternativas para el alimento, en cualquier idioma en el que hayas registrado comidas",
                days: "Hasta cuándo buscar hacia atrás (por defecto, un año)",
                limit: "Máximo de entradas que analizar",
            },
            example: "Registra mi desayuno habitual",
        },
        get_meals_today: {
            description: "Consulta todas las comidas que has registrado hoy.",
            params: {
                detail: "<code>compact</code> (por defecto) muestra una línea por comida con su id; <code>full</code> incluye además las notas y las horas exactas",
            },
            example: "¿Qué he comido hoy?",
        },
        get_meals_by_date: {
            description:
                "Consulta todas las comidas que registraste un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
                detail: "<code>compact</code> (por defecto) muestra una línea por comida con su id; <code>full</code> incluye además las notas y las horas exactas",
            },
            example: "Muéstrame todo lo que comí el 4 de julio",
        },
        get_meals_by_date_range: {
            description:
                "Obtén de una vez todas las comidas entre dos fechas: útil para repasar una semana o un mes. Cada llamada cubre hasta 31 días; para periodos más largos, las tendencias y los resúmenes te dan los totales diarios.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date:
                    "Fecha de fin (AAAA-MM-DD), hasta 31 días contando el de inicio",
                detail: "<code>compact</code> (por defecto) muestra una línea por comida con su id; <code>full</code> incluye además las notas y las horas exactas",
            },
            example: "Muestra mis comidas de lunes a viernes",
        },
        export_all_data: {
            description:
                "Exporta en un único ZIP todo lo que el servicio guarda sobre ti: meals.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, profile.csv, account.csv (tu cuenta de inicio de sesión), telemetry.csv (registros de uso de herramientas), connections.csv (tus apps de IA conectadas, sin ningún token) y un README.txt que explica las columnas, las unidades y lo que no se incluye. Te devuelve un enlace de descarga privado, válido durante 60 minutos. Por ahora, las comidas son lo único que se puede volver a importar.",
            params: {},
            example: "Exporta todos mis datos: comidas, agua, peso y objetivos",
        },
        log_water: {
            description:
                "Registra lo que has bebido. Dilo en cualquier unidad (tazas, onzas, litros) y se convierte a mililitros automáticamente.",
            params: {
                amount_ml: "Cantidad en mililitros (entero, &gt; 0).",
            },
            example: "Acabo de beberme una botella de agua de 500 ml",
        },
        get_water_today: {
            description: "Consulta el total de agua de hoy y cada registro.",
            params: {},
            example: "¿Cuánta agua he bebido hoy?",
        },
        get_water_by_date: {
            description:
                "Consulta el total de agua y los registros de un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
            },
            example: "¿Cuánto bebí ayer?",
        },
        delete_water: {
            description: "Elimina un registro de agua que añadiste por error.",
            params: {
                id: "UUID del registro de agua que quieres eliminar",
            },
            example: "Borra el último registro de agua",
        },
        log_weight: {
            description:
                "Registra una medición de peso corporal en kg o lb. Puedes pesarte varias veces al día sin problema, y el servidor guarda el valor en una unidad fija para que tu unidad preferida nunca altere la cifra.",
            params: {
                weight: "Peso corporal, en <code>unit</code> (&gt; 0).",
            },
            example: "Registra mi peso: 74,2 kg esta mañana",
        },
        update_weight: {
            description:
                "Corrige un pesaje existente: el valor, la fecha y hora o las notas.",
            params: {
                id: "UUID del pesaje que quieres actualizar",
                weight: "Nuevo valor de peso, en <code>unit</code>.",
                logged_at: "Marca de tiempo ISO 8601",
                notes: "",
            },
            example: "Corrige el pesaje de esta mañana: 73,8 kg",
        },
        delete_weight: {
            description: "Elimina un pesaje.",
            params: {
                id: "UUID del pesaje que quieres eliminar",
            },
            example: "Borra el pesaje de hoy",
        },
        get_weight_today: {
            description: "Consulta los pesajes de hoy, en tu unidad preferida.",
            params: {},
            example: "¿Cuánto pesé hoy?",
        },
        get_weight_by_date: {
            description: "Consulta tus pesajes de un día concreto.",
            params: {
                date: "Fecha en formato AAAA-MM-DD",
            },
            example: "¿Cuánto pesaba el día 1?",
        },
        get_weight_by_date_range: {
            description:
                "Obtén todos los pesajes entre dos fechas, agrupados por día con la media de cada uno.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date: "Fecha de fin (AAAA-MM-DD)",
            },
            example: "Muéstrame mis pesajes de las últimas dos semanas",
        },
        get_weight_trends: {
            description:
                "Consulta la tendencia de tu peso en un periodo: última medición, cambio total, medias móviles de 7/14/30 días, mínimo/máximo y progreso hacia tu peso objetivo.",
            params: {
                days: "Duración del periodo en días (por defecto 30, máximo 365).",
            },
            example: "¿Cómo evoluciona mi peso este mes?",
        },
        set_weight_unit: {
            description:
                "Elige si el peso se muestra e introduce en kg o en lb. Los valores guardados no cambian: solo cambia cómo se muestran y cómo se interpretan por defecto.",
            params: {},
            example: "A partir de ahora, usa libras para mi peso",
        },
        log_body_measurement: {
            description:
                "Registra una medida con cinta métrica de una parte del cuerpo (cintura, cadera, cuello, pecho, hombros, brazo, antebrazo, muslo o pantorrilla) en cm o pulgadas. Se guarda tal como la introduces junto con un valor en una unidad fija, para que cambiar de unidad nunca altere la cifra. Los números muy alejados de un rango realista para esa parte del cuerpo se rechazan como probables errores de escritura.",
            params: {
                kind: "Qué parte del cuerpo: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> o <code>calf</code>. Un valor por parte del cuerpo; el lado (izquierdo/derecho) puede ir en las notas.",
                value: "La medida, en <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> o <code>in</code>; por defecto, tu unidad de longitud guardada.",
                logged_at: "Cuándo se midió, si no fue ahora",
                notes: "Notas adicionales",
            },
            example: "Registra mi cintura: 82 cm esta mañana",
        },
        get_body_measurements: {
            description:
                "Muestra tus medidas corporales por día, de la más antigua a la más reciente, opcionalmente de una sola parte del cuerpo. Abarca los últimos 30 días si no indicas fechas, hasta 366 días por consulta.",
            params: {
                kind: "Solo esta parte del cuerpo (p. ej., <code>waist</code>)",
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date:
                    "Fecha de fin (AAAA-MM-DD), hasta 366 días contando el de inicio",
            },
            example:
                "Muéstrame mis medidas de cintura de los últimos tres meses",
        },
        update_body_measurement: {
            description:
                "Corrige una medida existente: el valor, su unidad, la fecha y hora o las notas. La parte del cuerpo no cambia; otra parte del cuerpo es una entrada nueva.",
            params: {
                id: "UUID de la medida que quieres actualizar",
                value: "Nuevo valor, en <code>unit</code>.",
                unit: "Por defecto, la unidad en que se registró la entrada.",
                logged_at: "Marca de tiempo ISO 8601",
                notes: "Notas que sustituyen a las anteriores",
            },
            example: "Esa medida de cadera era 98 cm, no 89",
        },
        delete_body_measurement: {
            description: "Elimina una medida corporal.",
            params: {
                id: "UUID de la medida que quieres eliminar",
            },
            example: "Borra la medida de cuello de hoy",
        },
        set_length_unit: {
            description:
                "Elige si las medidas corporales se muestran e introducen en centímetros o en pulgadas. Es independiente de tu unidad de peso. Los valores guardados no cambian: solo cambia cómo se muestran y cómo se interpretan por defecto.",
            params: {},
            example: "Usa pulgadas para mis medidas",
        },
        set_nutrition_goals: {
            description:
                "Define tus objetivos diarios de calorías, macros, fibra, azúcar, alcohol, cafeína y agua, además de un peso objetivo opcional. Calorías, proteína, carbohidratos, grasa, fibra y agua son objetivos por alcanzar; azúcar, alcohol y cafeína son límites que no superar, y el progreso se expresa en consecuencia. Solo se actualizan los campos que indiques; el resto no cambia.",
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
                    "Objetivo diario de fibra (gramos), un mínimo por alcanzar. Null para borrarlo.",
                daily_sugar_g:
                    "Límite diario de azúcares <b>totales</b> (gramos), un máximo que no superar. Los azúcares totales incluyen el azúcar natural de la fruta y la leche, así que las recomendaciones oficiales sobre azúcar añadido dan una cifra mucho menor. Null para borrarlo.",
                daily_alcohol_g:
                    "Límite diario de alcohol en gramos de <b>etanol puro</b>, un máximo que no superar. Una bebida estándar de EE. UU. son 14 g; una unidad del Reino Unido, 7,9 g. Null para borrarlo.",
                daily_caffeine_mg:
                    "Límite diario de cafeína en <b>miligramos</b>, un máximo que no superar. La EFSA y la FDA fijan el máximo para adultos sanos en 400 mg al día (unos cuatro cafés de filtro); la cifra de la EFSA durante el embarazo es de 200 mg. 0 es un límite real: nada en absoluto. Null para borrarlo.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Fija mis objetivos en 2200 calorías, 160 g de proteína y un peso objetivo de 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Consulta tus objetivos diarios actuales de calorías y macros, tu objetivo de fibra y tu límite de azúcar o cafeína si los tienes y, si registras el alcohol, tu límite de alcohol.",
            params: {},
            example: "¿Cuáles son mis objetivos diarios?",
        },
        get_goal_progress: {
            description:
                "Consulta cómo va lo que has comido hoy frente a tus objetivos: anillos que comparan lo que llevas con cada objetivo, y el progreso de tu peso. Toca el anillo de un macro para ver qué comidas sumaron.",
            params: {},
            example: "¿Cómo voy hoy con mis objetivos?",
        },
        get_nutrition_summary: {
            description:
                "Obtén los totales nutricionales diarios de un rango de fechas en un panel interactivo: fichas de macros frente a tus objetivos y un desglose por día. Cada llamada cubre hasta 92 días; para periodos más largos, las tendencias te dan medias móviles.",
            params: {
                start_date: "Fecha de inicio (AAAA-MM-DD)",
                end_date:
                    "Fecha de fin (AAAA-MM-DD), hasta 92 días contando el de inicio",
            },
            example: "Hazme un resumen de esta última semana",
        },
        get_trends: {
            description:
                "Medias móviles de 7/14/30 días, variabilidad, rachas de registro, media de calorías por día de la semana, y tus mejores y peores días en calorías: ya calculados para que la IA solo tenga que comentarlos.",
            params: {
                days: "Duración del periodo en días (por defecto 30, máximo 365).",
            },
            example:
                "¿Cuáles son mis tendencias de calorías y macros en los últimos 30 días?",
        },
        get_meal_patterns: {
            description:
                "Descubre tus patrones de comportamiento: con qué frecuencia haces cada tipo de comida, el efecto del desayuno, almuerzos muy calóricos, cenas tardías, entre semana frente al fin de semana, y días atípicos.",
            params: {
                days: "Duración del periodo en días (por defecto 30, mínimo 7, máximo 365).",
            },
            example:
                "¿Hay patrones en mi forma de comer, como cenar tarde o saltarme el desayuno?",
        },
        get_profile: {
            description:
                "Consulta todos tus ajustes de un vistazo: zona horaria (con la fecha y hora locales), idioma de los widgets, unidades de peso y longitud preferidas, si se muestran los widgets en el chat y si el seguimiento de alcohol está activado.",
            params: {},
            example: "¿Cuáles son mis ajustes actuales?",
        },
        set_timezone: {
            description:
                "Define tu zona horaria IANA para que el día cambie a tu medianoche local: una comida registrada a las 23:00 cuenta para ese día, no para el siguiente según UTC.",
            params: {},
            example: "Estoy en Berlín: configura mi zona horaria",
        },
        set_language: {
            description:
                "Define el idioma de la interfaz de los widgets del chat (los paneles y gráficos), no el de lo que la IA te escribe.",
            params: {
                locale: "Código ISO 639-1, p. ej. <code>de</code>, <code>ja</code>. Idiomas disponibles: inglés, alemán, español, francés, neerlandés, polaco, italiano, ucraniano y japonés.",
            },
            example: "Muéstrame los widgets en alemán",
        },
        get_current_time: {
            description:
                "Consulta la fecha y la hora actuales en tu zona horaria, además del instante en UTC. Algunas apps no le dicen al asistente qué hora es, y así puede saber qué significa «esta mañana» u «hoy» sin preguntarte (si no hay zona horaria configurada, usa UTC).",
            params: {},
            example: "¿Qué hora es ahora mismo para mí?",
        },
        set_widget_display: {
            description:
                "Activa o desactiva los widgets visuales del chat: paneles, anillos de objetivos y gráficos de tendencias. Si están desactivados, las mismas herramientas responden solo con texto y datos. Vienen activados por defecto; el cambio se aplica en las conversaciones nuevas.",
            params: {
                enabled:
                    "true para mostrar los widgets, false para responder solo con texto",
            },
            example: "Desactiva los widgets",
        },
        set_alcohol_tracking: {
            description:
                "Activa o desactiva el seguimiento de alcohol y elige si las bebidas se cuentan en bebidas estándar de EE. UU. o en unidades del Reino Unido. Viene desactivado por defecto, así que tienes que pedirlo. Si vuelves a desactivarlo, el alcohol se oculta en comidas, objetivos y progreso, y el importador de archivos deja de leer la columna de alcohol; no se borra nada de lo ya registrado, tu exportación CSV lo sigue incluyendo y vuelve a aparecer si lo reactivas. El cambio se aplica desde tu siguiente mensaje, sin reiniciar nada.",
            params: {
                enabled:
                    "true para mostrar el alcohol en comidas, objetivos y progreso, false para ocultarlo",
                drink_unit:
                    "Qué bebida estándar mostrar junto a los gramos: <code>us</code> (14 g por bebida) o <code>uk</code> (7,9 g por unidad). Por defecto, <code>us</code>; lo que se guarda en realidad son gramos de etanol puro.",
            },
            example:
                "Empieza a registrar lo que bebo, en unidades del Reino Unido",
        },
        delete_account: {
            description:
                "Elimina de forma permanente tu cuenta de Nutrition MCP y todos los datos que guarda sobre ti. Es irreversible, así que la herramienta no hace nada sin una confirmación explícita, y se le pide a la IA que lo confirme contigo antes de enviarla.",
            params: {},
            example: "Elimina mi cuenta y todos mis datos",
        },
    },
    troubleshooting: {
        pillLabel: "Ayuda",
        title: "Solución de problemas",
        description:
            "¿Algo no funciona? La mayoría de los problemas se solucionan rápido.",
        stillStuck: "¿Sigue sin funcionar?",
        items: {
            "cannot-connect": {
                question:
                    "El conector no se conecta o me pide iniciar sesión una y otra vez",
                answerHtml:
                    "Elimina el conector y vuelve a añadirlo con la URL exacta <code>https://nutrition-mcp.com/mcp</code>: la parte <code>/mcp</code> es obligatoria. En Claude, abre <strong>Personalizar</strong> → <strong>Conectores</strong>, desconecta Nutrition y vuelve a conectarlo; en ChatGPT, ve a <strong>Configuración</strong> → <strong>Apps</strong>. Inicia sesión con el mismo correo y la misma contraseña, o con la misma cuenta de Google, que usaste antes: tus datos pertenecen a tu cuenta, no a la conexión, así que volver a conectar no borra nada. Una vez conectado, sigue conectado mientras lo uses al menos una vez cada 90 días; si deja de funcionar, se soluciona volviendo a conectarlo de la misma forma.",
            },
            "session-expired": {
                question:
                    'La página de inicio de sesión muestra {"error":"session_expired"}',
                answerHtml:
                    "La página de inicio de sesión solo es válida durante 10 minutos y, además, caduca cada vez que el servidor se reinicia por una actualización. Vuelve a la página de inicio de sesión y recárgala, o inicia de nuevo la conexión desde tu app de IA, y luego inicia sesión sin hacer pausas largas. Si en cambio muestra <code>session_mismatch</code>, el inicio de sesión se terminó en un navegador distinto del que lo abrió: empieza de nuevo desde tu app de IA y termina en ese mismo navegador.",
            },
            "cannot-sign-in": {
                question: "No puedo iniciar sesión, u olvidé mi contraseña",
                answerHtml:
                    'Usa <strong>Iniciar sesión</strong> si ya tienes una cuenta: si el correo o la contraseña no son correctos, verás «Correo o contraseña incorrectos» y nunca se creará una cuenta nueva. <strong>Crear cuenta</strong> es solo para tu primera visita. Comprueba que el correo no tenga errores. Si creaste tu cuenta con <strong>Continuar con Google</strong>, vuelve a usar ese botón. Aún no es posible restablecer la contraseña por ti mismo: escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> desde la dirección de tu cuenta y la restableceré.',
            },
            "history-missing": {
                question: "Volví a conectarme y mi historial ha desaparecido",
                answerHtml:
                    'Cada dirección de correo es una cuenta distinta, así que si inicias sesión con otro correo se abre una cuenta vacía: no se ha borrado nada. Desconecta y vuelve a iniciar sesión con la dirección que usaste al principio. Si no sabes bien cuál era, escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "La IA responde, pero no registra nada",
                answerHtml:
                    "Asegúrate de que el conector esté activado en esta conversación (en Claude, mira el menú de herramientas del cuadro de mensaje) y pídelo directamente, por ejemplo: «registra mi desayuno en Nutrition». Si tu app pide permiso para usar una herramienta, dáselo.",
            },
            "wrong-day": {
                question: "Mis comidas aparecen en el día equivocado",
                answerHtml:
                    'Los días se cuentan en tu zona horaria y, si nunca has configurado una, se usa UTC. Pregunta «¿qué zona horaria tengo configurada?» (<a href="#get_profile"><code>get_profile</code></a>) y, si no es la correcta, «configura mi zona horaria en Europe/Berlin» (<a href="#set_timezone"><code>set_timezone</code></a>). A partir de ahí, todo lo que hayas registrado se agrupa por tu día local, incluidos los registros anteriores. La única excepción es un registro al que le diste una hora concreta mientras la zona horaria estaba mal: conserva el momento con el que se guardó, así que puede seguir desplazado una hora o un día; pídele a la IA que lo pase a la fecha y hora correctas (<a href="#update_meal"><code>update_meal</code></a>). Configura también tu zona horaria antes de importar tu historial: las comidas importadas conservan el momento que se les asignó al importarlas, y si vuelves a importar el archivo de otra app después de cambiar la zona horaria, se añaden por segunda vez. Las exportaciones de Nutrition MCP se reconocen y no se duplican.',
            },
            "no-widgets": {
                question: "Solo veo texto, sin gráficos ni tarjetas",
                answerHtml:
                    'Las tarjetas visuales necesitan una app compatible con los paneles interactivos de MCP Apps, como Claude o ChatGPT; otros clientes reciben la misma información como texto. Si desactivaste los widgets, pide que se vuelvan a activar (<a href="#set_widget_display"><code>set_widget_display</code></a>) y empieza una conversación nueva: un chat abierto conserva la configuración anterior hasta que se vuelve a conectar. La pequeña tarjeta que aparece al registrar una comida solo se muestra cuando ya has definido tus objetivos diarios (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "El importador no se abre, o dice que no puede guardar",
                answerHtml:
                    'El panel del importador necesita una app que muestre paneles interactivos y tenga los widgets activados. Si dice <em>Esta app no permite que este panel guarde datos en tu registro</em>, o no aparece, pídele a la IA que importe ella misma el archivo: adjunta o pega el CSV y usará <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, que revisa cada fila y omite los duplicados, así que volver a enviarlo es seguro siempre que tu zona horaria no haya cambiado entretanto. Configura tu zona horaria antes de la primera importación: si vuelves a importar el archivo de otra app después de cambiarla, las filas se añaden otra vez. Si usas el panel del importador y quieres conservar una columna de alcohol, activa antes el seguimiento de alcohol: el panel omite esa columna mientras el seguimiento está desactivado, y volver a importar más tarde no la completará.',
            },
            "rate-limited": {
                question:
                    "Veo «Rate limit exceeded» o «Too many failed authentication attempts»",
                answerHtml:
                    "Cada cuenta puede hacer 60 solicitudes por minuto, y cada llamada a una herramienta cuenta como al menos una. Espera los segundos que indica el mensaje y continúa. Para cargar muchas comidas antiguas, usa el importador en lugar de registrarlas una por una. Las páginas de inicio de sesión admiten 30 solicitudes por minuto por red. Tras 20 intentos de conexión rechazados seguidos desde una misma red (normalmente un conector antiguo y desconectado que sigue reintentando), las conexiones desde esa red se pausan durante 5 minutos y, si se repiten, las pausas se alargan hasta un máximo de una hora. Para detener los reintentos, elimina el conector antiguo y vuelve a añadirlo.",
            },
            "barcode-not-found": {
                question:
                    "No se encuentra un código de barras, o sus valores parecen incorrectos",
                answerHtml:
                    "Los datos de los códigos de barras vienen de Open Food Facts, una base de datos colaborativa, así que faltan algunos productos y algunas fichas están desactualizadas. Comprueba que se hayan leído bien los 8–14 dígitos que hay bajo el código de barras. Si el producto no está, la IA puede estimar sus valores a partir del nombre o de una foto de la tabla nutricional, y después puedes corregir cualquier cifra. Si añades el producto en openfoodfacts.org, ayudas a todo el mundo. Open Food Facts no tiene datos de cafeína, así que la cafeína sale de la etiqueta o de cantidades típicas.",
            },
            "export-link": {
                question: "El enlace de descarga de mi exportación no funciona",
                answerHtml:
                    'Los enlaces de exportación caducan a los 60 minutos, y cada exportación nueva reemplaza el archivo anterior. Pide una exportación nueva (<a href="#export_all_data"><code>export_all_data</code></a>) y descárgala enseguida. Si la exportación indica 0 comidas cuando esperabas ver tu historial, probablemente has iniciado sesión con otro correo: consulta <a href="#history-missing">«Volví a conectarme y mi historial ha desaparecido»</a>.',
            },
            "delete-account": {
                question: "¿Cómo elimino mi cuenta?",
                answerHtml:
                    'Pídele a la IA que elimine tu cuenta de Nutrition MCP (<a href="#delete_account"><code>delete_account</code></a>). Te pedirá que lo confirmes y después eliminará de forma permanente tus comidas, agua, peso, medidas corporales, objetivos, ajustes, el registro de qué herramientas usó tu app de IA, cualquier archivo de exportación, tus datos de acceso y la propia cuenta. Esto no se puede deshacer, así que exporta antes tus datos si quieres una copia. Después, elimina el conector de tu app. Si más adelante vuelves a iniciar sesión con el mismo correo, se creará una cuenta nueva y vacía.',
            },
            "report-a-problem": {
                question:
                    "¿Cómo informo de un error o de un problema de seguridad?",
                answerHtml:
                    'Informa de los errores en <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: indica qué app usas (Claude, ChatGPT…), qué pediste, qué pasó y más o menos cuándo. Nunca incluyas tu contraseña. Por favor, no publiques los problemas de seguridad: comunícalos de forma privada mediante el <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">informe privado de vulnerabilidades de GitHub</a> o por correo, como se describe en la <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">política de seguridad</a>. Para cualquier otra cosa, escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

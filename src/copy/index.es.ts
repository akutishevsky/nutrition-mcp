// Spanish (es) translation of IndexDoc — see src/copy/index.ts for the
// canonical shape and the rules for the four trusted-HTML fields
// (`connect.claude.steps`, `connect.chatgpt.steps`, `connect.other.noteHtml`,
// `faq[].visibleHtml`). Only the human-readable text changed here — every
// tag, placeholder ({n}), URL, code-tag content, brand name, `add` delta and
// `clock` string is identical to the English source.
//
// Locale notes: numbers follow Spanish conventions as CLDR has them — no
// separator in a four-digit figure ("2000", "1830"), a dot from five digits
// on ("12.040") — the same grouping the page's own figures and the trends
// card get from toLocaleString("es"). No widget label lives in this file any more: the
// two cards on the page are the real in-chat widgets, rendered at build
// time, and every word on them comes from src/copy/widgets.es.ts. The tool
// count ("36") is hand-typed in three strings here, exactly as in
// index.ts — see CLAUDE.md's "Registered tool set".

import type { IndexDoc } from "./index.js";

export const INDEX_ES: IndexDoc = {
    title: "Nutrition MCP — Contador de calorías y macros gratis para Claude, ChatGPT y Cursor",
    metaDescription:
        "Registra calorías, proteína, carbohidratos, grasa, fibra, azúcar y cafeína hablando con tu IA. Nutrition MCP es un servidor MCP gratuito y de código abierto que funciona en Claude, ChatGPT, Cursor y cualquier cliente MCP. Sin apps que instalar.",
    ogDescription:
        "Servidor MCP gratuito y de código abierto para registrar calorías y macros dentro de Claude, ChatGPT y Cursor. Di lo que comiste; él hace las cuentas.",
    keywords:
        "rastreador de nutrición, contador de calorías, rastreador de macros, servidor MCP, conector de Claude, app de ChatGPT, seguimiento de nutrición con IA, registro de comidas, escáner de código de barras, código abierto, alternativa a MyFitnessPal",

    hero: {
        titleBeforeEm: "Controla tu nutrición ",
        titleEm: "hablando",
        titleAfterEm: " con tu IA.",
        lead: "Nutrition MCP es un contador de calorías y macros gratuito y de código abierto que vive dentro de Claude, ChatGPT, Cursor: cualquier IA compatible con MCP. Di lo que comiste; calcula las calorías, la proteína, los carbohidratos, la grasa, la fibra, el azúcar y la cafeína, lo registra y te muestra cómo va el día. Sin apps que instalar.",
        ctaPrimary: "Conéctate en un minuto",
        ctaGithub: "GitHub",
        moreExamples: "Más ejemplos",
        chat: {
            status: "Nutrition · conectado",
            photoCaption: "📷 Foto",
            pauseLabel: "Pausar la demo",
            exchanges: [
                {
                    userText:
                        "Avena con frutos rojos y un flat white para desayunar",
                    aiText: "Registrado: unas 380 kcal y 14 g de proteína. El flat white suma 130 mg de cafeína.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description: "Avena con frutos rojos y un flat white",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "Es una Coca-Cola de 330 ml: 139 kcal y 35 g de azúcar, según Open Food Facts. Registrada como snack.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Medio litro de agua",
                    aiText: "Hecho. Llevas 500 ml hoy.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText:
                        "Una ensalada grande de pollo a la parrilla para comer",
                    aiText: "Registrado: unas 540 kcal y 46 g de proteína. Vas por la mitad de las 2000 de hoy.",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "Ensalada grande de pollo a la parrilla",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "¿Cómo voy hoy?",
                    aiText: "Así va el día hasta ahora: la proteína va bien encaminada y el azúcar está cerca del límite.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "Cómo funciona",
        title: "Tres pasos. Ninguna app que aprender.",
        sub: "Así funciona el seguimiento de nutrición con IA mediante un servidor MCP: conéctate una vez, describe tus comidas y pide resúmenes cuando quieras.",
        steps: [
            {
                title: "Conecta una vez",
                body: "Añade el servidor a Claude, ChatGPT o cualquier cliente MCP e inicia sesión con Google o con tu correo. Tarda menos de un minuto y no tendrás que repetirlo nunca.",
            },
            {
                title: "Solo di lo que comiste",
                body: "Descríbelo en lenguaje natural, o envía una foto de tu comida, una captura de una app de reparto, o un código de barras (lo busca en internet). Los macros se registran automáticamente.",
            },
            {
                title: "Controla y revisa",
                body: "Pide resúmenes diarios, tendencias semanales, progreso de objetivos, o exporta todo lo que has registrado como archivos CSV: completamente gratis.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Instalación rápida",
        title: "Conéctate a Claude, ChatGPT o Cursor en menos de un minuto.",
        sub: "Añade el servidor Nutrition MCP a tu cliente de IA, inicia sesión con Google o con un correo y una contraseña, y empieza a registrar comidas. Nada que instalar, nada que aprender.",
        copyLabel: "Copiar",
        copiedLabel: "Copiado",
        copyAriaLabel: "Copiar URL del servidor",
        bullets: [
            "Funciona en todos los planes de Claude y ChatGPT",
            "OAuth 2.0: tu cliente gestiona el inicio de sesión",
            "Conectado en Claude o ChatGPT, te sigue a iOS y Android",
        ],
        otherTabLabel: "Otros agentes",
        tabsLabel: "Elige tu cliente de IA",
        claude: {
            steps: [
                "Abre <b>Claude</b> (web o escritorio) y haz clic en <b>Personalizar</b>, en la esquina superior izquierda.",
                "Haz clic en <b>Conectores</b>.",
                "Haz clic en <b>+</b> y luego en <b>Añadir conector personalizado</b>.",
                "Dale un nombre, por ejemplo <b>Nutrition</b>.",
                "Pega <code>https://nutrition-mcp.com/mcp</code> en el campo <b>URL del servidor MCP remoto</b>.",
                "Haz clic en <b>Añadir</b>.",
                "Haz clic en <b>Conectar</b>: se abre la página de inicio de sesión; continúa con Google o inicia sesión con un correo y una contraseña.",
                "Listo. Funciona de inmediato y aparece automáticamente en tus apps de iOS y Android.",
            ],
            note: "Funciona en todos los planes de Claude. El plan gratuito permite un servidor MCP conectado a la vez.",
        },
        chatgpt: {
            steps: [
                "Abre <b>ChatGPT en la web</b> → <b>Configuración</b> → <b>Apps</b>.",
                "Haz clic en <b>Crear app</b> al final de la ventana emergente. Si no la ves, activa el <b>Modo desarrollador</b> en <b>Configuración avanzada</b>.",
                "Dale un nombre, por ejemplo <b>Nutrition</b>.",
                "En <b>Conexión</b>, pega <code>https://nutrition-mcp.com/mcp</code>.",
                "En <b>Autenticación</b>, elige <b>OAuth</b>; deja todo lo demás como está.",
                "Haz clic en <b>Crear</b> y luego en <b>Iniciar sesión con Nutrition</b>.",
            ],
            note: "Funciona en todos los planes de ChatGPT.",
        },
        other: {
            noteHtml:
                "Añade la configuración de arriba a tu cliente (Cursor, VS Code, Claude Code y más). Windsurf usa <code>serverUrl</code> en vez de <code>url</code>. En Claude Code, ejecuta <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Tu cliente gestiona el inicio de sesión OAuth automáticamente.",
        },
    },

    onboarding: {
        title: "Configúralo en tus primeros cinco minutos.",
        sub: "Sin pantallas de ajustes. Zona horaria, objetivos de calorías y macros, idioma de los widgets: cada uno es una frase que dices una sola vez.",
        stepLabel: "Paso {n}",
        justSay: "Simplemente di ",
        steps: [
            {
                title: "Define tu zona horaria",
                body: "Para que los días cambien a tu medianoche local, no a la de otra persona.",
                say: "Configura mi zona horaria a Nueva York",
            },
            {
                title: "Define tus objetivos",
                body: "Calorías, macros y agua diarios, además de un peso objetivo opcional.",
                say: "Ajusta mi objetivo diario a 2000 calorías y 150 g de proteína",
            },
            {
                title: "Elige el idioma de los widgets",
                body: "El idioma que usan los widgets del chat, no el que la IA usa para responderte.",
                say: "Muéstrame los widgets en alemán",
            },
            {
                title: "Empieza a registrar",
                body: "Di lo que comiste, envía una foto o escanea un código de barras.",
                say: "Desayuné avena con frutos rojos",
            },
        ],
    },

    examples: {
        title: "Hablar le gana a tocar.",
        sub: "Registra una comida, escanea un código de barras, revisa tu semana: conversaciones reales con widgets reales dentro del chat. Echa un vistazo a algunas.",
        status: "Nutrition · conectado",
        prevLabel: "Anterior",
        nextLabel: "Siguiente",
        pickerLabel: "Elige un ejemplo",
        carouselLabel: "Conversaciones de ejemplo",
        slideLabel: "{n} de {total}",
        carouselRole: "carrusel",
        slideRole: "diapositiva",
        moreToolsLabel: "También usa",
        toolLinkLabel: "{tool} en la página de herramientas",
        photoMealAlt:
            "Foto: un plato de borsch con una cucharada de crema agria y eneldo, y una rebanada de pan de centeno al lado",
        photoPackageAlt:
            "Foto: el código de barras de una lata de Coca-Cola, número 5449000000996",
        threadLabel: "Conversación",
        importerAlt: {
            file: "El importador del chat, paso 1 de 4: elige tu archivo CSV de exportación de MyFitnessPal, Cronometer, Lose It! o MacroFactor",
            map: "Paso 2 de 4: las columnas del archivo se asignaron automáticamente; esta exportación no incluye nombres de alimentos",
            preview:
                "Paso 3 de 4: vista previa de 603 comidas, 322.343 kcal, antes de guardar nada",
            done: "Paso 4 de 4: 603 comidas importadas",
        },
        importerCaption:
            "Las pantallas del importador en orden; en tu chat es una sola tarjeta que se va actualizando",
        downloadExpires: "Caduca en 60 minutos",
        slides: [
            {
                id: "log-meal",
                title: "Regístralo con tus palabras",
                description:
                    "Dilo como se lo contarías a un amigo. Si falta la ración o de qué comida se trata, pregunta antes de estimar. La fibra y el azúcar van en cada registro, la cafeína en todo lo que la tenga, y «esta mañana» cae en tu zona horaria.",
                toolNotes: {
                    log_meal:
                        "Guarda el desayuno con macros, fibra, azúcar y la cafeína del café",
                    log_water:
                        "Suma los 500 ml de las 07:00 al total de agua de hoy",
                    get_current_time:
                        "Mira la fecha de hoy para que «sobre las 7» quede a las 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "avena con arándanos y un café para desayunar",
                    },
                    {
                        from: "ai",
                        text: "¿Qué tamaño tenía el tazón, y la avena era con leche o con agua? ¿Le pusiste algo al café?",
                    },
                    {
                        from: "user",
                        text: "un tazón normal, con leche. el café solo",
                    },
                    {
                        from: "ai",
                        text: "Desayuno registrado: unas 320 kcal, 11 g de proteína y 6 g de fibra. Con el café llevas 95 mg de tu límite de 400 mg de cafeína.",
                    },
                    {
                        from: "user",
                        text: "ah, y sobre las 7 me bebí como medio litro de agua, antes de salir a correr",
                    },
                    {
                        from: "ai",
                        text: "Añadidos 500 ml de agua a las 07:00 de esta mañana.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Avena con leche y arándanos (1 tazón) y café solo (1 taza)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografía tu plato",
                description:
                    "Una foto inicia una entrevista, no una conjetura. Aclara si es casero o de restaurante, mira cómo has registrado ese plato antes, pregunta de una en una por raciones y extras, y solo registra cuando apruebas el resumen.",
                toolNotes: {
                    log_meal:
                        "Registra la comida solo cuando todo está claro y dices que sí",
                    search_meals:
                        "Busca tus borsch registrados antes para preguntar cuál",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "el borsch de mi madre, de almuerzo",
                    },
                    {
                        from: "ai",
                        text: "Tiene muy buena pinta. Has registrado borsch 6 veces: 5 con ternera (unas 320 kcal el plato, la última el 2 sept) y una sin carne (unas 180). ¿Cuál es este?",
                    },
                    { from: "user", text: "con ternera" },
                    {
                        from: "ai",
                        text: "Vale, con ternera. Quedan dos cosas: la crema agria y cuánto comiste. ¿Cuántas cucharadas de crema agria le pusiste, más o menos?",
                    },
                    { from: "user", text: "2 cucharadas, quizá un poco más" },
                    {
                        from: "ai",
                        text: "Cuento 2 cucharadas generosas. ¿Te terminaste el plato?",
                    },
                    { from: "user", text: "entero, y el pan también" },
                    {
                        from: "ai",
                        text: "Entonces: borsch con ternera (1 plato) con 2 cdas. generosas de crema agria, y una rebanada de pan de centeno por lo que se ve en la foto. Unas 470 kcal y 24 g de proteína. ¿Lo registro como almuerzo?",
                    },
                    { from: "user", text: "sí" },
                    {
                        from: "ai",
                        text: "Almuerzo registrado: 470 kcal · 24 g de proteína · 43 g de carbohidratos · 22 g de grasa · 7 g de fibra · 10 g de azúcar.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 9 }],
                cardMeals: [
                    "Borsch con ternera (1 plato, entero) con crema agria (2 cdas.) y pan de centeno (1 rebanada)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Escanea un código de barras",
                description:
                    "Fotografía el envase: los dígitos bajo el código de barras se buscan en Open Food Facts y te pregunta cuánto tomaste. La cafeína, que Open Food Facts no tiene, sale de la marca o de una búsqueda web; si falta fibra o azúcar, se estima.",
                toolNotes: {
                    lookup_barcode:
                        "Trae los datos de la etiqueta de la lata desde Open Food Facts",
                    log_meal:
                        "Registra la lata entera con el almuerzo, cafeína incluida",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "me tomé esto con el almuerzo. ¿cómo de malo es, en serio?",
                    },
                    {
                        from: "ai",
                        text: "Es una lata de Coca-Cola de 330 ml: 139 kcal y 35 g de azúcar, según Open Food Facts. ¿Te tomaste la lata entera?",
                    },
                    { from: "user", text: "entera" },
                    {
                        from: "ai",
                        text: "Registrada con el almuerzo: 139 kcal, 35 g de azúcar y 33 mg de cafeína, con el dato de la propia Coca-Cola, porque Open Food Facts no incluye la cafeína. Y sobre lo mala que es: ese azúcar ya supera por sí solo la mitad de tu límite diario de 60 g, y Open Food Facts le da Nutri-Score E y NOVA 4, ultraprocesado.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: ["Coca-Cola (lata de 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Objetivos y progreso",
                description:
                    "Define metas por alcanzar, como calorías y proteína, y límites que no superar para azúcar, alcohol y cafeína; solo cambia lo que mencionas. Luego pregunta por cualquier día y verás cada cifra frente a su objetivo y lo que te falta.",
                toolNotes: {
                    set_nutrition_goals:
                        "Fija metas de calorías y proteína y un límite de cafeína de 400 mg",
                    get_goal_progress:
                        "Muestra el día de hoy frente a cada objetivo y lo que falta",
                },
                messages: [
                    {
                        from: "user",
                        text: "quiero definir un poco. ponme 2000 kcal y 160 g de proteína. y ¿cuál es un tope de cafeína sensato? prácticamente vivo a base de café",
                    },
                    {
                        from: "ai",
                        text: "La EFSA y la FDA sitúan el máximo para adultos sanos en 400 mg al día, unas cuatro tazas de café de filtro; en el embarazo, la EFSA aconseja 200 mg. ¿Pongo 400 como tu límite?",
                    },
                    { from: "user", text: "sí, 400" },
                    {
                        from: "ai",
                        text: "Hecho: 2000 kcal y 160 g de proteína por alcanzar, y la cafeína por debajo de 400 mg. Lo demás sigue igual: 220 g de carbohidratos, 70 g de grasa, 30 g de fibra, 2,5 L de agua y tu límite de 60 g de azúcar.",
                    },
                    {
                        from: "user",
                        text: "¿todavía me cabe un postre esta noche?",
                    },
                    {
                        from: "ai",
                        text: "Sí. Llevas 1540 kcal y 104 g de proteína, así que te quedan 460 kcal y 56 g de proteína. Lo más justo es el azúcar: 40 de tus 60 g de límite, así que un yogur griego con frutos rojos encaja mejor que una tarta, y además te ayuda con la proteína.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
                cardMeals: [
                    "Yogur griego con granola y frutos rojos (1 tazón)",
                    "Wrap de pollo con ensalada (1 wrap)",
                    "Flat white (1 taza)",
                    "Salmón con arroz y brócoli (1 plato)",
                ],
            },
            {
                id: "review-week",
                title: "Revisa la semana",
                description:
                    "Pregunta qué tal fue la semana y el widget de tendencias se abre en el chat con tus medias y días registrados. Cambia entre 7, 14 y 30 días o toca un nutriente para graficarlo, sin otra petición. También puede darte tus rachas y días en objetivo.",
                toolNotes: {
                    get_trends:
                        "Promedia 7, 14 y 30 días y abre el widget de tendencias",
                },
                messages: [
                    {
                        from: "user",
                        text: "¿qué tal han ido las dos últimas semanas? tengo la sensación de haber ido a trompicones",
                    },
                    {
                        from: "ai",
                        text: "Más estable de lo que parece. Promediaste 1830 kcal al día, 170 por debajo de tus 2000, pero eso cuenta como cero el único día de los 14 que no registraste. En los 13 días registrados fueron unas 1970, con 9 días a menos de un 10% de tu objetivo. Y llevas una racha de 10 días registrando.",
                    },
                    { from: "user", text: "¿y el azúcar?" },
                    {
                        from: "ai",
                        text: "Ese es el que hay que vigilar. Promedió 52 g y superó tu límite de 60 g en 4 de los 13 días.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Controla tu peso",
                description:
                    "Registra tu peso en kg o lb y ve la tendencia bajo el ruido del día a día: una media suavizada, el cambio del mes y lo que te falta para tu objetivo. Una lectura imposible, como una coma decimal olvidada, se detecta antes de guardarse.",
                toolNotes: {
                    log_weight:
                        "Guarda 78,4 kg y rechaza una lectura físicamente imposible",
                    get_weight_trends:
                        "Suaviza 30 días en medias móviles y la distancia al objetivo",
                },
                messages: [
                    { from: "user", text: "me acabo de pesar, 784" },
                    {
                        from: "ai",
                        text: "784 kg no es un peso posible para una persona, así que no lo he guardado. ¿Querías decir 78,4?",
                    },
                    {
                        from: "user",
                        text: "jaja sí, se me olvidó la coma. ¿cómo voy?",
                    },
                    {
                        from: "ai",
                        text: "Guardados 78,4 kg. Has bajado 1,8 kg desde el 14 ago, unos 0,4 kg por semana, y tu media de 7 días es de 78,7 kg. Te faltan 3,4 kg para tu objetivo de 75 kg.",
                    },
                ],
                cards: [{ kind: "weight-trends", after: 3 }],
            },
            {
                id: "meal-patterns",
                title: "Descubre tus patrones",
                description:
                    "Pregunta cuándo comes más y compara tus propios registros: entre semana y fin de semana, días con y sin desayuno, almuerzos grandes, cenas tempranas y tardías. También señala días atípicos, y muestra patrones, no causas.",
                toolNotes: {
                    get_meal_patterns:
                        "Compara días con y sin desayuno, horas de cena y fines de semana en 30 días",
                },
                messages: [
                    {
                        from: "user",
                        text: "¿como más los días que no desayuno? me da esa impresión",
                    },
                    {
                        from: "ai",
                        text: "Un poco, sí. Registraste 28 de los últimos 30 días y no desayunaste en 6. Esos días promediaron 2215 kcal, frente a 1940 en los 22 días con desayuno, y unos 35 g menos de proteína.",
                    },
                    {
                        from: "user",
                        text: "¿y las cenas tardías? los días de gimnasio no ceno hasta las 9",
                    },
                    {
                        from: "ai",
                        text: "También destacan: los 9 días que cenaste a las 20:00 o más tarde promediaron 2165 kcal, frente a 1920 en los otros 19. Las dos cosas son patrones de tu registro, no prueban que ninguna sea la causa.",
                    },
                    { from: "user", text: "¿y los fines de semana?" },
                    {
                        from: "ai",
                        text: "Casi igual: los fines de semana promedias 2010 kcal y entre semana, 1993.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "También las bebidas",
                description:
                    "El seguimiento de alcohol está desactivado hasta que lo pides. Elige bebidas estándar de EE. UU. o unidades del Reino Unido, y cada bebida se calcula en gramos de alcohol según su tamaño y graduación. Si lo desactivas, se oculta, nunca se borra.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Activa el alcohol, en gramos junto a unidades del Reino Unido",
                    log_meal:
                        "Calcula el alcohol de la pinta según su tamaño y graduación",
                },
                messages: [
                    {
                        from: "user",
                        text: "¿puedes contar también lo que bebo? quiero beber un poco menos",
                    },
                    {
                        from: "ai",
                        text: "Claro. ¿Muestro el alcohol en bebidas estándar de EE. UU. o en unidades del Reino Unido?",
                    },
                    {
                        from: "user",
                        text: "unidades del Reino Unido, vivo en Mánchester",
                    },
                    {
                        from: "ai",
                        text: "Seguimiento de alcohol activado, en gramos junto a las unidades del Reino Unido.",
                    },
                    {
                        from: "user",
                        text: "me tomé una pinta de lager con la cena",
                    },
                    {
                        from: "ai",
                        text: "¿Qué graduación tenía? Las lager suelen tener entre un 4 y un 5%, y lo pone en el grifo o en la lata.",
                    },
                    { from: "user", text: "creo que 4%" },
                    {
                        from: "ai",
                        text: "Registrada con la cena: una pinta de 568 ml al 4% son 17,9 g de alcohol, 2,3 unidades del Reino Unido y unas 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Trae tu historial",
                description:
                    "¿Vienes de MyFitnessPal, Cronometer, Lose It! o MacroFactor? Primero revisa tu zona horaria, tu exportación se lee en el navegador, no se guarda nada hasta que confirmas la vista previa y reimportar el mismo archivo nunca duplica una comida.",
                toolNotes: {
                    start_meal_import:
                        "Abre en el chat el importador para tu archivo de exportación",
                    get_profile:
                        "Detecta que aún no hay zona horaria configurada",
                    set_timezone:
                        "Fija America/Chicago para que las comidas queden en hora local",
                },
                messages: [
                    {
                        from: "user",
                        text: "me paso desde MyFitnessPal. ¿puedes traerte mi diario de comidas? ya tengo la exportación",
                    },
                    {
                        from: "ai",
                        text: "Sí. Antes, una cosa: tu zona horaria no está configurada, así que las comidas importadas quedarían en hora UTC en vez de en tu hora local. ¿Dónde vives?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Configurada: America/Chicago. Ahora elige en el importador de abajo el CSV Nutrition-Summary de tu exportación de MyFitnessPal. Se lee en tu propio navegador y no se guarda nada hasta que confirmes la vista previa.",
                    },
                    {
                        from: "user",
                        text: "ha asignado las columnas, pero en nombre del alimento pone «no está en este archivo», ¿es normal?",
                    },
                    {
                        from: "ai",
                        text: "Es normal en MyFitnessPal: su exportación tiene una fila por comida y día, con los totales pero sin nombres de alimentos. Cada comida se etiqueta con su tipo de comida, con sus calorías y macros intactas.",
                    },
                    {
                        from: "user",
                        text: "603 comidas. ¿dice que se registrarán al mediodía?",
                    },
                    {
                        from: "ai",
                        text: "Sí, la exportación tiene fechas pero no horas. El mediodía deja cada comida en su día correcto en Chicago; lo único es que no verás a qué hora comiste de verdad.",
                    },
                    { from: "user", text: "¡listo! ¿ha entrado todo?" },
                    {
                        from: "ai",
                        text: "Todo: 603 comidas importadas y ninguna fallida.",
                    },
                ],
                cards: [
                    { kind: "import-meals", after: 3, step: "file" },
                    { kind: "import-meals", after: 3, step: "map" },
                    { kind: "import-meals", after: 5, step: "preview" },
                    { kind: "import-meals", after: 7, step: "done" },
                ],
            },
            {
                id: "export-data",
                title: "Llévate tus datos",
                description:
                    "Una sola petición reúne cada comida, registro de agua y pesaje, además de tus objetivos y ajustes, en un ZIP de archivos CSV con un README en inglés sencillo. Cada marca de tiempo indica su zona horaria, y meals.csv se vuelve a importar tal cual.",
                toolNotes: {
                    export_all_data:
                        "Comprime seis archivos y da un enlace privado válido 60 minutos",
                },
                messages: [
                    {
                        from: "user",
                        text: "mi dietista quiere ver mi registro de comidas. ¿me lo puedes sacar en una hoja de cálculo?",
                    },
                    {
                        from: "ai",
                        text: "Aquí lo tienes: un ZIP con 1204 comidas, 318 registros de agua y 64 pesajes, además de tus objetivos y ajustes. Tu registro de comidas es el meals.csv que va dentro, y se abre en Excel o Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "¿no le puedo mandar el enlace sin más?",
                    },
                    {
                        from: "ai",
                        text: "Mejor descárgalo y mándale el archivo. El enlace deja de funcionar a los 60 minutos, y cualquiera que lo tenga puede abrir toda tu exportación, peso y ajustes incluidos, no solo las comidas.",
                    },
                    {
                        from: "user",
                        text: "bueno saberlo. ¿podría restaurar desde ahí más adelante si hiciera falta?",
                    },
                    {
                        from: "ai",
                        text: "Tus comidas, sí. meals.csv se vuelve a importar directamente, y cualquier comida que aún tengas se reconoce por su id y se omite, así que nada se duplica. El agua, el peso, los objetivos y los ajustes van en el ZIP solo para que los conserves; no se pueden volver a importar.",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "En vivo · entre todos, hasta ahora",
        title: "Desayuno en un sitio, cena en otro.",
        sub: "Estadísticas de nutrición en vivo de todas las cuentas de Nutrition MCP (calorías, registros de comida, macros y peso perdido), actualizadas cada cinco segundos.",
        unitGroupLabel: "Unidades",
        unitMetricLabel: "Métrico",
        unitImperialLabel: "Imperial",
        refreshBefore: "Se actualiza cada 5 s · siguiente en ",
        refreshAfter: "s",
        sinceOpenLabel: "desde que abriste esta página",
        cards: {
            calories: "Calorías registradas",
            foodLogs: "Registros de comida",
            protein: "Proteína registrada",
            carbs: "Carbohidratos registrados",
            fat: "Grasa registrada",
            weightLost: "Peso perdido desde el 2 de julio de 2026",
            water: "Agua registrada",
        },
        foodLogsUnit: "registros",
        timezonesAfter:
            " zonas horarias · los días cambian a la medianoche de cada persona",
        mapNote:
            "tamaño del punto = proporción de cuentas · pasa el cursor por un punto",
        mapShare: "{share} de las cuentas",
        mapAriaLabel:
            "Mapa mundial de puntos con las cuentas de Nutrition MCP por zona horaria; los puntos más grandes indican una proporción mayor",
    },

    support: {
        eyebrow: "Siempre gratis",
        title: "Seguimiento de nutrición gratis. Sin nivel premium. Nunca.",
        sub: "Todas las herramientas, todos los widgets, todas las exportaciones: para todo el mundo, sin coste. Es el proyecto de código abierto de una sola persona, y el código tiene licencia MIT para que siga siendo así.",
        bullets: [
            "Las 36 herramientas y seis widgets incluidos",
            "Sin anuncios, sin ventas adicionales, sin funciones bloqueadas",
            "Exporta o elimina tus datos cuando quieras",
            "Alójalo tú mismo si lo prefieres: Dockerfile incluido",
        ],
        patreon: {
            eyebrow: "Opcional · Patreon",
            title: "Si te resulta útil, ayuda a mantener el servidor encendido.",
            sub: "El único coste es el hosting y la base de datos. Los mecenas lo cubren: cualquier cantidad, cancela cuando quieras. No se desbloquea nada; solo recibes antes las notas de desarrollo y tienes voz en lo que sale a continuación.",
            cta: "Apoyar en Patreon",
            starCta: "Mejor una estrella",
        },
        postsTitle: "Últimas publicaciones en Patreon",
        postsAll: "Todas las publicaciones",
        postLinkLabel: "Leer en Patreon",
    },

    contact: {
        eyebrow: "Contacto",
        title: "Di hola.",
        sub: "¿Encontraste un error, tienes una idea o se equivocó por completo con una comida? Escríbeme directamente: leo todos los mensajes.",
        emailAriaLabel: "Escribir a anton@nutrition-mcp.com",
        cards: {
            email: { title: "Correo", sub: "Lo que sea: la línea directa" },
            issues: {
                title: "Issues de GitHub",
                sub: "Errores y peticiones de funciones, en público",
            },
            patreon: {
                title: "Patreon",
                sub: "Notas de desarrollo, votaciones y chat con los mecenas",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Preguntas sobre Nutrition MCP.",
        subBefore:
            "Qué es, dónde funciona, cuánto cuesta y quién ve tus datos. ¿Falta algo? ",
        subLink: "Pregúntame directamente",
        subAfter: ".",
        categoriesLabel: "Filtrar preguntas por categoría",
        categories: {
            all: "Todas",
            basics: "Básico",
            clients: "Clientes",
            tracking: "Seguimiento",
            data: "Tus datos",
        },
    },
    faq: [
        // Básico
        {
            question: "¿Qué es Nutrition MCP?",
            visibleHtml:
                "Un servidor MCP (Model Context Protocol) gratuito y de código abierto para el seguimiento de nutrición. Conéctalo a Claude, ChatGPT, Cursor o cualquier cliente MCP y registra comidas, calorías, macros, agua y peso hablando.",
            category: "basics",
        },
        {
            question: "¿Qué es un servidor MCP?",
            visibleHtml:
                "Un pequeño servicio al que tu IA puede llamar mientras chateas. Nutrition MCP le da a Claude, ChatGPT, Cursor y compañía 36 herramientas de nutrición: registro, objetivos, tendencias, importación y exportación. Tú nunca ves las herramientas; solo hablas.",
            category: "basics",
        },
        {
            question: "¿Es gratis Nutrition MCP?",
            visibleHtml:
                "Sí. Sin nivel premium, sin anuncios, sin funciones bloqueadas. Solo necesitas una cuenta de Claude o ChatGPT para conectarte. Las donaciones en Patreon cubren la factura del servidor.",
            category: "basics",
        },
        // Clientes
        {
            // La respuesta visible ya indica la URL del servidor, así que
            // el JSON-LD no necesita la anulación que llevaba la página
            // anterior: quitar las etiquetas da la misma frase.
            question: "¿Funciona con ChatGPT?",
            visibleHtml:
                "Sí. En ChatGPT en la web, abre Configuración → Apps → Crear app, pega <code>https://nutrition-mcp.com/mcp</code> con autenticación OAuth e inicia sesión. Funciona en todos los planes de ChatGPT.",
            category: "clients",
        },
        {
            question: "¿Funciona con Cursor, VS Code o Claude Code?",
            visibleHtml:
                "Sí: con cualquier cliente compatible con servidores MCP remotos por HTTP. Añade la URL a tu <code>mcp.json</code> o, en Claude Code, ejecuta <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "¿Funciona en mi móvil?",
            visibleHtml:
                "Sí. Conéctalo una vez en Claude o ChatGPT en la web o en el escritorio y aparecerá automáticamente en sus apps de iOS y Android.",
            category: "clients",
        },
        // Seguimiento
        {
            // Conservada tal cual de la página anterior (la cafeína se
            // nombra "en miligramos", igual que en la fuente inglesa
            // fijada por src/site-copy.test.ts).
            question: "¿Qué puedo registrar?",
            visibleHtml:
                "Calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y agua en cada entrada, descritos en lenguaje natural o extraídos del código de barras de un producto vía Open Food Facts. La cafeína también se controla, en miligramos, la unidad que usa toda etiqueta, y no aporta calorías. El alcohol también se controla, en gramos de etanol puro, en cuanto lo activas. También puedes registrar tu peso corporal en kg o lb y seguir tendencias hacia un peso objetivo. Consulta resúmenes diarios, busca comidas por rango de fechas, actualiza o elimina entradas pasadas, define objetivos y monitorea tendencias a lo largo del tiempo.",
            category: "tracking",
        },
        {
            question: "¿Qué tan preciso es el conteo de calorías?",
            visibleHtml:
                "Las cifras son estimaciones a partir de lo que describes, como las haría un amigo con conocimientos: sirven para ver tendencias, no para tomar decisiones médicas. Los escaneos de códigos de barras usan datos de Open Food Facts.",
            category: "tracking",
        },
        {
            question: "¿Controla el alcohol?",
            visibleHtml:
                "Solo si lo activas. El seguimiento de alcohol está desactivado por defecto; una vez activado, las bebidas se registran en gramos de etanol y se muestran como bebidas estándar de EE. UU. o unidades del Reino Unido.",
            category: "tracking",
        },
        // Tus datos
        {
            // La frase final refleja la inglesa: la exportación saca todo,
            // pero solo las comidas pueden volver a entrar.
            question:
                "¿Puedo importar mi historial de MyFitnessPal o Cronometer?",
            visibleHtml:
                "Sí. Importa tu historial de comidas desde MyFitnessPal, Cronometer, Lose It!, MacroFactor o cualquier CSV mapeando sus columnas, hasta 50 filas por llamada. Por ahora, las comidas son la única parte que se puede volver a importar.",
            category: "data",
        },
        {
            // Debe nombrar comidas, agua, peso, objetivos y perfil: los
            // cinco archivos del ZIP de exportación.
            question: "¿Quién puede ver mis datos y puedo exportarlos?",
            visibleHtml:
                "Solo tú. Exporta todo (comidas, agua, peso, objetivos y perfil) como un ZIP de archivos CSV con un enlace de descarga de 60 minutos, o elimina tu cuenta por completo. Licencia MIT, así que también puedes alojarlo tú mismo.",
            category: "data",
        },
        {
            // Conservada de la página anterior.
            question: "¿Puedo autoalojarlo?",
            visibleHtml:
                'Sí. Nutrition MCP es de código abierto (MIT). Puedes ejecutar tu propia instancia con tu propio proyecto de Supabase: el <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repositorio de GitHub</a> incluye una guía completa de autoalojamiento y un Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Tu próxima comida está a una frase de distancia.",
        sub: "Seguimiento de nutrición gratuito y de código abierto para Claude, ChatGPT y Cursor; y tus datos son tuyos para exportarlos o eliminarlos cuando quieras.",
        primary: "Conectar ahora",
        secondary: "Estrella en GitHub",
    },
};

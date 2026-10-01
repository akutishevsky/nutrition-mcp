// Spanish (es) translation of IndexDoc — see src/copy/index.ts for the
// canonical shape and the rules for the trusted-HTML fields. Only the
// human-readable text changed here: every tag, placeholder ({n}, {tool}),
// URL, brand name, tool name and structural field of the demo conversations
// (photo, card, meal.type, id, from, download, cards, toolNotes keys) is
// identical to the English source.
//
// Locale notes: numbers follow Spanish conventions as CLDR has them — no
// separator in a four-digit figure ("2000", "1830"), a decimal comma
// ("78,4 kg") — the same formatting the cards on the page get from
// toLocaleString("es"). The tool count ("36") is hand-typed here exactly as
// in index.ts — see CLAUDE.md's "Registered tool set".

import type { IndexDoc } from "./index.js";

export const INDEX_ES: IndexDoc = {
    title: "Nutrition MCP — Contador de calorías para Claude y ChatGPT",
    metaDescription:
        "Registra comidas, calorías y macros hablando con Claude o ChatGPT. Servidor MCP gratuito y de código abierto con códigos de barras, peso y exportación de datos.",
    ogDescription:
        "Registra comidas, calorías y macros hablando con Claude o ChatGPT. Servidor MCP gratuito y de código abierto con códigos de barras, peso y exportación de datos.",
    keywords:
        "rastreador de nutrición, rastreador de comidas, servidor MCP, Claude AI, ChatGPT, contador de calorías, rastreador de macros, escáner de código de barras, registro de comidas, rastreador de dieta, rastreador de peso, registro de peso, nutrición con IA, Model Context Protocol",

    hero: {
        titleBeforeEm: "Controla tu nutrición ",
        titleEm: "hablando",
        titleAfterEm: " con tu IA.",
        lead: "Conecta Claude o ChatGPT y simplemente di lo que comiste. Calorías y macros, registrados automáticamente.",
        ctaPrimary: "Instalación rápida",
        ctaSecondary: "Apoyar",
        moreExamples: "Más ejemplos",
        chat: {
            photoAlt:
                "Foto: un smoothie bowl con plátano, frutos rojos y granola por encima, y un americano al lado",
            pauseLabel: "Pausar la demo",
            replayLabel: "Repetir la demo",
            exchanges: [
                {
                    photo: true,
                    userText: "desayuno + americano",
                    aiText: "Un smoothie bowl, casero por lo que parece. Lo has tomado de dos maneras: con granola y miel, o solo con fruta. ¿Cuál es este?",
                },
                {
                    userText: "granola y miel, una cucharada bien llena",
                    aiText: "Entendido. ¿Y el americano? ¿Sencillo o doble, y con leche o sin?",
                },
                {
                    userText: "doble, un chorrito de leche de avena",
                    aiText: "Entonces: el bowl con un puñado de granola y 1 cda. de miel, y un americano doble con un chorrito de leche de avena. Unas 480 kcal y 21 g de proteína. ¿Lo registro?",
                },
                {
                    userText: "sí",
                    aiText: "Desayuno registrado: 480 kcal, 21 g de proteína y 126 mg de cafeína. Ya llevas 51 g de azúcar, de un límite de 60 g.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 bowl: yogur griego, plátano, frutos rojos) con granola (1 puñado) y miel (1 cda.); americano doble con un chorrito de leche de avena",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "almuerzo: lo que sobró del salteado de anoche, la misma ración. y una botella de agua de 500 ml",
                    aiText: "Almuerzo registrado, igual que anoche: 620 kcal y 54 g de proteína, más 500 ml de agua.",
                    meal: {
                        description:
                            "Sobras del salteado (1 ración, igual que anoche)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "tentempié: le he robado 6 patatas fritas a mi hijo. no me juzgues",
                    aiText: "Nadie te juzga. Unas 50 kcal, registradas como tentempié.",
                    meal: {
                        description: "Patatas fritas (6, del plato de mi hijo)",
                        type: "snack",
                    },
                },
                {
                    userText: "¿qué me queda para la cena?",
                    aiText: "Te quedan 850 kcal y te faltan 84 g de proteína. Llevas 59 g de azúcar, de un límite de 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "¿y qué tal va mi peso?",
                    aiText: "Has bajado 1,4 kg desde el 11 de febrero, de 80,2 a 78,8 kg. Te faltan 3,8 kg para tu objetivo de 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Tres pasos. Ninguna app que aprender.",
        steps: [
            {
                title: "Conecta una vez",
                body: "Funciona con cualquier cliente de IA compatible con servidores MCP remotos: Claude, ChatGPT y más. Sin instalación, sin claves de API.",
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

    install: {
        title: "Conéctate en menos de un minuto",
        sub: "Funciona con cualquier cliente MCP compatible con OAuth 2.0 con PKCE. En la primera conexión creas una cuenta con Google o con un correo y una contraseña; inicia sesión de la misma forma para conservar tus datos.",
        copyAriaLabel: "Copiar URL del servidor",
        tabsLabel: "Elige tu cliente de IA",
        claude: {
            cta: "Añadir a Claude",
            steps: [
                "En la página del directorio, haz clic en <strong>Conectar</strong> y luego continúa con Google o inicia sesión con un correo y una contraseña.",
                "Listo. Funciona de inmediato y aparece automáticamente en tus apps de iOS y Android.",
            ],
            note: "Funciona en todos los planes de Claude, incluido el gratuito. Para añadirlo a mano, usa Personalizar → Conectores → Añadir conector personalizado con https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Abre <strong>ChatGPT en la web</strong> → <strong>Configuración</strong> → <strong>Apps</strong>.",
                "Haz clic en <strong>Crear app</strong> al final de la ventana emergente. Si no la ves, activa el <strong>Modo desarrollador</strong> en <strong>Configuración avanzada</strong>.",
                "Dale un nombre, por ejemplo <strong>Nutrition</strong>.",
                "En <strong>Conexión</strong>, pega <code>https://nutrition-mcp.com/mcp</code>.",
                "En <strong>Autenticación</strong>, elige <strong>OAuth</strong>; deja todo lo demás como está.",
                'Marca <strong>"Entiendo y quiero continuar"</strong>.',
                "Haz clic en <strong>Crear</strong>.",
                "Haz clic en <strong>Iniciar sesión con Nutrition</strong>: se abre la página de inicio de sesión; continúa con Google o inicia sesión con un correo y una contraseña.",
                "Listo. Funciona de inmediato y aparece automáticamente en tus apps de iOS y Android.",
            ],
        },
        other: {
            note: "Añade la configuración de arriba a tu cliente (Cursor, VS Code, Claude Code y más). Windsurf usa <code>serverUrl</code> en vez de <code>url</code>. En Claude Code, ejecuta <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Tu cliente gestiona el inicio de sesión OAuth automáticamente.",
        },
        otherTabLabel: "Otros clientes",
    },

    onboarding: {
        title: "Configúralo una vez, o simplemente empieza a hablar",
        sub: "Esto es completamente opcional: Nutrition MCP funciona en cuanto te conectas. Si quieres, estos tres pasos rápidos lo hacen más preciso, pero puedes pasar directo a registrar.",
        justSay: "Simplemente di ",
        steps: [
            {
                title: "Define tu zona horaria",
                body: "para que los días cambien a tu medianoche local y los totales de hoy se mantengan precisos estés donde estés.",
                say: "Pon mi zona horaria en la de Nueva York",
            },
            {
                title: "Define tus objetivos",
                body: "metas diarias de calorías, macros y agua, además de un peso objetivo opcional y tu unidad de peso preferida (kg o lb), para seguir tu progreso.",
                say: "Ajusta mi objetivo diario a 2000 calorías y 150 g de proteína",
            },
            {
                title: "Define tu idioma",
                body: "el idioma en el que se muestran los widgets del chat (paneles, gráficos), no lo que la IA te responde por escrito.",
                say: "Muéstrame los widgets en alemán",
            },
            {
                title: "Empieza a registrar",
                body: "simplemente di lo que comiste, envía una foto o escanea un código de barras. Eso es todo.",
                say: "Desayuné avena con frutos rojos",
            },
        ],
        note: "Todo esto es opcional. Puedes hacerlo ahora, más tarde o nunca: simplemente empieza a registrar y ajusta esto cuando quieras.",
        toolsCta: {
            heading: "¿Curiosidad por saber qué puede hacer de verdad?",
            body: "Explora las 36 herramientas (registro, códigos de barras, agua, peso, objetivos y tendencias) con una descripción y una frase de ejemplo para cada una.",
            arrow: "Explorar las herramientas",
        },
    },

    examples: {
        title: "Solo tienes que hablarle.",
        sub: "Algunas de las cosas que puedes hacer, con solo hablar.",
        prevLabel: "Ejemplo anterior",
        nextLabel: "Siguiente ejemplo",
        pickerLabel: "Elige un ejemplo",
        carouselLabel: "Ejemplos",
        threadLabel: "Conversación",
        moreToolsLabel: "También usa",
        toolLinkLabel:
            "{tool} en la página de herramientas (se abre en una pestaña nueva)",
        photoMealAlt:
            "Foto: un plato de borsch con una cucharada de crema agria y eneldo, y una rebanada de pan de centeno al lado",
        photoPackageAlt:
            "Foto: el código de barras de una lata de Coca-Cola, número 5449000000996",
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
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Avena con leche y arándanos (1 tazón) y café solo (1 taza)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografía tu plato",
                description:
                    "Una foto abre una conversación, no una conjetura. Te pregunta si la comida era casera o de restaurante, busca en tus registros anteriores lo que la foto no puede mostrar, quiere saber cuánto comiste en medidas sencillas y no registra nada hasta que apruebas el resumen.",
                toolNotes: {
                    search_meals:
                        "Encuentra tu borsch anterior en Tsybulya y lo que llevaba",
                    log_meal:
                        "Lo registra con el nombre del restaurante cuando dices que sí",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "almuerzo",
                    },
                    {
                        from: "ai",
                        text: "Parece borsch con crema agria y una rebanada de pan de centeno. ¿Casero o de restaurante? Si era de un restaurante, ¿de cuál?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, en Podil, en Kiev",
                    },
                    {
                        from: "ai",
                        text: "Ya has registrado borsch en Tsybulya dos veces, las dos la versión de ternera con crema agria. ¿El mismo esta vez? ¿Y te terminaste el plato y el pan?",
                    },
                    {
                        from: "user",
                        text: "el mismo, todo, y el pan también",
                    },
                    {
                        from: "ai",
                        text: "Entonces: borsch de ternera con crema agria (1 plato, entero) y pan de centeno (1 rebanada) en Tsybulya, Podil, Kiev. Unas 520 kcal y 24 g de proteína, estimadas, no cifras publicadas. ¿Lo registro como almuerzo?",
                    },
                    {
                        from: "user",
                        text: "sí",
                    },
                    {
                        from: "ai",
                        text: "Almuerzo registrado: 520 kcal · 24 g de proteína · 43 g de carbohidratos · 27 g de grasa · 7 g de fibra · 10 g de azúcar.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Borsch de ternera con crema agria (1 plato, entero) y pan de centeno (1 rebanada) en Tsybulya, Podil, Kiev",
                ],
            },
            {
                id: "scan-barcode",
                title: "Escanea un código de barras",
                description:
                    "Fotografía el envase: los dígitos bajo el código de barras se buscan en Open Food Facts y te pregunta cuánto tomaste. Open Food Facts no incluye la cafeína, así que sale de la etiqueta o de cantidades habituales; si falta la fibra o el azúcar, se estima en vez de dejarlo en blanco.",
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
                    {
                        from: "user",
                        text: "entera",
                    },
                    {
                        from: "ai",
                        text: "Registrada con el almuerzo: 139 kcal, 35 g de azúcar y 33 mg de cafeína según la etiqueta de la lata, porque Open Food Facts no incluye la cafeína. Y sobre lo mala que es: ese azúcar ya supera por sí solo la mitad de tu límite diario de 60 g, y Open Food Facts le da Nutri-Score E y NOVA 4, ultraprocesado.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: ["Coca-Cola (lata de 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Fija objetivos y revisa",
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
                        text: "Para adultos sanos, la EFSA y la FDA lo sitúan en hasta 400 mg al día, unas cuatro tazas de café de filtro, y en el embarazo la EFSA aconseja 200 mg. El límite lo decides tú; ¿pongo 400?",
                    },
                    {
                        from: "user",
                        text: "sí, 400",
                    },
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
                        text: "Llevas 1540 kcal y 104 g de proteína, así que te quedan 460 kcal y 56 g de proteína. Lo más justo es el azúcar: 40 de tus 60 g de límite, así que te quedan 20 g. La cafeína va por 130 de 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Revisa la semana",
                description:
                    "Pregunta qué tal fue la semana y el widget de tendencias se abre en el chat con tus medias y días registrados. Cambia entre 7, 14 y 30 días o toca un nutriente para graficarlo, sin otra petición. También puede decirte tus rachas y los días que cumpliste el objetivo.",
                toolNotes: {
                    get_trends:
                        "Promedia tus últimos 7, 14 y 30 días y abre el widget de tendencias",
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
                    {
                        from: "user",
                        text: "¿y el azúcar?",
                    },
                    {
                        from: "ai",
                        text: "Ese es el que hay que vigilar. Promedió 52 g y superó tu límite de 60 g en 4 de los 13 días.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Controla tu peso",
                description:
                    "Registra tu peso en kg o lb y ve la tendencia bajo el ruido del día a día: una media suavizada, el cambio del mes y lo que te falta para tu objetivo. Una lectura imposible, como una coma decimal olvidada, se detecta antes de guardarse.",
                toolNotes: {
                    log_weight:
                        "Rechaza 784 kg por inverosímil y luego guarda 78,4 kg",
                    get_weight_trends:
                        "Suaviza 30 días en medias móviles y la distancia al objetivo",
                },
                messages: [
                    {
                        from: "user",
                        text: "me acabo de pesar, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg está fuera del rango plausible de peso corporal (20–500 kg), así que no se ha guardado nada. ¿Querías decir 78,4 kg?",
                    },
                    {
                        from: "user",
                        text: "jaja sí, se me olvidó la coma. ¿cómo voy?",
                    },
                    {
                        from: "ai",
                        text: "Guardados 78,4 kg. Has bajado 1,8 kg desde el 11 de febrero, unos 0,4 kg por semana, y tu media de 7 días es de 78,7 kg. Te faltan 3,4 kg para tu objetivo de 75 kg.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
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
                    {
                        from: "user",
                        text: "¿y los fines de semana?",
                    },
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
                    "El alcohol permanece oculto hasta que activas su seguimiento. Elige bebidas estándar de EE. UU. o unidades del Reino Unido, y cada bebida se calcula en gramos de alcohol según su tamaño y graduación. Si lo desactivas más tarde, el alcohol vuelve a ocultarse; no se borra.",
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
                    {
                        from: "user",
                        text: "creo que 4%",
                    },
                    {
                        from: "ai",
                        text: "Registrada con la cena: una pinta de 568 ml al 4% son 17,9 g de alcohol, 2,3 unidades del Reino Unido y unas 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Trae tu historial",
                description:
                    "¿Vienes de MyFitnessPal, Cronometer, Lose It! o MacroFactor? El importador se abre en el chat, lee y asigna las columnas de tu exportación en el navegador, no guarda nada hasta que confirmas una vista previa y no duplica una comida si vuelves a importar el mismo archivo con la misma zona horaria. Además, te avisa si falta la zona horaria antes de empezar.",
                toolNotes: {
                    start_meal_import:
                        "Abre en el chat el importador para tu archivo de exportación",
                    set_timezone:
                        "Fija America/Chicago para que las comidas queden en hora local",
                },
                messages: [
                    {
                        from: "user",
                        text: "me paso desde myfitnesspal. ¿puedes traerte mi diario de comidas? ya tengo la exportación",
                    },
                    {
                        from: "ai",
                        text: "Tienes el importador abierto aquí abajo. Una cosa antes de que elijas el archivo: tu cuenta no tiene zona horaria configurada, así que las horas se leerían como UTC. ¿Dónde vives?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Zona horaria configurada: America/Chicago. Ahora elige el CSV Nutrition-Summary de tu exportación de MyFitnessPal. Se lee en tu propio navegador y no se guarda nada hasta que confirmes la vista previa.",
                    },
                    {
                        from: "user",
                        text: "ha asignado las columnas, pero ¿por qué en el nombre del alimento pone «no está en este archivo»?",
                    },
                    {
                        from: "ai",
                        text: "Es normal en MyFitnessPal: su exportación tiene una fila por comida y día, con los totales pero sin nombres de alimentos. En su lugar, cada comida se etiqueta con su tipo, con sus calorías y macros intactos.",
                    },
                    {
                        from: "user",
                        text: "603 comidas. ¿dice que se registrarán al mediodía?",
                    },
                    {
                        from: "ai",
                        text: "Así es: la exportación tiene fechas pero no horas de comida, así que cada una se coloca al mediodía local. Eso deja cada comida en su día correcto en Chicago; lo único es que no verás a qué hora comiste de verdad.",
                    },
                    {
                        from: "user",
                        text: "¡listo! ¿ha entrado todo?",
                    },
                    {
                        from: "ai",
                        text: "Todo: 603 comidas importadas y ninguna fallida.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Llévate tus datos",
                description:
                    "Una sola petición reúne todo lo que se guarda sobre ti (comidas, agua, pesajes, objetivos, ajustes del perfil, el registro de tu cuenta, la telemetría de uso y las conexiones de apps) en un ZIP de archivos CSV con un README. Las marcas de tiempo usan tu zona horaria, y meals.csv se vuelve a importar tal cual.",
                toolNotes: {
                    export_all_data:
                        "Empaqueta ocho CSV y un README en un ZIP con un enlace de 60 minutos",
                },
                messages: [
                    {
                        from: "user",
                        text: "mi dietista quiere ver mi registro de comidas. ¿me lo puedes sacar en una hoja de cálculo?",
                    },
                    {
                        from: "ai",
                        text: "Aquí lo tienes: un ZIP con 1204 comidas, 318 registros de agua y 64 registros de peso, además de tus objetivos, los ajustes del perfil, los datos de tu cuenta, la telemetría de uso de herramientas y las conexiones de apps. Tu registro de comidas es el meals.csv que va dentro, y se abre en Excel o Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "¿no le puedo mandar el enlace sin más?",
                    },
                    {
                        from: "ai",
                        text: "Mejor descárgalo y mándale el archivo. El enlace deja de funcionar a los 60 minutos, y cualquiera que lo tenga puede abrir toda tu exportación, con el peso, los datos de la cuenta y los ajustes incluidos, no solo las comidas.",
                    },
                    {
                        from: "user",
                        text: "vale, bueno saberlo. ¿podría restaurar desde ahí más adelante si hiciera falta?",
                    },
                    {
                        from: "ai",
                        text: "Tus comidas, sí. meals.csv usa los mismos nombres de columna que el importador, así que se vuelve a importar directamente, y las comidas que ya están en tu registro se reconocen y se omiten, así que nada se duplica. Los demás archivos son solo para que los conserves; no se pueden volver a importar.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Desayuno en un sitio, cena en otro.",
        sub: "Estadísticas de nutrición en vivo de todas las cuentas de Nutrition MCP (calorías, registros de comida, macros y peso perdido), actualizadas cada cinco segundos.",
        liveLabel: "En vivo",
        unitGroupLabel: "Unidades",
        unitMetricLabel: "Métrico",
        unitImperialLabel: "Imperial",
        unitKgLabel: "Métrico (kg)",
        unitLbLabel: "Imperial (lb)",
        refreshBefore: "Se actualiza cada 5 s · siguiente en ",
        refreshAfter: " s",
        sinceOpenLabel: "desde que abriste esta página",
        calCaption: "Calorías registradas",
        cards: {
            foodLogs: "Registros de comida",
            protein: "Proteína registrada",
            carbs: "Carbohidratos registrados",
            fat: "Grasa registrada",
            weightLost: "Peso perdido desde el 2 de julio de 2026",
            water: "Agua registrada",
        },
        foodLogsUnit: { one: "registro", other: "registros" },
        timezonesAfter:
            " zonas horarias · los días cambian a la medianoche de cada persona",
        mapNote: "tamaño del punto = proporción de perfiles",
        mapAriaLabel:
            "Mapa mundial de las zonas horarias configuradas en los perfiles; cada una aparece solo cuando la usan al menos tres perfiles",
        foot: "Totales de todas las cuentas, actualizados a medida que se registran comidas. Los datos individuales nunca se muestran.",
    },

    features: {
        title: "Lo que puedes controlar",
        cards: [
            {
                title: "Comidas en lenguaje natural",
                body: "Di qué comiste: tu IA estima calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína en miligramos, y lo registra.",
            },
            {
                title: "Escanea un código de barras",
                body: "Fotografía o escribe el código de barras de un producto y obtén macros, fibra y azúcar desde Open Food Facts, ajustados a lo que comiste.",
            },
            {
                title: "Objetivos y progreso",
                body: "Define metas diarias de calorías, macros, fibra y agua, además de límites de azúcar, cafeína y alcohol a no superar, y consulta el progreso en tiempo real.",
            },
            {
                title: "Resúmenes y tendencias",
                body: "Desgloses diarios y semanales, tendencias de 7/14/30 días, rachas y patrones de comida recurrentes.",
            },
            {
                title: "Registro de agua",
                body: "Controla la hidratación en mililitros junto con tus comidas y revísala por día.",
            },
            {
                title: "Seguimiento de peso",
                body: "Registra tu peso corporal en kg o lb, consulta tendencias de 7/14/30 días y sigue el progreso hacia un peso objetivo.",
            },
            {
                title: "Consciente de la zona horaria",
                body: "Los días cambian en tu hora local, estés donde estés en el mundo.",
            },
            {
                title: "Importa desde otra app",
                body: "Trae tu historial de comidas desde MyFitnessPal, Cronometer, Lose It! o MacroFactor, o cualquier otro CSV, mapeando sus columnas tú mismo. Confirmas qué se añade antes de que se guarde nada.",
            },
            {
                title: "Exporta y sé dueño de tus datos",
                body: "Llévate todo lo que almacenamos sobre ti (comidas, agua, peso, objetivos y perfil, además del registro de tu cuenta, la telemetría de uso y las apps conectadas) como un único ZIP de archivos CSV. Por ahora, las comidas son la única parte que se puede volver a importar. O elimina tu cuenta y tus datos, con la misma facilidad.",
            },
        ],
    },

    why: {
        title: "Hablar le gana a tocar.",
        sub: "Escanea un código de barras o simplemente di lo que comiste: sin bucear en una base de datos, sin abrir otra app.",
        oldHeading: "Apps tradicionales",
        oldItems: [
            "Buscar en una base de datos cada alimento",
            "Corregir a mano entradas erróneas de la base de datos",
            "Otra app más que abrir, a menudo tras un muro de pago",
            "Registro manual tedioso",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Describe las comidas en lenguaje natural",
            "Calorías y macros estimados por ti",
            "Funciona dentro de Claude o ChatGPT, gratis",
            "Pide tendencias, resúmenes y objetivos",
        ],
        noteHtml:
            '¿Vienes de una app concreta? Descubre cómo se compara Nutrition MCP con <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer y otros trackers</a>.',
    },

    trust: [
        {
            label: "Privado por defecto",
            small: "Nunca se venden, se comparten ni se usan para publicidad.",
        },
        {
            label: "Código abierto",
            small: "Audítalo o aloja tu propia instancia.",
        },
        {
            label: "Exporta cuando quieras",
            small: "Todo lo que guardamos, en CSV y en un solo ZIP.",
        },
        {
            label: "Elimina al instante",
            small: "Borra tu cuenta y tus datos.",
        },
    ],

    support: {
        title: "Ayuda a mantenerlo en marcha.",
        sub: "Nutrition MCP es gratis y sin anuncios. Patreon cubre las facturas del servidor y la base de datos.",
        updatesTitle: "Lo último en Patreon",
        updatesBadge: "Gratis",
        updatesNote: "Gratis para leer — no necesitas ser miembro.",
        updatesPrevLabel: "Actualización anterior",
        updatesNextLabel: "Actualización siguiente",
        updatesDotLabel: "Actualización",
        postLinkLabel: "Leer en Patreon",
        free: {
            tier: "Miembro gratuito",
            price: "0 $",
            desc: "Sigue el proyecto: recibe noticias y novedades sobre el servidor, herramientas nuevas y lo que viene a continuación.",
            cta: "Seguir en Patreon",
        },
        paid: {
            tier: "Miembro de pago",
            price: "Paga lo que quieras",
            desc: "Si Nutrition MCP te resulta útil, puedes ayudar con los costes de hosting y base de datos. Todos tienen las mismas funciones, también quienes apoyan, y sigue siendo gratis para todos.",
            cta: "Convertirte en mecenas",
        },
    },

    cta: {
        title: "Empieza a registrar en menos de un minuto.",
        sub: "Gratis y de código abierto: funciona con la IA que ya usas.",
        primary: "Instalación rápida",
        secondary: "Danos una estrella en GitHub",
    },

    contact: {
        title: "¿Preguntas o comentarios?",
        sub: "¿Encontraste un error, quieres una función o simplemente tienes una pregunta? Escríbeme directamente: leo todos los mensajes.",
        cta: "Enviar un correo",
    },

    faqSection: {
        title: "Preguntas frecuentes",
    },
    faq: [
        {
            question: "¿Qué es Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP es un servidor gratuito y de código abierto del Model Context Protocol (MCP) que convierte a Claude, ChatGPT o cualquier otro cliente MCP en un contador de calorías y macros. En vez de buscar en una base de datos de alimentos, le dices a tu IA qué comiste y ella registra las calorías, los macros, la fibra, el azúcar y la cafeína en tu propio diario de comidas.",
        },
        {
            question: "¿Qué es el Model Context Protocol (MCP)?",
            visibleHtml:
                "El Model Context Protocol es un estándar abierto que permite a asistentes de IA como Claude y ChatGPT conectarse a herramientas y fuentes de datos externas. Un servidor MCP ofrece capacidades concretas (aquí, seguimiento de nutrición) que la IA puede usar durante una conversación. Piénsalo como un sistema de plugins para asistentes de IA.",
        },
        {
            question: "¿Cómo contar calorías con Claude o ChatGPT?",
            visibleHtml:
                "Conecta Nutrition MCP una vez (en Claude, desde el directorio de conectores; en ChatGPT, como app personalizada con la URL del servidor) e inicia sesión. Después dile a tu IA qué comiste con tus propias palabras, muéstrale una foto de la comida o dale el código de barras de un producto. Tu IA estima las calorías, la proteína, los carbohidratos, la grasa, la fibra y el azúcar, y Nutrition MCP guarda la entrada en tu diario de comidas. Pide los totales de hoy, las tendencias semanales o tu progreso hacia tus objetivos cuando quieras.",
        },
        {
            // La respuesta visible omite deliberadamente la URL del servidor
            // (ya está indicada en otra parte de la página); la respuesta
            // del JSON-LD, leída de forma independiente por los buscadores,
            // la indica explícitamente. Este desajuste es anterior a esta
            // extracción — se conserva tal cual en vez de reconciliarlo en
            // silencio (ver la nota equivalente en src/copy/index.ts).
            question: "¿Funciona con ChatGPT?",
            visibleHtml:
                "Sí. En ChatGPT en la web, abre Configuración → Apps, crea una app personalizada con la URL del servidor usando OAuth, e inicia sesión. Para crear una app personalizada hace falta el modo desarrollador de ChatGPT, que OpenAI ofrece en algunos planes de ChatGPT.",
            jsonLdText:
                "Sí. En ChatGPT en la web, abre Configuración → Apps, crea una app personalizada con la URL del servidor https://nutrition-mcp.com/mcp usando OAuth, e inicia sesión. Para crear una app personalizada hace falta el modo desarrollador de ChatGPT, que OpenAI ofrece en algunos planes de ChatGPT.",
        },
        {
            question: "¿Qué otros clientes son compatibles?",
            visibleHtml:
                "Cualquier cliente MCP compatible con OAuth 2.0 con PKCE, incluyendo Claude.ai, las apps de escritorio y móvil de Claude, Claude Code, Cursor, Windsurf y VS Code.",
        },
        {
            question: "¿Puedo autoalojarlo?",
            visibleHtml:
                'Sí. Nutrition MCP es de código abierto (MIT). Puedes ejecutar tu propia instancia con tu propio proyecto de Supabase: el <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repositorio de GitHub</a> incluye una guía completa de autoalojamiento y un Dockerfile.',
        },
        {
            question: "¿Es gratis Nutrition MCP?",
            visibleHtml:
                "Sí, es completamente gratis: sin plan de pago, sin anuncios, sin costes ocultos. Necesitas una app de IA compatible con conectores MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas la primera vez que te conectas. Las donaciones voluntarias en Patreon ayudan a cubrir los costes del servidor y no desbloquean nada.",
        },
        {
            question: "¿Qué puedo registrar?",
            visibleHtml:
                "Calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y agua en cada entrada, descritos en lenguaje natural o extraídos del código de barras de un producto vía Open Food Facts. La cafeína también se controla, en miligramos, la unidad que usa toda etiqueta, y no aporta calorías. El alcohol también puede controlarse, en gramos de etanol puro; se muestra en cuanto activas su seguimiento. También puedes registrar tu peso corporal en kg o lb y seguir tendencias hacia un peso objetivo. Consulta resúmenes diarios, busca comidas por rango de fechas, actualiza o elimina entradas pasadas, define objetivos y monitorea tendencias a lo largo del tiempo.",
        },
        {
            question: "¿Qué precisión tiene el conteo de calorías?",
            visibleHtml:
                "Son estimaciones. Para una comida que describes o fotografías, tu IA estima las cifras; para un código de barras, salen de los datos de la etiqueta del producto en Open Food Facts, que tu IA ajusta a la cantidad que tomaste. Ambas pueden fallar, así que comprueba lo que sea importante: puedes corregir o eliminar cualquier entrada con solo pedirlo. Nutrition MCP es una herramienta de registro, no consejo médico ni dietético: consulta a un médico o a un dietista-nutricionista antes de tomar decisiones sobre tu salud, sobre todo si estás embarazada, tienes una afección médica o antecedentes de trastornos de la conducta alimentaria.",
        },
        {
            question: "¿Controla el alcohol?",
            visibleHtml:
                "Sí, de forma opcional: el seguimiento de alcohol está desactivado por defecto, y el alcohol permanece oculto en tus comidas, objetivos y resúmenes hasta que lo activas. Entonces las bebidas se muestran en gramos de etanol puro y como bebidas estándar de EE. UU. o unidades del Reino Unido, lo que prefieras. Nada infiere el alcohol por ti: solo se registra a partir de una bebida que anotas o de una columna de alcohol en un archivo que importas, y una bebida que anotas se guarda aunque el seguimiento esté desactivado. Desactivarlo de nuevo vuelve a ocultar el alcohol y hace que el importador deje de leer columnas de alcohol; no es un interruptor de borrado, y tu exportación siempre incluye lo que registraste. Para eliminar una cifra de alcohol, borra la comida a la que pertenece.",
        },
        {
            question:
                "¿Puedo importar mi historial desde MyFitnessPal u otra app?",
            visibleHtml:
                "Sí. Pide importar tu historial y se abre un importador en el chat: eliges el CSV que exportó tu app anterior, revisas cómo se emparejan sus columnas y ves qué se añadirá antes de confirmar. Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor se reconocen automáticamente, y cualquier otro CSV funciona mapeando las columnas tú mismo. Tu navegador lee el archivo, así que la IA nunca retranscribe tus filas. En clientes sin paneles integrados en el chat puedes pegar tu exportación en su lugar, y volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        },
        {
            question: "¿Son privados mis datos?",
            visibleHtml:
                'Tus registros se almacenan en la UE y están vinculados a tu propia cuenta, a la que accedes a través de las apps de IA que conectas. Nutrition MCP nunca vende tus datos, nunca los comparte con terceros y nunca los usa para publicidad; la página de inicio solo muestra totales anónimos de todo el sitio. Lo que tu IA lee a través de las herramientas se envía al proveedor de esa IA en virtud de tu propio acuerdo con él. Puedes exportar todo lo que guardamos sobre ti, o eliminar tu cuenta y todos sus datos, en cualquier momento: la <a href="/privacy" data-link="privacy">política de privacidad</a> tiene los detalles.',
        },
    ],
};

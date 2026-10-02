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
        "app de nutrición, registro de comidas, servidor MCP, Claude AI, ChatGPT, contador de calorías, contador de macros, escáner de código de barras, diario de comidas, app de dieta, control de peso, registro de peso, nutrición con IA, Model Context Protocol",

    hero: {
        titleBeforeEm: "Controla tu nutrición ",
        titleEm: "hablando",
        titleAfterEm: " con tu IA.",
        lead: "Conecta Claude o ChatGPT y cuéntale lo que comiste. Calorías y macros, registrados automáticamente.",
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
                    aiText: "Un smoothie bowl, casero por lo que parece. Lo has tomado de dos maneras: con granola y miel, o solo con fruta. ¿Cuál de las dos es?",
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
                        "almuerzo: lo que sobró del salteado de anoche, la misma porción. y una botella de agua de 500 ml",
                    aiText: "Almuerzo registrado, igual que anoche: 620 kcal y 54 g de proteína, más 500 ml de agua.",
                    meal: {
                        description:
                            "Sobras del salteado (1 porción, igual que anoche)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "snack: le robé 6 papas fritas a mi hijo. no me juzgues",
                    aiText: "Nadie te juzga. Unas 50 kcal, registradas como snack.",
                    meal: {
                        description: "Papas fritas (6, del plato de mi hijo)",
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
                body: "Funciona con cualquier cliente de IA compatible con servidores MCP remotos: Claude, ChatGPT y más. Sin instalar nada y sin claves de API.",
            },
            {
                title: "Solo di lo que comiste",
                body: "Descríbelo con tus palabras o envía una foto de tu comida, una captura de una app de reparto o un código de barras (busca el producto en internet). Los macros se registran solos.",
            },
            {
                title: "Controla y revisa",
                body: "Pide resúmenes diarios, tendencias semanales o tu progreso hacia tus objetivos, o exporta todo lo que has registrado en archivos CSV, totalmente gratis.",
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
                "Marca <strong>«Entiendo y quiero continuar»</strong>.",
                "Haz clic en <strong>Crear</strong>.",
                "Haz clic en <strong>Iniciar sesión con Nutrition</strong>: se abre la página de inicio de sesión. Continúa con Google o inicia sesión con un correo y una contraseña.",
                "Listo. Funciona de inmediato y aparece automáticamente en tus apps de iOS y Android.",
            ],
        },
        other: {
            note: "Añade la configuración de arriba a tu cliente (Cursor, VS Code, Claude Code y más). Windsurf usa <code>serverUrl</code> en vez de <code>url</code>. En Claude Code, ejecuta <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Tu cliente gestiona el inicio de sesión OAuth automáticamente.",
        },
        otherTabLabel: "Otros clientes",
    },

    onboarding: {
        title: "Configúralo una vez o empieza a hablar sin más",
        sub: "Es totalmente opcional: Nutrition MCP funciona desde el momento en que te conectas. Si quieres, estos tres pasos rápidos lo hacen más preciso, pero puedes empezar a registrar directamente.",
        justSay: "Solo di ",
        steps: [
            {
                title: "Define tu zona horaria",
                body: "para que el día cambie a tu medianoche local y los totales de hoy sean correctos estés donde estés.",
                say: "Pon mi zona horaria en Nueva York",
            },
            {
                title: "Define tus objetivos",
                body: "objetivos diarios de calorías, macros y agua, además de un peso objetivo opcional y tu unidad de peso preferida (kg o lb), para seguir tu progreso.",
                say: "Pon mi objetivo diario en 2000 calorías y 150 g de proteína",
            },
            {
                title: "Define tu idioma",
                body: "el idioma de los widgets del chat (paneles y gráficos), no el idioma en que te responde la IA.",
                say: "Muéstrame los widgets en alemán",
            },
            {
                title: "Empieza a registrar",
                body: "di lo que comiste, envía una foto o escanea un código de barras. Nada más.",
                say: "Desayuné avena con frutos rojos",
            },
        ],
        note: "Todo esto es opcional. Puedes hacerlo ahora, más tarde o nunca: empieza a registrar y ajústalo cuando quieras.",
        toolsCta: {
            heading: "¿Te preguntas qué puede hacer de verdad?",
            body: "Explora las 36 herramientas (registro, códigos de barras, agua, peso, objetivos y tendencias) con una descripción y una frase de ejemplo para cada una.",
            arrow: "Ver las herramientas",
        },
    },

    examples: {
        title: "Solo tienes que hablarle.",
        sub: "Algunas cosas que puedes hacer con solo hablar.",
        prevLabel: "Ejemplo anterior",
        nextLabel: "Siguiente ejemplo",
        pickerLabel: "Elige un ejemplo",
        carouselLabel: "Ejemplos",
        carouselRoleDescription: "carrusel",
        threadLabel: "Conversación",
        moreToolsLabel: "También usa",
        toolLinkLabel:
            "{tool} en la página de herramientas (se abre en una pestaña nueva)",
        photoMealAlt:
            "Foto: un plato de borsch con una cucharada de crema agria y eneldo, y una rebanada de pan de centeno al lado",
        photoPackageAlt:
            "Foto: el código de barras de un envase de yogur griego natural, número 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "Regístralo con tus palabras",
                description:
                    "Dilo como se lo contarías a un amigo. Si no dices la porción o de qué comida se trata, te lo pregunta antes de estimar. La fibra y el azúcar van en cada registro, la cafeína en todo lo que la lleve, y «sobre las 7» queda a las 07:00 en tu zona horaria.",
                toolNotes: {
                    log_meal:
                        "Guarda el desayuno con macros, fibra, azúcar y la cafeína del café",
                    log_water:
                        "Suma los 500 ml de las 07:00 al total de agua de hoy",
                    get_current_time:
                        "Consulta la fecha de hoy para que «sobre las 7» quede a las 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "avena con arándanos y un café para desayunar",
                    },
                    {
                        from: "ai",
                        text: "¿De qué tamaño era el tazón? ¿Y la avena, con leche o con agua? ¿Le pusiste algo al café?",
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
                        text: "Añadí 500 ml de agua a las 07:00 de esta mañana.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
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
                    "Una foto abre una conversación, no una conjetura. Te pregunta si la comida era casera o de restaurante, busca en tus registros anteriores lo que la foto no puede mostrar, te pregunta cuánto comiste en medidas sencillas y no registra nada hasta que apruebas el resumen.",
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
                        text: "Ya has registrado borsch en Tsybulya dos veces, las dos de ternera con crema agria y una rebanada de pan de centeno, unas 520 kcal. ¿Lo mismo esta vez? ¿Y te terminaste el plato y el pan?",
                    },
                    {
                        from: "user",
                        text: "lo mismo, me lo terminé todo, y el pan también",
                    },
                    {
                        from: "ai",
                        text: "Entonces: borsch de ternera con crema agria (1 plato, entero) y pan de centeno (1 rebanada) en Tsybulya, Podil, Kiev. Igual que la última vez: unas 520 kcal y 24 g de proteína; son estimaciones, no cifras publicadas. ¿Lo registro?",
                    },
                    {
                        from: "user",
                        text: "sí",
                    },
                    {
                        from: "ai",
                        text: "Registrado. Son 520 de tus 2000 kcal de hoy; te quedan 1480.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
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
                    "Fotografía el envase: busca en Open Food Facts los números que hay bajo el código de barras y te pregunta cuánto tomaste. Open Food Facts no incluye la cafeína, así que se toma de la etiqueta o de cantidades habituales; si falta la fibra o el azúcar, se estima en vez de dejarlo en blanco.",
                toolNotes: {
                    lookup_barcode:
                        "Obtiene de Open Food Facts los valores de la etiqueta y el Nutri-Score del envase",
                    log_meal:
                        "Registra el envase entero como desayuno, a partir de los valores por 100 g",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "me lo tomé en el desayuno. ¿está bien?",
                    },
                    {
                        from: "ai",
                        text: "Es un envase de 150 g de yogur griego natural (0 % de grasa): 87 kcal, 15 g de proteína y 5 g de azúcar, y Open Food Facts le da un Nutri-Score A. ¿Te tomaste el envase entero?",
                    },
                    {
                        from: "user",
                        text: "el envase entero",
                    },
                    {
                        from: "ai",
                        text: "Registrado como desayuno: 87 kcal, 15 g de proteína y 5 g de azúcar. Te quedan 145 g de proteína para hoy.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Yogur griego natural 0 % (envase de 150 g)"],
            },
            {
                id: "goals-progress",
                title: "Fija objetivos y revisa tu día",
                description:
                    "Define objetivos por alcanzar, como las calorías y la proteína, y límites que no superar para el azúcar, el alcohol y la cafeína; solo cambia lo que mencionas. Luego pregunta por cualquier día y verás lo que te falta para cada objetivo y cómo vas frente a cada límite.",
                toolNotes: {
                    set_nutrition_goals:
                        "Guarda objetivos de calorías y proteína y un límite de cafeína de 400 mg",
                    get_goal_progress:
                        "Muestra el día de hoy frente a cada objetivo y límite en una tarjeta en el chat",
                },
                messages: [
                    {
                        from: "user",
                        text: "quiero definir un poco. ponme 2000 kcal y 160 g de proteína. y ¿qué tope de cafeína es razonable? prácticamente vivo de café",
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
                        text: "Hecho: 2000 kcal y 160 g de proteína por alcanzar, y la cafeína por debajo de 400 mg. Lo demás sigue igual: 220 g de carbohidratos, 70 g de grasa, 30 g de fibra, 2,5 L de agua, tu límite de 60 g de azúcar y tu peso objetivo de 75 kg.",
                    },
                    {
                        from: "user",
                        text: "¿todavía me cabe un postre esta noche?",
                    },
                    {
                        from: "ai",
                        text: "Llevas 1540 de 2000 kcal y 104 de 160 g de proteína, así que te quedan 460 kcal y 56 g de proteína. El azúcar va por 40 g de tu límite de 60 g, y la cafeína por 130 de 400 mg; los dos por debajo.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Revisa la semana",
                description:
                    "Pregunta qué tal fue la semana y la tarjeta de tendencias se abre en el chat con tus medias de calorías y macros frente a tus objetivos y cuántos días registraste. Cambia entre 7, 14 y 30 días sin volver a preguntar. También puede decirte tus rachas y los días que cumpliste el objetivo.",
                toolNotes: {
                    get_trends:
                        "Calcula tus medias de los últimos 7, 14 y 30 días y abre la tarjeta de tendencias",
                },
                messages: [
                    {
                        from: "user",
                        text: "¿qué tal han ido las dos últimas semanas? tengo la sensación de haber ido a trompicones",
                    },
                    {
                        from: "ai",
                        text: "Registraste 13 de los 14 días, los 10 últimos seguidos, y 9 de ellos quedaron a menos de un 10 % de tu objetivo de 2000 kcal. La media de calorías fue de 1830 al día, pero eso cuenta como cero el día que no registraste nada.",
                    },
                    {
                        from: "user",
                        text: "¿y el azúcar?",
                    },
                    {
                        from: "ai",
                        text: "La media fue de 52 g al día, por debajo de tu límite de 60 g, pero lo superaste en 4 de los 13 días.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Controla tu peso",
                description:
                    "Registra tu peso en kg o lb y mira la tendencia más allá de las subidas y bajadas diarias: una media suavizada, el cambio del mes y lo que te falta para tu objetivo. Una lectura imposible, como una coma decimal olvidada, se detecta antes de guardarse.",
                toolNotes: {
                    log_weight: "Guarda el peso de esta mañana: 78,4 kg",
                    get_weight_trends:
                        "Suaviza 30 días con medias móviles y calcula cuánto falta para el objetivo",
                },
                messages: [
                    { from: "user", text: "78,4 kg esta mañana. ¿cómo voy?" },
                    {
                        from: "ai",
                        text: "Guardado: 78,4 kg. Has bajado 1,8 kg desde el 11 de febrero (cuando pesabas 80,2 kg), y tu media de 7 días es de 78,7 kg. Te faltan 3,4 kg para tu objetivo de 75 kg.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Descubre tus patrones",
                description:
                    "Pregunta cuándo comes más y obtendrás una comparación de tus propios registros: entre semana frente a fin de semana, días con y sin desayuno, almuerzos abundantes, cenas tempranas frente a tardías. También señala los días atípicos y muestra patrones, no causas.",
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
                        text: "Un poco, sí. Registraste 28 de los últimos 30 días y no desayunaste en 6. Esos días promediaron 2215 kcal y 88 g de proteína, frente a 1940 kcal y 123 g en los 22 días con desayuno.",
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
                        text: "Casi igual: los fines de semana promedian 2010 kcal y entre semana, 1993.",
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
                        "Registra la pinta con su alcohol en gramos de etanol (568 ml × 4 % × 0,789)",
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
                        text: "¿Qué graduación tenía? Las lager suelen tener entre un 4 y un 5 %; lo indica el grifo o la lata.",
                    },
                    {
                        from: "user",
                        text: "un 4 %, creo",
                    },
                    {
                        from: "ai",
                        text: "Registrada como cena: una pinta de 568 ml al 4 % son 17,9 g de alcohol, 2,3 unidades del Reino Unido y unas 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Lager, 4 % (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Trae tu historial",
                description:
                    "¿Vienes de MyFitnessPal, Cronometer, Lose It! o MacroFactor? El importador se abre en el chat, lee y asigna las columnas de tu exportación en el navegador, no guarda nada hasta que confirmas una vista previa y no duplica ninguna comida si vuelves a importar el mismo archivo con la misma zona horaria. Si no tienes la zona horaria configurada, eso se resuelve primero, para que cada comida quede en el día correcto.",
                toolNotes: {
                    get_profile:
                        "Muestra que la cuenta aún no tiene zona horaria configurada",
                    set_timezone:
                        "Fija America/Chicago para que las comidas queden en hora local",
                    start_meal_import:
                        "Abre en el chat el importador para tu archivo de exportación",
                    bulk_import_meals:
                        "Guarda las filas confirmadas en lotes de hasta 50 y omite las ya importadas",
                },
                messages: [
                    {
                        from: "user",
                        text: "vengo de myfitnesspal. ¿puedes pasar aquí mi diario de comidas? ya tengo la exportación",
                    },
                    {
                        from: "ai",
                        text: "Antes de abrir el importador: tu cuenta no tiene zona horaria configurada, así que las fechas de tu exportación se leerían como UTC y algunas comidas podrían quedar en el día equivocado. ¿Quieres configurarla primero? ¿En qué zona horaria estás?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Zona horaria configurada: America/Chicago. El importador está abierto aquí arriba: elige ahí tu archivo de exportación de MyFitnessPal. Se lee directamente en tu navegador y no se guarda nada hasta que confirmes la vista previa.",
                    },
                    {
                        from: "user",
                        text: "asignó las columnas, pero ¿por qué el nombre del alimento dice «no está en este archivo»?",
                    },
                    {
                        from: "ai",
                        text: "Es normal en MyFitnessPal: su exportación tiene una fila por comida y día, con los totales pero sin nombres de alimentos. Las filas sin nombre de alimento se etiquetan con la app de la que vienen, y sus calorías y macros se importan tal cual.",
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
                        text: "¡listo! ¿se importó todo?",
                    },
                    {
                        from: "ai",
                        text: "Todo: 603 comidas importadas y ninguna falló.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 2,
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
                        "Empaqueta ocho CSV y un README en un ZIP con un enlace válido durante 60 minutos",
                },
                messages: [
                    {
                        from: "user",
                        text: "mi dietista quiere ver mi registro de comidas. ¿me lo puedes pasar a una hoja de cálculo?",
                    },
                    {
                        from: "ai",
                        text: "Hecho. El ZIP tiene 1204 comidas, 318 registros de agua y 64 registros de peso, además de tus objetivos de nutrición, los ajustes del perfil, los datos de tu cuenta, la telemetría de uso de herramientas y las conexiones de apps. Tu registro de comidas es el meals.csv que va dentro.",
                        link: "Descarga tu exportación (enlace válido durante 60 minutos)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Desayuno en un sitio, cena en otro.",
        sub: "Estadísticas nutricionales en tiempo real de todas las cuentas de Nutrition MCP (calorías, registros de comida, macros y peso perdido), actualizadas cada cinco segundos.",
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
            " zonas horarias · el día cambia a la medianoche de cada persona",
        mapNote: "tamaño del punto = proporción de perfiles",
        mapAriaLabel:
            "Mapa mundial de las zonas horarias configuradas en los perfiles; cada una aparece solo cuando la usan al menos tres perfiles",
        foot: "Totales de todas las cuentas, actualizados a medida que se registran comidas. Nunca se muestran datos individuales.",
    },

    features: {
        title: "Lo que puedes registrar",
        cards: [
            {
                title: "Comidas en lenguaje natural",
                body: "Di qué comiste: tu IA estima calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína en miligramos, y lo registra.",
            },
            {
                title: "Escanea un código de barras",
                body: "Fotografía o escribe el código de barras de un producto y obtén de Open Food Facts los macros, la fibra y el azúcar, ajustados a la cantidad que comiste.",
            },
            {
                title: "Objetivos y progreso",
                body: "Define objetivos diarios de calorías, macros, fibra y agua, además de límites de azúcar, cafeína y alcohol que no superar, y consulta tu progreso en tiempo real.",
            },
            {
                title: "Resúmenes y tendencias",
                body: "Desgloses diarios y semanales, tendencias de 7/14/30 días, rachas y patrones de comida recurrentes.",
            },
            {
                title: "Registro de agua",
                body: "Lleva la cuenta de tu hidratación en mililitros junto a tus comidas y revísala día a día.",
            },
            {
                title: "Seguimiento de peso",
                body: "Registra tu peso corporal en kg o lb, consulta tendencias de 7/14/30 días y sigue el progreso hacia un peso objetivo.",
            },
            {
                title: "Siempre en tu zona horaria",
                body: "El día cambia según tu hora local, estés donde estés.",
            },
            {
                title: "Importa desde otra app",
                body: "Trae tu historial de comidas desde MyFitnessPal, Cronometer, Lose It! o MacroFactor, o cualquier otro CSV, asignando tú mismo sus columnas. Tú confirmas qué se añade antes de que se guarde nada.",
            },
            {
                title: "Exporta: tus datos son tuyos",
                body: "Llévate todo lo que almacenamos sobre ti (comidas, agua, peso, objetivos y perfil, además del registro de tu cuenta, la telemetría de uso y las apps conectadas) como un único ZIP de archivos CSV. Por ahora, las comidas son la única parte que se puede volver a importar. Y elimina tu cuenta y tus datos cuando quieras.",
            },
        ],
    },

    why: {
        title: "Mejor hablar que tocar la pantalla.",
        sub: "Escanea un código de barras o di lo que comiste, sin rebuscar en bases de datos ni abrir otra app.",
        oldHeading: "Apps tradicionales",
        oldItems: [
            "Buscar cada alimento en una base de datos",
            "Corregir a mano entradas erróneas de la base de datos",
            "Otra app más que abrir, a menudo tras un muro de pago",
            "Registro manual tedioso",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Describe las comidas en lenguaje natural",
            "La IA estima calorías y macros por ti",
            "Funciona dentro de Claude o ChatGPT, gratis",
            "Pide tendencias, resúmenes y objetivos",
        ],
        noteHtml:
            '¿Vienes de una app concreta? Descubre cómo se compara Nutrition MCP con <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer y otras apps de seguimiento</a>.',
    },

    trust: [
        {
            label: "Privado por defecto",
            small: "Tus datos nunca se venden, ni se comparten, ni se usan para publicidad.",
        },
        {
            label: "Código abierto",
            small: "Revisa el código o alójalo tú mismo.",
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
        updatesNote: "Lectura gratuita: no hace falta ser miembro.",
        updatesPrevLabel: "Actualización anterior",
        updatesNextLabel: "Siguiente actualización",
        updatesDotLabel: "Actualización",
        postLinkLabel: "Leer en Patreon",
        free: {
            tier: "Miembro gratuito",
            price: "0 US$",
            desc: "Sigue el proyecto: recibe noticias y novedades sobre el servidor, las herramientas nuevas y lo que está por venir.",
            cta: "Seguir en Patreon",
        },
        paid: {
            tier: "Miembro de pago",
            price: "Paga lo que quieras",
            desc: "Si Nutrition MCP te resulta útil, puedes ayudar a cubrir los gastos de alojamiento y base de datos. Todos tienen las mismas funciones, mecenas incluidos, y sigue siendo gratis para todo el mundo.",
            cta: "Hazte mecenas",
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
        sub: "¿Encontraste un error, quieres proponer una función o solo tienes una pregunta? Escríbeme directamente: leo todos los mensajes.",
        cta: "Enviar un correo",
    },

    faqSection: {
        title: "Preguntas frecuentes",
    },
    faq: [
        {
            question: "¿Qué es Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP es un servidor de Model Context Protocol (MCP) gratuito y de código abierto que convierte a Claude, ChatGPT o cualquier otro cliente MCP en un contador de calorías y macros. En vez de buscar en una base de datos de alimentos, le dices a tu IA qué comiste y ella registra las calorías, los macros, la fibra, el azúcar y la cafeína en tu propio diario de comidas.",
        },
        {
            question: "¿Qué es el Model Context Protocol (MCP)?",
            visibleHtml:
                "El Model Context Protocol es un estándar abierto que permite a asistentes de IA como Claude y ChatGPT conectarse a herramientas y fuentes de datos externas. Un servidor MCP ofrece capacidades concretas (en este caso, el seguimiento nutricional) que la IA puede usar durante una conversación. Es algo así como un sistema de plugins para asistentes de IA.",
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
                "Cualquier cliente MCP compatible con OAuth 2.0 con PKCE, como Claude.ai, las apps de escritorio y móvil de Claude, Claude Code, Cursor, Windsurf y VS Code.",
        },
        {
            question: "¿Puedo autoalojarlo?",
            visibleHtml:
                'Sí. Nutrition MCP es de código abierto (MIT). Puedes ejecutar tu propia instancia con tu propio proyecto de Supabase: el <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repositorio de GitHub</a> incluye una guía completa de autoalojamiento y un Dockerfile.',
        },
        {
            question: "¿Es gratis Nutrition MCP?",
            visibleHtml:
                "Sí, es completamente gratis: sin plan de pago, sin anuncios y sin cargos ocultos. Necesitas una app de IA compatible con conectores MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas la primera vez que te conectas. Las donaciones voluntarias en Patreon ayudan a cubrir los gastos del servidor y no desbloquean nada.",
        },
        {
            question: "¿Qué puedo registrar?",
            visibleHtml:
                "Calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y agua en cada entrada, descritos en lenguaje natural o obtenidos del código de barras de un producto a través de Open Food Facts. La cafeína también se registra, en miligramos, la unidad que usan todas las etiquetas, y no aporta calorías. El alcohol también puede controlarse, en gramos de etanol puro; se muestra en cuanto activas su seguimiento. También puedes registrar tu peso corporal en kg o lb y seguir tendencias hacia un peso objetivo. Consulta resúmenes diarios, busca comidas por rango de fechas, actualiza o elimina entradas pasadas, define objetivos y sigue tu evolución con el tiempo.",
        },
        {
            question: "¿Qué precisión tiene el conteo de calorías?",
            visibleHtml:
                "Son estimaciones. Para una comida que describes o fotografías, tu IA estima las cifras; para un código de barras, salen de los datos de la etiqueta del producto en Open Food Facts, que tu IA ajusta a la cantidad que tomaste. En ambos casos pueden contener errores, así que comprueba lo que sea importante: puedes corregir o eliminar cualquier entrada con solo pedirlo. Nutrition MCP es una herramienta de registro, no consejo médico ni dietético: consulta a un médico o a un dietista-nutricionista antes de tomar decisiones sobre tu salud, sobre todo si estás embarazada, tienes una afección médica o antecedentes de trastornos de la conducta alimentaria.",
        },
        {
            question: "¿Controla el alcohol?",
            visibleHtml:
                "Sí, de forma opcional: el seguimiento de alcohol está desactivado por defecto, y el alcohol permanece oculto en tus comidas, objetivos y resúmenes hasta que lo activas. Entonces las bebidas se muestran en gramos de etanol puro y como bebidas estándar de EE. UU. o unidades del Reino Unido, lo que prefieras. El alcohol nunca se deduce automáticamente: solo se registra a partir de una bebida que anotas o de una columna de alcohol en un archivo que importas, y una bebida que anotas se guarda aunque el seguimiento esté desactivado. Desactivarlo de nuevo vuelve a ocultar el alcohol y hace que el importador deje de leer columnas de alcohol; no sirve para borrar, y tu exportación siempre incluye lo que registraste. Para eliminar una cifra de alcohol, borra la comida a la que pertenece.",
        },
        {
            question:
                "¿Puedo importar mi historial desde MyFitnessPal u otra app?",
            visibleHtml:
                "Sí. Pide importar tu historial y se abre un importador en el chat: eliges el CSV que exportó tu app anterior, revisas cómo se asignan sus columnas y ves qué se añadirá antes de confirmar. Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor se reconocen automáticamente, y cualquier otro CSV funciona asignando tú mismo las columnas. Tu navegador lee el archivo, así que la IA nunca transcribe tus filas. En clientes que no muestran paneles en el chat, puedes pegar tu exportación directamente, y volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        },
        {
            question: "¿Son privados mis datos?",
            visibleHtml:
                'Tus registros se almacenan en la UE y están vinculados a tu propia cuenta, a la que accedes a través de las apps de IA que conectas. Nutrition MCP nunca vende tus datos, nunca los comparte con terceros y nunca los usa para publicidad; la página de inicio solo muestra totales anónimos de todo el sitio. Lo que tu IA lee a través de las herramientas se envía al proveedor de esa IA en virtud de tu propio acuerdo con él. Puedes exportar todo lo que guardamos sobre ti, o eliminar tu cuenta y todos sus datos, en cualquier momento: la <a href="/privacy" data-link="privacy">política de privacidad</a> tiene los detalles.',
        },
    ],
};

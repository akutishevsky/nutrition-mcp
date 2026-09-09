// Spanish (es) translation of IndexDoc — see src/copy/index.ts for the
// canonical shape and the rules for the four trusted-HTML fields
// (`connect.claude.steps`, `connect.chatgpt.steps`, `connect.other.noteHtml`,
// `faq[].visibleHtml`). Only the human-readable text changed here — every
// tag, placeholder ({n}), URL, code-tag content, brand name, `add` delta and
// `clock` string is identical to the English source.
//
// Locale notes: numbers follow Spanish conventions (thousands separator
// "2.000", not "2,000") so the hero widget's goal string matches the figures
// the page script formats with toLocaleString("es"). Widget labels
// (Proteína / Carbos / Grasa / Agua / Azúcar / Cafeína, "meta") mirror
// src/copy/widgets.es.ts so the landing-page mock reads like the real
// in-chat widget. The tool count ("36") is hand-typed in three strings
// here, exactly as in index.ts — see CLAUDE.md's "Registered tool set".

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
                        caf: 130,
                    },
                    clock: "08:04",
                },
                {
                    barcode: true,
                    aiText: "Es una Coca-Cola de 330 ml: 139 kcal y 35 g de azúcar, según Open Food Facts. Registrada como snack.",
                    add: { kcal: 139, car: 35, sugar: 35 },
                    clock: "11:30",
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
                    aiText: "Registrado: unas 540 kcal y 46 g de proteína. Vas por la mitad de las 2.000 de hoy.",
                    add: { kcal: 540, pro: 46, car: 22, fat: 28, sugar: 6 },
                    clock: "13:22",
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
            widget: {
                title: "Hoy",
                goal: "meta 2.000",
                kcalUnit: "kcal",
                protein: "Proteína",
                carbs: "Carbos",
                fat: "Grasa",
                water: "Agua",
                sugar: "Azúcar",
                caffeine: "Cafeína",
                hint: "👆 Toca una métrica para ver las comidas detrás",
            },
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
                say: "Ajusta mi objetivo diario a 2.000 calorías y 150 g de proteína",
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
        slides: [
            {
                title: "Registra una comida",
                sub: "Palabras normales, sin base de datos",
                userText: "Desayuné avena con frutos rojos y un café",
                aiText: "Desayuno registrado: unas 320 kcal y 11 g de proteína. El café suma 95 mg de cafeína.",
            },
            {
                title: "Escanea un código de barras",
                sub: "Open Food Facts, ajustado a tu porción",
                userText: "Escanea este código de barras: 5449000000996",
                aiText: "Es una Coca-Cola de 330 ml: 139 kcal y 35 g de azúcar, según Open Food Facts. ¿Cuánto tomaste?",
            },
            {
                title: "Revisa la semana",
                sub: "Widget de tendencias, directamente en el chat",
                userText: "¿Cómo fue la semana pasada?",
                aiText: "Promediaste 2.035 kcal al día en 6 días registrados: 165 por debajo de tu objetivo. La proteína fue tu macro más estable.",
                widget: {
                    title: "Tendencias",
                    sub: "7 días",
                    big: "2.035",
                    cap: "media diaria · 6 días registrados",
                    from: "1 sep",
                    goal: "meta 2.200",
                    today: "Hoy",
                },
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

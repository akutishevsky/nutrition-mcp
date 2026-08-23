import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_ES: AltUiCopy = {
    breadcrumbHome: "Inicio",
    breadcrumbAlternatives: "Alternativas",
    ctaQuickInstall: "Instalación rápida",
    ctaClosingTitle: "Controla tu nutrición dentro de la IA que ya usas.",
    disclaimerAppHtml:
        "{app} es una marca comercial de su respectivo propietario. Nutrition MCP es un proyecto independiente y de código abierto, y no está afiliado a {app} ni cuenta con su patrocinio o respaldo. Las comparaciones reflejan información disponible públicamente en el momento de su redacción y pueden cambiar.",
    disclaimerHubHtml:
        "{apps} y otros nombres de producto son marcas comerciales de sus respectivos propietarios. Nutrition MCP es un proyecto independiente y de código abierto, y no está afiliado a ellos ni cuenta con su respaldo. Las comparaciones reflejan información disponible públicamente en el momento de su redacción y pueden cambiar.",

    app: {
        heroEyebrow: "Alternativa a {app}",
        heroTitleHtml: "¿Buscas un servidor <em>MCP de {app}</em>?",
        heroLead:
            "{app} no tiene uno, así que no puedes usarlo dentro de Claude o ChatGPT. Nutrition MCP hace el mismo trabajo por conversación, y es gratis y de código abierto.",
        ctaConnect: "Conéctate en menos de un minuto",
        ctaSeeComparison: "Ver la comparación",

        answerEyebrow: "La respuesta corta",
        answerTitle: "No, {app} no tiene servidor MCP.",
        answerBodyHtml:
            "El Model Context Protocol (MCP) es el estándar abierto que permite a asistentes de IA como Claude y ChatGPT conectarse a herramientas externas. {app} no publica un servidor MCP, así que no hay ninguna forma oficial de registrar comida en él desde tu IA. Si buscaste &ldquo;{app} MCP&rdquo; o &ldquo;conectar {app} a Claude,&rdquo; lo que realmente buscas es un registro de nutrición que viva <em>dentro</em> de tu IA — eso es exactamente lo que es Nutrition MCP.",

        insteadEyebrow: "Lo que obtienes en su lugar",
        insteadTitle: "El mismo seguimiento, solo con hablar",
        features: [
            {
                title: "Comidas en lenguaje sencillo",
                body: "Di &ldquo;avena con plátano y mantequilla de maní&rdquo; — tu IA estima las calorías y los macros, fibra, azúcares totales y cafeína incluidos, y lo registra. Sin buscar en ninguna base de datos.",
            },
            {
                title: "Escaneo de código de barras — gratis",
                body: "Envía el código de barras de un producto y obtén los macros de la etiqueta desde Open Food Facts — fibra y azúcar también, cuando la etiqueta los indica. Sin suscripción Premium para desbloquearlo.",
            },
            {
                title: "Peso &amp; objetivos",
                body: "Registra tu peso corporal en kg o lb, define objetivos de calorías, macros, fibra, azúcar, cafeína y agua — la fibra como meta a alcanzar, el azúcar y la cafeína como límites que no superar — y sigue la tendencia hacia un peso objetivo. El seguimiento de alcohol también está disponible, opcional y desactivado a menos que lo actives.",
            },
            {
                title: "Resúmenes &amp; tendencias",
                body: "Pide totales diarios, tendencias semanales, rachas y patrones de comida recurrentes — directamente en el chat.",
            },
            {
                title: "Importa &amp; controla tus datos",
                body: "Importa tu historial de comidas desde la exportación CSV de otra app — analizada en tu navegador, no por la IA. Sácalo todo de nuevo cuando quieras: un ZIP con tus comidas, agua, peso, objetivos y perfil como archivos CSV. Por ahora, las comidas son la única parte que se puede volver a importar. O elimina tu cuenta, con la misma facilidad.",
            },
            {
                title: "Código abierto &amp; gratis",
                body: "Con licencia MIT y autoalojable — sin anuncios, sin muro de pago, sin ventas adicionales. Audita el código o ejecuta tu propia instancia.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        compareTitle: "Cómo se comparan",
        pros: [
            "Creado como servidor MCP — vive dentro de Claude &amp; ChatGPT",
            "Describe las comidas en lenguaje sencillo; calorías, macros, fibra, azúcar &amp; cafeína estimados para ti",
            "Escaneo de código de barras, tendencias, importación &amp; exportación CSV — todo gratis",
            "Sin app aparte, sin anuncios, código abierto",
        ],

        movingEyebrow: "Cambiando desde {app}",

        importEyebrow: "Tu historial de {app}",
        importSub:
            "Pide importar y un importador se abre directamente en el chat: elige tu exportación, mapea las columnas, previsualiza lo que se añadirá y confirma. El archivo se lee en tu navegador — la IA nunca ve las filas. En clientes sin paneles integrados en el chat, pega tu exportación en su lugar.",

        switchEyebrow: "Cómo cambiarte",
        switchSub:
            "Funciona con cualquier cliente MCP compatible con OAuth 2.0 con PKCE. En la primera conexión creas una cuenta con Google o con un correo y una contraseña.",
        installSteps: [
            "Abre <strong>Claude</strong> (web o escritorio) y haz clic en <strong>Personalizar</strong> → <strong>Conectores</strong>.",
            "Haz clic en <strong>+</strong>, luego en <strong>Añadir conector personalizado</strong>, y dale un nombre como <strong>Nutrition</strong>.",
            "Pega {copyUrl} en el campo <strong>URL del servidor MCP remoto</strong> y haz clic en <strong>Añadir</strong>.",
            "Haz clic en <strong>Conectar</strong>, inicia sesión y empieza a registrar diciendo lo que comiste.",
        ],
        installNoteTemplate:
            "¿Usas ChatGPT u otro cliente en su lugar? La {link} cubre ChatGPT, Cursor, VS Code, Claude Code y más.",
        installLinkText: "guía de instalación completa",
        copyUrlAriaLabel: "Copiar URL del servidor",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Preguntas sobre {app} &amp; MCP",
        faq: {
            mcpQ: "¿Tiene {app} servidor MCP?",
            mcpA: "No. {app} no ofrece un servidor del Model Context Protocol (MCP), así que no hay ninguna forma oficial de conectarlo a Claude, ChatGPT u otros asistentes de IA. Nutrition MCP es una alternativa gratuita y de código abierto, creada como servidor MCP desde cero, para que puedas registrar comidas y macros directamente dentro de tu IA.",
            connectQ: "¿Cómo conecto {app} a Claude?",
            connectA:
                "No existe un conector oficial de {app} para Claude, porque {app} no tiene servidor MCP ni integración MCP pública. La opción más cercana es Nutrition MCP, un servidor MCP gratuito: añade https://nutrition-mcp.com/mcp como conector personalizado en Claude, inicia sesión y empieza a registrar por conversación.",
            goodAltQ: "¿Es Nutrition MCP una buena alternativa a {app}?",
            goodAltA:
                "Si quieres controlar calorías, macros — fibra, azúcares totales y cafeína incluidos —, agua y peso sin abrir una app aparte ni buscar en una base de datos de alimentos, sí. En vez de navegar por una base de datos, describes lo que comiste en lenguaje sencillo, envías una foto o escaneas un código de barras, y tu IA lo registra — completamente gratis y de código abierto.",
            importQ: "¿Puedo importar mis datos de {app}?",
            readExportQ: "¿Lee la IA mi archivo de exportación al importar?",
            readExportA:
                "No cuando se abre el importador. Analiza el CSV en tu navegador y te muestra qué se añadirá antes de escribir nada: cuántas comidas, el total de calorías, cualquier cosa que tuviera que marcar, y las propias filas — un archivo largo muestra las primeras junto con un recuento del resto en vez de cada línea. Solo se envían las filas que confirmas, y viajan como datos estructurados en lugar de pasar por la respuesta de la IA, así que ninguna fila puede transcribirse mal ni inventarse en el camino. Cada fila también lleva una huella de contenido, así que volver a ejecutar el mismo archivo informa que esas comidas ya están registradas en vez de duplicarlas. Si tu cliente no puede mostrar paneles integrados en el chat, la alternativa es pegar la exportación — la IA sí la lee por ese camino, así que prefiere el importador cuando puedas elegir.",
            freeQ: "¿Es gratis Nutrition MCP?",
            freeAFallback:
                "Sí. Nutrition MCP es completamente gratis, sin nivel premium, anuncios ni funciones detrás de un muro de pago — a diferencia de apps que ponen algunas funciones tras una suscripción. Solo necesitas una cuenta de Claude o ChatGPT para conectarte.",
        },
        importFallbackNote:
            " En clientes sin paneles integrados en el chat puedes pegar tu exportación en su lugar.",

        ctaClosingSub:
            "Gratis y de código abierto — sin cuenta de {app}, sin app que abrir.",
        ctaOtherAlternatives: "Otras alternativas",
    },

    hub: {
        heroEyebrow: "Alternativas MCP",
        heroTitleHtml: "Tu app de nutrición no tiene <em>servidor MCP</em>.",
        heroLead:
            "Apps como MyFitnessPal, Cronometer y Lose It! no pueden conectarse a Claude o ChatGPT. Nutrition MCP es la forma gratuita y de código abierto de controlar comidas, macros y peso hablando con tu IA.",
        ctaSeeExamples: "Ver ejemplos",

        appsEyebrow: "Cambiando desde…",
        appsTitle: "Elige tu app actual",
        appsSub:
            "Descubre cómo se compara Nutrition MCP con el tracker que usas hoy — y cómo trasladar tu registro, y tu historial existente, a tu IA.",
        noAppNote:
            "¿No ves tu app? Casi con toda seguridad tampoco tiene servidor MCP — Nutrition MCP funciona igual sin importar desde dónde te cambies.",
        requestComparisonLinkText: "Solicita una comparación",

        importEyebrow: "Trae tu historial",
        importTitle: "No tienes que empezar de cero",
        importSub:
            "El motivo habitual por el que la gente no se cambia son los años ya registrados. Pide importar y un importador se abre directamente en el chat: elige tu exportación, mapea las columnas, previsualiza lo que se añadirá y confirma — o pega la exportación si tu cliente no tiene paneles integrados en el chat.",
        importBody: [
            "El archivo se analiza en tu navegador, no lo lee la IA — así que las filas no pueden transcribirse mal al entrar, y ves las comidas exactas antes de que se escriba ninguna. Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor tienen sus columnas reconocidas por nombre; cualquier otro CSV también funciona, solo tienes que apuntar el mapeador a cada columna una vez. Lo que se transfiere es la fecha y la hora, el alimento, la comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína en miligramos — y también alcohol, si antes has activado su seguimiento.",
            "Las partes complicadas de los archivos de exportación reales están cubiertas: fechas DD/MM/AAAA y MM/DD/AAAA, energía en kilojulios además de kilocalorías, archivos europeos delimitados por punto y coma cuyos números usan coma decimal, campos entre comillas con saltos de línea dentro, filas de totales al final y marcas de fila eliminada. Los encabezados de columna tampoco tienen que estar en inglés — se reconocen el Kalorien o Ballaststoffe de una exportación alemana, y fibra, azúcar y cafeína también se emparejan en español, francés, italiano y neerlandés. Cuando un archivo es realmente ambiguo — 05/06 podría ser mayo o junio — el importador muestra su lectura junto a una fila de tu propio archivo y te pide que la confirmes en vez de adivinar. Y cada fila lleva una huella de contenido, así que volver a importar el mismo archivo informa que las comidas ya están registradas en vez de duplicarlas.",
        ],

        ctaSub: "Gratis y de código abierto — funciona con Claude, ChatGPT y cualquier cliente MCP.",
        ctaStarGithub: "Danos una estrella en GitHub",
    },
};

import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_ES: AltUiCopy = {
    breadcrumbHome: "Inicio",
    breadcrumbAlternatives: "Alternativas",
    breadcrumbAriaLabel: "Ruta de navegación",
    ctaQuickInstall: "Instalación rápida",
    ctaClosingTitle: "Controla tu nutrición desde la IA que ya usas.",
    disclaimerAppHtml:
        "{app} es una marca comercial de su respectivo propietario. Nutrition MCP es un proyecto independiente y de código abierto, y no está afiliado a {app} ni cuenta con su patrocinio o respaldo. Las comparaciones reflejan la información disponible públicamente en el momento de su redacción y pueden cambiar.",
    disclaimerHubHtml:
        "{apps} y otros nombres de producto son marcas comerciales de sus respectivos propietarios. Nutrition MCP es un proyecto independiente y de código abierto, y no está afiliado a ellos ni cuenta con su respaldo. Las comparaciones reflejan la información disponible públicamente en el momento de su redacción y pueden cambiar.",

    app: {
        heroEyebrow: "Alternativa a {app}",
        heroTitleHtml: "¿Buscas un servidor <em>MCP de {app}</em>?",
        heroLead:
            "{app} no publica ninguno que puedas conectar, así que no puedes llevar tu diario de {app} desde Claude o ChatGPT. Nutrition MCP hace lo mismo con solo conversar, y es gratis y de código abierto.",
        ctaConnect: "Conéctate en menos de un minuto",
        ctaSeeComparison: "Ver la comparación",

        answerEyebrow: "La respuesta corta",
        answerTitle:
            "No: {app} no tiene ningún servidor MCP oficial y público.",
        answerBodyHtml:
            "El Model Context Protocol (MCP) es el estándar abierto que permite a asistentes de IA como Claude y ChatGPT conectarse a herramientas externas. {app} no publica ningún servidor MCP público, así que no hay ninguna forma oficial de registrar comidas en tu diario de {app} desde tu IA. Si buscaste «{app} MCP» o «conectar {app} a Claude», lo que de verdad buscas es un registro nutricional que funcione <em>dentro</em> de tu IA, y eso es justo Nutrition MCP.",

        insteadEyebrow: "Lo que obtienes a cambio",
        insteadTitle: "El mismo seguimiento, con solo hablar",
        features: [
            {
                title: "Comidas con tus propias palabras",
                body: "Di «avena con plátano y mantequilla de maní» y tu IA estima las calorías y los macros (fibra, azúcares totales y cafeína incluidos) y lo registra. Sin buscar en ninguna base de datos.",
            },
            {
                title: "Escaneo de códigos de barras, gratis",
                body: "Envía el código de barras de un producto y obtén los macros de la etiqueta desde Open Food Facts, también la fibra y el azúcar cuando la etiqueta los indica. Gratis para todos y sin suscripción.",
            },
            {
                title: "Peso y objetivos",
                body: "Registra tu peso en kg o lb y medidas con cinta métrica de nueve partes del cuerpo en cm o in; fija objetivos de calorías, macros, fibra, azúcar, cafeína y agua (la fibra como mínimo que alcanzar; el azúcar y la cafeína como límites que no superar) y sigue tu tendencia hacia un peso objetivo. También puedes registrar el alcohol: es opcional y está desactivado hasta que lo actives.",
            },
            {
                title: "Resúmenes y tendencias",
                body: "Pide totales diarios, tendencias semanales, rachas y patrones de comidas que se repiten, directamente en el chat.",
            },
            {
                title: "Importa y controla tus datos",
                body: "Importa tu historial de comidas desde la exportación CSV de otra app: el archivo se analiza en tu navegador, no lo procesa la IA. Llévatelo todo cuando quieras: un ZIP con tus comidas, agua, peso, medidas corporales, objetivos y perfil, además de los datos de tu cuenta, la telemetría de uso y las apps conectadas, en archivos CSV. Por ahora, las comidas son lo único que se puede volver a importar. O elimina tu cuenta, igual de fácil.",
            },
            {
                title: "Código abierto y gratis",
                body: "Con licencia MIT y autoalojable: sin anuncios, sin muro de pago, sin ventas adicionales. Revisa el código o ejecuta tu propia instancia.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Otras comparaciones:",
        compareTitle: "Cara a cara",
        pros: [
            "Creado como servidor MCP: funciona dentro de Claude y ChatGPT",
            "Describe tus comidas con tus palabras y obtén una estimación de calorías, macros, fibra, azúcar y cafeína",
            "Escaneo de códigos de barras, tendencias, importación y exportación CSV: todo gratis",
            "Sin app aparte, sin anuncios, de código abierto",
        ],

        movingEyebrow: "Si vienes de {app}",

        importEyebrow: "Tu historial de {app}",
        importSub:
            "Pide importar y se abre un importador directamente en el chat: elige tu exportación, asigna las columnas, revisa lo que se añadirá y confirma. El archivo se lee en tu navegador: la IA nunca ve las filas. Si tu cliente no muestra paneles en el chat, pega la exportación directamente.",

        switchEyebrow: "Cómo cambiarte",
        switchSub:
            "Funciona con cualquier cliente MCP compatible con OAuth 2.0 con PKCE. La primera vez que te conectas, creas una cuenta con Google o con correo y contraseña.",
        installSteps: [
            'Abre <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP en el directorio de Claude</a>.',
            "Haz clic en <strong>Conectar</strong> e inicia sesión con Google o con correo y contraseña.",
            "Empieza a registrar: solo di lo que comiste.",
        ],
        installNoteTemplate:
            "¿Usas ChatGPT u otro cliente? La {link} explica cómo conectarlo en ChatGPT, Cursor, VS Code, Claude Code y más.",
        installLinkText: "guía de instalación completa",

        faqEyebrow: "Preguntas frecuentes",
        faqTitleTemplate: "Preguntas sobre {app} y MCP",
        faq: {
            mcpQ: "¿{app} tiene un servidor MCP?",
            mcpA: "Oficialmente, no. {app} no publica ningún servidor público del Model Context Protocol (MCP), así que no hay ninguna forma oficial de registrar en tu diario de {app} desde Claude, ChatGPT u otros clientes MCP. Existen algunos servidores no oficiales creados por la comunidad, pero {app} no los desarrolla ni les da soporte. Nutrition MCP es distinto: un registro nutricional gratuito y de código abierto, creado desde cero como servidor MCP, con su propia cuenta, que puede importar tu exportación CSV de {app}.",
            connectQ: "¿Cómo conecto {app} a Claude?",
            connectA:
                "No existe un conector oficial de {app} para Claude, porque {app} no publica ningún servidor MCP público. Una opción es Nutrition MCP, un servidor MCP gratuito que figura en el directorio de Claude: ábrelo en https://claude.ai/directory/nutrition-mcp, haz clic en Conectar, inicia sesión y empieza a registrar conversando.",
            goodAltQ: "¿Es Nutrition MCP una buena alternativa a {app}?",
            goodAltA:
                "Si quieres controlar calorías, macros (fibra, azúcares totales y cafeína incluidos), agua y peso sin abrir una app aparte ni buscar en una base de datos de alimentos, sí. En vez de ir tocando pantallas en una base de datos, describes con tus palabras lo que comiste, envías una foto o escaneas un código de barras, y tu IA lo registra. Totalmente gratis y de código abierto.",
            importQ: "¿Puedo importar mis datos de {app}?",
            readExportQ: "¿La IA lee mi archivo de exportación al importar?",
            readExportA:
                "No, si usas el importador. El importador analiza el CSV en tu navegador y te muestra lo que se añadirá antes de guardar nada: cuántas comidas, el total de calorías, lo que haya tenido que señalar y las propias filas (en un archivo largo verás las primeras y cuántas quedan, no todas las líneas). Solo se envían las filas que confirmas, y van como datos estructurados en lugar de pasar por la respuesta de la IA, así que ninguna fila puede copiarse mal ni inventarse por el camino. Además, cada fila lleva una huella de contenido: si vuelves a pasar el mismo archivo, verás que esas comidas ya están registradas en vez de duplicarse, siempre que tu zona horaria no haya cambiado entretanto. Si tu cliente no puede mostrar paneles en el chat, la alternativa es pegar la exportación; en ese caso la IA sí la lee, así que, si puedes elegir, mejor usa el importador.",
            freeQ: "¿Nutrition MCP es gratis?",
            freeAFallback:
                "Sí. Nutrition MCP es completamente gratis: sin plan premium, sin anuncios y sin funciones de pago, a diferencia de las apps que reservan algunas funciones para la suscripción. Necesitas una app de IA compatible con MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas con Google o con correo y contraseña la primera vez que te conectas.",
        },
        importFallbackNote:
            " Si tu cliente no muestra paneles en el chat, puedes pegar la exportación directamente.",

        ctaClosingSub:
            "Gratis y de código abierto. Sin cuenta de {app} y sin otra app que abrir.",
        ctaOtherAlternatives: "Otras alternativas",
    },

    hub: {
        heroEyebrow: "Alternativas MCP",
        heroTitleHtml:
            "Tu app de nutrición no tiene un <em>servidor MCP</em> oficial.",
        heroLead:
            "Apps como MyFitnessPal, Cronometer y Lose It! no ofrecen ninguna forma oficial de llevar tu diario desde Claude o ChatGPT. Nutrition MCP es una forma gratuita y de código abierto de controlar comidas, macros y peso hablando con tu IA, y además importa tu historial.",
        ctaSeeExamples: "Ver ejemplos",

        appsEyebrow: "¿Vienes de…?",
        appsTitle: "Elige la app que usas ahora",
        appsSub:
            "Descubre cómo se compara Nutrition MCP con la app que usas hoy y cómo trasladar a tu IA tanto el registro diario como tu historial.",
        noAppNote:
            "¿No ves tu app? La mayoría de las apps de nutrición tampoco publican un servidor MCP oficial, y Nutrition MCP funciona igual vengas de donde vengas.",
        requestComparisonLinkText: "Pide una comparación",

        importEyebrow: "Trae tu historial",
        importTitle: "No tienes que empezar de cero",
        importSub:
            "Lo que suele retener a la gente son los años que ya tiene registrados. Pide importar y se abre un importador directamente en el chat: elige tu exportación, asigna las columnas, revisa lo que se añadirá y confirma. Si tu cliente no tiene paneles en el chat, pega la exportación directamente.",
        importBody: [
            "El archivo lo analiza tu navegador, no lo lee la IA, así que ninguna fila puede copiarse mal al entrar, y ves exactamente qué comidas se añadirán antes de que se guarde ninguna. En las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor, las columnas se reconocen por su nombre; cualquier otro CSV también sirve: solo tienes que asignar cada columna una vez. Se transfieren la fecha y la hora, el alimento, la comida, las calorías, la proteína, los carbohidratos, la grasa, la fibra, los azúcares totales y la cafeína en miligramos, y también el alcohol, si antes has activado su seguimiento.",
            "Las complicaciones de los archivos de exportación reales están resueltas: fechas DD/MM/AAAA y MM/DD/AAAA, energía en kilojulios además de kilocalorías, archivos europeos separados por punto y coma con coma decimal, campos entre comillas con saltos de línea dentro, filas de totales al final y marcas de fila eliminada. Los encabezados tampoco tienen que estar en inglés: se reconocen Kalorien o Ballaststoffe en una exportación alemana, y la fibra, el azúcar y la cafeína también se identifican en español, francés, italiano y neerlandés. Cuando un archivo es ambiguo de verdad (05/06 puede ser mayo o junio), el importador muestra cómo lo interpreta junto a una fila de tu propio archivo y te pide que lo confirmes en vez de adivinar. Y cada fila lleva una huella de contenido, así que si vuelves a importar el mismo archivo, verás que esas comidas ya están registradas en vez de duplicarse, siempre que tu zona horaria no haya cambiado entretanto.",
        ],

        ctaSub: "Gratis y de código abierto. Funciona con Claude, ChatGPT y cualquier cliente MCP.",
        ctaStarGithub: "Danos una estrella en GitHub",
    },
};

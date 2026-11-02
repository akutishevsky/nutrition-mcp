// Spanish translation of the /apple-health setup guide (see apple-health.ts
// for the field contract). The shortcuts themselves are English for every
// locale, so their names (Nutrition MCP Health, Nutrition MCP Activity), their
// menu items (Sync now, Status, Disconnect), their connect answers (From
// today, Also the last 7 days) and the automation input `auto` stay in
// English; iOS labels (Atajos, Salud, Explorar, Mostrar todos los datos…)
// follow the Spanish iOS interface, as in tools.es.ts.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_ES: AppleHealthDoc = {
    meta: {
        title: "Atajos de Apple Health",
        description:
            "Dos atajos gratuitos para iPhone conectan Nutrition MCP y Apple Health: Nutrition MCP Health copia en Apple Health los totales diarios que registras con tu IA (calorías, proteínas, carbohidratos, grasas, fibra, cafeína y, si quieres, agua), y Nutrition MCP Activity trae de vuelta tu Energía activa diaria como calorías activas.",
        ogDescription:
            "Totales diarios a Apple Health y Energía activa de vuelta a Nutrition MCP: dos atajos gratuitos para iPhone, usa uno o los dos.",
    },
    tocLabel: "En esta página",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP y Apple Health, en los dos sentidos",
        lead: "Dos atajos gratuitos para iPhone, uno en cada sentido. Uno copia lo que comes en Apple Health; el otro lleva la energía que quemas de vuelta a Nutrition MCP. Usa uno o los dos: se conectan, sincronizan y desconectan por su cuenta.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Tus totales diarios, en Apple Health",
            items: [
                "Una entrada por nutriente para cada día terminado, a las <strong>12:00</strong>, procedente de <strong>Atajos</strong>.",
                "Un día se da por terminado a las <strong>05:00</strong> de la mañana siguiente en tu zona horaria, así que ayer llega después de las 05:00 de hoy. Hoy nunca aparece.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Tu Energía activa, como calorías activas",
            items: [
                "Tu total de <strong>Energía activa</strong> de hoy y de los 2 días anteriores, junto a lo que comiste. Tu objetivo calórico nunca cambia.",
                "Una entrada por día, que se sustituye en cada sincronización, así que sincronizar a menudo nunca cuenta un día dos veces.",
            ],
        },
        nutrientsLabel: "Se envía cada día",
        nutrients: {
            energy_kcal: "Energía alimentaria",
            protein_g: "Proteínas",
            carbohydrates_g: "Carbohidratos",
            fat_g: "Grasas totales",
            fiber_g: "Fibra",
            caffeine_mg: "Cafeína",
            water_ml: "Agua",
        },
        waterNote: "si lo eliges",
        alcoholNote: "El alcohol nunca se envía.",
        readLabel: "Se lee en cada sincronización",
        activeEnergy: "Energía activa",
    },
    before: {
        title: "Antes de empezar",
        items: [
            "Un iPhone con las apps <strong>Atajos</strong> y <strong>Salud</strong>. Las dos vienen con iOS.",
            "Una cuenta de Nutrition MCP ya conectada a tu app de IA, como Claude o ChatGPT. Ambos atajos inician sesión con esa misma cuenta.",
            "Recomendado: tu zona horaria en tu perfil, porque decide dónde termina cada día. Basta con decir <em>&ldquo;configura mi zona horaria&rdquo;</em> en el chat. Si nunca configuras una, se usa la zona horaria que indica tu iPhone al conectar.",
        ],
    },
    install: {
        title: "Instala los atajos",
        lead: "Instala uno o los dos. Abre un enlace en tu iPhone y toca <strong>Añadir atajo</strong>; aparece en la app Atajos con su propio nombre.",
        button: "Obtener el atajo",
        pending: "El enlace al atajo se publicará aquí muy pronto.",
        leadPending:
            "Los atajos aún no están publicados. Cuando lo estén, abrirás su enlace en tu iPhone y tocarás <strong>Añadir atajo</strong>, y aparecerá en la app Atajos con su propio nombre. Los pasos de abajo explican lo que viene después.",
        healthBlurb: "Envía tus totales diarios a Apple Health.",
        activityBlurb: "Lee tu Energía activa desde Apple Health.",
        nameNote:
            "Mantén exactamente los nombres <strong>Nutrition MCP Health</strong> y <strong>Nutrition MCP Activity</strong>. La página de inicio de sesión vuelve a abrir cada atajo por su nombre, así que conectar se queda a medias si se cambia el nombre de alguno.",
    },
    connect: {
        title: "Conéctalos",
        steps: [
            "En la app Atajos, toca el atajo para ejecutarlo.",
            "Responde a sus preguntas (abajo) y Safari abre una página de inicio de sesión. Inicia sesión con la <strong>misma cuenta que usa tu app de IA</strong>. La página muestra un aviso sobre la conexión con Apple Health: continúa solo si acabas de iniciar esto tú mismo, desde el atajo de tu propio iPhone.",
            "Cuando Safari pregunte si quieres abrir Atajos, toca <strong>Abrir</strong>. El atajo termina de conectarse.",
        ],
        health: {
            label: "Nutrition MCP Health pregunta",
            items: [
                "Si quieres enviar también el <strong>agua</strong> (déjalo desactivado si tu Apple Watch u otra app ya registra el agua) y qué días enviar, <strong>From today</strong> (desde hoy) o <strong>Also the last 7 days</strong> (también los últimos 7 días).",
                "La primera vez que se envía un día, Apple Health pregunta qué puede escribir Atajos: activa <strong>todos los tipos</strong> y toca <strong>Permitir</strong>. Si elegiste <strong>Also the last 7 days</strong> y registraste comidas esos días, ocurre enseguida. Si no, aún no hay nada que enviar, así que mañana después de las 05:00 abre el atajo y toca <strong>Sync now</strong> una vez para responder.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity pregunta",
            items: [
                "Nada antes del inicio de sesión, salvo un breve aviso sobre lo que lee. Su primera sincronización se ejecuta justo después de conectarlo.",
                "Apple Health pregunta si Atajos puede leer <strong>Energía activa</strong>: toca <strong>Permitir</strong>. Después, iOS pregunta si el atajo puede enviar muestras de salud a nutrition-mcp.com: elige <strong>Permitir siempre</strong>, o cada ejecución automática se detendrá en esa pregunta.",
            ],
        },
        note: "Cada enlace de inicio de sesión funciona una sola vez, durante 30 minutos. Si caduca, vuelve a ejecutar el atajo. Conecta los dos atajos uno después del otro, no a la vez. Con Nutrition MCP Health, tu primer día terminado llega mañana después de las 05:00; si elegiste los últimos 7 días, esos se envían enseguida.",
    },
    automate: {
        title: "Hazlos automáticos",
        lead: "Un atajo compartido no puede llevar consigo sus automatizaciones, así que créalas una vez en la pestaña <strong>Automatización</strong> de la app Atajos, para cada atajo que uses. El primer disparador de cada uno es el que importa; los demás se ponen al día.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "App → Salud → Se abre",
                tag: "Principal",
                body: "Abrir Salud es justo el momento en que quieres que esté al día.",
            },
            {
                when: "Alarma → Se detiene",
                tag: "Puesta al día matinal",
                body: "Una alarma que detienes después de las 05:00, como la de despertarte, envía el día de ayer en cuanto ha terminado.",
            },
            {
                when: "Cargador → Se conecta",
                tag: "Opcional",
                body: "Enchufarlo por la noche o en tu escritorio es una oportunidad más para sincronizar.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude o ChatGPT → Se abre",
                tag: "Principal",
                body: "Abrir tu app de IA es el momento en que estás a punto de preguntar cómo va tu día, así que la energía que quemas hoy ya está al día antes de que preguntes.",
            },
            {
                when: "App → Salud o Fitness → Se abre",
                tag: "También",
                body: "Revisar tus anillos o tus entrenamientos es una oportunidad más para sincronizar.",
            },
            {
                when: "Hora del día",
                tag: "A lo largo del día",
                body: "No hay un desencadenante de &ldquo;cada hora&rdquo;, así que añade varios, por ejemplo a las 12:00, las 18:00 y las 22:00, para captar los días en que no abres ninguna de las dos apps.",
            },
        ],
        stepsLabel: "Para cada una",
        steps: [
            "En la app Atajos, abre la pestaña <strong>Automatización</strong> y toca <strong>+</strong> para crear una automatización personal.",
            "Elige el desencadenante, por ejemplo <strong>App</strong> → <strong>Salud</strong> → <strong>Se abre</strong>.",
            "Elige <strong>Ejecutar inmediatamente</strong> y desactiva <strong>Notificar al ejecutar</strong> si tu iPhone te da la opción.",
            "Añade la acción <strong>Ejecutar atajo</strong>, elige <strong>Nutrition MCP Health</strong> o <strong>Nutrition MCP Activity</strong> y pon como entrada el texto <code>auto</code>.",
        ],
        note: "La entrada <code>auto</code> hace que las ejecuciones automáticas sean silenciosas: solo te avisan cuando algo requiere tu atención. No hace falta una hora exacta: Nutrition MCP Health revisa los últimos 7 días terminados en cada sincronización, y Nutrition MCP Activity vuelve a enviar hoy y los 2 días anteriores, así que una ejecución perdida se recupera sola.",
    },
    everyday: {
        title: "En el día a día",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "¿Se te olvidó registrar algo?",
                body: "Añádelo en el chat como siempre. Si su día ya se envió y está dentro de los últimos 7 días, la siguiente sincronización completa el día con una pequeña entrada extra a las 12:01, 12:02, etc. Los cambios de menos de unas 20 kcal o 2 g se omiten; un salto muy grande, o un cambio después de 9 ajustes al alza, llega como notificación para que lo introduzcas a mano.",
            },
            {
                title: "¿Borraste o redujiste una comida?",
                body: "Apple Health puede sumar a un valor, pero no reducirlo, así que recibes una notificación que indica cuánto se ha pasado ahora ese día. Para corregirlo, abre Salud → <strong>Explorar</strong> → <strong>Nutrición</strong>, elige el tipo de dato, toca <strong>Mostrar todos los datos</strong> y desliza hacia la izquierda sobre las entradas de ese día que vienen de Atajos para borrarlas; después introduce a mano el total correcto que indica la notificación. No uses nunca <strong>Eliminar todos los datos de «Atajos»</strong>: también borra lo que registraron tus otros atajos.",
            },
            {
                title: "Ejecútalo a mano",
                body: "Toca <strong>Nutrition MCP Health</strong> en la app Atajos para ver su menú: <strong>Sync now</strong> envía lo que esté pendiente, <strong>Status</strong> muestra el último día enviado y cuándo estará listo el siguiente, y <strong>Disconnect</strong> termina la conexión.",
            },
            {
                title: "Compruébalo desde tu app de IA",
                body: "Pide a tu IA que te muestre tu perfil (<code>get_profile</code>): indica cuándo se conectó cada atajo, hasta qué día ha enviado Nutrition MCP Health y cuándo se ejecutó por última vez cada uno.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "¿Cifras de calorías muy grandes cuando pregunta si enviar?",
                body: "No te preocupes por ellas. La pregunta que muestra iOS antes de enviar enumera las sumas diarias de Health sin redondear, con todos sus decimales y en el formato de números de tu región; por eso <strong>922,774 kcal</strong> (o 922.774, según el separador de tu región) es, sencillamente, unas 923 kcal. El atajo redondea cada día a kilocalorías enteras antes de enviar nada, y las entradas de <strong>0 kcal</strong> que también enumera no suman nada.",
            },
            {
                title: "¿Registraste un entrenamiento también en el chat?",
                body: "En un día que el atajo ya ha enviado, cuenta el total de Apple Health, y los entrenamientos que registraste en el chat se quedan en tu registro sin sumarse encima: la Energía activa de tu reloj ya los incluye. En los demás días se cuentan como siempre.",
            },
            {
                title: "¿Un día que aparece como 0?",
                body: "Un día sin Energía activa, o uno que Salud no dejó leer al atajo, no envía nada y no cambia nada. Si todos los días siguen en 0, permite que Atajos lea la Energía activa en Salud → <strong>Compartir</strong> → <strong>Apps</strong> → <strong>Atajos</strong>.",
            },
            {
                title: "Ejecútalo a mano",
                body: "Toca <strong>Nutrition MCP Activity</strong> en la app Atajos para ver su menú: <strong>Sync now</strong> envía hoy y los 2 días anteriores, <strong>Status</strong> muestra el último día enviado, y <strong>Disconnect</strong> termina su conexión y deja conectado Nutrition MCP Health.",
            },
        ],
    },
    privacy: {
        title: "Privacidad y límites",
        items: [
            "<strong>Nutrition MCP Health</strong>: nuestro servidor guarda la conexión y, durante 8 días, un registro de los totales que ha enviado, para que cada día se envíe una vez y después solo se complete. No enviamos nada a Apple: el atajo pide tus totales a nuestro servidor y los escribe en Salud en tu iPhone, donde se aplican tus propios ajustes de Apple.",
            "<strong>Nutrition MCP Activity</strong> lee solo el total diario de <strong>Energía activa</strong>, nada más de Salud. Nuestro servidor guarda esos totales como tus calorías activas, que incluimos en tu exportación de datos y se eliminan con tu cuenta, igual que las que registras en el chat.",
            "Cada atajo guarda su propio token de acceso en su propio almacenamiento dentro de la app Atajos de tu iPhone, no en un archivo, y la app Atajos puede sincronizarlo con tus otros dispositivos a través de iCloud. Quien pueda ejecutar un atajo en tus dispositivos puede usar su sincronización hasta que la desconectes, así que conserva los atajos solo en dispositivos que uses tú.",
            "Elige <strong>Disconnect</strong> en un atajo cuando quieras y su conexión se elimina al instante, junto con el registro de Nutrition MCP Health. Cada conexión también termina sola tras 90 días sin sincronizar y 365 días después de conectarla. Lo que ya está en Apple Health se queda allí hasta que lo borres, y las calorías activas ya enviadas se quedan hasta que las elimines.",
        ],
        policyLink: "Leer la política de privacidad",
    },
    troubleshooting: {
        title: "Solución de problemas",
        lead: "¿Algo no cuadra? Estas respuestas cubren los casos habituales.",
        readMore: "Leer la respuesta",
    },
    selfHost: {
        textHtml:
            "¿Tienes tu propio servidor? Los atajos se construyen paso a paso en {link} y {activityLink}.",
        linkText: "la guía de montaje de Nutrition MCP Health",
        activityLinkText: "la guía de montaje de Nutrition MCP Activity",
    },
};

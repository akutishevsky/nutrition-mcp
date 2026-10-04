// Spanish translation of the /apple-health setup guide (see apple-health.ts
// for the field contract). The shortcut itself is English for every locale,
// so its name, its menu items (Sync now, Status, Disconnect), its connect
// answers (From today, Also the last 7 days) and the automation input `auto`
// stay in English; iOS labels (Atajos, Salud, Explorar, Mostrar todos los
// datos…) follow the Spanish iOS interface, as in tools.es.ts.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_ES: AppleHealthDoc = {
    meta: {
        title: "Sincronización con Apple Health",
        description:
            "Configura el atajo gratuito Nutrition MCP Health en tu iPhone: copia en Apple Health los totales diarios que registras hablando con tu IA (calorías, proteínas, carbohidratos, grasas, fibra, cafeína y, si quieres, agua).",
        ogDescription:
            "Copia en Apple Health los totales diarios que registras con tu IA, con un atajo gratuito para iPhone.",
    },
    tocLabel: "En esta página",
    hero: {
        eyebrow: "Sincronización con Apple Health · iPhone",
        title: "Tus totales diarios, en Apple Health",
        lead: "Un atajo gratuito para iPhone copia de Nutrition MCP a Apple Health los totales de cada día terminado. Tu app de IA sigue encargándose del registro; el atajo solo envía los días que ya han acabado.",
        seeTitle: "Lo que verás en Apple Health",
        seeItems: [
            "Una entrada por nutriente para cada día terminado, a las <strong>12:00</strong>, procedente de <strong>Atajos</strong>.",
            "Un día se da por terminado a las <strong>05:00</strong> de la mañana siguiente en tu zona horaria, así que ayer llega después de las 05:00 de hoy. Hoy nunca aparece.",
        ],
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
    },
    before: {
        title: "Antes de empezar",
        items: [
            "Un iPhone con las apps <strong>Atajos</strong> y <strong>Salud</strong>. Las dos vienen con iOS.",
            "Una cuenta de Nutrition MCP ya conectada a tu app de IA, como Claude o ChatGPT. El atajo inicia sesión con esa misma cuenta.",
            "Recomendado: tu zona horaria en tu perfil, porque decide dónde termina cada día. Basta con decir <em>&ldquo;configura mi zona horaria&rdquo;</em> en el chat. Si nunca configuras una, se usa la zona horaria que indica tu iPhone al conectar.",
        ],
    },
    install: {
        title: "Instala el atajo",
        lead: "Abre el enlace en tu iPhone y toca <strong>Añadir atajo</strong>. Aparecerá en la app Atajos como <strong>Nutrition MCP Health</strong>.",
        button: "Obtener el atajo",
        pending: "El enlace al atajo se publicará aquí muy pronto.",
        leadPending:
            "El atajo aún no está publicado. Cuando lo esté, abrirás su enlace en tu iPhone y tocarás <strong>Añadir atajo</strong>, y aparecerá en la app Atajos como <strong>Nutrition MCP Health</strong>. Los pasos de abajo explican lo que viene después.",
        nameNote:
            "Mantén exactamente el nombre <strong>Nutrition MCP Health</strong>. La página de inicio de sesión vuelve a abrir el atajo por ese nombre, así que si le cambias el nombre, la conexión se queda a medias.",
    },
    connect: {
        title: "Conéctalo",
        steps: [
            "En la app Atajos, toca <strong>Nutrition MCP Health</strong> para ejecutarlo.",
            "Responde a dos preguntas: si quieres enviar también el <strong>agua</strong> (déjalo desactivado si tu Apple Watch u otra app ya registra el agua) y qué días enviar, <strong>From today</strong> (desde hoy) o <strong>Also the last 7 days</strong> (también los últimos 7 días).",
            "Safari abre una página de inicio de sesión. Inicia sesión con la <strong>misma cuenta que usa tu app de IA</strong>. La página muestra un aviso sobre la conexión con Apple Health: continúa solo si acabas de iniciar esto tú mismo, desde el atajo de tu propio iPhone.",
            "Cuando Safari pregunte si quieres abrir Atajos, toca <strong>Abrir</strong>. El atajo termina de conectarse.",
            "La primera vez que se envía un día, Apple Health pregunta qué puede escribir Atajos: activa <strong>todos los tipos</strong> y toca <strong>Permitir</strong>. Si elegiste <strong>Also the last 7 days</strong> y registraste comidas esos días, ocurre enseguida. Si no, aún no hay nada que enviar, así que mañana después de las 05:00 abre el atajo y toca <strong>Sync now</strong> una vez para responder.",
        ],
        note: "El enlace de inicio de sesión funciona una sola vez, durante 30 minutos. Si caduca, vuelve a ejecutar el atajo. Tu primer día terminado llega mañana después de las 05:00; si elegiste los últimos 7 días, esos se envían enseguida.",
    },
    automate: {
        title: "Hazlo automático",
        lead: "Un atajo compartido no puede llevar consigo sus automatizaciones, así que créalas una vez en la pestaña <strong>Automatización</strong> de la app Atajos. La primera es la que importa; las demás ponen todo al día cuando no abres Salud.",
        triggersLabel: "Cuándo ejecutarlo",
        triggers: [
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
        stepsLabel: "Para cada una",
        steps: [
            "En la app Atajos, abre la pestaña <strong>Automatización</strong> y toca <strong>+</strong> para crear una automatización personal.",
            "Elige el desencadenante, por ejemplo <strong>App</strong> → <strong>Salud</strong> → <strong>Se abre</strong>.",
            "Elige <strong>Ejecutar inmediatamente</strong> y desactiva <strong>Notificar al ejecutar</strong> si tu iPhone te da la opción.",
            "Añade la acción <strong>Ejecutar atajo</strong>, elige <strong>Nutrition MCP Health</strong> y pon como entrada el texto <code>auto</code>.",
        ],
        note: "La entrada <code>auto</code> hace que las ejecuciones automáticas sean silenciosas: solo te avisan cuando algo requiere tu atención. No hace falta una hora exacta: cada sincronización revisa los últimos 7 días terminados, así que una mañana perdida se recupera sola.",
    },
    everyday: {
        title: "En el día a día",
        cards: [
            {
                title: "¿Se te olvidó registrar algo?",
                body: "Añádelo en el chat como siempre. Si su día ya se envió y está dentro de los últimos 7 días, la siguiente sincronización completa el día con una pequeña entrada extra a las 12:01, 12:02, etc. Los cambios de menos de unas 20 kcal o 2 g se omiten; un salto muy grande, o un cambio después de 9 complementos, llega como notificación para que lo introduzcas a mano.",
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
                body: "Pide a tu IA que te muestre tu perfil (<code>get_profile</code>): indica cuándo se conectó la sincronización, hasta qué día ha enviado y cuándo se ejecutó por última vez.",
            },
        ],
    },
    privacy: {
        title: "Privacidad y límites",
        items: [
            "Nuestro servidor guarda la conexión y, durante 8 días, un registro de los totales que ha enviado, para que cada día se envíe una vez y después solo se complete. Ambos están en tu exportación de datos.",
            "El atajo guarda su token de acceso en su propio almacenamiento dentro de la app Atajos de tu iPhone, no en un archivo, y la app Atajos puede sincronizarlo con tus otros dispositivos a través de iCloud. Quien pueda ejecutar el atajo en tus dispositivos puede usar la sincronización hasta que la desconectes, así que mantenlo solo en dispositivos que uses tú.",
            "No enviamos nada a Apple. El atajo pide tus totales a nuestro servidor y los escribe en Salud en tu iPhone; a partir de ahí, se aplican tus propios ajustes de Apple.",
            "Elige <strong>Disconnect</strong> cuando quieras y la conexión y su registro se eliminan al instante. También termina sola tras 90 días sin sincronizar y 365 días después de conectarla. Lo que ya está en Apple Health se queda allí hasta que lo borres.",
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
            "¿Tienes tu propio servidor? El atajo se construye paso a paso en {link}.",
        linkText: "la guía de montaje",
    },
};

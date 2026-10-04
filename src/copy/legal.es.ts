// Spanish (es) translation of legal.ts's PRIVACY_EN/TERMS_EN. Kept in the
// same direct, plain-spoken register as the rest of the site — informal
// "tú", not a shift into formal/legalistic Spanish ("usted", "por medio
// del presente") — matching the same principle documented above PRIVACY_DE/
// TERMS_DE in legal.ts. No human review pass (product decision, see git
// history) — this is exactly the page most worth a native-speaker legal
// review before it's relied on.

import type { LegalDoc } from "./legal.js";

const p = (html: string): { type: "p"; html: string } => ({
    type: "p",
    html,
});
const ul = (items: string[]): { type: "ul"; items: string[] } => ({
    type: "ul",
    items,
});

export const PRIVACY_ES: LegalDoc = {
    title: "Política de privacidad",
    metaDescription:
        "Cómo trata Nutrition MCP tus datos: qué guardamos, para qué los usamos, dónde se almacenan y cómo eliminar tu cuenta y todo su contenido cuando quieras.",
    ogDescription:
        "Cómo trata Nutrition MCP tus datos: qué guardamos, para qué los usamos, dónde se almacenan y cómo eliminar tu cuenta y todo su contenido cuando quieras.",
    lastUpdated: "3 de octubre de 2026",
    backToHome: "Volver al inicio",
    lead: "Cómo trata Nutrition MCP tus datos: qué guardamos, para qué los usamos, dónde se almacenan y cómo eliminar tu cuenta y todo su contenido cuando quieras.",
    documentsLabel: "Documentos legales",
    tocLabel: "En esta página",
    sections: [
        {
            heading: "Qué recopilamos",
            blocks: [
                p(
                    "Cuando creas tu cuenta, guardamos tu <strong>dirección de correo electrónico</strong> y tu contraseña, almacenada como hash seguro, a través de Supabase Auth. Si en cambio inicias sesión con Google, solo le pedimos a Google tu dirección de correo electrónico, que recibimos junto con el identificador de tu cuenta de Google; Supabase Auth lo conserva para reconocerte la próxima vez que inicies sesión con Google. Nunca vemos ninguna contraseña de Google. Las cuentas que iniciaron sesión con Google antes del 27 de septiembre de 2026 pueden conservar todavía el nombre y la foto de perfil que Google envió entonces; el servicio no los lee ni los muestra en ningún sitio salvo en tu exportación de datos, y se eliminan junto con tu cuenta.",
                ),
                p("Cuando usas el servicio, guardamos:"),
                ul([
                    "<strong>Registros de comidas</strong>: descripción, tipo de comida, calorías, macros, fibra, azúcares totales, gramos de alcohol, miligramos de cafeína, notas y marcas de tiempo. Las fotos de comida las interpreta tu asistente de IA; nunca se suben a nuestros servidores ni las almacenamos.",
                    "<strong>Registros de agua</strong>: cantidad, notas y marcas de tiempo.",
                    "<strong>Registros de peso corporal</strong>: peso, notas y marcas de tiempo. Son datos de salud y se tratan exactamente igual que el resto de tus registros.",
                    "<strong>Registros de medidas corporales</strong>: qué parte del cuerpo se midió (cintura, cadera, cuello, pecho, hombros, brazo, antebrazo, muslo o pantorrilla), el valor tal como lo introdujiste y su unidad (cm o in), notas y marcas de tiempo. Son datos de salud y se tratan exactamente igual que el resto de tus registros.",
                    "<strong>Objetivos</strong>: tus objetivos diarios de calorías, proteína, carbohidratos, grasa, fibra, azúcar, alcohol, cafeína y agua, y tu peso objetivo. Cada vez que cambian, guardamos además una copia con fecha, para que un día pasado pueda compararse con los objetivos que estaban vigentes ese día.",
                    "<strong>Ajustes de perfil</strong>: tu zona horaria IANA, tu unidad de peso preferida, tu unidad de longitud preferida para las medidas corporales, si el seguimiento de alcohol está activado y en qué bebida estándar se expresa, si los widgets del chat están activados y en qué idioma se muestran.",
                    "<strong>Sincronización con Apple Health</strong>: solo si la conectas desde el atajo Nutrition MCP Health de tu iPhone. Guardamos la conexión (qué totales diarios envía, si incluye el agua, la fecha desde la que empieza, la zona horaria que indicó tu iPhone, que solo se usa mientras tu perfil no tenga una, y cuándo se creó, se usó por última vez y se sincronizó por última vez); para cada uno de los últimos 8 días, los totales ya enviados a Apple Health y cuándo, para que cada día se envíe una vez y después solo se complete con lo que se haya añadido; y, mientras te conectas, una solicitud de conexión pendiente durante un máximo de 30 minutos. El alcohol nunca se envía.",
                    "<strong>Telemetría de uso de herramientas</strong>: para cada llamada a una herramienta MCP, qué herramienta se ejecutó, si tuvo éxito, cuánto tardó, una categoría de error genérica si falló, la duración en días de cualquier rango de fechas que hayas pedido, el id de sesión MCP, la revisión del protocolo MCP con la que se conectó tu app de IA y el nombre y la versión con los que esa app se identifica (por ejemplo, &laquo;claude-ai/1.0&raquo;), cuando los envía. Está vinculada al id de tu cuenta y nunca incluye el contenido de tus registros.",
                    "<strong>Registro de ejecución del servidor</strong>: para cada solicitud al servidor, el método, la ruta, el código de estado y el tiempo de respuesta, tu dirección IP sin su última parte y, en las solicitudes MCP, la revisión del protocolo y el nombre y la versión que indica tu app de IA. En cada llamada a una herramienta registra además el nombre de la herramienta, si tuvo éxito, cuánto tardó y, si falló, un código de referencia breve y el mensaje de error, que puede repetir un valor enviado por tu app de IA, como una fecha no válida. Cuando tu app de IA inicia sesión o renueva su conexión, registra el resultado, el identificador aleatorio que se le asignó al darse de alta en nuestro servicio de inicio de sesión y el sitio al que pidió volver (por ejemplo, claude.ai). Se escribe en el registro de ejecución de nuestro proveedor de alojamiento, no contiene el id de tu cuenta ni tu dirección de correo electrónico y solo se conserva durante poco tiempo: ese registro es un búfer rotativo que sobrescribe las líneas más antiguas a medida que llega tráfico nuevo.",
                ]),
                p(
                    "<strong>El alcohol también es un dato de salud</strong>, y más sensible que un recuento de calorías, así que funciona de forma distinta a todo lo anterior. El seguimiento de alcohol está desactivado por defecto, y solo registramos alcohol cuando procede de ti: una bebida que registras o una columna de un archivo que importas. Nada lo deduce por ti. Desactivar el ajuste tiene dos efectos: el importador masivo deja de leer la columna de alcohol de los archivos que subes, y el resto del servicio deja de mostrar el alcohol en las comidas, los objetivos, el progreso y los widgets que ves. No es un botón de borrado. El alcohol que registras directamente queda registrado tanto si el ajuste está activado como si no, lo que ya está guardado permanece en la base de datos y todo ello sigue apareciendo en el archivo de comidas de cualquier exportación que hagas. Para eliminar de verdad una cifra de alcohol, elimina la comida a la que pertenece o elimina tu cuenta.",
                ),
                p(
                    "También guardamos los tokens de acceso y de actualización de OAuth y los códigos de autorización que permiten que tu asistente de IA siga conectado a tu cuenta; cuánto dura cada uno se explica en &laquo;Cuánto tiempo conservamos los datos&raquo;. Solo se almacenan como hashes unidireccionales. La sincronización con Apple Health tiene su propio token de acceso, que también guardamos solo como hash unidireccional; el atajo necesita el token en sí para hacer sus solicitudes, así que la app Atajos lo guarda en el almacenamiento propio del atajo en tu iPhone, no en un archivo, y puede sincronizarlo con tus otros dispositivos si tus atajos se sincronizan a través de iCloud. Quien pueda ejecutar ese atajo en tus dispositivos puede usar la sincronización hasta que la desconectes.",
                ),
            ],
        },
        {
            heading: "Cómo los usamos",
            blocks: [
                p(
                    "Tus datos de comidas, agua, peso, medidas corporales y objetivos se usan únicamente para prestar el servicio de seguimiento nutricional y, de forma anónima y agregada, para las estadísticas públicas de la página de inicio. <strong>Nunca los vendemos, nunca los compartimos con terceros y nunca los usamos con fines publicitarios</strong>, ni los incorporamos a ningún sistema de publicidad o de elaboración de perfiles. La sincronización con Apple Health, descrita más abajo, no cambia esto: es una transferencia que inicias tú, a tu propio iPhone, y no enviamos nada a Apple.",
                ),
                p(
                    "La página de inicio y el feed público de estadísticas que la alimenta muestran totales anónimos de todo el sitio (cuántas comidas se han registrado, sus calorías y macros, el agua registrada y el peso neto perdido en el conjunto de las cuentas) y las zonas horarias configuradas en los perfiles, que la página de inicio representa en un mapa del mundo. Una zona horaria solo aparece en el mapa cuando la usan al menos tres perfiles, y ninguna cifra está vinculada a una persona.",
                ),
                p(
                    'Cuando buscas un código de barras, directamente o a través de tu asistente de IA, nuestro servidor envía solo los dígitos del código a <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (nunca tu cuenta, tu correo electrónico ni tus registros) y guarda los datos del producto que recibe en una caché compartida que no está vinculada a ningún usuario.',
                ),
                p(
                    "Si conectas la sincronización con Apple Health, el atajo de tu iPhone pide a nuestro servidor los totales diarios de tus días ya cerrados (calorías, proteínas, carbohidratos, grasas, fibra, cafeína y, si lo elegiste, agua) y los escribe en Apple Health en ese iPhone. Esto ocurre a petición tuya y en tu dispositivo: nuestro servidor solo responde al atajo y no envía nada a Apple. Una vez que los totales están en Apple Health, se guardan y se comparten allí según tus propios ajustes y tu acuerdo con Apple, no el nuestro.",
                ),
                p(
                    "Sí usamos dos tipos de analítica, y ninguno accede al contenido de tus registros:",
                ),
                ul([
                    "<strong>Analítica del sitio web.</strong> Con tu consentimiento, estas páginas cargan Google Analytics, que nos ofrece estadísticas de tráfico agregadas (páginas vistas, sitios de procedencia, ubicación geográfica aproximada, tipo de dispositivo), y Microsoft Clarity, que registra cómo usan el sitio los visitantes (clics, toques, desplazamiento, movimientos del ratón) en forma de grabaciones de sesión y mapas de calor, para que veamos en qué partes de las páginas se confunde la gente. Ninguno de los dos se carga hasta que aceptas en el banner de cookies; si rechazas, no se carga ninguno, y si tu navegador envía una señal Global Privacy Control, tampoco se cargan salvo que tú mismo des tu consentimiento desde el pie de página. Aceptar solo autoriza el almacenamiento de analítica: el almacenamiento publicitario y Google Signals siguen desactivados. Google recibe tu dirección IP con cada solicitud, pero, según Google, no la registra ni la almacena en el caso de los visitantes de la UE, Suiza o el Reino Unido, y solo la usa para deducir una ubicación aproximada. Clarity oculta lo que escribes en los formularios y también recibe tu dirección IP y los datos de tu navegador. Ninguno de los dos se ejecuta en la página de inicio de sesión. Puedes retirar tu consentimiento en cualquier momento con &laquo;Configuración de cookies&raquo;, en el pie de página, lo que además borra las cookies de analítica instaladas por este sitio; tu elección se guarda en el almacenamiento local de tu navegador durante un máximo de 6 meses.",
                    "<strong>Telemetría del servidor.</strong> Cada llamada a una herramienta MCP genera una fila de telemetría de uso (qué herramienta se ejecutó, si tuvo éxito, cuánto tardó y qué revisión del protocolo MCP y qué app de IA, según el nombre y la versión que indica, hicieron la llamada), vinculada al id de tu cuenta, pero no a lo que registraste. La usamos para detectar herramientas lentas o que fallan. No se comparte con nadie y se elimina junto con todo lo demás cuando eliminas tu cuenta.",
                ]),
                p(
                    "Como el sitio carga fuentes e iconos desde Google Fonts y jsDelivr, al visitar estas páginas tu dirección IP queda expuesta a esos proveedores. El número de estrellas del proyecto en GitHub lo obtiene nuestro servidor, no tu navegador, así que GitHub nunca ve tu visita.",
                ),
            ],
        },
        {
            heading: "Dónde se almacenan",
            blocks: [
                p(
                    'Todos los datos se almacenan en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) en la UE, en la región de AWS de Irlanda (eu-west-1). Supabase también gestiona la autenticación y el almacenamiento de las exportaciones en esa misma región. El servidor se ejecuta en DigitalOcean, en Fráncfort (Alemania). Las solicitudes al sitio y al servidor pasan por la red de Cloudflare (que usa nuestro proveedor de alojamiento), que descifra la conexión y, por tanto, trata en tránsito todo lo que se envía al servicio o desde él, incluida tu dirección IP, y puede instalar una cookie de protección contra bots estrictamente necesaria (<code>__cf_bm</code>, 30 minutos).',
                ),
            ],
        },
        {
            heading: "Cuánto tiempo conservamos los datos",
            blocks: [
                p(
                    "Tus registros de comidas, agua, peso y medidas corporales, tus objetivos y el historial de sus cambios, tus ajustes de perfil y tu telemetría de uso de herramientas se conservan mientras exista tu cuenta; ninguno tiene fecha de caducidad propia ni una purga programada. Cuando eliminas tu cuenta, todo ello se elimina de forma inmediata e irreversible, como se explica más abajo. Los únicos rastros que quedan son la fila de telemetría de la propia eliminación, que se registra sin el id de tu cuenta; el registro de ejecución del servidor de corta duración descrito arriba, que nunca contiene el id de tu cuenta; los registros operativos de nuestro proveedor de base de datos, que se conservan durante un periodo limitado (hasta 7 días en nuestro plan), y sus copias de seguridad rotativas, que caducan según su propio calendario.",
                ),
                p(
                    "Las credenciales de inicio de sesión son de corta duración por diseño. La sesión de la página de inicio de sesión dura 10 minutos y se guarda en la memoria del servidor; está vinculada a tu navegador mediante una cookie estrictamente necesaria que solo contiene un valor aleatorio, caduca a los mismos 10 minutos y se elimina al terminar el inicio de sesión. Para comprobar tu contraseña o tu inicio de sesión con Google usamos Supabase Auth, que cada vez crea una sesión de autenticación de Supabase; nunca la usamos y la cerramos de inmediato. El código de autorización de un solo uso que se entrega a tu app de IA caduca a los 10 minutos y se elimina en cuanto se usa. Un token de acceso es válido durante 24 horas (los pocos emitidos hasta el 27 de septiembre de 2026 inclusive caducan, como muy tarde, el 6 de octubre de 2026); un token de actualización es válido durante 90 días y se elimina en el momento en que se usa para obtener un par nuevo. Los tokens y códigos caducados se eliminan automáticamente en menos de una hora. Si eliminas tu cuenta, se eliminan todos de inmediato.",
                ),
                p(
                    "La sincronización con Apple Health también tiene un límite de tiempo. La conexión termina cuando pasa 90 días sin usarse y, en cualquier caso, 365 días después de conectarla; después hay que volver a conectar el atajo. El registro de lo enviado guarda solo los últimos 8 días, y una solicitud de conexión que no completes dura 30 minutos. Las conexiones, los registros y las solicitudes caducados se eliminan automáticamente en menos de una hora. Si eliges Disconnect en el atajo, la conexión y su registro se eliminan de inmediato.",
                ),
                p(
                    "Los archivos de exportación duran poco. Cada nueva exportación sobrescribe la anterior, y el archivo se elimina automáticamente en cuanto caduca su enlace de descarga de 60 minutos: cada diez minutos se ejecuta una limpieza, así que normalmente un archivo no permanece almacenado más de unos 70 minutos.",
                ),
            ],
        },
        {
            heading: "Eliminación de datos",
            blocks: [
                p(
                    "Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento pidiéndole a tu asistente de IA que <strong>elimine tu cuenta</strong> mientras esté conectado al servidor Nutrition MCP. Esta acción es inmediata e irreversible. Elimina tus registros de comidas, agua, peso y medidas corporales, tus objetivos y el historial de sus cambios, tus ajustes de perfil, cualquier archivo de exportación que siga almacenado, tu telemetría de uso de herramientas, tus tokens de acceso, tu conexión de sincronización con Apple Health y su registro de lo enviado, y la propia cuenta. Esto incluye todas las cifras de alcohol que hayas registrado, estuviera o no activado el seguimiento de alcohol. Los totales que el atajo ya escribió en Apple Health están en tu iPhone, no en nuestros servidores; se quedan allí hasta que los elimines en la app Salud.",
                ),
            ],
        },
        {
            heading: "Contacto y tus derechos",
            blocks: [
                p(
                    'Nutrition MCP lo gestiona Anton Kutishevskyi, un desarrollador particular, que es el responsable del tratamiento de tus datos personales en este servicio. Para cualquier consulta sobre tus datos o sobre esta política, escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("En qué nos basamos para tratarlos:"),
                ul([
                    "<strong>Tu cuenta y tus registros</strong>: para prestarte el servicio para el que creaste tu cuenta (ejecución de un contrato). Las comidas, el peso, las medidas corporales y el alcohol son datos de salud, así que los tratamos sobre la base de tu consentimiento explícito, que das al crear tu cuenta y cada vez que inicias sesión (si tu app se conectó antes de que la página de inicio de sesión pidiera este consentimiento, lo das al registrar cada entrada hasta que vuelvas a iniciar sesión), y que puedes retirar en cualquier momento eliminando las entradas o tu cuenta. La sincronización con Apple Health se basa en ese mismo consentimiento y solo funciona cuando la conectas; si la desconectas en el atajo, retiras ese consentimiento para la sincronización.",
                    "<strong>La telemetría de uso de herramientas y el registro de ejecución del servidor</strong>: nuestro interés legítimo en que el servicio funcione bien y sea rápido y seguro (detectar herramientas que fallan, limitar los abusos con límites de solicitudes). Ninguno de los dos contiene el contenido de tus registros.",
                    "<strong>La analítica del sitio web</strong>: tu consentimiento, que das en el banner de cookies y puedes retirar en cualquier momento con &laquo;Configuración de cookies&raquo;, en el pie de página.",
                ]),
                p(
                    "Tus derechos y cómo ejercerlos (para la mayoría ni siquiera necesitas escribirnos):",
                ),
                ul([
                    "<strong>Acceso y portabilidad</strong>: pídele a tu asistente de IA que exporte tus datos. Recibirás un ZIP de archivos CSV con todo lo que almacenamos sobre ti: tus registros de comidas, agua, peso y medidas corporales, tus objetivos y el historial de sus cambios, tus ajustes, el registro de tu cuenta (dirección de correo electrónico, métodos y fechas de inicio de sesión, y el nombre o la foto que haya enviado Google, si los hay), tu telemetría de uso de herramientas, las conexiones que mantienen la sesión iniciada en tus apps de IA y en la sincronización con Apple Health (sin los tokens en sí), y el registro de los totales diarios enviados a Apple Health en los últimos 8 días. No incluye: los valores que solo guardamos como hashes unidireccionales por seguridad (tu contraseña y los tokens de tus conexiones), datos internos de gestión como las claves de detección de duplicados, el registro de ejecución del servidor, que no contiene el id de tu cuenta, ni los registros de corta duración y las copias de seguridad rotativas de nuestros proveedores.",
                    "<strong>Rectificación</strong>: pídele a tu asistente de IA que corrija o elimine cualquier entrada de comida, agua, peso o medida corporal, o que cambie tus objetivos y ajustes.",
                    "<strong>Supresión</strong>: pídele a tu asistente de IA que elimine tu cuenta, lo que lo borra todo de una vez.",
                    "<strong>Oposición y limitación del tratamiento</strong>: escríbenos.",
                    "<strong>Reclamación</strong>: puedes presentar una reclamación ante la autoridad de control de protección de datos del lugar donde vives o trabajas. Te agradeceríamos que antes nos dieras la oportunidad de solucionarlo.",
                ]),
                p(
                    "Todo lo que almacenamos se queda en la región de la UE indicada arriba. Lo que tu asistente de IA lee a través de las herramientas se envía al proveedor de ese asistente, que puede estar fuera de la UE; eso ocurre en virtud de tu propio acuerdo con él, no del nuestro. Cloudflare (la red por la que pasa cada solicitud), Google y Microsoft (analítica del sitio web, Google Sign-In) y Google y jsDelivr (las solicitudes de fuentes e iconos descritas arriba) también están fuera de la UE; cuando reciben datos personales desde fuera de la UE, se amparan en las cláusulas contractuales tipo de la Comisión Europea o en el Marco de Privacidad de Datos UE-EE. UU. La sincronización con Apple Health no añade ninguna transferencia por nuestra parte: los totales van de nuestro servidor al atajo de tu iPhone, y lo que Apple Health haga después con ellos depende de tus propios ajustes de Apple.",
                ),
                p(
                    'El servicio no está pensado para menores de 16 años, y los <a href="/terms" data-legal-link="terms">Términos de servicio</a> exigen que tengas al menos 16. Si crees que alguien menor de esa edad ha creado una cuenta, escríbenos y la eliminaremos.',
                ),
                p(
                    "Si esta política cambia, también cambiará la fecha que aparece arriba.",
                ),
            ],
        },
        {
            heading: "Términos de servicio",
            blocks: [
                p(
                    'El uso del servicio también se rige por nuestros <a href="/terms" data-legal-link="terms">Términos de servicio</a>, que regulan el uso aceptable, aclaran que nada de lo que aparece aquí es consejo médico y excluyen cualquier garantía: el servicio se presta tal cual, de forma gratuita, sin garantías de disponibilidad, exactitud ni idoneidad para ningún fin.',
                ),
            ],
        },
    ],
};

export const TERMS_ES: LegalDoc = {
    title: "Términos de servicio",
    metaDescription:
        "Términos claros de Nutrition MCP, app de nutrición y servidor MCP gratuito y de código abierto para Claude y ChatGPT: cuentas, uso aceptable, datos y responsabilidad.",
    ogDescription:
        "Los términos que rigen el uso de Nutrition MCP, la app de seguimiento nutricional gratuita y de código abierto que funciona como servidor MCP remoto para Claude y ChatGPT.",
    lastUpdated: "3 de octubre de 2026",
    backToHome: "Volver al inicio",
    lead: "Los términos que rigen el uso de Nutrition MCP, la app de seguimiento nutricional gratuita y de código abierto que funciona como servidor MCP remoto para Claude y ChatGPT.",
    documentsLabel: "Documentos legales",
    tocLabel: "En esta página",
    sections: [
        {
            heading: "Aceptación",
            blocks: [
                p(
                    "Estos términos rigen tu uso de Nutrition MCP (el &laquo;servicio&raquo;), es decir, el sitio web nutrition-mcp.com y el servidor MCP remoto en <strong>https://nutrition-mcp.com/mcp</strong>. Al crear una cuenta o conectar un asistente de IA al servidor, aceptas estos términos. Si no estás de acuerdo con ellos, te pedimos que no uses el servicio.",
                ),
                p(
                    "El servicio lo gestiona Anton Kutishevskyi, un desarrollador particular (&laquo;nosotros&raquo;).",
                ),
            ],
        },
        {
            heading: "El servicio",
            blocks: [
                p(
                    'Nutrition MCP es una app de seguimiento nutricional gratuita y de código abierto que funciona como servidor MCP y permite que asistentes de IA como Claude y ChatGPT registren comidas, agua, peso corporal y medidas corporales en tu nombre. De forma opcional, un atajo en tu iPhone puede copiar tus totales diarios en Apple Health. No hay ningún plan de pago, ni publicidad, ni ningún coste por usar el servicio. Aceptamos donaciones voluntarias en Patreon para ayudar a cubrir los costes de alojamiento y de base de datos; son un regalo, no una compra, y no dan acceso a ninguna función, ningún plan ni ningún tipo de prioridad. El código fuente está publicado con licencia MIT en <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> y puedes autoalojarlo libremente.',
                ),
            ],
        },
        {
            heading: "Tu cuenta",
            blocks: [
                p(
                    "Debes tener al menos 16 años para usar el servicio. No verificamos la edad, así que al crear una cuenta confirmas que cumples ese requisito. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de toda la actividad que se realice con tu cuenta. Indica una dirección de correo electrónico que controles de verdad: es la única forma de recuperar el acceso.",
                ),
                p(
                    "Solo puedes usar el servicio donde tu proveedor de IA lo admita y donde lo permitan las leyes de sanciones y de control de exportaciones aplicables.",
                ),
            ],
        },
        {
            heading: "No es consejo médico",
            blocks: [
                p(
                    "Nutrition MCP es una herramienta de registro e informes, no un servicio sanitario. Nada de lo que genera (cifras de calorías y macros, objetivos, tendencias o cualquier comentario que añada tu asistente de IA) constituye consejo médico, nutricional ni dietético, y nada de ello sustituye a un profesional cualificado. Consulta a un médico o a un dietista antes de tomar decisiones sobre tu salud, sobre todo si tienes alguna afección médica o antecedentes de trastornos de la conducta alimentaria.",
                ),
                p(
                    "El servicio no está diseñado para uso clínico, y las personas con un trastorno de la conducta alimentaria activo, las embarazadas y quienes estén bajo supervisión clínica por una afección relacionada con la nutrición no deberían usarlo sin que intervenga su profesional sanitario. En esas situaciones, llevar la cuenta de calorías y macros puede ser perjudicial. Si es tu caso, habla con tu profesional sanitario antes de usarlo.",
                ),
                p(
                    "Las cifras nutricionales son <strong>estimaciones</strong>. Proceden de modelos de IA que interpretan tus descripciones y fotos, de bases de datos de terceros como Open Food Facts y de lo que introduzcas tú. Pueden ser erróneas. Comprueba todo lo que sea importante.",
                ),
                p(
                    "Las fotos de comida nunca se envían a nuestro servidor. Tu asistente de IA interpreta la imagen por su cuenta y solo nos envía el texto y los números resultantes: una descripción, un tipo de comida, calorías, macros, notas, un código de barras.",
                ),
            ],
        },
        {
            heading: "Uso aceptable",
            blocks: [
                p("Al usar el servicio, te comprometes a no:"),
                ul([
                    "usarlo con fines ilícitos ni infringiendo ninguna ley o normativa aplicable;",
                    "intentar acceder a la cuenta o a los datos de otro usuario, ni eludir la autenticación, los límites de solicitudes o cualquier otro control técnico;",
                    "sondear, escanear, sobrecargar o interrumpir el servicio o la infraestructura en la que se ejecuta, incluso mediante solicitudes masivas automatizadas;",
                    "subir contenido ilegal o que no tengas derecho a compartir;",
                    "revender el servicio alojado o presentarlo como propio;",
                    "usarlo para someterte a una restricción calórica extrema, ni para promoverla, fomentarla o guiar a otras personas hacia ella.",
                ]),
                p(
                    "El servicio aplica límites de solicitudes para que siga disponible para todos. Si necesitas un volumen mayor, autoalójalo: para eso está la licencia MIT.",
                ),
            ],
        },
        {
            heading: "Tus datos",
            blocks: [
                p(
                    'Tus registros siguen siendo tuyos. Los almacenamos y tratamos para prestarte el servicio, tal como se describe en nuestra <a href="/privacy" data-legal-link="privacy">Política de privacidad</a>. Eres responsable del contenido que registras.',
                ),
                p(
                    "Puedes exportar todos tus datos en cualquier momento pidiéndole a tu asistente de IA que lo haga. La exportación es un archivo ZIP con archivos CSV de tus comidas, agua, peso, medidas corporales, objetivos, historial de objetivos, ajustes de perfil, registro de cuenta, telemetría de uso de herramientas, apps de IA conectadas y sincronización con Apple Health; el alcohol se incluye esté o no activado el seguimiento de alcohol. El enlace de descarga que te facilitamos es privado y caduca a los 60 minutos.",
                ),
                p(
                    "Si conectas la sincronización con Apple Health, tus totales diarios se escriben en Apple Health en tu iPhone a petición tuya. Una vez allí, quedan en tus manos y sujetos a las condiciones de Apple: desconectar o eliminar tu cuenta no los borra, y como Apple Health no puede reducir un valor que ya tiene, un día que corrijas a la baja más tarde no se corrige allí; esas entradas tendrás que eliminarlas en la app Salud. Mantén el atajo solo en dispositivos que uses tú: contiene el token que le permite usar la sincronización de tu cuenta, y desconectarlo desde el menú del atajo invalida ese token al instante.",
                ),
                p(
                    "También registramos telemetría operativa básica sobre el uso del servicio: para cada llamada a una herramienta, el nombre de la herramienta, si tuvo éxito, cuánto tardó, una categoría de error genérica si falla, la duración de cualquier rango de fechas que hayas pedido, el id de sesión, la revisión del protocolo MCP con la que se conectó tu app de IA y el nombre y la versión con los que esa app se identifica. Estas filas están vinculadas al id de tu cuenta. No contienen lo que registraste: ni descripciones de comidas, ni calorías, ni pesos ni medidas. Las usamos para que el servicio siga funcionando y para ver qué herramientas vale la pena mejorar, y se eliminan junto con todo lo demás cuando eliminas tu cuenta.",
                ),
                p(
                    "Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento pidiéndole a tu asistente de IA que <strong>elimine tu cuenta</strong> mientras esté conectado; esta acción es inmediata e irreversible.",
                ),
            ],
        },
        {
            heading: "Disponibilidad y cambios",
            blocks: [
                p(
                    "El servicio se ofrece de forma gratuita, sin compromiso de disponibilidad ni acuerdo de nivel de servicio. Podemos modificar, suspender o dejar de ofrecer cualquier parte del servicio (incluidas las herramientas, las funciones y el propio servidor alojado) en cualquier momento y sin previo aviso. También podemos modificar o eliminar el contenido que incumpla estos términos.",
                ),
            ],
        },
        {
            heading: "Servicios de terceros",
            blocks: [
                p(
                    "El servicio depende de terceros: Supabase para la base de datos, la autenticación y el almacenamiento de exportaciones; DigitalOcean para el alojamiento; Cloudflare (a través de nuestro proveedor de alojamiento) para la red por la que pasa cada solicitud; Open Food Facts para los datos de códigos de barras; las apps Atajos y Salud de Apple, si conectas la sincronización con Apple Health, y el asistente de IA desde el que te conectes.",
                ),
                p(
                    'Datos de productos por código de barras &copy; colaboradores de <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, disponibles bajo la <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Además, el propio sitio web usa, con tu consentimiento, Google Analytics y Microsoft Clarity para medir el tráfico y el uso de las páginas; Google Fonts y la CDN de jsDelivr para cargar fuentes e iconos; Google Sign-In, si eliges ese método de inicio de sesión, y la API de GitHub, que consulta nuestro servidor (no tu navegador) para obtener el número de estrellas del proyecto, de modo que ningún dato de los visitantes llega a GitHub. Por tanto, al cargar una página se envían solicitudes a Google Fonts y jsDelivr, que pueden ver tu dirección IP y tu navegador; con Google Analytics y Microsoft Clarity solo se establece contacto después de que aceptes la analítica.",
                ),
                p(
                    "Cada uno tiene sus propios términos y su propia disponibilidad, de los que no somos responsables.",
                ),
            ],
        },
        {
            heading: "Sin garantía",
            blocks: [
                p(
                    "El servicio se proporciona <strong>&laquo;tal cual&raquo; y &laquo;según disponibilidad&raquo;</strong>, sin garantías de ningún tipo, expresas o implícitas, incluidas las garantías implícitas de comerciabilidad, idoneidad para un fin determinado, exactitud o no infracción. No garantizamos que el servicio sea ininterrumpido, seguro o libre de errores, ni que los datos o las cifras nutricionales que genere sean exactos. Lo usas bajo tu propia responsabilidad.",
                ),
            ],
        },
        {
            heading: "Limitación de responsabilidad",
            blocks: [
                p(
                    "En la máxima medida permitida por la ley, no somos responsables de ningún daño indirecto, incidental, especial, derivado o punitivo, ni de ninguna pérdida de datos o de beneficios, que resulte de tu uso del servicio o guarde relación con él.",
                ),
            ],
        },
        {
            heading: "Tus derechos legales",
            blocks: [
                p(
                    "Hay responsabilidades que nunca se pueden excluir, y no lo intentamos. Seguimos siendo plenamente responsables de la muerte o las lesiones personales causadas por nuestra negligencia, así como del fraude o de las declaraciones falsas realizadas de forma fraudulenta.",
                ),
                p(
                    "También conservas todos los derechos que la ley te reconoce como consumidor. Estos términos se aplican junto con esos derechos y no los limitan. Si alguna sección anterior entra en conflicto con un derecho al que no puedes renunciar, prevalece tu derecho legal.",
                ),
            ],
        },
        {
            heading: "Terminación",
            blocks: [
                p(
                    "Puedes dejar de usar el servicio en cualquier momento y eliminar tu cuenta como se explica arriba. Podemos suspender o cancelar el acceso que incumpla estos términos o que ponga en riesgo la estabilidad o la seguridad del servicio. Las secciones &laquo;Sin garantía&raquo;, &laquo;Limitación de responsabilidad&raquo; y &laquo;Tus derechos legales&raquo; siguen vigentes tras la terminación.",
                ),
            ],
        },
        {
            heading: "Cambios en estos términos",
            blocks: [
                p(
                    "Podemos actualizar estos términos de vez en cuando. La versión vigente siempre está en esta página, y la fecha que aparece arriba indica cuándo se modificó por última vez. Si sigues usando el servicio después de una actualización, aceptas los términos revisados.",
                ),
            ],
        },
        {
            heading: "Nulidad parcial",
            blocks: [
                p(
                    "Si alguna parte de estos términos se considera inaplicable, esa parte se elimina y el resto sigue en vigor.",
                ),
            ],
        },
        {
            heading: "Contacto",
            blocks: [
                p(
                    '¿Tienes preguntas sobre estos términos o sobre tus datos? Escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

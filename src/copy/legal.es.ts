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
        "Cómo gestiona Nutrition MCP tus datos: qué guardamos, cómo se usa, dónde vive y cómo eliminar tu cuenta y todo lo que contiene en cualquier momento.",
    ogDescription:
        "Cómo gestiona Nutrition MCP tus datos: qué guardamos, cómo se usa, dónde vive y cómo eliminar tu cuenta y todo lo que contiene en cualquier momento.",
    lastUpdated: "27 de septiembre de 2026",
    backToHome: "Volver al inicio",
    sections: [
        {
            heading: "Qué recopilamos",
            blocks: [
                p(
                    "Cuando te registras, guardamos tu <strong>dirección de correo electrónico</strong> y una contraseña con hash seguro a través de Supabase Auth. Si en cambio inicias sesión con Google, a Google solo le pedimos tu dirección de correo electrónico, y la recibimos junto con el identificador de tu cuenta de Google, que Supabase Auth conserva para poder reconocerte la próxima vez que inicies sesión con Google. Nunca vemos ninguna contraseña de Google. Las cuentas que iniciaron sesión con Google antes del 27 de septiembre de 2026 pueden conservar todavía el nombre y la foto de perfil que Google envió entonces; nada en el servicio los lee ni los muestra, y se eliminan junto con tu cuenta.",
                ),
                p("Cuando usas el servicio, guardamos:"),
                ul([
                    "<strong>Registros de comidas</strong> — descripción, tipo de comida, calorías, macros, fibra, azúcares totales, gramos de alcohol, miligramos de cafeína, notas y marcas de tiempo. Las fotos de comida son interpretadas por tu asistente de IA y nunca se suben ni se almacenan en nuestros servidores.",
                    "<strong>Registros de agua</strong> — cantidad, notas y marcas de tiempo.",
                    "<strong>Registros de peso corporal</strong> — peso, notas y marcas de tiempo. Estos son datos de salud, y se tratan exactamente igual que el resto de tus registros.",
                    "<strong>Objetivos</strong> — tus metas diarias de calorías, proteína, carbohidratos, grasa, fibra, azúcar, alcohol, cafeína y agua, y tu peso objetivo.",
                    "<strong>Ajustes de perfil</strong> — tu zona horaria IANA, unidad de peso preferida, si el seguimiento de alcohol está activado y en qué bebida estándar se muestra, si los widgets integrados en el chat están habilitados y el idioma en que se muestran esos widgets.",
                    "<strong>Telemetría de uso de herramientas</strong> — para cada llamada a una herramienta MCP, qué herramienta se ejecutó, si tuvo éxito, cuánto tardó, una categoría de error genérica cuando falla, la duración en días de cualquier rango de fechas que hayas pedido, el id de sesión MCP, la revisión del protocolo MCP con la que se conectó tu app de IA y el nombre y la versión con los que esa app se identifica (por ejemplo, &laquo;claude-ai/1.0&raquo;), cuando los envía. Está vinculada al id de tu cuenta. Nunca incluye el contenido de tus registros.",
                    "<strong>Registro de ejecución del servidor</strong> — para cada solicitud al servidor: el método, la ruta, el estado y el tiempo de respuesta, tu dirección IP sin su última parte y, en las solicitudes MCP, la revisión del protocolo y el nombre y la versión que indica tu app de IA. Para cada llamada a una herramienta registra además el nombre de la herramienta, si tuvo éxito, cuánto tardó y, cuando falla, un código de referencia breve y el mensaje de error, que puede repetir un valor que envió tu app de IA, como una fecha no válida. Cuando tu app de IA inicia sesión o renueva su conexión, se registran el resultado, el identificador aleatorio que se asignó a tu app de IA al registrarse en nuestro servicio de inicio de sesión y el sitio al que pidió volver (por ejemplo, claude.ai). Se escribe en el registro de ejecución de nuestro proveedor de alojamiento, no contiene el id de tu cuenta ni tu dirección de correo electrónico y se conserva solo brevemente: ese registro es un búfer rotativo que sobrescribe las líneas más antiguas a medida que llega tráfico nuevo.",
                ]),
                p(
                    "<strong>El alcohol también es un dato de salud</strong>, y de un tipo más sensible que un recuento de calorías, así que funciona de forma distinta a todo lo anterior. El seguimiento de alcohol está desactivado por defecto, y solo registramos alcohol cuando proviene de ti — una bebida que registras, o una columna en un archivo que importas. Nada se infiere en tu nombre. Desactivar el ajuste hace dos cosas: el importador masivo deja de leer la columna de alcohol en los archivos que subes, y todo lo demás deja de mostrar alcohol en las comidas, objetivos, progreso y widgets que ves. No es un interruptor de eliminación. El alcohol que registraste directamente sigue registrado esté activado o no el ajuste, lo que ya está guardado permanece en la base de datos, y todo ello sigue apareciendo en el archivo de comidas de cualquier exportación que hagas. Para eliminar de verdad una cifra de alcohol, elimina la comida a la que pertenece, o elimina tu cuenta.",
                ),
                p(
                    "También guardamos los tokens de acceso y actualización de OAuth y los códigos de autorización que permiten que tu asistente de IA permanezca conectado a tu cuenta; cuánto dura cada uno se explica en &laquo;Cuánto tiempo conservamos los datos&raquo;. Solo se almacenan como hashes unidireccionales.",
                ),
            ],
        },
        {
            heading: "Cómo lo usamos",
            blocks: [
                p(
                    "Tus datos de comidas, agua, peso y objetivos se usan únicamente para prestar el servicio de seguimiento nutricional. <strong>Nunca los vendemos, nunca los compartimos con terceros y nunca los usamos para publicidad</strong> ni los introducimos en ningún sistema de anuncios o perfilado.",
                ),
                p(
                    'Cuando buscas un código de barras, ya sea tú mismo o a través de tu asistente de IA, nuestro servidor envía solo los dígitos del código de barras a <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> — nunca tu cuenta, tu correo electrónico ni tus registros — y guarda los datos del producto que devuelve en una caché compartida que no está vinculada a ningún usuario.',
                ),
                p(
                    "Existen dos tipos de analítica, y ninguno toca el contenido de tus registros:",
                ),
                ul([
                    "<strong>Analítica del sitio web.</strong> Con tu consentimiento, estas páginas cargan Google Analytics, que nos da estadísticas de tráfico agregadas — páginas vistas, referentes, geografía aproximada, tipo de dispositivo —, y Microsoft Clarity, que registra cómo usan el sitio los visitantes — clics, toques, desplazamiento, movimientos del ratón — como grabaciones de sesión y mapas de calor, para que veamos dónde confunden las páginas. Ninguno de los dos se carga hasta que aceptas en el banner de cookies; si rechazas, no se carga ninguno, y si tu navegador envía una señal Global Privacy Control, no se carga ninguno salvo que tú mismo aceptes desde el pie de página. Aceptar solo concede el almacenamiento de analítica: el almacenamiento publicitario y Google Signals siguen desactivados. Google recibe tu dirección IP con cada solicitud, pero, según Google, no la registra ni la almacena para los visitantes de la UE, Suiza o el Reino Unido, y solo la usa para deducir una ubicación aproximada. Clarity oculta lo que escribes en los formularios y también recibe tu dirección IP y los datos de tu navegador. Ninguno de los dos se ejecuta en la página de inicio de sesión. Puedes retirar tu consentimiento en cualquier momento con &laquo;Configuración de cookies&raquo; en el pie de página, lo que además borra las cookies de analítica que este sitio haya instalado; tu elección se guarda en el almacenamiento local de tu navegador durante un máximo de 6 meses.",
                    "<strong>Telemetría del servidor.</strong> Cada llamada a una herramienta MCP escribe una fila de telemetría de uso — qué herramienta se ejecutó, si tuvo éxito, cuánto tardó, qué revisión del protocolo MCP y qué app de IA (por el nombre y la versión que indica) hicieron la llamada — vinculada al id de tu cuenta pero no a lo que registraste. La usamos para encontrar herramientas lentas o rotas. No se comparte con nadie, y se elimina junto con todo lo demás cuando eliminas tu cuenta.",
                ]),
                p(
                    "Como el sitio carga fuentes e iconos desde Google Fonts y jsDelivr, y la página de inicio obtiene el número de estrellas del proyecto desde la API de GitHub, visitar estas páginas expone tu dirección IP a esos proveedores.",
                ),
            ],
        },
        {
            heading: "Dónde se almacena",
            blocks: [
                p(
                    'Todos los datos se almacenan en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) en la UE, en la región de AWS en Irlanda (eu-west-1). La autenticación y el almacenamiento de exportaciones los gestiona Supabase en esa misma región. El servidor se ejecuta en DigitalOcean en Fráncfort (Alemania).',
                ),
            ],
        },
        {
            heading: "Cuánto tiempo conservamos los datos",
            blocks: [
                p(
                    "Tus registros de comidas, agua y peso, tus objetivos, tus ajustes de perfil y tu telemetría de uso de herramientas se conservan mientras exista tu cuenta; ninguno tiene una fecha de caducidad propia ni una purga programada. Cuando eliminas tu cuenta, todo ello se elimina de forma inmediata e irreversible, como se describe más abajo. Los únicos rastros que quedan son la fila de telemetría de la propia eliminación, que se registra sin el id de tu cuenta; el registro de ejecución del servidor de corta duración descrito arriba, que nunca lleva el id de tu cuenta; los registros operativos de nuestro proveedor de base de datos, que se conservan durante un periodo limitado (hasta 7 días en nuestro plan), y sus copias de seguridad rotativas, que caducan según su propio calendario.",
                ),
                p(
                    "Las credenciales de inicio de sesión son de corta duración por diseño. La sesión de la página de inicio de sesión dura 10 minutos y se guarda en la memoria del servidor; está vinculada a tu navegador mediante una cookie estrictamente necesaria que solo contiene un valor aleatorio, que caduca a los mismos 10 minutos y que se elimina al terminar el inicio de sesión. Para comprobar tu contraseña o tu inicio de sesión con Google usamos Supabase Auth, que cada vez crea una sesión de autenticación de Supabase; nunca la usamos y la cerramos de inmediato. El código de autorización de un solo uso que se entrega a tu app de IA caduca a los 10 minutos y se elimina en cuanto se usa. Un token de acceso nuevo es válido durante 24 horas (uno emitido antes del 27 de septiembre de 2026 conserva la duración con la que se emitió, de hasta un año); un token de actualización es válido durante 90 días y se elimina en el momento en que se usa para obtener un par nuevo. Los tokens y códigos caducados se eliminan automáticamente en menos de una hora. Eliminar tu cuenta los elimina todos de inmediato.",
                ),
                p(
                    "Los archivos de exportación duran poco. Cada nueva exportación sobrescribe la anterior, y el archivo se elimina automáticamente en cuanto caduca su enlace de descarga de 60 minutos: una limpieza se ejecuta cada diez minutos, así que un archivo normalmente no permanece almacenado más de unos 70 minutos.",
                ),
            ],
        },
        {
            heading: "Eliminación de datos",
            blocks: [
                p(
                    "Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento pidiéndole a tu asistente de IA que <strong>elimine tu cuenta</strong> mientras esté conectado al servidor Nutrition MCP. Esta acción es inmediata e irreversible. Elimina tus registros de comidas, agua y peso, objetivos, ajustes de perfil, cualquier archivo de exportación que siga almacenado, tu telemetría de uso de herramientas, tus tokens de acceso y la cuenta misma. Esto incluye cada cifra de alcohol que hayas registrado alguna vez, esté o no activado el seguimiento de alcohol.",
                ),
            ],
        },
        {
            heading: "Contacto y tus derechos",
            blocks: [
                p(
                    'Nutrition MCP lo gestiona Anton Kutishevskyi, un desarrollador particular, que es el responsable del tratamiento de tus datos personales en este servicio. Para cualquier cuestión sobre tus datos o esta política, escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("En qué nos basamos para tratarlos:"),
                ul([
                    "<strong>Tu cuenta y tus registros</strong> — para prestarte el servicio en el que te registraste (ejecución de un contrato). Las comidas, el peso y el alcohol son datos de salud, así que los tratamos sobre la base de tu consentimiento explícito, que das al registrarlos y que puedes retirar en cualquier momento eliminando las entradas o tu cuenta.",
                    "<strong>La telemetría de uso de herramientas y el registro de ejecución del servidor</strong> — nuestro interés legítimo en que el servicio funcione bien, sea rápido y seguro (detectar herramientas rotas, limitar los abusos). Ninguno de los dos contiene el contenido de tus registros.",
                    "<strong>La analítica del sitio web</strong> — tu consentimiento, que das en el banner de cookies y puedes retirar en cualquier momento con &laquo;Configuración de cookies&raquo; en el pie de página.",
                ]),
                p(
                    "Tus derechos y cómo ejercerlos (la mayoría no requieren ningún correo):",
                ),
                ul([
                    "<strong>Acceso y portabilidad</strong> — pídele a tu asistente de IA que exporte tus datos. Recibirás un ZIP de archivos CSV con todo lo que registraste, tus objetivos y tus ajustes. Para cualquier otro dato que conservemos sobre ti — el correo electrónico de tu cuenta, los registros de tu cuenta y de inicio de sesión, y la telemetría de uso de herramientas —, escríbenos desde la dirección de correo de tu cuenta y te enviaremos una copia en el plazo de un mes.",
                    "<strong>Rectificación</strong> — pídele a tu asistente de IA que corrija o elimine cualquier entrada de comida, agua o peso, o que cambie tus objetivos y ajustes.",
                    "<strong>Supresión</strong> — pídele a tu asistente de IA que elimine tu cuenta, lo que lo borra todo de una vez.",
                    "<strong>Oposición y limitación del tratamiento</strong> — escríbenos y te responderemos en el plazo de un mes.",
                    "<strong>Reclamación</strong> — puedes presentar una reclamación ante la autoridad de protección de datos del lugar donde vives o trabajas. Te agradeceríamos que nos dieras antes la oportunidad de solucionarlo.",
                ]),
                p(
                    "Todo lo que almacenamos se queda en la región de la UE indicada arriba. Lo que tu asistente de IA lee a través de las herramientas se envía al proveedor de ese asistente, que puede estar fuera de la UE; eso ocurre en virtud de tu propio acuerdo con él, no del nuestro. Google y Microsoft (analítica del sitio web, Google Sign-In) y Google, jsDelivr y GitHub (las solicitudes de fuentes, iconos y número de estrellas descritas arriba) también están fuera de la UE; cuando reciben datos personales desde fuera de la UE, se amparan en las cláusulas contractuales tipo de la Comisión Europea o en el Marco de Privacidad de Datos UE-EE. UU.",
                ),
                p(
                    'El servicio no está pensado para menores de 16 años, y los <a href="/terms" data-legal-link="terms">Términos de servicio</a> exigen que tengas al menos 16. Si crees que alguien más joven ha creado una cuenta, escríbenos y la eliminaremos.',
                ),
                p(
                    "Si esta política cambia, la fecha de la parte superior cambia con ella.",
                ),
            ],
        },
        {
            heading: "Términos de servicio",
            blocks: [
                p(
                    'El uso del servicio también se rige por nuestros <a href="/terms" data-legal-link="terms">Términos de servicio</a>, que cubren el uso aceptable, el hecho de que nada aquí es consejo médico, y la ausencia de cualquier garantía — el servicio se presta tal cual, de forma gratuita, sin garantías de disponibilidad, exactitud o idoneidad para ningún propósito.',
                ),
            ],
        },
    ],
};

export const TERMS_ES: LegalDoc = {
    title: "Términos de servicio",
    metaDescription:
        "Los términos que rigen el uso de Nutrition MCP — el rastreador de nutrición gratuito y de código abierto, y servidor MCP remoto para Claude y ChatGPT. Términos en lenguaje sencillo sobre cuentas, uso aceptable, tus datos y responsabilidad.",
    ogDescription:
        "Los términos que rigen el uso de Nutrition MCP — el rastreador de nutrición gratuito y de código abierto, y servidor MCP remoto para Claude y ChatGPT.",
    lastUpdated: "27 de septiembre de 2026",
    backToHome: "Volver al inicio",
    sections: [
        {
            heading: "Acuerdo",
            blocks: [
                p(
                    "Estos términos rigen tu uso de Nutrition MCP (el &laquo;servicio&raquo;) — el sitio web en nutrition-mcp.com y el servidor MCP remoto en <strong>https://nutrition-mcp.com/mcp</strong>. Al crear una cuenta o conectar un asistente de IA al servidor, aceptas estos términos. Si no estás de acuerdo, por favor no uses el servicio.",
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
                    'Nutrition MCP es un rastreador de nutrición gratuito y de código abierto que se ejecuta como servidor MCP, y que permite que asistentes de IA como Claude y ChatGPT registren comidas, agua y peso corporal en tu nombre. No hay ningún nivel de pago, ninguna publicidad ni ningún coste por usar el servicio. Aceptamos donaciones voluntarias en Patreon para ayudar a cubrir los costes de alojamiento y base de datos; son un regalo, no una compra, y no compran ninguna función, ningún nivel ni ninguna prioridad de ningún tipo. El código fuente está publicado bajo la licencia MIT en <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> y eres libre de autoalojarlo.',
                ),
            ],
        },
        {
            heading: "Tu cuenta",
            blocks: [
                p(
                    "Debes tener al menos 16 años para usar el servicio. No verificamos la edad, así que al crear una cuenta confirmas que cumples ese requisito. Eres responsable de mantener confidenciales tus credenciales de acceso y de toda actividad que ocurra bajo tu cuenta. Proporciona una dirección de correo electrónico que realmente controles — es la única forma de recuperar el acceso.",
                ),
            ],
        },
        {
            heading: "No es consejo médico",
            blocks: [
                p(
                    "Nutrition MCP es una herramienta de registro e informes, no un servicio sanitario. Nada de lo que produce — cifras de calorías y macros, objetivos, tendencias o cualquier comentario que añada tu asistente de IA — es consejo médico, nutricional o dietético, y nada de ello sustituye a un profesional cualificado. Consulta a un médico o a un dietista antes de tomar decisiones sobre tu salud, especialmente si tienes una afección médica o antecedentes de trastornos de la conducta alimentaria.",
                ),
                p(
                    "El servicio no está diseñado para uso clínico y no debería usarlo nadie con un trastorno alimentario activo, ni nadie que esté embarazada o bajo supervisión clínica por una afección relacionada con la nutrición, sin la participación de su profesional clínico. El seguimiento de calorías y macros puede ser perjudicial en esas situaciones. Si esto te describe, habla con tu profesional clínico antes de usarlo.",
                ),
                p(
                    "Las cifras de nutrición son <strong>estimaciones</strong>. Provienen de modelos de IA que interpretan tus descripciones y fotos, de bases de datos de terceros como Open Food Facts, y de lo que introduzcas tú mismo. Pueden estar equivocadas. Verifica todo lo que sea importante.",
                ),
                p(
                    "Las fotos de comida nunca se envían a nuestro servidor. Tu asistente de IA interpreta la imagen por su cuenta y nos envía solo el texto y los números resultantes — una descripción, un tipo de comida, calorías, macros, notas, un código de barras.",
                ),
            ],
        },
        {
            heading: "Uso aceptable",
            blocks: [
                p("Al usar el servicio, aceptas no:"),
                ul([
                    "usarlo con ningún fin ilegal, ni incumpliendo ninguna ley o normativa aplicable;",
                    "intentar acceder a la cuenta o a los datos de otro usuario, ni eludir la autenticación, los límites de frecuencia ni ningún otro control técnico;",
                    "sondear, escanear, sobrecargar o interrumpir el servicio o la infraestructura sobre la que se ejecuta, incluso mediante solicitudes masivas automatizadas;",
                    "subir contenido que sea ilegal, o sobre el que no tengas derecho a compartir;",
                    "revender el servicio alojado o presentarlo como propio;",
                    "usarlo para perseguir una restricción calórica extrema, o para promoverla, orientarla o fomentarla en cualquier otra persona.",
                ]),
                p(
                    "El servicio tiene un límite de frecuencia para mantenerlo disponible para todos. Si necesitas un volumen mayor, autoalójalo — para eso está la licencia MIT.",
                ),
            ],
        },
        {
            heading: "Tus datos",
            blocks: [
                p(
                    'Tus registros siguen siendo tuyos. Los almacenamos y procesamos para operar el servicio para ti, tal como se describe en nuestra <a href="/privacy" data-legal-link="privacy">Política de privacidad</a>. Eres responsable del contenido que registras.',
                ),
                p(
                    "Puedes exportar todos tus datos en cualquier momento pidiéndole a tu asistente de IA que los exporte. La exportación es un archivo ZIP con archivos CSV de tus comidas, agua, peso, objetivos y ajustes de perfil; el alcohol se incluye esté o no activado el seguimiento de alcohol. El enlace de descarga que te entregamos es privado y caduca a los 60 minutos.",
                ),
                p(
                    "También registramos telemetría operativa básica sobre cómo se usa el servicio: para cada llamada a una herramienta, el nombre de la herramienta, si tuvo éxito, cuánto tardó, una categoría de error genérica cuando falla, la duración de cualquier rango de fechas que hayas pedido, el id de sesión, la revisión del protocolo MCP con la que se conectó tu app de IA y el nombre y la versión con los que esa app se identifica. Estas filas están vinculadas al id de tu cuenta. No contienen lo que registraste — ninguna descripción de comida, ninguna caloría, ningún peso. Las usamos para mantener el servicio funcionando y ver qué herramientas merece la pena mejorar, y se eliminan junto con todo lo demás cuando eliminas tu cuenta.",
                ),
                p(
                    "Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento pidiéndole a tu asistente de IA que <strong>elimine tu cuenta</strong> mientras esté conectado — esa acción es inmediata e irreversible.",
                ),
            ],
        },
        {
            heading: "Disponibilidad y cambios",
            blocks: [
                p(
                    "El servicio se ofrece de forma gratuita, sin compromiso de tiempo de actividad ni acuerdo de nivel de servicio. Podemos cambiar, suspender o discontinuar cualquier parte de él — incluidas herramientas, funciones y el propio servidor alojado — en cualquier momento y sin previo aviso. También podemos modificar o eliminar contenido que incumpla estos términos.",
                ),
            ],
        },
        {
            heading: "Servicios de terceros",
            blocks: [
                p(
                    "El servicio depende de terceros: Supabase para la base de datos, la autenticación y el almacenamiento de exportaciones, DigitalOcean para el alojamiento, Open Food Facts para los datos de códigos de barras, y el asistente de IA que sea desde el que te conectes.",
                ),
                p(
                    'Datos de productos por código de barras &copy; colaboradores de <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, disponibles bajo la <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "El propio sitio web también usa, con tu consentimiento, Google Analytics y Microsoft Clarity para medir el tráfico y el uso de las páginas, Google Fonts y la CDN de jsDelivr para cargar fuentes e iconos, Google Sign-In si eliges esa forma de iniciar sesión, y la API de GitHub para mostrar el número de estrellas del proyecto. Cargar una página, por tanto, hace solicitudes a Google Fonts y jsDelivr (y, en la página de inicio, a GitHub), que pueden ver tu dirección IP y tu navegador; Google Analytics y Microsoft Clarity solo se contactan después de que aceptes la analítica.",
                ),
                p(
                    "Sus términos y su disponibilidad son responsabilidad suya, y nosotros no respondemos por ellos.",
                ),
            ],
        },
        {
            heading: "Sin garantía",
            blocks: [
                p(
                    "El servicio se proporciona <strong>&laquo;tal cual&raquo; y &laquo;según disponibilidad&raquo;</strong>, sin garantías de ningún tipo, expresas o implícitas, incluidas las garantías implícitas de comerciabilidad, idoneidad para un propósito particular, exactitud o no infracción. No garantizamos que el servicio vaya a ser ininterrumpido, seguro, libre de errores, ni que cualquier dato o cifra de nutrición que produzca sea exacta. Lo usas por tu cuenta y riesgo.",
                ),
            ],
        },
        {
            heading: "Limitación de responsabilidad",
            blocks: [
                p(
                    "En la medida máxima permitida por la ley, no somos responsables de daños indirectos, incidentales, especiales, derivados o ejemplares, ni de ninguna pérdida de datos o beneficios, que surjan de tu uso del servicio o estén relacionados con él.",
                ),
            ],
        },
        {
            heading: "Tus derechos legales",
            blocks: [
                p(
                    "Algunas responsabilidades nunca se pueden excluir, y no lo intentamos. Seguimos siendo plenamente responsables de la muerte o las lesiones personales causadas por nuestra negligencia, y del fraude o la tergiversación fraudulenta.",
                ),
                p(
                    "También conservas todos los derechos que la ley te otorga como consumidor. Estos términos coexisten con esos derechos y no los reducen. Cuando una sección anterior entre en conflicto con un derecho al que no puedes renunciar, prevalece tu derecho legal.",
                ),
            ],
        },
        {
            heading: "Terminación",
            blocks: [
                p(
                    "Puedes dejar de usar el servicio en cualquier momento y eliminar tu cuenta como se describe arriba. Podemos suspender o cancelar el acceso que incumpla estos términos o que amenace la estabilidad o la seguridad del servicio. Las secciones &laquo;Sin garantía&raquo;, &laquo;Limitación de responsabilidad&raquo; y &laquo;Tus derechos legales&raquo; siguen vigentes tras la terminación.",
                ),
            ],
        },
        {
            heading: "Cambios en estos términos",
            blocks: [
                p(
                    "Podemos actualizar estos términos de vez en cuando. La versión actual siempre está disponible en esta página, con la fecha en la parte superior mostrando cuándo cambió por última vez. Continuar usando el servicio después de una actualización significa que aceptas los términos revisados.",
                ),
            ],
        },
        {
            heading: "Divisibilidad",
            blocks: [
                p(
                    "Si alguna parte de estos términos se considera inaplicable, esa parte se elimina y el resto permanece en vigor.",
                ),
            ],
        },
        {
            heading: "Contacto",
            blocks: [
                p(
                    '¿Preguntas sobre estos términos o sobre tus datos? Escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

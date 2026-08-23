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
    lastUpdated: "26 de julio de 2026",
    backToHome: "Volver al inicio",
    sections: [
        {
            heading: "Qué recopilamos",
            blocks: [
                p(
                    "Cuando te registras, guardamos tu <strong>dirección de correo electrónico</strong> y una contraseña con hash seguro a través de Supabase Auth. Si en cambio inicias sesión con Google, recibimos tu dirección de correo electrónico de Google y nunca llegamos a ver ninguna contraseña.",
                ),
                p("Cuando usas el servicio, guardamos:"),
                ul([
                    "<strong>Registros de comidas</strong> — descripción, tipo de comida, calorías, macros, fibra, azúcares totales, gramos de alcohol, miligramos de cafeína, notas y marcas de tiempo. Las fotos de comida son interpretadas por tu asistente de IA y nunca se suben ni se almacenan en nuestros servidores.",
                    "<strong>Registros de agua</strong> — cantidad, notas y marcas de tiempo.",
                    "<strong>Registros de peso corporal</strong> — peso, notas y marcas de tiempo. Estos son datos de salud, y se tratan exactamente igual que el resto de tus registros.",
                    "<strong>Objetivos</strong> — tus metas diarias de calorías, proteína, carbohidratos, grasa, fibra, azúcar, alcohol, cafeína y agua, y tu peso objetivo.",
                    "<strong>Ajustes de perfil</strong> — tu zona horaria IANA, unidad de peso preferida, si el seguimiento de alcohol está activado y en qué bebida estándar se muestra, y si los widgets integrados en el chat están habilitados.",
                    "<strong>Telemetría de uso de herramientas</strong> — para cada llamada a una herramienta MCP, qué herramienta se ejecutó, si tuvo éxito, cuánto tardó, una categoría de error genérica cuando falla, la duración en días de cualquier rango de fechas que hayas pedido, y el id de sesión MCP. Está vinculada al id de tu cuenta. Nunca incluye el contenido de tus registros.",
                ]),
                p(
                    "<strong>El alcohol también es un dato de salud</strong>, y de un tipo más sensible que un recuento de calorías, así que funciona de forma distinta a todo lo anterior. El seguimiento de alcohol está desactivado por defecto, y solo registramos alcohol cuando proviene de ti — una bebida que registras, o una columna en un archivo que importas. Nada se infiere en tu nombre. Desactivar el ajuste hace dos cosas: el importador masivo deja de leer la columna de alcohol en los archivos que subes, y todo lo demás deja de mostrar alcohol en las comidas, objetivos, progreso y widgets que ves. No es un interruptor de eliminación. El alcohol que registraste directamente sigue registrado esté activado o no el ajuste, lo que ya está guardado permanece en la base de datos, y todo ello sigue apareciendo en el archivo de comidas de cualquier exportación que hagas. Para eliminar de verdad una cifra de alcohol, elimina la comida a la que pertenece, o elimina tu cuenta.",
                ),
                p(
                    "También guardamos los tokens de acceso y actualización de OAuth y los códigos de autorización que permiten que tu asistente de IA permanezca conectado a tu cuenta.",
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
                    "Existen dos tipos de analítica, y ninguno toca el contenido de tus registros:",
                ),
                ul([
                    "<strong>Analítica del sitio web.</strong> Estas páginas cargan Google Analytics, que nos da estadísticas de tráfico agregadas — páginas vistas, referentes, geografía aproximada, tipo de dispositivo. Se ejecuta en todas las páginas, incluida esta, y actualmente no hay ni un banner de consentimiento ni anonimización de IP, así que Google recibe tu dirección IP como parte de la medición estándar. Si prefieres no ser medido, un bloqueador de rastreadores o las protecciones tipo &laquo;no rastrear&raquo; de tu navegador lo impedirán.",
                    "<strong>Telemetría del servidor.</strong> Cada llamada a una herramienta MCP escribe una fila de telemetría de uso — qué herramienta se ejecutó, si tuvo éxito, cuánto tardó — vinculada al id de tu cuenta pero no a lo que registraste. La usamos para encontrar herramientas lentas o rotas. No se comparte con nadie, y se elimina junto con todo lo demás cuando eliminas tu cuenta.",
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
                    'Todos los datos se almacenan en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL). La autenticación la gestiona Supabase Auth. El servidor está alojado en DigitalOcean.',
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
    lastUpdated: "26 de julio de 2026",
    backToHome: "Volver al inicio",
    sections: [
        {
            heading: "Acuerdo",
            blocks: [
                p(
                    "Estos términos rigen tu uso de Nutrition MCP (el &laquo;servicio&raquo;) — el sitio web en nutrition-mcp.com y el servidor MCP remoto en <strong>https://nutrition-mcp.com/mcp</strong>. Al crear una cuenta o conectar un asistente de IA al servidor, aceptas estos términos. Si no estás de acuerdo, por favor no uses el servicio.",
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
                    "Puedes exportar tu <strong>registro de comidas</strong> a CSV en cualquier momento pidiéndole a tu asistente de IA que exporte tus comidas. La exportación cubre solo comidas — una fila por comida con su hora, zona horaria, tipo de comida, descripción, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales, alcohol, cafeína y notas. El alcohol se incluye esté o no activado el seguimiento de alcohol en tu cuenta. Agua, peso, objetivos y ajustes no se incluyen hoy en la exportación. El enlace de descarga que te entregamos es privado y caduca a los 60 minutos.",
                ),
                p(
                    "También registramos telemetría operativa básica sobre cómo se usa el servicio: para cada llamada a una herramienta, el nombre de la herramienta, si tuvo éxito, cuánto tardó, una categoría de error genérica cuando falla, la duración de cualquier rango de fechas que hayas pedido, y el id de sesión. Estas filas están vinculadas al id de tu cuenta. No contienen lo que registraste — ninguna descripción de comida, ninguna caloría, ningún peso. Las usamos para mantener el servicio funcionando y ver qué herramientas merece la pena mejorar, y se eliminan junto con todo lo demás cuando eliminas tu cuenta.",
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
                    "El propio sitio web también usa Google Analytics para medir el tráfico, Google Fonts y la CDN de jsDelivr para cargar fuentes e iconos, Google Sign-In si eliges esa forma de iniciar sesión, y la API de GitHub para mostrar el número de estrellas del proyecto. Cargar una página, por tanto, hace solicitudes a esos servicios, que pueden ver tu dirección IP y tu navegador.",
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
                    '¿Preguntas sobre estos términos? Escribe a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

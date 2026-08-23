// Spanish (es) translation of the /alternatives comparison pages' prose —
// see src/copy/alternatives.ts for the canonical AppCopy shape and
// scripts/gen-alternatives.ts's App type doc comments for the accuracy
// rules (which apps are recognised by column name vs. need manual
// mapping, sniffed-then-confirmed dates/units, browser-side parsing,
// etc.) that this translation preserves — only the language changed, not
// the factual claims.
//
// App slugs are never translated (they are URL paths).

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_ES: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Sin servidor MCP, y algunas funciones requieren un plan de pago. Descubre la alternativa gratuita y conversacional.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Busca en una base de datos y elige la entrada correcta para cada alimento",
            "Algunas funciones, como el escáner de código de barras, requieren un plan de pago",
            "Una app y una cuenta aparte, con anuncios en el plan gratuito",
        ],
        note: "MyFitnessPal es una app capaz con una base de datos de alimentos enorme. Esto no es una crítica: simplemente es un enfoque distinto para quienes prefieren hablar con su IA en vez de navegar por un contador de calorías.",
        migrate: {
            title: "Dejar atrás la base de datos",
            body: [
                "MyFitnessPal construyó su comunidad sobre una de las bases de datos de alimentos más grandes que existen: decenas de millones de entradas aportadas por usuarios. Esa escala es también su fricción: para cualquier alimento, te desplazas entre entradas casi duplicadas y tienes que adivinar cuál es correcta. El registro conversacional se salta la búsqueda por completo: describes el alimento y tu IA estima los macros.",
                "No hace falta dejar atrás tu diario para lograrlo: una exportación CSV de MyFitnessPal se importa directamente, con sus peculiaridades incluidas, así que los años que ya has registrado vienen contigo. Todo lo que registres a partir de entonces es tuyo, para exportarlo como CSV cuando quieras.",
                "Las funciones que MyFitnessPal fue trasladando a Premium (escaneo de código de barras, macros por gramo, sin anuncios) aquí están incluidas sin más. No estás comparando un plan gratuito con una mejora de 20 $ al mes: hay un único plan gratuito y de código abierto, y la única cuenta que necesitas es la de Claude o ChatGPT que ya tienes.",
            ],
        },
        importSection: {
            title: "Trae el diario contigo",
            body: [
                "Años de historial registrado son la verdadera razón por la que la gente se queda, y no tienes que abandonarlos. Pide importar y se abre un panel de importación en el chat: eliges el CSV que exporta MyFitnessPal, se analiza en tu navegador, se emparejan por ti las columnas que reconoce, y ves qué se añadirá antes de que se guarde nada. Ese emparejamiento cubre calorías, proteína, carbohidratos y grasa, además de fibra, azúcares totales y cafeína en miligramos donde tu exportación tenga esas columnas. Las filas nunca pasan por la IA, así que no hay nada que pueda transcribir mal.",
                "Una exportación de MyFitnessPal se reconoce por su nombre, peculiaridades incluidas. El archivo llega con una marca de orden de bytes que, si no se tratara, corrompería el encabezado de la primera columna; sus notas pueden contener saltos de línea dentro de una celda entre comillas, algo que una división ingenua por líneas destrozaría junto con todas las filas siguientes; y cada bloque de un día termina con una fila de totales que no debe convertirse en una comida. La más importante: MyFitnessPal exporta una fila agregada por comida y por día, y no tiene ninguna columna de nombre de alimento, así que en vez de rechazar esas filas por no tener descripción, el importador reconoce la forma y las etiqueta por su franja: llegan como «Desayuno (importado de MyFitnessPal)».",
                "Las fechas se confirman, no se dan por hechas. Una columna con 05/06/2024 es genuinamente indecidible (mayo o junio), así que el importador te muestra su lectura junto a una fila real de tu propio archivo y te deja corregirla antes de guardar. Y cada fila lleva una huella de contenido, así que volver a ejecutar el mismo archivo informa que esas comidas ya están registradas en vez de duplicarlas. Importa una exportación parcial, detecta una columna mal emparejada y simplemente vuelve a hacerlo.",
            ],
        },
        importFaq:
            "Sí. Pide importar tu historial y se abre un importador en el chat: eliges el CSV que exporta MyFitnessPal, se analiza en tu navegador en vez de leerlo la IA, emparejas o confirmas las columnas, ves una vista previa de lo que se añadirá y confirmas. Calorías, proteína, carbohidratos y grasa se transfieren, y también fibra, azúcares totales y cafeína cuando tu exportación los incluye. La exportación de MyFitnessPal se reconoce por su nombre, incluida su marca de orden de bytes, sus filas de totales al final, y el hecho de que escribe una fila agregada por comida y por día sin nombre de alimento, que se etiquetan por franja de comida. Volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP puede escanear códigos de barras como MyFitnessPal Premium?",
                a: "Sí, y es gratis. Envía el código de barras de un producto y Nutrition MCP obtiene los macros de la etiqueta desde Open Food Facts, mientras que MyFitnessPal trasladó su escáner de código de barras a una suscripción Premium de pago.",
            },
            {
                q: "¿Cómo funciona el registro sin la base de datos de alimentos de MyFitnessPal?",
                a: 'Describes lo que comiste en lenguaje natural ("un bowl de burrito de pollo con arroz extra") y tu IA estima las calorías y los macros. No hay una base de datos de millones de entradas de usuarios que revisar ni que adivinar cuál es la correcta.',
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Sin servidor MCP. Descubre la forma gratuita y conversacional de controlar calorías y macros dentro de tu IA.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Registras buscando en su base de datos, entrada por entrada",
            "Algunas funciones requieren el plan de pago Gold",
            "Una app aparte que hay que abrir cada vez que comes",
        ],
        note: "Cronometer es excelente si buscas precisión profunda en micronutrientes. Nutrition MCP adopta un enfoque más ligero y conversacional para calorías, macros y peso, directamente dentro de tu IA.",
        migrate: {
            title: "Cuando la precisión lo es todo",
            body: [
                "Cronometer se ganó su reputación por la precisión: bases de datos curadas y seguimiento de más de 80 micronutrientes, vitaminas y minerales incluidos. Si esa profundidad en micronutrientes es la razón por la que lo abres, sé honesto contigo mismo: las estimaciones conversacionales no van a igualar gramo a gramo una entrada de base de datos de nivel de laboratorio.",
                "Pero la mayoría de la gente registra para mantener las calorías y los macros dentro de un rango, no para auditar su ingesta de selenio. Ese rango es más amplio de lo que parece: junto con proteína, carbohidratos y grasa obtienes fibra, azúcares totales y cafeína en miligramos, y alcohol opcional en gramos de etanol si lo activas. Para eso, describirle una comida a tu IA es mucho menos trabajo que buscar y pesar cada componente, y aun así obtienes totales diarios, tendencias y un peso objetivo que seguir, gratis.",
                'También hay un camino intermedio: como estás dentro de un asistente de IA, puedes pedir el ángulo de los micronutrientes justo cuando quieras: "¿aproximadamente cuánto hierro y B12 tenían las comidas de hoy?", y obtener una estimación razonada al momento, sin la carga de registrar cada gramo en una entrada curada el resto del tiempo.',
            ],
        },
        importSection: {
            title: "Diez años de entradas, conservados",
            body: [
                "La precisión es la razón por la que usabas Cronometer, así que una importación descuidada sería peor que ninguna. Pide importar y se abre un panel en el chat: eliges tu CSV de Cronometer, se analiza en tu navegador, y apruebas una vista previa antes de que se escriba una sola fila. Las cifras se leen directamente del archivo: la IA nunca ve las filas, así que no puede redondear ni retranscribir ninguna.",
                "La forma de exportación de Cronometer se reconoce por su nombre. Divide la marca de tiempo en columnas de fecha y hora separadas, y ambas se leen, así que un desayuno registrado a las 07:12 conserva su hora en vez de caer en un mediodía por defecto. Escribe una cantidad con la unidad dentro de la misma celda («58.00 g», «1.00 cup»), y un valor escrito así se sigue leyendo como el número que es, no como nada. Y repite el encabezado «Amount» más de una vez, así que las columnas se identifican por posición y no por nombre: los duplicados no pueden colisionar en silencio, y el mapeador te indica a cuál estás apuntando.",
                "Queda claro qué se transfiere: la fecha y la hora, el nombre del alimento, la comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales, cafeína y notas. Cronometer es la única exportación de esta lista que incluye una columna Caffeine (mg), y llega en miligramos: la unidad en la que ya está, y la misma en la que se guarda la cafeína aquí, así que no se convierte nada. Una columna de cafeína encabezada en gramos se deja sin emparejar, mostrando el motivo, en vez de registrar 0,18 donde la etiqueta dice 180 mg. Azúcar significa azúcares totales, fruta y leche incluidas, no azúcar añadido, que ninguna exportación indica de forma fiable. La columna separada «Sugar Alcohols» de Cronometer es un poliol, no un azúcar ni un etanol, y no puede encajar en ninguno de los dos campos. El alcohol es un caso especial: Cronometer lo exporta como alcohol etílico en gramos, y solo se transfiere si primero has activado aquí el seguimiento de alcohol, ya que está desactivado hasta que lo hagas. Las cantidades de porción y los más de 80 vitaminas y minerales de Cronometer no se transfieren en absoluto: esa profundidad en micronutrientes se queda en la propia exportación de Cronometer. Volver a importar es inofensivo: cada fila lleva una huella de contenido, así que una segunda ejecución del mismo archivo informa que las comidas ya están registradas en lugar de añadirlas dos veces.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges tu CSV de Cronometer, se analiza en tu navegador en vez de leerlo la IA, y ves una vista previa de lo que se añadirá antes de confirmar. La exportación de Cronometer se reconoce por su nombre: sus columnas separadas de fecha y hora se leen ambas, y su encabezado repetido «Amount» no puede colisionar porque las columnas se identifican por posición. La fecha y la hora, el nombre del alimento, la comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales, cafeína en miligramos y notas se transfieren; el alcohol también, pero solo si has activado antes su seguimiento. Las vitaminas, los minerales y las cantidades de porción no se transfieren. Volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP controla micronutrientes como Cronometer?",
                a: "No. El seguimiento de más de 80 vitaminas y minerales es la especialidad de Cronometer, y Nutrition MCP no tiene ningún dato de micronutrientes: ni sodio, ni vitaminas. Lo que sí controla son calorías, proteína, carbohidratos, grasa, fibra, azúcares totales, cafeína en miligramos, alcohol opcional, agua y peso. Aun así puedes pedirle a tu IA una lectura aproximada de micronutrientes de una comida, pero si necesitas una profundidad de micronutrientes de nivel de laboratorio, Cronometer es la mejor opción.",
            },
            {
                q: "¿Es Nutrition MCP tan preciso como Cronometer?",
                a: "Para calorías, macros, fibra y azúcar, las estimaciones conversacionales son suficientemente precisas para la mayoría de los objetivos, pero no van a igualar la base de datos curada y gramo a gramo de Cronometer. Cambia algo de precisión por mucho menos esfuerzo de registro, y ese es el trato correcto para la mayoría de la gente.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Sin servidor MCP. Registra tus comidas hablando con Claude o ChatGPT en su lugar: gratis.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Busca y registra cada alimento a mano",
            "Algunas funciones, como el registro por foto, requieren un plan de pago",
            "Otra app, otra cuenta, anuncios en el plan gratuito",
        ],
        note: "Lose It! es un contador de calorías amigable. Nutrition MCP hace el mismo registro básico por conversación, gratis, sin salir nunca de Claude o ChatGPT.",
        migrate: {
            title: "La misma simplicidad, sin la app",
            body: [
                "Lose It! se ganó a la gente manteniendo el conteo de calorías ligero y un poco gamificado, con su registro por foto Snap It como truco estrella. Nutrition MCP también hace el truco de la foto: envía una imagen de tu plato y tu IA la lee, solo que vive dentro del asistente con el que ya hablas, así que no hay una app aparte que abrir.",
                "Si lo que te gustaba de Lose It! era el registro sin fricción y el feedback diario rápido, te vas a sentir como en casa: dices lo que comiste, recibes tus calorías y macros restantes, y sigues adelante. Sin anuncios, sin ventas adicionales y sin cuenta que gestionar.",
                "Lo único que pierdes es la capa de rachas e insignias que Lose It! usa para que vuelvas. Si esa gamificación es lo que te motiva, es una razón válida para quedarte. Si siempre te pareció ruido por encima del registro real, no la vas a echar de menos: el número del día está ahí mismo, en el chat, cuando lo pidas.",
            ],
        },
        importSection: {
            title: "Tus días registrados también vienen",
            body: [
                "Cambiar no significa empezar de cero. Pide importar y se abre un importador en el chat: eliges el CSV que exporta Lose It!, se analiza en tu navegador, las columnas que reconoce se emparejan solas (la fecha, el alimento, la comida, calorías, proteína, carbohidratos y grasa, además de fibra, azúcares totales y cafeína donde tu exportación las tenga) y confirmas una vista previa de lo que se añadirá. Es un selector de archivo y una vista previa, no un ejercicio de dictado: por ese camino la IA nunca lee ni retranscribe tus filas.",
                "Se manejan a propósito dos particularidades de Lose It!. Su exportación lleva una marca de eliminado, y las filas marcadas como eliminadas se omiten en vez de importarse: recuperarlas resucitaría comida que quitaste a propósito, y ningún total en la vista previa lo revelaría. También escribe el texto literal «n/a» en las celdas sin valor, que se lee como vacío y no como cero, así que un macro que nunca controlaste sigue ausente en vez de registrarse como un 0 g real que arrastra tus promedios hacia abajo.",
                "Ejecútalo tantas veces como quieras. Cada fila lleva una huella de contenido, así que repetir la importación del mismo archivo informa que las comidas ya están registradas y no añade nada. Y si las fechas de tu exportación se pueden leer de dos formas (05/06 siendo mayo o junio), el importador muestra su lectura junto a una fila de tu propio archivo y te pide que la confirmes antes de guardar.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges el CSV que exporta Lose It!, se analiza en tu navegador en vez de leerlo la IA, y confirmas una vista previa antes de que se escriba nada. La fecha, el alimento, la comida, calorías, proteína, carbohidratos y grasa se emparejan solos, y fibra, azúcares totales y cafeína también cuando tu exportación las tiene. La exportación de Lose It! se reconoce por su nombre: las filas marcadas como eliminadas se omiten en vez de resucitarse, y sus celdas «n/a» se leen como vacías y no como ceros. Volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP tiene registro por foto como el Snap It de Lose It!?",
                a: "Sí: envía una foto de tu plato y tu IA identifica el alimento y estima los macros, y luego lo registra tras tu confirmación. En Lose It! el registro por foto está detrás de un plan de pago; con Nutrition MCP es gratis y funciona directamente en el chat.",
            },
            {
                q: "¿Puedo contar calorías de la misma forma que en Lose It!?",
                a: "Sí. El ciclo principal es idéntico: dices lo que comiste y recibes al instante tus calorías y macros restantes. La diferencia es que hablas con tu IA en vez de navegar por una app, y no hay anuncios ni ventas adicionales por el camino.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Solo por suscripción y sin servidor MCP. Descubre la alternativa gratuita que vive dentro de tu IA.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Una suscripción de pago tras la prueba gratuita (sin plan gratuito)",
            "Sigues abriendo una app aparte para registrar cada comida",
            "Su coaching adaptativo es el producto, no un registro sin esfuerzo",
        ],
        note: "El coaching adaptativo de TDEE de MacroFactor es realmente bueno. Si lo que quieres sobre todo es un registro rápido y gratuito de macros dentro de tu IA, Nutrition MCP encaja mejor, más simple y sin coste.",
        migrate: {
            title: "Coaching frente a registro",
            body: [
                "La propuesta de MacroFactor es su algoritmo: observa tu ingesta y peso registrados y recalcula en silencio tus objetivos de calorías y macros cada semana; un coaching adaptativo genuinamente inteligente del equipo de Stronger By Science. Ese coaching es el producto, por eso es solo por suscripción.",
                "Nutrition MCP no ejecuta un algoritmo de coaching, pero como ya estás dentro de un asistente de IA, simplemente puedes preguntar. «Según mis últimas tres semanas, ¿debería ajustar mis calorías?» te da una respuesta razonada al momento. Es un modelo distinto: análisis cuando lo quieres, de forma conversacional, en vez de un recálculo semanal fijo, y es gratis.",
                "La contrapartida honesta es disciplina frente a flexibilidad. El recálculo semanal de MacroFactor ocurre pienses o no en preguntarlo, lo que te mantiene honesto; el modelo conversacional solo se ajusta cuando tú lo pides. Si quieres un algoritmo que dirija tus números sin que tengas que intervenir, MacroFactor vale la suscripción. Si prefieres registrar gratis y pedir análisis cuando te importa, esto encaja mejor.",
            ],
        },
        importSection: {
            title: "El registro se traslada aunque el coaching no lo haga",
            body: [
                "Lo que dejarías atrás es el algoritmo, no los datos. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV de MacroFactor, se analiza en tu navegador, las columnas que reconoce se emparejan por ti, y confirmas una vista previa antes de que se escriba nada. Las filas nunca pasan por la IA, así que nada se transcribe mal por el camino.",
                "La exportación de MacroFactor se reconoce por su nombre (su columna de tamaño de porción es la pista), y sus columnas de fecha, alimento, comida, calorías y macros se emparejan solas, fibra, azúcares totales y cafeína incluidas cuando el archivo las tiene. Si tu exportación reporta la energía en kilojulios en vez de kilocalorías, eso se convierte en vez de guardarse 4,184 veces demasiado alto. Como una columna simplemente encabezada «Calories» puede contener cualquiera de las dos unidades, la unidad se ofrece como un control junto a un ejemplo trabajado de tu propia primera fila, así que la confirmas en vez de confiar en una suposición que inflaría en silencio cada día.",
                "Ese historial es útil de inmediato, no solo un archivo guardado. Una vez que hay semanas de ingesta y peso, puedes hacer la pregunta que el algoritmo de MacroFactor respondía según un horario: «según las últimas tres semanas, ¿debería ajustar mis calorías?», y obtener una respuesta razonada al momento. Una segunda importación del mismo archivo no cambia nada, ya que cada fila lleva una huella de contenido y las repeticiones vuelven marcadas como ya registradas.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de MacroFactor, se analiza en tu navegador en vez de leerlo la IA, y confirmas una vista previa antes de que se escriba nada. La exportación de MacroFactor se reconoce por su nombre: la fecha, el alimento, la comida, calorías, proteína, carbohidratos y grasa se emparejan solos, junto con fibra, azúcares totales y cafeína cuando el archivo las tiene, y si reporta la energía en kilojulios se convierte a kilocalorías en cuanto confirmas la unidad junto a un ejemplo de tu propio archivo. Volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP ajusta mis objetivos de calorías como MacroFactor?",
                a: "No automáticamente. El recálculo semanal y algorítmico de MacroFactor es su función de pago principal. Con Nutrition MCP, tú preguntas: «según mis últimas tres semanas de ingesta y peso, ¿debería ajustar mis calorías?», y tu IA lo razona al momento, en vez de una actualización semanal fija.",
            },
            {
                q: "¿De verdad es gratis Nutrition MCP cuando MacroFactor es solo por suscripción?",
                a: "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin prueba-y-luego-pago y sin límites de plan gratuito, a diferencia de MacroFactor, que no tiene plan gratuito y exige una suscripción tras su prueba. Solo necesitas una cuenta de Claude o ChatGPT.",
            },
        ],
        freeAnswer:
            "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin suscripción, mientras que MacroFactor exige una suscripción de pago tras su prueba gratuita. Solo necesitas una cuenta de Claude o ChatGPT para conectarte.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Sin servidor MCP. Controla comidas y macros por conversación: gratis y de código abierto.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Busca en la base de datos cada alimento que registras",
            "Algunas funciones, como los planes de comidas, requieren el plan de pago PRO",
            "Una app y una cuenta aparte que gestionar",
        ],
        note: "Yazio es un tracker pulido con buenos planes de comidas. Nutrition MCP se centra en un registro conversacional sin esfuerzo que vive dentro de Claude o ChatGPT: gratis y de código abierto.",
        migrate: {
            title: "Los planes por un lado, el registro por otro",
            body: [
                "Yazio combina el seguimiento con planes de comidas estructurados, recetas y herramientas de ayuno, pulido para un público europeo. Si un plan guiado es lo que te mantiene en el camino, Yazio lo hace bien y Nutrition MCP no intenta competir ahí: no es una app de planes de comidas.",
                "Lo que sí hace es que la mitad del registro sea sin esfuerzo. En vez de buscar cada ingrediente en la base de datos de Yazio, describes el plato y tu IA se encarga de los macros, y luego responde «¿cómo voy hoy?» en el mismo mensaje. Combínalo con el plan de alimentación que ya sigas.",
                "Esto hace que en realidad ambos se complementen en vez de competir. Sigue con un plan de Yazio, o cualquier plan, para el «qué comer»; usa Nutrition MCP para el «¿me mantuve en el camino?», registrado por conversación y gratis. El único sitio donde no ayuda son los temporizadores de ayuno: eso es terreno de Yazio, no de un registro de nutrición.",
            ],
        },
        importSection: {
            title: "Trae el registro, mapea las columnas",
            body: [
                "Tu historial de Yazio puede pasarse, aunque tendrás que hacer un poco de trabajo. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV, se analiza en tu navegador, y tú mismo apuntas sus columnas hacia fecha, alimento, comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína. Las exportaciones de cuatro apps (MyFitnessPal, Cronometer, Lose It! y MacroFactor) se reconocen por el nombre de sus columnas; Yazio no es una de ellas, así que espera configurar ese mapeo una vez. Todo lo que sigue es igual: una vista previa de lo que se añadirá y tu confirmación.",
                "Las particularidades europeas que vencen a la mayoría de los importadores están cubiertas. Un archivo delimitado por punto y coma cuyos números usan coma decimal (la forma que produce Excel en un entorno alemán o austriaco) se lee correctamente, en vez de confundir el delimitador con un punto decimal o escalar cada macro por mil. Los encabezados que el mapeador conoce tampoco son solo en inglés: los Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker y Koffein de una exportación alemana se reconocen todos, y fibra, azúcar y cafeína también se emparejan en español, francés, italiano y neerlandés (fibra, sucres, zuccheri, suikers, cafeína, caffeina), así que un archivo localizado suele llegar parcialmente mapeado, dejándote menos columnas por configurar a mano. Los campos entre comillas, los saltos de línea dentro de una celda, los valores casi vacíos y las filas de totales sueltas también se manejan, y la IA nunca lee el archivo, así que ningún número puede transcribirse mal en el camino.",
                "Las fechas y la energía se confirman en vez de adivinarse. Una columna DD/MM/AAAA se lee con el día primero, y donde los valores realmente no pueden decidirlo (05/06 siendo mayo o junio), el importador muestra su lectura junto a una fila de tu propio archivo para que la corrijas. Si la columna de energía está en kilojulios, se convierte a kilocalorías, con la unidad mostrada como un control junto a un ejemplo trabajado. Volver a importar el mismo archivo no añade nada: cada fila lleva una huella de contenido, así que las repeticiones vuelven marcadas como ya registradas.",
            ],
        },
        importFaq:
            "Sí, usando mapeo manual de columnas. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de Yazio, se analiza en tu navegador en vez de leerlo la IA, y tú mismo apuntas sus columnas hacia fecha, alimento, comida, calorías y macros (fibra, azúcares totales y cafeína entre ellos). Yazio no es una de las cuatro exportaciones reconocidas por nombre de columna, así que ese mapeo es un paso manual único, aunque los encabezados que el mapeador ya conoce (en alemán, y para fibra, azúcar y cafeína también en español, francés, italiano y neerlandés) se rellenan solos. Los archivos europeos delimitados por punto y coma con coma decimal, las fechas DD/MM/AAAA y los kilojulios se manejan todos, y volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP incluye planes de comidas como Yazio PRO?",
                a: "No. Los planes de comidas estructurados, recetas y herramientas de ayuno de Yazio son su punto fuerte, y Nutrition MCP no intenta reemplazarlos: se encarga de la mitad del registro. Mucha gente sigue con su plan de Yazio (o cualquier otro) y simplemente registra contra él aquí, gratis.",
            },
            {
                q: "¿Puedo registrar comidas más rápido que buscando en la base de datos de Yazio?",
                a: 'Normalmente sí. En vez de buscar cada ingrediente en la base de datos de Yazio y ajustar las porciones, describes el plato terminado una sola vez ("un bowl de muesli con yogur y frutos rojos") y tu IA estima y registra los macros en un solo paso.',
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Sin servidor MCP. Una forma más ligera y gratuita de registrar comida dentro de Claude o ChatGPT.",
        cons: [
            "Sin servidor MCP: no funciona dentro de Claude o ChatGPT",
            "Registras alimentos buscando en su base de datos uno por uno",
            "Algunas funciones, como los planes de dieta, requieren un plan de pago",
            "Otra app y otra suscripción que gestionar",
        ],
        note: "Lifesum combina el seguimiento con planes de dieta estructurados. Nutrition MCP es una forma más ligera y gratuita de registrar calorías, macros y peso hablando con tu IA.",
        migrate: {
            title: "Valoraciones que simplemente puedes preguntar",
            body: [
                "Lifesum se apoya en estructura y feedback: planes de dieta, recetas y su sistema de valoración de alimentos que puntúa lo que comes. Nutrition MCP no le pone una insignia a tus alimentos, así que si ese ciclo de puntuación es lo que te motiva, ahí Lifesum tiene ventaja.",
                "La contrapartida es la flexibilidad: en vez de una valoración fija, puedes preguntarle a tu IA «¿es esta una buena opción para mis objetivos?» y recibir una respuesta real en contexto. El registro es una sola frase, las tendencias y un peso objetivo vienen incluidos, y no hay ningún nivel premium que bloquee las partes útiles.",
                "Una insignia te dice que un alimento sacó un 3 sobre 5; una conversación te dice por qué, y qué hacer al respecto: «cambia la mitad del arroz por verduras y esto encaja en tu día». Es la diferencia entre una puntuación y un entrenador, y como Lifesum pone los planes de dieta y parte del seguimiento detrás de Premium, es la opción gratuita de las dos.",
            ],
        },
        importSection: {
            title: "Nada que volver a escribir",
            body: [
                "Cambiar de tracker significa mover tu historial, y no tienes que volver a escribir ni una línea. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV de Lifesum, se analiza en tu navegador, y apuntas sus columnas hacia fecha, alimento, comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína. Los encabezados de Lifesum no se reconocen por nombre como sí ocurre con los de MyFitnessPal, Cronometer, Lose It! y MacroFactor, así que ese mapeo es un paso manual único; después de eso, ves una vista previa de lo que se añadirá y confirmas.",
                "Nada se esconde detrás de una suposición. El mapeador te muestra tu propio archivo (sus encabezados reales, sus celdas reales, y un contador continuo de las filas que se crearán), así que una columna apuntada al campo equivocado es visible antes de que se escriba nada, en vez de descubrirse después. Los campos entre comillas, los saltos de línea dentro de una celda, los valores casi vacíos y las filas de totales se manejan todos, y como el archivo se lee en tu navegador, la IA nunca ve una fila que pudiera transcribir mal.",
                "Las exportaciones europeas están cubiertas: un archivo delimitado por punto y coma con coma decimal se lee correctamente, las fechas DD/MM/AAAA se convierten en cuanto confirmas el orden, y los kilojulios se convierten en kilocalorías con la unidad mostrada junto a un ejemplo trabajado de tu propia primera fila. Los encabezados localizados también ayudan: los Kalorien, Kohlenhydrate, Ballaststoffe o Koffein de una exportación alemana se rellenan solos, y fibra, azúcar y cafeína también se emparejan en español, francés, italiano y neerlandés, así que el mapeo manual suele ser más corto de lo que parece. Ejecuta la importación dos veces y nada se duplica: cada fila lleva una huella de contenido, así que las repeticiones se informan como ya registradas.",
            ],
        },
        importFaq:
            "Sí, usando mapeo manual de columnas. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de Lifesum, se analiza en tu navegador en vez de leerlo la IA, y apuntas sus columnas hacia fecha, alimento, comida, calorías y macros (fibra, azúcares totales y cafeína incluidas) tú mismo. Lifesum no es una de las cuatro exportaciones reconocidas por nombre de columna, así que ese mapeo es un paso manual único, aunque los encabezados que el mapeador ya conoce se rellenan solos. Los archivos europeos delimitados por punto y coma con coma decimal, las fechas DD/MM/AAAA y los kilojulios se manejan todos, y volver a importar el mismo archivo nunca crea duplicados.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP valora mi comida como las valoraciones de alimentos de Lifesum?",
                a: "No: no hay insignia ni puntuación numérica. En su lugar puedes preguntarle a tu IA «¿es esta una buena opción para mis objetivos?» y recibir una respuesta contextual que explica las contrapartidas, en vez de una valoración fija sobre el alimento en sí.",
            },
            {
                q: "¿Es Nutrition MCP gratis sin un plan al estilo Lifesum Premium?",
                a: "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin nivel premium, mientras que Lifesum pone los planes de dieta y algunas funciones de seguimiento detrás de una suscripción Premium. Solo necesitas una cuenta de Claude o ChatGPT para conectarte.",
            },
        ],
    },
};

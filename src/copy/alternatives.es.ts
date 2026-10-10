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
            "Sin servidor MCP oficial, y algunas funciones requieren un plan de pago. Descubre la alternativa gratuita y conversacional.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Buscar en una base de datos y elegir la entrada correcta de cada alimento",
            "Algunas funciones, como el escáner de códigos de barras, requieren un plan de pago",
            "Una app y una cuenta aparte, con anuncios en el plan gratuito",
        ],
        note: "MyFitnessPal es una app muy completa, con una base de datos de alimentos enorme. No es una crítica: es simplemente otro enfoque, pensado para quienes prefieren hablar con su IA antes que ir tocando pantallas en una app de seguimiento.",
        migrate: {
            title: "Dejar atrás la base de datos",
            body: [
                "MyFitnessPal se ganó a sus usuarios con una de las mayores bases de datos de alimentos que existen: decenas de millones de entradas aportadas por la comunidad. Ese tamaño es también su gran inconveniente: para cualquier alimento tienes que recorrer entradas casi idénticas y adivinar cuál es la buena. El registro conversacional se salta la comparación de entradas: describes el alimento, los alimentos genéricos toman sus valores de USDA FoodData Central cuando hay un registro, y las estimaciones cubren el resto.",
                "Y no tienes que renunciar a tu diario: una exportación CSV de MyFitnessPal se importa directamente, con todas sus rarezas, así que los años que ya has registrado vienen contigo. Todo lo que registres a partir de ese momento es tuyo, y puedes exportarlo en CSV cuando quieras.",
                "Las funciones que MyFitnessPal fue pasando a Premium (escaneo de códigos de barras, macros por gramo, sin anuncios) aquí vienen incluidas. No tienes que elegir entre un plan gratuito y una mejora de 20 US$ al mes: hay un único plan, gratuito y de código abierto, y lo único nuevo que configuras es un inicio de sesión gratuito la primera vez que te conectas.",
            ],
        },
        importSection: {
            title: "Importa tu diario de MyFitnessPal desde un CSV",
            body: [
                "Los años de historial son el verdadero motivo por el que la gente no se cambia, y no tienes que renunciar a ellos. Pide importar y se abre un panel de importación en el chat: eliges el CSV que exporta MyFitnessPal, el importador lo analiza en tu navegador, asigna por ti las columnas que reconoce y te muestra lo que se añadirá antes de guardar nada. Esa asignación cubre calorías, proteína, carbohidratos y grasa, además de fibra, azúcares totales, cafeína en miligramos, grasa saturada y grasas trans cuando tu exportación incluye esas columnas. Las filas nunca pasan por la IA, así que no hay nada que pueda copiar mal.",
                "La exportación de MyFitnessPal se reconoce automáticamente por sus columnas, con sus rarezas incluidas. El archivo llega con una marca de orden de bytes que, sin tratarla, estropearía el encabezado de la primera columna; sus notas pueden tener saltos de línea dentro de una celda entre comillas, algo que, si el archivo se partiera línea a línea sin más, rompería esa fila y todas las siguientes; y el bloque de cada día termina con una fila de totales que no debe convertirse en una comida. La más importante: MyFitnessPal exporta una fila agregada por comida y por día, sin ninguna columna con el nombre del alimento, así que, en vez de rechazar esas filas por no tener descripción, el importador reconoce el formato y las etiqueta según la comida a la que pertenecen: llegan como «Desayuno (importado de MyFitnessPal)».",
                "Las fechas se confirman, no se suponen. Una columna con 05/06/2024 es realmente ambigua (¿mayo o junio?), así que el importador te muestra cómo la interpreta junto a una fila real de tu propio archivo y te deja corregirlo antes de guardar. Y cada fila lleva una huella de contenido: si vuelves a pasar el mismo archivo, verás que esas comidas ya están registradas en vez de duplicarse, siempre que tu zona horaria no haya cambiado entretanto. ¿Importaste una exportación parcial o asignaste mal una columna? Vuelve a hacerlo y listo.",
            ],
        },
        importFaq:
            "Sí. Pide importar tu historial y se abre un importador en el chat: eliges el CSV que exporta MyFitnessPal, el archivo se analiza en tu navegador sin que la IA lo lea, asignas o confirmas las columnas, revisas lo que se añadirá y confirmas. Se transfieren las calorías, la proteína, los carbohidratos y la grasa, y también la fibra, los azúcares totales, la cafeína y la grasa saturada con sus grasas trans cuando tu exportación los incluye. La exportación de MyFitnessPal se reconoce automáticamente por sus columnas, y se tienen en cuenta su marca de orden de bytes, sus filas de totales al final y que escribe una fila agregada por comida y por día sin nombre de alimento; esas filas se etiquetan según la comida a la que pertenecen. Volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP puede escanear códigos de barras como MyFitnessPal Premium?",
                a: "Sí, y gratis. Envía el código de barras de un producto y Nutrition MCP obtiene los macros de la etiqueta desde Open Food Facts; MyFitnessPal, en cambio, pasó su escáner de códigos de barras a la suscripción Premium de pago.",
            },
            {
                q: "¿Cómo funciona el registro sin la base de datos de alimentos de MyFitnessPal?",
                a: "Describes con tus palabras lo que comiste («un bowl de burrito de pollo con extra de arroz») y tu IA lo registra. Los alimentos genéricos toman sus valores de USDA FoodData Central cuando hay un registro, los envasados llegan por código de barras desde Open Food Facts y las estimaciones cubren el resto. No hay que buscar entre millones de entradas aportadas por usuarios ni adivinar cuál es la correcta, y cada cifra indica su origen.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Sin servidor MCP oficial. Descubre la forma gratuita y conversacional de controlar calorías y macros dentro de tu IA.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Registrar buscando en su base de datos, entrada por entrada",
            "Algunas funciones requieren el plan de pago Gold",
            "Una app aparte que abrir cada vez que comes",
        ],
        note: "Cronometer es excelente si quieres un control muy detallado de los micronutrientes. Nutrition MCP apuesta por un enfoque más ligero y conversacional para calorías, macros y peso, directamente en tu IA.",
        migrate: {
            title: "Cuando la precisión lo es todo",
            body: [
                "Cronometer se ganó su reputación por su precisión: bases de datos revisadas y seguimiento de más de 80 micronutrientes, vitaminas y minerales incluidos. Si lo abres precisamente por ese detalle en micronutrientes, seamos sinceros: una estimación conversacional no va a igualar gramo a gramo una entrada de base de datos con precisión de laboratorio.",
                "Pero la mayoría de la gente registra para mantener las calorías y los macros dentro de un rango, no para auditar cuánto selenio consume. Y ese rango es más amplio de lo que parece: además de proteína, carbohidratos y grasa, tienes fibra, azúcares totales, cafeína en miligramos, grasa saturada y grasas trans, y el alcohol opcional en gramos de etanol si lo activas. Para eso, describirle una comida a tu IA es mucho menos trabajo que buscar y pesar cada ingrediente, y aun así tienes totales diarios, tendencias y un peso objetivo como referencia, gratis.",
                "También hay un término medio: como estás dentro de un asistente de IA, puedes preguntar por los micronutrientes justo cuando te interesen («¿más o menos cuánto hierro y B12 tenían las comidas de hoy?») y obtener una estimación razonada al momento, sin tener que registrar cada gramo en una entrada revisada el resto del tiempo.",
            ],
        },
        importSection: {
            title: "Diez años de registros, a salvo",
            body: [
                "Usabas Cronometer por su precisión, así que una importación descuidada sería peor que ninguna. Pide importar y se abre un panel en el chat: eliges tu CSV de Cronometer, el importador lo analiza en tu navegador y apruebas una vista previa antes de que se guarde una sola fila. Las cifras se leen directamente del archivo: la IA nunca ve las filas, así que no puede redondear ni reescribir ninguna.",
                "El formato de exportación de Cronometer se reconoce automáticamente por sus columnas. Reparte la fecha y la hora en dos columnas distintas, y se leen ambas, así que un desayuno registrado a las 07:12 conserva su hora en vez de quedar a mediodía por defecto. Escribe la cantidad con la unidad en la misma celda («58.00 g», «1.00 cup»), y un valor escrito así se sigue leyendo como el número que es, no como un valor vacío. Además, repite el encabezado «Amount» más de una vez, así que las columnas se identifican por su posición y no por su nombre: los duplicados no pueden pisarse sin que te des cuenta, y la pantalla de asignación te indica cuál estás eligiendo.",
                "Esto es exactamente lo que se transfiere: la fecha y la hora, el nombre del alimento, la comida, las calorías, la proteína, los carbohidratos, la grasa, la fibra, los azúcares totales, la cafeína, la grasa saturada y las grasas trans (de sus columnas Saturated y Trans-Fats) y las notas. Cronometer es la única exportación de esta lista que incluye una columna «Caffeine (mg)», y llega en miligramos: la unidad en la que ya está y en la que aquí se guarda la cafeína, así que no se convierte nada. En cambio, una columna de cafeína en gramos se deja sin asignar y se muestra el motivo, en vez de registrar 0,18 donde la etiqueta dice 180 mg. Azúcar significa azúcares totales, incluidos los de la fruta y la leche, no azúcar añadido, que ninguna exportación incluye de forma fiable. La columna «Sugar Alcohols» de Cronometer se refiere a polioles, que no son ni azúcar ni etanol, así que no puede ir a ninguno de los dos campos. El alcohol es un caso especial: Cronometer lo exporta como alcohol etílico en gramos, y solo se transfiere si antes has activado aquí el seguimiento de alcohol, que está desactivado hasta que lo hagas. Las cantidades de las porciones y las más de 80 vitaminas y minerales de Cronometer no se transfieren: ese detalle en micronutrientes se queda en la propia exportación de Cronometer. Volver a importar no tiene ningún riesgo: cada fila lleva una huella de contenido, así que si pasas el mismo archivo por segunda vez, verás que esas comidas ya están registradas en lugar de añadirse dos veces, siempre que tu zona horaria no haya cambiado entretanto.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges tu CSV de Cronometer, el archivo se analiza en tu navegador sin que la IA lo lea, y revisas lo que se añadirá antes de confirmar. La exportación de Cronometer se reconoce automáticamente por sus columnas: se leen tanto la columna de fecha como la de hora, y su encabezado «Amount» repetido no causa conflictos porque las columnas se identifican por su posición. Se transfieren la fecha y la hora, el nombre del alimento, la comida, las calorías, la proteína, los carbohidratos, la grasa, la fibra, los azúcares totales, la cafeína en miligramos, la grasa saturada y las grasas trans, y las notas; también el alcohol, pero solo si antes has activado su seguimiento. Las vitaminas, los minerales y las cantidades de las porciones no se transfieren. Volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP registra micronutrientes como Cronometer?",
                a: "No. El seguimiento de más de 80 vitaminas y minerales es la especialidad de Cronometer, y Nutrition MCP no tiene ningún dato de micronutrientes: ni sodio ni vitaminas. Lo que sí registra son calorías, proteína, carbohidratos, grasa, fibra, azúcares totales, cafeína en miligramos, grasa saturada y grasas trans, alcohol (opcional), agua y peso. Aun así, puedes pedirle a tu IA una estimación aproximada de los micronutrientes de una comida, pero si necesitas un detalle de micronutrientes con precisión de laboratorio, Cronometer te conviene más.",
            },
            {
                q: "¿Es Nutrition MCP tan preciso como Cronometer?",
                a: "No. Las cifras conversacionales no van a igualar la base de datos revisada, gramo a gramo, de Cronometer. En alimentos genéricos, Nutrition MCP usa valores de USDA FoodData Central cuando hay un registro y estimaciones si no lo hay; en alimentos envasados, la búsqueda por código de barras usa los datos de la etiqueta de Open Food Facts. Esas fuentes también pueden equivocarse, y cada cifra indica de dónde procede, así que comprueba todo lo que sea importante. Sacrificas algo de precisión a cambio de mucho menos esfuerzo al registrar.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Sin servidor MCP oficial. Registra tus comidas hablando con Claude o ChatGPT, gratis.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Buscar y registrar cada alimento a mano",
            "Algunas funciones, como el registro ilimitado con fotos de Snap It, requieren un plan de pago",
            "Otra app, otra cuenta y anuncios en el plan gratuito",
        ],
        note: "Lose It! es un contador de calorías sencillo y agradable. Nutrition MCP hace el mismo registro básico conversando, gratis y sin salir de Claude o ChatGPT.",
        migrate: {
            title: "La misma sencillez, sin la app",
            body: [
                "Lose It! conquistó a la gente con un conteo de calorías ligero y con un toque de juego, y su registro por foto Snap It era su gran atractivo. Nutrition MCP también registra a partir de fotos (envía una imagen de tu plato y tu IA la interpreta), pero funciona dentro del asistente con el que ya hablas, así que no hay ninguna app aparte que abrir.",
                "Si lo que te gustaba de Lose It! era registrar sin complicaciones y tener una respuesta rápida cada día, te sentirás como en casa: dices lo que comiste, recibes las calorías y los macros que te quedan, y listo. Sin anuncios ni ventas adicionales.",
                "Lo único que pierdes es la capa de rachas e insignias con la que Lose It! hace que vuelvas. Si esa gamificación es lo que te motiva, es un buen motivo para quedarte. Si siempre te pareció ruido encima del registro en sí, no la vas a echar de menos: la cifra del día está ahí mismo, en el chat, cada vez que la pidas.",
            ],
        },
        importSection: {
            title: "Tus días registrados vienen contigo",
            body: [
                "Cambiarte no significa empezar de cero. Pide importar y se abre un importador en el chat: eliges el CSV que exporta Lose It!, el importador lo analiza en tu navegador, las columnas que reconoce se asignan solas (la fecha, el alimento, la comida, las calorías, la proteína, los carbohidratos y la grasa, además de la fibra, los azúcares totales y la cafeína si tu exportación las incluye) y confirmas una vista previa de lo que se añadirá. Es un selector de archivos y una vista previa, no un dictado: por esa vía, la IA nunca lee ni reescribe tus filas.",
                "Hay dos particularidades de Lose It! que se tratan expresamente. Su exportación incluye una marca de eliminado, y las filas marcadas así se omiten en vez de importarse: recuperarlas resucitaría comidas que borraste a propósito, y ningún total de la vista previa lo dejaría ver. Además, escribe literalmente «n/a» en las celdas sin valor, y eso se lee como vacío, no como cero: así, un macro que nunca registraste sigue sin dato en vez de quedar como un 0 g real que hunde tus promedios.",
                "Pásalo tantas veces como quieras. Cada fila lleva una huella de contenido, así que si repites la importación del mismo archivo, verás que esas comidas ya están registradas y no se añade nada, siempre que tu zona horaria no haya cambiado entretanto. Y si las fechas de tu exportación admiten dos lecturas (05/06 puede ser mayo o junio), el importador muestra cómo las interpreta junto a una fila de tu propio archivo y te pide que lo confirmes antes de guardar.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges el CSV que exporta Lose It!, el archivo se analiza en tu navegador sin que la IA lo lea, y confirmas una vista previa antes de que se guarde nada. La fecha, el alimento, la comida, las calorías, la proteína, los carbohidratos y la grasa se asignan solos, y también la fibra, los azúcares totales y la cafeína cuando tu exportación los incluye. La exportación de Lose It! se reconoce automáticamente por sus columnas: las filas marcadas como eliminadas se omiten en vez de resucitarse, y sus celdas «n/a» se leen como vacías, no como ceros. Volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP permite registrar con fotos, como Snap It de Lose It!?",
                a: "Sí: envía una foto de tu plato y tu IA identifica el alimento, estima los macros y lo registra cuando confirmas los detalles. Lose It! limita Snap It en su plan gratuito y lo deja ilimitado con Premium; con Nutrition MCP, registrar con fotos no cuesta nada extra y funciona directamente en el chat, en cualquier app de IA que pueda leer imágenes.",
            },
            {
                q: "¿Puedo contar calorías igual que en Lose It!?",
                a: "Sí. La dinámica básica es idéntica: dices lo que comiste y al instante recibes las calorías y los macros que te quedan. La diferencia es que hablas con tu IA en vez de ir tocando pantallas en una app, y sin anuncios ni ventas adicionales por el camino.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Solo con suscripción y sin servidor MCP oficial. Descubre la alternativa gratuita que funciona dentro de tu IA.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Suscripción de pago al terminar la prueba gratuita (no hay plan gratuito)",
            "Sigues abriendo una app aparte para registrar cada comida",
            "Su producto es el coaching adaptativo, no un registro sin esfuerzo",
        ],
        note: "El coaching adaptativo de MacroFactor, basado en el TDEE, es francamente bueno. Si lo que más te interesa es registrar macros rápido y gratis dentro de tu IA, Nutrition MCP es una opción más sencilla y sin coste.",
        migrate: {
            title: "Coaching frente a registro",
            body: [
                "El gran argumento de MacroFactor es su algoritmo: observa la ingesta y el peso que registras y recalcula discretamente tus objetivos de calorías y macros cada semana. Es un coaching adaptativo ingenioso de verdad, creado por el equipo de Stronger By Science. Ese coaching es el producto, y por eso solo está disponible con suscripción.",
                "Nutrition MCP no tiene un algoritmo de coaching, pero como ya estás dentro de un asistente de IA, basta con preguntar. «Según mis últimas tres semanas, ¿debería ajustar mis calorías?» te da al momento la interpretación que hace tu IA de tus propias cifras registradas: una estimación que valorar, no un consejo dietético. Es otro modelo: análisis cuando lo quieres, conversando, en vez de un recálculo semanal fijo. Y es gratis.",
                "Siendo sinceros, se trata de elegir entre disciplina y flexibilidad. MacroFactor recalcula cada semana aunque no te acuerdes de pedirlo, y eso te obliga a ser constante; el modelo conversacional solo ajusta algo cuando tú se lo pides. Si quieres que un algoritmo guíe tus números sin que tengas que hacer nada, MacroFactor vale lo que cuesta la suscripción. Si prefieres registrar gratis y pedir análisis cuando te interese, esto encaja mejor.",
            ],
        },
        importSection: {
            title: "Te llevas el registro, aunque no el coaching",
            body: [
                "Lo que dejarías atrás es el algoritmo, no los datos. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV de MacroFactor, el importador la analiza en tu navegador, asigna por ti las columnas que reconoce y confirmas una vista previa antes de que se guarde nada. Las filas nunca pasan por la IA, así que nada se transcribe mal por el camino.",
                "La exportación de MacroFactor se reconoce automáticamente por sus columnas (la de tamaño de porción es la que la delata), y sus columnas de fecha, alimento, comida, calorías y macros se asignan solas, incluidas la fibra, los azúcares totales y la cafeína cuando el archivo las tiene. Si tu exportación indica la energía en kilojulios y no en kilocalorías, se convierte, en vez de guardarse con un valor 4,184 veces mayor. Como una columna titulada solo «Calories» puede estar en cualquiera de las dos unidades, la unidad aparece como un control junto a un ejemplo calculado con la primera fila de tu archivo, así que la confirmas tú en vez de fiarte de una suposición que inflaría todos los días sin avisar.",
                "Y ese historial te sirve desde el primer momento, no se queda archivado. Con semanas de ingesta y peso ya cargadas, puedes hacer la pregunta que el algoritmo de MacroFactor respondía de forma programada («según las últimas tres semanas, ¿debería ajustar mis calorías?») y obtener al momento la interpretación que hace tu IA de tus propias cifras: una estimación, no un consejo dietético. Una segunda importación del mismo archivo no cambia nada, porque cada fila lleva una huella de contenido y las repetidas aparecen como ya registradas, siempre que tu zona horaria no haya cambiado entretanto.",
            ],
        },
        importFaq:
            "Sí. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de MacroFactor, el archivo se analiza en tu navegador sin que la IA lo lea, y confirmas una vista previa antes de que se guarde nada. La exportación de MacroFactor se reconoce automáticamente por sus columnas: la fecha, el alimento, la comida, las calorías, la proteína, los carbohidratos y la grasa se asignan solos, junto con la fibra, los azúcares totales y la cafeína cuando el archivo los tiene, y si indica la energía en kilojulios, se convierte a kilocalorías en cuanto confirmas la unidad junto a un ejemplo de tu propio archivo. Volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP ajusta mis objetivos de calorías como MacroFactor?",
                a: "No de forma automática. El recálculo semanal mediante algoritmo es la principal función de pago de MacroFactor. Con Nutrition MCP, preguntas tú («según mis últimas tres semanas de ingesta y peso, ¿debería ajustar mis calorías?») y tu IA lo analiza al momento, en vez de hacer una actualización semanal fija.",
            },
            {
                q: "¿De verdad Nutrition MCP es gratis, si MacroFactor solo funciona con suscripción?",
                a: "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin periodos de prueba que luego hay que pagar y sin límites de plan gratuito, a diferencia de MacroFactor, que no tiene plan gratuito y exige una suscripción al terminar la prueba. Necesitas una app de IA compatible con MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas con Google o con correo y contraseña la primera vez que te conectas.",
            },
        ],
        freeAnswer:
            "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin suscripción, mientras que MacroFactor exige una suscripción de pago al terminar la prueba gratuita. Necesitas una app de IA compatible con MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas con Google o con correo y contraseña la primera vez que te conectas.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Sin servidor MCP oficial. Controla comidas y macros conversando, gratis y de código abierto.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Buscar en la base de datos cada alimento que registras",
            "Algunas funciones, como los planes de comidas, requieren el plan de pago PRO",
            "Una app y una cuenta aparte que gestionar",
        ],
        note: "Yazio es una app de seguimiento muy cuidada, con buenos planes de comidas. Nutrition MCP se centra en un registro conversacional sin esfuerzo que funciona dentro de Claude o ChatGPT, gratis y de código abierto.",
        migrate: {
            title: "Los planes por un lado, el registro por otro",
            body: [
                "Yazio combina el seguimiento con planes de comidas estructurados, recetas y herramientas de ayuno, todo muy cuidado y pensado para el público europeo. Si lo que te mantiene en el buen camino es un plan guiado, Yazio lo hace bien y Nutrition MCP no pretende competir ahí: no es una app de planes de comidas.",
                "Lo que sí hace es quitarle todo el esfuerzo a la parte del registro. En vez de buscar cada ingrediente en la base de datos de Yazio, describes el plato y tu IA se encarga de los macros, y de paso te responde «¿cómo voy hoy?». Combínalo con el plan de alimentación que ya sigas.",
                "Así que, más que competir, los dos se complementan. Sigue con un plan de Yazio, o con cualquier otro, para el «qué comer»; usa Nutrition MCP para el «¿lo estoy cumpliendo?», registrado conversando y gratis. Con lo único que no te ayuda es con los temporizadores de ayuno: eso es terreno de Yazio, no de un registro de nutrición.",
            ],
        },
        importSection: {
            title: "Trae tu registro y asigna las columnas",
            body: [
                "Puedes traer tu historial de Yazio, aunque te tocará hacer un poco de trabajo. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV, el importador la analiza en tu navegador y tú asignas sus columnas a fecha, alimento, comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína. Las exportaciones de cuatro apps (MyFitnessPal, Cronometer, Lose It! y MacroFactor) se reconocen por los nombres de sus columnas; Yazio no es una de ellas, así que cuenta con hacer esa asignación una vez. Después, todo es igual: una vista previa de lo que se añadirá y tu confirmación.",
                "Las particularidades europeas que hacen fallar a la mayoría de los importadores están resueltas. Un archivo separado por punto y coma cuyos números usan coma decimal (el formato que genera Excel con la configuración regional alemana o austriaca) se lee correctamente, sin confundir el separador con un punto decimal ni multiplicar cada macro por mil. Los encabezados que conoce el importador tampoco son solo en inglés: reconoce Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker y Koffein en una exportación alemana, e identifica la fibra, el azúcar y la cafeína también en español, francés, italiano y neerlandés (fibra, sucres, zuccheri, suikers, cafeína, caffeina), así que un archivo en otro idioma suele llegar con parte de las columnas ya asignadas y te quedan menos por asignar a mano. También se resuelven los campos entre comillas, los saltos de línea dentro de una celda, los valores casi vacíos y las filas de totales sueltas, y la IA nunca lee el archivo, así que ningún número puede copiarse mal por el camino.",
                "Las fechas y la energía se confirman, no se adivinan. Una columna DD/MM/AAAA se lee con el día primero, y cuando los valores no bastan para decidirlo (05/06 puede ser mayo o junio), el importador muestra cómo los interpreta junto a una fila de tu propio archivo para que puedas corregirlo. Si la columna de energía está en kilojulios, se convierte a kilocalorías, y la unidad aparece como un control junto a un ejemplo calculado. Volver a importar el mismo archivo no añade nada: cada fila lleva una huella de contenido, así que las repetidas aparecen como ya registradas, siempre que tu zona horaria no haya cambiado entretanto.",
            ],
        },
        importFaq:
            "Sí, asignando las columnas a mano. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de Yazio, el archivo se analiza en tu navegador sin que la IA lo lea, y tú asignas sus columnas a fecha, alimento, comida, calorías y macros (entre ellos la fibra, los azúcares totales y la cafeína). Yazio no es una de las cuatro exportaciones que se reconocen por el nombre de sus columnas, así que esa asignación es un paso manual que haces una sola vez, aunque los encabezados que el importador ya conoce (en alemán, y para la fibra, el azúcar y la cafeína también en español, francés, italiano y neerlandés) se rellenan solos. Se admiten los archivos europeos separados por punto y coma con coma decimal, las fechas DD/MM/AAAA y los kilojulios, y volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP incluye planes de comidas como Yazio PRO?",
                a: "No. Los planes de comidas estructurados, las recetas y las herramientas de ayuno son el punto fuerte de Yazio, y Nutrition MCP no pretende sustituirlos: se ocupa de la parte del registro. Mucha gente sigue con su plan de Yazio (o cualquier otro) y registra aquí lo que come para ver si lo cumple, gratis.",
            },
            {
                q: "¿Puedo registrar comidas más rápido que buscando en la base de datos de Yazio?",
                a: "Normalmente sí. En vez de buscar cada ingrediente en la base de datos de Yazio y ajustar las porciones, describes el plato terminado una sola vez («un bowl de muesli con yogur y frutos rojos») y tu IA registra los macros en un solo paso, con valores de USDA para los alimentos genéricos cuando los hay y estimaciones en el resto.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Sin servidor MCP oficial. Una forma más ligera y gratuita de registrar lo que comes dentro de Claude o ChatGPT.",
        cons: [
            "Sin servidor MCP oficial: no puedes llevar tu diario desde Claude o ChatGPT",
            "Registrar los alimentos uno a uno buscando en su base de datos",
            "Algunas funciones, como los planes de dieta, requieren un plan de pago",
            "Otra app y otra suscripción más que gestionar",
        ],
        note: "Lifesum combina el seguimiento con planes de dieta estructurados. Nutrition MCP es una forma más ligera y gratuita de registrar calorías, macros y peso hablando con tu IA.",
        migrate: {
            title: "Puntuaciones que puedes pedir tú",
            body: [
                "Lifesum se apoya en la estructura y la valoración constante: planes de dieta, recetas y su sistema de puntuación de alimentos, que califica lo que comes. Nutrition MCP no le pone una insignia a tus alimentos, así que si ese ciclo de puntuaciones es lo que te motiva, ahí Lifesum tiene ventaja.",
                "A cambio, ganas flexibilidad: en vez de una puntuación fija, puedes preguntarle a tu IA «¿es una buena opción para mis objetivos?» y recibir una respuesta de verdad, en contexto. Registrar es cuestión de una frase, las tendencias y el peso objetivo vienen incluidos, y no hay ningún plan premium que bloquee lo útil.",
                "Una insignia te dice que un alimento sacó un 3 sobre 5; una conversación puede explicarte por qué, en el contexto de tu propio registro: «cambia la mitad del arroz por verduras y esto encaja en tu día». Y como Lifesum reserva los planes de dieta y parte del seguimiento para Premium, Nutrition MCP es la opción gratuita de las dos.",
            ],
        },
        importSection: {
            title: "Nada que volver a escribir",
            body: [
                "Cambiar de app implica llevarte tu historial, y no tienes que volver a escribir ni una línea. Pide importar y se abre un panel de importación en el chat: eliges tu exportación CSV de Lifesum, el importador la analiza en tu navegador y asignas sus columnas a fecha, alimento, comida, calorías, proteína, carbohidratos, grasa, fibra, azúcares totales y cafeína. Los encabezados de Lifesum no se reconocen por su nombre, como sí ocurre con los de MyFitnessPal, Cronometer, Lose It! y MacroFactor, así que esa asignación es un paso manual que haces una sola vez; después, revisas lo que se añadirá y confirmas.",
                "Nada depende de suposiciones ocultas. La pantalla de asignación te muestra tu propio archivo (sus encabezados reales, sus celdas reales y un recuento en vivo de las filas que se crearán), así que una columna asignada al campo equivocado se ve antes de guardar nada, en vez de descubrirse después. Los campos entre comillas, los saltos de línea dentro de una celda, los valores casi vacíos y las filas de totales están resueltos, y como el archivo se lee en tu navegador, la IA nunca ve ninguna fila que pudiera copiar mal.",
                "Las exportaciones europeas también están cubiertas: un archivo separado por punto y coma con coma decimal se lee correctamente, las fechas DD/MM/AAAA se convierten en cuanto confirmas el orden, y los kilojulios pasan a kilocalorías con la unidad visible junto a un ejemplo calculado con la primera fila de tu archivo. Los encabezados en otros idiomas también ayudan: Kalorien, Kohlenhydrate, Ballaststoffe o Koffein de una exportación alemana se asignan solos, y la fibra, el azúcar y la cafeína también se identifican en español, francés, italiano y neerlandés, así que la asignación manual suele ser más corta de lo que parece. Importa dos veces y nada se duplica: cada fila lleva una huella de contenido, así que las repetidas aparecen como ya registradas, siempre que tu zona horaria no haya cambiado entretanto.",
            ],
        },
        importFaq:
            "Sí, asignando las columnas a mano. Pide importar y se abre un importador en el chat: eliges tu exportación CSV de Lifesum, el archivo se analiza en tu navegador sin que la IA lo lea, y tú asignas sus columnas a fecha, alimento, comida, calorías y macros (incluidos la fibra, los azúcares totales y la cafeína). Lifesum no es una de las cuatro exportaciones que se reconocen por el nombre de sus columnas, así que esa asignación es un paso manual que haces una sola vez, aunque los encabezados que el importador ya conoce se rellenan solos. Se admiten los archivos europeos separados por punto y coma con coma decimal, las fechas DD/MM/AAAA y los kilojulios, y volver a importar el mismo archivo no crea duplicados, siempre que tu zona horaria no haya cambiado entretanto.",
        extraFaqs: [
            {
                q: "¿Nutrition MCP puntúa mi comida como hace Lifesum?",
                a: "No: no hay insignias ni puntuaciones numéricas. En su lugar, puedes preguntarle a tu IA «¿es una buena opción para mis objetivos?» y recibir una respuesta en contexto que explica los pros y los contras, en vez de una puntuación fija del alimento.",
            },
            {
                q: "¿Nutrition MCP es gratis sin un plan tipo Lifesum Premium?",
                a: "Sí. Nutrition MCP es completamente gratuito y de código abierto, sin plan premium, mientras que Lifesum reserva los planes de dieta y algunas funciones de seguimiento para su suscripción Premium. Necesitas una app de IA compatible con MCP, como Claude o ChatGPT, y una cuenta gratuita de Nutrition MCP, que creas con Google o con correo y contraseña la primera vez que te conectas.",
            },
        ],
    },
};

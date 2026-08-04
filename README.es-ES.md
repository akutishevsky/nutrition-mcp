

# Nutrition MCP

Un servidor MCP remoto para el seguimiento personal de la nutrición: registra comidas con calorías, macros, fibra y azúcar total, registra agua y peso corporal, revisa el historial nutricional e importa un diario de alimentos existente de otra aplicación, todo a través de conversación. El seguimiento de alcohol es opcional y está desactivado por defecto.

[Ayúdame a pagar los servidores en Patreon][patreon]

[patreon]: https://patreon.com/akutishevskyi?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink

## Inicio Rápido

Ya está alojado y listo para usar, solo conéctalo a tu cliente MCP:

```
https://nutrition-mcp.com/mcp
```

**En Claude.ai:** Personalizar → Conectores → + → Agregar conector personalizado → pegar la URL → Conectar

Al conectarte por primera vez, se te pedirá que te registres con un correo electrónico y una contraseña. Tus datos se mantienen entre reconexiones.

¿Cambiando de otro rastreador? Consulta las [alternativas a nutrition-app](https://nutrition-mcp.com/alternatives) — cómo se compara con [MyFitnessPal](https://nutrition-mcp.com/myfitnesspal-mcp), [Cronometer](https://nutrition-mcp.com/cronometer-mcp), [Lose It!](https://nutrition-mcp.com/lose-it-mcp), [MacroFactor](https://nutrition-mcp.com/macrofactor-mcp), [Yazio](https://nutrition-mcp.com/yazio-mcp) y [Lifesum](https://nutrition-mcp.com/lifesum-mcp). Trae tu historial contigo: di "importar mis comidas" y se abrirá un importador en el chat, donde elegirás el CSV que exportaste de tu antigua aplicación, mapearás sus columnas y verificarás qué se añadirá antes de que se guarde nada. Las exportaciones de MyFitnessPal, Cronometer, Lose It! y MacroFactor se reconocen automáticamente; cualquier otro CSV funciona mapeando sus columnas manualmente. En clientes que no pueden mostrar paneles dentro del chat, pega la exportación en su lugar y la IA la importará por ti. Si tu exportación tiene una columna de alcohol y deseas conservarla, activa el seguimiento de alcohol antes de importar: el importador omite esa columna mientras el seguimiento está desactivado, y volver a importar el mismo archivo más tarde no la completará retroactivamente.

## Demo

[![Demo](https://img.youtube.com/vi/Y1EHbfimQ70/maxresdefault.jpg)](https://youtube.com/shorts/Y1EHbfimQ70)

Lee la historia detrás de esto: [Cómo reemplacé MyFitnessPal y otras aplicaciones con un solo servidor MCP](https://medium.com/@akutishevsky/how-i-replaced-myfitnesspal-and-other-apps-with-a-single-mcp-server-56ca5ec7d673)

## Tecnologías

- **Bun** — entorno de ejecución y gestor de paquetes
- **Hono** — framework HTTP
- **MCP SDK** — Model Context Protocol sobre HTTP Streamable
- **Supabase** — base de datos PostgreSQL + autenticación de usuarios
- **OAuth 2.0** — autenticación para conectores de Claude.ai

## Herramientas MCP

| Herramienta                | Descripción                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `log_meal`                 | Registra una comida con descripción, tipo, calorías, macros, fibra, azúcar total, alcohol y notas — desde texto o una foto de tu plato             |
| `start_meal_import`        | Abre el importador CSV en el chat: elige una exportación de otra aplicación, mapea sus columnas, previsualiza y confirma                          |
| `bulk_import_meals`        | Escribe hasta 50 filas importadas por llamada — cada fila validada, se omiten duplicados para que un reenvío sea seguro                           |
| `lookup_barcode`           | Consulta la información nutricional de la etiqueta de un producto empacado por código de barras vía Open Food Facts (leído de una foto o escrito)  |
| `get_meals_today`          | Obtén todas las comidas registradas hoy                                                                                                          |
| `get_meals_by_date`        | Obtén comidas para una fecha específica (YYYY-MM-DD)                                                                                             |
| `get_meals_by_date_range`  | Obtén comidas entre dos fechas (inclusive)                                                                                                       |
| `search_meals`             | Busca comidas anteriores por palabra clave, agrupadas en variaciones recurrentes (conteo, última registrada, macros típicos)                      |
| `get_nutrition_summary`    | Totales nutricionales diarios + progreso de metas para un rango de fechas                                                                        |
| `update_meal`              | Actualiza cualquier campo de una comida existente                                                                                                |
| `delete_meal`              | Elimina una comida por ID                                                                                                                        |
| `set_nutrition_goals`      | Establece objetivos diarios de calorías, macros, fibra y agua a alcanzar, límites de azúcar y alcohol a no superar, más un peso objetivo opcional |
| `get_nutrition_goals`      | Obtén los objetivos y límites diarios actuales                                                                                                   |
| `get_goal_progress`        | Obtén ingesta frente a objetivos y límites para un día dado (predeterminado: hoy), más último peso frente al objetivo                            |
| `log_water`                | Registra una entrada de hidratación en mililitros                                                                                                |
| `get_water_today`          | Obtén el total de ingesta de agua de hoy y sus registros                                                                                         |
| `get_water_by_date`        | Obtén la ingesta de agua para una fecha específica                                                                                               |
| `delete_water`             | Elimina un registro de agua por ID                                                                                                               |
| `log_weight`               | Registra una medición de peso corporal en kg o lb (convertido y almacenado en el servidor)                                                       |
| `get_weight_today`         | Obtén los registros de peso de hoy                                                                                                               |
| `get_weight_by_date`       | Obtén registros de peso para una fecha específica                                                                                                |
| `get_weight_by_date_range` | Obtén registros de peso entre dos fechas (inclusive), agrupados por día                                                                          |
| `get_weight_trends`        | Tendencia de peso: último registro, cambio general, medias móviles de 7/14/30 días, mínimo/máximo y progreso del objetivo                       |
| `update_weight`            | Actualiza un registro de peso existente                                                                                                          |
| `delete_weight`            | Elimina un registro de peso por ID                                                                                                               |
| `set_weight_unit`          | Establece la unidad de peso preferida (`kg` o `lb`; null para borrar)                                                                            |
| `get_weight_unit`          | Obtén la unidad de peso preferida                                                                                                                |
| `get_trends`               | Promedios de 7/14/30 días, desviación estándar, rachas, día de la semana, mejor/peor día                                                         |
| `get_meal_patterns`        | Patrones de comportamiento preagregados (efecto del desayuno, cena tardía, fin de semana vs día laborable, valores atípicos)                      |
| `export_meals`             | Exporta todas las comidas como un CSV y devuelve un enlace de descarga válido por 60 minutos                                                     |
| `set_timezone`             | Establece la zona horaria IANA del usuario (ej. `America/Los_Angeles`)                                                                           |
| `get_timezone`             | Obtén la zona horaria configurada del usuario                                                                                                    |
| `set_widget_display`       | Activa o desactiva los widgets visuales en el chat (paneles, anillos, gráficos); activado por defecto                                            |
| `get_widget_display`       | Obtén si los widgets visuales en el chat están activados                                                                                         |
| `set_alcohol_tracking`     | Activa o desactiva el seguimiento de alcohol (desactivado por defecto) y elige bebidas estándar de EE. UU. o unidades del Reino Unido; desactivarlo oculta el alcohol en lugar de eliminarlo |
| `get_alcohol_tracking`     | Obtén si el seguimiento de alcohol está activo y en qué bebida estándar se muestra                                                               |
| `delete_account`           | Elimina permanentemente la cuenta y todos los datos asociados                                                                                    |

## Recursos MCP

| URI                          | Descripción                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `nutrition://weekly-summary` | Resumen móvil de 7 días (promedios frente a objetivos, día mejor/peor) para solicitudes proactivas    |

## Autoalojamiento

### 1. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Habilita **Autenticación por correo** (Authentication → Providers → Email) y deshabilita la confirmación por correo.
3. Aplica el esquema. El esquema completo está en [`supabase/migrations/`](supabase/migrations/). Con el [CLI de Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started):

    ```bash
    supabase link --project-ref <your-project-ref>
    supabase db push
    ```

    Esto crea todas las tablas, índices, políticas RLS y claves foráneas que necesita la aplicación. No se involucra Postgres local: las migraciones se ejecutan contra tu proyecto alojado.

4. Copia la **clave de rol de servicio** desde Project Settings → API y úsala como `SUPABASE_SECRET_KEY`.

### 2. Variables de entorno

| Variable               | Descripción                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`         | URL de tu proyecto Supabase                                                                           |
| `SUPABASE_SECRET_KEY`  | Clave de rol de servicio de Supabase (omite RLS)                                                      |
| `OAUTH_CLIENT_ID`      | Cadena aleatoria para identificación del cliente OAuth                                               |
| `OAUTH_CLIENT_SECRET`  | Cadena aleatoria para autenticación del cliente OAuth                                                 |
| `GOOGLE_CLIENT_ID`     | _(opcional)_ ID de cliente OAuth de Google para "Iniciar sesión con Google"                           |
| `GOOGLE_CLIENT_SECRET` | _(opcional)_ Secreto de cliente OAuth de Google                                                       |
| `OFF_USER_AGENT`       | User-Agent de Open Food Facts para búsquedas por código de barras, en el formato `AppName (email)`    |
| `PORT`                 | Puerto del servidor (predeterminado: `8080`)                                                          |

> **Hazlo tuyo:** El sitio público incluye elementos personales del mantenedor: Google Analytics, enlaces de Patreon/GitHub/contacto y el dominio `nutrition-mcp.com`. Ejecuta `bun run depersonalize` para eliminarlos todos en un solo paso (analíticas + CSP, las secciones de Soporte/Contacto, enlaces sociales y el dominio → un marcador de posición `your-domain.com`). Usa `bun run depersonalize --dry` para previsualizar sin escribir. Después, inserta tus propios `public/og.png`, `favicon.ico` y `apple-touch-icon.png`, y reemplaza el marcador de dominio con tu dominio real.

Genera credenciales OAuth:

```bash
openssl rand -hex 16   # use as OAUTH_CLIENT_ID
openssl rand -hex 32   # use as OAUTH_CLIENT_SECRET
```

### 3. Inicio de sesión con Google (opcional)

El inicio de sesión por correo/contraseña funciona inmediatamente. Para ofrecer también **"Continuar con Google"**,
sigue [`docs/google-auth-setup.md`](docs/google-auth-setup.md) para crear un
cliente OAuth de Google, habilitar el proveedor de Google en Supabase y configurar
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Desarrollo

```bash
bun install
cp .env.example .env   # completa tus credenciales
bun run dev             # inicia con recarga automática en http://localhost:8080
```

## Conectar a Claude.ai

1. Abre [Claude.ai](https://claude.ai) y haz clic en **Personalizar**
2. Haz clic en **Conectores**, luego en el botón **+**
3. Haz clic en **Agregar conector personalizado**
4. Rellena:
    - **Nombre**: Nutrition Tracker
    - **URL del servidor MCP remoto**: `https://nutrition-mcp.com/mcp`
5. Haz clic en **Conectar** — inicia sesión o regístrate cuando se te solicite
6. Después de iniciar sesión, Claude puede usar tus herramientas nutricionales. Si te vuelves a conectar más tarde, inicia sesión con el mismo correo y contraseña para conservar tus datos.

## Endpoints de API

| Endpoint                                      | Descripción                              |
| --------------------------------------------- | ---------------------------------------- |
| `GET /health`                                 | Comprobación de estado                   |
| `GET /.well-known/oauth-authorization-server` | Descubrimiento de metadatos OAuth        |
| `POST /register`                              | Registro dinámico de cliente             |
| `GET /authorize`                              | Autorización OAuth (muestra página de inicio de sesión) |
| `POST /approve`                               | Manejador de inicio de sesión/registro   |
| `POST /token`                                 | Intercambio de token                     |
| `GET /favicon.ico`                            | Icono del servidor                       |
| `ALL /mcp`                                    | Endpoint MCP (autenticado)               |

## Despliegue

El proyecto incluye un `Dockerfile` para despliegue basado en contenedores.

1. Sube tu repositorio a un proveedor de alojamiento (ej. DigitalOcean App Platform)
2. Configura las variables de entorno listadas arriba
3. La aplicación detecta automáticamente el Dockerfile y se despliega en el puerto `8080`
4. Apunta tu dominio a la URL desplegada

## Licencia

[MIT](LICENSE)

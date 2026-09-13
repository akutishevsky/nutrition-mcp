// Italian (it) translation of the landing page copy. See src/copy/index.ts
// for the full field-by-field documentation of this shape; this file
// mirrors its structure exactly. The four trusted-HTML fields
// (connect.claude.steps, connect.chatgpt.steps, connect.other.noteHtml,
// faq[].visibleHtml) keep every <b>/<code>/<a> tag of the English source;
// every other field is plain text. The hero chat's per-exchange nutrient
// deltas (`add`) and clock strings are numbers, not copy, and are copied
// byte-for-byte from the English source. Product UI element names quoted
// in the install steps (e.g. "Customize", "Connectors", "Create app") are
// left in English since they are literal button/menu labels in Claude's
// and ChatGPT's own interfaces, which this pass could not verify are
// localized into Italian; translating them risked giving incorrect
// instructions. Thousands separators follow CLDR's Italian convention —
// none in a four-digit figure ("2000", "1830"), a dot from five digits on
// ("12.040") — matching what the page's own figures and the widget cards
// render.
// Terminology kept consistent with
// src/copy/chrome.it.ts and src/copy/tools.it.ts: protein → proteine,
// carbs → carboidrati, fat → grassi, fiber → fibre, sugar → zuccheri,
// caffeine → caffeina, meal → pasto, goal → obiettivo, trend → andamento,
// timezone → fuso orario, log (verb) → registrare, tools → strumenti,
// live stats → statistiche live.

import type { IndexDoc } from "./index.js";

export const INDEX_IT: IndexDoc = {
    title: "Nutrition MCP — Tracker gratuito di calorie e macro per Claude, ChatGPT e Cursor",
    metaDescription:
        "Registra calorie, proteine, carboidrati, grassi, fibre, zuccheri e caffeina parlando con la tua IA. Nutrition MCP è un server MCP gratuito e open source che funziona in Claude, ChatGPT, Cursor e in qualsiasi client MCP. Nessuna app da installare.",
    ogDescription:
        "Server MCP gratuito e open source per tracciare calorie e macro dentro Claude, ChatGPT e Cursor. Dì cosa hai mangiato; ai calcoli ci pensa lui.",
    keywords:
        "tracker nutrizionale, conta calorie, tracker macro, server MCP, connettore Claude, app ChatGPT, tracciamento nutrizionale IA, diario alimentare, scanner codice a barre, open source, alternativa a MyFitnessPal",

    hero: {
        titleBeforeEm: "Traccia la tua alimentazione ",
        titleEm: "parlando",
        titleAfterEm: " con la tua IA.",
        lead: "Nutrition MCP è un tracker gratuito e open source di calorie e macro che vive dentro Claude, ChatGPT, Cursor — qualsiasi IA che supporti MCP. Dì cosa hai mangiato: calcola calorie, proteine, carboidrati, grassi, fibre, zuccheri e caffeina, lo registra e ti mostra la giornata. Nessuna app da installare.",
        ctaPrimary: "Connetti in un minuto",
        ctaGithub: "GitHub",
        moreExamples: "Altri esempi",
        chat: {
            status: "Nutrition · connesso",
            photoCaption: "📷 Foto",
            pauseLabel: "Metti in pausa la demo",
            exchanges: [
                {
                    userText:
                        "Porridge con frutti di bosco e un flat white a colazione",
                    aiText: "Registrato — circa 380 kcal, 14 g di proteine. Il flat white aggiunge 130 mg di caffeina.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description:
                            "Porridge con frutti di bosco e un flat white",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "È una Coca-Cola da 330 ml — 139 kcal, 35 g di zuccheri, da Open Food Facts. Registrata come spuntino.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Mezzo litro d'acqua",
                    aiText: "Fatto. 500 ml finora oggi.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText:
                        "Una grande insalata di pollo alla griglia a pranzo",
                    aiText: "Registrato — circa 540 kcal, 46 g di proteine. Sei a metà delle 2000 di oggi.",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "Insalata grande di pollo alla griglia",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "Come sto andando oggi?",
                    aiText: "Ecco la giornata finora — le proteine sono in linea, gli zuccheri sono vicini al limite.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "Come funziona",
        title: "Tre passaggi. Nessuna app da imparare.",
        sub: "Come funziona il tracciamento nutrizionale con l'IA tramite un server MCP: ti connetti una volta, descrivi i tuoi pasti e chiedi un riepilogo quando vuoi.",
        steps: [
            {
                title: "Connetti una volta",
                body: "Aggiungi il server a Claude, ChatGPT o a qualsiasi client MCP e accedi con Google o con l'email. Ci vuole meno di un minuto e non dovrai rifarlo mai più.",
            },
            {
                title: "Dì semplicemente cosa hai mangiato",
                body: "Descrivilo con parole tue — oppure invia una foto del tuo pasto, uno screenshot da un'app di consegna cibo o un codice a barre (il prodotto viene cercato online). Macro registrate automaticamente.",
            },
            {
                title: "Traccia e rivedi",
                body: "Chiedi riepiloghi giornalieri, andamenti settimanali, progressi verso gli obiettivi, oppure esporta tutto ciò che hai registrato in file CSV — completamente gratis.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Installazione rapida",
        title: "Connettiti a Claude, ChatGPT o Cursor in meno di un minuto.",
        sub: "Aggiungi il server Nutrition MCP al tuo client IA, accedi con Google o con email e password e inizia a registrare i pasti. Niente da installare, niente da imparare.",
        copyLabel: "Copia",
        copiedLabel: "Copiato",
        copyAriaLabel: "Copia l'URL del server",
        bullets: [
            "Funziona con ogni piano Claude e ChatGPT",
            "OAuth 2.0 — l'accesso lo gestisce il tuo client",
            "Connesso in Claude o ChatGPT, ti segue su iOS e Android",
        ],
        otherTabLabel: "Altri agenti",
        tabsLabel: "Scegli il tuo client AI",
        claude: {
            steps: [
                "Apri <b>Claude</b> (versione web o desktop) e clicca su <b>Customize</b> in alto a sinistra.",
                "Clicca su <b>Connectors</b>.",
                "Clicca su <b>+</b>, poi su <b>Add custom connector</b>.",
                "Dagli un nome, ad esempio <b>Nutrition</b>.",
                "Incolla <code>https://nutrition-mcp.com/mcp</code> nel campo <b>Remote MCP server URL</b>.",
                "Clicca su <b>Add</b>.",
                "Clicca su <b>Connect</b> — si apre la pagina di accesso; continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
            note: "Funziona con ogni piano Claude. Il piano gratuito consente un solo server MCP connesso alla volta.",
        },
        chatgpt: {
            steps: [
                "Apri <b>ChatGPT sul web</b> → <b>Settings</b> → <b>Apps</b>.",
                "Clicca su <b>Create app</b> in fondo al popup. Se non lo vedi, attiva <b>Developer mode</b> in <b>Advanced settings</b>.",
                "Dagli un nome, ad esempio <b>Nutrition</b>.",
                "Alla voce <b>Connection</b>, incolla <code>https://nutrition-mcp.com/mcp</code>.",
                "Alla voce <b>Authentication</b>, scegli <b>OAuth</b> — lascia tutto il resto invariato.",
                "Clicca su <b>Create</b>, poi su <b>Sign in with Nutrition</b>.",
            ],
            note: "Funziona con ogni piano ChatGPT.",
        },
        other: {
            noteHtml:
                "Aggiungi la configurazione qui sopra al tuo client (Cursor, VS Code, Claude Code e altri). Windsurf usa <code>serverUrl</code> invece di <code>url</code>. In Claude Code, esegui <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Il tuo client gestisce automaticamente l'accesso OAuth.",
        },
    },

    onboarding: {
        title: "Configuralo nei primi cinque minuti.",
        sub: "Nessuna schermata di impostazioni. Fuso orario, obiettivi di calorie e macro, lingua dei widget — ognuno è una frase che dici una volta sola.",
        stepLabel: "Passaggio {n}",
        justSay: "Dì semplicemente ",
        steps: [
            {
                title: "Imposta il tuo fuso orario",
                body: "Così i giorni cambiano alla tua mezzanotte locale, non a quella di qualcun altro.",
                say: "Imposta il mio fuso orario su New York",
            },
            {
                title: "Imposta i tuoi obiettivi",
                body: "Calorie, macro e acqua giornalieri, più un peso obiettivo facoltativo.",
                say: "Imposta il mio obiettivo giornaliero a 2000 calorie e 150 g di proteine",
            },
            {
                title: "Scegli la lingua dei widget",
                body: "La lingua usata dai widget in chat — non quella in cui l'IA ti risponde.",
                say: "Mostra i miei widget in tedesco",
            },
            {
                title: "Inizia a registrare",
                body: "Dì cosa hai mangiato, invia una foto o scansiona un codice a barre.",
                say: "Ho mangiato porridge con frutti di bosco a colazione",
            },
        ],
    },

    examples: {
        title: "Parlare batte il tocco.",
        sub: "Registra un pasto, scansiona un codice a barre, rivedi la tua settimana — conversazioni reali con veri widget in chat. Sfogliane qualcuna.",
        status: "Nutrition · connesso",
        prevLabel: "Precedente",
        nextLabel: "Successivo",
        pickerLabel: "Scegli un esempio",
        carouselLabel: "Conversazioni di esempio",
        slideLabel: "{n} di {total}",
        carouselRole: "carosello",
        slideRole: "slide",
        moreToolsLabel: "Usa anche",
        toolLinkLabel: "{tool} nella pagina degli strumenti",
        photoMealAlt:
            "Foto: una scodella di borscht con un cucchiaio di panna acida e aneto, e accanto una fetta di pane di segale",
        photoPackageAlt:
            "Foto: il codice a barre su una lattina di Coca-Cola, numero 5449000000996",
        threadLabel: "Conversazione",
        importerAlt:
            "L'importatore in chat al primo passaggio: scegli il file CSV esportato da MyFitnessPal, Cronometer, Lose It! o MacroFactor",
        importerCaption:
            "Anteprima dell'importatore come appare nella tua chat",
        slides: [
            {
                id: "log-meal",
                title: "Registra a parole tue",
                description:
                    "Dillo come lo racconteresti a un amico. Se manca la porzione o di quale pasto si tratta, chiede prima di stimare. Fibre e zuccheri vanno su ogni voce, la caffeina su tutto ciò che ne contiene, e «stamattina» cade nel tuo fuso orario.",
                toolNotes: {
                    log_meal:
                        "Salva la colazione con macro, fibre, zuccheri e caffeina del caffè",
                    log_water:
                        "Aggiunge i 500 ml delle 07:00 al totale d'acqua di oggi",
                    get_current_time:
                        "Trova data e ora di oggi per collocare «le 7 di stamattina»",
                },
                messages: [
                    {
                        from: "user",
                        text: "Una tazza di porridge con frutti di bosco e un caffè a colazione",
                    },
                    {
                        from: "ai",
                        text: "Colazione registrata — circa 320 kcal, 11 g di proteine, 6 g di fibre. Il caffè ha aggiunto 95 mg di caffeina.",
                    },
                    {
                        from: "user",
                        text: "E 500 ml d'acqua verso le 7 stamattina, dopo la corsa",
                    },
                    {
                        from: "ai",
                        text: "Aggiunti 500 ml d'acqua alle 07:00 di stamattina.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 1,
                cardMeals: [
                    "Porridge con frutti di bosco (1 tazza) e caffè (1 tazzina)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografa il piatto",
                description:
                    "Una foto apre un'intervista, non un'ipotesi. Chiarisce prima se è fatto in casa o al ristorante, guarda le registrazioni passate, poi fa una domanda per messaggio su porzioni e olio o salse nascosti, e registra quando approvi il riepilogo.",
                toolNotes: {
                    log_meal:
                        "Registra il pasto solo a domande chiuse e dopo il tuo sì",
                    search_meals:
                        "Trova i borscht già registrati per chiederti quale",
                },
                messages: [
                    { from: "user", photo: "meal", text: "Pranzo" },
                    {
                        from: "ai",
                        text: "Borscht con panna acida e una fetta di pane di segale. Sembra fatto in casa, giusto?",
                    },
                    { from: "user", text: "Sì, la ricetta di mia mamma" },
                    {
                        from: "ai",
                        text: "Hai già registrato il borscht in due versioni: con manzo (~320 kcal a scodella) e senza carne (~180). Qual è questo?",
                    },
                    {
                        from: "user",
                        text: "Con manzo. Ho aggiunto due cucchiai di panna acida",
                    },
                    {
                        from: "ai",
                        text: "Capito. Supponendo che tu abbia finito la scodella: borscht con manzo con 2 cucchiai di panna acida e una fetta di pane di segale, circa 470 kcal, 24 g di proteine. Lo registro come pranzo?",
                    },
                    { from: "user", text: "Sì" },
                    {
                        from: "ai",
                        text: "Pranzo registrato: 470 kcal · 24 g di proteine · 43 g di carboidrati · 22 g di grassi · 7 g di fibre · 10 g di zuccheri.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 7,
                cardMeals: [
                    "Borscht con manzo (1 scodella) con panna acida (2 cucchiai) e pane di segale (1 fetta)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scansiona un codice a barre",
                description:
                    "Fotografa la confezione: le cifre sotto il codice a barre si cercano su Open Food Facts e ti chiede quanto ne hai preso. La caffeina, assente su Open Food Facts, arriva dal marchio o da una ricerca web; fibre o zuccheri mancanti sono stimati.",
                toolNotes: {
                    lookup_barcode:
                        "Recupera i valori in etichetta della lattina da Open Food Facts",
                    log_meal:
                        "Registra la lattina intera con il pranzo, caffeina inclusa",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "Ho preso questo a pranzo",
                    },
                    {
                        from: "ai",
                        text: "È una Coca-Cola da 330 ml — 139 kcal e 35 g di zuccheri, da Open Food Facts. L'hai bevuta tutta?",
                    },
                    { from: "user", text: "Tutta" },
                    {
                        from: "ai",
                        text: "Registrata con il pranzo: 139 kcal e 35 g di zuccheri. Open Food Facts non ha il dato sulla caffeina, quindi ho usato quello di Coca-Cola: circa 32 mg a lattina.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 3,
                cardMeals: ["Coca-Cola (lattina da 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Obiettivi e progressi",
                description:
                    "Imposta target da raggiungere, come calorie e proteine, e limiti da non superare per zuccheri, alcol e caffeina; cambia solo ciò che nomini. Poi chiedi di un giorno qualsiasi per vedere ogni valore rispetto al suo obiettivo, e quanto manca.",
                toolNotes: {
                    set_nutrition_goals:
                        "Salva target di kcal e proteine e un limite di caffeina di 400 mg",
                    get_goal_progress:
                        "Mostra oggi rispetto a ogni obiettivo e quanto manca",
                },
                messages: [
                    {
                        from: "user",
                        text: "Imposta i miei obiettivi: 2000 kcal, 160 g di proteine e un limite di caffeina. Quale sarebbe ragionevole?",
                    },
                    {
                        from: "ai",
                        text: "Un riferimento comune è la soglia di EFSA e FDA per gli adulti sani: 400 mg al giorno, circa quattro tazze di caffè filtrato. Uso quella?",
                    },
                    { from: "user", text: "Sì, 400" },
                    {
                        from: "ai",
                        text: "Obiettivi aggiornati: 2000 kcal e 160 g di proteine da raggiungere, caffeina sotto i 400 mg.",
                    },
                    {
                        from: "user",
                        text: "Ci sta ancora un dolce stasera?",
                    },
                    {
                        from: "ai",
                        text: "Sei a 1540 kcal e 104 g di proteine: mancano ancora 460 kcal e 56 g di proteine per arrivare ai tuoi target. Quindi sì, un dolce da circa 200 kcal ci sta, purché il resto sia soprattutto proteine.",
                    },
                ],
                widget: "goal-progress",
                widgetAfter: 5,
                cardMeals: [
                    "Yogurt greco con granola e frutti di bosco (1 ciotola)",
                    "Wrap di pollo con insalata (1 wrap)",
                    "Flat white (1 tazza)",
                    "Salmone con riso e broccoli (1 piatto)",
                ],
            },
            {
                id: "review-week",
                title: "Rivedi la settimana",
                description:
                    "Chiedi com'è andata la settimana e il widget degli andamenti si apre in chat con le tue medie e i giorni registrati. Passa tra 7, 14 e 30 giorni o tocca un nutriente per vederne il grafico, senza nuove richieste. Può anche dirti le tue serie e i giorni a obiettivo.",
                toolNotes: {
                    get_trends:
                        "Fa la media di 7, 14 e 30 giorni e apre il widget degli andamenti",
                },
                messages: [
                    {
                        from: "user",
                        text: "Come sono andate le ultime due settimane?",
                    },
                    {
                        from: "ai",
                        text: "Hai fatto una media di 1830 kcal al giorno negli ultimi 14 giorni (13 dei quali registrati), 170 sotto il tuo obiettivo. Le proteine sono state il tuo macro più costante.",
                    },
                ],
                widget: "trends",
                widgetAfter: 1,
            },
            {
                id: "weight-trend",
                title: "Traccia il tuo peso",
                description:
                    "Registra una pesata in kg o lb e vedi l'andamento oltre le oscillazioni quotidiane: media livellata, variazione del mese e quanto manca all'obiettivo. Una lettura impossibile, come grammi digitati come chili, viene bloccata prima di salvarla.",
                toolNotes: {
                    log_weight:
                        "Salva 78,4 kg e rifiuta una lettura fisicamente impossibile",
                    get_weight_trends:
                        "Livella 30 giorni in medie mobili e la distanza dal target",
                },
                messages: [
                    {
                        from: "user",
                        text: "Ho appena controllato la bilancia: 78,4 kg. Com'è l'andamento?",
                    },
                    {
                        from: "ai",
                        text: "Registrati 78,4 kg. Hai perso 1,8 kg negli ultimi 30 giorni, con una media a 7 giorni di 78,7 kg. Mancano 3,4 kg al tuo obiettivo di 75 kg.",
                    },
                ],
                widget: "weight-trends",
                widgetAfter: 1,
            },
            {
                id: "meal-patterns",
                title: "Scopri le tue abitudini",
                description:
                    "Chiedi quando mangi di più e confronta le tue registrazioni: giorni feriali e weekend, giorni con e senza colazione, pranzi abbondanti, cene presto e cene tardi. Segnala anche i giorni insoliti, e riporta abitudini, non cause.",
                toolNotes: {
                    get_meal_patterns:
                        "Confronta feriali, weekend e orari di cena su 30 giorni",
                },
                messages: [
                    { from: "user", text: "Mangio di più nel weekend?" },
                    {
                        from: "ai",
                        text: "Non proprio. Negli ultimi 30 giorni la media dei giorni feriali è di 1986 kcal e quella del weekend di 1977.",
                    },
                    {
                        from: "user",
                        text: "C'è qualcosa che fa la differenza?",
                    },
                    {
                        from: "ai",
                        text: "L'orario della cena sì. I giorni in cui ceni alle 20 o più tardi hanno una media di 2150 kcal, contro 1915 quando ceni prima.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Anche i drink",
                description:
                    "Il tracciamento dell'alcol resta spento finché non lo chiedi. Scegli drink standard USA o unità britanniche, e ogni bevanda viene calcolata in grammi di alcol in base a quantità e gradazione. Se lo disattivi viene nascosto, mai cancellato.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Attiva l'alcol, in grammi accanto alle unità britanniche",
                    log_meal:
                        "Calcola l'alcol della pinta da quantità e gradazione",
                },
                messages: [
                    {
                        from: "user",
                        text: "Vorrei tracciare anche quanto bevo",
                    },
                    {
                        from: "ai",
                        text: "Certo. Conto in drink standard USA o in unità britanniche?",
                    },
                    { from: "user", text: "Unità britanniche" },
                    {
                        from: "ai",
                        text: "Tracciamento dell'alcol attivo, in grammi accanto alle unità britanniche. Funziona dal tuo prossimo messaggio, senza bisogno di una nuova chat.",
                    },
                    {
                        from: "user",
                        text: "Ho bevuto una pinta di lager al 4% a cena",
                    },
                    {
                        from: "ai",
                        text: "Registrata con la cena: una pinta da 568 ml al 4% contiene 17,9 g di alcol, 2,3 unità britanniche, circa 180 kcal.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 5,
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Porta il tuo storico",
                description:
                    "Arrivi da MyFitnessPal, Cronometer, Lose It! o MacroFactor? Prima controlla il tuo fuso orario, l'esportazione viene letta nel browser, nulla viene salvato finché non confermi l'anteprima e reimportare lo stesso file non duplica mai un pasto.",
                toolNotes: {
                    start_meal_import:
                        "Apre in chat l'importatore per il tuo file esportato",
                    get_profile:
                        "Nota che non è ancora impostato un fuso orario",
                    set_timezone:
                        "Imposta America/Chicago perché gli orari cadano nel giorno giusto",
                },
                messages: [
                    {
                        from: "user",
                        text: "Puoi importare il mio storico di MyFitnessPal?",
                    },
                    {
                        from: "ai",
                        text: "Certo. Prima però: il tuo fuso orario non è impostato, quindi gli orari importati verrebbero letti come UTC. Dove ti trovi?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Fuso orario impostato su America/Chicago. Ora scegli il file esportato nell'importatore qui sotto. Viene letto nel tuo browser e nulla viene salvato finché non confermi l'anteprima.",
                    },
                ],
                widget: "import-meals",
                widgetAfter: 3,
            },
            {
                id: "export-data",
                title: "Porta via i tuoi dati",
                description:
                    "Una sola richiesta raccoglie ogni pasto, registrazione d'acqua e pesata, più obiettivi e impostazioni, in uno ZIP di file CSV con un README in inglese semplice. Ogni timestamp indica il suo fuso orario, e meals.csv si reimporta direttamente.",
                toolNotes: {
                    export_all_data:
                        "Comprime sei file e restituisce un link privato valido 60 minuti",
                },
                messages: [
                    {
                        from: "user",
                        text: "Fai un backup di tutti i miei dati",
                    },
                    {
                        from: "ai",
                        text: "Fatto: uno ZIP con 1204 pasti, 318 registrazioni d'acqua, 64 pesate, i tuoi obiettivi e le impostazioni del profilo. Ecco il link per il download. Funziona per 60 minuti.",
                    },
                    {
                        from: "user",
                        text: "Potrò ripristinarli più avanti?",
                    },
                    {
                        from: "ai",
                        text: "I pasti sì. meals.csv si reimporta direttamente, e ogni pasto che hai ancora viene riconosciuto dal suo id e saltato, quindi niente viene duplicato. Acqua, peso, obiettivi e impostazioni si possono solo esportare, quindi conserva lo ZIP.",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "Live · tutti, finora",
        title: "Colazione da una parte, cena dall'altra.",
        sub: "Statistiche nutrizionali in tempo reale di tutti gli account Nutrition MCP — calorie, pasti registrati, macro e peso perso — aggiornate ogni cinque secondi.",
        unitGroupLabel: "Unità",
        unitMetricLabel: "Metrico",
        unitImperialLabel: "Imperiale",
        refreshBefore: "Si aggiorna ogni 5 s · prossimo tra ",
        refreshAfter: "s",
        sinceOpenLabel: "da quando hai aperto la pagina",
        cards: {
            calories: "Calorie registrate",
            foodLogs: "Pasti registrati",
            protein: "Proteine registrate",
            carbs: "Carboidrati registrati",
            fat: "Grassi registrati",
            weightLost: "Peso perso dal 2 luglio 2026",
            water: "Acqua registrata",
        },
        foodLogsUnit: "pasti",
        timezonesAfter:
            " fusi orari · i giorni cambiano alla mezzanotte di ciascuno",
        mapNote:
            "dimensione del punto = quota di account · passa il mouse su un punto",
        mapShare: "{share} degli account",
        mapAriaLabel:
            "Mappa del mondo a punti degli account Nutrition MCP per fuso orario; i punti più grandi indicano una quota maggiore",
    },

    support: {
        eyebrow: "Sempre gratuito",
        title: "Tracciamento nutrizionale gratuito. Nessun piano premium. Mai.",
        sub: "Ogni strumento, ogni widget, ogni esportazione — per tutti, senza costi. È il progetto open source di una sola persona, e il codice è sotto licenza MIT, così resterà sempre così.",
        bullets: [
            "Tutti i 36 strumenti e sei widget inclusi",
            "Niente pubblicità, niente upsell, niente funzioni bloccate",
            "Esporta o elimina i tuoi dati quando vuoi",
            "Se preferisci, ospitalo tu stesso — Dockerfile incluso",
        ],
        patreon: {
            eyebrow: "Facoltativo · Patreon",
            title: "Se ti è utile, aiuta a tenere acceso il server.",
            sub: "L'unico costo è l'hosting e il database. Lo coprono i sostenitori — qualsiasi importo, disdici quando vuoi. Non si sblocca nulla: ricevi solo le note di sviluppo in anteprima e voce in capitolo su cosa arriva dopo.",
            cta: "Sostieni su Patreon",
            starCta: "Metti una stella, invece",
        },
        postsTitle: "Ultimi post su Patreon",
        postsAll: "Tutti i post",
        postLinkLabel: "Leggi su Patreon",
    },

    contact: {
        eyebrow: "Contatti",
        title: "Scrivimi.",
        sub: "Hai trovato un bug, hai un'idea o ha sbagliato completamente un pasto? Scrivimi direttamente — leggo ogni messaggio.",
        emailAriaLabel: "Invia un'email a anton@nutrition-mcp.com",
        cards: {
            email: { title: "Email", sub: "Qualsiasi cosa — la linea diretta" },
            issues: {
                title: "Issue su GitHub",
                sub: "Bug e richieste di funzionalità, in pubblico",
            },
            patreon: {
                title: "Patreon",
                sub: "Note di sviluppo, votazioni e chat con i sostenitori",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Domande su Nutrition MCP.",
        subBefore:
            "Cos'è, dove funziona, quanto costa e chi vede i tuoi dati. Manca qualcosa? ",
        subLink: "Chiedimelo direttamente",
        subAfter: ".",
        categoriesLabel: "Filtra le domande per categoria",
        categories: {
            all: "Tutte",
            basics: "Nozioni di base",
            clients: "Client",
            tracking: "Tracciamento",
            data: "I tuoi dati",
        },
    },
    faq: [
        // Nozioni di base
        {
            question: "Cos'è Nutrition MCP?",
            visibleHtml:
                "Un server MCP (Model Context Protocol) gratuito e open source per il tracciamento nutrizionale. Collegalo a Claude, ChatGPT, Cursor o a qualsiasi client MCP e registra pasti, calorie, macro, acqua e peso parlando.",
            category: "basics",
        },
        {
            question: "Cos'è un server MCP?",
            visibleHtml:
                "Un piccolo servizio che la tua IA può chiamare mentre chattate. Nutrition MCP dà a Claude, ChatGPT, Cursor e compagnia 36 strumenti per la nutrizione — registrazione, obiettivi, andamenti, importazione ed esportazione. Gli strumenti non li vedi mai: parli e basta.",
            category: "basics",
        },
        {
            question: "Nutrition MCP è gratuito?",
            visibleHtml:
                "Sì. Nessun piano premium, niente pubblicità, nessuna funzione bloccata. Ti serve solo un account Claude o ChatGPT per connetterti. Le donazioni su Patreon coprono le spese del server.",
            category: "basics",
        },
        // Client
        {
            // The visible answer states the server URL itself, so no
            // jsonLdText override is needed — stripping tags gives the
            // same sentence.
            question: "Funziona con ChatGPT?",
            visibleHtml:
                "Sì. In ChatGPT sul web apri Settings → Apps → Create app, incolla <code>https://nutrition-mcp.com/mcp</code> con autenticazione OAuth e accedi. Funziona con ogni piano ChatGPT.",
            category: "clients",
        },
        {
            question: "Funziona con Cursor, VS Code o Claude Code?",
            visibleHtml:
                "Sì — con qualsiasi client che supporti i server MCP remoti via HTTP. Aggiungi l'URL al tuo <code>mcp.json</code> oppure, in Claude Code, esegui <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "Funziona sul mio telefono?",
            visibleHtml:
                "Sì. Connettilo una volta in Claude o ChatGPT sul web o su desktop e compare automaticamente nelle loro app iOS e Android.",
            category: "clients",
        },
        // Tracciamento
        {
            // Kept from the previous landing page verbatim, mirroring the
            // English entry that src/site-copy.test.ts pins (caffeine named
            // "in milligrammi").
            question: "Cosa posso tracciare?",
            visibleHtml:
                "Calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e acqua per ogni voce — descritti con parole tue o recuperati dal codice a barre di un prodotto tramite Open Food Facts. Viene tracciata anche la caffeina, in milligrammi, l'unità usata da ogni etichetta, e non aggiunge calorie. Anche l'alcol viene tracciato, in grammi di etanolo puro, una volta che lo attivi. Puoi anche registrare il tuo peso corporeo in kg o lb e monitorare gli andamenti verso un peso obiettivo. Visualizza riepiloghi giornalieri, interroga i pasti per intervallo di date, aggiorna o elimina voci passate, imposta obiettivi e monitora gli andamenti nel tempo.",
            category: "tracking",
        },
        {
            question: "Quanto è preciso il conteggio delle calorie?",
            visibleHtml:
                "I valori sono stime basate su ciò che descrivi, come le farebbe un amico esperto — vanno bene per gli andamenti, non per decisioni mediche. Le scansioni dei codici a barre usano i dati di Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Traccia l'alcol?",
            visibleHtml:
                "Solo se lo attivi. Il tracciamento dell'alcol è disattivato per impostazione predefinita; una volta attivato, i drink vengono registrati in grammi di etanolo e mostrati come drink standard USA o unità britanniche.",
            category: "tracking",
        },
        // I tuoi dati
        {
            // The closing sentence mirrors the English one pinned by
            // src/site-copy.test.ts: everything goes out, only meals come
            // back in.
            question:
                "Posso importare il mio storico da MyFitnessPal o Cronometer?",
            visibleHtml:
                "Sì. Importa lo storico dei pasti da MyFitnessPal, Cronometer, Lose It!, MacroFactor o da qualsiasi CSV mappandone le colonne — fino a 50 righe per chiamata. Per ora, i pasti sono l'unica parte che può essere reimportata.",
            category: "data",
        },
        {
            // Names meals, water, weight, goals and profile — the five
            // files in the export archive.
            question: "Chi può vedere i miei dati, e posso esportarli?",
            visibleHtml:
                "Solo tu. Esporta tutto — pasti, acqua, peso, obiettivi, profilo — come ZIP di file CSV con un link di download valido 60 minuti, oppure elimina direttamente il tuo account. Licenza MIT, quindi puoi anche ospitarlo tu stesso.",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "Posso ospitarlo io stesso (self-host)?",
            visibleHtml:
                'Sì. Nutrition MCP è open source (licenza MIT). Puoi eseguire una tua istanza con un tuo progetto Supabase — il <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repository GitHub</a> include una guida completa al self-hosting e un Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Il tuo prossimo pasto è a una frase di distanza.",
        sub: "Tracciamento nutrizionale gratuito e open source per Claude, ChatGPT e Cursor — e i tuoi dati sono tuoi, da esportare o eliminare quando vuoi.",
        primary: "Connetti ora",
        secondary: "Metti una stella su GitHub",
    },
};

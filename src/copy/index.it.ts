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
            replayLabel: "Riproduci di nuovo la demo",
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
        importerAlt: {
            file: "L'importatore in chat, passaggio 1 di 4: scegli il file CSV esportato da MyFitnessPal, Cronometer, Lose It! o MacroFactor",
            map: "Passaggio 2 di 4: le colonne del file sono state associate automaticamente; questa esportazione non ha i nomi degli alimenti",
            preview:
                "Passaggio 3 di 4: anteprima di 603 pasti, 322.343 kcal, prima di salvare qualsiasi cosa",
            done: "Passaggio 4 di 4: 603 pasti importati",
        },
        importerCaption:
            "Le schermate dell'importatore in ordine; nella tua chat è un'unica scheda che si aggiorna sul posto",
        downloadExpires: "Scade tra 60 minuti",
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
                        "Trova la data di oggi perché «verso le 7» diventi le 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "porridge con mirtilli e un caffè a colazione",
                    },
                    {
                        from: "ai",
                        text: "Quanto era grande la tazza, e il porridge l'hai fatto con latte o con acqua? Hai messo qualcosa nel caffè?",
                    },
                    {
                        from: "user",
                        text: "tazza normale, col latte. caffè amaro",
                    },
                    {
                        from: "ai",
                        text: "Colazione registrata: circa 320 kcal, 11 g di proteine e 6 g di fibre. Con il caffè sei a 95 mg sul tuo limite di caffeina di 400 mg.",
                    },
                    {
                        from: "user",
                        text: "ah, e verso le 7 ho bevuto tipo mezzo litro d'acqua, prima di andare a correre",
                    },
                    {
                        from: "ai",
                        text: "Aggiunti 500 ml d'acqua alle 07:00 di stamattina.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Porridge con latte e mirtilli (1 tazza) e caffè amaro (1 tazza)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografa il piatto",
                description:
                    "Una foto apre un'intervista, non un'ipotesi. Chiarisce se è fatto in casa o al ristorante, controlla come hai registrato il piatto in passato, fa una domanda alla volta su porzioni ed extra e registra solo quando approvi il riepilogo.",
                toolNotes: {
                    log_meal:
                        "Registra il pasto solo a domande chiuse e dopo il tuo sì",
                    search_meals:
                        "Trova i borscht già registrati per chiederti quale",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "il borscht della mamma a pranzo",
                    },
                    {
                        from: "ai",
                        text: "Ha un bell'aspetto. Hai registrato il borscht 6 volte: 5 con manzo (circa 320 kcal a scodella, l'ultima il 2 set) e una senza carne (circa 180). Qual è questo?",
                    },
                    { from: "user", text: "con manzo" },
                    {
                        from: "ai",
                        text: "Perfetto, con manzo. Restano due cose: la panna acida e quanto ne hai mangiato. Più o meno quanti cucchiai di panna acida ci hai messo?",
                    },
                    { from: "user", text: "2 cucchiai, forse un po' di più" },
                    {
                        from: "ai",
                        text: "Conto 2 cucchiai abbondanti. Hai finito la scodella?",
                    },
                    { from: "user", text: "tutta, anche il pane" },
                    {
                        from: "ai",
                        text: "Quindi: borscht con manzo (1 scodella) con 2 cucchiai abbondanti di panna acida, più una fetta di pane di segale, a giudicare dalla foto. Circa 470 kcal e 24 g di proteine. Lo registro come pranzo?",
                    },
                    { from: "user", text: "sì" },
                    {
                        from: "ai",
                        text: "Pranzo registrato: 470 kcal · 24 g di proteine · 43 g di carboidrati · 22 g di grassi · 7 g di fibre · 10 g di zuccheri.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 9 }],
                cardMeals: [
                    "Borscht con manzo (1 scodella, finita) con panna acida (2 cucchiai) e pane di segale (1 fetta)",
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
                        text: "l'ho bevuta a pranzo. quanto è grave, davvero?",
                    },
                    {
                        from: "ai",
                        text: "È una lattina di Coca-Cola da 330 ml: 139 kcal e 35 g di zuccheri, secondo Open Food Facts. L'hai bevuta tutta?",
                    },
                    { from: "user", text: "tutta" },
                    {
                        from: "ai",
                        text: "Registrata con il pranzo: 139 kcal, 35 g di zuccheri e 33 mg di caffeina secondo il dato di Coca-Cola stessa, perché Open Food Facts non riporta la caffeina. E per rispondere alla tua domanda: quello zucchero da solo supera metà del tuo limite giornaliero di 60 g, e Open Food Facts le dà Nutri-Score E e NOVA 4, cioè ultra-processata.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
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
                        text: "voglio asciugarmi un po'. impostami 2000 kcal e 160 g di proteine. e qual è un limite di caffeina sensato? praticamente vivo di caffè",
                    },
                    {
                        from: "ai",
                        text: "EFSA e FDA fissano la soglia per gli adulti sani a 400 mg al giorno, circa quattro tazze di caffè filtrato; in gravidanza l'EFSA consiglia 200 mg. Metto 400 come tuo limite?",
                    },
                    { from: "user", text: "sì, 400" },
                    {
                        from: "ai",
                        text: "Fatto: 2000 kcal e 160 g di proteine da raggiungere, caffeina sotto i 400 mg. Il resto rimane com'era: 220 g di carboidrati, 70 g di grassi, 30 g di fibre, 2,5 L d'acqua e il tuo limite di 60 g di zuccheri.",
                    },
                    { from: "user", text: "ci sta ancora un dolce stasera?" },
                    {
                        from: "ai",
                        text: "Sì. Sei a 1540 kcal e 104 g di proteine, quindi mancano 460 kcal e 56 g di proteine. Il margine più stretto è sugli zuccheri: 40 dei tuoi 60 g di limite, quindi uno yogurt greco con frutti di bosco ci sta meglio di una torta, e aiuta pure con le proteine.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
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
                        text: "come sono andate le ultime due settimane? ho l'impressione di aver fatto un po' a caso",
                    },
                    {
                        from: "ai",
                        text: "Meglio di come sembra. Hai fatto una media di 1830 kcal al giorno, 170 sotto le tue 2000, ma conta come zero l'unico giorno dei 14 che non hai registrato. Nei 13 giorni registrati eri intorno alle 1970, con 9 giorni entro il 10% dall'obiettivo. E sei a 10 giorni di fila di registrazioni.",
                    },
                    { from: "user", text: "e gli zuccheri?" },
                    {
                        from: "ai",
                        text: "Sono quelli da tenere d'occhio. Media di 52 g, e hai superato il tuo limite di 60 g in 4 dei 13 giorni.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Traccia il tuo peso",
                description:
                    "Registra una pesata in kg o lb e vedi l'andamento oltre le oscillazioni quotidiane: media livellata, variazione del mese e quanto manca all'obiettivo. Una lettura impossibile, come una virgola dimenticata, viene bloccata prima di salvarla.",
                toolNotes: {
                    log_weight:
                        "Salva 78,4 kg e rifiuta una lettura fisicamente impossibile",
                    get_weight_trends:
                        "Livella 30 giorni in medie mobili e la distanza dal target",
                },
                messages: [
                    { from: "user", text: "appena pesato, 784" },
                    {
                        from: "ai",
                        text: "784 kg non è un peso possibile per un corpo umano, quindi non l'ho salvato. Intendevi 78,4?",
                    },
                    {
                        from: "user",
                        text: "ahah sì, ho saltato la virgola. come sto andando?",
                    },
                    {
                        from: "ai",
                        text: "Salvati 78,4 kg. Hai perso 1,8 kg dal 14 ago, circa 0,4 kg a settimana, e la tua media a 7 giorni è di 78,7 kg. Mancano 3,4 kg al tuo obiettivo di 75 kg.",
                    },
                ],
                cards: [{ kind: "weight-trends", after: 3 }],
            },
            {
                id: "meal-patterns",
                title: "Scopri le tue abitudini",
                description:
                    "Chiedi quando mangi di più e confronta le tue registrazioni: giorni feriali e weekend, giorni con e senza colazione, pranzi abbondanti, cene presto e cene tardi. Segnala anche i giorni insoliti, e riporta abitudini, non cause.",
                toolNotes: {
                    get_meal_patterns:
                        "Confronta giorni con e senza colazione, orari di cena e weekend su 30 giorni",
                },
                messages: [
                    {
                        from: "user",
                        text: "mangio di più nei giorni in cui salto la colazione? ho questa sensazione",
                    },
                    {
                        from: "ai",
                        text: "Un po', sì. Hai registrato 28 degli ultimi 30 giorni e hai saltato la colazione in 6. Quei giorni hanno una media di 2215 kcal, contro 1940 nei 22 giorni con colazione, e circa 35 g di proteine in meno.",
                    },
                    {
                        from: "user",
                        text: "e le cene tardi? nei giorni di palestra non mangio prima delle 9",
                    },
                    {
                        from: "ai",
                        text: "Anche quelle si notano: i 9 giorni con cena alle 20 o più tardi hanno una media di 2165 kcal, contro 1920 negli altri 19. Sono entrambe abitudini nelle tue registrazioni, non la prova che una delle due ne sia la causa.",
                    },
                    { from: "user", text: "e nel weekend?" },
                    {
                        from: "ai",
                        text: "Quasi nessuna differenza: nel weekend la media è di 2010 kcal, nei giorni feriali di 1993.",
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
                        text: "puoi contare anche quello che bevo? sto cercando di ridurre un po'",
                    },
                    {
                        from: "ai",
                        text: "Certo. Mostro l'alcol in drink standard USA o in unità britanniche?",
                    },
                    {
                        from: "user",
                        text: "unità britanniche, vivo a Manchester",
                    },
                    {
                        from: "ai",
                        text: "Tracciamento dell'alcol attivo, in grammi accanto alle unità britanniche.",
                    },
                    {
                        from: "user",
                        text: "ho bevuto una pinta di lager a cena",
                    },
                    {
                        from: "ai",
                        text: "Che gradazione aveva? Le lager di solito stanno tra il 4 e il 5%, e lo trovi scritto sulla spina o sulla lattina.",
                    },
                    { from: "user", text: "4% credo" },
                    {
                        from: "ai",
                        text: "Registrata con la cena: una pinta da 568 ml al 4% contiene 17,9 g di alcol, 2,3 unità britanniche, circa 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
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
                        "Imposta America/Chicago così i pasti vanno nell'ora locale",
                },
                messages: [
                    {
                        from: "user",
                        text: "sto passando da MyFitnessPal. puoi portare qui il mio diario alimentare? ho già l'esportazione",
                    },
                    {
                        from: "ai",
                        text: "Sì. Prima una cosa: il tuo fuso orario non è impostato, quindi i pasti importati verrebbero collocati in ora UTC invece che nella tua ora locale. Dove ti trovi?",
                    },
                    { from: "user", text: "Chicago" },
                    {
                        from: "ai",
                        text: "Impostato su America/Chicago. Ora scegli nell'importatore qui sotto il CSV Nutrition-Summary della tua esportazione di MyFitnessPal. Viene letto direttamente nel tuo browser, e nulla viene salvato finché non confermi l'anteprima.",
                    },
                    {
                        from: "user",
                        text: "ha associato le colonne ma su nome alimento dice «non presente in questo file»?",
                    },
                    {
                        from: "ai",
                        text: "È normale con MyFitnessPal: la sua esportazione ha una riga per ogni pasto di ogni giorno, con i totali ma senza i nomi degli alimenti. Ogni pasto viene invece etichettato con il suo tipo di pasto, con calorie e macro intatti.",
                    },
                    {
                        from: "user",
                        text: "603 pasti. dice che verranno registrati a mezzogiorno?",
                    },
                    {
                        from: "ai",
                        text: "Esatto, l'esportazione ha le date ma non gli orari. Mezzogiorno tiene ogni pasto nel giorno giusto a Chicago; semplicemente non vedrai a che ora hai mangiato davvero.",
                    },
                    { from: "user", text: "fatto! è arrivato tutto?" },
                    {
                        from: "ai",
                        text: "Tutto: 603 pasti importati e nessun errore.",
                    },
                ],
                cards: [
                    { kind: "import-meals", after: 3, step: "file" },
                    { kind: "import-meals", after: 3, step: "map" },
                    { kind: "import-meals", after: 5, step: "preview" },
                    { kind: "import-meals", after: 7, step: "done" },
                ],
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
                        text: "la mia dietista vuole vedere il mio diario alimentare. me lo puoi tirare fuori come foglio di calcolo?",
                    },
                    {
                        from: "ai",
                        text: "Ecco qui: uno ZIP con 1204 pasti, 318 registrazioni d'acqua e 64 pesate, più i tuoi obiettivi e le impostazioni. Il tuo diario alimentare è il meals.csv al suo interno, che si apre in Excel o Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "posso semplicemente mandarle il link?",
                    },
                    {
                        from: "ai",
                        text: "Meglio scaricarlo e mandarle il file. Il link smette di funzionare dopo 60 minuti, e chiunque lo abbia può aprire tutta la tua esportazione, peso e impostazioni compresi, non solo i pasti.",
                    },
                    {
                        from: "user",
                        text: "buono a sapersi. potrei ripristinare da lì più avanti, se servisse?",
                    },
                    {
                        from: "ai",
                        text: "I pasti sì. meals.csv si reimporta direttamente, e ogni pasto che hai ancora viene riconosciuto dal suo id e saltato, quindi niente viene duplicato. Acqua, peso, obiettivi e impostazioni sono nello ZIP solo come archivio personale; non si possono reimportare.",
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

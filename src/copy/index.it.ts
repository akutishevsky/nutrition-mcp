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
// instructions. Thousands separators follow Italian convention (2.000,
// 2.035), matching what the page script's toLocaleString("it") renders
// for the computed widget figures. Terminology kept consistent with
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
                        caf: 130,
                    },
                    clock: "08:04",
                },
                {
                    barcode: true,
                    aiText: "È una Coca-Cola da 330 ml — 139 kcal, 35 g di zuccheri, da Open Food Facts. Registrata come spuntino.",
                    add: { kcal: 139, car: 35, sugar: 35 },
                    clock: "11:30",
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
                    aiText: "Registrato — circa 540 kcal, 46 g di proteine. Sei a metà delle 2.000 di oggi.",
                    add: { kcal: 540, pro: 46, car: 22, fat: 28, sugar: 6 },
                    clock: "13:22",
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
            widget: {
                title: "Oggi",
                goal: "obiettivo 2.000",
                kcalUnit: "kcal",
                protein: "Proteine",
                carbs: "Carboidrati",
                fat: "Grassi",
                water: "Acqua",
                sugar: "Zuccheri",
                caffeine: "Caffeina",
                hint: "👆 Tocca una metrica per vedere i pasti che la riguardano",
            },
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
                say: "Imposta il mio obiettivo giornaliero a 2.000 calorie e 150 g di proteine",
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
        slides: [
            {
                title: "Registra un pasto",
                sub: "Parole semplici, nessun database",
                userText:
                    "Ho mangiato porridge con frutti di bosco e un caffè a colazione",
                aiText: "Colazione registrata — circa 320 kcal, 11 g di proteine. Il caffè ha aggiunto 95 mg di caffeina.",
            },
            {
                title: "Scansiona un codice a barre",
                sub: "Open Food Facts, in proporzione alla tua porzione",
                userText: "Scansiona questo codice a barre: 5449000000996",
                aiText: "È una Coca-Cola da 330 ml — 139 kcal, 35 g di zuccheri, da Open Food Facts. Quanta ne hai bevuta?",
            },
            {
                title: "Rivedi la settimana",
                sub: "Widget degli andamenti, direttamente in chat",
                userText: "Com'è andata la settimana scorsa?",
                aiText: "Hai fatto una media di 2.035 kcal al giorno su 6 giorni registrati — 165 sotto il tuo obiettivo. Le proteine sono state il tuo macro più costante.",
                widget: {
                    title: "Andamenti",
                    sub: "7 giorni",
                    big: "2.035",
                    cap: "media giornaliera · 6 giorni registrati",
                    from: "1 set",
                    goal: "obiettivo 2.200",
                    today: "Oggi",
                },
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

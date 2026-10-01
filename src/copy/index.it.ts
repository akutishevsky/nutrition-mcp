// Italian (it) translation of the landing page copy. See src/copy/index.ts
// for the full field-by-field documentation of this shape; this file
// mirrors its structure exactly. The trusted-HTML fields (install steps and
// notes, why.noteHtml, faq[].visibleHtml) keep every <strong>/<code>/<a> tag
// of the English source; every other field is plain text. The demo
// conversations are structured: `photo`, `card`, `meal.type`, `from`,
// `download`, `cards` and the `toolNotes` keys are copied verbatim from the
// English source, and every figure the cards draw is kept as written.
// Product UI element names quoted in the install steps (e.g. "Customize",
// "Connectors", "Create app") are left in English since they are literal
// button/menu labels in Claude's and ChatGPT's own interfaces, which this
// pass could not verify are localized into Italian; translating them risked
// giving incorrect instructions. Thousands separators follow CLDR's Italian
// convention — none in a four-digit figure ("2000", "1830"), a dot from
// five digits on ("12.040") — matching what the widget cards render.
// Terminology kept consistent with src/copy/chrome.it.ts and
// src/copy/tools.it.ts: protein → proteine, carbs → carboidrati, fat →
// grassi, fiber → fibre, sugar → zuccheri, caffeine → caffeina, meal →
// pasto, goal → obiettivo, trend → andamento, timezone → fuso orario, log
// (verb) → registrare, tools → strumenti.

import type { IndexDoc } from "./index.js";

export const INDEX_IT: IndexDoc = {
    title: "Nutrition MCP — Contacalorie e macro per Claude e ChatGPT",
    metaDescription:
        "Registra pasti, calorie e macro parlando con Claude o ChatGPT. Server MCP gratuito e open source con codici a barre, peso ed esportazione completa dei dati.",
    ogDescription:
        "Registra pasti, calorie e macro parlando con Claude o ChatGPT. Server MCP gratuito e open source con codici a barre, peso ed esportazione completa dei dati.",
    keywords:
        "tracker nutrizionale, registro pasti, server MCP, Claude AI, ChatGPT, conta calorie, tracker macro, scanner codice a barre, registrazione pasti, diario alimentare, tracker peso, registro peso, nutrizione IA, Model Context Protocol",

    hero: {
        titleBeforeEm: "Traccia la tua alimentazione ",
        titleEm: "parlando",
        titleAfterEm: " con la tua IA.",
        lead: "Collega Claude o ChatGPT, poi dì semplicemente cosa hai mangiato. Calorie e macro, registrate automaticamente.",
        ctaPrimary: "Installazione rapida",
        ctaSecondary: "Sostienici",
        moreExamples: "Altri esempi",
        chat: {
            photoAlt:
                "Foto: una smoothie bowl con banana, frutti di bosco e granola sopra, e accanto un americano",
            pauseLabel: "Metti in pausa la demo",
            replayLabel: "Riproduci di nuovo la demo",
            exchanges: [
                {
                    photo: true,
                    userText: "colazione + americano",
                    aiText: "Una smoothie bowl, fatta in casa a quanto pare. L'hai già presa in due modi: con granola e miele, o solo con la frutta. Quale delle due è questa?",
                },
                {
                    userText: "granola e miele, un cucchiaio bello pieno",
                    aiText: "Ok. E l'americano: senza niente o con del latte?",
                },
                {
                    userText: "un goccio di latte d'avena",
                    aiText: "Quindi: la bowl con una manciata di granola e 1 cucchiaio di miele, e un americano con un goccio di latte d'avena. Circa 480 kcal e 21 g di proteine. La registro come colazione?",
                },
                {
                    userText: "sì",
                    aiText: "Colazione registrata: 480 kcal, 21 g di proteine e 150 mg di caffeina. Contiene 51 g di zuccheri, 17 g dei quali dal miele.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (yogurt greco, banana, frutti di bosco) con granola (1 manciata) e miele (1 cucchiaio); americano con un goccio di latte d'avena",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "gli avanzi del saltato in padella di ieri sera, stessa porzione. e una bottiglietta d'acqua da 500 ml",
                    aiText: "Pranzo registrato, come ieri sera: 620 kcal e 54 g di proteine, più 500 ml d'acqua.",
                },
                {
                    userText:
                        "ho rubato 6 patatine fritte a mio figlio. non giudicarmi",
                    aiText: "Nessun giudizio. Circa 90 kcal, registrate come spuntino.",
                },
                {
                    userText: "cosa mi resta per cena?",
                    aiText: "810 kcal, e ti mancano ancora 84 g di proteine. Meglio qualcosa di salato: gli zuccheri sono già a 59 dei tuoi 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "e il peso come va?",
                    aiText: "Hai perso 1,4 kg dall'11 feb, circa 0,4 kg a settimana. Mancano 3,8 kg al tuo obiettivo di 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Tre passaggi. Nessuna app da imparare.",
        steps: [
            {
                title: "Connetti una volta",
                body: "Funziona con qualsiasi client IA che supporti i server MCP remoti — Claude, ChatGPT e altri. Nessuna installazione, nessuna chiave API.",
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

    install: {
        title: "Connettiti in meno di un minuto",
        sub: "Funziona con qualsiasi client MCP che supporti OAuth 2.0 con PKCE. Al primo collegamento crei un account con Google oppure con email e password; accedi allo stesso modo per ritrovare i tuoi dati.",
        copyAriaLabel: "Copia l'URL del server",
        tabsLabel: "Scegli il tuo client IA",
        claude: {
            cta: "Aggiungi a Claude",
            steps: [
                "Nella pagina della directory clicca su <strong>Connect</strong>, poi continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
            note: "Funziona con ogni piano Claude, incluso quello gratuito. Per aggiungerlo a mano, usa Customize → Connectors → Add custom connector con https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Apri <strong>ChatGPT sul web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Clicca su <strong>Create app</strong> in fondo al popup. Se non lo vedi, attiva <strong>Developer mode</strong> in <strong>Advanced settings</strong>.",
                "Dagli un nome, ad esempio <strong>Nutrition</strong>.",
                "Alla voce <strong>Connection</strong>, incolla <code>https://nutrition-mcp.com/mcp</code>.",
                "Alla voce <strong>Authentication</strong>, scegli <strong>OAuth</strong> — lascia tutto il resto invariato.",
                'Seleziona <strong>"I understand and want to continue"</strong>.',
                "Clicca su <strong>Create</strong>.",
                "Clicca su <strong>Sign in with Nutrition</strong> — si apre la pagina di accesso; continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
        },
        other: {
            note: "Aggiungi la configurazione qui sopra al tuo client (Cursor, VS Code, Claude Code e altri). Windsurf usa <code>serverUrl</code> invece di <code>url</code>. In Claude Code, esegui <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Il tuo client gestisce automaticamente l'accesso OAuth.",
        },
        otherTabLabel: "Altri client",
    },

    onboarding: {
        title: "Configura una volta sola — o inizia subito a parlare",
        sub: "È del tutto facoltativo — Nutrition MCP funziona non appena ti connetti. Se vuoi, questi tre rapidi passaggi lo rendono più preciso, ma puoi anche passare direttamente alla registrazione.",
        justSay: "Dì semplicemente ",
        steps: [
            {
                title: "Imposta il tuo fuso orario",
                body: "così i giorni cambiano alla tua mezzanotte locale e i totali di oggi restano corretti ovunque tu sia.",
                say: "Imposta il mio fuso orario su New York",
            },
            {
                title: "Imposta i tuoi obiettivi",
                body: "target giornalieri di calorie, macro e acqua, oltre a un peso obiettivo facoltativo e alla tua unità di peso preferita (kg o lb), per monitorare i tuoi progressi.",
                say: "Imposta il mio obiettivo giornaliero a 2000 calorie e 150 g di proteine",
            },
            {
                title: "Imposta la tua lingua",
                body: "la lingua in cui vengono mostrati i widget in chat (dashboard, grafici), non quella in cui l'IA ti risponde.",
                say: "Mostra i miei widget in tedesco",
            },
            {
                title: "Inizia a registrare",
                body: "dì semplicemente cosa hai mangiato, invia una foto o scansiona un codice a barre. Tutto qui.",
                say: "Ho mangiato porridge con frutti di bosco a colazione",
            },
        ],
        note: "Tutto questo è facoltativo. Puoi farlo ora, più tardi o mai — inizia semplicemente a registrare e imposta queste opzioni quando vuoi.",
        toolsCta: {
            heading: "Curioso di scoprire cosa può fare davvero?",
            body: "Sfoglia tutti i 36 strumenti — registrazione, codici a barre, acqua, peso, obiettivi e andamenti — con una descrizione e un esempio di richiesta per ciascuno.",
            arrow: "Esplora gli strumenti",
        },
    },

    examples: {
        title: "Parlaci e basta.",
        sub: "Alcune delle cose che puoi fare — semplicemente parlando.",
        prevLabel: "Esempio precedente",
        nextLabel: "Esempio successivo",
        pickerLabel: "Scegli un esempio",
        carouselLabel: "Esempi",
        threadLabel: "Conversazione",
        moreToolsLabel: "Usa anche",
        toolLinkLabel: "{tool} nella pagina degli strumenti",
        photoMealAlt:
            "Foto: una scodella di borscht con un cucchiaio di panna acida e aneto, e accanto una fetta di pane di segale",
        photoPackageAlt:
            "Foto: il codice a barre su una lattina di Coca-Cola, numero 5449000000996",
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
                        text: "Quanto era grande la scodella, e il porridge l'hai fatto con latte o con acqua? Hai messo qualcosa nel caffè?",
                    },
                    {
                        from: "user",
                        text: "scodella normale, col latte. caffè amaro",
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
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Porridge con latte e mirtilli (1 scodella) e caffè amaro (1 tazza)",
                ],
            },
            {
                id: "photo-meal",
                title: "Fotografa il piatto",
                description:
                    "Una foto apre una conversazione, non un'ipotesi. Chiede se il pasto era fatto in casa o al ristorante, controlla le tue registrazioni passate per ciò che la foto non può mostrare, chiede quanto ne hai mangiato in misure semplici e registra solo quando approvi il riepilogo.",
                toolNotes: {
                    search_meals:
                        "Trova il borscht che hai già preso da Tsybulya e cosa conteneva",
                    log_meal:
                        "Lo registra col nome del ristorante, dopo il tuo sì",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "pranzo",
                    },
                    {
                        from: "ai",
                        text: "Sembra un borscht con panna acida e una fetta di pane di segale. Fatto in casa o al ristorante? Se era un ristorante, quale?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, a Podil, Kiev",
                    },
                    {
                        from: "ai",
                        text: "Hai già registrato il borscht di Tsybulya due volte, sempre la versione di manzo con panna acida. Anche oggi lo stesso? E hai finito la scodella e il pane?",
                    },
                    {
                        from: "user",
                        text: "lo stesso, tutto, anche il pane",
                    },
                    {
                        from: "ai",
                        text: "Quindi: borscht di manzo con panna acida (1 scodella, finita) e pane di segale (1 fetta) da Tsybulya, Podil, Kiev. Circa 520 kcal e 24 g di proteine, stimati, non valori pubblicati. Lo registro come pranzo?",
                    },
                    {
                        from: "user",
                        text: "sì",
                    },
                    {
                        from: "ai",
                        text: "Pranzo registrato: 520 kcal · 24 g di proteine · 43 g di carboidrati · 27 g di grassi · 7 g di fibre · 10 g di zuccheri.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Borscht di manzo con panna acida (1 scodella, finita) e pane di segale (1 fetta) da Tsybulya, Podil, Kiev",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scansiona un codice a barre",
                description:
                    "Fotografa la confezione: le cifre sotto il codice a barre vengono cercate su Open Food Facts, e ti chiede quanto ne hai preso. Open Food Facts non riporta la caffeina, quindi arriva dall'etichetta o da valori tipici; se mancano fibre o zuccheri, vengono stimati invece di restare vuoti.",
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
                    {
                        from: "user",
                        text: "tutta",
                    },
                    {
                        from: "ai",
                        text: "Registrata con il pranzo: 139 kcal, 35 g di zuccheri e 33 mg di caffeina presi dall'etichetta della lattina, perché Open Food Facts non riporta la caffeina. E per rispondere alla tua domanda: quello zucchero da solo supera la metà del tuo limite giornaliero di 60 g, e Open Food Facts le assegna Nutri-Score E e NOVA 4, cioè ultra-processata.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
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
                        text: "Per gli adulti sani EFSA e FDA indicano fino a 400 mg al giorno, circa quattro tazze di caffè filtrato, e in gravidanza l'EFSA consiglia 200 mg. Il limite lo decidi tu: metto 400?",
                    },
                    {
                        from: "user",
                        text: "sì, 400",
                    },
                    {
                        from: "ai",
                        text: "Fatto: 2000 kcal e 160 g di proteine da raggiungere, caffeina sotto i 400 mg. Il resto rimane com'era: 220 g di carboidrati, 70 g di grassi, 30 g di fibre, 2,5 L d'acqua e il tuo limite di 60 g di zuccheri.",
                    },
                    {
                        from: "user",
                        text: "ci sta ancora un dolce stasera?",
                    },
                    {
                        from: "ai",
                        text: "Sei a 1540 kcal e 104 g di proteine, quindi mancano 460 kcal e 56 g di proteine. Il margine più stretto è sugli zuccheri: 40 dei tuoi 60 g di limite, quindi restano 20 g. La caffeina è a 130 su 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
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
                    {
                        from: "user",
                        text: "e gli zuccheri?",
                    },
                    {
                        from: "ai",
                        text: "Sono quelli da tenere d'occhio. Media di 52 g, e hai superato il tuo limite di 60 g in 4 dei 13 giorni.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Traccia il tuo peso",
                description:
                    "Registra una pesata in kg o lb e vedi l'andamento oltre le oscillazioni quotidiane: media livellata, variazione del mese e quanto manca all'obiettivo. Una lettura impossibile, come una virgola dimenticata, viene bloccata prima di salvarla.",
                toolNotes: {
                    log_weight:
                        "Rifiuta 784 kg come non plausibile, poi salva 78,4 kg",
                    get_weight_trends:
                        "Livella 30 giorni in medie mobili e la distanza dall'obiettivo",
                },
                messages: [
                    {
                        from: "user",
                        text: "appena pesato, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg è fuori dall'intervallo plausibile per un peso corporeo (20–500 kg), quindi non ho salvato nulla. Intendevi 78,4 kg?",
                    },
                    {
                        from: "user",
                        text: "ahah sì, ho saltato la virgola. come sto andando?",
                    },
                    {
                        from: "ai",
                        text: "Salvati 78,4 kg. Hai perso 1,8 kg dall'11 feb, circa 0,4 kg a settimana, e la tua media a 7 giorni è di 78,7 kg. Mancano 3,4 kg al tuo obiettivo di 75 kg.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
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
                    {
                        from: "user",
                        text: "e nel weekend?",
                    },
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
                    "L'alcol resta nascosto finché non attivi il tracciamento. Scegli drink standard USA o unità britanniche, e ogni bevanda viene calcolata in grammi di alcol in base a quantità e gradazione. Se poi lo disattivi, l'alcol torna nascosto, ma non viene cancellato.",
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
                    {
                        from: "user",
                        text: "4% credo",
                    },
                    {
                        from: "ai",
                        text: "Registrata con la cena: una pinta da 568 ml al 4% contiene 17,9 g di alcol, 2,3 unità britanniche, circa 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Porta il tuo storico",
                description:
                    "Arrivi da MyFitnessPal, Cronometer, Lose It! o MacroFactor? L'importatore si apre in chat, legge e mappa la tua esportazione nel browser, non salva nulla finché non confermi un'anteprima e non duplica un pasto se reimporti lo stesso file con lo stesso fuso orario. Prima di iniziare ti avvisa se manca il fuso orario.",
                toolNotes: {
                    start_meal_import:
                        "Apre in chat l'importatore per il tuo file esportato",
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
                        text: "L'importatore è aperto qui sotto. Una cosa prima di scegliere il file: il tuo account non ha un fuso orario impostato, quindi gli orari verrebbero letti come UTC. Dove ti trovi?",
                    },
                    {
                        from: "user",
                        text: "Chicago",
                    },
                    {
                        from: "ai",
                        text: "Impostato su America/Chicago. Ora scegli il CSV Nutrition-Summary della tua esportazione di MyFitnessPal. Viene letto direttamente nel tuo browser, e nulla viene salvato finché non confermi l'anteprima.",
                    },
                    {
                        from: "user",
                        text: "ha associato le colonne ma su nome alimento dice «non presente in questo file»?",
                    },
                    {
                        from: "ai",
                        text: "È normale con MyFitnessPal: la sua esportazione ha una riga per ogni pasto di ogni giorno, con i totali ma senza i nomi degli alimenti. Ogni pasto viene invece etichettato con il tipo di pasto, mantenendo intatti calorie e macro.",
                    },
                    {
                        from: "user",
                        text: "603 pasti. dice che verranno inseriti a mezzogiorno?",
                    },
                    {
                        from: "ai",
                        text: "Esatto, l'esportazione ha le date ma non gli orari dei pasti, quindi ognuno viene collocato a mezzogiorno, ora locale. Così ogni pasto resta nel giorno giusto a Chicago; semplicemente non vedrai a che ora hai mangiato davvero.",
                    },
                    {
                        from: "user",
                        text: "fatto! è arrivato tutto?",
                    },
                    {
                        from: "ai",
                        text: "Tutto: 603 pasti importati e nessun errore.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Porta via i tuoi dati",
                description:
                    "Una sola richiesta raccoglie tutto ciò che è conservato su di te — pasti, acqua, pesate, obiettivi, impostazioni del profilo, i dati del tuo account, la telemetria di utilizzo e le app collegate — in uno ZIP di file CSV con un README. Gli orari sono nel tuo fuso orario, e meals.csv si reimporta direttamente.",
                toolNotes: {
                    export_all_data:
                        "Comprime otto file CSV e un README dietro un link valido 60 minuti",
                },
                messages: [
                    {
                        from: "user",
                        text: "la mia dietista vuole vedere il mio diario alimentare. me lo puoi tirare fuori come foglio di calcolo?",
                    },
                    {
                        from: "ai",
                        text: "Ecco qui: uno ZIP con 1204 pasti, 318 registrazioni d'acqua e 64 pesate, più i tuoi obiettivi, le impostazioni del profilo, i dati dell'account, la telemetria di utilizzo degli strumenti e le app collegate. Il tuo diario alimentare è il meals.csv al suo interno, che si apre in Excel o Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "posso semplicemente mandarle il link?",
                    },
                    {
                        from: "ai",
                        text: "Meglio scaricarlo e mandarle il file. Il link smette di funzionare dopo 60 minuti, e chiunque lo abbia può aprire tutta la tua esportazione — peso, dati dell'account e impostazioni compresi, non solo i pasti.",
                    },
                    {
                        from: "user",
                        text: "buono a sapersi. potrei ripristinare da lì più avanti, se servisse?",
                    },
                    {
                        from: "ai",
                        text: "I pasti sì. meals.csv usa gli stessi nomi di colonna dell'importatore, quindi si reimporta direttamente, e i pasti già presenti nel tuo diario vengono riconosciuti e saltati, così niente viene duplicato. Gli altri file servono solo come archivio personale; non si possono reimportare.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Colazione da una parte, cena dall'altra.",
        sub: "Statistiche nutrizionali in tempo reale di tutti gli account Nutrition MCP — calorie, pasti registrati, macro e peso perso — aggiornate ogni cinque secondi.",
        liveLabel: "Live",
        unitGroupLabel: "Unità",
        unitMetricLabel: "Metrico",
        unitImperialLabel: "Imperiale",
        unitKgLabel: "Metrico (kg)",
        unitLbLabel: "Imperiale (lb)",
        refreshBefore: "Si aggiorna ogni 5 s · prossimo tra ",
        refreshAfter: "s",
        sinceOpenLabel: "da quando hai aperto la pagina",
        calCaption: "Calorie registrate",
        cards: {
            foodLogs: "Pasti registrati",
            protein: "Proteine registrate",
            carbs: "Carboidrati registrati",
            fat: "Grassi registrati",
            weightLost: "Peso perso dal 2 luglio 2026",
            water: "Acqua registrata",
        },
        foodLogsUnit: { one: "pasto", other: "pasti" },
        timezonesAfter:
            " fusi orari · i giorni cambiano alla mezzanotte di ciascuno",
        mapNote: "dimensione del punto = quota di profili",
        mapAriaLabel:
            "Mappa del mondo dei fusi orari impostati nei profili, ciascuno mostrato solo quando lo usano almeno tre profili",
        foot: "Totali di tutti gli account, aggiornati man mano che i pasti vengono registrati. I dati individuali non vengono mai mostrati.",
    },

    features: {
        title: "Cosa puoi tracciare",
        cards: [
            {
                title: "Pasti in linguaggio naturale",
                body: "Descrivi cosa hai mangiato — la tua IA stima calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina in milligrammi, e lo registra.",
            },
            {
                title: "Scansiona un codice a barre",
                body: "Fotografa o digita il codice a barre di un prodotto e recupera macro, fibre e zuccheri da Open Food Facts, calcolati in base a quanto ne hai mangiato.",
            },
            {
                title: "Obiettivi e progressi",
                body: "Imposta target giornalieri di calorie, macro, fibre e acqua — oltre a limiti di zuccheri, caffeina e alcol da non superare — e controlla i progressi in tempo reale.",
            },
            {
                title: "Riepiloghi e andamenti",
                body: "Riepiloghi giornalieri e settimanali, andamenti a 7/14/30 giorni, serie di giorni consecutivi e pattern ricorrenti nei pasti.",
            },
            {
                title: "Registrazione dell'acqua",
                body: "Tieni traccia dell'idratazione in millilitri insieme ai tuoi pasti e rivedila giorno per giorno.",
            },
            {
                title: "Monitoraggio del peso",
                body: "Registra il tuo peso corporeo in kg o lb, visualizza gli andamenti a 7/14/30 giorni e monitora i progressi verso un peso obiettivo.",
            },
            {
                title: "Fuso orario intelligente",
                body: "I giorni cambiano al tuo orario locale, ovunque tu sia nel mondo.",
            },
            {
                title: "Importa da un'altra app",
                body: "Porta il tuo storico pasti da MyFitnessPal, Cronometer, Lose It! o MacroFactor — oppure da qualsiasi altro CSV, mappando tu stesso le colonne. Confermi cosa viene aggiunto prima che venga salvato qualsiasi cosa.",
            },
            {
                title: "Esporta e possiedi i tuoi dati",
                body: "Porta via tutto ciò che conserviamo su di te — pasti, acqua, peso, obiettivi e profilo, oltre ai dati del tuo account, alla telemetria di utilizzo e alle app collegate — come un unico ZIP di file CSV. Per ora, i pasti sono l'unica parte che può essere reimportata. Elimina il tuo account e i tuoi dati quando vuoi.",
            },
        ],
    },

    why: {
        title: "Parlare batte il tocco.",
        sub: "Scansiona un codice a barre o dì semplicemente cosa hai mangiato — niente ricerche nei database, nessuna app separata da aprire.",
        oldHeading: "App tradizionali",
        oldItems: [
            "Cerca ogni alimento in un database",
            "Correggi a mano le voci sbagliate del database",
            "L'ennesima app da aprire, spesso a pagamento",
            "Registrazione manuale e noiosa",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Descrivi i pasti con parole tue",
            "Calorie e macro stimate per te",
            "Funziona dentro Claude o ChatGPT, gratis",
            "Chiedi andamenti, riepiloghi e obiettivi",
        ],
        noteHtml:
            'Stai passando da un\'app specifica? Scopri come Nutrition MCP si confronta con <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer e altri tracker</a>.',
    },

    trust: [
        {
            label: "Privato per impostazione predefinita",
            small: "Mai venduti, condivisi o usati per pubblicità.",
        },
        { label: "Open source", small: "Verificalo o ospitalo tu stesso." },
        {
            label: "Esporta quando vuoi",
            small: "Tutto ciò che conserviamo, in CSV in un unico ZIP.",
        },
        { label: "Elimina all'istante", small: "Rimuovi account e dati." },
    ],

    support: {
        title: "Aiutaci a tenerlo attivo.",
        sub: "Nutrition MCP è gratuito e senza pubblicità. Patreon copre le spese di server e database.",
        updatesTitle: "Le ultime novità da Patreon",
        updatesBadge: "Gratis",
        updatesNote: "Gratuito da leggere — nessun abbonamento necessario.",
        updatesPrevLabel: "Aggiornamento precedente",
        updatesNextLabel: "Aggiornamento successivo",
        updatesDotLabel: "Aggiornamento",
        postLinkLabel: "Leggi su Patreon",
        free: {
            tier: "Membro gratuito",
            price: "$0",
            desc: "Resta aggiornato — ricevi notizie e aggiornamenti sul server, i nuovi strumenti e cosa sta arrivando.",
            cta: "Segui su Patreon",
        },
        paid: {
            tier: "Membro sostenitore",
            price: "Paga quanto vuoi",
            desc: "Contribuisci alle spese di hosting e database. È un regalo, non un acquisto — non sblocca nulla, e tutto resta gratuito per tutti.",
            cta: "Diventa un sostenitore",
        },
    },

    cta: {
        title: "Inizia a tracciare in meno di un minuto.",
        sub: "Gratuito e open source — funziona con l'IA che già usi.",
        primary: "Installazione rapida",
        secondary: "Metti una stella su GitHub",
    },

    contact: {
        title: "Domande o feedback?",
        sub: "Hai trovato un bug, vuoi una nuova funzione o hai solo una domanda? Scrivimi direttamente — leggo ogni messaggio.",
        cta: "Invia un'email",
    },

    faqSection: {
        title: "Domande frequenti",
    },
    faq: [
        {
            question: "Cos'è Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP è un server Model Context Protocol (MCP) gratuito e open source che trasforma Claude, ChatGPT o un altro client MCP in un contacalorie e tracker di macro. Invece di cercare in un database di alimenti, dici alla tua IA cosa hai mangiato e lei registra calorie, macro, fibre, zuccheri e caffeina nel tuo diario alimentare.",
        },
        {
            question: "Cos'è il Model Context Protocol (MCP)?",
            visibleHtml:
                "Il Model Context Protocol è uno standard aperto che permette ad assistenti IA come Claude e ChatGPT di collegarsi a strumenti e fonti di dati esterne. Un server MCP fornisce funzionalità specifiche — in questo caso, il tracciamento nutrizionale — che l'IA può usare durante una conversazione. Pensalo come un sistema di plugin per gli assistenti IA.",
        },
        {
            question: "Come contare le calorie con Claude o ChatGPT?",
            visibleHtml:
                "Connetti Nutrition MCP una volta sola — in Claude dalla directory dei connettori, in ChatGPT come app personalizzata con l'URL del server — e accedi. Poi di' alla tua IA cosa hai mangiato con parole tue, mostrale una foto del pasto o dalle il codice a barre di un prodotto. La tua IA stima calorie, proteine, carboidrati, grassi, fibre e zuccheri, e Nutrition MCP salva la voce nel tuo diario alimentare. Chiedi in qualsiasi momento i totali di oggi, gli andamenti settimanali o i progressi verso i tuoi obiettivi.",
        },
        {
            question: "Funziona con ChatGPT?",
            visibleHtml:
                "Sì. In ChatGPT sul web, apri Settings → Apps, crea un'app personalizzata con l'URL del server usando OAuth, e accedi. Per creare un'app personalizzata serve la modalità sviluppatore (Developer mode) di ChatGPT, che OpenAI offre su alcuni piani ChatGPT.",
            jsonLdText:
                "Sì. In ChatGPT sul web, apri Settings → Apps, crea un'app personalizzata con l'URL del server https://nutrition-mcp.com/mcp usando OAuth, e accedi. Per creare un'app personalizzata serve la modalità sviluppatore (Developer mode) di ChatGPT, che OpenAI offre su alcuni piani ChatGPT.",
        },
        {
            question: "Quali altri client sono supportati?",
            visibleHtml:
                "Qualsiasi client MCP che supporti OAuth 2.0 con PKCE — tra cui Claude.ai, le app desktop e mobile di Claude, Claude Code, Cursor, Windsurf e VS Code.",
        },
        {
            question: "Posso ospitarlo io stesso (self-host)?",
            visibleHtml:
                'Sì. Nutrition MCP è open source (licenza MIT). Puoi eseguire una tua istanza con un tuo progetto Supabase — il <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repository GitHub</a> include una guida completa al self-hosting e un Dockerfile.',
        },
        {
            question: "Nutrition MCP è gratuito?",
            visibleHtml:
                "Sì, è completamente gratuito — nessun piano a pagamento, nessuna pubblicità, nessun costo nascosto. Ti servono un'app di IA che supporti i connettori MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei la prima volta che ti connetti. Le donazioni volontarie su Patreon aiutano a coprire i costi del server e non sbloccano nulla.",
        },
        {
            question: "Cosa posso tracciare?",
            visibleHtml:
                "Calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e acqua per ogni voce — descritti con parole tue o recuperati dal codice a barre di un prodotto tramite Open Food Facts. Viene tracciata anche la caffeina, in milligrammi, l'unità usata da ogni etichetta, e non aggiunge calorie. Puoi tracciare anche l'alcol, in grammi di etanolo puro; viene mostrato dopo che attivi il tracciamento dell'alcol. Puoi anche registrare il tuo peso corporeo in kg o lb e monitorare gli andamenti verso un peso obiettivo. Visualizza riepiloghi giornalieri, interroga i pasti per intervallo di date, aggiorna o elimina voci passate, imposta obiettivi e monitora gli andamenti nel tempo.",
        },
        {
            question: "Quanto sono precisi i conteggi delle calorie?",
            visibleHtml:
                "Sono stime. Per un pasto che descrivi o fotografi, i valori li stima la tua IA; per un codice a barre, provengono dai dati dell'etichetta del prodotto su Open Food Facts, che la tua IA ricalcola in base alla quantità che hai consumato. Entrambi possono essere sbagliati, quindi verifica tutto ciò che conta — puoi correggere o eliminare qualsiasi voce semplicemente chiedendolo. Nutrition MCP è uno strumento di registrazione, non un consiglio medico o dietetico: consulta un medico o un dietologo prima di prendere decisioni sulla tua salute, specialmente se sei in gravidanza, hai una condizione medica o una storia di disturbi alimentari.",
        },
        {
            question: "Traccia l'alcol?",
            visibleHtml:
                "Sì, se lo attivi: il tracciamento dell'alcol è disattivato per impostazione predefinita, e l'alcol resta nascosto da pasti, obiettivi e riepiloghi finché non lo attivi. Da quel momento i drink vengono mostrati in grammi di etanolo puro e come drink standard USA o unità britanniche, a tua scelta. Niente viene dedotto automaticamente per te: l'alcol viene memorizzato solo quando registri un drink o importi un file con una colonna alcol, e un drink che registri viene salvato anche mentre il tracciamento è disattivato. Se lo disattivi di nuovo, l'alcol torna nascosto e l'importatore smette di leggere le colonne dell'alcol — non è un interruttore di eliminazione, e la tua esportazione include sempre ciò che hai registrato. Per rimuovere un valore di alcol, elimina il pasto a cui appartiene.",
        },
        {
            question:
                "Posso importare il mio storico da MyFitnessPal o un'altra app?",
            visibleHtml:
                "Sì. Chiedi di importare il tuo storico e si apre un importatore nella chat: scegli il CSV esportato dalla tua vecchia app, controlli come vengono mappate le colonne e vedi cosa verrà aggiunto prima di confermare. Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute automaticamente, mentre qualsiasi altro CSV funziona mappando tu stesso le colonne. Il file viene letto dal tuo browser, quindi l'IA non riscrive mai le tue righe. Nei client senza pannelli in chat puoi invece incollare la tua esportazione — e importare di nuovo lo stesso file non crea duplicati, purché nel frattempo il tuo fuso orario non sia cambiato.",
        },
        {
            question: "I miei dati sono privati?",
            visibleHtml:
                'I dati che registri sono conservati nell\'UE e collegati al tuo account, a cui accedi tramite le app di IA che connetti. Nutrition MCP non vende mai i tuoi dati, non li condivide mai con terze parti e non li usa mai per pubblicità; la home page mostra solo totali anonimi dell\'intero sito. Ciò che la tua IA legge tramite gli strumenti viene inviato al fornitore di quella IA, in base al tuo accordo con quel fornitore. Puoi esportare tutto ciò che conserviamo su di te, o eliminare il tuo account e tutti i suoi dati, in qualsiasi momento — i dettagli sono nell\'<a href="/privacy" data-link="privacy">informativa sulla privacy</a>.',
        },
    ],
};

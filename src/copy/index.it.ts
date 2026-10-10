// Italian (it) translation of the landing page copy. See src/copy/index.ts
// for the full field-by-field documentation of this shape; this file
// mirrors its structure exactly. The trusted-HTML fields (install steps and
// notes, why.noteHtml, faq[].visibleHtml) keep every <strong>/<code>/<a> tag
// of the English source; every other field is plain text. The demo
// conversations are structured: `photo`, `card`, `meal.type`, `from`,
// `link`, `cards` and the `toolNotes` keys are copied verbatim from the
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
        "tracker nutrizionale, registro pasti, server MCP, Claude AI, ChatGPT, conta calorie, contacalorie AI, app calorie, tracker macro, scanner codice a barre, registrazione pasti, diario alimentare, tracker peso, registro peso, nutrizione IA, Model Context Protocol",

    hero: {
        titleBeforeEm: "Tieni traccia di ciò che mangi ",
        titleEm: "parlando",
        titleAfterEm: " con la tua IA.",
        lead: "Collega Claude o ChatGPT, poi di' semplicemente cosa hai mangiato. Calorie e macro si registrano da sole.",
        ctaPrimary: "Installazione rapida",
        ctaSecondary: "Sostienici",
        moreExamples: "Altri esempi",
        chat: {
            photoAlt:
                "Foto: una smoothie bowl con banana, frutti di bosco e granola sopra, e accanto un americano",
            pauseLabel: "Metti in pausa la demo",
            replayLabel: "Riavvia la demo",
            exchanges: [
                {
                    photo: true,
                    userText: "colazione + americano",
                    aiText: "Una smoothie bowl, fatta in casa a quanto pare. L'hai già mangiata in due versioni: con granola e miele, oppure solo con la frutta. Questa qual è?",
                },
                {
                    userText: "granola e miele, un cucchiaio bello pieno",
                    aiText: "Ok. E l'americano era singolo o doppio? Con un po' di latte?",
                },
                {
                    userText: "doppio, un goccio di latte d'avena",
                    aiText: "Quindi: la bowl con una manciata di granola e 1 cucchiaio di miele, e un americano doppio con un goccio di latte d'avena. Circa 480 kcal e 21 g di proteine. Lo registro?",
                },
                {
                    userText: "sì",
                    aiText: "Colazione registrata: 480 kcal, 21 g di proteine e 126 mg di caffeina. Gli zuccheri aggiunti sono a 20 g sui 25 g del tuo limite, soprattutto per il miele; il resto dei 51 g di zuccheri totali viene da frutta e yogurt.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 scodella: yogurt greco, banana, frutti di bosco) con granola (1 manciata) e miele (1 cucchiaio); americano doppio con un goccio di latte d'avena",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "pranzo: gli avanzi del saltato al wok di ieri sera, stessa porzione. e una bottiglietta d'acqua da 500 ml",
                    aiText: "Pranzo registrato, come ieri sera: 620 kcal e 54 g di proteine, più 500 ml d'acqua.",
                    meal: {
                        description:
                            "Avanzi di saltato al wok (1 porzione, come ieri sera)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "spuntino: ho rubato 6 patatine fritte a mio figlio. non giudicarmi",
                    aiText: "Nessun giudizio. Circa 50 kcal, le ho registrate come spuntino.",
                    meal: {
                        description:
                            "Patatine fritte (6, dal piatto di mio figlio)",
                        type: "snack",
                    },
                },
                {
                    userText: "cosa mi resta per cena?",
                    aiText: "Ti restano 850 kcal e 84 g di proteine. Gli zuccheri aggiunti sono a 23 g sui 25 g del tuo limite, e la maggior parte dei 59 g di zuccheri totali di oggi viene dalla frutta.",
                    card: "nutrition-summary",
                },
                {
                    userText: "e il peso come va?",
                    aiText: "Hai perso 1,4 kg dall'11 feb, da 80,2 a 78,8 kg. Mancano 3,8 kg al tuo obiettivo di 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Tre passaggi. Nessuna app da imparare.",
        steps: [
            {
                title: "Collega una volta sola",
                body: "Funziona con qualsiasi client IA che supporti i server MCP remoti: Claude, ChatGPT e altri. Niente da installare, nessuna chiave API.",
            },
            {
                title: "Di' semplicemente cosa hai mangiato",
                body: "Descrivilo a parole tue, oppure invia una foto del piatto, uno screenshot di un'app di consegne a domicilio o un codice a barre (il prodotto viene cercato online). Le macro si registrano da sole.",
            },
            {
                title: "Monitora e rivedi",
                body: "Chiedi riepiloghi giornalieri, andamenti settimanali, progressi verso gli obiettivi, oppure esporta tutto ciò che hai registrato in file CSV. Tutto gratis.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "Collegalo in meno di un minuto",
        sub: "Funziona con qualsiasi client MCP che supporti OAuth 2.0 con PKCE. Al primo collegamento crei un account con Google oppure con email e password; per ritrovare i tuoi dati, accedi sempre allo stesso modo.",
        copyAriaLabel: "Copia l'URL del server",
        tabsLabel: "Scegli il tuo client IA",
        claude: {
            cta: "Aggiungi a Claude",
            steps: [
                "Nella pagina della directory clicca su <strong>Connect</strong>, poi continua con Google oppure accedi con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
            note: "Funziona con tutti i piani Claude, anche quello gratuito. Se preferisci aggiungerlo a mano, vai su Customize → Connectors → Add custom connector e inserisci https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Apri <strong>ChatGPT sul web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Clicca su <strong>Create app</strong> in fondo al popup. Se non lo vedi, attiva <strong>Developer mode</strong> in <strong>Advanced settings</strong>.",
                "Dagli un nome, ad esempio <strong>Nutrition</strong>.",
                "Alla voce <strong>Connection</strong>, incolla <code>https://nutrition-mcp.com/mcp</code>.",
                "Alla voce <strong>Authentication</strong>, scegli <strong>OAuth</strong> e lascia tutto il resto com'è.",
                'Spunta <strong>"I understand and want to continue"</strong>.',
                "Clicca su <strong>Create</strong>.",
                "Clicca su <strong>Sign in with Nutrition</strong>: si apre la pagina di accesso, dove puoi continuare con Google oppure accedere con email e password.",
                "Fatto. Funziona subito e compare automaticamente anche nelle tue app iOS e Android.",
            ],
        },
        other: {
            note: "Aggiungi la configurazione qui sopra al tuo client (Cursor, VS Code, Claude Code e altri). Windsurf usa <code>serverUrl</code> invece di <code>url</code>. In Claude Code, esegui <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Il tuo client gestisce l'accesso OAuth in automatico.",
        },
        otherTabLabel: "Altri client",
    },

    onboarding: {
        title: "Configura una volta sola, o inizia subito a parlare",
        sub: "Non è obbligatorio: Nutrition MCP funziona appena lo colleghi. Se vuoi, questi tre rapidi passaggi lo rendono più preciso, ma puoi anche passare subito alla registrazione.",
        justSay: "Basta dire ",
        steps: [
            {
                title: "Imposta il tuo fuso orario",
                body: "così il giorno cambia alla tua mezzanotte locale e i totali di oggi restano corretti ovunque tu sia.",
                say: "Imposta il mio fuso orario su New York",
            },
            {
                title: "Imposta i tuoi obiettivi",
                body: "obiettivi giornalieri di calorie, macro e acqua, più un peso obiettivo facoltativo e l'unità di peso che preferisci (kg o lb), per seguire i tuoi progressi.",
                say: "Imposta il mio obiettivo giornaliero a 2000 calorie e 150 g di proteine",
            },
            {
                title: "Imposta la tua lingua",
                body: "la lingua dei widget in chat (dashboard, grafici), non quella in cui ti risponde l'IA.",
                say: "Mostra i miei widget in tedesco",
            },
            {
                title: "Inizia a registrare",
                body: "basta dire cosa hai mangiato, inviare una foto o scansionare un codice a barre. Tutto qui.",
                say: "A colazione ho mangiato porridge con frutti di bosco",
            },
        ],
        note: "È tutto facoltativo. Puoi farlo ora, più tardi o mai: inizia pure a registrare e imposta queste opzioni quando vuoi.",
        toolsCta: {
            heading: "Vuoi sapere cosa sa fare davvero?",
            body: "Sfoglia tutti i 46 strumenti (registrazione, codici a barre, acqua, peso e misure corporee, obiettivi e andamenti), ciascuno con una descrizione e una richiesta di esempio.",
            arrow: "Esplora gli strumenti",
        },
    },

    examples: {
        title: "Ti basta parlare.",
        sub: "Alcune delle cose che puoi fare, semplicemente parlando.",
        prevLabel: "Esempio precedente",
        nextLabel: "Esempio successivo",
        pickerLabel: "Scegli un esempio",
        carouselLabel: "Esempi",
        carouselRoleDescription: "carosello",
        threadLabel: "Conversazione",
        moreToolsLabel: "Usa anche",
        toolLinkLabel:
            "{tool} nella pagina degli strumenti (si apre in una nuova scheda)",
        photoMealAlt:
            "Foto: una scodella di borscht con un cucchiaio di panna acida e aneto, e accanto una fetta di pane di segale",
        photoPackageAlt:
            "Foto: il codice a barre su un vasetto di yogurt greco bianco, numero 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "Registra a parole tue",
                description:
                    "Dillo come lo racconteresti a un amico. Se manca la porzione o non è chiaro di quale pasto si tratta, te lo chiede prima di stimare. Fibre, zuccheri e zuccheri aggiunti finiscono in ogni voce, la caffeina in tutto ciò che ne contiene, e “verso le 7” diventa le 07:00 nel tuo fuso orario.",
                toolNotes: {
                    log_meal:
                        "Salva la colazione con macro, fibre, zuccheri, zuccheri aggiunti e la caffeina del caffè",
                    log_water:
                        "Aggiunge i 500 ml delle 07:00 al totale d'acqua di oggi",
                    get_current_time:
                        "Ricava la data di oggi perché “verso le 7” diventi le 07:00",
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
                        text: "Colazione registrata: circa 320 kcal, 11 g di proteine e 6 g di fibre. Con il caffè sei a 95 mg sui 400 mg del tuo limite di caffeina.",
                    },
                    {
                        from: "user",
                        text: "ah, e verso le 7 ho bevuto tipo mezzo litro d'acqua, prima di correre",
                    },
                    {
                        from: "ai",
                        text: "Aggiunti 500 ml d'acqua alle 07:00 di stamattina.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
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
                    "Una foto è l'inizio di una conversazione, non una stima alla cieca. Ti chiede se il pasto era fatto in casa o al ristorante, cerca nelle tue registrazioni passate ciò che la foto non mostra, ti chiede quanto ne hai mangiato con misure semplici e registra solo dopo che hai approvato il riepilogo.",
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
                        text: "Sembra un borscht con panna acida e una fetta di pane di segale. Fatto in casa o al ristorante? Se al ristorante, quale?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, a Podil, Kiev",
                    },
                    {
                        from: "ai",
                        text: "Hai già registrato il borscht di Tsybulya due volte, sempre di manzo con panna acida e una fetta di pane di segale, circa 520 kcal. Anche oggi lo stesso? E hai finito la scodella e il pane?",
                    },
                    {
                        from: "user",
                        text: "lo stesso, finito tutto, anche il pane",
                    },
                    {
                        from: "ai",
                        text: "Quindi: borscht di manzo con panna acida (1 scodella, finita) e pane di segale (1 fetta) da Tsybulya, Podil, Kiev. Come l'ultima volta: circa 520 kcal e 24 g di proteine, valori stimati e non dati ufficiali. Lo registro?",
                    },
                    {
                        from: "user",
                        text: "sì",
                    },
                    {
                        from: "ai",
                        text: "Registrato. Sono 520 delle tue 2000 kcal di oggi, ne restano 1480.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
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
                    "Fotografa la confezione: le cifre sotto il codice a barre vengono cercate su Open Food Facts, poi ti chiede quanto ne hai consumato. Gli zuccheri aggiunti vengono letti quando Open Food Facts li riporta. Open Food Facts non riporta la caffeina, quindi quella si ricava dall'etichetta o da valori tipici; se mancano fibre, zuccheri o zuccheri aggiunti, vengono stimati invece di restare vuoti.",
                toolNotes: {
                    lookup_barcode:
                        "Recupera da Open Food Facts i valori in etichetta e il Nutri-Score del vasetto",
                    log_meal:
                        "Registra il vasetto intero a colazione, calcolato dai valori per 100 g",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "l'ho mangiato a colazione. va bene?",
                    },
                    {
                        from: "ai",
                        text: "È un vasetto da 150 g di yogurt greco bianco (0% di grassi): 87 kcal, 15 g di proteine e 5 g di zuccheri, nessuno aggiunto, e Open Food Facts gli dà Nutri-Score A. Hai mangiato tutto il vasetto?",
                    },
                    {
                        from: "user",
                        text: "tutto il vasetto",
                    },
                    {
                        from: "ai",
                        text: "Registrato a colazione: 87 kcal, 15 g di proteine e 5 g di zuccheri. Ti mancano ancora 145 g di proteine per oggi.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Yogurt greco bianco 0% (vasetto da 150 g)"],
            },
            {
                id: "goals-progress",
                title: "Fissa obiettivi, fai il punto",
                description:
                    "Imposta obiettivi da raggiungere, come calorie e proteine, e limiti da non superare per zuccheri aggiunti, zuccheri totali, alcol e caffeina; cambia solo ciò che nomini. Poi chiedi di un giorno qualsiasi per vedere quanto ti manca per ogni obiettivo e a che punto sei con ogni limite.",
                toolNotes: {
                    set_nutrition_goals:
                        "Salva gli obiettivi di calorie e proteine e un limite di caffeina di 400 mg",
                    get_goal_progress:
                        "Mostra in un widget in chat la giornata di oggi rispetto a ogni obiettivo e limite",
                },
                messages: [
                    {
                        from: "user",
                        text: "voglio asciugarmi un po'. impostami 2000 kcal e 160 g di proteine. e qual è un limite di caffeina sensato? praticamente vivo di caffè",
                    },
                    {
                        from: "ai",
                        text: "Per gli adulti sani l'EFSA e la FDA indicano fino a 400 mg al giorno, circa quattro tazze di caffè filtrato, e in gravidanza l'EFSA consiglia 200 mg. Il limite lo decidi tu: metto 400?",
                    },
                    {
                        from: "user",
                        text: "sì, 400",
                    },
                    {
                        from: "ai",
                        text: "Fatto: 2000 kcal e 160 g di proteine da raggiungere, caffeina sotto i 400 mg. Il resto rimane com'era: 220 g di carboidrati, 70 g di grassi, 30 g di fibre, 2,5 L d'acqua, il tuo limite di 25 g di zuccheri aggiunti e il tuo peso obiettivo di 75 kg.",
                    },
                    {
                        from: "user",
                        text: "ci sta ancora un dolce stasera?",
                    },
                    {
                        from: "ai",
                        text: "Sei a 1540 kcal su 2000 e a 104 g di proteine su 160, quindi ti mancano 460 kcal e 56 g di proteine. Gli zuccheri aggiunti sono a 16 g sui 25 g del tuo limite e la caffeina a 130 mg su 400: entrambi sotto il limite.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Rivedi la settimana",
                description:
                    "Chiedi com'è andata la settimana e in chat si apre il widget degli andamenti, con la media di calorie e macro rispetto ai tuoi obiettivi e quanti giorni hai registrato. Passa tra 7, 14 e 30 giorni senza una nuova richiesta. Può dirti anche le tue serie di giorni consecutivi e i giorni in linea con l'obiettivo.",
                toolNotes: {
                    get_trends:
                        "Calcola le medie degli ultimi 7, 14 e 30 giorni e apre il widget degli andamenti",
                },
                messages: [
                    {
                        from: "user",
                        text: "come sono andate le ultime due settimane? ho l'impressione di aver fatto un po' a caso",
                    },
                    {
                        from: "ai",
                        text: "Hai registrato 13 giorni su 14, gli ultimi 10 di fila, e 9 di questi sono rimasti entro il 10% del tuo obiettivo di 2000 kcal. In media sei a 1830 kcal al giorno, ma il conto include come zero il giorno che hai saltato.",
                    },
                    {
                        from: "user",
                        text: "e gli zuccheri?",
                    },
                    {
                        from: "ai",
                        text: "Gli zuccheri aggiunti sono stati in media 22 g al giorno, sotto il tuo limite di 25 g, ma l'hai superato in 5 giorni su 13. Gli zuccheri totali sono stati in media 52 g, soprattutto da frutta e latte.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Tieni d'occhio peso e misure",
                description:
                    "Registra una pesata in kg o lb e guarda l'andamento al di là delle oscillazioni quotidiane: media smussata, variazione nel mese e quanto manca all'obiettivo. Accanto al peso puoi registrare, in cm o pollici, le misure prese con il metro in nove zone del corpo, dalla vita al polpaccio. Un valore impossibile, come una virgola dimenticata, viene bloccato prima di essere salvato.",
                toolNotes: {
                    log_weight: "Salva la pesata di stamattina: 78,4 kg",
                    get_weight_trends:
                        "Smussa le oscillazioni quotidiane in un peso di tendenza e un ritmo settimanale e calcola la distanza dall'obiettivo",
                    log_body_measurement:
                        "Salva la misura del giro vita: 84 cm",
                    get_body_measurements:
                        "Trova l'ultima misura del giro vita da confrontare",
                },
                messages: [
                    {
                        from: "user",
                        text: "stamattina 78,4 kg. come sto andando?",
                    },
                    {
                        from: "ai",
                        text: "Salvati 78,4 kg. Hai perso 1,8 kg dall'11 febbraio (eri a 80,2 kg) e la tua media a 7 giorni è di 78,7 kg. Mancano 3,4 kg al tuo obiettivo di 75 kg.",
                    },
                    {
                        from: "user",
                        text: "anche il giro vita: 84 cm. rispetto a prima?",
                    },
                    {
                        from: "ai",
                        text: "Salvato il giro vita a 84 cm. L'ultima misura era 86,5 cm il 14 febbraio, quindi 2,5 cm in meno.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Scopri le tue abitudini",
                description:
                    "Chiedi quando mangi di più e mette a confronto le tue registrazioni: giorni feriali e weekend, giorni con e senza colazione, pranzi abbondanti, cene presto e cene tardi. Segnala anche i giorni insoliti e riporta abitudini, non cause.",
                toolNotes: {
                    get_meal_patterns:
                        "Confronta su 30 giorni colazione sì o no, orario di cena e weekend",
                },
                messages: [
                    {
                        from: "user",
                        text: "mangio di più nei giorni in cui salto la colazione? ho questa sensazione",
                    },
                    {
                        from: "ai",
                        text: "Un po', sì. Hai registrato 28 degli ultimi 30 giorni e hai saltato la colazione in 6. In quei giorni la media è di 2215 kcal e 88 g di proteine, contro 1940 kcal e 123 g nei 22 giorni con colazione.",
                    },
                    {
                        from: "user",
                        text: "e le cene tardi? nei giorni di palestra non mangio prima delle 9 di sera",
                    },
                    {
                        from: "ai",
                        text: "Si notano anche quelle: i 9 giorni con cena alle 20 o più tardi hanno una media di 2165 kcal, contro 1920 negli altri 19. Sono abitudini che emergono dalle tue registrazioni, non la prova che una delle due ne sia la causa.",
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
                title: "Registra anche i drink",
                description:
                    "L'alcol resta nascosto finché non attivi il monitoraggio. Scegli drink standard USA o unità alcoliche britanniche, e ogni bevanda viene convertita in grammi di alcol in base a quantità e gradazione. Se poi lo disattivi, l'alcol torna nascosto, ma non viene cancellato.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Attiva il monitoraggio dell'alcol, in grammi accanto alle unità britanniche",
                    log_meal:
                        "Registra la pinta con il suo alcol in grammi di etanolo (568 ml × 4% × 0,789)",
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
                        text: "Monitoraggio dell'alcol attivo, in grammi accanto alle unità britanniche.",
                    },
                    {
                        from: "user",
                        text: "ho bevuto una pinta di lager a cena",
                    },
                    {
                        from: "ai",
                        text: "Che gradazione aveva? Le lager di solito stanno tra il 4 e il 5%, e la trovi indicata sulla spina o sulla lattina.",
                    },
                    {
                        from: "user",
                        text: "4% credo",
                    },
                    {
                        from: "ai",
                        text: "Registrata come cena: una pinta da 568 ml al 4% contiene 17,9 g di alcol, pari a 2,3 unità britanniche, circa 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Porta qui il tuo storico",
                description:
                    "Arrivi da MyFitnessPal, Cronometer, Lose It! o MacroFactor? L'importatore si apre in chat, legge la tua esportazione e ne abbina le colonne nel browser, non salva nulla finché non confermi l'anteprima e non duplica i pasti se reimporti lo stesso file con lo stesso fuso orario. Se il fuso orario non è impostato, si sistema prima quello, così ogni pasto finisce nel giorno giusto.",
                toolNotes: {
                    get_profile:
                        "Mostra che l'account non ha ancora un fuso orario impostato",
                    set_timezone:
                        "Imposta America/Chicago così i pasti usano l'ora locale",
                    start_meal_import:
                        "Apre in chat l'importatore per il tuo file esportato",
                    bulk_import_meals:
                        "Salva le righe confermate in blocchi da massimo 50, saltando quelle già importate",
                },
                messages: [
                    {
                        from: "user",
                        text: "sto passando da MyFitnessPal. puoi portare qui il mio diario alimentare? ho già l'esportazione",
                    },
                    {
                        from: "ai",
                        text: "Prima di aprire l'importatore: il tuo account non ha un fuso orario impostato, quindi le date della tua esportazione verrebbero lette in UTC e i pasti potrebbero finire nel giorno sbagliato. Vuoi impostarlo prima? In che fuso orario ti trovi?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Fuso orario impostato su America/Chicago, e l'importatore è aperto qui sopra: scegli lì il file esportato da MyFitnessPal. Viene letto direttamente nel browser, e non si salva nulla finché non confermi l'anteprima.",
                    },
                    {
                        from: "user",
                        text: "ha abbinato le colonne ma su nome alimento dice “non presente in questo file”?",
                    },
                    {
                        from: "ai",
                        text: "È normale con MyFitnessPal: la sua esportazione ha una riga per ogni pasto di ogni giorno, con i totali ma senza i nomi degli alimenti. Le righe senza nome dell'alimento vengono etichettate con l'app da cui provengono, e calorie e macro arrivano così come sono.",
                    },
                    {
                        from: "user",
                        text: "603 pasti. dice che verranno inseriti a mezzogiorno?",
                    },
                    {
                        from: "ai",
                        text: "Esatto: l'esportazione ha le date ma non gli orari dei pasti, quindi ognuno viene messo a mezzogiorno, ora locale. Così ogni pasto resta nel giorno giusto a Chicago; solo che non vedrai a che ora hai mangiato davvero.",
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
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Porta via i tuoi dati",
                description:
                    "Con una sola richiesta raccoglie tutto ciò che è conservato su di te (pasti, pasti salvati e i loro ingredienti, acqua, pesate, misure corporee, obiettivi, impostazioni del profilo, dati dell'account, telemetria di utilizzo e app collegate) in uno ZIP di file CSV con un README. Gli orari sono nel tuo fuso orario, e meals.csv si reimporta direttamente.",
                toolNotes: {
                    export_all_data:
                        "Crea uno ZIP con tutti i file CSV e un README, scaricabile da un link valido 60 minuti",
                },
                messages: [
                    {
                        from: "user",
                        text: "la mia dietista vuole vedere il mio diario alimentare. me lo puoi esportare in un foglio di calcolo?",
                    },
                    {
                        from: "ai",
                        text: "Fatto. Lo ZIP contiene 1204 pasti, 318 voci d'acqua e 64 pesate, più i tuoi obiettivi nutrizionali, le impostazioni del profilo, i dati dell'account, la telemetria di utilizzo degli strumenti e le app collegate. Il tuo diario alimentare è il file meals.csv al suo interno.",
                        link: "Scarica l'esportazione (link valido 60 minuti)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Da qualche parte è colazione, altrove è già cena.",
        sub: "Statistiche nutrizionali in tempo reale da tutti gli account Nutrition MCP (calorie, pasti registrati, macro e peso perso), aggiornate ogni cinque secondi.",
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
            " fusi orari · ognuno cambia giorno alla propria mezzanotte",
        mapNote: "dimensione del punto = quota di profili",
        mapAriaLabel:
            "Mappa del mondo con i fusi orari impostati nei profili; ognuno compare solo quando lo usano almeno tre profili",
        foot: "Totali di tutti gli account, aggiornati man mano che si registrano pasti. I dati dei singoli utenti non vengono mai mostrati.",
    },

    features: {
        title: "Cosa puoi monitorare",
        cards: [
            {
                title: "Pasti a parole tue",
                body: "Descrivi cosa hai mangiato: la tua IA stima calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, zuccheri aggiunti e caffeina in milligrammi, e registra tutto.",
            },
            {
                title: "Scansiona un codice a barre",
                body: "Fotografa o digita il codice a barre di un prodotto e ottieni macro, fibre e zuccheri da Open Food Facts (anche gli zuccheri aggiunti, quando sono indicati), calcolati in base a quanto ne hai mangiato.",
            },
            {
                title: "Obiettivi e progressi",
                body: "Imposta obiettivi giornalieri di calorie, macro, fibre e acqua, più limiti da non superare per zuccheri aggiunti, zuccheri totali, caffeina e alcol, e segui i progressi in tempo reale.",
            },
            {
                title: "Riepiloghi e andamenti",
                body: "Riepiloghi giornalieri e settimanali, andamenti a 7/14/30 giorni, serie di giorni consecutivi e abitudini alimentari ricorrenti.",
            },
            {
                title: "Registrazione dell'acqua",
                body: "Tieni traccia dell'idratazione in millilitri insieme ai pasti e rivedila giorno per giorno.",
            },
            {
                title: "Monitoraggio del peso",
                body: "Registra il tuo peso corporeo in kg o lb, visualizza il peso di tendenza smussato e il ritmo settimanale su tutto il tuo storico e segui i progressi verso un peso obiettivo. Accanto al peso puoi registrare, in cm o pollici, le misure prese con il metro in nove zone del corpo, dalla vita al polpaccio.",
            },
            {
                title: "Fuso orario intelligente",
                body: "Il giorno cambia secondo la tua ora locale, ovunque tu sia nel mondo.",
            },
            {
                title: "Importa da un'altra app",
                body: "Porta qui il tuo storico pasti da MyFitnessPal, Cronometer, Lose It! o MacroFactor, oppure da qualsiasi altro CSV abbinando tu le colonne. Prima che venga salvato qualcosa, confermi cosa verrà aggiunto.",
            },
            {
                title: "Esporta i tuoi dati: restano tuoi",
                body: "Porta via tutto ciò che conserviamo su di te (pasti, pasti salvati con i loro ingredienti, acqua, peso, misure corporee, obiettivi e profilo, oltre ai dati dell'account, alla telemetria di utilizzo e alle app collegate) in un unico ZIP di file CSV. Per ora i pasti sono l'unica parte che si può reimportare. Puoi eliminare account e dati quando vuoi.",
            },
        ],
    },

    why: {
        title: "Meglio parlare che digitare.",
        sub: "Scansiona un codice a barre o di' semplicemente cosa hai mangiato: niente ricerche nei database, nessuna app in più da aprire.",
        oldHeading: "App tradizionali",
        oldItems: [
            "Cerca ogni alimento in un database",
            "Correggi a mano le voci sbagliate del database",
            "L'ennesima app da aprire, spesso a pagamento",
            "Registrazione manuale e noiosa",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Descrivi i pasti a parole tue",
            "Calorie e macro stimate per te",
            "Funziona dentro Claude o ChatGPT, gratis",
            "Chiedi andamenti, riepiloghi e obiettivi",
        ],
        noteHtml:
            'Arrivi da un\'app in particolare? Scopri come Nutrition MCP si confronta con <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer e altri contacalorie</a>.',
    },

    trust: [
        {
            label: "Privacy di serie",
            small: "I tuoi dati non vengono mai venduti, condivisi o usati per la pubblicità.",
        },
        { label: "Open source", small: "Verificalo o ospitalo tu stesso." },
        {
            label: "Esporta quando vuoi",
            small: "Tutto ciò che conserviamo, in CSV dentro un unico ZIP.",
        },
        { label: "Elimina all'istante", small: "Rimuovi account e dati." },
    ],

    support: {
        title: "Aiutaci a tenerlo in vita.",
        sub: "Nutrition MCP è gratuito e senza pubblicità. Patreon copre i costi di server e database.",
        updatesTitle: "Le ultime da Patreon",
        updatesBadge: "Gratis",
        updatesNote: "Si legge gratis, senza abbonamento.",
        updatesPrevLabel: "Aggiornamento precedente",
        updatesNextLabel: "Aggiornamento successivo",
        updatesDotLabel: "Aggiornamento",
        postLinkLabel: "Leggi su Patreon",
        free: {
            tier: "Membro gratuito",
            price: "$0",
            desc: "Resta aggiornato: novità sul server, sui nuovi strumenti e su ciò che sta per arrivare.",
            cta: "Segui su Patreon",
        },
        paid: {
            tier: "Membro sostenitore",
            price: "Paga quanto vuoi",
            desc: "Se Nutrition MCP ti è utile, puoi aiutare a coprire i costi di hosting e database. Tutti hanno accesso alle stesse funzioni, sostenitori compresi, e resta gratuito per tutti.",
            cta: "Diventa un sostenitore",
        },
    },

    cta: {
        title: "Inizia a registrare i pasti in meno di un minuto.",
        sub: "Gratuito e open source, funziona con l'IA che usi già.",
        primary: "Installazione rapida",
        secondary: "Metti una stella su GitHub",
    },

    contact: {
        title: "Domande o feedback?",
        sub: "Hai trovato un bug, vorresti una nuova funzione o hai solo una domanda? Scrivimi direttamente: leggo ogni messaggio.",
        cta: "Invia un'email",
    },

    faqSection: {
        title: "Domande frequenti",
    },
    faq: [
        {
            question: "Cos'è Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP è un server Model Context Protocol (MCP) gratuito e open source che trasforma Claude, ChatGPT o un altro client MCP in un contacalorie e tracker delle macro. Invece di cercare in un database di alimenti, dici alla tua IA cosa hai mangiato e lei registra calorie, macro, fibre, zuccheri, zuccheri aggiunti e caffeina nel tuo diario alimentare.",
        },
        {
            question: "Cos'è il Model Context Protocol (MCP)?",
            visibleHtml:
                "Il Model Context Protocol è uno standard aperto che permette ad assistenti IA come Claude e ChatGPT di collegarsi a strumenti e fonti di dati esterne. Un server MCP offre funzionalità specifiche (in questo caso, il monitoraggio dell'alimentazione) che l'IA può usare durante una conversazione. Immaginalo come un sistema di plugin per gli assistenti IA.",
        },
        {
            question: "Come si contano le calorie con Claude o ChatGPT?",
            visibleHtml:
                "Collega Nutrition MCP una volta sola (in Claude dalla directory dei connettori, in ChatGPT come app personalizzata con l'URL del server) e accedi. Poi di' alla tua IA cosa hai mangiato a parole tue, mostrale una foto del pasto o dalle il codice a barre di un prodotto. La tua IA stima calorie, proteine, carboidrati, grassi, fibre, zuccheri e zuccheri aggiunti, e Nutrition MCP salva la voce nel tuo diario alimentare. Chiedi in qualsiasi momento i totali di oggi, gli andamenti settimanali o i progressi verso i tuoi obiettivi.",
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
                "Qualsiasi client MCP che supporti OAuth 2.0 con PKCE, tra cui Claude.ai, le app desktop e mobile di Claude, Claude Code, Cursor, Windsurf e VS Code.",
        },
        {
            question: "Posso ospitarlo io stesso (self-hosting)?",
            visibleHtml:
                'Sì. Nutrition MCP è open source (licenza MIT). Puoi far girare una tua istanza con un tuo progetto Supabase: il <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repository GitHub</a> include una guida completa al self-hosting e un Dockerfile.',
        },
        {
            question: "Nutrition MCP è gratuito?",
            visibleHtml:
                "Sì, è completamente gratuito: niente piani a pagamento, niente pubblicità, nessun costo nascosto. Ti servono un'app di IA che supporti i connettori MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei la prima volta che ti colleghi. Le donazioni volontarie su Patreon aiutano a coprire i costi del server e non sbloccano nulla.",
        },
        {
            question: "Cosa posso monitorare?",
            visibleHtml:
                "Calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, zuccheri aggiunti e acqua per ogni voce, descritti a parole tue o ricavati dal codice a barre di un prodotto tramite Open Food Facts. Viene registrata anche la caffeina, in milligrammi, l'unità usata su tutte le etichette, e non aggiunge calorie. Puoi monitorare anche l'alcol, in grammi di etanolo puro; compare dopo che attivi il monitoraggio dell'alcol. Puoi anche registrare il tuo peso corporeo in kg o lb e seguirne l'andamento verso un peso obiettivo. Anche le misure corporee (vita, fianchi, collo, torace, spalle, braccio, avambraccio, coscia e polpaccio) si possono registrare in cm o pollici. Visualizza riepiloghi giornalieri, cerca i pasti per intervallo di date, modifica o elimina voci passate, imposta obiettivi e segui gli andamenti nel tempo.",
        },
        {
            question: "Quanto sono precisi i conteggi delle calorie?",
            visibleHtml:
                "Sono stime. Per un pasto che descrivi o fotografi, i valori li stima la tua IA; per un codice a barre, provengono dai dati dell'etichetta del prodotto su Open Food Facts, che la tua IA ricalcola in base alla quantità che hai consumato. Entrambi possono essere sbagliati, quindi verifica tutto ciò che conta: puoi correggere o eliminare qualsiasi voce semplicemente chiedendolo. Nutrition MCP è uno strumento di registrazione, non un consiglio medico o dietetico: consulta un medico o un dietista prima di prendere decisioni sulla tua salute, soprattutto se sei in gravidanza, hai una patologia o hai sofferto di disturbi alimentari.",
        },
        {
            question: "Registra anche l'alcol?",
            visibleHtml:
                "Sì, se lo attivi: il monitoraggio dell'alcol è disattivato per impostazione predefinita, e l'alcol resta nascosto da pasti, obiettivi e riepiloghi finché non lo attivi. Da quel momento i drink vengono mostrati in grammi di etanolo puro e come drink standard USA o unità alcoliche britanniche, a tua scelta. Niente viene dedotto in automatico: l'alcol viene salvato solo quando registri un drink o importi un file con una colonna alcol, e un drink che registri viene salvato anche a monitoraggio disattivato. Se lo disattivi di nuovo, l'alcol torna nascosto e l'importatore smette di leggere le colonne dell'alcol: non serve a cancellare nulla, e la tua esportazione include sempre ciò che hai registrato. Per rimuovere un valore di alcol, elimina il pasto a cui appartiene.",
        },
        {
            question:
                "Posso importare il mio storico da MyFitnessPal o un'altra app?",
            visibleHtml:
                "Sì. Chiedi di importare il tuo storico e si apre un importatore nella chat: scegli il CSV esportato dalla tua vecchia app, controlli come vengono abbinate le colonne e vedi cosa verrà aggiunto prima di confermare. Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute automaticamente, mentre qualsiasi altro CSV funziona abbinando tu le colonne. Il file lo legge il tuo browser, quindi l'IA non ricopia mai le tue righe. Nei client senza pannelli in chat puoi invece incollare la tua esportazione, e reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        },
        {
            question: "I miei dati sono privati?",
            visibleHtml:
                'I dati che registri sono conservati nell\'UE e collegati al tuo account, a cui accedi tramite le app di IA che colleghi. Nutrition MCP non vende mai i tuoi dati, non li condivide mai con terze parti e non li usa mai per pubblicità; la home page mostra solo totali anonimi dell\'intero sito. Ciò che la tua IA legge tramite gli strumenti viene inviato al fornitore di quella IA, secondo gli accordi tra te e quel fornitore. Puoi esportare tutto ciò che conserviamo su di te, o eliminare il tuo account e tutti i suoi dati, in qualsiasi momento: i dettagli sono nell\'<a href="/privacy" data-link="privacy">informativa sulla privacy</a>.',
        },
    ],
};

// Italian (it) translation of the /tools reference page copy. See
// src/copy/tools.ts for the full field-by-field documentation of this
// shape (ToolsDoc) and for which fields are structural/never-translated
// (tool names, param names, category slugs — none of those appear in
// this file, only their prose). Terminology follows
// .git/nm-i18n/glossary-it.md and stays consistent with
// src/copy/index.it.ts and src/copy/alternatives.it.ts: protein →
// proteine, carbs → carboidrati, fat → grassi, fiber → fibre, (total)
// sugar → zuccheri (totali), alcohol → alcol / grammi di etanolo puro,
// caffeine → caffeina, meal → pasto, goal/target → obiettivo, trend →
// andamento, history → storico, tracking → monitoraggio, timezone → fuso
// orario, log (verb) → registrare, optional → facoltativo.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_IT: ToolsDoc = {
    meta: {
        title: "41 strumenti per calorie, macro, acqua e peso",
        description:
            "I 41 strumenti per Claude, ChatGPT e altre IA: registra pasti, scansiona codici a barre, importa CSV da MyFitnessPal o Cronometer, monitora acqua, peso e misure corporee.",
        ogDescription:
            "Tutti i 41 strumenti che il server Nutrition MCP mette a disposizione della tua IA, compreso un importatore CSV per portare lo storico da un'altra app, con descrizioni ed esempi di richieste.",
    },
    hero: {
        eyebrow: "Guida di riferimento",
        titleBeforeEm: "Tutto quello che la tua IA può ",
        titleEm: "fare",
        titleAfterEm: "",
        lead: "Non devi mai usarli direttamente: parli con Claude, ChatGPT o un altro client MCP e l'assistente sceglie lo strumento giusto. Ecco tutti gli strumenti che il server Nutrition MCP offre per pasti, calorie e macro, acqua e peso, con cosa fa ciascuno e una frase che lo attiva.",
        countBold: "41 strumenti",
        countTail: "in 7 aree",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Registrazione",
            title: "Registrare cibo e pasti",
            description:
                "La funzione principale: registra ciò che hai mangiato, comunque tu lo descriva.",
        },
        "reviewing-your-meals": {
            pillLabel: "Storico",
            title: "Rivedere i tuoi pasti",
            description:
                "Ripercorri ciò che hai registrato, un giorno o un intero periodo alla volta.",
        },
        water: {
            pillLabel: "Acqua",
            title: "Monitoraggio dell'acqua",
            description:
                "Tieni traccia dell'idratazione insieme a ciò che mangi.",
        },
        weight: {
            pillLabel: "Corpo",
            title: "Peso e misure corporee",
            description:
                "Registra pesate e misure prese con il metro, rivedile e segui l'andamento del peso verso il tuo obiettivo.",
        },
        "goals-progress": {
            pillLabel: "Obiettivi",
            title: "Obiettivi e progressi",
            description:
                "Imposta gli obiettivi e guarda come va ogni giornata.",
        },
        "insights-trends": {
            pillLabel: "Analisi",
            title: "Analisi e andamenti",
            description:
                "Dati già aggregati, così l'IA individua le tue abitudini senza fare calcoli.",
        },
        "settings-account": {
            pillLabel: "Impostazioni",
            title: "Impostazioni e account",
            description:
                "Preferenze che rendono tutto più preciso, e pieno controllo sui tuoi dati.",
        },
    },
    badges: {
        log: "Registra",
        widget: "UI interattiva",
        lookup: "Cerca",
        import: "Importa",
        edit: "Modifica",
        remove: "Rimuovi",
        view: "Visualizza",
        export: "Esporta",
        setting: "Impostazione",
    },
    ui: {
        parametersLabel: "Parametri",
        requiredLabel: "obbligatorio",
        optionalLabel: "facoltativo",
        trySayingLabel: "Prova a dire",
        categoriesLabel: "Categorie di strumenti",
    },
    tools: {
        log_meal: {
            description:
                "Registra cosa hai mangiato con calorie e macro, più fibre, zuccheri totali e aggiunti, alcol e caffeina quando i valori sono disponibili. Descrivilo a parole tue: l'IA stima i valori, ti chiede la porzione quando non è chiara e può prima recuperare i dati dell'etichetta da un codice a barre o dal web.",
            params: {
                description: "Cosa hai mangiato",
                meal_type: "colazione, pranzo, cena o spuntino",
                calories: "Calorie totali",
                protein_g: "Proteine in grammi",
                carbs_g: "Carboidrati in grammi",
                fat_g: "Grassi in grammi",
                fiber_g:
                    "Fibre alimentari in grammi. All'IA viene chiesto di compilarlo per ogni pasto, stimandolo dagli ingredienti quando manca il valore in etichetta, perché un campo vuoto non vale zero: esclude l'intera giornata dalla tua media di fibre",
                sugar_g:
                    "Zuccheri <b>totali</b> in grammi: il valore che l'etichetta riporta alla voce “Zuccheri”, compresi quelli naturalmente presenti in frutta e latte, non solo gli zuccheri aggiunti. Si compila per ogni pasto, alle stesse condizioni delle fibre",
                added_sugar_g:
                    "Zuccheri <b>aggiunti</b> in grammi: lo zucchero aggiunto durante la lavorazione o la preparazione (zucchero da tavola, sciroppi, miele, lo zucchero di bevande e alimenti zuccherati). Fanno parte degli zuccheri totali e non li superano mai. Lo zucchero naturalmente presente nella frutta intera, nella verdura e nel latte semplice non è aggiunto, e nemmeno quello del succo 100% frutta. Si compila per ogni pasto, alle stesse condizioni delle fibre: gli alimenti non lavorati valgono 0, lo zucchero di una bibita è tutto aggiunto e si usa la riga “Includes Xg Added Sugars” delle etichette statunitensi quando c'è. Accompagna <code>sugar_g</code>: un pasto con zuccheri totali ma senza zuccheri aggiunti potrebbe non essere salvato",
                alcohol_g:
                    "Grammi di <b>etanolo puro</b>, non il volume della bevanda né la sua gradazione: l'IA li calcola dalla quantità servita e dalla gradazione (una birra da 330 ml al 5% contiene 13 g)",
                caffeine_mg:
                    "Caffeina in <b>milligrammi</b>, non grammi: è l'unico campo qui che non è in grammi, perché è così che la riportano tutte le etichette e le linee guida (un caffè filtro ne contiene circa 95 mg, un espresso 63 mg, una lattina di cola 34 mg). La caffeina non apporta calorie. A differenza di fibre e zuccheri, viene inviata solo per ciò che contiene davvero caffeina: uno 0 registrato aggiungerebbe alla tua dashboard una riga della caffeina per un nutriente che non assumi mai",
                logged_at:
                    "Quando l'hai mangiato, se non è adesso: ti permette di registrare qualcosa a posteriori",
                notes: "Note aggiuntive",
            },
            example:
                "Registra per pranzo una burrito bowl di pollo con guacamole extra",
            photoHint:
                "…oppure scatta una foto del piatto: l'IA riconosce ogni pietanza, stima le porzioni in misure di tutti i giorni (un bicchiere, una manciata), controlla come l'hai registrata le altre volte e ti chiede conferma prima di registrarla.",
        },
        lookup_barcode: {
            description:
                "Recupera da Open Food Facts i valori nutrizionali in etichetta di un prodotto confezionato tramite il codice a barre (EAN/UPC di 8–14 cifre), insieme a Nutri-Score e gruppo di trasformazione NOVA quando Open Food Facts li riporta. Gli zuccheri aggiunti compaiono quando Open Food Facts li indica, segnalati come stima quando Open Food Facts li ha ricavati dagli ingredienti. Puoi digitare le cifre o ricavarle da una foto della confezione; poi il risultato si può registrare, in proporzione a quanto ne hai mangiato.",
            params: {},
            example: "Scansiona questo codice a barre: 3017620422003",
            photoHint:
                "…oppure invia una foto della confezione: l'IA ci legge le cifre del codice a barre.",
        },
        start_meal_import: {
            description:
                "Apre in chat un importatore per portare il tuo storico da un'altra app: scegli il CSV esportato da MyFitnessPal, Cronometer, Lose It!, MacroFactor o un'altra app di monitoraggio, abbina le colonne a calorie, macro, fibre, zuccheri totali e aggiunti e caffeina (più l'alcol, se hai attivato il monitoraggio dell'alcol) e controlla cosa verrà aggiunto prima di confermare. Il file viene letto direttamente nel tuo browser, non si salva nulla finché non approvi l'anteprima e reimportare lo stesso file non crea duplicati.",
            params: {},
            example: "Importa lo storico dei miei pasti da MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Aggiunge in un colpo solo un blocco di pasti passati, fino a 50 alla volta, invece di registrarli uno per uno. L'importatore qui sopra salva i dati tramite questo strumento, e l'IA può usarlo direttamente per i pasti che hai incollato in chat. Ogni riga viene prima controllata e ogni problema viene segnalato riga per riga, quindi reinviare le stesse righe è sicuro e non duplica ciò che è già registrato, purché nel frattempo tu non abbia cambiato fuso orario.",
            params: {
                meals: "Le righe da importare, nell'ordine del file di origine (1–50 per chiamata). Ogni riga può contenere un orario, il tipo di pasto, una descrizione, le note e gli stessi valori di un pasto registrato: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (zuccheri totali), <code>added_sugar_g</code> (zuccheri aggiunti, parte del totale), <code>alcohol_g</code> (grammi di etanolo puro) e <code>caffeine_mg</code> (milligrammi, non grammi)",
                expected_row_count:
                    "Quante righe contiene questa chiamata, contate nel file di origine, così ci si accorge se una riga va persa",
                expected_total_kcal:
                    "Calorie totali del file di origine, confrontate con quelle effettivamente ricevute",
                dry_run: "Mostra cosa succederebbe, senza scrivere nulla",
                on_error:
                    "Se importare le righe valide e segnalare le altre, oppure non scrivere nulla se anche una sola riga non va",
                source_app: "Da quale app proviene il file",
            },
            example:
                "Ecco i pasti della settimana scorsa, copiati dalla mia vecchia app: aggiungili tutti",
        },
        update_meal: {
            description:
                "Modifica i dettagli di un pasto già registrato: la descrizione, qualsiasi macro, fibre, zuccheri totali o aggiunti, alcol o caffeina, l'orario o le note. Serve anche a colmare i vuoti: se un pasto è stato registrato senza fibre, zuccheri o zuccheri aggiunti, il server lo segnala e, se sei d'accordo, l'IA li aggiunge qui.",
            params: {
                id: "UUID del pasto da aggiornare",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Zuccheri totali, non zuccheri aggiunti",
                added_sugar_g:
                    "Solo zuccheri aggiunti, mai più degli zuccheri totali. Accompagna <code>sugar_g</code>: una modifica degli zuccheri totali di un pasto senza zuccheri aggiunti registrati potrebbe non essere salvata senza questo valore",
                alcohol_g:
                    "Grammi di etanolo puro, non il volume della bevanda",
                caffeine_mg: "Milligrammi, non grammi",
                logged_at: "",
                notes: "",
            },
            example:
                "In realtà quel pranzo era di 600 calorie, non 500: correggilo",
        },
        delete_meal: {
            description: "Rimuove un pasto registrato per errore.",
            params: {
                id: "UUID del pasto da eliminare",
            },
            example: "Elimina lo spuntino che ho registrato oggi pomeriggio",
        },
        search_meals: {
            description:
                "Cerca tra i tuoi pasti passati per parola chiave e li raggruppa nelle varianti che ricorrono: quante volte hai registrato ciascuna, quando l'ultima volta e le sue calorie tipiche. È così che l'IA confronta la foto del tuo piatto con il modo in cui hai davvero registrato quel pasto in passato, ed è così che funziona “registra la mia solita colazione”.",
            params: {
                queries:
                    "Parole chiave alternative per l'alimento, in qualsiasi lingua tu abbia usato per registrare",
                days: "Quanto indietro cercare (predefinito: un anno)",
                limit: "Numero massimo di voci da analizzare",
            },
            example: "Registra la mia solita colazione",
        },
        get_meals_today: {
            description: "Mostra tutti i pasti che hai registrato oggi.",
            params: {
                detail: "<code>compact</code> (predefinito) mostra una riga per pasto con il relativo id; <code>full</code> include anche note e orari esatti",
            },
            example: "Cosa ho mangiato oggi?",
        },
        get_meals_by_date: {
            description:
                "Mostra tutti i pasti che hai registrato in un giorno preciso.",
            params: {
                date: "Data in formato AAAA-MM-GG",
                detail: "<code>compact</code> (predefinito) mostra una riga per pasto con il relativo id; <code>full</code> include anche note e orari esatti",
            },
            example: "Mostrami tutto quello che ho mangiato il 4 luglio",
        },
        get_meals_by_date_range: {
            description:
                "Recupera in un colpo solo tutti i pasti tra due date: comodo per rivedere una settimana o un mese. Una chiamata copre fino a 31 giorni; per periodi più lunghi, andamenti e riepiloghi ti danno i totali giornalieri.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date:
                    "Data di fine (AAAA-MM-GG), al massimo 31 giorni compreso quello di inizio",
                detail: "<code>compact</code> (predefinito) mostra una riga per pasto con il relativo id; <code>full</code> include anche note e orari esatti",
            },
            example: "Elenca i miei pasti da lunedì a venerdì",
        },
        export_all_data: {
            description:
                "Esporta in un unico file ZIP tutto ciò che il servizio conserva su di te — meals.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv (ogni modifica ai tuoi obiettivi, con data), profile.csv, account.csv (il tuo account di accesso), telemetry.csv (i dati sull'uso degli strumenti), connections.csv (le app di IA collegate e la sincronizzazione con Apple Health, senza alcun token), health_sync.csv (ciò che la sincronizzazione con Apple Health ha inviato negli ultimi 8 giorni) e un README.txt che spiega colonne, unità di misura e cosa non è incluso — e ti restituisce un link privato per il download, valido 60 minuti. Per ora solo i pasti si possono reimportare.",
            params: {},
            example:
                "Esporta tutti i miei dati: pasti, acqua, peso e obiettivi",
        },
        log_water: {
            description:
                "Registra una voce di idratazione. Puoi indicare la quantità in qualsiasi unità (tazze, once, litri): la conversione in millilitri è automatica.",
            params: {
                amount_ml: "Quantità in millilitri (numero intero, &gt; 0).",
            },
            example: "Ho appena bevuto una bottiglia d'acqua da 500 ml",
        },
        get_water_today: {
            description:
                "Mostra il totale di acqua bevuta oggi e ogni singola voce.",
            params: {},
            example: "Quanta acqua ho bevuto oggi?",
        },
        get_water_by_date: {
            description:
                "Mostra il totale di acqua e le singole voci di un giorno preciso.",
            params: {
                date: "Data in formato AAAA-MM-GG",
            },
            example: "Quanto ho bevuto ieri?",
        },
        delete_water: {
            description: "Rimuove una voce d'acqua aggiunta per errore.",
            params: {
                id: "UUID della voce d'acqua da eliminare",
            },
            example: "Elimina l'ultima voce d'acqua",
        },
        log_weight: {
            description:
                "Registra una misurazione del peso corporeo in kg o lb. Puoi registrare anche più pesate al giorno e il server salva il valore in un'unità standard, così l'unità che preferisci non altera mai il dato.",
            params: {
                weight: "Valore del peso corporeo, nell'unità indicata da <code>unit</code> (&gt; 0).",
            },
            example: "Registra il mio peso: 74,2 kg stamattina",
        },
        update_weight: {
            description:
                "Corregge una pesata esistente: il valore, l'orario o le note.",
            params: {
                id: "UUID della pesata da aggiornare",
                weight: "Nuovo valore del peso, nell'unità indicata da <code>unit</code>.",
                logged_at: "Data e ora in formato ISO 8601",
                notes: "",
            },
            example: "Correggi la pesata di stamattina in 73,8 kg",
        },
        delete_weight: {
            description: "Rimuove una pesata.",
            params: {
                id: "UUID della pesata da eliminare",
            },
            example: "Elimina la pesata di oggi",
        },
        get_weight_today: {
            description: "Mostra le pesate di oggi nell'unità che preferisci.",
            params: {},
            example: "Quanto segnava la bilancia oggi?",
        },
        get_weight_by_date: {
            description: "Mostra le tue pesate di un giorno preciso.",
            params: {
                date: "Data in formato AAAA-MM-GG",
            },
            example: "Quanto pesavo il primo del mese?",
        },
        get_weight_by_date_range: {
            description:
                "Mostra tutte le pesate tra due date, raggruppate per giorno con la media di ciascuno.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date: "Data di fine (AAAA-MM-GG)",
            },
            example: "Mostrami le pesate delle ultime due settimane",
        },
        get_weight_trends: {
            description:
                "Mostra l'andamento del tuo peso in un dato periodo: un peso di tendenza smussato che attenua le oscillazioni quotidiane, il tuo ritmo di variazione settimanale, ultima misurazione, variazione complessiva, minimo e massimo, e progressi verso il peso obiettivo. Il grafico può mostrare anche 90 giorni, un anno o tutto lo storico.",
            params: {
                days: "Ampiezza del periodo in giorni (predefinito 30, massimo 365).",
            },
            example: "Come va il mio peso questo mese?",
        },
        set_weight_unit: {
            description:
                "Imposta se il peso viene mostrato e inserito in kg o lb. I valori salvati non cambiano: cambiano solo la visualizzazione e l'unità con cui vengono interpretati i numeri per impostazione predefinita.",
            params: {},
            example: "D'ora in poi usa le libbre per il mio peso",
        },
        log_body_measurement: {
            description:
                "Registra una misura presa con il metro da sarta in una zona del corpo (vita, fianchi, collo, torace, spalle, braccio, avambraccio, coscia o polpaccio), in cm o pollici. Il valore viene salvato così come l'hai inserito, insieme a un valore standard, così cambiare unità non altera mai un numero. I numeri molto lontani da un intervallo realistico per quella zona vengono rifiutati come probabili errori di battitura.",
            params: {
                kind: "La zona misurata: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> o <code>calf</code>. Un valore per zona; il lato (sinistro o destro) può andare nelle note.",
                value: "La misura, nell'unità indicata da <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> o <code>in</code>; per impostazione predefinita, l'unità di lunghezza che hai salvato.",
                logged_at: "Quando è stata presa la misura, se non adesso",
                notes: "Note aggiuntive",
            },
            example: "Registra il mio giro vita: 82 cm stamattina",
        },
        get_body_measurements: {
            description:
                "Elenca le tue misure corporee per giorno, dalla più vecchia alla più recente, anche per una sola zona. Copre gli ultimi 30 giorni se non indichi date, fino a 366 giorni per chiamata.",
            params: {
                kind: "Solo questa zona (ad es. <code>waist</code>)",
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date:
                    "Data di fine (AAAA-MM-GG), fino a 366 giorni compreso quello di inizio",
            },
            example: "Mostrami le misure del giro vita degli ultimi tre mesi",
        },
        update_body_measurement: {
            description:
                "Corregge una misura esistente: il valore, la sua unità, l'orario o le note. La zona invece non cambia: una zona diversa è una nuova voce.",
            params: {
                id: "UUID della misura da aggiornare",
                value: "Nuovo valore, nell'unità indicata da <code>unit</code>.",
                unit: "Per impostazione predefinita, l'unità in cui è stata registrata la voce.",
                logged_at: "Data e ora in formato ISO 8601",
                notes: "Note sostitutive",
            },
            example: "La misura dei fianchi era 98 cm, non 89",
        },
        delete_body_measurement: {
            description: "Rimuove una misura corporea.",
            params: {
                id: "UUID della misura da eliminare",
            },
            example: "Elimina la misura del collo di oggi",
        },
        set_length_unit: {
            description:
                "Imposta se le misure corporee vengono mostrate e inserite in centimetri o pollici. È un'impostazione separata dall'unità di peso. I valori salvati non cambiano: cambiano solo la visualizzazione e l'unità con cui vengono interpretati i numeri per impostazione predefinita.",
            params: {},
            example: "Usa i pollici per le mie misure",
        },
        set_nutrition_goals: {
            description:
                "Imposta i tuoi obiettivi giornalieri di calorie, macro, fibre, zuccheri, zuccheri aggiunti, alcol, caffeina e acqua, più un peso obiettivo facoltativo. Calorie, proteine, carboidrati, grassi, fibre e acqua sono valori da raggiungere; zuccheri totali, zuccheri aggiunti, alcol e caffeina sono limiti da non superare, e i progressi vengono descritti di conseguenza. Aggiorna solo i campi che indichi; gli altri restano invariati.",
            params: {
                daily_calories:
                    "Obiettivo calorico giornaliero (kcal). Null per rimuoverlo.",
                daily_protein_g:
                    "Obiettivo giornaliero di proteine (grammi). Null per rimuoverlo.",
                daily_carbs_g:
                    "Obiettivo giornaliero di carboidrati (grammi). Null per rimuoverlo.",
                daily_fat_g:
                    "Obiettivo giornaliero di grassi (grammi). Null per rimuoverlo.",
                daily_fiber_g:
                    "Obiettivo giornaliero di fibre (grammi), un minimo da raggiungere. Null per rimuoverlo.",
                daily_sugar_g:
                    "Limite giornaliero di zuccheri <b>totali</b> (grammi), un massimo da non superare. Gli zuccheri totali comprendono quelli naturalmente presenti in frutta e latte, quindi le linee guida ufficiali sugli zuccheri aggiunti indicano un valore molto più basso. Null per rimuoverlo.",
                daily_added_sugar_g:
                    "Limite giornaliero di zuccheri <b>aggiunti</b> (grammi), un massimo da non superare. Conta solo gli zuccheri aggiunti, non quelli naturalmente presenti in frutta e latte; i valori delle linee guida ufficiali sugli zuccheri di solito si riferiscono a questa misura (l'American Heart Association indica al massimo 25 g al giorno per le donne e 36 g per gli uomini). 0 è un limite reale che significa nessuno. Null per rimuoverlo.",
                daily_alcohol_g:
                    "Limite giornaliero di alcol in grammi di <b>etanolo puro</b>, un massimo da non superare. Un drink standard USA equivale a 14 g, un'unità alcolica britannica a 7,9 g. Null per rimuoverlo.",
                daily_caffeine_mg:
                    "Limite giornaliero di caffeina in <b>milligrammi</b>, un massimo da non superare. EFSA e FDA fissano il tetto per gli adulti sani a 400 mg al giorno (circa quattro caffè filtro); il valore dell'EFSA in gravidanza è 200 mg. 0 è un limite vero e proprio: nessuna caffeina. Null per rimuoverlo.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Imposta i miei obiettivi a 2200 calorie, 160 g di proteine e un peso obiettivo di 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Mostra i tuoi obiettivi giornalieri attuali di calorie e macro, l'eventuale obiettivo di fibre e i limiti di zuccheri o caffeina e, se monitori l'alcol, il tuo limite di alcol.",
            params: {},
            example: "Quali sono i miei obiettivi giornalieri?",
        },
        get_goal_progress: {
            description:
                "Mostra a che punto sei oggi rispetto ai tuoi obiettivi: anelli che confrontano quanto hai assunto con ciascun obiettivo, più i progressi sul peso corporeo. Tocca l'anello di una macro per vedere quali pasti hanno contribuito.",
            params: {},
            example: "Come sto andando oggi con i miei obiettivi?",
        },
        get_nutrition_summary: {
            description:
                "Mostra i totali nutrizionali giornalieri di un intervallo di date in una dashboard interattiva: riquadri delle macro rispetto agli obiettivi e un dettaglio giorno per giorno. Una chiamata copre fino a 92 giorni; per periodi più lunghi, gli andamenti ti danno le medie mobili.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date:
                    "Data di fine (AAAA-MM-GG), al massimo 92 giorni compreso quello di inizio",
            },
            example: "Fammi un riepilogo della settimana appena passata",
        },
        get_trends: {
            description:
                "Medie mobili a 7/14/30 giorni, variabilità, serie di giorni consecutivi di registrazione, media delle calorie per giorno della settimana e i tuoi giorni migliori e peggiori per calorie: già calcolati, così l'IA deve solo riassumerli. Con group_by fornisce anche medie per settimana, mese, trimestre o anno — per giorno registrato, quindi i giorni senza pasti non contano — confrontate con gli obiettivi in vigore in quel momento, con quanti giorni sono stati in obiettivo e quanti sembrano incompleti.",
            params: {
                days: "Ampiezza del periodo in giorni (predefinito 30, massimo 365).",
                group_by:
                    "<code>week</code>, <code>month</code>, <code>quarter</code> o <code>year</code>: 26 settimane, 24 mesi, 12 trimestri o 5 anni, fino al periodo che contiene la data finale (oggi per impostazione predefinita). L'intervallo è fisso; <code>days</code> imposta comunque le medie mobili.",
            },
            example: "Come sono andati i miei mesi rispetto ai miei obiettivi?",
        },
        get_meal_patterns: {
            description:
                "Mette in luce le tue abitudini: quanto spesso consumi ogni tipo di pasto, l'effetto della colazione, pranzi molto calorici, cene tardi, giorni feriali e weekend a confronto, e giornate fuori dalla norma.",
            params: {
                days: "Ampiezza del periodo in giorni (predefinito 30, minimo 7, massimo 365).",
            },
            example:
                "Ci sono abitudini ricorrenti nel modo in cui mangio, tipo cene tardi o colazioni saltate?",
        },
        get_profile: {
            description:
                "Mostra in un colpo solo tutte le tue impostazioni attuali: fuso orario (con data e ora locali), lingua dei widget, unità di peso e di lunghezza preferite, se i widget in chat sono visibili e se il monitoraggio dell'alcol è attivo.",
            params: {},
            example: "Quali sono le mie impostazioni attuali?",
        },
        set_timezone: {
            description:
                "Imposta il tuo fuso orario IANA, così il giorno cambia alla tua mezzanotte locale: un pasto registrato alle 23 conta per quel giorno, non per il giorno successivo in UTC.",
            params: {},
            example: "Sono a Berlino: imposta il mio fuso orario",
        },
        set_language: {
            description:
                "Imposta la lingua dell'interfaccia dei widget in chat (dashboard e grafici), non quella in cui ti risponde l'IA.",
            params: {
                locale: "Codice ISO 639-1, ad es. <code>de</code>, <code>ja</code>. Lingue supportate: inglese, tedesco, spagnolo, francese, olandese, polacco, italiano, ucraino, giapponese, turco.",
            },
            example: "Mostra i miei widget in tedesco",
        },
        get_current_time: {
            description:
                "Controlla data e ora attuali nel tuo fuso orario, più l'istante UTC. Alcune app non dicono all'assistente che ore sono: è così che capisce cosa vogliono dire “stamattina” o “oggi” senza doverlo chiedere a te (se non hai impostato un fuso orario, usa UTC).",
            params: {},
            example: "Che ore sono adesso da me?",
        },
        set_widget_display: {
            description:
                "Attiva o disattiva i widget visivi in chat: dashboard, anelli degli obiettivi e grafici degli andamenti. Se sono disattivati, gli stessi strumenti rispondono solo con testo e dati. Sono attivi per impostazione predefinita; la modifica vale per le nuove conversazioni.",
            params: {
                enabled:
                    "true per mostrare i widget, false per risposte solo testuali",
            },
            example: "Disattiva i widget",
        },
        set_alcohol_tracking: {
            description:
                "Attiva o disattiva il monitoraggio dell'alcol e scegli se contare le bevande in drink standard USA o in unità alcoliche britanniche. È disattivato per impostazione predefinita, quindi devi chiederlo tu. Se lo disattivi di nuovo, l'alcol sparisce da pasti, obiettivi e progressi e l'importatore di file smette di leggere la colonna dell'alcol: nulla di ciò che hai già registrato viene eliminato, l'esportazione CSV lo include comunque e l'alcol ricompare se riattivi il monitoraggio. La modifica vale dal tuo prossimo messaggio, senza riavviare nulla.",
            params: {
                enabled:
                    "true per mostrare l'alcol in pasti, obiettivi e progressi, false per nasconderlo",
                drink_unit:
                    "Quale drink standard mostrare accanto ai grammi: <code>us</code> (14 g per drink) o <code>uk</code> (7,9 g per unità). Predefinito: <code>us</code>; ciò che viene salvato davvero sono i grammi di etanolo puro.",
            },
            example:
                "Inizia a tenere traccia dell'alcol che bevo, in unità britanniche",
        },
        delete_account: {
            description:
                "Elimina definitivamente il tuo account Nutrition MCP e tutti i dati che conserva su di te. L'operazione è irreversibile, quindi lo strumento non fa nulla senza una conferma esplicita, e all'IA viene chiesto di verificare con te prima di inviarla.",
            params: {},
            example: "Elimina il mio account e tutti i miei dati",
        },
    },
    troubleshooting: {
        pillLabel: "Aiuto",
        title: "Risoluzione dei problemi",
        description:
            "Qualcosa non funziona? Quasi tutti i problemi si risolvono in fretta.",
        stillStuck: "Non hai ancora risolto?",
        items: {
            "cannot-connect": {
                question:
                    "Il connettore non si collega o continua a chiedermi di accedere",
                answerHtml:
                    "Rimuovi il connettore e aggiungilo di nuovo con esattamente <code>https://nutrition-mcp.com/mcp</code>: la parte <code>/mcp</code> è obbligatoria. In Claude apri <strong>Customize</strong> → <strong>Connectors</strong>, disconnetti Nutrition e ricollegalo; in ChatGPT vai su <strong>Settings</strong> → <strong>Apps</strong>. Accedi con la stessa email e password, o con lo stesso account Google, che hai usato la prima volta: i tuoi dati appartengono al tuo account, non al collegamento, quindi ricollegandoti non perdi nulla. Una volta collegato, il connettore resta attivo finché lo usi almeno una volta ogni 90 giorni; se smette di funzionare, basta ricollegarlo allo stesso modo.",
            },
            "session-expired": {
                question:
                    'La pagina di accesso mostra {"error":"session_expired"}',
                answerHtml:
                    "La pagina di accesso resta valida solo 10 minuti e si azzera anche ogni volta che il server si riavvia per un aggiornamento. Torna alla pagina di accesso e ricaricala, oppure ricomincia il collegamento dalla tua app di IA, poi accedi senza fare lunghe pause. Se invece compare <code>session_mismatch</code>, l'accesso è stato completato in un browser diverso da quello in cui era iniziato: ricomincia dalla tua app di IA e completalo nello stesso browser.",
            },
            "cannot-sign-in": {
                question:
                    "Non riesco ad accedere, o ho dimenticato la password",
                answerHtml:
                    "Usa <strong>Accedi</strong> se hai già un account: con email o password sbagliate compare “Email o password errate” e non viene mai creato un nuovo account. <strong>Crea account</strong> serve solo la prima volta. Controlla che l'email non contenga errori di battitura. Se hai creato l'account con <strong>Continua con Google</strong>, usa di nuovo quel pulsante. Per ora non puoi reimpostare la password da solo: scrivi ad <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a> dall'indirizzo associato al tuo account e la reimposterò io.",
            },
            "history-missing": {
                question: "Mi sono ricollegato e il mio storico è sparito",
                answerHtml:
                    "Ogni indirizzo email corrisponde a un account separato, quindi se accedi con un'altra email ne apri uno vuoto: non è stato eliminato nulla. Disconnettiti e accedi di nuovo con l'indirizzo che hai usato la prima volta. Se non sei sicuro di quale fosse, scrivi ad <a href=\"mailto:anton@nutrition-mcp.com\">anton@nutrition-mcp.com</a>.",
            },
            "tools-not-used": {
                question: "L'IA risponde ma non registra nulla",
                answerHtml:
                    "Assicurati che il connettore sia attivo in questa conversazione (in Claude controlla il menu degli strumenti nella casella del messaggio) e fai una richiesta esplicita, per esempio “registra la mia colazione in Nutrition”. Se l'app ti chiede il permesso di usare uno strumento, concedilo.",
            },
            "wrong-day": {
                question: "I miei pasti compaiono nel giorno sbagliato",
                answerHtml:
                    "I giorni vengono calcolati nel tuo fuso orario e, se non ne hai mai impostato uno, si usa UTC. Chiedi “che fuso orario ho impostato?” (<a href=\"#get_profile\"><code>get_profile</code></a>) e, se è sbagliato, “imposta il mio fuso orario su Europe/Berlin” (<a href=\"#set_timezone\"><code>set_timezone</code></a>). Da quel momento tutto ciò che hai registrato viene raggruppato secondo il tuo giorno locale, comprese le voci passate. L'unica eccezione sono le voci a cui hai dato un orario preciso mentre il fuso orario era sbagliato: conservano l'istante con cui sono state salvate, quindi possono risultare spostate di un'ora o di un giorno. Chiedi all'IA di spostarle alla data e all'ora giuste (<a href=\"#update_meal\"><code>update_meal</code></a>). Imposta il fuso orario anche prima di importare lo storico: i pasti importati conservano l'istante a cui sono stati assegnati e, se reimporti il file di un'altra app dopo aver cambiato fuso orario, vengono aggiunti una seconda volta. Un'esportazione di Nutrition MCP invece viene riconosciuta e non si duplica.",
            },
            "no-widgets": {
                question: "Vedo solo testo, niente grafici né schede",
                answerHtml:
                    'Le schede visive richiedono un\'app che supporti i pannelli interattivi di MCP Apps, come Claude o ChatGPT; gli altri client ricevono le stesse informazioni come testo. Se hai disattivato i widget, chiedi di riattivarli (<a href="#set_widget_display"><code>set_widget_display</code></a>) e inizia una nuova conversazione: una chat già aperta mantiene la vecchia impostazione finché non si ricollega. La piccola scheda che compare dopo aver registrato un pasto appare solo quando hai impostato gli obiettivi giornalieri (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "L'importatore non si apre o dice che non può salvare",
                answerHtml:
                    "Il pannello dell'importatore richiede un'app che mostri pannelli interattivi e abbia i widget attivi. Se dice <em>Questa app non consente al pannello di scrivere nel tuo diario</em>, o non compare proprio, chiedi all'IA di importare il file direttamente: allega o incolla il CSV e userà <a href=\"#bulk_import_meals\"><code>bulk_import_meals</code></a>, che controlla ogni riga e salta i duplicati, quindi reinviarlo è sicuro, purché nel frattempo tu non abbia cambiato fuso orario. Imposta il fuso orario prima della prima importazione: se reimporti il file di un'altra app dopo averlo cambiato, le righe vengono aggiunte di nuovo. Se usi il pannello dell'importatore e vuoi importare anche la colonna dell'alcol, attiva prima il monitoraggio dell'alcol: finché è disattivato, il pannello salta quella colonna, e reimportare in seguito non la recupererà.",
            },
            "rate-limited": {
                question:
                    "Vedo “Rate limit exceeded” o “Too many failed authentication attempts”",
                answerHtml:
                    "Ogni account può fare 60 richieste al minuto, e ogni chiamata a uno strumento conta almeno come una. Aspetta i secondi indicati nel messaggio, poi continua. Per inserire molti pasti passati usa l'importatore invece di registrarli uno per uno. Le pagine di accesso consentono 30 richieste al minuto per rete. Dopo 20 tentativi di connessione rifiutati di fila dalla stessa rete (di solito un vecchio connettore scollegato che continua a riprovare), le connessioni da quella rete vengono sospese per 5 minuti, e le sospensioni successive si allungano fino a un massimo di un'ora. Per fermare i tentativi, rimuovi il vecchio connettore e aggiungilo di nuovo.",
            },
            "barcode-not-found": {
                question:
                    "Un codice a barre non viene trovato, o i valori sembrano sbagliati",
                answerHtml:
                    "I dati dei codici a barre vengono da Open Food Facts, un database collaborativo, quindi alcuni prodotti mancano e alcune schede non sono aggiornate. Assicurati che tutte le 8–14 cifre sotto il codice a barre siano state lette correttamente. Se il prodotto non c'è, l'IA può stimare i valori dal nome o da una foto della tabella nutrizionale, e puoi correggere qualsiasi valore in seguito. Aggiungere il prodotto su openfoodfacts.org aiuta tutti. Open Food Facts non ha dati sulla caffeina, quindi la caffeina si ricava dall'etichetta o da quantità tipiche.",
            },
            "health-sync-yesterday": {
                question: "Ieri non è ancora in Apple Health",
                answerHtml:
                    'La sincronizzazione con Apple Health invia solo i giorni conclusi. Un giorno si considera concluso alle 05:00 del mattino dopo nel tuo fuso orario, quindi ieri arriva con la prima sincronizzazione dopo le 05:00 di oggi, e oggi compare in Salute solo domani. Una sincronizzazione parte quando scatta una delle automazioni del comando rapido (aprire l\'app Salute, fermare la sveglia) oppure quando esegui <strong>Nutrition MCP Health</strong> nell\'app Comandi Rapidi e scegli <strong>Sync now</strong>. Una mattina saltata si recupera da sola: ogni sincronizzazione guarda indietro agli ultimi 7 giorni. I giorni seguono il fuso orario del tuo profilo (<a href="#get_profile"><code>get_profile</code></a>) oppure, se non ne hai mai impostato uno, quello che il tuo iPhone ha indicato al collegamento (<a href="#wrong-day">pasti nel giorno sbagliato</a>). I giorni precedenti al collegamento vengono inviati solo se, collegandoti, hai scelto di recuperare fino a 7 giorni prima.',
            },
            "health-sync-higher": {
                question: "Apple Health mostra più della mia chat",
                answerHtml:
                    "Apple Health può aggiungere a un valore, ma non può mai ridurne uno che ha già. Un pasto che aggiungi a un giorno già inviato arriva come una piccola voce in più alle 12:01, 12:02 e così via, purché il giorno rientri negli ultimi 7 giorni. Se elimini o riduci un pasto dopo che il suo giorno è stato inviato, Salute resta più alto e il comando rapido mostra un avviso con la differenza. Per correggere, apri l'app Salute, vai su <strong>Sfoglia</strong> → <strong>Alimentazione</strong>, apri il tipo di dato, tocca <strong>Mostra tutti i dati</strong>, elimina le voci di quel giorno provenienti da Comandi Rapidi e inserisci a mano il totale corretto. Non usare mai <strong>Elimina tutti i dati da “Comandi Rapidi”</strong>: cancella anche ciò che hanno registrato gli altri tuoi comandi rapidi. Se ogni giorno sembra raddoppiato, un'altra app scrive gli stessi tipi e Salute li somma: disattivane una in <strong>Condivisione</strong> → <strong>App</strong> nell'app Salute.",
            },
            "health-sync-stopped": {
                question:
                    "La sincronizzazione con Apple Health si è interrotta",
                answerHtml:
                    "Apri l'app Comandi Rapidi ed esegui <strong>Nutrition MCP Health</strong> a mano: ti dice cosa non ha funzionato. Se ti chiede di collegarti di nuovo, il collegamento è terminato (dopo 90 giorni senza sincronizzazione, 365 giorni dopo il collegamento o dopo <strong>Disconnect</strong>): eseguilo, accedi nella pagina che apre con lo stesso account che usi nella tua app di IA e completa entro 30 minuti. Se sincronizza quando lo esegui ma non da solo, controlla che le sue automazioni nella scheda <strong>Automazione</strong> di Comandi Rapidi siano attive e impostate su <strong>Esegui immediatamente</strong>. Se un avviso dice che un giorno non ha raggiunto Apple Health, consenti a Comandi Rapidi di scrivere ogni tipo di dato sull'alimentazione in <strong>Condivisione</strong> → <strong>App</strong> → <strong>Comandi Rapidi</strong> nell'app Salute, poi eseguilo di nuovo. Collegare un nuovo iPhone sostituisce il collegamento di quello vecchio.",
            },
            "export-link": {
                question: "Il link per scaricare l'esportazione non funziona",
                answerHtml:
                    'I link di esportazione scadono dopo 60 minuti e ogni nuova esportazione sostituisce il file precedente. Chiedi una nuova esportazione (<a href="#export_all_data"><code>export_all_data</code></a>) e scaricala subito. Se l\'esportazione riporta 0 pasti quando ti aspettavi il tuo storico, probabilmente hai fatto l\'accesso con un\'altra email: vedi <a href="#history-missing">Mi sono ricollegato e il mio storico è sparito</a>.',
            },
            "delete-account": {
                question: "Come elimino il mio account?",
                answerHtml:
                    "Chiedi all'IA di eliminare il tuo account Nutrition MCP (<a href=\"#delete_account\"><code>delete_account</code></a>). Ti chiederà di confermare, poi eliminerà definitivamente pasti, acqua, peso, misure corporee, obiettivi, impostazioni, il registro degli strumenti usati dalla tua app di IA, eventuali file di esportazione, i tuoi dati di accesso e l'account stesso. L'operazione non si può annullare, quindi, se vuoi una copia dei tuoi dati, esportali prima. Poi rimuovi il connettore dalla tua app. Se in futuro accedi di nuovo con la stessa email, verrà creato un nuovo account vuoto.",
            },
            "report-a-problem": {
                question: "Come segnalo un bug o un problema di sicurezza?",
                answerHtml:
                    'Segnala i bug su <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: indica quale app usi (Claude, ChatGPT, …), cosa hai chiesto, cosa è successo e più o meno quando. Non includere mai la tua password. Per favore, non segnalare pubblicamente i problemi di sicurezza: segnalali in privato tramite la <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">segnalazione privata delle vulnerabilità di GitHub</a> o via email, come descritto nella <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">policy di sicurezza</a>. Per tutto il resto, scrivi ad <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

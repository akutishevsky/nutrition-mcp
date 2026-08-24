// Italian (it) translation of the /tools reference page copy. See
// src/copy/tools.ts for the full field-by-field documentation of this
// shape (ToolsDoc) and for which fields are structural/never-translated
// (tool names, param names, category slugs — none of those appear in
// this file, only their prose). Terminology kept consistent with
// src/copy/index.it.ts and src/copy/alternatives.it.ts: protein →
// proteine, carbs → carboidrati, fat → grassi, fiber → fibre, (total)
// sugar → zuccheri (totali), alcohol → alcol / grammi di etanolo puro,
// caffeine → caffeina, meal → pasto, goal → obiettivo, trend →
// andamento, timezone → fuso orario, log (verb) → registrare.

import type { ToolsDoc } from "./tools.js";

export const TOOLS_IT: ToolsDoc = {
    meta: {
        title: "Guida agli strumenti: tutti i 36 strumenti",
        description:
            "Tutti i 36 strumenti che il server Nutrition MCP mette a disposizione della tua IA — registra i pasti, scansiona codici a barre, importa il tuo storico da un'altra app, monitora acqua e peso, imposta obiettivi e rivedi gli andamenti. Guida completa con descrizioni ed esempi di richieste.",
        ogDescription:
            "Tutti i 36 strumenti che il server Nutrition MCP mette a disposizione della tua IA, incluso un importatore CSV per il tuo storico da un'altra app — con descrizioni ed esempi di richieste.",
    },
    hero: {
        eyebrow: "Guida di riferimento",
        title: "Tutto quello che la tua IA può fare",
        lead: "Non li chiami mai direttamente — parli e basta, e l'assistente sceglie lo strumento giusto. Ecco l'elenco completo che il server Nutrition MCP mette a disposizione, con cosa fa ciascuno e una frase che lo attiva.",
        countBold: "36 strumenti",
        countTail: "in 7 aree",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Registrazione",
            title: "Registrare cibo e pasti",
            description:
                "Il ciclo principale — cattura cosa hai mangiato, comunque tu lo descriva.",
        },
        "reviewing-your-meals": {
            pillLabel: "Revisione",
            title: "Rivedere i tuoi pasti",
            description:
                "Guarda indietro a ciò che hai registrato, un giorno o un intero intervallo alla volta.",
        },
        water: {
            pillLabel: "Acqua",
            title: "Acqua",
            description: "Traccia l'idratazione insieme al tuo cibo.",
        },
        weight: {
            pillLabel: "Peso",
            title: "Peso",
            description:
                "Registra le pesate, rivedile e osserva l'andamento verso il tuo obiettivo.",
        },
        "goals-progress": {
            pillLabel: "Obiettivi",
            title: "Obiettivi e progressi",
            description:
                "Imposta i target e scopri come si comporta ogni giornata.",
        },
        "insights-trends": {
            pillLabel: "Approfondimenti",
            title: "Approfondimenti e andamenti",
            description:
                "Analisi già pre-aggregate, così l'IA può individuare i pattern senza fare calcoli.",
        },
        "settings-account": {
            pillLabel: "Impostazioni",
            title: "Impostazioni e account",
            description:
                "Preferenze che mantengono tutto accurato, più il controllo completo dei tuoi dati.",
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
        optionalLabel: "opzionale",
        trySayingLabel: "Prova a dire",
    },
    tools: {
        log_meal: {
            description:
                "Registra cosa hai mangiato con calorie e macro — più fibre, zuccheri totali, alcol e caffeina quando i numeri sono disponibili. Descrivilo con parole tue — l'IA stima i valori, chiede la dimensione della porzione quando non è chiara, e può recuperare prima i dati dell'etichetta da un codice a barre o dal web.",
            params: {
                description: "Cosa è stato mangiato",
                meal_type: "colazione, pranzo, cena o spuntino",
                calories: "Calorie totali",
                protein_g: "Proteine in grammi",
                carbs_g: "Carboidrati in grammi",
                fat_g: "Grassi in grammi",
                fiber_g:
                    "Fibre alimentari in grammi. All'IA viene chiesto di compilare questo campo per ogni pasto, stimandolo dagli ingredienti quando non esiste un valore da etichetta, perché un campo vuoto non equivale a zero — esclude l'intera giornata dalla tua media di fibre",
                sugar_g:
                    '<b>Totale</b> zuccheri in grammi — il valore che un\'etichetta riporta sotto "Zuccheri", incluso lo zucchero naturalmente presente in frutta e latte, non solo gli zuccheri aggiunti. Compilato per ogni pasto alle stesse condizioni delle fibre',
                alcohol_g:
                    "Grammi di <b>etanolo puro</b>, non il volume della bevanda né la sua gradazione — l'IA lo calcola dalla quantità versata e dalla gradazione (una birra da 330 ml al 5% corrisponde a 13 g)",
                caffeine_mg:
                    "Caffeina in <b>milligrammi</b>, non grammi — l'unico campo qui che non è in grammi, perché è così che ogni etichetta e linea guida la esprime (un caffè filtro è circa 95 mg, un espresso 63 mg, una lattina di cola 34 mg). La caffeina non aggiunge calorie. A differenza di fibre e zuccheri, viene inviata solo per alimenti che effettivamente contengono caffeina — uno 0 registrato metterebbe una riga di caffeina nella tua dashboard per un nutriente che non consumi mai",
                logged_at:
                    "Quando l'hai mangiato, se non è adesso — permette di registrare qualcosa a posteriori",
                notes: "Note aggiuntive",
            },
            example:
                "Registra una burrito bowl di pollo con guacamole extra per pranzo",
            photoHint:
                "…oppure scatta una foto del tuo piatto — l'IA identifica ogni pietanza, stima le porzioni in misure comuni (un bicchiere, una manciata), controlla come l'hai registrata in passato e conferma con te prima di registrare.",
        },
        lookup_barcode: {
            description:
                "Recupera i valori nutrizionali dell'etichetta di un prodotto confezionato da Open Food Facts tramite il suo codice a barre (EAN/UPC di 8–14 cifre). Puoi digitare le cifre o leggerle da una foto della confezione; il risultato può poi essere registrato, adattato a quanto ne hai mangiato.",
            params: {},
            example: "Scansiona questo codice a barre: 3017620422003",
            photoHint:
                "…oppure invia una foto della confezione — l'IA legge le cifre del codice a barre da lì.",
        },
        start_meal_import: {
            description:
                "Apre un importatore nella chat per portare il tuo storico da un'altra app — scegli il file esportato da MyFitnessPal, Cronometer, Lose It! o MacroFactor, mappane le colonne su calorie, macro, fibre, zuccheri e caffeina — più alcol se hai attivato il tracciamento dell'alcol — e rivedi cosa verrà aggiunto prima di confermare. Il file viene letto nel tuo browser, nulla viene salvato finché non approvi l'anteprima, e importare di nuovo lo stesso file non crea duplicati.",
            params: {},
            example: "Importa il mio storico pasti da MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Aggiunge un lotto di pasti passati in un'unica volta — fino a 50 alla volta — invece di registrarli uno per uno. L'importatore qui sopra scrive attraverso questo strumento, e l'IA può usarlo direttamente per dati di pasti che hai incollato in chat. Ogni riga viene controllata prima, e tutto ciò che non va bene viene segnalato riga per riga, quindi rinviare le stesse righe è sicuro e non duplica ciò che è già stato registrato.",
            params: {
                meals: "Le righe da importare, nell'ordine del file di origine (1–50 per chiamata). Ogni riga può contenere un orario, il tipo di pasto, una descrizione, note e gli stessi valori di un pasto registrato: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (zuccheri totali), <code>alcohol_g</code> (grammi di etanolo puro) e <code>caffeine_mg</code> (milligrammi, non grammi)",
                expected_row_count:
                    "Quante righe contiene questa chiamata, contate dal file di origine, così una riga persa viene individuata",
                expected_total_kcal:
                    "Totale calorico del file di origine, riconciliato con quanto arriva",
                dry_run: "Segnala cosa accadrebbe senza scrivere nulla",
                on_error:
                    "Importa le righe valide e segnala le altre, oppure non scrivere nulla se una riga fallisce",
                source_app: "Da quale app proviene il file",
            },
            example:
                "Ecco i pasti della scorsa settimana incollati dalla mia vecchia app — aggiungili tutti",
        },
        update_meal: {
            description:
                "Modifica i dettagli di un pasto già registrato — la sua descrizione, qualsiasi macro, fibre, zuccheri, alcol o caffeina, l'orario o le note. È anche il modo in cui si colma una lacuna: se un pasto è stato registrato senza fibre o zuccheri, il server lo segnala e l'IA li compila qui.",
            params: {
                id: "UUID del pasto da aggiornare",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Zuccheri totali, non zuccheri aggiunti",
                alcohol_g:
                    "Grammi di etanolo puro, non il volume della bevanda",
                caffeine_mg: "Milligrammi, non grammi",
                logged_at: "",
                notes: "",
            },
            example:
                "In realtà quel pranzo era di 600 calorie, non 500 — correggilo",
        },
        delete_meal: {
            description: "Rimuove una voce di pasto registrata per errore.",
            params: {
                id: "UUID del pasto da eliminare",
            },
            example: "Elimina lo spuntino che ho registrato questo pomeriggio",
        },
        search_meals: {
            description:
                "Cerca tra i tuoi pasti passati per parola chiave e vedili raggruppati nelle loro varianti ricorrenti — quante volte ognuna è stata registrata, quando l'ultima volta, e le sue calorie tipiche. È così che l'IA confronta una foto del tuo piatto con come hai effettivamente registrato quel pasto in passato, ed è come funziona \"registra la mia colazione abituale\".",
            params: {
                queries:
                    "Alternative di parole chiave per il cibo, in qualsiasi lingua tu abbia usato per registrare",
                days: "Quanto indietro guardare (predefinito un anno)",
                limit: "Numero massimo di voci da analizzare",
            },
            example: "Registra la mia colazione abituale",
        },
        get_meals_today: {
            description: "Vedi ogni pasto che hai registrato oggi.",
            params: {},
            example: "Cosa ho mangiato oggi?",
        },
        get_meals_by_date: {
            description:
                "Vedi tutti i pasti che hai registrato in un giorno specifico.",
            params: {
                date: "Data in formato AAAA-MM-GG",
            },
            example: "Mostrami tutto quello che ho mangiato il 4 luglio",
        },
        get_meals_by_date_range: {
            description:
                "Recupera tutti i pasti tra due date in un'unica volta — utile per rivedere una settimana o un mese.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date: "Data di fine (AAAA-MM-GG)",
            },
            example: "Elenca i miei pasti da lunedì a venerdì",
        },
        export_all_data: {
            description:
                "Esporta tutto ciò che hai tracciato come un unico file ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv e un README.txt che spiega colonne e unità di misura — con lo stesso link privato, valido per 60 minuti. Per ora i pasti sono l'unica parte che può essere reimportata.",
            params: {},
            example:
                "Esporta tutti i miei dati — pasti, acqua, peso e obiettivi",
        },
        log_water: {
            description:
                "Registra una voce di idratazione. Indicala in qualsiasi unità — tazze, once, litri — e viene convertita in millilitri per te.",
            params: {
                amount_ml: "Quantità in millilitri (intero, > 0).",
            },
            example: "Ho appena bevuto una bottiglia d'acqua da 500 ml",
        },
        get_water_today: {
            description: "Vedi il totale di acqua di oggi e ogni singola voce.",
            params: {},
            example: "Quanta acqua ho bevuto oggi?",
        },
        get_water_by_date: {
            description:
                "Vedi il totale di acqua e le voci per un giorno specifico.",
            params: {
                date: "Data in formato AAAA-MM-GG",
            },
            example: "Quanto ho bevuto ieri?",
        },
        delete_water: {
            description: "Rimuove una voce di acqua aggiunta per errore.",
            params: {
                id: "UUID della voce di acqua da eliminare",
            },
            example: "Rimuovi l'ultima voce di acqua",
        },
        log_weight: {
            description:
                "Registra una misurazione del peso corporeo in kg o lb. Più pesate nello stesso giorno vanno bene, e il server le memorizza in modo canonico così la tua unità preferita non distorce mai il numero.",
            params: {
                weight: "Valore del peso corporeo, in `unit` (> 0).",
            },
            example: "Registra il mio peso — 74,2 kg stamattina",
        },
        update_weight: {
            description:
                "Corregge una pesata esistente — il valore, l'orario o le sue note.",
            params: {
                id: "UUID della voce di peso da aggiornare",
                weight: "Nuovo valore del peso, in `unit`.",
                logged_at: "Timestamp ISO 8601",
                notes: "",
            },
            example: "Correggi la pesata di stamattina a 73,8 kg",
        },
        delete_weight: {
            description: "Rimuove una voce di peso.",
            params: {
                id: "UUID della voce di peso da eliminare",
            },
            example: "Elimina la voce di peso di oggi",
        },
        get_weight_today: {
            description:
                "Vedi le pesate di oggi, mostrate nella tua unità preferita.",
            params: {},
            example: "Quanto pesavo oggi?",
        },
        get_weight_by_date: {
            description: "Vedi le tue pesate per un giorno specifico.",
            params: {
                date: "Data in formato AAAA-MM-GG",
            },
            example: "Qual era il mio peso il giorno 1?",
        },
        get_weight_by_date_range: {
            description:
                "Ottieni ogni pesata tra due date, raggruppate per giorno con la media di ciascun giorno.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date: "Data di fine (AAAA-MM-GG)",
            },
            example: "Mostrami le mie pesate delle ultime due settimane",
        },
        get_weight_trends: {
            description:
                "Vedi l'andamento del tuo peso in una finestra temporale: ultima lettura, variazione complessiva, medie mobili a 7/14/30 giorni, minimo/massimo e progressi verso il tuo peso obiettivo.",
            params: {
                days: "Ampiezza della finestra in giorni (predefinito 30, massimo 365).",
            },
            example: "Come sta andando il mio peso questo mese?",
        },
        set_weight_unit: {
            description:
                "Scegli se il peso viene mostrato e inserito in kg o lb. I valori memorizzati non sono influenzati — cambiano solo la visualizzazione e l'interpretazione predefinita.",
            params: {},
            example: "Usa le libbre per il mio peso da ora in poi",
        },
        set_nutrition_goals: {
            description:
                "Imposta i tuoi obiettivi giornalieri di calorie, macro, fibre, zuccheri, alcol, caffeina e acqua, più un peso corporeo obiettivo facoltativo. Calorie, proteine, carboidrati, grassi, fibre e acqua sono target da raggiungere; zuccheri, alcol e caffeina sono limiti da non superare, e i progressi sono espressi di conseguenza. Aggiorna solo i campi che indichi; il resto rimane invariato.",
            params: {
                daily_calories:
                    "Target calorico giornaliero (kcal). Null per azzerarlo.",
                daily_protein_g:
                    "Target giornaliero di proteine (grammi). Null per azzerarlo.",
                daily_carbs_g:
                    "Target giornaliero di carboidrati (grammi). Null per azzerarlo.",
                daily_fat_g:
                    "Target giornaliero di grassi (grammi). Null per azzerarlo.",
                daily_fiber_g:
                    "Target giornaliero di fibre (grammi), un minimo da raggiungere. Null per azzerarlo.",
                daily_sugar_g:
                    "Limite giornaliero per gli zuccheri <b>totali</b> (grammi), un massimo da non superare. Gli zuccheri totali includono lo zucchero naturalmente presente in frutta e latte, quindi le linee guida pubbliche sugli zuccheri aggiunti indicano un numero molto più basso. Null per azzerarlo.",
                daily_alcohol_g:
                    "Limite giornaliero di alcol in grammi di <b>etanolo puro</b>, un massimo da non superare. Un drink standard USA è 14 g, un'unità britannica 7,9 g. Null per azzerarlo.",
                daily_caffeine_mg:
                    "Limite giornaliero di caffeina in <b>milligrammi</b>, un massimo da non superare. Il tetto EFSA e FDA per adulti sani è 400 mg al giorno (circa quattro caffè filtro), e 200 mg in gravidanza. 0 è un limite reale che significa nessuna caffeina. Null per azzerarlo.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Imposta i miei obiettivi a 2.200 calorie, 160 g di proteine e un peso obiettivo di 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Vedi i tuoi target giornalieri attuali di calorie e macro, qualsiasi target di fibre e limite di zuccheri o caffeina, e — se tracci l'alcol — il tuo limite di alcol.",
            params: {},
            example: "Quali sono i miei target giornalieri?",
        },
        get_goal_progress: {
            description:
                "Vedi come si posiziona l'assunzione di oggi rispetto ai tuoi obiettivi — anelli di assunzione-contro-obiettivo più i progressi sul peso corporeo. Tocca un anello di una macro per vedere quali pasti hanno contribuito.",
            params: {},
            example: "Come sto andando rispetto ai miei obiettivi oggi?",
        },
        get_nutrition_summary: {
            description:
                "Ottieni i totali nutrizionali giornalieri in un intervallo di date come dashboard interattiva: riquadri delle macro rispetto agli obiettivi e una ripartizione per giorno.",
            params: {
                start_date: "Data di inizio (AAAA-MM-GG)",
                end_date: "Data di fine (AAAA-MM-GG)",
            },
            example: "Dammi un riepilogo di questa settimana passata",
        },
        get_trends: {
            description:
                "Medie mobili a 7/14/30 giorni, variabilità, serie di giorni consecutivi di registrazione, ripartizioni per giorno della settimana, e i tuoi giorni migliori e peggiori per calorie e ogni macro — pre-calcolati così l'IA può semplicemente raccontarli.",
            params: {
                days: "Ampiezza della finestra in giorni (predefinito 30, massimo 365).",
            },
            example:
                "Quali sono i miei andamenti di calorie e macro negli ultimi 30 giorni?",
        },
        get_meal_patterns: {
            description:
                "Fa emergere pattern comportamentali: quanto spesso mangi ogni tipo di pasto, l'effetto colazione, pranzi ipercalorici, cene tardive, giorni feriali contro weekend, e giornate anomale.",
            params: {
                days: "Ampiezza della finestra in giorni (predefinito 30, minimo 7, massimo 365).",
            },
            example:
                "Ci sono pattern in come mangio — tipo cene tardive o saltare la colazione?",
        },
        get_profile: {
            description:
                "Vedi tutte le tue impostazioni attuali in un'unica volta: fuso orario (più data e ora locali), lingua dei widget, unità di peso preferita, se i widget in chat sono attivati e se il tracciamento dell'alcol è attivo.",
            params: {},
            example: "Quali sono le mie impostazioni attuali?",
        },
        set_timezone: {
            description:
                "Imposta il tuo fuso orario IANA così i giorni cambiano alla tua mezzanotte locale — un pasto registrato alle 23 conta per quel giorno, non per quello successivo UTC.",
            params: {},
            example: "Sono a Berlino — imposta il mio fuso orario",
        },
        set_language: {
            description:
                "Imposta la lingua dell'interfaccia per i widget in chat — le dashboard e i grafici, non ciò che l'IA ti scrive.",
            params: {
                locale: "Codice ISO 639-1, ad es. <code>de</code>, <code>uk</code>. Lingue supportate: inglese, tedesco, spagnolo, francese, olandese, polacco, italiano, ucraino.",
            },
            example: "Mostra i miei widget in tedesco",
        },
        get_current_time: {
            description:
                'Controlla la data e l\'ora esatte nel tuo fuso orario, più l\'istante UTC. Alcune app non dicono all\'assistente che ore sono, quindi è così che capisce cosa significano "stamattina" o "oggi" senza doverti chiedere (predefinito UTC se nessun fuso orario è impostato).',
            params: {},
            example: "Che ore sono per me in questo momento?",
        },
        set_widget_display: {
            description:
                "Attiva o disattiva i widget visivi in chat — le dashboard, gli anelli degli obiettivi e i grafici degli andamenti. Quando disattivati, gli stessi strumenti rispondono solo con testo e dati. Attivi per impostazione predefinita; il cambiamento si applica alle nuove conversazioni.",
            params: {
                enabled:
                    "true per mostrare i widget, false per risposte solo testuali",
            },
            example: "Disattiva i widget",
        },
        set_alcohol_tracking: {
            description:
                "Attiva o disattiva il tracciamento dell'alcol, e scegli se i drink vengono contati in drink standard USA o unità britanniche. È disattivato per impostazione predefinita, quindi devi chiederlo esplicitamente. Disattivarlo di nuovo nasconde l'alcol da pasti, obiettivi e progressi e impedisce all'importatore di file di leggere la colonna dell'alcol di un file — nulla di già registrato viene eliminato, la tua esportazione CSV lo include comunque, e riappare se lo riattivi. Il cambiamento si applica dal tuo prossimo messaggio, senza bisogno di riavviare nulla.",
            params: {
                enabled:
                    "true per mostrare l'alcol in pasti, obiettivi e progressi, false per nasconderlo",
                drink_unit:
                    "Quale drink standard mostrare accanto ai grammi: <code>us</code> (14 g per drink) o <code>uk</code> (7,9 g per unità). Predefinito <code>us</code>; ciò che viene effettivamente memorizzato sono i grammi di etanolo puro.",
            },
            example: "Inizia a tracciare quanto bevo, in unità britanniche",
        },
        delete_account: {
            description:
                "Elimina permanentemente il tuo account e tutti i dati associati. È irreversibile — l'IA conferma sempre con te prima.",
            params: {},
            example: "Elimina il mio account e tutti i miei dati",
        },
    },
};

// Italian (it) translation of the /alternatives comparison-page copy. See
// src/copy/alternatives.ts for the full field-by-field documentation of
// this shape (AppCopy) and scripts/gen-alternatives.ts's App type doc
// comments for the accuracy rules (which apps are recognised by column
// name vs. need manual mapping, sniffed-then-confirmed dates/units,
// browser-side parsing, etc.) that still apply to this content wherever
// it now lives — every factual claim below is translated, not altered.
// Terminology kept consistent with src/copy/index.it.ts and
// src/copy/tools.it.ts: protein → proteine, carbs → carboidrati, fat →
// grassi, fiber → fibre, (total) sugar → zuccheri (totali), alcohol →
// alcol / grammi di etanolo puro, caffeine → caffeina, meal → pasto,
// import → importare/importazione, content fingerprint → impronta di
// contenuto, column mapping → mappatura delle colonne.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_IT: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Nessun server MCP, e alcune funzioni richiedono un piano a pagamento. Scopri l'alternativa gratuita e conversazionale.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Cerca in un database e scegli la voce giusta per ogni alimento",
            "Alcune funzioni, come lo scanner di codici a barre, richiedono un piano a pagamento",
            "Un'app e un account separati, con pubblicità nel piano gratuito",
        ],
        note: "MyFitnessPal è un'app valida con un database alimentare enorme. Questo non è una critica — è semplicemente un approccio diverso per chi preferisce parlare con la propria IA piuttosto che navigare in un tracker a colpi di tap.",
        migrate: {
            title: "Lasciarsi il database alle spalle",
            body: [
                "MyFitnessPal ha costruito il suo successo su uno dei più grandi database alimentari esistenti — decine di milioni di voci inserite dalla community. Quella scala è anche il suo attrito: per qualsiasi alimento scorri tra quasi-duplicati e devi indovinare quale voce è corretta. La registrazione conversazionale salta del tutto la ricerca — descrivi l'alimento e la tua IA stima le macro.",
                "Non devi abbandonare il tuo diario per farlo: un'esportazione CSV di MyFitnessPal si importa direttamente, particolarità comprese, così gli anni che hai già registrato ti seguono. Tutto ciò che registri da quel momento in poi è tuo, esportabile in CSV quando vuoi.",
                "Le funzioni che MyFitnessPal ha gradualmente spostato dietro Premium — scansione dei codici a barre, macro al grammo, nessuna pubblicità — qui sono semplicemente incluse. Non stai valutando un piano gratuito contro un upgrade da 20 dollari al mese; c'è un unico piano gratuito e open source, e l'unico account di cui hai bisogno è quello Claude o ChatGPT che hai già.",
            ],
        },
        importSection: {
            title: "Porta il diario con te",
            body: [
                "Anni di storico registrato sono il vero motivo per cui le persone restano, e non devi abbandonarli. Chiedi di importare e nella chat si apre un pannello di importazione: scegli il CSV esportato da MyFitnessPal, viene analizzato nel tuo browser, le colonne che riconosce vengono mappate automaticamente, e vedi cosa verrà aggiunto prima che venga scritto qualcosa. Quella corrispondenza copre calorie, proteine, carboidrati e grassi, più fibre, zuccheri totali e caffeina in milligrammi dove la tua esportazione contiene quelle colonne. Le righe non passano mai attraverso l'IA, quindi non c'è nulla che possa essere trascritto male.",
                "Un'esportazione di MyFitnessPal viene gestita per nome, particolarità incluse. Il file arriva con un byte-order mark che altrimenti corromperebbe l'intestazione della prima colonna; le sue note possono contenere interruzioni di riga dentro una cella tra virgolette, che una suddivisione ingenua per riga sminuzzerebbe insieme a ogni riga successiva; e il blocco di ogni giorno termina con una riga di totali che non deve diventare un pasto. Quella che conta di più: MyFitnessPal esporta una riga aggregata per pasto al giorno e nessuna colonna con il nome dell'alimento, quindi invece di scartare quelle righe per mancanza di descrizione, l'importatore riconosce la forma e le etichetta in base alla loro fascia — arrivano come \"Colazione (importata da MyFitnessPal)\".",
                "Le date vengono confermate, non presunte. Una colonna con 05/06/2024 è genuinamente indecidibile — maggio o giugno — quindi l'importatore ti mostra la sua lettura accanto a una riga reale del tuo file e ti lascia correggerla prima di scrivere. E ogni riga porta un'impronta di contenuto, così rieseguire lo stesso file segnala quei pasti come già registrati invece di duplicarli. Importa un'esportazione parziale, individua una colonna che hai mappato male, e semplicemente rifallo.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare il tuo storico e nella chat si apre un importatore: scegli il CSV esportato da MyFitnessPal, viene analizzato nel tuo browser anziché letto dall'IA, mappi o confermi le colonne, vedi un'anteprima di cosa verrà aggiunto e confermi. Calorie, proteine, carboidrati e grassi passano, così come fibre, zuccheri totali e caffeina quando la tua esportazione li include. L'esportazione di MyFitnessPal è riconosciuta per nome — incluso il suo byte-order mark, le sue righe di totali finali, e il fatto che scrive una riga aggregata per pasto al giorno senza nome dell'alimento, che vengono etichettate in base alla fascia del pasto. Reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP può scansionare i codici a barre come MyFitnessPal Premium?",
                a: "Sì, ed è gratuito. Invia il codice a barre di un prodotto e Nutrition MCP recupera le macro dell'etichetta da Open Food Facts — mentre MyFitnessPal ha spostato lo scanner di codici a barre dietro un abbonamento Premium a pagamento.",
            },
            {
                q: "Come funziona la registrazione senza il database alimentare di MyFitnessPal?",
                a: 'Descrivi cosa hai mangiato con parole tue — "una burrito bowl di pollo con riso extra" — e la tua IA stima calorie e macro. Non c\'è un database di milioni di voci create dalla community in cui cercare, né bisogno di indovinare quale sia accurata.',
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Nessun server MCP. Scopri il modo gratuito e conversazionale di tracciare calorie e macro dentro la tua IA.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Registra cercando nel suo database, una voce alla volta",
            "Alcune funzioni richiedono un piano Gold a pagamento",
            "Un'app separata da aprire ogni volta che mangi",
        ],
        note: "Cronometer è eccellente se vuoi una precisione profonda sui micronutrienti. Nutrition MCP adotta un approccio più leggero e conversazionale a calorie, macro e peso — direttamente dentro la tua IA.",
        migrate: {
            title: "Quando la precisione è tutto",
            body: [
                "Cronometer si è guadagnato la sua reputazione sulla precisione — database curati e tracciamento di oltre 80 micronutrienti, vitamine e minerali inclusi. Se è quella profondità sui micronutrienti il motivo per cui lo apri, sii onesto con te stesso: le stime conversazionali non eguaglieranno una voce di database di livello da laboratorio, grammo per grammo.",
                "Ma la maggior parte delle persone registra per mantenere calorie e macro entro un range, non per controllare l'assunzione di selenio. Quel range è più ampio di quanto sembri: oltre a proteine, carboidrati e grassi ottieni fibre, zuccheri totali e caffeina in milligrammi, e alcol facoltativo in grammi di etanolo se lo attivi. Per questo, descrivere un pasto alla tua IA è molto meno lavoro che cercare e pesare ogni componente — e ottieni comunque totali giornalieri, andamenti e un peso obiettivo da monitorare, gratuitamente.",
                "C'è anche una via di mezzo: siccome sei dentro un assistente IA, puoi chiedere l'angolazione sui micronutrienti quando davvero ti serve — \"quanto ferro e B12 c'erano approssimativamente nei pasti di oggi?\" — e ottenere una stima ragionata su richiesta, senza il peso di registrare ogni grammo su una voce curata per tutto il resto del tempo.",
            ],
        },
        importSection: {
            title: "Dieci anni di voci, conservati",
            body: [
                "La precisione è il motivo per cui usavi Cronometer, quindi un'importazione sciatta sarebbe peggio di nessuna importazione. Chiedi di importare e nella chat si apre un pannello: scegli il tuo CSV di Cronometer, viene analizzato nel tuo browser, e approvi un'anteprima prima che venga scritta anche solo una riga. I numeri vengono letti direttamente dal file — l'IA non vede mai le righe, quindi non può arrotondarne o trascriverne male una.",
                'La struttura dell\'esportazione di Cronometer è riconosciuta per nome. Divide il timestamp in colonne separate di data e ora, ed entrambe vengono lette, così una colazione registrata alle 07:12 mantiene il suo orario invece di finire a un mezzogiorno predefinito. Scrive una quantità con l\'unità di misura dentro la stessa cella — "58.00 g", "1.00 cup" — e un valore scritto in quel modo viene letto correttamente come il numero che è, non come nulla. E ripete l\'intestazione "Amount" più di una volta, quindi le colonne vengono identificate per posizione anziché per nome: i duplicati non possono scontrarsi silenziosamente, e il mappatore ti dice a quale stai puntando.',
                "Ecco cosa passa esattamente: data e ora, nome dell'alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina e note. Cronometer è l'unica esportazione di questo elenco che include una colonna Caffeine (mg), e arriva in milligrammi — l'unità in cui è già espressa, e quella in cui la caffeina viene memorizzata qui, quindi nulla viene convertito. Una colonna caffeina espressa in grammi viene invece lasciata non mappata, con il motivo mostrato, piuttosto che registrare 0,18 dove l'etichetta dice 180 mg. Zuccheri significa zuccheri totali, frutta e latte inclusi — non zuccheri aggiunti, che nessuna esportazione riporta in modo affidabile. La colonna separata \"Sugar Alcohols\" di Cronometer è un poliolo, non uno zucchero né un etanolo, e non può finire in nessuno dei due campi. L'alcol è un caso speciale: Cronometer lo esporta come alcol etilico in grammi, e passa solo se hai prima attivato il tracciamento dell'alcol qui, dato che è disattivato finché non lo fai. Le quantità di porzione e gli oltre 80 tra vitamine e minerali di Cronometer non passano affatto — quella profondità sui micronutrienti resta nell'esportazione propria di Cronometer. Reimportare è innocuo: ogni riga porta un'impronta di contenuto, quindi una seconda esecuzione dello stesso file segnala i pasti come già registrati invece di aggiungerli due volte.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e nella chat si apre un importatore: scegli il tuo CSV di Cronometer, viene analizzato nel tuo browser anziché letto dall'IA, e vedi un'anteprima di cosa verrà aggiunto prima di confermare. L'esportazione di Cronometer è riconosciuta per nome — le sue colonne separate di data e ora vengono entrambe lette, e la sua intestazione \"Amount\" ripetuta non può scontrarsi perché le colonne sono identificate per posizione. Data e ora, nome dell'alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina in milligrammi e note passano; l'alcol pure, ma solo se hai prima attivato il tracciamento dell'alcol. Vitamine, minerali e quantità di porzione no. Reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP traccia i micronutrienti come Cronometer?",
                a: "No. Il tracciamento di oltre 80 vitamine e minerali di Cronometer è la sua specialità, e Nutrition MCP non ha alcun dato sui micronutrienti — niente sodio, niente vitamine. Ciò che traccia sono calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina in milligrammi, alcol facoltativo, acqua e peso. Puoi comunque chiedere alla tua IA una stima approssimativa dei micronutrienti di un pasto, ma se ti serve una profondità di livello da laboratorio, Cronometer è la scelta più adatta.",
            },
            {
                q: "Nutrition MCP è preciso quanto Cronometer?",
                a: "Per calorie, macro, fibre e zuccheri, le stime conversazionali sono abbastanza precise per la maggior parte degli obiettivi — ma non eguaglieranno il database curato di Cronometer, grammo per grammo. Scambia un po' di precisione per uno sforzo di registrazione molto minore, il che è il compromesso giusto per la maggior parte delle persone.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Nessun server MCP. Registra i pasti parlando con Claude o ChatGPT invece — gratis.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Cerca e registra ogni alimento a mano",
            "Alcune funzioni, come la registrazione con foto, richiedono un piano a pagamento",
            "Un'altra app, un altro account, pubblicità nel piano gratuito",
        ],
        note: "Lose It! è un contacalorie amichevole. Nutrition MCP fa la stessa registrazione di base per conversazione, gratis, senza mai uscire da Claude o ChatGPT.",
        migrate: {
            title: "La stessa semplicità, meno l'app",
            body: [
                "Lose It! ha conquistato le persone mantenendo il conteggio delle calorie leggero e un po' gamificato, con la registrazione con foto Snap It come trucco principale. Nutrition MCP fa lo stesso trucco della foto — invia una foto del tuo piatto e la tua IA la legge — solo che vive dentro l'assistente con cui già chatti, quindi non c'è nessuna app separata da aprire.",
                "Se quello che ti piaceva di Lose It! era la registrazione a basso attrito e il feedback giornaliero rapido, ti sentirai a casa: dici cosa hai mangiato, ottieni indietro le calorie e le macro rimanenti, e vai avanti. Nessuna pubblicità, nessun upsell e nessun account da destreggiare.",
                "L'unica cosa a cui rinunci è lo strato di serie e badge che Lose It! usa per farti tornare. Se quella gamification è ciò che ti motiva, è un buon motivo per restare. Se ti è sempre sembrata rumore sopra la registrazione vera e propria, non ti mancherà — il numero del giorno è lì nella chat ogni volta che lo chiedi.",
            ],
        },
        importSection: {
            title: "Vengono anche i tuoi giorni registrati",
            body: [
                "Passare non significa ripartire da zero. Chiedi di importare e nella chat si apre un importatore: scegli il CSV esportato da Lose It!, viene analizzato nel tuo browser, le colonne che riconosce si mappano da sole — data, alimento, pasto, calorie, proteine, carboidrati e grassi, più fibre, zuccheri totali e caffeina dove la tua esportazione le contiene — e confermi un'anteprima di cosa verrà aggiunto. È una scelta del file e un'anteprima, non un esercizio di dettatura — su questo percorso l'IA non legge né ritrascrive mai le tue righe.",
                'Due particolarità di Lose It! vengono gestite deliberatamente. La sua esportazione porta un flag di eliminazione, e le righe segnate come eliminate vengono saltate anziché importate: farle tornare resusciterebbe cibo che hai rimosso apposta, e nessun totale nell\'anteprima lo rivelerebbe. Scrive anche la stringa letterale "n/a" per le celle senza valore, che viene letta come vuota anziché come zero — così una macro che non hai mai tracciato resta assente invece di essere registrata come uno 0 g reale che abbassa le tue medie.',
                "Eseguilo tutte le volte che vuoi. Ogni riga porta un'impronta di contenuto, quindi una ripetizione dell'importazione dello stesso file segnala i pasti come già registrati e non aggiunge nulla. E se le date della tua esportazione potessero essere lette in due modi — 05/06 essendo maggio o giugno — l'importatore mostra la sua lettura accanto a una riga del tuo file e ti chiede di confermarla prima di scrivere.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e nella chat si apre un importatore: scegli il CSV esportato da Lose It!, viene analizzato nel tuo browser anziché letto dall'IA, e confermi un'anteprima prima che venga scritto qualcosa. Data, alimento, pasto, calorie, proteine, carboidrati e grassi si mappano da soli, e così fanno fibre, zuccheri totali e caffeina quando la tua esportazione li contiene. L'esportazione di Lose It! è riconosciuta per nome — le righe segnate come eliminate vengono saltate anziché resuscitate, e le sue celle \"n/a\" vengono lette come vuote anziché come zeri. Reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP ha la registrazione con foto come lo Snap It di Lose It!?",
                a: "Sì — invia una foto del tuo piatto e la tua IA identifica il cibo e stima le macro, poi lo registra dopo la tua conferma. In Lose It! la registrazione con foto è dietro un piano a pagamento; con Nutrition MCP è gratis e funziona direttamente in chat.",
            },
            {
                q: "Posso contare le calorie allo stesso modo di come facevo in Lose It!?",
                a: "Sì. Il ciclo di base è identico — dici cosa hai mangiato e ottieni indietro all'istante le calorie e le macro rimanenti. La differenza è che parli con la tua IA invece di navigare a colpi di tap in un'app, e non ci sono pubblicità o upsell lungo il percorso.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Solo in abbonamento e nessun server MCP. Scopri l'alternativa gratuita che vive nella tua IA.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Un abbonamento a pagamento dopo la prova gratuita (nessun piano gratuito)",
            "Devi comunque aprire un'app separata per registrare ogni pasto",
            "Il suo coaching adattivo è il prodotto, non una registrazione senza sforzo",
        ],
        note: "Il coaching TDEE adattivo di MacroFactor è genuinamente valido. Se vuoi principalmente una registrazione delle macro veloce e gratuita dentro la tua IA, Nutrition MCP è una scelta più semplice e a costo zero.",
        migrate: {
            title: "Coaching contro registrazione",
            body: [
                "Il punto di forza di MacroFactor è il suo algoritmo: osserva la tua assunzione e il tuo peso registrati e ricalcola silenziosamente i tuoi target di calorie e macro ogni settimana — un coaching adattivo genuinamente intelligente del team di Stronger By Science. Quel coaching è il prodotto, ed è per questo che è solo in abbonamento.",
                'Nutrition MCP non esegue un algoritmo di coaching — ma siccome sei già dentro un assistente IA, puoi semplicemente chiederglielo. "Considerando le mie ultime tre settimane, dovrei aggiustare le calorie?" ti dà una risposta ragionata su richiesta. È un modello diverso: analisi quando la vuoi, in modo conversazionale, invece di un ricalcolo settimanale fisso — ed è gratis.',
                "Il compromesso onesto è disciplina contro flessibilità. Il ricalcolo settimanale di MacroFactor avviene che tu pensi o meno a chiederlo, il che ti mantiene onesto; il modello conversazionale si aggiusta solo quando lo solleciti. Se vuoi un algoritmo che guidi i tuoi numeri senza intervento, MacroFactor vale l'abbonamento. Se preferisci registrare gratis e tirare fuori l'analisi quando ti interessa, questo si adatta meglio.",
            ],
        },
        importSection: {
            title: "Il registro si sposta anche se il coaching no",
            body: [
                "Ciò che lasceresti è l'algoritmo, non i dati. Chiedi di importare e nella chat si apre un pannello: scegli la tua esportazione CSV di MacroFactor, viene analizzata nel tuo browser, le colonne che riconosce vengono mappate per te, e confermi un'anteprima prima che venga scritto qualcosa. Le righe non passano mai attraverso l'IA, quindi nulla viene trascritto male durante l'ingresso.",
                "L'esportazione di MacroFactor è riconosciuta per nome — la sua colonna della dimensione della porzione è il segnale rivelatore — e le sue colonne di data, alimento, pasto, calorie e macro si mappano da sole, fibre, zuccheri totali e caffeina incluse dove il file le contiene. Se la tua esportazione riporta l'energia in kilojoule anziché kilocalorie, quel valore viene convertito anziché memorizzato 4,184 volte troppo alto. Siccome una colonna semplicemente intitolata \"Calories\" può contenere l'una o l'altra unità, l'unità viene offerta come controllo accanto a un esempio concreto tratto dalla tua prima riga, così la confermi invece di fidarti di un'ipotesi che gonfierebbe silenziosamente ogni giorno.",
                "Quello storico è immediatamente utile, non solo archiviato. Una volta che settimane di assunzione e peso sono dentro, puoi fare la domanda a cui l'algoritmo di MacroFactor rispondeva secondo un calendario — \"considerando le ultime tre settimane, dovrei aggiustare le calorie?\" — e ottenere una risposta ragionata su richiesta. Una seconda importazione dello stesso file non cambia nulla, perché ogni riga porta un'impronta di contenuto e le ripetizioni tornano segnalate come già registrate.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e nella chat si apre un importatore: scegli la tua esportazione CSV di MacroFactor, viene analizzata nel tuo browser anziché letta dall'IA, e confermi un'anteprima prima che venga scritto qualcosa. L'esportazione di MacroFactor è riconosciuta per nome — le colonne di data, alimento, pasto, calorie, proteine, carboidrati e grassi si mappano da sole, insieme a fibre, zuccheri totali e caffeina quando il file le contiene — e se riporta l'energia in kilojoule viene convertita in kilocalorie una volta che confermi l'unità accanto a un esempio dal tuo stesso file. Reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP aggiusta i miei target calorici come MacroFactor?",
                a: 'Non automaticamente. Il ricalcolo settimanale e algoritmico di MacroFactor è la sua funzione principale a pagamento. Con Nutrition MCP lo chiedi tu — "in base alle mie ultime tre settimane di assunzione e peso, dovrei aggiustare le calorie?" — e la tua IA ragiona su richiesta, invece di un aggiornamento settimanale fisso.',
            },
            {
                q: "Nutrition MCP è davvero gratuito mentre MacroFactor è solo in abbonamento?",
                a: "Sì. Nutrition MCP è completamente gratuito e open source, senza prova-poi-pagamento e senza limiti di piano gratuito — a differenza di MacroFactor, che non ha piano gratuito e richiede un abbonamento dopo la prova. Ti serve solo un account Claude o ChatGPT.",
            },
        ],
        freeAnswer:
            "Sì. Nutrition MCP è completamente gratuito e open source, senza abbonamento — mentre MacroFactor richiede un abbonamento a pagamento dopo la sua prova gratuita. Ti serve solo un account Claude o ChatGPT per connetterti.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Nessun server MCP. Traccia pasti e macro per conversazione — gratuito e open source.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Cerca nel database ogni alimento che registri",
            "Alcune funzioni, come i piani alimentari, richiedono un piano PRO a pagamento",
            "Un'app e un account separati da gestire",
        ],
        note: "Yazio è un tracker curato con buoni piani alimentari. Nutrition MCP si concentra su una registrazione conversazionale senza sforzo che vive dentro Claude o ChatGPT — gratuita e open source.",
        migrate: {
            title: "Piani da una parte, registrazione dall'altra",
            body: [
                "Yazio abbina il tracciamento a piani alimentari strutturati, ricette e strumenti per il digiuno, curati per un pubblico europeo. Se un piano guidato è ciò che ti tiene sulla strada giusta, Yazio lo fa bene e Nutrition MCP non ci prova nemmeno — non è un'app di piani alimentari.",
                'Quello che fa è rendere senza sforzo la metà relativa alla registrazione. Invece di cercare nel database di Yazio ogni ingrediente, descrivi il piatto e la tua IA gestisce le macro — poi risponde a "come sto andando oggi?" nello stesso respiro. Abbinalo a qualsiasi piano alimentare tu già segua.',
                'Questo rende in realtà le due cose complementari anziché in competizione. Continua a seguire un piano Yazio, o qualsiasi piano, per il lato "cosa mangiare"; usa Nutrition MCP per il lato "sono rimasto in carreggiata", registrato per conversazione e gratis. L\'unico posto dove non aiuta sono i timer del digiuno — quello è territorio di Yazio, non di un registro nutrizionale.',
            ],
        },
        importSection: {
            title: "Porta il registro, mappa le colonne",
            body: [
                "Il tuo storico Yazio può passare, anche se dovrai fare un po' di lavoro. Chiedi di importare e nella chat si apre un pannello: scegli la tua esportazione CSV, viene analizzata nel tuo browser, e punti tu stesso le sue colonne su data, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina. Le esportazioni di quattro app — MyFitnessPal, Cronometer, Lose It! e MacroFactor — sono riconosciute dai nomi delle loro colonne; Yazio non è tra queste, quindi aspettati di impostare quella mappatura una volta sola. Tutto il resto dopo è uguale: un'anteprima di cosa verrà aggiunto, poi la tua conferma.",
                "Le particolarità europee che sconfiggono la maggior parte degli importatori sono gestite. Un file delimitato da punto e virgola i cui numeri usano decimali con la virgola — la forma che Excel produce in un locale tedesco o austriaco — viene letto correttamente, invece che il delimitatore venga scambiato per un punto decimale o ogni macro venga scalata di mille volte. Le intestazioni che il mappatore conosce non sono nemmeno solo in inglese: Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker e Koffein di un'esportazione tedesca sono tutte riconosciute, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese — fibra, sucres, zuccheri, suikers, cafeína, caffeina — così un file localizzato spesso arriva già parzialmente mappato, lasciandoti meno colonne da impostare a mano. Campi tra virgolette, interruzioni di riga dentro una cella, valori pressoché vuoti e righe di totali sparse sono gestiti anch'essi, e l'IA non legge mai il file, quindi nessun numero può essere trascritto male nel tragitto.",
                "Date ed energia vengono confermate, non indovinate. Una colonna in formato GG/MM/AAAA viene letta con il giorno per primo, e dove i valori genuinamente non possono risolvere l'ambiguità — 05/06 essendo maggio o giugno — l'importatore mostra la sua lettura accanto a una riga del tuo file così puoi correggerla. Se la colonna dell'energia è in kilojoule viene convertita in kilocalorie, con l'unità mostrata come controllo accanto a un esempio concreto. Reimportare lo stesso file non aggiunge nulla: ogni riga porta un'impronta di contenuto, quindi le ripetizioni tornano come già registrate.",
            ],
        },
        importFaq:
            "Sì, usando la mappatura manuale delle colonne. Chiedi di importare e nella chat si apre un importatore: scegli la tua esportazione CSV di Yazio, viene analizzata nel tuo browser anziché letta dall'IA, e punti tu stesso le sue colonne su data, alimento, pasto, calorie e macro — fibre, zuccheri totali e caffeina incluse. Yazio non è una delle quattro esportazioni riconosciute per nome delle colonne, quindi quella mappatura è un passaggio manuale una tantum, anche se le intestazioni che il mappatore già conosce (in tedesco, e per fibre, zuccheri e caffeina anche in spagnolo, francese, italiano e olandese) si compilano da sole. File europei delimitati da punto e virgola con decimali a virgola, date in formato GG/MM/AAAA e kilojoule sono tutti gestiti, e reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP include piani alimentari come Yazio PRO?",
                a: "No. I piani alimentari strutturati, le ricette e gli strumenti per il digiuno di Yazio sono il suo punto di forza, e Nutrition MCP non prova a sostituirli — gestisce la metà relativa alla registrazione. Molte persone continuano a seguire il loro piano Yazio (o qualsiasi altro) e semplicemente registrano di conseguenza qui, gratis.",
            },
            {
                q: "Posso registrare i pasti più velocemente che cercando nel database di Yazio?",
                a: 'Di solito sì. Invece di cercare nel database di Yazio ogni ingrediente e impostare le porzioni, descrivi il piatto finito una volta sola — "una ciotola di muesli con yogurt e frutti di bosco" — e la tua IA stima e registra le macro in un unico passaggio.',
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Nessun server MCP. Un modo più snello e gratuito per registrare il cibo dentro Claude o ChatGPT.",
        cons: [
            "Nessun server MCP — non può funzionare dentro Claude o ChatGPT",
            "Registra gli alimenti cercando nel suo database uno alla volta",
            "Alcune funzioni, come i piani alimentari, richiedono un piano a pagamento",
            "Un'altra app e un altro abbonamento da gestire",
        ],
        note: "Lifesum abbina il tracciamento a piani alimentari strutturati. Nutrition MCP è un modo più snello e gratuito per registrare calorie, macro e peso parlando con la tua IA.",
        migrate: {
            title: "Valutazioni che puoi semplicemente chiedere",
            body: [
                "Lifesum punta su struttura e feedback — piani alimentari, ricette e il suo sistema di valutazione del cibo che dà un punteggio a ciò che mangi. Nutrition MCP non assegna un badge ai tuoi alimenti, quindi se quel ciclo di punteggio è ciò che ti motiva, Lifesum ha un vantaggio lì.",
                'Il compromesso è la flessibilità: invece di una valutazione fissa, puoi chiedere alla tua IA "è una buona scelta per i miei obiettivi?" e ottenere una risposta vera, contestualizzata. La registrazione è una singola frase, gli andamenti e un peso obiettivo sono inclusi di serie, e non c\'è nessun piano premium che blocca le parti utili.',
                'Un badge ti dice che un alimento ha ottenuto 3 su 5; una conversazione ti dice perché, e cosa farci — "sostituisci metà del riso con verdure e questo rientra nella tua giornata". È la differenza tra un punteggio e un coach, e siccome Lifesum mette piani alimentari e parte del tracciamento dietro Premium, è l\'opzione gratuita delle due.',
            ],
        },
        importSection: {
            title: "Niente da ritrascrivere",
            body: [
                "Cambiare tracker significa spostare il tuo storico, e non devi ritrascrivere nemmeno una riga. Chiedi di importare e nella chat si apre un pannello: scegli la tua esportazione CSV di Lifesum, viene analizzata nel tuo browser, e punti tu stesso le sue colonne su data, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina. Le intestazioni di Lifesum non sono riconosciute per nome come quelle di MyFitnessPal, Cronometer, Lose It! e MacroFactor, quindi quella mappatura è un passaggio manuale una tantum — dopo di che vedi un'anteprima di cosa verrà aggiunto e confermi.",
                "Niente si nasconde dietro una supposizione. Il mappatore ti mostra il tuo stesso file — le sue intestazioni reali, le sue celle reali, e un conteggio in tempo reale delle righe che verranno create — così una colonna puntata sul campo sbagliato è visibile prima che venga scritto qualcosa, non scoperta dopo. Campi tra virgolette, interruzioni di riga dentro una cella, valori pressoché vuoti e righe di totali sono tutti gestiti, e siccome il file viene letto nel tuo browser l'IA non vede mai una riga che potrebbe trascrivere male.",
                "Le esportazioni europee sono coperte: un file delimitato da punto e virgola con decimali a virgola viene letto correttamente, le date in formato GG/MM/AAAA vengono convertite una volta confermato l'ordine, e i kilojoule diventano kilocalorie con l'unità mostrata accanto a un esempio concreto tratto dalla tua prima riga. Anche le intestazioni localizzate aiutano — Kalorien, Kohlenhydrate, Ballaststoffe o Koffein di un'esportazione tedesca si compilano da sole, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese — quindi la mappatura manuale è di solito più breve di quanto sembri. Esegui l'importazione due volte e nulla si duplica — ogni riga porta un'impronta di contenuto, quindi le ripetizioni vengono segnalate come già registrate.",
            ],
        },
        importFaq:
            "Sì, usando la mappatura manuale delle colonne. Chiedi di importare e nella chat si apre un importatore: scegli la tua esportazione CSV di Lifesum, viene analizzata nel tuo browser anziché letta dall'IA, e punti tu stesso le sue colonne su data, alimento, pasto, calorie e macro — fibre, zuccheri totali e caffeina incluse. Lifesum non è una delle quattro esportazioni riconosciute per nome delle colonne, quindi quella mappatura è un passaggio manuale una tantum, anche se le intestazioni che il mappatore già conosce si compilano da sole. File europei delimitati da punto e virgola con decimali a virgola, date in formato GG/MM/AAAA e kilojoule sono tutti gestiti, e reimportare lo stesso file non crea mai duplicati.",
        extraFaqs: [
            {
                q: "Nutrition MCP valuta il mio cibo come le valutazioni alimentari di Lifesum?",
                a: "No — non c'è nessun badge o punteggio numerico. Invece puoi chiedere alla tua IA \"è una buona scelta per i miei obiettivi?\" e ottenere una risposta contestuale che spiega i compromessi, anziché una valutazione fissa sull'alimento in sé.",
            },
            {
                q: "Nutrition MCP è gratuito senza un piano in stile Lifesum Premium?",
                a: "Sì. Nutrition MCP è completamente gratuito e open source, senza piano premium — mentre Lifesum mette piani alimentari e alcune funzioni di tracciamento dietro un abbonamento Premium. Ti serve solo un account Claude o ChatGPT per connetterti.",
            },
        ],
    },
};

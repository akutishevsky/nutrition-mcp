// Italian (it) translation of the /alternatives comparison-page copy. See
// src/copy/alternatives.ts for the full field-by-field documentation of
// this shape (AppCopy) and scripts/gen-alternatives.ts's App type doc
// comments for the accuracy rules (which apps are recognised by column
// name vs. need manual mapping, sniffed-then-confirmed dates/units,
// browser-side parsing, etc.) that still apply to this content wherever
// it now lives — every factual claim below is translated, not altered.
// Terminology follows .git/nm-i18n/glossary-it.md, src/copy/index.it.ts
// and src/copy/tools.it.ts: informal "tu", protein → proteine, carbs →
// carboidrati, fat → grassi, fiber → fibre, (total) sugar → zuccheri
// (totali), alcohol → alcol / grammi di etanolo, caffeine → caffeina,
// meal → pasto, tracking → monitoraggio, history → storico, import →
// importare/importazione, content fingerprint → impronta di contenuto,
// column mapping → abbinamento delle colonne (the mapper → la schermata di abbinamento).

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_IT: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Nessun server MCP ufficiale, e alcune funzioni richiedono un piano a pagamento. Scopri l'alternativa gratuita che funziona in chat.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Per ogni alimento devi cercare nel database e scegliere la voce giusta",
            "Alcune funzioni, come lo scanner dei codici a barre, richiedono un piano a pagamento",
            "Un'app e un account a parte, con pubblicità nel piano gratuito",
        ],
        note: "MyFitnessPal è un'app valida, con un database alimentare enorme. Non è una critica: è semplicemente un approccio diverso, per chi preferisce parlare con la propria IA piuttosto che toccare lo schermo cento volte in un'app.",
        migrate: {
            title: "Lasciarsi alle spalle il database",
            body: [
                "MyFitnessPal si è conquistato il suo pubblico con uno dei database alimentari più grandi in assoluto: decine di milioni di voci inserite dagli utenti. Proprio queste dimensioni, però, sono anche il suo limite: per qualunque alimento scorri tra voci quasi identiche e devi indovinare quale sia quella giusta. Registrando a parole, la ricerca sparisce del tutto: descrivi l'alimento e la tua IA ne stima le macro.",
                "Non devi abbandonare il tuo diario per farlo: l'esportazione CSV di MyFitnessPal si importa così com'è, con tutte le sue stranezze, e gli anni che hai già registrato vengono con te. Tutto ciò che registri da lì in poi è tuo, e puoi esportarlo in CSV quando vuoi.",
                "Le funzioni che MyFitnessPal ha via via riservato a Premium (scansione dei codici a barre, macro al grammo, niente pubblicità) qui sono semplicemente incluse. Non devi scegliere tra un piano gratuito e un upgrade da 20 dollari al mese: c'è un solo piano, gratuito e open source, e l'unica cosa nuova da configurare è un account gratuito, che crei al primo collegamento.",
            ],
        },
        importSection: {
            title: "Importa da CSV il tuo diario di MyFitnessPal",
            body: [
                "Anni di storico sono il vero motivo per cui si resta, e non devi rinunciarci. Chiedi di importare e in chat si apre il pannello dell'importatore: scegli il CSV esportato da MyFitnessPal, l'importatore lo legge nel tuo browser e abbina da solo le colonne che riconosce, e vedi cosa verrà aggiunto prima che venga scritto qualcosa. L'abbinamento copre calorie, proteine, carboidrati e grassi, più fibre, zuccheri totali e caffeina in milligrammi quando la tua esportazione contiene quelle colonne. Le righe non passano mai dall'IA, quindi non c'è nulla che possa trascrivere male.",
                "L'esportazione di MyFitnessPal viene riconosciuta per nome, stranezze comprese. Il file arriva con un byte-order mark che altrimenti rovinerebbe l'intestazione della prima colonna; le note possono contenere degli a capo dentro una cella tra virgolette, che una divisione ingenua per righe farebbe a pezzi insieme a tutte le righe successive; e il blocco di ogni giorno termina con una riga di totali che non deve diventare un pasto. La più importante: MyFitnessPal esporta una riga aggregata per pasto al giorno e nessuna colonna con il nome dell'alimento. Invece di scartare quelle righe perché prive di descrizione, l'importatore riconosce la struttura e le etichetta in base al pasto: arrivano come “Colazione (importata da MyFitnessPal)”.",
                "Sulle date non si tira a indovinare: le confermi tu. Una colonna con 05/06/2024 è davvero indecidibile (maggio o giugno?), quindi l'importatore ti mostra come l'ha letta accanto a una riga reale del tuo file e ti permette di correggerla prima di scrivere. E ogni riga porta un'impronta di contenuto: se importi di nuovo lo stesso file, quei pasti vengono segnalati come già registrati invece di essere duplicati, purché nel frattempo tu non abbia cambiato fuso orario. Hai importato un'esportazione parziale o abbinato male una colonna? Rifai semplicemente l'importazione.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare il tuo storico e in chat si apre l'importatore: scegli il CSV esportato da MyFitnessPal, che viene letto nel tuo browser e non dall'IA, abbini o verifichi le colonne, controlli l'anteprima di ciò che verrà aggiunto e confermi. Vengono importati calorie, proteine, carboidrati e grassi, e anche fibre, zuccheri totali e caffeina se la tua esportazione li include. L'esportazione di MyFitnessPal viene riconosciuta per nome, compresi il byte-order mark, le righe di totali in fondo e il fatto che scrive una riga aggregata per pasto al giorno senza il nome dell'alimento: queste righe vengono etichettate in base al pasto. Reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Nutrition MCP può scansionare i codici a barre come MyFitnessPal Premium?",
                a: "Sì, ed è gratis. Invia il codice a barre di un prodotto e Nutrition MCP recupera da Open Food Facts le macro riportate in etichetta, mentre MyFitnessPal ha riservato lo scanner dei codici a barre all'abbonamento Premium a pagamento.",
            },
            {
                q: "Come funziona la registrazione senza il database alimentare di MyFitnessPal?",
                a: "Descrivi a parole tue cosa hai mangiato, ad esempio “una burrito bowl di pollo con più riso”, e la tua IA stima calorie e macro. Non c'è un database con milioni di voci inserite dagli utenti da scorrere, né devi indovinare quale sia quella giusta.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Nessun server MCP ufficiale. Scopri il modo gratuito di monitorare calorie e macro parlando con la tua IA.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Registri cercando nel suo database, una voce alla volta",
            "Alcune funzioni richiedono il piano Gold a pagamento",
            "Un'app a parte da aprire ogni volta che mangi",
        ],
        note: "Cronometer è eccellente se cerchi la massima precisione sui micronutrienti. Nutrition MCP affronta calorie, macro e peso in modo più leggero e conversazionale, direttamente nella tua IA.",
        migrate: {
            title: "Quando la precisione è tutto",
            body: [
                "Cronometer si è fatto un nome con la precisione: database curati e monitoraggio di oltre 80 micronutrienti, vitamine e minerali compresi. Se lo apri proprio per questa profondità sui micronutrienti, sii onesto con te stesso: le stime fatte a parole non eguaglieranno, grammo per grammo, una voce di database di livello da laboratorio.",
                "Ma la maggior parte delle persone registra i pasti per tenere sotto controllo calorie e macro, non per verificare quanto selenio assume. E sotto controllo finiscono più cose di quanto sembri: oltre a proteine, carboidrati e grassi hai fibre, zuccheri totali e caffeina in milligrammi, più l'alcol in grammi di etanolo, facoltativo, se lo attivi. Per tutto questo, descrivere un pasto alla tua IA è molto meno faticoso che cercare e pesare ogni ingrediente, e hai comunque totali giornalieri, andamenti e un peso obiettivo da monitorare, gratis.",
                "C'è anche una via di mezzo: visto che sei dentro un assistente IA, puoi chiedere un'occhiata ai micronutrienti quando ti serve davvero (“quanto ferro e quanta B12 c'erano, più o meno, nei pasti di oggi?”) e avere su richiesta una stima ragionata, senza la fatica di registrare ogni grammo su una voce curata per tutto il resto del tempo.",
            ],
        },
        importSection: {
            title: "Dieci anni di voci, al sicuro",
            body: [
                "Hai scelto Cronometer per la sua precisione, quindi un'importazione approssimativa sarebbe peggio di nessuna importazione. Chiedi di importare e in chat si apre un pannello: scegli il CSV di Cronometer, l'importatore lo legge nel tuo browser e approvi un'anteprima prima che venga scritta anche una sola riga. I numeri vengono letti direttamente dal file: l'IA non vede mai le righe, quindi non può arrotondarne o ricopiarne male nessuna.",
                "La struttura dell'esportazione di Cronometer viene riconosciuta per nome. Il timestamp è diviso in due colonne, data e ora, e vengono lette entrambe: così una colazione registrata alle 07:12 mantiene il suo orario invece di finire a mezzogiorno per impostazione predefinita. Cronometer scrive la quantità con l'unità nella stessa cella (“58.00 g”, “1.00 cup”), e un valore scritto così viene comunque letto come il numero che è, non come un valore vuoto. Inoltre ripete l'intestazione “Amount” più di una volta, quindi le colonne vengono identificate per posizione e non per nome: i duplicati non possono sovrapporsi senza che tu te ne accorga, e la schermata di abbinamento ti dice quale delle due stai selezionando.",
                "Ecco esattamente cosa viene importato: data e ora, nome dell'alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina e note. Cronometer è l'unica esportazione di questo elenco con una colonna Caffeine (mg), e arriva in milligrammi: l'unità in cui è già espressa e quella in cui qui viene salvata la caffeina, quindi non serve alcuna conversione. Una colonna della caffeina intestata in grammi resta invece non abbinata, con il motivo indicato, anziché registrare 0,18 dove l'etichetta dice 180 mg. Zuccheri significa zuccheri totali, compresi quelli di frutta e latte, non zuccheri aggiunti, che nessuna esportazione riporta in modo affidabile. La colonna “Sugar Alcohols” di Cronometer riguarda i polioli, che non sono né zuccheri né etanolo, e non può finire in nessuno dei due campi. L'alcol è un caso a parte: Cronometer lo esporta come alcol etilico in grammi, e viene importato solo se qui hai prima attivato il monitoraggio dell'alcol, che resta disattivato finché non lo fai. Le quantità delle porzioni e gli oltre 80 tra vitamine e minerali di Cronometer non vengono importati affatto: quella profondità sui micronutrienti resta nell'esportazione di Cronometer. Reimportare non fa danni: ogni riga porta un'impronta di contenuto, quindi se importi di nuovo lo stesso file i pasti vengono segnalati come già registrati invece di essere aggiunti due volte, purché nel frattempo tu non abbia cambiato fuso orario.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e in chat si apre l'importatore: scegli il CSV di Cronometer, che viene letto nel tuo browser e non dall'IA, e controlli l'anteprima di ciò che verrà aggiunto prima di confermare. L'esportazione di Cronometer viene riconosciuta per nome: le colonne separate di data e ora vengono lette entrambe, e l'intestazione “Amount” ripetuta non crea conflitti perché le colonne sono identificate per posizione. Vengono importati data e ora, nome dell'alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina in milligrammi e note; anche l'alcol, ma solo se prima hai attivato il monitoraggio dell'alcol. Vitamine, minerali e quantità delle porzioni no. Reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Nutrition MCP monitora i micronutrienti come Cronometer?",
                a: "No. Il monitoraggio di oltre 80 vitamine e minerali è la specialità di Cronometer, mentre Nutrition MCP non ha alcun dato sui micronutrienti: niente sodio, niente vitamine. Monitora calorie, proteine, carboidrati, grassi, fibre, zuccheri totali, caffeina in milligrammi, alcol (facoltativo), acqua e peso. Puoi comunque chiedere alla tua IA una stima approssimativa dei micronutrienti di un pasto, ma se ti serve una precisione da laboratorio sui micronutrienti, Cronometer fa più al caso tuo.",
            },
            {
                q: "Nutrition MCP è preciso quanto Cronometer?",
                a: "No. I valori ottenuti a parole sono stime dell'IA e non eguagliano, grammo per grammo, il database curato di Cronometer: possono essere sbagliati, quindi verifica tutto ciò che conta. Per i prodotti confezionati, la ricerca del codice a barre usa invece i dati dell'etichetta di Open Food Facts, che però non sono verificati nemmeno loro. In cambio di un po' di precisione, registrare costa molta meno fatica.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Nessun server MCP ufficiale. Registra i pasti parlando con Claude o ChatGPT, gratis.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Cerchi e registri ogni alimento a mano",
            "Alcune funzioni, come la registrazione illimitata con le foto di Snap It, richiedono un piano a pagamento",
            "Un'altra app, un altro account, pubblicità nel piano gratuito",
        ],
        note: "Lose It! è un contacalorie semplice e piacevole da usare. Nutrition MCP fa la stessa registrazione di base, a parole e gratis, senza mai uscire da Claude o ChatGPT.",
        migrate: {
            title: "La stessa semplicità, senza l'app",
            body: [
                "Lose It! ha conquistato le persone rendendo il conteggio delle calorie leggero e un po' giocoso, con la registrazione tramite foto Snap It come funzione di punta. Anche Nutrition MCP sa registrare da una foto (invia una foto del piatto e la tua IA la interpreta), solo che vive dentro l'assistente con cui chatti già, quindi non c'è un'app a parte da aprire.",
                "Se di Lose It! ti piacevano la registrazione senza fatica e il riscontro rapido sulla giornata, ti sentirai a casa: dici cosa hai mangiato, ricevi calorie e macro rimanenti e passi oltre. Niente pubblicità, nessuna richiesta di upgrade.",
                "L'unica cosa a cui rinunci sono le serie di giorni consecutivi e i badge che Lose It! usa per farti tornare. Se è proprio questo aspetto da gioco a motivarti, è un buon motivo per restare. Se ti è sempre sembrato rumore di fondo rispetto alla registrazione vera e propria, non ti mancherà: il numero del giorno è lì in chat ogni volta che lo chiedi.",
            ],
        },
        importSection: {
            title: "Anche i giorni registrati vengono con te",
            body: [
                "Cambiare app non significa ripartire da zero. Chiedi di importare e in chat si apre l'importatore: scegli il CSV esportato da Lose It!, l'importatore lo legge nel tuo browser e le colonne che riconosce si abbinano da sole (data, alimento, pasto, calorie, proteine, carboidrati e grassi, più fibre, zuccheri totali e caffeina quando la tua esportazione li contiene), poi confermi un'anteprima di ciò che verrà aggiunto. Scegli il file e controlli l'anteprima: niente da dettare. Su questa strada l'IA non legge né ricopia mai le tue righe.",
                "Due particolarità di Lose It! sono gestite di proposito. La sua esportazione contiene un indicatore di eliminazione, e le righe segnate come eliminate vengono saltate invece che importate: riportarle indietro farebbe ricomparire alimenti che hai cancellato apposta, e nessun totale dell'anteprima lo farebbe notare. Inoltre scrive letteralmente “n/a” nelle celle senza valore, e queste vengono lette come vuote, non come zero: così una macro che non hai mai monitorato resta assente invece di essere registrata come un vero 0 g che abbassa le tue medie.",
                "Importa tutte le volte che vuoi. Ogni riga porta un'impronta di contenuto, quindi se ripeti l'importazione dello stesso file i pasti vengono segnalati come già registrati e non viene aggiunto nulla, purché nel frattempo tu non abbia cambiato fuso orario. E se le date della tua esportazione si possono leggere in due modi (05/06 può essere maggio o giugno), l'importatore ti mostra come le ha lette accanto a una riga del tuo file e ti chiede di confermare prima di scrivere.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e in chat si apre l'importatore: scegli il CSV esportato da Lose It!, che viene letto nel tuo browser e non dall'IA, e confermi un'anteprima prima che venga scritto qualcosa. Data, alimento, pasto, calorie, proteine, carboidrati e grassi si abbinano da soli, e lo stesso vale per fibre, zuccheri totali e caffeina quando la tua esportazione li contiene. L'esportazione di Lose It! viene riconosciuta per nome: le righe segnate come eliminate vengono saltate invece di ricomparire, e le celle “n/a” vengono lette come vuote, non come zeri. Reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Con Nutrition MCP posso registrare i pasti da una foto, come con Snap It di Lose It!?",
                a: "Sì: invia una foto del piatto e la tua IA riconosce il cibo, stima le macro e lo registra dopo che hai confermato i dettagli. Lose It! limita Snap It nel piano gratuito e lo sblocca senza limiti con Premium; con Nutrition MCP la registrazione con foto non costa nulla in più e funziona direttamente in chat, in qualsiasi app di IA in grado di leggere le immagini.",
            },
            {
                q: "Posso contare le calorie come facevo con Lose It!?",
                a: "Sì. Il meccanismo di base è identico: dici cosa hai mangiato e ricevi subito calorie e macro rimanenti. La differenza è che parli con la tua IA invece di toccare lo schermo cento volte in un'app, e lungo la strada non ci sono pubblicità né richieste di upgrade.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Solo in abbonamento e senza server MCP ufficiale. Scopri l'alternativa gratuita che funziona dentro la tua IA.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Un abbonamento a pagamento dopo la prova gratuita (nessun piano gratuito)",
            "Per registrare ogni pasto devi comunque aprire un'app a parte",
            "Il prodotto è il coaching adattivo, non una registrazione senza fatica",
        ],
        note: "Il coaching adattivo basato sul TDEE di MacroFactor è davvero valido. Se ti serve soprattutto registrare le macro in modo rapido e gratuito dentro la tua IA, Nutrition MCP è una scelta più semplice e a costo zero.",
        migrate: {
            title: "Coaching o registrazione",
            body: [
                "Il punto di forza di MacroFactor è il suo algoritmo: osserva quanto mangi e quanto pesi, in base a ciò che registri, e ogni settimana ricalcola in silenzio i tuoi obiettivi di calorie e macro. È un coaching adattivo davvero intelligente, firmato dal team di Stronger By Science. Il prodotto è quel coaching, ed è per questo che si usa solo in abbonamento.",
                "Nutrition MCP non esegue un algoritmo di coaching, ma visto che sei già dentro un assistente IA, puoi semplicemente chiedere. “Considerando le ultime tre settimane, dovrei modificare le calorie?” ti dà, quando vuoi, l'interpretazione della tua IA sui numeri che hai registrato: una stima da valutare, non un consiglio dietetico. Il modello è diverso: l'analisi arriva quando la chiedi, in chat, invece che con un ricalcolo settimanale fisso. Ed è gratis.",
                "Il compromesso, a essere onesti, è tra disciplina e flessibilità. Il ricalcolo settimanale di MacroFactor avviene che tu ci pensi o no, e questo ti tiene in riga; il modello conversazionale si adegua solo quando sei tu a chiederlo. Se vuoi un algoritmo che guidi i tuoi numeri senza che tu debba intervenire, MacroFactor vale l'abbonamento. Se preferisci registrare gratis e chiedere un'analisi quando ti interessa, questo fa più per te.",
            ],
        },
        importSection: {
            title: "Il diario si sposta, anche se il coaching resta",
            body: [
                "Quello che lasceresti è l'algoritmo, non i dati. Chiedi di importare e in chat si apre il pannello dell'importatore: scegli l'esportazione CSV di MacroFactor, l'importatore la legge nel tuo browser e abbina per te le colonne che riconosce, poi confermi un'anteprima prima che venga scritto qualcosa. Le righe non passano mai dall'IA, quindi durante l'importazione non viene trascritto male nulla.",
                "L'esportazione di MacroFactor viene riconosciuta per nome (la colonna della dimensione della porzione è il segno distintivo), e le colonne di data, alimento, pasto, calorie e macro si abbinano da sole, comprese fibre, zuccheri totali e caffeina quando il file le contiene. Se la tua esportazione riporta l'energia in kilojoule anziché in kilocalorie, il valore viene convertito invece di essere salvato 4,184 volte troppo alto. Dato che una colonna intitolata semplicemente “Calories” può contenere l'una o l'altra unità, l'unità ti viene proposta come opzione da controllare accanto a un esempio calcolato sulla tua prima riga: così la confermi tu, invece di fidarti di un'ipotesi che gonfierebbe di nascosto ogni giornata.",
                "Quello storico ti serve subito, non resta solo in archivio. Una volta importate settimane di pasti e pesate, puoi fare la domanda a cui l'algoritmo di MacroFactor rispondeva a scadenza fissa (“considerando le ultime tre settimane, dovrei modificare le calorie?”) e avere quando vuoi l'interpretazione della tua IA sui tuoi numeri: una stima, non un consiglio dietetico. Una seconda importazione dello stesso file non cambia nulla, perché ogni riga porta un'impronta di contenuto e le ripetizioni vengono segnalate come già registrate, purché nel frattempo tu non abbia cambiato fuso orario.",
            ],
        },
        importFaq:
            "Sì. Chiedi di importare e in chat si apre l'importatore: scegli l'esportazione CSV di MacroFactor, che viene letta nel tuo browser e non dall'IA, e confermi un'anteprima prima che venga scritto qualcosa. L'esportazione di MacroFactor viene riconosciuta per nome: data, alimento, pasto, calorie, proteine, carboidrati e grassi si abbinano da soli, insieme a fibre, zuccheri totali e caffeina quando il file li contiene. Se l'energia è in kilojoule, viene convertita in kilocalorie dopo che hai confermato l'unità accanto a un esempio preso dal tuo file. Reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Nutrition MCP adegua i miei obiettivi calorici come MacroFactor?",
                a: "Non in automatico. Il ricalcolo settimanale tramite algoritmo è la funzione principale, a pagamento, di MacroFactor. Con Nutrition MCP sei tu a chiedere (“in base alle mie ultime tre settimane di pasti e peso, dovrei modificare le calorie?”) e la tua IA ci ragiona quando vuoi, invece di un aggiornamento settimanale fisso.",
            },
            {
                q: "Nutrition MCP è davvero gratuito, mentre MacroFactor è solo in abbonamento?",
                a: "Sì. Nutrition MCP è completamente gratuito e open source: nessuna prova seguita da un pagamento, nessun limite da piano gratuito. MacroFactor invece non ha un piano gratuito e richiede un abbonamento al termine della prova. Ti servono un'app di IA che supporti MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei con Google o con email e password al primo collegamento.",
            },
        ],
        freeAnswer:
            "Sì. Nutrition MCP è completamente gratuito e open source, senza abbonamento, mentre MacroFactor richiede un abbonamento a pagamento al termine della prova gratuita. Ti servono un'app di IA che supporti MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei con Google o con email e password al primo collegamento.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Nessun server MCP ufficiale. Tieni traccia di pasti e macro in chat, gratis e open source.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Devi cercare nel database ogni alimento che registri",
            "Alcune funzioni, come i piani alimentari, richiedono il piano PRO a pagamento",
            "Un'app e un account in più da gestire",
        ],
        note: "Yazio è un'app curata, con buoni piani alimentari. Nutrition MCP punta su una registrazione senza fatica, tutta a parole, dentro Claude o ChatGPT: gratuita e open source.",
        migrate: {
            title: "Piani da una parte, registrazione dall'altra",
            body: [
                "Yazio affianca al monitoraggio piani alimentari strutturati, ricette e strumenti per il digiuno, curati per un pubblico europeo. Se è un piano guidato a tenerti in carreggiata, Yazio lo fa bene e Nutrition MCP non ci prova nemmeno: non è un'app di piani alimentari.",
                "Quello che fa è rendere facilissima la parte della registrazione. Invece di cercare ogni ingrediente nel database di Yazio, descrivi il piatto e la tua IA si occupa delle macro, e subito dopo ti risponde a “come sto andando oggi?”. Abbinalo a qualunque piano alimentare segui già.",
                "Così le due cose si completano invece di farsi concorrenza. Continua a seguire un piano Yazio, o qualsiasi altro, per la parte “cosa mangiare”; usa Nutrition MCP per la parte “sto rispettando il piano?”, registrando in chat e gratis. L'unico ambito in cui non ti aiuta sono i timer per il digiuno: quello è territorio di Yazio, non di un diario alimentare.",
            ],
        },
        importSection: {
            title: "Porta il diario, abbina le colonne",
            body: [
                "Il tuo storico di Yazio può venire con te, anche se un po' di lavoro tocca a te. Chiedi di importare e in chat si apre il pannello dell'importatore: scegli l'esportazione CSV, l'importatore la legge nel tuo browser e sei tu ad abbinare le colonne a data, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina. Le esportazioni di quattro app (MyFitnessPal, Cronometer, Lose It! e MacroFactor) vengono riconosciute dai nomi delle colonne; Yazio non è tra queste, quindi metti in conto di impostare l'abbinamento una volta. Dopo, tutto procede allo stesso modo: un'anteprima di ciò che verrà aggiunto, poi la tua conferma.",
                "Le stranezze europee che mettono in crisi la maggior parte degli importatori sono gestite. Un file separato da punto e virgola, con la virgola come separatore decimale (il formato che Excel produce con le impostazioni internazionali tedesche o austriache), viene letto correttamente, senza scambiare il separatore per un punto decimale né sbagliare ogni macro di un fattore mille. E le intestazioni che l'importatore conosce non sono solo in inglese: Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker e Koffein di un'esportazione tedesca vengono tutte riconosciute, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese (fibra, sucres, zuccheri, suikers, cafeína, caffeina). Così un file localizzato arriva spesso già in parte abbinato, e restano meno colonne da impostare a mano. Anche campi tra virgolette, a capo dentro una cella, valori quasi vuoti e righe di totali sparse sono gestiti, e l'IA non legge mai il file, quindi nessun numero può essere trascritto male lungo il percorso.",
                "Date ed energia vengono confermate, non indovinate. Una colonna in formato GG/MM/AAAA viene letta partendo dal giorno, e quando i valori non bastano davvero a sciogliere il dubbio (05/06 può essere maggio o giugno), l'importatore ti mostra come l'ha letta accanto a una riga del tuo file, così puoi correggerla. Se la colonna dell'energia è in kilojoule viene convertita in kilocalorie, con l'unità mostrata come opzione da controllare accanto a un esempio calcolato. Reimportare lo stesso file non aggiunge nulla: ogni riga porta un'impronta di contenuto, quindi le ripetizioni risultano già registrate, purché nel frattempo tu non abbia cambiato fuso orario.",
            ],
        },
        importFaq:
            "Sì, abbinando le colonne a mano. Chiedi di importare e in chat si apre l'importatore: scegli l'esportazione CSV di Yazio, che viene letta nel tuo browser e non dall'IA, e abbini tu le colonne a data, alimento, pasto, calorie e macro, comprese fibre, zuccheri totali e caffeina. Yazio non è tra le quattro esportazioni riconosciute dai nomi delle colonne, quindi l'abbinamento è un passaggio manuale da fare una volta sola; le intestazioni che l'importatore conosce già (in tedesco e, per fibre, zuccheri e caffeina, anche in spagnolo, francese, italiano e olandese) però si compilano da sole. File europei separati da punto e virgola con la virgola come separatore decimale, date in formato GG/MM/AAAA e kilojoule sono tutti gestiti, e reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Nutrition MCP include piani alimentari come Yazio PRO?",
                a: "No. I piani alimentari strutturati, le ricette e gli strumenti per il digiuno sono il punto di forza di Yazio, e Nutrition MCP non cerca di sostituirli: si occupa della parte della registrazione. Molte persone continuano a seguire il proprio piano Yazio (o qualsiasi altro) e qui registrano, gratis, ciò che mangiano per verificare di rispettarlo.",
            },
            {
                q: "Posso registrare i pasti più in fretta che cercandoli nel database di Yazio?",
                a: "Di solito sì. Invece di cercare ogni ingrediente nel database di Yazio e impostare le porzioni, descrivi una volta sola il piatto finito (“una ciotola di muesli con yogurt e frutti di bosco”) e la tua IA stima e registra le macro in un solo passaggio.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Nessun server MCP ufficiale. Un modo più snello e gratuito per registrare ciò che mangi in Claude o ChatGPT.",
        cons: [
            "Nessun server MCP ufficiale: non puoi registrare i pasti nel diario da Claude o ChatGPT",
            "Registri gli alimenti cercandoli uno per uno nel suo database",
            "Alcune funzioni, come i piani alimentari, richiedono un piano a pagamento",
            "Un'altra app e un altro abbonamento da gestire",
        ],
        note: "Lifesum affianca al monitoraggio piani alimentari strutturati. Nutrition MCP è un modo più snello e gratuito per registrare calorie, macro e peso parlando con la tua IA.",
        migrate: {
            title: "Il giudizio? Basta chiederlo",
            body: [
                "Lifesum punta su struttura e riscontri: piani alimentari, ricette e un sistema di valutazione che dà un punteggio a ciò che mangi. Nutrition MCP non assegna badge ai tuoi alimenti, quindi se è quel meccanismo di punteggi a motivarti, su questo Lifesum è un passo avanti.",
                "In cambio hai flessibilità: invece di un voto fisso, puoi chiedere alla tua IA “è una buona scelta per i miei obiettivi?” e ricevere una risposta vera, che tiene conto del contesto. Per registrare basta una frase, andamenti e peso obiettivo sono già inclusi, e nessun piano premium blocca le parti utili.",
                "Un badge ti dice che un alimento ha preso 3 su 5; una conversazione può spiegarti perché, nel contesto del tuo diario: “sostituisci metà del riso con delle verdure e il piatto rientra nella tua giornata”. E dato che Lifesum riserva a Premium i piani alimentari e parte del monitoraggio, delle due l'opzione gratuita è Nutrition MCP.",
            ],
        },
        importSection: {
            title: "Niente da ricopiare",
            body: [
                "Cambiare app significa spostare il tuo storico, e non devi ricopiarne nemmeno una riga. Chiedi di importare e in chat si apre il pannello dell'importatore: scegli l'esportazione CSV di Lifesum, l'importatore la legge nel tuo browser e sei tu ad abbinare le colonne a data, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina. Le intestazioni di Lifesum non vengono riconosciute per nome come quelle di MyFitnessPal, Cronometer, Lose It! e MacroFactor, quindi l'abbinamento è un passaggio manuale da fare una volta sola; dopo controlli l'anteprima di ciò che verrà aggiunto e confermi.",
                "Nessuna supposizione nascosta. La schermata di abbinamento ti mostra il tuo file: le sue vere intestazioni, le sue vere celle e il conteggio aggiornato delle righe che verranno create. Così una colonna abbinata al campo sbagliato si vede prima che venga scritto qualcosa, invece di scoprirlo dopo. Campi tra virgolette, a capo dentro una cella, valori quasi vuoti e righe di totali sono tutti gestiti e, visto che il file viene letto nel tuo browser, l'IA non vede mai una riga che potrebbe trascrivere male.",
                "Le esportazioni europee sono coperte: un file separato da punto e virgola con la virgola come separatore decimale viene letto correttamente, le date GG/MM/AAAA vengono convertite dopo che hai confermato l'ordine, e i kilojoule diventano kilocalorie, con l'unità mostrata accanto a un esempio calcolato sulla tua prima riga. Aiutano anche le intestazioni localizzate: Kalorien, Kohlenhydrate, Ballaststoffe o Koffein di un'esportazione tedesca si compilano da sole, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese. Per questo l'abbinamento manuale di solito è più breve di quanto sembri. Importa due volte e non si duplica nulla: ogni riga porta un'impronta di contenuto, quindi le ripetizioni vengono segnalate come già registrate, purché nel frattempo tu non abbia cambiato fuso orario.",
            ],
        },
        importFaq:
            "Sì, abbinando le colonne a mano. Chiedi di importare e in chat si apre l'importatore: scegli l'esportazione CSV di Lifesum, che viene letta nel tuo browser e non dall'IA, e abbini tu le colonne a data, alimento, pasto, calorie e macro, comprese fibre, zuccheri totali e caffeina. Lifesum non è tra le quattro esportazioni riconosciute dai nomi delle colonne, quindi l'abbinamento è un passaggio manuale da fare una volta sola, anche se le intestazioni che l'importatore conosce già si compilano da sole. File europei separati da punto e virgola con la virgola come separatore decimale, date in formato GG/MM/AAAA e kilojoule sono tutti gestiti, e reimportare lo stesso file non crea duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        extraFaqs: [
            {
                q: "Nutrition MCP dà un voto agli alimenti come Lifesum?",
                a: "No: non ci sono badge né punteggi numerici. Puoi invece chiedere alla tua IA “è una buona scelta per i miei obiettivi?” e ricevere una risposta contestualizzata che spiega pro e contro, anziché un voto fisso sull'alimento in sé.",
            },
            {
                q: "Nutrition MCP è gratuito, senza un piano tipo Lifesum Premium?",
                a: "Sì. Nutrition MCP è completamente gratuito e open source, senza piano premium, mentre Lifesum riserva piani alimentari e alcune funzioni di monitoraggio all'abbonamento Premium. Ti servono un'app di IA che supporti MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei con Google o con email e password al primo collegamento.",
            },
        ],
    },
};

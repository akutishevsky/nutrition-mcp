// Italian (it) translation of PRIVACY_EN / TERMS_EN from ./legal.ts.
//
// Register follows the same principle as PRIVACY_DE/TERMS_DE: informal
// "tu", not a shift into formal/legalistic Italian just because this is a
// legal document — matching src/copy/index.it.ts, tools.it.ts,
// alternatives.it.ts and chrome.it.ts. Terminology reused from those
// already-translated files: "open source" and "self-hosting" stay as
// English loanwords (site convention, e.g. "licenza MIT", "ospitalo tu
// stesso"), "Informativa sulla privacy" / "Termini di servizio" as the
// document titles (chrome.it.ts footer), "target giornalieri" / "peso
// obiettivo" for goal figures, "tracciamento dell'alcol" and "drink
// standard" for alcohol tracking, "codice a barre" for barcode, "fuso
// orario" for timezone, and "voci" for row-level entries. Quotation marks
// keep the &ldquo;/&rdquo; entities the English source and the rest of the
// site's Italian copy already use (see src/copy/alt-ui.it.ts) rather than
// switching to guillemets or the German low-quote convention.
//
// No human review pass (product decision, see git history) — this is
// exactly the page most worth a native-speaker legal review before it's
// relied on.

import type { LegalDoc } from "./legal.js";

const p = (html: string): { type: "p"; html: string } => ({
    type: "p",
    html,
});
const ul = (items: string[]): { type: "ul"; items: string[] } => ({
    type: "ul",
    items,
});

export const PRIVACY_IT: LegalDoc = {
    title: "Informativa sulla privacy",
    metaDescription:
        "Come Nutrition MCP gestisce i tuoi dati: cosa memorizziamo, come viene usato, dove si trova e come eliminare il tuo account e tutto ciò che contiene in qualsiasi momento.",
    ogDescription:
        "Come Nutrition MCP gestisce i tuoi dati: cosa memorizziamo, come viene usato, dove si trova e come eliminare il tuo account e tutto ciò che contiene in qualsiasi momento.",
    lastUpdated: "26 luglio 2026",
    backToHome: "Torna alla home",
    sections: [
        {
            heading: "Cosa raccogliamo",
            blocks: [
                p(
                    "Quando ti registri, memorizziamo il tuo <strong>indirizzo email</strong> e una password sottoposta a hashing sicuro tramite Supabase Auth. Se invece accedi con Google, riceviamo il tuo indirizzo email da Google e non vediamo mai una password.",
                ),
                p("Quando usi il servizio, memorizziamo:"),
                ul([
                    "<strong>Registri dei pasti</strong> — descrizione, tipo di pasto, calorie, macro, fibre, zuccheri totali, grammi di alcol, milligrammi di caffeina, note e timestamp. Le foto dei pasti vengono interpretate dalla tua IA e non vengono mai caricate né memorizzate da noi.",
                    "<strong>Registri dell'acqua</strong> — quantità, note e timestamp.",
                    "<strong>Registri del peso corporeo</strong> — peso, note e timestamp. Sono dati sanitari, trattati esattamente come il resto dei tuoi registri.",
                    "<strong>Obiettivi</strong> — i tuoi target giornalieri di calorie, proteine, carboidrati, grassi, fibre, zuccheri, alcol, caffeina e acqua, oltre al tuo peso obiettivo.",
                    "<strong>Impostazioni del profilo</strong> — il tuo fuso orario IANA, l'unità di peso preferita, se il tracciamento dell'alcol è attivato e in quale drink standard viene mostrato, e se i widget in chat sono abilitati.",
                    "<strong>Telemetria di utilizzo degli strumenti</strong> — per ogni chiamata a uno strumento MCP, quale strumento è stato eseguito, se ha avuto successo, quanto tempo ha impiegato, una categoria approssimativa dell'errore in caso di fallimento, l'ampiezza in giorni di qualsiasi intervallo di date richiesto, e l'id di sessione MCP. È collegata al tuo id account. Non include mai il contenuto dei tuoi registri.",
                ]),
                p(
                    "<strong>Anche l'alcol è un dato sanitario</strong>, e di un tipo più sensibile di un conteggio calorico, quindi funziona diversamente da tutto quanto sopra. Il tracciamento dell'alcol è disattivato per impostazione predefinita, e registriamo l'alcol solo quando proviene da te — un drink che registri, o una colonna in un file che importi. Niente viene dedotto per tuo conto. Disattivare l'impostazione fa due cose: l'importatore massivo smette di leggere la colonna dell'alcol dai file che carichi, e tutto il resto smette di mostrare l'alcol nei pasti, obiettivi, progressi e widget che vedi. Non è un interruttore di eliminazione. L'alcol che hai registrato direttamente resta comunque memorizzato, sia che l'impostazione sia attiva o disattivata, tutto ciò che è già stato memorizzato resta nel database, e appare comunque nel file dei pasti di qualsiasi esportazione tu faccia. Per rimuovere effettivamente un valore di alcol, elimina il pasto a cui appartiene, oppure elimina il tuo account.",
                ),
                p(
                    "Conserviamo inoltre i token di accesso e refresh OAuth e i codici di autorizzazione che permettono alla tua IA di restare connessa al tuo account.",
                ),
            ],
        },
        {
            heading: "Come li usiamo",
            blocks: [
                p(
                    "I tuoi dati su pasti, acqua, peso e obiettivi vengono usati esclusivamente per fornire il servizio di tracciamento nutrizionale. Non li <strong>vendiamo mai, non li condividiamo mai con terze parti e non li usiamo mai per pubblicità</strong>, né li inseriamo in alcun sistema pubblicitario o di profilazione.",
                ),
                p(
                    "Esistono due tipi di analisi, e nessuna delle due tocca il contenuto dei tuoi registri:",
                ),
                ul([
                    "<strong>Analisi del sito web.</strong> Queste pagine caricano Google Analytics, che ci fornisce statistiche aggregate sul traffico — visualizzazioni di pagina, referrer, geografia approssimativa, tipo di dispositivo. Funziona su ogni pagina, inclusa questa, e al momento non c'è alcun banner di consenso né alcuna anonimizzazione dell'IP, quindi Google riceve il tuo indirizzo IP come parte della misurazione standard. Se preferisci non essere misurato, un blocco tracker o le protezioni del tipo &ldquo;non tracciarmi&rdquo; del tuo browser lo impediranno.",
                    "<strong>Telemetria del server.</strong> Ogni chiamata a uno strumento MCP scrive una riga di telemetria di utilizzo — quale strumento è stato eseguito, se ha avuto successo, quanto tempo ha impiegato — collegata al tuo id account ma non a ciò che hai registrato. La usiamo per individuare strumenti lenti o difettosi. Non viene condivisa con nessuno, e viene eliminata insieme a tutto il resto quando elimini il tuo account.",
                ]),
                p(
                    "Poiché il sito carica font e icone da Google Fonts e jsDelivr, e la home page recupera il numero di star del progetto tramite l'API di GitHub, visitare queste pagine espone il tuo indirizzo IP a questi fornitori.",
                ),
            ],
        },
        {
            heading: "Dove sono memorizzati",
            blocks: [
                p(
                    'Tutti i dati sono memorizzati su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL). L\'autenticazione è gestita da Supabase Auth. Il server è ospitato su DigitalOcean.',
                ),
            ],
        },
        {
            heading: "Eliminazione dei dati",
            blocks: [
                p(
                    "Puoi eliminare il tuo account e tutti i dati associati in qualsiasi momento chiedendo alla tua IA di <strong>eliminare il tuo account</strong> mentre è connessa al server Nutrition MCP. Questa azione è immediata e irreversibile. Rimuove i tuoi registri di pasti, acqua e peso, gli obiettivi, le impostazioni del profilo, qualsiasi archivio di esportazione ancora in memoria, la tua telemetria di utilizzo degli strumenti, i tuoi token di accesso e l'account stesso. Questo include ogni valore di alcol che hai mai registrato, indipendentemente dal fatto che il tracciamento dell'alcol fosse attivato o meno.",
                ),
            ],
        },
        {
            heading: "Termini di servizio",
            blocks: [
                p(
                    "L'uso del servizio è disciplinato anche dai nostri <a href=\"/terms\" data-legal-link=\"terms\">Termini di servizio</a>, che coprono l'uso consentito, il fatto che nulla qui costituisce consiglio medico, e l'assenza di qualsiasi garanzia — il servizio viene fornito così com'è, gratuitamente, senza garanzie di disponibilità, accuratezza o idoneità a qualsiasi scopo.",
                ),
            ],
        },
    ],
};

export const TERMS_IT: LegalDoc = {
    title: "Termini di servizio",
    metaDescription:
        "I termini che regolano l'uso di Nutrition MCP — il tracker nutrizionale gratuito e open source e server MCP remoto per Claude e ChatGPT. Termini in linguaggio semplice su account, uso consentito, i tuoi dati e responsabilità.",
    ogDescription:
        "I termini che regolano l'uso di Nutrition MCP — il tracker nutrizionale gratuito e open source e server MCP remoto per Claude e ChatGPT.",
    lastUpdated: "26 luglio 2026",
    backToHome: "Torna alla home",
    sections: [
        {
            heading: "Accordo",
            blocks: [
                p(
                    "Questi termini regolano il tuo uso di Nutrition MCP (il &ldquo;servizio&rdquo;) — il sito web all'indirizzo nutrition-mcp.com e il server MCP remoto all'indirizzo <strong>https://nutrition-mcp.com/mcp</strong>. Creando un account o collegando una IA al server, accetti questi termini. Se non li accetti, ti preghiamo di non usare il servizio.",
                ),
            ],
        },
        {
            heading: "Il servizio",
            blocks: [
                p(
                    'Nutrition MCP è un tracker nutrizionale gratuito e open source che funziona come server MCP, e permette a IA come Claude e ChatGPT di registrare pasti, acqua e peso corporeo per tuo conto. Non c\'è alcun piano a pagamento, nessuna pubblicità e nessun costo per usare il servizio. Accettiamo donazioni volontarie su Patreon per aiutare a coprire i costi di hosting e database; sono un regalo, non un acquisto, e non danno diritto a funzionalità, piani o priorità di alcun tipo. Il codice sorgente è pubblicato sotto licenza MIT su <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> e sei libero di ospitarlo tu stesso.',
                ),
            ],
        },
        {
            heading: "Il tuo account",
            blocks: [
                p(
                    "Devi avere almeno 16 anni per usare il servizio. Non verifichiamo l'età, quindi creando un account confermi di soddisfare questo requisito. Sei responsabile di mantenere riservate le tue credenziali di accesso e di tutta l'attività che avviene con il tuo account. Fornisci un indirizzo email che controlli davvero — è l'unico modo per recuperare l'accesso.",
                ),
            ],
        },
        {
            heading: "Nessun consiglio medico",
            blocks: [
                p(
                    "Nutrition MCP è uno strumento di registrazione e reportistica, non un servizio sanitario. Nulla di ciò che produce — valori di calorie e macro, obiettivi, andamenti o qualsiasi commento aggiunto dalla tua IA — costituisce consiglio medico, nutrizionale o dietetico, e nulla di tutto ciò sostituisce un professionista qualificato. Consulta un medico o un dietologo prima di prendere decisioni sulla tua salute, specialmente se hai una condizione medica o una storia di disturbi alimentari.",
                ),
                p(
                    "Il servizio non è progettato per uso clinico e non dovrebbe essere usato da chi ha un disturbo alimentare attivo, o da chi è in gravidanza o sotto supervisione clinica per una condizione legata alla nutrizione, senza il coinvolgimento del proprio medico curante. Il tracciamento di calorie e macro può essere dannoso in queste situazioni. Se questo ti riguarda, parlane con il tuo medico curante prima di usarlo.",
                ),
                p(
                    "I valori nutrizionali sono <strong>stime</strong>. Provengono da modelli IA che interpretano le tue descrizioni e foto, da database di terze parti come Open Food Facts, e da qualsiasi cosa tu inserisca tu stesso. Possono essere sbagliati. Verifica tutto ciò che conta davvero.",
                ),
                p(
                    "Le foto dei pasti non vengono mai inviate al nostro server. La tua IA interpreta l'immagine dal proprio lato e ci invia solo il testo e i numeri risultanti — una descrizione, un tipo di pasto, calorie, macro, note, un codice a barre.",
                ),
            ],
        },
        {
            heading: "Uso consentito",
            blocks: [
                p("Utilizzando il servizio, ti impegni a non:"),
                ul([
                    "usarlo per scopi illegali o in violazione di qualsiasi legge o normativa applicabile;",
                    "tentare di accedere all'account o ai dati di un altro utente, o aggirare l'autenticazione, i limiti di frequenza o qualsiasi altro controllo tecnico;",
                    "sondare, scansionare, sovraccaricare o interrompere il servizio o l'infrastruttura su cui gira, anche tramite richieste massive automatizzate;",
                    "caricare contenuti illegali o che non hai il diritto di condividere;",
                    "rivendere il servizio ospitato o presentarlo come tuo;",
                    "usarlo per perseguire una restrizione calorica estrema, o per promuoverla, incoraggiarla o fare da coach a qualcun altro in tal senso.",
                ]),
                p(
                    "Il servizio ha limiti di frequenza per restare disponibile per tutti. Se hai bisogno di un volume maggiore, ospitalo tu stesso — è esattamente a questo che serve la licenza MIT.",
                ),
            ],
        },
        {
            heading: "I tuoi dati",
            blocks: [
                p(
                    'I tuoi registri restano tuoi. Li memorizziamo e li trattiamo per gestire il servizio per te, come descritto nella nostra <a href="/privacy" data-legal-link="privacy">Informativa sulla privacy</a>. Sei responsabile del contenuto che registri.',
                ),
                p(
                    "Puoi esportare il tuo <strong>registro dei pasti</strong> in CSV in qualsiasi momento chiedendo alla tua IA di esportare i tuoi pasti. L'esportazione copre solo i pasti — una riga per pasto con orario, fuso orario, tipo di pasto, descrizione, calorie, proteine, carboidrati, grassi, fibre, zuccheri, alcol, caffeina e note. L'alcol è incluso indipendentemente dal fatto che il tracciamento dell'alcol sia attivato per il tuo account. Acqua, peso, obiettivi e impostazioni non sono attualmente inclusi nell'esportazione. Il link di download che ti restituiamo è privato e scade dopo 60 minuti.",
                ),
                p(
                    "Registriamo anche una telemetria operativa di base su come viene usato il servizio: per ogni chiamata a uno strumento, il nome dello strumento, se ha avuto successo, quanto tempo ha impiegato, una categoria approssimativa dell'errore in caso di fallimento, la lunghezza di qualsiasi intervallo di date richiesto, e l'id di sessione. Queste righe sono collegate al tuo id account. Non contengono ciò che hai registrato — nessuna descrizione di cibo, nessuna caloria, nessun peso. Le usiamo per mantenere il servizio funzionante e per capire quali strumenti vale la pena migliorare, e vengono eliminate insieme a tutto il resto quando elimini il tuo account.",
                ),
                p(
                    "Puoi eliminare il tuo account e tutti i dati associati in qualsiasi momento chiedendo alla tua IA, mentre è connessa, di <strong>eliminare il tuo account</strong> — questa azione è immediata e irreversibile.",
                ),
            ],
        },
        {
            heading: "Disponibilità e modifiche",
            blocks: [
                p(
                    "Il servizio è offerto gratuitamente, senza alcun impegno di uptime e senza alcun accordo sul livello di servizio. Possiamo modificare, sospendere o interrompere qualsiasi parte di esso — inclusi strumenti, funzionalità e il server ospitato stesso — in qualsiasi momento e senza preavviso. Possiamo anche modificare o rimuovere contenuti che violano questi termini.",
                ),
            ],
        },
        {
            heading: "Servizi di terze parti",
            blocks: [
                p(
                    "Il servizio dipende da terze parti: Supabase per database, autenticazione e memorizzazione delle esportazioni, DigitalOcean per l'hosting, Open Food Facts per i dati dei codici a barre, e qualsiasi IA da cui ti colleghi.",
                ),
                p(
                    "Anche il sito web stesso usa Google Analytics per misurare il traffico, Google Fonts e la CDN jsDelivr per caricare font e icone, Google Sign-In se scegli quel metodo di accesso, e l'API di GitHub per mostrare il numero di star del progetto. Caricare una pagina effettua quindi richieste a questi servizi, che possono vedere il tuo indirizzo IP e il tuo browser.",
                ),
                p(
                    "I loro termini e la loro disponibilità sono cosa loro, e non ne siamo responsabili.",
                ),
            ],
        },
        {
            heading: "Nessuna garanzia",
            blocks: [
                p(
                    "Il servizio viene fornito <strong>&ldquo;così com'è&rdquo; e &ldquo;secondo disponibilità&rdquo;</strong>, senza garanzie di alcun tipo, esplicite o implicite, incluse eventuali garanzie implicite di commerciabilità, idoneità a uno scopo particolare, accuratezza o non violazione. Non garantiamo che il servizio sarà ininterrotto, sicuro, privo di errori, né che qualsiasi dato o valore nutrizionale che produce sia accurato. Lo usi a tuo rischio.",
                ),
            ],
        },
        {
            heading: "Limitazione di responsabilità",
            blocks: [
                p(
                    "Nella misura massima consentita dalla legge, non siamo responsabili per alcun danno indiretto, incidentale, speciale, consequenziale o esemplare, né per alcuna perdita di dati o profitti, derivanti da o in connessione con il tuo uso del servizio.",
                ),
            ],
        },
        {
            heading: "I tuoi diritti legali",
            blocks: [
                p(
                    "Alcune responsabilità non possono mai essere escluse, e non ci proviamo. Restiamo pienamente responsabili per morte o lesioni personali causate dalla nostra negligenza, e per frode o dichiarazioni fraudolente.",
                ),
                p(
                    "Mantieni inoltre ogni diritto che la legge ti riconosce come consumatore. Questi termini si affiancano a quei diritti e non li riducono. Dove una sezione sopra è in conflitto con un diritto a cui non puoi rinunciare, prevale il tuo diritto legale.",
                ),
            ],
        },
        {
            heading: "Cessazione",
            blocks: [
                p(
                    "Puoi smettere di usare il servizio in qualsiasi momento ed eliminare il tuo account come descritto sopra. Possiamo sospendere o terminare l'accesso che viola questi termini o che minaccia la stabilità o la sicurezza del servizio. Le sezioni &ldquo;Nessuna garanzia&rdquo;, &ldquo;Limitazione di responsabilità&rdquo; e &ldquo;I tuoi diritti legali&rdquo; restano valide anche dopo la cessazione.",
                ),
            ],
        },
        {
            heading: "Modifiche a questi termini",
            blocks: [
                p(
                    "Possiamo aggiornare questi termini di tanto in tanto. La versione attuale si trova sempre su questa pagina, con la data in alto che indica l'ultima modifica. Continuare a usare il servizio dopo un aggiornamento significa accettare i termini rivisti.",
                ),
            ],
        },
        {
            heading: "Clausola di salvaguardia",
            blocks: [
                p(
                    "Se una parte di questi termini risultasse inapplicabile, quella parte viene rimossa e il resto resta in vigore.",
                ),
            ],
        },
        {
            heading: "Contatti",
            blocks: [
                p(
                    'Domande su questi termini? Scrivi a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

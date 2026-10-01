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
    lastUpdated: "29 settembre 2026",
    backToHome: "Torna alla home",
    lead: "Come Nutrition MCP gestisce i tuoi dati: cosa memorizziamo, come viene usato, dove si trova e come eliminare il tuo account e tutto ciò che contiene in qualsiasi momento.",
    documentsLabel: "Documenti legali",
    tocLabel: "In questa pagina",
    sections: [
        {
            heading: "Cosa raccogliamo",
            blocks: [
                p(
                    "Quando ti registri, memorizziamo il tuo <strong>indirizzo email</strong> e una password sottoposta a hashing sicuro tramite Supabase Auth. Se invece accedi con Google, chiediamo a Google soltanto il tuo indirizzo email, e lo riceviamo insieme all'identificativo del tuo account Google, che Supabase Auth conserva per riconoscerti al prossimo accesso con Google. Non vediamo mai una password di Google. Gli account che hanno effettuato l'accesso con Google prima del 27 settembre 2026 possono conservare ancora il nome e l'immagine del profilo che Google aveva inviato allora; nessuna parte del servizio li legge o li mostra, tranne l'esportazione dei tuoi dati, e vengono eliminati insieme al tuo account.",
                ),
                p("Quando usi il servizio, memorizziamo:"),
                ul([
                    "<strong>Registri dei pasti</strong> — descrizione, tipo di pasto, calorie, macro, fibre, zuccheri totali, grammi di alcol, milligrammi di caffeina, note e timestamp. Le foto dei pasti vengono interpretate dalla tua IA e non vengono mai caricate né memorizzate da noi.",
                    "<strong>Registri dell'acqua</strong> — quantità, note e timestamp.",
                    "<strong>Registri del peso corporeo</strong> — peso, note e timestamp. Sono dati sanitari, trattati esattamente come il resto dei tuoi registri.",
                    "<strong>Obiettivi</strong> — i tuoi target giornalieri di calorie, proteine, carboidrati, grassi, fibre, zuccheri, alcol, caffeina e acqua, oltre al tuo peso obiettivo.",
                    "<strong>Impostazioni del profilo</strong> — il tuo fuso orario IANA, l'unità di peso preferita, se il tracciamento dell'alcol è attivato e in quale drink standard viene mostrato, se i widget in chat sono abilitati e la lingua in cui vengono mostrati.",
                    "<strong>Telemetria di utilizzo degli strumenti</strong> — per ogni chiamata a uno strumento MCP, quale strumento è stato eseguito, se ha avuto successo, quanto tempo ha impiegato, una categoria approssimativa dell'errore in caso di fallimento, l'ampiezza in giorni di qualsiasi intervallo di date richiesto, l'id di sessione MCP, la revisione del protocollo MCP con cui si è connessa la tua app di IA e il nome e la versione con cui quell'app si identifica (per esempio &ldquo;claude-ai/1.0&rdquo;), quando li invia. È collegata al tuo id account. Non include mai il contenuto dei tuoi registri.",
                    "<strong>Registro di esecuzione del server</strong> — per ogni richiesta al server: il metodo, il percorso, lo stato e il tempo di risposta, il tuo indirizzo IP privato della sua ultima parte e, per le richieste MCP, la revisione del protocollo e il nome e la versione che la tua app di IA dichiara. Per ogni chiamata a uno strumento registra inoltre il nome dello strumento, se ha avuto successo, quanto tempo ha impiegato e, in caso di fallimento, un breve codice di riferimento e il messaggio di errore, che può riportare un valore inviato dalla tua app di IA, come una data non valida. Quando la tua app di IA accede o rinnova la connessione, il registro ne annota l'esito, l'identificativo casuale ricevuto dalla tua app di IA quando si è registrata presso il nostro servizio di accesso e il sito verso cui ha chiesto di essere reindirizzata (per esempio claude.ai). Viene scritto nel registro di esecuzione del nostro fornitore di hosting, non contiene il tuo id account né il tuo indirizzo email e viene conservato solo brevemente: quel registro è un buffer circolare che sovrascrive le righe più vecchie man mano che arriva nuovo traffico.",
                ]),
                p(
                    "<strong>Anche l'alcol è un dato sanitario</strong>, e di un tipo più sensibile di un conteggio calorico, quindi funziona diversamente da tutto quanto sopra. Il tracciamento dell'alcol è disattivato per impostazione predefinita, e registriamo l'alcol solo quando proviene da te — un drink che registri, o una colonna in un file che importi. Niente viene dedotto per tuo conto. Disattivare l'impostazione fa due cose: l'importatore massivo smette di leggere la colonna dell'alcol dai file che carichi, e tutto il resto smette di mostrare l'alcol nei pasti, obiettivi, progressi e widget che vedi. Non è un interruttore di eliminazione. L'alcol che hai registrato direttamente resta comunque memorizzato, sia che l'impostazione sia attiva o disattivata, tutto ciò che è già stato memorizzato resta nel database, e appare comunque nel file dei pasti di qualsiasi esportazione tu faccia. Per rimuovere effettivamente un valore di alcol, elimina il pasto a cui appartiene, oppure elimina il tuo account.",
                ),
                p(
                    "Conserviamo inoltre i token di accesso e refresh OAuth e i codici di autorizzazione che permettono alla tua IA di restare connessa al tuo account; la durata di ciascuno è indicata in &ldquo;Per quanto tempo conserviamo i dati&rdquo;. Vengono memorizzati solo come hash unidirezionali.",
                ),
            ],
        },
        {
            heading: "Come li usiamo",
            blocks: [
                p(
                    "I tuoi dati su pasti, acqua, peso e obiettivi vengono usati esclusivamente per fornire il servizio di tracciamento nutrizionale e, in forma anonima e aggregata, le statistiche pubbliche della home page. Non li <strong>vendiamo mai, non li condividiamo mai con terze parti e non li usiamo mai per pubblicità</strong>, né li inseriamo in alcun sistema pubblicitario o di profilazione.",
                ),
                p(
                    "La home page e il feed pubblico di statistiche che la alimenta mostrano totali anonimi di tutto il sito — quanti pasti sono stati registrati, le loro calorie e i loro macronutrienti, l'acqua registrata e il peso netto perso sull'insieme degli account — e i fusi orari impostati nei profili, che la home page rappresenta su una mappa del mondo. Un fuso orario compare sulla mappa solo quando lo usano almeno tre profili, e nessun dato è collegato a una persona.",
                ),
                p(
                    'Quando tu o la tua IA cercate un codice a barre, il nostro server invia a <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> solo le cifre del codice a barre — mai il tuo account, la tua email o i tuoi registri — e conserva i dati del prodotto restituiti in una cache condivisa non collegata ad alcun utente.',
                ),
                p(
                    "Esistono due tipi di analisi, e nessuna delle due tocca il contenuto dei tuoi registri:",
                ),
                ul([
                    "<strong>Analisi del sito web.</strong> Con il tuo consenso, queste pagine caricano Google Analytics, che ci fornisce statistiche aggregate sul traffico — visualizzazioni di pagina, referrer, geografia approssimativa, tipo di dispositivo — e Microsoft Clarity, che registra come i visitatori usano il sito — clic, tocchi, scorrimento, movimenti del mouse — come registrazioni di sessione e mappe di calore, così vediamo dove le pagine confondono. Nessuno dei due viene caricato finché non accetti nel banner dei cookie; se rifiuti, non viene caricato nessuno dei due, e se il tuo browser invia un segnale Global Privacy Control, non viene caricato nessuno dei due a meno che tu non accetti di persona dal piè di pagina. Accettare autorizza solo l'archiviazione per l'analisi: l'archiviazione pubblicitaria e Google Signals restano disattivati. Google riceve il tuo indirizzo IP a ogni richiesta ma, secondo Google, non lo registra né lo conserva per i visitatori dell'UE, della Svizzera o del Regno Unito, e lo usa solo per ricavare una posizione approssimativa. Clarity maschera ciò che scrivi nei moduli e riceve anch'esso il tuo indirizzo IP e i dati del browser. Nessuno dei due è attivo nella pagina di accesso. Puoi revocare il consenso in qualsiasi momento con &ldquo;Impostazioni cookie&rdquo; nel piè di pagina, che elimina anche i cookie di analisi impostati da questo sito; la tua scelta viene conservata nella memoria locale del browser per un massimo di 6 mesi.",
                    "<strong>Telemetria del server.</strong> Ogni chiamata a uno strumento MCP scrive una riga di telemetria di utilizzo — quale strumento è stato eseguito, se ha avuto successo, quanto tempo ha impiegato, quale revisione del protocollo MCP e quale app di IA (con il nome e la versione che dichiara) hanno effettuato la chiamata — collegata al tuo id account ma non a ciò che hai registrato. La usiamo per individuare strumenti lenti o difettosi. Non viene condivisa con nessuno, e viene eliminata insieme a tutto il resto quando elimini il tuo account.",
                ]),
                p(
                    "Poiché il sito carica font e icone da Google Fonts e jsDelivr, visitare queste pagine espone il tuo indirizzo IP a questi fornitori. Il numero di star del progetto su GitHub lo recupera il nostro server, non il tuo browser, quindi GitHub non vede la tua visita.",
                ),
            ],
        },
        {
            heading: "Dove sono memorizzati",
            blocks: [
                p(
                    'Tutti i dati sono memorizzati su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) nell\'UE, nella regione Irlanda di AWS (eu-west-1). Anche l\'autenticazione e l\'archiviazione delle esportazioni sono gestite da Supabase nella stessa regione. Il server è ospitato su DigitalOcean a Francoforte, in Germania. Le richieste al sito e al server passano attraverso la rete di Cloudflare (usata dal nostro fornitore di hosting), che decifra la connessione e quindi tratta in transito tutto ciò che viene inviato al servizio o da esso, incluso il tuo indirizzo IP, e può impostare un cookie di protezione dai bot strettamente necessario (<code>__cf_bm</code>, 30 minuti).',
                ),
            ],
        },
        {
            heading: "Per quanto tempo conserviamo i dati",
            blocks: [
                p(
                    "I tuoi registri di pasti, acqua e peso, gli obiettivi, le impostazioni del profilo e la telemetria di utilizzo degli strumenti vengono conservati finché esiste il tuo account: nessuno di essi ha una scadenza propria o una cancellazione programmata. Quando elimini il tuo account, tutto questo viene eliminato immediatamente e in modo irreversibile, come descritto più sotto. Le uniche tracce che rimangono sono la riga di telemetria relativa all'eliminazione stessa, registrata senza il tuo id account; il registro di esecuzione del server di breve durata descritto sopra, che non contiene mai il tuo id account; i registri operativi del nostro fornitore di database, conservati per un periodo limitato (fino a 7 giorni con il nostro piano); e i suoi backup a rotazione, che scadono secondo il loro calendario.",
                ),
                p(
                    "Le credenziali di accesso hanno vita breve per scelta. La sessione della pagina di accesso dura 10 minuti ed è conservata nella memoria del server; è associata al tuo browser tramite un cookie strettamente necessario che contiene solo un valore casuale, scade dopo gli stessi 10 minuti e viene eliminato al termine dell'accesso. Per verificare la tua password o l'accesso con Google usiamo Supabase Auth, che ogni volta crea una sessione di accesso Supabase; non la usiamo mai e la chiudiamo immediatamente. Il codice di autorizzazione monouso consegnato alla tua app di IA scade dopo 10 minuti e viene eliminato non appena viene usato. Un token di accesso è valido per 24 ore (i pochi emessi fino al 27 settembre 2026 incluso scadono al più tardi il 6 ottobre 2026); un token di refresh è valido per 90 giorni e viene eliminato nel momento in cui viene usato per ottenere una nuova coppia. I token e i codici scaduti vengono eliminati automaticamente entro un'ora. Eliminando il tuo account vengono rimossi tutti immediatamente.",
                ),
                p(
                    "Gli archivi di esportazione hanno vita breve. Ogni nuova esportazione sovrascrive la precedente, e il file viene eliminato automaticamente non appena scade il suo link di download di 60 minuti: una pulizia viene eseguita ogni dieci minuti, quindi un archivio normalmente non resta in memoria per più di circa 70 minuti.",
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
            heading: "Contatti e i tuoi diritti",
            blocks: [
                p(
                    'Nutrition MCP è gestito da Anton Kutishevskyi, sviluppatore indipendente, che è il titolare del trattamento dei tuoi dati personali per questo servizio. Per qualsiasi questione sui tuoi dati o su questa informativa, scrivi a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Su quale base giuridica trattiamo i tuoi dati:"),
                ul([
                    "<strong>Il tuo account e i tuoi registri</strong> — per fornirti il servizio per cui hai creato l'account (esecuzione di un contratto). Pasti, peso e alcol sono dati sanitari, quindi li trattiamo sulla base del tuo consenso esplicito, che dai quando crei il tuo account e ogni volta che accedi (per un'app collegata prima che la pagina di accesso chiedesse questo consenso, registrando le voci fino al tuo prossimo accesso), e che puoi revocare in qualsiasi momento eliminando le voci o il tuo account.",
                    "<strong>Telemetria di utilizzo degli strumenti e registro di esecuzione del server</strong> — il nostro legittimo interesse a mantenere il servizio funzionante, veloce e sicuro (individuare strumenti difettosi, limitare gli abusi). Nessuno dei due contiene il contenuto dei tuoi registri.",
                    "<strong>Analisi del sito web</strong> — il tuo consenso, dato nel banner dei cookie e revocabile in qualsiasi momento con &ldquo;Impostazioni cookie&rdquo; nel piè di pagina.",
                ]),
                p(
                    "I tuoi diritti e come esercitarli — per la maggior parte non serve nemmeno un'email:",
                ),
                ul([
                    "<strong>Accesso e portabilità</strong> — chiedi alla tua IA di esportare i tuoi dati. Ricevi uno ZIP di file CSV con tutto ciò che conserviamo su di te: i registri di pasti, acqua e peso, i tuoi obiettivi, le tue impostazioni, i dati del tuo account (indirizzo email, metodi di accesso e date di accesso, oltre all'eventuale nome o immagine del profilo inviati da Google), la telemetria di utilizzo degli strumenti e le connessioni che mantengono collegate le tue app di IA — senza i token veri e propri. Restano esclusi: i valori che conserviamo solo sotto forma di hash unidirezionale per motivi di sicurezza (la tua password e i token delle tue connessioni), i dati di gestione interna come le chiavi di rilevamento dei duplicati, il log di runtime del server, che non contiene l'identificativo del tuo account, e i log a breve conservazione e i backup a rotazione dei nostri fornitori.",
                    "<strong>Rettifica</strong> — chiedi alla tua IA di correggere o eliminare qualsiasi voce di pasto, acqua o peso, o di modificare i tuoi obiettivi e le tue impostazioni.",
                    "<strong>Cancellazione</strong> — chiedi alla tua IA di eliminare il tuo account, che rimuove tutto in una volta.",
                    "<strong>Opposizione e limitazione</strong> — scrivici via email.",
                    "<strong>Reclamo</strong> — puoi proporre reclamo all'autorità di controllo per la protezione dei dati del paese in cui vivi o lavori. Ci farebbe piacere avere prima la possibilità di risolvere il problema.",
                ]),
                p(
                    "Tutto ciò che memorizziamo resta nella regione UE indicata sopra. Ciò che la tua IA legge tramite gli strumenti viene inviato al fornitore di quella IA, che può trovarsi al di fuori dell'UE; ciò avviene in base al tuo accordo con quel fornitore, non al nostro. Anche Cloudflare (la rete attraverso cui passa ogni richiesta), Google e Microsoft (analisi del sito web, Google Sign-In) e Google e jsDelivr (le richieste di font e icone descritte sopra) si trovano al di fuori dell'UE; quando ricevono dati personali al di fuori dell'UE, si basano sulle clausole contrattuali standard della Commissione europea o sull'EU–US Data Privacy Framework.",
                ),
                p(
                    'Il servizio non è destinato a chi ha meno di 16 anni, e i <a href="/terms" data-legal-link="terms">Termini di servizio</a> richiedono che tu abbia almeno 16 anni. Se ritieni che una persona più giovane abbia creato un account, scrivici e lo elimineremo.',
                ),
                p(
                    "Se questa informativa cambia, cambia anche la data in alto.",
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
    lastUpdated: "29 settembre 2026",
    backToHome: "Torna alla home",
    lead: "I termini che regolano l'uso di Nutrition MCP — il tracker nutrizionale gratuito e open source, nonché server MCP remoto per Claude e ChatGPT.",
    documentsLabel: "Documenti legali",
    tocLabel: "In questa pagina",
    sections: [
        {
            heading: "Accordo",
            blocks: [
                p(
                    "Questi termini regolano il tuo uso di Nutrition MCP (il &ldquo;servizio&rdquo;) — il sito web all'indirizzo nutrition-mcp.com e il server MCP remoto all'indirizzo <strong>https://nutrition-mcp.com/mcp</strong>. Creando un account o collegando una IA al server, accetti questi termini. Se non li accetti, ti preghiamo di non usare il servizio.",
                ),
                p(
                    "Il servizio è gestito da Anton Kutishevskyi, sviluppatore indipendente (&ldquo;noi&rdquo;).",
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
                p(
                    "Puoi usare il servizio solo dove il tuo fornitore di IA lo supporta e dove le leggi applicabili in materia di sanzioni e di controllo delle esportazioni lo consentono.",
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
                    "Puoi esportare tutti i tuoi dati in qualsiasi momento chiedendo alla tua IA di esportarli. L'esportazione è un archivio ZIP con file CSV per pasti, acqua, peso, obiettivi, impostazioni del profilo, dati dell'account, telemetria di utilizzo degli strumenti e app di IA collegate; l'alcol è incluso indipendentemente dal fatto che il tracciamento dell'alcol sia attivato. Il link di download che ti restituiamo è privato e scade dopo 60 minuti.",
                ),
                p(
                    "Registriamo anche una telemetria operativa di base su come viene usato il servizio: per ogni chiamata a uno strumento, il nome dello strumento, se ha avuto successo, quanto tempo ha impiegato, una categoria approssimativa dell'errore in caso di fallimento, la lunghezza di qualsiasi intervallo di date richiesto, l'id di sessione, la revisione del protocollo MCP con cui si è connessa la tua app di IA e il nome e la versione con cui quell'app si identifica. Queste righe sono collegate al tuo id account. Non contengono ciò che hai registrato — nessuna descrizione di cibo, nessuna caloria, nessun peso. Le usiamo per mantenere il servizio funzionante e per capire quali strumenti vale la pena migliorare, e vengono eliminate insieme a tutto il resto quando elimini il tuo account.",
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
                    "Il servizio dipende da terze parti: Supabase per database, autenticazione e memorizzazione delle esportazioni, DigitalOcean per l'hosting, Cloudflare (tramite il nostro fornitore di hosting) per la rete attraverso cui passa ogni richiesta, Open Food Facts per i dati dei codici a barre, e qualsiasi IA da cui ti colleghi.",
                ),
                p(
                    'Dati dei prodotti per codice a barre &copy; contributori di <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>; i dati sono disponibili con licenza <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Anche il sito web stesso usa, con il tuo consenso, Google Analytics e Microsoft Clarity per misurare il traffico e l'uso delle pagine, Google Fonts e la CDN jsDelivr per caricare font e icone, Google Sign-In se scegli quel metodo di accesso, e l'API di GitHub, che il nostro server (non il tuo browser) interroga per ottenere il numero di star del progetto, così nessun dato dei visitatori arriva a GitHub. Caricare una pagina effettua quindi richieste a Google Fonts e jsDelivr, che possono vedere il tuo indirizzo IP e il tuo browser; Google Analytics e Microsoft Clarity vengono contattati solo dopo che hai accettato l'analisi.",
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
                    'Domande su questi termini o sui tuoi dati? Scrivi a <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

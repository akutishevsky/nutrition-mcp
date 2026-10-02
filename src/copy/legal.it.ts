// Italian (it) translation of PRIVACY_EN / TERMS_EN from ./legal.ts.
//
// Register follows the same principle as PRIVACY_DE/TERMS_DE: informal
// "tu", not a shift into formal/legalistic Italian just because this is a
// legal document — matching src/copy/index.it.ts, tools.it.ts,
// alternatives.it.ts and chrome.it.ts. Terminology follows
// .git/nm-i18n/glossary-it.md and the other Italian copy files: "open
// source" stays an English loanword, "Informativa sulla privacy" /
// "Termini di servizio" as the document titles (chrome.it.ts footer),
// "obiettivi giornalieri" / "peso obiettivo" for goal figures,
// "monitoraggio dell'alcol" and "drink standard" for alcohol tracking,
// "codice a barre" for barcode, "fuso orario" for timezone, "voci" for
// row-level entries, "registro di esecuzione" for the runtime log and
// "dati relativi alla salute" (GDPR art. 9 wording) for health data.
// Quotation marks keep the &ldquo;/&rdquo; entities the English source
// uses. "Impostazioni cookie" must match chrome.it.ts consent.settings
// verbatim (pinned by src/site-copy.test.ts).
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
        "Come Nutrition MCP tratta i tuoi dati: cosa conserviamo, come li usiamo, dove si trovano e come eliminare quando vuoi il tuo account e tutto ciò che contiene.",
    ogDescription:
        "Come Nutrition MCP tratta i tuoi dati: cosa conserviamo, come li usiamo, dove si trovano e come eliminare quando vuoi il tuo account e tutto ciò che contiene.",
    lastUpdated: "2 ottobre 2026",
    backToHome: "Torna alla home",
    lead: "Come Nutrition MCP tratta i tuoi dati: cosa conserviamo, come li usiamo, dove si trovano e come eliminare quando vuoi il tuo account e tutto ciò che contiene.",
    documentsLabel: "Documenti legali",
    tocLabel: "In questa pagina",
    sections: [
        {
            heading: "Quali dati raccogliamo",
            blocks: [
                p(
                    "Quando ti registri, conserviamo il tuo <strong>indirizzo email</strong> e la tua password, protetta con un hash sicuro, tramite Supabase Auth. Se invece accedi con Google, a Google chiediamo soltanto il tuo indirizzo email, che riceviamo insieme all'identificativo che Google associa al tuo account: Supabase Auth conserva questo identificativo per riconoscerti al tuo prossimo accesso con Google. Non vediamo mai la tua password di Google. Gli account che hanno effettuato l'accesso con Google prima del 27 settembre 2026 possono contenere ancora il nome e l'immagine del profilo che Google aveva inviato allora; nessuna parte del servizio li legge o li mostra, tranne l'esportazione dei tuoi dati, e vengono eliminati insieme al tuo account.",
                ),
                p("Quando usi il servizio, conserviamo:"),
                ul([
                    "<strong>Registri dei pasti</strong>: descrizione, tipo di pasto, calorie, macro, fibre, zuccheri totali, grammi di alcol, milligrammi di caffeina, note, data e ora. Le foto dei pasti vengono interpretate dal tuo assistente IA e non vengono mai caricate sui nostri sistemi né conservate da noi.",
                    "<strong>Registri dell'acqua</strong>: quantità, note, data e ora.",
                    "<strong>Registri del peso corporeo</strong>: peso, note, data e ora. Sono dati relativi alla salute e vengono trattati esattamente come il resto dei tuoi registri.",
                    "<strong>Registri delle misure corporee</strong>: la zona misurata (vita, fianchi, collo, torace, spalle, braccio, avambraccio, coscia o polpaccio), il valore così come l'hai inserito e la sua unità (cm o in), note, data e ora. Sono dati relativi alla salute e vengono trattati esattamente come il resto dei tuoi registri.",
                    "<strong>Obiettivi</strong>: i tuoi obiettivi giornalieri di calorie, proteine, carboidrati, grassi, fibre, zuccheri, alcol, caffeina e acqua, oltre al tuo peso obiettivo.",
                    "<strong>Impostazioni del profilo</strong>: il tuo fuso orario IANA, l'unità di peso che preferisci, l'unità di lunghezza che preferisci per le misure corporee, se il monitoraggio dell'alcol è attivo e in quale drink standard viene espresso, se i widget in chat sono attivi e in quale lingua vengono mostrati.",
                    "<strong>Telemetria sull'uso degli strumenti</strong>: per ogni chiamata a uno strumento MCP, quale strumento è stato eseguito, se è andato a buon fine, quanto tempo ha impiegato, una categoria generica dell'errore in caso di fallimento, l'ampiezza in giorni dell'eventuale intervallo di date richiesto, l'ID della sessione MCP, la revisione del protocollo MCP con cui si è collegata la tua app di IA e, se li invia, il nome e la versione con cui quell'app si identifica (per esempio &ldquo;claude-ai/1.0&rdquo;). È collegata all'ID del tuo account. Non contiene mai il contenuto dei tuoi registri.",
                    "<strong>Registro di esecuzione del server</strong>: per ogni richiesta al server, il metodo, il percorso, lo stato e il tempo di risposta, il tuo indirizzo IP con l'ultima parte rimossa e, per le richieste MCP, la revisione del protocollo e il nome e la versione dichiarati dalla tua app di IA. Per ogni chiamata a uno strumento registra inoltre il nome dello strumento, se è andata a buon fine, quanto tempo ha impiegato e, in caso di fallimento, un breve codice di riferimento e il messaggio di errore, che può riportare un valore inviato dalla tua app di IA, come una data non valida. Quando la tua app di IA accede o rinnova la connessione, il registro annota l'esito, l'identificativo casuale assegnato alla tua app di IA quando si è registrata presso il nostro servizio di accesso e il sito verso cui ha chiesto di essere reindirizzata (per esempio claude.ai). Viene scritto nel registro di esecuzione del nostro fornitore di hosting, non contiene l'ID del tuo account né il tuo indirizzo email e viene conservato solo per poco tempo: quel registro è un buffer circolare che sovrascrive le righe più vecchie man mano che arriva nuovo traffico.",
                ]),
                p(
                    "<strong>Anche l'alcol è un dato relativo alla salute</strong>, e più delicato di un conteggio delle calorie, per questo funziona in modo diverso da tutto quanto sopra. Il monitoraggio dell'alcol è disattivato per impostazione predefinita e registriamo l'alcol solo quando sei tu a fornirlo: un drink che registri o una colonna di un file che importi. Nulla lo deduce al posto tuo. Disattivare l'impostazione ha due effetti: l'importazione in blocco smette di leggere la colonna dell'alcol dai file che carichi, e il resto del servizio smette di mostrare l'alcol nei pasti, negli obiettivi, nei progressi e nei widget che vedi. Non è un comando di eliminazione. L'alcol che registri direttamente viene salvato in ogni caso, che l'impostazione sia attiva o no; tutto ciò che è già salvato resta nel database e compare comunque nel file dei pasti di ogni esportazione che fai. Per rimuovere davvero un valore di alcol, elimina il pasto a cui appartiene oppure elimina il tuo account.",
                ),
                p(
                    "Conserviamo inoltre i token di accesso e di aggiornamento (refresh) OAuth e i codici di autorizzazione che permettono al tuo assistente IA di restare collegato al tuo account; la durata di ciascuno è indicata in &ldquo;Per quanto tempo conserviamo i dati&rdquo;. Vengono conservati solo sotto forma di hash unidirezionali.",
                ),
            ],
        },
        {
            heading: "Come li usiamo",
            blocks: [
                p(
                    "I tuoi dati su pasti, acqua, peso, misure corporee e obiettivi vengono usati esclusivamente per fornire il servizio di monitoraggio nutrizionale e, in forma anonima e aggregata, per le statistiche pubbliche della home page. Non li <strong>vendiamo mai, non li condividiamo mai con terze parti e non li usiamo mai a fini pubblicitari</strong>, né li inseriamo in sistemi pubblicitari o di profilazione.",
                ),
                p(
                    "La home page e il feed pubblico di statistiche da cui attinge mostrano totali anonimi dell'intero sito (quanti pasti sono stati registrati, le relative calorie e macro, l'acqua registrata e il peso netto perso su tutti gli account) e i fusi orari impostati nei profili, che la home page rappresenta su una mappa del mondo. Un fuso orario compare sulla mappa solo quando lo usano almeno tre profili, e nessun dato è riconducibile a una persona.",
                ),
                p(
                    'Quando tu o il tuo assistente IA cercate un codice a barre, il nostro server invia a <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> solo le cifre del codice a barre (mai il tuo account, la tua email o i tuoi registri) e conserva i dati del prodotto restituiti in una cache condivisa, non collegata ad alcun utente.',
                ),
                p(
                    "Esistono due tipi di analisi, e nessuno dei due riguarda il contenuto dei tuoi registri:",
                ),
                ul([
                    "<strong>Analisi del sito web.</strong> Con il tuo consenso, queste pagine caricano Google Analytics, che ci fornisce statistiche aggregate sul traffico (visualizzazioni di pagina, siti di provenienza, area geografica approssimativa, tipo di dispositivo), e Microsoft Clarity, che registra come i visitatori usano il sito (clic, tocchi, scorrimento, movimenti del mouse) sotto forma di registrazioni delle sessioni e mappe di calore, così vediamo in quali punti le pagine creano confusione. Nessuno dei due viene caricato finché non dai il consenso nel banner dei cookie; se rifiuti, non se ne carica nessuno; e se il tuo browser invia un segnale Global Privacy Control, nessuno dei due si carica finché non sei tu ad acconsentire dal piè di pagina. Il consenso autorizza solo l'archiviazione a fini di analisi: l'archiviazione a fini pubblicitari e Google Signals restano disattivati. Google riceve il tuo indirizzo IP a ogni richiesta ma, secondo quanto dichiara, non lo registra né lo conserva per i visitatori dell'UE, della Svizzera e del Regno Unito, e lo usa solo per ricavare una posizione approssimativa. Clarity maschera ciò che scrivi nei moduli e riceve anch'esso il tuo indirizzo IP e i dati del browser. Nessuno dei due è attivo nella pagina di accesso. Puoi revocare il consenso in qualsiasi momento con &ldquo;Impostazioni cookie&rdquo; nel piè di pagina, che elimina anche i cookie di analisi impostati da questo sito; la tua scelta viene conservata nella memoria locale del browser per un massimo di 6 mesi.",
                    "<strong>Telemetria del server.</strong> Ogni chiamata a uno strumento MCP scrive una riga di telemetria d'uso (quale strumento è stato eseguito, se è andato a buon fine, quanto tempo ha impiegato, quale revisione del protocollo MCP e quale app di IA, con il nome e la versione che dichiara, hanno effettuato la chiamata), collegata all'ID del tuo account ma non a ciò che hai registrato. La usiamo per individuare gli strumenti lenti o difettosi. Non viene condivisa con nessuno e viene eliminata insieme a tutto il resto quando elimini il tuo account.",
                ]),
                p(
                    "Poiché il sito carica font e icone da Google Fonts e jsDelivr, visitando queste pagine il tuo indirizzo IP viene comunicato a questi fornitori. Il numero di stelle del progetto su GitHub viene recuperato dal nostro server, non dal tuo browser, quindi GitHub non vede mai la tua visita.",
                ),
            ],
        },
        {
            heading: "Dove vengono conservati",
            blocks: [
                p(
                    'Tutti i dati sono conservati su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) nell\'UE, nella regione AWS di Irlanda (eu-west-1). Anche l\'autenticazione e l\'archiviazione delle esportazioni sono gestite da Supabase nella stessa regione. Il server è ospitato da DigitalOcean a Francoforte, in Germania. Le richieste al sito e al server passano attraverso la rete di Cloudflare (usata dal nostro fornitore di hosting), che decifra la connessione e quindi gestisce in transito tutto ciò che viene inviato al servizio o che ne proviene, compreso il tuo indirizzo IP, e può impostare un cookie di protezione dai bot strettamente necessario (<code>__cf_bm</code>, 30 minuti).',
                ),
            ],
        },
        {
            heading: "Per quanto tempo conserviamo i dati",
            blocks: [
                p(
                    "I tuoi registri di pasti, acqua, peso e misure corporee, gli obiettivi, le impostazioni del profilo e la telemetria sull'uso degli strumenti vengono conservati finché esiste il tuo account: nessuno di questi dati ha una scadenza propria o una cancellazione programmata. Quando elimini il tuo account, tutto viene eliminato immediatamente e in modo irreversibile, come descritto più avanti. Le uniche tracce che restano sono la riga di telemetria relativa all'eliminazione stessa, registrata senza l'ID del tuo account; il registro di esecuzione del server a breve conservazione descritto sopra, che non contiene mai l'ID del tuo account; i registri operativi del nostro fornitore di database, conservati per un periodo limitato (fino a 7 giorni con il nostro piano); e i suoi backup a rotazione, che scadono secondo il loro calendario.",
                ),
                p(
                    "Le credenziali di accesso hanno volutamente una durata breve. La sessione della pagina di accesso dura 10 minuti ed è conservata nella memoria del server; è associata al tuo browser da un cookie strettamente necessario che contiene solo un valore casuale, scade dopo gli stessi 10 minuti e viene eliminato al termine dell'accesso. Per verificare la tua password o l'accesso con Google usiamo Supabase Auth, che ogni volta crea una sessione di accesso Supabase: non la usiamo mai e la chiudiamo immediatamente. Il codice di autorizzazione monouso consegnato alla tua app di IA scade dopo 10 minuti e viene eliminato non appena viene usato. Un token di accesso è valido per 24 ore (i pochi emessi fino al 27 settembre 2026 incluso scadono al più tardi il 6 ottobre 2026); un token di aggiornamento è valido per 90 giorni e viene eliminato nel momento in cui viene usato per ottenere una nuova coppia di token. I token e i codici scaduti vengono eliminati automaticamente entro un'ora. Se elimini il tuo account, vengono rimossi tutti immediatamente.",
                ),
                p(
                    "Gli archivi di esportazione hanno vita breve. Ogni nuova esportazione sovrascrive la precedente e il file viene eliminato automaticamente una volta scaduto il suo link di download, valido 60 minuti: una pulizia viene eseguita ogni dieci minuti, quindi di norma un archivio non resta nello spazio di archiviazione per più di circa 70 minuti.",
                ),
            ],
        },
        {
            heading: "Eliminazione dei dati",
            blocks: [
                p(
                    "Puoi eliminare il tuo account e tutti i dati associati in qualsiasi momento chiedendo al tuo assistente IA di <strong>eliminare il tuo account</strong> mentre è collegato al server Nutrition MCP. L'operazione è immediata e irreversibile. Rimuove i tuoi registri di pasti, acqua, peso e misure corporee, gli obiettivi, le impostazioni del profilo, qualsiasi archivio di esportazione ancora presente nello spazio di archiviazione, la tua telemetria sull'uso degli strumenti, i tuoi token di accesso e l'account stesso. Sono compresi tutti i valori di alcol che tu abbia mai registrato, indipendentemente dal fatto che il monitoraggio dell'alcol fosse attivo o no.",
                ),
            ],
        },
        {
            heading: "Contatti e i tuoi diritti",
            blocks: [
                p(
                    'Nutrition MCP è gestito da Anton Kutishevskyi, sviluppatore indipendente, che è il titolare del trattamento dei tuoi dati personali per questo servizio. Per qualsiasi domanda sui tuoi dati o su questa informativa, scrivi ad <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Su quale base giuridica trattiamo i tuoi dati:"),
                ul([
                    "<strong>Il tuo account e i tuoi registri</strong>: per fornirti il servizio a cui ti sei iscritto (esecuzione di un contratto). Pasti, peso, misure corporee e alcol sono dati relativi alla salute, quindi li trattiamo sulla base del tuo consenso esplicito, che dai quando crei il tuo account e ogni volta che accedi (se la tua app era già collegata prima che la pagina di accesso chiedesse questo consenso, lo dai registrando le voci fino al tuo prossimo accesso) e che puoi revocare in qualsiasi momento eliminando le voci o il tuo account.",
                    "<strong>Telemetria sull'uso degli strumenti e registro di esecuzione del server</strong>: il nostro legittimo interesse a mantenere il servizio funzionante, veloce e sicuro (individuare gli strumenti difettosi, limitare gli abusi con limiti di frequenza). Nessuno dei due contiene il contenuto dei tuoi registri.",
                    "<strong>Analisi del sito web</strong>: il tuo consenso, dato nel banner dei cookie e revocabile in qualsiasi momento con &ldquo;Impostazioni cookie&rdquo; nel piè di pagina.",
                ]),
                p(
                    "I tuoi diritti e come esercitarli (per la maggior parte non serve nemmeno un'email):",
                ),
                ul([
                    "<strong>Accesso e portabilità</strong>: chiedi al tuo assistente IA di esportare i tuoi dati. Ricevi uno ZIP di file CSV con tutto ciò che conserviamo su di te: i registri di pasti, acqua, peso e misure corporee, i tuoi obiettivi, le tue impostazioni, i dati del tuo account (indirizzo email, metodi e date di accesso, più l'eventuale nome o immagine inviati da Google), la telemetria sull'uso degli strumenti e le connessioni che mantengono l'accesso delle tue app di IA, senza i token veri e propri. Restano esclusi: i valori che conserviamo solo sotto forma di hash unidirezionale per motivi di sicurezza (la tua password e i token delle tue connessioni), i dati di gestione interna come le chiavi per il rilevamento dei duplicati, il registro di esecuzione del server, che non contiene l'ID del tuo account, e i registri a breve conservazione e i backup a rotazione dei nostri fornitori.",
                    "<strong>Rettifica</strong>: chiedi al tuo assistente IA di correggere o eliminare qualsiasi voce di pasto, acqua, peso o misura corporea, o di modificare i tuoi obiettivi e le tue impostazioni.",
                    "<strong>Cancellazione</strong>: chiedi al tuo assistente IA di eliminare il tuo account; così rimuovi tutto in una volta.",
                    "<strong>Opposizione e limitazione</strong>: scrivici un'email.",
                    "<strong>Reclamo</strong>: puoi proporre reclamo all'autorità di controllo per la protezione dei dati del paese in cui vivi o lavori. Ci piacerebbe però avere prima l'occasione di risolvere il problema.",
                ]),
                p(
                    "Tutto ciò che conserviamo resta nella regione UE indicata sopra. Ciò che il tuo assistente IA legge tramite gli strumenti viene inviato al fornitore di quell'assistente, che può trovarsi al di fuori dell'UE; questo avviene in base al tuo accordo con quel fornitore, non al nostro. Anche Cloudflare (la rete attraverso cui passa ogni richiesta), Google e Microsoft (analisi del sito web, Google Sign-In) e Google e jsDelivr (le richieste di font e icone descritte sopra) si trovano al di fuori dell'UE; quando ricevono dati personali al di fuori dell'UE, si basano sulle clausole contrattuali standard della Commissione europea o sull'EU–US Data Privacy Framework.",
                ),
                p(
                    'Il servizio non è destinato a chi ha meno di 16 anni, e i <a href="/terms" data-legal-link="terms">Termini di servizio</a> richiedono che tu abbia almeno 16 anni. Se ritieni che una persona più giovane abbia creato un account, scrivici e lo elimineremo.',
                ),
                p(
                    "Se questa informativa cambia, cambia anche la data indicata in alto.",
                ),
            ],
        },
        {
            heading: "Termini di servizio",
            blocks: [
                p(
                    "L'uso del servizio è disciplinato anche dai nostri <a href=\"/terms\" data-legal-link=\"terms\">Termini di servizio</a>, che riguardano l'uso consentito, il fatto che nulla di quanto offerto qui costituisce un consiglio medico e l'assenza di qualsiasi garanzia: il servizio è fornito così com'è, gratuitamente, senza garanzie di disponibilità, accuratezza o idoneità a qualsiasi scopo.",
                ),
            ],
        },
    ],
};

export const TERMS_IT: LegalDoc = {
    title: "Termini di servizio",
    metaDescription:
        "I termini che regolano l'uso di Nutrition MCP, il tracker nutrizionale e server MCP remoto, gratuito e open source, per Claude e ChatGPT. Termini in linguaggio semplice su account, uso consentito, i tuoi dati e responsabilità.",
    ogDescription:
        "I termini che regolano l'uso di Nutrition MCP, il tracker nutrizionale e server MCP remoto, gratuito e open source, per Claude e ChatGPT.",
    lastUpdated: "2 ottobre 2026",
    backToHome: "Torna alla home",
    lead: "I termini che regolano l'uso di Nutrition MCP, il tracker nutrizionale e server MCP remoto, gratuito e open source, per Claude e ChatGPT.",
    documentsLabel: "Documenti legali",
    tocLabel: "In questa pagina",
    sections: [
        {
            heading: "Accettazione dei termini",
            blocks: [
                p(
                    "Questi termini regolano il tuo uso di Nutrition MCP (il &ldquo;servizio&rdquo;), ossia il sito web nutrition-mcp.com e il server MCP remoto all'indirizzo <strong>https://nutrition-mcp.com/mcp</strong>. Creando un account o collegando un assistente IA al server, accetti questi termini. Se non li accetti, non usare il servizio.",
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
                    'Nutrition MCP è un tracker nutrizionale gratuito e open source che funziona come server MCP e permette ad assistenti IA come Claude e ChatGPT di registrare pasti, acqua, peso corporeo e misure corporee per tuo conto. Non esistono piani a pagamento, pubblicità né costi per l\'uso del servizio. Accettiamo donazioni volontarie su Patreon per contribuire ai costi di hosting e del database; sono un regalo, non un acquisto, e non danno diritto ad alcuna funzionalità, piano o priorità. Il codice sorgente è pubblicato con licenza MIT su <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> e puoi liberamente ospitarlo tu stesso.',
                ),
            ],
        },
        {
            heading: "Il tuo account",
            blocks: [
                p(
                    "Per usare il servizio devi avere almeno 16 anni. Non verifichiamo l'età: creando un account confermi di soddisfare questo requisito. Sei responsabile della riservatezza delle tue credenziali di accesso e di tutte le attività svolte con il tuo account. Indica un indirizzo email di cui hai davvero il controllo: è l'unico modo per recuperare l'accesso.",
                ),
                p(
                    "Puoi usare il servizio solo dove il tuo fornitore di IA lo supporta e dove lo consentono le leggi applicabili in materia di sanzioni e di controllo delle esportazioni.",
                ),
            ],
        },
        {
            heading: "Nessun consiglio medico",
            blocks: [
                p(
                    "Nutrition MCP è uno strumento di registrazione e reportistica, non un servizio sanitario. Nulla di ciò che produce (valori di calorie e macro, obiettivi, andamenti o eventuali commenti aggiunti dal tuo assistente IA) costituisce un consiglio medico, nutrizionale o dietetico, e niente di tutto ciò sostituisce un professionista qualificato. Consulta un medico o un dietista prima di prendere decisioni sulla tua salute, soprattutto se hai una patologia o precedenti di disturbi alimentari.",
                ),
                p(
                    "Il servizio non è progettato per l'uso clinico e non dovrebbe essere usato, senza il coinvolgimento del proprio medico curante, da chi ha un disturbo alimentare in corso, da chi è in gravidanza o da chi è sotto controllo medico per una condizione legata all'alimentazione. In queste situazioni il monitoraggio di calorie e macro può essere dannoso. Se ti riconosci in questa descrizione, parlane con il tuo medico curante prima di usarlo.",
                ),
                p(
                    "I valori nutrizionali sono <strong>stime</strong>. Derivano da modelli di IA che interpretano le tue descrizioni e le tue foto, da database di terze parti come Open Food Facts e da ciò che inserisci tu stesso. Possono essere sbagliati. Verifica tutto ciò che è importante.",
                ),
                p(
                    "Le foto dei pasti non vengono mai inviate al nostro server. Il tuo assistente IA interpreta l'immagine sui propri sistemi e ci invia solo il testo e i numeri che ne ricava: una descrizione, un tipo di pasto, calorie, macro, note, un codice a barre.",
                ),
            ],
        },
        {
            heading: "Uso consentito",
            blocks: [
                p("Usando il servizio, ti impegni a non:"),
                ul([
                    "usarlo per scopi illeciti o in violazione di leggi o regolamenti applicabili;",
                    "tentare di accedere all'account o ai dati di un altro utente, né aggirare l'autenticazione, i limiti di frequenza o qualsiasi altro controllo tecnico;",
                    "sondare, scansionare, sovraccaricare o compromettere il servizio o l'infrastruttura su cui funziona, anche tramite richieste massive automatizzate;",
                    "caricare contenuti illegali o che non hai il diritto di condividere;",
                    "rivendere il servizio ospitato o presentarlo come tuo;",
                    "usarlo per perseguire una restrizione calorica estrema, o per promuoverla, incoraggiarla o guidare altre persone a praticarla.",
                ]),
                p(
                    "Il servizio applica limiti di frequenza per restare disponibile per tutti. Se ti serve un volume maggiore, ospitalo tu stesso: la licenza MIT serve proprio a questo.",
                ),
            ],
        },
        {
            heading: "I tuoi dati",
            blocks: [
                p(
                    'I tuoi registri restano tuoi. Li conserviamo e li trattiamo per far funzionare il servizio per te, come descritto nella nostra <a href="/privacy" data-legal-link="privacy">Informativa sulla privacy</a>. Sei responsabile dei contenuti che registri.',
                ),
                p(
                    "Puoi esportare tutti i tuoi dati in qualsiasi momento chiedendolo al tuo assistente IA. L'esportazione è un archivio ZIP che contiene file CSV con pasti, acqua, peso, misure corporee, obiettivi, impostazioni del profilo, dati dell'account, telemetria sull'uso degli strumenti e app di IA collegate; l'alcol è incluso indipendentemente dal fatto che il monitoraggio dell'alcol sia attivo. Il link di download che ti forniamo è privato e scade dopo 60 minuti.",
                ),
                p(
                    "Registriamo anche una telemetria operativa di base sull'uso del servizio: per ogni chiamata a uno strumento, il nome dello strumento, se è andata a buon fine, quanto tempo ha impiegato, una categoria generica dell'errore in caso di fallimento, la durata dell'eventuale intervallo di date richiesto, l'ID della sessione, la revisione del protocollo MCP con cui si è collegata la tua app di IA e il nome e la versione con cui quell'app si identifica. Queste righe sono collegate all'ID del tuo account. Non contengono ciò che hai registrato: nessuna descrizione degli alimenti, nessuna caloria, nessun peso, nessuna misura. Le usiamo per mantenere il servizio funzionante e per capire quali strumenti vale la pena migliorare, e vengono eliminate insieme a tutto il resto quando elimini il tuo account.",
                ),
                p(
                    "Puoi eliminare il tuo account e tutti i dati associati in qualsiasi momento chiedendo al tuo assistente IA, mentre è collegato, di <strong>eliminare il tuo account</strong>: l'operazione è immediata e irreversibile.",
                ),
            ],
        },
        {
            heading: "Disponibilità e modifiche",
            blocks: [
                p(
                    "Il servizio è offerto gratuitamente, senza impegni di uptime né accordi sul livello di servizio. Possiamo modificarne, sospenderne o interromperne qualsiasi parte (compresi strumenti, funzionalità e il server ospitato stesso) in qualsiasi momento e senza preavviso. Possiamo inoltre modificare o rimuovere i contenuti che violano questi termini.",
                ),
            ],
        },
        {
            heading: "Servizi di terze parti",
            blocks: [
                p(
                    "Il servizio si appoggia a terze parti: Supabase per il database, l'autenticazione e l'archiviazione delle esportazioni, DigitalOcean per l'hosting, Cloudflare (tramite il nostro fornitore di hosting) per la rete attraverso cui passa ogni richiesta, Open Food Facts per i dati dei codici a barre e l'assistente IA da cui ti colleghi, qualunque esso sia.",
                ),
                p(
                    'Dati dei prodotti per codice a barre &copy; contributori di <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, disponibili con licenza <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Il sito web stesso usa inoltre, con il tuo consenso, Google Analytics e Microsoft Clarity per misurare il traffico e il modo in cui vengono usate le pagine, Google Fonts e la CDN jsDelivr per caricare font e icone, Google Sign-In se scegli questo metodo di accesso, e l'API di GitHub, che il nostro server (non il tuo browser) interroga per ottenere il numero di stelle del progetto, così nessun dato dei visitatori arriva a GitHub. Il caricamento di una pagina comporta quindi richieste a Google Fonts e jsDelivr, che possono vedere il tuo indirizzo IP e il tuo browser; Google Analytics e Microsoft Clarity vengono contattati solo dopo che hai acconsentito all'analisi.",
                ),
                p(
                    "I loro termini e la loro disponibilità dipendono esclusivamente da loro, e non ne siamo responsabili.",
                ),
            ],
        },
        {
            heading: "Nessuna garanzia",
            blocks: [
                p(
                    "Il servizio è fornito <strong>&ldquo;così com'è&rdquo; e &ldquo;secondo disponibilità&rdquo;</strong>, senza garanzie di alcun tipo, esplicite o implicite, comprese le eventuali garanzie implicite di commerciabilità, idoneità a uno scopo specifico, accuratezza o non violazione di diritti di terzi. Non garantiamo che il servizio sia ininterrotto, sicuro o privo di errori, né che i dati o i valori nutrizionali che produce siano accurati. Lo usi a tuo rischio.",
                ),
            ],
        },
        {
            heading: "Limitazione di responsabilità",
            blocks: [
                p(
                    "Nella misura massima consentita dalla legge, non siamo responsabili di alcun danno indiretto, incidentale, speciale, consequenziale o punitivo, né di alcuna perdita di dati o di profitti, derivanti da o connessi al tuo uso del servizio.",
                ),
            ],
        },
        {
            heading: "I tuoi diritti legali",
            blocks: [
                p(
                    "Alcune responsabilità non possono mai essere escluse, e non cerchiamo di farlo. Restiamo pienamente responsabili per morte o lesioni personali causate da nostra negligenza, nonché per frode o dichiarazioni fraudolente.",
                ),
                p(
                    "Conservi inoltre tutti i diritti che la legge ti riconosce come consumatore. Questi termini si aggiungono a tali diritti e non li limitano. Se una delle sezioni precedenti è in contrasto con un diritto a cui non puoi rinunciare, prevale il tuo diritto.",
                ),
            ],
        },
        {
            heading: "Cessazione",
            blocks: [
                p(
                    "Puoi smettere di usare il servizio in qualsiasi momento ed eliminare il tuo account come descritto sopra. Possiamo sospendere o interrompere l'accesso che viola questi termini o che mette a rischio la stabilità o la sicurezza del servizio. Le sezioni &ldquo;Nessuna garanzia&rdquo;, &ldquo;Limitazione di responsabilità&rdquo; e &ldquo;I tuoi diritti legali&rdquo; restano in vigore anche dopo la cessazione.",
                ),
            ],
        },
        {
            heading: "Modifiche ai termini",
            blocks: [
                p(
                    "Possiamo aggiornare questi termini di tanto in tanto. La versione in vigore è sempre disponibile in questa pagina, con la data in alto che indica l'ultima modifica. Se continui a usare il servizio dopo un aggiornamento, accetti i termini aggiornati.",
                ),
            ],
        },
        {
            heading: "Nullità parziale",
            blocks: [
                p(
                    "Se una parte di questi termini risulta inapplicabile, quella parte viene eliminata e il resto rimane in vigore.",
                ),
            ],
        },
        {
            heading: "Contatti",
            blocks: [
                p(
                    'Domande su questi termini o sui tuoi dati? Scrivi ad <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

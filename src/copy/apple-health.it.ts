// Italian translation of the /apple-health setup guide (see apple-health.ts
// for the field contract). The shortcut itself is English for every locale,
// so its name, its menu items (Sync now, Status, Disconnect), its connect
// answers (From today, Also the last 7 days) and the automation input `auto`
// stay in English; iOS labels (Comandi Rapidi, Salute, Sfoglia, Mostra tutti
// i dati…) follow the Italian iOS interface, as in tools.it.ts.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_IT: AppleHealthDoc = {
    meta: {
        title: "Sincronizzazione con Apple Health",
        description:
            "Configura sul tuo iPhone il comando rapido gratuito Nutrition MCP Health: copia in Apple Health i totali giornalieri che registri chattando con la tua IA (calorie, proteine, carboidrati, grassi, fibre, zuccheri, caffeina e, se vuoi, acqua).",
        ogDescription:
            "Copia in Apple Health i totali giornalieri che registri con la tua IA, con un comando rapido gratuito per iPhone.",
    },
    tocLabel: "In questa pagina",
    hero: {
        eyebrow: "Sincronizzazione con Apple Health · iPhone",
        title: "I tuoi totali giornalieri, in Apple Health",
        lead: "Un comando rapido gratuito per iPhone copia da Nutrition MCP ad Apple Health i totali di ogni giornata conclusa. La tua app di IA continua a occuparsi della registrazione; il comando rapido invia solo i giorni già finiti.",
        seeTitle: "Cosa vedrai in Apple Health",
        seeItems: [
            "Una voce per nutriente per ogni giorno concluso, alle <strong>12:00</strong>, proveniente da <strong>Comandi Rapidi</strong>.",
            "Un giorno si considera concluso alle <strong>05:00</strong> del mattino dopo nel tuo fuso orario, quindi ieri arriva dopo le 05:00 di oggi. Oggi non c'è mai.",
        ],
        nutrientsLabel: "Inviati ogni giorno",
        nutrients: {
            energy_kcal: "Energia alimentare",
            protein_g: "Proteine",
            carbohydrates_g: "Carboidrati",
            fat_g: "Grassi totali",
            fiber_g: "Fibre",
            sugar_g: "Zuccheri",
            caffeine_mg: "Caffeina",
            water_ml: "Acqua",
        },
        waterNote: "se lo scegli",
        alcoholNote: "L'alcol non viene mai inviato.",
    },
    before: {
        title: "Prima di iniziare",
        items: [
            "Un iPhone con le app <strong>Comandi Rapidi</strong> e <strong>Salute</strong>. Sono entrambe incluse in iOS.",
            "Un account Nutrition MCP già collegato alla tua app di IA, come Claude o ChatGPT. Il comando rapido accede con lo stesso account.",
            "Consigliato: il tuo fuso orario nel profilo, perché decide dove finisce ogni giorno. Basta dire <em>&ldquo;imposta il mio fuso orario&rdquo;</em> in chat. Se non ne imposti mai uno, viene usato il fuso orario che il tuo iPhone indica al momento del collegamento.",
        ],
    },
    install: {
        title: "Installa il comando rapido",
        lead: "Apri il link sul tuo iPhone e tocca <strong>Aggiungi comando rapido</strong>. Compare nell'app Comandi Rapidi come <strong>Nutrition MCP Health</strong>.",
        button: "Ottieni il comando rapido",
        pending: "Il link al comando rapido verrà pubblicato qui a breve.",
        leadPending:
            "Il comando rapido non è ancora pubblicato. Quando lo sarà, aprirai il suo link sul tuo iPhone e toccherai <strong>Aggiungi comando rapido</strong>, e comparirà nell'app Comandi Rapidi come <strong>Nutrition MCP Health</strong>. I passaggi qui sotto descrivono cosa succede dopo.",
        nameNote:
            "Mantieni esattamente il nome <strong>Nutrition MCP Health</strong>. La pagina di accesso riapre il comando rapido con quel nome, quindi se lo rinomini il collegamento si interrompe a metà.",
    },
    connect: {
        title: "Collegalo",
        steps: [
            "Nell'app Comandi Rapidi, tocca <strong>Nutrition MCP Health</strong> per eseguirlo.",
            "Rispondi a due domande: se inviare anche l'<strong>acqua</strong> (lasciala disattivata se il tuo Apple Watch o un'altra app registra già l'acqua) e quali giorni inviare, <strong>From today</strong> (da oggi) o <strong>Also the last 7 days</strong> (anche gli ultimi 7 giorni).",
            "Safari apre una pagina di accesso. Accedi con lo <strong>stesso account che usa la tua app di IA</strong>. La pagina mostra un avviso sul collegamento di Apple Health: prosegui solo se hai appena avviato tu questa procedura, dal comando rapido sul tuo iPhone.",
            "Quando Safari chiede se aprire Comandi Rapidi, tocca <strong>Apri</strong>. Il comando rapido completa il collegamento.",
            "La prima volta che viene inviato un giorno, Apple Health chiede cosa può scrivere Comandi Rapidi: attiva <strong>tutti i tipi</strong> e tocca <strong>Consenti</strong>. Se hai scelto <strong>Also the last 7 days</strong> e in quei giorni hai registrato dei pasti, succede subito. Altrimenti non c'è ancora nulla da inviare, quindi domani dopo le 05:00 apri il comando rapido e tocca <strong>Sync now</strong> una volta per rispondere.",
        ],
        note: "Il link di accesso funziona una sola volta, per 30 minuti. Se scade, esegui di nuovo il comando rapido. Il tuo primo giorno concluso arriva domani dopo le 05:00; se hai scelto gli ultimi 7 giorni, quelli vengono inviati subito.",
    },
    automate: {
        title: "Rendilo automatico",
        lead: "Un comando rapido condiviso non può portare con sé le sue automazioni, quindi creale una volta nella scheda <strong>Automazione</strong> dell'app Comandi Rapidi. La prima è quella che conta; le altre recuperano quando non apri Salute.",
        triggersLabel: "Quando eseguirlo",
        triggers: [
            {
                when: "App → Salute → Viene aperta",
                tag: "Principale",
                body: "Aprire Salute è proprio il momento in cui vuoi che sia aggiornata.",
            },
            {
                when: "Sveglia → Viene interrotta",
                tag: "Recupero mattutino",
                body: "Una sveglia fermata dopo le 05:00, come quella del mattino, invia ieri appena si è concluso.",
            },
            {
                when: "Caricabatterie → Viene collegato",
                tag: "Facoltativa",
                body: "Mettere in carica il telefono di notte o alla scrivania è un'occasione in più per sincronizzare.",
            },
        ],
        stepsLabel: "Per ciascuna",
        steps: [
            "Nell'app Comandi Rapidi, apri la scheda <strong>Automazione</strong> e tocca <strong>+</strong> per creare un'automazione personale.",
            "Scegli l'attivatore, per esempio <strong>App</strong> → <strong>Salute</strong> → <strong>Viene aperta</strong>.",
            "Scegli <strong>Esegui immediatamente</strong> e disattiva <strong>Notifica quando viene eseguita</strong> se il tuo iPhone lo consente.",
            "Aggiungi l'azione <strong>Esegui comando rapido</strong>, scegli <strong>Nutrition MCP Health</strong> e imposta come input il testo <code>auto</code>.",
        ],
        note: "L'input <code>auto</code> rende silenziose le esecuzioni automatiche: ti avvisano solo quando qualcosa richiede la tua attenzione. Non serve un orario preciso: ogni sincronizzazione guarda indietro agli ultimi 7 giorni conclusi, quindi una mattina saltata si recupera da sola.",
    },
    everyday: {
        title: "Nell'uso quotidiano",
        cards: [
            {
                title: "Hai dimenticato di registrare qualcosa?",
                body: "Aggiungilo in chat come al solito. Se il suo giorno è già stato inviato e rientra negli ultimi 7 giorni, la sincronizzazione successiva integra il giorno con una piccola voce in più alle 12:01, 12:02 e così via. Le variazioni inferiori a circa 20 kcal o 2 g vengono saltate; un salto molto grande, o una variazione dopo 9 integrazioni, arriva come notifica da inserire a mano.",
            },
            {
                title: "Hai eliminato o ridotto un pasto?",
                body: "Apple Health può aggiungere a un valore ma non può ridurlo, quindi ricevi una notifica che indica di quanto quel giorno ora è troppo alto. Per correggere, apri Salute → <strong>Sfoglia</strong> → <strong>Alimentazione</strong>, scegli il tipo di dato, tocca <strong>Mostra tutti i dati</strong> e scorri verso sinistra sulle voci di quel giorno provenienti da Comandi Rapidi per eliminarle, poi inserisci a mano il totale corretto indicato nella notifica. Non usare mai <strong>Elimina tutti i dati da “Comandi Rapidi”</strong>: cancella anche ciò che hanno registrato gli altri tuoi comandi rapidi.",
            },
            {
                title: "Eseguilo a mano",
                body: "Tocca <strong>Nutrition MCP Health</strong> nell'app Comandi Rapidi per aprire il suo menu: <strong>Sync now</strong> invia ciò che è in attesa, <strong>Status</strong> mostra l'ultimo giorno inviato e quando sarà pronto il prossimo, e <strong>Disconnect</strong> termina il collegamento.",
            },
            {
                title: "Controlla dalla tua app di IA",
                body: "Chiedi alla tua IA di mostrarti il profilo (<code>get_profile</code>): indica quando è stata collegata la sincronizzazione, fino a quale giorno ha inviato e quando è stata eseguita l'ultima volta.",
            },
        ],
    },
    privacy: {
        title: "Privacy e limiti",
        items: [
            "Il nostro server conserva il collegamento e, per 8 giorni, una registrazione dei totali che ha inviato, così che ogni giorno venga inviato una volta e poi solo integrato. Entrambi sono inclusi nell'esportazione dei tuoi dati.",
            "Il comando rapido conserva il suo token di accesso in un file nella cartella Comandi Rapidi del tuo iPhone, e anche nel tuo iCloud Drive quando quella cartella vi si sincronizza. Chiunque possa leggere quel file può usare la sincronizzazione finché non la scolleghi, quindi tienilo privato.",
            "Non inviamo nulla ad Apple. Il comando rapido chiede i tuoi totali al nostro server e li scrive in Salute sul tuo iPhone; da lì in poi valgono le tue impostazioni Apple.",
            "Scegli <strong>Disconnect</strong> in qualsiasi momento e il collegamento e la sua registrazione vengono eliminati subito. Termina anche da solo dopo 90 giorni senza sincronizzazione e 365 giorni dopo il collegamento. Ciò che è già in Apple Health resta lì finché non lo elimini.",
        ],
        policyLink: "Leggi l'informativa sulla privacy",
    },
    troubleshooting: {
        title: "Risoluzione dei problemi",
        lead: "Qualcosa non torna? Queste risposte coprono i casi più comuni.",
        readMore: "Leggi la risposta",
    },
    selfHost: {
        textHtml:
            "Hai un tuo server? Il comando rapido è costruito passo per passo nella {link}.",
        linkText: "scheda di costruzione",
    },
};

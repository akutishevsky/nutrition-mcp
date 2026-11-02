// Italian translation of the /apple-health setup guide (see apple-health.ts
// for the field contract). The shortcuts themselves are English for every
// locale, so their names (Nutrition MCP Health, Nutrition MCP Activity), their
// menu items (Sync now, Status, Disconnect), their connect answers (From
// today, Also the last 7 days) and the automation input `auto` stay in
// English; iOS labels (Comandi Rapidi, Salute, Sfoglia, Condivisione, Mostra
// tutti i dati…, Ora del giorno, Consenti sempre) follow the Italian iOS
// interface, as in tools.it.ts. "Energia attiva" is the Active Energy name
// used in legal.it.ts.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_IT: AppleHealthDoc = {
    meta: {
        title: "Comandi rapidi per Apple Health",
        description:
            "Due comandi rapidi gratuiti per iPhone collegano Nutrition MCP e Apple Health: Nutrition MCP Health copia in Apple Health i totali giornalieri che registri con la tua IA (calorie, proteine, carboidrati, grassi, fibre, caffeina e, se vuoi, acqua), e Nutrition MCP Activity riporta la tua Energia attiva giornaliera come calorie attive.",
        ogDescription:
            "Totali giornalieri in Apple Health, Energia attiva in Nutrition MCP: due comandi rapidi gratuiti per iPhone, usane uno o entrambi.",
    },
    tocLabel: "In questa pagina",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP e Apple Health, in entrambe le direzioni",
        lead: "Due comandi rapidi gratuiti per iPhone, uno per ogni direzione. Uno copia in Apple Health ciò che mangi, l'altro riporta in Nutrition MCP l'energia che bruci. Usane uno o entrambi: si collegano, si sincronizzano e si scollegano in autonomia.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "I tuoi totali giornalieri, in Apple Health",
            items: [
                "Una voce per nutriente per ogni giorno concluso, alle <strong>12:00</strong>, proveniente da <strong>Comandi Rapidi</strong>.",
                "Un giorno si considera concluso alle <strong>05:00</strong> del mattino dopo nel tuo fuso orario, quindi ieri arriva dopo le 05:00 di oggi. Oggi non c'è mai.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "La tua Energia attiva, come calorie attive",
            items: [
                "Il totale di <strong>Energia attiva</strong> per oggi e per i 2 giorni precedenti, mostrato accanto a ciò che hai mangiato. L'obiettivo calorico non cambia mai.",
                "Una voce per giorno, sostituita a ogni sincronizzazione, quindi sincronizzare spesso non conta mai un giorno due volte.",
            ],
        },
        nutrientsLabel: "Inviati ogni giorno",
        nutrients: {
            energy_kcal: "Energia alimentare",
            protein_g: "Proteine",
            carbohydrates_g: "Carboidrati",
            fat_g: "Grassi totali",
            fiber_g: "Fibre",
            caffeine_mg: "Caffeina",
            water_ml: "Acqua",
        },
        waterNote: "se lo scegli",
        alcoholNote: "L'alcol non viene mai inviato.",
        readLabel: "Letto a ogni sincronizzazione",
        activeEnergy: "Energia attiva",
    },
    before: {
        title: "Prima di iniziare",
        items: [
            "Un iPhone con le app <strong>Comandi Rapidi</strong> e <strong>Salute</strong>. Sono entrambe incluse in iOS.",
            "Un account Nutrition MCP già collegato alla tua app di IA, come Claude o ChatGPT. Entrambi i comandi rapidi accedono con lo stesso account.",
            "Consigliato: il tuo fuso orario nel profilo, perché decide dove finisce ogni giorno. Basta dire <em>&ldquo;imposta il mio fuso orario&rdquo;</em> in chat. Se non ne imposti mai uno, viene usato il fuso orario che il tuo iPhone indica al momento del collegamento.",
        ],
    },
    install: {
        title: "Installa i comandi rapidi",
        lead: "Installane uno o entrambi. Apri un link sul tuo iPhone e tocca <strong>Aggiungi comando rapido</strong>; compare nell'app Comandi Rapidi con il suo nome.",
        button: "Ottieni il comando rapido",
        pending: "Il link al comando rapido verrà pubblicato qui a breve.",
        leadPending:
            "I comandi rapidi non sono ancora pubblicati. Quando lo saranno, aprirai il loro link sul tuo iPhone e toccherai <strong>Aggiungi comando rapido</strong>, e il comando comparirà nell'app Comandi Rapidi con il proprio nome. I passaggi qui sotto descrivono cosa succede dopo.",
        healthBlurb: "Invia i tuoi totali giornalieri ad Apple Health.",
        activityBlurb: "Legge la tua Energia attiva da Apple Health.",
        nameNote:
            "Mantieni esattamente i nomi <strong>Nutrition MCP Health</strong> e <strong>Nutrition MCP Activity</strong>. La pagina di accesso riapre ogni comando rapido con il suo nome, quindi se ne rinomini uno il collegamento si interrompe a metà.",
    },
    connect: {
        title: "Collegali",
        steps: [
            "Nell'app Comandi Rapidi, tocca il comando rapido per eseguirlo.",
            "Rispondi alle sue domande (qui sotto), poi Safari apre una pagina di accesso. Accedi con lo <strong>stesso account che usa la tua app di IA</strong>. La pagina mostra un avviso sul collegamento di Apple Health: prosegui solo se hai appena avviato tu questa procedura, dal comando rapido sul tuo iPhone.",
            "Quando Safari chiede se aprire Comandi Rapidi, tocca <strong>Apri</strong>. Il comando rapido completa il collegamento.",
        ],
        health: {
            label: "Nutrition MCP Health chiede",
            items: [
                "Se inviare anche l'<strong>acqua</strong> (lasciala disattivata se il tuo Apple Watch o un'altra app registra già l'acqua) e quali giorni inviare, <strong>From today</strong> (da oggi) o <strong>Also the last 7 days</strong> (anche gli ultimi 7 giorni).",
                "La prima volta che viene inviato un giorno, Apple Health chiede cosa può scrivere Comandi Rapidi: attiva <strong>tutti i tipi</strong> e tocca <strong>Consenti</strong>. Se hai scelto <strong>Also the last 7 days</strong> e in quei giorni hai registrato dei pasti, succede subito. Altrimenti non c'è ancora nulla da inviare, quindi domani dopo le 05:00 apri il comando rapido e tocca <strong>Sync now</strong> una volta per rispondere.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity chiede",
            items: [
                "Nulla prima dell'accesso, a parte un breve avviso su ciò che legge. La sua prima sincronizzazione parte subito dopo il collegamento.",
                "Apple Health chiede se Comandi Rapidi può leggere <strong>Energia attiva</strong>: tocca <strong>Consenti</strong>. Poi iOS chiede se il comando rapido può inviare dati di salute a nutrition-mcp.com: scegli <strong>Consenti sempre</strong>, altrimenti ogni esecuzione automatica si ferma a quella domanda.",
            ],
        },
        note: "Ogni link di accesso funziona una sola volta, per 30 minuti. Se scade, esegui di nuovo il comando rapido. Collega i due comandi rapidi uno dopo l'altro, non nello stesso momento. Con Nutrition MCP Health, il tuo primo giorno concluso arriva domani dopo le 05:00; se hai scelto gli ultimi 7 giorni, quelli vengono inviati subito.",
    },
    automate: {
        title: "Rendili automatici",
        lead: "Un comando rapido condiviso non può portare con sé le sue automazioni, quindi creale una volta per ogni comando rapido che usi, nella scheda <strong>Automazione</strong> dell'app Comandi Rapidi. La prima di ciascuno è quella che conta; le altre recuperano i giorni in cui non apri quell'app.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
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
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude o ChatGPT → Viene aperta",
                tag: "Principale",
                body: "Aprire la tua app di IA è proprio il momento in cui stai per chiedere come va la giornata, quindi l'energia attiva di oggi è aggiornata prima che tu lo chieda.",
            },
            {
                when: "App → Salute o Fitness → Viene aperta",
                tag: "Anche",
                body: "Controllare i tuoi anelli o i tuoi allenamenti è un'occasione in più per sincronizzare.",
            },
            {
                when: "Ora del giorno",
                tag: "Durante la giornata",
                body: "Non c'è un attivatore &ldquo;ogni ora&rdquo;, quindi aggiungine alcuni, per esempio alle 12:00, alle 18:00 e alle 22:00, per recuperare i giorni in cui non apri nessuna delle due app.",
            },
        ],
        stepsLabel: "Per ciascuna",
        steps: [
            "Nell'app Comandi Rapidi, apri la scheda <strong>Automazione</strong> e tocca <strong>+</strong> per creare un'automazione personale.",
            "Scegli l'attivatore, per esempio <strong>App</strong> → <strong>Salute</strong> → <strong>Viene aperta</strong>.",
            "Scegli <strong>Esegui immediatamente</strong> e disattiva <strong>Notifica quando viene eseguita</strong> se il tuo iPhone lo consente.",
            "Aggiungi l'azione <strong>Esegui comando rapido</strong>, scegli <strong>Nutrition MCP Health</strong> o <strong>Nutrition MCP Activity</strong> e imposta come input il testo <code>auto</code>.",
        ],
        note: "L'input <code>auto</code> rende silenziose le esecuzioni automatiche: ti avvisano solo quando qualcosa richiede la tua attenzione. Non serve un orario preciso: Nutrition MCP Health guarda indietro agli ultimi 7 giorni conclusi a ogni sincronizzazione, e Nutrition MCP Activity reinvia oggi e i 2 giorni precedenti, quindi un'esecuzione saltata si recupera da sola.",
    },
    everyday: {
        title: "Nell'uso quotidiano",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "Hai dimenticato di registrare qualcosa?",
                body: "Aggiungilo in chat come al solito. Se il suo giorno è già stato inviato e rientra negli ultimi 7 giorni, la sincronizzazione successiva integra il giorno con una piccola voce in più alle 12:01, 12:02 e così via. Le variazioni inferiori a circa 20 kcal o 2 g vengono saltate; un salto molto grande, o una variazione dopo 9 integrazioni, arriva come notifica da inserire a mano.",
            },
            {
                title: "Hai eliminato o ridotto un pasto?",
                body: "Apple Health può aggiungere a un valore ma non può ridurlo, quindi ricevi una notifica che indica di quanto quel giorno ora è troppo alto. Per correggere, apri Salute → <strong>Sfoglia</strong> → <strong>Alimentazione</strong>, scegli il tipo di dato, tocca <strong>Mostra tutti i dati</strong> e scorri verso sinistra sulle voci di quel giorno provenienti da Comandi Rapidi per eliminarle, poi inserisci a mano il totale corretto indicato nella notifica. Non usare mai <strong>Elimina tutti i dati da &ldquo;Comandi Rapidi&rdquo;</strong>: cancella anche ciò che hanno registrato gli altri tuoi comandi rapidi.",
            },
            {
                title: "Eseguilo a mano",
                body: "Tocca <strong>Nutrition MCP Health</strong> nell'app Comandi Rapidi per aprire il suo menu: <strong>Sync now</strong> invia ciò che è in attesa, <strong>Status</strong> mostra l'ultimo giorno inviato e quando sarà pronto il prossimo, e <strong>Disconnect</strong> termina il collegamento.",
            },
            {
                title: "Controlla dalla tua app di IA",
                body: "Chiedi alla tua IA di mostrarti il profilo (<code>get_profile</code>): indica quando è stato collegato ciascun comando rapido, fino a quale giorno Nutrition MCP Health ha inviato e quando è stata eseguita l'ultima volta.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Numeri di calorie alti quando chiede di inviare?",
                body: "Non preoccuparti. La domanda che iOS mostra prima dell'invio elenca i totali giornalieri grezzi di Salute, con tutti i decimali e nel formato numerico della tua regione, quindi <strong>922,774 kcal</strong> significa in realtà poco meno di 923 kcal. Il comando rapido arrotonda ogni giorno a chilocalorie intere prima di inviare qualsiasi cosa, e le voci <strong>0 kcal</strong> che elenca anch'esse non aggiungono nulla.",
            },
            {
                title: "Hai registrato anche un allenamento in chat?",
                body: "In un giorno che il comando rapido ha già inviato, conta il totale di Apple Health, e gli allenamenti registrati in chat restano nel tuo registro senza essere sommati sopra: l'Energia attiva del tuo orologio li include già. Negli altri giorni contano come al solito.",
            },
            {
                title: "Un giorno che risulta 0?",
                body: "Un giorno senza Energia attiva, o che Salute non ha permesso al comando rapido di leggere, non invia nulla e non cambia nulla. Se ogni giorno resta a 0, consenti a Comandi Rapidi di leggere l'Energia attiva in Salute → <strong>Condivisione</strong> → <strong>App</strong> → <strong>Comandi Rapidi</strong>.",
            },
            {
                title: "Eseguilo a mano",
                body: "Tocca <strong>Nutrition MCP Activity</strong> nell'app Comandi Rapidi per aprire il suo menu: <strong>Sync now</strong> invia oggi e i 2 giorni precedenti, <strong>Status</strong> mostra l'ultimo giorno inviato, e <strong>Disconnect</strong> termina il suo collegamento e lascia collegato Nutrition MCP Health.",
            },
        ],
    },
    privacy: {
        title: "Privacy e limiti",
        items: [
            "Nutrition MCP Health: il nostro server conserva il collegamento e, per 8 giorni, una registrazione dei totali che ha inviato, così che ogni giorno venga inviato una volta e poi solo integrato. Non inviamo nulla ad Apple; il comando rapido chiede al nostro server i tuoi totali e li scrive in Salute sul tuo iPhone, dove valgono le tue impostazioni Apple.",
            "Nutrition MCP Activity legge solo il totale giornaliero di <strong>Energia attiva</strong>, nient'altro da Salute. Il nostro server conserva quei totali come tue calorie attive, che compaiono nell'esportazione dei tuoi dati e vengono eliminate con il tuo account, come quelle che registri in chat.",
            "Ciascun comando rapido conserva il proprio token di accesso nella propria memoria all'interno dell'app Comandi Rapidi del tuo iPhone, non in un file, e l'app Comandi Rapidi può sincronizzarlo con gli altri tuoi dispositivi tramite iCloud. Chiunque possa eseguire un comando rapido sui tuoi dispositivi può usarne la sincronizzazione finché non lo scolleghi, quindi tienili solo su dispositivi che usi solo tu.",
            "Scegli <strong>Disconnect</strong> in un comando rapido in qualsiasi momento e il suo collegamento viene eliminato subito, insieme alla registrazione di Nutrition MCP Health. Ogni collegamento termina anche da solo dopo 90 giorni senza sincronizzazione e 365 giorni dopo il collegamento. Ciò che è già in Apple Health resta lì finché non lo elimini, e le calorie attive già inviate restano finché non le elimini.",
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
            "Hai un tuo server? I comandi rapidi sono costruiti passo per passo nella {link} e nella {activityLink}.",
        linkText: "scheda di costruzione di Nutrition MCP Health",
        activityLinkText: "scheda di costruzione di Nutrition MCP Activity",
    },
};

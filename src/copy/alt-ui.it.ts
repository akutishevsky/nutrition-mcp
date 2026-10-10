// Italian (it) translation of the /alternatives shared template copy. See
// src/copy/alt-ui.ts for the full field-by-field documentation of this
// shape (AltUiCopy) — every `{app}` / `{link}` / `{apps}`
// placeholder below is preserved verbatim, and every `Html`/raw field keeps
// its original tags and entities unchanged. Terminology follows
// .git/nm-i18n/glossary-it.md and src/copy/index.it.ts: informal "tu",
// "Quick install" → "Installazione rapida", "Connect in under a minute" →
// "Collegalo in meno di un minuto", "Star on GitHub" → "Metti una stella
// su GitHub", tracking → monitoraggio, history → storico, map columns →
// abbinare le colonne, barcode scanning → scansione dei codici a barre,
// fiber → fibre, (total) sugar → zuccheri (totali), caffeine → caffeina,
// content fingerprint → impronta di contenuto.

import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_IT: AltUiCopy = {
    breadcrumbHome: "Home",
    breadcrumbAlternatives: "Alternative",
    breadcrumbAriaLabel: "Percorso di navigazione",
    ctaQuickInstall: "Installazione rapida",
    ctaClosingTitle: "Tieni traccia di ciò che mangi nell'IA che usi già.",
    disclaimerAppHtml:
        "{app} è un marchio del rispettivo proprietario. Nutrition MCP è un progetto indipendente e open source: non ha legami con {app}, che non lo approva né lo sponsorizza. I confronti si basano sulle informazioni pubbliche disponibili al momento della stesura e potrebbero cambiare.",
    disclaimerHubHtml:
        "{apps} e gli altri nomi di prodotto sono marchi dei rispettivi proprietari. Nutrition MCP è un progetto indipendente e open source, non è affiliato a nessuno di loro né approvato da loro. I confronti si basano sulle informazioni pubbliche disponibili al momento della stesura e potrebbero cambiare.",

    app: {
        heroEyebrow: "Alternativa a {app}",
        heroTitleHtml: "Cerchi un server <em>{app} MCP</em>?",
        heroLead:
            "{app} non ne pubblica uno da collegare, quindi non puoi registrare i pasti nel tuo diario di {app} da Claude o ChatGPT. Nutrition MCP fa lo stesso lavoro in chat, ed è gratuito e open source.",
        ctaConnect: "Collegalo in meno di un minuto",
        ctaSeeComparison: "Vedi il confronto",

        answerEyebrow: "In breve",
        answerTitle: "No: {app} non ha un server MCP ufficiale e pubblico.",
        answerBodyHtml:
            "Il Model Context Protocol (MCP) è lo standard aperto che permette ad assistenti IA come Claude e ChatGPT di collegarsi a strumenti esterni. {app} non mette a disposizione un server MCP pubblico, quindi non esiste un modo ufficiale per registrare gli alimenti nel tuo diario di {app} dalla tua IA. Se hai cercato &ldquo;{app} MCP&rdquo; o &ldquo;collegare {app} a Claude&rdquo;, quello che cerchi davvero è un diario alimentare che funzioni <em>dentro</em> la tua IA, e Nutrition MCP è esattamente questo.",

        insteadEyebrow: "Cosa ottieni invece",
        insteadTitle: "Stesso monitoraggio, ma basta parlare",
        features: [
            {
                title: "Pasti descritti a parole",
                body: "Di' &ldquo;porridge con banana e burro d'arachidi&rdquo;: la tua IA stima calorie e macro, comprese fibre, zuccheri totali e caffeina, e registra il pasto. Nessuna ricerca nel database. Registra un pasto ingrediente per ingrediente, oppure salva i pasti che mangi spesso e registrali di nuovo chiamandoli per nome.",
            },
            {
                title: "Scansione dei codici a barre, gratis",
                body: "Invia il codice a barre di un prodotto e ottieni da Open Food Facts le macro riportate in etichetta, anche fibre e zuccheri quando l'etichetta li indica. Gratis per tutti, senza abbonamento.",
            },
            {
                title: "Peso e obiettivi",
                body: "Registra il peso in kg o lb e le misure di nove zone del corpo in cm o pollici e imposta obiettivi per calorie, macro, fibre, zuccheri, caffeina e acqua: le fibre come traguardo da raggiungere, zuccheri e caffeina come limiti da non superare. Poi segui l'andamento verso il tuo peso obiettivo. C'è anche il monitoraggio dell'alcol, facoltativo e disattivato finché non lo attivi.",
            },
            {
                title: "Riepiloghi e andamenti",
                body: "Chiedi i totali del giorno, gli andamenti settimanali, le serie di giorni consecutivi e le tue abitudini alimentari ricorrenti, direttamente in chat.",
            },
            {
                title: "Importa i dati e tienili tuoi",
                body: "Importa lo storico dei pasti dall'esportazione CSV di un'altra app: il file viene letto nel tuo browser, non dall'IA. Riprenditi tutto quando vuoi: un unico ZIP con pasti, pasti salvati, acqua, peso, misure corporee, obiettivi e profilo, più i dati dell'account, la telemetria di utilizzo e le app collegate, in file CSV. Per ora solo i pasti si possono reimportare. Oppure elimina l'account, con la stessa facilità.",
            },
            {
                title: "Open source e gratuito",
                body: "Licenza MIT e puoi ospitarlo in autonomia. Niente pubblicità, niente funzioni a pagamento, nessuna offerta premium. Controlla il codice o avvia una tua istanza.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Altri confronti:",
        compareTitle: "Messi a confronto",
        pros: [
            "Nato come server MCP: funziona dentro Claude e ChatGPT",
            "Descrivi i pasti a parole e ottieni la stima di calorie, macro, fibre, zuccheri e caffeina; salva i tuoi pasti abituali per registrarli in una riga",
            "Scansione dei codici a barre, andamenti, importazione ed esportazione CSV: tutto gratis",
            "Nessuna app a parte, niente pubblicità, open source",
        ],

        movingEyebrow: "Passare da {app}",

        importEyebrow: "Il tuo storico di {app}",
        importSub:
            "Chiedi di importare e l'importatore si apre direttamente in chat: scegli il file esportato, abbina le colonne, controlla l'anteprima di ciò che verrà aggiunto e conferma. Il file viene letto nel tuo browser: l'IA non vede mai le righe. Nei client che non mostrano pannelli in chat, incolla invece l'esportazione.",

        switchEyebrow: "Come passare",
        switchSub:
            "Funziona con qualsiasi client MCP che supporti OAuth 2.0 con PKCE. Al primo collegamento crei un account con Google oppure con email e password.",
        installSteps: [
            'Apri <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP nella directory di Claude</a>.',
            "Clicca su <strong>Connect</strong> e accedi con Google oppure con email e password.",
            "Inizia a registrare: di' cosa hai mangiato.",
        ],
        installNoteTemplate:
            "Usi ChatGPT o un altro client? La {link} spiega come fare con ChatGPT, Cursor, VS Code, Claude Code e altri.",
        installLinkText: "guida completa all'installazione",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Domande su {app} e MCP",
        faq: {
            mcpQ: "{app} ha un server MCP?",
            mcpA: "Non ufficialmente. {app} non mette a disposizione un server Model Context Protocol (MCP) pubblico, quindi non esiste un modo ufficiale per registrare i pasti nel tuo diario di {app} da Claude, ChatGPT o altri client MCP. Esistono alcuni server non ufficiali creati dalla community, ma non sono sviluppati né supportati da {app}. Nutrition MCP è un'altra cosa: un'app di monitoraggio gratuita e open source, nata fin dall'inizio come server MCP, con un proprio account e in grado di importare l'esportazione CSV di {app}.",
            connectQ: "Come collego {app} a Claude?",
            connectA:
                "Non esiste un connettore ufficiale di {app} per Claude, perché {app} non mette a disposizione alcun server MCP pubblico. Un'alternativa è Nutrition MCP, un server MCP gratuito presente nella directory di Claude: aprilo su https://claude.ai/directory/nutrition-mcp, clicca su Connect, accedi e inizia a registrare i pasti in chat.",
            goodAltQ: "Nutrition MCP è una buona alternativa a {app}?",
            goodAltA:
                "Sì, se vuoi tenere traccia di calorie, macro (comprese fibre, zuccheri totali e caffeina), acqua e peso senza aprire un'app a parte né cercare in un database alimentare. Invece di scorrere voci su voci in un database, descrivi a parole cosa hai mangiato, invii una foto o scansioni un codice a barre, e la tua IA lo registra. Il tutto gratis e open source.",
            importQ: "Posso importare i miei dati da {app}?",
            readExportQ: "Quando importo, l'IA legge il file esportato?",
            readExportA:
                "Non se usi l'importatore. L'importatore legge il CSV nel tuo browser e, prima di scrivere qualsiasi cosa, ti mostra cosa verrà aggiunto: quanti pasti, il totale delle calorie, eventuali segnalazioni e le righe stesse (in un file lungo, le prime righe più il conteggio delle restanti, anziché ogni singola riga). Vengono inviate solo le righe che confermi, come dati strutturati e non attraverso la risposta dell'IA, quindi nessuna riga può essere trascritta male o inventata lungo il percorso. Ogni riga porta anche un'impronta di contenuto: se importi di nuovo lo stesso file, quei pasti vengono segnalati come già registrati invece di essere duplicati, purché nel frattempo tu non abbia cambiato fuso orario. Se il tuo client non può mostrare pannelli in chat, puoi ripiegare incollando l'esportazione: in quel caso l'IA la legge davvero, quindi, se puoi scegliere, preferisci l'importatore.",
            freeQ: "Nutrition MCP è gratuito?",
            freeAFallback:
                "Sì. Nutrition MCP è completamente gratuito: niente piano premium, niente pubblicità, nessuna funzione a pagamento, a differenza delle app che riservano alcune funzioni agli abbonati. Ti servono un'app di IA che supporti MCP, come Claude o ChatGPT, e un account Nutrition MCP gratuito, che crei con Google o con email e password al primo collegamento.",
        },
        importFallbackNote:
            " Nei client senza pannelli in chat puoi invece incollare l'esportazione.",

        ctaClosingSub:
            "Gratuito e open source: niente account {app}, nessuna app da aprire.",
        ctaOtherAlternatives: "Altre alternative",
    },

    hub: {
        heroEyebrow: "Alternative MCP",
        heroTitleHtml:
            "La tua app di nutrizione non ha un <em>server MCP</em> ufficiale.",
        heroLead:
            "App come MyFitnessPal, Cronometer e Lose It! non offrono un modo ufficiale per aggiornare il diario da Claude o ChatGPT. Nutrition MCP è un modo gratuito e open source per tenere traccia di pasti, macro e peso parlando con la tua IA, e importa anche il tuo storico.",
        ctaSeeExamples: "Guarda gli esempi",

        appsEyebrow: "Arrivi da…",
        appsTitle: "Scegli l'app che usi ora",
        appsSub:
            "Guarda come se la cava Nutrition MCP rispetto all'app che usi oggi, e come portare nella tua IA sia la registrazione dei pasti sia lo storico che hai già.",
        noAppNote:
            "Non trovi la tua app? Anche la maggior parte delle altre app di nutrizione non ha un server MCP ufficiale, e Nutrition MCP funziona allo stesso modo, qualunque app tu stia lasciando.",
        requestComparisonLinkText: "Richiedi un confronto",

        importEyebrow: "Porta con te lo storico",
        importTitle: "Non devi ripartire da zero",
        importSub:
            "Di solito si resta dove si è per via degli anni di dati già registrati. Chiedi di importare e l'importatore si apre direttamente in chat: scegli il file esportato, abbina le colonne, controlla l'anteprima di ciò che verrà aggiunto e conferma. Oppure incolla l'esportazione, se il tuo client non mostra pannelli in chat.",
        importBody: [
            "Il file viene analizzato nel tuo browser, non letto dall'IA: così le righe non possono essere trascritte male durante l'importazione, e vedi esattamente quali pasti verranno aggiunti prima che ne venga scritto anche uno solo. Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor vengono riconosciute dai nomi delle colonne; funziona anche qualsiasi altro CSV, basta abbinare una volta ogni colonna nella schermata di abbinamento. Vengono importati data e ora, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina in milligrammi, e anche l'alcol, se prima hai attivato il monitoraggio dell'alcol.",
            "Le insidie dei file esportati reali sono gestite: date in formato GG/MM/AAAA e MM/GG/AAAA, energia in kilojoule oltre che in kilocalorie, file europei separati da punto e virgola con la virgola come separatore decimale, campi tra virgolette che contengono degli a capo, righe di totali in fondo e indicatori di riga eliminata. Le intestazioni non devono nemmeno essere in inglese: Kalorien o Ballaststoffe di un'esportazione tedesca vengono riconosciute, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese. Quando un file è davvero ambiguo (05/06 può essere maggio o giugno), l'importatore ti mostra come l'ha interpretato accanto a una riga del tuo file e ti chiede di confermare, invece di tirare a indovinare. E ogni riga porta un'impronta di contenuto: se reimporti lo stesso file, i pasti vengono segnalati come già registrati invece di essere duplicati, purché nel frattempo tu non abbia cambiato fuso orario.",
        ],

        ctaSub: "Gratuito e open source: funziona con Claude, ChatGPT e qualsiasi client MCP.",
        ctaStarGithub: "Metti una stella su GitHub",
    },
};

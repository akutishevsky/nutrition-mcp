// Italian (it) translation of the /alternatives shared template copy. See
// src/copy/alt-ui.ts for the full field-by-field documentation of this
// shape (AltUiCopy) — every `{app}` / `{link}` / `{copyUrl}` / `{apps}`
// placeholder below is preserved verbatim, and every `Html`/raw field keeps
// its original tags and entities unchanged. Terminology kept consistent
// with src/copy/index.it.ts and src/copy/alternatives.it.ts: "Quick
// install" → "Installazione rapida", "Connect in under a minute" →
// "Connettiti in meno di un minuto", "Star on GitHub" → "Metti una stella
// su GitHub", barcode scanning → scansione dei codici a barre, fiber →
// fibre, (total) sugar → zuccheri (totali), caffeine → caffeina, import →
// importare/importazione, content fingerprint → impronta di contenuto.

import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_IT: AltUiCopy = {
    breadcrumbHome: "Home",
    breadcrumbAlternatives: "Alternative",
    ctaQuickInstall: "Installazione rapida",
    ctaClosingTitle: "Traccia la tua alimentazione dentro l'IA che usi già.",
    disclaimerAppHtml:
        "{app} è un marchio del rispettivo proprietario. Nutrition MCP è un progetto indipendente e open source e non è affiliato, sponsorizzato o approvato da {app}. I confronti riflettono le informazioni pubblicamente disponibili al momento della stesura e potrebbero cambiare.",
    disclaimerHubHtml:
        "{apps} e gli altri nomi di prodotto sono marchi dei rispettivi proprietari. Nutrition MCP è un progetto indipendente e open source e non è affiliato né approvato da nessuno di essi. I confronti riflettono le informazioni pubblicamente disponibili al momento della stesura e potrebbero cambiare.",

    app: {
        heroEyebrow: "Alternativa a {app}",
        heroTitleHtml: "Cerchi un server <em>{app} MCP</em>?",
        heroLead:
            "{app} non ne ha uno — quindi non puoi usarlo dentro Claude o ChatGPT. Nutrition MCP fa lo stesso lavoro per conversazione, ed è gratuito e open source.",
        ctaConnect: "Connettiti in meno di un minuto",
        ctaSeeComparison: "Guarda il confronto",

        answerEyebrow: "La risposta breve",
        answerTitle: "No, {app} non ha un server MCP.",
        answerBodyHtml:
            "Il Model Context Protocol (MCP) è lo standard aperto che permette agli assistenti IA come Claude e ChatGPT di connettersi a strumenti esterni. {app} non pubblica un server MCP, quindi non esiste un modo ufficiale per registrare il cibo dalla tua IA. Se hai cercato &ldquo;{app} MCP&rdquo; o &ldquo;collegare {app} a Claude,&rdquo; ciò che stai davvero cercando è un tracker nutrizionale che vive <em>dentro</em> la tua IA — è esattamente ciò che è Nutrition MCP.",

        insteadEyebrow: "Cosa ottieni invece",
        insteadTitle: "Lo stesso tracciamento, ma parlando",
        features: [
            {
                title: "Pasti in linguaggio naturale",
                body: "Di' &ldquo;porridge con banana e burro d'arachidi&rdquo; — la tua IA stima calorie e macro, fibre, zuccheri totali e caffeina inclusi, e lo registra. Nessuna ricerca nel database.",
            },
            {
                title: "Scansione dei codici a barre — gratuita",
                body: "Invia il codice a barre di un prodotto e recupera le macro dell'etichetta da Open Food Facts — fibre e zuccheri inclusi, dove l'etichetta li riporta. Nessun abbonamento Premium per sbloccarla.",
            },
            {
                title: "Peso &amp; obiettivi",
                body: "Registra il peso corporeo in kg o lb, imposta obiettivi di calorie, macro, fibre, zuccheri, caffeina e acqua — le fibre come traguardo da raggiungere, zuccheri e caffeina come limiti da non superare — e traccia gli andamenti verso un peso obiettivo. C'è anche il tracciamento dell'alcol, opzionale e disattivato finché non lo attivi.",
            },
            {
                title: "Riepiloghi &amp; andamenti",
                body: "Chiedi totali giornalieri, andamenti settimanali, serie consecutive e pattern ricorrenti nei pasti — direttamente in chat.",
            },
            {
                title: "Importa &amp; possiedi i tuoi dati",
                body: "Importa il tuo storico pasti dall'esportazione CSV di un'altra app — analizzata nel tuo browser, non dall'IA. Riprenditi tutto quando vuoi: un unico ZIP con i tuoi pasti, acqua, peso, obiettivi e profilo come file CSV. Per ora, i pasti sono l'unica parte che può essere reimportata. Oppure elimina il tuo account, altrettanto facilmente.",
            },
            {
                title: "Open source &amp; gratuito",
                body: "Con licenza MIT e self-hostabile — niente pubblicità, niente paywall, niente upsell. Verifica il codice o esegui una tua istanza.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        compareTitle: "Come si confrontano",
        pros: [
            "Costruito come server MCP — vive dentro Claude &amp; ChatGPT",
            "Descrivi i pasti in linguaggio naturale; calorie, macro, fibre, zuccheri &amp; caffeina stimati per te",
            "Scansione codici a barre, andamenti, importazione &amp; esportazione CSV — tutto gratis",
            "Nessuna app separata, niente pubblicità, open source",
        ],

        movingEyebrow: "Passare da {app}",

        importEyebrow: "Il tuo storico {app}",
        importSub:
            "Chiedi di importare e si apre un importatore direttamente in chat: scegli la tua esportazione, mappa le colonne, visualizza l'anteprima di ciò che verrà aggiunto, poi conferma. Il file viene letto nel tuo browser — l'IA non vede mai le righe. Nei client senza pannelli in chat, incolla invece la tua esportazione.",

        switchEyebrow: "Come passare",
        switchSub:
            "Funziona con qualsiasi client MCP che supporti OAuth 2.0 con PKCE. Al primo collegamento crei un account con Google oppure con email e password.",
        installSteps: [
            "Apri <strong>Claude</strong> (versione web o desktop) e clicca su <strong>Customize</strong> → <strong>Connectors</strong>.",
            "Clicca su <strong>+</strong>, poi su <strong>Add custom connector</strong>, e dagli un nome come <strong>Nutrition</strong>.",
            "Incolla {copyUrl} nel campo <strong>Remote MCP server URL</strong> e clicca su <strong>Add</strong>.",
            "Clicca su <strong>Connect</strong>, accedi, e inizia a registrare dicendo cosa hai mangiato.",
        ],
        installNoteTemplate:
            "Usi ChatGPT o un altro client? La {link} copre ChatGPT, Cursor, VS Code, Claude Code e altri.",
        installLinkText: "guida completa all'installazione",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Domande su {app} &amp; MCP",
        faq: {
            mcpQ: "{app} ha un server MCP?",
            mcpA: "No. {app} non offre un server Model Context Protocol (MCP), quindi non esiste un modo ufficiale per collegarlo a Claude, ChatGPT o altri assistenti IA. Nutrition MCP è un'alternativa gratuita e open source costruita come server MCP fin dall'inizio, così puoi registrare pasti e macro direttamente dentro la tua IA.",
            connectQ: "Come collego {app} a Claude?",
            connectA:
                "Non esiste un connettore ufficiale {app} per Claude, perché {app} non ha un server MCP né un'integrazione MCP pubblica. L'opzione più vicina è Nutrition MCP, un server MCP gratuito: aggiungi https://nutrition-mcp.com/mcp come connettore personalizzato in Claude, accedi, e inizia a registrare per conversazione.",
            goodAltQ: "Nutrition MCP è una buona alternativa a {app}?",
            goodAltA:
                "Se vuoi tracciare calorie, macro — fibre, zuccheri totali e caffeina inclusi — acqua e peso senza aprire un'app separata o cercare in un database alimentare, sì. Invece di navigare a colpi di tap in un database, descrivi cosa hai mangiato in linguaggio naturale, invii una foto o scansioni un codice a barre, e la tua IA lo registra — completamente gratuito e open source.",
            importQ: "Posso importare i miei dati da {app}?",
            readExportQ:
                "L'IA legge il mio file di esportazione quando importo?",
            readExportA:
                "Non quando si apre l'importatore. Analizza il CSV nel tuo browser e ti mostra cosa verrà aggiunto prima che venga scritto qualcosa: quanti pasti, il totale calorico, tutto ciò che ha dovuto segnalare, e le righe stesse — un file lungo elenca le prime insieme a un conteggio del resto anziché ogni riga. Vengono inviate solo le righe che confermi, e viaggiano come dati strutturati anziché attraverso la risposta dell'IA, quindi nessuna riga può essere trascritta male o inventata durante il tragitto. Ogni riga porta anche un'impronta di contenuto, così rieseguire lo stesso file segnala quei pasti come già registrati invece di duplicarli. Se il tuo client non può mostrare pannelli in chat, il ripiego è incollare l'esportazione — su quel percorso l'IA la legge davvero, quindi preferisci l'importatore quando puoi scegliere.",
            freeQ: "Nutrition MCP è gratuito?",
            freeAFallback:
                "Sì. Nutrition MCP è completamente gratuito, senza piano premium, pubblicità o funzioni dietro paywall — a differenza delle app che mettono alcune funzioni dietro un abbonamento. Ti serve solo un account Claude o ChatGPT per connetterti.",
        },
        importFallbackNote:
            " Nei client senza pannelli in chat puoi incollare la tua esportazione.",

        ctaClosingSub:
            "Gratuito e open source — nessun account {app}, nessuna app da aprire.",
        ctaOtherAlternatives: "Altre alternative",
    },

    hub: {
        heroEyebrow: "Alternative MCP",
        heroTitleHtml:
            "La tua app di nutrizione non ha un <em>server MCP</em>.",
        heroLead:
            "App come MyFitnessPal, Cronometer e Lose It non possono connettersi a Claude o ChatGPT. Nutrition MCP è il modo gratuito e open source per tracciare pasti, macro e peso parlando con la tua IA.",
        ctaSeeExamples: "Guarda gli esempi",

        appsEyebrow: "Passando da…",
        appsTitle: "Scegli la tua app attuale",
        appsSub:
            "Scopri come Nutrition MCP si confronta con il tracker che usi oggi — e come spostare la tua registrazione, e il tuo storico esistente, dentro la tua IA.",
        noAppNote:
            "Non vedi la tua app? Quasi certamente non ha nemmeno lei un server MCP — Nutrition MCP funziona allo stesso modo indipendentemente da cosa stai lasciando.",
        requestComparisonLinkText: "Richiedi un confronto",

        importEyebrow: "Porta il tuo storico",
        importTitle: "Non devi ripartire da zero",
        importSub:
            "Il motivo abituale per cui le persone restano dov'erano sono gli anni già registrati. Chiedi di importare e si apre un importatore direttamente in chat: scegli la tua esportazione, mappa le colonne, visualizza l'anteprima di ciò che verrà aggiunto, poi conferma — oppure incolla l'esportazione se il tuo client non ha pannelli in chat.",
        importBody: [
            "Il file viene analizzato nel tuo browser, non letto dall'IA — quindi le righe non possono essere trascritte male in ingresso, e vedi i pasti esatti prima che venga scritto qualcosa. Le esportazioni di MyFitnessPal, Cronometer, Lose It! e MacroFactor hanno le loro colonne riconosciute per nome; funziona anche qualsiasi altro CSV, basta puntare il mappatore su ogni colonna una volta. Quello che passa è data e ora, alimento, pasto, calorie, proteine, carboidrati, grassi, fibre, zuccheri totali e caffeina in milligrammi — e anche l'alcol, se hai prima attivato il tracciamento dell'alcol.",
            "Le parti scomode dei file di esportazione reali sono gestite: date in formato GG/MM/AAAA e MM/GG/AAAA, energia in kilojoule oltre che in kilocalorie, file europei delimitati da punto e virgola i cui numeri usano decimali con la virgola, campi tra virgolette con interruzioni di riga al loro interno, righe di totali finali e flag di riga eliminata. Le intestazioni delle colonne non devono nemmeno essere in inglese — Kalorien o Ballaststoffe di un'esportazione tedesca vengono riconosciute, e fibre, zuccheri e caffeina vengono abbinati anche in spagnolo, francese, italiano e olandese. Dove un file è genuinamente ambiguo — 05/06 potrebbe essere maggio o giugno — l'importatore mostra la sua lettura accanto a una riga del tuo file e ti chiede di confermarla invece di indovinare. E ogni riga porta un'impronta di contenuto, così reimportare lo stesso file segnala i pasti come già registrati invece di duplicarli.",
        ],

        ctaSub: "Gratuito e open source — funziona con Claude, ChatGPT e qualsiasi client MCP.",
        ctaStarGithub: "Metti una stella su GitHub",
    },
};

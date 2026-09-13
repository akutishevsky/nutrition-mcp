// French (fr) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`) and the full doc comments on what
// each field means, which four fields carry trusted HTML, and why the hero
// chat's nutrient deltas / clock strings are copied verbatim rather than
// translated.
//
// Terminology kept consistent with tools.fr.ts, chrome.fr.ts and
// alternatives.fr.ts: protein → protéines, carbs → glucides, fat → lipides,
// fiber → fibres, (total) sugar → sucres (totaux), alcohol → alcool (grammes
// d'éthanol pur), caffeine → caféine, meal → repas, water → eau,
// weigh-in → pesée, goals → objectifs, timezone → fuseau horaire,
// export → exporter/export, widget → widget, Live stats → Stats en direct,
// Connect → Connecter, Tools → Outils. Informal "tu" register throughout,
// matching the English source's direct, plain-spoken address to the reader.
//
// Numbers follow French typography: a no-break space as the thousands
// separator ("2 000", not "2,000" — which a French reader parses as a
// decimal), everything else (330 ml, 139 kcal, 36 tools) unchanged. Plain
// spaces before "?" / ":" as in the other fr copy files.

import type { IndexDoc } from "./index.js";

export const INDEX_FR: IndexDoc = {
    title: "Nutrition MCP — Compteur de calories et de macros gratuit pour Claude, ChatGPT et Cursor",
    metaDescription:
        "Suis calories, protéines, glucides, lipides, fibres, sucres et caféine en parlant à ton IA. Nutrition MCP est un serveur MCP gratuit et open source qui fonctionne dans Claude, ChatGPT, Cursor et tout client MCP. Aucune app à installer.",
    ogDescription:
        "Serveur MCP gratuit et open source pour suivre calories et macros dans Claude, ChatGPT et Cursor. Dis ce que tu as mangé ; il fait les calculs.",
    keywords:
        "suivi nutritionnel, compteur de calories, suivi des macros, serveur MCP, connecteur Claude, application ChatGPT, suivi nutritionnel IA, journal alimentaire, scanner de codes-barres, open source, alternative à MyFitnessPal",

    hero: {
        titleBeforeEm: "Suis ta nutrition en ",
        titleEm: "parlant",
        titleAfterEm: " à ton IA.",
        lead: "Nutrition MCP est un compteur de calories et de macros gratuit et open source qui vit dans Claude, ChatGPT, Cursor — n'importe quelle IA compatible MCP. Dis ce que tu as mangé ; il calcule les calories, protéines, glucides, lipides, fibres, sucres et caféine, l'enregistre et te montre ta journée. Aucune app à installer.",
        ctaPrimary: "Connecte-toi en une minute",
        ctaGithub: "GitHub",
        moreExamples: "Plus d'exemples",
        chat: {
            status: "Nutrition · connecté",
            photoCaption: "📷 Photo",
            pauseLabel: "Mettre la démo en pause",
            exchanges: [
                {
                    userText:
                        "Du porridge aux fruits rouges et un flat white au petit-déjeuner",
                    aiText: "Enregistré — environ 380 kcal, 14 g de protéines. Le flat white ajoute 130 mg de caféine.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description:
                            "Porridge aux fruits rouges et un flat white",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "C'est un Coca-Cola de 330 ml — 139 kcal, 35 g de sucre, d'après Open Food Facts. Enregistré en collation.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Un demi-litre d'eau",
                    aiText: "C'est fait. 500 ml pour l'instant aujourd'hui.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "Une grande salade de poulet grillé au déjeuner",
                    aiText: "Enregistré — environ 540 kcal, 46 g de protéines. Tu es à mi-chemin des 2 000 du jour.",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "Grande salade de poulet grillé",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "Où j'en suis aujourd'hui ?",
                    aiText: "Voici ta journée jusqu'ici — les protéines sont dans les clous, le sucre approche de la limite.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "Comment ça marche",
        title: "Trois étapes. Aucune app à apprendre.",
        sub: "Comment fonctionne le suivi nutritionnel par IA avec un serveur MCP : tu te connectes une fois, tu décris tes repas et tu demandes un bilan quand tu veux.",
        steps: [
            {
                title: "Connecte-toi une fois",
                body: "Ajoute le serveur à Claude, ChatGPT ou tout client MCP et connecte-toi avec Google ou un e-mail. Ça prend moins d'une minute, et tu n'auras jamais à le refaire.",
            },
            {
                title: "Dis simplement ce que tu as mangé",
                body: "Décris-le en langage courant — ou envoie une photo de ton repas, une capture d'une app de livraison, ou un code-barres (le produit est recherché en ligne). Macros enregistrées automatiquement.",
            },
            {
                title: "Suis et consulte",
                body: "Demande des résumés quotidiens, des tendances hebdomadaires, ta progression vers tes objectifs, ou exporte tout ce que tu as enregistré en fichiers CSV — entièrement gratuit.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Installation rapide",
        title: "Connecte Claude, ChatGPT ou Cursor en moins d'une minute.",
        sub: "Ajoute le serveur Nutrition MCP à ton client IA, connecte-toi avec Google ou un e-mail et un mot de passe, et commence à enregistrer tes repas. Rien à installer, rien à apprendre.",
        copyLabel: "Copier",
        copiedLabel: "Copié",
        copyAriaLabel: "Copier l'URL du serveur",
        bullets: [
            "Fonctionne sur tous les forfaits Claude et ChatGPT",
            "OAuth 2.0 — ton client gère la connexion",
            "Connecté dans Claude ou ChatGPT, il te suit sur iOS et Android",
        ],
        otherTabLabel: "Autres agents",
        tabsLabel: "Choisis ton client IA",
        claude: {
            steps: [
                "Ouvre <b>Claude</b> (web ou bureau) et clique sur <b>Personnaliser</b> en haut à gauche.",
                "Clique sur <b>Connecteurs</b>.",
                "Clique sur <b>+</b>, puis <b>Ajouter un connecteur personnalisé</b>.",
                "Donne-lui un nom, par exemple <b>Nutrition</b>.",
                "Colle <code>https://nutrition-mcp.com/mcp</code> dans le champ <b>URL du serveur MCP distant</b>.",
                "Clique sur <b>Ajouter</b>.",
                "Clique sur <b>Connecter</b> — la page de connexion s'ouvre ; continue avec Google ou connecte-toi avec un e-mail et un mot de passe.",
                "C'est fait. Ça fonctionne immédiatement et apparaît automatiquement dans tes apps iOS et Android.",
            ],
            note: "Fonctionne sur tous les forfaits Claude. Le forfait gratuit permet un serveur MCP connecté à la fois.",
        },
        chatgpt: {
            steps: [
                "Ouvre <b>ChatGPT sur le web</b> → <b>Paramètres</b> → <b>Applications</b>.",
                "Clique sur <b>Créer une application</b> en bas de la fenêtre. Si tu ne le vois pas, active le <b>Mode développeur</b> dans <b>Paramètres avancés</b>.",
                "Donne-lui un nom, par exemple <b>Nutrition</b>.",
                "Pour <b>Connexion</b>, colle <code>https://nutrition-mcp.com/mcp</code>.",
                "Pour <b>Authentification</b>, choisis <b>OAuth</b> — laisse tout le reste tel quel.",
                "Clique sur <b>Créer</b>, puis <b>Se connecter avec Nutrition</b>.",
            ],
            note: "Fonctionne sur tous les forfaits ChatGPT.",
        },
        other: {
            noteHtml:
                "Ajoute la config ci-dessus à ton client (Cursor, VS Code, Claude Code, et d'autres). Windsurf utilise <code>serverUrl</code> au lieu de <code>url</code>. Dans Claude Code, exécute <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Ton client gère la connexion OAuth automatiquement.",
        },
    },

    onboarding: {
        title: "Tout régler dans tes cinq premières minutes.",
        sub: "Pas d'écran de réglages. Fuseau horaire, objectifs de calories et de macros, langue des widgets — chacun tient en une phrase que tu dis une seule fois.",
        stepLabel: "Étape {n}",
        justSay: "Dis simplement ",
        steps: [
            {
                title: "Définis ton fuseau horaire",
                body: "Pour que tes journées basculent à ton minuit local, pas à celui de quelqu'un d'autre.",
                say: "Mets mon fuseau horaire sur New York",
            },
            {
                title: "Définis tes objectifs",
                body: "Calories, macros et eau par jour, plus un poids cible facultatif.",
                say: "Mets mon objectif quotidien à 2 000 calories et 150 g de protéines",
            },
            {
                title: "Choisis la langue des widgets",
                body: "La langue des widgets dans le chat — pas celle dans laquelle l'IA te répond.",
                say: "Affiche mes widgets en allemand",
            },
            {
                title: "Commence à enregistrer",
                body: "Dis ce que tu as mangé, envoie une photo ou scanne un code-barres.",
                say: "J'ai pris du porridge aux fruits rouges au petit-déjeuner",
            },
        ],
    },

    examples: {
        title: "Parler bat taper.",
        sub: "Enregistre un repas, scanne un code-barres, fais le bilan de ta semaine — de vraies conversations avec de vrais widgets dans le chat. Fais-en défiler quelques-unes.",
        status: "Nutrition · connecté",
        prevLabel: "Précédent",
        nextLabel: "Suivant",
        pickerLabel: "Choisis un exemple",
        carouselLabel: "Exemples de conversations",
        slideLabel: "{n} sur {total}",
        carouselRole: "carrousel",
        slideRole: "diapositive",
        moreToolsLabel: "Utilise aussi",
        toolLinkLabel: "{tool} sur la page des outils",
        photoMealAlt:
            "Photo : un bol de bortsch avec une cuillerée de crème aigre et de l'aneth, et une tranche de pain de seigle à côté",
        photoPackageAlt:
            "Photo : le code-barres d'une canette de Coca-Cola, numéro 5449000000996",
        threadLabel: "Conversation",
        importerAlt: {
            file: "L'outil d'import dans le chat, étape 1 sur 4 : choisis ton fichier CSV d'export, depuis MyFitnessPal, Cronometer, Lose It! ou MacroFactor",
            map: "Étape 2 sur 4 : les colonnes du fichier sont associées automatiquement ; cet export n'a pas de noms d'aliments",
            preview:
                "Étape 3 sur 4 : un aperçu de 603 repas, 322 343 kcal, avant tout enregistrement",
            done: "Étape 4 sur 4 : 603 repas importés",
        },
        importerCaption:
            "Les écrans de l'outil d'import dans l'ordre ; dans ton chat, c'est une seule carte qui se met à jour sur place",
        downloadExpires: "Expire dans 60 minutes",
        slides: [
            {
                id: "log-meal",
                title: "Enregistrer en une phrase",
                description:
                    "Dis-le comme tu le raconterais à un ami. S'il manque la portion ou le repas concerné, il demande avant d'estimer. Fibres et sucres sur chaque entrée, caféine sur tout ce qui en contient, et « ce matin » tombe dans ton fuseau horaire.",
                toolNotes: {
                    log_meal:
                        "Petit-déjeuner enregistré : macros, fibres, sucres, caféine",
                    log_water:
                        "Ajoute les 500 ml de 07:00 au total d'eau du jour",
                    get_current_time:
                        "Trouve la date du jour pour que « vers 7 h » tombe à 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "porridge aux myrtilles et un café au petit-déj",
                    },
                    {
                        from: "ai",
                        text: "Le bol était grand comment, et le porridge, au lait ou à l'eau ? Quelque chose dans le café ?",
                    },
                    { from: "user", text: "un bol normal, au lait. café noir" },
                    {
                        from: "ai",
                        text: "Petit-déjeuner enregistré : environ 320 kcal, 11 g de protéines et 6 g de fibres. Avec le café, tu en es à 95 mg sur ta limite de 400 mg de caféine.",
                    },
                    {
                        from: "user",
                        text: "ah et j'ai bu genre un demi-litre d'eau vers 7 h, avant mon footing",
                    },
                    {
                        from: "ai",
                        text: "500 ml d'eau ajoutés à 07:00 ce matin.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: [
                    "Porridge au lait et aux myrtilles (1 bol) et café noir (1 tasse)",
                ],
            },
            {
                id: "photo-meal",
                title: "Photographier son assiette",
                description:
                    "Une photo ouvre un échange, pas une devinette. Il établit si c'est fait maison ou au restaurant, regarde comment tu as déjà enregistré ce plat, pose une question à la fois sur les portions et les extras, et n'enregistre qu'une fois le résumé validé.",
                toolNotes: {
                    log_meal:
                        "N'enregistre qu'une fois tout réglé et ton oui donné",
                    search_meals:
                        "Retrouve tes bortschs passés pour te demander lequel",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "le bortsch de maman pour le déj",
                    },
                    {
                        from: "ai",
                        text: "Ça a l'air bon. Tu as enregistré du bortsch 6 fois : 5 au bœuf (environ 320 kcal le bol, la dernière fois le 2 septembre) et une fois sans viande (environ 180). C'est lequel ?",
                    },
                    { from: "user", text: "au bœuf" },
                    {
                        from: "ai",
                        text: "OK, au bœuf. Il reste deux choses : la crème aigre et la quantité. Tu as mis à peu près combien de cuillerées de crème aigre ?",
                    },
                    {
                        from: "user",
                        text: "2 cuillères à soupe, peut-être un peu plus",
                    },
                    {
                        from: "ai",
                        text: "Je compte 2 cuillères à soupe bien pleines. Tu as fini le bol ?",
                    },
                    { from: "user", text: "tout, le pain aussi" },
                    {
                        from: "ai",
                        text: "Donc : bortsch au bœuf (1 bol) avec 2 c. à soupe bombées de crème aigre, plus une tranche de pain de seigle d'après la photo. Environ 470 kcal et 24 g de protéines. Je l'enregistre en déjeuner ?",
                    },
                    { from: "user", text: "oui" },
                    {
                        from: "ai",
                        text: "Déjeuner enregistré : 470 kcal · 24 g de protéines · 43 g de glucides · 22 g de lipides · 7 g de fibres · 10 g de sucres.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 9 }],
                cardMeals: [
                    "Bortsch au bœuf (1 bol, fini) avec crème aigre (2 c. à soupe) et pain de seigle (1 tranche)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scanner un code-barres",
                description:
                    "Photographie l'emballage : les chiffres sous le code-barres sont cherchés dans Open Food Facts, puis il demande combien tu en as pris. La caféine, qu'Open Food Facts n'a pas, vient de la marque ou du web ; fibres ou sucres manquants sont estimés.",
                toolNotes: {
                    lookup_barcode:
                        "Récupère les valeurs de l'étiquette dans Open Food Facts",
                    log_meal:
                        "Enregistre la canette entière au déjeuner, caféine comprise",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "bu avec mon déjeuner. c'est si terrible que ça ?",
                    },
                    {
                        from: "ai",
                        text: "C'est une canette de Coca-Cola de 330 ml : 139 kcal et 35 g de sucre, d'après Open Food Facts. Tu as bu toute la canette ?",
                    },
                    { from: "user", text: "toute la canette" },
                    {
                        from: "ai",
                        text: "Enregistré avec le déjeuner : 139 kcal, 35 g de sucre et 33 mg de caféine, d'après le chiffre de Coca-Cola, puisqu'Open Food Facts n'indique pas la caféine. Et pour savoir si c'est terrible : ce sucre fait à lui seul plus de la moitié de ta limite de 60 g par jour, et Open Food Facts le classe Nutri-Score E et NOVA 4, ultra-transformé.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 3 }],
                cardMeals: ["Coca-Cola (canette de 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Fixer ses objectifs, faire le point",
                description:
                    "Fixe des cibles à atteindre, comme calories et protéines, et des limites à ne pas dépasser pour sucres, alcool et caféine ; seul ce que tu cites change. Puis interroge n'importe quel jour : chaque valeur face à son objectif, et ce qu'il reste.",
                toolNotes: {
                    set_nutrition_goals:
                        "Fixe calories et protéines, et limite la caféine à 400 mg",
                    get_goal_progress:
                        "Montre ta journée face à chaque objectif et ce qu'il reste",
                },
                messages: [
                    {
                        from: "user",
                        text: "j'essaie de sécher un peu. mets-moi à 2000 kcal et 160 g de protéines. et c'est quoi une limite de caféine raisonnable ? je carbure au café",
                    },
                    {
                        from: "ai",
                        text: "L'EFSA et la FDA fixent le plafond pour les adultes en bonne santé à 400 mg par jour, soit environ quatre tasses de café filtre ; pendant la grossesse, l'EFSA conseille 200 mg. On met 400 comme limite ?",
                    },
                    { from: "user", text: "ouais 400" },
                    {
                        from: "ai",
                        text: "C'est fait : 2 000 kcal et 160 g de protéines à atteindre, caféine sous 400 mg. Le reste ne change pas : 220 g de glucides, 70 g de lipides, 30 g de fibres, 2,5 L d'eau et ta limite de 60 g de sucres.",
                    },
                    {
                        from: "user",
                        text: "je peux encore caser un dessert ce soir ?",
                    },
                    {
                        from: "ai",
                        text: "Oui. Tu en es à 1 540 kcal et 104 g de protéines, il te reste donc 460 kcal et 56 g de protéines. Le sucre est plus serré : 40 sur ta limite de 60 g, donc un yaourt grec aux fruits rouges passe mieux qu'un gâteau, et en plus il aide pour les protéines.",
                    },
                ],
                cards: [{ kind: "goal-progress", after: 5 }],
                cardMeals: [
                    "Yaourt grec avec granola et fruits rouges (1 bol)",
                    "Wrap au poulet et salade (1 wrap)",
                    "Flat white (1 tasse)",
                    "Saumon avec riz et brocoli (1 assiette)",
                ],
            },
            {
                id: "review-week",
                title: "Faire le bilan de la semaine",
                description:
                    "Demande le bilan de ta semaine : le widget Tendances s'ouvre dans le chat avec tes moyennes et jours enregistrés. Passe de 7 à 14 ou 30 jours ou touche un nutriment pour sa courbe, sans nouvelle requête. Il te dit aussi tes séries et tes jours dans l'objectif.",
                toolNotes: {
                    get_trends:
                        "Calcule tes moyennes sur 7, 14 et 30 jours et ouvre le widget",
                },
                messages: [
                    {
                        from: "user",
                        text: "ça a donné quoi ces deux dernières semaines ? j'ai l'impression d'avoir fait n'importe quoi",
                    },
                    {
                        from: "ai",
                        text: "Plus régulier que tu ne le crois. Tu es à 1 830 kcal par jour en moyenne, 170 sous tes 2 000, mais ça compte comme zéro le seul jour sur 14 que tu n'as pas enregistré. Sur les 13 jours enregistrés, c'est environ 1 970, avec 9 jours à moins de 10 % de l'objectif. Et tu en es à 10 jours d'enregistrement d'affilée.",
                    },
                    { from: "user", text: "et le sucre ?" },
                    {
                        from: "ai",
                        text: "C'est lui qu'il faut surveiller. Il est à 52 g en moyenne et a dépassé ta limite de 60 g 4 jours sur 13.",
                    },
                ],
                cards: [{ kind: "trends", after: 1 }],
            },
            {
                id: "weight-trend",
                title: "Suivre son poids",
                description:
                    "Enregistre une pesée en kg ou en lb et vois la tendance derrière les variations du quotidien : moyenne lissée, évolution sur le mois, écart avec ton poids cible. Une valeur impossible, comme une virgule oubliée, est repérée avant l'enregistrement.",
                toolNotes: {
                    log_weight:
                        "Enregistre 78,4 kg et refuse une valeur physiquement impossible",
                    get_weight_trends:
                        "Lisse 30 jours en moyennes mobiles, avec l'écart à la cible",
                },
                messages: [
                    { from: "user", text: "je viens de me peser, 784" },
                    {
                        from: "ai",
                        text: "784 kg, aucun corps humain ne pèse ça, donc je ne l'ai pas enregistré. Tu voulais dire 78,4 ?",
                    },
                    {
                        from: "user",
                        text: "mdr oui, j'ai oublié la virgule. c'est quoi ma tendance ?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg enregistrés. Tu as perdu 1,8 kg depuis le 14 août, environ 0,4 kg par semaine, et ta moyenne sur 7 jours est de 78,7 kg. Encore 3,4 kg avant ton objectif de 75 kg.",
                    },
                ],
                cards: [{ kind: "weight-trends", after: 3 }],
            },
            {
                id: "meal-patterns",
                title: "Repérer ses habitudes",
                description:
                    "Demande quand tu manges plus et il compare tes propres enregistrements : semaine et week-end, jours avec ou sans petit-déjeuner, gros déjeuners, dîners tôt ou tard. Il signale aussi les jours inhabituels, et décrit des habitudes, pas des causes.",
                toolNotes: {
                    get_meal_patterns:
                        "Compare petit-déjeuner, heure du dîner et week-end sur 30 jours",
                },
                messages: [
                    {
                        from: "user",
                        text: "est-ce que je mange plus les jours où je saute le petit-déj ? j'ai l'impression",
                    },
                    {
                        from: "ai",
                        text: "Un peu, oui. Tu as enregistré 28 des 30 derniers jours et sauté le petit-déjeuner 6 fois. Ces jours-là, tu es en moyenne à 2 215 kcal, contre 1 940 les 22 jours avec petit-déjeuner, et à environ 35 g de protéines en moins.",
                    },
                    {
                        from: "user",
                        text: "et les dîners tardifs ? les jours de salle, je mange pas avant 21 h",
                    },
                    {
                        from: "ai",
                        text: "Ils ressortent aussi : les 9 jours avec un dîner à 20 h ou plus tard sont en moyenne à 2 165 kcal, contre 1 920 les 19 autres. Ce sont deux tendances dans ton journal, pas la preuve que l'un ou l'autre en est la cause.",
                    },
                    { from: "user", text: "et le week-end ?" },
                    {
                        from: "ai",
                        text: "Presque pareil : 2 010 kcal en moyenne le week-end et 1 993 en semaine.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Suivre aussi les boissons",
                description:
                    "L'alcool n'est suivi que si tu le demandes. Choisis les verres standards américains ou les unités britanniques : chaque boisson est convertie en grammes d'alcool selon son volume et son degré. Désactivé ensuite, il est masqué, jamais supprimé.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Active l'alcool, en grammes avec les unités britanniques",
                    log_meal:
                        "Calcule l'alcool de la pinte selon son volume et son degré",
                },
                messages: [
                    {
                        from: "user",
                        text: "tu peux compter mes verres aussi ? j'essaie de lever un peu le pied",
                    },
                    {
                        from: "ai",
                        text: "Bien sûr. J'affiche l'alcool en verres standards américains ou en unités britanniques ?",
                    },
                    {
                        from: "user",
                        text: "unités britanniques, j'habite à Manchester",
                    },
                    {
                        from: "ai",
                        text: "Le suivi de l'alcool est activé, en grammes avec les unités britanniques.",
                    },
                    { from: "user", text: "une pinte de lager au dîner" },
                    {
                        from: "ai",
                        text: "Elle faisait combien de degrés ? Les lagers tournent en général entre 4 et 5 %, c'est indiqué sur la tireuse ou la canette.",
                    },
                    { from: "user", text: "4 %, je crois" },
                    {
                        from: "ai",
                        text: "Enregistré avec le dîner : une pinte de 568 ml à 4 %, c'est 17,9 g d'alcool, 2,3 unités britanniques, environ 180 kcal.",
                    },
                ],
                cards: [{ kind: "meal-logged", after: 7 }],
                cardMeals: ["Lager, 4 % (1 pinte, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Importer son historique",
                description:
                    "Tu viens de MyFitnessPal, Cronometer, Lose It! ou MacroFactor ? Il vérifie d'abord ton fuseau horaire, l'export est lu dans le navigateur, rien n'est enregistré avant que tu confirmes l'aperçu, et réimporter le même fichier ne double jamais un repas.",
                toolNotes: {
                    start_meal_import:
                        "Ouvre l'outil d'import dans le chat pour ton fichier d'export",
                    get_profile:
                        "Remarque qu'aucun fuseau horaire n'est encore défini",
                    set_timezone:
                        "Règle America/Chicago pour placer les repas à l'heure locale",
                },
                messages: [
                    {
                        from: "user",
                        text: "je quitte myfitnesspal. tu peux récupérer mon journal alimentaire ? j'ai l'export",
                    },
                    {
                        from: "ai",
                        text: "Oui. Une chose d'abord : ton fuseau horaire n'est pas défini, donc les repas importés seraient placés à l'heure UTC au lieu de ton heure locale. Tu habites où ?",
                    },
                    { from: "user", text: "chicago" },
                    {
                        from: "ai",
                        text: "Fuseau horaire réglé sur America/Chicago. Choisis maintenant le CSV Nutrition-Summary de ton export MyFitnessPal dans l'outil d'import ci-dessous. Il est lu directement dans ton navigateur, et rien n'est enregistré avant que tu confirmes l'aperçu.",
                    },
                    {
                        from: "user",
                        text: "il a associé les colonnes mais nom de l'aliment affiche (absent de ce fichier) ?",
                    },
                    {
                        from: "ai",
                        text: "C'est normal avec MyFitnessPal : son export a une ligne par repas et par jour, avec les totaux mais sans noms d'aliments. Chaque repas est donc étiqueté par son type, avec ses calories et ses macros intactes.",
                    },
                    {
                        from: "user",
                        text: "603 repas. ça dit qu'ils seront enregistrés à midi ?",
                    },
                    {
                        from: "ai",
                        text: "Oui, l'export a les dates mais pas les heures des repas. Midi garde chaque repas au bon jour à Chicago ; tu ne verras juste pas à quelle heure tu as vraiment mangé.",
                    },
                    { from: "user", text: "c'est fait ! tout est passé ?" },
                    {
                        from: "ai",
                        text: "Tout : 603 repas importés, aucun échec.",
                    },
                ],
                cards: [
                    { kind: "import-meals", after: 3, step: "file" },
                    { kind: "import-meals", after: 3, step: "map" },
                    { kind: "import-meals", after: 5, step: "preview" },
                    { kind: "import-meals", after: 7, step: "done" },
                ],
            },
            {
                id: "export-data",
                title: "Emporter ses données",
                description:
                    "Une seule demande regroupe chaque repas, entrée d'eau et pesée, plus tes objectifs et réglages, dans un ZIP de fichiers CSV avec un README en anglais simple. Chaque horodatage indique son fuseau horaire, et meals.csv se réimporte directement.",
                toolNotes: {
                    export_all_data:
                        "Zippe six fichiers et renvoie un lien privé valable 60 minutes",
                },
                messages: [
                    {
                        from: "user",
                        text: "ma diététicienne veut voir mon journal alimentaire. tu peux me le sortir en tableur ?",
                    },
                    {
                        from: "ai",
                        text: "Voilà : un ZIP avec 1 204 repas, 318 entrées d'eau et 64 pesées, plus tes objectifs et réglages. Ton journal alimentaire, c'est le fichier meals.csv à l'intérieur, qui s'ouvre dans Excel ou Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "je peux juste lui envoyer le lien ?",
                    },
                    {
                        from: "ai",
                        text: "Mieux vaut le télécharger et lui envoyer le fichier. Le lien ne marche plus au bout de 60 minutes, et n'importe qui l'ayant entre les mains peut ouvrir tout ton export, poids et réglages compris, pas seulement les repas.",
                    },
                    {
                        from: "user",
                        text: "bon à savoir. et je pourrais tout restaurer à partir de là plus tard, si besoin ?",
                    },
                    {
                        from: "ai",
                        text: "Tes repas, oui. meals.csv se réimporte directement, et chaque repas que tu as encore est reconnu par son id et ignoré, donc rien n'est compté deux fois. L'eau, le poids, les objectifs et les réglages sont dans le ZIP pour tes archives uniquement ; ils ne peuvent pas être réimportés.",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "En direct · tout le monde, jusqu'ici",
        title: "Petit-déjeuner ici, dîner ailleurs.",
        sub: "Statistiques nutritionnelles en direct, tous comptes Nutrition MCP confondus — calories, repas enregistrés, macros et poids perdu — rafraîchies toutes les cinq secondes.",
        unitGroupLabel: "Unités",
        unitMetricLabel: "Métrique",
        unitImperialLabel: "Impérial",
        refreshBefore: "Rafraîchi toutes les 5 s · prochain dans ",
        refreshAfter: "s",
        sinceOpenLabel: "depuis l'ouverture de cette page",
        cards: {
            calories: "Calories enregistrées",
            foodLogs: "Repas enregistrés",
            protein: "Protéines enregistrées",
            carbs: "Glucides enregistrés",
            fat: "Lipides enregistrés",
            weightLost: "Poids perdu depuis le 2 juillet 2026",
            water: "Eau enregistrée",
        },
        foodLogsUnit: "repas",
        timezonesAfter:
            " fuseaux horaires · les journées basculent au minuit de chacun",
        mapNote: "taille du point = part des comptes · survole un point",
        mapShare: "{share} des comptes",
        mapAriaLabel:
            "Carte du monde en points des comptes Nutrition MCP par fuseau horaire ; un point plus grand signifie une part plus grande",
    },

    support: {
        eyebrow: "Toujours gratuit",
        title: "Suivi nutritionnel gratuit. Pas de forfait premium. Jamais.",
        sub: "Chaque outil, chaque widget, chaque export — pour tout le monde, sans frais. C'est le projet open source d'une seule personne, et le code est sous licence MIT pour que ça reste ainsi.",
        bullets: [
            "Les 36 outils et six widgets inclus",
            "Pas de pub, pas de vente forcée, pas de fonctions verrouillées",
            "Exporte ou supprime tes données à tout moment",
            "Héberge-le toi-même si tu préfères — Dockerfile inclus",
        ],
        patreon: {
            eyebrow: "Facultatif · Patreon",
            title: "S'il te rend service, aide à garder le serveur en ligne.",
            sub: "Le seul coût, c'est l'hébergement et la base de données. Les mécènes le couvrent — le montant que tu veux, résiliable à tout moment. Rien ne se débloque ; tu reçois juste les notes de build en avant-première et ton mot à dire sur la suite.",
            cta: "Soutenir sur Patreon",
            starCta: "Mettre une étoile plutôt",
        },
        postsTitle: "Derniers posts sur Patreon",
        postsAll: "Tous les posts",
        postLinkLabel: "Lire sur Patreon",
    },

    contact: {
        eyebrow: "Contact",
        title: "Dis bonjour.",
        sub: "Un bug, une idée, ou un repas complètement à côté de la plaque ? Écris-moi directement — je lis chaque message.",
        emailAriaLabel: "Envoyer un e-mail à anton@nutrition-mcp.com",
        cards: {
            email: { title: "E-mail", sub: "Pour tout — la ligne directe" },
            issues: {
                title: "Issues GitHub",
                sub: "Bugs et demandes de fonctionnalités, en public",
            },
            patreon: {
                title: "Patreon",
                sub: "Notes de build, votes et discussion entre mécènes",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Questions sur Nutrition MCP.",
        subBefore:
            "Ce que c'est, où ça marche, ce que ça coûte et qui voit tes données. Il manque quelque chose ? ",
        subLink: "Demande-moi directement",
        subAfter: ".",
        categoriesLabel: "Filtrer les questions par catégorie",
        categories: {
            all: "Tout",
            basics: "Bases",
            clients: "Clients",
            tracking: "Suivi",
            data: "Tes données",
        },
    },
    faq: [
        // Bases
        {
            question: "Qu'est-ce que Nutrition MCP ?",
            visibleHtml:
                "Un serveur MCP (Model Context Protocol) gratuit et open source pour le suivi nutritionnel. Connecte-le à Claude, ChatGPT, Cursor ou tout client MCP, et enregistre repas, calories, macros, eau et poids en parlant.",
            category: "basics",
        },
        {
            question: "Qu'est-ce qu'un serveur MCP ?",
            visibleHtml:
                "Un petit service que ton IA peut appeler pendant que tu discutes. Nutrition MCP donne à Claude, ChatGPT, Cursor et compagnie 36 outils de nutrition — enregistrement, objectifs, tendances, import et export. Tu ne vois jamais les outils ; tu parles, c'est tout.",
            category: "basics",
        },
        {
            question: "Nutrition MCP est-il gratuit ?",
            visibleHtml:
                "Oui. Pas de forfait premium, pas de pub, pas de fonctions verrouillées. Il te faut juste un compte Claude ou ChatGPT pour te connecter. Les dons sur Patreon couvrent la facture du serveur.",
            category: "basics",
        },
        // Clients
        {
            // The visible answer now states the server URL itself, so the
            // JSON-LD override the old page carried is no longer needed.
            question: "Ça fonctionne avec ChatGPT ?",
            visibleHtml:
                "Oui. Dans ChatGPT sur le web, ouvre Paramètres → Applications → Créer une application, colle <code>https://nutrition-mcp.com/mcp</code> avec l'authentification OAuth et connecte-toi. Ça fonctionne sur tous les forfaits ChatGPT.",
            category: "clients",
        },
        {
            question: "Ça fonctionne avec Cursor, VS Code ou Claude Code ?",
            visibleHtml:
                "Oui — tout client qui prend en charge les serveurs MCP distants via HTTP. Ajoute l'URL à ton <code>mcp.json</code>, ou dans Claude Code exécute <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "Ça fonctionne sur mon téléphone ?",
            visibleHtml:
                "Oui. Connecte-le une fois dans Claude ou ChatGPT sur le web ou sur ordinateur, et il apparaît automatiquement dans leurs apps iOS et Android.",
            category: "clients",
        },
        // Suivi
        {
            // Kept from the previous landing page verbatim: names caffeine
            // "en milligrammes", mirroring the test-pinned English answer.
            question: "Que puis-je suivre ?",
            visibleHtml:
                "Calories, protéines, glucides, lipides, fibres, sucres totaux et eau pour chaque entrée — décrits en langage courant ou récupérés depuis le code-barres d'un produit via Open Food Facts. La caféine est suivie aussi, en milligrammes, l'unité utilisée par toutes les étiquettes, et elle n'ajoute aucune calorie. L'alcool est suivi également, en grammes d'éthanol pur, une fois que tu l'actives. Tu peux aussi enregistrer ton poids en kg ou en lb et suivre les tendances vers un poids cible. Consulte des résumés quotidiens, interroge tes repas par période, modifie ou supprime des entrées passées, définis des objectifs et surveille les tendances dans le temps.",
            category: "tracking",
        },
        {
            question: "Le comptage des calories est-il précis ?",
            visibleHtml:
                "Les chiffres sont des estimations à partir de ce que tu décris, comme le ferait un ami qui s'y connaît — bien pour les tendances, pas pour des décisions médicales. Les scans de codes-barres utilisent les données d'Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Est-ce que ça suit l'alcool ?",
            visibleHtml:
                "Seulement si tu l'actives. Le suivi de l'alcool est désactivé par défaut ; une fois activé, les boissons sont enregistrées en grammes d'éthanol et affichées en verres standards américains ou en unités britanniques.",
            category: "tracking",
        },
        // Tes données
        {
            // The closing sentence mirrors the test-pinned English one: the
            // export takes everything out, but only meals come back in.
            question:
                "Puis-je importer mon historique MyFitnessPal ou Cronometer ?",
            visibleHtml:
                "Oui. Importe ton historique de repas depuis MyFitnessPal, Cronometer, Lose It!, MacroFactor ou n'importe quel CSV en associant ses colonnes — jusqu'à 50 lignes par appel. Les repas sont pour l'instant la seule partie qui peut être réimportée.",
            category: "data",
        },
        {
            // Names meals, water, weight, goals and profile — the five files
            // in the export archive.
            question: "Qui peut voir mes données, et puis-je les exporter ?",
            visibleHtml:
                "Toi seul. Exporte tout — repas, eau, poids, objectifs, profil — en un ZIP de fichiers CSV avec un lien de téléchargement valable 60 minutes, ou supprime carrément ton compte. Sous licence MIT, donc tu peux aussi l'héberger toi-même.",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "Puis-je l'héberger moi-même ?",
            visibleHtml:
                'Oui. Nutrition MCP est open source (MIT). Tu peux faire tourner ta propre instance avec ton propre projet Supabase — le <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">dépôt GitHub</a> inclut un guide d\'auto-hébergement complet et un Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Ton prochain repas tient en une phrase.",
        sub: "Suivi nutritionnel gratuit et open source pour Claude, ChatGPT et Cursor — et tes données restent les tiennes, à exporter ou supprimer quand tu veux.",
        primary: "Connecter maintenant",
        secondary: "Star sur GitHub",
    },
};

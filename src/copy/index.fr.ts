// French (fr) translation of the landing page content — see src/copy/index.ts
// for the authoritative shape (`IndexDoc`), the full doc comments on what
// each field means, and which fields carry trusted HTML. The demo
// conversations (hero chat and example slides) are structured: only the words
// translate; `photo`, `card`, `meal.type`, `id`, `from`, `download`, `cards`
// and the `toolNotes` keys are structure, copied verbatim from English. Every
// figure a widget card draws is quoted unchanged.
//
// Terminology kept consistent with tools.fr.ts and alternatives.fr.ts:
// protein → protéines, carbs → glucides, fat → lipides, fiber → fibres,
// (total) sugar → sucres (totaux), alcohol → alcool (grammes d'éthanol pur),
// caffeine → caféine, meal → repas, water → eau, weigh-in → pesée,
// goals → objectifs, timezone → fuseau horaire, export → exporter/export,
// widget → widget, importer → outil d'import. Informal "tu" register
// throughout, matching the English source's direct, plain-spoken address to
// the reader.
//
// Numbers follow French typography: a no-break space as the thousands
// separator ("2 000", not "2,000" — which a French reader parses as a
// decimal) and before "%", a decimal comma ("78,4 kg"). Per the fr glossary,
// a literal U+00A0 sits before ":" ";" "!" "?", inside « », and between a
// number and its unit, so high punctuation never wraps onto its own line.

import type { IndexDoc } from "./index.js";

export const INDEX_FR: IndexDoc = {
    title: "Nutrition MCP — Compteur de calories pour Claude et ChatGPT",
    metaDescription:
        "Enregistre tes repas, calories et macros en parlant à Claude ou ChatGPT. Serveur MCP gratuit et open source : codes-barres, suivi du poids, export complet.",
    ogDescription:
        "Enregistre tes repas, calories et macros en parlant à Claude ou ChatGPT. Serveur MCP gratuit et open source : codes-barres, suivi du poids, export complet.",
    keywords:
        "suivi nutritionnel, suivi des repas, serveur MCP, Claude AI, ChatGPT, compteur de calories, suivi des macros, scanner de codes-barres, journal alimentaire, suivi de régime, suivi du poids, carnet de poids, nutrition IA, Model Context Protocol",

    hero: {
        titleBeforeEm: "Suis ta nutrition en ",
        titleEm: "parlant",
        titleAfterEm: " à ton IA.",
        lead: "Connecte Claude ou ChatGPT, puis dis simplement ce que tu as mangé. Calories et macros, enregistrées automatiquement.",
        ctaPrimary: "Installation rapide",
        ctaSecondary: "Soutenir",
        moreExamples: "Plus d'exemples",
        chat: {
            photoAlt:
                "Photo : un smoothie bowl garni de banane, de fruits rouges et de granola, avec un americano à côté",
            pauseLabel: "Mettre la démo en pause",
            replayLabel: "Rejouer la démo",
            exchanges: [
                {
                    photo: true,
                    userText: "petit-déj + americano",
                    aiText: "Un smoothie bowl maison, on dirait. Tu l'as déjà pris de deux façons : avec granola et miel, ou juste avec des fruits. Lequel, cette fois ?",
                },
                {
                    userText: "granola et miel, une bonne cuillère",
                    aiText: "Noté. Et l'americano : simple ou double, avec du lait ?",
                },
                {
                    userText: "double, un nuage de lait d'avoine",
                    aiText: "Donc : le bowl avec une poignée de granola et 1 c. à soupe de miel, et un americano double avec un nuage de lait d'avoine. Environ 480 kcal et 21 g de protéines. Je l'enregistre ?",
                },
                {
                    userText: "oui",
                    aiText: "Petit-déjeuner enregistré : 480 kcal, 21 g de protéines et 126 mg de caféine. Côté sucres, tu en es déjà à 51 g sur ta limite de 60 g.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 bol : yaourt grec, banane, fruits rouges) avec granola (1 poignée) et miel (1 c. à soupe) ; americano double avec un nuage de lait d'avoine",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "déjeuner : le reste du wok d'hier soir, même portion. et une bouteille d'eau de 500 ml",
                    aiText: "Déjeuner enregistré, comme hier soir : 620 kcal et 54 g de protéines, plus 500 ml d'eau.",
                    meal: {
                        description:
                            "Reste de wok (1 portion, comme hier soir)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "collation : j'ai piqué 6 frites à mon gamin. me juge pas",
                    aiText: "Aucun jugement. Environ 50 kcal, noté en collation.",
                    meal: {
                        description:
                            "Frites (6, piquées dans l'assiette de mon enfant)",
                        type: "snack",
                    },
                },
                {
                    userText: "il me reste quoi pour le dîner ?",
                    aiText: "Il te reste 850 kcal et 84 g de protéines. Côté sucres, tu en es à 59 g sur ta limite de 60 g.",
                    card: "nutrition-summary",
                },
                {
                    userText: "et mon poids, ça donne quoi ?",
                    aiText: "1,4 kg de moins depuis le 11 février, de 80,2 à 78,8 kg. Plus que 3,8 kg pour atteindre ton objectif de 75 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Trois étapes. Aucune app à apprendre.",
        steps: [
            {
                title: "Connecte ton IA une fois",
                body: "Fonctionne avec tout client IA compatible avec les serveurs MCP distants : Claude, ChatGPT et d'autres. Rien à installer, aucune clé API.",
            },
            {
                title: "Dis simplement ce que tu as mangé",
                body: "Décris-le en langage courant, ou envoie une photo de ton repas, une capture d'écran d'une app de livraison ou un code-barres (le produit est recherché en ligne). Les macros sont enregistrées automatiquement.",
            },
            {
                title: "Suis et fais le point",
                body: "Demande des résumés quotidiens, des tendances hebdomadaires, où tu en es de tes objectifs, ou exporte tout ce que tu as enregistré en fichiers CSV. Entièrement gratuit.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "Connecte-le en moins d'une minute",
        sub: "Fonctionne avec tout client MCP compatible OAuth 2.0 avec PKCE. À la première connexion, tu crées un compte avec Google ou un e-mail et un mot de passe ; connecte-toi de la même façon pour retrouver tes données.",
        copyAriaLabel: "Copier l'URL du serveur",
        tabsLabel: "Choisis ton client IA",
        claude: {
            cta: "Ajouter à Claude",
            steps: [
                "Sur la page de l'annuaire, clique sur <strong>Connecter</strong>, puis continue avec Google ou connecte-toi avec un e-mail et un mot de passe.",
                "C'est tout. Ça marche tout de suite, et ça apparaît automatiquement dans tes apps iOS et Android.",
            ],
            note: "Fonctionne sur tous les forfaits Claude, y compris le forfait gratuit. Pour l'ajouter à la main, va dans Personnaliser → Connecteurs → Ajouter un connecteur personnalisé et saisis https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Ouvre <strong>ChatGPT sur le web</strong> → <strong>Paramètres</strong> → <strong>Applications</strong>.",
                "Clique sur <strong>Créer une application</strong> en bas de la fenêtre. Si tu ne le vois pas, active le <strong>Mode développeur</strong> dans <strong>Paramètres avancés</strong>.",
                "Donne-lui un nom, par exemple <strong>Nutrition</strong>.",
                "Dans le champ <strong>Connexion</strong>, colle <code>https://nutrition-mcp.com/mcp</code>.",
                "Dans <strong>Authentification</strong>, choisis <strong>OAuth</strong> et laisse tout le reste tel quel.",
                "Coche <strong>« I understand and want to continue »</strong>.",
                "Clique sur <strong>Créer</strong>.",
                "Clique sur <strong>Se connecter avec Nutrition</strong> : la page de connexion s'ouvre. Continue avec Google ou connecte-toi avec un e-mail et un mot de passe.",
                "C'est tout. Ça marche tout de suite, et ça apparaît automatiquement dans tes apps iOS et Android.",
            ],
        },
        other: {
            note: "Ajoute la config ci-dessus à ton client (Cursor, VS Code, Claude Code et d'autres). Windsurf utilise <code>serverUrl</code> au lieu de <code>url</code>. Dans Claude Code, exécute <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Ton client s'occupe automatiquement de la connexion OAuth.",
        },
        otherTabLabel: "Autres agents",
    },

    onboarding: {
        title: "Configure-le une fois, ou commence tout de suite à parler",
        sub: "C'est entièrement facultatif : Nutrition MCP fonctionne dès la connexion. Si tu veux, ces trois étapes rapides le rendent plus précis, mais tu peux aussi passer directement à l'enregistrement.",
        justSay: "Dis simplement ",
        steps: [
            {
                title: "Définis ton fuseau horaire",
                body: "pour que le jour change à minuit, heure locale, et que tes totaux du jour restent justes où que tu sois.",
                say: "Règle mon fuseau horaire sur New York",
            },
            {
                title: "Définis tes objectifs",
                body: "tes cibles quotidiennes de calories, de macros et d'eau, plus un poids cible facultatif et ton unité de poids préférée (kg ou lb), pour suivre ta progression.",
                say: "Fixe mon objectif quotidien à 2 000 calories et 150 g de protéines",
            },
            {
                title: "Définis ta langue",
                body: "la langue d'affichage des widgets dans le chat (tableaux de bord, graphiques), pas celle dans laquelle l'IA te répond.",
                say: "Affiche mes widgets en allemand",
            },
            {
                title: "Commence à enregistrer",
                body: "dis simplement ce que tu as mangé, envoie une photo ou scanne un code-barres. C'est tout.",
                say: "J'ai mangé du porridge aux fruits rouges au petit-déj",
            },
        ],
        note: "Tout ça est facultatif. Tu peux le faire maintenant, plus tard ou jamais : commence simplement à enregistrer, et règle le reste quand tu veux.",
        toolsCta: {
            heading: "Envie de voir tout ce qu'il sait faire ?",
            body: "Parcours les 36 outils (enregistrement, codes-barres, eau, poids, objectifs et tendances), chacun avec sa description et un exemple de demande.",
            arrow: "Explorer les outils",
        },
    },

    examples: {
        title: "Il te suffit de lui parler.",
        sub: "Quelques exemples de ce que tu peux faire, rien qu'en parlant.",
        prevLabel: "Exemple précédent",
        nextLabel: "Exemple suivant",
        pickerLabel: "Choisis un exemple",
        carouselLabel: "Exemples",
        threadLabel: "Conversation",
        moreToolsLabel: "Fait aussi appel à",
        toolLinkLabel:
            "{tool} sur la page des outils (s'ouvre dans un nouvel onglet)",
        photoMealAlt:
            "Photo : un bol de bortsch avec une cuillerée de crème fraîche et de l'aneth, et une tranche de pain de seigle à côté",
        photoPackageAlt:
            "Photo : le code-barres d'une canette de Coca-Cola, numéro 5449000000996",
        downloadExpires: "Expire dans 60 minutes",
        slides: [
            {
                id: "log-meal",
                title: "Enregistre avec tes mots",
                description:
                    "Dis-le comme tu le raconterais à un ami. S'il manque la portion ou le repas concerné, il pose la question avant d'estimer. Fibres et sucres sur chaque entrée, caféine dès qu'il y en a, et « ce matin » est compris dans ton fuseau horaire.",
                toolNotes: {
                    log_meal:
                        "Enregistre le petit-déjeuner avec macros, fibres, sucres et la caféine du café",
                    log_water:
                        "Ajoute les 500 ml bus à 07:00 au total d'eau du jour",
                    get_current_time:
                        "Détermine la date du jour pour placer « vers 7 h » à 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "porridge aux myrtilles et un café au petit-déj",
                    },
                    {
                        from: "ai",
                        text: "Le bol était grand comment, et le porridge, au lait ou à l'eau ? Quelque chose dans le café ?",
                    },
                    {
                        from: "user",
                        text: "un bol normal, au lait. café noir",
                    },
                    {
                        from: "ai",
                        text: "Petit-déjeuner enregistré : environ 320 kcal, 11 g de protéines et 6 g de fibres. Avec le café, tu en es à 95 mg sur ta limite de 400 mg de caféine.",
                    },
                    {
                        from: "user",
                        text: "ah et j'ai bu genre un demi-litre d'eau vers 7 h, avant mon footing",
                    },
                    {
                        from: "ai",
                        text: "500 ml d'eau ajoutés à 07:00 ce matin.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: [
                    "Porridge au lait et aux myrtilles (1 bol) et café noir (1 tasse)",
                ],
            },
            {
                id: "photo-meal",
                title: "Prends ton assiette en photo",
                description:
                    "Avec une photo, il discute au lieu de deviner. Il demande si le repas était fait maison ou pris au restaurant, consulte ton historique pour ce que la photo ne montre pas, te demande la quantité en mesures simples, et n'enregistre qu'une fois que tu as validé le récapitulatif.",
                toolNotes: {
                    search_meals:
                        "Retrouve ton bortsch précédent chez Tsybulya et ce qu'il contenait",
                    log_meal:
                        "L'enregistre avec le nom du restaurant, dès que tu dis oui",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "déj",
                    },
                    {
                        from: "ai",
                        text: "On dirait un bortsch avec de la crème fraîche et une tranche de pain de seigle. Fait maison ou au restaurant ? Si c'était au restaurant, lequel ?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, à Podil, à Kyiv",
                    },
                    {
                        from: "ai",
                        text: "Tu as déjà enregistré deux fois un bortsch chez Tsybulya, à chaque fois la version au bœuf avec crème fraîche. Pareil cette fois ? Et tu as fini le bol et le pain ?",
                    },
                    {
                        from: "user",
                        text: "pareil, tout fini, le pain aussi",
                    },
                    {
                        from: "ai",
                        text: "Donc : bortsch au bœuf avec crème fraîche (1 bol, fini) et pain de seigle (1 tranche) chez Tsybulya, Podil, Kyiv. Environ 520 kcal et 24 g de protéines, estimés, pas des valeurs publiées. Je l'enregistre en déjeuner ?",
                    },
                    {
                        from: "user",
                        text: "oui",
                    },
                    {
                        from: "ai",
                        text: "Déjeuner enregistré : 520 kcal · 24 g de protéines · 43 g de glucides · 27 g de lipides · 7 g de fibres · 10 g de sucres.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: [
                    "Bortsch au bœuf avec crème fraîche (1 bol, fini) et pain de seigle (1 tranche) chez Tsybulya, Podil, Kyiv",
                ],
            },
            {
                id: "scan-barcode",
                title: "Scanne un code-barres",
                description:
                    "Prends l'emballage en photo : les chiffres sous le code-barres sont recherchés dans Open Food Facts, puis il te demande quelle quantité tu as prise. Open Food Facts n'indique pas la caféine : elle vient donc de l'étiquette ou de valeurs courantes. Si les fibres ou les sucres manquent, ils sont estimés plutôt que laissés vides.",
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
                        text: "bu ça au déj. c'est si grave que ça ?",
                    },
                    {
                        from: "ai",
                        text: "C'est une canette de Coca-Cola de 330 ml : 139 kcal et 35 g de sucres, d'après Open Food Facts. Tu as bu toute la canette ?",
                    },
                    {
                        from: "user",
                        text: "toute la canette",
                    },
                    {
                        from: "ai",
                        text: "Enregistré avec le déjeuner : 139 kcal, 35 g de sucres et 33 mg de caféine d'après l'étiquette de la canette, puisqu'Open Food Facts n'indique pas la caféine. Et pour savoir si c'est grave : à eux seuls, ces sucres représentent plus de la moitié de ta limite de 60 g par jour, et Open Food Facts classe la boisson Nutri-Score E et NOVA 4, ultra-transformée.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: ["Coca-Cola (canette de 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Fixe tes objectifs, fais le point",
                description:
                    "Fixe des cibles à atteindre, comme les calories et les protéines, et des limites à ne pas dépasser pour les sucres, l'alcool et la caféine ; seul ce que tu mentionnes change. Ensuite, demande-lui où tu en es pour n'importe quel jour : chaque valeur face à son objectif, et ce qu'il te reste.",
                toolNotes: {
                    set_nutrition_goals:
                        "Enregistre les cibles de calories et de protéines, et une limite de caféine de 400 mg",
                    get_goal_progress:
                        "Montre ta journée face à chaque objectif et ce qu'il reste",
                },
                messages: [
                    {
                        from: "user",
                        text: "j'essaie de sécher un peu. mets-moi à 2000 kcal et 160 g de protéines. et c'est quoi une limite de caféine raisonnable ? je carbure au café",
                    },
                    {
                        from: "ai",
                        text: "Pour les adultes en bonne santé, l'EFSA et la FDA la situent à 400 mg par jour au maximum, soit environ quatre tasses de café filtre, et l'EFSA conseille 200 mg pendant la grossesse. C'est toi qui fixes la limite. On part sur 400 ?",
                    },
                    {
                        from: "user",
                        text: "ouais 400",
                    },
                    {
                        from: "ai",
                        text: "C'est fait : 2 000 kcal et 160 g de protéines à atteindre, caféine sous 400 mg. Le reste ne change pas : 220 g de glucides, 70 g de lipides, 30 g de fibres, 2,5 L d'eau et ta limite de 60 g de sucres.",
                    },
                    {
                        from: "user",
                        text: "je peux encore caser un dessert ce soir ?",
                    },
                    {
                        from: "ai",
                        text: "Tu en es à 1 540 kcal et 104 g de protéines, il te reste donc 460 kcal et 56 g de protéines. Côté sucres, c'est plus serré : 40 sur ta limite de 60 g, soit 20 g de marge. La caféine est à 130 sur 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Fais le bilan de la semaine",
                description:
                    "Demande comment s'est passée ta semaine, et la carte des tendances s'ouvre dans le chat avec tes moyennes et les jours enregistrés. Passe de 7 à 14 ou 30 jours, ou touche un nutriment pour afficher sa courbe, sans nouvelle demande. Il peut aussi t'indiquer tes séries et les jours où tu as tenu ton objectif.",
                toolNotes: {
                    get_trends:
                        "Calcule tes moyennes sur 7, 14 et 30 jours et ouvre la carte des tendances",
                },
                messages: [
                    {
                        from: "user",
                        text: "ça a donné quoi ces deux dernières semaines ? j'ai l'impression d'avoir fait n'importe quoi",
                    },
                    {
                        from: "ai",
                        text: "Plus régulier que tu ne le crois. Tu es à 1 830 kcal par jour en moyenne, 170 de moins que tes 2 000, mais cette moyenne compte pour zéro le seul jour sur 14 où tu n'as rien enregistré. Sur les 13 jours enregistrés, c'est environ 1 970, avec 9 jours à moins de 10 % de l'objectif. Et tu en es à 10 jours d'enregistrement d'affilée.",
                    },
                    {
                        from: "user",
                        text: "et le sucre ?",
                    },
                    {
                        from: "ai",
                        text: "C'est le point à surveiller : 52 g en moyenne, et ta limite de 60 g dépassée 4 jours sur 13.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Suis ton poids",
                description:
                    "Enregistre une pesée en kg ou en lb et vois la tendance derrière les variations du quotidien : moyenne lissée, évolution sur le mois, écart avec ton poids cible. Une valeur impossible, comme une virgule oubliée, est repérée avant l'enregistrement.",
                toolNotes: {
                    log_weight:
                        "Refuse 784 kg comme invraisemblable, puis enregistre 78,4 kg",
                    get_weight_trends:
                        "Lisse 30 jours en moyennes mobiles, avec l'écart à la cible",
                },
                messages: [
                    {
                        from: "user",
                        text: "je viens de me peser, 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg, c'est hors de la plage plausible pour un poids corporel (20–500 kg) : rien n'a été enregistré. Tu voulais dire 78,4 kg ?",
                    },
                    {
                        from: "user",
                        text: "mdr oui, j'ai oublié la virgule. c'est quoi ma tendance ?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg enregistrés. Tu as perdu 1,8 kg depuis le 11 février, environ 0,4 kg par semaine, et ta moyenne sur 7 jours est de 78,7 kg. Encore 3,4 kg avant ton objectif de 75 kg.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Repère tes habitudes",
                description:
                    "Demande quand tu manges plus et il compare tes propres enregistrements : semaine et week-end, jours avec ou sans petit-déjeuner, gros déjeuners, dîners tôt ou tard. Il signale aussi les jours inhabituels, et décrit des tendances, pas des causes.",
                toolNotes: {
                    get_meal_patterns:
                        "Compare petit-déjeuner, heure du dîner et week-end sur 30 jours",
                },
                messages: [
                    {
                        from: "user",
                        text: "est-ce que je mange plus les jours où je saute le petit-déj ? j'ai l'impression",
                    },
                    {
                        from: "ai",
                        text: "Un peu, oui. Tu as enregistré 28 des 30 derniers jours et sauté le petit-déjeuner 6 fois. Ces jours-là, tu es en moyenne à 2 215 kcal, contre 1 940 les 22 jours avec petit-déjeuner, et à environ 35 g de protéines en moins.",
                    },
                    {
                        from: "user",
                        text: "et les dîners tardifs ? les jours de salle, je mange pas avant 21 h",
                    },
                    {
                        from: "ai",
                        text: "Ils ressortent aussi : les 9 jours avec un dîner à 20 h ou plus tard sont en moyenne à 2 165 kcal, contre 1 920 les 19 autres. Ce sont deux tendances dans ton journal, pas la preuve que l'un ou l'autre en est la cause.",
                    },
                    {
                        from: "user",
                        text: "et le week-end ?",
                    },
                    {
                        from: "ai",
                        text: "Presque pareil : 2 010 kcal en moyenne le week-end et 1 993 en semaine.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Suis aussi tes boissons",
                description:
                    "L'alcool reste masqué tant que tu n'actives pas son suivi. Choisis les verres standards américains ou les unités britanniques, et chaque boisson est convertie en grammes d'alcool selon son volume et son degré. Si tu le désactives ensuite, l'alcool est de nouveau masqué, pas supprimé.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Active le suivi de l'alcool, en grammes avec les unités britanniques",
                    log_meal:
                        "Calcule l'alcool de la pinte selon son volume et son degré",
                },
                messages: [
                    {
                        from: "user",
                        text: "tu peux compter mes verres aussi ? j'essaie de lever un peu le pied",
                    },
                    {
                        from: "ai",
                        text: "Bien sûr. J'affiche l'alcool en verres standards américains ou en unités britanniques ?",
                    },
                    {
                        from: "user",
                        text: "unités britanniques, j'habite à Manchester",
                    },
                    {
                        from: "ai",
                        text: "Le suivi de l'alcool est activé, en grammes avec les unités britanniques.",
                    },
                    {
                        from: "user",
                        text: "une pinte de lager au dîner",
                    },
                    {
                        from: "ai",
                        text: "Elle faisait combien de degrés ? Les lagers tournent en général entre 4 et 5 %, c'est indiqué sur la tireuse ou la canette.",
                    },
                    {
                        from: "user",
                        text: "4 %, je crois",
                    },
                    {
                        from: "ai",
                        text: "Enregistré avec le dîner : une pinte de 568 ml à 4 %, soit 17,9 g d'alcool, 2,3 unités britanniques, environ 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lager, 4 % (1 pinte, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Importe ton historique",
                description:
                    "Tu viens de MyFitnessPal, Cronometer, Lose It! ou MacroFactor ? L'outil d'import s'ouvre dans le chat, lit et associe ton export dans le navigateur, n'enregistre rien tant que tu n'as pas validé l'aperçu, et ne crée pas de doublon si tu réimportes le même fichier avec le même fuseau horaire. S'il manque un fuseau horaire, il te le signale avant de commencer.",
                toolNotes: {
                    start_meal_import:
                        "Ouvre l'outil d'import dans le chat pour ton fichier d'export",
                    set_timezone:
                        "Règle America/Chicago pour placer les repas à l'heure locale",
                },
                messages: [
                    {
                        from: "user",
                        text: "je quitte myfitnesspal. tu peux récupérer mon journal alimentaire ? j'ai l'export",
                    },
                    {
                        from: "ai",
                        text: "L'outil d'import est ouvert ci-dessous. Une chose avant de choisir le fichier : aucun fuseau horaire n'est défini sur ton compte, donc les heures seraient lues en UTC. Tu habites où ?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Réglé sur America/Chicago. Choisis maintenant le CSV Nutrition-Summary de ton export MyFitnessPal. Il est lu directement dans ton navigateur, et rien n'est enregistré tant que tu n'as pas confirmé l'aperçu.",
                    },
                    {
                        from: "user",
                        text: "il a associé les colonnes, mais pour le nom de l'aliment c'est marqué «{N}pas dans ce fichier{N}» ?",
                    },
                    {
                        from: "ai",
                        text: "C'est normal avec MyFitnessPal : son export a une ligne par repas et par jour, avec les totaux mais sans noms d'aliments. Chaque repas est donc désigné par son type de repas, avec ses calories et ses macros intactes.",
                    },
                    {
                        from: "user",
                        text: "603 repas. ça dit qu'ils seront enregistrés à midi ?",
                    },
                    {
                        from: "ai",
                        text: "Oui, l'export a les dates mais pas les heures des repas, donc chacun est placé à midi, heure locale. Comme ça, chaque repas reste au bon jour à Chicago ; tu ne verras simplement pas à quelle heure tu as vraiment mangé.",
                    },
                    {
                        from: "user",
                        text: "c'est fait ! tout est passé ?",
                    },
                    {
                        from: "ai",
                        text: "Tout : 603 repas importés, aucun échec.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Récupère tes données",
                description:
                    "Une seule demande regroupe tout ce qui est stocké à ton sujet (repas, eau, pesées, objectifs, réglages du profil, données de ton compte, télémétrie d'utilisation et applications connectées) dans un ZIP de fichiers CSV accompagné d'un README. Les horodatages suivent ton fuseau horaire, et meals.csv se réimporte tel quel.",
                toolNotes: {
                    export_all_data:
                        "Compresse huit fichiers CSV et un README en un ZIP, accessible par un lien valable 60 minutes",
                },
                messages: [
                    {
                        from: "user",
                        text: "ma diététicienne veut voir mon journal alimentaire. tu peux me le sortir en tableur ?",
                    },
                    {
                        from: "ai",
                        text: "Voilà : un ZIP avec 1 204 repas, 318 entrées d'eau et 64 pesées, plus tes objectifs, les réglages de ton profil, les données de ton compte, la télémétrie d'utilisation des outils et tes applications connectées. Ton journal alimentaire, c'est le fichier meals.csv à l'intérieur, qui s'ouvre dans Excel ou Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "je peux juste lui envoyer le lien ?",
                    },
                    {
                        from: "ai",
                        text: "Mieux vaut le télécharger et lui envoyer le fichier. Le lien ne marche plus au bout de 60 minutes, et toute personne qui l'a peut ouvrir tout ton export : poids, données du compte et réglages compris, pas seulement les repas.",
                    },
                    {
                        from: "user",
                        text: "bon à savoir. et je pourrais tout restaurer à partir de là plus tard, si besoin ?",
                    },
                    {
                        from: "ai",
                        text: "Tes repas, oui. meals.csv utilise les noms de colonnes de l'outil d'import, donc il se réimporte directement, et les repas déjà présents dans ton journal sont reconnus et ignorés : rien n'est compté deux fois. Les autres fichiers sont juste pour tes archives : ils ne peuvent pas être réimportés.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Petit-déjeuner ici, dîner ailleurs.",
        sub: "Statistiques nutritionnelles en direct, tous comptes Nutrition MCP confondus (calories, repas enregistrés, macros et poids perdu), actualisées toutes les cinq secondes.",
        liveLabel: "En direct",
        unitGroupLabel: "Unités",
        unitMetricLabel: "Métrique",
        unitImperialLabel: "Impérial",
        unitKgLabel: "Métrique (kg)",
        unitLbLabel: "Impérial (lb)",
        refreshBefore: "Actualisation toutes les 5 s · prochaine dans ",
        refreshAfter: " s",
        sinceOpenLabel: "depuis l'ouverture de cette page",
        calCaption: "Calories enregistrées",
        cards: {
            foodLogs: "Repas enregistrés",
            protein: "Protéines enregistrées",
            carbs: "Glucides enregistrés",
            fat: "Lipides enregistrés",
            weightLost: "Poids perdu depuis le 2 juillet 2026",
            water: "Eau enregistrée",
        },
        // "repas" is invariable: "+1 repas", "+3 repas".
        foodLogsUnit: { one: "repas", other: "repas" },
        timezonesAfter:
            " fuseaux horaires · le jour change à minuit, à l'heure locale de chacun",
        mapNote: "taille du point = part des profils",
        mapAriaLabel:
            "Carte du monde des fuseaux horaires définis dans les profils, chacun affiché dès qu'au moins trois profils l'utilisent",
        foot: "Totaux tous comptes confondus, mis à jour à chaque repas enregistré. Les données individuelles ne sont jamais affichées.",
    },

    features: {
        title: "Ce que tu peux suivre",
        cards: [
            {
                title: "Repas en langage courant",
                body: "Décris ce que tu as mangé : ton IA estime les calories, protéines, glucides, lipides, fibres, sucres totaux et la caféine en milligrammes, puis enregistre le tout.",
            },
            {
                title: "Scanne un code-barres",
                body: "Prends en photo ou tape le code-barres d'un produit et récupère ses macros, fibres et sucres depuis Open Food Facts, ajustés à la quantité mangée.",
            },
            {
                title: "Objectifs et progression",
                body: "Définis tes cibles quotidiennes de calories, macros, fibres et eau, plus des limites à ne pas dépasser pour les sucres, la caféine et l'alcool, et suis ta progression en direct.",
            },
            {
                title: "Résumés et tendances",
                body: "Bilans quotidiens et hebdomadaires, tendances sur 7/14/30 jours, séries et habitudes alimentaires récurrentes.",
            },
            {
                title: "Suivi de l'eau",
                body: "Suis ton hydratation en millilitres en plus de tes repas et consulte-la jour par jour.",
            },
            {
                title: "Suivi du poids",
                body: "Enregistre ton poids en kg ou en lb, consulte les tendances sur 7/14/30 jours et suis ta progression vers un poids cible.",
            },
            {
                title: "Ton fuseau horaire, pris en compte",
                body: "Tes journées suivent ton heure locale, où que tu sois dans le monde.",
            },
            {
                title: "Import depuis une autre app",
                body: "Récupère ton historique de repas depuis MyFitnessPal, Cronometer, Lose It! ou MacroFactor, ou depuis n'importe quel autre CSV en associant toi-même ses colonnes. Rien n'est enregistré avant que tu aies validé ce qui sera ajouté.",
            },
            {
                title: "Exporte tes données, elles t'appartiennent",
                body: "Récupère tout ce que nous stockons à ton sujet (repas, eau, poids, objectifs et profil, ainsi que les données de ton compte, ta télémétrie d'utilisation et tes applications connectées) dans un seul ZIP de fichiers CSV. Pour l'instant, seuls les repas peuvent être réimportés. Supprime ton compte et tes données quand tu veux.",
            },
        ],
    },

    why: {
        title: "Parler, c'est plus simple que taper.",
        sub: "Scanne un code-barres ou dis simplement ce que tu as mangé : pas de recherche dans une base de données, pas d'app à part à ouvrir.",
        oldHeading: "Apps traditionnelles",
        oldItems: [
            "Chercher chaque aliment dans une base de données",
            "Corriger à la main les entrées erronées de la base",
            "Encore une app à ouvrir, souvent avec un abonnement payant",
            "Enregistrement manuel fastidieux",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Décris tes repas en langage courant",
            "Calories et macros estimées pour toi",
            "Gratuit, directement dans Claude ou ChatGPT",
            "Demande tes tendances, résumés et objectifs",
        ],
        noteHtml:
            'Tu quittes une autre app ? Découvre comment Nutrition MCP se compare à <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer et d\'autres apps de suivi</a>.',
    },

    trust: [
        {
            label: "Privé par défaut",
            small: "Tes données ne sont jamais vendues, partagées ni utilisées pour la publicité.",
        },
        {
            label: "Open source",
            small: "Inspecte le code ou héberge-le toi-même.",
        },
        {
            label: "Export à tout moment",
            small: "Tout ce que nous stockons, en CSV dans un seul ZIP.",
        },
        {
            label: "Suppression immédiate",
            small: "Supprime ton compte et tes données.",
        },
    ],

    support: {
        title: "Aide le projet à tourner.",
        sub: "Nutrition MCP est gratuit et sans publicité. Patreon paie les factures du serveur et de la base de données.",
        updatesTitle: "Dernières nouvelles sur Patreon",
        updatesBadge: "Gratuit",
        updatesNote: "Lecture gratuite, sans abonnement.",
        updatesPrevLabel: "Mise à jour précédente",
        updatesNextLabel: "Mise à jour suivante",
        updatesDotLabel: "Mise à jour",
        postLinkLabel: "Lire sur Patreon",
        free: {
            tier: "Membre gratuit",
            price: "0 $",
            desc: "Suis l'actualité du projet : les nouvelles et mises à jour du serveur, les nouveaux outils et ce qui arrive ensuite.",
            cta: "Suivre sur Patreon",
        },
        paid: {
            tier: "Membre payant",
            price: "Paie ce que tu veux",
            desc: "Si Nutrition MCP t'est utile, tu peux aider à couvrir les frais d'hébergement et de base de données. Tout le monde, soutiens compris, a accès aux mêmes fonctionnalités, et l'outil reste gratuit pour tous.",
            cta: "Devenir soutien",
        },
    },

    cta: {
        title: "Commence ton suivi en moins d'une minute.",
        sub: "Gratuit et open source, et ça marche avec l'IA que tu utilises déjà.",
        primary: "Installation rapide",
        secondary: "Mettre une étoile sur GitHub",
    },

    contact: {
        title: "Des questions ou des retours ?",
        sub: "Tu as trouvé un bug, tu veux une fonctionnalité ou tu as juste une question ? Écris-moi directement, je lis tous les messages.",
        cta: "Envoyer un e-mail",
    },

    faqSection: {
        title: "Questions fréquentes",
    },
    faq: [
        {
            question: "Qu'est-ce que Nutrition MCP ?",
            visibleHtml:
                "Nutrition MCP est un serveur Model Context Protocol (MCP) gratuit et open source qui transforme Claude, ChatGPT ou un autre client MCP en compteur de calories et de macros. Plutôt que de chercher dans une base de données d'aliments, tu dis à ton IA ce que tu as mangé, et elle enregistre les calories, les macros, les fibres, les sucres et la caféine dans ton propre journal alimentaire.",
        },
        {
            question: "Qu'est-ce que le Model Context Protocol (MCP) ?",
            visibleHtml:
                "Le Model Context Protocol est un standard ouvert qui permet à des assistants IA comme Claude et ChatGPT de se connecter à des outils et sources de données externes. Un serveur MCP fournit des fonctions précises (ici, le suivi nutritionnel) que l'IA peut utiliser pendant une conversation. C'est un peu comme un système d'extensions pour assistants IA.",
        },
        {
            question: "Comment compter ses calories avec Claude ou ChatGPT ?",
            visibleHtml:
                "Ajoute Nutrition MCP une seule fois (dans Claude depuis l'annuaire des connecteurs, dans ChatGPT comme app personnalisée avec l'URL du serveur), puis connecte-toi. Dis ensuite à ton IA ce que tu as mangé avec tes propres mots, montre-lui une photo du repas ou donne-lui le code-barres d'un produit. Ton IA estime les calories, protéines, glucides, lipides, fibres et sucres, et Nutrition MCP enregistre l'entrée dans ton journal alimentaire. Demande à tout moment tes totaux du jour, tes tendances de la semaine ou ta progression vers tes objectifs.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "Est-ce que ça marche avec ChatGPT ?",
            visibleHtml:
                "Oui. Dans ChatGPT sur le web, ouvre Paramètres → Applications, crée une app personnalisée avec l'URL du serveur via OAuth, et connecte-toi. Créer une app personnalisée nécessite le mode développeur de ChatGPT, qu'OpenAI propose sur certains forfaits ChatGPT.",
            jsonLdText:
                "Oui. Dans ChatGPT sur le web, ouvre Paramètres → Applications, crée une app personnalisée avec l'URL du serveur https://nutrition-mcp.com/mcp via OAuth, et connecte-toi. Créer une app personnalisée nécessite le mode développeur de ChatGPT, qu'OpenAI propose sur certains forfaits ChatGPT.",
        },
        {
            question: "Quels autres clients sont pris en charge ?",
            visibleHtml:
                "Tout client MCP compatible OAuth 2.0 avec PKCE, dont Claude.ai, les apps Claude bureau et mobile, Claude Code, Cursor, Windsurf et VS Code.",
        },
        {
            question: "Puis-je l'héberger moi-même ?",
            visibleHtml:
                'Oui. Nutrition MCP est open source (MIT). Tu peux faire tourner ta propre instance avec ton propre projet Supabase : le <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">dépôt GitHub</a> inclut un guide d\'auto-hébergement complet et un Dockerfile.',
        },
        {
            question: "Nutrition MCP est-il gratuit ?",
            visibleHtml:
                "Oui, c'est entièrement gratuit : pas de forfait payant, pas de publicité, pas de frais cachés. Il te faut une app d'IA compatible avec les connecteurs MCP, comme Claude ou ChatGPT, et un compte Nutrition MCP gratuit, que tu crées lors de ta première connexion. Les dons volontaires sur Patreon aident à couvrir les frais de serveur et ne débloquent rien.",
        },
        {
            question: "Que puis-je suivre ?",
            visibleHtml:
                "Calories, protéines, glucides, lipides, fibres, sucres totaux et eau pour chaque entrée, décrits en langage courant ou récupérés depuis le code-barres d'un produit via Open Food Facts. La caféine est suivie aussi, en milligrammes, l'unité utilisée par toutes les étiquettes, et elle n'ajoute aucune calorie. L'alcool peut aussi être suivi, en grammes d'éthanol pur ; il s'affiche une fois que tu actives le suivi de l'alcool. Tu peux aussi enregistrer ton poids en kg ou en lb et suivre les tendances vers un poids cible. Consulte des résumés quotidiens, retrouve tes repas sur une période donnée, modifie ou supprime des entrées passées, définis des objectifs et suis tes tendances dans la durée.",
        },
        {
            question: "Le comptage des calories est-il précis ?",
            visibleHtml:
                "Ce sont des estimations. Pour un repas que tu décris ou photographies, c'est ton IA qui estime les valeurs ; pour un code-barres, elles viennent des données d'étiquette du produit dans Open Food Facts, que ton IA ajuste à la quantité consommée. Les deux peuvent se tromper, alors vérifie tout ce qui compte : tu peux corriger ou supprimer n'importe quelle entrée simplement en le demandant. Nutrition MCP est un outil d'enregistrement, pas un conseil médical ou diététique : parle à un médecin ou à un diététicien avant de prendre des décisions concernant ta santé, surtout si tu es enceinte, si tu as un problème de santé ou des antécédents de troubles du comportement alimentaire.",
        },
        {
            question: "Est-ce que l'alcool est suivi ?",
            visibleHtml:
                "Oui, en option : le suivi de l'alcool est désactivé par défaut, et l'alcool reste masqué dans tes repas, objectifs et résumés tant que tu ne l'actives pas. Les boissons s'affichent alors en grammes d'éthanol pur et en verres standards américains ou en unités britanniques, selon ta préférence. L'alcool n'est jamais déduit à ta place : il n'est enregistré qu'à partir d'une boisson que tu enregistres ou d'une colonne alcool dans un fichier que tu importes, et une boisson que tu enregistres est sauvegardée même quand le suivi est désactivé. Le désactiver à nouveau masque l'alcool et empêche l'outil d'import de lire les colonnes alcool, mais ne supprime rien, et ton export inclut toujours ce que tu as enregistré. Pour retirer un chiffre d'alcool, supprime le repas auquel il appartient.",
        },
        {
            question:
                "Puis-je importer mon historique depuis MyFitnessPal ou une autre app ?",
            visibleHtml:
                "Oui. Demande à importer ton historique et un outil d'import s'ouvre dans le chat : tu choisis le CSV exporté par ton ancienne app, tu vérifies comment ses colonnes sont associées, et tu vois ce qui sera ajouté avant de confirmer. Les exports de MyFitnessPal, Cronometer, Lose It! et MacroFactor sont reconnus automatiquement, et tout autre CSV fonctionne en associant toi-même les colonnes. Ton navigateur lit le fichier, donc l'IA ne retape jamais tes lignes. Dans les clients sans panneaux intégrés au chat, tu peux coller ton export à la place. Et réimporter le même fichier ne crée pas de doublons, tant que ton fuseau horaire n'a pas changé entre-temps.",
        },
        {
            question: "Mes données sont-elles privées ?",
            visibleHtml:
                "Tes journaux sont stockés dans l'UE et liés à ton propre compte, auquel tu accèdes via les applications d'IA que tu connectes. Nutrition MCP ne vend jamais tes données, ne les partage jamais avec des tiers et ne les utilise jamais à des fins publicitaires ; la page d'accueil n'affiche que des totaux anonymes à l'échelle du site. Ce que ton IA lit au moyen des outils est transmis au fournisseur de cette IA, dans le cadre de ton propre accord avec lui. Tu peux exporter tout ce que nous stockons à ton sujet, ou supprimer ton compte et toutes ses données, à tout moment : la <a href=\"/privacy\" data-link=\"privacy\">politique de confidentialité</a> donne tous les détails.",
        },
    ],
};

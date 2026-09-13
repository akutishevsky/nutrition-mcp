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
        photoMealAlt:
            "Photo : un bol de bortsch avec une cuillerée de crème aigre et de l'aneth, et une tranche de pain de seigle à côté",
        photoPackageAlt:
            "Photo : le code-barres d'une canette de Coca-Cola, numéro 5449000000996",
        slides: [
            {
                id: "log-meal",
                title: "Enregistrer en une phrase",
                description:
                    "Dis ce que tu as mangé et bu comme tu le raconterais à un ami. Calories, macros, fibres et caféine sont calculées, et les heures sont déduites pour toi.",
                messages: [
                    {
                        from: "user",
                        text: "Un bol de porridge aux fruits rouges et une tasse de café au petit-déjeuner",
                    },
                    {
                        from: "ai",
                        text: "Petit-déjeuner enregistré : environ 320 kcal, 11 g de protéines, 6 g de fibres. Le café ajoute 95 mg de caféine.",
                    },
                    {
                        from: "user",
                        text: "Et 500 ml d'eau vers 7 h ce matin, après mon footing",
                    },
                    {
                        from: "ai",
                        text: "500 ml d'eau ajoutés à 07:00 ce matin.",
                    },
                ],
            },
            {
                id: "photo-meal",
                title: "Photographier son assiette",
                description:
                    "Envoie une photo : il détermine d'où vient le repas, consulte tes anciens enregistrements, puis pose une courte question à la fois. Il n'enregistre jamais à partir de la seule image.",
                messages: [
                    { from: "user", photo: "meal", text: "Déjeuner" },
                    {
                        from: "ai",
                        text: "Du bortsch avec de la crème aigre et une tranche de pain de seigle. C'est fait maison, non ?",
                    },
                    { from: "user", text: "Oui, la recette de ma mère" },
                    {
                        from: "ai",
                        text: "Tu as déjà enregistré du bortsch de deux façons : au bœuf (~320 kcal le bol) et sans viande (~180). C'est lequel ?",
                    },
                    {
                        from: "user",
                        text: "Au bœuf. J'ai ajouté deux cuillères à soupe de crème aigre",
                    },
                    {
                        from: "ai",
                        text: "Compris. Donc tu as fini un bol entier de bortsch au bœuf avec 2 c. à soupe de crème aigre, et la tranche de pain de seigle : environ 470 kcal, 24 g de protéines. Je l'enregistre en déjeuner ?",
                    },
                    { from: "user", text: "Oui" },
                    {
                        from: "ai",
                        text: "Déjeuner enregistré : 470 kcal · 24 g de protéines · 43 g de glucides · 22 g de lipides · 7 g de fibres · 10 g de sucres.",
                    },
                ],
            },
            {
                id: "scan-barcode",
                title: "Scanner un code-barres",
                description:
                    "Photographie l'emballage. Le produit vient d'Open Food Facts, ajusté à ce que tu as vraiment pris, et les trous dans ses données sont comblés.",
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "Pris avec mon déjeuner",
                    },
                    {
                        from: "ai",
                        text: "C'est un Coca-Cola de 330 ml : 139 kcal et 35 g de sucre, d'après Open Food Facts. Tu as bu toute la canette ?",
                    },
                    { from: "user", text: "Oui, en entier" },
                    {
                        from: "ai",
                        text: "Enregistré avec le déjeuner : 139 kcal, 35 g de sucre, 0 g de fibres. Open Food Facts n'indique pas de caféine, alors j'ai repris le chiffre de Coca-Cola : environ 32 mg par canette.",
                    },
                ],
            },
            {
                id: "goals-progress",
                title: "Fixer ses objectifs, faire le point",
                description:
                    "Fixe tes cibles et tes limites quotidiennes en une phrase, puis demande où en est ta journée et ce qu'il te reste.",
                messages: [
                    {
                        from: "user",
                        text: "Fixe mes objectifs : 2 000 kcal, 160 g de protéines et une limite de caféine. Laquelle serait raisonnable ?",
                    },
                    {
                        from: "ai",
                        text: "Une référence courante est le plafond de l'EFSA et de la FDA pour les adultes en bonne santé : 400 mg par jour, soit environ quatre tasses de café filtre. On part là-dessus ?",
                    },
                    { from: "user", text: "Oui, 400" },
                    {
                        from: "ai",
                        text: "Objectifs mis à jour : 2 000 kcal et 160 g de protéines à atteindre, caféine sous 400 mg.",
                    },
                    {
                        from: "user",
                        text: "Je peux encore caser un dessert ce soir ?",
                    },
                    {
                        from: "ai",
                        text: "Tu en es à 1 540 kcal et 104 g de protéines aujourd'hui : il te reste 460 kcal et 56 g de protéines avant tes objectifs. Donc oui, un dessert d'environ 200 kcal passe, à condition que le reste soit surtout protéiné.",
                    },
                ],
            },
            {
                id: "review-week",
                title: "Faire le bilan de la semaine",
                description:
                    "Demande comment s'est passée ta semaine et le widget Tendances s'ouvre directement dans le chat. Passe de 7 à 14 ou 30 jours, ou touche un nutriment pour afficher sa courbe.",
                messages: [
                    {
                        from: "user",
                        text: "Ça a donné quoi, la semaine dernière ?",
                    },
                    {
                        from: "ai",
                        text: "Tu as tourné à 1 830 kcal par jour en moyenne sur les 14 derniers jours, dont 13 enregistrés — 170 sous ton objectif. Les protéines ont été ta macro la plus régulière.",
                    },
                ],
                widget: "trends",
            },
            {
                id: "weight-trend",
                title: "Suivre son poids",
                description:
                    "Enregistre une pesée en kg ou en lb et vois la vraie tendance : l'évolution sur le mois, une moyenne lissée et l'écart avec ton poids cible.",
                messages: [
                    {
                        from: "user",
                        text: "Je viens de me peser : 78,4 kg. Quelle est la tendance ?",
                    },
                    {
                        from: "ai",
                        text: "78,4 kg enregistrés. Tu as perdu 1,8 kg sur les 30 derniers jours, avec une moyenne sur 7 jours de 78,7 kg. Encore 3,4 kg avant ton objectif de 75 kg.",
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Repérer ses habitudes",
                description:
                    "Demande ce qui fait varier ce que tu manges. Il compare la semaine et le week-end, les jours avec et sans petit-déjeuner, les dîners tôt et les dîners tardifs.",
                messages: [
                    {
                        from: "user",
                        text: "Est-ce que je mange plus le week-end ?",
                    },
                    {
                        from: "ai",
                        text: "Pas vraiment. Sur les 30 derniers jours, tu es en moyenne à 1 986 kcal en semaine et à 1 977 le week-end.",
                    },
                    {
                        from: "user",
                        text: "Il y a quelque chose qui fait une différence ?",
                    },
                    {
                        from: "ai",
                        text: "L'heure du dîner, oui. Les jours où tu dînes à 20 h ou plus tard, tu es en moyenne à 2 150 kcal, contre 1 915 quand tu dînes plus tôt.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Suivre aussi les boissons",
                description:
                    "Le suivi de l'alcool est facultatif. Choisis les verres standards américains ou les unités britanniques, et chaque boisson est enregistrée en grammes d'alcool selon son volume et son degré.",
                messages: [
                    {
                        from: "user",
                        text: "J'aimerais suivre aussi ce que je bois comme alcool",
                    },
                    {
                        from: "ai",
                        text: "Bien sûr. On compte en verres standards américains ou en unités britanniques ?",
                    },
                    { from: "user", text: "En unités britanniques" },
                    {
                        from: "ai",
                        text: "Le suivi de l'alcool est activé, en grammes avec les unités britanniques. Ça marche dès ton prochain message, pas besoin d'ouvrir un nouveau chat.",
                    },
                    {
                        from: "user",
                        text: "Une pinte de lager à 4 % au dîner",
                    },
                    {
                        from: "ai",
                        text: "Enregistré avec le dîner : une pinte de 568 ml à 4 %, c'est 18 g d'alcool, 2,3 unités britanniques, environ 180 kcal.",
                    },
                ],
            },
            {
                id: "import-history",
                title: "Importer son historique",
                description:
                    "Tu viens de MyFitnessPal, Cronometer, Lose It! ou MacroFactor ? Ton export est lu dans le navigateur, et rien n'est enregistré avant ta confirmation.",
                messages: [
                    {
                        from: "user",
                        text: "Tu peux récupérer mon historique MyFitnessPal ?",
                    },
                    {
                        from: "ai",
                        text: "Bien sûr. D'abord, ton fuseau horaire n'est pas défini, donc les heures importées seraient lues en UTC. Tu habites où ?",
                    },
                    { from: "user", text: "À Chicago" },
                    {
                        from: "ai",
                        text: "Fuseau horaire réglé sur America/Chicago. Choisis maintenant ton fichier d'export dans l'outil d'import. Il est lu dans ton navigateur, et rien n'est enregistré avant que tu confirmes l'aperçu.",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Emporter ses données",
                description:
                    "Une seule demande te donne un ZIP avec chaque repas, entrée d'eau, pesée, objectif et réglage, et le fichier des repas se réimporte tel quel.",
                messages: [
                    { from: "user", text: "Sauvegarde toutes mes données" },
                    {
                        from: "ai",
                        text: "C'est fait : un ZIP avec 1 204 repas, 318 entrées d'eau, 64 pesées, tes objectifs et les réglages de ton profil. Voici le lien de téléchargement. Il est valable 60 minutes.",
                    },
                    {
                        from: "user",
                        text: "Je pourrai tout restaurer à partir de là plus tard ?",
                    },
                    {
                        from: "ai",
                        text: "Tes repas, oui. meals.csv se réimporte directement, et chaque repas que tu as encore est reconnu par son id et ignoré, donc rien n'est compté deux fois. L'eau, le poids, les objectifs et les réglages sont en export seul, alors garde le ZIP.",
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

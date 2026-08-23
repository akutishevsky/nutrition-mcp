import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_FR: AltUiCopy = {
    breadcrumbHome: "Accueil",
    breadcrumbAlternatives: "Alternatives",
    ctaQuickInstall: "Installation rapide",
    ctaClosingTitle: "Suis ta nutrition dans l'IA que tu utilises déjà.",
    disclaimerAppHtml:
        "{app} est une marque déposée de son propriétaire respectif. Nutrition MCP est un projet indépendant et open source, non affilié à {app}, ni approuvé ni sponsorisé par cette entreprise. Les comparaisons reflètent les informations publiquement disponibles au moment de la rédaction et peuvent évoluer.",
    disclaimerHubHtml:
        "{apps}, ainsi que les autres noms de produits, sont des marques déposées de leurs propriétaires respectifs. Nutrition MCP est un projet indépendant et open source, non affilié à ces entreprises ni approuvé par elles. Les comparaisons reflètent les informations publiquement disponibles au moment de la rédaction et peuvent évoluer.",

    app: {
        heroEyebrow: "Alternative à {app}",
        heroTitleHtml: "Tu cherches un serveur <em>{app} MCP</em> ?",
        heroLead:
            "{app} n'en propose pas — impossible donc de l'utiliser dans Claude ou ChatGPT. Nutrition MCP fait le même travail par conversation, gratuitement et en open source.",
        ctaConnect: "Connecte-toi en moins d'une minute",
        ctaSeeComparison: "Voir la comparaison",

        answerEyebrow: "La réponse courte",
        answerTitle: "Non, {app} n'a pas de serveur MCP.",
        answerBodyHtml:
            "Le Model Context Protocol (MCP) est le standard ouvert qui permet à des assistants IA comme Claude et ChatGPT de se connecter à des outils externes. {app} ne publie pas de serveur MCP, donc il n'existe aucun moyen officiel d'y enregistrer tes repas depuis ton IA. Si tu as cherché &laquo;&nbsp;{app} MCP&nbsp;&raquo; ou &laquo;&nbsp;connecter {app} à Claude&nbsp;&raquo;, ce que tu cherches en réalité, c'est un tracker nutritionnel qui vit <em>dans</em> ton IA — c'est exactement ce qu'est Nutrition MCP.",

        insteadEyebrow: "Ce que tu obtiens à la place",
        insteadTitle: "Le même suivi, simplement en en parlant",
        features: [
            {
                title: "Des repas en langage courant",
                body: "Dis &laquo;&nbsp;porridge avec banane et beurre de cacahuète&nbsp;&raquo; — ton IA estime les calories et les macros, fibres, sucres totaux et caféine inclus, et enregistre le tout. Pas de recherche dans une base de données.",
            },
            {
                title: "Scanner de codes-barres — gratuit",
                body: "Envoie le code-barres d'un produit et récupère les macros de l'étiquette depuis Open Food Facts — fibres et sucres aussi, quand l'étiquette les indique. Pas d'abonnement Premium à débloquer.",
            },
            {
                title: "Poids &amp; objectifs",
                body: "Enregistre ton poids en kg ou en lb, définis des objectifs de calories, macros, fibres, sucre, caféine et eau — les fibres comme cible à atteindre, le sucre et la caféine comme limites à ne pas dépasser — et suis tes tendances vers un poids cible. Le suivi de l'alcool est là aussi, désactivé par défaut et à activer toi-même.",
            },
            {
                title: "Résumés &amp; tendances",
                body: "Demande des totaux quotidiens, des tendances hebdomadaires, tes séries et tes habitudes alimentaires récurrentes — directement dans le chat.",
            },
            {
                title: "Import &amp; maîtrise de tes données",
                body: "Importe ton historique de repas depuis l'export CSV d'une autre app — analysé dans ton navigateur, pas par l'IA. Ressors tout quand tu veux : un ZIP avec tes repas, ton eau, ton poids, tes objectifs et ton profil en fichiers CSV. Pour l'instant, seuls les repas peuvent être réimportés. Ou supprime ton compte, tout aussi facilement.",
            },
            {
                title: "Open source &amp; gratuit",
                body: "Sous licence MIT et auto-hébergeable — pas de publicité, pas de mur payant, pas de vente incitative. Audite le code ou fais tourner ta propre instance.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        compareTitle: "La comparaison",
        pros: [
            "Conçu comme un serveur MCP — vit dans Claude &amp; ChatGPT",
            "Décris tes repas en langage courant ; calories, macros, fibres, sucre &amp; caféine estimés pour toi",
            "Scanner de codes-barres, tendances, import &amp; export CSV — tout gratuit",
            "Pas d'app séparée, pas de publicité, open source",
        ],

        movingEyebrow: "En venant de {app}",

        importEyebrow: "Ton historique {app}",
        importSub:
            "Demande à importer et un importateur s'ouvre directement dans le chat : choisis ton export, associe les colonnes, prévisualise ce qui sera ajouté, puis confirme. Le fichier est lu dans ton navigateur — l'IA ne voit jamais les lignes. Dans les clients sans panneaux intégrés au chat, colle plutôt ton export.",

        switchEyebrow: "Comment changer",
        switchSub:
            "Fonctionne avec tout client MCP compatible OAuth 2.0 avec PKCE. Lors de la première connexion, tu crées un compte avec Google ou un e-mail et un mot de passe.",
        installSteps: [
            "Ouvre <strong>Claude</strong> (web ou bureau) et clique sur <strong>Personnaliser</strong> → <strong>Connecteurs</strong>.",
            "Clique sur <strong>+</strong>, puis <strong>Ajouter un connecteur personnalisé</strong>, et donne-lui un nom comme <strong>Nutrition</strong>.",
            "Colle {copyUrl} dans le champ <strong>URL du serveur MCP distant</strong> et clique sur <strong>Ajouter</strong>.",
            "Clique sur <strong>Connecter</strong>, connecte-toi, et commence à enregistrer en disant ce que tu as mangé.",
        ],
        installNoteTemplate:
            "Tu utilises ChatGPT ou un autre client ? Le {link} couvre ChatGPT, Cursor, VS Code, Claude Code, et plus encore.",
        installLinkText: "guide d'installation complet",
        copyUrlAriaLabel: "Copier l'URL du serveur",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Questions sur {app} &amp; MCP",
        faq: {
            mcpQ: "Est-ce que {app} a un serveur MCP ?",
            mcpA: "Non. {app} ne propose pas de serveur Model Context Protocol (MCP), donc il n'existe aucun moyen officiel de le connecter à Claude, ChatGPT ou d'autres assistants IA. Nutrition MCP est une alternative gratuite et open source, conçue comme serveur MCP depuis le départ, pour que tu puisses enregistrer repas et macros directement dans ton IA.",
            connectQ: "Comment connecter {app} à Claude ?",
            connectA:
                "Il n'existe aucun connecteur officiel {app} pour Claude, car {app} n'a ni serveur MCP ni intégration MCP publique. L'option la plus proche est Nutrition MCP, un serveur MCP gratuit : ajoute https://nutrition-mcp.com/mcp comme connecteur personnalisé dans Claude, connecte-toi, et commence à enregistrer par conversation.",
            goodAltQ:
                "Est-ce que Nutrition MCP est une bonne alternative à {app} ?",
            goodAltA:
                "Si tu veux suivre calories, macros — fibres, sucres totaux et caféine inclus —, eau et poids sans ouvrir une app séparée ni chercher dans une base de données alimentaire, oui. Plutôt que de naviguer dans une base de données, tu décris ce que tu as mangé en langage courant, envoies une photo, ou scannes un code-barres, et ton IA l'enregistre — entièrement gratuit et open source.",
            importQ: "Puis-je importer mes données {app} ?",
            readExportQ:
                "Est-ce que l'IA lit mon fichier d'export lors de l'import ?",
            readExportA:
                "Pas quand l'importateur s'ouvre. Il analyse le CSV dans ton navigateur et te montre ce qui sera ajouté avant que rien ne soit écrit : le nombre de repas, le total de calories, tout ce qu'il a dû signaler, et les lignes elles-mêmes — un fichier long en liste les premières plus un décompte du reste plutôt que chaque ligne. Seules les lignes que tu confirmes sont envoyées, et elles passent comme données structurées plutôt que par la réponse de l'IA, donc aucune ligne ne peut être mal retranscrite ou inventée en chemin. Chaque ligne porte aussi une empreinte de contenu, donc relancer le même fichier signale ces repas comme déjà enregistrés au lieu de les dupliquer. Si ton client ne peut pas afficher de panneaux intégrés au chat, la solution de repli consiste à coller l'export — l'IA le lit bien dans ce cas, donc privilégie l'importateur quand tu as le choix.",
            freeQ: "Est-ce que Nutrition MCP est gratuit ?",
            freeAFallback:
                "Oui. Nutrition MCP est entièrement gratuit, sans forfait premium, publicité ni fonctionnalité payante — contrairement aux apps qui verrouillent certaines fonctionnalités derrière un abonnement. Il te faut seulement un compte Claude ou ChatGPT pour te connecter.",
        },
        importFallbackNote:
            " Dans les clients sans panneaux intégrés au chat, tu peux coller ton export à la place.",

        ctaClosingSub:
            "Gratuit et open source — pas de compte {app}, pas d'app à ouvrir.",
        ctaOtherAlternatives: "Autres alternatives",
    },

    hub: {
        heroEyebrow: "Alternatives MCP",
        heroTitleHtml: "Ton app de nutrition n'a pas de <em>serveur MCP</em>.",
        heroLead:
            "Des apps comme MyFitnessPal, Cronometer et Lose It ne peuvent pas se connecter à Claude ou ChatGPT. Nutrition MCP est la façon gratuite et open source de suivre repas, macros et poids en parlant à ton IA.",
        ctaSeeExamples: "Voir des exemples",

        appsEyebrow: "En venant de…",
        appsTitle: "Choisis ton app actuelle",
        appsSub:
            "Découvre comment Nutrition MCP se compare au tracker que tu utilises aujourd'hui — et comment transférer ton enregistrement, ainsi que ton historique existant, dans ton IA.",
        noAppNote:
            "Tu ne trouves pas ton app ? Elle n'a presque certainement pas de serveur MCP non plus — Nutrition MCP fonctionne de la même façon, quelle que soit l'app que tu quittes.",
        requestComparisonLinkText: "Demander une comparaison",

        importEyebrow: "Apporter ton historique",
        importTitle: "Tu n'as pas besoin de repartir de zéro",
        importSub:
            "La raison habituelle qui pousse à rester, ce sont les années déjà enregistrées. Demande à importer et un importateur s'ouvre directement dans le chat : choisis ton export, associe les colonnes, prévisualise ce qui sera ajouté, puis confirme — ou colle l'export si ton client n'a pas de panneaux intégrés au chat.",
        importBody: [
            "Le fichier est analysé dans ton navigateur, pas lu par l'IA — donc les lignes ne peuvent pas être mal retranscrites en chemin, et tu vois les repas exacts avant que quoi que ce soit ne soit écrit. Les exports de MyFitnessPal, Cronometer, Lose It! et MacroFactor ont leurs colonnes reconnues par leur nom ; n'importe quel autre CSV fonctionne aussi, tu indiques juste chaque colonne au mappeur une fois. Ce qui passe, ce sont la date et l'heure, l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux et la caféine en milligrammes — ainsi que l'alcool, si tu as d'abord activé son suivi.",
            "Les particularités des vrais fichiers d'export sont gérées : dates JJ/MM/AAAA et MM/JJ/AAAA, énergie en kilojoules comme en kilocalories, fichiers européens délimités par des points-virgules dont les nombres utilisent la virgule décimale, champs entre guillemets avec des retours à la ligne à l'intérieur, lignes de totaux en fin de bloc, et indicateurs de lignes supprimées. Les en-têtes de colonnes n'ont pas non plus à être en anglais — le Kalorien ou Ballaststoffe d'un export allemand est reconnu, et fibres, sucre et caféine sont aussi reconnus en espagnol, français, italien et néerlandais. Là où un fichier est vraiment ambigu — 05/06 pouvant être mai ou juin — l'importateur montre sa lecture à côté d'une ligne de ton propre fichier et te demande de confirmer plutôt que de deviner. Et chaque ligne porte une empreinte de contenu, donc réimporter le même fichier signale les repas comme déjà enregistrés plutôt que de les dupliquer.",
        ],

        ctaSub: "Gratuit et open source — ça fonctionne avec Claude, ChatGPT et tout client MCP.",
        ctaStarGithub: "Star sur GitHub",
    },
};

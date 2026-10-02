import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_FR: AltUiCopy = {
    breadcrumbHome: "Accueil",
    breadcrumbAlternatives: "Alternatives",
    breadcrumbAriaLabel: "Fil d'Ariane",
    ctaQuickInstall: "Installation rapide",
    ctaClosingTitle: "Suis ton alimentation dans l'IA que tu utilises déjà.",
    disclaimerAppHtml:
        "{app} est une marque déposée appartenant à son titulaire. Nutrition MCP est un projet indépendant et open source, sans lien avec {app}, qui ne l'approuve ni ne le sponsorise. Les comparaisons reflètent les informations publiques disponibles au moment de la rédaction et peuvent évoluer.",
    disclaimerHubHtml:
        "{apps} et les autres noms de produits sont des marques déposées appartenant à leurs titulaires respectifs. Nutrition MCP est un projet indépendant et open source, sans lien avec ces entreprises, qui ne l'approuvent pas. Les comparaisons reflètent les informations publiques disponibles au moment de la rédaction et peuvent évoluer.",

    app: {
        heroEyebrow: "Alternative à {app}",
        heroTitleHtml: "Tu cherches un serveur <em>{app} MCP</em> ?",
        heroLead:
            "{app} n'en publie aucun que tu puisses connecter : impossible, donc, de remplir ton journal {app} depuis Claude ou ChatGPT. Nutrition MCP fait la même chose en conversation, et il est gratuit et open source.",
        ctaConnect: "Connecte-le en moins d'une minute",
        ctaSeeComparison: "Voir le comparatif",

        answerEyebrow: "En bref",
        answerTitle: "Non : {app} n'a pas de serveur MCP officiel et public.",
        answerBodyHtml:
            "Le Model Context Protocol (MCP) est le standard ouvert qui permet aux assistants IA comme Claude et ChatGPT de se connecter à des outils externes. {app} ne publie pas de serveur MCP public : il n'existe donc aucun moyen officiel d'enregistrer ce que tu manges dans ton journal {app} depuis ton IA. Si tu as cherché &laquo;&nbsp;{app} MCP&nbsp;&raquo; ou &laquo;&nbsp;connecter {app} à Claude&nbsp;&raquo;, ce que tu veux vraiment, c'est un outil de suivi nutritionnel qui fonctionne <em>dans</em> ton IA. C'est exactement ce qu'est Nutrition MCP.",

        insteadEyebrow: "Ce que tu as à la place",
        insteadTitle: "Le même suivi, simplement en parlant",
        features: [
            {
                title: "Tes repas en langage courant",
                body: "Dis &laquo;&nbsp;porridge avec banane et beurre de cacahuète&nbsp;&raquo; : ton IA estime les calories et les macros, fibres, sucres totaux et caféine compris, puis enregistre le tout. Aucune recherche dans une base de données.",
            },
            {
                title: "Scanner de codes-barres gratuit",
                body: "Envoie le code-barres d'un produit et récupère les macros de l'étiquette via Open Food Facts, y compris les fibres et les sucres quand l'étiquette les indique. Gratuit pour tout le monde, sans abonnement.",
            },
            {
                title: "Poids et objectifs",
                body: "Enregistre ton poids en kg ou en lb, fixe tes objectifs de calories, de macros, de fibres, de sucres, de caféine et d'eau (les fibres comme cible à atteindre, les sucres et la caféine comme limites à ne pas dépasser) et suis ton évolution vers un poids cible. Le suivi de l'alcool est là aussi, en option et désactivé tant que tu ne l'actives pas.",
            },
            {
                title: "Résumés et tendances",
                body: "Demande tes totaux du jour, tes tendances de la semaine, tes séries et tes habitudes de repas récurrentes, directement dans le chat.",
            },
            {
                title: "Importe tes données, elles restent à toi",
                body: "Importe ton historique de repas depuis l'export CSV d'une autre app : il est analysé dans ton navigateur, pas par l'IA. Récupère tout quand tu veux : un ZIP avec tes repas, ton hydratation, ton poids, tes objectifs et ton profil, plus les données de ton compte, ta télémétrie d'utilisation et tes applications connectées, en fichiers CSV. Pour l'instant, seuls les repas peuvent être réimportés. Et tu peux supprimer ton compte tout aussi facilement.",
            },
            {
                title: "Open source et gratuit",
                body: "Sous licence MIT et auto-hébergeable : pas de publicité, pas de mur payant, pas de vente incitative. Inspecte le code ou fais tourner ta propre instance.",
            },
        ],

        compareEyebrow: "{app} vs Nutrition MCP",
        otherComparisonsLabel: "Autres comparatifs :",
        compareTitle: "Le comparatif",
        pros: [
            "Conçu comme un serveur MCP : fonctionne dans Claude et ChatGPT",
            "Décris tes repas en langage courant : calories, macros, fibres, sucres et caféine sont estimés pour toi",
            "Scanner de codes-barres, tendances, import et export CSV : tout est gratuit",
            "Pas d'app à part, pas de publicité, open source",
        ],

        movingEyebrow: "Quitter {app}",

        importEyebrow: "Ton historique {app}",
        importSub:
            "Demande à importer tes données et un outil d'import s'ouvre directement dans le chat : choisis ton export, associe les colonnes, vérifie l'aperçu de ce qui sera ajouté, puis confirme. Le fichier est lu dans ton navigateur ; l'IA ne voit jamais les lignes. Dans les clients sans panneaux intégrés au chat, colle plutôt ton export.",

        switchEyebrow: "Passer à Nutrition MCP",
        switchSub:
            "Compatible avec tout client MCP qui prend en charge OAuth 2.0 avec PKCE. À la première connexion, tu crées un compte avec Google ou avec une adresse e-mail et un mot de passe.",
        installSteps: [
            'Ouvre <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP dans l\'annuaire Claude</a>.',
            "Clique sur <strong>Connecter</strong>, puis connecte-toi avec Google ou avec une adresse e-mail et un mot de passe.",
            "Commence à enregistrer tes repas en disant simplement ce que tu as mangé.",
        ],
        installNoteTemplate:
            "Tu utilises plutôt ChatGPT ou un autre client ? Le {link} couvre ChatGPT, Cursor, VS Code, Claude Code et bien d'autres.",
        installLinkText: "guide d'installation complet",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Questions sur {app} et MCP",
        faq: {
            mcpQ: "Est-ce que {app} a un serveur MCP ?",
            mcpA: "Aucun serveur officiel. {app} ne publie pas de serveur Model Context Protocol (MCP) public : il n'existe donc aucun moyen officiel de remplir ton journal {app} depuis Claude, ChatGPT ou d'autres clients MCP. Il existe quelques serveurs non officiels, développés par la communauté, mais ils ne sont ni créés ni pris en charge par {app}. Nutrition MCP est différent : un outil de suivi gratuit et open source, conçu dès le départ comme serveur MCP, avec son propre compte, et capable d'importer ton export CSV {app}.",
            connectQ: "Comment connecter {app} à Claude ?",
            connectA:
                "Il n'existe pas de connecteur {app} officiel pour Claude, puisque {app} ne publie aucun serveur MCP public. Une solution : Nutrition MCP, un serveur MCP gratuit référencé dans l'annuaire Claude. Ouvre-le sur https://claude.ai/directory/nutrition-mcp, clique sur Connecter, connecte-toi, puis commence à enregistrer tes repas en discutant.",
            goodAltQ: "Nutrition MCP est-il une bonne alternative à {app} ?",
            goodAltA:
                "Oui, si tu veux suivre tes calories, tes macros (fibres, sucres totaux et caféine compris), ton hydratation et ton poids sans ouvrir une app à part ni chercher dans une base de données alimentaire. Au lieu de faire défiler une base de données, tu décris ce que tu as mangé en langage courant, tu envoies une photo ou tu scannes un code-barres, et ton IA l'enregistre. Le tout entièrement gratuit et open source.",
            importQ: "Puis-je importer mes données {app} ?",
            readExportQ: "L'IA lit-elle mon fichier d'export quand j'importe ?",
            readExportA:
                "Pas quand l'outil d'import s'ouvre. Il analyse le CSV dans ton navigateur et te montre ce qui sera ajouté avant toute écriture : le nombre de repas, le total des calories, tout ce qu'il a dû signaler, et les lignes elles-mêmes (pour un long fichier, les premières lignes et le nombre de lignes restantes, plutôt que la totalité). Seules les lignes que tu confirmes sont envoyées, sous forme de données structurées et non via la réponse de l'IA : aucune ligne ne peut donc être mal recopiée ou inventée en route. Chaque ligne porte aussi une empreinte de contenu, si bien que relancer le même fichier signale ces repas comme déjà enregistrés au lieu de les dupliquer, tant que ton fuseau horaire n'a pas changé entre-temps. Si ton client ne peut pas afficher de panneaux dans le chat, la solution de repli consiste à coller l'export ; dans ce cas, l'IA le lit bel et bien. Quand tu as le choix, préfère donc l'outil d'import.",
            freeQ: "Nutrition MCP est-il gratuit ?",
            freeAFallback:
                "Oui. Nutrition MCP est entièrement gratuit : pas d'offre premium, pas de publicité, pas de fonctionnalités payantes, contrairement aux apps qui réservent certaines fonctionnalités à un abonnement. Il te faut une app d'IA compatible MCP, comme Claude ou ChatGPT, et un compte Nutrition MCP gratuit, que tu crées avec Google ou une adresse e-mail et un mot de passe lors de ta première connexion.",
        },
        importFallbackNote:
            " Dans les clients sans panneaux intégrés au chat, tu peux coller ton export à la place.",

        ctaClosingSub:
            "Gratuit et open source. Pas de compte {app}, pas d'app à ouvrir.",
        ctaOtherAlternatives: "Autres alternatives",
    },

    hub: {
        heroEyebrow: "Alternatives MCP",
        heroTitleHtml:
            "Ton app de nutrition n'a pas de <em>serveur MCP</em> officiel.",
        heroLead:
            "Des apps comme MyFitnessPal, Cronometer et Lose It! n'offrent aucun moyen officiel de remplir ton journal depuis Claude ou ChatGPT. Nutrition MCP, gratuit et open source, te permet de suivre tes repas, tes macros et ton poids en parlant à ton IA, et il importe ton historique.",
        ctaSeeExamples: "Voir des exemples",

        appsEyebrow: "Tu viens de…",
        appsTitle: "Choisis ton app actuelle",
        appsSub:
            "Découvre comment Nutrition MCP se compare à l'app de suivi que tu utilises aujourd'hui, et comment transférer ton suivi, historique compris, dans ton IA.",
        noAppNote:
            "Ton app n'est pas dans la liste ? La plupart des apps de nutrition ne publient pas non plus de serveur MCP officiel, et Nutrition MCP fonctionne de la même façon, quelle que soit l'app que tu quittes.",
        requestComparisonLinkText: "Demander un comparatif",

        importEyebrow: "Garder ton historique",
        importTitle: "Pas besoin de repartir de zéro",
        importSub:
            "Ce qui retient le plus souvent les gens sur leur app, ce sont les années déjà enregistrées. Demande à importer tes données et un outil d'import s'ouvre directement dans le chat : choisis ton export, associe les colonnes, vérifie l'aperçu de ce qui sera ajouté, puis confirme. Si ton client n'a pas de panneaux intégrés au chat, colle simplement l'export.",
        importBody: [
            "Le fichier est analysé dans ton navigateur, pas lu par l'IA : les lignes ne peuvent donc pas être mal recopiées en route, et tu vois exactement quels repas seront ajoutés avant toute écriture. Les colonnes des exports MyFitnessPal, Cronometer, Lose It! et MacroFactor sont reconnues par leur nom ; n'importe quel autre CSV fonctionne aussi, il suffit d'associer chaque colonne une fois. Sont importés : la date et l'heure, l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux et la caféine en milligrammes, ainsi que l'alcool, si tu as d'abord activé son suivi.",
            "Les bizarreries des vrais fichiers d'export sont prises en charge : dates JJ/MM/AAAA et MM/JJ/AAAA, énergie en kilojoules comme en kilocalories, fichiers européens séparés par des points-virgules avec virgule décimale, champs entre guillemets contenant des retours à la ligne, lignes de totaux en fin de bloc et indicateurs de lignes supprimées. Les en-têtes de colonnes n'ont pas besoin d'être en anglais non plus : Kalorien ou Ballaststoffe dans un export allemand sont reconnus, et les fibres, les sucres et la caféine le sont aussi en espagnol, en français, en italien et en néerlandais. Quand un fichier est vraiment ambigu (05/06 peut aussi bien désigner mai que juin), l'outil d'import montre son interprétation à côté d'une ligne de ton propre fichier et te demande de confirmer au lieu de deviner. Enfin, chaque ligne porte une empreinte de contenu : réimporter le même fichier signale les repas comme déjà enregistrés au lieu de les dupliquer, tant que ton fuseau horaire n'a pas changé entre-temps.",
        ],

        ctaSub: "Gratuit et open source, compatible avec Claude, ChatGPT et tout client MCP.",
        ctaStarGithub: "Mettre une étoile sur GitHub",
    },
};

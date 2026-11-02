import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_FR: AppleHealthDoc = {
    meta: {
        title: "Raccourcis Apple Health",
        description:
            "Deux raccourcis iPhone gratuits relient Nutrition MCP et Apple Health : Nutrition MCP Health copie dans Apple Health les totaux journaliers que tu enregistres avec ton IA (calories, protéines, glucides, lipides, fibres, caféine et, si tu veux, eau), et Nutrition MCP Activity renvoie ton énergie active quotidienne sous forme de calories actives.",
        ogDescription:
            "Totaux journaliers vers Apple Health, énergie active vers Nutrition MCP : deux raccourcis iPhone gratuits, à utiliser l'un ou les deux.",
    },
    tocLabel: "Sur cette page",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP et Apple Health, dans les deux sens",
        lead: "Deux raccourcis iPhone gratuits, un par sens. L'un copie ce que tu manges dans Apple Health, l'autre ramène vers Nutrition MCP l'énergie que tu dépenses. Utilise-les au choix, ou les deux : ils se connectent, se synchronisent et se déconnectent chacun de leur côté.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Tes totaux journaliers, dans Apple Health",
            items: [
                "Une entrée par nutriment pour chaque journée terminée, à <strong>12:00</strong>, provenant de <strong>Raccourcis</strong>.",
                "Une journée est terminée à <strong>05:00</strong> le lendemain matin dans ton fuseau horaire : hier arrive donc après 05:00 aujourd'hui. Aujourd'hui n'y figure jamais.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Ton énergie active, en calories actives",
            items: [
                "Ton total d'<strong>Énergie active</strong> pour aujourd'hui et les 2 jours précédents, affiché à côté de ce que tu as mangé. Ton objectif calorique ne change jamais.",
                "Une entrée par jour, remplacée à chaque synchronisation : synchroniser souvent ne compte donc jamais une journée deux fois.",
            ],
        },
        nutrientsLabel: "Envoyé chaque jour",
        nutrients: {
            energy_kcal: "Énergie alimentaire",
            protein_g: "Protéines",
            carbohydrates_g: "Glucides",
            fat_g: "Lipides totaux",
            fiber_g: "Fibres alimentaires",
            caffeine_mg: "Caféine",
            water_ml: "Eau",
        },
        waterNote: "si tu le choisis",
        alcoholNote: "L'alcool n'est jamais envoyé.",
        readLabel: "Lu à chaque synchronisation",
        activeEnergy: "Énergie active",
    },
    before: {
        title: "Avant de commencer",
        items: [
            "Un iPhone avec les apps <strong>Raccourcis</strong> et <strong>Santé</strong>. Les deux sont fournies avec iOS.",
            "Un compte Nutrition MCP déjà connecté à ton app d'IA, comme Claude ou ChatGPT. Les deux raccourcis se connectent avec ce même compte.",
            "Recommandé : ton fuseau horaire dans ton profil, puisque c'est lui qui décide où se termine une journée. Dis simplement <em>&laquo;&nbsp;règle mon fuseau horaire&nbsp;&raquo;</em> dans le chat. Si tu n'en as jamais défini, c'est le fuseau horaire indiqué par ton iPhone au moment de la connexion qui est utilisé.",
        ],
    },
    install: {
        title: "Installer les raccourcis",
        lead: "Installe-en un ou les deux. Ouvre un lien sur ton iPhone et touche <strong>Ajouter le raccourci</strong> ; il apparaît dans l'app Raccourcis sous son propre nom.",
        button: "Obtenir le raccourci",
        pending: "Le lien du raccourci sera bientôt publié ici.",
        leadPending:
            "Les raccourcis ne sont pas encore publiés. Une fois disponibles, tu ouvriras leur lien sur ton iPhone et toucheras <strong>Ajouter le raccourci</strong> ; chacun apparaîtra dans l'app Raccourcis sous son propre nom. Les étapes ci-dessous décrivent la suite.",
        healthBlurb: "Envoie tes totaux journaliers à Apple Health.",
        activityBlurb: "Lit ton énergie active dans Apple Health.",
        nameNote:
            "Garde exactement les noms <strong>Nutrition MCP Health</strong> et <strong>Nutrition MCP Activity</strong>. La page de connexion rouvre chaque raccourci par son nom : si l'un est renommé, la connexion s'arrête à mi-chemin.",
    },
    connect: {
        title: "Les connecter",
        steps: [
            "Dans l'app Raccourcis, touche le raccourci pour l'exécuter.",
            "Réponds à ses questions (ci-dessous), puis Safari ouvre une page de connexion. Connecte-toi avec le <strong>même compte que celui de ton app d'IA</strong>. La page affiche un avis sur la connexion d'Apple Health : ne continue que si tu viens de lancer cela toi-même, depuis le raccourci de ton propre iPhone.",
            "Quand Safari te demande s'il faut ouvrir Raccourcis, touche <strong>Ouvrir</strong>. Le raccourci termine la connexion.",
        ],
        health: {
            label: "Nutrition MCP Health demande",
            items: [
                "Faut-il aussi envoyer l'<strong>eau</strong> (laisse-la de côté si ton Apple Watch ou une autre app enregistre déjà ton eau), et quels jours envoyer, <strong>From today</strong> (à partir d'aujourd'hui) ou <strong>Also the last 7 days</strong> (aussi les 7 derniers jours).",
                "La première fois qu'une journée est envoyée, Apple Health te demande ce que Raccourcis peut écrire : active <strong>chaque type</strong> et touche <strong>Autoriser</strong>. Si tu as choisi <strong>Also the last 7 days</strong> et enregistré des repas pendant ces jours, cela se produit tout de suite. Sinon, il n'y a encore rien à envoyer : demain après 05:00, ouvre le raccourci et touche <strong>Sync now</strong> une fois pour y répondre.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity demande",
            items: [
                "Rien avant la connexion, à part un court avis sur ce qu'il lit. Sa première synchronisation démarre juste après la connexion.",
                "Apple Health demande si Raccourcis peut lire l'<strong>Énergie active</strong> : touche <strong>Autoriser</strong>. Ensuite, iOS demande si le raccourci peut envoyer des échantillons de santé à nutrition-mcp.com : choisis <strong>Toujours autoriser</strong>, sinon chaque exécution automatique s'arrête à cette question.",
            ],
        },
        note: "Chaque lien de connexion ne fonctionne qu'une fois, pendant 30 minutes. S'il expire, exécute à nouveau le raccourci. Connecte les deux raccourcis l'un après l'autre, pas en même temps. Avec Nutrition MCP Health, ta première journée terminée arrive après 05:00 demain ; si tu as choisi les 7 derniers jours, elles sont envoyées tout de suite.",
    },
    automate: {
        title: "Les rendre automatiques",
        lead: "Un raccourci partagé ne peut pas emporter ses automatisations : crée-les donc une fois dans l'onglet <strong>Automatisation</strong> de l'app Raccourcis, pour chaque raccourci que tu utilises. Le premier déclencheur de chacun est celui qui compte ; les autres rattrapent le retard.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "App → Santé → Est ouverte",
                tag: "Principale",
                body: "Ouvrir Santé, c'est justement le moment où tu veux que tout soit à jour.",
            },
            {
                when: "Alarme → Est arrêtée",
                tag: "Rattrapage du matin",
                body: "Une alarme arrêtée après 05:00, comme ton réveil, envoie la journée d'hier dès qu'elle est terminée.",
            },
            {
                when: "Chargeur → Est connecté",
                tag: "Facultative",
                body: "Brancher ton iPhone la nuit ou au bureau, c'est une occasion de plus de synchroniser.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude ou ChatGPT → Est ouverte",
                tag: "Principale",
                body: "Ouvrir ton app d'IA, c'est justement le moment où tu t'apprêtes à demander comment se passe ta journée : la dépense du jour est donc à jour avant ta question.",
            },
            {
                when: "App → Santé ou Fitness → Est ouverte",
                tag: "Aussi",
                body: "Consulter tes anneaux ou tes entraînements, c'est une occasion de plus de synchroniser.",
            },
            {
                when: "Heure de la journée",
                tag: "Tout au long de la journée",
                body: "Il n'existe pas de déclencheur &laquo;&nbsp;toutes les heures&nbsp;&raquo;, donc ajoute-en quelques-uns, par exemple à 12:00, 18:00 et 22:00, pour rattraper les jours où tu n'ouvres aucune des deux apps.",
            },
        ],
        stepsLabel: "Pour chacun",
        steps: [
            "Dans l'app Raccourcis, ouvre l'onglet <strong>Automatisation</strong> et touche <strong>+</strong> pour créer une automatisation personnelle.",
            "Choisis le déclencheur, par exemple <strong>App</strong> → <strong>Santé</strong> → <strong>Est ouverte</strong>.",
            "Choisis <strong>Exécuter immédiatement</strong> et désactive <strong>Avertir lors de l'exécution</strong> si ton iPhone le propose.",
            "Ajoute l'action <strong>Exécuter le raccourci</strong>, choisis <strong>Nutrition MCP Health</strong> ou <strong>Nutrition MCP Activity</strong>, et règle son entrée sur le texte <code>auto</code>.",
        ],
        note: "L'entrée <code>auto</code> rend les exécutions automatiques discrètes : elles ne t'avertissent que lorsque quelque chose demande ton attention. Aucune heure précise n'est nécessaire : Nutrition MCP Health remonte sur les 7 dernières journées terminées à chaque synchronisation, et Nutrition MCP Activity renvoie aujourd'hui et les 2 jours précédents, donc une exécution manquée se rattrape toute seule.",
    },
    everyday: {
        title: "Au quotidien",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "Tu as oublié d'enregistrer quelque chose ?",
                body: "Ajoute-le dans le chat comme d'habitude. Si sa journée a déjà été envoyée et fait partie des 7 derniers jours, la synchronisation suivante complète la journée par une petite entrée supplémentaire à 12:01, 12:02, etc. Les changements de moins de 20 kcal ou 2 g environ sont ignorés ; un très grand saut, ou un changement après 9 compléments, arrive sous forme de notification pour que tu le saisisses à la main.",
            },
            {
                title: "Tu as supprimé ou réduit un repas ?",
                body: "Apple Health peut ajouter à une valeur, mais pas la diminuer : tu reçois donc une notification indiquant de combien la journée est désormais trop élevée. Pour corriger, ouvre Santé → <strong>Parcourir</strong> → <strong>Nutrition</strong>, choisis le type, touche <strong>Afficher toutes les données</strong> et balaie vers la gauche les entrées de ce jour provenant de Raccourcis pour les supprimer, puis saisis à la main le bon total indiqué dans la notification. N'utilise jamais <strong>Supprimer toutes les données de « Raccourcis »</strong> : cela efface aussi ce que tes autres raccourcis ont enregistré.",
            },
            {
                title: "L'exécuter à la main",
                body: "Touche <strong>Nutrition MCP Health</strong> dans l'app Raccourcis pour ouvrir son menu : <strong>Sync now</strong> envoie tout ce qui attend, <strong>Status</strong> indique la dernière journée envoyée et quand la suivante sera prête, et <strong>Disconnect</strong> met fin à la connexion.",
            },
            {
                title: "Vérifier depuis ton app d'IA",
                body: "Demande à ton IA d'afficher ton profil (<code>get_profile</code>) : il indique quand chaque raccourci a été connecté, jusqu'à quelle journée Nutrition MCP Health a envoyé, et quand chacun s'est exécuté pour la dernière fois.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "De gros nombres de calories quand il demande l'envoi ?",
                body: "Ne t'en inquiète pas. La question qu'iOS affiche avant l'envoi liste les sommes brutes de Santé, avec toutes leurs décimales et dans le format de nombre de ta région : <strong>922,774 kcal</strong> peut donc simplement signifier un peu moins de 923 kcal. Le raccourci arrondit chaque journée à la kilocalorie entière avant d'envoyer quoi que ce soit, et les entrées à <strong>0 kcal</strong> qu'il liste aussi n'ajoutent rien.",
            },
            {
                title: "Tu as aussi enregistré un entraînement dans le chat ?",
                body: "Pour un jour que le raccourci a envoyé, le total d'Apple Health compte, et les entraînements que tu as enregistrés dans le chat restent dans ton journal sans être ajoutés en plus : l'Énergie active de ta montre les inclut déjà. Les autres jours, ils comptent comme d'habitude.",
            },
            {
                title: "Une journée qui affiche 0 ?",
                body: "Une journée sans Énergie active, ou que Santé n'a pas permis au raccourci de lire, n'envoie rien et ne change rien. Si toutes les journées restent à 0, autorise Raccourcis à lire l'Énergie active dans Santé → <strong>Partage</strong> → <strong>Apps</strong> → <strong>Raccourcis</strong>.",
            },
            {
                title: "L'exécuter à la main",
                body: "Touche <strong>Nutrition MCP Activity</strong> dans l'app Raccourcis pour ouvrir son menu : <strong>Sync now</strong> envoie aujourd'hui et les 2 jours précédents, <strong>Status</strong> indique la dernière journée envoyée, et <strong>Disconnect</strong> met fin à sa connexion sans toucher à Nutrition MCP Health.",
            },
        ],
    },
    privacy: {
        title: "Confidentialité et limites",
        items: [
            "Nutrition MCP Health : notre serveur conserve la connexion et, pendant 8 jours, un historique des totaux envoyés, afin que chaque journée soit envoyée une fois puis seulement complétée. Nous n'envoyons rien à Apple : le raccourci demande tes totaux à notre serveur et les écrit dans Santé sur ton iPhone, où tes propres réglages Apple s'appliquent.",
            "Nutrition MCP Activity ne lit que le total quotidien d'<strong>Énergie active</strong>, rien d'autre dans Santé. Notre serveur conserve ces totaux comme tes calories actives, dans ton export de données et supprimés avec ton compte, comme celles que tu enregistres dans le chat.",
            "Chaque raccourci conserve son propre jeton d'accès dans son propre stockage au sein de l'app Raccourcis sur ton iPhone, et non dans un fichier, et l'app Raccourcis peut le synchroniser avec tes autres appareils via iCloud. Toute personne pouvant exécuter un raccourci sur tes appareils peut utiliser sa synchronisation jusqu'à ce que tu le déconnectes : garde-les donc sur des appareils que toi seul utilises.",
            "Choisis <strong>Disconnect</strong> dans un raccourci à tout moment : sa connexion est supprimée immédiatement, ainsi que l'historique de Nutrition MCP Health. Chaque connexion prend aussi fin d'elle-même après 90 jours sans synchronisation, et 365 jours après la connexion. Ce qui est déjà dans Apple Health y reste jusqu'à ce que tu le supprimes, et les calories actives déjà envoyées restent jusqu'à ce que tu les supprimes.",
        ],
        policyLink: "Lire la politique de confidentialité",
    },
    troubleshooting: {
        title: "Dépannage",
        lead: "Quelque chose ne colle pas ? Ces réponses couvrent les cas habituels.",
        readMore: "Lire la réponse",
    },
    selfHost: {
        textHtml:
            "Tu héberges ton propre serveur ? Les raccourcis sont construits étape par étape dans {link} et {activityLink}.",
        linkText: "la fiche de construction de Nutrition MCP Health",
        activityLinkText: "la fiche de construction de Nutrition MCP Activity",
    },
};

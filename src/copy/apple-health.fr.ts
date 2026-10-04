import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_FR: AppleHealthDoc = {
    meta: {
        title: "Synchronisation avec Apple Health",
        description:
            "Installe le raccourci gratuit Nutrition MCP Health sur ton iPhone : il copie dans Apple Health les totaux journaliers que tu enregistres en discutant avec ton IA (calories, protéines, glucides, lipides, fibres, caféine et, si tu veux, eau).",
        ogDescription:
            "Copie dans Apple Health les totaux journaliers que tu enregistres avec ton IA, grâce à un raccourci iPhone gratuit.",
    },
    tocLabel: "Sur cette page",
    hero: {
        eyebrow: "Synchronisation avec Apple Health · iPhone",
        title: "Tes totaux journaliers, dans Apple Health",
        lead: "Un raccourci iPhone gratuit copie les totaux de chaque journée terminée de Nutrition MCP vers Apple Health. Ton app d'IA continue d'enregistrer tes repas ; le raccourci n'envoie que les journées terminées.",
        seeTitle: "Ce que tu verras dans Apple Health",
        seeItems: [
            "Une entrée par nutriment pour chaque journée terminée, à <strong>12:00</strong>, provenant de <strong>Raccourcis</strong>.",
            "Une journée est terminée à <strong>05:00</strong> le lendemain matin dans ton fuseau horaire : hier arrive donc après 05:00 aujourd'hui. Aujourd'hui n'y figure jamais.",
        ],
        nutrientsLabel: "Envoyé chaque jour",
        nutrients: {
            energy_kcal: "Énergie alimentaire",
            protein_g: "Protéines",
            carbohydrates_g: "Glucides",
            fat_g: "Lipides totaux",
            fiber_g: "Fibres",
            caffeine_mg: "Caféine",
            water_ml: "Eau",
        },
        waterNote: "si tu le choisis",
        alcoholNote: "L'alcool n'est jamais envoyé.",
    },
    before: {
        title: "Avant de commencer",
        items: [
            "Un iPhone avec les apps <strong>Raccourcis</strong> et <strong>Santé</strong>. Les deux sont fournies avec iOS.",
            "Un compte Nutrition MCP déjà connecté à ton app d'IA, comme Claude ou ChatGPT. Le raccourci se connecte avec ce même compte.",
            "Recommandé : ton fuseau horaire dans ton profil, puisque c'est lui qui décide où se termine une journée. Dis simplement <em>&laquo;&nbsp;règle mon fuseau horaire&nbsp;&raquo;</em> dans le chat. Si tu n'en as jamais défini, c'est le fuseau horaire indiqué par ton iPhone au moment de la connexion qui est utilisé.",
        ],
    },
    install: {
        title: "Installer le raccourci",
        lead: "Ouvre le lien sur ton iPhone et touche <strong>Ajouter le raccourci</strong>. Il apparaît dans l'app Raccourcis sous le nom <strong>Nutrition MCP Health</strong>.",
        button: "Obtenir le raccourci",
        pending: "Le lien du raccourci sera bientôt publié ici.",
        leadPending:
            "Le raccourci n'est pas encore publié. Une fois disponible, tu ouvriras son lien sur ton iPhone et toucheras <strong>Ajouter le raccourci</strong> ; il apparaîtra dans l'app Raccourcis sous le nom <strong>Nutrition MCP Health</strong>. Les étapes ci-dessous décrivent la suite.",
        nameNote:
            "Garde exactement le nom <strong>Nutrition MCP Health</strong>. La page de connexion rouvre le raccourci par ce nom : s'il est renommé, la connexion s'arrête à mi-chemin.",
    },
    connect: {
        title: "Le connecter",
        steps: [
            "Dans l'app Raccourcis, touche <strong>Nutrition MCP Health</strong> pour l'exécuter.",
            "Réponds à deux questions : faut-il aussi envoyer l'<strong>eau</strong> (laisse-la de côté si ton Apple Watch ou une autre app enregistre déjà ton eau), et quels jours envoyer, <strong>From today</strong> (à partir d'aujourd'hui) ou <strong>Also the last 7 days</strong> (aussi les 7 derniers jours).",
            "Safari ouvre une page de connexion. Connecte-toi avec le <strong>même compte que celui de ton app d'IA</strong>. La page affiche un avis sur la connexion d'Apple Health : ne continue que si tu viens de lancer cela toi-même, depuis le raccourci de ton propre iPhone.",
            "Quand Safari te demande s'il faut ouvrir Raccourcis, touche <strong>Ouvrir</strong>. Le raccourci termine la connexion.",
            "La première fois qu'une journée est envoyée, Apple Health te demande ce que Raccourcis peut écrire : active <strong>chaque type</strong> et touche <strong>Autoriser</strong>. Si tu as choisi <strong>Also the last 7 days</strong> et enregistré des repas pendant ces jours, cela se produit tout de suite. Sinon, il n'y a encore rien à envoyer : demain après 05:00, ouvre le raccourci et touche <strong>Sync now</strong> une fois pour y répondre.",
        ],
        note: "Le lien de connexion ne fonctionne qu'une fois, pendant 30 minutes. S'il expire, exécute à nouveau le raccourci. Ta première journée terminée arrive après 05:00 demain ; si tu as choisi les 7 derniers jours, ceux-ci sont envoyés tout de suite.",
    },
    automate: {
        title: "Le rendre automatique",
        lead: "Un raccourci partagé ne peut pas emporter ses automatisations : crée-les donc une fois dans l'onglet <strong>Automatisation</strong> de l'app Raccourcis. La première est celle qui compte ; les autres rattrapent le retard quand tu n'ouvres pas Santé.",
        triggersLabel: "Quand l'exécuter",
        triggers: [
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
        stepsLabel: "Pour chacune",
        steps: [
            "Dans l'app Raccourcis, ouvre l'onglet <strong>Automatisation</strong> et touche <strong>+</strong> pour créer une automatisation personnelle.",
            "Choisis le déclencheur, par exemple <strong>App</strong> → <strong>Santé</strong> → <strong>Est ouverte</strong>.",
            "Choisis <strong>Exécuter immédiatement</strong> et désactive <strong>Avertir lors de l'exécution</strong> si ton iPhone le propose.",
            "Ajoute l'action <strong>Exécuter le raccourci</strong>, choisis <strong>Nutrition MCP Health</strong> et règle son entrée sur le texte <code>auto</code>.",
        ],
        note: "L'entrée <code>auto</code> rend les exécutions automatiques discrètes : elles ne t'avertissent que lorsque quelque chose demande ton attention. Pas besoin d'heure précise : chaque synchronisation remonte sur les 7 dernières journées terminées, donc un matin manqué se rattrape tout seul.",
    },
    everyday: {
        title: "Au quotidien",
        cards: [
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
                body: "Demande à ton IA d'afficher ton profil (<code>get_profile</code>) : il indique quand la synchronisation a été connectée, jusqu'à quelle journée elle a envoyé et quand elle s'est exécutée pour la dernière fois.",
            },
        ],
    },
    privacy: {
        title: "Confidentialité et limites",
        items: [
            "Notre serveur conserve la connexion et, pendant 8 jours, un historique des totaux envoyés, afin que chaque journée soit envoyée une fois puis seulement complétée. Les deux figurent dans ton export de données.",
            "Le raccourci conserve son jeton d'accès dans son propre stockage au sein de l'app Raccourcis sur ton iPhone, et non dans un fichier, et l'app Raccourcis peut le synchroniser avec tes autres appareils via iCloud. Toute personne pouvant exécuter le raccourci sur tes appareils peut utiliser la synchronisation jusqu'à ce que tu la déconnectes : garde-le donc sur des appareils que toi seul utilises.",
            "Nous n'envoyons rien à Apple. Le raccourci demande tes totaux à notre serveur et les écrit dans Santé sur ton iPhone ; à partir de là, ce sont tes propres réglages Apple qui s'appliquent.",
            "Choisis <strong>Disconnect</strong> à tout moment : la connexion et son historique sont supprimés immédiatement. Elle prend aussi fin d'elle-même après 90 jours sans synchronisation, et 365 jours après la connexion. Ce qui est déjà dans Apple Health y reste jusqu'à ce que tu le supprimes.",
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
            "Tu héberges ton propre serveur ? Le raccourci est construit étape par étape dans {link}.",
        linkText: "la fiche de construction",
    },
};

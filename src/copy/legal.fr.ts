// French (fr) translation of the Privacy Policy and Terms of Service — see
// src/copy/legal.ts for the authoritative shape (`LegalDoc`) and the source
// English content. Kept in the same direct, plain-spoken "tu" register as
// the rest of the French site (src/copy/index.fr.ts, tools.fr.ts,
// alternatives.fr.ts, chrome.fr.ts) rather than shifting into formal
// legalese ("vous", "le Prestataire") — the English document deliberately
// reads like a person wrote it, and a register shift in translation would
// change the document's character more than its wording. No human review
// pass (product decision, already true for German) — legal terminology
// below follows standard French privacy-policy / CGU conventions as
// closely as a single AI pass reasonably can, but this is exactly the page
// most worth a native-speaker legal review before it's relied on.
//
// Terminology kept consistent with the rest of the French site (see the
// French glossary): meal log → journal de repas, water log → journal
// d'hydratation, weight log → journal de poids (corporel), goals →
// objectifs, timezone → fuseau horaire, bulk importer → outil d'import,
// website analytics → mesure d'audience, rate limit → limite de requêtes,
// hashed → haché / empreinte, delete your account → supprimer ton compte,
// standard drink → verre standard, open source / MIT license → open
// source / licence MIT, Privacy Policy → Politique de confidentialité,
// Terms of Service → Conditions d'utilisation (both established in
// chrome.fr.ts). Guillemets are the &laquo;/&raquo; entities; every space
// before : ; ? ! and inside guillemets is a literal U+00A0 (no-break
// space), as French typography requires.

import type { LegalDoc } from "./legal.js";

const p = (html: string): { type: "p"; html: string } => ({
    type: "p",
    html,
});
const ul = (items: string[]): { type: "ul"; items: string[] } => ({
    type: "ul",
    items,
});

export const PRIVACY_FR: LegalDoc = {
    title: "Politique de confidentialité",
    metaDescription:
        "Comment Nutrition MCP traite tes données : ce que nous stockons, à quoi ça sert, où c'est hébergé et comment supprimer ton compte et tout son contenu à tout moment.",
    ogDescription:
        "Comment Nutrition MCP traite tes données : ce que nous stockons, à quoi ça sert, où c'est hébergé et comment supprimer ton compte et tout son contenu à tout moment.",
    lead: "Comment Nutrition MCP traite tes données : ce que nous stockons, à quoi ça sert, où c'est hébergé et comment supprimer ton compte et tout son contenu à tout moment.",
    documentsLabel: "Documents juridiques",
    tocLabel: "Sur cette page",
    lastUpdated: "3 octobre 2026",
    backToHome: "Retour à l'accueil",
    sections: [
        {
            heading: "Ce que nous collectons",
            blocks: [
                p(
                    "Lors de ton inscription, nous stockons ton <strong>adresse e-mail</strong> et un mot de passe haché de façon sécurisée, via Supabase Auth. Si tu te connectes plutôt avec Google, nous ne demandons à Google que ton adresse e-mail, que nous recevons accompagnée de l'identifiant de ton compte Google ; Supabase Auth le conserve pour te reconnaître lors de ta prochaine connexion avec Google. Nous ne voyons jamais aucun mot de passe Google. Les comptes qui se sont connectés avec Google avant le 27 septembre 2026 peuvent encore contenir le nom et la photo de profil que Google transmettait à l'époque ; rien dans le service ne les lit ni ne les affiche, hormis l'export de tes données, et ils sont supprimés avec ton compte.",
                ),
                p("Lorsque tu utilises le service, nous stockons :"),
                ul([
                    "<strong>Journaux de repas</strong> : description, type de repas, calories, macros, fibres, sucres totaux, grammes d'alcool, milligrammes de caféine, notes et horodatages. Les photos de repas sont interprétées par ton assistant IA ; elles ne nous sont jamais envoyées et nous ne les stockons jamais.",
                    "<strong>Journaux d'hydratation</strong> : quantité, notes et horodatages.",
                    "<strong>Journaux de poids corporel</strong> : poids, notes et horodatages. Il s'agit de données de santé, traitées exactement comme le reste de tes journaux.",
                    "<strong>Journaux de mensurations</strong> : la zone mesurée (taille, hanches, cou, poitrine, épaules, haut du bras, avant-bras, cuisse ou mollet), la valeur telle que tu l'as saisie et son unité (cm ou in), notes et horodatages. Il s'agit de données de santé, traitées exactement comme le reste de tes journaux.",
                    "<strong>Objectifs</strong> : tes cibles quotidiennes en calories, protéines, glucides, lipides, fibres, sucres, alcool, caféine et eau, ainsi que ton poids cible.",
                    "<strong>Réglages de profil</strong> : ton fuseau horaire IANA, ton unité de poids préférée, ton unité de longueur préférée pour les mensurations, l'activation ou non du suivi de l'alcool et le verre standard dans lequel il est affiché, l'activation ou non des widgets dans le chat, ainsi que la langue dans laquelle ces widgets s'affichent.",
                    "<strong>Synchronisation avec Apple Health</strong> : uniquement si tu la connectes depuis le raccourci Nutrition MCP Health de ton iPhone. Nous conservons la connexion (les totaux journaliers qu'elle envoie, si l'eau en fait partie, la date à partir de laquelle elle s'applique, le fuseau horaire indiqué par ton iPhone, utilisé seulement tant que ton profil n'en a pas, et les dates de création, de dernière utilisation et de dernière synchronisation) ; pour chacun des 8 derniers jours, les totaux déjà envoyés à Apple Health et le moment de l'envoi, afin que chaque jour soit envoyé une fois puis seulement complété par ce qui a été ajouté ; et, pendant que tu te connectes, une demande de connexion en attente pendant 30 minutes au maximum. L'alcool n'est jamais envoyé.",
                    "<strong>Télémétrie d'utilisation des outils</strong> : pour chaque appel d'outil MCP, l'outil exécuté, s'il a réussi, sa durée, une catégorie d'erreur générale en cas d'échec, le nombre de jours couverts par toute plage de dates que tu as demandée, l'identifiant de session MCP, la révision du protocole MCP avec laquelle ton application d'IA s'est connectée, ainsi que le nom et la version sous lesquels cette application se présente (par exemple &laquo; claude-ai/1.0 &raquo;), lorsqu'elle les envoie. Elle est liée à l'identifiant de ton compte. Elle n'inclut jamais le contenu de tes journaux.",
                    "<strong>Journal d'exécution du serveur</strong> : pour chaque requête adressée au serveur, la méthode, le chemin, le code de statut et le temps de réponse, ton adresse IP tronquée de sa dernière partie et, pour les requêtes MCP, la révision du protocole ainsi que le nom et la version qu'indique ton application d'IA. Pour chaque appel d'outil, il enregistre aussi le nom de l'outil, s'il a réussi, sa durée et, en cas d'échec, un court code de référence et le message d'erreur, qui peut reprendre une valeur envoyée par ton application d'IA, comme une date invalide. Lorsque ton application d'IA se connecte ou renouvelle sa connexion, il enregistre le résultat, l'identifiant aléatoire attribué à ton application d'IA lors de son enregistrement auprès de notre service de connexion, et le site vers lequel elle a demandé à être redirigée (par exemple claude.ai). Ce journal est écrit dans le journal d'exécution de notre hébergeur, ne contient ni l'identifiant de ton compte ni ton adresse e-mail, et n'est conservé que brièvement : il s'agit d'un tampon circulaire dont les lignes les plus anciennes sont écrasées à mesure que du nouveau trafic arrive.",
                ]),
                p(
                    "<strong>L'alcool est lui aussi une donnée de santé</strong>, plus sensible encore qu'un nombre de calories ; il est donc traité différemment de tout ce qui précède. Le suivi de l'alcool est désactivé par défaut, et nous n'enregistrons de l'alcool que s'il vient de toi : une boisson que tu enregistres, ou une colonne d'un fichier que tu importes. Rien ne le déduit à ta place. Désactiver ce réglage a deux effets : l'outil d'import cesse de lire la colonne alcool des fichiers que tu téléverses, et partout ailleurs, l'alcool n'apparaît plus dans les repas, objectifs, progressions et widgets que tu vois. Ce n'est pas un bouton de suppression. L'alcool que tu enregistres directement est toujours enregistré, que le réglage soit activé ou non ; tout ce qui est déjà stocké reste dans la base de données, et tout cela figure toujours dans le fichier des repas de chaque export que tu effectues. Pour retirer réellement une quantité d'alcool, supprime le repas auquel elle appartient, ou supprime ton compte.",
                ),
                p(
                    "Nous conservons également les jetons d'accès et de rafraîchissement OAuth, ainsi que les codes d'autorisation, qui permettent à ton assistant IA de rester connecté à ton compte ; la durée de vie de chacun est indiquée dans la section &laquo; Durée de conservation des données &raquo;. Ils ne sont stockés que sous forme d'empreintes irréversibles (hachages). La synchronisation avec Apple Health a son propre jeton d'accès, que nous ne stockons lui aussi que sous forme d'empreinte irréversible ; le raccourci a besoin du jeton lui-même pour faire ses requêtes, l'app Raccourcis le conserve donc dans le stockage propre du raccourci sur ton iPhone, et non dans un fichier, et peut le synchroniser avec tes autres appareils si tes raccourcis sont synchronisés via iCloud. Toute personne pouvant exécuter ce raccourci sur tes appareils peut utiliser la synchronisation jusqu'à ce que tu la déconnectes.",
                ),
            ],
        },
        {
            heading: "Utilisation de tes données",
            blocks: [
                p(
                    "Tes données de repas, d'hydratation, de poids, de mensurations et d'objectifs servent uniquement à fournir le service de suivi nutritionnel et, sous forme agrégée et anonyme, les statistiques publiques de la page d'accueil. Nous ne les <strong>vendons jamais, ne les partageons jamais avec des tiers et ne les utilisons jamais à des fins publicitaires</strong>, et nous ne les intégrons à aucun système de publicité ou de profilage. La synchronisation avec Apple Health, décrite plus bas, n'y change rien : c'est un transfert que tu lances toi-même, vers ton propre iPhone, et nous n'envoyons rien à Apple.",
                ),
                p(
                    "La page d'accueil et le flux public de statistiques qui l'alimente affichent des totaux anonymes pour l'ensemble du site (nombre de repas enregistrés, leurs calories et leurs macros, eau enregistrée et poids net perdu, tous comptes confondus), ainsi que les fuseaux horaires définis dans les profils, que la page d'accueil représente sur une carte du monde. Un fuseau horaire n'apparaît sur la carte que si au moins trois profils l'utilisent, et aucun chiffre n'est rattaché à une personne.",
                ),
                p(
                    'Quand tu recherches un code-barres, ou que ton assistant IA le fait, notre serveur n\'envoie que les chiffres du code-barres à <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> (jamais ton compte, ton e-mail ni tes journaux) et conserve les données produit renvoyées dans un cache partagé qui n\'est lié à aucun utilisateur.',
                ),
                p(
                    "Si tu connectes la synchronisation avec Apple Health, le raccourci de ton iPhone demande à notre serveur les totaux journaliers de tes journées terminées (calories, protéines, glucides, lipides, fibres, caféine et, si tu l'as choisi, eau) et les écrit dans Apple Health sur cet iPhone. Cela se fait à ta demande et sur ton appareil : notre serveur ne fait que répondre au raccourci et n'envoie rien à Apple. Une fois les totaux dans Apple Health, ils y sont conservés et partagés selon tes propres réglages et ton accord avec Apple, et non le nôtre.",
                ),
                p(
                    "Nous recueillons bien deux types de statistiques d'utilisation, et aucun ne touche au contenu de tes journaux :",
                ),
                ul([
                    "<strong>Mesure d'audience du site.</strong> Avec ton consentement, ces pages chargent Google Analytics, qui nous fournit des statistiques de trafic agrégées (pages vues, sites référents, zone géographique approximative, type d'appareil), et Microsoft Clarity, qui enregistre la façon dont les visiteurs utilisent le site (clics, appuis, défilement, mouvements de souris) sous forme de rediffusions de session et de cartes de chaleur, pour que nous puissions voir où les pages prêtent à confusion. Aucun des deux ne se charge tant que tu n'as pas accepté dans le bandeau cookies ; si tu refuses, aucun des deux ne se charge, et si ton navigateur envoie un signal Global Privacy Control, aucun des deux ne se charge, sauf si tu donnes toi-même ton accord depuis le pied de page. Accepter n'autorise que le stockage lié à la mesure d'audience : le stockage publicitaire et Google Signals restent désactivés. Google reçoit ton adresse IP à chaque requête mais, selon Google, ne la journalise ni ne la stocke pour les visiteurs de l'UE, de Suisse ou du Royaume-Uni, et ne s'en sert que pour en déduire une localisation approximative. Clarity masque ce que tu saisis dans les formulaires et reçoit lui aussi ton adresse IP et des informations sur ton navigateur. Aucun des deux n'est actif sur la page de connexion. Tu peux retirer ton consentement à tout moment via &laquo; Paramètres des cookies &raquo; dans le pied de page, ce qui supprime aussi les cookies de mesure d'audience déposés par ce site ; ton choix est conservé dans le stockage local de ton navigateur pendant 6 mois au maximum.",
                    "<strong>Télémétrie serveur.</strong> Chaque appel d'outil MCP écrit une ligne de télémétrie d'utilisation (l'outil exécuté, s'il a réussi, sa durée, la révision du protocole MCP et l'application d'IA, d'après le nom et la version qu'elle indique, à l'origine de l'appel), liée à l'identifiant de ton compte mais pas à ce que tu as enregistré. Nous nous en servons pour repérer les outils lents ou défaillants. Elle n'est partagée avec personne et elle est supprimée avec tout le reste quand tu supprimes ton compte.",
                ]),
                p(
                    "Comme le site charge des polices et des icônes depuis Google Fonts et jsDelivr, consulter ces pages expose ton adresse IP à ces prestataires. Le nombre d'étoiles du projet sur GitHub est récupéré par notre serveur, et non par ton navigateur : GitHub ne voit donc jamais ta visite.",
                ),
            ],
        },
        {
            heading: "Où sont stockées tes données",
            blocks: [
                p(
                    'Toutes les données sont stockées chez <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) dans l\'UE, dans la région Irlande d\'AWS (eu-west-1). L\'authentification et le stockage des exports sont assurés par Supabase dans la même région. Le serveur est hébergé chez DigitalOcean à Francfort, en Allemagne. Les requêtes vers le site et le serveur transitent par le réseau de Cloudflare (utilisé par notre hébergeur), qui déchiffre la connexion et traite donc, en transit, tout ce qui est envoyé au service ou en provient, y compris ton adresse IP, et peut déposer un cookie de protection contre les robots strictement nécessaire (<code>__cf_bm</code>, 30 minutes).',
                ),
            ],
        },
        {
            heading: "Durée de conservation des données",
            blocks: [
                p(
                    "Tes journaux de repas, d'hydratation, de poids et de mensurations, tes objectifs, tes réglages de profil et ta télémétrie d'utilisation des outils sont conservés tant que ton compte existe : aucun n'a de date d'expiration propre ni de purge programmée. Quand tu supprimes ton compte, tout est supprimé immédiatement et de manière irréversible, comme décrit ci-dessous. Les seules traces qui subsistent sont la ligne de télémétrie de la suppression elle-même, enregistrée sans l'identifiant de ton compte ; le journal d'exécution du serveur à courte durée de vie décrit plus haut, qui ne contient jamais l'identifiant de ton compte ; les journaux opérationnels propres à notre fournisseur de base de données, conservés pendant une durée limitée (7 jours au maximum avec notre offre) ; et ses sauvegardes en rotation, qui expirent selon leur propre calendrier.",
                ),
                p(
                    "Les identifiants de connexion sont volontairement éphémères. La session de la page de connexion dure 10 minutes et est conservée dans la mémoire du serveur ; elle est liée à ton navigateur par un cookie strictement nécessaire qui ne contient qu'une valeur aléatoire, expire au bout de ces mêmes 10 minutes et est supprimé une fois la connexion terminée. Pour vérifier ton mot de passe ou ta connexion Google, nous utilisons Supabase Auth, qui crée à chaque fois une session de connexion Supabase ; nous ne l'utilisons jamais et y mettons fin immédiatement. Le code d'autorisation à usage unique remis à ton application d'IA expire au bout de 10 minutes et est supprimé dès qu'il est utilisé. Un jeton d'accès est valable 24 heures (les quelques jetons émis jusqu'au 27 septembre 2026 inclus expirent au plus tard le 6 octobre 2026) ; un jeton de rafraîchissement est valable 90 jours et il est supprimé dès qu'il sert à obtenir une nouvelle paire de jetons. Les jetons et codes expirés sont supprimés automatiquement en moins d'une heure. La suppression de ton compte les efface tous immédiatement.",
                ),
                p(
                    "La synchronisation avec Apple Health est elle aussi limitée dans le temps. La connexion prend fin dès qu'elle est restée 90 jours sans être utilisée, et dans tous les cas 365 jours après que tu l'as connectée ; il faut ensuite reconnecter le raccourci. L'historique de ce qui a été envoyé ne garde que les 8 derniers jours, et une demande de connexion que tu ne termines pas dure 30 minutes. Les connexions, historiques et demandes expirés sont supprimés automatiquement en moins d'une heure. Choisir Disconnect dans le raccourci supprime immédiatement la connexion et son historique.",
                ),
                p(
                    "Les archives d'export sont éphémères. Chaque nouvel export remplace le précédent, et le fichier est supprimé automatiquement dès que son lien de téléchargement, valable 60 minutes, a expiré : un nettoyage s'exécute toutes les dix minutes, si bien qu'une archive ne reste normalement pas stockée plus de 70 minutes environ.",
                ),
            ],
        },
        {
            heading: "Suppression des données",
            blocks: [
                p(
                    "Tu peux supprimer ton compte et toutes les données associées à tout moment en demandant à ton assistant IA de <strong>supprimer ton compte</strong> pendant qu'il est connecté au serveur Nutrition MCP. Cette action est immédiate et irréversible. Elle efface tes journaux de repas, d'hydratation, de poids et de mensurations, tes objectifs, tes réglages de profil, toute archive d'export encore stockée, ta télémétrie d'utilisation des outils, tes jetons d'accès, ta connexion de synchronisation avec Apple Health et son historique de ce qui a été envoyé, et le compte lui-même. Cela inclut toutes les quantités d'alcool que tu as pu enregistrer, que le suivi de l'alcool ait été activé ou non. Les totaux que le raccourci a déjà écrits dans Apple Health se trouvent sur ton iPhone, pas sur nos serveurs ; ils y restent jusqu'à ce que tu les supprimes dans l'app Santé.",
                ),
            ],
        },
        {
            heading: "Contact et tes droits",
            blocks: [
                p(
                    'Nutrition MCP est exploité par Anton Kutishevskyi, développeur indépendant, qui est le responsable du traitement de tes données personnelles pour ce service. Pour toute question sur tes données ou sur cette politique, écris à <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p(
                    "Les bases légales sur lesquelles nous traitons tes données :",
                ),
                ul([
                    "<strong>Ton compte et tes journaux</strong> : la fourniture du service auquel tu as souscrit (exécution d'un contrat). Les repas, le poids, les mensurations et l'alcool sont des données de santé ; nous les traitons donc sur la base de ton consentement explicite, donné à la création de ton compte et à chaque connexion (pour une application connectée avant que la page de connexion ne recueille ce consentement : par l'enregistrement même des entrées, jusqu'à ta prochaine connexion), que tu peux retirer à tout moment en supprimant les entrées ou ton compte. La synchronisation avec Apple Health repose sur ce même consentement et ne fonctionne qu'une fois que tu la connectes ; la déconnecter dans le raccourci retire ce consentement pour la synchronisation.",
                    "<strong>La télémétrie d'utilisation des outils et le journal d'exécution du serveur</strong> : notre intérêt légitime à maintenir le service fonctionnel, rapide et sûr (repérer les outils défaillants, contrer les abus en limitant le nombre de requêtes). Aucun des deux ne contient le contenu de tes journaux.",
                    "<strong>La mesure d'audience du site</strong> : ton consentement, donné dans le bandeau cookies et que tu peux retirer à tout moment via &laquo; Paramètres des cookies &raquo; dans le pied de page.",
                ]),
                p(
                    "Tes droits et comment les exercer (la plupart ne demandent même pas d'e-mail) :",
                ),
                ul([
                    "<strong>Accès et portabilité</strong> : demande à ton assistant IA d'exporter tes données. Tu reçois une archive ZIP de fichiers CSV contenant tout ce que nous stockons à ton sujet : tes journaux de repas, d'hydratation, de poids et de mensurations, tes objectifs, tes réglages, les données de ton compte (adresse e-mail, méthodes et dates de connexion, ainsi que tout nom ou photo envoyé par Google), ta télémétrie d'utilisation des outils, les connexions qui maintiennent connectées tes applications d'IA et la synchronisation avec Apple Health (sans les jetons eux-mêmes), ainsi que l'historique des totaux journaliers envoyés à Apple Health au cours des 8 derniers jours. N'y figurent pas : les valeurs que nous ne conservons que sous forme d'empreintes irréversibles, pour des raisons de sécurité (ton mot de passe et les jetons de tes connexions) ; les données de gestion interne comme les clés de détection des doublons ; le journal d'exécution du serveur, qui ne contient pas l'identifiant de ton compte ; ainsi que les journaux de courte durée et les sauvegardes en rotation propres à nos prestataires.",
                    "<strong>Rectification</strong> : demande à ton assistant IA de corriger ou de supprimer n'importe quelle entrée de repas, d'eau, de poids ou de mensurations, ou de modifier tes objectifs et tes réglages.",
                    "<strong>Effacement</strong> : demande à ton assistant IA de supprimer ton compte, ce qui supprime tout en une seule fois.",
                    "<strong>Opposition et limitation</strong> : écris-nous.",
                    "<strong>Réclamation</strong> : tu peux introduire une réclamation auprès de l'autorité de protection des données du pays où tu vis ou travailles. Nous aimerions toutefois avoir d'abord la possibilité de régler le problème.",
                ]),
                p(
                    "Tout ce que nous stockons reste dans la région de l'UE mentionnée plus haut. Ce que ton assistant IA lit au moyen des outils est transmis au fournisseur de cet assistant, qui peut se trouver hors de l'UE ; cela relève de ton propre accord avec ce fournisseur, et non du nôtre. Cloudflare (le réseau par lequel transite chaque requête), Google et Microsoft (mesure d'audience du site, Google Sign-In) ainsi que Google et jsDelivr (les requêtes de polices et d'icônes décrites plus haut) se trouvent eux aussi hors de l'UE ; lorsqu'ils reçoivent des données personnelles en dehors de l'UE, ils s'appuient sur les clauses contractuelles types de la Commission européenne ou sur le cadre de protection des données UE–États-Unis (EU–US Data Privacy Framework). La synchronisation avec Apple Health n'ajoute aucun transfert de notre part : les totaux vont de notre serveur au raccourci de ton iPhone, et ce qu'Apple Health en fait ensuite dépend de tes propres réglages Apple.",
                ),
                p(
                    'Le service ne s\'adresse pas aux moins de 16 ans, et les <a href="/terms" data-legal-link="terms">Conditions d\'utilisation</a> exigent que tu aies au moins 16 ans. Si tu penses qu\'une personne plus jeune a créé un compte, écris-nous et nous le supprimerons.',
                ),
                p(
                    "Si cette politique change, la date indiquée en haut de la page change avec elle.",
                ),
            ],
        },
        {
            heading: "Conditions d'utilisation",
            blocks: [
                p(
                    "L'utilisation du service est également régie par nos <a href=\"/terms\" data-legal-link=\"terms\">Conditions d'utilisation</a>, qui portent sur l'usage acceptable, sur le fait que rien ici ne constitue un conseil médical, et sur l'absence de toute garantie : le service est fourni en l'état, gratuitement, sans aucune garantie de disponibilité, d'exactitude ou d'adéquation à un quelconque usage.",
                ),
            ],
        },
    ],
};

export const TERMS_FR: LegalDoc = {
    title: "Conditions d'utilisation",
    metaDescription:
        "Les conditions qui régissent l'utilisation de Nutrition MCP : outil de suivi nutritionnel gratuit et open source, et serveur MCP distant pour Claude et ChatGPT. Des conditions en langage clair sur les comptes, l'usage acceptable, tes données et la responsabilité.",
    ogDescription:
        "Les conditions qui régissent l'utilisation de Nutrition MCP : outil de suivi nutritionnel gratuit et open source, et serveur MCP distant pour Claude et ChatGPT.",
    lead: "Les conditions qui régissent l'utilisation de Nutrition MCP : outil de suivi nutritionnel gratuit et open source, et serveur MCP distant pour Claude et ChatGPT.",
    documentsLabel: "Documents juridiques",
    tocLabel: "Sur cette page",
    lastUpdated: "3 octobre 2026",
    backToHome: "Retour à l'accueil",
    sections: [
        {
            heading: "Acceptation des conditions",
            blocks: [
                p(
                    "Ces conditions régissent ton utilisation de Nutrition MCP (le &laquo; service &raquo;), c'est-à-dire le site nutrition-mcp.com et le serveur MCP distant à l'adresse <strong>https://nutrition-mcp.com/mcp</strong>. En créant un compte ou en connectant un assistant IA au serveur, tu acceptes ces conditions. Si tu ne les acceptes pas, merci de ne pas utiliser le service.",
                ),
                p(
                    "Le service est exploité par Anton Kutishevskyi, développeur indépendant (&laquo; nous &raquo;).",
                ),
            ],
        },
        {
            heading: "Le service",
            blocks: [
                p(
                    "Nutrition MCP est un outil de suivi nutritionnel gratuit et open source qui fonctionne comme un serveur MCP et permet à des assistants IA comme Claude et ChatGPT d'enregistrer tes repas, ton hydratation, ton poids corporel et tes mensurations en ton nom. Si tu le souhaites, un raccourci sur ton iPhone peut copier tes totaux journaliers dans Apple Health. Il n'y a ni offre payante, ni publicité, ni frais d'utilisation du service. Nous acceptons des dons volontaires sur Patreon pour aider à couvrir les frais d'hébergement et de base de données ; il s'agit de dons, pas d'achats, et ils ne donnent droit à aucune fonctionnalité, aucune offre ni aucune priorité, de quelque nature que ce soit. Le code source est publié sous licence MIT sur <a href=\"https://github.com/akutishevsky/nutrition-mcp\" target=\"_blank\" rel=\"noopener noreferrer\">GitHub</a>, et tu es libre de l'auto-héberger.",
                ),
            ],
        },
        {
            heading: "Ton compte",
            blocks: [
                p(
                    "Tu dois avoir au moins 16 ans pour utiliser le service. Nous ne vérifions pas l'âge : en créant un compte, tu confirmes donc remplir cette condition. Tu es responsable de la confidentialité de tes identifiants de connexion, ainsi que de toute activité effectuée depuis ton compte. Merci d'indiquer une adresse e-mail que tu contrôles réellement : c'est le seul moyen de récupérer l'accès à ton compte.",
                ),
                p(
                    "Tu ne peux utiliser le service que là où ton fournisseur d'IA le prend en charge et là où les lois applicables en matière de sanctions et de contrôle des exportations le permettent.",
                ),
            ],
        },
        {
            heading: "Aucun conseil médical",
            blocks: [
                p(
                    "Nutrition MCP est un outil d'enregistrement et de suivi, pas un service de santé. Rien de ce qu'il produit (valeurs caloriques et macros, objectifs, tendances, ou tout commentaire ajouté par ton assistant IA) ne constitue un conseil médical, nutritionnel ou diététique, et rien de tout cela ne remplace l'avis d'un professionnel qualifié. Consulte un médecin ou un diététicien avant de prendre des décisions concernant ta santé, en particulier si tu as un problème de santé ou des antécédents de troubles du comportement alimentaire.",
                ),
                p(
                    "Le service n'est pas conçu pour un usage clinique et ne devrait pas être utilisé par une personne souffrant d'un trouble du comportement alimentaire actif, ni par une personne enceinte ou faisant l'objet d'un suivi médical pour une pathologie liée à la nutrition, sans l'implication de son professionnel de santé. Le suivi des calories et des macros peut être néfaste dans ces situations. Si c'est ton cas, parles-en à ton professionnel de santé avant de l'utiliser.",
                ),
                p(
                    "Les valeurs nutritionnelles sont des <strong>estimations</strong>. Elles proviennent de modèles d'IA qui interprètent tes descriptions et tes photos, de bases de données tierces comme Open Food Facts, et de tout ce que tu saisis toi-même. Elles peuvent être fausses. Vérifie tout ce qui compte.",
                ),
                p(
                    "Les photos de repas ne sont jamais envoyées à notre serveur. Ton assistant IA interprète l'image de son côté et ne nous transmet que le texte et les chiffres qui en résultent : une description, un type de repas, des calories, des macros, des notes, un code-barres.",
                ),
            ],
        },
        {
            heading: "Usage acceptable",
            blocks: [
                p("En utilisant le service, tu t'engages à ne pas :"),
                ul([
                    "l'utiliser à des fins illicites, ou en violation d'une loi ou d'une réglementation applicable ;",
                    "tenter d'accéder au compte ou aux données d'un autre utilisateur, ou de contourner l'authentification, les limites de requêtes ou tout autre dispositif de contrôle technique ;",
                    "sonder, scanner, surcharger ou perturber le service ou l'infrastructure sur laquelle il fonctionne, y compris au moyen de requêtes automatisées en masse ;",
                    "téléverser du contenu illégal, ou que tu n'as pas le droit de partager ;",
                    "revendre le service hébergé ou le présenter comme étant le tien ;",
                    "l'utiliser pour pratiquer une restriction calorique extrême, ou pour promouvoir, encourager ou accompagner quelqu'un d'autre dans cette démarche.",
                ]),
                p(
                    "Le nombre de requêtes est limité pour que le service reste disponible pour tout le monde. Si tu as besoin d'un volume plus important, auto-héberge-le : c'est précisément à cela que sert la licence MIT.",
                ),
            ],
        },
        {
            heading: "Tes données",
            blocks: [
                p(
                    'Tes journaux t\'appartiennent. Nous les stockons et les traitons pour faire fonctionner le service pour toi, comme décrit dans notre <a href="/privacy" data-legal-link="privacy">Politique de confidentialité</a>. Tu es responsable du contenu que tu enregistres.',
                ),
                p(
                    "Tu peux exporter toutes tes données à tout moment en demandant à ton assistant IA de le faire. L'export est une archive ZIP contenant des fichiers CSV pour tes repas, ton hydratation, ton poids, tes mensurations, tes objectifs, tes réglages de profil, les données de ton compte, ta télémétrie d'utilisation des outils, tes applications d'IA connectées et la synchronisation avec Apple Health ; l'alcool y figure, que le suivi de l'alcool soit activé ou non. Le lien de téléchargement que nous te fournissons est privé et expire au bout de 60 minutes.",
                ),
                p(
                    "Si tu connectes la synchronisation avec Apple Health, tes totaux journaliers sont écrits dans Apple Health sur ton iPhone, à ta demande. Une fois là, ils sont entre tes mains et soumis aux conditions d'Apple : te déconnecter ou supprimer ton compte ne les efface pas, et comme Apple Health ne peut pas diminuer une valeur qu'il contient déjà, une journée que tu corriges ensuite à la baisse n'y est pas corrigée ; supprime toi-même ces entrées dans l'app Santé. Garde le raccourci sur des appareils que toi seul utilises : il contient le jeton qui lui permet d'utiliser la synchronisation de ton compte, et le déconnecter depuis le menu du raccourci met fin à ce jeton immédiatement.",
                ),
                p(
                    "Nous enregistrons aussi une télémétrie opérationnelle de base sur l'utilisation du service : pour chaque appel d'outil, le nom de l'outil, s'il a réussi, sa durée, une catégorie d'erreur générale en cas d'échec, la durée de toute plage de dates que tu as demandée, l'identifiant de session, la révision du protocole MCP avec laquelle ton application d'IA s'est connectée, ainsi que le nom et la version sous lesquels cette application se présente. Ces lignes sont liées à l'identifiant de ton compte. Elles ne contiennent pas ce que tu as enregistré : ni description d'aliment, ni calories, ni poids, ni mensurations. Nous nous en servons pour assurer le bon fonctionnement du service et voir quels outils méritent d'être améliorés, et elles sont supprimées avec tout le reste quand tu supprimes ton compte.",
                ),
                p(
                    "Tu peux supprimer ton compte et toutes les données associées à tout moment en demandant à ton assistant IA de <strong>supprimer ton compte</strong> pendant qu'il est connecté : cette action est immédiate et irréversible.",
                ),
            ],
        },
        {
            heading: "Disponibilité et modifications",
            blocks: [
                p(
                    "Le service est proposé gratuitement, sans engagement de disponibilité ni accord de niveau de service. Nous pouvons modifier, suspendre ou interrompre tout ou partie du service, y compris les outils, les fonctionnalités et le serveur hébergé lui-même, à tout moment et sans préavis. Nous pouvons également modifier ou retirer tout contenu qui enfreint ces conditions.",
                ),
            ],
        },
        {
            heading: "Services tiers",
            blocks: [
                p(
                    "Le service dépend de tiers : Supabase pour la base de données, l'authentification et le stockage des exports ; DigitalOcean pour l'hébergement ; Cloudflare (par l'intermédiaire de notre hébergeur) pour le réseau par lequel transite chaque requête ; Open Food Facts pour les données de codes-barres ; les apps Raccourcis et Santé d'Apple si tu connectes la synchronisation avec Apple Health ; et l'assistant IA depuis lequel tu te connectes.",
                ),
                p(
                    'Données produit des codes-barres &copy; contributeurs d\'<a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, disponibles sous licence <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Le site lui-même utilise aussi, avec ton consentement, Google Analytics et Microsoft Clarity pour mesurer le trafic et l'utilisation des pages ; Google Fonts et le CDN jsDelivr pour charger les polices et les icônes ; Google Sign-In si tu choisis ce mode de connexion ; et l'API GitHub, que notre serveur (et non ton navigateur) interroge pour obtenir le nombre d'étoiles du projet, si bien qu'aucune donnée de visiteur ne parvient à GitHub. Le chargement d'une page envoie donc des requêtes à Google Fonts et jsDelivr, qui peuvent voir ton adresse IP et ton navigateur ; Google Analytics et Microsoft Clarity ne sont contactés qu'une fois que tu as accepté la mesure d'audience.",
                ),
                p(
                    "Ces services ont leurs propres conditions et leur propre disponibilité, dont nous ne sommes pas responsables.",
                ),
            ],
        },
        {
            heading: "Aucune garantie",
            blocks: [
                p(
                    "Le service est fourni <strong>&laquo; en l'état &raquo; et &laquo; selon disponibilité &raquo;</strong>, sans garantie d'aucune sorte, expresse ou implicite, y compris toute garantie implicite de qualité marchande, d'adéquation à un usage particulier, d'exactitude ou d'absence de contrefaçon. Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou exempt d'erreurs, ni que les données ou valeurs nutritionnelles qu'il produit sont exactes. Tu l'utilises à tes propres risques.",
                ),
            ],
        },
        {
            heading: "Limitation de responsabilité",
            blocks: [
                p(
                    "Dans toute la mesure permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou exemplaires, ni des pertes de données ou de bénéfices, découlant de ton utilisation du service ou liés à celle-ci.",
                ),
            ],
        },
        {
            heading: "Tes droits légaux",
            blocks: [
                p(
                    "Certaines responsabilités ne peuvent jamais être exclues, et nous ne cherchons pas à le faire. Nous restons pleinement responsables en cas de décès ou de dommage corporel causé par notre négligence, ainsi qu'en cas de fraude ou de déclaration frauduleuse.",
                ),
                p(
                    "Tu conserves aussi tous les droits que la loi t'accorde en tant que consommateur. Ces conditions s'ajoutent à ces droits sans les restreindre. Si une section ci-dessus entre en conflit avec un droit auquel tu ne peux pas renoncer, c'est ton droit légal qui prévaut.",
                ),
            ],
        },
        {
            heading: "Résiliation",
            blocks: [
                p(
                    "Tu peux cesser d'utiliser le service à tout moment et supprimer ton compte comme décrit ci-dessus. Nous pouvons suspendre ou résilier tout accès qui enfreint ces conditions ou qui menace la stabilité ou la sécurité du service. Les sections &laquo; Aucune garantie &raquo;, &laquo; Limitation de responsabilité &raquo; et &laquo; Tes droits légaux &raquo; restent applicables après la résiliation.",
                ),
            ],
        },
        {
            heading: "Modification des conditions",
            blocks: [
                p(
                    "Nous pouvons mettre à jour ces conditions de temps à autre. La version en vigueur figure toujours sur cette page, la date indiquée en haut précisant sa dernière modification. Continuer à utiliser le service après une mise à jour vaut acceptation des conditions révisées.",
                ),
            ],
        },
        {
            heading: "Indépendance des clauses",
            blocks: [
                p(
                    "Si une partie de ces conditions est jugée inapplicable, cette partie est réputée non écrite et le reste demeure en vigueur.",
                ),
            ],
        },
        {
            heading: "Contact",
            blocks: [
                p(
                    'Des questions sur ces conditions ou sur tes données ? Écris à <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

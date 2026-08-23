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
// Terminology kept consistent with the rest of the French site: meal log →
// journal de repas, water log → journal d'hydratation, weight log →
// journal de poids (corporel), goals → objectifs, timezone → fuseau
// horaire, export/import → exporter/importer, delete your account →
// supprimer ton compte, standard drink → verre standard, weight unit →
// unité de poids, widget → widget, open source / MIT license → open
// source / licence MIT (never translated as names), Privacy Policy →
// Politique de confidentialité, Terms of Service → Conditions
// d'utilisation (both established in chrome.fr.ts). Quotation marks follow
// German's approach of using HTML entities for the pair (&laquo;/&raquo;,
// French guillemets) rather than leaving the English &ldquo;/&rdquo;.

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
        "Comment Nutrition MCP traite tes données : ce que nous stockons, comment c'est utilisé, où ça se trouve, et comment supprimer ton compte et tout ce qu'il contient à tout moment.",
    ogDescription:
        "Comment Nutrition MCP traite tes données : ce que nous stockons, comment c'est utilisé, où ça se trouve, et comment supprimer ton compte et tout ce qu'il contient à tout moment.",
    lastUpdated: "26 juillet 2026",
    backToHome: "Retour à l'accueil",
    sections: [
        {
            heading: "Ce que nous collectons",
            blocks: [
                p(
                    "Lors de ton inscription, nous stockons ton <strong>adresse e-mail</strong> et un mot de passe hashé de façon sécurisée via Supabase Auth. Si tu te connectes avec Google à la place, nous recevons ton adresse e-mail depuis Google et ne voyons jamais de mot de passe.",
                ),
                p("Lorsque tu utilises le service, nous stockons :"),
                ul([
                    "<strong>Journaux de repas</strong> — description, type de repas, calories, macros, fibres, sucres totaux, grammes d'alcool, milligrammes de caféine, notes et horodatages. Les photos de repas sont interprétées par ton assistant IA et ne sont jamais téléversées vers nous ni stockées par nous.",
                    "<strong>Journaux d'hydratation</strong> — quantité, notes et horodatages.",
                    "<strong>Journaux de poids corporel</strong> — poids, notes et horodatages. Ce sont des données de santé, traitées exactement comme le reste de tes journaux.",
                    "<strong>Objectifs</strong> — tes cibles quotidiennes de calories, protéines, glucides, lipides, fibres, sucre, alcool, caféine et eau, ainsi que ton poids cible.",
                    "<strong>Réglages de profil</strong> — ton fuseau horaire IANA, ton unité de poids préférée, si le suivi de l'alcool est activé et dans quel verre standard il est affiché, ainsi que si les widgets dans le chat sont activés.",
                    "<strong>Télémétrie d'utilisation des outils</strong> — pour chaque appel d'outil MCP, quel outil a été exécuté, s'il a réussi, combien de temps il a pris, une catégorie d'erreur générale en cas d'échec, l'étendue en jours de toute plage de dates demandée, et l'identifiant de session MCP. Elle est liée à ton identifiant de compte. Elle n'inclut jamais le contenu de tes journaux.",
                ]),
                p(
                    "<strong>L'alcool est lui aussi une donnée de santé</strong>, et d'une nature plus sensible qu'un nombre de calories, donc il fonctionne différemment de tout ce qui précède. Le suivi de l'alcool est désactivé par défaut, et nous n'enregistrons de l'alcool que lorsqu'il vient de toi — une boisson que tu enregistres, ou une colonne dans un fichier que tu importes. Rien n'est déduit en ton nom. Désactiver ce réglage fait deux choses : l'importateur en masse arrête de lire la colonne alcool dans les fichiers que tu téléverses, et partout ailleurs, l'alcool cesse d'apparaître dans les repas, objectifs, progressions et widgets que tu vois. Ce n'est pas un interrupteur de suppression. L'alcool que tu as enregistré directement reste enregistré, que le réglage soit activé ou non ; tout ce qui est déjà stocké reste dans la base de données, et tout cela continue d'apparaître dans le fichier des repas de tout export que tu effectues. Pour réellement retirer un chiffre d'alcool, supprime le repas auquel il appartient, ou supprime ton compte.",
                ),
                p(
                    "Nous conservons également les jetons d'accès et de rafraîchissement OAuth ainsi que les codes d'autorisation qui permettent à ton assistant IA de rester connecté à ton compte.",
                ),
            ],
        },
        {
            heading: "Comment nous l'utilisons",
            blocks: [
                p(
                    "Tes données de repas, d'hydratation, de poids et d'objectifs sont utilisées uniquement pour fournir le service de suivi nutritionnel. Nous ne les <strong>vendons jamais, ne les partageons jamais avec des tiers, et ne les utilisons jamais à des fins publicitaires</strong>, ni ne les intégrons à un système de publicité ou de profilage.",
                ),
                p(
                    "Deux types d'analyses existent bel et bien, et aucune ne touche au contenu de tes journaux :",
                ),
                ul([
                    "<strong>Analyse du site.</strong> Ces pages chargent Google Analytics, qui nous fournit des statistiques de trafic agrégées — pages vues, référents, géographie approximative, type d'appareil. Cela tourne sur chaque page, y compris celle-ci, et il n'y a actuellement ni bandeau de consentement ni anonymisation d'IP, donc Google reçoit ton adresse IP dans le cadre de la mesure standard. Si tu préfères ne pas être mesuré, un bloqueur de traceurs ou les protections de type &laquo; ne pas suivre &raquo; de ton navigateur l'en empêcheront.",
                    "<strong>Télémétrie serveur.</strong> Chaque appel d'outil MCP écrit une ligne de télémétrie d'utilisation — quel outil a été exécuté, s'il a réussi, combien de temps il a pris — liée à ton identifiant de compte mais pas à ce que tu as enregistré. Nous l'utilisons pour repérer les outils lents ou défaillants. Elle n'est partagée avec personne, et elle est supprimée avec tout le reste quand tu supprimes ton compte.",
                ]),
                p(
                    "Comme le site charge des polices et des icônes depuis Google Fonts et jsDelivr, et que la page d'accueil récupère le nombre d'étoiles du projet via l'API GitHub, visiter ces pages expose ton adresse IP à ces fournisseurs.",
                ),
            ],
        },
        {
            heading: "Où c'est stocké",
            blocks: [
                p(
                    'Toutes les données sont stockées chez <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL). L\'authentification est gérée par Supabase Auth. Le serveur est hébergé chez DigitalOcean.',
                ),
            ],
        },
        {
            heading: "Suppression des données",
            blocks: [
                p(
                    "Tu peux supprimer ton compte et toutes les données associées à tout moment en demandant à ton assistant IA de <strong>supprimer ton compte</strong> pendant qu'il est connecté au serveur Nutrition MCP. Cette action est immédiate et irréversible. Elle supprime tes journaux de repas, d'hydratation et de poids, tes objectifs, tes réglages de profil, toute archive d'export encore stockée, ta télémétrie d'utilisation des outils, tes jetons d'accès, et le compte lui-même. Cela inclut chaque chiffre d'alcool que tu as jamais enregistré, que le suivi de l'alcool ait été activé ou non.",
                ),
            ],
        },
        {
            heading: "Conditions d'utilisation",
            blocks: [
                p(
                    "L'utilisation du service est également régie par nos <a href=\"/terms\" data-legal-link=\"terms\">Conditions d'utilisation</a>, qui couvrent l'usage acceptable, le fait que rien ici ne constitue un conseil médical, et l'absence de toute garantie — le service est fourni tel quel, gratuitement, sans garantie de disponibilité, d'exactitude ou d'adéquation à un usage particulier.",
                ),
            ],
        },
    ],
};

export const TERMS_FR: LegalDoc = {
    title: "Conditions d'utilisation",
    metaDescription:
        "Les conditions qui régissent l'utilisation de Nutrition MCP — le traqueur nutritionnel gratuit et open source, et le serveur MCP distant pour Claude et ChatGPT. Conditions en langage clair couvrant les comptes, l'usage acceptable, tes données et la responsabilité.",
    ogDescription:
        "Les conditions qui régissent l'utilisation de Nutrition MCP — le traqueur nutritionnel gratuit et open source, et le serveur MCP distant pour Claude et ChatGPT.",
    lastUpdated: "26 juillet 2026",
    backToHome: "Retour à l'accueil",
    sections: [
        {
            heading: "Accord",
            blocks: [
                p(
                    "Ces conditions régissent ton utilisation de Nutrition MCP (le &laquo; service &raquo;) — le site web sur nutrition-mcp.com et le serveur MCP distant à l'adresse <strong>https://nutrition-mcp.com/mcp</strong>. En créant un compte ou en connectant un assistant IA au serveur, tu acceptes ces conditions. Si tu n'es pas d'accord, merci de ne pas utiliser le service.",
                ),
            ],
        },
        {
            heading: "Le service",
            blocks: [
                p(
                    "Nutrition MCP est un traqueur nutritionnel gratuit et open source qui tourne comme serveur MCP, permettant à des assistants IA comme Claude et ChatGPT d'enregistrer repas, hydratation et poids corporel en ton nom. Il n'y a ni palier payant, ni publicité, ni frais pour utiliser le service. Nous acceptons les dons volontaires sur Patreon pour aider à couvrir les frais d'hébergement et de base de données ; ce sont des dons, pas des achats, et ils n'achètent ni fonctionnalité, ni palier, ni priorité d'aucune sorte. Le code source est publié sous licence MIT sur <a href=\"https://github.com/akutishevsky/nutrition-mcp\" target=\"_blank\" rel=\"noopener noreferrer\">GitHub</a>, et tu es libre de l'auto-héberger.",
                ),
            ],
        },
        {
            heading: "Ton compte",
            blocks: [
                p(
                    "Tu dois avoir au moins 16 ans pour utiliser le service. Nous ne vérifions pas l'âge, donc en créant un compte, tu confirmes que tu remplis cette condition. Tu es responsable de garder tes identifiants de connexion confidentiels, ainsi que de toute activité se produisant sous ton compte. Merci de fournir une adresse e-mail que tu contrôles réellement — c'est le seul moyen de récupérer l'accès.",
                ),
            ],
        },
        {
            heading: "Pas un conseil médical",
            blocks: [
                p(
                    "Nutrition MCP est un outil d'enregistrement et de reporting, pas un service de santé. Rien de ce qu'il produit — chiffres de calories et de macros, objectifs, tendances, ou tout commentaire ajouté par ton assistant IA — ne constitue un conseil médical, nutritionnel ou diététique, et rien de tout cela ne remplace un professionnel qualifié. Consulte un médecin ou un diététicien avant de prendre des décisions concernant ta santé, en particulier en cas de condition médicale ou d'antécédents de troubles alimentaires.",
                ),
                p(
                    "Le service n'est pas conçu pour un usage clinique et ne devrait pas être utilisé par une personne souffrant d'un trouble alimentaire actif, ni par une personne enceinte ou sous suivi clinique pour une condition liée à la nutrition, sans l'implication de son médecin. Le suivi des calories et des macros peut être néfaste dans ces situations. Si cela te concerne, parles-en à ton médecin avant de l'utiliser.",
                ),
                p(
                    "Les chiffres nutritionnels sont des <strong>estimations</strong>. Ils proviennent de modèles d'IA interprétant tes descriptions et photos, de bases de données tierces comme Open Food Facts, et de ce que tu saisis toi-même. Ils peuvent être faux. Vérifie tout ce qui compte.",
                ),
                p(
                    "Les photos de repas ne sont jamais envoyées à notre serveur. Ton assistant IA interprète l'image de son côté et ne nous envoie que le texte et les chiffres qui en résultent — une description, un type de repas, des calories, des macros, des notes, un code-barres.",
                ),
            ],
        },
        {
            heading: "Usage acceptable",
            blocks: [
                p("En utilisant le service, tu acceptes de ne pas :"),
                ul([
                    "l'utiliser à des fins illégales, ou en violation d'une loi ou d'une réglementation applicable ;",
                    "tenter d'accéder au compte ou aux données d'un autre utilisateur, ou de contourner l'authentification, les limites de débit, ou tout autre contrôle technique ;",
                    "sonder, scanner, surcharger ou perturber le service ou l'infrastructure sur laquelle il tourne, y compris via des requêtes automatisées en masse ;",
                    "téléverser du contenu illégal, ou que tu n'as pas le droit de partager ;",
                    "revendre le service hébergé ou le présenter comme le tien ;",
                    "l'utiliser pour poursuivre une restriction calorique extrême, ou pour promouvoir, encourager ou coacher quelqu'un d'autre dans cette direction.",
                ]),
                p(
                    "Le service est limité en débit pour rester disponible pour tout le monde. Si tu as besoin d'un volume plus important, auto-héberge-le — c'est justement à ça que sert la licence MIT.",
                ),
            ],
        },
        {
            heading: "Tes données",
            blocks: [
                p(
                    'Tes journaux restent les tiens. Nous les stockons et les traitons pour faire fonctionner le service pour toi, comme décrit dans notre <a href="/privacy" data-legal-link="privacy">Politique de confidentialité</a>. Tu es responsable du contenu que tu enregistres.',
                ),
                p(
                    "Tu peux exporter ton <strong>journal de repas</strong> en CSV à tout moment en demandant à ton assistant IA d'exporter tes repas. L'export ne couvre que les repas — une ligne par repas avec son heure, son fuseau horaire, son type de repas, sa description, ses calories, protéines, glucides, lipides, fibres, sucre, alcool, caféine et notes. L'alcool est inclus, que le suivi de l'alcool soit activé ou non pour ton compte. L'eau, le poids, les objectifs et les réglages ne sont pas inclus dans l'export à ce jour. Le lien de téléchargement que nous te renvoyons est privé et expire au bout de 60 minutes.",
                ),
                p(
                    "Nous enregistrons aussi une télémétrie opérationnelle de base sur la façon dont le service est utilisé : pour chaque appel d'outil, le nom de l'outil, s'il a réussi, combien de temps il a pris, une catégorie d'erreur générale en cas d'échec, la longueur de toute plage de dates demandée, et l'identifiant de session. Ces lignes sont liées à ton identifiant de compte. Elles ne contiennent pas ce que tu as enregistré — ni description d'aliment, ni calories, ni poids. Nous les utilisons pour garder le service opérationnel et voir quels outils méritent d'être améliorés, et elles sont supprimées avec tout le reste quand tu supprimes ton compte.",
                ),
                p(
                    "Tu peux supprimer ton compte et toutes les données associées à tout moment en demandant à ton assistant IA de <strong>supprimer ton compte</strong> pendant qu'il est connecté — cette action est immédiate et irréversible.",
                ),
            ],
        },
        {
            heading: "Disponibilité et changements",
            blocks: [
                p(
                    "Le service est proposé gratuitement, sans engagement de disponibilité ni accord de niveau de service. Nous pouvons modifier, suspendre ou interrompre n'importe quelle partie du service — y compris les outils, les fonctionnalités et le serveur hébergé lui-même — à tout moment et sans préavis. Nous pouvons également modifier ou retirer tout contenu qui enfreint ces conditions.",
                ),
            ],
        },
        {
            heading: "Services tiers",
            blocks: [
                p(
                    "Le service dépend de tiers : Supabase pour la base de données, l'authentification et le stockage des exports, DigitalOcean pour l'hébergement, Open Food Facts pour les données de codes-barres, et l'assistant IA depuis lequel tu te connectes.",
                ),
                p(
                    "Le site lui-même utilise aussi Google Analytics pour mesurer le trafic, Google Fonts et le CDN jsDelivr pour charger les polices et icônes, Google Sign-In si tu choisis cette méthode de connexion, et l'API GitHub pour afficher le nombre d'étoiles du projet. Charger une page effectue donc des requêtes vers ces services, qui peuvent voir ton adresse IP et ton navigateur.",
                ),
                p(
                    "Leurs conditions et leur disponibilité leur sont propres, et nous n'en sommes pas responsables.",
                ),
            ],
        },
        {
            heading: "Aucune garantie",
            blocks: [
                p(
                    "Le service est fourni <strong>&laquo; tel quel &raquo; et &laquo; selon disponibilité &raquo;</strong>, sans garantie d'aucune sorte, expresse ou implicite, y compris toute garantie implicite de qualité marchande, d'adéquation à un usage particulier, d'exactitude ou de non-contrefaçon. Nous ne garantissons pas que le service sera ininterrompu, sécurisé, exempt d'erreurs, ni que les données ou chiffres nutritionnels qu'il produit sont exacts. Tu l'utilises à tes propres risques.",
                ),
            ],
        },
        {
            heading: "Limitation de responsabilité",
            blocks: [
                p(
                    "Dans la pleine mesure permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou exemplaires, ni des pertes de données ou de profits, découlant de ou liés à ton utilisation du service.",
                ),
            ],
        },
        {
            heading: "Tes droits légaux",
            blocks: [
                p(
                    "Certaines responsabilités ne peuvent jamais être exclues, et nous n'essayons pas de le faire. Nous restons pleinement responsables en cas de décès ou de blessure corporelle causés par notre négligence, ainsi qu'en cas de fraude ou de fausse déclaration frauduleuse.",
                ),
                p(
                    "Tu conserves aussi tous les droits que la loi t'accorde en tant que consommateur. Ces conditions s'ajoutent à ces droits et ne les réduisent pas. Si une section ci-dessus entre en conflit avec un droit auquel tu ne peux pas renoncer, ton droit légal prévaut.",
                ),
            ],
        },
        {
            heading: "Résiliation",
            blocks: [
                p(
                    "Tu peux arrêter d'utiliser le service à tout moment et supprimer ton compte comme décrit ci-dessus. Nous pouvons suspendre ou résilier tout accès qui enfreint ces conditions ou qui menace la stabilité ou la sécurité du service. Les sections &laquo; Aucune garantie &raquo;, &laquo; Limitation de responsabilité &raquo; et &laquo; Tes droits légaux &raquo; survivent à la résiliation.",
                ),
            ],
        },
        {
            heading: "Modifications de ces conditions",
            blocks: [
                p(
                    "Nous pouvons mettre à jour ces conditions de temps à autre. La version actuelle se trouve toujours sur cette page, avec la date en haut indiquant sa dernière modification. Continuer à utiliser le service après une mise à jour signifie que tu acceptes les conditions révisées.",
                ),
            ],
        },
        {
            heading: "Divisibilité",
            blocks: [
                p(
                    "Si une partie de ces conditions est jugée inapplicable, cette partie est supprimée et le reste continue de s'appliquer.",
                ),
            ],
        },
        {
            heading: "Contact",
            blocks: [
                p(
                    'Des questions sur ces conditions ? Écris-nous à <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

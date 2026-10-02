// French (fr) translation of the /alternatives comparison-page prose — see
// src/copy/alternatives.ts for the authoritative shape (`AppCopy`) and
// scripts/gen-alternatives.ts's App type doc comments for the accuracy
// rules (Yazio/Lifesum not recognised by column name, sniffed-then-
// confirmed dates/units, browser-side parsing) that still apply to this
// content wherever it now lives. Factual claims are preserved verbatim in
// meaning — only the language changes.
//
// Terminology kept consistent with index.fr.ts and tools.fr.ts: protein →
// protéines, carbs → glucides, fat → lipides, fiber → fibres, (total)
// sugar → sucres (totaux), alcohol → alcool (grammes d'éthanol pur),
// caffeine → caféine, meal → repas, goals → objectifs, export → export.
// Informal "tu" register throughout.
//
// Literal generated strings and CSV artifacts (e.g. the importer's
// "Breakfast (imported from MyFitnessPal)" label, Lose It!'s "n/a" cell,
// Cronometer's "Amount"/"Sugar Alcohols" column names, worked examples
// like "58.00 g") are left in their original language/form — they describe
// what the tool or a third-party export literally produces, not prose to
// translate. The list of localized column-header terms the Yazio/Lifesum
// sections cite (Spanish/French/Italian/Dutch words for fiber/sugar/
// caffeine, and German headings) is likewise kept as-is, since those are
// the literal strings the importer's column mapper recognizes.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_FR: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Pas de serveur MCP officiel, et certaines fonctionnalités sont payantes. Découvre l'alternative gratuite, qui fonctionne en conversation.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Chercher dans une base de données et choisir la bonne entrée pour chaque aliment",
            "Certaines fonctionnalités, comme le scanner de codes-barres, nécessitent une offre payante",
            "Une app et un compte à part, avec de la publicité dans la version gratuite",
        ],
        note: "MyFitnessPal est une app solide, avec une immense base de données alimentaire. Ce n'est pas une critique : c'est simplement une autre approche, pour celles et ceux qui préfèrent parler à leur IA plutôt que naviguer dans une app de suivi.",
        migrate: {
            title: "Laisser la base de données de côté",
            body: [
                "MyFitnessPal doit sa popularité à l'une des plus grandes bases de données alimentaires au monde : des dizaines de millions d'entrées ajoutées par les utilisateurs. Cette taille est aussi son point faible : pour n'importe quel aliment, tu fais défiler des quasi-doublons et tu dois deviner quelle entrée est exacte. Avec l'enregistrement en conversation, plus de recherche du tout : tu décris l'aliment et ton IA estime les macros.",
                "Et tu n'as pas à abandonner ton journal pour autant : un export CSV de MyFitnessPal s'importe directement, avec toutes ses particularités, et les années déjà enregistrées te suivent. Tout ce que tu enregistres ensuite, tu peux l'exporter en CSV quand tu veux.",
                "Les fonctionnalités que MyFitnessPal a peu à peu réservées à Premium (scanner de codes-barres, macros au gramme près, absence de publicité) sont tout simplement incluses ici. Pas besoin de choisir entre une version gratuite et un abonnement à 20 $ par mois : il n'y a qu'une seule version, gratuite et open source, et la seule nouveauté à mettre en place est un compte gratuit, créé lors de ta première connexion.",
            ],
        },
        importSection: {
            title: "Importe ton journal MyFitnessPal depuis un CSV",
            body: [
                "Des années d'historique, c'est la vraie raison de rester, et tu n'as pas à y renoncer. Demande à importer tes données et un panneau d'import s'ouvre dans le chat : tu choisis le CSV exporté par MyFitnessPal, il est analysé dans ton navigateur, les colonnes reconnues sont associées automatiquement, et tu vois ce qui sera ajouté avant toute écriture. Cette association couvre les calories, les protéines, les glucides et les lipides, ainsi que les fibres, les sucres totaux et la caféine en milligrammes quand ton export contient ces colonnes. Les lignes ne passent jamais par l'IA : elle ne peut donc rien recopier de travers.",
                "Un export MyFitnessPal est reconnu par son nom, particularités comprises. Le fichier commence par une marque d'ordre des octets (BOM) qui, sinon, corromprait le premier en-tête de colonne ; ses notes peuvent contenir des retours à la ligne dans une cellule entre guillemets, qu'un découpage naïf ligne par ligne mettrait en pièces, avec toutes les lignes suivantes ; et chaque bloc journalier se termine par une ligne de totaux qui ne doit surtout pas devenir un repas. Le point le plus important : MyFitnessPal exporte une ligne agrégée par repas et par jour, sans aucune colonne de nom d'aliment. Plutôt que de rejeter ces lignes faute de description, l'outil d'import reconnaît cette structure et les nomme d'après leur créneau : elles arrivent sous la forme « Breakfast (imported from MyFitnessPal) ».",
                "Les dates sont confirmées, pas supposées. Une colonne du type 05/06/2024 est réellement impossible à trancher (mai ou juin ?) : l'outil d'import te montre donc son interprétation à côté d'une vraie ligne de ton fichier et te laisse la corriger avant l'écriture. Et chaque ligne porte une empreinte de contenu : relancer le même fichier signale ces repas comme déjà enregistrés au lieu de les dupliquer, tant que ton fuseau horaire n'a pas changé entre-temps. Tu as importé un export partiel ou repéré une colonne mal associée ? Recommence, tout simplement.",
            ],
        },
        importFaq:
            "Oui. Demande à importer ton historique et un outil d'import s'ouvre dans le chat : tu choisis le CSV exporté par MyFitnessPal, il est analysé dans ton navigateur au lieu d'être lu par l'IA, tu associes ou confirmes les colonnes, tu vérifies l'aperçu de ce qui sera ajouté, puis tu confirmes. Les calories, les protéines, les glucides et les lipides sont importés, de même que les fibres, les sucres totaux et la caféine quand ton export les contient. L'export de MyFitnessPal est reconnu par son nom, y compris sa marque d'ordre des octets, ses lignes de totaux en fin de bloc et le fait qu'il écrit une ligne agrégée par repas et par jour sans nom d'aliment, nommée d'après le créneau du repas. Réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP peut-il scanner des codes-barres comme MyFitnessPal Premium ?",
                a: "Oui, et gratuitement. Envoie le code-barres d'un produit et Nutrition MCP récupère les macros de l'étiquette via Open Food Facts, alors que MyFitnessPal a réservé son scanner de codes-barres à l'abonnement payant Premium.",
            },
            {
                q: "Comment fonctionne l'enregistrement sans la base de données alimentaire de MyFitnessPal ?",
                a: "Tu décris ce que tu as mangé en langage courant (« un burrito bowl au poulet avec un supplément de riz ») et ton IA estime les calories et les macros. Pas besoin de fouiller une base de millions d'entrées ajoutées par les utilisateurs, ni de deviner laquelle est exacte.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Pas de serveur MCP officiel. Découvre comment suivre gratuitement tes calories et tes macros dans ton IA, en conversation.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Enregistrer en cherchant dans sa base de données, entrée par entrée",
            "Certaines fonctionnalités nécessitent l'offre payante Gold",
            "Une app à part à ouvrir à chaque repas",
        ],
        note: "Cronometer est excellent si tu veux une grande précision sur les micronutriments. Nutrition MCP adopte une approche plus légère et conversationnelle des calories, des macros et du poids, directement dans ton IA.",
        migrate: {
            title: "Quand seule la précision compte",
            body: [
                "Cronometer s'est fait un nom grâce à sa précision : des bases de données vérifiées et le suivi de plus de 80 micronutriments, vitamines et minéraux compris. Si c'est pour cette richesse en micronutriments que tu l'ouvres, sois honnête avec toi-même : des estimations en conversation ne vaudront jamais, au gramme près, une entrée de base de données de qualité labo.",
                "Mais la plupart des gens enregistrent leurs repas pour garder leurs calories et leurs macros dans une fourchette, pas pour surveiller leur apport en sélénium. Et cette fourchette couvre plus qu'il n'y paraît : en plus des protéines, des glucides et des lipides, tu as les fibres, les sucres totaux et la caféine en milligrammes, ainsi que l'alcool en grammes d'éthanol, en option, si tu l'actives. Pour ça, décrire un repas à ton IA demande bien moins d'efforts que chercher et peser chaque ingrédient, et tu as quand même des totaux quotidiens, des tendances et un poids cible à suivre, gratuitement.",
                "Il existe aussi une voie intermédiaire : comme tu es dans un assistant IA, tu peux poser la question des micronutriments quand tu en as vraiment besoin (« à peu près combien de fer et de B12 dans mes repas d'aujourd'hui ? ») et obtenir une estimation argumentée à la demande, sans avoir à enregistrer, le reste du temps, chaque gramme dans une entrée vérifiée.",
            ],
        },
        importSection: {
            title: "Dix ans d'entrées, rien de perdu",
            body: [
                "Si tu utilisais Cronometer, c'était pour sa précision : un import approximatif serait donc pire que pas d'import du tout. Demande à importer tes données et un panneau s'ouvre dans le chat : tu choisis ton CSV Cronometer, il est analysé dans ton navigateur, et tu valides un aperçu avant qu'une seule ligne soit écrite. Les chiffres sont lus directement dans le fichier ; l'IA ne voit jamais les lignes, elle ne peut donc en arrondir ni en recopier aucune.",
                "La structure de l'export Cronometer est reconnue par son nom. L'horodatage y est réparti entre une colonne date et une colonne heure, et les deux sont lues : un petit-déjeuner enregistré à 07:12 garde son heure au lieu d'être placé par défaut à midi. La quantité et l'unité sont écrites dans la même cellule (« 58.00 g », « 1.00 cup »), et une valeur écrite ainsi est bien lue comme le nombre qu'elle est, et non comme une absence de valeur. Enfin, l'en-tête « Amount » y apparaît plusieurs fois : les colonnes sont donc repérées par leur position plutôt que par leur nom, les doublons ne peuvent pas se confondre à ton insu, et l'outil d'association t'indique laquelle tu as sélectionnée.",
                "Voici précisément ce qui est importé : la date et l'heure, le nom de l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux, la caféine et les notes. Cronometer est le seul export de cette liste à proposer une colonne Caffeine (mg), et elle arrive en milligrammes : c'est déjà son unité, et c'est celle dans laquelle la caféine est stockée ici, donc rien n'est converti. Une colonne de caféine exprimée en grammes reste en revanche non associée, avec la raison affichée, plutôt que d'enregistrer 0,18 là où l'étiquette indique 180 mg. « Sucres » désigne les sucres totaux, y compris ceux des fruits et du lait, et non le sucre ajouté, qu'aucun export ne fournit de façon fiable. La colonne séparée « Sugar Alcohols » de Cronometer correspond à des polyols, ni sucre ni éthanol, et ne peut atterrir dans aucun de ces deux champs. L'alcool est un cas à part : Cronometer l'exporte en grammes d'éthanol, et il n'est importé que si tu as d'abord activé le suivi de l'alcool ici, puisqu'il reste désactivé tant que tu ne le fais pas. Les quantités des portions et les plus de 80 vitamines et minéraux de Cronometer ne sont pas importés du tout : cette richesse en micronutriments reste dans l'export propre à Cronometer. Réimporter est sans risque : chaque ligne porte une empreinte de contenu, donc relancer le même fichier signale les repas comme déjà enregistrés au lieu de les ajouter deux fois, tant que ton fuseau horaire n'a pas changé entre-temps.",
            ],
        },
        importFaq:
            "Oui. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis ton CSV Cronometer, il est analysé dans ton navigateur au lieu d'être lu par l'IA, et tu vérifies l'aperçu de ce qui sera ajouté avant de confirmer. L'export de Cronometer est reconnu par son nom : ses colonnes date et heure séparées sont toutes deux lues, et son en-tête « Amount » répété ne crée aucune confusion, car les colonnes sont repérées par leur position. La date et l'heure, le nom de l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux, la caféine en milligrammes et les notes sont importés ; l'alcool aussi, mais seulement si tu as d'abord activé son suivi. Les vitamines, les minéraux et les quantités des portions ne le sont pas. Réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP suit-il les micronutriments comme Cronometer ?",
                a: "Non. Le suivi de plus de 80 vitamines et minéraux est la spécialité de Cronometer, et Nutrition MCP n'a aucune donnée sur les micronutriments : ni sodium, ni vitamines. Ce qu'il suit, ce sont les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux, la caféine en milligrammes, l'alcool en option, l'eau et le poids. Tu peux toujours demander à ton IA une estimation approximative des micronutriments d'un repas, mais si une précision de niveau labo sur les micronutriments est indispensable, Cronometer te conviendra mieux.",
            },
            {
                q: "Nutrition MCP est-il aussi précis que Cronometer ?",
                a: "Non. Les valeurs obtenues en conversation sont des estimations de l'IA et ne vaudront pas, au gramme près, la base de données vérifiée de Cronometer ; elles peuvent être fausses, alors vérifie tout ce qui compte. Pour les produits emballés, une recherche par code-barres utilise plutôt les données d'étiquette d'Open Food Facts, qui ne sont pas vérifiées non plus. Tu sacrifies un peu de précision, mais l'enregistrement te demande beaucoup moins d'effort.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Pas de serveur MCP officiel. Enregistre plutôt tes repas en parlant à Claude ou ChatGPT, gratuitement.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Chercher et enregistrer chaque aliment à la main",
            "Certaines fonctionnalités, comme l'enregistrement photo illimité avec Snap It, nécessitent une offre payante",
            "Encore une app, encore un compte, et de la publicité dans la version gratuite",
        ],
        note: "Lose It! est un compteur de calories convivial. Nutrition MCP assure le même enregistrement de base en conversation, gratuitement, sans jamais quitter Claude ou ChatGPT.",
        migrate: {
            title: "La même simplicité, sans l'app",
            body: [
                "Lose It! a séduit en rendant le comptage des calories léger et un brin ludique, avec Snap It, son enregistrement par photo, comme fonctionnalité phare. Nutrition MCP sait aussi le faire (envoie une photo de ton assiette et ton IA l'analyse), sauf qu'il fonctionne dans l'assistant avec lequel tu discutes déjà : pas d'app à part à ouvrir.",
                "Si ce que tu aimais dans Lose It!, c'était un enregistrement sans prise de tête et un retour rapide chaque jour, tu retrouveras vite tes repères : dis ce que tu as mangé, récupère les calories et les macros qu'il te reste, et passe à autre chose. Pas de publicité, pas de vente incitative.",
                "La seule chose que tu perds, ce sont les séries et les badges que Lose It! utilise pour te faire revenir. Si c'est cette gamification qui te motive, c'est une bonne raison de rester. Si tu l'as toujours vue comme du bruit autour de l'enregistrement lui-même, elle ne te manquera pas : le chiffre du jour est là, dans le chat, dès que tu le demandes.",
            ],
        },
        importSection: {
            title: "Tes journées enregistrées te suivent",
            body: [
                "Changer d'app ne veut pas dire repartir de zéro. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis le CSV exporté par Lose It!, il est analysé dans ton navigateur, les colonnes reconnues s'associent d'elles-mêmes (la date, l'aliment, le repas, les calories, les protéines, les glucides et les lipides, ainsi que les fibres, les sucres totaux et la caféine quand ton export les contient) et tu confirmes un aperçu de ce qui sera ajouté. Un sélecteur de fichier et un aperçu, pas une dictée : de cette façon, l'IA ne lit ni ne recopie jamais tes lignes.",
                "Deux particularités de Lose It! sont traitées à dessein. Son export contient un indicateur de suppression, et les lignes marquées comme supprimées sont ignorées au lieu d'être importées : les réimporter ferait réapparaître des aliments que tu as retirés exprès, sans qu'aucun total de l'aperçu ne le révèle. Il écrit aussi la chaîne littérale « n/a » dans les cellules sans valeur ; elle est lue comme vide et non comme un zéro : une macro que tu n'as jamais suivie reste donc absente au lieu d'être enregistrée comme un vrai 0 g qui ferait baisser tes moyennes.",
                "Lance l'import aussi souvent que tu veux. Chaque ligne porte une empreinte de contenu : réimporter le même fichier signale les repas comme déjà enregistrés et n'ajoute rien, tant que ton fuseau horaire n'a pas changé entre-temps. Et si les dates de ton export peuvent se lire de deux façons (05/06 peut désigner mai ou juin), l'outil d'import montre son interprétation à côté d'une ligne de ton propre fichier et te demande de la confirmer avant l'écriture.",
            ],
        },
        importFaq:
            "Oui. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis le CSV exporté par Lose It!, il est analysé dans ton navigateur au lieu d'être lu par l'IA, et tu confirmes un aperçu avant toute écriture. La date, l'aliment, le repas, les calories, les protéines, les glucides et les lipides s'associent d'eux-mêmes, de même que les fibres, les sucres totaux et la caféine quand ton export les contient. L'export de Lose It! est reconnu par son nom : les lignes marquées comme supprimées sont ignorées au lieu de réapparaître, et ses cellules « n/a » sont lues comme vides et non comme des zéros. Réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP permet-il d'enregistrer ses repas en photo, comme Snap It de Lose It! ?",
                a: "Oui : envoie une photo de ton assiette et ton IA identifie l'aliment, estime les macros et l'enregistre une fois que tu as confirmé les détails. Lose It! limite Snap It dans sa version gratuite et en débloque l'usage illimité avec Premium ; avec Nutrition MCP, l'enregistrement par photo ne coûte rien de plus et fonctionne directement dans le chat, dans toute app d'IA capable de lire des images.",
            },
            {
                q: "Puis-je compter mes calories comme dans Lose It! ?",
                a: "Oui. Le principe est le même : dis ce que tu as mangé et récupère aussitôt les calories et les macros qu'il te reste. La différence, c'est que tu parles à ton IA au lieu de naviguer dans une app, sans publicité ni vente incitative en chemin.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Uniquement sur abonnement, et sans serveur MCP officiel. Découvre l'alternative gratuite qui fonctionne dans ton IA.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Un abonnement payant après l'essai gratuit (pas de version gratuite)",
            "Il faut quand même ouvrir une app à part pour enregistrer chaque repas",
            "Son produit, c'est le coaching adaptatif, pas un enregistrement sans effort",
        ],
        note: "Le coaching adaptatif de MacroFactor, fondé sur ta dépense énergétique totale (TDEE), est vraiment bon. Si tu veux surtout enregistrer tes macros rapidement et gratuitement dans ton IA, Nutrition MCP est une solution plus simple et sans frais.",
        migrate: {
            title: "Coaching ou enregistrement",
            body: [
                "L'argument de MacroFactor, c'est son algorithme : il observe ton apport et ton poids enregistrés et recalcule discrètement, chaque semaine, tes objectifs de calories et de macros. Un coaching adaptatif vraiment astucieux, signé par l'équipe de Stronger By Science. Ce coaching est le produit, d'où le modèle uniquement sur abonnement.",
                "Nutrition MCP ne fait tourner aucun algorithme de coaching, mais comme tu es déjà dans un assistant IA, il te suffit de demander. « Vu mes trois dernières semaines, est-ce que je devrais ajuster mes calories ? » te donne, à la demande, l'interprétation que fait ton IA de tes propres chiffres : une estimation à évaluer, pas un conseil diététique. C'est un autre modèle : une analyse quand tu la veux, en conversation, plutôt qu'un recalcul hebdomadaire fixe. Et c'est gratuit.",
                "Au fond, le choix se fait entre discipline et souplesse. Le recalcul hebdomadaire de MacroFactor a lieu que tu penses à le demander ou non, ce qui t'oblige à la rigueur ; le modèle conversationnel, lui, n'ajuste rien tant que tu ne le sollicites pas. Si tu veux un algorithme qui pilote tes chiffres sans que tu aies à intervenir, l'abonnement MacroFactor en vaut la peine. Si tu préfères enregistrer gratuitement et demander une analyse quand ça t'intéresse, Nutrition MCP te conviendra mieux.",
            ],
        },
        importSection: {
            title: "Ton journal te suit, même si le coaching reste",
            body: [
                "Ce que tu laisserais derrière toi, c'est l'algorithme, pas les données. Demande à importer tes données et un panneau d'import s'ouvre dans le chat : tu choisis ton export CSV MacroFactor, il est analysé dans ton navigateur, les colonnes reconnues sont associées automatiquement, et tu confirmes un aperçu avant toute écriture. Les lignes ne passent jamais par l'IA : rien ne peut donc être mal recopié en route.",
                "L'export de MacroFactor est reconnu par son nom (sa colonne de taille de portion le trahit) et ses colonnes date, aliment, repas, calories et macros s'associent d'elles-mêmes, fibres, sucres totaux et caféine compris quand le fichier les contient. Si ton export indique l'énergie en kilojoules plutôt qu'en kilocalories, elle est convertie au lieu d'être stockée 4,184 fois trop haute. Et comme une colonne simplement intitulée « Calories » peut contenir l'une ou l'autre unité, l'unité t'est proposée sous forme de réglage, à côté d'un exemple concret tiré de ta propre première ligne : tu la confirmes au lieu de te fier à une supposition qui gonflerait discrètement chaque journée.",
                "Cet historique est tout de suite utile, pas seulement archivé. Une fois plusieurs semaines d'apport et de poids importées, tu peux poser la question à laquelle l'algorithme de MacroFactor répondait à date fixe (« vu les trois dernières semaines, est-ce que je devrais ajuster mes calories ? ») et obtenir, à la demande, l'interprétation que fait ton IA de tes propres chiffres : une estimation, pas un conseil diététique. Un second import du même fichier ne change rien : chaque ligne porte une empreinte de contenu, et les répétitions sont signalées comme déjà enregistrées, tant que ton fuseau horaire n'a pas changé entre-temps.",
            ],
        },
        importFaq:
            "Oui. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis ton export CSV MacroFactor, il est analysé dans ton navigateur au lieu d'être lu par l'IA, et tu confirmes un aperçu avant toute écriture. L'export de MacroFactor est reconnu par son nom : la date, l'aliment, le repas, les calories, les protéines, les glucides et les lipides s'associent d'eux-mêmes, ainsi que les fibres, les sucres totaux et la caféine quand le fichier les contient. S'il indique l'énergie en kilojoules, elle est convertie en kilocalories une fois que tu as confirmé l'unité à côté d'un exemple tiré de ton propre fichier. Réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP ajuste-t-il mes objectifs de calories comme MacroFactor ?",
                a: "Pas automatiquement. Le recalcul hebdomadaire par algorithme est la fonctionnalité payante centrale de MacroFactor. Avec Nutrition MCP, tu poses la question (« d'après mes trois dernières semaines d'apport et de poids, est-ce que je devrais ajuster mes calories ? ») et ton IA y réfléchit à la demande, au lieu d'une mise à jour hebdomadaire fixe.",
            },
            {
                q: "Nutrition MCP est-il vraiment gratuit, alors que MacroFactor fonctionne uniquement sur abonnement ?",
                a: "Oui. Nutrition MCP est entièrement gratuit et open source, sans essai gratuit suivi d'un abonnement ni limites de version gratuite, contrairement à MacroFactor, qui n'a pas de version gratuite et exige un abonnement après l'essai. Il te faut une app d'IA compatible MCP, comme Claude ou ChatGPT, et un compte Nutrition MCP gratuit, que tu crées avec Google ou une adresse e-mail et un mot de passe lors de ta première connexion.",
            },
        ],
        freeAnswer:
            "Oui. Nutrition MCP est entièrement gratuit et open source, sans abonnement, alors que MacroFactor exige un abonnement payant après son essai gratuit. Il te faut une app d'IA compatible MCP, comme Claude ou ChatGPT, et un compte Nutrition MCP gratuit, que tu crées avec Google ou une adresse e-mail et un mot de passe lors de ta première connexion.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Pas de serveur MCP officiel. Suis tes repas et tes macros en conversation, gratuitement et en open source.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Chercher dans la base de données chaque aliment que tu enregistres",
            "Certaines fonctionnalités, comme les plans de repas, nécessitent l'offre payante PRO",
            "Une app et un compte à part à gérer",
        ],
        note: "Yazio est une app de suivi soignée, avec de bons plans de repas. Nutrition MCP mise sur un enregistrement sans effort, en conversation, directement dans Claude ou ChatGPT, gratuit et open source.",
        migrate: {
            title: "Les plans d'un côté, l'enregistrement de l'autre",
            body: [
                "Yazio associe le suivi à des plans de repas structurés, des recettes et des outils de jeûne, le tout soigné pour un public européen. Si c'est un plan guidé qui t'aide à garder le cap, Yazio le fait bien et Nutrition MCP ne cherche pas à rivaliser : ce n'est pas une app de plans de repas.",
                "Ce qu'il fait, en revanche, c'est rendre l'enregistrement sans effort. Au lieu de chercher chaque ingrédient dans la base de données de Yazio, tu décris le plat et ton IA s'occupe des macros, puis répond dans la foulée à « où j'en suis aujourd'hui ? ». Utilise-le avec le plan alimentaire que tu suis déjà.",
                "Les deux se complètent donc plutôt qu'ils ne se concurrencent. Continue à suivre un plan Yazio, ou n'importe quel autre, pour le « quoi manger » ; utilise Nutrition MCP pour le « est-ce que je tiens le cap », enregistré en conversation et gratuitement. Seule limite : les minuteurs de jeûne. C'est le terrain de Yazio, pas celui d'un journal nutritionnel.",
            ],
        },
        importSection: {
            title: "Apporte ton journal, associe les colonnes",
            body: [
                "Ton historique Yazio peut être importé, même s'il te faudra mettre un peu la main à la pâte. Demande à importer tes données et un panneau d'import s'ouvre dans le chat : tu choisis ton export CSV, il est analysé dans ton navigateur, et tu associes toi-même ses colonnes à la date, l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux et la caféine. Les exports de quatre apps (MyFitnessPal, Cronometer, Lose It! et MacroFactor) sont reconnus par le nom de leurs colonnes ; Yazio n'en fait pas partie, attends-toi donc à faire cette association une fois. La suite est identique : un aperçu de ce qui sera ajouté, puis ta confirmation.",
                "Les particularités européennes qui font échouer la plupart des outils d'import sont gérées. Un fichier séparé par des points-virgules dont les nombres utilisent la virgule décimale (le format qu'Excel produit avec des paramètres régionaux allemands ou autrichiens) est lu correctement, sans que le séparateur soit pris pour un séparateur décimal ni que chaque macro soit multipliée par mille. Les en-têtes que connaît l'outil d'association ne sont pas non plus uniquement en anglais : Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker et Koffein dans un export allemand sont tous reconnus, et les fibres, les sucres et la caféine le sont aussi en espagnol, en français, en italien et en néerlandais (fibra, sucres, zuccheri, suikers, cafeína, caffeina). Un fichier localisé arrive donc souvent en partie associé, et il te reste moins de colonnes à régler à la main. Les champs entre guillemets, les retours à la ligne dans une cellule, les valeurs quasi vides et les lignes de totaux égarées sont aussi gérés, et l'IA ne lit jamais le fichier : aucun chiffre ne peut donc être mal saisi en route.",
                "Les dates et l'énergie sont confirmées plutôt que devinées. Une colonne au format JJ/MM/AAAA est lue jour en premier et, quand les valeurs ne permettent vraiment pas de trancher (05/06 peut désigner mai ou juin), l'outil d'import montre son interprétation à côté d'une ligne de ton propre fichier pour que tu puisses la corriger. Si la colonne d'énergie est en kilojoules, elle est convertie en kilocalories, avec l'unité affichée sous forme de réglage à côté d'un exemple concret. Réimporter le même fichier n'ajoute rien : chaque ligne porte une empreinte de contenu, et les répétitions sont signalées comme déjà enregistrées, tant que ton fuseau horaire n'a pas changé entre-temps.",
            ],
        },
        importFaq:
            "Oui, en associant les colonnes à la main. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis ton export CSV Yazio, il est analysé dans ton navigateur au lieu d'être lu par l'IA, et tu associes toi-même ses colonnes à la date, l'aliment, le repas, les calories et les macros, dont les fibres, les sucres totaux et la caféine. Yazio ne fait pas partie des quatre exports reconnus par le nom de leurs colonnes : cette association est donc une étape manuelle, à faire une seule fois, même si les en-têtes que l'outil connaît déjà (en allemand, et pour les fibres, les sucres et la caféine, aussi en espagnol, en français, en italien et en néerlandais) se remplissent d'eux-mêmes. Les fichiers européens séparés par des points-virgules avec virgule décimale, les dates JJ/MM/AAAA et les kilojoules sont tous pris en charge, et réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP propose-t-il des plans de repas comme Yazio PRO ?",
                a: "Non. Les plans de repas structurés, les recettes et les outils de jeûne sont le point fort de Yazio, et Nutrition MCP ne cherche pas à les remplacer : il s'occupe de l'enregistrement. Beaucoup de gens continuent à suivre leur plan Yazio (ou un autre) et se contentent d'enregistrer ici, gratuitement, ce qu'ils mangent au regard de ce plan.",
            },
            {
                q: "Puis-je enregistrer mes repas plus vite qu'en cherchant dans la base de données de Yazio ?",
                a: "En général, oui. Au lieu de chercher chaque ingrédient dans la base de données de Yazio et de régler les portions, tu décris une seule fois le plat fini (« un bol de muesli avec du yaourt et des fruits rouges ») et ton IA estime et enregistre les macros en une seule étape.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Pas de serveur MCP officiel. Une façon plus simple et gratuite d'enregistrer tes repas dans Claude ou ChatGPT.",
        cons: [
            "Pas de serveur MCP officiel : impossible de remplir ton journal depuis Claude ou ChatGPT",
            "Enregistrer tes aliments un par un en cherchant dans sa base de données",
            "Certaines fonctionnalités, comme les plans alimentaires, nécessitent une offre payante",
            "Encore une app et un abonnement à gérer",
        ],
        note: "Lifesum associe le suivi à des plans alimentaires structurés. Nutrition MCP est une façon plus simple et gratuite d'enregistrer tes calories, tes macros et ton poids en parlant à ton IA.",
        migrate: {
            title: "Des notes ? Il suffit de demander",
            body: [
                "Lifesum mise sur un cadre et des retours : plans alimentaires, recettes et son système de notation des aliments, qui évalue ce que tu manges. Nutrition MCP ne note pas tes aliments avec un badge : si c'est cette boucle de notation qui te motive, Lifesum a l'avantage sur ce point.",
                "En échange, tu gagnes en souplesse : plutôt qu'une note figée, tu peux demander à ton IA « est-ce un bon choix pour mes objectifs ? » et obtenir une vraie réponse, adaptée au contexte. Une phrase suffit pour enregistrer, les tendances et le poids cible sont intégrés, et aucune offre premium ne verrouille les fonctionnalités utiles.",
                "Un badge te dit qu'un aliment a obtenu 3 sur 5 ; une conversation peut t'expliquer pourquoi, au regard de ton propre journal : « remplace la moitié du riz par des légumes verts et ça rentre dans ta journée ». Et comme Lifesum réserve les plans alimentaires et une partie du suivi à Premium, l'option gratuite des deux, c'est Nutrition MCP.",
            ],
        },
        importSection: {
            title: "Rien à retaper",
            body: [
                "Changer d'app de suivi implique de transférer ton historique, et tu n'as pas à en retaper une seule ligne. Demande à importer tes données et un panneau d'import s'ouvre dans le chat : tu choisis ton export CSV Lifesum, il est analysé dans ton navigateur, et tu associes ses colonnes à la date, l'aliment, le repas, les calories, les protéines, les glucides, les lipides, les fibres, les sucres totaux et la caféine. Les en-têtes de Lifesum ne sont pas reconnus par leur nom comme ceux de MyFitnessPal, Cronometer, Lose It! et MacroFactor : cette association est donc une étape manuelle, à faire une seule fois. Ensuite, tu vérifies l'aperçu de ce qui sera ajouté et tu confirmes.",
                "Aucune supposition cachée. L'outil d'association te montre ton propre fichier (ses vrais en-têtes, ses vraies cellules et le décompte en direct des lignes qui seront créées) : une colonne mal associée se voit donc avant toute écriture, au lieu d'être découverte après coup. Les champs entre guillemets, les retours à la ligne dans une cellule, les valeurs quasi vides et les lignes de totaux sont tous pris en charge, et comme le fichier est lu dans ton navigateur, l'IA ne voit jamais une ligne qu'elle pourrait mal recopier.",
                "Les exports européens sont pris en charge : un fichier séparé par des points-virgules avec virgule décimale est lu correctement, les dates JJ/MM/AAAA sont converties une fois l'ordre confirmé, et les kilojoules deviennent des kilocalories, avec l'unité affichée à côté d'un exemple concret tiré de ta propre première ligne. Les en-têtes localisés aident aussi : Kalorien, Kohlenhydrate, Ballaststoffe ou Koffein dans un export allemand se remplissent d'eux-mêmes, et les fibres, les sucres et la caféine sont aussi reconnus en espagnol, en français, en italien et en néerlandais. L'association manuelle est donc généralement plus rapide qu'il n'y paraît. Lance l'import deux fois, rien ne sera dupliqué : chaque ligne porte une empreinte de contenu, et les répétitions sont signalées comme déjà enregistrées, tant que ton fuseau horaire n'a pas changé entre-temps.",
            ],
        },
        importFaq:
            "Oui, en associant les colonnes à la main. Demande à importer tes données et un outil d'import s'ouvre dans le chat : tu choisis ton export CSV Lifesum, il est analysé dans ton navigateur au lieu d'être lu par l'IA, et tu associes toi-même ses colonnes à la date, l'aliment, le repas et les macros, fibres, sucres totaux et caféine compris. Lifesum ne fait pas partie des quatre exports reconnus par le nom de leurs colonnes : cette association est donc une étape manuelle, à faire une seule fois, même si les en-têtes que l'outil connaît déjà se remplissent d'eux-mêmes. Les fichiers européens séparés par des points-virgules avec virgule décimale, les dates JJ/MM/AAAA et les kilojoules sont tous pris en charge, et réimporter le même fichier ne crée aucun doublon, tant que ton fuseau horaire n'a pas changé entre-temps.",
        extraFaqs: [
            {
                q: "Nutrition MCP note-t-il mes aliments comme le fait Lifesum ?",
                a: "Non, il n'y a ni badge ni note chiffrée. À la place, tu peux demander à ton IA « est-ce un bon choix pour mes objectifs ? » et obtenir une réponse adaptée au contexte, qui explique le pour et le contre, plutôt qu'une note figée attribuée à l'aliment.",
            },
            {
                q: "Nutrition MCP est-il gratuit, sans offre du type Lifesum Premium ?",
                a: "Oui. Nutrition MCP est entièrement gratuit et open source, sans offre premium, alors que Lifesum réserve les plans alimentaires et certaines fonctionnalités de suivi à un abonnement Premium. Il te faut une app d'IA compatible MCP, comme Claude ou ChatGPT, et un compte Nutrition MCP gratuit, que tu crées avec Google ou une adresse e-mail et un mot de passe lors de ta première connexion.",
            },
        ],
    },
};

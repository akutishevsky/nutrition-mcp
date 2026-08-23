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
// like "58.00 g") are left in their original language/form — they describe
// what the tool or a third-party export literally produces, not prose to
// translate. The list of localized column-header terms the Yazio/Lifesum
// sections cite (Spanish/French/Italian/Dutch words for fiber/sugar/
// caffeine, and German headings) is likewise kept as-is, since those are
// the literal strings the importer's column mapper recognizes.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_FR: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Pas de serveur MCP, et certaines fonctionnalités nécessitent un forfait payant. Découvre l'alternative gratuite et conversationnelle.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Chercher dans une base de données et choisir la bonne entrée pour chaque aliment",
            "Certaines fonctionnalités, comme le scanner de codes-barres, nécessitent un forfait payant",
            "Une app et un compte séparés, avec de la publicité sur le forfait gratuit",
        ],
        note: "MyFitnessPal est une app performante avec une base de données alimentaire immense. Ce n'est pas une critique — c'est simplement une approche différente pour celles et ceux qui préfèrent parler à leur IA plutôt que naviguer dans un tracker.",
        migrate: {
            title: "Laisser la base de données de côté",
            body: [
                "MyFitnessPal a bâti sa popularité sur l'une des plus grandes bases de données alimentaires qui soient — des dizaines de millions d'entrées créées par la communauté. Cette ampleur est aussi sa friction : pour un aliment donné, tu fais défiler des quasi-doublons et dois deviner quelle entrée est fiable. L'enregistrement conversationnel élimine complètement cette recherche — tu décris l'aliment et ton IA estime les macros.",
                "Tu n'as pas besoin d'abandonner ton journal pour autant : un export CSV de MyFitnessPal s'importe directement, particularités comprises, donc les années déjà enregistrées t'accompagnent. Tout ce que tu enregistres ensuite peut être exporté en CSV quand tu veux.",
                "Les fonctionnalités que MyFitnessPal a progressivement mises derrière Premium — scanner de codes-barres, macros au gramme près, absence de publicité — sont simplement incluses ici. Tu n'as pas à choisir entre un forfait gratuit et une mise à niveau à 20 $ par mois ; il n'y a qu'un seul forfait, gratuit et open source, et le seul compte dont tu as besoin est celui Claude ou ChatGPT que tu as déjà.",
            ],
        },
        importSection: {
            title: "Emporte ton journal avec toi",
            body: [
                "Des années d'historique sont la vraie raison de rester, et tu n'as pas à y renoncer. Demande à importer et un panneau d'importation s'ouvre dans le chat : tu choisis le CSV exporté par MyFitnessPal, il est analysé dans ton navigateur, les colonnes reconnues sont associées automatiquement, et tu vois ce qui sera ajouté avant que rien ne soit écrit. Cette association couvre les calories, protéines, glucides et lipides, plus les fibres, les sucres totaux et la caféine en milligrammes quand ton export contient ces colonnes. Les lignes ne passent jamais par l'IA, donc rien ne peut être mal retranscrit.",
                "Un export MyFitnessPal est reconnu par son nom, particularités comprises. Le fichier arrive avec une marque d'ordre des octets (BOM) qui corromprait sinon le premier en-tête de colonne ; ses notes peuvent contenir des retours à la ligne à l'intérieur d'une cellule entre guillemets, ce qu'un découpage naïf ligne par ligne détruirait, ainsi que toutes les lignes suivantes ; et chaque bloc journalier se termine par une ligne de totaux qui ne doit surtout pas devenir un repas. Le point le plus important : MyFitnessPal exporte une ligne agrégée par repas et par jour, sans aucune colonne de nom d'aliment, donc plutôt que de rejeter ces lignes faute de description, l'importateur reconnaît cette forme et les étiquette par créneau — elles arrivent sous la forme « Breakfast (imported from MyFitnessPal) ».",
                "Les dates sont confirmées, pas supposées. Une colonne du type 05/06/2024 est réellement indécidable — mai ou juin — donc l'importateur te montre sa lecture à côté d'une vraie ligne de ton fichier et te laisse la corriger avant l'écriture. Et chaque ligne porte une empreinte de contenu, donc relancer le même fichier signale ces repas comme déjà enregistrés au lieu de les dupliquer. Importe un export partiel, repère une colonne mal associée, et recommence simplement.",
            ],
        },
        importFaq:
            "Oui. Demande à importer ton historique et un importateur s'ouvre dans le chat : tu choisis le CSV exporté par MyFitnessPal, il est analysé dans ton navigateur plutôt que lu par l'IA, tu associes ou confirmes les colonnes, tu prévisualises ce qui sera ajouté, et tu confirmes. Les calories, protéines, glucides et lipides sont importés, tout comme les fibres, les sucres totaux et la caféine quand ton export les contient. L'export de MyFitnessPal est reconnu par son nom — y compris sa marque d'ordre des octets, ses lignes de totaux en fin de bloc, et le fait qu'il écrit une ligne agrégée par repas et par jour sans nom d'aliment, étiquetée par créneau de repas. Réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP peut scanner des codes-barres comme MyFitnessPal Premium ?",
                a: "Oui, et c'est gratuit. Envoie le code-barres d'un produit et Nutrition MCP récupère les macros de l'étiquette depuis Open Food Facts — alors que MyFitnessPal a placé son scanner de codes-barres derrière un abonnement Premium payant.",
            },
            {
                q: "Comment fonctionne l'enregistrement sans la base de données alimentaire de MyFitnessPal ?",
                a: "Tu décris ce que tu as mangé en langage courant — « un burrito bowl au poulet avec supplément de riz » — et ton IA estime les calories et les macros. Il n'y a pas de base de données de millions d'entrées communautaires à parcourir, ni à deviner laquelle est fiable.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Pas de serveur MCP. Découvre la façon gratuite et conversationnelle de suivre calories et macros dans ton IA.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Enregistrer en cherchant dans sa base de données, entrée par entrée",
            "Certaines fonctionnalités nécessitent le forfait payant Gold",
            "Une app séparée à ouvrir à chaque repas",
        ],
        note: "Cronometer est excellent si tu veux une précision poussée sur les micronutriments. Nutrition MCP adopte une approche plus légère et conversationnelle des calories, macros et du poids — directement dans ton IA.",
        migrate: {
            title: "Quand la précision est tout l'enjeu",
            body: [
                "Cronometer a bâti sa réputation sur la précision — des bases de données vérifiées et un suivi de plus de 80 micronutriments, vitamines et minéraux inclus. Si c'est cette profondeur en micronutriments qui te fait l'ouvrir, sois honnête avec toi-même : des estimations conversationnelles n'égaleront pas une entrée de base de données de qualité labo, gramme pour gramme.",
                "Mais la plupart des gens enregistrent leurs repas pour rester dans une fourchette de calories et de macros, pas pour auditer leur apport en sélénium. Cette fourchette est plus large qu'il n'y paraît : en plus des protéines, glucides et lipides, tu obtiens les fibres, les sucres totaux et la caféine en milligrammes, et en option l'alcool en grammes d'éthanol si tu l'actives. Pour ça, décrire un repas à ton IA demande bien moins de travail que chercher et peser chaque composant — et tu as quand même des totaux quotidiens, des tendances et un poids cible à suivre, gratuitement.",
                "Il y a aussi une voie intermédiaire : comme tu es dans un assistant IA, tu peux demander l'angle micronutriments quand tu en as vraiment besoin — « en gros, combien de fer et de B12 dans les repas d'aujourd'hui ? » — et obtenir une estimation raisonnée à la demande, sans avoir à enregistrer chaque gramme dans une entrée vérifiée le reste du temps.",
            ],
        },
        importSection: {
            title: "Dix ans d'entrées, conservées",
            body: [
                "La précision est la raison pour laquelle tu utilisais Cronometer, donc un import approximatif serait pire que pas d'import du tout. Demande à importer et un panneau s'ouvre dans le chat : tu choisis ton CSV Cronometer, il est analysé dans ton navigateur, et tu valides un aperçu avant qu'une seule ligne ne soit écrite. Les chiffres sont lus directement dans le fichier — l'IA ne voit jamais les lignes, elle ne peut donc en arrondir ou en retranscrire aucune.",
                "La forme de l'export Cronometer est reconnue par son nom. Il répartit l'horodatage sur des colonnes date et heure séparées, et les deux sont lues, donc un petit-déjeuner enregistré à 07:12 conserve son heure au lieu d'atterrir par défaut à midi. Il écrit une quantité avec l'unité dans la même cellule — « 58.00 g », « 1.00 cup » — et une valeur écrite ainsi est toujours lue comme le nombre qu'elle est, pas comme rien du tout. Et il répète l'en-tête « Amount » plusieurs fois, donc les colonnes sont repérées par position plutôt que par nom : les doublons ne peuvent pas entrer en collision silencieusement, et l'outil d'association t'indique laquelle tu pointes.",
                "Sois clair sur ce qui passe réellement : la date et l'heure, le nom de l'aliment, le repas, les calories, protéines, glucides, lipides, fibres, sucres totaux, caféine et notes. Cronometer est le seul export de cette liste à fournir une colonne Caffeine (mg), et elle arrive en milligrammes — l'unité dans laquelle elle est déjà, et celle dans laquelle la caféine est stockée ici, donc rien n'est converti. Une colonne caféine intitulée en grammes reste au contraire non associée, avec la raison affichée, plutôt que d'enregistrer 0,18 là où l'étiquette indique 180 mg. Sucre signifie sucres totaux, fruits et lait inclus — pas le sucre ajouté, qu'aucun export ne fournit de façon fiable. La colonne séparée « Sugar Alcohols » de Cronometer est un polyol plutôt qu'un sucre ou un éthanol, et ne peut atterrir dans aucun des deux champs. L'alcool est un cas particulier : Cronometer l'exporte en éthanol en grammes, et il n'est importé que si tu as d'abord activé le suivi de l'alcool ici, puisqu'il est désactivé tant que tu ne le fais pas. Les quantités de portion et les plus de 80 vitamines et minéraux de Cronometer ne passent pas du tout — cette profondeur en micronutriments reste dans l'export propre à Cronometer. Réimporter ne présente aucun risque : chaque ligne porte une empreinte de contenu, donc relancer le même fichier signale les repas comme déjà enregistrés plutôt que de les ajouter deux fois.",
            ],
        },
        importFaq:
            "Oui. Demande à importer et un importateur s'ouvre dans le chat : tu choisis ton CSV Cronometer, il est analysé dans ton navigateur plutôt que lu par l'IA, et tu prévisualises ce qui sera ajouté avant de confirmer. L'export de Cronometer est reconnu par son nom — ses colonnes date et heure séparées sont toutes deux lues, et son en-tête « Amount » répété ne peut pas entrer en collision car les colonnes sont repérées par position. La date et l'heure, le nom de l'aliment, le repas, les calories, protéines, glucides, lipides, fibres, sucres totaux, caféine en milligrammes et notes sont importés ; l'alcool aussi, mais seulement si tu as d'abord activé son suivi. Les vitamines, minéraux et quantités de portion ne le sont pas. Réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP suit les micronutriments comme Cronometer ?",
                a: "Non. Le suivi de plus de 80 vitamines et minéraux est la spécialité de Cronometer, et Nutrition MCP n'a aucune donnée de micronutriments — ni sodium, ni vitamines. Ce qu'il suit, ce sont les calories, protéines, glucides, lipides, fibres, sucres totaux, caféine en milligrammes, alcool en option, eau et poids. Tu peux quand même demander à ton IA une estimation approximative des micronutriments d'un repas, mais si une précision de niveau labo est essentielle, Cronometer est le meilleur choix.",
            },
            {
                q: "Est-ce que Nutrition MCP est aussi précis que Cronometer ?",
                a: "Pour les calories, macros, fibres et sucre, les estimations conversationnelles sont assez proches pour la plupart des objectifs — mais elles n'égaleront pas la base de données vérifiée de Cronometer, gramme pour gramme. C'est un peu de précision échangée contre beaucoup moins d'effort d'enregistrement, ce qui est le bon compromis pour la plupart des gens.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Pas de serveur MCP. Enregistre tes repas en parlant à Claude ou ChatGPT à la place — gratuit.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Chercher et enregistrer chaque aliment à la main",
            "Certaines fonctionnalités, comme l'enregistrement par photo, nécessitent un forfait payant",
            "Encore une app, encore un compte, de la publicité sur le forfait gratuit",
        ],
        note: "Lose It! est un compteur de calories convivial. Nutrition MCP fait le même travail d'enregistrement de base par conversation, gratuitement, sans jamais quitter Claude ou ChatGPT.",
        migrate: {
            title: "La même simplicité, sans l'app",
            body: [
                "Lose It! a séduit en gardant le comptage de calories léger et un peu ludique, avec son enregistrement photo Snap It comme fonctionnalité phare. Nutrition MCP fait aussi le coup de la photo — envoie une photo de ton assiette et ton IA la lit — sauf qu'il vit dans l'assistant avec qui tu discutes déjà, donc pas d'app séparée à ouvrir.",
                "Si ce que tu aimais chez Lose It! était un enregistrement sans friction et un retour quotidien rapide, tu seras en terrain connu : dis ce que tu as mangé, récupère tes calories et macros restantes, et passe à autre chose. Pas de publicité, pas d'incitation à payer plus, et pas de compte supplémentaire à gérer.",
                "La seule chose à laquelle tu renonces, c'est la couche de séries et badges que Lose It! utilise pour te faire revenir. Si cette gamification est ce qui te motive, c'est une bonne raison de rester. Si ça t'a toujours semblé du bruit par-dessus l'enregistrement lui-même, tu ne le regretteras pas — le chiffre du jour est juste là dans le chat dès que tu le demandes.",
            ],
        },
        importSection: {
            title: "Tes journées enregistrées viennent aussi",
            body: [
                "Changer ne veut pas dire repartir de zéro. Demande à importer et un importateur s'ouvre dans le chat : tu choisis le CSV exporté par Lose It!, il est analysé dans ton navigateur, les colonnes reconnues s'associent d'elles-mêmes — la date, l'aliment, le repas, les calories, protéines, glucides et lipides, plus les fibres, sucres totaux et caféine quand ton export les contient — et tu confirmes un aperçu de ce qui sera ajouté. C'est un sélecteur de fichier et un aperçu, pas un exercice de dictée — sur ce chemin, l'IA ne lit ni ne retranscrit jamais tes lignes.",
                "Deux particularités de Lose It! sont traitées délibérément. Son export porte un indicateur de suppression, et les lignes marquées comme supprimées sont ignorées plutôt qu'importées : les ramener ressusciterait des aliments que tu as retirés exprès, et aucun total dans l'aperçu ne le révélerait. Il écrit aussi la chaîne littérale « n/a » pour les cellules sans valeur, qui est lue comme vide plutôt que comme un zéro — une macro que tu n'as jamais suivie reste donc absente au lieu d'être enregistrée comme un vrai 0 g qui tirerait tes moyennes vers le bas.",
                "Lance-le aussi souvent que tu veux. Chaque ligne porte une empreinte de contenu, donc réimporter le même fichier signale les repas comme déjà enregistrés et n'ajoute rien. Et si les dates de ton export peuvent se lire de deux façons — 05/06 étant mai ou juin — l'importateur montre sa lecture à côté d'une ligne de ton propre fichier et te demande de la confirmer avant l'écriture.",
            ],
        },
        importFaq:
            "Oui. Demande à importer et un importateur s'ouvre dans le chat : tu choisis le CSV exporté par Lose It!, il est analysé dans ton navigateur plutôt que lu par l'IA, et tu confirmes un aperçu avant que rien ne soit écrit. La date, l'aliment, le repas, les calories, protéines, glucides et lipides s'associent d'eux-mêmes, tout comme les fibres, sucres totaux et caféine quand ton export les contient. L'export de Lose It! est reconnu par son nom — les lignes marquées comme supprimées sont ignorées plutôt que ressuscitées, et ses cellules « n/a » sont lues comme vides plutôt que comme des zéros. Réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP a un enregistrement par photo comme Snap It de Lose It! ?",
                a: "Oui — envoie une photo de ton assiette et ton IA identifie l'aliment et estime les macros, puis l'enregistre après ta confirmation. Chez Lose It!, l'enregistrement par photo est derrière un forfait payant ; avec Nutrition MCP c'est gratuit et ça fonctionne directement dans le chat.",
            },
            {
                q: "Puis-je compter les calories de la même façon que dans Lose It! ?",
                a: "Oui. Le fonctionnement de base est identique — dis ce que tu as mangé et récupère instantanément tes calories et macros restantes. La différence, c'est que tu parles à ton IA au lieu de naviguer dans une app, et il n'y a ni publicité ni incitation à payer sur le chemin.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Uniquement sur abonnement et sans serveur MCP. Découvre l'alternative gratuite qui vit dans ton IA.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Un abonnement payant après l'essai gratuit (pas de forfait gratuit)",
            "Tu ouvres quand même une app séparée pour enregistrer chaque repas",
            "Son coaching adaptatif est le produit, pas un enregistrement sans effort",
        ],
        note: "Le coaching adaptatif de TDEE de MacroFactor est vraiment bon. Si tu veux surtout un enregistrement de macros rapide et gratuit dans ton IA, Nutrition MCP est une solution plus simple et sans coût.",
        migrate: {
            title: "Coaching contre enregistrement",
            body: [
                "L'argument de vente de MacroFactor, c'est son algorithme : il surveille ton apport et ton poids enregistrés et recalcule discrètement tes objectifs de calories et de macros chaque semaine — un coaching adaptatif vraiment intelligent, conçu par l'équipe Stronger By Science. Ce coaching est le produit, ce qui explique pourquoi c'est uniquement sur abonnement.",
                "Nutrition MCP ne fait tourner aucun algorithme de coaching — mais comme tu es déjà dans un assistant IA, tu peux simplement demander. « Vu mes trois dernières semaines, devrais-je ajuster mes calories ? » te donne une réponse raisonnée à la demande. C'est un modèle différent : une analyse quand tu la veux, de façon conversationnelle, plutôt qu'un recalcul hebdomadaire fixe — et c'est gratuit.",
                "Le vrai compromis, c'est discipline contre flexibilité. Le recalcul hebdomadaire de MacroFactor a lieu que tu penses ou non à demander, ce qui te garde honnête ; le modèle conversationnel n'ajuste que lorsque tu le sollicites. Si tu veux un algorithme autonome qui pilote tes chiffres, l'abonnement MacroFactor en vaut la peine. Si tu préfères enregistrer gratuitement et demander une analyse quand ça t'importe, ceci te convient mieux.",
            ],
        },
        importSection: {
            title: "Le journal migre même si le coaching ne suit pas",
            body: [
                "Ce que tu laisserais derrière toi, c'est l'algorithme, pas les données. Demande à importer et un panneau d'importation s'ouvre dans le chat : tu choisis ton export CSV MacroFactor, il est analysé dans ton navigateur, les colonnes reconnues sont associées automatiquement, et tu confirmes un aperçu avant que rien ne soit écrit. Les lignes ne passent jamais par l'IA, donc rien n'est mal retranscrit en chemin.",
                "L'export de MacroFactor est reconnu par son nom — sa colonne de taille de portion en est la signature — et ses colonnes date, aliment, repas, calories et macros s'associent d'elles-mêmes, fibres, sucres totaux et caféine inclus quand le fichier les contient. Si ton export indique l'énergie en kilojoules plutôt qu'en kilocalories, elle est convertie plutôt que stockée 4,184 fois trop haute. Comme une colonne simplement intitulée « Calories » peut contenir l'une ou l'autre unité, l'unité est proposée comme un contrôle à côté d'un exemple concret tiré de ta propre première ligne, pour que tu la confirmes au lieu de faire confiance à une supposition qui gonflerait silencieusement chaque journée.",
                "Cet historique est immédiatement utile, pas seulement archivé. Une fois plusieurs semaines d'apport et de poids importées, tu peux poser la question à laquelle l'algorithme de MacroFactor répondait sur un calendrier fixe — « vu les trois dernières semaines, devrais-je ajuster mes calories ? » — et obtenir une réponse raisonnée à la demande. Un second import du même fichier ne change rien, puisque chaque ligne porte une empreinte de contenu et que les répétitions reviennent signalées comme déjà enregistrées.",
            ],
        },
        importFaq:
            "Oui. Demande à importer et un importateur s'ouvre dans le chat : tu choisis ton export CSV MacroFactor, il est analysé dans ton navigateur plutôt que lu par l'IA, et tu confirmes un aperçu avant que rien ne soit écrit. L'export de MacroFactor est reconnu par son nom — la date, l'aliment, le repas, les calories, protéines, glucides et lipides s'associent d'eux-mêmes, ainsi que les fibres, sucres totaux et caféine quand le fichier les contient — et s'il indique l'énergie en kilojoules, elle est convertie en kilocalories une fois que tu as confirmé l'unité à côté d'un exemple tiré de ton propre fichier. Réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP ajuste mes objectifs de calories comme MacroFactor ?",
                a: "Pas automatiquement. Le recalcul hebdomadaire et algorithmique de MacroFactor est sa fonctionnalité payante centrale. Avec Nutrition MCP, tu demandes — « d'après mes trois dernières semaines d'apport et de poids, devrais-je ajuster mes calories ? » — et ton IA raisonne à la demande, plutôt qu'une mise à jour hebdomadaire fixe.",
            },
            {
                q: "Est-ce que Nutrition MCP est vraiment gratuit alors que MacroFactor est uniquement sur abonnement ?",
                a: "Oui. Nutrition MCP est entièrement gratuit et open source, sans essai-puis-paiement ni limites de forfait gratuit — contrairement à MacroFactor, qui n'a pas de forfait gratuit et exige un abonnement après son essai. Il te faut seulement un compte Claude ou ChatGPT.",
            },
        ],
        freeAnswer:
            "Oui. Nutrition MCP est entièrement gratuit et open source, sans abonnement — alors que MacroFactor exige un abonnement payant après son essai gratuit. Il te faut juste un compte Claude ou ChatGPT pour te connecter.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Pas de serveur MCP. Suis tes repas et macros par conversation — gratuit et open source.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Chercher dans la base de données chaque aliment enregistré",
            "Certaines fonctionnalités, comme les plans de repas, nécessitent le forfait payant PRO",
            "Une app et un compte séparés à gérer",
        ],
        note: "Yazio est un tracker soigné avec de bons plans de repas. Nutrition MCP se concentre sur un enregistrement conversationnel sans effort qui vit dans Claude ou ChatGPT — gratuit et open source.",
        migrate: {
            title: "Les plans d'un côté, l'enregistrement de l'autre",
            body: [
                "Yazio associe le suivi à des plans de repas structurés, des recettes et des outils de jeûne, soignés pour un public européen. Si c'est un plan guidé qui te garde sur la bonne voie, Yazio fait bien ça et Nutrition MCP ne cherche pas à rivaliser — ce n'est pas une app de plans de repas.",
                "Ce qu'il fait, c'est rendre la partie enregistrement sans effort. Plutôt que de chercher chaque ingrédient dans la base de données de Yazio, tu décris le plat et ton IA s'occupe des macros — puis répond à « où j'en suis aujourd'hui ? » dans la foulée. Associe-le au plan alimentaire que tu suis déjà.",
                "Ça rend en fait les deux complémentaires plutôt que concurrents. Continue à suivre un plan Yazio, ou n'importe quel plan, pour le côté « quoi manger » ; utilise Nutrition MCP pour le côté « suis-je resté sur la bonne voie », enregistré par conversation et gratuitement. Le seul endroit où ça n'aide pas, ce sont les minuteurs de jeûne — c'est le territoire de Yazio, pas celui d'un journal nutritionnel.",
            ],
        },
        importSection: {
            title: "Apporte ton journal, associe les colonnes",
            body: [
                "Ton historique Yazio peut être importé, même s'il faudra fournir un peu de travail. Demande à importer et un panneau d'importation s'ouvre dans le chat : tu choisis ton export CSV, il est analysé dans ton navigateur, et tu associes toi-même ses colonnes à la date, l'aliment, le repas, les calories, protéines, glucides, lipides, fibres, sucres totaux et caféine. Les exports de quatre apps — MyFitnessPal, Cronometer, Lose It! et MacroFactor — sont reconnus par le nom de leurs colonnes ; Yazio n'en fait pas partie, attends-toi donc à définir cette association une fois. Tout ce qui suit est identique : un aperçu de ce qui sera ajouté, puis ta confirmation.",
                "Les particularités européennes qui déjouent la plupart des importateurs sont gérées. Un fichier délimité par des points-virgules dont les nombres utilisent la virgule comme séparateur décimal — la forme qu'Excel produit en locale allemande ou autrichienne — est lu correctement, au lieu que le délimiteur soit confondu avec un séparateur décimal ou que chaque macro soit multipliée par mille. Les en-têtes que l'outil d'association connaît ne sont pas non plus uniquement en anglais : le Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker et Koffein d'un export allemand sont tous reconnus, et fibres, sucre et caféine sont aussi reconnus en espagnol, français, italien et néerlandais — fibra, sucres, zuccheri, suikers, cafeína, caffeina — donc un fichier localisé arrive souvent partiellement associé, te laissant moins de colonnes à définir à la main. Les champs entre guillemets, les retours à la ligne dans une cellule, les valeurs quasi-vides et les lignes de totaux égarées sont aussi gérés, et l'IA ne lit jamais le fichier, donc aucun chiffre ne peut être mal saisi en chemin.",
                "Les dates et l'énergie sont confirmées plutôt que devinées. Une colonne au format JJ/MM/AAAA est lue jour en premier, et là où les valeurs ne permettent vraiment pas de trancher — 05/06 étant mai ou juin — l'importateur montre sa lecture à côté d'une ligne de ton propre fichier pour que tu puisses la corriger. Si la colonne d'énergie est en kilojoules, elle est convertie en kilocalories, avec l'unité affichée comme un contrôle à côté d'un exemple concret. Réimporter le même fichier n'ajoute rien : chaque ligne porte une empreinte de contenu, donc les répétitions reviennent comme déjà enregistrées.",
            ],
        },
        importFaq:
            "Oui, avec une association manuelle des colonnes. Demande à importer et un importateur s'ouvre dans le chat : tu choisis ton export CSV Yazio, il est analysé dans ton navigateur plutôt que lu par l'IA, et tu associes toi-même ses colonnes à la date, l'aliment, le repas, les calories et les macros — dont fibres, sucres totaux et caféine. Yazio ne fait pas partie des quatre exports reconnus par le nom de leurs colonnes, cette association est donc une étape manuelle ponctuelle, bien que les en-têtes déjà connus de l'outil (en allemand, et pour fibres, sucre et caféine aussi en espagnol, français, italien et néerlandais) se remplissent d'eux-mêmes. Les fichiers européens délimités par des points-virgules avec virgule décimale, les dates JJ/MM/AAAA et les kilojoules sont tous gérés, et réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP inclut des plans de repas comme Yazio PRO ?",
                a: "Non. Les plans de repas structurés, recettes et outils de jeûne de Yazio sont sa force, et Nutrition MCP ne cherche pas à les remplacer — il s'occupe de la partie enregistrement. Beaucoup de gens continuent à suivre leur plan Yazio (ou tout autre) et se contentent d'enregistrer par rapport à lui ici, gratuitement.",
            },
            {
                q: "Puis-je enregistrer des repas plus vite qu'en cherchant dans la base de données de Yazio ?",
                a: "Généralement, oui. Plutôt que de chercher chaque ingrédient dans la base de données de Yazio et de régler les portions, tu décris le plat fini une seule fois — « un bol de muesli avec du yaourt et des fruits rouges » — et ton IA estime et enregistre les macros en une seule étape.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Pas de serveur MCP. Une façon plus simple et gratuite d'enregistrer tes repas dans Claude ou ChatGPT.",
        cons: [
            "Pas de serveur MCP — impossible de l'utiliser dans Claude ou ChatGPT",
            "Enregistrer les aliments en cherchant dans sa base de données un par un",
            "Certaines fonctionnalités, comme les plans alimentaires, nécessitent un forfait payant",
            "Encore une app et un abonnement à gérer",
        ],
        note: "Lifesum associe le suivi à des plans alimentaires structurés. Nutrition MCP est une façon plus simple et gratuite d'enregistrer calories, macros et poids en parlant à ton IA.",
        migrate: {
            title: "Des notes que tu peux simplement demander",
            body: [
                "Lifesum mise sur la structure et le retour — plans alimentaires, recettes, et son système de notation des aliments qui évalue ce que tu manges. Nutrition MCP ne note pas tes aliments avec un badge, donc si cette boucle de notation est ce qui te motive, Lifesum a un avantage là-dessus.",
                "L'échange, c'est la flexibilité : plutôt qu'une note fixe, tu peux demander à ton IA « est-ce un bon choix pour mes objectifs ? » et obtenir une vraie réponse contextuelle. L'enregistrement tient en une phrase, les tendances et un poids cible sont intégrés d'office, et aucun forfait premium ne verrouille les parties utiles.",
                "Un badge te dit qu'un aliment a obtenu 3 sur 5 ; une conversation te dit pourquoi, et quoi faire — « remplace la moitié du riz par des légumes verts et ça rentre dans ta journée ». C'est la différence entre une note et un coach, et comme Lifesum place les plans alimentaires et une partie du suivi derrière Premium, c'est l'option gratuite des deux.",
            ],
        },
        importSection: {
            title: "Rien à retaper",
            body: [
                "Changer de tracker veut dire déplacer ton historique, et tu n'as pas besoin d'en retaper une seule ligne. Demande à importer et un panneau d'importation s'ouvre dans le chat : tu choisis ton export CSV Lifesum, il est analysé dans ton navigateur, et tu associes ses colonnes à la date, l'aliment, le repas, les calories, protéines, glucides, lipides, fibres, sucres totaux et caféine. Les en-têtes de Lifesum ne sont pas reconnus par leur nom comme ceux de MyFitnessPal, Cronometer, Lose It! et MacroFactor, cette association est donc une étape manuelle ponctuelle — après quoi tu prévisualises ce qui sera ajouté et tu confirmes.",
                "Rien ne se cache derrière une hypothèse. L'outil d'association te montre ton propre fichier — ses vrais en-têtes, ses vraies cellules, et un compte courant des lignes qui seront créées — donc une colonne mal orientée est visible avant que rien ne soit écrit, plutôt que découverte après coup. Les champs entre guillemets, les retours à la ligne dans une cellule, les valeurs quasi-vides et les lignes de totaux sont tous gérés, et comme le fichier est lu dans ton navigateur, l'IA ne voit jamais une ligne qu'elle pourrait mal retranscrire.",
                "Les exports européens sont couverts : un fichier délimité par des points-virgules avec virgule décimale se lit correctement, les dates JJ/MM/AAAA se convertissent une fois l'ordre confirmé, et les kilojoules deviennent des kilocalories avec l'unité affichée à côté d'un exemple concret tiré de ta propre première ligne. Les en-têtes localisés aident aussi — le Kalorien, Kohlenhydrate, Ballaststoffe ou Koffein d'un export allemand se remplit de lui-même, et fibres, sucre et caféine sont aussi reconnus en espagnol, français, italien et néerlandais — donc l'association manuelle est généralement plus courte qu'il n'y paraît. Lance l'import deux fois et rien ne double — chaque ligne porte une empreinte de contenu, donc les répétitions sont signalées comme déjà enregistrées.",
            ],
        },
        importFaq:
            "Oui, avec une association manuelle des colonnes. Demande à importer et un importateur s'ouvre dans le chat : tu choisis ton export CSV Lifesum, il est analysé dans ton navigateur plutôt que lu par l'IA, et tu associes toi-même ses colonnes à la date, l'aliment, le repas et les macros — fibres, sucres totaux et caféine inclus. Lifesum ne fait pas partie des quatre exports reconnus par le nom de leurs colonnes, cette association est donc une étape manuelle ponctuelle, bien que les en-têtes déjà connus de l'outil se remplissent d'eux-mêmes. Les fichiers européens délimités par des points-virgules avec virgule décimale, les dates JJ/MM/AAAA et les kilojoules sont tous gérés, et réimporter le même fichier ne crée jamais de doublons.",
        extraFaqs: [
            {
                q: "Est-ce que Nutrition MCP note mes aliments comme le fait Lifesum ?",
                a: "Non — il n'y a ni badge ni note numérique. Tu peux à la place demander à ton IA « est-ce un bon choix pour mes objectifs ? » et obtenir une réponse contextuelle qui explique les compromis, plutôt qu'une note fixe sur l'aliment lui-même.",
            },
            {
                q: "Est-ce que Nutrition MCP est gratuit sans un forfait type Lifesum Premium ?",
                a: "Oui. Nutrition MCP est entièrement gratuit et open source, sans forfait premium — alors que Lifesum place les plans alimentaires et certaines fonctionnalités de suivi derrière un abonnement Premium. Il te faut seulement un compte Claude ou ChatGPT pour te connecter.",
            },
        ],
    },
};

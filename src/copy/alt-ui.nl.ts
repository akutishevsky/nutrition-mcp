import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_NL: AltUiCopy = {
    breadcrumbHome: "Home",
    breadcrumbAlternatives: "Alternatieven",
    breadcrumbAriaLabel: "Kruimelpad",
    ctaQuickInstall: "Snel installeren",
    ctaClosingTitle: "Houd je voeding bij in de AI die je al gebruikt.",
    disclaimerAppHtml:
        "{app} is een handelsmerk van de betreffende eigenaar. Nutrition MCP is een onafhankelijk opensourceproject en is niet verbonden aan, goedgekeurd door of gesponsord door {app}. Vergelijkingen zijn gebaseerd op openbaar beschikbare informatie op het moment van schrijven en kunnen veranderen.",
    disclaimerHubHtml:
        "{apps} en andere productnamen zijn handelsmerken van hun respectieve eigenaren. Nutrition MCP is een onafhankelijk opensourceproject en is niet aan hen verbonden of door hen goedgekeurd. Vergelijkingen zijn gebaseerd op openbaar beschikbare informatie op het moment van schrijven en kunnen veranderen.",

    app: {
        heroEyebrow: "{app}-alternatief",
        heroTitleHtml: "Op zoek naar een <em>{app} MCP</em>-server?",
        heroLead:
            "{app} biedt er geen aan die je kunt koppelen, dus vanuit Claude of ChatGPT kun je niets loggen in je {app}-dagboek. Nutrition MCP doet hetzelfde via een gesprek en is gratis en open source.",
        ctaConnect: "Binnen een minuut verbonden",
        ctaSeeComparison: "Bekijk de vergelijking",

        answerEyebrow: "Het korte antwoord",
        answerTitle: "Nee, {app} heeft geen officiële, openbare MCP-server.",
        answerBodyHtml:
            "Het Model Context Protocol (MCP) is de open standaard waarmee AI-assistenten zoals Claude en ChatGPT verbinding maken met externe tools. {app} biedt geen openbare MCP-server aan, dus er is geen officiële manier om vanuit je AI eten te loggen in je {app}-dagboek. Zocht je op &ldquo;{app} MCP&rdquo; of &ldquo;{app} verbinden met Claude&rdquo;, dan zoek je eigenlijk een voedingstracker die <em>in</em> je AI zit. Dat is precies wat Nutrition MCP is.",

        insteadEyebrow: "Wat je in plaats daarvan krijgt",
        insteadTitle: "Hetzelfde bijhouden, gewoon door te praten",
        features: [
            {
                title: "Maaltijden in gewone taal",
                body: "Zeg &ldquo;havermout met banaan en pindakaas&rdquo; en je AI logt de calorieën en macro's, inclusief vezels, totale suikers, cafeïne, verzadigd vet en transvet. Generieke voedingsmiddelen krijgen hun waarden uit USDA FoodData Central als die er is, en schattingen dekken de rest; elk getal toont waar het vandaan komt. Log een maaltijd per ingrediënt, of bewaar maaltijden die je vaak eet en log ze daarna op naam.",
            },
            {
                title: "Gratis barcodes scannen",
                body: "Stuur de barcode van een product en haal de macro's van het etiket op bij Open Food Facts, ook vezels en suiker als die op het etiket staan. Gratis voor iedereen, zonder abonnement.",
            },
            {
                title: "Gewicht &amp; doelen",
                body: "Log je lichaamsgewicht in kg of lb en omtrekmaten van negen lichaamsdelen in cm of inch, en stel doelen in voor calorieën, macro's, verzadigd vet, vezels, suiker, cafeïne en water: voor vezels een streefwaarde om te halen, voor verzadigd vet, suiker en cafeïne een limiet om onder te blijven. Volg daarnaast trends richting een streefgewicht. Alcoholregistratie is er ook, als opt-in: die staat uit tot je die zelf aanzet.",
            },
            {
                title: "Overzichten &amp; trends",
                body: "Vraag om dagtotalen, weektrends, reeksen en terugkerende maaltijdpatronen, direct in de chat.",
            },
            {
                title: "Importeer je gegevens en houd ze in eigen hand",
                body: "Importeer je maaltijdgeschiedenis uit de CSV-export van een andere app; je browser verwerkt het bestand, niet de AI. Haal alles weer op wanneer je wilt: één ZIP-bestand met je maaltijden, opgeslagen maaltijden, water, gewicht, lichaamsmaten, doelen en profiel, plus je accountgegevens, gebruikstelemetrie en gekoppelde apps, als CSV-bestanden. Voorlopig kun je alleen maaltijden weer importeren. Of verwijder je account, net zo makkelijk.",
            },
            {
                title: "Open source &amp; gratis",
                body: "Met MIT-licentie en zelf te hosten: geen advertenties, geen betaalmuur, geen opgedrongen upgrades. Controleer de code of draai je eigen instantie.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        otherComparisonsLabel: "Ook vergeleken:",
        compareTitle: "Zo verhouden ze zich",
        pros: [
            "Gebouwd als MCP-server, dus het zit direct in Claude &amp; ChatGPT",
            "Je omschrijft maaltijden in gewone taal; USDA-waarden voor generieke voedingsmiddelen, schattingen voor de rest, elk getal met zijn bron; bewaar je vaste maaltijden en log ze in één zin",
            "Barcode scannen, trends, CSV-import &amp; -export: allemaal gratis",
            "Geen aparte app, geen advertenties, open source",
        ],

        movingEyebrow: "Overstappen van {app}",

        importEyebrow: "Je {app}-geschiedenis",
        importSub:
            "Vraag om te importeren en er opent meteen een importvenster in de chat: kies je export, koppel de kolommen, bekijk wat er wordt toegevoegd en bevestig. Je browser leest het bestand; de AI krijgt de rijen nooit te zien. In clients zonder panelen in de chat plak je je export.",

        switchEyebrow: "Zo stap je over",
        switchSub:
            "Werkt met elke MCP-client die OAuth 2.0 met PKCE ondersteunt. Bij de eerste verbinding maak je een account aan met Google of met een e-mailadres en wachtwoord.",
        installSteps: [
            'Open <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP in de Claude-directory</a>.',
            "Klik op <strong>Connect</strong> en log in met Google of met een e-mailadres en wachtwoord.",
            "Begin met loggen: zeg gewoon wat je hebt gegeten.",
        ],
        installNoteTemplate:
            "Gebruik je ChatGPT of een andere client? De {link} beschrijft ook ChatGPT, Cursor, VS Code, Claude Code en meer.",
        installLinkText: "volledige installatiehandleiding",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Vragen over {app} &amp; MCP",
        faq: {
            mcpQ: "Heeft {app} een MCP-server?",
            mcpA: "Niet officieel. {app} biedt geen openbare Model Context Protocol (MCP)-server aan, dus er is geen officiële manier om vanuit Claude, ChatGPT of andere MCP-clients in je {app}-dagboek te loggen. Er bestaan wel enkele onofficiële servers die door de community zijn gebouwd; die zijn niet van {app} en worden er ook niet door ondersteund. Nutrition MCP is anders: een gratis, open source tracker die vanaf het begin als MCP-server is gebouwd, met een eigen account, en die je CSV-export van {app} kan importeren.",
            connectQ: "Hoe verbind ik {app} met Claude?",
            connectA:
                "Er is geen officiële {app}-connector voor Claude, omdat {app} geen openbare MCP-server aanbiedt. Een optie is Nutrition MCP, een gratis MCP-server in de Claude-directory: open hem via https://claude.ai/directory/nutrition-mcp, klik op Connect, log in en begin met loggen via een gesprek.",
            goodAltQ: "Is Nutrition MCP een goed {app}-alternatief?",
            goodAltA:
                "Ja, als je calorieën, macro's (inclusief vezels, totale suikers, cafeïne, verzadigd vet en transvet), water en gewicht wilt bijhouden zonder een aparte app te openen of door een voedingsdagboek te scrollen. Je omschrijft in gewone taal wat je hebt gegeten, stuurt een foto of scant een barcode, en je AI logt het. Generieke voedingsmiddelen gebruiken waarden uit USDA FoodData Central als die er zijn, verpakte producten komen via de barcode van Open Food Facts, en schattingen dekken de rest. Volledig gratis en open source.",
            importQ: "Kan ik mijn {app}-gegevens importeren?",
            readExportQ: "Leest de AI mijn exportbestand als ik importeer?",
            readExportA:
                "Niet als de importer opent. Die verwerkt de CSV in je browser en laat je zien wat er wordt toegevoegd voordat er iets wordt opgeslagen: hoeveel maaltijden, het totaal aan calorieën, alles wat gemarkeerd moest worden en de rijen zelf. Bij een lang bestand zie je de eerste rijen plus het aantal overige, niet elke rij. Alleen de rijen die je bevestigt worden verstuurd, en wel als gestructureerde gegevens in plaats van via het antwoord van de AI, dus onderweg kan geen rij verkeerd worden overgetypt of verzonnen. Elke rij krijgt ook een vingerafdruk op basis van de inhoud: importeer je hetzelfde bestand nog eens, dan worden die maaltijden gemeld als al gelogd in plaats van dubbel toegevoegd, zolang je tijdzone intussen niet is veranderd. Kan je client geen panelen in de chat tonen, dan kun je de export plakken. Op die manier leest de AI hem wel, dus kies de importer als je de keuze hebt.",
            freeQ: "Is Nutrition MCP gratis?",
            freeAFallback:
                "Ja. Nutrition MCP is volledig gratis, zonder premiumversie, advertenties of functies achter een betaalmuur, anders dan apps die sommige functies achter een abonnement zetten. Je hebt een AI-app nodig die MCP ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je bij je eerste verbinding aanmaakt met Google of met een e-mailadres en wachtwoord.",
        },
        importFallbackNote:
            " In clients zonder panelen in de chat kun je je export plakken.",

        ctaClosingSub:
            "Gratis en open source. Geen {app}-account, geen app om te openen.",
        ctaOtherAlternatives: "Andere alternatieven",
    },

    hub: {
        heroEyebrow: "MCP-alternatieven",
        heroTitleHtml:
            "Jouw voedingsapp heeft geen officiële <em>MCP-server</em>.",
        heroLead:
            "Apps zoals MyFitnessPal, Cronometer en Lose It! bieden geen officiële manier om je dagboek bij te houden vanuit Claude of ChatGPT. Nutrition MCP is een gratis, open source manier om maaltijden, macro's en gewicht bij te houden door met je AI te praten. Je bestaande geschiedenis importeer je gewoon mee.",
        ctaSeeExamples: "Bekijk voorbeelden",

        appsEyebrow: "Overstappen van…",
        appsTitle: "Kies je huidige app",
        appsSub:
            "Bekijk hoe Nutrition MCP zich verhoudt tot de tracker die je nu gebruikt, en hoe je het loggen én je bestaande geschiedenis naar je AI verhuist.",
        noAppNote:
            "Staat je app er niet tussen? De meeste voedingsapps bieden ook geen officiële MCP-server. Nutrition MCP werkt hetzelfde, van welke app je ook overstapt.",
        requestComparisonLinkText: "Vraag een vergelijking aan",

        importEyebrow: "Je geschiedenis meenemen",
        importTitle: "Je hoeft niet bij nul te beginnen",
        importSub:
            "Wat mensen meestal tegenhoudt, zijn de jaren die ze al hebben gelogd. Vraag om te importeren en er opent meteen een importvenster in de chat: kies je export, koppel de kolommen, bekijk wat er wordt toegevoegd en bevestig. Of plak de export als je client geen panelen in de chat heeft.",
        importBody: [
            "Je browser verwerkt het bestand; de AI leest het niet. Daardoor kunnen de rijen onderweg niet verkeerd worden overgetypt, en zie je precies welke maaltijden erin gaan voordat er iets wordt opgeslagen. Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden herkend aan hun kolomnamen. Elke andere CSV werkt ook: je wijst dan in het koppelscherm één keer elke kolom aan. Wat er meegaat: datum en tijd, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne in milligram, plus verzadigd vet en transvet waar het bestand die bevat, en ook alcohol als je eerst alcoholregistratie hebt aangezet.",
            "Ook de lastige kanten van echte exportbestanden worden opgevangen: datums als DD/MM/JJJJ en MM/DD/JJJJ, energie in kilojoules naast kilocalorieën, Europese bestanden met puntkomma's als scheidingsteken en een komma als decimaalteken, velden tussen aanhalingstekens met regeleinden erin, totaalrijen aan het eind en markeringen voor verwijderde rijen. Kolomkoppen hoeven ook niet Engels te zijn: Kalorien of Ballaststoffe uit een Duitse export worden herkend, en vezels, suiker en cafeïne ook in het Spaans, Frans, Italiaans en Nederlands. Is een bestand echt dubbelzinnig (05/06 kan mei of juni zijn), dan laat de importer zijn interpretatie zien naast een rij uit je eigen bestand en vraagt hij je te bevestigen in plaats van te gokken. En elke rij krijgt een vingerafdruk op basis van de inhoud: importeer je hetzelfde bestand opnieuw, dan worden de maaltijden gemeld als al gelogd in plaats van dubbel toegevoegd, zolang je tijdzone intussen niet is veranderd.",
        ],

        ctaSub: "Gratis en open source. Werkt met Claude, ChatGPT en elke MCP-client.",
        ctaStarGithub: "Geef een ster op GitHub",
    },
};

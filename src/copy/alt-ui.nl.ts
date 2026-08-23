import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_NL: AltUiCopy = {
    breadcrumbHome: "Home",
    breadcrumbAlternatives: "Alternatieven",
    ctaQuickInstall: "Snel installeren",
    ctaClosingTitle: "Houd je voeding bij in de AI die je al gebruikt.",
    disclaimerAppHtml:
        "{app} is een handelsmerk van de betreffende eigenaar. Nutrition MCP is een onafhankelijk open source-project en is niet verbonden aan, goedgekeurd door, of gesponsord door {app}. Vergelijkingen zijn gebaseerd op publiek beschikbare informatie op het moment van schrijven en kunnen veranderen.",
    disclaimerHubHtml:
        "{apps} en andere productnamen zijn handelsmerken van hun respectievelijke eigenaars. Nutrition MCP is een onafhankelijk open source-project en is niet verbonden aan of goedgekeurd door hen. Vergelijkingen zijn gebaseerd op publiek beschikbare informatie op het moment van schrijven en kunnen veranderen.",

    app: {
        heroEyebrow: "{app}-alternatief",
        heroTitleHtml: "Op zoek naar een <em>{app} MCP</em>-server?",
        heroLead:
            "{app} heeft die niet — dus je kunt het niet gebruiken binnen Claude of ChatGPT. Nutrition MCP doet hetzelfde via een gesprek, en het is gratis en open source.",
        ctaConnect: "Verbind binnen een minuut",
        ctaSeeComparison: "Bekijk de vergelijking",

        answerEyebrow: "Het korte antwoord",
        answerTitle: "Nee, {app} heeft geen MCP-server.",
        answerBodyHtml:
            "Het Model Context Protocol (MCP) is de open standaard waarmee AI-assistenten zoals Claude en ChatGPT verbinding kunnen maken met externe tools. {app} publiceert geen MCP-server, dus er is geen officiële manier om er vanuit je AI eten in te loggen. Als je zocht op &ldquo;{app} MCP&rdquo; of &ldquo;{app} verbinden met Claude,&rdquo; ben je eigenlijk op zoek naar een voedingstracker die <em>binnen</em> je AI leeft — dat is precies wat Nutrition MCP is.",

        insteadEyebrow: "Wat je in plaats daarvan krijgt",
        insteadTitle: "Dezelfde tracking, gewoon door te praten",
        features: [
            {
                title: "Maaltijden in gewone taal",
                body: "Zeg &ldquo;havermout met banaan en pindakaas&rdquo; — je AI schat de calorieën en macro's, vezels, totale suikers en cafeïne inbegrepen, en logt het. Geen database om te doorzoeken.",
            },
            {
                title: "Barcode scannen — gratis",
                body: "Stuur de barcode van een product en haal de labelmacro's op bij Open Food Facts — vezels en suiker ook, waar het label die vermeldt. Geen Premium-abonnement nodig om het te ontgrendelen.",
            },
            {
                title: "Gewicht &amp; doelen",
                body: "Log je lichaamsgewicht in kg of lb, stel doelen in voor calorieën, macro's, vezels, suiker, cafeïne en water — vezels een streefwaarde om te halen, suiker en cafeïne limieten om onder te blijven — en volg trends richting een streefgewicht. Alcoholregistratie is er ook, opt-in en standaard uit tenzij je het aanzet.",
            },
            {
                title: "Overzichten &amp; trends",
                body: "Vraag om dagelijkse totalen, wekelijkse trends, reeksen en terugkerende maaltijdpatronen — gewoon in de chat.",
            },
            {
                title: "Importeer &amp; behoud eigenaarschap van je gegevens",
                body: "Importeer je maaltijdgeschiedenis uit de CSV-export van een andere app — verwerkt in je browser, niet door de AI. Haal alles weer op wanneer je maar wilt: één ZIP met je maaltijden, water, gewicht, doelen en profiel als CSV-bestanden. Maaltijden zijn voorlopig het enige onderdeel dat je weer kunt importeren. Of verwijder je account, net zo eenvoudig.",
            },
            {
                title: "Open source &amp; gratis",
                body: "MIT-gelicentieerd en zelf te hosten — geen advertenties, geen betaalmuur, geen upsell. Controleer de code, of host je eigen instantie.",
            },
        ],

        compareEyebrow: "{app} vs. Nutrition MCP",
        compareTitle: "Hoe ze zich verhouden",
        pros: [
            "Gebouwd als MCP-server — werkt binnen Claude &amp; ChatGPT",
            "Omschrijf maaltijden in gewone taal; calorieën, macro's, vezels, suiker &amp; cafeïne worden voor je geschat",
            "Barcode scannen, trends, CSV-import &amp; -export — allemaal gratis",
            "Geen aparte app, geen advertenties, open source",
        ],

        movingEyebrow: "Overstappen van {app}",

        importEyebrow: "Je {app}-geschiedenis",
        importSub:
            "Vraag om te importeren en er opent direct een importvenster in de chat: kies je export, koppel de kolommen, bekijk een preview van wat wordt toegevoegd en bevestig. Het bestand wordt in je browser gelezen — de AI ziet de regels nooit. In clients zonder in-chat-panelen plak je je export in plaats daarvan.",

        switchEyebrow: "Hoe je overstapt",
        switchSub:
            "Werkt met elke MCP-client die OAuth 2.0 met PKCE ondersteunt. Bij de eerste verbinding maak je een account aan met Google of een e-mailadres en wachtwoord.",
        installSteps: [
            "Open <strong>Claude</strong> (web of desktop) en klik op <strong>Customize</strong> → <strong>Connectors</strong>.",
            "Klik op <strong>+</strong>, daarna op <strong>Add custom connector</strong>, en geef het een naam zoals <strong>Nutrition</strong>.",
            "Plak {copyUrl} in het veld <strong>Remote MCP server URL</strong> en klik op <strong>Add</strong>.",
            "Klik op <strong>Connect</strong>, log in, en begin met loggen door te zeggen wat je hebt gegeten.",
        ],
        installNoteTemplate:
            "Gebruik je liever ChatGPT of een andere client? De {link} behandelt ChatGPT, Cursor, VS Code, Claude Code en meer.",
        installLinkText: "volledige installatiehandleiding",
        copyUrlAriaLabel: "Serverlink kopiëren",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "{app} &amp; MCP-vragen",
        faq: {
            mcpQ: "Heeft {app} een MCP-server?",
            mcpA: "Nee. {app} biedt geen Model Context Protocol (MCP)-server aan, dus er is geen officiële manier om het te verbinden met Claude, ChatGPT of andere AI-assistenten. Nutrition MCP is een gratis, open source alternatief dat vanaf de grond af is gebouwd als MCP-server, zodat je maaltijden en macro's rechtstreeks in je AI kunt loggen.",
            connectQ: "Hoe verbind ik {app} met Claude?",
            connectA:
                "Er is geen officiële {app}-connector voor Claude, omdat {app} geen MCP-server of publieke MCP-integratie heeft. De dichtstbijzijnde optie is Nutrition MCP, een gratis MCP-server: voeg https://nutrition-mcp.com/mcp toe als custom connector in Claude, log in, en begin met loggen via een gesprek.",
            goodAltQ: "Is Nutrition MCP een goed {app}-alternatief?",
            goodAltA:
                "Als je calorieën, macro's — vezels, totale suikers en cafeïne inbegrepen — water en gewicht wilt bijhouden zonder een aparte app te openen of een voedseldatabase te doorzoeken, dan wel. In plaats van door een database te tikken, omschrijf je in gewone taal wat je hebt gegeten, stuur je een foto, of scan je een barcode, en je AI logt het — volledig gratis en open source.",
            importQ: "Kan ik mijn {app}-gegevens importeren?",
            readExportQ: "Leest de AI mijn exportbestand wanneer ik importeer?",
            readExportA:
                "Niet wanneer de importer opent. Die verwerkt de CSV in je browser en laat je zien wat wordt toegevoegd voordat er iets wordt geschreven: hoeveel maaltijden, het caloriegetal, alles wat gemarkeerd moest worden, en de regels zelf — bij een lang bestand worden de eerste getoond plus een telling van de rest, in plaats van elke regel. Alleen de regels die je bevestigt worden verzonden, en die gaan als gestructureerde gegevens in plaats van via het antwoord van de AI, dus er kan onderweg geen regel verkeerd worden overgetypt of verzonnen. Elke regel draagt ook een inhoudelijke vingerafdruk, dus dezelfde import nogmaals uitvoeren meldt die maaltijden als al gelogd in plaats van ze te dupliceren. Als je client geen in-chat-panelen kan tonen, is het alternatief om de export te plakken — op dat pad leest de AI het wel, dus geef de voorkeur aan de importer wanneer je de keuze hebt.",
            freeQ: "Is Nutrition MCP gratis?",
            freeAFallback:
                "Ja. Nutrition MCP is volledig gratis, zonder premium-laag, advertenties of functies achter een betaalmuur — in tegenstelling tot apps die sommige functies achter een abonnement plaatsen. Je hebt alleen een Claude- of ChatGPT-account nodig om te verbinden.",
        },
        importFallbackNote:
            " In clients zonder in-chat-panelen kun je in plaats daarvan je export plakken.",

        ctaClosingSub:
            "Gratis en open source — geen {app}-account, geen app om te openen.",
        ctaOtherAlternatives: "Andere alternatieven",
    },

    hub: {
        heroEyebrow: "MCP-alternatieven",
        heroTitleHtml: "Jouw voedingsapp heeft geen <em>MCP-server</em>.",
        heroLead:
            "Apps zoals MyFitnessPal, Cronometer en Lose It kunnen geen verbinding maken met Claude of ChatGPT. Nutrition MCP is de gratis, open source manier om maaltijden, macro's en gewicht bij te houden door met je AI te praten.",
        ctaSeeExamples: "Bekijk voorbeelden",

        appsEyebrow: "Overstappen van…",
        appsTitle: "Kies je huidige app",
        appsSub:
            "Bekijk hoe Nutrition MCP zich verhoudt tot de tracker die je nu gebruikt — en hoe je je loggen, en je bestaande geschiedenis, naar je AI overbrengt.",
        noAppNote:
            "Zie je je app niet? Die heeft vrijwel zeker ook geen MCP-server — Nutrition MCP werkt op dezelfde manier, ongeacht waar je vandaan overstapt.",
        requestComparisonLinkText: "Vraag een vergelijking aan",

        importEyebrow: "Je geschiedenis meenemen",
        importTitle: "Je hoeft niet bij nul te beginnen",
        importSub:
            "De gebruikelijke reden dat mensen blijven, zijn de jaren die al gelogd zijn. Vraag om te importeren en er opent direct een importvenster in de chat: kies je export, koppel de kolommen, bekijk een preview van wat wordt toegevoegd, en bevestig — of plak de export als je client geen in-chat-panelen heeft.",
        importBody: [
            "Het bestand wordt in je browser verwerkt, niet gelezen door de AI — dus de regels kunnen onderweg niet verkeerd worden overgetypt, en je ziet de exacte maaltijden voordat er iets wordt geschreven. Exports van MyFitnessPal, Cronometer, Lose It! en MacroFactor worden op kolomnaam herkend; elke andere CSV werkt ook, je wijst de koppelaar dan gewoon één keer naar elke kolom. Wat overkomt is de datum en tijd, het voedsel, de maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne in milligram — en ook alcohol, als je alcoholregistratie eerst hebt aangezet.",
            "De lastige kanten van echte exportbestanden worden opgevangen: datums in DD/MM/JJJJ en MM/DD/JJJJ, energie in kilojoules naast kilocalorieën, met puntkomma's gescheiden Europese bestanden waarvan de getallen een komma als decimaalteken gebruiken, aangehaalde velden met regeleinden erin, afsluitende totaalregels, en verwijderd-vlaggen. Kolomkoppen hoeven ook niet Engelstalig te zijn — de Kalorien of Ballaststoffe van een Duitse export worden herkend, en vezels, suiker en cafeïne worden ook herkend in het Spaans, Frans, Italiaans en Nederlands. Waar een bestand oprecht dubbelzinnig is — 05/06 kan mei of juni zijn — laat de importer zijn interpretatie zien naast een regel uit je eigen bestand en vraagt je te bevestigen in plaats van te gokken. En elke regel draagt een inhoudelijke vingerafdruk, dus hetzelfde bestand opnieuw importeren meldt de maaltijden als al gelogd in plaats van ze te dupliceren.",
        ],

        ctaSub: "Gratis en open source — het werkt met Claude, ChatGPT en elke MCP-client.",
        ctaStarGithub: "Star op GitHub",
    },
};

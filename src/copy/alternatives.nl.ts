// Dutch (nl) translation of the /alternatives comparison pages' prose.
// See src/copy/alternatives.ts for AppSlug / AppCopy and the accuracy
// rules in scripts/gen-alternatives.ts's APPS array (which app names are
// recognised by column name, which need manual mapping, Cronometer's
// caffeine column, etc.) that still apply to this content.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_NL: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Geen MCP-server, en sommige functies vereisen een betaald abonnement. Bekijk het gratis, conversationele alternatief.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Doorzoek een database en kies voor elk item de juiste vermelding",
            "Sommige functies, zoals de barcodescanner, vereisen een betaald abonnement",
            "Een aparte app en account, met advertenties in de gratis versie",
        ],
        note: "MyFitnessPal is een capabele app met een enorme voedseldatabase. Dit is geen kritiek erop — het is gewoon een andere aanpak voor wie liever met zijn AI praat dan door een tracker tikt.",
        migrate: {
            title: "De database achter je laten",
            body: [
                "MyFitnessPal bouwde zijn aanhang op een van de grootste voedseldatabases die er zijn — tientallen miljoenen door gebruikers aangeleverde vermeldingen. Die schaal is ook de wrijving: voor elk voedingsmiddel scrol je langs bijna-identieke vermeldingen en moet je gokken welke klopt. Conversationeel loggen slaat het opzoeken helemaal over — je omschrijft het eten en je AI schat de macro's.",
                "Je hoeft je dagboek daarvoor niet achter te laten: een CSV-export van MyFitnessPal wordt direct geïmporteerd, eigenaardigheden en al, dus de jaren die je al hebt gelogd gaan mee. Alles wat je vanaf dan vastlegt, kun je zelf op elk moment weer als CSV exporteren.",
                "De functies die MyFitnessPal geleidelijk achter Premium plaatste — barcode scannen, macro's per gram, geen advertenties — zijn hier gewoon inbegrepen. Je weegt geen gratis versie af tegen een upgrade van $20 per maand; er is één gratis, opensource-niveau, en het enige account dat je nodig hebt is het Claude- of ChatGPT-account dat je al hebt.",
            ],
        },
        importSection: {
            title: "Neem je dagboek mee",
            body: [
                "Jaren aan gelogde geschiedenis zijn de echte reden dat mensen blijven, en die hoef je niet op te geven. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die MyFitnessPal exporteert, die wordt in je browser verwerkt, de kolommen die worden herkend worden voor je gekoppeld, en je ziet wat er wordt toegevoegd voordat er iets wordt geschreven. Die koppeling omvat calorieën, eiwit, koolhydraten en vet, plus vezels, totale suikers en cafeïne in milligram waar je export die kolommen bevat. De regels gaan nooit door de AI, dus die kan niets verkeerd overtypen.",
                "Een MyFitnessPal-export wordt op naam herkend, eigenaardigheden inbegrepen. Het bestand komt binnen met een byte-order mark die anders de eerste kolomkop zou beschadigen; de notities kunnen regeleinden bevatten binnen een aangehaalde cel, wat naïef opsplitsen per regel zou versnipperen samen met elke volgende regel; en elk dagblok eindigt met een totaalregel die geen maaltijd mag worden. Het belangrijkste: MyFitnessPal exporteert één samengevoegde regel per maaltijd per dag en helemaal geen kolom met een voedselnaam, dus in plaats van die regels af te wijzen omdat er geen omschrijving is, herkent de importer de vorm en labelt ze naar hun tijdslot — ze komen binnen als “Breakfast (imported from MyFitnessPal)”.",
                "Datums worden bevestigd, niet aangenomen. Een kolom met 05/06/2024 is oprecht niet te bepalen — mei of juni — dus de importer laat je zijn interpretatie zien naast een echte regel uit je eigen bestand en laat je die corrigeren voordat er iets wordt geschreven. En elke regel draagt een inhoudelijke vingerafdruk, dus hetzelfde bestand opnieuw uitvoeren meldt die maaltijden als al gelogd in plaats van ze te dupliceren. Importeer een gedeeltelijke export, ontdek een kolom die je verkeerd hebt gekoppeld, en doe het gewoon opnieuw.",
            ],
        },
        importFaq:
            "Ja. Vraag om je geschiedenis te importeren en er opent een importvenster in de chat: je kiest de CSV die MyFitnessPal exporteert, die wordt in je browser verwerkt in plaats van door de AI gelezen, je koppelt of bevestigt de kolommen, bekijkt een preview van wat wordt toegevoegd en bevestigt. Calorieën, eiwit, koolhydraten en vet komen over, en vezels, totale suikers en cafeïne ook wanneer je export die bevat. De export van MyFitnessPal wordt op naam herkend — inclusief de byte-order mark, de afsluitende totaalregels, en het feit dat er één samengevoegde regel per maaltijd per dag wordt geschreven zonder voedselnaam, die naar tijdslot worden gelabeld. Hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Kan Nutrition MCP barcodes scannen zoals MyFitnessPal Premium?",
                a: "Ja, en het is gratis. Stuur de barcode van een product en Nutrition MCP haalt de labelmacro's op bij Open Food Facts — terwijl MyFitnessPal zijn barcodescanner achter een betaald Premium-abonnement heeft geplaatst.",
            },
            {
                q: "Hoe werkt loggen zonder de voedseldatabase van MyFitnessPal?",
                a: "Je omschrijft in gewone taal wat je hebt gegeten — “een kip-burritobowl met extra rijst” — en je AI schat de calorieën en macro's. Er is geen database met miljoenen door gebruikers aangeleverde vermeldingen om te doorzoeken en je hoeft niet te gokken welke klopt.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Geen MCP-server. Bekijk de gratis, conversationele manier om calorieën en macro's bij te houden in je AI.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Log door zijn database te doorzoeken, vermelding voor vermelding",
            "Sommige functies vereisen een betaald Gold-abonnement",
            "Een aparte app om te openen bij elke maaltijd",
        ],
        note: "Cronometer is uitstekend als je diepgaande micronutriëntprecisie wilt. Nutrition MCP kiest voor een lichtere, conversationele aanpak van calorieën, macro's en gewicht — rechtstreeks in je AI.",
        migrate: {
            title: "Als precisie het hele punt is",
            body: [
                "Cronometer verdiende zijn reputatie met precisie — samengestelde databases en tracking voor 80+ micronutriënten, vitamines en mineralen inbegrepen. Als die micronutriëntdiepte de reden is dat je het opent, wees dan eerlijk tegen jezelf: conversationele schattingen evenaren geen labwaardige database-vermelding gram voor gram.",
                "Maar de meeste mensen loggen om calorieën en macro's binnen bereik te houden, niet om hun seleniuminname te controleren. Dat bereik is breder dan het klinkt: naast eiwit, koolhydraten en vet krijg je vezels, totale suikers en cafeïne in milligram, en optioneel alcohol in gram ethanol als je dat aanzet. Daarvoor is een maaltijd omschrijven aan je AI veel minder werk dan elk onderdeel opzoeken en wegen — en je krijgt nog steeds dagelijkse totalen, trends en een streefgewicht om naartoe te werken, gratis.",
                "Er is ook een tussenweg: omdat je in een AI-assistent zit, kun je om de micronutriëntkant vragen wanneer je die echt wilt — “ongeveer hoeveel ijzer en B12 zat er in de maaltijden van vandaag?” — en op verzoek een onderbouwde schatting krijgen, zonder de overhead om elke keer elke gram naar een samengestelde vermelding te loggen.",
            ],
        },
        importSection: {
            title: "Tien jaar aan registraties, behouden",
            body: [
                "Precisie is de reden dat je Cronometer gebruikte, dus een slordige import zou erger zijn dan geen import. Vraag om te importeren en er opent een venster in de chat: je kiest je Cronometer-CSV, die wordt in je browser verwerkt, en je keurt een preview goed voordat er ook maar één regel wordt geschreven. De cijfers worden rechtstreeks uit het bestand gelezen — de AI ziet de regels nooit, dus die kan er geen afronden of verkeerd overtypen.",
                "De exportvorm van Cronometer wordt op naam herkend. De tijdstempel wordt gesplitst over aparte datum- en tijdkolommen, en beide worden gelezen, dus een ontbijt gelogd om 07:12 behoudt zijn tijd in plaats van op een standaard middaguur te belanden. De hoeveelheid wordt met de eenheid in dezelfde cel geschreven — “58,00 g”, “1,00 cup” — en zo'n waarde wordt nog steeds gelezen als het cijfer dat het is, in plaats van als niets. En de kop “Amount” komt meer dan eens voor, dus kolommen worden op positie gekoppeld in plaats van op naam: de duplicaten kunnen niet stilletjes botsen, en de koppelaar laat zien naar welke je precies wijst.",
                "Wees duidelijk over wat overkomt: de datum en tijd, voedselnaam, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, cafeïne en notities. Cronometer is de enige export in dit rijtje met een kolom Caffeine (mg), en die komt binnen als milligram — de eenheid waarin het al staat, en waarin cafeïne hier wordt opgeslagen, dus er wordt niets omgerekend. Een cafeïnekolom die in gram staat, wordt juist niet gekoppeld, met de reden erbij, in plaats van 0,18 vast te leggen waar het label 180 mg zegt. Suiker betekent totale suikers, fruit en zuivel inbegrepen — niet toegevoegde suiker, die geen enkele export betrouwbaar bevat. De aparte kolom “Sugar Alcohols” van Cronometer is een polyol in plaats van een suiker of een ethanol, en kan in geen van beide velden terechtkomen. Alcohol is een bijzonder geval: Cronometer exporteert het als ethylalcohol in gram, en het komt alleen over als je hier eerst alcoholregistratie hebt aangezet, want die staat standaard uit. Portiehoeveelheden en Cronometers 80-plus vitamines en mineralen komen helemaal niet over — die micronutriëntdiepte blijft in Cronometers eigen export. Opnieuw importeren is onschadelijk: elke regel draagt een inhoudelijke vingerafdruk, dus een tweede keer uitvoeren van hetzelfde bestand meldt de maaltijden als al gelogd in plaats van ze twee keer toe te voegen.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest je Cronometer-CSV, die wordt in je browser verwerkt in plaats van door de AI gelezen, en je bekijkt een preview van wat wordt toegevoegd voordat je bevestigt. De export van Cronometer wordt op naam herkend — de aparte datum- en tijdkolommen worden beide gelezen, en de herhaalde kop “Amount” kan niet botsen omdat kolommen op positie worden gekoppeld. De datum en tijd, voedselnaam, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers in gram, cafeïne in milligram en notities komen over; alcohol ook, maar alleen als je alcoholregistratie eerst hebt aangezet. Vitamines, mineralen en portiehoeveelheden niet. Hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Houdt Nutrition MCP micronutriënten bij zoals Cronometer?",
                a: "Nee. De tracking van 80+ vitamines en mineralen door Cronometer is zijn specialiteit, en Nutrition MCP heeft helemaal geen micronutriëntgegevens — geen natrium, geen vitamines. Wat het wel bijhoudt zijn calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, cafeïne in milligram, optioneel alcohol, water en gewicht. Je kunt je AI nog steeds om een ruwe micronutriëntinschatting van een maaltijd vragen, maar als labwaardige micronutriëntdiepte essentieel is, past Cronometer beter.",
            },
            {
                q: "Is Nutrition MCP net zo nauwkeurig als Cronometer?",
                a: "Voor calorieën, macro's, vezels en suiker zijn conversationele schattingen voor de meeste doelen precies genoeg — maar ze evenaren niet Cronometers samengestelde database, gram voor gram. Het ruilt een beetje precisie in voor veel minder loginspanning, wat voor de meeste mensen de juiste ruil is.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Geen MCP-server. Log maaltijden door met Claude of ChatGPT te praten — gratis.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Zoek en log elk item met de hand",
            "Sommige functies, zoals foto's loggen, vereisen een betaald abonnement",
            "Weer een app, weer een account, advertenties in de gratis versie",
        ],
        note: "Lose It! is een vriendelijke calorieënteller. Nutrition MCP doet hetzelfde kernwerk van loggen via een gesprek, gratis, zonder Claude of ChatGPT ooit te verlaten.",
        migrate: {
            title: "Dezelfde eenvoud, minus de app",
            body: [
                "Lose It! won mensen voor zich door calorieën tellen licht en een beetje speels te houden, met Snap It-fotologging als hoofdtruc. Nutrition MCP doet die fototruc ook — stuur een foto van je bord en je AI leest hem — behalve dat het leeft in de assistent waarmee je al chat, dus er is geen aparte app om te openen.",
                "Als wat je aan Lose It! aantrok laagdrempelig loggen en snelle dagelijkse feedback was, voel je je meteen thuis: zeg wat je hebt gegeten, krijg je resterende calorieën en macro's terug, en ga verder. Geen advertenties, geen upsell, en geen account om bij te houden.",
                "Het enige waar je afstand van doet is de laag van reeksen en badges waarmee Lose It! je laat terugkomen. Als die gamification je motiveert, is dat een prima reden om te blijven. Als het altijd als ruis boven op het eigenlijke loggen aanvoelde, mis je het niet — het dagelijkse cijfer staat gewoon in de chat zodra je ernaar vraagt.",
            ],
        },
        importSection: {
            title: "Je gelogde dagen gaan ook mee",
            body: [
                "Overstappen betekent niet dat je bij nul begint. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die Lose It! exporteert, die wordt in je browser verwerkt, de kolommen die worden herkend koppelen zichzelf — de datum, het voedsel, de maaltijd, calorieën, eiwit, koolhydraten en vet, plus vezels, totale suikers en cafeïne waar je export die bevat — en je bevestigt een preview van wat wordt toegevoegd. Het is een bestandskiezer en een preview, geen dicteeroefening — op dat pad leest of typt de AI je regels nooit over.",
                "Twee eigenaardigheden van Lose It! worden bewust afgehandeld. De export draagt een verwijderd-vlag, en regels die als verwijderd zijn gemarkeerd worden overgeslagen in plaats van geïmporteerd: ze terugbrengen zou eten doen herleven dat je met opzet hebt verwijderd, en geen enkel totaal in de preview zou dat aan het licht brengen. Ook schrijft het de letterlijke tekst “n/a” voor cellen zonder waarde, wat wordt gelezen als leeg in plaats van als nul — dus een macro die je nooit hebt bijgehouden blijft afwezig in plaats van als een echte 0 g te worden vastgelegd en je gemiddelden omlaag te trekken.",
                "Voer het zo vaak uit als je wilt. Elke regel draagt een inhoudelijke vingerafdruk, dus een herhaalde import van hetzelfde bestand meldt de maaltijden als al gelogd en voegt niets toe. En als de datums in je export op twee manieren gelezen kunnen worden — 05/06 als mei of juni — laat de importer zijn interpretatie zien naast een regel uit je eigen bestand en vraagt je die te bevestigen voordat er iets wordt geschreven.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die Lose It! exporteert, die wordt in je browser verwerkt in plaats van door de AI gelezen, en je bevestigt een preview voordat er iets wordt geschreven. De datum, het voedsel, de maaltijd, calorieën, eiwit, koolhydraten en vet koppelen zichzelf, en vezels, totale suikers en cafeïne ook wanneer je export die bevat. De export van Lose It! wordt op naam herkend — als verwijderd gemarkeerde regels worden overgeslagen in plaats van teruggehaald, en de cellen met “n/a” worden gelezen als leeg in plaats van als nul. Hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Heeft Nutrition MCP fotologging zoals Snap It van Lose It!?",
                a: "Ja — stuur een foto van je bord en je AI herkent het eten en schat de macro's, en logt het zodra je bevestigt. Bij Lose It! zit fotologging achter een betaald abonnement; bij Nutrition MCP is het gratis en werkt het rechtstreeks in de chat.",
            },
            {
                q: "Kan ik calorieën tellen op dezelfde manier als in Lose It!?",
                a: "Ja. De kern is identiek — zeg wat je hebt gegeten en krijg direct je resterende calorieën en macro's terug. Het verschil is dat je met je AI praat in plaats van door een app te tikken, en er zijn geen advertenties of upsells onderweg.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Alleen op abonnement en geen MCP-server. Bekijk het gratis alternatief dat in je AI leeft.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Een betaald abonnement na de gratis proefperiode (geen gratis versie)",
            "Je opent nog steeds een aparte app om elke maaltijd te loggen",
            "De adaptieve coaching is het product, niet moeiteloos loggen",
        ],
        note: "De adaptieve TDEE-coaching van MacroFactor is oprecht goed. Als je vooral snel, gratis macro's wilt loggen in je AI, past Nutrition MCP eenvoudiger en zonder kosten.",
        migrate: {
            title: "Coaching versus loggen",
            body: [
                "De belofte van MacroFactor is zijn algoritme: het houdt je gelogde inname en gewicht in de gaten en herberekent stilletjes elke week je calorie- en macrodoelen — oprecht slimme, adaptieve coaching van het Stronger By Science-team. Die coaching is het product, en daarom is het alleen op abonnement.",
                "Nutrition MCP draait geen coachingsalgoritme — maar omdat je al in een AI-assistent zit, kun je het gewoon vragen. “Moet ik mijn calorieën bijstellen, gezien mijn laatste drie weken?” levert op verzoek een onderbouwd antwoord op. Het is een ander model: analyse wanneer je die wilt, conversationeel, in plaats van een vaste wekelijkse herberekening — en het is gratis.",
                "De eerlijke afweging is discipline versus flexibiliteit. De wekelijkse herberekening van MacroFactor gebeurt of je er nu wel of niet aan denkt te vragen, wat je scherp houdt; het conversationele model past alleen aan wanneer jij het vraagt. Wil je een algoritme dat zonder omkijken je cijfers stuurt, dan is MacroFactor het abonnement waard. Wil je liever gratis loggen en analyse ophalen wanneer het je interesseert, dan past dit beter.",
            ],
        },
        importSection: {
            title: "Het logboek gaat mee, ook al gaat de coaching niet mee",
            body: [
                "Wat je zou achterlaten is het algoritme, niet de gegevens. Vraag om te importeren en er opent een importvenster in de chat: je kiest je MacroFactor-CSV-export, die wordt in je browser verwerkt, de kolommen die worden herkend worden voor je gekoppeld, en je bevestigt een preview voordat er iets wordt geschreven. De regels gaan nooit door de AI, dus er kan onderweg niets verkeerd worden overgetypt.",
                "De export van MacroFactor wordt op naam herkend — de kolom met portiegrootte is het verklikkende teken — en de kolommen voor datum, voedsel, maaltijd, calorieën en macro's koppelen zichzelf, vezels, totale suikers en cafeïne inbegrepen waar het bestand die bevat. Als je export energie in kilojoules in plaats van kilocalorieën rapporteert, wordt dat omgerekend in plaats van 4,184 keer te hoog opgeslagen. Omdat een kolom die simpelweg “Calories” heet elk van beide eenheden kan bevatten, wordt de eenheid aangeboden als keuze naast een uitgewerkt voorbeeld uit je eigen eerste regel, zodat je die bevestigt in plaats van te vertrouwen op een gok die stilletjes elke dag zou opblazen.",
                "Die geschiedenis is meteen nuttig in plaats van alleen gearchiveerd. Zodra er weken aan inname en gewicht binnen zijn, kun je de vraag stellen die het algoritme van MacroFactor volgens een schema beantwoordde — “moet ik mijn calorieën bijstellen, gezien de laatste drie weken?” — en op verzoek een onderbouwd antwoord krijgen. Een tweede import van hetzelfde bestand verandert niets, want elke regel draagt een inhoudelijke vingerafdruk en herhalingen komen terug als al gelogd.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest je MacroFactor-CSV-export, die wordt in je browser verwerkt in plaats van door de AI gelezen, en je bevestigt een preview voordat er iets wordt geschreven. De export van MacroFactor wordt op naam herkend — de datum, het voedsel, de maaltijd, calorieën, eiwit, koolhydraten en vet koppelen zichzelf, samen met vezels, totale suikers en cafeïne wanneer het bestand die heeft — en als het energie in kilojoules rapporteert, wordt dat omgerekend naar kilocalorieën zodra je de eenheid bevestigt naast een voorbeeld uit je eigen bestand. Hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Stelt Nutrition MCP mijn caloriedoelen bij zoals MacroFactor?",
                a: "Niet automatisch. De wekelijkse, algoritmische herberekening van MacroFactor is zijn betaalde kernfunctie. Bij Nutrition MCP vraag je het — “moet ik mijn calorieën bijstellen op basis van mijn laatste drie weken inname en gewicht?” — en redeneert je AI dat op verzoek uit, in plaats van een vaste wekelijkse update.",
            },
            {
                q: "Is Nutrition MCP echt gratis terwijl MacroFactor alleen op abonnement is?",
                a: "Ja. Nutrition MCP is volledig gratis en opensource, zonder proefperiode-daarna-betalen en zonder limieten op de gratis versie — in tegenstelling tot MacroFactor, dat geen gratis versie heeft en na de proefperiode een abonnement vereist. Je hebt alleen een Claude- of ChatGPT-account nodig.",
            },
        ],
        freeAnswer:
            "Ja. Nutrition MCP is volledig gratis en opensource, zonder abonnement — terwijl MacroFactor na de gratis proefperiode een betaald abonnement vereist. Je hebt alleen een Claude- of ChatGPT-account nodig om te verbinden.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Geen MCP-server. Houd maaltijden en macro's bij via een gesprek — gratis en opensource.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Doorzoek de database voor elk voedingsmiddel dat je logt",
            "Sommige functies, zoals maaltijdplannen, vereisen een betaald PRO-abonnement",
            "Een aparte app en account om te beheren",
        ],
        note: "Yazio is een gepolijste tracker met goede maaltijdplannen. Nutrition MCP focust op moeiteloos conversationeel loggen dat leeft binnen Claude of ChatGPT — gratis en opensource.",
        migrate: {
            title: "Plannen aan de ene kant, loggen aan de andere",
            body: [
                "Yazio combineert tracking met gestructureerde maaltijdplannen, recepten en vastentools, gepolijst voor een Europees publiek. Als een begeleid plan is wat je op koers houdt, doet Yazio dat goed en probeert Nutrition MCP dat niet na te doen — het is geen maaltijdplan-app.",
                "Wat het wel doet is de loghelft moeiteloos maken. In plaats van Yazio's database te doorzoeken voor elk ingrediënt, omschrijf je het gerecht en handelt je AI de macro's af — en beantwoordt daarna in één adem “hoe doe ik het vandaag?”. Combineer het met welk eetplan je ook al volgt.",
                "Dit maakt de twee eigenlijk complementair in plaats van concurrerend. Blijf een Yazio-plan volgen, of welk plan dan ook, voor de “wat te eten”-kant; gebruik Nutrition MCP voor de “bleef ik op koers”-kant, gelogd via een gesprek en gratis. De enige plek waar het niet helpt zijn vastentimers — dat is Yazio's terrein, niet dat van een voedingslog.",
            ],
        },
        importSection: {
            title: "Neem het logboek mee, koppel de kolommen",
            body: [
                "Je Yazio-geschiedenis kan overkomen, al doe je zelf een deel van het werk. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export, die wordt in je browser verwerkt, en je wijst de kolommen zelf aan naar datum, voedsel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne. De exports van vier apps — MyFitnessPal, Cronometer, Lose It! en MacroFactor — worden herkend aan hun kolomnamen; Yazio is daar geen van, dus reken erop dat je die koppeling één keer instelt. Alles daarna is hetzelfde: een preview van wat wordt toegevoegd, en dan je bevestiging.",
                "De Europese eigenaardigheden waar de meeste importers op stuklopen, worden opgevangen. Een bestand met puntkomma's als scheidingsteken waarvan de getallen een komma als decimaalteken gebruiken — de vorm die Excel produceert in een Duitse of Oostenrijkse regio-instelling — wordt correct gelezen, in plaats van dat het scheidingsteken wordt aangezien voor een decimaalpunt of elke macro met duizend wordt vermenigvuldigd. De kopteksten die de koppelaar kent, zijn ook niet alleen Engelstalig: de Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker en Koffein van een Duitse export worden allemaal herkend, en vezels, suiker en cafeïne worden ook herkend in het Spaans, Frans, Italiaans en Nederlands — fibra, sucres, zuccheri, suikers, cafeína, caffeina — dus een gelokaliseerd bestand komt vaak al deels gekoppeld binnen, waardoor je minder kolommen met de hand hoeft in te stellen. Aangehaalde velden, regeleinden binnen een cel, bijna-lege waarden en verdwaalde totaalregels worden ook opgevangen, en de AI leest het bestand nooit, dus er kan onderweg geen cijfer verkeerd worden getypt.",
                "Datums en energie worden bevestigd in plaats van gegokt. Een kolom in DD/MM/JJJJ wordt dag-eerst gelezen, en waar de waarden het echt niet kunnen uitmaken — 05/06 als mei of juni — laat de importer zijn interpretatie zien naast een regel uit je eigen bestand zodat je die kunt corrigeren. Staat de energiekolom in kilojoules, dan wordt die omgerekend naar kilocalorieën, met de eenheid als keuze naast een uitgewerkt voorbeeld. Hetzelfde bestand opnieuw importeren voegt niets toe: elke regel draagt een inhoudelijke vingerafdruk, dus herhalingen komen terug als al gelogd.",
            ],
        },
        importFaq:
            "Ja, met handmatige kolomkoppeling. Vraag om te importeren en er opent een importvenster in de chat: je kiest je Yazio-CSV-export, die wordt in je browser verwerkt in plaats van door de AI gelezen, en je wijst de kolommen zelf aan naar datum, voedsel, maaltijd, calorieën en macro's — vezels, totale suikers en cafeïne inbegrepen. Yazio is geen van de vier exports die aan de kolomnaam worden herkend, dus die koppeling is een eenmalige handmatige stap, al vullen kopteksten die de koppelaar al kent (in het Duits, en voor vezels, suiker en cafeïne ook in het Spaans, Frans, Italiaans en Nederlands) zichzelf in. Europese bestanden met puntkomma's, komma's als decimaalteken, datums in DD/MM/JJJJ en kilojoules worden allemaal opgevangen, en hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Bevat Nutrition MCP maaltijdplannen zoals Yazio PRO?",
                a: "Nee. De gestructureerde maaltijdplannen, recepten en vastentools van Yazio zijn zijn sterke punt, en Nutrition MCP probeert die niet te vervangen — het regelt de loghelft. Veel mensen blijven hun Yazio-plan (of welk plan dan ook) volgen en loggen hier gewoon gratis mee.",
            },
            {
                q: "Kan ik sneller loggen dan door Yazio's database te doorzoeken?",
                a: "Meestal wel. In plaats van Yazio's database te doorzoeken voor elk ingrediënt en porties in te stellen, omschrijf je het complete gerecht in één keer — “een kom muesli met yoghurt en bessen” — en schat en logt je AI de macro's in één stap.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Geen MCP-server. Een lichtere, gratis manier om eten te loggen binnen Claude of ChatGPT.",
        cons: [
            "Geen MCP-server — werkt niet binnen Claude of ChatGPT",
            "Log voedingsmiddelen door zijn database één voor één te doorzoeken",
            "Sommige functies, zoals dieetplannen, vereisen een betaald abonnement",
            "Weer een app en abonnement om te beheren",
        ],
        note: "Lifesum combineert tracking met gestructureerde dieetplannen. Nutrition MCP is een lichtere, gratis manier om calorieën, macro's en gewicht te loggen door met je AI te praten.",
        migrate: {
            title: "Beoordelingen waar je gewoon naar kunt vragen",
            body: [
                "Lifesum leunt op structuur en feedback — dieetplannen, recepten en het voedselbeoordelingssysteem dat scoort wat je eet. Nutrition MCP geeft je eten geen badge als cijfer, dus als die scorelus je motiveert, heeft Lifesum daar een streepje voor.",
                "De ruil is flexibiliteit: in plaats van een vaste beoordeling kun je je AI vragen “is dit een goede keuze voor mijn doelen?” en een echt antwoord in context krijgen. Loggen is één zin, trends en een streefgewicht zitten er standaard bij, en geen premium-laag blokkeert de nuttige onderdelen.",
                "Een badge vertelt je dat een voedingsmiddel 3 van de 5 scoorde; een gesprek vertelt je waarom, en wat je eraan kunt doen — “vervang de helft van de rijst door groenten en dit past in je dag.” Het is het verschil tussen een score en een coach, en omdat Lifesum dieetplannen en een deel van de tracking achter Premium plaatst, is dit van de twee de gratis optie.",
            ],
        },
        importSection: {
            title: "Niets om over te typen",
            body: [
                "Van tracker wisselen betekent je geschiedenis meenemen, en je hoeft er geen regel van over te typen. Vraag om te importeren en er opent een importvenster in de chat: je kiest je Lifesum-CSV-export, die wordt in je browser verwerkt, en je wijst de kolommen aan naar datum, voedsel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne. De kopteksten van Lifesum worden niet op naam herkend zoals die van MyFitnessPal, Cronometer, Lose It! en MacroFactor, dus die koppeling is een eenmalige handmatige stap — daarna bekijk je een preview van wat wordt toegevoegd en bevestig je.",
                "Niets verschuilt zich achter een aanname. De koppelaar toont je eigen bestand — de echte kopteksten, echte cellen, en een lopende telling van de regels die worden aangemaakt — dus een kolom die naar het verkeerde veld wijst, is zichtbaar voordat er iets wordt geschreven in plaats van pas achteraf ontdekt te worden. Aangehaalde velden, regeleinden binnen een cel, bijna-lege waarden en totaalregels worden allemaal opgevangen, en omdat het bestand in je browser wordt gelezen, ziet de AI nooit een regel die hij verkeerd zou kunnen overtypen.",
                "Europese exports worden ondersteund: een bestand met puntkomma's en komma's als decimaalteken wordt correct gelezen, datums in DD/MM/JJJJ worden omgezet zodra je de volgorde hebt bevestigd, en kilojoules worden kilocalorieën, met de eenheid getoond naast een uitgewerkt voorbeeld uit je eigen eerste regel. Gelokaliseerde kopteksten helpen ook — de Kalorien, Kohlenhydrate, Ballaststoffe of Koffein van een Duitse export vullen zichzelf in, en vezels, suiker en cafeïne worden ook herkend in het Spaans, Frans, Italiaans en Nederlands — dus de handmatige koppeling is meestal korter dan het klinkt. Voer de import twee keer uit en niets verdubbelt — elke regel draagt een inhoudelijke vingerafdruk, dus herhalingen worden gemeld als al gelogd.",
            ],
        },
        importFaq:
            "Ja, met handmatige kolomkoppeling. Vraag om te importeren en er opent een importvenster in de chat: je kiest je Lifesum-CSV-export, die wordt in je browser verwerkt in plaats van door de AI gelezen, en je wijst de kolommen zelf aan naar datum, voedsel, maaltijd, calorieën en macro's — vezels, totale suikers en cafeïne inbegrepen. Lifesum is geen van de vier exports die aan de kolomnaam worden herkend, dus die koppeling is een eenmalige handmatige stap, al vullen kopteksten die de koppelaar al kent zichzelf in. Europese bestanden met puntkomma's, komma's als decimaalteken, datums in DD/MM/JJJJ en kilojoules worden allemaal opgevangen, en hetzelfde bestand opnieuw importeren maakt nooit dubbele regels aan.",
        extraFaqs: [
            {
                q: "Beoordeelt Nutrition MCP mijn eten zoals Lifesum's voedselbeoordelingen?",
                a: "Nee — er is geen badge of numerieke score. In plaats daarvan kun je je AI vragen “is dit een goede keuze voor mijn doelen?” en een contextueel antwoord krijgen dat de afwegingen uitlegt, in plaats van een vaste beoordeling van het voedingsmiddel zelf.",
            },
            {
                q: "Is Nutrition MCP gratis zonder een abonnement zoals Lifesum Premium?",
                a: "Ja. Nutrition MCP is volledig gratis en opensource, zonder premium-laag — terwijl Lifesum dieetplannen en een deel van de trackingfuncties achter een Premium-abonnement plaatst. Je hebt alleen een Claude- of ChatGPT-account nodig om te verbinden.",
            },
        ],
    },
};

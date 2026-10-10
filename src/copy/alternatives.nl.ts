// Dutch (nl) translation of the /alternatives comparison pages' prose.
// See src/copy/alternatives.ts for AppSlug / AppCopy and the accuracy
// rules in scripts/gen-alternatives.ts's APPS array (which app names are
// recognised by column name, which need manual mapping, Cronometer's
// caffeine column, etc.) that still apply to this content.

import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_NL: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Geen officiële MCP-server, en voor sommige functies heb je een betaald abonnement nodig. Bekijk het gratis alternatief waarmee je logt via een gesprek.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Voor elk item een database doorzoeken en de juiste vermelding kiezen",
            "Voor sommige functies, zoals de barcodescanner, is een betaald abonnement nodig",
            "Een aparte app en account, met advertenties in de gratis versie",
        ],
        note: "MyFitnessPal is een sterke app met een enorme voedingsdatabase. Dit is geen kritiek; het is gewoon een andere aanpak, voor wie liever met een AI praat dan door een app tikt.",
        migrate: {
            title: "De database achter je laten",
            body: [
                "MyFitnessPal dankt zijn populariteit aan een van de grootste voedingsdatabases die er bestaan, met tientallen miljoenen door gebruikers aangeleverde vermeldingen. Juist die omvang maakt het omslachtig: bij elk voedingsmiddel scrol je langs bijna-identieke vermeldingen en moet je raden welke klopt. Loggen via een gesprek slaat het zoeken helemaal over. Je omschrijft wat je eet, generieke voedingsmiddelen krijgen hun waarden uit USDA FoodData Central als die er is, en schattingen dekken de rest.",
                "Je dagboek hoef je daarvoor niet achter te laten: een CSV-export van MyFitnessPal wordt rechtstreeks geïmporteerd, inclusief alle eigenaardigheden, dus de jaren die je al hebt gelogd gaan mee. Alles wat je daarna vastlegt, kun je zelf op elk moment als CSV exporteren.",
                "De functies die MyFitnessPal geleidelijk achter Premium heeft gezet (barcode scannen, macro's per gram, geen advertenties) zitten hier gewoon bij. Je hoeft geen gratis versie af te wegen tegen een upgrade van $20 per maand: er is één gratis, open source versie, en het enige wat je nieuw aanmaakt, is een gratis account bij je eerste verbinding.",
            ],
        },
        importSection: {
            title: "Importeer je MyFitnessPal-dagboek uit een CSV-bestand",
            body: [
                "Jaren aan gelogde geschiedenis zijn de echte reden dat mensen blijven, en die hoef je niet op te geven. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die MyFitnessPal exporteert, je browser verwerkt die, herkende kolommen worden automatisch gekoppeld en je ziet wat er wordt toegevoegd voordat er iets wordt opgeslagen. Die koppeling omvat calorieën, eiwit, koolhydraten en vet, plus vezels, totale suikers en cafeïne in milligram als je export die kolommen bevat. De rijen gaan nooit door de AI, dus die kan niets verkeerd overtypen.",
                "Een export van MyFitnessPal wordt aan de naam herkend, eigenaardigheden inbegrepen. Het bestand begint met een byte-order mark die anders de eerste kolomkop zou verminken; de notities kunnen regeleinden bevatten binnen een cel tussen aanhalingstekens, wat een naïeve splitsing per regel aan flarden zou scheuren, samen met elke rij daarna; en elk dagblok eindigt met een totaalrij die geen maaltijd mag worden. Het belangrijkste: MyFitnessPal exporteert per dag één samengevoegde rij per maaltijd en helemaal geen kolom met de naam van het eten. In plaats van die rijen af te wijzen omdat er geen omschrijving is, herkent de importer die vorm en krijgen ze hun maaltijdtype als label: ze komen binnen als “Breakfast (imported from MyFitnessPal)”.",
                "Datums worden bevestigd, niet aangenomen. Een kolom met 05/06/2024 is echt niet eenduidig (mei of juni?), dus de importer laat je zijn interpretatie zien naast een echte rij uit je eigen bestand, en je kunt die corrigeren voordat er iets wordt opgeslagen. Elke rij krijgt bovendien een vingerafdruk op basis van de inhoud: importeer je hetzelfde bestand nog eens, dan worden die maaltijden gemeld als al gelogd in plaats van dubbel toegevoegd, zolang je tijdzone intussen niet is veranderd. Een gedeeltelijke export geïmporteerd of een kolom verkeerd gekoppeld? Doe het gewoon opnieuw.",
            ],
        },
        importFaq:
            "Ja. Vraag om je geschiedenis te importeren en er opent een importvenster in de chat: je kiest de CSV die MyFitnessPal exporteert, je browser verwerkt die (de AI leest hem niet), je koppelt de kolommen of controleert de koppeling, bekijkt wat er wordt toegevoegd en bevestigt. Calorieën, eiwit, koolhydraten en vet gaan mee, en ook vezels, totale suikers, cafeïne, verzadigd vet en transvet als je export die bevat. De export van MyFitnessPal wordt aan de naam herkend, inclusief de byte-order mark, de totaalrijen aan het eind en het feit dat er per dag één samengevoegde rij per maaltijd staat zonder naam van het eten; die rijen krijgen hun maaltijdtype als label. Hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Kan Nutrition MCP barcodes scannen zoals MyFitnessPal Premium?",
                a: "Ja, en gratis. Stuur de barcode van een product en Nutrition MCP haalt de macro's van het etiket op bij Open Food Facts. MyFitnessPal heeft zijn barcodescanner juist achter een betaald Premium-abonnement gezet.",
            },
            {
                q: "Hoe werkt loggen zonder de voedingsdatabase van MyFitnessPal?",
                a: "Je omschrijft in gewone taal wat je hebt gegeten, bijvoorbeeld “een burritobowl met kip en extra rijst”, en je AI logt het. Generieke voedingsmiddelen krijgen hun waarden uit USDA FoodData Central als er een match is, verpakte producten komen via de barcode uit Open Food Facts, en schattingen dekken de rest. Je hoeft geen database met miljoenen door gebruikers aangeleverde vermeldingen te doorzoeken en niet te raden welke klopt; elk getal toont waar het vandaan komt.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Geen officiële MCP-server. Bekijk de gratis manier om calorieën en macro's in je AI bij te houden, gewoon via een gesprek.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Loggen door de database te doorzoeken, vermelding voor vermelding",
            "Voor sommige functies is een betaald Gold-abonnement nodig",
            "Een aparte app die je bij elke maaltijd moet openen",
        ],
        note: "Cronometer is uitstekend als je micronutriënten heel nauwkeurig wilt bijhouden. Nutrition MCP kiest voor een lichtere aanpak via een gesprek, voor calorieën, macro's en gewicht, rechtstreeks in je AI.",
        migrate: {
            title: "Als nauwkeurigheid alles is",
            body: [
                "Cronometer heeft zijn reputatie te danken aan precisie: zorgvuldig samengestelde databases en het bijhouden van 80+ micronutriënten, waaronder vitamines en mineralen. Open je de app vooral voor die diepgang in micronutriënten, wees dan eerlijk tegen jezelf: schattingen uit een gesprek kunnen niet tippen aan een databasevermelding op labniveau die tot op de gram klopt.",
                "Maar de meeste mensen loggen om calorieën en macro's binnen de perken te houden, niet om hun seleniuminname te controleren. Wat je hier bijhoudt, is bovendien uitgebreider dan het klinkt: naast eiwit, koolhydraten en vet krijg je vezels, totale suikers en cafeïne in milligram, en optioneel alcohol in gram ethanol als je dat aanzet. Daarvoor is een maaltijd aan je AI omschrijven veel minder werk dan elk onderdeel opzoeken en wegen, en je krijgt nog steeds dagtotalen, trends en een streefgewicht om naartoe te werken, gratis.",
                "Er is ook een middenweg: omdat je in een AI-assistent zit, kun je naar micronutriënten vragen wanneer je dat echt wilt (“hoeveel ijzer en B12 zat er ongeveer in mijn maaltijden van vandaag?”) en krijg je op verzoek een onderbouwde schatting, zonder dat je de rest van de tijd elke gram tegen een samengestelde vermelding hoeft te loggen.",
            ],
        },
        importSection: {
            title: "Tien jaar aan registraties, netjes bewaard",
            body: [
                "Je gebruikte Cronometer om de precisie, dus een slordige import zou erger zijn dan helemaal geen. Vraag om te importeren en er opent een venster in de chat: je kiest je Cronometer-CSV, je browser verwerkt die, en je keurt een voorbeeld goed voordat er ook maar één rij wordt opgeslagen. De getallen worden rechtstreeks uit het bestand gelezen. De AI ziet de rijen nooit, dus die kan niets afronden of verkeerd overtypen.",
                "De exportvorm van Cronometer wordt aan de naam herkend. De tijdstempel staat verdeeld over een aparte datum- en tijdkolom, en beide worden gelezen, dus een ontbijt dat je om 07:12 hebt gelogd, houdt zijn tijd in plaats van op een standaardtijd rond het middaguur te belanden. De hoeveelheid staat met de eenheid in dezelfde cel (“58.00 g”, “1.00 cup”), en zo'n waarde wordt nog steeds gelezen als het getal dat het is, niet als leeg. Verder komt de kop “Amount” meer dan eens voor, dus kolommen worden op positie gekoppeld in plaats van op naam: de dubbele koppen kunnen niet ongemerkt botsen, en het koppelscherm laat zien welke je precies aanwijst.",
                "Om duidelijk te zijn over wat er meegaat: datum en tijd, de naam van het voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, cafeïne en notities. Cronometer is de enige export in dit rijtje met een kolom Caffeine (mg), en die komt binnen in milligram: de eenheid waarin hij al staat en waarin cafeïne hier wordt opgeslagen, dus er wordt niets omgerekend. Staat er gram in de kop van een cafeïnekolom, dan wordt die niet gekoppeld en zie je waarom, in plaats van dat er 0,18 wordt vastgelegd waar op het etiket 180 mg staat. Suiker betekent totale suikers, inclusief die uit fruit en zuivel, dus niet toegevoegde suikers, want die staan in geen enkele export betrouwbaar. De aparte kolom “Sugar Alcohols” van Cronometer bevat polyolen, geen suiker of ethanol, en kan in geen van beide velden terechtkomen. Alcohol is een geval apart: Cronometer exporteert het als ethylalcohol in gram, en het gaat alleen mee als je hier eerst alcoholregistratie hebt aangezet, want die staat standaard uit. Portiehoeveelheden en de 80+ vitamines en mineralen van Cronometer gaan helemaal niet mee; die diepgang in micronutriënten blijft in de eigen export van Cronometer. Opnieuw importeren kan geen kwaad: elke rij krijgt een vingerafdruk op basis van de inhoud, dus als je hetzelfde bestand een tweede keer importeert, worden de maaltijden gemeld als al gelogd in plaats van dubbel toegevoegd, zolang je tijdzone intussen niet is veranderd.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest je Cronometer-CSV, je browser verwerkt die (de AI leest hem niet) en je bekijkt wat er wordt toegevoegd voordat je bevestigt. De export van Cronometer wordt aan de naam herkend: de aparte datum- en tijdkolom worden allebei gelezen, en de herhaalde kop “Amount” kan niet botsen omdat kolommen op positie worden gekoppeld. Datum en tijd, naam van het voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, cafeïne in milligram, verzadigd vet en transvet en notities gaan mee; alcohol ook, maar alleen als je eerst alcoholregistratie hebt aangezet. Vitamines, mineralen en portiehoeveelheden niet. Hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Houdt Nutrition MCP micronutriënten bij zoals Cronometer?",
                a: "Nee. Het bijhouden van 80+ vitamines en mineralen is de specialiteit van Cronometer, en Nutrition MCP heeft helemaal geen gegevens over micronutriënten: geen natrium, geen vitamines. Wat het wel bijhoudt: calorieën, eiwit, koolhydraten, vet, vezels, totale suikers, cafeïne in milligram, verzadigd vet en transvet, optioneel alcohol, water en gewicht. Je kunt je AI nog steeds om een ruwe inschatting van de micronutriënten in een maaltijd vragen, maar als je micronutriënten op labniveau echt nodig hebt, past Cronometer beter.",
            },
            {
                q: "Is Nutrition MCP net zo nauwkeurig als Cronometer?",
                a: "Nee. Cijfers uit een gesprek kunnen niet tippen aan de samengestelde database van Cronometer, die tot op de gram klopt. Voor generieke voedingsmiddelen gebruikt Nutrition MCP waarden uit USDA FoodData Central als er een match is, en schattingen als dat niet zo is; voor verpakte producten gebruikt een barcode-opzoeking de etiketgegevens van Open Food Facts. Ook die bronnen kunnen ernaast zitten, en elk getal toont waar het vandaan komt, dus controleer alles wat ertoe doet. Je levert wat precisie in voor veel minder logwerk.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Geen officiële MCP-server. Log maaltijden in plaats daarvan door met Claude of ChatGPT te praten, gratis.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Elk item met de hand opzoeken en loggen",
            "Voor sommige functies, zoals onbeperkt foto's loggen met Snap It, is een betaald abonnement nodig",
            "Weer een app, weer een account, advertenties in de gratis versie",
        ],
        note: "Lose It! is een vriendelijke calorieteller. Nutrition MCP doet hetzelfde basiswerk, loggen via een gesprek, gratis en zonder dat je Claude of ChatGPT ooit verlaat.",
        migrate: {
            title: "Net zo eenvoudig, alleen zonder app",
            body: [
                "Lose It! wist mensen voor zich te winnen door calorieën tellen licht en een tikje speels te houden, met Snap It-fotologging als paradepaardje. Nutrition MCP kan dat fototrucje ook: stuur een foto van je bord en je AI leest hem. Alleen zit het in de assistent waarmee je al chat, dus je hoeft geen aparte app te openen.",
                "Hield je bij Lose It! vooral van laagdrempelig loggen en snelle feedback per dag, dan voel je je hier meteen thuis: zeg wat je hebt gegeten, krijg je resterende calorieën en macro's terug en ga weer verder. Geen advertenties en geen opgedrongen upgrades.",
                "Het enige wat je opgeeft, zijn de reeksen en badges waarmee Lose It! je laat terugkomen. Motiveert dat spelelement je, dan is dat een prima reden om te blijven. Voelde het altijd als ruis bovenop het eigenlijke loggen, dan mis je het niet: het cijfer van de dag staat in de chat zodra je erom vraagt.",
            ],
        },
        importSection: {
            title: "Je gelogde dagen gaan ook mee",
            body: [
                "Overstappen betekent niet dat je bij nul begint. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die Lose It! exporteert, je browser verwerkt die, de herkende kolommen koppelen zichzelf (datum, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten en vet, plus vezels, totale suikers en cafeïne als je export die bevat) en je bevestigt een voorbeeld van wat er wordt toegevoegd. Het is een bestandskiezer met een voorbeeld, geen dictee: zo krijgt de AI je rijen nooit te lezen en hoeft hij ze ook niet over te typen.",
                "Twee eigenaardigheden van Lose It! worden bewust afgehandeld. De export bevat een markering voor verwijderde rijen, en rijen die als verwijderd zijn gemarkeerd, worden overgeslagen in plaats van geïmporteerd. Anders zou eten terugkomen dat je bewust hebt verwijderd, en geen enkel totaal in het voorbeeld zou dat verraden. Daarnaast schrijft de export letterlijk “n/a” in cellen zonder waarde. Dat wordt gelezen als leeg, niet als nul, dus een macro die je nooit hebt bijgehouden blijft leeg in plaats van als echte 0 g te worden vastgelegd en je gemiddelden omlaag te halen.",
                "Importeer zo vaak als je wilt. Elke rij krijgt een vingerafdruk op basis van de inhoud: importeer je hetzelfde bestand nog eens, dan worden de maaltijden gemeld als al gelogd en wordt er niets toegevoegd, zolang je tijdzone intussen niet is veranderd. En zijn de datums in je export op twee manieren te lezen (05/06 als mei of juni), dan laat de importer zijn interpretatie zien naast een rij uit je eigen bestand en vraagt hij je die te bevestigen voordat er iets wordt opgeslagen.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest de CSV die Lose It! exporteert, je browser verwerkt die (de AI leest hem niet) en je bevestigt een voorbeeld voordat er iets wordt opgeslagen. Datum, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten en vet koppelen zichzelf, en vezels, totale suikers en cafeïne ook als je export die bevat. De export van Lose It! wordt aan de naam herkend: rijen die als verwijderd zijn gemarkeerd, worden overgeslagen in plaats van teruggehaald, en cellen met “n/a” worden gelezen als leeg, niet als nul. Hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Kan Nutrition MCP foto's loggen zoals Snap It van Lose It!?",
                a: "Ja. Stuur een foto van je bord en je AI herkent het eten, schat de macro's en logt het zodra je de details hebt bevestigd. Lose It! beperkt Snap It in de gratis versie en geeft pas met Premium onbeperkt gebruik; bij Nutrition MCP kost fotologging niets extra en werkt het direct in de chat, in elke AI-app die afbeeldingen kan lezen.",
            },
            {
                q: "Kan ik calorieën tellen zoals ik dat in Lose It! deed?",
                a: "Ja. De basis is hetzelfde: zeg wat je hebt gegeten en krijg meteen je resterende calorieën en macro's terug. Het verschil is dat je met je AI praat in plaats van door een app te tikken, en dat je onderweg geen advertenties of opgedrongen upgrades tegenkomt.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Alleen met abonnement en geen officiële MCP-server. Bekijk het gratis alternatief dat in je AI zit.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Een betaald abonnement na de gratis proefperiode (geen gratis versie)",
            "Je opent nog steeds een aparte app om elke maaltijd te loggen",
            "De adaptieve coaching is het product, niet moeiteloos loggen",
        ],
        note: "De adaptieve TDEE-coaching van MacroFactor is echt goed. Wil je vooral snel en gratis macro's loggen in je AI, dan is Nutrition MCP eenvoudiger en kost het niets.",
        migrate: {
            title: "Coaching versus loggen",
            body: [
                "MacroFactor draait om zijn algoritme: dat houdt je gelogde inname en gewicht in de gaten en berekent elke week ongemerkt je calorie- en macrodoelen opnieuw. Echt slimme, adaptieve coaching van het team van Stronger By Science. Die coaching is het product, en daarom is MacroFactor alleen met een abonnement te gebruiken.",
                "Nutrition MCP heeft geen coachingsalgoritme, maar omdat je al in een AI-assistent zit, kun je het gewoon vragen. “Moet ik mijn calorieën bijstellen, gezien mijn laatste drie weken?” levert op verzoek de interpretatie van je AI van je eigen gelogde cijfers op: een schatting om zelf af te wegen, geen voedingsadvies. Het is een andere aanpak: analyse wanneer je die wilt, via een gesprek, in plaats van een vaste wekelijkse herberekening. En het is gratis.",
                "De eerlijke afweging is discipline tegenover flexibiliteit. De wekelijkse herberekening van MacroFactor gebeurt ook als je er niet aan denkt om te vragen, en dat houdt je bij de les; de chataanpak stelt pas bij als jij erom vraagt. Wil je een algoritme dat je cijfers automatisch bijstuurt, dan is MacroFactor het abonnement waard. Log je liever gratis en vraag je om analyse wanneer het je interesseert, dan past dit beter.",
            ],
        },
        importSection: {
            title: "De coaching blijft achter, je eetdagboek gaat mee",
            body: [
                "Wat je achterlaat, is het algoritme, niet je gegevens. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export van MacroFactor, je browser verwerkt die, herkende kolommen worden automatisch gekoppeld en je bevestigt een voorbeeld voordat er iets wordt opgeslagen. De rijen gaan nooit door de AI, dus er kan onderweg niets verkeerd worden overgetypt.",
                "De export van MacroFactor wordt aan de naam herkend (de kolom met portiegrootte verraadt hem) en de kolommen voor datum, voedingsmiddel, maaltijd, calorieën en macro's koppelen zichzelf, inclusief vezels, totale suikers en cafeïne als het bestand die bevat. Geeft je export energie in kilojoules in plaats van kilocalorieën, dan wordt die omgerekend in plaats van 4,184 keer te hoog opgeslagen. Omdat een kolom die simpelweg “Calories” heet beide eenheden kan bevatten, stel je de eenheid zelf in, naast een uitgewerkt voorbeeld uit de eerste rij van je eigen bestand. Zo bevestig je hem, in plaats van te vertrouwen op een gok die ongemerkt elke dag te hoog zou maken.",
                "Die geschiedenis is meteen bruikbaar en niet alleen gearchiveerd. Zodra er weken aan inname en gewicht in staan, kun je de vraag stellen die het algoritme van MacroFactor volgens schema beantwoordde (“moet ik mijn calorieën bijstellen, gezien de laatste drie weken?”) en krijg je op verzoek de interpretatie van je AI van je eigen cijfers: een schatting, geen voedingsadvies. Een tweede import van hetzelfde bestand heeft geen effect, want elke rij krijgt een vingerafdruk op basis van de inhoud en herhalingen worden gemeld als al gelogd, zolang je tijdzone intussen niet is veranderd.",
            ],
        },
        importFaq:
            "Ja. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export van MacroFactor, je browser verwerkt die (de AI leest hem niet) en je bevestigt een voorbeeld voordat er iets wordt opgeslagen. De export van MacroFactor wordt aan de naam herkend: datum, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten en vet koppelen zichzelf, samen met vezels, totale suikers en cafeïne als het bestand die bevat. Staat de energie in kilojoules, dan wordt die omgerekend naar kilocalorieën zodra je de eenheid bevestigt naast een voorbeeld uit je eigen bestand. Hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Stelt Nutrition MCP mijn caloriedoelen bij zoals MacroFactor?",
                a: "Niet automatisch. De wekelijkse herberekening door een algoritme is de betaalde kernfunctie van MacroFactor. Bij Nutrition MCP vraag je het zelf (“moet ik mijn calorieën bijstellen op basis van mijn inname en gewicht van de laatste drie weken?”) en redeneert je AI het op verzoek uit, in plaats van een vaste wekelijkse update te geven.",
            },
            {
                q: "Is Nutrition MCP echt gratis terwijl MacroFactor alleen met abonnement werkt?",
                a: "Ja. Nutrition MCP is volledig gratis en open source, zonder proefperiode waarna je alsnog moet betalen en zonder beperkingen in een gratis versie, anders dan MacroFactor, dat geen gratis versie heeft en na de proefperiode een abonnement vereist. Je hebt een AI-app nodig die MCP ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je bij je eerste verbinding aanmaakt met Google of met een e-mailadres en wachtwoord.",
            },
        ],
        freeAnswer:
            "Ja. Nutrition MCP is volledig gratis en open source, zonder abonnement, terwijl MacroFactor na de gratis proefperiode een betaald abonnement vereist. Je hebt een AI-app nodig die MCP ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je bij je eerste verbinding aanmaakt met Google of met een e-mailadres en wachtwoord.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Geen officiële MCP-server. Houd maaltijden en macro's bij via een gesprek, gratis en open source.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Voor elk voedingsmiddel dat je logt de database doorzoeken",
            "Voor sommige functies, zoals maaltijdplannen, is een betaald PRO-abonnement nodig",
            "Een aparte app en account om te beheren",
        ],
        note: "Yazio is een verzorgde tracker met goede maaltijdplannen. Nutrition MCP richt zich op moeiteloos loggen via een gesprek, rechtstreeks in Claude of ChatGPT, gratis en open source.",
        migrate: {
            title: "Plannen aan de ene kant, loggen aan de andere",
            body: [
                "Yazio combineert een eetdagboek met gestructureerde maaltijdplannen, recepten en vastentools, verzorgd voor een Europees publiek. Als een begeleid plan je op koers houdt, doet Yazio dat goed, en Nutrition MCP probeert dat niet na te doen: het is geen app voor maaltijdplannen.",
                "Wat het wel doet, is het loggen moeiteloos maken. In plaats van voor elk ingrediënt de database van Yazio te doorzoeken, omschrijf je het gerecht en regelt je AI de macro's, en beantwoordt hij in één moeite door ook “hoe sta ik ervoor vandaag?”. Combineer het met welk eetplan je ook al volgt.",
                "Daardoor vullen de twee elkaar eigenlijk aan in plaats van te concurreren. Blijf een plan van Yazio volgen, of welk plan dan ook, voor de vraag wat je eet; gebruik Nutrition MCP voor de vraag of je op koers bleef, gelogd via een gesprek en gratis. Alleen bij vastentimers helpt het niet: dat is het terrein van Yazio, niet van een eetdagboek.",
            ],
        },
        importSection: {
            title: "Neem je eetdagboek mee, koppel de kolommen",
            body: [
                "Je Yazio-geschiedenis kan mee, al doe je zelf een deel van het werk. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export, je browser verwerkt die, en je koppelt de kolommen zelf aan datum, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne. De exports van vier apps (MyFitnessPal, Cronometer, Lose It! en MacroFactor) worden herkend aan hun kolomnamen; Yazio hoort daar niet bij, dus reken erop dat je die koppeling één keer zelf instelt. Daarna gaat alles hetzelfde: een voorbeeld van wat er wordt toegevoegd, en dan je bevestiging.",
                "De Europese eigenaardigheden waar de meeste importers op stuklopen, worden opgevangen. Een bestand met puntkomma's als scheidingsteken en een komma als decimaalteken (wat Excel maakt met Duitse of Oostenrijkse landinstellingen) wordt correct gelezen, zonder dat het scheidingsteken voor een decimaalteken wordt aangezien of elke macro met duizend wordt vermenigvuldigd. De kolomkoppen die het koppelscherm kent, zijn ook niet alleen Engels: Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker en Koffein uit een Duitse export worden allemaal herkend, en vezels, suiker en cafeïne ook in het Spaans, Frans, Italiaans en Nederlands (fibra, sucres, zuccheri, suikers, cafeína, caffeina). Een gelokaliseerd bestand komt dus vaak al deels gekoppeld binnen, waardoor je minder kolommen met de hand hoeft in te stellen. Velden tussen aanhalingstekens, regeleinden binnen een cel, bijna-lege waarden en verdwaalde totaalrijen worden ook opgevangen, en de AI leest het bestand nooit, dus onderweg kan geen getal verkeerd worden overgetypt.",
                "Datums en energie worden bevestigd in plaats van gegokt. Een kolom in DD/MM/JJJJ wordt gelezen met de dag eerst, en waar de waarden het echt niet uitwijzen (05/06 kan mei of juni zijn), laat de importer zijn interpretatie zien naast een rij uit je eigen bestand, zodat je die kunt corrigeren. Staat de energiekolom in kilojoules, dan wordt die omgerekend naar kilocalorieën; de eenheid stel je in naast een uitgewerkt voorbeeld. Hetzelfde bestand opnieuw importeren voegt niets toe: elke rij krijgt een vingerafdruk op basis van de inhoud, dus herhalingen worden gemeld als al gelogd, zolang je tijdzone intussen niet is veranderd.",
            ],
        },
        importFaq:
            "Ja, met handmatige kolomkoppeling. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export van Yazio, je browser verwerkt die (de AI leest hem niet) en je koppelt de kolommen zelf aan datum, voedingsmiddel, maaltijd, calorieën en macro's, waaronder vezels, totale suikers en cafeïne. Yazio hoort niet bij de vier exports die aan hun kolomnamen worden herkend, dus die koppeling is een eenmalige handmatige stap. Kolomkoppen die het koppelscherm al kent (in het Duits, en voor vezels, suiker en cafeïne ook in het Spaans, Frans, Italiaans en Nederlands) vullen zichzelf wel in. Europese bestanden met puntkomma's, komma's als decimaalteken, datums in DD/MM/JJJJ en kilojoules worden allemaal opgevangen, en hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Heeft Nutrition MCP maaltijdplannen zoals Yazio PRO?",
                a: "Nee. De gestructureerde maaltijdplannen, recepten en vastentools zijn de kracht van Yazio, en Nutrition MCP probeert die niet te vervangen: het neemt het loggen voor zijn rekening. Veel mensen blijven hun plan van Yazio (of een ander plan) volgen en loggen hier gratis wat ze eten.",
            },
            {
                q: "Kan ik sneller loggen dan door de database van Yazio te doorzoeken?",
                a: "Meestal wel. In plaats van voor elk ingrediënt de database van Yazio te doorzoeken en porties in te stellen, omschrijf je het hele gerecht in één keer (“een kom muesli met yoghurt en bessen”) en je AI logt de macro's in één stap, met USDA-waarden voor generieke voedingsmiddelen waar die bestaan en schattingen voor de rest.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Geen officiële MCP-server. Een lichtere, gratis manier om eten te loggen in Claude of ChatGPT.",
        cons: [
            "Geen officiële MCP-server: je kunt je dagboek niet bijhouden vanuit Claude of ChatGPT",
            "Voedingsmiddelen één voor één opzoeken in de database",
            "Voor sommige functies, zoals dieetplannen, is een betaald abonnement nodig",
            "Alweer een app en abonnement om te beheren",
        ],
        note: "Lifesum combineert een eetdagboek met gestructureerde dieetplannen. Nutrition MCP is een lichtere, gratis manier om calorieën, macro's en gewicht te loggen door met je AI te praten.",
        migrate: {
            title: "Een oordeel? Vraag er gewoon om",
            body: [
                "Lifesum steunt op structuur en feedback: dieetplannen, recepten en een eigen beoordelingssysteem dat scoort wat je eet. Nutrition MCP geeft je eten geen cijfer of badge, dus als die scores je motiveren, heeft Lifesum daar een streepje voor.",
                "Daar staat flexibiliteit tegenover: in plaats van een vaste beoordeling kun je je AI vragen “is dit een goede keuze voor mijn doelen?” en krijg je een echt antwoord, in context. Loggen is één zin, trends en een streefgewicht zitten er standaard in, en er is geen premiumversie die de nuttige onderdelen afschermt.",
                "Een badge vertelt je dat een voedingsmiddel 3 van de 5 scoorde; een gesprek kan uitleggen waarom, in de context van je eigen eetdagboek: “vervang de helft van de rijst door groenten en dit past in je dag.” En omdat Lifesum dieetplannen en een deel van het bijhouden achter Premium zet, is Nutrition MCP van de twee de gratis optie.",
            ],
        },
        importSection: {
            title: "Niets om over te typen",
            body: [
                "Overstappen naar een andere tracker betekent je geschiedenis meenemen, en je hoeft er geen regel van over te typen. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export van Lifesum, je browser verwerkt die, en je koppelt de kolommen aan datum, voedingsmiddel, maaltijd, calorieën, eiwit, koolhydraten, vet, vezels, totale suikers en cafeïne. De kolomkoppen van Lifesum worden niet aan de naam herkend zoals die van MyFitnessPal, Cronometer, Lose It! en MacroFactor, dus die koppeling is een eenmalige handmatige stap. Daarna bekijk je wat er wordt toegevoegd en bevestig je.",
                "Er wordt niets stilletjes aangenomen. Het koppelscherm toont je eigen bestand (de echte kolomkoppen, echte cellen en een lopende telling van de rijen die worden aangemaakt), dus een kolom die naar het verkeerde veld wijst, zie je voordat er iets wordt opgeslagen in plaats van pas achteraf. Velden tussen aanhalingstekens, regeleinden binnen een cel, bijna-lege waarden en totaalrijen worden allemaal opgevangen, en omdat je browser het bestand leest, ziet de AI nooit een rij die hij verkeerd zou kunnen overtypen.",
                "Europese exports worden ondersteund: een bestand met puntkomma's en een komma als decimaalteken wordt correct gelezen, datums in DD/MM/JJJJ worden omgezet zodra je de volgorde hebt bevestigd, en kilojoules worden kilocalorieën, met de eenheid naast een uitgewerkt voorbeeld uit de eerste rij van je eigen bestand. Gelokaliseerde kolomkoppen helpen ook: Kalorien, Kohlenhydrate, Ballaststoffe of Koffein uit een Duitse export vullen zichzelf in, en vezels, suiker en cafeïne worden ook herkend in het Spaans, Frans, Italiaans en Nederlands. Het handmatige koppelen is dus meestal minder werk dan het klinkt. Importeer twee keer en er wordt niets verdubbeld: elke rij krijgt een vingerafdruk op basis van de inhoud, dus herhalingen worden gemeld als al gelogd, zolang je tijdzone intussen niet is veranderd.",
            ],
        },
        importFaq:
            "Ja, met handmatige kolomkoppeling. Vraag om te importeren en er opent een importvenster in de chat: je kiest je CSV-export van Lifesum, je browser verwerkt die (de AI leest hem niet) en je koppelt de kolommen zelf aan datum, voedingsmiddel, maaltijd, calorieën en macro's, inclusief vezels, totale suikers en cafeïne. Lifesum hoort niet bij de vier exports die aan hun kolomnamen worden herkend, dus die koppeling is een eenmalige handmatige stap, al vullen kolomkoppen die het koppelscherm al kent zichzelf in. Europese bestanden met puntkomma's, komma's als decimaalteken, datums in DD/MM/JJJJ en kilojoules worden allemaal opgevangen, en hetzelfde bestand opnieuw importeren levert geen dubbele registraties op, zolang je tijdzone intussen niet is veranderd.",
        extraFaqs: [
            {
                q: "Geeft Nutrition MCP mijn eten een beoordeling, zoals Lifesum?",
                a: "Nee, er is geen badge of score in cijfers. Je kunt je AI wel vragen “is dit een goede keuze voor mijn doelen?” en krijgt dan een antwoord in context dat de afwegingen uitlegt, in plaats van een vaste beoordeling van het voedingsmiddel zelf.",
            },
            {
                q: "Is Nutrition MCP gratis, zonder abonnement zoals Lifesum Premium?",
                a: "Ja. Nutrition MCP is volledig gratis en open source, zonder premiumversie, terwijl Lifesum dieetplannen en een deel van de functies voor het bijhouden achter een Premium-abonnement zet. Je hebt een AI-app nodig die MCP ondersteunt, zoals Claude of ChatGPT, en een gratis Nutrition MCP-account, dat je bij je eerste verbinding aanmaakt met Google of met een e-mailadres en wachtwoord.",
            },
        ],
    },
};

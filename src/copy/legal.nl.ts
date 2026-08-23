// Dutch (nl) translation of PRIVACY_EN / TERMS_EN. Kept in the same direct,
// plain-spoken register as the rest of the Dutch site copy (informal
// "je/jij", matching src/copy/index.nl.ts, tools.nl.ts, alternatives.nl.ts
// and chrome.nl.ts) rather than shifting into formal/legalistic Dutch —
// see legal.ts's own comment above PRIVACY_DE/TERMS_DE for the reasoning.
// No human review pass (product decision, see git history) — this is
// exactly the page most worth a native-speaker legal review before it's
// relied on.

import type { LegalDoc } from "./legal.js";

export const PRIVACY_NL: LegalDoc = {
    title: "Privacybeleid",
    metaDescription:
        "Hoe Nutrition MCP omgaat met je gegevens: wat we opslaan, hoe het wordt gebruikt, waar het staat, en hoe je je account en alles daarin op elk moment kunt verwijderen.",
    ogDescription:
        "Hoe Nutrition MCP omgaat met je gegevens: wat we opslaan, hoe het wordt gebruikt, waar het staat, en hoe je je account en alles daarin op elk moment kunt verwijderen.",
    lastUpdated: "26 juli 2026",
    backToHome: "Terug naar de startpagina",
    sections: [
        {
            heading: "Wat we verzamelen",
            blocks: [
                {
                    type: "p",
                    html: "Bij het registreren slaan we je <strong>e-mailadres</strong> en een veilig gehasht wachtwoord op via Supabase Auth. Meld je je in plaats daarvan aan met Google, dan ontvangen we je e-mailadres van Google en krijgen we nooit een wachtwoord te zien.",
                },
                {
                    type: "p",
                    html: "Bij het gebruik van de dienst slaan we op:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Maaltijdregistraties</strong> — omschrijving, maaltijdtype, calorieën, macro's, vezels, totale suikers, gram alcohol, milligram cafeïne, notities en tijdstempels. Foto's van eten worden geïnterpreteerd door je AI-assistent en worden nooit naar ons geüpload of door ons opgeslagen.",
                        "<strong>Waterregistraties</strong> — hoeveelheid, notities en tijdstempels.",
                        "<strong>Lichaamsgewichtregistraties</strong> — gewicht, notities en tijdstempels. Dit zijn gezondheidsgegevens en ze worden precies zo behandeld als de rest van je registraties.",
                        "<strong>Doelen</strong> — je dagelijkse doelen voor calorieën, eiwit, koolhydraten, vet, vezels, suiker, alcohol, cafeïne en water, en je streefgewicht.",
                        "<strong>Profielinstellingen</strong> — je IANA-tijdzone, voorkeurseenheid voor gewicht, of alcoholregistratie is ingeschakeld en in welk standaardglas het wordt getoond, en of widgets in de chat zijn ingeschakeld.",
                        "<strong>Gebruikstelemetrie van tools</strong> — voor elke aanroep van een MCP-tool: welke tool het was, of de aanroep slaagde, hoe lang die duurde, een grove foutcategorie bij een mislukking, de omvang in dagen van een opgevraagde datumreeks, en de MCP-sessie-ID. Dit is gekoppeld aan je account-ID en bevat nooit de inhoud van je registraties.",
                    ],
                },
                {
                    type: "p",
                    html: "<strong>Alcohol is ook gezondheidsdata</strong>, en van een gevoeliger soort dan een caloriecijfer, dus het werkt anders dan al het bovenstaande. Alcoholregistratie staat standaard uit, en we leggen alcohol alleen vast wanneer die van jou komt — een drankje dat je logt, of een kolom in een bestand dat je importeert. Niets wordt namens jou afgeleid. Het uitschakelen van deze instelling doet twee dingen: de bulkimporter leest de alcoholkolom niet meer uit bestanden die je uploadt, en overal elders verdwijnt alcohol uit de maaltijden, doelen, voortgang en widgets die je ziet. Het is geen verwijderknop. Alcohol die je rechtstreeks hebt gelogd, blijft geregistreerd ongeacht of de instelling aan of uit staat, alles wat al is opgeslagen blijft in de database staan, en dat alles blijft ook verschijnen in het maaltijdenbestand van elke export die je maakt. Om een alcoholcijfer daadwerkelijk te verwijderen, verwijder je de maaltijd waarbij het hoort, of verwijder je je account.",
                },
                {
                    type: "p",
                    html: "We bewaren ook de OAuth-toegangs- en refreshtokens en autorisatiecodes waarmee je AI-assistent verbonden kan blijven met je account.",
                },
            ],
        },
        {
            heading: "Hoe we het gebruiken",
            blocks: [
                {
                    type: "p",
                    html: "Je maaltijd-, water-, gewichts- en doelgegevens worden uitsluitend gebruikt om de voedingstrackingdienst te leveren. We <strong>verkopen ze nooit, delen ze nooit met derden en gebruiken ze nooit voor advertenties</strong> of voeren ze nooit in een advertentie- of profileringssysteem in.",
                },
                {
                    type: "p",
                    html: "Er bestaan twee soorten analyses, en geen van beide raakt de inhoud van je registraties:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Website-analyse.</strong> Deze pagina's laden Google Analytics, dat ons geaggregeerde verkeersstatistieken geeft — paginaweergaven, verwijzers, ruwe geografie, apparaattype. Het draait op elke pagina, ook deze, en er is momenteel geen toestemmingsbanner en geen IP-anonimisering, waardoor Google als onderdeel van de standaardmeting je IP-adres ontvangt. Wil je liever niet gemeten worden, dan houdt een tracker-blocker of de &bdquo;Do-Not-Track&rdquo;-instellingen van je browser dit tegen.",
                        "<strong>Servertelemetrie.</strong> Elke MCP-tool-aanroep schrijft één regel gebruikstelemetrie — welke tool het was, of de aanroep slaagde, hoe lang die duurde — gekoppeld aan je account-ID maar niet aan wat je hebt gelogd. We gebruiken dit om trage en kapotte tools op te sporen. Het wordt met niemand gedeeld en wordt samen met al het andere verwijderd zodra je je account verwijdert.",
                    ],
                },
                {
                    type: "p",
                    html: "Omdat de site lettertypen en iconen laadt van Google Fonts en jsDelivr, en de startpagina het aantal sterren van het project ophaalt bij de GitHub API, stelt een bezoek aan deze pagina's je IP-adres bloot aan die aanbieders.",
                },
            ],
        },
        {
            heading: "Waar het wordt opgeslagen",
            blocks: [
                {
                    type: "p",
                    html: 'Alle gegevens worden opgeslagen bij <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL). Authenticatie wordt afgehandeld door Supabase Auth. De server wordt gehost bij DigitalOcean.',
                },
            ],
        },
        {
            heading: "Gegevens verwijderen",
            blocks: [
                {
                    type: "p",
                    html: "Je kunt je account en alle bijbehorende gegevens op elk moment verwijderen door je AI-assistent te vragen om <strong>je account te verwijderen</strong> terwijl die verbonden is met de Nutrition MCP-server. Deze actie is direct en onomkeerbaar. Het verwijdert je maaltijd-, water- en gewichtsregistraties, doelen, profielinstellingen, een eventueel nog opgeslagen exportarchief, je gebruikstelemetrie, je toegangstokens en het account zelf. Dat omvat elk alcoholcijfer dat je ooit hebt gelogd, ongeacht of alcoholregistratie was ingeschakeld.",
                },
            ],
        },
        {
            heading: "Gebruiksvoorwaarden",
            blocks: [
                {
                    type: "p",
                    html: 'Het gebruik van de dienst wordt ook geregeld door onze <a href="/terms" data-legal-link="terms">Gebruiksvoorwaarden</a>, die het toegestane gebruik behandelen, het feit dat niets hier medisch advies is, en het ontbreken van enige garantie — de dienst wordt aangeboden zoals die is, gratis, zonder garanties voor beschikbaarheid, nauwkeurigheid of geschiktheid voor een bepaald doel.',
                },
            ],
        },
    ],
};

export const TERMS_NL: LegalDoc = {
    title: "Gebruiksvoorwaarden",
    metaDescription:
        "De voorwaarden die het gebruik van Nutrition MCP regelen — de gratis, open source voedingstracker en remote MCP-server voor Claude en ChatGPT. Begrijpelijke voorwaarden over accounts, toegestaan gebruik, je gegevens en aansprakelijkheid.",
    ogDescription:
        "De voorwaarden die het gebruik van Nutrition MCP regelen — de gratis, open source voedingstracker en remote MCP-server voor Claude en ChatGPT.",
    lastUpdated: "26 juli 2026",
    backToHome: "Terug naar de startpagina",
    sections: [
        {
            heading: "Overeenkomst",
            blocks: [
                {
                    type: "p",
                    html: "Deze voorwaarden regelen je gebruik van Nutrition MCP (de &bdquo;dienst&rdquo;) — de website op nutrition-mcp.com en de remote MCP-server op <strong>https://nutrition-mcp.com/mcp</strong>. Door een account aan te maken of een AI-assistent met de server te verbinden, ga je akkoord met deze voorwaarden. Ga je niet akkoord, gebruik de dienst dan niet.",
                },
            ],
        },
        {
            heading: "De dienst",
            blocks: [
                {
                    type: "p",
                    html: 'Nutrition MCP is een gratis, open source voedingstracker die draait als MCP-server, waarmee AI-assistenten zoals Claude en ChatGPT namens jou maaltijden, water en lichaamsgewicht kunnen loggen. Er is geen betaalde laag, geen advertenties en geen kosten voor het gebruik van de dienst. We accepteren vrijwillige donaties op Patreon om hosting- en databasekosten te helpen dekken; dat zijn giften, geen aankopen, en ze kopen geen functies, geen laag en geen enkele vorm van voorrang. De broncode is gepubliceerd onder de MIT-licentie op <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> en je bent vrij om het zelf te hosten.',
                },
            ],
        },
        {
            heading: "Je account",
            blocks: [
                {
                    type: "p",
                    html: "Je moet minstens 16 jaar oud zijn om de dienst te gebruiken. We controleren de leeftijd niet, dus door een account aan te maken bevestig je dat je aan die eis voldoet. Je bent verantwoordelijk voor het vertrouwelijk houden van je inloggegevens en voor alle activiteit die onder je account plaatsvindt. Geef alsjeblieft een e-mailadres op waar je daadwerkelijk toegang toe hebt — het is de enige manier om je toegang te herstellen.",
                },
            ],
        },
        {
            heading: "Geen medisch advies",
            blocks: [
                {
                    type: "p",
                    html: "Nutrition MCP is een registratie- en rapportagetool, geen zorgdienst. Niets wat het oplevert — calorie- en macrocijfers, doelen, trends of enig commentaar dat je AI-assistent toevoegt — is medisch, voedingskundig of diëtistisch advies, en niets ervan vervangt een gekwalificeerde professional. Raadpleeg een arts of diëtist voordat je beslissingen neemt over je gezondheid, vooral als je een medische aandoening hebt of een voorgeschiedenis van een eetstoornis.",
                },
                {
                    type: "p",
                    html: "De dienst is niet ontworpen voor klinisch gebruik en zou niet gebruikt moeten worden door iemand met een actieve eetstoornis, of door iemand die zwanger is of onder klinisch toezicht staat voor een voedingsgerelateerde aandoening, zonder betrokkenheid van hun behandelaar. Calorie- en macrotracking kan in die situaties schadelijk zijn. Als dat op jou van toepassing is, praat dan met je behandelaar voordat je het gebruikt.",
                },
                {
                    type: "p",
                    html: "Voedingscijfers zijn <strong>schattingen</strong>. Ze komen van AI-modellen die je omschrijvingen en foto's interpreteren, van databases van derden zoals Open Food Facts, en van wat je zelf invoert. Ze kunnen fout zijn. Controleer alles wat ertoe doet.",
                },
                {
                    type: "p",
                    html: "Foto's van eten worden nooit naar onze server gestuurd. Je AI-assistent interpreteert de afbeelding aan zijn eigen kant en stuurt ons alleen de resulterende tekst en cijfers — een omschrijving, een maaltijdtype, calorieën, macro's, notities, een barcode.",
                },
            ],
        },
        {
            heading: "Toegestaan gebruik",
            blocks: [
                {
                    type: "p",
                    html: "Bij het gebruik van de dienst ga je ermee akkoord om niet:",
                },
                {
                    type: "ul",
                    items: [
                        "de dienst te gebruiken voor een onwettig doel, of in strijd met toepasselijke wet- of regelgeving;",
                        "te proberen toegang te krijgen tot het account of de gegevens van een andere gebruiker, of authenticatie, snelheidslimieten of enige andere technische controle te omzeilen;",
                        "de dienst of de infrastructuur waarop die draait te onderzoeken, te scannen, te overbelasten of te verstoren, ook via geautomatiseerde bulkverzoeken;",
                        "content te uploaden die illegaal is, of waarvoor je geen recht hebt om die te delen;",
                        "de gehoste dienst door te verkopen of als je eigen dienst te presenteren;",
                        "de dienst te gebruiken om extreme calorierestrictie na te streven, of om dat bij iemand anders te promoten, te coachen of aan te moedigen.",
                    ],
                },
                {
                    type: "p",
                    html: "De dienst is snelheidsbeperkt om hem voor iedereen beschikbaar te houden. Heb je een hoger volume nodig, host de dienst dan zelf — daarvoor is de MIT-licentie er.",
                },
            ],
        },
        {
            heading: "Je gegevens",
            blocks: [
                {
                    type: "p",
                    html: 'Je registraties blijven van jou. We slaan ze op en verwerken ze om de dienst voor je te laten draaien, zoals beschreven in ons <a href="/privacy" data-legal-link="privacy">Privacybeleid</a>. Je bent verantwoordelijk voor de content die je logt.',
                },
                {
                    type: "p",
                    html: "Je kunt je <strong>maaltijdgeschiedenis</strong> op elk moment exporteren naar CSV door je AI-assistent te vragen je maaltijden te exporteren. De export omvat alleen maaltijden — één regel per maaltijd met tijd, tijdzone, maaltijdtype, omschrijving, calorieën, eiwit, koolhydraten, vet, vezels, suiker, alcohol, cafeïne en notities. Alcohol wordt meegenomen ongeacht of alcoholregistratie voor je account is ingeschakeld. Water, gewicht, doelen en instellingen zitten vandaag niet in de export. De downloadlink die we teruggeven is privé en verloopt na 60 minuten.",
                },
                {
                    type: "p",
                    html: "We registreren ook basale operationele telemetrie over hoe de dienst wordt gebruikt: voor elke tool-aanroep de naam van de tool, of de aanroep slaagde, hoe lang die duurde, een grove foutcategorie bij een mislukking, de lengte van een opgevraagde datumreeks, en de sessie-ID. Deze regels zijn gekoppeld aan je account-ID. Ze bevatten niet wat je hebt gelogd — geen voedselomschrijvingen, geen calorieën, geen gewichten. We gebruiken ze om de dienst draaiende te houden en te zien welke tools het waard zijn om te verbeteren, en ze worden samen met al het andere verwijderd zodra je je account verwijdert.",
                },
                {
                    type: "p",
                    html: "Je kunt je account en alle bijbehorende gegevens op elk moment verwijderen door je AI-assistent te vragen, terwijl die verbonden is, om <strong>je account te verwijderen</strong> — die actie is direct en onomkeerbaar.",
                },
            ],
        },
        {
            heading: "Beschikbaarheid en wijzigingen",
            blocks: [
                {
                    type: "p",
                    html: "De dienst wordt gratis aangeboden, zonder toezegging over beschikbaarheid en zonder service-level agreement. We kunnen op elk moment en zonder kennisgeving elk onderdeel ervan wijzigen, opschorten of stopzetten — inclusief tools, functies en de gehoste server zelf. We kunnen ook content wijzigen of verwijderen die deze voorwaarden schendt.",
                },
            ],
        },
        {
            heading: "Diensten van derden",
            blocks: [
                {
                    type: "p",
                    html: "De dienst is afhankelijk van derden: Supabase voor database, authenticatie en exportopslag, DigitalOcean voor hosting, Open Food Facts voor barcodegegevens, en welke AI-assistent je ook gebruikt om te verbinden.",
                },
                {
                    type: "p",
                    html: "De website zelf gebruikt ook Google Analytics om verkeer te meten, Google Fonts en het jsDelivr-CDN om lettertypen en iconen te laden, Google Sign-In als je voor die manier van inloggen kiest, en de GitHub API om het aantal sterren van het project te tonen. Het laden van een pagina doet dus verzoeken naar die diensten, die je IP-adres en browser kunnen zien.",
                },
                {
                    type: "p",
                    html: "Hun voorwaarden en hun beschikbaarheid zijn hun eigen verantwoordelijkheid, en wij zijn daar niet verantwoordelijk voor.",
                },
            ],
        },
        {
            heading: "Geen garantie",
            blocks: [
                {
                    type: "p",
                    html: "De dienst wordt geleverd <strong>&bdquo;zoals het is&rdquo; en &bdquo;zoals beschikbaar&rdquo;</strong>, zonder garanties van welke aard dan ook, uitdrukkelijk of stilzwijgend, met inbegrip van stilzwijgende garanties van verkoopbaarheid, geschiktheid voor een bepaald doel, nauwkeurigheid of niet-inbreuk. We garanderen niet dat de dienst ononderbroken, veilig, foutloos is, of dat gegevens of voedingscijfers die deze oplevert accuraat zijn. Je gebruikt de dienst op eigen risico.",
                },
            ],
        },
        {
            heading: "Beperking van aansprakelijkheid",
            blocks: [
                {
                    type: "p",
                    html: "Voor zover wettelijk toegestaan zijn we niet aansprakelijk voor indirecte, incidentele, bijzondere, gevolg- of exemplaire schade, noch voor verlies van gegevens of winst, die voortvloeit uit of verband houdt met je gebruik van de dienst.",
                },
            ],
        },
        {
            heading: "Je wettelijke rechten",
            blocks: [
                {
                    type: "p",
                    html: "Sommige aansprakelijkheid kan nooit worden uitgesloten, en dat proberen we ook niet. We blijven volledig aansprakelijk voor overlijden of persoonlijk letsel veroorzaakt door onze nalatigheid, en voor fraude of frauduleuze misleiding.",
                },
                {
                    type: "p",
                    html: "Je behoudt ook elk recht dat de wet je als consument geeft. Deze voorwaarden staan naast die rechten en verminderen ze niet. Waar een sectie hierboven in strijd is met een recht waar je geen afstand van kunt doen, wint je wettelijke recht.",
                },
            ],
        },
        {
            heading: "Beëindiging",
            blocks: [
                {
                    type: "p",
                    html: "Je kunt op elk moment stoppen met het gebruik van de dienst en je account verwijderen zoals hierboven beschreven. We kunnen toegang opschorten of beëindigen die deze voorwaarden schendt of die de stabiliteit of veiligheid van de dienst bedreigt. De secties &bdquo;Geen garantie&rdquo;, &bdquo;Beperking van aansprakelijkheid&rdquo; en &bdquo;Je wettelijke rechten&rdquo; blijven gelden na beëindiging.",
                },
            ],
        },
        {
            heading: "Wijzigingen in deze voorwaarden",
            blocks: [
                {
                    type: "p",
                    html: "We kunnen deze voorwaarden van tijd tot tijd bijwerken. De actuele versie staat altijd op deze pagina, met de datum bovenaan die laat zien wanneer die voor het laatst is gewijzigd. Blijf je de dienst gebruiken na een update, dan betekent dat dat je de herziene voorwaarden accepteert.",
                },
            ],
        },
        {
            heading: "Deelbaarheid",
            blocks: [
                {
                    type: "p",
                    html: "Als een deel van deze voorwaarden onafdwingbaar blijkt te zijn, vervalt dat deel en blijft de rest van kracht.",
                },
            ],
        },
        {
            heading: "Contact",
            blocks: [
                {
                    type: "p",
                    html: 'Vragen over deze voorwaarden? Mail naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                },
            ],
        },
    ],
};

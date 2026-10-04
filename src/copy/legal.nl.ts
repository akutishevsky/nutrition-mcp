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
        "Hoe Nutrition MCP met je gegevens omgaat: wat we opslaan, waarvoor we het gebruiken, waar het staat en hoe je je account met alles erin op elk moment verwijdert.",
    ogDescription:
        "Hoe Nutrition MCP met je gegevens omgaat: wat we opslaan, waarvoor we het gebruiken, waar het staat en hoe je je account met alles erin op elk moment verwijdert.",
    lead: "Hoe Nutrition MCP met je gegevens omgaat: wat we opslaan, waarvoor we het gebruiken, waar het staat en hoe je je account met alles erin op elk moment verwijdert.",
    documentsLabel: "Juridische documenten",
    tocLabel: "Op deze pagina",
    lastUpdated: "3 oktober 2026",
    backToHome: "Terug naar de startpagina",
    sections: [
        {
            heading: "Wat we verzamelen",
            blocks: [
                {
                    type: "p",
                    html: "Wanneer je je registreert, slaan we via Supabase Auth je <strong>e-mailadres</strong> en een veilig gehasht wachtwoord op. Log je in plaats daarvan in met Google, dan vragen we Google alleen om je e-mailadres. Dat ontvangen we samen met de account-ID die Google voor jou gebruikt; Supabase Auth bewaart die, zodat het je herkent wanneer je de volgende keer met Google inlogt. Een Google-wachtwoord krijgen we nooit te zien. Bij accounts die vóór 27 september 2026 met Google hebben ingelogd, kunnen ook nog de naam en profielfoto zijn opgeslagen die Google destijds meestuurde; niets in de dienst leest of toont die, behalve je gegevensexport, en ze worden samen met je account verwijderd.",
                },
                {
                    type: "p",
                    html: "Als je de dienst gebruikt, slaan we het volgende op:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Maaltijdregistraties</strong> — omschrijving, maaltijdtype, calorieën, macro's, vezels, totale suikers, alcohol in gram, cafeïne in milligram, notities en tijdstempels. Foto's van eten worden door je AI-assistent geïnterpreteerd en nooit naar ons geüpload of door ons opgeslagen.",
                        "<strong>Waterregistraties</strong> — hoeveelheid, notities en tijdstempels.",
                        "<strong>Gewichtsregistraties</strong> — gewicht, notities en tijdstempels. Dit zijn gezondheidsgegevens; ze worden precies zo behandeld als je overige registraties.",
                        "<strong>Registraties van lichaamsmaten</strong> — welk lichaamsdeel is gemeten (taille, heupen, nek, borst, schouders, bovenarm, onderarm, dij of kuit), de waarde zoals je die invoerde en de eenheid ervan (cm of inch), notities en tijdstempels. Dit zijn gezondheidsgegevens; ze worden precies zo behandeld als je overige registraties.",
                        "<strong>Doelen</strong> — je dagelijkse doelen voor calorieën, eiwit, koolhydraten, vet, vezels, suiker, alcohol, cafeïne en water, plus je streefgewicht. Telkens als ze veranderen, bewaren we ook een gedateerde kopie, zodat een eerdere dag kan worden vergeleken met de doelen die op die dag golden.",
                        "<strong>Profielinstellingen</strong> — je IANA-tijdzone, je voorkeurseenheid voor gewicht, je voorkeurseenheid voor lengte bij lichaamsmaten, of alcoholregistratie aanstaat en in welk standaardglas alcohol wordt weergegeven, of widgets in de chat zijn ingeschakeld en in welke taal die widgets worden weergegeven.",
                        "<strong>Synchronisatie met Apple Health</strong> — alleen als je die koppelt vanuit de opdracht Nutrition MCP Health op je iPhone: de koppeling (welke dagtotalen ze verstuurt, of water erbij zit, vanaf welke datum ze geldt, de tijdzone die je iPhone doorgaf en die alleen wordt gebruikt zolang je profiel er geen heeft, en wanneer ze is aangemaakt, voor het laatst gebruikt en voor het laatst gesynchroniseerd); voor elk van de laatste 8 dagen de totalen die al naar Apple Health zijn gestuurd en wanneer, zodat elke dag één keer wordt verstuurd en daarna alleen wordt aangevuld met wat erbij kwam; en, terwijl je koppelt, een openstaand koppelverzoek van maximaal 30 minuten. Alcohol wordt nooit verstuurd.",
                        "<strong>Gebruikstelemetrie van tools</strong> — per aanroep van een MCP-tool: welke tool werd uitgevoerd, of de aanroep slaagde, hoe lang die duurde, een globale foutcategorie als die mislukte, het aantal dagen van een opgevraagde datumperiode, de MCP-sessie-ID, met welke revisie van het MCP-protocol je AI-app verbinding maakte, en de naam en versie die die app over zichzelf opgeeft (bijvoorbeeld &ldquo;claude-ai/1.0&rdquo;), als de app die meestuurt. Dit is gekoppeld aan je account-ID en bevat nooit de inhoud van je registraties.",
                        "<strong>Runtimelog van de server</strong> — per verzoek aan de server: de methode, het pad, de antwoordstatus en de responstijd, je IP-adres zonder het laatste deel, en bij MCP-verzoeken de protocolrevisie en de naam en versie die je AI-app opgeeft. Bij elke toolaanroep legt het log ook de naam van de tool vast, of de aanroep slaagde, hoe lang die duurde en, als die mislukte, een korte referentiecode en de foutmelding. Die foutmelding kan een waarde herhalen die je AI-app heeft gestuurd, zoals een ongeldige datum. Wanneer je AI-app inlogt of de verbinding vernieuwt, legt het log de uitkomst vast, de willekeurige identificatiecode die je AI-app kreeg toen die zich bij onze inlogdienst registreerde, en de site waarnaar de app wilde worden teruggestuurd (bijvoorbeeld claude.ai). Dit wordt weggeschreven naar het runtimelog van onze hostingprovider, bevat je account-ID en e-mailadres niet en wordt maar kort bewaard: dat log is een doorlopende buffer die oudere regels overschrijft zodra er nieuw verkeer binnenkomt.",
                    ],
                },
                {
                    type: "p",
                    html: "<strong>Alcohol valt ook onder gezondheidsgegevens</strong>, en is gevoeliger dan een caloriecijfer. Daarom werkt het anders dan al het bovenstaande. Alcoholregistratie staat standaard uit, en we leggen alcohol alleen vast als die van jou komt: een drankje dat je logt, of een kolom in een bestand dat je importeert. Niets in de dienst leidt het namens jou af. Zet je de instelling uit, dan gebeuren er twee dingen: de bulkimporter leest de alcoholkolom niet meer uit bestanden die je uploadt, en overal elders verdwijnt alcohol uit de maaltijden, doelen, voortgang en widgets die je te zien krijgt. Het is geen verwijderknop. Alcohol die je rechtstreeks logt, wordt nog steeds vastgelegd, of de instelling nu aan of uit staat; wat al is opgeslagen, blijft in de database staan; en alles verschijnt nog steeds in het maaltijdenbestand van elke export die je maakt. Wil je een alcoholcijfer echt verwijderen, verwijder dan de maaltijd waar het bij hoort, of verwijder je account.",
                },
                {
                    type: "p",
                    html: "We bewaren ook de OAuth-toegangstokens, refreshtokens en autorisatiecodes waarmee je AI-assistent verbonden blijft met je account; hoe lang elk daarvan geldig is, staat onder &ldquo;Hoe lang we gegevens bewaren&rdquo;. Ze worden alleen als eenrichtingshash opgeslagen. De synchronisatie met Apple Health heeft een eigen toegangstoken, dat we ook alleen als eenrichtingshash opslaan; de opdracht heeft het token zelf nodig voor haar verzoeken, dus de Opdrachten-app bewaart het in de eigen opslag van de opdracht op je iPhone, niet in een bestand, en synchroniseert het mogelijk naar je andere apparaten als je opdrachten via iCloud worden gesynchroniseerd. Wie die opdracht op je apparaten kan uitvoeren, kan de synchronisatie gebruiken tot je die ontkoppelt.",
                },
            ],
        },
        {
            heading: "Waarvoor we het gebruiken",
            blocks: [
                {
                    type: "p",
                    html: "Je gegevens over maaltijden, water, gewicht, lichaamsmaten en doelen worden uitsluitend gebruikt om de dienst te leveren waarmee je je voeding bijhoudt, en in anonieme, geaggregeerde vorm voor de openbare statistieken op de startpagina. We <strong>verkopen ze nooit, delen ze nooit met derden en gebruiken ze nooit voor advertenties</strong>, en we voeren ze nooit in een advertentie- of profileringssysteem in. De synchronisatie met Apple Health, hieronder beschreven, verandert daar niets aan: dat is een overdracht die je zelf start, naar je eigen iPhone, en we sturen niets naar Apple.",
                },
                {
                    type: "p",
                    html: "De startpagina en de openbare statistiekenfeed daarachter tonen anonieme totalen voor de hele site — hoeveel maaltijden er zijn gelogd, met hun calorieën en macro's, hoeveel water er is gelogd en het netto gewichtsverlies van alle accounts samen — en de tijdzones die in profielen zijn ingesteld, die de startpagina als wereldkaart weergeeft. Een tijdzone verschijnt pas op de kaart als minstens drie profielen die gebruiken, en geen enkel getal is aan een persoon gekoppeld.",
                },
                {
                    type: "p",
                    html: 'Als jij of je AI-assistent een barcode opzoekt, stuurt onze server alleen de cijfers van de barcode naar <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> — nooit je account, e-mailadres of registraties — en bewaart de productgegevens die terugkomen in een gedeelde cache die aan geen enkele gebruiker is gekoppeld.',
                },
                {
                    type: "p",
                    html: "Als je de synchronisatie met Apple Health koppelt, vraagt de opdracht op je iPhone onze server om de dagtotalen van je afgesloten dagen — calorieën, eiwit, koolhydraten, vet, vezels, cafeïne en, als je daarvoor koos, water — en schrijft die op die iPhone in Apple Health. Dat gebeurt op jouw verzoek en op jouw apparaat: onze server antwoordt alleen de opdracht en stuurt niets naar Apple. Zodra de totalen in Apple Health staan, worden ze daar bewaard en gedeeld volgens je eigen instellingen en je overeenkomst met Apple, niet de onze.",
                },
                {
                    type: "p",
                    html: "Er zijn wel twee vormen van analyse, en geen van beide komt aan de inhoud van je registraties:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Website-analyse.</strong> Met je toestemming laden deze pagina's Google Analytics, dat ons geaggregeerde verkeersstatistieken geeft (paginaweergaven, verwijzende sites, globale herkomst, apparaattype), en Microsoft Clarity, dat vastlegt hoe bezoekers de site gebruiken (klikken, tikken, scrollen, muisbewegingen) in de vorm van sessie-opnames en heatmaps, zodat we zien waar de pagina's mensen in verwarring brengen. Geen van beide wordt geladen voordat je in de cookiebanner akkoord geeft. Weiger je, dan wordt geen van beide geladen, en stuurt je browser een Global Privacy Control-signaal, dan wordt geen van beide geladen tenzij je zelf via de voettekst toestemming geeft. Met je akkoord sta je alleen analyse-opslag toe: advertentie-opslag en Google Signals blijven uit. Google ontvangt bij elk verzoek je IP-adres, maar logt of bewaart het volgens Google niet voor bezoekers uit de EU, Zwitserland of het Verenigd Koninkrijk, en gebruikt het alleen om een globale locatie af te leiden. Clarity maskeert wat je in formulieren typt en ontvangt ook je IP-adres en browsergegevens. Op de inlogpagina draait geen van beide. Je kunt je toestemming altijd intrekken via ‘Cookie-instellingen’ in de voettekst; daarmee worden ook de analysecookies verwijderd die deze site heeft geplaatst. Je keuze wordt maximaal 6 maanden bewaard in de lokale opslag van je browser.",
                        "<strong>Servertelemetrie.</strong> Elke aanroep van een MCP-tool schrijft één regel gebruikstelemetrie weg — welke tool werd uitgevoerd, of de aanroep slaagde, hoe lang die duurde, en via welke MCP-protocolrevisie en welke AI-app (met de naam en versie die die opgeeft) de aanroep werd gedaan — gekoppeld aan je account-ID, maar niet aan wat je hebt gelogd. We gebruiken dit om trage en defecte tools op te sporen. Het wordt met niemand gedeeld en samen met al het andere verwijderd wanneer je je account verwijdert.",
                    ],
                },
                {
                    type: "p",
                    html: "Omdat de site lettertypen en iconen laadt via Google Fonts en jsDelivr, krijgen die aanbieders je IP-adres te zien wanneer je deze pagina's bezoekt. Het aantal GitHub-sterren van het project wordt door onze server opgehaald, niet door je browser, dus GitHub ziet je bezoek nooit.",
                },
            ],
        },
        {
            heading: "Waar we het opslaan",
            blocks: [
                {
                    type: "p",
                    html: 'Alle gegevens worden opgeslagen bij <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) in de EU, in de AWS-regio Ierland (eu-west-1). Authenticatie en exportopslag verzorgt Supabase in dezelfde regio. De server draait bij DigitalOcean in Frankfurt (Duitsland). Verzoeken aan de site en de server lopen via het netwerk van Cloudflare (dat onze hostingprovider gebruikt). Cloudflare ontsleutelt de verbinding en verwerkt daardoor onderweg alles wat naar en van de dienst wordt verstuurd, inclusief je IP-adres, en kan een strikt noodzakelijke cookie voor botbescherming plaatsen (<code>__cf_bm</code>, 30 minuten).',
                },
            ],
        },
        {
            heading: "Hoe lang we gegevens bewaren",
            blocks: [
                {
                    type: "p",
                    html: "Je registraties van maaltijden, water, gewicht en lichaamsmaten, doelen en de geschiedenis van je doelwijzigingen, profielinstellingen en gebruikstelemetrie van tools worden bewaard zolang je account bestaat; geen daarvan heeft een eigen vervaldatum of een geplande opschoning. Verwijder je je account, dan wordt dit alles direct en onomkeerbaar verwijderd, zoals hieronder beschreven. Er blijven alleen deze sporen over: de telemetrieregel van de verwijdering zelf, die zonder je account-ID wordt vastgelegd; het hierboven beschreven kortlevende runtimelog van de server, dat nooit je account-ID bevat; de eigen operationele logs van onze databaseprovider, die een beperkte tijd worden bewaard (maximaal 7 dagen bij ons abonnement); en de doorlopende back-ups van die provider, die volgens een eigen schema vervallen.",
                },
                {
                    type: "p",
                    html: "Inloggegevens zijn bewust kortlevend. De sessie van de inlogpagina duurt 10 minuten en wordt in het geheugen van de server bewaard. Ze is aan je browser gekoppeld via een strikt noodzakelijke cookie die alleen een willekeurige waarde bevat, na diezelfde 10 minuten verloopt en wordt verwijderd zodra het inloggen is afgerond. Om je wachtwoord of je inlogpoging via Google te controleren, gebruiken we Supabase Auth, dat daarbij telkens een Supabase-inlogsessie aanmaakt; die sessie gebruiken we nooit en we beëindigen haar meteen. De eenmalige autorisatiecode die je AI-app krijgt, verloopt na 10 minuten en wordt verwijderd zodra hij is gebruikt. Een toegangstoken is 24 uur geldig (de paar tokens die tot en met 27 september 2026 zijn uitgegeven, verlopen uiterlijk op 6 oktober 2026); een refreshtoken is 90 dagen geldig en wordt verwijderd zodra het wordt gebruikt om een nieuw paar op te halen. Verlopen tokens en codes worden binnen een uur automatisch verwijderd. Als je je account verwijdert, worden ze allemaal direct verwijderd.",
                },
                {
                    type: "p",
                    html: "Ook de synchronisatie met Apple Health is in de tijd beperkt. De koppeling vervalt zodra ze 90 dagen niet is gebruikt, en in elk geval 365 dagen nadat je haar hebt gekoppeld; daarna moet de opdracht opnieuw worden gekoppeld. Het overzicht van wat is verstuurd, bevat alleen de laatste 8 dagen, en een koppelverzoek dat je niet afrondt, geldt 30 minuten. Verlopen koppelingen, overzichten en verzoeken worden binnen een uur automatisch verwijderd. Kies je in de opdracht voor Disconnect, dan worden de koppeling en haar overzicht direct verwijderd.",
                },
                {
                    type: "p",
                    html: "Exportarchieven zijn kortlevend. Elke nieuwe export overschrijft de vorige, en het bestand wordt automatisch verwijderd zodra de downloadlink van 60 minuten is verlopen. Er draait elke tien minuten een opschoning, dus een archief blijft normaal gesproken niet langer dan ongeveer 70 minuten bewaard.",
                },
            ],
        },
        {
            heading: "Gegevens verwijderen",
            blocks: [
                {
                    type: "p",
                    html: "Je kunt je account en alle bijbehorende gegevens op elk moment verwijderen door je AI-assistent, terwijl die met de Nutrition MCP-server verbonden is, te vragen <strong>je account te verwijderen</strong>. Dat gebeurt direct en is onomkeerbaar. Daarmee verdwijnen je registraties van maaltijden, water, gewicht en lichaamsmaten, doelen en de geschiedenis van je doelwijzigingen, profielinstellingen, een eventueel nog opgeslagen exportarchief, je gebruikstelemetrie van tools, je toegangstokens, je koppeling voor de synchronisatie met Apple Health met het overzicht van wat is verstuurd, en het account zelf. Ook elk alcoholcijfer dat je ooit hebt gelogd, verdwijnt, of alcoholregistratie nu aanstond of niet. Totalen die de opdracht al in Apple Health heeft geschreven, staan op je iPhone, niet op onze servers; ze blijven daar tot je ze in de app Gezondheid verwijdert.",
                },
            ],
        },
        {
            heading: "Contact en je rechten",
            blocks: [
                {
                    type: "p",
                    html: 'Nutrition MCP wordt beheerd door Anton Kutishevskyi, een individuele ontwikkelaar, die voor deze dienst de verwerkingsverantwoordelijke is voor je persoonsgegevens. Voor alle vragen over je gegevens of dit beleid kun je mailen naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                },
                {
                    type: "p",
                    html: "Op grond waarvan we je gegevens mogen verwerken:",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Je account en registraties</strong> — om de dienst te leveren waarvoor je een account hebt aangemaakt (uitvoering van een overeenkomst). Maaltijden, gewicht, lichaamsmaten en alcohol zijn gezondheidsgegevens; die verwerken we daarom op basis van je uitdrukkelijke toestemming. Die geef je wanneer je je account aanmaakt en telkens wanneer je inlogt (bij een app die al gekoppeld was voordat de inlogpagina om deze toestemming vroeg: door de registraties te loggen, tot je de volgende keer inlogt). Je kunt die toestemming op elk moment intrekken door de registraties of je account te verwijderen. De synchronisatie met Apple Health berust op dezelfde toestemming en werkt pas als je haar koppelt; door haar in de opdracht te ontkoppelen, trek je die toestemming voor de synchronisatie in.",
                        "<strong>Gebruikstelemetrie van tools en het runtimelog van de server</strong> — ons gerechtvaardigd belang om de dienst werkend, snel en veilig te houden (defecte tools opsporen, misbruik tegengaan met snelheidslimieten). Geen van beide bevat de inhoud van je registraties.",
                        "<strong>Website-analyse</strong> — je toestemming, die je geeft in de cookiebanner en op elk moment kunt intrekken via ‘Cookie-instellingen’ in de voettekst.",
                    ],
                },
                {
                    type: "p",
                    html: "Je rechten, en hoe je ze uitoefent (voor de meeste hoef je niet eens te mailen):",
                },
                {
                    type: "ul",
                    items: [
                        "<strong>Inzage en overdraagbaarheid</strong> — vraag je AI-assistent om je gegevens te exporteren. Je krijgt een ZIP met CSV-bestanden met alles wat we over je bewaren: je registraties van maaltijden, water, gewicht en lichaamsmaten, je doelen en de geschiedenis van je doelwijzigingen, je instellingen, je accountgegevens (e-mailadres, inlogmethoden en inlogdatums, en een eventuele naam of foto die Google meestuurde), je gebruikstelemetrie van tools, de koppelingen waarmee je AI-apps en de synchronisatie met Apple Health ingelogd blijven (zonder de tokens zelf), en het overzicht van de dagtotalen die de afgelopen 8 dagen naar Apple Health zijn gestuurd. Niet inbegrepen zijn: de waarden die we om veiligheidsredenen alleen als eenrichtingshash bewaren (je wachtwoord en de tokens van je koppelingen), interne administratie zoals sleutels voor duplicaatdetectie, het runtimelog van de server, dat je account-ID niet bevat, en de eigen kortlevende logs en doorlopende back-ups van onze dienstverleners.",
                        "<strong>Rectificatie</strong> — vraag je AI-assistent om een registratie van een maaltijd, water, gewicht of lichaamsmaat te corrigeren of te verwijderen, of om je doelen en instellingen aan te passen.",
                        "<strong>Gegevenswissing</strong> — vraag je AI-assistent om je account te verwijderen; daarmee verdwijnt alles in één keer.",
                        "<strong>Bezwaar en beperking van de verwerking</strong> — stuur ons een e-mail.",
                        "<strong>Klacht</strong> — je kunt een klacht indienen bij de toezichthoudende autoriteit voor gegevensbescherming in het land waar je woont of werkt. We stellen het wel op prijs als we het probleem eerst zelf mogen oplossen.",
                    ],
                },
                {
                    type: "p",
                    html: "Alles wat we opslaan, blijft in de hierboven genoemde EU-regio. Wat je AI-assistent via de tools leest, gaat naar de aanbieder van die assistent, die buiten de EU gevestigd kan zijn; dat valt onder je eigen overeenkomst met die aanbieder, niet onder de onze. Cloudflare (het netwerk waar elk verzoek doorheen gaat), Google en Microsoft (website-analyse, Google Sign-In) en Google en jsDelivr (de hierboven beschreven verzoeken voor lettertypen en iconen) zitten eveneens buiten de EU; waar zij persoonsgegevens van buiten de EU ontvangen, baseren ze zich op de standaardcontractbepalingen van de Europese Commissie of op het EU-VS-kader inzake gegevensbescherming (EU–US Data Privacy Framework). De synchronisatie met Apple Health voegt geen doorgifte van onze kant toe: de totalen gaan van onze server naar de opdracht op je iPhone, en wat Apple Health er daarna mee doet, hangt af van je eigen instellingen bij Apple.",
                },
                {
                    type: "p",
                    html: 'De dienst is niet bedoeld voor mensen onder de 16, en volgens de <a href="/terms" data-legal-link="terms">Gebruiksvoorwaarden</a> moet je minstens 16 jaar zijn. Denk je dat iemand die jonger is een account heeft aangemaakt, mail ons dan, dan verwijderen we dat account.',
                },
                {
                    type: "p",
                    html: "Als dit beleid verandert, verandert de datum bovenaan mee.",
                },
            ],
        },
        {
            heading: "Gebruiksvoorwaarden",
            blocks: [
                {
                    type: "p",
                    html: 'Op het gebruik van de dienst zijn ook onze <a href="/terms" data-legal-link="terms">Gebruiksvoorwaarden</a> van toepassing. Die gaan over toegestaan gebruik, het feit dat niets hier medisch advies is, en het ontbreken van enige garantie: de dienst wordt gratis en in de huidige staat aangeboden, zonder garanties voor beschikbaarheid, nauwkeurigheid of geschiktheid voor enig doel.',
                },
            ],
        },
    ],
};

export const TERMS_NL: LegalDoc = {
    title: "Gebruiksvoorwaarden",
    metaDescription:
        "De voorwaarden voor het gebruik van Nutrition MCP, de gratis, open source voedingstracker en remote MCP-server voor Claude en ChatGPT. In gewone taal over accounts, toegestaan gebruik, je gegevens en aansprakelijkheid.",
    ogDescription:
        "De voorwaarden voor het gebruik van Nutrition MCP, de gratis, open source voedingstracker en remote MCP-server voor Claude en ChatGPT.",
    lead: "De voorwaarden voor het gebruik van Nutrition MCP, de gratis, open source voedingstracker en remote MCP-server voor Claude en ChatGPT.",
    documentsLabel: "Juridische documenten",
    tocLabel: "Op deze pagina",
    lastUpdated: "3 oktober 2026",
    backToHome: "Terug naar de startpagina",
    sections: [
        {
            heading: "Overeenkomst",
            blocks: [
                {
                    type: "p",
                    html: "Deze voorwaarden zijn van toepassing op je gebruik van Nutrition MCP (de &ldquo;dienst&rdquo;): de website op nutrition-mcp.com en de remote MCP-server op <strong>https://nutrition-mcp.com/mcp</strong>. Door een account aan te maken of een AI-assistent met de server te verbinden, ga je akkoord met deze voorwaarden. Ga je niet akkoord, gebruik de dienst dan niet.",
                },
                {
                    type: "p",
                    html: "De dienst wordt beheerd door Anton Kutishevskyi, een individuele ontwikkelaar (&ldquo;we&rdquo;, &ldquo;ons&rdquo;).",
                },
            ],
        },
        {
            heading: "De dienst",
            blocks: [
                {
                    type: "p",
                    html: 'Nutrition MCP is een gratis, open source voedingstracker die als MCP-server draait, zodat AI-assistenten zoals Claude en ChatGPT namens jou maaltijden, water, lichaamsgewicht en lichaamsmaten kunnen loggen. Als je wilt, kan een opdracht op je iPhone je dagtotalen naar Apple Health kopiëren. Er is geen betaalde versie, er zijn geen advertenties en aan het gebruik van de dienst zijn geen kosten verbonden. We nemen vrijwillige donaties aan via Patreon om de kosten van hosting en de database te helpen dekken; dat zijn giften, geen aankopen, en je koopt er geen functies, geen andere versie en geen enkele vorm van voorrang mee. De broncode is onder de MIT-licentie gepubliceerd op <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a>, en je mag de dienst vrij zelf hosten.',
                },
            ],
        },
        {
            heading: "Je account",
            blocks: [
                {
                    type: "p",
                    html: "Je moet minstens 16 jaar zijn om de dienst te gebruiken. We controleren je leeftijd niet; door een account aan te maken bevestig je dat je aan die eis voldoet. Je bent zelf verantwoordelijk voor het geheimhouden van je inloggegevens en voor alle activiteit die onder je account plaatsvindt. Geef een e-mailadres op waar je echt zelf toegang toe hebt: dat is de enige manier om weer toegang tot je account te krijgen.",
                },
                {
                    type: "p",
                    html: "Je mag de dienst alleen gebruiken waar je AI-aanbieder die ondersteunt en waar de toepasselijke sanctie- en exportcontrolewetgeving dat toestaat.",
                },
            ],
        },
        {
            heading: "Geen medisch advies",
            blocks: [
                {
                    type: "p",
                    html: "Nutrition MCP is een tool voor registratie en rapportage, geen zorgdienst. Niets wat de dienst oplevert (calorie- en macrocijfers, doelen, trends of commentaar dat je AI-assistent toevoegt) is medisch, voedingskundig of dieetadvies, en niets ervan vervangt een gekwalificeerde deskundige. Raadpleeg een arts of diëtist voordat je beslissingen over je gezondheid neemt, zeker als je een medische aandoening hebt of in het verleden met verstoord eetgedrag te maken hebt gehad.",
                },
                {
                    type: "p",
                    html: "De dienst is niet ontworpen voor klinisch gebruik en hoort niet te worden gebruikt door iemand met een actieve eetstoornis, of door iemand die zwanger is of voor een voedingsgerelateerde aandoening onder klinisch toezicht staat, zonder dat diens behandelaar erbij betrokken is. Het bijhouden van calorieën en macro's kan in die situaties schadelijk zijn. Herken je jezelf hierin, overleg dan met je behandelaar voordat je de dienst gebruikt.",
                },
                {
                    type: "p",
                    html: "Voedingswaarden zijn <strong>schattingen</strong>. Ze zijn afkomstig van AI-modellen die je omschrijvingen en foto's interpreteren, van databases van derden zoals Open Food Facts en van wat je zelf invoert. Ze kunnen onjuist zijn. Controleer alles wat ertoe doet.",
                },
                {
                    type: "p",
                    html: "Foto's van eten worden nooit naar onze server gestuurd. Je AI-assistent interpreteert de afbeelding zelf en stuurt ons alleen de tekst en cijfers die dat oplevert: een omschrijving, een maaltijdtype, calorieën, macro's, notities, een barcode.",
                },
            ],
        },
        {
            heading: "Toegestaan gebruik",
            blocks: [
                {
                    type: "p",
                    html: "Als je de dienst gebruikt, ga je ermee akkoord om niet:",
                },
                {
                    type: "ul",
                    items: [
                        "de dienst te gebruiken voor een onwettig doel, of in strijd met toepasselijke wet- of regelgeving;",
                        "te proberen toegang te krijgen tot het account of de gegevens van een andere gebruiker, of authenticatie, snelheidslimieten of enige andere technische maatregel te omzeilen;",
                        "de dienst of de infrastructuur waarop die draait af te tasten, te scannen, te overbelasten of te verstoren, ook niet met geautomatiseerde bulkverzoeken;",
                        "inhoud te uploaden die illegaal is of die je niet mag delen;",
                        "de gehoste dienst door te verkopen of als je eigen dienst te presenteren;",
                        "de dienst te gebruiken om extreme calorierestrictie na te streven, of om dat bij anderen te promoten, te coachen of aan te moedigen.",
                    ],
                },
                {
                    type: "p",
                    html: "Er gelden snelheidslimieten, zodat de dienst voor iedereen beschikbaar blijft. Heb je meer capaciteit nodig, host de dienst dan zelf; daar is de MIT-licentie voor.",
                },
            ],
        },
        {
            heading: "Je gegevens",
            blocks: [
                {
                    type: "p",
                    html: 'Je registraties blijven van jou. We slaan ze op en verwerken ze om de dienst voor je te laten werken, zoals beschreven in ons <a href="/privacy" data-legal-link="privacy">Privacybeleid</a>. Je bent zelf verantwoordelijk voor de inhoud die je logt.',
                },
                {
                    type: "p",
                    html: "Je kunt al je gegevens op elk moment exporteren door je AI-assistent te vragen dat te doen. De export is een ZIP-archief met CSV-bestanden voor je maaltijden, water, gewicht, lichaamsmaten, doelen, doelgeschiedenis, profielinstellingen, accountgegevens, gebruikstelemetrie van tools, gekoppelde AI-apps en de synchronisatie met Apple Health; alcohol zit erin, of alcoholregistratie nu aanstaat of niet. De downloadlink die we je geven, is privé en verloopt na 60 minuten.",
                },
                {
                    type: "p",
                    html: "Als je de synchronisatie met Apple Health koppelt, worden je dagtotalen op jouw verzoek in Apple Health op je iPhone geschreven. Daar liggen ze in jouw handen en gelden de voorwaarden van Apple: ontkoppelen of je account verwijderen haalt ze niet weg, en omdat Apple Health een waarde die het al heeft niet kan verlagen, wordt een dag die je later naar beneden bijstelt daar niet bijgewerkt — verwijder die registraties dan zelf in de app Gezondheid. Houd de opdracht op apparaten die alleen jij gebruikt: ze bevat het token waarmee ze de synchronisatie van je account gebruikt, en als je via het menu van de opdracht ontkoppelt, is dat token meteen ongeldig.",
                },
                {
                    type: "p",
                    html: "We registreren ook eenvoudige operationele telemetrie over hoe de dienst wordt gebruikt: per toolaanroep de naam van de tool, of de aanroep slaagde, hoe lang die duurde, een globale foutcategorie als die mislukt, de lengte van een opgevraagde datumperiode, de sessie-ID, de revisie van het MCP-protocol waarmee je AI-app verbinding maakte, en de naam en versie die die app over zichzelf opgeeft. Deze regels zijn gekoppeld aan je account-ID. Ze bevatten niet wat je hebt gelogd: geen omschrijvingen van eten, geen calorieën, geen gewichten of lichaamsmaten. We gebruiken ze om de dienst werkend te houden en om te zien welke tools het verbeteren waard zijn, en ze worden samen met al het andere verwijderd wanneer je je account verwijdert.",
                },
                {
                    type: "p",
                    html: "Je kunt je account en alle bijbehorende gegevens op elk moment verwijderen door je AI-assistent, terwijl die verbonden is, te vragen <strong>je account te verwijderen</strong>. Dat gebeurt direct en is onomkeerbaar.",
                },
            ],
        },
        {
            heading: "Beschikbaarheid en wijzigingen",
            blocks: [
                {
                    type: "p",
                    html: "De dienst wordt gratis aangeboden, zonder toezegging over de beschikbaarheid en zonder service level agreement. We kunnen elk onderdeel ervan, inclusief tools, functies en de gehoste server zelf, op elk moment en zonder aankondiging wijzigen, opschorten of stopzetten. Ook kunnen we inhoud die deze voorwaarden schendt aanpassen of verwijderen.",
                },
            ],
        },
        {
            heading: "Diensten van derden",
            blocks: [
                {
                    type: "p",
                    html: "De dienst is afhankelijk van derden: Supabase voor de database, authenticatie en exportopslag, DigitalOcean voor hosting, Cloudflare (via onze hostingprovider) voor het netwerk waar elk verzoek doorheen gaat, Open Food Facts voor barcodegegevens, de apps Opdrachten en Gezondheid van Apple als je de synchronisatie met Apple Health koppelt, en de AI-assistent waarmee je verbinding maakt, welke dat ook is.",
                },
                {
                    type: "p",
                    html: 'Productgegevens bij barcodes &copy; bijdragers aan <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, beschikbaar onder de <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                },
                {
                    type: "p",
                    html: "De website zelf gebruikt daarnaast, met je toestemming, Google Analytics en Microsoft Clarity om het verkeer en het gebruik van de pagina's te meten, Google Fonts en het jsDelivr-CDN om lettertypen en iconen te laden, Google Sign-In als je op die manier inlogt, en de GitHub API, die onze server (niet je browser) raadpleegt voor het aantal sterren van het project, zodat er geen bezoekersgegevens bij GitHub terechtkomen. Bij het laden van een pagina worden dus verzoeken gedaan aan Google Fonts en jsDelivr, die je IP-adres en browser kunnen zien; Google Analytics en Microsoft Clarity worden pas benaderd nadat je met analyse hebt ingestemd.",
                },
                {
                    type: "p",
                    html: "Voor hun voorwaarden en hun beschikbaarheid zijn zij zelf verantwoordelijk, niet wij.",
                },
            ],
        },
        {
            heading: "Geen garantie",
            blocks: [
                {
                    type: "p",
                    html: "De dienst wordt geleverd <strong>&ldquo;in de huidige staat&rdquo; en &ldquo;voor zover beschikbaar&rdquo;</strong>, zonder garanties van welke aard ook, uitdrukkelijk of stilzwijgend, met inbegrip van stilzwijgende garanties van verkoopbaarheid, geschiktheid voor een bepaald doel, nauwkeurigheid of het niet inbreuk maken op rechten van derden. We garanderen niet dat de dienst ononderbroken, veilig of foutloos zal werken, of dat de gegevens of voedingswaarden die hij oplevert juist zijn. Je gebruikt de dienst op eigen risico.",
                },
            ],
        },
        {
            heading: "Beperking van aansprakelijkheid",
            blocks: [
                {
                    type: "p",
                    html: "Voor zover de wet dat maximaal toestaat, zijn we niet aansprakelijk voor indirecte schade, incidentele schade, bijzondere schade, gevolgschade of punitieve schadevergoedingen, noch voor verlies van gegevens of winst, voortvloeiend uit of verband houdend met je gebruik van de dienst.",
                },
            ],
        },
        {
            heading: "Je wettelijke rechten",
            blocks: [
                {
                    type: "p",
                    html: "Bepaalde aansprakelijkheid kan nooit worden uitgesloten, en dat proberen we ook niet. We blijven volledig aansprakelijk voor overlijden of lichamelijk letsel dat door onze nalatigheid is veroorzaakt, en voor fraude of een bedrieglijke voorstelling van zaken.",
                },
                {
                    type: "p",
                    html: "Je behoudt ook alle rechten die de wet je als consument geeft. Deze voorwaarden gelden naast die rechten en doen er niets aan af. Als een bepaling hierboven in strijd is met een recht waarvan je geen afstand kunt doen, gaat je wettelijke recht voor.",
                },
            ],
        },
        {
            heading: "Beëindiging",
            blocks: [
                {
                    type: "p",
                    html: "Je kunt op elk moment stoppen met het gebruik van de dienst en je account verwijderen zoals hierboven beschreven. We kunnen toegang opschorten of beëindigen als die in strijd is met deze voorwaarden of de stabiliteit of veiligheid van de dienst in gevaar brengt. De secties &ldquo;Geen garantie&rdquo;, &ldquo;Beperking van aansprakelijkheid&rdquo; en &ldquo;Je wettelijke rechten&rdquo; blijven ook na beëindiging van kracht.",
                },
            ],
        },
        {
            heading: "Wijzigingen in deze voorwaarden",
            blocks: [
                {
                    type: "p",
                    html: "We kunnen deze voorwaarden van tijd tot tijd bijwerken. De actuele versie staat altijd op deze pagina; de datum bovenaan laat zien wanneer die voor het laatst is gewijzigd. Als je de dienst na een wijziging blijft gebruiken, aanvaard je daarmee de herziene voorwaarden.",
                },
            ],
        },
        {
            heading: "Deelbaarheid",
            blocks: [
                {
                    type: "p",
                    html: "Als een deel van deze voorwaarden niet afdwingbaar blijkt, vervalt dat deel en blijft de rest van kracht.",
                },
            ],
        },
        {
            heading: "Contact",
            blocks: [
                {
                    type: "p",
                    html: 'Vragen over deze voorwaarden of over je gegevens? Mail naar <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                },
            ],
        },
    ],
};

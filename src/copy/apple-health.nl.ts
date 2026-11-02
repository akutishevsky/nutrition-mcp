// Dutch /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcuts' names, their menu items
// (Sync now, Status, Disconnect) and the automation input `auto` stay in
// English: one shared shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_NL: AppleHealthDoc = {
    meta: {
        title: "Apple Health-opdrachten",
        description:
            "Twee gratis iPhone-opdrachten verbinden Nutrition MCP en Apple Health: Nutrition MCP Health kopieert de dagtotalen die je bijhoudt door met je AI te chatten (calorieën, eiwit, koolhydraten, vet, vezels, cafeïne en desgewenst water) naar Apple Health, en Nutrition MCP Activity haalt je dagelijkse Actieve energie terug als actieve calorieën.",
        ogDescription:
            "Dagtotalen naar Apple Health, Actieve energie terug naar Nutrition MCP: twee gratis iPhone-opdrachten, gebruik er een of beide.",
    },
    tocLabel: "Op deze pagina",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP en Apple Health, in beide richtingen",
        lead: "Twee gratis iPhone-opdrachten, één voor elke richting. De ene kopieert wat je eet naar Apple Health, de andere brengt de energie die je verbrandt terug naar Nutrition MCP. Gebruik er een of beide: ze koppelen, synchroniseren en ontkoppelen elk op zichzelf.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Je dagtotalen, in Apple Health",
            items: [
                "Eén invoer per voedingsstof voor elke afgeronde dag, om <strong>12:00</strong>, vanuit <strong>Opdrachten</strong>.",
                "Een dag is afgerond om <strong>05:00</strong> de volgende ochtend in jouw tijdzone, dus gisteren komt binnen na 05:00 vandaag. Vandaag staat er nooit bij.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Je Actieve energie, als actieve calorieën",
            items: [
                "Je totaal <strong>Actieve energie</strong> voor vandaag en de 2 dagen ervoor, naast wat je at. Je caloriedoel verandert nooit.",
                "Eén invoer per dag, die bij elke synchronisatie wordt vervangen, zodat vaak synchroniseren nooit een dag dubbel telt.",
            ],
        },
        nutrientsLabel: "Elke dag verstuurd",
        nutrients: {
            energy_kcal: "Voedingsenergie",
            protein_g: "Eiwitten",
            carbohydrates_g: "Koolhydraten",
            fat_g: "Totaal vet",
            fiber_g: "Vezels",
            caffeine_mg: "Cafeïne",
            water_ml: "Water",
        },
        waterNote: "als je dat kiest",
        alcoholNote: "Alcohol wordt nooit verstuurd.",
        readLabel: "Elke synchronisatie leest",
        activeEnergy: "Actieve energie",
    },
    before: {
        title: "Voordat je begint",
        items: [
            "Een iPhone met de apps <strong>Opdrachten</strong> en <strong>Gezondheid</strong>. Beide zitten standaard in iOS.",
            "Een Nutrition MCP-account dat al gekoppeld is aan je AI-app, zoals Claude of ChatGPT. Beide opdrachten loggen in met precies dat account.",
            "Aanbevolen: je tijdzone in je profiel, want die bepaalt waar een dag eindigt. Zeg gewoon <em>&ldquo;stel mijn tijdzone in&rdquo;</em> in de chat. Heb je er nooit een ingesteld, dan geldt de tijdzone die je iPhone doorgeeft bij het verbinden.",
        ],
    },
    install: {
        title: "Installeer de opdrachten",
        lead: "Installeer er een of beide. Open een link op je iPhone en tik op <strong>Voeg opdracht toe</strong>; ze verschijnt in de Opdrachten-app onder haar eigen naam.",
        button: "Download de opdracht",
        pending: "De link naar de opdracht wordt hier binnenkort gepubliceerd.",
        leadPending:
            "De opdrachten zijn nog niet gepubliceerd. Zodra dat zo is, open je een link op je iPhone en tik je op <strong>Voeg opdracht toe</strong>, en dan verschijnt de opdracht in de Opdrachten-app onder haar eigen naam. De stappen hieronder laten zien wat er daarna komt.",
        healthBlurb: "Stuurt je dagtotalen naar Apple Health.",
        activityBlurb: "Leest je Actieve energie uit Apple Health.",
        nameNote:
            "Houd de namen precies <strong>Nutrition MCP Health</strong> en <strong>Nutrition MCP Activity</strong>. De inlogpagina opent elke opdracht opnieuw via haar naam, dus als je er een hernoemt, stopt het verbinden halverwege.",
    },
    connect: {
        title: "Verbind ze",
        steps: [
            "Tik in de Opdrachten-app op de opdracht om haar uit te voeren.",
            "Beantwoord haar vragen (hieronder), daarna opent Safari een inlogpagina. Log in met <strong>hetzelfde account als je AI-app</strong>. De pagina toont een melding over het koppelen van Apple Health: ga alleen verder als je dit zelf net hebt gestart, vanuit de opdracht op je eigen iPhone.",
            "Vraagt Safari of Opdrachten mag worden geopend, tik dan op <strong>Open</strong>. De opdracht rondt het verbinden af.",
        ],
        health: {
            label: "Nutrition MCP Health vraagt",
            items: [
                "Of ook <strong>water</strong> moet worden verstuurd (laat dat uit als je Apple Watch of een andere app al water bijhoudt), en welke dagen ze moet versturen: <strong>From today</strong> of <strong>Also the last 7 days</strong>.",
                "De eerste keer dat er een dag wordt verstuurd, vraagt Apple Health wat Opdrachten mag schrijven: zet <strong>elk type</strong> aan en tik op <strong>Sta toe</strong>. Koos je <strong>Also the last 7 days</strong> en heb je in die dagen maaltijden vastgelegd, dan gebeurt dat meteen. Anders is er nog niets te versturen: open morgen na 05:00 de opdracht en tik één keer op <strong>Sync now</strong> om de vraag te beantwoorden.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity vraagt",
            items: [
                "Niets vóór het inloggen, behalve een korte melding over wat ze leest. Haar eerste synchronisatie loopt meteen na het verbinden.",
                "Apple Health vraagt of Opdrachten <strong>Actieve energie</strong> mag lezen: tik op <strong>Sta toe</strong>. Daarna vraagt iOS of de opdracht gezondheidsgegevens naar nutrition-mcp.com mag sturen: kies <strong>Altijd toestaan</strong>, anders stopt elke automatische uitvoering bij die vraag.",
            ],
        },
        note: "De inloglink werkt één keer, 30 minuten lang. Is hij verlopen, voer de opdracht dan opnieuw uit. Verbind de twee opdrachten na elkaar, niet tegelijk. Bij Nutrition MCP Health komt je eerste afgeronde dag morgen na 05:00 binnen; koos je de laatste 7 dagen, dan worden die meteen verstuurd.",
    },
    automate: {
        title: "Laat ze automatisch lopen",
        lead: "Een gedeelde opdracht kan haar automatiseringen niet meenemen, dus maak ze één keer aan in het tabblad <strong>Automatisering</strong> van de Opdrachten-app, voor elke opdracht die je gebruikt. De eerste trigger van elk is de belangrijkste; de andere halen in wat je mist.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "App → Gezondheid → Is geopend",
                tag: "Belangrijkste",
                body: "Gezondheid openen is precies het moment waarop je wilt dat alles bij is.",
            },
            {
                when: "Wekker → Is gestopt",
                tag: "Inhalen in de ochtend",
                body: "Een wekker die je na 05:00 uitzet, zoals je ochtendwekker, verstuurt gisteren zodra die dag is afgerond.",
            },
            {
                when: "Oplader → Is aangesloten",
                tag: "Optioneel",
                body: "Je iPhone 's nachts of aan je bureau aan de oplader leggen is nog een kans om te synchroniseren.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "App → Claude of ChatGPT → Is geopend",
                tag: "Belangrijkste",
                body: "Je AI-app openen is precies het moment waarop je wilt vragen hoe je dag verloopt, dus de verbranding van vandaag is al bijgewerkt voordat je het vraagt.",
            },
            {
                when: "App → Gezondheid of Fitness → Is geopend",
                tag: "Ook",
                body: "Je ringen of je trainingen bekijken is nog een kans om te synchroniseren.",
            },
            {
                when: "Tijd van de dag",
                tag: "Gedurende de dag",
                body: "Er is geen trigger &ldquo;elk uur&rdquo;, dus voeg er een paar toe, bijvoorbeeld om 12:00, 18:00 en 22:00, om de dagen te vangen waarop je geen van beide apps opent.",
            },
        ],
        stepsLabel: "Voor elk ervan",
        steps: [
            "In de Opdrachten-app open je het tabblad <strong>Automatisering</strong> en tik je op <strong>+</strong> om een persoonlijke automatisering aan te maken.",
            "Kies de trigger, bijvoorbeeld <strong>App</strong> → <strong>Gezondheid</strong> → <strong>Is geopend</strong>.",
            "Kies <strong>Voer direct uit</strong> en zet <strong>Meld bij uitvoeren</strong> uit als je iPhone die optie biedt.",
            "Voeg de actie <strong>Voer opdracht uit</strong> toe, kies <strong>Nutrition MCP Health</strong> of <strong>Nutrition MCP Activity</strong>, en stel de invoer in op de tekst <code>auto</code>.",
        ],
        note: "Met de invoer <code>auto</code> blijven automatische uitvoeringen stil: ze melden zich alleen als iets je aandacht nodig heeft. Een exact tijdstip is niet nodig: Nutrition MCP Health kijkt bij elke synchronisatie terug over de laatste 7 afgeronde dagen, en Nutrition MCP Activity stuurt vandaag en de 2 dagen ervoor opnieuw, dus een gemiste uitvoering haalt zichzelf in.",
    },
    everyday: {
        title: "Dagelijks gebruik",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "Iets vergeten te loggen?",
                body: "Voeg het zoals altijd toe in de chat. Is die dag al verstuurd en valt hij binnen de laatste 7 dagen, dan vult de volgende synchronisatie de dag aan met een kleine extra invoer om 12:01, 12:02 enzovoort. Wijzigingen onder ongeveer 20 kcal of 2 g worden overgeslagen; een heel grote sprong, of een wijziging na 9 aanvullingen, komt als melding om zelf in te voeren.",
            },
            {
                title: "Een maaltijd verwijderd of verkleind?",
                body: "Apple Health kan iets bij een waarde optellen, maar een waarde niet verlagen. Je krijgt daarom een melding hoeveel de dag nu te hoog is. Zo los je het op: open Gezondheid → <strong>Blader</strong> → <strong>Voeding</strong>, kies het type, tik op <strong>Toon alle gegevens</strong> en veeg naar links over de invoer van die dag afkomstig van Opdrachten om die te verwijderen, en voer daarna zelf het juiste totaal in dat in de melding staat. Gebruik nooit <strong>Verwijder alle gegevens van &lsquo;Opdrachten&rsquo;</strong>: dat wist ook wat je andere opdrachten hebben vastgelegd.",
            },
            {
                title: "Met de hand uitvoeren",
                body: "Tik in de Opdrachten-app op <strong>Nutrition MCP Health</strong> voor het menu: <strong>Sync now</strong> verstuurt alles wat klaarstaat, <strong>Status</strong> toont de laatst verstuurde dag en wanneer de volgende klaar is, en <strong>Disconnect</strong> beëindigt de verbinding.",
            },
            {
                title: "Controleer het in je AI-app",
                body: "Vraag je AI je profiel te tonen (<code>get_profile</code>): daar staat wanneer de synchronisatie is gekoppeld, tot welke dag ze heeft verstuurd en wanneer ze voor het laatst liep.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Grote calorieaantallen bij de vraag om te versturen?",
                body: "Maak je daar geen zorgen over: de opdracht rondt elke dag af op hele kilocalorieën voordat er iets wordt verstuurd. De vraag die iOS stelt, toont Health&rsquo;s ruwe dagsommen met alle decimalen, in het getalformaat van je regio. <strong>922,774 kcal</strong> betekent dus gewoon iets minder dan 923 kcal, want in het Nederlands is de komma de decimaalscheiding. De <strong>0 kcal</strong>-invoeren die ze ook vermeldt, voegen niets toe.",
            },
            {
                title: "Ook een training in de chat gelogd?",
                body: "Op een dag die al is verstuurd, blijft het Apple Health-totaal de telling, en blijven trainingen die je in de chat hebt gelogd in je log staan zonder dat ze er bovenop worden opgeteld: de Actieve energie van je horloge bevat ze al. Op andere dagen tellen ze gewoon mee.",
            },
            {
                title: "Een dag die 0 aangeeft?",
                body: "Een dag zonder Actieve energie, of een dag die Health de opdracht niet liet lezen, wordt niet verstuurd en er wordt niets gewijzigd. Blijft elke dag op 0 staan, sta Opdrachten dan toe Actieve energie te lezen onder Gezondheid → <strong>Delen</strong> → <strong>Apps</strong> → <strong>Opdrachten</strong>.",
            },
            {
                title: "Met de hand uitvoeren",
                body: "Tik in de Opdrachten-app op <strong>Nutrition MCP Activity</strong> voor het menu: <strong>Sync now</strong> verstuurt vandaag en de 2 dagen ervoor, <strong>Status</strong> toont de laatst verstuurde dag, en <strong>Disconnect</strong> beëindigt de verbinding en laat Nutrition MCP Health verbonden.",
            },
        ],
    },
    privacy: {
        title: "Privacy en grenzen",
        items: [
            "Nutrition MCP Health: onze server bewaart de koppeling en, 8 dagen lang, een overzicht van de verstuurde totalen, zodat elke dag één keer wordt verstuurd en daarna alleen wordt aangevuld. We sturen niets naar Apple; de opdracht vraagt onze server om je totalen en schrijft die op je iPhone in Gezondheid, waar je eigen instellingen bij Apple gelden.",
            "Elke opdracht bewaart haar eigen toegangstoken in de eigen opslag van de Opdrachten-app op je iPhone, niet in een bestand, en de Opdrachten-app synchroniseert die mogelijk via iCloud naar je andere apparaten. Wie een opdracht op je apparaten kan uitvoeren, kan de synchronisatie gebruiken tot je ontkoppelt, dus houd ze op apparaten die alleen jij gebruikt.",
            "Alleen de optionele opdracht <strong>Nutrition MCP Activity</strong> leest uit Apple Health, en alleen het dagtotaal Actieve energie. Onze server slaat die totalen op als je actieve calorieën, in je export en verwijderd met je account, zoals de actieve calorieën die je in de chat logt.",
            "Kies in een opdracht op elk moment <strong>Disconnect</strong> en de koppeling van die opdracht wordt direct verwijderd; bij Nutrition MCP Health geldt dat ook voor het overzicht. Elke koppeling vervalt ook vanzelf na 90 dagen zonder synchronisatie, en 365 dagen na het verbinden. Wat al in Apple Health staat, blijft daar tot je het verwijdert, en de actieve calorieën die al zijn verstuurd, blijven staan tot je ze verwijdert.",
        ],
        policyLink: "Lees het privacybeleid",
    },
    troubleshooting: {
        title: "Problemen oplossen",
        lead: "Klopt er iets niet? Deze antwoorden dekken de gebruikelijke gevallen.",
        readMore: "Lees het antwoord",
    },
    selfHost: {
        textHtml:
            "Draai je je eigen server? Hoe de opdrachten stap voor stap worden gebouwd, staat in {link} en {activityLink}.",
        linkText: "de bouwinstructies van Nutrition MCP Health",
        activityLinkText: "de bouwinstructies van Nutrition MCP Activity",
    },
};

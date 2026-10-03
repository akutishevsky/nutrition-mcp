// Dutch /apple-health guide. See src/copy/apple-health.ts for the content
// model and which fields are raw HTML. The shortcut's name, its menu items
// (Sync now, Status, Disconnect) and the automation input `auto` stay in
// English: one shared shortcut serves every locale.

import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_NL: AppleHealthDoc = {
    meta: {
        title: "Synchronisatie met Apple Health",
        description:
            "Stel de gratis opdracht Nutrition MCP Health in op je iPhone: ze kopieert de dagtotalen die je bijhoudt door met je AI te chatten (calorieën, eiwit, koolhydraten, vet, vezels, suiker, cafeïne en desgewenst water) naar Apple Health.",
        ogDescription:
            "Kopieer de dagtotalen die je met je AI bijhoudt naar Apple Health, met één gratis iPhone-opdracht.",
    },
    tocLabel: "Op deze pagina",
    hero: {
        eyebrow: "Synchronisatie met Apple Health · iPhone",
        title: "Je dagtotalen in Apple Health",
        lead: "Een gratis iPhone-opdracht kopieert de totalen van elke afgeronde dag van Nutrition MCP naar Apple Health. Je AI-app blijft het loggen doen; de opdracht stuurt alleen dagen die voorbij zijn.",
        seeTitle: "Wat je in Apple Health ziet",
        seeItems: [
            "Eén invoer per voedingsstof voor elke afgeronde dag, om <strong>12:00</strong>, afkomstig van <strong>Opdrachten</strong>.",
            "Een dag is afgerond om <strong>05:00</strong> de volgende ochtend in jouw tijdzone, dus gisteren komt binnen na 05:00 vandaag. Vandaag staat er nooit bij.",
        ],
        nutrientsLabel: "Elke dag verstuurd",
        nutrients: {
            energy_kcal: "Voedingsenergie",
            protein_g: "Eiwitten",
            carbohydrates_g: "Koolhydraten",
            fat_g: "Totaal vet",
            fiber_g: "Vezels",
            sugar_g: "Suiker",
            caffeine_mg: "Cafeïne",
            water_ml: "Water",
        },
        waterNote: "als je dat kiest",
        alcoholNote: "Alcohol wordt nooit verstuurd.",
    },
    before: {
        title: "Voordat je begint",
        items: [
            "Een iPhone met de apps <strong>Opdrachten</strong> en <strong>Gezondheid</strong>. Beide zitten standaard in iOS.",
            "Een Nutrition MCP-account dat al gekoppeld is aan je AI-app, zoals Claude of ChatGPT. De opdracht logt in met precies dat account.",
            "Aanbevolen: je tijdzone in je profiel, want die bepaalt waar een dag eindigt. Zeg gewoon <em>&ldquo;stel mijn tijdzone in&rdquo;</em> in de chat. Heb je er nooit een ingesteld, dan geldt de tijdzone die je iPhone doorgeeft bij het verbinden.",
        ],
    },
    install: {
        title: "Installeer de opdracht",
        lead: "Open de link op je iPhone en tik op <strong>Voeg opdracht toe</strong>. Ze verschijnt in de Opdrachten-app als <strong>Nutrition MCP Health</strong>.",
        button: "Download de opdracht",
        pending: "De link naar de opdracht wordt hier binnenkort gepubliceerd.",
        leadPending:
            "De opdracht is nog niet gepubliceerd. Zodra dat zo is, open je de link op je iPhone en tik je op <strong>Voeg opdracht toe</strong>; ze verschijnt dan in de Opdrachten-app als <strong>Nutrition MCP Health</strong>. De stappen hieronder laten zien wat er daarna gebeurt.",
        nameNote:
            "Houd de naam precies <strong>Nutrition MCP Health</strong>. De inlogpagina opent de opdracht opnieuw via die naam, dus als je haar hernoemt, stopt het verbinden halverwege.",
    },
    connect: {
        title: "Verbind haar",
        steps: [
            "Tik in de Opdrachten-app op <strong>Nutrition MCP Health</strong> om haar uit te voeren.",
            "Beantwoord twee vragen: of ook <strong>water</strong> moet worden verstuurd (laat dat uit als je Apple Watch of een andere app al water bijhoudt), en welke dagen ze moet versturen: <strong>From today</strong> of <strong>Also the last 7 days</strong>.",
            "Safari opent een inlogpagina. Log in met <strong>hetzelfde account als in je AI-app</strong>. De pagina toont een melding over het koppelen van Apple Health: ga alleen verder als je dit zelf net hebt gestart, vanuit de opdracht op je eigen iPhone.",
            "Vraagt Safari of Opdrachten mag worden geopend, tik dan op <strong>Open</strong>. De opdracht rondt het verbinden af.",
            "De eerste keer dat er een dag wordt verstuurd, vraagt Apple Health wat Opdrachten mag schrijven: zet <strong>elk type</strong> aan en tik op <strong>Sta toe</strong>. Koos je <strong>Also the last 7 days</strong> en heb je in die dagen maaltijden vastgelegd, dan gebeurt dat meteen. Anders is er nog niets te versturen: open morgen na 05:00 de opdracht en tik één keer op <strong>Sync now</strong> om de vraag te beantwoorden.",
        ],
        note: "De inloglink werkt één keer, 30 minuten lang. Is hij verlopen, voer de opdracht dan opnieuw uit. Je eerste afgeronde dag komt morgen na 05:00 binnen; koos je de laatste 7 dagen, dan worden die meteen verstuurd.",
    },
    automate: {
        title: "Laat het automatisch lopen",
        lead: "Een gedeelde opdracht kan haar automatiseringen niet meenemen, dus maak ze één keer aan in het tabblad <strong>Automatisering</strong> van de Opdrachten-app. De eerste is de belangrijkste; de andere halen in wat je mist als je Gezondheid niet opent.",
        triggersLabel: "Wanneer ze moet lopen",
        triggers: [
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
        stepsLabel: "Voor elk ervan",
        steps: [
            "Open in de Opdrachten-app het tabblad <strong>Automatisering</strong> en tik op <strong>+</strong> om een persoonlijke automatisering aan te maken.",
            "Kies de trigger, bijvoorbeeld <strong>App</strong> → <strong>Gezondheid</strong> → <strong>Is geopend</strong>.",
            "Kies <strong>Voer direct uit</strong> en zet <strong>Meld bij uitvoeren</strong> uit als je iPhone die optie biedt.",
            "Voeg de actie <strong>Voer opdracht uit</strong> toe, kies <strong>Nutrition MCP Health</strong> en stel de invoer in op de tekst <code>auto</code>.",
        ],
        note: "Met de invoer <code>auto</code> blijven automatische uitvoeringen stil: ze melden zich alleen als iets je aandacht nodig heeft. Een exact tijdstip is niet nodig: elke synchronisatie kijkt terug over de laatste 7 afgeronde dagen, dus een gemiste ochtend wordt vanzelf ingehaald.",
    },
    everyday: {
        title: "Dagelijks gebruik",
        cards: [
            {
                title: "Iets vergeten te loggen?",
                body: "Voeg het zoals altijd toe in de chat. Is die dag al verstuurd en valt hij binnen de laatste 7 dagen, dan vult de volgende synchronisatie de dag aan met een kleine extra invoer om 12:01, 12:02 enzovoort. Wijzigingen onder ongeveer 20 kcal of 2 g worden overgeslagen; een heel grote sprong, of een wijziging na 9 aanvullingen, komt als melding om zelf in te voeren.",
            },
            {
                title: "Een maaltijd verwijderd of verkleind?",
                body: "Apple Health kan iets bij een waarde optellen, maar een waarde niet verlagen. Je krijgt daarom een melding hoeveel de dag nu te hoog is. Zo los je het op: open Gezondheid → <strong>Blader</strong> → <strong>Voeding</strong>, kies het type, tik op <strong>Toon alle gegevens</strong> en veeg naar links over de invoer van die dag afkomstig van Opdrachten om die te verwijderen, en voer daarna het juiste totaal uit de melding zelf in. Gebruik nooit <strong>Verwijder alle gegevens van &lsquo;Opdrachten&rsquo;</strong>: dat wist ook wat je andere opdrachten hebben vastgelegd.",
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
    },
    privacy: {
        title: "Privacy en grenzen",
        items: [
            "Onze server bewaart de koppeling en, 8 dagen lang, een overzicht van de verstuurde totalen, zodat elke dag één keer wordt verstuurd en daarna alleen wordt aangevuld. Beide zitten in je gegevensexport.",
            "De opdracht bewaart haar toegangstoken in haar eigen opslag in de Opdrachten-app op je iPhone, niet in een bestand, en de Opdrachten-app synchroniseert het mogelijk via iCloud naar je andere apparaten. Wie de opdracht op je apparaten kan uitvoeren, kan de synchronisatie gebruiken tot je ontkoppelt, dus houd haar op apparaten die alleen jij gebruikt.",
            "We sturen niets naar Apple. De opdracht vraagt onze server om je totalen en schrijft ze op je iPhone in Gezondheid; vanaf daar gelden je eigen instellingen bij Apple.",
            "Kies op elk moment <strong>Disconnect</strong> en de koppeling en haar overzicht worden direct verwijderd. Ze vervalt ook vanzelf na 90 dagen zonder synchronisatie, en 365 dagen na het verbinden. Wat al in Apple Health staat, blijft daar tot je het verwijdert.",
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
            "Draai je je eigen server? Hoe de opdracht stap voor stap wordt gebouwd, staat in {link}.",
        linkText: "de bouwinstructies",
    },
};

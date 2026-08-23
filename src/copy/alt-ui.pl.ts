import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_PL: AltUiCopy = {
    breadcrumbHome: "Strona główna",
    breadcrumbAlternatives: "Alternatywy",
    ctaQuickInstall: "Szybka instalacja",
    ctaClosingTitle: "Śledź odżywianie wewnątrz AI, którego już używasz.",
    disclaimerAppHtml:
        "{app} jest znakiem towarowym należącym do jego właściciela. Nutrition MCP jest niezależnym, open-source'owym projektem i nie jest powiązany z {app}, nie jest przez niego popierany ani sponsorowany. Porównania odzwierciedlają publicznie dostępne informacje w momencie pisania i mogą ulec zmianie.",
    disclaimerHubHtml:
        "{apps} oraz inne nazwy produktów są znakami towarowymi należącymi do ich właścicieli. Nutrition MCP jest niezależnym, open-source'owym projektem i nie jest z nimi powiązany ani przez nie popierany. Porównania odzwierciedlają publicznie dostępne informacje w momencie pisania i mogą ulec zmianie.",

    app: {
        heroEyebrow: "Alternatywa dla {app}",
        heroTitleHtml: "Szukasz serwera <em>{app} MCP</em>?",
        heroLead:
            "{app} go nie ma — więc nie możesz go używać wewnątrz Claude ani ChatGPT. Nutrition MCP wykonuje to samo zadanie przez rozmowę, i jest darmowy oraz open source.",
        ctaConnect: "Połącz się w mniej niż minutę",
        ctaSeeComparison: "Zobacz porównanie",

        answerEyebrow: "Krótka odpowiedź",
        answerTitle: "Nie, {app} nie ma serwera MCP.",
        answerBodyHtml:
            "Model Context Protocol (MCP) to otwarty standard, który pozwala asystentom AI, takim jak Claude i ChatGPT, łączyć się z zewnętrznymi narzędziami. {app} nie udostępnia serwera MCP, więc nie ma oficjalnego sposobu, żeby zapisywać do niego jedzenie ze swojego AI. Jeśli szukałeś/aś &bdquo;{app} MCP&rdquo; albo &bdquo;połącz {app} z Claude&rdquo;, tak naprawdę chodzi Ci o tracker odżywiania, który działa <em>wewnątrz</em> Twojego AI — dokładnie tym jest Nutrition MCP.",

        insteadEyebrow: "Co dostajesz zamiast tego",
        insteadTitle: "To samo śledzenie, tylko przez rozmowę",
        features: [
            {
                title: "Posiłki zwykłym językiem",
                body: "Powiedz &bdquo;owsianka z bananem i masłem orzechowym&rdquo; — Twój AI szacuje kalorie i makroskładniki, wliczając błonnik, cukry ogółem i kofeinę, i to zapisuje. Bez przeszukiwania bazy danych.",
            },
            {
                title: "Skanowanie kodów kreskowych — za darmo",
                body: "Wyślij kod kreskowy produktu i pobierz makroskładniki z etykiety z Open Food Facts — błonnik i cukier też, gdy etykieta je podaje. Bez subskrypcji Premium, żeby to odblokować.",
            },
            {
                title: "Waga &amp; cele",
                body: "Zapisuj masę ciała w kg albo lb, ustawiaj cele kaloryczne, makroskładnikowe, błonnika, cukru, kofeiny i wody — błonnik jako cel do osiągnięcia, cukier i kofeinę jako limity, których nie należy przekraczać — i śledź trendy w kierunku wagi docelowej. Śledzenie alkoholu też jest dostępne, opcjonalnie i wyłączone, dopóki go nie włączysz.",
            },
            {
                title: "Podsumowania &amp; trendy",
                body: "Poproś o dzienne sumy, tygodniowe trendy, serie i powtarzające się wzorce posiłków — od razu w czacie.",
            },
            {
                title: "Import &amp; własność Twoich danych",
                body: "Zaimportuj historię posiłków z eksportu CSV innej aplikacji — parsowanego w Twojej przeglądarce, a nie przez AI. Zabierz wszystko z powrotem, kiedy tylko zechcesz: jeden ZIP z Twoimi posiłkami, wodą, wagą, celami i profilem jako plikami CSV. Na razie tylko posiłki można zaimportować z powrotem. Albo usuń swoje konto, równie łatwo.",
            },
            {
                title: "Open source &amp; za darmo",
                body: "Na licencji MIT i z możliwością samodzielnego hostingu — bez reklam, bez płatnego muru, bez naciągania na upgrade. Sprawdź kod albo uruchom własną instancję.",
            },
        ],

        compareEyebrow: "{app} kontra Nutrition MCP",
        compareTitle: "Jak wypadają na tle siebie",
        pros: [
            "Zbudowany jako serwer MCP — działa wewnątrz Claude &amp; ChatGPT",
            "Opisuj posiłki zwykłym językiem; kalorie, makroskładniki, błonnik, cukier &amp; kofeina szacowane za Ciebie",
            "Skanowanie kodów kreskowych, trendy, import &amp; eksport CSV — wszystko za darmo",
            "Bez osobnej aplikacji, bez reklam, open source",
        ],

        movingEyebrow: "Przenosisz się z {app}",

        importEyebrow: "Twoja historia z {app}",
        importSub:
            "Poproś o import, a w czacie otworzy się importer: wybierz swój eksport, zmapuj kolumny, obejrzyj podgląd tego, co zostanie dodane, a potem potwierdź. Plik jest odczytywany w Twojej przeglądarce — AI nigdy nie widzi wierszy. W klientach bez paneli w czacie wklej zamiast tego swój eksport.",

        switchEyebrow: "Jak się przenieść",
        switchSub:
            "Działa z każdym klientem MCP, który obsługuje OAuth 2.0 z PKCE. Przy pierwszym połączeniu zakładasz konto przez Google albo e-mail i hasło.",
        installSteps: [
            "Otwórz <strong>Claude</strong> (w przeglądarce albo aplikacji) i kliknij <strong>Customize</strong> → <strong>Connectors</strong>.",
            "Kliknij <strong>+</strong>, potem <strong>Add custom connector</strong>, i nadaj mu nazwę, na przykład <strong>Nutrition</strong>.",
            "Wklej {copyUrl} w pole <strong>Remote MCP server URL</strong> i kliknij <strong>Add</strong>.",
            "Kliknij <strong>Connect</strong>, zaloguj się i zacznij zapisywać, mówiąc, co zjadłeś/aś.",
        ],
        installNoteTemplate:
            "Używasz ChatGPT albo innego klienta? {link} obejmuje ChatGPT, Cursor, VS Code, Claude Code i inne.",
        installLinkText: "Pełny przewodnik instalacji",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "{app} &amp; MCP — pytania",
        faq: {
            mcpQ: "Czy {app} ma serwer MCP?",
            mcpA: "Nie. {app} nie oferuje serwera Model Context Protocol (MCP), więc nie ma oficjalnego sposobu, żeby połączyć go z Claude, ChatGPT ani innymi asystentami AI. Nutrition MCP to darmowa, open-source'owa alternatywa zbudowana jako serwer MCP od podstaw, dzięki czemu możesz zapisywać posiłki i makroskładniki bezpośrednio wewnątrz swojego AI.",
            connectQ: "Jak połączyć {app} z Claude?",
            connectA:
                "Nie ma oficjalnego konektora {app} dla Claude, ponieważ {app} nie ma serwera MCP ani publicznej integracji MCP. Najbliższą opcją jest Nutrition MCP, darmowy serwer MCP: dodaj https://nutrition-mcp.com/mcp jako niestandardowy konektor w Claude, zaloguj się i zacznij zapisywać przez rozmowę.",
            goodAltQ: "Czy Nutrition MCP to dobra alternatywa dla {app}?",
            goodAltA:
                "Jeśli chcesz śledzić kalorie, makroskładniki — wliczając błonnik, cukry ogółem i kofeinę — wodę i wagę bez otwierania osobnej aplikacji czy przeszukiwania bazy danych jedzenia, to tak. Zamiast klikać przez bazę danych, opisujesz zwykłym językiem, co zjadłeś/aś, wysyłasz zdjęcie albo skanujesz kod kreskowy, a Twój AI to zapisuje — całkowicie za darmo i open source.",
            importQ: "Czy mogę zaimportować swoje dane z {app}?",
            readExportQ: "Czy AI czyta mój plik eksportu podczas importu?",
            readExportA:
                "Nie, gdy otwiera się importer. Parsuje CSV w Twojej przeglądarce i pokazuje Ci, co zostanie dodane, zanim cokolwiek zostanie zapisane: ile posiłków, sumę kalorii, wszystko, co musiał oflagować, oraz same wiersze — długi plik wypisuje ich pierwszą część plus liczbę pozostałych, a nie każdą linię. Wysyłane są tylko wiersze, które potwierdzisz, i trafiają jako dane strukturalne, a nie przez odpowiedź AI, więc żaden wiersz nie może zostać błędnie przepisany ani wymyślony po drodze. Każdy wiersz niesie też odcisk treści, więc ponowne uruchomienie tego samego pliku zgłasza te posiłki jako już zapisane, zamiast je duplikować. Jeśli Twój klient nie potrafi wyświetlać paneli w czacie, rozwiązaniem zastępczym jest wklejenie eksportu — na tej ścieżce AI faktycznie go czyta, więc wybieraj importer, kiedy masz taką możliwość.",
            freeQ: "Czy Nutrition MCP jest darmowy?",
            freeAFallback:
                "Tak. Nutrition MCP jest całkowicie darmowy, bez płatnego poziomu, reklam czy funkcji zablokowanych za płatnością — w przeciwieństwie do aplikacji, które chowają część funkcji za subskrypcją. Potrzebujesz tylko konta Claude albo ChatGPT, żeby się połączyć.",
        },
        importFallbackNote:
            " W klientach bez paneli w czacie możesz zamiast tego wkleić swój eksport.",

        ctaClosingSub:
            "Darmowy i open source — bez konta {app}, bez aplikacji do otwierania.",
        ctaOtherAlternatives: "Inne alternatywy",
    },

    hub: {
        heroEyebrow: "Alternatywy MCP",
        heroTitleHtml:
            "Twoja aplikacja do odżywiania nie ma <em>serwera MCP</em>.",
        heroLead:
            "Aplikacje takie jak MyFitnessPal, Cronometer i Lose It! nie mogą się połączyć z Claude ani ChatGPT. Nutrition MCP to darmowy, open-source'owy sposób na śledzenie posiłków, makroskładników i wagi przez rozmowę ze swoim AI.",
        ctaSeeExamples: "Zobacz przykłady",

        appsEyebrow: "Przechodzisz z…",
        appsTitle: "Wybierz swoją obecną aplikację",
        appsSub:
            "Zobacz, jak Nutrition MCP wypada na tle trackera, którego używasz dziś — i jak przenieść swoje zapisywanie oraz dotychczasową historię do swojego AI.",
        noAppNote:
            "Nie widzisz swojej aplikacji? Ona też niemal na pewno nie ma serwera MCP — Nutrition MCP działa tak samo, niezależnie od tego, z czego się przenosisz.",
        requestComparisonLinkText: "Poproś o porównanie",

        importEyebrow: "Przenoszenie Twojej historii",
        importTitle: "Nie musisz zaczynać od zera",
        importSub:
            "Zwykłym powodem, dla którego ludzie zostają, są już zapisane lata historii. Poproś o import, a w czacie otworzy się importer: wybierz swój eksport, zmapuj kolumny, obejrzyj podgląd tego, co zostanie dodane, a potem potwierdź — albo wklej eksport, jeśli Twój klient nie ma paneli w czacie.",
        importBody: [
            "Plik jest parsowany w Twojej przeglądarce, a nie odczytywany przez AI — więc wiersze nie mogą zostać błędnie przepisane po drodze, a Ty widzisz dokładne posiłki, zanim którykolwiek z nich zostanie zapisany. Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor mają swoje kolumny rozpoznawane po nazwie; każdy inny CSV też działa, po prostu wskazujesz mapperowi każdą kolumnę raz. Przenoszą się: data i godzina, jedzenie, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeina w miligramach — a także alkohol, jeśli najpierw włączyłeś/aś jego śledzenie.",
            "Niewygodne szczegóły prawdziwych plików eksportu są obsłużone: daty DD/MM/RRRR i MM/DD/RRRR, energia w kilodżulach oraz w kilokaloriach, europejskie pliki oddzielone średnikami, w których liczby używają przecinka jako separatora dziesiętnego, pola w cudzysłowach ze złamaniami wiersza wewnątrz, końcowe wiersze sum i flagi usuniętych wierszy. Nagłówki kolumn też nie muszą być po angielsku — niemieckie Kalorien czy Ballaststoffe są rozpoznawane, a błonnik, cukier i kofeina są dopasowywane też po hiszpańsku, francusku, włosku i niderlandzku. Tam, gdzie plik jest naprawdę niejednoznaczny — 05/06 może być majem albo czerwcem — importer pokazuje swój odczyt obok wiersza z Twojego własnego pliku i prosi o potwierdzenie zamiast zgadywać. A każdy wiersz niesie odcisk treści, więc ponowny import tego samego pliku zgłasza posiłki jako już zapisane zamiast je duplikować.",
        ],

        ctaSub: "Darmowy i open source — działa z Claude, ChatGPT i dowolnym klientem MCP.",
        ctaStarGithub: "Postaw gwiazdkę na GitHub",
    },
};

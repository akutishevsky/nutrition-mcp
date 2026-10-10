import type { AltUiCopy } from "./alt-ui.js";

export const ALT_UI_PL: AltUiCopy = {
    breadcrumbHome: "Strona główna",
    breadcrumbAlternatives: "Alternatywy",
    breadcrumbAriaLabel: "Ścieżka nawigacji",
    ctaQuickInstall: "Szybka instalacja",
    ctaClosingTitle: "Śledź, co jesz, w AI, którego już używasz.",
    disclaimerAppHtml:
        "{app} jest znakiem towarowym swojego właściciela. Nutrition MCP to niezależny projekt open source — nie jest powiązany z {app}, a {app} go nie popiera ani nie sponsoruje. Porównania opierają się na informacjach publicznie dostępnych w chwili pisania i mogą się zmienić.",
    disclaimerHubHtml:
        "{apps} oraz inne nazwy produktów są znakami towarowymi ich właścicieli. Nutrition MCP to niezależny projekt open source — nie jest z nimi powiązany ani przez nie popierany. Porównania opierają się na informacjach publicznie dostępnych w chwili pisania i mogą się zmienić.",

    app: {
        heroEyebrow: "Alternatywa dla {app}",
        heroTitleHtml: "Szukasz serwera <em>{app} MCP</em>?",
        heroLead:
            "{app} nie udostępnia takiego serwera do podłączenia — więc z poziomu Claude ani ChatGPT nie dodasz wpisów do dziennika {app}. Nutrition MCP robi to samo w rozmowie, a do tego jest darmowy i open source.",
        ctaConnect: "Połącz w niecałą minutę",
        ctaSeeComparison: "Zobacz porównanie",

        answerEyebrow: "Krótka odpowiedź",
        answerTitle: "Nie — {app} nie ma oficjalnego, publicznego serwera MCP.",
        answerBodyHtml:
            "Model Context Protocol (MCP) to otwarty standard, dzięki któremu asystenci AI, tacy jak Claude i ChatGPT, mogą korzystać z zewnętrznych narzędzi. {app} nie udostępnia publicznego serwera MCP, więc nie ma oficjalnego sposobu, by z poziomu AI dodawać posiłki do dziennika {app}. Jeśli wpisujesz w wyszukiwarkę &bdquo;{app} MCP&rdquo; albo &bdquo;połącz {app} z Claude&rdquo;, to tak naprawdę szukasz aplikacji do śledzenia diety, która działa <em>wewnątrz</em> Twojego AI — i właśnie tym jest Nutrition MCP.",

        insteadEyebrow: "Co dostajesz w zamian",
        insteadTitle: "To samo liczenie, tylko w rozmowie",
        features: [
            {
                title: "Posiłki opisane zwykłymi słowami",
                body: "Powiedz &bdquo;owsianka z bananem i masłem orzechowym&rdquo;, a Twoje AI oszacuje kalorie i makroskładniki — łącznie z błonnikiem, cukrami ogółem i kofeiną — i zapisze posiłek. Bez przeszukiwania bazy produktów.",
            },
            {
                title: "Skaner kodów kreskowych za darmo",
                body: "Wyślij kod kreskowy produktu, a makroskładniki z etykiety zostaną pobrane z Open Food Facts — także błonnik i cukier, jeśli etykieta je podaje. Za darmo dla wszystkich, bez subskrypcji.",
            },
            {
                title: "Waga i cele",
                body: "Zapisuj wagę w kg lub lb i obwody dziewięciu partii ciała w cm lub calach, ustaw cele dla kalorii, makroskładników, błonnika, cukru, kofeiny i wody — błonnik jako cel do osiągnięcia, cukier i kofeinę jako limity, których nie przekraczasz — i śledź, jak zbliżasz się do wagi docelowej. Jest też śledzenie alkoholu: opcjonalne i wyłączone, dopóki go nie włączysz.",
            },
            {
                title: "Podsumowania i trendy",
                body: "Pytaj o dzienne sumy, tygodniowe trendy, serie i powtarzające się schematy posiłków — prosto w czacie.",
            },
            {
                title: "Import i pełna kontrola nad danymi",
                body: "Zaimportuj historię posiłków z eksportu CSV innej aplikacji — plik jest odczytywany w Twojej przeglądarce, a nie przez AI. Wszystkie dane pobierzesz, kiedy zechcesz: jeden ZIP z posiłkami, zapisanymi posiłkami, wodą, wagą, wymiarami ciała, celami i profilem, a do tego z danymi konta, telemetrią użycia i połączonymi aplikacjami — wszystko w plikach CSV. Na razie z powrotem da się zaimportować tylko posiłki. Konto możesz też równie łatwo usunąć.",
            },
            {
                title: "Open source i za darmo",
                body: "Licencja MIT i możliwość samodzielnego hostowania — bez reklam, bez funkcji za opłatą, bez namawiania na płatną wersję. Przejrzyj kod albo uruchom własną instancję.",
            },
        ],

        compareEyebrow: "{app} kontra Nutrition MCP",
        otherComparisonsLabel: "Inne porównania:",
        compareTitle: "Jak wypadają w porównaniu",
        pros: [
            "Zbudowany jako serwer MCP — działa w Claude i ChatGPT",
            "Opisujesz posiłki zwykłymi słowami, a kalorie, makroskładniki, błonnik, cukier i kofeina są szacowane za Ciebie",
            "Skaner kodów kreskowych, trendy, import i eksport CSV — wszystko za darmo",
            "Bez osobnej aplikacji, bez reklam, open source",
        ],

        movingEyebrow: "Przechodzisz z {app}",

        importEyebrow: "Twoja historia z {app}",
        importSub:
            "Poproś o import, a importer otworzy się od razu w czacie: wybierz plik eksportu, dopasuj kolumny, sprawdź podgląd tego, co zostanie dodane, i potwierdź. Plik jest odczytywany w Twojej przeglądarce — AI nigdy nie widzi wierszy. W aplikacjach bez paneli w czacie po prostu wklej eksport.",

        switchEyebrow: "Jak się przenieść",
        switchSub:
            "Działa z każdym klientem MCP, który obsługuje OAuth 2.0 z PKCE. Przy pierwszym połączeniu zakładasz konto przez Google albo e-mailem i hasłem.",
        installSteps: [
            'Otwórz <a href="https://claude.ai/directory/nutrition-mcp" target="_blank" rel="noopener noreferrer">Nutrition MCP w katalogu Claude</a>.',
            "Kliknij <strong>Connect</strong> i zaloguj się przez Google albo e-mailem i hasłem.",
            "Zacznij zapisywać — po prostu powiedz, co było na talerzu.",
        ],
        installNoteTemplate:
            "Korzystasz z ChatGPT albo innej aplikacji? {link} opisuje ChatGPT, Cursor, VS Code, Claude Code i inne.",
        installLinkText: "Pełny przewodnik instalacji",

        faqEyebrow: "FAQ",
        faqTitleTemplate: "Pytania o {app} i MCP",
        faq: {
            mcpQ: "Czy {app} ma serwer MCP?",
            mcpA: "Oficjalnego nie ma. {app} nie udostępnia publicznego serwera Model Context Protocol (MCP), więc nie ma oficjalnego sposobu, by dodawać wpisy do dziennika {app} z Claude, ChatGPT czy innych klientów MCP. Istnieją nieoficjalne serwery tworzone przez społeczność, ale {app} ich nie tworzy ani nie wspiera. Nutrition MCP to coś innego: darmowa aplikacja open source do śledzenia diety, od podstaw zbudowana jako serwer MCP, z własnym kontem, która potrafi zaimportować Twój eksport CSV z {app}.",
            connectQ: "Jak połączyć {app} z Claude?",
            connectA:
                "Oficjalnego konektora {app} dla Claude nie ma, bo {app} nie udostępnia publicznego serwera MCP. Jedną z opcji jest Nutrition MCP — darmowy serwer MCP dostępny w katalogu Claude: otwórz go pod adresem https://claude.ai/directory/nutrition-mcp, kliknij Connect, zaloguj się i zacznij zapisywać w rozmowie.",
            goodAltQ: "Czy Nutrition MCP to dobra alternatywa dla {app}?",
            goodAltA:
                "Tak, jeśli chcesz śledzić kalorie, makroskładniki (łącznie z błonnikiem, cukrami ogółem i kofeiną), wodę i wagę bez otwierania osobnej aplikacji i przeszukiwania bazy produktów. Zamiast klikać po bazie danych, opisujesz posiłek zwykłymi słowami, wysyłasz zdjęcie albo skanujesz kod kreskowy, a Twoje AI go zapisuje — całkowicie za darmo i open source.",
            importQ: "Czy mogę zaimportować dane z {app}?",
            readExportQ: "Czy AI czyta mój plik eksportu podczas importu?",
            readExportA:
                "Nie, jeśli otworzy się importer. Odczytuje on CSV w Twojej przeglądarce i zanim cokolwiek zapisze, pokazuje, co zostanie dodane: liczbę posiłków, sumę kalorii, wszystko, co oznaczył do sprawdzenia, i same wiersze — przy długim pliku pierwsze z nich i liczbę pozostałych, a nie każdą linię. Wysyłane są tylko wiersze, które potwierdzisz, i to jako dane strukturalne, a nie przez odpowiedź AI, więc po drodze żaden wiersz nie zostanie błędnie przepisany ani zmyślony. Każdy wiersz ma też swój odcisk treści, więc ponowne wczytanie tego samego pliku zgłosi te posiłki jako już zapisane, zamiast je zdublować — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa. Jeśli Twoja aplikacja nie wyświetla paneli w czacie, zostaje wklejenie eksportu — wtedy AI rzeczywiście go czyta, więc jeśli masz wybór, korzystaj z importera.",
            freeQ: "Czy Nutrition MCP jest darmowy?",
            freeAFallback:
                "Tak. Nutrition MCP jest całkowicie darmowy: nie ma płatnej wersji, reklam ani funkcji za opłatą — w przeciwieństwie do aplikacji, które część funkcji chowają za subskrypcją. Potrzebujesz aplikacji AI obsługującej MCP, np. Claude albo ChatGPT, i darmowego konta Nutrition MCP, które zakładasz przez Google albo e-mailem i hasłem przy pierwszym połączeniu.",
        },
        importFallbackNote:
            " W aplikacjach bez paneli w czacie możesz zamiast tego wkleić eksport.",

        ctaClosingSub:
            "Za darmo i open source — bez konta {app} i bez otwierania kolejnej aplikacji.",
        ctaOtherAlternatives: "Inne alternatywy",
    },

    hub: {
        heroEyebrow: "Alternatywy MCP",
        heroTitleHtml:
            "Twoja aplikacja do liczenia kalorii nie ma oficjalnego <em>serwera MCP</em>.",
        heroLead:
            "Aplikacje takie jak MyFitnessPal, Cronometer czy Lose It! nie dają oficjalnej możliwości dodawania wpisów do dziennika z Claude ani ChatGPT. Nutrition MCP to darmowe rozwiązanie open source: śledzisz posiłki, makroskładniki i wagę, po prostu rozmawiając ze swoim AI — i możesz zaimportować dotychczasową historię.",
        ctaSeeExamples: "Zobacz przykłady",

        appsEyebrow: "Przechodzisz z…",
        appsTitle: "Wybierz aplikację, której używasz",
        appsSub:
            "Zobacz, jak Nutrition MCP wypada na tle aplikacji, której używasz dziś — i jak przenieść zapisywanie posiłków oraz dotychczasową historię do swojego AI.",
        noAppNote:
            "Nie ma tu Twojej aplikacji? Większość aplikacji dietetycznych również nie udostępnia oficjalnego serwera MCP — a Nutrition MCP działa tak samo, niezależnie od tego, z czego się przenosisz.",
        requestComparisonLinkText: "Poproś o porównanie",

        importEyebrow: "Zabierz swoją historię",
        importTitle: "Nie musisz zaczynać od zera",
        importSub:
            "Ludzie zwykle zostają przy starej aplikacji, bo mają w niej lata historii. Poproś o import, a importer otworzy się od razu w czacie: wybierz plik eksportu, dopasuj kolumny, sprawdź podgląd tego, co zostanie dodane, i potwierdź — albo wklej eksport, jeśli Twoja aplikacja nie ma paneli w czacie.",
        importBody: [
            "Plik jest odczytywany w Twojej przeglądarce, a nie przez AI — więc wiersze nie zostaną po drodze błędnie przepisane, a zanim cokolwiek zostanie zapisane, widzisz dokładnie te posiłki, które zostaną dodane. W eksportach z MyFitnessPal, Cronometer, Lose It! i MacroFactor kolumny są rozpoznawane po nazwie; każdy inny CSV też zadziała — wystarczy raz wskazać, co oznacza każda kolumna. Przenoszą się: data i godzina, produkt, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeina w miligramach — a także alkohol, jeśli najpierw włączysz jego śledzenie.",
            "Importer radzi sobie z niewygodnymi szczegółami prawdziwych eksportów: datami DD/MM/RRRR i MM/DD/RRRR, energią w kilodżulach i kilokaloriach, europejskimi plikami rozdzielanymi średnikami z przecinkiem dziesiętnym, polami w cudzysłowach ze znakami nowego wiersza w środku, końcowymi wierszami sum i znacznikami usuniętych wierszy. Nagłówki kolumn nie muszą być po angielsku — niemieckie Kalorien czy Ballaststoffe zostaną rozpoznane, a błonnik, cukier i kofeina są dopasowywane także po hiszpańsku, francusku, włosku i niderlandzku. Gdy plik jest naprawdę niejednoznaczny — 05/06 może oznaczać maj albo czerwiec — importer pokazuje swoją interpretację obok wiersza z Twojego pliku i prosi o potwierdzenie, zamiast zgadywać. A każdy wiersz ma swój odcisk treści, więc ponowny import tego samego pliku zgłosi posiłki jako już zapisane, zamiast je zdublować — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        ],

        ctaSub: "Za darmo i open source — działa z Claude, ChatGPT i każdym klientem MCP.",
        ctaStarGithub: "Postaw gwiazdkę na GitHubie",
    },
};

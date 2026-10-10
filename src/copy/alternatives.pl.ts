import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_PL: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Brak oficjalnego serwera MCP, a część funkcji wymaga płatnego planu. Zobacz darmową alternatywę, w której po prostu rozmawiasz.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Przy każdym produkcie szukasz w bazie i wybierasz właściwy wpis",
            "Część funkcji, np. skaner kodów kreskowych, wymaga płatnego planu",
            "Osobna aplikacja i konto, a w darmowej wersji reklamy",
        ],
        note: "MyFitnessPal to solidna aplikacja z ogromną bazą produktów. To nie zarzut — po prostu inne podejście, dla tych, którzy wolą porozmawiać ze swoim AI, niż klikać w aplikacji.",
        migrate: {
            title: "Bez przekopywania bazy danych",
            body: [
                "MyFitnessPal zdobył popularność dzięki jednej z największych baz produktów na świecie — dziesiątkom milionów wpisów dodanych przez użytkowników. Ta skala jest też jego słabością: przy każdym produkcie przewijasz niemal identyczne wpisy i zgadujesz, który jest dokładny. Zapisywanie w rozmowie całkowicie omija wyszukiwanie — opisujesz, co jesz, produkty ogólne biorą wartości z USDA FoodData Central, jeśli tam są, a szacunki pokrywają resztę.",
                "Nie musisz przy tym porzucać swojego dziennika: eksport CSV z MyFitnessPal importuje się bezpośrednio, ze wszystkimi swoimi dziwactwami, więc lata zapisanej historii przenoszą się razem z Tobą. Wszystko, co zapiszesz od tej pory, możesz w każdej chwili wyeksportować do CSV.",
                "Funkcje, które MyFitnessPal stopniowo przenosił do wersji Premium — skaner kodów kreskowych, makroskładniki w gramach, brak reklam — są tu po prostu w standardzie. Nie wybierasz między darmową wersją a pakietem za 20 dolarów miesięcznie: jest jedna darmowa wersja open source, a jedyne, co musisz skonfigurować, to darmowe logowanie przy pierwszym połączeniu.",
            ],
        },
        importSection: {
            title: "Zaimportuj dziennik MyFitnessPal z pliku CSV",
            body: [
                "Lata zapisanej historii to prawdziwy powód, dla którego ludzie nie zmieniają aplikacji — i nie musisz z nich rezygnować. Poproś o import, a w czacie otworzy się panel importera: wybierasz plik CSV wyeksportowany z MyFitnessPal, plik jest odczytywany w Twojej przeglądarce, rozpoznane kolumny są dopasowywane automatycznie, a Ty widzisz, co zostanie dodane, zanim cokolwiek zostanie zapisane. Dopasowanie obejmuje kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem i kofeinę w miligramach, jeśli Twój eksport ma takie kolumny. Wiersze nigdy nie przechodzą przez AI, więc nie ma czego błędnie przepisać.",
                "Eksport z MyFitnessPal jest rozpoznawany po nazwie, razem ze wszystkimi dziwactwami. Plik zaczyna się znacznikiem BOM, który inaczej zepsułby nagłówek pierwszej kolumny; notatki mogą zawierać znaki nowego wiersza w komórce ujętej w cudzysłów, a naiwne dzielenie pliku na linie poszatkowałoby tę komórkę razem z każdym kolejnym wierszem; do tego blok każdego dnia kończy się wierszem sum, który nie może stać się posiłkiem. I najważniejsze: MyFitnessPal eksportuje jeden zbiorczy wiersz na posiłek dziennie i w ogóle nie ma kolumny z nazwą produktu. Zamiast odrzucać takie wiersze za brak opisu, importer rozpoznaje ten układ i nazywa je według pory posiłku — trafiają jako „Breakfast (imported from MyFitnessPal)”.",
                "Daty są potwierdzane, a nie zgadywane. Kolumny z wartością 05/06/2024 naprawdę nie da się rozstrzygnąć — maj czy czerwiec? — więc importer pokazuje swoją interpretację obok prawdziwego wiersza z Twojego pliku i pozwala ją poprawić przed zapisem. Każdy wiersz ma też swój odcisk treści, więc ponowne wczytanie tego samego pliku zgłosi te posiłki jako już zapisane, zamiast je zdublować — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa. Niepełny eksport albo źle dopasowana kolumna? Po prostu zaimportuj plik jeszcze raz.",
            ],
        },
        importFaq:
            "Tak. Poproś o import historii, a w czacie otworzy się importer: wybierasz plik CSV wyeksportowany z MyFitnessPal, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, dopasowujesz lub potwierdzasz kolumny, sprawdzasz podgląd tego, co zostanie dodane, i potwierdzasz. Przenoszą się kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem, kofeina oraz tłuszcze nasycone i trans, jeśli Twój eksport je zawiera. Eksport z MyFitnessPal jest rozpoznawany po nazwie — razem ze znacznikiem BOM, końcowymi wierszami sum i tym, że zapisuje jeden zbiorczy wiersz na posiłek dziennie bez nazwy produktu; takie wiersze dostają nazwę według pory posiłku. Ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP skanuje kody kreskowe jak MyFitnessPal Premium?",
                a: "Tak, i to za darmo. Wyślij kod kreskowy produktu, a Nutrition MCP pobierze makroskładniki z etykiety z Open Food Facts — tymczasem MyFitnessPal przeniósł swój skaner kodów kreskowych do płatnej subskrypcji Premium.",
            },
            {
                q: "Jak działa zapisywanie bez bazy produktów MyFitnessPal?",
                a: "Opisujesz posiłek zwykłymi słowami — „burrito bowl z kurczakiem i podwójnym ryżem” — a Twoje AI go zapisuje. Produkty ogólne biorą wartości z USDA FoodData Central, jeśli tam są, produkty paczkowane z Open Food Facts przez kod kreskowy, a szacunki pokrywają resztę. Nie przeszukujesz bazy milionów wpisów dodanych przez użytkowników i nie zgadujesz, który z nich jest dokładny.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Brak oficjalnego serwera MCP. Zobacz darmowy sposób na liczenie kalorii i makroskładników w rozmowie z AI.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Zapisujesz, przeszukując bazę wpis po wpisie",
            "Część funkcji wymaga płatnego planu Gold",
            "Osobna aplikacja, którą otwierasz przy każdym posiłku",
        ],
        note: "Cronometer jest świetny, jeśli zależy Ci na dużej precyzji w mikroskładnikach. Nutrition MCP podchodzi do kalorii, makroskładników i wagi lżej, w formie rozmowy — prosto w Twoim AI.",
        migrate: {
            title: "Gdy liczy się przede wszystkim dokładność",
            body: [
                "Cronometer zbudował reputację na precyzji — starannie weryfikowanych bazach danych i śledzeniu ponad 80 mikroskładników, w tym witamin i minerałów. Jeśli właśnie dla tej szczegółowości go otwierasz, spójrz na to trzeźwo: szacunki z rozmowy nie dorównają co do grama wpisowi z bazy o laboratoryjnej dokładności.",
                "Większość ludzi zapisuje jednak posiłki, żeby trzymać kalorie i makroskładniki w ryzach, a nie żeby kontrolować spożycie selenu. A ten zakres jest szerszy, niż się wydaje: oprócz białka, węglowodanów i tłuszczu dostajesz błonnik, cukry ogółem i kofeinę w miligramach, a jeśli zechcesz — także alkohol w gramach etanolu. Do tego opisanie posiłku swojemu AI to dużo mniej pracy niż wyszukiwanie i ważenie każdego składnika — a dzienne sumy, trendy i wagę docelową i tak masz za darmo.",
                "Jest też droga pośrednia: skoro jesteś w asystencie AI, możesz zapytać o mikroskładniki wtedy, gdy naprawdę Cię interesują — „ile mniej więcej żelaza i B12 było w dzisiejszych posiłkach?” — i od razu dostać przemyślany szacunek, bez zapisywania na co dzień każdego grama do zweryfikowanego wpisu.",
            ],
        },
        importSection: {
            title: "Dziesięć lat wpisów — nic nie ginie",
            body: [
                "Skoro w Cronometer liczyła się dla Ciebie precyzja, niedbały import byłby gorszy niż żaden. Poproś o import, a w czacie otworzy się panel: wybierasz swój plik CSV z Cronometer, plik jest odczytywany w Twojej przeglądarce, a Ty zatwierdzasz podgląd, zanim zostanie zapisany choćby jeden wiersz. Liczby są odczytywane prosto z pliku — AI nigdy nie widzi wierszy, więc niczego nie zaokrągli ani błędnie nie przepisze.",
                "Układ eksportu z Cronometer jest rozpoznawany po nazwie. Datę i godzinę zapisuje w osobnych kolumnach i obie są odczytywane, więc śniadanie zapisane o 07:12 zachowuje swoją godzinę, zamiast trafić na domyślne południe. Ilość zapisuje razem z jednostką w jednej komórce — „58.00 g”, „1.00 cup” — a taka wartość i tak jest odczytywana jako liczba, którą naprawdę jest, a nie jako brak danych. Nagłówek „Amount” powtarza się w nim kilka razy, więc kolumny są rozpoznawane po pozycji, a nie po nazwie: duplikaty nie mogą się po cichu pomylić, a przy dopasowywaniu widzisz, którą z nich wskazujesz.",
                "Warto wiedzieć, co dokładnie się przenosi: data i godzina, nazwa produktu, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeina, tłuszcze nasycone i trans oraz notatki. Cronometer to jedyny eksport z tej listy z osobną kolumną Caffeine (mg) i trafia ona do bazy w miligramach — w tej samej jednostce, w której już jest i w której kofeina jest tu przechowywana, więc nic nie jest przeliczane. Kolumna kofeiny opisana w gramach pozostaje za to niedopasowana, a importer podaje powód — zamiast zapisać 0,18 tam, gdzie etykieta mówi 180 mg. Cukier oznacza cukry ogółem, łącznie z tymi z owoców i mleka — nie cukry dodane, których żaden eksport wiarygodnie nie podaje. Osobna kolumna „Sugar Alcohols” z Cronometer to poliole, a nie cukier ani etanol, więc nie może trafić do żadnego z tych pól. Alkohol to osobny przypadek: Cronometer eksportuje go jako czysty etanol w gramach i przenosi się on tylko wtedy, gdy najpierw włączysz tutaj śledzenie alkoholu, bo domyślnie jest wyłączone. Wielkości porcji oraz ponad 80 witamin i minerałów z Cronometer w ogóle się nie przenoszą — ta szczegółowość zostaje we własnym eksporcie Cronometer. Ponowny import niczego nie psuje: każdy wiersz ma swój odcisk treści, więc drugie wczytanie tego samego pliku zgłosi posiłki jako już zapisane, zamiast dodać je jeszcze raz — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz swój plik CSV z Cronometer, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, i przed potwierdzeniem sprawdzasz podgląd tego, co zostanie dodane. Eksport z Cronometer jest rozpoznawany po nazwie — odczytywane są obie osobne kolumny daty i godziny, a powtarzający się nagłówek „Amount” niczego nie pomiesza, bo kolumny są rozpoznawane po pozycji. Przenoszą się data i godzina, nazwa produktu, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeina w miligramach, tłuszcze nasycone i trans oraz notatki; alkohol także, ale tylko jeśli najpierw włączysz jego śledzenie. Witaminy, minerały i wielkości porcji się nie przenoszą. Ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP śledzi mikroskładniki jak Cronometer?",
                a: "Nie. Śledzenie ponad 80 witamin i minerałów to specjalność Cronometer, a Nutrition MCP w ogóle nie ma danych o mikroskładnikach — ani sodu, ani witamin. Śledzi za to kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeinę w miligramach, tłuszcze nasycone i trans, opcjonalnie alkohol, a także wodę i wagę. Możesz poprosić swoje AI o orientacyjną ocenę mikroskładników w posiłku, ale jeśli potrzebujesz laboratoryjnej szczegółowości, Cronometer sprawdzi się lepiej.",
            },
            {
                q: "Czy Nutrition MCP jest tak dokładny jak Cronometer?",
                a: "Nie. Wartości z rozmowy nie dorównają co do grama bazie Cronometer, którą się kuruje. Produkty ogólne korzystają z wartości USDA FoodData Central, jeśli tam są, a szacunki w pozostałych przypadkach; przy produktach paczkowanych wyszukiwanie po kodzie kreskowym korzysta z danych z etykiety w Open Food Facts. Te źródła też mogą się mylić, a każda liczba pokazuje, skąd pochodzi, więc sprawdzaj wszystko, co ma dla Ciebie znaczenie. Oddajesz trochę precyzji, a w zamian zapisywanie zajmuje dużo mniej pracy.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Brak oficjalnego serwera MCP. Zapisuj posiłki, po prostu rozmawiając z Claude albo ChatGPT — za darmo.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Każdy produkt wyszukujesz i zapisujesz ręcznie",
            "Część funkcji, np. nielimitowane zapisywanie ze zdjęć Snap It, wymaga płatnego planu",
            "Kolejna aplikacja, kolejne konto i reklamy w darmowej wersji",
        ],
        note: "Lose It! to sympatyczny licznik kalorii. Nutrition MCP robi to samo podstawowe zapisywanie w rozmowie, za darmo i bez wychodzenia z Claude czy ChatGPT.",
        migrate: {
            title: "Ta sama prostota, tylko bez aplikacji",
            body: [
                "Lose It! zjednał sobie ludzi tym, że liczenie kalorii jest w nim lekkie i trochę jak gra, a jego wizytówką jest zapisywanie ze zdjęć Snap It. Nutrition MCP też to potrafi — wyślij zdjęcie talerza, a Twoje AI rozpozna, co na nim jest — z tą różnicą, że wszystko dzieje się w asystencie, z którym i tak rozmawiasz, więc nie musisz otwierać osobnej aplikacji.",
                "Jeśli w Lose It! lubisz szybkie zapisywanie i błyskawiczne podsumowanie dnia, poczujesz się jak u siebie: mówisz, co było na talerzu, dostajesz pozostałe kalorie i makroskładniki i wracasz do swoich spraw. Bez reklam i bez namawiania na płatną wersję.",
                "Jedyne, z czego rezygnujesz, to serie i odznaki, którymi Lose It! zachęca do powrotów. Jeśli to Cię motywuje, to uczciwy powód, żeby zostać. Jeśli zawsze wydawało Ci się to zbędnym dodatkiem do samego zapisywania, nie zatęsknisz — dzienne podsumowanie masz w czacie, kiedy tylko zapytasz.",
            ],
        },
        importSection: {
            title: "Zapisane dni przenosisz ze sobą",
            body: [
                "Zmiana aplikacji nie oznacza zaczynania od zera. Poproś o import, a w czacie otworzy się importer: wybierasz plik CSV wyeksportowany z Lose It!, plik jest odczytywany w Twojej przeglądarce, rozpoznane kolumny dopasowują się same — data, produkt, posiłek, kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem i kofeina, jeśli Twój eksport je zawiera — a Ty potwierdzasz podgląd tego, co zostanie dodane. Wybierasz plik i sprawdzasz podgląd, niczego nie dyktujesz — na tej ścieżce AI nigdy nie czyta ani nie przepisuje Twoich wierszy.",
                "Dwie osobliwości Lose It! są obsłużone celowo. Eksport zawiera znacznik usunięcia, a wiersze oznaczone jako usunięte są pomijane: zaimportowanie ich przywróciłoby jedzenie, które celowo usunięto, a żadna suma w podglądzie by tego nie zdradziła. Puste komórki Lose It! wypełnia dosłownym tekstem „n/a” — jest on odczytywany jako brak wartości, a nie jako zero, więc makroskładnik, którego w ogóle nie zapisywano, pozostaje pusty, zamiast zapisać się jako prawdziwe 0 g i zaniżać Twoje średnie.",
                "Importuj tyle razy, ile chcesz. Każdy wiersz ma swój odcisk treści, więc ponowny import tego samego pliku zgłosi posiłki jako już zapisane i niczego nie doda — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa. A jeśli daty w eksporcie można odczytać na dwa sposoby — 05/06 jako maj albo czerwiec — importer pokazuje swoją interpretację obok wiersza z Twojego pliku i przed zapisem prosi o potwierdzenie.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz plik CSV wyeksportowany z Lose It!, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, i zanim cokolwiek zostanie zapisane, potwierdzasz podgląd. Data, produkt, posiłek, kalorie, białko, węglowodany i tłuszcz dopasowują się same, a błonnik, cukry ogółem i kofeina także, jeśli Twój eksport je zawiera. Eksport z Lose It! jest rozpoznawany po nazwie — wiersze oznaczone jako usunięte są pomijane, a nie przywracane, a komórki „n/a” są odczytywane jako puste, a nie jako zera. Ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP zapisuje posiłki ze zdjęć jak Snap It w Lose It!?",
                a: "Tak — wyślij zdjęcie talerza, a Twoje AI rozpozna jedzenie, oszacuje makroskładniki i zapisze posiłek, gdy potwierdzisz szczegóły. Lose It! ogranicza Snap It w darmowym planie, a bez limitu udostępnia go w Premium; w Nutrition MCP zapisywanie ze zdjęć nic dodatkowo nie kosztuje i działa prosto w czacie, w każdej aplikacji AI, która rozpoznaje obrazy.",
            },
            {
                q: "Czy mogę liczyć kalorie tak samo jak w Lose It!?",
                a: "Tak. Podstawowy schemat jest identyczny — mówisz, co było na talerzu, i od razu dostajesz pozostałe kalorie i makroskładniki. Różnica polega na tym, że rozmawiasz ze swoim AI, zamiast klikać w aplikacji, a po drodze nie ma reklam ani namawiania na płatną wersję.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Tylko w subskrypcji i bez oficjalnego serwera MCP. Zobacz darmową alternatywę, która działa w Twoim AI.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Płatna subskrypcja po darmowym okresie próbnym (brak darmowego planu)",
            "Każdy posiłek i tak zapisujesz w osobnej aplikacji",
            "Produktem jest adaptacyjny coaching, a nie szybkie zapisywanie",
        ],
        note: "Adaptacyjny coaching TDEE w MacroFactor jest naprawdę dobry. Jeśli jednak chcesz przede wszystkim szybko i za darmo zapisywać makroskładniki w swoim AI, Nutrition MCP będzie prostszym i bezpłatnym wyborem.",
        migrate: {
            title: "Coaching czy zapisywanie",
            body: [
                "Największym atutem MacroFactor jest algorytm: obserwuje zapisywane przez Ciebie spożycie i wagę i co tydzień po cichu przelicza cele kaloryczne i makroskładnikowe — to naprawdę sprytny, adaptacyjny coaching od zespołu Stronger By Science. Ten coaching jest właśnie produktem, dlatego aplikacja działa tylko w subskrypcji.",
                "Nutrition MCP nie ma algorytmu coachingowego — ale skoro i tak jesteś w asystencie AI, możesz po prostu zapytać. Na pytanie „Biorąc pod uwagę ostatnie trzy tygodnie, czy mam zmienić kalorie?” Twoje AI od razu zinterpretuje Twoje własne zapisane liczby — to szacunek do przemyślenia, a nie porada dietetyczna. To inny model: analiza wtedy, kiedy jej chcesz, w rozmowie, zamiast stałego cotygodniowego przeliczenia — i to za darmo.",
                "Uczciwie mówiąc, to wybór między dyscypliną a elastycznością. MacroFactor przelicza wszystko co tydzień, niezależnie od tego, czy przyjdzie Ci do głowy zapytać, i to trzyma Cię w ryzach; w rozmowie cele zmieniają się tylko wtedy, gdy o to poprosisz. Jeśli chcesz, żeby algorytm sam pilnował Twoich liczb, MacroFactor jest wart subskrypcji. Jeśli wolisz zapisywać za darmo i sięgać po analizę, kiedy jej potrzebujesz, to rozwiązanie pasuje lepiej.",
            ],
        },
        importSection: {
            title: "Coaching zostaje, dziennik idzie z Tobą",
            body: [
                "Zostawiasz algorytm, nie dane. Poproś o import, a w czacie otworzy się panel importera: wybierasz eksport CSV z MacroFactor, plik jest odczytywany w Twojej przeglądarce, rozpoznane kolumny są dopasowywane automatycznie, a Ty zatwierdzasz podgląd, zanim cokolwiek zostanie zapisane. Wiersze nigdy nie przechodzą przez AI, więc po drodze nic nie zostanie błędnie przepisane.",
                "Eksport z MacroFactor jest rozpoznawany po nazwie — zdradza go kolumna wielkości porcji — a jego kolumny daty, produktu, posiłku, kalorii i makroskładników dopasowują się same, łącznie z błonnikiem, cukrami ogółem i kofeiną, jeśli plik je zawiera. Jeśli Twój eksport podaje energię w kilodżulach zamiast w kilokaloriach, zostaje ona przeliczona, a nie zapisana 4,184 raza za wysoko. Kolumna zatytułowana po prostu „Calories” może zawierać jedną z dwóch jednostek, dlatego jednostkę wybierasz samodzielnie, a obok widzisz przykład przeliczenia z pierwszego wiersza Twojego pliku — potwierdzasz ją, zamiast polegać na domysłach, które po cichu zawyżyłyby każdy dzień.",
                "Ta historia od razu się przydaje, a nie tylko leży w archiwum. Gdy masz już zapisane kilka tygodni spożycia i wagi, możesz zadać pytanie, na które algorytm MacroFactor odpowiadał według harmonogramu — „biorąc pod uwagę ostatnie trzy tygodnie, czy mam zmienić kalorie?” — i od razu dostać interpretację własnych liczb od swojego AI: szacunek, a nie poradę dietetyczną. Ponowny import tego samego pliku niczego nie zmienia, bo każdy wiersz ma swój odcisk treści, a powtórzenia są zgłaszane jako już zapisane — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz eksport CSV z MacroFactor, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, i zanim cokolwiek zostanie zapisane, potwierdzasz podgląd. Eksport z MacroFactor jest rozpoznawany po nazwie — data, produkt, posiłek, kalorie, białko, węglowodany i tłuszcz dopasowują się same, razem z błonnikiem, cukrami ogółem i kofeiną, jeśli plik je zawiera — a jeśli energia jest podana w kilodżulach, zostaje przeliczona na kilokalorie, gdy potwierdzisz jednostkę obok przykładu z Twojego pliku. Ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP dostosowuje cele kaloryczne jak MacroFactor?",
                a: "Nie automatycznie. Cotygodniowe przeliczanie przez algorytm to główna płatna funkcja MacroFactor. W Nutrition MCP po prostu pytasz — „na podstawie ostatnich trzech tygodni spożycia i wagi: czy mam zmienić kalorie?” — a Twoje AI analizuje to od razu, zamiast stałej cotygodniowej aktualizacji.",
            },
            {
                q: "Czy Nutrition MCP jest naprawdę darmowy, skoro MacroFactor działa tylko w subskrypcji?",
                a: "Tak. Nutrition MCP jest całkowicie darmowy i open source — bez okresu próbnego, po którym trzeba płacić, i bez limitów darmowego planu. MacroFactor nie ma darmowego planu i po okresie próbnym wymaga subskrypcji. Potrzebujesz aplikacji AI obsługującej MCP, np. Claude albo ChatGPT, i darmowego konta Nutrition MCP, które zakładasz przez Google albo e-mailem i hasłem przy pierwszym połączeniu.",
            },
        ],
        freeAnswer:
            "Tak. Nutrition MCP jest całkowicie darmowy i open source, bez żadnej subskrypcji — a MacroFactor po darmowym okresie próbnym wymaga płatnej subskrypcji. Potrzebujesz aplikacji AI obsługującej MCP, np. Claude albo ChatGPT, i darmowego konta Nutrition MCP, które zakładasz przez Google albo e-mailem i hasłem przy pierwszym połączeniu.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Brak oficjalnego serwera MCP. Śledź posiłki i makroskładniki w rozmowie — za darmo i open source.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Każdy zapisywany produkt wyszukujesz w bazie",
            "Część funkcji, np. plany posiłków, wymaga płatnego planu PRO",
            "Osobna aplikacja i kolejne konto",
        ],
        note: "Yazio to dopracowana aplikacja z dobrymi planami posiłków. Nutrition MCP stawia na szybkie zapisywanie w rozmowie, które działa w Claude albo ChatGPT — za darmo i open source.",
        migrate: {
            title: "Plan w jednym miejscu, zapisywanie w drugim",
            body: [
                "Yazio łączy śledzenie z gotowymi planami posiłków, przepisami i narzędziami do postu przerywanego, dopracowanymi z myślą o europejskich użytkownikach. Jeśli to prowadzony plan pomaga Ci trzymać kurs, Yazio robi to dobrze, a Nutrition MCP nawet nie próbuje — to nie jest aplikacja z planami posiłków.",
                "Za to zdejmuje z Ciebie żmudną część, czyli zapisywanie. Zamiast szukać w bazie Yazio każdego składnika, opisujesz danie, a Twoje AI zajmuje się makroskładnikami — i od razu odpowiada na pytanie „jak mi dziś idzie?”. Możesz to połączyć z dowolnym planem żywieniowym, którego już się trzymasz.",
                "Dzięki temu oba narzędzia się uzupełniają, a nie konkurują. Trzymaj się planu z Yazio albo dowolnego innego w kwestii „co jeść”, a Nutrition MCP używaj do sprawdzania, „czy trzymam się planu” — zapisując w rozmowie i za darmo. Nie pomoże tylko przy licznikach postu — to domena Yazio, a nie dziennika posiłków.",
            ],
        },
        importSection: {
            title: "Przenieś dziennik, dopasuj kolumny",
            body: [
                "Historię z Yazio też przeniesiesz, choć trochę pracy zostanie po Twojej stronie. Poproś o import, a w czacie otworzy się panel importera: wybierasz plik eksportu CSV, plik jest odczytywany w Twojej przeglądarce, a Ty samodzielnie wskazujesz, które kolumny to data, produkt, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeina. Eksporty czterech aplikacji — MyFitnessPal, Cronometer, Lose It! i MacroFactor — są rozpoznawane po nazwach kolumn; Yazio do nich nie należy, więc kolumny dopasujesz raz, ręcznie. Dalej wszystko wygląda tak samo: podgląd tego, co zostanie dodane, i Twoje potwierdzenie.",
                "Europejskie osobliwości, na których wykłada się większość importerów, są obsłużone. Plik rozdzielany średnikami, w którym liczby mają przecinek dziesiętny — taki, jaki tworzy Excel z niemieckimi albo austriackimi ustawieniami regionalnymi — jest odczytywany poprawnie: separator nie zostaje pomylony z przecinkiem dziesiętnym, a makroskładniki nie rosną tysiąckrotnie. Znane nagłówki też nie muszą być po angielsku: niemieckie Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker i Koffein są rozpoznawane, a błonnik, cukier i kofeina są dopasowywane także po hiszpańsku, francusku, włosku i niderlandzku — fibra, sucres, zuccheri, suikers, cafeína, caffeina — więc zlokalizowany plik często jest już częściowo dopasowany i zostaje Ci mniej kolumn do ustawienia ręcznie. Pola w cudzysłowach, znaki nowego wiersza w komórce, prawie puste wartości i przypadkowe wiersze sum też są obsłużone, a AI nigdy nie czyta pliku, więc po drodze żadna liczba nie zostanie błędnie przepisana.",
                "Daty i energia są potwierdzane, a nie zgadywane. Kolumna w formacie DD/MM/RRRR jest odczytywana z dniem na początku, a tam, gdzie wartości naprawdę nie da się rozstrzygnąć — 05/06 to maj albo czerwiec — importer pokazuje swoją interpretację obok wiersza z Twojego pliku i pozwala ją poprawić. Jeśli energia jest podana w kilodżulach, zostaje przeliczona na kilokalorie, a jednostkę wybierasz obok przykładu przeliczenia. Ponowny import tego samego pliku niczego nie dodaje: każdy wiersz ma swój odcisk treści, więc powtórzenia są zgłaszane jako już zapisane — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            ],
        },
        importFaq:
            "Tak, z ręcznym dopasowaniem kolumn. Poproś o import, a w czacie otworzy się importer: wybierasz swój eksport CSV z Yazio, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, i samodzielnie wskazujesz, które kolumny to data, produkt, posiłek, kalorie i makroskładniki — w tym błonnik, cukry ogółem i kofeina. Yazio nie należy do czterech eksportów rozpoznawanych po nazwach kolumn, więc dopasowanie to jednorazowy ręczny krok, choć nagłówki, które importer już zna (niemieckie, a dla błonnika, cukru i kofeiny także hiszpańskie, francuskie, włoskie i niderlandzkie), uzupełniają się same. Europejskie pliki rozdzielane średnikami z przecinkiem dziesiętnym, daty DD/MM/RRRR i kilodżule są obsługiwane, a ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP ma plany posiłków jak Yazio PRO?",
                a: "Nie. Gotowe plany posiłków, przepisy i narzędzia do postu to mocna strona Yazio, a Nutrition MCP nie próbuje ich zastąpić — zajmuje się zapisywaniem. Wiele osób dalej trzyma się planu z Yazio (albo dowolnego innego) i po prostu zapisuje tu posiłki, za darmo.",
            },
            {
                q: "Czy zapiszę posiłki szybciej niż przez wyszukiwanie w bazie Yazio?",
                a: "Zwykle tak. Zamiast szukać w bazie Yazio każdego składnika i ustawiać porcje, opisujesz gotowe danie jednym zdaniem — „miska musli z jogurtem i owocami jagodowymi” — a Twoje AI zapisuje makroskładniki w jednym kroku, z wartościami USDA dla produktów ogólnych, gdy są dostępne, i szacunkami w pozostałych przypadkach.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Brak oficjalnego serwera MCP. Prostszy, darmowy sposób na zapisywanie jedzenia w Claude albo ChatGPT.",
        cons: [
            "Brak oficjalnego serwera MCP — nie dodasz wpisów z Claude ani ChatGPT",
            "Każdy produkt wyszukujesz w bazie osobno",
            "Część funkcji, np. plany dietetyczne, wymaga płatnego planu",
            "Kolejna aplikacja i kolejna subskrypcja",
        ],
        note: "Lifesum łączy śledzenie z gotowymi planami dietetycznymi. Nutrition MCP to prostszy, darmowy sposób na zapisywanie kalorii, makroskładników i wagi w rozmowie ze swoim AI.",
        migrate: {
            title: "Ocena wtedy, gdy o nią zapytasz",
            body: [
                "Lifesum stawia na strukturę i informację zwrotną — plany dietetyczne, przepisy i system ocen, który punktuje to, co jesz. Nutrition MCP nie przyznaje Twoim posiłkom odznak, więc jeśli to punktowanie Cię motywuje, tu Lifesum ma przewagę.",
                "W zamian dostajesz elastyczność: zamiast stałej oceny możesz zapytać swoje AI „czy to dobry wybór przy moich celach?” i dostać prawdziwą odpowiedź w kontekście. Zapisanie posiłku to jedno zdanie, trendy i waga docelowa są wbudowane, a przydatnych funkcji nie blokuje żadna płatna wersja.",
                "Odznaka powie Ci, że posiłek dostał 3 na 5; rozmowa może wyjaśnić dlaczego, w kontekście Twojego własnego dziennika — „zamień połowę ryżu na zielone warzywa i wtedy będzie pasować do reszty Twojego dnia”. A ponieważ Lifesum trzyma plany dietetyczne i część śledzenia w wersji Premium, z tych dwóch to Nutrition MCP jest darmową opcją.",
            ],
        },
        importSection: {
            title: "Nic nie przepisujesz ręcznie",
            body: [
                "Zmiana aplikacji to przeniesienie historii, ale nie musisz przepisywać ani jednej linijki. Poproś o import, a w czacie otworzy się panel importera: wybierasz swój eksport CSV z Lifesum, plik jest odczytywany w Twojej przeglądarce, a Ty wskazujesz, które kolumny to data, produkt, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeina. Nagłówki Lifesum nie są rozpoznawane po nazwie tak jak w MyFitnessPal, Cronometer, Lose It! i MacroFactor, więc dopasowanie to jednorazowy ręczny krok — potem sprawdzasz podgląd tego, co zostanie dodane, i potwierdzasz.",
                "Nic nie dzieje się na podstawie domysłów. Przy dopasowywaniu kolumn widzisz swój własny plik — jego prawdziwe nagłówki, prawdziwe komórki i bieżącą liczbę wierszy, które zostaną utworzone — więc kolumnę przypisaną do złego pola zauważysz, zanim cokolwiek zostanie zapisane, a nie dopiero potem. Pola w cudzysłowach, znaki nowego wiersza w komórce, prawie puste wartości i wiersze sum są obsłużone, a ponieważ plik jest odczytywany w Twojej przeglądarce, AI nigdy nie widzi wiersza, który mogłoby błędnie przepisać.",
                "Europejskie eksporty też są obsługiwane: plik rozdzielany średnikami z przecinkiem dziesiętnym odczytuje się poprawnie, daty DD/MM/RRRR są przeliczane, gdy potwierdzisz kolejność, a kilodżule zamieniają się w kilokalorie, z jednostką pokazaną obok przykładu przeliczenia z pierwszego wiersza Twojego pliku. Pomagają też zlokalizowane nagłówki — niemieckie Kalorien, Kohlenhydrate, Ballaststoffe czy Koffein uzupełniają się same, a błonnik, cukier i kofeina są dopasowywane także po hiszpańsku, francusku, włosku i niderlandzku — więc ręczne dopasowanie zwykle zajmuje mniej czasu, niż się wydaje. Uruchom import dwa razy, a nic się nie zdubluje — każdy wiersz ma swój odcisk treści, więc powtórzenia są zgłaszane jako już zapisane, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            ],
        },
        importFaq:
            "Tak, z ręcznym dopasowaniem kolumn. Poproś o import, a w czacie otworzy się importer: wybierasz swój eksport CSV z Lifesum, plik jest odczytywany w Twojej przeglądarce, a nie przez AI, i samodzielnie wskazujesz, które kolumny to data, produkt, posiłek, kalorie i makroskładniki — łącznie z błonnikiem, cukrami ogółem i kofeiną. Lifesum nie należy do czterech eksportów rozpoznawanych po nazwach kolumn, więc dopasowanie to jednorazowy ręczny krok, choć nagłówki, które importer już zna, uzupełniają się same. Europejskie pliki rozdzielane średnikami z przecinkiem dziesiętnym, daty DD/MM/RRRR i kilodżule są obsługiwane, a ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP ocenia jedzenie jak system ocen w Lifesum?",
                a: "Nie — nie ma odznak ani punktów. Zamiast tego możesz zapytać swoje AI „czy to dobry wybór przy moich celach?” i dostać odpowiedź w kontekście, która wyjaśnia wszystkie za i przeciw, a nie stałą ocenę samego produktu.",
            },
            {
                q: "Czy Nutrition MCP jest darmowy bez planu w stylu Lifesum Premium?",
                a: "Tak. Nutrition MCP jest całkowicie darmowy i open source, bez płatnej wersji — a Lifesum trzyma plany dietetyczne i część funkcji śledzenia w subskrypcji Premium. Potrzebujesz aplikacji AI obsługującej MCP, np. Claude albo ChatGPT, i darmowego konta Nutrition MCP, które zakładasz przez Google albo e-mailem i hasłem przy pierwszym połączeniu.",
            },
        ],
    },
};

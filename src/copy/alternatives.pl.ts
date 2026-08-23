import type { AppCopy, AppSlug } from "./alternatives.js";

export const ALTERNATIVES_PL: Record<AppSlug, AppCopy> = {
    "myfitnesspal-mcp": {
        hubBlurb:
            "Brak serwera MCP, a część funkcji wymaga płatnego planu. Zobacz darmową, konwersacyjną alternatywę.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Przeszukujesz bazę danych i wybierasz właściwy wpis dla każdego produktu",
            "Część funkcji, jak skaner kodów kreskowych, wymaga płatnego planu",
            "Osobna aplikacja i konto, z reklamami w darmowej wersji",
        ],
        note: "MyFitnessPal to sprawna aplikacja z ogromną bazą produktów. To nie jest krytyka pod jej adresem — to po prostu inne podejście, dla osób, które wolą rozmawiać ze swoim AI niż klikać przez tracker.",
        migrate: {
            title: "Zostawiając bazę danych za sobą",
            body: [
                "MyFitnessPal zbudował swoją popularność na jednej z największych baz produktów spożywczych na świecie — dziesiątkach milionów wpisów tworzonych przez społeczność. Ta skala to zarazem tarcie: przy każdym produkcie przewijasz niemal identyczne wpisy i musisz zgadywać, który jest dokładny. Zapisywanie konwersacyjne całkowicie pomija to wyszukiwanie — opisujesz jedzenie, a Twój AI szacuje makroskładniki.",
                "Nie musisz przy tym zostawiać dziennika za sobą: eksport CSV z MyFitnessPal importuje się bezpośrednio, wraz ze wszystkimi jego osobliwościami, więc lata już zapisanej historii idą razem z Tobą. Wszystko, co zapiszesz od teraz, możesz w dowolnej chwili wyeksportować jako CSV.",
                "Funkcje, które MyFitnessPal stopniowo przenosił do wersji Premium — skanowanie kodów kreskowych, makroskładniki co do grama, brak reklam — tutaj są po prostu wliczone w całość. Nie porównujesz darmowej wersji z aktualizacją za 20 dolarów miesięcznie; jest jeden darmowy, open-source'owy poziom, a jedyne konto, jakiego potrzebujesz, to Claude albo ChatGPT, które już masz.",
            ],
        },
        importSection: {
            title: "Przenieś dziennik ze sobą",
            body: [
                "Lata zapisanej historii to prawdziwy powód, dla którego ludzie zostają, i nie musisz z nich rezygnować. Poproś o import, a w czacie otworzy się panel importera: wybierasz CSV eksportowany z MyFitnessPal, jest on parsowany w Twojej przeglądarce, kolumny, które importer rozpoznaje, są dopasowywane automatycznie, a Ty widzisz, co zostanie dodane, zanim cokolwiek zostanie zapisane. To dopasowanie obejmuje kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem i kofeinę w miligramach, jeśli Twój eksport zawiera te kolumny. Wiersze nigdy nie przechodzą przez AI, więc nie ma czego błędnie przepisać.",
                "Eksport z MyFitnessPal jest rozpoznawany po nazwie, wraz z jego osobliwościami. Plik przychodzi ze znacznikiem BOM, który inaczej zepsułby nagłówek pierwszej kolumny; jego notatki mogą zawierać złamania wiersza wewnątrz cudzysłowionej komórki, co przy naiwnym dzieleniu po liniach rozerwałoby dane razem z każdym kolejnym wierszem; a każdy blok dnia kończy się wierszem sum, który nie może stać się posiłkiem. Najważniejsza osobliwość: MyFitnessPal eksportuje jeden zsumowany wiersz na posiłek dziennie i w ogóle nie ma kolumny z nazwą jedzenia, więc zamiast odrzucać te wiersze za brak opisu, importer rozpoznaje ten kształt i nazywa je po ich miejscu w dniu — trafiają jako „Śniadanie (zaimportowane z MyFitnessPal)”.",
                "Daty są potwierdzane, nie zakładane. Kolumna z wartością 05/06/2024 jest po prostu nierozstrzygalna — maj czy czerwiec — więc importer pokazuje swój odczyt obok prawdziwego wiersza z Twojego pliku i pozwala go poprawić przed zapisem. Każdy wiersz niesie też odcisk treści, więc ponowne uruchomienie tego samego pliku zgłasza te posiłki jako już zapisane zamiast je duplikować. Zaimportuj częściowy eksport, zauważ źle zmapowaną kolumnę i po prostu zrób to jeszcze raz.",
            ],
        },
        importFaq:
            "Tak. Poproś o import swojej historii, a w czacie otworzy się importer: wybierasz CSV eksportowany z MyFitnessPal, plik jest parsowany w Twojej przeglądarce, a nie odczytywany przez AI, mapujesz lub potwierdzasz kolumny, oglądasz podgląd tego, co zostanie dodane, i potwierdzasz. Przenoszą się kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem i kofeina, gdy Twój eksport je zawiera. Eksport MyFitnessPal jest rozpoznawany po nazwie — łącznie ze znacznikiem BOM, końcowymi wierszami sum oraz tym, że zapisuje jeden zsumowany wiersz na posiłek dziennie bez nazwy jedzenia, co jest wtedy oznaczane po miejscu w dniu. Ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP potrafi skanować kody kreskowe jak MyFitnessPal Premium?",
                a: "Tak, i to za darmo. Wyślij kod kreskowy produktu, a Nutrition MCP pobiera makroskładniki z etykiety z Open Food Facts — podczas gdy MyFitnessPal przeniósł swój skaner kodów kreskowych za płatną subskrypcję Premium.",
            },
            {
                q: "Jak działa zapisywanie bez bazy danych produktów MyFitnessPal?",
                a: "Opisujesz zwykłym językiem, co zjadłeś/aś — „burrito bowl z kurczakiem i dodatkowym ryżem” — a Twój AI szacuje kalorie i makroskładniki. Nie ma bazy milionów wpisów od społeczności do przeszukania ani zgadywania, który z nich jest dokładny.",
            },
        ],
    },
    "cronometer-mcp": {
        hubBlurb:
            "Brak serwera MCP. Zobacz darmowy, konwersacyjny sposób na śledzenie kalorii i makroskładników wewnątrz swojego AI.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Zapisujesz przez przeszukiwanie bazy danych, wpis po wpisie",
            "Część funkcji wymaga płatnego planu Gold",
            "Osobna aplikacja do otwierania za każdym razem, gdy jesz",
        ],
        note: "Cronometer jest świetny, jeśli zależy Ci na dużej precyzji mikroskładników odżywczych. Nutrition MCP przyjmuje lżejsze, konwersacyjne podejście do kalorii, makroskładników i wagi — od razu w Twoim AI.",
        migrate: {
            title: "Gdy dokładność jest najważniejsza",
            body: [
                "Cronometer zbudował swoją reputację na precyzji — starannie dobranych bazach danych i śledzeniu ponad 80 mikroskładników, wliczając witaminy i minerały. Jeśli ta głębia mikroskładnikowa jest powodem, dla którego z niego korzystasz, bądź ze sobą szczery: konwersacyjne szacunki nie dorównają co do grama wpisowi z bazy klasy laboratoryjnej.",
                "Ale większość ludzi zapisuje posiłki, żeby utrzymać kalorie i makroskładniki w ryzach, a nie żeby audytować spożycie selenu. Ten zakres jest szerszy, niż się wydaje: obok białka, węglowodanów i tłuszczu dostajesz błonnik, cukry ogółem i kofeinę w miligramach, a opcjonalnie także alkohol w gramach etanolu, jeśli go włączysz. W tym celu opisanie posiłku swojemu AI to znacznie mniej pracy niż wyszukiwanie i ważenie każdego składnika — a i tak dostajesz dzienne sumy, trendy i wagę docelową do śledzenia, za darmo.",
                "Jest też droga pośrednia: skoro jesteś wewnątrz asystenta AI, możesz zapytać o kwestię mikroskładników dokładnie wtedy, gdy jej potrzebujesz — „ile mniej więcej żelaza i B12 było w dzisiejszych posiłkach?” — i dostać rozsądne oszacowanie na żądanie, bez konieczności zapisywania każdego grama do starannie dobranego wpisu przez resztę czasu.",
            ],
        },
        importSection: {
            title: "Dziesięć lat wpisów, zachowane",
            body: [
                "Precyzja to powód, dla którego korzystałeś/aś z Cronometer, więc niedbały import byłby gorszy niż żaden. Poproś o import, a w czacie otworzy się panel: wybierasz swój CSV z Cronometer, jest on parsowany w Twojej przeglądarce, a Ty zatwierdzasz podgląd, zanim zostanie zapisany choćby jeden wiersz. Liczby są odczytywane bezpośrednio z pliku — AI nigdy nie widzi wierszy, więc nie może niczego zaokrąglić ani błędnie przepisać.",
                "Kształt eksportu z Cronometer jest rozpoznawany po nazwie. Rozdziela znacznik czasu na osobne kolumny daty i godziny, i obie są odczytywane, więc śniadanie zapisane o 07:12 zachowuje swoją godzinę zamiast lądować w domyślnym południu. Zapisuje ilość razem z jednostką w tej samej komórce — „58,00 g”, „1,00 cup” — i wartość zapisana w ten sposób nadal jest odczytywana jako liczba, którą naprawdę jest, a nie jako nic. A nagłówek „Amount” powtarza więcej niż raz, więc kolumny są rozpoznawane po pozycji, a nie po nazwie: duplikaty nie mogą się po cichu zderzyć, a mapper pokazuje, na którą z nich wskazujesz.",
                "Warto wiedzieć, co dokładnie się przenosi: data i godzina, nazwa jedzenia, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeina i notatki. Cronometer to jedyny eksport na tej liście z osobną kolumną Caffeine (mg), i trafia ona jako miligramy — jednostka, w której już jest, i ta sama, w której kofeina jest tu przechowywana, więc nic nie jest przeliczane. Kolumna kofeiny podana w gramach zostaje niezmapowana, z podanym powodem, zamiast zapisać 0,18 tam, gdzie etykieta mówi 180 mg. Cukier oznacza cukry ogółem, wliczając te z owoców i mleka — nie cukier dodany, którego żaden eksport wiarygodnie nie podaje. Osobna kolumna Cronometer „Sugar Alcohols” to poliole, a nie cukier ani etanol, i nie może trafić do żadnego z tych pól. Alkohol to szczególny przypadek: Cronometer eksportuje go jako czysty etanol w gramach, i trafia do bazy tylko wtedy, gdy najpierw włączyłeś/aś tutaj śledzenie alkoholu, bo domyślnie jest wyłączone. Wielkości porcji oraz ponad 80 witamin i minerałów Cronometer w ogóle się nie przenoszą — ta mikroskładnikowa głębia zostaje we własnym eksporcie Cronometer. Ponowny import jest bezpieczny: każdy wiersz niesie odcisk treści, więc kolejne uruchomienie tego samego pliku zgłasza posiłki jako już zapisane, zamiast dodawać je po raz drugi.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz swój CSV z Cronometer, jest on parsowany w Twojej przeglądarce, a nie odczytywany przez AI, i oglądasz podgląd tego, co zostanie dodane, zanim potwierdzisz. Eksport z Cronometer jest rozpoznawany po nazwie — jego osobne kolumny daty i godziny są obie odczytywane, a powtarzający się nagłówek „Amount” nie może się zderzyć, bo kolumny są rozpoznawane po pozycji. Przenoszą się data i godzina, nazwa jedzenia, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeina w miligramach i notatki; alkohol także, ale tylko jeśli najpierw włączyłeś/aś jego śledzenie. Witaminy, minerały i wielkości porcji — nie. Ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP śledzi mikroskładniki tak jak Cronometer?",
                a: "Nie. Śledzenie ponad 80 witamin i minerałów to specjalność Cronometer, a Nutrition MCP w ogóle nie ma danych o mikroskładnikach — ani sodu, ani witamin. To, co śledzi, to kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, kofeina w miligramach, opcjonalnie alkohol, woda i waga. Nadal możesz poprosić swojego AI o orientacyjny odczyt mikroskładników dla posiłku, ale jeśli głębia mikroskładnikowa klasy laboratoryjnej jest niezbędna, Cronometer pasuje lepiej.",
            },
            {
                q: "Czy Nutrition MCP jest tak dokładny jak Cronometer?",
                a: "Dla kalorii, makroskładników, błonnika i cukru konwersacyjne szacunki są dla większości celów wystarczająco bliskie — ale nie dorównają starannie dobranej bazie Cronometer co do grama. Poświęca się nieco precyzji za znacznie mniej pracy przy zapisywaniu, co dla większości ludzi jest właściwym kompromisem.",
            },
        ],
    },
    "lose-it-mcp": {
        hubBlurb:
            "Brak serwera MCP. Zapisuj posiłki, rozmawiając z Claude albo ChatGPT — za darmo.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Wyszukujesz i zapisujesz każdy produkt ręcznie",
            "Część funkcji, jak zapisywanie ze zdjęcia, wymaga płatnego planu",
            "Kolejna aplikacja, kolejne konto, reklamy w darmowej wersji",
        ],
        note: "Lose It! to przyjazny licznik kalorii. Nutrition MCP robi to samo podstawowe zapisywanie przez rozmowę, za darmo, bez opuszczania Claude czy ChatGPT.",
        migrate: {
            title: "Ta sama prostota, minus aplikacja",
            body: [
                "Lose It! zdobył sympatię ludzi, utrzymując liczenie kalorii lekkim i odrobinę zgrywalizowanym, z funkcją zdjęciową Snap It jako głównym chwytem. Nutrition MCP też potrafi ten sam trick ze zdjęciem — wyślij zdjęcie swojego talerza, a Twój AI je odczyta — z tą różnicą, że dzieje się to wewnątrz asystenta, z którym już rozmawiasz, więc nie ma osobnej aplikacji do otwierania.",
                "Jeśli podobało Ci się w Lose It! bezwysiłkowe zapisywanie i szybka dzienna informacja zwrotna, poczujesz się jak u siebie: mówisz, co zjadłeś/aś, dostajesz z powrotem pozostałe kalorie i makroskładniki, i idziesz dalej. Bez reklam, bez zachęt do upgrade'u i bez konta do żonglowania.",
                "Jedyne, z czego rezygnujesz, to warstwa serii i odznak, którą Lose It! wykorzystuje, żeby Cię zatrzymać. Jeśli ta grywalizacja Cię motywuje, to uczciwy powód, żeby zostać. Jeśli zawsze wydawała się szumem nad samym zapisywaniem, nie będzie Ci jej brakować — dzienna liczba jest tuż obok w czacie, kiedy tylko zapytasz.",
            ],
        },
        importSection: {
            title: "Twoje zapisane dni też się przenoszą",
            body: [
                "Zmiana nie oznacza zaczynania od zera. Poproś o import, a w czacie otworzy się importer: wybierasz CSV eksportowany przez Lose It!, jest on parsowany w Twojej przeglądarce, rozpoznawane kolumny mapują się same — data, jedzenie, posiłek, kalorie, białko, węglowodany i tłuszcz, a także błonnik, cukry ogółem i kofeina, jeśli Twój eksport je zawiera — i potwierdzasz podgląd tego, co zostanie dodane. To wybór pliku i podgląd, nie ćwiczenie z dyktowania — na tej ścieżce AI nigdy nie czyta ani nie przepisuje Twoich wierszy.",
                "Dwie osobliwości Lose It! są obsłużone celowo. Jego eksport niesie flagę usunięcia, a wiersze oznaczone jako usunięte są pomijane, a nie importowane: przywrócenie ich wskrzesiłoby jedzenie, które celowo usunąłeś/aś, a żadna suma na podglądzie by tego nie ujawniła. Zapisuje też dosłowny ciąg „n/a” dla komórek bez wartości, który jest odczytywany jako puste pole, a nie jako zero — więc makroskładnik, którego nigdy nie śledziłeś/aś, pozostaje nieobecny zamiast zostać zapisany jako prawdziwe 0 g i zaniżać Twoje średnie.",
                "Uruchamiaj to tak często, jak chcesz. Każdy wiersz niesie odcisk treści, więc powtórny import tego samego pliku zgłasza posiłki jako już zapisane i niczego nie dodaje. A jeśli daty w Twoim eksporcie da się odczytać na dwa sposoby — 05/06 jako maj czy czerwiec — importer pokazuje swój odczyt obok wiersza z Twojego pliku i prosi o potwierdzenie przed zapisem.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz CSV eksportowany przez Lose It!, jest on parsowany w Twojej przeglądarce, a nie odczytywany przez AI, i potwierdzasz podgląd, zanim cokolwiek zostanie zapisane. Data, jedzenie, posiłek, kalorie, białko, węglowodany i tłuszcz mapują się same, a błonnik, cukry ogółem i kofeina — również, jeśli Twój eksport je zawiera. Eksport Lose It! jest rozpoznawany po nazwie — wiersze oznaczone jako usunięte są pomijane zamiast wskrzeszane, a jego komórki „n/a” są odczytywane jako puste, a nie jako zera. Ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP ma zapisywanie ze zdjęcia jak Snap It w Lose It!?",
                a: "Tak — wyślij zdjęcie swojego talerza, a Twój AI rozpozna jedzenie i oszacuje makroskładniki, po czym zapisze je, gdy potwierdzisz. W Lose It! zapisywanie ze zdjęcia jest za płatnym planem; w Nutrition MCP jest darmowe i działa wprost w czacie.",
            },
            {
                q: "Czy mogę liczyć kalorie tak samo jak w Lose It!?",
                a: "Tak. Podstawowy schemat jest identyczny — mówisz, co zjadłeś/aś, i natychmiast dostajesz z powrotem pozostałe kalorie i makroskładniki. Różnica jest taka, że rozmawiasz ze swoim AI zamiast klikać przez aplikację, i po drodze nie ma reklam ani zachęt do upgrade'u.",
            },
        ],
    },
    "macrofactor-mcp": {
        hubBlurb:
            "Tylko subskrypcja i brak serwera MCP. Zobacz darmową alternatywę, która działa w Twoim AI.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Płatna subskrypcja po darmowym okresie próbnym (brak darmowego planu)",
            "Nadal otwierasz osobną aplikację, żeby zapisać każdy posiłek",
            "Jego adaptacyjny coaching jest produktem, nie bezwysiłkowe zapisywanie",
        ],
        note: "Adaptacyjny coaching TDEE w MacroFactor jest naprawdę dobry. Jeśli głównie zależy Ci na szybkim, darmowym zapisywaniu makroskładników wewnątrz swojego AI, Nutrition MCP to prostsze, bezkosztowe rozwiązanie.",
        migrate: {
            title: "Coaching kontra zapisywanie",
            body: [
                "Sedno MacroFactor to jego algorytm: obserwuje zapisane przez Ciebie spożycie i wagę i co tydzień po cichu przelicza Twoje cele kaloryczne i makroskładnikowe — naprawdę sprytny, adaptacyjny coaching od zespołu Stronger By Science. Ten coaching jest produktem, dlatego jest tylko na subskrypcję.",
                "Nutrition MCP nie prowadzi algorytmu coachingowego — ale skoro już jesteś wewnątrz asystenta AI, możesz po prostu zapytać. „Biorąc pod uwagę ostatnie trzy tygodnie, czy powinienem/am dostosować kalorie?” daje Ci rozsądną odpowiedź na żądanie. To inny model: analiza wtedy, kiedy chcesz, konwersacyjnie, zamiast stałego cotygodniowego przeliczenia — i jest darmowa.",
                "Uczciwy kompromis to dyscyplina kontra elastyczność. Cotygodniowe przeliczenie MacroFactor dzieje się niezależnie od tego, czy pomyślisz, żeby zapytać, co trzyma Cię w ryzach; model konwersacyjny dostosowuje się tylko wtedy, gdy o to poprosisz. Jeśli chcesz bezobsługowego algorytmu sterującego Twoimi liczbami, MacroFactor jest wart subskrypcji. Jeśli wolisz zapisywać za darmo i pobierać analizę, kiedy Ci na tym zależy, to pasuje lepiej.",
            ],
        },
        importSection: {
            title: "Dziennik się przenosi, nawet jeśli coaching nie",
            body: [
                "To, co zostawiasz, to algorytm, nie dane. Poproś o import, a w czacie otworzy się panel importera: wybierasz eksport CSV z MacroFactor, jest on parsowany w Twojej przeglądarce, rozpoznawane kolumny są mapowane automatycznie, a Ty potwierdzasz podgląd, zanim cokolwiek zostanie zapisane. Wiersze nigdy nie przechodzą przez AI, więc nic nie zostaje błędnie przepisane po drodze.",
                "Eksport MacroFactor jest rozpoznawany po nazwie — zdradza go kolumna wielkości porcji — a jego kolumny daty, jedzenia, posiłku, kalorii i makroskładników mapują się same, wliczając błonnik, cukry ogółem i kofeinę, gdy plik je zawiera. Jeśli Twój eksport podaje energię w kilodżulach zamiast kilokalorii, jest ona przeliczana, a nie zapisywana 4,184 razy za wysoko. Ponieważ kolumna nazwana po prostu „Calories” może zawierać jedną z dwóch jednostek, jednostka jest oferowana jako opcja do wyboru obok przykładu wyliczonego z Twojego pierwszego wiersza, więc to Ty ją potwierdzasz zamiast polegać na domysłach, które po cichu zawyżyłyby każdy dzień.",
                "Ta historia jest od razu użyteczna, a nie tylko zarchiwizowana. Gdy tygodnie spożycia i wagi już są w bazie, możesz zadać pytanie, na które algorytm MacroFactor odpowiadał według harmonogramu — „biorąc pod uwagę ostatnie trzy tygodnie, czy powinienem/am dostosować kalorie?” — i dostać rozsądną odpowiedź na żądanie. Ponowny import tego samego pliku niczego nie zmienia, bo każdy wiersz niesie odcisk treści, a powtórzenia wracają zgłoszone jako już zapisane.",
            ],
        },
        importFaq:
            "Tak. Poproś o import, a w czacie otworzy się importer: wybierasz eksport CSV z MacroFactor, jest on parsowany w Twojej przeglądarce, a nie odczytywany przez AI, i potwierdzasz podgląd, zanim cokolwiek zostanie zapisane. Eksport MacroFactor jest rozpoznawany po nazwie — data, jedzenie, posiłek, kalorie, białko, węglowodany i tłuszcz mapują się same, wraz z błonnikiem, cukrami ogółem i kofeiną, gdy plik je zawiera — a jeśli podaje energię w kilodżulach, jest ona przeliczana na kilokalorie po potwierdzeniu jednostki obok przykładu z Twojego pliku. Ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP dostosowuje moje cele kaloryczne tak jak MacroFactor?",
                a: "Nie automatycznie. Cotygodniowe, algorytmiczne przeliczanie MacroFactor to jego płatna główna funkcja. W Nutrition MCP pytasz — „na podstawie ostatnich trzech tygodni spożycia i wagi, czy powinienem/am dostosować kalorie?” — a Twój AI rozumuje to na żądanie, zamiast stałej cotygodniowej aktualizacji.",
            },
            {
                q: "Czy Nutrition MCP jest naprawdę darmowy, skoro MacroFactor jest tylko na subskrypcję?",
                a: "Tak. Nutrition MCP jest całkowicie darmowy i open source, bez okresu próbnego przechodzącego w płatność i bez limitów darmowego planu — w przeciwieństwie do MacroFactor, który nie ma darmowego planu i wymaga subskrypcji po okresie próbnym. Potrzebujesz tylko konta Claude albo ChatGPT.",
            },
        ],
        freeAnswer:
            "Tak. Nutrition MCP jest całkowicie darmowy i open source, bez subskrypcji — podczas gdy MacroFactor wymaga płatnej subskrypcji po darmowym okresie próbnym. Potrzebujesz tylko konta Claude albo ChatGPT, żeby się połączyć.",
    },
    "yazio-mcp": {
        hubBlurb:
            "Brak serwera MCP. Śledź posiłki i makroskładniki przez rozmowę — za darmo i open source.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Przeszukujesz bazę danych dla każdego zapisywanego produktu",
            "Część funkcji, jak plany posiłków, wymaga płatnego planu PRO",
            "Osobna aplikacja i konto do zarządzania",
        ],
        note: "Yazio to dopracowany tracker z dobrymi planami posiłków. Nutrition MCP skupia się na bezwysiłkowym, konwersacyjnym zapisywaniu, które działa wewnątrz Claude albo ChatGPT — za darmo i open source.",
        migrate: {
            title: "Plany z jednej strony, zapisywanie z drugiej",
            body: [
                "Yazio łączy śledzenie ze strukturalnymi planami posiłków, przepisami i narzędziami do postu przerywanego, dopracowanymi pod europejskiego odbiorcę. Jeśli to prowadzony plan trzyma Cię na kursie, Yazio robi to dobrze, a Nutrition MCP nawet nie próbuje — to nie jest aplikacja z planami posiłków.",
                "To, co robi, to sprawia, że połowa zapisywania staje się bezwysiłkowa. Zamiast przeszukiwać bazę danych Yazio dla każdego składnika, opisujesz danie, a Twój AI zajmuje się makroskładnikami — a potem, w tym samym tchu, odpowiada na pytanie „jak mi dziś idzie?”. Połącz to z dowolnym planem żywieniowym, którego już przestrzegasz.",
                "To sprawia, że oba te narzędzia się uzupełniają, a nie konkurują. Kontynuuj plan Yazio, albo dowolny inny, po stronie „co jeść”; użyj Nutrition MCP po stronie „czy trzymam się kursu”, zapisywanej przez rozmowę i za darmo. Jedyne miejsce, w którym nie pomoże, to liczniki postu — to terytorium Yazio, nie dziennika odżywczego.",
            ],
        },
        importSection: {
            title: "Przenieś dziennik, zmapuj kolumny",
            body: [
                "Twoja historia z Yazio może się przenieść, choć trochę pracy zrobisz sam/a. Poproś o import, a w czacie otworzy się panel importera: wybierasz swój eksport CSV, jest on parsowany w Twojej przeglądarce, a Ty wskazujesz jego kolumny na datę, jedzenie, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeinę samodzielnie. Eksporty czterech aplikacji — MyFitnessPal, Cronometer, Lose It! i MacroFactor — są rozpoznawane po nazwach kolumn; Yazio nie jest jedną z nich, więc spodziewaj się ustawienia tego mapowania raz. Wszystko po tym wygląda tak samo: podgląd tego, co zostanie dodane, a potem Twoje potwierdzenie.",
                "Europejskie osobliwości, które pokonują większość importerów, są obsłużone. Plik oddzielony średnikami, w którym liczby używają przecinka jako separatora dziesiętnego — kształt, który Excel tworzy w niemieckim albo austriackim ustawieniu regionalnym — jest odczytywany poprawnie, zamiast pomylić separator z przecinkiem dziesiętnym albo przeskalować każdy makroskładnik tysiąckrotnie. Nagłówki, które zna mapper, też nie są tylko po angielsku: niemieckie Datum, Kalorien, Eiweiss, Kohlenhydrate, Ballaststoffe, Zucker i Koffein są wszystkie rozpoznawane, a błonnik, cukier i kofeina są dopasowywane też po hiszpańsku, francusku, włosku i niderlandzku — fibra, sucres, zuccheri, suikers, cafeína, caffeina — więc zlokalizowany plik często przychodzi już częściowo zmapowany, zostawiając Ci mniej kolumn do ustawienia ręcznie. Pola w cudzysłowach, złamania wierszy wewnątrz komórki, prawie puste wartości i zabłąkane wiersze sum też są obsłużone, a AI nigdy nie czyta pliku, więc żadna liczba nie może zostać błędnie przepisana po drodze.",
                "Daty i energia są potwierdzane, nie zgadywane. Kolumna w formacie DD/MM/RRRR jest odczytywana z dniem na pierwszym miejscu, a tam, gdzie wartości naprawdę nie da się rozstrzygnąć — 05/06 jako maj czy czerwiec — importer pokazuje swój odczyt obok wiersza z Twojego pliku, żebyś mógł/mogła go poprawić. Jeśli kolumna energii jest w kilodżulach, jest przeliczana na kilokalorie, a jednostka pokazana jest jako opcja obok wyliczonego przykładu. Ponowny import tego samego pliku niczego nie dodaje: każdy wiersz niesie odcisk treści, więc powtórzenia wracają jako już zapisane.",
            ],
        },
        importFaq:
            "Tak, przy użyciu ręcznego mapowania kolumn. Poproś o import, a w czacie otworzy się importer: wybierasz swój eksport CSV z Yazio, jest on parsowany w Twojej przeglądarce, a nie odczytywany przez AI, i wskazujesz jego kolumny na datę, jedzenie, posiłek, kalorie i makroskładniki — w tym błonnik, cukry ogółem i kofeinę — samodzielnie. Yazio nie jest jednym z czterech eksportów rozpoznawanych po nazwach kolumn, więc to mapowanie to jednorazowy ręczny krok, choć nagłówki, które mapper już zna (po niemiecku, a dla błonnika, cukru i kofeiny też po hiszpańsku, francusku, włosku i niderlandzku), wypełniają się same. Europejskie pliki oddzielone średnikami z przecinkiem dziesiętnym, daty DD/MM/RRRR i kilodżule są wszystkie obsłużone, a ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP zawiera plany posiłków jak Yazio PRO?",
                a: "Nie. Strukturalne plany posiłków, przepisy i narzędzia do postu Yazio to jego mocna strona, a Nutrition MCP nawet nie próbuje ich zastąpić — obsługuje połowę dotyczącą zapisywania. Wielu ludzi kontynuuje swój plan Yazio (albo dowolny inny) i po prostu zapisuje przy nim posiłki tutaj, za darmo.",
            },
            {
                q: "Czy mogę zapisywać posiłki szybciej niż przeszukując bazę danych Yazio?",
                a: "Zwykle tak. Zamiast przeszukiwać bazę danych Yazio dla każdego składnika i ustawiać porcje, opisujesz gotowe danie jednym zdaniem — „miska musli z jogurtem i owocami” — a Twój AI szacuje i zapisuje makroskładniki w jednym kroku.",
            },
        ],
    },
    "lifesum-mcp": {
        hubBlurb:
            "Brak serwera MCP. Lżejszy, darmowy sposób na zapisywanie jedzenia wewnątrz Claude albo ChatGPT.",
        cons: [
            "Brak serwera MCP — nie działa wewnątrz Claude ani ChatGPT",
            "Zapisujesz jedzenie, przeszukując bazę danych jeden po drugim",
            "Część funkcji, jak plany dietetyczne, wymaga płatnego planu",
            "Kolejna aplikacja i subskrypcja do zarządzania",
        ],
        note: "Lifesum łączy śledzenie ze strukturalnymi planami dietetycznymi. Nutrition MCP to lżejszy, darmowy sposób na zapisywanie kalorii, makroskładników i wagi przez rozmowę ze swoim AI.",
        migrate: {
            title: "Oceny, o które po prostu pytasz",
            body: [
                "Lifesum stawia na strukturę i informację zwrotną — plany dietetyczne, przepisy i swój system ocen jedzenia, który punktuje to, co jesz. Nutrition MCP nie ocenia Twojego jedzenia odznaką, więc jeśli ta pętla punktacji Cię motywuje, Lifesum ma tu przewagę.",
                "Kompromis to elastyczność: zamiast stałej oceny, możesz zapytać swojego AI „czy to dobry wybór pod kątem moich celów?” i dostać prawdziwą odpowiedź w kontekście. Zapisywanie to jedno zdanie, trendy i waga docelowa są wbudowane, a żaden płatny poziom nie blokuje użytecznych części.",
                "Odznaka mówi Ci, że jedzenie dostało 3 na 5; rozmowa mówi Ci dlaczego i co z tym zrobić — „zamień połowę ryżu na zielone warzywa, a to pasuje do Twojego dnia”. To różnica między wynikiem a coachem, a ponieważ Lifesum stawia plany dietetyczne i część śledzenia za Premium, to Nutrition MCP jest tą darmową opcją z tych dwóch.",
            ],
        },
        importSection: {
            title: "Nic do ponownego przepisywania",
            body: [
                "Zmiana trackera oznacza przeniesienie historii, a nie musisz przepisać ani linijki. Poproś o import, a w czacie otworzy się panel importera: wybierasz swój eksport CSV z Lifesum, jest on parsowany w Twojej przeglądarce, a Ty wskazujesz jego kolumny na datę, jedzenie, posiłek, kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeinę. Nagłówki Lifesum nie są rozpoznawane po nazwie tak jak MyFitnessPal, Cronometer, Lose It! i MacroFactor, więc to mapowanie to jednorazowy ręczny krok — po nim oglądasz podgląd tego, co zostanie dodane, i potwierdzasz.",
                "Nic nie chowa się za założeniem. Mapper pokazuje Ci Twój własny plik — jego prawdziwe nagłówki, prawdziwe komórki i bieżącą liczbę wierszy, które zostaną utworzone — więc kolumna skierowana na złe pole jest widoczna, zanim cokolwiek zostanie zapisane, a nie odkrywana później. Pola w cudzysłowach, złamania wierszy wewnątrz komórki, prawie puste wartości i wiersze sum są wszystkie obsłużone, a ponieważ plik jest odczytywany w Twojej przeglądarce, AI nigdy nie widzi wiersza, który mogłoby błędnie przepisać.",
                "Europejskie eksporty są objęte wsparciem: plik oddzielony średnikami z przecinkiem dziesiętnym odczytuje się poprawnie, daty DD/MM/RRRR są przeliczane, gdy potwierdzisz kolejność, a kilodżule stają się kilokaloriami, z jednostką pokazaną obok wyliczonego przykładu z Twojego pierwszego wiersza. Zlokalizowane nagłówki też pomagają — niemieckie Kalorien, Kohlenhydrate, Ballaststoffe czy Koffein wypełniają się same, a błonnik, cukier i kofeina są dopasowywane też po hiszpańsku, francusku, włosku i niderlandzku — więc ręczne mapowanie zwykle jest krótsze, niż się wydaje. Uruchom import dwa razy, a nic się nie zduplikuje — każdy wiersz niesie odcisk treści, więc powtórzenia są zgłaszane jako już zapisane.",
            ],
        },
        importFaq:
            "Tak, przy użyciu ręcznego mapowania kolumn. Poproś o import, a w czacie otworzy się importer: wybierasz swój eksport CSV z Lifesum, jest on parsowany w Twojej przeglądarce, a nie odczytywany przez AI, i wskazujesz jego kolumny na datę, jedzenie, posiłek, kalorie i makroskładniki — wliczając błonnik, cukry ogółem i kofeinę — samodzielnie. Lifesum nie jest jednym z czterech eksportów rozpoznawanych po nazwach kolumn, więc to mapowanie to jednorazowy ręczny krok, choć nagłówki, które mapper już zna, wypełniają się same. Europejskie pliki oddzielone średnikami z przecinkiem dziesiętnym, daty DD/MM/RRRR i kilodżule są wszystkie obsłużone, a ponowny import tego samego pliku nigdy nie tworzy duplikatów.",
        extraFaqs: [
            {
                q: "Czy Nutrition MCP ocenia moje jedzenie jak system ocen Lifesum?",
                a: "Nie — nie ma odznaki ani liczbowego wyniku. Zamiast tego możesz zapytać swojego AI „czy to dobry wybór pod kątem moich celów?” i dostać kontekstową odpowiedź, która wyjaśnia kompromisy, zamiast stałej oceny samego jedzenia.",
            },
            {
                q: "Czy Nutrition MCP jest darmowy bez planu w stylu Lifesum Premium?",
                a: "Tak. Nutrition MCP jest całkowicie darmowy i open source, bez płatnego poziomu — podczas gdy Lifesum stawia plany dietetyczne i część funkcji śledzenia za subskrypcją Premium. Potrzebujesz tylko konta Claude albo ChatGPT, żeby się połączyć.",
            },
        ],
    },
};

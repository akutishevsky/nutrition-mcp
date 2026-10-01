import type { ToolsDoc } from "./tools.js";

export const TOOLS_PL: ToolsDoc = {
    meta: {
        title: "Katalog narzędzi: wszystkie 36 narzędzi",
        description:
            "Wszystkie 36 narzędzi, które serwer Nutrition MCP daje Twojemu AI — zapisuj posiłki, skanuj kody kreskowe, importuj historię z innej aplikacji, śledź wodę i wagę, ustawiaj cele i przeglądaj trendy. Pełny opis wraz z przykładowymi poleceniami.",
        ogDescription:
            "Wszystkie 36 narzędzi, które serwer Nutrition MCP daje Twojemu AI, w tym importer CSV do przenoszenia historii z innej aplikacji — z opisami i przykładowymi poleceniami.",
    },
    hero: {
        eyebrow: "Dokumentacja",
        titleBeforeEm: "Wszystko, co ",
        titleEm: "potrafi",
        titleAfterEm: " Twój AI",
        lead: "Nigdy nie wywołujesz tych narzędzi bezpośrednio — po prostu mówisz, a asystent sam wybiera właściwe. Oto pełny zestaw udostępniany przez serwer Nutrition MCP, wraz z opisem działania i przykładowym poleceniem, które je uruchamia.",
        countBold: "36 narzędzi",
        countTail: "w 7 obszarach",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Zapisywanie",
            title: "Zapisywanie jedzenia i posiłków",
            description:
                "Podstawa wszystkiego — zapisz, co zjadłeś/aś, jakkolwiek to opiszesz.",
        },
        "reviewing-your-meals": {
            pillLabel: "Przegląd",
            title: "Przegląd posiłków",
            description:
                "Wróć do tego, co już zapisałeś/aś — jeden dzień albo cały zakres naraz.",
        },
        water: {
            pillLabel: "Woda",
            title: "Woda",
            description: "Śledź nawodnienie razem z jedzeniem.",
        },
        weight: {
            pillLabel: "Waga",
            title: "Waga",
            description:
                "Zapisuj ważenia, przeglądaj je i obserwuj trend w kierunku celu.",
        },
        "goals-progress": {
            pillLabel: "Cele",
            title: "Cele i postępy",
            description: "Ustaw cele i sprawdzaj, jak wypada każdy dzień.",
        },
        "insights-trends": {
            pillLabel: "Analizy",
            title: "Analizy i trendy",
            description:
                "Gotowe zestawienia, dzięki którym AI dostrzega wzorce bez liczenia od nowa.",
        },
        "settings-account": {
            pillLabel: "Ustawienia",
            title: "Ustawienia i konto",
            description:
                "Preferencje, które dbają o dokładność danych, plus pełna kontrola nad Twoimi danymi.",
        },
    },
    badges: {
        log: "Zapis",
        widget: "Interaktywny widok",
        lookup: "Wyszukiwanie",
        import: "Import",
        edit: "Edycja",
        remove: "Usuwanie",
        view: "Podgląd",
        export: "Eksport",
        setting: "Ustawienie",
    },
    ui: {
        parametersLabel: "Parametry",
        requiredLabel: "wymagane",
        optionalLabel: "opcjonalne",
        trySayingLabel: "Spróbuj powiedzieć",
        categoriesLabel: "Kategorie narzędzi",
    },
    tools: {
        log_meal: {
            description:
                "Zapisz, co zjadłeś/aś, wraz z kaloriami i makroskładnikami — a także błonnikiem, cukrami ogółem, alkoholem i kofeiną, jeśli te wartości są dostępne. Opisz to zwykłym językiem — AI szacuje wartości, dopytuje o wielkość porcji, gdy nie jest jasna, i może wcześniej pobrać dane z etykiety na podstawie kodu kreskowego albo z internetu.",
            params: {
                description: "Co zostało zjedzone",
                meal_type: "śniadanie, obiad, kolacja lub przekąska",
                calories: "Łączna liczba kalorii",
                protein_g: "Białko w gramach",
                carbs_g: "Węglowodany w gramach",
                fat_g: "Tłuszcz w gramach",
                fiber_g:
                    "Błonnik pokarmowy w gramach. AI ma polecenie uzupełniać tę wartość przy każdym posiłku, szacując ją ze składników, gdy brak danych z etykiety — bo puste pole to nie to samo co zero: wyklucza cały dzień ze średniej spożycia błonnika",
                sugar_g:
                    '<b>Łączna</b> zawartość cukrów w gramach — wartość, którą etykieta podaje pod hasłem „Cukry", wliczając cukier naturalnie występujący w owocach i mleku, a nie tylko cukier dodany. Uzupełniane przy każdym posiłku na tych samych zasadach co błonnik',
                alcohol_g:
                    "Gramy <b>czystego etanolu</b>, a nie objętość napoju ani jego zawartość alkoholu (ABV) — AI wylicza to na podstawie ilości i mocy trunku (330 ml piwa 5% to 13 g)",
                caffeine_mg:
                    "Kofeina w <b>miligramach</b>, nie w gramach — to jedyne pole tutaj podawane nie w gramach, bo tak podaje się ją na każdej etykiecie i w każdych wytycznych (parzona kawa to ok. 95 mg, espresso 63 mg, puszka coli 34 mg). Kofeina nie dodaje kalorii. W przeciwieństwie do błonnika i cukru wysyła się ją tylko dla produktów, które faktycznie zawierają kofeinę — zapisane 0 umieściłoby wiersz kofeiny na panelu dla składnika, którego w ogóle nie spożywasz",
                logged_at:
                    "Kiedy to zjadłeś/aś, jeśli nie teraz — pozwala zapisać coś z opóźnieniem",
                notes: "Dodatkowe notatki",
            },
            example:
                "Zapisz burrito bowl z kurczakiem i dodatkowym guacamole na obiad",
            photoHint:
                "…albo po prostu zrób zdjęcie swojego talerza — AI nazywa każde danie, szacuje porcje w codziennych miarach (szklanka, garść), sprawdza, jak zapisywałeś/aś to wcześniej, i potwierdza z Tobą przed zapisaniem.",
        },
        lookup_barcode: {
            description:
                "Pobierz z Open Food Facts dane odżywcze z etykiety produktu paczkowanego na podstawie kodu kreskowego (8–14 cyfr EAN/UPC). Możesz wpisać cyfry albo odczytać je ze zdjęcia opakowania; wynik można potem zapisać, przeliczony na zjedzoną ilość.",
            params: {},
            example: "Zeskanuj ten kod kreskowy: 3017620422003",
            photoHint:
                "…albo wyślij zdjęcie opakowania — AI odczyta z niego cyfry kodu kreskowego.",
        },
        start_meal_import: {
            description:
                "Otwórz w czacie importer, który przeniesie Twoją historię z innej aplikacji — wybierz plik wyeksportowany z MyFitnessPal, Cronometer, Lose It! lub MacroFactor, dopasuj jego kolumny do kalorii, makroskładników, błonnika, cukru i kofeiny — a także alkoholu, jeśli włączyłeś/aś jego śledzenie — i sprawdź, co zostanie dodane, zanim potwierdzisz. Plik jest odczytywany w Twojej przeglądarce, nic nie zostaje zapisane przed zaakceptowaniem podglądu, a ponowny import tego samego pliku nie tworzy duplikatów.",
            params: {},
            example: "Zaimportuj moją historię posiłków z MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Dodaj naraz partię wcześniejszych posiłków — do 50 na raz — zamiast zapisywać je jeden po drugim. Powyższy importer korzysta właśnie z tego narzędzia, a AI może użyć go bezpośrednio dla danych posiłków wklejonych do czatu. Każdy wiersz jest najpierw sprawdzany, a to, co się nie zgadza, jest zgłaszane wiersz po wierszu, więc ponowne wysłanie tych samych wierszy jest bezpieczne i nie zduplikuje tego, co już zapisano, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            params: {
                meals: "Wiersze do zaimportowania, w kolejności z pliku źródłowego (1–50 na wywołanie). Każdy wiersz może zawierać czas, typ posiłku, opis, notatki oraz te same wartości co zapisany posiłek: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (cukry ogółem), <code>alcohol_g</code> (gramy czystego etanolu) i <code>caffeine_mg</code> (miligramy, nie gramy)",
                expected_row_count:
                    "Ile wierszy zawiera to wywołanie, policzone z pliku źródłowego, żeby wychwycić pominięty wiersz",
                expected_total_kcal:
                    "Suma kalorii z pliku źródłowego, porównywana z tym, co faktycznie przychodzi",
                dry_run: "Zgłoś, co by się stało, bez zapisywania czegokolwiek",
                on_error:
                    "Zaimportuj poprawne wiersze i zgłoś resztę, albo nie zapisuj niczego, jeśli jakikolwiek wiersz zawiedzie",
                source_app: "Z jakiej aplikacji pochodzi plik",
            },
            example:
                "Oto posiłki z zeszłego tygodnia wklejone z mojej starej aplikacji — dodaj je wszystkie",
        },
        update_meal: {
            description:
                "Zmień szczegóły posiłku, który już zapisałeś/aś — jego opis, dowolny makroskładnik, błonnik, cukier, alkohol lub kofeinę, godzinę albo notatki. Tak też uzupełnia się brakujące dane: jeśli posiłek trafił do bazy bez błonnika czy cukru, serwer to sygnalizuje, a AI uzupełnia to tutaj, jeśli się zgodzisz.",
            params: {
                id: "UUID posiłku do zaktualizowania",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Cukry ogółem, nie cukier dodany",
                alcohol_g: "Gramy czystego etanolu, nie objętość napoju",
                caffeine_mg: "Miligramy, nie gramy",
                logged_at: "",
                notes: "",
            },
            example:
                "Właściwie ten obiad miał 600 kalorii, nie 500 — popraw to",
        },
        delete_meal: {
            description: "Usuń wpis posiłku zapisany przez pomyłkę.",
            params: {
                id: "UUID posiłku do usunięcia",
            },
            example: "Usuń przekąskę, którą zapisałem/am dziś po południu",
        },
        search_meals: {
            description:
                "Przeszukaj swoje wcześniejsze posiłki po słowie kluczowym i zobacz je pogrupowane w powtarzające się warianty — jak często dany posiłek był zapisywany, kiedy ostatnio i jakie są jego typowe kalorie. Dzięki temu AI sprawdza zdjęcie Twojego talerza w kontekście tego, jak faktycznie zapisywałeś/aś ten posiłek wcześniej, i dzięki temu działa polecenie „zapisz moje zwykłe śniadanie”.",
            params: {
                queries:
                    "Alternatywne słowa kluczowe dotyczące jedzenia, w dowolnym języku, w którym zapisywałeś/aś posiłki",
                days: "Jak daleko wstecz szukać (domyślnie rok)",
                limit: "Maksymalna liczba wpisów do analizy",
            },
            example: "Zapisz moje zwykłe śniadanie",
        },
        get_meals_today: {
            description: "Zobacz każdy posiłek zapisany dzisiaj.",
            params: {
                detail: "<code>compact</code> (domyślnie) — jeden wiersz na posiłek wraz z jego identyfikatorem — albo <code>full</code>, by dołączyć notatki i dokładne godziny",
            },
            example: "Co dzisiaj zjadłem/am?",
        },
        get_meals_by_date: {
            description: "Zobacz wszystkie posiłki zapisane w konkretnym dniu.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
                detail: "<code>compact</code> (domyślnie) — jeden wiersz na posiłek wraz z jego identyfikatorem — albo <code>full</code>, by dołączyć notatki i dokładne godziny",
            },
            example: "Pokaż mi wszystko, co zjadłem/am 4 lipca",
        },
        get_meals_by_date_range: {
            description:
                "Pobierz naraz wszystkie posiłki z zadanego zakresu dat — przydatne przy przeglądaniu tygodnia albo miesiąca. Jedno wywołanie obejmuje do 31 dni; dla dłuższych okresów trendy i podsumowania podają sumy dzienne.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date:
                    "Data końcowa (RRRR-MM-DD), najwyżej 31 dni łącznie z dniem początkowym",
                detail: "<code>compact</code> (domyślnie) — jeden wiersz na posiłek wraz z jego identyfikatorem — albo <code>full</code>, by dołączyć notatki i dokładne godziny",
            },
            example: "Pokaż moje posiłki od poniedziałku do piątku",
        },
        export_all_data: {
            description:
                "Wyeksportuj wszystko, co usługa o Tobie przechowuje, jako jeden plik ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv, account.csv (Twoje konto logowania), telemetry.csv (zapisy korzystania z narzędzi), connections.csv (Twoje połączone aplikacje AI, bez żadnych tokenów) oraz README.txt z wyjaśnieniem kolumn, jednostek i tego, czego eksport nie obejmuje — pod tym samym prywatnym linkiem, ważnym przez 60 minut. Na razie tylko posiłki można zaimportować z powrotem.",
            params: {},
            example:
                "Wyeksportuj wszystkie moje dane — posiłki, wodę, wagę i cele",
        },
        log_water: {
            description:
                "Zapisz nawodnienie. Podaj ilość w dowolnej jednostce — szklankach, uncjach, litrach — a zostanie przeliczona na mililitry.",
            params: {
                amount_ml: "Ilość w mililitrach (liczba całkowita, &gt; 0).",
            },
            example: "Właśnie wypiłem/am butelkę wody 500 ml",
        },
        get_water_today: {
            description:
                "Zobacz dzisiejszą łączną ilość wypitej wody i każdy wpis.",
            params: {},
            example: "Ile wody wypiłem/am dzisiaj?",
        },
        get_water_by_date: {
            description: "Zobacz sumę wody i wpisy z konkretnego dnia.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
            },
            example: "Ile wypiłem/am wczoraj?",
        },
        delete_water: {
            description: "Usuń wpis wody dodany przez pomyłkę.",
            params: {
                id: "UUID wpisu wody do usunięcia",
            },
            example: "Usuń ten ostatni wpis wody",
        },
        log_weight: {
            description:
                "Zapisz pomiar masy ciała w kg lub lb. Kilka ważeń dziennie nie jest problemem, a serwer przechowuje wartość w jednej, wewnętrznej jednostce, więc Twoja preferencja jednostki nigdy nie zniekształca liczby.",
            params: {
                weight: "Wartość masy ciała, w jednostce <code>unit</code> (&gt; 0).",
            },
            example: "Zapisz moją wagę — 74,2 kg dziś rano",
        },
        update_weight: {
            description:
                "Popraw istniejące ważenie — wartość, znacznik czasu albo notatki.",
            params: {
                id: "UUID wpisu wagi do zaktualizowania",
                weight: "Nowa wartość wagi, w jednostce <code>unit</code>.",
                logged_at: "Znacznik czasu w formacie ISO 8601",
                notes: "",
            },
            example: "Popraw dzisiejsze poranne ważenie na 73,8 kg",
        },
        delete_weight: {
            description: "Usuń wpis wagi.",
            params: {
                id: "UUID wpisu wagi do usunięcia",
            },
            example: "Usuń dzisiejszy wpis wagi",
        },
        get_weight_today: {
            description:
                "Zobacz dzisiejsze ważenia, w preferowanej przez Ciebie jednostce.",
            params: {},
            example: "Ile dziś ważyłem/am?",
        },
        get_weight_by_date: {
            description: "Zobacz swoje ważenia z konkretnego dnia.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
            },
            example: "Ile ważyłem/am pierwszego dnia miesiąca?",
        },
        get_weight_by_date_range: {
            description:
                "Pobierz wszystkie ważenia z zadanego zakresu dat, pogrupowane dniami wraz ze średnią dla każdego dnia.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date: "Data końcowa (RRRR-MM-DD)",
            },
            example: "Pokaż moje ważenia z ostatnich dwóch tygodni",
        },
        get_weight_trends: {
            description:
                "Zobacz trend swojej wagi w wybranym okresie: ostatni pomiar, całkowitą zmianę, średnie kroczące 7/14/30-dniowe, minimum/maksimum oraz postęp w kierunku wagi docelowej.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, maksymalnie 365).",
            },
            example: "Jak wygląda trend mojej wagi w tym miesiącu?",
        },
        set_weight_unit: {
            description:
                "Wybierz, czy waga ma być pokazywana i wprowadzana w kg czy w lb. Zapisane wartości pozostają bez zmian — zmienia się tylko wyświetlanie i domyślne parsowanie.",
            params: {},
            example: "Od teraz pokazuj moją wagę w funtach",
        },
        set_nutrition_goals: {
            description:
                "Ustaw dzienne cele dotyczące kalorii, makroskładników, błonnika, cukru, alkoholu, kofeiny i wody, a także opcjonalną docelową masę ciała. Kalorie, białko, węglowodany, tłuszcz, błonnik i woda to cele do osiągnięcia; cukier, alkohol i kofeina to limity, których nie należy przekraczać, a postęp jest opisywany odpowiednio do tego. Aktualizowane są tylko wskazane pola; reszta pozostaje bez zmian.",
            params: {
                daily_calories:
                    "Dzienny cel kaloryczny (kcal). Null, aby wyczyścić.",
                daily_protein_g:
                    "Dzienny cel białka (gramy). Null, aby wyczyścić.",
                daily_carbs_g:
                    "Dzienny cel węglowodanów (gramy). Null, aby wyczyścić.",
                daily_fat_g:
                    "Dzienny cel tłuszczu (gramy). Null, aby wyczyścić.",
                daily_fiber_g:
                    "Dzienny cel błonnika (gramy), minimum do osiągnięcia. Null, aby wyczyścić.",
                daily_sugar_g:
                    "Dzienny limit cukrów <b>ogółem</b> (gramy), maksimum, którego nie należy przekraczać. Cukry ogółem obejmują cukier naturalnie występujący w owocach i mleku, więc publiczne wytyczne dotyczące cukru dodanego podają znacznie niższą liczbę. Null, aby wyczyścić.",
                daily_alcohol_g:
                    "Dzienny limit alkoholu w gramach <b>czystego etanolu</b>, maksimum, którego nie należy przekraczać. Jeden standardowy drink w USA to 14 g, jedna jednostka brytyjska to 7,9 g. Null, aby wyczyścić.",
                daily_caffeine_mg:
                    "Dzienny limit kofeiny w <b>miligramach</b>, maksimum, którego nie należy przekraczać. Górna granica EFSA i FDA dla zdrowych dorosłych to 400 mg dziennie (mniej więcej cztery parzone kawy), a 200 mg w ciąży. 0 to realny limit oznaczający całkowity brak. Null, aby wyczyścić.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Ustaw moje cele na 2200 kalorii, 160 g białka i docelową wagę 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Zobacz swoje aktualne dzienne cele kaloryczne i makroskładnikowe, ewentualny cel błonnika oraz limit cukru czy kofeiny, a jeśli śledzisz alkohol — również jego limit.",
            params: {},
            example: "Jakie są moje dzienne cele?",
        },
        get_goal_progress: {
            description:
                "Zobacz, jak dzisiejsze spożycie wypada na tle Twoich celów — pierścienie spożycia względem celu oraz postęp wagi ciała. Dotknij pierścienia makroskładnika, żeby zobaczyć, które posiłki się na niego złożyły.",
            params: {},
            example: "Jak mi dzisiaj idzie względem moich celów?",
        },
        get_nutrition_summary: {
            description:
                "Pobierz dzienne sumy odżywcze z zadanego zakresu dat jako interaktywny panel: kafelki makroskładników względem celów oraz podział dzień po dniu. Jedno wywołanie obejmuje do 92 dni; dla dłuższych okresów trendy podają średnie kroczące.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date:
                    "Data końcowa (RRRR-MM-DD), najwyżej 92 dni łącznie z dniem początkowym",
            },
            example: "Podsumuj mi ten ostatni tydzień",
        },
        get_trends: {
            description:
                "Kroczące średnie 7/14/30-dniowe, zmienność, serie kolejnych dni z wpisami, średnie kalorie według dni tygodnia oraz Twoje najlepsze i najgorsze dni pod względem kalorii — policzone z góry, więc AI może po prostu je opisać.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, maksymalnie 365).",
            },
            example:
                "Jakie są moje trendy kaloryczne i makroskładnikowe w ostatnich 30 dniach?",
        },
        get_meal_patterns: {
            description:
                "Pokaż wzorce zachowań: jak często jesz każdy typ posiłku, efekt śniadania, wysokokaloryczne obiady, późne kolacje, dni robocze kontra weekend oraz dni odstające.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, minimum 7, maksymalnie 365).",
            },
            example:
                "Czy widać jakieś wzorce w moim jedzeniu — na przykład późne kolacje albo pomijanie śniadań?",
        },
        get_profile: {
            description:
                "Zobacz wszystkie swoje aktualne ustawienia naraz: strefę czasową (a także lokalną datę i godzinę), język widżetów, preferowaną jednostkę wagi, czy widżety w czacie są włączone oraz czy śledzenie alkoholu jest włączone.",
            params: {},
            example: "Jakie są moje obecne ustawienia?",
        },
        set_timezone: {
            description:
                "Ustaw swoją strefę czasową IANA, żeby dni zmieniały się o Twojej lokalnej północy — posiłek zapisany o 23:00 liczy się do tego dnia, nie do kolejnego dnia UTC.",
            params: {},
            example: "Jestem w Berlinie — ustaw moją strefę czasową",
        },
        set_language: {
            description:
                "Ustaw język interfejsu widżetów w czacie — paneli i wykresów, nie treści, które pisze do Ciebie AI.",
            params: {
                locale: "Kod ISO 639-1, np. <code>de</code>, <code>uk</code>. Obsługiwane języki: angielski, niemiecki, hiszpański, francuski, niderlandzki, polski, włoski, ukraiński.",
            },
            example: "Pokazuj moje widżety po niemiecku",
        },
        get_current_time: {
            description:
                'Sprawdź aktualną datę i godzinę w Twojej strefie czasowej, a także moment w czasie UTC. Niektóre aplikacje nie mówią asystentowi, która jest godzina, więc dzięki temu narzędziu wie, co oznacza „dziś rano" albo „dzisiaj", bez pytania Cię o to (domyślnie UTC, jeśli strefa czasowa nie jest ustawiona).',
            params: {},
            example: "Która jest teraz u mnie godzina?",
        },
        set_widget_display: {
            description:
                "Włącz lub wyłącz wizualne widżety w czacie — panele, pierścienie celów i wykresy trendów. Gdy są wyłączone, te same narzędzia odpowiadają wyłącznie tekstem i danymi. Domyślnie włączone; zmiana dotyczy nowych rozmów.",
            params: {
                enabled:
                    "true, aby pokazywać widżety, false dla odpowiedzi tylko tekstowych",
            },
            example: "Wyłącz widżety",
        },
        set_alcohol_tracking: {
            description:
                "Włącz lub wyłącz śledzenie alkoholu i wybierz, czy drinki mają być liczone w standardowych drinkach amerykańskich czy jednostkach brytyjskich. Domyślnie jest wyłączone, więc musisz o to poprosić. Ponowne wyłączenie ukrywa alkohol z posiłków, celów i postępów oraz sprawia, że importer plików przestaje odczytywać kolumnę alkoholu — nic, co już zapisano, nie zostaje usunięte, Twój eksport CSV nadal to zawiera, a wszystko pojawia się z powrotem po ponownym włączeniu. Zmiana obowiązuje od kolejnej wiadomości, bez potrzeby restartu czegokolwiek.",
            params: {
                enabled:
                    "true, aby pokazywać alkohol w posiłkach, celach i postępach, false, aby go ukryć",
                drink_unit:
                    "Który standardowy drink pokazywać obok gramów: <code>us</code> (14 g na drinka) lub <code>uk</code> (7,9 g na jednostkę). Domyślnie <code>us</code>; faktycznie przechowywane są gramy czystego etanolu.",
            },
            example: "Zacznij śledzić moje picie, w jednostkach brytyjskich",
        },
        delete_account: {
            description:
                "Trwale usuń swoje konto Nutrition MCP i wszystkie dane, które usługa o Tobie przechowuje. To działanie jest nieodwracalne — AI zawsze najpierw potwierdza to z Tobą.",
            params: {},
            example: "Usuń moje konto i wszystkie moje dane",
        },
    },
    troubleshooting: {
        pillLabel: "Pomoc",
        title: "Rozwiązywanie problemów",
        description:
            "Coś nie działa? Większość problemów da się szybko rozwiązać.",
        stillStuck: "Nadal masz problem?",
        items: {
            "cannot-connect": {
                question:
                    "Konektor nie chce się połączyć albo ciągle prosi o zalogowanie",
                answerHtml:
                    "Usuń konektor i dodaj go ponownie, podając dokładnie <code>https://nutrition-mcp.com/mcp</code> — część <code>/mcp</code> jest wymagana. W Claude otwórz <strong>Customize</strong> → <strong>Connectors</strong>, rozłącz Nutrition i połącz go ponownie; w ChatGPT użyj <strong>Settings</strong> → <strong>Apps</strong>. Zaloguj się tym samym adresem e-mail i hasłem albo tym samym kontem Google co wcześniej: Twoje dane należą do Twojego konta, a nie do połączenia, więc ponowne połączenie niczego nie usuwa. Raz połączony konektor pozostaje połączony, dopóki korzystasz z niego co najmniej raz na 90 dni; jeśli przestanie działać, połącz go ponownie w ten sam sposób.",
            },
            "session-expired": {
                question:
                    'Strona logowania pokazuje {"error":"session_expired"}',
                answerHtml:
                    "Strona logowania jest ważna tylko przez 10 minut, a do tego resetuje się przy każdym restarcie serwera związanym z aktualizacją. Wróć na stronę logowania i odśwież ją albo zacznij łączenie od nowa w swojej aplikacji AI, a potem zaloguj się bez dłuższej przerwy. Jeśli zamiast tego widzisz <code>session_mismatch</code>, logowanie zostało dokończone w innej przeglądarce niż ta, w której się zaczęło: zacznij od nowa w swojej aplikacji AI i dokończ w tej samej przeglądarce.",
            },
            "cannot-sign-in": {
                question: "Nie mogę się zalogować albo nie pamiętam hasła",
                answerHtml:
                    'Użyj <strong>Zaloguj się</strong> do konta, które już masz: błędny e-mail lub hasło pokazuje tam „Nieprawidłowy e-mail lub hasło” i nigdy nie zakłada nowego konta. <strong>Załóż konto</strong> służy tylko przy pierwszej wizycie. Sprawdź, czy w adresie e-mail nie ma literówki. Jeśli konto zostało założone przez <strong>Kontynuuj z Google</strong>, użyj ponownie tego przycisku. Samodzielnego resetowania hasła jeszcze nie ma: napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> z adresu przypisanego do konta, a zresetuję je.',
            },
            "history-missing": {
                question: "Po ponownym połączeniu zniknęła moja historia",
                answerHtml:
                    'Każdy adres e-mail to osobne konto, więc zalogowanie się innym adresem otwiera puste konto — nic nie zostało usunięte. Rozłącz się i zaloguj ponownie adresem, którego używałeś/aś na początku. Jeśli nie masz pewności, który to był, napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "AI odpowiada, ale niczego nie zapisuje",
                answerHtml:
                    "Upewnij się, że konektor jest włączony w tej rozmowie — w Claude sprawdź menu narzędzi w polu wiadomości — i poproś wprost, na przykład „zapisz moje śniadanie w Nutrition”. Jeśli aplikacja poprosi o zgodę na użycie narzędzia, zatwierdź ją.",
            },
            "wrong-day": {
                question: "Moje posiłki trafiają pod zły dzień",
                answerHtml:
                    'Dni są liczone w Twojej strefie czasowej, a jeśli nigdy jej nie ustawiłeś/aś, używany jest UTC. Zapytaj „jaką mam ustawioną strefę czasową?” (<a href="#get_profile"><code>get_profile</code></a>), a jeśli jest błędna, poproś „ustaw moją strefę czasową na Europe/Berlin” (<a href="#set_timezone"><code>set_timezone</code></a>). Wtedy wszystko, co zapisałeś/aś, jest grupowane według Twojego lokalnego dnia, łącznie z wcześniejszymi wpisami. Jedyny wyjątek to wpis, któremu podałeś/aś konkretną godzinę, gdy strefa czasowa była błędna: zachowuje on datę i godzinę, z jaką został wtedy zapisany, więc nadal może być przesunięty o godzinę lub dzień — poproś AI o przeniesienie go na właściwą datę i godzinę (<a href="#update_meal"><code>update_meal</code></a>). Strefę czasową ustaw też przed importem historii: zaimportowane posiłki zachowują datę i godzinę, z jaką zostały zapisane, a ponowny import pliku z innej aplikacji po zmianie strefy czasowej doda je po raz drugi. Eksport z Nutrition MCP zostanie rozpoznany i nie utworzy duplikatów.',
            },
            "no-widgets": {
                question: "Widzę tylko tekst, bez wykresów i kart",
                answerHtml:
                    'Karty wizualne wymagają aplikacji obsługującej interaktywne panele MCP Apps, takiej jak Claude lub ChatGPT; pozostałe aplikacje dostają te same informacje w formie tekstu. Jeśli wyłączyłeś/aś widżety, poproś o ich ponowne włączenie (<a href="#set_widget_display"><code>set_widget_display</code></a>) i zacznij nową rozmowę — otwarty czat zachowuje stare ustawienie, dopóki nie połączy się ponownie. Mała karta po zapisaniu posiłku pojawia się dopiero wtedy, gdy ustawisz dzienne cele (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "Importer się nie otwiera albo pisze, że nie może zapisać",
                answerHtml:
                    'Panel importera wymaga aplikacji, która wyświetla interaktywne panele i ma włączone widżety. Jeśli pokazuje komunikat <em>Ta aplikacja nie pozwala temu widokowi zapisywać danych w Twoim dzienniku</em> albo w ogóle się nie pojawia, poproś AI o samodzielne zaimportowanie pliku: załącz lub wklej CSV, a AI użyje narzędzia <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, które sprawdza każdy wiersz i pomija duplikaty, więc ponowne wysłanie jest bezpieczne, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa. Strefę czasową ustaw przed pierwszym importem: ponowny import pliku z innej aplikacji po jej zmianie doda wiersze jeszcze raz. Jeśli korzystasz z panelu importera i chcesz zachować kolumnę z alkoholem, najpierw włącz śledzenie alkoholu — panel pomija tę kolumnę, dopóki śledzenie jest wyłączone, a późniejszy ponowny import jej nie uzupełni.',
            },
            "rate-limited": {
                question:
                    "Widzę „Rate limit exceeded” albo „Too many failed authentication attempts”",
                answerHtml:
                    "Każde konto może wysłać 60 żądań na minutę, a każde wywołanie narzędzia liczy się jako co najmniej jedno. Odczekaj tyle sekund, ile podaje komunikat, i kontynuuj. Do uzupełniania wielu wcześniejszych posiłków używaj importera zamiast zapisywać je jeden po drugim. Strony logowania przyjmują 30 żądań na minutę z jednej sieci. Po 20 odrzuconych z rzędu próbach połączenia z jednej sieci — zwykle to stary, odłączony konektor, który wciąż ponawia próby — połączenia z tej sieci są wstrzymywane na 5 minut, a kolejne blokady wydłużają się maksymalnie do godziny. Usunięcie starego konektora i dodanie go ponownie kończy te próby.",
            },
            "barcode-not-found": {
                question:
                    "Kod kreskowy nie zostaje znaleziony albo jego wartości wyglądają na błędne",
                answerHtml:
                    "Dane kodów kreskowych pochodzą z Open Food Facts, społecznościowej bazy danych, więc niektórych produktów brakuje, a niektóre wpisy są nieaktualne. Upewnij się, że wszystkie cyfry pod kodem kreskowym (od 8 do 14) zostały odczytane poprawnie. Jeśli produktu nie ma w bazie, AI może oszacować wartości na podstawie nazwy albo zdjęcia etykiety z wartościami odżywczymi, a Ty możesz później poprawić dowolną liczbę. Dodanie produktu na openfoodfacts.org pomaga wszystkim. Open Food Facts nie ma danych o kofeinie, więc kofeina pochodzi z etykiety albo z typowych ilości.",
            },
            "export-link": {
                question: "Link do pobrania eksportu nie działa",
                answerHtml:
                    'Linki do eksportu wygasają po 60 minutach, a każdy nowy eksport zastępuje poprzedni plik. Poproś o nowy eksport (<a href="#export_all_data"><code>export_all_data</code></a>) i pobierz go od razu. Jeśli eksport pokazuje 0 posiłków, a powinna tam być Twoja historia, prawdopodobnie logujesz się innym adresem e-mail — zobacz <a href="#history-missing">zniknęła historia</a>.',
            },
            "delete-account": {
                question: "Jak usunąć konto?",
                answerHtml:
                    'Poproś AI o usunięcie Twojego konta Nutrition MCP (<a href="#delete_account"><code>delete_account</code></a>). AI poprosi o potwierdzenie, a następnie trwale usunie Twoje posiłki, wodę, wagę, cele, ustawienia, zapis tego, z jakich narzędzi korzystała Twoja aplikacja AI, ewentualny plik eksportu, dane logowania i samo konto. Tego nie da się cofnąć, więc jeśli chcesz mieć kopię, najpierw wyeksportuj dane. Potem usuń konektor ze swojej aplikacji. Ponowne zalogowanie się w przyszłości tym samym adresem e-mail utworzy nowe, puste konto.',
            },
            "report-a-problem": {
                question: "Jak zgłosić błąd lub problem z bezpieczeństwem?",
                answerHtml:
                    'Błędy zgłaszaj w <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: napisz, z jakiej aplikacji korzystasz (Claude, ChatGPT, …), o co prosiłeś/aś, co się stało i mniej więcej kiedy. Nigdy nie podawaj swojego hasła. Nie zgłaszaj problemów z bezpieczeństwem publicznie: zgłoś je prywatnie przez <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">prywatne zgłaszanie podatności w GitHubie</a> albo e-mailem, zgodnie z <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">polityką bezpieczeństwa</a>. We wszystkich innych sprawach napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

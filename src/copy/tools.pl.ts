import type { ToolsDoc } from "./tools.js";

export const TOOLS_PL: ToolsDoc = {
    meta: {
        title: "Katalog narzędzi: wszystkie 38 narzędzi",
        description:
            "Wszystkie 38 narzędzi, które serwer Nutrition MCP daje Twojemu AI — zapisuj posiłki, skanuj kody kreskowe, importuj historię z innej aplikacji, śledź wodę i wagę, ustawiaj cele i przeglądaj trendy. Pełny opis wraz z przykładowymi poleceniami.",
        ogDescription:
            "Wszystkie 38 narzędzi, które serwer Nutrition MCP daje Twojemu AI, w tym importer CSV do przenoszenia historii z innej aplikacji — z opisami i przykładowymi poleceniami.",
    },
    hero: {
        eyebrow: "Dokumentacja",
        title: "Wszystko, co potrafi Twój AI",
        lead: "Nigdy nie wywołujesz tych narzędzi bezpośrednio — po prostu mówisz, a asystent sam wybiera właściwe. Oto pełny zestaw udostępniany przez serwer Nutrition MCP, wraz z opisem działania i przykładowym poleceniem, które je uruchamia.",
        countBold: "38 narzędzi",
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
                "Dodaj naraz partię wcześniejszych posiłków — do 50 na raz — zamiast zapisywać je jeden po drugim. Powyższy importer korzysta właśnie z tego narzędzia, a AI może użyć go bezpośrednio dla danych posiłków wklejonych do czatu. Każdy wiersz jest najpierw sprawdzany, a to, co się nie zgadza, jest zgłaszane wiersz po wierszu, więc ponowne wysłanie tych samych wierszy jest bezpieczne i nie zduplikuje tego, co już zapisano.",
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
                "Zmień szczegóły posiłku, który już zapisałeś/aś — jego opis, dowolny makroskładnik, błonnik, cukier, alkohol lub kofeinę, godzinę albo notatki. Tak też uzupełnia się brakujące dane: jeśli posiłek trafił do bazy bez błonnika czy cukru, serwer to sygnalizuje, a AI uzupełnia to tutaj.",
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
            params: {},
            example: "Co dzisiaj zjadłem/am?",
        },
        get_meals_by_date: {
            description: "Zobacz wszystkie posiłki zapisane w konkretnym dniu.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
            },
            example: "Pokaż mi wszystko, co zjadłem/am 4 lipca",
        },
        get_meals_by_date_range: {
            description:
                "Pobierz naraz wszystkie posiłki z zadanego zakresu dat — przydatne przy przeglądaniu tygodnia albo miesiąca.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date: "Data końcowa (RRRR-MM-DD)",
            },
            example: "Pokaż moje posiłki od poniedziałku do piątku",
        },
        export_all_data: {
            description:
                "Wyeksportuj wszystko, co śledzisz, jako jeden plik ZIP — meals.csv, water.csv, weight.csv, goals.csv, profile.csv oraz README.txt z wyjaśnieniem kolumn i jednostek — pod tym samym prywatnym linkiem, ważnym przez 60 minut. Na razie tylko posiłki można zaimportować z powrotem.",
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
                weight: "Wartość masy ciała, w jednostce `unit` (&gt; 0).",
            },
            example: "Zapisz moją wagę — 74,2 kg dziś rano",
        },
        update_weight: {
            description:
                "Popraw istniejące ważenie — wartość, znacznik czasu albo notatki.",
            params: {
                id: "UUID wpisu wagi do zaktualizowania",
                weight: "Nowa wartość wagi, w jednostce `unit`.",
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
        get_weight_unit: {
            description: "Sprawdź, jakiej jednostki wagi obecnie używasz.",
            params: {},
            example: "Jakiej jednostki wagi używam?",
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
                "Pobierz dzienne sumy odżywcze z zadanego zakresu dat jako interaktywny panel: kafelki makroskładników względem celów oraz podział dzień po dniu.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date: "Data końcowa (RRRR-MM-DD)",
            },
            example: "Podsumuj mi ten ostatni tydzień",
        },
        get_trends: {
            description:
                "Kroczące średnie 7/14/30-dniowe, zmienność, serie kolejnych dni z wpisami, podział na dni tygodnia oraz Twoje najlepsze i najgorsze dni pod względem kalorii i każdego makroskładnika — policzone z góry, więc AI może po prostu je opisać.",
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
        set_timezone: {
            description:
                "Ustaw swoją strefę czasową IANA, żeby dni zmieniały się o Twojej lokalnej północy — posiłek zapisany o 23:00 liczy się do tego dnia, nie do kolejnego dnia UTC.",
            params: {},
            example: "Jestem w Berlinie — ustaw moją strefę czasową",
        },
        get_timezone: {
            description:
                "Sprawdź, jaka strefa czasowa jest u Ciebie ustawiona, wraz z aktualną lokalną datą i godziną (domyślnie UTC, jeśli nie ustawiono).",
            params: {},
            example: "Jaka strefa czasowa jest u mnie ustawiona?",
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
        get_widget_display: {
            description:
                "Sprawdź, czy wizualne widżety w czacie są obecnie włączone.",
            params: {},
            example: "Czy widżety są włączone?",
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
        get_alcohol_tracking: {
            description:
                "Sprawdź, czy śledzenie alkoholu jest włączone i w jakim standardowym drinku pokazywane są Twoje gramy.",
            params: {},
            example: "Czy śledzę alkohol?",
        },
        delete_account: {
            description:
                "Trwale usuń swoje konto i wszystkie powiązane dane. To działanie jest nieodwracalne — AI zawsze najpierw potwierdza to z Tobą.",
            params: {},
            example: "Usuń moje konto i wszystkie moje dane",
        },
    },
};

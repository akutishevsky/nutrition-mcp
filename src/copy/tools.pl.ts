import type { ToolsDoc } from "./tools.js";

export const TOOLS_PL: ToolsDoc = {
    meta: {
        title: "41 narzędzi: kalorie, makroskładniki, woda i waga",
        description:
            "Wszystkie 41 narzędzi Nutrition MCP dla Claude, ChatGPT i nie tylko: posiłki, kody kreskowe, import CSV z MyFitnessPal lub Cronometer, woda, waga i wymiary ciała.",
        ogDescription:
            "Wszystkie 41 narzędzi, które serwer Nutrition MCP daje Twojemu AI, w tym importer CSV historii z innej aplikacji — z opisami i przykładowymi poleceniami.",
    },
    hero: {
        eyebrow: "Dokumentacja",
        titleBeforeEm: "Wszystko, co ",
        titleEm: "potrafi",
        titleAfterEm: " Twoje AI",
        lead: "Nie wywołujesz tych narzędzi samodzielnie — po prostu rozmawiasz z Claude, ChatGPT albo innym klientem MCP, a on sam dobiera właściwe narzędzie. Oto wszystkie narzędzia, które serwer Nutrition MCP udostępnia do śledzenia posiłków, kalorii i makroskładników, wody i wagi — z opisem działania i przykładowym poleceniem, które je uruchamia.",
        countBold: "41 narzędzi",
        countTail: "w 7 obszarach",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Zapisywanie",
            title: "Zapisywanie posiłków",
            description:
                "Podstawa wszystkiego — zapisuj, co jesz, opisując to własnymi słowami.",
        },
        "reviewing-your-meals": {
            pillLabel: "Przegląd",
            title: "Przegląd posiłków",
            description:
                "Przeglądaj zapisane posiłki — z jednego dnia albo z całego zakresu dat naraz.",
        },
        water: {
            pillLabel: "Woda",
            title: "Śledzenie nawodnienia",
            description: "Śledź, ile pijesz, obok tego, co jesz.",
        },
        weight: {
            pillLabel: "Ciało",
            title: "Waga i wymiary ciała",
            description:
                "Zapisuj pomiary wagi i obwodów ciała, przeglądaj je i śledź, jak Twoja waga zbliża się do wagi docelowej.",
        },
        "goals-progress": {
            pillLabel: "Cele",
            title: "Cele i postępy",
            description:
                "Ustaw cele i sprawdzaj, jak wypada na ich tle każdy dzień.",
        },
        "insights-trends": {
            pillLabel: "Analizy",
            title: "Analizy i trendy",
            description:
                "Gotowe zestawienia, dzięki którym AI dostrzega wzorce bez samodzielnych obliczeń.",
        },
        "settings-account": {
            pillLabel: "Ustawienia",
            title: "Ustawienia i konto",
            description:
                "Preferencje, dzięki którym wszystko się zgadza, a do tego pełna kontrola nad Twoimi danymi.",
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
        requiredLabel: "wymagany",
        optionalLabel: "opcjonalny",
        trySayingLabel: "Przykładowe polecenie",
        categoriesLabel: "Kategorie narzędzi",
    },
    tools: {
        log_meal: {
            description:
                "Zapisuj posiłki z kaloriami i makroskładnikami — a także z błonnikiem, cukrami ogółem, alkoholem i kofeiną, jeśli te wartości są znane. Opisz posiłek zwykłymi słowami: AI oszacuje wartości, dopyta o wielkość porcji, gdy nie jest jasna, a wcześniej może pobrać dane z etykiety po kodzie kreskowym albo z internetu.",
            params: {
                description: "Co zostało zjedzone",
                meal_type: "śniadanie, obiad, kolacja lub przekąska",
                calories: "Łączna liczba kalorii",
                protein_g: "Białko w gramach",
                carbs_g: "Węglowodany w gramach",
                fat_g: "Tłuszcz w gramach",
                fiber_g:
                    "Błonnik pokarmowy w gramach. AI ma za zadanie uzupełniać tę wartość przy każdym posiłku i szacować ją ze składników, gdy etykieta jej nie podaje — bo puste pole to nie zero: wyklucza cały dzień z Twojej średniej błonnika",
                sugar_g:
                    "<b>Łączna</b> zawartość cukrów w gramach — wartość, którą etykieta podaje jako „w tym cukry”, obejmująca cukier naturalnie obecny w owocach i mleku, a nie tylko cukier dodany. Uzupełniana przy każdym posiłku na tych samych zasadach co błonnik",
                alcohol_g:
                    "Gramy <b>czystego etanolu</b>, a nie objętość napoju ani jego zawartość alkoholu w procentach — AI wylicza je z ilości i mocy napoju (330 ml piwa 5% to 13 g)",
                caffeine_mg:
                    "Kofeina w <b>miligramach</b>, nie w gramach — to jedyne pole, które nie jest podawane w gramach, bo tak podają ją wszystkie etykiety i zalecenia (kawa parzona to ok. 95 mg, espresso 63 mg, puszka coli 34 mg). Kofeina nie dodaje kalorii. W przeciwieństwie do błonnika i cukru jest wysyłana tylko dla produktów, które faktycznie zawierają kofeinę — zapisane 0 dodałoby do panelu wiersz kofeiny, choć wcale jej nie spożywasz",
                logged_at:
                    "Kiedy posiłek został zjedzony, jeśli nie teraz — pozwala dopisać coś później",
                notes: "Dodatkowe notatki",
            },
            example:
                "Zapisz na obiad burrito bowl z kurczakiem i dodatkowym guacamole",
            photoHint:
                "…albo po prostu zrób zdjęcie talerza — AI rozpozna każde danie, oszacuje porcje w codziennych miarach (szklanka, garść), sprawdzi Twoje wcześniejsze wpisy tego dania i zapyta Cię o potwierdzenie, zanim cokolwiek zapisze.",
        },
        lookup_barcode: {
            description:
                "Pobierz z Open Food Facts wartości odżywcze z etykiety produktu paczkowanego po jego kodzie kreskowym (EAN/UPC, 8–14 cyfr), a także Nutri-Score i grupę przetworzenia NOVA, jeśli Open Food Facts je podaje. Cyfry możesz wpisać albo odczytać ze zdjęcia opakowania; wynik można potem zapisać, przeliczony na zjedzoną ilość.",
            params: {},
            example: "Zeskanuj ten kod kreskowy: 3017620422003",
            photoHint:
                "…albo wyślij zdjęcie opakowania — AI odczyta z niego cyfry kodu kreskowego.",
        },
        start_meal_import: {
            description:
                "Otwórz w czacie importer, który przeniesie Twoją historię z innej aplikacji — wybierz plik CSV wyeksportowany z MyFitnessPal, Cronometer, Lose It!, MacroFactor lub innego licznika kalorii, dopasuj jego kolumny do kalorii, makroskładników, błonnika, cukru i kofeiny (a także alkoholu, jeśli masz włączone jego śledzenie) i przed potwierdzeniem sprawdź, co zostanie dodane. Plik jest odczytywany w Twojej przeglądarce, nic nie zostaje zapisane, dopóki nie zaakceptujesz podglądu, a ponowny import tego samego pliku nie tworzy duplikatów.",
            params: {},
            example: "Zaimportuj moją historię posiłków z MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Dodaj za jednym razem do 50 wcześniejszych posiłków, zamiast zapisywać je po kolei. Korzysta z tego narzędzia opisany wyżej importer, a AI może go użyć bezpośrednio do danych posiłków wklejonych do czatu. Każdy wiersz jest najpierw sprawdzany, a wszystko, co nie pasuje, zostaje zgłoszone osobno dla każdego wiersza, więc ponowne wysłanie tych samych wierszy jest bezpieczne i nie zduplikuje już zapisanych posiłków — o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
            params: {
                meals: "Wiersze do zaimportowania, w kolejności z pliku źródłowego (1–50 na wywołanie). Każdy wiersz może zawierać czas, typ posiłku, opis, notatki i te same wartości co zapisany posiłek: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (cukry ogółem), <code>alcohol_g</code> (gramy czystego etanolu) i <code>caffeine_mg</code> (miligramy, nie gramy)",
                expected_row_count:
                    "Liczba wierszy w tym wywołaniu, policzona w pliku źródłowym, żeby wychwycić pominięty wiersz",
                expected_total_kcal:
                    "Suma kalorii z pliku źródłowego, porównywana z tym, co faktycznie dotarło",
                dry_run: "Pokaż, co by się stało, niczego nie zapisując",
                on_error:
                    "Zaimportuj poprawne wiersze i zgłoś pozostałe albo nie zapisuj niczego, jeśli którykolwiek wiersz jest błędny",
                source_app: "Z jakiej aplikacji pochodzi plik",
            },
            example:
                "Wklejam posiłki z zeszłego tygodnia z mojej starej aplikacji — dodaj je wszystkie",
        },
        update_meal: {
            description:
                "Zmień szczegóły zapisanego już posiłku — opis, dowolny makroskładnik, błonnik, cukier, alkohol lub kofeinę, godzinę albo notatki. W ten sposób uzupełnia się też luki: jeśli posiłek trafił do dziennika bez błonnika lub cukru, serwer to zgłasza, a AI uzupełnia brakujące dane tutaj, gdy się zgodzisz.",
            params: {
                id: "UUID posiłku do zaktualizowania",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                fiber_g: "",
                sugar_g: "Cukry ogółem, nie cukry dodane",
                alcohol_g: "Gramy czystego etanolu, nie objętość napoju",
                caffeine_mg: "Miligramy, nie gramy",
                logged_at: "",
                notes: "",
            },
            example: "Ten obiad miał jednak 600 kalorii, a nie 500 — popraw to",
        },
        delete_meal: {
            description: "Usuń posiłek zapisany przez pomyłkę.",
            params: {
                id: "UUID posiłku do usunięcia",
            },
            example: "Usuń przekąskę zapisaną dziś po południu",
        },
        search_meals: {
            description:
                "Wyszukaj wcześniejsze posiłki po słowie kluczowym i zobacz je pogrupowane według Twoich powtarzających się wariantów — jak często każdy był zapisywany, kiedy ostatnio i ile zwykle ma kalorii. To dzięki temu AI porównuje zdjęcie Twojego talerza z tym, jak naprawdę zapisywano ten posiłek wcześniej — i to również sprawia, że działa polecenie „zapisz moje zwykłe śniadanie”.",
            params: {
                queries:
                    "Alternatywne nazwy jedzenia do wyszukania, w dowolnym języku, w którym zapisujesz posiłki",
                days: "Jak daleko wstecz szukać (domyślnie rok)",
                limit: "Maksymalna liczba wpisów do przeanalizowania",
            },
            example: "Zapisz moje zwykłe śniadanie",
        },
        get_meals_today: {
            description: "Zobacz wszystkie posiłki zapisane dzisiaj.",
            params: {
                detail: "<code>compact</code> (domyślnie): jeden wiersz na posiłek z jego identyfikatorem; <code>full</code>: także notatki i dokładne godziny",
            },
            example: "Pokaż moje dzisiejsze posiłki",
        },
        get_meals_by_date: {
            description: "Zobacz wszystkie posiłki zapisane w wybranym dniu.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
                detail: "<code>compact</code> (domyślnie): jeden wiersz na posiłek z jego identyfikatorem; <code>full</code>: także notatki i dokładne godziny",
            },
            example: "Pokaż wszystkie moje posiłki z 4 lipca",
        },
        get_meals_by_date_range: {
            description:
                "Pobierz za jednym razem wszystkie posiłki z wybranego zakresu dat — przydatne przy przeglądzie tygodnia albo miesiąca. Jedno wywołanie obejmuje do 31 dni; sumy dzienne z dłuższych okresów znajdziesz w trendach i podsumowaniach.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date:
                    "Data końcowa (RRRR-MM-DD), maksymalnie 31 dni wraz z dniem początkowym",
                detail: "<code>compact</code> (domyślnie): jeden wiersz na posiłek z jego identyfikatorem; <code>full</code>: także notatki i dokładne godziny",
            },
            example: "Pokaż moje posiłki od poniedziałku do piątku",
        },
        export_all_data: {
            description:
                "Wyeksportuj wszystko, co usługa o Tobie przechowuje, w jednym pliku ZIP — meals.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, profile.csv, account.csv (Twoje konto logowania), telemetry.csv (rejestr użycia narzędzi), connections.csv (Twoje połączone aplikacje AI, bez żadnych tokenów) oraz README.txt z objaśnieniem kolumn, jednostek i tego, czego eksport nie obejmuje — i otrzymaj prywatny link do pobrania, ważny przez 60 minut. Na razie z powrotem można zaimportować tylko posiłki.",
            params: {},
            example:
                "Wyeksportuj wszystkie moje dane — posiłki, wodę, wagę i cele",
        },
        log_water: {
            description:
                "Zapisz wypitą wodę. Podaj ilość w dowolnej jednostce — w szklankach, uncjach czy litrach — a zostanie przeliczona na mililitry.",
            params: {
                amount_ml: "Ilość w mililitrach (liczba całkowita, &gt; 0).",
            },
            example: "Właśnie wypiłem/am butelkę wody 500 ml",
        },
        get_water_today: {
            description:
                "Zobacz łączną ilość wypitej dziś wody i wszystkie dzisiejsze wpisy.",
            params: {},
            example: "Ile wody dziś wypiłem/am?",
        },
        get_water_by_date: {
            description: "Zobacz łączną ilość wody i wpisy z wybranego dnia.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
            },
            example: "Ile wody wypiłem/am wczoraj?",
        },
        delete_water: {
            description: "Usuń wpis wody dodany przez pomyłkę.",
            params: {
                id: "UUID wpisu wody do usunięcia",
            },
            example: "Usuń ostatni wpis wody",
        },
        log_weight: {
            description:
                "Zapisz pomiar masy ciała w kg lub lb. Kilka pomiarów dziennie to żaden problem, a serwer przechowuje wartość w jednej, stałej jednostce, więc wybrana przez Ciebie jednostka nigdy nie zniekształca liczby.",
            params: {
                weight: "Masa ciała w jednostce <code>unit</code> (&gt; 0).",
            },
            example: "Zapisz wagę: dziś rano 74,2 kg",
        },
        update_weight: {
            description:
                "Popraw zapisany pomiar wagi — wartość, datę i godzinę albo notatki.",
            params: {
                id: "UUID pomiaru wagi do zaktualizowania",
                weight: "Nowa wartość wagi w jednostce <code>unit</code>.",
                logged_at: "Znacznik czasu w formacie ISO 8601",
                notes: "",
            },
            example: "Popraw dzisiejszy poranny pomiar na 73,8 kg",
        },
        delete_weight: {
            description: "Usuń pomiar wagi.",
            params: {
                id: "UUID pomiaru wagi do usunięcia",
            },
            example: "Usuń dzisiejszy pomiar wagi",
        },
        get_weight_today: {
            description:
                "Zobacz dzisiejsze pomiary wagi w preferowanej przez Ciebie jednostce.",
            params: {},
            example: "Ile dziś ważę?",
        },
        get_weight_by_date: {
            description: "Zobacz pomiary wagi z wybranego dnia.",
            params: {
                date: "Data w formacie RRRR-MM-DD",
            },
            example: "Jaka była moja waga pierwszego dnia miesiąca?",
        },
        get_weight_by_date_range: {
            description:
                "Pobierz wszystkie pomiary wagi z wybranego zakresu dat, pogrupowane według dni, ze średnią dla każdego dnia.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date: "Data końcowa (RRRR-MM-DD)",
            },
            example: "Pokaż moje pomiary wagi z ostatnich dwóch tygodni",
        },
        get_weight_trends: {
            description:
                "Zobacz trend wagi w wybranym okresie: ostatni pomiar, łączną zmianę, średnie kroczące 7-, 14- i 30-dniowe, minimum i maksimum oraz postęp w drodze do wagi docelowej.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, maks. 365).",
            },
            example: "Jak zmienia się moja waga w tym miesiącu?",
        },
        set_weight_unit: {
            description:
                "Wybierz, czy waga ma być wyświetlana i wpisywana w kg czy w lb. Zapisane wartości się nie zmieniają — zmienia się tylko sposób wyświetlania i domyślna jednostka wpisywanych liczb.",
            params: {},
            example: "Od teraz pokazuj moją wagę w funtach",
        },
        log_body_measurement: {
            description:
                "Zapisz pomiar obwodu jednej partii ciała — talii, bioder, szyi, klatki piersiowej, barków, ramienia, przedramienia, uda lub łydki — w cm albo calach. Wartość jest przechowywana dokładnie tak, jak ją podasz, obok wartości w stałej jednostce, więc zmiana jednostki nigdy nie przesuwa liczby. Liczby daleko poza realnym zakresem dla danej partii ciała są odrzucane jako prawdopodobne literówki.",
            params: {
                kind: "Która partia ciała: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> lub <code>calf</code>. Jedna wartość na partię ciała; stronę (lewa/prawa) można podać w notatkach.",
                value: "Wynik pomiaru w jednostce <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> lub <code>in</code>; domyślnie zapisana jednostka długości.",
                logged_at: "Kiedy wykonano pomiar, jeśli nie teraz",
                notes: "Dodatkowe notatki",
            },
            example: "Zapisz obwód talii: dziś rano 82 cm",
        },
        get_body_measurements: {
            description:
                "Zobacz swoje wymiary ciała pogrupowane według dni, od najstarszych, opcjonalnie tylko dla jednej partii ciała. Bez podanych dat obejmuje ostatnie 30 dni, maksymalnie 366 dni na jedno wywołanie.",
            params: {
                kind: "Tylko ta partia ciała (np. <code>waist</code>)",
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date:
                    "Data końcowa (RRRR-MM-DD), maksymalnie 366 dni wraz z dniem początkowym",
            },
            example: "Pokaż moje pomiary talii z ostatnich trzech miesięcy",
        },
        update_body_measurement: {
            description:
                "Popraw zapisany pomiar — wartość, jednostkę, datę i godzinę albo notatki. Partii ciała nie da się zmienić; pomiar innej partii to nowy wpis.",
            params: {
                id: "UUID pomiaru do zaktualizowania",
                value: "Nowa wartość w jednostce <code>unit</code>.",
                unit: "Domyślnie jednostka, w której zapisano pomiar.",
                logged_at: "Znacznik czasu w formacie ISO 8601",
                notes: "Nowe notatki",
            },
            example: "Obwód bioder to było 98 cm, a nie 89",
        },
        delete_body_measurement: {
            description: "Usuń pomiar wymiaru ciała.",
            params: {
                id: "UUID pomiaru do usunięcia",
            },
            example: "Usuń dzisiejszy pomiar obwodu szyi",
        },
        set_length_unit: {
            description:
                "Wybierz, czy wymiary ciała mają być wyświetlane i wpisywane w centymetrach czy w calach. To ustawienie jest niezależne od jednostki wagi. Zapisane wartości się nie zmieniają — zmienia się tylko sposób wyświetlania i domyślna jednostka wpisywanych liczb.",
            params: {},
            example: "Pokazuj moje wymiary w calach",
        },
        set_nutrition_goals: {
            description:
                "Ustaw dzienne cele dla kalorii, makroskładników, błonnika, cukru, alkoholu, kofeiny i wody, a także opcjonalną wagę docelową. Kalorie, białko, węglowodany, tłuszcz, błonnik i woda to cele do osiągnięcia; cukier, alkohol i kofeina to limity, których nie należy przekraczać — i tak też opisywany jest postęp. Zmieniają się tylko pola, które wskażesz; reszta pozostaje bez zmian.",
            params: {
                daily_calories: "Dzienny cel kalorii (kcal). Null usuwa cel.",
                daily_protein_g:
                    "Dzienny cel białka (w gramach). Null usuwa cel.",
                daily_carbs_g:
                    "Dzienny cel węglowodanów (w gramach). Null usuwa cel.",
                daily_fat_g:
                    "Dzienny cel tłuszczu (w gramach). Null usuwa cel.",
                daily_fiber_g:
                    "Dzienny cel błonnika (w gramach) — minimum do osiągnięcia. Null usuwa cel.",
                daily_sugar_g:
                    "Dzienny limit cukrów <b>ogółem</b> (w gramach) — maksimum, którego nie należy przekraczać. Cukry ogółem obejmują też cukier naturalnie obecny w owocach i mleku, dlatego oficjalne zalecenia dotyczące cukrów dodanych podają znacznie niższą wartość. Null usuwa limit.",
                daily_alcohol_g:
                    "Dzienny limit alkoholu w gramach <b>czystego etanolu</b> — maksimum, którego nie należy przekraczać. Jedna amerykańska porcja standardowa to 14 g, jedna jednostka brytyjska 7,9 g. Null usuwa limit.",
                daily_caffeine_mg:
                    "Dzienny limit kofeiny w <b>miligramach</b> — maksimum, którego nie należy przekraczać. EFSA i FDA przyjmują 400 mg dziennie jako górną granicę dla zdrowych dorosłych (mniej więcej cztery kawy parzone); według EFSA w ciąży jest to 200 mg. 0 też jest limitem i oznacza całkowity brak kofeiny. Null usuwa limit.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Ustaw moje cele: 2200 kalorii, 160 g białka, waga docelowa 75 kg",
        },
        get_nutrition_goals: {
            description:
                "Zobacz aktualne dzienne cele kalorii i makroskładników, ewentualny cel błonnika, limit cukru lub kofeiny oraz — jeśli śledzisz alkohol — limit alkoholu.",
            params: {},
            example: "Jakie mam dzienne cele?",
        },
        get_goal_progress: {
            description:
                "Zobacz, jak dzisiejsze spożycie wypada na tle Twoich celów — pierścienie spożycia względem celu i postęp wagi. Dotknij pierścienia makroskładnika, by zobaczyć, które posiłki się na niego złożyły.",
            params: {},
            example: "Jak mi dziś idzie z celami?",
        },
        get_nutrition_summary: {
            description:
                "Pobierz dzienne sumy wartości odżywczych z wybranego zakresu dat jako interaktywny panel: kafelki makroskładników na tle celów i zestawienie dzień po dniu. Jedno wywołanie obejmuje do 92 dni; średnie kroczące z dłuższych okresów znajdziesz w trendach.",
            params: {
                start_date: "Data początkowa (RRRR-MM-DD)",
                end_date:
                    "Data końcowa (RRRR-MM-DD), maksymalnie 92 dni wraz z dniem początkowym",
            },
            example: "Podsumuj mój ostatni tydzień",
        },
        get_trends: {
            description:
                "Średnie kroczące 7-, 14- i 30-dniowe, zmienność, serie dni z wpisami, średnie kalorie według dni tygodnia oraz Twoje najlepsze i najgorsze dni pod względem kalorii — policzone z góry, więc AI może je po prostu opisać.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, maks. 365).",
            },
            example:
                "Jak wyglądają moje trendy kalorii i makroskładników z ostatnich 30 dni?",
        },
        get_meal_patterns: {
            description:
                "Pokaż nawyki żywieniowe: jak często jesz każdy typ posiłku, wpływ śniadania, wysokokaloryczne obiady, późne kolacje, dni robocze a weekend oraz nietypowe dni.",
            params: {
                days: "Długość okresu w dniach (domyślnie 30, min. 7, maks. 365).",
            },
            example:
                "Czy widać jakieś wzorce w tym, jak jem — np. późne kolacje albo pomijanie śniadań?",
        },
        get_profile: {
            description:
                "Zobacz wszystkie aktualne ustawienia naraz: strefę czasową (wraz z lokalną datą i godziną), język widżetów, preferowane jednostki wagi i długości oraz to, czy widżety w czacie i śledzenie alkoholu są włączone.",
            params: {},
            example: "Jakie mam teraz ustawienia?",
        },
        set_timezone: {
            description:
                "Ustaw strefę czasową IANA, żeby dzień zmieniał się o Twojej lokalnej północy — posiłek zapisany o 23:00 liczy się do tego dnia, a nie do następnego dnia według UTC.",
            params: {},
            example: "Jestem w Berlinie — ustaw mi strefę czasową",
        },
        set_language: {
            description:
                "Ustaw język widżetów w czacie — paneli i wykresów, a nie odpowiedzi, które pisze do Ciebie AI.",
            params: {
                locale: "Kod ISO 639-1, np. <code>de</code>, <code>ja</code>. Obsługiwane języki: angielski, niemiecki, hiszpański, francuski, niderlandzki, polski, włoski, ukraiński, japoński.",
            },
            example: "Pokazuj moje widżety po niemiecku",
        },
        get_current_time: {
            description:
                "Sprawdź aktualną datę i godzinę w Twojej strefie czasowej oraz bieżący czas UTC. Niektóre aplikacje nie podają asystentowi aktualnej godziny, więc dzięki temu narzędziu wie on, co znaczy „dziś rano” albo „dzisiaj”, bez dopytywania Cię (jeśli strefa czasowa nie jest ustawiona, domyślnie przyjmowany jest UTC).",
            params: {},
            example: "Która jest teraz u mnie godzina?",
        },
        set_widget_display: {
            description:
                "Włącz lub wyłącz widżety wizualne w czacie — panele, pierścienie celów i wykresy trendów. Gdy są wyłączone, te same narzędzia odpowiadają tylko tekstem i danymi. Domyślnie są włączone; zmiana obowiązuje w nowych rozmowach.",
            params: {
                enabled:
                    "true — widżety są widoczne, false — odpowiedzi tylko tekstowe",
            },
            example: "Wyłącz widżety",
        },
        set_alcohol_tracking: {
            description:
                "Włącz lub wyłącz śledzenie alkoholu i wybierz, czy napoje mają być liczone w amerykańskich porcjach standardowych czy w jednostkach brytyjskich. Domyślnie jest wyłączone, więc trzeba o nie poprosić. Ponowne wyłączenie ukrywa alkohol w posiłkach, celach i postępach, a importer plików przestaje odczytywać kolumnę alkoholu — nic, co już zapisano, nie zostaje usunięte, Twój eksport CSV nadal to zawiera, a wszystko wraca po ponownym włączeniu. Zmiana obowiązuje od następnej wiadomości i nie trzeba niczego restartować.",
            params: {
                enabled:
                    "true pokazuje alkohol w posiłkach, celach i postępach, false go ukrywa",
                drink_unit:
                    "Która porcja standardowa ma być pokazywana obok gramów: <code>us</code> (14 g na porcję) lub <code>uk</code> (7,9 g na jednostkę). Domyślnie <code>us</code>; w bazie zawsze zapisywane są gramy czystego etanolu.",
            },
            example: "Włącz śledzenie alkoholu w jednostkach brytyjskich",
        },
        delete_account: {
            description:
                "Trwale usuń konto Nutrition MCP i wszystkie dane, które usługa o Tobie przechowuje. Tej operacji nie da się cofnąć, więc narzędzie nic nie zrobi bez wyraźnego potwierdzenia, a AI ma przed jego wysłaniem zapytać Cię o zgodę.",
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
                    "Konektor nie chce się połączyć albo ciągle każe mi się logować",
                answerHtml:
                    "Usuń konektor i dodaj go ponownie z dokładnie tym adresem: <code>https://nutrition-mcp.com/mcp</code> — końcówka <code>/mcp</code> jest wymagana. W Claude otwórz <strong>Customize</strong> → <strong>Connectors</strong>, rozłącz Nutrition i połącz go ponownie; w ChatGPT użyj <strong>Settings</strong> → <strong>Apps</strong>. Zaloguj się tym samym adresem e-mail i hasłem albo tym samym kontem Google co wcześniej: dane należą do Twojego konta, a nie do połączenia, więc po ponownym połączeniu niczego nie stracisz. Połączony konektor działa, dopóki korzystasz z niego przynajmniej raz na 90 dni; jeśli przestanie działać, wystarczy połączyć go ponownie w ten sam sposób.",
            },
            "session-expired": {
                question:
                    'Strona logowania pokazuje {"error":"session_expired"}',
                answerHtml:
                    "Strona logowania jest ważna tylko przez 10 minut i resetuje się też przy każdym restarcie serwera po aktualizacji. Wróć na stronę logowania i odśwież ją albo zacznij łączenie od nowa w aplikacji AI, a potem zaloguj się bez dłuższej przerwy. Jeśli zamiast tego widzisz <code>session_mismatch</code>, logowanie zostało dokończone w innej przeglądarce niż ta, w której się zaczęło: zacznij od nowa w aplikacji AI i dokończ w tej samej przeglądarce.",
            },
            "cannot-sign-in": {
                question: "Nie mogę się zalogować albo nie pamiętam hasła",
                answerHtml:
                    'Jeśli masz już konto, użyj przycisku <strong>Zaloguj się</strong>: błędny e-mail lub hasło pokaże tam komunikat „Nieprawidłowy e-mail lub hasło” i nigdy nie założy nowego konta. Opcję <strong>Załóż konto</strong> wybierz tylko przy pierwszej wizycie. Sprawdź, czy w adresie e-mail nie ma literówki. Jeśli konto zostało założone przez <strong>Kontynuuj z Google</strong>, użyj ponownie tego przycisku. Samodzielnego resetu hasła jeszcze nie ma: napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> z adresu przypisanego do konta, a zresetuję je.',
            },
            "history-missing": {
                question: "Po ponownym połączeniu zniknęła moja historia",
                answerHtml:
                    'Każdy adres e-mail to osobne konto, więc logowanie innym adresem otwiera puste konto — nic nie zostało usunięte. Rozłącz się i zaloguj ponownie tym samym adresem co na początku. Jeśli nie masz pewności, który to był, napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "AI odpowiada, ale niczego nie zapisuje",
                answerHtml:
                    "Upewnij się, że konektor jest włączony w tej rozmowie (w Claude sprawdź menu narzędzi w polu wiadomości), i poproś wprost, na przykład „zapisz moje śniadanie w Nutrition”. Jeśli aplikacja poprosi o zgodę na użycie narzędzia, zatwierdź ją.",
            },
            "wrong-day": {
                question: "Moje posiłki trafiają pod zły dzień",
                answerHtml:
                    'Dni są liczone w Twojej strefie czasowej, a jeśli nigdy jej nie ustawiono, obowiązuje UTC. Zapytaj „jaką mam ustawioną strefę czasową?” (<a href="#get_profile"><code>get_profile</code></a>), a jeśli jest błędna, poproś „ustaw moją strefę czasową na Europe/Berlin” (<a href="#set_timezone"><code>set_timezone</code></a>). Wtedy wszystkie Twoje wpisy, także wcześniejsze, są grupowane według Twojego lokalnego dnia. Jedyny wyjątek to wpis z podaną konkretną godziną, dodany, gdy strefa czasowa była błędna: zachowuje datę i godzinę, z jaką został wtedy zapisany, więc nadal może być przesunięty o godzinę lub dzień — poproś AI o przeniesienie go na właściwą datę i godzinę (<a href="#update_meal"><code>update_meal</code></a>). Strefę czasową ustaw też przed importem historii: zaimportowane posiłki zachowują datę i godzinę, z jaką zostały zapisane, a ponowny import pliku z innej aplikacji po zmianie strefy czasowej doda je po raz drugi. Eksport z Nutrition MCP zostanie rozpoznany i nie utworzy duplikatów.',
            },
            "no-widgets": {
                question: "Widzę tylko tekst, bez wykresów i kart",
                answerHtml:
                    'Karty wizualne wymagają aplikacji obsługującej interaktywne panele MCP Apps, takiej jak Claude lub ChatGPT; pozostałe aplikacje dostają te same informacje w formie tekstu. Jeśli widżety zostały wyłączone, poproś o ich ponowne włączenie (<a href="#set_widget_display"><code>set_widget_display</code></a>) i zacznij nową rozmowę — otwarty czat zachowuje stare ustawienie, dopóki nie połączy się ponownie. Mała karta po zapisaniu posiłku pojawia się dopiero wtedy, gdy ustawisz dzienne cele (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question:
                    "Importer się nie otwiera albo pisze, że nie może zapisać danych",
                answerHtml:
                    'Panel importera wymaga aplikacji, która wyświetla interaktywne panele i ma włączone widżety. Jeśli pokazuje komunikat <em>Ta aplikacja nie pozwala temu widokowi zapisywać w Twoim dzienniku</em> albo w ogóle się nie pojawia, poproś AI, żeby samo zaimportowało plik: załącz lub wklej CSV, a AI użyje narzędzia <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, które sprawdza każdy wiersz i pomija duplikaty, więc ponowne wysłanie jest bezpieczne, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa. Strefę czasową ustaw przed pierwszym importem: ponowny import pliku z innej aplikacji po jej zmianie doda wiersze jeszcze raz. Jeśli korzystasz z panelu importera i chcesz zachować kolumnę z alkoholem, najpierw włącz śledzenie alkoholu — panel pomija tę kolumnę, dopóki śledzenie jest wyłączone, a późniejszy ponowny import jej nie uzupełni.',
            },
            "rate-limited": {
                question:
                    "Widzę „Rate limit exceeded” albo „Too many failed authentication attempts”",
                answerHtml:
                    "Każde konto może wysłać 60 żądań na minutę, a każde wywołanie narzędzia to co najmniej jedno żądanie. Odczekaj tyle sekund, ile podaje komunikat, i kontynuuj. Jeśli chcesz uzupełnić wiele wcześniejszych posiłków, użyj importera zamiast zapisywać je po kolei. Strony logowania przyjmują 30 żądań na minutę z jednej sieci. Po 20 odrzuconych z rzędu próbach połączenia z jednej sieci — zwykle to stary, odłączony konektor, który wciąż ponawia próby — połączenia z tej sieci są wstrzymywane na 5 minut, a kolejne blokady wydłużają się maksymalnie do godziny. Usunięcie starego konektora i dodanie go ponownie kończy te próby.",
            },
            "barcode-not-found": {
                question:
                    "Kod kreskowy nie zostaje znaleziony albo jego wartości wyglądają na błędne",
                answerHtml:
                    "Dane kodów kreskowych pochodzą z Open Food Facts, bazy tworzonej przez społeczność, więc niektórych produktów brakuje, a niektóre wpisy są nieaktualne. Upewnij się, że wszystkie cyfry pod kodem kreskowym (od 8 do 14) zostały odczytane poprawnie. Jeśli produktu nie ma w bazie, AI może oszacować wartości na podstawie nazwy albo zdjęcia tabeli wartości odżywczych, a Ty możesz później poprawić dowolną liczbę. Dodanie produktu na openfoodfacts.org pomaga wszystkim. Open Food Facts nie ma danych o kofeinie, więc jej ilość pochodzi z etykiety albo z typowych wartości.",
            },
            "export-link": {
                question: "Link do pobrania eksportu nie działa",
                answerHtml:
                    'Linki do eksportu wygasają po 60 minutach, a każdy nowy eksport zastępuje poprzedni plik. Poproś o nowy eksport (<a href="#export_all_data"><code>export_all_data</code></a>) i od razu go pobierz. Jeśli eksport pokazuje 0 posiłków, choć powinna tam być Twoja historia, prawdopodobnie logujesz się innym adresem e-mail — zajrzyj do punktu <a href="#history-missing">o zniknięciu historii</a>.',
            },
            "delete-account": {
                question: "Jak usunąć konto?",
                answerHtml:
                    'Poproś AI o usunięcie Twojego konta Nutrition MCP (<a href="#delete_account"><code>delete_account</code></a>). AI poprosi o potwierdzenie, a następnie trwale usunie Twoje posiłki, wodę, wagę, wymiary ciała, cele, ustawienia, rejestr narzędzi, z których korzystała Twoja aplikacja AI, ewentualny plik eksportu, dane logowania i samo konto. Tego nie da się cofnąć, więc jeśli chcesz mieć kopię, najpierw wyeksportuj dane. Potem usuń konektor ze swojej aplikacji. Jeśli w przyszłości zalogujesz się ponownie tym samym adresem e-mail, powstanie nowe, puste konto.',
            },
            "report-a-problem": {
                question: "Jak zgłosić błąd lub problem z bezpieczeństwem?",
                answerHtml:
                    'Błędy zgłaszaj w <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: napisz, z jakiej aplikacji korzystasz (Claude, ChatGPT, …), jaka była Twoja prośba, co się stało i mniej więcej kiedy. Nigdy nie podawaj swojego hasła. Nie zgłaszaj problemów z bezpieczeństwem publicznie: zgłoś je prywatnie przez <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">prywatne zgłaszanie podatności w GitHubie</a> albo e-mailem, zgodnie z <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">polityką bezpieczeństwa</a>. We wszystkich innych sprawach napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

// Polish translation of src/copy/index.ts's IndexDoc. See that file's header
// for the shape/trust-level rules this follows: the hero chat and the example
// slides are structured (one field per message), so only the words translate;
// `photo`, `card`, `meal.type`, `id`, `from`, `download`, `cards` and the
// `toolNotes` keys are structure, copied verbatim from English.
//
// Notes for the Polish version:
//   - Informal "Ty", with the pronouns of address capitalized (Ty, Ci,
//     Twój…), as on the rest of the site. Where English says "what you ate",
//     the copy is phrased gender-neutrally ("opisz posiłek", "co było na
//     talerzu") rather than with "zjadłeś/aś" slash forms.
//   - Bare "AI" is neuter ("Twoje AI", "AI dopyta").
//   - Claude and ChatGPT UI labels (Customize, Connectors, Settings → Apps…)
//     stay in English, because that is how they appear on screen.
//   - Every figure a card draws is kept as written; in running text numbers
//     use Polish formatting (2000, 1540, 78,4 kg).

import type { IndexDoc } from "./index.js";

export const INDEX_PL: IndexDoc = {
    title: "Nutrition MCP — Licznik kalorii i makro dla Claude i ChatGPT",
    metaDescription:
        "Zapisuj posiłki, kalorie i makroskładniki, rozmawiając z Claude lub ChatGPT. Darmowy serwer MCP open source: zapisane posiłki, kody kreskowe, waga i eksport.",
    ogDescription:
        "Zapisuj posiłki, kalorie i makroskładniki, rozmawiając z Claude lub ChatGPT. Darmowy serwer MCP open source: zapisane posiłki, kody kreskowe, waga i eksport.",
    keywords:
        "licznik kalorii, liczenie kalorii, aplikacja do liczenia kalorii, liczenie makro, makroskładniki, dzienniczek żywieniowy, serwer MCP, Claude AI, ChatGPT, skaner kodów kreskowych, śledzenie wagi, dziennik wagi, zapisane posiłki, składniki posiłków, przepisy, dieta z AI, Model Context Protocol",

    hero: {
        titleBeforeEm: "Śledź, co jesz, po prostu ",
        titleEm: "rozmawiając",
        titleAfterEm: " z AI.",
        lead: "Połącz Claude albo ChatGPT i po prostu powiedz, co było na talerzu. Kalorie i makroskładniki zapiszą się same.",
        ctaPrimary: "Szybka instalacja",
        ctaSecondary: "Wesprzyj projekt",
        moreExamples: "Więcej przykładów",
        chat: {
            photoAlt:
                "Zdjęcie: smoothie bowl z bananem, owocami leśnymi i granolą, a obok americano",
            pauseLabel: "Wstrzymaj demo",
            replayLabel: "Odtwórz demo jeszcze raz",
            exchanges: [
                {
                    photo: true,
                    userText: "śniadanie + americano",
                    aiText: "Smoothie bowl, na oko domowej roboty. Masz go w dzienniku w dwóch wersjach: z granolą i miodem albo z samymi owocami. Która to tym razem?",
                },
                {
                    userText: "granola i miód, pełna łyżka",
                    aiText: "Jasne. A americano: pojedyncze czy podwójne, z mlekiem czy bez?",
                },
                {
                    userText: "podwójne, odrobina mleka owsianego",
                    aiText: "Czyli: smoothie bowl z garścią granoli i 1 łyżką miodu oraz podwójne americano z odrobiną mleka owsianego. Około 480 kcal i 21 g białka. Zapisać?",
                },
                {
                    userText: "tak",
                    aiText: "Zapisano śniadanie: 480 kcal, 21 g białka i 126 mg kofeiny. Cukru dodanego masz 20 g z limitu 25 g, głównie z miodu; reszta z 51 g cukrów ogółem to owoce i jogurt.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 miska: jogurt grecki, banan, owoce leśne) z granolą (1 garść) i miodem (1 łyżka); podwójne americano z odrobiną mleka owsianego",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "obiad: resztka wczorajszego stir fry, taka sama porcja. i butelka wody 500 ml",
                    aiText: "Zapisano obiad, tak jak wczoraj wieczorem: 620 kcal i 54 g białka, do tego 500 ml wody.",
                    meal: {
                        description:
                            "Resztki stir fry (1 porcja, jak wczoraj wieczorem)",
                        type: "lunch",
                    },
                },
                {
                    userText:
                        "przekąska: 6 frytek podkradzionych dziecku. tylko nie oceniaj",
                    aiText: "Nikt tu nie ocenia. Około 50 kcal, zapisano jako przekąskę.",
                    meal: {
                        description: "Frytki (6 sztuk, z talerza dziecka)",
                        type: "snack",
                    },
                },
                {
                    userText: "ile zostało na kolację?",
                    aiText: "Zostało 850 kcal i 84 g białka. Cukru dodanego masz 23 g z limitu 25 g, a większość z dzisiejszych 59 g cukrów ogółem pochodzi z owoców.",
                    card: "nutrition-summary",
                },
                {
                    userText: "a jak tam moja waga?",
                    aiText: "Od 11 lutego ubyło Ci 1,4 kg, z 80,2 do 78,8 kg. Do celu 75 kg zostało 3,8 kg.",
                    card: "weight-trends",
                },
            ],
        },
    },

    how: {
        title: "Trzy kroki. Bez uczenia się nowej aplikacji.",
        steps: [
            {
                title: "Połącz raz",
                body: "Działa w każdej aplikacji AI, która obsługuje zdalne serwery MCP: w Claude, ChatGPT i innych. Bez instalacji i bez kluczy API.",
            },
            {
                title: "Po prostu opisz posiłek",
                body: "Napisz własnymi słowami albo wyślij zdjęcie posiłku, zrzut ekranu z aplikacji do zamawiania jedzenia lub kod kreskowy (produkt zostanie wyszukany w internecie). Makroskładniki zapiszą się same.",
            },
            {
                title: "Śledź i analizuj",
                body: "Pytaj o dzienne podsumowania, tygodniowe trendy i realizację celów albo wyeksportuj wszystkie swoje wpisy do plików CSV — całkowicie za darmo.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "Połącz w niecałą minutę",
        sub: "Działa w każdym kliencie MCP, który obsługuje OAuth 2.0 z PKCE. Przy pierwszym połączeniu zakładasz konto przez Google albo e-mail i hasło; później loguj się tak samo, żeby mieć dostęp do swoich danych.",
        copyAriaLabel: "Kopiuj adres URL serwera",
        tabsLabel: "Wybierz aplikację AI",
        claude: {
            cta: "Dodaj do Claude",
            steps: [
                "Na stronie katalogu kliknij <strong>Connect</strong>, a potem zaloguj się przez Google albo e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się też w Twoich aplikacjach na iOS i Androida.",
            ],
            note: "Działa w każdym planie Claude, także w darmowym. Jeśli wolisz dodać go ręcznie, wybierz Customize → Connectors → Add custom connector i podaj adres https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Otwórz <strong>ChatGPT w przeglądarce</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Kliknij <strong>Create app</strong> na dole okienka. Jeśli nie ma tego przycisku, włącz <strong>Developer mode</strong> w <strong>Advanced settings</strong>.",
                "Nadaj aplikacji nazwę, np. <strong>Nutrition</strong>.",
                "W polu <strong>Connection</strong> wklej <code>https://nutrition-mcp.com/mcp</code>.",
                "W polu <strong>Authentication</strong> wybierz <strong>OAuth</strong>, a resztę zostaw bez zmian.",
                "Zaznacz <strong>„I understand and want to continue”</strong>.",
                "Kliknij <strong>Create</strong>.",
                "Kliknij <strong>Sign in with Nutrition</strong>. Otworzy się strona logowania: zaloguj się przez Google albo e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się też w Twoich aplikacjach na iOS i Androida.",
            ],
        },
        other: {
            note: "Dodaj powyższą konfigurację w swojej aplikacji (Cursor, VS Code, Claude Code i innych). Windsurf używa <code>serverUrl</code> zamiast <code>url</code>. W Claude Code uruchom <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Logowanie OAuth aplikacja obsłuży sama.",
        },
        otherTabLabel: "Inne aplikacje",
    },

    onboarding: {
        title: "Skonfiguruj raz — albo od razu zacznij rozmowę",
        sub: "To całkowicie opcjonalne: Nutrition MCP działa od chwili połączenia. Jeśli chcesz, te trzy szybkie kroki poprawią dokładność, ale możesz też od razu zacząć zapisywać.",
        justSay: "Po prostu powiedz ",
        steps: [
            {
                title: "Ustaw strefę czasową",
                body: "żeby nowy dzień zaczynał się o północy Twojego czasu, a dzisiejsze sumy się zgadzały, gdziekolwiek jesteś.",
                say: "Ustaw moją strefę czasową na Nowy Jork",
            },
            {
                title: "Ustaw cele",
                body: "dzienne cele kalorii, makroskładników i wody, a do tego opcjonalnie wagę docelową i preferowaną jednostkę wagi (kg lub lb), żeby śledzić postępy.",
                say: "Ustaw mi dzienny cel 2000 kalorii i 150 g białka",
            },
            {
                title: "Ustaw język",
                body: "w tym języku wyświetlają się widżety w czacie (panele, wykresy); nie zmienia to języka, w którym odpowiada Ci AI.",
                say: "Pokazuj moje widżety po niemiecku",
            },
            {
                title: "Zacznij zapisywać",
                body: "po prostu opisz posiłek, wyślij zdjęcie albo zeskanuj kod kreskowy. To wszystko.",
                say: "Na śniadanie była owsianka z owocami leśnymi",
            },
        ],
        note: "Wszystko tu jest opcjonalne. Możesz to zrobić teraz, później albo wcale: po prostu zacznij zapisywać, a ustawienia zmień, kiedy zechcesz.",
        toolsCta: {
            heading: "Ciekawi Cię, co naprawdę potrafi?",
            body: "Przejrzyj wszystkie 48 narzędzi — zapisywanie, kody kreskowe, woda, waga i wymiary ciała, cele i trendy — z opisem i przykładowym poleceniem dla każdego.",
            arrow: "Zobacz narzędzia",
        },
    },

    examples: {
        title: "Po prostu porozmawiaj.",
        sub: "Kilka rzeczy, które załatwisz zwykłą rozmową.",
        prevLabel: "Poprzedni przykład",
        nextLabel: "Następny przykład",
        pickerLabel: "Wybierz przykład",
        carouselLabel: "Przykłady",
        carouselRoleDescription: "karuzela",
        threadLabel: "Rozmowa",
        moreToolsLabel: "Korzysta też z",
        toolLinkLabel:
            "{tool} na stronie narzędzi (otwiera się w nowej karcie)",
        photoMealAlt:
            "Zdjęcie: miska barszczu z łyżką śmietany i koperkiem, a obok kromka żytniego chleba",
        photoPackageAlt:
            "Zdjęcie: kod kreskowy na kubeczku naturalnego jogurtu greckiego, numer 2001234567893",
        slides: [
            {
                id: "log-meal",
                title: "Zapisuj zwykłymi słowami",
                description:
                    "Napisz tak, jak do znajomego. Gdy brakuje wielkości porcji albo nie wiadomo, który to posiłek, AI dopyta, zanim cokolwiek oszacuje. Błonnik, cukry i cukier dodany trafiają do każdego wpisu, kofeina do wszystkiego, co ją zawiera, a „koło 7” oznacza 07:00 w Twojej strefie czasowej.",
                toolNotes: {
                    log_meal:
                        "Zapisuje śniadanie z makroskładnikami, błonnikiem, cukrami, cukrem dodanym i kofeiną z kawy",
                    log_water:
                        "Dolicza 500 ml z 07:00 do dzisiejszej sumy wody",
                    get_current_time:
                        "Ustala dzisiejszą datę, żeby „koło 7” oznaczało 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "owsianka z borówkami i kawa na śniadanie",
                    },
                    {
                        from: "ai",
                        text: "Jak duża była miska i czy owsianka była na mleku, czy na wodzie? Dodajesz coś do kawy?",
                    },
                    {
                        from: "user",
                        text: "normalna miska, na mleku. kawa czarna",
                    },
                    {
                        from: "ai",
                        text: "Zapisano śniadanie: około 320 kcal, 11 g białka i 6 g błonnika. Po kawie masz 95 mg z limitu 400 mg kofeiny.",
                    },
                    {
                        from: "user",
                        text: "aha, i koło 7, przed bieganiem, było jeszcze z pół litra wody",
                    },
                    {
                        from: "ai",
                        text: "Dodano 500 ml wody o 07:00 dziś rano.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: [
                    "Owsianka na mleku z borówkami (1 miska) i czarna kawa (1 filiżanka)",
                ],
            },
            {
                id: "photo-meal",
                title: "Zrób zdjęcie talerza",
                description:
                    "Zdjęcie zaczyna rozmowę, a nie zgadywanie. AI pyta, czy danie jest domowe, czy z restauracji, w Twoich wcześniejszych wpisach sprawdza to, czego nie widać na zdjęciu, dopytuje w prostych miarach o zjedzoną ilość i zapisuje dopiero wtedy, gdy zaakceptujesz podsumowanie.",
                toolNotes: {
                    search_meals:
                        "Znajduje Twój wcześniejszy barszcz z restauracji Tsybulya i to, co w nim było",
                    log_meal:
                        "Zapisuje posiłek z nazwą restauracji, gdy powiesz „tak”",
                },
                messages: [
                    {
                        from: "user",
                        photo: "meal",
                        text: "obiad",
                    },
                    {
                        from: "ai",
                        text: "Wygląda na barszcz ze śmietaną i kromkę chleba żytniego. Domowy czy z restauracji? Jeśli z restauracji, to z której?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, na Podolu w Kijowie",
                    },
                    {
                        from: "ai",
                        text: "Barszcz z restauracji Tsybulya masz już w dzienniku dwa razy, za każdym razem na wołowinie, ze śmietaną i kromką żytniego chleba, około 520 kcal. Tym razem to samo? I udało się zjeść całą miskę, razem z chlebem?",
                    },
                    {
                        from: "user",
                        text: "to samo, wszystko zjedzone, chleb też",
                    },
                    {
                        from: "ai",
                        text: "Czyli: barszcz na wołowinie ze śmietaną (1 miska, zjedzona) i chleb żytni (1 kromka) w restauracji Tsybulya, Podół, Kijów. Tak jak ostatnio: około 520 kcal i 24 g białka, to szacunki, a nie oficjalne dane. Zapisać?",
                    },
                    {
                        from: "user",
                        text: "tak",
                    },
                    {
                        from: "ai",
                        text: "Zapisano. To 520 z Twoich 2000 kcal na dziś, zostało 1480.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: [
                    "Barszcz na wołowinie ze śmietaną (1 miska, zjedzona) i chleb żytni (1 kromka) w restauracji Tsybulya, Podół, Kijów",
                ],
            },
            {
                id: "scan-barcode",
                title: "Zeskanuj kod kreskowy",
                description:
                    "Zrób zdjęcie opakowania: cyfry spod kodu kreskowego są wyszukiwane w Open Food Facts, a AI pyta, ile tego było. Cukier dodany jest odczytywany tam, gdzie Open Food Facts go podaje. Open Food Facts nie podaje kofeiny, więc jej ilość pochodzi z etykiety albo z typowych wartości; brakująca wartość błonnika, cukrów czy cukru dodanego zostaje oszacowana, a nie pominięta.",
                toolNotes: {
                    lookup_barcode:
                        "Pobiera z Open Food Facts wartości z etykiety i Nutri-Score kubeczka",
                    log_meal:
                        "Zapisuje cały kubeczek jako śniadanie, przeliczając wartości na 100 g",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "to było na śniadanie. jest w porządku?",
                    },
                    {
                        from: "ai",
                        text: "To kubeczek naturalnego jogurtu greckiego 150 g (0% tłuszczu): 87 kcal, 15 g białka i 5 g cukru, w tym ani grama dodanego, a Open Food Facts daje mu Nutri-Score A. Cały kubeczek?",
                    },
                    {
                        from: "user",
                        text: "cały kubeczek",
                    },
                    {
                        from: "ai",
                        text: "Zapisano jako śniadanie: 87 kcal, 15 g białka i 5 g cukru. Do dzisiejszego celu brakuje jeszcze 145 g białka.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: ["Naturalny jogurt grecki 0% (kubeczek 150 g)"],
            },
            {
                id: "saved-meal",
                title: "Zapisz swoje stałe posiłki",
                description:
                    "Zapisz posiłek, który jadasz często, razem ze składnikami, a potem dodawaj go do dziennika po samej nazwie. Pomiń składnik albo zmień jego ilość tylko na ten jeden raz, albo dodaj więcej niż jedną porcję — zapisany posiłek zostaje taki, jaki był.",
                toolNotes: {
                    log_saved_meal:
                        "Dodaje miskę do dziennika bez kwaśnej śmietany i z podwójną porcją kurczaka, czyli 240 g",
                    save_meal:
                        "Zachowuje sześć składników miski i wartości na jedną porcję, nie dodając jej do dzisiejszego dnia",
                },
                messages: [
                    {
                        from: "user",
                        text: "zapisz moją miskę burrito, żeby szybko ją dodawać: 150 g ryżu, 120 g kurczaka, 100 g czarnej fasoli, 60 g salsy, 30 g sera, 30 g kwaśnej śmietany",
                    },
                    {
                        from: "ai",
                        text: "Zapisano „Miska burrito” z 6 składnikami, jedna porcja: 725 kcal, 59 g białka, 22 g tłuszczu. Samo zapisanie nie dodaje jej do dzisiejszego dnia — wystarczy podać nazwę, gdy ją zjesz.",
                    },
                    {
                        from: "user",
                        text: "na obiad była miska burrito. dziś bez śmietany i podwójny kurczak",
                    },
                    {
                        from: "ai",
                        text: "Zapisano obiad z Twojej Miski burrito, bez kwaśnej śmietany i z 240 g kurczaka: 865 kcal i 95 g białka. Zapisana miska zostaje bez zmian na następny raz.",
                    },
                    {
                        from: "user",
                        text: "skąd w tym najwięcej białka?",
                    },
                    {
                        from: "ai",
                        text: "Z kurczaka: 74 z 95 g. Czarna fasola daje 9 g, ser 7 g, ryż 4 g, a salsa 1 g.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 2,
                    },
                ],
                cardMeals: [
                    "Miska burrito (bez kwaśnej śmietany, podwójny kurczak)",
                ],
            },
            {
                id: "goals-progress",
                title: "Ustaw cele, sprawdzaj postępy",
                description:
                    "Ustaw cele do osiągnięcia, np. kalorie i białko, oraz limity cukru dodanego, cukrów ogółem, alkoholu i kofeiny, których nie chcesz przekraczać; zmienia się tylko to, co wymienisz. Potem zapytaj o dowolny dzień, żeby zobaczyć, ile brakuje do każdego celu i jak wypadasz względem każdego limitu.",
                toolNotes: {
                    set_nutrition_goals:
                        "Zapisuje cele kalorii i białka oraz limit kofeiny 400 mg",
                    get_goal_progress:
                        "Zestawia dzisiejszy dzień z każdym celem i limitem w widżecie w czacie",
                },
                messages: [
                    {
                        from: "user",
                        text: "chcę się trochę wyrzeźbić. ustaw mi 2000 kcal i 160 g białka. i jaki limit kofeiny ma sens? praktycznie żyję kawą",
                    },
                    {
                        from: "ai",
                        text: "Dla zdrowych dorosłych EFSA i FDA podają do 400 mg dziennie, czyli mniej więcej cztery kubki parzonej kawy, a w ciąży EFSA zaleca do 200 mg. Limit zależy od Ciebie. Ustawić 400?",
                    },
                    {
                        from: "user",
                        text: "no to 400",
                    },
                    {
                        from: "ai",
                        text: "Gotowe: 2000 kcal i 160 g białka do osiągnięcia, kofeina poniżej 400 mg. Reszta bez zmian: 220 g węglowodanów, 70 g tłuszczu, 30 g błonnika, 2,5 l wody, limit cukru dodanego 25 g i waga docelowa 75 kg.",
                    },
                    {
                        from: "user",
                        text: "zmieszczę jeszcze wieczorem deser?",
                    },
                    {
                        from: "ai",
                        text: "Masz 1540 z 2000 kcal i 104 ze 160 g białka, więc zostało 460 kcal i 56 g białka. Cukier dodany: 16 g z limitu 25 g, kofeina: 130 z 400 mg, w obu przypadkach poniżej limitu.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 4,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Przejrzyj tydzień",
                description:
                    "Zapytaj, jak minął tydzień, a w czacie otworzy się widżet trendów ze średnimi kaloriami i makroskładnikami na tle Twoich celów oraz liczbą dni z wpisami. Przełączaj między 7, 14 i 30 dniami bez ponownego pytania. AI powie Ci też o seriach i dniach, w których mieścisz się w celu.",
                toolNotes: {
                    get_trends:
                        "Liczy średnie z ostatnich 7, 14 i 30 dni i otwiera widżet trendów",
                },
                messages: [
                    {
                        from: "user",
                        text: "jak mi poszły ostatnie dwa tygodnie? mam wrażenie, że był totalny chaos",
                    },
                    {
                        from: "ai",
                        text: "Wpisy masz z 13 dni na 14, w tym ostatnie 10 z rzędu, a 9 z nich mieści się w granicach 10% od celu 2000 kcal. Średnio wychodzi 1830 kcal dziennie, ale ta średnia liczy dzień bez wpisów jako zero.",
                    },
                    {
                        from: "user",
                        text: "a cukier?",
                    },
                    {
                        from: "ai",
                        text: "Cukru dodanego średnio 22 g dziennie, poniżej limitu 25 g, ale w 5 z 13 dni limit był przekroczony. Cukrów ogółem średnio 52 g, głównie z owoców i mleka.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Śledź wagę i wymiary",
                description:
                    "Zapisz pomiar wagi w kg albo lb i zobacz trend ukryty pod codziennymi wahaniami: wygładzoną średnią, zmianę w ciągu miesiąca i to, ile zostało do wagi docelowej. Obok możesz zapisywać obwody dziewięciu partii ciała, od talii po łydkę, w cm albo calach. Niemożliwy odczyt, np. ze zgubionym przecinkiem, zostaje wyłapany przed zapisem.",
                toolNotes: {
                    log_weight: "Zapisuje dzisiejsze poranne ważenie: 78,4 kg",
                    get_weight_trends:
                        "Wygładza codzienne wahania w wagę trendu i tempo tygodniowe oraz liczy, ile zostało do celu",
                    log_body_measurement: "Zapisuje obwód talii: 84 cm",
                    get_body_measurements:
                        "Szuka poprzedniego pomiaru talii do porównania",
                },
                messages: [
                    {
                        from: "user",
                        text: "dziś rano 78,4 kg. jak wygląda trend?",
                    },
                    {
                        from: "ai",
                        text: "Zapisano 78,4 kg. Od 11 lutego ubyło Ci 1,8 kg (z 80,2 kg), a średnia z 7 dni to 78,7 kg. Do celu 75 kg zostało 3,4 kg.",
                    },
                    {
                        from: "user",
                        text: "w talii 84 cm. jak to wypada w porównaniu z ostatnim razem?",
                    },
                    {
                        from: "ai",
                        text: "Zapisano obwód talii: 84 cm. Poprzedni pomiar z 14 lutego to 86,5 cm, czyli masz o 2,5 cm mniej.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 0,
                    },
                ],
            },
            {
                id: "meal-patterns",
                title: "Odkryj swoje nawyki",
                description:
                    "Zapytaj, kiedy jesz więcej, a AI porówna Twoje własne wpisy: dni robocze z weekendami, dni ze śniadaniem i bez, duże obiady, wczesne kolacje z późnymi. Wskaże też nietypowe dni i opisze wzorce, nie przyczyny.",
                toolNotes: {
                    get_meal_patterns:
                        "W ciągu 30 dni porównuje dni ze śniadaniem i bez, porę kolacji i weekendy",
                },
                messages: [
                    {
                        from: "user",
                        text: "czy jem więcej w dni, kiedy pomijam śniadanie? mam takie wrażenie",
                    },
                    {
                        from: "ai",
                        text: "Trochę tak. Wpisy masz z 28 spośród ostatnich 30 dni, w tym 6 dni bez śniadania. W te dni wychodzi średnio 2215 kcal i 88 g białka, wobec 1940 kcal i 123 g w 22 dni ze śniadaniem.",
                    },
                    {
                        from: "user",
                        text: "a późne kolacje? w dni treningowe jem dopiero o 21",
                    },
                    {
                        from: "ai",
                        text: "Też się wyróżniają: 9 dni z kolacją o 20:00 lub później to średnio 2165 kcal, wobec 1920 w pozostałych 19. Jedno i drugie to wzorce w Twoich wpisach, a nie dowód, że któreś z nich jest przyczyną.",
                    },
                    {
                        from: "user",
                        text: "a weekendy?",
                    },
                    {
                        from: "ai",
                        text: "Prawie bez różnicy: w weekendy średnio 2010 kcal, w dni robocze 1993.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Śledź też alkohol",
                description:
                    "Alkohol pozostaje ukryty, dopóki nie włączysz jego śledzenia. Wybierz amerykańskie porcje standardowe albo jednostki brytyjskie, a każdy napój zostanie przeliczony na gramy alkoholu według objętości i mocy. Gdy później wyłączysz śledzenie, alkohol znów zostanie ukryty, ale nie usunięty.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Włącza śledzenie alkoholu, pokazywanego w gramach obok jednostek brytyjskich",
                    log_meal:
                        "Zapisuje pintę z alkoholem w gramach etanolu (568 ml × 4% × 0,789)",
                },
                messages: [
                    {
                        from: "user",
                        text: "możesz liczyć też alkohol? chcę trochę przystopować",
                    },
                    {
                        from: "ai",
                        text: "Jasne. Pokazywać alkohol w amerykańskich porcjach standardowych czy w jednostkach brytyjskich?",
                    },
                    {
                        from: "user",
                        text: "brytyjskie jednostki, mieszkam w manchesterze",
                    },
                    {
                        from: "ai",
                        text: "Śledzenie alkoholu włączone, w gramach obok jednostek brytyjskich.",
                    },
                    {
                        from: "user",
                        text: "do kolacji była pinta lagera",
                    },
                    {
                        from: "ai",
                        text: "Jaka była moc? Lagery mają zwykle 4–5%, a moc znajdziesz na nalewaku albo na puszce.",
                    },
                    {
                        from: "user",
                        text: "chyba 4%",
                    },
                    {
                        from: "ai",
                        text: "Zapisano jako wpis do kolacji: pinta 568 ml o mocy 4% to 17,9 g alkoholu, 2,3 jednostki brytyjskiej, około 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 6,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Przenieś swoją historię",
                description:
                    "Przechodzisz z MyFitnessPal, Cronometer, Lose It! albo MacroFactor? Importer otwiera się w czacie, odczytuje Twój eksport i dopasowuje kolumny w przeglądarce, niczego nie zapisuje, dopóki nie potwierdzisz podglądu, i nie dubluje posiłków, gdy zaimportujesz ten sam plik ponownie przy tej samej strefie czasowej. Jeśli nie masz ustawionej strefy czasowej, najpierw trzeba ją ustawić, żeby każdy posiłek trafił na właściwy dzień.",
                toolNotes: {
                    get_profile:
                        "Pokazuje, że konto nie ma jeszcze ustawionej strefy czasowej",
                    set_timezone:
                        "Ustawia America/Chicago, żeby posiłki miały godziny lokalne",
                    start_meal_import:
                        "Otwiera w czacie importer dla Twojego pliku eksportu",
                    bulk_import_meals:
                        "Zapisuje zatwierdzone wiersze w paczkach do 50, pomijając już zaimportowane",
                },
                messages: [
                    {
                        from: "user",
                        text: "przechodzę z myfitnesspal. dasz radę przenieść mój dziennik posiłków? mam eksport",
                    },
                    {
                        from: "ai",
                        text: "Zanim otworzę importer: na Twoim koncie nie ma ustawionej strefy czasowej, więc daty z eksportu zostałyby odczytane jako UTC, a posiłki mogłyby trafić na zły dzień. Ustawić ją najpierw? W jakiej strefie czasowej jesteś?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Ustawiono strefę America/Chicago, a importer jest otwarty powyżej: wybierz w nim plik eksportu z MyFitnessPal. Jest odczytywany bezpośrednio w Twojej przeglądarce i nic się nie zapisze, dopóki nie potwierdzisz podglądu.",
                    },
                    {
                        from: "user",
                        text: "dopasował kolumny, ale przy nazwie produktu jest „brak w tym pliku”?",
                    },
                    {
                        from: "ai",
                        text: "To normalne w MyFitnessPal: eksport ma jeden wiersz na każdy posiłek w danym dniu, z sumami, ale bez nazw produktów. Wiersze bez nazwy produktu dostają nazwę aplikacji, z której pochodzą, a kalorie i makro przechodzą bez zmian.",
                    },
                    {
                        from: "user",
                        text: "603 posiłki. pisze, że zostaną zapisane w południe?",
                    },
                    {
                        from: "ai",
                        text: "Tak, eksport ma daty, ale nie ma godzin posiłków, więc każdy trafia na lokalne południe. Dzięki temu każdy posiłek zostaje we właściwym dniu w Chicago; nie zobaczysz tylko, o której faktycznie jedzono.",
                    },
                    {
                        from: "user",
                        text: "gotowe! wszystko weszło?",
                    },
                    {
                        from: "ai",
                        text: "Wszystko: zaimportowano 603 posiłki, bez żadnych błędów.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 2,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Zabierz swoje dane",
                description:
                    "Jedna prośba wystarczy, żeby spakować wszystko, co o Tobie przechowujemy — posiłki i ich składniki, zapisane posiłki, wodę, pomiary wagi, wymiary ciała, cele, ustawienia profilu, dane konta, telemetrię użycia i połączone aplikacje — do ZIP-a z plikami CSV i plikiem README. Znaczniki czasu są w Twojej strefie czasowej, a meals.csv można od razu zaimportować z powrotem.",
                toolNotes: {
                    export_all_data:
                        "Pakuje wszystkie pliki CSV i README do ZIP-a z linkiem ważnym 60 minut",
                },
                messages: [
                    {
                        from: "user",
                        text: "moja dietetyczka chce zobaczyć mój dziennik posiłków. możesz mi go wyeksportować do arkusza?",
                    },
                    {
                        from: "ai",
                        text: "Gotowe. ZIP zawiera 1204 posiłki, 318 wpisów wody i 64 pomiary wagi, a do tego Twoje cele żywieniowe, ustawienia profilu, dane konta, telemetrię użycia narzędzi i połączone aplikacje. Dziennik posiłków to plik meals.csv w środku.",
                        link: "Pobierz eksport (link ważny przez 60 minut)",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Tu śniadanie, gdzie indziej już kolacja.",
        sub: "Statystyki na żywo ze wszystkich kont Nutrition MCP — kalorie, zapisane posiłki, makroskładniki i zrzucone kilogramy — odświeżane co pięć sekund.",
        liveLabel: "Na żywo",
        unitGroupLabel: "Jednostki",
        unitMetricLabel: "Metryczne",
        unitImperialLabel: "Imperialne",
        unitKgLabel: "Metryczne (kg)",
        unitLbLabel: "Imperialne (lb)",
        refreshBefore: "Odświeżanie co 5 s · następne za ",
        refreshAfter: " s",
        sinceOpenLabel: "od otwarcia tej strony",
        calCaption: "Zapisane kalorie",
        cards: {
            foodLogs: "Zapisane posiłki",
            protein: "Zapisane białko",
            carbs: "Zapisane węglowodany",
            fat: "Zapisany tłuszcz",
            weightLost: "Spadek wagi od 2 lipca 2026",
            water: "Zapisana woda",
        },
        foodLogsUnit: {
            one: "posiłek",
            few: "posiłki",
            many: "posiłków",
            other: "posiłku",
        },
        timezonesAfter:
            " — tyle stref czasowych · nowy dzień zaczyna się o północy czasu lokalnego każdej osoby",
        mapNote: "wielkość kropki = udział profili",
        mapAriaLabel:
            "Mapa świata ze strefami czasowymi ustawionymi w profilach; każda strefa pojawia się dopiero, gdy używają jej co najmniej trzy profile",
        foot: "Sumy ze wszystkich kont, aktualizowane z każdym zapisanym posiłkiem. Nigdy nie pokazujemy danych pojedynczych osób.",
    },

    features: {
        title: "Co możesz śledzić",
        cards: [
            {
                title: "Posiłki opisane własnymi słowami",
                body: "Opisz posiłek — Twoje AI oszacuje kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, cukier dodany i kofeinę w miligramach, a potem wszystko zapisze. Posiłki, które jadasz często, zapiszesz razem ze składnikami i potem dodasz po samej nazwie.",
            },
            {
                title: "Zeskanuj kod kreskowy",
                body: "Zrób zdjęcie kodu kreskowego produktu albo wpisz go ręcznie i pobierz z Open Food Facts makroskładniki, błonnik i cukry — a także cukier dodany, jeśli jest podany — przeliczone na zjedzoną ilość.",
            },
            {
                title: "Cele i postępy",
                body: "Ustaw dzienne cele kalorii, makroskładników, błonnika i wody, a do tego limity cukru dodanego, cukrów ogółem, kofeiny i alkoholu, których nie chcesz przekraczać — i na bieżąco sprawdzaj postępy.",
            },
            {
                title: "Podsumowania i trendy",
                body: "Dzienne i tygodniowe zestawienia, trendy z 7, 14 i 30 dni, serie i powtarzające się wzorce posiłków.",
            },
            {
                title: "Nawodnienie",
                body: "Zapisuj wypitą wodę w mililitrach obok posiłków i przeglądaj ją dzień po dniu.",
            },
            {
                title: "Śledzenie wagi",
                body: "Zapisuj wagę w kg albo lb, oglądaj wygładzoną wagę trendu i tempo tygodniowe z całej historii i śledź postępy w drodze do wagi docelowej. Obok możesz też zapisywać obwody dziewięciu partii ciała — od talii po łydkę — w cm albo calach.",
            },
            {
                title: "Twoja strefa czasowa",
                body: "Nowy dzień zaczyna się według Twojego czasu lokalnego, gdziekolwiek na świecie jesteś.",
            },
            {
                title: "Import z innej aplikacji",
                body: "Przenieś historię posiłków z MyFitnessPal, Cronometer, Lose It! albo MacroFactor — albo z dowolnego innego pliku CSV, samodzielnie dopasowując kolumny. Przed zapisem potwierdzasz, co zostanie dodane.",
            },
            {
                title: "Eksport — dane należą do Ciebie",
                body: "Pobierz wszystko, co o Tobie przechowujemy — posiłki i ich składniki, zapisane posiłki, wodę, wagę, wymiary ciała, cele i profil, a do tego dane konta, telemetrię użycia i połączone aplikacje — w jednym ZIP-ie z plikami CSV. Na razie z powrotem można zaimportować tylko posiłki. Konto i dane usuniesz, kiedy tylko zechcesz.",
            },
        ],
    },

    why: {
        title: "Rozmowa zamiast klikania.",
        sub: "Zrób zdjęcie kodu kreskowego albo po prostu opisz posiłek. Bez przekopywania bazy danych i bez otwierania kolejnej aplikacji.",
        oldHeading: "Tradycyjne aplikacje",
        oldItems: [
            "Wyszukiwanie w bazie każdego produktu z osobna",
            "Ręczne poprawianie błędnych wpisów w bazie",
            "Kolejna aplikacja do otwierania, często z funkcjami za opłatą",
            "Żmudne ręczne zapisywanie",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Opisujesz posiłki zwykłymi słowami",
            "Kalorie i makroskładniki szacowane za Ciebie",
            "Działa w Claude albo ChatGPT, za darmo",
            "Pytasz o trendy, podsumowania i cele",
        ],
        noteHtml:
            'Przechodzisz z konkretnej aplikacji? Zobacz, jak Nutrition MCP wypada w porównaniu z <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer i innymi licznikami kalorii</a>.',
    },

    trust: [
        {
            label: "Prywatność domyślnie",
            small: "Nigdy nie sprzedajemy ani nie udostępniamy Twoich danych i nie używamy ich do reklam.",
        },
        {
            label: "Open source",
            small: "Sprawdź kod albo hostuj samodzielnie.",
        },
        {
            label: "Eksport w każdej chwili",
            small: "Wszystko, co przechowujemy, w plikach CSV w jednym ZIP-ie.",
        },
        { label: "Usunięcie od ręki", small: "Usuń konto i dane." },
    ],

    support: {
        title: "Pomóż utrzymać projekt przy życiu.",
        sub: "Nutrition MCP jest darmowy i bez reklam. Patreon pokrywa rachunki za serwer i bazę danych.",
        updatesTitle: "Nowości na Patreonie",
        updatesBadge: "Za darmo",
        updatesNote: "Czytasz za darmo, bez członkostwa.",
        updatesPrevLabel: "Poprzednia aktualizacja",
        updatesNextLabel: "Następna aktualizacja",
        updatesDotLabel: "Aktualizacja",
        postLinkLabel: "Czytaj na Patreonie",
        free: {
            tier: "Darmowe członkostwo",
            price: "0 zł",
            desc: "Bądź na bieżąco: dostawaj wiadomości o serwerze, nowych narzędziach i planach na przyszłość.",
            cta: "Obserwuj na Patreonie",
        },
        paid: {
            tier: "Płatne członkostwo",
            price: "Płacisz, ile chcesz",
            desc: "Jeśli Nutrition MCP Ci się przydaje, możesz dorzucić się do kosztów hostingu i bazy danych. Wszyscy, także wspierający, mają te same funkcje, a całość pozostaje darmowa dla każdego.",
            cta: "Zostań patronem",
        },
    },

    cta: {
        title: "Zacznij śledzić dietę w niecałą minutę.",
        sub: "Darmowy i open source — działa z AI, którego już używasz.",
        primary: "Szybka instalacja",
        secondary: "Postaw gwiazdkę na GitHubie",
    },

    contact: {
        title: "Pytania albo opinie?",
        sub: "Trafił Ci się błąd, brakuje jakiejś funkcji albo po prostu masz pytanie? Napisz do mnie bezpośrednio — czytam każdą wiadomość.",
        cta: "Wyślij e-mail",
    },

    faqSection: {
        title: "Najczęściej zadawane pytania",
    },
    faq: [
        {
            question: "Czym jest Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP to darmowy serwer Model Context Protocol (MCP) o otwartym kodzie źródłowym, który zamienia Claude, ChatGPT albo inną aplikację obsługującą MCP w licznik kalorii i makroskładników. Zamiast przeszukiwać bazę produktów, mówisz AI, co było na talerzu, a ono zapisuje kalorie, makroskładniki, błonnik, cukry, cukier dodany i kofeinę w Twoim własnym dzienniczku żywieniowym.",
        },
        {
            question: "Czym jest Model Context Protocol (MCP)?",
            visibleHtml:
                "Model Context Protocol to otwarty standard, który pozwala asystentom AI, takim jak Claude i ChatGPT, łączyć się z zewnętrznymi narzędziami i źródłami danych. Serwer MCP udostępnia konkretne możliwości — tutaj śledzenie odżywiania — z których AI może korzystać podczas rozmowy. To coś w rodzaju systemu wtyczek dla asystentów AI.",
        },
        {
            question: "Jak liczyć kalorie z Claude albo ChatGPT?",
            visibleHtml:
                "Połącz Nutrition MCP jeden raz — w Claude z katalogu konektorów, w ChatGPT jako własną aplikację z adresem URL serwera — i zaloguj się. Potem opisz AI własnymi słowami, co było na talerzu, pokaż mu zdjęcie posiłku albo podaj kod kreskowy produktu. Twoje AI oszacuje kalorie, białko, węglowodany, tłuszcz, błonnik, cukry i cukier dodany, a Nutrition MCP zapisze wpis w Twoim dzienniku posiłków. W każdej chwili możesz zapytać o dzisiejsze sumy, tygodniowe trendy albo realizację celów.",
        },
        {
            // Widoczna odpowiedź celowo pomija adres URL serwera (podany już
            // gdzie indziej na stronie); odpowiedź JSON-LD, czytana osobno
            // przez wyszukiwarki, podaje go wprost. Ta rozbieżność istniała
            // już w źródle angielskim — zachowana wiernie, nie ujednolicona.
            question: "Czy działa z ChatGPT?",
            visibleHtml:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz własną aplikację z adresem URL serwera i uwierzytelnianiem OAuth, a potem zaloguj się. Do utworzenia własnej aplikacji potrzebny jest tryb deweloperski ChatGPT (Developer mode), który OpenAI udostępnia w niektórych planach ChatGPT.",
            jsonLdText:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz własną aplikację z adresem URL serwera https://nutrition-mcp.com/mcp i uwierzytelnianiem OAuth, a potem zaloguj się. Do utworzenia własnej aplikacji potrzebny jest tryb deweloperski ChatGPT (Developer mode), który OpenAI udostępnia w niektórych planach ChatGPT.",
        },
        {
            question: "Jakie inne aplikacje są obsługiwane?",
            visibleHtml:
                "Każdy klient MCP obsługujący OAuth 2.0 z PKCE — w tym Claude.ai, aplikacje Claude na komputer i telefon, Claude Code, Cursor, Windsurf i VS Code.",
        },
        {
            question: "Czy mogę hostować go samodzielnie?",
            visibleHtml:
                'Tak. Nutrition MCP jest open source (licencja MIT). Możesz uruchomić własną instancję z własnym projektem Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repozytorium na GitHubie</a> zawiera pełny przewodnik po samodzielnym hostingu i plik Dockerfile.',
        },
        {
            question: "Czy Nutrition MCP jest darmowy?",
            visibleHtml:
                "Tak, jest całkowicie darmowy — bez płatnego planu, bez reklam, bez ukrytych kosztów. Potrzebujesz aplikacji AI obsługującej konektory MCP, takiej jak Claude albo ChatGPT, oraz darmowego konta Nutrition MCP, które zakładasz przy pierwszym połączeniu. Dobrowolne darowizny na Patreonie pomagają pokryć koszty serwera i niczego nie odblokowują.",
        },
        {
            question: "Co mogę śledzić?",
            visibleHtml:
                "Kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem, cukier dodany i wodę w każdym wpisie — opisane własnymi słowami albo pobrane z kodu kreskowego produktu przez Open Food Facts. Posiłek można zapisać składnik po składniku, każdy z własną ilością i wartościami, a posiłek, który jadasz często, możesz zachować jako zapisany posiłek i potem dodawać do dziennika po samej nazwie. Śledzona jest też kofeina, w miligramach, czyli w jednostce używanej na każdej etykiecie; nie dodaje ona kalorii. Można też śledzić alkohol, w gramach czystego etanolu; pojawia się po włączeniu śledzenia alkoholu. Możesz również zapisywać masę ciała w kg albo lb i śledzić trendy w drodze do wagi docelowej. Wymiary ciała (talię, biodra, szyję, klatkę piersiową, barki, ramię, przedramię, udo i łydkę) też możesz zapisywać w cm albo calach. Przeglądaj dzienne podsumowania, wyszukuj posiłki z wybranego zakresu dat, poprawiaj lub usuwaj wcześniejsze wpisy, ustawiaj cele i obserwuj trendy w czasie.",
        },
        {
            question:
                "Czy mogę zapisać posiłki, które często jadam, albo własne przepisy?",
            visibleHtml:
                "Tak. Poproś o zapisanie posiłku pod nazwą — z samymi wartościami albo jako przepis ze składnikami — a zostaną zachowane jego wartości na jedną porcję. Następnym razem wystarczy podać nazwę, a posiłek trafi do dziennika w jednym kroku: przeliczony przez liczbę porcji, z pojedynczym składnikiem ustawionym na faktycznie zjedzoną ilość albo pominiętym. Wpis w dzienniku jest kopią, więc późniejsza zmiana lub usunięcie zapisanego posiłku nigdy nie zmienia posiłków już z niego dodanych. Zapisane posiłki są częścią eksportu Twoich danych.",
        },
        {
            question: "Jak dokładne jest liczenie kalorii?",
            visibleHtml:
                "To szacunki. W przypadku posiłku, który opisujesz albo fotografujesz, wartości szacuje Twoje AI; w przypadku kodu kreskowego pochodzą z danych z etykiety produktu w Open Food Facts, które Twoje AI przelicza na zjedzoną przez Ciebie ilość. Jedno i drugie może być błędne, więc sprawdzaj wszystko, co ma dla Ciebie znaczenie — każdy wpis możesz poprawić albo usunąć, po prostu o to prosząc. Nutrition MCP to narzędzie do zapisywania, a nie porada medyczna ani dietetyczna: zanim podejmiesz decyzje dotyczące zdrowia, porozmawiaj z lekarzem albo dietetykiem, zwłaszcza jeśli jesteś w ciąży, masz problemy zdrowotne albo masz za sobą zaburzenia odżywiania.",
        },
        {
            question: "Czy śledzi alkohol?",
            visibleHtml:
                "Tak, jako opcja do włączenia: śledzenie alkoholu jest domyślnie wyłączone, a alkohol pozostaje ukryty w Twoich posiłkach, celach i podsumowaniach, dopóki go nie włączysz. Wtedy drinki są pokazywane w gramach czystego etanolu oraz w amerykańskich porcjach standardowych albo jednostkach brytyjskich, zależnie od Twojego wyboru. Nic nie dolicza alkoholu na domysł: trafia on do dziennika tylko z drinka, którego zapiszesz, albo z kolumny alkoholu w importowanym pliku, a zapisany drink zostaje zachowany nawet wtedy, gdy śledzenie jest wyłączone. Ponowne wyłączenie śledzenia ukrywa alkohol i sprawia, że importer przestaje odczytywać kolumny alkoholu — to nie jest przełącznik usuwania, a Twój eksport zawsze zawiera wszystko, co zostało zapisane. Aby usunąć wartość alkoholu, usuń posiłek, do którego należy.",
        },
        {
            question:
                "Czy mogę zaimportować historię z MyFitnessPal albo innej aplikacji?",
            visibleHtml:
                "Tak. Poproś o import swojej historii, a w czacie otworzy się importer: wybierasz plik CSV wyeksportowany ze starej aplikacji, sprawdzasz, jak dopasowano jego kolumny, i widzisz, co zostanie dodane, zanim potwierdzisz. Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor są rozpoznawane automatycznie, a każdy inny CSV zadziała, gdy samodzielnie dopasujesz kolumny. Plik odczytuje Twoja przeglądarka, więc AI nigdy nie przepisuje Twoich wierszy. W aplikacjach bez paneli w czacie możesz zamiast tego wkleić eksport — a ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        },
        {
            question: "Czy moje dane są prywatne?",
            visibleHtml:
                'Twoje wpisy są przechowywane w UE i powiązane z Twoim własnym kontem, do którego masz dostęp przez połączone aplikacje AI. Nutrition MCP nigdy nie sprzedaje Twoich danych, nigdy nie udostępnia ich stronom trzecim i nigdy nie wykorzystuje ich do reklam; strona główna pokazuje tylko anonimowe sumy dla całej witryny. To, co Twoje AI odczyta przez narzędzia, trafia do dostawcy tego AI na podstawie Twojej własnej umowy z nim. W każdej chwili możesz wyeksportować wszystko, co o Tobie przechowujemy, albo usunąć konto i wszystkie jego dane — szczegóły znajdziesz w <a href="/privacy" data-link="privacy">polityce prywatności</a>.',
        },
    ],
};

// Polish translation of src/copy/index.ts's IndexDoc. See that file's header
// for the shape/trust-level rules this follows: the hero chat and the example
// slides are structured (one field per message), so only the words translate;
// `photo`, `card`, `meal.type`, `id`, `from`, `download`, `cards` and the
// `toolNotes` keys are structure, copied verbatim from English.
//
// Notes for the Polish version:
//   - "zjadłeś/aś" and similar forms cover both genders on purpose, as on
//     /tools and the rest of the site.
//   - Claude and ChatGPT UI labels (Customize, Connectors, Settings → Apps…)
//     stay in English, because that is how they appear on screen.
//   - Every figure a card draws is kept as written; in running text numbers
//     use Polish formatting (2000, 1540, 78,4 kg).

import type { IndexDoc } from "./index.js";

export const INDEX_PL: IndexDoc = {
    title: "Nutrition MCP — Licznik kalorii i makro dla Claude i ChatGPT",
    metaDescription:
        "Zapisuj posiłki, kalorie i makroskładniki, rozmawiając z Claude lub ChatGPT. Darmowy serwer MCP open source z kodami kreskowymi, wagą i pełnym eksportem.",
    ogDescription:
        "Zapisuj posiłki, kalorie i makroskładniki, rozmawiając z Claude lub ChatGPT. Darmowy serwer MCP open source z kodami kreskowymi, wagą i pełnym eksportem.",
    keywords:
        "tracker odżywiania, tracker posiłków, serwer MCP, Claude AI, ChatGPT, licznik kalorii, tracker makroskładników, skaner kodów kreskowych, zapisywanie jedzenia, tracker diety, tracker wagi, dziennik wagi, odżywianie AI, Model Context Protocol",

    hero: {
        titleBeforeEm: "Śledź swoją dietę, po prostu ",
        titleEm: "rozmawiając",
        titleAfterEm: " ze swoim AI.",
        lead: "Połącz Claude albo ChatGPT, a potem po prostu powiedz, co zjadłeś/aś. Kalorie i makroskładniki, zapisywane automatycznie.",
        ctaPrimary: "Szybka instalacja",
        ctaSecondary: "Wsparcie",
        moreExamples: "Więcej przykładów",
        chat: {
            photoAlt:
                "Zdjęcie: smoothie bowl z bananem, owocami leśnymi i granolą, a obok americano",
            pauseLabel: "Wstrzymaj demo",
            replayLabel: "Odtwórz demo ponownie",
            exchanges: [
                {
                    photo: true,
                    userText: "śniadanie + americano",
                    aiText: "Smoothie bowl, na oko domowej roboty. Masz go w dzienniku w dwóch wersjach: z granolą i miodem albo z samymi owocami. Która to wersja?",
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
                    aiText: "Zapisano śniadanie: 480 kcal, 21 g białka i 126 mg kofeiny. Cukru jest już 51 z Twojego limitu 60 g.",
                    card: "meal-logged",
                    meal: {
                        description:
                            "Smoothie bowl (1 miska: jogurt grecki, banan, owoce leśne) z granolą (1 garść) i miodem (1 łyżka); podwójne americano z odrobiną mleka owsianego",
                        type: "breakfast",
                    },
                },
                {
                    userText:
                        "obiad: resztki stir fry z wczoraj, ta sama porcja. i butelka wody 500 ml",
                    aiText: "Zapisano obiad, to samo co wczoraj wieczorem: 620 kcal i 54 g białka, plus 500 ml wody.",
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
                    aiText: "Zostało 850 kcal i 84 g białka. Cukru jest 59 z Twojego limitu 60 g.",
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
        title: "Trzy kroki. Żadnej aplikacji do nauki.",
        steps: [
            {
                title: "Połącz się raz",
                body: "Działa z każdym klientem AI, który obsługuje zdalne serwery MCP — Claude, ChatGPT i inne. Bez instalacji, bez kluczy API.",
            },
            {
                title: "Po prostu powiedz, co zjadłeś/aś",
                body: "Opisz to zwykłym językiem — albo wyślij zdjęcie posiłku, zrzut ekranu z aplikacji dostawczej albo kod kreskowy (produkt zostanie wyszukany w internecie). Makroskładniki zapisywane automatycznie.",
            },
            {
                title: "Śledź i przeglądaj",
                body: "Poproś o dzienne podsumowania, tygodniowe trendy, postęp celów albo wyeksportuj wszystko, co zapisałeś/aś, jako pliki CSV — całkowicie za darmo.",
            },
        ],
        counter: "{n} / 3",
    },

    install: {
        title: "Połącz się w mniej niż minutę",
        sub: "Działa z każdym klientem MCP, który obsługuje OAuth 2.0 z PKCE. Przy pierwszym połączeniu zakładasz konto przez Google albo e-mail i hasło; loguj się tak samo, żeby zachować swoje dane.",
        copyAriaLabel: "Kopiuj adres URL serwera",
        tabsLabel: "Wybierz swojego klienta AI",
        claude: {
            cta: "Dodaj do Claude",
            steps: [
                "Na stronie katalogu kliknij <strong>Connect</strong>, a potem kontynuuj przez Google albo zaloguj się e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się w Twoich aplikacjach na iOS i Androida.",
            ],
            note: "Działa na każdym planie Claude, także darmowym. Aby dodać go ręcznie, użyj Customize → Connectors → Add custom connector z adresem https://nutrition-mcp.com/mcp.",
        },
        chatgpt: {
            steps: [
                "Otwórz <strong>ChatGPT w przeglądarce</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Kliknij <strong>Create app</strong> na dole wyskakującego okna. Jeśli go nie widzisz, włącz <strong>Developer mode</strong> w <strong>Advanced settings</strong>.",
                "Nadaj mu nazwę, na przykład <strong>Nutrition</strong>.",
                "W polu <strong>Connection</strong> wklej <code>https://nutrition-mcp.com/mcp</code>.",
                "W polu <strong>Authentication</strong> wybierz <strong>OAuth</strong> — resztę zostaw bez zmian.",
                'Zaznacz <strong>„I understand and want to continue"</strong>.',
                "Kliknij <strong>Create</strong>.",
                "Kliknij <strong>Sign in with Nutrition</strong> — otworzy się strona logowania; kontynuuj przez Google albo zaloguj się e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się w Twoich aplikacjach na iOS i Androida.",
            ],
        },
        other: {
            note: "Dodaj powyższą konfigurację do swojego klienta (Cursor, VS Code, Claude Code i inne). Windsurf używa <code>serverUrl</code> zamiast <code>url</code>. W Claude Code uruchom <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Twój klient obsłuży logowanie OAuth automatycznie.",
        },
        otherTabLabel: "Inni klienci",
    },

    onboarding: {
        title: "Skonfiguruj raz — albo po prostu zacznij mówić",
        sub: "To całkowicie opcjonalne — Nutrition MCP działa od razu po połączeniu. Jeśli chcesz, te trzy szybkie kroki zwiększą dokładność, ale możesz też od razu przejść do zapisywania.",
        justSay: "Po prostu powiedz ",
        steps: [
            {
                title: "Ustaw strefę czasową",
                body: "żeby dni zmieniały się o Twojej lokalnej północy, a dzisiejsze podsumowania były trafne, gdziekolwiek jesteś.",
                say: "Ustaw moją strefę czasową na Nowy Jork",
            },
            {
                title: "Ustaw swoje cele",
                body: "dzienne cele kaloryczne, makroskładnikowe i wodne, a także opcjonalną wagę docelową i preferowaną jednostkę wagi (kg lub lb), względem których będziesz śledzić postępy.",
                say: "Ustaw mój dzienny cel na 2000 kalorii i 150 g białka",
            },
            {
                title: "Ustaw swój język",
                body: "język, w jakim wyświetlają się widżety w czacie (panele, wykresy), a nie treści, które pisze do Ciebie AI.",
                say: "Pokazuj moje widżety po niemiecku",
            },
            {
                title: "Zacznij zapisywać",
                body: "po prostu powiedz, co zjadłeś/aś, wyślij zdjęcie albo zeskanuj kod kreskowy. To wszystko.",
                say: "Zjadłem/am owsiankę z owocami na śniadanie",
            },
        ],
        note: "Wszystko tutaj jest opcjonalne. Możesz to zrobić teraz, później albo wcale — po prostu zacznij zapisywać, a to ustaw, kiedy tylko zechcesz.",
        toolsCta: {
            heading: "Ciekawi Cię, co naprawdę potrafi?",
            body: "Przejrzyj wszystkie 36 narzędzi — zapisywanie, kody kreskowe, woda, waga, cele i trendy — z opisem i przykładowym poleceniem dla każdego.",
            arrow: "Zobacz narzędzia",
        },
    },

    examples: {
        title: "Po prostu z nim porozmawiaj.",
        sub: "Kilka rzeczy, które możesz zrobić — po prostu rozmawiając.",
        prevLabel: "Poprzedni przykład",
        nextLabel: "Następny przykład",
        pickerLabel: "Wybierz przykład",
        carouselLabel: "Przykłady",
        threadLabel: "Rozmowa",
        moreToolsLabel: "Korzysta też z",
        toolLinkLabel:
            "{tool} na stronie narzędzi (otwiera się w nowej karcie)",
        photoMealAlt:
            "Zdjęcie: miska barszczu z łyżką śmietany i koperkiem, a obok kromka żytniego chleba",
        photoPackageAlt:
            "Zdjęcie: kod kreskowy na puszce Coca-Coli, numer 5449000000996",
        downloadExpires: "Wygasa za 60 minut",
        slides: [
            {
                id: "log-meal",
                title: "Pisz zwykłymi słowami",
                description:
                    "Powiedz to tak, jak znajomemu. Gdy brakuje porcji albo nie wiadomo, który to posiłek, AI dopyta, zanim oszacuje. Błonnik i cukry trafiają do każdego wpisu, kofeina do wszystkiego, co ją zawiera, a „dziś rano” wypada w Twojej strefie czasowej.",
                toolNotes: {
                    log_meal:
                        "Zapisuje śniadanie: makroskładniki, błonnik, cukry i kofeinę z kawy",
                    log_water:
                        "Dolicza 500 ml z 07:00 do dzisiejszej sumy wody",
                    get_current_time:
                        "Ustala dzisiejszą datę, żeby „koło 7” trafiło na 07:00",
                },
                messages: [
                    {
                        from: "user",
                        text: "owsianka z borówkami i kawa na śniadanie",
                    },
                    {
                        from: "ai",
                        text: "Jak duża była miska i czy owsianka była na mleku, czy na wodzie? Coś do kawy?",
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
                        text: "aha, i koło 7, przed bieganiem, było jeszcze jakieś pół litra wody",
                    },
                    {
                        from: "ai",
                        text: "Dodano 500 ml wody o 07:00 dziś rano.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
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
                    "Zdjęcie zaczyna rozmowę, a nie zgadywanie. AI pyta, czy danie było domowe, czy z restauracji, sprawdza w Twoich wcześniejszych wpisach to, czego nie widać na zdjęciu, pyta zwykłymi miarami, ile zjedzono, i zapisuje dopiero wtedy, gdy zaakceptujesz podsumowanie.",
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
                        text: "Wygląda na barszcz ze śmietaną i kromkę żytniego chleba. Domowy czy z restauracji? Jeśli z restauracji, to z której?",
                    },
                    {
                        from: "user",
                        text: "Tsybulya, na Podolu w Kijowie",
                    },
                    {
                        from: "ai",
                        text: "Barszcz w restauracji Tsybulya zapisywałeś/aś już dwa razy, za każdym razem wersję na wołowinie ze śmietaną. Tym razem to samo? I czy zjadłeś/aś całą miskę i chleb?",
                    },
                    {
                        from: "user",
                        text: "to samo, wszystko, chleb też",
                    },
                    {
                        from: "ai",
                        text: "Czyli: barszcz na wołowinie ze śmietaną (1 miska, zjedzona) i chleb żytni (1 kromka) w restauracji Tsybulya, Podół, Kijów. Około 520 kcal i 24 g białka — to wartości szacunkowe, a nie opublikowane dane. Zapisać jako obiad?",
                    },
                    {
                        from: "user",
                        text: "tak",
                    },
                    {
                        from: "ai",
                        text: "Zapisano obiad: 520 kcal · 24 g białka · 43 g węglowodanów · 27 g tłuszczu · 7 g błonnika · 10 g cukru.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
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
                    "Zrób zdjęcie opakowania: cyfry spod kodu kreskowego są wyszukiwane w Open Food Facts, a AI pyta, ile tego było. Open Food Facts nie podaje kofeiny, więc jej ilość pochodzi z etykiety albo z typowych wartości; brakujące wartości błonnika czy cukrów są szacowane, a nie zostawiane puste.",
                toolNotes: {
                    lookup_barcode:
                        "Pobiera dane z etykiety puszki z Open Food Facts",
                    log_meal: "Zapisuje całą puszkę do obiadu, razem z kofeiną",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "to było do obiadu. jak bardzo to jest złe?",
                    },
                    {
                        from: "ai",
                        text: "To puszka Coca-Coli 330 ml: 139 kcal i 35 g cukru według Open Food Facts. Cała puszka?",
                    },
                    {
                        from: "user",
                        text: "cała",
                    },
                    {
                        from: "ai",
                        text: "Zapisano do obiadu: 139 kcal, 35 g cukru i 33 mg kofeiny z etykiety puszki, bo Open Food Facts nie podaje kofeiny. A jak bardzo złe: sam ten cukier to ponad połowa Twojego dziennego limitu 60 g, a Open Food Facts przyznaje napojowi Nutri-Score E i NOVA 4, czyli żywność ultraprzetworzoną.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 3,
                    },
                ],
                cardMeals: ["Coca-Cola (puszka 330 ml)"],
            },
            {
                id: "goals-progress",
                title: "Ustaw cele, sprawdzaj postęp",
                description:
                    "Ustaw cele do osiągnięcia, jak kalorie i białko, oraz limity dla cukrów, alkoholu i kofeiny; zmienia się tylko to, co wymienisz. Potem zapytaj o dowolny dzień, by zobaczyć każdą wartość na tle celu i ile jeszcze zostało.",
                toolNotes: {
                    set_nutrition_goals:
                        "Zapisuje cele kalorii i białka oraz limit kofeiny 400 mg",
                    get_goal_progress:
                        "Pokazuje dzisiejszy dzień na tle celów i ile jeszcze zostało",
                },
                messages: [
                    {
                        from: "user",
                        text: "chcę się trochę wyrzeźbić. ustaw mi 2000 kcal i 160 g białka. i jaki limit kofeiny ma sens? praktycznie żyję na kawie",
                    },
                    {
                        from: "ai",
                        text: "Dla zdrowych dorosłych EFSA i FDA podają do 400 mg dziennie, czyli mniej więcej cztery kubki parzonej kawy, a w ciąży EFSA zaleca do 200 mg. Limit to Twoja decyzja; ustawić 400?",
                    },
                    {
                        from: "user",
                        text: "no, 400",
                    },
                    {
                        from: "ai",
                        text: "Gotowe: 2000 kcal i 160 g białka do osiągnięcia, kofeina poniżej 400 mg. Reszta bez zmian: 220 g węglowodanów, 70 g tłuszczu, 30 g błonnika, 2,5 l wody i limit cukru 60 g.",
                    },
                    {
                        from: "user",
                        text: "zmieszczę jeszcze wieczorem deser?",
                    },
                    {
                        from: "ai",
                        text: "Na razie masz 1540 kcal i 104 g białka, więc zostało 460 kcal i 56 g białka. Ciaśniej jest z cukrem: 40 z limitu 60 g, czyli zostało 20 g. Kofeina: 130 z 400 mg.",
                    },
                ],
                cards: [
                    {
                        kind: "goal-progress",
                        after: 5,
                    },
                ],
            },
            {
                id: "review-week",
                title: "Przejrzyj tydzień",
                description:
                    "Zapytaj, jak minął tydzień, a widżet trendów otworzy się w czacie ze średnimi i liczbą dni z wpisami. Przełączaj 7, 14 i 30 dni albo dotknij składnika, by zobaczyć wykres, bez nowego zapytania. AI powie Ci też o seriach i dniach zgodnych z celem.",
                toolNotes: {
                    get_trends:
                        "Liczy średnie z 7, 14 i 30 dni i otwiera widżet trendów",
                },
                messages: [
                    {
                        from: "user",
                        text: "jak mi poszły ostatnie dwa tygodnie? mam wrażenie, że totalny chaos",
                    },
                    {
                        from: "ai",
                        text: "Stabilniej, niż się wydaje. Średnio 1830 kcal dziennie, 170 poniżej celu 2000, ale ta średnia liczy jako zero jedyny niezapisany dzień z 14. W 13 dniach z wpisami wychodzi około 1970, a 9 dni mieści się w 10% od celu. No i masz serię 10 dni z wpisami z rzędu.",
                    },
                    {
                        from: "user",
                        text: "a cukier?",
                    },
                    {
                        from: "ai",
                        text: "Na niego trzeba uważać. Średnio 52 g, a limit 60 g przekroczony w 4 z 13 dni.",
                    },
                ],
                cards: [
                    {
                        kind: "trends",
                        after: 1,
                    },
                ],
            },
            {
                id: "weight-trend",
                title: "Śledź swoją wagę",
                description:
                    "Zapisz pomiar wagi w kg albo lb i zobacz trend spod codziennych wahań: wygładzoną średnią, zmianę w ciągu miesiąca i to, ile zostało do wagi docelowej. Niemożliwy odczyt, np. z pominiętym przecinkiem, zostaje wyłapany przed zapisem.",
                toolNotes: {
                    log_weight:
                        "Odrzuca 784 kg jako nieprawdopodobne, potem zapisuje 78,4 kg",
                    get_weight_trends:
                        "Wygładza 30 dni średnimi kroczącymi i liczy, ile zostało do celu",
                },
                messages: [
                    {
                        from: "user",
                        text: "dzisiejsze ważenie: 784",
                    },
                    {
                        from: "ai",
                        text: "784 kg wykracza poza wiarygodny zakres masy ciała (20–500 kg), więc nic nie zostało zapisane. Chodziło o 78,4 kg?",
                    },
                    {
                        from: "user",
                        text: "haha tak, zgubił się przecinek. jak mi idzie?",
                    },
                    {
                        from: "ai",
                        text: "Zapisano 78,4 kg. Od 11 lutego ubyło Ci 1,8 kg, około 0,4 kg tygodniowo, a średnia z 7 dni to 78,7 kg. Do celu 75 kg zostało 3,4 kg.",
                    },
                ],
                cards: [
                    {
                        kind: "weight-trends",
                        after: 3,
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
                        "Porównuje dni ze śniadaniem, porę kolacji i weekendy z 30 dni",
                },
                messages: [
                    {
                        from: "user",
                        text: "czy jem więcej w dni, kiedy pomijam śniadanie? mam takie wrażenie",
                    },
                    {
                        from: "ai",
                        text: "Trochę tak. Masz wpisy z 28 z ostatnich 30 dni, a śniadanie pominięte 6 razy. Te dni dają średnio 2215 kcal, wobec 1940 w 22 dniach ze śniadaniem, i około 35 g białka mniej.",
                    },
                    {
                        from: "user",
                        text: "a późne kolacje? w dni treningowe jem dopiero o 21",
                    },
                    {
                        from: "ai",
                        text: "Też się wyróżniają: 9 dni z kolacją o 20:00 lub później to średnio 2165 kcal, wobec 1920 w pozostałych 19. Oba to wzorce w Twoich wpisach, a nie dowód, że któryś z nich jest przyczyną.",
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
                    "Alkohol pozostaje ukryty, dopóki nie włączysz jego śledzenia. Wybierz standardowe drinki amerykańskie albo jednostki brytyjskie, a każdy napój zostanie przeliczony na gramy alkoholu według objętości i mocy. Gdy znów wyłączysz śledzenie, alkohol zostanie ukryty, ale nie usunięty.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Włącza śledzenie alkoholu: gramy obok jednostek brytyjskich",
                    log_meal:
                        "Przelicza alkohol w pincie według objętości i mocy",
                },
                messages: [
                    {
                        from: "user",
                        text: "możesz liczyć też alkohol? chcę trochę przystopować",
                    },
                    {
                        from: "ai",
                        text: "Jasne. Pokazywać alkohol w standardowych drinkach amerykańskich czy w jednostkach brytyjskich?",
                    },
                    {
                        from: "user",
                        text: "brytyjskie jednostki, mieszkam w manchesterze",
                    },
                    {
                        from: "ai",
                        text: "Śledzenie alkoholu włączone, w gramach i jednostkach brytyjskich.",
                    },
                    {
                        from: "user",
                        text: "do kolacji była pinta lagera",
                    },
                    {
                        from: "ai",
                        text: "Jaka moc? Lagery mają zwykle od 4 do 5%, a moc jest podana na nalewaku albo puszce.",
                    },
                    {
                        from: "user",
                        text: "chyba 4%",
                    },
                    {
                        from: "ai",
                        text: "Zapisano do kolacji: pinta 568 ml o mocy 4% to 17,9 g alkoholu, 2,3 jednostki brytyjskiej, około 180 kcal.",
                    },
                ],
                cards: [
                    {
                        kind: "meal-logged",
                        after: 7,
                    },
                ],
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Przenieś swoją historię",
                description:
                    "Przechodzisz z MyFitnessPal, Cronometer, Lose It! albo MacroFactor? Importer otwiera się w czacie, odczytuje i mapuje Twój eksport w przeglądarce, niczego nie zapisuje, dopóki nie potwierdzisz podglądu, i nie dubluje posiłków, jeśli zaimportujesz ten sam plik ponownie przy tej samej strefie czasowej. Jeśli strefa czasowa nie jest ustawiona, importer powie Ci o tym, zanim zaczniesz.",
                toolNotes: {
                    start_meal_import:
                        "Otwiera importer w czacie dla Twojego pliku eksportu",
                    set_timezone:
                        "Ustawia America/Chicago, by godziny posiłków były lokalne",
                },
                messages: [
                    {
                        from: "user",
                        text: "przechodzę z myfitnesspal. dasz radę przenieść mój dziennik jedzenia? mam eksport",
                    },
                    {
                        from: "ai",
                        text: "Importer jest otwarty poniżej. Jedna rzecz, zanim wybierzesz plik: na Twoim koncie nie ma ustawionej strefy czasowej, więc godziny zostałyby odczytane jako UTC. Gdzie mieszkasz?",
                    },
                    {
                        from: "user",
                        text: "chicago",
                    },
                    {
                        from: "ai",
                        text: "Ustawiono America/Chicago. Teraz wybierz plik CSV Nutrition-Summary z eksportu MyFitnessPal. Jest odczytywany bezpośrednio w Twojej przeglądarce i nic nie zostanie zapisane, dopóki nie potwierdzisz podglądu.",
                    },
                    {
                        from: "user",
                        text: "dopasował kolumny, ale przy nazwie produktu pisze, że nie ma jej w tym pliku?",
                    },
                    {
                        from: "ai",
                        text: "To normalne w MyFitnessPal: eksport ma jeden wiersz na każdy posiłek dnia, z sumami, ale bez nazw produktów. Każdy posiłek zostanie więc opisany swoim rodzajem, a kalorie i makro pozostaną nienaruszone.",
                    },
                    {
                        from: "user",
                        text: "603 posiłki. pisze, że wszystkie będą w południe?",
                    },
                    {
                        from: "ai",
                        text: "Tak, eksport ma daty, ale nie ma godzin posiłków, więc każdy trafia na lokalne południe. Dzięki temu każdy posiłek zostaje we właściwym dniu w Chicago; po prostu nie będzie widać, o której naprawdę jadłeś/aś.",
                    },
                    {
                        from: "user",
                        text: "gotowe! wszystko weszło?",
                    },
                    {
                        from: "ai",
                        text: "Wszystko: zaimportowano 603 posiłki, bez ani jednego błędu.",
                    },
                ],
                cards: [
                    {
                        kind: "import-meals",
                        after: 3,
                        step: "file",
                    },
                ],
            },
            {
                id: "export-data",
                title: "Zabierz swoje dane",
                description:
                    "Jedna prośba pakuje wszystko, co jest o Tobie przechowywane — posiłki, wodę, pomiary wagi, cele, ustawienia profilu, dane konta, telemetrię użycia i połączone aplikacje — w ZIP z plikami CSV i plikiem README. Znaczniki czasu są w Twojej strefie czasowej, a meals.csv importuje się prosto z powrotem.",
                toolNotes: {
                    export_all_data:
                        "Pakuje osiem plików CSV i README pod linkiem ważnym 60 minut",
                },
                messages: [
                    {
                        from: "user",
                        text: "moja dietetyczka chce zobaczyć mój dziennik jedzenia. możesz mi go wyciągnąć jako arkusz?",
                    },
                    {
                        from: "ai",
                        text: "Proszę: jeden ZIP z 1204 posiłkami, 318 wpisami wody i 64 pomiarami wagi, a do tego Twoje cele, ustawienia profilu, dane konta, telemetria użycia narzędzi i połączone aplikacje. Dziennik jedzenia to plik meals.csv w środku, który otworzysz w Excelu albo w Google Sheets.",
                        download: "export-zip",
                    },
                    {
                        from: "user",
                        text: "mogę jej po prostu wysłać link?",
                    },
                    {
                        from: "ai",
                        text: "Lepiej pobierz plik i wyślij jej sam plik. Link przestaje działać po 60 minutach, a każdy, kto go ma, może otworzyć cały Twój eksport — nie tylko posiłki, ale też wagę, dane konta i ustawienia.",
                    },
                    {
                        from: "user",
                        text: "dobrze wiedzieć. a w razie czego mogę później przywrócić z tego dane?",
                    },
                    {
                        from: "ai",
                        text: "Posiłki tak. meals.csv używa nazw kolumn samego importera, więc wraca prosto do dziennika, a posiłki, które już w nim są, zostają rozpoznane i pominięte, więc nic się nie dubluje. Pozostałe pliki są tylko do Twojego archiwum; nie da się ich zaimportować z powrotem.",
                    },
                ],
            },
        ],
    },

    stats: {
        title: "Gdzieś śniadanie, gdzie indziej kolacja.",
        sub: "Statystyki odżywiania na żywo ze wszystkich kont Nutrition MCP — kalorie, wpisy jedzenia, makroskładniki i zrzucona waga — odświeżane co pięć sekund.",
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
            foodLogs: "Wpisy jedzenia",
            protein: "Zapisane białko",
            carbs: "Zapisane węglowodany",
            fat: "Zapisany tłuszcz",
            weightLost: "Waga zrzucona od 2 lipca 2026",
            water: "Zapisana woda",
        },
        foodLogsUnit: {
            one: "wpis",
            few: "wpisy",
            many: "wpisów",
            other: "wpisu",
        },
        timezonesAfter:
            " stref czasowych · dni zmieniają się o lokalnej północy każdej osoby",
        mapNote: "wielkość kropki = udział profili",
        mapAriaLabel:
            "Mapa świata ze strefami czasowymi ustawionymi w profilach — każda pojawia się dopiero, gdy używają jej co najmniej trzy profile",
        foot: "Sumy ze wszystkich kont, aktualizowane na bieżąco w miarę zapisywania posiłków. Dane indywidualne nigdy nie są pokazywane.",
    },

    features: {
        title: "Co możesz śledzić",
        cards: [
            {
                title: "Posiłki zwykłym językiem",
                body: "Opisz, co zjadłeś/aś — Twój AI szacuje kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i kofeinę w miligramach, po czym to zapisuje.",
            },
            {
                title: "Zeskanuj kod kreskowy",
                body: "Zrób zdjęcie albo wpisz kod kreskowy produktu i pobierz makroskładniki, błonnik i cukier z Open Food Facts, przeliczone na zjedzoną ilość.",
            },
            {
                title: "Cele i postępy",
                body: "Ustaw dzienne cele kaloryczne, makroskładnikowe, błonnika i wody — a także limity cukru, kofeiny i alkoholu, których nie należy przekraczać — i sprawdzaj postępy na bieżąco.",
            },
            {
                title: "Podsumowania i trendy",
                body: "Dzienne i tygodniowe zestawienia, trendy 7/14/30-dniowe, serie i powtarzające się wzorce posiłków.",
            },
            {
                title: "Zapisywanie wody",
                body: "Śledź nawodnienie w mililitrach razem z posiłkami i przeglądaj je dzień po dniu.",
            },
            {
                title: "Śledzenie wagi",
                body: "Zapisuj masę ciała w kg albo lb, oglądaj trendy 7/14/30-dniowe i śledź postęp w kierunku wagi docelowej.",
            },
            {
                title: "Świadomy stref czasowych",
                body: "Dni zmieniają się w Twoim lokalnym czasie, gdziekolwiek jesteś na świecie.",
            },
            {
                title: "Import z innej aplikacji",
                body: "Przenieś historię posiłków z MyFitnessPal, Cronometer, Lose It! albo MacroFactor — albo dowolnego innego CSV, mapując jego kolumny samodzielnie. Potwierdzasz, co zostanie dodane, zanim cokolwiek zostanie zapisane.",
            },
            {
                title: "Eksport i własność Twoich danych",
                body: "Zabierz wszystko, co o Tobie przechowujemy — posiłki, wodę, wagę, cele i profil, a do tego dane konta, telemetrię użycia i połączone aplikacje — jako jeden ZIP z plikami CSV. Na razie tylko posiłki można zaimportować z powrotem. Usuń swoje konto i dane, kiedy tylko zechcesz.",
            },
        ],
    },

    why: {
        title: "Rozmowa bije klikanie.",
        sub: "Zrób zdjęcie kodu kreskowego albo po prostu powiedz, co zjadłeś/aś — bez grzebania w bazie danych, bez osobnej aplikacji do otwierania.",
        oldHeading: "Tradycyjne aplikacje",
        oldItems: [
            "Przeszukuj bazę danych dla każdego produktu",
            "Ręcznie poprawiaj błędne wpisy w bazie",
            "Kolejna aplikacja do otwierania, często za paywallem",
            "Żmudne ręczne zapisywanie",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Opisuj posiłki zwykłym językiem",
            "Kalorie i makroskładniki szacowane za Ciebie",
            "Działa wewnątrz Claude albo ChatGPT, za darmo",
            "Poproś o trendy, podsumowania i cele",
        ],
        noteHtml:
            'Przechodzisz z konkretnej aplikacji? Zobacz, jak Nutrition MCP wypada na tle <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer i innych trackerów</a>.',
    },

    trust: [
        {
            label: "Prywatne domyślnie",
            small: "Twoje dane nigdy nie są sprzedawane, udostępniane stronom trzecim ani używane do reklam.",
        },
        {
            label: "Open source",
            small: "Sprawdź kod albo hostuj samodzielnie.",
        },
        {
            label: "Eksportuj kiedy chcesz",
            small: "Wszystko, co przechowujemy, jako CSV w jednym ZIP-ie.",
        },
        { label: "Usuń natychmiast", small: "Usuń swoje konto i dane." },
    ],

    support: {
        title: "Pomóż utrzymać to w ruchu.",
        sub: "Nutrition MCP jest darmowy i bez reklam. Patreon pokrywa rachunki za serwer i bazę danych.",
        updatesTitle: "Najnowsze na Patreon",
        updatesBadge: "Za darmo",
        updatesNote: "Bezpłatne do czytania — nie trzeba być członkiem.",
        updatesPrevLabel: "Poprzednia aktualizacja",
        updatesNextLabel: "Następna aktualizacja",
        updatesDotLabel: "Aktualizacja",
        postLinkLabel: "Czytaj na Patreon",
        free: {
            tier: "Darmowy członek",
            price: "0 zł",
            desc: "Bądź na bieżąco — otrzymuj wiadomości i aktualizacje o serwerze, nowych narzędziach i tym, co nadchodzi.",
            cta: "Obserwuj na Patreon",
        },
        paid: {
            tier: "Płatny członek",
            price: "Zapłać, ile chcesz",
            desc: "Jeśli Nutrition MCP ci się przydaje, możesz pomóc pokryć koszty hostingu i bazy danych. Wszyscy mają te same funkcje, wspierający też, a całość pozostaje darmowa dla wszystkich.",
            cta: "Zostań wspierającym",
        },
    },

    cta: {
        title: "Zacznij śledzić w mniej niż minutę.",
        sub: "Darmowy i open source — działa z AI, którego już używasz.",
        primary: "Szybka instalacja",
        secondary: "Postaw gwiazdkę na GitHub",
    },

    contact: {
        title: "Pytania albo opinie?",
        sub: "Znalazłeś/aś błąd, chcesz nową funkcję, albo po prostu masz pytanie? Napisz do mnie bezpośrednio — czytam każdą wiadomość.",
        cta: "Wyślij e-mail",
    },

    faqSection: {
        title: "Najczęściej zadawane pytania",
    },
    faq: [
        {
            question: "Czym jest Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP to darmowy serwer Model Context Protocol (MCP) o otwartym kodzie źródłowym, który zamienia Claude, ChatGPT albo innego klienta MCP w licznik kalorii i makroskładników. Zamiast przeszukiwać bazę produktów, mówisz swojemu AI, co zjadłeś/aś, a ono zapisuje kalorie, makroskładniki, błonnik, cukier i kofeinę w Twoim własnym dzienniczku żywieniowym.",
        },
        {
            question: "Czym jest Model Context Protocol (MCP)?",
            visibleHtml:
                "Model Context Protocol to otwarty standard, który pozwala asystentom AI, takim jak Claude i ChatGPT, łączyć się z zewnętrznymi narzędziami i źródłami danych. Serwer MCP udostępnia konkretne możliwości — tutaj śledzenie odżywiania — z których AI może korzystać podczas rozmowy. Można to traktować jak system wtyczek dla asystentów AI.",
        },
        {
            question: "Jak liczyć kalorie z Claude albo ChatGPT?",
            visibleHtml:
                "Połącz Nutrition MCP jeden raz — w Claude z katalogu konektorów, w ChatGPT jako niestandardową aplikację z adresem URL serwera — i zaloguj się. Potem powiedz swojemu AI własnymi słowami, co zjadłeś/aś, pokaż mu zdjęcie posiłku albo podaj kod kreskowy produktu. Twoje AI szacuje kalorie, białko, węglowodany, tłuszcz, błonnik i cukier, a Nutrition MCP zapisuje wpis w Twoim dzienniczku żywieniowym. W każdej chwili możesz zapytać o dzisiejsze sumy, tygodniowe trendy albo postępy w realizacji celów.",
        },
        {
            // Widoczna odpowiedź celowo pomija adres URL serwera (podany już
            // gdzie indziej na stronie); odpowiedź JSON-LD, czytana osobno
            // przez wyszukiwarki, podaje go wprost. Ta rozbieżność istniała
            // już w źródle angielskim — zachowana wiernie, nie ujednolicona.
            question: "Czy działa z ChatGPT?",
            visibleHtml:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz niestandardową aplikację z adresem URL serwera, używając OAuth, i zaloguj się. Utworzenie niestandardowej aplikacji wymaga trybu deweloperskiego (Developer mode) w ChatGPT, który OpenAI udostępnia w niektórych planach ChatGPT.",
            jsonLdText:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps, utwórz niestandardową aplikację z adresem URL serwera https://nutrition-mcp.com/mcp, używając OAuth, i zaloguj się. Utworzenie niestandardowej aplikacji wymaga trybu deweloperskiego (Developer mode) w ChatGPT, który OpenAI udostępnia w niektórych planach ChatGPT.",
        },
        {
            question: "Jakie inne klienty są obsługiwane?",
            visibleHtml:
                "Każdy klient MCP obsługujący OAuth 2.0 z PKCE — w tym Claude.ai, aplikacje Claude na komputer i telefon, Claude Code, Cursor, Windsurf i VS Code.",
        },
        {
            question: "Czy mogę hostować to samodzielnie?",
            visibleHtml:
                'Tak. Nutrition MCP jest open source (licencja MIT). Możesz uruchomić własną instancję z własnym projektem Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repozytorium na GitHub</a> zawiera pełny przewodnik po samodzielnym hostingu i plik Dockerfile.',
        },
        {
            question: "Czy Nutrition MCP jest darmowy?",
            visibleHtml:
                "Tak, jest całkowicie darmowy — bez płatnego planu, bez reklam, bez ukrytych kosztów. Potrzebujesz aplikacji AI obsługującej konektory MCP, takiej jak Claude albo ChatGPT, oraz darmowego konta Nutrition MCP, które zakładasz przy pierwszym połączeniu. Dobrowolne darowizny na Patreon pomagają pokryć koszty serwera i niczego nie odblokowują.",
        },
        {
            question: "Co mogę śledzić?",
            visibleHtml:
                "Kalorie, białko, węglowodany, tłuszcz, błonnik, cukier całkowity i wodę dla każdego wpisu — opisane zwykłym językiem albo pobrane z kodu kreskowego produktu przez Open Food Facts. Kofeina też jest śledzona, w miligramach, jednostce używanej na każdej etykiecie, i nie dodaje kalorii. Alkohol również można śledzić, w gramach czystego etanolu; jest pokazywany, gdy włączysz śledzenie alkoholu. Możesz też zapisywać masę ciała w kg albo lb i śledzić trendy w kierunku wagi docelowej. Zobacz dzienne podsumowania, przeszukuj posiłki po zakresie dat, aktualizuj lub usuwaj wcześniejsze wpisy, ustawiaj cele i monitoruj trendy w czasie.",
        },
        {
            question: "Jak dokładne jest liczenie kalorii?",
            visibleHtml:
                "To szacunki. W przypadku posiłku, który opisujesz albo fotografujesz, wartości szacuje Twoje AI; w przypadku kodu kreskowego pochodzą z danych z etykiety produktu w Open Food Facts, które Twoje AI przelicza na zjedzoną przez Ciebie ilość. Jedno i drugie może być błędne, więc sprawdzaj wszystko, co ma dla Ciebie znaczenie — każdy wpis możesz poprawić albo usunąć, po prostu o to prosząc. Nutrition MCP to narzędzie do zapisywania, a nie porada medyczna ani dietetyczna: zanim podejmiesz decyzje dotyczące zdrowia, porozmawiaj z lekarzem albo dietetykiem, zwłaszcza jeśli jesteś w ciąży, masz problem zdrowotny albo historię zaburzeń odżywiania.",
        },
        {
            question: "Czy śledzi alkohol?",
            visibleHtml:
                "Tak, jako opcja do włączenia: śledzenie alkoholu jest domyślnie wyłączone, a alkohol pozostaje ukryty w Twoich posiłkach, celach i podsumowaniach, dopóki go nie włączysz. Wtedy drinki są pokazywane w gramach czystego etanolu oraz jako standardowe drinki amerykańskie albo jednostki brytyjskie, zależnie od Twojego wyboru. Nic nie zgaduje alkoholu za Ciebie — jest on zapisywany tylko z drinka, którego zapiszesz, albo z kolumny alkoholu w importowanym pliku, a zapisany drink zostaje zachowany nawet wtedy, gdy śledzenie jest wyłączone. Ponowne wyłączenie śledzenia ukrywa alkohol i sprawia, że importer przestaje odczytywać kolumny alkoholu — to nie jest przełącznik usuwania, a Twój eksport zawsze zawiera to, co zapisałeś/aś. Aby usunąć wartość alkoholu, usuń posiłek, do którego należy.",
        },
        {
            question:
                "Czy mogę zaimportować historię z MyFitnessPal albo innej aplikacji?",
            visibleHtml:
                "Tak. Poproś o import swojej historii, a w czacie otworzy się importer: wybierasz CSV wyeksportowany przez Twoją starą aplikację, sprawdzasz, jak mapowane są jego kolumny, i widzisz, co zostanie dodane, zanim potwierdzisz. Eksporty z MyFitnessPal, Cronometer, Lose It! i MacroFactor są rozpoznawane automatycznie, a każdy inny CSV działa dzięki ręcznemu mapowaniu kolumn. Twoja przeglądarka odczytuje plik, więc AI nigdy nie przepisuje Twoich wierszy. W klientach bez paneli w czacie możesz zamiast tego wkleić swój eksport — a ponowny import tego samego pliku nie tworzy duplikatów, o ile w międzyczasie nie zmieniła się Twoja strefa czasowa.",
        },
        {
            question: "Czy moje dane są prywatne?",
            visibleHtml:
                'Twoje wpisy są przechowywane w UE i powiązane z Twoim własnym kontem, do którego masz dostęp przez połączone aplikacje AI. Nutrition MCP nigdy nie sprzedaje Twoich danych, nigdy nie udostępnia ich stronom trzecim i nigdy nie wykorzystuje ich do reklam; strona główna pokazuje tylko anonimowe sumy dla całej witryny. To, co Twoje AI odczyta przez narzędzia, trafia do dostawcy tego AI na podstawie Twojej własnej umowy z nim. W każdej chwili możesz wyeksportować wszystko, co o Tobie przechowujemy, albo usunąć konto i wszystkie jego dane — szczegóły znajdziesz w <a href="/privacy" data-link="privacy">polityce prywatności</a>.',
        },
    ],
};

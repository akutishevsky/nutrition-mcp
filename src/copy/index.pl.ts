// Polskie tłumaczenie strony głównej (6a „Dawn”). Źródłem jest INDEX_EN w
// ./index.ts — ten plik odwzorowuje jego kształt jeden do jednego: te same
// klucze, ta sama liczba wpisów w każdej tablicy, te same znaczniki HTML w
// czterech zaufanych polach (connect.claude.steps, connect.chatgpt.steps,
// connect.other.noteHtml, faq[].visibleHtml) i żadnych w pozostałych.
//
// Uwagi dla polskiej wersji:
//   - Formy „zjadłeś/aś” itp. celowo obejmują oba rodzaje — tak samo jak na
//     /tools i w pozostałej części serwisu.
//   - Nazwy elementów interfejsu Claude i ChatGPT (Customize, Connectors,
//     Settings → Apps…) zostają po angielsku, bo tak wyglądają na ekranie.
//   - Liczby (progi, delty w HeroExchange.add, zegary) są danymi, nie treścią,
//     i są identyczne w każdym języku; w tekście zapisujemy je po polsku
//     (2000, a nie 2,000).

import type { IndexDoc } from "./index.js";

export const INDEX_PL: IndexDoc = {
    title: "Nutrition MCP — Darmowy licznik kalorii i makroskładników dla Claude, ChatGPT i Cursor",
    metaDescription:
        "Śledź kalorie, białko, węglowodany, tłuszcz, błonnik, cukry i kofeinę, rozmawiając ze swoim AI. Nutrition MCP to darmowy, otwartoźródłowy serwer MCP, który działa w Claude, ChatGPT, Cursor i każdym kliencie MCP. Bez instalowania aplikacji.",
    ogDescription:
        "Darmowy, otwartoźródłowy serwer MCP do liczenia kalorii i makroskładników wewnątrz Claude, ChatGPT i Cursor. Powiedz, co zjadłeś/aś — on policzy resztę.",
    keywords:
        "tracker odżywiania, licznik kalorii, tracker makroskładników, serwer MCP, konektor Claude, aplikacja ChatGPT, śledzenie diety AI, dziennik jedzenia, skaner kodów kreskowych, open source, alternatywa dla MyFitnessPal",

    hero: {
        titleBeforeEm: "Śledź swoją dietę, po prostu ",
        titleEm: "rozmawiając",
        titleAfterEm: " ze swoim AI.",
        lead: "Nutrition MCP to darmowy, otwartoźródłowy licznik kalorii i makroskładników, który mieszka wewnątrz Claude, ChatGPT, Cursor — każdego AI obsługującego MCP. Powiedz, co zjadłeś/aś; on wylicza kalorie, białko, węglowodany, tłuszcz, błonnik, cukry i kofeinę, zapisuje to i pokazuje Ci cały dzień. Bez instalowania aplikacji.",
        ctaPrimary: "Połącz się w minutę",
        ctaGithub: "GitHub",
        moreExamples: "Więcej przykładów",
        chat: {
            status: "Nutrition · połączono",
            photoCaption: "📷 Zdjęcie",
            pauseLabel: "Wstrzymaj demo",
            exchanges: [
                {
                    userText: "Owsianka z owocami i flat white na śniadanie",
                    aiText: "Zapisane — około 380 kcal, 14 g białka. Flat white dodaje 130 mg kofeiny.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        fib: 8,
                        caf: 130,
                    },
                    clock: "08:04",
                    meal: {
                        description: "Owsianka z jagodami i flat white",
                        type: "breakfast",
                    },
                },
                {
                    barcode: true,
                    aiText: "To Coca-Cola 330 ml — 139 kcal, 35 g cukru, dane z Open Food Facts. Zapisane jako przekąska.",
                    add: { kcal: 139, car: 35, sugar: 35, fib: 0 },
                    clock: "11:30",
                    meal: {
                        description: "Coca-Cola, 330 ml",
                        type: "snack",
                    },
                },
                {
                    userText: "Pół litra wody",
                    aiText: "Gotowe. Dzisiaj już 500 ml.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "Duża sałatka z grillowanym kurczakiem na obiad",
                    aiText: "Zapisane — około 540 kcal, 46 g białka. Jesteś w połowie dzisiejszych 2000.",
                    add: {
                        kcal: 540,
                        pro: 46,
                        car: 22,
                        fat: 28,
                        sugar: 6,
                        fib: 7,
                    },
                    clock: "13:22",
                    meal: {
                        description: "Duża sałatka z grillowanym kurczakiem",
                        type: "lunch",
                    },
                    widget: true,
                },
                {
                    userText: "Jak mi dzisiaj idzie?",
                    aiText: "Oto dzisiejszy dzień — białko idzie zgodnie z planem, cukier jest blisko limitu.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
        },
    },

    how: {
        eyebrow: "Jak to działa",
        title: "Trzy kroki. Żadnej aplikacji do nauki.",
        sub: "Tak działa śledzenie diety z AI przez serwer MCP: połącz się raz, opisuj swoje posiłki i proś o podsumowania, kiedy tylko chcesz.",
        steps: [
            {
                title: "Połącz się raz",
                body: "Dodaj serwer do Claude, ChatGPT albo dowolnego klienta MCP i zaloguj się przez Google albo e-mail. Zajmuje to mniej niż minutę i nigdy nie robisz tego ponownie.",
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

    connect: {
        eyebrow: "Szybka instalacja",
        title: "Połącz się z Claude, ChatGPT albo Cursor w mniej niż minutę.",
        sub: "Dodaj serwer Nutrition MCP do swojego klienta AI, zaloguj się przez Google albo e-mailem i hasłem i zacznij zapisywać posiłki. Nic do instalowania, nic do nauki.",
        copyLabel: "Kopiuj",
        copiedLabel: "Skopiowano",
        copyAriaLabel: "Kopiuj adres URL serwera",
        bullets: [
            "Działa na każdym planie Claude i ChatGPT",
            "OAuth 2.0 — logowanie obsługuje Twój klient",
            "Połączony w Claude albo ChatGPT, idzie za Tobą na iOS i Androida",
        ],
        otherTabLabel: "Inni klienci",
        tabsLabel: "Wybierz swojego klienta AI",
        claude: {
            steps: [
                "Otwórz <b>Claude</b> (w przeglądarce albo aplikacji) i kliknij <b>Customize</b> w lewym górnym rogu.",
                "Kliknij <b>Connectors</b>.",
                "Kliknij <b>+</b>, a potem <b>Add custom connector</b>.",
                "Nadaj mu nazwę, na przykład <b>Nutrition</b>.",
                "Wklej <code>https://nutrition-mcp.com/mcp</code> w pole <b>Remote MCP server URL</b>.",
                "Kliknij <b>Add</b>.",
                "Kliknij <b>Connect</b> — otworzy się strona logowania; kontynuuj przez Google albo zaloguj się e-mailem i hasłem.",
                "Gotowe. Działa od razu i automatycznie pojawia się w Twoich aplikacjach na iOS i Androida.",
            ],
            note: "Działa na każdym planie Claude. Darmowy plan pozwala na jeden podłączony serwer MCP naraz.",
        },
        chatgpt: {
            steps: [
                "Otwórz <b>ChatGPT w przeglądarce</b> → <b>Settings</b> → <b>Apps</b>.",
                "Kliknij <b>Create app</b> na dole wyskakującego okna. Jeśli go nie widzisz, włącz <b>Developer mode</b> w <b>Advanced settings</b>.",
                "Nadaj mu nazwę, na przykład <b>Nutrition</b>.",
                "W polu <b>Connection</b> wklej <code>https://nutrition-mcp.com/mcp</code>.",
                "W polu <b>Authentication</b> wybierz <b>OAuth</b> — resztę zostaw bez zmian.",
                "Kliknij <b>Create</b>, a potem <b>Sign in with Nutrition</b>.",
            ],
            note: "Działa na każdym planie ChatGPT.",
        },
        other: {
            noteHtml:
                "Dodaj powyższą konfigurację do swojego klienta (Cursor, VS Code, Claude Code i inne). Windsurf używa <code>serverUrl</code> zamiast <code>url</code>. W Claude Code uruchom <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Twój klient obsłuży logowanie OAuth automatycznie.",
        },
    },

    onboarding: {
        title: "Skonfiguruj wszystko w pierwsze pięć minut.",
        sub: "Żadnych ekranów ustawień. Strefa czasowa, cele kaloryczne i makroskładnikowe, język widżetów — każde z nich to jedno zdanie, które mówisz raz.",
        stepLabel: "Krok {n}",
        justSay: "Po prostu powiedz ",
        steps: [
            {
                title: "Ustaw strefę czasową",
                body: "Żeby dni zmieniały się o Twojej lokalnej północy, a nie czyjejś innej.",
                say: "Ustaw moją strefę czasową na Nowy Jork",
            },
            {
                title: "Ustaw swoje cele",
                body: "Dzienne kalorie, makroskładniki i woda, plus opcjonalna waga docelowa.",
                say: "Ustaw mój dzienny cel na 2000 kalorii i 150 g białka",
            },
            {
                title: "Wybierz język widżetów",
                body: "Język, w jakim wyświetlają się widżety w czacie — a nie ten, w którym odpisuje AI.",
                say: "Pokazuj moje widżety po niemiecku",
            },
            {
                title: "Zacznij zapisywać",
                body: "Powiedz, co zjadłeś/aś, wyślij zdjęcie albo zeskanuj kod kreskowy.",
                say: "Zjadłem/am owsiankę z owocami na śniadanie",
            },
        ],
    },

    examples: {
        title: "Rozmowa bije klikanie.",
        sub: "Zapisz posiłek, zeskanuj kod kreskowy, przejrzyj swój tydzień — prawdziwe rozmowy z prawdziwymi widżetami w czacie. Przewiń kilka z nich.",
        status: "Nutrition · połączono",
        prevLabel: "Poprzedni",
        nextLabel: "Następny",
        pickerLabel: "Wybierz przykład",
        carouselLabel: "Przykładowe rozmowy",
        slideLabel: "{n} z {total}",
        carouselRole: "karuzela",
        slideRole: "slajd",
        moreToolsLabel: "Korzysta też z",
        toolLinkLabel: "{tool} na stronie narzędzi",
        photoMealAlt:
            "Zdjęcie: miska barszczu z łyżką śmietany i koperkiem, a obok kromka żytniego chleba",
        photoPackageAlt:
            "Zdjęcie: kod kreskowy na puszce Coca-Coli, numer 5449000000996",
        threadLabel: "Rozmowa",
        importerAlt:
            "Importer w czacie na pierwszym kroku: wybierz plik CSV z eksportem z MyFitnessPal, Cronometer, Lose It! albo MacroFactor",
        importerCaption:
            "Podgląd importera w takiej postaci, w jakiej pojawia się w czacie",
        slides: [
            {
                id: "log-meal",
                title: "Pisz zwykłymi słowami",
                description:
                    "Powiedz to tak, jak znajomemu. Gdy brakuje porcji albo nie wiadomo, który to posiłek, AI dopyta, zanim oszacuje. Błonnik i cukry trafiają do każdego wpisu, kofeina do wszystkiego, co ją zawiera, a „dziś rano” wypada w Twojej strefie czasowej.",
                toolNotes: {
                    log_meal:
                        "Zapisuje śniadanie: makro, błonnik, cukry i kofeina z kawy",
                    log_water:
                        "Dolicza 500 ml z 07:00 do dzisiejszej sumy wody",
                    get_current_time:
                        "Sprawdza datę i godzinę, żeby dobrze umieścić „7 rano”",
                },
                messages: [
                    {
                        from: "user",
                        text: "Miska owsianki z owocami i filiżanka kawy na śniadanie",
                    },
                    {
                        from: "ai",
                        text: "Zapisano śniadanie: około 320 kcal, 11 g białka, 6 g błonnika. Kawa dodała 95 mg kofeiny.",
                    },
                    {
                        from: "user",
                        text: "I 500 ml wody koło 7 rano, po bieganiu",
                    },
                    {
                        from: "ai",
                        text: "Dodano 500 ml wody o 07:00 dziś rano.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 1,
                cardMeals: [
                    "Owsianka z owocami (1 miska) i kawa (1 filiżanka)",
                ],
            },
            {
                id: "photo-meal",
                title: "Zrób zdjęcie talerza",
                description:
                    "Zdjęcie zaczyna wywiad, a nie zgadywanie. AI najpierw ustala, czy to domowe, czy z restauracji, zagląda do Twoich wpisów, potem pyta o porcje i ukryty olej lub sos, jedno pytanie na wiadomość. Zapisuje po akceptacji podsumowania.",
                toolNotes: {
                    log_meal:
                        "Zapisuje dopiero, gdy wszystko jasne i powiesz „tak”",
                    search_meals:
                        "Znajduje wcześniejsze wpisy barszczu, by dopytać, który to",
                },
                messages: [
                    { from: "user", photo: "meal", text: "Obiad" },
                    {
                        from: "ai",
                        text: "Barszcz ze śmietaną i kromka żytniego chleba. Wygląda na domowy, prawda?",
                    },
                    { from: "user", text: "Tak, z przepisu mojej mamy" },
                    {
                        from: "ai",
                        text: "Barszcz zapisywałeś/aś już na dwa sposoby: z wołowiną (~320 kcal za miskę) i bez mięsa (~180). Który to?",
                    },
                    {
                        from: "user",
                        text: "Z wołowiną. Dodałem/am dwie łyżki śmietany",
                    },
                    {
                        from: "ai",
                        text: "Jasne. Zakładając, że miska jest zjedzona do końca: barszcz z wołowiną z 2 łyżkami śmietany i kromka żytniego chleba, około 470 kcal, 24 g białka. Zapisać jako obiad?",
                    },
                    { from: "user", text: "Tak" },
                    {
                        from: "ai",
                        text: "Zapisano obiad: 470 kcal · 24 g białka · 43 g węglowodanów · 22 g tłuszczu · 7 g błonnika · 10 g cukru.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 7,
                cardMeals: [
                    "Barszcz z wołowiną (1 miska) ze śmietaną (2 łyżki) i chlebem żytnim (1 kromka)",
                ],
            },
            {
                id: "scan-barcode",
                title: "Zeskanuj kod kreskowy",
                description:
                    "Zrób zdjęcie opakowania: cyfry spod kodu kreskowego są wyszukiwane w Open Food Facts, a AI pyta o ilość. Kofeina, której Open Food Facts nie podaje, pochodzi od producenta albo z wyszukiwania w sieci; brakujący błonnik czy cukry są szacowane.",
                toolNotes: {
                    lookup_barcode:
                        "Pobiera dane z etykiety puszki z Open Food Facts",
                    log_meal: "Zapisuje całą puszkę do obiadu, razem z kofeiną",
                },
                messages: [
                    {
                        from: "user",
                        photo: "package",
                        text: "To było do obiadu",
                    },
                    {
                        from: "ai",
                        text: "To Coca-Cola 330 ml: 139 kcal i 35 g cukru, dane z Open Food Facts. Wypiłeś/aś całą puszkę?",
                    },
                    { from: "user", text: "Całą" },
                    {
                        from: "ai",
                        text: "Zapisano do obiadu: 139 kcal i 35 g cukru. Open Food Facts nie podaje kofeiny, więc przyjęto wartość od samej Coca-Coli: około 32 mg na puszkę.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 3,
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
                        text: "Ustaw moje cele: 2000 kcal, 160 g białka i limit kofeiny. Jaki limit będzie rozsądny?",
                    },
                    {
                        from: "ai",
                        text: "Częstym punktem odniesienia jest górna granica EFSA i FDA dla zdrowych dorosłych: 400 mg dziennie, czyli mniej więcej cztery filiżanki parzonej kawy. Przyjąć tę wartość?",
                    },
                    { from: "user", text: "Tak, 400" },
                    {
                        from: "ai",
                        text: "Cele zaktualizowane: 2000 kcal i 160 g białka do osiągnięcia, kofeina poniżej 400 mg.",
                    },
                    {
                        from: "user",
                        text: "Zmieszczę jeszcze wieczorem deser?",
                    },
                    {
                        from: "ai",
                        text: "Masz już 1540 kcal i 104 g białka: do celów brakuje jeszcze 460 kcal i 56 g białka. Więc tak, deser o wartości około 200 kcal się zmieści, o ile reszta to głównie białko.",
                    },
                ],
                widget: "goal-progress",
                widgetAfter: 5,
                cardMeals: [
                    "Jogurt grecki z granolą i owocami (1 miska)",
                    "Wrap z kurczakiem i sałatą (1 wrap)",
                    "Flat white (1 filiżanka)",
                    "Łosoś z ryżem i brokułami (1 talerz)",
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
                    { from: "user", text: "Jak minęły ostatnie dwa tygodnie?" },
                    {
                        from: "ai",
                        text: "Średnio 1830 kcal dziennie przez ostatnie 14 dni (13 z nich z wpisami), 170 poniżej celu. Białko było Twoim najstabilniejszym makroskładnikiem.",
                    },
                ],
                widget: "trends",
                widgetAfter: 1,
            },
            {
                id: "weight-trend",
                title: "Śledź swoją wagę",
                description:
                    "Zapisz pomiar wagi w kg albo lb i zobacz trend spod codziennych wahań: wygładzoną średnią, zmianę w ciągu miesiąca i to, ile zostało do wagi docelowej. Niemożliwy odczyt, np. gramy wpisane jako kilogramy, zostaje wyłapany przed zapisem.",
                toolNotes: {
                    log_weight:
                        "Zapisuje 78,4 kg i odrzuca fizycznie niemożliwy odczyt",
                    get_weight_trends:
                        "Wygładza 30 dni w średnie kroczące i liczy dystans do celu",
                },
                messages: [
                    {
                        from: "user",
                        text: "Właśnie się zważyłem/am: 78,4 kg. Jaki jest trend?",
                    },
                    {
                        from: "ai",
                        text: "Zapisano 78,4 kg. W ciągu ostatnich 30 dni ubyło Ci 1,8 kg, a średnia z 7 dni to 78,7 kg. Do celu 75 kg zostało 3,4 kg.",
                    },
                ],
                widget: "weight-trends",
                widgetAfter: 1,
            },
            {
                id: "meal-patterns",
                title: "Odkryj swoje nawyki",
                description:
                    "Zapytaj, kiedy jesz więcej, a AI porówna Twoje własne wpisy: dni robocze z weekendami, dni ze śniadaniem i bez, duże obiady, wczesne kolacje z późnymi. Wskaże też nietypowe dni i opisze wzorce, nie przyczyny.",
                toolNotes: {
                    get_meal_patterns:
                        "Porównuje dni robocze, weekendy i pory kolacji z 30 dni",
                },
                messages: [
                    { from: "user", text: "Czy w weekendy jem więcej?" },
                    {
                        from: "ai",
                        text: "Raczej nie. W ciągu ostatnich 30 dni średnia w dni robocze to 1986 kcal, a w weekendy 1977.",
                    },
                    {
                        from: "user",
                        text: "A czy coś w ogóle robi różnicę?",
                    },
                    {
                        from: "ai",
                        text: "Pora kolacji. W dni z kolacją o 20:00 lub później średnia wynosi 2150 kcal, a przy wcześniejszej kolacji 1915.",
                    },
                ],
            },
            {
                id: "track-drinks",
                title: "Śledź też alkohol",
                description:
                    "Alkohol śledzisz tylko wtedy, gdy o to poprosisz. Wybierz standardowe drinki amerykańskie albo jednostki brytyjskie, a każdy napój zostanie przeliczony na gramy alkoholu według objętości i mocy. Po wyłączeniu dane są ukryte, a nie usunięte.",
                toolNotes: {
                    set_alcohol_tracking:
                        "Włącza alkohol, w gramach obok jednostek brytyjskich",
                    log_meal:
                        "Przelicza alkohol w pincie według objętości i mocy",
                },
                messages: [
                    {
                        from: "user",
                        text: "Chcę też śledzić, ile piję alkoholu",
                    },
                    {
                        from: "ai",
                        text: "Jasne. Liczyć w standardowych drinkach amerykańskich czy w jednostkach brytyjskich?",
                    },
                    { from: "user", text: "W jednostkach brytyjskich" },
                    {
                        from: "ai",
                        text: "Śledzenie alkoholu włączone, w gramach i jednostkach brytyjskich. Działa od następnej wiadomości, bez zakładania nowego czatu.",
                    },
                    {
                        from: "user",
                        text: "Do kolacji wypiłem/am pintę lagera 4%",
                    },
                    {
                        from: "ai",
                        text: "Zapisano do kolacji: pinta 568 ml o mocy 4% to 17,9 g alkoholu, 2,3 jednostki brytyjskiej, około 180 kcal.",
                    },
                ],
                widget: "meal-logged",
                widgetAfter: 5,
                cardMeals: ["Lager, 4% (1 pinta, 568 ml)"],
            },
            {
                id: "import-history",
                title: "Przenieś swoją historię",
                description:
                    "Przechodzisz z MyFitnessPal, Cronometer, Lose It! albo MacroFactor? AI najpierw sprawdza strefę czasową, eksport jest mapowany w przeglądarce, nic nie zostaje zapisane przed potwierdzeniem podglądu, a ponowny import pliku nigdy nie dubluje posiłków.",
                toolNotes: {
                    start_meal_import:
                        "Otwiera importer w czacie dla Twojego pliku eksportu",
                    get_profile:
                        "Zauważa, że strefa czasowa nie jest jeszcze ustawiona",
                    set_timezone:
                        "Ustawia America/Chicago, by importy trafiły na właściwy dzień",
                },
                messages: [
                    {
                        from: "user",
                        text: "Możesz przenieść moją historię z MyFitnessPal?",
                    },
                    {
                        from: "ai",
                        text: "Jasne. Najpierw: nie masz ustawionej strefy czasowej, więc zaimportowane godziny zostałyby odczytane jako UTC. Gdzie mieszkasz?",
                    },
                    { from: "user", text: "W Chicago" },
                    {
                        from: "ai",
                        text: "Strefa czasowa ustawiona na America/Chicago. Teraz wybierz plik eksportu w importerze poniżej. Jest odczytywany w Twojej przeglądarce i nic nie zostanie zapisane, dopóki nie potwierdzisz podglądu.",
                    },
                ],
                widget: "import-meals",
                widgetAfter: 3,
            },
            {
                id: "export-data",
                title: "Zabierz swoje dane",
                description:
                    "Jedna prośba pakuje wszystkie posiłki, wpisy wody i pomiary wagi, a do tego cele i ustawienia, w ZIP z plikami CSV i prostym README po angielsku. Każdy znacznik czasu podaje swoją strefę, a meals.csv importuje się prosto z powrotem.",
                toolNotes: {
                    export_all_data:
                        "Pakuje sześć plików i daje prywatny link ważny 60 minut",
                },
                messages: [
                    {
                        from: "user",
                        text: "Zrób kopię zapasową wszystkich moich danych",
                    },
                    {
                        from: "ai",
                        text: "Gotowe: jeden ZIP z 1204 posiłkami, 318 wpisami wody, 64 pomiarami wagi, Twoimi celami i ustawieniami profilu. Oto link do pobrania. Działa przez 60 minut.",
                    },
                    {
                        from: "user",
                        text: "Czy później mogę z niego wszystko przywrócić?",
                    },
                    {
                        from: "ai",
                        text: "Posiłki tak. meals.csv importuje się prosto z powrotem, a każdy posiłek, który nadal masz, zostaje rozpoznany po id i pominięty, więc nic się nie dubluje. Woda, waga, cele i ustawienia są tylko do eksportu, więc zachowaj ZIP.",
                    },
                ],
            },
        ],
    },

    live: {
        eyebrow: "Na żywo · wszyscy, jak dotąd",
        title: "Gdzieś śniadanie, gdzie indziej kolacja.",
        sub: "Statystyki odżywiania na żywo ze wszystkich kont Nutrition MCP — kalorie, wpisy jedzenia, makroskładniki i zrzucona waga — odświeżane co pięć sekund.",
        unitGroupLabel: "Jednostki",
        unitMetricLabel: "Metryczne",
        unitImperialLabel: "Imperialne",
        refreshBefore: "Odświeżanie co 5 s · następne za ",
        refreshAfter: " s",
        sinceOpenLabel: "od otwarcia tej strony",
        cards: {
            calories: "Zapisane kalorie",
            foodLogs: "Wpisy jedzenia",
            protein: "Zapisane białko",
            carbs: "Zapisane węglowodany",
            fat: "Zapisany tłuszcz",
            weightLost: "Waga zrzucona od 2 lipca 2026",
            water: "Zapisana woda",
        },
        foodLogsUnit: "wpisów",
        timezonesAfter:
            " stref czasowych · dni zmieniają się o lokalnej północy każdej osoby",
        mapNote: "wielkość kropki = udział kont · najedź na kropkę",
        mapShare: "{share} kont",
        mapAriaLabel:
            "Mapa świata z kropek pokazująca konta Nutrition MCP według stref czasowych; większa kropka oznacza większy udział",
    },

    support: {
        eyebrow: "Zawsze za darmo",
        title: "Darmowe śledzenie diety. Bez wersji premium. Nigdy.",
        sub: "Każde narzędzie, każdy widżet, każdy eksport — dla wszystkich, bez opłat. To otwartoźródłowy projekt jednej osoby, a kod jest na licencji MIT, więc tak już zostanie.",
        bullets: [
            "Wszystkie 36 narzędzi i sześć widżetów w zestawie",
            "Bez reklam, dosprzedaży i zablokowanych funkcji",
            "Eksportuj albo usuń swoje dane w każdej chwili",
            "Hostuj samodzielnie, jeśli wolisz — Dockerfile w komplecie",
        ],
        patreon: {
            eyebrow: "Opcjonalnie · Patreon",
            title: "Jeśli się przydaje, pomóż utrzymać serwer przy życiu.",
            sub: "Jedyny koszt to hosting i baza danych. Pokrywają go patroni — dowolna kwota, rezygnacja w każdej chwili. Nic się nie odblokowuje; po prostu dostajesz notatki z budowy jako pierwszy/a i masz głos w tym, co powstanie następne.",
            cta: "Wesprzyj na Patreon",
            starCta: "Albo daj gwiazdkę",
        },
        postsTitle: "Najnowsze wpisy na Patreon",
        postsAll: "Wszystkie wpisy",
        postLinkLabel: "Czytaj na Patreon",
    },

    contact: {
        eyebrow: "Kontakt",
        title: "Napisz do mnie.",
        sub: "Znalazłeś/aś błąd, masz pomysł albo AI zupełnie pomyliło się przy jakimś posiłku? Napisz do mnie bezpośrednio — czytam każdą wiadomość.",
        emailAriaLabel: "Napisz e-mail na anton@nutrition-mcp.com",
        cards: {
            email: { title: "E-mail", sub: "Cokolwiek — bezpośrednia linia" },
            issues: {
                title: "Zgłoszenia na GitHub",
                sub: "Błędy i propozycje funkcji, publicznie",
            },
            patreon: {
                title: "Patreon",
                sub: "Notatki z budowy, głosowania i czat patronów",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Pytania o Nutrition MCP.",
        subBefore:
            "Czym jest, gdzie działa, ile kosztuje i kto widzi Twoje dane. Czegoś brakuje? ",
        subLink: "Zapytaj mnie bezpośrednio",
        subAfter: ".",
        categoriesLabel: "Filtruj pytania według kategorii",
        categories: {
            all: "Wszystkie",
            basics: "Podstawy",
            clients: "Klienty",
            tracking: "Śledzenie",
            data: "Twoje dane",
        },
    },
    faq: [
        // Podstawy
        {
            question: "Czym jest Nutrition MCP?",
            visibleHtml:
                "Darmowy, otwartoźródłowy serwer MCP (Model Context Protocol) do śledzenia odżywiania. Podłącz go do Claude, ChatGPT, Cursor albo dowolnego klienta MCP i zapisuj posiłki, kalorie, makroskładniki, wodę i wagę, po prostu rozmawiając.",
            category: "basics",
        },
        {
            question: "Czym jest serwer MCP?",
            visibleHtml:
                "Mała usługa, którą Twoje AI może wywoływać w trakcie rozmowy. Nutrition MCP daje Claude, ChatGPT, Cursor i innym 36 narzędzi do odżywiania — zapisywanie, cele, trendy, import i eksport. Nigdy nie widzisz tych narzędzi; po prostu rozmawiasz.",
            category: "basics",
        },
        {
            question: "Czy Nutrition MCP jest darmowy?",
            visibleHtml:
                "Tak. Bez wersji premium, reklam i zablokowanych funkcji. Potrzebujesz tylko konta Claude albo ChatGPT, żeby się połączyć. Darowizny na Patreon pokrywają rachunek za serwer.",
            category: "basics",
        },
        // Klienty
        {
            // Widoczna odpowiedź podaje teraz adres URL serwera wprost, więc
            // nadpisanie jsonLdText, które nosiła stara strona, nie jest już
            // potrzebne — usunięcie tagów daje to samo zdanie.
            question: "Czy działa z ChatGPT?",
            visibleHtml:
                "Tak. W ChatGPT w przeglądarce otwórz Settings → Apps → Create app, wklej <code>https://nutrition-mcp.com/mcp</code> z uwierzytelnianiem OAuth i zaloguj się. Działa na każdym planie ChatGPT.",
            category: "clients",
        },
        {
            question: "Czy działa z Cursor, VS Code albo Claude Code?",
            visibleHtml:
                "Tak — z każdym klientem, który obsługuje zdalne serwery MCP przez HTTP. Dodaj adres URL do swojego <code>mcp.json</code> albo w Claude Code uruchom <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "Czy działa na moim telefonie?",
            visibleHtml:
                "Tak. Połącz go raz w Claude albo ChatGPT w przeglądarce lub na komputerze, a automatycznie pojawi się w ich aplikacjach na iOS i Androida.",
            category: "clients",
        },
        // Śledzenie
        {
            // Przeniesione dosłownie z poprzedniej strony głównej:
            // src/site-copy.test.ts sprawdza, że kofeina jest tu nazwana
            // „w miligramach” i że odpowiedź JSON-LD się zgadza.
            question: "Co mogę śledzić?",
            visibleHtml:
                "Kalorie, białko, węglowodany, tłuszcz, błonnik, cukry ogółem i wodę dla każdego wpisu — opisane zwykłym językiem albo pobrane z kodu kreskowego produktu przez Open Food Facts. Kofeina też jest śledzona, w miligramach, jednostce używanej na każdej etykiecie, i nie dodaje kalorii. Alkohol również jest śledzony, w gramach czystego etanolu, gdy go włączysz. Możesz też zapisywać masę ciała w kg albo lb i śledzić trendy w kierunku wagi docelowej. Zobacz dzienne podsumowania, przeszukuj posiłki po zakresie dat, aktualizuj lub usuwaj wcześniejsze wpisy, ustawiaj cele i monitoruj trendy w czasie.",
            category: "tracking",
        },
        {
            question: "Jak dokładne jest liczenie kalorii?",
            visibleHtml:
                "Wartości to szacunki na podstawie tego, co opiszesz — takie, jakie podałby znający się na rzeczy znajomy — dobre do obserwowania trendów, nie do decyzji medycznych. Skany kodów kreskowych korzystają z danych Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Czy śledzi alkohol?",
            visibleHtml:
                "Tylko jeśli to włączysz. Śledzenie alkoholu jest domyślnie wyłączone; po włączeniu drinki są zapisywane w gramach etanolu i pokazywane jako standardowe drinki amerykańskie albo jednostki brytyjskie.",
            category: "tracking",
        },
        // Twoje dane
        {
            // Ostatnie zdanie pilnuje src/site-copy.test.ts: eksport zabiera
            // wszystko, ale z powrotem wracają tylko posiłki.
            question:
                "Czy mogę zaimportować historię z MyFitnessPal albo Cronometer?",
            visibleHtml:
                "Tak. Importuj historię posiłków z MyFitnessPal, Cronometer, Lose It!, MacroFactor albo dowolnego CSV, mapując jego kolumny — do 50 wierszy na wywołanie. Na razie tylko posiłki można zaimportować z powrotem.",
            category: "data",
        },
        {
            // Musi wymieniać posiłki, wodę, wagę, cele i profil — pięć plików
            // w archiwum eksportu (src/site-copy.test.ts).
            question: "Kto widzi moje dane i czy mogę je wyeksportować?",
            visibleHtml:
                "Tylko Ty. Wyeksportuj wszystko — posiłki, wodę, wagę, cele, profil — jako ZIP z plikami CSV i 60-minutowym linkiem do pobrania albo po prostu usuń swoje konto. Licencja MIT, więc możesz też hostować samodzielnie.",
            category: "data",
        },
        {
            // Przeniesione z poprzedniej strony głównej.
            question: "Czy mogę hostować to samodzielnie?",
            visibleHtml:
                'Tak. Nutrition MCP jest open source (licencja MIT). Możesz uruchomić własną instancję z własnym projektem Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">repozytorium na GitHub</a> zawiera pełny przewodnik po samodzielnym hostingu i plik Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Twój następny posiłek to jedno zdanie.",
        sub: "Darmowe, otwartoźródłowe śledzenie diety dla Claude, ChatGPT i Cursor — a Twoje dane są Twoje: eksportuj je albo usuń, kiedy tylko chcesz.",
        primary: "Połącz teraz",
        secondary: "Gwiazdka na GitHub",
    },
};

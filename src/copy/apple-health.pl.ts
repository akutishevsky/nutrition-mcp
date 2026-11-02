import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_PL: AppleHealthDoc = {
    meta: {
        title: "Skróty Apple Health",
        description:
            "Dwa darmowe skróty w iPhone łączą Nutrition MCP z Apple Health: Nutrition MCP Health kopiuje do Apple Health sumy dzienne, które zapisujesz z pomocą AI (kalorie, białko, węglowodany, tłuszcz, błonnik, kofeinę i opcjonalnie wodę), a Nutrition MCP Activity przenosi Twoją dzienną Aktywną energię z powrotem jako aktywne kalorie.",
        ogDescription:
            "Sumy dzienne do Apple Health, Aktywna energia z powrotem do Nutrition MCP: dwa darmowe skróty w iPhone, używaj jednego lub obu.",
    },
    tocLabel: "Na tej stronie",
    hero: {
        eyebrow: "Apple Health · iPhone",
        title: "Nutrition MCP i Apple Health, w obie strony",
        lead: "Dwa darmowe skróty w iPhone, po jednym na każdy kierunek. Jeden kopiuje to, co jesz, do Apple Health, a drugi przenosi spalaną energię z powrotem do Nutrition MCP. Używaj jednego lub obu: łączą się, synchronizują i rozłączają niezależnie.",
        health: {
            flow: "Nutrition MCP → Apple Health",
            title: "Twoje sumy dzienne w Apple Health",
            items: [
                "Jeden wpis na składnik dla każdego zakończonego dnia, o <strong>12:00</strong>, ze źródłem <strong>Skróty</strong>.",
                "Dzień kończy się o <strong>05:00</strong> następnego ranka w Twojej strefie czasowej, więc wczorajszy dzień trafia tam po 05:00 dzisiaj. Dzisiejszego dnia nigdy tam nie ma.",
            ],
        },
        activity: {
            flow: "Apple Health → Nutrition MCP",
            title: "Twoja Aktywna energia jako aktywne kalorie",
            items: [
                "Suma <strong>Aktywnej energii</strong> za dzisiaj i 2 dni wcześniej, pokazana obok tego, co zjadłeś. Twój cel kaloryczny nigdy się nie zmienia.",
                "Jeden wpis na dzień, zastępowany przy każdej synchronizacji, więc częste synchronizacje nigdy nie liczą dnia dwa razy.",
            ],
        },
        nutrientsLabel: "Wysyłane codziennie",
        nutrients: {
            energy_kcal: "Energia z pożywienia",
            protein_g: "Białko",
            carbohydrates_g: "Węglowodany",
            fat_g: "Tłuszcze ogółem",
            fiber_g: "Błonnik",
            caffeine_mg: "Kofeina",
            water_ml: "Woda",
        },
        waterNote: "jeśli tak wybierzesz",
        alcoholNote: "Alkohol nigdy nie jest wysyłany.",
        readLabel: "Odczytywane przy każdej synchronizacji",
        activeEnergy: "Aktywna energia",
    },
    before: {
        title: "Zanim zaczniesz",
        items: [
            "Telefon iPhone z aplikacjami <strong>Skróty</strong> i <strong>Zdrowie</strong>. Obie są częścią systemu iOS.",
            "Konto Nutrition MCP, które jest już połączone z Twoją aplikacją AI, np. Claude lub ChatGPT. Oba skróty logują się na to samo konto.",
            "Zalecane: strefa czasowa w Twoim profilu, bo to ona decyduje, gdzie kończy się dzień. Wystarczy napisać w czacie <em>&bdquo;ustaw moją strefę czasową&rdquo;</em>. Jeśli nigdy jej nie ustawiono, używana jest strefa czasowa, którą telefon iPhone zgłosi przy łączeniu.",
        ],
    },
    install: {
        title: "Zainstaluj skróty",
        lead: "Zainstaluj jeden lub oba. Otwórz link w telefonie iPhone i stuknij <strong>Dodaj skrót</strong>; skrót pojawi się w aplikacji Skróty pod własną nazwą.",
        button: "Pobierz skrót",
        pending: "Link do skrótu wkrótce pojawi się w tym miejscu.",
        leadPending:
            "Skróty nie zostały jeszcze opublikowane. Gdy będą dostępne, otworzysz ich link w telefonie iPhone i stukniesz <strong>Dodaj skrót</strong>; skrót pojawi się w aplikacji Skróty pod własną nazwą. Poniższe kroki opisują, co dzieje się dalej.",
        healthBlurb: "Wysyła Twoje sumy dzienne do Apple Health.",
        activityBlurb: "Odczytuje Twoją Aktywną energię z Apple Health.",
        nameNote:
            "Zachowaj dokładne nazwy <strong>Nutrition MCP Health</strong> i <strong>Nutrition MCP Activity</strong>. Strona logowania ponownie otwiera każdy skrót po jego nazwie, więc po zmianie nazwy łączenie zatrzyma się w połowie.",
    },
    connect: {
        title: "Połącz je",
        steps: [
            "W aplikacji Skróty stuknij skrót, aby go uruchomić.",
            "Odpowiedz na jego pytania (poniżej), a Safari otworzy stronę logowania. Zaloguj się na <strong>to samo konto, którego używa Twoja aplikacja AI</strong>. Strona pokaże komunikat o łączeniu Apple Health: kontynuuj tylko wtedy, gdy sam przed chwilą uruchomiłeś łączenie ze skrótu na własnym iPhone.",
            "Gdy Safari zapyta, czy otworzyć aplikację Skróty, stuknij <strong>Otwórz</strong>. Skrót dokończy łączenie.",
        ],
        health: {
            label: "Nutrition MCP Health pyta o",
            items: [
                "Czy wysyłać także <strong>wodę</strong> (pomiń ją, jeśli Apple Watch lub inna aplikacja już zapisuje wodę) i które dni wysłać: <strong>From today</strong> (od dzisiaj) czy <strong>Also the last 7 days</strong> (także 7 ostatnich dni).",
                "Przy pierwszym wysłaniu dnia Apple Health pyta, co aplikacja Skróty może zapisywać: włącz <strong>każdy typ</strong> i stuknij <strong>Pozwól</strong>. Jeśli wybrano <strong>Also the last 7 days</strong> i w tych dniach są zapisane posiłki, stanie się to od razu. W przeciwnym razie nie ma jeszcze czego wysłać, więc jutro po 05:00 otwórz skrót i raz stuknij <strong>Sync now</strong>, aby odpowiedzieć na to pytanie.",
            ],
        },
        activity: {
            label: "Nutrition MCP Activity pyta o",
            items: [
                "Nic przed logowaniem, poza krótkim komunikatem o tym, co skrót odczytuje. Jego pierwsza synchronizacja rusza zaraz po połączeniu.",
                "Apple Health pyta, czy aplikacja Skróty może odczytywać <strong>Aktywną energię</strong>: stuknij <strong>Pozwól</strong>. Potem iOS pyta, czy skrót może wysyłać próbki zdrowotne do nutrition-mcp.com: wybierz <strong>Pozwól zawsze</strong>, bo inaczej każde automatyczne uruchomienie zatrzyma się na tym pytaniu.",
            ],
        },
        note: "Każdy link do logowania działa tylko raz, przez 30 minut. Jeśli wygaśnie, uruchom skrót ponownie. Połącz oba skróty jeden po drugim, nie równocześnie. W przypadku Nutrition MCP Health pierwszy zakończony dzień trafi do Apple Health jutro po 05:00; jeśli wybrano 7 ostatnich dni, zostaną one wysłane od razu.",
    },
    automate: {
        title: "Ustaw automatyczne działanie",
        lead: "Udostępniony skrót nie może przenieść ze sobą automatyzacji, więc utwórz je raz na karcie <strong>Automatyzacja</strong> w aplikacji Skróty, dla każdego skrótu, którego używasz. Najważniejszy jest pierwszy wyzwalacz każdego z nich; pozostałe nadrabiają zaległości.",
        healthLabel: "Nutrition MCP Health",
        healthTriggers: [
            {
                when: "Aplikacja → Zdrowie → Jest otwarta",
                tag: "Główna",
                body: "Otwierając aplikację Zdrowie, chcesz mieć w niej aktualne dane — to idealny moment.",
            },
            {
                when: "Budzik → Jest zatrzymany",
                tag: "Poranne nadrabianie",
                body: "Budzik wyłączony po 05:00, na przykład poranny, wysyła wczorajszy dzień od razu.",
            },
            {
                when: "Ładowarka → Jest podłączona",
                tag: "Opcjonalna",
                body: "Podłączenie telefonu do ładowania w nocy lub przy biurku to jeszcze jedna okazja do synchronizacji.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityTriggers: [
            {
                when: "Aplikacja → Claude lub ChatGPT → Jest otwarta",
                tag: "Główna",
                body: "Otwierasz aplikację AI, zanim zapytasz, jak idzie Twój dzień, więc dzisiejsze spalanie jest już aktualne.",
            },
            {
                when: "Aplikacja → Zdrowie lub Fitness → Jest otwarta",
                tag: "Także",
                body: "Sprawdzanie pierścieni aktywności lub treningów to kolejna okazja do synchronizacji.",
            },
            {
                when: "Pora dnia",
                tag: "Przez cały dzień",
                body: "Nie ma wyzwalacza &bdquo;co godzinę&rdquo;, więc dodaj kilka, na przykład o 12:00, 18:00 i 22:00, aby złapać dni, w których nie otworzysz żadnej z tych aplikacji.",
            },
        ],
        stepsLabel: "Dla każdego z nich",
        steps: [
            "W aplikacji Skróty otwórz kartę <strong>Automatyzacja</strong> i stuknij <strong>+</strong>, aby utworzyć automatyzację osobistą.",
            "Wybierz wyzwalacz, na przykład <strong>Aplikacja</strong> → <strong>Zdrowie</strong> → <strong>Jest otwarta</strong>.",
            "Wybierz <strong>Uruchom natychmiast</strong> i wyłącz <strong>Powiadamiaj po uruchomieniu</strong>, jeśli telefon iPhone daje taką opcję.",
            "Dodaj czynność <strong>Uruchom skrót</strong>, wybierz <strong>Nutrition MCP Health</strong> lub <strong>Nutrition MCP Activity</strong> i ustaw jako dane wejściowe tekst <code>auto</code>.",
        ],
        note: "Dane wejściowe <code>auto</code> sprawiają, że automatyczne uruchomienia działają po cichu: powiadamiają tylko wtedy, gdy coś wymaga Twojej uwagi. Konkretna godzina nie jest potrzebna: Nutrition MCP Health przy każdej synchronizacji sięga 7 ostatnich zakończonych dni, a Nutrition MCP Activity ponownie wysyła dzisiejszy dzień i 2 dni wcześniej, więc pominięte uruchomienie nadrabia się samo.",
    },
    everyday: {
        title: "Na co dzień",
        healthLabel: "Nutrition MCP Health",
        healthCards: [
            {
                title: "Brakuje jakiegoś posiłku?",
                body: "Dodaj to w czacie jak zwykle. Jeśli ten dzień został już wysłany i mieści się w 7 ostatnich dniach, następna synchronizacja uzupełni go małym dodatkowym wpisem o 12:01, 12:02 i tak dalej. Zmiany mniejsze niż około 20 kcal lub 2 g są pomijane, a bardzo duży skok albo zmiana po 9 uzupełnieniach przychodzi jako powiadomienie, aby wpisać ją ręcznie.",
            },
            {
                title: "Posiłek usunięty lub zmniejszony?",
                body: "Apple Health może dodać coś do wartości, ale nie może jej obniżyć, więc dostaniesz powiadomienie z informacją, o ile za dużo jest teraz w tym dniu. Aby to poprawić, otwórz Zdrowie → <strong>Przeglądaj</strong> → <strong>Odżywianie</strong>, wybierz typ, stuknij <strong>Pokaż wszystkie dane</strong> i przesuń w lewo wpisy z tego dnia pochodzące z aplikacji Skróty, aby je usunąć, a potem ręcznie wpisz poprawną sumę podaną w powiadomieniu. Nigdy nie używaj opcji <strong>Usuń wszystkie dane z „Skróty”</strong>: usuwa ona także to, co zapisały Twoje inne skróty.",
            },
            {
                title: "Uruchom go ręcznie",
                body: "Stuknij <strong>Nutrition MCP Health</strong> w aplikacji Skróty, aby otworzyć jego menu: <strong>Sync now</strong> wysyła wszystko, co czeka, <strong>Status</strong> pokazuje ostatni wysłany dzień i to, kiedy będzie gotowy następny, a <strong>Disconnect</strong> kończy połączenie.",
            },
            {
                title: "Sprawdź w aplikacji AI",
                body: "Poproś AI o pokazanie profilu (<code>get_profile</code>): dowiesz się, kiedy połączono każdy skrót, do którego dnia Nutrition MCP Health wysłała dane i kiedy każdy z nich ostatnio działał.",
            },
        ],
        activityLabel: "Nutrition MCP Activity",
        activityCards: [
            {
                title: "Duże liczby kalorii, gdy pyta o wysłanie?",
                body: "Nie martw się nimi. Pytanie, które iOS pokazuje przed wysłaniem, wymienia surowe dzienne sumy z Health, ze wszystkimi miejscami po przecinku i w formacie liczb Twojego regionu, więc <strong>922,774 kcal</strong> to po prostu nieco mniej niż 923 kcal. Skrót zaokrągla każdy dzień do pełnych kilokalorii, zanim cokolwiek wyśle, a wpisy <strong>0 kcal</strong>, które również są na liście, nic nie dodają.",
            },
            {
                title: "Trening zapisany też w czacie?",
                body: "W dniu, który skrót już wysłał, liczy się suma z Apple Health, a treningi zapisane w czacie zostają w dzienniku bez dodawania na wierzch: Aktywna energia z zegarka już je uwzględnia. W pozostałe dni liczą się normalnie.",
            },
            {
                title: "Dzień, który pokazuje 0?",
                body: "Dzień bez Aktywnej energii albo taki, którego Apple Health nie pozwoliło skrótowi odczytać, nie wysyła niczego i niczego nie zmienia. Jeśli każdy dzień zostaje na 0, zezwól aplikacji Skróty na odczyt Aktywnej energii w Zdrowie → <strong>Udostępnianie</strong> → <strong>Aplikacje</strong> → <strong>Skróty</strong>.",
            },
            {
                title: "Uruchom go ręcznie",
                body: "Stuknij <strong>Nutrition MCP Activity</strong> w aplikacji Skróty, aby otworzyć jego menu: <strong>Sync now</strong> wysyła dzisiejszy dzień i 2 dni wcześniej, <strong>Status</strong> pokazuje ostatni wysłany dzień, a <strong>Disconnect</strong> kończy jego połączenie i zostawia połączony skrót Nutrition MCP Health.",
            },
        ],
    },
    privacy: {
        title: "Prywatność i ograniczenia",
        items: [
            "Nutrition MCP Health: nasz serwer przechowuje połączenie oraz, przez 8 dni, zapis wysłanych sum, aby każdy dzień był wysyłany raz, a potem tylko uzupełniany. Nic nie wysyłamy do Apple; skrót pyta nasz serwer o Twoje sumy i zapisuje je w Zdrowiu w Twoim iPhone, gdzie obowiązują Twoje własne ustawienia Apple.",
            "Nutrition MCP Activity odczytuje tylko dzienną sumę <strong>Aktywnej energii</strong>, niczego więcej z Apple Health. Nasz serwer zapisuje te sumy jako Twoje aktywne kalorie, w eksporcie danych i usuwane wraz z kontem, tak jak te, które zapisujesz w czacie.",
            "Każdy skrót przechowuje własny token dostępu we własnej pamięci w aplikacji Skróty w iPhone, a nie w pliku, a aplikacja Skróty może synchronizować go z innymi Twoimi urządzeniami przez iCloud. Każdy, kto może uruchomić skrót na Twoich urządzeniach, może korzystać z jego synchronizacji, dopóki nie rozłączysz, więc trzymaj skróty tylko na urządzeniach, z których korzystasz tylko Ty.",
            "W każdej chwili możesz wybrać w skrócie <strong>Disconnect</strong>: jego połączenie zostaje natychmiast usunięte, wraz z zapisem wysłanych sum Nutrition MCP Health. Każde połączenie kończy się też samo po 90 dniach bez synchronizacji i 365 dniach od połączenia. To, co już jest w Apple Health, zostaje tam, dopóki tego nie usuniesz, a aktywne kalorie, które już wysłano, zostają, dopóki ich nie usuniesz.",
        ],
        policyLink: "Przeczytaj politykę prywatności",
    },
    troubleshooting: {
        title: "Rozwiązywanie problemów",
        lead: "Coś się nie zgadza? Te odpowiedzi obejmują typowe przypadki.",
        readMore: "Przeczytaj odpowiedź",
    },
    selfHost: {
        textHtml:
            "Masz własny serwer? Skróty są zbudowane krok po kroku w {link} i {activityLink}.",
        linkText: "instrukcji budowy skrótu Nutrition MCP Health",
        activityLinkText: "instrukcji budowy skrótu Nutrition MCP Activity",
    },
};

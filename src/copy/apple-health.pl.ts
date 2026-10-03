import type { AppleHealthDoc } from "./apple-health.js";

export const APPLE_HEALTH_PL: AppleHealthDoc = {
    meta: {
        title: "Synchronizacja z Apple Health",
        description:
            "Skonfiguruj darmowy skrót Nutrition MCP Health w telefonie iPhone: kopiuje on do Apple Health sumy dzienne, które zapisujesz w rozmowie z AI (kalorie, białko, węglowodany, tłuszcz, błonnik, cukier, kofeinę i opcjonalnie wodę).",
        ogDescription:
            "Kopiuj do Apple Health sumy dzienne zapisywane z pomocą AI — wystarczy jeden darmowy skrót w telefonie iPhone.",
    },
    tocLabel: "Na tej stronie",
    hero: {
        eyebrow: "Synchronizacja z Apple Health · iPhone",
        title: "Twoje sumy dzienne w Apple Health",
        lead: "Darmowy skrót w telefonie iPhone kopiuje sumy każdego zakończonego dnia z Nutrition MCP do Apple Health. Posiłki nadal zapisujesz w aplikacji AI, a skrót wysyła tylko dni, które już się skończyły.",
        seeTitle: "Co zobaczysz w Apple Health",
        seeItems: [
            "Jeden wpis na składnik dla każdego zakończonego dnia, o <strong>12:00</strong>, ze źródłem <strong>Skróty</strong>.",
            "Dzień kończy się o <strong>05:00</strong> następnego ranka w Twojej strefie czasowej, więc wczorajszy dzień trafia tam po 05:00 dzisiaj. Dzisiejszego dnia nigdy tam nie ma.",
        ],
        nutrientsLabel: "Wysyłane codziennie",
        nutrients: {
            energy_kcal: "Energia z pożywienia",
            protein_g: "Białko",
            carbohydrates_g: "Węglowodany",
            fat_g: "Tłuszcze ogółem",
            fiber_g: "Błonnik",
            sugar_g: "Cukier",
            caffeine_mg: "Kofeina",
            water_ml: "Woda",
        },
        waterNote: "jeśli tak wybierzesz",
        alcoholNote: "Alkohol nigdy nie jest wysyłany.",
    },
    before: {
        title: "Zanim zaczniesz",
        items: [
            "Telefon iPhone z aplikacjami <strong>Skróty</strong> i <strong>Zdrowie</strong>. Obie są częścią systemu iOS.",
            "Konto Nutrition MCP, które jest już połączone z Twoją aplikacją AI, np. Claude lub ChatGPT. Skrót loguje się na to samo konto.",
            "Zalecane: strefa czasowa w Twoim profilu, bo to ona decyduje, gdzie kończy się dzień. Wystarczy napisać w czacie <em>&bdquo;ustaw moją strefę czasową&rdquo;</em>. Jeśli nigdy jej nie ustawiono, używana jest strefa czasowa, którą telefon iPhone zgłosi przy łączeniu.",
        ],
    },
    install: {
        title: "Zainstaluj skrót",
        lead: "Otwórz link w telefonie iPhone i stuknij <strong>Dodaj skrót</strong>. Pojawi się w aplikacji Skróty jako <strong>Nutrition MCP Health</strong>.",
        button: "Pobierz skrót",
        pending: "Link do skrótu wkrótce pojawi się w tym miejscu.",
        leadPending:
            "Skrót nie został jeszcze opublikowany. Gdy będzie dostępny, otworzysz jego link w telefonie iPhone i stukniesz <strong>Dodaj skrót</strong>, a pojawi się on w aplikacji Skróty jako <strong>Nutrition MCP Health</strong>. Poniższe kroki opisują, co dzieje się dalej.",
        nameNote:
            "Zachowaj dokładnie nazwę <strong>Nutrition MCP Health</strong>. Strona logowania ponownie otwiera skrót po tej nazwie, więc po zmianie nazwy łączenie zatrzyma się w połowie.",
    },
    connect: {
        title: "Połącz go",
        steps: [
            "W aplikacji Skróty stuknij <strong>Nutrition MCP Health</strong>, aby go uruchomić.",
            "Odpowiedz na dwa pytania: czy wysyłać także <strong>wodę</strong> (pomiń ją, jeśli Apple Watch lub inna aplikacja już zapisuje wodę) i które dni wysłać — <strong>From today</strong> (od dzisiaj) czy <strong>Also the last 7 days</strong> (także 7 ostatnich dni).",
            "Safari otworzy stronę logowania. Zaloguj się na <strong>to samo konto, którego używa Twoja aplikacja AI</strong>. Strona pokaże komunikat o łączeniu Apple Health: kontynuuj tylko wtedy, gdy łączenie zostało przed chwilą uruchomione przez Ciebie, ze skrótu we własnym telefonie iPhone.",
            "Gdy Safari zapyta, czy otworzyć aplikację Skróty, stuknij <strong>Otwórz</strong>. Skrót dokończy łączenie.",
            "Gdy dzień zostanie wysłany po raz pierwszy, Apple Health zapyta, co aplikacja Skróty może zapisywać: włącz <strong>każdy typ</strong> i stuknij <strong>Pozwól</strong>. Jeśli wybrano <strong>Also the last 7 days</strong> i w tych dniach są zapisane posiłki, stanie się to od razu. W przeciwnym razie nie ma jeszcze czego wysłać, więc jutro po 05:00 otwórz skrót i raz stuknij <strong>Sync now</strong>, aby odpowiedzieć na to pytanie.",
        ],
        note: "Link do logowania działa tylko raz, przez 30 minut. Jeśli wygaśnie, uruchom skrót ponownie. Pierwszy zakończony dzień trafi do Apple Health jutro po 05:00; jeśli wybrano 7 ostatnich dni, zostaną one wysłane od razu.",
    },
    automate: {
        title: "Ustaw automatyczne działanie",
        lead: "Udostępniony skrót nie może przenieść ze sobą automatyzacji, więc utwórz je raz na karcie <strong>Automatyzacja</strong> w aplikacji Skróty. Najważniejsza jest pierwsza; pozostałe nadrabiają zaległości, gdy nie otwierasz aplikacji Zdrowie.",
        triggersLabel: "Kiedy go uruchamiać",
        triggers: [
            {
                when: "Aplikacja → Zdrowie → Jest otwarta",
                tag: "Główna",
                body: "Otwierając aplikację Zdrowie, chcesz mieć w niej aktualne dane — to idealny moment.",
            },
            {
                when: "Budzik → Jest zatrzymany",
                tag: "Poranne nadrabianie",
                body: "Budzik wyłączony po 05:00, na przykład poranny, wysyła wczorajszy dzień od razu po jego zakończeniu.",
            },
            {
                when: "Ładowarka → Jest podłączona",
                tag: "Opcjonalna",
                body: "Podłączenie telefonu do ładowania w nocy lub przy biurku to jeszcze jedna okazja do synchronizacji.",
            },
        ],
        stepsLabel: "Dla każdej z nich",
        steps: [
            "W aplikacji Skróty otwórz kartę <strong>Automatyzacja</strong> i stuknij <strong>+</strong>, aby utworzyć automatyzację osobistą.",
            "Wybierz wyzwalacz, na przykład <strong>Aplikacja</strong> → <strong>Zdrowie</strong> → <strong>Jest otwarta</strong>.",
            "Wybierz <strong>Uruchom natychmiast</strong> i wyłącz <strong>Powiadamiaj po uruchomieniu</strong>, jeśli telefon iPhone daje taką opcję.",
            "Dodaj czynność <strong>Uruchom skrót</strong>, wybierz <strong>Nutrition MCP Health</strong> i ustaw jako dane wejściowe tekst <code>auto</code>.",
        ],
        note: "Dane wejściowe <code>auto</code> sprawiają, że automatyczne uruchomienia działają po cichu: powiadamiają tylko wtedy, gdy coś wymaga Twojej uwagi. Konkretna godzina nie jest potrzebna: każda synchronizacja sięga 7 ostatnich zakończonych dni, więc pominięty poranek nadrabia się sam.",
    },
    everyday: {
        title: "Na co dzień",
        cards: [
            {
                title: "Brakuje jakiegoś posiłku?",
                body: "Dodaj to w czacie jak zwykle. Jeśli ten dzień został już wysłany i mieści się w 7 ostatnich dniach, następna synchronizacja uzupełni go małym dodatkowym wpisem o 12:01, 12:02 i tak dalej. Zmiany mniejsze niż około 20 kcal lub 2 g są pomijane, a bardzo duży skok albo zmiana po 9 uzupełnieniach przychodzi jako powiadomienie, aby wpisać ją ręcznie.",
            },
            {
                title: "Posiłek usunięty lub zmniejszony?",
                body: "Apple Health może dodać coś do wartości, ale nie może jej obniżyć, więc dostaniesz powiadomienie, o ile ten dzień jest teraz za wysoki. Aby to poprawić, otwórz Zdrowie → <strong>Przeglądaj</strong> → <strong>Odżywianie</strong>, wybierz typ, stuknij <strong>Pokaż wszystkie dane</strong> i przesuń w lewo wpisy z tego dnia pochodzące z aplikacji Skróty, aby je usunąć, a potem ręcznie wpisz poprawną sumę podaną w powiadomieniu. Nigdy nie używaj opcji <strong>Usuń wszystkie dane z „Skróty”</strong>: usuwa ona także to, co zapisały Twoje inne skróty.",
            },
            {
                title: "Uruchom go ręcznie",
                body: "Stuknij <strong>Nutrition MCP Health</strong> w aplikacji Skróty, aby otworzyć jego menu: <strong>Sync now</strong> wysyła wszystko, co czeka, <strong>Status</strong> pokazuje ostatni wysłany dzień i to, kiedy będzie gotowy następny, a <strong>Disconnect</strong> kończy połączenie.",
            },
            {
                title: "Sprawdź w aplikacji AI",
                body: "Poproś AI o pokazanie profilu (<code>get_profile</code>): dowiesz się, kiedy połączono synchronizację, do którego dnia wysłała dane i kiedy ostatnio działała.",
            },
        ],
    },
    privacy: {
        title: "Prywatność i ograniczenia",
        items: [
            "Nasz serwer przechowuje połączenie oraz, przez 8 dni, zapis wysłanych sum, aby każdy dzień był wysyłany raz, a potem tylko uzupełniany. Oba znajdują się w Twoim eksporcie danych.",
            "Skrót przechowuje swój token dostępu we własnej pamięci w aplikacji Skróty w telefonie iPhone, a nie w pliku, a aplikacja Skróty może go synchronizować z innymi Twoimi urządzeniami przez iCloud. Każdy, kto może uruchomić skrót na Twoich urządzeniach, może korzystać z synchronizacji, dopóki jej nie odłączysz, więc trzymaj go tylko na urządzeniach, z których korzystasz wyłącznie Ty.",
            "Niczego nie wysyłamy do Apple. Skrót pobiera Twoje sumy z naszego serwera i zapisuje je w aplikacji Zdrowie w telefonie iPhone; od tego momentu obowiązują Twoje własne ustawienia Apple.",
            "W każdej chwili możesz wybrać <strong>Disconnect</strong>: połączenie i jego zapis zostaną natychmiast usunięte. Połączenie wygasa też samo po 90 dniach bez synchronizacji i 365 dniach od połączenia. To, co już jest w Apple Health, zostaje tam, dopóki tego nie usuniesz.",
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
            "Masz własny serwer? Skrót jest zbudowany krok po kroku w {link}.",
        linkText: "instrukcji budowy",
    },
};

// Polish (pl) translation of legal.ts's PRIVACY_EN/TERMS_EN. Kept in the
// same direct, plain-spoken register as the rest of the site — informal
// "Ty", not a shift into formal/legalistic Polish ("Państwo", "niniejszym")
// — matching the same principle documented above PRIVACY_DE/TERMS_DE in
// legal.ts. No human review pass (product decision, see git history) —
// this is exactly the page most worth a native-speaker legal review
// before it's relied on.

import type { LegalDoc } from "./legal.js";

const p = (html: string): { type: "p"; html: string } => ({
    type: "p",
    html,
});
const ul = (items: string[]): { type: "ul"; items: string[] } => ({
    type: "ul",
    items,
});

export const PRIVACY_PL: LegalDoc = {
    title: "Polityka prywatności",
    metaDescription:
        "Jak Nutrition MCP przetwarza Twoje dane: co przechowujemy, jak to wykorzystujemy, gdzie to się znajduje i jak w dowolnej chwili usunąć swoje konto oraz wszystko, co w nim jest.",
    ogDescription:
        "Jak Nutrition MCP przetwarza Twoje dane: co przechowujemy, jak to wykorzystujemy, gdzie to się znajduje i jak w dowolnej chwili usunąć swoje konto oraz wszystko, co w nim jest.",
    lastUpdated: "27 września 2026",
    backToHome: "Wróć na stronę główną",
    sections: [
        {
            heading: "Co zbieramy",
            blocks: [
                p(
                    "Podczas rejestracji przechowujemy Twój <strong>adres e-mail</strong> oraz bezpiecznie zahaszowane hasło za pośrednictwem Supabase Auth. Jeśli zamiast tego logujesz się przez Google, prosimy Google wyłącznie o Twój adres e-mail i otrzymujemy go razem z identyfikatorem Twojego konta Google, który Supabase Auth przechowuje, aby rozpoznać Cię przy kolejnym logowaniu przez Google. Nigdy nie widzimy hasła do konta Google. Konta, do których logowano się przez Google przed 27 września 2026, mogą nadal zawierać imię i nazwisko oraz zdjęcie profilowe przekazane wtedy przez Google; żadna część usługi ich nie odczytuje ani nie wyświetla, a zostaną usunięte razem z Twoim kontem.",
                ),
                p("Podczas korzystania z usługi przechowujemy:"),
                ul([
                    "<strong>Wpisy posiłków</strong> — opis, typ posiłku, kalorie, makroskładniki, błonnik, cukry ogółem, gramy alkoholu, miligramy kofeiny, notatki i znaczniki czasu. Zdjęcia jedzenia są interpretowane przez Twojego asystenta AI i nigdy nie są przesyłane do nas ani przez nas przechowywane.",
                    "<strong>Wpisy wody</strong> — ilość, notatki i znaczniki czasu.",
                    "<strong>Wpisy masy ciała</strong> — waga, notatki i znaczniki czasu. To dane dotyczące zdrowia i są traktowane dokładnie tak samo jak reszta Twoich wpisów.",
                    "<strong>Cele</strong> — Twoje dzienne cele dotyczące kalorii, białka, węglowodanów, tłuszczu, błonnika, cukru, alkoholu, kofeiny i wody, a także docelowa waga.",
                    "<strong>Ustawienia profilu</strong> — Twoja strefa czasowa IANA, preferowana jednostka wagi, informacja, czy śledzenie alkoholu jest włączone i w jakim standardowym drinku jest pokazywane, czy widżety w czacie są włączone oraz w jakim języku są wyświetlane.",
                    "<strong>Telemetria korzystania z narzędzi</strong> — dla każdego wywołania narzędzia MCP: które narzędzie zostało uruchomione, czy zakończyło się sukcesem, ile trwało, ogólna kategoria błędu w razie niepowodzenia, długość w dniach każdego zapytanego zakresu dat, identyfikator sesji MCP, wersja protokołu MCP, z którą połączyła się Twoja aplikacja AI, oraz nazwa i wersja, pod którymi ta aplikacja się przedstawia (na przykład &bdquo;claude-ai/1.0&rdquo;), jeśli je przesyła. Jest powiązana z Twoim identyfikatorem konta. Nigdy nie zawiera treści Twoich wpisów.",
                    "<strong>Dziennik działania serwera</strong> — dla każdego żądania do serwera: metoda, ścieżka, status i czas odpowiedzi, Twój adres IP bez ostatniej części oraz, w przypadku żądań MCP, wersja protokołu i nazwa oraz wersja podawane przez Twoją aplikację AI. Dla każdego wywołania narzędzia zapisuje też nazwę narzędzia, czy wywołanie się powiodło, ile trwało oraz, w razie niepowodzenia, krótki kod referencyjny i komunikat błędu — który może powtarzać wartość przesłaną przez Twoją aplikację AI, na przykład nieprawidłową datę. Gdy Twoja aplikacja AI loguje się lub odnawia połączenie, zapisuje wynik, losowy identyfikator nadany Twojej aplikacji AI przy rejestracji w naszej usłudze logowania oraz witrynę, na którą aplikacja poprosiła o przekierowanie z powrotem (na przykład claude.ai). Trafia do dziennika działania naszego dostawcy hostingu, nie zawiera Twojego identyfikatora konta ani adresu e-mail i jest przechowywany tylko krótko: ten dziennik to bufor cykliczny, który nadpisuje starsze wiersze w miarę napływu nowego ruchu.",
                ]),
                p(
                    "<strong>Alkohol również jest daną dotyczącą zdrowia</strong>, i to bardziej wrażliwą niż liczba kalorii, więc działa to inaczej niż wszystko powyżej. Śledzenie alkoholu jest domyślnie wyłączone, a my zapisujemy alkohol wyłącznie wtedy, gdy pochodzi od Ciebie — z zapisanego przez Ciebie drinka albo z kolumny w importowanym pliku. Nic nie jest wnioskowane w Twoim imieniu. Wyłączenie tego ustawienia robi dwie rzeczy: importer zbiorczy przestaje odczytywać kolumnę alkoholu z przesyłanych przez Ciebie plików, a wszystko inne przestaje pokazywać alkohol w posiłkach, celach, postępach i widżetach, które widzisz. To nie jest przełącznik usuwania. Alkohol zapisany przez Ciebie bezpośrednio jest nadal rejestrowany niezależnie od tego ustawienia, wszystko, co już zostało zapisane, pozostaje w bazie danych, a to wszystko nadal pojawia się w pliku posiłków każdego eksportu, który wykonasz. Aby faktycznie usunąć wartość alkoholu, usuń posiłek, do którego należy, albo usuń swoje konto.",
                ),
                p(
                    "Przechowujemy też tokeny dostępu i odświeżania OAuth oraz kody autoryzacyjne, które pozwalają Twojemu asystentowi AI pozostać połączonym z Twoim kontem; jak długo ważny jest każdy z nich, opisujemy w sekcji &bdquo;Jak długo przechowujemy dane&rdquo;. Są przechowywane wyłącznie w postaci jednokierunkowych skrótów (hashy).",
                ),
            ],
        },
        {
            heading: "Jak to wykorzystujemy",
            blocks: [
                p(
                    "Dane o Twoich posiłkach, wodzie, wadze i celach są wykorzystywane wyłącznie do świadczenia usługi śledzenia odżywiania. <strong>Nigdy ich nie sprzedajemy, nigdy nie udostępniamy stronom trzecim ani nie wykorzystujemy do reklam</strong>, ani nie zasilamy nimi żadnego systemu reklamowego czy profilującego.",
                ),
                p(
                    'Gdy kod kreskowy wyszukujesz Ty lub Twój asystent AI, nasz serwer wysyła do <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> wyłącznie cyfry kodu kreskowego — nigdy Twojego konta, adresu e-mail ani wpisów — a zwrócone dane produktu przechowuje we wspólnej pamięci podręcznej, która nie jest powiązana z żadnym użytkownikiem.',
                ),
                p(
                    "Istnieją dwa rodzaje analityki, i żaden nie dotyka treści Twoich wpisów:",
                ),
                ul([
                    "<strong>Analityka strony.</strong> Za Twoją zgodą te strony wczytują Google Analytics, który daje nam zbiorcze statystyki ruchu — odsłony, źródła odwiedzin, przybliżoną geografię, typ urządzenia — oraz Microsoft Clarity, który rejestruje, jak odwiedzający korzystają z witryny — kliknięcia, dotknięcia, przewijanie, ruchy myszy — w postaci nagrań sesji i map cieplnych, abyśmy widzieli, gdzie strony są niejasne. Żadne z tych narzędzi nie wczytuje się, dopóki nie wyrazisz zgody w banerze cookies; jeśli odmówisz, żadne z nich się nie wczyta, a jeśli Twoja przeglądarka wysyła sygnał Global Privacy Control, żadne z nich się nie wczyta, chyba że wyrazisz zgodę w stopce. Zgoda obejmuje wyłącznie przechowywanie danych analitycznych: przechowywanie danych reklamowych i Google Signals pozostają wyłączone. Google otrzymuje Twój adres IP przy każdym żądaniu, ale według Google nie zapisuje go ani nie przechowuje w przypadku odwiedzających z UE, Szwajcarii i Wielkiej Brytanii, a używa go tylko do ustalenia przybliżonej lokalizacji. Clarity maskuje to, co wpisujesz w formularze, i również otrzymuje Twój adres IP oraz dane przeglądarki. Żadne z nich nie działa na stronie logowania. Zgodę możesz w każdej chwili wycofać przyciskiem &bdquo;Ustawienia plików cookie&rdquo; w stopce, co usuwa też analityczne pliki cookie ustawione przez tę witrynę; Twój wybór jest przechowywany w pamięci lokalnej przeglądarki przez maksymalnie 6 miesięcy.",
                    "<strong>Telemetria serwera.</strong> Każde wywołanie narzędzia MCP zapisuje jeden wiersz telemetrii użycia — które narzędzie zostało uruchomione, czy się powiodło, ile trwało, która wersja protokołu MCP i która aplikacja AI (według podawanej przez nią nazwy i wersji) wykonała wywołanie — powiązany z Twoim identyfikatorem konta, ale nie z tym, co zapisałeś/aś. Wykorzystujemy to, żeby znajdować wolne i uszkodzone narzędzia. Nie jest to udostępniane nikomu i jest usuwane razem ze wszystkim innym, gdy usuwasz swoje konto.",
                ]),
                p(
                    "Ponieważ strona wczytuje czcionki i ikony z Google Fonts i jsDelivr, a strona główna pobiera liczbę gwiazdek projektu z GitHub API, odwiedzanie tych stron ujawnia Twój adres IP tym dostawcom.",
                ),
            ],
        },
        {
            heading: "Gdzie to jest przechowywane",
            blocks: [
                p(
                    'Wszystkie dane są przechowywane w <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) w UE, w irlandzkim regionie AWS (eu-west-1). Uwierzytelnianie i przechowywanie eksportów obsługuje Supabase w tym samym regionie. Serwer działa na DigitalOcean we Frankfurcie nad Menem w Niemczech.',
                ),
            ],
        },
        {
            heading: "Jak długo przechowujemy dane",
            blocks: [
                p(
                    "Twoje wpisy posiłków, wody i wagi, cele, ustawienia profilu oraz telemetria korzystania z narzędzi są przechowywane tak długo, jak istnieje Twoje konto — żadne z nich nie ma osobnej daty wygaśnięcia ani zaplanowanego czyszczenia. Gdy usuwasz konto, wszystko to jest usuwane natychmiast i nieodwracalnie, jak opisano poniżej. Jedynymi śladami pozostają: wiersz telemetrii dotyczący samego usunięcia, zapisywany bez identyfikatora Twojego konta; opisany wyżej krótkotrwały dziennik działania serwera, który nigdy nie zawiera identyfikatora Twojego konta; własne dzienniki operacyjne naszego dostawcy bazy danych, przechowywane przez ograniczony czas (do 7 dni w naszym planie); oraz jego rotacyjne kopie zapasowe, które wygasają według jego własnego harmonogramu.",
                ),
                p(
                    "Poświadczenia logowania są z założenia krótkotrwałe. Sesja strony logowania trwa 10 minut i jest przechowywana w pamięci serwera; jest powiązana z Twoją przeglądarką za pomocą ściśle niezbędnego pliku cookie, który zawiera wyłącznie losową wartość, wygasa po tych samych 10 minutach i jest usuwany po zakończeniu logowania. Do sprawdzenia Twojego hasła lub logowania przez Google używamy Supabase Auth, który za każdym razem tworzy sesję logowania Supabase; nigdy z niej nie korzystamy i natychmiast ją kończymy. Jednorazowy kod autoryzacyjny przekazywany Twojej aplikacji AI wygasa po 10 minutach i jest usuwany, gdy tylko zostanie użyty. Nowy token dostępu jest ważny przez 24 godziny (token wydany przed 27 września 2026 zachowuje okres ważności, z jakim został wydany, nie dłuższy niż rok); token odświeżania jest ważny przez 90 dni i jest usuwany w chwili, gdy zostanie użyty do uzyskania nowej pary. Wygasłe tokeny i kody są usuwane automatycznie w ciągu godziny. Usunięcie konta natychmiast usuwa je wszystkie.",
                ),
                p(
                    "Archiwa eksportu są krótkotrwałe. Każdy nowy eksport nadpisuje poprzedni, a plik jest automatycznie usuwany, gdy tylko wygaśnie jego 60-minutowy link do pobrania — czyszczenie uruchamia się co dziesięć minut, więc archiwum zwykle nie pozostaje w pamięci dłużej niż około 70 minut.",
                ),
            ],
        },
        {
            heading: "Usuwanie danych",
            blocks: [
                p(
                    "Możesz w dowolnej chwili usunąć swoje konto i wszystkie powiązane dane, prosząc swojego asystenta AI o <strong>usunięcie konta</strong> podczas połączenia z serwerem Nutrition MCP. Ta czynność jest natychmiastowa i nieodwracalna. Usuwa Twoje wpisy posiłków, wody i wagi, cele, ustawienia profilu, wszelkie wciąż przechowywane archiwum eksportu, Twoją telemetrię korzystania z narzędzi, tokeny dostępu oraz samo konto. Obejmuje to każdą wartość alkoholu, jaką kiedykolwiek zapisałeś/aś, niezależnie od tego, czy śledzenie alkoholu było włączone.",
                ),
            ],
        },
        {
            heading: "Kontakt i Twoje prawa",
            blocks: [
                p(
                    'Nutrition MCP prowadzi Anton Kutishevskyi, niezależny programista, który jest administratorem Twoich danych osobowych w ramach tej usługi. We wszystkich sprawach dotyczących Twoich danych lub tej polityki napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Na jakiej podstawie możemy je przetwarzać:"),
                ul([
                    "<strong>Twoje konto i wpisy</strong> — aby świadczyć usługę, na którą się zarejestrowałeś/aś (wykonanie umowy). Posiłki, waga i alkohol to dane dotyczące zdrowia, więc przetwarzamy je na podstawie Twojej wyraźnej zgody, którą wyrażasz, zapisując je, i którą możesz w każdej chwili wycofać, usuwając wpisy albo swoje konto.",
                    "<strong>Telemetria korzystania z narzędzi i dziennik działania serwera</strong> — nasz prawnie uzasadniony interes w utrzymaniu sprawnego, szybkiego i bezpiecznego działania usługi (wykrywanie uszkodzonych narzędzi, ograniczanie nadużyć). Żadne z nich nie zawiera treści Twoich wpisów.",
                    "<strong>Analityka strony</strong> — Twoja zgoda, wyrażona w banerze cookies i możliwa do wycofania w każdej chwili przyciskiem &bdquo;Ustawienia plików cookie&rdquo; w stopce.",
                ]),
                p(
                    "Twoje prawa i jak z nich skorzystać — do większości nie potrzebujesz nawet e-maila:",
                ),
                ul([
                    "<strong>Dostęp i przenoszenie danych</strong> — poproś asystenta AI o eksport swoich danych. Otrzymasz archiwum ZIP z plikami CSV zawierającymi wszystko, co zapisałeś/aś, Twoje cele i ustawienia. W sprawie wszystkich innych danych, które o Tobie przechowujemy — adresu e-mail konta, zapisów dotyczących konta i logowania oraz telemetrii korzystania z narzędzi — napisz do nas z adresu powiązanego z kontem, a w ciągu miesiąca prześlemy Ci ich kopię.",
                    "<strong>Sprostowanie</strong> — poproś asystenta AI o poprawienie lub usunięcie dowolnego wpisu posiłku, wody czy wagi albo o zmianę celów i ustawień.",
                    "<strong>Usunięcie danych</strong> — poproś asystenta AI o usunięcie konta, co od razu usuwa wszystko.",
                    "<strong>Sprzeciw i ograniczenie przetwarzania</strong> — napisz do nas, a odpowiemy w ciągu miesiąca.",
                    "<strong>Skarga</strong> — możesz złożyć skargę do organu ochrony danych w kraju, w którym mieszkasz lub pracujesz. Będziemy jednak wdzięczni, jeśli najpierw dasz nam szansę rozwiązać problem.",
                ]),
                p(
                    "Wszystko, co przechowujemy, pozostaje we wskazanym wyżej regionie UE. To, co Twój asystent AI odczytuje za pomocą narzędzi, trafia do dostawcy tego asystenta, który może znajdować się poza UE; dzieje się to na podstawie Twojej własnej umowy z tym dostawcą, a nie naszej. Poza UE znajdują się również Google i Microsoft (analityka strony, Google Sign-In) oraz Google, jsDelivr i GitHub (opisane wyżej zapytania o czcionki, ikony i liczbę gwiazdek); jeśli otrzymują dane osobowe poza UE, opierają się na standardowych klauzulach umownych Komisji Europejskiej albo na ramach ochrony danych UE–USA (EU–US Data Privacy Framework).",
                ),
                p(
                    'Usługa nie jest przeznaczona dla osób poniżej 16. roku życia, a <a href="/terms" data-legal-link="terms">Regulamin</a> wymaga ukończenia 16 lat. Jeśli uważasz, że konto założyła młodsza osoba, napisz do nas, a usuniemy je.',
                ),
                p(
                    "Jeśli ta polityka się zmieni, zmieni się też data na górze strony.",
                ),
            ],
        },
        {
            heading: "Regulamin",
            blocks: [
                p(
                    'Korzystanie z usługi podlega również naszemu <a href="/terms" data-legal-link="terms">Regulaminowi</a>, który obejmuje dopuszczalny sposób korzystania, fakt, że nic tutaj nie stanowi porady medycznej, oraz brak jakiejkolwiek gwarancji — usługa jest świadczona w stanie, w jakim się znajduje, bezpłatnie, bez żadnych gwarancji dostępności, dokładności czy przydatności do jakiegokolwiek celu.',
                ),
            ],
        },
    ],
};

export const TERMS_PL: LegalDoc = {
    title: "Regulamin",
    metaDescription:
        "Zasady korzystania z Nutrition MCP — darmowego trackera odżywiania open source i zdalnego serwera MCP dla Claude i ChatGPT. Regulamin napisany prostym językiem, obejmujący konta, dopuszczalne użycie, Twoje dane i odpowiedzialność.",
    ogDescription:
        "Zasady korzystania z Nutrition MCP — darmowego trackera odżywiania open source i zdalnego serwera MCP dla Claude i ChatGPT.",
    lastUpdated: "27 września 2026",
    backToHome: "Wróć na stronę główną",
    sections: [
        {
            heading: "Umowa",
            blocks: [
                p(
                    "Ten regulamin określa zasady korzystania z Nutrition MCP (&bdquo;usługi&rdquo;) — strony internetowej pod adresem nutrition-mcp.com oraz zdalnego serwera MCP pod adresem <strong>https://nutrition-mcp.com/mcp</strong>. Zakładając konto albo łącząc asystenta AI z serwerem, akceptujesz ten regulamin. Jeśli się nie zgadzasz, prosimy nie korzystać z usługi.",
                ),
                p(
                    "Usługę prowadzi Anton Kutishevskyi, niezależny programista (&bdquo;my&rdquo;).",
                ),
            ],
        },
        {
            heading: "Usługa",
            blocks: [
                p(
                    'Nutrition MCP to darmowy tracker odżywiania open source, działający jako serwer MCP, który pozwala asystentom AI, takim jak Claude i ChatGPT, zapisywać w Twoim imieniu posiłki, wodę i masę ciała. Nie ma płatnego poziomu, reklam ani opłat za korzystanie z usługi. Przyjmujemy dobrowolne darowizny na Patreon, żeby pomóc pokryć koszty hostingu i bazy danych; są one prezentem, a nie zakupem, i nie kupują żadnych funkcji, poziomu ani jakiegokolwiek priorytetu. Kod źródłowy jest opublikowany na licencji MIT na <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a>, a Ty możesz swobodnie hostować go samodzielnie.',
                ),
            ],
        },
        {
            heading: "Twoje konto",
            blocks: [
                p(
                    "Aby korzystać z usługi, musisz mieć ukończone 16 lat. Nie weryfikujemy wieku, więc zakładając konto, potwierdzasz, że spełniasz ten wymóg. Jesteś odpowiedzialny/a za zachowanie poufności swoich danych logowania oraz za wszelkie działania podejmowane na Twoim koncie. Podaj adres e-mail, do którego rzeczywiście masz dostęp — to jedyny sposób na odzyskanie dostępu.",
                ),
            ],
        },
        {
            heading: "To nie jest porada medyczna",
            blocks: [
                p(
                    "Nutrition MCP to narzędzie do zapisywania i raportowania, a nie usługa medyczna. Nic, co generuje — wartości kalorii i makroskładników, cele, trendy czy jakikolwiek komentarz dodany przez Twojego asystenta AI — nie jest poradą medyczną, żywieniową ani dietetyczną, i nic z tego nie zastępuje wykwalifikowanego specjalisty. Przed podjęciem decyzji dotyczących zdrowia skonsultuj się z lekarzem albo dietetykiem, zwłaszcza jeśli masz schorzenie albo historię zaburzeń odżywiania.",
                ),
                p(
                    "Usługa nie jest przeznaczona do zastosowań klinicznych i nie powinna być używana przez osoby z czynnym zaburzeniem odżywiania ani przez osoby w ciąży lub pod opieką kliniczną z powodu schorzenia związanego z odżywianiem, bez udziału ich lekarza prowadzącego. Śledzenie kalorii i makroskładników może być w takich sytuacjach szkodliwe. Jeśli to dotyczy Ciebie, porozmawiaj ze swoim lekarzem przed rozpoczęciem korzystania z usługi.",
                ),
                p(
                    "Wartości odżywcze to <strong>szacunki</strong>. Pochodzą z modeli AI interpretujących Twoje opisy i zdjęcia, z zewnętrznych baz danych, takich jak Open Food Facts, oraz z tego, co sam/a wprowadzisz. Mogą być błędne. Sprawdzaj wszystko, na czym Ci zależy.",
                ),
                p(
                    "Zdjęcia jedzenia nigdy nie są wysyłane na nasz serwer. Twój asystent AI interpretuje obraz po swojej stronie i przesyła nam tylko wynikowy tekst i liczby — opis, typ posiłku, kalorie, makroskładniki, notatki, kod kreskowy.",
                ),
            ],
        },
        {
            heading: "Dopuszczalne użycie",
            blocks: [
                p("Korzystając z usługi, zobowiązujesz się nie:"),
                ul([
                    "wykorzystywać jej do żadnego bezprawnego celu ani z naruszeniem obowiązującego prawa czy przepisów;",
                    "próbować uzyskać dostęp do konta lub danych innego użytkownika ani omijać uwierzytelniania, limitów zapytań czy jakiejkolwiek innej technicznej kontroli;",
                    "sondować, skanować, przeciążać ani zakłócać usługi lub infrastruktury, na której działa, w tym za pomocą zautomatyzowanych masowych zapytań;",
                    "przesyłać treści, które są nielegalne albo do których udostępniania nie masz prawa;",
                    "odsprzedawać hostowanej usługi ani przedstawiać jej jako własnej;",
                    "wykorzystywać jej do dążenia do skrajnego ograniczania kalorii ani do promowania, coachowania czy zachęcania do tego kogokolwiek innego.",
                ]),
                p(
                    "Usługa ma ograniczoną liczbę zapytań, żeby pozostała dostępna dla wszystkich. Jeśli potrzebujesz większej przepustowości, hostuj ją samodzielnie — właśnie do tego służy licencja MIT.",
                ),
            ],
        },
        {
            heading: "Twoje dane",
            blocks: [
                p(
                    'Twoje wpisy pozostają Twoje. Przechowujemy je i przetwarzamy, żeby świadczyć Ci usługę, zgodnie z opisem w naszej <a href="/privacy" data-legal-link="privacy">Polityce prywatności</a>. Jesteś odpowiedzialny/a za treści, które zapisujesz.',
                ),
                p(
                    "Możesz w dowolnej chwili wyeksportować wszystkie swoje dane, prosząc asystenta AI o ich eksport. Eksport to archiwum ZIP z plikami CSV z Twoimi posiłkami, wodą, wagą, celami i ustawieniami profilu; alkohol jest uwzględniany niezależnie od tego, czy śledzenie alkoholu jest włączone. Zwracany przez nas link do pobrania jest prywatny i wygasa po 60 minutach.",
                ),
                p(
                    "Rejestrujemy też podstawową telemetrię operacyjną dotyczącą tego, jak usługa jest wykorzystywana: dla każdego wywołania narzędzia — jego nazwę, czy się powiodło, ile trwało, ogólną kategorię błędu w razie niepowodzenia, długość każdego zapytanego zakresu dat, identyfikator sesji, wersję protokołu MCP, z którą połączyła się Twoja aplikacja AI, oraz nazwę i wersję, pod którymi ta aplikacja się przedstawia. Te wiersze są powiązane z Twoim identyfikatorem konta. Nie zawierają tego, co zapisałeś/aś — żadnych opisów jedzenia, kalorii ani wag. Wykorzystujemy je, żeby utrzymać działanie usługi i sprawdzić, które narzędzia warto ulepszyć, a są usuwane razem ze wszystkim innym, gdy usuwasz swoje konto.",
                ),
                p(
                    "Możesz w dowolnej chwili usunąć swoje konto i wszystkie powiązane dane, prosząc swojego asystenta AI o <strong>usunięcie konta</strong> podczas połączenia — ta czynność jest natychmiastowa i nieodwracalna.",
                ),
            ],
        },
        {
            heading: "Dostępność i zmiany",
            blocks: [
                p(
                    "Usługa jest oferowana bezpłatnie, bez gwarancji dostępności i bez umowy o gwarantowanym poziomie usług (SLA). Możemy w dowolnym momencie i bez uprzedzenia zmienić, zawiesić albo wycofać dowolną jej część — w tym narzędzia, funkcje i sam hostowany serwer. Możemy też modyfikować albo usuwać treści naruszające ten regulamin.",
                ),
            ],
        },
        {
            heading: "Usługi stron trzecich",
            blocks: [
                p(
                    "Usługa zależy od stron trzecich: Supabase — baza danych, uwierzytelnianie i przechowywanie eksportów, DigitalOcean — hosting, Open Food Facts — dane z kodów kreskowych, oraz dowolny asystent AI, z którego się łączysz.",
                ),
                p(
                    'Dane produktów z kodów kreskowych &copy; współtwórcy <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, udostępniane na licencji <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Sama strona internetowa korzysta też, za Twoją zgodą, z Google Analytics i Microsoft Clarity do pomiaru ruchu i sposobu korzystania ze stron, Google Fonts i CDN jsDelivr do wczytywania czcionek i ikon, Google Sign-In, jeśli wybierzesz ten sposób logowania, oraz GitHub API do wyświetlania liczby gwiazdek projektu. Wczytanie strony wysyła więc zapytania do Google Fonts i jsDelivr (a na stronie głównej także do GitHub), które mogą zobaczyć Twój adres IP i przeglądarkę; z Google Analytics i Microsoft Clarity strona łączy się dopiero po wyrażeniu zgody na analitykę.",
                ),
                p(
                    "Ich regulaminy i dostępność są ich własną sprawą, i nie ponosimy za nie odpowiedzialności.",
                ),
            ],
        },
        {
            heading: "Brak gwarancji",
            blocks: [
                p(
                    "Usługa jest świadczona <strong>&bdquo;tak, jak jest&rdquo; i &bdquo;w miarę dostępności&rdquo;</strong>, bez żadnych gwarancji, wyraźnych ani dorozumianych, w tym dorozumianych gwarancji przydatności handlowej, przydatności do określonego celu, dokładności czy nienaruszania praw. Nie gwarantujemy, że usługa będzie działać bez przerw, będzie bezpieczna, wolna od błędów, ani że jakiekolwiek generowane przez nią dane czy wartości odżywcze są dokładne. Korzystasz z niej na własne ryzyko.",
                ),
            ],
        },
        {
            heading: "Ograniczenie odpowiedzialności",
            blocks: [
                p(
                    "W najszerszym zakresie dozwolonym przez prawo nie ponosimy odpowiedzialności za jakiekolwiek szkody pośrednie, przypadkowe, szczególne, wtórne czy przykładowe, ani za utratę danych czy zysków, wynikające z korzystania przez Ciebie z usługi lub z nim związane.",
                ),
            ],
        },
        {
            heading: "Twoje prawa ustawowe",
            blocks: [
                p(
                    "Niektórej odpowiedzialności nigdy nie da się wyłączyć, i nie próbujemy tego robić. Ponosimy pełną odpowiedzialność za śmierć lub obrażenia ciała spowodowane naszym zaniedbaniem oraz za oszustwo lub celowe wprowadzenie w błąd.",
                ),
                p(
                    "Zachowujesz też każde prawo, jakie daje Ci ustawa jako konsumentowi/konsumentce. Ten regulamin obowiązuje obok tych praw i ich nie ogranicza. Jeśli którykolwiek z powyższych punktów jest sprzeczny z prawem, którego nie możesz się zrzec, pierwszeństwo ma Twoje prawo ustawowe.",
                ),
            ],
        },
        {
            heading: "Zakończenie",
            blocks: [
                p(
                    "Możesz w dowolnej chwili zaprzestać korzystania z usługi i usunąć swoje konto zgodnie z opisem powyżej. Możemy zawiesić albo zakończyć dostęp, który narusza ten regulamin albo zagraża stabilności czy bezpieczeństwu usługi. Sekcje &bdquo;Brak gwarancji&rdquo;, &bdquo;Ograniczenie odpowiedzialności&rdquo; i &bdquo;Twoje prawa ustawowe&rdquo; obowiązują nadal po zakończeniu.",
                ),
            ],
        },
        {
            heading: "Zmiany w regulaminie",
            blocks: [
                p(
                    "Możemy od czasu do czasu aktualizować ten regulamin. Aktualna wersja zawsze znajduje się na tej stronie, z datą na górze wskazującą, kiedy została ostatnio zmieniona. Dalsze korzystanie z usługi po aktualizacji oznacza akceptację zmienionego regulaminu.",
                ),
            ],
        },
        {
            heading: "Rozdzielność postanowień",
            blocks: [
                p(
                    "Jeśli którakolwiek część tego regulaminu okaże się niewykonalna, ta część zostaje usunięta, a reszta pozostaje w mocy.",
                ),
            ],
        },
        {
            heading: "Kontakt",
            blocks: [
                p(
                    'Masz pytania dotyczące tego regulaminu lub swoich danych? Napisz na <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

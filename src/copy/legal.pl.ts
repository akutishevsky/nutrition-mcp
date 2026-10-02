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
    lead: "Jak Nutrition MCP przetwarza Twoje dane: co przechowujemy, do czego ich używamy, gdzie się znajdują i jak w każdej chwili usunąć konto ze wszystkimi danymi.",
    documentsLabel: "Dokumenty prawne",
    tocLabel: "Na tej stronie",
    metaDescription:
        "Jak Nutrition MCP przetwarza Twoje dane: co przechowujemy, do czego ich używamy, gdzie się znajdują i jak w każdej chwili usunąć konto ze wszystkimi danymi.",
    ogDescription:
        "Jak Nutrition MCP przetwarza Twoje dane: co przechowujemy, do czego ich używamy, gdzie się znajdują i jak w każdej chwili usunąć konto ze wszystkimi danymi.",
    lastUpdated: "29 września 2026",
    backToHome: "Wróć na stronę główną",
    sections: [
        {
            heading: "Co zbieramy",
            blocks: [
                p(
                    "Przy rejestracji przechowujemy, za pośrednictwem Supabase Auth, Twój <strong>adres e-mail</strong> i hasło zapisane w postaci bezpiecznego skrótu (hasha). Jeśli zamiast tego logujesz się przez Google, prosimy Google wyłącznie o Twój adres e-mail i otrzymujemy go razem z identyfikatorem Twojego konta Google, który Supabase Auth przechowuje, aby rozpoznać Cię przy następnym logowaniu przez Google. Nigdy nie widzimy hasła do konta Google. Konta, do których logowano się przez Google przed 27 września 2026, mogą nadal zawierać imię i nazwisko oraz zdjęcie profilowe przekazane wtedy przez Google. Usługa nigdzie ich nie odczytuje ani nie wyświetla poza eksportem Twoich danych; są one usuwane razem z Twoim kontem.",
                ),
                p("Gdy korzystasz z usługi, przechowujemy:"),
                ul([
                    "<strong>Wpisy posiłków</strong> — opis, typ posiłku, kalorie, makroskładniki, błonnik, cukry ogółem, gramy alkoholu, miligramy kofeiny, notatki i znaczniki czasu. Zdjęcia jedzenia interpretuje Twój asystent AI — nigdy nie są do nas przesyłane ani przez nas przechowywane.",
                    "<strong>Wpisy wody</strong> — ilość, notatki i znaczniki czasu.",
                    "<strong>Wpisy masy ciała</strong> — waga, notatki i znaczniki czasu. To dane dotyczące zdrowia i traktujemy je dokładnie tak samo jak pozostałe wpisy.",
                    "<strong>Cele</strong> — Twoje dzienne cele dla kalorii, białka, węglowodanów, tłuszczu, błonnika, cukru, alkoholu, kofeiny i wody oraz Twoja waga docelowa.",
                    "<strong>Ustawienia profilu</strong> — Twoja strefa czasowa IANA, preferowana jednostka wagi, informacja, czy śledzenie alkoholu jest włączone i w jakich porcjach standardowych wyświetlany jest alkohol, czy widżety w czacie są włączone oraz w jakim języku się wyświetlają.",
                    "<strong>Telemetria korzystania z narzędzi</strong> — dla każdego wywołania narzędzia MCP: które narzędzie zostało uruchomione, czy wywołanie się powiodło, ile trwało, ogólna kategoria błędu w razie niepowodzenia, długość w dniach każdego zakresu dat, o który prosisz, identyfikator sesji MCP, wersja protokołu MCP, z którą połączyła się Twoja aplikacja AI, a także nazwa i wersja, jakimi ta aplikacja się przedstawia (na przykład &bdquo;claude-ai/1.0&rdquo;), o ile je przesyła. Telemetria jest powiązana z identyfikatorem Twojego konta. Nigdy nie zawiera treści Twoich wpisów.",
                    "<strong>Dziennik zdarzeń serwera</strong> — dla każdego żądania do serwera: metoda, ścieżka, status i czas odpowiedzi, Twój adres IP z usuniętą ostatnią częścią, a w przypadku żądań MCP także wersja protokołu oraz nazwa i wersja, jakie podaje Twoja aplikacja AI. Przy każdym wywołaniu narzędzia dziennik zapisuje również nazwę narzędzia, informację, czy wywołanie się powiodło, i czas jego trwania, a w razie niepowodzenia krótki kod referencyjny i komunikat błędu, który może powtarzać wartość przesłaną przez Twoją aplikację AI, na przykład nieprawidłową datę. Gdy Twoja aplikacja AI loguje się lub odnawia połączenie, rejestrowane są: wynik tej operacji, losowy identyfikator, który aplikacja otrzymała przy rejestracji w naszej usłudze logowania, oraz witryna, na którą aplikacja chciała wrócić (na przykład claude.ai). Dziennik jest prowadzony u naszego dostawcy hostingu, nie zawiera identyfikatora Twojego konta ani adresu e-mail i jest przechowywany tylko przez krótki czas: to bufor cykliczny, w którym nowy ruch na bieżąco nadpisuje starsze wiersze.",
                ]),
                p(
                    "<strong>Informacje o alkoholu to również dane dotyczące zdrowia</strong>, i to bardziej wrażliwe niż liczba kalorii, dlatego obowiązują tu inne zasady niż w przypadku wszystkiego powyżej. Śledzenie alkoholu jest domyślnie wyłączone, a alkohol zapisujemy wyłącznie wtedy, gdy pochodzi od Ciebie — z zapisanego przez Ciebie drinka albo z kolumny w importowanym pliku. Nic nie ustala go za Ciebie. Wyłączenie tego ustawienia ma dwa skutki: importer zbiorczy przestaje odczytywać kolumnę alkoholu z przesyłanych przez Ciebie plików, a pozostałe funkcje przestają pokazywać Ci alkohol w posiłkach, celach, postępach i widżetach. Nie jest to przełącznik usuwania danych. Alkohol zapisany bezpośrednio przez Ciebie jest rejestrowany bez względu na to, czy ustawienie jest włączone. Wszystko, co już zapisano, zostaje w bazie danych i nadal trafia do pliku z posiłkami w każdym eksporcie, jaki wykonasz. Aby naprawdę usunąć zapisaną ilość alkoholu, usuń posiłek, do którego należy, albo usuń konto.",
                ),
                p(
                    "Przechowujemy też tokeny dostępu i odświeżania OAuth oraz kody autoryzacyjne, dzięki którym Twój asystent AI pozostaje połączony z Twoim kontem; okres ważności każdego z nich opisujemy w sekcji &bdquo;Jak długo przechowujemy dane&rdquo;. Przechowujemy je wyłącznie w postaci jednokierunkowych skrótów (hashy).",
                ),
            ],
        },
        {
            heading: "Jak wykorzystujemy dane",
            blocks: [
                p(
                    "Dane o Twoich posiłkach, wodzie, wadze i celach wykorzystujemy wyłącznie do świadczenia usługi śledzenia odżywiania oraz — w anonimowej, zbiorczej postaci — do publicznych statystyk na stronie głównej. <strong>Nigdy ich nie sprzedajemy, nie udostępniamy podmiotom trzecim ani nie wykorzystujemy do reklam</strong> i nie przekazujemy ich do żadnych systemów reklamowych ani profilujących.",
                ),
                p(
                    "Strona główna i publiczne źródło statystyk, z którego korzysta, pokazują anonimowe sumy dla całej usługi — ile posiłków zapisano, ich kalorie i makroskładniki, ilość zapisanej wody oraz łączny spadek wagi netto ze wszystkich kont — a także strefy czasowe ustawione w profilach, które strona główna przedstawia na mapie świata. Strefa czasowa pojawia się na mapie dopiero wtedy, gdy używają jej co najmniej trzy profile, a żadna liczba nie jest powiązana z konkretną osobą.",
                ),
                p(
                    'Gdy Ty lub Twój asystent AI wyszukujecie kod kreskowy, nasz serwer wysyła do <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> wyłącznie cyfry kodu — nigdy danych Twojego konta, adresu e-mail ani wpisów — a zwrócone dane produktu przechowuje we wspólnej pamięci podręcznej, która nie jest powiązana z żadnym użytkownikiem.',
                ),
                p(
                    "Prowadzimy dwa rodzaje analityki i żaden z nich nie obejmuje treści Twoich wpisów:",
                ),
                ul([
                    "<strong>Analityka strony.</strong> Za Twoją zgodą te strony wczytują Google Analytics, który dostarcza nam zbiorczych statystyk ruchu (odsłony, strony odsyłające, przybliżona lokalizacja, typ urządzenia), oraz Microsoft Clarity, który rejestruje, jak odwiedzający korzystają z witryny (kliknięcia, dotknięcia, przewijanie, ruchy myszy), w postaci nagrań sesji i map cieplnych, dzięki czemu widzimy, w których miejscach odwiedzający się gubią. Żadne z tych narzędzi nie wczytuje się, dopóki nie wyrazisz zgody w banerze plików cookie; jeśli odmówisz, nie wczyta się żadne z nich, a jeśli Twoja przeglądarka wysyła sygnał Global Privacy Control, nie wczytają się, chyba że samodzielnie wyrazisz zgodę w stopce. Zgoda obejmuje wyłącznie przechowywanie danych analitycznych: przechowywanie danych reklamowych i Google Signals pozostają wyłączone. Google otrzymuje Twój adres IP przy każdym żądaniu, ale — jak deklaruje Google — w przypadku odwiedzających z UE, Szwajcarii i Wielkiej Brytanii nie zapisuje go w logach ani nie przechowuje, a wykorzystuje wyłącznie do ustalenia przybliżonej lokalizacji. Clarity maskuje to, co wpisujesz w formularzach, i również otrzymuje Twój adres IP oraz informacje o przeglądarce. Żadne z nich nie działa na stronie logowania. Zgodę możesz w każdej chwili wycofać przyciskiem &bdquo;Ustawienia plików cookie&rdquo; w stopce, co usuwa też analityczne pliki cookie zapisane przez tę witrynę; Twój wybór jest przechowywany w pamięci lokalnej przeglądarki przez maksymalnie 6 miesięcy.",
                    "<strong>Telemetria serwera.</strong> Każde wywołanie narzędzia MCP zapisuje jeden wiersz telemetrii użycia — które narzędzie zostało uruchomione, czy się powiodło, ile trwało oraz która wersja protokołu MCP i która aplikacja AI (według podawanej przez nią nazwy i wersji) wykonała wywołanie. Wiersz jest powiązany z identyfikatorem Twojego konta, ale nie z treścią Twoich wpisów. Te dane służą nam do wykrywania wolnych i niedziałających narzędzi. Nie udostępniamy ich nikomu, a gdy usuwasz konto, są usuwane razem z całą resztą.",
                ]),
                p(
                    "Ponieważ strona wczytuje czcionki i ikony z Google Fonts i jsDelivr, przy odwiedzaniu tych stron Twój adres IP trafia do tych dostawców. Liczbę gwiazdek projektu na GitHubie pobiera nasz serwer, a nie Twoja przeglądarka, więc GitHub nigdy nie widzi Twojej wizyty.",
                ),
            ],
        },
        {
            heading: "Gdzie przechowujemy dane",
            blocks: [
                p(
                    'Wszystkie dane są przechowywane w <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a> (PostgreSQL) w UE, w irlandzkim regionie AWS (eu-west-1). Uwierzytelnianie i przechowywanie eksportów obsługuje Supabase w tym samym regionie. Serwer działa w infrastrukturze DigitalOcean we Frankfurcie nad Menem w Niemczech. Żądania do strony i serwera przechodzą przez sieć Cloudflare (z której korzysta nasz dostawca hostingu). Cloudflare odszyfrowuje połączenie, więc w trakcie przesyłania przetwarza wszystko, co trafia do usługi i z niej wychodzi, w tym Twój adres IP, a także może ustawić ściśle niezbędny plik cookie chroniący przed botami (<code>__cf_bm</code>, 30 minut).',
                ),
            ],
        },
        {
            heading: "Jak długo przechowujemy dane",
            blocks: [
                p(
                    "Twoje wpisy posiłków, wody i wagi, cele, ustawienia profilu oraz telemetrię korzystania z narzędzi przechowujemy tak długo, jak istnieje Twoje konto — żadne z tych danych nie mają osobnego terminu wygaśnięcia ani zaplanowanego usunięcia. Po usunięciu konta wszystkie są usuwane natychmiast i nieodwracalnie, jak opisano poniżej. Jedyne ślady, jakie pozostają, to: wiersz telemetrii dotyczący samego usunięcia, zapisany bez identyfikatora Twojego konta; opisany wyżej krótkotrwały dziennik zdarzeń serwera, który nigdy nie zawiera identyfikatora Twojego konta; własne dzienniki operacyjne naszego dostawcy bazy danych, przechowywane przez ograniczony czas (w naszym planie do 7 dni); oraz jego rotacyjne kopie zapasowe, które wygasają zgodnie z jego własnym harmonogramem.",
                ),
                p(
                    "Dane uwierzytelniające są z założenia krótkotrwałe. Sesja strony logowania trwa 10 minut i jest przechowywana w pamięci serwera; z Twoją przeglądarką wiąże ją ściśle niezbędny plik cookie, który zawiera wyłącznie losową wartość, wygasa po tych samych 10 minutach i jest usuwany po zakończeniu logowania. Do sprawdzenia Twojego hasła lub logowania przez Google używamy Supabase Auth, który za każdym razem tworzy sesję logowania Supabase; nigdy z niej nie korzystamy i od razu ją kończymy. Jednorazowy kod autoryzacyjny przekazywany Twojej aplikacji AI wygasa po 10 minutach i jest usuwany, gdy tylko zostanie użyty. Token dostępu jest ważny przez 24 godziny (nieliczne tokeny wydane do 27 września 2026 włącznie wygasają najpóźniej 6 października 2026); token odświeżania jest ważny przez 90 dni i jest usuwany w chwili, gdy zostanie użyty do uzyskania nowej pary tokenów. Wygasłe tokeny i kody są usuwane automatycznie w ciągu godziny. Usunięcie konta natychmiast usuwa je wszystkie.",
                ),
                p(
                    "Archiwa eksportu są krótkotrwałe. Każdy nowy eksport nadpisuje poprzedni, a plik jest automatycznie usuwany, gdy tylko wygaśnie jego link do pobrania, ważny 60 minut. Czyszczenie uruchamia się co dziesięć minut, więc archiwum jest zwykle przechowywane nie dłużej niż około 70 minut.",
                ),
            ],
        },
        {
            heading: "Usuwanie danych",
            blocks: [
                p(
                    "W każdej chwili możesz usunąć konto i wszystkie powiązane z nim dane: wystarczy, że poprosisz asystenta AI połączonego z serwerem Nutrition MCP o <strong>usunięcie konta</strong>. Usunięcie następuje natychmiast i jest nieodwracalne. Obejmuje Twoje wpisy posiłków, wody i wagi, cele, ustawienia profilu, archiwum eksportu, jeśli jest jeszcze przechowywane, telemetrię korzystania z narzędzi, tokeny dostępu oraz samo konto. Dotyczy to również każdej ilości alkoholu, jaką kiedykolwiek zapisano na Twoim koncie, niezależnie od tego, czy śledzenie alkoholu było włączone.",
                ),
            ],
        },
        {
            heading: "Kontakt i Twoje prawa",
            blocks: [
                p(
                    'Nutrition MCP prowadzi Anton Kutishevskyi, niezależny programista, który jest administratorem Twoich danych osobowych w związku z tą usługą. W sprawach dotyczących Twoich danych lub tej polityki napisz na adres <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
                p("Na jakiej podstawie przetwarzamy Twoje dane:"),
                ul([
                    "<strong>Twoje konto i wpisy</strong> — aby świadczyć Ci usługę, w której masz konto (wykonanie umowy). Posiłki, waga i alkohol to dane dotyczące zdrowia, więc przetwarzamy je na podstawie Twojej wyraźnej zgody. Wyrażasz ją przy zakładaniu konta i przy każdym logowaniu (a jeśli aplikację połączono, zanim strona logowania zaczęła prosić o tę zgodę — zapisując wpisy aż do najbliższego logowania). Możesz ją w każdej chwili wycofać, usuwając wpisy albo konto.",
                    "<strong>Telemetria korzystania z narzędzi i dziennik zdarzeń serwera</strong> — nasz prawnie uzasadniony interes w utrzymaniu sprawnego, szybkiego i bezpiecznego działania usługi (wykrywanie niedziałających narzędzi, ograniczanie nadużyć za pomocą limitów zapytań). Żadne z nich nie zawiera treści Twoich wpisów.",
                    "<strong>Analityka strony</strong> — Twoja zgoda, wyrażona w banerze plików cookie, którą możesz w każdej chwili wycofać przyciskiem &bdquo;Ustawienia plików cookie&rdquo; w stopce.",
                ]),
                p(
                    "Twoje prawa i jak z nich skorzystać — w większości przypadków nie musisz nawet do nas pisać:",
                ),
                ul([
                    "<strong>Dostęp i przenoszenie danych</strong> — poproś asystenta AI o eksport swoich danych. Otrzymasz archiwum ZIP z plikami CSV zawierającymi wszystko, co o Tobie przechowujemy: Twoje wpisy posiłków, wody i wagi, cele, ustawienia, dane konta (adres e-mail, metody i daty logowania oraz imię i nazwisko lub zdjęcie, jeśli przekazał je Google), telemetrię korzystania z narzędzi oraz połączenia, dzięki którym Twoje aplikacje AI pozostają zalogowane — bez samych tokenów. Archiwum nie obejmuje: wartości, które ze względów bezpieczeństwa przechowujemy wyłącznie w postaci jednokierunkowych skrótów (Twojego hasła i tokenów Twoich połączeń), wewnętrznych danych technicznych, takich jak klucze do wykrywania duplikatów, dziennika zdarzeń serwera, który nie zawiera identyfikatora Twojego konta, ani własnych krótkotrwałych dzienników i rotacyjnych kopii zapasowych naszych dostawców.",
                    "<strong>Sprostowanie</strong> — poproś asystenta AI o poprawienie lub usunięcie dowolnego wpisu posiłku, wody czy wagi albo o zmianę celów i ustawień.",
                    "<strong>Usunięcie danych</strong> — poproś asystenta AI o usunięcie konta; wszystkie dane zostaną od razu usunięte.",
                    "<strong>Sprzeciw i ograniczenie przetwarzania</strong> — napisz do nas.",
                    "<strong>Skarga</strong> — możesz złożyć skargę do organu nadzorczego ds. ochrony danych w miejscu, w którym mieszkasz lub pracujesz. Będziemy jednak wdzięczni, jeśli najpierw dasz nam szansę rozwiązać problem.",
                ]),
                p(
                    "Wszystko, co przechowujemy, pozostaje we wskazanym wyżej regionie UE. To, co Twój asystent AI odczytuje za pomocą narzędzi, trafia do dostawcy tego asystenta, który może znajdować się poza UE; dzieje się to na podstawie Twojej własnej umowy z tym dostawcą, a nie naszej. Poza UE znajdują się również Cloudflare (sieć, przez którą przechodzi każde żądanie), Google i Microsoft (analityka strony, Google Sign-In) oraz Google i jsDelivr (opisane wyżej zapytania o czcionki i ikony); jeśli otrzymują dane osobowe poza UE, opierają się na standardowych klauzulach umownych Komisji Europejskiej albo na ramach ochrony danych UE–USA (EU–US Data Privacy Framework).",
                ),
                p(
                    'Usługa nie jest przeznaczona dla osób poniżej 16 lat, a <a href="/terms" data-legal-link="terms">Regulamin</a> wymaga ukończenia 16 lat. Jeśli uważasz, że konto założyła młodsza osoba, napisz do nas, a je usuniemy.',
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
                    'Korzystanie z usługi podlega również naszemu <a href="/terms" data-legal-link="terms">Regulaminowi</a>, który określa zasady dopuszczalnego korzystania, wyjaśnia, że nic w usłudze nie stanowi porady medycznej, i informuje o braku jakichkolwiek gwarancji — usługa jest świadczona &bdquo;tak, jak jest&rdquo;, bezpłatnie, bez gwarancji dostępności, dokładności ani przydatności do jakiegokolwiek celu.',
                ),
            ],
        },
    ],
};

export const TERMS_PL: LegalDoc = {
    title: "Regulamin",
    lead: "Zasady korzystania z Nutrition MCP — darmowej aplikacji open source do śledzenia odżywiania i zdalnego serwera MCP dla Claude i ChatGPT.",
    documentsLabel: "Dokumenty prawne",
    tocLabel: "Na tej stronie",
    metaDescription:
        "Zasady korzystania z Nutrition MCP — darmowej aplikacji open source do śledzenia odżywiania i zdalnego serwera MCP dla Claude i ChatGPT. Regulamin prostym językiem: konto, dopuszczalne korzystanie, Twoje dane i odpowiedzialność.",
    ogDescription:
        "Zasady korzystania z Nutrition MCP — darmowej aplikacji open source do śledzenia odżywiania i zdalnego serwera MCP dla Claude i ChatGPT.",
    lastUpdated: "29 września 2026",
    backToHome: "Wróć na stronę główną",
    sections: [
        {
            heading: "Umowa",
            blocks: [
                p(
                    "Ten regulamin określa zasady korzystania z Nutrition MCP (dalej: &bdquo;usługa&rdquo;), czyli strony internetowej pod adresem nutrition-mcp.com oraz zdalnego serwera MCP pod adresem <strong>https://nutrition-mcp.com/mcp</strong>. Zakładając konto albo łącząc asystenta AI z serwerem, akceptujesz ten regulamin. Jeśli się z nim nie zgadzasz, nie korzystaj z usługi.",
                ),
                p(
                    "Usługę prowadzi Anton Kutishevskyi, niezależny programista (dalej: &bdquo;my&rdquo;).",
                ),
            ],
        },
        {
            heading: "Usługa",
            blocks: [
                p(
                    'Nutrition MCP to darmowa aplikacja open source do śledzenia odżywiania, działająca jako serwer MCP: pozwala asystentom AI, takim jak Claude i ChatGPT, zapisywać w Twoim imieniu posiłki, wodę i masę ciała. Nie ma płatnego planu, reklam ani żadnych opłat za korzystanie z usługi. Przyjmujemy dobrowolne darowizny za pośrednictwem serwisu Patreon, które pomagają pokryć koszty hostingu i bazy danych; są one darowizną, a nie zakupem, i nie dają żadnych funkcji, planu ani jakiegokolwiek pierwszeństwa. Kod źródłowy jest opublikowany na licencji MIT w serwisie <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub</a> i możesz go swobodnie hostować samodzielnie.',
                ),
            ],
        },
        {
            heading: "Twoje konto",
            blocks: [
                p(
                    "Aby korzystać z usługi, musisz mieć ukończone 16 lat. Nie weryfikujemy wieku, więc zakładając konto, potwierdzasz, że spełniasz ten wymóg. Odpowiadasz za zachowanie w poufności swoich danych logowania oraz za wszelkie działania wykonywane na Twoim koncie. Podaj adres e-mail, do którego faktycznie masz dostęp — tylko dzięki niemu odzyskasz dostęp do konta.",
                ),
                p(
                    "Z usługi możesz korzystać tylko tam, gdzie obsługuje ją Twój dostawca AI i gdzie pozwalają na to obowiązujące przepisy dotyczące sankcji i kontroli eksportu.",
                ),
            ],
        },
        {
            heading: "To nie jest porada medyczna",
            blocks: [
                p(
                    "Nutrition MCP to narzędzie do zapisywania i raportowania, a nie usługa medyczna. Nic, co generuje — wartości kalorii i makroskładników, cele, trendy ani komentarze dodawane przez Twojego asystenta AI — nie stanowi porady medycznej, żywieniowej ani dietetycznej i nie zastępuje wykwalifikowanego specjalisty. Przed podjęciem decyzji dotyczących zdrowia skonsultuj się z lekarzem albo dietetykiem, zwłaszcza jeśli masz problemy zdrowotne albo masz za sobą zaburzenia odżywiania.",
                ),
                p(
                    "Usługa nie jest przeznaczona do zastosowań klinicznych. Bez udziału lekarza prowadzącego nie powinny z niej korzystać osoby z aktywnymi zaburzeniami odżywiania ani osoby w ciąży lub pozostające pod opieką lekarską z powodu schorzenia związanego z odżywianiem. W takich sytuacjach śledzenie kalorii i makroskładników może szkodzić. Jeśli dotyczy to Ciebie, przed rozpoczęciem korzystania z usługi porozmawiaj ze swoim lekarzem prowadzącym.",
                ),
                p(
                    "Wartości odżywcze to <strong>szacunki</strong>. Pochodzą z modeli AI interpretujących Twoje opisy i zdjęcia, z zewnętrznych baz danych, takich jak Open Food Facts, oraz z danych, które wprowadzasz samodzielnie. Mogą być błędne. Sprawdzaj wszystko, co jest dla Ciebie ważne.",
                ),
                p(
                    "Zdjęcia jedzenia nigdy nie są wysyłane na nasz serwer. Twój asystent AI interpretuje zdjęcie po swojej stronie i przesyła nam wyłącznie wynik w postaci tekstu i liczb: opis, typ posiłku, kalorie, makroskładniki, notatki, kod kreskowy.",
                ),
            ],
        },
        {
            heading: "Dopuszczalne korzystanie",
            blocks: [
                p("Korzystając z usługi, zobowiązujesz się nie:"),
                ul([
                    "wykorzystywać jej w celach niezgodnych z prawem ani z naruszeniem obowiązujących przepisów;",
                    "próbować uzyskać dostępu do konta lub danych innego użytkownika ani omijać uwierzytelniania, limitów zapytań czy jakichkolwiek innych zabezpieczeń technicznych;",
                    "badać, skanować ani przeciążać usługi lub infrastruktury, na której działa, ani zakłócać ich pracy, w tym za pomocą automatycznych masowych zapytań;",
                    "przesyłać treści niezgodnych z prawem ani takich, do których udostępniania nie masz prawa;",
                    "odsprzedawać hostowanej przez nas usługi ani przedstawiać jej jako własnej;",
                    "wykorzystywać jej do skrajnego ograniczania kalorii ani do promowania takich praktyk, zachęcania do nich innych osób czy coachowania kogokolwiek w tym kierunku.",
                ]),
                p(
                    "Usługa ma limity zapytań, żeby pozostała dostępna dla wszystkich. Jeśli potrzebujesz większej liczby zapytań, hostuj ją samodzielnie — właśnie po to jest licencja MIT.",
                ),
            ],
        },
        {
            heading: "Twoje dane",
            blocks: [
                p(
                    'Twoje wpisy należą do Ciebie. Przechowujemy je i przetwarzamy, aby świadczyć Ci usługę, zgodnie z opisem w naszej <a href="/privacy" data-legal-link="privacy">Polityce prywatności</a>. Odpowiadasz za treści, które zapisujesz.',
                ),
                p(
                    "W każdej chwili możesz wyeksportować wszystkie swoje dane — wystarczy poprosić o to asystenta AI. Eksport to archiwum ZIP z plikami CSV zawierającymi Twoje posiłki, wodę, wagę, cele, ustawienia profilu, dane konta, telemetrię korzystania z narzędzi i połączone aplikacje AI; alkohol jest w nim uwzględniony niezależnie od tego, czy śledzenie alkoholu jest włączone. Link do pobrania, który przekazujemy, jest prywatny i wygasa po 60 minutach.",
                ),
                p(
                    "Rejestrujemy też podstawową telemetrię operacyjną o tym, jak usługa jest wykorzystywana: dla każdego wywołania narzędzia jego nazwę, informację, czy się powiodło, czas trwania, ogólną kategorię błędu w razie niepowodzenia, długość każdego zakresu dat, o który prosisz, identyfikator sesji, wersję protokołu MCP, z którą połączyła się Twoja aplikacja AI, oraz nazwę i wersję, jakimi ta aplikacja się przedstawia. Te wiersze są powiązane z identyfikatorem Twojego konta. Nie zawierają treści Twoich wpisów — żadnych opisów jedzenia, kalorii ani wagi. Służą nam do utrzymania usługi w działaniu i oceny, które narzędzia warto ulepszyć, a gdy usuwasz konto, są usuwane razem z całą resztą.",
                ),
                p(
                    "W każdej chwili możesz usunąć konto i wszystkie powiązane z nim dane: wystarczy, że poprosisz połączonego asystenta AI o <strong>usunięcie konta</strong>. Usunięcie następuje natychmiast i jest nieodwracalne.",
                ),
            ],
        },
        {
            heading: "Dostępność i zmiany",
            blocks: [
                p(
                    "Usługa jest oferowana bezpłatnie, bez zobowiązań co do ciągłości działania i bez umowy o poziomie usług (SLA). W dowolnym momencie i bez uprzedzenia możemy zmienić, zawiesić albo wycofać dowolną jej część — w tym narzędzia, funkcje i sam hostowany serwer. Możemy też modyfikować albo usuwać treści naruszające ten regulamin.",
                ),
            ],
        },
        {
            heading: "Usługi podmiotów trzecich",
            blocks: [
                p(
                    "Usługa opiera się na podmiotach trzecich: Supabase (baza danych, uwierzytelnianie i przechowywanie eksportów), DigitalOcean (hosting), Cloudflare (za pośrednictwem naszego dostawcy hostingu; sieć, przez którą przechodzi każde żądanie), Open Food Facts (dane z kodów kreskowych) oraz asystent AI, przez którego się łączysz.",
                ),
                p(
                    'Dane produktów z kodów kreskowych &copy; współtwórcy <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a>, udostępniane na licencji <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">Open Database License (ODbL)</a>.',
                ),
                p(
                    "Sama strona internetowa korzysta też: za Twoją zgodą z Google Analytics i Microsoft Clarity do pomiaru ruchu i sposobu korzystania ze stron, z Google Fonts i CDN jsDelivr do wczytywania czcionek i ikon, z Google Sign-In, jeśli wybierzesz ten sposób logowania, oraz z GitHub API, z którego liczbę gwiazdek projektu pobiera nasz serwer (a nie Twoja przeglądarka), dzięki czemu żadne dane odwiedzających nie trafiają do GitHuba. Wczytanie strony wysyła więc zapytania do Google Fonts i jsDelivr, które mogą widzieć Twój adres IP i przeglądarkę; z Google Analytics i Microsoft Clarity strona łączy się dopiero po wyrażeniu przez Ciebie zgody na analitykę.",
                ),
                p(
                    "Za swoje regulaminy i dostępność odpowiadają te podmioty, a my nie ponosimy za nie odpowiedzialności.",
                ),
            ],
        },
        {
            heading: "Brak gwarancji",
            blocks: [
                p(
                    "Usługa jest świadczona <strong>&bdquo;tak, jak jest&rdquo; i &bdquo;w miarę dostępności&rdquo;</strong>, bez jakichkolwiek gwarancji, wyraźnych ani dorozumianych, w tym dorozumianych gwarancji przydatności handlowej, przydatności do określonego celu, dokładności czy nienaruszania praw osób trzecich. Nie gwarantujemy, że usługa będzie działać bez przerw, bezpiecznie i bezbłędnie ani że jakiekolwiek generowane przez nią dane czy wartości odżywcze będą dokładne. Korzystasz z niej na własne ryzyko.",
                ),
            ],
        },
        {
            heading: "Ograniczenie odpowiedzialności",
            blocks: [
                p(
                    "W najszerszym zakresie dozwolonym przez prawo nie ponosimy odpowiedzialności za jakiekolwiek szkody pośrednie, przypadkowe, szczególne ani następcze, za odszkodowanie o charakterze represyjnym ani za utratę danych lub zysków, wynikające z korzystania przez Ciebie z usługi lub z nim związane.",
                ),
            ],
        },
        {
            heading: "Twoje prawa ustawowe",
            blocks: [
                p(
                    "Pewnych rodzajów odpowiedzialności nigdy nie da się wyłączyć i nie próbujemy tego robić. Nadal ponosimy pełną odpowiedzialność za śmierć lub uszkodzenie ciała spowodowane naszym zaniedbaniem oraz za oszustwo lub podstępne wprowadzenie w błąd.",
                ),
                p(
                    "Zachowujesz też wszystkie uprawnienia, jakie przysługują Ci z mocy prawa jako konsumentowi. Ten regulamin obowiązuje obok tych uprawnień i ich nie ogranicza. Jeśli któreś z powyższych postanowień jest sprzeczne z uprawnieniem, którego nie możesz się zrzec, pierwszeństwo ma Twoje uprawnienie ustawowe.",
                ),
            ],
        },
        {
            heading: "Zakończenie korzystania z usługi",
            blocks: [
                p(
                    "W każdej chwili możesz przestać korzystać z usługi i usunąć konto w sposób opisany powyżej. Możemy zawiesić albo odebrać dostęp, jeśli sposób korzystania z usługi narusza ten regulamin albo zagraża stabilności lub bezpieczeństwu usługi. Sekcje &bdquo;Brak gwarancji&rdquo;, &bdquo;Ograniczenie odpowiedzialności&rdquo; i &bdquo;Twoje prawa ustawowe&rdquo; pozostają w mocy także po zakończeniu korzystania z usługi.",
                ),
            ],
        },
        {
            heading: "Zmiany w regulaminie",
            blocks: [
                p(
                    "Możemy od czasu do czasu aktualizować ten regulamin. Aktualna wersja zawsze znajduje się na tej stronie, a data na górze pokazuje, kiedy została ostatnio zmieniona. Dalsze korzystanie z usługi po aktualizacji oznacza akceptację zmienionego regulaminu.",
                ),
            ],
        },
        {
            heading: "Rozdzielność postanowień",
            blocks: [
                p(
                    "Jeśli którekolwiek postanowienie tego regulaminu okaże się niewykonalne, zostaje ono pominięte, a pozostałe postanowienia pozostają w mocy.",
                ),
            ],
        },
        {
            heading: "Kontakt",
            blocks: [
                p(
                    'Masz pytania dotyczące tego regulaminu lub swoich danych? Napisz na adres <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
                ),
            ],
        },
    ],
};

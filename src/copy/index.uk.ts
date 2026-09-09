// Ukrainian translation of IndexDoc for the landing page. See
// src/copy/index.ts for the structural notes: which four fields carry
// trusted HTML (`connect.claude.steps`, `connect.chatgpt.steps`,
// `connect.other.noteHtml`, `faq[].visibleHtml`) and why everything else
// is plain text that the generator escapes. Every tag in those four fields
// is kept verbatim; the hero exchanges' `add` deltas and `clock` strings
// are numbers, not copy, and are copied from INDEX_EN unchanged.
//
// Locale notes:
//   - The site addresses the reader with the informal "ти", matching
//     chrome.uk.ts / tools.uk.ts.
//   - Thousands are grouped with a space ("2 000", "2 035") as Ukrainian
//     does, not the English comma; the widget figures the replay script
//     computes are formatted off <html lang>, so the goal string matches.
//   - `live.refreshAfter` carries a leading space (" с"): "5с" is not how
//     Ukrainian writes seconds, and the generator emits it right after the
//     digit.
//   - The onboarding "widget language" example says Ukrainian rather than
//     German, as the previous translation did — the point of the example
//     is that the widgets can speak the reader's own language.
//   - "What can I track?" and "Can I self-host it?" keep the previous
//     page's answers verbatim (the former is test-pinned on naming
//     caffeine in milligrams).

import type { IndexDoc } from "./index.js";

export const INDEX_UK: IndexDoc = {
    title: "Nutrition MCP — безкоштовний трекер калорій і макронутрієнтів для Claude, ChatGPT і Cursor",
    metaDescription:
        "Відстежуй калорії, білки, вуглеводи, жири, клітковину, цукор і кофеїн через розмову зі своїм ШІ. Nutrition MCP — безкоштовний MCP-сервер з відкритим кодом, що працює в Claude, ChatGPT, Cursor і будь-якому MCP-клієнті. Не треба встановлювати жодного застосунку.",
    ogDescription:
        "Безкоштовний MCP-сервер з відкритим кодом для підрахунку калорій і макронутрієнтів у Claude, ChatGPT і Cursor. Скажи, що ти з'їв, — він порахує решту.",
    keywords:
        "трекер харчування, лічильник калорій, трекер макронутрієнтів, MCP сервер, конектор Claude, застосунок ChatGPT, ШІ відстеження харчування, щоденник їжі, сканер штрихкодів, відкритий код, альтернатива MyFitnessPal",

    header: {
        nav: {
            how: "Як це працює",
            examples: "Приклади",
            live: "Наживо",
            tools: "Інструменти",
            donate: "Підтримати",
            faq: "FAQ",
        },
        connect: "Підключити",
    },

    hero: {
        titleBeforeEm: "Відстежуй харчування, просто ",
        titleEm: "розмовляючи",
        titleAfterEm: " зі своїм ШІ.",
        lead: "Nutrition MCP — безкоштовний трекер калорій і макронутрієнтів з відкритим кодом, що живе всередині Claude, ChatGPT, Cursor — будь-якого ШІ з підтримкою MCP. Скажи, що ти з'їв; він порахує калорії, білки, вуглеводи, жири, клітковину, цукор і кофеїн, запише все й покаже, як минає день. Не треба встановлювати жодного застосунку.",
        ctaPrimary: "Підключи за хвилину",
        ctaGithub: "GitHub",
        moreExamples: "Більше прикладів",
        chat: {
            status: "Nutrition · підключено",
            photoCaption: "📷 Фото",
            pauseLabel: "Призупинити демо",
            exchanges: [
                {
                    userText: "Вівсянка з ягодами і флет вайт на сніданок",
                    aiText: "Записано — близько 380 ккал, 14 г білка. Флет вайт додає 130 мг кофеїну.",
                    add: {
                        kcal: 380,
                        pro: 14,
                        car: 56,
                        fat: 11,
                        sugar: 12,
                        caf: 130,
                    },
                    clock: "08:04",
                },
                {
                    barcode: true,
                    aiText: "Це Coca-Cola 330 мл — 139 ккал, 35 г цукру, за даними Open Food Facts. Записано як перекус.",
                    add: { kcal: 139, car: 35, sugar: 35 },
                    clock: "11:30",
                },
                {
                    userText: "Пів літра води",
                    aiText: "Готово. Сьогодні вже 500 мл.",
                    add: { water: 500 },
                    clock: "12:10",
                },
                {
                    userText: "Великий салат із куркою гриль на обід",
                    aiText: "Записано — близько 540 ккал, 46 г білка. Ти на півдорозі до сьогоднішніх 2 000.",
                    add: { kcal: 540, pro: 46, car: 22, fat: 28, sugar: 6 },
                    clock: "13:22",
                    widget: true,
                },
                {
                    userText: "Як у мене справи сьогодні?",
                    aiText: "Ось сьогоднішній день — білок за планом, цукор близько до ліміту.",
                    add: {},
                    clock: "13:23",
                    widget: true,
                },
            ],
            widget: {
                title: "Сьогодні",
                goal: "ціль 2 000",
                kcalUnit: "ккал",
                protein: "Білки",
                carbs: "Вуглеводи",
                fat: "Жири",
                water: "Вода",
                sugar: "Цукор",
                caffeine: "Кофеїн",
                hint: "👆 Торкнись показника, щоб побачити прийоми їжі за ним",
            },
        },
    },

    how: {
        eyebrow: "Як це працює",
        title: "Три кроки. Жодного застосунку вчити не треба.",
        sub: "Як працює відстеження харчування з ШІ через MCP-сервер: підключись один раз, описуй свої прийоми їжі та проси зведення, коли захочеш.",
        steps: [
            {
                title: "Підключись один раз",
                body: "Додай сервер до Claude, ChatGPT чи будь-якого MCP-клієнта та увійди через Google або email. Це займає менше хвилини, і повторювати більше не доведеться.",
            },
            {
                title: "Просто скажи, що ти з'їв",
                body: "Опиши це звичайними словами — або надішли фото своєї страви, скриншот із застосунку доставки чи штрихкод (продукт буде знайдено онлайн). Макронутрієнти запишуться автоматично.",
            },
            {
                title: "Відстежуй і переглядай",
                body: "Попроси денні зведення, тижневі тренди, прогрес по цілях, або експортуй усе, що записав, у CSV-файли — цілком безкоштовно.",
            },
        ],
        counter: "{n} / 3",
    },

    connect: {
        eyebrow: "Швидке підключення",
        title: "Підключи Claude, ChatGPT чи Cursor менш ніж за хвилину.",
        sub: "Додай сервер Nutrition MCP до свого ШІ-клієнта, увійди через Google або через email і пароль — і починай записувати прийоми їжі. Нічого не треба встановлювати, нічого не треба вчити.",
        copyLabel: "Копіювати",
        copiedLabel: "Скопійовано",
        copyAriaLabel: "Копіювати URL сервера",
        bullets: [
            "Працює на будь-якому плані Claude і ChatGPT",
            "OAuth 2.0 — вхід обробляє твій клієнт",
            "Підключений у Claude чи ChatGPT, він з'явиться і на iOS та Android",
        ],
        otherTabLabel: "Інші клієнти",
        tabsLabel: "Обери свій AI-клієнт",
        claude: {
            steps: [
                "Відкрий <b>Claude</b> (у браузері чи застосунку) і натисни <b>Customize</b> у верхньому лівому куті.",
                "Натисни <b>Connectors</b>.",
                "Натисни <b>+</b>, а тоді <b>Add custom connector</b>.",
                "Дай йому назву, наприклад <b>Nutrition</b>.",
                "Встав <code>https://nutrition-mcp.com/mcp</code> у поле <b>Remote MCP server URL</b>.",
                "Натисни <b>Add</b>.",
                "Натисни <b>Connect</b> — відкриється сторінка входу; продовж через Google або увійди через email і пароль.",
                "Готово. Усе запрацює одразу і автоматично з'явиться в застосунках для iOS та Android.",
            ],
            note: "Працює на будь-якому плані Claude. Безкоштовний план дозволяє підключити один MCP-сервер одночасно.",
        },
        chatgpt: {
            steps: [
                "Відкрий <b>ChatGPT on the web</b> → <b>Settings</b> → <b>Apps</b>.",
                "Натисни <b>Create app</b> внизу спливного вікна. Якщо не бачиш цієї кнопки, увімкни <b>Developer mode</b> в <b>Advanced settings</b>.",
                "Дай йому назву, наприклад <b>Nutrition</b>.",
                "У полі <b>Connection</b> встав <code>https://nutrition-mcp.com/mcp</code>.",
                "У полі <b>Authentication</b> обери <b>OAuth</b> — решту залиш без змін.",
                "Натисни <b>Create</b>, а тоді <b>Sign in with Nutrition</b>.",
            ],
            note: "Працює на будь-якому плані ChatGPT.",
        },
        other: {
            noteHtml:
                "Додай конфігурацію вище до свого клієнта (Cursor, VS Code, Claude Code та інших). Windsurf використовує <code>serverUrl</code> замість <code>url</code>. У Claude Code виконай <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Твій клієнт сам обробить вхід через OAuth.",
        },
    },

    onboarding: {
        title: "Налаштуй усе за перші п'ять хвилин.",
        sub: "Жодних екранів налаштувань. Часовий пояс, цілі по калоріях і макронутрієнтах, мова віджетів — кожне з них одне речення, яке ти кажеш один раз.",
        stepLabel: "Крок {n}",
        justSay: "Просто скажи ",
        steps: [
            {
                title: "Встанови часовий пояс",
                body: "Щоб день змінювався опівночі за твоїм місцевим часом, а не чиїмось іншим.",
                say: "Встанови мій часовий пояс на Нью-Йорк",
            },
            {
                title: "Встанови свої цілі",
                body: "Денні калорії, макронутрієнти й вода, а також опціональна цільова вага.",
                say: "Встанови мою денну ціль на 2 000 калорій і 150 г білка",
            },
            {
                title: "Обери мову віджетів",
                body: "Мова, якою показуються віджети в чаті, — а не те, що ШІ пише тобі у відповідь.",
                say: "Показуй мої віджети українською",
            },
            {
                title: "Почни записувати",
                body: "Скажи, що ти з'їв, надішли фото або заскануй штрихкод.",
                say: "На сніданок я їв вівсянку з ягодами",
            },
        ],
    },

    examples: {
        title: "Розмова краща за тапання.",
        sub: "Запиши прийом їжі, заскануй штрихкод, переглянь свій тиждень — справжні розмови зі справжніми віджетами в чаті. Погортай кілька.",
        status: "Nutrition · підключено",
        prevLabel: "Попередній",
        nextLabel: "Наступний",
        pickerLabel: "Обери приклад",
        slides: [
            {
                title: "Запиши прийом їжі",
                sub: "Звичайні слова, жодної бази даних",
                userText: "На сніданок я їв вівсянку з ягодами і каву",
                aiText: "Записано сніданок — близько 320 ккал, 11 г білка. Кава додала 95 мг кофеїну.",
            },
            {
                title: "Заскануй штрихкод",
                sub: "Open Food Facts, у перерахунку на твою порцію",
                userText: "Заскануй цей штрихкод: 5449000000996",
                aiText: "Це Coca-Cola 330 мл — 139 ккал, 35 г цукру, за даними Open Food Facts. Скільки ти випив?",
            },
            {
                title: "Переглянь тиждень",
                sub: "Віджет трендів прямо в чаті",
                userText: "Яким був минулий тиждень?",
                aiText: "У середньому 2 035 ккал на день за 6 записаних днів — на 165 менше твоєї цілі. Білок був твоїм найстабільнішим макронутрієнтом.",
                widget: {
                    title: "Тренди",
                    sub: "7 днів",
                    big: "2 035",
                    cap: "середнє за день · 6 записаних днів",
                    from: "1 вер",
                    goal: "ціль 2 200",
                    today: "Сьогодні",
                },
            },
        ],
    },

    live: {
        eyebrow: "Наживо · усі, дотепер",
        title: "Десь сніданок, а десь уже вечеря.",
        sub: "Статистика харчування наживо з усіх акаунтів Nutrition MCP — калорії, записи їжі, макронутрієнти й скинута вага — оновлюється кожні п'ять секунд.",
        unitGroupLabel: "Одиниці",
        unitMetricLabel: "Метричні",
        unitImperialLabel: "Імперські",
        refreshBefore: "Оновлюється кожні 5 с · наступне через ",
        refreshAfter: " с",
        sinceOpenLabel: "з моменту відкриття сторінки",
        cards: {
            calories: "Записано калорій",
            foodLogs: "Записів їжі",
            protein: "Записано білків",
            carbs: "Записано вуглеводів",
            fat: "Записано жирів",
            weightLost: "Скинуто ваги з 2 липня 2026",
            water: "Записано води",
        },
        foodLogsUnit: "зап.",
        timezonesAfter:
            " часових поясів · день змінюється опівночі за місцевим часом кожного",
        mapNote: "розмір крапки = частка акаунтів · наведи на крапку",
        mapAriaLabel:
            "Точкова карта світу з акаунтами Nutrition MCP за часовими поясами; більші крапки означають більшу частку",
    },

    support: {
        eyebrow: "Завжди безкоштовно",
        title: "Безкоштовне відстеження харчування. Без преміум-тарифу. Ніколи.",
        sub: "Кожен інструмент, кожен віджет, кожен експорт — для всіх і безплатно. Це проєкт з відкритим кодом однієї людини, а код під ліцензією MIT, тож так буде й надалі.",
        bullets: [
            "Усі 36 інструментів і шість віджетів включено",
            "Без реклами, без допродажів, без заблокованих функцій",
            "Експортуй або видаляй свої дані будь-коли",
            "Розгорни самостійно, якщо хочеш — Dockerfile додається",
        ],
        patreon: {
            eyebrow: "Опціонально · Patreon",
            title: "Якщо він себе виправдовує, допоможи тримати сервер увімкненим.",
            sub: "Єдині витрати — хостинг і база даних. Їх покривають патрони — будь-яка сума, скасувати можна будь-коли. Нічого не розблоковується; ти лише першим читаєш нотатки про розробку й маєш голос у тому, що вийде наступним.",
            cta: "Підтримати на Patreon",
            starCta: "Або постав зірку",
        },
        postsTitle: "Останні дописи на Patreon",
        postsAll: "Усі дописи",
        postLinkLabel: "Читати на Patreon",
    },

    contact: {
        eyebrow: "Контакти",
        title: "Привітайся.",
        sub: "Знайшов баг, маєш ідею або він геть неправильно порахував прийом їжі? Напиши мені напряму — я читаю кожне повідомлення.",
        emailAriaLabel: "Написати на anton@nutrition-mcp.com",
        cards: {
            email: { title: "Email", sub: "Будь-що — прямий зв'язок" },
            issues: {
                title: "GitHub issues",
                sub: "Баги та запити функцій, публічно",
            },
            patreon: {
                title: "Patreon",
                sub: "Нотатки про розробку, голосування та чат патронів",
            },
        },
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Запитання про Nutrition MCP.",
        subBefore:
            "Що це, де працює, скільки коштує і хто бачить твої дані. Чогось бракує? ",
        subLink: "Запитай мене напряму",
        subAfter: ".",
        categoriesLabel: "Фільтрувати запитання за категорією",
        categories: {
            all: "Усі",
            basics: "Основи",
            clients: "Клієнти",
            tracking: "Відстеження",
            data: "Твої дані",
        },
    },
    faq: [
        // Basics
        {
            question: "Що таке Nutrition MCP?",
            visibleHtml:
                "Безкоштовний MCP-сервер (Model Context Protocol) з відкритим кодом для відстеження харчування. Підключи його до Claude, ChatGPT, Cursor чи будь-якого MCP-клієнта й записуй прийоми їжі, калорії, макронутрієнти, воду та вагу через розмову.",
            category: "basics",
        },
        {
            question: "Що таке MCP-сервер?",
            visibleHtml:
                "Невеликий сервіс, який твій ШІ може викликати під час розмови. Nutrition MCP дає Claude, ChatGPT, Cursor та іншим 36 інструментів для харчування — запис, цілі, тренди, імпорт і експорт. Ти ніколи не бачиш цих інструментів; ти просто говориш.",
            category: "basics",
        },
        {
            question: "Чи безкоштовний Nutrition MCP?",
            visibleHtml:
                "Так. Без преміум-тарифу, без реклами, без заблокованих функцій. Щоб підключитися, потрібен лише акаунт Claude чи ChatGPT. Донати на Patreon покривають рахунок за сервер.",
            category: "basics",
        },
        // Clients
        {
            // The visible answer states the server URL itself, so no
            // jsonLdText override is needed: stripping tags gives the same
            // sentence.
            question: "Чи працює це з ChatGPT?",
            visibleHtml:
                "Так. У ChatGPT в браузері відкрий Settings → Apps → Create app, встав <code>https://nutrition-mcp.com/mcp</code> з автентифікацією OAuth і увійди. Працює на будь-якому плані ChatGPT.",
            category: "clients",
        },
        {
            question: "Чи працює це з Cursor, VS Code чи Claude Code?",
            visibleHtml:
                "Так — з будь-яким клієнтом, що підтримує віддалені MCP-сервери через HTTP. Додай URL до свого <code>mcp.json</code> або в Claude Code виконай <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>.",
            category: "clients",
        },
        {
            question: "Чи працює це на телефоні?",
            visibleHtml:
                "Так. Підключи його один раз у Claude чи ChatGPT у браузері або на десктопі — і він автоматично з'явиться в їхніх застосунках для iOS та Android.",
            category: "clients",
        },
        // Tracking
        {
            // Kept from the previous landing page verbatim: test-pinned
            // (src/site-copy.test.ts checks that caffeine is named "in
            // milligrams" here and that the JSON-LD answer matches).
            question: "Що я можу відстежувати?",
            visibleHtml:
                "Калорії, білок, вуглеводи, жири, клітковину та воду для кожного запису — описані звичайними словами або отримані за штрихкодом продукту через Open Food Facts. Кофеїн теж відстежується, у міліграмах, одиниці, яку використовує кожна етикетка, і він не додає калорій. Алкоголь теж відстежується, у грамах чистого етанолу, щойно ти це ввімкнеш. Ти також можеш записувати вагу тіла в кг або фунтах і стежити за трендами до цільової ваги. Переглядай денні зведення, запитуй прийоми їжі за період, оновлюй чи видаляй минулі записи, встановлюй цілі та відстежуй тренди з часом.",
            category: "tracking",
        },
        {
            question: "Наскільки точний підрахунок калорій?",
            visibleHtml:
                "Показники — це оцінки на основі того, що ти описуєш, так, як їх оцінив би обізнаний друг: годяться для трендів, а не для медичних рішень. Сканування штрихкодів використовує дані Open Food Facts.",
            category: "tracking",
        },
        {
            question: "Чи відстежується алкоголь?",
            visibleHtml:
                "Лише якщо ти це ввімкнеш. Відстеження алкоголю за замовчуванням вимкнено; коли ввімкнено, напої записуються в грамах етанолу й показуються як американські стандартні порції або британські одиниці.",
            category: "tracking",
        },
        // Your data
        {
            // The closing sentence is pinned by src/site-copy.test.ts: the
            // export takes everything out, but only meals come back in.
            question:
                "Чи можу я імпортувати історію з MyFitnessPal чи Cronometer?",
            visibleHtml:
                "Так. Імпортуй історію прийомів їжі з MyFitnessPal, Cronometer, Lose It!, MacroFactor або будь-якого CSV, зіставивши його колонки — до 50 рядків за один виклик. Наразі назад можна імпортувати лише прийоми їжі.",
            category: "data",
        },
        {
            // Must name meals, water, weight, goals and profile — the five
            // files in the export archive (src/site-copy.test.ts).
            question: "Хто бачить мої дані і чи можу я їх експортувати?",
            visibleHtml:
                "Тільки ти. Експортуй усе — прийоми їжі, воду, вагу, цілі, профіль — як ZIP із CSV-файлів з 60-хвилинним посиланням на завантаження або одразу видали свій акаунт. Ліцензія MIT, тож можна й розгорнути самостійно.",
            category: "data",
        },
        {
            // Kept from the previous landing page.
            question: "Чи можу я розгорнути це самостійно?",
            visibleHtml:
                'Так. Nutrition MCP з відкритим кодом (MIT). Можеш запустити власний екземпляр із власним проєктом Supabase — <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">репозиторій на GitHub</a> містить повний гайд із самостійного розгортання та Dockerfile.',
            category: "data",
        },
    ],

    cta: {
        title: "Твій наступний прийом їжі — за одне речення.",
        sub: "Безкоштовне відстеження харчування з відкритим кодом для Claude, ChatGPT і Cursor — а твої дані завжди твої: експортуй або видаляй їх, коли захочеш.",
        primary: "Підключити зараз",
        secondary: "Постав зірку на GitHub",
    },

    footer: {
        blurb: "Безкоштовне відстеження харчування з відкритим кодом через розмову зі своїм ШІ. Створила й підтримує одна людина — akutishevsky.",
        copyEndpointAriaLabel: "Копіювати адресу сервера",
        social: { github: "GitHub", patreon: "Patreon", email: "Email" },
        product: {
            heading: "Продукт",
            connect: "Підключення",
            onboarding: "Перші п'ять хвилин",
            examples: "Приклади",
            live: "Статистика наживо",
            tools: "Усі 36 інструментів",
            alternatives: "Альтернативи MyFitnessPal та іншим",
        },
        openSource: {
            heading: "Відкритий код",
            source: "Код на GitHub",
            selfHost: "Гайд із самостійного розгортання",
            bug: "Повідомити про баг",
            llms: "llms.txt",
            licence: "Ліцензія MIT",
        },
        yourData: {
            heading: "Твої дані",
            privacy: "Політика приватності",
            terms: "Умови використання",
            exportCsv: "Експорт у CSV",
            deleteAccount: "Видалити акаунт",
            patreon: "Підтримати на Patreon",
            contact: "Контакти",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Дані штрихкодів від Open Food Facts",
        bottomPrivacy: "Приватність",
        bottomTerms: "Умови",
        bottomAlternatives: "Альтернативи",
        disclaimer: "Харчові показники — оцінки, а не медична консультація.",
    },
};

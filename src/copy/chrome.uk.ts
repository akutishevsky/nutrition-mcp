import type { ChromeCopy } from "./chrome.js";

export const CHROME_UK: ChromeCopy = {
    skipToContent: "Перейти до вмісту",
    brandHomeAriaLabel: "Головна сторінка Nutrition MCP",

    nav: {
        how: "Як це працює",
        tools: "Інструменти",
        examples: "Приклади",
        liveStats: "Наживо",
        liveStatsBadgeLabel: {
            one: "новий запис їжі з моменту відкриття сторінки",
            few: "нові записи їжі з моменту відкриття сторінки",
            many: "нових записів їжі з моменту відкриття сторінки",
            other: "нових записів їжі з моменту відкриття сторінки",
        },
        donate: "Підтримати",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Основна навігація",
        menu: "Меню",
        footer: "Нижній колонтитул",
    },

    githubAriaLabel: "Репозиторій на GitHub",
    changeLanguageAriaLabel: "Змінити мову",
    languageTitle: "Мова",
    theme: {
        ariaLabel: "Змінити тему",
        title: "Тема",
        system: "Системна",
        light: "Світла",
        dark: "Темна",
    },
    connectCta: "Підключити",
    openMenuAriaLabel: "Відкрити меню",
    closeMenuAriaLabel: "Закрити меню",

    menu: {
        howSmall: "3 кроки",
        installSmall: "менш ніж за хвилину",
        toolsSmall: "36 інструментів",
        examplesSmall: "демо наживо",
        liveStatsSmall: "з моменту відкриття",
        alternatives: "Альтернативи",
        alternativesSmall: "перехід з іншого застосунку",
        support: "Підтримка",
        contact: "Контакти",
        github: "GitHub",
        privacy: "Приватність",
        terms: "Умови",
        connectInMinute: "Підключи за хвилину",
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

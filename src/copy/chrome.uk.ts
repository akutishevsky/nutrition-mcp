import type { ChromeCopy } from "./chrome.js";

export const CHROME_UK: ChromeCopy = {
    skipToContent: "Перейти до вмісту",
    brandHomeAriaLabel: "Головна сторінка Nutrition MCP",

    nav: {
        how: "Як це працює",
        install: "Підключення",
        tools: "Інструменти",
        examples: "Приклади",
        liveStats: "Статистика",
        liveStatsBadgeLabel: {
            one: "новий запис їжі з моменту відкриття сторінки",
            few: "нові записи їжі з моменту відкриття сторінки",
            many: "нових записів їжі з моменту відкриття сторінки",
            other: "нового запису їжі з моменту відкриття сторінки",
        },
        faq: "Питання",
    },

    landmarks: {
        primaryNav: "Основна навігація",
        menu: "Меню",
        footer: "Нижня частина сторінки",
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
        github: "GitHub",
    },

    footer: {
        tools: "Інструменти",
        troubleshooting: "Усунення проблем",
        alternatives: "Альтернативи",
        howIBuiltThis: "Як я це зробив",
        demo: "Демо",
        github: "GitHub",
        contact: "Контакти",
        privacyPolicy: "Політика приватності",
        termsOfService: "Умови використання",
        note: "Безкоштовно і з відкритим кодом. Харчові показники — це оцінки, а не медична консультація.",
    },

    consent: {
        title: "Аналітичні файли cookie.",
        body: "З твого дозволу Google Analytics рахує відвідування, а Microsoft Clarity фіксує кліки й прокручування у вигляді записів сесій, щоб ми бачили, які сторінки корисні, а де люди застрягають. Жоден із них не завантажиться, поки ти не погодишся.",
        accept: "Прийняти",
        reject: "Відхилити",
        settings: "Налаштування cookie",
    },
};

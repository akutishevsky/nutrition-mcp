export interface RecipeImportCorpusEntry {
    id: string;
    site: string;
    url: string;
    variety: string;
    patterns: readonly string[];
}

/**
 * A deliberately broad, manually curated live corpus for recipe URL imports.
 *
 * This list is used by the manual corpus smoke workflows. It is intentionally
 * not fetched by ordinary PR CI: third-party pages change independently of
 * Munch, and the website-only OpenRouter path must never make live model
 * calls during a normal pull request.
 */
export const RECIPE_IMPORT_CORPUS = [
    {
        id: "101-cookbooks-spicy-cauliflower",
        site: "101 Cookbooks",
        url: "https://www.101cookbooks.com/spicy-cauliflower/",
        variety: "spiced cauliflower skillet",
        patterns: [
            "metric/imperial pair",
            "to taste seasoning",
            "plant-based main",
        ],
    },
    {
        id: "love-and-lemons-lemon-pasta",
        site: "Love & Lemons",
        url: "https://www.loveandlemons.com/lemon-pasta/",
        variety: "lemon pasta",
        patterns: [
            "recipe-card HTML fallback",
            "quantity-less seasoning",
            "fraction quantities",
        ],
    },
    {
        id: "food-network-gorgonzola-pasta",
        site: "Food Network",
        url: "https://www.foodnetwork.com/recipes/food-network-kitchen/gorgonzola-pasta-with-spinach-and-walnuts-10024399",
        variety: "vegetarian pasta",
        patterns: [
            "to taste seasoning",
            "parenthetical amount",
            "structured steps",
        ],
    },
    {
        id: "natashas-kitchen-pierogi",
        site: "Natasha's Kitchen",
        url: "https://natashaskitchen.com/pierogi-recipe/",
        variety: "Polish/Ukrainian stuffed dumplings",
        patterns: ["video recipe", "large yield", "filled dough"],
    },
    {
        id: "mediterranean-dish-vegetable-medley",
        site: "The Mediterranean Dish",
        url: "https://www.themediterraneandish.com/mediterranean-vegetable-medley/",
        variety: "Mediterranean vegetable side",
        patterns: [
            "metric-friendly units",
            "garnish",
            "multi-vegetable recipe",
        ],
    },
    {
        id: "bon-appetit-honey-lemon-chicken",
        site: "Bon Appétit",
        url: "https://www.bonappetit.com/recipe/honey-glazed-lemon-chicken",
        variety: "roasted poultry",
        patterns: [
            "yield wording",
            "quantity-less seasoning",
            "fraction quantities",
        ],
    },
    {
        id: "stay-at-home-chef-frito-pie",
        site: "The Stay At Home Chef",
        url: "https://thestayathomechef.com/frito-pie/",
        variety: "American chili-topped casserole",
        patterns: ["canned ingredients", "optional garnishes", "serving yield"],
    },
    {
        id: "recipe-tin-eats-moussaka-pilaf",
        site: "RecipeTin Eats",
        url: "https://www.recipetineats.com/one-pot-moussaka-beef-rice-pilaf/",
        variety: "Greek-inspired one-pot rice",
        patterns: ["metric/imperial pair", "alternative meat", "one-pot meal"],
    },
    {
        id: "spend-with-pennies-chicken-pasta",
        site: "Spend with Pennies",
        url: "https://www.spendwithpennies.com/one-pot-chicken-pasta/",
        variety: "one-pot creamy chicken pasta",
        patterns: ["canned tomatoes", "alternative pasta", "divided cheese"],
    },
    {
        id: "minimalist-baker-vegan-ramen",
        site: "Minimalist Baker",
        url: "https://minimalistbaker.com/easy-vegan-ramen/",
        variety: "vegan Japanese-inspired ramen",
        patterns: ["sectioned ingredients", "decimal quantity", "diet tags"],
    },
    {
        id: "modern-proper-stuffed-pepper-soup",
        site: "The Modern Proper",
        url: "https://themodernproper.com/stuffed-pepper-soup",
        variety: "beef and pepper soup",
        patterns: [
            "optional toppings",
            "canned ingredients",
            "sectioned ingredients",
        ],
    },
    {
        id: "pioneer-woman-sheet-pan-chicken",
        site: "The Pioneer Woman",
        url: "https://www.thepioneerwoman.com/food-cooking/recipes/a35916631/lemon-thyme-sheet-pan-chicken-and-potatoes-recipe/",
        variety: "sheet-pan chicken and potatoes",
        patterns: ["yield range", "bone-in poultry", "nutrition disclosure"],
    },
    {
        id: "delish-ritz-chicken-cutlets",
        site: "Delish",
        url: "https://www.delish.com/cooking/recipe-ideas/a73467103/cheesy-ritz-cracker-chicken-cutlets-recipe/",
        variety: "breaded chicken cutlets",
        patterns: ["new-style article URL", "crushed topping", "pan sauce"],
    },
    {
        id: "king-arthur-focaccia",
        site: "King Arthur Baking",
        url: "https://www.kingarthurbaking.com/recipes/big-and-bubbly-focaccia-recipe",
        variety: "yeasted bread",
        patterns: ["gram weights", "ingredient sections", "yield by pan size"],
    },
    {
        id: "a-couple-cooks-apple-crisp",
        site: "A Couple Cooks",
        url: "https://www.acouplecooks.com/apple-crisp-recipe/",
        variety: "baked fruit dessert",
        patterns: ["baking dessert", "alternative flour", "crumble topping"],
    },
    {
        id: "epicurious-baked-feta-pasta",
        site: "Epicurious",
        url: "https://www.epicurious.com/recipes/food/views/ba-syn-baked-feta-pasta-green-sauce",
        variety: "vegetarian baked pasta",
        patterns: [
            "syndicated recipe path",
            "green sauce",
            "substitution language",
        ],
    },
    {
        id: "just-one-cookbook-wonton-soup",
        site: "Just One Cookbook",
        url: "https://www.justonecookbook.com/shrimp-pork-wonton/",
        variety: "Japanese shrimp and pork wonton soup",
        patterns: [
            "multiple ingredient sections",
            "package quantity",
            "bilingual title",
        ],
    },
    {
        id: "once-upon-a-chef-beef-stew",
        site: "Once Upon a Chef",
        url: "https://www.onceuponachef.com/recipes/beef-stew-with-carrots-potatoes.html",
        variety: "French-style beef stew",
        patterns: [
            "long-form editorial page",
            "wine/broth choices",
            "slow braise",
        ],
    },
    {
        id: "budget-bytes-white-chicken-chili",
        site: "Budget Bytes",
        url: "https://www.budgetbytes.com/slow-cooker-white-chicken-chili/",
        variety: "slow-cooker white chicken chili",
        patterns: ["slow cooker", "canned beans", "budget recipe metadata"],
    },
    {
        id: "skinnytaste-red-lentil-soup",
        site: "Skinnytaste",
        url: "https://www.skinnytaste.com/red-lentil-soup-with-spinach/",
        variety: "Mediterranean-inspired lentil soup",
        patterns: [
            "diet abbreviations",
            "alternative broth",
            "nutrition facts",
        ],
    },
    {
        id: "gimme-some-oven-baked-mac",
        site: "Gimme Some Oven",
        url: "https://www.gimmesomeoven.com/baked-mac-and-cheese/",
        variety: "baked macaroni and cheese",
        patterns: [
            "ingredient sections",
            "cheese alternative",
            "topping component",
        ],
    },
] as const satisfies readonly RecipeImportCorpusEntry[];

export const RECIPE_IMPORT_CORPUS_HOSTS = new Set(
    RECIPE_IMPORT_CORPUS.map((entry) => new URL(entry.url).hostname),
);

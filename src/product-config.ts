export const PRODUCT_CONFIG = Object.freeze({
    name: "Munch",
    publicBaseUrl: "https://munch.business",
    premiumPriceMonthlyUsd: 4.99,
    trialEnabled: false,
    freeTierEnabled: true,
    freeHistoryDays: 30,
    freeSavedFoodLimit: 25,
    householdMemberLimit: 6,
    supportEmail: "support@munch.business",
    securityEmail: "security@munch.business",
});

export const PROTECTED_COMMERCE_TERMS = Object.freeze([
    "start free trial",
    "30-day trial",
    "after trial",
    "seven-day trial",
    "7-day trial",
    "premium required",
    "upgrade to continue",
    "upgrade your plan",
    "subscribe to continue",
    "stripe checkout",
    "pricing plan",
]);

export const PROTECTED_COMMERCE_PATHS = Object.freeze([
    "public/login.html",
    "public/oauth-login.html",
    "src/auth/connect-routes.ts",
    "src/auth/email.ts",
    "src/accounts/login-delivery.ts",
    "src/mcp.ts",
    "src/planning-tools.ts",
    "public/widgets",
]);

export function formatMonthlyPrice(): string {
    return `$${PRODUCT_CONFIG.premiumPriceMonthlyUsd.toFixed(2)}`;
}

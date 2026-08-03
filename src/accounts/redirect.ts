export function safeLocalRedirectPath(
    value: string | undefined,
    fallback = "/account",
): string {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return fallback;
    }

    try {
        const parsed = new URL(value, "https://munch.invalid");
        if (parsed.origin !== "https://munch.invalid") return fallback;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return fallback;
    }
}

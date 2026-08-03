const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAccountEmail(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (
        normalized.length < 3 ||
        normalized.length > 320 ||
        !SIMPLE_EMAIL_PATTERN.test(normalized)
    ) {
        throw new Error("Invalid email address");
    }
    return normalized;
}

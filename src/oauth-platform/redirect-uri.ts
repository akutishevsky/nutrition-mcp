export function validateRedirectUri(value: string): string {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("invalid_redirect_uri");
    }

    if (url.hash) {
        throw new Error("invalid_redirect_uri");
    }

    const isLoopback =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]";
    if (url.protocol !== "https:" && !(isLoopback && url.protocol === "http:")) {
        throw new Error("invalid_redirect_uri");
    }

    if (url.username || url.password) {
        throw new Error("invalid_redirect_uri");
    }

    return url.toString();
}

export function validateRedirectUris(values: unknown): string[] {
    if (!Array.isArray(values) || values.length < 1 || values.length > 10) {
        throw new Error("invalid_redirect_uris");
    }

    const normalized = values.map((value) => {
        if (typeof value !== "string") {
            throw new Error("invalid_redirect_uris");
        }
        return validateRedirectUri(value);
    });

    if (new Set(normalized).size !== normalized.length) {
        throw new Error("duplicate_redirect_uri");
    }

    return normalized;
}

export function redirectUriRegistered(
    redirectUri: string,
    registeredRedirectUris: string[],
): boolean {
    const normalized = validateRedirectUri(redirectUri);
    return registeredRedirectUris.includes(normalized);
}

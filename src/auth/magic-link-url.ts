import { safeLocalRedirectPath } from "../accounts/redirect.js";

export function buildScannerSafeMagicLink(input: {
    generatedUrl: string;
    baseUrl: string;
}): string {
    const generated = new URL(input.generatedUrl);
    const token = generated.searchParams.get("token");
    if (!token) throw new Error("Better Auth magic-link URL is missing token");

    const callback =
        generated.searchParams.get("callbackURL") ??
        generated.searchParams.get("callbackUrl") ??
        undefined;
    const returnTo = safeLocalRedirectPath(callback, "/account/portal");
    const confirmation = new URL("/connect/confirm", input.baseUrl);
    confirmation.searchParams.set("token", token);
    confirmation.searchParams.set("return_to", returnTo);
    return confirmation.toString();
}

export function safeMagicLinkReturnPath(value: unknown): string {
    return safeLocalRedirectPath(
        typeof value === "string" ? value : undefined,
        "/account/portal",
    );
}

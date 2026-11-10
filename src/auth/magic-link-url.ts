import { safeLocalRedirectPath } from "../accounts/redirect.js";

/**
 * The signed-in home every sign-in flow lands on when no explicit local
 * return target was supplied. The retired "/account/portal" landing was
 * never rebuilt after the app shell replaced it and answers 404, so it
 * must never reappear as a default here (pinned by magic-link-url.test.ts
 * and the accounts router test: "/account/portal" itself redirects here).
 */
export const SIGNED_IN_HOME_PATH = "/app";

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
    const returnTo = safeLocalRedirectPath(callback, SIGNED_IN_HOME_PATH);
    const confirmation = new URL("/connect/confirm", input.baseUrl);
    confirmation.searchParams.set("token", token);
    confirmation.searchParams.set("return_to", returnTo);
    return confirmation.toString();
}

export function safeMagicLinkReturnPath(value: unknown): string {
    return safeLocalRedirectPath(
        typeof value === "string" ? value : undefined,
        SIGNED_IN_HOME_PATH,
    );
}

// Derive the public base URL of the server from the request, honoring the
// reverse-proxy forwarding headers used in production. Shared by the HTTP entry
// point and the OAuth router (which builds the Google callback URL from it).
export function getBaseUrl(c: {
    req: { header: (name: string) => string | undefined; url: string };
}): string {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    if (host) return `${proto}://${host}`;
    return new URL(c.req.url).origin;
}

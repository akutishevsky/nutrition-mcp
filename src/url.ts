// Derive the public base URL of the server from the request, honoring the
// reverse-proxy forwarding headers used in production. The single
// implementation for every caller: the HTTP entry point, the bearer middleware
// (whose WWW-Authenticate challenge names the resource metadata URL), the OAuth
// router (which builds the Google callback URL from it) and the /mcp server
// factory, which advertises the widget icon URL. That factory only ever sees a
// raw `Request` — never a Hono context — which is why this accepts both.
//
// It used to be three near-copies. They drifted: /mcp's fell back to
// "http://localhost" on a host-less request while the OAuth metadata URLs
// derived from that same request used the real origin, so one request could
// advertise two different servers.
type HonoLikeContext = {
    req: { header: (name: string) => string | undefined; url: string };
};

// Reads headers and the URL off either shape. Hono's `header` reads `this`,
// so it is called through the context rather than detached.
function requestLike(source: HonoLikeContext | Request): {
    header: (name: string) => string | undefined;
    url: string;
} {
    return source instanceof Request
        ? {
              header: (name: string) => source.headers.get(name) ?? undefined,
              url: source.url,
          }
        : {
              header: (name: string) => source.req.header(name),
              url: source.req.url,
          };
}

export function getBaseUrl(source: HonoLikeContext | Request): string {
    const req = requestLike(source);
    const proto = req.header("x-forwarded-proto") || "http";
    const host = req.header("x-forwarded-host") || req.header("host");
    if (host) return `${proto}://${host}`;
    return new URL(req.url).origin;
}

// Whether the client reached us over https: the proxy's x-forwarded-proto
// when it sent one, read exactly as getBaseUrl reads it, and otherwise the
// request URL's own scheme. Decides the HSTS header, which must never reach a
// plain-http localhost (it would pin the dev machine's browser to https).
export function isHttpsRequest(source: HonoLikeContext | Request): boolean {
    const req = requestLike(source);
    const proto = req.header("x-forwarded-proto");
    if (proto) return proto === "https";
    return new URL(req.url).protocol === "https:";
}

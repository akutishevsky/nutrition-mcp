const input = process.argv[2]?.trim();
if (!input) {
    console.error("Usage: bun scripts/certification/public.ts https://host");
    process.exit(2);
}

const baseUrl = new URL(input).origin;
const expectedResource = `${baseUrl}/mcp`;

async function expectStatus(path: string, status: number): Promise<Response> {
    const response = await fetch(`${baseUrl}${path}`, {
        headers: { accept: "application/json" },
        redirect: "manual",
    });
    if (response.status !== status) {
        throw new Error(`${path} returned ${response.status}; expected ${status}`);
    }
    return response;
}

async function fetchJson(path: string): Promise<Record<string, unknown>> {
    const response = await expectStatus(path, 200);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("application/json")) {
        throw new Error(`${path} returned ${contentType || "no content type"}`);
    }
    return (await response.json()) as Record<string, unknown>;
}

await expectStatus("/health/live", 200);
await expectStatus("/health/ready", 200);

const protectedResource = await fetchJson(
    "/.well-known/oauth-protected-resource/mcp",
);
if (protectedResource.resource !== expectedResource) {
    throw new Error("Protected-resource metadata does not identify /mcp");
}
if (
    !Array.isArray(protectedResource.authorization_servers) ||
    typeof protectedResource.authorization_servers[0] !== "string"
) {
    throw new Error("Protected-resource authorization server is missing");
}
const authorizationServer = protectedResource.authorization_servers[0];
const authorizationServerUrl = new URL(authorizationServer);
if (authorizationServerUrl.origin !== baseUrl) {
    throw new Error("Protected-resource authorization server is cross-origin");
}

const authorization = await fetchJson(
    "/.well-known/oauth-authorization-server/mcp",
);
if (authorization.issuer !== authorizationServer) {
    throw new Error(
        `Authorization issuer ${String(authorization.issuer)} does not match ${authorizationServer}`,
    );
}
for (const key of [
    "authorization_endpoint",
    "token_endpoint",
    "registration_endpoint",
]) {
    if (typeof authorization[key] !== "string") {
        throw new Error(`Authorization metadata is missing ${key}`);
    }
}
if (
    !Array.isArray(authorization.code_challenge_methods_supported) ||
    !authorization.code_challenge_methods_supported.includes("S256")
) {
    throw new Error("OAuth metadata does not require/support PKCE S256");
}

for (const path of [
    "/.well-known/openid-configuration",
    "/.well-known/openid-configuration/api/auth",
    "/api/auth/.well-known/openid-configuration",
    "/.well-known/oauth-authorization-server/api/auth",
    "/api/auth/.well-known/oauth-authorization-server",
]) {
    const metadata = await fetchJson(path);
    if (metadata.issuer !== authorizationServer) {
        throw new Error(`${path} advertises the wrong issuer`);
    }
}

const unauthorized = await expectStatus("/mcp", 401);
const challenge = unauthorized.headers.get("www-authenticate") ?? "";
if (!challenge.includes("oauth-protected-resource/mcp")) {
    throw new Error("MCP 401 does not advertise path-aware resource metadata");
}

const stylesheet = await expectStatus("/portal-controls.css", 200);
if (!(stylesheet.headers.get("content-type") ?? "").startsWith("text/css")) {
    throw new Error("Portal stylesheet has the wrong MIME type");
}
if (!(await stylesheet.text()).includes("portal-")) {
    throw new Error("Portal stylesheet body is incomplete");
}

await expectStatus("/account/portal/meals?date=2026-08-05", 401);

console.log(
    JSON.stringify({
        ok: true,
        baseUrl,
        resource: expectedResource,
        issuer: authorizationServer,
        authorizationEndpoint: authorization.authorization_endpoint,
        tokenEndpoint: authorization.token_endpoint,
        registrationEndpoint: authorization.registration_endpoint,
        compatibilityDiscovery: true,
        portalStylesheet: true,
        mealHistoryRequiresAuthentication: true,
    }),
);

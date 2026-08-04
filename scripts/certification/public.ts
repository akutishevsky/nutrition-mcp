const input = process.argv[2]?.trim();
if (!input) {
    console.error("Usage: bun scripts/certification/public.ts https://host");
    process.exit(2);
}

const baseUrl = new URL(input).origin;
const expectedResource = `${baseUrl}/mcp`;

async function fetchJson(path: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${baseUrl}${path}`, {
        headers: { accept: "application/json" },
        redirect: "manual",
    });
    if (!response.ok) {
        throw new Error(`${path} returned ${response.status}`);
    }
    return (await response.json()) as Record<string, unknown>;
}

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
    protectedResource.authorization_servers[0] !== baseUrl
) {
    throw new Error("Protected-resource authorization server is incorrect");
}

const authorization = await fetchJson(
    "/.well-known/oauth-authorization-server/mcp",
);
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

const unauthorized = await expectStatus("/mcp", 401);
const challenge = unauthorized.headers.get("www-authenticate") ?? "";
if (!challenge.includes("oauth-protected-resource/mcp")) {
    throw new Error("MCP 401 does not advertise path-aware resource metadata");
}

console.log(
    JSON.stringify({
        ok: true,
        baseUrl,
        resource: expectedResource,
        authorizationEndpoint: authorization.authorization_endpoint,
        tokenEndpoint: authorization.token_endpoint,
        registrationEndpoint: authorization.registration_endpoint,
    }),
);

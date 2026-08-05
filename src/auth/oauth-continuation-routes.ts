import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { getMunchBetterAuth } from "./auth.js";
import { boundedOAuthQuery } from "./connect-routes.js";

function connectionError(c: Context, stage: string, error?: unknown) {
    console.error("Better Auth OAuth continuation failed", {
        stage,
        errorName: error instanceof Error ? error.name : "unknown",
    });
    return c.redirect("/connect/error", 303);
}

async function betterAuthJsonPost(
    c: Context,
    path: string,
    body: Record<string, unknown>,
): Promise<Response> {
    const headers = new Headers(c.req.raw.headers);
    headers.set("content-type", "application/json");
    headers.delete("content-length");

    return getMunchBetterAuth().handler(
        new Request(new URL(path, c.req.url), {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        }),
    );
}

async function browserRedirectResponse(
    c: Context,
    response: Response,
): Promise<Response> {
    if (!response.ok) return response;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
        return response;
    }

    const payload = (await response.json()) as {
        redirect?: unknown;
        url?: unknown;
    };
    if (payload.redirect !== true || typeof payload.url !== "string") {
        return c.json(payload);
    }

    let redirectUrl: URL;
    try {
        redirectUrl = new URL(payload.url);
    } catch {
        return connectionError(c, "consent_redirect_url");
    }
    if (redirectUrl.protocol !== "https:" && redirectUrl.protocol !== "http:") {
        return connectionError(c, "consent_redirect_protocol");
    }

    return c.redirect(redirectUrl.toString(), 303);
}

export function createOAuthContinuationRouter(): Hono {
    const router = new Hono();

    router.post("/connect/consent", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const clientId =
            typeof body.client_id === "string" ? body.client_id : "";
        const scope = typeof body.scope === "string" ? body.scope : "";
        const oauthQuery = boundedOAuthQuery(body.oauth_query);
        const accept = body.decision === "approve";

        if (!clientId || !scope || !oauthQuery) {
            return connectionError(c, "consent_submission");
        }

        const auth = getMunchBetterAuth();
        let session;
        try {
            session = await auth.api.getSession({ headers: c.req.raw.headers });
        } catch (error) {
            return connectionError(c, "consent_session", error);
        }
        if (!session?.user) {
            return c.redirect(
                `/connect/sign-in?oauth_query=${encodeURIComponent(oauthQuery)}`,
                303,
            );
        }

        try {
            const response = await betterAuthJsonPost(
                c,
                "/api/auth/oauth2/consent",
                {
                    accept,
                    scope,
                    oauth_query: oauthQuery,
                },
            );
            return browserRedirectResponse(c, response);
        } catch (error) {
            return connectionError(c, "oauth2_consent", error);
        }
    });

    return router;
}

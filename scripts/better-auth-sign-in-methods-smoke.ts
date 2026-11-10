#!/usr/bin/env bun

/**
 * Account-linking backend smoke (Amendment I) — runs in the CI database
 * job against real Postgres.
 *
 * Exercises the sign-in-methods service and HTTP API end to end:
 *
 * - Read model: Email link (derived, masked, not removable), Google
 *   (linked from its account row, masked identity, never the full
 *   provider payload), Apple (not_configured until IOS-AUTH lands).
 * - Guardrail (a): unlinking the LAST account-backed sign-in method
 *   refuses with `last_sign_in_method` and changes nothing; unlinking
 *   succeeds when another method (a second provider, or the reviewer
 *   credential row) remains.
 * - Guardrail (b): a provider identity owned by a DIFFERENT account
 *   refuses with `sign_in_method_conflict`, changes nothing, and the
 *   storage unique constraint on (provider_id, account_id) backstops it
 *   — no silent merge is possible.
 * - Guardrail (c): linking keys on provider identity, never email
 *   matching — proven at the config seam Better Auth's link paths read
 *   (`accountLinking.allowDifferentEmails === true`) and by a linked
 *   Apple row whose private-relay email differs from the account email.
 * - Link initiation: the session-bound POST delegates to Better Auth
 *   linkSocial and returns Google's consent URL; Apple initiation is an
 *   honest `provider_not_configured` refusal, not an error.
 *
 * Sessions are inserted directly and presented as bearer tokens — the
 * packaged-app transport `requireAppSession` already supports (see
 * better-auth-mobile-bearer-smoke.ts for the cookie/bearer separation
 * proof). The Google client secret is a placeholder: initiation never
 * exchanges a code, so the secret is never used.
 */

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required for the sign-in methods smoke test",
    );
}

process.env.MUNCH_APP_BASE_URL = "https://munch.example";
process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
    "890658789419-chqidgpgcpn3sr25u1p3c7aj0anljo9l.apps.googleusercontent.com";
process.env.MUNCH_GOOGLE_CLIENT_SECRET =
    "smoke-placeholder-secret-never-exchanged";
delete process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID;
delete process.env.MUNCH_APPLE_SERVICES_ID;
delete process.env.MUNCH_APPLE_KEY_ID;
delete process.env.MUNCH_APPLE_TEAM_ID;
delete process.env.MUNCH_APPLE_PRIVATE_KEY;

const { SQL } = await import("bun");
const { Hono } = await import("hono");
const { getMunchBetterAuth } = await import("../src/auth/auth.js");
const { getBetterAuthRuntimeConfig } = await import("../src/auth/config.js");
const {
    assertProviderIdentityLinkable,
    listSignInMethods,
    SignInMethodError,
    unlinkSignInMethod,
} = await import("../src/auth/sign-in-methods.js");
const { createSignInMethodsRouter } =
    await import("../src/auth/sign-in-methods-routes.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

const sql = new SQL({ url: databaseUrl, max: 1 });
const config = getBetterAuthRuntimeConfig();
const app = new Hono();
app.route("/", createSignInMethodsRouter());

function fakeIdToken(payload: Record<string, unknown>): string {
    const segment = (value: unknown) =>
        Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
    return `${segment({ alg: "RS256", typ: "JWT" })}.${segment(payload)}.fakesig`;
}

interface FixtureUser {
    id: string;
    email: string;
    bearer: string;
}

async function createUser(email: string): Promise<FixtureUser> {
    const id = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const bearer = `smoke-${crypto.randomUUID()}`;
    await sql`
        insert into munch.users (id, email, name, email_verified, status)
        values (${id}, ${email}, 'Sign-in methods smoke', true, 'active')
    `;
    await sql`
        insert into munch.auth_sessions (id, user_id, token, expires_at)
        values (${sessionId}, ${id}, ${bearer}, now() + interval '1 hour')
    `;
    return { id, email, bearer };
}

async function insertAccount(
    userId: string,
    providerId: string,
    accountId: string,
    idToken: string | null = null,
    password: string | null = null,
): Promise<void> {
    await sql`
        insert into munch.auth_accounts
            (user_id, account_id, provider_id, id_token, password)
        values (${userId}, ${accountId}, ${providerId}, ${idToken}, ${password})
    `;
}

async function accountRows(userId: string) {
    return sql<Array<{ provider_id: string; account_id: string }>>`
        select provider_id, account_id from munch.auth_accounts
        where user_id = ${userId} order by provider_id, account_id
    `;
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const userIds: string[] = [];
let succeeded = false;

try {
    // ---- Guardrail (c) at the config seam -------------------------------
    const auth = getMunchBetterAuth();
    const linking = (
        auth as unknown as {
            options: {
                account?: {
                    accountLinking?: { allowDifferentEmails?: boolean };
                };
            };
        }
    ).options.account?.accountLinking;
    assert(
        linking?.allowDifferentEmails === true,
        "accountLinking.allowDifferentEmails must be true so explicit linking keys on provider identity, not email matching",
    );

    // ---- Read model ------------------------------------------------------
    const alice = await createUser(
        `linking-alice-${crypto.randomUUID()}@example.test`,
    );
    userIds.push(alice.id);
    const aliceGoogleSub = "109876543210123456789";
    const aliceGoogleEmail = "alice.personal@gmail.com";
    await insertAccount(
        alice.id,
        "google",
        aliceGoogleSub,
        fakeIdToken({ sub: aliceGoogleSub, email: aliceGoogleEmail }),
    );
    // Apple row whose private-relay email differs from the account email:
    // linked by provider identity regardless (guardrail (c) in the model).
    const aliceAppleSub = "001999.abcdef0123456789.1234";
    await insertAccount(
        alice.id,
        "apple",
        aliceAppleSub,
        fakeIdToken({
            sub: aliceAppleSub,
            email: "x9k2relay@privaterelay.appleid.com",
        }),
    );

    const aliceMethods = await listSignInMethods(alice.id, config);
    const aliceEmail = aliceMethods.find((m) => m.id === "email")!;
    assert(aliceEmail.state === "linked", "Email link must be linked");
    assert(aliceEmail.removable === false, "Email link must not be removable");
    assert(
        aliceEmail.maskedIdentity?.endsWith("@example.test") &&
            !aliceEmail.maskedIdentity.includes("linking-alice"),
        `Email identity must be masked, got ${aliceEmail.maskedIdentity}`,
    );
    const aliceGoogle = aliceMethods.find((m) => m.id === "google")!;
    assert(aliceGoogle.state === "linked", "Google must be linked for Alice");
    assert(
        aliceGoogle.maskedIdentity === "a•••@gmail.com",
        `Google identity must be the masked provider email, got ${aliceGoogle.maskedIdentity}`,
    );
    const aliceApple = aliceMethods.find((m) => m.id === "apple")!;
    assert(
        aliceApple.state === "linked" &&
            aliceApple.maskedIdentity === "x•••@privaterelay.appleid.com",
        `Apple relay identity must be linked + masked, got ${JSON.stringify(aliceApple)}`,
    );
    assert(
        !JSON.stringify(aliceMethods).includes(aliceGoogleEmail) &&
            !JSON.stringify(aliceMethods).includes(aliceGoogleSub),
        "Read model leaked a full provider identity",
    );

    const dave = await createUser(
        `linking-dave-${crypto.randomUUID()}@example.test`,
    );
    userIds.push(dave.id);
    const daveMethods = await listSignInMethods(dave.id, config);
    assert(
        daveMethods.find((m) => m.id === "google")?.state === "not_linked",
        "Configured Google must be not_linked for a user with no row",
    );
    assert(
        daveMethods.find((m) => m.id === "apple")?.state === "not_configured",
        "Apple must be not_configured until IOS-AUTH configures it",
    );

    // HTTP read model + auth fence.
    const httpRead = await app.request(
        "https://munch.example/api/app/sign-in-methods",
        { headers: { Authorization: `Bearer ${alice.bearer}` } },
    );
    assert(httpRead.status === 200, `HTTP read failed: ${httpRead.status}`);
    const httpMethods = (
        (await httpRead.json()) as {
            methods: Array<{ id: string; state: string }>;
        }
    ).methods;
    assert(
        httpMethods.find((m) => m.id === "google")?.state === "linked",
        "HTTP read model disagrees with the service",
    );
    const anonymous = await app.request(
        "https://munch.example/api/app/sign-in-methods",
    );
    assert(anonymous.status === 401, "Unauthenticated read must be 401");

    // ---- Guardrail (a): last method --------------------------------------
    const bob = await createUser(
        `linking-bob-${crypto.randomUUID()}@example.test`,
    );
    userIds.push(bob.id);
    const bobGoogleSub = "208765432109876543210";
    await insertAccount(bob.id, "google", bobGoogleSub);

    let lastError: unknown = null;
    try {
        await unlinkSignInMethod(bob.id, "google", config);
    } catch (error) {
        lastError = error;
    }
    assert(
        lastError instanceof SignInMethodError &&
            lastError.code === "last_sign_in_method" &&
            lastError.status === 409 &&
            lastError.message.includes("only sign-in method left"),
        `Last-method unlink must refuse plainly, got ${String(lastError)}`,
    );
    assert(
        (await accountRows(bob.id)).length === 1,
        "Last-method refusal must change nothing",
    );

    const httpLast = await app.request(
        "https://munch.example/api/app/sign-in-methods/google/unlink",
        {
            method: "POST",
            headers: { Authorization: `Bearer ${bob.bearer}` },
        },
    );
    assert(
        httpLast.status === 409,
        `HTTP last-method unlink must be 409, got ${httpLast.status}`,
    );
    const httpLastBody = (await httpLast.json()) as {
        error?: string;
        message?: string;
    };
    assert(
        httpLastBody.error === "last_sign_in_method" &&
            typeof httpLastBody.message === "string" &&
            httpLastBody.message.includes("Link another sign-in method first"),
        `HTTP last-method body must carry the plain explanation, got ${JSON.stringify(httpLastBody)}`,
    );
    assert(
        (await accountRows(bob.id)).length === 1,
        "HTTP last-method refusal must change nothing",
    );

    // Email link is not removable, and neither is an unknown provider.
    const httpEmailUnlink = await app.request(
        "https://munch.example/api/app/sign-in-methods/email/unlink",
        {
            method: "POST",
            headers: { Authorization: `Bearer ${bob.bearer}` },
        },
    );
    assert(
        httpEmailUnlink.status === 400,
        `Email unlink must refuse as not removable, got ${httpEmailUnlink.status}`,
    );

    // Unlink succeeds when another account-backed method remains.
    const afterAliceGoogle = await unlinkSignInMethod(
        alice.id,
        "google",
        config,
    );
    assert(
        afterAliceGoogle.find((m) => m.id === "google")?.state ===
            "not_linked" &&
            afterAliceGoogle.find((m) => m.id === "apple")?.state === "linked",
        "Unlink with a remaining provider must succeed and keep the other",
    );
    assert(
        (await accountRows(alice.id)).every((r) => r.provider_id !== "google"),
        "Unlinked Google row must be deleted",
    );

    // The reviewer credential row counts as a remaining method (and is
    // itself never touched by this backend).
    const carol = await createUser(
        `linking-carol-${crypto.randomUUID()}@example.test`,
    );
    userIds.push(carol.id);
    await insertAccount(carol.id, "google", "307654321098765432109");
    await insertAccount(
        carol.id,
        "credential",
        carol.id,
        null,
        "smoke-placeholder-hash-never-used",
    );
    await unlinkSignInMethod(carol.id, "google", config);
    const carolRows = await accountRows(carol.id);
    assert(
        carolRows.length === 1 && carolRows[0]?.provider_id === "credential",
        "Google unlink with a credential remaining must succeed and leave the credential row untouched",
    );

    // ---- Guardrail (b): no silent merges ---------------------------------
    const eve = await createUser(
        `linking-eve-${crypto.randomUUID()}@example.test`,
    );
    userIds.push(eve.id);
    let conflictError: unknown = null;
    try {
        await assertProviderIdentityLinkable({
            userId: eve.id,
            providerId: "google",
            accountId: bobGoogleSub,
        });
    } catch (error) {
        conflictError = error;
    }
    assert(
        conflictError instanceof SignInMethodError &&
            conflictError.code === "sign_in_method_conflict" &&
            conflictError.message.includes(
                "already linked to a different Munch account",
            ),
        `Cross-account link must refuse with the conflict message, got ${String(conflictError)}`,
    );
    assert(
        (await accountRows(eve.id)).length === 0 &&
            (await accountRows(bob.id))[0]?.account_id === bobGoogleSub,
        "Conflict refusal must change nothing on either account",
    );
    assert(
        (await assertProviderIdentityLinkable({
            userId: bob.id,
            providerId: "google",
            accountId: bobGoogleSub,
        })) === "already_linked",
        "Re-linking your own identity must be idempotent, not a conflict",
    );
    assert(
        (await assertProviderIdentityLinkable({
            userId: eve.id,
            providerId: "google",
            accountId: "999999999999999999999",
        })) === "available",
        "An unclaimed identity must be linkable",
    );

    // Storage backstop: the (provider_id, account_id) unique constraint
    // rejects a second owner outright — a merge cannot be written.
    let constraintFailed = false;
    try {
        await insertAccount(eve.id, "google", bobGoogleSub);
    } catch {
        constraintFailed = true;
    }
    assert(
        constraintFailed,
        "Unique (provider_id, account_id) constraint must reject a duplicate owner",
    );
    assert(
        (await accountRows(eve.id)).length === 0,
        "Rejected duplicate insert must leave no row behind",
    );

    // MCP/OAuth consent identities are a separate family: listing sign-in
    // methods for a user with consents but no provider rows still shows
    // only the three first-party methods (covered by Dave's read above —
    // his inventory has exactly email/google/apple).
    assert(
        daveMethods.length === 3,
        "Inventory must contain exactly Email link, Google, Apple",
    );

    // ---- Link initiation ---------------------------------------------------
    const linkInit = await app.request(
        "https://munch.example/api/app/sign-in-methods/google/link",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${dave.bearer}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ callbackURL: "/app/settings" }),
        },
    );
    assert(
        linkInit.status === 200,
        `Google link initiation failed: ${linkInit.status} ${await linkInit.clone().text()}`,
    );
    const linkPayload = (await linkInit.json()) as {
        url?: string;
        redirect?: boolean;
    };
    assert(
        linkPayload.redirect === true &&
            typeof linkPayload.url === "string" &&
            new URL(linkPayload.url).hostname === "accounts.google.com",
        `Link initiation must return Google's consent URL, got ${JSON.stringify(linkPayload)}`,
    );

    const appleInit = await app.request(
        "https://munch.example/api/app/sign-in-methods/apple/link",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${dave.bearer}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ callbackURL: "/app/settings" }),
        },
    );
    assert(
        appleInit.status === 409,
        `Apple link initiation must be an honest not-configured refusal, got ${appleInit.status}`,
    );
    const appleInitBody = (await appleInit.json()) as { error?: string };
    assert(
        appleInitBody.error === "provider_not_configured",
        `Apple refusal must be provider_not_configured, got ${JSON.stringify(appleInitBody)}`,
    );

    succeeded = true;
    console.log(
        "Sign-in methods smoke passed: masked read model (email derived / google / apple not-configured), " +
            "last-method unlink refusal (service + HTTP, nothing changed), cross-account conflict refusal + unique-constraint backstop, " +
            "allowDifferentEmails provider-identity linking, Google linkSocial initiation, Apple honest not-configured.",
    );
} finally {
    for (const id of userIds) {
        await sql`delete from munch.users where id = ${id}`;
    }
    await sql.close();
    await closePlatformDatabase();
    process.exit(succeeded ? 0 : 1);
}

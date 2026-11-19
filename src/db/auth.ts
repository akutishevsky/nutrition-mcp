import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
    SignInError,
    SignUpError,
    signInErrorCode,
    signUpErrorCode,
} from "../auth-errors.js";
import { buildClient, getSupabase } from "./client.js";

// ---------- Auth ----------

// Supabase Auth only verifies the credential: access runs on this server's own
// OAuth tokens. GoTrue has no verify-only call, so every successful sign-in
// still creates an auth.sessions row and a refresh token that nothing uses,
// and by default they never expire. End it at once — scope "local" makes
// GoTrue delete just this session, its refresh tokens cascading with it (the
// privacy policy says so). Not awaited, never throws: sign-in must not wait
// on or fail because of it, and a missed one is caught by the project's
// session time-box. Logs the status only, never the user.
function discardAuthSession(
    client: SupabaseClient,
    session: { access_token: string } | null,
): void {
    if (!session) return; // signUp with email confirmation on returns none
    client.auth.admin
        .signOut(session.access_token, "local")
        .then(({ error }) => {
            if (error && error.status !== 404)
                console.warn(
                    `[auth] session-revoke-failed status=${error.status ?? "unknown"}`,
                );
        })
        .catch(() =>
            console.warn("[auth] session-revoke-failed status=network"),
        );
}

export async function signUpUser(
    email: string,
    password: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const client = buildClient();
    const { data, error } = await client.auth.signUp({
        email,
        password,
    });

    // Only the code leaves this function: some GoTrue messages quote the
    // address, and none of them is shown to the user (src/auth-errors.ts).
    if (error) throw new SignUpError(signUpErrorCode(error.code));
    if (!data.user) throw new SignUpError("other");
    // No session means Supabase is holding the account for email
    // confirmation (Confirm email on). This server has no confirmation flow
    // yet, so it must not hand out an authorization code for an address
    // nobody has proved they own: refuse, and log it so the setting gets
    // noticed.
    if (!data.session) {
        console.warn("[auth] sign-up-unconfirmed");
        throw new SignUpError("other");
    }
    discardAuthSession(client, data.session);
    return data.user.id;
}

export async function signInUser(
    email: string,
    password: string,
): Promise<string> {
    const client = buildClient();
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new SignInError(signInErrorCode(error.code));
    discardAuthSession(client, data.session);
    return data.user.id;
}

export async function signInWithGoogleIdToken(
    idToken: string,
    nonce: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const client = buildClient();
    const { data, error } = await client.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Google sign-in failed");
    discardAuthSession(client, data.session);
    return data.user.id;
}

/**
 * The user's Supabase Auth record (email, sign-in timestamps, identities and
 * the profile claims a provider sent), via the service-role admin API. Null
 * when Auth has no such user. The admin API never returns a password hash.
 */
export async function getAuthAccount(userId: string): Promise<User | null> {
    const { data, error } = await getSupabase().auth.admin.getUserById(userId);
    if (error) {
        if (error.status === 404) return null;
        throw new Error(`Failed to get account: ${error.message}`);
    }
    return data.user ?? null;
}

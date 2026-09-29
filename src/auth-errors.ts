// Typed failures from the password sign-in and sign-up calls behind
// POST /approve. The login page picks its translated message by `code`
// (LOGIN_ERRORS in src/copy/login.ts) and never renders the underlying
// Supabase message: it is untranslated third-party text, and on the
// sign-in path it would say whether an address has an account. Kept in its
// own module because both src/supabase.ts (which throws them) and
// src/oauth.ts (which reads them) need it, and oauth-store.ts already
// imports supabase.ts.

// invalid_credentials: GoTrue's "wrong email or password", the one failure
// that lets Create account go on to sign up. rate_limited / other: the
// attempt itself failed (a 429, an outage), so the password was never judged.
export type SignInErrorCode = "invalid_credentials" | "rate_limited" | "other";

export class SignInError extends Error {
    constructor(readonly code: SignInErrorCode) {
        super(`sign-in failed: ${code}`);
        this.name = "SignInError";
    }
}

// user_exists only happens with Confirm email off (the project's setting),
// where GoTrue answers a sign-up for a registered address with
// user_already_exists; /approve reaches sign-up only after the same
// credentials failed to sign in, so it means a wrong password.
export type SignUpErrorCode =
    | "user_exists"
    | "weak_password"
    | "email_invalid"
    | "rate_limited"
    | "other";

export class SignUpError extends Error {
    constructor(readonly code: SignUpErrorCode) {
        super(`sign-up failed: ${code}`);
        this.name = "SignUpError";
    }
}

export function signInErrorCode(code: string | undefined): SignInErrorCode {
    if (code === "invalid_credentials") return "invalid_credentials";
    if (code === "over_request_rate_limit") return "rate_limited";
    return "other";
}

export function signUpErrorCode(code: string | undefined): SignUpErrorCode {
    switch (code) {
        case "user_already_exists":
        case "email_exists":
            return "user_exists";
        case "weak_password":
            return "weak_password";
        case "email_address_invalid":
            return "email_invalid";
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
            return "rate_limited";
        // validation_failed covers both a malformed email and a password
        // over bcrypt's 72 bytes, so it can't name a field; /approve catches
        // the long password before calling Supabase (MAX_PASSWORD_BYTES).
        case "validation_failed":
        default:
            return "other";
    }
}

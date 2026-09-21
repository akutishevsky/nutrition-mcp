/**
 * Which deployment this process is.
 *
 * `production` is nutrition-mcp.com; `staging` is the dev.nutrition-mcp.com
 * app, which runs the same image against the dev Supabase project. The default
 * is deliberately `production`: a missing or misspelled APP_ENV must never
 * silently de-index the live site or drop its analytics, so staging is the case
 * that has to opt in.
 *
 * Read through these helpers rather than `process.env.APP_ENV` directly — two
 * separate call sites reading the raw string is how one of them ends up
 * comparing against "dev" while the other compares against "staging".
 */
export type AppEnv = "production" | "staging";

export function appEnv(): AppEnv {
    return process.env.APP_ENV === "staging" ? "staging" : "production";
}

export function isProduction(): boolean {
    return appEnv() === "production";
}

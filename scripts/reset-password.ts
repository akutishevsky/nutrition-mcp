/**
 * Sets a new, randomly generated password for one user and prints it.
 *
 *   bun run reset-password <user-uuid | email> [--yes]
 *
 * Uses the Supabase Admin API (PUT /auth/v1/admin/users/:id) with the
 * service-role key from SUPABASE_URL / SUPABASE_SECRET_KEY, so GoTrue applies
 * the project's password rules, bcrypt-hashes it and audits the change. No
 * email is sent: hand the printed password to the user yourself.
 *
 * It does not touch this server's own tokens: existing MCP connections, the
 * dashboard and Apple Health links stay signed in.
 */
import { createClient, type User } from "@supabase/supabase-js";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const args = process.argv.slice(2);
const skipConfirm = args.includes("--yes");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
    console.error("Usage: bun run reset-password <user-uuid | email> [--yes]");
    process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
    process.exit(1);
}

const sb = createClient(url, key, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

async function findUser(idOrEmail: string): Promise<User | null> {
    if (UUID_RE.test(idOrEmail)) {
        const { data, error } = await sb.auth.admin.getUserById(idOrEmail);
        if (error) {
            if (error.status === 404) return null;
            throw error;
        }
        return data.user;
    }
    // The Admin API has no lookup by email, so page through the users.
    const email = idOrEmail.toLowerCase();
    const perPage = 1000;
    for (let page = 1; ; page++) {
        const { data, error } = await sb.auth.admin.listUsers({
            page,
            perPage,
        });
        if (error) throw error;
        const hit = data.users.find((u) => u.email?.toLowerCase() === email);
        if (hit) return hit;
        if (data.users.length < perPage) return null;
    }
}

/** 24 base64url characters (144 bits), well under bcrypt's 72-byte cap. */
function generatePassword(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    return Buffer.from(bytes).toString("base64url");
}

const user = await findUser(target);
if (!user) {
    console.error(`No user found for ${target}`);
    process.exit(1);
}

const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
console.log(`Project: ${new URL(url).host}`);
console.log(`User:    ${user.email ?? "(no email)"} (${user.id})`);
console.log(`Sign-in: ${providers.join(", ") || "unknown"}`);

if (!skipConfirm) {
    const answer = prompt("Set a new password for this user? [y/N]");
    if (answer?.trim().toLowerCase() !== "y") {
        console.log("Aborted, nothing changed.");
        process.exit(0);
    }
}

const password = generatePassword();
const { error } = await sb.auth.admin.updateUserById(user.id, { password });
if (error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
}

console.log("\nPassword updated. New password:\n");
console.log(`    ${password}\n`);

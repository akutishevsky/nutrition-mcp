import { Hono } from "hono";
import { requireSameOrigin } from "./accounts/csrf.js";
import { requireWebSession } from "./accounts/session.js";
import { exportAccountData } from "./account-export.js";

export function createAccountExportRouter(): Hono {
    const router = new Hono();
    router.post(
        "/account/portal/export",
        requireSameOrigin,
        requireWebSession,
        async (c) => c.json(await exportAccountData(c.get("munchUserId"))),
    );
    return router;
}

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * S0 e2e scaffolding: the packaged `.mobile-web` bundle (what actually
 * ships inside the Android shell) is served statically and driven at
 * Pixel 7 size. This is the web-level half of the boot evidence — the
 * Android emulator lane in mobile-android.yml boots the same bundle
 * inside the packaged APK.
 *
 * Requires `bun run mobile:web` first (CI does this in the website-e2e
 * job before running this config).
 */

const bundleDir = join(process.cwd(), ".mobile-web");

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
};

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
    if (!existsSync(join(bundleDir, "index.html"))) {
        throw new Error(
            ".mobile-web bundle is missing — run `bun run mobile:web` before this spec",
        );
    }
    server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        const relative = normalize(decodeURIComponent(url.pathname)).replace(
            /^(\.\.[/\\])+|^[/\\]+/,
            "",
        );
        const filePath = join(
            bundleDir,
            relative === "" ? "index.html" : relative,
        );
        if (
            !filePath.startsWith(bundleDir) ||
            !existsSync(filePath) ||
            !statSync(filePath).isFile()
        ) {
            response.writeHead(404, { "content-type": "text/plain" });
            response.end("not found");
            return;
        }
        response.writeHead(200, {
            "content-type":
                MIME[extname(filePath)] ?? "application/octet-stream",
            "cache-control": "no-store",
        });
        createReadStream(filePath).pipe(response);
    });
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Static bundle server did not bind a port");
    }
    baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("packaged mobile bundle cold-starts to the sign-in shell", async ({
    page,
}) => {
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
        if (request.resourceType() === "document") {
            failedRequests.push(request.url());
        }
    });

    await page.goto(`${baseURL}/`);
    // The packaged entry restores the installed-app route and, with no
    // stored session, replaces to the packaged sign-in page.
    await expect(page).toHaveURL(/\/mobile-login\.html/);
    await expect(page).toHaveTitle("Sign in · Munch");
    await expect(
        page.getByRole("heading", { level: 1, name: "Welcome back." }),
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Email me a sign-in link" }),
    ).toBeVisible();
    expect(failedRequests).toEqual([]);
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        )
        .toBe(true);
});

test("packaged bundle ships the mobile runtime and the Pantry page", async ({
    request,
}) => {
    const runtime = await request.get(`${baseURL}/mobile-runtime.js`);
    expect(runtime.ok()).toBe(true);
    const runtimeBody = await runtime.text();
    expect(runtimeBody).toContain("https://munch.business");
    expect(runtimeBody).toContain("MunchSecureSession");

    const pantry = await request.get(`${baseURL}/pantry.html`);
    expect(pantry.ok()).toBe(true);
    const pantryBody = await pantry.text();
    expect(pantryBody).toContain("/pantry-native.js");
});

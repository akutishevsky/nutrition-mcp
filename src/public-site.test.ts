import { describe, expect, test } from "bun:test";
import { rewritePublicSite } from "./public-site.js";
import { SITE } from "./routes.js";

describe("rewritePublicSite", () => {
    test("returns text unchanged when site is canonical SITE", () => {
        const html =
            '<a href="https://nutrition-mcp.com/mcp">nutrition-mcp</a>';
        expect(rewritePublicSite(html, SITE)).toBe(html);
    });

    test("rewrites origins to PUBLIC_BASE_URL", () => {
        const input = [
            "URL: https://nutrition-mcp.com/mcp",
            "Placeholder: https://your-domain.com/mcp",
            "Dashboard: nutrition-mcp.com/dashboard",
            "Email: anton@nutrition-mcp.com",
        ].join("\n");

        const out = rewritePublicSite(input, "https://nutrition.example.com");
        expect(out).toBe(
            [
                "URL: https://nutrition.example.com/mcp",
                "Placeholder: https://nutrition.example.com/mcp",
                "Dashboard: nutrition.example.com/dashboard",
                "Email: anton@nutrition-mcp.com",
            ].join("\n"),
        );
    });
});

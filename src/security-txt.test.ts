import { test, expect, describe } from "bun:test";

import {
    SECURITY_ADVISORY_URL,
    SECURITY_CONTACT,
    SECURITY_POLICY_URL,
    securityTxt,
} from "./security-txt.js";

const NOW = new Date("2026-09-24T15:30:00Z");
const DAY_MS = 86_400_000;

function expiresOf(body: string): Date {
    const line = body.split("\n").find((l) => l.startsWith("Expires: "));
    return new Date(line!.slice("Expires: ".length));
}

describe("securityTxt", () => {
    test("emits the six fields in order, with a trailing newline", () => {
        expect(securityTxt({ contact: "sec@example.test", now: NOW })).toBe(
            [
                "Contact: mailto:sec@example.test",
                `Contact: ${SECURITY_ADVISORY_URL}`,
                "Expires: 2027-03-23T00:00:00Z",
                "Preferred-Languages: en, uk",
                "Canonical: https://nutrition-mcp.com/.well-known/security.txt",
                `Policy: ${SECURITY_POLICY_URL}`,
                "",
            ].join("\n"),
        );
    });

    test("Expires is in the future, under a year ahead, whole-second UTC", () => {
        const body = securityTxt({ contact: "sec@example.test", now: NOW })!;
        const raw = body.match(/^Expires: (.+)$/m)![1]!;
        expect(raw).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        const ahead = expiresOf(body).getTime() - NOW.getTime();
        expect(ahead).toBeGreaterThan(0);
        expect(ahead).toBeLessThan(365 * DAY_MS);
    });

    test("is identical for two times on the same UTC day", () => {
        const a = securityTxt({
            contact: "sec@example.test",
            now: new Date("2026-09-24T00:00:01Z"),
        });
        const b = securityTxt({
            contact: "sec@example.test",
            now: new Date("2026-09-24T23:59:59Z"),
        });
        expect(a).toBe(b);
    });

    test("returns null without a contact", () => {
        expect(securityTxt({ contact: "", now: NOW })).toBeNull();
    });

    test("has exactly one Expires and at least one Contact", () => {
        const body = securityTxt({ contact: "sec@example.test", now: NOW })!;
        expect(body.match(/^Expires: /gm)).toHaveLength(1);
        expect(body.match(/^Contact: /gm)!.length).toBeGreaterThanOrEqual(1);
    });

    test("uses a site override for Canonical", () => {
        const body = securityTxt({
            contact: "sec@example.test",
            now: NOW,
            site: "https://fork.example",
        })!;
        expect(body).toContain(
            "Canonical: https://fork.example/.well-known/security.txt\n",
        );
    });

    // Catches a committed `bun run depersonalize` (without --dry), which
    // blanks this constant and takes the live route down to a 404.
    test("the published contact is the maintainer's address", () => {
        expect(SECURITY_CONTACT).toBe("anton@nutrition-mcp.com");
    });
});

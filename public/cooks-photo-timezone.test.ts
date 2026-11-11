import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync(new URL("./app.js", import.meta.url), "utf8");
function fn(name: string) {
    return source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))![0];
}
test("cook times use cook timezone even when the profile defaults to UTC", () => {
    const time = runInNewContext(
        fn("formatTime") +
            '; formatTime("2026-09-16T16:06:14Z", "America/New_York")',
        { state: { bootstrap: { profile: { timezone: "UTC" } } } },
    );
    expect(time).toBe("12:06 PM");
});
test("cook details expose original photo and submit the cook timezone", () => {
    const context = {
        escapeHtml: (s: unknown) => String(s ?? "").replaceAll('"', "&quot;"),
        number: String,
        formatDate: () => "September 16",
        formatTime: () => "12:06 PM",
        cookTimelineMarkup: () => "",
        // Photo-flow P8: the cook update form's photo attach is the
        // shared capture control now; its markup is not what this
        // test exercises.
        photoCaptureMarkup: () => "",
        detail: {
            cook: {
                id: "test",
                title: "Test",
                timezone: "America/New_York",
                status: "active",
                cook_date: "2026-09-16",
                version: 1,
            },
            dishes: [],
            events: [],
            outcomes: [],
            updates: [],
            media: [
                {
                    url: "https://munch.example/media/test?token=fixture",
                    file_name: "test.png",
                },
            ],
        },
    };
    const html = runInNewContext(
        fn("cookDetailActionsMarkup") +
            fn("cookDetailMarkup") +
            "; cookDetailMarkup(detail)",
        context,
    );
    expect(html).toContain('aria-label="Open original cook photo"');
    expect(html).toContain(
        'href="https://munch.example/media/test?token=fixture"',
    );
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('name="timezone" value="America/New_York"');
});

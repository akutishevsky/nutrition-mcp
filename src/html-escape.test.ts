import { test, expect } from "bun:test";
import { escapeHtml } from "./html-escape.js";

test("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
        "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
});

test("escapes & first, so an existing entity is escaped, not kept", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
});

test("leaves everything else untouched", () => {
    const s = "Ünïcødé — 日本語 / ?q=1#frag";
    expect(escapeHtml(s)).toBe(s);
});

test("apostrophe: false keeps ' literal and escapes the other four", () => {
    expect(
        escapeHtml(`<b title="x">it's & more</b>`, { apostrophe: false }),
    ).toBe("&lt;b title=&quot;x&quot;&gt;it's &amp; more&lt;/b&gt;");
});

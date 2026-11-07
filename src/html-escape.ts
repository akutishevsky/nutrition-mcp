// The one HTML escaper for server-rendered pages (the OAuth login page, the
// Apple Health sync pages, the dashboard's sign-in and sign-out pages). It
// used to be copied into each of those three files, and the copies differed:
// the health-sync one also escaped `'`, the other two did not. The stricter
// form is the default here, so the result is safe in text content and in
// double- or single-quoted attribute values alike.
//
// `apostrophe: false` reproduces the older four-character form byte for byte.
// Only the OAuth login page asks for it: every attribute it renders is
// double-quoted, so a literal `'` there is safe, and its tests pin its exact
// bytes (English copy alone has "couldn't", "you'll" and the like).
export function escapeHtml(
    str: string,
    opts: { apostrophe?: boolean } = {},
): string {
    const out = str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    return opts.apostrophe === false ? out : out.replace(/'/g, "&#39;");
}

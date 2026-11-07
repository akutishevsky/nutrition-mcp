/* nutrition-mcp.com — the signed-in web dashboard (/dashboard).
   The page (scripts/gen-dashboard.ts) is a static shell; this file builds
   every view in it from the cookie-authenticated JSON API (/api/dashboard/*)
   and hosts the chat widgets, each a sandboxed iframe of
   /dashboard/widget/:key, through the MCP Apps handshake — the same one a
   chat client runs (see scripts/widget-harness.ts).

   Rules this file keeps:
   - No innerHTML with data, ever: every node is built with createElement and
     filled with textContent. No eval, no new Function, no dependencies.
   - The view lives in location.hash (#today, #today/YYYY-MM-DD, #history,
     #history/YYYY-MM-DD, #trends, #body), so reload and links work.
   - The current view refetches every 60 s while the tab is visible, and on
     returning to it. A failed refresh keeps the last good data on screen
     under a banner.
   - A 401 from any call means the session is gone: go back to sign-in.
   Theme, the sheet menu and the language switcher are public/site.js's. */
(function () {
    "use strict";

    var cfgEl = document.getElementById("dash-strings");
    var mount = document.getElementById("dash-view");
    var main = document.getElementById("main");
    if (!cfgEl || !mount || !main) return;
    var CFG = JSON.parse(cfgEl.textContent || "{}");
    var S = CFG.strings;
    var LOCALE = CFG.locale || "en";
    // British English for "en": the design's "Sat 7 Nov" / "7 November".
    var FMT_LOCALE =
        (CFG.lang || LOCALE) === "en" ? "en-GB" : CFG.lang || LOCALE;
    var VIEWS = ["today", "history", "trends", "body"];
    var REFRESH_MS = 60000;
    // The widget-backed read tools the dashboard API runs; a widget asking
    // for anything else is refused.
    var HOST_TOOLS = [
        "get_nutrition_summary",
        "get_goal_progress",
        "get_trends",
        "get_weight_trends",
        "get_digest",
    ];
    // The Body page draws measurements in its own card, so the weight widget
    // must not draw them a second time inside its details.
    var MEASUREMENTS_META_KEY = "nutrition-mcp.com/body-measurements";

    /* ------------------------------------------------------------------ */
    /* small helpers                                                        */
    /* ------------------------------------------------------------------ */

    var SVGNS = "http://www.w3.org/2000/svg";

    function el(tag, attrs, kids) {
        var n = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                var v = attrs[k];
                if (v == null || v === false) return;
                if (k === "class") n.className = v;
                else if (k === "text") n.textContent = v;
                else if (k === "on")
                    Object.keys(v).forEach(function (ev) {
                        n.addEventListener(ev, v[ev]);
                    });
                else n.setAttribute(k, v === true ? "" : String(v));
            });
        }
        add(n, kids);
        return n;
    }
    function add(n, kids) {
        if (kids == null || kids === false) return n;
        if (!Array.isArray(kids)) kids = [kids];
        kids.forEach(function (k) {
            if (k == null || k === false) return;
            if (Array.isArray(k)) add(n, k);
            else if (typeof k === "string" || typeof k === "number")
                n.appendChild(document.createTextNode(String(k)));
            else n.appendChild(k);
        });
        return n;
    }
    function clear(n) {
        while (n.firstChild) n.removeChild(n.firstChild);
        return n;
    }

    // Icons as [tag, attrs] lists, drawn into a 24×24 stroke SVG.
    var ICONS = {
        chevL: [["path", { d: "m15 18-6-6 6-6" }]],
        chevR: [["path", { d: "m9 18 6-6-6-6" }]],
        calendar: [
            ["rect", { x: 3, y: 4, width: 18, height: 18, rx: 3 }],
            ["path", { d: "M16 2v4M8 2v4M3 10h18" }],
        ],
        warn: [
            [
                "path",
                {
                    d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
                },
            ],
            ["path", { d: "M12 9v4M12 17h.01" }],
        ],
        chat: [
            [
                "path",
                {
                    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
                },
            ],
        ],
        arrow: [["path", { d: "M5 12h14M13 6l6 6-6 6" }]],
        search: [
            ["circle", { cx: 11, cy: 11, r: 7 }],
            ["path", { d: "m20 20-3.5-3.5" }],
        ],
        close: [["path", { d: "M6 6l12 12M18 6 6 18" }]],
        tape: [
            [
                "path",
                {
                    d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z",
                },
            ],
            [
                "path",
                { d: "m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" },
            ],
        ],
    };
    function icon(name, size, strokeWidth, stroke) {
        var s = document.createElementNS(SVGNS, "svg");
        s.setAttribute("width", size);
        s.setAttribute("height", size);
        s.setAttribute("viewBox", "0 0 24 24");
        s.setAttribute("fill", "none");
        s.setAttribute("stroke", stroke || "currentColor");
        s.setAttribute("stroke-width", strokeWidth || 2.4);
        s.setAttribute("stroke-linecap", "round");
        s.setAttribute("stroke-linejoin", "round");
        s.setAttribute("aria-hidden", "true");
        s.setAttribute("focusable", "false");
        ICONS[name].forEach(function (p) {
            var c = document.createElementNS(SVGNS, p[0]);
            Object.keys(p[1]).forEach(function (k) {
                c.setAttribute(k, p[1][k]);
            });
            s.appendChild(c);
        });
        return s;
    }
    // The saved-meals bookmark is a filled glyph.
    function bookmarkIcon() {
        var s = document.createElementNS(SVGNS, "svg");
        s.setAttribute("width", 18);
        s.setAttribute("height", 18);
        s.setAttribute("viewBox", "0 0 24 24");
        s.setAttribute("fill", "currentColor");
        s.setAttribute("aria-hidden", "true");
        var p = document.createElementNS(SVGNS, "path");
        p.setAttribute(
            "d",
            "M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1Z",
        );
        s.appendChild(p);
        return s;
    }
    // The brand mark (logoSvg() in scripts/site-partials.ts, cord included).
    function logoMark(id) {
        var s = document.createElementNS(SVGNS, "svg");
        s.setAttribute("class", "nm-logo");
        s.setAttribute("viewBox", "0 0 64 64");
        s.setAttribute("width", 30);
        s.setAttribute("height", 30);
        s.setAttribute("aria-hidden", "true");
        s.setAttribute("focusable", "false");
        var m = document.createElementNS(SVGNS, "mask");
        var mid = "nm-logo-" + id;
        m.setAttribute("id", mid);
        m.setAttribute("maskUnits", "userSpaceOnUse");
        m.setAttribute("x", 0);
        m.setAttribute("y", 0);
        m.setAttribute("width", 64);
        m.setAttribute("height", 64);
        [
            [
                "path",
                {
                    d: "M32 20C26 14 10 14 9 32C8 46 18 58 25 58C28 58 30 56.5 32 56.5C34 56.5 36 58 39 58C46 58 56 46 55 32C54 14 38 14 32 20Z",
                    fill: "#fff",
                },
            ],
            [
                "path",
                { d: "M35 15C35 8 40 4 47 4C47 11 42 15 35 15Z", fill: "#fff" },
            ],
            [
                "path",
                {
                    d: "M22 32H42V37A10 10 0 0 1 32 47A10 10 0 0 1 22 37Z",
                    fill: "#000",
                },
            ],
            [
                "rect",
                { x: 24.5, y: 24, width: 5, height: 10, rx: 2.5, fill: "#000" },
            ],
            [
                "rect",
                { x: 34.5, y: 24, width: 5, height: 10, rx: 2.5, fill: "#000" },
            ],
            [
                "path",
                {
                    d: "M32 45V51",
                    stroke: "#000",
                    "stroke-width": 5,
                    "stroke-linecap": "round",
                },
            ],
        ].forEach(function (p) {
            var c = document.createElementNS(SVGNS, p[0]);
            Object.keys(p[1]).forEach(function (k) {
                c.setAttribute(k, p[1][k]);
            });
            m.appendChild(c);
        });
        s.appendChild(m);
        var r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("width", 64);
        r.setAttribute("height", 64);
        r.setAttribute("fill", "currentColor");
        r.setAttribute("mask", "url(#" + mid + ")");
        s.appendChild(r);
        return s;
    }

    function fill(str, vars) {
        return String(str).replace(/\{(\w+)\}/g, function (m, k) {
            return vars && vars[k] != null ? String(vars[k]) : m;
        });
    }
    var pluralRules = null;
    try {
        pluralRules = new Intl.PluralRules(FMT_LOCALE);
    } catch (e) {}
    function plural(forms, n, vars) {
        var cat = pluralRules ? pluralRules.select(n) : "other";
        return fill(forms[cat] || forms.other, vars);
    }
    var numFmts = {};
    function num(n, digits) {
        var d = digits || 0;
        if (!numFmts[d])
            numFmts[d] = new Intl.NumberFormat(FMT_LOCALE, {
                minimumFractionDigits: d,
                maximumFractionDigits: d,
            });
        return numFmts[d].format(n);
    }
    // Signed with a real minus sign, as the widgets print changes.
    function signed(n, digits) {
        var s = num(Math.abs(n), digits);
        if (n > 0) return "+" + s;
        if (n < 0) return "−" + s;
        return s;
    }

    /* ---- calendar dates as YYYY-MM-DD strings, at UTC noon ---- */
    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }
    function ms(s) {
        var p = s.split("-");
        return Date.UTC(+p[0], +p[1] - 1, +p[2], 12);
    }
    function ymd(t) {
        var d = new Date(t);
        return (
            d.getUTCFullYear() +
            "-" +
            pad(d.getUTCMonth() + 1) +
            "-" +
            pad(d.getUTCDate())
        );
    }
    function addDays(s, n) {
        return ymd(ms(s) + n * 864e5);
    }
    function isoDow(s) {
        var w = new Date(ms(s)).getUTCDay();
        return w === 0 ? 7 : w;
    }
    function daysBetween(a, b) {
        return Math.round((ms(b) - ms(a)) / 864e5);
    }
    function isDate(s) {
        return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
    }
    var dateFmts = {};
    function fmtDate(s, opts) {
        var key = JSON.stringify(opts);
        if (!dateFmts[key])
            dateFmts[key] = new Intl.DateTimeFormat(
                FMT_LOCALE,
                Object.assign({ timeZone: "UTC" }, opts),
            );
        return dateFmts[key].format(new Date(ms(s)));
    }
    var DAY_MONTH = { day: "numeric", month: "short" };
    var DAY_MONTH_LONG = { day: "numeric", month: "long" };
    var WEEKDAY_DAY_MONTH = {
        weekday: "short",
        day: "numeric",
        month: "short",
    };
    // HH:MM of an instant in the user's timezone.
    function clock(t) {
        var opts = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
        try {
            if (app.tz) opts.timeZone = app.tz;
            return new Intl.DateTimeFormat(FMT_LOCALE, opts).format(
                new Date(t),
            );
        } catch (e) {
            delete opts.timeZone;
            return new Intl.DateTimeFormat(FMT_LOCALE, opts).format(
                new Date(t),
            );
        }
    }
    // Today in the user's timezone, before /status has answered.
    function localToday() {
        try {
            return new Intl.DateTimeFormat("en-CA", {
                timeZone: app.tz || undefined,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(new Date());
        } catch (e) {
            return ymd(Date.now());
        }
    }

    /* ------------------------------------------------------------------ */
    /* API                                                                  */
    /* ------------------------------------------------------------------ */

    var app = {
        tz: null,
        today: null,
        hasData: null,
        lastOk: 0,
        view: null,
        leaving: false,
    };

    function signIn() {
        if (app.leaving) return;
        app.leaving = true;
        location.replace(
            "/dashboard/login?locale=" + encodeURIComponent(LOCALE),
        );
    }

    function api(path) {
        return fetch(path, {
            credentials: "same-origin",
            cache: "no-store",
            headers: { accept: "application/json" },
        }).then(function (r) {
            if (r.status === 401) {
                signIn();
                var e = new Error("unauthenticated");
                e.auth = true;
                throw e;
            }
            return r
                .json()
                .catch(function () {
                    return null;
                })
                .then(function (j) {
                    if (!r.ok || !j || j.ok !== true) {
                        var err = new Error(
                            (j && j.error) || "http " + r.status,
                        );
                        err.status = r.status;
                        throw err;
                    }
                    return j;
                });
        });
    }
    function csrfReady() {
        var i = document.querySelector("[data-dash-csrf]");
        return !i || !!i.value;
    }
    // GET /api/dashboard/session. Its 503 (a profile read failed) still
    // carries the csrf, which needs only the cookie. With `signingOut`, a 401
    // means there is nothing left to end: go to the landing page.
    function loadCsrf(signingOut) {
        return fetch("/api/dashboard/session", {
            credentials: "same-origin",
            cache: "no-store",
            headers: { accept: "application/json" },
        })
            .then(function (r) {
                if (r.status === 401) {
                    if (signingOut) {
                        app.leaving = true;
                        location.assign(LOCALE === "en" ? "/" : "/" + LOCALE);
                    } else signIn();
                    return null;
                }
                return r.json().catch(function () {
                    return null;
                });
            })
            .then(
                function (j) {
                    if (!j) return;
                    if (
                        j.ok &&
                        typeof j.timezone === "string" &&
                        j.timezone &&
                        !app.tz
                    )
                        app.tz = j.timezone;
                    if (typeof j.csrf === "string" && j.csrf)
                        document
                            .querySelectorAll("[data-dash-csrf]")
                            .forEach(function (i) {
                                i.value = j.csrf;
                            });
                },
                function () {},
            );
    }
    function tool(name, args) {
        return api(
            "/api/dashboard/tool/" +
                encodeURIComponent(name) +
                "?args=" +
                encodeURIComponent(JSON.stringify(args || {})),
        );
    }
    function q(params) {
        return Object.keys(params)
            .map(function (k) {
                return (
                    encodeURIComponent(k) + "=" + encodeURIComponent(params[k])
                );
            })
            .join("&");
    }

    /* ------------------------------------------------------------------ */
    /* MCP Apps host shim                                                   */
    /* ------------------------------------------------------------------ */

    var widgets = [];
    var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function effectiveTheme() {
        return (
            document.body.getAttribute("data-theme") ||
            (darkQuery.matches ? "dark" : "light")
        );
    }
    function hostContext() {
        return {
            theme: effectiveTheme(),
            locale: CFG.lang || LOCALE,
            displayMode: "inline",
            platform: "web",
        };
    }
    function post(w, msg) {
        try {
            if (w.frame.contentWindow)
                w.frame.contentWindow.postMessage(msg, "*");
        } catch (e) {}
    }
    function reply(w, id, result) {
        post(w, { jsonrpc: "2.0", id: id, result: result });
    }
    function replyError(w, id, code, message) {
        post(w, {
            jsonrpc: "2.0",
            id: id,
            error: { code: code, message: message },
        });
    }
    function payloadOf(key, r) {
        var meta = r && r._meta && typeof r._meta === "object" ? r._meta : null;
        if (meta && key === "weight-trends" && MEASUREMENTS_META_KEY in meta) {
            meta = Object.assign({}, meta);
            delete meta[MEASUREMENTS_META_KEY];
        }
        var p = { structuredContent: r.structuredContent };
        if (meta) p._meta = meta;
        return p;
    }

    /** One framed widget card. It starts short (130px), like a strict host,
     *  and grows on ui/notifications/size-changed. */
    function createWidget(key, title) {
        // No src yet: a frame loads its widget (about 600 KB) only once
        // its first payload arrives, so hidden views cost nothing.
        var frame = el("iframe", {
            sandbox: "allow-scripts",
            title: title,
            referrerpolicy: "no-referrer",
        });
        var card = el("div", { class: "dash-wcard" }, frame);
        var w = {
            key: key,
            frame: frame,
            card: card,
            ready: false,
            payload: null,
            sent: null,
        };
        widgets.push(w);
        return w;
    }
    function setPayload(w, result) {
        w.payload = payloadOf(w.key, result);
        if (!w.frame.getAttribute("src"))
            w.frame.setAttribute("src", "/dashboard/widget/" + w.key);
        deliver(w);
    }
    function deliver(w) {
        if (!w.ready || !w.payload) return;
        // Repainting resets a widget's own toggles, so an unchanged
        // payload is not sent again.
        var s = JSON.stringify(w.payload);
        if (s === w.sent) return;
        w.sent = s;
        post(w, {
            jsonrpc: "2.0",
            method: "ui/notifications/tool-result",
            params: w.payload,
        });
    }
    function onToolCall(w, d) {
        var p = d.params || {};
        var name = p.name;
        if (HOST_TOOLS.indexOf(name) === -1) {
            replyError(w, d.id, -32601, "Not available on the dashboard.");
            return;
        }
        tool(name, p.arguments || {}).then(
            function (r) {
                var out = payloadOf(
                    name === "get_weight_trends" ? "weight-trends" : "",
                    r,
                );
                out.content = [];
                reply(w, d.id, out);
            },
            function () {
                replyError(w, d.id, -32603, "Couldn't load this right now.");
            },
        );
    }
    window.addEventListener("message", function (e) {
        var w = null;
        for (var i = 0; i < widgets.length; i++)
            if (widgets[i].frame.contentWindow === e.source) w = widgets[i];
        if (!w) return;
        var d = e.data;
        if (!d || typeof d !== "object" || typeof d.method !== "string") return;
        switch (d.method) {
            case "ui/initialize": {
                var p = d.params || {};
                if (!p.appInfo || !p.protocolVersion) return;
                // A (re)loaded frame starts a new handshake: nothing goes to
                // it until it says initialized again.
                w.ready = false;
                w.sent = null;
                reply(w, d.id, {
                    protocolVersion: "2026-01-26",
                    hostInfo: {
                        name: "nutrition-mcp-dashboard",
                        version: "1.0.0",
                    },
                    hostCapabilities: { serverTools: {} },
                    hostContext: hostContext(),
                });
                return;
            }
            case "ui/notifications/initialized":
                w.ready = true;
                w.sent = null;
                deliver(w);
                return;
            case "ui/notifications/size-changed": {
                var sp = d.params || {};
                var hgt = Number(sp.height);
                // A frame inside a hidden view measures at zero width; it
                // reports again once shown.
                if (!(hgt > 0) || Number(sp.width) === 0) return;
                w.frame.style.height = Math.ceil(hgt) + "px";
                return;
            }
            case "tools/call":
                if (d.id != null) onToolCall(w, d);
                return;
            default:
                if (d.id != null)
                    replyError(w, d.id, -32601, "Not supported by this host.");
        }
    });
    // Theme changes reach every widget, from the site's control or the OS.
    var lastTheme = effectiveTheme();
    function pushTheme() {
        var t = effectiveTheme();
        if (t === lastTheme) return;
        lastTheme = t;
        widgets.forEach(function (w) {
            if (!w.ready) return;
            post(w, {
                jsonrpc: "2.0",
                method: "ui/notifications/host-context-changed",
                params: { hostContext: { theme: t } },
            });
        });
    }
    new MutationObserver(pushTheme).observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme"],
    });
    darkQuery.addEventListener("change", pushTheme);

    /* ------------------------------------------------------------------ */
    /* shared page parts                                                    */
    /* ------------------------------------------------------------------ */

    function pageHead(opts) {
        var attrs = { class: "dash-head" };
        if (opts.aria) attrs["aria-label"] = opts.aria;
        return el("section", attrs, [
            el("div", { class: "dash-head-l" }, [
                opts.pill || null,
                el("div", null, [
                    (opts.eyebrowEl = el("p", {
                        class: "nm-eyebrow",
                        text: opts.eyebrow || "",
                    })),
                    (opts.titleEl = el("h1", {
                        class: "dash-title",
                        text: opts.title,
                    })),
                ]),
            ]),
            opts.right || null,
        ]);
    }
    function pill() {
        var dot = el("span", { class: "dash-pill-dot", "aria-hidden": "true" });
        var text = el("span");
        var node = el("span", { class: "nm-pill" }, [dot, text]);
        return { node: node, dot: dot, text: text };
    }
    function setPill(p, tone, label, busy) {
        if (tone === "ok") p.dot.removeAttribute("data-tone");
        else p.dot.setAttribute("data-tone", tone);
        if (busy) p.dot.setAttribute("data-busy", "");
        else p.dot.removeAttribute("data-busy");
        if (p.text.textContent !== label) p.text.textContent = label;
    }

    function renderBanner(v) {
        clear(v.bannerSlot);
        if (!v.failed) return;
        var stale = v.loaded && app.lastOk;
        var msg = stale
            ? fill(S.error.stale, { time: clock(app.lastOk) })
            : S.error.first;
        add(
            v.bannerSlot,
            el("div", { class: "dash-banner", role: "alert" }, [
                icon("warn", 20, 2.4, "var(--cal-icon)"),
                el("p", null, [
                    el("b", { text: stale ? S.error.lead : S.error.leadFirst }),
                    " " + msg,
                ]),
                el("button", {
                    type: "button",
                    class: "dash-btn-line",
                    text: S.error.retry,
                    on: {
                        click: function () {
                            refresh(v.id);
                        },
                    },
                }),
            ]),
        );
    }

    function skelHead(w) {
        return el("div", { class: "dash-skel-h" }, [
            el("span"),
            el("span", { style: "width:" + w + "px" }),
        ]);
    }
    function skelCard(cls, height, kids) {
        return el(
            "div",
            {
                class: "dash-skel " + (cls || ""),
                style: height ? "height:" + height + "px" : null,
            },
            kids,
        );
    }
    function skelBars(n, h) {
        var out = [];
        for (var i = 0; i < n; i++)
            out.push(
                el("span", { style: "height:" + h + "px;border-radius:14px" }),
            );
        return out;
    }
    function skeleton(view) {
        var kids;
        if (view === "history") {
            var cells = [];
            for (var i = 0; i < 35; i++) cells.push(el("i"));
            kids = el("div", { class: "dash-row" }, [
                skelCard("dash-cal", null, [
                    skelHead(110),
                    el("div", { class: "dash-skel-cells" }, cells),
                ]),
                skelCard("dash-day", 360, [
                    skelHead(130),
                    el("div", { class: "dash-skel-gauge" }),
                    el("div", { style: "flex:1;background:transparent" }),
                    skelBars(2, 44),
                ]),
            ]);
        } else if (view === "trends") {
            kids = el("div", { class: "dash-row" }, [
                skelCard("dash-trends-main", 420, [
                    skelHead(160),
                    el("div", { class: "dash-skel-grid" }, [
                        el("i"),
                        el("i"),
                        el("i"),
                    ]),
                    el("div", { class: "dash-skel-fill" }, [
                        el("i"),
                        el("i"),
                        el("i"),
                    ]),
                ]),
                skelCard("dash-trends-side", 420, [
                    skelHead(120),
                    el("div", { class: "dash-skel-gauge" }),
                    el("div", { style: "flex:1;background:transparent" }),
                    skelBars(2, 44),
                ]),
            ]);
        } else if (view === "body") {
            kids = [
                skelCard(null, 360, [
                    skelHead(140),
                    el("div", { class: "dash-skel-fill" }, [
                        el("i"),
                        el("i"),
                        el("i"),
                    ]),
                    el("span", {
                        style: "height:14px;width:60%;border-radius:7px;align-self:center",
                    }),
                ]),
                skelCard(null, null, [
                    skelHead(120),
                    el("div", { class: "dash-skel-grid" }, [
                        el("i"),
                        el("i"),
                        el("i"),
                    ]),
                ]),
            ];
        } else {
            kids = [
                el("div", { class: "dash-row" }, [
                    skelCard(null, 360, [
                        skelHead(120),
                        el("div", { class: "dash-skel-gauge" }),
                        el("div", { style: "flex:1;background:transparent" }),
                        el("span", {
                            style: "height:14px;width:60%;border-radius:7px;align-self:center",
                        }),
                    ]),
                    skelCard(null, 360, [
                        skelHead(100),
                        el("div", { class: "dash-skel-grid" }, [
                            el("i"),
                            el("i"),
                            el("i"),
                        ]),
                        el("div", { class: "dash-skel-fill" }, [
                            el("i"),
                            el("i"),
                            el("i"),
                        ]),
                    ]),
                ]),
                skelCard(null, null, [skelHead(90), skelBars(3, 52)]),
            ];
        }
        var box = el("div", { class: "dash-stack" }, [
            el("span", { class: "vh", text: S.loading }),
            el("div", { class: "dash-stack", "aria-hidden": "true" }, kids),
        ]);
        // The two first skeleton cards share a row the way the data does.
        if (view === "today") {
            var row = box.lastChild.firstChild;
            row.firstChild.style.flex = "1 1 340px";
            row.lastChild.style.flex = "2 1 440px";
        }
        return box;
    }

    /* ------------------------------------------------------------------ */
    /* views                                                                */
    /* ------------------------------------------------------------------ */

    var V = {};

    function makeView(id) {
        var v = {
            id: id,
            root: el("div", { class: "dash-page", hidden: true }),
            bannerSlot: el("div", { class: "dash-stack" }),
            bodySlot: el("div", { class: "dash-stack" }),
            loaded: false,
            failed: false,
            busy: 0,
            seq: 0,
            lastLoad: 0,
        };
        V[id] = v;
        mount.appendChild(v.root);
        return v;
    }

    /* ---------------- Today ---------------- */

    function digestPeriodFor(date) {
        if (!app.today) return null;
        if (date === app.today) return "today";
        if (date === addDays(app.today, -1)) return "yesterday";
        return null;
    }

    function buildToday() {
        var v = makeView("today");
        v.date = null;
        v.pill = pill();
        v.pill.node.setAttribute("role", "status");
        v.prev = el(
            "button",
            {
                type: "button",
                class: "dash-ibtn",
                "aria-label": S.today.prevDay,
                on: {
                    click: function () {
                        goDate(addDays(currentDate(), -1));
                    },
                },
            },
            icon("chevL", 16, 2.6),
        );
        v.next = el(
            "button",
            {
                type: "button",
                class: "dash-ibtn",
                "aria-label": S.today.nextDay,
                on: {
                    click: function () {
                        goDate(addDays(currentDate(), 1));
                    },
                },
            },
            icon("chevR", 16, 2.6),
        );
        v.picker = el("input", {
            type: "date",
            name: "date",
            tabindex: "-1",
            "aria-hidden": "true",
            on: {
                change: function () {
                    if (isDate(v.picker.value)) goDate(v.picker.value);
                },
            },
        });
        var calBtn = el(
            "button",
            {
                type: "button",
                class: "dash-calbtn",
                "aria-label": S.today.pickDate,
                on: {
                    click: function () {
                        v.picker.max = app.today || "";
                        v.picker.value = currentDate();
                        try {
                            v.picker.showPicker();
                        } catch (e) {
                            v.picker.focus();
                            v.picker.click();
                        }
                    },
                },
            },
            [icon("calendar", 14, 2.4), S.today.calendar, v.picker],
        );
        var head = {
            aria: S.today.dateAriaLabel,
            pill: v.pill.node,
            title: S.today.titleToday,
            right: el("div", { class: "dash-stepper" }, [
                v.prev,
                calBtn,
                v.next,
            ]),
        };
        add(v.root, [pageHead(head), v.bannerSlot, v.bodySlot]);
        v.eyebrow = head.eyebrowEl;
        v.title = head.titleEl;

        v.cards = {
            summary: createWidget("nutrition-summary", S.widgets.summary),
            digest: createWidget("digest", S.widgets.digest),
            goals: createWidget("goal-progress", S.widgets.goals),
            weight: createWidget("weight-trends", S.widgets.weight),
            trends: createWidget("trends", S.widgets.trends),
        };
        v.grid = el("div", { class: "dash-stack" }, [
            el("div", { class: "dash-row" }, [
                el("div", { class: "dash-stack dash-col-a" }, [
                    v.cards.summary.card,
                    v.cards.digest.card,
                ]),
                el("div", { class: "dash-stack dash-col-b" }, [
                    v.cards.goals.card,
                    v.cards.weight.card,
                ]),
            ]),
            v.cards.trends.card,
        ]);
        v.empty = buildEmpty();

        v.paintHead = function () {
            var d = currentDate();
            if (!d) return;
            v.eyebrow.textContent =
                fmtDate(d, { weekday: "long" }) +
                " · " +
                fmtDate(d, DAY_MONTH_LONG);
            v.title.textContent = !app.today
                ? S.today.titleToday
                : d === app.today
                  ? S.today.titleToday
                  : d === addDays(app.today, -1)
                    ? S.today.titleYesterday
                    : fmtDate(d, DAY_MONTH);
            v.next.disabled = !app.today || d >= app.today;
        };
        v.paintChrome = function () {
            v.paintHead();
            var label, tone;
            if (v.busy) {
                tone = "idle";
                label = S.sync.updating;
            } else if (v.failed) {
                tone = "warn";
                label = app.lastOk
                    ? fill(S.sync.offline, { time: clock(app.lastOk) })
                    : S.sync.offlineNever;
            } else if (app.hasData === false) {
                tone = "idle";
                label = S.sync.empty;
            } else if (app.lastOk) {
                tone = "ok";
                label = fill(S.sync.updated, { time: clock(app.lastOk) });
            } else {
                tone = "idle";
                label = S.sync.updating;
            }
            setPill(v.pill, tone, label, !!v.busy);
        };
        v.load = function () {
            var date = currentDate();
            if (app.hasData === false) {
                swap(v, v.empty);
                return Promise.resolve();
            }
            v.grid.setAttribute("aria-busy", "true");
            var calls = {
                summary: tool("get_nutrition_summary", {
                    start_date: date,
                    end_date: date,
                }),
                goals: tool("get_goal_progress", { date: date }),
                weight: tool("get_weight_trends", { days: 30, end_date: date }),
                trends: tool("get_trends", { days: 7, end_date: date }),
            };
            var period = digestPeriodFor(date);
            if (period) calls.digest = tool("get_digest", { period: period });
            return settle(calls).then(function (r) {
                if (date !== currentDate()) return;
                v.grid.removeAttribute("aria-busy");
                // A failed card keeps its last payload only when that was for
                // this same day (a stale refresh); another day's numbers
                // under this date's heading would be wrong.
                var sameDay = v.shownDate === date;
                v.shownDate = date;
                v.cards.digest.card.hidden = !period;
                Object.keys(v.cards).forEach(function (k) {
                    if (r.ok[k]) setPayload(v.cards[k], r.ok[k]);
                    else if (!v.cards[k].payload || !sameDay)
                        v.cards[k].card.hidden = true;
                    if (r.ok[k]) v.cards[k].card.hidden = false;
                });
                if (!period) v.cards.digest.card.hidden = true;
                swap(v, v.grid);
                if (r.failed) throw new Error("partial");
            });
        };
        return v;
    }

    function currentDate() {
        var d = V.today.date || app.today || localToday();
        return d;
    }
    function goDate(date) {
        if (!isDate(date)) return;
        if (app.today && date > app.today) date = app.today;
        location.hash = date === app.today ? "#today" : "#today/" + date;
    }

    function buildEmpty() {
        var a = el(
            "section",
            {
                class: "nm-card nm-card-lg dash-empty dash-empty-a",
                "aria-labelledby": "dash-empty-h",
            },
            [
                el("span", { class: "nm-blob big", "aria-hidden": "true" }),
                el(
                    "span",
                    { class: "dash-mark", "aria-hidden": "true" },
                    logoMark("e"),
                ),
                el("div", { class: "dash-empty-text" }, [
                    el("h2", { id: "dash-empty-h", text: S.empty.title }),
                    el("p", { text: S.empty.body }),
                ]),
                el("div", { class: "dash-say-list" }, [
                    el("span", {
                        class: "dash-label",
                        text: S.empty.trySaying,
                    }),
                    S.empty.examples.map(function (t) {
                        return el("span", { class: "dash-say" }, [
                            icon("chat", 16, 2.4, "var(--acc-txt)"),
                            t,
                        ]);
                    }),
                ]),
            ],
        );
        var b = el(
            "section",
            {
                class: "nm-card nm-card-lg dash-empty dash-empty-b",
                "aria-labelledby": "dash-steps-h",
            },
            [
                el("h2", {
                    id: "dash-steps-h",
                    class: "dash-h2",
                    text: S.empty.stepsTitle,
                }),
                el(
                    "ol",
                    { class: "dash-steps" },
                    S.empty.steps.map(function (t, i) {
                        return el("li", null, [
                            el("span", {
                                text: String(i + 1),
                                "aria-hidden": "true",
                            }),
                            el("span", { text: t }),
                        ]);
                    }),
                ),
                el("a", { class: "dash-cta", href: CFG.connectHref || "/" }, [
                    S.empty.connectCta,
                    icon("arrow", 13, 2.8),
                ]),
            ],
        );
        return el("div", { class: "dash-row dash-row-stretch" }, [a, b]);
    }

    /* ---------------- History ---------------- */

    function buildHistory() {
        var v = makeView("history");
        v.gridEnd = null; // the Sunday that closes the five-week grid
        v.sel = null;
        v.days = null;
        v.query = "";
        v.searchSeq = 0;
        v.pill = pill();

        v.input = el("input", {
            type: "search",
            name: "q",
            placeholder: S.history.searchPlaceholder,
            autocomplete: "off",
            spellcheck: "false",
            on: {
                input: function () {
                    onQuery(v);
                },
                keydown: function (e) {
                    if (e.key === "Escape" && v.input.value) {
                        e.preventDefault();
                        v.input.value = "";
                        onQuery(v);
                    }
                },
            },
        });
        v.clearBtn = el(
            "button",
            {
                type: "button",
                class: "dash-clear",
                "aria-label": S.history.clearSearch,
                hidden: true,
                on: {
                    click: function () {
                        v.input.value = "";
                        onQuery(v);
                        v.input.focus();
                    },
                },
            },
            icon("close", 12, 3),
        );
        v.search = el("label", { class: "dash-search" }, [
            icon("search", 16, 2.4, "var(--ink3)"),
            el("span", { class: "vh", text: S.history.searchLabel }),
            v.input,
            v.clearBtn,
        ]);
        v.earlier = el(
            "button",
            {
                type: "button",
                class: "dash-ibtn",
                "aria-label": S.history.earlier,
                on: {
                    click: function () {
                        pageHistory(v, -35);
                    },
                },
            },
            icon("chevL", 16, 2.6),
        );
        v.later = el(
            "button",
            {
                type: "button",
                class: "dash-ibtn",
                "aria-label": S.history.later,
                on: {
                    click: function () {
                        pageHistory(v, 35);
                    },
                },
            },
            icon("chevR", 16, 2.6),
        );
        v.pagerLabel = el("span", { class: "dash-pager-label" });
        v.pager = el("div", { class: "dash-stepper" }, [
            v.earlier,
            v.pagerLabel,
            v.later,
        ]);
        var head = {
            aria: S.history.rangeAriaLabel,
            pill: v.pill.node,
            title: S.history.title,
            right: el("div", { class: "dash-tools" }, [v.search, v.pager]),
        };
        v.headEl = pageHead(head);
        v.eyebrow = head.eyebrowEl;

        // Search results.
        v.resTitle = el("h2", {
            id: "dash-res-h",
            class: "dash-h2",
            role: "status",
        });
        v.resList = el("ul");
        v.resNote = el("div");
        v.results = el(
            "section",
            {
                class: "nm-card dash-card dash-results",
                "aria-labelledby": "dash-res-h",
                hidden: true,
            },
            [
                el("div", { class: "dash-results-head" }, [
                    v.resTitle,
                    el("span", {
                        class: "dash-card-sub",
                        text: S.history.resultsSub,
                    }),
                ]),
                v.resList,
                v.resNote,
            ],
        );

        // Calendar.
        v.calGrid = el("div", { class: "dash-grid", role: "group" });
        v.calWeek = el("div", { class: "dash-week", "aria-hidden": "true" });
        // Monday-first weekday names (2024-01-01 was a Monday).
        for (var i = 0; i < 7; i++)
            v.calWeek.appendChild(
                el("span", {
                    text: fmtDate(addDays("2024-01-01", i), {
                        weekday: "short",
                    }),
                }),
            );
        v.calSum = el("p", { class: "dash-cal-sum" });
        v.cal = el(
            "section",
            {
                class: "nm-card dash-card dash-cal",
                "aria-labelledby": "dash-cal-h",
            },
            [
                el("span", { class: "nm-blob", "aria-hidden": "true" }),
                el("div", { class: "dash-card-head" }, [
                    el(
                        "span",
                        { class: "dash-icon acc", "aria-hidden": "true" },
                        icon("calendar", 18, 2.4),
                    ),
                    el("h2", {
                        id: "dash-cal-h",
                        class: "dash-h2",
                        text: S.history.calendarTitle,
                    }),
                    el("div", { class: "dash-legend" }, [
                        legend("var(--acc)", S.history.legendOn),
                        legend("var(--d-togo)", S.history.legendUnder),
                        legend("var(--d-over)", S.history.legendOver),
                    ]),
                ]),
                v.calWeek,
                v.calGrid,
                v.calSum,
            ],
        );
        v.dayCards = {
            digest: createWidget("digest", S.widgets.digest),
            summary: createWidget("nutrition-summary", S.widgets.summary),
        };
        v.dayEmpty = el("p", { class: "dash-day-empty", hidden: true });
        v.dayCards.digest.card.hidden = true;
        v.dayCards.summary.card.hidden = true;
        v.day = el("div", { class: "dash-day", "aria-live": "polite" }, [
            v.dayCards.digest.card,
            v.dayCards.summary.card,
            v.dayEmpty,
        ]);

        // Saved meals.
        v.savedSub = el("span", { class: "dash-card-sub" });
        v.savedGrid = el("div", { class: "dash-saved-grid" });
        v.saved = el(
            "section",
            {
                class: "nm-card dash-card",
                "aria-labelledby": "dash-saved-h",
            },
            [
                el("div", { class: "dash-card-head" }, [
                    el(
                        "span",
                        {
                            class: "dash-icon",
                            style: "--c: var(--car); --c-icon: var(--car-icon)",
                            "aria-hidden": "true",
                        },
                        bookmarkIcon(),
                    ),
                    el("div", { class: "dash-card-title" }, [
                        el("h2", {
                            id: "dash-saved-h",
                            class: "dash-h2",
                            text: S.history.savedTitle,
                        }),
                        v.savedSub,
                    ]),
                ]),
                v.savedGrid,
            ],
        );
        v.browse = el("div", { class: "dash-stack" }, [
            el("div", { class: "dash-row" }, [v.cal, v.day]),
            v.saved,
        ]);
        v.content = el("div", { class: "dash-stack" }, [v.results, v.browse]);
        add(v.root, [v.headEl, v.bannerSlot, v.bodySlot]);

        v.paintChrome = function () {
            paintHistoryHead(v);
        };
        v.load = function () {
            ensureGrid(v);
            var from = addDays(v.gridEnd, -34);
            var to = v.gridEnd < app.today ? v.gridEnd : app.today;
            var end = v.gridEnd;
            return settle({
                cal: api(
                    "/api/dashboard/calendar?" + q({ from: from, to: to }),
                ),
                saved: api("/api/dashboard/saved-meals"),
            }).then(function (r) {
                if (end !== v.gridEnd) return;
                if (r.ok.cal) {
                    v.days = {};
                    (r.ok.cal.days || []).forEach(function (d) {
                        v.days[d.date] = d;
                    });
                    v.daysFor = end;
                }
                if (r.ok.saved) renderSaved(v, r.ok.saved.savedMeals || []);
                if (v.daysFor === end) {
                    if (!v.sel || v.sel < from || v.sel > end)
                        v.sel = defaultSel(v);
                    renderCalendar(v);
                }
                swap(v, v.content);
                var dayP = loadDay(v);
                if (r.failed) throw new Error("partial");
                return dayP;
            });
        };
        return v;
    }

    function legend(color, label) {
        return el("span", null, [
            el("i", { style: "--c:" + color, "aria-hidden": "true" }),
            label,
        ]);
    }
    function ensureGrid(v) {
        var today = app.today || localToday();
        var latest = addDays(today, 7 - isoDow(today));
        if (!v.gridEnd || v.gridEnd > latest) v.gridEnd = latest;
    }
    function gridTo(v) {
        return v.gridEnd < app.today ? v.gridEnd : app.today;
    }
    function defaultSel(v) {
        var to = gridTo(v);
        for (var d = to; d >= addDays(v.gridEnd, -34); d = addDays(d, -1)) {
            var day = v.days && v.days[d];
            if (day && day.mealCount > 0) return d;
        }
        return to;
    }
    function pageHistory(v, delta) {
        ensureGrid(v);
        var today = app.today || localToday();
        var latest = addDays(today, 7 - isoDow(today));
        var next = addDays(v.gridEnd, delta);
        if (next > latest) next = latest;
        v.gridEnd = next;
        v.days = null;
        v.sel = null;
        // The old #history/<date> no longer names the selection; without
        // this, clicking that date's search hit would not fire hashchange.
        if (location.hash !== "#history")
            history.replaceState(null, "", "#history");
        paintHistoryHead(v);
        clear(v.calGrid);
        v.calSum.textContent = "";
        refresh("history");
    }
    function paintHistoryHead(v) {
        ensureGrid(v);
        var from = addDays(v.gridEnd, -34);
        var today = app.today || localToday();
        var to = v.gridEnd < today ? v.gridEnd : today;
        var total = daysBetween(from, to) + 1;
        var logged = 0;
        if (v.days)
            Object.keys(v.days).forEach(function (k) {
                if (k <= to && v.days[k].mealCount > 0) logged++;
            });
        if (v.days)
            setPill(
                v.pill,
                "ok",
                plural(S.history.loggedPill, total, {
                    logged: num(logged),
                    total: num(total),
                }),
                false,
            );
        else if (v.failed && !v.busy)
            setPill(v.pill, "warn", S.sync.offlineNever, false);
        else setPill(v.pill, "idle", S.sync.updating, true);
        v.eyebrow.textContent =
            fmtDate(from, DAY_MONTH_LONG) + " – " + fmtDate(to, DAY_MONTH_LONG);
        v.pagerLabel.textContent =
            fmtDate(from, DAY_MONTH) + " – " + fmtDate(v.gridEnd, DAY_MONTH);
        v.later.disabled = v.gridEnd >= addDays(today, 7 - isoDow(today));
        v.calGrid.setAttribute(
            "aria-label",
            fill(S.history.calendarAriaLabel, {
                from: fmtDate(from, DAY_MONTH_LONG),
                to: fmtDate(v.gridEnd, DAY_MONTH_LONG),
            }),
        );
    }

    var compactQuery = window.matchMedia("(max-width: 699px)");
    compactQuery.addEventListener("change", function () {
        if (V.history && V.history.days) renderCalendar(V.history);
    });

    function renderCalendar(v) {
        clear(v.calGrid);
        var from = addDays(v.gridEnd, -34);
        var compact = compactQuery.matches;
        var today = app.today;
        var stats = { n: 0, sum: 0, on: 0, over: 0, under: 0, missing: 0 };
        for (var i = 0; i < 35; i++) {
            var date = addDays(from, i);
            var day = v.days[date] || null;
            var future = date > today;
            var isToday = date === today;
            var has = !!(day && day.mealCount > 0);
            var dnum = Number(date.slice(8));
            var monthLabel = "";
            if (isToday && !compact) monthLabel = S.history.cellToday;
            else if (i === 0 || dnum === 1)
                monthLabel = fmtDate(date, { month: "short" });
            var kcal = "";
            if (has && day.calories != null)
                kcal = compact
                    ? num(day.calories / 1000, 1) + "k"
                    : num(day.calories);
            var aria =
                fmtDate(date, DAY_MONTH_LONG) +
                (isToday ? S.history.cellTodaySuffix : "") +
                (has && day.calories != null
                    ? fill(S.history.cellKcal, { kcal: num(day.calories) })
                    : S.history.cellNothing);
            var cell = el(
                "button",
                {
                    type: "button",
                    class: "dash-cell",
                    "aria-label": aria,
                    "aria-pressed": date === v.sel ? "true" : "false",
                    "data-status": has && day ? day.status : null,
                    "data-today": isToday,
                    "data-future": future,
                    disabled: future || !has,
                    "data-date": date,
                },
                [
                    el("span", { class: "dash-cell-d" }, [
                        el("span", { text: String(dnum) }),
                        monthLabel ? el("span", { text: monthLabel }) : null,
                    ]),
                    el("span", { class: "dash-cell-k", text: kcal }),
                    el("span", { class: "dash-cell-b", "aria-hidden": "true" }),
                ],
            );
            cell.addEventListener("click", onCell);
            v.calGrid.appendChild(cell);
            if (!future && !isToday) {
                if (has && day.calories != null) {
                    stats.n++;
                    stats.sum += day.calories;
                    if (day.status === "on") stats.on++;
                    else if (day.status === "over") stats.over++;
                    else if (day.status === "under") stats.under++;
                } else stats.missing++;
            }
        }
        v.calSum.textContent = stats.n
            ? fill(S.history.summary, {
                  avg: num(Math.round(stats.sum / stats.n)),
                  n: num(stats.n),
                  on: num(stats.on),
                  over: num(stats.over),
                  under: num(stats.under),
                  missing: num(stats.missing),
              })
            : S.history.summaryNone;
        paintHistoryHead(v);
    }
    function onCell(e) {
        var date = e.currentTarget.getAttribute("data-date");
        if (!date) return;
        location.hash = "#history/" + date;
    }
    function selectDay(v, date) {
        v.sel = date;
        Array.prototype.forEach.call(v.calGrid.children, function (c) {
            c.setAttribute(
                "aria-pressed",
                c.getAttribute("data-date") === date ? "true" : "false",
            );
        });
        // loadDay shows its own failure; nothing to rethrow here.
        return loadDay(v).catch(function () {});
    }
    function loadDay(v) {
        var date = v.sel;
        if (!date) return Promise.resolve();
        var day = v.days && v.days[date];
        var cards = v.dayCards;
        if (!day || !(day.mealCount > 0)) {
            cards.digest.card.hidden = true;
            cards.summary.card.hidden = true;
            v.dayEmpty.textContent = fill(S.history.dayEmpty, {
                date: fmtDate(date, WEEKDAY_DAY_MONTH),
            });
            v.dayEmpty.hidden = false;
            return Promise.resolve();
        }
        v.dayEmpty.hidden = true;
        v.day.setAttribute("aria-busy", "true");
        var period = digestPeriodFor(date);
        var use = period ? cards.digest : cards.summary;
        var other = period ? cards.summary : cards.digest;
        var call = period
            ? tool("get_digest", { period: period })
            : tool("get_nutrition_summary", {
                  start_date: date,
                  end_date: date,
              });
        return call.then(
            function (r) {
                if (v.sel !== date) return;
                v.day.removeAttribute("aria-busy");
                other.card.hidden = true;
                use.card.hidden = false;
                setPayload(use, r);
            },
            function (e) {
                if (v.sel === date) {
                    v.day.removeAttribute("aria-busy");
                    // Never the previous day's card under this selection.
                    cards.digest.card.hidden = true;
                    cards.summary.card.hidden = true;
                    if (!(e && e.auth)) {
                        v.dayEmpty.textContent = fill(S.history.dayFailed, {
                            date: fmtDate(date, WEEKDAY_DAY_MONTH),
                        });
                        v.dayEmpty.hidden = false;
                    }
                }
                throw e;
            },
        );
    }
    function renderSaved(v, list) {
        clear(v.savedGrid);
        v.savedSub.textContent = list.length
            ? fill(S.history.savedSub, { name: list[0].name })
            : S.history.savedSubNone;
        if (!list.length) {
            v.savedGrid.appendChild(
                el("p", { class: "dash-muted", text: S.history.savedNone }),
            );
            return;
        }
        list.forEach(function (s) {
            var macros = [];
            if (s.protein_g != null)
                macros.push(
                    el("span", {
                        text: fill(S.history.protein, { g: num(s.protein_g) }),
                    }),
                );
            if (s.carbs_g != null)
                macros.push(
                    el("span", {
                        text: fill(S.history.carbs, { g: num(s.carbs_g) }),
                    }),
                );
            if (s.fat_g != null)
                macros.push(
                    el("span", {
                        text: fill(S.history.fat, { g: num(s.fat_g) }),
                    }),
                );
            if (s.itemCount > 0)
                macros.push(
                    el("span", {
                        text:
                            "· " +
                            plural(S.history.items, s.itemCount, {
                                n: num(s.itemCount),
                            }),
                    }),
                );
            v.savedGrid.appendChild(
                el("div", { class: "dash-saved-card" }, [
                    el("span", { class: "dash-saved-name", text: s.name }),
                    el("span", { class: "dash-saved-kcal" }, [
                        el("b", {
                            text: s.calories != null ? num(s.calories) : "–",
                        }),
                        el("span", { text: S.history.perServing }),
                    ]),
                    el("span", { class: "dash-saved-macros" }, macros),
                ]),
            );
        });
    }

    var searchTimer = null;
    function onQuery(v) {
        var raw = v.input.value;
        var query = raw.trim();
        v.query = query;
        var searching = query.length > 0;
        v.clearBtn.hidden = !searching;
        if (searching) v.search.setAttribute("data-active", "");
        else v.search.removeAttribute("data-active");
        v.results.hidden = !searching;
        v.browse.hidden = searching;
        v.pager.hidden = searching;
        clearTimeout(searchTimer);
        var seq = ++v.searchSeq;
        if (!searching) return;
        clear(v.resList);
        clear(v.resNote);
        if (query.length < 2) {
            v.resTitle.textContent = S.history.tooShort;
            return;
        }
        v.resTitle.textContent = S.history.searching;
        searchTimer = setTimeout(function () {
            api("/api/dashboard/search?" + q({ q: query.slice(0, 100) })).then(
                function (r) {
                    if (seq !== v.searchSeq) return;
                    renderResults(v, query, r.meals || [], r.savedMeals || []);
                },
                function (e) {
                    if (seq !== v.searchSeq || e.auth) return;
                    v.resTitle.textContent = S.history.searchFailed;
                },
            );
        }, 250);
    }
    function highlight(text, query) {
        var lower = text.toLocaleLowerCase();
        var ql = query.toLocaleLowerCase();
        var i = lower.length === text.length ? lower.indexOf(ql) : -1;
        if (i < 0 || !ql) return { nodes: [text], hit: false };
        return {
            nodes: [
                text.slice(0, i),
                el("mark", { text: text.slice(i, i + query.length) }),
                text.slice(i + query.length),
            ],
            hit: true,
        };
    }
    function renderResults(v, query, meals, saved) {
        clear(v.resList);
        clear(v.resNote);
        v.resTitle.textContent = plural(S.history.resultsTitle, meals.length, {
            n: num(meals.length),
            q: query,
        });
        meals.forEach(function (m) {
            var hl = highlight(m.description || "", query);
            var item = !hl.hit && m.items && m.items.length ? m.items[0] : null;
            var when =
                m.date === app.today
                    ? S.today.titleToday
                    : fmtDate(m.date, WEEKDAY_DAY_MONTH);
            v.resList.appendChild(
                el(
                    "li",
                    null,
                    el(
                        "a",
                        {
                            class: "dash-hit",
                            href: "#history/" + m.date,
                            on: {
                                // The day already in the hash fires no
                                // hashchange: close the search here.
                                click: function (e) {
                                    if (location.hash !== "#history/" + m.date)
                                        return;
                                    e.preventDefault();
                                    leaveSearch(v);
                                    route();
                                },
                            },
                        },
                        [
                            el("span", { class: "dash-hit-when" }, [
                                el("b", { text: when }),
                                el("span", { text: m.time || "" }),
                            ]),
                            el("span", { class: "dash-hit-what" }, [
                                el("span", null, hl.nodes),
                                item
                                    ? el("span", {
                                          text: fill(S.history.ingredient, {
                                              item: item,
                                          }),
                                      })
                                    : null,
                            ]),
                            el("span", { class: "dash-hit-kcal" }, [
                                el("b", {
                                    text:
                                        m.calories != null
                                            ? num(m.calories)
                                            : "–",
                                }),
                                el("span", { text: S.history.kcal }),
                            ]),
                        ],
                    ),
                ),
            );
        });
        if (!meals.length)
            v.resNote.appendChild(
                el("p", {
                    class: "dash-results-note",
                    text: S.history.noResults,
                }),
            );
        saved.slice(0, 3).forEach(function (s) {
            v.resNote.appendChild(
                el("p", {
                    class: "dash-saved-hit",
                    text: fill(S.history.savedHit, {
                        name: s.name,
                        kcal: s.calories != null ? num(s.calories) : "–",
                    }),
                }),
            );
        });
    }
    // A result row opens its day in the calendar.
    function leaveSearch(v) {
        if (!v.input.value) return;
        v.input.value = "";
        onQuery(v);
    }

    /* ---------------- Trends ---------------- */

    function buildTrends() {
        var v = makeView("trends");
        add(v.root, [
            // No aria-label: the h1 names the section.
            pageHead({
                eyebrow: S.trends.eyebrow,
                title: S.trends.title,
            }),
            v.bannerSlot,
            v.bodySlot,
        ]);
        v.cards = {
            trends: createWidget("trends", S.widgets.trends),
            digest: createWidget("digest", S.widgets.digest),
        };
        v.grid = el("div", { class: "dash-row" }, [
            el("div", { class: "dash-trends-main" }, v.cards.trends.card),
            el("div", { class: "dash-trends-side" }, v.cards.digest.card),
        ]);
        v.paintChrome = function () {};
        v.load = function () {
            return settle({
                trends: tool("get_trends", { days: 30 }),
                digest: tool("get_digest", { period: "last_7_days" }),
            }).then(function (r) {
                showCards(v.cards, r);
                swap(v, v.grid);
                if (r.failed) throw new Error("partial");
            });
        };
        return v;
    }

    /* ---------------- Body ---------------- */

    function buildBody() {
        var v = makeView("body");
        add(v.root, [
            // No aria-label: the h1 names the section.
            pageHead({
                eyebrow: S.body.eyebrow,
                title: S.body.title,
            }),
            v.bannerSlot,
            v.bodySlot,
        ]);
        v.cards = { weight: createWidget("weight-trends", S.widgets.weight) };
        v.measSub = el("span", { class: "dash-card-sub" });
        v.measBody = el("div", { class: "dash-stack", style: "gap:16px" });
        v.meas = el(
            "section",
            {
                class: "nm-card dash-card",
                "aria-labelledby": "dash-meas-h",
            },
            [
                el("span", {
                    class: "nm-blob",
                    style: "--c: var(--d-meas)",
                    "aria-hidden": "true",
                }),
                el("div", { class: "dash-card-head" }, [
                    el(
                        "span",
                        {
                            class: "dash-icon",
                            style: "--c: var(--d-meas); --c-icon: var(--d-meas)",
                            "aria-hidden": "true",
                        },
                        icon("tape", 18, 2.4),
                    ),
                    el(
                        "div",
                        { class: "dash-card-title", style: "flex:1 1 220px" },
                        [
                            el("h2", {
                                id: "dash-meas-h",
                                class: "dash-h2",
                                text: S.body.measTitle,
                            }),
                            v.measSub,
                        ],
                    ),
                ]),
                v.measBody,
            ],
        );
        v.grid = el("div", { class: "dash-stack" }, [
            v.cards.weight.card,
            v.meas,
        ]);
        v.paintChrome = function () {};
        v.load = function () {
            return settle({
                weight: tool("get_weight_trends", { days: 90 }),
                meas: api("/api/dashboard/measurements"),
            }).then(function (r) {
                showCards(v.cards, r);
                if (r.ok.meas) renderMeasurements(v, r.ok.meas);
                v.meas.hidden = !r.ok.meas && !v.measDone;
                swap(v, v.grid);
                if (r.failed) throw new Error("partial");
            });
        };
        return v;
    }

    function renderMeasurements(v, data) {
        v.measDone = true;
        clear(v.measBody);
        var sites = data.sites || [];
        if (!sites.length) {
            v.measSub.textContent = "";
            v.measSub.hidden = true;
            v.measBody.appendChild(
                el("p", { class: "dash-muted", text: S.body.noMeasurements }),
            );
            return;
        }
        v.measSub.hidden = false;
        var latest = null;
        var earliest = null;
        var grid = el("div", { class: "dash-meas-grid" });
        sites.forEach(function (s) {
            var l = s.latest;
            if (!latest || l.date > latest) latest = l.date;
            var f = s.first || l;
            if (!earliest || f.date < earliest) earliest = f.date;
            var change =
                s.first && s.entries > 1
                    ? fill(S.body.sinceFirst, {
                          delta: signed(
                              Math.round((l.value - s.first.value) * 10) / 10,
                              1,
                          ),
                      })
                    : S.body.firstEntry;
            grid.appendChild(
                el("div", { class: "dash-meas-tile" }, [
                    el("span", { text: S.body.kinds[s.kind] || s.kind }),
                    el("span", { class: "dash-meas-v" }, [
                        el("b", { text: num(l.value, 1) }),
                        el("span", { text: " " + l.unit }),
                    ]),
                    el("span", { text: change }),
                ]),
            );
        });
        v.measSub.textContent = fill(S.body.measSub, {
            date: fmtDate(latest, DAY_MONTH),
        });
        v.measBody.appendChild(grid);
        var missing = (data.unmeasured || []).map(function (k) {
            return S.body.kindsInline[k] || k;
        });
        if (missing.length)
            v.measBody.appendChild(
                el("p", { class: "dash-muted dash-meas-note" }, [
                    el("b", { text: S.body.notMeasured }),
                    " " + missing.join(", ") + ".",
                ]),
            );
        v.measBody.appendChild(
            el("p", {
                class: "dash-hint",
                text: fill(data.unit === "in" ? S.body.hintIn : S.body.hintCm, {
                    date: fmtDate(earliest, DAY_MONTH),
                }),
            }),
        );
    }

    /* ------------------------------------------------------------------ */
    /* loading and refresh                                                  */
    /* ------------------------------------------------------------------ */

    // Promise.allSettled over a keyed object.
    function settle(calls) {
        var keys = Object.keys(calls);
        return Promise.all(
            keys.map(function (k) {
                return calls[k].then(
                    function (r) {
                        return { k: k, r: r };
                    },
                    function (e) {
                        return { k: k, e: e };
                    },
                );
            }),
        ).then(function (list) {
            var out = { ok: {}, failed: false };
            list.forEach(function (x) {
                if (x.e) {
                    if (x.e.auth) throw x.e;
                    out.failed = true;
                } else out.ok[x.k] = x.r;
            });
            return out;
        });
    }
    function showCards(cards, r) {
        Object.keys(cards).forEach(function (k) {
            if (r.ok[k]) {
                setPayload(cards[k], r.ok[k]);
                cards[k].card.hidden = false;
            } else if (!cards[k].payload) cards[k].card.hidden = true;
        });
    }
    function swap(v, node) {
        if (
            v.bodySlot.firstChild === node &&
            v.bodySlot.childNodes.length === 1
        )
            return;
        clear(v.bodySlot).appendChild(node);
    }
    function applyStatus(s) {
        if (typeof s.timezone === "string" && s.timezone) app.tz = s.timezone;
        if (isDate(s.today)) app.today = s.today;
        app.hasData = !!s.hasData;
    }
    // A #today/<date> later than the user's today (bookmarked, edited) is
    // not navigable: once today is known it falls back to today.
    function clampFuture() {
        var t = V.today;
        if (!(t.date && app.today && t.date > app.today)) return;
        t.date = null;
        if (/^#today\//.test(location.hash))
            history.replaceState(null, "", "#today");
    }
    function setBusy() {
        var v = V[app.view];
        main.setAttribute(
            "aria-busy",
            v && v.busy && !v.loaded ? "true" : "false",
        );
    }

    function refresh(id, opts) {
        var v = V[id];
        if (!v || app.leaving) return Promise.resolve();
        var seq = ++v.seq;
        v.busy++;
        // The skeleton only ever replaces nothing or itself: once real content
        // is on screen (even a partial first load) it stays mounted, so the
        // widget frames are never detached and reloaded by a refresh.
        if (
            !v.loaded &&
            (!v.bodySlot.firstChild || v.bodySlot.firstChild === v.skel)
        ) {
            v.skel = skeleton(id);
            swap(v, v.skel);
        }
        v.paintChrome();
        setBusy();
        return api("/api/dashboard/status")
            .then(function (s) {
                applyStatus(s);
                clampFuture();
                v.paintChrome();
                if (!csrfReady()) loadCsrf();
                return v.load();
            })
            .then(
                function () {
                    if (seq !== v.seq) return;
                    v.loaded = true;
                    v.failed = false;
                    app.lastOk = Date.now();
                },
                function (e) {
                    if (e && e.auth) return;
                    if (seq !== v.seq) return;
                    v.failed = true;
                    // Nothing loaded at all: drop the skeleton, the banner
                    // says why. Content a partial load painted stays.
                    if (v.bodySlot.firstChild === v.skel) clear(v.bodySlot);
                },
            )
            .then(function () {
                v.busy--;
                v.lastLoad = Date.now();
                renderBanner(v);
                v.paintChrome();
                setBusy();
            });
    }

    /* ------------------------------------------------------------------ */
    /* routing                                                              */
    /* ------------------------------------------------------------------ */

    function parseHash() {
        var h = location.hash.replace(/^#/, "");
        var parts = h.split("/");
        if (VIEWS.indexOf(parts[0]) === -1) return null;
        return { view: parts[0], date: isDate(parts[1]) ? parts[1] : null };
    }
    function markTabs(view) {
        document.querySelectorAll("[data-dash-tab]").forEach(function (a) {
            if (a.getAttribute("data-dash-tab") === view)
                a.setAttribute("aria-current", "page");
            else a.removeAttribute("aria-current");
        });
        // site.js re-places its sliding nav pill on resize.
        window.dispatchEvent(new Event("resize"));
    }
    function route() {
        var r = parseHash();
        if (!r) {
            if (app.view) return; // #main from the skip link, say
            r = { view: "today", date: null };
        }
        var v = V[r.view];
        var changed = app.view !== r.view;
        if (changed) {
            VIEWS.forEach(function (id) {
                V[id].root.hidden = id !== r.view;
            });
            app.view = r.view;
            markTabs(r.view);
            if (window.scrollY > 0) window.scrollTo(0, 0);
            document.title = S.tabs[r.view] + " · " + S.meta.title;
        }
        if (r.view === "today") {
            // Future days are not navigable, however the hash got there.
            if (r.date && app.today && r.date > app.today) {
                location.replace("#today");
                return;
            }
            var want = r.date && r.date !== app.today ? r.date : null;
            if (want !== v.date) {
                v.date = want;
                if (v.lastLoad) {
                    // The grid stays mounted (dimmed while busy) and the new
                    // day's payloads go into the live frames.
                    refresh("today");
                    return;
                }
            }
        }
        if (r.view === "history") {
            if (v.input.value) leaveSearch(v);
            if (r.date && r.date !== v.sel) {
                ensureGrid(v);
                if (r.date > v.gridEnd || r.date < addDays(v.gridEnd, -34)) {
                    // Page the grid so the five weeks end on that week.
                    v.gridEnd = addDays(r.date, 7 - isoDow(r.date));
                    v.days = null;
                    v.sel = r.date;
                    if (v.lastLoad) {
                        refresh("history");
                        return;
                    }
                } else if (v.days) {
                    selectDay(v, r.date);
                } else v.sel = r.date;
            }
        }
        if (!v.lastLoad) refresh(r.view);
        else if (Date.now() - v.lastLoad > REFRESH_MS && !v.busy)
            refresh(r.view);
        setBusy();
    }

    /* ------------------------------------------------------------------ */
    /* boot                                                                 */
    /* ------------------------------------------------------------------ */

    buildToday();
    buildHistory();
    buildTrends();
    buildBody();

    // Sign out needs the CSRF token, derived server-side from the session.
    // Fetched at boot, again after any refresh while it is still missing,
    // and on demand when Sign out is pressed without it.
    loadCsrf();
    document.querySelectorAll("[data-dash-csrf]").forEach(function (input) {
        var form = input.form;
        if (!form) return;
        form.addEventListener("submit", function (e) {
            if (input.value) return;
            e.preventDefault();
            loadCsrf(true).then(function () {
                // form.submit() fires no submit event, so this cannot loop.
                if (input.value) form.submit();
            });
        });
    });

    window.addEventListener("hashchange", route);
    route();

    setInterval(function () {
        if (document.visibilityState !== "visible" || !app.view) return;
        var v = V[app.view];
        if (!v.busy) refresh(app.view);
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible" || !app.view) return;
        var v = V[app.view];
        if (!v.busy && Date.now() - v.lastLoad >= REFRESH_MS) refresh(app.view);
    });
})();

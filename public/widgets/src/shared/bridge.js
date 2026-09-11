// Shared MCP Apps host bridge for every widget in this folder.
//
// Assembled inline into each widget at server startup (see src/widgets.ts) — the
// iframe CSP forbids external scripts, so there is no shared <script src>. Keep
// this the single source of truth for the iframe↔host handshake; per-widget code
// only supplies a config object to initWidget().
//
// initWidget(config) wires up:
//   - the JSON-RPC-over-postMessage handshake (ui/initialize with appInfo /
//     appCapabilities — NOT the MCP-core clientInfo / capabilities; strict hosts
//     like MCP Inspector silently drop a malformed request), the required
//     ui/notifications/initialized reply, and the ui/notifications/tool-result
//     listener that renders structuredContent.
//   - height reporting (ui/notifications/size-changed) via a max-content measure
//     plus a debounced ResizeObserver, so the host grows the iframe to fit.
//   - theme handling (data-theme from the host context / notifications, plus the
//     ChatGPT Apps SDK window.openai globals path).
//   - an outbound request channel, so a widget can call tools on the server
//     (config.onReady → api.callTool). Measured against MCP Inspector: ~370ms
//     per call steady state, no per-call approval prompt.
//   - a no-host fallback that renders config.sample so the file previews on its own.
//
// config = {
//   name:     string   // appInfo.name announced to the host
//   version?: string   // appInfo.version (default "1.0.0")
//   rootId?:  string   // element to render into (default "root")
//   loading:  string   // innerHTML shown while awaiting the first tool result
//   coerce:   (payload) => data | null   // pull the widget's data out of a payload
//   render:   (data) => void             // paint the widget from coerced data
//   sample:   any                        // fallback data for standalone preview
//   onReady?: (api) => void              // after the handshake; api documented below
// }
//
// api = {
//   callTool(name, args?, opts?) => Promise<result>   // opts.timeoutMs, default 60s
//   canCallTools: boolean        // host advertised hostCapabilities.serverTools
//   hostCapabilities: object     // as reported by the host
//   hostContext: object          // theme, containerDimensions, ...
//   hostInfo: object             // { name, version } of the host
//   updateModelContext(text)     // push a short summary into the model's context
// }
function initWidget(config) {
    const rootId = config.rootId || "root";
    const root = () => document.getElementById(rootId);

    function applyTheme(theme) {
        if (theme === "light" || theme === "dark") {
            document.documentElement.setAttribute("data-theme", theme);
        }
    }
    // Pull a theme hint out of whatever shape the host used.
    function themeFrom(obj) {
        if (!obj || typeof obj !== "object") return null;
        return (
            obj.theme ||
            obj.colorScheme ||
            obj.hostContext?.theme ||
            obj.styles?.theme ||
            obj.globals?.theme ||
            null
        );
    }
    // ---- the persistent footer note -----------------------------------
    // A small line under every painted widget saying that widget display is a
    // user setting — the only place that is said. ONE element for the life of
    // the document, re-attached rather than rebuilt.
    let footEl = null;
    let footObserver = null;

    function footNote() {
        if (!footEl) {
            footEl = document.createElement("div");
            // Styled by base.css, not inline: it has two homes and they look
            // different. Inside a widget's own `.foot` it is the second line of
            // that foot; standing alone under a widget with no strip
            // (weight-trends, import-meals) it has to draw its own hairline.
            footEl.className = "wnote";
        }
        // Re-read every time: T is only resolved once a template's render()
        // has called setLocale(), which is after the element is first built.
        footEl.textContent = T.chrome.widgetsNote;
        return footEl;
    }
    // Where the note goes: a widget's own foot if it declared one, otherwise
    // the root. The LAST slot, not the first — the dev gallery renders several
    // strips on one page and the note belongs at the end of it, not buried in
    // the first specimen.
    function footSlot() {
        const el = root();
        if (!el) return null;
        const slots = el.querySelectorAll("[data-widget-foot]");
        return slots.length ? slots[slots.length - 1] : el;
    }

    // Keep the note as #root's last child for as long as the root has content.
    // paint() is NOT the only thing that writes to the root: trends and
    // weight-trends repaint themselves from their own range toggles, replacing
    // #root.innerHTML wholesale and taking the note with it. Re-appending after
    // config.render() alone therefore loses the note on the first interaction,
    // which is exactly the bug this exists to prevent — so the rule is enforced
    // on the root itself and needs no cooperation from any template.
    function syncFooter() {
        const el = root();
        if (!el) return;
        // Genuinely empty must stay genuinely empty: meal-logged writes "" when
        // there are no goals, and `.wrap:empty { padding: 0 }` (base.css) is
        // what lets the host collapse the iframe to nothing. A note here would
        // stop `:empty` matching and leave a stripe of chrome behind.
        if (el.childNodes.length === 0) {
            if (footEl) footEl.remove();
            return;
        }
        const slot = footSlot();
        const foot = footNote();
        if (slot && slot.lastChild !== foot) slot.appendChild(foot);
    }

    // Render, then make sure the note is (still) there.
    function paint(data) {
        // A template that throws would otherwise leave whatever it last wrote —
        // on the first paint, the loading line — standing for good, with the
        // error swallowed by the postMessage handler that called us. Empty the
        // root instead: `.wrap:empty` collapses the iframe to nothing (the
        // state meal-logged uses on purpose), and the tool's text content still
        // reaches the reader. No message of our own, because a half-rendered or
        // "something went wrong" card is not better than no card.
        try {
            config.render(data);
        } catch (e) {
            try {
                console.error("[widget] render failed:", e);
            } catch (_) {}
            const el = root();
            if (el) el.innerHTML = "";
            return;
        }
        painted = true;
        // Watch from the FIRST real paint only, so the note never decorates the
        // loading state or the no-host card — both of which write to the root
        // directly and neither of which is a widget.
        if (!footObserver && typeof MutationObserver !== "undefined") {
            const el = root();
            if (el) {
                footObserver = new MutationObserver(syncFooter);
                // childList on the root alone — no `subtree`. Two reasons: a
                // widget's own DOM churn (a drawer opening, a chart restroking)
                // is none of this function's business, and footNote() writes
                // the note's own text, which under `subtree` would be a
                // mutation this observer reports to itself.
                footObserver.observe(el, { childList: true });
            }
        }
        // Self-limiting, deliberately. When the note lands in a `.foot` the
        // append is a mutation of that slot, which this observer does not watch
        // (no `subtree`), so it does not fire at all; when it falls back to the
        // root the observer runs once more and on that pass the note IS the
        // last child, so nothing happens and the loop ends there.
        syncFooter();
    }
    function show(payload) {
        const data = config.coerce(payload);
        if (!data) return false;
        paint(data);
        return true;
    }

    // ---- MCP Apps host bridge (JSON-RPC over postMessage) --------------
    // Critical: the host does NOT push tool data until the app announces
    // itself with a `ui/initialize` request and the handshake completes.
    // Without this, only the fallback sample below ever renders. The host
    // then sends `ui/notifications/tool-result` carrying structuredContent.
    // Spec: MCP Apps 2026-01-26.
    const host =
        window.parent && window.parent !== window ? window.parent : null;

    // One id space for every outbound request, and one pending map keyed by it.
    // Routing by pending id BEFORE anything else matters: a tools/call response
    // is a bare {id, result} with no `method`, so without this it would fall
    // through to the lenient payload branch and repaint the widget from the
    // response.
    // Ids are namespaced. The spec is SILENT on whether the app's and the host's
    // request ids share a space, and its own ui/resource-teardown example uses
    // id: 1 — the id ui/initialize would otherwise take. A string prefix removes
    // the collision entirely (JSON-RPC ids may be strings and hosts echo them
    // verbatim).
    let nextRequestId = 0;
    const pending = new Map();
    let painted = false;
    let hostContext = {};
    let hostCapabilities = {};
    let hostInfo = {};
    const warnedOrigins = new Set();

    function post(msg) {
        try {
            if (host) host.postMessage(msg, "*");
        } catch (_) {}
    }
    function notify(method, params) {
        post(
            params === undefined
                ? { jsonrpc: "2.0", method }
                : { jsonrpc: "2.0", method, params },
        );
    }
    function request(method, params, timeoutMs) {
        if (!host) return Promise.reject(new Error("no host"));
        const id = "app-" + ++nextRequestId;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(id);
                reject(
                    new Error(
                        method +
                            " timed out after " +
                            (timeoutMs || 60000) +
                            "ms",
                    ),
                );
            }, timeoutMs || 60000);
            pending.set(id, { resolve, reject, timer });
            post({ jsonrpc: "2.0", id, method, params: params || {} });
        });
    }

    // Report our content height so the host sizes the iframe to fit
    // (MCP Apps ui/notifications/size-changed). Without this the host
    // uses a default height and clips the widget. Measure the
    // document's natural (max-content) height, then restore.
    //
    // Deduped on the last size SENT, as the reference SDK does
    // (ext-apps App.setupSizeChangedNotifications): the observer below watches
    // both <html> and <body>, and one repaint resizes both, so without this a
    // single change went out two or three times at the same value. Keyed on
    // what was sent rather than on observer ticks, so a real change — width or
    // height, however small — is never suppressed.
    //
    // Nothing is sent until the handshake has settled (sizeLive), which is also
    // when the reference SDK starts reporting: a strict host may drop a
    // notification that arrives before ui/notifications/initialized, and a
    // report that was dropped but remembered as sent would dedupe the real one
    // away. The handshake then reports once explicitly (see ui/initialize).
    let sizeLive = false;
    let lastW = -1;
    let lastH = -1;
    function sendSize() {
        if (!host || !sizeLive) return;
        const el = document.documentElement;
        const prev = el.style.height;
        el.style.height = "max-content";
        const height = Math.ceil(el.getBoundingClientRect().height);
        el.style.height = prev;
        const width = Math.ceil(window.innerWidth);
        if (width === lastW && height === lastH) return;
        lastW = width;
        lastH = height;
        notify("ui/notifications/size-changed", { width, height });
    }
    function startSizing() {
        sizeLive = true;
        sendSize();
    }
    if (host && typeof ResizeObserver !== "undefined") {
        let scheduled = false;
        const ro = new ResizeObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                sendSize();
            });
        });
        ro.observe(document.documentElement);
        ro.observe(document.body);
    }

    const api = {
        // Call a tool on the SAME server that served this widget. The host
        // forwards any non-ui/ method on to the server (MCP Apps 2026-01-26).
        // Resolves with the CallToolResult ({content, structuredContent,
        // isError}); rejects on a JSON-RPC error or a timeout. A host may
        // legitimately never answer, so the timeout is the only safety net.
        callTool(name, args, opts) {
            return request(
                "tools/call",
                { name, arguments: args || {} },
                (opts && opts.timeoutMs) || 60000,
            ).then((result) => {
                if (result && result.isError) {
                    const text =
                        (result.content &&
                            result.content[0] &&
                            result.content[0].text) ||
                        "tool reported an error";
                    const err = new Error(text);
                    err.toolResult = result;
                    throw err;
                }
                return result;
            });
        },
        // Push a short summary into the model's context. Tool results returned
        // to the app do NOT reach the model, so without this the model has no
        // idea what the widget did. Send summaries only, never row data — the
        // whole point of doing the work in here is keeping bulk data out of the
        // token stream. Hosts MAY defer this until the user's next message, so
        // the widget's own UI must stand alone.
        updateModelContext(text) {
            // A REQUEST with `content` ContentBlocks — not a notification, and
            // not `{text}`. A strict host validating the envelope drops the wrong
            // shape silently, so the model would simply never learn what the
            // widget did.
            return request(
                "ui/update-model-context",
                { content: [{ type: "text", text: String(text) }] },
                15000,
            ).catch((e) => {
                try {
                    console.warn(
                        "[widget] ui/update-model-context failed:",
                        e.message,
                    );
                } catch (_) {}
            });
        },
        canCallTools: false,
        hostCapabilities,
        hostContext,
        // Identifies the host ("MCP-UI Host", "Claude", ...). A SIBLING of
        // hostContext in the initialize result, not nested inside it.
        hostInfo,
    };

    window.addEventListener("message", (event) => {
        // Only the host may drive this widget. window.parent.frames is reachable
        // cross-origin, so any sibling iframe on the host page could otherwise
        // forge a tool-result and repaint us with data of its choosing — which
        // matters when the render IS a confirmation step.
        if (host && event.source !== host) {
            // Per-origin and capped, not one-shot: extensions and devtools
            // bridges post into the page routinely, and a single shared flag
            // would let the first of those silence every genuine rejection —
            // leaving a widget stuck on "Loading…" with an empty console.
            const origin = event.origin || "(opaque)";
            if (warnedOrigins.size < 5 && !warnedOrigins.has(origin)) {
                warnedOrigins.add(origin);
                try {
                    console.warn(
                        "[widget] ignoring postMessage from a non-host window",
                        {
                            origin,
                            method: event.data && event.data.method,
                            id: event.data && event.data.id,
                        },
                    );
                } catch (_) {}
            }
            return;
        }
        const d = event.data;
        if (!d || typeof d !== "object") return;

        // 1. Response to one of OUR requests (ui/initialize, tools/call, ...).
        //    The absence of `method` plus the presence of result/error is what
        //    makes this a response. Matching on the id alone would swallow a
        //    host→app REQUEST that reuses one of our ids and resolve the pending
        //    promise with undefined — and the spec's own ui/resource-teardown
        //    example uses id 1, the id ui/initialize would otherwise hold.
        if (
            d.id != null &&
            d.method === undefined &&
            ("result" in d || "error" in d)
        ) {
            const entry = pending.get(d.id);
            // A duplicate, or a late answer after our timeout already fired, has
            // no pending entry. Swallow it rather than letting it fall through to
            // the payload branch and repaint the widget.
            if (!entry) return;
            pending.delete(d.id);
            clearTimeout(entry.timer);
            if (d.error) {
                entry.reject(
                    new Error(
                        (d.error && d.error.message) ||
                            "host returned an error",
                    ),
                );
            } else {
                entry.resolve(d.result);
            }
            return;
        }

        // 2. Host notifications AND host→app requests — both carry `method`.
        if (typeof d.method === "string") {
            const p = d.params || {};
            const t = themeFrom(p);
            if (t) applyTheme(t);
            if (d.method.endsWith("tool-result")) {
                show(p.structuredContent || p);
            }
            // A host REQUEST (it has an id) needs an answer: for
            // ui/resource-teardown the host SHOULD wait for one before tearing
            // the resource down, so silence risks losing the view.
            if (d.id != null) {
                post({ jsonrpc: "2.0", id: d.id, result: {} });
            }
            return;
        }

        // 3. Lenient fallback: a host/tool that posts the payload bare. Kept for
        //    host compatibility, but it must never swallow JSON-RPC traffic —
        //    an unmatched response (a late answer after our timeout, say) is not
        //    widget data.
        //    Deliberately narrower than "has an id": a tool's own payload may
        //    legitimately carry a top-level `id`, and discarding those would be a
        //    latent trap. Only a JSON-RPC envelope is rejected.
        if ("jsonrpc" in d || ("id" in d && ("result" in d || "error" in d))) {
            return;
        }
        const t = themeFrom(d);
        if (t) applyTheme(t);
        show(d.structuredContent || d);
    });

    if (host) {
        // Brief loading state until the host delivers the tool result.
        root().innerHTML = config.loading;

        // Announce the app so the host starts delivering tool data.
        // Field names MUST match the McpUiInitializeRequest schema exactly
        // (appInfo / appCapabilities — NOT the MCP-core clientInfo /
        // capabilities); strict hosts validate this request and silently
        // drop it if the shape is wrong, leaving the iframe on "Loading…".
        request(
            "ui/initialize",
            {
                protocolVersion: "2026-01-26",
                appInfo: {
                    name: config.name,
                    version: config.version || "1.0.0",
                },
                appCapabilities: {},
            },
            15000,
        )
            .then((result) => {
                // FIRST: strict hosts withhold the tool result until they get
                // this, so it must not sit behind any code that could throw.
                notify("ui/notifications/initialized");
                // Then the first size report, explicitly: the observer's own
                // first tick fired at boot, while reporting was still held.
                startSizing();

                const r = result || {};
                hostContext = r.hostContext || {};
                hostCapabilities = r.hostCapabilities || r.capabilities || {};
                hostInfo = r.hostInfo || r.serverInfo || {};
                api.hostContext = hostContext;
                api.hostCapabilities = hostCapabilities;
                api.hostInfo = hostInfo;
                api.canCallTools = !!hostCapabilities.serverTools;

                // themeFrom already probes obj.hostContext?.theme.
                const t = themeFrom(r);
                if (t) applyTheme(t);

                if (typeof config.onReady === "function") {
                    try {
                        config.onReady(api);
                    } catch (_) {}
                }
            })
            .catch((e) => {
                // A host that never answers ui/initialize will also never send a
                // tool result, so the widget would sit on "Loading…" forever with
                // nothing in the console. Say so, in the console and on screen —
                // this exact silence has cost debugging time before.
                try {
                    console.warn("[widget] ui/initialize failed:", e.message);
                } catch (_) {}
                const el = root();
                if (el && !painted) {
                    // T is whatever shared/i18n.js resolved — which on this
                    // path is still its WIDGET_STRINGS.en default, since a
                    // handshake that never completed means no template ever
                    // reached setLocale().
                    el.innerHTML =
                        '<div class="empty"><div class="big">⚠</div><div>' +
                        T.chrome.noHost +
                        "</div></div>";
                }
                // Report the size anyway, so that card is not clipped too.
                startSizing();
            });

        // ChatGPT Apps SDK compatibility: data/theme may be exposed on a
        // global and refreshed via a custom event instead of postMessage.
        try {
            if (window.openai) {
                if (window.openai.theme) applyTheme(window.openai.theme);
                if (window.openai.toolOutput) show(window.openai.toolOutput);
            }
            window.addEventListener("openai:set_globals", (e) => {
                const g = e.detail?.globals || e.detail || {};
                const t = themeFrom(g);
                if (t) applyTheme(t);
                if (g.toolOutput) show(g.toolOutput);
            });
        } catch (_) {}
    } else {
        // Opened directly in a browser (no host) — render the sample so the
        // file is previewable on its own.
        paint(window.__WIDGET_DATA__ || config.sample);
        if (typeof config.onReady === "function") {
            try {
                config.onReady(api);
            } catch (_) {}
        }
    }
}

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
    // Render, then append a small persistent note at the bottom explaining that
    // widget display is a user setting. render() replaces #root wholesale, so
    // the footer is re-appended after every paint. Skipped when a widget
    // deliberately renders nothing (e.g. meal-logged with no goals) so an empty
    // widget stays empty and the host collapses it.
    function paint(data) {
        config.render(data);
        const el = root();
        if (!el || el.innerHTML.trim() === "") return;
        const foot = document.createElement("div");
        foot.textContent =
            "You can enable or disable these widgets anytime — just ask to update your settings.";
        foot.style.cssText =
            "margin-top:14px;padding-top:10px;" +
            "border-top:1px solid var(--panel-border);" +
            "font-size:11px;line-height:1.4;color:var(--text-dim);text-align:center;";
        el.appendChild(foot);
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
    let initId = 0;
    function post(msg) {
        try {
            if (host) host.postMessage(msg, "*");
        } catch (_) {}
    }

    // Report our content height so the host sizes the iframe to fit
    // (MCP Apps ui/notifications/size-changed). Without this the host
    // uses a default height and clips the widget. Measure the
    // document's natural (max-content) height, then restore.
    function sendSize() {
        if (!host) return;
        const el = document.documentElement;
        const prev = el.style.height;
        el.style.height = "max-content";
        const height = Math.ceil(el.getBoundingClientRect().height);
        el.style.height = prev;
        post({
            jsonrpc: "2.0",
            method: "ui/notifications/size-changed",
            params: { width: Math.ceil(window.innerWidth), height },
        });
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

    window.addEventListener("message", (event) => {
        const d = event.data;
        if (!d || typeof d !== "object") return;

        // JSON-RPC response to our ui/initialize: carries host context
        // (theme, container info, capabilities). Per the MCP Apps
        // handshake we MUST answer with ui/notifications/initialized —
        // strict hosts (e.g. MCP Inspector) withhold the tool result
        // until they receive it.
        if (d.id != null && d.id === initId && d.result) {
            const t = themeFrom(d.result) || themeFrom(d.result.hostContext);
            if (t) applyTheme(t);
            post({
                jsonrpc: "2.0",
                method: "ui/notifications/initialized",
            });
            return;
        }

        // Host notifications (tool-input, tool-result, ...).
        if (typeof d.method === "string") {
            const p = d.params || {};
            const t = themeFrom(d) || themeFrom(p);
            if (t) applyTheme(t);
            if (d.method.endsWith("tool-result")) {
                show(p.structuredContent || p);
            }
            return;
        }

        // Lenient fallback: a host/tool that posts the payload bare.
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
        initId = 1;
        post({
            jsonrpc: "2.0",
            id: initId,
            method: "ui/initialize",
            params: {
                protocolVersion: "2026-01-26",
                appInfo: {
                    name: config.name,
                    version: config.version || "1.0.0",
                },
                appCapabilities: {},
            },
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
    }
}

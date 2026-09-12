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
//
// Two helpers sit at TOP LEVEL, outside initWidget, because templates call them
// from their own repaint paths (a range toggle, an import step) that never go
// through paint(). Both are function declarations, so they are hoisted across
// the one inline script element this file is spliced into — include order does
// not matter. (Never write that element's tag literally in a comment here:
// import-run.test.ts finds the widget's script by its last opening tag.) Both also tolerate a `document` that has nothing but getElementById:
// import-run.test.ts stubs exactly that and drives runImport(), which renders
// several times.
//
//   tryRender(fn) => boolean
//   keepFocus(root, write, opts?) => boolean

// Run a render; true if it finished, false (after logging) if it threw.
//
// NO DOM side effect, on purpose: what a failed render should leave behind is
// the caller's decision, and the callers disagree. paint() empties the root
// (see there), a range toggle keeps the body it already had and reverts the
// range, and the import flow shows its own error notice and stops sending
// chunks. A helper that blanked the root itself would make all three choices
// for them — and would need a root to blank, which the test stub above lacks.
function tryRender(fn) {
    try {
        fn();
        return true;
    } catch (e) {
        try {
            console.error("[widget] render failed:", e);
        } catch (_) {}
        return false;
    }
}

// How a control is found again once write() has replaced it, in priority
// order: an id (import-meals' buttons and inputs), a data-focus-key a template
// sets on purpose, the trends / weight-trends seg buttons' data-range, and
// import-meals' mapping selects' data-field. Strip tiles ([data-macro]) are
// NOT here: macroSnapshot/macroRestore (macros.js) own them, because re-finding
// the node is only half of it — the drawer, the pressed series and the opener
// have to come back too.
const FOCUS_KEYS = ["id", "data-focus-key", "data-range", "data-field"];

// Rewrite part of a widget without dropping the keyboard user.
//
// A template that repaints by innerHTML destroys whatever control was focused,
// and focus falls to <body>: the next Tab starts from the top of the document,
// which inside a chat card is a user dumped out of the thing they were
// operating. So: note, before write(), whether focus was ours and which keyed
// control held it; after write(), focus the control carrying the same key.
//
// "Ours" means focus was inside root, or opts.owned is set AND this document
// still has focus. owned is for a flow that knows focus is its own even though
// it is on <body> right now — the import button re-renders disabled the moment
// it is pressed, which is exactly what drops focus — and hasFocus() is what
// keeps that flag from reaching into the host: if the user has since moved to
// the host's composer, this iframe's document no longer has focus and nothing
// is taken. When focus was not ours, keepFocus does nothing at all — a re-render
// the user did not ask for must never pull focus out of the host.
//
// focus() on a disabled, hidden or inert element is a silent no-op, so success
// is read back from activeElement rather than assumed. When it did not land and
// opts.stepChanged is set, focus goes to the new view's [data-focus-fallback]
// (a heading with tabindex="-1") instead. Only on a step change: a progress
// repaint that re-focused the heading would have a screen reader re-announce it
// on every chunk.
//
// opts = { owned?: boolean, stepChanged?: boolean }. Returns false only when
// there was no root — then write() is SKIPPED, exactly as the `if (!el) return`
// every render() used to open with, since write() has nothing to write into.
function keepFocus(root, write, opts) {
    const o = opts || {};
    const doc = typeof document !== "undefined" ? document : null;
    const el =
        root ||
        (doc && typeof doc.getElementById === "function"
            ? doc.getElementById("root")
            : null);
    if (!el) return false;
    const before = doc.activeElement || null;
    const inside = !!before && el.contains(before);
    let key = null;
    if (inside && typeof before.getAttribute === "function") {
        for (const attr of FOCUS_KEYS) {
            const v = before.getAttribute(attr);
            if (v) {
                key = [attr, v];
                break;
            }
        }
    }
    write();
    const hasFocus =
        typeof doc.hasFocus === "function" ? doc.hasFocus() : false;
    if (!inside && !(o.owned && hasFocus)) return true;

    let target = null;
    if (key) {
        // The same node when write() left it standing (a meta-only update),
        // otherwise its replacement. Attribute selector rather than `#id` so
        // one path serves every key; CSS.escape where the platform has it.
        const v =
            typeof CSS !== "undefined" && CSS.escape
                ? CSS.escape(key[1])
                : String(key[1]).replace(/["\\]/g, "\\$&");
        target =
            before.isConnected && el.contains(before)
                ? before
                : el.querySelector("[" + key[0] + '="' + v + '"]');
    }
    if (target && doc.activeElement !== target) {
        try {
            target.focus({ preventScroll: true });
        } catch (_) {}
    }
    if (target && doc.activeElement === target) return true;
    if (o.stepChanged) {
        const fallback = el.querySelector("[data-focus-fallback]");
        if (fallback) {
            try {
                fallback.focus({ preventScroll: true });
            } catch (_) {}
        }
    }
    return true;
}

// Floor a one-line box at the tallest text it will ever hold.
//
// A RANGE TOGGLE MAY NOT CHANGE THE CARD'S HEIGHT (STYLE_GUIDE §8). The window
// line in trends' and weight-trends' headers is the one piece of header state a
// range owns, and its tallest candidate is not the one on screen: "22 Okt. –
// 20. Nov. 2025 · 30 Wiegungen" takes a second row where the 7-day label takes
// one, so a toggle grew the card by a 14px line and the host resized the iframe
// — on a tap that changed no data. Measured at 280-320px in de/nl/uk/ja on
// weight-trends, and in plain English at 280px (and uk at 320px) on trends.
//
// EVERY candidate is measured rather than the longest-looking one: which string
// wraps depends on the locale, on whether the window crosses a year, and on the
// font the host renders in. `min-height`, not `height`, so a candidate that is
// taller still than all of them on some future host is shown whole rather than
// clipped. One pass per render and nothing animated, so the ResizeObserver
// still sees a single settled size.
// Measured with getBoundingClientRect, not offsetHeight: offsetHeight rounds
// to whole pixels, and a floor rounded DOWN is not a floor. A two-line meta at
// a 14.7px line-height is 29.391px tall and reserves 29px, so the card still
// moves 0.391px on a toggle — the very thing this reserves against, just small
// enough to read as a rendering artefact rather than a bug.
function reserveLine(el, texts) {
    if (!el || !texts || !texts.length) return;
    const current = el.textContent;
    el.style.minHeight = "";
    let tallest = el.getBoundingClientRect().height;
    for (const text of texts) {
        el.textContent = text;
        const h = el.getBoundingClientRect().height;
        if (h > tallest) tallest = h;
    }
    el.textContent = current;
    el.style.minHeight = tallest + "px";
}

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
        // Written only when it DIFFERS: the observer below watches the whole
        // subtree, so an unconditional write would be a mutation it reports to
        // itself, and syncFooter → footNote → write → syncFooter never ends.
        const text = T.chrome.widgetsNote;
        if (footEl.textContent !== text) footEl.textContent = text;
        return footEl;
    }
    // Where the note goes: a widget's own foot if it declared one, otherwise
    // the root. The LAST slot, not the first, so a page carrying several strips
    // never buries the note in the first of them. The dev gallery goes one
    // further and strips data-widget-foot from every strip it renders, its live
    // card included, so the note falls back to the root and sits at the very
    // end of the page, under the last specimen.
    function footSlot() {
        const el = root();
        if (!el) return null;
        const slots = el.querySelectorAll("[data-widget-foot]");
        return slots.length ? slots[slots.length - 1] : el;
    }

    // Keep the note as the last child of its slot for as long as the root has
    // content. paint() is NOT the only thing that writes here: widgets repaint
    // from their own controls without going through it. Some rewrite #root
    // wholesale, some only a body inside it (trends rewrites #tr-body on a
    // range change), and either can take the note, or the foot holding it,
    // down with the old DOM, or swap a body with a foot for one without (a
    // range-empty body) and back. Re-appending after config.render() alone
    // lost the note on the first interaction, which is exactly the bug this
    // exists to prevent, so the rule is enforced from the root down and needs
    // no cooperation from any template.
    function syncFooter() {
        const el = root();
        if (!el) return;
        // Genuinely empty must stay genuinely empty: meal-logged writes "" when
        // there are no goals, and `.wrap` has no padding of its own (base.css),
        // so an empty root measures 0 and the host collapses the iframe to
        // nothing. A note here would give it height and leave a stripe of
        // chrome behind.
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
        // root instead: an empty, paddingless `.wrap` measures 0 and the host
        // collapses the iframe to nothing (the state meal-logged uses on
        // purpose), and the tool's text content still
        // reaches the reader. No message of our own, because a half-rendered or
        // "something went wrong" card is not better than no card. That emptying
        // is paint()'s own choice, which is why tryRender leaves the DOM alone.
        if (!tryRender(() => config.render(data))) {
            const el = root();
            if (el) el.innerHTML = "";
            return;
        }
        painted = true;
        // A new payload is a new card, and it gets its own corrective measure:
        // this one may be shorter than the last, and the shrink is what reports
        // that honestly (sendSize).
        corrected = false;
        correctedFrom = -1;
        // Watch from the FIRST real paint only, so the note never decorates the
        // loading state or the no-host card — both of which write to the root
        // directly and neither of which is a widget.
        if (!footObserver && typeof MutationObserver !== "undefined") {
            const el = root();
            if (el) {
                footObserver = new MutationObserver(syncFooter);
                // The whole subtree, not the root's own children. Watching the
                // root alone missed every rewrite one level down: trends
                // replaces only #tr-body on a range change, the strip's foot
                // (and the note in it) went with the old body, and the root's
                // childList never changed, so the note was gone until the next
                // tool result. The price is that a widget's own churn (a drawer
                // opening, a chart restroking) now reaches syncFooter too; it
                // costs one querySelectorAll and ends at the lastChild check.
                // Attributes and text are not watched: neither can move a node.
                footObserver.observe(el, { childList: true, subtree: true });
            }
        }
        // Self-limiting, deliberately. Appending the note is itself a mutation
        // the observer reports, so it runs once more; on that pass the note IS
        // its slot's last child and footNote() finds its text already current,
        // so nothing is written and the loop ends there. Both guards are
        // load-bearing: drop either and this observer feeds itself forever.
        syncFooter();
        // The report for this render, explicitly rather than through the
        // observer: a render that leaves the root empty (meal-logged with no
        // goals) changes no box, so no tick would follow — and that state's
        // whole contract is `height=0`, which is also the first report the
        // handshake deliberately skipped (see startSizing). Deduped on the last
        // size sent, so where the observer does fire this costs nothing.
        sendSize();
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
    // Whether this card has already spent its one corrective shrink, and the
    // forced measure it corrected away — see the second measure in sendSize.
    let corrected = false;
    let correctedFrom = -1;
    function sendSize() {
        if (!host || !sizeLive) return;
        // THE FIRST REPORT MUST DESCRIBE SOMETHING THE USER WILL SEE. Before
        // the first paint an empty root is a widget still waiting for its
        // payload, not a zero-height card: meal-logged is the one template
        // whose `loading` is "" (it may legitimately end up empty, so it starts
        // blank), and it was the one widget that opened with `size-changed
        // height=0` — the host collapsing the iframe from its 130px default to
        // nothing and back to 445, on the card shown after every log_meal.
        //
        // The test is here rather than on the handshake's own first call
        // because the observer's boot tick can arrive first and report the same
        // 0. After a paint it never applies: `painted` is set before paint()
        // reports, so meal-logged's documented no-goals `height=0` — a render
        // like any other — still goes out.
        if (!painted) {
            const el = root();
            if (!el || !el.childNodes.length) return;
        }
        const el = document.documentElement;
        // The frame the host is showing right now, read BEFORE the measure
        // below replaces this element's own height with its content's.
        const frame = el.clientHeight;
        const prevHeight = el.style.height;
        const prevOverflow = el.style.overflow;
        el.style.height = "max-content";
        // Measured with the viewport's scrollbar FORCED, so the measure and the
        // layout the host will display agree on width.
        //
        // The host starts the frame short (a strict host, and the harness, at
        // 130px), so the first measure runs while the document overflows it and
        // a classic scrollbar is taking its width out of the layout. Whatever
        // this rule does, it has to do the same thing before and after the host
        // grows the frame, or one paint costs two reports (goal-progress' empty
        // card 205 → 191 at 420px).
        //
        // Suppressing the scrollbar (`overflow: hidden`) achieved that and
        // introduced a worse failure: it measured a layout that only exists
        // once the content already fits. Where a card sits near a wrap
        // threshold the two widths disagree — at 360px nutrition-summary's
        // header takes one row at 360 and two at 345 — so the frame was set to
        // the scrollbar-free height, the scrollbar stayed, the content re-wrapped
        // taller than the frame, and every later measure returned the same
        // suppressed value and was deduped away. A permanently clipped card with
        // no corrective report: 19px cut off nutrition-summary at 360, 25px off
        // trends at 280 in pl (the settings note cut mid-sentence), 15px off
        // import-meals at 320.
        //
        // Forcing it instead is stable in the same way and errs the safe way:
        // every measure describes the narrower, scrollbar-taken layout, so the
        // first paint is still one report, and once the host grows the frame the
        // content can only get SHORTER than what was reported — slack, never a
        // clip. `hidden scroll`: only the vertical bar is forced, or a horizontal
        // one would be measured in too. It costs nothing where scrollbars are
        // overlays (macOS by default), which is exactly where this bug is
        // invisible. Restored in the same task, so nothing is ever painted with a
        // scrollbar it does not need.
        el.style.overflow = "hidden scroll";
        let height = Math.ceil(el.getBoundingClientRect().height);
        // ONE CORRECTIVE SHRINK, after the host has actually grown the frame.
        // Slack is the right error on the way UP (see above), but it is only
        // ever meant to be a few pixels, and on a platform whose scrollbars take
        // layout width the forced measure runs ~15px narrower than the frame the
        // host ends up showing — enough for a short card's one sentence to wrap
        // a line further than it really does. The dedupe below then kept that
        // stale taller value with nothing to correct it: 34px of bare --bg under
        // trends' German range-empty card, 13% of the card's own height, which
        // reads as a rendering fault rather than as slack.
        //
        // `frame >= lastH` is the test for "the host has caught up": the content
        // is no longer overflowing, so no scrollbar is being taken and the
        // page's own overflow is the honest measure. The corrected height is the
        // content's height at the scrollbar-free width, so a frame set to it
        // does not overflow either — the state is a fixed point, not the start
        // of a ping-pong. Once per paint all the same: a card sitting exactly on
        // the threshold could otherwise re-take a scrollbar and trade the dead
        // ground for a flicker.
        //
        // A CORRECTION IS STICKY WHILE THE CONTENT IS UNCHANGED. Shrinking the
        // frame resizes the body, which is itself an observer tick, and that
        // tick's forced measure reads the tall value again — so without this the
        // host's own resize sent it straight back and undid the shrink one frame
        // later (trends' whole-empty German card measured 245 -> 226 -> 245).
        // The forced measure is the stable identity of "this content at this
        // width": while it still reads what was corrected away there is nothing
        // new to report, and a real content change moves it off that value and
        // is reported as usual.
        if (corrected && height === correctedFrom) {
            el.style.overflow = prevOverflow;
            el.style.height = prevHeight;
            return;
        }
        if (!corrected && lastH >= 0 && frame >= lastH) {
            el.style.overflow = prevOverflow;
            const natural = Math.ceil(el.getBoundingClientRect().height);
            if (natural < height) {
                correctedFrom = height;
                height = natural;
                corrected = true;
            }
        }
        el.style.overflow = prevOverflow;
        el.style.height = prevHeight;
        const width = Math.ceil(window.innerWidth);
        if (width === lastW && height === lastH) return;
        lastW = width;
        lastH = height;
        notify("ui/notifications/size-changed", { width, height });
    }
    // Reporting is held until the handshake settles, and released here. What
    // that first report may say is sendSize's own rule (see there): before any
    // paint, an empty root reports nothing at all.
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

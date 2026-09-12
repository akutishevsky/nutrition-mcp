// Behaviour tests for the two top-level helpers in shared/bridge.js that
// templates call from their own repaint paths: tryRender and keepFocus.
//
// Same technique as macros.test.ts: the real partial is evaluated as one
// script, here with `document` and `CSS` passed in as parameters so each test
// hands it its own fake. No DOM library: the fake below implements exactly the
// surface keepFocus touches (activeElement, hasFocus, contains, getAttribute,
// isConnected, focus, and querySelector for one `[attr="value"]` selector), so
// a new DOM call in the helper fails here loudly instead of passing by luck.
import { test, expect, spyOn } from "bun:test";

const SRC = await Bun.file("./public/widgets/src/shared/bridge.js").text();

type Helpers = {
    tryRender: (fn: () => void) => boolean;
    keepFocus: (
        root: FakeEl | null,
        write: () => void,
        opts?: { owned?: boolean; stepChanged?: boolean },
    ) => boolean;
};
function load(document: unknown): Helpers {
    return new Function(
        "document",
        "CSS",
        `${SRC}\nreturn { tryRender, keepFocus };`,
    )(document, undefined) as Helpers;
}

class FakeDoc {
    activeElement: FakeEl | null = null;
    focused = true;
    body = new FakeEl(this, {});
    constructor() {
        this.activeElement = this.body;
    }
    hasFocus() {
        return this.focused;
    }
    getElementById(): null {
        return null;
    }
}

class FakeEl {
    children: FakeEl[] = [];
    parent: FakeEl | null = null;
    disabled = false;
    focusCalls = 0;
    constructor(
        public doc: FakeDoc,
        public attrs: Record<string, string>,
    ) {}
    getAttribute(name: string) {
        return name in this.attrs ? this.attrs[name]! : null;
    }
    append(...els: FakeEl[]) {
        for (const el of els) {
            el.parent = this;
            this.children.push(el);
        }
        return this;
    }
    // innerHTML = … in miniature: the old nodes leave the tree for good.
    replaceChildren(...els: FakeEl[]) {
        for (const c of this.children) c.parent = null;
        this.children = [];
        if (this.doc.activeElement && !this.doc.activeElement.isConnected) {
            this.doc.activeElement = this.doc.body;
        }
        return this.append(...els);
    }
    get isConnected(): boolean {
        let n: FakeEl | null = this;
        while (n.parent) n = n.parent;
        return n === this.doc.body;
    }
    contains(other: FakeEl): boolean {
        for (let n: FakeEl | null = other; n; n = n.parent) {
            if (n === this) return true;
        }
        return false;
    }
    // A disabled control ignores focus(), as a browser's does.
    focus() {
        this.focusCalls++;
        if (!this.disabled) this.doc.activeElement = this;
    }
    querySelector(sel: string): FakeEl | null {
        const m = /^\[([\w-]+)(?:="((?:[^"\\]|\\.)*)")?\]$/.exec(sel);
        if (!m) throw new Error("fake DOM: unsupported selector " + sel);
        const [, attr, raw] = m;
        const want = raw === undefined ? null : raw.replace(/\\(.)/g, "$1");
        const walk = (el: FakeEl): FakeEl | null => {
            for (const c of el.children) {
                const v = c.getAttribute(attr!);
                if (v !== null && (want === null || v === want)) return c;
                const hit = walk(c);
                if (hit) return hit;
            }
            return null;
        };
        return walk(this);
    }
}

function setup() {
    const doc = new FakeDoc();
    const root = new FakeEl(doc, { id: "root" });
    doc.body.append(root);
    const el = (attrs: Record<string, string>) => new FakeEl(doc, attrs);
    return { doc, root, el, h: load(doc) };
}

test("tryRender reports success and failure and never touches the DOM", () => {
    // A document that throws on ANY access: tryRender must not reach for it.
    const h = load(
        new Proxy(
            {},
            {
                get() {
                    throw new Error("tryRender touched document");
                },
            },
        ),
    );
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
        let ran = false;
        expect(h.tryRender(() => (ran = true))).toBe(true);
        expect(ran).toBe(true);
        expect(
            h.tryRender(() => {
                throw new Error("boom");
            }),
        ).toBe(false);
        expect(err).toHaveBeenCalledTimes(1);
        expect(err.mock.calls[0]![0]).toBe("[widget] render failed:");
    } finally {
        err.mockRestore();
    }
});

test("keepFocus skips the write when there is no root (import-run.test's stub)", () => {
    // Exactly the document import-run.test.ts installs.
    const h = load({ getElementById: () => null });
    let wrote = false;
    expect(h.keepFocus(null, () => (wrote = true))).toBe(false);
    expect(wrote).toBe(false);
    // And with no document at all.
    expect(load(undefined).keepFocus(null, () => (wrote = true))).toBe(false);
    expect(wrote).toBe(false);
});

test("keepFocus re-focuses the replacement carrying the same key", () => {
    const { doc, root, el, h } = setup();
    const old7 = el({ "data-range": "7" });
    root.append(old7, el({ "data-range": "30" }));
    old7.focus();
    const new7 = el({ "data-range": "7" });
    h.keepFocus(root, () =>
        root.replaceChildren(el({ "data-range": "30" }), new7),
    );
    expect(doc.activeElement).toBe(new7);
});

test("keepFocus keys on id before data-focus-key, data-range and data-field", () => {
    const { doc, root, el, h } = setup();
    const btn = el({ id: "doImport", "data-range": "7" });
    root.append(btn);
    btn.focus();
    // A decoy sharing the lower-priority key comes FIRST in the new tree.
    const decoy = el({ "data-range": "7" });
    const next = el({ id: "doImport" });
    h.keepFocus(root, () => root.replaceChildren(decoy, next));
    expect(doc.activeElement).toBe(next);
});

test("keepFocus finds a key that needs escaping", () => {
    const { doc, root, el, h } = setup();
    const a = el({ "data-focus-key": 'say "hi"\\now' });
    root.append(a);
    a.focus();
    const b = el({ "data-focus-key": 'say "hi"\\now' });
    h.keepFocus(root, () => root.replaceChildren(b));
    expect(doc.activeElement).toBe(b);
});

test("keepFocus leaves a surviving focused control alone", () => {
    const { doc, root, el, h } = setup();
    const seg = el({ "data-range": "14" });
    root.append(seg, el({ id: "meta" }));
    seg.focus();
    const calls = seg.focusCalls;
    // A meta-only update: the seg button is never replaced.
    h.keepFocus(root, () => {});
    expect(doc.activeElement).toBe(seg);
    expect(seg.focusCalls).toBe(calls);
});

test("keepFocus never takes focus that was outside the root", () => {
    const { doc, root, el, h } = setup();
    const outside = el({ id: "composer" });
    doc.body.append(outside);
    outside.focus();
    const heading = el({ "data-focus-fallback": "" });
    h.keepFocus(
        root,
        () => root.replaceChildren(el({ id: "composer" }), heading),
        { stepChanged: true },
    );
    expect(doc.activeElement).toBe(outside);
    expect(heading.focusCalls).toBe(0);
});

test("a target re-rendered disabled falls back only on a step change", () => {
    const { doc, root, el, h } = setup();
    const btn = el({ id: "doImport" });
    root.append(btn);
    btn.focus();
    // Same step: the disabled Import button refuses focus and nothing else is
    // tried, so a progress repaint never re-announces the heading.
    const busy = el({ id: "doImport" });
    busy.disabled = true;
    const heading = el({ "data-focus-fallback": "" });
    h.keepFocus(root, () => root.replaceChildren(heading, busy));
    expect(busy.focusCalls).toBe(1);
    expect(doc.activeElement).toBe(doc.body);
    expect(heading.focusCalls).toBe(0);

    // Step change: the new view's heading takes it.
    const { doc: d2, root: r2, el: el2, h: h2 } = setup();
    const b2 = el2({ id: "doImport" });
    r2.append(b2);
    b2.focus();
    const busy2 = el2({ id: "doImport" });
    busy2.disabled = true;
    const heading2 = el2({ "data-focus-fallback": "" });
    h2.keepFocus(r2, () => r2.replaceChildren(heading2, busy2), {
        stepChanged: true,
    });
    expect(d2.activeElement).toBe(heading2);
});

test("owned focus reaches the fallback only while the document has focus", () => {
    // Focus already fell to <body> during the busy repaints; the flow still
    // owns it, so the done step's heading receives it…
    const { doc, root, el, h } = setup();
    const heading = el({ "data-focus-fallback": "" });
    h.keepFocus(root, () => root.replaceChildren(heading), {
        owned: true,
        stepChanged: true,
    });
    expect(doc.activeElement).toBe(heading);

    // …unless the user has since moved into the host (this iframe's document
    // no longer has focus): then the flag reaches nothing.
    const s = setup();
    s.doc.focused = false;
    const heading2 = s.el({ "data-focus-fallback": "" });
    s.h.keepFocus(s.root, () => s.root.replaceChildren(heading2), {
        owned: true,
        stepChanged: true,
    });
    expect(heading2.focusCalls).toBe(0);
    expect(s.doc.activeElement).toBe(s.doc.body);
});

test("keepFocus lets a throwing write reach tryRender", () => {
    const { root, h } = setup();
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
        expect(
            h.tryRender(() =>
                h.keepFocus(root, () => {
                    throw new Error("boom");
                }),
            ),
        ).toBe(false);
    } finally {
        err.mockRestore();
    }
});

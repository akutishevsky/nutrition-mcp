/**
 * A small DOM for the build-time widget runs (scripts/widget-static.ts).
 *
 * A widget's render() and its click handlers only touch `#root`: they assign
 * `innerHTML`, query descendants by a handful of selectors, toggle classes and
 * attributes, and listen for clicks. This file implements exactly that surface
 * over the widget's own markup, so a landing card's "Show more" can be driven
 * through the widget's real delegated handler instead of a hand-written copy
 * of its expanded state. It is not a browser: no layout, no styles, no
 * scripts, and selectors cover only what the widgets use (tag, #id, .class,
 * [attr] / [attr="value"], the descendant and child combinators). Attribute
 * and text values are kept as they appear in the source (already escaped), so
 * a serialized tree reads back the same markup the widget wrote.
 *
 * Build-time only: nothing here is shipped to the page.
 */

const VOID = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
]);

const RAW_TEXT = new Set(["script", "style"]);

const ENTITY: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&nbsp;": " ",
};

const decode = (s: string) =>
    s.replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (m) => ENTITY[m] ?? m);

/** Text as HTML: the characters a text node must escape. */
export function escapeText(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;");

export class DomText {
    parent: DomElement | null = null;
    /** The text as serialized (escaped), comments included verbatim. */
    constructor(public raw: string) {}
    serialize(): string {
        return this.raw;
    }
    get textContent(): string {
        return decode(this.raw);
    }
}

type Listener = (e: DomEvent) => void;

export interface DomEvent {
    type: string;
    target: DomElement;
    preventDefault(): void;
    stopPropagation(): void;
}

interface Compound {
    tag: string | null;
    id: string | null;
    classes: string[];
    attrs: { name: string; value: string | null }[];
}

interface SelectorPart {
    comb: " " | ">" | null;
    c: Compound;
}

const selectorCache = new Map<string, SelectorPart[][]>();

/** `a b, c > d` as groups of parts; each group matches independently. */
function parseSelector(sel: string): SelectorPart[][] {
    const hit = selectorCache.get(sel);
    if (hit) return hit;
    const groups = sel.split(",").map((g) => parseGroup(g.trim()));
    selectorCache.set(sel, groups);
    return groups;
}

function parseGroup(s: string): SelectorPart[] {
    const parts: SelectorPart[] = [];
    let i = 0;
    let comb: " " | ">" | null = null;
    const ws = /\s*/y;
    while (i < s.length) {
        const before = i;
        ws.lastIndex = i;
        ws.exec(s);
        i = ws.lastIndex;
        if (s[i] === ">") {
            comb = ">";
            i++;
            ws.lastIndex = i;
            ws.exec(s);
            i = ws.lastIndex;
        } else if (i > before && parts.length) {
            comb = " ";
        }
        if (i >= s.length) break;
        const c: Compound = { tag: null, id: null, classes: [], attrs: [] };
        let any = false;
        const tag = /\*|[a-zA-Z][\w-]*/y;
        tag.lastIndex = i;
        const t = tag.exec(s);
        if (t) {
            c.tag = t[0] === "*" ? null : t[0].toLowerCase();
            i = tag.lastIndex;
            any = true;
        }
        for (;;) {
            const cls = /\.([\w-]+)/y;
            const id = /#([\w-]+)/y;
            const attr =
                /\[\s*([\w:-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]/y;
            cls.lastIndex = i;
            id.lastIndex = i;
            attr.lastIndex = i;
            let m: RegExpExecArray | null;
            if ((m = cls.exec(s))) {
                c.classes.push(m[1]!);
                i = cls.lastIndex;
            } else if ((m = id.exec(s))) {
                c.id = m[1]!;
                i = id.lastIndex;
            } else if ((m = attr.exec(s))) {
                const value = m[2] ?? m[3] ?? m[4] ?? null;
                c.attrs.push({ name: m[1]!, value });
                i = attr.lastIndex;
            } else break;
            any = true;
        }
        if (!any) throw new Error(`unsupported selector: ${s}`);
        parts.push({ comb: parts.length ? comb : null, c });
        comb = null;
    }
    return parts;
}

function matchesCompound(el: DomElement, c: Compound): boolean {
    if (c.tag && el.tag !== c.tag) return false;
    if (c.id && el.getAttribute("id") !== c.id) return false;
    const cls = el.classList;
    for (const k of c.classes) if (!cls.contains(k)) return false;
    for (const a of c.attrs) {
        if (!el.hasAttribute(a.name)) return false;
        if (a.value !== null && el.getAttribute(a.name) !== a.value)
            return false;
    }
    return true;
}

function matchAt(el: DomElement, parts: SelectorPart[], idx: number): boolean {
    const p = parts[idx]!;
    if (!matchesCompound(el, p.c)) return false;
    if (idx === 0) return true;
    if (p.comb === ">")
        return !!el.parent && matchAt(el.parent, parts, idx - 1);
    for (let a = el.parent; a; a = a.parent)
        if (matchAt(a, parts, idx - 1)) return true;
    return false;
}

function matchesSelector(el: DomElement, sel: string): boolean {
    return parseSelector(sel).some(
        (parts) => parts.length > 0 && matchAt(el, parts, parts.length - 1),
    );
}

export class DomElement {
    parent: DomElement | null = null;
    children: (DomElement | DomText)[] = [];
    private attrs = new Map<string, string>();
    private listeners = new Map<string, Listener[]>();

    /** Inline style writes (the widgets' animation offsets). Not serialized:
     * the markup's own style attributes are the card's styling. */
    style: Record<string, unknown> & {
        setProperty(k: string, v: string): void;
    } = {
        setProperty() {},
    };

    constructor(public tag: string) {}

    // ---- attributes

    getAttribute(name: string): string | null {
        const v = this.attrs.get(name);
        return v === undefined ? null : decode(v);
    }
    hasAttribute(name: string): boolean {
        return this.attrs.has(name);
    }
    setAttribute(name: string, value: string | number | boolean): void {
        this.attrs.set(name, escapeAttr(String(value)));
    }
    removeAttribute(name: string): void {
        this.attrs.delete(name);
    }
    /** Set an attribute as written in the source (already escaped). */
    setRawAttribute(name: string, raw: string): void {
        this.attrs.set(name, raw);
    }
    toggleAttribute(name: string, force?: boolean): boolean {
        const on = force ?? !this.attrs.has(name);
        if (on) this.attrs.set(name, "");
        else this.attrs.delete(name);
        return on;
    }

    private classNames(): string[] {
        return (this.attrs.get("class") ?? "").split(/\s+/).filter(Boolean);
    }
    private setClassNames(list: string[]): void {
        if (list.length || this.attrs.has("class"))
            this.attrs.set("class", list.join(" "));
    }

    get classList() {
        const el = this;
        return {
            contains: (c: string) => el.classNames().includes(c),
            add: (...cs: string[]) => {
                const l = el.classNames();
                for (const c of cs) if (!l.includes(c)) l.push(c);
                el.setClassNames(l);
            },
            remove: (...cs: string[]) =>
                el.setClassNames(
                    el.classNames().filter((c) => !cs.includes(c)),
                ),
            toggle: (c: string, force?: boolean): boolean => {
                const l = el.classNames();
                const has = l.includes(c);
                const on = force ?? !has;
                if (on && !has) l.push(c);
                if (!on && has) l.splice(l.indexOf(c), 1);
                if (on !== has) el.setClassNames(l);
                return on;
            },
        };
    }

    get className(): string {
        return decode(this.attrs.get("class") ?? "");
    }
    set className(value: string) {
        this.attrs.set("class", escapeAttr(String(value)));
    }
    get id(): string {
        return this.getAttribute("id") ?? "";
    }
    set id(value: string) {
        this.setAttribute("id", value);
    }

    /** `el.dataset.fooBar` reads and writes `data-foo-bar`. */
    get dataset(): Record<string, string | undefined> {
        const el = this;
        const attr = (k: string) =>
            "data-" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
        return new Proxy({} as Record<string, string | undefined>, {
            get: (_t, k) =>
                typeof k === "string"
                    ? (el.getAttribute(attr(k)) ?? undefined)
                    : undefined,
            set: (_t, k, v) => {
                if (typeof k === "string") el.setAttribute(attr(k), v);
                return true;
            },
        });
    }

    get disabled(): boolean {
        return this.attrs.has("disabled");
    }

    // ---- content

    get innerHTML(): string {
        return this.children.map((c) => c.serialize()).join("");
    }
    set innerHTML(html: string) {
        const frag = new DomElement("#fragment");
        parseInto(html, frag);
        this.children = frag.children;
        for (const c of this.children) c.parent = this;
    }
    get textContent(): string {
        return this.children.map((c) => c.textContent).join("");
    }
    set textContent(value: string) {
        const t = new DomText(escapeText(String(value)));
        t.parent = this;
        this.children = [t];
    }

    serialize(): string {
        const attrs = [...this.attrs]
            .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`))
            .join("");
        if (VOID.has(this.tag)) return `<${this.tag}${attrs}>`;
        return `<${this.tag}${attrs}>${this.innerHTML}</${this.tag}>`;
    }

    // ---- queries

    private *descendants(): Generator<DomElement> {
        for (const c of this.children) {
            if (!(c instanceof DomElement)) continue;
            yield c;
            yield* c.descendants();
        }
    }

    querySelector(sel: string): DomElement | null {
        for (const el of this.descendants())
            if (matchesSelector(el, sel)) return el;
        return null;
    }
    querySelectorAll(sel: string): DomElement[] {
        const out: DomElement[] = [];
        for (const el of this.descendants())
            if (matchesSelector(el, sel)) out.push(el);
        return out;
    }
    matches(sel: string): boolean {
        return matchesSelector(this, sel);
    }
    closest(sel: string): DomElement | null {
        for (let el: DomElement | null = this; el; el = el.parent)
            if (matchesSelector(el, sel)) return el;
        return null;
    }
    contains(other: DomElement | null): boolean {
        for (let el = other; el; el = el.parent) if (el === this) return true;
        return false;
    }

    // ---- events and focus (the widgets only need listeners and no-ops)

    addEventListener(type: string, fn: Listener): void {
        const list = this.listeners.get(type) ?? [];
        list.push(fn);
        this.listeners.set(type, list);
    }
    removeEventListener(): void {}
    focus(): void {}

    /** Bubble a click from `this` to the root, as a browser would. */
    dispatch(type: string): void {
        const event: DomEvent = {
            type,
            target: this,
            preventDefault() {},
            stopPropagation() {},
        };
        for (let el: DomElement | null = this; el; el = el.parent)
            for (const fn of el.listeners.get(type) ?? []) fn(event);
    }
}

// ---- parsing

const TAG_OPEN = /<(\/?)([a-zA-Z][\w:-]*)/y;
const ATTR_NAME = /[^\s"'>\/=]+/y;

/** Parse `html` into `container`'s children (appended in order). */
function parseInto(html: string, container: DomElement): void {
    const stack: DomElement[] = [];
    const top = () => stack[stack.length - 1] ?? container;
    const add = (node: DomElement | DomText) => {
        const parent = top();
        node.parent = parent;
        parent.children.push(node);
    };
    let i = 0;
    const n = html.length;
    while (i < n) {
        const lt = html.indexOf("<", i);
        if (lt < 0) {
            add(new DomText(html.slice(i)));
            break;
        }
        if (lt > i) add(new DomText(html.slice(i, lt)));
        if (html.startsWith("<!--", lt)) {
            const end = html.indexOf("-->", lt + 4);
            const stop = end < 0 ? n : end + 3;
            add(new DomText(html.slice(lt, stop)));
            i = stop;
            continue;
        }
        TAG_OPEN.lastIndex = lt;
        const m = TAG_OPEN.exec(html);
        if (!m) {
            add(new DomText("&lt;"));
            i = lt + 1;
            continue;
        }
        const name = m[2]!.toLowerCase();
        let p = TAG_OPEN.lastIndex;
        if (m[1] === "/") {
            const gt = html.indexOf(">", p);
            for (let k = stack.length - 1; k >= 0; k--)
                if (stack[k]!.tag === name) {
                    stack.length = k;
                    break;
                }
            i = gt < 0 ? n : gt + 1;
            continue;
        }
        const el = new DomElement(name);
        let selfClosing = false;
        for (;;) {
            while (p < n && /\s/.test(html[p]!)) p++;
            if (p >= n) break;
            if (html[p] === ">") {
                p++;
                break;
            }
            if (html[p] === "/" && html[p + 1] === ">") {
                selfClosing = true;
                p += 2;
                break;
            }
            ATTR_NAME.lastIndex = p;
            const a = ATTR_NAME.exec(html);
            if (!a) {
                p++;
                continue;
            }
            p = ATTR_NAME.lastIndex;
            let q = p;
            while (q < n && /\s/.test(html[q]!)) q++;
            if (html[q] !== "=") {
                el.setRawAttribute(a[0], "");
                continue;
            }
            q++;
            while (q < n && /\s/.test(html[q]!)) q++;
            const quote = html[q];
            if (quote === '"' || quote === "'") {
                const close = html.indexOf(quote, q + 1);
                const stop = close < 0 ? n : close;
                el.setRawAttribute(a[0], html.slice(q + 1, stop));
                p = close < 0 ? n : close + 1;
            } else {
                const v = /[^\s>]*/y;
                v.lastIndex = q;
                const vm = v.exec(html)!;
                el.setRawAttribute(a[0], vm[0]);
                p = v.lastIndex;
            }
        }
        add(el);
        if (RAW_TEXT.has(name) && !selfClosing) {
            const close = html.indexOf(`</${name}`, p);
            const stop = close < 0 ? n : close;
            if (stop > p) {
                const t = new DomText(html.slice(p, stop));
                t.parent = el;
                el.children.push(t);
            }
            const gt = close < 0 ? n : html.indexOf(">", close);
            i = gt < 0 ? n : gt + 1;
            continue;
        }
        i = p;
        if (!VOID.has(name) && !selfClosing) stack.push(el);
    }
}

/** A parsed element (a `<div>` for the widget's `#root`, say), for a caller
 * that needs one outside a fragment. */
export function elementFrom(tag: string, html = ""): DomElement {
    const el = new DomElement(tag);
    el.innerHTML = html;
    return el;
}

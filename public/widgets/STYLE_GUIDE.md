# Widget Style Guide

Shared design language for the in-chat MCP Apps widgets in this folder. First
implemented in `nutrition-summary.html`; copy the blocks below into any new
widget so they all look like one product.

## Hard constraints (why this is copy-paste, not a shared stylesheet)

Each widget is a **single self-contained HTML file** — inline `<style>` + inline
`<script>`, zero network requests. The iframe CSP is deny-by-default: no external
CSS, no CDN, no fonts, no `<link>`. So there is **no shared stylesheet to import** —
reuse means pasting these blocks into the new widget's `<style>`. Keep them
byte-identical across widgets; when the design changes, update this file and every
widget together.

Theme + data delivery (the iframe↔host handshake, the `appInfo`/`appCapabilities`
gotcha, and how `data-theme` gets set) are documented in **`CLAUDE.md` → Custom UI
Widgets (MCP Apps)** and the `mcp-apps-widgets` memory. This file is styling only.

## Design language

Apple-like and neutral: grays/whites surfaces, one brand **green accent**
(`--accent`, matching the landing page), **bold** headline weights (800), and
`font-variant-numeric: tabular-nums` on every number so figures don't jitter.
System font stack only (no web fonts — CSP). Generous radius (`--radius: 18px`),
soft shadow in light mode, no shadow in dark (the near-black background carries
depth instead).

## 1. Theme tokens — paste all four blocks

The token names are the contract; every rule references `var(--…)`, never a raw
hex. Four blocks are required: `:root` is the light default, the media query is the
system-dark fallback, and the two `[data-theme]` selectors let the host's explicit
theme win in **both** directions (a light host inside a dark OS, and vice-versa).

```css
:root {
    /* Light theme (default). */
    --text: #1d1d1f;
    --text-dim: #6e6e73;
    --bg: #f5f5f7;
    --panel: #ffffff;
    --panel-border: #e6e6ea;
    --track: #e6e6ea; /* unfilled gauge/axis grey */
    --accent: #4a7c59; /* brand green — section titles, highlights */
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 22px rgba(0, 0, 0, 0.05);

    /* Data-series palette (see the table below). */
    --calories: #ff9f0a;
    --protein: #8b5cf6;
    --carbs: #10b981;
    --fat: #f43f7e;
    --water: #0ea5e9;
    --over: #d0452b; /* "past goal" flag colour */

    --radius: 18px;
}

@media (prefers-color-scheme: dark) {
    :root {
        --text: #f5f5f7;
        --text-dim: #98989d;
        --bg: #000000;
        --panel: #1c1c1e;
        --panel-border: #2c2c2e;
        --track: #2c2c2e;
        --accent: #6ab98a;
        --shadow: none;
        --calories: #ffab2e;
        --protein: #a78bfa;
        --carbs: #34d399;
        --fat: #fb7199;
        --water: #38bdf8;
        --over: #ff6b52;
    }
}

/* Explicit host theme wins over the media query in both directions. */
:root[data-theme="light"] {
    --text: #1d1d1f;
    --text-dim: #6e6e73;
    --bg: #f5f5f7;
    --panel: #ffffff;
    --panel-border: #e6e6ea;
    --track: #e6e6ea;
    --accent: #4a7c59;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 22px rgba(0, 0, 0, 0.05);
    --calories: #ff9f0a;
    --protein: #8b5cf6;
    --carbs: #10b981;
    --fat: #f43f7e;
    --water: #0ea5e9;
    --over: #d0452b;
}
:root[data-theme="dark"] {
    --text: #f5f5f7;
    --text-dim: #98989d;
    --bg: #000000;
    --panel: #1c1c1e;
    --panel-border: #2c2c2e;
    --track: #2c2c2e;
    --accent: #6ab98a;
    --shadow: none;
    --calories: #ffab2e;
    --protein: #a78bfa;
    --carbs: #34d399;
    --fat: #fb7199;
    --water: #38bdf8;
    --over: #ff6b52;
}
```

### Data-series palette

Each series keeps a distinct hue, tuned per theme (dark values are lightened for
contrast on black). `--over` is a **status flag**, not a series colour — never
repaint a whole series with it (see the ring convention below).

| Token        | Light     | Dark      |
| ------------ | --------- | --------- |
| `--calories` | `#ff9f0a` | `#ffab2e` |
| `--protein`  | `#8b5cf6` | `#a78bfa` |
| `--carbs`    | `#10b981` | `#34d399` |
| `--fat`      | `#f43f7e` | `#fb7199` |
| `--water`    | `#0ea5e9` | `#38bdf8` |
| `--over`     | `#d0452b` | `#ff6b52` |

## 2. Base reset, typography, layout

```css
* {
    box-sizing: border-box;
}
html,
body {
    margin: 0;
    padding: 0;
}
body {
    min-height: 100vh;
    color: var(--text);
    background: var(--bg);
    font-family:
        ui-sans-serif,
        system-ui,
        -apple-system,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    font-size: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
}
.wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 18px 16px 22px;
}

/* Page header: bold title left, dimmed tabular meta right, wraps on narrow. */
header.head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}
.head h1 {
    font-size: 21px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.03em;
}
.head .range {
    color: var(--text-dim);
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

/* Uppercase micro-label used as a group heading, in the brand accent. */
.section-title {
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
    margin: 0 2px 9px;
}
```

## 3. Surface recipe

Every card — stat tile, chart panel, empty state — is the same surface: `--panel`
fill, `1px --panel-border`, `--radius`, `--shadow`. Reuse this on any new card.

```css
.card {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}
.empty {
    /* graceful "no data" state — same surface, centred */
    text-align: center;
    color: var(--text-dim);
    padding: 40px 20px;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}
.empty .big {
    font-size: 26px;
    margin-bottom: 6px;
}
```

Responsive card grid (auto-fits columns, collapses to fewer on narrow widths):

```css
.tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}
```

## 4. Component: Activity-style donut gauge (`.ring`)

A CSS conic-gradient ring that fades from the track grey into full colour at the
arc's end, with a rounded leading cap — Apple Activity-ring look, 0 KB, no SVG.

**JS contract:** set two inline custom properties per ring — `--p` is the filled
fraction `0–1` (clamp at 1), `--c` is the series colour. The arc starts at 12
o'clock and sweeps clockwise. Render the cap only when `--p > ~0.005`.

**Over-goal convention:** when a value exceeds its goal, keep `--c` as the series
colour so the five gauges stay distinguishable — signal "over" by colouring only
the `.rp` percentage caption with `var(--over)`. Do **not** repaint the ring.

```css
.ring {
    position: relative;
    width: 92px;
    height: 92px;
}
.ring-track,
.ring-arc {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    /* Donut hole: 10px-wide band. Both -webkit- and standard for reach. */
    -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 10px),
        #000 calc(100% - 10px)
    );
    mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 10px),
        #000 calc(100% - 10px)
    );
}
.ring-track {
    background: var(--track);
}
.ring-arc {
    /* Start the gradient from --track (not the panel) so there's no dark
       notch cutting the grey ring at 12 o'clock. */
    background: conic-gradient(
        from 0deg,
        var(--track) 0deg,
        var(--c) calc(var(--p) * 360deg),
        transparent calc(var(--p) * 360deg)
    );
}
/* Rounded cap on the leading (coloured) end: fill the ring, rotate to the arc's
   end angle, drop a dot at 12 o'clock in the middle of the 10px band. */
.ring-cap {
    position: absolute;
    inset: 0;
    transform: rotate(calc(var(--p) * 360deg));
}
.ring-cap::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    width: 10px;
    height: 10px;
    margin-left: -5px;
    border-radius: 50%;
    background: var(--c);
}
.ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.05;
}
.ring-center .rv {
    /* the big value */
    font-size: 19px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
}
.ring-center .ru {
    /* unit caption */
    font-size: 10px;
    font-weight: 500;
    color: var(--text-dim);
    margin-top: 1px;
}
.ring-center .rp {
    /* percent caption — turns var(--over) when past goal */
    font-size: 10.5px;
    font-weight: 700;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
}
```

Markup:

```html
<div class="ring" style="--c: var(--protein); --p: 0.95">
    <div class="ring-track"></div>
    <div class="ring-arc"></div>
    <div class="ring-cap"></div>
    <div class="ring-center">
        <div class="rv">171</div>
        <div class="rp" style="color: var(--protein)">95%</div>
    </div>
</div>
```

## 5. Component: hand-built SVG trend chart (`.trend`)

Area + line drawn as inline SVG (no chart lib — CSP). Key rules that keep it sharp
and legible:

- The SVG gets `width: 100%; height: auto` and a fixed `viewBox` — it scales.
- **Do not put axis/date labels inside the SVG** — SVG `<text>` shrinks with the
  viewBox and becomes unreadable at mobile widths. Render labels as HTML below the
  chart (`.tdates`, fixed `px`) instead.
- Strokes use theme tokens: `.axis { stroke: var(--panel-border) }`, the dashed
  goal line uses `var(--text-dim)` at `opacity: 0.5`, the series line/area use the
  series colour.

```css
.trend {
    /* same surface as .card */
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 14px 16px 12px;
    margin-bottom: 20px;
}
.trend svg {
    width: 100%;
    height: auto;
    display: block;
}
.trend .axis {
    stroke: var(--panel-border);
}
.trend .goalline {
    stroke: var(--text-dim);
    stroke-dasharray: 3 3;
    opacity: 0.5;
}
/* Date labels live in HTML, not the SVG, so they stay a fixed size. */
.trend .tdates {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    padding: 0 2px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}
```

## 6. Component: horizontal number-line (`.wgraph`)

A one-dimensional plot of two values on a shared scale — used for the
goal-progress weight card (current vs target), reusable for any current-vs-goal
metric. A rounded track, a highlighted segment for the gap, a filled **current**
marker (accent) and a hollow **target** marker, with a caption centred under each.

**JS contract:** pad the scale beyond the two points so the markers sit inboard
(~22% / 78%) and their centred captions don't clip at the card edges:
`smin = lo - (hi-lo)*0.4`, `span = (hi-lo)*1.8`, `pos(v) = (v-smin)/span*100`.
Set each marker/caption's `left:%` inline. Only render it when **both** endpoints
exist; special-case equal values (both markers at 50%, one "at target" caption).

```css
.wgraph {
    margin-top: 18px;
}
.wtrack {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: var(--track);
}
.wseg {
    /* the gap between the two points */
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    opacity: 0.4;
}
.wmark {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
}
.wmark.tgt {
    background: var(--panel);
    border: 2px solid var(--text-dim);
    z-index: 1;
}
.wmark.cur {
    background: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
    z-index: 2;
}
.wcaps {
    position: relative;
    height: 15px;
    margin-top: 9px;
    font-size: 11px;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}
.wcap {
    /* centred under its marker */
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
}
.wcap.curcap {
    color: var(--accent);
    font-weight: 700;
}
```

## Verifying a new widget

Use the local host-harness (see `mcp-apps-widgets` memory) to drive the widget
without a real client, and screenshot at light/dark and at a narrow (~400px) width
before shipping — the mobile check is what catches shrinking SVG text and cramped
grids.

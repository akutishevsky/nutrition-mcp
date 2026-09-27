# Widget Style Guide

Shared design language for the in-chat MCP Apps widgets. The shared CSS blocks
below are **not** copy-pasted anymore — they live as source partials under
`src/shared/` and are inlined into each widget at build time (see below). This
document is the human-readable spec for those partials: what each block is for and
how to use its classes.

Every in-chat widget is **one compact card**: a header line, then hairline-separated
sections inside it. The older shape — a page header, an uppercase section title and
a stack of separate cards — spent most of a phone screen on chrome before the first
number, and is gone. `.panel` (§3a) is the outermost thing every widget builds, and
the macro strip (§4a) is the block most of them drop inside it.

## Build system (how the shared code is reused)

Each widget is still a **single self-contained HTML file** — inline `<style>` +
inline `<script>`, zero network requests — because the iframe CSP is deny-by-default
(no external CSS/JS, no CDN, no fonts, no `<link>`). But the source is no longer
duplicated: it is assembled from partials at server startup (`src/widgets.ts`,
warmed in `src/index.ts`). Nothing generated is committed.

- **Sources** live in `public/widgets/src/`: shared partials in `shared/`
  (`tokens.css`, `base.css`, `ring.css`, `macros.css`, `trend.css`, `seg.css`,
  `form.css`, `table.css`, `macros.js`, `bridge.js`) and one template per widget
  in `templates/`.
- **Include marker** — a partial is inlined with a comment that is valid CSS _and_
  JS, so a template still parses on its own:
  `/*@include shared/tokens.css@*/`, `/*@include shared/bridge.js@*/`.
- **The host bridge is shared JS.** `shared/bridge.js` exposes one global,
  `initWidget(config)`, that runs the entire iframe↔host handshake, theme handling,
  height reporting, and the standalone preview fallback. A template supplies only
  `{ name, loading, coerce, render, sample }`. Handshake details (the
  `appInfo`/`appCapabilities` gotcha, `data-theme`, `size-changed`) live in
  **`CLAUDE.md` → Custom UI Widgets (MCP Apps)** and the `mcp-apps-widgets` memory.
- `bun test src/widgets.test.ts` asserts every widget assembles with no unresolved
  markers, valid inline JS, and each partial inlined in full.
- `bun test public/widgets/macros.test.ts` pins the macro strip's behaviour — the
  caption wording, the limit-cell gates, the accessible names, the column counts.
  Widget code has no import surface, so that file evaluates `shared/macros.js` the
  way the assembler splices it into a page. If you change a caption string, expect
  to change it there too.

When the design changes, edit the partial in `src/shared/` once — every widget
picks it up on next assembly. The blocks below document those partials; keep this
spec in sync when you change them.

## Design language

Apple-like and neutral: grays/whites surfaces, one brand **green accent**
(`--accent`, matching the landing page), **bold** headline weights (800), and
`font-variant-numeric: tabular-nums` on every number so figures don't jitter.
System font stack only (no web fonts — CSP). Generous radius (`--radius: 18px`),
soft shadow in light mode, no shadow in dark (the near-black background carries
depth instead). Type inside the card is small and dense — 9.5–13.5px — because
the widget is one card in a chat transcript, not a page.

## 1. Theme tokens — all four blocks

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
    --track: #e6e6ea; /* unfilled gauge/bar/axis grey */
    --accent: #4a7c59; /* brand green */
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 8px 22px rgba(0, 0, 0, 0.05);

    /* Data-series palette (see the table below). */
    --calories: #ff9f0a;
    --protein: #8b5cf6;
    --carbs: #10b981;
    --fiber: #0d9488;
    --sugar: #65a30d;
    --fat: #f43f7e;
    --alcohol: #a21caf;
    --caffeine: #8b5e34;
    --water: #0ea5e9;
    --over: #d0452b; /* "past goal" flag colour */
    --warn: #b26a00; /* "worth a look" flag colour */

    /* Not a custom property, but it belongs with the theme: native controls
       (select, input, scrollbars) ignore every token without it and render
       light OS chrome inside a dark widget. */
    color-scheme: light;

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
        --fiber: #14b8a6;
        --sugar: #a3e635;
        --fat: #fb7199;
        --alcohol: #e879f9;
        --caffeine: #c69a6d;
        --water: #38bdf8;
        --over: #ff6b52;
        --warn: #e0a030;
        color-scheme: dark;
    }
}

/* Explicit host theme wins over the media query in both directions. The two
   [data-theme] blocks in tokens.css repeat the two value sets above verbatim —
   `:root[data-theme="light"]` the light one, `:root[data-theme="dark"]` the dark
   one. A token added to one block must be added to all four. */
```

### Data-series palette

Each series keeps a distinct hue, tuned per theme (dark values are lightened for
contrast on black). `--over` and `--warn` are **status flags**, not series colours —
never repaint a whole series with one (see the over-goal convention in §4 and §4a).

| Token        | Light     | Dark      |
| ------------ | --------- | --------- |
| `--calories` | `#ff9f0a` | `#ffab2e` |
| `--protein`  | `#8b5cf6` | `#a78bfa` |
| `--carbs`    | `#10b981` | `#34d399` |
| `--fiber`    | `#0d9488` | `#14b8a6` |
| `--sugar`    | `#65a30d` | `#a3e635` |
| `--fat`      | `#f43f7e` | `#fb7199` |
| `--alcohol`  | `#a21caf` | `#e879f9` |
| `--caffeine` | `#8b5e34` | `#c69a6d` |
| `--water`    | `#0ea5e9` | `#38bdf8` |
| `--over`     | `#d0452b` | `#ff6b52` |
| `--warn`     | `#b26a00` | `#e0a030` |

`--fiber` and `--sugar` are deliberately inside the carbs green family (a deeper
teal and a lime), because fiber and sugar are _parts of_ carbs. They used to sit
only inside the carbs disclosure; now they have their own cells in the limits row,
and the kinship does more work than it did — it is what tells you at a glance which
cells in that row come out of the carb figure above them. `--alcohol` is the one
series with no neighbour, so it takes the otherwise-unused plum/fuchsia slot, well
clear of `--protein` (violet) and `--fat` (rose). `--caffeine` is coffee brown, the
last unused hue: it must not drift amber, because `--calories` and `--warn` already
own that end of the wheel.

`--warn` is the amber counterpart to `--over`, for "worth a look" rather than
"wrong" (a row logged at local noon because the source had no time). It is used by
the import widget's notices and pills, not by the strip.

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
```

**The body has no `min-height`, and must not get one.** The widget reports its own
height to the host by measuring content (`html { height: max-content }`, read the
bounding rect, restore — see `shared/bridge.js`). A `min-height: 100vh` fights that
measurement: it pins the reported height to the host's current iframe height, which
is exactly the value the measurement exists to replace. Let the body size to its
content. (CLAUDE.md carries the same warning.)

`.wrap` is the roomy gutter; `.wrap.tight` (§3a) is what every in-chat widget uses.
As of this redesign no template uses the plain `.wrap` — the one full-page widget,
`import-meals`, lays itself out with a local `.imp` grid — so `.wrap` survives as
the base the `.tight` modifier is written against.

`base.css` also still carries `header.head` / `.head h1` / `.head .range` and
`.section-title`, the page-header and group-heading rules from the pre-redesign
layout. **No template uses them anymore.** Don't reach for them in a new widget:
the panel header line (§3a) is what names a widget now.

## 3. Surface recipe

Every standalone card — a gallery section, an import step — is the same surface:
`--panel` fill, `1px --panel-border`, `--radius`, `--shadow`. `.card` ships in
`shared/base.css`, so use the class rather than re-declaring the four properties.
`.panel` (§3a) is the same surface plus the compact widget's padding and stacking.

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

`.empty` is the one thing a widget renders _instead of_ its panel: no data at all,
or nothing logged in the range. A state with something to say but nothing to plot
is **not** an `.empty` — it is a line of text in a section of the panel (see the
weight row's `.wnote`, §6).

There is no `.tiles` grid. Earlier versions of this guide documented one; it exists
in no partial and nothing renders a grid of equal cards anymore.

## 3a. The compact widget shell (`.wrap.tight` / `.panel` / `.phead` / `.psec`)

The outermost structure of every in-chat widget: one card, a header line, then
sections divided by hairlines. Additive — `.panel` is the surface plus a 9px column
gap, and `.psec` is "this block opens a new section", so a widget composes its own
body out of whatever blocks it owns.

```html
<div class="wrap tight" id="root">
    <div class="panel">
        <div class="phead">
            <div class="ptitle">Meal logged</div>
            <div class="psub">Grilled chicken salad · lunch</div>
            <div class="pmeta kcal">+520 kcal</div>
        </div>

        <!-- optional top matter only this widget has: a chart, a toggle -->
        <!-- the shared macro strip (§4a) -->
        <!-- a section of the widget's own -->
        <div class="wrow psec">…</div>
    </div>
</div>
```

| class         | role                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `.wrap.tight` | 12px gutter (14px from 560px up) — the whole page, since the card is the page                                                                 |
| `.panel`      | the card: `.card`'s surface + `12px 13px` padding, `flex column`, 9px gap                                                                     |
| `.phead`      | header line, `flex-wrap`, baseline-aligned                                                                                                    |
| `.phead.mid`  | same, centre-aligned — for a header whose right-hand item is a control, not text on a baseline (the `.seg-sm` pill in trends / weight-trends) |
| `.ptitle`     | 13.5px/800, `nowrap` — the widget's name                                                                                                      |
| `.psub`       | 11.5px dimmed, ellipsised — the one variable-length thing (a meal description)                                                                |
| `.pmeta`      | 11px dimmed tabular, `margin-left: auto` — context (a date, counts)                                                                           |
| `.pmeta.kcal` | the one header figure that is a _value_ rather than context: `--calories`, weight 700                                                         |
| `.psec`       | 9px top padding + a `--panel-border` hairline (10px from 560px up)                                                                            |

**The 560px breakpoint, in the shell.** Below it the title and `.pmeta` share row
one and `.psub` drops to a row of its own (`order: 3; flex: 1 1 100%`) — a meal
description and a title cannot both fit on a phone line, and the description is the
one that wants the whole width. From 560px up `.psub` rejoins the line
(`order: 0; flex: 1 1 auto`) and takes the slack between title and meta; the gutter
and panel padding grow a little, and `.psec` gains a pixel. The strip breaks at the
same width (§4a) so the whole card changes shape in one step.

A widget that can legitimately render nothing collapses its own gutter —
`meal-logged` declares `.wrap.tight:empty { padding: 0 }` locally, so a no-goals
result takes up as little host frame as possible.

## 4. Component: Activity-style donut gauge (`.ring`)

A CSS conic-gradient ring that fades from the track grey into full colour at the
arc's end, with a rounded leading cap — Apple Activity-ring look, 0 KB, no SVG.
Since the redesign the **calorie gauge is the only ring in the product** (protein,
carbs and fat are bars now), but the component stays general.

**JS contract:** set two inline custom properties per ring — `--p` is the filled
fraction `0–1` (clamp at 1), `--c` is the series colour. The arc starts at 12
o'clock and sweeps clockwise. Render the cap only when `--p > ~0.005`.

**Size and band come from the CSS context.** `width`/`height` set the diameter and
**`--ring-w` sets the band width** (default `10px`). The band is a variable and not
a literal because the compact strip draws a **52px** ring (**56px** from 700px up)
with `--ring-w: 7px`: a 10px band on a 52px disc is 38% of the radius — a blob whose
cap dot overhangs its own track. Everything that has to agree on the band (both mask
stops, the cap dot's size, its centring offset) reads the same variable, so a context
sets it once.

**What the centre carries.** With a goal, the compact gauge shows the **percentage
alone** (`.rp`) — the value it would otherwise repeat sits beside it at three times
the size. With no goal there is no percentage, so the **value** moves in (`.rv` plus
the `.ru` unit). That switch is in `ringMarkup`/`macroBits` in `shared/macros.js`,
not in CSS.

**Over-goal convention:** when a value exceeds its goal, keep `--c` as the series
colour so series stay distinguishable — signal "over" by colouring only the `.rp`
caption (and, in the strip, the figure) with `var(--over)`. Do **not** repaint the
ring.

```css
.ring {
    position: relative;
    width: 92px;
    height: 92px;
    --ring-w: 10px;
}
.ring-track,
.ring-arc {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    /* Donut hole. Both -webkit- and standard for reach. */
    -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - var(--ring-w)),
        #000 calc(100% - var(--ring-w))
    );
    mask: radial-gradient(
        farthest-side,
        transparent calc(100% - var(--ring-w)),
        #000 calc(100% - var(--ring-w))
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
   end angle, drop a dot at 12 o'clock in the middle of the band. A
   pseudo-element inherits custom properties from its own element, so --ring-w
   reaches it through .ring-cap. */
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
    width: var(--ring-w);
    height: var(--ring-w);
    margin-left: calc(var(--ring-w) / -2);
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

The compact context in `macros.css` shrinks all three centre captions to match the
smaller disc (`.cal .ring-center .rp` is 11px, 11.5px from 700px up):

```css
.cal .ring {
    width: 52px;
    height: 52px;
    --ring-w: 7px;
    flex: none;
}
```

Markup (as `ringMarkup` emits it — the `aria-label` is what a **static** gauge
exposes; inside an interactive tile the button role makes it presentational and the
tile's own name carries the numbers, see §4a):

```html
<div
    class="ring"
    style="--c:var(--calories);--p:0.9250"
    role="img"
    aria-label="Calories 2,035 kcal"
>
    <div class="ring-track"></div>
    <div class="ring-arc"></div>
    <div class="ring-cap"></div>
    <div class="ring-center">
        <div class="rp" style="color:var(--calories)">93%</div>
    </div>
</div>
```

## 4a. Component: the macro strip (`macroPanel` — `shared/macros.*`)

The intake-vs-goal view shared by `nutrition-summary`, `goal-progress`,
`meal-logged` and `trends`. It is **not a card**: it is one block a widget drops
inside its single `.panel`, under whatever top matter that widget has. In order:

- **the calorie row** (`.cal`) — the compact ring beside the figure, its goal and
  how much is left;
- **three macro bars** (`.mgrid` of `.mtile`) — protein, carbs, fat;
- **the limits row** (`.mgrid.lim.psec`) — one to four cells of the metrics you stay
  under (sugar, alcohol, caffeine) plus fiber;
- **the water line** (`.wrow.psec`) — full width, in litres;
- **the disclosure region** (`.macro-detail.psec`) — empty and `hidden` until a tile
  is tapped.

All of it — CSS and markup — lives in `shared/macros.css` + `shared/macros.js`;
include both (plus `shared/ring.css`, which the calorie gauge depends on) and call
one function:

```js
// vals / goal: objects keyed by calories, protein_g, carbs_g, fat_g, fiber_g,
//   sugar_g, alcohol_g, caffeine_mg, water_ml (a day's totals, a range's
//   averages, a slice…). caffeine_mg is the one key not in grams — the unit is
//   in the name at every layer down to the DB column for exactly that reason.
// wording: { under: "left" | "under", over: "over" } — default "left" / "over".
//          trends uses { under: "under" } ("421 kcal under"). FLOORS only;
//          a ceiling always reads "under" / "over" / "at limit".
// meals:   optional per-meal breakdown rows → every tile some meal actually
//          contributed to becomes tappable, the limits row included. Omit them
//          and the strip is fully static.
// opts:    optional {
//            drinkUnit: "us" | "uk",     // alcohol's caption gloss; default "us"
//            calLabel: string,           // label above the calorie figure;
//                                        //   default "Calories today"
//            divided: boolean,           // add a leading hairline (.psec) when
//                                        //   something of the widget's own sits
//                                        //   between the header line and the strip
//            contributors: object | null,// per-metric count of meals with a
//                                        //   positive value, when `meals` is a
//                                        //   bounded subset (nutrition-summary's
//                                        //   top-8-per-metric union); "N more
//                                        //   meals" counts against it. Default
//                                        //   null: meals.length is the count
//          }
// Requires fmt(n, decimals) and esc(s) in scope.
root.innerHTML = `
  <div class="panel">
    <div class="phead">…</div>
    ${chart}
    ${macroPanel(vals, goal, wording, meals, { drinkUnit, calLabel, divided })}
  </div>`;
```

`calLabel` exists because it is the one caption that genuinely differs between
widgets, and in two of them it names the **denominator**: `nutrition-summary` says
"Daily avg · logged days", `trends` says "14-day avg · all days". Same macros,
different number (issue #70) — that label is the only place the difference is
stated on screen, so keep it explicit.

### Layout is by `role`, never by a key list

**Every MACROS entry declares a `role`, and the strip lays itself out from that**,
so a new nutrient lands exactly where its role says and an entry with no role (or an
unknown one) renders nowhere at all rather than silently sprouting a fourth macro
bar. The vocabulary:

| role    | where it renders                                            |
| ------- | ----------------------------------------------------------- |
| `cal`   | the calorie gauge and its figure (`.cal`)                   |
| `macro` | one of the three protein/carbs/fat bars (`.mgrid > .mtile`) |
| `limit` | one cell of the row under them (`.mgrid.lim > .mtile`)      |
| `bar`   | the full-width water line (`.wrow`)                         |

`TOP_LEVEL_MACRO_KEYS` and `dayHasData()` are derived the same way — from `cal`,
`macro` and `bar` — so "was anything logged this day?" (which trends uses to count
logged days) stays a question about top-level metrics only. A limit is never
evidence a day was logged: fiber and sugar never appear without a meal that already
contributes calories, and alcohol/caffeine are `null` on a day that recorded
neither.

### Fiber and sugar are limit cells now, not `sub`s of carbs

They used to be `sub`s revealed inside the carbs disclosure. **They are now
top-level `limit` cells.** Two reasons:

- They were invisible behind a tap. A nutrient nobody knows to look for is one
  nobody sees.
- The limits row is where "the metrics you stay under" belong, and sugar is one of
  them outright. Fiber is a **floor**, not a ceiling — but it is _read_ the same way
  ("24.6, of 30 g"), so it shares the row's idiom while keeping floor semantics: no
  `direction`, so passing its goal is never flagged `--over`.

The consequence to know: **a strip built without `meals` now discloses nothing and
is entirely static.** The carbs tile used to be a button even with no meals behind
it, purely to reach fiber and sugar. Now `macroHasDetail(ctx)` is just `!!ctx.meals`
— the trends strip has no per-meal rows, so nothing in it is a button, and
`data-macro-panel` is not even emitted. `macros.test.ts` pins that.

### `signal` encodes what a `0` means

The alcohol/caffeine null-vs-zero rule is unchanged, but it is now a **field** on
the MACROS entry rather than special-casing, because the payload cannot express it
uniformly:

- **`signal: "null"`** (alcohol, caffeine) — the payload distinguishes
  never-recorded (`null`) from a recorded `0`. The null is the entire display gate,
  and a real `0` always stays on screen. `alcohol_g: null` means the user has
  alcohol tracking off; `caffeine_mg: null` means nobody ever recorded any (caffeine
  has **no profile opt-in** by design — the null is all there is). See
  `totalsPayloadOf` in `src/mcp.ts`.
- **`signal: "data"`** (fiber, sugar) — `TOTALS_ITEM` types these as `z.number()`,
  so a day that predates the column is indistinguishable from a genuine zero. The
  cell is earned by a value above zero **or** by a goal of the user's own — the same
  rule the carbs disclosure applied when they lived inside it.

What the gate prevents either way is a "0 mg of 400 mg" line invented for someone
who never went near the limit — the same suppression the model-facing text applies
(`recordedGoalLine` in `src/mcp.ts`). A metric that _is_ shown but reads zero says
so in words: `.mnone` renders **"none logged"**, because a `0` in the figure slot
looks like a measurement.

Water is the contrast: it has no opt-in, so a `0` cannot mean anything but
"untracked" and the whole line is dropped (`role: "bar"` cells render only above
zero).

### Wording rules (unchanged, and pinned by tests)

- `direction: "ceiling"` (sugar, alcohol, caffeine) mirrors `GoalDirection` in
  `src/mcp.ts`, and **only a ceiling** turns `var(--over)` when exceeded — passing
  a fiber goal is the goal being met, not a warning.
- A limit cell's caption is the limit itself (`limit 45 g`, `of 30 g`). The
  distance to it joins only when that is the thing to act on: a breach
  (`limit 45 g · 16 g over`) or exactly meeting it (`limit 45 g · at limit`). A
  cell is ~90px wide, and "13 g under" spends that space telling someone nothing
  has gone wrong — while "at limit" is a state the `--over` colour cannot express
  at all, because `over` is `pct > 100` and exactly at a ceiling would otherwise
  read as comfortably under it.
- A ceiling never says "left" — anywhere, including `macroBits().goalLine`, which
  is what the interactive tiles speak. Staying under a limit is not a budget to
  spend, and "12 g left" is meaningless over an averaged window; the vocabulary is
  `under` / `over` / `at limit`, matching "Days over limit" in the trends text.
  `wording` tunes the **floor** case only; "left" is unreachable through it on a
  ceiling.
- A ceiling target of **0** is a real limit and is rendered as one ("none today" is
  the most likely alcohol limit there is): any amount is over it, and the percentage
  is pinned rather than left to divide into Infinity. A **floor** of 0 still means
  "no goal set".
- Alcohol's caption leads with a drink count, which is what its `gloss: "drinks"`
  asks for: `0.9 US drinks · limit 20 g`, in the user's unit (`opts.drinkUnit`,
  `us` = 14 g ethanol, `uk` = 7.893 g, mirroring `src/alcohol.ts`). No other metric
  has a second unit — caffeine is milligrams alone, because there is no second unit
  anyone thinks in.
- **Water renders in litres from the millilitre payload.** `water_ml` is
  millilitres because that is what a glass is logged in, but a day's intake is
  spoken in litres: `2.1 / 2.5 L`. Always one decimal, deliberately not via `fmt()`
  — `fmt` round-trips through `Number()`, so a round 2 L would print "2" beside a
  "2.5 L" goal.

### The two grids, and the strip's two breakpoints

Both rows use one idiom — label + figure, a thin bar, a caption — so the limits row
needed no new component:

```html
<div class="mtile">
    <div class="mtop">
        <span class="mkey">Protein</span>
        <span class="mnum"
            >148<span class="msub"
                >/160<span class="munit"> g</span></span
            ></span
        >
    </div>
    <div class="mbar">
        <div class="mfill" style="width:92.5%;background:var(--protein)"></div>
    </div>
    <div class="mcap">12 g left</div>
</div>
```

The **column count travels with the markup** as two custom properties, set by
`gridCols(n)`: `--lc` for the stacked layout and `--lcw` for the wide one. Three or
fewer limits stay one row at both widths; four become a 2×2 while stacked
(`--lc:2;--lcw:4`), because four cells do not fit across one. The row therefore
handles one to four cells with no special case — alcohol simply is or is not among
them.

**Nothing in either grid may rely on `white-space: nowrap` to hold its shape.** A
track is `minmax(0, 1fr)`, so two nowrap children in a ~84px column do not fit —
they paint over each other and over the next column, silently, with no scrollbar to
give it away. `.mnum` is `flex: none` (the figure is the content and never breaks);
`.mkey` is `flex: 0 1 auto; min-width: 0` with an ellipsis, so the **name** is what
gives way. Below 366px it also drops to 9px and near-zero tracking, which buys back
about a glyph and keeps "PROTEIN" whole on a 360px frame.

**Two breakpoints, because the strip has two independent decisions.**

At **560px** the panel is wide enough for bigger type, but the grids are still full
width:

- `.mnum .munit` (the " g") appears; three columns wide on a phone, "125/160 g"
  leaves the label and the figure touching.
- `.mgrid:not(.lim) .mcap` appears — a macro's remaining-amount caption is the first
  thing to go on a narrow column, because "148/160" already implies the goal. The
  **limit** captions never hide, since "limit 400 mg" is the only place the limit
  itself appears; they wrap instead (`white-space: normal`), which is why
  `.mgrid.lim .mtile` aligns to `flex-start` — a two-line caption would otherwise
  ride its neighbours up.
- Both are hidden **the visually-hidden way, not with `display: none`.**
  `display: none` drops a node from the accessibility tree as well, and a screen
  reader would then be read a bare "133/160" — no unit, and on a static strip (no
  meals → no tile is a button carrying its own name) no goal state either.
- Type steps up, bars go 5 → 6px, and `.md-list` goes one column → two.

At **700px** the calorie block moves **beside** the grids and grows a
`--panel-border` divider; the ring goes 52 → 56px and `.cal-line` stacks the figure
over its caption. It is not 560 because `.cal` is `flex: none` at its max-content
width — up to ~230px for "DAILY AVG · LOGGED DAYS" — so flipping at 560 would leave
three macro columns of ~90px, narrower than the phone layout they just replaced.

Two edge rules exist for the same reason and are worth knowing about: below **360px**
a three-cell limits row folds to a 2×2 (three columns of ~80px start truncating
names), and between **700 and 859px** a **four**-cell one stays a 2×2 via the
`.n4` class `macroPanel` puts on the row — four columns beside a 230px calorie block
is the tightest thing the strip ever asks for, and it truncates to "ALCO…".

The macro row keeps its cells centred: their content is always identical, so
centring is invisible there, and it is what holds the 44px tap target together.

### A tile that discloses something is a button, and a button hides its children

`role="button"` makes every descendant presentational, so the ring's `aria-label`,
the macro name and the goal caption all drop out of the accessibility tree. An
interactive tile therefore carries the whole lot in its own name — **value first,
action last**: _"Carbs 205 g, of 220 g, 15 g left. Show the meals that
contributed."_ (`tileLabel` in `shared/macros.js`; `·` becomes a comma because
screen readers either skip it or say "middle dot"). Do not shorten that name back to
the action alone — a static tile reads out its numbers, and the interactive one
beside it must not read out fewer.

This applies to **every tile with meals behind it** — the calorie row, the three
macro bars and the limits row alike. The gate is per tile and data-driven, not per
kind: `macroHasDetail(m, ctx)` asks whether any meal contributed a positive amount
of that metric, so a sugar or caffeine cell is a button on the same terms a protein
bar is, while an alcohol cell reading "none logged" stays static rather than opening
an empty list. Water is never a button and needs no special case — water is logged
separately, so no meal row carries `water_ml`. `macros.test.ts` pins both halves.
Every metric on the strip is in `MEAL_BREAKDOWN_ITEM` (`src/mcp.ts`), which is what
makes the uniform rule possible; the breakdown gives grams a tenth even where the
tile above rounds them whole, and keeps kcal and caffeine's milligrams whole. The
alternative — moving
`role="button"` to an inner element so the values stay exposed — was rejected: the
whole tile is the tap target, so the button would either be smaller than what
responds to a tap or would nest a second target inside the first.

The open tile also gets `aria-expanded`, and the disclosure region is
`aria-live="polite"`. Tapping the open tile again, or its ✕, collapses it; tapping
another swaps the list. The height change is picked up by the bridge's
`ResizeObserver`, which re-reports so the host grows the iframe.

### Say what a tap does — `.mhint`

A tappable tile and a static limit cell are the same shape. On a pointer device the
cursor and the hover tint separate them; **a phone has neither**, and that is where
this widget mostly lives. So an interactive strip carries one dim line under its
grids — `👆 Tap a metric for the meals behind it` — at caption size, next to the
tiles it describes rather than at the end of the strip.

`macroToggle` hides it (`hidden`, restored on close) while a breakdown is open: the
instruction has been followed, the answer is on screen, and leaving it there is a
row of noise above the thing the user asked for. A strip with no meals emits no hint
at all, because nothing on it discloses anything — `macros.test.ts` pins both halves.

### Contrast: `--text-dim` has ~0.5 of headroom over AA and no more

It is 5.07:1 on `--panel` in light and 5.93:1 in dark, so anything that dims it
further — an `opacity`, or a tinted surface underneath — drops small text under the
4.5:1 floor. That is the entire reason `.mtile.open` / `.cal.open` switch their own
captions (`.mkey`, `.mcap`, `.msub`, `.cal-lab`, `.cal-left`, `.cal-goal`) to
`var(--text)`: the 12% accent tint behind them costs 4.36:1 in light. The selected
tile reading brighter than its neighbours is the right emphasis anyway. Rank text by
size and weight, not by fading it — the one `opacity` left in the partial is on
`.md-unit`, which rides bold, series-coloured text at the top of the contrast range.

### Over-goal, again

The strip keeps §4's convention: the ring and every `.mfill` stay their metric's own
colour even at 100%, and going over is carried by the **figure** turning
`var(--over)` (`.mnum` on a breached ceiling, `.rp` on the gauge). Repainting the
series would make four breached limit bars indistinguishable from each other.

To restyle any of this, edit the shared partials once — every widget picks it up on
next assembly.

## 5. Component: hand-built SVG chart (`.chart`)

Area + line drawn as inline SVG (no chart lib — CSP), sized to sit **inside** a
widget's panel rather than on a card of its own: the chart is a widget's own top
matter above the shared strip. Key rules that keep it sharp and legible:

- The SVG gets `width: 100%; height: auto` and a fixed `viewBox` — it scales.
  Because the viewBox aspect is fixed, **the chart's height scales with its width**;
  it is short by design (`480 × 54` in trends, `300 × 62` in weight-trends) so a
  wide host does not hand it a tall band of empty plot.
- **Do not put axis/date labels inside the SVG** — SVG `<text>` shrinks with the
  viewBox and becomes unreadable at mobile widths. Render labels as HTML at a real
  px size (`.ctitle`, `.cmeta`, `.tdates`) and keep only geometry in the SVG.
- Strokes use theme tokens: `.axis { stroke: var(--panel-border) }`, the dashed goal
  line uses `var(--text-dim)` at `opacity: 0.5`, the series line/area use the series
  colour (`var(--calories)` for calories, `var(--accent)` for weight).
- **`.axis` and `.goalline` are top-level selectors, not descendants of `.chart`.**
  The weight chart draws the same two lines but does not sit in a `.chart` block —
  it shares a flex row with the figure it is context for — so scoping them would
  have silently un-styled it.
- **Zero-based vs data-scaled Y.** Quantities that start at 0 (calories, macros) use
  a zero-based axis. Metrics that hover in a narrow band (body weight) must scale the
  axis to `[min, max] ± ~18%` of the data instead — a zero-based weight chart
  flattens the trend into a straight line. See `weight-trends.html`.

```css
.chart {
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.chead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
}
.ctitle {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-dim);
}
.cmeta {
    font-size: 10.5px;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}
.chart svg {
    width: 100%;
    height: auto;
    display: block;
}
/* Not descendant-scoped — the weight chart draws these outside a .chart block. */
.axis {
    stroke: var(--panel-border);
}
.goalline {
    stroke: var(--text-dim);
    stroke-dasharray: 3 3;
    opacity: 0.5;
}
/* Date labels live in HTML, not the SVG, so they stay a fixed size. */
.tdates {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    padding: 0 2px;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-dim);
    font-variant-numeric: tabular-nums;
}
```

Markup:

```html
<div class="chart psec">
    <div class="chead">
        <span class="ctitle">Calories / day</span>
        <span class="cmeta">12/14 days logged</span>
    </div>
    <svg
        viewBox="0 0 480 54"
        role="img"
        aria-label="Calories per day over the last 14 days"
    >
        <line class="axis" x1="8" y1="50" x2="472" y2="50" />
        <line class="goalline" x1="8" y1="14" x2="472" y2="14" />
        <path d="…" fill="var(--calories)" opacity="0.16" />
        <path d="…" fill="none" stroke="var(--calories)" stroke-width="2" />
    </svg>
    <div class="tdates"><span>06-28</span><span>07-11</span></div>
</div>
```

Add `psec` when the chart is not the first thing under the header line, and pass
`divided: true` to `macroPanel` so the strip below it opens with the same hairline.

## 6. The weight row (goal-progress)

`get_goal_progress` shows the user's weight as **one line in the panel**, not a card
and not a number-line plot with captions under it (the old `.wgraph` / `.wcaps`
markup is gone; nothing ships it). The row reuses the strip's own idiom from
`macros.css` — `.wrow` / `.wlab` / `.dot` / `.wnum` / `.wsub` — and adds a hairline
with `psec`. Only the little track between label and figure is local to
`goal-progress.html`:

```html
<div class="wrow psec" title="3.4 kg to lose · last logged 2026-07-09">
    <span class="wlab"
        ><span class="dot" style="background:var(--accent)"></span>Weight</span
    >
    <div
        class="wtrack"
        role="img"
        aria-label="Weight 78.4 kg, target 75.0 kg, 3.4 kg to lose, last logged 2026-07-09"
    >
        <div class="wseg" style="left:22.0%;width:56.0%"></div>
        <div class="wmark tgt" style="left:78.0%"></div>
        <div class="wmark cur" style="left:22.0%"></div>
    </div>
    <span class="wnum">78.4<span class="wsub"> → 75.0 kg</span></span>
</div>
```

- `.wtrack` is a 5px `--track` rail that flexes to fill the row; `.wseg` is the gap
  between the two readings at 40% accent; `.wmark.cur` is an 11px filled accent dot
  with a soft ring, `.wmark.tgt` a hollow one bordered in `--text-dim`.
- **Scale padding, so the markers sit inboard:** `pad = (hi-lo) * 0.4`,
  `smin = lo - pad`, `span = (hi-lo) + 2*pad`, `pos(v) = (v-smin)/span*100` → ~22%
  and ~78%. An 11px marker centred on 0% or 100% hangs off the end of its own track.
  Equal values are special-cased: both markers at 50% and the figure reads
  "at target".
- **The states with nothing to plot are one line of text**, `.wnote psec`, never a
  card and never a dropped section: no reading yet names `log_weight`, a reading with
  no target names `set_nutrition_goals`.
- The distance and the date behind the reading are decoration on screen — they ride
  along as the track's `aria-label` and the row's `title`, with `·` spelled as a
  comma in the spoken name.

Name collision worth knowing: `weight-trends.html` defines its **own** `.wrow` (a
flex row holding the latest figure beside the chart). It includes neither
`macros.css` nor this markup, so the two never meet — but do not assume `.wrow`
means the same thing in both files.

## 7. Component: segmented control (`.seg`)

A pill toggle for switching a view's mode/range (the trends and weight-trends
7/14/30-day toggles). The **active** label uses `var(--bg)` on the accent fill so it
stays high-contrast in both themes — off-white on dark-green in light, black on
light-green in dark — without theme-specific overrides.

Two scales:

- **`.seg`** — the full size, 13px labels with a `16px` bottom margin. The margin
  assumes a chart underneath it, which is the whole reason the small scale needs to
  be a modifier rather than a context.
- **`.seg.seg-sm`** — the pill that rides in a panel's **header line**:
  `margin-bottom: 0`, tighter padding, 11px labels, `flex: none`. Pair it with
  `.phead.mid` (baseline-aligning a pill against a title looks wrong), and note that
  `.phead .seg { margin-left: auto }` pushes it to the right-hand end where `.pmeta`
  would otherwise sit.

**Focus lives in `seg.css`.** `form.css` styles `:focus-visible` for every control
it owns, but the two widgets with a range toggle include `seg.css` and not
`form.css` — without the rule here, the segmented control would be the one
interactive thing on the page with no visible focus. The declaration is identical to
`form.css`'s, so including both partials is a no-op.

**Interactivity:** buttons carry a `data-*` value; delegate the click on a container
that survives re-renders (e.g. `#root`), read the value, update state, and
re-`paint()`. For a range/filter toggle, prefer sending a superset of data and
slicing client-side over re-calling the tool — instant, no host round-trip.

```css
.seg {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: var(--track);
    border-radius: 999px;
    margin-bottom: 16px;
}
.seg-btn {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-dim);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 15px;
    border-radius: 999px;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
    -webkit-tap-highlight-color: transparent;
    transition:
        background 0.12s ease,
        color 0.12s ease;
}
.seg-btn:hover {
    color: var(--text);
}
.seg-btn.active {
    background: var(--accent);
    color: var(--bg); /* inverted label → high contrast in both themes */
}
.seg-btn:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);
}

/* Header-line scale. */
.seg.seg-sm {
    margin-bottom: 0;
    padding: 2px;
    flex: none;
}
.phead .seg {
    margin-left: auto;
}
.seg-sm .seg-btn {
    font-size: 11px;
    padding: 3px 10px;
}
```

```html
<div class="phead mid">
    <div class="ptitle">Trends</div>
    <div class="seg seg-sm" role="group" aria-label="Trend window">
        <button
            class="seg-btn active"
            data-range="7"
            aria-pressed="true"
            aria-label="7 days"
        >
            7
        </button>
        <button
            class="seg-btn"
            data-range="14"
            aria-pressed="false"
            aria-label="14 days"
        >
            14
        </button>
        <button
            class="seg-btn"
            data-range="30"
            aria-pressed="false"
            aria-label="30 days"
        >
            30
        </button>
    </div>
</div>
```

## 8. Components: form controls (`shared/form.css`)

Everything an interactive widget needs, all token-only. Before the import widget the
_only_ control in the design language was `.seg-btn`, so anything here is new
ground — reuse these rather than hand-rolling a control in a template.

| class                                            | use                                                         |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `.field` / `.field-row` / `.label`/`.hint`       | vertical field stack, inline row, caption text              |
| `.input`, `.select`                              | text input and dropdown; add `.invalid` for the error state |
| `.field-error`                                   | the message under an invalid control                        |
| `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm` | buttons; `.actions` wraps a row of them                     |
| `.drop` + `.drop-input`                          | file drop zone; add `.over` while dragging                  |
| `.notice`, `-ok` / `-warn` / `-error`            | inline banner on the card surface                           |
| `.bar > span`, `.steps` / `.step`                | progress bar and step indicator                             |

Three things that are easy to get wrong:

- **`color-scheme` is declared in `tokens.css`, not here.** Without it the browser
  paints native OS chrome that ignores every token: a `<select>` in a dark widget
  comes out light, and so does its dropdown list. It is set in all four theme blocks
  alongside the custom properties.
- **`.btn-primary` uses `color: var(--bg)`** on the accent fill, same trick as
  `.seg-btn.active` — off-white on dark-green in light, black on light-green in
  dark, no theme-specific override.
- **The select chevron is an inlined `data:` SVG** with a literal stroke colour. The
  sandbox CSP allows `img-src data:` only, and `currentColor` does not work inside
  `url()`, so a mid-grey that reads on both themes is used instead.

`:focus-visible` is styled once for every control (accent border plus a `color-mix`
ring) — keyboard-only, so it never shows on mouse clicks.

## 9. Component: preview table (`shared/table.css`)

For showing rows the user must confirm before a write. `.tscroll` wraps `.tbl`;
`thead th` is sticky so column identity survives scrolling, which matters when the
table _is_ the confirmation step. `.pill` + `-ok`/`-warn`/`-bad`/`-dim` marks per-row
status; `.num` right-aligns numerics, `.wide` is the one column allowed to wrap, and
`.tmore` is the truncation footer.

**`.tscroll` sets `min-width: 0`, and that is required, not cosmetic.** A grid or
flex item defaults to `min-width: auto`, so a `white-space: nowrap` table's
min-content width otherwise pushes its column wide and drags every _sibling_ card
with it — the page then scrolls horizontally instead of the table scrolling inside
itself. If a parent is a grid, also give it `grid-template-columns: minmax(0, 1fr)`
rather than relying on the implicit auto column. This was a real bug caught by the
component gallery.

`.tscroll` also caps its own height (`max-height`) so the widget's reported height
stays bounded: a host may impose `hostContext.containerDimensions`, and an unbounded
table is simply clipped rather than scrolled.

## Verifying a new widget

Run `bun run harness` and open <http://localhost:8787>. It mimics a strict host
(validates the `ui/initialize` shape, withholds the tool result until
`ui/notifications/initialized`, starts the iframe at 130px, applies the sandbox CSP)
and additionally answers app-initiated `tools/call`. Query flags reproduce host
behaviour: `?serverTools=0`, `?tools=0` (never answer), `?delay=3000` (stand in for
a per-call approval prompt), `?maxHeight=600`, `?fail=1`.

**Start with the component gallery:**
<http://localhost:8787/host?widget=component-gallery> renders every shared component
on one page — the panel shell with a chart inside it, the full macro strip
(tappable), the breakdown pinned open, the alcohol and caffeine limit cells in
_every_ state including the nulls that render nothing, both segmented-control scales,
and the form controls, notices, steps and preview table. Extend it when you add a
component; it is the only place several of those states are reachable at all.

Then, for the widget itself:

1. **Both sides of every breakpoint — 360, 560, 700 and 860px.** Drag the window
   through each and watch the card change shape in one step: `.psub` joining or
   leaving the header line, the macro captions and the " g" unit appearing, the
   breakdown list going one column → two (560); the calorie block moving beside the
   grids and growing its divider (700); a four-cell limits row going 2×2 → one row
   (860); a three-cell one folding to 2×2 (360). Check both directions — a layout
   that only ever grows can hide a rule that never un-applies. Watch specifically
   for a metric NAME overprinting its own figure or the next column: that is what a
   nowrap child in a `minmax(0, 1fr)` track does, and it never produces a
   scrollbar.
2. **Light and dark, both ways in.** The harness's `host-context-changed (dark)`
   button drives the `[data-theme]` path; your OS setting drives the media query.
   They are different code paths, so check both — a token missing from one of the
   four theme blocks only shows up in one of them.
3. **Narrow (~400px)**, which is what catches shrinking SVG text, cramped grids and
   captions that collide with their own labels.
4. **The page itself must never scroll horizontally:**

    ```js
    const de = document.documentElement;
    de.scrollWidth > de.clientWidth; // must be false
    ```

5. **For interactive widgets**, exercise every control and confirm it re-renders:
   the range toggle, each tappable tile, the breakdown's ✕, and keyboard
   Enter/Space on a tile.

**Start the harness iframe SHORT (~130px) and grow it on `ui/notifications/size-changed`.**
The real host gives the widget a small default height and only expands it when the
widget reports its own height (see CLAUDE.md → handshake). A fixed-tall test iframe
hides clipping entirely — that is exactly how a clipped widget shipped once. Every
widget must send `size-changed` and re-send it via a `ResizeObserver`, which is also
what makes an opened breakdown grow the frame instead of being cut off.

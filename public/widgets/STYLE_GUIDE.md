# Widget Style Guide

Shared design language for the in-chat MCP Apps widgets. The shared CSS and JS
blocks below are **not** copy-pasted into templates — they live as source partials
under `src/shared/` and are inlined into each widget at build time (see below).
This document is the human-readable spec for those partials: what each block is
for, how to use its classes, and why it is shaped the way it is.

The design is **Dawn**, the public site's own language (`public/styles.css`),
ported into a chat card. The token names deliberately match the site's, so a
colour decided on `/tools` is a one-line change here rather than a translation
exercise, and a nutrient looks the same in both places.

Every in-chat widget is **one Dawn card**: a header line, the widget's own top
matter (a chart, a range toggle, a weight row), then the shared macro strip — a
calorie hero with its gauge, **one** wrapping rail of nutrient chips, a `.more` row
holding the limits behind it, and the one drawer all of them open into.
Per-nutrient bars and always-visible goal captions are gone: the chip carries the
number and a 2.5px progress underbar, and the goal, the distance to it and the
meals behind it are one tap away. That is what bought back the ~150px the old
layout spent on chrome before the first number.

## Build system (how the shared code is reused)

Each widget is a **single self-contained HTML file** — inline `<style>` + inline
`<script>`, zero network requests — because the iframe CSP is deny-by-default (no
external CSS/JS, no CDN, no web fonts, no `<link>`). But nothing is duplicated: the
file is assembled from partials at server startup (`src/widgets.ts`, warmed by
`warmWidgets()` in `src/index.ts`). Nothing generated is committed.

- **Sources** live in `public/widgets/src/`: shared partials in `shared/` and one
  template per widget in `templates/`.

    | partial      | contents                                                                                                                             |
    | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
    | `tokens.css` | the four theme blocks — every colour, radius, font stack and easing (§1)                                                             |
    | `base.css`   | reset, type scale, `.wrap`, `.card`, `.glow`, the header line, `.sec`, `.empty`, the `.c-*` role classes, `.ic`, reduced motion (§2) |
    | `chip.css`   | every interaction primitive: `.rail`, `.chip`, `.hero`/`.gauge`, `.more`, `.drawer`, `.seg` (§3–§7)                                  |
    | `chart.css`  | the one chart grammar: `.cwrap`, `.cline`, `.carea`/`.cstop-a`/`.cstop-b`, `.cgoal`, `.chalo`, `.cdot`, `.cfoot`, `.cempty` (§8)     |
    | `form.css`   | fields, pill inputs and buttons, the drop zone, notices, the progress rails (§11)                                                    |
    | `table.css`  | the preview table and its status pills (§12)                                                                                         |
    | `icon.js`    | the `ICONS` path table + `icon(name, size)` (§9)                                                                                     |
    | `svg.js`     | chart geometry — `chPoints` / `chPath` / `chArea` / `chAreaMarkup` / `chY`, pure string math (§8)                                    |
    | `macros.js`  | the macro strip: `MACROS`, `macroBits`, `macroPanel`, `macroToggle` (§10)                                                            |
    | `date.js`    | `shortDate(iso)` / `isToday(iso)` for widgets that name a calendar day                                                               |
    | `i18n.js`    | `pickLocale` / `setLocale` / `setLocaleFrom` / `tpl` / `plural`, and the ambient `T`                                                 |
    | `bridge.js`  | the whole iframe↔host handshake — `initWidget(config)`                                                                               |

- **Include marker** — a partial is inlined with a comment that is valid CSS _and_
  JS, so a template still parses on its own:
  `/*@include shared/tokens.css@*/`, `/*@include shared/bridge.js@*/`.
- **Two other markers**: `/*@inlinets src/csv.ts@*/` transpiles a TypeScript
  module from `src/` into the widget as plain JS (so a widget runs **tested**
  server-side code instead of a hand-copied twin — only works for modules with no
  runtime imports; `import-meals` inlines both `src/csv.ts` and `src/chunk.ts`
  this way), and `/*@i18n@*/` splices in the whole `WIDGET_STRINGS`
  dictionary as a plain-data `const`. `/*@i18n@*/` sits in the **template**,
  immediately before that template's `/*@include shared/i18n.js@*/` line, never
  inside `i18n.js` itself — see the invariant on marker text at the end of this
  document.
- **Include order is load-bearing:** `/*@i18n@*/` → `i18n.js` → `date.js` (only
  where used) → `icon.js` → `svg.js` → `bridge.js` → the template's own code
  (`fmt`, `esc`, `render`, `initWidget({…})`) → `macros.js`. `macros.js` needs
  `fmt`, `esc`, `icon` and `T` already in scope; it declares no imports of its own,
  because there is no module system inside the assembled file.
- **The host bridge is shared JS.** `shared/bridge.js` exposes one global,
  `initWidget(config)`, that runs the entire iframe↔host handshake, theme handling,
  height reporting, the outbound `api.callTool` channel and the standalone preview
  fallback. A template supplies only `{ name, loading, coerce, render, sample }`
  plus an optional `onReady(api)`. Handshake details (the `appInfo`/`appCapabilities`
  gotcha, `data-theme`, `size-changed`) live in **`CLAUDE.md` → Custom UI Widgets
  (MCP Apps)**.
- `bun test src/widgets.test.ts` asserts every widget assembles with no unresolved
  markers, valid inline JS, and each partial inlined in full.
- `bun test public/widgets/macros.test.ts` pins the strip's behaviour — the caption
  wording, the limit-chip gates, the accessible names, which chips are interactive.
  Widget code has no import surface, so that file evaluates `i18n.js + icon.js +
macros.js` the way the assembler splices them into a page. If you change a
  caption string, expect to change it there too.

When the design changes, edit the partial in `src/shared/` once — every widget
picks it up on next assembly. Do **not** re-inline or fork a shared block into a
template. Layout only one widget needs goes in that template's own scoped
`<style>`, using the shared tokens and classes, never a colour literal.

## Design language

Dawn, at chat-card scale: soft neutral surfaces, one brand **green accent**, big
radii, a single drifting colour blob behind each card, and the same nutrient
palette (`--cal --pro --car --fat --wat --fib --sug --caf`) the public site uses.
Every number carries `font-variant-numeric: tabular-nums` so figures don't jitter
when they change under a toggle.

**The system font stack has to carry Dawn without Urbanist.** Urbanist and Geist
Mono are network fetches and the CSP is deny-all, so `--font` and `--mono` are
system-only. Three declarations in `base.css` close most of the gap, and all three
are load-bearing:

- **`font-weight: 500` on `body`.** Urbanist ships no 400, so the site's
  "unweighted" text is really 500. A stack resolving to a genuine 400 reads
  visibly lighter and instantly wrong.
- **Negative tracking**, one step tighter than the site at every display size,
  because SF Pro / Segoe UI Variable / Roboto all set looser than Urbanist:
  `-0.005em` on body, `-0.025em` on `.ctitle`, `-0.035em` on `.hval`.
- **`-webkit-font-smoothing: antialiased`**, the site's own smoothing, or the
  heavier weight goes chunky.

**Type scale.** Everything is between 10 and 24px, because the widget is one card
in a chat transcript, not a page.

| size            | where                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| 24px / 800      | `.hval` — the hero figure, the only display type in the card                 |
| 15px / 800      | `.ctitle` — the widget's name                                                |
| 13.5px / 500    | `body` — the base, and every control (`.input`, `.btn`) at 13px              |
| 12.5px          | `.more`, `.dname` (800), `.dlist li`, `.tbl`                                 |
| 12px / 600–700  | `.chip`, `.seg button`, `.label`                                             |
| 11.5px          | `.csub`, `.dcap`, `.hint`, `.dempty`, `.tmore`                               |
| 10–10.5px, mono | the eyebrows: `.cmeta`, `.hlab`, `.cfoot`, `.slab`, `.tbl thead th`, `.pill` |

Mono is never decoration: it marks the eyebrow register — a range, a period label,
a chart axis end, a step count, a column header. A figure is not an eyebrow, which
is why `.cmeta.kcal` drops the uppercase mono treatment.

## 1. Theme tokens — all four blocks

The token names are the contract; every rule references `var(--…)`, never a raw
hex. Four blocks are required, and each colour is written out four times: `:root`
is the light default, the media query is the system-dark fallback, and the two
`[data-theme]` selectors let the host's explicit theme win in **both** directions
(a light host inside a dark OS, and vice-versa) — which a media query alone cannot
do. **A token added to one block must be added to all four.**

Three deliberate departures from `public/styles.css`, all commented in the partial:

- **`--ink3: #646b78`** and **`--acc: #15803d`** are the AA-corrected values the
  site itself ships, not the design file's `#9399a5` / `#16a34a`, which fail 4.5:1
  at the 10–12px sizes this card uses.
- **`--alc`** extends Dawn: the site never charts alcohol, so it has no token for
  it, and the widget does.
- **`--warn`** is likewise widget-only. Dawn has one signal colour (`--over`), and
  `import-meals` genuinely needs a third severity between "fine" and "wrong".

Both signal tokens were darkened for light mode after the a11y audit composited
them against the tints they actually sit on rather than a bare white ground:
`--over` `#d0452b` → `#bb3a22` and `--warn` `#b26a00` → `#8a5a00`. Their other
consumers are notice icons, which are graphics needing 3:1, so nothing lost by it.

### Where each token is used

| token                                                   | role                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bg`                                                  | the page ground behind the card                                                                                                            |
| `--bg2`                                                 | every **recessed** surface: `.more`, `.drawer`, `.seg` track, `.chip.static`, `.tbl thead`, `.tmore`, `.hsub.mute`                         |
| `--panel`                                               | every **raised** surface: `.card`, `.chip`, `.input`/`.select`/`.btn`, the `.seg` thumb, the `.chalo` chart halo                           |
| `--ink` / `--ink2` / `--ink3`                           | primary text / secondary (`.csub`, `.chip .k`, `.more`) / captions and eyebrows (`.cmeta`, `.hlab`, `.dcap`, `.cfoot`, `.hint`)            |
| `--line` / `--line2`                                    | **structural** hairlines (card border, `.sec`, dividers, table rules) / one step darker, for dashed edges (`.drop`, `.chip.ghost`)         |
| `--edge` / `--edge2`                                    | **control** boundaries — anything you can press — at 3:1 and its ~4:1 hover step. See below: `--line` is not strong enough to be one       |
| `--acc`                                                 | the brand green: every `:focus-visible` outline, `.btn-primary`'s fill, the `.steps`/`.bar` fill                                           |
| `--acc-text` / `--acc-ink` / `--acc-soft`               | accent **text on a tint** (`.hsub`, `.pill-ok`) / text **on** the accent fill / the tint itself                                            |
| `--track`                                               | the unfilled part of anything that fills: the gauge's `.gt`, `.steps`/`.bar`, `.pill-dim`                                                  |
| `--cal --pro --car --fat --wat --fib --sug --caf --alc` | the data series, reached only through a `.c-*` role class (§2)                                                                             |
| `--over` / `--warn`                                     | **signals, never series** — past a ceiling, and "worth a look". Neither gets a `.c-*` class                                                |
| `--shadow` / `--seg-shadow`                             | the card's elevation / the segmented-control thumb's                                                                                       |
| `--ease-out`                                            | one easing curve for every transition and keyframe in the system                                                                           |
| `--r-card` / `--r-in` / `--r-pill`                      | 20px card, 14px inner block, 999px pill                                                                                                    |
| `--font` / `--mono`                                     | the two system stacks                                                                                                                      |
| `color-scheme`                                          | not a custom property, but it belongs with the theme: without it native controls and scrollbars paint light OS chrome inside a dark widget |

**`--line` is a divider; `--edge` is a boundary — and conflating them was a real
contrast failure.** SC 1.4.11 asks 3:1 of "visual information required to identify
user interface components", and a tile's border is exactly that: the card is
`--panel` and the tile is _also_ `--panel`, so past the wash's mark they are the
same colour and the hairline is the only thing separating them. On `--line` that
measured **1.27:1 light / 1.18:1 dark** — a quarter of the bar, on the element the
whole card asks you to tap, and it read as a rail of floating text rather than of
tiles.

`--edge` (2.99:1 both themes) carries anything pressable; `--edge2` (4.05:1) is its
hover step. `--line` deliberately stays soft, because a divider, a table rule and
the card's own edge identify no component and the SC does not reach them — taking
_those_ to 3:1 turns Dawn into a wireframe. Both keep `--line`'s slight blue cast
rather than going neutral grey, so the card gains definition without warming up.

**It is applied by redeclaring the token, not by overriding `border-color`.** Eight
rules draw a control border (resting, hover, breached, breached + hover — each on
both `.chip` and `.focus`), three of them through `color-mix(… var(--line))`.
`chip.css` hands `.chip` and `.focus` a different `--line`/`--line2`, so all eight
move at once, every existing state rule stays exactly as written, and the breach
mix lands on 4.25:1 / 4.02:1 for free. Overriding the property under a descendant
selector would instead need a higher-specificity twin of each rule, and would
silently outrank `.chip[aria-expanded]`'s selected `--c` border at (0,2,0).

**Still open, and a palette question rather than a widget one:** `--bg2` on
`--panel` — the recessed ground under `.chip.static` and the drawer — measures
**1.16:1 light and 1.05:1 dark**. In dark that is no visible difference at all, so
"bordered pill = control, recessed = data" is currently carried by nothing there.
It cannot be fixed by darkening `--bg2`: `--panel` (`#161a22`) is close enough to
black that _any_ darker surface tops out at 1.21:1 against it. The options are to
lighten `--panel`, to let a recessed surface read lighter than the panel in dark
(the usual dark-UI elevation convention, inverted from Dawn's), or to give
recessed surfaces their own hairline.

Two values worth knowing the reason for:

- **`--r-card` is 20px, not the site's 26–28.** On a 336px-wide card a 28px radius
  eats visible corner area and reads as a lozenge. Same decision rule as the site
  (radius steps with surface size), different surface.
- **Dark `--shadow` keeps only the contact line** (`0 1px 2px rgba(0,0,0,.45)`).
  Dawn's dark ambient has nothing outside the card to fall on inside an iframe and
  reads as a grey smudge — but this must not go back to `none` either: the 1px line
  is what separates the card from the host's chat ground.

### Data-series palette

Each series keeps a distinct hue, tuned per theme (dark values are lightened for
contrast on near-black).

| token    | light     | dark      |
| -------- | --------- | --------- |
| `--cal`  | `#ff9f0a` | `#ffab2e` |
| `--pro`  | `#8b5cf6` | `#a78bfa` |
| `--car`  | `#10b981` | `#34d399` |
| `--fat`  | `#f43f7e` | `#fb7199` |
| `--wat`  | `#0ea5e9` | `#38bdf8` |
| `--fib`  | `#0d9488` | `#14b8a6` |
| `--sug`  | `#84cc16` | `#a3e635` |
| `--caf`  | `#a16207` | `#d4a56a` |
| `--alc`  | `#a21caf` | `#e879f9` |
| `--over` | `#bb3a22` | `#ff6b52` |
| `--warn` | `#8a5a00` | `#e0a030` |

`--fib` and `--sug` sit inside the carbs green family (a deeper teal and a lime)
because fiber and sugar are _parts of_ carbs — that kinship is what tells you at a
glance which chips in the limits rail come out of the carb figure above them.
`--alc` is the one series with no neighbour, so it takes the otherwise-unused
plum/fuchsia slot, well clear of `--pro` (violet) and `--fat` (rose). `--caf` is
coffee brown, the last unused hue: it must not drift amber, because `--cal` and
`--warn` already own that end of the wheel.

## 2. Base: the shell (`shared/base.css`)

### `.wrap` — and `#root` **is** `.wrap`

```html
<div class="wrap" id="root"></div>
```

The padding lives on the element every template's `render()` replaces wholesale,
which is deliberate: nesting a second element inside would move `bridge.js`'s
appended footer note outside the element the template owns. `.wrap` is 10px of
gutter, `max-width: 760px`, centred. `.wrap.page` is 14px, for the two full-page
widgets (`import-meals`, `component-gallery`).

**`.wrap:empty { padding: 0 }` is meal-logged's zero-height contract.** With no
goals that widget writes `""` and the host must collapse the iframe to nothing;
10px of padding would leave a stripe behind. `:empty` matches only an element with
no child nodes at all, so nothing may be appended to an empty root — see the
bridge's footer note in the invariants below.

**The body has no `min-height`, and must not get one.** The widget reports its own
height by measuring content (`html { height: max-content }`, read the bounding
rect, restore — see `shared/bridge.js`). A `min-height: 100vh` pins the reported
height to the host's current iframe height, which is exactly the value the
measurement exists to replace.

### `.card` — the one surface

```css
.card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding: 12px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    box-shadow: var(--shadow);
}
```

One per widget. **Never nested, never a second border, never a shadow inside a
shadow** — every block below is a child of this card, not another card. `.glow` is
Dawn's drifting colour blob, absolutely positioned, tinted by the card's own `--c`
and blurred; it is by far the cheapest piece of the Dawn feel to bring inside a
deny-all iframe (pure CSS, zero assets). `.card > :not(.glow) { position: relative }`
lifts every real child above it without giving the glow a `z-index` — a z-index
would create a stacking context the drawer's animation sits under.

### The header line

```html
<div class="chead">
    <h1 class="ctitle">Meal logged</h1>
    <span class="cmeta kcal">+520 kcal</span>
    <span class="csub">15 Jul · Grilled chicken salad · lunch</span>
</div>
```

| class         | role                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.chead`      | the row: flex, centre-aligned, `min-height: 26px` so a title-only header matches one with a pill                                                     |
| `.ctitle`     | 15px/800, `nowrap`, `flex: none` — the widget's name                                                                                                 |
| `.cmeta`      | mono uppercase eyebrow, `margin-left: auto` — a date range, a logged-day count                                                                       |
| `.cmeta.kcal` | the one meta that is a **value** rather than context (the calories a meal just added): `--ink` on a soft `--cal` tint pill, weight 700, no uppercase |
| `.csub`       | 11.5px, ellipsised — the one variable-length thing (a meal description)                                                                              |

**`.cmeta` degrades in three stages and is never clipped.** It used to ellipsise on
one line, and the layout audit measured what that cost: the meta was cut at 360px
in 6 of 9 locales on nutrition-summary and 7 of 9 on goal-progress, and in plain
English at 320px — and the count of logged days is the header's only quantitative
content, so the half being lost was the half worth reading. The stages:

1. it fits beside the title → one line, flush right;
2. its max-content does not → `.chead`'s **unconditional** `flex-wrap: wrap` breaks
   the line and the meta gets the card's full width (German needed 264px in a 154px
   slot beside the title, and gets 274px on its own row at 320px);
3. even a full row is too narrow → it wraps inside its own box, with
   `overflow-wrap: anywhere` as the last resort for an unbreakable compound
   ("PROTOKOLLIERT"). Only here can a date range break mid-figure — a break that
   used to be a truncation.

`min-width: 0` stays for the same old reason: a flex item must be allowed below its
content width. The mono uppercase treatment is kept on purpose even though it costs
~33% width over sentence case — it is the same eyebrow as `.slab` and the table
head, and stages 2–3 are what pay for it.

**`.cmeta.kcal` is a tinted pill, not coloured text.** It was `color: var(--cal)` on
`--panel`: 2.06:1 in light mode at 10.5px/700, on the single most important number
on the meal-logged card. The system's own rule is that a series token is an
identity, not something you have to read — so the text is `--ink` on a soft `--cal`
fill with a `--cal` hairline and a `--cal` dot drawn as `::before`, exactly what a
chip does. **Never paint 10.5px text in a series token.**

The `.seg` toggle (§7) rides this line too, in the meta slot — it carries its own
`margin-left: auto`.

### `.sec` — a hairline-topped block

```css
.sec {
    padding-top: 10px;
    border-top: 1px solid var(--line);
}
```

Exactly one idea, no variants. It is how a widget's own block (a weight row) or
the strip itself opens a new section under something else — `macroPanel`'s
`opts.divided` adds it to the strip.

### `.empty` — and who owns it

```css
.empty {
    padding: 26px 18px;
    text-align: center;
    /* …the card's own surface, centred */
}
.empty .big {
    margin-bottom: 6px;
    font-size: 26px;
}
.card .empty {
    /* inside a card it must NOT become a second surface */
    padding: 18px 12px;
    background: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
}
```

`.empty` is what a widget renders _instead of_ its card: no data at all, or nothing
logged in the range. The `.big` line is an emoji, not an SVG icon — a system glyph
costs no fetch, and an empty state is the one place warmth beats precision. A state
with something to say but nothing to plot is **not** an `.empty`: it is a line of
text inside the card (goal-progress's `.wnote`).

**`.empty` and `.empty .big` are not ours to rename**: `bridge.js` paints its
connect-failure card with those two exact class names. `base.css` says so inline.

### `.c-*` — the nutrient role classes

```css
.c-cal {
    --c: var(--cal);
}
```

Dawn's `--c` indirection, and the reason nothing in `macros.js` ever writes a
colour. Every consumer — chip dot, chip underbar, gauge arc, chart stroke, drawer
dot, drawer value, card glow — reads `var(--c, var(--acc))` and never names a
nutrient. Adding a nutrient is therefore **one `MACROS` entry, one token, one line
here**. There are ten: `.c-acc`, `.c-cal`, `.c-pro`, `.c-car`, `.c-fat`, `.c-wat`,
`.c-fib`, `.c-sug`, `.c-caf`, `.c-alc`. `--over` and `--warn` deliberately get no
role class: they are states, and a state must not be assignable as a series.

### `.ic` — the icon primitive

`.ic` is `fill: none; stroke: currentColor; stroke-width: 2`, with `.ic-sm`
dropping to 1.75 as an optical correction below 13px. `currentColor` is what lets
one drawing follow the theme, the inverted chip and the `--c` role class with no
extra rule. See §9 for the path table.

### Reduced motion

`base.css` ends with a blanket `prefers-reduced-motion` block, plus an explicit
un-hide clause for `.drawer`. The `!important` there is not decoration: `chip.css`
defines `.drawer { animation: rise … }` at equal specificity and later in the
cascade, and a media query adds no specificity. `chip.css` names its three
animations again for the same reason — **a widget must never depend on the blanket
rule to un-hide anything.**

## 3. The chip rail and the chip

### `.rail` — chips wrap, they never scroll

```css
.rail {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 2px;
    margin: -2px;
}
.rail + .rail {
    margin-top: 6px;
}
```

An earlier draft made the rail a horizontally-scrolling shelf. All of it is gone,
for three reasons that are each independently sufficient: a horizontal swipe inside
a chat iframe fights the host's own scrolling; a post-paint `scrollWidth`
measurement races bridge.js's rAF-debounced `ResizeObserver`; and a chip parked
off-screen is a nutrient nobody finds. Two chips per row at 360px, three at ~440px.

The `2px` padding / `-2px` margin pair is room for a focus ring that the card's
`overflow: hidden` would otherwise clip. It costs no layout.

**`macroPanel` emits ONE visible rail**, not two. Two identically-styled rails read
as a single wrapped row anyway, and the split cost a whole line whenever the first
one's last row was half empty. The `.rail + .rail` pair survives for anything that
lays out two deliberately (the dev gallery), so that spacing is defined rather than
accidental — and for the collapsed limits rail, whose own spacing comes from the
`.more` row above it (`.more + .rail.limits`) rather than from `.rail + .rail`.

**`.rail[hidden] { display: none }` is required, not tidiness.** The `display: flex`
above outranks the UA sheet's `[hidden] { display: none }`, so without it the
collapsed limits rail renders wide open and its `.more` row toggles nothing at all.

`.strip` is the strip's own wrapper (hero, rails, drawer); `.strip > .hero + .rail`
is the only spacing rule it needs. `.sec` (§2) is added to it by `macros.js` when
the widget put something of its own above.

**Chips show their full label at every width.** There is no short-label span and no
`labelsShort` translation matrix; height is bought back by shrinking the chip
(30px tall, 12px type), never by hiding data.

### Tiers — the strip in three levels (`opts.tiers`)

One rail of identical tiles gives every metric after the hero the same weight, so
the card reads as one big number and then a flat plain of eight equal ones: sugar
shouts as loudly as protein, and water — not food, logged through a different
tool, with no meal behind it — sits between fat and sugar as though it were a
third macro. `macroPanel(…, { tiers: true })` deals the **same tiles** into the
groups `role` has always named, and `chip.css` gives each group its own scale and
shape:

| rail       | role    | form                                                                      |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `.r-macro` | `macro` | protein / carbs / fat — **three columns at every width**, 16px figures    |
| `.r-limit` | `limit` | the four ceilings, **behind a hairline**, two up / four up ≥460px, 12.5px |
| `.r-water` | `bar`   | water alone, **last**, as a full-width bar, one line, ~30px               |

The levels are made of **size, proximity and shape**, and the ladder that does the
work is **24 / 16 / 12.5** — the hero's figure, a macro's, a limit's.

- **Size is chosen by the narrowest column, not the widest.** Three columns inside
  a 320px card are 95px; take out the border, the insets, the centred chevron and
  its gap and the figure gets ~61, while `"148/160 g"` needs 65. Three macros, a
  figure printed against its goal, and a chevron centred on the tile do not all
  fit at that width. `@media (max-width: 379px)` gives a little of all three —
  6px insets, a 3px gap to the chevron, a 4px gutter between tiles, a 15px figure
  — rather than all of one, which is what keeps any single one of them from
  breaking. **A tile may never ellipsise a figure**: a truncated number still
  reads as a number.
- **Fit to a margin, not to the pixel.** The tail is ~55% of that 65px and is
  already at the type scale's 10px floor, so shrinking the figure alone barely
  moves it — which is why the insets shrink too. What matters is the slack:
  `tabular-nums` and a macro unit that is `"g"` in every locale make the worst
  case deterministic _within one font_, but `--font` is a **system stack**, and
  Segoe UI Variable and Roboto carry wider tabular advances than the SF Pro these
  numbers were measured on. A layout that fits to the pixel on a Mac clips
  silently on Windows, in the one run that may never be cut. Measured slack at
  320px is **9.5%**.
- **Proximity does what a heading would**, and costs no line of copy and no
  translation. Macros sit 10px under the hero, so the hero and the split it is
  made of read as one block; the limits are pushed off with 12px and a rule. That rule is a `::before` inset by 2px, **not** a `border-top`: `.rail`'s
  `margin: -2px` has pushed the border box past the card's content on each side,
  so a border would draw a hairline wider than everything it separates.
- **Water is not on the ladder, so it goes under it.** It is not food, no meal
  carries it, it is logged through a different tool, and it is the only metric on
  the strip that never opens the drawer — ranking it among the nutrients puts it
  on a scale it is not standing on. Last, then, and shaped differently: nothing
  else on the strip is a bar, so it is legible as a different _kind_ of thing
  before a word of it is read, and its wash — the same left-to-right ramp every
  tile carries — becomes a glass filling across the whole card instead of a
  swatch. 8px above it rather than the levels' 4-6px: it opens a block rather
  than closing one.
- **A second register: the fill.** `.r-limit` sets `--wash-scale: 0.62`, so the
  whole group paints at 62% of its tuned strength. Size alone left level 3 close
  to level 2 on a narrow card, where its columns are also _wider_ (two up against
  three) — the tier that should recede was holding the most area. **Scaled, never
  redeclared**: a plain `--wash-mix` on the group would throw away the per-hue
  tuning (§3) and put the nine series back at a 2.4× ΔL\* spread inside the one
  place they sit side by side. Quieting a wash only adds contrast headroom, so
  every measured ink floor still holds.
- **A breach is never quiet.** `.r-limit .chip.over` takes `--wash-scale` back to
  1, so anything past its ceiling promotes itself straight out of the level it is
  sitting in. That is the whole point of ranking these last: a metric that is fine
  may be read last; one that is not, may not. The old layout kept the same rule by
  physically hoisting a breached limit onto the visible rail — here the tile stays
  where its role puts it and gains the weight instead.
- **What the levels are NOT made of: the border.** Borderless-and-recessed is
  already this system's mark for `.chip.static` — "data, not a control" — so
  quieting level 3 by taking its pill away would tell a user that four tappable
  metrics cannot be tapped. Every level keeps the species language it had; only
  its scale changes.
- **The chevron stays vertically centred**, on every tile at every level — §3's
  base rule (`grid-column: 2; grid-row: 1 / -1; align-self: center`), untouched.
  It was briefly pinned to the label's row here to hand the figure the chevron's
  column back, and that was the wrong side of the trade: it is one affordance,
  and a control sitting top-right on three tiles and mid-right on the four under
  them reads as two kinds of tile for a reason that is really just column
  arithmetic. The width it costs is bought out of the insets instead (above).
  **Both tiers take symmetric vertical padding** for the same reason: the chevron
  centres in a grid area spanning both rows, so the flat rail's extra bottom
  pixel — an optical correction under a figure with no descenders — puts it half
  a pixel high, which is a whole device pixel at 2x on the one element whose job
  is to look aligned.

**It is a flag, and it is temporary.** Four widgets share this strip and they are
being moved one at a time — `nutrition-summary` is the pilot; the others still
render the flat rail, byte-for-byte as before, because `railOf("")` emits
`<div class="rail">` with no modifier at all. Delete `opts.tiers` (and the `if` in
`macroPanel`) once every caller passes it.

### `.chip` — six species

A pill with a 1px border on a `--panel` fill — the site's universal "control" shape
— carrying a colour dot, the metric's name, its value, and a chevron:

```html
<button
    class="chip c-pro"
    type="button"
    data-macro="protein_g"
    aria-expanded="false"
    aria-controls="macro-drawer"
    aria-label="Protein 148 g, of 160 g, 12 g left. Show the meals that contributed."
    style="--w:92.5%"
>
    <span class="dot"></span><span class="k">Protein</span
    ><span class="v">148<span class="u">g</span></span
    ><span class="chev">…</span><span class="dcap">of 160 g · 12 g left</span
    ><span class="fill anim"></span>
</button>
```

| species                                                         | what it is                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **disclosure** — `<button>` + `aria-expanded` + `aria-controls` | **opens the drawer.** Carries the `.chev` chevron, which rotates 180° when open                                                                                                                                            |
| **toggle** — `<button>` + `aria-pressed`, **no chevron**        | **selects a chart series and nothing else** (trends' whole rail). A different species, not a variant                                                                                                                       |
| `.chip[aria-expanded="true"]` / `[aria-pressed="true"]`         | **selected** — a tint in the chip's own `--c` plus an inset ring. Both attributes are styled together, so selection looks identical whichever species it is                                                                |
| `.chip.over`                                                    | **past a ceiling.** Reassigns `--c` to `--over`, so the dot, the wash and the hairline all turn from one line. The non-colour half is the FIGURE, which prints against its limit ("58.2/45 g"), plus the caption's wording |
| `.chip.static` (a `<span>`)                                     | **data, not a control** — borderless, recessed onto `--bg2`, no chevron. Not a disabled button: the contrast between a bordered pill and a recessed one is what makes tappability obvious without reading either           |
| `.chip.ghost`                                                   | **the hint**, as the rail's last chip: dashed, `data-macro-hint`, a pointing-hand icon and "Tap a metric for the meals behind it"                                                                                          |

**The disclosure and the toggle are two species, and conflating them was a real
a11y defect.** `tapAttrs` used to write `aria-expanded` onto every interactive
chip, so all eight of trends' chips announced themselves collapsed/expanded while
that widget renders no drawer element at all — "expanded" with nothing to find, and
the effect that did happen (the chart re-stroking) never announced. A chip that
only re-strokes the chart now emits `aria-pressed`, exactly as `.seg` already does,
and `chipMarkup` withholds the chevron from it for the same reason in the visual
half: the chevron is the disclosure affordance and promising a panel that does not
exist is the same lie in pixels. Both species keep the bordered pill, which is what
already separates a control from the borderless `.static` one. `aria-controls` is
emitted only alongside `aria-expanded`; `macroToggle` reads whichever attribute the
chip carries (`tapStateAttr`), so exclusivity works identically on a rail with no
drawer.

`.chip.static` being a `<span>` rather than a `<button>` with `role` toggled is
deliberate: a static chip must not be focusable, must not announce itself as a
button, and must keep its children in the accessibility tree.

**There is no warning glyph, deliberately.** A `.wmark` triangle used to take the
dot's slot on a breached chip; the owner removed it — a rail of metrics reports
what was eaten, it does not raise alarms, and a chip is never a different SHAPE
from its neighbours. What replaced it is INFORMATION rather than an alarm: every
tile prints its figure against its goal, so "58.2/45 g" states the breach in
digits and survives greyscale on its own. Do not reintroduce the glyph.

`.chip.ghost` is the one chip allowed to wrap (`white-space: normal`,
`flex: 0 1 auto`, `min-width: 0`). The sentence is long and translated into nine
languages, and a nowrap pill would be this card's only way to overflow 320px. It
sits inside the row it describes, so it costs no extra line, and `macroToggle`
hides it once a drawer is open — the instruction has been followed and the answer
is on screen.

### THE BAR IS THE CHIP

```css
.chip .fill {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2.5px;
    width: var(--w, 0%);
    background: var(--c, var(--acc));
    opacity: 0.85;
}
```

A 2.5px fill hugging the pill's bottom edge, clipped by the 999px radius so its
ends curve with it. **This is the single biggest compactness win in the redesign:
progress costs zero extra rows.** Its width changes no layout (absolute, inside
`overflow: hidden`), which is what makes it the one animatable size in the system.

The final width is always the declared one; the `fillIn` keyframe only decorates
the arrival, and `macros.js` withholds the `.anim` class under reduced motion. A
cancelled animation can therefore never leave a bar sitting at zero.

### `.dcap` inside a chip is visually hidden, on purpose

The chip's goal caption has no visible slot — the drawer is where it is read. It
stays in the DOM because a **static** chip is a `<span>`, so its children are not
presentational and a screen reader still hears "Protein 148 g, of 160 g · 12 g
left", exactly what the old always-visible caption gave it. Inside an interactive
chip it is inert, and the chip's own `aria-label` carries the same words.

## 4. The hero and the gauge

Calories, always visible in every state of every widget. `.hero` is a `<button>`
when meals sit behind it and a `<div>` otherwise, so its reset suits both.

```html
<button class="hero c-cal" type="button" …>
    <svg
        class="gauge"
        width="48"
        height="48"
        viewBox="0 0 40 40"
        role="img"
        aria-label="Calories 2,076 kcal"
    >
        <circle class="gt" cx="20" cy="20" r="17"></circle>
        <circle
            class="ga anim"
            cx="20"
            cy="20"
            r="17"
            transform="rotate(-90 20 20)"
            stroke-dasharray="106.81"
            stroke-dashoffset="8.01"
        ></circle>
    </svg>
    <span class="hmain">
        <span class="hval">2,076<span class="hgoal">/ 2,200</span></span>
        <span class="hlab">Calories today</span>
    </span>
    <span class="hsub">124 kcal left</span>
    <span class="chev">…</span>
</button>
```

**The gauge's numbers.** `r = 17`, so `2πr = 106.81` and
`stroke-dashoffset = 106.81 × (1 − fraction)`. A viewBox of 40 with
`stroke-width: 5` puts the outer edge at 19.5, so nothing clips and the SVG needs
no overflow escape. Same two-step contract as the chip underbar: the real offset is
the attribute, `gaugeIn` only sweeps up to it.

**There is no centre text.** The figure sits 11px to the right at three times the
size, and two copies of one number in a 48px span is exactly the redundancy this
layout exists to remove. The percentage moved to the drawer caption, where it is
the thing being asked for.

**`.hsub` is the pill that says what to do about it** — the delta, or, with no
goal, "no goal set". That matters: a lone figure beside an empty gauge otherwise
reads as a widget that failed to load. `.hsub.over` swaps the accent tint for an
`--over` one; `.hsub.mute` is for a delta with no target to judge it by.

**`.hero.flat` drops the gauge** (trends). A range average against a daily goal is
not a "how full is today" question, and the row loses 18px; the `.hsub` pill then
centres instead of hugging the top.

`.hval .hgoal` is the "/ 2,200" tail, and `.hval .u` is a unit riding the figure
itself (weight-trends' "77.0 kg"). `.hlab` is the mono eyebrow naming the period
the figure covers — the one caption that genuinely differs between widgets.

**`.hlab` wraps, never ellipsises, and that rule belongs in `chip.css`.** It lived
only in nutrition-summary's own `<style>`, so goal-progress, meal-logged and trends
cut their calorie label in most locales at ≤ 360px — Spanish trends read "PROM. DE
14 DÍAS · TODOS …", English goal-progress "CALORIES · 10…" at 320px (layout audit).
It takes a second 13px line instead, and only at the widths that would have cut it.
The shared rule uses `overflow-wrap: anywhere` rather than the template's original
`overflow: visible`: an unbreakable German compound (TAGESDURCHSCHNITT) painted
~31px outside its own box over whatever shared the line. This is the general
lesson — **a fix made in one template is a fix the other three do not get.**

**Over-goal convention, everywhere:** the breached element reassigns `--c` to
`--over`, so everything keyed on it — dot, wash, ring, sparkline stroke, hairline —
turns together rather than in parts. The non-colour half of the cue is the figure
printed against its limit ("58.2/45 g"), plus the caption's wording. Whatever
carries the state must carry ALL of it: an element that sets its own `.c-*` role
class outranks the reassignment, which is how a breached metric once rendered red
on its tile and green in the drawer it opened.

## 5. `.more` — the section-sized disclosure

A full-width 32px bar on `--bg2`, for a disclosure that is a whole section rather
than one chip: the strip's collapsed limits, goal-progress's weight row, and the
drawer's own overflow line.

```html
<button
    class="more"
    type="button"
    data-weight
    aria-expanded="false"
    aria-controls="weight-drawer"
>
    <span class="dot c-acc"></span>Weight<span class="mv">78.4 → 75.0 kg</span>
    <span class="chev">…</span>
</button>
```

`.more .chev` takes `margin-left: auto` — **unless** a `.mv` value already took the
free space, in which case the chevron sits one gap away from it rather than
splitting the row a second time (`.more .mv ~ .chev { margin-left: 0 }`).
`.drawer .more` is the same control at 28px on a transparent ground, because inside
the drawer it is a footnote, not a section head.

### `.more.mlimits` — the collapsed limits row

The strip's own use of it: `aria-controls` the limits `.rail`, and a `.mlab` that
**names what it hides** — "Sugar · Caffeine · Fiber", joined from the already
translated `macroLabel()` values, so a collapsed metric is still named on screen
and this costs no new i18n copy. `.more.mlimits .chev` gives up the auto margin, so
the chevron follows the label rather than being pushed to the far edge of a row
whose content is a list.

Two rules make collapsing the limits safe, and both live in `macroPanel`:

- **A breached limit is never hidden.** Anything over its ceiling is hoisted onto
  the always-visible rail. Everything else here is a height trade; this is not.
- **Two is the minimum worth hiding**, measured rather than assumed. A `.more` row
  costs 32px and a chip row 30px plus a 6px gap, so tucking a single chip that
  would have shared a row with its neighbour buys nothing and costs the whole 32 —
  goal-progress, which breaches three of its four limits and leaves only fiber to
  tuck, measured 32px **taller** at all four widths under an unconditional rule.

`limitsToggle` closes any open chip inside the rail before collapsing it, through
the normal `macroToggle` path: otherwise the drawer would go on showing a breakdown
whose chip is no longer on screen, with a ✕ that has nowhere to hand focus back to.

There are exactly **three** disclosure affordances and only three: the chip
(inline), the `.more` row (section-sized), and the drawer both of them open into.

## 6. The drawer

One per card, one open at a time, always directly under the rails.

```html
<div class="drawer" id="macro-drawer" tabindex="-1" hidden>
    <div class="dhead">
        <span class="dot c-pro"></span>
        <b class="dname">Protein</b>
        <span class="dcap">of 160 g · 12 g left</span>
        <button
            class="dx"
            type="button"
            data-macro-close
            aria-label="Close breakdown"
        >
            …
        </button>
    </div>
    <ul class="dlist c-pro">
        <li>
            <span class="dv">42.0<span class="u">g</span></span>
            <span class="dn">Grilled chicken salad</span>
            <span class="ds">lunch</span>
        </li>
        <li class="dmore">+ 3 smaller meals</li>
    </ul>
</div>
```

`.dlist li` is a three-column grid (`54px minmax(0, 1fr) auto`): the value
right-aligned in `--ink`, the description ellipsised, the meal type or date last.
`.dmore` (the capped list's tail count) and `.dempty` are the drawer talking about
itself rather than a row of data, so neither takes the grid.

**The caption is the whole reason the per-nutrient bars could go away**: `.dcap`
carries the goal and the distance to it, in the words `macroBits` already produced,
and turns `--over` on a breached ceiling.

**`.dv` is NOT painted in the series token.** It was, and on the drawer's `--bg2`
that failed AA on seven of nine nutrients in light mode — 1.71:1 for sugar, 1.47:1
for its `.u` unit under an `opacity: 0.7` on top. The colour identity is carried by
the `.dot` in `.dhead`; the numbers are read in `--ink`, and the unit is `--ink3`
real text ranked by size, never an alpha on top of a token. `.dcap.over` is
likewise `--ink2` at 700 rather than `--over` text, which measured 3.98:1 on
`--bg2` (`--over` is AA-corrected against `--panel`, not against this surface) —
the breach is carried by the wording already in the string ("13.2 g over") and by
the `--over` the head's own `.over` class reassigns. `.dx` is **24×24**, the WCAG 2.2
SC 2.5.8 floor, not 22.

**FOCUS is what reports the open, and there is no `aria-live`.** The region carried
`aria-live="polite"` and never announced once: the content is written while the
drawer is still `hidden` (`display: none`), so the mutation happens outside the
accessibility tree, and re-ordering the writes only moves the race rather than
closing it. An announcement that never fires is worse than none. So the drawer is a
plain disclosure region with `tabindex="-1"`, and both ends of the contract are
observable in `document.activeElement` rather than hoped for:

- **On open**, `macroToggle` calls `drawer.focus({ preventScroll: true })`. The
  drawer is not adjacent to the chip that opened it — it sits below the whole rail
  — so "expanded" alone leaves a keyboard or screen-reader user to go hunting.
  `preventScroll` because a `focus()` inside a chat iframe can otherwise scroll the
  host page out from under the conversation.
- **On close**, the `[data-macro-close]` handler focuses the originating chip
  **before** `macroToggle` empties the drawer. Closing destroys the ✕ that has
  focus, and the browser then drops focus on `<body>` — the a11y audit measured
  exactly that. The chip is still in the DOM, and handing focus back to the trigger
  is the disclosure contract.

The chip's `aria-expanded` + `aria-controls` is what names the relationship.

**The same contract binds every drawer, not just this one.** `goal-progress`'s
weight drawer is a second instance of `.drawer` — new in this redesign, opened by a
`.more` row rather than a chip — and it shipped with neither half: it carried the
same never-firing `aria-live="polite"`, had no `tabindex`, and its ✕ dropped focus
on `<body>` under a real click and a real Enter. It now matches `macro-drawer`
exactly: `tabindex="-1"`, `weightToggle()` focuses it on open (**after** it
cross-closes any open chip, since `macroToggle` emptying the macro drawer would
otherwise steal the focus a moment later), and on close it focuses the `.more` row
**before** setting `hidden`. That last step is guarded on
`drawer.contains(document.activeElement)` rather than done unconditionally, because
`weightToggle(false)` is _also_ the cross-close a chip fires — focusing the weight
row there would yank focus off the chip the user just activated. **Copy that guard
along with the focus call**: a disclosure hands focus back to its trigger only when
it is the thing losing focus.

**ANIMATE NOTHING THAT CHANGES LAYOUT HERE** — not `height`, `max-height`, `margin`
or `padding`. `bridge.js` measures `documentElement` at `max-content` on a
`ResizeObserver` tick, so an animated size turns that into a 60Hz `size-changed`
storm and a lurching iframe. `rise` is `opacity` and `transform` only: the observer
fires once on the `hidden` toggle, reads the settled height, and the animation plays
inside an already correctly sized frame. The drawer is made visible by the `hidden`
attribute, **never** by the animation, so a cancelled one can never hide content.

## 7. The segmented control (`.seg`)

The 7/14/30-day toggles in trends and weight-trends. Dawn's universal thumb formula
— `--bg2` track, `--panel` thumb, `--seg-shadow` — verbatim. It replaces the
accent-filled active pill the widgets used to have, which was the one place they
contradicted the site's own control.

```html
<div class="seg" role="group" aria-label="Trend window">
    <button
        type="button"
        data-range="7"
        aria-pressed="false"
        aria-label="7 days"
    >
        7
    </button>
    <button
        type="button"
        data-range="14"
        aria-pressed="false"
        aria-label="14 days"
    >
        14
    </button>
    <button
        type="button"
        data-range="30"
        aria-pressed="true"
        aria-label="30 days"
    >
        30
    </button>
</div>
```

Selection is `aria-pressed`, not a class — the state and its styling are the same
fact. It carries `margin-left: auto`, so dropping it into `.chead` puts it where
`.cmeta` would otherwise sit; `flex: none` keeps it from being squeezed.

**Interactivity:** buttons carry a `data-*` value; delegate the click on a container
that survives re-renders (`#root`), read the value, update state, re-render. For a
range/filter toggle, **prefer sending a superset of data and slicing client-side**
over re-calling the tool — instant, and it needs no host tool-call support.

## 8. The chart grammar (`shared/chart.css` + `shared/svg.js`)

One grammar, three instances (calories, a switched nutrient series, weight): a
2.5px line, a fading area under it **on zero-based charts only**, an optional
dashed goal line, a single dot on the last point, and HTML labels underneath.

The SVG is `viewBox="0 0 480 52"` with **`preserveAspectRatio="none"`** and a fixed
52px CSS height, so the chart stretches horizontally and never grows vertically —
card height stays independent of card width. Everything else follows from that:

- **`vector-effect: non-scaling-stroke` is mandatory on every stroked element**,
  not decoration. `preserveAspectRatio="none"` scales x and y by different factors,
  which would stretch the stroke with them and leave near-vertical segments visibly
  thinner than near-horizontal ones — worse the wider the card gets.
- **Every label is HTML (`.cfoot`), never `<text>` inside the SVG.** SVG text would
  be stretched with the viewBox, cannot ellipsise, and ignores the flex layout that
  pins the two ends to the card's edges.
- **`.chalo` is a `--panel` halo under the last point**, so the marker stays legible
  where the line doubles back under it. It is the only marker: it says which end is
  now.
- **`.cempty` is the same 52px box** when there is nothing to draw, so a range
  toggle never makes the card jump.

`.cline` reads `var(--c, var(--cal))` and has a `stroke` transition, so re-strokes
cross-fade: selecting a chip changes the wrapper's role class and nothing re-parses
a colour.

### `.carea` — the wash under the line, and where it must not go

`.carea` is the filled region between the series and the box's floor, painted from
a per-chart `<linearGradient>` whose two stops are `.cstop-a` (the series colour at
0.2 alpha) and `.cstop-b` (the same colour at 0). Markup order is **goal → area →
line**, so the dashed reference reads as a line _through_ a wash rather than as a
second series running beside one: on a near-flat series the two hairlines otherwise
sit two or three viewBox units apart and merge into one thick smudge.

Two details are load-bearing. The stops set `stop-color` as a **CSS property**, not
the SVG presentation attribute, so `var(--c)` resolves against the `.cwrap` role
class the gradient inherits from — which is why each chart carries its own
`<linearGradient>` with its own id (`chAreaMarkup` in `shared/svg.js`, fed by
`chArea(pts)`). And the gradient's coordinates are `objectBoundingBox`, so the fade
spans exactly the filled shape however tall the series is.

**The area is for zero-based charts only, and that is a correctness rule, not a
taste one.** `chart.css` says the same thing next to the rule. A zero-based axis
(calories, and whichever nutrient series a chip has switched the chart to) has a
real floor, so filling down to it draws a quantity that exists — and it is what
makes the zero baseline visible at 52px, where an unfilled near-flat line at 80%
height leaves the card's largest block empty and reads as a rendering fault.
`weight-trends` is excluded: its y domain is the data's own min/max padded by 18%,
so the floor of its box is an arbitrary weight a few hundred grams under the
lightest weigh-in. Filling to that would draw a quantity nobody logged and invite
the wash to be read as a total. **A data-scaled chart gets a line and nothing
else** — no `.carea`, no `<linearGradient>`.

`shared/svg.js` is the geometry, and it is **pure string math** — no DOM, no
measurement, no reads off an element — so it evaluates where `document` is
undefined and a chart can be built inside the same `innerHTML` string as everything
else rather than in a second post-paint pass. `chPoints(vals, yMin, yMax)` maps
values to `[x, y]` pairs (a single value is centred rather than pinned left, so one
weigh-in renders as a dot in the middle of the box), `chPath(pts)` joins them at one
decimal, and `chY(v, yMin, yMax)` gives the y for the goal/target line. The
coordinate space is the viewBox, never CSS pixels, which is exactly why nothing in
there needs to know how wide the card is.

**Zero-based vs data-scaled Y is the caller's decision.** Quantities that start at 0
(calories, macros) use a zero-based axis. A metric that hovers in a narrow band
(body weight) must scale to the data's own range plus padding instead — a
zero-based weight chart flattens the trend into a straight line. See
`weight-trends.html`.

## 9. Icons (`shared/icon.js`)

`icon(name, size)` returns an inline `<svg class="ic">` string. Every path is drawn
on the same 16-unit box and scaled by `width`/`height`, so a 9px chevron and a 16px
warning triangle are one drawing at two sizes.

| name    | used for                                                     |
| ------- | ------------------------------------------------------------ |
| `chev`  | every disclosure chevron (`.chev` rotates it 180° when open) |
| `x`     | the drawer's close button (`.dx`)                            |
| `check` | a success notice                                             |
| `warn`  | `notice-warn`                                                |
| `info`  | `notice` (neutral)                                           |
| `up`    | a rise in a metric                                           |
| `down`  | a fall                                                       |
| `file`  | the drop zone                                                |
| `point` | the pointing hand on the `.chip.ghost` hint                  |

### `GLYPHS` — the nutrient set, and it is **filled**

`glyph(name, size)` is the second table in the same file, drawn on the same
16-unit box but with `fill: currentColor` and no stroke (`.gi`, base.css). It
replaces the colour dot on every tile of a tiered strip, and the `.c-*` role
class on an ancestor colours it exactly as it coloured the dot.

Note the emitted `width`/`height` are a **fallback**: `.gi`'s CSS overrides
them, which is what lets the size step at a breakpoint without the emitter
knowing anything about width.

| glyph       | metric   | what makes it legible at 13px        |
| ----------- | -------- | ------------------------------------ |
| `flame`     | calories | a side tongue, so it is not a drop   |
| `drumstick` | protein  | a thin diagonal shaft                |
| `bowl`      | carbs    | wide, flat-bottomed                  |
| `avocado`   | fat      | a hole (`evenodd`) — reads as a ring |
| `droplet`   | water    | owns the teardrop                    |
| `cube`      | sugar    | the only square                      |
| `glass`     | alcohol  | stem and foot                        |
| `cup`       | caffeine | a handle (`evenodd`)                 |
| `leaf`      | fiber    | a stem past the blade                |

**Filled, not stroked, and that is measured.** A series token is weak as ink in
light mode — `--cal` is 2.06:1 against the tile, `--sug` 1.98, `--car` 2.54 — so
a 1.75px stroke in one of them at 13px is barely there. A filled silhouette
carries the ink density of the 6px dot it replaces. It also keeps the two
registers apart: `ICONS` is UI affordance drawn in line, `GLYPHS` is content
drawn as a shape.

**Draw for 13px, not for 48.** The first pass gave calories a flame, water a
droplet and fiber a leaf, and at 13px all three collapsed into the same
teardrop; protein-as-drumstick read as a lollipop and carbs-as-bread-slice as a
rounded blob. Only a silhouette with a **hole, a notch or a protrusion** stays
legible that small — hence the table's third column, which is the actual design
constraint. Preview a candidate at 13px beside its label before believing it.

**It takes a column, and centres across both rows like the chevron** — a mark
sitting at the top-left beside a control centred at the right reads as two
systems on one tile. So the tiered tile is three columns: glyph,
label-and-figure, chevron.

**But only where every tile can pay for it.** On the label's row a glyph costs
that row alone and the figure still spans beneath it; spanning both rows it
costs the **figure** its width too, and the figure may never be cut. One
breakpoint for the whole strip, set by the tier that can afford it last: macros
are three up and clear their 65px figure from ~440, while the limits clear it at
any width two up — but fold to **four** up at 460, where a 92px tile minus a
centred glyph left `"187/400 mg"` 20px short. Two breakpoints would have fixed
that arithmetically and produced exactly what this change removes: macros
centred beside limits still sitting high, on one card. The strip switches
together at **560px**; below it the glyph stays on the label's row, bigger but
not centred. Same markup at every width — only the placement moves.

**Sizes**: 17px (macro/water) and 15px (limits) inline, stepping to 20/17 once
centred, and 18px in the drawer head. The 13px it shipped at was legible in
isolation and barely present on the card, which is the difference between
reading a glyph and noticing one.

**The metric names a drawing, never the reverse.** `MACROS[].glyph` is
`"drumstick"`, not `"protein"` — the same indirection as `color: "c-pro"` — so
the shape table and the metric table stay independent and no emitter learns
which shape belongs to which nutrient. `macroMark()` is the one decision point,
called by both the tile and the drawer head: they are on screen together
whenever a breakdown is open, so a card that drew one as a shape and the other
as a dot would show one metric two ways at once. A metric with no glyph, or a
widget not yet tiered, falls back to `.dot` unchanged.

**They are decorative.** Every tile names its metric in words beside the glyph,
so this adds a **shape channel** to a card that otherwise separates its metrics
by hue alone — the accessibility win — without becoming information that has to
carry 3:1 on its own.

**Not a sprite, and not emoji for everything.** A `<symbol>` block would have to
live outside `#root` (every `render()` replaces `#root.innerHTML` wholesale), so
templates would own DOM in two places instead of one, and `<use href="#x">`
fragment resolution has enough host-dependent edge cases inside a sandboxed
opaque-origin iframe that a silently blank icon is a real risk. Nine paths is ~400
bytes; the plumbing would cost more than the duplication.

Every icon is `aria-hidden`: an icon here is always inside a control whose own
`aria-label` already says the thing.

## 10. The macro strip (`macroPanel` — `shared/macros.js`)

The intake-vs-goal view shared by `nutrition-summary`, `goal-progress`,
`meal-logged` and `trends`. It is **not a card**: it is one block a widget drops
inside its single `.card`, under whatever top matter that widget has. In order: the
calorie hero; **one** visible rail (protein / carbs / fat, then water, then any
limit currently breached, then the ghost hint as its last chip); the
`.more.mlimits` row; the collapsed limits rail behind it; and the one drawer they
all open into.

```js
// vals / goal: objects keyed by calories, protein_g, carbs_g, fat_g, fiber_g,
//   sugar_g, alcohol_g, caffeine_mg, water_ml (a day's totals, a range's
//   averages, a slice…). caffeine_mg is the one key not in grams — the unit is
//   in the name at every layer down to the DB column for exactly that reason.
// wording: { under: "left" | "under", over: "over" }. FLOORS only; a ceiling
//   always reads "under" / "over" / "at limit".
// meals:   optional per-meal breakdown rows → every chip some meal actually
//          contributed to becomes tappable, the limits included.
// opts:    { drinkUnit, calLabel, divided, flatHero, chartKeys, onSeries }
root.innerHTML = `
  <div class="card c-cal">
    <div class="glow"></div>
    <div class="chead">…</div>
    ${chart}
    ${macroPanel(vals, goal, wording, meals, opts)}
  </div>`;
```

Requires `fmt(n, decimals)`, `esc(s)`, `icon(name, size)` and `T` in scope.

### Layout is by `role`, never by a key list

**Every `MACROS` entry declares a `role`, and the strip lays itself out from that**,
so a new nutrient lands exactly where its role says and an entry with no role (or
an unknown one) renders nowhere at all rather than silently sprouting a fourth
macro chip.

| role    | where it renders                                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| `cal`   | the hero. **Never a chip** — it is the one number nobody should have to go looking for                                |
| `macro` | a chip on the visible rail (protein, carbs, fat)                                                                      |
| `limit` | a chip behind the `.more.mlimits` row — **unless it is over its ceiling**, which hoists it onto the visible rail (§5) |
| `bar`   | a chip on the visible rail, after the macros (water), and only when the metric was actually tracked                   |

`TOP_LEVEL_MACRO_KEYS` and `dayHasData()` are derived from `cal`, `macro` and `bar`
the same way, so "was anything logged this day?" (which trends uses to count logged
days) stays a question about top-level metrics only.

**`MACROS[].color` is a role class, not a colour** (`"c-pro"`, not a hex or a
`var()`), and no emitter in the file ever writes a colour. `mealList` still puts the
role class on each `<li>`, but the drawer's numbers no longer read `--c` from it —
see §6 — so inside the drawer the tint is carried by the one dot in `.dhead`.

### Fiber and sugar are limit chips, not children of carbs

They used to be revealed inside the carbs disclosure, where nobody found them. The
limits are where "the metrics you stay under" belong, and sugar is one outright.
Fiber is a **floor**, not a ceiling — but it is _read_ the same way ("21.8, of
30 g"), so it shares the rail's idiom while keeping floor semantics: no `direction`,
so passing its goal is never flagged `--over`.

### `signal` encodes what a `0` means

- **`signal: "null"`** (alcohol, caffeine) — the payload distinguishes
  never-recorded (`null`) from a recorded `0`. The null is the entire display gate,
  and a real `0` always stays on screen. `alcohol_g: null` means alcohol tracking is
  off; `caffeine_mg: null` means nobody ever recorded any (caffeine has **no**
  profile opt-in by design). See `totalsPayloadOf` in `src/mcp.ts`.
- **`signal: "data"`** (fiber, sugar) — `TOTALS_ITEM` types these as `z.number()`,
  so a day that predates the column is indistinguishable from a genuine zero. The
  chip is earned by a value above zero **or** by a goal of the user's own.

What the gate prevents either way is a "0 mg of 400 mg" line invented for someone
who never went near the limit — the same suppression the model-facing text applies
(`recordedGoalLine` in `src/mcp.ts`). A metric that _is_ shown but reads zero says
so in words (`.chip .v .none` → "none logged"), because a `0` in the figure slot
looks like a measurement.

Water carries the same `signal: "data"`, and for the same reason — `water_ml` is a
plain number, so a `0` is indistinguishable from a day nobody logged any. It was
gated on `> 0` alone, with the test inlined in `macroPanel` rather than asked of
`metricShown`, and the two drifted exactly as duplicated gates do: someone with a
2.5 L target who had not yet drunk anything saw no water on the card at all —
the one reading where the goal is the whole point was the one reading dropped —
while the same person's untouched fiber goal still earned a tile. **A goal is the
user saying they track this**, so a 0 against one is a real reading and prints as
one ("0 / 2.5 L"). One gate, `metricShown`, asked of every metric whose reading
might be absent rather than zero.

### Wording rules (pinned by `macros.test.ts`)

- `direction: "ceiling"` (sugar, alcohol, caffeine) mirrors `GoalDirection` in
  `src/mcp.ts`. A ceiling turns `--over` when exceeded; a floor does not — passing
  a fiber goal is the goal being met, not a warning. **Calories is the one
  addition** (`focusOver` in `macros.js`): it declares no `direction`, but a
  calorie goal is read as a ceiling by everyone who sets one, and the focus panel
  is the only place it appears. The tiles keep the ceiling-only rule.
- **A ceiling never says "left."** Staying under a limit is not a budget to spend,
  and "12 g left" is meaningless over an averaged window; the vocabulary is
  `under` / `over` / `at limit`, matching "Days over limit" in the trends text.
  `wording` tunes the **floor** case only.
- A limit chip's caption is the limit itself (`limit 45 g`). The distance to it
  joins only when that is the thing to act on: a breach (`limit 45 g · 16 g over`)
  or exactly meeting it (`at limit`). "at limit" is a state the `--over` colour
  cannot express at all, because `over` is `pct > 100` and exactly at a ceiling
  would otherwise read as comfortably under it — which is why `macroBits` returns a
  separate `atLimit` boolean rather than making callers string-match a localized
  caption.
- A ceiling target of **0** is a real limit and is rendered as one ("none today" is
  the most likely alcohol limit there is): any amount is over it, and the percentage
  is pinned rather than left to divide into Infinity. A **floor** of 0 still means
  "no goal set".
- Alcohol's caption leads with a drink count (`gloss: "drinks"`):
  `0.9 US drinks · limit 20 g`, in the user's unit (`opts.drinkUnit`, `us` = 14 g
  ethanol, `uk` = 7.893 g, mirroring `src/alcohol.ts`). No other metric has a
  second unit — caffeine is milligrams alone, because there is no second unit
  anyone thinks in.
- **Water renders in litres from the millilitre payload, and the conversion is ONE
  decision point.** `water_ml` is millilitres because that is what a glass is
  logged in, but a day's intake is spoken in litres and "2,100 ml" is three more
  glyphs for no more meaning. The decision lives on the `MACROS` entry as
  `display: { unit: "L", per: 1000, decimals: 1 }`, and **everything that renders a
  value goes through `macroNum(m, v)` / `macroUnit(m)`** (or `macroAmount(m, v)` for
  the two together) — the chip figure, every caption `macroBits` builds, the
  accessible name, the gauge label, **and any chart foot a template draws**. A
  metric with no `display` falls through to `fmt(v, m.decimals)` + `m.unit`, so the
  helpers are always the right call and never a water special case.

    This is a rule because it was a bug six times over: the chip printed "2.1 L"
    while its caption said "of 2,500 ml · 400 ml left", its accessible name said
    "Water 2,100 ml" and the chart foot two lines below it said "Water avg
    2,100 ml" — three units for one metric on screen at once, and a **WCAG 2.5.3
    label-in-name** failure, since the visible "2.1 L" was not contained in the
    accessible name. A later round fixed the chip and left the chart feet, and the
    same contradiction came straight back. If you are writing `fmt(x, m.decimals)`
    or interpolating `m.unit` anywhere, you are re-opening it: grep says
    `macroNum(`/`macroUnit(` are the only renderers in `nutrition-summary.html`,
    `trends.html` and `component-gallery.html`.

    Fixed decimals rather than `fmt()`'s, and that is separate: `fmt` round-trips
    through `Number()`, so a round 2 L would print "2" beside a "2.5 L" goal.

- `calLabel` names the period the hero's figure covers, and in two widgets it names
  the **denominator**: `nutrition-summary` says "Daily avg · logged days", `trends`
  says "14-day avg · all days". Same macros, different number (issue #70) — that
  label is the only place the difference is stated on screen.

### A chip is a control when it opens meals, selects a series, or both

`macroHasDetail(m, ctx)` asks whether any meal contributed a positive amount of
that metric — per chip and data-driven, not per kind, so a sugar chip is a button
on the same terms a protein chip is, while an alcohol chip reading "none logged"
stays static rather than opening an empty list. Water is never a button and needs
no special case: water is logged separately, so no meal row carries `water_ml`.

`macroOnChart(m, ctx)` is the second half, and it is what makes trends work: its
payload carries no meals at all, so every chip there would be static — except that
it passes `opts.chartKeys` and `opts.onSeries`, which turn each chip into the
chart's **series selector**. Same rail, different job, no branch in `macros.js`.
The coupling is an explicit ctx field rather than an ambient global specifically so
a test can hand in a spy and so a template that forgets it gets a strip that
discloses meals and nothing else, not a silent no-op.

**A button makes its children presentational**, so the gauge's `aria-label`, the
metric name and the goal caption all drop out of the accessibility tree. An
interactive chip therefore carries the whole lot in its own name — **value first,
action last**: _"Carbs 205 g, of 220 g, 15 g left. Show the meals that
contributed."_ (`tileLabel`; `·` becomes a comma because screen readers either skip
it or say "middle dot"). Where the chip only re-strokes the chart, `chipLabel`
swaps that closing sentence for `T.macros.alsoChart`; where it does both, it keeps
the first and adds the second. Do not shorten the name back to the action alone — a
static chip reads out its numbers, and the interactive one beside it must not read
out fewer.

`aria-controls` is emitted **only** when the drawer actually exists: a chart-only
chip opens nothing, and pointing at an absent id is worse than saying nothing.

### `T.macros` is the strip's copy namespace — including `mealTypes`

Everything the strip writes comes out of `T.macros` (`src/copy/widgets.ts` plus one
`widgets.<locale>.ts` per locale): `labels` (the metric names), the wording leaves
(`noGoalSet` / `atLimit` / `floorUnder` / `ceilingUnder` / `over` / `limitPrefix`),
`tapHint`, `closeBreakdown`, `alsoChart`.

**`macros.mealTypes` is the newest of them** — `{ breakfast, lunch, dinner, snack }`,
plain strings with no plural forms, because a meal type never carries a count. It
exists because `meal_type` was the one thing on meal-logged's `.csub` still coming
out of the payload raw, so a fully translated Japanese confirmation read
"7月15日 · **lunch** · …" — and the layout round had just moved the type to the
**front** of that line, making the untranslated word the second thing a non-English
reader saw. `mealTypeLabel()` in `meal-logged.html` looks it up **case-insensitively
and falls back to the raw stored string**: the server's enum is exactly those four
(`log_meal` / `update_meal` in `src/mcp.ts`; `bulk_import_meals` coerces anything
else to `snack`), but a row written before that enum, or by some other path, must
still show its own word rather than drop out of the line that _is_ the
confirmation.

### Pinned hooks

`data-macro`, `data-macro-panel`, `data-macro-hint`, `data-macro-close`, the drawer
id `macro-drawer`, and the `data-macro=… aria-expanded=… aria-label=…` attribute
order on a chip are all asserted by `macros.test.ts`. Selection is **exclusive**:
tapping another chip, or the drawer's ✕, closes whatever was open.

## 11. Form controls (`shared/form.css`)

Only `import-meals` and the dev gallery pull this in — it is the one widget surface
that is a form rather than a readout. Everything is Dawn's pill language at a denser
scale: controls are **38px, not the site's 48px**, because the map step stacks
sixteen of them inside a chat card.

| class                                            | use                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `.field` / `.field-row` / `.label` / `.hint`     | vertical field stack, inline row, caption text                                         |
| `.input`, `.select`                              | text input and dropdown; add `.invalid` for the error state                            |
| `.field-error`                                   | the message under an invalid control                                                   |
| `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm` | buttons; `.actions` wraps a row of them                                                |
| `.drop` + `.drop-input`                          | file drop zone; add `.over` while dragging                                             |
| `.notice`, `-ok` / `-warn` / `-error`            | inline banner on the card surface                                                      |
| `.steps` / `.bar` (`> span`)                     | the step rail (3px) and a running import (5px); `.slab` is the mono caption under them |

Things that are easy to get wrong:

- **`.input` and `.select` set `height` with zero vertical padding**, not symmetric
  padding — an `<input>` and a `<select>` size their text box differently and would
  otherwise not land on the same 38px line.
- **The select chevron is an inlined `data:` SVG** with a literal stroke colour. The
  sandbox CSP allows `img-src data:` only, and `currentColor` does not work inside
  `url()`, so a mid-grey that reads on both themes is used instead.
- **`.btn-primary` uses `color: var(--acc-ink)`**, not white: the accent lightens in
  dark mode, where white would fail. It deliberately drops the site's accent glow —
  inside a chat card a glow with nothing behind it reads as a rendering artefact.
- **Severity is never carried by the tint alone.** Each `.notice` variant takes a
  different icon drawing (`info` / `warn` / `x` / `check`), which is what makes them
  distinguishable in monochrome and to anyone who cannot separate the hues.
- **`.drop` is `position: relative` so the visually-hidden `<input>` stays inside
  it** — absolutely placed against the initial containing block instead, focusing it
  by keyboard scrolls the page to its top-left corner. A `<label>` is not focusable,
  so the ring that actually fires is `.drop:has(.drop-input:focus-visible)`, and it
  is its **own rule** rather than folded into the shared focus list: an engine
  without `:has()` drops an entire selector list it cannot parse, which would take
  the inputs and buttons down with it. (`.drop:focus-visible` is in the shared list
  too, as a no-cost fallback for a host that makes the label focusable.)
- **`.steps` and `.bar` are two tracks with one fill.** 3px for where you are in the
  flow (orientation), 5px for an import actually running (the subject of the
  screen). Both replaced a row of numbered pills that cost ~26px and was the one
  element in this widget that could overflow 320px.

`:focus-visible` is styled once for every control, and it is **the same treatment
`chip.css` draws** — `outline: 2px solid var(--acc); outline-offset: 2px` — not a
local variant. It used to be `outline: none` plus a 3px 35%-alpha accent shadow, on
the theory that only a box-shadow follows a 999px radius; composited, that ring
measured ~1.6:1 against its ground, far under the 3:1 SC 2.4.11 asks of a focus
indicator, which made import-meals the one widget in the system without a usable
one (a11y audit). Every current engine draws `outline` along the border radius, so
the pill shape survives. The accent border stays as a secondary cue only — at ~3.4:1
and 1px it is not load-bearing on its own.

## 12. Preview table (`shared/table.css`)

For showing rows the user must confirm before a write. `.tscroll` wraps `.tbl`;
`thead th` is sticky so column identity survives scrolling, which matters when the
table _is_ the confirmation step. `.pill` + `-ok`/`-warn`/`-bad`/`-dim` marks
per-row status; `.num` right-aligns numerics, `.wide` is the one column allowed to
wrap, `.dim` recedes a cell, and `.tmore` is the truncation footer.

**`.tscroll` sets `min-width: 0`, and that is required, not cosmetic.** A grid or
flex item defaults to `min-width: auto`, so a `white-space: nowrap` table's
min-content width otherwise pushes its column wide and drags every _sibling_ card
with it — the page then scrolls horizontally instead of the table scrolling inside
itself. If a parent is a grid, also give it `grid-template-columns: minmax(0, 1fr)`
rather than relying on the implicit auto column. This was a real bug caught by the
component gallery.

`.tscroll` also caps its own height (`max-height: 320px`) so the widget's reported
height stays bounded: a host may impose `hostContext.containerDimensions`, and an
unbounded table is simply clipped rather than scrolled.

The sticky header sits on `--bg2` rather than `--panel` so it stays legible as rows
slide under it, and its bottom rule is an `inset` box-shadow — a sticky element
ignores the collapsed border.

**Every `.pill` fill is mixed with `--panel`, i.e. opaque, never with
`transparent`.** A translucent badge inherits whatever the row underneath happens
to be — the even-row `--ink 3%` stripe, `tr.bad`'s `--over 9%` wash, or both — so
the same badge measured 4.9:1 on one row and 4.2:1 two rows down. Opaque means the
ratio written next to each rule is the ratio that ships. (The a11y audit's per-pill
numbers were taken against a bare white ground without compositing the pill's own
fill, which is why `.pill-bad` read as passing at 4.60 when it was really 3.90.)

**A horizontal scroll needs a visible edge.** `.tscroll` on its own is an unmarked
scroll: at 320px the import preview showed three of ten columns with `mask-image:
none`, `box-shadow: none` and a scrollbar that stays invisible on touch until it is
dragged — the same failure the rails were redesigned to avoid ("a chip parked
off-screen is a nutrient nobody finds"). `import-meals` therefore wraps each
scroller in a **`.tedge`** whose `::before`/`::after` paint a gradient plus a
chevron over the scroller's own edges, toggled from `scrollLeft` by
`wireScrollEdges()` on `scroll` and on a `ResizeObserver` tick. The cue cannot live
on `.tscroll` itself — a pseudo-element inside a scroll container scrolls away with
the content it is meant to mark — and only `opacity` transitions, since this runs on
scroll (invariant 1). That template also tightens cell padding and type below 420px,
which buys columns back before asking anyone to scroll at all.

`.tedge` is defined in `import-meals.html`'s own scoped `<style>`, not here: it is
that widget's layout, not a shared primitive, so it has no gallery section. Promote
it to `table.css` (and add one) the moment a second widget needs it. Its two
chevrons carry **empty alternative text** (`content: "‹" / ""`, behind an
`@supports (content: "x" / "y")` guard, with the plain single-value `content` as the
floor) — they were being read out as two stray glyphs either side of the table, and
they duplicate an affordance the region below already announces. The guard is not
decoration: an engine that cannot parse the two-value syntax drops the whole
declaration, which would delete the chevron rather than just its alt text.

**A scrollable box is a tab stop, so it needs a name and the system's ring.**
Chrome focuses a keyboard-scrollable container whether or not you ask it to, and
`.tscroll` was landing in the tab ring — ahead of every button on the step — as an
unnamed generic wearing the UA's `outline: auto 1px`. Two halves, and both are
needed:

- `table.css` gives `.tscroll:focus-visible` the same `outline: 2px solid var(--acc);
outline-offset: 2px` every other focusable surface in the design draws (SPEC §7).
  The offset ring lands _outside_ the scroller, where nothing clips it; drawn inside,
  it would scroll away with the rows.
- The **template** supplies `role="region"` + `aria-label` + `tabindex="0"`, because
  only the template knows what is scrolling. `import-meals` names its two scrollers
  with existing translated leaves — `T.importMeals.previewHeading` ("Preview") on the
  preview step, `T.importMeals.tableProblem` ("Problem") on the done step's row-error
  table — so the name is localised with the rest of the card.

`wireScrollEdges()` then **demotes `tabIndex` to `-1` whenever the scroller does not
actually overflow** (either axis), on the same `paint()` that toggles the edge cues,
so a table that fits at 560px is not a stop that does nothing. It writes one property
that moves no box, so it cannot feed bridge.js's ResizeObserver (invariant 1).

`component-gallery`'s `.tscroll` specimen has no role or name of its own — it is a
dev-only surface no client can reach, but a widget copying from the gallery should
copy the markup contract above, not just the class.

## Invariants

These are the rules that break something real when ignored.

1. **Never animate a layout property.** `opacity`, `transform`, `stroke-*`,
   `color`, `background`, `border-color`, and the chip underbar's `width` (inside an
   `overflow: hidden` pill, changing no layout) only. **Never** `height`,
   `max-height`, `margin` or `padding`: `bridge.js` measures `documentElement` at
   `max-content` on a `ResizeObserver` tick, so an animated size becomes a 60Hz
   `size-changed` storm and a lurching iframe.
2. **Nothing is made visible BY an animation.** The drawer's visibility is its
   `hidden` attribute; `rise` only decorates it. Any value painted in two steps (the
   underbar's width, the gauge's `stroke-dashoffset`) keeps its final value in the
   markup and takes the animating class only when `REDUCED` is false, so a cancelled
   or blanket-killed animation can never leave a bar at zero.
3. **`.empty` and `.empty .big` belong to `bridge.js`.** It paints its
   connect-failure card with those exact class names, so they cannot be renamed in
   `base.css` independently of that file.
4. **The footer note belongs to `bridge.js` too.** It appends one persistent element
   ("You can enable or disable these widgets anytime…") as `#root`'s last child and
   keeps it there with a `MutationObserver`, because several widgets repaint
   themselves from their own controls without going through `paint()`. Two
   consequences for a template: never assume your own last child stays last, and
   **an empty root must be genuinely empty** — the bridge removes the note when the
   root has no children, which is what keeps `.wrap:empty { padding: 0 }` matching
   and lets `meal-logged` collapse the iframe to nothing.
5. **A partial may not contain marker text.** `src/widgets.test.ts` requires every
   `@include`d partial's full text to appear verbatim in the assembled output, and
   the assembler's regexes match plain text — comments included. So a partial must
   not contain `/*@include`, `/*@inlinets`, `/*@i18n@*/`, a `<style>`/`<script>`
   tag, or the literal `initWidget({` — not even inside a comment. That is why
   `shared/i18n.js` never spells out the i18n marker and why `shared/macros.js`
   hand-copies `DRINK_GRAMS` instead of pulling `src/alcohol.ts` in.
6. **Adding a primitive without a gallery section is not done.**
   `component-gallery` is the only surface where a primitive's states are all
   reachable at once for a light/dark/320px review.
7. **Contrast floor:** `--ink3` on `--panel` and on `--bg2` must clear 4.5:1 in both
   themes at 10–12px. That is why `--ink3` is `#646b78`. Rank text by size and
   weight, never by fading it — an `opacity` on top of `--ink3` drops it under the
   floor.
8. **Over a ceiling is never signalled by colour alone.** The non-colour cue is
   the FIGURE: every tile prints its value against its goal, so "58.2/45 g" states
   the breach in digits and survives greyscale, colour blindness and a
   forced-colours mode. Hue on its own was the state of things until the a11y
   audit measured it — 99% of a goal and 130% of a ceiling were otherwise
   identical. A `.wmark` warning triangle did this job for one revision and was
   removed: a rail of metrics reports, it does not warn.
9. **A series token is an identity, not something you read.** Never paint small
   text in `--cal`/`--pro`/…/`--over` on `--panel` or `--bg2` — put the token on a
   dot, a fill, a hairline or a tint and keep the text in `--ink`/`--ink2`. The
   drawer's `.dv` (1.47–4.26:1) and `.cmeta.kcal` (2.06:1) were both blockers.
10. **Every interactive element uses the same focus ring**
    (`outline: 2px solid var(--acc); outline-offset: 2px`). A translucent
    box-shadow substitute measured ~1.6:1 and is not an indicator.
11. **A disclosure hands focus both ways.** Opening moves focus into the region
    (`focus({ preventScroll: true })`); closing returns it to the control that
    opened it, **before** the region's contents — and the ✕ holding focus — are
    destroyed. Otherwise focus lands on `<body>` and a keyboard user is back at
    the top of the tab ring. Do not reach for `aria-live` instead: a region
    written to while `display: none` never announces.
12. **`aria-expanded` means something expands.** A control that only changes a
    graphic is `aria-pressed`, and it must not wear a disclosure chevron either.

## Verifying a new widget

Run `bun run harness` and open <http://localhost:8787>. It mimics a strict host
(validates the `ui/initialize` shape, withholds the tool result until
`ui/notifications/initialized`, starts the iframe at 130px, applies the sandbox
CSP) and additionally answers app-initiated `tools/call`. Query flags reproduce
host behaviour: `?serverTools=0`, `?tools=0` (never answer), `?delay=3000` (stand
in for a per-call approval prompt), `?maxHeight=600`, `?fail=1`, `?drinkUnit=us`.
Its `size-changed height=N` log line is the honest height measurement — the iframe
starts short and grows only on that notification.

**The harness's fixtures are schema-checked at startup**, and that is what makes it
worth measuring on. `assertFixturesMatchSchemas` pulls each tool's real
`outputSchema` (by registering `registerTools` against a throwaway `McpServer` and
intercepting `registerTool`, so no field list is restated anywhere) and refuses to
start on a missing **or** stale key. They had drifted: `trends` sent `range_days`
where the tool sends `default_range`, and `weight-trends` sent no `target`, so the
range toggle opened on a fallback and the dashed target line plus its whole `.cfoot`
phrase never rendered here — a clipping bug in that phrase reached an audit instead
of the harness. If you add a field to a tool's `outputSchema`, add it to the
fixture; the harness will tell you.

**Start with the component gallery:**
<http://localhost:8787/host?widget=component-gallery> renders every shared primitive
on one page — the whole card, the header line, the empty states, the chip in every
state, a wrapping rail, the hero gauge at 0 / 62% / over, the `.more` row, the
drawer (open, `+N more`, empty), all three chart instances, both segmented-control
states, a static macro strip, the import progress rails, the pill fields and
buttons, the drop zone, every notice severity, the preview table and the icon
table. Extend it when you add a component.

Then, for the widget itself:

1. **Narrow first — 320px, then 360px.** Chips wrap two per row at 360 and three at
   ~440, so the rail changes shape without a media query; check that no chip, the
   ghost hint included, overflows. Then:

    ```js
    const de = document.documentElement;
    de.scrollWidth > de.clientWidth; // must be false
    ```

2. **Light and dark, both ways in.** The harness's `host-context-changed (dark)`
   button drives the `[data-theme]` path; your OS setting drives the media query.
   They are different code paths, so check both — a token missing from one of the
   four theme blocks only shows up in one of them.
3. **Every interactive control**, and confirm it re-renders and re-reports height:
   the range toggle, each tappable chip, the drawer's ✕, the `.more` row, and
   keyboard Enter/Space plus a visible `:focus-visible` ring on all of them. Confirm
   the bridge's footer note is still the last thing in the card after each one.
4. **The states with no data:** a range with nothing logged (`.cempty`, with the
   toggle still present), a metric recorded as a real zero ("none logged"), a metric
   with no goal ("no goal set"), and — for `meal-logged` — no goals at all, which
   must report `size-changed height=0`.
5. **Reduced motion.** Turn it on at the OS level and reload: every value must be at
   its final position, not at zero.

**Start the harness iframe SHORT (~130px) and grow it on
`ui/notifications/size-changed`.** The real host gives the widget a small default
height and only expands it when the widget reports its own (see CLAUDE.md →
handshake). A fixed-tall test iframe hides clipping entirely — that is exactly how a
clipped widget shipped once. Every widget must send `size-changed` and re-send it
via a `ResizeObserver`, which is also what makes an opened drawer grow the frame
instead of being cut off.

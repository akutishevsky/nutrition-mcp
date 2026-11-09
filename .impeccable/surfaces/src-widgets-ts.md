---
version: 1
slug: "src-widgets-ts"
primary_target: "src/widgets.ts"
related_targets: []
---

# Surface brief — Munch widgets (src/widgets.ts)

Mode: Operate. Audience: Munch users inside ChatGPT and other MCP clients, glancing at a result mid-conversation. Job: read one answer or confirm one action in seconds. Constraints: one bordered surface on the host background, no shadows, standard controls, 44px targets, no pricing or Premium anywhere, non-clinical voice, sources visible (product principle 2).

## Direction contract

THESIS: The widget is a Nutrition Facts panel that answers back. Every Munch result is set in the label's grammar — a heavy rule over descending rules — instead of the incumbent grey metric tiles and rainbow nutrient colors that could belong to any tracker.

OWN-WORLD: Deep green #0B3D24 band carrying the cream apple; warm white card; ink #16241B; brand green #0B8F4D for fills and the one primary action; lime only in the leaf. Rules do the separating: 8px heavy bar, 3px rule, 1px hairlines. Numerals tabular at every size; calories set oversized like the label's.

STORY: The user asks about their food and gets a panel they already know how to read from every package in their kitchen — value right-aligned, share of target where the label puts %DV, and the source named on the row, because every Munch number carries its source.

FIRST VIEWPORT: Green band with the apple and the surface's plain title; the hero number (today's calories, the meal total, the trend average) immediately under it; then label rows in reading order; one primary action at the bottom where a decision is owed. Nothing above the hero except the band.

FORM: Extension of the established brand world (mark brief, this repo) into the widget system; no new world. The signature move is the Facts rule cascade. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Height system (added 2026-11-09, from the tool→UI coverage audit)

Measured at the 640px design width; heights are the rendered card's CSS px. These rules bind every widget ported or built under the Facts Panel pass (full brief: `~/workspace/munch-prep/widget-audit/brief.md`).

**Inline budgets:** read panels (nutrition-summary, goal-progress, trends, weight-trends, food-label single) ≤ 560px, hard cap 640px. Lists (food-label results, day-meals, grocery-list, pantry, recipe list) ≤ 560px, hard cap 640px. Write surfaces (meal-review, recipe review, import-meals) ≤ 640px including the sticky bar, hard cap 720px. Receipts (meal-logged, import results, reconcile results) ≤ 440px, hard cap 520px.

**Fold rule:** inline carries the decision, fullscreen carries the detail. Inline = band + hero + ONE insight (chart or note sentence) + first rows + the primary action when a decision is owed + an explicit expand affordance. Fullscreen = full tables, all remaining rows, secondary sections (provenance detail, daily tables, vs-target bars, full assumptions). Fullscreen-only content uses the existing `.fullscreen-only` mechanism in `shared/base.css`; nothing may be reachable only by scrolling inside the inline frame.

**Row limit + compact rows:** at most 5 label rows or list rows inline. Lists longer than 6 items render compact rows in both modes — one line per item (name left, primary value right-aligned, source reduced to a marker; full source lives in fullscreen). Lists longer than 12 items show the first 5 inline plus a "…and N more" row that opens fullscreen.

**Sticky action bar:** on every write surface the primary action (Log meal / Save recipe / Import) and its secondary (Adjust / Cancel) are pinned to the card's bottom edge in both modes; the confirm copy ("Nothing is saved until you tap…") lives inside the bar zone and can never scroll away from the button it describes.

**Per-widget conformance:**

- **nutrition-summary** — band + hero (average kcal + coverage) + 4 metric rows + 1-line observation inline; daily rows and vs-target bars fullscreen-only.
- **goal-progress** — full content inline (hero + ≤6 goal rows); its targets state shows goal rows only, no progress bars.
- **meal-logged** — the whole receipt inline (meal, items in compact rows past 6, totals, day-so-far line); provenance section fullscreen.
- **meal-review** — band + meal title + item rows (compact past 6) + heavy-rule total + sticky bar; assumptions/confidence detail expands in place or fullscreen. Gains a fullscreen mode in this pass — it previously had none.
- **trends** — the known offender (~914px in the mockup round). Inline cut, target ≤ 540px: band + hero (average + days logged) + sparkline with goal line + ONE note sentence + first 3 label rows (Calories, Protein, Carbs). Fullscreen-only: remaining rows, the day table, vs-target bars.
- **weight-trends** — band + current-weight hero + chart + change line inline; entry table fullscreen-only.
- **import-meals** — current step only inline (the step machine already enforces this); the preview step uses compact rows past 6 detected rows; sticky confirm bar on the preview and import steps.
- **cook-summary** — band + cook title/status + result line + last 5 timeline events inline; full timeline and photo grid fullscreen.

**New widgets** (food-label, recipe, meal-plan, grocery-list, pantry, day-meals) are designed to these budgets from the first commit, not retrofitted.

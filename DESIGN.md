# Munch — Design

## Brand mark (adopted 2026-11-09)

The Munch mark is a plump apple with a leaf, carrying the Nutrition Facts
label's rhythm — one heavy bar over descending rules — knocked out of the
fruit's body. Food reads first, tracking second. The name "Munch" and the
brand green are binding; the letterform M is retired.

Construction: a single apple silhouette (viewBox 0 0 192 192), the label
lines as true transparent knockouts (`fill-rule="evenodd"`), a stroked stem,
and a filled leaf. One geometry serves every variant; only fills change.

| File                                           | Use                                                       |
| ---------------------------------------------- | --------------------------------------------------------- |
| `public/brand/munch-mark.svg`                  | Primary: apple `#0B8F4D`, leaf `#A8D90F` — light surfaces |
| `public/brand/munch-mark-dark.svg`             | Apple `#07502F`, leaf `#A8D90F`                           |
| `public/brand/munch-mark-light.svg`            | Apple `#FFFFFF`, leaf `#D9FF5B` — dark surfaces           |
| `public/brand/munch-mark-white.svg`            | Apple `#FFFFFF`, leaf `#A8D90F`                           |
| `public/brand/munch-mark-192.png` / `-512.png` | Primary glyph, transparent                                |
| `public/apple-touch-icon.png`                  | Primary glyph on `#FCFDF9`                                |
| `public/favicon.ico`                           | Primary glyph, 16–64 px                                   |

Tile treatment (app-icon and directory contexts): the apple in cream
`#F5EFE2` with a `#5DA85F` leaf on a deep green `#0B3D24` field, lines
knocked out to the field color.

Rules:

- The label lines are knockouts, never painted a background color — the
  mark must work on any ground.
- Do not add a letterform, face, or chart furniture to the mark.
- At 16 px the silhouette and leaf carry the mark; do not thicken the
  thin rules to compensate.

Provenance: chosen by Michael on 2026-11-09 through an Impeccable
direction round (Facts Panel direction; contract in
`.impeccable/surfaces/public-brand-munch-mark-svg.md`). The shipping
geometry was drawn as SVG in-repo; the exploratory AI-generated comps in
`.impeccable/mocks/` are decision records, not sources.

Social card: `public/og.png` (1200×630) composes the primary glyph on
`#FCFDF9` beside the headline "Persistent nutrition / for your AI" (dark
`#16221B` over brand green) and three subtext lines in `#55635B` — the
client line ("Works with ChatGPT, Claude, and any MCP app"), the
data line, and the price line — per the 2026-11-09 MCP-wide positioning
ruling. Its source is `public/og.svg`; re-render with
`ffmpeg -y -i public/og.svg public/og.png`.

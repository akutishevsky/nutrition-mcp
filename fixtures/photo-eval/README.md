# Photo-eval fixture set — Munch S3 photo-logging decider

Golden fixtures for the photo-logging pipeline defined in the Full Parity
App Program brief, section 3 (`meal_photo` flow). This directory is **data
plus a harness skeleton only** — the pipeline itself is the S3 slice. The
`meal_photo` capability-manifest row does not exist yet and is deliberately
not added here (that is S0/S3 territory).

## Layout

| Path                   | Contents                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photos/`              | 40 golden meal photos (JPEG, 800×600, longest edge ≤1600px), ~986 KB total.                                                                                                 |
| `expectations.json`    | Per fixture: expected item set, acceptable portion range per item (quantity + unit, min–max), expected grounding provider per item, category tags.                          |
| `manifest.json`        | Per-image provenance: source, license, generation note.                                                                                                                     |
| `subset.json`          | The 10 fixtures designated for the deterministic per-PR recorded run.                                                                                                       |
| `recorded/`            | Recorded Muse Ember stage-2 responses (golden JSON) for the 10 subset fixtures. Hand-authored to the schema, clearly marked `"recorded": true`; **not** live model outputs. |
| `photo-eval.test.ts`   | Harness skeleton (Bun test, the repo's test convention). Runs in the standard `bun test` CI lane.                                                                           |
| `generate_fixtures.py` | The Pillow generator that produced every photo, `expectations.json`, and `manifest.json` — rerun it to regenerate the corpus deterministically.                             |

## Categories (brief section 3)

40 fixtures: single item ×6, mixed plate ×7, sauced/hidden-ingredient ×5,
restaurant portions ×5, packaged food with label visible ×5, drinks ×4,
poorly-lit ×4, partially-eaten ×4.

## Provenance

Every photo is a **synthetic, procedurally generated illustration**
(Pillow), created for this project — openly licensed by construction, with
no scraped personal data and no third-party stock imagery. Each item named
in `expectations.json` is drawn as a distinct shape/colour region so a
human reviewer can verify the item set against the image. Packaged
fixtures draw a readable generic descriptive label (never a real brand),
because reading the label is the skill that category tests.

## Expectations semantics

- **Portion ranges** are honest estimator-hittable ranges (~±30% thinking,
  per the section 3 accuracy bars), not false precision.
- **Expected grounding provider** is one of `local catalog`, `USDA`,
  `Open Food Facts`, `model_estimate`, following the resolution order in
  `src/canonical-food-search.ts` / `src/food-providers/service.ts`: the
  persistent local catalog first, then USDA and Open Food Facts
  concurrently, with a labelled `model_estimate` as the last fallback.
  There is no live Nutritionix provider (legacy import label only).
  Branded/packaged items expect Open Food Facts; generic whole foods
  expect the local catalog or USDA; restaurant composites and
  sauced/hidden-ingredient dishes expect `model_estimate` where no
  database entry can honestly match. Across the set, 56 of 66 items
  (84.8%) are expected to ground to a provider, keeping the section 3
  "≥80% grounded" bar reachable.

## Recorded-response format (stage 2)

Matches brief section 3 stage 2 (identify + portions), one Ember vision
call, temperature 0: per visible item — `name`, `cooking_method` (or
`null`), `quantity` + `unit`, `portion_confidence` (0–1), and explicit
`assumptions[]` (e.g. "assumed coconut-milk-based sauce"). **No nutrition
numbers are requested or accepted from the model** — nutrition only ever
comes from providers or the labelled-estimate fallback at grounding time.

## Harness

Run it with the repo's normal test command (it is part of `bun test`):

```sh
bun test fixtures/photo-eval/photo-eval.test.ts
```

Today it asserts the structural contract the S3 pipeline must satisfy:
schema validity of recorded responses, expectations-file integrity, every
fixture has expectations, and every expectation item carries a provider
and a portion range. Pipeline-stage assertions (grounding execution,
draft shape, accuracy bars) are declared in the test file as
`test.todo` entries marked `TODO(S3)` — owned by the S3 slice, not
silently absent. The nightly live eval over all 40 fixtures also belongs
to S3.

# Bandwise — design brief

## Design read
For serious IELTS Academic candidates: people who have paid for a test date and
need honest measurement, not motivation. Emotional register: calm authority,
instrument-grade precision, the quiet of an exam hall.

## Concept spine
**The calibration desk.** The site behaves like a precision measuring
instrument: hairline rules instead of cards, tick scales, mono numerals for
every number, and a single red-pen register reserved for corrections. Every
claim on the page is something the app actually measures.

## Delivery tier
`editorial` — typography-led, hairline structure, micro-motion only, no camera
journey.

**Animation mode: non-animated — user picked Non-animated at intake.**

## Tier-1 mechanic (the wow carrier)
**The band dial.** A real, interactive instrument in the hero: the visitor drags
a raw-marks slider (0 to 40) and the needle, numeral readout and per-module
scale ticks animate to the true converted band. It is the product's actual
scoring scale, so the hero demonstrates the product instead of decorating it.
Reduced motion: the dial renders at a static band and the slider still works.

## Locked palette (one accent page-wide)
- `--bw-ink` #151A21 (off-black with a blue cast; never pure black)
- `--bw-paper` #F1F2ED (cool bone; deliberately NOT beige)
- `--bw-rule` #C7CAC0 (hairline rules, the printed-sheet register)
- `--bw-accent` #2438C9 **ultramarine, the only accent** (examiner's blue-black ink)
- semantic only, never decorative: `--bw-correct` #1F7A63, `--bw-wrong` #C0392B

Defense: bone paper plus ink is the material world of a marked answer sheet;
ultramarine is the pen colour, held to one accent so the red never reads as
decoration. Avoids all four banned families (no graphite+orange, no dark neon,
no beige+brass, no violet).

## Locked type
- Display and UI: **Geist** (Swiss rational sans, hard hierarchy)
- Numerals, timers, labels: **Geist Mono**
Pairing is from the recipe table. No serif: the register is a measuring
instrument, not a magazine.

## Grid and system
- 12-column Swiss grid, hairline `1px` rules as the dominant separator.
- One radius scale, all-sharp (0 to 2px). No pills anywhere except the timer.
- Vertical rhythm lines in the left gutter labelling each section's measure.
- Numerals are always mono and always tabular.

## Second-read moment
One oversized numeral as structure: an enormous mono `9` (the top band) set as
a hairline outline behind the band-scale section, read as a scale mark rather
than as a headline.

## Section plan
| # | Section | Layout family | Anchor |
|---|---|---|---|
| 1 | Hero | asymmetric split (text lead + live dial) | top-left lead |
| 2 | The four modules | gapless 4-block bento, color-blocked | Swiss grid, image-as-canvas |
| 3 | The Test Engine | vertical rhythm-line timeline | centered statement |
| 4 | Mistake Lab and Analytics | off-grid panel stack of the real app | off-grid offset |
| 5 | Content and fairness policy | editorial offset, hairline rules | bottom-left over plate |
| 6 | Questions and start | poster-stacked, closing CTA | stacked center |

No consecutive layout repeats. Eyebrow budget: 2 for 6 sections (hero counts).

## Asset plan (revised at the user's instruction: licence-free only, no paid generation)
- Hero: one licence-free still of the calibration desk (a plain desk, paper and
  pen), graded to the palette, plus the interactive dial built in code.
- 4 module plates: one licence-free image per module (Reading, Listening,
  Speaking, Writing), all put through the same duotone grade so they read as one
  set.
- Section plate: one licence-free paper-texture still for background character.
- Icons: hand-drawn inline SVG on a shared 24px grid, 1.5px stroke, in the
  palette (crisp at every size, no icon font, no generated sheet).
- Logo monogram: drawn in code as inline SVG (an instrument tick ring with a
  needle), so it stays crisp at favicon size.
- OG card: composed in code as an SVG to PNG at 1200x630, in the same language.
- Every downloaded file is recorded with its source and licence in
  `public/assets/CREDITS.md`.

## CTA inventory (each its own component, no shared button class)
1. **Start a mock** (hero primary) — solid ultramarine block, arrow slides right on hover.
2. **See how scoring works** (hero secondary) — inline underlined link, rule sweeps to accent.
3. **Begin Reading / Listening / Speaking / Writing** (module cards) — ghost button with corner ticks that draw in on hover.
4. **Open the Mistake Lab** (analytics section) — framed block CTA, invert on hover.
5. **Create your free account** (closing) — full-width ink band, tick ring rotates on hover.

## Copy rules honored
No em-dashes or en-dashes anywhere. One CTA label per intent page-wide.
Every number on the page is a real product fact, and every band is labelled an
estimate, never an official IELTS score.

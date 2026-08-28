# TASK — TYPE A, POCKET GUIDE

Produce a Pocket Guide from the source extract, following the blueprint above.

## Structure

- The **first** part of the generation emits the cover. Later parts do not.
- Group sections under `part-bar` thematic blocks — 2 to 4 blocks per document.
- Number sections continuously across the whole document (the runner tells you
  which number to start at).
- The **last** part of the generation emits the closing ladder table. Earlier
  parts do not.

## Depth calibration

Target roughly 5–8 sections per part of the generation, each with:

- one intuition box (mandatory, first);
- 4–8 technical bullets carrying the real definitions, notation, and formulas;
- a deep-dive box **only** where the concept genuinely warrants one;
- a table or callout where a comparison is clearer than prose.

Density matters more than length. A section the reader could have written from
the chapter title alone is a failed section. Every section should contain at
least one thing that is not obvious: a mechanism, a number, a failure mode, a
condition under which the method breaks.

## Output

Return only the HTML fragment. No markdown fences, no commentary, no preamble.

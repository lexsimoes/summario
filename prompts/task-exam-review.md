# TASK — TYPE B, EXAM REVIEW

Produce a question-first exam review from the source extract and the supplied
question bank, following the blueprint above.

## Structure

- The **first** part of the generation emits the cover. Later parts do not.
- Group questions under `part-bar` thematic blocks, each opening with a
  `recap` box of exactly three bullets.
- Number questions continuously across the whole document (the runner tells you
  which number to start at).
- The **last** part emits the final cheat-sheet table. Earlier parts do not.

## Question bank handling

- **Prompts + answer key supplied:** use both verbatim. The answer box must
  match the key exactly.
- **Answer key only, no prompts:** reconstruct the question each answer must
  have been asked in, then add this to the cover, in the document's language:
  *"Questions reconstructed from a recorded answer key; wording is inferred."*
- **Near-duplicate questions:** consolidate them into one comprehensive
  question. Never inflate the count with restatements of the same idea.

## Depth calibration

The reference standard is a 23-page review with 63 questions and 5-line theory
boxes. Match that depth. The theory box is where the document earns its keep —
apply the 2.4 test to every one of them before returning.

## Output

Return only the HTML fragment. No markdown fences, no commentary, no preamble.

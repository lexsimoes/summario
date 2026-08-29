# TASK — STUDY SET FROM A POCKET GUIDE

Turn a finished Pocket Guide into the retrieval layer of the method: a set of
flashcards, a retrieval quiz, and a few applied-project briefs.

The guide's HTML is your **only** source. Do not add facts it does not contain.
Where the guide is explicit that something is uncertain or out of scope, leave it
out — do not fill the gap.

## Output

Return **only** a JSON object, no markdown fence, no commentary:

```
{
  "flashcards": [
    { "front": "...", "back": "...", "concept": "short concept tag" }
  ],
  "quiz": [
    { "question": "...", "answer": "...", "explanation": "...",
      "trap": "", "concept": "short concept tag", "is_multi_select": false }
  ],
  "projects": [
    { "title": "...", "brief": "...", "concepts": ["...", "..."] }
  ]
}
```

Counts: **15–25 flashcards**, **10–16 quiz questions**, **2–3 projects**. Plain
text in every field — no HTML tags, no markdown. Keep formulas in readable prose
or plain LaTeX (`x = a / b`); never write a bare `$`.

## Flashcards

- One concept per card. Never two.
- `front` is a question that forces **recall**, not recognition — not "What is
  X?" boilerplate but a prompt that makes the reader produce the mechanism, the
  condition, the number.
- `back` is the minimum answer that proves understanding, plus **one** line on
  why it matters in practice.
- `concept` is a 1–3 word tag naming what the card tests. Cards that test the
  same idea share the exact same tag — the app groups and weights by it.
- Cover the guide's real content: definitions, mechanisms, failure modes,
  the cross-module links it draws. Skip anything a reader could answer from the
  section title alone.

## Quiz

- Each question tests one idea. `answer` is the correct response in full.
- `explanation` (always) says *why* that answer is right, in 1–3 sentences,
  grounded in the guide.
- `trap` (only when there is a classic one) names the plausible wrong answer and
  why it is wrong. Empty string otherwise — do not invent traps.
- `concept` uses the **same tag vocabulary** as the flashcards, so a missed
  question can point the reader at the matching cards.
- `is_multi_select` is `true` only for a question whose answer is genuinely a set
  ("which of these hold"). Most questions are `false`.
- Weight the set toward the concepts the guide itself treats as load-bearing
  (the deep-dive boxes, the cross-links, the ladder table).

## Projects — "build something"

2–3 applied projects that exercise the guide's concepts together. Each:

- `title` — concrete, buildable in a weekend to a week.
- `brief` — 2–4 sentences: what to build, and what doing it forces the reader to
  understand. No step-by-step; the point is to make them apply the ideas.
- `concepts` — the specific concept tags the project puts to work. Only tags that
  appear in this guide.

Order them easiest-first.

## Language

Follow the LANGUAGE line in the request. In bilingual mode, match the guide:
technical vocabulary and the quiz's answer/explanation prose in English; the
recall-style phrasing of card fronts may use Portuguese where the guide's
intuition boxes do. Never machine-translate a term the guide keeps in English.

# STUDY MATERIAL GENERATOR — MASTER BLUEPRINT

**Purpose of this document.** It is the single source of truth for the "estudo" app.
It serves two roles at once:

1. **Project context** — upload it as a project file so any new conversation starts with full context.
2. **System prompt base** — the content rules (Parts 2–5) are the generation prompt for the app itself.

Owner: Lex (Alexandre Simoes) · Target role: AI Engineer
Status: v1.0 — consolidated from ~10 study documents produced and refined iteratively.

> **Implementation note.** `prompts/blueprint.md` in this repo is the generation-facing
> subset of this document — Parts 1–5 rewritten as instructions to the model, plus the
> HTML contract the renderer expects. That file is the one the app actually reads.
> Keep the two in sync when the content rules change.

---

## PART 0 — PROJECT SUMMARY

### What the app does

A personal study-material generator. The user provides:

- **Topic** (e.g. "Convolutional Neural Networks")
- **Description / scope** (e.g. "Chapter 7, sections 7.1–7.6")
- **Support material** (PDF of the textbook, optionally a question bank)
- **Language mode** (EN / PT / Bilingual)

The app produces a coordinated set of study artifacts, all derived from one generation pass:

- **Pocket Guide** (the "resumão") — the mother document, rendered as PDF
- **Flashcards** — Anki-importable, generated from the Pocket Guide
- **Quiz** — active-recall questions with answers and explanations
- **Cheat sheet** — one-page condensed reference

### Why it exists

Reading summaries is a weak retention strategy. The app is built around what the
learning-science evidence actually supports: **active recall + spaced repetition +
applied projects**. The Pocket Guide is the reference layer; the flashcards and quiz
are the retrieval layer; Anki owns the spacing layer.

### Non-negotiable quality bar

Output must match the quality of the reference documents already produced (Deep Learning
Final Exam Review, Unsupervised Learning Final Exam Review, ML/DL Foundations Primer).
The hardest engineering problem in this project is not the code — it is keeping generation
quality consistent without human iteration. Budget real effort for the generation prompt
and for evals.

---

## PART 1 — THE TWO DOCUMENT TYPES

The blueprint supports two formats. They share the design system but differ in structure.

### Type A — POCKET GUIDE (concept-first)

Used when learning material for the first time. Organized by concept.

```
Cover (title, subtitle, source, how-to-use)
└── PART BAR (thematic section)
    └── Numbered section
        ├── A INTUIÇÃO PRÁTICA  (intuition box — analogy, plain language)
        ├── Technical bullets / formulas
        ├── PRA FIXAR           (deep-dive box — for hard concepts only)
        └── Callout / table     (optional)
└── Closing "ladder" table (progression summary)
```

### Type B — EXAM REVIEW (question-first)

Used for exam preparation. Organized by question.

```
Cover (title, subtitle, source, how-to-use, reconstruction note if applicable)
└── PART BAR (thematic block)
    ├── QUICK RECAP           (3 bullets — the block's core ideas)
    └── Question
        ├── Question heading (numbered)
        ├── ANSWER            (green box — the correct answer, bolded key terms)
        ├── THEORY            (amber box — 4–5 lines explaining WHY)
        └── CLASSIC TRAP      (red box — only when a real distractor exists)
└── Final cheat sheet table ("If the question is about… / The key answer")
```

**Rule:** when a question bank is supplied, use Type B. Otherwise Type A.

---

## PART 2 — CONTENT RULES (this is the core of the system prompt)

### 2.1 The intuition box — A INTUIÇÃO PRÁTICA

- Opens every section in a Pocket Guide, before any technical content.
- Written in plain, conversational language. Always uses a concrete analogy.
- Never contains formulas.
- Length: 2–4 sentences.

Analogies already established (reuse for consistency):

| Concept | Analogy |
|---|---|
| Bias vs. variance | Marksman: crooked sights (bias) vs. shaky hands (variance) |
| Training vs. test error | Old exam papers you studied vs. the real entrance exam |
| Ridge (L2) | Progressive tax — everyone pays, nobody is fired |
| Lasso (L1) | Summary dismissal — useless variables get fired (set to exactly 0) |
| Regularization | Mathematical handbrake |
| Bootstrap | "Pulling yourself up by your bootstraps" — parallel universes of your table |
| Cross-validation (k-fold) | Splitting the class into groups; each takes a turn being the test |
| LOOCV | Leave one card out of the deck at a time |
| Decision tree | A game of 20 questions |
| Pruning | Bonsai gardening — grow big, then trim back |
| Bagging | A committee of jurors voting |
| Random Forest | Forcing jurors to look at different clues (decorrelation) |
| Boosting | A student who studies only their mistakes, in series |
| Gradient descent | Blindfolded on a hill, feeling the slope, stepping downhill |
| Learning rate | Step size — tiny steps crawl, huge steps overshoot the valley |
| Epoch | One full read of the textbook; a batch is reading 10 pages |
| Weights | Volume knobs for each feature |
| Bias term (b) | The starting point / floor of the calculation |
| Loss function | Error thermometer |
| Dropout | A team where random players are missing each game |
| Attention (Q/K/V) | A soft database lookup |
| Convolution | A sliding sieve over the image |
| Fixed context vector (RNN bottleneck) | Summarizing a whole book onto one index card |

When creating a new analogy: it must be everyday, physical, and culturally natural in the
target language. Do not translate an analogy literally — regenerate it for the language.

### 2.2 The deep-dive box — PRA FIXAR / KEY TAKEAWAY

- Only for genuinely hard concepts. Overuse destroys its signal value.
- Longer than the intuition box (4–8 lines), goes deeper into why the mechanism works.
- Written in the fixation language (PT in bilingual mode).
- Typical triggers: a counterintuitive result, a common misunderstanding, a mechanism that
  "clicks" once explained properly.

Examples of correct use:

- Why stacking linear layers collapses (affine ∘ affine = affine)
- Why weight decay is called decay (the (1−ηλ) factor)
- Why dropout divides by (1−p) (expectation matching)
- Why the residual connection solves degradation (identity becomes g(x)=0)
- Why two 3×3 convolutions beat one 5×5 (fewer params + extra ReLU)
- Why √d scaling exists in attention (softmax saturation)
- Why training uses so much memory (backprop reuses forward activations)

### 2.3 The ANSWER box (Type B only)

- States the correct answer directly, no preamble.
- Key terms in bold.
- For multi-select questions, prefix each correct option with ✓.
- Matches the recorded answer key exactly when one is supplied.

### 2.4 The THEORY box (Type B only)

4–5 lines. This is the single most important quality lever in exam-review documents.

- Explains why the answer is correct, not just restating it.
- Should include at least one of: the underlying mechanism, a formula, a concrete number,
  a worked intuition, or a connection to another topic in the course.
- Never opens with "This is because…" — go straight into the substance.

**Quality test:** if the THEORY box could be deleted and the reader would lose nothing
beyond the answer itself, it failed.

### 2.5 The TRAP box

- Only when a real, common distractor exists — not manufactured.
- One or two sentences. States the wrong belief and corrects it.
- Examples: "ReLU is linear" (false), "L2 zeroes coefficients" (false — only L1),
  "apply augmentation to all splits" (false — training only), "K-means converges to the
  global optimum" (false — local).

### 2.6 The AI ENGINEER badge

Applied to concepts the user will actually use on the job, not just on the exam. When
applied, the THEORY box gains an extra sentence starting with "On the job:" connecting the
concept to building AI products.

Concepts that earn the badge:

- Embeddings, vector search, shared embedding spaces (CLIP)
- Tokenization (ties to context windows and API cost)
- Attention Q/K/V (ties to RAG and semantic search)
- Autoregressive generation (ties to latency and streaming)
- Fine-tuning vs. feature extraction vs. prompting
- Scaling laws, instruction tuning / alignment
- Dimensionality reduction (ties to vector DB cost)
- t-SNE / UMAP (ties to inspecting embedding spaces)
- Anomaly detection (ties to out-of-distribution inputs)
- Generative models (ties to why LLMs hallucinate)
- Learning-rate tuning workflow (ties to fine-tuning in practice)

Concepts that do NOT earn it: convergence proofs, derivations, exotic architectures, pure
theory. Keep those at intuition level — the user is explicitly not pursuing ML/Research
Engineer.

### 2.7 Cross-linking

Actively connect topics across modules. This is a major quality differentiator.
Established links:

- Ridge (statistics) = weight decay (deep learning) — same mechanism, two names
- Tree pruning α ≈ Lasso λ — same "tax on complexity" idea
- OOB error ≈ LOOCV — free test-error estimate
- CNN weight sharing ↔ RNN weight sharing — same principle, space vs. time
- ResNet skip connections ↔ Transformer residual connections — same fix for depth
- CNN fine-tuning ↔ BERT fine-tuning ↔ LLM fine-tuning — identical pattern
- K-means ↔ EM — K-means is EM with hard assignment
- Matrix completion ↔ recommender systems — same low-rank logic
- Double descent ↔ scaling laws — why bigger models can generalize better

### 2.8 The closing table

Every document ends with a condensed reference table:

- **Type A:** a "ladder" showing progression (e.g. GD → SGD → Minibatch → Momentum → Adam,
  with what each adds and when to use it)
- **Type B:** a "If the question is about… / The key answer or trap" two-column table, one
  row per major concept, 35–50 rows

---

## PART 3 — LANGUAGE MODES

Three modes. The reader picks one per document; the same chapter can exist in several
modes side by side. Interface language and content language are independent — the reader
may browse in Portuguese and generate in English.

**Everything Parts 1, 2 and 4 describe is the `bilingual` mode.** That is the reference
format, and the Portuguese box names used throughout this document belong to it. The other
two modes are the same document with a single language throughout — same structure, same
boxes, same rules, same depth. Only the language changes. Depth never varies by mode: a
`pt` document is not a lighter document.

### Mode BILINGUAL — the reference format, and this reader's default

| Element | Language |
|---|---|
| Section and question headings | English |
| Technical terms, definitions, notation, formulas | English |
| Technical bullets | English |
| ANSWER box | English |
| THEORY box | English |
| QUICK RECAP box | English |
| Intuition box (A INTUIÇÃO PRÁTICA) | **Portuguese** |
| Deep-dive box (PRA FIXAR) | **Portuguese** |
| Trap box (PEGADINHA CLÁSSICA) | **Portuguese** |
| Tables | English |

Rationale: technical vocabulary must be learned in English (that is the language of the
field), while intuition sticks better in the native language. Each box label follows the
language of that box's own content.

### Mode EN — 100% English

Every element above becomes English. Nothing Portuguese survives anywhere, including box
labels and analogies. Box labels: PRACTICAL INTUITION / KEY TAKEAWAY / ANSWER / THEORY /
CLASSIC TRAP / QUICK RECAP.

### Mode PT — 100% Portuguese

Every element above becomes Portuguese: headings, bullets, definitions, tables, answers,
theory, all of it. Formulas and notation are language-neutral and stay as they are.
Box labels: A INTUIÇÃO PRÁTICA / PRA FIXAR / RESPOSTA / TEORIA / PEGADINHA CLÁSSICA /
RECAP RÁPIDO.

**One deliberate exception — technical vocabulary.** The canonical English term appears
once, in parentheses, at its first mention in the document; after that, Portuguese only:

> O decaimento de peso (*weight decay*) multiplica o peso por (1 − ηλ) a cada passo.
> Nas iterações seguintes, o decaimento de peso continua…

Why: the reader will meet these terms in papers, documentation and APIs in English. A
document that hides them entirely reads well and transfers badly. The parenthetical is not
repeated, and applies only to terms of art (weight decay, dropout, bagging, boosting,
embeddings, overfitting, learning rate). Method names with no real Portuguese form
(Random Forest, Lasso, ReLU, softmax) stay in English with no parenthetical.

### The rule that governs all three

**Never machine-translate between modes. Regenerate.** Analogies and idioms are born in a
language, not translated into it — "demissor sumário" and "freio de mão" have no English
original, and "pulling yourself up by your bootstraps" has no Portuguese one. When the same
chapter is requested in a second mode, write it again from the source, choosing analogies
that are everyday and physical *in that language*. A translated study guide reads like a
translated study guide, and the analogies are exactly what stops working.

**Token note:** Portuguese generation consumes roughly 15–25% more tokens than English due
to less efficient tokenization. Account for this in limits and cost estimates.

---

## PART 4 — DESIGN SYSTEM

### 4.1 Typography

| Role | Font | Notes |
|---|---|---|
| Body text | Serif | Long-form reading. Georgia is the safe default. |
| Headings, labels, badges, tables | Sans-serif | Segoe UI / Helvetica Neue / Arial stack |
| Math | KaTeX | Rendered, never raw LaTeX |

**Font licensing warning:** the serif used in Anthropic's Claude identity is proprietary
and cannot be used in this app. Open alternatives with similar editorial character:

- **Source Serif 4** (SIL OFL) — closest general match
- **Crimson Pro** (OFL) — warmer, book-like
- **Newsreader** (OFL) — editorial, slightly more contemporary
- **Literata** (OFL) — designed for screen reading

Georgia remains a valid web-safe fallback and is what the reference PDFs use.

Base size: 10–10.6pt body, line-height 1.45–1.5. Dense but readable.

### 4.2 Color system

Each document family has an accent color; box colors are constant across families.

| Family | Accent | Part bar |
|---|---|---|
| Supervised ML | `#0b6e5f` (teal) | `#10322c` |
| Deep Learning | `#5b3fb0` (purple) | `#2e2058` |
| Unsupervised | `#0e7490` (cyan) | `#0b4553` |
| Foundations | `#0e7490` (cyan) | `#0b4553` |

Box colors (constant):

| Box | Background | Border | Text |
|---|---|---|---|
| Intuition (A INTUIÇÃO PRÁTICA) | `#fff7ec` | `#e8a33d` | `#4a3a1c` |
| Deep-dive (PRA FIXAR) | `#eef2ff` | `#5b6fd6` | `#293568` |
| Answer | `#eefaf3` | `#2f9e68` | `#155f3c` |
| Theory | `#fff7ec` | `#e8a33d` | `#5a4318` |
| Trap | `#fdf0ed` | `#c0392b` | `#5e2018` |
| Recap | tinted with accent | accent-light | accent-dark |
| Math block | `#f6f6fb` | `#dfe3ea` | — |

All boxes: `border-radius: 6–7px`, `border-left: 4–5px solid` (the accent stripe is the
visual signature).

### 4.3 Components

- **Part bar:** full-width dark bar, white uppercase text, letter-spacing .09em, border-radius 5px
- **Section number:** accent-colored rounded square with white bold number
- **Question number:** same, smaller, inline before the question text
- **Badge (AI ENGINEER):** pill, light blue background `#e8f6ff`, border `#a9d6ee`, text `#0b5f8a`
- **Tables:** accent header with white text, alternating row background `#faf9fe`, 1px `#dfe3ea` borders
- **Print rules:** `break-inside: avoid` on every box and table; `break-after: avoid` on headings

### 4.4 The language toggle (liquid glass)

Top-right, fixed. Sliding pill toggle, not a dropdown (faster, prettier).

CSS ingredients:

- `backdrop-filter: blur(12px)` — the actual glass effect
- Semi-transparent background: `rgba(255,255,255,0.15)` on dark, `rgba(0,0,0,0.05)` on light
- `border: 1px solid rgba(255,255,255,0.25)` — the subtle rim
- `border-radius: 999px` (full pill)
- Soft elevation shadow
- `transition: 200ms` on the sliding indicator

Two caveats: (1) `backdrop-filter` needs visual interest behind it — over flat white it is
nearly invisible, so place it over a gradient or content; (2) verify text contrast for
accessibility.

With three content modes, use three segments (EN | PT | BI) or a compact dropdown.

---

## PART 5 — LANGUAGE DETECTION CASCADE

Priority order (do not lead with geolocation):

1. **Saved preference** (localStorage / cookie) — always wins if present
2. **Accept-Language header** — reflects the user's actual OS setting; free, instant, reliable
3. **IP geolocation** — tie-breaker only (on Vercel, `x-vercel-ip-country` comes free)
4. **Fallback:** English

Why not geo-first: the owner of this app is a Brazilian living in New York — geo would serve
him English when he likely wants Bilingual. VPNs break it. Travelers get the wrong language.
Accept-Language is the industry standard for good reason.

---

## PART 6 — TECHNICAL PIPELINE

### 6.1 Generation stages

| Stage | Work | LLM? |
|---|---|---|
| 1. Ingestion | PDF → text extraction (`pdftotext -layout`), section location, page-offset detection | No — pure code |
| 2. Pocket Guide | Extracted text + blueprint → structured HTML | Yes — strongest model |
| 3. Derivatives | Pocket Guide → flashcards, quiz, cheat sheet | Yes — cheaper model |
| 4. Rendering | HTML → PDF via Playwright + headless Chromium | No — pure code |

**Key architectural insight:** derivatives read the Pocket Guide, not the original PDF.
This cuts roughly 70% of tokens in stage 3.

### 6.2 Rendering specifics (validated approach)

- Playwright + Chromium headless, `page.pdf(format="A4", print_background=True)`
- KaTeX copied locally into the build directory (`katex.min.css`, `katex.min.js`,
  `auto-render.min.js`, plus `fonts/`) so font paths resolve
- Auto-render with delimiters `$$...$$` (display) and `$...$` (inline)
- Set `window.__katexDone = true` after render; Playwright waits on that flag before printing
- `@page { size: A4; margin: 14mm 13mm 15mm 13mm }` and page margins zeroed in `page.pdf()`

**Known pitfall — the dollar sign bug:** literal currency (USD 450,000 written with the
symbol) is parsed as a KaTeX delimiter and silently corrupts the document. Always write
currency as `USD 450,000` in prose, or escape it. Validate after render with:
`pdftotext output.pdf - | grep -c '\$'` — expect 0.

**Generate in sections, not monolithically.** A 20+ page document generated in one call
risks truncation and drift. Generate part1/part2/part3 and concatenate. Also allows
regenerating one weak block instead of the whole document.

### 6.3 Validation checks after every render

- Page count is plausible
- Zero stray `$` characters
- No raw LaTeX commands leaked (`grep -iE '\\frac|\\partial'`)
- Rasterize 2–3 pages and visually inspect (`pdftoppm -jpeg`)

---

## PART 7 — MODEL SELECTION & COST

### 7.1 Recommended routing

| Stage | Model tier | Rationale |
|---|---|---|
| Extraction | none | Code only — never spend tokens here |
| Pocket Guide / Exam Review | Sonnet (escalate to Opus if shallow) | Defines quality of everything downstream |
| Quiz generation | Sonnet | Needs judgement for plausible distractors |
| Flashcards | Sonnet or Haiku | Mechanical transformation |
| Cheat sheet | Haiku | Extraction and compression |

**Principle:** strong model where there is judgement and creation; cheap model where there
is mechanical transformation. This routing decision is itself a core AI-engineering skill.

### 7.2 Cost estimation (order of magnitude — verify current pricing)

Per chapter, roughly:

- Pocket Guide: ~30k input + ~25k output
- Flashcards: ~25k input + ~5k output
- Quiz: ~25k input + ~5k output
- **Total: ~80k input + ~35k output**

Output dominates cost (typically ~5× input rate). At Sonnet tier this lands in the low
single-digit dollars per chapter; at Opus, several times that. For personal use
(3–4 chapters/month), the monthly cost is comparable to a streaming subscription.

⚠️ Pricing changes. Confirm current rates at the Anthropic pricing page before committing.

### 7.3 Cost levers

1. **Prompt caching** — the blueprint is long and identical every run. Cache it. Largest single saving.
2. **Derivatives read the guide, not the book** — ~70% token reduction in stage 3.
3. **Sectioned generation** — enables regenerating only the weak block.
4. **Cache extracted text** — never re-parse the same PDF.

---

## PART 8 — APP ARCHITECTURE

### 8.1 Stack

- **Next.js** — frontend + API routes in one project
- **SQLite** (dev) / **Postgres** (prod) — generated materials, metadata
- **Anthropic SDK** — generation calls
- **Playwright** — PDF rendering
- **Vercel or Railway** — deploy (note: Playwright needs a runtime that supports it;
  Railway or a container is safer than Vercel serverless for the render step)

### 8.2 Data model (essentials)

```
Material
  id, topic, description, language (en|pt|bilingual),
  document_type (pocket_guide|exam_review),
  source_file_ref, status (pending|generating|done|failed),
  html, pdf_path, created_at

Flashcard
  id, material_id, front, back, tags

QuizQuestion
  id, material_id, question, answer, explanation, trap, is_multi_select
```

**Key:** a material is identified by (topic + language), not topic alone — the same chapter
can exist in several language modes.

### 8.3 Critical implementation note

Run generation as a background job with status polling. A full Pocket Guide takes minutes
and will blow past any HTTP request timeout. The UI should show staged progress:
"extracting → generating guide → generating cards → rendering PDF".

### 8.4 Build order (do not build everything at once)

- **Phase 1 — Core:** upload PDF → generate Pocket Guide → render PDF. This alone is ~80% of the value.
- **Phase 2:** flashcards + Anki export (TSV/CSV, `front;back`, semicolon-separated)
- **Phase 3:** interactive quiz inside the app (active recall built in)
- **Phase 4:** library — history, search, organization by course

### 8.5 Regenerate vs. translate

When a user requests an existing material in another language: **regenerate from source.**
Do not translate. Costs more tokens, but translated didactic material loses the analogies
that make it work.

---

## PART 9 — THE STUDY PROCESS THE APP SUPPORTS

The app is a tool inside a larger method. Five phases:

1. **Summary** — generate the Pocket Guide; read it once, without trying to memorize
2. **Retrieval quiz** — close the guide; answer questions from memory; note weak concepts
3. **Flashcards** — generated from the guide, weighted toward what was weak in phase 2; exported to Anki
4. **Spaced repetition** — owned by Anki, not the app (its SM-2 algorithm and daily reminders
   are better than anything hand-rolled)
5. **Anchor project** — when enough concepts accumulate, stop summarizing and build something

Flashcard authoring rules:

- One concept per card — never two
- Front = a question forcing recall, not recognition
- Back = the minimum answer that proves understanding, plus one "why it matters in practice"
  line for AI-Engineer concepts
- Prioritize concepts the user got wrong

---

## PART 10 — REFERENCE DOCUMENTS PRODUCED

These are the quality benchmark. Any generated output should be comparable.

| Document | Type | Pages | Notes |
|---|---|---|---|
| ML/DL Foundations Primer | A | 8 | 22 base concepts, EN body + PT PRA FIXAR |
| CSCA5622 Resampling & Shrinkage | A | 6 | ISLP Ch. 5 & 6.2 |
| CSCA5622 Trees & Ensembles | A | 5 | ISLP Ch. 8 |
| CSCA5622 Final Mega Review | B | 8 | Full supervised-ML course |
| DL Mod 1 — Linear to Neural Nets | A | 6 | D2L Ch. 3, 5, 12 |
| DL Mod 2 — Regularization & Optimizers | A | 5 | D2L 3.7, 5.5–5.6, 12.4–12.10 |
| DL Mod 3 — CNNs | A | 5 | D2L 7.1–7.6, 8.1–8.6 |
| **DL Final Exam Review (EN)** | **B** | **23** | **63 questions, 5-line THEORY boxes ← gold standard** |
| Unsupervised Learning Final Review (EN) | B | 17 | 46 questions, ISLP Ch. 12 |

The DL Final Exam Review is the reference for Type B quality. When in doubt about depth,
match it.

---

## PART 11 — OPEN DECISIONS

Items deliberately left unresolved, to decide during build:

1. **Font choice** — Source Serif vs. Crimson Pro vs. Literata (all OFL). Test with real content.
2. **Question-bank handling** — when the user supplies an answer key without prompts (as
   happened with the Unsupervised guide), the app must reconstruct questions and disclose
   that on the cover.
3. **Consolidation policy** — related answers should be merged into one comprehensive
   question rather than inflating question count with near-duplicates.
4. **Eval strategy** — the most important unsolved problem. How do you automatically detect
   that a generated guide is shallow? Candidate signals: THEORY box average length, ratio of
   formulas to prose, presence of cross-links, analogy presence in every intuition box.

> **Status of the open decisions as of the Phase 1 scaffold (2026-08-27):**
> #2 and #3 are implemented as rules in `prompts/task-exam-review.md`.
> #4 has a first implementation in `src/lib/validate.ts` — mechanical checks derived from
> the blueprint rules, run at the end of every pipeline run. #1 is still open: the renderer
> ships with Georgia and the OFL candidates listed as fallbacks in the stylesheet.

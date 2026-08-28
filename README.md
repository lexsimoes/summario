# summario

Study guides built from your own source material. Upload a textbook, point at a
chapter, get a print-ready pocket guide: intuition in your language, technical
vocabulary in the language of the field, formulas rendered, traps marked.

The content rules live in `prompts/blueprint.md`; the full reasoning behind them
is `docs/MASTER_BLUEPRINT.md`. Editing the prompt files changes the product.
Editing `src/lib/` changes the plumbing.

## Setup

```bash
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm install                 # postinstall copies KaTeX into public/vendor
npm run setup:browser       # playwright install chromium
npm run models              # list the model ids your key can call, paste into .env
npm run seed -- --email you@example.com --password "…" --name "Lex"
npm run dev                 # http://localhost:3000
```

`npm run seed` also generates `SESSION_SECRET` into `.env` if it is missing, and
grants the account its welcome credits. Re-running it resets that account's
password. `pdftotext` must be on PATH: `brew install poppler` on macOS,
`apt-get install poppler-utils` on Debian.

## The site

- `/` — the marketing page, in Portuguese or English. The language follows the
  blueprint's cascade: saved cookie → `Accept-Language` → English. Geolocation
  deliberately does not lead; the owner is a Brazilian in New York, so geo
  guesses wrong on day one.
- `/login` — invite-only. There is no sign-up flow: accounts are created with
  `npm run seed`.
- `/app` — overview, `/app/new`, `/app/history`, `/app/credits`.

The site inherits the generated document's visual language on purpose: same
serif, same purple, same box colors. The homepage renders real guide fragments
with the document's own CSS classes, so the page and the product are the same
object.

## Credits

One credit is one pocket guide; an exam review costs two. `credit_ledger` is
append-only and the balance is `SUM(delta)` — never a mutable column, so the
history and the number on screen cannot disagree. Credits are charged when a job
starts and refunded automatically if it fails.

An account with `plan = 'owner'` is never blocked by balance, but consumption is
still metered, so the owner's dashboard shows exactly what a paying user's
would.

## The generation pipeline

| Stage | Work | Model |
|---|---|---|
| Ingestion | `pdftotext -layout`, section slicing, extract cache | none — pure code |
| Plan | thematic blocks and unit counts as JSON | planner model, ~3k out |
| Generate | one call per part, source block prompt-cached | guide model |
| Render | Chromium prints the HTML, KaTeX served from disk | none — pure code |
| Validate | content-quality + render-integrity checks | none — pure code |

The plan step exists so a 20-page document does not drift, and so a single weak
part can be regenerated without rebuilding the whole thing. The source extract is
sent as a cached block, so parts 2..n read it from cache rather than paying for
it again — as are the blueprint, the analogy registry, and the task prompt.

Headless, without the web app — the fastest loop while tuning the prompt:

```bash
npm run generate -- \
  --pdf ~/books/d2l.pdf \
  --topic "Convolutional Neural Networks" \
  --scope "Chapter 7, sections 7.1-7.6" \
  --from 7.1 --to 7.6 \
  --family deep_learning --lang bilingual
```

Add `--questions bank.txt` for a Type B exam review; `--model` and `--tag` to
compare two models on the same chapter side by side.

Check the render path without spending a token:

```bash
npm run render -- fixtures/sample.html
```

## The quality checks

`src/lib/validate.ts` is the answer to "how do you know the guide came out
shallow". Every check maps to a rule in the blueprint, not to a vibe:

- every section opens with an intuition box, and no intuition box contains math
- deep-dive boxes stay rare (ratio ceiling), so the box keeps its signal value
- theory boxes average 45+ words and none falls under 25 — the shallow failure
  mode is a theory box that restates the answer
- traps are selective, not universal
- at least three cross-links, at least one AI ENGINEER badge, formulas present
- **no language leakage** — function-word counting per box: in `en` no Portuguese
  survives, in `pt` no English outside the parenthetical allowed for technical
  terms, in `bilingual` the intuition/deep-dive/trap boxes read Portuguese while
  the answer/theory/recap boxes read English
- **no literal `$` anywhere** — it is a KaTeX delimiter and silently corrupts the
  document. Write `USD 450,000`. Checked in the HTML *and* again in the rendered
  PDF text.
- no raw LaTeX survived rendering, page count plausible

They run at the end of every pipeline run and show up on the document page. None
of them proves depth; a document failing several is reliably weak.

## Known limits

- **Jobs are in-process.** `src/lib/jobs.ts` runs generation inside the Next.js
  process and keeps status in SQLite. Right for a single-user instance; replace
  with a real queue before this serves more than one person.
- **Playwright needs a real runtime.** Vercel's serverless functions are a bad
  fit for the render step — Railway, Fly, or any container is safer.
- **Scanned PDFs produce an empty extract.** OCR them first; the API refuses
  anything under 500 characters rather than generating from nothing.
- **Credit purchase is not wired.** The packs on the homepage and the button in
  `/app/credits` are deliberately inert until there is a checkout behind them.
- **Model ids and prices drift.** `npm run models` asks the API instead of
  trusting a hardcoded list.

## Layout

```
prompts/          blueprint (content rules), analogy registry, task prompts
docs/             the master blueprint — the reasoning behind the rules
src/app/          marketing page, login, dashboard, API routes
src/components/   brand, nav, language toggle, the sample guide fragment
src/lib/          extract · generate · render · validate · db · auth · credits
scripts/          seed, CLI runner, katex setup, model listing, render probe
fixtures/         sample.html — exercises the design system with no API call
data/             gitignored: uploads, extract cache, generated materials, sqlite
```

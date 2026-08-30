# summario

Study guides built from your own source material. Upload a textbook, point at a
chapter, get a print-ready pocket guide: intuition in your language, technical
vocabulary in the language of the field, formulas rendered, traps marked.

The content rules live in `prompts/blueprint.md`; the full reasoning behind them
is `docs/MASTER_BLUEPRINT.md`. Editing the prompt files changes the product.
Editing `src/lib/` changes the plumbing.

## Two ways to source a guide

**From your own material.** Upload the book, give the section range, and nothing
outside that slice is ever read.

**From the open web.** No textbook at hand? The platform searches for
authoritative sources, reads the pages, and builds the extract from them — then
runs the identical pipeline. The fidelity rule does not bend for this: the
generator still writes only from a supplied extract and still refuses to invent.
Letting a model write a study guide from memory produces something plausible,
unverifiable and occasionally wrong, which in study material is worse than
useless — you memorise the error. So the sources are real, they are listed at the
end of the document, and a validator check fails the guide if they are missing.

## Domain profiles

The blueprint describes the *format* and is subject-agnostic: the same structure
works for deep learning, Roman law or pharmacology. What is specific to a field —
the analogy registry, the established cross-links, an optional practitioner badge
— lives in `prompts/profiles/`.

```bash
ESTUDO_PROFILE=machine-learning   # or leave empty
ESTUDO_REQUEST_TIMEOUT_MS=480000  # per API call; a stall fails the job and refunds
ESTUDO_MAX_RETRIES=2
# ESTUDO_CHROMIUM_PATH=/usr/bin/chromium  # only if not using Playwright's own
```

With no profile set, only the universal rules apply, and no badge is emitted.
Adding a field is copying `prompts/profiles/machine-learning.md` and replacing
its contents; no code changes.

## Deploy

Built as a container because the render step needs a real runtime: Chromium for
the PDF, `pdftotext` for extraction, and a writable disk for the SQLite file and
the generated documents. Serverless platforms cannot host it — their filesystem
is ephemeral, the bundle cannot carry Chromium, and a generation takes minutes.

```bash
docker build -t summario .
docker run -p 3000:3000 -v summario-data:/data --env-file .env summario
```

Mount a persistent volume on `/data`, or a redeploy wipes the accounts, the
credit history and every generated PDF.

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
- `/login` — invite-only. There is no open sign-up: the first account comes from
  `npm run seed`, and everyone after that comes from an invite the owner
  generates.
- `/join/<token>` — the invite link. Single use, good for seven days, carrying a
  credit grant the owner sets per invite. Only the token's SHA-256 is stored, so
  the link lives in the clipboard it was copied to and nowhere else.
- `/app` — overview, `/app/new`, `/app/history`, `/app/credits`, and, for the
  owner account only, `/app/admin` (invite, disable, delete, adjust credits) and
  `/app/audit`. A finished document at
  `/app/documents/<id>` carries its study set: quiz, flashcards, project briefs.

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
| Derive (on demand) | quiz, flashcards and project briefs from the guide's HTML | derivative model |

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

## The study set

The guide is the reference layer. Retrieval is a different job, and a finished
guide grows the rest of it on demand — a button on the document page, no credit
charged, regenerate whenever:

- **A retrieval quiz.** One question at a time, answer from memory, reveal, mark
  it hit or missed. The explanation and the classic trap come with the answer.
- **Flashcards.** Click to flip, and **exported to Anki** as TSV — spacing is
  Anki's job, and its SM-2 beats anything hand-rolled here.
- **Project briefs.** Two or three applied projects built from that guide's own
  concepts, for the point where summarising stops paying.

The quiz and the deck are one mechanism. Every card and question carries a
concept tag from a shared vocabulary: miss a question and its concept is marked
weak, and the deck reorders to put those cards first.

Derivatives read the **guide's HTML**, never the original PDF — roughly 70% fewer
tokens, and it keeps the cards consistent with the document the reader actually
has. One call on `ESTUDO_MODEL_DERIVATIVE`.

## The quality checks

`src/lib/validate.ts` is the answer to "how do you know the guide came out
shallow". Every check maps to a rule in the blueprint, not to a vibe:

- every section opens with an intuition box, and no intuition box contains math
- deep-dive boxes stay rare (ratio ceiling), so the box keeps its signal value
- theory boxes average 45+ words and none falls under 25 — the shallow failure
  mode is a theory box that restates the answer
- traps are selective, not universal
- at least three cross-links, formulas present
- **web-sourced guides disclose their sources** — a guide assembled from the web
  that does not say where it came from is the thing that mode exists to prevent
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

## Security posture

Session cookies are `httpOnly`, `sameSite=lax` and `secure` in production;
passwords are scrypt-hashed; a missing account and a wrong password take the same
time, so response timing does not enumerate valid emails. Redirect targets are
validated as same-site paths. Static security headers are set in
`next.config.mjs`; the **Content-Security-Policy** is in `src/middleware.ts`,
where a fresh nonce can be minted per request for Next's inline hydration scripts
(`strict-dynamic` covers the chunks it loads).

Login is rate limited to eight attempts per ten minutes, per address and per
account. The counter lives in **SQLite**, not in process memory — this app
restarts on every push, and an in-memory limiter would hand out a fresh budget
each time.

An **audit log** records sign-ins, failed and throttled attempts, sign-outs,
generations, study sets, refunds and grants, append-only, with the client
address. `/app/audit` shows the last 200, owner-only.

Not done yet, and worth knowing: `style-src` still allows `'unsafe-inline'`,
because the app styles through inline `style` attributes and nonces do not apply
to those — tightening it means removing them first. The generated-document routes
are exempt from the CSP by design (that HTML has its own inline KaTeX boot
script).

## Known limits

- **Jobs are in-process, but the queue is durable.** `src/lib/jobs.ts` runs
  generation inside the Next.js process, one job at a time, off a `jobs` table.
  A restart re-queues whatever was running rather than losing it. Still one
  worker in one process: replace it with a real queue before this serves more
  than one person.
- **Playwright needs a real runtime.** Vercel's serverless functions are a bad
  fit for the render step — Railway, Fly, or any container is safer.
- **Scanned PDFs produce an empty extract.** OCR them first; the API refuses
  anything under 500 characters rather than generating from nothing.
- **Credit purchase is not wired.** The packs on the homepage and the button in
  `/app/credits` are deliberately inert until there is a checkout behind them.
- **Model ids and prices drift.** `npm run models` asks the API instead of
  trusting a hardcoded list.

## Keeping the docs honest

Three files carry the project's reasoning, and a change that contradicts one of
them is not finished until that file is updated:

- **`prompts/blueprint.md`** — the rules the generator must follow. Changing
  behaviour without changing this means the code and the spec disagree, and the
  spec is what the model actually reads.
- **`docs/MASTER_BLUEPRINT.md`** — why the rules are what they are. Reversals are
  marked in place rather than rewritten, so the earlier reasoning stays legible.
- **`CHANGELOG.md`** — what changed and why, newest first.

## License

MIT — see `LICENSE`.

## Layout

```
prompts/          blueprint (universal format), task prompts, study-set prompt
prompts/profiles/ per-field analogy registries, cross-links and badges
docs/             the master blueprint — the reasoning behind the rules
src/app/          marketing page, login, dashboard, API routes
src/middleware.ts the Content-Security-Policy and its per-request nonce
src/components/   brand, nav, language toggle, the sample guide fragment
src/lib/          extract · generate · derive · render · validate · db · auth
                  · credits · jobs · audit · rate-limit
scripts/          seed, CLI runner, katex setup, model listing, render probe
fixtures/         sample.html — exercises the design system with no API call
data/             gitignored: uploads, extract cache, generated materials, sqlite
```

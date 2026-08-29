# summario — working notes

Context for anyone (human or model) picking this repo up mid-flight.

## What it is
A self-hosted, specification-driven study-material generator. Upload a chapter
(or pick web sourcing) and it writes a Pocket Guide, renders it to PDF and
validates the result mechanically. `prompts/blueprint.md` is the specification
the model actually reads; `docs/MASTER_BLUEPRINT.md` is the human-readable
version of the same thing.

## Decisions in force
- **Model: Opus 5 for the guide.** Single user for now, and the guide is the
  quality lever — everything downstream is derived from it. Cheaper tiers to be
  compared later, by hand. `ESTUDO_MODEL_PLANNER` stays empty on purpose: the
  prompt cache is per-model, so a different planner forces a second cache write
  of the whole extract and costs more than the tier saves.
- **No assistant prefill.** Current models reject it outright. The parsers in
  `src/lib/generate.ts` are tolerant instead.
- **Domain profiles are opt-in.** `prompts/blueprint.md` holds only universal
  format rules; field-specific content (analogy registry, badges) lives in
  `prompts/profiles/<name>.md` and loads only when `ESTUDO_PROFILE` is set.
- **Credits are charged at job start and refunded on failure.** The ledger is
  append-only; balance is `SUM(delta)`. The study set is the exception: it is
  derived from a guide already paid for and costs nothing.
- **Jobs run in-process, off a durable queue.** One worker, one job at a time,
  claimed from the `jobs` table. Still the seam to replace with a real queue
  later. A restart no longer loses work: `resumeJobs()` runs from
  `src/instrumentation.ts` on every boot and re-queues what was running, failing
  and refunding only what has spent its retry budget.
- **Derivatives read the guide's HTML, never the source.** ~70% fewer tokens, and
  the cards stay consistent with the document the reader has.
- **The build is Turbopack.** Next 15.5's webpack path cannot bundle middleware
  on Node 22 at all (`WebpackError is not a constructor`, from inside its own
  minifier), and 15.5.24 is the end of that line. Do not "simplify" `npm run
  build` back to plain `next build` — it will fail the moment `src/middleware.ts`
  exists, which is where the CSP lives.

## Verification
Typecheck and build are **not** verification — three shipped bugs passed both.
Run the thing:
- `npm run render -- fixtures/sample.html` exercises Chromium + KaTeX + the PDF
  validators with no API key.
- A real generation has to be run on the deployed instance, which is the only
  place the API key lives.

## Deploy
Coolify on a Hostinger VPS, auto-deploy from a GitHub push webhook on `main`.
**A push restarts the container and kills any generation in flight** — confirm
nothing is running before pushing.

## Secrets
The API key lives only in Coolify's environment and in a local `.env`
(gitignored, chmod 600). Never commit it, never paste it into a form on the
user's behalf, never write it into docs or memory.

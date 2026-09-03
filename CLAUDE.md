# summario — working notes

Context for anyone (human or model) picking this repo up mid-flight.

## What it is
A self-hosted, specification-driven study-material generator. Upload a chapter
(or pick web sourcing) and it writes a Pocket Guide, renders it to PDF and
validates the result mechanically. `prompts/blueprint.md` is the specification
the model actually reads; `docs/MASTER_BLUEPRINT.md` is the human-readable
version of the same thing.

## Decisions in force
- **Two product routes, with quality preserved.** With purchased credits, Opus 5
  plans and writes the complete guide and unlocks its Sonnet-generated study
  set. With no balance, every member gets one Sonnet 5 PDF per UTC month, with
  no derivatives. Purchased credits are consumed before the free allowance and
  never expire. A failed free job restores the month's entitlement just as a
  failed paid job refunds its credit. `ESTUDO_MODEL_PLANNER` remains the paid
  default; a per-request model pins every free planning/writing/research call to
  Sonnet so a free job cannot drift back to Opus.
- **No assistant prefill.** Current models reject it outright. The parsers in
  `src/lib/generate.ts` are tolerant instead.
- **Domain profiles are opt-in.** `prompts/blueprint.md` holds only universal
  format rules; field-specific content (analogy registry, badges) lives in
  `prompts/profiles/<name>.md` and loads only when `ESTUDO_PROFILE` is set.
- **Credits are charged at job start and refunded on failure.** The ledger is
  append-only; balance is `SUM(delta)`. Monthly free usage lives separately in
  `free_guide_usage`, because an expiring entitlement must not contaminate the
  non-expiring credit ledger. Study sets cost nothing but are available only on
  credit-backed guides.
- **Access is invite-only; there is no self-signup.** The owner creates
  single-use invite links from `/app/admin`, and only the token's SHA-256 is
  stored. Disabling an account is reversible and checked on every request, not
  just at sign-in; deleting is irreversible and takes the rendered PDFs off the
  volume as well as the rows. Admin API routes answer 404, never 403.
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
- The admin and invite flows can be exercised end to end with no API key at all:
  seed two accounts, `npm start`, and drive the routes with fetch. Structure
  checks are not enough here — the interesting failures (a disabled user's live
  cookie, a PDF left on disk after a delete) only show up against a real server
  and a real database file.
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

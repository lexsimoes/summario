# Changelog

What changed and why. Entries are newest first. The *why* matters more than the
*what* here — most of these were reversals of an earlier decision, and the
reasoning is the part worth keeping.

## Unreleased

### A job can no longer hang forever, and a restart no longer eats a credit
Two halves of the same failure. A generation sat on "writing" for several minutes
and never moved, and nothing in the system could end it: the API calls had no
timeout of their own, and jobs live in the server process's memory, so a deploy
that restarts the container loses the worker while the row still says
`generating`. The credit stayed spent.

Now every Anthropic call carries an explicit timeout and retry budget
(`ESTUDO_REQUEST_TIMEOUT_MS`, `ESTUDO_MAX_RETRIES`), so a stalled request fails
the job — and the runner already refunds on failure. And on every server start
`recoverStrandedJobs()` marks anything left mid-generation as failed and refunds
it, with a message that says a restart interrupted it. Prevention and recovery,
because either one alone leaves a way to lose a credit.

### The render path made portable, and a latent file:// bug fixed
`renderPdf` built its navigation URL as `file://` plus whatever path it was
handed. In the app that path is always absolute, so this never fired in
production — but any relative `outDir` produced `ERR_INVALID_URL` and killed the
render. The out directory is now resolved and the URL built with `pathToFileURL`,
which is also correct on Windows.

Added `ESTUDO_CHROMIUM_PATH` for self-hosters whose Chromium is not the one
Playwright downloads — a distro package, or an image whose bundled build differs
from the npm package version. Empty, the default, keeps Playwright's own.

### The new-material form lost two fields
The question-bank upload asked for a file nobody has, and the from/to section
inputs asked the user to do by hand what the scope sentence already says. The
scope text is now parsed for a section range instead, so "3.2 to 3.7" works
without two extra boxes. One field fewer between a topic and a document.

### Favicon
The brand mark is the accented "i" of summar·i·o, and its stem is deliberately the
same shape as the accent stripe every box in the generated document carries — one
form, two readings. Deep violet ground so it holds against a light or a dark
browser tab, with the amber dot of the intuition box, which is the element that
opens every section of every guide.

`icon.svg` for modern browsers, `favicon.ico` at 16/32/48 for the rest,
`apple-icon.png` at 180 for iOS, and a theme colour for mobile browser chrome.

### Security headers, and a limit on login attempts
Next ships no security headers by default, and a public site without them relies
on the browser guessing right. Added HSTS, `nosniff`, `X-Frame-Options: DENY`,
a referrer policy, a permissions policy and `Cross-Origin-Opener-Policy`, and
turned off the `X-Powered-By` banner.

Deliberately absent: a Content-Security-Policy. A useful one needs per-request
nonces for Next's inline hydration scripts, and a CSP that is wrong is worse than
none — it either breaks the app or lulls you into thinking you have one.

Login had no rate limit, so a public site accepted unlimited password guesses.
Eight attempts per ten minutes, keyed on both the client address and the account,
so neither a single source nor a distributed attempt on one account gets a free
run. A successful login clears the counter. The limiter is in memory, which is
honest for a single container and is the same boundary the job runner has.

### Documentation caught up with the code
`docs/MASTER_BLUEPRINT.md` still described the field selector, the machine-learning
analogy registry and a single sourcing mode. It is now v1.1, with changes marked
in place rather than silently rewritten, plus a new Part 12 on domain profiles.

### Deploys are automatic
A GitHub webhook triggers Coolify on push to `main`. Before this every deploy was
a manual button click, which is how a fix sat built-and-pushed but not running.

### Stopped using assistant message prefill
Forcing a reply to open with `{` or `<` is the obvious way to stop a model wrapping
its answer in preamble, and it is what the planner and the part generator both did.
Sonnet 5 rejects it: *"This model does not support assistant message prefill."* Every
generation failed at the planning call, in both sourcing modes, and typecheck and
build both passed the whole time — the class of bug that only a real API call finds.

Tolerant parsing replaces it, which works on any model: the JSON reader already found
the object inside surrounding chatter, and `cleanFragment` now drops anything before
the first tag and after the last.

### Redirects behind a reverse proxy, and an open redirect with them
Behind Traefik the request URL the app sees is the container's internal address, so
`NextResponse.redirect(new URL(x, req.url))` sent visitors to localhost — which the
language toggle and sign-out were both doing in production. Relative `Location`
headers need no knowledge of the proxy at all.

The locale route also took its destination straight from the query string.
`//example.com` is a protocol-relative URL, so a crafted link would have carried a
visitor off the site with our domain in front of it. Redirect targets must start with
`/` and not `//`.

### The Field selector is gone, and machine learning left the blueprint
The dropdown asked the reader to pick a machine-learning family. All it ever did was
choose an accent colour, and two of its four options mapped to the same colour. The
subject already arrives in the topic, the scope and the source material, so the
palette is derived from the topic instead — deterministically, so a library of
documents reads as a set.

That was the symptom. The disease was that `prompts/` assumed machine learning
throughout: the analogy registry, the badge, the established cross-links. A guide
about contract law was being generated against instructions to connect it to ridge
regression. The format is universal and stays in the blueprint; the field-specific
material moved to `prompts/profiles/`, with machine learning shipped as the example
and **no profile** as the default. With none selected, no badge is emitted at all.

### Web sourcing
With no upload, the topic is researched with the API's `web_search` tool and the
cited extract feeds the same pipeline. The fidelity rule does not bend: the generator
still writes only from a supplied extract. Sources are injected into the document
rather than generated — asking a model to reproduce URLs it saw earlier is how you
get citations that look right and resolve nowhere — and a validator check fails a
web-sourced guide that lists none.

### The session secret generates itself
Requiring a secret before the app will start is a setup step people get wrong or
skip, and this is meant to be easy to self-host. `SESSION_SECRET` still wins when
set; otherwise one is generated on first boot onto the data volume.

### Material ids are scoped to their owner
The id is the primary key while "same chapter, same language" is a per-user unique
index. Without a user prefix, two users generating the same topic collided on the
primary key and the second insert threw instead of taking the update path. Harmless
with one account, a hard failure on the second.

## 0.1.0 — first deploy

Pocket guides and exam reviews from an uploaded PDF: extraction, a planning call,
one generation call per part with the source prompt-cached, Chromium + KaTeX
rendering, and mechanical quality checks derived from the blueprint. Bilingual
marketing site, invite-only auth, credit ledger, and a container deploy on Coolify.

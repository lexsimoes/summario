# Changelog

What changed and why. Entries are newest first. The *why* matters more than the
*what* here — most of these were reversals of an earlier decision, and the
reasoning is the part worth keeping.

## Unreleased

### Motion and depth, and a frosted nav that had quietly stopped frosting
The site had colour and type but no behaviour: nothing moved, nothing responded,
and depth came from three stacked shadows that read as blur rather than light.

There is a motion system now, in two tiers. Micro (colour, background, border)
runs at 160ms on the default easing — a curve on a 140ms colour change is
invisible work. Macro (transform, layout, shadow) runs at 380ms on one shared
curve that decelerates hard at the end, so movement lands instead of stopping.
One long far-thrown shadow replaces the stack for anything that lifts. Cards lift
on hover only where they promise something; a card that is prose in a box does
not. Sections arrive with a short blur-and-settle as they enter view, the primary
button catches a slow sweep of light, and the page sits on two very faint washes
instead of one flat sheet.

Two things found while verifying it, both worth more than the animation:

**The nav's `backdrop-filter` was doing nothing.** Writing the standard property
next to its `-webkit-` alias made Lightning CSS treat the pair as one prefixed
declaration and emit *only* the `-webkit-` form, so any browser implementing just
the standard property got no blur — silently, since a missing blur looks like a
design choice. It arrived with the Turbopack switch and shipped unnoticed.
Writing only the standard property makes the build emit both.

**The entrance animation could strand content invisible.** A background tab
suspends the IntersectionObserver *and* freezes animations on their first
keyframe, which was the transparent one — so a section could sit at zero opacity
forever. Fixed in three places: the effect never stages anything while the
document is hidden, a failsafe removes the attribute if the observer has not
delivered its guaranteed first callback, and the animation carries no fill-mode
so the resting state is the visible one. Decoration must not be able to hide the
page; that principle is now enforced rather than assumed.

Also dropped `will-change: transform` from the lifting cards. Thirteen
permanently promoted compositing layers is a cost paid on every frame for a
transform that runs only under the pointer, and standing layers feed the same
repaint artefacts the nav comment describes.

### An owner console: invites, disabling, deleting
Adding someone meant running the seed script over SSH, and removing them had no
answer at all. There is a People page now, owner-only.

Invites are single-use links, good for seven days, carrying a credit grant set
per invite — a tester gets 2, a friend gets 20. Only the SHA-256 of the token is
stored, so the link exists in exactly one place, the clipboard it was copied to,
and a database dump grants nobody entry. The URL is composed in the browser from
the origin it actually reached: asking a server behind a reverse proxy to guess
its own public address is how you mail somebody a link to localhost. Claiming an
invite and creating the account are one transaction, so two people opening the
same link cannot both spend it. An invite addressed to an email only works for
that email, and no invite can ever touch an account that already exists.

Removing someone is deliberately two different things. Disabling is reversible,
keeps every row, and is checked on every request rather than only at sign-in — so
it ends the sessions the account already holds instead of waiting thirty days for
a cookie to expire. Signing in to a disabled account answers 403 and says so,
because telling someone their password is wrong sends them to reset a password
that works fine. Deleting is irreversible: rows cascade, and the rendered PDFs
are taken off the volume too, since those do not live in the database. It is
confirmed by typing the email — an OK button is too easy to hit on the wrong row.
Neither action can be aimed at your own account, and the last owner cannot be
deleted.

Every admin route re-checks ownership for itself and answers 404 rather than 403:
a UI that hides a button is not access control, and a 403 confirms the endpoint
exists to somebody who should not know that. Every action lands in the audit log.

Verified by running it, not by compiling it: 49 checks against a live server and
a real SQLite file, covering the perimeter, both invite shapes, the double-use
race, the disable-ends-the-session path, the self-lockout guards, and the
cascade — including that the PDF actually leaves the disk.

### The study loop is finished: quiz, flashcards, Anki export, project briefs
The homepage has described a five-step method since the first deploy — read the
guide, close it and answer, turn gaps into cards, let Anki space them, build
something — and only the first step existed. Four of the five do now.

A finished guide grows a **study set**: a retrieval quiz you self-grade, flashcards
that flip, an Anki export, and two or three applied-project briefs. It is
generated on demand from the guide's own HTML — never the original PDF, which is
the ~70% token saving the blueprint's stage 3 calls for — on the derivative tier,
and it costs **no credit**. Regenerating it replaces the old set outright.

The quiz and the cards are one mechanism, not two features. Every card and every
question carries a concept tag from a shared vocabulary, so a question you miss
marks its concept weak, and the deck reorders to put that concept first. That is
the whole point of the retrieval layer: the cards you see most are the ones you
just proved you could not recall.

Spacing is still Anki's job. The export is TSV rather than the semicolon format
the blueprint first suggested — guide prose is full of semicolons — and every
field is flattened to one line, because Anki reads a bare newline as a record
break.

### Jobs survive a restart instead of being refunded away
The previous fix made a stranded job *fail cleanly and refund*. That was the
right floor, not the right behaviour: a deploy in the middle of a generation
still threw the work away, and this app redeploys on every push to `main`.

Jobs are now rows in the database, claimed by an in-process worker one at a time.
A restart re-queues whatever was running instead of killing it, and the credit
stays spent because the job is about to actually run. Only a job that has already
burned its restart budget is failed and refunded — the redeploy-loop case, where
giving up is correct. The claim is a single transaction, so two containers on one
volume cannot take the same job.

Still an in-process worker, which is still honest for one user. What changed is
that the queue outlives the process, which is the part that was costing work.

### A Content-Security-Policy, with real nonces
Left out until it could be done properly, on the grounds that a wrong CSP is
worse than none. Now in `src/middleware.ts`, which is the only place a per-request
nonce can be minted for Next's inline hydration scripts. `strict-dynamic` lets the
scripts Next loads from the nonced bootstrap inherit trust, so chunk filenames
never have to be enumerated.

`style-src` still carries `'unsafe-inline'`, and that is not an oversight to be
quietly forgotten: the app styles through inline `style` attributes throughout,
and nonces do not apply to style attributes at all. Tightening it means removing
those first.

The generated-document routes are exempt. That HTML is a Chromium-rendered
artifact with its own inline KaTeX boot script; applying the app's policy to it
would break the math in a page the reader opened in order to print.

**The build moved to Turbopack** as part of this. Next 15.5's webpack path fails
to bundle *any* middleware on Node 22 — `WebpackError is not a constructor`, from
inside its own minifier, for a middleware as small as two lines. 15.5.24 is the
end of that release line, so there is no patch to wait for. Turbopack builds the
same app correctly and is the supported path in this version.

### The rate limiter moved into the database
It was a Map in the server process, which was wrong in a way that mattered here:
every push to `main` restarts the container, and an in-memory counter hands
whoever is guessing a fresh budget on each restart. It is a table on the data
volume now, so the count survives a restart — and two containers sharing that
volume count together rather than separately.

### An audit log
The security posture had a hole shaped like "something happened and there is no
way to find out what". Sign-ins, failed and throttled attempts, sign-outs,
generations, study sets, refunds and grants are now recorded append-only, with
the client address. `/app/audit` shows the last 200, owner-only — a member has no
business reading other accounts' sign-in history.

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

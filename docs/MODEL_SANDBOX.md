# Model quality sandbox

This branch exists to test cheaper providers without weakening the production
route. Production remains Claude Sonnet 5 for the monthly free PDF and Claude
Opus 5 for credit-backed complete guides.

The owner-only UI lives at `/app/admin/models`. Its chat-like box accepts either
a PDF plus a scope, or a topic that the selected provider researches on the web.
Set `GOOGLE_API_KEY` and `OPENAI_API_KEY` on the sandbox deployment, use a
separate data volume, and repeat the same input across models. The result page
shows normalized token usage and an estimated token cost; tool-call charges are
reported separately because provider allowances can make their marginal price
zero.

## Candidate order

1. `gemini-2.5-flash-lite` — stable legacy value baseline at USD 0.10/MTok
   input and USD 0.40/MTok output.
2. `gemini-3.8-flash` — current GA cost/performance candidate. Introductory paid
   price through 2026: USD 0.75/MTok input and USD 3.75/MTok output.
3. `gemini-3.5-flash-lite` — current economical Gemini floor at USD 0.30/MTok
   input and USD 2.50/MTok output.
4. `gpt-5.4-mini` — current explicitly Mini-labelled OpenAI value model at USD
   0.75/MTok input and USD 4.50/MTok output.
5. `gpt-5.6-terra` — the stronger current OpenAI tier corresponding roughly to
   Mini in the new family. USD 2/MTok input and USD 12/MTok output.
6. `gpt-4o-mini` remains selectable as a legacy cost reference, not as the
   presumed production winner.
7. Gemini Pro / GPT-5.6 Sol — quality challengers if no value candidate
   gets close enough to the Opus control.

`gemini-2.0-flash-lite` remains visible in the selector for historical context,
but disabled: Google shut the API model down on 2026-06-01, so it cannot produce
a comparison run anymore.

Model IDs and prices are observations, not durable configuration. Verify both
against the provider documentation immediately before each run.

## Fixed experiment

Use the same source extract, topic, scope, language, blueprint and output-token
ceiling for every candidate. Keep each output under a model-specific tag; never
overwrite the Opus control.

The corpus should contain at least eight chapters:

- two mathematical or statistical chapters;
- two conceptual humanities or social-science chapters;
- two software or engineering chapters;
- one dense chapter with many secondary details;
- one weak or ambiguous source that tests whether the model admits uncertainty.

## Blind rubric

Score each dimension from 1–5 without showing the model name to the reviewer.
Editorial dimensions dominate mechanical polish.

| Dimension | Weight |
|---|---:|
| Essential concepts selected | 25% |
| Important material not omitted | 20% |
| Trivia and duplication excluded | 10% |
| Pedagogical order and hierarchy | 15% |
| Fidelity and honest uncertainty | 15% |
| Intuitions, traps and examples | 10% |
| Mechanical validation | 5% |

Record latency, uncached input, cached input, output, tool calls and actual cost
separately. A model advances only if it reaches at least 90% of the Opus control
on the weighted editorial score and passes every hard fidelity check.

## Adapter boundary

Provider work belongs behind a small text-generation interface. The pipeline,
validators and prompts must not gain provider conditionals. Provider adapters
own request formatting, prompt caching, usage normalization and web-search
results. The production Anthropic adapter stays the default until a candidate
passes the complete corpus.

Do not use a provider's free tier with uploaded material. Sandbox calls that
contain user or copyrighted source text must use a paid API project whose terms
exclude product-improvement use of those inputs.

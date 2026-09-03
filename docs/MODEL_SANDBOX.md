# Model quality sandbox

This branch exists to test cheaper providers without weakening the production
route. Production remains Claude Sonnet 5 for the monthly free PDF and Claude
Opus 5 for credit-backed complete guides.

## Candidate order

1. `gemini-2.5-flash-lite` — cheapest credible baseline. Paid-tier list price:
   USD 0.10/MTok input and USD 0.40/MTok output.
2. `gpt-5.6-luna` — cheapest OpenAI baseline. USD 0.20/MTok input and USD
   1.20/MTok output.
3. Gemini Flash-class model — test only if Flash-Lite loses too much editorial
   judgement; choose the current stable ID when the adapter is implemented.
4. Gemini Pro / GPT-5.6 Terra — quality challengers if the inexpensive models
   fail but still reveal that another provider can follow the blueprint.

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

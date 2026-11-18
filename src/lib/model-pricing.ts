/** Standard paid API rates in USD per million tokens. */
export const MODEL_PRICES: Record<string, { input: number; cached: number; output: number }> = {
  'claude-opus-5': { input: 5, cached: 0.5, output: 25 },
  'claude-opus-5-5': { input: 4, cached: 0.2, output: 20 },
  'claude-sonnet-5-5': { input: 2, cached: 0.1, output: 10 },
  'gemini-2.5-flash-lite': { input: 0.1, cached: 0.01, output: 0.4 },
  'gemini-3.5-flash-lite': { input: 0.3, cached: 0.03, output: 2.5 },
  'gemini-3.8-flash': { input: 0.75, cached: 0.075, output: 3.75 },
  'gemini-4-hydrogen': { input: 1.5, cached: 0.075, output: 7.5 },
  'gpt-4o-mini': { input: 0.15, cached: 0.075, output: 0.6 },
  'gpt-5.4-mini': { input: 0.75, cached: 0.075, output: 4.5 },
  'gpt-5.6-terra': { input: 2, cached: 0.2, output: 12 },
  'gpt-6-luna': { input: 0.1, cached: 0.01, output: 0.5 },
  'gpt-6.2-sol': { input: 2, cached: 0.1, output: 10 },
  'gpt-6.2-astra': { input: 8, cached: 0.4, output: 40 },
}

/** OpenAI Responses API web search: USD 10 / 1,000 calls. */
export const OPENAI_WEB_SEARCH_COST = 0.01

export function estimatedModelCost(model: string, usage: { input: number; output: number; cached: number }) {
  const price = MODEL_PRICES[model]
  if (!price) return null
  const uncachedInput = Math.max(0, usage.input - usage.cached)
  return (uncachedInput * price.input + usage.cached * price.cached + usage.output * price.output) / 1_000_000
}

export function estimatedSearchCost(model: string, searches: number) {
  return model.startsWith('gpt-') ? searches * OPENAI_WEB_SEARCH_COST : 0
}

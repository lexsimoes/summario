/** USD per million tokens, checked against provider price pages on 2026-09-03. */
export const MODEL_PRICES: Record<string, { input: number; cached: number; output: number }> = {
  'claude-opus-5': { input: 5, cached: 0.5, output: 25 },
  'gemini-2.5-flash-lite': { input: 0.1, cached: 0.01, output: 0.4 },
  'gemini-3.5-flash-lite': { input: 0.3, cached: 0.03, output: 2.5 },
  'gemini-3.8-flash': { input: 0.75, cached: 0.075, output: 3.75 },
  'gpt-4o-mini': { input: 0.15, cached: 0.075, output: 0.6 },
  'gpt-5.4-mini': { input: 0.75, cached: 0.075, output: 4.5 },
  'gpt-5.6-terra': { input: 2, cached: 0.2, output: 12 },
}

export function estimatedModelCost(model: string, usage: { input: number; output: number; cached: number }) {
  const price = MODEL_PRICES[model]
  if (!price) return null
  const uncachedInput = Math.max(0, usage.input - usage.cached)
  return (uncachedInput * price.input + usage.cached * price.cached + usage.output * price.output) / 1_000_000
}

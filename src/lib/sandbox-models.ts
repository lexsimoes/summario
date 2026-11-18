export const SANDBOX_MODEL_OPTIONS: ReadonlyArray<{
  value: string; label: string; note: string; disabled?: boolean
}> = [
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', note: 'Opção econômica da linha Gemini' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'Referência de qualidade da linha Flash' },
  { value: 'gpt-6-luna', label: 'GPT-6 Luna', note: 'Opção econômica da OpenAI' },
  { value: 'gpt-6.2-sol', label: 'GPT-6.2 Sol', note: 'Modelo geral da OpenAI' },
  { value: 'gpt-6.2-astra', label: 'GPT-6.2 Astra', note: 'Modelo avançado da OpenAI, com custo maior' },
  { value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Modelo geral da Anthropic' },
  { value: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Modelo avançado da Anthropic, com custo maior' },
]

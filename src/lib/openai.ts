import { config } from './config'

interface OpenAIResponse {
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
      annotations?: Array<{ type?: string; url?: string; title?: string }>
    }>
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
    input_tokens_details?: { cached_tokens?: number }
  }
  error?: { message?: string }
}

async function request(body: Record<string, unknown>) {
  if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY is not set')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.openaiApiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json() as OpenAIResponse
    if (!res.ok) throw new Error(`OpenAI API: ${data.error?.message || res.statusText}`)
    return data
  } finally {
    clearTimeout(timeout)
  }
}

const outputText = (data: OpenAIResponse) => data.output
  ?.flatMap((item) => item.content ?? [])
  .filter((part) => part.type === 'output_text')
  .map((part) => part.text ?? '')
  .join('') ?? ''

const usage = (data: OpenAIResponse) => ({
  inputTokens: data.usage?.input_tokens ?? 0,
  outputTokens: data.usage?.output_tokens ?? 0,
  cachedTokens: data.usage?.input_tokens_details?.cached_tokens ?? 0,
})

export async function callOpenAI(opts: {
  model: string
  system: string
  content: string
  maxTokens: number
}) {
  const data = await request({
    model: opts.model,
    instructions: opts.system,
    input: opts.content,
    max_output_tokens: opts.maxTokens,
  })
  const text = outputText(data)
  if (!text) throw new Error('OpenAI API returned no text')
  return { text, ...usage(data) }
}

export async function researchWithOpenAI(opts: { model: string; instruction: string }) {
  const data = await request({
    model: opts.model,
    input: opts.instruction,
    tools: [{ type: 'web_search' }],
    max_output_tokens: 8000,
  })
  const text = outputText(data)
  if (!text) throw new Error('OpenAI web research returned no text')
  const sources = new Map<string, { url: string; title: string }>()
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      for (const citation of part.annotations ?? []) {
        if (citation.type === 'url_citation' && citation.url) {
          sources.set(citation.url, { url: citation.url, title: citation.title || new URL(citation.url).hostname })
        }
      }
    }
  }
  return {
    text,
    sources: [...sources.values()],
    searches: data.output?.filter((item) => item.type === 'web_search_call').length ?? 0,
    ...usage(data),
  }
}

import { config } from './config'

interface GoogleResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    thoughtsTokenCount?: number
    cachedContentTokenCount?: number
  }
  error?: { message?: string }
}

export async function callGoogle(opts: {
  model: string
  system: string
  content: string
  maxTokens: number
}) {
  if (!config.googleApiKey) throw new Error('GOOGLE_API_KEY is not set')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': config.googleApiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: 'user', parts: [{ text: opts.content }] }],
          generationConfig: { maxOutputTokens: opts.maxTokens },
        }),
        signal: controller.signal,
      },
    )
    const body = await res.json() as GoogleResponse
    if (!res.ok) throw new Error(`Gemini API: ${body.error?.message || res.statusText}`)

    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    if (!text) throw new Error('Gemini API returned no text')
    const usage = body.usageMetadata ?? {}
    return {
      text,
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
      cachedTokens: usage.cachedContentTokenCount ?? 0,
    }
  } finally {
    clearTimeout(timeout)
  }
}

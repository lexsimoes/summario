import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'
import { config, assertApiKey } from './config'

let client: Anthropic | null = null
export function anthropic() {
  assertApiKey()
  client ??= new Anthropic({ apiKey: config.apiKey })
  return client
}

const promptCache = new Map<string, string>()
export function loadPrompt(name: string) {
  if (!promptCache.has(name)) {
    promptCache.set(name, fs.readFileSync(path.join(config.promptsDir, name), 'utf8'))
  }
  return promptCache.get(name)!
}

type Block = { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }

/**
 * The blueprint + analogy registry are long and byte-identical on every run.
 * Marking the last stable block with cache_control makes the whole prefix a
 * cache hit — the single largest cost lever in the pipeline.
 */
export function stableSystem(taskPromptFile: string): Block[] {
  const blocks: Block[] = [{ type: 'text', text: loadPrompt('blueprint.md') }]

  if (config.profile) {
    const profile = tryLoadPrompt(`profiles/${config.profile}.md`)
    if (profile) blocks.push({ type: 'text', text: profile })
  }

  blocks.push({ type: 'text', text: loadPrompt(taskPromptFile), cache_control: { type: 'ephemeral' } })
  return blocks
}

/** A missing profile is a configuration mistake, not a reason to fail a run. */
function tryLoadPrompt(name: string) {
  try {
    return loadPrompt(name)
  } catch {
    console.warn(`[summario] domain profile not found: prompts/${name} — continuing without it`)
    return null
  }
}

export interface CallResult {
  text: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
}

export async function call(opts: {
  model: string
  system: Block[]
  content: Block[]
  maxTokens?: number
  /** Forces the reply to start with this text (e.g. '<' to suppress preamble). */
  prefill?: string
}): Promise<CallResult> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.content }]
  if (opts.prefill) messages.push({ role: 'assistant', content: opts.prefill })

  const res = await anthropic().messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? config.maxOutputTokens,
    system: opts.system,
    messages,
  })

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  const u = res.usage
  return {
    text: (opts.prefill ?? '') + text,
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cachedTokens: (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
  }
}

/** Pull the first JSON object out of a reply, tolerating fences and chatter. */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error(`No JSON object in model reply: ${text.slice(0, 300)}`)
  return JSON.parse(raw.slice(start, end + 1)) as T
}

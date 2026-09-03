import type Anthropic from '@anthropic-ai/sdk'
import { anthropic } from './anthropic'
import { config } from './config'
import type { Source } from './types'

/**
 * Builds a source extract from the open web, for when the reader has a topic but
 * no textbook.
 *
 * This deliberately does NOT relax the blueprint's fidelity rule. The generator
 * still writes only from a supplied extract and still refuses to invent — the
 * extract simply comes from real pages instead of a PDF. Letting the model write
 * a study guide from memory would produce something plausible, unverifiable and
 * occasionally wrong, which in study material is worse than useless: you memorise
 * the error.
 *
 * So: search, read, quote, and hand the pipeline the same kind of raw material a
 * chapter would have given it — plus the sources, which end up on the cover.
 */
export interface Research {
  text: string
  sources: Source[]
  inputTokens: number
  outputTokens: number
  searches: number
}

const TOOL_TYPE = process.env.ESTUDO_WEB_SEARCH_TOOL?.trim() || 'web_search_20250305'

export async function researchTopic(opts: {
  topic: string
  description: string
  maxSearches?: number
  model?: string
}): Promise<Research> {
  const instruction = [
    `Research this topic and produce the raw source material a study-guide generator will use as its ONLY source.`,
    '',
    `TOPIC: ${opts.topic}`,
    opts.description ? `SCOPE: ${opts.description}` : '',
    '',
    'Search for authoritative sources — textbooks, university course pages, standards bodies,',
    'primary documentation, peer-reviewed material. Prefer them over blog posts and content farms.',
    '',
    'Then write a dense factual extract, 2000 to 3500 words, in the language the sources use.',
    'It must contain:',
    '  - precise definitions, in the field’s own vocabulary',
    '  - the mechanisms: how and why each thing works, not just what it is',
    '  - formulas, notation, units and concrete numbers wherever they exist',
    '  - the conditions under which each method or claim breaks down',
    '  - common misconceptions, stated as the wrong belief and its correction',
    '  - disagreements between sources, named as disagreements rather than smoothed over',
    '',
    'This is raw material, not a finished document. Do not add a cover, headings for a reader,',
    'summaries, or study advice. Do not soften uncertainty: if the sources conflict or a detail',
    'could not be confirmed, say so in the text — the generator is required to pass that through',
    'rather than fill the gap.',
    '',
    'Never write a bare $ character; write "USD 40" instead. Keep formulas in plain LaTeX.',
  ]
    .filter(Boolean)
    .join('\n')

  const res = await anthropic().messages.create({
    model: opts.model ?? config.models.guide,
    max_tokens: 8000,
    tools: [
      {
        type: TOOL_TYPE,
        name: 'web_search',
        max_uses: opts.maxSearches ?? 8,
      } as unknown as Anthropic.ToolUnion,
    ],
    messages: [{ role: 'user', content: instruction }],
  }, { timeout: config.requestTimeoutMs, maxRetries: config.maxRetries })

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  if (text.length < 800) {
    throw new Error(
      'Web research came back nearly empty. Try a more specific topic, or upload source material.',
    )
  }

  return {
    text,
    sources: collectSources(res.content),
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    searches: res.content.filter((b) => b.type === 'server_tool_use').length,
  }
}

/**
 * Sources come from the citations attached to text blocks, deduped by URL and
 * kept in the order they were first cited — which is roughly the order they
 * matter in.
 */
function collectSources(content: Anthropic.ContentBlock[]): Source[] {
  const byUrl = new Map<string, Source>()

  for (const block of content) {
    if (block.type !== 'text') continue
    const citations = (block as { citations?: unknown[] }).citations ?? []
    for (const raw of citations) {
      const c = raw as { url?: string; title?: string }
      if (!c.url || byUrl.has(c.url)) continue
      byUrl.set(c.url, { url: c.url, title: (c.title || hostOf(c.url)).slice(0, 160) })
    }
  }

  return [...byUrl.values()]
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Rendered onto the cover so the reader can check where each claim came from. */
export function sourcesBlock(sources: Source[], locale: 'pt' | 'en') {
  if (!sources.length) return ''
  const heading = locale === 'pt' ? 'Fontes consultadas' : 'Sources consulted'
  const items = sources
    .map((s) => `<li><a href="${escapeAttr(s.url)}">${escapeText(s.title)}</a> — <span class="src-url">${escapeText(hostOf(s.url))}</span></li>`)
    .join('\n')
  return `<div class="sources"><h4>${heading}</h4><ol>\n${items}\n</ol></div>`
}

const escapeText = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, '&quot;')

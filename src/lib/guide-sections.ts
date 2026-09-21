import type { MaterialRow } from './db'

export interface GuideSection { id: string; title: string; text: string }

function plain(html: string) {
  return html
    .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6]|section|table|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim()
}

/** Stable ordinal IDs let notes survive reloads without modifying the PDF/HTML. */
export function guideSections(html: string): GuideSection[] {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html
  const headings = [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
  if (!headings.length) return [{ id: 's1', title: 'Guia', text: plain(body).slice(0, 45000) }]
  return headings.map((h, i) => {
    const start = (h.index ?? 0) + h[0].length
    const end = i + 1 < headings.length ? headings[i + 1].index! : body.length
    return {
      id: `s${i + 1}`,
      title: plain(h[1]).slice(0, 180) || `Seção ${i + 1}`,
      text: plain(body.slice(start, end)).slice(0, 12000),
    }
  }).filter((s) => s.text.length > 30)
}

export function relevantSections(sections: GuideSection[], query: string, max = 5) {
  const terms = (query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{4,}/g) ?? [])
    .filter((x) => !['para', 'qual', 'como', 'mais', 'with', 'what', 'from', 'that', 'this'].includes(x))
  return [...sections].map((section) => {
    const hay = `${section.title} ${section.text}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return { section, score: terms.reduce((n, term) => n + (hay.includes(term) ? 1 : 0) + (section.title.toLowerCase().includes(term) ? 2 : 0), 0) }
  }).sort((a, b) => b.score - a.score).slice(0, max).map((x) => x.section)
}

export function guideSourceLabels(m: MaterialRow): Array<{ title: string; url?: string }> {
  if (m.source_kind === 'upload') return [{ title: 'PDF de apoio enviado' }]
  try {
    const sources = JSON.parse(m.sources ?? '[]') as unknown
    if (!Array.isArray(sources)) return []
    return sources.filter((x): x is { title?: string; url: string } =>
      !!x && typeof x === 'object' && typeof (x as { url?: unknown }).url === 'string' &&
      /^https?:\/\//i.test((x as { url: string }).url))
      .slice(0, 15).map((x) => ({ title: String(x.title || x.url).slice(0, 180), url: x.url }))
  } catch { return [] }
}

import { currentUser } from '@/lib/auth'
import { getFlashcards, getMaterial, quizWeakConcepts } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * The flashcards as an Anki-importable file. Tab-separated, not the `;` variant
 * the blueprint also mentions — guide content is full of semicolons. Anki reads
 * a bare newline as a record break, so every field is flattened to one line.
 */
const flat = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) return new Response('Not found', { status: 404 })

  const weak = new Set(quizWeakConcepts(id, user.id))
  const cards = getFlashcards(id).sort(
    (a, b) => Number(weak.has(b.tags)) - Number(weak.has(a.tags)),
  )
  if (!cards.length) return new Response('No flashcards for this material yet.', { status: 404 })

  const lines = ['#separator:tab', '#html:false', '#columns:Front\tBack\tTags']
  for (const c of cards) {
    const concept = flat(c.tags).replace(/\s+/g, '-')
    const tags = [concept, weak.has(c.tags) ? 'summario-weak' : ''].filter(Boolean).join(' ')
    lines.push([flat(c.front), flat(c.back), tags].join('\t'))
  }

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'content-type': 'text/tab-separated-values; charset=utf-8',
      'content-disposition': `attachment; filename="${id}.tsv"`,
    },
  })
}

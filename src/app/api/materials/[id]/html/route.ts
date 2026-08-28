import { currentUser } from '@/lib/auth'
import { getMaterial } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * The same document as the PDF, as editable HTML. It is already produced by the
 * render step, so exposing it costs nothing and saves anyone who wants to adjust
 * a guide before printing it.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m?.html || m.user_id !== user.id) return new Response('Not found', { status: 404 })

  return new Response(m.html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-disposition': `attachment; filename="${id}.html"`,
    },
  })
}

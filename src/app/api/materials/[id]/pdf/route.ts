import fs from 'node:fs/promises'
import { currentUser } from '@/lib/auth'
import { getMaterial } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m?.pdf_path || m.user_id !== user.id) return new Response('Not found', { status: 404 })

  const file = await fs.readFile(m.pdf_path)
  return new Response(new Uint8Array(file), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${id}.pdf"`,
    },
  })
}

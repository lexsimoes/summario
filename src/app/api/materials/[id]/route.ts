import { NextResponse } from 'next/server'
import { requireUserApi } from '@/lib/api-auth'
import { getMaterial } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({
    id: m.id,
    topic: m.topic,
    status: m.status,
    stage: m.stage_detail,
    error: m.error,
    pdfReady: Boolean(m.pdf_path),
    htmlReady: Boolean(m.html),
    pages: m.page_count,
    sourceKind: m.source_kind,
    sources: m.sources ? JSON.parse(m.sources) : [],
    validation: m.validation ? JSON.parse(m.validation) : null,
    usage: { input: m.input_tokens, output: m.output_tokens, cached: m.cached_tokens },
  })
}

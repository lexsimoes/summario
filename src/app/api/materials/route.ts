import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { requireUserApi } from '@/lib/api-auth'
import { createMaterial, listMaterials } from '@/lib/db'
import { canAfford, chargeCredits, COST } from '@/lib/credits'
import { config } from '@/lib/config'
import { cleanExtract, pdfToTextCached, sectionsFromScope, sliceSections } from '@/lib/extract'
import { startJob } from '@/lib/jobs'
import { themeFor } from '@/lib/design'
import type { DocumentType, LanguageMode, SourceKind } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Part of the material id, so a document stays addressable if exam reviews come
// back to the form later.
const TYPE_SUFFIX: Record<DocumentType, string> = { pocket_guide: 'pg', exam_review: 'rev' }

export async function GET() {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user
  return NextResponse.json({ materials: listMaterials(user.id) })
}

export async function POST(req: Request) {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user

  try {
    const form = await req.formData()
    const topic = String(form.get('topic') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const language = String(form.get('language') ?? 'bilingual') as LanguageMode
    const pdf = form.get('pdf')

    // The section range is read out of the scope the user already wrote rather
    // than asked for again in its own fields.
    const { from, to } = sectionsFromScope(description)

    if (!topic) return NextResponse.json({ error: 'topic_required' }, { status: 400 })

    const hasUpload = pdf instanceof File && pdf.size > 0
    const sourceKind: SourceKind = hasUpload ? 'upload' : 'web'

    // Exam reviews (Type B) still exist in the pipeline and the CLI; the web form
    // only offers the pocket guide, which is the shape almost every request has.
    const documentType: DocumentType = 'pocket_guide'
    const cost = COST[documentType]

    if (!canAfford(user, cost)) {
      return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
    }

    // Extraction is pure code and fast enough to run inline; web research is not,
    // so it happens inside the job where the reader can watch the stage change.
    let sourceText = ''
    let pdfPath: string | undefined
    let sectionMatched = false

    if (hasUpload) {
      const uploadDir = path.join(config.dataDir, 'uploads', user.id)
      await fs.mkdir(uploadDir, { recursive: true })
      pdfPath = path.join(uploadDir, path.basename(pdf.name))
      await fs.writeFile(pdfPath, Buffer.from(await pdf.arrayBuffer()))

      const raw = await pdfToTextCached(pdfPath, config.dataDir)
      const sliced = sliceSections(raw, from, to)
      sectionMatched = sliced.matched
      sourceText = cleanExtract(sliced.text)
      if (sourceText.length < 500) {
        return NextResponse.json({ error: 'empty_extract' }, { status: 400 })
      }
    }

    // Scoped to the user: the id is the primary key, while the "same chapter,
    // same language" rule is a per-user unique index. Without the prefix, two
    // users generating the same topic collide on the primary key and the second
    // insert throws instead of updating. It stays deterministic, so regenerating
    // a document keeps its URL and its folder on disk.
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const id = `${user.id.slice(0, 8)}-${slug}-${language}-${TYPE_SUFFIX[documentType]}`

    const theme = themeFor(topic)

    createMaterial({
      id, userId: user.id, topic, description, language, documentType, theme,
      sourceKind, sourceFileRef: pdfPath, creditsCost: cost,
    })
    chargeCredits(user, id, cost)
    startJob(id, user.id, {
      topic, description, language, documentType, theme, sourceKind, sourceText,
    })

    return NextResponse.json({ id, sectionMatched, sourceKind, cost })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { requireUserApi } from '@/lib/api-auth'
import { createMaterial, listMaterials } from '@/lib/db'
import { canAfford, chargeCredits, COST } from '@/lib/credits'
import { config } from '@/lib/config'
import { cleanExtract, pdfToTextCached, sliceSections } from '@/lib/extract'
import { startJob } from '@/lib/jobs'
import type { DocumentType, Family, LanguageMode } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const family = String(form.get('family') ?? 'deep_learning') as Family
    const from = String(form.get('from') ?? '').trim()
    const to = String(form.get('to') ?? '').trim()
    const pdf = form.get('pdf')
    const questions = form.get('questions')

    if (!topic) return NextResponse.json({ error: 'topic_required' }, { status: 400 })
    if (!(pdf instanceof File)) return NextResponse.json({ error: 'pdf_required' }, { status: 400 })

    const questionBank =
      questions instanceof File && questions.size > 0 ? await questions.text() : undefined
    const documentType: DocumentType = questionBank ? 'exam_review' : 'pocket_guide'
    const cost = COST[documentType]

    if (!canAfford(user, cost)) {
      return NextResponse.json({ error: 'insufficient_credits' }, { status: 402 })
    }

    const uploadDir = path.join(config.dataDir, 'uploads', user.id)
    await fs.mkdir(uploadDir, { recursive: true })
    const pdfPath = path.join(uploadDir, path.basename(pdf.name))
    await fs.writeFile(pdfPath, Buffer.from(await pdf.arrayBuffer()))

    // Extraction is pure code and fast enough to run inline; generation is not.
    const raw = await pdfToTextCached(pdfPath, config.dataDir)
    const sliced = sliceSections(raw, from || undefined, to || undefined)
    const sourceText = cleanExtract(sliced.text)
    if (sourceText.length < 500) {
      return NextResponse.json({ error: 'empty_extract' }, { status: 400 })
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const id = `${slug}-${language}-${documentType === 'exam_review' ? 'rev' : 'pg'}`

    createMaterial({
      id, userId: user.id, topic, description, language, documentType, family,
      sourceFileRef: pdfPath, creditsCost: cost,
    })
    chargeCredits(user, id, cost)
    startJob(id, user.id, { topic, description, language, documentType, family, sourceText, questionBank })

    return NextResponse.json({ id, sectionMatched: sliced.matched, cost })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

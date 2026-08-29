import { NextResponse } from 'next/server'
import { requireUserApi } from '@/lib/api-auth'
import { recordAudit } from '@/lib/audit'
import { clientIp } from '@/lib/rate-limit'
import {
  getFlashcards,
  getMaterial,
  getProjects,
  getQuizQuestions,
  quizWeakConcepts,
  updateMaterial,
} from '@/lib/db'
import { enqueueJob } from '@/lib/jobs'

export const runtime = 'nodejs'

/** The study set for a material, plus which concepts the reader has missed. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const weak = new Set(quizWeakConcepts(id, user.id))

  return NextResponse.json({
    status: m.derivatives_status,
    error: m.derivatives_error,
    weakConcepts: [...weak],
    flashcards: getFlashcards(id).map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      concept: c.tags,
      weak: weak.has(c.tags),
    })),
    quiz: getQuizQuestions(id).map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      explanation: q.explanation,
      trap: q.trap,
      concept: q.concept,
      isMultiSelect: Boolean(q.is_multi_select),
    })),
    projects: getProjects(id).map((p) => ({
      id: p.id,
      title: p.title,
      brief: p.brief,
      concepts: p.concepts ? p.concepts.split(',').map((s) => s.trim()).filter(Boolean) : [],
    })),
  })
}

/** Kick off (or restart) generation of the study set. Costs no credit. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.status !== 'done') return NextResponse.json({ error: 'guide_not_ready' }, { status: 409 })
  if (m.derivatives_status === 'generating') {
    return NextResponse.json({ ok: true, status: 'generating' })
  }

  updateMaterial(id, { derivatives_status: 'generating', derivatives_error: null })
  enqueueJob({ kind: 'derive', materialId: id, userId: user.id })
  recordAudit({ event: 'derive', userId: user.id, ip: clientIp(req), detail: id })
  return NextResponse.json({ ok: true, status: 'generating' }, { status: 202 })
}

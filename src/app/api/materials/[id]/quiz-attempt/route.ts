import { NextResponse } from 'next/server'
import { requireUserApi } from '@/lib/api-auth'
import { getMaterial, getQuizQuestions, quizWeakConcepts, recordQuizAttempt } from '@/lib/db'

export const runtime = 'nodejs'

/** Record one self-graded quiz answer. Returns the refreshed weak-concept list. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUserApi()
  if (user instanceof NextResponse) return user

  const { id } = await ctx.params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const body = (await req.json()) as { questionId?: number; correct?: boolean }
  const questionId = Number(body.questionId)
  if (!Number.isInteger(questionId) || typeof body.correct !== 'boolean') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  if (!getQuizQuestions(id).some((q) => q.id === questionId)) {
    return NextResponse.json({ error: 'unknown_question' }, { status: 400 })
  }

  recordQuizAttempt({ materialId: id, userId: user.id, questionId, correct: body.correct })
  return NextResponse.json({ ok: true, weakConcepts: quizWeakConcepts(id, user.id) })
}

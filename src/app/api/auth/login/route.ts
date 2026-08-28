import { NextResponse } from 'next/server'
import { authenticate, startSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string }
  if (!email || !password) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const user = await authenticate(email, password)
  if (!user) return NextResponse.json({ error: 'invalid' }, { status: 401 })

  await startSession(user.id)
  return NextResponse.json({ ok: true })
}

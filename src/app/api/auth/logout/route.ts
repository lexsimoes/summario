import { NextResponse } from 'next/server'
import { recordAudit } from '@/lib/audit'
import { currentUser, endSession } from '@/lib/auth'
import { clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await currentUser()
  await endSession()
  if (user) recordAudit({ event: 'logout', userId: user.id, ip: clientIp(req), detail: user.email })
  // Relative for the same reason as /api/locale: behind a proxy the request URL
  // is the container's internal address, and an absolute redirect built from it
  // lands the visitor on localhost.
  return new NextResponse(null, { status: 303, headers: { Location: '/' } })
}

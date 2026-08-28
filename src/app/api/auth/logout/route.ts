import { NextResponse } from 'next/server'
import { endSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST() {
  await endSession()
  // Relative for the same reason as /api/locale: behind a proxy the request URL
  // is the container's internal address, and an absolute redirect built from it
  // lands the visitor on localhost.
  return new NextResponse(null, { status: 303, headers: { Location: '/' } })
}

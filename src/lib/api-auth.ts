import { NextResponse } from 'next/server'
import { currentUser } from './auth'
import type { UserRow } from './db'

/** Route-handler counterpart of requireUser: returns a 401 instead of redirecting. */
export async function requireUserApi(): Promise<UserRow | NextResponse> {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return user
}

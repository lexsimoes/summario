import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE } from '@/lib/i18n'

export const runtime = 'nodejs'

/**
 * Saving the choice is step 1 of the detection cascade — once set, it always
 * wins over Accept-Language.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const to = url.searchParams.get('to')
  const next = url.searchParams.get('next') || '/'
  if (to === 'pt' || to === 'en') {
    ;(await cookies()).set(LOCALE_COOKIE, to, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  }
  return NextResponse.redirect(new URL(next, url.origin))
}

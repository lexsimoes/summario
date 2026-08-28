import { NextResponse } from 'next/server'
import { LOCALE_COOKIE } from '@/lib/i18n'

export const runtime = 'nodejs'

/**
 * Saving the choice is step 1 of the detection cascade — once set, it always
 * wins over Accept-Language.
 *
 * The redirect is relative on purpose. Behind a reverse proxy the request URL
 * the app sees is the container's internal address, so building an absolute
 * redirect from it sends the visitor to localhost. A relative Location is
 * resolved by the browser against the address it actually used.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const to = url.searchParams.get('to')

  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: safeNext(url.searchParams.get('next')) },
  })

  if (to === 'pt' || to === 'en') {
    res.cookies.set(LOCALE_COOKIE, to, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return res
}

/**
 * `next` comes from the query string, so it is attacker-controlled. A value like
 * "//example.com" is a protocol-relative URL: the browser would leave the site.
 * Only same-site absolute paths are allowed through.
 */
function safeNext(raw: string | null) {
  if (!raw) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  return raw
}

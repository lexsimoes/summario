import { NextResponse, type NextRequest } from 'next/server'

/**
 * Content-Security-Policy, with a per-request nonce.
 *
 * This was deliberately left out until it could be done properly: a CSP that is
 * wrong is worse than none, because it either breaks the app or lulls you into
 * thinking you have one. Next hydrates through inline scripts, so the honest
 * version needs a fresh nonce on every request — which means middleware, not a
 * static header in next.config.mjs.
 *
 * `strict-dynamic` is what makes it hold: scripts Next loads from the nonced
 * bootstrap inherit trust, so the chunk filenames do not have to be enumerated.
 * Browsers that understand it ignore the `'self'` fallback beside it; older ones
 * fall back to `'self'` and still get something.
 *
 * `style-src` keeps `'unsafe-inline'`: the app styles through inline `style`
 * attributes throughout and Next injects its own `<style>` blocks. Nonces do not
 * apply to style attributes at all, so tightening this means removing every
 * inline style first — worth doing, and not worth pretending is done.
 */
function policy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * The generated document routes are exempt. That HTML is a Chromium-rendered
 * artifact with its own inline KaTeX boot script and local font paths; applying
 * the app's CSP to it would stop the math rendering in a page the reader opened
 * in order to print it.
 *
 * Checked here rather than in `matcher`, because path-to-regexp reads `[` and
 * `]` as its own syntax and a bracketed exclusion breaks the build.
 */
const EXEMPT = /^\/api\/materials\/[^/]+\/(?:html|pdf)$/

export function middleware(req: NextRequest) {
  if (EXEMPT.test(req.nextUrl.pathname)) return NextResponse.next()

  const nonce = crypto.randomUUID().replace(/-/g, '')
  const csp = policy(nonce)

  // The nonce has to reach the render pass, which reads it off the request.
  const headers = new Headers(req.headers)
  headers.set('x-nonce', nonce)
  headers.set('content-security-policy', csp)

  const res = NextResponse.next({ request: { headers } })
  res.headers.set('content-security-policy', csp)
  return res
}

export const config = {
  // Everything except Next's static assets, the image optimiser and the favicon
  // family — none of which need a policy. The document-route exemption is in the
  // function above.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)'],
}

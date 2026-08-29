/**
 * Security headers. Next ships none of these by default, and a public site
 * without them is relying on the browser guessing right.
 *
 * The Content-Security-Policy is NOT here: it carries a per-request nonce for
 * Next's inline hydration scripts, which a static header cannot do. It lives in
 * `src/middleware.ts`.
 */
const securityHeaders = [
  // Once a browser has seen this it refuses plain HTTP for a year. includeSubDomains
  // means any future subdomain must serve HTTPS too — intended, since the Coolify
  // dashboard is meant to move behind one.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Stops the browser second-guessing a declared content type, which is how a
  // user-uploaded file becomes an executable script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No framing at all: nothing here is meant to be embedded, and clickjacking a
  // credit-spending button is a real shape of attack.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The app asks for none of these; saying so stops an embedded third party asking.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // better-sqlite3 and playwright are native/heavy: keep them out of the bundle.
  serverExternalPackages: ['better-sqlite3', 'playwright'],
  experimental: {
    // Generation jobs write to the data directory at runtime.
    serverActions: { bodySizeLimit: '25mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}
export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 and playwright are native/heavy: keep them out of the bundle.
  serverExternalPackages: ['better-sqlite3', 'playwright'],
  experimental: {
    // Generation jobs write to ./data at runtime.
    serverActions: { bodySizeLimit: '25mb' },
  },
}
export default nextConfig

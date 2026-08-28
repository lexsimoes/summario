// Copy KaTeX out of node_modules into public/vendor so the renderer resolves
// its fonts from disk. No CDN is touched at render time.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const dest = path.resolve('public/vendor/katex')

let katexDir
try {
  katexDir = path.dirname(require.resolve('katex/package.json'))
} catch {
  console.log('[setup-katex] katex not installed yet — skipping (runs again after npm install)')
  process.exit(0)
}

const src = path.join(katexDir, 'dist')
await fs.rm(dest, { recursive: true, force: true })
await fs.mkdir(dest, { recursive: true })

for (const entry of ['katex.min.css', 'katex.min.js', 'fonts', 'contrib/auto-render.min.js']) {
  const from = path.join(src, entry)
  const to = path.join(dest, entry)
  await fs.mkdir(path.dirname(to), { recursive: true })
  await fs.cp(from, to, { recursive: true })
}

console.log(`[setup-katex] katex copied to ${path.relative(process.cwd(), dest)}`)

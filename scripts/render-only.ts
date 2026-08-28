/**
 * Render an existing HTML file to PDF and validate it. No API key needed —
 * use this to check the KaTeX + Chromium path in isolation.
 *
 *   npm run render -- fixtures/sample.html
 */
import path from 'node:path'
import fs from 'node:fs/promises'
import { renderPdf } from '../src/lib/render'
import { validatePdf } from '../src/lib/validate'
import { formatReport } from '../src/lib/pipeline'

const input = process.argv[2]
if (!input) {
  console.error('usage: npm run render -- <file.html> [outDir]')
  process.exit(1)
}
const outDir = process.argv[3] ?? path.join('data', 'render-check')
const html = await fs.readFile(input, 'utf8')
const { htmlPath, pdfPath } = await renderPdf({
  html,
  outDir,
  basename: path.basename(input, '.html'),
})
console.log(`html ${htmlPath}\npdf  ${pdfPath}\n`)
console.log(formatReport('render integrity', await validatePdf(pdfPath)))

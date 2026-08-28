import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { config } from './config'

/**
 * HTML -> PDF. KaTeX is served from a local copy next to the HTML file so its
 * font paths resolve; no CDN is touched at render time.
 */
export async function renderPdf(opts: {
  html: string
  outDir: string
  basename?: string
}): Promise<{ htmlPath: string; pdfPath: string }> {
  const base = opts.basename ?? 'document'
  // Resolved, because a relative path makes an invalid file:// URL below.
  const outDir = path.resolve(opts.outDir)
  await fs.mkdir(outDir, { recursive: true })

  const htmlPath = path.join(outDir, `${base}.html`)
  const pdfPath = path.join(outDir, `${base}.pdf`)
  await fs.writeFile(htmlPath, opts.html, 'utf8')
  await linkKatex(outDir)

  // Self-hosters on a distro Chromium (or a Playwright image whose bundled
  // build differs from the npm package) can point at it instead of a download.
  const browser = await chromium.launch(
    config.chromiumPath ? { executablePath: config.chromiumPath } : {},
  )
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' })
    // The boot script sets this flag once auto-render has finished. Printing
    // before it is set produces a PDF full of raw LaTeX.
    await page.waitForFunction('window.__katexDone === true', undefined, { timeout: 30_000 })
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      // Margins live in the @page rule so the stylesheet owns the geometry.
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await page.close()
  } finally {
    await browser.close()
  }

  return { htmlPath, pdfPath }
}

async function linkKatex(outDir: string) {
  const src = path.join(config.vendorDir, 'katex')
  const dest = path.join(outDir, 'katex')
  try {
    await fs.access(src)
  } catch {
    throw new Error('public/vendor/katex is missing. Run `npm run setup:katex`.')
  }
  try {
    await fs.lstat(dest)
    return
  } catch {
    /* not there yet */
  }
  try {
    await fs.symlink(src, dest, 'dir')
  } catch {
    await fs.cp(src, dest, { recursive: true })
  }
}

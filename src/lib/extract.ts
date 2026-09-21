import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const run = promisify(execFile)

/**
 * PDF -> plain text. Pure code, no tokens spent.
 * `-layout` preserves column structure, which keeps tables and formulas readable.
 */
export async function pdfToText(pdfPath: string, opts: { first?: number; last?: number } = {}) {
  const args = ['-layout']
  if (opts.first) args.push('-f', String(opts.first))
  if (opts.last) args.push('-l', String(opts.last))
  args.push(pdfPath, '-')
  try {
    const { stdout } = await run('pdftotext', args, { maxBuffer: 64 * 1024 * 1024 })
    return stdout
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException
    if (e.code === 'ENOENT') {
      throw new Error(
        'pdftotext not found. Install poppler: `brew install poppler` on macOS, ' +
          '`apt-get install poppler-utils` on Debian/Ubuntu.',
      )
    }
    throw err
  }
}

/** Cache extracted text so the same PDF is never parsed twice. */
export async function pdfToTextCached(pdfPath: string, cacheDir: string) {
  const stat = await fs.stat(pdfPath)
  const key = `${path.basename(pdfPath)}-${stat.size}-${Math.round(stat.mtimeMs)}.txt`
  const cachePath = path.join(cacheDir, 'extracts', key)
  try {
    return await fs.readFile(cachePath, 'utf8')
  } catch {
    const text = await pdfToText(pdfPath)
    await fs.mkdir(path.dirname(cachePath), { recursive: true })
    await fs.writeFile(cachePath, text, 'utf8')
    return text
  }
}

/** OCR only for image-only PDFs. It runs in the durable generation worker, not the upload request. */
export async function ocrPdfToText(pdfPath: string, cacheDir: string) {
  const stat = await fs.stat(pdfPath)
  const key = `${path.basename(pdfPath)}-${stat.size}-${Math.round(stat.mtimeMs)}.ocr.txt`
  const cachePath = path.join(cacheDir, 'extracts', key)
  const pageCacheDir = path.join(cacheDir, 'extracts', `${key}.pages`)
  try { return await fs.readFile(cachePath, 'utf8') } catch { /* cache miss */ }

  let pages: number
  try {
    const info = await run('pdfinfo', [pdfPath], { maxBuffer: 1024 * 1024 })
    pages = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0)
  } catch { throw new Error('Não foi possível ler a estrutura do PDF escaneado.') }
  if (!pages) throw new Error('O PDF escaneado não tem páginas legíveis.')
  if (pages > 200) {
    throw new Error(`Este PDF tem ${pages} páginas escaneadas. Para OCR, envie um capítulo de até 200 páginas; não vamos resumir só uma parte sem avisar.`)
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'summario-ocr-'))
  try {
    await fs.mkdir(pageCacheDir, { recursive: true })
    const output: string[] = []
    for (let page = 1; page <= pages; page++) {
      const pageCachePath = path.join(pageCacheDir, `${page}.txt`)
      try {
        output.push(await fs.readFile(pageCachePath, 'utf8'))
        continue
      } catch { /* this page still needs OCR */ }
      const imageBase = path.join(tempDir, 'page')
      try {
        await run('pdftoppm', ['-f', String(page), '-l', String(page), '-r', '150', '-gray', '-singlefile', '-png', pdfPath, imageBase],
          { timeout: 90_000, maxBuffer: 1024 * 1024 })
        const ocr = await run('tesseract', [`${imageBase}.png`, 'stdout', '-l', 'por+eng'],
          { timeout: 90_000, maxBuffer: 8 * 1024 * 1024 })
        const pageText = `[Página ${page}]\n${ocr.stdout.trim()}`
        await fs.writeFile(pageCachePath, pageText, 'utf8')
        output.push(pageText)
        await fs.unlink(`${imageBase}.png`)
      } catch (err) {
        const e = err as NodeJS.ErrnoException
        if (e.code === 'ENOENT') throw new Error('OCR indisponível: instale Tesseract com os idiomas português e inglês.')
        throw new Error(`Falha no OCR da página ${page}: ${e.message}`)
      }
    }
    const text = output.join('\n\f\n')
    await fs.mkdir(path.dirname(cachePath), { recursive: true })
    await fs.writeFile(cachePath, text, 'utf8')
    return text
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

/**
 * Slice the extract down to a section range, e.g. "7.1"–"7.6".
 * Falls back to the whole text when the markers are not found, and says so.
 */
export function sliceSections(text: string, from?: string, to?: string) {
  if (!from) return { text, matched: false as const }
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const startRe = new RegExp(`^\\s*${esc(from)}[\\s.]`, 'm')
  const start = text.search(startRe)
  if (start < 0) return { text, matched: false as const }
  let end = text.length
  if (to) {
    // End at the section that follows `to` (e.g. 7.6 -> stop at 7.7 or 8.1).
    const [maj, min] = to.split('.')
    const next = min ? `${maj}.${Number(min) + 1}` : `${Number(maj) + 1}`
    const endRe = new RegExp(`^\\s*(${esc(next)}|${Number(maj) + 1}\\.1)[\\s.]`, 'm')
    const found = text.slice(start).search(endRe)
    if (found > 0) end = start + found
  }
  return { text: text.slice(start, end), matched: true as const }
}

/**
 * Pull a section range out of the scope the reader already wrote.
 *
 * Asking for "from" and "to" in their own fields was asking twice: someone who
 * types "Chapter 7, sections 7.1 to 7.6" has already said it. Slicing matters —
 * sending a whole book instead of a chapter roughly triples the cost of a
 * document — so the range is worth having, just not worth a second question.
 *
 * A chapter number on its own ("Capítulo 7") is not a section marker and yields
 * nothing, which correctly falls back to the whole extract.
 */
export function sectionsFromScope(scope: string): { from?: string; to?: string } {
  if (!scope) return {}

  // "7.1 to 7.6", "7.1 a 7.6", "7.1–7.6", "7.1 até 7.6"
  const range = scope.match(
    /(\d+(?:\.\d+)+)\s*(?:[-–—]|to|a|até|ate|until|through)\s*(\d+(?:\.\d+)+)/i,
  )
  if (range) return { from: range[1], to: range[2] }

  const single = scope.match(/(\d+\.\d+)/)
  return single ? { from: single[1] } : {}
}

/** Rough token estimate: ~3.6 chars/token for EN prose, less for PT. */
export const estimateTokens = (s: string) => Math.ceil(s.length / 3.6)

/** Strip the page furniture pdftotext leaves behind. */
export function cleanExtract(text: string) {
  return text
    .replace(/\f/g, '\n')
    .replace(/^\s*\d{1,4}\s*$/gm, '')       // bare page numbers
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

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

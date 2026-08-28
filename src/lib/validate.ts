import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DocumentType, LanguageMode, ValidationResult } from './types'

const run = promisify(execFile)
const check = (name: string, ok: boolean, detail: string) => ({ name, ok, detail })

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const words = (html: string) => strip(html).split(' ').filter(Boolean).length
const all = (html: string, re: RegExp) => html.match(re) ?? []

/**
 * Pull out the inner HTML of every `<div class="box CLS">`, matching nested
 * `<div>`s properly — every box contains at least a label div, so a naive
 * non-greedy regex swallows the rest of the document.
 */
function boxes(html: string, cls: string) {
  const open = new RegExp(`<div class="box ${cls}"[^>]*>`, 'gi')
  const found: string[] = []
  for (let m = open.exec(html); m; m = open.exec(html)) {
    let depth = 1
    let i = m.index + m[0].length
    const start = i
    const tag = /<\/?div\b[^>]*>/gi
    tag.lastIndex = i
    for (let t = tag.exec(html); t && depth > 0; t = tag.exec(html)) {
      depth += t[0].startsWith('</') ? -1 : 1
      i = t.index
    }
    if (depth === 0) found.push(html.slice(start, i))
  }
  return found
}

/**
 * Cheap language detection by function words. Function words are the part of a
 * language a writer cannot avoid, so counting them separates PT prose from EN
 * prose reliably without a dependency — and language leakage is the failure
 * mode that machine translation between modes would produce.
 */
const PT_MARKERS = /\b(que|n[ãa]o|para|como|uma|voc[êe]|mais|isso|ent[ãa]o|porque|quando|cada|mesmo|com|dos|das|pelo|pela|ser|est[áa]|s[óo]|seu|sua|aqui|todo)\b/gi
const EN_MARKERS = /\b(the|and|with|that|which|from|this|because|when|each|only|are|were|their|into|than|but|does)\b/gi

function langScore(text: string) {
  const clean = text.replace(/\$[^$]*\$/g, ' ')
  return {
    pt: (clean.match(PT_MARKERS) ?? []).length,
    en: (clean.match(EN_MARKERS) ?? []).length,
  }
}

/** Box text minus parenthesised asides — `pt` mode allows an English term there. */
const withoutParentheticals = (text: string) => text.replace(/\([^)]*\)/g, ' ')

function languageChecks(html: string, mode: LanguageMode) {
  const out = []
  const prose = strip(html)

  if (mode === 'en') {
    const { pt } = langScore(prose)
    out.push(check('no Portuguese leaked into an English document', pt <= 1,
      `${pt} Portuguese function words found`))
  } else if (mode === 'pt') {
    const { en } = langScore(withoutParentheticals(prose))
    out.push(check('no English leaked into a Portuguese document', en <= 3,
      `${en} English function words outside parentheses (a few are allowed for method names)`))
  } else {
    const ptBoxes = [...boxes(html, 'intuition'), ...boxes(html, 'deepdive'), ...boxes(html, 'trap')]
    const enBoxes = [...boxes(html, 'answer'), ...boxes(html, 'theory'), ...boxes(html, 'recap')]

    const wrongPt = ptBoxes.filter((b) => {
      const s = langScore(strip(b))
      return s.en > s.pt
    }).length
    out.push(check('intuition, deep-dive and trap boxes are in Portuguese', wrongPt === 0,
      `${wrongPt} of ${ptBoxes.length} reads as English`))

    const wrongEn = enBoxes.filter((b) => {
      const s = langScore(strip(b))
      return s.pt > s.en
    }).length
    out.push(check('answer, theory and recap boxes are in English', wrongEn === 0,
      `${wrongEn} of ${enBoxes.length} reads as Portuguese`))
  }
  return out
}

/**
 * Structural + quality signals on the generated HTML.
 *
 * This is the answer to "how do you automatically detect that a guide is
 * shallow". None of these prove depth on their own, but a document that fails
 * several of them is reliably weak, and each one maps to a rule in the
 * blueprint rather than to a vague notion of quality.
 */
export function validateHtml(
  html: string,
  type: DocumentType,
  language: LanguageMode = 'bilingual',
): ValidationResult {
  const checks = []
  const sections = all(html, /<section class="sec"/g).length
  const questions = all(html, /<section class="q"/g).length
  const intuition = boxes(html, 'intuition')
  const deepdive = boxes(html, 'deepdive')
  const theory = boxes(html, 'theory')
  const traps = boxes(html, 'trap')

  // Never a literal dollar outside math: it silently corrupts KaTeX output.
  const mathStripped = html.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$\n]{1,200}\$/g, '')
  checks.push(
    check('no stray dollar signs', !mathStripped.includes('$'),
      `${(mathStripped.match(/\$/g) ?? []).length} literal $ outside math delimiters`),
  )

  checks.push(
    check('no shell tags', !/<(?:html|head|body|style|script)\b/i.test(html), 'fragment is clean'),
  )

  if (type === 'pocket_guide') {
    checks.push(check('every section has an intuition box', sections > 0 && intuition.length >= sections,
      `${intuition.length} intuition boxes for ${sections} sections`))

    // strip() first: the nested label div's own attributes contain an '='.
    const formulaic = intuition.filter((b) => /\$|\\frac|\\sum|\\lambda|=/.test(strip(b))).length
    checks.push(check('intuition boxes carry no formulas', formulaic === 0,
      `${formulaic} intuition box(es) contain math`))

    const ratio = sections ? deepdive.length / sections : 0
    checks.push(check('deep-dive boxes stay rare', ratio <= 0.6,
      `${deepdive.length} deep-dive for ${sections} sections (ratio ${ratio.toFixed(2)}, ceiling 0.60)`))

    checks.push(check('closing ladder table present', /<table class="ref/.test(html), 'ref table found'))
  } else {
    checks.push(check('every question has an answer box', questions > 0 && boxes(html, 'answer').length >= questions,
      `${boxes(html, 'answer').length} answer boxes for ${questions} questions`))

    checks.push(check('every question has a theory box', questions > 0 && theory.length >= questions,
      `${theory.length} theory boxes for ${questions} questions`))

    const avg = theory.length ? theory.reduce((n, b) => n + words(b), 0) / theory.length : 0
    checks.push(check('theory boxes are substantive', avg >= 45,
      `average ${avg.toFixed(0)} words (target 45+, i.e. the 4–5 line standard)`))

    // A theory box that only restates the answer is the classic shallow failure.
    const thin = theory.filter((b) => words(b) < 25).length
    checks.push(check('no thin theory boxes', thin === 0, `${thin} theory box(es) under 25 words`))

    const trapRatio = questions ? traps.length / questions : 0
    checks.push(check('traps are selective, not universal', trapRatio > 0 && trapRatio <= 0.75,
      `${traps.length} traps for ${questions} questions (ratio ${trapRatio.toFixed(2)})`))
  }

  // Substance signals that apply to both types.
  const mathCount = all(html, /\$\$|<div class="math"/g).length
  checks.push(check('formulas present', mathCount >= 3, `${mathCount} math blocks`))

  const links = all(html, /class="link-note"/gi).length
  checks.push(check('cross-links present', links >= 3, `${links} cross-link callouts (target 3+)`))

  const badges = all(html, /class="badge"/g).length
  checks.push(check('AI ENGINEER badges applied', badges >= 1, `${badges} badges`))

  checks.push(...languageChecks(html, language))

  return { ok: checks.every((c) => c.ok), checks }
}

/** Integrity of the rendered artifact. Cheap, and catches the silent failures. */
export async function validatePdf(pdfPath: string): Promise<ValidationResult> {
  const checks = []
  let text = ''
  try {
    const { stdout } = await run('pdftotext', [pdfPath, '-'], { maxBuffer: 32 * 1024 * 1024 })
    text = stdout
  } catch {
    return { ok: false, checks: [check('pdftotext readable', false, 'could not read the rendered PDF')] }
  }

  const pages = (text.match(/\f/g) ?? []).length + 1
  checks.push(check('page count plausible', pages >= 3 && pages <= 60, `${pages} pages`))

  const dollars = (text.match(/\$/g) ?? []).length
  checks.push(check('no dollar signs survived rendering', dollars === 0,
    `${dollars} found — a literal $ was parsed as a KaTeX delimiter`))

  const latex = text.match(/\\(?:frac|partial|sum|alpha|beta|hat|sqrt|mathbb|text)\b/g) ?? []
  checks.push(check('no raw LaTeX leaked', latex.length === 0,
    latex.length ? `commands left unrendered: ${[...new Set(latex)].slice(0, 6).join(', ')}` : 'clean'))

  checks.push(check('text extracted', text.trim().length > 500, `${text.trim().length} characters`))

  return { ok: checks.every((c) => c.ok), checks, pages }
}

export function formatReport(title: string, r: ValidationResult) {
  const lines = [`${r.ok ? 'PASS' : 'FAIL'}  ${title}`]
  for (const c of r.checks) lines.push(`  ${c.ok ? '  ok' : 'FAIL'}  ${c.name} — ${c.detail}`)
  return lines.join('\n')
}

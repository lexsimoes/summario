/**
 * CLI runner — the whole Phase 1 pipeline without the web app.
 *
 *   npm run generate -- \
 *     --pdf ~/books/d2l.pdf \
 *     --topic "Convolutional Neural Networks" \
 *     --scope "Chapter 7, sections 7.1-7.6" \
 *     --from 7.1 --to 7.6 \
 *     --lang bilingual --type pocket_guide
 *
 * Omit --pdf entirely to research the topic on the web instead.
 *
 * Add --questions <file> to switch to a Type B exam review.
 *
 * To compare two models on the same chapter, run it twice with --model and
 * --tag; the tag keeps the outputs side by side instead of overwriting:
 *
 *   npm run generate -- ... --model claude-opus-5   --tag opus
 *   npm run generate -- ... --model claude-sonnet-5 --tag sonnet
 */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../src/lib/config'
import { cleanExtract, estimateTokens, pdfToTextCached, sliceSections } from '../src/lib/extract'
import { formatReport, runPipeline } from '../src/lib/pipeline'
import { themeFor } from '../src/lib/design'
import type { DocumentType, LanguageMode, SourceKind } from '../src/lib/types'

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`)
  const v = i > -1 ? process.argv[i + 1] : undefined
  if (v === undefined && fallback === undefined) {
    throw new Error(`Missing required --${name}`)
  }
  return v ?? fallback!
}

const pdf = arg('pdf', '')
const topic = arg('topic')
const scope = arg('scope', '')
const from = arg('from', '')
const to = arg('to', '')
const questionsFile = arg('questions', '')
const theme = themeFor(topic)
const tag = arg('tag', '')

// Must happen before anything reads config.models (which reads env lazily).
const modelOverride = arg('model', '')
if (modelOverride) process.env.ESTUDO_MODEL_GUIDE = modelOverride
const plannerOverride = arg('planner', '')
if (plannerOverride) process.env.ESTUDO_MODEL_PLANNER = plannerOverride
const language = arg('lang', 'bilingual') as LanguageMode
const documentType = (questionsFile ? 'exam_review' : arg('type', 'pocket_guide')) as DocumentType
const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const sourceKind: SourceKind = pdf ? 'upload' : 'web'
console.log(`\nsummario — ${documentType} · ${language} · ${sourceKind === 'web' ? 'web research' : 'uploaded source'}`)
console.log(`topic: ${topic}`)
console.log(`models: guide=${config.models.guide} · planner=${config.models.planner}`)

let sourceText = ''
if (sourceKind === 'upload') {
  console.log('\n[1/4] extracting')
  const raw = await pdfToTextCached(path.resolve(pdf.replace(/^~/, process.env.HOME ?? '~')), config.dataDir)
  const sliced = sliceSections(raw, from || undefined, to || undefined)
  if (from && !sliced.matched) {
    console.warn(`      section marker "${from}" not found — using the whole document`)
  }
  sourceText = cleanExtract(sliced.text)
  console.log(`      ${sourceText.length} chars (~${estimateTokens(sourceText)} tokens)`)
} else {
  console.log('\n[1/4] no source supplied — researching the web')
}

const questionBank = questionsFile ? await fs.readFile(questionsFile, 'utf8') : undefined

const outDir = path.join(config.dataDir, 'materials', `${slug}-${language}${tag ? `-${tag}` : ''}`)
const started = Date.now()

const result = await runPipeline(
  { topic, description: scope, language, documentType, theme, sourceKind, sourceText, questionBank },
  {
    outDir,
    basename: tag ? `${slug}-${tag}` : slug,
    onProgress: (stage, detail) => console.log(`      ${stage}: ${detail}`),
  },
)

console.log(`\n[4/4] done in ${Math.round((Date.now() - started) / 1000)}s`)
console.log(`\n${formatReport('content quality', result.htmlValidation)}`)
console.log(`\n${formatReport('render integrity', result.pdfValidation)}`)
console.log(
  `\ntokens — in ${result.usage.input} (cached ${result.usage.cached}) · out ${result.usage.output}`,
)
console.log(`\nHTML  ${result.htmlPath}\nPDF   ${result.pdfPath}\n`)

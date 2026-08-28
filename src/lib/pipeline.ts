import path from 'node:path'
import { config } from './config'
import { generatePart, planDocument } from './generate'
import { renderPdf } from './render'
import { researchTopic, sourcesBlock } from './research'
import { buildDocument } from './template'
import { formatReport, validateHtml, validatePdf } from './validate'
import type { GeneratedPart, GenerationRequest, Plan, Source, ValidationResult } from './types'

export interface PipelineResult {
  plan: Plan
  parts: GeneratedPart[]
  html: string
  htmlPath: string
  pdfPath: string
  htmlValidation: ValidationResult
  pdfValidation: ValidationResult
  pageCount: number
  sources: Source[]
  usage: { input: number; output: number; cached: number }
}

export type Progress = (stage: string, detail: string) => void

/**
 * Full Phase 1 pipeline: plan -> generate part by part -> assemble -> render -> validate.
 * Parts are generated sequentially so each one can see how many units came
 * before it, and so a single weak part can be regenerated on its own later.
 */
export async function runPipeline(
  req: GenerationRequest,
  opts: { outDir: string; basename?: string; onProgress?: Progress },
): Promise<PipelineResult> {
  const say: Progress = opts.onProgress ?? (() => {})

  // Web mode: the extract is researched rather than extracted, then the pipeline
  // runs exactly as it does for an uploaded chapter. The fidelity rule is
  // unchanged — the generator still writes only from the extract it is given.
  let request = req
  if (req.sourceKind === 'web') {
    say('researching', 'searching for authoritative sources')
    const research = await researchTopic({ topic: req.topic, description: req.description })
    request = { ...req, sourceText: research.text, sources: research.sources }
    say('researching', `${research.sources.length} sources across ${research.searches} searches`)
  }

  say('planning', 'deciding the thematic blocks')
  const { plan } = await planDocument(request)
  say('planning', `${plan.parts.length} parts: ${plan.parts.map((p) => p.title).join(' | ')}`)

  const parts: GeneratedPart[] = []
  let nextNumber = 1
  for (let i = 0; i < plan.parts.length; i++) {
    say('generating', `part ${i + 1}/${plan.parts.length} — ${plan.parts[i].title}`)
    const part = await generatePart(request, plan, i, nextNumber)
    nextNumber += plan.parts[i].units
    parts.push(part)
  }

  // Sources are injected rather than generated: asking a model to reproduce URLs
  // it saw earlier is how you get citations that look right and resolve nowhere.
  const sources = request.sources ?? []
  const bodyHtml = [
    parts.map((p) => p.html).join('\n\n'),
    sourcesBlock(sources, request.language === 'pt' ? 'pt' : 'en'),
  ]
    .filter(Boolean)
    .join('\n\n')

  const html = buildDocument({ title: plan.title, theme: request.theme, bodyHtml })

  say('rendering', 'HTML -> PDF via headless Chromium')
  const { htmlPath, pdfPath } = await renderPdf({
    html,
    outDir: opts.outDir,
    basename: opts.basename,
  })

  const htmlValidation = validateHtml(bodyHtml, request.documentType, request.language, request.sourceKind)
  const pdfValidation = await validatePdf(pdfPath)
  say('validating', `${htmlValidation.ok ? 'content ok' : 'content warnings'}, ${pdfValidation.ok ? 'render ok' : 'render warnings'}`)

  return {
    plan,
    parts,
    html,
    htmlPath,
    pdfPath,
    htmlValidation,
    pdfValidation,
    pageCount: pdfValidation.pages ?? 0,
    sources,
    usage: {
      input: parts.reduce((n, p) => n + p.inputTokens, 0),
      output: parts.reduce((n, p) => n + p.outputTokens, 0),
      cached: parts.reduce((n, p) => n + p.cachedTokens, 0),
    },
  }
}

export const materialDir = (id: string) => path.join(config.dataDir, 'materials', id)
export { formatReport }

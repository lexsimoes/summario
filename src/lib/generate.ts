import { call, parseJson, stableSystem } from './anthropic'
import { config } from './config'
import { labelsFor } from './design'
import { estimateTokens } from './extract'
import type { GeneratedPart, GenerationRequest, Plan } from './types'

const taskFileFor = (t: GenerationRequest['documentType']) =>
  t === 'exam_review' ? 'task-exam-review.md' : 'task-pocket-guide.md'

function briefing(req: GenerationRequest) {
  const l = labelsFor(req.language)
  const modeNote =
    req.language === 'bilingual'
      ? 'BILINGUAL (the blueprint reference format): headings, technical bullets, definitions, ' +
        'formulas, tables, ANSWER / THEORY / QUICK RECAP boxes in English; intuition, deep-dive ' +
        'and trap boxes in Portuguese. Each box label follows its own box language.'
      : req.language === 'pt'
        ? 'PORTUGUESE — 100%: headings, bullets, definitions, tables, answers, theory, every box, ' +
          'all in Portuguese. Not one sentence of English prose. The single exception is technical ' +
          'vocabulary: give the canonical English term once in parentheses at its first mention in ' +
          'the document (e.g. "decaimento de peso (weight decay)"), then Portuguese only. Method ' +
          'names with no Portuguese form (Random Forest, Lasso, ReLU, softmax) stay English, no ' +
          'parenthetical. Depth is identical to the English version.'
        : 'ENGLISH — 100%: every element in English, including analogies and box labels. Not one ' +
          'Portuguese word survives.'

  const provenance =
    req.sourceKind === 'web'
      ? 'SOURCE: assembled from public web sources, which are listed at the end of the document. ' +
        'Say so in one line on the cover. The fidelity rule is unchanged: write only what the ' +
        'extract supports, and where it is thin or the sources disagree, say that instead of ' +
        'filling the gap.'
      : 'SOURCE: the reader’s own material, extracted from the PDF they uploaded.'

  return [
    `TOPIC: ${req.topic}`,
    `SCOPE: ${req.description}`,
    provenance,
    `DOCUMENT TYPE: ${req.documentType === 'exam_review' ? 'Type B — exam review' : 'Type A — pocket guide'}`,
    `LANGUAGE MODE: ${modeNote}`,
    `BOX LABELS TO USE VERBATIM: intuition="${l.intuition}", deep-dive="${l.deepdive}", ` +
      `answer="${l.answer}", theory="${l.theory}", trap="${l.trap}", recap="${l.recap}"`,
  ].join('\n')
}

/**
 * Stage 1 — plan. One cheap call that decides the thematic blocks and how many
 * units each holds. Generating against a plan is what keeps a 20-page document
 * from drifting, and it is what makes regenerating a single weak block possible.
 */
export async function planDocument(req: GenerationRequest): Promise<{ plan: Plan; usage: GeneratedPart['inputTokens'] }> {
  const res = await call({
    model: config.models.planner,
    system: stableSystem(taskFileFor(req.documentType)),
    maxTokens: 3000,
    content: [
      { type: 'text', text: sourceBlock(req), cache_control: { type: 'ephemeral' } },
      {
        type: 'text',
        text:
          `${briefing(req)}\n\n` +
          'Plan the document before writing it. Return ONLY JSON:\n' +
          '{"title":"...","subtitle":"...","source":"...","parts":[{"title":"PART 1 — ...",' +
          '"concepts":["...","..."],"units":6}]}\n\n' +
          'Rules: 2–4 parts. `units` is how many numbered sections (Type A) or questions ' +
          '(Type B) that part holds; 5–8 for Type A, 12–20 for Type B. `concepts` lists what ' +
          'each unit covers, in order, one entry per unit. Cover only what the source ' +
          'actually contains.',
      },
    ],
    prefill: '{',
  })
  const plan = parseJson<Plan>(res.text)
  if (!plan.parts?.length) throw new Error('Planner returned no parts')
  return { plan, usage: res.inputTokens }
}

function sourceBlock(req: GenerationRequest) {
  const parts = [`=== SOURCE EXTRACT ===\n${req.sourceText}`]
  if (req.questionBank?.trim()) {
    parts.push(`\n\n=== QUESTION BANK / ANSWER KEY ===\n${req.questionBank}`)
  }
  return parts.join('')
}

/**
 * Stage 2 — one call per part. The source block is identical across calls and
 * carries cache_control, so parts 2..n read it from cache instead of paying
 * for it again.
 */
export async function generatePart(
  req: GenerationRequest,
  plan: Plan,
  index: number,
  startNumber: number,
): Promise<GeneratedPart> {
  const part = plan.parts[index]
  const isFirst = index === 0
  const isLast = index === plan.parts.length - 1

  const instructions = [
    briefing(req),
    '',
    `DOCUMENT TITLE: ${plan.title}`,
    `DOCUMENT SUBTITLE: ${plan.subtitle}`,
    `SOURCE LINE: ${plan.source}`,
    '',
    `You are writing PART ${index + 1} OF ${plan.parts.length}: "${part.title}".`,
    `Cover exactly these, in order, as ${part.units} numbered ` +
      `${req.documentType === 'exam_review' ? 'questions' : 'sections'} ` +
      `starting at number ${startNumber}:`,
    ...part.concepts.map((c, i) => `  ${startNumber + i}. ${c}`),
    '',
    isFirst
      ? 'This is the first part: emit the <header class="cover"> block, then the part bar, then the units.'
      : 'This is NOT the first part: do NOT emit a cover. Start with the <div class="part-bar">.',
    isLast
      ? `This is the last part: after the units, emit the closing ${
          req.documentType === 'exam_review'
            ? '<table class="ref long"> cheat sheet ("If the question is about… / The key answer or trap"), 35–50 rows covering the WHOLE document, not just this part'
            : '<table class="ref"> ladder table summarising the progression across the WHOLE document'
        }.`
      : 'This is NOT the last part: do NOT emit a closing table.',
    '',
    'Return only the HTML fragment. Run the Part 5 self-check first.',
  ].join('\n')

  const res = await call({
    model: config.models.guide,
    system: stableSystem(taskFileFor(req.documentType)),
    content: [
      { type: 'text', text: sourceBlock(req), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: instructions },
    ],
    prefill: '<',
  })

  return {
    index,
    title: part.title,
    html: cleanFragment(res.text),
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
    cachedTokens: res.cachedTokens,
  }
}

/** Strip markdown fences and any shell tags the model leaked in anyway. */
export function cleanFragment(html: string) {
  return html
    .replace(/^\s*```(?:html)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/<\/?(?:html|head|body)[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim()
}

export function planCost(req: GenerationRequest) {
  return { sourceTokens: estimateTokens(sourceBlock(req)) }
}

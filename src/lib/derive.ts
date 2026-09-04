import { call, loadPrompt, parseJson } from './anthropic'
import { config } from './config'
import type { MaterialRow } from './db'
import type { StudySet } from './types'

/**
 * Stage 3 — derivatives. Turns a finished Pocket Guide into the retrieval layer
 * of the method: flashcards, a quiz, and a couple of applied-project briefs.
 *
 * It reads the guide's HTML, never the original PDF or web extract — that is the
 * ~70% token saving the blueprint calls for, and it keeps the derivatives
 * consistent with what the reader actually has in front of them.
 *
 * One call keeps the set coherent and avoids writing the guide-sized context a
 * second time. Free guides use GPT-4o mini; Plus guides use Gemini Flash.
 */
function languageNote(m: MaterialRow): string {
  if (m.language === 'pt') {
    return 'Every field in Portuguese. Give a canonical English technical term once in parentheses at first use, then Portuguese only.'
  }
  if (m.language === 'en') return 'Every field in English.'
  return (
    'Bilingual, matching the guide: technical vocabulary and the quiz answer/explanation prose in English; ' +
    'the recall phrasing of card fronts may use Portuguese where the guide’s intuition boxes do. Never translate a term the guide keeps in English.'
  )
}

export async function deriveStudySet(
  m: MaterialRow,
): Promise<{ set: StudySet; usage: { input: number; output: number; cached: number } }> {
  if (!m.html) throw new Error('Cannot derive a study set: the guide has no HTML.')

  const res = await call({
    model: m.credits_cost > 0 ? config.models.paidDerivative : config.models.freeDerivative,
    system: [{ type: 'text', text: loadPrompt('task-study-set.md') }],
    content: [
      { type: 'text', text: `=== POCKET GUIDE (HTML) ===\n${m.html}`, cache_control: { type: 'ephemeral' } },
      {
        type: 'text',
        text: [
          `TOPIC: ${m.topic}`,
          m.description ? `FOCUS: ${m.description}` : '',
          `LANGUAGE: ${languageNote(m)}`,
          '',
          'Produce the study set as JSON per the task spec above. Reply with the JSON object and nothing else.',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
  })

  const set = parseJson<StudySet>(res.text)
  const thin =
    !Array.isArray(set.flashcards) ||
    !Array.isArray(set.quiz) ||
    !Array.isArray(set.projects) ||
    set.flashcards.length < 10 ||
    set.quiz.length < 8 ||
    set.projects.length < 1
  if (thin) {
    throw new Error(
      `Study-set reply was malformed or too thin: ${set.flashcards?.length ?? 0} cards, ` +
        `${set.quiz?.length ?? 0} questions, ${set.projects?.length ?? 0} projects.`,
    )
  }

  return {
    set,
    usage: { input: res.inputTokens, output: res.outputTokens, cached: res.cachedTokens },
  }
}

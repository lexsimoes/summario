import { updateMaterial } from './db'
import { refundCredits } from './credits'
import { materialDir, runPipeline } from './pipeline'
import type { GenerationRequest } from './types'

/**
 * Generation takes minutes and would blow past any HTTP timeout, so the route
 * starts the job and returns immediately; the client polls for status.
 *
 * This is an in-process runner: right for a single-user instance, and the seam
 * to replace with a real queue the day this serves more than one person.
 */
const running = new Set<string>()

export function startJob(id: string, userId: string, req: GenerationRequest) {
  if (running.has(id)) return
  running.add(id)

  void (async () => {
    try {
      const result = await runPipeline(req, {
        outDir: materialDir(id),
        onProgress: (stage, detail) =>
          updateMaterial(id, { status: stage as never, stage_detail: detail }),
      })
      updateMaterial(id, {
        status: 'done',
        stage_detail: '',
        html: result.html,
        pdf_path: result.pdfPath,
        page_count: result.pageCount,
        validation: JSON.stringify({ html: result.htmlValidation, pdf: result.pdfValidation }),
        input_tokens: result.usage.input,
        output_tokens: result.usage.output,
        cached_tokens: result.usage.cached,
      })
    } catch (err) {
      updateMaterial(id, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
      // Nobody pays for our failure.
      refundCredits(userId, id)
    } finally {
      running.delete(id)
    }
  })()
}

export const isRunning = (id: string) => running.has(id)

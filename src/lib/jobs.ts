import {
  activeJobForMaterial,
  claimNextJob,
  enqueueJob as enqueueJobRow,
  finishJob,
  getMaterial,
  replaceStudySet,
  requeueInterruptedJobs,
  updateMaterial,
  type JobRow,
} from './db'
import { refundCredits } from './credits'
import { deriveStudySet } from './derive'
import { materialDir, runPipeline } from './pipeline'
import type { GenerationRequest, JobKind } from './types'

/**
 * Generation takes minutes and would blow past any HTTP timeout, so the route
 * enqueues a job and returns immediately; the client polls the material for
 * status.
 *
 * This is still an in-process worker — one container, one worker, concurrency
 * one — but the queue itself lives in SQLite now. A restart no longer loses
 * work: `resumeJobs()` runs on boot and puts anything that was mid-flight back
 * on the queue. The seam to a real external queue is unchanged; it just has
 * durable state behind it in the meantime.
 */

/** Fallback poll, in case a job was enqueued by another process on the volume. */
const IDLE_POLL_MS = 15_000

let draining = false
let drainAgain = false

async function drain() {
  if (draining) {
    drainAgain = true
    return
  }
  draining = true
  try {
    for (;;) {
      const job = claimNextJob()
      if (!job) break
      await runJob(job)
    }
  } catch (err) {
    console.error('[summario] job worker loop crashed', err)
  } finally {
    draining = false
    if (drainAgain) {
      drainAgain = false
      void drain()
    }
  }
}

let poll: ReturnType<typeof setInterval> | null = null
function startPolling() {
  if (poll) return
  poll = setInterval(() => void drain(), IDLE_POLL_MS)
  // Don't keep a process alive just for the poll (matters if a script ever
  // imports this module).
  poll.unref?.()
}

/** Nudge the worker — called right after a job is enqueued. */
export function wake() {
  void drain()
}

export function enqueueJob(j: { kind: JobKind; materialId: string; userId: string; payload?: unknown }): number {
  const id = enqueueJobRow(j)
  wake()
  return id
}

async function runJob(job: JobRow) {
  try {
    if (job.kind === 'generate') {
      await runGenerate(job)
    } else if (job.kind === 'derive') {
      await runDerive(job)
    } else {
      throw new Error(`Unknown job kind: ${job.kind}`)
    }
    finishJob(job.id, true)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    finishJob(job.id, false, message)
    onJobFailed(job, message)
  }
}

async function runGenerate(job: JobRow) {
  const req = JSON.parse(job.payload) as GenerationRequest
  const result = await runPipeline(req, {
    outDir: materialDir(job.material_id),
    onProgress: (stage, detail) =>
      updateMaterial(job.material_id, { status: stage as never, stage_detail: detail }),
  })
  updateMaterial(job.material_id, {
    status: 'done',
    stage_detail: '',
    html: result.html,
    pdf_path: result.pdfPath,
    page_count: result.pageCount,
    sources: result.sources.length ? JSON.stringify(result.sources) : null,
    validation: JSON.stringify({ html: result.htmlValidation, pdf: result.pdfValidation }),
    input_tokens: result.usage.input,
    output_tokens: result.usage.output,
    cached_tokens: result.usage.cached,
  })
}

async function runDerive(job: JobRow) {
  const m = getMaterial(job.material_id)
  if (!m) throw new Error(`Material ${job.material_id} not found`)
  updateMaterial(job.material_id, { derivatives_status: 'generating', derivatives_error: null })
  const { set } = await deriveStudySet(m)
  replaceStudySet(job.material_id, set)
  updateMaterial(job.material_id, { derivatives_status: 'ready', derivatives_error: null })
}

/** Side effects on the owning row when a job ends in failure. */
function onJobFailed(job: JobRow, message: string) {
  if (job.kind === 'generate') {
    updateMaterial(job.material_id, { status: 'failed', error: message })
    // Nobody pays for our failure.
    refundCredits(job.user_id, job.material_id)
  } else if (job.kind === 'derive') {
    // No credit is charged for a study set, so there is nothing to refund.
    updateMaterial(job.material_id, { derivatives_status: 'failed', derivatives_error: message })
  }
}

export const isRunning = (id: string) => Boolean(activeJobForMaterial(id))

/**
 * Boot hook. Requeue jobs the last process was running, and start the worker.
 *
 * A requeued job's material goes back to `pending` and keeps its credit — the
 * job is about to actually run. Only a job that has already used its restart
 * budget is failed and refunded, which is the case a redeploy loop would hit.
 *
 * Called from instrumentation.ts, which Next runs once per server start.
 */
export function resumeJobs() {
  const { requeued, abandoned } = requeueInterruptedJobs()

  for (const job of requeued) {
    if (job.kind === 'generate') {
      updateMaterial(job.material_id, { status: 'pending', stage_detail: '', error: null })
    } else if (job.kind === 'derive') {
      updateMaterial(job.material_id, { derivatives_status: 'generating', derivatives_error: null })
    }
  }
  for (const job of abandoned) {
    onJobFailed(
      job,
      'Generation was interrupted by a server restart. The credit has been refunded — start it again.',
    )
  }
  if (requeued.length || abandoned.length) {
    console.warn(
      `[summario] jobs after restart: ${requeued.length} resumed, ${abandoned.length} abandoned and refunded`,
    )
  }

  startPolling()
  wake()
}

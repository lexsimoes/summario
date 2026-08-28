import type { Dict } from '@/lib/i18n'
import type { Status } from '@/lib/types'

const tone: Record<Status, string> = {
  pending: 'pill',
  extracting: 'pill pill-run',
  planning: 'pill pill-run',
  generating: 'pill pill-run',
  rendering: 'pill pill-run',
  validating: 'pill pill-run',
  done: 'pill pill-ok',
  failed: 'pill pill-err',
}

export function StatusPill({ status, t }: { status: Status; t: Dict }) {
  const live = status !== 'done' && status !== 'failed'
  return (
    <span className={tone[status] ?? 'pill'}>
      {live && <span className="dot dot-live" />}
      {t.app.material.stages[status] ?? status}
    </span>
  )
}

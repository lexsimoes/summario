'use client'
import { useEffect, useState } from 'react'
import type { Status } from '@/lib/types'

interface Check { name: string; ok: boolean; detail: string }
interface Payload {
  status: Status
  stage: string
  error: string | null
  pdfReady: boolean
  pages: number
  validation: { html: { checks: Check[] }; pdf: { checks: Check[] } } | null
  usage: { input: number; output: number; cached: number }
}
interface Labels {
  open: string; checks: string; checksLede: string; usage: string
  tokensIn: string; tokensOut: string; tokensCached: string; pages: string
  stages: Record<string, string>
}

const TERMINAL: Status[] = ['done', 'failed']
const n = (v: number) => new Intl.NumberFormat().format(v)

export function DocumentStatus({ id, initialStatus, t }: { id: string; initialStatus: Status; t: Labels }) {
  const [data, setData] = useState<Payload | null>(null)
  const status = data?.status ?? initialStatus
  const running = !TERMINAL.includes(status)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      const res = await fetch(`/api/materials/${id}`, { cache: 'no-store' })
      if (!alive || !res.ok) return
      const payload: Payload = await res.json()
      setData(payload)
      if (!TERMINAL.includes(payload.status)) setTimeout(tick, 2500)
    }
    void tick()
    return () => { alive = false }
  }, [id])

  const checks = data?.validation ? [...data.validation.html.checks, ...data.validation.pdf.checks] : []
  const passed = checks.filter((c) => c.ok).length

  return (
    <div className="stack-l">
      <div className="card">
        <div className="row-between">
          <div className="row" style={{ gap: 10 }}>
            <span className={status === 'failed' ? 'pill pill-err' : status === 'done' ? 'pill pill-ok' : 'pill pill-run'}>
              {running && <span className="dot dot-live" />}
              {t.stages[status] ?? status}
            </span>
            {data?.stage && <span className="small">{data.stage}</span>}
          </div>
          {status === 'done' && (
            <a className="btn btn-primary btn-sm" href={`/api/materials/${id}/pdf`} target="_blank" rel="noreferrer">
              {t.open}
            </a>
          )}
        </div>

        {data?.error && <p className="error-note" style={{ marginTop: 18 }}>{data.error}</p>}

        {status === 'done' && data && (
          <div className="grid g4" style={{ marginTop: 24, gap: 18 }}>
            {[
              { l: t.pages, v: n(data.pages) },
              { l: t.tokensIn, v: n(data.usage.input) },
              { l: t.tokensOut, v: n(data.usage.output) },
              { l: t.tokensCached, v: n(data.usage.cached) },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.015em' }}>{s.v}</div>
                <div className="stat-label" style={{ marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {checks.length > 0 && (
        <div className="card">
          <div className="row-between" style={{ marginBottom: 4 }}>
            <h2 className="subtitle" style={{ margin: 0 }}>{t.checks}</h2>
            <span className={passed === checks.length ? 'pill pill-ok' : 'pill pill-warn'}>
              {passed}/{checks.length}
            </span>
          </div>
          <p className="small" style={{ marginBottom: 12 }}>{t.checksLede}</p>
          <div>
            {checks.map((c) => (
              <div key={c.name} className="check-row">
                <span className={c.ok ? 'check-mark check-ok' : 'check-mark check-bad'}>{c.ok ? '✓' : '✕'}</span>
                <span>
                  <strong style={{ fontWeight: 600 }}>{c.name}</strong>
                  <span className="tiny" style={{ display: 'block' }}>{c.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

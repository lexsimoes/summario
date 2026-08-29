'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dict } from '@/lib/i18n'
import type { DerivativesStatus } from '@/lib/types'

type T = Dict['app']['material']['study']

interface Flashcard { id: number; front: string; back: string; concept: string; weak: boolean }
interface QuizItem {
  id: number; question: string; answer: string; explanation: string
  trap: string; concept: string; isMultiSelect: boolean
}
interface Project { id: number; title: string; brief: string; concepts: string[] }
interface Payload {
  status: DerivativesStatus
  error: string | null
  weakConcepts: string[]
  flashcards: Flashcard[]
  quiz: QuizItem[]
  projects: Project[]
}

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export function StudySet({ id, guideHref, t }: { id: string; guideHref: string; t: T }) {
  const [data, setData] = useState<Payload | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'quiz' | 'cards' | 'projects'>('quiz')

  const load = useCallback(async () => {
    const res = await fetch(`/api/materials/${id}/study-set`, { cache: 'no-store' })
    if (res.ok) setData((await res.json()) as Payload)
  }, [id])

  useEffect(() => { void load() }, [load])

  // Poll while the derive job runs.
  useEffect(() => {
    if (data?.status !== 'generating') return
    const timer = setTimeout(() => void load(), 2500)
    return () => clearTimeout(timer)
  }, [data?.status, data, load])

  const generate = async () => {
    setBusy(true)
    try {
      await fetch(`/api/materials/${id}/study-set`, { method: 'POST' })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const status = data?.status ?? 'none'

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <h2 className="subtitle" style={{ margin: 0 }}>{t.title}</h2>
        {status === 'ready' && (
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={busy}>{t.regenerate}</button>
        )}
      </div>
      <p className="small" style={{ marginBottom: status === 'ready' ? 18 : 0 }}>{t.lede}</p>

      {status === 'none' && (
        <button className="btn btn-primary" onClick={generate} disabled={busy} style={{ marginTop: 16 }}>
          {busy ? t.generating : t.generate}
        </button>
      )}

      {status === 'generating' && (
        <p className="row" style={{ gap: 10, marginTop: 16 }}>
          <span className="pill pill-run"><span className="dot dot-live" />{t.generating}</span>
        </p>
      )}

      {status === 'failed' && (
        <div style={{ marginTop: 16 }}>
          <p className="error-note">{data?.error || t.failedLede}</p>
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={busy} style={{ marginTop: 12 }}>
            {t.retry}
          </button>
        </div>
      )}

      {status === 'ready' && data && (
        <>
          <div className="row" style={{ gap: 4, borderBottom: '1px solid var(--rule)', marginBottom: 22 }}>
            {([
              ['quiz', t.tabQuiz, data.quiz.length],
              ['cards', t.tabCards, data.flashcards.length],
              ['projects', t.tabProjects, data.projects.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="btn-quiet"
                style={{
                  border: 0, background: 'none', cursor: 'pointer',
                  padding: '10px 12px 12px', fontSize: 14,
                  fontWeight: tab === key ? 650 : 500,
                  color: tab === key ? 'var(--accent-ink)' : 'var(--muted)',
                  borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
                }}
              >
                {label} <span className="tiny">{count}</span>
              </button>
            ))}
          </div>

          {tab === 'quiz' && <Quiz id={id} items={data.quiz} guideHref={guideHref} t={t} />}
          {tab === 'cards' && <Cards id={id} cards={data.flashcards} t={t} />}
          {tab === 'projects' && <Projects projects={data.projects} t={t} />}
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- quiz */

function Quiz({ id, items, guideHref, t }: { id: string; items: QuizItem[]; guideHref: string; t: T }) {
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [hits, setHits] = useState(0)
  const [weak, setWeak] = useState<string[]>([])
  const done = pos >= items.length

  const grade = async (correct: boolean) => {
    const q = items[pos]
    if (correct) setHits((n) => n + 1)
    setRevealed(false)
    setPos((n) => n + 1)
    try {
      const res = await fetch(`/api/materials/${id}/quiz-attempt`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, correct }),
      })
      if (res.ok) setWeak((await res.json()).weakConcepts ?? [])
    } catch {
      /* the attempt is a nicety, not worth blocking the flow */
    }
  }

  const restart = () => { setPos(0); setRevealed(false); setHits(0) }

  if (done) {
    return (
      <div className="stack">
        <h3 className="subtitle" style={{ margin: 0 }}>{t.quizDoneTitle}</h3>
        <p className="small">{fill(t.quizScore, { hits, total: items.length })}</p>
        <div className="card card-quiet">
          <div className="stat-label" style={{ marginBottom: 10 }}>{t.weakTitle}</div>
          {weak.length === 0 ? (
            <p className="small" style={{ margin: 0 }}>{t.weakNone}</p>
          ) : (
            <div className="row" style={{ gap: 8 }}>
              {weak.map((c) => <span key={c} className="pill pill-warn">{c}</span>)}
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <a className="btn btn-ghost btn-sm" href={guideHref}>{t.reviewGuide}</a>
          <button className="btn btn-ghost btn-sm" onClick={restart}>{t.restart}</button>
        </div>
      </div>
    )
  }

  const q = items[pos]
  return (
    <div className="stack">
      <div className="row-between">
        <span className="tiny">{fill(t.quizProgress, { n: pos + 1, total: items.length })}</span>
        <div className="meter" style={{ width: 120 }}>
          <span style={{ width: `${(pos / items.length) * 100}%` }} />
        </div>
      </div>

      <p style={{ fontFamily: 'var(--serif)', fontSize: 17, margin: 0 }}>{q.question}</p>

      {!revealed ? (
        <button className="btn btn-primary btn-sm" onClick={() => setRevealed(true)}>{t.reveal}</button>
      ) : (
        <div className="stack-s">
          <div className="doc-box doc-answer">
            <div className="doc-lab">{t.answerLabel}</div>
            <p>{q.answer}</p>
          </div>
          {q.explanation && (
            <div className="doc-box doc-deepdive">
              <div className="doc-lab">{t.whyLabel}</div>
              <p>{q.explanation}</p>
            </div>
          )}
          {q.trap && (
            <div className="doc-box doc-trap">
              <div className="doc-lab">{t.trapLabel}</div>
              <p>{q.trap}</p>
            </div>
          )}
          <div className="row" style={{ gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => void grade(true)}>{t.gotIt}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => void grade(false)}>{t.missedIt}</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- flashcards */

function Cards({ id, cards, t }: { id: string; cards: Flashcard[]; t: T }) {
  // Weak concepts first, order otherwise preserved.
  const ordered = useMemo(
    () => [...cards].sort((a, b) => Number(b.weak) - Number(a.weak)),
    [cards],
  )
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = ordered[pos]

  const go = (delta: number) => {
    setFlipped(false)
    setPos((n) => Math.min(ordered.length - 1, Math.max(0, n + delta)))
  }

  return (
    <div className="stack">
      <div className="row-between">
        <span className="tiny">{fill(t.cardProgress, { n: pos + 1, total: ordered.length })}</span>
        <a className="link-arrow" href={`/api/materials/${id}/anki`}>{t.exportAnki} <span>↓</span></a>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="card card-quiet"
        style={{ textAlign: 'left', cursor: 'pointer', minHeight: 150, width: '100%' }}
      >
        {card.weak && <span className="pill pill-warn" style={{ marginBottom: 12 }}>{card.concept}</span>}
        <p style={{ fontFamily: 'var(--serif)', fontSize: 16, margin: 0 }}>
          {flipped ? card.back : card.front}
        </p>
        {!flipped && <p className="tiny" style={{ marginTop: 14 }}>{t.flipHint}</p>}
      </button>

      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => go(-1)} disabled={pos === 0}>{t.prev}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => go(1)} disabled={pos === ordered.length - 1}>{t.next}</button>
      </div>
      <p className="tiny" style={{ margin: 0 }}>{t.weightedNote}</p>
    </div>
  )
}

/* --------------------------------------------------------------- projects */

function Projects({ projects, t }: { projects: Project[]; t: T }) {
  return (
    <div className="stack">
      <p className="small" style={{ marginTop: 0 }}>{t.projectsLede}</p>
      {projects.map((p) => (
        <div key={p.id} className="card card-quiet">
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, margin: '0 0 8px' }}>{p.title}</h3>
          <p className="prose" style={{ fontSize: 14.5 }}>{p.brief}</p>
          {p.concepts.length > 0 && (
            <p className="tiny" style={{ margin: '12px 0 0' }}>
              {t.exercises}: {p.concepts.join(' · ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

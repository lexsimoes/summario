'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Dict } from '@/lib/i18n'
import type { DocumentType, SourceKind } from '@/lib/types'

interface Props {
  t: Dict['app']['create']
  types: Dict['types']
  languages: Dict['languages']
  cost: Record<DocumentType, number>
  balance: number
}

export function NewDocumentForm({ t, types, languages, cost, balance }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<SourceKind>('upload')
  // Attaching a question bank is what turns the output into an exam review,
  // so the price on screen has to react to the file input, not to a dropdown.
  const [isReview, setIsReview] = useState(false)

  const price = isReview ? cost.exam_review : cost.pocket_guide
  const affordable = balance >= price

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/materials', { method: 'POST', body: new FormData(e.currentTarget) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error === 'insufficient_credits' ? t.insufficient : data.error)
      router.push(`/app/documents/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label className="label" htmlFor="topic">{t.topic}</label>
        <input className="input" id="topic" name="topic" required placeholder={t.topicPh} />
      </div>

      <div className="field">
        <label className="label" htmlFor="description">{t.scope}</label>
        <textarea className="textarea" id="description" name="description" placeholder={t.scopePh} />
      </div>

      <div className="field">
        <label className="label" htmlFor="language">{t.language}</label>
        <select className="select" id="language" name="language" defaultValue="bilingual">
          <option value="bilingual">{languages.bilingual}</option>
          <option value="en">{languages.en}</option>
          <option value="pt">{languages.pt}</option>
        </select>
      </div>

      {/* Source is a real fork in how the document is built, so it is a choice
          you make, not a file field you happen to leave empty. */}
      <fieldset className="field" style={{ border: 0, padding: 0, margin: '26px 0 0' }}>
        <legend className="label" style={{ padding: 0 }}>{t.source}</legend>

        <div className="grid g2" style={{ gap: 12 }}>
          {([
            { key: 'upload' as const, name: t.sourceUpload, hint: t.sourceUploadHint },
            { key: 'web' as const, name: t.sourceWeb, hint: t.sourceWebHint },
          ]).map((opt) => (
            <label
              key={opt.key}
              className="card"
              style={{
                cursor: 'pointer',
                padding: '14px 16px',
                borderColor: source === opt.key ? 'var(--accent)' : undefined,
                background: source === opt.key ? 'var(--accent-tint)' : 'var(--surface)',
                borderRadius: 'var(--r-m)',
              }}
            >
              <span className="row" style={{ gap: 9, marginBottom: 6 }}>
                <input
                  type="radio"
                  name="sourceMode"
                  value={opt.key}
                  checked={source === opt.key}
                  onChange={() => setSource(opt.key)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span style={{ fontWeight: 650, fontSize: 14.5 }}>{opt.name}</span>
              </span>
              <span className="small" style={{ display: 'block', margin: 0 }}>{opt.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {source === 'upload' && (
        <>
          <div className="field" style={{ marginTop: 18 }}>
            <label className="label" htmlFor="pdf">{t.pdf}</label>
            <input className="file" id="pdf" name="pdf" type="file" accept="application/pdf" required />
          </div>

          <div className="grid g2" style={{ gap: 16, marginTop: 18 }}>
            <div>
              <label className="label" htmlFor="from">{t.from}</label>
              <input className="input" id="from" name="from" placeholder="7.1" />
            </div>
            <div>
              <label className="label" htmlFor="to">{t.to}</label>
              <input className="input" id="to" name="to" placeholder="7.6" />
            </div>
          </div>
          <p className="hint">{t.sliceHint}</p>
        </>
      )}

      <div className="field" style={{ marginTop: 18 }}>
        <label className="label" htmlFor="questions">{t.questions}</label>
        <input
          className="file"
          id="questions"
          name="questions"
          type="file"
          accept=".txt,.md,.csv"
          onChange={(e) => setIsReview(Boolean(e.currentTarget.files?.length))}
        />
        <p className="hint">{t.questionsHint}</p>
      </div>

      {error && <p className="error-note" style={{ marginTop: 20 }}>{error}</p>}

      <div className="row-between" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--rule-soft)' }}>
        <div>
          <div className="stat-label">{t.cost}</div>
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 17 }}>{price} {price === 1 ? t.credit : t.creditsPl}</strong>
            <span className="pill">{isReview ? types.exam_review : types.pocket_guide}</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy || !affordable}>
          {busy ? t.working : t.submit}
        </button>
      </div>

      {!affordable && <p className="error-note" style={{ marginTop: 16 }}>{t.insufficient}</p>}
    </form>
  )
}

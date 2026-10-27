'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Dict, Locale } from '@/lib/i18n'
import type { SourceKind } from '@/lib/types'

interface Props {
  t: Dict['app']['create']
  types: Dict['types']
  languages: Dict['languages']
  cost: number
  balance: number
  freeRemaining: number
  freeLimit: number
  isPlus: boolean
  initialSource?: SourceKind
  locale?: Locale
  modelOptions?: { value: string; label: string }[]
  uploadOnly?: boolean
}

export function NewDocumentForm({
  t,
  types,
  languages,
  cost,
  balance,
  freeRemaining,
  freeLimit,
  isPlus,
  initialSource,
  locale = 'pt',
  modelOptions,
  uploadOnly = false,
}: Props) {
  const router = useRouter()
  const pt = locale === 'pt'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<SourceKind>(initialSource ?? (isPlus ? 'upload' : 'web'))

  const paid = balance >= cost
  const affordable = paid || freeRemaining > 0
  const blockedByPlusPdf = !uploadOnly && source === 'upload' && !isPlus

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (blockedByPlusPdf) {
      setError(t.pdfPlusOnly)
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/materials', { method: 'POST', body: new FormData(e.currentTarget) })
      const data = await res.json()
      if (!res.ok)
        throw new Error(
          data.error === 'insufficient_credits' || data.error === 'free_guide_used'
            ? t.insufficient
            : data.error === 'pdf_plus_required'
              ? t.pdfPlusOnly
              : data.error,
        )
      router.push(`/app/documents/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {!uploadOnly && (
        <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
          <legend className="label" style={{ padding: 0, marginBottom: 8 }}>{t.source}</legend>
          <input type="hidden" name="sourceMode" value={source} />
          <div className="workspace-entry-grid" style={{ marginTop: 0 }}>
            <button
              type="button"
              className="workspace-entry-chip"
              data-active={source === 'web'}
              onClick={() => {
                setSource('web')
                setError('')
              }}
            >
              <span className="workspace-entry-icon" aria-hidden="true">⌕</span>
              <span className="workspace-entry-text">
                <span className="workspace-entry-top">
                  <strong>{pt ? 'Escolha um tema' : 'Choose a topic'}</strong>
                  <span className="workspace-badge-free">Free &amp; Plus</span>
                </span>
                <small>{t.sourceWebHint}</small>
              </span>
            </button>

            <button
              type="button"
              className="workspace-entry-chip"
              data-active={source === 'upload'}
              onClick={() => {
                setSource('upload')
                setError('')
              }}
            >
              <span className="workspace-entry-icon" aria-hidden="true">▧</span>
              <span className="workspace-entry-text">
                <span className="workspace-entry-top">
                  <strong>{pt ? 'Use seu material (PDF)' : 'Use your own material (PDF)'}</strong>
                  <span className="workspace-badge-plus">Plus</span>
                </span>
                <small>{t.sourceUploadHint}</small>
              </span>
            </button>
          </div>
        </fieldset>
      )}

      {blockedByPlusPdf && (
        <div className="workspace-plus-callout" role="status">
          <div>
            <strong>
              {pt
                ? 'O envio do seu próprio PDF está incluído no Pacote Plus'
                : 'Uploading your own PDF is included in the Plus Pack'}
            </strong>
            <p>
              {pt
                ? '30 gerações por US$ 9 · pagamento único · créditos que não expiram. No plano Free você pode criar até 5 guias/mês pesquisando qualquer tema.'
                : '30 generations for US$ 9 · one-time payment · non-expiring credits. On Free you can create up to 5 topic-based guides/month.'}
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSource('web')}>
              {pt ? 'Pesquisar por tema' : 'Research a topic'}
            </button>
            <Link href="/app/credits" className="btn btn-primary btn-sm">
              {pt ? 'Ver Pacote Plus →' : 'View Plus Pack →'}
            </Link>
          </div>
        </div>
      )}

      <div className="field" style={{ marginTop: 20 }}>
        <label className="label" htmlFor="topic">{t.topic}</label>
        <input className="input" id="topic" name="topic" required placeholder={t.topicPh} />
      </div>

      {modelOptions?.length ? (
        <div className="field">
          <label className="label" htmlFor="sandboxModel">Modelo</label>
          <select className="select" id="sandboxModel" name="sandboxModel" defaultValue={modelOptions[0].value}>
            {modelOptions.map((model) => (
              <option key={model.value} value={model.value}>{model.label}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label className="label" htmlFor="description">{t.scope}</label>
        <textarea className="textarea" id="description" name="description" placeholder={t.scopePh} />
        <p className="hint">{t.scopeHint}</p>
      </div>

      <div className="field">
        <label className="label" htmlFor="language">{t.language}</label>
        <select className="select" id="language" name="language" defaultValue="bilingual">
          <option value="bilingual">{languages.bilingual}</option>
          <option value="en">{languages.en}</option>
          <option value="pt">{languages.pt}</option>
        </select>
      </div>

      {(uploadOnly || (isPlus && source === 'upload')) && (
        <div className="field" style={{ marginTop: 18 }}>
          <label className="label" htmlFor="pdf">{t.pdf}</label>
          <input className="file" id="pdf" name="pdf" type="file" accept="application/pdf" required />
        </div>
      )}

      {error && <p className="error-note" style={{ marginTop: 20 }}>{error}</p>}

      <div className="row-between" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--rule-soft)' }}>
        <div>
          <div className="stat-label">{t.cost}</div>
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <strong style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400 }}>
              {paid
                ? `${cost} ${cost === 1 ? t.credit : t.creditsPl}`
                : t.freeIncluded.replace('{n}', String(freeRemaining)).replace('{total}', String(freeLimit))}
            </strong>
            <span className="pill">{types.pocket_guide}</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy || !affordable || blockedByPlusPdf}>
          {busy ? t.working : t.submit}
        </button>
      </div>

      {!affordable && <p className="error-note" style={{ marginTop: 16 }}>{t.insufficient}</p>}
    </form>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

const MODELS = [
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', note: 'mais barato do Gemini atual' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', note: 'melhor custo-benefício promocional' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini', note: 'referência legada barata' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 mini', note: 'Mini atual' },
  { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', note: 'Mini moderno mais forte' },
  { value: 'claude-opus-5', label: 'Claude Opus 5', note: 'controle de qualidade' },
] as const

export function SandboxForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [prompt, setPrompt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState(MODELS[1].value as string)
  const [language, setLanguage] = useState('bilingual')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setBusy(true)
    setError('')
    const data = new FormData()
    data.set('topic', prompt.trim().slice(0, 180))
    data.set('description', prompt.trim())
    data.set('language', language)
    data.set('sandboxModel', model)
    if (file) data.set('pdf', file)

    try {
      const res = await fetch('/api/materials', { method: 'POST', body: data })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Não foi possível iniciar a geração.')
      router.push(`/app/documents/${body.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const selected = MODELS.find((item) => item.value === model)!

  return (
    <form onSubmit={submit}>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <select className="select" value={model} onChange={(e) => setModel(e.target.value)} style={{ flex: '1 1 260px' }}>
          {MODELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ flex: '0 1 190px' }}>
          <option value="bilingual">Bilíngue</option>
          <option value="pt">Português</option>
          <option value="en">English</option>
        </select>
      </div>

      <p className="tiny" style={{ margin: '0 0 14px' }}>{selected.note} · o custo será calculado pelo uso retornado pela API</p>

      <div className="card" style={{ padding: 12, background: 'var(--surface)' }}>
        <textarea
          className="textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={file ? 'Diga qual capítulo, seção ou foco você quer...' : 'Digite um tema para pesquisar na internet...'}
          rows={5}
          required
          style={{ border: 0, boxShadow: 'none', resize: 'vertical' }}
        />
        <div className="row-between" style={{ paddingTop: 10, borderTop: '1px solid var(--rule-soft)', gap: 12 }}>
          <div className="row" style={{ gap: 9, minWidth: 0 }}>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button className="btn btn-quiet btn-sm" type="button" onClick={() => fileRef.current?.click()}>
              {file ? 'Trocar PDF' : 'Anexar PDF'}
            </button>
            {file && <span className="tiny" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !prompt.trim()}>
            {busy ? 'Iniciando…' : file ? 'Gerar do PDF' : 'Pesquisar e gerar'}
          </button>
        </div>
      </div>
      {error && <p className="error-note" style={{ marginTop: 14 }}>{error}</p>}
    </form>
  )
}

'use client'
import { useCallback, useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n'
import styles from './guide-workspace.module.css'

const labels = {
  pt: {
    title: 'Continue estudando', cost: 'Custo adicional da API', lede: 'Pergunte ao guia, treine o que errou e guarde suas anotações.',
    tabAsk: 'Pergunte ao guia', tabPractice: 'Treino personalizado', tabNotes: 'Anotações',
    dailyLimit: 'Limite diário atingido. Volte amanhã.', failure: 'Não foi possível concluir. Tente novamente.',
    askLede: 'Respostas baseadas nas seções do guia. Os links abaixo são fontes consultadas na criação, não citações de cada resposta.',
    sources: 'Fontes do guia', example: 'Por exemplo: “Qual é a diferença entre os dois conceitos principais?”',
    sourcePdf: 'PDF de apoio enviado',
    you: 'Você', noCitation: 'Sem seção verificável para citar.', askLabel: 'Pergunta sobre o guia',
    askPlaceholder: 'Pergunte algo sobre este guia...', answering: 'Respondendo...', send: 'Enviar',
    practiceLede: 'Gere cinco perguntas do próprio guia. Seus erros vão orientar o próximo treino e a ordem dos flashcards.',
    difficulty: 'Dificuldade', fundamentals: 'Fundamentos', intermediate: 'Intermediário', exam: 'Estilo prova',
    focus: 'Foco', prioritize: 'Priorizar meus erros', overview: 'Visão geral', creating: 'Criando...', generate: 'Gerar treino',
    finished: 'Treino concluído. Gere outro para continuar.', question: 'Pergunta', of: 'de', reveal: 'Mostrar resposta',
    answer: 'Resposta', correct: 'Acertei', incorrect: 'Errei', attemptError: 'A resposta não foi registrada. Verifique a conexão.',
    notesLede: 'Selecione uma seção, destaque um trecho e escreva sua anotação. O PDF original permanece intacto.',
    section: 'Seção', highlight: 'Trecho destacado', selectExcerpt: 'Selecione um trecho acima', removeHighlight: 'Remover destaque',
    yourNote: 'Sua anotação', notePlaceholder: 'Escreva sua dúvida, conexão ou resumo pessoal...', saving: 'Salvando...', save: 'Salvar anotação',
  },
  en: {
    title: 'Keep studying', cost: 'Additional API cost', lede: 'Ask the guide, practice what you missed, and keep your notes.',
    tabAsk: 'Ask the guide', tabPractice: 'Personalized practice', tabNotes: 'Notes',
    dailyLimit: 'Daily limit reached. Come back tomorrow.', failure: 'Could not complete this. Please try again.',
    askLede: 'Answers use sections of this guide. Links below are sources consulted for the guide, not claim-level citations for each answer.',
    sources: 'Guide sources', example: 'For example: “What is the difference between the two main concepts?”',
    sourcePdf: 'Uploaded source PDF',
    you: 'You', noCitation: 'No verifiable section to cite.', askLabel: 'Question about the guide',
    askPlaceholder: 'Ask something about this guide...', answering: 'Answering...', send: 'Send',
    practiceLede: 'Generate five questions from the guide. Mistakes shape your next practice and flashcard order.',
    difficulty: 'Difficulty', fundamentals: 'Foundations', intermediate: 'Intermediate', exam: 'Exam style',
    focus: 'Focus', prioritize: 'Prioritize my mistakes', overview: 'Overview', creating: 'Creating...', generate: 'Generate practice',
    finished: 'Practice complete. Generate another set to continue.', question: 'Question', of: 'of', reveal: 'Show answer',
    answer: 'Answer', correct: 'I got it', incorrect: 'I missed it', attemptError: 'Your answer was not saved. Check your connection.',
    notesLede: 'Choose a section, highlight a passage, and write a note. The original PDF stays unchanged.',
    section: 'Section', highlight: 'Highlighted passage', selectExcerpt: 'Select a passage above', removeHighlight: 'Remove highlight',
    yourNote: 'Your note', notePlaceholder: 'Write a question, connection, or personal summary...', saving: 'Saving...', save: 'Save note',
  },
}

interface Section { id: string; title: string; text: string }
interface Note { section_id: string; note: string; highlight: string }
interface Message { id?: number; question: string; answer: string; citations: string[] }
interface PracticeQuestion { id: number; question: string; answer: string; explanation: string; trap: string; concept: string; difficulty: string }
interface Payload {
  sections: Section[]; sources: Array<{ title: string; url?: string }>; notes: Note[]; chat: Message[]; practice: PracticeQuestion[]
  weakConcepts: string[]; additionalCostUsd: number
}
type Tab = 'ask' | 'practice' | 'notes'

export function GuideWorkspace({ id, locale }: { id: string; locale: Locale }) {
  const t = labels[locale]
  const [data, setData] = useState<Payload | null>(null)
  const [tab, setTab] = useState<Tab>('ask')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [concept, setConcept] = useState('')
  const [practicePos, setPracticePos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [sectionId, setSectionId] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [highlightDraft, setHighlightDraft] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/materials/${id}/guide-workspace`, { cache: 'no-store' })
    if (res.ok) { setData(await res.json() as Payload); return true }
    if (res.status === 409) {
      const result = await res.json() as { status?: string }
      if (result.status === 'failed') return true
    }
    return false
  }, [id])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      const ready = await load()
      if (active && !ready) timer = setTimeout(poll, 3000)
    }
    void poll()
    return () => { active = false; clearTimeout(timer) }
  }, [load])

  useEffect(() => {
    if (data?.sections.length && !sectionId) {
      const first = data.sections[0].id
      setSectionId(first)
      const saved = data.notes.find((n) => n.section_id === first)
      setNoteDraft(saved?.note ?? '')
      setHighlightDraft(saved?.highlight ?? '')
    }
  }, [data, sectionId])

  const selectSection = (next: string) => {
    setSectionId(next)
    const saved = data?.notes.find((n) => n.section_id === next)
    setNoteDraft(saved?.note ?? '')
    setHighlightDraft(saved?.highlight ?? '')
  }

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/materials/${id}/guide-workspace`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await res.json() as Record<string, unknown>
    if (!res.ok) throw new Error(res.status === 429 ? t.dailyLimit : t.failure)
    return json
  }

  const ask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.trim() || busy) return
    setBusy(true); setError('')
    try {
      const asked = question.trim()
      const result = await post({ action: 'chat', question: asked })
      setData((old) => old && ({ ...old,
        chat: [...old.chat, { question: asked, answer: String(result.answer), citations: result.citations as string[] }],
        additionalCostUsd: Number(result.additionalCostUsd),
      }))
      setQuestion('')
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  const generatePractice = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await post({ action: 'practice', difficulty, concept })
      setData((old) => old && ({ ...old, practice: result.questions as PracticeQuestion[],
        additionalCostUsd: Number(result.additionalCostUsd) }))
      setPracticePos(0); setRevealed(false)
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  const grade = async (correct: boolean) => {
    const item = data?.practice[practicePos]
    if (!item) return
    setPracticePos((n) => n + 1); setRevealed(false)
    try {
      const res = await fetch(`/api/materials/${id}/quiz-attempt`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: item.id, correct }),
      })
      if (res.ok) {
        const result = await res.json() as { weakConcepts: string[] }
        setData((old) => old && ({ ...old, weakConcepts: result.weakConcepts }))
      }
    } catch { setError(t.attemptError) }
  }

  const saveNote = async () => {
    if (!sectionId || busy) return
    setBusy(true); setError('')
    try {
      const result = await post({ action: 'note', sectionId, note: noteDraft, highlight: highlightDraft })
      setData((old) => old && ({ ...old, notes: result.notes as Note[] }))
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  if (!data) return null
  const activeSection = data.sections.find((s) => s.id === sectionId) ?? data.sections[0]
  const activePractice = data.practice[practicePos]

  return <div className="card">
    <div className="row-between">
      <h2 className="subtitle" style={{ margin: 0 }}>{t.title}</h2>
      <span className="tiny">{t.cost}: USD {data.additionalCostUsd.toFixed(4)}</span>
    </div>
    <p className="small" style={{ margin: '6px 0 18px' }}>{t.lede}</p>
    <div className={styles.tabs} role="tablist" aria-label={t.title}>
      {([['ask', t.tabAsk], ['practice', t.tabPractice], ['notes', t.tabNotes]] as const).map(([key, label]) =>
        <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? styles.active : ''}
          onClick={() => { setTab(key); setError(''); if (key === 'practice') void load() }}>{label}</button>)}
    </div>
    {error && <p className="error-note" role="alert">{error}</p>}

    {tab === 'ask' && <div className={styles.panel}>
      <p className="small">{t.askLede}</p>
      {data.sources.length > 0 && <details className={styles.sourceList}><summary>{t.sources} ({data.sources.length})</summary>
        <ul>{data.sources.map((source, i) => <li key={`${source.url ?? 'pdf'}-${i}`}>
          {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : t.sourcePdf}
        </li>)}</ul>
      </details>}
      <div className={styles.messages} aria-live="polite">
        {data.chat.length === 0 && <p className="tiny">{t.example}</p>}
        {data.chat.map((message, i) => <div key={message.id ?? i} className={styles.message}>
          <p className={styles.ask}><strong>{t.you}:</strong> {message.question}</p>
          <p className={styles.answer}>{message.answer}</p>
          {message.citations.length > 0 ? <div className={styles.citations}>
            {message.citations.map((sid) => <button key={sid} className="btn btn-ghost btn-sm" onClick={() => {
              selectSection(sid); setTab('notes')
            }}>{data.sections.find((s) => s.id === sid)?.title ?? sid}</button>)}
          </div> : <p className="tiny">{t.noCitation}</p>}
        </div>)}
      </div>
      <form onSubmit={(event) => void ask(event)} className={styles.formRow}>
        <input aria-label={t.askLabel} value={question} onChange={(e) => setQuestion(e.target.value)}
          maxLength={600} placeholder={t.askPlaceholder} />
        <button className="btn btn-primary btn-sm" disabled={busy || !question.trim()}>{busy ? t.answering : t.send}</button>
      </form>
    </div>}

    {tab === 'practice' && <div className={styles.panel}>
      <p className="small">{t.practiceLede}</p>
      <div className={styles.controls}>
        <label>{t.difficulty} <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="fundamentals">{t.fundamentals}</option><option value="intermediate">{t.intermediate}</option>
          <option value="exam">{t.exam}</option>
        </select></label>
        <label>{t.focus} <select value={concept} onChange={(e) => setConcept(e.target.value)}>
          <option value="">{data.weakConcepts.length ? t.prioritize : t.overview}</option>
          {data.weakConcepts.map((c) => <option key={c} value={c}>{c}</option>)}
        </select></label>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void generatePractice()}>
          {busy ? t.creating : t.generate}
        </button>
      </div>
      {data.practice.length > 0 && <div className={styles.practice}>
        {!activePractice ? <p>{t.finished}</p> : <>
          <p className="tiny">{t.question} {practicePos + 1} {t.of} {data.practice.length} · {activePractice.concept}</p>
          <p className={styles.prompt}>{activePractice.question}</p>
          {!revealed ? <button className="btn btn-ghost btn-sm" onClick={() => setRevealed(true)}>{t.reveal}</button> : <>
            <div className="doc-box doc-answer"><div className="doc-lab">{t.answer}</div><p>{activePractice.answer}</p></div>
            {activePractice.explanation && <p className="small">{activePractice.explanation}</p>}
            <div className={styles.controls}>
              <button className="btn btn-ghost btn-sm" onClick={() => void grade(true)}>{t.correct}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => void grade(false)}>{t.incorrect}</button>
            </div>
          </>}
        </>}
      </div>}
    </div>}

    {tab === 'notes' && <div className={styles.panel}>
      <p className="small">{t.notesLede}</p>
      <label className={styles.sectionSelect}>{t.section} <select value={activeSection?.id ?? ''} onChange={(e) => selectSection(e.target.value)}>
        {data.sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select></label>
      {activeSection && <>
        <div className={styles.sectionText} onMouseUp={() => {
          const selection = window.getSelection()?.toString().trim() ?? ''
          if (selection && activeSection.text.includes(selection)) setHighlightDraft(selection.slice(0, 1000))
        }}><h3>{activeSection.title}</h3><p>{activeSection.text}</p></div>
        <label className={styles.blockLabel}>{t.highlight}
          <input value={highlightDraft} readOnly placeholder={t.selectExcerpt} />
        </label>
        {highlightDraft && <button className="btn btn-ghost btn-sm" onClick={() => setHighlightDraft('')}>{t.removeHighlight}</button>}
        <label className={styles.blockLabel}>{t.yourNote}
          <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} maxLength={5000}
            rows={5} placeholder={t.notePlaceholder} />
        </label>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void saveNote()}>
          {busy ? t.saving : t.save}
        </button>
      </>}
    </div>}
  </div>
}

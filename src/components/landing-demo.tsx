'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'
import s from '@/app/landing.module.css'

export function StudyDemo({ locale, initial = 'upload' }: { locale: Locale; initial?: 'upload' | 'quiz' }) {
  const pt = locale === 'pt'
  const [stage, setStage] = useState(initial)
  const [answer, setAnswer] = useState<number | null>(null)
  return (
    <div className={s.demo}>
      <div className={s.demoTop}><span className={s.demoDots}><i /><i /><i /></span><span>{pt ? 'Seu próximo momento de descoberta' : 'Your next lightbulb moment'}</span><span>✧</span></div>
      {stage === 'upload' ? <div className={s.uploadScene}>
        <div className={s.fileStack} aria-hidden="true"><span>PDF</span><span>✧</span><span>TXT</span></div>
        <h3>{pt ? 'Tudo começa com uma ideia.' : 'It starts with a little curiosity.'}</h3>
        <p>{pt ? 'Um tema ou um PDF. Um mundo para aprender.' : 'A topic or a PDF. A whole world to learn.'}</p>
        <div className={s.fileRow}><span className={s.fileIcon}>PDF</span><span><b>{pt ? 'Introdução à biologia.pdf' : 'Introduction to biology.pdf'}</b><small>{pt ? 'Capítulo 1 · As células' : 'Chapter 1 · Cells'}</small></span><span className={s.fileCheck}>✓</span></div>
        <div className={s.fileRow}><span className={`${s.fileIcon} ${s.topicIcon}`}>⌕</span><span><b>{pt ? 'Como as células produzem energia?' : 'How do cells produce energy?'}</b><small>{pt ? 'Pesquisa por tema' : 'Topic research'}</small></span><span className={s.fileCheck}>✓</span></div>
        <button className={s.demoButton} onClick={() => {setStage('quiz'); setAnswer(null)}}>{pt ? 'Experimentar uma atividade' : 'Try a learning activity'} <span>→</span></button>
        <span className={s.demoCaption}>{pt ? 'Demonstração interativa' : 'Interactive preview'}</span>
      </div> : <div className={s.quizScene}>
        <div className={s.quizMeta}><span>✦ {pt ? 'HORA DE PRATICAR' : 'TIME TO PRACTICE'}</span><button onClick={() => setStage('upload')}>{pt ? 'Voltar' : 'Back'} ↶</button></div>
        <div className={s.progressTrack}><span /></div>
        <h3>{pt ? 'Qual organela produz a maior parte do ATP da célula?' : 'Which organelle produces most of the cell’s ATP?'}</h3>
        <p>{pt ? 'Dê um pequeno passo. Fixe uma grande ideia.' : 'One small question. One big idea that sticks.'}</p>
        <div className={s.answers}>{(pt ? ['Núcleo', 'Mitocôndria', 'Ribossomo'] : ['Nucleus', 'Mitochondrion', 'Ribosome']).map((label, i) => <button key={label} aria-pressed={answer === i} data-result={answer === i ? (i === 1 ? 'correct' : 'incorrect') : undefined} onClick={() => setAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{label}<b>{answer === i ? (i === 1 ? '✓' : '×') : ''}</b></button>)}</div>
        <p className={s.feedback} aria-live="polite">{answer === null ? (pt ? 'Escolha uma resposta para conferir.' : 'Choose an answer to check your understanding.') : answer === 1 ? (pt ? 'Isso! A mitocôndria gera ATP na respiração celular.' : 'Exactly! Mitochondria generate ATP through cellular respiration.') : (pt ? 'Quase! Pense na “usina de energia” da célula. Tente de novo.' : 'Almost! Think of the cell’s “powerhouse”. Try again.')}</p>
      </div>}
    </div>
  )
}

export function LearningSteps({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0)
  const pt = locale === 'pt'
  const steps = pt ? [
    ['Escolha o que quer aprender', 'Pesquise um tema ou envie seu PDF no Plus. O summario organiza o conteúdo em um guia feito para você.'],
    ['Aprenda colocando em prática', 'Quizzes, flashcards e projetos transformam a leitura em conhecimento que fica.'],
  ] : [
    ['Bring your curiosity', 'Research a topic or upload a PDF with Plus. summario turns your material into a guide made for you.'],
    ['Make every idea stick', 'Quizzes, flashcards, and projects turn reading into knowledge you can actually use.'],
  ]
  return <div className={s.learningGrid}>
    <div className={s.stepChoices}>{steps.map(([title, description], i) => <button key={title} className={s.stepChoice} aria-pressed={active === i} onClick={() => setActive(i)}><h3>{title}</h3><p>{description}</p></button>)}</div>
    <StudyDemo key={active} locale={locale} initial={active === 0 ? 'upload' : 'quiz'} />
  </div>
}

export function FlashcardPreview({ locale }: { locale: Locale }) {
  const [flipped, setFlipped] = useState(false)
  const pt = locale === 'pt'
  return <button className={s.flashcard} aria-pressed={flipped} onClick={() => setFlipped(!flipped)}><small>{flipped ? (pt ? 'RESPOSTA' : 'ANSWER') : 'FLASHCARD · 01'}</small><strong>{flipped ? (pt ? 'Recuperar uma ideia da memória fortalece o aprendizado.' : 'Retrieving an idea from memory strengthens learning.') : (pt ? 'Por que testar a memória ajuda a aprender?' : 'Why does testing your memory help you learn?')}</strong><span>{pt ? 'Clique para virar' : 'Click to flip'} ↻</span></button>
}

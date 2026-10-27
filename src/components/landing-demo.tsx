'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/i18n'
import s from '@/app/landing.module.css'

/**
 * Single interactive product preview (shown ONCE on the page, inside the top
 * feature showcase). Lets visitors inspect both entry points (Topic vs. PDF Plus)
 * and try a real active-recall quiz question.
 */
export function StudyDemo({ locale, initial = 'upload' }: { locale: Locale; initial?: 'upload' | 'quiz' }) {
  const pt = locale === 'pt'
  const [stage, setStage] = useState<'upload' | 'quiz'>(initial)
  const [selectedSource, setSelectedSource] = useState<'topic' | 'pdf'>('topic')
  const [answer, setAnswer] = useState<number | null>(null)

  return (
    <div className={s.demo}>
      <div className={s.demoTop}>
        <span className={s.demoDots} aria-hidden="true"><i /><i /><i /></span>
        <span>{pt ? 'Prévia interativa · Do material ao treino ativo' : 'Interactive preview · From source to active practice'}</span>
        <span aria-hidden="true">✧</span>
      </div>
      {stage === 'upload' ? (
        <div className={s.uploadScene}>
          <div className={s.fileStack} aria-hidden="true">
            <span>PDF</span>
            <span>✧</span>
            <span>TEMA</span>
          </div>
          <h3>{pt ? 'Comece por um tema ou pelo seu PDF.' : 'Start from a topic or your own PDF.'}</h3>
          <p>
            {pt
              ? 'Escolha uma entrada abaixo e avance para testar uma atividade real gerada a partir do guia.'
              : 'Pick an entry point below, then try a real activity generated from the guide.'}
          </p>

          <button
            type="button"
            className={s.fileRow}
            data-active={selectedSource === 'topic'}
            onClick={() => setSelectedSource('topic')}
          >
            <span className={`${s.fileIcon} ${s.topicIcon}`}>⌕</span>
            <span>
              <b>{pt ? 'Como as células produzem energia (ATP)?' : 'How do cells produce energy (ATP)?'}</b>
              <small>{pt ? 'Escolha um tema · Pesquisa web citada (Free · 5/mês)' : 'Choose a topic · Cited web research (Free · 5/mo)'}</small>
            </span>
            <span className={s.fileCheck}>{selectedSource === 'topic' ? '✓' : '○'}</span>
          </button>

          <button
            type="button"
            className={s.fileRow}
            data-active={selectedSource === 'pdf'}
            onClick={() => setSelectedSource('pdf')}
          >
            <span className={s.fileIcon}>PDF</span>
            <span>
              <b>
                {pt ? 'Campbell_Biology_Ch09.pdf' : 'Campbell_Biology_Ch09.pdf'}{' '}
                <em className={s.plusBadge}>Plus</em>
              </b>
              <small>{pt ? 'Use seu material · Capítulo 1 · As células (pp. 14–28)' : 'Use your material · Chapter 1 · Cells (pp. 14–28)'}</small>
            </span>
            <span className={s.fileCheck}>{selectedSource === 'pdf' ? '✓' : '○'}</span>
          </button>

          <button
            type="button"
            className={s.demoButton}
            onClick={() => {
              setStage('quiz')
              setAnswer(null)
            }}
          >
            {pt ? 'Experimentar atividade do guia' : 'Try a guide activity'} <span aria-hidden="true">→</span>
          </button>
          <span className={s.demoCaption}>
            {pt
              ? 'Demonstração interativa única · Clique para responder ao quiz de memória'
              : 'Interactive preview · Click to answer the memory quiz'}
          </span>
        </div>
      ) : (
        <div className={s.quizScene}>
          <div className={s.quizMeta}>
            <span>✦ {pt ? 'RECUPERAÇÃO ATIVA · CAPÍTULO 1' : 'ACTIVE RECALL · CHAPTER 1'}</span>
            <button type="button" onClick={() => setStage('upload')}>
              {pt ? 'Voltar à fonte' : 'Back to source'} ↶
            </button>
          </div>
          <div className={s.progressTrack}><span /></div>
          <h3>
            {pt
              ? 'Qual organela atua como “casa de câmbio” convertendo a energia da glicose em ATP?'
              : 'Which organelle acts as the “currency exchange” converting glucose energy into ATP?'}
          </h3>
          <p>
            {pt
              ? 'Baseado na caixa “A Intuição Prática” da Seção 1 do guia de bolso.'
              : 'Grounded in the “Practical Intuition” box from Section 1 of the pocket guide.'}
          </p>
          <div className={s.answers}>
            {(pt ? ['Núcleo celular', 'Mitocôndria', 'Complexo de Golgi'] : ['Cell nucleus', 'Mitochondrion', 'Golgi apparatus']).map(
              (label, i) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={answer === i}
                  data-result={answer === i ? (i === 1 ? 'correct' : 'incorrect') : undefined}
                  onClick={() => setAnswer(i)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {label}
                  <b>{answer === i ? (i === 1 ? '✓' : '×') : ''}</b>
                </button>
              ),
            )}
          </div>
          <p className={s.feedback} aria-live="polite">
            {answer === null
              ? pt
                ? 'Selecione uma alternativa para testar sua retenção.'
                : 'Select an option to check your recall.'
              : answer === 1
                ? pt
                  ? 'Certo! A mitocôndria usa o gradiente de H⁺ para fosforilar ADP em ATP.'
                  : 'Correct! Mitochondria use the H⁺ gradient to phosphorylate ADP into ATP.'
                : pt
                  ? 'Não foi dessa vez — este conceito iria para o topo dos seus flashcards com a tag summario-weak.'
                  : 'Not quite — this concept moves to the front of your flashcards with the summario-weak tag.'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Hero dual entry point selector + cropped real product mockups below the fold
 * (inspired by Reducto Hero).
 */
export function HeroEntryShowcase({ locale }: { locale: Locale }) {
  const pt = locale === 'pt'
  const [entry, setEntry] = useState<'topic' | 'pdf'>('topic')

  return (
    <div className={s.heroShowcaseWrap}>
      <div className={s.heroStageCropFrame}>
        <div className={s.heroStageGrid}>
          {/* Left artifact: Real Pocket Guide Page ("Chapter 1 · Cells") */}
          <div className={s.heroArtifactCard}>
            <div className={s.artifactHeaderMeta}>
              <span>{pt ? 'PÁGINA DO GUIA A4' : 'A4 GUIDE PAGE'}</span>
              <span>{entry === 'pdf' ? 'Campbell_Ch09.pdf · pp. 14–28' : (pt ? 'Tema pesquisado' : 'Researched topic')}</span>
            </div>
            <div className={s.guideIllustration} aria-label={pt ? 'Página real do guia de bolso Capítulo 1 Células' : 'Real pocket guide page Chapter 1 Cells'}>
              <div className={s.backPage} />
              <div className={s.guidePage}>
                <div className={s.guideBrand}>
                  summario <span>POCKET GUIDE</span>
                </div>
                <small>01 / {pt ? 'CAPÍTULO 1 · CÉLULAS' : 'CHAPTER 1 · CELLS'}</small>
                <h4>{pt ? 'Um universo em cada célula.' : 'A universe inside every cell.'}</h4>
                <div className={s.guideCallout}>
                  <b>✦ {pt ? 'A Intuição Prática' : 'Practical Intuition'}</b>
                  <p>
                    {pt
                      ? 'A célula é uma pequena cidade. A glicose é uma nota alta; a mitocôndria é a casa de câmbio que troca por moedas de ATP.'
                      : 'A cell is a tiny city. Glucose is a large bill; the mitochondrion is the exchange booth turning it into spendable ATP coins.'}
                  </p>
                </div>
                <b className={s.guideSub}>The mitochondrion &amp; ATP synthase</b>
                <ul className={s.guideMiniList}>
                  <li><strong>Proton gradient</strong> — pumps H⁺ across the inner membrane.</li>
                  <li><strong>Chemiosmosis</strong> — drives rotary phosphorylation.</li>
                </ul>
                <div className={s.guideFormula}>ADP + Pᵢ → ATP</div>
              </div>
            </div>
          </div>

          {/* Center artifact: Active Source & Language Pairing */}
          <div className={s.heroArtifactCard}>
            <div className={s.artifactHeaderMeta}>
              <span>{pt ? 'VOCABULÁRIO PT / EN' : 'PT / EN VOCABULARY'}</span>
              <span>{pt ? '3 modos de idioma' : '3 language modes'}</span>
            </div>
            <div className={s.heroSourceSummary}>
              <span className={s.sourceBadgePill}>
                {entry === 'topic'
                  ? pt ? '⌕ Entrada ativa: Tema pesquisado na web' : '⌕ Active input: Web-researched topic'
                  : pt ? '▧ Entrada ativa: Capítulo em PDF (Plus)' : '▧ Active input: PDF Chapter (Plus)'}
              </span>
              <p className={s.sourceSummaryTitle}>
                {entry === 'topic'
                  ? pt
                    ? '“Regularização L1 e L2 em modelos lineares e redes neurais”'
                    : '“L1 & L2 Regularization in linear models and neural networks”'
                  : pt
                    ? '“An Introduction to Statistical Learning · Cap. 6 (Seções 6.2.1–6.2.3)”'
                    : '“An Introduction to Statistical Learning · Ch. 6 (Sections 6.2.1–6.2.3)”'}
              </p>
            </div>
            <div className={s.languageArt} aria-label={pt ? 'Par bilíngue Português e Inglês' : 'Portuguese and English bilingual pair'}>
              <div>
                <span>PT · INTUIÇÃO</span>
                <strong>Agora<br />entendi.</strong>
                <small>{pt ? 'Analogias e pegadinhas na sua língua' : 'Analogies & traps in your language'}</small>
              </div>
              <div>
                <span>EN · TÉCNICO</span>
                <strong>Now it<br />clicks.</strong>
                <small>{pt ? 'Termos e fórmulas da literatura' : 'Terms & formulas from the paper'}</small>
              </div>
              <b aria-hidden="true">↔</b>
            </div>
          </div>

          {/* Right artifact: Flippable Flashcard + Anki connection */}
          <div className={s.heroArtifactCard}>
            <div className={s.artifactHeaderMeta}>
              <span>{pt ? 'PRÁTICA E RETENÇÃO' : 'PRACTICE & RETENTION'}</span>
              <span>{pt ? 'Quiz · Flashcards · Anki' : 'Quiz · Flashcards · Anki'}</span>
            </div>
            <div className={s.flashcardStack}>
              <FlashcardPreview locale={locale} />
            </div>
            <div className={s.miniAnkiStrip}>
              <span>summario</span>
              <i aria-hidden="true">⟶</i>
              <span className={s.miniAnkiBadge}>✦ <b>Anki</b> (.tsv)</span>
            </div>
          </div>
        </div>
      </div>

      <div className={s.entrySelectorBar} role="tablist" aria-label={pt ? 'Modos de entrada do summario' : 'summario entry modes'}>
        <button
          type="button"
          role="tab"
          aria-selected={entry === 'topic'}
          className={s.entryChip}
          data-active={entry === 'topic'}
          onClick={() => setEntry('topic')}
        >
          <span className={s.entryChipIcon} aria-hidden="true">⌕</span>
          <span className={s.entryChipText}>
            <strong>{pt ? 'Escolha um tema' : 'Choose a topic'}</strong>
            <small>{pt ? 'Pesquisa em fontes confiáveis · 5 guias/mês no Free' : 'Cited web research · 5 guides/mo on Free'}</small>
          </span>
          <span className={s.entryTagFree}>{pt ? 'Free & Plus' : 'Free & Plus'}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={entry === 'pdf'}
          className={s.entryChip}
          data-active={entry === 'pdf'}
          onClick={() => setEntry('pdf')}
        >
          <span className={s.entryChipIcon} aria-hidden="true">▧</span>
          <span className={s.entryChipText}>
            <strong>{pt ? 'Use seu material (PDF)' : 'Use your own material (PDF)'}</strong>
            <small>{pt ? 'Envie capítulos de livros, artigos ou apostilas' : 'Upload textbook chapters, papers, or handouts'}</small>
          </span>
          <span className={s.entryTagPlus}>Plus</span>
        </button>
      </div>
    </div>
  )
}

/**
 * Sample Guide Showcase (inspired by Cofounder Social Proof).
 * Shows 3 real printable pages in perspective, with 'Ler este capítulo' links
 * that open a full readable chapter inspector, plus 'Baixar guia de exemplo (PDF)'.
 */
export function SampleGuideShowcase({ locale }: { locale: Locale }) {
  const pt = locale === 'pt'
  const [openChapter, setOpenChapter] = useState<number | null>(null)

  const chapters = [
    {
      num: 'I',
      label: pt ? 'Capítulo 1 · Células' : 'Chapter 1 · Cells',
      kicker: pt ? 'GUIA POR TEMA OU PDF · BIOLOGIA' : 'TOPIC OR PDF GUIDE · BIOLOGY',
      title: pt ? 'Bioenergética Celular: da glicose ao ATP' : 'Cellular Bioenergetics: from glucose to ATP',
      subtitle: pt
        ? 'Como a mitocôndria transforma energia química em moeda utilizável pela célula.'
        : 'How mitochondria turn chemical energy into spendable cellular currency.',
      partBar: pt ? 'PARTE 1 — RESPIRAÇÃO CELULAR E SÍNTESE DE ATP' : 'PART 1 — CELLULAR RESPIRATION & ATP SYNTHESIS',
      sectionTitle: '1. Cellular respiration & ATP synthase',
      badge: pt ? 'CAPÍTULO 1 · CÉLULAS' : 'CHAPTER 1 · CELLS',
      intuitionLabel: pt ? 'A INTUIÇÃO PRÁTICA' : 'PRACTICAL INTUITION',
      intuition: pt
        ? 'A glicose é como uma nota de alto valor e o ATP é o trocado no bolso. A célula não consegue pagar reações químicas direto com uma molécula inteira de glicose; a mitocôndria funciona como a casa de câmbio que converte essa reserva em dezenas de moedas prontas para uso imediato.'
        : 'Glucose is like a high-denomination bill and ATP is pocket change. A cell cannot pay for chemical reactions directly with a whole glucose molecule; the mitochondrion is the currency exchange that converts it into spendable coins.',
      bullets: [
        ['Proton-motive force', 'electrochemical gradient of H⁺ pumped across the inner mitochondrial membrane.'],
        ['Chemiosmosis', 'protons flow back through ATP synthase, driving the phosphorylation of ADP into ATP.'],
        ['Oxidative yield', 'produces ~30–32 ATP molecules per glucose, compared with only 2 ATP from glycolysis alone.'],
      ],
      formula: 'ADP + Pᵢ + H⁺(out) → ATP + H₂O + H⁺(in)',
      deepdiveLabel: pt ? 'PRA FIXAR' : 'KEY TAKEAWAY',
      deepdive: pt
        ? 'O oxigênio só entra no último ato da cadeia respiratória, como receptor final de elétrons. Sem ele, a fila inteira de transporte trava para trás — exatamente como um pedágio fechado bloqueia toda a rodovia.'
        : 'Oxygen only appears in the final act of the electron transport chain as the terminal electron acceptor. Without it, the entire queue backs up — like a closed toll booth halting a highway.',
    },
    {
      num: 'II',
      label: pt ? 'Vocabulário PT/EN' : 'PT/EN Vocabulary',
      kicker: pt ? 'MODO BILÍNGUE · MACHINE LEARNING' : 'BILINGUAL MODE · MACHINE LEARNING',
      title: pt ? 'Regularização: Ridge (L2) vs. Lasso (L1)' : 'Regularization: Ridge (L2) vs. Lasso (L1)',
      subtitle: pt
        ? 'Intuição e aprofundamento em português; vocabulário técnico e notação no inglês original.'
        : 'Intuition and deep dives in plain language; technical terms and notation in the language of the field.',
      partBar: 'PART 1 — SHRINKAGE & PENALTIES',
      sectionTitle: '1. Ridge regression (L2)',
      badge: 'AI ENGINEER',
      intuitionLabel: pt ? 'A INTUIÇÃO PRÁTICA' : 'PRACTICAL INTUITION',
      intuition: pt
        ? 'Ridge é um imposto progressivo: todo coeficiente paga alguma coisa, os maiores pagam mais, e ninguém é demitido. No fim, todo mundo continua na folha de pagamento — só que ganhando menos.'
        : 'Ridge is a progressive tax: every coefficient pays something, the biggest ones pay most, and nobody gets fired. Everyone stays on the payroll — just on a smaller salary.',
      bullets: [
        ['Penalty', 'adds the squared L2 norm of the coefficients to the residual sum of squares (RSS).'],
        ['Effect', 'shrinks coefficients toward zero continuously, but never sets them exactly to zero.'],
        ['Tuning', 'one knob only — the penalty strength λ, chosen via cross-validation.'],
      ],
      formula: 'RSS(β) + λ Σ βⱼ²',
      deepdiveLabel: pt ? 'PRA FIXAR' : 'KEY TAKEAWAY',
      deepdive: pt
        ? 'O mesmo mecanismo tem dois nomes na literatura: em estatística chama-se ridge, em deep learning chama-se weight decay. A atualização multiplica o peso por (1 − ηλ) a cada passo — perceber que são a mesma ideia economiza metade do estudo.'
        : 'The same mechanism carries two names: ridge in statistics, weight decay in deep learning. The update multiplies the weight by (1 − ηλ) at every step — seeing they are one idea halves the studying.',
    },
    {
      num: 'III',
      label: pt ? 'Revisão e Pegadinhas' : 'Exam Review & Traps',
      kicker: pt ? 'FORMATO REVISÃO · PERGUNTAS E TEORIA' : 'REVIEW FORMAT · QUESTIONS & THEORY',
      title: pt ? 'Geometria L1 vs. L2 e Tabela de Decisão' : 'L1 vs. L2 Geometry & Decision Table',
      subtitle: pt
        ? 'Por que apenas o Lasso zera variáveis e como escolher entre OLS, Ridge, Lasso e Elastic Net.'
        : 'Why only Lasso zeroes out variables and how to choose between OLS, Ridge, Lasso, and Elastic Net.',
      partBar: 'PART 2 — VARIABLE SELECTION & CLASSIC TRAPS',
      sectionTitle: '2. Which penalty can set a coefficient to exactly zero?',
      badge: pt ? 'PEGADINHA CLÁSSICA' : 'CLASSIC TRAP',
      intuitionLabel: pt ? 'RESPOSTA DIRETA (ANSWER)' : 'DIRECT ANSWER',
      intuition: pt
        ? '✓ Lasso (L1). A penalidade L1 (λ Σ |βⱼ|) força coeficientes irrelevantes a exatamente zero; a penalidade L2 (Ridge) apenas aproxima de zero assintoticamente.'
        : '✓ Lasso (L1). The L1 penalty (λ Σ |βⱼ|) forces irrelevant coefficients to exactly zero; L2 (Ridge) only shrinks them asymptotically.',
      bullets: [
        ['Diamond vs. Circle', 'L1 constraint region has sharp corners on the axes; RSS contours hit a corner first.'],
        ['OLS vs. Ridge', 'use Ridge when many correlated predictors all contribute small effects.'],
        ['Lasso vs. Elastic Net', 'use Elastic Net when correlated predictors should be kept or dropped together.'],
      ],
      formula: 'L1: Σ |βⱼ| ≤ s   vs.   L2: Σ βⱼ² ≤ s',
      deepdiveLabel: pt ? 'PEGADINHA CLÁSSICA' : 'CLASSIC TRAP',
      deepdive: pt
        ? '“Regularização L2 faz seleção de variáveis” é falso. L2 encolhe todos os pesos proporcionalmente; apenas L1 demite variáveis do modelo.'
        : '“L2 regularization performs variable selection” is false. L2 shrinks all weights proportionally; only L1 drops variables from the model.',
    },
  ]

  const current = openChapter !== null ? chapters[openChapter] : null

  return (
    <div className={s.sampleShowcaseWrap}>
      <div className={s.sampleCardsRow}>
        {chapters.map((ch, idx) => (
          <div key={ch.num} className={s.sampleBookSlot}>
            <div className={s.sampleBookSleeve}>
              <article className={s.sampleBookPage} data-cover={idx === 0}>
                <div className={s.sampleSpine} aria-hidden="true" />
                <div className={s.samplePageInner}>
                  <div className={s.samplePageHeader}>
                    <span className={s.samplePageLabel}>{ch.label}</span>
                    <span className={s.samplePageNum}>{pt ? `Pág. 0${idx + 1}` : `Page 0${idx + 1}`}</span>
                  </div>
                  <div className={s.samplePageRule} />
                  <small className={s.sampleChapterRoman}>
                    {pt ? `Capítulo ${ch.num}` : `Chapter ${ch.num}`} · {ch.badge}
                  </small>

                  {/* Cover block in #57328a with flat editorial illustration & hierarchy */}
                  <div className={s.sampleCoverBlock} data-variant={idx}>
                    <div className={s.sampleCoverTop}>
                      <span>SUMMARIO POCKET GUIDE</span>
                      <span>A4 · PDF</span>
                    </div>
                    <h3>{ch.title}</h3>
                    <p>{ch.subtitle}</p>
                    <div className={s.sampleCoverArt} aria-hidden="true">
                      {idx === 0 && (
                        <div className={s.flatArtCells}>
                          <span className={s.cellOuter}>
                            <i className={s.cellMito}>ATP</i>
                          </span>
                          <span className={s.cellArrow}>⟶</span>
                          <span className={s.cellFormulaPill}>ADP + Pᵢ → ATP</span>
                        </div>
                      )}
                      {idx === 1 && (
                        <div className={s.flatArtBilingual}>
                          <span className={s.biPillPt}>PT · A Intuição Prática</span>
                          <span className={s.biPillEn}>EN · RSS(β) + λ Σ βⱼ²</span>
                        </div>
                      )}
                      {idx === 2 && (
                        <div className={s.flatArtTrap}>
                          <span className={s.trapPillAns}>✓ ANSWER: Lasso (L1)</span>
                          <span className={s.trapPillWarn}>! PEGADINHA: L2 ≠ 0</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real miniature printed boxes */}
                  <div className={s.sampleMiniDoc}>
                    <div className={s.sampleMiniIntuition}>
                      <b>{ch.intuitionLabel}</b>
                      <p>{ch.intuition}</p>
                    </div>
                    <div className={s.sampleMiniFormula}>{ch.formula}</div>
                  </div>

                  <div className={s.samplePageFooterMeta}>
                    <span>summario.pro</span>
                    <span>2026 · A4</span>
                  </div>
                </div>
              </article>
            </div>

            <button
              type="button"
              className={s.readChapterLink}
              aria-expanded={openChapter === idx}
              onClick={() => setOpenChapter(openChapter === idx ? null : idx)}
            >
              {openChapter === idx
                ? pt ? `Fechar leitura (${ch.num}) ↑` : `Close chapter (${ch.num}) ↑`
                : pt ? `Ler este capítulo (${ch.num}) →` : `Read this chapter (${ch.num}) →`}
            </button>
          </div>
        ))}
      </div>

      {/* Expandable full chapter inspector when visitor clicks 'Ler este capítulo' */}
      {current && (
        <div className={s.chapterReaderDrawer} role="region" aria-label={current.title}>
          <div className={s.readerDrawerTop}>
            <div>
              <span className={s.readerKicker}>{current.kicker}</span>
              <h3>{current.title}</h3>
            </div>
            <div className={s.readerDrawerActions}>
              {chapters.map((c, i) => (
                <button
                  type="button"
                  key={c.num}
                  className={s.readerTabBtn}
                  data-active={openChapter === i}
                  onClick={() => setOpenChapter(i)}
                >
                  {pt ? `Cap. ${c.num}` : `Ch. ${c.num}`}
                </button>
              ))}
              <button
                type="button"
                className={s.readerCloseBtn}
                onClick={() => setOpenChapter(null)}
              >
                {pt ? 'Fechar ×' : 'Close ×'}
              </button>
            </div>
          </div>

          <div className="doc stack" style={{ gap: 14 }}>
            <div className="doc-bar">{current.partBar}</div>
            <h4 className="doc-h">
              <span className="doc-num">{openChapter! + 1}</span>
              <span>{current.sectionTitle}</span>
              <span className="pill pill-accent" style={{ fontSize: 10 }}>{current.badge}</span>
            </h4>
            <div className={`doc-box ${openChapter === 2 ? 'doc-answer' : 'doc-intuition'}`}>
              <div className="doc-lab">{current.intuitionLabel}</div>
              <p>{current.intuition}</p>
            </div>
            <ul className="doc-list">
              {current.bullets.map(([term, desc]) => (
                <li key={term}>
                  <strong>{term}</strong> — {desc}
                </li>
              ))}
            </ul>
            <div className="doc-math">{current.formula}</div>
            <div className={`doc-box ${openChapter === 2 ? 'doc-trap' : 'doc-deepdive'}`}>
              <div className="doc-lab">{current.deepdiveLabel}</div>
              <p>{current.deepdive}</p>
            </div>
          </div>
        </div>
      )}

      <div className={s.sampleDownloadBar}>
        <a
          href="/summario-guia-exemplo.pdf"
          download="summario-guia-exemplo.pdf"
          className={s.downloadSampleBtn}
        >
          <span>{pt ? 'Baixar guia de exemplo (PDF)' : 'Download sample guide (PDF)'}</span>
          <span className={s.downloadIconBadge} aria-hidden="true">↓</span>
        </a>
        <small className={s.sampleDownloadHint}>
          {pt
            ? 'PDF A4 real gerado pelo summario · Fórmulas renderizadas e pronto para imprimir'
            : 'Real A4 PDF generated by summario · Rendered formulas, ready to print'}
        </small>
      </div>
    </div>
  )
}

/**
 * Interactive Pocket Guide with live Language Mode switcher (Bilingual PT+EN /
 * Portuguese only / English only) for the top tier of the Cursor-inspired
 * Features section.
 */
export function LanguageGuideSwitcher({ locale }: { locale: Locale }) {
  const pt = locale === 'pt'
  const [langMode, setLangMode] = useState<'bilingual' | 'pt' | 'en'>('bilingual')

  const content = {
    bilingual: {
      tag: pt ? 'Bilíngue (Intuição PT + Técnico EN)' : 'Bilingual (PT Intuition + EN Technical)',
      part: 'PART 1 — SHRINKAGE & REGULARIZATION',
      heading: '1. Ridge regression (L2)',
      intuitionLabel: 'A INTUIÇÃO PRÁTICA (PT)',
      intuition:
        'Ridge é um imposto progressivo: todo coeficiente paga alguma coisa, os maiores pagam mais, e ninguém é demitido. No fim, todo mundo continua na folha de pagamento — só que ganhando menos.',
      bullets: [
        ['Penalty (EN)', 'adds the squared L2 norm λ Σ βⱼ² to the loss function.'],
        ['Effect (EN)', 'shrinks coefficients toward zero, never setting them exactly to zero.'],
      ],
      deepdiveLabel: 'PRA FIXAR (PT)',
      deepdive:
        'Em estatística chama-se ridge; em deep learning chama-se weight decay. A atualização multiplica o peso por (1 − ηλ) a cada passo.',
    },
    pt: {
      tag: pt ? '100% Português (termo canônico na 1ª menção)' : '100% Portuguese (canonical term on 1st mention)',
      part: 'PARTE 1 — ENCOLHIMENTO E REGULARIZAÇÃO',
      heading: '1. Regressão em cumeeira (Ridge regression, L2)',
      intuitionLabel: 'A INTUIÇÃO PRÁTICA',
      intuition:
        'A regressão em cumeeira funciona como um imposto progressivo: cada coeficiente cede uma parte do seu valor, os maiores pagam mais e nenhuma variável é excluída do modelo.',
      bullets: [
        ['Penalidade', 'soma o quadrado da norma L2 dos coeficientes à função de custo.'],
        ['Efeito prático', 'encolhe os pesos em direção a zero continuamente, sem zerá-los.'],
      ],
      deepdiveLabel: 'PRA FIXAR',
      deepdive:
        'Em redes profundas, o mesmo mecanismo aparece sob o nome decaimento de pesos (weight decay), multiplicando cada peso por (1 − ηλ) a cada passo.',
    },
    en: {
      tag: pt ? '100% Inglês (imersão completa)' : '100% English (full immersion)',
      part: 'PART 1 — SHRINKAGE & REGULARIZATION',
      heading: '1. Ridge regression (L2)',
      intuitionLabel: 'PRACTICAL INTUITION',
      intuition:
        'Ridge is a progressive tax: every coefficient pays something, the largest ones pay most, and nobody gets fired. Everyone stays on the payroll at the end — just on a smaller salary.',
      bullets: [
        ['Penalty', 'adds the squared L2 norm λ Σ βⱼ² to the residual sum of squares.'],
        ['Effect', 'shrinks coefficients smoothly toward zero without zeroing any out.'],
      ],
      deepdiveLabel: 'KEY TAKEAWAY',
      deepdive:
        'The exact same mechanism is called ridge in statistics and weight decay in deep learning, multiplying weights by (1 − ηλ) at each step.',
    },
  }[langMode]

  return (
    <div className={s.langGuideCard}>
      <div className={s.langSelectorHeader}>
        <span className={s.langSelectorTitle}>
          {pt ? 'IDIOMA DO GUIA' : 'GUIDE LANGUAGE'}
        </span>
        <div className={s.langModePills} role="tablist" aria-label={pt ? 'Modo de idioma do guia' : 'Guide language mode'}>
          {(
            [
              ['bilingual', pt ? 'Bilíngue (PT + EN)' : 'Bilingual (PT + EN)'],
              ['pt', pt ? 'Português' : 'Portuguese'],
              ['en', pt ? 'Inglês' : 'English'],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              role="tab"
              aria-selected={langMode === key}
              className={s.langModePill}
              data-active={langMode === key}
              onClick={() => setLangMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.langGuideSheet}>
        <div className={s.langSheetTop}>
          <span className={s.langPartBar}>{content.part}</span>
          <span className={s.langModeActiveTag}>{content.tag}</span>
        </div>
        <h4 className={s.langSheetHeading}>{content.heading}</h4>
        <div className={s.langBoxIntuition}>
          <b>{content.intuitionLabel}</b>
          <p>{content.intuition}</p>
        </div>
        <ul className={s.langTechList}>
          {content.bullets.map(([term, rest]) => (
            <li key={term}>
              <strong>{term}</strong> — {rest}
            </li>
          ))}
        </ul>
        <div className={s.langMathBar}>RSS(β) + λ Σ βⱼ²</div>
        <div className={s.langBoxDeepdive}>
          <b>{content.deepdiveLabel}</b>
          <p>{content.deepdive}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Real flippable Flashcard component preserved & enhanced with 3 real cards.
 */
export function FlashcardPreview({ locale }: { locale: Locale }) {
  const [flipped, setFlipped] = useState(false)
  const [index, setIndex] = useState(0)
  const pt = locale === 'pt'

  const deck = pt
    ? [
        {
          tag: 'FLASHCARD · 01 · MEMÓRIA ATIVA',
          q: 'Por que testar a memória logo após ler funciona melhor do que reler o capítulo?',
          a: 'Recuperar uma ideia sem olhar o material fortalece a trilha de evocação e revela o que você só reconhecia por familiaridade.',
        },
        {
          tag: 'FLASHCARD · 02 · summario-weak',
          q: 'Por que a regularização Ridge (L2) encolhe pesos mas nunca os zera?',
          a: 'Porque a região de restrição L2 é uma esfera lisa sem quinas nos eixos; o contorno de erro quase nunca toca exatamente zero.',
        },
        {
          tag: 'FLASHCARD · 03 · BIOENERGÉTICA',
          q: 'Qual é o papel direto do gradiente de H⁺ na membrana interna da mitocôndria?',
          a: 'Acionar a rotação da ATP sintase (quimiosmose) para fosforilar ADP + Pᵢ em ATP.',
        },
      ]
    : [
        {
          tag: 'FLASHCARD · 01 · ACTIVE RECALL',
          q: 'Why does testing your memory right after reading beat rereading the chapter?',
          a: 'Retrieving an idea without looking strengthens recall pathways and exposes concepts you merely recognized.',
        },
        {
          tag: 'FLASHCARD · 02 · summario-weak',
          q: 'Why does Ridge (L2) regularization shrink weights without ever zeroing them out?',
          a: 'Because the L2 constraint region is a smooth sphere with no corners on the axes, so loss contours rarely touch zero.',
        },
        {
          tag: 'FLASHCARD · 03 · BIOENERGETICS',
          q: 'What is the direct role of the H⁺ gradient across the inner mitochondrial membrane?',
          a: 'It drives ATP synthase rotation (chemiosmosis) to phosphorylate ADP + Pᵢ into ATP.',
        },
      ]

  const card = deck[index]

  return (
    <div className={s.flashcardWidget}>
      <button
        type="button"
        className={s.flashcard}
        aria-pressed={flipped}
        onClick={() => setFlipped(!flipped)}
      >
        <small>{flipped ? (pt ? 'RESPOSTA DO GUIA' : 'GUIDE ANSWER') : card.tag}</small>
        <strong>{flipped ? card.a : card.q}</strong>
        <span>{pt ? 'Clique para virar' : 'Click to flip'} ↻</span>
      </button>
      <div className={s.flashcardControls}>
        {deck.map((item, i) => (
          <button
            type="button"
            key={item.tag}
            className={s.flashcardDotBtn}
            data-active={index === i}
            onClick={() => {
              setIndex(i)
              setFlipped(false)
            }}
          >
            0{i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * 6-card Feature Grid with real working UI crops (inspired by Cursor Features bottom grid):
 * 1. Quiz with answer/why/trap
 * 2. Flippable flashcards
 * 3. Anki export with summario-weak priority
 * 4. Ask the guide with section references
 * 5. Targeted practice on mistakes
 * 6. Section notes with highlighted passage
 */
export function FeatureGridShowcase({ locale }: { locale: Locale }) {
  const pt = locale === 'pt'

  // Card 1 state: Mini quiz reveal
  const [quizRevealed, setQuizRevealed] = useState(true)
  const [quizMarked, setQuizMarked] = useState<'hit' | 'miss' | null>('miss')

  // Card 4 state: Ask the guide active question
  const [askIdx, setAskIdx] = useState(0)
  const qaList = pt
    ? [
        {
          q: 'Qual a diferença prática entre Ridge e weight decay?',
          a: 'Nenhuma no mecanismo: multiplicar o peso por (1 − ηλ) a cada passo do gradiente equivale exatamente à penalidade L2 somada à perda.',
          cite: '§ 1 · Ridge regression (L2)',
          cite2: '§ 1.2 · Pra Fixar: Weight decay',
        },
        {
          q: 'Quando devo preferir Elastic Net ao Lasso puro?',
          a: 'Quando há grupos de variáveis fortemente correlacionadas: o Lasso tende a escolher uma ao acaso, enquanto o Elastic Net mantém o grupo unido.',
          cite: '§ 2 · Seleção esparsa (L1)',
          cite2: '§ 3 · Tabela de decisão',
        },
      ]
    : [
        {
          q: 'What is the practical difference between Ridge and weight decay?',
          a: 'None in mechanism: multiplying weights by (1 − ηλ) at each gradient step is equivalent to adding the squared L2 penalty to the loss.',
          cite: '§ 1 · Ridge regression (L2)',
          cite2: '§ 1.2 · Key Takeaway: Weight decay',
        },
        {
          q: 'When should I pick Elastic Net over pure Lasso?',
          a: 'When predictors are strongly correlated in groups: Lasso picks one at random, while Elastic Net selects or drops the group together.',
          cite: '§ 2 · Sparse selection (L1)',
          cite2: '§ 3 · Decision table',
        },
      ]

  // Card 5 state: Targeted practice difficulty
  const [diff, setDiff] = useState<'fundamentals' | 'intermediate' | 'exam'>('exam')
  const practicePrompts = {
    fundamentals: pt
      ? 'Explique com suas palavras o que acontece com os coeficientes na regressão Ridge quando λ → ∞.'
      : 'Explain in your own words what happens to Ridge coefficients as λ → ∞.',
    intermediate: pt
      ? 'Por que padronizar a escala das variáveis (z-score) é obrigatório antes de aplicar Ridge ou Lasso?'
      : 'Why is standardizing feature scales (z-score) mandatory before applying Ridge or Lasso?',
    exam: pt
      ? 'Um modelo com 120 preditores correlacionados teve 85 pesos zerados. Qual penalidade foi usada e qual a geometria da restrição?'
      : 'A model with 120 correlated predictors had 85 weights set to zero. Which penalty was used and why?',
  }

  // Card 6 state: Notes with highlight
  const [noteSaved, setNoteSaved] = useState(true)
  const [noteText, setNoteText] = useState(
    pt
      ? 'Lembrar na prova: L2 = esfera (sem quinas, não zera); L1 = losango (quinas nos eixos, zera variáveis).'
      : 'Exam reminder: L2 = sphere (no corners, never zeroes); L1 = diamond (axis corners, zeroes variables).',
  )

  return (
    <div className={s.cursorCardGrid}>
      {/* 1. Quiz */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>01 · {pt ? 'QUIZ DE RECUPERAÇÃO' : 'RETRIEVAL QUIZ'}</span>
          <h3>{pt ? 'Feche o guia e confira o que ficou' : 'Close the guide and test recall'}</h3>
          <p>
            {pt
              ? 'Cada pergunta traz resposta direta, explicação do mecanismo e aviso de pegadinha.'
              : 'Every question includes a direct answer, mechanism explanation, and classic trap alert.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <div className={s.cropTopBar}>
            <span>{pt ? 'Pergunta 2 de 5 · Regularização' : 'Question 2 of 5 · Regularization'}</span>
            <button type="button" className={s.cropMiniAction} onClick={() => setQuizRevealed(!quizRevealed)}>
              {quizRevealed ? (pt ? 'Ocultar' : 'Hide') : (pt ? 'Mostrar resposta' : 'Show answer')}
            </button>
          </div>
          <p className={s.cropQuestionText}>
            {pt ? 'Qual penalidade consegue zerar um coeficiente exatamente?' : 'Which penalty can set a coefficient to exactly zero?'}
          </p>
          {quizRevealed && (
            <div className={s.cropBoxesStack}>
              <div className={s.cropBoxAnswer}>
                <b>{pt ? 'RESPOSTA' : 'ANSWER'}</b>
                <span>✓ <strong>Lasso (L1)</strong>. {pt ? 'Ridge encolhe, mas não zera.' : 'Ridge shrinks but never zeroes.'}</span>
              </div>
              <div className={s.cropBoxTrap}>
                <b>{pt ? 'PEGADINHA CLÁSSICA' : 'CLASSIC TRAP'}</b>
                <span>{pt ? '“L2 seleciona variáveis” é falso — só L1 demite.' : '“L2 selects variables” is false — only L1 drops them.'}</span>
              </div>
            </div>
          )}
          <div className={s.cropBtnRow}>
            <button
              type="button"
              className={s.cropGradeBtn}
              data-active={quizMarked === 'hit'}
              onClick={() => setQuizMarked('hit')}
            >
              ✓ {pt ? 'Acertei' : 'Got it'}
            </button>
            <button
              type="button"
              className={s.cropGradeBtn}
              data-active={quizMarked === 'miss'}
              data-warn="true"
              onClick={() => setQuizMarked('miss')}
            >
              × {pt ? 'Errei → vai para o topo dos flashcards' : 'Missed → moves to top of flashcards'}
            </button>
          </div>
        </div>
      </article>

      {/* 2. Flashcards */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>02 · {pt ? 'FLASHCARDS DE MEMÓRIA' : 'MEMORY FLASHCARDS'}</span>
          <h3>{pt ? 'Vire o cartão até o conceito destravar' : 'Flip the card until the concept clicks'}</h3>
          <p>
            {pt
              ? 'Baralho puxado diretamente do guia, reordenado em tempo real pelos seus erros no quiz.'
              : 'Deck pulled straight from the guide, reordered in real time by what you missed in the quiz.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <FlashcardPreview locale={locale} />
        </div>
      </article>

      {/* 3. Anki Export */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>03 · {pt ? 'EXPORTAÇÃO PARA ANKI' : 'ANKI EXPORT'}</span>
          <h3>{pt ? 'Repetição espaçada sem digitar cartões' : 'Spaced repetition without typing cards'}</h3>
          <p>
            {pt
              ? 'Exporte o baralho pronto para o Anki com a tag summario-weak nos conceitos que você errou.'
              : 'Export a ready-to-import Anki deck with the summario-weak tag on concepts you missed.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <div className={s.ankiCropHeader}>
            <div className={s.ankiPairLogos} aria-hidden="true">
              <span className={s.ankiLogoSummario}>summario</span>
              <i>⟶</i>
              <span className={s.ankiLogoAnki}>✦ <b>Anki</b></span>
            </div>
            <span className={s.ankiFilePill}>regularizacao-deck.tsv</span>
          </div>
          <div className={s.ankiQueueList}>
            <div className={s.ankiQueueRow} data-weak="true">
              <span className={s.ankiTagWeak}>summario-weak</span>
              <span className={s.ankiCardTitle}>{pt ? '1º · Geometria L1 (losango) vs. L2 (esfera)' : '1st · L1 (diamond) vs. L2 (sphere) geometry'}</span>
            </div>
            <div className={s.ankiQueueRow} data-weak="true">
              <span className={s.ankiTagWeak}>summario-weak</span>
              <span className={s.ankiCardTitle}>{pt ? '2º · Equivalência Ridge ↔ Weight decay (1 − ηλ)' : '2nd · Ridge ↔ Weight decay (1 − ηλ) equivalence'}</span>
            </div>
            <div className={s.ankiQueueRow}>
              <span className={s.ankiTagNormal}>summario-card</span>
              <span className={s.ankiCardTitle}>{pt ? '3º · Escolha de λ por validação cruzada' : '3rd · Choosing λ via cross-validation'}</span>
            </div>
          </div>
        </div>
      </article>

      {/* 4. Ask the guide */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>04 · {pt ? 'PERGUNTE AO GUIA' : 'ASK THE GUIDE'}</span>
          <h3>{pt ? 'Respostas ancoradas com citação de seção' : 'Grounded answers with section citations'}</h3>
          <p>
            {pt
              ? 'Tire dúvidas sobre qualquer passagem e veja exatamente de qual seção do guia veio a resposta.'
              : 'Ask questions about any passage and see the exact guide section backing the answer.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <div className={s.cropTopBar}>
            <span>{pt ? 'Pergunte ao guia · Citações verificáveis' : 'Ask the guide · Verifiable citations'}</span>
            <div className={s.askSwitchBtns}>
              {[0, 1].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={s.cropMiniAction}
                  data-active={askIdx === n}
                  onClick={() => setAskIdx(n)}
                >
                  {pt ? `Exemplo ${n + 1}` : `Example ${n + 1}`}
                </button>
              ))}
            </div>
          </div>
          <div className={s.askChatBubble}>
            <p className={s.askUserLine}>
              <strong>{pt ? 'Você:' : 'You:'}</strong> {qaList[askIdx].q}
            </p>
            <p className={s.askAnswerLine}>{qaList[askIdx].a}</p>
            <div className={s.askCitationsRow}>
              <span className={s.citationChip}>↗ {qaList[askIdx].cite}</span>
              <span className={s.citationChip}>↗ {qaList[askIdx].cite2}</span>
            </div>
          </div>
        </div>
      </article>

      {/* 5. Targeted practice on mistakes */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>05 · {pt ? 'TREINO NOS ERROS' : 'TARGETED PRACTICE'}</span>
          <h3>{pt ? 'Baterias focadas onde você travou' : 'Practice sets focused on your weak spots'}</h3>
          <p>
            {pt
              ? 'Gere novas rodadas de 5 perguntas filtradas pelos seus erros e escolha o nível de exigência.'
              : 'Generate fresh 5-question drills filtered by your mistakes and calibrated by difficulty.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <div className={s.practiceControlsBar}>
            <div className={s.diffPills} role="group" aria-label={pt ? 'Dificuldade do treino' : 'Practice difficulty'}>
              {(
                [
                  ['fundamentals', pt ? 'Fundamentos' : 'Foundations'],
                  ['intermediate', pt ? 'Intermediário' : 'Intermediate'],
                  ['exam', pt ? 'Estilo prova' : 'Exam style'],
                ] as const
              ).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={s.diffPill}
                  data-active={diff === key}
                  onClick={() => setDiff(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={s.focusWeakBadge}>
              🎯 {pt ? 'Foco: Priorizar meus erros (2)' : 'Focus: Prioritize my mistakes (2)'}
            </span>
          </div>
          <div className={s.practicePromptCard}>
            <small>{pt ? 'QUESTÃO GERADA SOB MEDIDA · CONCEITO FRACO' : 'TAILORED DRILL · WEAK CONCEPT'}</small>
            <p>{practicePrompts[diff]}</p>
          </div>
        </div>
      </article>

      {/* 6. Notes with highlights */}
      <article className={s.cursorCard}>
        <div className={s.cursorCardCopy}>
          <span className={s.cursorCardEyebrow}>06 · {pt ? 'ANOTAÇÕES COM DESTAQUE' : 'NOTES & HIGHLIGHTS'}</span>
          <h3>{pt ? 'Grife trechos e anote sem sujar o PDF' : 'Highlight passages and keep section notes'}</h3>
          <p>
            {pt
              ? 'Destaque frases de qualquer seção e salve seus resumos pessoais enquanto o PDF permanece intacto.'
              : 'Highlight key lines from any section and save personal notes while your printable PDF stays clean.'}
          </p>
        </div>
        <div className={s.cursorCropWindow}>
          <div className={s.cropTopBar}>
            <span>§ 1 · Ridge regression (L2)</span>
            <span className={s.savedNoteBadge}>{noteSaved ? (pt ? '✓ Salvo na seção' : '✓ Saved to section') : (pt ? 'Editando…' : 'Editing…')}</span>
          </div>
          <div className={s.noteHighlightBox}>
            <small>{pt ? 'TRECHO DESTACADO NO GUIA' : 'HIGHLIGHTED GUIDE EXCERPT'}</small>
            <p>
              “...{pt ? 'a atualização multiplica o peso por ' : 'the update multiplies the weight by '}
              <mark className={s.guideMark}>(1 − ηλ) {pt ? 'a cada passo — daí o nome weight decay' : 'at every step — hence weight decay'}</mark>.”
            </p>
          </div>
          <label className={s.noteInputWrap}>
            <span className={s.srOnly}>{pt ? 'Sua anotação pessoal' : 'Your personal note'}</span>
            <input
              type="text"
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value)
                setNoteSaved(true)
              }}
              className={s.noteMiniInput}
            />
          </label>
        </div>
      </article>
    </div>
  )
}

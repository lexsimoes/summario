import type { Locale } from '@/lib/i18n'

/**
 * A real fragment of a generated guide, rendered with the document's own box
 * styles. Portuguese visitors see the bilingual mode (technical English +
 * Portuguese intuition); English visitors see the all-English mode, since that
 * is the version they would actually buy.
 */
const copy = {
  pt: {
    bar: 'PART 1 — SHRINKAGE',
    heading: 'Ridge regression (L2)',
    intuitionLabel: 'A INTUIÇÃO PRÁTICA',
    intuition:
      'Ridge é um imposto progressivo: todo coeficiente paga alguma coisa, os maiores pagam mais, e ninguém é demitido. ' +
      'No fim, todo mundo continua na folha de pagamento — só que ganhando menos.',
    bullets: [
      ['Penalty', 'adds the squared L2 norm of the coefficients to the loss.'],
      ['Effect', 'shrinks coefficients toward zero, but never exactly to zero.'],
      ['Tuning', 'one knob only — the penalty strength, chosen by cross-validation.'],
    ] as [string, string][],
    math: 'RSS(β) + λ Σ βⱼ²',
    deepdiveLabel: 'PRA FIXAR',
    deepdive:
      'O mesmo mecanismo tem dois nomes: em estatística chama-se ridge, em deep learning chama-se weight decay. ' +
      'A atualização multiplica o peso por (1 − ηλ) a cada passo — daí o "decay". Perceber que são a mesma ideia economiza metade do estudo.',
    linkLabel: 'Cross-link',
    link: 'tree pruning’s complexity parameter plays the same role as the Lasso penalty — a tax on complexity, in a different currency.',
  },
  en: {
    bar: 'PART 1 — SHRINKAGE',
    heading: 'Ridge regression (L2)',
    intuitionLabel: 'PRACTICAL INTUITION',
    intuition:
      'Ridge is a progressive tax: every coefficient pays something, the biggest ones pay most, and nobody gets fired. ' +
      'Everyone stays on the payroll at the end of it — just on a smaller salary.',
    bullets: [
      ['Penalty', 'adds the squared L2 norm of the coefficients to the loss.'],
      ['Effect', 'shrinks coefficients toward zero, but never exactly to zero.'],
      ['Tuning', 'one knob only — the penalty strength, chosen by cross-validation.'],
    ] as [string, string][],
    math: 'RSS(β) + λ Σ βⱼ²',
    deepdiveLabel: 'KEY TAKEAWAY',
    deepdive:
      'The same mechanism carries two names: ridge in statistics, weight decay in deep learning. ' +
      'The update multiplies the weight by (1 − ηλ) at every step — hence "decay". Seeing that they are one idea halves the studying.',
    linkLabel: 'Cross-link',
    link: 'tree pruning’s complexity parameter plays the same role as the Lasso penalty — a tax on complexity, in a different currency.',
  },
} as const

export function SampleGuide({ locale, showBadge = true }: { locale: Locale; showBadge?: boolean }) {
  const c = copy[locale]
  return (
    <div className="doc stack" style={{ gap: 12 }}>
      <div className="doc-bar">{c.bar}</div>

      <h3 className="doc-h">
        <span className="doc-num">1</span>
        <span>{c.heading}</span>
        {showBadge && <span className="pill pill-badge" style={{ fontSize: 9.5 }}>AI Engineer</span>}
      </h3>

      <div className="doc-box doc-intuition">
        <div className="doc-lab">{c.intuitionLabel}</div>
        <p>{c.intuition}</p>
      </div>

      <ul className="doc-list">
        {c.bullets.map(([term, rest]) => (
          <li key={term}><strong>{term}</strong> — {rest}</li>
        ))}
      </ul>

      <div className="doc-math">{c.math}</div>

      <div className="doc-box doc-deepdive">
        <div className="doc-lab">{c.deepdiveLabel}</div>
        <p>{c.deepdive}</p>
      </div>

      <p className="small" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 12, margin: 0 }}>
        <strong>{c.linkLabel}:</strong> {c.link}
      </p>
    </div>
  )
}

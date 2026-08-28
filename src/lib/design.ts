import type { Family, LanguageMode } from './types'

export const families: Record<Family, { accent: string; bar: string; label: string }> = {
  supervised:    { accent: '#0b6e5f', bar: '#10322c', label: 'Supervised ML' },
  deep_learning: { accent: '#5b3fb0', bar: '#2e2058', label: 'Deep Learning' },
  unsupervised:  { accent: '#0e7490', bar: '#0b4553', label: 'Unsupervised' },
  foundations:   { accent: '#0e7490', bar: '#0b4553', label: 'Foundations' },
}

/** Box labels per language. In bilingual mode each box uses its own language. */
export const labels = {
  en: {
    intuition: 'PRACTICAL INTUITION',
    deepdive: 'KEY TAKEAWAY',
    answer: 'ANSWER',
    theory: 'THEORY',
    trap: 'CLASSIC TRAP',
    recap: 'QUICK RECAP',
  },
  pt: {
    intuition: 'A INTUIÇÃO PRÁTICA',
    deepdive: 'PRA FIXAR',
    answer: 'RESPOSTA',
    theory: 'TEORIA',
    trap: 'PEGADINHA CLÁSSICA',
    recap: 'RECAP RÁPIDO',
  },
} as const

export function labelsFor(mode: LanguageMode) {
  if (mode === 'en') return labels.en
  if (mode === 'pt') return labels.pt
  return {
    ...labels.en,
    intuition: labels.pt.intuition,
    deepdive: labels.pt.deepdive,
    trap: labels.pt.trap,
  }
}

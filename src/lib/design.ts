import type { LanguageMode, Theme } from './types'

/**
 * Accent palettes for the generated document.
 *
 * These used to be named after machine-learning course families, which leaked a
 * personal taxonomy into a general-purpose tool and, worse, asked the reader to
 * pick a colour by choosing a subject. The subject already arrives in the topic,
 * the scope and the source material — so the palette is derived, not asked for.
 */
export const themes: Record<Theme, { accent: string; bar: string }> = {
  violet:   { accent: '#5b3fb0', bar: '#2e2058' },
  teal:     { accent: '#0b6e5f', bar: '#10322c' },
  cyan:     { accent: '#0e7490', bar: '#0b4553' },
  crimson:  { accent: '#8c2f39', bar: '#3d151a' },
}

const ORDER: Theme[] = ['violet', 'teal', 'cyan', 'crimson']

/**
 * Deterministic from the topic, so the same subject always looks the same and a
 * library of documents reads as a set rather than a random assortment.
 */
export function themeFor(topic: string): Theme {
  let hash = 0
  for (const ch of topic.trim().toLowerCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  }
  return ORDER[hash % ORDER.length]
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

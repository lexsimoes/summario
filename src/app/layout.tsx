import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { getLocale, dict } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'summario — guias de bolso imprimíveis e prática ativa para estudar temas densos',
  description:
    'Parta de um tema ou do seu PDF, identifique o essencial e estude por um guia A4 imprimível com quiz, flashcards, Anki, perguntas ao guia, treino nos erros e anotações. Em português, inglês ou bilíngue.',
  other: {
    'text-scale': 'scale',
  },
}

/**
 * Paints the mobile browser chrome. Paper in light mode and the document's own
 * deep violet in dark, so the app does not sit inside a strip of unrelated
 * colour on a phone.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#2e2058' },
  ],
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={dict(locale).htmlLang}>
      <body>{children}</body>
    </html>
  )
}

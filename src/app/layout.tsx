import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getLocale, dict } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'summario — study guides from your own material',
  description:
    'Upload a textbook, point at a chapter, get a print-ready pocket guide: intuition in your language, technical vocabulary in the language of the field.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={dict(locale).htmlLang}>
      <body>{children}</body>
    </html>
  )
}

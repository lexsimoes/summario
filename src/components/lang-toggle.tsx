'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { Locale } from '@/lib/i18n'

function Toggle({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const params = useSearchParams().toString()
  const next = encodeURIComponent(pathname + (params ? `?${params}` : ''))

  return (
    <div className="lang" data-active={locale} role="group" aria-label="Language">
      <span className="lang-thumb" aria-hidden />
      {(['pt', 'en'] as Locale[]).map((code) => (
        <a
          key={code}
          href={`/api/locale?to=${code}&next=${next}`}
          data-on={locale === code}
          aria-current={locale === code ? 'true' : undefined}
        >
          {code}
        </a>
      ))}
    </div>
  )
}

export function LangToggle({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<div className="lang" data-active={locale}><span className="lang-thumb" /></div>}>
      <Toggle locale={locale} />
    </Suspense>
  )
}

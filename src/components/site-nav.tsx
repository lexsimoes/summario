import Link from 'next/link'
import { Brand } from './brand'
import { LangToggle } from './lang-toggle'
import type { Dict, Locale } from '@/lib/i18n'

export function SiteNav({ t, locale, signedIn }: { t: Dict; locale: Locale; signedIn: boolean }) {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Brand />
        <nav className="nav-links hide-sm">
          <a href="#how">{t.nav.how}</a>
          <a href="#anatomy">{t.nav.anatomy}</a>
          <a href="#method">{t.nav.method}</a>
          <a href="#pricing">{t.nav.pricing}</a>
        </nav>
        <div className="row" style={{ gap: 14 }}>
          <LangToggle locale={locale} />
          <Link href={signedIn ? '/app' : '/login'} className="btn btn-primary btn-sm">
            {signedIn ? t.nav.dashboard : t.nav.login}
          </Link>
        </div>
      </div>
    </header>
  )
}

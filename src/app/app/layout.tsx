import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { creditState, FREE_MONTHLY_GUIDES } from '@/lib/credits'
import { tr } from '@/lib/i18n'
import { Brand } from '@/components/brand'
import { LangToggle } from '@/components/lang-toggle'
import { AppNav } from '@/components/app-nav'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const { t, locale } = await tr()
  const credits = creditState(user)
  const pt = locale === 'pt'
  const creditLabel = credits.unlimited ? t.app.credits.unlimited : credits.balance > 0
    ? `${credits.balance} ${credits.balance === 1 ? t.app.create.credit : t.app.create.creditsPl}`
    : `${t.app.credits.freeMonthly}: ${credits.freeRemaining}/${FREE_MONTHLY_GUIDES}`

  return <div className="app-ui workspace">
    <a className="workspace-skip" href="#workspace-main">{pt ? 'Pular para o conteúdo' : 'Skip to content'}</a>
    <aside className="workspace-sidebar">
      <div className="workspace-logo"><Brand href="/app" /><span>✦</span></div>
      <Link href="/app/new" className="btn btn-primary workspace-create"><span aria-hidden="true">＋</span>{t.app.nav.create}</Link>
      <AppNav t={t} isOwner={user.plan === 'owner'} />
      <div className="workspace-sidebar-bottom">
        <div className="workspace-plan"><span className="workspace-plan-icon" aria-hidden="true">✦</span><strong>{credits.unlimited ? t.app.credits.unlimited : credits.balance > 0 ? 'Plus' : 'Free'}</strong><p>{creditLabel}</p><Link href="/app/credits">{pt ? 'Ver meu plano' : 'View my plan'} <span aria-hidden="true">→</span></Link></div>
        <Link href="/" className="workspace-home">↗ {pt ? 'Conheça o summario' : 'Explore summario'}</Link>
      </div>
    </aside>
    <div className="workspace-body">
      <header className="workspace-topbar">
        <span className="workspace-tagline">{pt ? 'Um pouco de curiosidade. Infinitas possibilidades.' : 'A little curiosity. Endless possibilities.'}</span>
        <div className="workspace-account"><LangToggle locale={locale} /><span className="workspace-avatar" aria-hidden="true">{(user.name || user.email).slice(0, 1).toUpperCase()}</span><span className="workspace-user">{user.name || user.email}</span><form action="/api/auth/logout" method="post"><button className="btn btn-quiet btn-sm" type="submit">{t.app.nav.logout}</button></form></div>
      </header>
      <main id="workspace-main" className="workspace-main">{children}</main>
    </div>
  </div>
}

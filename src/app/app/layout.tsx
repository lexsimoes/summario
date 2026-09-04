import type { ReactNode } from 'react'
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

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header className="nav" style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="wrap nav-inner">
          <div className="row" style={{ gap: 18 }}>
            <Brand href="/app" />
            <span className="pill pill-accent" style={{ letterSpacing: '.04em' }}>
              {credits.unlimited
                ? t.app.credits.unlimited
                : credits.balance > 0
                  ? `${credits.balance} ${credits.balance === 1 ? t.app.create.credit : t.app.create.creditsPl}`
                  : `${t.app.credits.freeMonthly}: ${credits.freeRemaining}/${FREE_MONTHLY_GUIDES}`}
            </span>
          </div>
          <div className="row" style={{ gap: 14 }}>
            <LangToggle locale={locale} />
            <span className="small hide-sm" style={{ color: 'var(--muted)' }}>{user.name || user.email}</span>
            <form action="/api/auth/logout" method="post">
              <button className="btn btn-quiet btn-sm" type="submit">{t.app.nav.logout}</button>
            </form>
          </div>
        </div>
        <div className="wrap"><AppNav t={t} isOwner={user.plan === 'owner'} /></div>
      </header>

      <main className="wrap" style={{ flex: 1, paddingBlock: 'clamp(28px, 4vw, 52px) 80px' }}>
        {children}
      </main>
    </div>
  )
}

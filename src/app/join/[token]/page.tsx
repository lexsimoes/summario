import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { getInviteByHash } from '@/lib/db'
import { hashToken, isClaimable } from '@/lib/invites'
import { tr } from '@/lib/i18n'
import { Brand } from '@/components/brand'
import { LangToggle } from '@/components/lang-toggle'
import { JoinForm } from './join-form'

export const dynamic = 'force-dynamic'

const INVITE_MAILTO = 'mailto:alexcot25@gmail.com?subject=Pedido%20de%20acesso%20ao%20summario'

/**
 * The invite link. The token is in the path, so it is looked up by hash here
 * and the page renders either a usable form or a dead end — the form is never
 * shown for an invite that would be refused on submit.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  if (await currentUser()) redirect('/app')

  const { token } = await params
  const { t, locale } = await tr()
  const pt = locale === 'pt'
  const invite = getInviteByHash(hashToken(token))
  const usable = invite && isClaimable(invite)

  return (
    <main className="auth-ui" style={{ minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div className="wrap nav-inner">
        <Brand />
        <LangToggle locale={locale} />
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '24px var(--gut) 80px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!usable ? (
            <div className="card center">
              <p className="workspace-eyebrow" style={{ marginBottom: 8 }}>
                {pt ? 'CONVITE EXPIRADO OU UTILIZADO' : 'INVITE EXPIRED OR CLAIMED'}
              </p>
              <h1 className="title" style={{ marginBottom: 8 }}>{t.join.deadTitle}</h1>
              <p className="small measure" style={{ marginBottom: 22 }}>{t.join.deadLede}</p>
              <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
                <Link className="btn btn-primary" href="/login">{t.join.toLogin}</Link>
                <a className="btn btn-ghost" href={INVITE_MAILTO}>
                  {pt ? 'Solicitar novo convite →' : 'Request new invite →'}
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="workspace-eyebrow center" style={{ marginBottom: 8 }}>
                {pt ? 'CONVITE PESSOAL · SUMMARIO' : 'PERSONAL INVITATION · SUMMARIO'}
              </p>
              <h1 className="title" style={{ marginBottom: 8 }}>{t.join.title}</h1>
              <p className="small measure" style={{ marginBottom: 20 }}>{t.join.lede}</p>

              {invite.credits > 0 && (
                <div className="center" style={{ marginBottom: 18 }}>
                  <span className="pill pill-accent">
                    {invite.credits} {invite.credits === 1 ? t.join.creditsGiftOne : t.join.creditsGift}
                  </span>
                </div>
              )}

              <div className="card">
                <JoinForm token={token} lockedEmail={invite.email} t={t.join} />
              </div>

              <p className="tiny center" style={{ marginTop: 22 }}>
                <Link href="/">{t.login.back}</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

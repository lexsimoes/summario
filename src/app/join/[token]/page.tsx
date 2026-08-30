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

/**
 * The invite link. The token is in the path, so it is looked up by hash here
 * and the page renders either a usable form or a dead end — the form is never
 * shown for an invite that would be refused on submit.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  if (await currentUser()) redirect('/app')

  const { token } = await params
  const { t, locale } = await tr()
  const invite = getInviteByHash(hashToken(token))
  const usable = invite && isClaimable(invite)

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div className="wrap nav-inner">
        <Brand />
        <LangToggle locale={locale} />
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '24px var(--gut) 80px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!usable ? (
            <>
              <h1 className="title" style={{ marginBottom: 8 }}>{t.join.deadTitle}</h1>
              <p className="small measure" style={{ marginBottom: 24 }}>{t.join.deadLede}</p>
              <Link className="btn btn-primary" href="/login">{t.join.toLogin}</Link>
            </>
          ) : (
            <>
              <h1 className="title" style={{ marginBottom: 8 }}>{t.join.title}</h1>
              <p className="small measure" style={{ marginBottom: 20 }}>{t.join.lede}</p>

              {invite.credits > 0 && (
                <p className="pill pill-accent" style={{ marginBottom: 20, display: 'inline-block' }}>
                  {invite.credits} {t.join.creditsGift}
                </p>
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

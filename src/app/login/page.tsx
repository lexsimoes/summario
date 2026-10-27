import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { tr } from '@/lib/i18n'
import { Brand } from '@/components/brand'
import { LangToggle } from '@/components/lang-toggle'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

const INVITE_MAILTO = 'mailto:alexcot25@gmail.com?subject=Pedido%20de%20acesso%20ao%20summario'

export default async function LoginPage() {
  if (await currentUser()) redirect('/app')
  const { t, locale } = await tr()
  const pt = locale === 'pt'

  return (
    <main className="auth-ui" style={{ minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <div className="wrap nav-inner">
        <Brand />
        <LangToggle locale={locale} />
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '24px var(--gut) 80px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <p className="workspace-eyebrow center" style={{ marginBottom: 8 }}>
            {pt ? 'ACESSO POR CONVITE · SUMMARIO' : 'INVITATION-ONLY ACCESS · SUMMARIO'}
          </p>
          <h1 className="title" style={{ marginBottom: 8 }}>{t.login.title}</h1>
          <p className="small" style={{ marginBottom: 24 }}>{t.login.lede}</p>

          <div className="card">
            <LoginForm
              t={{
                email: t.login.email,
                password: t.login.password,
                submit: t.login.submit,
                working: t.login.working,
                failed: t.login.failed,
                throttled: t.login.throttled,
                disabled: t.login.disabled,
              }}
            />
          </div>

          <div className="auth-invite-note">
            {pt ? 'Ainda não tem um convite?' : "Don't have an invite yet?"}{' '}
            <a href={INVITE_MAILTO}>
              {pt ? 'Solicitar acesso por e-mail →' : 'Request access by email →'}
            </a>
          </div>

          <p className="tiny center" style={{ marginTop: 18 }}>
            <Link href="/">{t.login.back}</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

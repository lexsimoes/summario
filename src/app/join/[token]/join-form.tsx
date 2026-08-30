'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Dict } from '@/lib/i18n'

const MIN_PASSWORD = 10

export function JoinForm({
  token, lockedEmail, t,
}: { token: string; lockedEmail: string; t: Dict['join'] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const password = String(data.get('password') ?? '')

    // Checked here as well as on the server, so the person finds out before a
    // round trip rather than after it.
    if (password.length < MIN_PASSWORD) {
      setError(t.errWeak)
      return
    }

    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        name: data.get('name'),
        email: lockedEmail || data.get('email'),
        password,
      }),
    })

    if (res.ok) {
      router.push('/app')
      router.refresh()
      return
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string }
    setError(
      body.error === 'email_taken' ? t.errTaken
        : body.error === 'invite_wrong_email' ? t.errEmail
        : body.error === 'invite_invalid' ? t.errGone
        : body.error === 'weak_password' ? t.errWeak
        : t.errGeneric,
    )
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label className="label" htmlFor="name">{t.name}</label>
        <input className="input" id="name" name="name" type="text" maxLength={80} placeholder={t.namePlaceholder} autoFocus />
      </div>

      <div className="field">
        <label className="label" htmlFor="email">{t.email}</label>
        {lockedEmail ? (
          // An addressed invite is for that person. Showing it read-only is
          // clearer than an input that silently refuses anything else.
          <input className="input" id="email" type="email" value={lockedEmail} readOnly disabled />
        ) : (
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        )}
      </div>

      <div className="field">
        <label className="label" htmlFor="password">{t.password}</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
        <p className="hint">{t.passwordHint}</p>
      </div>

      {error && <p className="error-note" style={{ marginTop: 16 }}>{error}</p>}

      <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} type="submit" disabled={busy}>
        {busy ? t.working : t.submit}
      </button>
    </form>
  )
}

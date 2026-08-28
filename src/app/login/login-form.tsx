'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Labels { email: string; password: string; submit: string; working: string; failed: string }

export function LoginForm({ t }: { t: Labels }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setFailed(false)
    const data = new FormData(e.currentTarget)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
    })
    if (res.ok) {
      router.push('/app')
      router.refresh()
      return
    }
    setFailed(true)
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label className="label" htmlFor="email">{t.email}</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div className="field">
        <label className="label" htmlFor="password">{t.password}</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {failed && <p className="error-note" style={{ marginTop: 16 }}>{t.failed}</p>}
      <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} type="submit" disabled={busy}>
        {busy ? t.working : t.submit}
      </button>
    </form>
  )
}

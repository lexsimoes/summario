import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { creditState } from '@/lib/credits'
import { listMaterials, materialStats } from '@/lib/db'
import { tr } from '@/lib/i18n'
import { StatusPill } from '@/components/status-pill'

export const dynamic = 'force-dynamic'

export default async function Overview() {
  const user = await requireUser()
  const { t, locale } = await tr()
  const credits = creditState(user)
  const stats = materialStats(user.id)
  const recent = listMaterials(user.id, 5)
  const fmt = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })

  const tiles = [
    { label: t.app.overview.balance, value: credits.unlimited ? '∞' : String(credits.balance) },
    { label: t.app.overview.used, value: String(credits.spent) },
    { label: t.app.overview.docs, value: String(stats.docs) },
    { label: t.app.overview.pages, value: String(stats.pages) },
  ]

  return (
    <>
      <div className="row-between" style={{ marginBottom: 30 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>{t.app.overview.title}</h1>
          <p className="small" style={{ margin: 0 }}>{t.app.greeting}, {user.name || user.email}.</p>
        </div>
        <Link href="/app/new" className="btn btn-primary">{t.app.nav.create}</Link>
      </div>

      <div className="grid g4" style={{ marginBottom: 34 }}>
        {tiles.map((s) => (
          <div key={s.label} className="card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label" style={{ marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card card-flush">
        <div className="row-between" style={{ padding: '20px 24px 16px' }}>
          <h2 className="subtitle" style={{ margin: 0 }}>{t.app.overview.recent}</h2>
          <Link href="/app/history" className="link-arrow">{t.app.overview.seeAll} <span>→</span></Link>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '0 24px 28px' }}>
            <div className="empty">
              <p className="small" style={{ marginTop: 0 }}>{t.app.overview.empty}</p>
              <Link href="/app/new" className="btn btn-ghost btn-sm">{t.app.overview.cta}</Link>
            </div>
          </div>
        ) : (
          <table className="table table-hover">
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/app/documents/${m.id}`} style={{ fontWeight: 600 }}>{m.topic}</Link>
                    <div className="tiny">{t.types[m.document_type]} · {t.languages[m.language]}</div>
                  </td>
                  <td style={{ width: 150 }}><StatusPill status={m.status} t={t} /></td>
                  <td className="num tiny" style={{ width: 90 }}>{fmt.format(new Date(m.created_at + 'Z'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

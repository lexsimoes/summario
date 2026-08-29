import { notFound } from 'next/navigation'
import { listAudit } from '@/lib/audit'
import { requireUser } from '@/lib/auth'
import { tr } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

/**
 * Owner-only. A member has no business reading other accounts' sign-in history,
 * and `notFound()` rather than a 403 keeps the page's existence quiet.
 */
export default async function Audit() {
  const user = await requireUser()
  if (user.plan !== 'owner') notFound()

  const { t, locale } = await tr()
  const rows = listAudit()
  const fmt = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <>
      <h1 className="title" style={{ marginBottom: 4 }}>{t.app.audit.title}</h1>
      <p className="small measure" style={{ marginBottom: 30 }}>{t.app.audit.lede}</p>

      {rows.length === 0 ? (
        <div className="empty">{t.app.audit.empty}</div>
      ) : (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>{t.app.audit.colWhen}</th>
                <th>{t.app.audit.colEvent}</th>
                <th>{t.app.audit.colWho}</th>
                <th>{t.app.audit.colDetail}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="tiny" style={{ whiteSpace: 'nowrap' }}>
                    {fmt.format(new Date(r.created_at + 'Z'))}
                  </td>
                  <td>
                    <span className={r.event.includes('failed') || r.event.includes('throttled') ? 'pill pill-err' : 'pill'}>
                      {t.app.audit.events[r.event] ?? r.event}
                    </span>
                  </td>
                  <td className="tiny">{r.actor_ip ?? '—'}</td>
                  <td className="small" style={{ wordBreak: 'break-word' }}>{r.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { listMaterials } from '@/lib/db'
import { tr } from '@/lib/i18n'
import { StatusPill } from '@/components/status-pill'

export const dynamic = 'force-dynamic'

export default async function History() {
  const user = await requireUser()
  const { t, locale } = await tr()
  const materials = listMaterials(user.id)
  const fmt = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { dateStyle: 'medium' })

  return (
    <>
      <div className="row-between" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>{t.app.history.title}</h1>
          <p className="small" style={{ margin: 0 }}>{t.app.history.lede}</p>
        </div>
        <Link href="/app/new" className="btn btn-primary">{t.app.nav.create}</Link>
      </div>

      {materials.length === 0 ? (
        <div className="empty">{t.app.history.empty}</div>
      ) : (
        <div className="card card-flush">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t.app.history.colDoc}</th>
                <th>{t.app.history.colType}</th>
                <th>{t.app.history.colLang}</th>
                <th>{t.app.history.colStatus}</th>
                <th className="num">{t.app.history.colCost}</th>
                <th className="num">{t.app.history.colDate}</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/app/documents/${m.id}`} style={{ fontWeight: 600 }}>{m.topic}</Link>
                    {m.description && <div className="tiny">{m.description}</div>}
                    {m.model && <div className="tiny">{m.model}</div>}
                  </td>
                  <td className="small">{t.types[m.document_type]}</td>
                  <td className="small">{t.languages[m.language]}</td>
                  <td><StatusPill status={m.status} t={t} /></td>
                  <td className="num small">{m.credits_cost}</td>
                  <td className="num tiny">{fmt.format(new Date(m.created_at + 'Z'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

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
  const pt = locale === 'pt'
  const fmt = new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-US', { dateStyle: 'medium' })

  return <>
    <div className="row-between" style={{ marginBottom: 28 }}>
      <div><p className="workspace-eyebrow">{pt ? 'SEU ESPAÇO DE DESCOBERTAS' : 'YOUR SPACE FOR DISCOVERY'}</p><h1 className="title" style={{ marginBottom: 8 }}>{t.app.history.title}</h1><p className="small" style={{ margin: 0 }}>{t.app.history.lede}</p></div>
      <Link href="/app/new" className="btn btn-primary">＋ {t.app.nav.create}</Link>
    </div>
    {materials.length === 0 ? <div className="workspace-empty"><span aria-hidden="true">▤</span><h3>{pt ? 'Sua biblioteca começa aqui.' : 'Your library starts here.'}</h3><p>{t.app.history.empty}</p><Link href="/app/new" className="btn btn-ghost btn-sm">{t.app.overview.cta} →</Link></div> : <div className="workspace-materials">{materials.map((m, i) => <Link href={`/app/documents/${m.id}`} key={m.id} className="workspace-material card"><div className="workspace-material-top"><span className="workspace-document-icon" data-tone={i % 3} aria-hidden="true">▤</span><StatusPill status={m.status} t={t} /></div><h3>{m.topic}</h3>{m.description && <p className="workspace-material-description">{m.description}</p>}<p>{t.types[m.document_type]} · {t.languages[m.language]}</p><div className="workspace-material-bottom"><time>{fmt.format(new Date(m.created_at + 'Z'))}</time><span>{m.credits_cost} {m.credits_cost === 1 ? t.app.create.credit : t.app.create.creditsPl} ↗</span></div></Link>)}</div>}
  </>
}

import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { creditState, FREE_MONTHLY_GUIDES } from '@/lib/credits'
import { listMaterials, materialStats } from '@/lib/db'
import { tr } from '@/lib/i18n'
import { StatusPill } from '@/components/status-pill'

export const dynamic = 'force-dynamic'

export default async function Overview() {
  const user = await requireUser()
  const { t, locale } = await tr()
  const pt = locale === 'pt'
  const credits = creditState(user)
  const stats = materialStats(user.id)
  const recent = listMaterials(user.id, 6)
  const fmt = new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short' })
  const tiles = [
    { label: t.app.overview.docs, value: String(stats.docs), icon: '▤' },
    { label: t.app.credits.freeMonthly, value: `${credits.freeRemaining}/${FREE_MONTHLY_GUIDES}`, icon: '✦' },
    { label: t.app.overview.balance, value: credits.unlimited ? '∞' : String(credits.balance), icon: '◇' },
    { label: t.app.overview.used, value: String(credits.spent), icon: '↗' },
  ]

  return <>
    <div className="workspace-heading"><div><p className="workspace-eyebrow">{t.app.greeting}, {user.name || user.email} <span aria-hidden="true">✧</span></p><h1 className="title">{pt ? 'O que vamos aprender hoje?' : 'What will you learn today?'}</h1><p className="small">{pt ? 'Sua próxima descoberta começa com uma boa pergunta.' : 'Your next discovery starts with a good question.'}</p></div></div>
    <section className="workspace-welcome">
      <div><span className="workspace-eyebrow">{pt ? 'DA CURIOSIDADE AO CONHECIMENTO' : 'FROM CURIOSITY TO KNOWLEDGE'}</span><h2>{pt ? <>Grandes ideias.<br /><em>Um passo de cada vez.</em></> : <>Big ideas.<br /><em>One step at a time.</em></>}</h2><p>{pt ? 'Escolha um tema. Crie seu guia. Faça o conhecimento ficar.' : 'Pick a topic. Create your guide. Make the knowledge stick.'}</p><Link href="/app/new" className="btn btn-primary">{t.app.nav.create} <span aria-hidden="true">→</span></Link></div>
      <div className="workspace-welcome-art" aria-hidden="true"><span className="welcome-star">✦</span><div className="welcome-sheet back" /><div className="welcome-sheet"><small>summario / STUDY GUIDE</small><b>{pt ? 'Tudo começa com uma ideia.' : 'It all starts with an idea.'}</b><span className="welcome-highlight">✧ {pt ? 'Agora faz sentido.' : 'Now it makes sense.'}</span><i /><i /><i /><div className="welcome-check">✓</div></div></div>
    </section>
    <div className="workspace-stats">{tiles.map(tile => <div key={tile.label} className="card"><span className="workspace-stat-icon" aria-hidden="true">{tile.icon}</span><div><div className="stat-value">{tile.value}</div><div className="stat-label">{tile.label}</div></div></div>)}</div>
    <section className="workspace-library"><div className="row-between"><h2 className="subtitle">{t.app.overview.recent}</h2><Link href="/app/history" className="link-arrow">{t.app.overview.seeAll} <span>→</span></Link></div>
      {recent.length === 0 ? <div className="workspace-empty"><span aria-hidden="true">▤</span><h3>{pt ? 'Um espaço para suas descobertas.' : 'A home for your discoveries.'}</h3><p>{t.app.overview.empty}</p><Link href="/app/new" className="btn btn-ghost btn-sm">{t.app.overview.cta} →</Link></div> : <div className="workspace-materials">{recent.map((m, i) => <Link className="workspace-material card" href={`/app/documents/${m.id}`} key={m.id}><div className="workspace-material-top"><span className="workspace-document-icon" data-tone={i % 3} aria-hidden="true">▤</span><StatusPill status={m.status} t={t} /></div><h3>{m.topic}</h3><p>{t.types[m.document_type]} · {t.languages[m.language]}</p><div className="workspace-material-bottom"><time>{fmt.format(new Date(m.created_at + 'Z'))}</time><span aria-hidden="true">↗</span></div></Link>)}</div>}
    </section>
  </>
}

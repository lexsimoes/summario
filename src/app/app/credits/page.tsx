import { requireUser } from '@/lib/auth'
import { creditState, FREE_MONTHLY_GUIDES } from '@/lib/credits'
import { listLedger, getMaterial } from '@/lib/db'
import { tr, type Dict } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const PLUS_RECHARGE_MAILTO = 'mailto:alexcot25@gmail.com?subject=Pacote%20Plus%20summario%20(30%20geracoes)'

function reasonLabel(reason: string, materialTitle: string | null, t: Dict) {
  if (reason === 'generation') return materialTitle ?? t.app.nav.create
  if (reason.startsWith('refund')) return `${t.app.credits.colDelta} · refund${materialTitle ? ` — ${materialTitle}` : ''}`
  if (reason.startsWith('grant')) return reason.replace('grant:', '').replace(/^\w/, (c) => c.toUpperCase())
  return reason
}

export default async function Credits() {
  const user = await requireUser()
  const { t, locale } = await tr()
  const pt = locale === 'pt'
  const credits = creditState(user)
  const ledger = listLedger(user.id)
  const fmt = new Intl.DateTimeFormat(pt ? 'pt-BR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  // Running balance, computed forward from the oldest entry so each row shows
  // the balance as it stood at that moment.
  let running = 0
  const balances = new Map<number, number>()
  for (const entry of [...ledger].reverse()) {
    running += entry.delta
    balances.set(entry.id, running)
  }

  return (
    <>
      <p className="workspace-eyebrow">
        {pt ? 'PACOTES DE CRÉDITOS · SEM ASSINATURA MENSAL' : 'CREDIT PACKS · NO MONTHLY SUBSCRIPTION'}
      </p>
      <h1 className="title" style={{ marginBottom: 6 }}>{t.app.credits.title}</h1>
      <p className="small measure" style={{ marginBottom: 28 }}>{t.app.credits.lede}</p>

      <div className="grid g4" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="stat-value">{credits.unlimited ? '∞' : credits.balance}</div>
          <div className="stat-label" style={{ marginTop: 8 }}>{t.app.credits.balance}</div>
          <p className="tiny" style={{ margin: '8px 0 0' }}>
            {pt ? 'Créditos avulsos que nunca expiram' : 'One-time credits that never expire'}
          </p>
        </div>
        <div className="card">
          <div className="stat-value">{credits.freeRemaining}/{FREE_MONTHLY_GUIDES}</div>
          <div className="stat-label" style={{ marginTop: 8 }}>{t.app.credits.freeMonthly}</div>
          <p className="tiny" style={{ margin: '8px 0 0' }}>
            {pt ? 'Pesquisa por tema na web · renova todo mês' : 'Web topic research · renews monthly'}
          </p>
        </div>
        <div className="card">
          <div className="stat-value">{credits.spent}</div>
          <div className="stat-label" style={{ marginTop: 8 }}>{t.app.credits.spent}</div>
          {!credits.unlimited && credits.granted > 0 && (
            <div className="meter" style={{ marginTop: 14 }}>
              <span style={{ width: `${Math.min(100, (credits.spent / credits.granted) * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="card credits-plus-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="row-between" style={{ gap: 6 }}>
              <span className="stat-label" style={{ color: 'var(--accent-deep)' }}>
                {pt ? 'Pacote Plus · PDF incluído' : 'Plus Pack · PDF included'}
              </span>
              <span className="workspace-badge-plus">US$ 9</span>
            </div>
            <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: 6 }}>
              {pt ? '30 gerações' : '30 generations'}
            </div>
            <p className="tiny" style={{ margin: '4px 0 12px', color: 'var(--muted)' }}>
              {pt ? 'Pagamento único · US$ 0,30/geração' : 'One-time payment · US$ 0.30/gen'}
            </p>
          </div>
          <a className="btn btn-primary btn-sm btn-block" href={PLUS_RECHARGE_MAILTO}>
            {pt ? 'Solicitar pacote Plus →' : 'Request Plus pack →'}
          </a>
        </div>
      </div>

      {credits.unlimited && (
        <div
          className="card"
          style={{ background: 'var(--deepdive-bg)', borderColor: 'var(--deepdive-br)', borderLeftWidth: 4, marginBottom: 32 }}
        >
          <p className="small" style={{ margin: 0, color: 'var(--deepdive-ink)' }}>{t.app.credits.ownerNote}</p>
        </div>
      )}

      <div className="card card-flush">
        <h2 className="subtitle" style={{ margin: 0, padding: '20px 24px 14px' }}>{t.app.credits.ledger}</h2>
        {ledger.length === 0 ? (
          <div style={{ padding: '0 24px 26px' }}>
            <div className="empty">{t.app.credits.emptyLedger}</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t.app.credits.colWhen}</th>
                <th>{t.app.credits.colWhat}</th>
                <th className="num">{t.app.credits.colDelta}</th>
                <th className="num">{t.app.credits.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => {
                const material = e.material_id ? getMaterial(e.material_id) : undefined
                return (
                  <tr key={e.id}>
                    <td className="tiny">{fmt.format(new Date(e.created_at + 'Z'))}</td>
                    <td className="small">{reasonLabel(e.reason, material?.topic ?? null, t)}</td>
                    <td className="num small" style={{ color: e.delta < 0 ? 'var(--trap-lab)' : 'var(--answer-lab)', fontWeight: 600 }}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </td>
                    <td className="num small">{balances.get(e.id)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

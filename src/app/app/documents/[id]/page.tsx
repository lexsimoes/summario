import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getMaterial } from '@/lib/db'
import { tr } from '@/lib/i18n'
import { DocumentStatus } from './document-status'
import { StudySet } from './study-set'

export const dynamic = 'force-dynamic'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const m = getMaterial(id)
  if (!m || m.user_id !== user.id) notFound()

  const { t } = await tr()

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/app/history" className="small" style={{ color: 'var(--muted)' }}>← {t.app.material.back}</Link>

      <h1 className="title" style={{ margin: '14px 0 6px' }}>{m.topic}</h1>
      <p className="small" style={{ marginBottom: 30 }}>
        {t.types[m.document_type]} · {t.languages[m.language]}
        {m.model ? ` · ${m.model}` : ''}
        {m.description ? ` · ${m.description}` : ''}
      </p>

      {m.api_cost_usd !== null && (
        <div className="card" style={{ marginBottom: 22, paddingBlock: 16 }}>
          <div className="row-between">
            <span className="stat-label">Custo estimado da API</span>
            <strong>USD {m.api_cost_usd.toFixed(4)}</strong>
          </div>
          {m.searches > 0 && (
            <p className="tiny" style={{ margin: '7px 0 0' }}>
              {m.searches} chamada(s) de pesquisa; eventual tarifa da ferramenta não incluída.
            </p>
          )}
        </div>
      )}

      <div className="stack-l">
        <DocumentStatus
          id={id}
          initialStatus={m.status}
          t={{
            open: t.app.material.open,
            openHtml: t.app.material.openHtml,
            sources: t.app.material.sources,
            sourcesLede: t.app.material.sourcesLede,
            checks: t.app.material.checks,
            checksLede: t.app.material.checksLede,
            usage: t.app.material.usage,
            tokensIn: t.app.material.tokensIn,
            tokensOut: t.app.material.tokensOut,
            tokensCached: t.app.material.tokensCached,
            stages: t.app.material.stages,
            pages: t.app.overview.pages,
          }}
        />

        {m.status === 'done' && m.credits_cost > 0 && !m.sandbox && (
          <StudySet id={id} guideHref={`/api/materials/${id}/html`} t={t.app.material.study} />
        )}
      </div>
    </div>
  )
}

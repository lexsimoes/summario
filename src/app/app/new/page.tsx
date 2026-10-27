import { requireUser } from '@/lib/auth'
import { creditState, COST, FREE_MONTHLY_GUIDES } from '@/lib/credits'
import { tr } from '@/lib/i18n'
import { NewDocumentForm } from './new-document-form'

export const dynamic = 'force-dynamic'

export default async function NewDocument({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string }>
}) {
  const user = await requireUser()
  const { t, locale } = await tr()
  const credits = creditState(user)
  const isPlus = credits.unlimited || credits.balance > 0
  const params = searchParams ? await searchParams : {}
  const initialSource =
    params.source === 'upload' || params.source === 'web'
      ? params.source
      : isPlus
        ? 'upload'
        : 'web'
  const pt = locale === 'pt'

  return (
    <div className="workspace-new">
      <div className="workspace-new-intro">
        <p className="workspace-eyebrow">
          {pt ? 'NOVO GUIA DE BOLSO · A4 IMPRIMÍVEL + PRÁTICA ATIVA' : 'NEW POCKET GUIDE · PRINTABLE A4 + ACTIVE PRACTICE'}
        </p>
        <h1 className="title" style={{ marginBottom: 6 }}>{t.app.create.title}</h1>
        <p className="small" style={{ marginBottom: 24 }}>{t.app.create.lede}</p>
      </div>

      <div className="card">
        <NewDocumentForm
          t={t.app.create}
          types={t.types}
          languages={t.languages}
          cost={COST.pocket_guide}
          balance={credits.unlimited ? Number.POSITIVE_INFINITY : credits.balance}
          freeRemaining={credits.freeRemaining}
          freeLimit={FREE_MONTHLY_GUIDES}
          isPlus={isPlus}
          initialSource={initialSource}
          locale={locale}
        />
      </div>
    </div>
  )
}

import { requireUser } from '@/lib/auth'
import { creditState, COST } from '@/lib/credits'
import { tr } from '@/lib/i18n'
import { NewDocumentForm } from './new-document-form'

export const dynamic = 'force-dynamic'

export default async function NewDocument() {
  const user = await requireUser()
  const { t } = await tr()
  const credits = creditState(user)

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 className="title" style={{ marginBottom: 4 }}>{t.app.create.title}</h1>
      <p className="small" style={{ marginBottom: 30 }}>{t.app.create.lede}</p>

      <div className="card">
        <NewDocumentForm
          t={t.app.create}
          types={t.types}
          languages={t.languages}
          cost={COST.pocket_guide}
          balance={credits.unlimited ? Number.POSITIVE_INFINITY : credits.balance}
        />
      </div>
    </div>
  )
}

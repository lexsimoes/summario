import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { COST } from '@/lib/credits'
import { tr } from '@/lib/i18n'
import { NewDocumentForm } from '../../new/new-document-form'

export const dynamic = 'force-dynamic'

export default async function ModelSandboxPage() {
  const user = await requireUser()
  if (user.plan !== 'owner') notFound()
  const { t } = await tr()

  return (
    <div style={{ maxWidth: 760 }}>
      <p className="kicker">Sandbox</p>
      <h1 className="title" style={{ marginBottom: 8 }}>Laboratório de modelos</h1>
      <p className="small measure" style={{ marginBottom: 28 }}>
        Gere o mesmo capítulo com Opus 5 e Gemini 3.8 Flash. Cada resultado fica separado no histórico pelo modelo.
        Use exatamente o mesmo PDF, tópico, escopo e idioma para uma comparação cega.
      </p>
      <div className="card">
        <NewDocumentForm
          t={t.app.create}
          types={t.types}
          languages={t.languages}
          cost={COST.pocket_guide}
          balance={Number.POSITIVE_INFINITY}
          freeRemaining={0}
          uploadOnly
          modelOptions={[
            { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash — candidato' },
            { value: 'claude-opus-5', label: 'Claude Opus 5 — controle' },
          ]}
        />
      </div>
    </div>
  )
}

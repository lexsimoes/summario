import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { listMaterials } from '@/lib/db'
import { SandboxForm } from './sandbox-form'

export const dynamic = 'force-dynamic'

export default async function ModelSandboxPage() {
  const user = await requireUser()
  if (user.plan !== 'owner') notFound()
  const runs = listMaterials(user.id).filter((m) => m.sandbox).slice(0, 12)

  return (
    <div style={{ maxWidth: 760 }}>
      <p className="kicker">Sandbox</p>
      <h1 className="title" style={{ marginBottom: 8 }}>Laboratório de modelos</h1>
      <p className="small measure" style={{ marginBottom: 28 }}>
        Escolha um modelo, anexe um PDF ou descreva um tema para pesquisa. O laboratório gera somente o guia e o PDF,
        registra tokens e estima o custo da API. Repita o mesmo pedido com outro modelo para comparar.
      </p>
      <SandboxForm />

      {runs.length > 0 && (
        <div className="card card-flush" style={{ marginTop: 30 }}>
          <h2 className="subtitle" style={{ padding: '20px 24px 14px', margin: 0 }}>Execuções recentes</h2>
          <table className="table table-hover"><tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td><Link href={`/app/documents/${run.id}`} style={{ fontWeight: 600 }}>{run.topic}</Link></td>
                <td className="small">{run.model}</td>
                <td className="num small">{run.api_cost_usd === null ? '—' : `USD ${run.api_cost_usd.toFixed(4)}`}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  )
}

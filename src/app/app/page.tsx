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
    { label: t.app.credits.freeMonthly, value: `${credits.freeRemaining}/${FREE_MONTHLY_GUIDES}`, icon: '⌕' },
    { label: t.app.overview.balance, value: credits.unlimited ? '∞' : String(credits.balance), icon: '✦' },
    { label: t.app.overview.used, value: String(credits.spent), icon: '↗' },
  ]

  return (
    <>
      <div className="workspace-heading">
        <div>
          <p className="workspace-eyebrow">
            {t.app.greeting}, {user.name || user.email}
          </p>
          <h1 className="title">
            {pt ? 'Mesa de estudo e guias de bolso.' : 'Study desk & pocket guides.'}
          </h1>
          <p className="small">
            {pt
              ? 'Parta de um tema pesquisado ou de um PDF próprio para gerar um guia A4 imprimível com quiz, flashcards, Anki e revisão dos erros.'
              : 'Start from a researched topic or your own PDF to generate a printable A4 guide with quiz, flashcards, Anki export, and mistake review.'}
          </p>
        </div>
      </div>

      <section className="workspace-welcome">
        <div>
          <span className="workspace-eyebrow">
            {pt ? 'NOVO GUIA DE BOLSO · PT, EN OU BILÍNGUE' : 'NEW POCKET GUIDE · PT, EN OR BILINGUAL'}
          </span>
          <h2>
            {pt ? (
              <>
                Do tema ou do seu PDF a um <em>guia de bolso</em> pronto para estudar.
              </>
            ) : (
              <>
                From a topic or your PDF to a printable <em>pocket guide.</em>
              </>
            )}
          </h2>
          <p>
            {pt
              ? 'Identifica o essencial, explica com clareza e acopla perguntas ao guia com referência de seção, flashcards e treino focado nos seus erros.'
              : 'Finds the essentials, explains them clearly, and pairs the guide with section-referenced Q&A, flashcards, and targeted practice on your mistakes.'}
          </p>

          <div className="workspace-entry-grid">
            <Link href="/app/new?source=web" className="workspace-entry-chip">
              <span className="workspace-entry-icon" aria-hidden="true">⌕</span>
              <span className="workspace-entry-text">
                <span className="workspace-entry-top">
                  <strong>{pt ? 'Escolha um tema' : 'Choose a topic'}</strong>
                  <span className="workspace-badge-free">Free &amp; Plus</span>
                </span>
                <small>
                  {pt
                    ? 'Pesquisa em fontes confiáveis · 5 guias/mês no Free'
                    : 'Cited web research · 5 guides/mo on Free'}
                </small>
              </span>
            </Link>

            <Link href="/app/new?source=upload" className="workspace-entry-chip">
              <span className="workspace-entry-icon" aria-hidden="true">▧</span>
              <span className="workspace-entry-text">
                <span className="workspace-entry-top">
                  <strong>{pt ? 'Use seu material (PDF)' : 'Use your own material (PDF)'}</strong>
                  <span className="workspace-badge-plus">Plus</span>
                </span>
                <small>
                  {pt
                    ? 'Capítulos de livros, artigos ou apostilas'
                    : 'Textbook chapters, papers, or handouts'}
                </small>
              </span>
            </Link>
          </div>
        </div>

        <div className="workspace-welcome-art" aria-hidden="true">
          <div className="welcome-sheet back" />
          <div className="welcome-sheet">
            <small>
              <span>summario · A4</span>
              <span>PT / EN</span>
            </small>
            <b>{pt ? 'Capítulo 1 · Bioenergética e ATP' : 'Chapter 1 · Bioenergetics & ATP'}</b>
            <span className="welcome-highlight">
              ✦ {pt ? 'A Intuição Prática: analogia clara antes do formalismo.' : 'Practical Intuition: clear analogy before formalism.'}
            </span>
            <div className="welcome-sheet-pills">
              <span>Quiz</span>
              <span>Flashcards</span>
              <span>Anki .tsv</span>
              <span>{pt ? 'Seções citadas' : 'Cited sections'}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="workspace-stats">
        {tiles.map((tile) => (
          <div key={tile.label} className="card">
            <span className="workspace-stat-icon" aria-hidden="true">{tile.icon}</span>
            <div>
              <div className="stat-value">{tile.value}</div>
              <div className="stat-label">{tile.label}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="workspace-library">
        <div className="row-between">
          <h2 className="subtitle" style={{ margin: 0 }}>{t.app.overview.recent}</h2>
          <Link href="/app/history" className="link-arrow">
            {t.app.overview.seeAll} <span>→</span>
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="workspace-empty">
            <span aria-hidden="true">▤</span>
            <h3>{pt ? 'Sua estante de guias de bolso está pronta.' : 'Your pocket guide shelf is ready.'}</h3>
            <p>{t.app.overview.empty}</p>
            <Link href="/app/new" className="btn btn-primary btn-sm">
              {t.app.overview.cta} →
            </Link>
          </div>
        ) : (
          <div className="workspace-materials">
            {recent.map((m, i) => (
              <Link className="workspace-material card" href={`/app/documents/${m.id}`} key={m.id}>
                <div>
                  <div className="workspace-material-top">
                    <span className="workspace-document-icon" data-tone={i % 3} aria-hidden="true">▤</span>
                    <StatusPill status={m.status} t={t} />
                  </div>
                  <h3>{m.topic}</h3>
                  {m.description && <p className="workspace-material-description">{m.description}</p>}
                  <p>{t.types[m.document_type]} · {t.languages[m.language]}</p>
                </div>
                <div className="workspace-material-bottom">
                  <time>{fmt.format(new Date(m.created_at + 'Z'))}</time>
                  <span aria-hidden="true">{pt ? 'Abrir guia →' : 'Open guide →'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

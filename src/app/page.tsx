import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { tr } from '@/lib/i18n'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { SampleGuide } from '@/components/sample-guide'
import { Reveal } from '@/components/reveal'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { t, locale } = await tr()
  const user = await currentUser()
  const signedIn = Boolean(user)
  const go = signedIn ? '/app' : '/login'

  return (
    <>
      <SiteNav t={t} locale={locale} signedIn={signedIn} />

      {/* ------------------------------------------------------------ hero */}
      <section className="section" style={{ paddingTop: 'clamp(48px, 7vw, 92px)' }}>
        <div className="wrap split">
          <div>
            <p className="kicker">{t.hero.kicker}</p>
            <h1 className="display" dangerouslySetInnerHTML={{ __html: t.hero.title }} />
            <p className="lede measure" style={{ marginTop: 24 }}>{t.hero.lede}</p>
            <div className="row" style={{ marginTop: 34, gap: 14 }}>
              <Link href={go} className="btn btn-primary btn-lg">{t.hero.ctaPrimary}</Link>
              <a href="#anatomy" className="btn btn-ghost btn-lg">{t.hero.ctaSecondary}</a>
            </div>
            <p className="tiny" style={{ marginTop: 18 }}>{t.hero.note}</p>
          </div>

          <div>
            <div className="card card-raised" style={{ padding: 'clamp(18px, 2.4vw, 26px)' }}>
              <SampleGuide locale={locale} />
            </div>
            <p className="tiny center" style={{ marginTop: 14 }}>{t.hero.sampleCaption}</p>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* --------------------------------------------------------- problem */}
      <section className="section">
        <div className="wrap split">
          <div>
            <p className="kicker">{t.problem.kicker}</p>
            <h2 className="title">{t.problem.title}</h2>
          </div>
          <div>
            <p className="prose">{t.problem.p1}</p>
            <p className="prose">{t.problem.p2}</p>
          </div>
        </div>

        <div className="wrap" style={{ marginTop: 'clamp(36px, 5vw, 64px)' }}>
          <p className="kicker muted">{t.problem.layersTitle}</p>
          <Reveal className="grid g3">
            {t.problem.layers.map((l, i) => (
              <div key={l.t} className="card card-lift">
                <div className="step-num">{i + 1}</div>
                <h3 className="subtitle">{l.t}</h3>
                <p className="small" style={{ margin: 0 }}>{l.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- how */}
      <section id="how" className="section" style={{ background: 'var(--paper-2)' }}>
        <div className="wrap">
          <p className="kicker">{t.how.kicker}</p>
          <h2 className="title measure">{t.how.title}</h2>

          <Reveal className="grid g2" style={{ marginTop: 44 }}>
            {t.how.steps.map((s, i) => (
              <div key={s.t} className="card card-lift" style={{ background: 'var(--surface)' }}>
                <div className="step-num">{i + 1}</div>
                <h3 className="subtitle">{s.t}</h3>
                <p className="small" style={{ margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------------- anatomy */}
      <section id="anatomy" className="section">
        <div className="wrap">
          <p className="kicker">{t.anatomy.kicker}</p>
          <h2 className="title measure">{t.anatomy.title}</h2>
          <p className="lede measure" style={{ marginTop: 16 }}>{t.anatomy.lede}</p>

          <div className="split" style={{ marginTop: 'clamp(36px, 5vw, 64px)', alignItems: 'start' }}>
            <div className="card card-raised sticky-aside">
              <SampleGuide locale={locale} />
            </div>

            <div className="stack-l">
              {[
                { l: t.anatomy.labels.bar, d: t.anatomy.labels.barD },
                { l: t.anatomy.labels.intuition, d: t.anatomy.labels.intuitionD },
                { l: t.anatomy.labels.tech, d: t.anatomy.labels.techD },
                { l: t.anatomy.labels.deepdive, d: t.anatomy.labels.deepdiveD },
                { l: t.anatomy.labels.link, d: t.anatomy.labels.linkD },
              ].map((a) => (
                <div key={a.l} className="annot">
                  <p className="annot-tag">{a.l}</p>
                  <p className="prose" style={{ margin: 0 }}>{a.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- languages */}
      <section className="section" style={{ background: 'var(--accent-deep)', color: '#fff' }}>
        <div className="wrap">
          <p className="kicker" style={{ color: '#b9a8ee' }}>{t.langs.kicker}</p>
          <h2 className="title measure" style={{ color: '#fff' }}>{t.langs.title}</h2>
          <p className="lede measure" style={{ marginTop: 16, color: 'rgba(255,255,255,.72)' }}>{t.langs.lede}</p>

          <Reveal className="grid g3" style={{ marginTop: 44 }}>
            {t.langs.modes.map((m) => (
              <div
                key={m.n}
                className="card card-lift"
                style={{ background: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.14)' }}
              >
                <div className="row" style={{ marginBottom: 12 }}>
                  <h3 className="subtitle" style={{ margin: 0, color: '#fff' }}>{m.n}</h3>
                  {m.tag && (
                    <span className="pill" style={{ background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.2)', color: '#d8cdf6' }}>
                      {m.tag}
                    </span>
                  )}
                </div>
                <p className="small" style={{ margin: 0, color: 'rgba(255,255,255,.68)' }}>{m.d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- method */}
      <section id="method" className="section">
        <div className="wrap">
          <p className="kicker">{t.method.kicker}</p>
          <h2 className="title measure">{t.method.title}</h2>

          <ol className="grid" style={{ marginTop: 44, padding: 0, listStyle: 'none', gap: 0 }}>
            {t.method.steps.map((s, i) => (
              <li
                key={s.t}
                className="row"
                style={{
                  gap: 22,
                  alignItems: 'baseline',
                  padding: '22px 0',
                  borderTop: i === 0 ? '1px solid var(--rule)' : 0,
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                <span
                  className="mono"
                  style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 28, letterSpacing: '.04em' }}
                >
                  0{i + 1}
                </span>
                <span style={{ flex: '1 1 220px', fontFamily: 'var(--serif)', fontSize: 20, letterSpacing: '-0.012em' }}>
                  {s.t}
                </span>
                <span className="small" style={{ flex: '2 1 320px', margin: 0 }}>{s.d}</span>
              </li>
            ))}
          </ol>

          <div
            className="card"
            style={{ marginTop: 36, background: 'var(--intuition-bg)', borderColor: 'var(--intuition-br)', borderLeftWidth: 4 }}
          >
            <p className="annot-tag" style={{ color: 'var(--intuition-lab)' }}>{t.method.soonTitle}</p>
            <p className="prose" style={{ margin: 0, color: 'var(--intuition-ink)' }}>{t.method.soon}</p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- pricing */}
      <section id="pricing" className="section" style={{ background: 'var(--paper-2)' }}>
        <div className="wrap">
          <p className="kicker">{t.pricing.kicker}</p>
          <h2 className="title measure">{t.pricing.title}</h2>
          <p className="lede measure" style={{ marginTop: 16 }}>{t.pricing.lede}</p>

          <Reveal className="grid g3" style={{ marginTop: 44, alignItems: 'stretch' }}>
            {t.pricing.packs.map((p) => (
              <div
                key={p.n}
                className={p.best ? 'card card-raised card-lift' : 'card card-lift'}
                style={{
                  background: 'var(--surface)',
                  borderColor: p.best ? 'var(--accent)' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div className="row-between">
                  <span className="stat-label">{p.n}</span>
                  {p.best && <span className="pill pill-accent">{p.best}</span>}
                </div>
                <div>
                  <div className="stat-value">{p.p}</div>
                  <p className="small" style={{ margin: '6px 0 0' }}>{p.c}</p>
                </div>
                <p className="small" style={{ margin: 0, flex: 1 }}>{p.d}</p>
                <button className="btn btn-ghost btn-block" disabled>{t.app.credits.buy}</button>
              </div>
            ))}
          </Reveal>

          <p className="tiny" style={{ marginTop: 22, maxWidth: '62ch' }}>{t.pricing.note}</p>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="section">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <p className="kicker">{t.faq.kicker}</p>
            <h2 className="title">{t.faq.title}</h2>
          </div>
          <div>
            {t.faq.items.map((f, i) => (
              <details
                key={f.q}
                style={{ borderTop: i === 0 ? '1px solid var(--rule)' : 0, borderBottom: '1px solid var(--rule)', padding: '18px 0' }}
              >
                <summary
                  style={{ cursor: 'pointer', fontWeight: 600, fontSize: 15.5, listStyle: 'none', letterSpacing: '-0.008em' }}
                >
                  {f.q}
                </summary>
                <p className="small" style={{ margin: '12px 0 0' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="section-tight">
        <div className="wrap">
          <div
            className="card center"
            style={{ background: 'var(--surface)', padding: 'clamp(36px, 6vw, 68px)', borderRadius: 22 }}
          >
            <h2 className="title" style={{ maxWidth: '20ch', margin: '0 auto 18px' }}>{t.hero.title.replace(/<\/?em>/g, '')}</h2>
            <Link href={go} className="btn btn-primary btn-lg">{t.hero.ctaPrimary}</Link>
            <p className="tiny" style={{ marginTop: 16 }}>{t.hero.note}</p>
          </div>
        </div>
      </section>

      <SiteFooter t={t} />
    </>
  )
}

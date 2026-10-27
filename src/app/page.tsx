import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { tr } from '@/lib/i18n'
import { Brand } from '@/components/brand'
import { LangToggle } from '@/components/lang-toggle'
import {
  StudyDemo,
  HeroEntryShowcase,
  SampleGuideShowcase,
  LanguageGuideSwitcher,
  FeatureGridShowcase,
} from '@/components/landing-demo'
import s from './landing.module.css'

export const dynamic = 'force-dynamic'

const INVITE_MAILTO = 'mailto:alexcot25@gmail.com?subject=Pedido%20de%20acesso%20ao%20summario'

export default async function Home() {
  const { t, locale } = await tr()
  const user = await currentUser()
  const go = user ? '/app' : '/login'
  const pt = locale === 'pt'
  const secondaryLabel = user ? t.nav.dashboard : (pt ? 'Entrar' : 'Sign in')

  return (
    <div className={s.landing}>
      <a href="#main" className={s.skipLink}>
        {pt ? 'Pular para o conteúdo' : 'Skip to content'}
      </a>

      {/* Header bar */}
      <header className={s.header}>
        <div className={s.navInner}>
          <Brand />
          <nav aria-label={pt ? 'Menu principal' : 'Main navigation'}>
            <a className={s.navLink} href="#sample-guide">
              {pt ? 'Guia de exemplo' : 'Sample guide'}
            </a>
            <a className={s.navLink} href="#features">
              {pt ? 'Recursos' : 'Features'}
            </a>
            <a className={s.navLink} href="#pricing">
              {t.nav.pricing}
            </a>
            <a className={s.navLink} href="#faq">
              FAQ
            </a>
            <LangToggle locale={locale} />
            <Link className={s.navCta} href={go}>
              {secondaryLabel}
            </Link>
          </nav>
        </div>
      </header>

      {/* Thin top invitation announcement bar (inspired by Reducto Hero banner) */}
      <div className={s.inviteBanner} role="region" aria-label={pt ? 'Aviso de acesso por convite' : 'Invitation access notice'}>
        <div className={s.inviteBannerInner}>
          <span className={s.inviteDot} aria-hidden="true" />
          <span>
            {pt
              ? 'Acesso por convite · Folheie um guia real abaixo ou peça seu convite por e-mail'
              : 'Access by invitation · Leaf through a real sample guide below or request an invite'}
          </span>
          <span className={s.inviteDivider} aria-hidden="true">·</span>
          <a href={INVITE_MAILTO} className={s.inviteBannerLink}>
            {pt ? 'Solicitar acesso →' : 'Request access →'}
          </a>
        </div>
      </div>

      <main id="main">
        {/* 1. HERO (inspired by Reducto Hero) */}
        <section className={s.hero}>
          <div className={s.heroContainer}>
            <div className={s.heroCenterCopy}>
              <p className={s.heroEyebrow}>
                {pt
                  ? 'PARA UNIVERSITÁRIOS, AUTODIDATAS E PROFISSIONAIS'
                  : 'FOR UNIVERSITY STUDENTS, SELF-LEARNERS & PROFESSIONALS'}
              </p>
              <h1>
                {pt ? (
                  <>
                    Do tema ou do seu PDF a um<br />
                    <em>guia de bolso</em> pronto para estudar.
                  </>
                ) : (
                  <>
                    From any topic or your PDF to a<br />
                    printable <em>pocket guide.</em>
                  </>
                )}
              </h1>
              <p className={s.heroSubtitle}>
                {pt ? (
                  <>
                    Para <strong>universitários, autodidatas e profissionais</strong> diante de matérias densas: o summario identifica o essencial, explica com clareza e transforma o conteúdo em um{' '}
                    <strong>guia A4 imprimível com atividades para praticar</strong> — em português, inglês ou bilíngue.
                  </>
                ) : (
                  <>
                    Built for <strong>university students, self-directed learners, and professionals</strong> tackling dense material: summario finds the essentials, explains them clearly, and produces a{' '}
                    <strong>printable A4 guide with active practice</strong> — in Portuguese, English, or bilingual mode.
                  </>
                )}
              </p>

              <div className={s.heroCtaGroup}>
                <a className={s.primaryCta} href="#sample-guide">
                  {pt ? 'Ver um guia de exemplo' : 'See a sample guide'} <span aria-hidden="true">→</span>
                </a>
                <Link className={s.outlineCta} href={go}>
                  {secondaryLabel}
                </Link>
              </div>
            </div>

            {/* Dual entry selector ('Escolha um tema' / 'Use seu material' [Plus]) + cropped real mockups */}
            <HeroEntryShowcase locale={locale} />
          </div>
        </section>

        {/* 2. SAMPLE GUIDE SHOWCASE (inspired by Cofounder Social Proof) */}
        <section id="sample-guide" className={s.sampleSection}>
          <div className={s.sectionContainer}>
            <div className={s.sectionHeaderCenter}>
              <span className={s.sectionEyebrow}>
                {pt ? 'VITRINE DO GUIA DE EXEMPLO · A4 IMPRIMÍVEL' : 'SAMPLE GUIDE SHOWCASE · PRINTABLE A4'}
              </span>
              <h2>
                {pt
                  ? 'Veja um guia de bolso real antes de pedir seu convite.'
                  : 'Inspect a real pocket guide before requesting your invite.'}
              </h2>
              <p>
                {pt
                  ? 'Sem depoimentos inventados: a prova mais honesta é o próprio documento que você leva para a mesa de estudo. Abra os capítulos abaixo ou baixe o PDF A4 completo.'
                  : 'No manufactured testimonials: the most honest proof is the actual document you bring to your desk. Read the chapters below or download the full A4 PDF.'}
              </p>
            </div>

            <SampleGuideShowcase locale={locale} />
          </div>
        </section>

        {/* 3. FEATURES & SINGLE INTERACTIVE PREVIEW (inspired by Cursor Features) */}
        <section id="features" className={s.featuresSection}>
          <div className={s.sectionContainer}>
            {/* Top Level: Editorial Copy Left + Language Guide & Single Interactive Preview Right */}
            <div className={s.cursorTopFeature}>
              <div className={s.cursorTopCopy}>
                <span className={s.sectionEyebrow}>
                  {pt ? 'COMO O SUMMARIO ESTRUTURA SEU ESTUDO' : 'HOW SUMMARIO STRUCTURES YOUR STUDY'}
                </span>
                <h2>
                  {pt
                    ? 'Feito para quem lê capítulos universitários, papers e literatura técnica em inglês.'
                    : 'Built for students and professionals reading textbooks, papers, and technical literature.'}
                </h2>
                <p>
                  {pt
                    ? 'Reler grifos dá sensação de familiaridade, mas falha na hora de recuperar da memória. O summario abre cada seção com uma analogia concreta antes da fórmula, preserva os termos técnicos originais quando você escolhe o modo bilíngue e já entrega o ciclo completo de prática ativa.'
                    : 'Rereading highlights creates an illusion of competence that fades when you need to recall. summario opens every section with a concrete analogy before any formula, preserves technical terms in bilingual mode, and pairs the guide with a complete active-recall loop.'}
                </p>

                <div className={s.languageModesSummary}>
                  <div className={s.langSummaryItem}>
                    <strong>{pt ? 'Bilíngue (PT + EN)' : 'Bilingual (PT + EN)'}</strong>
                    <span>
                      {pt
                        ? 'Intuição prática e pegadinhas em português; termos técnicos, definições e fórmulas em inglês.'
                        : 'Practical intuition and classic traps in Portuguese; technical terms, definitions, and formulas in English.'}
                    </span>
                  </div>
                  <div className={s.langSummaryItem}>
                    <strong>{pt ? 'Português ou Inglês puro' : 'Pure Portuguese or English'}</strong>
                    <span>
                      {pt
                        ? 'Todo o guia gerado do zero no idioma escolhido — sem tradução literal de analogias.'
                        : 'The entire guide written from scratch in your chosen language — never a literal translation.'}
                    </span>
                  </div>
                </div>

                <a href="#sample-guide" className={s.inlinePurpleLink}>
                  {pt ? 'Folhear páginas do guia de exemplo acima →' : 'Leaf through the sample guide pages above →'}
                </a>
              </div>

              <div className={s.cursorTopVisuals} id="languages">
                <LanguageGuideSwitcher locale={locale} />
                <StudyDemo locale={locale} />
              </div>
            </div>

            {/* Bottom Level: 6-Card Equal-Width Bordered Grid with Real Working UI Crops */}
            <div className={s.cursorGridIntro}>
              <span className={s.sectionEyebrow}>
                {pt ? 'DO GUIA IMPRESSO À PRÁTICA ATIVA' : 'FROM PRINTED GUIDE TO ACTIVE PRACTICE'}
              </span>
              <h2>
                {pt
                  ? 'Seis ferramentas acopladas ao mesmo guia para universitários e profissionais.'
                  : 'Six practice tools anchored to the same guide for students and professionals.'}
              </h2>
            </div>

            <FeatureGridShowcase locale={locale} />
          </div>
        </section>

        {/* 4. PRICING (inspired by Zaro Pricing) */}
        <section id="pricing" className={s.pricingSection}>
          <div className={s.sectionContainer}>
            <div className={s.zaroEyebrowBar}>
              <span>{t.pricing.kicker}</span>
            </div>

            <div className={s.zaroIntro}>
              <h2>{t.pricing.title}</h2>
              <p className={s.zaroLede}>{t.pricing.lede}</p>
              <p className={s.zaroRateNote}>
                {pt
                  ? 'No pacote Plus, cada geração sai por US$ 0,30 e já inclui o guia A4 em PDF + quiz + flashcards + exportação Anki + perguntas ao guia + treino nos erros.'
                  : 'In the Plus pack, each generation works out to US$ 0.30 and includes the A4 PDF guide + quiz + flashcards + Anki export + ask-the-guide + targeted practice.'}
              </p>
            </div>

            <div className={s.zaroCardsGrid}>
              {/* Free Card */}
              <article className={s.zaroCard} data-featured="false">
                <div className={s.zaroCardTop}>
                  <span className={s.zaroPlanName}>Free</span>
                  <span className={s.zaroPlanScope}>
                    {pt ? 'Pesquisa por tema na web' : 'Web topic research'}
                  </span>
                </div>

                <div className={s.zaroBigMetric}>
                  <strong>{pt ? '5 guias' : '5 guides'}</strong>
                  <span>{pt ? 'POR TEMA / MÊS · RENOVA TODO MÊS' : 'BY TOPIC / MONTH · REFILLS MONTHLY'}</span>
                </div>

                <div className={s.zaroPriceRow}>
                  <span className={s.zaroPriceAmount}>US$ 0</span>
                  <span className={s.zaroUnitRate}>
                    {pt ? 'gratuito · sem cartão' : 'free · no card required'}
                  </span>
                </div>

                <ul className={s.zaroFeatureList}>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Escolha qualquer tema: pesquisa em fontes confiáveis com links citados'
                      : 'Choose any topic: cited web research from authoritative sources'}
                  </li>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Guia de bolso A4 em PDF (Português, Inglês ou Bilíngue)'
                      : 'Printable A4 pocket guide in PDF (Portuguese, English, or Bilingual)'}
                  </li>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Quiz, flashcards, exportação Anki, pergunte ao guia, treino nos erros e anotações'
                      : 'Quiz, flashcards, Anki export, ask-the-guide, targeted practice, and notes'}
                  </li>
                  <li className={s.zaroMutedItem}>
                    <span aria-hidden="true">–</span>
                    {pt
                      ? 'Envio de PDF próprio disponível no pacote Plus'
                      : 'Uploading your own PDF is available in the Plus pack'}
                  </li>
                </ul>

                <a href={user ? go : INVITE_MAILTO} className={s.zaroOutlineBtn}>
                  {user ? t.nav.dashboard : t.pricing.packs[0].action}
                </a>
              </article>

              {/* Plus Anchor Card */}
              <article className={s.zaroCard} data-featured="true">
                <div className={s.zaroAnchorPill}>
                  <span className={s.zaroPillDot} aria-hidden="true" />
                  <span>{pt ? 'PACOTE DE CRÉDITOS · PDF INCLUÍDO' : 'CREDIT PACK · PDF INCLUDED'}</span>
                </div>

                <div className={s.zaroCardTop}>
                  <span className={s.zaroPlanName}>Plus</span>
                  <span className={s.zaroPlanScope}>
                    {pt ? 'Use seu PDF ou pesquise temas' : 'Upload your PDF or research topics'}
                  </span>
                </div>

                <div className={s.zaroBigMetric}>
                  <strong>{pt ? '30 gerações' : '30 generations'}</strong>
                  <span>{pt ? 'CRÉDITOS QUE NÃO EXPIRAM · PDF INCLUÍDO' : 'NON-EXPIRING CREDITS · PDF INCLUDED'}</span>
                </div>

                <div className={s.zaroPriceRow}>
                  <span className={s.zaroPriceAmount}>
                    US$ 9 <small>{pt ? '· pagamento único' : '· one-time payment'}</small>
                  </span>
                  <span className={s.zaroUnitRate}>
                    {pt ? 'US$ 0,30 / geração · sem assinatura' : 'US$ 0.30 / generation · no subscription'}
                  </span>
                </div>

                <ul className={s.zaroFeatureList}>
                  <li>
                    <span aria-hidden="true">✓</span>
                    <strong>
                      {pt
                        ? 'Upload do seu próprio PDF incluído (capítulos de livros, papers, apostilas)'
                        : 'Upload your own PDF included (textbook chapters, papers, handouts)'}
                    </strong>
                  </li>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Créditos avulsos que nunca vencem — use no ritmo do seu semestre ou projeto'
                      : 'Non-expiring credits — use them at the pace of your semester or project'}
                  </li>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Todos os recursos: guia A4, quiz, flashcards, Anki, pergunte ao guia, treino nos erros e anotações'
                      : 'All features included: A4 guide, quiz, flashcards, Anki, ask-the-guide, targeted practice, and notes'}
                  </li>
                  <li>
                    <span aria-hidden="true">✓</span>
                    {pt
                      ? 'Estorno automático do crédito caso alguma geração falhe'
                      : 'Automatic credit refund if a generation ever fails'}
                  </li>
                </ul>

                <a href={user ? '/app/credits' : INVITE_MAILTO} className={s.zaroPrimaryBtn}>
                  <span>{user ? (pt ? 'Ver meus créditos' : 'View my credits') : t.pricing.packs[1].action}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </article>
            </div>

            <p className={s.pricingNote}>{t.pricing.note}</p>
          </div>
        </section>

        {/* 5. FAQ */}
        <section id="faq" className={s.faqSection}>
          <div className={s.faqContainer}>
            <div className={s.sectionHeaderCenter}>
              <span className={s.sectionEyebrow}>{t.faq.kicker}</span>
              <h2>{t.faq.title}</h2>
              <p>
                {pt
                  ? 'Como funcionam os pacotes de crédito, o envio de PDF e a fidelidade às fontes para estudantes e profissionais.'
                  : 'How credit packs, PDF uploads, and source fidelity work for students and professionals.'}
              </p>
            </div>
            <div className={s.faqList}>
              {t.faq.items.map((f) => (
                <details key={f.q}>
                  <summary>
                    {f.q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 6. FINAL INVITATION-ONLY CTA (inspired by Atlas Card CTA) */}
        <section id="access" className={s.atlasCtaSection}>
          <div className={s.atlasCtaInner}>
            <div className={s.atlasEmblem} aria-hidden="true">
              <span>s<i>i</i></span>
            </div>

            <h2 className={s.atlasHeading}>
              {pt
                ? 'Estude capítulos densos com um guia claro, imprimível e feito para ficar na memória.'
                : 'Study dense chapters with a clear, printable guide built to stay in memory.'}
            </h2>

            <p className={s.atlasLead}>
              {pt
                ? 'Com o summario, universitários, autodidatas e profissionais transformam um tema pesquisado ou um capítulo em PDF em um guia de bolso A4 acompanhado de quiz, flashcards, Anki, perguntas com citação de seção e treino focado nos próprios erros.'
                : 'With summario, university students, self-directed learners, and professionals turn a researched topic or a PDF chapter into an A4 pocket guide paired with quizzes, flashcards, Anki export, cited section Q&A, and targeted practice on mistakes.'}
            </p>

            <a href={INVITE_MAILTO} className={s.atlasPrimaryBtn}>
              {pt ? 'Solicitar acesso' : 'Request access'}
            </a>

            <small className={s.atlasMicrocopy}>
              {pt
                ? 'O summario é por convite; respondemos por e-mail.'
                : 'summario is invitation-only; we reply by email.'}
            </small>

            <Link href={go} className={s.atlasSecondaryLink}>
              {user
                ? pt ? 'Já está conectado · Ir para o meu painel →' : 'Already signed in · Go to dashboard →'
                : pt ? 'Já tem acesso? Entrar' : 'Already have access? Sign in'}
            </Link>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div>
          <Brand />
          <p>
            {pt
              ? 'Guias de bolso imprimíveis e prática ativa para estudantes, autodidatas e profissionais.'
              : 'Printable pocket guides and active practice for students, self-learners, and professionals.'}
          </p>
        </div>
        <nav aria-label={pt ? 'Rodapé' : 'Footer'}>
          <a href="#sample-guide">{pt ? 'Guia de exemplo' : 'Sample guide'}</a>
          <a href="#features">{pt ? 'Recursos' : 'Features'}</a>
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="#faq">FAQ</a>
          <a href={INVITE_MAILTO}>{pt ? 'Solicitar acesso' : 'Request access'}</a>
          <Link href={go}>{secondaryLabel}</Link>
        </nav>
        <small>© {new Date().getFullYear()} summario</small>
      </footer>
    </div>
  )
}

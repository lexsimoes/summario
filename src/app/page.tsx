import Link from 'next/link'
import { currentUser } from '@/lib/auth'
import { tr } from '@/lib/i18n'
import { Brand } from '@/components/brand'
import { LangToggle } from '@/components/lang-toggle'
import { StudyDemo, LearningSteps, FlashcardPreview } from '@/components/landing-demo'
import s from './landing.module.css'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { t, locale } = await tr()
  const user = await currentUser()
  const go = user ? '/app' : '/login'
  const pt = locale === 'pt'
  const cta = user ? t.nav.dashboard : (pt ? 'Começar a aprender' : 'Start learning')

  return <div className={s.landing}>
    <a href="#main" className={s.skipLink}>{pt ? 'Pular para o conteúdo' : 'Skip to content'}</a>
    <header className={s.header}>
      <div className={s.navInner}>
        <Brand />
        <nav aria-label={pt ? 'Menu principal' : 'Main navigation'}>
          <a className={s.navLink} href="#how">{t.nav.how}</a>
          <a className={s.navLink} href="#pricing">{t.nav.pricing}</a>
          <LangToggle locale={locale} />
          <Link className={s.navCta} href={go}>{user ? t.nav.dashboard : t.nav.login} <span aria-hidden="true">→</span></Link>
        </nav>
      </div>
    </header>
    <main id="main">
      <section className={s.hero}>
        <div className={s.heroGrid}>
          <div className={s.heroCopy}>
            <h1>{pt ? <>Um jeito melhor<br />de aprender<br /><em>de verdade.</em></> : <>A better way<br />to learn<br /><em>anything.</em></>}</h1>
            <p>{pt ? 'Transforme seus materiais em guias e atividades que fazem o aprendizado acontecer.' : 'Turn your study materials into guides and activities that make learning click.'}</p>
            <Link className={s.primaryCta} href={go}>{cta} <span aria-hidden="true">→</span></Link>
            <small>{pt ? 'Seu próximo capítulo começa aqui. Acesso por convite.' : 'Your next chapter starts here. Access by invitation.'}</small>
          </div>
          <div className={s.heroPreview}><div className={s.sparkle} aria-hidden="true">✦</div><StudyDemo locale={locale} /><span className={s.previewNote}>{pt ? 'menos releitura, mais descobertas' : 'less rereading, more lightbulb moments'}<span aria-hidden="true"> ⤴</span></span></div>
        </div>
        <div className={s.toolStrip}>
          <p>{pt ? 'DO PRIMEIRO “COMO?” ATÉ O “AGORA ENTENDI”.' : 'FROM YOUR FIRST “HOW?” TO YOUR NEXT “GOT IT”.'}</p>
          <div><span>▤ {pt ? 'Guias de estudo' : 'Study guides'}</span><span>✧ Flashcards</span><span>☑ Quizzes</span><span>↗ {pt ? 'Projetos' : 'Projects'}</span><span>▧ PDF</span><span>⟳ Anki</span></div>
        </div>
      </section>

      <section id="how" className={s.section}>
        <h2>{pt ? <>Aprender pode ser <em>simples.</em></> : <>Learning can be <em>simple.</em></>}</h2>
        <LearningSteps locale={locale} />
      </section>

      <section id="features" className={s.section}>
        <div className={s.sectionIntro}><h2>{pt ? 'E isso é só o começo.' : 'And that’s just the beginning.'}</h2><p>{pt ? 'Tudo para entender, praticar e levar o conhecimento com você.' : 'Everything you need to understand, practice, and take your knowledge further.'}</p></div>
        <div className={s.featureGrid}>
          <article className={`${s.featureCard} ${s.wideFeature}`}>
            <div><span className={s.eyebrow}>{pt ? 'SEU GUIA, DO SEU JEITO' : 'YOUR GUIDE, YOUR WAY'}</span><h3>{pt ? 'Grandes ideias. Agora fazem sentido.' : 'Big ideas. Finally making sense.'}</h3><p>{pt ? 'Analogias que aproximam. Conceitos que se conectam. Um guia organizado a partir do seu tema ou material, pronto para ler e imprimir.' : 'Relatable analogies. Connected concepts. A structured guide built from your topic or material, ready to read and print.'}</p><Link href={go} className={s.textLink}>{pt ? 'Criar meu guia' : 'Create my guide'} →</Link></div>
            <div className={s.guideIllustration} aria-label={pt ? 'Exemplo ilustrativo de guia de estudo' : 'Illustrative study guide preview'}>
              <div className={s.backPage} /><div className={s.guidePage}><div className={s.guideBrand}>summario <span>POCKET GUIDE</span></div><small>01 / {pt ? 'BIOLOGIA CELULAR' : 'CELL BIOLOGY'}</small><h4>{pt ? 'Um universo em cada célula.' : 'A universe inside every cell.'}</h4><div className={s.guideCallout}><b>✦ {pt ? 'Pense assim' : 'Think of it this way'}</b><p>{pt ? 'A célula é uma pequena cidade. Cada organela tem um trabalho que mantém tudo funcionando.' : 'A cell is a tiny city. Every organelle has a job that keeps everything running.'}</p></div><b className={s.guideSub}>The mitochondrion</b><div className={s.textLines}><i /><i /><i /></div><div className={s.guideFormula}>ADP + Pᵢ → ATP</div></div>
            </div>
          </article>
          <article className={s.featureCard}><h3>{pt ? 'Pratique até fazer sentido.' : 'Practice until it clicks.'}</h3><p>{pt ? 'Recupere da memória. Vire o cartão. Descubra o que já sabe.' : 'Recall it. Flip the card. Discover what you already know.'}</p><div className={s.flashcardStack}><FlashcardPreview locale={locale} /></div></article>
          <article className={`${s.featureCard} ${s.languageFeature}`}><h3>{pt ? 'Entenda na sua língua.' : 'Understand it in your language.'}</h3><p>{pt ? 'Português, inglês ou os dois. A intuição e o vocabulário técnico lado a lado.' : 'Portuguese, English, or both. Intuition and technical vocabulary, side by side.'}</p><div className={s.languageArt} aria-hidden="true"><div><span>PT</span><strong>Agora<br />entendi.</strong></div><div><span>EN</span><strong>Now it<br />clicks.</strong></div><b>↔</b></div></article>
          <article className={s.featureCard}><h3>{pt ? 'Seu conhecimento vai com você.' : 'Take your knowledge with you.'}</h3><p>{pt ? 'Leia na tela ou imprima seu guia em PDF. Seu estudo cabe na sua rotina.' : 'Read on screen or print your PDF guide. Make studying fit your day.'}</p><div className={s.deviceArt} aria-hidden="true"><div className={s.laptop}><div><small>summario</small><b>{pt ? 'Minha biblioteca' : 'My library'}</b><span /><span /><span /></div></div><div className={s.phone}><small>summario</small><b>{pt ? 'Vamos aprender?' : 'Ready to learn?'}</b><span>✦</span></div></div></article>
          <article className={`${s.featureCard} ${s.ankiFeature}`}><h3>{pt ? 'Lembre por mais tempo.' : 'Remember for longer.'}</h3><p>{pt ? 'Exporte seus flashcards para o Anki e continue com a repetição espaçada.' : 'Export your flashcards to Anki and keep going with spaced repetition.'}</p><div className={s.ankiArt} aria-hidden="true"><span>summario</span><i>⟶</i><span>✦<b>Anki</b></span></div></article>
        </div>
      </section>

      <section id="pricing" className={s.section}>
        <div className={s.sectionIntro}><h2>{pt ? <>Seu ritmo. <em>Seu plano.</em></> : <>Your pace. <em>Your plan.</em></>}</h2><p>{t.pricing.lede}</p></div>
        <div className={s.pricingGrid}>{t.pricing.packs.map(pack => <article key={pack.n} className={s.priceCard} data-featured={Boolean(pack.best)}><div className={s.priceHeader}><h3>{pack.n}</h3>{pack.best && <span>{pack.best}</span>}</div><strong className={s.price}>{pack.p}</strong><b>{pack.c}</b><p>{pack.d}</p><Link className={pack.best ? s.primaryCta : s.secondaryCta} href={go}>{cta} →</Link></article>)}</div>
        <p className={s.pricingNote}>{t.pricing.note}</p>
      </section>

      <section id="faq" className={`${s.section} ${s.faq}`}><div className={s.sectionIntro}><h2>{pt ? 'Ficou alguma dúvida?' : 'Frequently asked questions'}</h2><p>{pt ? 'O que você precisa saber antes de começar.' : 'A few things to know before you get started.'}</p></div><div className={s.faqList}>{t.faq.items.map(f => <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}</div></section>
      <section className={s.finalCta}><span aria-hidden="true">✦</span><h2>{pt ? <>Sua próxima descoberta<br />começa aqui.</> : <>Your next discovery<br />starts here.</>}</h2><p>{pt ? 'Menos tempo organizando. Mais tempo aprendendo.' : 'Less time organizing. More time learning.'}</p><Link href={go} className={s.primaryCta}>{cta} →</Link><small>{t.hero.note}</small></section>
    </main>
    <footer className={s.footer}><div><Brand /><p>{pt ? 'Estude com curiosidade. Aprenda de verdade.' : 'Stay curious. Make learning stick.'}</p></div><nav aria-label={pt ? 'Rodapé' : 'Footer'}><a href="#how">{t.nav.how}</a><a href="#pricing">{t.nav.pricing}</a><a href="#faq">FAQ</a><Link href={go}>{t.nav.login}</Link></nav><small>© {new Date().getFullYear()} summario</small></footer>
  </div>
}

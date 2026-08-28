import { cookies, headers } from 'next/headers'

export type Locale = 'pt' | 'en'
export const LOCALES: Locale[] = ['pt', 'en']
export const LOCALE_COOKIE = 'summario_locale'

/**
 * Detection cascade, blueprint Part 5. Geolocation deliberately does not lead:
 * the owner is a Brazilian in New York, so geo would guess wrong on day one.
 */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  if (saved === 'pt' || saved === 'en') return saved

  const accept = (await headers()).get('accept-language') ?? ''
  const first = accept.split(',')[0]?.trim().toLowerCase() ?? ''
  if (first.startsWith('pt')) return 'pt'

  return 'en'
}

const pt = {
  htmlLang: 'pt-BR',
  brandTag: 'guias de estudo',
  nav: {
    how: 'Como funciona',
    anatomy: 'Anatomia',
    method: 'O método',
    pricing: 'Créditos',
    login: 'Entrar',
    dashboard: 'Meu painel',
  },
  hero: {
    kicker: 'Guias de estudo gerados do seu próprio material',
    title: 'O capítulo inteiro, destilado num guia que você <em>volta</em> a abrir.',
    lede:
      'Você sobe o PDF do seu livro, aponta o capítulo e recebe um guia de bolso pronto para imprimir: ' +
      'a intuição na sua língua, o vocabulário técnico em inglês, as fórmulas certas e as pegadinhas marcadas.',
    ctaPrimary: 'Entrar na plataforma',
    ctaSecondary: 'Ver um guia por dentro',
    note: 'Acesso por convite no momento.',
    sampleCaption: 'Trecho real de um guia gerado — Regularização, modo bilíngue.',
  },
  problem: {
    kicker: 'O problema',
    title: 'Reler resumo dá uma sensação ótima e um resultado ruim.',
    p1:
      'Quando você relê, o texto parece familiar — e o cérebro confunde familiaridade com domínio. ' +
      'Você fecha o material achando que sabe, e descobre na prova que reconhecia sem conseguir recuperar.',
    p2:
      'O que a evidência sobre aprendizagem sustenta é outra coisa: recuperar da memória (efeito de teste) ' +
      'e espalhar as revisões no tempo (efeito de espaçamento). Resumo bom não é o fim do estudo — é a camada de referência que sustenta o resto.',
    layersTitle: 'Três camadas, papéis diferentes',
    layers: [
      { t: 'Referência', d: 'O guia de bolso. Você lê uma vez, sem tentar decorar, e volta nele quando trava.' },
      { t: 'Recuperação', d: 'Quiz e flashcards tirados do próprio guia, pesados para o que você errou.' },
      { t: 'Espaçamento', d: 'Do Anki, não nosso. O algoritmo dele é melhor que qualquer coisa que a gente fizesse na mão.' },
    ],
  },
  how: {
    kicker: 'Como funciona',
    title: 'Quatro passos, e três deles você nem vê.',
    steps: [
      {
        t: 'Você aponta o capítulo',
        d: 'Sobe o PDF do livro — 300, 800 páginas, tanto faz — e diz o intervalo: da seção 7.1 até a 7.6. Só esse trecho é lido. O resto do livro nem é olhado.',
      },
      {
        t: 'O guia é planejado antes de ser escrito',
        d: 'Primeiro sai um plano: quais blocos temáticos, quantas seções em cada um, que conceito entra em qual. Depois cada bloco é escrito separadamente, contra esse plano. É o que impede um documento de 20 páginas de derivar no meio.',
      },
      {
        t: 'Doze checagens automáticas',
        d: 'Toda seção abre com analogia? Nenhuma caixa de intuição tem fórmula? As caixas de teoria estão ensinando ou só repetindo a resposta? Cada regra do blueprint vira uma checagem mecânica, e o resultado vem junto com o guia.',
      },
      {
        t: 'Sai um PDF A4',
        d: 'Fórmulas renderizadas de verdade, quebra de página controlada, pronto para imprimir e rabiscar. Não é uma tela que você rola — é papel.',
      },
    ],
  },
  anatomy: {
    kicker: 'Anatomia de um guia',
    title: 'Cada caixa existe por um motivo.',
    lede:
      'O formato não é decorativo. É uma especificação escrita, com regra de uso para cada elemento — e é essa especificação que o gerador tem que cumprir.',
    labels: {
      bar: 'Bloco temático',
      barD: 'Agrupa as seções por assunto. De dois a quatro por documento.',
      intuition: 'Intuição',
      intuitionD: 'Abre toda seção, antes de qualquer coisa técnica. Sempre uma analogia concreta, nunca uma fórmula, de duas a quatro frases.',
      tech: 'Conteúdo técnico',
      techD: 'Definições, notação e fórmulas na língua da literatura. É o que você vai reencontrar no paper.',
      deepdive: 'Aprofundamento',
      deepdiveD: 'Só para conceito que realmente trava. Usado demais, a caixa perde o sinal — por isso tem teto: no máximo uma a cada duas seções.',
      link: 'Ligação entre módulos',
      linkD: 'Ridge em estatística é weight decay em deep learning. Ver que são a mesma coisa corta metade do estudo.',
    },
  },
  langs: {
    kicker: 'Idioma',
    title: 'Três modos. Nenhum deles é tradução.',
    lede:
      'Analogia nasce numa língua, não é traduzida para ela. Pedir o mesmo capítulo em outro idioma gera tudo de novo a partir da fonte — custa mais tokens e é a única forma que funciona.',
    modes: [
      { n: 'Bilíngue', d: 'Título, termo técnico, definição e fórmula em inglês. Intuição, aprofundamento e pegadinha em português. É o formato de referência.', tag: 'padrão' },
      { n: '100% inglês', d: 'Tudo em inglês, incluindo as analogias. Nenhuma palavra em português sobrevive.', tag: '' },
      { n: '100% português', d: 'Tudo em português. O termo canônico em inglês aparece uma vez entre parênteses na primeira menção — depois some.', tag: '' },
    ],
  },
  method: {
    kicker: 'O método',
    title: 'A ferramenta é uma peça. O ciclo é o que faz efeito.',
    steps: [
      { t: 'Gere o guia', d: 'Leia uma vez, inteiro, sem tentar memorizar nada.' },
      { t: 'Feche e responda', d: 'Quiz de recuperação, de memória. Anote onde travou.' },
      { t: 'Vire cartão', d: 'Flashcards puxados do guia, com peso no que você errou.' },
      { t: 'Deixe o Anki espaçar', d: 'A repetição espaçada é dele. A gente exporta e sai da frente.' },
      { t: 'Construa algo', d: 'Quando os conceitos acumularem, pare de resumir e faça um projeto com eles.' },
    ],
    soonTitle: 'Em construção',
    soon: 'Os guias de bolso e os exam reviews já funcionam. Flashcards com export para Anki e o quiz dentro da plataforma são os próximos — e você vê o que está pronto e o que não está sem precisar adivinhar.',
  },
  pricing: {
    kicker: 'Créditos',
    title: 'Você paga por documento, não por assinatura.',
    lede: 'Um crédito é um guia de bolso. Um exam review completo consome dois, porque é o dobro de documento. Créditos não expiram.',
    packs: [
      { n: 'Avulso', c: '4 créditos', p: 'USD 9', d: 'Para testar num capítulo antes de decidir.', best: '' },
      { n: 'Semestre', c: '20 créditos', p: 'USD 39', d: 'Um capítulo por semana durante um semestre inteiro.', best: 'mais escolhido' },
      { n: 'Curso', c: '60 créditos', p: 'USD 99', d: 'Disciplina inteira, nos três idiomas, com sobra.', best: '' },
    ],
    note: 'Preços indicativos. A plataforma está em acesso por convite e a venda de créditos ainda não está aberta.',
  },
  faq: {
    kicker: 'Perguntas',
    title: 'O que costuma ser perguntado.',
    items: [
      { q: 'Preciso subir o livro inteiro?', a: 'Pode subir. Mas aponte o intervalo de seções: só ele é lido, e isso derruba o custo do documento em cerca de três vezes.' },
      { q: 'Funciona com PDF escaneado?', a: 'Não. Se o PDF é imagem, não há texto para extrair e a plataforma recusa em vez de inventar conteúdo. Passe um OCR antes.' },
      { q: 'O conteúdo é inventado?', a: 'Todo o material sai do trecho que você subiu. Onde a fonte é ambígua ou falta uma seção, o guia diz isso em vez de preencher o buraco.' },
      { q: 'Quanto tempo demora?', a: 'Alguns minutos por capítulo. A tela mostra em que etapa está — planejando, escrevendo o bloco 2 de 3, renderizando.' },
      { q: 'Posso pedir o mesmo capítulo em outro idioma?', a: 'Pode, e ele é gerado do zero, não traduzido. Consome um crédito novo, pelo mesmo motivo.' },
    ],
  },
  footer: {
    tag: 'Guias de estudo gerados do seu próprio material.',
    built: 'Projeto pessoal de Lex Simoes.',
    rights: 'Todos os direitos reservados.',
  },
  login: {
    title: 'Entrar',
    lede: 'A plataforma está em acesso por convite.',
    email: 'E-mail',
    password: 'Senha',
    submit: 'Entrar',
    working: 'Entrando…',
    failed: 'E-mail ou senha incorretos.',
    throttled: 'Tentativas demais. Espere alguns minutos e tente de novo.',
    back: 'Voltar para a home',
  },
  app: {
    nav: { overview: 'Visão geral', create: 'Novo guia', history: 'Histórico', credits: 'Créditos', logout: 'Sair' },
    greeting: 'Olá',
    overview: {
      title: 'Visão geral',
      balance: 'Créditos disponíveis',
      used: 'Créditos usados',
      docs: 'Documentos gerados',
      pages: 'Páginas geradas',
      recent: 'Documentos recentes',
      seeAll: 'Ver histórico completo',
      empty: 'Nenhum documento ainda. Comece pelo primeiro capítulo.',
      cta: 'Gerar meu primeiro guia',
    },
    create: {
      title: 'Novo guia',
      lede: 'Suba o PDF, aponte o capítulo e escolha o idioma. O resto é com a plataforma.',
      topic: 'Tópico',
      topicPh: 'Convolutional Neural Networks',
      scope: 'Escopo',
      scopePh: 'Capítulo 7, seções 7.1 a 7.6',
      scopeHint: 'Se você citar o intervalo de seções aqui, só ele é lido do PDF — o que deixa o guia mais focado e bem mais barato.',
      language: 'Idioma do conteúdo',
      source: 'De onde vem o conteúdo',
      sourceUpload: 'Do meu material',
      sourceUploadHint: 'Sobe o PDF do livro, apostila ou artigo. Nada além desse trecho é usado.',
      sourceWeb: 'Pesquisar na internet',
      sourceWebHint: 'Sem material em mãos? A plataforma procura fontes confiáveis, lê as páginas e monta o extrato — e lista no fim do documento de onde veio cada coisa.',
      pdf: 'PDF do material',
      cost: 'Custo',
      credit: 'crédito',
      creditsPl: 'créditos',
      submit: 'Gerar guia',
      working: 'Iniciando…',
      insufficient: 'Créditos insuficientes para este documento.',
    },
    history: {
      title: 'Histórico',
      lede: 'Todos os documentos que você gerou.',
      colDoc: 'Documento', colType: 'Tipo', colLang: 'Idioma', colDate: 'Data', colStatus: 'Status', colCost: 'Créditos',
      empty: 'Nada por aqui ainda.',
    },
    credits: {
      title: 'Créditos',
      lede: 'Um crédito é um guia de bolso. Um exam review consome dois. Créditos não expiram.',
      balance: 'Saldo',
      spent: 'Consumido até agora',
      buy: 'Comprar créditos',
      buySoon: 'A compra de créditos ainda não está aberta.',
      ledger: 'Movimentação',
      colWhen: 'Quando', colWhat: 'O quê', colDelta: 'Créditos', colBalance: 'Saldo',
      emptyLedger: 'Nenhuma movimentação ainda.',
      unlimited: 'Ilimitado',
      ownerNote: 'Sua conta é a conta do dono: nada é bloqueado por saldo. O consumo continua sendo medido para você ver exatamente o que um usuário pagante veria.',
    },
    material: {
      back: 'Voltar ao histórico',
      open: 'Abrir o PDF',
      openHtml: 'Baixar o HTML',
      sources: 'Fontes consultadas',
      sourcesLede: 'Este guia foi montado a partir destas páginas.',
      checks: 'Checagens de qualidade',
      checksLede: 'Regras do blueprint que a saída cumpriu ou não.',
      usage: 'Consumo',
      tokensIn: 'Tokens de entrada', tokensOut: 'Tokens de saída', tokensCached: 'Lidos do cache',
      stages: { pending: 'Na fila', researching: 'Pesquisando fontes', extracting: 'Extraindo o texto', planning: 'Planejando os blocos', generating: 'Escrevendo', rendering: 'Renderizando o PDF', validating: 'Validando', done: 'Pronto', failed: 'Falhou' },
    },
  },
  types: { pocket_guide: 'Guia de bolso', exam_review: 'Exam review' },
  languages: { bilingual: 'Bilíngue', en: 'Inglês', pt: 'Português' },
}

export type Dict = typeof pt

const en: Dict = {
  htmlLang: 'en',
  brandTag: 'study guides',
  nav: {
    how: 'How it works',
    anatomy: 'Anatomy',
    method: 'The method',
    pricing: 'Credits',
    login: 'Sign in',
    dashboard: 'Dashboard',
  },
  hero: {
    kicker: 'Study guides built from your own source material',
    title: 'A whole chapter, distilled into a guide you <em>actually</em> reopen.',
    lede:
      'Upload your textbook, point at a chapter, and get a print-ready pocket guide: the intuition in plain language, ' +
      'the technical vocabulary in the language of the field, the formulas right, and the classic traps marked.',
    ctaPrimary: 'Sign in',
    ctaSecondary: 'Look inside a guide',
    note: 'Access is invite-only for now.',
    sampleCaption: 'A real fragment from a generated guide — Regularization, bilingual mode.',
  },
  problem: {
    kicker: 'The problem',
    title: 'Rereading a summary feels great and works badly.',
    p1:
      'On the second read the text feels familiar, and the brain quietly swaps familiarity for mastery. ' +
      'You close the book sure that you know it, and find out in the exam that you recognised it without being able to retrieve it.',
    p2:
      'What the learning evidence actually supports is different: pulling things out of memory (the testing effect) ' +
      'and spreading reviews over time (the spacing effect). A good summary is not the end of studying — it is the reference layer everything else stands on.',
    layersTitle: 'Three layers, three jobs',
    layers: [
      { t: 'Reference', d: 'The pocket guide. Read it once without trying to memorise, and come back to it when you get stuck.' },
      { t: 'Retrieval', d: 'Quiz and flashcards drawn from the guide itself, weighted toward what you got wrong.' },
      { t: 'Spacing', d: "Anki's job, not ours. Its algorithm beats anything we would hand-roll." },
    ],
  },
  how: {
    kicker: 'How it works',
    title: 'Four steps, and you only see one of them.',
    steps: [
      {
        t: 'You point at the chapter',
        d: 'Upload the book — 300 pages, 800, it makes no difference — and give the range: section 7.1 through 7.6. Only that slice is read. The rest of the book is never looked at.',
      },
      {
        t: 'The guide is planned before it is written',
        d: 'First comes a plan: which thematic blocks, how many sections in each, which concept lands where. Then each block is written separately against that plan. That is what stops a twenty-page document from drifting halfway through.',
      },
      {
        t: 'Twelve automatic checks',
        d: 'Does every section open with an analogy? Is any intuition box smuggling in a formula? Are the theory boxes teaching, or just restating the answer? Every rule in the blueprint becomes a mechanical check, and the result ships next to the guide.',
      },
      {
        t: 'An A4 PDF comes out',
        d: 'Formulas properly rendered, page breaks controlled, ready to print and scribble on. Not a screen you scroll — paper.',
      },
    ],
  },
  anatomy: {
    kicker: 'Anatomy of a guide',
    title: 'Every box earns its place.',
    lede:
      'The format is not decorative. It is a written specification with a usage rule for each element, and meeting that specification is the generator’s actual job.',
    labels: {
      bar: 'Thematic block',
      barD: 'Groups sections by subject. Two to four per document.',
      intuition: 'Intuition',
      intuitionD: 'Opens every section, before anything technical. Always a concrete analogy, never a formula, two to four sentences.',
      tech: 'Technical content',
      techD: 'Definitions, notation and formulas in the language of the literature. This is what you will meet again in the paper.',
      deepdive: 'Deep dive',
      deepdiveD: 'Only for the concepts that genuinely stick. Overused, the box stops meaning anything, so it has a ceiling: at most one every two sections.',
      link: 'Cross-module link',
      linkD: 'Ridge in statistics is weight decay in deep learning. Seeing that they are one mechanism halves the studying.',
    },
  },
  langs: {
    kicker: 'Language',
    title: 'Three modes. None of them is a translation.',
    lede:
      'An analogy is born in a language, not translated into one. Asking for the same chapter in another language regenerates it from the source: more tokens, and the only version that works.',
    modes: [
      { n: 'Bilingual', d: 'Headings, technical terms, definitions and formulas in English. Intuition, deep dives and traps in your own language. This is the reference format.', tag: 'default' },
      { n: '100% English', d: 'Everything in English, analogies included. Not one word of the other language survives.', tag: '' },
      { n: '100% Portuguese', d: 'Everything in Portuguese. The canonical English term appears once in parentheses at first mention, then never again.', tag: '' },
    ],
  },
  method: {
    kicker: 'The method',
    title: 'The tool is one piece. The loop is what works.',
    steps: [
      { t: 'Generate the guide', d: 'Read it once, end to end, without trying to memorise anything.' },
      { t: 'Close it and answer', d: 'A retrieval quiz, from memory. Note where you stalled.' },
      { t: 'Turn gaps into cards', d: 'Flashcards pulled from the guide, weighted toward what you missed.' },
      { t: 'Let Anki do the spacing', d: 'Spaced repetition is its job. We export and get out of the way.' },
      { t: 'Build something', d: 'Once the concepts pile up, stop summarising and make something with them.' },
    ],
    soonTitle: 'Under construction',
    soon: 'Pocket guides and exam reviews work today. Flashcards with Anki export and the in-app quiz are next, and you can see what is ready and what is not without having to guess.',
  },
  pricing: {
    kicker: 'Credits',
    title: 'You pay per document, not per month.',
    lede: 'One credit is one pocket guide. A full exam review costs two, because it is twice the document. Credits do not expire.',
    packs: [
      { n: 'Single', c: '4 credits', p: 'USD 9', d: 'Enough to try it on one chapter before deciding.', best: '' },
      { n: 'Semester', c: '20 credits', p: 'USD 39', d: 'A chapter a week for a whole semester.', best: 'most picked' },
      { n: 'Course', c: '60 credits', p: 'USD 99', d: 'A full course, in all three modes, with room to spare.', best: '' },
    ],
    note: 'Indicative pricing. The platform is invite-only and credit sales are not open yet.',
  },
  faq: {
    kicker: 'Questions',
    title: 'What people ask.',
    items: [
      { q: 'Do I have to upload the whole book?', a: 'You can. But give the section range: only that slice is read, and it cuts the cost of a document by roughly three times.' },
      { q: 'Does it work with scanned PDFs?', a: 'No. If the PDF is images there is no text to extract, and the platform refuses rather than inventing content. Run OCR first.' },
      { q: 'Is the content made up?', a: 'Everything comes from the slice you uploaded. Where the source is ambiguous or a section is missing, the guide says so instead of filling the hole.' },
      { q: 'How long does it take?', a: 'A few minutes per chapter. The screen shows the stage: planning, writing block 2 of 3, rendering.' },
      { q: 'Can I get the same chapter in another language?', a: 'Yes, and it is generated from scratch rather than translated. It costs a new credit, for the same reason.' },
    ],
  },
  footer: {
    tag: 'Study guides built from your own source material.',
    built: 'A personal project by Lex Simoes.',
    rights: 'All rights reserved.',
  },
  login: {
    title: 'Sign in',
    lede: 'The platform is invite-only.',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    working: 'Signing in…',
    failed: 'Wrong email or password.',
    throttled: 'Too many attempts. Wait a few minutes and try again.',
    back: 'Back to the home page',
  },
  app: {
    nav: { overview: 'Overview', create: 'New guide', history: 'History', credits: 'Credits', logout: 'Sign out' },
    greeting: 'Hello',
    overview: {
      title: 'Overview',
      balance: 'Credits available',
      used: 'Credits used',
      docs: 'Documents generated',
      pages: 'Pages generated',
      recent: 'Recent documents',
      seeAll: 'See the full history',
      empty: 'No documents yet. Start with the first chapter.',
      cta: 'Generate my first guide',
    },
    create: {
      title: 'New guide',
      lede: 'Upload the PDF, point at the chapter, pick the language. The rest is on us.',
      topic: 'Topic',
      topicPh: 'Convolutional Neural Networks',
      scope: 'Scope',
      scopePh: 'Chapter 7, sections 7.1 to 7.6',
      scopeHint: 'Name the section range here and only that slice is read from the PDF — a tighter guide, and a much cheaper one.',
      language: 'Content language',
      source: 'Where the content comes from',
      sourceUpload: 'From my own material',
      sourceUploadHint: 'Upload the book, handout or paper. Nothing outside that slice is used.',
      sourceWeb: 'Research the web',
      sourceWebHint: 'No material at hand? The platform finds authoritative sources, reads the pages and builds the extract — and lists at the end of the document where each thing came from.',
      pdf: 'Source PDF',
      cost: 'Cost',
      credit: 'credit',
      creditsPl: 'credits',
      submit: 'Generate the guide',
      working: 'Starting…',
      insufficient: 'Not enough credits for this document.',
    },
    history: {
      title: 'History',
      lede: 'Every document you have generated.',
      colDoc: 'Document', colType: 'Type', colLang: 'Language', colDate: 'Date', colStatus: 'Status', colCost: 'Credits',
      empty: 'Nothing here yet.',
    },
    credits: {
      title: 'Credits',
      lede: 'One credit is one pocket guide. An exam review costs two. Credits do not expire.',
      balance: 'Balance',
      spent: 'Spent so far',
      buy: 'Buy credits',
      buySoon: 'Credit purchases are not open yet.',
      ledger: 'Activity',
      colWhen: 'When', colWhat: 'What', colDelta: 'Credits', colBalance: 'Balance',
      emptyLedger: 'No activity yet.',
      unlimited: 'Unlimited',
      ownerNote: 'This is the owner account: nothing is blocked by balance. Consumption is still metered so you see exactly what a paying user would see.',
    },
    material: {
      back: 'Back to history',
      open: 'Open the PDF',
      openHtml: 'Download the HTML',
      sources: 'Sources consulted',
      sourcesLede: 'This guide was assembled from these pages.',
      checks: 'Quality checks',
      checksLede: 'Blueprint rules the output either met or missed.',
      usage: 'Usage',
      tokensIn: 'Input tokens', tokensOut: 'Output tokens', tokensCached: 'Read from cache',
      stages: { pending: 'Queued', researching: 'Researching sources', extracting: 'Extracting the text', planning: 'Planning the blocks', generating: 'Writing', rendering: 'Rendering the PDF', validating: 'Validating', done: 'Ready', failed: 'Failed' },
    },
  },
  types: { pocket_guide: 'Pocket guide', exam_review: 'Exam review' },
  languages: { bilingual: 'Bilingual', en: 'English', pt: 'Portuguese' },
}

const dictionaries: Record<Locale, Dict> = { pt, en }

export const dict = (locale: Locale): Dict => dictionaries[locale]

/** Server components: `const { t, locale } = await tr()`. */
export async function tr() {
  const locale = await getLocale()
  return { locale, t: dict(locale) }
}

import type { SiteContent } from "./types";

/** All copy in Portuguese (pt-BR) — the default locale, served at `/`. */
export const ptBR: SiteContent = {
  meta: {
    title: "ID42 Studio — Agentes de IA que entram no expediente",
    description:
      "Agentes, automações e integrações que assumem o trabalho repetitivo da sua operação — conectados ao CRM, ERP e WhatsApp que você já usa.",
    ogLocale: "pt_BR",
  },
  nav: {
    links: [
      { label: "Diagnóstico", href: "#diagnostico" },
      { label: "Soluções", href: "#solucoes" },
      { label: "Processo", href: "#processo" },
      { label: "Em produção", href: "#produtos" },
      { label: "Estúdio", href: "#estudio" },
    ],
    cta: "Falar com a ID42",
  },
  hero: {
    eyebrow: "Estúdio de IA aplicada",
    titleLines: ["Agentes de IA", "que entram", "no expediente."],
    accentLine: 2,
    subtitle:
      "Projetamos agentes, automações e integrações que assumem o trabalho repetitivo da sua operação. Conectados ao CRM, ao ERP e ao WhatsApp que você já usa — com processo, dados e gente no controle.",
    primaryCta: "Quero automatizar",
    secondaryCta: "Ver o que construímos",
    proofLabel: "Em produção",
    proof: ["VBSell", "BuilderMonitor", "Deepze"],
    trace: {
      title: "agent.run",
      status: "ao vivo",
      steps: [
        { label: "Mensagem recebida", detail: "WhatsApp Business" },
        { label: "Contexto recuperado", detail: "base de conhecimento" },
        { label: "Lead qualificado", detail: "critério + intenção" },
        { label: "CRM atualizado", detail: "Odoo" },
        { label: "Reunião proposta", detail: "agenda do time" },
      ],
      footer: "5 sistemas · 1 processo",
      caption:
        "Ilustração de um fluxo de atendimento automatizado: da mensagem recebida ao registro no CRM.",
    },
  },
  marquee: {
    label: "Conectamos o que você já usa",
    items: [
      "CRM",
      "ERP",
      "Odoo",
      "WhatsApp",
      "E-mail",
      "APIs internas",
      "PostgreSQL",
      "Planilhas",
      "Sistemas legados",
      "LLMs",
      "Webhooks",
      "S3",
    ],
  },
  problem: {
    index: "01",
    eyebrow: "O diagnóstico",
    title: "O gargalo quase nunca é a ferramenta.",
    text: "Sua empresa já tem CRM, ERP, WhatsApp, planilhas e e-mail. O que falta é o processo que liga tudo isso — e algo responsável por fazer o meio do caminho acontecer, sem depender de alguém lembrar.",
    items: [
      {
        n: "01",
        title: "Lead esperando resposta",
        text: "A oportunidade esfria no intervalo entre o formulário, a mensagem e o primeiro contato.",
      },
      {
        n: "02",
        title: "CRM pela metade",
        text: "O registro chega tarde, incompleto, ou não chega. Sem dado confiável, não existe decisão.",
      },
      {
        n: "03",
        title: "Atendimento sem padrão",
        text: "Cada pessoa responde de um jeito. O cliente sente a diferença; a operação não aprende.",
      },
      {
        n: "04",
        title: "Processo morando na planilha",
        text: "Rotinas críticas dependem de um arquivo e de quem sabe onde ele está.",
      },
      {
        n: "05",
        title: "Contexto espalhado",
        text: "A informação existe — em threads, PDFs, e-mails e na cabeça de uma pessoa só.",
      },
      {
        n: "06",
        title: "Trabalho repetitivo",
        text: "Horas por semana em tarefas que não exigem julgamento humano — e nunca vão exigir.",
      },
    ],
  },
  solutions: {
    index: "02",
    eyebrow: "O que construímos",
    title: "Cinco frentes. Um princípio: processo antes de IA.",
    subtitle:
      "Cada frente resolve um tipo de gargalo — e todas conversam com os sistemas que sua empresa já usa.",
    items: [
      {
        title: "Agentes de vendas",
        text: "Atendem no WhatsApp em segundos, qualificam com critério, agendam reunião e registram tudo no CRM.",
        tags: ["WhatsApp", "CRM", "Follow-up"],
      },
      {
        title: "Automação de fluxos",
        text: "Ligam CRM, ERP, e-mail, planilhas e APIs em processos que rodam sem intervenção humana no meio.",
        tags: ["Integrações", "Webhooks", "Rotinas"],
      },
      {
        title: "Copilotos de conhecimento",
        text: "Respondem com base nos documentos, contratos e processos da própria empresa — e mostram a fonte.",
        tags: ["RAG", "Documentos", "LGPD"],
      },
      {
        title: "Integração de sistemas",
        text: "Fazem ERP, CRM, atendimento e sistemas internos falarem a mesma língua, com dado consistente.",
        tags: ["Odoo", "APIs", "Dados"],
      },
      {
        title: "Produtos digitais",
        text: "Do MVP ao micro-SaaS: tiramos o produto do slide e colocamos em produção, com alguém operando.",
        tags: ["MVP", "SaaS", "Operação"],
      },
    ],
  },
  process: {
    index: "03",
    eyebrow: "Como atuamos",
    title: "Do diagnóstico ao plantão.",
    subtitle:
      "Cinco etapas, nenhuma caixa-preta. Você acompanha o agente sendo construído e avaliado com dados reais.",
    steps: [
      {
        n: "01",
        title: "Diagnóstico",
        text: "Mapeamos o processo atual, os gargalos reais e o que não vale a pena automatizar.",
      },
      {
        n: "02",
        title: "Arquitetura",
        text: "Desenhamos o fluxo entre pessoas, sistemas e agentes. Cada decisão fica registrada.",
      },
      {
        n: "03",
        title: "Construção",
        text: "Agentes, integrações, automações e interface. Entregas curtas e revisáveis.",
      },
      {
        n: "04",
        title: "Validação",
        text: "Rodamos com dados reais, medimos acerto e ajustamos comportamento antes de escalar.",
      },
      {
        n: "05",
        title: "Operação",
        text: "Monitoramento, evolução de prompts e fluxos, e métricas de resultado no dia a dia.",
      },
    ],
  },
  useCases: {
    index: "04",
    eyebrow: "Onde começa",
    title: "O trabalho que ninguém deveria estar fazendo.",
    subtitle:
      "Exemplos de operações que ganham velocidade, padrão e rastreabilidade sem trocar o sistema de gestão.",
    groups: [
      {
        icon: "sales",
        title: "Vendas B2B",
        items: [
          "Responder em segundos",
          "Qualificar com critério",
          "Registrar no CRM",
          "Agendar reunião",
          "Resumir para o vendedor",
        ],
      },
      {
        icon: "support",
        title: "Atendimento",
        items: [
          "Responder dúvidas frequentes",
          "Consultar a base interna",
          "Abrir e rotear tickets",
          "Escalar para humano",
          "Manter o histórico",
        ],
      },
      {
        icon: "ops",
        title: "Operação",
        items: [
          "Ler e classificar e-mails",
          "Extrair dados de documentos",
          "Criar e distribuir tarefas",
          "Atualizar sistemas",
          "Notificar responsáveis",
        ],
      },
      {
        icon: "finance",
        title: "Backoffice",
        items: [
          "Organizar documentos",
          "Apoiar conciliações",
          "Conferir informações",
          "Automatizar rotinas",
          "Reduzir retrabalho",
        ],
      },
    ],
  },
  cases: {
    index: "05",
    eyebrow: "Em produção",
    title: "Não é portfólio. É produção.",
    subtitle:
      "Produtos e plataformas que construímos e operamos — com usuários reais e problemas concretos para resolver.",
    items: [
      {
        name: "VBSell",
        monogram: "VB",
        category: "Agentes de IA · Vendas",
        description:
          "Agentes de vendas no WhatsApp que atendem, qualificam, fazem follow-up e registram no CRM. Venda B2B sem lead esquecido.",
        url: "https://vbsell.com",
        linkLabel: "vbsell.com",
        accent: "blue",
      },
      {
        name: "BuilderMonitor",
        monogram: "BM",
        category: "SaaS · Construção civil",
        description:
          "Radar operacional e executivo de obras: risco de portfólio, cronograma, custo e campo numa camada acima do ERP — sem substituí-lo.",
        url: "https://buildermonitor.cloud.escodoo.com",
        linkLabel: "buildermonitor",
        accent: "cyan",
      },
      {
        name: "Deepze",
        monogram: "DZ",
        category: "Plataforma de IA · Privada",
        description:
          "IA empresarial privada: chat e copilotos sobre a base de conhecimento da empresa (RAG), com dados na sua infraestrutura e conformidade LGPD.",
        url: "https://deepze.ai",
        linkLabel: "deepze.ai",
        accent: "violet",
      },
    ],
    note: "Todos em produção. Nenhum mockup.",
  },
  about: {
    index: "06",
    eyebrow: "Quem está por trás",
    title: "Vinte e cinco anos de operação. Zero mágica.",
    paragraphs: [
      "A ID42 Studio nasce da prática em implantação de sistemas empresariais, ERP, automação de processos e desenvolvimento de software — e da convicção de que IA só gera valor quando encontra a operação como ela realmente é.",
      "Somos contribuidores ativos do ecossistema Odoo e OCA, com produtos próprios rodando e clientes que dependem deles todos os dias.",
    ],
    quote: "Não vendemos IA como mágica. Construímos sistemas que trabalham.",
    expertiseLabel: "Especialidades",
    expertise: [
      "Odoo & ERP",
      "Automação comercial",
      "Integração de sistemas",
      "Agentes de IA",
      "Produtos SaaS",
    ],
    stats: [
      { value: "25+", label: "anos em sistemas de gestão" },
      { value: "3", label: "produtos próprios em produção" },
      { value: "OCA", label: "contribuição ativa no ecossistema" },
    ],
  },
  cta: {
    title: "Vamos colocar sua operação para trabalhar?",
    text: "Conte qual processo mais consome tempo da sua equipe hoje. A gente responde com o que dá para automatizar, o que não dá — e por quê.",
    button: "contato@id42.studio",
    secondary: "Conversar no LinkedIn",
    note: "Resposta de uma pessoa, não de um formulário.",
    emailSubject: "Quero automatizar um processo — ID42 Studio",
    emailBody:
      "Olá, ID42! O processo que mais consome tempo da nossa equipe hoje é: ",
  },
  footer: {
    tagline: "Agentes de IA, automação e sistemas inteligentes.",
    navTitle: "Navegação",
    contactTitle: "Contato",
    rights: "Todos os direitos reservados.",
    madeIn: "Feito no Brasil.",
    backToTop: "Voltar ao topo",
  },
  a11y: {
    skip: "Ir para o conteúdo",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
    language: "Idioma",
    mainNav: "Navegação principal",
    mobileNav: "Navegação do menu",
    menu: "Menu",
    decorativeTrace:
      "Ilustração de um fluxo automatizado: mensagem recebida, contexto recuperado, lead qualificado, CRM atualizado e reunião proposta.",
  },
};

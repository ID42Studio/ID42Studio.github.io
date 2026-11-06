import type { SiteContent } from "./types";

/** All copy in English — served under `/en/`. */
export const en: SiteContent = {
  meta: {
    title: "ID42 Studio — AI agents that clock in",
    description:
      "An applied-AI studio: we design agents, automations and integrations that take over the repetitive work of your operation — wired into the CRM, ERP and WhatsApp you already run.",
    ogLocale: "en_US",
  },
  nav: {
    links: [
      { label: "Diagnosis", href: "#diagnostico" },
      { label: "What we build", href: "#solucoes" },
      { label: "Process", href: "#processo" },
      { label: "In production", href: "#produtos" },
      { label: "Studio", href: "#estudio" },
    ],
    cta: "Talk to ID42",
  },
  hero: {
    eyebrow: "Applied AI studio",
    titleLines: ["AI agents", "that clock in", "with your team."],
    accentLine: 2,
    subtitle:
      "We design agents, automations and integrations that take over the repetitive work of your operation. Wired into the CRM, ERP and WhatsApp you already use — with process, data and people in control.",
    primaryCta: "Automate my operation",
    secondaryCta: "See what we ship",
    proofLabel: "In production",
    proof: ["VBSell", "BuilderMonitor", "Deepze"],
    trace: {
      title: "agent.run",
      status: "live",
      steps: [
        { label: "Message received", detail: "WhatsApp Business" },
        { label: "Context retrieved", detail: "knowledge base" },
        { label: "Lead qualified", detail: "criteria + intent" },
        { label: "CRM updated", detail: "Odoo" },
        { label: "Meeting proposed", detail: "team calendar" },
      ],
      footer: "5 systems · 1 process",
      caption:
        "Illustration of an automated sales flow: from the incoming message to the CRM record.",
    },
  },
  marquee: {
    label: "We connect what you already run",
    items: [
      "CRM",
      "ERP",
      "Odoo",
      "WhatsApp",
      "Email",
      "Internal APIs",
      "PostgreSQL",
      "Spreadsheets",
      "n8n",
      "LLMs",
      "Webhooks",
      "S3",
    ],
  },
  problem: {
    index: "01",
    eyebrow: "The diagnosis",
    title: "The bottleneck is almost never the tool.",
    text: "Your company already runs a CRM, an ERP, WhatsApp, spreadsheets and email. What is missing is the process that connects them — and something responsible for making the handoffs happen, without depending on someone remembering.",
    items: [
      {
        n: "01",
        title: "Leads left waiting",
        text: "The opportunity cools down in the gap between the form, the message and the first reply.",
      },
      {
        n: "02",
        title: "Half-filled CRM",
        text: "Records arrive late, incomplete, or not at all. Without reliable data, there is no decision.",
      },
      {
        n: "03",
        title: "Inconsistent service",
        text: "Everyone answers differently. Customers feel it; the operation never learns from it.",
      },
      {
        n: "04",
        title: "Process living in a spreadsheet",
        text: "Critical routines depend on one file and on whoever knows where that file is.",
      },
      {
        n: "05",
        title: "Scattered context",
        text: "The information exists — in threads, PDFs, emails and in exactly one person's head.",
      },
      {
        n: "06",
        title: "Repetitive work",
        text: "Hours per week spent on tasks that require no human judgement — and never will.",
      },
    ],
  },
  solutions: {
    index: "02",
    eyebrow: "What we build",
    title: "Five practices. One principle: process before AI.",
    subtitle:
      "Each practice solves a different kind of bottleneck — and all of them speak to the systems you already run.",
    items: [
      {
        title: "Sales agents",
        text: "They answer on WhatsApp in seconds, qualify on real criteria, book the meeting and log everything in the CRM.",
        tags: ["WhatsApp", "CRM", "Follow-up"],
      },
      {
        title: "Workflow automation",
        text: "They connect CRM, ERP, email, spreadsheets and APIs into processes that run without a human in the middle.",
        tags: ["Integrations", "Webhooks", "Routines"],
      },
      {
        title: "Knowledge copilots",
        text: "They answer from your own documents, contracts and processes — and show the source.",
        tags: ["RAG", "Documents", "Privacy"],
      },
      {
        title: "Systems integration",
        text: "They make ERP, CRM, support and internal systems speak the same language, with consistent data.",
        tags: ["Odoo", "APIs", "Data"],
      },
      {
        title: "Digital products",
        text: "From MVP to micro-SaaS: we take the product off the slide and put it in production, with someone running it.",
        tags: ["MVP", "SaaS", "Operations"],
      },
    ],
  },
  process: {
    index: "03",
    eyebrow: "How we work",
    title: "From diagnosis to on-call.",
    subtitle:
      "Five stages, no black box. You follow the agent being built and evaluated against real data.",
    steps: [
      {
        n: "01",
        title: "Diagnosis",
        text: "We map the current process, the real bottlenecks and what is not worth automating.",
      },
      {
        n: "02",
        title: "Architecture",
        text: "We design the flow between people, systems and agents. Every decision is recorded.",
      },
      {
        n: "03",
        title: "Build",
        text: "Agents, integrations, automations and interface. Short, reviewable increments.",
      },
      {
        n: "04",
        title: "Validation",
        text: "We run it on real data, measure accuracy and tune behaviour before scaling.",
      },
      {
        n: "05",
        title: "Operations",
        text: "Monitoring, prompt and workflow evolution, and outcome metrics in the day-to-day.",
      },
    ],
  },
  useCases: {
    index: "04",
    eyebrow: "Where it starts",
    title: "The work no one should be doing.",
    subtitle:
      "Examples of operations that gain speed, consistency and traceability without replacing the management system.",
    groups: [
      {
        icon: "sales",
        title: "B2B sales",
        items: [
          "Reply within seconds",
          "Qualify on criteria",
          "Log into the CRM",
          "Book the meeting",
          "Brief the rep",
        ],
      },
      {
        icon: "support",
        title: "Customer support",
        items: [
          "Answer common questions",
          "Query the internal base",
          "Open and route tickets",
          "Escalate to a human",
          "Keep the history",
        ],
      },
      {
        icon: "ops",
        title: "Operations",
        items: [
          "Read and triage email",
          "Extract data from documents",
          "Create and assign tasks",
          "Update systems",
          "Notify owners",
        ],
      },
      {
        icon: "finance",
        title: "Back office",
        items: [
          "Organise documents",
          "Support reconciliations",
          "Cross-check information",
          "Automate routines",
          "Cut rework",
        ],
      },
    ],
  },
  cases: {
    index: "05",
    eyebrow: "In production",
    title: "Not a portfolio. Production.",
    subtitle:
      "Products and platforms we built and operate — with real users and concrete problems to solve.",
    items: [
      {
        name: "VBSell",
        monogram: "VB",
        category: "AI agents · Sales",
        description:
          "WhatsApp sales agents that answer, qualify, follow up and log everything into the CRM. B2B sales with no lead left behind.",
        url: "https://vbsell.com",
        linkLabel: "vbsell.com",
        accent: "blue",
      },
      {
        name: "BuilderMonitor",
        monogram: "BM",
        category: "SaaS · Construction",
        description:
          "Operational and executive radar for construction sites: portfolio risk, schedule, cost and field data in a layer above the ERP — without replacing it.",
        url: "https://buildermonitor.cloud.escodoo.com",
        linkLabel: "buildermonitor",
        accent: "cyan",
      },
      {
        name: "Deepze",
        monogram: "DZ",
        category: "AI platform · Private",
        description:
          "Private enterprise AI: chat and copilots over your own knowledge base (RAG), with data on your infrastructure and LGPD compliance.",
        url: "https://deepze.ai",
        linkLabel: "deepze.ai",
        accent: "violet",
      },
    ],
    note: "All in production. No mockups.",
  },
  about: {
    index: "06",
    eyebrow: "Who is behind it",
    title: "Twenty-five years of operations. Zero magic.",
    paragraphs: [
      "ID42 Studio comes from hands-on work implementing business systems, ERPs, process automation and software — and from the conviction that AI only creates value when it meets the operation as it really is.",
      "We are active contributors to the Odoo and OCA ecosystem, with our own products running and customers who depend on them every day.",
    ],
    quote: "We don't sell AI as magic. We build systems that work.",
    expertiseLabel: "Expertise",
    expertise: [
      "Odoo & ERP",
      "Sales automation",
      "Systems integration",
      "AI agents",
      "SaaS products",
    ],
    stats: [
      { value: "25+", label: "years in business systems" },
      { value: "3", label: "own products in production" },
      { value: "OCA", label: "active ecosystem contribution" },
    ],
  },
  cta: {
    title: "Shall we put your operation to work?",
    text: "Tell us which process eats the most time in your team today. We will answer with what can be automated, what cannot — and why.",
    button: "contato@id42.studio",
    secondary: "Talk on LinkedIn",
    note: "A person answers, not a form.",
    emailSubject: "I want to automate a process — ID42 Studio",
    emailBody:
      "Hi, ID42! The process that takes the most time in our team today is: ",
  },
  footer: {
    tagline: "AI agents, automation and intelligent systems.",
    navTitle: "Navigation",
    contactTitle: "Contact",
    rights: "All rights reserved.",
    madeIn: "Built in Brazil.",
  },
  a11y: {
    skip: "Skip to content",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    language: "Language",
    decorativeTrace:
      "Illustration of an automated flow: message received, context retrieved, lead qualified, CRM updated and meeting proposed.",
  },
};

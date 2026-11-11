import type { Locale } from "../i18n";

export const MODEL_KEYS = ["build", "operate", "outcome"] as const;
export const DOMAIN_KEYS = ["sales", "finance", "support", "enterprise", "generic"] as const;

export type ModelKey = (typeof MODEL_KEYS)[number];
export type DomainKey = (typeof DOMAIN_KEYS)[number];

export interface StepTemplate {
  label: string;
  detail: string;
}

export interface ModelData {
  cues: string[];
  steps: StepTemplate[];
  result: string;
}

export interface DomainData {
  cues: string[];
  /** Grammatical noun phrases used to fill the step templates. */
  noun: string;
  batch: string;
  signal: string;
  artifact: string;
  outcome: string;
}

export interface LangData {
  models: Record<ModelKey, ModelData>;
  domains: Record<DomainKey, DomainData>;
}

/**
 * Language data for the local classifier.
 *
 * Kept out of `src/i18n` on purpose: this is linguistic data shipped to the
 * browser (the classifier runs client-side), not page copy. Both locales are
 * typed here so a missing language is a compile error.
 */
export const PLAYGROUND: Record<Locale, LangData> = {
  "pt-BR": {
    models: {
      build: {
        cues: [
          "criar",
          "construir",
          "desenvolver",
          "do zero",
          "novo sistema",
          "nova plataforma",
          "mvp",
          "aplicativo",
          "aplicação",
          "api",
          "migrar",
          "modernizar",
          "reescrever",
          "integrar",
          "automatizar",
          "automação",
          "automaticamente",
          "agente",
          "robô",
          "bot",
          "responder",
          "responde",
        ],
        steps: [
          { label: "Entender {{noun}}", detail: "escopo, regras e critérios de aceite" },
          { label: "Arquitetar {{artifact}}", detail: "limites, integrações e dados" },
          { label: "Construir {{artifact}}", detail: "entregas incrementais e revisáveis" },
          { label: "Validar comportamento", detail: "testes com dados reais" },
          { label: "Colocar em produção", detail: "operação e monitoramento" },
        ],
        result:
          "Pronto para produção: {{artifact}} com arquitetura documentada e critérios de aceite verificados.",
      },
      operate: {
        cues: [
          "monitorar",
          "manter",
          "operar",
          "operação",
          "incidente",
          "alerta",
          "sla",
          "24/7",
          "plantão",
          "logs",
          "observabilidade",
          "disponibilidade",
          "suporte técnico",
          "sustentação",
        ],
        steps: [
          { label: "Detectar {{signal}}", detail: "métrica, alerta ou chamado" },
          { label: "Correlacionar contexto", detail: "logs, histórico e mudanças" },
          { label: "Executar ação autorizada", detail: "runbook com limites definidos" },
          { label: "Verificar efeito", detail: "indicador volta à faixa esperada" },
          { label: "Registrar e encerrar", detail: "trilha de auditoria" },
        ],
        result:
          "Operação estabilizada, com registro do que foi detectado, feito e verificado.",
      },
      outcome: {
        cues: [
          "por resultado",
          "por entrega",
          "por lote",
          "lote",
          "fila",
          "processar",
          "conferir",
          "conciliação",
          "quantidade",
          "por nota",
          "unidade de trabalho",
          "amostragem",
          "volume",
          "em massa",
          "check",
          "checking",
        ],
        steps: [
          { label: "Receber {{batch}}", detail: "fila com critério de entrada" },
          { label: "Aplicar regra de negócio", detail: "critérios objetivos de aceite" },
          { label: "Executar o trabalho", detail: "etapas autorizadas" },
          { label: "Conferir resultado", detail: "amostragem e exceções" },
          { label: "Contabilizar entrega", detail: "unidade concluída" },
        ],
        result: "Resultado verificável: {{outcome}}.",
      },
    },
    domains: {
      sales: {
        cues: [
          "lead",
          "vendas",
          "venda",
          "crm",
          "whatsapp",
          "funil",
          "qualificação",
          "proposta",
          "orçamento",
          "comercial",
          "cliente potencial",
          "oportunidade",
        ],
        noun: "a operação comercial",
        batch: "a fila de leads",
        signal: "o lead parado",
        artifact: "o agente de qualificação",
        outcome: "oportunidade qualificada com contexto registrado",
      },
      finance: {
        cues: [
          "nota fiscal",
          "notas fiscais",
          "nf-e",
          "nfe",
          "boleto",
          "conciliação",
          "pagamento",
          "financeiro",
          "cobrança",
          "xml",
          "contas a pagar",
          "fiscal",
          "lançamento",
        ],
        noun: "a rotina financeira",
        batch: "a fila de documentos",
        signal: "a divergência de conciliação",
        artifact: "o fluxo de conferência",
        outcome: "documento validado e pronto para aprovação",
      },
      support: {
        cues: [
          "atendimento",
          "ticket",
          "tickets",
          "suporte",
          "chamado",
          "dúvida",
          "reclamação",
          "help desk",
          "cliente",
          "fila de atendimento",
        ],
        noun: "o atendimento",
        batch: "a fila de tickets",
        signal: "o ticket reincidente",
        artifact: "o copiloto de atendimento",
        outcome: "solicitação resolvida ou encaminhada com o caso registrado",
      },
      enterprise: {
        cues: [
          "erp",
          "odoo",
          "estoque",
          "pedido",
          "pedidos",
          "integração",
          "sincronização",
          "planilha",
          "planilhas",
          "banco de dados",
          "relatório",
          "sistema interno",
          "cadastro",
        ],
        noun: "a integração entre sistemas",
        batch: "a fila de sincronização",
        signal: "a falha de sincronização",
        artifact: "o conector",
        outcome: "fluxo concluído e validado entre os sistemas",
      },
      generic: {
        cues: [],
        noun: "o processo",
        batch: "a fila de trabalho",
        signal: "o desvio do processo",
        artifact: "a automação",
        outcome: "trabalho concluído com trilha de execução",
      },
    },
  },

  en: {
    models: {
      build: {
        cues: [
          "build",
          "create",
          "develop",
          "from scratch",
          "new system",
          "new platform",
          "mvp",
          "app",
          "application",
          "api",
          "migrate",
          "modernise",
          "modernize",
          "rewrite",
          "integrate",
          "automate",
          "automation",
          "automatically",
          "agent",
          "bot",
          "answer",
          "respond",
        ],
        steps: [
          { label: "Understand {{noun}}", detail: "scope, rules and acceptance criteria" },
          { label: "Architect {{artifact}}", detail: "boundaries, integrations and data" },
          { label: "Build {{artifact}}", detail: "incremental, reviewable delivery" },
          { label: "Validate behaviour", detail: "tests against real data" },
          { label: "Ship to production", detail: "operations and monitoring" },
        ],
        result:
          "Ready for production: {{artifact}} with documented architecture and verified acceptance criteria.",
      },
      operate: {
        cues: [
          "monitor",
          "maintain",
          "operate",
          "operations",
          "incident",
          "alert",
          "sla",
          "24/7",
          "on-call",
          "logs",
          "observability",
          "uptime",
          "technical support",
          "runbook",
        ],
        steps: [
          { label: "Detect {{signal}}", detail: "metric, alert or ticket" },
          { label: "Correlate context", detail: "logs, history and recent changes" },
          { label: "Run the authorised action", detail: "runbook with defined limits" },
          { label: "Verify the effect", detail: "metric back inside the expected range" },
          { label: "Record and close", detail: "audit trail" },
        ],
        result: "Operation stabilised, with a record of what was detected, done and verified.",
      },
      outcome: {
        cues: [
          "per outcome",
          "per delivery",
          "per batch",
          "batch",
          "queue",
          "process",
          "reconcile",
          "reconciliation",
          "volume",
          "per document",
          "unit of work",
          "sampling",
          "at scale",
          "bulk",
          "check",
          "checking",
        ],
        steps: [
          { label: "Receive {{batch}}", detail: "queue with an entry criterion" },
          { label: "Apply the business rule", detail: "objective acceptance criteria" },
          { label: "Execute the work", detail: "authorised steps" },
          { label: "Check the result", detail: "sampling and exceptions" },
          { label: "Count the delivery", detail: "completed unit" },
        ],
        result: "Verifiable outcome: {{outcome}}.",
      },
    },
    domains: {
      sales: {
        cues: [
          "lead",
          "leads",
          "sales",
          "crm",
          "whatsapp",
          "pipeline",
          "qualification",
          "proposal",
          "quote",
          "commercial",
          "opportunity",
        ],
        noun: "the sales operation",
        batch: "the lead queue",
        signal: "the stalled lead",
        artifact: "the qualification agent",
        outcome: "qualified opportunity with context on record",
      },
      finance: {
        cues: [
          "invoice",
          "invoices",
          "billing",
          "reconciliation",
          "payment",
          "finance",
          "financial",
          "collection",
          "xml",
          "accounts payable",
          "ledger",
          "tax",
        ],
        noun: "the finance routine",
        batch: "the document queue",
        signal: "the reconciliation mismatch",
        artifact: "the checking workflow",
        outcome: "document validated and ready for approval",
      },
      support: {
        cues: [
          "support",
          "ticket",
          "tickets",
          "helpdesk",
          "help desk",
          "complaint",
          "question",
          "customer",
          "service desk",
          "queue of tickets",
        ],
        noun: "customer support",
        batch: "the ticket queue",
        signal: "the recurring ticket",
        artifact: "the support copilot",
        outcome: "request resolved or routed with the case on record",
      },
      enterprise: {
        cues: [
          "erp",
          "odoo",
          "inventory",
          "order",
          "orders",
          "integration",
          "synchronisation",
          "synchronization",
          "spreadsheet",
          "spreadsheets",
          "database",
          "report",
          "internal system",
          "master data",
        ],
        noun: "the integration between systems",
        batch: "the synchronisation queue",
        signal: "the synchronisation failure",
        artifact: "the connector",
        outcome: "flow completed and validated across systems",
      },
      generic: {
        cues: [],
        noun: "the process",
        batch: "the work queue",
        signal: "the process deviation",
        artifact: "the automation",
        outcome: "work completed with an execution trail",
      },
    },
  },
};

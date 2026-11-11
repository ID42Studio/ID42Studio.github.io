import type { Locale } from "../i18n";
import type { DomainKey, ModelKey } from "./playground-data";

export interface Exemplar {
  model: ModelKey;
  domain: DomainKey;
  text: string;
}

/**
 * Hand-written process descriptions used as the retrieval corpus.
 *
 * These are the ground truth the vector space is built on: the classifier
 * embeds them, embeds the query, and asks which examples are closest. They are
 * deliberately written as a customer would speak, not as keyword lists.
 */
export const EXEMPLARS: Record<Locale, Exemplar[]> = {
  "pt-BR": [
    // build
    { model: "build", domain: "sales", text: "Queremos um agente que responda os leads do site e agende reunião na agenda dos vendedores." },
    { model: "build", domain: "finance", text: "Precisamos de um sistema próprio para conferir notas fiscais antes de lançar no financeiro." },
    { model: "build", domain: "support", text: "Queremos construir um copiloto que responda clientes com base nos nossos manuais e contratos." },
    { model: "build", domain: "enterprise", text: "Precisamos de uma integração sob medida entre o ERP e o e-commerce, sincronizando estoque e pedidos." },
    { model: "build", domain: "support", text: "Queremos desenvolver do zero uma plataforma para os técnicos registrarem atendimentos em campo." },
    { model: "build", domain: "generic", text: "A planilha que controla nossa operação virou um sistema e precisamos reescrever isso direito." },

    // operate
    { model: "operate", domain: "sales", text: "Precisamos monitorar o funil e agir quando um lead fica parado por mais de dois dias." },
    { model: "operate", domain: "finance", text: "Queremos acompanhar a conciliação diária e ser avisados quando aparecer divergência." },
    { model: "operate", domain: "support", text: "Precisamos de plantão para incidentes de atendimento, com SLA e escalonamento definidos." },
    { model: "operate", domain: "enterprise", text: "Precisamos monitorar as sincronizações do ERP e tratar falhas antes que o time perceba." },
    { model: "operate", domain: "generic", text: "Queremos alguém responsável por manter nossos serviços no ar 24/7, com alertas e plantão." },
    { model: "operate", domain: "generic", text: "Hoje ninguém olha os logs; os problemas só aparecem quando o cliente reclama." },

    // outcome
    { model: "outcome", domain: "sales", text: "Pagamos por lead qualificado, com critério claro e registro no CRM." },
    { model: "outcome", domain: "finance", text: "Queremos pagar por documento fiscal conferido e lançado, não por hora de trabalho." },
    { model: "outcome", domain: "support", text: "Queremos pagar por ticket resolvido, com conferência por amostragem no fim do mês." },
    { model: "outcome", domain: "enterprise", text: "Temos volume alto de pedidos para sincronizar; queremos pagar por lote processado." },
    { model: "outcome", domain: "generic", text: "Queremos contratar por entrega concluída, com critério objetivo de aceite." },
    { model: "outcome", domain: "finance", text: "O time gasta dois dias por mês digitando notas fiscais no ERP; queremos pagar por nota processada." },
  ],

  en: [
    // build
    { model: "build", domain: "sales", text: "We want an agent that answers website leads and books meetings straight into the reps' calendars." },
    { model: "build", domain: "finance", text: "We need our own system to check invoices before they are posted to finance." },
    { model: "build", domain: "support", text: "We want to build a copilot that answers customers from our manuals and contracts." },
    { model: "build", domain: "enterprise", text: "We need a custom integration between the ERP and the storefront, syncing stock and orders." },
    { model: "build", domain: "generic", text: "We want to develop a platform from scratch for technicians to log field visits." },
    { model: "build", domain: "enterprise", text: "The spreadsheet running our operation became a system and we need to rewrite it properly." },

    // operate
    { model: "operate", domain: "sales", text: "We need to monitor the pipeline and act when a lead stalls for more than two days." },
    { model: "operate", domain: "finance", text: "We want to watch the daily reconciliation and be warned when something does not match." },
    { model: "operate", domain: "support", text: "We need on-call coverage for support incidents, with SLAs and clear escalation." },
    { model: "operate", domain: "enterprise", text: "We need to monitor ERP synchronisations and fix failures before the team notices." },
    { model: "operate", domain: "generic", text: "We want someone responsible for keeping our services up 24/7, with alerts and on-call rotation." },
    { model: "operate", domain: "generic", text: "Nobody looks at the logs today; problems only surface when a customer complains." },

    // outcome
    { model: "outcome", domain: "sales", text: "We pay per qualified lead, with a clear criterion and a record in the CRM." },
    { model: "outcome", domain: "finance", text: "We want to pay per invoice checked and posted, not per hour of work." },
    { model: "outcome", domain: "support", text: "We want to pay per resolved ticket, checked by sampling at the end of the month." },
    { model: "outcome", domain: "enterprise", text: "We have a high volume of orders to synchronise; we want to pay per processed batch." },
    { model: "outcome", domain: "generic", text: "We want to contract per completed delivery, with an objective acceptance criterion." },
    { model: "outcome", domain: "finance", text: "The team spends two days a month typing invoices into the ERP; we want to pay per processed invoice." },
  ],
};

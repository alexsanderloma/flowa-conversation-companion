export const CHECKOUT_SUPPORT_MESSAGE = "Já existe uma assinatura do Asaas para esta empresa. Para evitar duas cobranças, a troca desse plano precisa ser concluída pelo suporte.";
export const CHECKOUT_PENDING_MESSAGE = "Já existe uma solicitação de pagamento em andamento ou que precisa de conferência. Não criaremos outra cobrança. Entre em contato com o suporte para verificar.";
export const CHECKOUT_CURRENT_STATUSES = ["trialing", "active", "past_due", "incomplete", "paused"];

// Planos sem trial (trial_days = 0) nascem aguardando pagamento; só o Starter tem trial.
export function companyStatusForPlan(_trialDays: number | null | undefined) {
  // A criação de conta não inicia teste. A empresa só recebe acesso após
  // pagamento aprovado ou liberação explícita do Master.
  return "checkout_pending";
}

export function checkoutRedirect(company: { status_cobranca: string; trial_ate: string; onboarding_completed?: boolean | null } | null, mode?: string, now = Date.now()) {
  if (!company || mode === "upgrade") return null;
  const hasAccess = company.status_cobranca === "ativo" || (company.status_cobranca === "trial" && Date.parse(company.trial_ate) > now);
  return hasAccess ? company.onboarding_completed ? "/app/dashboard" : "/app/onboarding" : null;
}

export function planChangeSearch(plan: { slug?: string | null } | null, selectedSlug?: string | null, upgrade = true) {
  return { plano: plan?.slug ?? selectedSlug ?? undefined, mode: upgrade ? "upgrade" : undefined };
}

type Subscription = {
  id: string; plan_id: string | null; provider: string; status: string;
  external_subscription_id: string | null; metadata?: unknown;
};
export function checkoutPaymentDecision(input: { mode?: string; companyStatus: string; planId: string; subscriptions: Subscription[] }) {
  const current = input.subscriptions.filter((s) => CHECKOUT_CURRENT_STATUSES.includes(s.status));
  if (current.length > 1) return { kind: "support" as const, message: CHECKOUT_PENDING_MESSAGE };
  const row = current[0];
  const marker = row?.metadata && typeof row.metadata === "object" && "checkout_reservation" in row.metadata;
  if (row?.provider === "asaas" && row.external_subscription_id && row.plan_id === input.planId) {
    return { kind: "reuse" as const, subscriptionId: row.external_subscription_id, rowId: row.id };
  }
  // Uma cobrança Asaas ainda incompleta pode ser trocada antes de ser paga.
  // Cancelamos a tentativa anterior no provedor e geramos o checkout do plano
  // que o cliente acabou de escolher, sem manter duas mensalidades abertas.
  if (row?.provider === "asaas" && row.status === "incomplete" && row.external_subscription_id) {
    return { kind: "replace" as const, subscriptionId: row.external_subscription_id, rowId: row.id };
  }
  // Registros incompletos sem id externo são tentativas que falharam antes de
  // qualquer cobrança no Asaas. Eles podem ser reaproveitados com segurança.
  if (row?.status === "incomplete" && !row.external_subscription_id && !marker) {
    return { kind: "create" as const, rowId: row.id };
  }
  // Uma assinatura Asaas já existente para outro plano exige gestão humana: criar
  // outra cobrança automática aqui poderia duplicar a mensalidade.
  if (marker || current.some((s) => s.provider === "asaas") || row?.external_subscription_id || (row && row.provider !== "manual")) {
    return { kind: "support" as const, message: CHECKOUT_PENDING_MESSAGE };
  }
  return { kind: "create" as const, rowId: row?.id ?? null };
}

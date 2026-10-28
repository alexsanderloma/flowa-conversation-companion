import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/tenant";
import { buildFlowaReference } from "@/lib/billing/normalize";
import { checkoutPaymentDecision, CHECKOUT_PENDING_MESSAGE, companyStatusForPlan } from "@/lib/checkout-policy";

const CURRENT_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "incomplete", "paused"];

export const createCheckoutCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nome: string; plano_slug?: string }) => {
    const nome = String(d.nome || "").trim();
    if (nome.length < 2) throw new Error("Informe o nome da sua empresa.");
    const plano_slug = d.plano_slug ? String(d.plano_slug).toLowerCase().trim() : null;
    return { nome, plano_slug };
  })
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("company_user")
      .select("company_id")
      .eq("user_id", context.userId)
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing?.company_id) return { companyId: existing.company_id as string };

    // Criar conta não libera trial. Toda empresa nova nasce aguardando a
    // cobrança escolhida ou uma liberação explícita feita pelo Master.
    let trialDays = 0;
    let planSlug = data.plano_slug;
    if (planSlug) {
      const { data: plan } = await supabaseAdmin
        .from("plan")
        .select("trial_days, slug")
        .eq("slug", planSlug)
        .maybeSingle();
      if (plan?.trial_days != null) trialDays = Number(plan.trial_days);
    } else {
      const { data: starter } = await supabaseAdmin
        .from("plan")
        .select("trial_days, slug")
        .eq("slug", "starter")
        .maybeSingle();
      if (starter?.trial_days != null) trialDays = Number(starter.trial_days);
      planSlug = starter?.slug ?? null;
    }

    const slug = `${slugify(data.nome)}-${Math.random().toString(36).slice(2, 6)}`;
    const trialAte = new Date().toISOString();

    const { data: company, error: companyErr } = await supabaseAdmin
      .from("company")
      .insert({
        nome: data.nome,
        slug,
        primary_color: "#25D366",
        created_by: context.userId,
        status_cobranca: companyStatusForPlan(0),
        onboarding_completed: false,
        onboarding_step: 0,
        trial_ate: trialAte,
        selected_plan_slug: planSlug,
      } as any)
      .select("id")
      .single();
    if (companyErr || !company) throw new Error(companyErr?.message || "Falha ao criar empresa");

    const { error: memberErr } = await supabaseAdmin.from("company_user").insert({
      user_id: context.userId,
      company_id: company.id,
      role: "owner",
      ativo: true,
    });
    if (memberErr) throw memberErr;

    return { companyId: company.id as string };
  });

/** Registra uma solicitação de teste. O acesso só é liberado quando o Master aprovar. */
export const requestFreeTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plano_slug?: string; company_name?: string }) => ({
    plano_slug: String(d?.plano_slug || "starter").toLowerCase().trim() || "starter",
    company_name: String(d?.company_name || "").trim(),
  }))
  .handler(async ({ context, data }) => {
    if (data.company_name.length < 2) throw new Error("Informe o nome da empresa para solicitar o teste.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: plan, error: planErr } = await db
      .from("plan").select("id, slug, nome, ativo").eq("slug", data.plano_slug).maybeSingle();
    if (planErr) throw planErr;
    if (!plan || !plan.ativo) throw new Error("Plano inexistente ou inativo.");

    const { data: existing, error: existingErr } = await db
      .from("trial_request").select("id, status")
      .eq("user_id", context.userId).in("status", ["pending", "approved"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existingErr) throw existingErr;
    if (existing?.status === "pending") return { status: "pending" as const };
    if (existing?.status === "approved") return { status: "approved" as const };

    const { error } = await db.from("trial_request").insert({
      user_id: context.userId,
      requester_email: (context.claims as any)?.email ?? null,
      company_name: data.company_name,
      plan_id: plan.id,
      status: "pending",
    });
    if (error) throw error;
    return { status: "pending" as const };
  });

// Inicia o checkout Asaas da PRÓPRIA empresa do usuário (paywall). O companyId
// nunca vem do cliente: é derivado da membership ativa do usuário autenticado.
export const startAsaasCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plano_slug: string; mode?: string }) => {
    const plano_slug = String(d?.plano_slug || "").toLowerCase().trim();
    if (!plano_slug) throw new Error("Plano não informado.");
    return { plano_slug, mode: d.mode === "upgrade" ? "upgrade" : undefined };
  })
  .handler(async ({ context, data }) => {
    const { data: membership, error: memErr } = await context.supabase
      .from("company_user")
      .select("company_id, role")
      .eq("user_id", context.userId)
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(2);
    if (memErr) throw memErr;
    if (!membership || membership.length !== 1 || membership[0]?.role !== "owner") throw new Error("Apenas o responsável por uma empresa identificada pode gerenciar seu pagamento. Entre em contato com o suporte.");
    const companyId = membership[0].company_id;

    // A empresa já foi derivada da associação ativa do próprio usuário acima.
    // Leia o restante com a sessão autenticada: além de respeitar o RLS, isso
    // evita depender da chave administrativa para iniciar o checkout.
    const { data: company, error: compErr } = await context.supabase
      .from("company")
      .select("id, nome, email_corporativo, cnpj_cpf, selected_plan_slug, status_cobranca, trial_ate")
      .eq("id", companyId)
      .single();
    if (compErr || !company) throw new Error("Empresa não encontrada.");

    const { data: plan, error: planErr } = await context.supabase
      .from("plan")
      .select("id, slug, nome, preco_cents, trial_days, ativo")
      .eq("slug", data.plano_slug)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!plan || !plan.ativo) throw new Error("Plano inexistente ou inativo.");
    const { data: subscriptions, error: existErr } = await context.supabase
      .from("subscription")
      .select("id,plan_id,provider,status,external_subscription_id,metadata,updated_at")
      .eq("company_id", companyId);
    if (existErr) throw existErr;
    let decision: any = checkoutPaymentDecision({ mode: data.mode,
      companyStatus: company.status_cobranca === "trial" && Date.parse(company.trial_ate) <= Date.now() ? "trial_expired" : company.status_cobranca,
      planId: plan.id, subscriptions: subscriptions ?? [] });
    if (decision.kind === "support") return { kind: "support" as const, message: decision.message };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureAsaasCustomer, createAsaasSubscription, getAsaasSubscriptionPaymentUrl, cancelAsaasSubscription } =
      await import("@/lib/billing/asaas.server");
    if (decision.kind === "reuse") {
      const url = await getAsaasSubscriptionPaymentUrl(decision.subscriptionId);
      if (!url) throw new Error("Já existe uma assinatura em andamento, mas o Asaas não retornou o link de pagamento.");
      return { kind: "payment" as const, paymentUrl: url, reused: true };
    }
    if (decision.kind === "replace") {
      try {
        await cancelAsaasSubscription(decision.subscriptionId);
      } catch (error) {
        console.error("[checkout] Não foi possível cancelar a cobrança incompleta anterior", { companyId, subscriptionId: decision.subscriptionId, error: error instanceof Error ? error.message : String(error) });
        throw new Error("Não foi possível substituir a cobrança anterior no Asaas. Nenhuma nova cobrança foi criada.");
      }
      const now = new Date().toISOString();
      const { error: cancelError } = await supabaseAdmin.from("subscription")
        .update({ status: "canceled", canceled_at: now, cancel_at_period_end: false, current_period_end: now, updated_at: now })
        .eq("id", decision.rowId);
      if (cancelError) throw new Error("A cobrança anterior foi cancelada no Asaas, mas não foi possível atualizar o FLOWA. Entre em contato com o suporte antes de tentar novamente.");
      decision = checkoutPaymentDecision({ mode: data.mode, companyStatus: company.status_cobranca, planId: plan.id,
        subscriptions: (subscriptions ?? []).filter((subscription) => subscription.id !== decision.rowId) });
      if (decision.kind !== "create") throw new Error("Não foi possível preparar a nova cobrança. Atualize a página e tente novamente.");
    }

    // Durable reservation before any provider side effect. Concurrent requests
    // lose the CAS/unique index race; uncertain failures remain blocked for support.
    const reservationId = crypto.randomUUID();
    const current = subscriptions?.find((s) => s.id === decision.rowId);
    const metadata = { ...(current?.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata) ? current.metadata : {}), checkout_reservation: reservationId };
    const reserved = current ? await supabaseAdmin.from("subscription")
      .update({ metadata, updated_at: new Date().toISOString() }).eq("id", current.id)
      .eq("updated_at", current.updated_at).is("external_subscription_id", null)
      .in("status", CURRENT_SUBSCRIPTION_STATUSES).select("id").maybeSingle()
      : await supabaseAdmin.from("subscription").insert({ company_id: companyId, plan_id: plan.id,
        provider: "asaas", status: "incomplete", metadata }).select("id").single();
    // Se a reserva não foi gravada, nenhuma chamada ao Asaas aconteceu. Não
    // apresente isso como uma cobrança pendente: o cliente precisa poder ver
    // que o checkout sequer foi iniciado e tentar novamente com segurança.
    if (reserved.error || !reserved.data) {
      console.error("[checkout] Não foi possível reservar a assinatura", {
        companyId,
        subscriptionId: current?.id ?? null,
        error: reserved.error?.message ?? "Registro não reservado",
      });
      throw new Error("Não foi possível preparar o pagamento. Nenhuma cobrança foi criada. Atualize a página e tente novamente.");
    }

    const userEmail = (context.claims as any)?.email ?? null;
    let customerId: string;
    try {
      customerId = await ensureAsaasCustomer({
        name: company.nome,
        email: company.email_corporativo || userEmail,
        cpfCnpj: company.cnpj_cpf,
      });
    } catch (error) {
      // Ainda não houve criação de assinatura/cobrança. Libera somente a
      // nossa reserva para que uma correção no cadastro ou no Asaas permita
      // uma nova tentativa, sem deixar o cliente preso nesta tela.
      const cleanMetadata = { ...(current?.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata) ? current.metadata : {}) } as Record<string, unknown>;
      delete cleanMetadata.checkout_reservation;
      await supabaseAdmin.from("subscription")
        .update({ metadata: cleanMetadata, updated_at: new Date().toISOString() })
        .eq("id", reserved.data.id)
        .eq("metadata->>checkout_reservation", reservationId)
        .is("external_subscription_id", null);
      console.error("[checkout] Não foi possível preparar o cliente no Asaas", {
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Não foi possível iniciar o checkout no Asaas. Nenhuma cobrança foi criada; confira os dados da empresa e tente novamente.");
    }

    const trialDays = Number(plan.trial_days) || 0;
    const trialEnd = new Date(Date.now() + trialDays * 86400000);
    const nextDueDate = trialEnd.toISOString().slice(0, 10);

    const created = await createAsaasSubscription({
      customerId,
      value: plan.preco_cents / 100,
      nextDueDate,
      description: `FLOWA — Plano ${plan.nome}`,
      externalReference: buildFlowaReference(companyId, plan.id),
    });
    // Registro local somente após resposta do Asaas.
    const subPayload: any = {
      company_id: companyId,
      plan_id: plan.id,
      provider: "asaas",
      external_subscription_id: created.id,
      external_customer_id: customerId,
      buyer_email: company.email_corporativo || userEmail,
      status: "incomplete",
      trial_ends_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error: saveErr } = await supabaseAdmin.from("subscription").update(subPayload)
      .eq("id", reserved.data.id).eq("metadata->>checkout_reservation", reservationId)
      .is("external_subscription_id", null).select("id").maybeSingle();
    if (saveErr || !saved) return { kind: "support" as const, message: CHECKOUT_PENDING_MESSAGE };
    const paymentUrl = created.invoiceUrl ?? (await getAsaasSubscriptionPaymentUrl(created.id));
    if (!paymentUrl) throw new Error("O Asaas não retornou um link de pagamento para a assinatura. Não inicie outra assinatura; procure o suporte.");
    return { kind: "payment" as const, paymentUrl, reused: false };
  });

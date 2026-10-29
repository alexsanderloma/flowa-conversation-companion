import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isEffectiveEmployeeExpense, weekRange } from "./caixa";

type Role = "owner" | "admin" | "atendente";

async function currentCompany(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("company_user")
    .select("company_id, role")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.company_id) throw new Error("Sem empresa vinculada");
  return { companyId: data.company_id as string, role: data.role as Role };
}

function requireManager(role: Role) {
  if (role !== "owner" && role !== "admin") throw new Error("Apenas dono ou admin pode executar esta ação");
}

function isoDate(value: unknown) {
  const date = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Data inválida");
  return date;
}

function cents(value: unknown) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Valor inválido");
  return amount;
}

function nextIsoDate(date: string) {
  const base = new Date(`${date}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + 1);
  return base.toISOString().slice(0, 10);
}

export const caixaDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { date: string; endDate?: string; mode?: "day" | "week" | "month" | "custom" }) => ({ date: isoDate(d.date), endDate: d.endDate ? isoDate(d.endDate) : undefined, mode: d.mode ?? "day" }))
  .handler(async ({ context, data }) => {
    const { companyId, role } = await currentCompany(context.supabase, context.userId);
    if (data.mode === "custom" && (!data.endDate || data.endDate < data.date)) throw new Error("Período inválido");
    const start = data.mode === "week" ? weekRange(data.date).start : data.mode === "month" ? `${data.date.slice(0, 7)}-01` : data.date;
    const endExclusive = data.mode === "week" ? weekRange(data.date).endExclusive : data.mode === "month"
      ? `${new Date(Number(data.date.slice(0, 4)), Number(data.date.slice(5, 7)), 1).getFullYear()}-${String(new Date(Number(data.date.slice(0, 4)), Number(data.date.slice(5, 7)), 1).getMonth() + 1).padStart(2, "0")}-01`
      : data.mode === "custom" ? nextIsoDate(data.endDate!) : nextIsoDate(data.date);
    let salesQuery = context.supabase.from("caixa_venda").select("*, items:caixa_venda_item(*)").eq("company_id", companyId).neq("status", "cancelada");
    let expenseQuery = context.supabase.from("caixa_despesa_funcionario").select("*, funcionario:funcionario_id(nome)").eq("company_id", companyId).is("cancelado_em", null);
    if (data.mode === "day") {
      salesQuery = salesQuery.eq("data_venda", start);
      expenseQuery = expenseQuery.eq("data_lancamento", start);
    } else {
      salesQuery = salesQuery.gte("data_venda", start).lt("data_venda", endExclusive);
      expenseQuery = expenseQuery.gte("data_lancamento", start).lt("data_lancamento", endExclusive);
    }
    const [{ data: sales, error: salesError }, { data: expenses, error: expenseError }] = await Promise.all([salesQuery.order("created_at", { ascending: false }), expenseQuery.order("data_lancamento", { ascending: false })]);
    if (salesError) throw new Error(salesError.message);
    if (expenseError) throw new Error(expenseError.message);
    const sellerIds = [...new Set((sales ?? []).map((sale: any) => sale.vendedor_id).filter(Boolean))];
    const { data: profiles, error: profilesError } = sellerIds.length
      ? await context.supabase.from("profiles").select("user_id,nome,email").in("user_id", sellerIds)
      : { data: [], error: null };
    if (profilesError) throw new Error(profilesError.message);
    const sellerById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile.nome || profile.email || "Usuário"]));
    const salesWithSeller = (sales ?? []).map((sale: any) => {
      let manual: { employee_name?: string; payment_label?: string; flowa_manual_sale?: boolean } = {};
      try { manual = JSON.parse(sale.observacao ?? "{}"); } catch { /* observações antigas são texto livre */ }
      return {
        ...sale,
        vendedor_nome: manual.employee_name || sellerById.get(sale.vendedor_id) || "Usuário",
        pagamento_rotulo: manual.payment_label || sale.forma_pagamento,
        manual: manual.flowa_manual_sale === true,
      };
    });
    const confirmed = salesWithSeller.filter((sale: any) => sale.status === "confirmada");
    const revenueCents = confirmed.reduce((sum: number, sale: any) => sum + Number(sale.venda_cents), 0);
    const costCents = confirmed.reduce((sum: number, sale: any) => sum + Number(sale.custo_cents), 0);
    const feesCents = confirmed.reduce((sum: number, sale: any) => sum + Number(sale.taxas_cents ?? 0), 0);
    const effectiveExpenseCents = (expenses ?? []).filter((expense: any) => isEffectiveEmployeeExpense(expense.tipo)).reduce((sum: number, expense: any) => sum + Number(expense.valor_cents), 0);
    const grossProfitCents = revenueCents - costCents;
    return { sales: salesWithSeller, expenses: expenses ?? [], role, summary: { revenueCents, costCents, feesCents, effectiveExpenseCents, grossProfitCents, netProfitCents: grossProfitCents - effectiveExpenseCents - feesCents, transactions: confirmed.length, averageTicketCents: confirmed.length ? Math.round(revenueCents / confirmed.length) : 0 }, range: { start, endExclusive } };
  });

export const caixaProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { companyId } = await currentCompany(context.supabase, context.userId);
    // Cost is deliberately excluded from browser payloads. It stays in the
    // database/RPC path and must never be exposed by a catalog endpoint.
    const { data, error } = await context.supabase.from("produto").select("id,nome,descricao,preco,estoque_disponivel,estoque_controlado,disponivel,imagem_url,variantes,ativo,ordem").eq("company_id", companyId).eq("ativo", true).eq("disponivel", true).order("ordem", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const caixaConfirmSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; quantity: number; paymentMethod: string; customerName?: string; notes?: string; date: string }) => ({
    productId: String(d.productId ?? ""), quantity: Math.floor(Number(d.quantity)), paymentMethod: String(d.paymentMethod ?? ""), customerName: String(d.customerName ?? "").slice(0, 160), notes: String(d.notes ?? "").slice(0, 1000), date: isoDate(d.date),
  }))
  .handler(async ({ context, data }) => {
    await currentCompany(context.supabase, context.userId);
    if (!data.productId || data.quantity < 1 || data.quantity > 10000) throw new Error("Venda inválida");
    const { data: saleId, error } = await context.supabase.rpc("caixa_confirmar_venda", { _produto_id: data.productId, _quantidade: data.quantity, _forma_pagamento: data.paymentMethod, _cliente_nome: data.customerName || null, _observacao: data.notes || null, _data_venda: data.date });
    if (error) throw new Error(error.message);
    return { id: saleId as string };
  });

/**
 * Registra uma venda digitada manualmente no Caixa. Ela não cria produto nem
 * movimenta estoque: o produto é apenas um retrato textual desta venda.
 */
export const caixaConfirmManualSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quantity: number; productName: string; paymentMethod: string; employeeName: string; profitCents: number; totalCents: number; date: string }) => ({
    quantity: Math.floor(Number(d.quantity)),
    productName: String(d.productName ?? "").trim().slice(0, 240),
    paymentMethod: String(d.paymentMethod ?? "").trim(),
    employeeName: String(d.employeeName ?? "").trim().slice(0, 120),
    profitCents: Number(d.profitCents),
    totalCents: Number(d.totalCents),
    date: isoDate(d.date),
  }))
  .handler(async ({ context, data }) => {
    const { companyId } = await currentCompany(context.supabase, context.userId);
    if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 10000) throw new Error("Informe uma quantidade válida");
    if (data.productName.length < 2) throw new Error("Informe o produto vendido");
    if (data.employeeName.length < 2) throw new Error("Informe o funcionário responsável");
    if (!Number.isInteger(data.totalCents) || data.totalCents <= 0) throw new Error("Informe o total da venda");
    if (!Number.isInteger(data.profitCents) || data.profitCents < 0 || data.profitCents > data.totalCents) throw new Error("Informe um lucro válido");

    const paymentMap: Record<string, { databaseValue: string; label: string }> = {
      "credito_a_vista": { databaseValue: "credito", label: "Crédito à vista" },
      parcelado: { databaseValue: "credito", label: "Parcelado" },
      debito: { databaseValue: "debito", label: "Débito" },
      pix: { databaseValue: "pix", label: "Pix" },
      dinheiro: { databaseValue: "dinheiro", label: "Dinheiro" },
    };
    const payment = paymentMap[data.paymentMethod];
    if (!payment) throw new Error("Selecione a forma de pagamento");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const costCents = data.totalCents - data.profitCents;
    const observation = JSON.stringify({
      flowa_manual_sale: true,
      employee_name: data.employeeName,
      payment_label: payment.label,
    });
    const { data: sale, error: saleError } = await supabaseAdmin
      .from("caixa_venda")
      .insert({
        company_id: companyId,
        vendedor_id: context.userId,
        forma_pagamento: payment.databaseValue,
        status: "confirmada",
        venda_cents: data.totalCents,
        custo_cents: costCents,
        lucro_cents: data.profitCents,
        observacao: observation,
        data_venda: data.date,
        confirmado_em: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (saleError || !sale) throw new Error(saleError?.message ?? "Não foi possível registrar a venda");

    const { error: itemError } = await supabaseAdmin.from("caixa_venda_item").insert({
      venda_id: sale.id,
      company_id: companyId,
      produto_id: null,
      produto_nome_snapshot: data.productName,
      quantidade: data.quantity,
      preco_unitario_cents: Math.round(data.totalCents / data.quantity),
      custo_unitario_cents: Math.round(costCents / data.quantity),
      total_venda_cents: data.totalCents,
      total_custo_cents: costCents,
    });
    if (itemError) {
      await supabaseAdmin.from("caixa_venda").delete().eq("id", sale.id).eq("company_id", companyId);
      throw new Error(itemError.message);
    }
    const { error: auditError } = await supabaseAdmin.from("caixa_auditoria").insert({
      company_id: companyId,
      entidade: "venda",
      entidade_id: sale.id,
      acao: "confirmar_manual",
      autor_id: context.userId,
      depois: { quantidade: data.quantity, produto: data.productName, funcionario: data.employeeName, pagamento: payment.label, lucro_cents: data.profitCents, total_cents: data.totalCents },
    });
    if (auditError) console.error("Falha ao gravar auditoria do Caixa", auditError.message);
    return { id: sale.id };
  });

export const caixaCancelSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { saleId: string; reason?: string }) => ({ saleId: String(d.saleId ?? ""), reason: String(d.reason ?? "").slice(0, 500) }))
  .handler(async ({ context, data }) => {
    const { role } = await currentCompany(context.supabase, context.userId);
    requireManager(role);
    if (!data.saleId) throw new Error("Venda inválida");
    const { data: saleId, error } = await context.supabase.rpc("caixa_cancelar_venda", { _venda_id: data.saleId, _motivo: data.reason || null });
    if (error) throw new Error(error.message);
    return { id: saleId as string };
  });

export const caixaListEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { companyId } = await currentCompany(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("caixa_funcionario").select("*").eq("company_id", companyId).eq("ativo", true).order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const caixaUpsertEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string }) => ({ id: d.id ? String(d.id) : null, name: String(d.name ?? "").trim().slice(0, 120) }))
  .handler(async ({ context, data }) => {
    const { companyId, role } = await currentCompany(context.supabase, context.userId);
    requireManager(role);
    if (data.name.length < 2) throw new Error("Informe o nome do funcionário");
    if (data.id) {
      const { error } = await context.supabase.from("caixa_funcionario").update({ nome: data.name, updated_at: new Date().toISOString() }).eq("id", data.id).eq("company_id", companyId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("caixa_funcionario").insert({ company_id: companyId, nome: data.name });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const caixaCreateEmployeeExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employeeId: string; type: "diaria" | "vale" | "meta"; amountCents: number; date: string; notes?: string }) => ({ employeeId: String(d.employeeId ?? ""), type: d.type, amountCents: cents(d.amountCents), date: isoDate(d.date), notes: String(d.notes ?? "").slice(0, 1000) }))
  .handler(async ({ context, data }) => {
    const { companyId, role } = await currentCompany(context.supabase, context.userId);
    requireManager(role);
    if (!data.employeeId || !["diaria", "vale", "meta"].includes(data.type)) throw new Error("Despesa inválida");
    const { data: employee } = await context.supabase.from("caixa_funcionario").select("id").eq("id", data.employeeId).eq("company_id", companyId).eq("ativo", true).maybeSingle();
    if (!employee) throw new Error("Funcionário não encontrado");
    const { error } = await context.supabase.from("caixa_despesa_funcionario").insert({ company_id: companyId, funcionario_id: data.employeeId, tipo: data.type, valor_cents: data.amountCents, data_lancamento: data.date, observacao: data.notes || null, autor_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const caixaCancelEmployeeExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expenseId: string; reason?: string }) => ({ expenseId: String(d.expenseId ?? ""), reason: String(d.reason ?? "").slice(0, 500) }))
  .handler(async ({ context, data }) => {
    const { role } = await currentCompany(context.supabase, context.userId);
    requireManager(role);
    if (!data.expenseId) throw new Error("Despesa inválida");
    const { data: expenseId, error } = await context.supabase.rpc("caixa_cancelar_despesa_funcionario", { _despesa_id: data.expenseId, _motivo: data.reason || null });
    if (error) throw new Error(error.message);
    return { id: expenseId as string };
  });

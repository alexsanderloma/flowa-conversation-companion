export type CaixaSaleStatus = "rascunho" | "reservada" | "pendente_pagamento" | "confirmada" | "cancelada";

export function toCents(value: string | number): number {
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error("Valor inválido");
  return Math.round(parsed * 100);
}

export function fromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function weekRange(date: string): { start: string; endExclusive: string } {
  const [year, month, day] = date.split("-").map(Number);
  const local = new Date(year, month - 1, day);
  const start = new Date(year, month - 1, day - local.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: iso(start), endExclusive: iso(end) };
}

export function netProfit({ revenueCents, costCents, effectiveExpenseCents, feesCents = 0 }: { revenueCents: number; costCents: number; effectiveExpenseCents: number; feesCents?: number }) {
  const grossProfitCents = revenueCents - costCents;
  return { grossProfitCents, netProfitCents: grossProfitCents - effectiveExpenseCents - feesCents };
}

/**
 * Converts a percentage stored as basis points to its monetary amount.
 * 319 basis points means 3.19%. A per-installment charge applies only after
 * the first installment, so a one-time credit sale uses its base rate only.
 */
export function paymentFeeCents(totalCents: number, baseBps = 0, perInstallmentBps = 0, installments = 1) {
  const safeTotal = Math.max(0, Math.round(totalCents));
  const safeBase = Math.max(0, Math.round(baseBps));
  const safePerInstallment = Math.max(0, Math.round(perInstallmentBps));
  const safeInstallments = Math.max(1, Math.floor(installments));
  return Math.round((safeTotal * (safeBase + safePerInstallment * Math.max(0, safeInstallments - 1))) / 10000);
}

export function isEffectiveEmployeeExpense(type: "diaria" | "vale" | "meta") {
  return type !== "vale";
}

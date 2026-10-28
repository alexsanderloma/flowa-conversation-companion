import assert from "node:assert/strict";
import test from "node:test";
import { isEffectiveEmployeeExpense, netProfit, toCents, weekRange } from "./caixa.ts";

test("semana começa domingo e termina no domingo seguinte de forma semiaberta", () => {
  assert.deepEqual(weekRange("2026-11-04"), { start: "2026-11-01", endExclusive: "2026-11-08" });
});

test("lucro líquido não conta vale como despesa efetiva", () => {
  const result = netProfit({ revenueCents: 20000, costCents: 12000, effectiveExpenseCents: 1000, feesCents: 500 });
  assert.equal(result.grossProfitCents, 8000);
  assert.equal(result.netProfitCents, 6500);
  assert.equal(isEffectiveEmployeeExpense("vale"), false);
  assert.equal(isEffectiveEmployeeExpense("diaria"), true);
});

test("converte reais em centavos sem usar ponto flutuante como armazenamento", () => {
  assert.equal(toCents("97,00"), 9700);
  assert.equal(toCents("1.234,56"), 123456);
});

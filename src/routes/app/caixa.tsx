import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2, Plus, ReceiptText, Trash2, UsersRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brand } from "@/config/brand";
import { caixaCancelEmployeeExpense, caixaCancelSale, caixaConfirmSale, caixaCreateEmployeeExpense, caixaDashboard, caixaListEmployees, caixaProducts, caixaUpsertEmployee } from "@/lib/caixa.functions";
import { fromCents, toCents } from "@/lib/caixa";

export const Route = createFileRoute("/app/caixa")({
  head: () => ({ meta: [{ title: `${brand.name} — Caixa` }] }),
  component: CaixaPage,
});

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

function CaixaPage() {
  const dashboard = useServerFn(caixaDashboard);
  const products = useServerFn(caixaProducts);
  const employees = useServerFn(caixaListEmployees);
  const confirmSale = useServerFn(caixaConfirmSale);
  const createExpense = useServerFn(caixaCreateEmployeeExpense);
  const upsertEmployee = useServerFn(caixaUpsertEmployee);
  const cancelSale = useServerFn(caixaCancelSale);
  const cancelExpense = useServerFn(caixaCancelEmployeeExpense);
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<"day" | "week" | "month" | "custom">("day");
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSale, setSavingSale] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [sale, setSale] = useState({ productId: "", quantity: "1", paymentMethod: "pix", customerName: "", notes: "" });
  const [expense, setExpense] = useState({ employeeId: "", type: "diaria", amount: "", notes: "" });
  const [employeeName, setEmployeeName] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [next, nextCatalog, nextTeam] = await Promise.all([dashboard({ data: { date, endDate: mode === "custom" ? endDate : undefined, mode } }), products(), employees()]);
      setData(next); setCatalog(nextCatalog as any[]); setTeam(nextTeam as any[]);
    } catch (error: any) { toast.error(error?.message ?? "Não foi possível carregar o Caixa"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [date, endDate, mode]);

  const selectedProduct = useMemo(() => catalog.find((item) => item.id === sale.productId), [catalog, sale.productId]);
  const preview = selectedProduct ? Math.round(Number(selectedProduct.preco ?? 0) * 100) * Math.max(1, Number(sale.quantity) || 1) : 0;

  async function submitSale(event: React.FormEvent) {
    event.preventDefault(); setSavingSale(true);
    try {
      await confirmSale({ data: { productId: sale.productId, quantity: Number(sale.quantity), paymentMethod: sale.paymentMethod, customerName: sale.customerName, notes: sale.notes, date } });
      toast.success("Venda confirmada e registrada no Caixa");
      setSale({ productId: "", quantity: "1", paymentMethod: "pix", customerName: "", notes: "" });
      await load();
    } catch (error: any) { toast.error(error?.message ?? "Não foi possível registrar a venda"); }
    finally { setSavingSale(false); }
  }

  async function submitExpense(event: React.FormEvent) {
    event.preventDefault(); setSavingExpense(true);
    try {
      await createExpense({ data: { employeeId: expense.employeeId, type: expense.type as "diaria" | "vale" | "meta", amountCents: toCents(expense.amount), date, notes: expense.notes } });
      toast.success(expense.type === "vale" ? "Vale registrado como adiantamento" : "Despesa registrada");
      setExpense({ employeeId: "", type: "diaria", amount: "", notes: "" }); await load();
    } catch (error: any) { toast.error(error?.message ?? "Não foi possível registrar a despesa"); }
    finally { setSavingExpense(false); }
  }

  async function submitEmployee(event: React.FormEvent) {
    event.preventDefault();
    try { await upsertEmployee({ data: { name: employeeName } }); setEmployeeName(""); toast.success("Funcionário adicionado"); await load(); }
    catch (error: any) { toast.error(error?.message ?? "Não foi possível adicionar"); }
  }

  async function cancelSaleRecord(saleId: string) {
    if (!window.confirm("Cancelar esta venda? O estoque controlado será devolvido.")) return;
    try { await cancelSale({ data: { saleId } }); toast.success("Venda cancelada e estoque recomposto"); await load(); }
    catch (error: any) { toast.error(error?.message ?? "Não foi possível cancelar a venda"); }
  }

  async function cancelExpenseRecord(expenseId: string) {
    if (!window.confirm("Cancelar esta despesa? O lançamento será preservado na auditoria.")) return;
    try { await cancelExpense({ data: { expenseId } }); toast.success("Despesa cancelada"); await load(); }
    catch (error: any) { toast.error(error?.message ?? "Não foi possível cancelar a despesa"); }
  }

  const summary = data?.summary;
  return <div className="mx-auto max-w-7xl space-y-5">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm text-muted-foreground">Vendas, despesas da equipe e resultado do período.</p><h1 className="font-display text-3xl font-bold">Caixa</h1></div>
      <div className="flex flex-wrap items-center gap-2"><Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Dia</SelectItem><SelectItem value="week">Semana</SelectItem><SelectItem value="month">Mês</SelectItem><SelectItem value="custom">Período</SelectItem></SelectContent></Select><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-44 pl-9" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>{mode === "custom" && <Input className="w-44" aria-label="Fim do período" type="date" min={date} value={endDate} onChange={(e) => setEndDate(e.target.value)} />}</div>
    </section>
    {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Vendas" value={fromCents(summary?.revenueCents ?? 0)} icon={WalletCards} /><Metric label="Custos" value={fromCents(summary?.costCents ?? 0)} icon={ReceiptText} /><Metric label="Despesas efetivas" value={fromCents(summary?.effectiveExpenseCents ?? 0)} icon={UsersRound} /><Metric label="Lucro bruto" value={fromCents(summary?.grossProfitCents ?? 0)} icon={ReceiptText} /><Metric label="Lucro líquido" value={fromCents(summary?.netProfitCents ?? 0)} icon={WalletCards} highlight /></section>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Nova venda</h2><p className="text-sm text-muted-foreground">A confirmação baixa o estoque somente se ele for controlado.</p></div></div><form onSubmit={submitSale} className="grid gap-3 sm:grid-cols-2"><Field label="Produto"><Select value={sale.productId} onValueChange={(productId) => setSale({ ...sale, productId })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{catalog.map((product) => <SelectItem key={product.id} value={product.id}>{product.nome} — {fromCents(Math.round(Number(product.preco ?? 0) * 100))}</SelectItem>)}</SelectContent></Select></Field><Field label="Quantidade"><Input type="number" min="1" value={sale.quantity} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} /></Field><Field label="Forma de pagamento"><Select value={sale.paymentMethod} onValueChange={(paymentMethod) => setSale({ ...sale, paymentMethod })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="debito">Débito</SelectItem><SelectItem value="credito">Crédito</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></Field><Field label="Cliente (opcional)"><Input value={sale.customerName} onChange={(e) => setSale({ ...sale, customerName: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Observações"><Textarea value={sale.notes} onChange={(e) => setSale({ ...sale, notes: e.target.value })} /></Field></div><div className="sm:col-span-2 flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-3"><span className="text-sm text-muted-foreground">Venda prevista</span><strong>{fromCents(preview)}</strong><Button disabled={savingSale || !sale.productId}>{savingSale && <Loader2 className="mr-2 size-4 animate-spin" />}Confirmar venda</Button></div></form></Card>
      <Card className="p-5"><h2 className="font-display text-xl font-bold">Despesas de funcionários</h2><p className="mt-1 text-sm text-muted-foreground">Vale é adiantamento: não entra duas vezes no lucro líquido.</p><form onSubmit={submitExpense} className="mt-4 space-y-3"><Field label="Funcionário"><Select value={expense.employeeId} onValueChange={(employeeId) => setExpense({ ...expense, employeeId })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{team.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.nome}</SelectItem>)}</SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Tipo"><Select value={expense.type} onValueChange={(type) => setExpense({ ...expense, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="diaria">Diária</SelectItem><SelectItem value="vale">Vale</SelectItem><SelectItem value="meta">Meta</SelectItem></SelectContent></Select></Field><Field label="Valor"><Input inputMode="decimal" placeholder="0,00" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} /></Field></div><Field label="Observação"><Textarea value={expense.notes} onChange={(e) => setExpense({ ...expense, notes: e.target.value })} /></Field><Button className="w-full" variant="secondary" disabled={savingExpense || !expense.employeeId}>{savingExpense && <Loader2 className="mr-2 size-4 animate-spin" />}Registrar despesa</Button></form><form onSubmit={submitEmployee} className="mt-5 border-t pt-4"><Label>Novo funcionário</Label><div className="mt-2 flex gap-2"><Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Nome" /><Button type="submit" variant="outline" size="icon" title="Adicionar"><Plus className="size-4" /></Button></div></form></Card></section>
      <Card className="overflow-hidden"><div className="border-b p-5"><h2 className="font-display text-xl font-bold">Histórico de vendas</h2><p className="text-sm text-muted-foreground">{summary?.transactions ?? 0} venda(s) confirmada(s) · ticket médio {fromCents(summary?.averageTicketCents ?? 0)}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/30 text-left text-muted-foreground"><tr><th className="px-4 py-3">Qtd</th><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Vendedor</th><th className="px-4 py-3">Forma Pagamento</th><th className="px-4 py-3 text-right">Lucro</th><th className="px-4 py-3 text-right">Custo</th><th className="px-4 py-3 text-right">Venda</th></tr></thead><tbody>{(data?.sales ?? []).filter((item: any) => item.status === "confirmada").flatMap((saleRow: any) => (saleRow.items ?? []).map((item: any) => <tr key={item.id} className="border-t"><td className="px-4 py-3">{item.quantidade}</td><td className="px-4 py-3"><div className="flex items-center justify-between gap-2"><span>{item.produto_nome_snapshot}</span>{["owner", "admin"].includes(data?.role) && <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" title="Cancelar venda" onClick={() => void cancelSaleRecord(saleRow.id)}><Trash2 className="size-3.5" /></Button>}</div></td><td className="px-4 py-3">Você</td><td className="px-4 py-3 capitalize">{saleRow.forma_pagamento}</td><td className="px-4 py-3 text-right">{fromCents(Number(item.total_venda_cents) - Number(item.total_custo_cents))}</td><td className="px-4 py-3 text-right">{fromCents(Number(item.total_custo_cents))}</td><td className="px-4 py-3 text-right font-semibold">{fromCents(Number(item.total_venda_cents))}</td></tr>))}{!(data?.sales ?? []).some((item: any) => item.status === "confirmada") && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhuma venda no período selecionado.</td></tr>}</tbody></table></div></Card>
      <Card className="overflow-hidden"><div className="border-b p-5"><h2 className="font-display text-xl font-bold">Lançamentos da equipe</h2><p className="text-sm text-muted-foreground">Diárias e metas afetam o lucro líquido. Vales ficam registrados como adiantamento.</p></div><div className="divide-y">{(data?.expenses ?? []).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 p-4 text-sm"><div><strong>{item.funcionario?.nome ?? "Funcionário"}</strong><span className="ml-2 capitalize text-muted-foreground">{item.tipo}</span><p className="text-xs text-muted-foreground">{item.data_lancamento}{item.observacao ? ` · ${item.observacao}` : ""}</p></div><div className="flex items-center gap-2"><strong>{fromCents(Number(item.valor_cents))}</strong>{["owner", "admin"].includes(data?.role) && <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" title="Cancelar despesa" onClick={() => void cancelExpenseRecord(item.id)}><Trash2 className="size-3.5" /></Button>}</div></div>)}{!(data?.expenses ?? []).length && <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma despesa no período selecionado.</div>}</div></Card>
    </>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
function Metric({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: any; highlight?: boolean }) { return <Card className={`p-4 ${highlight ? "border-[color:var(--brand-soft-strong)] bg-[color:var(--brand-soft)]" : ""}`}><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="size-4" /></div><div className="mt-2 font-display text-2xl font-bold">{value}</div></Card>; }

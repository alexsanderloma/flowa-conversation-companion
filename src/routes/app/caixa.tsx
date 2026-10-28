import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Check, CircleDollarSign, CreditCard, Loader2, Minus, PackageSearch, Plus, ReceiptText, Search, ShoppingBag, Smartphone, Sparkles, Trash2, UsersRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const payment = sale.paymentMethod;
  const setPayment = (method: string) => setSale((current) => ({ ...current, paymentMethod: method }));
  const increase = (amount: number) => setSale((current) => ({ ...current, quantity: String(Math.max(1, (Number(current.quantity) || 1) + amount)) }));
  const visibleCatalog = catalog.filter((item) => `${item.nome} ${item.sku ?? ""}`.toLowerCase().includes((sale.notes || "").toLowerCase())).slice(0, 4);
  return <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <section className="relative overflow-hidden rounded-2xl border border-[color:var(--brand-soft-strong)] bg-[radial-gradient(circle_at_85%_5%,color-mix(in_srgb,var(--brand)_28%,transparent),transparent_31%),linear-gradient(135deg,color-mix(in_srgb,var(--panel)_92%,var(--brand)_8%),var(--panel))] p-5 shadow-[0_25px_70px_-42px_rgba(75,50,190,.8)] md:p-6"><div className="pointer-events-none absolute right-[-54px] top-[-70px] size-56 rounded-full bg-[color:var(--brand)] opacity-20 blur-3xl" /><div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[color:var(--brand-text)]"><Sparkles className="size-3.5" /> Experiência de caixa</div><h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Vender ficou simples. <span className="text-gradient-brand">Controlar, melhor ainda.</span></h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Lançamento rápido, estoque protegido, equipe e resultado do período em um único lugar.</p></div><div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/75 p-1.5 backdrop-blur">{([['day','Hoje'],['week','Semana'],['month','Mês'],['custom','Período']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === value ? 'bg-[color:var(--brand)] text-white shadow-lg shadow-[color:var(--brand)]/30' : 'text-muted-foreground hover:bg-[color:var(--panel-2)] hover:text-foreground'}`}>{label}</button>)}<span className="ml-1 flex items-center gap-1.5 border-l border-[color:var(--hairline)] pl-3 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /><Input className="h-7 w-32 border-0 bg-transparent px-0 text-xs" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></span></div></div></section>
    {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><PremiumMetric icon={WalletCards} label="Vendas confirmadas" value={fromCents(summary?.revenueCents ?? 0)} footer={`${summary?.transactions ?? 0} venda(s) no período`} tone="positive" /><PremiumMetric icon={PackageSearch} label="Custo dos produtos" value={fromCents(summary?.costCents ?? 0)} footer="Informação interna" /><PremiumMetric icon={UsersRound} label="Equipe no período" value={fromCents(summary?.effectiveExpenseCents ?? 0)} footer="Diárias e metas" /><PremiumMetric icon={CircleDollarSign} label="Lucro líquido" value={fromCents(summary?.netProfitCents ?? 0)} footer="Resultado após custos" tone="primary" /></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.58fr)]"><Card className="overflow-hidden border-[color:var(--hairline-strong)] bg-[color:var(--panel)]/80 shadow-xl shadow-black/10"><div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><ShoppingBag className="size-4" /></span><h2 className="font-display text-xl font-bold">Nova venda</h2></div><p className="mt-1 text-sm text-muted-foreground">Pesquise, adicione ao carrinho e confirme em poucos cliques.</p></div><Badge className="w-fit border-0 bg-emerald-500/15 text-emerald-400"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" /> Caixa aberto</Badge></div><form onSubmit={submitSale} className="p-5"><label className="group relative block"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={sale.notes} onChange={(event) => setSale({ ...sale, notes: event.target.value })} placeholder="Buscar produto, SKU ou código de barras…" className="h-14 rounded-xl border-[color:var(--hairline-strong)] bg-[color:var(--panel-2)] pl-12 text-base shadow-inner" /></label><div className="mt-3 grid gap-2 sm:grid-cols-2">{visibleCatalog.map((product) => <button type="button" key={product.id} onClick={() => setSale({ ...sale, productId: product.id, notes: "" })} className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${sale.productId === product.id ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]/35' : 'border-[color:var(--hairline)] bg-[color:var(--panel-2)]/35 hover:border-[color:var(--brand-soft-strong)]'}`}><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-brand text-white shadow-lg"><Smartphone className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{product.nome}</span><span className="mt-0.5 block text-xs text-muted-foreground">{product.sku || 'Produto'} · {product.estoque_controlado ? `${product.estoque_atual ?? 0} em estoque` : 'estoque livre'}</span></span><strong className="text-sm">{fromCents(Math.round(Number(product.preco ?? 0) * 100))}</strong></button>)}</div><div className="mt-5 overflow-hidden rounded-xl border border-[color:var(--hairline)]"><div className="flex items-center justify-between border-b border-[color:var(--hairline)] bg-[color:var(--panel-2)]/55 px-4 py-3"><strong className="text-sm">Itens da venda</strong><button type="button" onClick={() => setSale({ ...sale, productId: '', quantity: '1' })} className="text-xs font-semibold text-muted-foreground hover:text-rose-400">Limpar carrinho</button></div>{selectedProduct ? <div className="flex items-center gap-3 px-4 py-4"><span className="grid size-10 place-items-center rounded-lg bg-gradient-brand text-white"><Smartphone className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{selectedProduct.nome}</strong><span className="text-xs text-muted-foreground">{fromCents(Math.round(Number(selectedProduct.preco ?? 0) * 100))} por unidade</span></span><div className="flex items-center rounded-lg border border-[color:var(--hairline-strong)] bg-[color:var(--panel)]"><button type="button" onClick={() => increase(-1)} className="p-2 text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button><span className="w-7 text-center text-sm font-semibold">{sale.quantity}</span><button type="button" onClick={() => increase(1)} className="p-2 text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button></div><strong className="w-24 text-right text-sm">{fromCents(preview)}</strong><button type="button" onClick={() => setSale({ ...sale, productId: '' })} className="text-muted-foreground hover:text-rose-400"><Trash2 className="size-4" /></button></div> : <div className="grid min-h-40 place-items-center px-6 text-center"><div><PackageSearch className="mx-auto mb-2 size-7 text-muted-foreground" /><p className="text-sm font-medium">Comece buscando um produto acima</p><p className="mt-1 text-xs text-muted-foreground">Nada é confirmado até você finalizar a venda.</p></div></div>}</div></form></Card>
      <aside className="space-y-5"><Card className="overflow-hidden border-[color:var(--brand-soft-strong)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--panel)_88%,var(--brand)_12%),var(--panel))] p-5 shadow-xl shadow-[color:var(--brand)]/10"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--brand-text)]">Resumo da venda</p><h2 className="mt-1 font-display text-xl font-bold">Finalizar com segurança</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><CircleDollarSign className="size-5" /></span></div><div className="mt-5 space-y-3 border-y border-[color:var(--hairline)] py-4 text-sm"><Summary label="Subtotal" value={fromCents(preview)} /><Summary label="Cliente" value={sale.customerName || 'Consumidor final'} muted /></div><Input className="mt-4" value={sale.customerName} onChange={(e) => setSale({ ...sale, customerName: e.target.value })} placeholder="Nome do cliente (opcional)" /><div className="mt-4 grid grid-cols-3 gap-2">{[['pix','PIX',Sparkles],['credito','Crédito',CreditCard],['dinheiro','Dinheiro',WalletCards]].map(([value,label,Icon]: any) => <button key={value} type="button" onClick={() => setPayment(value)} className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${payment === value ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]' : 'border-[color:var(--hairline)] bg-[color:var(--panel-2)]/30 text-muted-foreground hover:text-foreground'}`}><Icon className="mx-auto mb-1 size-4" />{label}</button>)}</div><div className="mt-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">Total a receber</span><strong className="font-display text-3xl">{fromCents(preview)}</strong></div><Button form="" type="button" className="mt-5 h-12 w-full rounded-xl bg-gradient-brand text-sm font-bold shadow-lg shadow-[color:var(--brand)]/30" disabled={savingSale || !sale.productId} onClick={() => void submitSale({ preventDefault() {} } as React.FormEvent)}><Check className="mr-2 size-4" />{savingSale ? 'Confirmando…' : `Confirmar venda via ${payment === 'pix' ? 'PIX' : payment}`}</Button></Card><Card className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Resultado estimado</h3><p className="text-xs text-muted-foreground">Informação interna — nunca enviada à IA.</p></div><ReceiptText className="size-5 text-emerald-400" /></div><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Custo" value={fromCents(Math.round(preview * .64))} /><MiniMetric label="Lucro bruto" value={fromCents(Math.round(preview * .36))} accent /></div></Card></aside></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]"><Card className="overflow-hidden"><div className="border-b border-[color:var(--hairline)] p-5"><h2 className="font-display text-xl font-bold">Vendas do período</h2><p className="text-sm text-muted-foreground">Histórico completo, auditável e filtrado pela data escolhida.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[color:var(--panel-2)]/45 text-[11px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-5 py-3">Qtd</th><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Vendedor</th><th className="px-5 py-3">Forma pagamento</th><th className="px-5 py-3 text-right">Lucro</th><th className="px-5 py-3 text-right">Custo</th><th className="px-5 py-3 text-right">Venda</th></tr></thead><tbody className="divide-y divide-[color:var(--hairline)]">{(data?.sales ?? []).filter((row: any) => row.status === 'confirmada').flatMap((row: any) => (row.items ?? []).map((item: any) => <tr key={item.id} className="transition hover:bg-[color:var(--brand-soft)]/25"><td className="px-5 py-4 font-semibold">{item.quantidade}</td><td className="px-5 py-4 font-medium">{item.produto_nome_snapshot}</td><td className="px-5 py-4 text-muted-foreground">Você</td><td className="px-5 py-4"><Badge variant="outline" className="border-[color:var(--hairline-strong)] capitalize">{row.forma_pagamento}</Badge></td><td className="px-5 py-4 text-right font-semibold text-emerald-400">{fromCents(Number(item.total_venda_cents)-Number(item.total_custo_cents))}</td><td className="px-5 py-4 text-right text-muted-foreground">{fromCents(Number(item.total_custo_cents))}</td><td className="px-5 py-4 text-right font-bold">{fromCents(Number(item.total_venda_cents))}</td></tr>))}{!(data?.sales ?? []).some((row: any) => row.status === 'confirmada') && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhuma venda no período selecionado.</td></tr>}</tbody></table></div></Card><Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Equipe</h2><p className="text-sm text-muted-foreground">Diárias, vales e metas.</p></div><UsersRound className="size-5 text-[color:var(--brand-text)]" /></div><div className="mt-4 space-y-3">{team.map((employee) => <div key={employee.id} className="flex items-center gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel-2)]/25 p-3"><span className="grid size-9 place-items-center rounded-full bg-[color:var(--brand-soft)] text-xs font-bold text-[color:var(--brand-text)]">{employee.nome?.[0]}</span><div className="min-w-0 flex-1"><strong className="block text-sm">{employee.nome}</strong><span className="text-xs text-muted-foreground">Funcionário cadastrado</span></div></div>)}{!team.length && <p className="py-3 text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>}</div></Card></section></>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
function Metric({ label, value, icon: Icon, highlight }: { label: string; value: string; icon: any; highlight?: boolean }) { return <Card className={`p-4 ${highlight ? "border-[color:var(--brand-soft-strong)] bg-[color:var(--brand-soft)]" : ""}`}><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="size-4" /></div><div className="mt-2 font-display text-2xl font-bold">{value}</div></Card>; }

function PremiumMetric({ icon: Icon, label, value, footer, tone }: { icon: any; label: string; value: string; footer: string; tone?: 'positive' | 'primary' }) { return <Card className={`relative overflow-hidden p-4 ${tone === 'primary' ? 'border-[color:var(--brand-soft-strong)] bg-[color:var(--brand-soft)]/35' : ''}`}><Icon className={`absolute right-4 top-4 size-5 ${tone === 'positive' ? 'text-emerald-400' : 'text-[color:var(--brand-text)]'}`} /><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p><p className={`mt-2 text-xs ${tone === 'positive' ? 'text-emerald-400' : 'text-muted-foreground'}`}>{footer}</p></Card>; }
function Summary({ label, value, muted }: { label: string; value: string; muted?: boolean }) { return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className={muted ? 'text-muted-foreground' : 'font-semibold'}>{value}</span></div>; }
function MiniMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className={`rounded-lg border p-3 ${accent ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-[color:var(--hairline)] bg-[color:var(--panel-2)]/35'}`}><p className="text-xs text-muted-foreground">{label}</p><strong className={`mt-1 block text-sm ${accent ? 'text-emerald-400' : ''}`}>{value}</strong></div>; }

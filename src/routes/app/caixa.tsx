import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Check, CircleDollarSign, Loader2, PackageSearch, ShoppingBag, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { caixaConfirmManualSale, caixaDashboard } from "@/lib/caixa.functions";
import { fromCents, toCents } from "@/lib/caixa";

export const Route = createFileRoute("/app/caixa")({
  head: () => ({ meta: [{ title: `${brand.name} — Caixa` }] }),
  component: CaixaPage,
});

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const paymentOptions = [
  { value: "credito_a_vista", label: "Crédito à vista" },
  { value: "parcelado", label: "Parcelado" },
  { value: "debito", label: "Débito" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
];
type SaleLine = { quantity: string; product: string; payment: string; employee: string; profit: string; total: string };
const emptyLine = (): SaleLine => ({ quantity: "", product: "", payment: "", employee: "", profit: "", total: "" });

function CaixaPage() {
  const dashboard = useServerFn(caixaDashboard);
  const confirmManualSale = useServerFn(caixaConfirmManualSale);
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<any>(null);
  const [line, setLine] = useState<SaleLine>(emptyLine);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setData(await dashboard({ data: { date, mode } })); }
    catch (error: any) { toast.error(error?.message ?? "Não foi possível carregar o Caixa"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [date, mode]);

  const totalCents = safeCents(line.total);
  const profitCents = safeCents(line.profit);
  const paymentLabel = paymentOptions.find((option) => option.value === line.payment)?.label;
  const summary = data?.summary;

  async function submitSale() {
    if (!line.quantity || !line.product || !line.payment || !line.employee || !line.profit || !line.total) { toast.error("Preencha todos os campos da venda"); return; }
    if (profitCents > totalCents) { toast.error("O lucro não pode ser maior que o total"); return; }
    setSaving(true);
    try {
      await confirmManualSale({ data: { quantity: Number(line.quantity), productName: line.product, paymentMethod: line.payment, employeeName: line.employee, profitCents, totalCents, date } });
      toast.success("Venda confirmada e adicionada ao histórico"); setLine(emptyLine()); await load();
    } catch (error: any) { toast.error(error?.message ?? "Não foi possível registrar a venda"); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <section className="relative overflow-hidden rounded-2xl border border-[color:var(--brand-soft-strong)] bg-[radial-gradient(circle_at_85%_5%,color-mix(in_srgb,var(--brand)_28%,transparent),transparent_31%),linear-gradient(135deg,color-mix(in_srgb,var(--panel)_92%,var(--brand)_8%),var(--panel))] p-5 shadow-[0_25px_70px_-42px_rgba(75,50,190,.8)] md:p-6"><div className="pointer-events-none absolute right-[-54px] top-[-70px] size-56 rounded-full bg-[color:var(--brand)] opacity-20 blur-3xl" /><div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[color:var(--brand-text)]"><Sparkles className="size-3.5" /> Experiência de caixa</div><h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Vender ficou simples. <span className="text-gradient-brand">Controlar, melhor ainda.</span></h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Uma linha por venda: unidade, produto, pagamento, funcionário, lucro e total.</p></div><div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/75 p-1.5 backdrop-blur">{([['day','Hoje'],['week','Semana'],['month','Mês']] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === value ? 'bg-[color:var(--brand)] text-white shadow-lg shadow-[color:var(--brand)]/30' : 'text-muted-foreground hover:bg-[color:var(--panel-2)] hover:text-foreground'}`}>{label}</button>)}<span className="ml-1 flex items-center gap-1.5 border-l border-[color:var(--hairline)] pl-3 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /><Input className="h-7 w-32 border-0 bg-transparent px-0 text-xs" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></span></div></div></section>
    {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : <><section className="grid gap-3 sm:grid-cols-2"><Metric icon={WalletCards} label="Vendas confirmadas" value={fromCents(summary?.revenueCents ?? 0)} footer={`${summary?.transactions ?? 0} venda(s) no período`} tone="positive" /><Metric icon={CircleDollarSign} label="Lucro líquido" value={fromCents(summary?.netProfitCents ?? 0)} footer="Resultado após custos e despesas" tone="primary" /></section>
      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.58fr)]"><Card className="overflow-hidden border-[color:var(--hairline-strong)] bg-[color:var(--panel)]/80 shadow-xl shadow-black/10"><div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><ShoppingBag className="size-4" /></span><h2 className="font-display text-xl font-bold">Nova venda</h2></div><p className="mt-1 text-sm text-muted-foreground">Preencha uma única linha. Não há catálogo nem busca de produto.</p></div><Badge className="w-fit border-0 bg-emerald-500/15 text-emerald-400"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" /> Caixa aberto</Badge></div><div className="p-5"><div className="overflow-x-auto rounded-xl border border-[color:var(--hairline-strong)]"><div className="min-w-[900px]"><div className="grid grid-cols-[95px_minmax(220px,1fr)_145px_160px_130px_145px] items-center gap-3 bg-[color:var(--panel)] p-3"><Input value={line.quantity} onChange={(event) => setLine({ ...line, quantity: event.target.value })} placeholder="Unidade" inputMode="numeric" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)] text-center font-semibold placeholder:text-center" /><Input value={line.product} onChange={(event) => setLine({ ...line, product: event.target.value })} placeholder="Produto" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><select value={line.payment} onChange={(event) => setLine({ ...line, payment: event.target.value })} className="h-12 w-full rounded-lg border border-[color:var(--hairline-strong)] bg-[color:var(--panel-2)] px-3 text-sm text-foreground outline-none"><option value="" disabled>Pagamento</option>{paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Input value={line.employee} onChange={(event) => setLine({ ...line, employee: event.target.value })} placeholder="Funcionário" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><Input value={line.profit} onChange={(event) => setLine({ ...line, profit: event.target.value })} placeholder="Lucro" inputMode="decimal" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><Input value={line.total} onChange={(event) => setLine({ ...line, total: event.target.value })} placeholder="Total" inputMode="decimal" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)] font-semibold" /></div></div></div><div className="mt-5 overflow-hidden rounded-xl border border-[color:var(--hairline)]"><div className="flex items-center justify-between border-b border-[color:var(--hairline)] bg-[color:var(--panel-2)]/55 px-4 py-3"><div><strong className="text-sm">Linha pronta para confirmar</strong><span className="ml-2 text-xs text-muted-foreground">Lançamento manual</span></div><button type="button" onClick={() => setLine(emptyLine())} className="text-xs font-semibold text-muted-foreground hover:text-rose-400">Limpar</button></div>{line.product ? <div className="flex items-center gap-3 px-4 py-4"><span className="grid size-10 place-items-center rounded-lg bg-gradient-brand text-white"><ShoppingBag className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{line.quantity || '—'} · {line.product}</strong><span className="text-xs text-muted-foreground">{paymentLabel || 'Pagamento não selecionado'} · {line.employee || 'Funcionário não informado'} · lucro {fromCents(profitCents)}</span></span><strong className="w-28 text-right text-sm">{fromCents(totalCents)}</strong></div> : <div className="grid min-h-32 place-items-center px-6 text-center"><div><PackageSearch className="mx-auto mb-2 size-7 text-muted-foreground" /><p className="text-sm font-medium">Preencha a linha de venda acima</p></div></div>}</div></div></Card><aside className="space-y-5"><Card className="overflow-hidden border-[color:var(--brand-soft-strong)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--panel)_88%,var(--brand)_12%),var(--panel))] p-5 shadow-xl shadow-[color:var(--brand)]/10"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--brand-text)]">Resumo da venda</p><h2 className="mt-1 font-display text-xl font-bold">Finalizar com segurança</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><CircleDollarSign className="size-5" /></span></div><div className="mt-5 space-y-3 border-y border-[color:var(--hairline)] py-4 text-sm"><Summary label="Produto" value={line.product || 'A informar'} muted={!line.product} /><Summary label="Pagamento" value={paymentLabel || 'Escolha na linha'} muted={!paymentLabel} /><Summary label="Funcionário" value={line.employee || 'A informar'} muted={!line.employee} /><Summary label="Lucro" value={fromCents(profitCents)} /></div><div className="mt-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">Total a receber</span><strong className="font-display text-3xl text-foreground">{fromCents(totalCents)}</strong></div><Button type="button" className="mt-5 h-12 w-full rounded-xl bg-gradient-brand text-sm font-bold shadow-lg shadow-[color:var(--brand)]/30" disabled={saving || !line.product || !line.payment || !line.employee || totalCents <= 0 || profitCents > totalCents || Number(line.quantity) < 1} onClick={() => void submitSale()}><Check className="mr-2 size-4" />{saving ? 'Confirmando…' : 'Confirmar venda'}</Button></Card></aside></section>
      <section><Card className="overflow-hidden"><div className="border-b border-[color:var(--hairline)] p-5"><h2 className="font-display text-xl font-bold">Vendas</h2><p className="text-sm text-muted-foreground">Histórico auditável do período selecionado.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[color:var(--panel-2)]/45 text-[11px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-5 py-3">Unidade</th><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Pagamento</th><th className="px-5 py-3">Funcionário</th><th className="px-5 py-3 text-right">Lucro</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-[color:var(--hairline)]">{(data?.sales ?? []).filter((row: any) => row.status === 'confirmada').flatMap((row: any) => (row.items ?? []).map((item: any) => <tr key={item.id} className="transition hover:bg-[color:var(--brand-soft)]/25"><td className="px-5 py-4 font-semibold">{item.quantidade}</td><td className="px-5 py-4 font-medium">{item.produto_nome_snapshot}</td><td className="px-5 py-4"><Badge variant="outline" className="border-[color:var(--hairline-strong)]">{row.pagamento_rotulo}</Badge></td><td className="px-5 py-4 text-muted-foreground">{row.vendedor_nome}</td><td className="px-5 py-4 text-right font-semibold text-emerald-400">{fromCents(Number(item.total_venda_cents) - Number(item.total_custo_cents))}</td><td className="px-5 py-4 text-right font-bold">{fromCents(Number(item.total_venda_cents))}</td></tr>))}{!(data?.sales ?? []).some((row: any) => row.status === 'confirmada') && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhuma venda no período selecionado.</td></tr>}</tbody></table></div></Card></section>
    </>}</div>;
}

function safeCents(value: string) { try { return value.trim() ? toCents(value) : 0; } catch { return 0; } }
function Metric({ icon: Icon, label, value, footer, tone }: { icon: any; label: string; value: string; footer: string; tone?: 'positive' | 'primary' }) { return <Card className={`relative overflow-hidden p-4 ${tone === 'primary' ? 'border-[color:var(--brand-soft-strong)] bg-[color:var(--brand-soft)]/35' : ''}`}><Icon className={`absolute right-4 top-4 size-5 ${tone === 'positive' ? 'text-emerald-400' : 'text-[color:var(--brand-text)]'}`} /><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p><p className={`mt-2 text-xs ${tone === 'positive' ? 'text-emerald-400' : 'text-muted-foreground'}`}>{footer}</p></Card>; }
function Summary({ label, value, muted }: { label: string; value: string; muted?: boolean }) { return <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={`text-right ${muted ? 'text-muted-foreground' : 'font-semibold'}`}>{value}</span></div>; }

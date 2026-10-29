import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownRight, CalendarDays, Check, ChevronLeft, ChevronRight,
  CircleDollarSign, CreditCard, Minus, PackageSearch, Plus,
  ShoppingBag, Smartphone, Sparkles, Trash2, UsersRound, WalletCards,
} from "lucide-react";
import { brand } from "@/config/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/demo/caixa")({
  head: () => ({ meta: [{ title: `${brand.name} — Prévia do Caixa` }] }),
  component: CaixaPreview,
});

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function CaixaPreview() {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [profit, setProfit] = useState("");
  const [employee, setEmployee] = useState("");
  const [payment, setPayment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [sales, setSales] = useState([
    { quantity: "01", item: "Película 3D Premium", payment: "PIX", employee: "Amanda", profit: "68,00", total: "119,80" },
    { quantity: "01", item: "Carregador Turbo 33W", payment: "Dinheiro", employee: "Alex", profit: "34,90", total: "89,90" },
  ]);

  const subtotal = Number(amount.replace('.', '').replace(',', '.')) || 0;
  const estimatedCost = subtotal * 0.64;
  const grossProfit = subtotal - estimatedCost;

  const changeQuantity = (change: number) => setQuantity(String(Math.max(1, (Number(quantity) || 1) + change)));

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-[color:var(--brand-soft-strong)] bg-[radial-gradient(circle_at_85%_5%,color-mix(in_srgb,var(--brand)_28%,transparent),transparent_31%),linear-gradient(135deg,color-mix(in_srgb,var(--panel)_92%,var(--brand)_8%),var(--panel))] p-5 shadow-[0_25px_70px_-42px_rgba(75,50,190,.8)] md:p-6">
        <div className="pointer-events-none absolute right-[-54px] top-[-70px] size-56 rounded-full bg-[color:var(--brand)] opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[color:var(--brand-text)]"><Sparkles className="size-3.5" /> Experiência de caixa</div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Vender ficou simples. <span className="text-gradient-brand">Controlar, melhor ainda.</span></h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Uma linha por venda: unidade, produto, pagamento, funcionário, lucro e total.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/75 p-1.5 backdrop-blur">
            {['Hoje', 'Semana', 'Mês', 'Período'].map((period, index) => <button key={period} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${index === 0 ? 'bg-[color:var(--brand)] text-white shadow-lg shadow-[color:var(--brand)]/30' : 'text-muted-foreground hover:bg-[color:var(--panel-2)] hover:text-foreground'}`}>{period}</button>)}
            <span className="ml-1 flex items-center gap-1.5 border-l border-[color:var(--hairline)] pl-3 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> 28 out. 2026</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Metric icon={WalletCards} label="Vendas confirmadas" value="R$ 4.287,90" footer="12 vendas · +18,4%" tone="positive" />
        <Metric icon={CircleDollarSign} label="Lucro líquido" value="R$ 1.404,72" footer="Margem líquida 32,7%" tone="primary" />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.58fr)]">
        <Card className="overflow-hidden border-[color:var(--hairline-strong)] bg-[color:var(--panel)]/80 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><ShoppingBag className="size-4" /></span><h2 className="font-display text-xl font-bold">Nova venda</h2></div><p className="mt-1 text-sm text-muted-foreground">Preencha uma única linha. Não há catálogo nem busca de produto.</p></div>
            <Badge className="w-fit border-0 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" /> Caixa aberto</Badge>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto rounded-xl border border-[color:var(--hairline-strong)]"><div className="min-w-[900px]"><div className="grid grid-cols-[95px_minmax(220px,1fr)_145px_160px_130px_145px] items-center gap-3 bg-[color:var(--panel)] p-3"><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Unidade" inputMode="numeric" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)] text-center font-semibold placeholder:text-center" /><Input value={item} onChange={(event) => setItem(event.target.value)} placeholder="Produto" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><select value={payment} onChange={(event) => setPayment(event.target.value)} className="h-12 w-full rounded-lg border border-[color:var(--hairline-strong)] bg-[color:var(--panel-2)] px-3 text-sm text-foreground outline-none"><option value="" disabled>Pagamento</option><option>Crédito à vista</option><option>Parcelado</option><option>Débito</option><option>Pix</option><option>Dinheiro</option></select><Input value={employee} onChange={(event) => setEmployee(event.target.value)} placeholder="Funcionário" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><Input value={profit} onChange={(event) => setProfit(event.target.value)} placeholder="Lucro" inputMode="decimal" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)]" /><Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Total" inputMode="decimal" className="h-12 w-full rounded-lg bg-[color:var(--panel-2)] font-semibold" /></div></div></div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[color:var(--hairline)]">
              <div className="flex items-center justify-between border-b border-[color:var(--hairline)] bg-[color:var(--panel-2)]/55 px-4 py-3"><div><strong className="text-sm">Linha pronta para confirmar</strong><span className="ml-2 text-xs text-muted-foreground">Lançamento manual</span></div><button type="button" onClick={() => { setItem(''); setQuantity(''); setPayment(''); setEmployee(''); setProfit(''); setAmount(''); }} className="text-xs font-semibold text-muted-foreground hover:text-rose-400">Limpar</button></div>
              {item ? <div className="grid grid-cols-[72px_minmax(180px,1fr)_100px_100px] items-center gap-3 px-4 py-4"><span className="grid size-10 place-items-center rounded-lg bg-gradient-brand text-white"><Smartphone className="size-5" /></span><span className="min-w-0"><strong className="block truncate text-sm">{quantity} · {item}</strong><span className="text-xs text-muted-foreground">{payment} · {employee} · lucro R$ {profit}</span></span><strong className="text-right text-sm">{brl.format(subtotal)}</strong><button type="button" className="text-muted-foreground hover:text-rose-400"><Trash2 className="ml-auto size-4" /></button></div> : <div className="grid min-h-32 place-items-center px-6 text-center"><div><PackageSearch className="mx-auto mb-2 size-7 text-muted-foreground" /><p className="text-sm font-medium">Preencha a linha de venda acima</p></div></div>}
            </div>
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="overflow-hidden border-[color:var(--brand-soft-strong)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--panel)_88%,var(--brand)_12%),var(--panel))] p-5 shadow-xl shadow-[color:var(--brand)]/10">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--brand-text)]">Resumo da venda</p><h2 className="mt-1 font-display text-xl font-bold">Finalizar com segurança</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><CircleDollarSign className="size-5" /></span></div>
            <div className="mt-5 space-y-3 border-y border-[color:var(--hairline)] py-4 text-sm"><Summary label="Subtotal" value={brl.format(subtotal)} /><Summary label="Desconto" value="R$ 0,00" /><Summary label="Cliente" value="Consumidor final" muted /><Summary label="Pagamento" value={payment || "Escolha na linha"} muted={!payment} /></div>
            <div className="mt-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">Total a receber</span><strong className="font-display text-3xl text-foreground">{brl.format(subtotal)}</strong></div>
            <Button className="mt-5 h-12 w-full rounded-xl bg-gradient-brand text-sm font-bold shadow-lg shadow-[color:var(--brand)]/30" disabled={!item || !subtotal || !payment} onClick={() => { setSales((current) => [{ quantity, item, payment, employee, profit, total: amount }, ...current]); setNotice("Prévia: a venda confirmada apareceu na tabela Vendas abaixo."); }}><Check className="mr-2 size-4" /> Confirmar venda</Button>
            {notice && <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-300">{notice}</div>}
          </Card>
          <Card className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Resultado estimado</h3><p className="text-xs text-muted-foreground">Informação interna — nunca enviada à IA.</p></div><ArrowDownRight className="size-5 text-emerald-400" /></div><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Custo" value={brl.format(estimatedCost)} /><MiniMetric label="Lucro bruto" value={brl.format(grossProfit)} accent /></div></Card>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
        <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-bold">Vendas do dia</h2><p className="text-sm text-muted-foreground">Histórico completo, auditável e filtrado pela data escolhida.</p></div><div className="flex items-center gap-1"><button type="button" className="rounded-lg border border-[color:var(--hairline)] p-2 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /></button><button type="button" className="rounded-lg border border-[color:var(--hairline)] p-2 text-muted-foreground hover:text-foreground"><ChevronRight className="size-4" /></button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[color:var(--panel-2)]/45 text-[11px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-5 py-3">Uni</th><th className="px-5 py-3">Pdt</th><th className="px-5 py-3">Pgto</th><th className="px-5 py-3">Funcio</th><th className="px-5 py-3 text-right">Lucro</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-[color:var(--hairline)]">{sales.map((row, index) => <tr key={`${row.item}-${index}`} className="transition hover:bg-[color:var(--brand-soft)]/25"><td className="px-5 py-4 font-semibold">{row.quantity}</td><td className="px-5 py-4 font-medium">{row.item}</td><td className="px-5 py-4"><Badge variant="outline" className="border-[color:var(--hairline-strong)] text-xs font-medium">{row.payment}</Badge></td><td className="px-5 py-4 text-muted-foreground">{row.employee}</td><td className="px-5 py-4 text-right font-semibold text-emerald-400">R$ {row.profit}</td><td className="px-5 py-4 text-right font-bold">R$ {row.total}</td></tr>)}</tbody></table></div>
        </Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Equipe hoje</h2><p className="text-sm text-muted-foreground">Diárias, vales e metas.</p></div><UsersRound className="size-5 text-[color:var(--brand-text)]" /></div><div className="mt-4 space-y-3">{[['Amanda', 'Diária', 'R$ 120,00', 'Desconta no lucro'], ['João', 'Vale', 'R$ 80,00', 'Adiantamento'], ['Alex', 'Meta', 'R$ 80,00', 'Desconta no lucro']].map(([name, type, value, detail]) => <div key={`${name}-${type}`} className="flex items-center gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel-2)]/25 p-3"><span className="grid size-9 place-items-center rounded-full bg-[color:var(--brand-soft)] text-xs font-bold text-[color:var(--brand-text)]">{name[0]}</span><div className="min-w-0 flex-1"><strong className="block text-sm">{name}</strong><span className="text-xs text-muted-foreground">{type} · {detail}</span></div><strong className="text-sm">{value}</strong></div>)}</div><Button variant="outline" className="mt-4 w-full border-[color:var(--hairline-strong)]">Gerenciar lançamentos</Button></Card>
      </section>
      <p className="text-center text-xs text-muted-foreground">Prévia visual — nenhuma venda, despesa ou estoque foi alterado.</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, footer, tone }: { icon: any; label: string; value: string; footer: string; tone?: "positive" | "primary" }) {
  return <Card className={`relative overflow-hidden p-4 ${tone === 'primary' ? 'border-[color:var(--brand-soft-strong)] bg-[color:var(--brand-soft)]/35' : ''}`}><Icon className={`absolute right-4 top-4 size-5 ${tone === 'positive' ? 'text-emerald-400' : 'text-[color:var(--brand-text)]'}`} /><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p><p className={`mt-2 text-xs ${tone === 'positive' ? 'text-emerald-400' : 'text-muted-foreground'}`}>{footer}</p></Card>;
}

function Summary({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className={muted ? 'text-muted-foreground' : 'font-semibold'}>{value}</span></div>;
}

function MiniMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-lg border p-3 ${accent ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-[color:var(--hairline)] bg-[color:var(--panel-2)]/35'}`}><p className="text-xs text-muted-foreground">{label}</p><strong className={`mt-1 block text-sm ${accent ? 'text-emerald-400' : ''}`}>{value}</strong></div>;
}

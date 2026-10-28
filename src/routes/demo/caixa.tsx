import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight, CalendarDays, Check, ChevronLeft, ChevronRight,
  CircleDollarSign, CreditCard, Minus, PackageSearch, Plus, Search,
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

type Product = { id: string; name: string; category: string; price: number; stock: number; accent: string };
type CartLine = Product & { quantity: number };

const products: Product[] = [
  { id: "iphone-13", name: "iPhone 13 128 GB", category: "Smartphones", price: 2899, stock: 3, accent: "from-violet-500 to-indigo-500" },
  { id: "redmi-note", name: "Redmi Note 13 Pro", category: "Smartphones", price: 1699, stock: 5, accent: "from-cyan-500 to-blue-600" },
  { id: "airpods", name: "AirPods Pro 2ª geração", category: "Áudio", price: 1249, stock: 4, accent: "from-slate-500 to-slate-800" },
  { id: "pelicula", name: "Película 3D Premium", category: "Acessórios", price: 59.9, stock: 18, accent: "from-amber-400 to-orange-500" },
  { id: "carregador", name: "Carregador Turbo 33W", category: "Acessórios", price: 89.9, stock: 9, accent: "from-emerald-400 to-teal-600" },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function CaixaPreview() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([...products.slice(0, 1).map((product) => ({ ...product, quantity: 1 }))]);
  const [payment, setPayment] = useState("PIX");
  const [notice, setNotice] = useState<string | null>(null);

  const found = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) || product.category.toLowerCase().includes(query.toLowerCase())).slice(0, 4), [query]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const estimatedCost = subtotal * 0.64;
  const grossProfit = subtotal - estimatedCost;

  const addProduct = (product: Product) => setCart((current) => {
    const existing = current.find((item) => item.id === product.id);
    if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item);
    return [...current, { ...product, quantity: 1 }];
  });

  const changeQuantity = (id: string, change: number) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item];
    const quantity = item.quantity + change;
    return quantity < 1 ? [] : [{ ...item, quantity: Math.min(quantity, item.stock) }];
  }));

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-[color:var(--brand-soft-strong)] bg-[radial-gradient(circle_at_85%_5%,color-mix(in_srgb,var(--brand)_28%,transparent),transparent_31%),linear-gradient(135deg,color-mix(in_srgb,var(--panel)_92%,var(--brand)_8%),var(--panel))] p-5 shadow-[0_25px_70px_-42px_rgba(75,50,190,.8)] md:p-6">
        <div className="pointer-events-none absolute right-[-54px] top-[-70px] size-56 rounded-full bg-[color:var(--brand)] opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[color:var(--brand-text)]"><Sparkles className="size-3.5" /> Experiência de caixa</div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Vender ficou simples. <span className="text-gradient-brand">Controlar, melhor ainda.</span></h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Prévia navegável: lançamento de venda por busca, carrinho, pagamento, equipe e indicadores reais do período.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel)]/75 p-1.5 backdrop-blur">
            {['Hoje', 'Semana', 'Mês', 'Período'].map((period, index) => <button key={period} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${index === 0 ? 'bg-[color:var(--brand)] text-white shadow-lg shadow-[color:var(--brand)]/30' : 'text-muted-foreground hover:bg-[color:var(--panel-2)] hover:text-foreground'}`}>{period}</button>)}
            <span className="ml-1 flex items-center gap-1.5 border-l border-[color:var(--hairline)] pl-3 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> 28 out. 2026</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={WalletCards} label="Vendas confirmadas" value="R$ 4.287,90" footer="12 vendas · +18,4%" tone="positive" />
        <Metric icon={PackageSearch} label="Custo dos produtos" value="R$ 2.603,18" footer="60,7% da receita" />
        <Metric icon={UsersRound} label="Equipe hoje" value="R$ 280,00" footer="2 diárias · 1 vale" />
        <Metric icon={CircleDollarSign} label="Lucro líquido" value="R$ 1.404,72" footer="Margem líquida 32,7%" tone="primary" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(330px,.58fr)]">
        <Card className="overflow-hidden border-[color:var(--hairline-strong)] bg-[color:var(--panel)]/80 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><ShoppingBag className="size-4" /></span><h2 className="font-display text-xl font-bold">Nova venda</h2></div><p className="mt-1 text-sm text-muted-foreground">Pesquise, adicione ao carrinho e confirme em poucos cliques.</p></div>
            <Badge className="w-fit border-0 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" /> Caixa aberto</Badge>
          </div>
          <div className="p-5">
            <label className="group relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-[color:var(--brand-text)]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto, SKU ou código de barras…" className="h-14 rounded-xl border-[color:var(--hairline-strong)] bg-[color:var(--panel-2)] pl-12 text-base shadow-inner" />
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[color:var(--hairline-strong)] bg-[color:var(--panel)] px-2 py-1 text-[10px] text-muted-foreground sm:block">⌘ K</kbd>
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {found.map((product) => <button type="button" key={product.id} onClick={() => addProduct(product)} className="group flex items-center gap-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--panel-2)]/35 p-3 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--brand-soft-strong)] hover:bg-[color:var(--brand-soft)]/35">
                <span className={`grid size-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${product.accent} text-white shadow-lg`}><Smartphone className="size-5" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{product.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{product.category} · {product.stock} em estoque</span></span>
                <span className="text-right"><strong className="block text-sm">{brl.format(product.price)}</strong><Plus className="ml-auto mt-1 size-4 text-[color:var(--brand-text)] transition group-hover:scale-110" /></span>
              </button>)}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[color:var(--hairline)]">
              <div className="flex items-center justify-between border-b border-[color:var(--hairline)] bg-[color:var(--panel-2)]/55 px-4 py-3"><div><strong className="text-sm">Itens da venda</strong><span className="ml-2 text-xs text-muted-foreground">{cart.length || 'Nenhum'} produto{cart.length === 1 ? '' : 's'}</span></div><button type="button" onClick={() => setCart([])} className="text-xs font-semibold text-muted-foreground hover:text-rose-400">Limpar carrinho</button></div>
              {cart.length ? <div className="divide-y divide-[color:var(--hairline)]">{cart.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${item.accent} text-white`}><Smartphone className="size-4" /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.name}</strong><span className="text-xs text-muted-foreground">{brl.format(item.price)} por unidade</span></span>
                <div className="flex items-center rounded-lg border border-[color:var(--hairline-strong)] bg-[color:var(--panel)]"><button type="button" onClick={() => changeQuantity(item.id, -1)} className="p-2 text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button><span className="w-7 text-center text-sm font-semibold">{item.quantity}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} className="p-2 text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button></div>
                <strong className="w-24 text-right text-sm">{brl.format(item.price * item.quantity)}</strong>
                <button type="button" aria-label={`Remover ${item.name}`} onClick={() => setCart((current) => current.filter((product) => product.id !== item.id))} className="text-muted-foreground hover:text-rose-400"><Trash2 className="size-4" /></button>
              </div>)}</div> : <div className="grid min-h-40 place-items-center px-6 text-center"><div><PackageSearch className="mx-auto mb-2 size-7 text-muted-foreground" /><p className="text-sm font-medium">Comece buscando um produto acima</p><p className="mt-1 text-xs text-muted-foreground">Nada é confirmado até você finalizar a venda.</p></div></div>}
            </div>
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="overflow-hidden border-[color:var(--brand-soft-strong)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--panel)_88%,var(--brand)_12%),var(--panel))] p-5 shadow-xl shadow-[color:var(--brand)]/10">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--brand-text)]">Resumo da venda</p><h2 className="mt-1 font-display text-xl font-bold">Finalizar com segurança</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]"><CircleDollarSign className="size-5" /></span></div>
            <div className="mt-5 space-y-3 border-y border-[color:var(--hairline)] py-4 text-sm"><Summary label="Subtotal" value={brl.format(subtotal)} /><Summary label="Desconto" value="R$ 0,00" /><Summary label="Cliente" value="Consumidor final" muted /></div>
            <div className="mt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-muted-foreground">Forma de pagamento</p><div className="grid grid-cols-3 gap-2">{['PIX', 'Crédito', 'Dinheiro'].map((method) => <button key={method} type="button" onClick={() => setPayment(method)} className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition ${payment === method ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-text)]' : 'border-[color:var(--hairline)] bg-[color:var(--panel-2)]/30 text-muted-foreground hover:text-foreground'}`}>{method === 'Crédito' ? <CreditCard className="mx-auto mb-1 size-4" /> : method === 'PIX' ? <Sparkles className="mx-auto mb-1 size-4" /> : <WalletCards className="mx-auto mb-1 size-4" />}{method}</button>)}</div></div>
            <div className="mt-5 flex items-end justify-between"><span className="text-sm text-muted-foreground">Total a receber</span><strong className="font-display text-3xl text-foreground">{brl.format(subtotal)}</strong></div>
            <Button className="mt-5 h-12 w-full rounded-xl bg-gradient-brand text-sm font-bold shadow-lg shadow-[color:var(--brand)]/30" disabled={!cart.length} onClick={() => setNotice("Prévia: no produto final, esta ação confirma a venda, cria a auditoria e atualiza o estoque.")}><Check className="mr-2 size-4" /> Confirmar venda via {payment}</Button>
            {notice && <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-300">{notice}</div>}
          </Card>
          <Card className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Resultado estimado</h3><p className="text-xs text-muted-foreground">Informação interna — nunca enviada à IA.</p></div><ArrowDownRight className="size-5 text-emerald-400" /></div><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Custo" value={brl.format(estimatedCost)} /><MiniMetric label="Lucro bruto" value={brl.format(grossProfit)} accent /></div></Card>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
        <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[color:var(--hairline)] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-xl font-bold">Vendas do dia</h2><p className="text-sm text-muted-foreground">Histórico completo, auditável e filtrado pela data escolhida.</p></div><div className="flex items-center gap-1"><button type="button" className="rounded-lg border border-[color:var(--hairline)] p-2 text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /></button><button type="button" className="rounded-lg border border-[color:var(--hairline)] p-2 text-muted-foreground hover:text-foreground"><ChevronRight className="size-4" /></button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[color:var(--panel-2)]/45 text-[11px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-5 py-3">Qtd</th><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Vendedor</th><th className="px-5 py-3">Forma pagamento</th><th className="px-5 py-3 text-right">Lucro</th><th className="px-5 py-3 text-right">Custo</th><th className="px-5 py-3 text-right">Venda</th></tr></thead><tbody className="divide-y divide-[color:var(--hairline)]">{[
            ['1', 'iPhone 13 128 GB', 'Alex', 'PIX', 'R$ 1.050,00', 'R$ 1.849,00', 'R$ 2.899,00'],
            ['2', 'Película 3D Premium', 'Amanda', 'Crédito', 'R$ 68,00', 'R$ 51,80', 'R$ 119,80'],
            ['1', 'Carregador Turbo 33W', 'Alex', 'Dinheiro', 'R$ 34,90', 'R$ 55,00', 'R$ 89,90'],
          ].map((row) => <tr key={row[1]} className="transition hover:bg-[color:var(--brand-soft)]/25"><td className="px-5 py-4 font-semibold">{row[0]}</td><td className="px-5 py-4 font-medium">{row[1]}</td><td className="px-5 py-4 text-muted-foreground">{row[2]}</td><td className="px-5 py-4"><Badge variant="outline" className="border-[color:var(--hairline-strong)] text-xs font-medium">{row[3]}</Badge></td><td className="px-5 py-4 text-right font-semibold text-emerald-400">{row[4]}</td><td className="px-5 py-4 text-right text-muted-foreground">{row[5]}</td><td className="px-5 py-4 text-right font-bold">{row[6]}</td></tr>)}</tbody></table></div>
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

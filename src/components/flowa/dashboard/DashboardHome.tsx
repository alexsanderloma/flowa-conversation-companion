import { useState } from "react";
import { ArrowUpRight, Bot, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { chartData, inboxMessages, kpis, periods, priorities, type Period, type ViewId } from "./data";

const toneClass: Record<string, string> = {
  alert: "text-destructive",
  accent: "text-accent",
  mint: "text-mint",
};

function IllustrativeTag({ className = "" }: { className?: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase ${className}`}>
      Ilustrativo
    </span>
  );
}

export function DashboardHome({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const [period, setPeriod] = useState<Period>("hoje");
  const chart = chartData[period];
  const max = Math.max(...chart.points.map((p) => p.value));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section aria-label="Indicadores principais" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="shadow-card rounded-2xl border bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <IllustrativeTag />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{kpi.value[period]}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TrendingUp className="size-3 text-mint" /> {kpi.hint}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Gráfico */}
        <section aria-label="Gráfico de atendimentos" className="shadow-card rounded-2xl border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Atendimentos</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{chart.caption}</p>
            </div>
            <div className="flex items-center gap-2">
              <div role="group" aria-label="Selecionar período" className="flex rounded-full border bg-muted p-0.5">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    aria-pressed={period === p.id}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      period === p.id ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <IllustrativeTag className="hidden sm:inline-block" />
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label={`${chart.caption}. Valores ilustrativos.`}>
            {chart.points.map((point) => (
              <div key={point.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  {point.value}
                </span>
                <div
                  className="bg-brand w-full max-w-10 rounded-t-md opacity-85 transition group-hover:opacity-100"
                  style={{ height: `${Math.max((point.value / max) * 100, 4)}%` }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Prioridades */}
        <section aria-label="Prioridades de hoje" className="shadow-card rounded-2xl border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Prioridades hoje</h2>
            <IllustrativeTag />
          </div>
          <ul className="mt-4 space-y-3">
            {priorities.map((p) => (
              <li key={p.title}>
                <button
                  type="button"
                  onClick={() => onNavigate("conversas")}
                  className="hover:bg-surface-2 group flex w-full items-center gap-3 rounded-xl border bg-muted/40 p-3 text-left transition"
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-mono text-sm font-semibold ${toneClass[p.tone]}`}>
                    {p.count}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{p.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{p.detail}</span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 border-t pt-4 text-[11px] text-muted-foreground">
            <Clock3 className="size-3 text-accent" /> Atualizado em tempo real na versão conectada.
          </p>
        </section>
      </div>

      {/* Últimas mensagens */}
      <section aria-label="Últimas mensagens" className="shadow-card rounded-2xl border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Últimas mensagens</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Caixa de entrada do WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <IllustrativeTag />
            <button
              type="button"
              onClick={() => onNavigate("conversas")}
              className="rounded-full border px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            >
              Ver todas
            </button>
          </div>
        </div>
        <ul className="mt-4 divide-y">
          {inboxMessages.map((m) => (
            <li key={m.name}>
              <button
                type="button"
                onClick={() => onNavigate("conversas")}
                className="hover:bg-surface-2 -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {m.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">{m.name}</span>
                    {m.unread && <span className="size-1.5 shrink-0 rounded-full bg-mint" aria-label="não lida" />}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{m.preview}</span>
                </span>
                <span className="shrink-0 rounded-sm bg-primary/15 px-1.5 py-0.5 text-[9px] text-primary-glow">{m.tag}</span>
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">{m.time}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 border-t pt-4 text-[11px] text-muted-foreground">
          <Bot className="size-3.5 text-accent" />
          <Sparkles className="size-3 text-primary-glow" /> A IA da FLOWA responde, qualifica e organiza cada conversa.
        </p>
      </section>
    </div>
  );
}

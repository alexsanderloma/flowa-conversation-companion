import { useEffect, useState } from "react";
import { Bot, CheckCheck, Search, Sparkles, Tag, User } from "lucide-react";

const contacts = [
  { name: "Marina C.", msg: "Vocês têm horário amanhã?", tag: "Novo lead", active: true },
  { name: "Rafael T.", msg: "Pedido confirmado, obrigado!", tag: "Cliente" },
  { name: "Clínica Sol", msg: "Quero saber sobre valores", tag: "Proposta" },
  { name: "João P.", msg: "Pode me chamar às 15h?", tag: "Humano" },
];

const script = [
  { from: "in", text: "Oi! Vocês têm horário disponível amanhã à tarde?" },
  { from: "out", text: "Olá, Marina! Temos sim 😊 Às 14h ou às 16h30. Qual prefere?" },
  { from: "in", text: "16h30, por favor." },
  { from: "out", text: "Perfeito! Reservei 16h30 para você. Quer receber um lembrete amanhã?" },
] as const;

export function DashboardMockup() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (count >= script.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), 1800);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div
      role="img"
      aria-label="Ilustração do painel FLOWA com conversas de WhatsApp atendidas por IA"
      className="relative"
    >
      <div className="absolute -inset-8 bg-aura blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border bg-surface shadow-elegant">
        {/* barra */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">FLOWA AI · Painel</span>
          <span className="rounded-full border px-2 py-0.5 font-mono text-[9px] text-muted-foreground">Ilustrativo</span>
        </div>

        <div className="grid grid-cols-12">
          {/* lista */}
          <aside className="col-span-4 hidden border-r sm:block">
            <div className="m-3 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <Search className="size-3" /> Buscar conversa
            </div>
            <ul>
              {contacts.map((c) => (
                <li
                  key={c.name}
                  className={`flex gap-2 px-3 py-2.5 ${c.active ? "bg-surface-2" : ""}`}
                >
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold">
                    {c.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium">{c.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{c.msg}</p>
                    <span className="mt-1 inline-block rounded-sm bg-primary/15 px-1.5 text-[9px] text-primary-glow">{c.tag}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* chat */}
          <div className="col-span-12 flex min-h-[340px] flex-col sm:col-span-8">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-full bg-muted text-[10px] font-semibold">M</div>
                <div>
                  <p className="text-xs font-medium">Marina C.</p>
                  <p className="text-[10px] text-mint">● WhatsApp · online</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[10px] text-accent">
                <Bot className="size-3" /> IA ativa
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4" aria-live="polite">
              {script.slice(0, count).map((m, i) => (
                <div
                  key={i}
                  className={`animate-rise max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${
                    m.from === "in" ? "self-start rounded-bl-sm bg-bubble-in" : "self-end rounded-br-sm bg-bubble-out"
                  }`}
                >
                  {m.text}
                  {m.from === "out" && (
                    <span className="mt-1 flex items-center justify-end gap-1 text-[9px] text-foreground/60">
                      <Sparkles className="size-2.5" /> FLOWA AI <CheckCheck className="size-3" />
                    </span>
                  )}
                </div>
              ))}
              {count < script.length && (
                <div className="flex gap-1 self-start rounded-2xl bg-bubble-in px-3 py-2.5" aria-hidden>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="animate-typing size-1.5 rounded-full bg-foreground" style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
            <div className="m-3 rounded-lg border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
              Responder ou deixar a IA continuar…
            </div>
          </div>
        </div>
      </div>

      {/* cartões flutuantes */}
      <div className="animate-float glass absolute -bottom-6 -left-4 hidden w-48 rounded-xl border p-3 shadow-card md:block">
        <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Exemplo · hoje</p>
        <p className="mt-1 text-2xl font-semibold">128</p>
        <p className="text-[11px] text-muted-foreground">conversas atendidas</p>
        <div className="mt-2 flex h-8 items-end gap-1" aria-hidden>
          {[30, 55, 40, 70, 60, 85, 75].map((h, i) => (
            <div key={i} className="w-full rounded-t-sm bg-brand" style={{ height: `${h * 0.32}px` }} />
          ))}
        </div>
      </div>
      <div className="animate-float glass absolute -top-5 -right-3 hidden w-52 rounded-xl border p-3 shadow-card md:block" style={{ animationDelay: "1.5s" }}>
        <div className="flex items-center gap-2 text-[11px]">
          <Tag className="size-3.5 text-accent" /> Lead qualificado
        </div>
        <div className="mt-2 flex items-center gap-2">
          <User className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Marina · Agendamento</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/4 bg-brand" />
        </div>
      </div>
    </div>
  );
}

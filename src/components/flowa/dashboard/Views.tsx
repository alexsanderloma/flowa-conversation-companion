import { Bot, CheckCheck, Plug, Search, Sparkles } from "lucide-react";
import { demoChat, inboxMessages, viewMeta, type ViewId } from "./data";

export function ConversasView() {
  return (
    <div className="shadow-card grid overflow-hidden rounded-2xl border bg-surface lg:grid-cols-[320px_1fr]">
      <aside className="border-b lg:border-r lg:border-b-0">
        <div className="m-3 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <Search className="size-3" /> Buscar conversa
        </div>
        <ul>
          {inboxMessages.map((m, i) => (
            <li key={m.name} className={`flex gap-2 px-3 py-2.5 ${i === 0 ? "bg-surface-2" : ""}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">{m.name[0]}</span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{m.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{m.preview}</span>
                <span className="mt-1 inline-block rounded-sm bg-primary/15 px-1.5 text-[9px] text-primary-glow">{m.tag}</span>
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{m.time}</span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-h-[420px] flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-muted text-[10px] font-semibold">M</span>
            <div>
              <p className="text-xs font-medium">Marina C.</p>
              <p className="text-[10px] text-muted-foreground">WhatsApp · demonstração</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[10px] text-accent">
            <Bot className="size-3" /> IA ativa
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {demoChat.map((m, i) => (
            <div
              key={i}
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${
                m.from === "in" ? "self-start rounded-bl-sm bg-bubble-in" : "self-end rounded-br-sm bg-bubble-out"
              }`}
            >
              {m.text}
              <span className="mt-1 flex items-center justify-end gap-1 text-[9px] text-foreground/60">
                {m.from === "out" && (
                  <>
                    <Sparkles className="size-2.5" /> FLOWA AI <CheckCheck className="size-3" />
                  </>
                )}
                {m.time}
              </span>
            </div>
          ))}
        </div>
        <div className="m-3 rounded-lg border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          Responder ou deixar a IA continuar…
        </div>
      </div>
    </div>
  );
}

export function PlaceholderView({ view }: { view: ViewId }) {
  const meta = viewMeta[view];
  return (
    <section className="shadow-card grid min-h-[420px] place-items-center rounded-2xl border bg-surface p-8 text-center">
      <div className="max-w-md">
        <span className="bg-brand mx-auto grid size-12 place-items-center rounded-2xl shadow-elegant">
          <Plug className="size-5 text-primary-foreground" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">{meta.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        <p className="mt-5 rounded-xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          Esta área está em modo demonstração. Os dados reais aparecem aqui quando o workspace estiver conectado ao
          WhatsApp e ao sistema FLOWA.
        </p>
        <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Tela ilustrativa · sem dados reais</p>
      </div>
    </section>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, MessageSquareText, X } from "lucide-react";
import { navSections, viewMeta, type ViewId } from "./data";
import { DashboardHome } from "./DashboardHome";
import { ConversasView, PlaceholderView } from "./Views";

function SidebarContent({ active, onSelect }: { active: ViewId; onSelect: (v: ViewId) => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5" aria-label="FLOWA — voltar ao site">
        <span className="bg-brand grid size-8 place-items-center rounded-lg shadow-elegant">
          <MessageSquareText className="size-4 text-primary-foreground" />
        </span>
        <span className="text-lg font-semibold">FLOWA</span>
        <span className="ml-auto rounded-full border px-2 py-0.5 font-mono text-[9px] text-muted-foreground">Demo</span>
      </Link>
      <nav aria-label="Seções do painel" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active === item.id ? "page" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                      active === item.id
                        ? "bg-surface-2 font-medium text-foreground shadow-card"
                        : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`size-4 ${active === item.id ? "text-primary-glow" : ""}`} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="rounded-xl border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <span className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <span className="size-1.5 rounded-full bg-destructive" /> WhatsApp desconectado
          </span>
          A conexão real é ativada na integração ao sistema existente.
        </div>
      </div>
    </div>
  );
}

export function DashboardShell() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const select = (v: ViewId) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <div lang="pt-BR" className="min-h-svh bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-surface/60 lg:block">
        <SidebarContent active={view} onSelect={select} />
      </aside>

      {/* Sidebar mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside className="glass absolute inset-y-0 left-0 w-72 border-r">
            <button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="absolute top-4 right-3 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
              <X className="size-4" />
            </button>
            <SidebarContent active={view} onSelect={select} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="glass sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 sm:px-6">
          <button type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground lg:hidden">
            <Menu className="size-5" />
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs font-medium">
            Estúdio Aurora <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-destructive" /> WhatsApp desconectado
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" aria-label="Notificações" className="relative rounded-lg p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-mint" />
            </button>
            <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-semibold text-primary-foreground" aria-label="Perfil de demonstração">
              A
            </span>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="relative isolate px-4 py-6 sm:px-6 lg:px-8">
          <div className="bg-aura pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{viewMeta[view].title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{viewMeta[view].description}</p>
            </div>
            <span className="rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Dados ilustrativos
            </span>
          </div>
          {view === "dashboard" ? (
            <DashboardHome onNavigate={select} />
          ) : view === "conversas" ? (
            <ConversasView />
          ) : (
            <PlaceholderView view={view} />
          )}
        </main>
      </div>
    </div>
  );
}

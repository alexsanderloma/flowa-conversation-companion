import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Bot, MessageSquareText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessLayout({ children, registration = false }: { children: ReactNode; registration?: boolean }) {
  return (
    <main lang="pt-BR" className="relative isolate min-h-svh overflow-hidden bg-background">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="bg-aura pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 md:py-8">
        <Link to="/" className="flex items-center gap-2" aria-label="FLOWA — início">
          <span className="grid size-8 place-items-center rounded-lg bg-brand shadow-elegant"><MessageSquareText className="size-4 text-primary-foreground" /></span>
          <span className="text-lg font-semibold">FLOWA</span>
        </Link>
        <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground">
          <Link to="/"><ArrowLeft /> <span className="hidden sm:inline">Voltar ao site</span><span className="sm:hidden">Início</span></Link>
        </Button>
      </header>
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-8 pb-12 md:pt-12 lg:min-h-[calc(100svh-112px)] lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:py-16">
        <section className="animate-rise max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border bg-surface/60 px-3 py-1 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-accent" /> FLOWA AI · Gestão de WhatsApp com IA</span>
          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold sm:text-5xl xl:text-6xl">
            {registration ? "O próximo passo da sua empresa." : "Seu atendimento. Um novo ritmo."}
            <span className="mt-2 block font-display font-normal italic text-gradient">{registration ? "Começa com uma conversa." : "Com a inteligência da FLOWA."}</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">Respostas com IA, conversas organizadas e sua equipe no controle. Um novo jeito de cuidar de cada contato no WhatsApp.</p>
          <div className="mt-10 hidden max-w-md border-l border-primary/40 pl-6 lg:block">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Bot className="size-4 text-accent" /> Uma conversa com a FLOWA <span className="ml-auto font-mono text-[10px]">Ilustrativo</span></div>
            <div className="mt-5 space-y-3 text-sm">
              <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm border bg-bubble-in px-4 py-3">Olá! Quero conhecer melhor a FLOWA.</p>
              <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-tr-sm border border-primary/30 bg-bubble-out px-4 py-3 leading-relaxed">Olá! Vamos conversar sobre o atendimento da sua empresa?</p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-accent"><span className="size-1.5 rounded-full bg-mint" /> Inteligência que aproxima.</div>
          </div>
        </section>
        <section aria-label={registration ? "Demonstração de cadastro" : "Demonstração de login"} className="animate-rise mx-auto w-full max-w-[480px] lg:justify-self-end">
          <div className="glass rounded-2xl border p-6 shadow-elegant sm:p-9">{children}</div>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><ArrowUpRight className="size-3.5 shrink-0 text-accent" /> FLOWA · Inteligência no atendimento.</p>
        </section>
      </div>
    </main>
  );
}
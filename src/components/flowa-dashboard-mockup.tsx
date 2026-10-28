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

/** Visual demonstrativo. Não representa nem altera conversas reais. */
export function FlowaDashboardMockup() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (count >= script.length) return;
    const timer = window.setTimeout(() => setCount((current) => current + 1), 1800);
    return () => window.clearTimeout(timer);
  }, [count]);

  return <div role="img" aria-label="Ilustração do painel FLOWA com conversas atendidas por IA" className="fx-mockup">
    <div className="fx-mockup-aura" aria-hidden="true" />
    <div className="fx-mockup-window"><div className="fx-mockup-bar"><div className="fx-mockup-dots" aria-hidden="true"><span /><span /><span /></div><span className="fx-mockup-title">FLOWA AI · PAINEL</span><span className="fx-mockup-demo">Ilustrativo</span></div>
      <div className="fx-mockup-body"><aside className="fx-mockup-list"><div className="fx-mockup-search"><Search size={12} /> Buscar conversa</div><ul>{contacts.map((contact) => <li key={contact.name} className={contact.active ? "is-active" : ""}><span className="fx-mockup-avatar">{contact.name[0]}</span><span className="fx-mockup-contact"><b>{contact.name}</b><small>{contact.msg}</small><i>{contact.tag}</i></span></li>)}</ul></aside>
        <div className="fx-mockup-chat"><div className="fx-mockup-chat-head"><span className="fx-mockup-avatar">M</span><span><b>Marina C.</b><small>● WhatsApp · online</small></span><em><Bot size={12} /> IA ativa</em></div><div className="fx-messages" aria-live="polite">{script.slice(0, count).map((message, index) => <div key={index} className={`fx-message ${message.from === "out" ? "is-out" : "is-in"}`}>{message.text}{message.from === "out" && <span><Sparkles size={10} /> FLOWA AI <CheckCheck size={11} /></span>}</div>)}{count < script.length && <div className="fx-typing" aria-hidden="true"><i /><i /><i /></div>}</div><div className="fx-mockup-input">Responder ou deixar a IA continuar…</div></div>
      </div></div>
    <div className="fx-floating-card fx-floating-metric"><small>EXEMPLO · HOJE</small><b>128</b><span>conversas atendidas</span><div>{[30, 55, 40, 70, 60, 85, 75].map((height, index) => <i key={index} style={{ height: `${height * .32}px` }} />)}</div></div>
    <div className="fx-floating-card fx-floating-lead"><p><Tag size={14} /> Lead qualificado</p><span><User size={13} /> Marina · Agendamento</span><div><i /></div></div>
  </div>;
}

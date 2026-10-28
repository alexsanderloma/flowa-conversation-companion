import {
  BarChart3,
  Bot,
  CalendarClock,
  ClipboardList,
  CreditCard,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Plug,
  Settings,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type ViewId =
  | "dashboard"
  | "conversas"
  | "kanban"
  | "campanhas"
  | "agente"
  | "contatos"
  | "fornecedores"
  | "financeiro"
  | "relatorios"
  | "conexao"
  | "equipe"
  | "integracoes"
  | "configuracoes"
  | "planos";

export interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Atendimento",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "conversas", label: "Conversas", icon: MessageSquareText },
      { id: "kanban", label: "CRM Kanban", icon: KanbanSquare },
      { id: "campanhas", label: "Campanhas", icon: Megaphone },
      { id: "agente", label: "Agente IA", icon: Bot },
    ],
  },
  {
    title: "Gestão",
    items: [
      { id: "contatos", label: "Contatos", icon: UsersRound },
      { id: "fornecedores", label: "Fornecedores", icon: ClipboardList },
      { id: "financeiro", label: "Financeiro", icon: Wallet },
      { id: "relatorios", label: "Relatórios", icon: BarChart3 },
      { id: "conexao", label: "Conexão", icon: Plug },
      { id: "equipe", label: "Equipe", icon: UserRound },
      { id: "integracoes", label: "Integrações", icon: CalendarClock },
      { id: "configuracoes", label: "Configurações", icon: Settings },
    ],
  },
  {
    title: "Assinatura",
    items: [{ id: "planos", label: "Planos", icon: CreditCard }],
  },
];

export const viewMeta: Record<ViewId, { title: string; description: string }> = {
  dashboard: { title: "Dashboard", description: "Visão geral do atendimento" },
  conversas: { title: "Conversas", description: "Caixa de entrada do WhatsApp" },
  kanban: { title: "CRM Kanban", description: "Funil de negociações em etapas" },
  campanhas: { title: "Campanhas", description: "Envios programados para sua base" },
  agente: { title: "Agente IA", description: "Personalidade e regras da sua IA" },
  contatos: { title: "Contatos", description: "Base de clientes e leads" },
  fornecedores: { title: "Fornecedores", description: "Parceiros e cadeia de suprimentos" },
  financeiro: { title: "Financeiro", description: "Receitas, cobranças e repasses" },
  relatorios: { title: "Relatórios", description: "Análises detalhadas de desempenho" },
  conexao: { title: "Conexão", description: "Vínculo do número de WhatsApp" },
  equipe: { title: "Equipe", description: "Atendentes e permissões" },
  integracoes: { title: "Integrações", description: "Ferramentas conectadas à FLOWA" },
  configuracoes: { title: "Configurações", description: "Preferências do workspace" },
  planos: { title: "Planos", description: "Sua assinatura FLOWA" },
};

export type Period = "hoje" | "7d" | "30d";

export const periods: { id: Period; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

export interface Kpi {
  label: string;
  value: Record<Period, string>;
  hint: string;
}

export const kpis: Kpi[] = [
  {
    label: "Conversas",
    value: { hoje: "128", "7d": "842", "30d": "3.416" },
    hint: "atendimentos iniciados",
  },
  {
    label: "Resolvidas pela IA",
    value: { hoje: "96", "7d": "631", "30d": "2.540" },
    hint: "sem intervenção humana",
  },
  {
    label: "Em negociação",
    value: { hoje: "14", "7d": "22", "30d": "31" },
    hint: "leads ativos no funil",
  },
  {
    label: "Receita",
    value: { hoje: "R$ 4.280", "7d": "R$ 27.940", "30d": "R$ 112.300" },
    hint: "pedidos fechados no período",
  },
];

export interface ChartPoint {
  label: string;
  value: number;
}

export const chartData: Record<Period, { points: ChartPoint[]; caption: string }> = {
  hoje: {
    caption: "Atendimentos por hora · hoje",
    points: [
      { label: "8h", value: 6 },
      { label: "9h", value: 14 },
      { label: "10h", value: 22 },
      { label: "11h", value: 18 },
      { label: "12h", value: 9 },
      { label: "13h", value: 12 },
      { label: "14h", value: 26 },
      { label: "15h", value: 21 },
    ],
  },
  "7d": {
    caption: "Atendimentos por dia · últimos 7 dias",
    points: [
      { label: "Seg", value: 118 },
      { label: "Ter", value: 132 },
      { label: "Qua", value: 96 },
      { label: "Qui", value: 141 },
      { label: "Sex", value: 154 },
      { label: "Sáb", value: 73 },
      { label: "Dom", value: 128 },
    ],
  },
  "30d": {
    caption: "Atendimentos por semana · últimos 30 dias",
    points: [
      { label: "Sem 1", value: 712 },
      { label: "Sem 2", value: 845 },
      { label: "Sem 3", value: 901 },
      { label: "Sem 4", value: 958 },
    ],
  },
};

export interface Priority {
  title: string;
  detail: string;
  count: number;
  tone: "alert" | "accent" | "mint";
}

export const priorities: Priority[] = [
  { title: "Conversas paradas +1h", detail: "clientes aguardando retorno", count: 3, tone: "alert" },
  { title: "Follow-ups de hoje", detail: "propostas para reativar", count: 5, tone: "accent" },
  { title: "Leads novos", detail: "chegaram nas últimas horas", count: 8, tone: "mint" },
];

export interface InboxMessage {
  name: string;
  preview: string;
  time: string;
  tag: string;
  unread?: boolean;
}

export const inboxMessages: InboxMessage[] = [
  { name: "Marina C.", preview: "16h30, por favor.", time: "14:32", tag: "Agendamento", unread: true },
  { name: "Rafael T.", preview: "Pedido confirmado, obrigado!", time: "14:05", tag: "Cliente" },
  { name: "Clínica Sol", preview: "Quero saber sobre valores", time: "13:48", tag: "Proposta", unread: true },
  { name: "João P.", preview: "Pode me chamar às 15h?", time: "13:12", tag: "Humano" },
  { name: "Padoca Central", preview: "Fecha o pedido de sexta?", time: "12:57", tag: "Recorrente" },
];

export interface DemoChatMessage {
  from: "in" | "out";
  text: string;
  time: string;
}

export const demoChat: DemoChatMessage[] = [
  { from: "in", text: "Oi! Vocês têm horário disponível amanhã à tarde?", time: "14:28" },
  { from: "out", text: "Olá, Marina! Temos sim 😊 Às 14h ou às 16h30. Qual prefere?", time: "14:28" },
  { from: "in", text: "16h30, por favor.", time: "14:32" },
  { from: "out", text: "Perfeito! Reservei 16h30 para você. Quer receber um lembrete amanhã?", time: "14:32" },
];

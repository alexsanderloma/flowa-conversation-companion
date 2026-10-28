// Configurações editáveis do protótipo FLOWA.
export const siteConfig = {
  name: "FLOWA",
  domain: "flowa.store",
  /** Link do botão "Entrar" — substitua pela URL real do painel. */
  loginUrl: "/entrar",
  /** E-mail que recebe os pedidos de demonstração (via mailto, sem servidor). */
  contactEmail: "contato@flowa.store",
  plans: [
    {
      name: "Starter",
      capacity: 1000,
      desc: "Para empresas que estão começando a usar IA no atendimento pelo WhatsApp.",
      features: [
        "Respostas com IA para dúvidas frequentes",
        "Visualização de conversas no painel",
        "Histórico de atendimento por contato",
        "Até 1.000 respostas da IA/mês",
      ],
    },
    {
      name: "Pro",
      capacity: 5000,
      desc: "Para empresas que querem profissionalizar o atendimento no WhatsApp com IA.",
      features: [
        "Respostas com IA para dúvidas frequentes",
        "Consultas da IA sobre produtos e serviços",
        "Organização de leads no painel",
        "Até 5.000 respostas da IA/mês",
      ],
    },
    {
      name: "Pro Plus",
      capacity: 10000,
      desc: "Para operações com um fluxo maior de contatos no dia a dia.",
      features: [
        "Respostas com IA para dúvidas frequentes",
        "Consultas da IA sobre produtos e serviços",
        "Atendimento a um maior fluxo de contatos",
        "Até 10.000 respostas da IA/mês",
      ],
    },
    {
      name: "Business",
      capacity: 30000,
      desc: "Para operações com alto volume de conversas e equipes maiores.",
      highlight: true,
      features: [
        "Respostas com IA para dúvidas frequentes",
        "Consultas da IA sobre produtos e serviços",
        "Gestão de alto volume de conversas",
        "Até 30.000 respostas da IA/mês",
      ],
    },
  ],
  /**
   * Valores de referência INTERNOS (conhecimento de negócio).
   * NÃO exibir na página — o design comercial atual mostra apenas "Consultar condições".
   */
  internalPrices: {
    Starter: "R$ 99,90",
    Pro: "R$ 199,90",
    "Pro Plus": "R$ 299,90",
    Business: "R$ 499,90",
  } as Record<string, string>,
} as const;

-- FLOWA baseline reconstructed from the former project.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public."app_role" AS ENUM ('super_admin');
CREATE TYPE public."campaign_status" AS ENUM ('rascunho', 'agendada', 'enviando', 'pausada', 'concluida', 'cancelada');
CREATE TYPE public."campaign_target_status" AS ENUM ('pendente', 'enviado', 'falhou', 'pulado');
CREATE TYPE public."fin_forma" AS ENUM ('pix', 'boleto', 'cartao', 'dinheiro', 'transferencia', 'outro');
CREATE TYPE public."fin_status" AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE public."fin_tipo" AS ENUM ('receita', 'despesa');
CREATE TYPE public."stage_tipo" AS ENUM ('normal', 'ganho', 'perda');
CREATE TYPE public."tenant_role" AS ENUM ('owner', 'admin', 'atendente');

CREATE TABLE public.agendamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  card_id uuid,
  titulo text NOT NULL,
  inicio timestamp with time zone NOT NULL,
  fim timestamp with time zone NOT NULL,
  google_event_id text,
  status text NOT NULL DEFAULT 'agendado'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_config (
  user_id uuid NOT NULL,
  nome_agente text NOT NULL DEFAULT 'Atendente Virtual'::text,
  nome_empresa text NOT NULL DEFAULT ''::text,
  papel_objetivo text NOT NULL DEFAULT 'Atender clientes, tirar dúvidas e ajudar a fechar vendas.'::text,
  estilo_comunicacao text NOT NULL DEFAULT 'Cordial, profissional e objetivo. Usa emojis com moderação.'::text,
  sobre_empresa text NOT NULL DEFAULT ''::text,
  produtos_servicos text NOT NULL DEFAULT ''::text,
  pode_fazer text NOT NULL DEFAULT ''::text,
  nao_pode_fazer text NOT NULL DEFAULT ''::text,
  telefone_transferencia text NOT NULL DEFAULT ''::text,
  palavra_pausar text NOT NULL DEFAULT '/pausar'::text,
  palavra_despausar text NOT NULL DEFAULT '/despausar'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid NOT NULL,
  segundos_buffer integer NOT NULL DEFAULT 8,
  responder_em_partes boolean NOT NULL DEFAULT true,
  segmento text NOT NULL DEFAULT ''::text,
  descricao_negocio text NOT NULL DEFAULT ''::text,
  diferenciais text NOT NULL DEFAULT ''::text,
  publico_alvo text NOT NULL DEFAULT ''::text,
  regiao_horario text NOT NULL DEFAULT ''::text,
  ofertas text NOT NULL DEFAULT ''::text,
  cupom text NOT NULL DEFAULT ''::text,
  como_vender text NOT NULL DEFAULT ''::text,
  objecoes text NOT NULL DEFAULT ''::text,
  formas_pagamento text NOT NULL DEFAULT ''::text,
  ticket_medio text NOT NULL DEFAULT ''::text,
  faq text NOT NULL DEFAULT ''::text,
  politicas text NOT NULL DEFAULT ''::text,
  posvenda_msg text NOT NULL DEFAULT ''::text,
  pedir_avaliacao boolean NOT NULL DEFAULT false,
  reativar_cliente boolean NOT NULL DEFAULT false,
  tom integer NOT NULL DEFAULT 70,
  formalidade integer NOT NULL DEFAULT 40,
  usar_emojis boolean NOT NULL DEFAULT true,
  tamanho_resposta text NOT NULL DEFAULT 'curtas'::text,
  apresentacao text NOT NULL DEFAULT ''::text,
  agendamento_ativo boolean NOT NULL DEFAULT false,
  servicos_agendaveis text NOT NULL DEFAULT ''::text,
  duracao_padrao text NOT NULL DEFAULT '30 min'::text,
  horarios_disponiveis text NOT NULL DEFAULT ''::text,
  antecedencia_min text NOT NULL DEFAULT '2 horas'::text,
  ai_provider text NOT NULL DEFAULT 'gemini'::text,
  ai_model text NOT NULL DEFAULT 'google/gemini-2.5-flash'::text,
  openai_api_key text NOT NULL DEFAULT ''::text,
  anthropic_api_key text NOT NULL DEFAULT ''::text,
  horarios_atendimento jsonb NOT NULL DEFAULT '{"dias": {"0": null, "1": {"abre": "09:00", "fecha": "18:00"}, "2": {"abre": "09:00", "fecha": "18:00"}, "3": {"abre": "09:00", "fecha": "18:00"}, "4": {"abre": "09:00", "fecha": "18:00"}, "5": {"abre": "09:00", "fecha": "18:00"}, "6": null}, "enabled": false, "timezone": "America/Sao_Paulo"}'::jsonb,
  mensagem_fora_horario text NOT NULL DEFAULT 'Olá! No momento estamos fora do horário de atendimento. Assim que abrirmos, retornamos por aqui. 🙏'::text,
  personalidade text DEFAULT 'padrao'::text,
  foco_atendimento text DEFAULT 'ambos'::text,
  emoji_intensidade text DEFAULT 'pouco'::text,
  usar_girias boolean DEFAULT false,
  chamar_por_nome boolean DEFAULT true,
  perguntar_uma_por_vez boolean DEFAULT true,
  pode_brincar boolean DEFAULT false,
  assinar_mensagens boolean DEFAULT false,
  proatividade integer DEFAULT 50,
  velocidade_resposta text DEFAULT 'humana'::text,
  evitar_palavras text,
  idioma text DEFAULT 'pt-BR'::text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  responsavel_escalonamento_nome text NOT NULL DEFAULT ''::text
);

CREATE TABLE public.ai_access_state (
  model text NOT NULL,
  paused boolean NOT NULL DEFAULT false,
  reason text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_fin_expense (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  description text NOT NULL,
  amount_cents bigint NOT NULL DEFAULT 0,
  incurred_on date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_fin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  credit_brl numeric,
  multiplier numeric NOT NULL DEFAULT 3,
  safety_pct numeric NOT NULL DEFAULT 20,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_response_charge (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_message_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'reserved'::text,
  delivered_parts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_response_part (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  charge_id uuid NOT NULL,
  company_id uuid NOT NULL,
  part_index integer NOT NULL,
  whatsapp_message_id text,
  status text NOT NULL DEFAULT 'sending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  charge_id uuid,
  plan_slug text,
  provider text NOT NULL,
  model text NOT NULL,
  purpose text NOT NULL DEFAULT 'chat'::text,
  status text NOT NULL,
  input_tokens bigint,
  output_tokens bigint,
  estimated_credits numeric,
  confirmed_credits numeric,
  rate_version text,
  gateway_run_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.api_token (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  label text NOT NULL,
  token text NOT NULL DEFAULT (('azp_'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)) || replace((gen_random_uuid())::text, '-'::text, ''::text)),
  criado_por uuid,
  ultimo_uso_em timestamp with time zone,
  revogado boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.app_config (
  id boolean NOT NULL DEFAULT true,
  super_admin_emails text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  actor_email text,
  acao text NOT NULL,
  recurso text,
  detalhes jsonb DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_event_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text,
  external_id text,
  buyer_email text,
  matched_company_id uuid,
  processed boolean NOT NULL DEFAULT false,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_payment_credit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_key text NOT NULL,
  company_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  amount_cents bigint,
  event_type text NOT NULL,
  period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  created_by uuid,
  nome text NOT NULL,
  mensagem text NOT NULL,
  media_url text,
  status campaign_status NOT NULL DEFAULT 'rascunho'::campaign_status,
  agendado_para timestamp with time zone,
  filtro_tags text[] DEFAULT '{}'::text[],
  intervalo_min_seg integer NOT NULL DEFAULT 5,
  intervalo_max_seg integer NOT NULL DEFAULT 20,
  pausa_apos_envios integer NOT NULL DEFAULT 50,
  pausa_duracao_min integer NOT NULL DEFAULT 10,
  total_destinatarios integer NOT NULL DEFAULT 0,
  total_enviados integer NOT NULL DEFAULT 0,
  total_falhas integer NOT NULL DEFAULT 0,
  iniciado_em timestamp with time zone,
  concluido_em timestamp with time zone,
  proximo_envio_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_target (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  company_id uuid NOT NULL,
  contato_numero text NOT NULL,
  contato_nome text,
  status campaign_target_status NOT NULL DEFAULT 'pendente'::campaign_target_status,
  enviado_em timestamp with time zone,
  erro text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.company (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL,
  primary_color text NOT NULL DEFAULT '#22C55E'::text,
  logo_url text,
  telefone text,
  status_cobranca text NOT NULL DEFAULT 'trial'::text,
  trial_ate timestamp with time zone NOT NULL DEFAULT (now() + '14 days'::interval),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tipo_pessoa text NOT NULL DEFAULT 'PJ'::text,
  cnpj_cpf text,
  razao_social text,
  nome_fantasia text,
  inscricao_estadual text,
  segmento text,
  porte text,
  site text,
  email_corporativo text,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text DEFAULT 'BR'::text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_step integer NOT NULL DEFAULT 0,
  financeiro_ativo boolean NOT NULL DEFAULT false,
  financeiro_dias_vencimento_padrao smallint NOT NULL DEFAULT 7,
  selected_plan_slug text,
  creditos_saldo integer NOT NULL DEFAULT 0,
  creditos_resetam_em timestamp with time zone,
  creditos_origem text NOT NULL DEFAULT 'trial'::text,
  master_access_until timestamp with time zone
);

CREATE TABLE public.company_billing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo_pessoa text NOT NULL DEFAULT 'PJ'::text,
  cnpj_cpf text,
  razao_social text,
  nome_responsavel text,
  email_cobranca text,
  telefone text,
  inscricao_estadual text,
  cep text,
  rua text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  pais text DEFAULT 'BR'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.company_user (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role tenant_role NOT NULL DEFAULT 'owner'::tenant_role,
  ativo boolean NOT NULL DEFAULT true,
  forcar_troca_senha boolean NOT NULL DEFAULT false,
  convite_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_pause (
  user_id uuid NOT NULL,
  numero text NOT NULL,
  pausado boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid NOT NULL
);

CREATE TABLE public.credit_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  delta integer NOT NULL,
  saldo_apos integer NOT NULL,
  motivo text NOT NULL,
  ref text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  nome text,
  status text NOT NULL DEFAULT 'conversas'::text,
  ultima_mensagem text,
  ultima_em timestamp with time zone NOT NULL DEFAULT now(),
  observacao text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid NOT NULL,
  stage_id uuid,
  valor numeric NOT NULL DEFAULT 0,
  origem text,
  owner_id uuid,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  proxima_acao text,
  follow_up timestamp with time zone,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

CREATE TABLE public.crm_stage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  cor text NOT NULL DEFAULT '#8AA89A'::text,
  tipo stage_tipo NOT NULL DEFAULT 'normal'::stage_tipo,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.csat_response (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  numero text NOT NULL,
  contato_nome text,
  token text NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text),
  score integer,
  comentario text,
  enviado_por uuid,
  enviado_em timestamp with time zone NOT NULL DEFAULT now(),
  respondido_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_categoria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  tipo fin_tipo NOT NULL,
  cor text NOT NULL DEFAULT '#8AA89A'::text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_lancamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tipo fin_tipo NOT NULL,
  descricao text NOT NULL,
  valor_cents bigint NOT NULL,
  categoria_id uuid,
  forma_pagamento fin_forma,
  status fin_status NOT NULL DEFAULT 'pendente'::fin_status,
  vencimento date NOT NULL,
  pago_em date,
  competencia date NOT NULL DEFAULT CURRENT_DATE,
  crm_card_id uuid,
  contato_numero text,
  observacao text,
  anexo_url text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.google_integration (
  company_id uuid NOT NULL,
  email text,
  access_token text,
  refresh_token text,
  expiry timestamp with time zone,
  calendar_id text,
  conectado boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.human_escalations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_message_id text NOT NULL,
  contato_numero text NOT NULL,
  contato_nome text,
  motivo text NOT NULL,
  ultima_mensagem text NOT NULL,
  responsavel_nome text,
  responsavel_telefone text,
  status text NOT NULL DEFAULT 'pending'::text,
  erro text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notified_at timestamp with time zone
);

CREATE TABLE public.lead_evento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  card_id uuid NOT NULL,
  tipo text NOT NULL,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_nota (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  card_id uuid NOT NULL,
  autor_id uuid,
  texto text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.mensagens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  contato_nome text,
  direcao text NOT NULL,
  autor text NOT NULL,
  texto text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid NOT NULL,
  whatsapp_message_id text
);

CREATE TABLE public.message_template (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  atalho text NOT NULL,
  texto text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.plan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  nome text NOT NULL,
  descricao text,
  preco_cents integer NOT NULL DEFAULT 0,
  moeda text NOT NULL DEFAULT 'BRL'::text,
  intervalo text NOT NULL DEFAULT 'month'::text,
  trial_days integer NOT NULL DEFAULT 3,
  limite_mensagens integer NOT NULL DEFAULT 1000,
  limite_instancias integer NOT NULL DEFAULT 1,
  limite_usuarios integer NOT NULL DEFAULT 2,
  limite_contatos integer NOT NULL DEFAULT 1000,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  destaque boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  paddle_product_id text,
  paddle_price_id text,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  checkout_url text,
  creditos_mensais integer NOT NULL DEFAULT 1000,
  creditos_trial integer NOT NULL DEFAULT 100
);

CREATE TABLE public.produto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  preco numeric NOT NULL DEFAULT 0,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  email text,
  nome text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  nome_completo text,
  cpf text,
  cargo text,
  telefone text
);

CREATE TABLE public.subscription (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  plan_id uuid,
  status text NOT NULL DEFAULT 'trialing'::text,
  paddle_subscription_id text,
  paddle_customer_id text,
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_ends_at timestamp with time zone,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamp with time zone,
  payment_method_brand text,
  payment_method_last4 text,
  payment_method_exp text,
  next_billing_amount_cents integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  provider text NOT NULL DEFAULT 'manual'::text,
  external_subscription_id text,
  external_customer_id text,
  buyer_email text
);

CREATE TABLE public.supplier_catalog_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  update_id uuid,
  produto text NOT NULL,
  marca text,
  modelo text,
  categoria text NOT NULL DEFAULT 'outros'::text,
  custo_cents bigint,
  moeda text NOT NULL DEFAULT 'BRL'::text,
  disponibilidade text,
  fonte text,
  aprovado boolean NOT NULL DEFAULT false,
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_catalog_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  tipo text NOT NULL,
  conteudo_bruto text,
  midia_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_message_id text,
  status text NOT NULL DEFAULT 'pendente_revisao'::text,
  erro text,
  recebido_em timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_margin_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  categoria text NOT NULL,
  margem_liquida_pct numeric(5,2) NOT NULL,
  custos_extras_cents bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  validade_horas integer NOT NULL DEFAULT 24,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  ultima_atualizacao_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.trial_request (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requester_email text,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_name text NOT NULL
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_delivery_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  endpoint_id uuid,
  evento text NOT NULL,
  status_code integer,
  erro text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_endpoint (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  nome text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text),
  eventos text[] NOT NULL DEFAULT '{}'::text[],
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.whatsapp_instances (
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  numero text,
  status text NOT NULL DEFAULT 'disconnected'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid NOT NULL,
  webhook_token text NOT NULL DEFAULT (gen_random_uuid())::text,
  webhook_configured_at timestamp with time zone
);

ALTER TABLE public.agendamento ADD CONSTRAINT agendamento_pkey PRIMARY KEY (id);
ALTER TABLE public.agent_config ADD CONSTRAINT agent_config_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_access_state ADD CONSTRAINT ai_access_state_pkey PRIMARY KEY (model);
ALTER TABLE public.ai_fin_expense ADD CONSTRAINT ai_fin_expense_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_fin_settings ADD CONSTRAINT ai_fin_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_response_charge ADD CONSTRAINT ai_response_charge_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_response_part ADD CONSTRAINT ai_response_part_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_usage ADD CONSTRAINT ai_usage_pkey PRIMARY KEY (id);
ALTER TABLE public.api_token ADD CONSTRAINT api_token_pkey PRIMARY KEY (id);
ALTER TABLE public.app_config ADD CONSTRAINT app_config_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.billing_event_log ADD CONSTRAINT billing_event_log_pkey PRIMARY KEY (id);
ALTER TABLE public.billing_payment_credit ADD CONSTRAINT billing_payment_credit_pkey PRIMARY KEY (id);
ALTER TABLE public.campaign ADD CONSTRAINT campaign_pkey PRIMARY KEY (id);
ALTER TABLE public.campaign_target ADD CONSTRAINT campaign_target_pkey PRIMARY KEY (id);
ALTER TABLE public.company ADD CONSTRAINT company_pkey PRIMARY KEY (id);
ALTER TABLE public.company_billing ADD CONSTRAINT company_billing_pkey PRIMARY KEY (id);
ALTER TABLE public.company_user ADD CONSTRAINT company_user_pkey PRIMARY KEY (id);
ALTER TABLE public.contact_pause ADD CONSTRAINT contact_pause_pkey PRIMARY KEY (user_id, numero);
ALTER TABLE public.credit_ledger ADD CONSTRAINT credit_ledger_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_cards ADD CONSTRAINT crm_cards_pkey PRIMARY KEY (id);
ALTER TABLE public.crm_stage ADD CONSTRAINT crm_stage_pkey PRIMARY KEY (id);
ALTER TABLE public.csat_response ADD CONSTRAINT csat_response_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_categoria ADD CONSTRAINT fin_categoria_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_lancamento ADD CONSTRAINT fin_lancamento_pkey PRIMARY KEY (id);
ALTER TABLE public.google_integration ADD CONSTRAINT google_integration_pkey PRIMARY KEY (company_id);
ALTER TABLE public.human_escalations ADD CONSTRAINT human_escalations_pkey PRIMARY KEY (id);
ALTER TABLE public.lead_evento ADD CONSTRAINT lead_evento_pkey PRIMARY KEY (id);
ALTER TABLE public.lead_nota ADD CONSTRAINT lead_nota_pkey PRIMARY KEY (id);
ALTER TABLE public.mensagens ADD CONSTRAINT mensagens_pkey PRIMARY KEY (id);
ALTER TABLE public.message_template ADD CONSTRAINT message_template_pkey PRIMARY KEY (id);
ALTER TABLE public.plan ADD CONSTRAINT plan_pkey PRIMARY KEY (id);
ALTER TABLE public.produto ADD CONSTRAINT produto_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE public.subscription ADD CONSTRAINT subscription_pkey PRIMARY KEY (id);
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_pkey PRIMARY KEY (id);
ALTER TABLE public.supplier_catalog_updates ADD CONSTRAINT supplier_catalog_updates_pkey PRIMARY KEY (id);
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_pkey PRIMARY KEY (id);
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);
ALTER TABLE public.trial_request ADD CONSTRAINT trial_request_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.webhook_delivery_log ADD CONSTRAINT webhook_delivery_log_pkey PRIMARY KEY (id);
ALTER TABLE public.webhook_endpoint ADD CONSTRAINT webhook_endpoint_pkey PRIMARY KEY (id);
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_pkey PRIMARY KEY (user_id);
ALTER TABLE public.agent_config ADD CONSTRAINT agent_config_company_unique UNIQUE (company_id);
ALTER TABLE public.ai_response_charge ADD CONSTRAINT ai_response_charge_company_id_source_message_id_key UNIQUE (company_id, source_message_id);
ALTER TABLE public.ai_response_part ADD CONSTRAINT ai_response_part_charge_id_part_index_key UNIQUE (charge_id, part_index);
ALTER TABLE public.ai_response_part ADD CONSTRAINT ai_response_part_company_id_whatsapp_message_id_key UNIQUE (company_id, whatsapp_message_id);
ALTER TABLE public.api_token ADD CONSTRAINT api_token_token_key UNIQUE (token);
ALTER TABLE public.billing_payment_credit ADD CONSTRAINT billing_payment_credit_payment_key_key UNIQUE (payment_key);
ALTER TABLE public.company ADD CONSTRAINT company_slug_key UNIQUE (slug);
ALTER TABLE public.company_billing ADD CONSTRAINT company_billing_company_id_key UNIQUE (company_id);
ALTER TABLE public.company_user ADD CONSTRAINT company_user_user_id_company_id_key UNIQUE (user_id, company_id);
ALTER TABLE public.contact_pause ADD CONSTRAINT contact_pause_company_numero_unique UNIQUE (company_id, numero);
ALTER TABLE public.crm_cards ADD CONSTRAINT crm_cards_company_numero_unique UNIQUE (company_id, numero);
ALTER TABLE public.crm_cards ADD CONSTRAINT crm_cards_user_id_numero_key UNIQUE (user_id, numero);
ALTER TABLE public.csat_response ADD CONSTRAINT csat_response_token_key UNIQUE (token);
ALTER TABLE public.fin_categoria ADD CONSTRAINT fin_categoria_company_id_tipo_nome_key UNIQUE (company_id, tipo, nome);
ALTER TABLE public.human_escalations ADD CONSTRAINT human_escalations_company_id_source_message_id_key UNIQUE (company_id, source_message_id);
ALTER TABLE public.message_template ADD CONSTRAINT message_template_company_id_atalho_key UNIQUE (company_id, atalho);
ALTER TABLE public.plan ADD CONSTRAINT plan_slug_key UNIQUE (slug);
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_unique UNIQUE (company_id, categoria);
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_company_telefone_unique UNIQUE (company_id, telefone);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_company_unique UNIQUE (company_id);
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_instance_name_key UNIQUE (instance_name);
ALTER TABLE public.agent_config ADD CONSTRAINT agent_config_ai_provider_check CHECK ((ai_provider = ANY (ARRAY['gemini'::text, 'openai'::text, 'anthropic'::text])));
ALTER TABLE public.app_config ADD CONSTRAINT app_config_singleton CHECK ((id = true));
ALTER TABLE public.company ADD CONSTRAINT company_creditos_origem_check CHECK ((creditos_origem = ANY (ARRAY['trial'::text, 'plano'::text, 'bonus'::text])));
ALTER TABLE public.company ADD CONSTRAINT company_tipo_pessoa_check CHECK ((tipo_pessoa = ANY (ARRAY['PF'::text, 'PJ'::text])));
ALTER TABLE public.company_billing ADD CONSTRAINT company_billing_tipo_pessoa_check CHECK ((tipo_pessoa = ANY (ARRAY['PF'::text, 'PJ'::text])));
ALTER TABLE public.csat_response ADD CONSTRAINT csat_score_range CHECK (((score IS NULL) OR ((score >= 1) AND (score <= 5))));
ALTER TABLE public.fin_lancamento ADD CONSTRAINT fin_lancamento_valor_cents_check CHECK ((valor_cents >= 0));
ALTER TABLE public.human_escalations ADD CONSTRAINT human_escalations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'notified'::text, 'failed'::text])));
ALTER TABLE public.mensagens ADD CONSTRAINT mensagens_autor_check CHECK ((autor = ANY (ARRAY['ia'::text, 'humano'::text, 'contato'::text])));
ALTER TABLE public.mensagens ADD CONSTRAINT mensagens_direcao_check CHECK ((direcao = ANY (ARRAY['entrada'::text, 'saida'::text])));
ALTER TABLE public.plan ADD CONSTRAINT plan_intervalo_check CHECK ((intervalo = ANY (ARRAY['month'::text, 'year'::text])));
ALTER TABLE public.subscription ADD CONSTRAINT subscription_status_check CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text, 'paused'::text])));
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_categoria_check CHECK ((categoria = ANY (ARRAY['android'::text, 'iphone'::text, 'tablet'::text, 'acessorios'::text, 'manutencao'::text, 'outros'::text])));
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_custo_cents_check CHECK (((custo_cents IS NULL) OR (custo_cents >= 0)));
ALTER TABLE public.supplier_catalog_updates ADD CONSTRAINT supplier_catalog_updates_status_check CHECK ((status = ANY (ARRAY['pendente_revisao'::text, 'processando'::text, 'processado'::text, 'erro'::text, 'ignorado'::text])));
ALTER TABLE public.supplier_catalog_updates ADD CONSTRAINT supplier_catalog_updates_tipo_check CHECK ((tipo = ANY (ARRAY['texto'::text, 'imagem'::text, 'audio'::text, 'documento'::text, 'video'::text, 'outro'::text])));
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_categoria_check CHECK ((categoria = ANY (ARRAY['android'::text, 'iphone'::text, 'tablet'::text, 'acessorios'::text, 'manutencao'::text, 'outros'::text])));
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_custos_extras_cents_check CHECK ((custos_extras_cents >= 0));
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_margem_liquida_pct_check CHECK (((margem_liquida_pct >= (0)::numeric) AND (margem_liquida_pct < (95)::numeric)));
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_nome_check CHECK (((char_length(nome) >= 1) AND (char_length(nome) <= 120)));
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_telefone_check CHECK ((telefone ~ '^[0-9]{10,15}$'::text));
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_validade_horas_check CHECK (((validade_horas >= 1) AND (validade_horas <= 720)));
ALTER TABLE public.trial_request ADD CONSTRAINT trial_request_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public.agendamento ADD CONSTRAINT agendamento_card_id_fkey FOREIGN KEY (card_id) REFERENCES crm_cards(id) ON DELETE SET NULL;
ALTER TABLE public.agendamento ADD CONSTRAINT agendamento_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.agent_config ADD CONSTRAINT agent_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ai_fin_expense ADD CONSTRAINT ai_fin_expense_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.ai_response_charge ADD CONSTRAINT ai_response_charge_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.ai_response_charge ADD CONSTRAINT ai_response_charge_source_message_id_fkey FOREIGN KEY (source_message_id) REFERENCES mensagens(id);
ALTER TABLE public.ai_response_part ADD CONSTRAINT ai_response_part_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES ai_response_charge(id);
ALTER TABLE public.ai_response_part ADD CONSTRAINT ai_response_part_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.ai_usage ADD CONSTRAINT ai_usage_charge_id_fkey FOREIGN KEY (charge_id) REFERENCES ai_response_charge(id);
ALTER TABLE public.ai_usage ADD CONSTRAINT ai_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.api_token ADD CONSTRAINT api_token_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.api_token ADD CONSTRAINT api_token_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.billing_event_log ADD CONSTRAINT billing_event_log_matched_company_id_fkey FOREIGN KEY (matched_company_id) REFERENCES company(id) ON DELETE SET NULL;
ALTER TABLE public.billing_payment_credit ADD CONSTRAINT billing_payment_credit_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.billing_payment_credit ADD CONSTRAINT billing_payment_credit_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plan(id);
ALTER TABLE public.billing_payment_credit ADD CONSTRAINT billing_payment_credit_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscription(id);
ALTER TABLE public.campaign ADD CONSTRAINT campaign_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.campaign ADD CONSTRAINT campaign_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.campaign_target ADD CONSTRAINT campaign_target_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE CASCADE;
ALTER TABLE public.campaign_target ADD CONSTRAINT campaign_target_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.company_billing ADD CONSTRAINT company_billing_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.company_user ADD CONSTRAINT company_user_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.contact_pause ADD CONSTRAINT contact_pause_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.credit_ledger ADD CONSTRAINT credit_ledger_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.crm_cards ADD CONSTRAINT crm_cards_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES crm_stage(id) ON DELETE SET NULL;
ALTER TABLE public.crm_cards ADD CONSTRAINT crm_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.crm_stage ADD CONSTRAINT crm_stage_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.csat_response ADD CONSTRAINT csat_response_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.csat_response ADD CONSTRAINT csat_response_enviado_por_fkey FOREIGN KEY (enviado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.fin_categoria ADD CONSTRAINT fin_categoria_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.fin_lancamento ADD CONSTRAINT fin_lancamento_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES fin_categoria(id) ON DELETE SET NULL;
ALTER TABLE public.fin_lancamento ADD CONSTRAINT fin_lancamento_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.fin_lancamento ADD CONSTRAINT fin_lancamento_crm_card_id_fkey FOREIGN KEY (crm_card_id) REFERENCES crm_cards(id) ON DELETE SET NULL;
ALTER TABLE public.google_integration ADD CONSTRAINT google_integration_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.human_escalations ADD CONSTRAINT human_escalations_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id);
ALTER TABLE public.lead_evento ADD CONSTRAINT lead_evento_card_id_fkey FOREIGN KEY (card_id) REFERENCES crm_cards(id) ON DELETE CASCADE;
ALTER TABLE public.lead_evento ADD CONSTRAINT lead_evento_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.lead_nota ADD CONSTRAINT lead_nota_card_id_fkey FOREIGN KEY (card_id) REFERENCES crm_cards(id) ON DELETE CASCADE;
ALTER TABLE public.lead_nota ADD CONSTRAINT lead_nota_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.mensagens ADD CONSTRAINT mensagens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.message_template ADD CONSTRAINT message_template_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.message_template ADD CONSTRAINT message_template_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.produto ADD CONSTRAINT produto_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subscription ADD CONSTRAINT subscription_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.subscription ADD CONSTRAINT subscription_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE SET NULL;
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_catalog_items ADD CONSTRAINT supplier_catalog_items_update_id_fkey FOREIGN KEY (update_id) REFERENCES supplier_catalog_updates(id) ON DELETE SET NULL;
ALTER TABLE public.supplier_catalog_updates ADD CONSTRAINT supplier_catalog_updates_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_catalog_updates ADD CONSTRAINT supplier_catalog_updates_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_margin_rules ADD CONSTRAINT supplier_margin_rules_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.trial_request ADD CONSTRAINT trial_request_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plan(id);
ALTER TABLE public.trial_request ADD CONSTRAINT trial_request_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.trial_request ADD CONSTRAINT trial_request_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_delivery_log ADD CONSTRAINT webhook_delivery_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_delivery_log ADD CONSTRAINT webhook_delivery_log_endpoint_id_fkey FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoint(id) ON DELETE SET NULL;
ALTER TABLE public.webhook_endpoint ADD CONSTRAINT webhook_endpoint_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT whatsapp_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_agendamento_company ON public.agendamento USING btree (company_id, inicio);
CREATE INDEX idx_agent_config_user ON public.agent_config USING btree (user_id);
CREATE INDEX idx_agent_config_company ON public.agent_config USING btree (company_id);
CREATE INDEX ai_usage_period_company ON public.ai_usage USING btree (created_at, company_id);
CREATE INDEX idx_api_token_company ON public.api_token USING btree (company_id);
CREATE INDEX idx_audit_log_company_created ON public.audit_log USING btree (company_id, created_at DESC);
CREATE INDEX billing_event_log_provider_idx ON public.billing_event_log USING btree (provider, created_at DESC);
CREATE INDEX billing_event_log_created_idx ON public.billing_event_log USING btree (created_at DESC);
CREATE UNIQUE INDEX billing_paid_cycle ON public.billing_payment_credit USING btree (subscription_id, period_end) WHERE ((period_end IS NOT NULL) AND (event_type = ANY (ARRAY['purchase_approved'::text, 'subscription_renewed'::text])));
CREATE INDEX idx_campaign_status_next ON public.campaign USING btree (status, proximo_envio_em) WHERE (status = ANY (ARRAY['agendada'::campaign_status, 'enviando'::campaign_status]));
CREATE INDEX idx_campaign_company ON public.campaign USING btree (company_id);
CREATE INDEX idx_campaign_target_campaign ON public.campaign_target USING btree (campaign_id, status);
CREATE INDEX idx_campaign_target_pending ON public.campaign_target USING btree (campaign_id) WHERE (status = 'pendente'::campaign_target_status);
CREATE INDEX idx_company_user_company ON public.company_user USING btree (company_id);
CREATE INDEX idx_company_user_user ON public.company_user USING btree (user_id) WHERE ativo;
CREATE INDEX idx_contact_pause_company ON public.contact_pause USING btree (company_id);
CREATE INDEX credit_ledger_company_idx ON public.credit_ledger USING btree (company_id, created_at DESC);
CREATE INDEX idx_crm_cards_company ON public.crm_cards USING btree (company_id);
CREATE INDEX crm_cards_user_status_idx ON public.crm_cards USING btree (user_id, status, ultima_em DESC);
CREATE INDEX idx_crm_cards_stage ON public.crm_cards USING btree (stage_id);
CREATE INDEX idx_crm_stage_company ON public.crm_stage USING btree (company_id, ordem);
CREATE INDEX idx_csat_token ON public.csat_response USING btree (token);
CREATE INDEX idx_csat_company ON public.csat_response USING btree (company_id, created_at DESC);
CREATE INDEX idx_fin_categoria_company ON public.fin_categoria USING btree (company_id, tipo);
CREATE INDEX idx_fin_lanc_company_status ON public.fin_lancamento USING btree (company_id, status, vencimento);
CREATE UNIQUE INDEX fin_lancamento_card_uniq ON public.fin_lancamento USING btree (company_id, crm_card_id) WHERE (crm_card_id IS NOT NULL);
CREATE INDEX idx_fin_lanc_company_tipo ON public.fin_lancamento USING btree (company_id, tipo, competencia);
CREATE INDEX human_escalations_company_status ON public.human_escalations USING btree (company_id, status, created_at);
CREATE INDEX idx_lead_evento_card ON public.lead_evento USING btree (card_id, created_at DESC);
CREATE INDEX idx_lead_nota_card ON public.lead_nota USING btree (card_id, created_at DESC);
CREATE UNIQUE INDEX mensagens_company_whatsapp_message_id_idx ON public.mensagens USING btree (company_id, whatsapp_message_id) WHERE (whatsapp_message_id IS NOT NULL);
CREATE INDEX idx_mensagens_company ON public.mensagens USING btree (company_id);
CREATE INDEX mensagens_user_numero_idx ON public.mensagens USING btree (user_id, numero, created_at DESC);
CREATE INDEX mensagens_user_created_idx ON public.mensagens USING btree (user_id, created_at DESC);
CREATE INDEX idx_produto_company ON public.produto USING btree (company_id, ordem);
CREATE UNIQUE INDEX subscription_one_current_per_company ON public.subscription USING btree (company_id) WHERE (status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'incomplete'::text, 'paused'::text]));
CREATE INDEX subscription_provider_external_idx ON public.subscription USING btree (provider, external_subscription_id);
CREATE INDEX subscription_buyer_email_idx ON public.subscription USING btree (lower(buyer_email));
CREATE UNIQUE INDEX subscription_provider_external_unique ON public.subscription USING btree (provider, external_subscription_id) WHERE (external_subscription_id IS NOT NULL);
CREATE INDEX supplier_catalog_items_supplier_idx ON public.supplier_catalog_items USING btree (supplier_id);
CREATE INDEX supplier_catalog_items_company_idx ON public.supplier_catalog_items USING btree (company_id, atualizado_em DESC);
CREATE UNIQUE INDEX supplier_catalog_updates_msg_unique ON public.supplier_catalog_updates USING btree (company_id, whatsapp_message_id) WHERE (whatsapp_message_id IS NOT NULL);
CREATE INDEX supplier_catalog_updates_company_idx ON public.supplier_catalog_updates USING btree (company_id, recebido_em DESC);
CREATE INDEX supplier_catalog_updates_supplier_idx ON public.supplier_catalog_updates USING btree (supplier_id, recebido_em DESC);
CREATE INDEX suppliers_company_idx ON public.suppliers USING btree (company_id);
CREATE UNIQUE INDEX trial_request_one_open_per_user ON public.trial_request USING btree (user_id) WHERE (status = ANY (ARRAY['pending'::text, 'approved'::text]));
CREATE INDEX idx_webhook_log_company ON public.webhook_delivery_log USING btree (company_id, created_at DESC);
CREATE INDEX idx_webhook_company ON public.webhook_endpoint USING btree (company_id) WHERE ativo;
CREATE INDEX idx_whatsapp_instances_company ON public.whatsapp_instances USING btree (company_id);
CREATE UNIQUE INDEX whatsapp_instances_webhook_token_idx ON public.whatsapp_instances USING btree (webhook_token);

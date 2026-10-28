-- Caixa multiempresa. Esta migração apenas cria a estrutura: não altera lançamentos existentes.
-- Valores monetários são sempre armazenados em centavos inteiros.

ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS custo_cents integer NOT NULL DEFAULT 0 CHECK (custo_cents >= 0);
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS estoque_disponivel integer NOT NULL DEFAULT 0 CHECK (estoque_disponivel >= 0);
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS estoque_controlado boolean NOT NULL DEFAULT false;
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS disponivel boolean NOT NULL DEFAULT true;
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS imagem_url text;
ALTER TABLE public.produto ADD COLUMN IF NOT EXISTS variantes jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.caixa_funcionario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (char_length(trim(nome)) >= 2),
  ativo boolean NOT NULL DEFAULT true,
  regras_remuneracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS caixa_funcionario_company_idx ON public.caixa_funcionario(company_id, ativo, nome);

CREATE TABLE IF NOT EXISTS public.caixa_venda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  vendedor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cliente_nome text,
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('pix','dinheiro','debito','credito','outro')),
  status text NOT NULL DEFAULT 'confirmada' CHECK (status IN ('rascunho','reservada','pendente_pagamento','confirmada','cancelada')),
  venda_cents integer NOT NULL DEFAULT 0 CHECK (venda_cents >= 0),
  custo_cents integer NOT NULL DEFAULT 0 CHECK (custo_cents >= 0),
  lucro_cents integer NOT NULL DEFAULT 0,
  taxas_cents integer NOT NULL DEFAULT 0 CHECK (taxas_cents >= 0),
  observacao text,
  data_venda date NOT NULL DEFAULT current_date,
  confirmado_em timestamptz,
  cancelado_em timestamptz,
  cancelado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo_cancelamento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS caixa_venda_company_date_idx ON public.caixa_venda(company_id, data_venda DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS caixa_venda_company_status_idx ON public.caixa_venda(company_id, status);

CREATE TABLE IF NOT EXISTS public.caixa_venda_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.caixa_venda(id) ON DELETE RESTRICT,
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produto(id) ON DELETE SET NULL,
  produto_nome_snapshot text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_unitario_cents integer NOT NULL CHECK (preco_unitario_cents >= 0),
  custo_unitario_cents integer NOT NULL CHECK (custo_unitario_cents >= 0),
  total_venda_cents integer NOT NULL CHECK (total_venda_cents >= 0),
  total_custo_cents integer NOT NULL CHECK (total_custo_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS caixa_venda_item_company_idx ON public.caixa_venda_item(company_id, venda_id);

CREATE TABLE IF NOT EXISTS public.caixa_despesa_funcionario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  funcionario_id uuid NOT NULL REFERENCES public.caixa_funcionario(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('diaria','vale','meta')),
  valor_cents integer NOT NULL CHECK (valor_cents > 0),
  observacao text,
  data_lancamento date NOT NULL,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  cancelado_em timestamptz,
  cancelado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS caixa_despesa_company_date_idx ON public.caixa_despesa_funcionario(company_id, data_lancamento DESC);

CREATE TABLE IF NOT EXISTS public.caixa_estoque_movimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produto(id) ON DELETE RESTRICT,
  venda_id uuid REFERENCES public.caixa_venda(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('venda','cancelamento','ajuste','reserva','liberacao_reserva')),
  quantidade integer NOT NULL,
  referencia_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS caixa_estoque_venda_unique ON public.caixa_estoque_movimento(venda_id, produto_id, tipo) WHERE venda_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS caixa_estoque_company_product_idx ON public.caixa_estoque_movimento(company_id, produto_id, created_at DESC);

-- Pedido iniciado pela IA ou pelo atendimento. Ele não é uma venda e não baixa
-- estoque: só pode virar venda após confirmação confiável de pagamento.
CREATE TABLE IF NOT EXISTS public.caixa_pedido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  contato_numero text NOT NULL,
  cliente_nome text,
  produto_id uuid REFERENCES public.produto(id) ON DELETE SET NULL,
  produto_nome_snapshot text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  preco_unitario_cents integer NOT NULL CHECK (preco_unitario_cents >= 0),
  status text NOT NULL DEFAULT 'pendente_pagamento' CHECK (status IN ('rascunho','pendente_pagamento','pagamento_confirmado','cancelado','expirado')),
  origem text NOT NULL DEFAULT 'whatsapp_ia' CHECK (origem IN ('whatsapp_ia','painel','api')),
  source_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS caixa_pedido_source_unique ON public.caixa_pedido(company_id, source_message_id) WHERE source_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS caixa_pedido_company_status_idx ON public.caixa_pedido(company_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.caixa_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  entidade text NOT NULL,
  entidade_id uuid NOT NULL,
  acao text NOT NULL,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  antes jsonb,
  depois jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS caixa_auditoria_entity_idx ON public.caixa_auditoria(company_id, entidade, entidade_id, created_at DESC);

ALTER TABLE public.caixa_funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_venda_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_despesa_funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_estoque_movimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS caixa_funcionario_company_access ON public.caixa_funcionario;
CREATE POLICY caixa_funcionario_company_access ON public.caixa_funcionario FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_venda_company_access ON public.caixa_venda;
CREATE POLICY caixa_venda_company_access ON public.caixa_venda FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_venda_item_company_access ON public.caixa_venda_item;
CREATE POLICY caixa_venda_item_company_access ON public.caixa_venda_item FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_despesa_company_access ON public.caixa_despesa_funcionario;
CREATE POLICY caixa_despesa_company_access ON public.caixa_despesa_funcionario FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_estoque_company_access ON public.caixa_estoque_movimento;
CREATE POLICY caixa_estoque_company_access ON public.caixa_estoque_movimento FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_pedido_company_access ON public.caixa_pedido;
CREATE POLICY caixa_pedido_company_access ON public.caixa_pedido FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));
DROP POLICY IF EXISTS caixa_auditoria_company_access ON public.caixa_auditoria;
CREATE POLICY caixa_auditoria_company_access ON public.caixa_auditoria FOR SELECT TO authenticated USING (public.has_company_access(company_id));

CREATE OR REPLACE FUNCTION public.caixa_confirmar_venda(
  _produto_id uuid, _quantidade integer, _forma_pagamento text, _cliente_nome text DEFAULT NULL,
  _observacao text DEFAULT NULL, _data_venda date DEFAULT current_date
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company_id uuid; _produto record; _venda_id uuid; _preco_cents integer; _custo_cents integer;
BEGIN
  SELECT company_id INTO _company_id FROM public.company_user
    WHERE user_id = auth.uid() AND ativo = true ORDER BY created_at ASC LIMIT 1;
  IF _company_id IS NULL THEN RAISE EXCEPTION 'Sem empresa vinculada'; END IF;
  IF _quantidade IS NULL OR _quantidade < 1 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _forma_pagamento NOT IN ('pix','dinheiro','debito','credito','outro') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  SELECT id, nome, preco, custo_cents, estoque_disponivel, estoque_controlado, disponivel INTO _produto
    FROM public.produto WHERE id = _produto_id AND company_id = _company_id AND ativo = true FOR UPDATE;
  IF NOT FOUND OR NOT coalesce(_produto.disponivel, true) THEN RAISE EXCEPTION 'Produto indisponível'; END IF;
  IF coalesce(_produto.estoque_controlado, false) AND _produto.estoque_disponivel < _quantidade THEN RAISE EXCEPTION 'Estoque insuficiente'; END IF;
  _preco_cents := round(coalesce(_produto.preco, 0)::numeric * 100)::integer;
  _custo_cents := coalesce(_produto.custo_cents, 0);
  INSERT INTO public.caixa_venda(company_id, vendedor_id, cliente_nome, forma_pagamento, status, venda_cents, custo_cents, lucro_cents, observacao, data_venda, confirmado_em)
  VALUES (_company_id, auth.uid(), nullif(trim(_cliente_nome), ''), _forma_pagamento, 'confirmada', _preco_cents * _quantidade, _custo_cents * _quantidade, (_preco_cents - _custo_cents) * _quantidade, nullif(trim(_observacao), ''), _data_venda, now()) RETURNING id INTO _venda_id;
  INSERT INTO public.caixa_venda_item(venda_id, company_id, produto_id, produto_nome_snapshot, quantidade, preco_unitario_cents, custo_unitario_cents, total_venda_cents, total_custo_cents)
  VALUES (_venda_id, _company_id, _produto.id, _produto.nome, _quantidade, _preco_cents, _custo_cents, _preco_cents * _quantidade, _custo_cents * _quantidade);
  IF coalesce(_produto.estoque_controlado, false) THEN
    UPDATE public.produto SET estoque_disponivel = estoque_disponivel - _quantidade WHERE id = _produto.id AND company_id = _company_id;
    INSERT INTO public.caixa_estoque_movimento(company_id, produto_id, venda_id, tipo, quantidade) VALUES (_company_id, _produto.id, _venda_id, 'venda', -_quantidade);
  END IF;
  INSERT INTO public.caixa_auditoria(company_id, entidade, entidade_id, acao, autor_id, depois) VALUES (_company_id, 'venda', _venda_id, 'confirmar', auth.uid(), jsonb_build_object('quantidade', _quantidade, 'produto_id', _produto.id));
  RETURN _venda_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.caixa_confirmar_venda(uuid, integer, text, text, text, date) TO authenticated;

-- Cancelamentos são reversões, nunca exclusões: preservam a trilha de auditoria
-- e devolvem ao estoque somente os itens cujo estoque é controlado.
CREATE OR REPLACE FUNCTION public.caixa_cancelar_venda(_venda_id uuid, _motivo text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company_id uuid; _role text; _venda public.caixa_venda%ROWTYPE; _item record;
BEGIN
  SELECT company_id, role INTO _company_id, _role FROM public.company_user
    WHERE user_id = auth.uid() AND ativo = true ORDER BY created_at ASC LIMIT 1;
  IF _company_id IS NULL THEN RAISE EXCEPTION 'Sem empresa vinculada'; END IF;
  IF _role NOT IN ('owner', 'admin') THEN RAISE EXCEPTION 'Apenas dono ou admin pode cancelar venda'; END IF;

  SELECT * INTO _venda FROM public.caixa_venda
    WHERE id = _venda_id AND company_id = _company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venda não encontrada'; END IF;
  IF _venda.status = 'cancelada' THEN RAISE EXCEPTION 'Venda já está cancelada'; END IF;
  IF _venda.status <> 'confirmada' THEN RAISE EXCEPTION 'Somente vendas confirmadas podem ser canceladas'; END IF;

  FOR _item IN SELECT i.*, p.estoque_controlado
    FROM public.caixa_venda_item i
    LEFT JOIN public.produto p ON p.id = i.produto_id AND p.company_id = _company_id
    WHERE i.venda_id = _venda.id
  LOOP
    IF _item.produto_id IS NOT NULL AND coalesce(_item.estoque_controlado, false) THEN
      UPDATE public.produto SET estoque_disponivel = estoque_disponivel + _item.quantidade
        WHERE id = _item.produto_id AND company_id = _company_id;
      INSERT INTO public.caixa_estoque_movimento(company_id, produto_id, venda_id, tipo, quantidade)
        VALUES (_company_id, _item.produto_id, _venda.id, 'cancelamento', _item.quantidade)
        ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  UPDATE public.caixa_venda SET status = 'cancelada', cancelado_em = now(), cancelado_por = auth.uid(),
    motivo_cancelamento = nullif(trim(_motivo), ''), updated_at = now() WHERE id = _venda.id;
  INSERT INTO public.caixa_auditoria(company_id, entidade, entidade_id, acao, autor_id, antes, depois)
    VALUES (_company_id, 'venda', _venda.id, 'cancelar', auth.uid(), to_jsonb(_venda),
      jsonb_build_object('status', 'cancelada', 'motivo', nullif(trim(_motivo), '')));
  RETURN _venda.id;
END; $$;

CREATE OR REPLACE FUNCTION public.caixa_cancelar_despesa_funcionario(_despesa_id uuid, _motivo text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company_id uuid; _role text; _despesa public.caixa_despesa_funcionario%ROWTYPE;
BEGIN
  SELECT company_id, role INTO _company_id, _role FROM public.company_user
    WHERE user_id = auth.uid() AND ativo = true ORDER BY created_at ASC LIMIT 1;
  IF _company_id IS NULL THEN RAISE EXCEPTION 'Sem empresa vinculada'; END IF;
  IF _role NOT IN ('owner', 'admin') THEN RAISE EXCEPTION 'Apenas dono ou admin pode cancelar despesa'; END IF;
  SELECT * INTO _despesa FROM public.caixa_despesa_funcionario
    WHERE id = _despesa_id AND company_id = _company_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Despesa não encontrada'; END IF;
  IF _despesa.cancelado_em IS NOT NULL THEN RAISE EXCEPTION 'Despesa já está cancelada'; END IF;
  UPDATE public.caixa_despesa_funcionario SET cancelado_em = now(), cancelado_por = auth.uid(), updated_at = now()
    WHERE id = _despesa.id;
  INSERT INTO public.caixa_auditoria(company_id, entidade, entidade_id, acao, autor_id, antes, depois)
    VALUES (_company_id, 'despesa_funcionario', _despesa.id, 'cancelar', auth.uid(), to_jsonb(_despesa),
      jsonb_build_object('status', 'cancelada', 'motivo', nullif(trim(_motivo), '')));
  RETURN _despesa.id;
END; $$;

GRANT EXECUTE ON FUNCTION public.caixa_cancelar_venda(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caixa_cancelar_despesa_funcionario(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.caixa_criar_pedido_pendente_ia(
  _company_id uuid, _produto_nome text, _quantidade integer, _contato_numero text, _cliente_nome text, _source_message_id text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _produto record; _pedido_id uuid; _preco_cents integer;
BEGIN
  IF _company_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.company WHERE id = _company_id) THEN RAISE EXCEPTION 'Empresa inválida'; END IF;
  IF _quantidade IS NULL OR _quantidade < 1 OR _quantidade > 10000 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF nullif(trim(_contato_numero), '') IS NULL OR nullif(trim(_source_message_id), '') IS NULL THEN RAISE EXCEPTION 'Referência de pedido inválida'; END IF;
  SELECT id, nome, preco, estoque_disponivel, estoque_controlado, disponivel INTO _produto FROM public.produto
    WHERE company_id = _company_id AND ativo = true AND disponivel = true AND lower(trim(nome)) = lower(trim(_produto_nome))
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado ou indisponível'; END IF;
  IF coalesce(_produto.estoque_controlado, false) AND _produto.estoque_disponivel < _quantidade THEN RAISE EXCEPTION 'Estoque insuficiente'; END IF;
  _preco_cents := round(coalesce(_produto.preco, 0)::numeric * 100)::integer;
  INSERT INTO public.caixa_pedido(company_id, contato_numero, cliente_nome, produto_id, produto_nome_snapshot, quantidade, preco_unitario_cents, source_message_id)
    VALUES (_company_id, trim(_contato_numero), nullif(trim(_cliente_nome), ''), _produto.id, _produto.nome, _quantidade, _preco_cents, trim(_source_message_id))
    ON CONFLICT (company_id, source_message_id) WHERE source_message_id IS NOT NULL DO UPDATE SET updated_at = now()
    RETURNING id INTO _pedido_id;
  INSERT INTO public.caixa_auditoria(company_id, entidade, entidade_id, acao, autor_id, depois)
    VALUES (_company_id, 'pedido', _pedido_id, 'criar_pendente_pagamento', NULL, jsonb_build_object('produto_id', _produto.id, 'quantidade', _quantidade, 'origem', 'whatsapp_ia'));
  RETURN _pedido_id;
END; $$;
REVOKE ALL ON FUNCTION public.caixa_criar_pedido_pendente_ia(uuid, text, integer, text, text, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.caixa_criar_pedido_pendente_ia(uuid, text, integer, text, text, text) TO service_role;

-- Nunca deixe o navegador alterar vendas, estoque, pedidos ou auditoria direto.
-- As escritas financeiras passam pelas RPCs SECURITY DEFINER acima, que validam
-- empresa, papel, disponibilidade e deixam trilha de auditoria.
DROP POLICY IF EXISTS caixa_funcionario_company_access ON public.caixa_funcionario;
DROP POLICY IF EXISTS caixa_venda_company_access ON public.caixa_venda;
DROP POLICY IF EXISTS caixa_venda_item_company_access ON public.caixa_venda_item;
DROP POLICY IF EXISTS caixa_despesa_company_access ON public.caixa_despesa_funcionario;
DROP POLICY IF EXISTS caixa_estoque_company_access ON public.caixa_estoque_movimento;
DROP POLICY IF EXISTS caixa_pedido_company_access ON public.caixa_pedido;

CREATE POLICY caixa_funcionario_read ON public.caixa_funcionario FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));
CREATE POLICY caixa_funcionario_manage ON public.caixa_funcionario FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_user cu WHERE cu.company_id = caixa_funcionario.company_id AND cu.user_id = auth.uid() AND cu.ativo = true AND cu.role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_user cu WHERE cu.company_id = caixa_funcionario.company_id AND cu.user_id = auth.uid() AND cu.ativo = true AND cu.role IN ('owner', 'admin')));

CREATE POLICY caixa_venda_read ON public.caixa_venda FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));
CREATE POLICY caixa_venda_item_read ON public.caixa_venda_item FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));
CREATE POLICY caixa_despesa_read ON public.caixa_despesa_funcionario FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));
CREATE POLICY caixa_despesa_manage ON public.caixa_despesa_funcionario FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_user cu WHERE cu.company_id = caixa_despesa_funcionario.company_id AND cu.user_id = auth.uid() AND cu.ativo = true AND cu.role IN ('owner', 'admin')));
CREATE POLICY caixa_estoque_read ON public.caixa_estoque_movimento FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));
CREATE POLICY caixa_pedido_read ON public.caixa_pedido FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));

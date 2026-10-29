-- Configuração de taxas da maquininha por empresa. Valores em pontos-base:
-- 319 = 3,19%; 0 = sem taxa. A taxa registrada na venda é um retrato do
-- momento da confirmação, portanto alterações futuras não mudam o histórico.
CREATE TABLE IF NOT EXISTS public.caixa_taxa_pagamento (
  company_id uuid NOT NULL REFERENCES public.company(id) ON DELETE CASCADE,
  metodo text NOT NULL CHECK (metodo IN ('pix', 'dinheiro', 'debito', 'credito_a_vista', 'parcelado')),
  percentual_bps integer NOT NULL DEFAULT 0 CHECK (percentual_bps BETWEEN 0 AND 10000),
  percentual_parcela_bps integer NOT NULL DEFAULT 0 CHECK (percentual_parcela_bps BETWEEN 0 AND 10000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, metodo)
);

ALTER TABLE public.caixa_taxa_pagamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS caixa_taxa_pagamento_read ON public.caixa_taxa_pagamento;
CREATE POLICY caixa_taxa_pagamento_read ON public.caixa_taxa_pagamento FOR SELECT TO authenticated
  USING (public.has_company_access(company_id));

DROP POLICY IF EXISTS caixa_taxa_pagamento_manage ON public.caixa_taxa_pagamento;
CREATE POLICY caixa_taxa_pagamento_manage ON public.caixa_taxa_pagamento FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_user cu WHERE cu.company_id = caixa_taxa_pagamento.company_id AND cu.user_id = auth.uid() AND cu.ativo = true AND cu.role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_user cu WHERE cu.company_id = caixa_taxa_pagamento.company_id AND cu.user_id = auth.uid() AND cu.ativo = true AND cu.role IN ('owner', 'admin')));

GRANT SELECT, INSERT, UPDATE ON TABLE public.caixa_taxa_pagamento TO authenticated;

CREATE OR REPLACE FUNCTION public.caixa_confirmar_venda_manual_v2(
  _quantidade integer,
  _produto_nome text,
  _forma_pagamento text,
  _pagamento_rotulo text,
  _funcionario_nome text,
  _custo_cents integer,
  _taxas_cents integer,
  _venda_cents integer,
  _data_venda date DEFAULT current_date
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _company_id uuid;
  _role text;
  _venda_id uuid;
  _lucro_cents integer;
BEGIN
  SELECT company_id, role INTO _company_id, _role
  FROM public.company_user WHERE user_id = auth.uid() AND ativo = true
  ORDER BY created_at ASC LIMIT 1;

  IF _company_id IS NULL THEN RAISE EXCEPTION 'Sem empresa vinculada'; END IF;
  IF _role NOT IN ('owner', 'admin') THEN RAISE EXCEPTION 'Apenas dono ou admin pode registrar vendas'; END IF;
  IF _quantidade IS NULL OR _quantidade < 1 OR _quantidade > 10000 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF nullif(trim(_produto_nome), '') IS NULL OR char_length(trim(_produto_nome)) > 240 THEN RAISE EXCEPTION 'Produto inválido'; END IF;
  IF _forma_pagamento NOT IN ('pix', 'dinheiro', 'debito', 'credito') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF _pagamento_rotulo NOT IN ('Crédito à vista', 'Parcelado', 'Débito', 'Pix', 'Dinheiro') AND _pagamento_rotulo !~ '^Parcelado · [0-9]+x$' THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF nullif(trim(_funcionario_nome), '') IS NULL OR char_length(trim(_funcionario_nome)) > 120 THEN RAISE EXCEPTION 'Funcionário inválido'; END IF;
  IF _venda_cents IS NULL OR _venda_cents <= 0 OR _custo_cents IS NULL OR _custo_cents < 0 OR _taxas_cents IS NULL OR _taxas_cents < 0 THEN RAISE EXCEPTION 'Valores inválidos'; END IF;
  _lucro_cents := _venda_cents - _custo_cents - _taxas_cents;

  INSERT INTO public.caixa_venda (company_id, vendedor_id, forma_pagamento, status, venda_cents, custo_cents, taxas_cents, lucro_cents, observacao, data_venda, confirmado_em)
  VALUES (_company_id, auth.uid(), _forma_pagamento, 'confirmada', _venda_cents, _custo_cents, _taxas_cents, _lucro_cents,
    jsonb_build_object('flowa_manual_sale', true, 'employee_name', upper(trim(_funcionario_nome)), 'payment_label', _pagamento_rotulo)::text,
    _data_venda, now()) RETURNING id INTO _venda_id;

  INSERT INTO public.caixa_venda_item (venda_id, company_id, produto_id, produto_nome_snapshot, quantidade, preco_unitario_cents, custo_unitario_cents, total_venda_cents, total_custo_cents)
  VALUES (_venda_id, _company_id, NULL, upper(trim(_produto_nome)), _quantidade,
    round(_venda_cents::numeric / _quantidade)::integer, round(_custo_cents::numeric / _quantidade)::integer,
    _venda_cents, _custo_cents);

  INSERT INTO public.caixa_auditoria (company_id, entidade, entidade_id, acao, autor_id, depois)
  VALUES (_company_id, 'venda', _venda_id, 'confirmar_manual', auth.uid(),
    jsonb_build_object('quantidade', _quantidade, 'produto', upper(trim(_produto_nome)), 'funcionario', upper(trim(_funcionario_nome)), 'pagamento', _pagamento_rotulo, 'custo_cents', _custo_cents, 'taxas_cents', _taxas_cents, 'lucro_cents', _lucro_cents, 'total_cents', _venda_cents));
  RETURN _venda_id;
END;
$$;

REVOKE ALL ON FUNCTION public.caixa_confirmar_venda_manual_v2(integer, text, text, text, text, integer, integer, integer, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.caixa_confirmar_venda_manual_v2(integer, text, text, text, text, integer, integer, integer, date) TO authenticated;

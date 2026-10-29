-- Vendas manuais do Caixa: escrita financeira atômica, autenticada e isolada
-- por empresa. O navegador só pode chamar esta função; não recebe INSERT nas
-- tabelas de venda, itens ou auditoria.
CREATE OR REPLACE FUNCTION public.caixa_confirmar_venda_manual(
  _quantidade integer,
  _produto_nome text,
  _forma_pagamento text,
  _pagamento_rotulo text,
  _funcionario_nome text,
  _lucro_cents integer,
  _venda_cents integer,
  _data_venda date DEFAULT current_date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _role text;
  _venda_id uuid;
  _custo_cents integer;
BEGIN
  SELECT company_id, role INTO _company_id, _role
  FROM public.company_user
  WHERE user_id = auth.uid() AND ativo = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF _company_id IS NULL THEN RAISE EXCEPTION 'Sem empresa vinculada'; END IF;
  IF _role NOT IN ('owner', 'admin') THEN RAISE EXCEPTION 'Apenas dono ou admin pode registrar vendas'; END IF;
  IF _quantidade IS NULL OR _quantidade < 1 OR _quantidade > 10000 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF nullif(trim(_produto_nome), '') IS NULL OR char_length(trim(_produto_nome)) > 240 THEN RAISE EXCEPTION 'Produto inválido'; END IF;
  IF _forma_pagamento NOT IN ('pix', 'dinheiro', 'debito', 'credito') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF _pagamento_rotulo NOT IN ('Crédito à vista', 'Parcelado', 'Débito', 'Pix', 'Dinheiro') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
  IF nullif(trim(_funcionario_nome), '') IS NULL OR char_length(trim(_funcionario_nome)) > 120 THEN RAISE EXCEPTION 'Funcionário inválido'; END IF;
  IF _venda_cents IS NULL OR _venda_cents <= 0 OR _lucro_cents IS NULL OR _lucro_cents < 0 OR _lucro_cents > _venda_cents THEN RAISE EXCEPTION 'Valores inválidos'; END IF;
  IF _data_venda IS NULL THEN RAISE EXCEPTION 'Data inválida'; END IF;

  _custo_cents := _venda_cents - _lucro_cents;

  INSERT INTO public.caixa_venda (
    company_id, vendedor_id, forma_pagamento, status, venda_cents, custo_cents,
    lucro_cents, observacao, data_venda, confirmado_em
  ) VALUES (
    _company_id, auth.uid(), _forma_pagamento, 'confirmada', _venda_cents, _custo_cents,
    _lucro_cents,
    jsonb_build_object('flowa_manual_sale', true, 'employee_name', trim(_funcionario_nome), 'payment_label', _pagamento_rotulo)::text,
    _data_venda, now()
  ) RETURNING id INTO _venda_id;

  INSERT INTO public.caixa_venda_item (
    venda_id, company_id, produto_id, produto_nome_snapshot, quantidade,
    preco_unitario_cents, custo_unitario_cents, total_venda_cents, total_custo_cents
  ) VALUES (
    _venda_id, _company_id, NULL, trim(_produto_nome), _quantidade,
    round(_venda_cents::numeric / _quantidade)::integer,
    round(_custo_cents::numeric / _quantidade)::integer,
    _venda_cents, _custo_cents
  );

  INSERT INTO public.caixa_auditoria (company_id, entidade, entidade_id, acao, autor_id, depois)
  VALUES (
    _company_id, 'venda', _venda_id, 'confirmar_manual', auth.uid(),
    jsonb_build_object(
      'quantidade', _quantidade, 'produto', trim(_produto_nome),
      'funcionario', trim(_funcionario_nome), 'pagamento', _pagamento_rotulo,
      'lucro_cents', _lucro_cents, 'total_cents', _venda_cents
    )
  );

  RETURN _venda_id;
END;
$$;

REVOKE ALL ON FUNCTION public.caixa_confirmar_venda_manual(integer, text, text, text, text, integer, integer, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.caixa_confirmar_venda_manual(integer, text, text, text, text, integer, integer, date) TO authenticated;

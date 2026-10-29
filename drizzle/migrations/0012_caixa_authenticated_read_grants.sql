-- The Caixa tables already use RLS policies that restrict every row to the
-- current company. PostgREST still needs base table privileges before it can
-- evaluate those policies for an authenticated FLOWA user.

GRANT SELECT ON TABLE
  public.caixa_venda,
  public.caixa_venda_item,
  public.caixa_estoque_movimento,
  public.caixa_pedido,
  public.caixa_auditoria
TO authenticated;

-- These two resources have intentional client-side operations protected by
-- their existing company-scoped RLS policies.
GRANT SELECT, INSERT ON TABLE public.caixa_despesa_funcionario TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.caixa_funcionario TO authenticated;

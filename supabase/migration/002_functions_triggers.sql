-- Functions and triggers reconstructed from the former FLOWA database.
CREATE OR REPLACE FUNCTION public.apply_paid_credit_event(_event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE cid uuid:=(_event->>'companyId')::uuid; pid uuid:=(_event->>'planId')::uuid; payment text:=_event->>'paymentKey'; prov text:=_event->>'provider'; ext text:=_event->>'externalSubscriptionId'; et text:=_event->>'eventType'; pend timestamptz:=NULLIF(_event->>'periodEnd','')::timestamptz; p public.plan%ROWTYPE; s public.subscription%ROWTYPE; oldbal integer; newbal integer; existing public.billing_payment_credit%ROWTYPE; held integer;
BEGIN
 IF et NOT IN ('purchase_approved','subscription_renewed') OR length(coalesce(payment,''))<3 OR prov NOT IN ('asaas','kiwify','cakto','perfectpay') THEN RAISE EXCEPTION 'Invalid paid event'; END IF;
 SELECT creditos_saldo INTO oldbal FROM public.company WHERE id=cid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Company not found'; END IF;
 SELECT * INTO p FROM public.plan WHERE id=pid AND ativo=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid plan'; END IF;
 SELECT * INTO existing FROM public.billing_payment_credit WHERE payment_key=payment;
 IF FOUND THEN
  IF existing.company_id<>cid OR existing.plan_id<>pid THEN RAISE EXCEPTION 'Payment association conflict'; END IF;
  RETURN jsonb_build_object('ok',true,'duplicate',true);
 END IF;
 IF ext IS NOT NULL THEN SELECT * INTO s FROM public.subscription WHERE provider=prov AND external_subscription_id=ext FOR UPDATE; END IF;
 IF s.id IS NOT NULL AND (s.company_id<>cid OR s.plan_id IS DISTINCT FROM pid OR s.status='canceled') THEN RAISE EXCEPTION 'Subscription conflict'; END IF;
 IF s.id IS NULL THEN
  SELECT * INTO s FROM public.subscription WHERE company_id=cid AND status IN ('trialing','active','past_due','incomplete','paused') FOR UPDATE;
  IF s.id IS NOT NULL AND (s.plan_id IS DISTINCT FROM pid OR (s.provider<>prov AND s.status<>'trialing') OR (s.external_subscription_id IS NOT NULL AND s.external_subscription_id IS DISTINCT FROM ext)) THEN RAISE EXCEPTION 'Current subscription conflict'; END IF;
 END IF;
 IF s.id IS NOT NULL AND pend IS NOT NULL AND s.current_period_end IS NOT NULL AND s.status='active' AND pend<s.current_period_end THEN RAISE EXCEPTION 'Stale payment period'; END IF;
 IF s.id IS NOT NULL AND pend IS NOT NULL AND EXISTS(SELECT 1 FROM public.billing_payment_credit WHERE subscription_id=s.id AND period_end=pend AND event_type IN ('purchase_approved','subscription_renewed')) THEN RETURN jsonb_build_object('ok',true,'duplicate',true); END IF;
 IF s.id IS NULL THEN
  INSERT INTO public.subscription(company_id,plan_id,provider,status,external_subscription_id,external_customer_id,buyer_email,current_period_start,current_period_end) VALUES(cid,pid,prov,'active',ext,_event->>'externalCustomerId',_event->>'buyerEmail',now(),coalesce(pend,now()+interval '30 days')) RETURNING * INTO s;
 ELSE
  UPDATE public.subscription SET provider=prov,status='active',external_subscription_id=ext,external_customer_id=_event->>'externalCustomerId',buyer_email=_event->>'buyerEmail',current_period_end=coalesce(pend,now()+interval '30 days'),updated_at=now() WHERE id=s.id;
 END IF;
 SELECT count(*) INTO held FROM public.ai_response_charge WHERE company_id=cid AND status IN ('reserved','pending');
 newbal:=p.creditos_mensais+held;
 INSERT INTO public.billing_payment_credit(payment_key,company_id,plan_id,subscription_id,amount_cents,event_type,period_end) VALUES(payment,cid,pid,s.id,NULLIF(_event->>'amountCents','')::bigint,et,pend);
 UPDATE public.company SET status_cobranca='ativo',selected_plan_slug=p.slug,creditos_saldo=newbal,creditos_origem='plano',creditos_resetam_em=coalesce(pend,now()+interval '30 days'),updated_at=now() WHERE id=cid;
 INSERT INTO public.credit_ledger(company_id,delta,saldo_apos,motivo,ref) VALUES(cid,newbal-oldbal,newbal,'plan_topup',payment);
 INSERT INTO public.billing_event_log(provider,event_type,external_id,buyer_email,matched_company_id,processed,payload) VALUES(prov,et,ext,_event->>'buyerEmail',cid,true,_event);
 RETURN jsonb_build_object('ok',true,'duplicate',false,'balance',newbal);
END $function$;

CREATE OR REPLACE FUNCTION public.claim_human_escalation(_company_id uuid, _user_id uuid, _source_message_id text, _numero text, _nome text, _motivo text, _ultima_mensagem text, _responsavel_nome text, _responsavel_telefone text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id uuid;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.whatsapp_instances WHERE company_id=_company_id AND user_id=_user_id) THEN RAISE EXCEPTION 'Instance association invalid'; END IF;
 INSERT INTO public.human_escalations(company_id,source_message_id,contato_numero,contato_nome,motivo,ultima_mensagem,responsavel_nome,responsavel_telefone)
 VALUES (_company_id,_source_message_id,_numero,_nome,_motivo,_ultima_mensagem,_responsavel_nome,_responsavel_telefone)
 ON CONFLICT (company_id,source_message_id) DO NOTHING RETURNING id INTO new_id;
 IF new_id IS NULL THEN RETURN NULL; END IF;
 INSERT INTO public.contact_pause(company_id,user_id,numero,pausado) VALUES (_company_id,_user_id,_numero,true)
 ON CONFLICT (company_id,numero) DO UPDATE SET pausado=true,updated_at=now();
 RETURN new_id;
END $function$;

CREATE OR REPLACE FUNCTION public.claim_super_admin_if_empty()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _email text;
  _exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'::public.app_role
  ) INTO _exists;

  IF _exists THEN RETURN; END IF;

  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL THEN RETURN; END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'super_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.app_config (id, super_admin_emails)
  VALUES (true, ARRAY[_email])
  ON CONFLICT (id) DO UPDATE
    SET super_admin_emails = (
      SELECT ARRAY(SELECT DISTINCT unnest(public.app_config.super_admin_emails || ARRAY[_email]))
    ),
    updated_at = now();
END $function$;

CREATE OR REPLACE FUNCTION public.confirm_ai_delivery(_company_id uuid, _whatsapp_id text, _status text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE rid uuid;
BEGIN
 IF _status NOT IN ('DELIVERY_ACK','READ','PLAYED','3','4','5') THEN RETURN false; END IF;
 UPDATE public.ai_response_part SET status='delivered' WHERE company_id=_company_id AND whatsapp_message_id=_whatsapp_id AND status<>'delivered' RETURNING charge_id INTO rid;
 IF rid IS NULL THEN RETURN false; END IF;
 PERFORM public.finish_ai_response(rid,'delivered'); RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION public.consume_ai_credit(_company_id uuid, _ref text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _novo int;
BEGIN
  UPDATE public.company
    SET creditos_saldo = creditos_saldo - 1
    WHERE id = _company_id AND creditos_saldo > 0
    RETURNING creditos_saldo INTO _novo;
  IF _novo IS NULL THEN RETURN false; END IF;
  INSERT INTO public.credit_ledger(company_id, delta, saldo_apos, motivo, ref)
    VALUES (_company_id, -1, _novo, 'ai_message', _ref);
  RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION public.create_company_with_owner(_owner_id uuid, _nome text, _slug text, _plan_id uuid, _forcar_troca_senha boolean DEFAULT false)
 RETURNS TABLE(company_id uuid, trial_ate timestamp with time zone, trial_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _plan record;
  _company uuid;
  _trial_end timestamptz;
  _has_trial boolean;
BEGIN
  IF _owner_id IS NULL THEN RAISE EXCEPTION 'Responsável inválido'; END IF;
  IF coalesce(length(trim(_nome)),0) < 2 THEN RAISE EXCEPTION 'Nome inválido'; END IF;
  IF coalesce(length(trim(_slug)),0) < 1 THEN RAISE EXCEPTION 'Slug inválido'; END IF;
  SELECT p.id, p.slug, p.trial_days INTO _plan FROM public.plan p WHERE p.id = _plan_id AND p.ativo = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plano inexistente ou inativo'; END IF;

  _has_trial := coalesce(_plan.trial_days, 0) > 0;
  _trial_end := now() + make_interval(days => GREATEST(0, coalesce(_plan.trial_days, 0)));

  INSERT INTO public.company (nome, slug, created_by, status_cobranca, trial_ate, selected_plan_slug)
  VALUES (trim(_nome), _slug, _owner_id, CASE WHEN _has_trial THEN 'trial' ELSE 'checkout_pending' END, _trial_end, _plan.slug)
  RETURNING id INTO _company;

  INSERT INTO public.company_user (company_id, user_id, role, ativo, forcar_troca_senha)
  VALUES (_company, _owner_id, 'owner', true, coalesce(_forcar_troca_senha, false));

  IF EXISTS (SELECT 1 FROM public.subscription s WHERE s.company_id = _company AND s.status <> 'canceled') THEN
    RAISE EXCEPTION 'Empresa já possui assinatura corrente';
  END IF;

  INSERT INTO public.subscription (company_id, plan_id, status, trial_ends_at, current_period_start, current_period_end)
  VALUES (_company, _plan.id, CASE WHEN _has_trial THEN 'trialing' ELSE 'incomplete' END, _trial_end, now(), _trial_end);

  RETURN QUERY SELECT _company, _trial_end, coalesce(_plan.trial_days, 0)::integer;
END $function$;

CREATE OR REPLACE FUNCTION public.current_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT company_id FROM public.company_user
  WHERE user_id = auth.uid() AND ativo = true
  ORDER BY created_at ASC LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.fin_enable_for_company(_company_id uuid, _enable boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_company_role(_company_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.company SET financeiro_ativo = _enable WHERE id = _company_id;
  IF _enable THEN PERFORM public.seed_fin_categorias(_company_id); END IF;
END $function$;

CREATE OR REPLACE FUNCTION public.finish_ai_response(_id uuid, _outcome text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r public.ai_response_charge%ROWTYPE; balance integer; cid uuid;
BEGIN
 SELECT company_id INTO cid FROM public.ai_response_charge WHERE id=_id;
 IF cid IS NULL THEN RAISE EXCEPTION 'Response not found'; END IF;
 PERFORM 1 FROM public.company WHERE id=cid FOR UPDATE;
 SELECT * INTO r FROM public.ai_response_charge WHERE id=_id FOR UPDATE;
 IF r.status IN ('delivered','released') THEN RETURN r.status; END IF;
 IF _outcome NOT IN ('delivered','released','pending') THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
 IF _outcome='released' AND EXISTS(SELECT 1 FROM public.ai_response_part WHERE charge_id=_id AND status IN ('sending','accepted','delivered')) THEN RAISE EXCEPTION 'Delivery uncertain'; END IF;
 IF _outcome='delivered' THEN
  IF NOT EXISTS(SELECT 1 FROM public.ai_response_part WHERE charge_id=_id AND status='delivered') THEN RAISE EXCEPTION 'Delivery not confirmed'; END IF;
  UPDATE public.company SET creditos_saldo=GREATEST(0,creditos_saldo-1) WHERE id=cid RETURNING creditos_saldo INTO balance;
  INSERT INTO public.credit_ledger(company_id,delta,saldo_apos,motivo,ref) VALUES(cid,-1,balance,'ai_message',_id::text);
 END IF;
 UPDATE public.ai_response_charge SET status=_outcome,delivered_parts=(SELECT count(*) FROM public.ai_response_part WHERE charge_id=_id AND status='delivered'),updated_at=now() WHERE id=_id;
 RETURN _outcome;
END $function$;

CREATE OR REPLACE FUNCTION public.grant_credits(_company_id uuid, _qtd integer, _motivo text DEFAULT 'bonus_admin'::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _novo int; _uid uuid;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _qtd = 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  _uid := auth.uid();
  UPDATE public.company
    SET creditos_saldo = GREATEST(0, creditos_saldo + _qtd)
    WHERE id = _company_id
    RETURNING creditos_saldo INTO _novo;
  IF _novo IS NULL THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
  INSERT INTO public.credit_ledger(company_id, delta, saldo_apos, motivo, created_by)
    VALUES (_company_id, _qtd, _novo, _motivo, _uid);
  RETURN _novo;
END $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _exists boolean;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'::public.app_role
  ) INTO _exists;

  IF NOT _exists AND NEW.email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.app_config (id, super_admin_emails)
    VALUES (true, ARRAY[NEW.email])
    ON CONFLICT (id) DO UPDATE
      SET super_admin_emails = (
        SELECT ARRAY(SELECT DISTINCT unnest(public.app_config.super_admin_emails || ARRAY[NEW.email]))
      ),
      updated_at = now();
  END IF;

  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.has_company_access(_company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS (SELECT 1 FROM public.company_user cu JOIN public.company c ON c.id=cu.company_id
 WHERE cu.user_id=auth.uid() AND cu.company_id=_company_id AND cu.ativo=true
 AND (c.master_access_until IS NULL OR c.master_access_until > now()));
$function$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company_id uuid, _roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.company_user
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND ativo = true
      AND role::text = ANY (_roles)
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'::public.app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.master_manage_company_plan(_actor_id uuid, _company_id uuid, _plan_id uuid, _action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
 IF _action IS DISTINCT FROM 'cancel' THEN RAISE EXCEPTION 'Selecione um período no novo diálogo Master'; END IF;
 RETURN public.master_manage_company_plan(_actor_id,_company_id,_plan_id,_action,NULL);
END;
$function$;

CREATE OR REPLACE FUNCTION public.master_manage_company_plan(_actor_id uuid, _company_id uuid, _plan_id uuid, _action text, _period text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
 c public.company%ROWTYPE; p public.plan%ROWTYPE; s public.subscription%ROWTYPE;
 new_id uuid; ts timestamptz := now(); period_end timestamptz; trial_end timestamptz;
 target_status text; company_status text; reason text;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_actor_id AND role='super_admin') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 IF _action IS NULL OR _action NOT IN ('assign','cancel') THEN RAISE EXCEPTION 'Ação inválida'; END IF;
 IF _action='assign' AND (_period IS NULL OR _period NOT IN ('trial_7','temporary_30','permanent')) THEN RAISE EXCEPTION 'Selecione um período válido'; END IF;
 SELECT * INTO c FROM public.company WHERE id=_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;
 IF _action='assign' THEN
  SELECT * INTO p FROM public.plan WHERE id=_plan_id AND ativo=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plano inexistente ou inativo'; END IF;
  target_status := CASE WHEN _period='trial_7' THEN 'trialing' ELSE 'active' END;
  company_status := CASE WHEN _period='trial_7' THEN 'trial' ELSE 'ativo' END;
  period_end := CASE _period WHEN 'trial_7' THEN ts + interval '7 days' WHEN 'temporary_30' THEN ts + interval '30 days' ELSE NULL END;
  trial_end := CASE WHEN _period='trial_7' THEN period_end ELSE NULL END;
 END IF;
 SELECT * INTO s FROM public.subscription WHERE company_id=c.id AND status IN ('trialing','active','past_due','incomplete','paused') FOR UPDATE;
 IF _action='cancel' AND s.id IS NULL AND c.status_cobranca='suspenso' AND c.selected_plan_slug IS NULL THEN RETURN jsonb_build_object('ok',true,'changed',false); END IF;
 IF _action='assign' AND s.id IS NOT NULL AND s.plan_id=p.id AND s.provider='manual'
 AND s.status=target_status AND s.metadata->>'master_period'=_period
 AND (s.current_period_end IS NULL OR s.current_period_end > ts)
 AND c.status_cobranca=company_status AND c.selected_plan_slug=p.slug THEN
  RETURN jsonb_build_object('ok',true,'changed',false,'subscriptionId',s.id);
 END IF;
 reason := CASE WHEN _action='cancel' THEN 'Cancelamento administrativo interno; cobrança externa não alterada.' ELSE 'Atribuição administrativa interna; cobrança externa não alterada.' END;
 IF s.id IS NOT NULL THEN
  UPDATE public.subscription SET status='canceled',canceled_at=ts,cancel_at_period_end=false,current_period_end=ts,updated_at=ts,
   metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('admin_reason',reason,'admin_actor_id',_actor_id) WHERE id=s.id;
 END IF;
 IF _action='assign' THEN
  INSERT INTO public.subscription(company_id,plan_id,provider,status,current_period_start,current_period_end,trial_ends_at,metadata)
   VALUES(c.id,p.id,'manual',target_status,ts,period_end,trial_end,jsonb_build_object('admin_reason',reason,'admin_actor_id',_actor_id,'master_period',_period)) RETURNING id INTO new_id;
  UPDATE public.company SET status_cobranca=company_status,selected_plan_slug=p.slug,trial_ate=coalesce(trial_end,ts),master_access_until=period_end,updated_at=ts WHERE id=c.id;
 ELSE
  UPDATE public.company SET status_cobranca='suspenso',selected_plan_slug=NULL,master_access_until=ts,updated_at=ts WHERE id=c.id;
 END IF;
 INSERT INTO public.audit_log(company_id,user_id,acao,recurso,detalhes) VALUES(c.id,_actor_id,
  CASE WHEN _action='cancel' THEN 'master_plan_cancel' ELSE 'master_plan_assign' END,'subscription',
  jsonb_build_object('previous_subscription_id',s.id,'previous_plan_id',s.plan_id,'previous_status',s.status,'subscription_id',new_id,
   'plan_id',CASE WHEN _action='assign' THEN p.id ELSE NULL END,'plan_name',CASE WHEN _action='assign' THEN p.nome ELSE NULL END,
   'status',CASE WHEN _action='assign' THEN target_status ELSE 'canceled' END,'master_period',_period,'period_end',period_end,'reason',reason,'external_billing_changed',false));
 RETURN jsonb_build_object('ok',true,'changed',true,'subscriptionId',new_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_customer_company_billing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR public.is_super_admin() OR (auth.uid() IS NULL AND session_user = 'postgres') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL OR NEW.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Responsável inválido'; END IF;
    NEW.status_cobranca := 'trial';
    NEW.selected_plan_slug := 'starter';
    NEW.trial_ate := now() + interval '3 days';
    NEW.master_access_until := NULL;
  ELSIF NEW.status_cobranca IS DISTINCT FROM OLD.status_cobranca
    OR NEW.selected_plan_slug IS DISTINCT FROM OLD.selected_plan_slug
    OR NEW.trial_ate IS DISTINCT FROM OLD.trial_ate
    OR NEW.master_access_until IS DISTINCT FROM OLD.master_access_until
    OR NEW.creditos_saldo IS DISTINCT FROM OLD.creditos_saldo
    OR NEW.creditos_origem IS DISTINCT FROM OLD.creditos_origem
    OR NEW.creditos_resetam_em IS DISTINCT FROM OLD.creditos_resetam_em
    OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'O plano e o acesso só podem ser alterados após pagamento confirmado ou pelo Master';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_customer_subscription_billing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' OR public.is_super_admin() OR (auth.uid() IS NULL AND session_user = 'postgres') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Assinaturas só podem ser alteradas pelo pagamento confirmado ou pelo Master';
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_ai_response(_company_id uuid, _source_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c public.company%ROWTYPE; r public.ai_response_charge%ROWTYPE; held integer;
BEGIN
 SELECT * INTO c FROM public.company WHERE id=_company_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Company not found'; END IF;
 SELECT * INTO r FROM public.ai_response_charge WHERE company_id=_company_id AND source_message_id=_source_id;
 IF FOUND THEN RETURN jsonb_build_object('id',r.id,'claimed',false,'status',r.status); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.mensagens WHERE id=_source_id AND company_id=_company_id AND direcao='entrada') THEN RAISE EXCEPTION 'Invalid source'; END IF;
 SELECT count(*) INTO held FROM public.ai_response_charge WHERE company_id=_company_id AND status IN ('reserved','pending');
 IF c.creditos_saldo-held<=0 THEN RETURN jsonb_build_object('claimed',false,'status','no_credits'); END IF;
 INSERT INTO public.ai_response_charge(company_id,source_message_id) VALUES(_company_id,_source_id) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'claimed',true,'status','reserved');
END $function$;

CREATE OR REPLACE FUNCTION public.seed_default_stages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.crm_stage (company_id, nome, ordem, cor, tipo) VALUES
    (NEW.id, 'Conversas',  0, '#8AA89A', 'normal'),
    (NEW.id, 'Negociando', 1, '#FFB020', 'normal'),
    (NEW.id, 'Ganho',      2, '#22B85F', 'ganho'),
    (NEW.id, 'Perda',      3, '#FF5A5A', 'perda')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.seed_fin_categorias(_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.fin_categoria (company_id, nome, tipo, cor) VALUES
    (_company_id, 'Vendas', 'receita', '#22B85F'),
    (_company_id, 'Serviços', 'receita', '#8AA89A'),
    (_company_id, 'Outras receitas', 'receita', '#5DB6FF'),
    (_company_id, 'Marketing', 'despesa', '#FFB020'),
    (_company_id, 'Folha de pagamento', 'despesa', '#FF7A59'),
    (_company_id, 'Infraestrutura', 'despesa', '#A36BFF'),
    (_company_id, 'Operacional', 'despesa', '#FF5A5A'),
    (_company_id, 'Impostos', 'despesa', '#666666')
  ON CONFLICT DO NOTHING;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_company_trial_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _qtd int;
BEGIN
  IF NEW.selected_plan_slug IS NOT NULL THEN
    SELECT creditos_trial INTO _qtd FROM public.plan WHERE slug = NEW.selected_plan_slug;
  END IF;
  IF _qtd IS NULL THEN _qtd := 50; END IF;
  NEW.creditos_saldo := _qtd;
  NEW.creditos_origem := 'trial';
  NEW.creditos_resetam_em := NEW.trial_ate;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_fin_auto_receita_on_ganho()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _stage_tipo text;
  _old_stage_tipo text;
  _ativo boolean;
  _dias smallint;
  _cat uuid;
BEGIN
  IF NEW.stage_id IS NULL THEN RETURN NEW; END IF;

  SELECT s.tipo::text INTO _stage_tipo FROM public.crm_stage s WHERE s.id = NEW.stage_id;
  IF _stage_tipo IS DISTINCT FROM 'ganho' THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.stage_id IS NOT NULL THEN
    SELECT s.tipo::text INTO _old_stage_tipo FROM public.crm_stage s WHERE s.id = OLD.stage_id;
    IF _old_stage_tipo = 'ganho' THEN RETURN NEW; END IF;
  END IF;

  SELECT financeiro_ativo, financeiro_dias_vencimento_padrao
    INTO _ativo, _dias
    FROM public.company WHERE id = NEW.company_id;
  IF NOT COALESCE(_ativo, false) THEN RETURN NEW; END IF;

  SELECT id INTO _cat FROM public.fin_categoria
    WHERE company_id = NEW.company_id AND tipo = 'receita' AND nome = 'Vendas'
    LIMIT 1;

  INSERT INTO public.fin_lancamento (
    company_id, tipo, descricao, valor_cents, categoria_id,
    status, vencimento, competencia, crm_card_id, contato_numero
  ) VALUES (
    NEW.company_id, 'receita',
    COALESCE('Venda: ' || NULLIF(NEW.nome,''), 'Venda CRM ' || NEW.numero),
    GREATEST(0, COALESCE((NEW.valor * 100)::bigint, 0)),
    _cat,
    'pendente',
    CURRENT_DATE + COALESCE(_dias, 7),
    CURRENT_DATE,
    NEW.id, NEW.numero
  )
  ON CONFLICT (company_id, crm_card_id) WHERE crm_card_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.topup_plan_credits(_company_id uuid, _plan_slug text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _qtd int; _novo int;
BEGIN
  SELECT creditos_mensais INTO _qtd FROM public.plan WHERE slug = _plan_slug AND ativo = true;
  IF _qtd IS NULL THEN RETURN NULL; END IF;
  UPDATE public.company
    SET creditos_saldo = _qtd,
        creditos_origem = 'plano',
        creditos_resetam_em = now() + interval '30 days'
    WHERE id = _company_id
    RETURNING creditos_saldo INTO _novo;
  INSERT INTO public.credit_ledger(company_id, delta, saldo_apos, motivo, ref)
    VALUES (_company_id, _qtd, _novo, 'plan_topup', _plan_slug);
  RETURN _novo;
END $function$;

CREATE TRIGGER agent_config_updated BEFORE UPDATE ON public.agent_config FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_api_token_updated_at BEFORE UPDATE ON public.api_token FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_campaign_updated_at BEFORE UPDATE ON public.campaign FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER aa_protect_customer_company_billing BEFORE INSERT OR UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION protect_customer_company_billing();
CREATE TRIGGER company_trial_credits BEFORE INSERT ON public.company FOR EACH ROW EXECUTE FUNCTION tg_company_trial_credits();
CREATE TRIGGER trg_company_seed_stages AFTER INSERT ON public.company FOR EACH ROW EXECUTE FUNCTION seed_default_stages();
CREATE TRIGGER trg_company_updated BEFORE UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_billing_updated_at BEFORE UPDATE ON public.company_billing FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_company_user_updated BEFORE UPDATE ON public.company_user FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER contact_pause_updated BEFORE UPDATE ON public.contact_pause FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER crm_cards_updated BEFORE UPDATE ON public.crm_cards FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_crm_cards_fin_receita AFTER INSERT OR UPDATE OF stage_id ON public.crm_cards FOR EACH ROW EXECUTE FUNCTION tg_fin_auto_receita_on_ganho();
CREATE TRIGGER set_csat_updated_at BEFORE UPDATE ON public.csat_response FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER tg_fin_lancamento_updated_at BEFORE UPDATE ON public.fin_lancamento FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_message_template_updated_at BEFORE UPDATE ON public.message_template FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_plan_updated_at BEFORE UPDATE ON public.plan FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER protect_customer_subscription_billing BEFORE INSERT OR DELETE OR UPDATE ON public.subscription FOR EACH ROW EXECUTE FUNCTION protect_customer_subscription_billing();
CREATE TRIGGER trg_subscription_updated_at BEFORE UPDATE ON public.subscription FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER supplier_margin_rules_updated_at BEFORE UPDATE ON public.supplier_margin_rules FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_webhook_updated_at BEFORE UPDATE ON public.webhook_endpoint FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER whatsapp_instances_updated BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

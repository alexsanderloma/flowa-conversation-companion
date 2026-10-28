-- Contas novas podem solicitar uma avaliação, mas não recebem acesso automaticamente.
CREATE TABLE IF NOT EXISTS public.trial_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email text,
  company_name text NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plan(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trial_request_one_open_per_user
  ON public.trial_request(user_id) WHERE status IN ('pending', 'approved');

ALTER TABLE public.trial_request ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trial request owner reads own" ON public.trial_request;
CREATE POLICY "trial request owner reads own" ON public.trial_request
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.trial_request FROM anon, authenticated;
GRANT SELECT ON public.trial_request TO authenticated;


-- Corrige a policy de SELECT para support_tickets
DROP POLICY IF EXISTS "Admins and corretores can view all tickets" ON public.support_tickets;

CREATE POLICY "Admins and corretores can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    -- Admins e corretores
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p
      WHERE p.role = ANY (ARRAY['admin'::user_role, 'corretor'::user_role])
    ))
    -- Ou o usuário designado
    OR (assigned_to = auth.uid())
    -- Ou o próprio lead autenticado (comparando por email via função SECURITY DEFINER)
    OR (
      lead_id IN (
        SELECT l.id
        FROM public.leads l
        WHERE l.email = public.get_user_email(auth.uid())
      )
    )
  );

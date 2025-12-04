-- Remover política restritiva e criar como permissiva
DROP POLICY IF EXISTS "allow_anonymous_insert" ON public.leads;

CREATE POLICY "allow_anonymous_insert" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (true);
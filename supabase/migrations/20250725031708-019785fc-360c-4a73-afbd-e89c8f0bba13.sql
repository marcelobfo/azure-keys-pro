-- Remove the conflicting ALL policy that causes RLS violations
DROP POLICY IF EXISTS "Corretores and admins can manage leads" ON public.leads;

-- Create specific DELETE policy for admins and corretores
CREATE POLICY "Admins and corretores can delete leads" 
ON public.leads 
FOR DELETE 
USING (
    auth.uid() IN (
        SELECT profiles.id
        FROM profiles
        WHERE profiles.role = ANY (ARRAY['admin'::user_role, 'corretor'::user_role])
    )
);
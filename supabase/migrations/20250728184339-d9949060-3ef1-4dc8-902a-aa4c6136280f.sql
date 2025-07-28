-- Remove existing policies
DROP POLICY IF EXISTS "public_can_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_admin_corretor_can_select_leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_admin_corretor_can_update_leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_admin_corretor_can_delete_leads" ON public.leads;

-- Remove duplicate triggers
DROP TRIGGER IF EXISTS "validate_lead_trigger" ON public.leads;

-- Create correct policies for anonymous contact form submissions
CREATE POLICY "allow_anonymous_insert" ON public.leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_admin_corretor_select" ON public.leads
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    ));

CREATE POLICY "allow_admin_corretor_update" ON public.leads
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    ));

CREATE POLICY "allow_admin_corretor_delete" ON public.leads
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'corretor')
    ));
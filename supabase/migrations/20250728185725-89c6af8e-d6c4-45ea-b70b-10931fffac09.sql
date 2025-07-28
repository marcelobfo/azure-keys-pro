-- Remove triggers that cause RLS failures for anonymous users
DROP TRIGGER IF EXISTS trigger_new_lead_notify ON public.leads;
DROP TRIGGER IF EXISTS validate_lead_data_simple_trigger ON public.leads;

-- Keep only the timestamp update trigger which doesn't cause issues
-- (update_leads_updated_at trigger remains active)
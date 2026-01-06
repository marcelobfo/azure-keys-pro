-- Remove a FK atual que aponta para auth.users
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;

-- Cria nova FK apontando para profiles
ALTER TABLE public.leads 
ADD CONSTRAINT leads_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
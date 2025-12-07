-- Sincronizar tenant_id em profiles a partir de user_roles
UPDATE public.profiles p
SET tenant_id = ur.tenant_id
FROM public.user_roles ur
WHERE p.id = ur.user_id
  AND p.tenant_id IS NULL
  AND ur.tenant_id IS NOT NULL;
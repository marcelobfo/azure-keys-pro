
-- Vamos ver as constraints existentes na tabela leads
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass 
AND contype = 'c';

-- Remover a constraint existente que está causando o problema
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Criar uma nova constraint que permite todos os status necessários
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

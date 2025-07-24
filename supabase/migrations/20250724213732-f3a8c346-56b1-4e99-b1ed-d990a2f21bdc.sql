-- 1. Corrigir o foreign key constraint para support_tickets
-- Primeiro, remover a constraint existente (se existir)
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_lead_id_fkey;

-- Adicionar nova constraint com CASCADE
ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_lead_id_fkey 
FOREIGN KEY (lead_id) 
REFERENCES leads(id) 
ON DELETE CASCADE;

-- 2. Adicionar campo "aceita permuta" às propriedades
ALTER TABLE properties 
ADD COLUMN accepts_exchange boolean DEFAULT false;
-- Adicionar coluna neighborhood na tabela properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Criar índice para melhorar performance das buscas
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);

-- Comentário explicativo
COMMENT ON COLUMN properties.neighborhood IS 'Bairro do imóvel, separado do endereço completo';
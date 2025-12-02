-- Zerar tabela de resumo de analytics
DELETE FROM analytics_summary;

-- Zerar tabela de eventos de analytics
DELETE FROM analytics_events;

-- Zerar contador de visualizações dos imóveis
UPDATE properties SET view_count = 0;
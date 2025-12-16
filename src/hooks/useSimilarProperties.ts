
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  city: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  images: string[];
  tenant_id?: string;
  slug?: string;
}

export const useSimilarProperties = (currentProperty: Property | null, limit: number = 4) => {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProperty) return;

    const fetchSimilarProperties = async () => {
      setLoading(true);
      try {
        const priceRange = currentProperty.price * 0.3; // 30% de variação de preço
        const minPrice = currentProperty.price - priceRange;
        const maxPrice = currentProperty.price + priceRange;

        let query = supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .eq('property_type', currentProperty.property_type)
          .eq('city', currentProperty.city)
          .neq('id', currentProperty.id)
          .gte('price', minPrice)
          .lte('price', maxPrice)
          .limit(limit);

        // Filtrar por tenant_id se disponível
        if (currentProperty.tenant_id) {
          query = query.eq('tenant_id', currentProperty.tenant_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Se não encontrou imóveis similares com os mesmos critérios, relaxar filtros
        if (!data || data.length === 0) {
          let fallbackQuery = supabase
            .from('properties')
            .select('*')
            .eq('status', 'active')
            .eq('property_type', currentProperty.property_type)
            .neq('id', currentProperty.id)
            .limit(limit);

          if (currentProperty.tenant_id) {
            fallbackQuery = fallbackQuery.eq('tenant_id', currentProperty.tenant_id);
          }

          const { data: fallbackData, error: fallbackError } = await fallbackQuery;

          if (fallbackError) throw fallbackError;
          setSimilarProperties(fallbackData || []);
        } else {
          setSimilarProperties(data);
        }
      } catch (error) {
        console.error('Erro ao buscar imóveis similares:', error);
        setSimilarProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProperties();
  }, [currentProperty, limit]);

  return { similarProperties, loading };
};

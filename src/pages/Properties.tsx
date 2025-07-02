
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  purpose?: string;
  image: string;
  tags?: string[];
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  property_code?: string;
}

const PropertiesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedProperties: Property[] = data?.map(property => ({
        id: property.id,
        title: property.title,
        price: property.price,
        rental_price: property.rental_price,
        location: property.location,
        area: property.area || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        type: property.property_type,
        purpose: property.purpose,
        image: property.images?.[0] || '/placeholder.svg',
        tags: property.tags,
        is_beachfront: property.is_beachfront,
        is_near_beach: property.is_near_beach,
        is_development: property.is_development,
        property_code: property.property_code
      })) || [];

      setProperties(formattedProperties);
    } catch (error) {
      console.error('Erro ao buscar propriedades:', error);
    } finally {
      setLoading(false);
    }
  };

  const { filters, setFilters, filteredProperties, clearFilters } = usePropertyFilters(properties);

  // Aplicar filtros da URL ao carregar
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    const purposeFromUrl = searchParams.get('purpose');
    
    if (searchFromUrl || purposeFromUrl) {
      setFilters(prev => ({
        ...prev,
        search: searchFromUrl || '',
        purpose: purposeFromUrl || ''
      }));
    }
  }, [searchParams, setFilters]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {filters.purpose === 'rent' ? 'Imóveis para Alugar' : 
             filters.purpose === 'sale' ? 'Imóveis para Comprar' : 
             t('properties.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Encontre o imóvel perfeito para você
          </p>
        </div>

        {/* Filters */}
        <PropertyFilters
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          showAdvanced={showAdvancedFilters}
          setShowAdvanced={setShowAdvancedFilters}
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Encontrados {filteredProperties.length} imóveis
          </p>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* No Results */}
        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Nenhum imóvel encontrado com os filtros selecionados.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredProperties.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Carregar Mais Imóveis
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertiesPage;

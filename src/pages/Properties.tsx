
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropertyCardSimple from '../components/PropertyCardSimple';
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
  is_featured?: boolean;
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedProperties: Property[] = data?.map((property: any) => ({
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
        tags: Array.isArray(property.tags) ? property.tags : [],
        is_beachfront: property.is_beachfront || false,
        is_near_beach: property.is_near_beach || false,
        is_development: property.is_development || false,
        is_featured: property.is_featured || false,
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
            {filters.purpose === 'rent' ? t('properties.rent') : 
             filters.purpose === 'sale' ? t('properties.sale') : 
             t('properties.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('properties.subtitle')}
          </p>
        </div>

        {/* Layout with Sidebar */}
        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
            <div className="bg-card border rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('properties.filters')}</h3>
              <PropertyFilters
                filters={filters}
                setFilters={setFilters}
                clearFilters={clearFilters}
                showAdvanced={true}
                setShowAdvanced={setShowAdvancedFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full"
              >
                {showAdvancedFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
              
              {showAdvancedFilters && (
                <div className="mt-4 bg-card border rounded-lg shadow-sm p-6">
                  <PropertyFilters
                    filters={filters}
                    setFilters={setFilters}
                    clearFilters={clearFilters}
                    showAdvanced={true}
                    setShowAdvanced={setShowAdvancedFilters}
                  />
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {t('properties.found')} {filteredProperties.length} {t('properties.properties')}
              </p>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCardSimple key={property.id} property={property} />
              ))}
            </div>

            {/* No Results */}
            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  {t('properties.noResults')}
                </p>
                <Button onClick={clearFilters} variant="outline">
                  {t('properties.clearFilters')}
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredProperties.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  {t('properties.loadMore')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertiesPage;

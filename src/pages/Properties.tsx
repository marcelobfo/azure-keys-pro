
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropertyCardSimple from '../components/PropertyCardSimple';
import PropertyFiltersTop from '../components/PropertyFiltersTop';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { useTenantContext } from '@/contexts/TenantContext';

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  city?: string;
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
  accepts_exchange?: boolean;
  property_code?: string;
  hide_address?: boolean;
}

const PropertiesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTenant, selectedTenantId } = useTenantContext();
  
  // Tenant efetivo: prioriza selectedTenantId (super admin), depois currentTenant (detectado pela URL)
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  useEffect(() => {
    fetchProperties();
  }, [effectiveTenantId]);

  const fetchProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Filtrar por tenant se disponível
      if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const formattedProperties: Property[] = data?.map((property: any) => ({
        id: property.id,
        title: property.title,
        price: property.price,
        rental_price: property.rental_price,
        location: property.location,
        city: property.city || '',
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
        accepts_exchange: property.accepts_exchange || false,
        property_code: property.property_code,
        hide_address: property.hide_address || false
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
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {filters.purpose === 'rent' ? t('properties.rent') : 
             filters.purpose === 'sale' ? t('properties.sale') : 
             t('properties.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('properties.subtitle')}
          </p>
        </div>

        {/* Top Filters */}
        <PropertyFiltersTop
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          isExpanded={filtersExpanded}
          setIsExpanded={setFiltersExpanded}
        />

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t('properties.found')} {filteredProperties.length} {t('properties.properties')}
          </p>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </Layout>
  );
};

export default PropertiesPage;

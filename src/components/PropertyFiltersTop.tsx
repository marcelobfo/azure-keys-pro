import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/contexts/TenantContext';

interface PropertyFilters {
  search: string;
  type: string;
  city: string;
  neighborhood: string;
  purpose: string;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  bathrooms: string;
  tags: string[];
  isBeachfront: boolean;
  isNearBeach: boolean;
  isDevelopment: boolean;
  isFeatured: boolean;
  acceptsExchange: boolean;
}

interface PropertyFiltersTopProps {
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  clearFilters: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'apartamento_diferenciado', label: 'Apartamento Diferenciado' },
  { value: 'casa', label: 'Casa' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'construcao', label: 'Construção/Planta' },
  { value: 'loft', label: 'Loft' },
  { value: 'lote', label: 'Lote' },
  { value: 'sala_comercial', label: 'Sala Comercial' },
  { value: 'studio', label: 'Studio' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'fazenda', label: 'Fazenda' },
  { value: 'sitio', label: 'Sítio' },
  { value: 'chacara', label: 'Chácara' },
];

const PropertyFiltersTop: React.FC<PropertyFiltersTopProps> = ({
  filters,
  setFilters,
  clearFilters,
  isExpanded,
  setIsExpanded,
}) => {
  const { t } = useLanguage();
  const { currentTenant, selectedTenantId } = useTenantContext();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;
  
  const [cities, setCities] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!effectiveTenantId) return;

      try {
        // Buscar tipos e contar imóveis por tipo
        const { data: typesData } = await supabase
          .from('properties')
          .select('property_type')
          .eq('status', 'active')
          .eq('tenant_id', effectiveTenantId)
          .not('property_type', 'is', null);

        if (typesData) {
          const counts: Record<string, number> = {};
          typesData.forEach(item => {
            const type = item.property_type;
            if (type) {
              counts[type] = (counts[type] || 0) + 1;
            }
          });
          setTypeCounts(counts);
        }

        // Buscar cidades únicas
        const { data: citiesData } = await supabase
          .from('properties')
          .select('city')
          .eq('status', 'active')
          .eq('tenant_id', effectiveTenantId)
          .not('city', 'is', null);

        if (citiesData) {
          const uniqueCities = [...new Set(citiesData.map(c => c.city?.trim()).filter(Boolean))];
          setCities(uniqueCities.sort());
        }

        // Buscar bairros únicos
        const { data: neighborhoodsData } = await supabase
          .from('properties')
          .select('neighborhood')
          .eq('status', 'active')
          .eq('tenant_id', effectiveTenantId)
          .not('neighborhood', 'is', null);

        if (neighborhoodsData) {
          const uniqueNeighborhoods = [...new Set(
            (neighborhoodsData as any[])
              .map(n => n.neighborhood?.trim())
              .filter(Boolean)
          )];
          setNeighborhoods(uniqueNeighborhoods.sort());
        }

      } catch (error) {
        console.error('Erro ao buscar opções de filtro:', error);
      }
    };

    fetchFilterOptions();
  }, [effectiveTenantId]);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value.length > 0;
    if (key === 'tags') return (value as string[]).length > 0;
    if (key === 'priceMin') return value > 0;
    if (key === 'priceMax') return value < 100000000;
    if (key === 'areaMin') return value > 0;
    if (key === 'areaMax') return value < 2000;
    if (typeof value === 'boolean') return value;
    return value !== '';
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type) count++;
    if (filters.city) count++;
    if (filters.neighborhood) count++;
    if (filters.purpose) count++;
    if (filters.priceMin > 0 || filters.priceMax < 100000000) count++;
    if (filters.areaMin > 0 || filters.areaMax < 2000) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.tags.length > 0) count++;
    if (filters.isBeachfront || filters.isNearBeach || filters.isDevelopment || filters.isFeatured || filters.acceptsExchange) count++;
    return count;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'sale': 'Venda',
      'rent': 'Aluguel',
      'rent_annual': 'Aluguel Anual',
      'rent_seasonal': 'Aluguel Temporada',
      'both': 'Venda e Aluguel'
    };
    return labels[purpose] || purpose;
  };

  const formatPropertyType = (type: string) => {
    const labels: Record<string, string> = {
      'apartamento': 'Apartamento',
      'apartamento_diferenciado': 'Apartamento Diferenciado',
      'casa': 'Casa',
      'cobertura': 'Cobertura',
      'construcao': 'Construção/Planta',
      'loft': 'Loft',
      'lote': 'Lote',
      'sala_comercial': 'Sala Comercial',
      'studio': 'Studio',
      'terreno': 'Terreno',
      'sobrado': 'Sobrado',
      'galpao': 'Galpão',
      'fazenda': 'Fazenda',
      'sitio': 'Sítio',
      'chacara': 'Chácara'
    };
    return labels[type?.toLowerCase()] || type;
  };

  return (
    <Card className="mb-6 p-4">
      {/* Top Row - Always Visible */}
      <div className="space-y-4">
        {/* Search Input - Full Width */}
        <div className="w-full">
          <Input
            type="text"
            placeholder="Buscar imóveis..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters Row - Stacked on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Quick Filters */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-3 flex-1">
            <Select value={filters.purpose || 'all'} onValueChange={(value) => updateFilter('purpose', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full xs:w-40">
                <SelectValue placeholder="Finalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Finalidades</SelectItem>
                <SelectItem value="sale">Venda</SelectItem>
                <SelectItem value="rent">Aluguel</SelectItem>
                <SelectItem value="rent_annual">Aluguel Anual</SelectItem>
                <SelectItem value="rent_seasonal">Aluguel Temporada</SelectItem>
                <SelectItem value="both">Venda e Aluguel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full xs:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {PROPERTY_TYPES
                  .filter(type => typeCounts[type.value] > 0)
                  .map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} ({typeCounts[type.value]})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Expand/Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {t('properties.filters')}
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 text-muted-foreground whitespace-nowrap"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t pt-4 space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <Select value={filters.city || 'all'} onValueChange={(value) => updateFilter('city', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Neighborhood */}
            <div>
              <label className="block text-sm font-medium mb-1">Bairro</label>
              <Select value={filters.neighborhood || 'all'} onValueChange={(value) => updateFilter('neighborhood', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Bairros</SelectItem>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Preço Mínimo</label>
              <Input
                type="number"
                placeholder="R$ 0"
                value={filters.priceMin || ''}
                onChange={(e) => updateFilter('priceMin', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preço Máximo</label>
              <Input
                type="number"
                placeholder="R$ 999.999.999"
                value={filters.priceMax === 100000000 ? '' : filters.priceMax}
                onChange={(e) => updateFilter('priceMax', parseInt(e.target.value) || 100000000)}
              />
            </div>

            {/* Area Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Área Mínima (m²)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.areaMin || ''}
                onChange={(e) => updateFilter('areaMin', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium mb-1">Quartos</label>
              <Select value={filters.bedrooms || 'any'} onValueChange={(value) => updateFilter('bedrooms', value === 'any' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium mb-1">Banheiros</label>
              <Select value={filters.bathrooms || 'any'} onValueChange={(value) => updateFilter('bathrooms', value === 'any' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Area */}
            <div>
              <label className="block text-sm font-medium mb-1">Área Máxima (m²)</label>
              <Input
                type="number"
                placeholder="999999"
                value={filters.areaMax === 2000 ? '' : filters.areaMax}
                onChange={(e) => updateFilter('areaMax', parseInt(e.target.value) || 2000)}
              />
            </div>
          </div>

          {/* Special Features */}
          <div>
            <label className="block text-sm font-medium mb-2">Características Especiais</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.isBeachfront ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('isBeachfront', !filters.isBeachfront)}
              >
                Frente para o Mar
              </Button>
              <Button
                variant={filters.isNearBeach ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('isNearBeach', !filters.isNearBeach)}
              >
                Próximo à Praia
              </Button>
              <Button
                variant={filters.isDevelopment ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('isDevelopment', !filters.isDevelopment)}
              >
                Lançamento
              </Button>
              <Button
                variant={filters.isFeatured ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('isFeatured', !filters.isFeatured)}
              >
                Destaque
              </Button>
              <Button
                variant={filters.acceptsExchange ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('acceptsExchange', !filters.acceptsExchange)}
              >
                Aceita Permuta
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PropertyFiltersTop;

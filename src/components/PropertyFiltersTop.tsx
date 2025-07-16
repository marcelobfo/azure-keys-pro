import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertyFilters {
  search: string;
  type: string;
  city: string;
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
}

interface PropertyFiltersTopProps {
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  clearFilters: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const PropertyFiltersTop: React.FC<PropertyFiltersTopProps> = ({
  filters,
  setFilters,
  clearFilters,
  isExpanded,
  setIsExpanded,
}) => {
  const { t } = useLanguage();

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
    if (filters.purpose) count++;
    if (filters.priceMin > 0 || filters.priceMax < 100000000) count++;
    if (filters.areaMin > 0 || filters.areaMax < 2000) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.tags.length > 0) count++;
    if (filters.isBeachfront || filters.isNearBeach || filters.isDevelopment || filters.isFeatured) count++;
    return count;
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
              <SelectTrigger className="w-full xs:w-32">
                <SelectValue placeholder="Finalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sale">Venda</SelectItem>
                <SelectItem value="rent">Aluguel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full xs:w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="cobertura">Cobertura</SelectItem>
                <SelectItem value="lote">Lote</SelectItem>
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
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <Input
                type="text"
                placeholder="Digite a cidade"
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
              />
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
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PropertyFiltersTop;
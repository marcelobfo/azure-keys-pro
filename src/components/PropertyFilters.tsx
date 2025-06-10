
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface PropertyFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  setFilters,
  clearFilters,
  showAdvanced,
  setShowAdvanced
}) => {
  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🏠 Tipo de Imóvel
            </label>
            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Cobertura">Cobertura</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="Loft">Loft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📍 Cidade
            </label>
            <Input
              placeholder="Digite a cidade"
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
            />
          </div>

          {/* Price Min */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              💰 Preço Mínimo
            </label>
            <Input
              type="number"
              placeholder="R$ 0"
              value={filters.priceMin}
              onChange={(e) => updateFilter('priceMin', parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Price Max */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preço Máximo
            </label>
            <Input
              type="number"
              placeholder="R$ 999.999.999"
              value={filters.priceMax}
              onChange={(e) => updateFilter('priceMax', parseInt(e.target.value) || 5000000)}
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              🔍 Buscar Imóveis
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{showAdvanced ? 'Filtros Simples' : 'Filtros Avançados'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Limpar Filtros</span>
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quartos (mín)
                </label>
                <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="2+" />
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

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banheiros (mín)
                </label>
                <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="3+" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area Min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Área Mín (m²)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.areaMin}
                  onChange={(e) => updateFilter('areaMin', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Area Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Área Máx (m²)
                </label>
                <Input
                  type="number"
                  placeholder="999"
                  value={filters.areaMax}
                  onChange={(e) => updateFilter('areaMax', parseInt(e.target.value) || 1000)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyFilters;

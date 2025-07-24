
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Search } from 'lucide-react';

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
        {/* Search Bar Principal */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔍 Buscar Imóveis
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Digite o nome, localização ou código do imóvel (ex: AP-001)"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 text-lg py-3"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            💡 Dica: Você pode buscar pelo código do imóvel (ex: CA-001, AP-002)
          </p>
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
        </div>

        {/* Filtros Especiais - Cards em destaque */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            ⭐ Categorias Especiais
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Checkbox
                id="featured"
                checked={filters.isFeatured}
                onCheckedChange={(checked) => updateFilter('isFeatured', checked)}
              />
              <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                🌟 Em Destaque
              </label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Checkbox
                id="beachfront"
                checked={filters.isBeachfront}
                onCheckedChange={(checked) => updateFilter('isBeachfront', checked)}
              />
              <label htmlFor="beachfront" className="text-sm font-medium cursor-pointer">
                🏖️ Frente Mar
              </label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
              <Checkbox
                id="nearBeach"
                checked={filters.isNearBeach}
                onCheckedChange={(checked) => updateFilter('isNearBeach', checked)}
              />
              <label htmlFor="nearBeach" className="text-sm font-medium cursor-pointer">
                🏄 Quadra Mar
              </label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <Checkbox
                id="development"
                checked={filters.isDevelopment}
                onCheckedChange={(checked) => updateFilter('isDevelopment', checked)}
              />
              <label htmlFor="development" className="text-sm font-medium cursor-pointer">
                🏗️ Empreendimento
              </label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
              <Checkbox
                id="acceptsExchange"
                checked={filters.acceptsExchange}
                onCheckedChange={(checked) => updateFilter('acceptsExchange', checked)}
              />
              <label htmlFor="acceptsExchange" className="text-sm font-medium cursor-pointer">
                🔄 Aceita Permuta
              </label>
            </div>
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
                  🛏️ Quartos (mín)
                </label>
                <Select value={filters.bedrooms} onValueChange={(value) => updateFilter('bedrooms', value)}>
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

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🚿 Banheiros (mín)
                </label>
                <Select value={filters.bathrooms} onValueChange={(value) => updateFilter('bathrooms', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer" />
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
                  📐 Área Mín (m²)
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
                  📏 Área Máx (m²)
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

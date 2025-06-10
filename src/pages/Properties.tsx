
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import { usePropertyFilters } from '../hooks/usePropertyFilters';

const PropertiesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const properties = [
    {
      id: '1',
      title: 'Casa Moderna no Centro',
      price: 850000,
      location: 'São Paulo, SP',
      area: 180,
      bedrooms: 3,
      bathrooms: 2,
      type: 'Casa',
      image: 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop'
    },
    {
      id: '2',
      title: 'Apartamento Luxo Vista Mar',
      price: 1200000,
      location: 'Rio de Janeiro, RJ',
      area: 120,
      bedrooms: 2,
      bathrooms: 2,
      type: 'Apartamento',
      image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      title: 'Cobertura Duplex',
      price: 2100000,
      location: 'Belo Horizonte, MG',
      area: 250,
      bedrooms: 4,
      bathrooms: 3,
      type: 'Cobertura',
      image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&h=300&fit=crop'
    },
    {
      id: '4',
      title: 'Studio Moderno',
      price: 350000,
      location: 'Curitiba, PR',
      area: 45,
      bedrooms: 1,
      bathrooms: 1,
      type: 'Studio',
      image: 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=400&h=300&fit=crop'
    },
    {
      id: '5',
      title: 'Casa de Campo',
      price: 750000,
      location: 'Campos do Jordão, SP',
      area: 300,
      bedrooms: 4,
      bathrooms: 3,
      type: 'Casa',
      image: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=400&h=300&fit=crop'
    },
    {
      id: '6',
      title: 'Loft Industrial',
      price: 680000,
      location: 'Porto Alegre, RS',
      area: 85,
      bedrooms: 1,
      bathrooms: 1,
      type: 'Loft',
      image: 'https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?w=400&h=300&fit=crop'
    }
  ];

  const { filters, setFilters, filteredProperties, clearFilters } = usePropertyFilters(properties);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('properties.title')}
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
    </div>
  );
};

export default PropertiesPage;

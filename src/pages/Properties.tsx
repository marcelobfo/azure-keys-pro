
import React, { useState } from 'react';
import { Search, Filter, MapPin, Home, Bed, Bath, Square } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const PropertiesPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    city: '',
    priceRange: [0, 2000000],
    areaRange: [0, 500],
    bedrooms: '',
    bathrooms: ''
  });

  const properties = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      id: 4,
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
      id: 5,
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
      id: 6,
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-8">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('home.search.placeholder')}
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t('properties.filter.type')} />
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

            <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t('properties.filter.city')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                <SelectItem value="São Paulo">São Paulo, SP</SelectItem>
                <SelectItem value="Rio de Janeiro">Rio de Janeiro, RJ</SelectItem>
                <SelectItem value="Belo Horizonte">Belo Horizonte, MG</SelectItem>
                <SelectItem value="Curitiba">Curitiba, PR</SelectItem>
                <SelectItem value="Porto Alegre">Porto Alegre, RS</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{t('properties.filter.advanced')}</span>
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('properties.filter.price')}: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters({...filters, priceRange: value})}
                    max={5000000}
                    min={0}
                    step={50000}
                    className="w-full"
                  />
                </div>

                {/* Area Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('properties.filter.area')}: {filters.areaRange[0]}m² - {filters.areaRange[1]}m²
                  </label>
                  <Slider
                    value={filters.areaRange}
                    onValueChange={(value) => setFilters({...filters, areaRange: value})}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Bedrooms */}
                <Select value={filters.bedrooms} onValueChange={(value) => setFilters({...filters, bedrooms: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Quartos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="1">1 quarto</SelectItem>
                    <SelectItem value="2">2 quartos</SelectItem>
                    <SelectItem value="3">3 quartos</SelectItem>
                    <SelectItem value="4">4+ quartos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Bathrooms */}
                <Select value={filters.bathrooms} onValueChange={(value) => setFilters({...filters, bathrooms: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Banheiros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer</SelectItem>
                    <SelectItem value="1">1 banheiro</SelectItem>
                    <SelectItem value="2">2 banheiros</SelectItem>
                    <SelectItem value="3">3+ banheiros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Card key={property.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800">
              <div className="relative overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {formatPrice(property.price)}
                </div>
                <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                  {property.type}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {property.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Square className="w-4 h-4 mr-1" />
                      {property.area}m²
                    </span>
                    <span className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" />
                      {property.bedrooms}
                    </span>
                    <span className="flex items-center">
                      <Bath className="w-4 h-4 mr-1" />
                      {property.bathrooms}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                  >
                    {t('properties.contact')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Carregar Mais Imóveis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;

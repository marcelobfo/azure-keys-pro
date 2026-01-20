import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Toilet, Square, Umbrella, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import PropertyCardTags from './PropertyCardTags';

interface Property {
  id: string;
  slug?: string;
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

interface PropertyCardSimpleProps {
  property: Property;
}

const PropertyCardSimple: React.FC<PropertyCardSimpleProps> = ({ property }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  const getPriceDisplay = () => {
    if (['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price) {
      return `${formatPrice(property.rental_price)}/mês`;
    } else if (property.purpose === 'both') {
      return `${formatPrice(property.price)}`;
    } else {
      return formatPrice(property.price);
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800">
      <div className="relative overflow-hidden cursor-pointer" onClick={() => navigate(property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`)}>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Tags */}
        <PropertyCardTags property={property} maxVisibleTags={2} />
        
        {/* Preço */}
        {property.purpose === 'both' ? (
          <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Venda: {formatPrice(property.price)}
            </div>
            {property.rental_price && (
              <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Aluguel: {formatPrice(property.rental_price)}/mês
              </div>
            )}
          </div>
        ) : ['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10 flex items-center gap-1">
            {property.purpose === 'rent_seasonal' && <Umbrella className="w-4 h-4" />}
            {property.purpose === 'rent_seasonal' ? 'Temporada: ' : ''}{formatPrice(property.rental_price)}/mês
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10 flex items-center gap-1">
            <Key className="w-4 h-4" />
            {formatPrice(property.price)}
          </div>
        )}
        
        {/* Tipo */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.type}
        </div>

        {/* Botão de favorito */}
        <Button
          onClick={handleFavoriteClick}
          className={`absolute bottom-4 right-4 p-2 rounded-full transition-colors z-10 ${
            isFavorite(property.id)
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-600'
          }`}
          size="sm"
        >
          <Heart className={`w-4 h-4 ${isFavorite(property.id) ? 'fill-current' : ''}`} />
        </Button>
      </div>
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {property.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">
            {property.city || property.location}
          </span>
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            {property.area}m²
          </span>
          <span className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            {property.bedrooms}
          </span>
          <span className="flex items-center">
            <Toilet className="w-4 h-4 mr-1" />
            {property.bathrooms}
          </span>
        </div>
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate(property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`)}
        >
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

export default PropertyCardSimple;
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Toilet, Square, Umbrella, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import InterestModal from './InterestModal';
import ScheduleVisitModal from './ScheduleVisitModal';
import PropertyCardTags from './PropertyCardTags';

interface Property {
  id: string;
  slug?: string;
  title: string;
  price: number;
  rental_price?: number;
  purpose?: string;
  location: string;
  city?: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  image: string;
  tags?: string[];
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  is_featured?: boolean;
  accepts_exchange?: boolean;
  hide_address?: boolean;
}

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // Hook useFavorites configurado para redirecionar para /auth se não autenticado
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id.toString());
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800">
      <div className="relative overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Tags */}
        <PropertyCardTags property={property} maxVisibleTags={2} />
        
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
        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.type}
        </div>
        <Button
          onClick={handleFavoriteClick}
          className={`absolute bottom-4 right-4 p-2 rounded-full transition-colors z-10 ${
            isFavorite(property.id.toString())
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-600'
          }`}
          size="sm"
        >
          <Heart className={`w-4 h-4 ${isFavorite(property.id.toString()) ? 'fill-current' : ''}`} />
        </Button>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {property.city || property.location}
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
              <Toilet className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`)}
          >
            Ver Detalhes
          </Button>
          <div className="flex space-x-2">
            <InterestModal 
              propertyId={property.id}
              propertyTitle={property.title}
            />
            <ScheduleVisitModal 
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;

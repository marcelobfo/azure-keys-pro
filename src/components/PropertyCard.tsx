import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import InterestModal from './InterestModal';
import ScheduleVisitModal from './ScheduleVisitModal';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  image: string;
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
      minimumFractionDigits: 0
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
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {formatPrice(property.price)}
        </div>
        <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.type}
        </div>
        <Button
          onClick={handleFavoriteClick}
          className={`absolute top-16 left-4 p-2 rounded-full transition-colors ${
            isFavorite(property.id.toString())
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white hover:bg-gray-100 text-gray-600'
          }`}
          size="sm"
        >
          <svg className={`w-4 h-4 ${isFavorite(property.id.toString()) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-1.45-1.32c-5.35-4.89-8.88-8.14-8.88-11.54A5.13 5.13 0 016.6 2c1.63 0 3.19.79 4.13 2.06C11.21 2.79 12.77 2 14.4 2A5.13 5.13 0 0121 8.14c0 3.4-3.53 6.65-8.88 11.54L12 21z"/>
          </svg>
        </Button>
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
        
        <div className="space-y-2">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(`/property/${property.id}`)}
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

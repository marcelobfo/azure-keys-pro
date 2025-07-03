
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Bath, Square, Car, Home, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import PropertyTag from './PropertyTag';
import { formatCurrency } from '../utils/priceUtils';

interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  area: number;
  bedrooms: number;
  images: string[];
  property_type: string;
  bathrooms: number;
  suites?: number;
  city: string;
  state: string;
  purpose?: string;
  tags?: string[];
  property_code?: string;
}

interface PropertyCardEnhancedProps {
  property: FeaturedProperty;
}

const PropertyCardEnhanced: React.FC<PropertyCardEnhancedProps> = ({ property }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 cursor-pointer">
      <div
        className="relative overflow-hidden"
        onClick={() => navigate(`/property/${property.id}`)}
      >
        <img
          src={
            property.images?.[0] ||
            'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop'
          }
          alt={property.title}
          className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {property.tags && property.tags.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-wrap gap-1">
            {property.tags.slice(0, 2).map((tag, index) => (
              <PropertyTag key={index} tag={tag} />
            ))}
          </div>
        )}

        {property.property_code && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-mono">
            {property.property_code}
          </div>
        )}

        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          {property.purpose === 'rent' && property.rental_price ? (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {formatCurrency(property.rental_price)}/mês
            </div>
          ) : property.purpose === 'both' ? (
            <>
              <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Venda: {formatCurrency(property.price)}
              </div>
              {property.rental_price && (
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Aluguel: {formatCurrency(property.rental_price)}/mês
                </div>
              )}
            </>
          ) : (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {formatCurrency(property.price)}
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.property_type}
        </div>

        <Button
          onClick={e => {
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className={`absolute top-16 left-4 p-2 rounded-full transition-colors ${
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
        <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center truncate">
          <MapPin className="w-4 h-4 mr-1" />
          {property.location}
        </p>
        
        {/* Características com ícones em destaque */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-center">
              <Square className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{property.area}m²</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Área</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-center">
              <Bed className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{property.bedrooms}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Quartos</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="text-center">
              <Bath className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{property.bathrooms}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Banheiros</div>
            </div>
          </div>
          
          {property.suites && property.suites > 0 ? (
            <div className="flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-center">
                <Users className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{property.suites}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Suítes</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
              <div className="text-center">
                <Home className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <div className="text-sm font-semibold text-gray-900 dark:text-white">-</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Extras</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCardEnhanced;

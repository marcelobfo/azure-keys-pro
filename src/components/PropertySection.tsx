
import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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
  city: string;
  state: string;
  purpose?: string;
  tags?: string[];
  property_code?: string;
}

interface PropertySectionProps {
  title: string;
  properties: FeaturedProperty[];
  emptyMessage: string;
  loading: boolean;
}

const PropertySection: React.FC<PropertySectionProps> = ({
  title,
  properties,
  emptyMessage,
  loading
}) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80"></div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center py-8">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map((property) => (
        <Card
          key={property.id}
          className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 cursor-pointer"
        >
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
              <svg className={`w-4 h-4 ${isFavorite(property.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-1.45-1.32c-5.35-4.89-8.88-8.14-8.88-11.54A5.13 5.13 0 016.6 2c1.63 0 3.19.79 4.13 2.06C11.21 2.79 12.77 2 14.4 2A5.13 5.13 0 0121 8.14c0 3.4-3.53 6.65-8.88 11.54L12 21z"/>
              </svg>
            </Button>
          </div>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center truncate">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{property.area}m²</span>
              <span>{property.bedrooms} quartos</span>
              <span>{property.bathrooms} banheiros</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PropertySection;

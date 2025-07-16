
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/priceUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFavorites } from '@/hooks/useFavorites';
import PropertyCardTags from './PropertyCardTags';

interface FeaturedProperty {
  id: string;
  slug?: string;
  title: string;
  price: number;
  rental_price?: number;
  purpose?: string;
  property_code?: string;
  property_type: string;
  images: string[];
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  tags?: string[];
}

interface PropertyCardImageProps {
  property: FeaturedProperty;
  className?: string;
}

const PropertyCardImage: React.FC<PropertyCardImageProps> = ({ 
  property, 
  className = "" 
}) => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handlePropertyClick = () => {
    trackEvent('property_view', {
      property_id: property.id,
      property_title: property.title,
      property_type: property.property_type,
      price: property.price
    });
    navigate(property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      onClick={handlePropertyClick}
    >
      <img
        src={
          property.images?.[0] ||
          'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop'
        }
        alt={property.title}
        className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      {/* Tags no canto superior esquerdo */}
      <PropertyCardTags property={property} />

      {/* Preços no canto inferior direito */}
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

      {/* Tipo da propriedade e código no canto inferior esquerdo */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
          {property.property_type}
        </div>
        {property.property_code && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
            {property.property_code}
          </div>
        )}
      </div>

      {/* Botão de favorito */}
      <Button
        onClick={handleFavoriteClick}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
          isFavorite(property.id)
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-white hover:bg-gray-100 text-gray-600'
        }`}
        size="sm"
      >
        <Heart className={`w-4 h-4 ${isFavorite(property.id) ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
};

export default PropertyCardImage;

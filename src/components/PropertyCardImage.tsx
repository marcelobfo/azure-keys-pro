
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
      
      {/* Tags no canto superior esquerdo com mais espaço */}
      <PropertyCardTags property={property} maxVisibleTags={3} />

      {/* Apenas código da propriedade no canto inferior esquerdo */}
      {property.property_code && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/90 dark:bg-slate-800/90 text-gray-900 dark:text-white px-2 py-1 rounded text-xs font-medium">
            {property.property_code}
          </div>
        </div>
      )}

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

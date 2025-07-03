
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import PropertyCardImage from './PropertyCardImage';
import PropertyCardContent from './PropertyCardContent';

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
  features?: string[];
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
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
      <PropertyCardImage 
        property={property}
        isFavorite={isFavorite}
        toggleFavorite={toggleFavorite}
      />
      
      <CardContent className="p-0">
        <PropertyCardContent property={property} />
      </CardContent>
    </Card>
  );
};

export default PropertyCardEnhanced;

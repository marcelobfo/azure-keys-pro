
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  hide_address?: boolean;
}

interface PropertyCardEnhancedProps {
  property: FeaturedProperty;
}

const PropertyCardEnhanced: React.FC<PropertyCardEnhancedProps> = ({ property }) => {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 cursor-pointer">
        <PropertyCardImage 
          property={property}
        />
      
      <CardContent className="p-0">
        <PropertyCardContent property={property} />
      </CardContent>
    </Card>
  );
};

export default PropertyCardEnhanced;


import React from 'react';
import PropertyCardEnhanced from './PropertyCardEnhanced';

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
        <PropertyCardEnhanced key={property.id} property={property} />
      ))}
    </div>
  );
};

export default PropertySection;


import React from 'react';
import { MapPin } from 'lucide-react';
import PropertyCardSpecs from './PropertyCardSpecs';

interface FeaturedProperty {
  title: string;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  features?: string[];
}

interface PropertyCardContentProps {
  property: FeaturedProperty;
}

const PropertyCardContent: React.FC<PropertyCardContentProps> = ({ property }) => {
  const propertyFeatures = Array.isArray(property.features) ? property.features : [];

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
        {property.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <span className="truncate">{property.location}</span>
      </p>
      
      {/* Características com ícones em destaque */}
      <PropertyCardSpecs property={property} />

      {/* Mostrar algumas características principais se existirem */}
      {propertyFeatures.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {propertyFeatures.slice(0, 3).map((feature, index) => (
              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {feature}
              </span>
            ))}
            {propertyFeatures.length > 3 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                +{propertyFeatures.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCardContent;

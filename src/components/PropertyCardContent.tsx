
import React from 'react';
import { MapPin, Umbrella } from 'lucide-react';
import PropertyCardSpecs from './PropertyCardSpecs';
import { formatCurrency } from '../utils/priceUtils';

interface FeaturedProperty {
  title: string;
  location: string;
  city?: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  features?: string[];
  price: number;
  rental_price?: number;
  purpose?: string;
  hide_address?: boolean;
}

interface PropertyCardContentProps {
  property: FeaturedProperty;
}

const PropertyCardContent: React.FC<PropertyCardContentProps> = ({ property }) => {
  const propertyFeatures = Array.isArray(property.features) ? property.features : [];

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
        {property.title}
      </h3>
      
      {/* Preços abaixo do título */}
      <div className="mb-3">
        {['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
          <div className="text-lg font-bold text-green-600 flex items-center gap-1">
            {property.purpose === 'rent_seasonal' && <Umbrella className="w-4 h-4" />}
            {property.purpose === 'rent_seasonal' ? 'Temporada: ' : 'Aluguel: '}{formatCurrency(property.rental_price)}/mês
          </div>
        ) : property.purpose === 'both' ? (
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-blue-600">
              Venda: {formatCurrency(property.price)}
            </div>
            {property.rental_price && (
              <div className="text-sm font-semibold text-green-600">
                Aluguel: {formatCurrency(property.rental_price)}/mês
              </div>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(property.price)}
          </div>
        )}
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center">
        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
        <span className="truncate">
          {property.hide_address && property.city ? property.city : property.location}
        </span>
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

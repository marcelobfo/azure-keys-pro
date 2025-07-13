
import React from 'react';
import { Bed, Bath, Square, Users, Home } from 'lucide-react';

interface FeaturedProperty {
  area: number;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
}

interface PropertyCardSpecsProps {
  property: FeaturedProperty;
}

const PropertyCardSpecs: React.FC<PropertyCardSpecsProps> = ({ property }) => {
  return (
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
        <div className="flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div className="text-center">
            <Users className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-gray-900 dark:text-white">0</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Suítes</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyCardSpecs;

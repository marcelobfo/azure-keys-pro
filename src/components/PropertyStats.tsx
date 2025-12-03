
import React from 'react';
import { Bed, Toilet, Square, DoorOpen } from 'lucide-react';

interface PropertyStatsProps {
  bedrooms: number;
  bathrooms: number;
  area: number;
  suites?: number;
}

const PropertyStats: React.FC<PropertyStatsProps> = ({ bedrooms, bathrooms, area, suites }) => {
  return (
    <div className={`grid ${suites ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'} gap-3 md:gap-6 mb-8`}>
      <div className="text-center p-3 md:p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
        <div className="flex flex-col md:flex-row items-center justify-center mb-2">
          <Bed className="w-5 h-5 md:w-6 md:h-6 md:mr-2 text-blue-600 mb-1 md:mb-0" />
          <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{bedrooms}</span>
        </div>
        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium">Quartos</span>
      </div>
      <div className="text-center p-3 md:p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
        <div className="flex flex-col md:flex-row items-center justify-center mb-2">
          <Toilet className="w-5 h-5 md:w-6 md:h-6 md:mr-2 text-blue-600 mb-1 md:mb-0" />
          <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{bathrooms}</span>
        </div>
        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium">{bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</span>
      </div>
      <div className="text-center p-3 md:p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
        <div className="flex flex-col md:flex-row items-center justify-center mb-2">
          <Square className="w-5 h-5 md:w-6 md:h-6 md:mr-2 text-blue-600 mb-1 md:mb-0" />
          <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{area}m²</span>
        </div>
        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium">Área</span>
      </div>
      {suites !== undefined && suites > 0 && (
        <div className="text-center p-3 md:p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
          <div className="flex flex-col md:flex-row items-center justify-center mb-2">
            <DoorOpen className="w-5 h-5 md:w-6 md:h-6 md:mr-2 text-blue-600 mb-1 md:mb-0" />
            <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{suites}</span>
          </div>
          <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium">Suítes</span>
        </div>
      )}
    </div>
  );
};

export default PropertyStats;

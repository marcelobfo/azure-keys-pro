
import React from 'react';

interface PropertyFeaturesProps {
  features: string[];
}

const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ features }) => {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Características</h3>
      <div className="bg-white dark:bg-slate-700 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 flex-shrink-0"></div>
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyFeatures;

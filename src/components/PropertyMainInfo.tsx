
import React from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PropertyStats from './PropertyStats';
import PropertyMultimedia from './PropertyMultimedia';
import PropertyFeatures from './PropertyFeatures';
import PropertyTag from './PropertyTag';
import SimilarProperties from './SimilarProperties';
import { formatCurrency } from '@/utils/priceUtils';

interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  property_type: string;
  price: number;
  rental_price?: number;
  purpose?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description?: string;
  features?: string[];
  virtual_tour_url?: string;
  video_url?: string;
  tags?: string[];
  property_code?: string;
  images: string[];
}

interface PropertyMainInfoProps {
  property: Property;
}

const PropertyMainInfo: React.FC<PropertyMainInfoProps> = ({ property }) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {property.title}
              </h1>
              {property.property_code && (
                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {property.property_code}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-lg">{property.location}, {property.city}</span>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 text-sm font-medium"
          >
            {property.property_type}
          </Badge>
        </div>

        {/* Tags */}
        {property.tags && property.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {property.tags.map((tag, index) => (
                <PropertyTag key={index} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
          {property.purpose === 'both' && property.rental_price ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(property.price)}
                </div>
                <div className="text-blue-100">Preço de Venda</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(property.rental_price)}/mês
                </div>
                <div className="text-blue-100">Preço de Aluguel</div>
              </div>
            </div>
          ) : property.purpose === 'rent' && property.rental_price ? (
            <>
              <div className="text-4xl font-bold">
                {formatCurrency(property.rental_price)}/mês
              </div>
              <div className="text-blue-100 mt-1">Valor do aluguel</div>
            </>
          ) : (
            <>
              <div className="text-4xl font-bold">
                {formatCurrency(property.price)}
              </div>
              <div className="text-blue-100 mt-1">Valor do imóvel</div>
            </>
          )}
        </div>

        {/* Property Stats */}
        <PropertyStats 
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          area={property.area}
        />

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Descrição</h3>
          <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              {property.description || 'Sem descrição disponível.'}
            </p>
          </div>
        </div>

        {/* Virtual Tour and Video */}
        <PropertyMultimedia 
          virtualTourUrl={property.virtual_tour_url}
          videoUrl={property.video_url}
        />

        {/* Features */}
        {property.features && (
          <PropertyFeatures features={property.features} />
        )}

        {/* Similar Properties */}
        <SimilarProperties currentProperty={property} />
      </CardContent>
    </Card>
  );
};

export default PropertyMainInfo;

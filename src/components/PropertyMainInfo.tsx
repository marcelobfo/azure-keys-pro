
import React from 'react';
import { MapPin, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PropertyStats from './PropertyStats';
import PropertyMultimedia from './PropertyMultimedia';
import PropertyFeatures from './PropertyFeatures';
import PropertyTag from './PropertyTag';
import { formatCurrency } from '@/utils/priceUtils';
import { useProfile } from '@/hooks/useProfile';

interface Property {
  id: string;
  title: string;
  location: string;
  city: string;
  neighborhood?: string;
  property_type: string;
  price: number;
  rental_price?: number;
  purpose?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  suites?: number;
  description?: string;
  features?: string[];
  virtual_tour_url?: string;
  video_url?: string;
  tags?: string[];
  property_code?: string;
  images: string[];
  hide_address?: boolean;
}

interface PropertyMainInfoProps {
  property: Property;
}

const PropertyMainInfo: React.FC<PropertyMainInfoProps> = ({ property }) => {
  const { profile } = useProfile();
  
  // Verificar se o usuário é admin ou master (somente eles podem ver endereço completo)
  const isAuthorized = profile && ['admin', 'master'].includes(profile.role);
  
  // Ocultar endereço para todos exceto admin/master
  const shouldHideAddress = !isAuthorized;
  
  // Mostrar indicador "Endereço oculto" para admin/master saberem que está configurado
  const showHiddenIndicator = property.hide_address === true && isAuthorized;
  
  // Mostrar apenas a cidade para usuários não autorizados
  const getSimplifiedLocation = () => {
    return property.city || '';
  };

  // Mostrar endereço completo incluindo bairro
  const getFullLocation = () => {
    const parts = [property.location];
    if (property.neighborhood) {
      parts.push(property.neighborhood);
    }
    parts.push(property.city);
    return parts.filter(Boolean).join(', ');
  };

  const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
      <CardContent className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
          <div className="flex-1">
            <div className="mb-3">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                {property.title}
              </h1>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
              <span className="text-base md:text-lg">
                {shouldHideAddress ? getSimplifiedLocation() : getFullLocation()}
              </span>
              {showHiddenIndicator && (
                <span className="ml-2 flex items-center text-sm text-amber-600 dark:text-amber-400">
                  <EyeOff className="w-3 h-3 mr-1" />
                  {isAuthorized ? 'Oculto para visitantes' : 'Endereço oculto'}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 md:px-4 md:py-2 text-sm font-medium w-fit"
            >
              {property.property_type}
            </Badge>
            {property.property_code && (
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-fit">
                {property.property_code}
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        {property.tags && property.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 md:gap-3">
              {property.tags.map((tag, index) => (
                <PropertyTag key={index} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="mb-8 p-4 md:p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
          {property.purpose === 'both' && property.rental_price ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(property.price)}
                </div>
                <div className="text-blue-100 text-sm md:text-base">Preço de Venda</div>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(property.rental_price)}/mês
                </div>
                <div className="text-blue-100 text-sm md:text-base">Preço de Aluguel</div>
              </div>
            </div>
          ) : ['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
            <>
              <div className="text-2xl md:text-4xl font-bold">
                {formatCurrency(property.rental_price)}/mês
              </div>
              <div className="text-blue-100 mt-1 text-sm md:text-base">
                {property.purpose === 'rent_seasonal' ? 'Aluguel Temporada' : 'Aluguel Anual'}
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl md:text-4xl font-bold">
                {formatCurrency(property.price)}
              </div>
              <div className="text-blue-100 mt-1 text-sm md:text-base">Valor do imóvel</div>
            </>
          )}
        </div>

        {/* Property Stats */}
        <PropertyStats 
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          area={property.area}
          suites={property.suites}
        />

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Descrição</h3>
          <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-line">
              {property.description ? formatDescription(property.description) : 'Sem descrição disponível.'}
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
      </CardContent>
    </Card>
  );
};

export default PropertyMainInfo;

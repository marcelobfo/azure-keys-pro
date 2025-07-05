
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSimilarProperties } from '@/hooks/useSimilarProperties';

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  city: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  images: string[];
}

interface SimilarPropertiesProps {
  currentProperty: Property;
}

const SimilarProperties: React.FC<SimilarPropertiesProps> = ({ currentProperty }) => {
  const navigate = useNavigate();
  const { similarProperties, loading } = useSimilarProperties(currentProperty);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Imóveis Similares</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Imóveis Similares</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {similarProperties.map((property) => (
          <Card
            key={property.id}
            className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden bg-white dark:bg-slate-800 border-0 shadow-lg"
            onClick={() => navigate(`/property/${property.id}`)}
          >
            <div className="relative overflow-hidden">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=400&h=300&fit=crop'}
                alt={property.title}
                className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
                {formatPrice(property.price)}
              </div>
              <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 font-medium shadow-md">
                {property.property_type}
              </Badge>
            </div>
            <CardContent className="p-6">
              <h4 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                {property.title}
              </h4>
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                  <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {property.area}m²
                  </span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                  <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {property.bedrooms} quartos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimilarProperties;

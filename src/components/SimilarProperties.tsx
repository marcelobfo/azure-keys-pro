
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
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Imóveis Similares</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {similarProperties.map((property) => (
          <Card
            key={property.id}
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/property/${property.id}`)}
          >
            <div className="relative overflow-hidden">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=400&h=300&fit=crop'}
                alt={property.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                {formatPrice(property.price)}
              </div>
              <Badge className="absolute top-3 left-3 bg-white text-gray-900">
                {property.property_type}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {property.title}
              </h4>
              <div className="flex items-center text-gray-600 text-xs mb-2">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate">{property.location}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{property.area}m²</span>
                <span>{property.bedrooms} quartos</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimilarProperties;


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Square } from 'lucide-react';
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
  tenant_id?: string;
  slug?: string;
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
        <h3 className="text-2xl font-bold mb-6 text-foreground">Imóveis Similares</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (similarProperties.length === 0) {
    return null;
  }

  const handleNavigate = (property: Property) => {
    const path = property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`;
    navigate(path);
  };

  return (
    <div className="mt-16">
      <h3 className="text-3xl font-bold mb-8 text-foreground">Imóveis Similares</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarProperties.map((property) => (
          <Card
            key={property.id}
            className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden bg-card border shadow-md"
            onClick={() => handleNavigate(property)}
          >
            <div className="relative overflow-hidden">
              <img
                src={property.images?.[0] || '/placeholder.svg'}
                alt={property.title}
                className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg">
                {formatPrice(property.price)}
              </div>
              <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 font-medium shadow-md border-0">
                {property.property_type}
              </Badge>
            </div>
            <CardContent className="p-5">
              <h4 className="font-bold text-lg mb-3 line-clamp-2 text-foreground group-hover:text-blue-600 transition-colors leading-tight">
                {property.title}
              </h4>
              <div className="flex items-center text-muted-foreground text-sm mb-4">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-foreground font-medium">
                  <span className="bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    {property.area}m²
                  </span>
                </div>
                <div className="flex items-center text-foreground font-medium">
                  <span className="bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                    <Bed className="w-3 h-3" />
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

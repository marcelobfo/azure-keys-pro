import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Bed, Bath, Square, ArrowRight, Umbrella, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';

interface Property {
  id: string;
  slug?: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  city?: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  purpose?: string;
  images: string[];
  tags?: string[];
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  is_featured?: boolean;
  accepts_exchange?: boolean;
  property_code?: string;
  hide_address?: boolean;
}

interface PropertyListItemProps {
  property: Property;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({ property }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(property.id);
  };

  const getPriceDisplay = () => {
    if ((property.purpose === 'rent' || property.purpose === 'rent_annual' || property.purpose === 'rent_seasonal') && property.rental_price) {
      return `${formatPrice(property.rental_price)}/mês`;
    } else if (property.purpose === 'both') {
      return `${formatPrice(property.price)}`;
    } else {
      return formatPrice(property.price);
    }
  };

  const getPurposeLabel = () => {
    if (property.purpose === 'sale') return 'Venda';
    if (property.purpose === 'rent') return 'Aluguel';
    if (property.purpose === 'rent_annual') return 'Aluguel Anual';
    if (property.purpose === 'rent_seasonal') return 'Temporada';
    if (property.purpose === 'both') return 'Venda/Aluguel';
    return null;
  };

  const getPurposeColor = () => {
    if (property.purpose === 'sale') return 'bg-green-600';
    if (property.purpose === 'rent' || property.purpose === 'rent_annual' || property.purpose === 'rent_seasonal') return 'bg-orange-500';
    if (property.purpose === 'both') return 'bg-blue-600';
    return 'bg-gray-500';
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'apartamento': 'Apartamento',
      'apartamento_diferenciado': 'Apto Diferenciado',
      'casa': 'Casa',
      'cobertura': 'Cobertura',
      'loft': 'Loft',
      'lote': 'Lote',
      'sala_comercial': 'Sala Comercial',
      'studio': 'Studio'
    };
    return labels[type?.toLowerCase()] || type;
  };

  const handleClick = () => {
    navigate(property.slug ? `/imovel/${property.slug}` : `/property/${property.id}`);
  };

  const image = property.images?.[0] || '/placeholder.svg';

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-card cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Imagem */}
        <div className="relative w-full sm:w-64 md:w-80 flex-shrink-0">
          <img
            src={image}
            alt={property.title}
            className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Tag de Finalidade */}
          {getPurposeLabel() && (
            <Badge className={`absolute top-3 left-3 ${getPurposeColor()} text-white border-0`}>
              {getPurposeLabel()}
            </Badge>
          )}
          
          {/* Tags especiais */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {property.is_featured && (
              <Badge className="bg-yellow-500 text-white border-0 text-xs">Destaque</Badge>
            )}
            {property.is_beachfront && (
              <Badge className="bg-blue-500 text-white border-0 text-xs">Frente Mar</Badge>
            )}
            {property.is_development && (
              <Badge className="bg-purple-500 text-white border-0 text-xs">Lançamento</Badge>
            )}
          </div>

          {/* Botão de favorito */}
          <Button
            onClick={handleFavoriteClick}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
              isFavorite(property.id)
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-600'
            }`}
            size="sm"
          >
            <Heart className={`w-4 h-4 ${isFavorite(property.id) ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Título e Tipo */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-lg md:text-xl font-semibold group-hover:text-blue-600 transition-colors line-clamp-2 text-foreground">
                {property.title}
              </h3>
              <Badge variant="secondary" className="flex-shrink-0">
                {getPropertyTypeLabel(property.property_type)}
              </Badge>
            </div>

            {/* Localização */}
            <p className="text-muted-foreground mb-4 flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">
                {property.city || property.location}
              </span>
            </p>

            {/* Especificações */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <Square className="w-4 h-4" />
                {property.area}m²
              </span>
              <span className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <Bed className="w-4 h-4" />
                {property.bedrooms} quartos
              </span>
              <span className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                <Bath className="w-4 h-4" />
                {property.bathrooms} banheiros
              </span>
            </div>

            {/* Tags adicionais */}
            {property.accepts_exchange && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Aceita Permuta
              </Badge>
            )}
          </div>

          {/* Preço e CTA */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div>
              {property.purpose === 'both' ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-bold text-blue-600">
                    Venda: {formatPrice(property.price)}
                  </p>
                  {property.rental_price && (
                    <p className="text-lg font-semibold text-green-600">
                      Aluguel: {formatPrice(property.rental_price)}/mês
                    </p>
                  )}
                </div>
              ) : ['rent', 'rent_annual', 'rent_seasonal'].includes(property.purpose || '') && property.rental_price ? (
                <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                  {property.purpose === 'rent_seasonal' && <Umbrella className="w-5 h-5" />}
                  {property.purpose === 'rent_seasonal' ? 'Temporada: ' : 'Aluguel: '}{formatPrice(property.rental_price)}/mês
                </p>
              ) : (
                <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                  <Key className="w-5 h-5" />
                  {formatPrice(property.price)}
                </p>
              )}
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              Ver Detalhes
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PropertyListItem;
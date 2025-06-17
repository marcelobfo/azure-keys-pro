import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import InterestModal from './InterestModal';
import ScheduleVisitModal from './ScheduleVisitModal';
import ShareButton from './ShareButton';
import { useFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';

interface Property {
  id: string;
  title: string;
  property_type: string;
  status: string;
  city: string;
  state?: string;
  created_at: string;
  price: number; // added new fields
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
}

interface PropertySidebarProps {
  property: Property;
}

const PropertySidebar: React.FC<PropertySidebarProps> = ({ property }) => {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "available":
        return "Disponível";
      case "sold":
        return "Vendido";
      case "pending":
        return "Pendente";
      case "rented":
        return "Alugado";
      case "reserved":
        return "Reservado";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800";
      case "sold":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "rented":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "reserved":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Interessado?</h3>
        <div className="space-y-3">
          <InterestModal 
            propertyId={property.id} 
            propertyTitle={property.title}
          />
          <ScheduleVisitModal 
            propertyId={property.id} 
            propertyTitle={property.title}
            buttonClassName="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
            iconClassName="text-white"
            label="Agendar Visita"
          />
          <ShareButton
            property={property}
            variant="outline"
            className="w-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 hover:text-purple-600 shadow-lg transition-all duration-200 hover:shadow-xl"
            showText={true}
          />
          <Button 
            variant={isFavorite(property.id) ? "default" : "outline"} 
            className={`w-full flex items-center justify-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl ${
              isFavorite(property.id)
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            }`}
            onClick={() => toggleFavorite(property.id)}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite(property.id) ? "fill-current text-white" : ""
              }`}
              fill={isFavorite(property.id) ? "currentColor" : "none"}
            />
            {isFavorite(property.id)
              ? "Remover dos Favoritos"
              : "Adicionar aos Favoritos"}
          </Button>
        </div>
      </div>

      {/* Property Info */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Informações do Imóvel</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-600">
            <span className="font-medium text-gray-600 dark:text-gray-400">Tipo:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{property.property_type}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-600">
            <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(property.status)}`}>
              {getStatusLabel(property.status)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-600">
            <span className="font-medium text-gray-600 dark:text-gray-400">Cidade:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{property.city}</span>
          </div>
          {property.state && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-slate-600">
              <span className="font-medium text-gray-600 dark:text-gray-400">Estado:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{property.state}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3">
            <span className="font-medium text-gray-600 dark:text-gray-400">Publicado em:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {new Date(property.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySidebar;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Square, ArrowLeft, Heart, Calendar, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import InterestModal from '@/components/InterestModal';
import ScheduleVisitModal from '@/components/ScheduleVisitModal';
import { useFavorites } from '@/hooks/useFavorites';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  state: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  images: string[];
  features: string[];
  status: string;
  created_at: string;
  virtual_tour_url: string;
  video_url: string;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Favorito: redireciona se não autenticado
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setProperty(data);
    } catch (error: any) {
      console.error('Erro ao buscar propriedade:', error);
      toast({
        title: "Erro",
        description: "Propriedade não encontrada",
        variant: "destructive",
      });
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Tradução do status corrigida
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Disponível";
      case "sold":
        return "Vendido";
      case "pending":
        return "Pendente";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Propriedade não encontrada</h1>
          <Button onClick={() => navigate('/properties')}>
            Voltar para Propriedades
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/properties')}
            className="mb-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Gallery Section */}
            <div className="mb-6">
              {property.images && property.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-xl overflow-hidden shadow-xl">
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  {property.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {property.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                            index === currentImageIndex 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${property.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-gray-500 text-lg">Sem imagens disponíveis</span>
                </div>
              )}
            </div>

            {/* Main Property Card */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
              <CardContent className="p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white leading-tight">
                      {property.title}
                    </h1>
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

                {/* Price */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white shadow-lg">
                  <div className="text-4xl font-bold">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-blue-100 mt-1">Valor do imóvel</div>
                </div>

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                      <Bed className="w-6 h-6 mr-2 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{property.bedrooms}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Quartos</span>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                      <Bath className="w-6 h-6 mr-2 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{property.bathrooms}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Banheiros</span>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-slate-700 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center justify-center mb-2">
                      <Square className="w-6 h-6 mr-2 text-blue-600" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{property.area}m²</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Área</span>
                  </div>
                </div>

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
                {(property.virtual_tour_url || property.video_url) && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-lg mb-4 text-green-800 dark:text-green-200">Recursos Multimídia</h4>
                    <div className="space-y-3">
                      {property.virtual_tour_url && (
                        <div className="flex items-center">
                          <span className="font-medium text-green-700 dark:text-green-300 mr-3">Tour Virtual:</span>
                          <a 
                            href={property.virtual_tour_url} 
                            target="_blank" 
                            rel="noopener" 
                            className="text-blue-600 hover:text-blue-800 underline break-words font-medium"
                          >
                            Visualizar Tour Virtual
                          </a>
                        </div>
                      )}
                      {property.video_url && (
                        <div className="flex items-center">
                          <span className="font-medium text-green-700 dark:text-green-300 mr-3">Vídeo:</span>
                          <a 
                            href={property.video_url} 
                            target="_blank" 
                            rel="noopener" 
                            className="text-blue-600 hover:text-blue-800 underline break-words font-medium"
                          >
                            Assistir Vídeo
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Características</h3>
                    <div className="bg-white dark:bg-slate-700 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {property.features.map((feature, index) => (
                          <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3 flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail;

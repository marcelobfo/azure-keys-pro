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
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4">
              {property.images && property.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={property.images[currentImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {property.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {property.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`aspect-video rounded-lg overflow-hidden border-2 ${
                            index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
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
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Sem imagens</span>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location}, {property.city}
                    </div>
                  </div>
                  <Badge variant="secondary">{property.property_type}</Badge>
                </div>

                <div className="text-3xl font-bold text-blue-600 mb-6">
                  {formatPrice(property.price)}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bed className="w-5 h-5 mr-1" />
                      <span className="font-semibold">{property.bedrooms}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Quartos</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bath className="w-5 h-5 mr-1" />
                      <span className="font-semibold">{property.bathrooms}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Banheiros</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Square className="w-5 h-5 mr-1" />
                      <span className="font-semibold">{property.area}m²</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Área</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Descrição</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {property.description || 'Sem descrição disponível.'}
                  </p>
                </div>

                {(property.virtual_tour_url || property.video_url) && (
                  <div className="mb-6 space-y-3">
                    {property.virtual_tour_url && (
                      <div>
                        <h4 className="font-semibold">Tour Virtual</h4>
                        <a href={property.virtual_tour_url} target="_blank" rel="noopener" className="text-blue-700 underline break-words">
                          {property.virtual_tour_url}
                        </a>
                      </div>
                    )}
                    {property.video_url && (
                      <div>
                        <h4 className="font-semibold">Vídeo</h4>
                        <a href={property.video_url} target="_blank" rel="noopener" className="text-blue-700 underline break-words">
                          {property.video_url}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {property.features && property.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Características</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {property.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4 animate-fade-in">
              <h3 className="text-lg font-semibold mb-2">Interessado?</h3>
              <div className="flex gap-2 mb-3">
                <InterestModal 
                  propertyId={property.id} 
                  propertyTitle={property.title}
                />
                <ScheduleVisitModal 
                  propertyId={property.id} 
                  propertyTitle={property.title}
                  buttonClassName="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                  iconClassName="text-white"
                  label="Agendar Visita"
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 mr-2" />
                Adicionar aos Favoritos
              </Button>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Informações do Imóvel</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">Tipo:</span>
                <span className="text-right font-semibold text-gray-900 dark:text-white">{property.property_type}</span>
                <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300">
                    {property.status}
                  </span>
                </span>
                <span className="font-medium text-gray-600 dark:text-gray-400">Cidade:</span>
                <span className="text-right font-semibold text-gray-900 dark:text-white">{property.city}</span>
                {property.state && (
                  <>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Estado:</span>
                    <span className="text-right font-semibold text-gray-900 dark:text-white">{property.state}</span>
                  </>
                )}
                <span className="font-medium text-gray-600 dark:text-gray-400">Publicado em:</span>
                <span className="text-right font-semibold text-gray-900 dark:text-white">
                  {new Date(property.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail;

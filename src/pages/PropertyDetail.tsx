
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import PropertyMainInfo from '@/components/PropertyMainInfo';
import PropertySidebar from '@/components/PropertySidebar';
import Breadcrumb from '@/components/Breadcrumb';
import { useSEO, generatePropertySEO } from '@/hooks/useSEO';

interface Property {
  id: string;
  slug: string;
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
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  tags?: string[];
}

const PropertyDetail = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identifier) {
      fetchProperty();
    }
  }, [identifier]);

  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const fetchProperty = async () => {
    try {
      let query = supabase.from('properties').select('*');
      
      if (isUUID(identifier!)) {
        // Se for UUID, buscar por ID e redirecionar para slug
        query = query.eq('id', identifier);
      } else {
        // Se for slug, buscar por slug
        query = query.eq('slug', identifier);
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      setProperty(data);

      // Se encontrou por UUID, redirecionar para slug
      if (isUUID(identifier!) && data.slug) {
        navigate(`/imovel/${data.slug}`, { replace: true });
        return;
      }

      // Incrementar contador de visualizações
      await supabase.rpc('increment_property_views', { property_id: data.id });
      
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

  // Usar hook de SEO
  useSEO(property ? generatePropertySEO(property) : {
    title: 'Carregando...',
    description: 'Carregando detalhes da propriedade...'
  });

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
        <Breadcrumb property={property} />
        
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
        
        {/* Special Categories Banner */}
        {(property.is_featured || property.is_beachfront || property.is_near_beach || property.is_development) && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Categorias Especiais</h3>
            <div className="flex flex-wrap gap-2">
              {property.is_featured && (
                <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded-full">
                  ⭐ Imóvel em Destaque
                </span>
              )}
              {property.is_beachfront && (
                <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                  🏖️ Frente para o Mar
                </span>
              )}
              {property.is_near_beach && (
                <span className="px-3 py-1 bg-cyan-500 text-white text-sm font-semibold rounded-full">
                  🌊 Quadra Mar
                </span>
              )}
              {property.is_development && (
                <span className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">
                  🏗️ Empreendimento
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PropertyImageGallery 
              images={property.images}
              title={property.title}
            />
            <PropertyMainInfo property={property} />
          </div>

          <PropertySidebar property={property} />
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail;

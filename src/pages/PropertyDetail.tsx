
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import PropertyMainInfo from '@/components/PropertyMainInfo';
import PropertySidebar from '@/components/PropertySidebar';
import PropertyConfidentialInfo from '@/components/PropertyConfidentialInfo';
import Breadcrumb from '@/components/Breadcrumb';
import SimilarProperties from '@/components/SimilarProperties';
import { useSEO, generatePropertySEO } from '@/hooks/useSEO';
import { useAnalytics } from '@/hooks/useAnalytics';

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
  lavabos?: number;
  property_type: string;
  images: string[];
  features: string[];
  unit_features?: string[];
  building_features?: string[];
  status: string;
  created_at: string;
  virtual_tour_url: string;
  video_url: string;
  is_featured?: boolean;
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  is_pre_launch?: boolean;
  tags?: string[];
  hide_address?: boolean;
  negotiation_notes?: string;
  accepts_exchange?: boolean;
  broker_name?: string;
  broker_creci?: string;
  tenant_id?: string;
  rental_price?: number;
  development_name?: string;
  development_description?: string;
  apartment_number?: string;
  show_apartment_details?: boolean;
}

const PropertyDetail = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (identifier) fetchProperty();
  }, [identifier]);

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const fetchProperty = async () => {
    try {
      let query = supabase.from('properties').select('*');
      if (isUUID(identifier!)) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }
      const { data, error } = await query.single();
      if (error) throw error;

      setProperty(data as any);

      if (isUUID(identifier!) && data.slug) {
        navigate(`/imovel/${data.slug}`, { replace: true });
        return;
      }

      await supabase.rpc('increment_property_views', { property_id: data.id });
      trackEvent('view_property', {
        property_id: data.id,
        property_title: data.title,
        property_type: data.property_type,
        property_price: data.price,
        property_city: data.city,
        property_location: data.location,
      });
    } catch (error: any) {
      console.error('Erro ao buscar propriedade:', error);
      toast({ title: "Erro", description: "Propriedade não encontrada", variant: "destructive" });
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  useSEO(property ? generatePropertySEO(property) : { title: 'Carregando...', description: 'Carregando detalhes da propriedade...' });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Propriedade não encontrada</h1>
          <Button onClick={() => navigate('/properties')}>Voltar para Propriedades</Button>
        </div>
      </Layout>
    );
  }

  const unitFeatures = property.unit_features || [];
  const buildingFeatures = property.building_features || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb property={property} />
        
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/properties')} className="mb-4 hover:bg-primary/5 hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
        
        {/* Special Categories Banner */}
        {(property.is_featured || property.is_beachfront || property.is_near_beach || property.is_development || property.is_pre_launch) && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Categorias Especiais</h3>
            <div className="flex flex-wrap gap-2">
              {property.is_featured && <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-semibold rounded-full">⭐ Imóvel em Destaque</span>}
              {property.is_beachfront && <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">🏖️ Frente para o Mar</span>}
              {property.is_near_beach && <span className="px-3 py-1 bg-cyan-500 text-white text-sm font-semibold rounded-full">🌊 Quadra Mar</span>}
              {property.is_development && <span className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">🏗️ Empreendimento</span>}
              {property.is_pre_launch && <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">🚀 Pré-lançamento</span>}
            </div>
          </div>
        )}

        {/* Development Info */}
        {(property.development_name || property.development_description) && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Empreendimento
            </h3>
            {property.development_name && (
              <p className="text-xl font-bold text-foreground">{property.development_name}</p>
            )}
            {property.show_apartment_details && property.apartment_number && (
              <p className="text-sm text-muted-foreground mt-1">Apartamento: {property.apartment_number}</p>
            )}
            {property.development_description && (
              <p className="text-muted-foreground mt-2">{property.development_description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PropertyImageGallery images={property.images} title={property.title} />
            <PropertyMainInfo property={property} />

            {/* Unit Features */}
            {unitFeatures.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Home className="w-5 h-5" /> Características do Imóvel
                </h3>
                <div className="bg-card p-6 rounded-xl shadow-md border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unitFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/70 rounded-full mr-3 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Building Features */}
            {buildingFeatures.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Características do Empreendimento
                </h3>
                <div className="bg-card p-6 rounded-xl shadow-md border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {buildingFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <PropertyConfidentialInfo
              negotiationNotes={property.negotiation_notes}
              acceptsExchange={property.accepts_exchange}
              brokerName={property.broker_name}
              brokerCreci={property.broker_creci}
            />
          </div>

          <PropertySidebar property={property} />
        </div>

        <SimilarProperties currentProperty={property} />
      </div>
    </Layout>
  );
};

export default PropertyDetail;

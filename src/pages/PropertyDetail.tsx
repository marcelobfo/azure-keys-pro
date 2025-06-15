
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

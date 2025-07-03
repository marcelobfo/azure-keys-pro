
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  area: number;
  bedrooms: number;
  images: string[];
  property_type: string;
  bathrooms: number;
  suites?: number;
  city: string;
  state: string;
  purpose?: string;
  tags?: string[];
  property_code?: string;
  features?: string[];
}

interface SiteSettings {
  [key: string]: string;
}

const getHomeSettings = async (): Promise<SiteSettings> => {
  const keys = [
    'home_banner_title',
    'home_banner_subtitle', 
    'home_banner_button',
    'home_banner_image',
    'home_banner_type',
    'home_banner_video_url',
    'home_banner_link_url',
    'about_section_title',
    'about_section_text',
    'about_section_image',
    'home_layout',
    'home_sections_featured',
    'home_sections_beachfront', 
    'home_sections_near_beach',
    'home_sections_developments',
    'home_sections_order',
  ];
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', keys);

  const map: SiteSettings = {};
  data?.forEach((item: any) => {
    map[item.key] = item.value || '';
  });
  return map;
};

export const useHomeData = () => {
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [beachfrontProperties, setBeachfrontProperties] = useState<FeaturedProperty[]>([]);
  const [nearBeachProperties, setNearBeachProperties] = useState<FeaturedProperty[]>([]);
  const [developments, setDevelopments] = useState<FeaturedProperty[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    async function fetchSiteSettings() {
      const map = await getHomeSettings();
      setSettings(map);
    }
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    async function loadProperties() {
      setLoadingFeatured(true);
      
      // Imóveis em destaque - só busca se configurado para mostrar
      let featuredData: any[] = [];
      if (settings['home_sections_featured'] === 'true') {
        const { data: featured } = await supabase
          .from('properties')
          .select('*')
          .eq('is_featured', true)
          .in('status', ['active', 'ativo', 'available']) // Múltiplos status aceitos
          .limit(8)
          .order('created_at', { ascending: false });
        featuredData = featured || [];
      }

      // Imóveis frente mar - só busca se configurado para mostrar
      let beachfrontData: any[] = [];
      if (settings['home_sections_beachfront'] === 'true') {
        const { data: beachfront } = await supabase
          .from('properties')
          .select('*')
          .eq('is_beachfront', true)
          .in('status', ['active', 'ativo', 'available']) // Múltiplos status aceitos
          .limit(8)
          .order('created_at', { ascending: false });
        beachfrontData = beachfront || [];
      }

      // Imóveis quadra mar - só busca se configurado para mostrar
      let nearBeachData: any[] = [];
      if (settings['home_sections_near_beach'] === 'true') {
        const { data: nearBeach } = await supabase
          .from('properties')
          .select('*')
          .eq('is_near_beach', true)
          .in('status', ['active', 'ativo', 'available']) // Múltiplos status aceitos
          .limit(8)
          .order('created_at', { ascending: false });
        nearBeachData = nearBeach || [];
      }

      // Empreendimentos - só busca se configurado para mostrar
      let devsData: any[] = [];
      if (settings['home_sections_developments'] === 'true') {
        const { data: devs } = await supabase
          .from('properties')
          .select('*')
          .eq('is_development', true)
          .in('status', ['active', 'ativo', 'available']) // Múltiplos status aceitos
          .limit(8)
          .order('created_at', { ascending: false });
        devsData = devs || [];
      }

      const formatProperties = (data: any[]): FeaturedProperty[] => {
        if (!data) return [];
        return data.map((p: any) => {
          return {
            id: p.id,
            title: p.title,
            price: p.price ? Number(p.price) : 0,
            rental_price: p.rental_price ? Number(p.rental_price) : undefined,
            location: p.location || '',
            area: p.area || 0,
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            suites: p.suites || 0,
            property_type: p.property_type || '',
            city: p.city || '',
            state: p.state || '',
            purpose: p.purpose,
            tags: Array.isArray(p.tags) ? p.tags : [],
            features: Array.isArray(p.features) ? p.features : [],
            property_code: p.property_code,
            images: Array.isArray(p.images) ? p.images : [],
          };
        });
      };

      setFeaturedProperties(formatProperties(featuredData));
      setBeachfrontProperties(formatProperties(beachfrontData));
      setNearBeachProperties(formatProperties(nearBeachData));
      setDevelopments(formatProperties(devsData));
      setLoadingFeatured(false);
    }
    
    // Só carrega se as configurações já foram carregadas
    if (Object.keys(settings).length > 0) {
      loadProperties();
    }
  }, [settings]);

  return {
    featuredProperties,
    beachfrontProperties,
    nearBeachProperties,
    developments,
    loadingFeatured,
    settings
  };
};

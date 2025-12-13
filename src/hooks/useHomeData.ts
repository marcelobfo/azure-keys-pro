import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

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
  hide_address?: boolean;
}

interface SiteSettings {
  [key: string]: string;
}

export const useHomeData = () => {
  const { selectedTenantId, currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;
  
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [beachfrontProperties, setBeachfrontProperties] = useState<FeaturedProperty[]>([]);
  const [nearBeachProperties, setNearBeachProperties] = useState<FeaturedProperty[]>([]);
  const [developments, setDevelopments] = useState<FeaturedProperty[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [settings, setSettings] = useState<SiteSettings>({});

  const getHomeSettings = useCallback(async (): Promise<SiteSettings> => {
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
    
    let query = supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keys);

    // Filter by tenant if available
    if (effectiveTenantId) {
      query = query.eq('tenant_id', effectiveTenantId);
    } else {
      query = query.is('tenant_id', null);
    }

    const { data } = await query;

    const map: SiteSettings = {};
    data?.forEach((item: any) => {
      map[item.key] = item.value || '';
    });
    return map;
  }, [effectiveTenantId]);

  useEffect(() => {
    async function fetchSiteSettings() {
      const map = await getHomeSettings();
      setSettings(map);
    }
    fetchSiteSettings();
  }, [getHomeSettings]);

  useEffect(() => {
    async function loadProperties() {
      setLoadingFeatured(true);
      
      const buildQuery = (baseQuery: any) => {
        if (effectiveTenantId) {
          return baseQuery.eq('tenant_id', effectiveTenantId);
        }
        return baseQuery;
      };

      // Imóveis em destaque - só busca se configurado para mostrar
      let featuredData: any[] = [];
      if (settings['home_sections_featured'] === 'true') {
        let query = supabase
          .from('properties')
          .select('*')
          .eq('is_featured', true)
          .in('status', ['active', 'ativo', 'available'])
          .limit(8)
          .order('created_at', { ascending: false });
        
        query = buildQuery(query);
        const { data: featured } = await query;
        featuredData = featured || [];
      }

      // Imóveis frente mar - só busca se configurado para mostrar
      let beachfrontData: any[] = [];
      if (settings['home_sections_beachfront'] === 'true') {
        let query = supabase
          .from('properties')
          .select('*')
          .eq('is_beachfront', true)
          .in('status', ['active', 'ativo', 'available'])
          .limit(8)
          .order('created_at', { ascending: false });
        
        query = buildQuery(query);
        const { data: beachfront } = await query;
        beachfrontData = beachfront || [];
      }

      // Imóveis quadra mar - só busca se configurado para mostrar
      let nearBeachData: any[] = [];
      if (settings['home_sections_near_beach'] === 'true') {
        let query = supabase
          .from('properties')
          .select('*')
          .eq('is_near_beach', true)
          .in('status', ['active', 'ativo', 'available'])
          .limit(8)
          .order('created_at', { ascending: false });
        
        query = buildQuery(query);
        const { data: nearBeach } = await query;
        nearBeachData = nearBeach || [];
      }

      // Empreendimentos - só busca se configurado para mostrar
      let devsData: any[] = [];
      if (settings['home_sections_developments'] === 'true') {
        let query = supabase
          .from('properties')
          .select('*')
          .eq('is_development', true)
          .in('status', ['active', 'ativo', 'available'])
          .limit(8)
          .order('created_at', { ascending: false });
        
        query = buildQuery(query);
        const { data: devs } = await query;
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
            is_featured: Boolean(p.is_featured),
            is_beachfront: Boolean(p.is_beachfront),
            is_near_beach: Boolean(p.is_near_beach),
            is_development: Boolean(p.is_development),
            hide_address: Boolean(p.hide_address),
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
  }, [settings, effectiveTenantId]);

  return {
    featuredProperties,
    beachfrontProperties,
    nearBeachProperties,
    developments,
    loadingFeatured,
    settings
  };
};

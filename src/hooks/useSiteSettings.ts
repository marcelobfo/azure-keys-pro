import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  site_name: string;
  site_title: string;
  site_description: string;
  site_favicon_url: string;
  footer_logo: string;
  header_logo_light: string;
  header_logo_dark: string;
  footer_email: string;
  footer_phone: string;
  footer_address: string;
  footer_instagram: string;
  footer_whatsapp: string;
  footer_facebook: string;
  home_banner_title: string;
  home_banner_subtitle: string;
  home_banner_button: string;
  home_banner_image: string;
  about_section_title: string;
  about_section_text: string;
  about_section_image: string;
  home_layout: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  contact_hours: string;
  contact_map_url: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'Maresia Litoral',
  site_title: 'Maresia Litoral - Encontre o Imóvel dos Seus Sonhos',
  site_description: 'Encontre o imóvel dos seus sonhos com a Maresia Litoral. Casas, apartamentos e terrenos de qualidade em todo o Brasil.',
  site_favicon_url: '/favicon.svg',
  footer_logo: '',
  header_logo_light: '',
  header_logo_dark: '',
  footer_email: '',
  footer_phone: '',
  footer_address: '',
  footer_instagram: '',
  footer_whatsapp: '',
  footer_facebook: '',
  home_banner_title: '',
  home_banner_subtitle: '',
  home_banner_button: '',
  home_banner_image: '',
  about_section_title: '',
  about_section_text: '',
  about_section_image: '',
  home_layout: '',
  contact_address: '',
  contact_phone: '',
  contact_email: '',
  contact_hours: '',
  contact_map_url: '',
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) {
        setError(error.message);
        return;
      }

      const settingsMap: Record<string, string> = {};
      data?.forEach((item: { key: string; value: string | null }) => {
        settingsMap[item.key] = item.value || '';
      });

      setSettings({
        site_name: settingsMap.site_name || defaultSettings.site_name,
        site_title: settingsMap.site_title || defaultSettings.site_title,
        site_description: settingsMap.site_description || defaultSettings.site_description,
        site_favicon_url: settingsMap.site_favicon_url || defaultSettings.site_favicon_url,
        footer_logo: settingsMap.footer_logo || defaultSettings.footer_logo,
        header_logo_light: settingsMap.header_logo_light || defaultSettings.header_logo_light,
        header_logo_dark: settingsMap.header_logo_dark || defaultSettings.header_logo_dark,
        footer_email: settingsMap.footer_email || defaultSettings.footer_email,
        footer_phone: settingsMap.footer_phone || defaultSettings.footer_phone,
        footer_address: settingsMap.footer_address || defaultSettings.footer_address,
        footer_instagram: settingsMap.footer_instagram || defaultSettings.footer_instagram,
        footer_whatsapp: settingsMap.footer_whatsapp || defaultSettings.footer_whatsapp,
        footer_facebook: settingsMap.footer_facebook || defaultSettings.footer_facebook,
        home_banner_title: settingsMap.home_banner_title || defaultSettings.home_banner_title,
        home_banner_subtitle: settingsMap.home_banner_subtitle || defaultSettings.home_banner_subtitle,
        home_banner_button: settingsMap.home_banner_button || defaultSettings.home_banner_button,
        home_banner_image: settingsMap.home_banner_image || defaultSettings.home_banner_image,
        about_section_title: settingsMap.about_section_title || defaultSettings.about_section_title,
        about_section_text: settingsMap.about_section_text || defaultSettings.about_section_text,
        about_section_image: settingsMap.about_section_image || defaultSettings.about_section_image,
        home_layout: settingsMap.home_layout || defaultSettings.home_layout,
        contact_address: settingsMap.contact_address || defaultSettings.contact_address,
        contact_phone: settingsMap.contact_phone || defaultSettings.contact_phone,
        contact_email: settingsMap.contact_email || defaultSettings.contact_email,
        contact_hours: settingsMap.contact_hours || defaultSettings.contact_hours,
        contact_map_url: settingsMap.contact_map_url || defaultSettings.contact_map_url,
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof SiteSettings, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' });

      if (error) {
        throw error;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
  };
};
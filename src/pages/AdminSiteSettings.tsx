import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTenantContext } from '@/contexts/TenantContext';
import { useTenant } from '@/hooks/useTenant';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import HomeSectionManager from '@/components/HomeSectionManager';
import TagManager from '@/components/TagManager';
import BrandColorPreview from '@/components/BrandColorPreview';
import LocationNormalizer from '@/components/LocationNormalizer';
import { COLOR_PRESETS, DEFAULT_BRAND_COLORS } from '@/hooks/useBrandColors';
import { Palette, Check, Search, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Configurações das seções da home
const HOME_SECTIONS_SETTINGS = [
  {
    key: 'home_sections_featured',
    titleKey: 'home_section_featured_title',
    label: 'Imóveis em Destaque',
    defaultTitle: 'Imóveis em Destaque',
  },
  {
    key: 'home_sections_beachfront',
    titleKey: 'home_section_beachfront_title',
    label: 'Frente Mar',
    defaultTitle: 'Imóveis Frente Mar',
  },
  {
    key: 'home_sections_near_beach',
    titleKey: 'home_section_near_beach_title',
    label: 'Quadra Mar',
    defaultTitle: 'Imóveis Quadra Mar',
  },
  {
    key: 'home_sections_developments',
    titleKey: 'home_section_developments_title',
    label: 'Empreendimentos',
    defaultTitle: 'Empreendimentos',
  },
];

const TEMPLATE_PREVIEWS = [
  {
    value: 'modelo1',
    name: 'Modelo Clássico',
    img: 'https://img.lovable-cdn.dev/template-home1.png',
    desc: 'Banner + busca central',
  },
  {
    value: 'modelo2',
    name: 'Banner Grande',
    img: 'https://img.lovable-cdn.dev/template-home2.png',
    desc: 'Imagem full e chamada centralizadas',
  },
  {
    value: 'modelo3',
    name: 'Com Destaques Laterais',
    img: 'https://img.lovable-cdn.dev/template-home3.png',
    desc: 'Destaques de imóveis com visual lateral',
  },
  {
    value: 'modelo4',
    name: 'Hero Texto Central',
    img: 'https://img.lovable-cdn.dev/template-home4.png',
    desc: 'Conteúdo com texto centralizado',
  },
];

const HOMEPAGE_SETTINGS = [
  {
    key: 'home_banner_title',
    label: 'Título de Destaque do Banner Principal',
    placeholder: 'Ex: Encontre seu imóvel dos sonhos',
  },
  {
    key: 'home_banner_subtitle',
    label: 'Subtítulo do Banner',
    placeholder: 'Ex: As melhores oportunidades do litoral esperam por você',
  },
  {
    key: 'home_banner_button',
    label: 'Texto do Botão do Banner',
    placeholder: 'Ex: Ver Imóveis',
  },
  {
    key: 'home_banner_image',
    label: 'Imagem do Banner Principal (URL)',
    placeholder: 'Cole a URL da imagem',
    type: 'image',
    help: 'Cole a URL de uma imagem hospedada. Upload de imagem em breve!',
  },
  {
    key: 'about_section_title',
    label: 'Título da Seção Quem Somos',
    placeholder: 'Ex: Conheça Nossa História',
  },
  {
    key: 'about_section_text',
    label: 'Texto da Seção Quem Somos',
    placeholder: 'Digite aqui a apresentação da imobiliária.',
  },
  {
    key: 'about_section_image',
    label: 'Imagem da Seção Quem Somos (URL)',
    placeholder: 'Cole a URL da foto principal (Quem Somos)',
    type: 'image',
    help: 'Cole a URL de uma imagem hospedada para a seção "Quem Somos".',
  },
  {
    key: 'home_layout',
    label: 'Modelo Visual da Home',
    type: 'custom',
    help: 'Escolha visualmente o layout principal da página HOME.'
  }
];

const FOOTER_FIELDS = [
  {
    key: 'footer_logo',
    label: 'Logo Geral (Fallback)',
    placeholder: 'URL da logo geral',
    type: 'image',
    help: 'Logo usada como fallback quando não há logos específicas para tema claro/escuro',
  },
  {
    key: 'logo_size_header',
    label: 'Tamanho da Logo no Cabeçalho (px)',
    placeholder: '150',
    type: 'number',
    help: 'Altura da logo no cabeçalho em pixels',
  },
  {
    key: 'logo_size_footer', 
    label: 'Tamanho da Logo no Rodapé (px)',
    placeholder: '120',
    type: 'number',
    help: 'Altura da logo no rodapé em pixels',
  },
  {
    key: 'header_logo_light',
    label: 'Logo para Tema Claro',
    placeholder: 'URL da logo para tema claro',
    type: 'image',
    help: 'Logo específica para quando o site estiver no tema claro',
  },
  {
    key: 'header_logo_dark',
    label: 'Logo para Tema Escuro',
    placeholder: 'URL da logo para tema escuro',
    type: 'image',
    help: 'Logo específica para quando o site estiver no tema escuro',
  },
  {
    key: 'footer_description',
    label: 'Descrição/Texto do rodapé',
    placeholder: 'Breve texto sobre a imobiliária',
  },
  {
    key: 'footer_email',
    label: 'E-mail',
    placeholder: 'contato@exemplo.com',
  },
  {
    key: 'footer_phone',
    label: 'Telefone',
    placeholder: '+55 (00) 99999-9999',
  },
  {
    key: 'footer_address',
    label: 'Endereço',
    placeholder: 'Rua Exemplo, 123 - Cidade/UF',
  },
  {
    key: 'footer_instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/suaempresa',
  },
  {
    key: 'footer_whatsapp',
    label: 'WhatsApp',
    placeholder: 'https://wa.me/11999999999',
  },
  {
    key: 'footer_facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/suaempresa',
  },
];

const CONTACT_FIELDS = [
  {
    key: 'contact_address',
    label: 'Endereço de Exibição',
    placeholder: 'Rua das Flores, 123, Centro, Cidade - UF, CEP 00000-000',
  },
  {
    key: 'contact_phone',
    label: 'Telefone(s) de Exibição',
    placeholder: '(11) 3456-7890 | (11) 99999-9999',
  },
  {
    key: 'contact_email',
    label: 'E-mail(s) de Exibição',
    placeholder: 'contato@imobiliaria.com | vendas@imobiliaria.com',
  },
  {
    key: 'contact_hours',
    label: 'Horário de Atendimento',
    placeholder: 'Seg a Sex: 8h-18h / Sáb: 8h-12h',
  },
  {
    key: 'contact_map_url',
    label: 'Embed/URL do Mapa (iframe)',
    placeholder: 'Cole o embed do Google Maps (opcional)',
  }
];

const SITE_FIELDS = [
  {
    key: 'site_name',
    label: 'Nome do Site',
    placeholder: 'Nome da sua Imobiliária',
    help: 'Nome principal do site que aparecerá no rodapé e em meta tags.',
  },
  {
    key: 'site_title',
    label: 'Título do Site (SEO)',
    placeholder: 'Sua Imobiliária - Encontre o Imóvel dos Seus Sonhos',
    help: 'Título completo que aparecerá na aba do navegador e resultados de busca.',
  },
  {
    key: 'site_description',
    label: 'Descrição do Site (SEO)',
    placeholder: 'Descrição da sua imobiliária para aparecer nos resultados de busca do Google.',
    type: 'textarea',
    help: 'Descrição para SEO e meta tags. Recomendado: 150-160 caracteres.',
  },
  {
    key: 'site_favicon_url',
    label: 'URL do Favicon (.png ou .jpg)',
    placeholder: 'https://exemplo.com/favicon.png',
    type: 'image',
    help: 'Indique a URL da imagem PNG/JPG para ser usada como favicon do site.',
  },
  {
    key: 'og_image',
    label: 'Imagem de Compartilhamento (Redes Sociais)',
    placeholder: 'https://exemplo.com/imagem-compartilhamento.png',
    type: 'og_image',
    help: 'Imagem exibida quando o link do site é compartilhado em redes sociais e aplicativos de chat (WhatsApp, Facebook, etc). Tamanho recomendado: 1200x630 pixels.',
  },
];

const ANALYTICS_FIELDS = [
  {
    key: 'gtm_id',
    label: 'Google Tag Manager ID',
    placeholder: 'GTM-XXXXXXX',
    help: 'ID do Google Tag Manager. Encontre em tagmanager.google.com',
  },
  {
    key: 'ga_measurement_id',
    label: 'Google Analytics Measurement ID',
    placeholder: 'G-XXXXXXXXXX',
    help: 'ID do Google Analytics. Encontre em analytics.google.com',
  },
  {
    key: 'facebook_pixel_id',
    label: 'Facebook Pixel ID',
    placeholder: 'XXXXXXXXXXXXXX',
    help: 'ID do Facebook Pixel. Encontre em business.facebook.com',
  },
];

const ALL_FIELDS = [
  ...HOMEPAGE_SETTINGS.filter(f => f.key !== 'home_layout'),
  ...FOOTER_FIELDS,
  ...CONTACT_FIELDS,
  ...SITE_FIELDS,
  ...ANALYTICS_FIELDS,
  // O layout é tratado separadamente (com cards/imagem)
];

const ANALYTICS_TOGGLES = [
  { key: 'gtm_enabled', label: 'Ativar Google Tag Manager' },
  { key: 'ga_enabled', label: 'Ativar Google Analytics' },
  { key: 'facebook_pixel_enabled', label: 'Ativar Facebook Pixel' },
];

const SEARCH_BAR_PRESETS = [
  {
    name: 'Clássico',
    description: 'Barra branca com campo preto',
    values: {
      search_bar_bg_color: '#FFFFFF',
      search_bar_input_bg_color: '#000000',
      search_bar_input_text_color: '#FFFFFF',
      search_bar_button_color: '#2563EB',
      search_bar_button_text_color: '#FFFFFF',
      search_bar_border_color: '#3B82F6',
      search_bar_border_radius: 'rounded',
      search_bar_shadow: 'true',
    }
  },
  {
    name: 'Escuro',
    description: 'Visual escuro elegante',
    values: {
      search_bar_bg_color: '#1F2937',
      search_bar_input_bg_color: '#111827',
      search_bar_input_text_color: '#FFFFFF',
      search_bar_button_color: '#3B82F6',
      search_bar_button_text_color: '#FFFFFF',
      search_bar_border_color: '#374151',
      search_bar_border_radius: 'rounded',
      search_bar_shadow: 'true',
    }
  },
  {
    name: 'Minimalista',
    description: 'Clean e moderno',
    values: {
      search_bar_bg_color: '#FFFFFF',
      search_bar_input_bg_color: '#F3F4F6',
      search_bar_input_text_color: '#111827',
      search_bar_button_color: '#111827',
      search_bar_button_text_color: '#FFFFFF',
      search_bar_border_color: '#E5E7EB',
      search_bar_border_radius: 'full',
      search_bar_shadow: 'false',
    }
  },
  {
    name: 'Gradiente Azul',
    description: 'Visual vibrante',
    values: {
      search_bar_bg_color: '#EFF6FF',
      search_bar_input_bg_color: '#FFFFFF',
      search_bar_input_text_color: '#1E40AF',
      search_bar_button_color: '#2563EB',
      search_bar_button_text_color: '#FFFFFF',
      search_bar_border_color: '#3B82F6',
      search_bar_border_radius: 'full',
      search_bar_shadow: 'true',
    }
  },
  {
    name: 'Transparente',
    description: 'Fundo semi-transparente',
    values: {
      search_bar_bg_color: 'rgba(255,255,255,0.9)',
      search_bar_input_bg_color: 'rgba(0,0,0,0.8)',
      search_bar_input_text_color: '#FFFFFF',
      search_bar_button_color: '#10B981',
      search_bar_button_text_color: '#FFFFFF',
      search_bar_border_color: '#10B981',
      search_bar_border_radius: 'rounded',
      search_bar_shadow: 'true',
    }
  },
];

const SEARCH_BAR_SETTINGS = [
  {
    key: 'search_bar_bg_color',
    label: 'Cor de Fundo da Barra',
    defaultValue: '#FFFFFF',
    help: 'Cor de fundo geral da barra de busca',
  },
  {
    key: 'search_bar_input_bg_color',
    label: 'Cor de Fundo do Campo de Busca',
    defaultValue: '#000000',
    help: 'Cor de fundo do campo de texto',
  },
  {
    key: 'search_bar_input_text_color',
    label: 'Cor do Texto do Campo',
    defaultValue: '#FFFFFF',
    help: 'Cor do texto digitado e placeholder',
  },
  {
    key: 'search_bar_button_color',
    label: 'Cor do Botão Buscar',
    defaultValue: '#2563EB',
    help: 'Cor de fundo do botão de busca',
  },
  {
    key: 'search_bar_button_text_color',
    label: 'Cor do Texto do Botão',
    defaultValue: '#FFFFFF',
    help: 'Cor do ícone e texto do botão',
  },
  {
    key: 'search_bar_border_color',
    label: 'Cor da Borda',
    defaultValue: '#3B82F6',
    help: 'Cor da borda ao redor do campo de busca',
  },
  {
    key: 'search_bar_border_radius',
    label: 'Formato dos Cantos',
    type: 'select',
    options: [
      { value: 'none', label: 'Quadrado' },
      { value: 'rounded', label: 'Arredondado' },
      { value: 'full', label: 'Pílula' },
    ],
    defaultValue: 'rounded',
  },
  {
    key: 'search_bar_shadow',
    label: 'Mostrar Sombra',
    type: 'toggle',
    defaultValue: 'true',
  },
];

const BRAND_COLOR_FIELDS = [
  {
    key: 'brand_primary_color',
    label: 'Cor Primária (Tema Claro)',
    defaultValue: '#0088CC',
    help: 'Cor principal para botões, links e elementos de destaque',
  },
  {
    key: 'brand_primary_dark',
    label: 'Cor Primária (Tema Escuro)',
    defaultValue: '#38BDF8',
    help: 'Versão mais vibrante para o tema escuro',
  },
  {
    key: 'brand_accent_color',
    label: 'Cor de Destaque (Tema Claro)',
    defaultValue: '#F58700',
    help: 'Cor secundária para CTAs importantes e badges',
  },
  {
    key: 'brand_accent_dark',
    label: 'Cor de Destaque (Tema Escuro)',
    defaultValue: '#FB923C',
    help: 'Versão de destaque para o tema escuro',
  },
  {
    key: 'brand_success_color',
    label: 'Cor de Sucesso',
    defaultValue: '#10B981',
    help: 'Usada para indicar estados positivos e confirmações',
  },
];

const AdminSiteSettings = () => {
  const { profile, loading, hasRole } = useProfile();
  const { toast } = useToast();
  const { selectedTenantId } = useTenantContext();
  const { currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;

  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!profile || !hasRole('admin')) return;

    async function fetchSettings() {
      // Incluir keys das seções da home, cores da marca e barra de busca
      const sectionKeys = HOME_SECTIONS_SETTINGS.flatMap(s => [s.key, s.titleKey]);
      const brandColorKeys = BRAND_COLOR_FIELDS.map(f => f.key);
      const searchBarKeys = SEARCH_BAR_SETTINGS.map(f => f.key);
      const keys = ALL_FIELDS.map(s => s.key)
        .concat(['home_layout'])
        .concat(ANALYTICS_TOGGLES.map(t => t.key))
        .concat(sectionKeys)
        .concat(brandColorKeys)
        .concat(searchBarKeys);
      
      let query = supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);
      
      // Filtrar por tenant
      if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      
      const { data, error } = await query;

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações.',
          variant: 'destructive'
        });
        return;
      }
      const existing: Record<string, string> = {};
      data?.forEach((item: { key: string; value: string }) => {
        existing[item.key] = item.value || '';
      });
      setValues(existing);
      setIsLoaded(true);
    }

    fetchSettings();
    // eslint-disable-next-line
  }, [profile, effectiveTenantId]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string, value: string) => {
    // Usar delete + insert para contornar problema de unique constraint com COALESCE
    if (effectiveTenantId) {
      await supabase
        .from('site_settings')
        .delete()
        .eq('key', key)
        .eq('tenant_id', effectiveTenantId);
    } else {
      await supabase
        .from('site_settings')
        .delete()
        .eq('key', key)
        .is('tenant_id', null);
    }
    
    const { error } = await supabase
      .from('site_settings')
      .insert({ 
        key, 
        value, 
        tenant_id: effectiveTenantId || null,
        updated_at: new Date().toISOString() 
      });
    
    return !error;
  };

  const saveSettings = async () => {
    setIsSaving(true);
    let isOk = true;

    // Salvar campos de seções da home
    for (const section of HOME_SECTIONS_SETTINGS) {
      const enabledValue = values[section.key] || 'false';
      const titleValue = values[section.titleKey] || '';
      
      if (!await saveSetting(section.key, enabledValue)) isOk = false;
      if (!await saveSetting(section.titleKey, titleValue)) isOk = false;
    }

    for (const setting of ALL_FIELDS) {
      const { key } = setting;
      const value = values[key] || '';
      if (!await saveSetting(key, value)) isOk = false;
    }
    
    // Salva home_layout também
    if (values['home_layout']) {
      if (!await saveSetting('home_layout', values['home_layout'])) isOk = false;
    }
    
    // Salva toggles de analytics
    for (const toggle of ANALYTICS_TOGGLES) {
      const value = values[toggle.key] || 'false';
      if (!await saveSetting(toggle.key, value)) isOk = false;
    }
    
    // Salva cores da marca
    for (const field of BRAND_COLOR_FIELDS) {
      const value = values[field.key] || field.defaultValue;
      if (!await saveSetting(field.key, value)) isOk = false;
    }
    
    // Salva configurações da barra de busca
    for (const field of SEARCH_BAR_SETTINGS) {
      const value = values[field.key] || field.defaultValue;
      if (!await saveSetting(field.key, value)) isOk = false;
    }

    setIsSaving(false);
    toast({
      title: isOk ? "Configurações salvas!" : "Erro",
      description: isOk
        ? "As configurações foram atualizadas."
        : "Alguns campos não foram salvos corretamente.",
      variant: isOk ? "default" : "destructive"
    });

    // Se favicon for atualizado e for URL válida, salvar no localStorage e pedir refresh
    if (values['site_favicon_url']) {
      localStorage.setItem('site-favicon', values['site_favicon_url']);
      // Atualizar favicon imediatamente
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = values['site_favicon_url'];
      }
      setTimeout(() => {
        window.location.reload(); // Força update do favicon globalmente
      }, 1000);
    }

    // Atualizar título do site se mudou
    if (values['site_title']) {
      document.title = values['site_title'];
    }
  };

  if (loading || !isLoaded)
    return (
      <DashboardLayout title="Configurações do Sistema" userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );

  if (!profile || !hasRole('admin')) {
    return (
      <DashboardLayout title="Configurações do Sistema" userRole="user">
        <div className="flex items-center justify-center h-64">
          <Badge variant="destructive">Acesso restrito</Badge>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Configurações do Sistema" userRole="admin">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Globais Organizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="home">
              <TabsList className="mb-4 grid grid-cols-8 w-full">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="cores" className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="locations" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Local
                </TabsTrigger>
                <TabsTrigger value="footer">Rodapé</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="site">Site</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* HOME TAB */}
              <TabsContent value="home">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}>
                  {HOMEPAGE_SETTINGS.filter(f => f.key !== 'home_layout').map(setting => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      <Input
                        id={setting.key}
                        type={setting.type === 'image' ? 'url' : 'text'}
                        value={values[setting.key] || ''}
                        onChange={e => handleChange(setting.key, e.target.value)}
                        placeholder={setting.placeholder}
                      />
                      {setting.help && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{setting.help}</div>
                      )}
                      {/* Preview da imagem */}
                      {setting.type === 'image' && values[setting.key] && (
                        <img
                          src={values[setting.key]}
                          alt={`Preview ${setting.label}`}
                          className="h-28 rounded shadow mb-2 mt-1 object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {/* Personalização da Barra de Busca */}
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Personalizar Barra de Busca
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Configure cores, formato e estilo da barra de busca do hero.
                      </p>
                    </div>

                    {/* Presets da Barra de Busca */}
                    <div className="space-y-3">
                      <Label>Presets Rápidos</Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {SEARCH_BAR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              Object.entries(preset.values).forEach(([key, value]) => {
                                handleChange(key, value);
                              });
                            }}
                            className="p-3 rounded-lg border-2 border-border hover:border-blue-500 transition-all text-left bg-background"
                          >
                            {/* Mini preview visual */}
                            <div 
                              className={`h-8 mb-2 flex items-center p-1 gap-1 ${
                                preset.values.search_bar_border_radius === 'full' ? 'rounded-full' :
                                preset.values.search_bar_border_radius === 'none' ? 'rounded-none' : 'rounded-md'
                              }`}
                              style={{ backgroundColor: preset.values.search_bar_bg_color }}
                            >
                              <div 
                                className={`flex-1 h-5 ${
                                  preset.values.search_bar_border_radius === 'full' ? 'rounded-full' :
                                  preset.values.search_bar_border_radius === 'none' ? 'rounded-none' : 'rounded-sm'
                                }`}
                                style={{ 
                                  backgroundColor: preset.values.search_bar_input_bg_color,
                                  borderColor: preset.values.search_bar_border_color,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                }}
                              />
                              <div 
                                className={`w-8 h-5 ${
                                  preset.values.search_bar_border_radius === 'full' ? 'rounded-full' :
                                  preset.values.search_bar_border_radius === 'none' ? 'rounded-none' : 'rounded-sm'
                                }`}
                                style={{ backgroundColor: preset.values.search_bar_button_color }}
                              />
                            </div>
                            <p className="font-medium text-sm">{preset.name}</p>
                            <p className="text-xs text-muted-foreground">{preset.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview da Barra de Busca */}
                    <div className="bg-slate-700 p-6 rounded-lg">
                      <p className="text-white text-center mb-4 text-sm opacity-70">Preview da Barra de Busca</p>
                      <div 
                        className={`flex flex-col sm:flex-row p-2 gap-2 mx-auto max-w-xl ${
                          values['search_bar_border_radius'] === 'full' ? 'rounded-full' :
                          values['search_bar_border_radius'] === 'none' ? 'rounded-none' : 'rounded-lg'
                        } ${values['search_bar_shadow'] !== 'false' ? 'shadow-lg' : ''}`}
                        style={{ backgroundColor: values['search_bar_bg_color'] || '#FFFFFF' }}
                      >
                        {/* Mini dropdown preview */}
                        <div 
                          className={`w-24 px-2 py-2 text-xs flex items-center justify-between ${
                            values['search_bar_border_radius'] === 'full' ? 'rounded-full' :
                            values['search_bar_border_radius'] === 'none' ? 'rounded-none' : 'rounded-lg'
                          }`}
                          style={{ 
                            backgroundColor: values['search_bar_bg_color'] || '#FFFFFF',
                            color: values['search_bar_input_text_color'] || '#FFFFFF',
                          }}
                        >
                          <span>Todos</span>
                          <span>▼</span>
                        </div>
                        <div 
                          className={`flex-1 px-4 py-2 text-sm ${
                            values['search_bar_border_radius'] === 'full' ? 'rounded-full' :
                            values['search_bar_border_radius'] === 'none' ? 'rounded-none' : 'rounded-lg'
                          }`}
                          style={{ 
                            backgroundColor: values['search_bar_input_bg_color'] || '#000000',
                            color: values['search_bar_input_text_color'] || '#FFFFFF',
                            borderColor: values['search_bar_border_color'] || '#3B82F6',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                          }}
                        >
                          Buscar imóveis...
                        </div>
                        <button 
                          className={`px-6 py-2 text-sm font-medium ${
                            values['search_bar_border_radius'] === 'full' ? 'rounded-full' :
                            values['search_bar_border_radius'] === 'none' ? 'rounded-none' : 'rounded-lg'
                          }`}
                          style={{ 
                            backgroundColor: values['search_bar_button_color'] || '#2563EB',
                            color: values['search_bar_button_text_color'] || '#FFFFFF',
                          }}
                        >
                          Buscar
                        </button>
                      </div>
                    </div>

                    {/* Cores da Barra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SEARCH_BAR_SETTINGS.filter(f => f.type !== 'select' && f.type !== 'toggle').map(field => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              id={field.key}
                              value={values[field.key] || field.defaultValue}
                              onChange={e => handleChange(field.key, e.target.value)}
                              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                            />
                            <Input
                              value={values[field.key] || field.defaultValue}
                              onChange={e => handleChange(field.key, e.target.value)}
                              placeholder="#000000"
                              className="font-mono uppercase"
                              maxLength={7}
                            />
                          </div>
                          {field.help && (
                            <p className="text-xs text-muted-foreground">{field.help}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Formato e Sombra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Formato dos Cantos</Label>
                        <Select 
                          value={values['search_bar_border_radius'] || 'rounded'}
                          onValueChange={(val) => handleChange('search_bar_border_radius', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Quadrado</SelectItem>
                            <SelectItem value="rounded">Arredondado</SelectItem>
                            <SelectItem value="full">Pílula</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Mostrar Sombra</Label>
                        <div className="flex items-center gap-3 pt-2">
                          <Switch
                            checked={values['search_bar_shadow'] !== 'false'}
                            onCheckedChange={(checked) => handleChange('search_bar_shadow', checked ? 'true' : 'false')}
                          />
                          <span className="text-sm text-muted-foreground">
                            {values['search_bar_shadow'] !== 'false' ? 'Ativada' : 'Desativada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seções da Home - Gerenciador Dinâmico */}
                  <Separator className="my-6" />
                  <HomeSectionManager />

                  {/* Seleção visual do template */}
                  <div className="space-y-2 mt-8">
                    <Label>Modelo Visual da Home</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {TEMPLATE_PREVIEWS.map(tmpl => (
                        <div
                          key={tmpl.value}
                          onClick={() => handleChange('home_layout', tmpl.value)}
                          className={`cursor-pointer group rounded-lg border-2 transition-all flex flex-col items-center p-3 ${
                            values['home_layout'] === tmpl.value
                              ? 'border-blue-600 ring-2 ring-blue-400'
                              : 'border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <img
                            src={tmpl.img}
                            alt={tmpl.name}
                            className="w-full h-24 object-cover rounded-md mb-2 group-hover:scale-105 transition-transform bg-white"
                            draggable={false}
                            style={{ pointerEvents: 'none' }}
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                            }}
                          />
                          <div className="font-semibold text-sm mb-1 text-center">{tmpl.name}</div>
                          <div className="text-xs text-gray-500 mb-1 text-center">{tmpl.desc}</div>
                          {values['home_layout'] === tmpl.value && (
                            <div className="text-xs text-blue-700 font-bold mt-1">Selecionado</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* CORES TAB */}
              <TabsContent value="cores">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Cores da Marca
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Personalize as cores do seu site para refletir a identidade visual da sua imobiliária. As cores serão aplicadas automaticamente em todo o sistema.
                    </p>
                  </div>

                  {/* Presets de Cores */}
                  <div className="space-y-3">
                    <Label>Presets de Cores</Label>
                    <p className="text-xs text-muted-foreground">Escolha um preset ou personalize as cores abaixo</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(COLOR_PRESETS).map(([key, preset]) => {
                        const isSelected = 
                          (values.brand_primary_color || DEFAULT_BRAND_COLORS.primaryColor) === preset.primaryColor &&
                          (values.brand_accent_color || DEFAULT_BRAND_COLORS.accentColor) === preset.accentColor;
                        
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              handleChange('brand_primary_color', preset.primaryColor);
                              handleChange('brand_primary_dark', preset.primaryColorDark);
                              handleChange('brand_accent_color', preset.accentColor);
                              handleChange('brand_accent_dark', preset.accentColorDark);
                            }}
                            className={`relative p-3 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-primary ring-2 ring-primary/30' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex gap-1 mb-2">
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.primaryColor }}
                              />
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: preset.accentColor }}
                              />
                            </div>
                            <span className="text-xs font-medium">{preset.name}</span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Color Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {BRAND_COLOR_FIELDS.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            id={field.key}
                            value={values[field.key] || field.defaultValue}
                            onChange={e => handleChange(field.key, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border hover:border-primary transition-colors"
                          />
                          <Input
                            value={values[field.key] || field.defaultValue}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder="#000000"
                            className="font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{field.help}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Preview */}
                  <BrandColorPreview
                    primaryColor={values.brand_primary_color || DEFAULT_BRAND_COLORS.primaryColor}
                    accentColor={values.brand_accent_color || DEFAULT_BRAND_COLORS.accentColor}
                    successColor={values.brand_success_color || DEFAULT_BRAND_COLORS.successColor}
                  />

                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Cores da Marca"}
                  </Button>
                </form>
              </TabsContent>

              {/* TAGS TAB */}
              <TabsContent value="tags">
                <TagManager />
              </TabsContent>

              {/* LOCATIONS TAB */}
              <TabsContent value="locations">
                <LocationNormalizer />
              </TabsContent>

              {/* FOOTER TAB */}
              <TabsContent value="footer">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  {FOOTER_FIELDS.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type={field.type === 'image' ? 'url' : 'text'}
                        value={values[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                      {field.help && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{field.help}</div>
                      )}
                      {field.type === 'image' && values[field.key] && (
                        <img
                          src={values[field.key]}
                          alt="Logo Preview"
                          className="h-16 rounded mb-1 object-contain bg-white"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* CONTACT TAB */}
              <TabsContent value="contact">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  {CONTACT_FIELDS.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type="text"
                        value={values[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* SITE/FAVICON TAB */}
              <TabsContent value="site">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🌐 Configurações de SEO e Identidade
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Estas configurações definem como seu site aparece na aba do navegador, 
                    nos resultados de busca do Google e nas redes sociais.
                  </p>
                </div>
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  {SITE_FIELDS.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.key}
                          value={values[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type === 'image' || field.type === 'og_image' ? 'url' : 'text'}
                          value={values[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.help && (
                        <div className="text-xs text-muted-foreground">{field.help}</div>
                      )}
                      {/* Preview do Favicon */}
                      {field.type === 'image' && values[field.key] && (
                        <img
                          src={values[field.key]}
                          alt="Favicon Preview"
                          className="h-10 w-10 mt-2 rounded-lg bg-white border"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      )}
                      {/* Preview da imagem de compartilhamento (OG Image) */}
                      {field.type === 'og_image' && values[field.key] && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-muted-foreground">Preview da imagem de compartilhamento:</p>
                          <div className="relative rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800 max-w-md">
                            <img
                              src={values[field.key]}
                              alt="Preview de Compartilhamento"
                              className="w-full h-auto object-contain"
                              onError={e => {
                                (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'
                              }}
                            />
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            ✓ Esta imagem aparecerá quando o link do site for compartilhado no WhatsApp, Facebook, etc.
                          </p>
                        </div>
                      )}
                      {/* Placeholder visual se não tiver imagem OG */}
                      {field.type === 'og_image' && !values[field.key] && (
                        <div className="mt-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 max-w-md">
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Cole a URL da imagem acima para visualizar o preview
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics">
                <form
                  className="space-y-6"
                  onSubmit={e => {
                    e.preventDefault();
                    saveSettings();
                  }}
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📊 Rastreamento de Analytics
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Configure suas ferramentas de analytics para rastrear visualizações de imóveis, cliques em menus e outras interações importantes no site.
                    </p>
                  </div>

                  {/* Google Tag Manager */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Google Tag Manager</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Gerencie todas suas tags em um só lugar
                        </p>
                      </div>
                      <Switch
                        checked={values['gtm_enabled'] === 'true'}
                        onCheckedChange={(checked) => handleChange('gtm_enabled', checked ? 'true' : 'false')}
                      />
                    </div>
                    {values['gtm_enabled'] === 'true' && (
                      <div className="space-y-2">
                        <Label htmlFor="gtm_id">GTM ID</Label>
                        <Input
                          id="gtm_id"
                          type="text"
                          value={values['gtm_id'] || ''}
                          onChange={e => handleChange('gtm_id', e.target.value)}
                          placeholder="GTM-XXXXXXX"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Encontre seu ID em <a href="https://tagmanager.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tagmanager.google.com</a>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Google Analytics */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Google Analytics</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Acompanhe visitantes e comportamento no site
                        </p>
                      </div>
                      <Switch
                        checked={values['ga_enabled'] === 'true'}
                        onCheckedChange={(checked) => handleChange('ga_enabled', checked ? 'true' : 'false')}
                      />
                    </div>
                    {values['ga_enabled'] === 'true' && (
                      <div className="space-y-2">
                        <Label htmlFor="ga_measurement_id">Measurement ID</Label>
                        <Input
                          id="ga_measurement_id"
                          type="text"
                          value={values['ga_measurement_id'] || ''}
                          onChange={e => handleChange('ga_measurement_id', e.target.value)}
                          placeholder="G-XXXXXXXXXX"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Encontre seu ID em <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">analytics.google.com</a>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Facebook Pixel */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Facebook Pixel</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Rastreie conversões de anúncios do Facebook
                        </p>
                      </div>
                      <Switch
                        checked={values['facebook_pixel_enabled'] === 'true'}
                        onCheckedChange={(checked) => handleChange('facebook_pixel_enabled', checked ? 'true' : 'false')}
                      />
                    </div>
                    {values['facebook_pixel_enabled'] === 'true' && (
                      <div className="space-y-2">
                        <Label htmlFor="facebook_pixel_id">Pixel ID</Label>
                        <Input
                          id="facebook_pixel_id"
                          type="text"
                          value={values['facebook_pixel_id'] || ''}
                          onChange={e => handleChange('facebook_pixel_id', e.target.value)}
                          placeholder="XXXXXXXXXXXXXX"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Encontre seu ID em <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.facebook.com</a>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      ℹ️ Eventos Rastreados Automaticamente
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li>Visualizações de páginas</li>
                      <li>Visualizações de imóveis individuais</li>
                      <li>Cliques em menus de navegação</li>
                      <li>Agendamentos de visitas</li>
                      <li>Adição de favoritos</li>
                      <li>Envio de formulários de contato</li>
                      <li>Início de conversas no chat</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Configurações de Analytics"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
};

export default AdminSiteSettings;


import React, { useState, useEffect } from 'react';
import { Search, MapPin, Home, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import PropertyPurposeButtons from '../components/PropertyPurposeButtons';
import PropertyTag from '../components/PropertyTag';
import { formatCurrency } from '../utils/priceUtils';

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
  city: string;
  state: string;
  purpose?: string;
  tags?: string[];
  property_code?: string;
}

interface SiteSettings {
  [key: string]: string | undefined;
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

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
  };

  useEffect(() => {
    async function loadProperties() {
      setLoadingFeatured(true);
      
      // Imóveis em destaque
      const { data: featured } = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'available')
        .limit(8)
        .order('created_at', { ascending: false });

      // Imóveis frente mar
      const { data: beachfront } = await supabase
        .from('properties')
        .select('*')
        .eq('is_beachfront', true)
        .eq('status', 'available')
        .limit(8)
        .order('created_at', { ascending: false });

      // Imóveis quadra mar
      const { data: nearBeach } = await supabase
        .from('properties')
        .select('*')
        .eq('is_near_beach', true)
        .eq('status', 'available')
        .limit(8)
        .order('created_at', { ascending: false });

      // Empreendimentos
      const { data: devs } = await supabase
        .from('properties')
        .select('*')
        .eq('is_development', true)
        .eq('status', 'available')
        .limit(8)
        .order('created_at', { ascending: false });

      const formatProperties = (data: any[]): FeaturedProperty[] => 
        (data || []).map((p) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          rental_price: p.rental_price ? Number(p.rental_price) : undefined,
          location: p.location,
          area: p.area ?? 0,
          bedrooms: p.bedrooms ?? 0,
          bathrooms: p.bathrooms ?? 0,
          property_type: p.property_type ?? '',
          city: p.city ?? '',
          state: p.state ?? '',
          purpose: p.purpose,
          tags: p.tags ?? [],
          property_code: p.property_code,
          images: p.images ?? [],
        }));

      setFeaturedProperties(formatProperties(featured || []));
      setBeachfrontProperties(formatProperties(beachfront || []));
      setNearBeachProperties(formatProperties(nearBeach || []));
      setDevelopments(formatProperties(devs || []));
      setLoadingFeatured(false);
    }
    loadProperties();
  }, []);

  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  // Função para renderizar seção de propriedades
  const renderPropertySection = (
    title: string,
    properties: FeaturedProperty[],
    emptyMessage: string
  ) => {
    if (loadingFeatured) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80"></div>
          ))}
        </div>
      );
    }

    if (properties.length === 0) {
      return (
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center py-8">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property) => (
          <Card
            key={property.id}
            className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 cursor-pointer"
          >
            <div
              className="relative overflow-hidden"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <img
                src={
                  property.images?.[0] ||
                  'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop'
                }
                alt={property.title}
                className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Tags do imóvel */}
              {property.tags && property.tags.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                  {property.tags.slice(0, 2).map((tag, index) => (
                    <PropertyTag key={index} tag={tag} />
                  ))}
                </div>
              )}

              {/* Código do imóvel */}
              {property.property_code && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-mono">
                  {property.property_code}
                </div>
              )}

              {/* Preços */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                {property.purpose === 'rent' && property.rental_price ? (
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {formatCurrency(property.rental_price)}/mês
                  </div>
                ) : property.purpose === 'both' ? (
                  <>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Venda: {formatCurrency(property.price)}
                    </div>
                    {property.rental_price && (
                      <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Aluguel: {formatCurrency(property.rental_price)}/mês
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {formatCurrency(property.price)}
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                {property.property_type}
              </div>

              {/* Botão favorito */}
              <Button
                onClick={e => {
                  e.stopPropagation();
                  toggleFavorite(property.id);
                }}
                className={`absolute top-16 left-4 p-2 rounded-full transition-colors ${
                  isFavorite(property.id)
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
                size="sm"
              >
                <svg className={`w-4 h-4 ${isFavorite(property.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-1.45-1.32c-5.35-4.89-8.88-8.14-8.88-11.54A5.13 5.13 0 016.6 2c1.63 0 3.19.79 4.13 2.06C11.21 2.79 12.77 2 14.4 2A5.13 5.13 0 0121 8.14c0 3.4-3.53 6.65-8.88 11.54L12 21z"/>
                </svg>
              </Button>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                {property.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center truncate">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location}
              </p>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{property.area}m²</span>
                <span>{property.bedrooms} quartos</span>
                <span>{property.bathrooms} banheiros</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  function renderHero() {
    const layout = settings['home_layout'] || 'modelo1';
    const bannerType = settings['home_banner_type'] || 'image';
    const bannerImage = settings['home_banner_image'] || 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1200&h=500&fit=crop';
    const bannerVideo = settings['home_banner_video_url'] || '';

    switch (layout) {
      case 'modelo2':
        return (
          <section className="relative bg-blue-950 text-white py-28">
            {bannerType === 'video' && bannerVideo ? (
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover brightness-75"
              >
                <source src={bannerVideo} type="video/mp4" />
              </video>
            ) : (
              <img
                src={bannerImage}
                alt="Banner Home"
                className="absolute inset-0 w-full h-full object-cover brightness-75"
              />
            )}
            <div className="relative max-w-4xl mx-auto px-4 py-20 text-center z-10">
              <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">
                {settings['home_banner_title'] || t('home.hero.title')}
              </h1>
              <p className="text-2xl mb-6">
                {settings['home_banner_subtitle'] || t('home.hero.subtitle')}
              </p>
              <PropertyPurposeButtons />
            </div>
          </section>
        );
      case 'modelo1':
      default:
        return (
          <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-20">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {settings['home_banner_title'] || t('home.hero.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                {settings['home_banner_subtitle'] || t('home.hero.subtitle')}
              </p>
              
              {/* Botões Comprar/Alugar */}
              <PropertyPurposeButtons />
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8">
                <div className="flex bg-white rounded-lg shadow-lg p-2">
                  <Input
                    type="text"
                    placeholder={t('home.search.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border-none text-gray-900 text-lg"
                  />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8">
                    <Search className="w-5 h-5 mr-2" />
                    {t('home.search.button')}
                  </Button>
                </div>
              </form>
            </div>
            {bannerType === 'video' && bannerVideo ? (
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              >
                <source src={bannerVideo} type="video/mp4" />
              </video>
            ) : (
              <img
                src={bannerImage}
                alt="Banner Home"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
            )}
          </section>
        );
    }
  }

  function renderAboutSection() {
    const aboutImage =
      settings['about_section_image'] ||
      'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop';

    return (
      <section className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {settings['about_section_title'] || t('home.about.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                {settings['about_section_text'] || t('home.about.text')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                  <Home className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">500+</h3>
                  <p className="text-gray-600 dark:text-gray-300">Imóveis</p>
                </div>
                <div className="text-center p-6 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                  <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1000+</h3>
                  <p className="text-gray-600 dark:text-gray-300">Clientes</p>
                </div>
                <div className="text-center p-6 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                  <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">15</h3>
                  <p className="text-gray-600 dark:text-gray-300">Anos</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={aboutImage}
                alt="Sobre"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-blue-600 opacity-10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Renderizar seções baseadas nas configurações
  const sectionsOrder = JSON.parse(settings['home_sections_order'] || '["featured", "beachfront", "near_beach", "developments"]');
  const sectionsConfig = {
    featured: {
      show: settings['home_sections_featured'] === 'true',
      title: 'Imóveis em Destaque',
      properties: featuredProperties,
      emptyMessage: 'Nenhum imóvel em destaque no momento.'
    },
    beachfront: {
      show: settings['home_sections_beachfront'] === 'true',
      title: 'Imóveis Frente Mar',
      properties: beachfrontProperties,
      emptyMessage: 'Nenhum imóvel frente mar no momento.'
    },
    near_beach: {
      show: settings['home_sections_near_beach'] === 'true',
      title: 'Imóveis Quadra Mar',
      properties: nearBeachProperties,
      emptyMessage: 'Nenhum imóvel quadra mar no momento.'
    },
    developments: {
      show: settings['home_sections_developments'] === 'true',
      title: 'Empreendimentos',
      properties: developments,
      emptyMessage: 'Nenhum empreendimento no momento.'
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        {renderHero()}

        {/* Seções de Propriedades Dinâmicas */}
        {sectionsOrder.map((sectionKey: string) => {
          const section = sectionsConfig[sectionKey as keyof typeof sectionsConfig];
          if (!section || !section.show) return null;

          return (
            <section key={sectionKey} className="py-16 bg-white dark:bg-slate-900">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {section.title}
                  </h2>
                </div>
                {renderPropertySection(section.title, section.properties, section.emptyMessage)}
              </div>
            </section>
          );
        })}

        {/* About Section */}
        {renderAboutSection()}
      </div>
    </Layout>
  );
};

export default HomePage;

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

type FeaturedProperty = {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  images: string[];
  property_type: string;
  bathrooms: number;
  city: string;
  state: string;
};

const getHomeSettings = async () => {
  const keys = [
    'home_banner_title',
    'home_banner_subtitle',
    'home_banner_button',
    'home_banner_image',
    'about_section_title',
    'about_section_text',
    'about_section_image',
    'home_layout',
  ];
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', keys);

  const map: Record<string, string> = {};
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
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Novos estados site_settings
  const [settings, setSettings] = useState<Record<string, string | undefined>>({});

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
    async function loadFeatured() {
      setLoadingFeatured(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .limit(8)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setFeaturedProperties(
          (data as any[]).map((p) => ({
            id: p.id,
            title: p.title,
            price: Number(p.price),
            location: p.location,
            area: p.area ?? 0,
            bedrooms: p.bedrooms ?? 0,
            bathrooms: p.bathrooms ?? 0,
            property_type: p.property_type ?? '',
            city: p.city ?? '',
            state: p.state ?? '',
            images: p.images ?? [],
          }))
        );
      } else {
        setFeaturedProperties([]);
      }
      setLoadingFeatured(false);
    }
    loadFeatured();
  }, []);

  // Adicionar hook do favoritos que redireciona quando não autenticado
  const { toggleFavorite, isFavorite } = useFavorites(() => {
    navigate('/auth');
  });

  // Blocos de layout da home (pode ser expandido com mais modelos)
  function renderHero() {
    const layout = settings['home_layout'] || 'modelo1';
    const bannerImage =
      settings['home_banner_image'] ||
      'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1200&h=500&fit=crop';

    switch (layout) {
      case 'modelo2':
        return (
          <section className="relative bg-blue-950 text-white py-28">
            <img
              src={bannerImage}
              alt="Banner Home"
              className="absolute inset-0 w-full h-full object-cover brightness-75"
            />
            <div className="relative max-w-4xl mx-auto px-4 py-20 text-center z-10">
              <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">
                {settings['home_banner_title'] || t('home.hero.title')}
              </h1>
              <p className="text-2xl mb-6">
                {settings['home_banner_subtitle'] || t('home.hero.subtitle')}
              </p>
              <Button
                onClick={() => navigate('/properties')}
                size="lg"
                className="bg-blue-600 text-white font-semibold px-8"
              >
                {settings['home_banner_button'] || t('home.search.button')}
              </Button>
            </div>
          </section>
        );
      // Outros modelos podem ser implementados aqui...
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
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
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
            <img
              src={bannerImage}
              alt="Banner Home"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
          </section>
        );
    }
  }

  // About Section customizada com imagem
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

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        {renderHero()}

        {/* Featured Properties */}
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('home.features.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {/* Mensagem caso não haja imóveis */}
                {loadingFeatured
                  ? 'Carregando imóveis em destaque...'
                  : featuredProperties.length === 0
                  ? 'Nenhum imóvel de destaque no momento.'
                  : null}
              </p>
            </div>
            {/* Grid de imóveis em destaque */}
            {featuredProperties.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProperties.map((property) => (
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
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                      </div>
                      <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
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
            )}
          </div>
        </section>

        {/* About Section */}
        {renderAboutSection()}
      </div>
    </Layout>
  );
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Home, Users, Award, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '@/integrations/supabase/client';

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

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

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

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-20">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t('home.hero.subtitle')}
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
        </section>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {featuredProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 cursor-pointer"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          property.images?.[0] ||
                          'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop'
                        }
                        alt={property.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {property.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
                      </div>
                      <div className="absolute top-4 left-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1 rounded-full text-sm font-medium">
                        {property.property_type}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
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
        <section className="py-16 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('home.about.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  {t('home.about.text')}
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
                  src="https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=600&h=400&fit=crop"
                  alt="About Us"
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-blue-600 opacity-10 rounded-lg"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;


import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import PropertyPurposeButtons from './PropertyPurposeButtons';

interface HomeHeroProps {
  settings: Record<string, string>;
}

const HomeHero: React.FC<HomeHeroProps> = ({ settings }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
  };

  const layout = settings['home_layout'] || 'modelo1';
  const bannerType = settings['home_banner_type'] || 'image';
  const bannerImage = settings['home_banner_image'] || 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1200&h=500&fit=crop';
  const bannerVideo = settings['home_banner_video_url'] || '';

  if (layout === 'modelo2') {
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
  }

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
        
        <PropertyPurposeButtons />
        
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
};

export default HomeHero;

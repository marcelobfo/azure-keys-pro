
import React from 'react';
import { Home, Users, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AboutSectionProps {
  settings: Record<string, string>;
}

const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  const { t } = useLanguage();
  
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
  );
};

export default AboutSection;

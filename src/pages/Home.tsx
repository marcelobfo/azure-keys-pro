
import React from 'react';
import Layout from '../components/Layout';
import HomeHero from '../components/HomeHero';
import PropertySection from '../components/PropertySection';
import AboutSection from '../components/AboutSection';
import { useHomeData } from '../hooks/useHomeData';

const HomePage = () => {
  const {
    featuredProperties,
    beachfrontProperties,
    nearBeachProperties,
    developments,
    loadingFeatured,
    settings
  } = useHomeData();

  // Renderizar seções baseadas nas configurações e se há imóveis
  const sectionsOrder = JSON.parse(settings['home_sections_order'] || '["featured", "beachfront", "near_beach", "developments"]');
  const sectionsConfig = {
    featured: {
      show: settings['home_sections_featured'] === 'true' && featuredProperties.length > 0,
      title: 'Imóveis em Destaque',
      properties: featuredProperties,
      emptyMessage: 'Nenhum imóvel em destaque no momento.'
    },
    beachfront: {
      show: settings['home_sections_beachfront'] === 'true' && beachfrontProperties.length > 0,
      title: 'Imóveis Frente Mar',
      properties: beachfrontProperties,
      emptyMessage: 'Nenhum imóvel frente mar no momento.'
    },
    near_beach: {
      show: settings['home_sections_near_beach'] === 'true' && nearBeachProperties.length > 0,
      title: 'Imóveis Quadra Mar',
      properties: nearBeachProperties,
      emptyMessage: 'Nenhum imóvel quadra mar no momento.'
    },
    developments: {
      show: settings['home_sections_developments'] === 'true' && developments.length > 0,
      title: 'Empreendimentos',
      properties: developments,
      emptyMessage: 'Nenhum empreendimento no momento.'
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <HomeHero settings={settings} />

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
                <PropertySection
                  title={section.title}
                  properties={section.properties}
                  emptyMessage={section.emptyMessage}
                  loading={loadingFeatured}
                />
              </div>
            </section>
          );
        })}

        <AboutSection settings={settings} />
      </div>
    </Layout>
  );
};

export default HomePage;

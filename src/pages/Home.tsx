
import React, { useEffect, useState } from 'react';
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

  const [isVisible, setIsVisible] = useState(true);

  // Gerenciar visibilidade da página para evitar tela branca
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Página ficou oculta - não fazer nada crítico
        console.log('🔍 Page hidden');
      } else {
        // Página voltou a ser visível - garantir que o estado está correto
        console.log('👁️ Page visible');
        setIsVisible(true);
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused');
      setIsVisible(true);
    };

    const handleBlur = () => {
      console.log('😴 Window blurred');
      // Não alterar isVisible no blur para evitar tela branca
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

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

  // Loading state mais robusto para evitar tela branca
  if (loadingFeatured || Object.keys(settings).length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col bg-background">
          {/* Skeleton para o hero */}
          <div className="h-96 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 animate-pulse">
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-8 w-64 bg-white/20 rounded mx-auto"></div>
                <div className="h-4 w-48 bg-white/20 rounded mx-auto"></div>
              </div>
            </div>
          </div>
          
          {/* Skeleton para seções */}
          <div className="flex-1 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded mx-auto mb-4 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-slate-700"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Garantir que sempre renderiza algo visível
  if (!isVisible) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </Layout>
    );
  }

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

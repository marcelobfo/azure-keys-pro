import React from 'react';
import Layout from '../components/Layout';
import HomeHero from '../components/HomeHero';
import PropertySection from '../components/PropertySection';
import PropertySectionSkeleton from '../components/PropertySectionSkeleton';
import AboutSection from '../components/AboutSection';
import { useHomeSections } from '../hooks/useHomeSections';
import { useHomeData } from '../hooks/useHomeData';

const HomePage = () => {
  const { sections, sectionProperties, loading: sectionsLoading } = useHomeSections();
  const { settings, loadingFeatured } = useHomeData();

  const isInitialLoading = sectionsLoading && sections.length === 0;

  return (
    <Layout>
      <div className="min-h-screen">
        <HomeHero settings={settings} loading={loadingFeatured && Object.keys(settings).length === 0} />

        {/* Show skeletons during initial load */}
        {isInitialLoading && (
          <>
            <PropertySectionSkeleton />
            <PropertySectionSkeleton />
          </>
        )}

        {/* Render actual sections */}
        {sections.map((section) => {
          const properties = sectionProperties[section.id] || [];
          if (properties.length === 0 && !sectionsLoading) return null;

          return (
            <section key={section.id} className="py-16 bg-background">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {section.title}
                  </h2>
                </div>
                <PropertySection
                  title={section.title}
                  properties={properties}
                  emptyMessage={`Nenhum imóvel encontrado para ${section.title}.`}
                  loading={sectionsLoading}
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

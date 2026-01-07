import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useTenant } from '@/hooks/useTenant';

const SEOUpdater = () => {
  const { settings, loading } = useSiteSettings();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (loading) return;

    // Não sobrescrever SEO em páginas específicas que têm seu próprio SEO
    const isSpecificPage = window.location.pathname.startsWith('/imovel/');
    
    // Fallbacks usando nome do tenant
    const siteTitle = settings.site_title || 
      (currentTenant?.name ? `${currentTenant.name} - Imóveis` : '');
    const siteDescription = settings.site_description || 
      (currentTenant?.name ? `Encontre o imóvel ideal com ${currentTenant.name}` : '');
    const siteName = settings.site_name || currentTenant?.name || '';
    
    if (!isSpecificPage) {
      // Atualizar título da página
      if (siteTitle) {
        document.title = siteTitle;
      }

      // Atualizar meta description
      if (siteDescription) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', siteDescription);
        }
      }

      // Atualizar Open Graph title
      if (siteTitle) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
          ogTitle.setAttribute('content', siteTitle);
        }
      }

      // Atualizar Open Graph description
      if (siteDescription) {
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
          ogDescription.setAttribute('content', siteDescription);
        }
      }

      // Atualizar Twitter Card title
      if (siteTitle) {
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
          twitterTitle.setAttribute('content', siteTitle);
        }
      }

      // Atualizar Twitter Card description
      if (siteDescription) {
        const twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (twitterDescription) {
          twitterDescription.setAttribute('content', siteDescription);
        }
      }
    }

    // Atualizar meta author (sempre)
    if (siteName) {
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor) {
        metaAuthor.setAttribute('content', siteName);
      }
    }

    // Atualizar favicon (sempre)
    if (settings.site_favicon_url) {
      localStorage.setItem('site-favicon', settings.site_favicon_url);
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = settings.site_favicon_url;
      }
    }

    // Atualizar structured data apenas em páginas gerais
    if (!isSpecificPage && siteName) {
      const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (structuredDataScript) {
        try {
          const data = JSON.parse(structuredDataScript.textContent || '{}');
          data.name = siteName;
          if (siteDescription) {
            data.description = siteDescription;
          }
          structuredDataScript.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          console.error('Erro ao atualizar structured data:', error);
        }
      }
    }
  }, [settings, loading, currentTenant]);

  return null;
};

export default SEOUpdater;

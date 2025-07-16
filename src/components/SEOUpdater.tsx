import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const SEOUpdater = () => {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (loading) return;

    // Atualizar título da página
    if (settings.site_title) {
      document.title = settings.site_title;
    }

    // Atualizar meta description
    if (settings.site_description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', settings.site_description);
      }
    }

    // Atualizar meta author
    if (settings.site_name) {
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor) {
        metaAuthor.setAttribute('content', settings.site_name);
      }
    }

    // Atualizar Open Graph title
    if (settings.site_title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', settings.site_title);
      }
    }

    // Atualizar Open Graph description
    if (settings.site_description) {
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', settings.site_description);
      }
    }

    // Atualizar Twitter Card title
    if (settings.site_title) {
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', settings.site_title);
      }
    }

    // Atualizar Twitter Card description
    if (settings.site_description) {
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', settings.site_description);
      }
    }

    // Atualizar favicon
    if (settings.site_favicon_url) {
      localStorage.setItem('site-favicon', settings.site_favicon_url);
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = settings.site_favicon_url;
      }
    }

    // Atualizar structured data
    if (settings.site_name) {
      const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (structuredDataScript) {
        try {
          const data = JSON.parse(structuredDataScript.textContent || '{}');
          data.name = settings.site_name;
          if (settings.site_description) {
            data.description = settings.site_description;
          }
          structuredDataScript.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          console.error('Erro ao atualizar structured data:', error);
        }
      }
    }
  }, [settings, loading]);

  return null; // Este componente não renderiza nada
};

export default SEOUpdater;
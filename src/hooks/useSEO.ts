import { useEffect } from 'react';

interface SEOMetaData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string[];
  author?: string;
  siteName?: string;
}

export const useSEO = (metaData: SEOMetaData) => {
  useEffect(() => {
    // Atualizar title
    document.title = metaData.title;
    
    // Atualizar ou criar meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let existingTag = document.querySelector(selector);
      
      if (existingTag) {
        existingTag.setAttribute('content', content);
      } else {
        const newTag = document.createElement('meta');
        if (isProperty) {
          newTag.setAttribute('property', name);
        } else {
          newTag.setAttribute('name', name);
        }
        newTag.setAttribute('content', content);
        document.head.appendChild(newTag);
      }
    };

    // Meta tags básicas
    updateMetaTag('description', metaData.description);
    
    if (metaData.keywords && metaData.keywords.length > 0) {
      updateMetaTag('keywords', metaData.keywords.join(', '));
    }
    
    if (metaData.author) {
      updateMetaTag('author', metaData.author);
    }

    // Open Graph tags
    updateMetaTag('og:title', metaData.title, true);
    updateMetaTag('og:description', metaData.description, true);
    updateMetaTag('og:type', metaData.type || 'website', true);
    
    if (metaData.url) {
      updateMetaTag('og:url', metaData.url, true);
    }
    
    if (metaData.image) {
      updateMetaTag('og:image', metaData.image, true);
    }
    
    if (metaData.siteName) {
      updateMetaTag('og:site_name', metaData.siteName, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', metaData.title);
    updateMetaTag('twitter:description', metaData.description);
    
    if (metaData.image) {
      updateMetaTag('twitter:image', metaData.image);
    }

    // Canonical URL
    if (metaData.url) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', metaData.url);
      } else {
        const newCanonicalLink = document.createElement('link');
        newCanonicalLink.rel = 'canonical';
        newCanonicalLink.href = metaData.url;
        document.head.appendChild(newCanonicalLink);
      }
    }

    // Structured data (JSON-LD)
    if (metaData.type === 'article') {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "RealEstate",
        "name": metaData.title,
        "description": metaData.description,
        "image": metaData.image,
        "url": metaData.url
      };

      let existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.textContent = JSON.stringify(structuredData);
      } else {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    }
  }, [metaData]);
};

export const generatePropertySEO = (property: any): SEOMetaData => {
  const title = `${property.title} - ${property.city}, ${property.state || 'SC'}`;
  const description = `${property.property_type} em ${property.city} com ${property.bedrooms} quartos, ${property.bathrooms} banheiros e ${property.area}m². Preço: R$ ${property.price.toLocaleString('pt-BR')}.`;
  
  const keywords = [
    property.property_type,
    property.city,
    property.state || 'SC',
    `${property.bedrooms} quartos`,
    `${property.bathrooms} banheiros`,
    'imóvel',
    'venda',
    'comprar'
  ];

  if (property.purpose === 'rent') {
    keywords.push('aluguel', 'alugar');
  }

  if (property.is_beachfront) {
    keywords.push('frente mar', 'beira mar');
  }

  if (property.is_near_beach) {
    keywords.push('quadra mar', 'perto da praia');
  }

  if (property.is_development) {
    keywords.push('empreendimento', 'lançamento');
  }

  return {
    title,
    description,
    image: property.images?.[0],
    url: `${window.location.origin}/imovel/${property.slug}`,
    type: 'article',
    keywords,
    author: property.broker_name || 'Imóveis Premium',
    siteName: 'Imóveis Premium'
  };
};
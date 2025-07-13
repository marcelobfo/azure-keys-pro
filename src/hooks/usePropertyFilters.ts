
import { useState, useMemo } from 'react';

interface PropertyFilters {
  search: string;
  type: string;
  city: string;
  purpose: string;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  bathrooms: string;
  tags: string[];
  isBeachfront: boolean;
  isNearBeach: boolean;
  isDevelopment: boolean;
  isFeatured: boolean;
}

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  purpose?: string;
  image: string;
  tags?: string[];
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  is_featured?: boolean;
  property_code?: string;
}

export const usePropertyFilters = (properties: Property[]) => {
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    type: '',
    city: '',
    purpose: '',
    priceMin: 0,
    priceMax: 100000000, // Aumentado para 100M para cobrir propriedades mais caras
    areaMin: 0,
    areaMax: 2000,
    bedrooms: '',
    bathrooms: '',
    tags: [],
    isBeachfront: false,
    isNearBeach: false,
    isDevelopment: false,
    isFeatured: false
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter - incluir busca por código do imóvel, título e localização
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        const matchesTitle = property.title && property.title.toLowerCase().includes(searchTerm);
        const matchesLocation = property.location && property.location.toLowerCase().includes(searchTerm);
        const matchesCode = property.property_code && 
          property.property_code.toLowerCase().includes(searchTerm);
        
        if (!matchesTitle && !matchesLocation && !matchesCode) {
          return false;
        }
      }

      // Type filter - simplificado para maior compatibilidade
      if (filters.type && filters.type !== 'all' && filters.type !== '') {
        const filterType = filters.type.toLowerCase().trim();
        const propertyType = (property.type || '').toLowerCase().trim();
        
        // Comparação exata ou parcial mais flexível
        if (propertyType !== filterType && !propertyType.includes(filterType)) {
          return false;
        }
      }

      // Purpose filter
      if (filters.purpose && filters.purpose !== 'all' && filters.purpose !== '') {
        const filterPurpose = filters.purpose.toLowerCase().trim();
        const propertyPurpose = property.purpose?.toLowerCase().trim() || '';
        
        if (propertyPurpose !== filterPurpose) {
          return false;
        }
      }

      // City filter
      if (filters.city && filters.city !== 'all' && filters.city !== '') {
        if (!property.location || !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
      }

      // Price filter - considera tanto preço de venda quanto aluguel
      const relevantPrice = filters.purpose === 'rent' ? (property.rental_price || property.price) : property.price;
      if (relevantPrice < filters.priceMin || relevantPrice > filters.priceMax) {
        return false;
      }

      // Area filter
      if (property.area && (property.area < filters.areaMin || property.area > filters.areaMax)) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms && filters.bedrooms !== 'any' && filters.bedrooms !== '') {
        const bedroomCount = parseInt(filters.bedrooms);
        if (filters.bedrooms === '4' && property.bedrooms < 4) {
          return false;
        }
        if (filters.bedrooms !== '4' && property.bedrooms !== bedroomCount) {
          return false;
        }
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms !== 'any' && filters.bathrooms !== '') {
        const bathroomCount = parseInt(filters.bathrooms);
        if (filters.bathrooms === '3' && property.bathrooms < 3) {
          return false;
        }
        if (filters.bathrooms !== '3' && property.bathrooms !== bathroomCount) {
          return false;
        }
      }

      // Tags filter - incluir busca em todas as categorias especiais
      if (filters.tags.length > 0) {
        const propertyTags = property.tags || [];
        const specialCategories = [];
        
        // Adicionar categorias especiais como tags virtuais
        if (property.is_featured) specialCategories.push('destaque', 'featured');
        if (property.is_beachfront) specialCategories.push('frente mar', 'beachfront');
        if (property.is_near_beach) specialCategories.push('quadra mar', 'near beach');
        if (property.is_development) specialCategories.push('empreendimento', 'development');
        
        const allSearchableTags = [...propertyTags, ...specialCategories];
        
        const hasMatchingTag = filters.tags.some(filterTag => 
          allSearchableTags.some(tag => 
            tag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filtros especiais
      if (filters.isFeatured && !property.is_featured) {
        return false;
      }

      if (filters.isBeachfront && !property.is_beachfront) {
        return false;
      }

      if (filters.isNearBeach && !property.is_near_beach) {
        return false;
      }

      if (filters.isDevelopment && !property.is_development) {
        return false;
      }

      return true;
    });
  }, [properties, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      city: '',
      purpose: '',
      priceMin: 0,
      priceMax: 100000000, // Atualizado para 100M como no estado inicial
      areaMin: 0,
      areaMax: 2000,
      bedrooms: '',
      bathrooms: '',
      tags: [],
      isBeachfront: false,
      isNearBeach: false,
      isDevelopment: false,
      isFeatured: false
    });
  };

  return {
    filters,
    setFilters,
    filteredProperties,
    clearFilters
  };
};

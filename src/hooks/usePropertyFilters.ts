
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
    priceMax: 10000000,
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
    console.log('Filtering properties:', properties.length);
    console.log('Current filters:', filters);
    
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

      // Type filter - melhorar comparação
      if (filters.type && filters.type !== 'all' && filters.type !== '') {
        const filterType = filters.type.toLowerCase().trim();
        const propertyType = property.type.toLowerCase().trim();
        
        // Buscar por correspondência parcial para maior flexibilidade
        const matchesType = propertyType.includes(filterType) || 
                           filterType.includes(propertyType) ||
                           propertyType === filterType;
        
        if (!matchesType) {
          return false;
        }
      }

      // Purpose filter
      if (filters.purpose && filters.purpose !== 'all' && filters.purpose !== '') {
        const filterPurpose = filters.purpose.toLowerCase().trim();
        const propertyPurpose = property.purpose?.toLowerCase().trim() || '';
        
        if (propertyPurpose !== filterPurpose) {
          console.log(`Property ${property.id} filtered out by purpose`);
          return false;
        }
      }

      // City filter
      if (filters.city && filters.city !== 'all' && filters.city !== '') {
        if (!property.location || !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
          console.log(`Property ${property.id} filtered out by city`);
          return false;
        }
      }

      // Price filter - considera tanto preço de venda quanto aluguel
      const relevantPrice = filters.purpose === 'rent' ? (property.rental_price || property.price) : property.price;
      if (relevantPrice < filters.priceMin || relevantPrice > filters.priceMax) {
        console.log(`Property ${property.id} filtered out by price: ${relevantPrice}`);
        return false;
      }

      // Area filter
      if (property.area && (property.area < filters.areaMin || property.area > filters.areaMax)) {
        console.log(`Property ${property.id} filtered out by area: ${property.area}`);
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms && filters.bedrooms !== 'any' && filters.bedrooms !== '') {
        const bedroomCount = parseInt(filters.bedrooms);
        if (filters.bedrooms === '4' && property.bedrooms < 4) {
          console.log(`Property ${property.id} filtered out by bedrooms (4+): ${property.bedrooms}`);
          return false;
        }
        if (filters.bedrooms !== '4' && property.bedrooms !== bedroomCount) {
          console.log(`Property ${property.id} filtered out by bedrooms: ${property.bedrooms} !== ${bedroomCount}`);
          return false;
        }
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms !== 'any' && filters.bathrooms !== '') {
        const bathroomCount = parseInt(filters.bathrooms);
        if (filters.bathrooms === '3' && property.bathrooms < 3) {
          console.log(`Property ${property.id} filtered out by bathrooms (3+): ${property.bathrooms}`);
          return false;
        }
        if (filters.bathrooms !== '3' && property.bathrooms !== bathroomCount) {
          console.log(`Property ${property.id} filtered out by bathrooms: ${property.bathrooms} !== ${bathroomCount}`);
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

      // Filtros especiais - corrigir lógica
      if (filters.isFeatured && !property.is_featured) {
        console.log(`Property ${property.id} filtered out by featured filter`);
        return false;
      }

      if (filters.isBeachfront && !property.is_beachfront) {
        console.log(`Property ${property.id} filtered out by beachfront filter`);
        return false;
      }

      if (filters.isNearBeach && !property.is_near_beach) {
        console.log(`Property ${property.id} filtered out by near beach filter`);
        return false;
      }

      if (filters.isDevelopment && !property.is_development) {
        console.log(`Property ${property.id} filtered out by development filter`);
        return false;
      }

      console.log(`Property ${property.id} passed all filters`);
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
      priceMax: 10000000,
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

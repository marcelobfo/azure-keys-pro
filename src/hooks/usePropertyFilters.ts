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
  acceptsExchange: boolean;
}

interface Property {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  city: string;
  state: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  property_type: string;
  purpose?: string;
  images: string[];
  tags?: string[];
  features?: string[];
  is_beachfront?: boolean;
  is_near_beach?: boolean;
  is_development?: boolean;
  is_featured?: boolean;
  accepts_exchange?: boolean;
  property_code?: string;
  hide_address?: boolean;
  slug?: string;
}

export const usePropertyFilters = (properties: Property[]) => {
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    type: '',
    city: '',
    purpose: '',
    priceMin: 0,
    priceMax: 100000000,
    areaMin: 0,
    areaMax: 2000,
    bedrooms: '',
    bathrooms: '',
    tags: [],
    isBeachfront: false,
    isNearBeach: false,
    isDevelopment: false,
    isFeatured: false,
    acceptsExchange: false
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
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

      // Type filter
      if (filters.type && filters.type !== 'all' && filters.type !== '') {
        const filterType = filters.type.toLowerCase().trim();
        const propertyType = (property.property_type || '').toLowerCase().trim();
        
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
        const cityFilter = filters.city.toLowerCase();
        const propertyCity = (property.city || '').toLowerCase();
        const propertyLocation = (property.location || '').toLowerCase();
        
        if (!propertyCity.includes(cityFilter) && !propertyLocation.includes(cityFilter)) {
          return false;
        }
      }

      // Price filter
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
        if (property.bedrooms < bedroomCount) {
          return false;
        }
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms !== 'any' && filters.bathrooms !== '') {
        const bathroomCount = parseInt(filters.bathrooms);
        if (property.bathrooms < bathroomCount) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const propertyTags = property.tags || [];
        const specialCategories = [];
        
        if (property.is_featured) specialCategories.push('destaque', 'featured');
        if (property.is_beachfront) specialCategories.push('frente mar', 'beachfront');
        if (property.is_near_beach) specialCategories.push('quadra mar', 'near beach');
        if (property.is_development) specialCategories.push('empreendimento', 'development');
        if (property.accepts_exchange) specialCategories.push('aceita permuta', 'exchange');
        
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

      // Special filters
      if (filters.isFeatured && !property.is_featured) return false;
      if (filters.isBeachfront && !property.is_beachfront) return false;
      if (filters.isNearBeach && !property.is_near_beach) return false;
      if (filters.isDevelopment && !property.is_development) return false;
      if (filters.acceptsExchange && !property.accepts_exchange) return false;

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
      priceMax: 100000000,
      areaMin: 0,
      areaMax: 2000,
      bedrooms: '',
      bathrooms: '',
      tags: [],
      isBeachfront: false,
      isNearBeach: false,
      isDevelopment: false,
      isFeatured: false,
      acceptsExchange: false
    });
  };

  return {
    filters,
    setFilters,
    filteredProperties,
    clearFilters
  };
};
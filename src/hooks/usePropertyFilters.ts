
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
    isDevelopment: false
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      if (filters.search && !property.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !property.location.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(property.property_code && property.property_code.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && property.type !== filters.type) {
        return false;
      }

      // Purpose filter
      if (filters.purpose && filters.purpose !== 'all' && property.purpose !== filters.purpose) {
        return false;
      }

      // City filter
      if (filters.city && filters.city !== 'all' && !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }

      // Price filter - considera tanto preço de venda quanto aluguel
      const relevantPrice = filters.purpose === 'rent' ? (property.rental_price || property.price) : property.price;
      if (relevantPrice < filters.priceMin || relevantPrice > filters.priceMax) {
        return false;
      }

      // Area filter
      if (property.area < filters.areaMin || property.area > filters.areaMax) {
        return false;
      }

      // Bedrooms filter
      if (filters.bedrooms && filters.bedrooms !== 'any') {
        const bedroomCount = parseInt(filters.bedrooms);
        if (filters.bedrooms === '4' && property.bedrooms < 4) return false;
        if (filters.bedrooms !== '4' && property.bedrooms !== bedroomCount) return false;
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms !== 'any') {
        const bathroomCount = parseInt(filters.bathrooms);
        if (filters.bathrooms === '3' && property.bathrooms < 3) return false;
        if (filters.bathrooms !== '3' && property.bathrooms !== bathroomCount) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const propertyTags = property.tags || [];
        const hasMatchingTag = filters.tags.some(filterTag => 
          propertyTags.some(propertyTag => 
            propertyTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Beachfront filter
      if (filters.isBeachfront && !property.is_beachfront) {
        return false;
      }

      // Near beach filter
      if (filters.isNearBeach && !property.is_near_beach) {
        return false;
      }

      // Development filter
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
      priceMax: 10000000,
      areaMin: 0,
      areaMax: 2000,
      bedrooms: '',
      bathrooms: '',
      tags: [],
      isBeachfront: false,
      isNearBeach: false,
      isDevelopment: false
    });
  };

  return {
    filters,
    setFilters,
    filteredProperties,
    clearFilters
  };
};


import { useState, useMemo } from 'react';

interface PropertyFilters {
  search: string;
  type: string;
  city: string;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  bathrooms: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  type: string;
  image: string;
}

export const usePropertyFilters = (properties: Property[]) => {
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    type: '',
    city: '',
    priceMin: 0,
    priceMax: 5000000,
    areaMin: 0,
    areaMax: 1000,
    bedrooms: '',
    bathrooms: ''
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      if (filters.search && !property.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !property.location.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && property.type !== filters.type) {
        return false;
      }

      // City filter
      if (filters.city && filters.city !== 'all' && !property.location.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }

      // Price filter
      if (property.price < filters.priceMin || property.price > filters.priceMax) {
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

      return true;
    });
  }, [properties, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      city: '',
      priceMin: 0,
      priceMax: 5000000,
      areaMin: 0,
      areaMax: 1000,
      bedrooms: '',
      bathrooms: ''
    });
  };

  return {
    filters,
    setFilters,
    filteredProperties,
    clearFilters
  };
};

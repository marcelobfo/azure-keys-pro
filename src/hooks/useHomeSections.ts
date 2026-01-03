import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

export interface SectionFilter {
  type: 'boolean_field' | 'tag' | 'property_type' | 'city' | 'purpose';
  field: string | null;
  value: string;
}

export interface HomeSection {
  id: string;
  tenant_id: string | null;
  title: string;
  filters: SectionFilter[];
  // Legacy fields (kept for compatibility)
  filter_type: string;
  filter_field: string | null;
  filter_value: string | null;
  display_order: number;
  is_active: boolean;
  max_items: number;
  created_at: string;
  updated_at: string;
}

export interface HomeSectionProperty {
  id: string;
  title: string;
  price: number;
  rental_price?: number;
  location: string;
  area: number;
  bedrooms: number;
  images: string[];
  property_type: string;
  bathrooms: number;
  suites?: number;
  city: string;
  state: string;
  purpose?: string;
  tags?: string[];
  property_code?: string;
  features?: string[];
  hide_address?: boolean;
}

// Helper to get effective filters from a section (handles both new and legacy format)
const getEffectiveFilters = (section: HomeSection): SectionFilter[] => {
  // If filters array exists and has items, use it
  if (section.filters && Array.isArray(section.filters) && section.filters.length > 0) {
    return section.filters;
  }
  
  // Fallback to legacy format
  if (section.filter_type === 'boolean_field' && section.filter_field) {
    return [{ type: 'boolean_field', field: section.filter_field, value: 'true' }];
  }
  
  if (['tag', 'property_type', 'city', 'purpose'].includes(section.filter_type) && section.filter_value) {
    return [{ type: section.filter_type as SectionFilter['type'], field: null, value: section.filter_value }];
  }
  
  return [];
};

export const useHomeSections = () => {
  const { selectedTenantId, currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;
  
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [sectionProperties, setSectionProperties] = useState<Record<string, HomeSectionProperty[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    if (!effectiveTenantId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Parse filters from JSONB
      const parsedSections = (data || []).map((s: any) => ({
        ...s,
        filters: Array.isArray(s.filters) ? s.filters : [],
      }));
      
      setSections(parsedSections);
    } catch (error) {
      console.error('Error fetching home sections:', error);
      setSections([]);
    }
  }, [effectiveTenantId]);

  const fetchPropertiesForSections = useCallback(async () => {
    if (sections.length === 0 || !effectiveTenantId) {
      setSectionProperties({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const propertiesBySection: Record<string, HomeSectionProperty[]> = {};

    try {
      for (const section of sections) {
        const filters = getEffectiveFilters(section);
        
        // Build query with all filters applied (AND logic)
        let query = supabase
          .from('properties')
          .select('*')
          .eq('tenant_id', effectiveTenantId)
          .in('status', ['active', 'ativo', 'available']);

        // Apply each filter
        for (const filter of filters) {
          switch (filter.type) {
            case 'boolean_field':
              if (filter.field) {
                query = (query as any).eq(filter.field, true);
              }
              break;
            case 'tag':
              query = query.contains('tags', [filter.value]);
              break;
            case 'property_type':
              query = query.eq('property_type', filter.value);
              break;
            case 'city':
              query = query.ilike('city', `%${filter.value}%`);
              break;
            case 'purpose':
              query = query.eq('purpose', filter.value);
              break;
          }
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(section.max_items || 8);

        if (error) {
          console.error(`Error fetching properties for section ${section.id}:`, error);
          propertiesBySection[section.id] = [];
        } else {
          propertiesBySection[section.id] = (data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price ? Number(p.price) : 0,
            rental_price: p.rental_price ? Number(p.rental_price) : undefined,
            location: p.location || '',
            area: p.area || 0,
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            suites: p.suites || 0,
            property_type: p.property_type || '',
            city: p.city || '',
            state: p.state || '',
            purpose: p.purpose,
            tags: Array.isArray(p.tags) ? p.tags : [],
            features: Array.isArray(p.features) ? p.features : [],
            property_code: p.property_code,
            images: Array.isArray(p.images) ? p.images : [],
            hide_address: Boolean(p.hide_address),
          }));
        }
      }

      setSectionProperties(propertiesBySection);
    } catch (error) {
      console.error('Error fetching properties for sections:', error);
    } finally {
      setLoading(false);
    }
  }, [sections, effectiveTenantId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (sections.length > 0) {
      fetchPropertiesForSections();
    } else {
      setLoading(false);
    }
  }, [sections, fetchPropertiesForSections]);

  return {
    sections,
    sectionProperties,
    loading,
    refetch: fetchSections
  };
};

// Export helper for use in other components
export { getEffectiveFilters };

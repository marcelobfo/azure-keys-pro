import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';

export interface HomeSection {
  id: string;
  tenant_id: string | null;
  title: string;
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
      setSections(data || []);
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
        let data: any[] | null = null;
        let error: any = null;

        const baseFilters = {
          tenant_id: effectiveTenantId,
          status: ['active', 'ativo', 'available'],
        };

        if (section.filter_type === 'boolean_field' && section.filter_field) {
          // Use explicit type to avoid TypeScript depth issues
          const filterField = section.filter_field;
          const result = await (supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available']) as any)
            .eq(filterField, true)
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        } else if (section.filter_type === 'tag' && section.filter_value) {
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available'])
            .contains('tags', [section.filter_value])
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        } else if (section.filter_type === 'property_type' && section.filter_value) {
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available'])
            .eq('property_type', section.filter_value)
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        } else if (section.filter_type === 'city' && section.filter_value) {
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available'])
            .ilike('city', `%${section.filter_value}%`)
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        } else if (section.filter_type === 'purpose' && section.filter_value) {
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available'])
            .eq('purpose', section.filter_value)
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        } else {
          // Default query without specific filter
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('tenant_id', effectiveTenantId)
            .in('status', ['active', 'ativo', 'available'])
            .order('created_at', { ascending: false })
            .limit(section.max_items || 8);
          data = result.data;
          error = result.error;
        }

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

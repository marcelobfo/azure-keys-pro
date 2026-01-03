import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantContext } from '@/contexts/TenantContext';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';

export interface PropertyTag {
  id: string;
  tenant_id: string | null;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePropertyTags = () => {
  const { selectedTenantId } = useTenantContext();
  const { currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id || null;
  const { toast } = useToast();

  const [tags, setTags] = useState<PropertyTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = useCallback(async () => {
    if (!effectiveTenantId) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('property_tags')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTags((data as PropertyTag[]) || []);
    } catch (error) {
      console.error('Error fetching property tags:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const createTag = async (tagData: { name: string; color: string; description?: string }) => {
    if (!effectiveTenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não identificado.',
        variant: 'destructive',
      });
      return null;
    }

    const slug = generateSlug(tagData.name);

    try {
      const { data, error } = await supabase
        .from('property_tags')
        .insert({
          tenant_id: effectiveTenantId,
          name: tagData.name.trim(),
          slug,
          color: tagData.color,
          description: tagData.description || null,
          display_order: tags.length + 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Erro',
            description: 'Já existe uma tag com esse nome.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return null;
      }

      toast({
        title: 'Sucesso',
        description: 'Tag criada com sucesso!',
      });

      await fetchTags();
      return data as PropertyTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTag = async (id: string, updates: Partial<{ name: string; color: string; description: string }>) => {
    try {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.name) {
        updateData.slug = generateSlug(updates.name);
      }

      const { error } = await supabase
        .from('property_tags')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag atualizada!',
      });

      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a tag.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('property_tags')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tag removida!',
      });

      await fetchTags();
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tag.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    tags,
    loading,
    refetch: fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
};

// Hook para buscar tags com cores para exibição
export const usePropertyTagsDisplay = (propertyTags: string[]) => {
  const { tags: registeredTags, loading } = usePropertyTags();

  if (loading || !propertyTags || propertyTags.length === 0) {
    return [];
  }

  return propertyTags.map((tagSlug) => {
    const registered = registeredTags?.find(
      (t) => t.slug === tagSlug || t.name.toLowerCase() === tagSlug.toLowerCase()
    );
    return {
      text: registered?.name || tagSlug,
      color: registered?.color || '#6b7280',
    };
  });
};

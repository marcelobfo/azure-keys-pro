import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Hook para gerenciar favoritos com analytics tracking
 */
export const useFavorites = (onRequireAuth?: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
      } else {
        const favoriteIds = new Set(data?.map(item => item.property_id) || []);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar favoritos",
          variant: "destructive",
        });
      }
      return;
    }

    const isFavorited = favorites.has(propertyId);

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) {
          throw error;
        }

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
        
        // Track analytics
        trackEvent('favorite_removed', { property_id: propertyId });
        
        toast({
          title: "Removido dos favoritos",
          description: "Imóvel removido da sua lista de favoritos",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });

        if (error) {
          throw error;
        }

        setFavorites(prev => new Set(prev).add(propertyId));
        
        // Track analytics
        trackEvent('favorite_added', { property_id: propertyId });
        
        toast({
          title: "Adicionado aos favoritos",
          description: "Imóvel adicionado à sua lista de favoritos",
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar favorito: " + error.message,
        variant: "destructive",
      });
    }
  };

  const isFavorite = (propertyId: string) => favorites.has(propertyId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'user' | 'corretor' | 'admin' | 'master';
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  website: string | null;
  social_links: any;
  notification_preferences: {
    email: boolean;
    push: boolean;
    property_alerts: boolean;
  };
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      const typedProfile: UserProfile = {
        ...data,
        role: data.role as UserProfile['role'],
        tenant_id: (data as any).tenant_id || null,
        notification_preferences: typeof data.notification_preferences === 'object' && data.notification_preferences !== null
          ? data.notification_preferences as UserProfile['notification_preferences']
          : { email: true, push: true, property_alerts: true }
      };
      setProfile(typedProfile);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    // Filter out properties that don't exist in the database schema
    const dbUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
      bio: updates.bio,
      company: updates.company,
      website: updates.website,
      notification_preferences: updates.notification_preferences,
      avatar_url: updates.avatar_url,
      social_links: updates.social_links
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } else {
      const typedProfile: UserProfile = {
        ...data,
        role: data.role as UserProfile['role'],
        tenant_id: (data as any).tenant_id || null,
        notification_preferences: typeof data.notification_preferences === 'object' && data.notification_preferences !== null
          ? data.notification_preferences as UserProfile['notification_preferences']
          : { email: true, push: true, property_alerts: true }
      };
      setProfile(typedProfile);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
      return { data: typedProfile };
    }
  };

  const hasRole = (requiredRole: 'user' | 'corretor' | 'admin' | 'master') => {
    if (!profile) return false;
    
    const roleHierarchy = { user: 0, corretor: 1, admin: 2, master: 3 };
    return roleHierarchy[profile.role] >= roleHierarchy[requiredRole];
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
    hasRole,
  };
};

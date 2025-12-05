import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'user' | 'corretor' | 'admin' | 'super_admin';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  tenant_id: string | null;
  created_at: string;
}

export const useRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
      } else {
        setRoles(data as UserRole[] || []);
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleNames = roles.map(r => r.role);
  
  const isSuperAdmin = roleNames.includes('super_admin');
  const isAdmin = roleNames.includes('admin') || isSuperAdmin;
  const isCorretor = roleNames.includes('corretor') || isAdmin;
  const isUser = roleNames.includes('user') || isCorretor;

  const hasRole = (role: AppRole): boolean => {
    if (isSuperAdmin) return true; // Super admin has all roles
    return roleNames.includes(role);
  };

  const hasAnyRole = (requiredRoles: AppRole[]): boolean => {
    if (isSuperAdmin) return true;
    return requiredRoles.some(role => roleNames.includes(role));
  };

  const getHighestRole = (): AppRole => {
    if (isSuperAdmin) return 'super_admin';
    if (roleNames.includes('admin')) return 'admin';
    if (roleNames.includes('corretor')) return 'corretor';
    return 'user';
  };

  return {
    roles,
    roleNames,
    loading,
    isSuperAdmin,
    isAdmin,
    isCorretor,
    isUser,
    hasRole,
    hasAnyRole,
    getHighestRole,
    refetch: fetchUserRoles,
  };
};

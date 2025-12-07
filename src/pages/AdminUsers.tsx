import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/hooks/useTenant';
import { Navigate } from 'react-router-dom';
import { AddUserDialog, DeleteUserDialog } from '@/components/UserManagementActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserStatsCards from '@/components/UserStatsCards';
import UserFilters from '@/components/UserFilters';
import UserRow from '@/components/UserRow';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'corretor' | 'admin';
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  created_at: string;
  status: string;
  tenant_id?: string;
  tenant_name?: string;
}

const AdminUsers = () => {
  const { profile, loading, hasRole } = useProfile();
  const { isSuperAdmin } = useRoles();
  const { selectedTenantId, isGlobalView, allTenants } = useTenant();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [selectedTenantId, isGlobalView]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Se super admin selecionou um tenant específico, filtrar por ele
      if (isSuperAdmin && selectedTenantId && !isGlobalView) {
        query = query.eq('tenant_id', selectedTenantId);
      } else if (!isSuperAdmin && profile?.tenant_id) {
        // Admin normal só vê usuários do seu tenant
        query = query.eq('tenant_id', profile.tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear nomes dos tenants
      const tenantMap = new Map(allTenants.map(t => [t.id, t.name]));

      const formattedUsers: User[] = data?.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || 'Nome não informado',
        email: user.email || 'Email não informado',
        role: (user.role ?? 'user') as 'user' | 'corretor' | 'admin',
        phone: user.phone,
        company: user.company,
        bio: user.bio,
        website: user.website,
        created_at: user.created_at,
        status: 'active',
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_id ? tenantMap.get(user.tenant_id) || 'Desconhecido' : 'Sem tenant',
      })) || [];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleRoleChange = async (user: User, value: 'user' | 'corretor' | 'admin') => {
    setUpdatingUserId(user.id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: value })
      .eq('id', user.id);
    if (!error) {
      toast({
        title: "Role do usuário atualizada!",
        description: "A função do usuário foi alterada com sucesso.",
      });
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, role: value } : u
        )
      );
    } else {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    }
    setUpdatingUserId(null);
  };

  if (loading || usersLoading) {
    return (
      <DashboardLayout title="Gerenciar Usuários" userRole="admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Mostrar coluna de tenant apenas se super admin está em visão global
  const showTenantColumn = isSuperAdmin && isGlobalView;

  return (
    <DashboardLayout title="Gerenciar Usuários" userRole="admin">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />
          <AddUserDialog onUserAdded={handleUserAdded} />
        </div>

        {/* Stats Cards */}
        <UserStatsCards users={users} />

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Lista de Usuários
              {isSuperAdmin && !isGlobalView && selectedTenantId && (
                <Badge variant="outline" className="ml-2">
                  {allTenants.find(t => t.id === selectedTenantId)?.name}
                </Badge>
              )}
              {isSuperAdmin && isGlobalView && (
                <Badge variant="secondary" className="ml-2">Todos os Tenants</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Email</th>
                    {showTenantColumn && <th className="text-left p-4">Tenant</th>}
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Telefone</th>
                    <th className="text-left p-4">Data de Cadastro</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                   {filteredUsers.map((user) => (
                     <UserRow
                       key={user.id}
                       user={user}
                       updatingUserId={updatingUserId}
                       onRoleChange={handleRoleChange}
                       onUserUpdated={handleUserUpdated}
                       onUserDeleted={handleUserDeleted}
                       showTenantColumn={showTenantColumn}
                     />
                   ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
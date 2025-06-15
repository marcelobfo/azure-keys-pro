import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { Search, Edit, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddUserDialog, DeleteUserDialog } from '@/components/UserManagementActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserStatsCards from '@/components/UserStatsCards';
import UserFilters from '@/components/UserFilters';
import UserRow from '@/components/UserRow';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'corretor' | 'admin';
  phone?: string;
  created_at: string;
}

const AdminUsers = () => {
  const { profile, loading } = useProfile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data?.map((user: any) => ({
        id: user.id,
        full_name: user.full_name || 'Nome não informado',
        email: user.email || 'Email não informado',
        role: (user.role ?? 'user') as 'user' | 'corretor' | 'admin',
        phone: user.phone,
        created_at: user.created_at,
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

  const handleUserDeleted = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Atualizar role do usuário
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Email</th>
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
                      onUserDeleted={handleUserDeleted}
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

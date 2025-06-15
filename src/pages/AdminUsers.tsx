
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { Search, Edit, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddUserDialog, DeleteUserDialog } from '@/components/UserManagementActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  created_at: string;
  status: string;
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

      if (error) {
        throw error;
      }

      const formattedUsers: User[] = data?.map(user => ({
        id: user.id,
        full_name: user.full_name || 'Nome não informado',
        email: user.email || 'Email não informado',
        role: user.role || 'user',
        phone: user.phone,
        created_at: user.created_at,
        status: user.status || 'ativo',
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

  // Atualizar status do usuário
  const handleToggleStatus = async (user: User) => {
    setUpdatingUserId(user.id);
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', user.id);

    if (!error) {
      toast({
        title: `Usuário ${newStatus === "ativo" ? "ativado" : "desativado"}!`,
        description: `Status do usuário atualizado com sucesso.`,
      });
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
    } else {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
    setUpdatingUserId(null);
  };

  const handleRoleChange = async (user: User, value: string) => {
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'corretor': return 'Corretor';
      default: return 'Usuário';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'corretor': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

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
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="corretor">Corretor</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AddUserDialog onUserAdded={handleUserAdded} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total de Usuários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Administradores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'corretor').length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Corretores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Usuários</p>
            </CardContent>
          </Card>
        </div>

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
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Data de Cadastro</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                        </div>
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user, value)}
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="corretor">Corretor</SelectItem>
                            <SelectItem value="user">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">{user.phone || '-'}</td>
                      <td className="p-4">
                        <Switch
                          checked={user.status === 'ativo'}
                          onCheckedChange={() => handleToggleStatus(user)}
                          disabled={updatingUserId === user.id}
                        />
                        <span className={`ml-2 text-xs font-medium rounded px-2 py-0.5 ${
                          user.status === 'ativo' ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DeleteUserDialog 
                            userId={user.id}
                            userName={user.full_name}
                            onUserDeleted={handleUserDeleted}
                          />
                        </div>
                      </td>
                    </tr>
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

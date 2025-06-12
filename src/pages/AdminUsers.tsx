
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import { Search, UserPlus, Edit, Trash2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminUsers = () => {
  const { profile, loading } = useProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data - você pode conectar com dados reais depois
  const [users] = useState([
    {
      id: '1',
      full_name: 'João Silva',
      email: 'joao@email.com',
      role: 'corretor',
      phone: '(47) 99999-9999',
      created_at: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      full_name: 'Maria Santos',
      email: 'maria@email.com',
      role: 'user',
      phone: '(47) 88888-8888',
      created_at: '2024-01-20',
      status: 'active'
    },
    {
      id: '3',
      full_name: 'Admin User',
      email: 'admin@email.com',
      role: 'admin',
      phone: '(47) 77777-7777',
      created_at: '2024-01-01',
      status: 'active'
    }
  ]);

  if (loading) {
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
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
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
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="p-4">{user.phone || '-'}</td>
                      <td className="p-4">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EditUserDialog from './EditUserDialog';
import { useRoles } from '@/hooks/useRoles';
import { useTenant } from '@/hooks/useTenant';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  bio?: string;
  website?: string;
  created_at: string;
  status: string;
}

interface UserManagementActionsProps {
  onUserAdded: () => void;
  onUserUpdated: () => void;
  onUserDeleted: (userId: string) => void;
  user?: User;
}

type UserRole = 'user' | 'corretor' | 'admin' | 'master';

export const AddUserDialog: React.FC<{ onUserAdded: () => void }> = ({ onUserAdded }) => {
  const { toast } = useToast();
  const { isSuperAdmin } = useRoles();
  const { allTenants, selectedTenantId } = useTenant();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserRole,
    phone: '',
    tenant_id: ''
  });

  // Quando abrir o dialog, pré-selecionar o tenant atual se houver
  useEffect(() => {
    if (open && selectedTenantId && !formData.tenant_id) {
      setFormData(prev => ({ ...prev, tenant_id: selectedTenantId }));
    }
  }, [open, selectedTenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar que super admin selecionou um tenant
      if (isSuperAdmin && !formData.tenant_id) {
        throw new Error('Selecione uma imobiliária para o usuário');
      }

      const payload: any = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role, // role para profiles.role (user_role enum)
        phone: formData.phone || null,
        force_sync: true
      };

      // Adicionar tenant_id e app_role se super admin selecionou
      if (isSuperAdmin && formData.tenant_id) {
        payload.tenant_id = formData.tenant_id;
        // Mapear role para app_role (user_roles.role)
        const appRoleMap: Record<string, string> = {
          'user': 'user',
          'corretor': 'corretor', 
          'admin': 'admin',
          'master': 'admin' // master vai como admin no app_role
        };
        payload.app_role = appRoleMap[formData.role] || 'user';
      }

      const { data, error } = await supabase.functions.invoke('sync-user', {
        body: payload
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Erro na comunicação com o servidor');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao criar usuário');
      }

      const message = data.synced 
        ? 'Usuário sincronizado com sucesso.' 
        : 'Usuário criado com sucesso.';

      toast({
        title: data.synced ? "Usuário sincronizado!" : "Usuário criado!",
        description: message,
      });

      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user' as UserRole,
        phone: '',
        tenant_id: ''
      });
      setOpen(false);
      onUserAdded();

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as UserRole }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tenant - apenas para super admin */}
          {isSuperAdmin && (
            <div>
              <Label htmlFor="tenant_id">Imobiliária *</Label>
              <Select 
                value={formData.tenant_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tenant_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {allTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="corretor">Corretor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                {isSuperAdmin && (
                  <SelectItem value="master">Master (Acesso Total)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const UserActions: React.FC<{ user: User; onUserUpdated: () => void; onUserDeleted: (userId: string) => void }> = ({ 
  user, 
  onUserUpdated, 
  onUserDeleted 
}) => {
  return (
    <div className="flex space-x-2">
      <EditUserDialog user={user} onUserUpdated={onUserUpdated} />
      <DeleteUserDialog 
        userId={user.id} 
        userName={user.full_name || user.email} 
        onUserDeleted={onUserDeleted} 
      />
    </div>
  );
};

export const DeleteUserDialog: React.FC<{ userId: string; userName: string; onUserDeleted: (userId: string) => void }> = ({ userId, userName, onUserDeleted }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Usuário excluído!",
        description: "Usuário foi excluído com sucesso.",
      });

      onUserDeleted(userId);

    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: `Erro ao excluir usuário: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário "{userName}"? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
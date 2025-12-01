
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EditUserDialog from './EditUserDialog';

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserRole,
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the create-user edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Erro na comunicação com o servidor');
      }

      if (!data.success) {
        // Handle specific error cases
        if (data.code === 'email_exists') {
          throw new Error('Este email já está cadastrado no sistema. Tente com outro email.');
        }
        throw new Error(data.error || 'Erro desconhecido');
      }

      toast({
        title: "Usuário criado!",
        description: "Usuário foi criado com sucesso.",
      });

      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user' as UserRole,
        phone: ''
      });
      setOpen(false);
      onUserAdded();

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      let errorMessage = error.message || 'Erro desconhecido';
      
      // Handle different error types
      if (error.message?.includes('already been registered') || 
          error.message?.includes('email já está cadastrado')) {
        errorMessage = 'Este email já está cadastrado no sistema. Tente com outro email.';
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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
                <SelectItem value="master">Master (Acesso Total)</SelectItem>
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
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

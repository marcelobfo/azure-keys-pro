import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';

interface AddTenantUserDialogProps {
  tenantId: string;
  tenantName: string;
  onUserAdded: () => void;
}

const AddTenantUserDialog: React.FC<AddTenantUserDialogProps> = ({
  tenantId,
  tenantName,
  onUserAdded,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    app_role: 'user' as 'user' | 'corretor' | 'admin',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.full_name) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Email, senha e nome são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.app_role, // role in profiles table
          tenant_id: tenantId,
          app_role: formData.app_role, // role in user_roles table
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      toast({
        title: 'Usuário criado com sucesso!',
        description: `${formData.full_name} foi adicionado a ${tenantName}`,
      });

      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        app_role: 'user',
      });
      setOpen(false);
      onUserAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = {
    user: 'Usuário',
    corretor: 'Corretor',
    admin: 'Administrador',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Usuário - {tenantName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Nome do usuário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_role">Função *</Label>
            <Select
              value={formData.app_role}
              onValueChange={(value: 'user' | 'corretor' | 'admin') =>
                setFormData({ ...formData, app_role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{roleLabels.user}</SelectItem>
                <SelectItem value="corretor">{roleLabels.corretor}</SelectItem>
                <SelectItem value="admin">{roleLabels.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTenantUserDialog;

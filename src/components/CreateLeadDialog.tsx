import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useTenantContext } from '@/contexts/TenantContext';
import { useTenant } from '@/hooks/useTenant';
interface Property {
  id: string;
  title: string;
}

interface Corretor {
  id: string;
  full_name: string;
}

interface CreateLeadDialogProps {
  onLeadCreated: () => void;
}

const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({ onLeadCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const { profile } = useProfile();
  const { selectedTenantId } = useTenantContext();
  const { currentTenant } = useTenant();
  const effectiveTenantId = selectedTenantId || currentTenant?.id;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    property_id: '',
    status: 'new',
    assigned_to: ''
  });

  const isAdminOrMaster = profile?.role === 'admin' || profile?.role === 'master';

  useEffect(() => {
    const fetchData = async () => {
      // Buscar propriedades
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('id, title')
        .eq('status', 'active')
        .order('title');
      
      if (propertiesData) {
        setProperties(propertiesData);
      }

      // Buscar corretores (apenas para admin/master)
      if (isAdminOrMaster) {
        const { data: corretoresData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['corretor', 'admin'])
          .order('full_name');
        
        if (corretoresData) {
          setCorretores(corretoresData);
        }
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, isAdminOrMaster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase() || null,
          phone: formData.phone.trim() || null,
          message: formData.message.trim() || null,
          property_id: formData.property_id === 'none' || !formData.property_id ? null : formData.property_id,
          status: formData.status,
          assigned_to: formData.assigned_to === 'none' || !formData.assigned_to ? null : formData.assigned_to,
          tenant_id: effectiveTenantId || null
        });

      if (error) throw error;

      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        property_id: '',
        status: 'new',
        assigned_to: ''
      });
      setOpen(false);
      onLeadCreated();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do lead"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property">Imóvel de Interesse</Label>
            <Select
              value={formData.property_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, property_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um imóvel (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdminOrMaster && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Corretor Responsável</Label>
              <Select
                value={formData.assigned_to || 'none'}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {corretores.map((corretor) => (
                    <SelectItem key={corretor.id} value={corretor.id}>
                      {corretor.full_name || 'Sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadDialog;

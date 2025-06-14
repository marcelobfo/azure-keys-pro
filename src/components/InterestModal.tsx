
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

interface InterestModalProps {
  propertyId: string;
  propertyTitle: string;
}

const InterestModal: React.FC<InterestModalProps> = ({ propertyId, propertyTitle }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim() || null,
        property_id: propertyId,
        status: 'new'
      };

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Interesse enviado!",
        description: "Entraremos em contato em breve.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setOpen(false);

    } catch (error: any) {
      console.error('Erro ao enviar interesse:', error);
      toast({
        title: "Erro",
        description: `Erro ao enviar interesse: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageCircle className="w-4 h-4 mr-1" />
          Interesse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demonstrar Interesse</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {propertyTitle}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modal-name">Nome Completo *</Label>
            <Input
              id="modal-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="modal-email">E-mail *</Label>
            <Input
              id="modal-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="modal-phone">Telefone</Label>
            <Input
              id="modal-phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <Label htmlFor="modal-message">Mensagem</Label>
            <Textarea
              id="modal-message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Gostaria de mais informações sobre este imóvel..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Interesse'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InterestModal;

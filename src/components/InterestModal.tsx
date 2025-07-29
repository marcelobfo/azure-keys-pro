
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

interface InterestModalProps {
  propertyId: string;
  propertyTitle: string;
}

const InterestModal: React.FC<InterestModalProps> = ({ propertyId, propertyTitle }) => {
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
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
    
    // Validação frontend
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast({
        title: "Erro de validação",
        description: "Nome deve ter pelo menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      toast({
        title: "Erro de validação",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim() || null,
        property_id: propertyId,
        status: 'new'
      };

      // Usar edge function para bypasser RLS
      const { data, error } = await supabase.functions.invoke('insert-lead', {
        body: leadData
      });

      if (error) {
        throw error;
      }

      // Track analytics
      trackEvent('lead_created', {
        property_id: propertyId,
        property_title: propertyTitle,
        lead_id: data?.data?.id
      });

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
      
      let errorMessage = "Erro interno do servidor. Tente novamente.";
      if (error.message.includes('Email inválido')) {
        errorMessage = "Por favor, verifique o formato do seu email.";
      } else if (error.message.includes('Nome deve ter pelo menos')) {
        errorMessage = "Nome deve ter pelo menos 2 caracteres.";
      }
      
      toast({
        title: "Erro ao enviar interesse",
        description: errorMessage,
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
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl">
          <MessageCircle className="w-4 h-4 mr-2" />
          Demonstrar Interesse
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

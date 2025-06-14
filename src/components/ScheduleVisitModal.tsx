
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

interface ScheduleVisitModalProps {
  propertyId: string;
  propertyTitle: string;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ propertyId, propertyTitle }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    visit_date: '',
    visit_time: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim() || !formData.client_email.trim() || !formData.visit_date || !formData.visit_time) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, email, data e horário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const visitData = {
        property_id: propertyId,
        client_name: formData.client_name.trim(),
        client_email: formData.client_email.trim(),
        client_phone: formData.client_phone.trim(),
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        notes: formData.notes.trim() || null,
        status: 'scheduled'
      };

      const { data, error } = await supabase
        .from('visits')
        .insert([visitData])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Visita agendada!",
        description: "Visita agendada com sucesso!",
      });

      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        visit_date: '',
        visit_time: '',
        notes: ''
      });
      setOpen(false);

    } catch (error: any) {
      console.error('Erro ao agendar visita:', error);
      toast({
        title: "Erro",
        description: `Erro ao agendar visita: ${error.message}`,
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

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <Calendar className="w-4 h-4 mr-1" />
          Agendar Visita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Visita</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {propertyTitle}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client_name">Nome Completo *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleChange('client_name', e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="client_email">E-mail *</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => handleChange('client_email', e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="client_phone">Telefone *</Label>
            <Input
              id="client_phone"
              value={formData.client_phone}
              onChange={(e) => handleChange('client_phone', e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="visit_date">Data da Visita *</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => handleChange('visit_date', e.target.value)}
                min={today}
                required
              />
            </div>

            <div>
              <Label htmlFor="visit_time">Horário *</Label>
              <Input
                id="visit_time"
                type="time"
                value={formData.visit_time}
                onChange={(e) => handleChange('visit_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Alguma preferência de horário ou observação..."
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
              {loading ? 'Agendando...' : 'Agendar Visita'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitModal;

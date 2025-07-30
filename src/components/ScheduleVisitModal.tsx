
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';
import { useVisitForm } from '@/hooks/useVisitForm';
import { validateVisitForm, createVisitData } from '@/utils/visitFormValidation';
import VisitForm from './VisitForm';

// Extend props to allow button/style customization
interface ScheduleVisitModalProps {
  propertyId: string;
  propertyTitle: string;
  buttonClassName?: string;
  iconClassName?: string;
  label?: string;
}

const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  propertyId,
  propertyTitle,
  buttonClassName,
  iconClassName,
  label = "Agendar Visita"
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { formData, handleChange, resetForm } = useVisitForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateVisitForm(formData);
    if (validationError) {
      toast({
        title: "Campos obrigatórios",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const visitData = createVisitData(formData, propertyId);

      // Usar edge function para bypasser RLS
      const { data, error } = await supabase.functions.invoke('insert-visit', {
        body: visitData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Visita agendada!",
        description: "Visita agendada com sucesso!",
      });

      resetForm();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={buttonClassName || "bg-green-600 hover:bg-green-700"}
        >
          <Calendar className={`w-4 h-4 mr-1 ${iconClassName || ""}`} />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Visita</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {propertyTitle}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <VisitForm 
            formData={formData}
            onFieldChange={handleChange}
            loading={loading}
          />
          <div className="flex justify-end space-x-2 mt-4">
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

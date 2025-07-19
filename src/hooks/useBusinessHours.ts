import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusinessHour {
  id: string;
  day_of_week: number; // 0=domingo, 6=sábado
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBusinessHours = () => {
  const { toast } = useToast();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBusinessTime, setIsBusinessTime] = useState(false);

  // Buscar horários comerciais  
  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      
      // Usar horários padrão para desenvolvimento
      const defaultHours: BusinessHour[] = [
        { id: '1', day_of_week: 1, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '', updated_at: '' },
        { id: '2', day_of_week: 2, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '', updated_at: '' },
        { id: '3', day_of_week: 3, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '', updated_at: '' },
        { id: '4', day_of_week: 4, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '', updated_at: '' },
        { id: '5', day_of_week: 5, start_time: '08:00', end_time: '18:00', is_active: true, created_at: '', updated_at: '' }
      ];
      
      setBusinessHours(defaultHours);
      checkBusinessHours(defaultHours);
    } catch (error) {
      console.error('Erro ao buscar horários comerciais:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar horários comerciais',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar se está em horário comercial
  const checkBusinessHours = (hours?: BusinessHour[]) => {
    const hoursToCheck = hours || businessHours;
    const now = new Date();
    const currentDay = now.getDay(); // 0=domingo, 6=sábado
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const todayHours = hoursToCheck.find(
      (h) => h.day_of_week === currentDay && h.is_active
    );

    if (!todayHours) {
      setIsBusinessTime(false);
      return false;
    }

    const isWithinHours = currentTime >= todayHours.start_time && 
                         currentTime <= todayHours.end_time;
    
    setIsBusinessTime(isWithinHours);
    return isWithinHours;
  };

  // Verificar horário comercial via função do banco
  const checkBusinessHoursFromDB = async () => {
    try {
      // Usar verificação local se não conseguir acessar a função
      const result = checkBusinessHours();
      setIsBusinessTime(result);
      return result;
    } catch (error) {
      console.error('Erro ao verificar horário comercial:', error);
      return false;
    }
  };

  // Atualizar horário comercial
  const updateBusinessHour = async (dayOfWeek: number, startTime: string, endTime: string, isActive: boolean) => {
    try {
      // Como não temos acesso direto à tabela, simular a atualização
      const updatedHours = businessHours.map(h => 
        h.day_of_week === dayOfWeek 
          ? { ...h, start_time: startTime, end_time: endTime, is_active: isActive }
          : h
      );
      
      // Se não existe, adicionar
      if (!businessHours.find(h => h.day_of_week === dayOfWeek)) {
        updatedHours.push({
          id: Date.now().toString(),
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_active: isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      setBusinessHours(updatedHours);
      checkBusinessHours(updatedHours);
      
      toast({
        title: 'Sucesso',
        description: 'Horário comercial atualizado localmente',
      });
    } catch (error) {
      console.error('Erro ao atualizar horário comercial:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar horário comercial',
        variant: 'destructive',
      });
    }
  };

  // Obter próximo horário comercial
  const getNextBusinessTime = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Procurar horário hoje primeiro
    const todayHours = businessHours.find(
      (h) => h.day_of_week === currentDay && h.is_active
    );

    if (todayHours && currentTime < todayHours.start_time) {
      return {
        day: currentDay,
        time: todayHours.start_time,
        isToday: true
      };
    }

    // Procurar próximo dia útil
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextDayHours = businessHours.find(
        (h) => h.day_of_week === nextDay && h.is_active
      );

      if (nextDayHours) {
        return {
          day: nextDay,
          time: nextDayHours.start_time,
          isToday: false
        };
      }
    }

    return null;
  };

  // Formatar dia da semana
  const formatDayOfWeek = (day: number) => {
    const days = [
      'Domingo', 'Segunda', 'Terça', 'Quarta', 
      'Quinta', 'Sexta', 'Sábado'
    ];
    return days[day];
  };

  useEffect(() => {
    fetchBusinessHours();

    // Verificar horário comercial a cada minuto
    const interval = setInterval(() => {
      checkBusinessHours();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    businessHours,
    loading,
    isBusinessTime,
    fetchBusinessHours,
    checkBusinessHours,
    checkBusinessHoursFromDB,
    updateBusinessHour,
    getNextBusinessTime,
    formatDayOfWeek,
  };
};